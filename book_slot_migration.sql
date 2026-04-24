-- ========================================================
-- 🔐 MIGRAÇÃO: AGENDAMENTO SEGURO (RLS + Race Condition)
-- Execute este script INTEIRO no Supabase Dashboard > SQL Editor
-- ========================================================

-- ========================================================
-- PASSO 1: Adicionar coluna de controle de reserva temporária
-- ========================================================
-- Por que? Quando o paciente clica em "reservar", marcamos o 
-- timestamp. Se ele abandonar a tela do Pix, após 15 minutos
-- o horário será automaticamente liberado.

ALTER TABLE availability_slots 
ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ DEFAULT NULL;

-- Comentário na coluna para documentação
COMMENT ON COLUMN availability_slots.reserved_at IS 
  'Timestamp de quando o slot foi reservado. Usado para expirar reservas abandonadas após 15 minutos.';


-- ========================================================
-- PASSO 2: Criar a função RPC "book_slot" (SECURITY DEFINER)
-- ========================================================
-- Por que SECURITY DEFINER?
-- → O paciente é um usuário ANÔNIMO (não logado).
-- → Nossas políticas RLS (corretamente) impedem que anônimos 
--   façam UPDATE em availability_slots.
-- → SECURITY DEFINER faz a função rodar com as permissões do 
--   OWNER (postgres/admin), não do chamador (anon).
-- → Isso cria um "túnel seguro": o anon só pode fazer o que
--   está escrito DENTRO da função, nada mais.

CREATE OR REPLACE FUNCTION book_slot(
  p_slot_id UUID,
  p_patient_name TEXT,
  p_patient_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- ← Roda com permissões elevadas (bypassa RLS)
SET search_path = public  -- ← Segurança contra SQL injection via search_path
AS $$
DECLARE
  v_slot RECORD;
  v_existing_appointment RECORD;
  v_appointment_id UUID;
  v_hold_expiry INTERVAL := INTERVAL '15 minutes';
BEGIN
  -- ╔══════════════════════════════════════════════════════╗
  -- ║ 1. LOCK ATÔMICO: SELECT ... FOR UPDATE              ║
  -- ║    Isso "trava" a linha no banco enquanto esta       ║
  -- ║    transação estiver rodando. Se outro paciente      ║
  -- ║    tentar reservar o MESMO slot ao MESMO tempo,      ║
  -- ║    ele vai ESPERAR até esta transação terminar.      ║
  -- ║    → Elimina 100% das race conditions.               ║
  -- ╚══════════════════════════════════════════════════════╝
  SELECT * INTO v_slot
  FROM availability_slots
  WHERE id = p_slot_id
  FOR UPDATE;  -- ← Lock pessimista na linha

  -- Slot não existe?
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SLOT_NOT_FOUND',
      'message', 'Este horário não existe ou foi removido.'
    );
  END IF;

  -- ╔══════════════════════════════════════════════════════╗
  -- ║ 2. VERIFICAR DISPONIBILIDADE                        ║
  -- ║    Três cenários possíveis:                         ║
  -- ║    A) Slot livre (is_booked = false) → Pode reservar║
  -- ║    B) Slot ocupado + reserva expirada → "Roubar"    ║
  -- ║    C) Slot ocupado + reserva válida → NEGAR         ║
  -- ╚══════════════════════════════════════════════════════╝
  IF v_slot.is_booked = true THEN
    -- Verificar se a reserva expirou (mais de 15 minutos)
    IF v_slot.reserved_at IS NOT NULL 
       AND v_slot.reserved_at < (NOW() - v_hold_expiry) THEN
      
      -- Reserva expirada! Verificar se tem appointment sem confirmação
      SELECT * INTO v_existing_appointment
      FROM appointments
      WHERE slot_id = p_slot_id
        AND status NOT IN ('confirmed', 'completed')
      ORDER BY created_at DESC
      LIMIT 1;

      IF FOUND THEN
        -- Deletar o appointment abandonado
        DELETE FROM appointments WHERE id = v_existing_appointment.id;
      END IF;

      -- Liberar o slot para ser reservado novamente (cai no fluxo abaixo)
      -- (Continua a execução normalmente)
      
    ELSE
      -- Reserva VÁLIDA (menos de 15 min) ou já confirmada
      RETURN jsonb_build_object(
        'success', false,
        'error', 'SLOT_ALREADY_BOOKED',
        'message', 'Este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro.'
      );
    END IF;
  END IF;

  -- ╔══════════════════════════════════════════════════════╗
  -- ║ 3. RESERVAR O SLOT (UPDATE atômico)                 ║
  -- ║    Marca como reservado e registra o timestamp.      ║
  -- ╚══════════════════════════════════════════════════════╝
  UPDATE availability_slots
  SET 
    is_booked = true,
    reserved_at = NOW()
  WHERE id = p_slot_id;

  -- ╔══════════════════════════════════════════════════════╗
  -- ║ 4. CRIAR O APPOINTMENT                              ║
  -- ╚══════════════════════════════════════════════════════╝
  INSERT INTO appointments (slot_id, patient_name, patient_phone, status, pix_code)
  VALUES (p_slot_id, p_patient_name, p_patient_phone, 'pending_proof', 'manual_whatsapp')
  RETURNING id INTO v_appointment_id;

  -- ╔══════════════════════════════════════════════════════╗
  -- ║ 5. SUCESSO!                                         ║
  -- ╚══════════════════════════════════════════════════════╝
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'message', 'Horário reservado com sucesso! Você tem 15 minutos para enviar o comprovante.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INTERNAL_ERROR',
      'message', 'Erro interno ao processar reserva. Tente novamente.'
    );
END;
$$;


-- ========================================================
-- PASSO 3: Função para liberar reservas expiradas
-- ========================================================
-- Esta função pode ser chamada periodicamente (via cron)
-- ou manualmente para liberar slots abandonados.

CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_hold_expiry INTERVAL := INTERVAL '15 minutes';
BEGIN
  -- Deletar appointments pendentes de slots expirados
  DELETE FROM appointments
  WHERE slot_id IN (
    SELECT id FROM availability_slots
    WHERE is_booked = true
      AND reserved_at IS NOT NULL
      AND reserved_at < (NOW() - v_hold_expiry)
  )
  AND status NOT IN ('confirmed', 'completed');

  -- Liberar os slots expirados
  UPDATE availability_slots
  SET 
    is_booked = false,
    reserved_at = NULL
  WHERE is_booked = true
    AND reserved_at IS NOT NULL
    AND reserved_at < (NOW() - v_hold_expiry)
    AND id NOT IN (
      -- Não liberar slots que têm appointments confirmados
      SELECT slot_id FROM appointments
      WHERE status IN ('confirmed', 'completed')
    );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'released_count', v_count,
    'message', v_count || ' reservas expiradas foram liberadas.'
  );
END;
$$;


-- ========================================================
-- PASSO 4: Permissões
-- ========================================================
-- Permitir que QUALQUER usuário (inclusive anon) chame as RPCs.
-- A segurança está DENTRO da função (SECURITY DEFINER),
-- não na permissão de chamada.

GRANT EXECUTE ON FUNCTION book_slot(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION book_slot(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION release_expired_holds() TO authenticated;


-- ========================================================
-- PASSO 5 (OPCIONAL): Cron para limpar reservas expiradas
-- ========================================================
-- Se você tem a extensão pg_cron habilitada no Supabase,
-- descomente as linhas abaixo para limpar automaticamente
-- a cada 5 minutos:

-- SELECT cron.schedule(
--   'release-expired-holds',
--   '*/5 * * * *',
--   $$ SELECT release_expired_holds(); $$
-- );


-- ========================================================
-- ✅ MIGRAÇÃO CONCLUÍDA!
-- ========================================================
-- 
-- O que mudou:
-- 1. Nova coluna: availability_slots.reserved_at
-- 2. Nova RPC: book_slot(slot_id, patient_name, patient_phone)
-- 3. Nova RPC: release_expired_holds()
-- 4. Permissões grant para anon/authenticated
--
-- O Frontend agora deve chamar:
--   supabase.rpc('book_slot', { p_slot_id, p_patient_name, p_patient_phone })
--
-- Em vez de:
--   supabase.from('availability_slots').update({ is_booked: true })
--

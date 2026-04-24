-- ========================================
-- POLÍTICAS DE SEGURANÇA (RLS) - AgendaGarantida
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- IMPORTANTE: Execute este script completo no Supabase Dashboard > SQL Editor
-- Isso vai configurar todas as permissões necessárias para o sistema funcionar

-- ========================================
-- PASSO 1: REMOVER POLÍTICAS ANTIGAS
-- ========================================

DROP POLICY IF EXISTS "Users can insert own profile on signup" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own slots" ON availability_slots;
DROP POLICY IF EXISTS "Users can update own slots" ON availability_slots;
DROP POLICY IF EXISTS "Users can delete own slots" ON availability_slots;
DROP POLICY IF EXISTS "Anyone can view available slots" ON availability_slots;
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;

-- ========================================
-- PASSO 2: CRIAR POLÍTICAS PARA PROFILES
-- ========================================

-- Permitir que usuários criem seu próprio perfil durante o cadastro
CREATE POLICY "Users can insert own profile on signup"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Permitir que qualquer pessoa veja perfis públicos (necessário para /agendamento/:slug)
CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);

-- Permitir que usuários atualizem apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- ========================================
-- PASSO 3: CRIAR POLÍTICAS PARA AVAILABILITY_SLOTS
-- ========================================

-- Permitir que usuários criem seus próprios horários
CREATE POLICY "Users can insert own slots"
ON availability_slots FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem seus próprios horários
CREATE POLICY "Users can update own slots"
ON availability_slots FOR UPDATE
USING (auth.uid() = user_id);

-- Permitir que usuários deletem seus próprios horários
CREATE POLICY "Users can delete own slots"
ON availability_slots FOR DELETE
USING (auth.uid() = user_id);

-- Permitir que qualquer pessoa veja horários disponíveis (para agendamento público)
CREATE POLICY "Anyone can view available slots"
ON availability_slots FOR SELECT
USING (true);

-- ========================================
-- PASSO 4: CRIAR POLÍTICAS PARA APPOINTMENTS
-- ========================================

-- Permitir que qualquer pessoa (anônima) crie agendamentos
CREATE POLICY "Anyone can create appointments"
ON appointments FOR INSERT
WITH CHECK (true);

-- Permitir que usuários vejam agendamentos dos seus próprios horários
CREATE POLICY "Users can view own appointments"
ON appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM availability_slots
    WHERE availability_slots.id = appointments.slot_id
    AND availability_slots.user_id = auth.uid()
  )
);

-- ========================================
-- PASSO 5: ATIVAR RLS NAS TABELAS
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CONCLUÍDO! 
-- ========================================
-- Agora você pode:
-- 1. Cadastrar novos usuários em /register
-- 2. Criar horários no dashboard
-- 3. Permitir agendamentos públicos em /agendamento/:slug

-- ========================================
-- ⚠️ IMPORTANTE: AGENDAMENTO SEGURO
-- ========================================
-- Para o agendamento público funcionar corretamente COM as
-- políticas RLS acima, é necessário executar TAMBÉM o script:
--
--   📄 book_slot_migration.sql
--
-- Este script cria a função RPC "book_slot" que permite que
-- usuários anônimos façam agendamentos de forma SEGURA, sem
-- precisar de permissão direta de UPDATE na tabela de slots.
--
-- A função usa SECURITY DEFINER para bypassar RLS de forma
-- controlada, com lock atômico para evitar race conditions
-- e reserva temporária de 15 minutos.

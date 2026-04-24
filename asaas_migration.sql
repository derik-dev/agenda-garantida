-- ====================================================
-- MIGRAÇÃO: Integração Asaas Payment API (BYOK)
-- ====================================================
-- Este script adiciona as colunas necessárias para suportar
-- a integração com a API do Asaas no modelo "Bring Your Own Key"
-- ====================================================

-- 1. ADICIONAR ASAAS API KEY NA TABELA PROFILES
-- A psicóloga insere sua própria chave de API do Asaas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS asaas_api_key TEXT;

-- 2. ADICIONAR CAMPOS DE PAGAMENTO NA TABELA APPOINTMENTS
-- Rastrear o ID do pagamento no Asaas e o status do pagamento
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- 3. ATUALIZAR POLÍTICAS RLS PARA SEGURANÇA DA API KEY
-- A API Key é sensível e deve ser acessível apenas ao dono do perfil

-- 3.1. Habilitar RLS na tabela profiles (se ainda não estiver habilitado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3.2. Remover políticas antigas que podem conflitar (caso existam)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 3.3. Criar políticas RLS para profiles
-- LEITURA: Permitir leitura de todos os campos do próprio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- ATUALIZAÇÃO: Permitir update de todos os campos do próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- INSERÇÃO: Permitir que usuários criem seu próprio perfil
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ====================================================
-- NOTA IMPORTANTE SOBRE SEGURANÇA:
-- ====================================================
-- A asaas_api_key será guardada na tabela profiles e só poderá
-- ser lida/atualizada pelo próprio dono do perfil (via RLS).
-- 
-- As Edge Functions irão buscar esta chave usando o service_role
-- (que bypassa RLS), mas apenas para o perfil associado ao slot
-- que está sendo reservado.
--
-- NUNCA exponha a asaas_api_key no frontend ou em APIs públicas!
-- ====================================================

-- ====================================================
-- COMENTÁRIOS SOBRE OS CAMPOS:
-- ====================================================
-- profiles.asaas_api_key:
--   Chave de API do Asaas fornecida pela psicóloga
--   Exemplo: $aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNzI1Njk6OiRhYWNoXzNmNjc0MGY0LWJmZjAtNDMzYy04ZTk3LTAxODMzZjU4OTBkMw==
--
-- appointments.asaas_payment_id:
--   ID único do pagamento criado no Asaas
--   Exemplo: pay_1234567890abcdef
--
-- appointments.payment_status:
--   Status do pagamento: 'pending', 'paid', 'overdue', 'refunded'
--   Default: 'pending' (aguardando pagamento)
-- ====================================================

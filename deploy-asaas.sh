#!/bin/bash

# ====================================================
# SCRIPT DE DEPLOY: Edge Functions Asaas
# ====================================================
# Este script automatiza o deployment das Edge Functions
# e a execução da migration SQL no Supabase.
# ====================================================

echo "🚀 Iniciando deployment da integração Asaas..."

# 1. Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

# 2. Login no Supabase (caso não esteja autenticado)
echo "🔐 Verificando autenticação..."
supabase login

# 3. Link ao projeto (substitua PROJECT_ID pelo ID real do seu projeto)
echo "🔗 Conectando ao projeto Supabase..."
# Descomente e ajuste a linha abaixo com o ID do seu projeto:
# supabase link --project-ref YOUR_PROJECT_ID

# 4. Deploy das Edge Functions
echo "📦 Fazendo deploy da Edge Function: create-asaas-pix..."
supabase functions deploy create-asaas-pix --no-verify-jwt

echo "📦 Fazendo deploy da Edge Function: asaas-webhook..."
supabase functions deploy asaas-webhook --no-verify-jwt

# 5. Executar migration SQL
echo "🗄️  Aplicando migrations no banco de dados..."
supabase db push

# 6. Verificar status
echo "✅ Verificando status das funções..."
supabase functions list

echo ""
echo "======================================================"
echo "✅ DEPLOYMENT CONCLUÍDO!"
echo "======================================================"
echo ""
echo "Próximos passos:"
echo "1. Execute a migration SQL no Supabase Dashboard (SQL Editor)"
echo "2. Configure o webhook no painel do Asaas:"
echo "   URL: https://[PROJECT_REF].supabase.co/functions/v1/asaas-webhook"
echo "   Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED"
echo "3. Teste o fluxo completo com uma API Key de sandbox"
echo ""
echo "======================================================"

# ====================================================
# SCRIPT DE DEPLOY: Edge Functions Asaas (Windows)
# ====================================================
# Este script automatiza o deployment das Edge Functions
# e a execução da migration SQL no Supabase.
# Execute com PowerShell
# ====================================================

Write-Host "🚀 Iniciando deployment da integração Asaas..." -ForegroundColor Cyan

# 1. Verificar se o Supabase CLI está instalado
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g supabase
}

# 2. Login no Supabase (caso não esteja autenticado)
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Cyan
supabase login

# 3. Link ao projeto (substitua PROJECT_ID pelo ID real do seu projeto)
Write-Host "🔗 Conectando ao projeto Supabase..." -ForegroundColor Cyan
# Descomente e ajuste a linha abaixo com o ID do seu projeto:
# supabase link --project-ref YOUR_PROJECT_ID

# 4. Deploy das Edge Functions
Write-Host "📦 Fazendo deploy da Edge Function: create-asaas-pix..." -ForegroundColor Cyan
supabase functions deploy create-asaas-pix --no-verify-jwt

Write-Host "📦 Fazendo deploy da Edge Function: asaas-webhook..." -ForegroundColor Cyan
supabase functions deploy asaas-webhook --no-verify-jwt

# 5. Executar migration SQL
Write-Host "🗄️  Aplicando migrations no banco de dados..." -ForegroundColor Cyan
supabase db push

# 6. Verificar status
Write-Host "✅ Verificando status das funções..." -ForegroundColor Cyan
supabase functions list

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT CONCLUÍDO!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Execute a migration SQL no Supabase Dashboard (SQL Editor)"
Write-Host "2. Configure o webhook no painel do Asaas:"
Write-Host "   URL: https://[PROJECT_REF].supabase.co/functions/v1/asaas-webhook"
Write-Host "   Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED"
Write-Host "3. Teste o fluxo completo com uma API Key de sandbox"
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green

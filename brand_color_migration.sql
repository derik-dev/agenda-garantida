-- ========================================================
-- 🎨 MIGRAÇÃO: PERSONALIZAÇÃO DE MARCA (White-Label)
-- Execute no Supabase Dashboard > SQL Editor
-- ========================================================

-- Adiciona coluna brand_color na tabela profiles.
-- A cor padrão é '#4f46e5' (Indigo-600 do Tailwind).
-- Cada profissional pode escolher sua cor personalizada,
-- que será aplicada na página pública de agendamento.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#4f46e5';

COMMENT ON COLUMN profiles.brand_color IS
  'Cor principal da marca (hex). Usada na página pública de agendamento para personalizar botões, ícones e destaques.';

-- ✅ Pronto! Agora o frontend lê profile.brand_color.

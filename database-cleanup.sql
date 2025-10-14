-- Script SQL para remover funcionalidades de histórico e evolução do Reditto MVP
-- Execute este script no SQL Editor do Supabase para limpar o banco de dados

-- 1. Remover triggers primeiro
DROP TRIGGER IF EXISTS trigger_insert_essay_score ON essays;

-- 2. Remover funções SQL relacionadas ao histórico
DROP FUNCTION IF EXISTS insert_essay_score();
DROP FUNCTION IF EXISTS get_user_stats(UUID);
DROP FUNCTION IF EXISTS get_chart_data(UUID);

-- 3. Remover políticas RLS das tabelas
DROP POLICY IF EXISTS "Users can view their own essay scores" ON essay_scores;
DROP POLICY IF EXISTS "Users can insert their own essay scores" ON essay_scores;
DROP POLICY IF EXISTS "Users can update their own essay scores" ON essay_scores;
DROP POLICY IF EXISTS "Users can delete their own essay scores" ON essay_scores;

DROP POLICY IF EXISTS "Users can view their own essays" ON essays;
DROP POLICY IF EXISTS "Users can insert their own essays" ON essays;
DROP POLICY IF EXISTS "Users can update their own essays" ON essays;
DROP POLICY IF EXISTS "Users can delete their own essays" ON essays;

-- 4. Remover índices
DROP INDEX IF EXISTS idx_essay_scores_user_id;
DROP INDEX IF EXISTS idx_essay_scores_created_at;
DROP INDEX IF EXISTS idx_essays_user_id;
DROP INDEX IF EXISTS idx_essays_created_at;

-- 5. Remover tabelas (cuidado: isso apagará todos os dados!)
DROP TABLE IF EXISTS essay_scores CASCADE;
DROP TABLE IF EXISTS essays CASCADE;

-- 6. Verificar limpeza
SELECT 'Limpeza concluída - tabelas de histórico removidas' as status;

-- NOTA: Este script remove completamente as funcionalidades de histórico.
-- Para o MVP do Reditto, apenas as funcionalidades core serão mantidas:
-- - Sistema de autenticação (preparado para futuro roadmap)
-- - Correção de redações
-- - OCR de imagens
-- - Interface de resultados

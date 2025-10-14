-- Script SQL para configurar o banco de dados do Reditto
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de redações
CREATE TABLE IF NOT EXISTS essays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT,
  essay_text TEXT NOT NULL,
  final_score INTEGER NOT NULL CHECK (final_score >= 0 AND final_score <= 1000),
  competencies JSONB NOT NULL,
  feedback JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de pontuações para gráficos
CREATE TABLE IF NOT EXISTS essay_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_essays_user_id ON essays(user_id);
CREATE INDEX IF NOT EXISTS idx_essays_created_at ON essays(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_essay_scores_user_id ON essay_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_essay_scores_created_at ON essay_scores(created_at ASC);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_scores ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para essays
CREATE POLICY "Users can view their own essays" ON essays
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own essays" ON essays
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own essays" ON essays
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own essays" ON essays
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Criar políticas RLS para essay_scores
CREATE POLICY "Users can view their own essay scores" ON essay_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own essay scores" ON essay_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own essay scores" ON essay_scores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own essay scores" ON essay_scores
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Criar função para inserir pontuação automaticamente
CREATE OR REPLACE FUNCTION insert_essay_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO essay_scores (essay_id, user_id, score)
  VALUES (NEW.id, NEW.user_id, NEW.final_score);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar trigger para inserir pontuação automaticamente
DROP TRIGGER IF EXISTS trigger_insert_essay_score ON essays;
CREATE TRIGGER trigger_insert_essay_score
  AFTER INSERT ON essays
  FOR EACH ROW
  EXECUTE FUNCTION insert_essay_score();

-- 9. Criar função para estatísticas do usuário
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_essays BIGINT,
  average_score NUMERIC,
  highest_score INTEGER,
  lowest_score INTEGER,
  improvement INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_essays,
    ROUND(AVG(final_score), 2) as average_score,
    MAX(final_score) as highest_score,
    MIN(final_score) as lowest_score,
    (MAX(final_score) - MIN(final_score)) as improvement
  FROM essays 
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar função para dados do gráfico
CREATE OR REPLACE FUNCTION get_chart_data(user_uuid UUID)
RETURNS TABLE (
  date TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  essay_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.created_at as date,
    es.score,
    es.essay_id
  FROM essay_scores es
  WHERE es.user_id = user_uuid
  ORDER BY es.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Comentários para documentação
COMMENT ON TABLE essays IS 'Tabela principal para armazenar redações dos usuários';
COMMENT ON TABLE essay_scores IS 'Tabela para armazenar pontuações individuais para gráficos de evolução';
COMMENT ON FUNCTION get_user_stats IS 'Função para obter estatísticas do usuário';
COMMENT ON FUNCTION get_chart_data IS 'Função para obter dados para gráfico de evolução';

-- 12. Verificar se tudo foi criado corretamente
SELECT 
  'essays' as table_name,
  COUNT(*) as row_count
FROM essays
UNION ALL
SELECT 
  'essay_scores' as table_name,
  COUNT(*) as row_count
FROM essay_scores;

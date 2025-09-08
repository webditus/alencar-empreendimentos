-- Script para adicionar colunas is_active nas tabelas categories e items
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna is_active na tabela categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Adicionar coluna is_active na tabela items
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Atualizar registros existentes para serem ativos por padrão
UPDATE categories SET is_active = true WHERE is_active IS NULL;
UPDATE items SET is_active = true WHERE is_active IS NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_items_is_active ON items(is_active);

-- Comentários das colunas
COMMENT ON COLUMN categories.is_active IS 'Define se a categoria está ativa e visível na calculadora';
COMMENT ON COLUMN items.is_active IS 'Define se o item está ativo e visível na calculadora';

-- Verificar se as colunas foram adicionadas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('categories', 'items') 
  AND column_name = 'is_active'
ORDER BY table_name, column_name;

/*
  # Rename 'aluguel' to 'locacao' across all tables

  1. Data Changes
    - `categories`: Update all rows where `operation_type = 'aluguel'` to `'locacao'`
    - `items`: Update all rows where `operation_type = 'aluguel'` to `'locacao'`
    - `quotes`: Update all rows where `operation_type = 'aluguel'` to `'locacao'`

  2. Important Notes
    - This is a data-only migration, no schema changes
    - The application code has been updated to normalize 'aluguel' to 'locacao'
      on both reads and writes as a safety net
    - No data is deleted or lost; only the operation_type value is renamed
*/

UPDATE categories SET operation_type = 'locacao' WHERE operation_type = 'aluguel';
UPDATE items SET operation_type = 'locacao' WHERE operation_type = 'aluguel';
UPDATE quotes SET operation_type = 'locacao' WHERE operation_type = 'aluguel';

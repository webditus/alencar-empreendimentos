/*
  # Unify Categories and Items with Dual Pricing

  This migration merges the duplicated category/item rows (one per operation_type)
  into single unified rows with separate venda and locacao prices and visibility flags.

  1. New Columns on `items`
    - `venda_price` (numeric, nullable) - price for venda mode
    - `locacao_price` (numeric, nullable) - price for locacao mode
    - `show_venda` (boolean, NOT NULL, DEFAULT false) - visibility in venda mode
    - `show_locacao` (boolean, NOT NULL, DEFAULT false) - visibility in locacao mode
    - `display_order` (integer, NOT NULL, DEFAULT 0) - sort order within category

  2. New Columns on `categories`
    - `display_order` (integer, NOT NULL, DEFAULT 0) - sort order for display

  3. Data Migration
    - Populates venda_price/locacao_price from existing price column
    - Sets show_venda/show_locacao to true based on existing operation_type
    - Merges duplicate categories (same name, different operation_type)
    - Merges duplicate items (same name + category after reassignment)
    - Preserves image_path and image_url from both rows

  4. Cleanup
    - Drops legacy columns: items.price, items.operation_type, categories.operation_type

  5. Important Notes
    - venda_price and locacao_price remain nullable for items in only one mode
    - show_venda and show_locacao default to false (safe defaults for new rows)
    - Existing rows get correct true values based on their original operation_type
    - display_order assigned alphabetically per category/item name
*/

-- Step 1: Add new columns to items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'venda_price'
  ) THEN
    ALTER TABLE items ADD COLUMN venda_price numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'locacao_price'
  ) THEN
    ALTER TABLE items ADD COLUMN locacao_price numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'show_venda'
  ) THEN
    ALTER TABLE items ADD COLUMN show_venda boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'show_locacao'
  ) THEN
    ALTER TABLE items ADD COLUMN show_locacao boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE items ADD COLUMN display_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Step 2: Add display_order to categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE categories ADD COLUMN display_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Step 3: Populate prices from existing data
UPDATE items
SET venda_price = price, show_venda = true
WHERE operation_type = 'venda' AND venda_price IS NULL;

UPDATE items
SET locacao_price = price, show_locacao = true
WHERE operation_type = 'locacao' AND locacao_price IS NULL;

-- Step 4: Merge duplicate categories
-- For each pair sharing the same name, keep the venda row as survivor
-- Reassign items from the locacao category to the venda category
DO $$
DECLARE
  venda_cat RECORD;
  locacao_cat RECORD;
BEGIN
  FOR venda_cat IN
    SELECT id, name FROM categories WHERE operation_type = 'venda'
  LOOP
    SELECT id INTO locacao_cat
    FROM categories
    WHERE name = venda_cat.name AND operation_type = 'locacao';

    IF locacao_cat.id IS NOT NULL THEN
      -- Reassign locacao items to the venda category
      UPDATE items SET category_id = venda_cat.id
      WHERE category_id = locacao_cat.id;

      -- Delete the duplicate locacao category
      DELETE FROM categories WHERE id = locacao_cat.id;
    END IF;
  END LOOP;
END $$;

-- Step 5: Assign display_order to surviving categories alphabetically
DO $$
DECLARE
  cat RECORD;
  idx integer := 0;
BEGIN
  FOR cat IN
    SELECT id FROM categories ORDER BY name ASC
  LOOP
    UPDATE categories SET display_order = idx WHERE id = cat.id;
    idx := idx + 1;
  END LOOP;
END $$;

-- Step 6: Merge duplicate items (same name + same category_id)
-- Keep the venda row as survivor, absorb locacao data
DO $$
DECLARE
  venda_item RECORD;
  locacao_item RECORD;
BEGIN
  FOR venda_item IN
    SELECT id, name, category_id, image_path, image_url
    FROM items
    WHERE operation_type = 'venda'
  LOOP
    SELECT id, locacao_price, image_path, image_url INTO locacao_item
    FROM items
    WHERE name = venda_item.name
      AND category_id = venda_item.category_id
      AND operation_type = 'locacao';

    IF locacao_item.id IS NOT NULL THEN
      -- Absorb locacao price and visibility
      UPDATE items
      SET
        locacao_price = locacao_item.locacao_price,
        show_locacao = true,
        image_path = COALESCE(items.image_path, locacao_item.image_path),
        image_url = COALESCE(items.image_url, locacao_item.image_url)
      WHERE id = venda_item.id;

      -- Delete the duplicate locacao item
      DELETE FROM items WHERE id = locacao_item.id;
    END IF;
  END LOOP;
END $$;

-- Step 7: Assign display_order to items per category alphabetically
DO $$
DECLARE
  cat RECORD;
  itm RECORD;
  idx integer;
BEGIN
  FOR cat IN SELECT id FROM categories LOOP
    idx := 0;
    FOR itm IN
      SELECT id FROM items WHERE category_id = cat.id ORDER BY name ASC
    LOOP
      UPDATE items SET display_order = idx WHERE id = itm.id;
      idx := idx + 1;
    END LOOP;
  END LOOP;
END $$;

-- Step 8: Drop legacy columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'price'
  ) THEN
    ALTER TABLE items DROP COLUMN price;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'operation_type'
  ) THEN
    ALTER TABLE items DROP COLUMN operation_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'operation_type'
  ) THEN
    ALTER TABLE categories DROP COLUMN operation_type;
  END IF;
END $$;

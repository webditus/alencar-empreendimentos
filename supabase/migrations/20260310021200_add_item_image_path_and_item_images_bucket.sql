/*
  # Add image support for items and create item-images storage bucket

  ## Summary
  This migration adds image support to the items system by:

  1. Modified Tables
    - `items`: adds `image_path` column (TEXT, nullable) to store the storage path of the item image

  2. Storage
    - Creates `item-images` bucket (public) for storing item images
    - Adds INSERT policy for public uploads
    - Adds SELECT policy for public reads
    - Matches existing pattern from container-images bucket

  ## Notes
  - The `image_path` column is nullable so existing items are unaffected
  - Storage policies mirror the existing container-images bucket policies
  - No existing data is modified
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'image_path'
  ) THEN
    ALTER TABLE items ADD COLUMN image_path TEXT;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND policyname = 'item-images public insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "item-images public insert"
      ON storage.objects
      FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'item-images')
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND policyname = 'item-images public select'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "item-images public select"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'item-images')
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND policyname = 'item-images public delete'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "item-images public delete"
      ON storage.objects
      FOR DELETE
      TO public
      USING (bucket_id = 'item-images')
    $policy$;
  END IF;
END $$;

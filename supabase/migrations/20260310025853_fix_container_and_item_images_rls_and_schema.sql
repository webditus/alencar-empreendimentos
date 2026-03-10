/*
  # Fix container_images and item-images RLS policies + schema

  1. Schema Changes
    - `container_images`: add `updated_at` column (timestamptz, default now())
    - `container_images`: add UNIQUE constraint on `container_size_id`

  2. container_images Table Policies
    - Keep existing SELECT (public read) as-is
    - Drop public INSERT policy, recreate as authenticated-only
    - Add UPDATE policy for authenticated users
    - Add DELETE policy for authenticated users

  3. container-images Storage Bucket Policies
    - Keep existing SELECT (public read) as-is
    - Drop public INSERT policy, recreate as authenticated-only
    - Add UPDATE policy for authenticated users
    - Add DELETE policy for authenticated users

  4. item-images Storage Bucket Policies
    - Keep existing SELECT (public read) as-is
    - Drop public INSERT policy, recreate as authenticated-only
    - Drop public DELETE policy, recreate as authenticated-only
    - Add UPDATE policy for authenticated users

  5. Security
    - All write operations now require authentication
    - Public read access preserved for the public-facing site
*/

-- ============================================================
-- 1. Schema: add updated_at and unique constraint
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'container_images'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.container_images
      ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.container_images'::regclass
      AND contype = 'u'
      AND conname = 'container_images_container_size_id_key'
  ) THEN
    ALTER TABLE public.container_images
      ADD CONSTRAINT container_images_container_size_id_key UNIQUE (container_size_id);
  END IF;
END $$;


-- ============================================================
-- 2. container_images table policies
-- ============================================================

DROP POLICY IF EXISTS "Public insert access" ON public.container_images;

CREATE POLICY "Authenticated users can insert container images"
  ON public.container_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update container images"
  ON public.container_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete container images"
  ON public.container_images
  FOR DELETE
  TO authenticated
  USING (true);


-- ============================================================
-- 3. container-images storage bucket policies
-- ============================================================

DROP POLICY IF EXISTS "Allow uploads 3loqis_0" ON storage.objects;

CREATE POLICY "Authenticated upload to container-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'container-images');

CREATE POLICY "Authenticated update in container-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'container-images')
  WITH CHECK (bucket_id = 'container-images');

CREATE POLICY "Authenticated delete from container-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'container-images');


-- ============================================================
-- 4. item-images storage bucket policies
-- ============================================================

DROP POLICY IF EXISTS "item-images public insert" ON storage.objects;
DROP POLICY IF EXISTS "item-images public delete" ON storage.objects;

CREATE POLICY "Authenticated upload to item-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'item-images');

CREATE POLICY "Authenticated update in item-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'item-images')
  WITH CHECK (bucket_id = 'item-images');

CREATE POLICY "Authenticated delete from item-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'item-images');

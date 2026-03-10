/*
  # Container Image Management System

  1. New Storage
    - Creates `container-images` public storage bucket for container photos
    - Allows authenticated users to upload/update/delete images
    - Allows public read access for displaying images on the public quote page

  2. New Tables
    - `container_images`
      - `id` (uuid, primary key) - Unique identifier
      - `container_size_id` (text, unique) - References the container size (e.g., '4m', '6m', '12m')
      - `image_url` (text) - Public URL of the uploaded image
      - `file_path` (text) - Storage file path for deletion
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  3. Security
    - Enable RLS on `container_images` table
    - Authenticated users can perform all CRUD operations
    - Anonymous/public users can only read (SELECT)
    - Storage policies allow authenticated upload/update/delete, public read
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('container-images', 'container-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access on container-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'container-images');

CREATE POLICY "Allow authenticated upload on container-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'container-images');

CREATE POLICY "Allow authenticated update on container-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'container-images')
WITH CHECK (bucket_id = 'container-images');

CREATE POLICY "Allow authenticated delete on container-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'container-images');

CREATE TABLE IF NOT EXISTS container_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_size_id text UNIQUE NOT NULL,
  image_url text NOT NULL DEFAULT '',
  file_path text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE container_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read container images"
ON container_images FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public users can read container images"
ON container_images FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated users can insert container images"
ON container_images FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update container images"
ON container_images FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete container images"
ON container_images FOR DELETE
TO authenticated
USING (true);

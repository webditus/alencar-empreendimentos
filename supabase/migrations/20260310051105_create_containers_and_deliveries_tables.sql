/*
  # Create Containers and Deliveries tables + extend Quotes

  1. Modified Tables
    - `quotes`
      - `container_type` (varchar, nullable) - Type of container (e.g., "Dry", "Reefer", "Open Top")
      - `delivery_city` (varchar, nullable) - Delivery destination city
      - `delivery_state` (varchar, nullable) - Delivery destination state (2 chars)
      - `delivery_deadline` (date, nullable) - Delivery deadline date

  2. New Tables
    - `containers`
      - `id` (uuid, primary key)
      - `container_type` (varchar, not null) - Type such as "Dry", "Reefer"
      - `container_size` (varchar, not null) - Constrained to '4m', '6m', '12m'
      - `status` (varchar, not null, default 'available') - available, rented, in_transport, maintenance
      - `location_city` (varchar, nullable)
      - `location_state` (varchar, nullable)
      - `quote_id` (uuid, nullable, FK to quotes)
      - `client_name` (varchar, nullable) - Denormalized for quick display
      - `delivery_date` (date, nullable)
      - `return_date` (date, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `deliveries`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, nullable, FK to quotes)
      - `container_id` (uuid, not null, FK to containers)
      - `client_name` (varchar, not null)
      - `delivery_date` (date, not null)
      - `delivery_city` (varchar, not null)
      - `delivery_state` (varchar, not null)
      - `status` (varchar, not null, default 'scheduled') - scheduled, in_transit, delivered, returned
      - `notes` (text, nullable)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  3. Security
    - Enable RLS on `containers` table
    - Enable RLS on `deliveries` table
    - Add CRUD policies for authenticated users on both tables
*/

-- Add delivery-related columns to quotes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'container_type'
  ) THEN
    ALTER TABLE quotes ADD COLUMN container_type varchar;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'delivery_city'
  ) THEN
    ALTER TABLE quotes ADD COLUMN delivery_city varchar;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'delivery_state'
  ) THEN
    ALTER TABLE quotes ADD COLUMN delivery_state varchar(2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'delivery_deadline'
  ) THEN
    ALTER TABLE quotes ADD COLUMN delivery_deadline date;
  END IF;
END $$;

-- Create containers table
CREATE TABLE IF NOT EXISTS containers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_type varchar NOT NULL,
  container_size varchar NOT NULL CHECK (container_size IN ('4m', '6m', '12m')),
  status varchar NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'in_transport', 'maintenance')),
  location_city varchar,
  location_state varchar,
  quote_id uuid REFERENCES quotes(id),
  client_name varchar,
  delivery_date date,
  return_date date,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id),
  container_id uuid NOT NULL REFERENCES containers(id),
  client_name varchar NOT NULL,
  delivery_date date NOT NULL,
  delivery_city varchar NOT NULL,
  delivery_state varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_transit', 'delivered', 'returned')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for containers
CREATE POLICY "Authenticated users can view containers"
  ON containers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert containers"
  ON containers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update containers"
  ON containers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete containers"
  ON containers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for deliveries
CREATE POLICY "Authenticated users can view deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert deliveries"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete deliveries"
  ON deliveries FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);
CREATE INDEX IF NOT EXISTS idx_containers_quote_id ON containers(quote_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_container_id ON deliveries(container_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_quote_id ON deliveries(quote_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_date ON deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

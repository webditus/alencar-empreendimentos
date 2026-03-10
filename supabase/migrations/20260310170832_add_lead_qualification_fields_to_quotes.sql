/*
  # Add lead qualification fields to quotes table

  1. New Columns on `quotes`
    - `customer_property_number` (text, nullable) - Property number or "Sem numero"
    - `customer_address_complement` (text, nullable) - Address complement (apt, block, etc.)
    - `customer_installation_location` (text, nullable) - Where the container will be installed
    - `customer_installation_location_other` (text, nullable) - Custom location when "Outro" is selected
    - `customer_project_start_timeline` (text, nullable) - Timeline for project start
    - `customer_general_notes` (text, nullable) - Free-form notes from the customer
    - `customer_purpose_other` (text, nullable) - Custom purpose when "Outro" is selected

  2. Important Notes
    - All columns are nullable so existing rows remain valid
    - No changes to existing columns (customer_purpose TEXT[] stays as-is)
    - No changes to RLS policies (existing policies cover all columns)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_property_number'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_property_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_address_complement'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_address_complement text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_installation_location'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_installation_location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_installation_location_other'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_installation_location_other text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_project_start_timeline'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_project_start_timeline text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_general_notes'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_general_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_purpose_other'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_purpose_other text;
  END IF;
END $$;
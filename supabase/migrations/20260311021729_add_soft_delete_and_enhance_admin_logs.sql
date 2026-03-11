/*
  # Add soft delete support and enhance admin logs

  1. Modified Tables
    - `user_profiles`
      - Added `deleted_at` (timestamptz, nullable) - Timestamp for soft deletion
    - `admin_logs`
      - Added `performer_email` (text, nullable) - Email of the admin who performed the action, for display without joins

  2. New Indexes
    - Index on `user_profiles.deleted_at` for filtering active/deleted users
    - Index on `admin_logs.target_email` for searching logs by target

  3. Important Notes
    - Soft delete sets `deleted_at` instead of physically removing user profiles
    - The admin_logs.performer_email field is denormalized for read performance on the activity log page
    - No data is removed; this is purely additive
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_logs' AND column_name = 'performer_email'
  ) THEN
    ALTER TABLE admin_logs ADD COLUMN performer_email text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at ON user_profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_email ON admin_logs(target_email);

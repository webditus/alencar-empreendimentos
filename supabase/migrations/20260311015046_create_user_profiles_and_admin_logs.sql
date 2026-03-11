/*
  # Create user_profiles and admin_logs tables

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `display_name` (text) - User's display name for the profile
      - `phone` (text, nullable) - User's phone number
      - `avatar_url` (text, nullable) - URL to the user's avatar image
      - `created_at` (timestamptz) - When the profile was created
      - `updated_at` (timestamptz) - When the profile was last updated
    - `admin_logs`
      - `id` (uuid, primary key)
      - `performed_by` (uuid, references auth.users) - The admin who performed the action
      - `action` (text) - The type of action: create_user, delete_user, update_role
      - `target_user_id` (uuid, nullable) - The user affected by the action
      - `target_email` (text, nullable) - The email of the affected user (for reference after deletion)
      - `metadata` (jsonb, nullable) - Additional action details (e.g., old_role, new_role)
      - `created_at` (timestamptz) - When the action occurred

  2. Security
    - Enable RLS on both tables
    - user_profiles: Users can read and update their own profile
    - user_profiles: Service role used by admin API can insert profiles for new users
    - admin_logs: Only admins can insert logs (via service role in Netlify function)
    - admin_logs: Only admins can read logs (for future admin activity log page)

  3. Important Notes
    - user_profiles.id directly references auth.users.id (1:1 relationship)
    - admin_logs records all user management events for audit trail
    - No data is ever deleted from admin_logs
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_user_id uuid,
  target_email text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role') = 'admin'
    )
  );

CREATE POLICY "Service role can insert logs"
  ON admin_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_logs_performed_by ON admin_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

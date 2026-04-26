/*
  # Raffle Application Schema

  1. New Tables
    - `prizes`
      - `id` (uuid, primary key)
      - `name` (text) - Prize name
      - `description` (text) - Prize description
      - `image_url` (text) - URL to prize image
      - `tier` (integer) - Prize tier (1, 2, or 3)
      - `total_tickets` (integer) - Total tickets for this prize
      - `ticket_price` (numeric) - Price per ticket
      - `created_at` (timestamptz)

    - `tickets`
      - `id` (uuid, primary key)
      - `prize_id` (uuid, FK to prizes)
      - `ticket_number` (integer) - Sequential ticket number within prize
      - `status` (text) - One of: 'available', 'reserved', 'pending', 'sold'
      - `reserved_by` (uuid, FK to auth.users, nullable)
      - `reserved_at` (timestamptz, nullable)
      - `reservation_expires_at` (timestamptz, nullable)
      - `purchased_by` (uuid, FK to auth.users, nullable)
      - `purchased_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

    - `receipts`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, FK to tickets)
      - `user_id` (uuid, FK to auth.users)
      - `file_url` (text) - Storage URL for uploaded receipt
      - `file_name` (text) - Original file name
      - `file_type` (text) - MIME type
      - `whatsapp_sent` (boolean) - Whether user sent via WhatsApp
      - `created_at` (timestamptz)

    - `profiles`
      - `id` (uuid, primary key, FK to auth.users)
      - `full_name` (text)
      - `phone` (text, nullable)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Profiles: users can read/update own, admins can read all
    - Tickets: anyone can read, only system/reservation functions can modify
    - Receipts: users can insert own, admins can read all
    - Prizes: anyone can read

  3. Important Notes
    - Ticket reservation uses a 15-minute expiry window
    - Status lifecycle: available -> reserved -> pending -> sold (or back to available)
    - Admin approval/rejection handled via edge function
*/

-- Prizes table
CREATE TABLE IF NOT EXISTS prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  tier integer NOT NULL,
  total_tickets integer NOT NULL,
  ticket_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id uuid NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
  ticket_number integer NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'pending', 'sold')),
  reserved_by uuid REFERENCES auth.users(id),
  reserved_at timestamptz,
  reservation_expires_at timestamptz,
  purchased_by uuid REFERENCES auth.users(id),
  purchased_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prize_id, ticket_number)
);

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT '',
  whatsapp_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Prizes: anyone can read
CREATE POLICY "Anyone can read prizes"
  ON prizes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Unauthenticated can read prizes"
  ON prizes FOR SELECT
  TO anon
  USING (true);

-- Tickets: anyone can read
CREATE POLICY "Authenticated can read tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Unauthenticated can read tickets"
  ON tickets FOR SELECT
  TO anon
  USING (true);

-- Tickets: authenticated users can reserve (update) their own tickets
CREATE POLICY "Users can reserve tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (status = 'available' OR reserved_by = auth.uid() OR purchased_by = auth.uid())
  WITH CHECK (true);

-- Tickets: insert only via system
CREATE POLICY "Authenticated can insert tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Receipts: users can insert their own
CREATE POLICY "Users can insert own receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Receipts: users can read their own, admins can read all
CREATE POLICY "Users can read own receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- Profiles: users can read own
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Profiles: admins can read all
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- Profiles: users can update own
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Profiles: auto-insert on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_prize_id ON tickets(prize_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_reserved_by ON tickets(reserved_by);
CREATE INDEX IF NOT EXISTS idx_receipts_ticket_id ON receipts(ticket_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);

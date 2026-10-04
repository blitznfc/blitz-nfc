-- Blitz NFC - Database Schema Migration
-- Run this in Supabase SQL Editor

-- 1. Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tags registry
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  uid TEXT NOT NULL, -- NFC tag UID (hex string)
  ssid TEXT NOT NULL,
  password TEXT NOT NULL,
  is_provisioned BOOLEAN DEFAULT false,
  provisioned_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'lost'
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id, uid)
);

-- 3. Tag events (audit log)
CREATE TABLE IF NOT EXISTS tag_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'provisioned', 'read', 'write_failed'
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "businesses_select_own" ON businesses
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "businesses_update_own" ON businesses
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "businesses_delete_own" ON businesses
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "businesses_insert" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for tags
CREATE POLICY "tags_select_own" ON tags
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "tags_insert_own" ON tags
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "tags_update_own" ON tags
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "tags_delete_own" ON tags
  FOR DELETE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for tag_events
CREATE POLICY "tag_events_select_own" ON tag_events
  FOR SELECT USING (
    tag_id IN (
      SELECT id FROM tags WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX idx_tags_business_id ON tags(business_id);
CREATE INDEX idx_tags_uid ON tags(uid);
CREATE INDEX idx_tag_events_tag_id ON tag_events(tag_id);
CREATE INDEX idx_tag_events_created_at ON tag_events(created_at);

-- Timestamp update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_update_timestamp
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tags_update_timestamp
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

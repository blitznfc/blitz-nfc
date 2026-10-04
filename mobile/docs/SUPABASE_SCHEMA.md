# Supabase Schema - Blitz NFC WiFi Connector

## Tables Overview

### 1. **businesses** (Business Owner Profiles)

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS: Owner-only read/write
-- Policy: SELECT/UPDATE/DELETE where owner_id = auth.uid()
```

### 2. **tags** (NFC Tag Registry)

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  uid TEXT NOT NULL UNIQUE, -- UID dari tag fisik (hex string)
  ssid TEXT NOT NULL,
  password TEXT NOT NULL,
  is_provisioned BOOLEAN DEFAULT false,
  provisioned_at TIMESTAMP,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'lost'
  last_read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS: Owner-only via business_id
-- Indexes: business_id, uid (unique per owner)
```

### 3. **tag_events** (Audit Log)

```sql
CREATE TABLE tag_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'provisioned', 'read', 'write_failed'
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- RLS: Owner-only read (via tags.business_id)
```

## RLS Policies

### businesses

- `SELECT`: auth.uid() = owner_id
- `UPDATE`: auth.uid() = owner_id
- `DELETE`: auth.uid() = owner_id

### tags

- `SELECT`: business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
- `INSERT`: business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
- `UPDATE`: business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
- `DELETE`: business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())

### tag_events

- `SELECT`: tag_id IN (SELECT id FROM tags WHERE business_id IN (...))

## Supabase Setup Steps

1. Create Supabase project
2. Run SQL migrations (copy above)
3. Enable RLS on all tables
4. Setup Auth (email + Google OAuth)
5. Generate TypeScript types: `supabase gen types typescript --project-id YOUR_PROJECT_ID`

## Env Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

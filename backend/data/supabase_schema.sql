-- Supabase Leads Table Schema
-- Run this SQL in your Supabase SQL Editor

-- Create the leads table in the public schema
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    interest TEXT NOT NULL,
    message TEXT,
    property_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_property_id ON public.leads(property_id);

-- Optional: Enable Row Level Security (RLS) if needed
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy to allow inserts (adjust as needed for your security requirements)
-- CREATE POLICY "Allow public inserts" ON leads FOR INSERT WITH CHECK (true);

-- ============================================
-- Shortlists Table Schema
-- ============================================

-- Create the shortlists table in the public schema
CREATE TABLE IF NOT EXISTS public.shortlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    share_id TEXT NOT NULL UNIQUE,
    property_ids JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_shortlists_share_id ON public.shortlists(share_id);

CREATE INDEX IF NOT EXISTS idx_shortlists_created_at ON public.shortlists(created_at DESC);

-- Optional: Enable Row Level Security (RLS) if needed
-- ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy to allow public reads/inserts (adjust as needed for your security requirements)
-- CREATE POLICY "Allow public selects" ON shortlists FOR SELECT USING (true);
-- CREATE POLICY "Allow public inserts" ON shortlists FOR INSERT WITH CHECK (true);

-- ============================================
-- HATORI HR Pro - Supabase Schema
-- ============================================

-- Create tables
CREATE TABLE IF NOT EXISTS karyawan (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    initial TEXT,
    division TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    join_date DATE,
    status TEXT DEFAULT 'Aktif',
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS izin (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    initial TEXT,
    division TEXT NOT NULL,
    position TEXT,
    status TEXT NOT NULL,
    jam_izin TIME NOT NULL,
    keterangan TEXT,
    jam_kembali TIME,
    durasi_izin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'User',
    situs TEXT,
    status TEXT DEFAULT 'Inactive',
    created_date DATE DEFAULT CURRENT_DATE,
    photo TEXT,
    has_seen_welcome BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    menus JSONB DEFAULT '[]'::jsonb,
    permissions JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_karyawan_division ON karyawan(division);
CREATE INDEX IF NOT EXISTS idx_karyawan_status ON karyawan(status);
CREATE INDEX IF NOT EXISTS idx_izin_date ON izin(date);
CREATE INDEX IF NOT EXISTS idx_izin_name ON izin(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert default data
INSERT INTO roles (role_name, menus, permissions, status) VALUES
('Superadmin', '["dashboard","karyawan","izin","laporan","users","pengaturan","roles","api-telegram"]', '["create","edit","delete"]', 'Active'),
('Admin', '["dashboard","karyawan","izin","laporan","users","api-telegram"]', '["create","edit","delete"]', 'Active'),
('User', '["dashboard","karyawan","izin"]', '["create"]', 'Inactive')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO users (email, password, name, role, situs, status) VALUES
('superadmin@hrpro.com', 'admin123', 'Super Admin', 'Superadmin', 'HATORI Group Indonesia', 'Active')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE karyawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE izin ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for all users" ON karyawan FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON karyawan FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON karyawan FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON karyawan FOR DELETE USING (true);

-- Similar policies for other tables...
-- Portfolio Database Schema
-- This file contains the complete database structure

-- Create portfolio_data table to store all portfolio information
CREATE TABLE IF NOT EXISTS portfolio_data (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resumes table (enhanced from existing cloud storage)
CREATE TABLE IF NOT EXISTS resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_size VARCHAR(50),
  file_type VARCHAR(100),
  storage_type VARCHAR(20) DEFAULT 'cloud',
  cloud_file_name VARCHAR(255),
  cloud_url TEXT,
  file_data TEXT, -- Base64 data for local storage fallback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE portfolio_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (using service role key)
CREATE POLICY "Enable full access for service role" ON portfolio_data
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable full access for service role on resumes" ON resumes
  FOR ALL USING (auth.role() = 'service_role');

-- Create policy for public read access (for frontend display)
CREATE POLICY "Enable read access for all users" ON portfolio_data
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on resumes" ON resumes
  FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_portfolio_data_updated_at 
  BEFORE UPDATE ON portfolio_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at 
  BEFORE UPDATE ON resumes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_data_section ON portfolio_data(section);
CREATE INDEX IF NOT EXISTS idx_resumes_storage_type ON resumes(storage_type);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at);

-- Comments for documentation
COMMENT ON TABLE portfolio_data IS 'Stores all portfolio sections as JSONB data';
COMMENT ON TABLE resumes IS 'Stores resume files with cloud storage support';
COMMENT ON COLUMN portfolio_data.section IS 'Section identifier (personalInfo, projects, experience, etc.)';
COMMENT ON COLUMN portfolio_data.data IS 'JSONB data for the section';
COMMENT ON COLUMN resumes.storage_type IS 'Storage location: local or cloud';
COMMENT ON COLUMN resumes.cloud_file_name IS 'Unique filename in cloud storage bucket';
COMMENT ON COLUMN resumes.file_data IS 'Base64 encoded file data for local storage fallback';

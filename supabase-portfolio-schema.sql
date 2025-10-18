-- Create portfolio_data table for storing user portfolio information
CREATE TABLE IF NOT EXISTS portfolio_data (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE DEFAULT 'default',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_data_user_id ON portfolio_data(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE portfolio_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (since this is a personal portfolio)
CREATE POLICY "Allow all operations on portfolio_data" ON portfolio_data
FOR ALL USING (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_portfolio_data_updated_at
    BEFORE UPDATE ON portfolio_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default data (optional)
INSERT INTO portfolio_data (user_id, data) 
VALUES ('default', '{}') 
ON CONFLICT (user_id) DO NOTHING;
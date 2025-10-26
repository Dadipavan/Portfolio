-- Migration Script: Add liveUrl and status fields to existing projects
-- Run this in Supabase SQL Editor AFTER the main schema is deployed

-- This script will add missing fields to existing project records
UPDATE portfolio_data 
SET data = (
  SELECT jsonb_agg(
    CASE 
      WHEN jsonb_typeof(project) = 'object' THEN
        project || 
        jsonb_build_object('liveUrl', COALESCE(project->>'liveUrl', '')) ||
        jsonb_build_object('status', COALESCE(project->>'status', 'completed'))
      ELSE project
    END
  )
  FROM jsonb_array_elements(data) AS project
)
WHERE section = 'projects' 
AND data IS NOT NULL 
AND jsonb_typeof(data) = 'array';

-- Update timestamp
UPDATE portfolio_data 
SET updated_at = NOW() 
WHERE section = 'projects';

-- Verify the update
SELECT 
  section,
  jsonb_pretty(data) as projects_data
FROM portfolio_data 
WHERE section = 'projects';

-- Optional: Check specific project fields
SELECT 
  section,
  project->>'title' as title,
  project->>'githubUrl' as github_url,
  project->>'liveUrl' as live_url,
  project->>'status' as status
FROM portfolio_data, 
     jsonb_array_elements(data) as project 
WHERE section = 'projects';
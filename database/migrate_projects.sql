-- Migration Script: Fix project links and add demo URLs
-- Run this in Supabase SQL Editor to fix GitHub/Demo URL issue

-- Update projects with correct liveUrl values
UPDATE portfolio_data 
SET data = '[
  {
    "id": 1,
    "title": "Process-Hunter",
    "subtitle": "System Process Analysis Tool", 
    "description": "Developed a C program to extract process details from /proc using PID; displays command-line, state, PPID, memory, threads, executable path with robust error handling.",
    "technologies": ["C", "Linux", "System Programming"],
    "githubUrl": "https://github.com/Dadipavan/Process-Hunter",
    "liveUrl": "",
    "year": "2025",
    "featured": true,
    "status": "completed"
  },
  {
    "id": 2,
    "title": "DataVista",
    "subtitle": "Automated EDA Tool",
    "description": "Built a no-code EDA app: upload datasets, compute descriptive stats, outlier detection, correlation heatmaps, basic feature engineering, downloadable processed datasets.",
    "technologies": ["Python", "Streamlit", "Pandas", "Data Analysis"],
    "githubUrl": "https://github.com/Dadipavan/EDA", 
    "liveUrl": "https://eda-dadipavan.streamlit.app/",
    "year": "2025",
    "featured": true,
    "status": "completed"
  },
  {
    "id": 3,
    "title": "Stock Price Prediction",
    "subtitle": "LSTM Time Series Forecasting",
    "description": "Developed an LSTM-based time-series forecasting model for historical stock data with preprocessing, scaling, and evaluation. Deployed a Flask demo app for visualization.",
    "technologies": ["Python", "LSTM", "TensorFlow", "Flask", "Time Series"],
    "githubUrl": "https://github.com/Dadipavan/stock-trend-prediction",
    "liveUrl": "",
    "year": "2024", 
    "featured": true,
    "status": "completed"
  },
  {
    "id": 4,
    "title": "Email Spam Classification",
    "subtitle": "NLP Classification Model",
    "description": "Built spam classifier using Naive Bayes and Logistic Regression with TF-IDF and standard NLP preprocessing to separate spam/ham emails.",
    "technologies": ["Python", "NLP", "scikit-learn", "TF-IDF"],
    "githubUrl": "https://github.com/Dadipavan/Email-Spam-Classification",
    "liveUrl": "",
    "year": "2024",
    "featured": false,
    "status": "completed"
  }
]'::jsonb,
updated_at = NOW()
WHERE section = 'projects';

-- Verify the update worked
SELECT 
  section,
  jsonb_pretty(data) as projects_data
FROM portfolio_data 
WHERE section = 'projects';

-- Check that GitHub and Demo URLs are different
SELECT 
  project->>'title' as title,
  project->>'githubUrl' as github_url,
  project->>'liveUrl' as demo_url,
  CASE 
    WHEN project->>'liveUrl' = '' THEN 'No Demo URL'
    WHEN project->>'liveUrl' = project->>'githubUrl' THEN 'ERROR: Same as GitHub!'
    ELSE 'Different URLs ✓'
  END as url_status
FROM portfolio_data, 
     jsonb_array_elements(data) as project 
WHERE section = 'projects';
-- Portfolio Database Schema
-- Run these SQL commands in your Supabase SQL Editor

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

-- Insert default portfolio data
INSERT INTO portfolio_data (section, data) VALUES
('personalInfo', '{
  "name": "Valavala Dadi Naga Siva Sai Pavan",
  "shortName": "Sai Pavan",
  "title": "Aspiring Data Scientist / ML Engineer",
  "subtitle": "B.Tech (IT) Student",
  "description": "B.Tech (IT) Student passionate about leveraging data and machine learning to solve real-world problems. Currently maintaining a 9.1/10 CGPA and building innovative projects.",
  "about": "I am a passionate B.Tech Information Technology student at Seshadri Rao Gudlavalleru Engineering College with a strong foundation in programming, machine learning, and data science. With hands-on experience in building ML models, web applications, and system tools, I am committed to solving complex problems through technology.",
  "location": "Korukollu, Kalidindi Mandal, Andhra Pradesh, India",
  "email": "dadisaipavan1514@gmail.com",
  "phone": "+91 94918 73385",
  "github": "https://github.com/Dadipavan",
  "linkedin": "https://linkedin.com/in/valavala-dadi-naga-siva-sai-pavan",
  "cgpa": "9.1/10",
  "graduation": "Jun 2026 (Expected)"
}'),

('technicalSkills', '[
  {
    "category": "Programming Languages",
    "skills": ["C", "Python", "Java", "JavaScript", "Shell scripting"]
  },
  {
    "category": "Machine Learning & AI",
    "skills": [
      "scikit-learn",
      "Pandas",
      "NumPy",
      "Matplotlib",
      "LSTM",
      "Neural Networks",
      "NLP (TF-IDF, CountVectorizer)"
    ]
  },
  {
    "category": "Web Frontend",
    "skills": ["HTML5", "CSS3", "Bootstrap", "React.js"]
  },
  {
    "category": "Tools & Databases",
    "skills": ["Linux/Unix", "Git", "VS Code", "MySQL", "Power BI", "Streamlit", "Flask"]
  },
  {
    "category": "Soft Skills",
    "skills": ["Problem solving", "Team collaboration", "Leadership", "Quick learner"]
  }
]'),

('projects', '[
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
]'),

('experience', '[
  {
    "id": 1,
    "title": "Intern – Generative AI",
    "company": "IBM Cloud",
    "location": "Remote",
    "period": "May 2025 – Jul 2025",
    "type": "Internship",
    "description": [
      "Explored generative AI concepts and proof-of-concept deployments on IBM Cloud",
      "Implemented demo models and studied deployment options and inference pipelines"
    ]
  },
  {
    "id": 2,
    "title": "Student Mentor",
    "company": "Reliance Foundation",
    "location": "Remote",
    "period": "Jul 2024 – Present",
    "type": "Full-time",
    "description": [
      "Mentored and guided fellow students in skill-building initiatives and projects",
      "Organized learning sessions, career-prep workshops, and peer mentoring activities",
      "Contributed to fostering a collaborative and inclusive learning environment"
    ]
  },
  {
    "id": 3,
    "title": "Vice-President & Event Organizer",
    "company": "SAINT (IT Department Club)",
    "location": "Seshadri Rao Gudlavalleru Engineering College",
    "period": "2024 – Present",
    "type": "Student Leadership",
    "description": [
      "Served as Vice-President of SAINT (IT Department Club), overseeing student-driven initiatives",
      "Conducted 1 major hackathon with participation from 400+ students",
      "Organized multiple technical events, coding contests, and workshops for IT students",
      "Coordinated with faculty and peers to manage event logistics and boost participation"
    ]
  }
]'),

('education', '[
  {
    "id": 1,
    "institution": "Seshadri Rao Gudlavalleru Engineering College",
    "degree": "B.Tech in Information Technology",
    "location": "Krishna (dt)",
    "period": "Oct 2022 – Jun 2026 (Expected)",
    "grade": "CGPA: 9.1/10",
    "coursework": [
      "Operating Systems",
      "Computer Networks",
      "DS&A",
      "DBMS",
      "Machine Learning",
      "Software Engineering"
    ]
  },
  {
    "id": 2,
    "institution": "Sri Chaitanya Junior College",
    "degree": "Intermediate (MPC)",
    "location": "Bhimavaram",
    "period": "2020 – 2022",
    "grade": "Score: 93.5%"
  },
  {
    "id": 3,
    "institution": "Z.P.H.S Korukollu",
    "degree": "SSC",
    "location": "Andhra Pradesh",
    "period": "2019 – 2020",
    "grade": "Percentage: 98.3%"
  }
]'),

('certifications', '[
  {
    "title": "Java Programming [Beginner to Advanced]",
    "issuer": "GeeksforGeeks",
    "year": "2025",
    "skills": ["OOP", "Collections", "Multithreading", "Exception Handling"],
    "verificationUrl": ""
  },
  {
    "title": "Certified Data Science for Everyone",
    "issuer": "Reliance Foundation Skill Academy",
    "year": "2025",
    "skills": ["Data Collection", "Data Cleaning", "Visualization", "ML Concepts"],
    "verificationUrl": ""
  },
  {
    "title": "Analyzing Data with Python",
    "issuer": "edX",
    "year": "2024",
    "skills": ["Pandas", "NumPy", "Matplotlib", "Data Analysis"],
    "verificationUrl": ""
  },
  {
    "title": "Analyzing and Visualizing Data with Power BI",
    "issuer": "edX",
    "year": "2024",
    "skills": ["Interactive Dashboards", "DAX Calculations", "Data Modeling"],
    "verificationUrl": ""
  }
]'),

('achievements', '[
  {
    "title": "Reliance Foundation Undergraduate Scholar",
    "description": "Awarded for academic excellence and leadership potential"
  },
  {
    "title": "President – Techno Club",
    "description": "Led \"Code with GPT\" AI-integrated coding event"
  },
  {
    "title": "Academic Excellence",
    "description": "Consistent high performance with 9.1 CGPA"
  }
]'),

('quickFacts', '{
  "location": "📍 Korukollu, Kalidindi Mandal, Andhra Pradesh, India",
  "cgpa": "🎓 CGPA: 9.1/10",
  "graduation": "📅 Expected Graduation: Jun 2026 (Expected)",
  "scholarship": "🏆 Reliance Foundation Scholar"
}'),

('currentFocus', '[
  {
    "title": "Machine Learning & AI",
    "description": "Building predictive models and exploring generative AI",
    "icon": "🤖"
  },
  {
    "title": "Data Science Projects",
    "description": "Creating tools for automated data analysis and visualization",
    "icon": "📊"
  },
  {
    "title": "Open Source Contribution",
    "description": "Contributing to the developer community through GitHub",
    "icon": "🚀"
  }
]')

ON CONFLICT (section) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_data_section ON portfolio_data(section);
CREATE INDEX IF NOT EXISTS idx_resumes_storage_type ON resumes(storage_type);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at);
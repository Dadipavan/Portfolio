// Personal Information
export const PERSONAL_INFO = {
  name: 'Valavala Dadi Naga Siva Sai Pavan',
  shortName: 'Sai Pavan',
  title: 'Aspiring Data Scientist / ML Engineer',
  subtitle: 'B.Tech (IT) Student',
  description: 'B.Tech (IT) Student passionate about leveraging data and machine learning to solve real-world problems. Currently maintaining a 9.1/10 CGPA and building innovative projects.',
  about: 'I\'m a passionate B.Tech Information Technology student at Seshadri Rao Gudlavalleru Engineering College with a strong foundation in programming, machine learning, and data science. With hands-on experience in building ML models, web applications, and system tools, I\'m committed to solving complex problems through technology.',
  location: 'Korukollu, Kalidindi Mandal, Andhra Pradesh, India',
  email: 'dadisaipavan1514@gmail.com',
  phone: '+91 94918 73385',
  github: 'https://github.com/Dadipavan',
  linkedin: 'https://linkedin.com/in/valavala-dadi-naga-siva-sai-pavan',
  cgpa: '9.1/10',
  graduation: 'Jun 2026 (Expected)',
};

// Skills
export const TECHNICAL_SKILLS = [
  {
    category: 'Programming Languages',
    skills: ['C', 'Python', 'Java', 'JavaScript', 'Shell scripting']
  },
  {
    category: 'Machine Learning & AI',
    skills: [
      'scikit-learn',
      'Pandas',
      'NumPy',
      'Matplotlib',
      'LSTM',
      'Neural Networks',
      'NLP (TF-IDF, CountVectorizer)',
    ]
  },
  {
    category: 'Web Frontend',
    skills: ['HTML5', 'CSS3', 'Bootstrap', 'React.js']
  },
  {
    category: 'Tools & Databases',
    skills: ['Linux/Unix', 'Git', 'VS Code', 'MySQL', 'Power BI', 'Streamlit', 'Flask']
  },
  {
    category: 'Soft Skills',
    skills: ['Problem solving', 'Team collaboration', 'Leadership', 'Quick learner']
  }
];

// Projects
export const PROJECTS = [
  {
    id: 1,
    title: 'Process-Hunter',
    subtitle: 'System Process Analysis Tool',
    description:
      'Developed a C program to extract process details from /proc using PID; displays command-line, state, PPID, memory, threads, executable path with robust error handling.',
    technologies: ['C', 'Linux', 'System Programming'],
    githubUrl: 'https://github.com/Dadipavan/Process-Hunter',
    year: '2025',
    featured: true,
  },
  {
    id: 2,
    title: 'DataVista',
    subtitle: 'Automated EDA Tool',
    description:
      'Built a no-code EDA app: upload datasets, compute descriptive stats, outlier detection, correlation heatmaps, basic feature engineering, downloadable processed datasets.',
    technologies: ['Python', 'Streamlit', 'Pandas', 'Data Analysis'],
    githubUrl: 'https://github.com/Dadipavan/EDA',
    year: '2025',
    featured: true,
  },
  {
    id: 3,
    title: 'Stock Price Prediction',
    subtitle: 'LSTM Time Series Forecasting',
    description:
      'Developed an LSTM-based time-series forecasting model for historical stock data with preprocessing, scaling, and evaluation. Deployed a Flask demo app for visualization.',
    technologies: ['Python', 'LSTM', 'TensorFlow', 'Flask', 'Time Series'],
    githubUrl: 'https://github.com/Dadipavan/stock-trend-prediction',
    year: '2024',
    featured: true,
  },
  {
    id: 4,
    title: 'Email Spam Classification',
    subtitle: 'NLP Classification Model',
    description:
      'Built spam classifier using Naive Bayes and Logistic Regression with TF-IDF and standard NLP preprocessing to separate spam/ham emails.',
    technologies: ['Python', 'NLP', 'scikit-learn', 'TF-IDF'],
    year: '2024',
    featured: false,
  },
];

// Experience
export const EXPERIENCE = [
  {
    id: 1,
    title: 'Intern – Generative AI',
    company: 'IBM Cloud',
    location: 'Remote',
    period: 'May 2025 – Jul 2025',
    type: 'Internship',
    description: [
      'Explored generative AI concepts and proof-of-concept deployments on IBM Cloud',
      'Implemented demo models and studied deployment options and inference pipelines',
    ],
  },
  {
    id: 2,
    title: 'Student Mentor',
    company: 'Reliance Foundation',
    location: 'Remote',
    period: 'Jul 2024 – Present',
    type: 'Full-time',
    description: [
      'Mentored and guided fellow students in skill-building initiatives and projects',
      'Organized learning sessions, career-prep workshops, and peer mentoring activities',
      'Contributed to fostering a collaborative and inclusive learning environment',
    ],
  },
  {
    id: 3,
    title: 'Vice-President & Event Organizer',
    company: 'SAINT (IT Department Club)',
    location: 'Seshadri Rao Gudlavalleru Engineering College',
    period: '2024 – Present',
    type: 'Student Leadership',
    description: [
      'Served as Vice-President of SAINT (IT Department Club), overseeing student-driven initiatives',
      'Conducted 1 major hackathon with participation from 400+ students',
      'Organized multiple technical events, coding contests, and workshops for IT students',
      'Coordinated with faculty and peers to manage event logistics and boost participation',
    ],
  },
];

// Education
export const EDUCATION = [
  {
    id: 1,
    institution: 'Seshadri Rao Gudlavalleru Engineering College',
    degree: 'B.Tech in Information Technology',
    location: 'Krishna (dt)',
    period: 'Oct 2022 – Jun 2026 (Expected)',
    grade: 'CGPA: 9.1/10',
    coursework: [
      'Operating Systems',
      'Computer Networks',
      'DS&A',
      'DBMS',
      'Machine Learning',
      'Software Engineering',
    ],
  },
  {
    id: 2,
    institution: 'Sri Chaitanya Junior College',
    degree: 'Intermediate (MPC)',
    location: 'Bhimavaram',
    period: '2020 – 2022',
    grade: 'Score: 93.5%',
  },
  {
    id: 3,
    institution: 'Z.P.H.S Korukollu',
    degree: 'SSC',
    location: 'Andhra Pradesh',
    period: '2019 – 2020',
    grade: 'Percentage: 98.3%',
  },
];

// Achievements
export const ACHIEVEMENTS = [
  {
    title: 'Reliance Foundation Undergraduate Scholar',
    description: 'Awarded for academic excellence and leadership potential',
  },
  {
    title: 'President – Techno Club',
    description: 'Led "Code with GPT" AI-integrated coding event',
  },
  {
    title: 'Academic Excellence',
    description: 'Consistent high performance with 9.1 CGPA',
  },
];

// Certifications (selected key ones)
export const CERTIFICATIONS = [
  {
    title: 'Java Programming [Beginner to Advanced]',
    issuer: 'GeeksforGeeks',
    year: '2025',
    skills: ['OOP', 'Collections', 'Multithreading', 'Exception Handling'],
    verificationUrl: '', // Add verification URL when available
  },
  {
    title: 'Certified Data Science for Everyone',
    issuer: 'Reliance Foundation Skill Academy',
    year: '2025',
    skills: ['Data Collection', 'Data Cleaning', 'Visualization', 'ML Concepts'],
    verificationUrl: '', // Add verification URL when available
  },
  {
    title: 'Analyzing Data with Python',
    issuer: 'edX',
    year: '2024',
    skills: ['Pandas', 'NumPy', 'Matplotlib', 'Data Analysis'],
    verificationUrl: '', // Add verification URL when available
  },
  {
    title: 'Analyzing and Visualizing Data with Power BI',
    issuer: 'edX',
    year: '2024',
    skills: ['Interactive Dashboards', 'DAX Calculations', 'Data Modeling'],
    verificationUrl: '', // Add verification URL when available
  },
];
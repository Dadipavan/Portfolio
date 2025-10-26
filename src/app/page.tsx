'use client';

import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Phone, Download, ExternalLink, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getPortfolioData, getPortfolioDataSync, getDefaultData, initializeData } from '@/lib/dataManager';
import MobileMenu from '@/components/MobileMenu';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any>(null);

  const loadPortfolioData = async () => {
    initializeData();
    
    // Load data from database with fallback
    let data;
    try {
      console.log('🔄 Loading portfolio data...');
      data = await getPortfolioData();
    } catch (error) {
      console.warn('❌ Failed to load from database, using sync fallback:', error);
      data = getPortfolioDataSync();
    }
    
    // Ensure we always have valid data
    if (!data) {
      console.warn('⚠️ No data available, using default data');
      data = getDefaultData();
    }
    
    console.log('Homepage loaded portfolio data:', data?.personalInfo);
    setPortfolioData(data);
  };

  useEffect(() => {
    loadPortfolioData();
    
    // Listen for storage changes to refresh data when updated from admin
    const handleDataUpdate = () => {
      console.log('🔄 Refreshing homepage data due to admin update...');
      loadPortfolioData();
    };
    
    window.addEventListener('storage', handleDataUpdate);
    
    // Listen for custom event for same-tab updates (more reliable)
    window.addEventListener('portfolioDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('storage', handleDataUpdate);
      window.removeEventListener('portfolioDataUpdated', handleDataUpdate);
    };
  }, []);

  if (!portfolioData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white/30 mx-auto mb-4"></div>
          <p>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  const { personalInfo, technicalSkills, projects, experience, education, certifications, achievements, quickFacts, currentFocus } = portfolioData;
  
  // Ensure technicalSkills is always an array (handle both old and new data formats)
  const skillsArray = Array.isArray(technicalSkills) ? technicalSkills : [
    { category: 'Programming Languages', skills: technicalSkills?.languages || [] },
    { category: 'Machine Learning & AI', skills: technicalSkills?.machineLearning || [] },
    { category: 'Web Frontend', skills: technicalSkills?.webFrontend || [] },
    { category: 'Tools & Databases', skills: technicalSkills?.toolsDb || [] },
    { category: 'Soft Skills', skills: technicalSkills?.softSkills || [] }
  ].filter(category => category.skills.length > 0);
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <MobileMenu isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white font-bold text-xl"
            >
              {personalInfo.shortName}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex space-x-6"
            >
              {['About', 'Skills', 'Projects', 'Experience', 'Education', 'Certifications', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                >
                  {item}
                </a>
              ))}
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-white p-2"
            >
              <Menu size={24} />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Hi, I'm{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {personalInfo.shortName}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4">
              {personalInfo.title}
            </p>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              {personalInfo.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            <a
              href={personalInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all duration-200"
            >
              <Github size={20} />
              GitHub
            </a>
            <a
              href={personalInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200"
            >
              <Linkedin size={20} />
              LinkedIn
            </a>
            <a
              href={`mailto:${personalInfo.email}`}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200"
            >
              <Mail size={20} />
              Contact
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-center"
          >
            <div className="animate-bounce">
              <div className="w-6 h-10 border-2 border-white/30 rounded-full mx-auto">
                <div className="w-1 h-3 bg-white rounded-full mx-auto mt-2 animate-pulse"></div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">Scroll to explore</p>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">About Me</h2>
            <p className="text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed">
              {personalInfo.about}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Quick Facts</h3>
              <div className="space-y-4">
                {quickFacts && (
                  <>
                    {quickFacts.location && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300">{quickFacts.location}</span>
                      </div>
                    )}
                    {quickFacts.cgpa && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-300">{quickFacts.cgpa}</span>
                      </div>
                    )}
                    {quickFacts.graduation && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">{quickFacts.graduation}</span>
                      </div>
                    )}
                    {quickFacts.scholarship && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-300">{quickFacts.scholarship}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Current Focus</h3>
              <div className="space-y-4">
                {currentFocus && currentFocus.map((focus: any, index: number) => {
                  const colors = ['blue-400', 'purple-400', 'green-400', 'yellow-400', 'pink-400'];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-2 h-2 bg-${colorClass} rounded-full mt-2`}></div>
                      <div>
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          {focus.icon && <span className="text-lg">{focus.icon}</span>}
                          {focus.title}
                        </h4>
                        <p className="text-gray-400 text-sm">{focus.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Technical Skills</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              My technical expertise spans across various programming languages, frameworks, and tools.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {skillsArray.map((skillCategory: any, index: number) => {
              // Define emojis for different categories
              const categoryEmojis: { [key: string]: string } = {
                'Programming Languages': '💻',
                'Machine Learning & AI': '🤖',
                'Web Frontend': '🌐',
                'Tools & Databases': '🛠️',
                'Cloud Technologies': '☁️',
                'Big Data': '📊',
                'DevOps': '🚀',
                'Soft Skills': '🎯',
                'Databases': '🗄️',
                'Mobile Development': '📱'
              };
              
              const emoji = categoryEmojis[skillCategory.category] || '⚡';
              
              return (
                <motion.div
                  key={skillCategory.category}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
                    {skillCategory.category}
                  </h3>
                  <div className="space-y-2">
                    {skillCategory.skills.map((skill: string) => (
                      <div key={skill} className="text-gray-300 text-sm">• {skill}</div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Featured Projects</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Here are some of my recent projects that showcase my skills in data science, 
              machine learning, and software development.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.filter((project: any) => project.featured).map((project: any, index: number) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 group"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                      {project.title}
                    </h3>
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      {project.year}
                    </span>
                  </div>
                  <p className="text-sm text-purple-400 mb-3">{project.subtitle}</p>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech: string) => (
                      <span
                        key={tech}
                        className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <Github size={16} />
                    <span className="text-sm">Code</span>
                  </a>
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <ExternalLink size={16} />
                      <span className="text-sm">Demo</span>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* All Projects */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h3 className="text-2xl font-bold text-white mb-8 text-center">Other Projects</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {projects.filter((project: any) => !project.featured).map((project: any, index: number) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-white">{project.title}</h4>
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      {project.year}
                    </span>
                  </div>
                  <p className="text-sm text-purple-400 mb-2">{project.subtitle}</p>
                  <p className="text-gray-300 text-sm mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech: string) => (
                      <span
                        key={tech}
                        className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <Github size={16} />
                      <span className="text-sm">View Code</span>
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Experience</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              My professional journey and leadership roles that have shaped my expertise.
            </p>
          </motion.div>

          <div className="space-y-8">
            {experience.map((exp: any, index: number) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
              >
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-xl font-bold text-white mb-2">{exp.title}</h3>
                    <p className="text-purple-400 font-semibold mb-1">{exp.company}</p>
                    <p className="text-gray-400 text-sm mb-2">{exp.location}</p>
                    <p className="text-gray-300 text-sm mb-2">{exp.period}</p>
                    <span className="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs">
                      {exp.type}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <ul className="space-y-3">
                      {exp.description.map((item: string, i: number) => (
                        <li key={i} className="text-gray-300 flex items-start gap-3">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section id="education" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Education</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              My academic journey and the foundation of my technical knowledge.
            </p>
          </motion.div>

          <div className="space-y-8">
            {education.map((edu: any, index: number) => (
              <motion.div
                key={edu.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
              >
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-2">{edu.degree}</h3>
                    <p className="text-purple-400 font-semibold mb-2">{edu.institution}</p>
                    <p className="text-gray-300 text-lg font-semibold mb-4">{edu.grade}</p>
                    {edu.coursework && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Relevant Coursework:</p>
                        <div className="flex flex-wrap gap-2">
                          {edu.coursework.map((course: string) => (
                            <span
                              key={course}
                              className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full"
                            >
                              {course}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1 md:text-right">
                    <p className="text-gray-400 text-sm mb-2">{edu.location}</p>
                    <p className="text-gray-300 text-sm">{edu.period}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Certifications</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Professional certifications that validate my expertise and commitment to continuous learning.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert: any, index: number) => (
              <motion.div
                key={cert.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🏆</span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    {cert.year}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  {cert.title}
                </h3>
                <p className="text-purple-400 text-sm mb-4">{cert.issuer}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {cert.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                {cert.verificationUrl && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <a
                      href={cert.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verify Certificate
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Additional Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-12 bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">Additional Certifications</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">• Introduction to Data Science with Python – edX (2024)</p>
                <p className="text-gray-300 text-sm">• Introduction to Prompt Engineering – edX (2024)</p>
                <p className="text-gray-300 text-sm">• Data Analytics Basics for Everyone (DA0100) – IBM via edX (2024)</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">• Python Basics for Data Science – edX (2024)</p>
                <p className="text-gray-300 text-sm">• Cisco Networking Academy Course – Cisco (2023)</p>
                <p className="text-gray-300 text-sm">• Multiple IBM Cloud and AI certifications</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Achievements Section */}
      <section id="achievements" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Achievements & Recognition</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Recognition for academic excellence, leadership, and contributions to the tech community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {achievements.map((achievement: any, index: number) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-md rounded-2xl p-8 border border-purple-500/20 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl">🏆</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{achievement.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{achievement.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Let's Connect</h2>
            <p className="text-gray-300 mb-12 max-w-2xl mx-auto">
              I'm always open to discussing new opportunities, collaborations, or just having 
              a conversation about data science and technology. Feel free to reach out!
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <a
                href={`mailto:${personalInfo.email}`}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 group"
              >
                <Mail className="w-8 h-8 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-semibold mb-2">Email</h3>
                <p className="text-gray-300 text-sm break-all">{personalInfo.email}</p>
              </a>
              
              <a
                href={`tel:${personalInfo.phone}`}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300 group"
              >
                <Phone className="w-8 h-8 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-semibold mb-2">Phone</h3>
                <p className="text-gray-300 text-sm">{personalInfo.phone}</p>
              </a>
              
              <a
                href={personalInfo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all duration-300 group"
              >
                <Linkedin className="w-8 h-8 text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-semibold mb-2">LinkedIn</h3>
                <p className="text-gray-300 text-sm">Connect with me</p>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 {personalInfo.name}
          </p>
        </div>
      </footer>
    </main>
  );
}

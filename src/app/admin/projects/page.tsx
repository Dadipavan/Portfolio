'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Save,
  Eye,
  EyeOff,
  Github,
  ExternalLink,
  Calendar,
  Star
} from 'lucide-react';
import { getPortfolioDataSync, updatePortfolioSection } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';

interface Project {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  technologies: string[];
  year: string;
  featured: boolean;
  githubUrl?: string;
  liveUrl?: string;
  status: 'completed' | 'in-progress' | 'planned';
  startDate?: string;
  endDate?: string;
  images?: string[];
  keyFeatures?: string[];
  challenges?: string;
  solutions?: string;
  learnings?: string;
  teamSize?: number;
  role?: string;
}

export default function ProjectsAdmin() {
  return (
    <AdminLayout>
      <ProjectsContent />
    </AdminLayout>
  );
}

function ProjectsContent() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const data = getPortfolioDataSync();
    if (data) {
      // Map existing projects to the new interface
      const mappedProjects = data.projects.map(p => ({
        ...p,
        status: (p as any).status || 'completed',
        liveUrl: (p as any).liveUrl,
        startDate: (p as any).startDate,
        endDate: (p as any).endDate,
        images: (p as any).images || [],
        keyFeatures: (p as any).keyFeatures || [],
        challenges: (p as any).challenges,
        solutions: (p as any).solutions,
        learnings: (p as any).learnings,
        teamSize: (p as any).teamSize,
        role: (p as any).role,
      })) as Project[];
      setProjects(mappedProjects);
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    try {
      await updatePortfolioSection('projects', projects);
      console.log('✅ Projects updated successfully');
      
      setShowForm(false);
      setEditingProject(null);
    } catch (error) {
      console.error('❌ Failed to update projects:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleAddProject = () => {
    const newProject: Project = {
      id: Math.max(...projects.map(p => p.id), 0) + 1,
      title: '',
      subtitle: '',
      description: '',
      technologies: [],
      year: new Date().getFullYear().toString(),
      featured: false,
      status: 'completed',
    };
    setEditingProject(newProject);
    setShowForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject({ ...project });
    setShowForm(true);
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter(p => p.id !== id);
      setProjects(updatedProjects);
      
      try {
        await updatePortfolioSection('projects', updatedProjects);
        console.log('✅ Project deleted successfully');
      } catch (error) {
        console.error('❌ Failed to delete project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const updatedProjects = editingProject.id && projects.find(p => p.id === editingProject.id)
      ? projects.map(p => p.id === editingProject.id ? editingProject : p)
      : [...projects, editingProject];

    setProjects(updatedProjects);
    
    try {
      await updatePortfolioSection('projects', updatedProjects);
      console.log('✅ Project updated successfully');
      
      setShowForm(false);
      setEditingProject(null);
    } catch (error) {
      console.error('❌ Failed to update project:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const updateField = (field: keyof Project, value: any) => {
    if (!editingProject) return;
    setEditingProject({ ...editingProject, [field]: value });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <a href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft size={20} />
              </a>
              <h1 className="text-xl font-semibold text-gray-900">Manage Projects</h1>
            </div>
            <button
              onClick={handleAddProject}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Plus size={16} />
              Add Project
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showForm ? (
          /* Projects List */
          <div className="space-y-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                      {project.featured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                        project.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-purple-600 text-sm mb-2">{project.subtitle}</p>
                    <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {project.year}
                      </span>
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" className="flex items-center gap-1 hover:text-gray-700">
                          <Github size={14} />
                          Code
                        </a>
                      )}
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" className="flex items-center gap-1 hover:text-gray-700">
                          <ExternalLink size={14} />
                          Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {projects.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first project</p>
                <button
                  onClick={handleAddProject}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Add Your First Project
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Project Form */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProject?.id && projects.find(p => p.id === editingProject.id) ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={editingProject?.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle/Tagline
                  </label>
                  <input
                    type="text"
                    value={editingProject?.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={editingProject?.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    value={editingProject?.year || ''}
                    onChange={(e) => updateField('year', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingProject?.status || 'completed'}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProject?.featured || false}
                      onChange={(e) => updateField('featured', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Project</span>
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={editingProject?.githubUrl || ''}
                    onChange={(e) => updateField('githubUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={editingProject?.liveUrl || ''}
                    onChange={(e) => updateField('liveUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technologies (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingProject?.technologies?.join(', ') || ''}
                  onChange={(e) => updateField('technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                  placeholder="React, TypeScript, Node.js, MongoDB"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Save size={16} />
                  Save Project
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
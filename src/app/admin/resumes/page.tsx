'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles, UserPen, Wand2, Upload, Download, Edit, Trash2, FileText, Plus, Save, X, Eye, Cloud, HardDrive, Globe, Lock, ShieldCheck } from 'lucide-react';
import { Resume, getPortfolioData } from '@/lib/dataManager';
import { ResumeManager } from '@/lib/resumeManager';
import { mergeSiteSettings } from '@/lib/siteSettings';
import type { RoleDef } from '@/lib/types';
import AdminLayout from '@/components/AdminLayout';
import ResumeBuilder, { type BuilderMode } from '@/components/admin/ResumeBuilder';
import { isRecipe, type ResumeRecipe } from '@/lib/resume/recipe';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const textareaStyles = "w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm resize-none";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

export default function ResumesAdmin() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [cloudFiles, setCloudFiles] = useState<any[]>([]);
  const [showCloudModal, setShowCloudModal] = useState(false);
  // the resume builder replaces the list while it is open
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderRecipe, setBuilderRecipe] = useState<ResumeRecipe | null>(null);
  const [builderMode, setBuilderMode] = useState<BuilderMode>('jd');
  const [buildMenu, setBuildMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Resume>>({
    name: '',
    description: '',
    fileName: '',
    fileSize: '',
    fileType: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // the roles set up in Admin > Roles, so a resume can be written for one of them
  const [roles, setRoles] = useState<RoleDef[]>([]);

  useEffect(() => {
    loadResumes();
    getPortfolioData()
      .then((data) => setRoles(mergeSiteSettings(data.siteSettings).roles))
      .catch(() => undefined);
  }, []);

  const loadResumes = async () => {
    try {
      const resumeList = await ResumeManager.getAllResumes();
      console.log('🔍 Loaded resumes:', resumeList);
      // Ensure we always have an array
      const safeResumeList = Array.isArray(resumeList) ? resumeList : [];
      setResumes(safeResumeList);
    } catch (error) {
      console.error('Error loading resumes:', error);
      setResumes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCloudFiles = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching cloud files...');
      
      const res = await fetch('/api/resumes/list');
      console.log('📡 API Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      console.log('📦 API Response:', json);
      
      if (json.success) {
        console.log('✅ Cloud files fetched successfully:', json.files?.length || 0);
        setCloudFiles(json.files || []);
        setShowCloudModal(true);
        
        if (json.files?.length === 0) {
          alert('No files found in cloud storage. Upload some files first.');
        }
      } else {
        console.error('❌ API error:', json.error);
        alert(`Failed to fetch cloud files: ${json.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('💥 Fetch cloud files failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to connect to server: ${errorMessage}\n\nPlease check:\n- Internet connection\n- Supabase configuration\n- Server status`);
    } finally {
      setLoading(false);
    }
  }

  const importCloudFile = async (file: any) => {
    try {
      console.log('Importing cloud file:', file);
      // Convert to Resume shape and save via ResumeManager
      const resume = await ResumeManager.uploadResumeFromCloud({
        name: file.name,
        publicUrl: file.publicUrl,
        size: file.size,
        mimeType: file.mimeType
      });
      
      await loadResumes();
      setShowCloudModal(false);
      alert('Successfully imported: ' + file.name);
    } catch (err) {
      console.error('Import failed:', err);
      alert('Import failed for ' + file.name + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  // Same checks as the dashboard's System check, limited to what matters for resumes
  const testConnection = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/health', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert('The check could not run: ' + (json.error || res.statusText));
        return;
      }
      const icons: Record<string, string> = { ok: '✅', warn: '⚠️', error: '❌', info: 'ℹ️' };
      const wanted = ['database', 'resume-bucket', 'public-resume', 'public-listing'];
      alert(
        json.checks
          .filter((c: { id: string }) => wanted.includes(c.id))
          .map((c: { status: string; label: string; message: string }) => `${icons[c.status]} ${c.label}: ${c.message}`)
          .join('\n\n')
      );
    } catch (err) {
      alert('The check could not run: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type (only allow PDF, DOC, DOCX, TXT)
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only PDF, DOC, DOCX, or TXT files.');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }

      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!selectedFile && editingIndex === null) {
      alert('Please select a file to upload.');
      return;
    }

    setUploading(true);

    try {
      if (editingIndex !== null) {
        // Update existing resume metadata
        const success = await ResumeManager.updateResume(resumes[editingIndex].id, {
          name: formData.name,
          description: formData.description
        });
        
        if (success) {
          await loadResumes(); // Reload to get updated data
        } else {
          throw new Error('Failed to update resume');
        }
      } else if (selectedFile) {
        // Upload new resume
        await ResumeManager.uploadResume(
          selectedFile,
          formData.name!,
          formData.description!
        );
        
        await loadResumes(); // Reload to get new data
      }

      // Reset form
      setShowAddForm(false);
      setEditingIndex(null);
      setFormData({
        name: '',
        description: '',
        fileName: '',
        fileSize: '',
        fileType: ''
      });
      setSelectedFile(null);
    } catch (error) {
      console.error('Error saving resume:', error);
      alert(`Error ${editingIndex !== null ? 'updating' : 'uploading'} resume. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (resume: Resume, index: number) => {
    setFormData({
      name: resume.name,
      description: resume.description,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      fileType: resume.fileType
    });
    setEditingIndex(index);
    setShowAddForm(true);
    setSelectedFile(null);
  };

  const handleDelete = async (resume: Resume, index: number) => {
    if (confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      try {
        const success = await ResumeManager.deleteResume(resume);
        if (success) {
          await loadResumes(); // Reload to get updated data
        } else {
          throw new Error('Failed to delete resume');
        }
      } catch (error) {
        console.error('Error deleting resume:', error);
        alert('Error deleting resume. Please try again.');
      }
    }
  };

  const handleDownload = async (resume: Resume) => {
    try {
      await ResumeManager.downloadResume(resume);
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const handleTogglePublic = async (resume: Resume) => {
    const success = await ResumeManager.setResumePublic(resume.id, !resume.isPublic);
    if (success) {
      await loadResumes();
    } else {
      alert('Could not update this resume. Please try again.');
    }
  };

  const handleRoleChange = async (resume: Resume, role: string) => {
    const success = await ResumeManager.updateResume(resume.id, { role });
    if (success) {
      await loadResumes();
    } else {
      alert('Could not update the role of this resume. Please try again.');
    }
  };

  const getStorageIcon = (storageType?: string) => {
    if (storageType === 'cloud') {
      return <Cloud size={14} className="text-blue-500" />;
    }
    return <HardDrive size={14} className="text-gray-500" />;
  };

  const getStorageText = (storageType?: string) => {
    if (storageType === 'cloud') {
      return 'Cloud Storage';
    }
    return 'Local Storage';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (builderOpen) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <ResumeBuilder
            initialMode={builderMode}
            initialRecipe={builderRecipe}
            onClose={() => setBuilderOpen(false)}
            onSaved={() => {
              setBuilderOpen(false);
              loadResumes();
            }}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 ring-1 ring-purple-200/70 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">Resume Management</h2>
                <p className="text-sm text-gray-500">Upload and manage resumes. Only the one marked Public appears on your site.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="relative"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setBuildMenu(false);
                }}
                onKeyDown={(e) => e.key === 'Escape' && setBuildMenu(false)}
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={buildMenu}
                  onClick={() => setBuildMenu((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Wand2 size={16} />
                  Build resume
                  <ChevronDown size={14} className={`transition-transform ${buildMenu ? 'rotate-180' : ''}`} />
                </button>
                {buildMenu && (
                  <div role="menu" className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    {([
                      { mode: 'own' as const, icon: UserPen, title: 'Build my own', text: 'Tick what to include from your portfolio and edit every part.' },
                      { mode: 'jd' as const, icon: Sparkles, title: 'Build from a job description', text: 'Paste a JD and get keyword matches and recommendations.' },
                    ]).map((o) => (
                      <button
                        key={o.mode}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setBuildMenu(false);
                          setBuilderRecipe(null);
                          setBuilderMode(o.mode);
                          setBuilderOpen(true);
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-emerald-50"
                      >
                        <o.icon size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span>
                          <span className="block text-sm font-medium text-gray-900">{o.title}</span>
                          <span className="block text-xs text-gray-500">{o.text}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={testConnection}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors shadow-sm text-sm"
                title="Check the database and storage setup"
              >
                <ShieldCheck size={14} />
                Test
              </button>
              <button
                onClick={fetchCloudFiles}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Cloud size={16} />
                Sync Cloud Files
              </button>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingIndex(null);
                  setFormData({
                    name: '',
                    description: '',
                    fileName: '',
                    fileSize: '',
                    fileType: ''
                  });
                  setSelectedFile(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Plus size={16} />
                Upload Resume
              </button>
            </div>
          </div>

          {/* Upload/Edit Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingIndex !== null ? 'Edit Resume' : 'Upload New Resume'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingIndex(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={labelStyles}>Resume Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={inputStyles}
                    placeholder="e.g., Software Engineer Resume 2024, Data Science Resume"
                    required
                  />
                </div>
                
                <div>
                  <label className={labelStyles}>Description *</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={textareaStyles}
                    rows={3}
                    placeholder="Brief description of this resume version, target roles, or specific focus areas..."
                    required
                  />
                </div>

                <div>
                  <label className={labelStyles}>
                    {editingIndex !== null ? 'Replace File (Optional)' : 'Upload File *'}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT up to 10MB</p>
                      {selectedFile && (
                        <p className="text-sm text-green-600 font-medium">
                          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingIndex(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploading || !formData.name || !formData.description || (!selectedFile && editingIndex === null)}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {uploading ? 'Processing...' : (editingIndex !== null ? 'Update Resume' : 'Upload Resume')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Cloud Files Modal */}
          {showCloudModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowCloudModal(false)}
            >
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-4 sm:p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Cloud className="w-6 h-6 text-blue-500" />
                    Cloud Files ({cloudFiles.length})
                  </h3>
                  <button
                    onClick={() => setShowCloudModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-auto py-1">
                  {cloudFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No cloud files found</h4>
                      <p className="text-gray-500">Upload some files first to see them here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cloudFiles.map((file, index) => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{file.name}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="truncate">📊 {formatFileSize(file.size)}</span>
                                <span>📅 {new Date(file.createdAt).toLocaleDateString()}</span>
                                <span className="truncate">🔗 {file.mimeType}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <a
                              href={file.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View File"
                            >
                              <Eye size={16} />
                            </a>
                            <a
                              href={file.publicUrl}
                              download={file.name}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download File"
                            >
                              <Download size={16} />
                            </a>
                            <button
                              onClick={() => importCloudFile(file)}
                              className="px-3 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors"
                              title="Import to Portfolio"
                            >
                              Import
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowCloudModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={fetchCloudFiles}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Cloud size={16} />
                    Refresh
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Resumes List */}
          <div className="space-y-4">
            {resumes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded yet</h3>
                <p className="text-gray-500 mb-4">Start by uploading your first resume</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <Upload size={16} />
                  Upload Your First Resume
                </button>
              </div>
            ) : (
              Array.isArray(resumes) && resumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{resume.name}</h3>
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                            {getStorageIcon(resume.storageType)}
                            <span className="text-xs text-gray-600">{getStorageText(resume.storageType)}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{resume.description}</p>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <label htmlFor={`resume-role-${resume.id}`} className="text-xs font-medium text-gray-600">
                            Offered when visitors choose
                          </label>
                          <select
                            id={`resume-role-${resume.id}`}
                            value={resume.role || ''}
                            onChange={(e) => handleRoleChange(resume, e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
                          >
                            <option value="">Any role (the general resume)</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.title || role.label}
                              </option>
                            ))}
                            {resume.role && !roles.some((role) => role.id === resume.role) && <option value={resume.role}>{resume.role} (role removed)</option>}
                          </select>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>📄 {resume.fileName}</span>
                          <span>📊 {resume.fileSize}</span>
                          <span>📅 {new Date(resume.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublic(resume)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          resume.isPublic
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={resume.isPublic ? 'Offered to visitors. Click to make private' : 'Private. Click to offer it to visitors'}
                      >
                        {resume.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                        {resume.isPublic ? 'Public' : 'Private'}
                      </button>
                      <button
                        onClick={() => handleDownload(resume)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Resume"
                      >
                        <Download size={16} />
                      </button>
                      {isRecipe(resume.builder) && (
                        <button
                          onClick={() => {
                            setBuilderRecipe(resume.builder as ResumeRecipe);
                            setBuilderOpen(true);
                          }}
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Open in the resume builder"
                        >
                          <Wand2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(resume, index)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Resume"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(resume, index)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Resume"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
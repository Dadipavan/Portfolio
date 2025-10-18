'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Edit, Trash2, FileText, Plus, Save, X, Eye, Cloud, HardDrive } from 'lucide-react';
import { Resume } from '@/lib/dataManager';
import { ResumeManager } from '@/lib/resumeManager';
import AdminLayout from '@/components/AdminLayout';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const textareaStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm resize-none";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

export default function ResumesAdmin() {
  const [resumes, setResumes] = useState<Resume[]>([]);
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
  const [preferCloud, setPreferCloud] = useState(true);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const resumeList = await ResumeManager.getAllResumes();
      setResumes(resumeList);
    } catch (error) {
      console.error('Error loading resumes:', error);
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
          formData.description!,
          preferCloud
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

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Resume Management</h2>
                <p className="text-sm text-gray-500">Upload, manage, and download your resumes (Admin Only)</p>
              </div>
            </div>
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Upload Resume
            </button>
          </div>

          {/* Upload/Edit Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
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
                {/* Storage Preference */}
                {editingIndex === null && (
                  <div>
                    <label className={labelStyles}>Storage Preference</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={preferCloud}
                          onChange={() => setPreferCloud(true)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <Cloud size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-700">Cloud Storage (Recommended)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!preferCloud}
                          onChange={() => setPreferCloud(false)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <HardDrive size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700">Local Storage</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Cloud storage allows you to access files from anywhere. Local storage saves files in browser only.
                    </p>
                  </div>
                )}

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
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {uploading ? 'Processing...' : (editingIndex !== null ? 'Update Resume' : 'Upload Resume')}
                </button>
              </div>
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Upload size={16} />
                  Upload Your First Resume
                </button>
              </div>
            ) : (
              resumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
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
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>📄 {resume.fileName}</span>
                          <span>📊 {resume.fileSize}</span>
                          <span>📅 {new Date(resume.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(resume)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Resume"
                      >
                        <Download size={16} />
                      </button>
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
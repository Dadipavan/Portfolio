'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Edit, Trash2, FileText, Plus, Save, X, Eye } from 'lucide-react';
import { getPortfolioData, updatePortfolioSection } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const textareaStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm resize-none";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

interface Resume {
  id: string;
  name: string;
  description: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  fileData?: string; // Base64 encoded file data
  fileType: string;
}

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

  useEffect(() => {
    const data = getPortfolioData();
    if (data?.resumes) {
      setResumes(data.resumes);
    }
    setLoading(false);
  }, []);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
      // Check file type (only allow PDF, DOC, DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only PDF, DOC, or DOCX files.');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
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

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
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
      let fileData = '';
      if (selectedFile) {
        fileData = await convertFileToBase64(selectedFile);
      }

      const newResume: Resume = {
        id: editingIndex !== null ? resumes[editingIndex].id : generateId(),
        name: formData.name!,
        description: formData.description!,
        fileName: formData.fileName!,
        fileSize: formData.fileSize!,
        fileType: formData.fileType!,
        uploadDate: editingIndex !== null ? resumes[editingIndex].uploadDate : new Date().toISOString(),
        fileData: selectedFile ? fileData : (editingIndex !== null ? resumes[editingIndex].fileData : '')
      };

      const updatedResumes = [...resumes];
      if (editingIndex !== null) {
        updatedResumes[editingIndex] = newResume;
      } else {
        updatedResumes.push(newResume);
      }

      setResumes(updatedResumes);
      updatePortfolioSection('resumes', updatedResumes);

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
      alert('Error uploading file. Please try again.');
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

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      const updatedResumes = resumes.filter((_, i) => i !== index);
      setResumes(updatedResumes);
      updatePortfolioSection('resumes', updatedResumes);
    }
  };

  const handleDownload = (resume: Resume) => {
    if (!resume.fileData) {
      alert('File data not available for download.');
      return;
    }

    try {
      // Convert base64 to blob
      const base64Data = resume.fileData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: resume.fileType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading file. Please try again.');
    }
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
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 5MB</p>
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
                  {uploading ? 'Uploading...' : (editingIndex !== null ? 'Update Resume' : 'Upload Resume')}
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{resume.name}</h3>
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
                        onClick={() => handleDelete(index)}
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
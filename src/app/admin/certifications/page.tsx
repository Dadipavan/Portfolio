'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Award, Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { getPortfolioDataSync, updatePortfolioSection } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

interface Certification {
  title: string;
  issuer: string;
  year: string;
  skills: string[];
  verificationUrl: string;
  // optional file fields
  imageUrl?: string;
  imageFileName?: string;
  storageType?: 'local' | 'cloud';
}

export default function CertificationsAdmin() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<Certification>({
    title: '',
    issuer: '',
    year: '',
    skills: [],
    verificationUrl: '',
    imageUrl: undefined,
    imageFileName: undefined,
    storageType: undefined,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const data = getPortfolioDataSync();
    if (data?.certifications) {
      setCertifications(data.certifications);
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      await updatePortfolioSection('certifications', certifications);
      console.log('✅ Certifications updated successfully');
      
      setTimeout(() => {
        setSaving(false);
        alert('Certifications updated successfully!');
      }, 500);
    } catch (error) {
      console.error('❌ Failed to update certifications:', error);
      setSaving(false);
      alert('Failed to save changes. Please try again.');
    }
  };

  const addCertification = async () => {
    const newCertification: Certification = {
      ...formData,
      skills: formData.skills.filter(s => s.trim()),
    };
    const updated = [...certifications, newCertification];
    setCertifications(updated);

    // persist immediately
    try {
      await updatePortfolioSection('certifications', updated);
      console.log('✅ Certification added');
    } catch (err) {
      console.error('Failed to persist certifications after add:', err);
      alert('Failed to save certification. Please try again.');
    }

    resetForm();
    setShowAddForm(false);
  };

  const updateCertification = (index: number) => {
    const updatedCertifications = [...certifications];
    updatedCertifications[index] = {
      ...formData,
      skills: formData.skills.filter(s => s.trim()),
    };
    setCertifications(updatedCertifications);

    // persist immediately
    updatePortfolioSection('certifications', updatedCertifications)
      .then(() => console.log('✅ Certification updated'))
      .catch(err => {
        console.error('Failed to persist certifications after update:', err);
        alert('Failed to save changes. Please try again.');
      });

    resetForm();
    setEditingIndex(null);
  };

  const deleteCertification = (index: number) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      const certToDelete = certifications[index];

      const doDelete = async () => {
        // if file in cloud, try to remove it
        if ((certToDelete as any).storageType === 'cloud' && (certToDelete as any).imageFileName) {
          await deleteFileFromServer((certToDelete as any).imageFileName);
        }

        const updated = certifications.filter((_, i) => i !== index);
        setCertifications(updated);

        // persist immediately
        updatePortfolioSection('certifications', updated)
          .then(() => console.log('✅ Certification deleted'))
          .catch(err => {
            console.error('Failed to persist certifications after delete:', err);
            alert('Failed to delete certification. Please try again.');
          });
      };

      doDelete();
    }
  };

  const moveCertification = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= certifications.length) return;

    const updated = [...certifications];
    const [item] = updated.splice(index, 1);
    updated.splice(newIndex, 0, item);
    setCertifications(updated);

    // Persist new order immediately
    try {
      await updatePortfolioSection('certifications', updated);
      console.log(`✅ Moved certification ${index} ${direction}`);
    } catch (error) {
      console.error('❌ Failed to persist certifications order:', error);
      alert('Failed to save order change. Changes have been reverted.');
      // revert locally
      setCertifications(certifications);
    }
  };

  const startEdit = (cert: Certification, index: number) => {
    setFormData({
      title: cert.title,
      issuer: cert.issuer,
      year: cert.year,
      skills: [...cert.skills],
      verificationUrl: cert.verificationUrl || '',
      imageUrl: (cert as any).imageUrl,
      imageFileName: (cert as any).imageFileName,
      storageType: (cert as any).storageType,
    });
    setEditingIndex(index);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      issuer: '',
      year: '',
      skills: [],
      verificationUrl: '',
    });
    setEditingIndex(null);
    setShowAddForm(false);
  };

  // Upload helper: sends file to serverless API which stores in 'certificates' bucket
  const uploadFileToServer = async (file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload/certificate', {
        method: 'POST',
        body: fd,
      });

      const json = await res.json();
      setUploading(false);

      if (!json.success) throw new Error(json.error || 'Upload failed');
      return { fileName: json.fileName, publicUrl: json.publicUrl };
    } catch (err) {
      setUploading(false);
      console.error('Upload error:', err);
      alert('File upload failed. See console for details.');
      return null;
    }
  };

  const deleteFileFromServer = async (fileName?: string) => {
    if (!fileName) return false;
    try {
      const res = await fetch('/api/upload/certificate/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
      const json = await res.json();
      return json.success;
    } catch (err) {
      console.error('Delete file error:', err);
      return false;
    }
  };

  const handleFileChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    const result = await uploadFileToServer(file);
    if (result) {
      setFormData({
        ...formData,
        imageUrl: result.publicUrl,
        imageFileName: result.fileName,
        storageType: 'cloud'
      });
      setSelectedFile(null);
    }
  };

  const removeImageFromForm = async () => {
    if (formData.storageType === 'cloud' && formData.imageFileName) {
      const ok = await deleteFileFromServer(formData.imageFileName);
      if (!ok) {
        alert('Failed to delete file from storage. Check console for details.');
        return;
      }
    }

    setFormData({ ...formData, imageUrl: undefined, imageFileName: undefined, storageType: undefined });
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...formData.skills];
    newSkills[index] = value;
    setFormData({ ...formData, skills: newSkills });
  };

  const addSkill = () => {
    setFormData({ 
      ...formData, 
      skills: [...formData.skills, '']
    });
  };

  const removeSkill = (index: number) => {
    const newSkills = [...formData.skills];
    newSkills.splice(index, 1);
    setFormData({ ...formData, skills: newSkills });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Certifications Management</h1>
                <p className="text-gray-600">Manage your professional certifications</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Add Certification
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save All'}
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingIndex !== null) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6"
          >
            <h3 className="text-lg font-semibold text-blue-600 mb-4">
              {editingIndex !== null ? 'Edit Certification' : 'Add New Certification'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={labelStyles}>Certification Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputStyles}
                  placeholder="e.g., Java Programming [Beginner to Advanced]"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Issuing Organization *</label>
                  <input
                    type="text"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    className={inputStyles}
                    placeholder="e.g., GeeksforGeeks"
                    required
                  />
                </div>
                <div>
                  <label className={labelStyles}>Year *</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className={inputStyles}
                    placeholder="e.g., 2025"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelStyles}>Verification URL</label>
                <input
                  type="url"
                  value={formData.verificationUrl}
                  onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
                  className={inputStyles}
                  placeholder="e.g., https://certificates.example.com/verify/abc123"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Add a URL where visitors can verify this certificate
                </p>
              </div>

              <div>
                <label className={labelStyles}>Certificate Image / PDF (optional)</label>
                <div className="flex items-center gap-4 mb-2">
                  {formData.imageUrl ? (
                    <div className="flex items-center gap-3">
                      {/* Show image preview if it's an image, otherwise show link for PDFs */}
                      {formData.imageUrl.endsWith('.pdf') ? (
                        <a href={formData.imageUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View PDF</a>
                      ) : (
                        <img src={formData.imageUrl} alt="cert preview" className="w-28 h-20 object-cover rounded-md border" />
                      )}
                      <button
                        type="button"
                        onClick={removeImageFromForm}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No file attached</div>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="w-full"
                />
                {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
              </div>

              <div>
                <label className={labelStyles}>Skills/Technologies</label>
                <div className="space-y-2">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateSkill(index, e.target.value)}
                        className={inputStyles}
                        placeholder="e.g., OOP"
                      />
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSkill}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Add Skill
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingIndex !== null ? () => updateCertification(editingIndex) : addCertification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingIndex !== null ? 'Update' : 'Add'} Certification
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Certifications List */}
        <div className="space-y-4">
          {certifications.map((cert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{cert.title}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {cert.year}
                    </span>
                  </div>
                  <p className="text-purple-600 font-medium mb-3">{cert.issuer}</p>
                  {cert.skills && cert.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {cert.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <div className="flex flex-col gap-1 mr-1">
                    <button
                      onClick={() => moveCertification(index, 'up')}
                      disabled={index === 0}
                      title="Move up"
                      className={`p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors ${index === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:text-gray-700'}`}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => moveCertification(index, 'down')}
                      disabled={index === certifications.length - 1}
                      title="Move down"
                      className={`p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors ${index === certifications.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:text-gray-700'}`}
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => startEdit(cert, index)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteCertification(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {certifications.length === 0 && (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Certifications Added</h3>
              <p className="text-gray-500 mb-4">Start by adding your professional certifications.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Certification
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

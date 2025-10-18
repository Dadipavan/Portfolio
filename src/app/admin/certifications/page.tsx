'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Award, Plus, Edit, Trash2 } from 'lucide-react';
import { getPortfolioData, updatePortfolioSection } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

interface Certification {
  title: string;
  issuer: string;
  year: string;
  skills: string[];
  verificationUrl: string;
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
  });

  useEffect(() => {
    const data = getPortfolioData();
    if (data?.certifications) {
      setCertifications(data.certifications);
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    updatePortfolioSection('certifications', certifications);
    setTimeout(() => {
      setSaving(false);
      alert('Certifications updated successfully!');
    }, 500);
  };

  const addCertification = () => {
    const newCertification: Certification = {
      ...formData,
      skills: formData.skills.filter(s => s.trim()),
    };
    setCertifications([...certifications, newCertification]);
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
    resetForm();
    setEditingIndex(null);
  };

  const deleteCertification = (index: number) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      setCertifications(certifications.filter((_, i) => i !== index));
    }
  };

  const startEdit = (cert: Certification, index: number) => {
    setFormData({
      title: cert.title,
      issuer: cert.issuer,
      year: cert.year,
      skills: [...cert.skills],
      verificationUrl: cert.verificationUrl || '',
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

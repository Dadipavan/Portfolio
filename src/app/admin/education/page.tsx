'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, GraduationCap, Plus, Edit, Trash2 } from 'lucide-react';
import { getPortfolioDataForEditing, updatePortfolioSection } from '@/lib/dataManager';
import AdminLoadError from '@/components/AdminLoadError';
import AdminLayout from '@/components/AdminLayout';
import { PageBanner } from '@/components/admin/kit';
import { useDraftSync } from '@/lib/previewBus';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

interface Education {
  id: number;
  institution: string;
  degree: string;
  location: string;
  period: string;
  grade: string;
  coursework?: string[];
}

export default function EducationAdmin() {
  const [education, setEducation] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<Omit<Education, 'id'>>({
    institution: '',
    degree: '',
    location: '',
    period: '',
    grade: '',
    coursework: [],
  });

  const [loadError, setLoadError] = useState<string | null>(null);

  // show unsaved edits in the live preview
  useDraftSync('education', education, !loading);

  useEffect(() => {
    getPortfolioDataForEditing().then((data) => {
    if (data?.education) {
      setEducation(data.education);
    }
    }).catch((error: Error) => {
      console.error('Failed to load saved content:', error);
      setLoadError(error.message);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      await updatePortfolioSection('education', education);
      console.log('✅ Education updated successfully');
      
      setTimeout(() => {
        setSaving(false);
        alert('Education updated successfully!');
      }, 500);
    } catch (error) {
      console.error('❌ Failed to update education:', error);
      setSaving(false);
      alert('Failed to save changes. Please try again.');
    }
  };

  const addEducation = () => {
    const newEducation: Education = {
      ...formData,
      id: Math.max(0, ...education.map(e => e.id)) + 1,
      coursework: formData.coursework?.filter(c => c.trim()) || [],
    };
    setEducation([...education, newEducation]);
    resetForm();
    setShowAddForm(false);
  };

  const updateEducation = (id: number) => {
    setEducation(education.map(e => 
      e.id === id 
        ? { ...formData, id, coursework: formData.coursework?.filter(c => c.trim()) || [] }
        : e
    ));
    resetForm();
    setEditingId(null);
  };

  const deleteEducation = (id: number) => {
    if (confirm('Are you sure you want to delete this education entry?')) {
      setEducation(education.filter(e => e.id !== id));
    }
  };

  const startEdit = (edu: Education) => {
    setFormData({
      institution: edu.institution,
      degree: edu.degree,
      location: edu.location,
      period: edu.period,
      grade: edu.grade,
      coursework: edu.coursework || [],
    });
    setEditingId(edu.id);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      institution: '',
      degree: '',
      location: '',
      period: '',
      grade: '',
      coursework: [],
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const updateCoursework = (index: number, value: string) => {
    const newCoursework = [...(formData.coursework || [])];
    newCoursework[index] = value;
    setFormData({ ...formData, coursework: newCoursework });
  };

  const addCoursework = () => {
    setFormData({ 
      ...formData, 
      coursework: [...(formData.coursework || []), '']
    });
  };

  const removeCoursework = (index: number) => {
    const newCoursework = [...(formData.coursework || [])];
    newCoursework.splice(index, 1);
    setFormData({ ...formData, coursework: newCoursework });
  };

  if (loadError) {
    return (
      <AdminLayout>
        <AdminLoadError message={loadError} />
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <PageBanner
            icon={GraduationCap}
            tone="green"
            title="Education Management"
            subtitle="Manage your educational background"
            chips={[`${education.length} ${education.length === 1 ? 'entry' : 'entries'}`]}
          >
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-b from-green-500 to-green-600 text-white rounded-xl shadow-sm hover:from-green-600 hover:to-green-700 transition whitespace-nowrap"
            >
              <Plus size={16} />
              Add Education
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-xl shadow-sm hover:from-purple-600 hover:to-purple-700 transition whitespace-nowrap disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </PageBanner>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId !== null) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm mb-6"
          >
            <h3 className="text-lg font-semibold text-green-600 mb-4">
              {editingId ? 'Edit Education' : 'Add New Education'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Institution *</label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className={inputStyles}
                    placeholder="e.g., Seshadri Rao Gudlavalleru Engineering College"
                    required
                  />
                </div>
                <div>
                  <label className={labelStyles}>Degree *</label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className={inputStyles}
                    placeholder="e.g., B.Tech in Information Technology"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className={labelStyles}>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={inputStyles}
                    placeholder="e.g., Krishna (dt)"
                  />
                </div>
                <div>
                  <label className={labelStyles}>Period *</label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className={inputStyles}
                    placeholder="e.g., Oct 2022 – Jun 2026 (Expected)"
                    required
                  />
                </div>
                <div>
                  <label className={labelStyles}>Grade/Score *</label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className={inputStyles}
                    placeholder="e.g., CGPA: 9.1/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelStyles}>Coursework (Optional)</label>
                <div className="space-y-2">
                  {formData.coursework?.map((course, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={course}
                        onChange={(e) => updateCoursework(index, e.target.value)}
                        className={inputStyles}
                        placeholder="e.g., Operating Systems"
                      />
                      <button
                        type="button"
                        onClick={() => removeCoursework(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCoursework}
                    className="text-green-600 hover:text-green-700 text-sm"
                  >
                    + Add Coursework
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingId ? () => updateEducation(editingId) : addEducation}
                  className="px-4 py-2 bg-gradient-to-b from-green-500 to-green-600 text-white rounded-xl shadow-sm hover:from-green-600 hover:to-green-700 transition whitespace-nowrap"
                >
                  {editingId ? 'Update' : 'Add'} Education
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

        {/* Education List */}
        <div className="space-y-4">
          {education.map((edu, index) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:border-purple-200 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{edu.degree}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {edu.grade}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 font-medium text-purple-700"><GraduationCap size={15} className="shrink-0 text-purple-400" aria-hidden="true" />{edu.institution}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>{edu.period}</span>
                    {edu.location && <span>• {edu.location}</span>}
                  </div>
                  {edu.coursework && edu.coursework.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Coursework:</p>
                      <div className="flex flex-wrap gap-2">
                        {edu.coursework.map((course, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 ring-1 ring-gray-200/70"
                          >
                            {course}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center self-start rounded-xl border border-gray-200 bg-gray-50/70 p-0.5">
                  <button
                    onClick={() => startEdit(edu)}
                    title="Edit"
                    aria-label={`Edit ${edu.degree}`}
                    className="rounded-lg p-2 text-gray-500 hover:text-blue-600 hover:bg-white hover:shadow-sm transition"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteEducation(edu.id)}
                    title="Delete"
                    aria-label={`Delete ${edu.degree}`}
                    className="rounded-lg p-2 text-gray-500 hover:text-red-600 hover:bg-white hover:shadow-sm transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {education.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Education Added</h3>
              <p className="text-gray-500 mb-4">Start by adding your educational background.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-gradient-to-b from-green-500 to-green-600 text-white rounded-xl shadow-sm hover:from-green-600 hover:to-green-700 transition whitespace-nowrap"
              >
                Add First Education
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Settings, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getPortfolioDataForEditing, updatePortfolioSection } from '@/lib/dataManager';
import AdminLoadError from '@/components/AdminLoadError';
import AdminLayout from '@/components/AdminLayout';
import { PageBanner } from '@/components/admin/kit';
import { useDraftSync } from '@/lib/previewBus';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

interface SkillCategory {
  category: string;
  emoji: string;
  skills: string[];
}

export default function SkillsAdmin() {
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<SkillCategory>({
    category: '',
    emoji: '',
    skills: []
  });
  const [newSkill, setNewSkill] = useState('');

  const [loadError, setLoadError] = useState<string | null>(null);

  // show unsaved edits in the live preview
  useDraftSync('technicalSkills', skillCategories, !loading);

  useEffect(() => {
    getPortfolioDataForEditing().then((data) => {
    if (data?.technicalSkills) {
      let skillsData: SkillCategory[] = [];
      
      // Check if data is in old format (object) or new format (array)
      if (Array.isArray(data.technicalSkills)) {
        // New format - use as is
        skillsData = data.technicalSkills;
      } else {
        // Old format - convert to new format
        const oldSkills = data.technicalSkills as any;
        skillsData = [
          {
            category: 'Programming Languages',
            emoji: '',
            skills: oldSkills.languages || []
          },
          {
            category: 'Machine Learning & AI',
            emoji: '',
            skills: oldSkills.machineLearning || []
          },
          {
            category: 'Web Frontend',
            emoji: '',
            skills: oldSkills.webFrontend || []
          },
          {
            category: 'Tools & Databases',
            emoji: '',
            skills: oldSkills.toolsDb || []
          },
          {
            category: 'Soft Skills',
            emoji: '',
            skills: oldSkills.softSkills || []
          }
        ].filter(category => category.skills.length > 0); // Only include categories with skills
        
        // Save the migrated data
        updatePortfolioSection('technicalSkills', skillsData);
      }
      
      setSkillCategories(skillsData);
      setExpandedCategories(new Set(skillsData.map((_, index) => index)));
    }
    }).catch((error: Error) => {
      console.error('Failed to load saved content:', error);
      setLoadError(error.message);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category.trim()) return;

    const updatedCategories = [...skillCategories];
    if (editingCategory !== null) {
      updatedCategories[editingCategory] = formData;
    } else {
      updatedCategories.push(formData);
    }

    setSkillCategories(updatedCategories);
    
    try {
      await updatePortfolioSection('technicalSkills', updatedCategories);
      console.log('✅ Skills updated successfully');
    } catch (error) {
      console.error('❌ Failed to update skills:', error);
      alert('Failed to save changes. Please try again.');
      return;
    }
    
    setEditingCategory(null);
    setShowAddForm(false);
  setFormData({ category: '', emoji: '', skills: [] });
    setNewSkill('');
  };

  const moveCategory = async (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= skillCategories.length) return;
    const updated = [...skillCategories];
    const [item] = updated.splice(index, 1);
    updated.splice(newIndex, 0, item);
    setSkillCategories(updated);
    try {
      await updatePortfolioSection('technicalSkills', updated);
      console.log('✅ Categories reordered');
    } catch (err) {
      console.error('❌ Failed to reorder categories', err);
      alert('Failed to reorder categories.');
    }
  };

  const handleEdit = (category: SkillCategory, index: number) => {
    setFormData({ ...category });
    setEditingCategory(index);
    setShowAddForm(true);
  };

  const handleDelete = async (index: number) => {
    if (confirm('Are you sure you want to delete this skill category?')) {
      const updatedCategories = skillCategories.filter((_, i) => i !== index);
      setSkillCategories(updatedCategories);
      
      try {
        await updatePortfolioSection('technicalSkills', updatedCategories);
        console.log('✅ Skill category deleted successfully');
      } catch (error) {
        console.error('❌ Failed to delete skill category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const addSkillToForm = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkillFromForm = (skillIndex: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== skillIndex)
    }));
  };

  const toggleCategory = (index: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCategories(newExpanded);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="space-y-6">
        <PageBanner
          icon={Settings}
          title="Skills Management"
          subtitle="Organize skills by categories"
          chips={[
            `${skillCategories.length} ${skillCategories.length === 1 ? 'category' : 'categories'}`,
            `${skillCategories.reduce((sum, c) => sum + c.skills.length, 0)} skills`,
          ]}
        >
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingCategory(null);
              setFormData({ category: '', emoji: '', skills: [] });
              setNewSkill('');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-xl shadow-sm hover:from-purple-600 hover:to-purple-700 transition whitespace-nowrap shadow-sm"
          >
            <Plus size={16} />
            Add Category
          </button>
        </PageBanner>

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory !== null ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className={labelStyles}>Category Name *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className={inputStyles}
                  placeholder="e.g., Cloud Technologies, Big Data, DevOps"
                  required
                />
              </div>
              
              <div>
                <label className={labelStyles}>Emoji (optional)</label>
                <input
                  type="text"
                  value={formData.emoji || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                  className={inputStyles}
                  placeholder="e.g., 💻"
                  maxLength={2}
                />
                <p className="text-xs text-gray-500 mt-1">Add an emoji to visually represent this category.</p>
              </div>
              
              <div>
                <label className={labelStyles}>Skills</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className={inputStyles}
                      placeholder="Add a skill..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillToForm())}
                    />
                    <button
                      type="button"
                      onClick={addSkillToForm}
                      className="px-4 py-2 bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-xl shadow-sm hover:from-blue-600 hover:to-blue-700 transition whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.skills.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Added Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkillFromForm(index)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.category || formData.skills.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-xl shadow-sm hover:from-purple-600 hover:to-purple-700 transition whitespace-nowrap font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {editingCategory !== null ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {skillCategories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No skill categories added yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first skill category</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-xl shadow-sm hover:from-purple-600 hover:to-purple-700 transition whitespace-nowrap"
              >
                <Plus size={16} />
                Add Your First Category
              </button>
            </div>
          ) : (
            skillCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:border-purple-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleCategory(index)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedCategories.has(index) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      {category.emoji && <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-xl leading-none ring-1 ring-purple-100">{category.emoji}</span>}
                      <span>{category.category}</span>
                    </h3>
                    <span className="text-sm text-gray-500">({category.skills.length} skills)</span>
                  </div>
                  
                  <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/70 p-0.5">
                      <button
                        onClick={() => moveCategory(index, -1)}
                        title="Move up"
                        className="rounded-lg p-2 text-gray-500 hover:text-gray-800 hover:bg-white hover:shadow-sm transition"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moveCategory(index, 1)}
                        title="Move down"
                        className="rounded-lg p-2 text-gray-500 hover:text-gray-800 hover:bg-white hover:shadow-sm transition"
                      >
                        <ChevronDown size={16} />
                      </button>
                    <button
                      onClick={() => handleEdit(category, index)}
                      className="rounded-lg p-2 text-gray-500 hover:text-blue-600 hover:bg-white hover:shadow-sm transition"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="rounded-lg p-2 text-gray-500 hover:text-red-600 hover:bg-white hover:shadow-sm transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {expandedCategories.has(index) && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2 mt-3">
                      {category.skills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 ring-1 ring-gray-200/70"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
        </div>
      </div>
    </AdminLayout>
  );
}

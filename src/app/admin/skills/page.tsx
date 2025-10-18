'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Settings, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getPortfolioData, updatePortfolioSection } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

interface SkillCategory {
  category: string;
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
    skills: []
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const data = getPortfolioData();
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
            skills: oldSkills.languages || []
          },
          {
            category: 'Machine Learning & AI',
            skills: oldSkills.machineLearning || []
          },
          {
            category: 'Web Frontend',
            skills: oldSkills.webFrontend || []
          },
          {
            category: 'Tools & Databases',
            skills: oldSkills.toolsDb || []
          },
          {
            category: 'Soft Skills',
            skills: oldSkills.softSkills || []
          }
        ].filter(category => category.skills.length > 0); // Only include categories with skills
        
        // Save the migrated data
        updatePortfolioSection('technicalSkills', skillsData);
      }
      
      setSkillCategories(skillsData);
      setExpandedCategories(new Set(skillsData.map((_, index) => index)));
    }
    setLoading(false);
  }, []);

  const handleSave = () => {
    const updatedCategories = [...skillCategories];
    
    if (editingCategory !== null) {
      updatedCategories[editingCategory] = formData;
    } else {
      updatedCategories.push(formData);
    }

    setSkillCategories(updatedCategories);
    updatePortfolioSection('technicalSkills', updatedCategories);
    
    setEditingCategory(null);
    setShowAddForm(false);
    setFormData({ category: '', skills: [] });
    setNewSkill('');
  };

  const handleEdit = (category: SkillCategory, index: number) => {
    setFormData({ ...category });
    setEditingCategory(index);
    setShowAddForm(true);
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this skill category?')) {
      const updatedCategories = skillCategories.filter((_, i) => i !== index);
      setSkillCategories(updatedCategories);
      updatePortfolioSection('technicalSkills', updatedCategories);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Skills Management</h2>
              <p className="text-sm text-gray-500">Organize skills by categories</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingCategory(null);
              setFormData({ category: '', skills: [] });
              setNewSkill('');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                onClick={handleSave}
                disabled={!formData.category || formData.skills.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {editingCategory !== null ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {skillCategories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No skill categories added yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first skill category</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleCategory(index)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedCategories.has(index) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                    <span className="text-sm text-gray-500">({category.skills.length} skills)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(category, index)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
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

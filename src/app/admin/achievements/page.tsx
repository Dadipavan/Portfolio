'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Trophy, Save, X } from 'lucide-react';
import { getPortfolioDataSync, updatePortfolioSection } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const textareaStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm resize-none";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

interface Achievement {
  title: string;
  description: string;
}

export default function AchievementsAdmin() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Achievement>>({
    title: '',
    description: ''
  });

  useEffect(() => {
    const data = getPortfolioDataSync();
    if (data?.achievements) {
      setAchievements(data.achievements);
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    const updatedData = [...achievements];
    
    if (editingIndex !== null) {
      updatedData[editingIndex] = formData as Achievement;
    } else {
      updatedData.push(formData as Achievement);
    }

    setAchievements(updatedData);
    
    try {
      await updatePortfolioSection('achievements', updatedData);
      console.log('✅ Achievements updated successfully');
    } catch (error) {
      console.error('❌ Failed to update achievements:', error);
      alert('Failed to save changes. Please try again.');
      return;
    }
    
    // Reset form
    setEditingIndex(null);
    setShowAddForm(false);
    setFormData({
      title: '',
      description: ''
    });
  };

  const handleEdit = (achievement: Achievement, index: number) => {
    setFormData(achievement);
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleDelete = async (index: number) => {
    if (confirm('Are you sure you want to delete this achievement?')) {
      const updatedAchievements = achievements.filter((_, i) => i !== index);
      setAchievements(updatedAchievements);
      
      try {
        await updatePortfolioSection('achievements', updatedAchievements);
        console.log('✅ Achievement deleted successfully');
      } catch (error) {
        console.error('❌ Failed to delete achievement:', error);
        alert('Failed to delete achievement. Please try again.');
      }
    }
  };

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Achievements Management</h2>
              <p className="text-sm text-gray-500">Showcase awards and recognition</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingIndex(null);
              setFormData({
                title: '',
                description: ''
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Achievement
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingIndex !== null ? 'Edit Achievement' : 'Add New Achievement'}
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
                <label className={labelStyles}>Achievement Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => updateFormField('title', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., Best Student Award, Dean's List"
                  required
                />
              </div>
              
              <div>
                <label className={labelStyles}>Description *</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  className={textareaStyles}
                  rows={3}
                  placeholder="Describe the achievement, what it recognizes, and its significance"
                  required
                />
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
                disabled={!formData.title || !formData.description}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {editingIndex !== null ? 'Update Achievement' : 'Add Achievement'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Achievements List */}
        <div className="space-y-4">
          {achievements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements added yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your awards and recognition</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} />
                Add Your First Achievement
              </button>
            </div>
          ) : (
            achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{achievement.title}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{achievement.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(achievement, index)}
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
              </motion.div>
            ))
          )}
        </div>
        </div>
      </div>
    </AdminLayout>
  );
}
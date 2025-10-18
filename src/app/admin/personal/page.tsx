'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Plus, X, Edit, Trash2, MapPin, Award } from 'lucide-react';
import { getPortfolioData, updatePortfolioSection } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const textareaStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm resize-none";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

interface CurrentFocusItem {
  title: string;
  description: string;
  icon: string;
}

export default function PersonalInfoAdmin() {
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    shortName: '',
    title: '',
    subtitle: '',
    description: '',
    about: '',
    location: '',
    email: '',
    phone: '',
    github: '',
    linkedin: '',
    cgpa: '',
    graduation: '',
  });
  const [quickFacts, setQuickFacts] = useState({
    location: '',
    cgpa: '',
    graduation: '',
    scholarship: ''
  });
  const [currentFocus, setCurrentFocus] = useState<CurrentFocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFocus, setEditingFocus] = useState<number | null>(null);
  const [newFocusItem, setNewFocusItem] = useState<CurrentFocusItem>({
    title: '',
    description: '',
    icon: '🎯'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const data = getPortfolioData();
    if (data) {
      setPersonalInfo(data.personalInfo);
      setQuickFacts(data.quickFacts || {
        location: '',
        cgpa: '',
        graduation: '',
        scholarship: ''
      });
      setCurrentFocus(data.currentFocus || []);
    }
    setLoading(false);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Update all sections
    updatePortfolioSection('personalInfo', personalInfo);
    updatePortfolioSection('quickFacts', quickFacts);
    updatePortfolioSection('currentFocus', currentFocus);
    
    // Show success feedback
    setTimeout(() => {
      setSaving(false);
      alert('Personal information updated successfully!');
    }, 500);
  };

  const updateField = (field: string, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const addFocusItem = () => {
    if (!newFocusItem.title || !newFocusItem.description) {
      alert('Please fill in all fields.');
      return;
    }

    setCurrentFocus([...currentFocus, { ...newFocusItem }]);
    setNewFocusItem({ title: '', description: '', icon: '🎯' });
    setShowAddForm(false);
  };

  const updateFocusItem = (index: number, field: keyof CurrentFocusItem, value: string) => {
    const updated = [...currentFocus];
    updated[index][field] = value;
    setCurrentFocus(updated);
  };

  const deleteFocusItem = (index: number) => {
    if (confirm('Are you sure you want to delete this focus item?')) {
      setCurrentFocus(currentFocus.filter((_, i) => i !== index));
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentFocus.length) return;

    const updated = [...currentFocus];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setCurrentFocus(updated);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Personal Information</h1>
              <p className="text-gray-600">Update your basic information and contact details</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm"
        >
          <form onSubmit={handleSave} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-purple-600 mb-4">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Full Name *</label>
                <input
                  type="text"
                  value={personalInfo.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={inputStyles}
                  required
                />
              </div>
              <div>
                <label className={labelStyles}>Short Name *</label>
                <input
                  type="text"
                  value={personalInfo.shortName}
                  onChange={(e) => updateField('shortName', e.target.value)}
                  className={inputStyles}
                  placeholder="For navigation and display"
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-semibold text-purple-600 mb-4">Professional Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Title/Position *</label>
                <input
                  type="text"
                  value={personalInfo.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., Data Scientist / ML Engineer"
                  required
                />
              </div>
              <div>
                <label className={labelStyles}>Subtitle</label>
                <input
                  type="text"
                  value={personalInfo.subtitle}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., B.Tech (IT) Student"
                />
              </div>
            </div>
          </div>

          {/* Content Information */}
          <div>
            <h3 className="text-lg font-semibold text-purple-600 mb-4">Content Information</h3>
            <div className="space-y-6">
              <div>
                <label className={labelStyles}>Main Description *</label>
                <textarea
                  value={personalInfo.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className={`${inputStyles} resize-none`}
                  rows={3}
                  placeholder="e.g., B.Tech (IT) Student passionate about leveraging data and machine learning to solve real-world problems..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This appears in the hero section of your portfolio</p>
              </div>
              <div>
                <label className={labelStyles}>About Me Content *</label>
                <textarea
                  value={personalInfo.about}
                  onChange={(e) => updateField('about', e.target.value)}
                  className={`${inputStyles} resize-none`}
                  rows={4}
                  placeholder="e.g., I'm a passionate B.Tech Information Technology student at Seshadri Rao Gudlavalleru Engineering College..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This appears in the About Me section of your portfolio</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-purple-600 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className={labelStyles}>Location *</label>
                <input
                  type="text"
                  value={personalInfo.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className={inputStyles}
                  placeholder="City, State, Country"
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyles}>Email *</label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={inputStyles}
                    required
                  />
                </div>
                <div>
                  <label className={labelStyles}>Phone</label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={inputStyles}
                    placeholder="+91 12345 67890"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold text-purple-600 mb-4">Social Links</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>GitHub URL</label>
                <input
                  type="url"
                  value={personalInfo.github}
                  onChange={(e) => updateField('github', e.target.value)}
                  className={inputStyles}
                  placeholder="https://github.com/username"
                />
              </div>
              <div>
                <label className={labelStyles}>LinkedIn URL</label>
                <input
                  type="url"
                  value={personalInfo.linkedin}
                  onChange={(e) => updateField('linkedin', e.target.value)}
                  className={inputStyles}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-lg font-semibold text-purple-600 mb-4">Academic Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Current CGPA</label>
                <input
                  type="text"
                  value={personalInfo.cgpa}
                  onChange={(e) => updateField('cgpa', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., 9.1/10"
                />
              </div>
              <div>
                <label className={labelStyles}>Expected Graduation</label>
                <input
                  type="text"
                  value={personalInfo.graduation}
                  onChange={(e) => updateField('graduation', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., Jun 2026 (Expected)"
                />
              </div>
            </div>
          </div>

          {/* Quick Facts Section */}
          <div>
            <h3 className="text-lg font-semibold text-purple-600 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Quick Facts (Homepage Display)
            </h3>
            <p className="text-sm text-gray-600 mb-4">These facts will be displayed in the Quick Facts section on your homepage</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Location Fact</label>
                <input
                  type="text"
                  value={quickFacts.location}
                  onChange={(e) => setQuickFacts(prev => ({ ...prev, location: e.target.value }))}
                  className={inputStyles}
                  placeholder="📍 Korukollu, Kalidindi Mandal, Andhra Pradesh, India"
                />
              </div>
              <div>
                <label className={labelStyles}>CGPA Fact</label>
                <input
                  type="text"
                  value={quickFacts.cgpa}
                  onChange={(e) => setQuickFacts(prev => ({ ...prev, cgpa: e.target.value }))}
                  className={inputStyles}
                  placeholder="🎓 CGPA: 9.1/10"
                />
              </div>
              <div>
                <label className={labelStyles}>Graduation Fact</label>
                <input
                  type="text"
                  value={quickFacts.graduation}
                  onChange={(e) => setQuickFacts(prev => ({ ...prev, graduation: e.target.value }))}
                  className={inputStyles}
                  placeholder="📅 Expected Graduation: Jun 2026 (Expected)"
                />
              </div>
              <div>
                <label className={labelStyles}>Scholarship/Recognition</label>
                <input
                  type="text"
                  value={quickFacts.scholarship}
                  onChange={(e) => setQuickFacts(prev => ({ ...prev, scholarship: e.target.value }))}
                  className={inputStyles}
                  placeholder="🏆 Reliance Foundation Scholar"
                />
              </div>
            </div>
          </div>

          {/* Current Focus Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-600 flex items-center gap-2">
                <Award size={20} />
                Current Focus Areas (Homepage Display)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Focus Area
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">These focus areas will be displayed in the Current Focus section on your homepage</p>

            {/* Add Focus Form */}
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelStyles}>Icon</label>
                      <input
                        type="text"
                        value={newFocusItem.icon}
                        onChange={(e) => setNewFocusItem(prev => ({ ...prev, icon: e.target.value }))}
                        className={inputStyles}
                        placeholder="🎯"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStyles}>Title</label>
                      <input
                        type="text"
                        value={newFocusItem.title}
                        onChange={(e) => setNewFocusItem(prev => ({ ...prev, title: e.target.value }))}
                        className={inputStyles}
                        placeholder="Machine Learning & AI"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyles}>Description</label>
                    <textarea
                      value={newFocusItem.description}
                      onChange={(e) => setNewFocusItem(prev => ({ ...prev, description: e.target.value }))}
                      className={textareaStyles}
                      rows={2}
                      placeholder="Building predictive models and exploring generative AI"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addFocusItem}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus size={16} />
                      Add Focus Area
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Current Focus Items */}
            <div className="space-y-4">
              {currentFocus.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  {editingFocus === index ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelStyles}>Icon</label>
                          <input
                            type="text"
                            value={item.icon}
                            onChange={(e) => updateFocusItem(index, 'icon', e.target.value)}
                            className={inputStyles}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelStyles}>Title</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateFocusItem(index, 'title', e.target.value)}
                            className={inputStyles}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelStyles}>Description</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateFocusItem(index, 'description', e.target.value)}
                          className={textareaStyles}
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingFocus(null)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFocus(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Save size={16} />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{item.icon}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === currentFocus.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFocus(index)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFocusItem(index)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {currentFocus.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No focus areas added yet. Click "Add Focus Area" to get started.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end gap-4">
              <a
                href="/admin"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium shadow-sm"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
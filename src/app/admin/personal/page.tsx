'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User } from 'lucide-react';
import { getPortfolioData, updatePortfolioSection } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = getPortfolioData();
    if (data) {
      setPersonalInfo(data.personalInfo);
    }
    setLoading(false);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    updatePortfolioSection('personalInfo', personalInfo);
    
    // Show success feedback
    setTimeout(() => {
      setSaving(false);
      alert('Personal information updated successfully!');
    }, 500);
  };

  const updateField = (field: string, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
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
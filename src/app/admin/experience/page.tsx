'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Trash2, Briefcase, Save, X, ChevronUp, ChevronDown } from 'lucide-react';
import { getPortfolioDataForEditing, updatePortfolioSection } from '@/lib/dataManager';
import AdminLoadError from '@/components/AdminLoadError';
import AdminLayout from '@/components/AdminLayout';
import { FieldError, PageBanner, TagsInput } from '@/components/admin/kit';
import { useConfirm, useNotify } from '@/components/admin/Feedback';
import { SingleFileEditor } from '@/components/admin/MediaEditors';
import { useFileLedger } from '@/components/admin/useFileLedger';
import { toWebUrl } from '@/lib/url';
import type { MediaFile } from '@/lib/types';
import { useDraftSync } from '@/lib/previewBus';

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm";
const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

interface Experience {
  id: number;
  title: string;
  company: string;
  location: string;
  period: string;
  type: string;
  description: string[];
  logo?: MediaFile;
  website?: string;
  summary?: string;
  skills?: string[];
}

export default function ExperienceAdmin() {
  return (
    <AdminLayout>
      <ExperienceContent />
    </AdminLayout>
  );
}

const blankForm = (): Partial<Experience> => ({
  title: '',
  company: '',
  location: '',
  period: '',
  type: 'Full-time',
  description: [''],
  website: '',
  summary: '',
  skills: [],
  logo: undefined,
});

const filesOf = (items: Experience[]) =>
  items.flatMap((item) => (item.logo ? [item.logo.path] : []));

function ExperienceContent() {
  const notify = useNotify();
  const confirm = useConfirm();
  const ledger = useFileLedger();
  const [websiteError, setWebsiteError] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Experience>>(blankForm);

  const [loadError, setLoadError] = useState<string | null>(null);

  // show unsaved edits in the live preview
  useDraftSync('experience', experiences, !loading);

  useEffect(() => {
    getPortfolioDataForEditing().then((data) => {
    if (data?.experience) {
      setExperiences(data.experience);
    }
    }).catch((error: Error) => {
      console.error('Failed to load saved content:', error);
      setLoadError(error.message);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const website = (formData.website ?? '').trim();
    if (website && !toWebUrl(website)) {
      setWebsiteError('This does not look like a web address, for example https://www.company.com.');
      return;
    }
    setWebsiteError('');
    const updatedData = [...experiences];
    const extras = {
      website: website ? toWebUrl(website) : '',
      summary: (formData.summary ?? '').trim(),
      skills: formData.skills ?? [],
    };
    
    if (editingId) {
      const index = updatedData.findIndex(exp => exp.id === editingId);
      if (index !== -1) {
        updatedData[index] = { 
          ...formData, 
          ...extras,
          id: editingId,
          description: formData.description?.filter(d => d.trim()) || []
        } as Experience;
      }
    } else {
      const newExperience: Experience = {
        ...formData,
        ...extras,
        id: Date.now(),
        description: formData.description?.filter(d => d.trim()) || []
      } as Experience;
      updatedData.push(newExperience);
    }

    setExperiences(updatedData);
    
    try {
      await updatePortfolioSection('experience', updatedData);
      console.log('✅ Experience updated successfully');
    } catch (error) {
      console.error('❌ Failed to update experience:', error);
      notify.error('Your changes could not be saved. Nothing is lost: it is all still on this page. Please try again.');
      return;
    }

    // logos uploaded or removed while the form was open: delete the ones nothing uses any more
    await ledger.afterSave(filesOf(updatedData));
    notify.success('Saved.');

    // Reset form
    setEditingId(null);
    setShowAddForm(false);
    setFormData(blankForm());
  };

  const closeForm = async () => {
    await ledger.afterCancel(filesOf(experiences));
    setWebsiteError('');
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEdit = (experience: Experience) => {
    setFormData({
      ...experience,
      description: experience.description.length ? experience.description : ['']
    });
    setEditingId(experience.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete this experience?',
      message: 'It is removed from your site, and its logo is deleted from storage.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) {
      const removed = experiences.find((exp) => exp.id === id);
      const updatedExperiences = experiences.filter(exp => exp.id !== id);
      setExperiences(updatedExperiences);
      
      try {
        await updatePortfolioSection('experience', updatedExperiences);
        console.log('✅ Experience deleted successfully');
        if (removed?.logo) {
          ledger.touch(removed.logo.path);
          await ledger.afterSave(filesOf(updatedExperiences));
        }
      } catch (error) {
        console.error('❌ Failed to delete experience:', error);
        notify.error('The experience could not be deleted. Please try again.');
      }
    }
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateDescription = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description?.map((item, i) => i === index ? value : item) || []
    }));
  };

  const moveExperience = async (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= experiences.length) return;
    const updated = [...experiences];
    const [item] = updated.splice(index, 1);
    updated.splice(newIndex, 0, item);
    setExperiences(updated);
    try {
      await updatePortfolioSection('experience', updated);
      console.log('✅ Experience order updated');
    } catch (err) {
      console.error('❌ Failed to update experience order', err);
      notify.error('The order could not be saved. Please try again.');
    }
  };

  const addDescription = () => {
    setFormData(prev => ({
      ...prev,
      description: [...(prev.description || []), '']
    }));
  };

  const removeDescription = (index: number) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description?.filter((_, i) => i !== index) || []
    }));
  };

  if (loadError) {
    return <AdminLoadError message={loadError} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="space-y-6">
        {/* Header */}
        <PageBanner
          icon={Briefcase}
          title="Experience Management"
          subtitle="Manage your work experience and roles"
          chips={[`${experiences.length} ${experiences.length === 1 ? 'role' : 'roles'}`]}
        >
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              setFormData(blankForm());
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-xl shadow-sm hover:from-purple-600 hover:to-purple-700 transition whitespace-nowrap shadow-sm"
          >
            <Plus size={16} />
            Add Experience
          </button>
        </PageBanner>

        {/* Add/Edit Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Experience' : 'Add New Experience'}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Job Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => updateFormField('title', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., Data Scientist"
                  required
                />
              </div>
              <div>
                <label className={labelStyles}>Company *</label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => updateFormField('company', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., TechCorp Inc."
                  required
                />
              </div>
              <div>
                <label className={labelStyles}>Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => updateFormField('location', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div>
                <label className={labelStyles}>Period *</label>
                <input
                  type="text"
                  value={formData.period || ''}
                  onChange={(e) => updateFormField('period', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., Jan 2023 - Present"
                  required
                />
              </div>
              <div>
                <label className={labelStyles}>Employment Type</label>
                <select
                  value={formData.type || 'Full-time'}
                  onChange={(e) => updateFormField('type', e.target.value)}
                  className={inputStyles}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="exp-website" className={labelStyles}>Company website</label>
                <input
                  id="exp-website"
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => updateFormField('website', e.target.value)}
                  aria-invalid={Boolean(websiteError)}
                  className={inputStyles}
                  placeholder="https://www.company.com"
                />
                <FieldError id="err-exp-website" message={websiteError} />
                <p className="mt-1 text-xs text-gray-500">Shown as a “Visit website” link on the card.</p>
              </div>
              <div>
                <TagsInput
                  id="exp-skills"
                  label="Skills and tools used"
                  hint="Separate with commas. Shown as small tags under the role."
                  value={formData.skills ?? []}
                  onChange={(value) => updateFormField('skills', value)}
                  placeholder="Python, SQL, Power BI"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="exp-summary" className={labelStyles}>Short summary</label>
              <textarea
                id="exp-summary"
                rows={2}
                maxLength={400}
                value={formData.summary || ''}
                onChange={(e) => updateFormField('summary', e.target.value)}
                className={inputStyles}
                placeholder="One or two sentences about the role. Shown above the points."
              />
            </div>

            <div className="mt-6">
              <SingleFileEditor
                file={formData.logo}
                onChange={(file) => updateFormField('logo', file)}
                kind="logo"
                ledger={ledger}
                label="Company logo"
                help="A square logo works best (JPG, PNG, WebP or GIF, up to 4 MB). Without one, the card shows the company's initials."
              />
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className={labelStyles}>Key responsibilities (the first two show on the card, the rest under “View more”)</label>
              {formData.description?.map((desc, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={desc}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    className={inputStyles}
                    placeholder="Describe your responsibilities and achievements"
                  />
                  {formData.description && formData.description.length > 1 && (
                    <button
                      onClick={() => removeDescription(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addDescription}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                + Add Description Point
              </button>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-xl shadow-sm hover:from-purple-600 hover:to-purple-700 transition whitespace-nowrap font-medium shadow-sm"
              >
                <Save size={16} />
                {editingId ? 'Update Experience' : 'Add Experience'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Experience List */}
        <div className="space-y-4">
          {experiences.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No experience added yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your work experience and roles</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-xl shadow-sm hover:from-purple-600 hover:to-purple-700 transition whitespace-nowrap"
              >
                <Plus size={16} />
                Add Your First Experience
              </button>
            </div>
          ) : (
            experiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:border-purple-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  {experience.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/media/${experience.logo.path}`}
                      alt=""
                      className="mr-4 h-14 w-14 shrink-0 rounded-xl border border-gray-200 bg-white object-contain p-1"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{experience.title}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-600 rounded-full">
                        {experience.type}
                      </span>
                    </div>
                    <p className="mb-1 flex items-center gap-1.5 font-medium text-purple-700"><Building2 size={15} className="shrink-0 text-purple-400" aria-hidden="true" />{experience.company}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>{experience.period}</span>
                      {experience.location && <span>• {experience.location}</span>}
                    </div>
                    
                    {experience.description.length > 0 && (
                      <div className="mb-3">
                        <ul className="list-disc list-inside space-y-1">
                          {experience.description.map((desc, i) => (
                            <li key={i} className="text-gray-600 text-sm">{desc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-center self-start rounded-xl border border-gray-200 bg-gray-50/70 p-0.5">
                    <button
                      onClick={() => moveExperience(index, -1)}
                      title="Move up"
                      className="rounded-lg p-2 text-gray-500 hover:text-gray-800 hover:bg-white hover:shadow-sm transition"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveExperience(index, 1)}
                      title="Move down"
                      className="rounded-lg p-2 text-gray-500 hover:text-gray-800 hover:bg-white hover:shadow-sm transition"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(experience)}
                      className="rounded-lg p-2 text-gray-500 hover:text-blue-600 hover:bg-white hover:shadow-sm transition"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(experience.id)}
                      className="rounded-lg p-2 text-gray-500 hover:text-red-600 hover:bg-white hover:shadow-sm transition"
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
    </>
  );
}
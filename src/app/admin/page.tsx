'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Code,
  Briefcase,
  GraduationCap,
  Award,
  Trophy,
  Download,
  Settings,
  Mail,
  Palette,
  Compass,
  Type,
  Quote,
  ChartLine,
  ListChecks,
  SlidersHorizontal,
  Camera
} from 'lucide-react';
import { initializeData, getPortfolioData, getPortfolioDataSync, exportData } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';
import SystemCheck from '@/components/SystemCheck';
import { LAYOUTS, mergeSiteSettings } from '@/lib/siteSettings';

// How many entries of a list are on the site and how many are held back (drafts or hidden entries)
function publishing(list: unknown, flag: 'published' | 'visible') {
  const items: Record<string, unknown>[] = Array.isArray(list) ? list : [];
  const off = items.filter((item) => item?.[flag] === false).length;
  return { total: items.length, on: items.length - off, off };
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      initializeData();
      try {
        const portfolioData = await getPortfolioData();
        setData(portfolioData);
      } catch (error) {
        console.error('Failed to load portfolio data, using sync fallback:', error);
        const portfolioData = getPortfolioDataSync();
        setData(portfolioData);
      }
    };

    loadData();
  }, []);

  const projects = publishing(data?.projects, 'published');
  const certificates = publishing(data?.certifications, 'visible');
  const achievements = publishing(data?.achievements, 'published');
  const hasPhoto = Boolean(data?.personalInfo?.photo?.file);

  const stats = data ? [
    {
      label: 'Projects',
      value: projects.total,
      detail: `${projects.on} published${projects.off ? `, ${plural(projects.off, 'draft')}` : ''}`,
      href: '/admin/projects',
      icon: Code, color: 'text-blue-500', bg: 'bg-blue-100',
    },
    { label: 'Experience', value: (data.experience ?? []).length, icon: Briefcase, color: 'text-green-500', bg: 'bg-green-100' },
    { label: 'Education', value: (data.education ?? []).length, icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-100' },
    {
      label: 'Certifications',
      value: certificates.total,
      detail: `${certificates.on} shown${certificates.off ? `, ${certificates.off} hidden` : ''}`,
      href: '/admin/certifications',
      icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-100',
    },
    {
      label: 'Achievements',
      value: achievements.total,
      detail: `${achievements.on} published${achievements.off ? `, ${plural(achievements.off, 'draft')}` : ''}`,
      href: '/admin/achievements',
      icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-100',
    },
    {
      label: 'Profile photo',
      value: hasPhoto ? 'Added' : 'Not added',
      detail: hasPhoto ? 'Shown by the looks that have a photo layout' : 'Optional: the looks show your initials',
      href: '/admin/profile',
      icon: Camera, color: 'text-pink-500', bg: 'bg-pink-100',
    },
  ] : [];

  const settings = mergeSiteSettings(data?.siteSettings);
  const lookName = LAYOUTS.find((layout) => layout.id === settings.appearance.layout)?.name ?? settings.appearance.layout;

  const quickActions = [
    { title: 'Personal Info', href: '/admin/personal', icon: User, description: 'Your details, profile links and quick facts' },
    { title: 'Projects and case studies', href: '/admin/projects', icon: Code, description: 'Write the story, add pictures, publish when ready' },
    { title: 'Certificates', href: '/admin/certifications', icon: Award, description: 'Upload each certificate as a picture or PDF' },
    { title: 'Achievements', href: '/admin/achievements', icon: Trophy, description: 'Awards, hackathons and milestones, with pictures and links' },
    { title: 'Profile photo', href: '/admin/profile', icon: Camera, description: 'Upload a photo and choose how it is cropped' },
    { title: 'Templates and look', href: '/admin/appearance', icon: Palette, description: 'Choose from thirteen looks, then colours, charts and section order' },
    { title: 'Skills Management', href: '/admin/skills', icon: Settings, description: 'Update your skill set' },
    { title: 'Recommendations', href: '/admin/recommendations', icon: Quote, description: 'Words from mentors and teammates' },
    { title: 'Roles', href: '/admin/roles', icon: Compass, description: 'Data Scientist, Engineer, Analyst... and your own' },
    { title: 'Text and labels', href: '/admin/text', icon: Type, description: 'Change any heading or button wording' },
    { title: 'Site Settings', href: '/admin/site', icon: SlidersHorizontal, description: 'Availability, key numbers, work with me' },
    { title: 'Messages', href: '/admin/messages', icon: Mail, description: 'Read messages from your contact form' },
    { title: 'Insights', href: '/admin/insights', icon: ChartLine, description: 'Visits and clicks, with no personal data' },
    { title: 'Content map', href: '/admin/map', icon: ListChecks, description: 'See where everything appears on the site' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s an overview of your portfolio content.</p>
        </div>

        {/* Stats Grid: the entries that are on the site, and the ones held back */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const body = (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className={`${typeof stat.value === 'number' ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900 mt-1`}>{stat.value}</p>
                  {stat.detail && <p className="text-sm text-gray-600 mt-1">{stat.detail}</p>}
                </div>
                <div className={`w-12 h-12 shrink-0 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} aria-hidden="true" />
                </div>
              </div>
            );
            const card = 'bg-white rounded-xl p-6 border border-gray-200 shadow-sm';
            return stat.href ? (
              <motion.a
                key={stat.label}
                href={stat.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${card} block hover:border-purple-300 hover:shadow-md transition-all`}
              >
                {body}
              </motion.a>
            ) : (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={card}
              >
                {body}
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.a
                key={action.title}
                href={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <action.icon className="w-4 h-4 text-purple-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                </div>
                <p className="text-sm text-gray-500">{action.description}</p>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Content Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Status</h3>
            <div className="space-y-3">
              {data && (
                <>
                  {!Number.isNaN(new Date(data.lastUpdated).getTime()) && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Last updated:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(data.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total content items:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {projects.total + (data.experience ?? []).length + (data.education ?? []).length + certificates.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Look in use:</span>
                    <a href="/admin/appearance" className="text-sm font-medium text-purple-700 hover:underline">
                      {lookName}
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Roles on the site:</span>
                    <a href="/admin/roles" className="text-sm font-medium text-purple-700 hover:underline">
                      {settings.roles.length}
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
            <div className="space-y-3">
              <button
                onClick={exportData}
                className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Export Data</p>
                  <p className="text-sm text-gray-500">Download your portfolio data as JSON</p>
                </div>
              </button>
              
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Your content is stored in your Supabase database. Export it now and then to keep a copy of your own.
                </p>
              </div>
            </div>
          </div>
        </div>

        <SystemCheck />
      </div>
    </AdminLayout>
  );
}

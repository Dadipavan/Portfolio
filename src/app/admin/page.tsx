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
  Settings
} from 'lucide-react';
import { initializeData, getPortfolioData, exportData } from '@/lib/dataManager';
import AdminLayout from '@/components/AdminLayout';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    initializeData();
    const portfolioData = getPortfolioData();
    setData(portfolioData);
  }, []);

  const stats = data ? [
    { label: 'Projects', value: data.projects.length, icon: Code, color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'Experience', value: data.experience.length, icon: Briefcase, color: 'text-green-500', bg: 'bg-green-100' },
    { label: 'Education', value: data.education.length, icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-100' },
    { label: 'Certifications', value: data.certifications.length, icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  ] : [];

  const quickActions = [
    { title: 'Personal Info', href: '/admin/personal', icon: User, description: 'Update your personal details' },
    { title: 'Add Project', href: '/admin/projects', icon: Code, description: 'Showcase your latest work' },
    { title: 'Skills Management', href: '/admin/skills', icon: Settings, description: 'Update your skill set' },
    { title: 'Add Achievement', href: '/admin/achievements', icon: Trophy, description: 'Add new accomplishments' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your portfolio content.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
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
                    <action.icon className="w-4 h-4 text-purple-600" />
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
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Last updated:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(data.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total content items:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {data.projects.length + data.experience.length + data.education.length + data.certifications.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Portfolio completion:</span>
                    <span className="text-sm font-medium text-green-600">85% Complete</span>
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
                  Your data is automatically saved to local storage. Export regularly for backup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

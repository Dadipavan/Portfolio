'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Code, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Trophy,
  Database,
  LogOut,
  Menu,
  X,
  BarChart3,
  Home
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { title: 'Dashboard', href: '/admin', icon: Home },
  { title: 'Personal Info', href: '/admin/personal', icon: User },
  { title: 'Skills', href: '/admin/skills', icon: Settings },
  { title: 'Projects', href: '/admin/projects', icon: Code },
  { title: 'Experience', href: '/admin/experience', icon: Briefcase },
  { title: 'Education', href: '/admin/education', icon: GraduationCap },
  { title: 'Certifications', href: '/admin/certifications', icon: Award },
  { title: 'Achievements', href: '/admin/achievements', icon: Trophy },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      console.log('Auth check:', isAuth); // Debug log
      
      if (!isAuth) {
        router.push('/admin/login');
        return;
      }
      
      setAuthenticated(true);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} />
              {item.title}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
            >
              <BarChart3 size={18} />
              View Portfolio
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
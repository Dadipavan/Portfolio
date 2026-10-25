'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkSession, logout } from '@/lib/auth';
import PreviewPane from '@/components/PreviewPane';
import FeedbackProvider from '@/components/admin/Feedback';
import {
  Award,
  Camera,
  CircleHelp,
  Briefcase,
  ChartLine,
  Code,
  Compass,
  Database,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Home,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  History,
  Palette,
  Quote,
  Settings,
  SlidersHorizontal,
  Trophy,
  Type,
  User,
  X,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuGroups = [
  {
    title: null,
    items: [{ title: 'Dashboard', href: '/admin', icon: Home }],
  },
  {
    title: 'Design and profile',
    items: [
      { title: 'Templates and look', href: '/admin/appearance', icon: Palette },
      { title: 'Profile photo and media', href: '/admin/profile', icon: Camera },
      { title: 'Roles', href: '/admin/roles', icon: Compass },
      { title: 'Text and labels', href: '/admin/text', icon: Type },
      { title: 'Site settings', href: '/admin/site', icon: SlidersHorizontal },
      { title: 'Timeline', href: '/admin/timeline', icon: History },
    ],
  },
  {
    title: 'Content',
    items: [
      { title: 'Personal Info', href: '/admin/personal', icon: User },
      { title: 'Projects', href: '/admin/projects', icon: Code },
      { title: 'Certificates', href: '/admin/certifications', icon: Award },
      { title: 'Achievements', href: '/admin/achievements', icon: Trophy },
      { title: 'Skills', href: '/admin/skills', icon: Settings },
      { title: 'Experience', href: '/admin/experience', icon: Briefcase },
      { title: 'Education', href: '/admin/education', icon: GraduationCap },
      { title: 'Recommendations', href: '/admin/recommendations', icon: Quote },
      { title: 'Resumes', href: '/admin/resumes', icon: FileText },
    ],
  },
  {
    title: 'Visitors',
    items: [
      { title: 'Messages', href: '/admin/messages', icon: Mail },
      { title: 'Insights', href: '/admin/insights', icon: ChartLine },
      { title: 'Content map', href: '/admin/map', icon: ListChecks },
    ],
  },
  {
    title: 'Guide',
    items: [{ title: 'Help', href: '/admin/help', icon: CircleHelp }],
  },
];

// Where on the public site each admin page's content appears
const SITE_ANCHOR: Record<string, string> = {
  '/admin': '/',
  '/admin/personal': '/#top',
  '/admin/skills': '/#skills',
  '/admin/projects': '/#projects',
  '/admin/experience': '/#experience',
  '/admin/education': '/#education',
  '/admin/certifications': '/#certifications',
  '/admin/achievements': '/#achievements',
  '/admin/recommendations': '/#recommendations',
  '/admin/resumes': '/#top',
  '/admin/appearance': '/',
  '/admin/profile': '/#top',
  '/admin/roles': '/#top',
  '/admin/text': '/',
  '/admin/site': '/#top',
  '/admin/map': '/',
  '/admin/messages': '/#contact',
  '/admin/insights': '/',
  '/admin/help': '/',
};

const PREVIEW_KEY = 'admin-preview-open';

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const isAuth = await checkSession();
      if (cancelled) return;

      if (!isAuth) {
        router.push('/admin/login');
        return;
      }

      setAuthenticated(true);
      setLoading(false);
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Remember whether the preview was open while moving between admin pages
  useEffect(() => {
    try {
      if (sessionStorage.getItem(PREVIEW_KEY) === '1') setPreviewOpen(true);
    } catch {
      /* storage can be blocked */
    }
  }, []);

  const setPreview = (open: boolean) => {
    setPreviewOpen(open);
    try {
      sessionStorage.setItem(PREVIEW_KEY, open ? '1' : '0');
    } catch {
      /* storage can be blocked */
    }
  };

  const handleLogout = async () => {
    await logout();
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect to login
  }

  const siteLink = SITE_ANCHOR[pathname] ?? '/';
  const pageTitle = menuGroups.flatMap((g) => g.items).find((item) => isActive(item.href) && (item.href !== '/admin' || pathname === '/admin'))?.title ?? 'Admin';

  return (
    <FeedbackProvider>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:max-w-none lg:translate-x-0`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-sm shadow-purple-500/30">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="block text-base font-semibold tracking-tight text-gray-900">Admin Panel</span>
                <span className="block text-xs text-gray-500">Portfolio studio</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 lg:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-5 px-3 py-4 sm:px-4" aria-label="Admin">
            {menuGroups.map((group, index) => (
              <div key={group.title ?? index}>
                {group.title && (
                  <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                    {group.title}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-100'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon size={18} className={isActive(item.href) ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'} />
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-gray-200 p-3 sm:p-4">
            <div className="space-y-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <ExternalLink size={18} />
                View Portfolio
              </a>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
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
            className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <p className="ml-2 hidden truncate text-sm font-semibold text-gray-900 sm:block lg:ml-0">{pageTitle}</p>

            <div className="ml-auto flex items-center gap-2">
              <a
                href={siteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                title="Open the public site at the place this page controls"
              >
                <ExternalLink size={16} aria-hidden="true" />
                <span className="hidden sm:inline">View on site</span>
                <span className="sr-only sm:hidden">View on site</span>
              </a>
              <button
                type="button"
                aria-pressed={previewOpen}
                onClick={() => setPreview(!previewOpen)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm ${
                  previewOpen
                    ? 'border-purple-600 bg-purple-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Eye size={16} aria-hidden="true" />
                Live preview
              </button>
            </div>
          </header>

          {/* Page content, with the live preview beside it */}
          <div className="flex flex-1 overflow-hidden">
            <main className="min-w-0 flex-1 overflow-auto">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
            </main>
            {previewOpen && <PreviewPane onClose={() => setPreview(false)} />}
          </div>
        </div>
      </div>
    </FeedbackProvider>
  );
}

'use client';

import AuroraLayout from './layouts/AuroraLayout';
import BentoLayout from './layouts/BentoLayout';
import BrutalLayout from './layouts/BrutalLayout';
import ClassicLayout from './layouts/ClassicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import EditorialLayout from './layouts/EditorialLayout';
import LabLayout from './layouts/LabLayout';
import NotebookLayout from './layouts/NotebookLayout';
import PortraitLayout from './layouts/PortraitLayout';
import SplitLayout from './layouts/SplitLayout';
import SpotlightLayout from './layouts/SpotlightLayout';
import StoryLayout from './layouts/StoryLayout';
import TerminalLayout from './layouts/TerminalLayout';
import type { LayoutId } from '@/lib/types';
import { usePortfolio } from './PortfolioProvider';

// Every look the admin can choose in Admin > Appearance. All of them show the same content and the same features;
// they differ in arrangement, lettering, colours and how the menu works.
const LAYOUT_COMPONENTS: Record<LayoutId, () => React.JSX.Element> = {
  dashboard: DashboardLayout,
  bento: BentoLayout,
  lab: LabLayout,
  split: SplitLayout,
  story: StoryLayout,
  portrait: PortraitLayout,
  editorial: EditorialLayout,
  terminal: TerminalLayout,
  classic: ClassicLayout,
  spotlight: SpotlightLayout,
  aurora: AuroraLayout,
  brutal: BrutalLayout,
  notebook: NotebookLayout,
};

// Picks the look chosen in Admin > Appearance
export default function SiteShell() {
  const { settings } = usePortfolio();
  const { layout, accent } = settings.appearance;
  const Layout = LAYOUT_COMPONENTS[layout] ?? DashboardLayout;

  return (
    <div data-layout={layout} data-accent={accent}>
      <Layout />
    </div>
  );
}

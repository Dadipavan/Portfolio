// Every piece of wording the admin can change (Admin > Text and labels). Each entry has the built-in text;
// only the entries the admin has changed are stored, so a missing entry always falls back to this file.
// Use {name}-style placeholders for values filled in by the page (for example {role} or {count}).

export interface CopyField {
  key: string;
  group: string;
  label: string;
  text: string;
  // a longer text, edited in a multi-line box
  long?: boolean;
  // may be left empty on purpose (the line is then simply not shown)
  optional?: boolean;
  // placeholders the text may use, shown as a hint in the admin
  vars?: readonly string[];
}

const SECTION_TEXTS = [
  { id: 'about', group: 'About', label: 'About', title: 'Who I am', intro: '' },
  {
    id: 'insights',
    group: 'Insights and charts',
    label: 'Insights',
    title: 'My portfolio, as data',
    intro:
      'Every chart is drawn from the same information as the rest of this page. Select anything to explore it.',
  },
  {
    id: 'projects',
    group: 'Projects',
    label: 'Projects',
    title: 'Featured projects',
    intro:
      'Here are some of my recent projects that showcase my skills in data science, machine learning, and software development.',
  },
  {
    id: 'skills',
    group: 'Skills',
    label: 'Skills',
    title: 'Technical skills',
    intro:
      'My technical expertise spans across various programming languages, frameworks, and tools.',
  },
  {
    id: 'timeline',
    group: 'Timeline',
    label: 'Timeline',
    title: 'My path, year by year',
    intro: '',
  },
  {
    id: 'experience',
    group: 'Experience',
    label: 'Experience',
    title: 'Experience and leadership',
    intro: 'My professional journey and leadership roles that have shaped my expertise.',
  },
  {
    id: 'education',
    group: 'Education',
    label: 'Education',
    title: 'Academic background',
    intro: 'My academic journey and the foundation of my technical knowledge.',
  },
  {
    id: 'certifications',
    group: 'Certifications',
    label: 'Certifications',
    title: 'Credentials',
    intro:
      'Professional certifications that validate my expertise and commitment to continuous learning.',
  },
  {
    id: 'achievements',
    group: 'Achievements',
    label: 'Achievements',
    title: 'Achievements and recognition',
    intro:
      'Recognition for academic excellence, leadership, and contributions to the tech community.',
  },
  {
    id: 'recommendations',
    group: 'Recommendations',
    label: 'Recommendations',
    title: 'What people say',
    intro: '',
  },
  {
    id: 'work',
    group: 'Work with me',
    label: 'Work with me',
    title: "Let's work together",
    intro: 'What I am looking for, and the quickest way to start a conversation.',
  },
  {
    id: 'contact',
    group: 'Contact',
    label: 'Contact',
    title: "Let's connect",
    intro:
      "I'm always open to discussing new opportunities, collaborations, or just having a conversation about data science and technology. Feel free to reach out!",
  },
] as const;

const sectionFields = SECTION_TEXTS.flatMap((s) => [
  {
    key: `section.${s.id}.label` as const,
    group: s.group,
    label: 'Name in the menu',
    text: s.label as string,
  },
  {
    key: `section.${s.id}.title` as const,
    group: s.group,
    label: 'Heading',
    text: s.title as string,
  },
  {
    key: `section.${s.id}.intro` as const,
    group: s.group,
    label: 'Line under the heading',
    text: s.intro as string,
    long: true,
    optional: true,
  },
]);

const otherFields = [
  // Hero
  {
    key: 'hero.greeting',
    group: 'Intro at the top',
    label: 'Greeting above the name',
    text: "Hi, I'm",
  },
  {
    key: 'hero.viewProjects',
    group: 'Intro at the top',
    label: 'Main button',
    text: 'View projects',
  },
  {
    key: 'hero.summaryButton',
    group: 'Intro at the top',
    label: 'Summary button',
    text: '30-second summary',
  },
  {
    key: 'hero.viewAs',
    group: 'Intro at the top',
    label: 'Label of the role switch',
    text: 'View as',
  },
  {
    key: 'hero.viewingAs',
    group: 'Intro at the top',
    label: 'Shown under the title while a role is chosen',
    text: 'Viewing as {role}',
    vars: ['role'],
  },
  {
    key: 'hero.rolesHeading',
    group: 'Intro at the top',
    label: 'Heading above the role cards',
    text: 'Explore my work by role',
  },
  {
    key: 'hero.chartTitle',
    group: 'Intro at the top',
    label: 'Chart title',
    text: 'Technology constellation',
  },
  {
    key: 'hero.chartHelp',
    group: 'Intro at the top',
    label: 'Chart explanation',
    text: 'Each dot is a technology from my projects. Bigger dots are used more, lines join technologies used together, and the colour shows the role.',
    long: true,
  },
  {
    key: 'role.all',
    group: 'Intro at the top',
    label: 'Name of "no role chosen"',
    text: 'Everything',
  },
  {
    key: 'facts.education',
    group: 'Intro at the top',
    label: 'Facts strip: education',
    text: 'Education',
  },
  {
    key: 'facts.graduation',
    group: 'Intro at the top',
    label: 'Facts strip: graduation',
    text: 'Graduation',
  },
  {
    key: 'facts.basedIn',
    group: 'Intro at the top',
    label: 'Facts strip: location',
    text: 'Based in',
  },
  {
    key: 'resume.view',
    group: 'Intro at the top',
    label: 'Button when the CV is generated from this site',
    text: 'View CV',
  },
  {
    key: 'resume.download',
    group: 'Intro at the top',
    label: 'Button when a resume file is uploaded',
    text: 'Download resume',
  },

  // Menu and footer
  { key: 'nav.more', group: 'Menu and footer', label: 'Menu: "More" list', text: 'More' },
  {
    key: 'footer.data',
    group: 'Menu and footer',
    label: 'Download button',
    text: 'Download my data',
  },
  {
    key: 'footer.json',
    group: 'Menu and footer',
    label: 'View as JSON entry',
    text: 'View as JSON',
  },
  { key: 'footer.share', group: 'Menu and footer', label: 'Share button', text: 'Share' },
  { key: 'footer.top', group: 'Menu and footer', label: 'Back to top link', text: 'Back to top' },
  {
    key: 'footer.line',
    group: 'Menu and footer',
    label: 'Footer line under the name',
    text: '© {year} · {title}',
    vars: ['year', 'title', 'name'],
  },

  // About
  { key: 'about.quickFacts', group: 'About', label: 'Quick facts heading', text: 'Quick facts' },
  {
    key: 'about.currentFocus',
    group: 'About',
    label: 'Current focus heading',
    text: 'Current focus',
  },

  // Charts
  {
    key: 'chart.radar.title',
    group: 'Insights and charts',
    label: 'Skills chart: title',
    text: 'Skills across my roles',
  },
  {
    key: 'chart.radar.help',
    group: 'Insights and charts',
    label: 'Skills chart: explanation',
    text: 'Select a role to see its projects.',
  },
  {
    key: 'chart.year.title',
    group: 'Insights and charts',
    label: 'Projects per year: title',
    text: 'Projects per year',
  },
  {
    key: 'chart.year.help',
    group: 'Insights and charts',
    label: 'Projects per year: explanation',
    text: 'Select a bar to see what I built that year.',
  },
  {
    key: 'chart.techmap.title',
    group: 'Insights and charts',
    label: 'Technology map: title',
    text: 'Technology map',
  },
  {
    key: 'chart.techmap.help',
    group: 'Insights and charts',
    label: 'Technology map: explanation',
    text: 'Colour shows the role; a number shows how many projects use it. Select one to filter the projects.',
    long: true,
  },
  {
    key: 'chart.heatmap.title',
    group: 'Insights and charts',
    label: 'Heatmap: title',
    text: 'Which technology, which project',
  },
  {
    key: 'chart.heatmap.help',
    group: 'Insights and charts',
    label: 'Heatmap: explanation',
    text: 'Select a technology to filter, or a filled cell to open the project.',
    long: true,
  },
  {
    key: 'insights.download',
    group: 'Insights and charts',
    label: 'Line above the download button',
    text: 'Want the numbers behind these charts?',
  },

  // Projects
  { key: 'projects.search', group: 'Projects', label: 'Search box label', text: 'Search' },
  {
    key: 'projects.searchHint',
    group: 'Projects',
    label: 'Search box hint',
    text: 'Title, description or technology',
  },
  {
    key: 'projects.technology',
    group: 'Projects',
    label: 'Technology filter label',
    text: 'Technology',
  },
  {
    key: 'projects.allTech',
    group: 'Projects',
    label: 'Technology filter: all',
    text: 'All technologies',
  },
  { key: 'projects.year', group: 'Projects', label: 'Year filter label', text: 'Year' },
  { key: 'projects.allYears', group: 'Projects', label: 'Year filter: all', text: 'All years' },
  { key: 'projects.order', group: 'Projects', label: 'Order label', text: 'Order' },
  { key: 'projects.orderManual', group: 'Projects', label: 'Order: my order', text: 'My order' },
  { key: 'projects.orderNewest', group: 'Projects', label: 'Order: newest', text: 'Newest first' },
  { key: 'projects.orderOldest', group: 'Projects', label: 'Order: oldest', text: 'Oldest first' },
  {
    key: 'projects.featuredOnly',
    group: 'Projects',
    label: 'Featured-only checkbox',
    text: 'Featured only',
  },
  {
    key: 'projects.clear',
    group: 'Projects',
    label: 'Clear filters button',
    text: 'Clear filters',
  },
  {
    key: 'projects.none',
    group: 'Projects',
    label: 'When nothing matches',
    text: 'No projects match these filters.',
  },
  {
    key: 'projects.filterHint',
    group: 'Projects',
    label: 'Line shown instead of the query bar',
    text: 'Filter the projects with the controls above.',
  },
  {
    key: 'projects.other',
    group: 'Projects',
    label: 'Heading above the other projects',
    text: 'Other projects',
  },
  { key: 'projects.featuredBadge', group: 'Projects', label: 'Featured badge', text: 'Featured' },
  {
    key: 'projects.details',
    group: 'Projects',
    label: 'Details button (older wording)',
    text: 'Details',
  },
  {
    key: 'projects.viewMore',
    group: 'Projects',
    label: 'View more button (opens the project window)',
    text: 'View more',
  },
  { key: 'projects.caseStudy', group: 'Projects', label: 'Case study button', text: 'Case study' },
  { key: 'projects.code', group: 'Projects', label: 'Code button', text: 'Code' },
  { key: 'projects.live', group: 'Projects', label: 'Live demo button', text: 'Live demo' },
  {
    key: 'tile.featured',
    group: 'Projects',
    label: 'Featured tile: small heading (tile look)',
    text: 'Featured project',
  },
  {
    key: 'tile.open',
    group: 'Projects',
    label: 'Featured tile: button (tile look)',
    text: 'See it in Projects',
  },

  // Skills
  { key: 'skills.all', group: 'Skills', label: 'Tab for all skills', text: 'All skills' },
  {
    key: 'skills.hintCount',
    group: 'Skills',
    label: 'Hint about the numbers',
    text: 'A number means the skill is used in that many projects.',
  },
  {
    key: 'skills.hintExplorer',
    group: 'Skills',
    label: 'Hint when the explorer is on',
    text: 'Select a skill to see everything behind it.',
  },
  {
    key: 'skills.hintProjects',
    group: 'Skills',
    label: 'Hint when the explorer is off',
    text: 'Select a skill to see those projects.',
  },
  {
    key: 'skills.empty',
    group: 'Skills',
    label: 'When a role has no skills',
    text: 'No skills are listed for this role yet.',
  },

  // Timeline
  { key: 'timeline.all', group: 'Timeline', label: 'Filter: everything', text: 'Everything' },
  {
    key: 'timeline.dim',
    group: 'Timeline',
    label: 'Note about lighter items',
    text: 'Items that do not relate to the chosen role are shown lighter.',
  },

  // Education / certifications / recommendations
  {
    key: 'education.coursework',
    group: 'Education',
    label: 'Coursework heading',
    text: 'Relevant coursework',
  },
  {
    key: 'certs.verify',
    group: 'Certifications',
    label: 'Verify button',
    text: 'Verify credential',
  },
  {
    key: 'certs.view',
    group: 'Certifications',
    label: 'View certificate button',
    text: 'View certificate',
  },
  {
    key: 'certs.additional',
    group: 'Certifications',
    label: 'Heading of the extra list',
    text: 'Additional certifications',
  },
  {
    key: 'recs.link',
    group: 'Recommendations',
    label: 'Link to the original recommendation',
    text: 'Read it on the original page',
  },

  // Work with me
  {
    key: 'work.roles',
    group: 'Work with me',
    label: 'Heading above the roles',
    text: 'Roles I am looking for',
  },
  { key: 'work.book', group: 'Work with me', label: 'Book a call button', text: 'Book a call' },
  { key: 'work.message', group: 'Work with me', label: 'Message button', text: 'Send a message' },
  { key: 'work.basedIn', group: 'Work with me', label: 'Detail: location', text: 'Based in' },
  {
    key: 'work.remote',
    group: 'Work with me',
    label: 'Detail: remote or on-site',
    text: 'Remote or on-site',
  },
  {
    key: 'work.available',
    group: 'Work with me',
    label: 'Detail: start date',
    text: 'Available from',
  },
  {
    key: 'work.reach',
    group: 'Work with me',
    label: 'Detail: contact',
    text: 'Best way to reach me',
  },

  // Contact
  { key: 'contact.emailLabel', group: 'Contact', label: 'Email card label', text: 'Email' },
  { key: 'contact.phoneLabel', group: 'Contact', label: 'Phone card label', text: 'Phone' },
  { key: 'contact.copy', group: 'Contact', label: 'Copy email button', text: 'Copy' },
  {
    key: 'contact.linkedinText',
    group: 'Contact',
    label: 'LinkedIn card text',
    text: 'Connect with me',
  },
  { key: 'contact.githubText', group: 'Contact', label: 'GitHub card text', text: 'See my code' },
  { key: 'contact.form.name', group: 'Contact form', label: 'Name field', text: 'Name' },
  { key: 'contact.form.email', group: 'Contact form', label: 'Email field', text: 'Email' },
  {
    key: 'contact.form.topic',
    group: 'Contact form',
    label: 'Topic field',
    text: 'What is this about?',
  },
  { key: 'contact.form.subject', group: 'Contact form', label: 'Subject field', text: 'Subject' },
  {
    key: 'contact.form.optional',
    group: 'Contact form',
    label: 'Word for "optional"',
    text: '(optional)',
  },
  { key: 'contact.form.message', group: 'Contact form', label: 'Message field', text: 'Message' },
  { key: 'contact.form.send', group: 'Contact form', label: 'Send button', text: 'Send message' },
  {
    key: 'contact.form.sending',
    group: 'Contact form',
    label: 'Send button while sending',
    text: 'Sending...',
  },
  {
    key: 'contact.form.success',
    group: 'Contact form',
    label: 'Message after sending',
    text: 'Thanks, your message has been sent. I will get back to you soon.',
    long: true,
  },

  // Dialogs
  {
    key: 'quick.fit',
    group: 'Summary and share windows',
    label: 'Summary: "where I fit" heading',
    text: 'Where I fit',
  },
  {
    key: 'quick.work',
    group: 'Summary and share windows',
    label: 'Summary: best work heading',
    text: 'Best work',
  },
  {
    key: 'quick.workFor',
    group: 'Summary and share windows',
    label: 'Summary: best work heading when a role is chosen',
    text: 'Best work for {role}',
    vars: ['role'],
  },
  {
    key: 'quick.skills',
    group: 'Summary and share windows',
    label: 'Summary: skills heading',
    text: 'Skills',
  },
  {
    key: 'quick.full',
    group: 'Summary and share windows',
    label: 'Summary: link to the full portfolio',
    text: 'Read the full portfolio',
  },
  {
    key: 'share.title',
    group: 'Summary and share windows',
    label: 'Share window title',
    text: 'Share this portfolio',
  },
  {
    key: 'share.help',
    group: 'Summary and share windows',
    label: 'Share window text',
    text: 'Scan the code, copy the link or save my contact.',
  },
  {
    key: 'share.saveContact',
    group: 'Summary and share windows',
    label: 'Save contact button',
    text: 'Save my contact',
  },
  {
    key: 'share.cv',
    group: 'Summary and share windows',
    label: 'Print-ready CV button',
    text: 'Print-ready CV',
  },

  // The project window (case study)
  { key: 'case.overview', group: 'Project window', label: 'Heading: overview', text: 'Overview' },
  {
    key: 'case.problem',
    group: 'Project window',
    label: 'Heading: problem statement',
    text: 'Problem statement',
  },
  {
    key: 'case.objectives',
    group: 'Project window',
    label: 'Heading: objectives',
    text: 'Objectives',
  },
  {
    key: 'case.dataSources',
    group: 'Project window',
    label: 'Heading: data sources',
    text: 'Data sources',
  },
  {
    key: 'case.methodology',
    group: 'Project window',
    label: 'Heading: methodology',
    text: 'Methodology',
  },
  {
    key: 'case.implementation',
    group: 'Project window',
    label: 'Heading: implementation',
    text: 'Implementation',
  },
  {
    key: 'case.features',
    group: 'Project window',
    label: 'Heading: key features',
    text: 'Key features',
  },
  { key: 'case.results', group: 'Project window', label: 'Heading: results', text: 'Results' },
  {
    key: 'case.numbers',
    group: 'Project window',
    label: 'Heading: results in numbers',
    text: 'Results in numbers',
  },
  {
    key: 'case.challenges',
    group: 'Project window',
    label: 'Heading: challenges',
    text: 'Challenges',
  },
  {
    key: 'case.solutions',
    group: 'Project window',
    label: 'Heading: how I solved them',
    text: 'How I solved them',
  },
  {
    key: 'case.conclusions',
    group: 'Project window',
    label: 'Heading: conclusions',
    text: 'Conclusions and next steps',
  },
  {
    key: 'case.learnings',
    group: 'Project window',
    label: 'Heading: what I learned',
    text: 'What I learned',
  },
  {
    key: 'case.visuals',
    group: 'Project window',
    label: 'Heading: pictures, charts and diagrams',
    text: 'Pictures, charts and diagrams',
  },
  {
    key: 'case.tools',
    group: 'Project window',
    label: 'Heading: tools and technologies',
    text: 'Tools and technologies',
  },
  {
    key: 'case.facts',
    group: 'Project window',
    label: 'Heading: project facts',
    text: 'Project facts',
  },
  {
    key: 'case.contents',
    group: 'Project window',
    label: 'Heading of the list of parts (large screens)',
    text: 'On this page',
  },
  { key: 'case.code', group: 'Project window', label: 'Code button', text: 'View the code' },
  {
    key: 'case.live',
    group: 'Project window',
    label: 'Live demo button',
    text: 'Open the live demo',
  },

  // Certificates
  {
    key: 'certs.details',
    group: 'Certifications',
    label: 'Button that opens a certificate',
    text: 'View certificate',
  },
  {
    key: 'certs.about',
    group: 'Certifications',
    label: 'Heading: about the certificate',
    text: 'About this certificate',
  },
  { key: 'exp.visit', group: 'Experience', label: 'Link: visit the company website', text: 'Visit website' },
  { key: 'exp.more', group: 'Experience', label: 'Button: show all points of a role', text: 'View more' },
  { key: 'exp.less', group: 'Experience', label: 'Button: show fewer points of a role', text: 'View less' },
  {
    key: 'exp.responsibilities',
    group: 'Experience',
    label: 'Heading: points of a role',
    text: 'Key responsibilities',
  },
  { key: 'certs.issuer', group: 'Certifications', label: 'Label: issued by', text: 'Issued by' },
  { key: 'certs.issued', group: 'Certifications', label: 'Label: date issued', text: 'Issued' },
  {
    key: 'certs.credential',
    group: 'Certifications',
    label: 'Label: credential ID',
    text: 'Credential ID',
  },
  {
    key: 'certs.skills',
    group: 'Certifications',
    label: 'Heading: skills covered',
    text: 'Skills covered',
  },
  {
    key: 'certs.openFile',
    group: 'Certifications',
    label: 'Button: open the file in a new tab',
    text: 'Open in a new tab',
  },
  {
    key: 'certs.download',
    group: 'Certifications',
    label: 'Button: download the file',
    text: 'Download',
  },

  // Achievements
  {
    key: 'ach.details',
    group: 'Achievements',
    label: 'Button that opens an achievement',
    text: 'Read more',
  },
  { key: 'ach.all', group: 'Achievements', label: 'Filter: all categories', text: 'All' },
  {
    key: 'ach.background',
    group: 'Achievements',
    label: 'Heading: background',
    text: 'Background',
  },
  {
    key: 'ach.impact',
    group: 'Achievements',
    label: 'Heading: why it matters',
    text: 'Why it matters',
  },
  { key: 'ach.links', group: 'Achievements', label: 'Heading: links', text: 'Links' },
  {
    key: 'ach.files',
    group: 'Achievements',
    label: 'Heading: pictures and documents',
    text: 'Pictures and documents',
  },
  {
    key: 'ach.organization',
    group: 'Achievements',
    label: 'Label: organisation or event',
    text: 'Organisation or event',
  },
  { key: 'ach.date', group: 'Achievements', label: 'Label: when', text: 'When' },
  {
    key: 'ach.cat.hackathon',
    group: 'Achievements',
    label: 'Category: hackathon',
    text: 'Hackathon',
  },
  {
    key: 'ach.cat.competition',
    group: 'Achievements',
    label: 'Category: competition',
    text: 'Competition',
  },
  { key: 'ach.cat.award', group: 'Achievements', label: 'Category: award', text: 'Award' },
  { key: 'ach.cat.research', group: 'Achievements', label: 'Category: research', text: 'Research' },
  {
    key: 'ach.cat.milestone',
    group: 'Achievements',
    label: 'Category: technical milestone',
    text: 'Technical milestone',
  },
  {
    key: 'ach.cat.recognition',
    group: 'Achievements',
    label: 'Category: recognition',
    text: 'Recognition',
  },
  { key: 'ach.cat.other', group: 'Achievements', label: 'Category: other', text: 'Other' },

  // Shared
  {
    key: 'common.close',
    group: 'Summary and share windows',
    label: 'Close button (windows)',
    text: 'Close',
  },

  // Search engines and sharing
  {
    key: 'seo.title',
    group: 'Search engines and sharing',
    label: 'Page title (browser tab and search results)',
    text: '{shortName} | Data Science, Analytics & ML Portfolio',
    vars: ['name', 'shortName', 'title'],
  },
  {
    key: 'seo.description',
    group: 'Search engines and sharing',
    label: 'Description (search results and link previews)',
    text: 'Portfolio of {name}: projects, skills and experience across data science, data engineering, data analytics and machine learning.',
    long: true,
    vars: ['name', 'shortName', 'title'],
  },
  {
    key: 'seo.siteName',
    group: 'Search engines and sharing',
    label: 'Site name in link previews',
    text: '{shortName} Portfolio',
    vars: ['name', 'shortName'],
  },
  {
    key: 'seo.keywords',
    group: 'Search engines and sharing',
    label: 'Keywords (comma separated)',
    text: 'Data Science, Data Engineering, Data Analytics, Machine Learning, Python, Portfolio',
    long: true,
  },
  {
    key: 'og.label',
    group: 'Search engines and sharing',
    label: 'Small word on the link-preview picture',
    text: 'PORTFOLIO',
  },
  {
    key: 'og.tagline',
    group: 'Search engines and sharing',
    label: 'Line on the link-preview picture (empty = list of your roles)',
    text: '',
    optional: true,
    long: true,
  },
] as const satisfies readonly CopyField[];

const allFields = [...sectionFields, ...otherFields] as const satisfies readonly CopyField[];

export type CopyKey = (typeof allFields)[number]['key'];

export const COPY_FIELDS: readonly CopyField[] = allFields;

export const COPY_DEFAULTS = Object.fromEntries(allFields.map((f) => [f.key, f.text])) as Record<
  CopyKey,
  string
>;

const KNOWN = new Map<string, CopyField>(COPY_FIELDS.map((f) => [f.key, f]));

export const MAX_COPY_LENGTH = 600;

// Keeps only entries for wording that exists. A cleared field goes back to the built-in text, except for
// fields that may be empty on purpose.
export function mergeCopy(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
    const field = KNOWN.get(key);
    if (!field || typeof raw !== 'string') return;
    const text = raw.trim().slice(0, MAX_COPY_LENGTH);
    if (text === '' && !field.optional) return;
    if (text === field.text) return;
    out[key] = text;
  });
  return out;
}

export type Translate = (key: CopyKey, vars?: Record<string, string | number>) => string;

export function fill(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

export function makeTranslate(overrides: Record<string, string> | undefined): Translate {
  const custom = overrides ?? {};
  return (key, vars) =>
    fill(
      Object.prototype.hasOwnProperty.call(custom, key) ? custom[key] : COPY_DEFAULTS[key],
      vars
    );
}

// Groups for the admin page, in the order they first appear
export function copyGroups(): { group: string; fields: CopyField[] }[] {
  const groups = new Map<string, CopyField[]>();
  COPY_FIELDS.forEach((field) =>
    groups.set(field.group, [...(groups.get(field.group) ?? []), field])
  );
  return Array.from(groups.entries()).map(([group, fields]) => ({ group, fields }));
}

// The admin Help: for each thing a visitor sees on the site, what it is, where its content comes from and
// which admin page changes it. Wording that can be edited is listed by key; its label comes from lib/copy.ts.
import type { CopyKey } from './copy';

export const HELP_AREAS = [
  'Top of the page',
  'Charts',
  'Projects',
  'Skills',
  'Experience and education',
  'Proof and contact',
  'Look and menu',
  'Resumes',
  'Uploading files',
] as const;

export type HelpArea = (typeof HELP_AREAS)[number];

export interface HelpStep {
  text: string;
  // an admin page that makes this change
  href?: string;
}

export interface HelpTopic {
  id: string;
  area: HelpArea;
  // what the visitor sees
  title: string;
  // how it looks or what it says
  seen: string;
  // the place on the public site
  anchor?: string;
  // where the content comes from
  from: string;
  steps: HelpStep[];
  // the wording of this part, edited in Text and labels
  textKeys?: CopyKey[];
  // extra words the search matches
  words?: string[];
}

const A = {
  personal: '/admin/personal',
  profile: '/admin/profile',
  roles: '/admin/roles',
  projects: '/admin/projects',
  skills: '/admin/skills',
  experience: '/admin/experience',
  education: '/admin/education',
  certificates: '/admin/certifications',
  achievements: '/admin/achievements',
  recommendations: '/admin/recommendations',
  site: '/admin/site',
  appearance: '/admin/appearance',
  text: '/admin/text',
  resumes: '/admin/resumes',
  messages: '/admin/messages',
  insights: '/admin/insights',
} as const;

export const HELP_TOPICS: HelpTopic[] = [
  // ---------------------------------------------------------------- top of the page
  {
    id: 'hero-intro',
    area: 'Top of the page',
    title: 'Your name, title and introduction',
    seen: 'The big name, the job title and the short introduction at the very top.',
    anchor: '/#top',
    from: 'Personal Info: name, short name, title, subtitle and description.',
    steps: [
      { text: 'Open Personal Info and change the Basic and Professional information.', href: A.personal },
      { text: 'The greeting and button wording is in Text and labels.', href: A.text },
    ],
    textKeys: ['hero.greeting', 'hero.viewProjects', 'hero.summaryButton'],
    words: ['name', 'headline', 'subtitle', 'welcome'],
  },
  {
    id: 'photo',
    area: 'Top of the page',
    title: 'Your profile photo',
    seen: 'A round, arched or framed portrait next to your name. Without a photo, your initials are shown.',
    anchor: '/#top',
    from: 'Profile photo and media: the uploaded picture and how it is cropped.',
    steps: [
      { text: 'Upload, replace, crop or remove the photo.', href: A.profile },
      { text: 'Only some looks show a photo. Pick one that does under Appearance > Look.', href: A.appearance },
    ],
    words: ['picture', 'avatar', 'portrait', 'image'],
  },
  {
    id: 'role-switch',
    area: 'Top of the page',
    title: 'View as: the role switch and role cards',
    seen: 'The buttons "Data Scientist, Engineer, Analyst..." and the cards that show how many projects and skills each role has.',
    anchor: '/#top',
    from: 'Roles: each role has a name, a job title, a colour, an icon and keywords. Projects and skills are counted by matching those keywords.',
    steps: [
      { text: 'Add, rename, remove or recolour a role.', href: A.roles },
      { text: 'To force a project into a role, tick the role on that project (Technologies, tools and roles).', href: A.projects },
      { text: 'Switch the role switch or the pipeline look on and off.', href: A.appearance },
    ],
    textKeys: ['hero.viewAs', 'hero.viewingAs', 'hero.rolesHeading'],
    words: ['view as', 'track', 'career direction', 'pipeline'],
  },
  {
    id: 'hero-chart',
    area: 'Top of the page',
    title: 'The technology constellation (hero chart)',
    seen: 'A web of dots, one for each technology, beside the introduction. Colour shows the role.',
    anchor: '/#top',
    from: 'The Technologies listed on your projects, coloured by role.',
    steps: [
      { text: 'Add or remove technologies on a project and the dots change.', href: A.projects },
      { text: 'Change the colours of the roles.', href: A.roles },
      { text: 'Hide it with the Hero chart switch under Other features.', href: A.appearance },
    ],
    textKeys: ['hero.chartTitle', 'hero.chartHelp'],
    words: ['constellation', 'dots', 'web'],
  },
  {
    id: 'kpis',
    area: 'Top of the page',
    title: 'Number tiles (projects, technologies, certifications, CGPA)',
    seen: 'Big numbers that count up when they appear.',
    anchor: '/#top',
    from: 'The numbers you typed in Site settings > Key numbers. If you typed none, they are counted from your content: projects, technologies, certifications and CGPA (or the number of skills).',
    steps: [
      { text: 'Type your own key numbers (label and value).', href: A.site },
      { text: 'The CGPA comes from Personal Info > Academic information.', href: A.personal },
      { text: 'Show or hide the tiles under Appearance > Charts.', href: A.appearance },
    ],
    words: ['kpi', 'highlights', 'stats', 'counting'],
  },
  {
    id: 'facts',
    area: 'Top of the page',
    title: 'Facts strip (education, graduation, based in)',
    seen: 'A thin strip with your latest degree, graduation date and location.',
    anchor: '/#top',
    from: 'The first entry in Education, plus graduation, CGPA and location from Personal Info.',
    steps: [
      { text: 'Put your newest education first (use the move buttons).', href: A.education },
      { text: 'Change graduation and location.', href: A.personal },
    ],
    textKeys: ['facts.education', 'facts.graduation', 'facts.basedIn'],
  },
  {
    id: 'availability',
    area: 'Top of the page',
    title: 'Availability badge ("Open to work")',
    seen: 'A small badge near the top of the page.',
    anchor: '/#top',
    from: 'Site settings > Availability badge.',
    steps: [{ text: 'Switch it on or off and write what it says.', href: A.site }],
    words: ['open to work', 'hiring', 'badge'],
  },
  {
    id: 'about',
    area: 'Top of the page',
    title: 'About: your story, quick facts and current focus',
    seen: 'The About section with your story, a list of quick facts and what you are focusing on.',
    anchor: '/#about',
    from: 'Personal Info: the About text, the Quick facts list and the Current focus items.',
    steps: [
      { text: 'Edit the text, add or reorder quick facts.', href: A.personal },
      { text: 'Rename the headings.', href: A.text },
    ],
    textKeys: ['about.quickFacts', 'about.currentFocus'],
    words: ['bio', 'story', 'quick facts'],
  },

  // ---------------------------------------------------------------- charts
  {
    id: 'heatmap',
    area: 'Charts',
    title: 'Which technology, which project (skills heatmap)',
    seen: 'A grid. Each row is a technology, each column is a project, and a filled cell means the project uses that technology. "Select a technology to filter, or a filled cell to open the project."',
    anchor: '/#insights',
    from: 'The Technologies field of each project. The rows are your most-used technologies (up to 14); the columns are your projects. Spelling differences such as "Power BI" and "PowerBI" count as one.',
    steps: [
      { text: 'To add a technology to the grid, open a project and add it under Technologies, tools and roles > Technologies. (The "Other tools" field is not used here.)', href: A.projects },
      { text: 'A technology that is used by more projects ranks higher and appears first.' },
      { text: 'To change the heading or the sentence under it, edit the wording.', href: A.text },
      { text: 'Show, hide or reorder this chart under Appearance > Charts.', href: A.appearance },
    ],
    textKeys: ['chart.heatmap.title', 'chart.heatmap.help'],
    words: ['grid', 'matrix', 'filled cell', 'add technology'],
  },
  {
    id: 'techmap',
    area: 'Charts',
    title: 'Technology map',
    seen: 'Bubbles. "Colour shows the role; a number shows how many projects use it. Select one to filter the projects."',
    anchor: '/#insights',
    from: 'The Technologies of your projects (up to 40). A bubble\'s number is how many projects use it. Its colour is the role it belongs to: a technology named in only one role\'s keywords takes that role; a general tool such as Python takes the role whose projects use it most.',
    steps: [
      { text: 'Add a technology: open a project and add it under Technologies. A new bubble appears.', href: A.projects },
      { text: 'Change a bubble\'s colour: tick the role on the project, or edit the role keywords.', href: A.roles },
      { text: 'Change the heading or the sentence under it.', href: A.text },
      { text: 'Show, hide or reorder the chart.', href: A.appearance },
    ],
    textKeys: ['chart.techmap.title', 'chart.techmap.help'],
    words: ['bubbles', 'colour', 'color', 'add technology'],
  },
  {
    id: 'radar',
    area: 'Charts',
    title: 'Skills radar',
    seen: 'A spider chart comparing your skills and projects across the roles. "Select a role to see its projects."',
    anchor: '/#insights',
    from: 'For each role: the number of your skills that match its keywords and the number of projects that belong to it.',
    steps: [
      { text: 'Change which skills count for a role with its Keywords and Extra keywords.', href: A.roles },
      { text: 'Add skills.', href: A.skills },
      { text: 'Add projects, or set their roles.', href: A.projects },
      { text: 'Edit the wording.', href: A.text },
    ],
    textKeys: ['chart.radar.title', 'chart.radar.help'],
    words: ['spider', 'web chart'],
  },
  {
    id: 'per-year',
    area: 'Charts',
    title: 'Projects per year',
    seen: 'A bar chart. "Select a bar to see what I built that year."',
    anchor: '/#insights',
    from: 'The Year of each project.',
    steps: [
      { text: 'Set the year in the project\'s Basics tab.', href: A.projects },
      { text: 'Edit the wording.', href: A.text },
    ],
    textKeys: ['chart.year.title', 'chart.year.help'],
    words: ['bars', 'timeline of projects'],
  },
  {
    id: 'charts-order',
    area: 'Charts',
    title: 'Which charts show, and in what order',
    seen: 'The Insights section ("My portfolio, as data") with its charts and the "download the numbers" line.',
    anchor: '/#insights',
    from: 'Appearance > Charts for the chart list; Other features for downloads.',
    steps: [
      { text: 'Tick the charts you want and move them up or down.', href: A.appearance },
      { text: 'Switch "Download my data" on or off under Other features.', href: A.appearance },
      { text: 'Change the section title and introduction.', href: A.text },
    ],
    textKeys: ['insights.download'],
    words: ['insights', 'widgets', 'download', 'csv', 'json'],
  },

  // ---------------------------------------------------------------- projects
  {
    id: 'projects',
    area: 'Projects',
    title: 'Project cards',
    seen: 'The grid of projects with title, short description, technologies and buttons.',
    anchor: '/#projects',
    from: 'Projects: each project\'s title, subtitle, description, technologies, links, year and picture.',
    steps: [
      { text: 'Add or edit a project. Use the move buttons to change the order.', href: A.projects },
      { text: 'A project marked "Visible on my site" off is a draft and visitors never see it.', href: A.projects },
      { text: 'Rename the buttons.', href: A.text },
    ],
    textKeys: ['projects.code', 'projects.live', 'projects.caseStudy', 'projects.featuredBadge'],
    words: ['cards', 'draft', 'publish', 'order'],
  },
  {
    id: 'featured',
    area: 'Projects',
    title: 'Featured project tile',
    seen: 'One highlighted project near the top of the page.',
    anchor: '/#top',
    from: 'The first project marked Featured (or the first project if none is).',
    steps: [{ text: 'Tick "Featured project" in The card on your homepage.', href: A.projects }],
    textKeys: ['tile.featured', 'tile.open'],
  },
  {
    id: 'case-study',
    area: 'Projects',
    title: 'Case study window ("View more")',
    seen: 'A pop-up with the full story: problem, approach, results, pictures and more. It has its own link.',
    anchor: '/#projects',
    from: 'Projects > Case study tab. Only the parts you write are shown.',
    steps: [
      { text: 'Fill in the story, extra sections and pictures.', href: A.projects },
      { text: 'Switch case-study windows on or off under Other features.', href: A.appearance },
    ],
    textKeys: ['projects.details', 'projects.viewMore'],
    words: ['drawer', 'details', 'screenshots', 'pictures'],
  },
  {
    id: 'project-filters',
    area: 'Projects',
    title: 'Search, technology and year filters',
    seen: 'The search box and the dropdowns above the projects.',
    anchor: '/#projects',
    from: 'Built automatically from the technologies, years and roles of your projects.',
    steps: [
      { text: 'To add a technology to the filter, add it to a project.', href: A.projects },
      { text: 'Rename the labels.', href: A.text },
      { text: 'The "query bar" style is under Appearance > Other features.', href: A.appearance },
    ],
    textKeys: ['projects.search', 'projects.technology', 'projects.year', 'projects.order'],
    words: ['filter', 'query', 'search'],
  },

  // ---------------------------------------------------------------- skills
  {
    id: 'skills',
    area: 'Skills',
    title: 'Technical skills',
    seen: 'Skills grouped by category, with tabs for each role.',
    anchor: '/#skills',
    from: 'Skills: categories and the skills in each one. Which skills show under a role tab comes from that role\'s keywords.',
    steps: [
      { text: 'Add, rename, reorder or remove categories and skills.', href: A.skills },
      { text: 'Choose which skills belong to a role.', href: A.roles },
      { text: 'Click-through to projects and certificates is the Skill and tag explorer under Other features.', href: A.appearance },
    ],
    textKeys: ['skills.all', 'skills.hintExplorer'],
    words: ['categories', 'tags', 'explorer'],
  },

  // ---------------------------------------------------------------- experience and education
  {
    id: 'experience',
    area: 'Experience and education',
    title: 'Experience',
    seen: 'Your jobs, internships and leadership roles with their bullet points.',
    anchor: '/#experience',
    from: 'Experience: title, company, location, dates, type and bullet points.',
    steps: [{ text: 'Edit entries or change their order.', href: A.experience }],
    words: ['work', 'jobs', 'internship'],
  },
  {
    id: 'education',
    area: 'Experience and education',
    title: 'Education',
    seen: 'Your degrees and schools with grade and coursework.',
    anchor: '/#education',
    from: 'Education: institution, degree, dates, grade and coursework.',
    steps: [{ text: 'Edit entries. The first one is also used in the facts strip.', href: A.education }],
    textKeys: ['education.coursework'],
    words: ['college', 'school', 'degree', 'cgpa'],
  },
  {
    id: 'timeline',
    area: 'Experience and education',
    title: 'Career timeline',
    seen: 'One timeline with education, experience, certificates and projects, with filters.',
    anchor: '/#timeline',
    from: 'Built automatically from Education, Experience, Certificates and Projects. There is nothing to type for it.',
    steps: [
      { text: 'Change the entries on their own pages. The dates you type decide the order.', href: A.experience },
      { text: 'Switch the timeline on or off.', href: A.appearance },
    ],
    textKeys: ['timeline.all'],
  },

  // ---------------------------------------------------------------- proof and contact
  {
    id: 'certificates',
    area: 'Proof and contact',
    title: 'Certificates',
    seen: 'Certificate cards with a thumbnail, a viewer and Verify, Open and Download buttons.',
    anchor: '/#certifications',
    from: 'Certificates: title, issuer, date, credential ID, verification link, skills and the uploaded picture or PDF.',
    steps: [
      { text: 'Add or edit a certificate. A certificate set to hidden is not shown.', href: A.certificates },
      { text: 'Extra, text-only certifications can be added in Site settings.', href: A.site },
    ],
    textKeys: ['certs.verify', 'certs.view'],
    words: ['badge', 'pdf', 'credential'],
  },
  {
    id: 'achievements',
    area: 'Proof and contact',
    title: 'Achievements',
    seen: 'Cards for awards, hackathons and milestones, with a detail window.',
    anchor: '/#achievements',
    from: 'Achievements: title, category, organisation, date, story, impact, links and files.',
    steps: [{ text: 'Add or edit an achievement. Drafts are never shown.', href: A.achievements }],
    words: ['awards', 'hackathon', 'honours'],
  },
  {
    id: 'moments',
    area: 'Proof and contact',
    title: 'Moments: pictures by year, and popups',
    seen: 'A strip of pictures grouped by year. Hover a picture (or tap it on a phone) to read a few words; select it to open it larger. A moment can also open as a polite popup.',
    anchor: '/#moments',
    from: 'Moments: title, a few words, year, picture, an optional link, and the popup settings. The whole feature is off until you switch it on.',
    steps: [
      { text: 'Add a moment: title, a few words, year and a picture. Save it as a draft or publish it.', href: '/admin/moments' },
      { text: 'Switch the feature on under Appearance > Other features > Moments. Switch it off to hide the strip and every popup (nothing you wrote is lost).', href: A.appearance },
      { text: 'For a popup: tick "Also show as a popup" on the moment, choose the first and last day (optional), the delay and how often. "Once on each device" is the default, so nobody sees it again and again; editing the moment shows it once more.' },
      { text: 'Rename the buttons, and the section heading, in Text and labels.', href: A.text },
      { text: 'To remove the whole feature from the code, ask for it to be reverted: it was added in one separate change.' },
    ],
    textKeys: ['moments.open'],
    words: ['popup', 'pop up', 'hover', 'image', 'year', 'announcement', 'milestone'],
  },
  {
    id: 'recommendations',
    area: 'Proof and contact',
    title: 'Recommendations wall',
    seen: 'Quotes from mentors, managers and teammates.',
    anchor: '/#recommendations',
    from: 'Recommendations. The section only appears when you have added at least one.',
    steps: [
      { text: 'Add quotes with the person\'s name, role and relation.', href: A.recommendations },
      { text: 'Switch the wall on or off.', href: A.appearance },
    ],
    textKeys: ['recs.link'],
    words: ['testimonials', 'quotes', 'reviews'],
  },
  {
    id: 'work-with-me',
    area: 'Proof and contact',
    title: 'Work with me panel',
    seen: 'Availability, the roles you want, location, start date and a Book a call button.',
    anchor: '/#work',
    from: 'Site settings > Work with me.',
    steps: [
      { text: 'Fill in the roles, location, remote, start date, contact and booking link.', href: A.site },
      { text: 'Rename the buttons.', href: A.text },
    ],
    textKeys: ['work.roles', 'work.book', 'work.message'],
  },
  {
    id: 'contact',
    area: 'Proof and contact',
    title: 'Contact cards and the contact form',
    seen: 'Email, phone, LinkedIn and GitHub cards, and the message form.',
    anchor: '/#contact',
    from: 'The cards come from Personal Info (email, phone and links). The form topics come from Site settings. Messages visitors send arrive in Messages.',
    steps: [
      { text: 'Change email, phone and social links.', href: A.personal },
      { text: 'Change the topics visitors can choose.', href: A.site },
      { text: 'Read and reply to messages.', href: A.messages },
      { text: 'Rename the labels.', href: A.text },
    ],
    textKeys: ['contact.emailLabel', 'contact.form.send'],
    words: ['email', 'phone', 'linkedin', 'github', 'form', 'footer', 'social'],
  },
  {
    id: 'share',
    area: 'Proof and contact',
    title: 'Share, QR code and save-contact',
    seen: 'Buttons to copy the link, show a QR code and save your contact card.',
    from: 'Built from your name, email, phone and links in Personal Info.',
    steps: [
      { text: 'Fill in your details.', href: A.personal },
      { text: 'Switch the share tools and the 30-second summary on or off.', href: A.appearance },
    ],
    words: ['vcard', 'qr', 'summary', '30-second'],
  },

  // ---------------------------------------------------------------- look and menu
  {
    id: 'look',
    area: 'Look and menu',
    title: 'The look, colours and animations',
    seen: 'Everything about how the whole site is laid out and coloured.',
    from: 'Appearance: Look, Colours (light, dark, accent), Animations and the Data-enthusiast style.',
    steps: [
      { text: 'Choose one of the looks and preview it before saving.', href: A.appearance },
    ],
    words: ['theme', 'template', 'dark mode', 'accent', 'layout'],
  },
  {
    id: 'sections',
    area: 'Look and menu',
    title: 'Which sections show, and in what order',
    seen: 'The order of the sections down the page and the numbers beside their headings.',
    from: 'Appearance > Sections.',
    steps: [
      { text: 'Tick, untick and move the sections.', href: A.appearance },
      { text: 'Rename the section headings and introductions.', href: A.text },
    ],
    words: ['order', 'hide section', 'reorder', 'menu'],
  },
  {
    id: 'wording',
    area: 'Look and menu',
    title: 'Any heading, button or line of wording',
    seen: 'Every piece of text that is not your own content.',
    from: 'Text and labels. Use its search box to find a text.',
    steps: [{ text: 'Search for the words you see on the site, then edit them. Clear the box to go back to the original.', href: A.text }],
    words: ['label', 'heading', 'button', 'rename', 'translate'],
  },
  {
    id: 'insights-stats',
    area: 'Look and menu',
    title: 'Who visits your site',
    seen: 'Nothing: this is for you. Page views, most opened projects and resume downloads.',
    from: 'Counted from visits and clicks, with no personal data.',
    steps: [
      { text: 'Open Insights.', href: A.insights },
      { text: 'Counting is switched on under Appearance > Other features > Visitor insights.', href: A.appearance },
    ],
    words: ['analytics', 'views', 'visitors'],
  },

  // ---------------------------------------------------------------- resumes
  {
    id: 'resume-button',
    area: 'Resumes',
    title: 'Resume button for visitors',
    seen: 'A Download resume button. When visitors choose a role, they get the resume you wrote for that role.',
    anchor: '/#top',
    from: 'Resumes: only resumes marked Public are offered. Each can be set for a role or for any role.',
    steps: [
      { text: 'Upload a resume, or build one, then click Private to make it Public.', href: A.resumes },
      { text: 'Choose the role each resume is offered for.', href: A.resumes },
    ],
    words: ['cv', 'download', 'pdf', 'public'],
  },
  {
    id: 'resume-builder',
    area: 'Resumes',
    title: 'Making an ATS-friendly resume',
    seen: 'Nothing on the public site: this makes the PDF you send to employers.',
    from: 'Your own portfolio content, picked and edited per resume. Your portfolio is never changed.',
    steps: [
      { text: 'Use Build resume: "Build my own" to tick what to include, or "Build from a job description" to get recommendations.', href: A.resumes },
      { text: 'Edit every part on the left, check the preview and the ATS checks, then download or save it.' },
    ],
    words: ['ats', 'job description', 'jd', 'keywords', 'build'],
  },
];

// How to upload each kind of file, and where it shows afterwards
const FILE_RULES = 'Pictures: JPEG, PNG, WebP or GIF; PDFs for documents. Up to 4 MB each. The type is checked from the file itself, so renaming a file does not work.';

HELP_TOPICS.push(
  {
    id: 'upload-photo',
    area: 'Uploading files',
    title: 'Upload your profile photo',
    seen: 'Your portrait in the top of the page (looks with a photo layout only).',
    anchor: '/#top',
    from: 'Stored privately in the portfolio-files bucket and shown through a short-lived link.',
    steps: [
      { text: 'Open Profile photo and media, click Upload, choose a picture. ' + FILE_RULES, href: A.profile },
      { text: 'Move the sliders to crop and zoom, check the shapes, add alt text, then Save. It shows on the site only after you save.' },
      { text: 'If no photo appears, your chosen look has no photo layout. Pick another under Appearance > Look.', href: A.appearance },
    ],
    words: ['upload', 'picture', 'image', 'crop'],
  },
  {
    id: 'upload-project',
    area: 'Uploading files',
    title: 'Upload project pictures, screenshots and dashboards',
    seen: 'The project card picture and the pictures inside the case-study window (dashboards open first).',
    anchor: '/#projects',
    from: 'Stored privately; shown only while the project is published.',
    steps: [
      { text: 'Open the project, go to the Case study tab > Pictures, screenshots, charts and diagrams, and upload. ' + FILE_RULES, href: A.projects },
      { text: 'Mark each one as screenshot, dashboard, chart, diagram or photo and add a caption.' },
      { text: 'Save as draft to keep it private, or Save and publish to show it. A picture that is still used cannot be deleted by mistake.' },
    ],
    words: ['upload', 'screenshot', 'dashboard', 'image', 'gallery'],
  },
  {
    id: 'upload-certificate',
    area: 'Uploading files',
    title: 'Upload a certificate (picture or PDF)',
    seen: 'The thumbnail on the certificate card and the viewer with Verify, Open and Download.',
    anchor: '/#certifications',
    from: 'Stored privately; shown only for certificates that are set to show.',
    steps: [
      { text: 'Open Certificates, add or edit one, and upload under "The certificate itself". ' + FILE_RULES, href: A.certificates },
      { text: 'Add the verification link and the skills it covers, then save. Hidden certificates and their files are not served.' },
    ],
    words: ['upload', 'pdf', 'credential'],
  },
  {
    id: 'upload-achievement',
    area: 'Uploading files',
    title: 'Upload achievement photos and documents',
    seen: 'The pictures and files in the achievement\'s detail window.',
    anchor: '/#achievements',
    from: 'Stored privately; shown only for published achievements.',
    steps: [
      { text: 'Open Achievements, add or edit one and upload under "Photos and documents". ' + FILE_RULES, href: A.achievements },
      { text: 'Publish it. A draft and its files stay private.' },
    ],
    words: ['upload', 'photos', 'documents'],
  },
  {
    id: 'upload-moment',
    area: 'Uploading files',
    title: 'Upload a picture for a moment',
    seen: 'The picture on the yearly strip and in the popup.',
    anchor: '/#moments',
    from: 'Stored privately; shown only while the moment is published and Moments is switched on.',
    steps: [
      { text: 'Open Moments, add or edit one and upload under Picture. JPEG, PNG, WebP or GIF, up to 4 MB. The type is checked from the file itself.', href: '/admin/moments' },
      { text: 'Add a short description of the picture for screen readers, then save.' },
    ],
    words: ['upload', 'picture', 'popup'],
  },
  {
    id: 'upload-resume',
    area: 'Uploading files',
    title: 'Upload a resume you already have',
    seen: 'The Download resume button, once the resume is Public.',
    anchor: '/#top',
    from: 'Stored in the resumes bucket. PDF, DOC, DOCX or TXT, up to 10 MB.',
    steps: [
      { text: 'Open Resumes > Upload resume, name it, describe it and choose the file.', href: A.resumes },
      { text: 'It starts Private. Click Private to make it Public, and pick the role it is offered for.' },
      { text: 'Download in the list to check it. Delete removes the file and the record.' },
    ],
    words: ['upload', 'cv', 'pdf', 'public', 'private'],
  },
  {
    id: 'upload-built-resume',
    area: 'Uploading files',
    title: 'Save a resume made in the builder',
    seen: 'It joins your resume list like an uploaded one.',
    from: 'The builder writes the PDF and stores it in the resumes bucket for you.',
    steps: [
      { text: 'Build resume > Build my own or From a job description, edit it, then Save to my resumes. Download PDF saves it to your computer only.', href: A.resumes },
      { text: 'It is Private until you click Private to make it Public. The wand button reopens it with your edits.' },
    ],
    words: ['save', 'builder', 'ats'],
  },
  {
    id: 'upload-problems',
    area: 'Uploading files',
    title: 'Uploads say storage is not set up, or a file is refused',
    seen: 'An error message when you upload.',
    from: 'The private portfolio-files bucket must exist in Supabase; files are checked on the server.',
    steps: [
      { text: 'Run database/storage_portfolio_files.sql once in the Supabase SQL Editor to create the bucket.' },
      { text: 'Check size (4 MB, 10 MB for resumes) and type. SVG and scripts are refused. Large photos are shrunk in your browser first.' },
      { text: 'Still stuck? Resumes > Test checks the database and storage.', href: A.resumes },
    ],
    words: ['error', 'storage', 'bucket', 'refused', 'too large'],
  },
);

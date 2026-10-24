# Portfolio

A personal portfolio for data science, data engineering, data analytics and machine learning roles.
Everything on the site (content, wording, roles, look, order of sections) is controlled from the admin
panel, and a change appears on the public site as soon as you save it.

- **Public site** (`/`): an intro with a live technology chart, a "View as" role switch, key numbers,
  about, insights (charts drawn from your own data), projects with role / technology / year filters and a
  SQL-style query line, skills, a career timeline, experience, education, certifications, achievements,
  recommendations, a "Work with me" panel and a contact form. `Ctrl K` (`⌘ K` on Mac) searches everything.
- **Thirteen looks**, chosen in Admin > Templates and look: Dashboard, Bento, Data Lab (dark glass), Split
  profile, Data story, Portrait, Editorial, Terminal, Classic, Spotlight, Aurora, Brutalist and Notebook. Each
  has a light and a dark theme; the first five use your accent colour (blue, teal, violet or amber), the other
  eight have their own colours. Each look has a Preview button.
- **Profile photo** (Admin > Profile photo and media): optional, with a chosen crop and zoom; looks with a
  photo layout use it and show your initials until you upload one.
- **Project case studies**: each project can have a full story and pictures, shown in a "View more" window.
- **Certificates and achievements with files**: upload a picture or PDF, publish or keep as a draft.
- **Adapts to every screen**: phones (from 320 px), tablets, laptops and very large monitors.
- **Printable CV** (`/resume`): built from the same data, one page, for any role.
- **Admin panel** (`/admin`): password-protected editors with a live preview beside the form.
- **Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres and Storage).

## Run it locally

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run dev                     # http://localhost:3000
```

Without Supabase values the homepage still renders (with the sample content in `src/lib/data.ts`), but
the admin panel, resumes and the contact form need them. The admin password is the one whose hash is in
`ADMIN_PASSWORD_HASH`; `scripts/generate-admin-credentials.js` is only needed to make a new one.

## Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key (not used for data access; kept for completeness) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by the API routes. Never commit or expose it |
| `NEXT_PUBLIC_RESUME_BUCKET` | Storage bucket for resumes (default `resumes`) |
| `ADMIN_PASSWORD_HASH` | Hash of the admin password |
| `SESSION_SECRET` | 32+ random characters used to sign the admin session cookie |
| `NEXT_PUBLIC_SITE_URL` | Public address of the deployed site (links in search results and link previews) |

The variable list is unchanged by the newest features. The uploaded-file bucket name (`portfolio-files`) is
fixed in `src/lib/media.ts`; you only create the bucket once in Supabase.

## New features and the one Supabase step

Uploads (profile photo, project pictures, certificate and achievement files) go to a **private** Supabase
bucket named `portfolio-files` (4 MB per file; JPG, PNG, WebP, GIF, and PDF for certificates and achievements).
Create it once with `database/storage_portfolio_files.sql` or in the dashboard. New projects, certificates
and achievements start as drafts until published. Plain-English guide with checks and how to undo:
[docs/NEW_FEATURES.md](docs/NEW_FEATURES.md). Hosting steps: [DEPLOYMENT.md](DEPLOYMENT.md).

## What the admin panel controls

| Admin page | Controls |
| --- | --- |
| Personal Info | Name, headline, intro, about text, contact details, GitHub, LinkedIn and **other profile links**, CGPA, graduation, quick facts (including extra ones), current focus |
| Skills | Skill categories (with emoji) and the skills in them |
| Projects | Title, subtitle, description, year, status, featured flag, links, technologies, the roles a project belongs to, a full **case study** (problem, approach, features, challenges, results, numbers, screenshots) and an in-page live demo |
| Profile photo and media | The optional profile photo, its crop and zoom, and a description for screen readers |
| Certificates, Achievements | Entries with an uploaded picture or PDF, details and links, draft or published, re-ordering (certificates also have a verification link) |
| Experience, Education | Their entries |
| Recommendations | Quotes from mentors and teammates; the wall appears once there is one |
| Resumes | Upload resumes, make any number **Public**, and say which role each one is written for |
| **Templates and look** (Appearance) | The look, light / dark / follow-the-device, accent colour, animations, the one-switch **Data-enthusiast style**, the charts shown and their order, **the order and visibility of every section**, feature switches |
| **Roles** | The career directions of the site (starter: Data Engineering, Data Analytics, Data Science, ML Engineering): add, rename, reorder, recolour, keywords that match projects and skills, headline / summary / resume for each |
| **Text and labels** | About 130 pieces of wording: section names and headings, intro lines, buttons, form labels, the page title and description that search engines show, the link-preview text |
| Site Settings | Availability badge, key numbers (or leave empty to count them from your content), Work with me details, contact-form topics, extra certifications |
| Messages | Read and delete messages sent through the contact form |
| Insights | Visits and clicks (no cookies, no IP addresses, nothing identifying) |
| Content map | Everything stored and where it appears, with links to both |

Pages that change the site settings each save only their own part, reading the latest settings first, so
two pages (or two browser tabs) never overwrite each other.

## How roles work

Every role has a **name** (the discipline, such as "Data Engineering"), a **job title** ("Data Engineer"),
a one-line description, a pipeline stage, a colour, an icon and **keywords**. A project belongs to a role
when one of its technologies contains one of the role's keywords (short keywords such as `sql` or `ai` must
match a whole word), or when you tag the project by hand in Admin > Projects. Skills are matched the same
way. Removing a role never deletes anything: projects tagged with it simply stop showing it.

## Project structure

```
src/app/                 pages and API routes (App Router)
  page.tsx               the public homepage (refreshed on every admin save)
  resume/                the printable CV
  preview/               the admin live preview
  admin/                 admin panel pages
  api/                   auth, portfolio data, resumes, certificates, contact, messages, insights, tracking
src/components/site/     the public site (layouts, sections, charts, dialogs)
src/components/admin/    small building blocks shared by the admin pages
src/lib/                 types, defaults, roles, wording registry, settings, chart data, helpers
src/lib/server/          server-only code: sessions, rate limiting, content loader, insights
database/                SQL for Supabase (see DEPLOYMENT.md)
scripts/                 admin credential generator
```

## Customising in code

- **Starter roles and their keywords**: `src/lib/roles.ts` (only used until you save roles in the admin).
- **Built-in wording**: `src/lib/copy.ts` (anything you change in the admin is stored in the database).
- **Colours, spacing and shared styles**: `src/app/globals.css` (design tokens at the top).
- **Fallback content** shown only if the database cannot be reached: `src/lib/data.ts`.

## Security

- The admin session is a signed, httpOnly, same-site cookie; every write route checks it on the server.
- The Supabase service-role key is only used on the server. Public database access is switched off by
  Row Level Security (see `database/security_hardening.sql`).
- Resumes are private unless marked Public, and visitors only receive the public ones, with safe fields only.
- The contact form has validation, a honeypot field and rate limiting. Visit counting stores no personal data.

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # run the production build
npm run lint         # ESLint
npm run type-check   # TypeScript
```

See `DEPLOYMENT.md` for Supabase setup and publishing.

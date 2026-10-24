# Deployment guide (Supabase + Vercel)

## 1. Supabase

You need a Supabase project with two tables and three storage buckets (two public ones from step 1.5 and
one private one from step 1.6). The step-by-step guide for the newest features, with checks and a way back, is
in [docs/NEW_FEATURES.md](docs/NEW_FEATURES.md).

### 1.1 Create the tables

Dashboard > **SQL Editor** > **New query**, paste the whole of `database/init.sql`, then **Run**.

It is safe on an existing project: it only creates what is missing and never overwrites content you have
already edited.

### 1.2 Lock down public access (existing projects: do this once)

Run the steps in `database/security_hardening.sql`, one at a time. It removes any policy that lets the
public (anon) key read or write your tables or storage. The site and admin keep working because the server
uses the service-role key.

### 1.3 Contact form storage

Run `database/contact_messages.sql`. Until you do, the contact form shows a "temporarily unavailable"
message and Admin > Messages explains what is missing.

### 1.4 Visitor insights (optional)

Run `database/site_events.sql` to switch on Admin > Insights (visit and click counts with no personal data).
Without it everything else works; Admin > Insights just explains that this step is missing.

### 1.5 Storage buckets

Dashboard > **Storage** > **New bucket**:

| Bucket | Public | Purpose |
| --- | --- | --- |
| `resumes` | Yes | Resume files (a file is only linked from your site if you mark it Public) |
| `certificates` | Yes | Certificate images uploaded in Admin > Certifications |

Do not add storage policies for these buckets. Uploads and deletes go through the server.

### 1.6 The private bucket for uploaded files (needed for photo, project pictures, certificate and achievement files)

Create one more bucket, called exactly `portfolio-files`, and keep it **private** (Public off). Either:

- Dashboard > **Storage** > **New bucket**, name `portfolio-files`, Public **off**, and if offered a 4 MB file
  size limit and the types `image/jpeg, image/png, image/webp, image/gif, application/pdf`; or
- paste `database/storage_portfolio_files.sql` into **SQL Editor** and Run it. It is safe to run twice, changes
  no table and deletes nothing.

Add no policies to it. Until it exists the site works as before and only uploading a file fails, with a message
saying the bucket does not exist. Visitors get files through `/api/media/...`, which hands out a 10-minute
link only for files that belong to published content.

### 1.7 Keys

Dashboard > **Project Settings > API**: copy the project URL, the anon key and the service-role (secret) key.

## 2. Admin credentials

```bash
node scripts/generate-admin-credentials.js
```

Type the admin password you want. It prints `ADMIN_PASSWORD_HASH` and `SESSION_SECRET`.
Keep them out of Git.

## 3. Vercel

1. Import the GitHub repository at https://vercel.com/new (framework: Next.js, defaults are fine).
2. **Settings > Environment Variables**: add every variable from `.env.example` with your real values
   (Production, and Preview if you use it). `NEXT_PUBLIC_SITE_URL` is your final address.
3. Deploy. Add a custom domain under **Settings > Domains** if you have one, then update `NEXT_PUBLIC_SITE_URL`.

## 4. Check the deployed site

- [ ] Homepage loads with your real content (not the sample content).
- [ ] `/admin/login` accepts your password; a wrong one is rejected.
- [ ] Edit something in the admin, save, and see it on the homepage straight away.
- [ ] Admin > Appearance: choose another look, save, and see it on the homepage.
- [ ] Admin > Roles: rename a role, save, and see the new name on the role switch and role cards.
- [ ] Admin > Text and labels: change a heading, save, and see it on the homepage.
- [ ] Admin > Resumes: upload a PDF, mark it Public, see the Download button on the homepage.
- [ ] Admin > Profile photo and media: upload a picture, save, and reload to see it is kept.
- [ ] Admin > Projects: add a project with a picture, save and publish it, then open **View more** on its card as a visitor.
- [ ] Admin > Certificates: add a certificate with a PDF, publish it, and open it from the homepage in a private window.
- [ ] The full 7-step check, including unpublish and delete, is in `docs/NEW_FEATURES.md` (section 3, part E).
- [ ] On a phone (or the browser's device mode), scroll the whole homepage: nothing should be cut off or need sideways scrolling.
- [ ] Send a test message from the contact form and find it in Admin > Messages.
- [ ] `/robots.txt` and `/sitemap.xml` open, and a link preview shows your name.
- [ ] As a visitor (private window), `/api/portfolio/data` lists no resumes unless one is Public.

## 5. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Homepage shows sample content | The server cannot read Supabase: check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel |
| "Admin authentication is not configured" | `ADMIN_PASSWORD_HASH` or `SESSION_SECRET` is missing (or `SESSION_SECRET` is under 32 characters) |
| "Too many failed attempts" | Five wrong passwords: wait 15 minutes |
| Admin editors say saved content could not be loaded | Supabase unreachable or tables missing. Editing is disabled on purpose so nothing is overwritten |
| Resume upload fails | The `resumes` bucket does not exist, or the file is not a PDF/DOC/DOCX/TXT under 10 MB |
| Uploading a photo, picture or certificate says the storage bucket "portfolio-files" does not exist | Step 1.6 has not been done, or the bucket has a different name |
| Uploading says the file kind is not accepted or the file is too big | Only JPG, PNG, WebP and GIF pictures (and PDFs for certificates and achievements) up to 4 MB |
| A picture works in the admin but visitors see "Not found" | Its project, certificate or achievement is a draft or hidden, or it was published less than 30 seconds ago |
| Contact form unavailable | `database/contact_messages.sql` has not been run |
| Build fails on fonts | The build machine cannot reach Google Fonts |
| Admin > Insights asks for one more step | `database/site_events.sql` has not been run |
| The browser-tab icon or link preview still shows the old name or colour | They refresh about once an hour (and on every new deployment) |
| A saved change is not on the homepage yet | Open pages refresh themselves within seconds; a fresh visit can take up to a minute |

## 6. Rotating secrets

If a key or password was ever shared or committed, rotate it: create a new Supabase secret key
(Project Settings > API), generate new admin credentials with the script above, update the environment
variables in Vercel and `.env.local`, then redeploy.

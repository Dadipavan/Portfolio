# What is new: looks, profile photo, case studies, certificates and achievements

This guide is written for the owner of the site, not for programmers. It explains what was added, the one
step you do in Supabase, how to check that everything works, and how to choose a look.

Contents

1. [What is new](#1-what-is-new)
2. [What did not change](#2-what-did-not-change)
3. [The Supabase step (ordered, with a check after each part)](#3-the-supabase-step)
4. [Limits and how files are protected](#4-limits-and-how-files-are-protected)
5. [Troubleshooting](#5-troubleshooting)
6. [How to choose a look](#6-how-to-choose-a-look)
7. [Going back](#7-going-back)
8. [Where each kind of data lives](#8-where-each-kind-of-data-lives)

---

## 1. What is new

**Thirteen looks instead of five.** Admin > **Templates and look**. The five you had (Dashboard, Bento,
Data Lab, Split profile, Data story) are unchanged. Eight new ones were added: Portrait, Editorial, Terminal,
Classic, Spotlight, Aurora, Brutalist and Notebook. Every look shows the same content and has the same
features (role switch, search, resume button, contact form and so on). They differ in layout, lettering,
colours and how the menu works. Each look has a Preview button, so you can see it, at desktop, tablet and phone
width, before you choose it. See [How to choose a look](#6-how-to-choose-a-look).

**A profile photo.** Admin > **Profile photo and media**. Upload a picture, say what it shows (for people who
cannot see it), and choose which part of it is shown and how far it is zoomed in. The photo is optional. The
looks that have a place for a photo use it; the others simply ignore it.

**Project case studies with a "View more" window.** Admin > **Projects**. A project can now tell its whole story:
overview, problem statement, objectives, data sources, methodology, implementation, results, challenges, how
you solved them, conclusions and next steps, and what you learned, plus key features, numbers (for example
"92% accuracy"), extra sections with headings of your own, a category, tools, links and a live demo. You write
the text like a blog post, with buttons for bold, lists, links, quotes, code and pictures. Pictures,
screenshots, charts, diagrams and dashboards are uploaded, given a caption and a description, and put in the
order you like. **Only the parts you fill in appear on the site. Nothing is filled in for you.** On the site,
the project card has a **View more** button that opens the story in a window (it fills the screen on a phone,
scrolls, closes with the Esc key, and can be shared with its own link).

**Certificates with files.** Admin > **Certificates**. Upload the certificate as a picture or a PDF, and add the
issue date, credential ID, verification link, a description and the skills it covers. Visitors can open it,
download it and follow the verification link. You can replace or remove the file at any time, and show or hide
each certificate.

**Achievements.** Admin > **Achievements**. Add, edit, delete and re-order achievements with a category
(Award, Hackathon, Competition, Research, Milestone, Recognition, Other), where and when, the background
story, why it matters, links, and photos or documents. Visitors can filter by category and open a detail window.

**Safer uploads.** Files go to a private storage area. The server checks the size and the real kind of every
file (not just its name), stores it under a random name, and gives visitors a temporary link only for files that
belong to something you have published. Details in [section 4](#4-limits-and-how-files-are-protected).

**The same experience on every admin page that was added or rebuilt.** Projects, Certificates, Achievements and
Profile photo all work the same way: a list (move up or down, Publish or Unpublish, Edit, Delete) and an editor.
Every upload shows a progress bar. Anything that cannot be undone asks first ("Delete this project?"). Mistakes
in a form are marked in red and explained. Saving, publishing and errors are announced in a message that
appears for a few seconds. If you try to leave with unsaved work, you are warned. A new project, certificate or
achievement starts as a **draft** (not on your site) until you choose **Save and publish**.

---

## 2. What did not change

- **The database tables.** No table is created, renamed or changed. Everything you write is saved in the same
  `portfolio_data` table as before (the new fields live inside the existing project, certificate, achievement
  and personal-details records).
- **Your existing content.** Everything already saved stays and shows exactly as before. Anything saved before
  this update counts as published (shown on the site), so nothing disappears.
- **The admin password and login.** The password hash and session secret are the same variables as before.
- **Your resumes.** They still use the public `resumes` bucket (PDF, DOC, DOCX or TXT up to 10 MB).
- **The older certificate pictures.** Pictures that were added to certificates earlier still live in the public
  `certificates` bucket and still show. When you replace or remove one of them in Admin > Certificates, the old
  file is deleted from that bucket.
- **The contact form, visit insights, roles, wording and every other setting.**
- **The environment variables** (see [3.D](#d-the-environment-variables-are-unchanged)).

---

## 3. The Supabase step

One thing has to be created once: a **private** storage bucket (think of it as a private folder in Supabase's
file storage) called `portfolio-files`. Until it exists, everything on the site keeps working, and only
uploading a file fails, with a clear message (see [Troubleshooting](#5-troubleshooting)).

Do part A, then B, C and D, then deploy and do E.

### A. Create the bucket (choose one way)

**Way 1: with the dashboard**

1. Open your project at https://supabase.com/dashboard and choose **Storage** in the left menu.
2. Click **New bucket**.
3. **Name:** `portfolio-files` (exactly this, small letters and a hyphen).
4. **Public bucket:** leave it **off**. This matters. A public bucket would let anyone who learns a file's
   address open it, even when the project or certificate it belongs to is a draft.
5. If you see extra options, open them and set **file size limit** to **4 MB** and **allowed file types** to
   `image/jpeg, image/png, image/webp, image/gif, application/pdf`. (The wording differs a little between
   dashboard versions. If you do not see these options, skip them: the site checks size and type itself, so they
   are only a second lock.)
6. Click **Save** (or **Create bucket**).

**Way 2: with the SQL file**

1. Open `database/storage_portfolio_files.sql` in your project and copy all of it.
2. In Supabase choose **SQL Editor > New query**, paste it, and click **Run**. "Success. No rows returned" is the
   normal answer.
3. It is safe to run again: it only re-applies the same settings (private, 4 MB, the five file types). It never
   touches your files or your tables.

### B. Check the bucket

- In **Storage**, `portfolio-files` is listed and is **not** marked "Public".
- Or open **SQL Editor > New query**, paste this, and Run:

  ```sql
  select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
  where id = 'portfolio-files';
  ```

  Success looks like one row with `public` = **false** and `file_size_limit` = 4194304 (that is 4 MB).
  If `public` says **true**, run the SQL file from Way 2 (it sets it back to private).

### C. Policies: none are needed

A "policy" is a rule that lets someone use storage directly. **Do not add any for this bucket.** The site's server
uses its secret key, which does not need them, and with no policy the public key gets nothing. To confirm,
paste this and Run (one query on its own):

```sql
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects';
```

Success is **no rows**, or only rows that name some other bucket. If a row has `qual` equal to just `true` (or
names no bucket at all), it applies to every bucket, including this one: delete it in **Storage > Policies**.
(`database/security_hardening.sql` only removes policies that mention the `resumes` and `certificates` buckets.)
The same file has more optional checks at the bottom, each ready to paste.

### D. The environment variables are unchanged

You do not add, rename or change any variable in Vercel or `.env.local`. The bucket's name is fixed in the code.
The variables the site uses are the ones you already have:

| Variable | What it is | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project address | No (visible to browsers by design) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public key (the site does not use it to read or write data) | No (visible to browsers by design) |
| `SUPABASE_SERVICE_ROLE_KEY` | The secret key the server uses for the database and for storage | **Yes** |
| `NEXT_PUBLIC_RESUME_BUCKET` | Name of the resume bucket (default `resumes`) | No |
| `ADMIN_PASSWORD_HASH` | A scrambled form of your admin password | **Yes** |
| `SESSION_SECRET` | Signs the admin login cookie (32 or more random characters) | **Yes** |
| `NEXT_PUBLIC_SITE_URL` | The address of your site | No |

The three secret ones are only read by code that runs on the server. A file you upload goes from your browser
to the site's own server, which checks it and passes it to Supabase. The secret key never goes to the browser;
visitors only ever receive temporary links to files.

### E. After you deploy: a 7-step check you can do yourself

Do these in order. Each step says what success looks like.

1. **Profile photo.** Admin > **Profile photo and media**. Choose a picture. *Success:* a progress bar runs, a
   preview appears, and after **Save** a green message confirms it. Reload the page: the photo and the way you
   cropped it are still there. If your current look has a photo layout (see the table in section 6), the photo
   now appears in the introduction on the site.
2. **A project with two pictures.** Admin > **Projects** > **Add a project**. Fill in the title and a short
   summary. Open the tab **Pictures and visuals** and drop two pictures on the box. *Success:* each shows a
   progress bar, then appears as a row with a small preview, a caption box and a "What it shows" choice. Click
   **Save as draft**. *Success:* a message says "Saved as a draft. Visitors cannot see it yet."
3. **A certificate PDF.** Admin > **Certificates** > **Add a certificate**. Fill in the title and who issued it, and
   drop a PDF on "Picture or PDF". *Success:* it shows a PDF symbol and an "Open it to check" link that opens the
   PDF. Click **Save as draft**.
4. **Publish both.** On each list, click **Publish** (or use **Save and publish** inside the editor). *Success:*
   a message says it "is now visible on your site", and the badge changes from "Draft: not on your site" to
   "Published".
5. **See them as a visitor.** Open your site in a private (incognito) window. *Success:* the project card has a
   **View more** button that opens the project window with your two pictures, and in Certificates the
   **View certificate** button opens your PDF. The picture addresses start with `/api/media/`.
6. **Unpublish.** First, in the private window, right-click one of the project's pictures and copy the picture's
   address. Then, in the admin, click **Unpublish** on the project, wait about a minute and reload the private
   window. *Success:* the project card is gone, and opening the copied picture address now shows plain text:
   **Not found**. (A link that was opened a moment ago can keep working for a few minutes, up to 10, because the
   temporary link it was given has not run out yet. A fresh visit is refused within about half a minute.)
7. **Delete.** Admin > **Projects**, click the bin button on the project. *Success:* a window asks "Delete this
   project?" and says it cannot be undone; after you confirm, a message says it was deleted, and in Supabase
   **Storage > portfolio-files > projects** the two pictures are gone within a few seconds.

If a step does not behave as described, see [Troubleshooting](#5-troubleshooting).

---

## 4. Limits and how files are protected

### Files

| | Allowed |
| --- | --- |
| Profile photo | JPG, PNG, WebP or GIF picture, up to 4 MB |
| Project pictures (screenshots, charts, diagrams, dashboards, photos) | JPG, PNG, WebP or GIF picture, up to 4 MB each |
| Certificate file | A picture (JPG, PNG, WebP, GIF) or a PDF, up to 4 MB |
| Achievement files | Pictures or PDFs, up to 4 MB each |

- **Why 4 MB?** The hosting platform (Vercel) refuses uploads larger than about 4.5 MB, so the site keeps every
  file under 4 MB.
- **What is refused.** The site looks inside the file, not at its name, so a file renamed to `photo.jpg` is not
  fooled. SVG pictures, scripts, Word files and anything else that is not one of the kinds above are refused
  with a message. A PDF is only accepted for certificates and achievements.
- **Pictures are shrunk for you.** A large picture is made smaller in your browser before it is sent (the longest
  side becomes at most 1600 pixels for the profile photo, 2000 for project and achievement pictures and 2400 for
  certificates), usually as WebP. GIFs and PDFs are sent as they are, so a PDF over 4 MB has to be made smaller
  before uploading.
- **Names.** Each file is stored under a random name inside the folder for its purpose (`profile`, `projects`,
  `certificates` or `achievements`). The name it had on your computer is only shown in the admin.
- **Counts.** The editors accept up to 24 pictures per project and 20 files per achievement.

### Text

| | Limit |
| --- | --- |
| Each part of a case study (overview, problem statement and so on) | 20,000 characters (the box says when you are close) |
| Extra sections of your own in a case study | 12 |
| Numbers ("92% accuracy") in a case study | 9 |
| Short summary of a project | 900 characters |
| Certificate description | 2,000 characters |
| Achievement summary | 600 characters |
| Links in an achievement | 10 |

### How files are protected

- The files are in a **private** bucket. Their direct Supabase address does not work for anyone.
- A visitor's browser asks the site for a file (`/api/media/...`). The site checks that the file belongs to
  something published (a published project, a shown certificate or achievement, or the profile photo). If it does,
  the site sends the browser to a **temporary link that works for 10 minutes** and is issued again whenever someone
  opens the page. If it does not, the answer is **Not found**.
- When you are signed in to the admin, you can open everything, drafts included, so previews work.
- After you publish, unpublish or hide something, the list of files visitors may see is refreshed within **about 30
  seconds**. Browsers may remember an answer for a few minutes, and a temporary link that was already given out
  lasts its 10 minutes.
- **Deleting** a project, certificate or achievement (or removing a picture from one and saving) also deletes the
  file from storage. A file that is still used by something you have saved (a draft counts) is **never** deleted by
  mistake: the server refuses. If you cancel an editor, files uploaded in it and never saved are removed.

---

## 5. Troubleshooting

Messages appear in the admin as written here. A message about one particular file starts with that file's name,
for example `report.pdf: The file is 5.2 MB. The limit is 4 MB. ...`.

| What you see | Likely cause | What to do |
| --- | --- | --- |
| `The storage bucket "portfolio-files" does not exist yet. Create it in Supabase (see the deployment guide) and try again.` | The bucket has not been created, or its name is different | Do [part A](#a-create-the-bucket-choose-one-way) and check the name is exactly `portfolio-files` |
| `The file could not be stored. Please try again.` | Supabase refused the file (a limit or type restriction on the bucket that differs from the site's, or Supabase was briefly unreachable) | Try again. Check the bucket settings from [part B](#b-check-the-bucket). The reason is also written in the deployment logs in Vercel ("Upload to storage failed") |
| `This kind of file is not accepted here. Use a JPG, PNG, WebP or GIF picture up to 4 MB.` (or `... Use a picture or a PDF up to 4 MB.`) | The file is a different kind (for example SVG, Word, or a PDF in a place that takes pictures only) | Save it as JPG, PNG or WebP (or as a PDF where PDFs are allowed) and upload that |
| `The file is 5.2 MB. The limit is 4 MB. ...` | The file is bigger than 4 MB | Make it smaller. Pictures are shrunk automatically, so this is usually a PDF: compress it |
| `The file is empty.` | The file has no content | Choose the file again |
| `Your session has ended. Sign in again and retry.` | The admin login timed out | Sign in again, then upload again |
| `The upload could not reach the server. Check your connection and try again.` | Your internet connection dropped | Check the connection and try again |
| `The upload took too long. Try a smaller file.` | A slow connection and a large file | Use a smaller file or a faster connection |
| `The upload failed. Please try again.` | An unexpected answer from the server | Try again; if it repeats, check the Vercel logs |
| `Unknown kind of upload.`, `No file was sent.`, `The upload could not be read.` | The upload request was incomplete | Reload the admin page and try again |
| `The files could not be deleted.` / `...Check your connection.` / `The files could not be deleted. Please try again.` | The delete request failed | Nothing you saved is affected. The files stay private and harmless; try again later or delete them by hand in Supabase **Storage** |
| `The saved content could not be read, so nothing was deleted.` | The site could not read your saved content, so it refused to delete anything (on purpose) | Try again in a minute |
| `Your changes are saved, but 2 unused files could not be removed from storage. They do no harm and stay private.` | Your content is saved; clean-up of leftover files failed | Nothing to do. You can delete them by hand in Supabase **Storage** if you like |
| `The project is deleted, but some of its files could not be removed from storage. They stay private and do no harm.` (or "certificate", "achievement") | The entry is gone; some files were left behind | Same as above |
| `Your changes could not be saved. Nothing is lost: it is all still on this page. Please try again.` | Supabase could not be reached, or your session ended | Keep the page open and click save again. If it keeps failing, sign in again |
| `The new order could not be saved. Please try again.` / `The change could not be saved. Please try again.` / `The project could not be deleted. Please try again.` | The same, for moving, publishing or deleting | Try again. Nothing was changed |
| `Some details need your attention. They are marked in red.` | A required field is empty or a web address is not valid | Fix the fields marked in red (the first one is selected for you) |
| **Your saved content could not be loaded** (a red box instead of the editor) | Supabase is unreachable, or a table is missing. Editing is turned off on purpose so nothing is overwritten | Check your connection and the Supabase settings, then **Try again** |
| A picture works in the admin but visitors see **Not found** or nothing | The project, certificate or achievement is a draft or hidden, or you published it less than half a minute ago | Check that its badge says **Published** (or the certificate is shown), wait half a minute, reload |

---

## 6. How to choose a look

Switching looks never changes what you have written. Open Admin > **Templates and look**, click **Preview** on a
look to see it at desktop, tablet and phone width, then choose it and save. You can switch back at any time.

| Look | Best for | Menu | Lettering | Photo layout | Own colours | Starts in |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Data analysts and BI roles: the numbers come first | Top bar | Clean sans-serif with a data-style monospace | No | No | Light |
| Bento | People with several strengths to show side by side, at a glance | Floating top bar | Clean sans-serif with a data-style monospace | No | No | Light |
| Data Lab | Data scientists and ML engineers who want a dark, technical feel | Glass top bar | Clean sans-serif with a data-style monospace | No | No | Dark |
| Split profile | Anyone with many sections: the menu is always in view | Fixed profile panel on the left | Clean sans-serif with a data-style monospace | Yes | No | Light |
| Data story | Students and career changers: it tells the journey from raw data to a working model | Top bar with a chapter stepper | Clean sans-serif with a data-style monospace | No | No | Light |
| Portrait | Freelancers, consultants and job seekers who want to be remembered by a face | Top bar | Soft serif headlines (Fraunces) with a clean sans-serif for text | Yes | Yes | Light |
| Editorial | Writers, researchers and anyone whose written case studies are the main attraction | Centred masthead with the links underneath | Newsreader serif throughout | Yes | Yes | Light |
| Terminal | Data engineers, backend and DevOps profiles who want a code-first feel | Tab strip, like a code editor | Monospace throughout (JetBrains Mono) | No | Yes | Dark |
| Classic | Formal applications: finance, consulting, academia and the public sector | Centred masthead with a fine rule | Libre Baskerville serif | Yes | Yes | Light |
| Spotlight | A confident first impression: speakers, founders, product and design-minded roles | Top bar, plus dots on the right edge | Space Grotesk (a geometric sans-serif) | Yes | Yes | Dark |
| Aurora | A modern, friendly look for product, UX and generalist profiles; feels like an app on phones | Floating dock at the bottom | Outfit (a friendly rounded sans-serif) | Yes | Yes | Light |
| Brutalist | Creative and indie profiles who want to stand out; deliberately bold | Chunky top bar | Bricolage Grotesque, set heavy | Yes | Yes | Light |
| Notebook | Students and early-career people: a personal, human touch | Top bar styled as notebook tabs | Lora serif with a handwriting accent (Caveat) | Yes | Yes | Light |

**Technical names (only needed if you read the code).** The looks are stored under these ids: `dashboard`,
`bento`, `lab` (Data Lab), `split` (Split profile), `story` (Data story), `portrait`, `editorial`, `terminal`,
`classic`, `spotlight`, `aurora`, `brutal` (Brutalist) and `notebook`.

**A quick way to decide.** Lots of numbers and charts: Dashboard, Data Lab or Bento. A good photo and a warm
feel: Portrait. A formal CV feel: Classic. Strong writing: Editorial. Code first: Terminal. A bold first
impression: Spotlight or Brutalist. Friendly and modern, especially on phones: Aurora. A student or early career:
Notebook or Data story. Many sections and you want the menu always visible: Split profile.

**Colours.** The accent colour you pick (blue, teal, violet or amber) is used by the first five looks. The other
eight (Portrait to Notebook) have their own colour schemes, so the accent choice does not change them. Every look
has a light and a dark version. "Starts in" is what **Match the look** uses; you can instead choose **Always
light**, **Always dark** or **Follow the visitor's device**, and you can let visitors switch for themselves.

**Order of sections.** If you have never changed the order of the sections, each look opens with the order that
suits it (for example Classic puts experience and education before projects, like a CV). If you have saved
your own order in Admin > Templates and look (the page is headed "Appearance"), that order is used in every look, except Data story, which always follows its own
storyline.

**The photo.** A photo is **optional everywhere**. Looks without a photo layout ignore it (it is not deleted).
Looks with a photo layout show your initials in a neat frame until you upload a photo, so there is never an
empty gap.

---

## 7. Going back

- **Back to an old look:** Admin > **Templates and look**, choose the look you had before, save. Nothing you wrote
  is touched.
- **Remove the photo:** Admin > **Profile photo and media**, remove it and save. The looks fall back to initials.
- **Remove the bucket** (only if you really want to; every uploaded file is lost for good): empty it first in
  Supabase **Storage**, then delete it there (**Storage > the bucket's menu > Delete bucket**). The optional "undo"
  at the end of `database/storage_portfolio_files.sql` does the same with SQL, but recent Supabase versions may
  refuse that and ask you to use the dashboard. Projects, certificates or achievements that used those files
  would then have no picture.
- **The site works without the bucket.** Uploading refuses with the message in [Troubleshooting](#5-troubleshooting).
  Text, the contact form, resumes, insights and every look carry on as normal.

---

## 8. Where each kind of data lives

| What | Where | Notes |
| --- | --- | --- |
| All the text and settings (profile text, projects and their case studies, certificate details, achievements, roles, wording, looks) | The `portfolio_data` table in Supabase: one row for each section, saved as structured text | Captions, how a photo is cropped, "published" or "draft" and the like are saved here too |
| Files uploaded in the new admin pages (profile photo, project pictures, certificate files, achievement files) | The **private** bucket `portfolio-files`, in the folders `profile`, `projects`, `certificates` and `achievements`, each file under a random name | The text records only point to a file and keep its caption, size and shape |
| Resumes | Details in the `resumes` table, files in the public bucket `resumes` | Unchanged |
| Older certificate pictures | The public bucket `certificates` (the picture's web address is saved with the certificate) | Still shown; removed from the bucket when you replace or remove them |
| Contact messages | The `contact_messages` table | Unchanged |
| Visit counts | The `site_events` table (no personal data) | Unchanged |

---

## 9. Resume builder (Admin > Resumes > Build resume)

The **Build resume** button has two ways in:

- **Build my own**: everything from your portfolio is offered; tick what goes in.
- **Build from a job description**: paste a job description and the best matches are ticked for you, with a keyword percentage and the keywords you are missing. You can switch between the two ways at the top of the left panel.

Either way, **every part of the resume is editable on the left** and only changes this resume, never your portfolio: header (name, headline, contact details, links), summary, skills groups and each skill, every job, project and education entry (title, dates, second line, bullets: reword, tick, move, remove, add), certifications, achievements, the heading of every section, the order of the sections, and your own extra sections. The preview on the right is the exact PDF, with ATS checks above it.

*Download PDF*, or *Save to my resumes* (private until you make it public). Resumes made here have a wand button to reopen them with all your edits. The PDF is one column of real text in Helvetica with standard headings, so ATS software can read it. No Supabase change is needed.

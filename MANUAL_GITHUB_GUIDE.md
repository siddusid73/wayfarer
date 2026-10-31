# Upload Wayfarer to GitHub manually

## What is in this README pack?

- `README.md`: the finished project description to place beside `package.json`.
- `docs/images/`: your Wayfarer logo and two checked app screenshots.
- This guide: instructions for uploading through the GitHub website.

This is a documentation pack, not another copy of the complete app. Keep using your existing Wayfarer source folder.

## Step 1 — Add the README to your app folder

1. Extract this README pack.
2. Open your actual app folder—the one where `npm run dev` works and where you can see `package.json`.
3. Copy `README.md` into that folder. Replace the old README if asked.
4. Copy the whole `docs` folder beside it, keeping the `docs/images` folders intact. If a docs folder already exists, merge rather than delete it.
5. You may also copy this guide into the app folder so the README's guide link works.

The result should look like:

```text
wayfarer/
  README.md
  MANUAL_GITHUB_GUIDE.md
  docs/
    images/
      wayfarer-logo.png
      wayfarer-home.png
      wayfarer-trip.png
  package.json
  src/
  public/
  vite.config.ts
  ...the other original configuration files
```

Do not upload only the README: others need the source files too. Do not upload the outer ZIP folder as an extra folder layer—`package.json` and `README.md` should be at the repository's top level.

## Step 2 — Create the repository

1. Sign in at https://github.com.
2. Click the **+** near the top-right → **New repository**.
3. Name it `wayfarer`.
4. Suggested description: `India-first road trip planner with interactive maps, editable stops, and nearby places.`
5. Choose **Public** if you want anyone to see the code.
6. Leave **Add a README file** unchecked because you already have one.
7. Do not select a license unless you understand and agree to its reuse permissions.
8. Click **Create repository**.

## Step 3 — Upload the files

1. On the empty repository page, click **uploading an existing file**. On an existing repository, choose **Add file → Upload files**.
2. Drag the app's source folders and files into the upload area. Preserve their folder structure.
3. Include `src`, `public`, `docs`, `README.md`, `MANUAL_GITHUB_GUIDE.md`, `package.json`, the original lockfile, and the app's configuration files.
4. Include `.gitignore`. Windows may hide names beginning with a dot; turn on hidden-file display if necessary.
5. **Do not upload:**
   - `node_modules` (installed dependencies)
   - `dist`, `.output`, `.tanstack`, `.nitro`, or `.wrangler` (generated output/cache)
   - `.git` (repository metadata)
   - `.lovable`, `.workspace`, or private editor metadata
   - `.env`, `.env.local`, `.dev.vars`, credentials, tokens, or API secrets
   - personal files, temporary logs, or the source ZIP itself
6. Review the list carefully before submitting. `.gitignore` does **not** automatically filter a browser drag-and-drop upload.
7. Enter a commit message such as `Add Wayfarer road trip planner`.
8. Click **Commit changes**.

GitHub browser uploads are limited to 100 files at a time and 25 MiB per file. Upload in batches when needed. For a large project, GitHub Desktop is easier and preserves the folder layout without command-line Git.

## Step 4 — Check your repository

- The opening page should display the Wayfarer README and images.
- `package.json` should be at the top level, not inside another `wayfarer` folder.
- Open `docs/images` and confirm all three pictures are present.
- If images are broken, check exact spelling and letter case: `docs/images/wayfarer-home.png`, for example.
- Copy the address from your browser and share it. That link shares the code and README—not a running website.

Optional: in the repository's About section, add topics such as `road-trip-planner`, `india`, `react`, `typescript`, `openstreetmap`, and `maps`. Add a Website address only after you really deploy the app.

## How someone else runs it

Tell them:

1. Install a supported Node.js LTS release (22.12+ in the 22.x line, or a newer supported LTS).
2. On your repository, click **Code → Download ZIP**.
3. Extract the ZIP and open the folder containing `package.json`.
4. Open Terminal or PowerShell in that folder.
5. Run:

   ```bash
   npm install
   npm run dev -- --open
   ```

6. Keep the terminal open. The app opens in their browser; internet is needed for maps and searches.

Their saved trips belong to their browser. Downloading your code does not give them your personal saved trips.

## How visitors open it without installing anything

You need a deployed website with a public HTTPS link. GitHub stores the code; it does not run this app merely because you uploaded it.

The present app has a TanStack Start server build configured for Cloudflare. It needs a compatible deployment setup; GitHub Pages cannot run it unchanged. Until deployment is configured, use local laptop/Wi-Fi testing or ask a technical helper to set up the Cloudflare deployment from your repository.

## Update the README later

Open `README.md` on GitHub → click the pencil → make changes → **Commit changes**. To replace pictures, upload new files to `docs/images` using the same filenames, then confirm the README still displays them.

## Important privacy note

Anyone can inspect every file in a public repository, including configuration and dependency names. Customizing the visible branding does not hide the tools used in the source. Never upload private keys or personal information, and do not claim certifications or deployment results you have not received or verified.

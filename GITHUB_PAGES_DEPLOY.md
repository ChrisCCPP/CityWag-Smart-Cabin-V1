# GitHub Pages Deployment

If the GitHub Pages URL shows the repository README instead of the CityWag product page, Pages is serving the repository root rather than the built web app.

The React/Vite app lives in:

```text
web-demo/
```

The deployable static site is generated into:

```text
web-demo/dist/
```

## Recommended Setup

1. Commit and push the whole project, including:

```text
.github/workflows/deploy-pages.yml
web-demo/package.json
web-demo/package-lock.json
web-demo/src/
web-demo/public/
```

2. On GitHub, open the repository settings.

3. Go to:

```text
Settings -> Pages
```

4. Under `Build and deployment`, set `Source` to:

```text
GitHub Actions
```

5. Go to the `Actions` tab and run or wait for:

```text
Deploy CityWag Web Demo to GitHub Pages
```

6. Open the deployed Pages URL after the workflow finishes.

## Why README Was Showing

GitHub Pages can serve a repository root as a static site. If the root contains `README.md` and no deployed app entry, GitHub/Jekyll may render that README as the website.

That is different from running the Vite app. Vite must be built first:

```bash
cd web-demo
npm install
npm run build
```

The workflow in this project does that automatically and publishes `web-demo/dist`.

## Local Commands

Run the development server:

```bash
cd web-demo
npm install
npm run dev
```

Build for Pages:

```bash
cd web-demo
npm run build
```

Preview the build locally:

```bash
cd web-demo
npm run preview
```


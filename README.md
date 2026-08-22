# Ares Electronics Hub

A static HTML, CSS, and JavaScript electronics store website.

## Local preview

Serve the repository root with any static HTTP server, then open `/` in a browser. Do not use `file://` when testing navigation or `localStorage`.

## Deploy with GitHub Pages

1. Push the repository to GitHub as `Cobolt-17/E-commerce_website` (or update the public URLs in `robots.txt`, `sitemap.xml`, and the canonical tags if the repository URL differs).
2. In GitHub, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` or run the **Deploy static site to GitHub Pages** workflow manually.
5. Open `https://cobolt-17.github.io/E-commerce_website/` after the workflow succeeds.

The workflow publishes the existing static folder structure without a build step or framework migration.

## Scope

This repository has no server, database, authentication, payment processing, or order API. The cart and newsletter are browser-local features using `localStorage`; they are not suitable for processing real orders until a backend is added.

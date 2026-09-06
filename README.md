# M. Sai Supriya | Portfolio

A professional, modern, accessible personal portfolio website built with semantic HTML5 and vanilla CSS/JS.

## Features
- **Semantic HTML5:** Strict use of semantic tags (`<header>`, `<main>`, `<nav>`, `<article>`, `<section>`, `<aside>`, `<footer>`).
- **Accessibility (WCAG 2.2 AA target):** Skip navigation links, correct heading hierarchies, ARIA landmarks, keyboard navigability, and accessible forms.
- **Responsive Design:** Fluid layout adapting to mobile (320px) through desktop (1440px+).
- **SEO Optimized:** Unique meta descriptions, titles, structured JSON-LD data, robots.txt, and sitemap.xml.
- **Performance:** No external libraries or bloated frameworks. Vanilla JS only where necessary (mobile nav, form validation).

## Project Structure
```text
portfolio/
│
├── index.html       (Home)
├── about.html       (About Me & Education)
├── skills.html      (Technical proficiencies)
├── projects.html    (Selected works)
├── todo.html        (Interactive To-Do Application)
├── contact.html     (Accessible contact form)
│
├── css/
│   └── style.css    (Main stylesheet with To-Do styles)
│
├── js/
│   ├── script.js    (Navigation, Theme Toggle & Form Validation)
│   └── todo.js      (To-Do Application State & DOM Logic)
│
├── robots.txt       (Crawler directives)
└── sitemap.xml      (XML Sitemap)
```

## JavaScript To-Do Application

An interactive client-side task management application built using vanilla JavaScript.

### Features

- Create tasks
- Read and display tasks
- Edit tasks
- Delete tasks
- Mark tasks as completed
- All / Active / Completed filtering
- localStorage persistence
- Dynamic DOM rendering
- Event delegation
- Responsive design
- Accessible controls
- Light/dark theme compatibility

## Running Locally

Since this is a static site with no backend dependencies, you can open any of the HTML files directly in a browser. For the best experience (and to resolve any CORS issues with future assets), use a local server:

Using Python 3:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

Using Node.js (npx):
```bash
npx serve .
```

## Lighthouse Optimization Goals
This project was built to target perfect Lighthouse scores:
- **Accessibility: 100** (Proper ARIA, contrast, focus states)
- **SEO: 100** (Meta tags, document structure)
- **Best Practices: 100** (Valid HTML, no deprecations)
- **Performance: ~100** (Lightweight assets, no render-blocking external scripts)

## Git Setup

To initialize this repository and push to GitHub, run the following commands in the project root:

```bash
git init
git add .
git commit -m "Initial commit: semantic HTML5 portfolio"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

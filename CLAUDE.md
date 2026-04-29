# CLAUDE.md — Chinese Cooking Guide

> Project: `cooking-ad` — Static site teaching foreigners authentic Chinese recipes
> Domain: `https://cooking.actfont.top`
> Repo: `https://github.com/goodnamehadbeeneatbydog/cooking-ad`

---

## 1. Project Overview

English-primary static website built with Astro 5.x. Teaches foreigners how to cook authentic Chinese food. Auto-generates recipe articles via Claude API, deploys to Vercel.

**Key decisions (locked):**
- English default (`/en/`), Chinese preserved (`/zh/`)
- No images v1 — clean text-based recipe cards
- Warm culinary UI: orange/amber palette, Playfair Display headings
- 100 recipe seed catalog covering 12 cuisine categories

---

## 2. Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Astro 5.7.9 (static output) |
| Styling | Tailwind CSS 3.4 + custom design tokens |
| Content | Markdown in `src/content/blog/` |
| Generation | Claude API via `scripts/generate-recipe-posts.js` |
| Deploy | Vercel (auto from GitHub `main` branch) |
| Ads | 7-platform system (see `.env.example`) |

---

## 3. Design System

### Colors
```
Primary:       #E85913 (buttons, links, brand)
Primary Hover: #C44A0E
Secondary:     #F5A623 (tags, badges)
Background:    #FFFBF7 (warm cream)
Card BG:       #FFFFFF
Text Primary:  #2D2420 (warm dark brown)
Text Secondary:#6B5B54
Footer BG:     #1A1210
```

### Typography
```
Display/Hero: Playfair Display, serif  (48-64px)
Headings:     Playfair Display          (24-36px)
Body:         Inter, system-ui, sans    (16px)
```

### Tokens (tailwind.config.js)
```js
fontFamily: { display: ['"Playfair Display"', 'serif'], body: ['Inter', 'system-ui', 'sans-serif'] }
colors: { primary: { DEFAULT: '#E85913', hover: '#C44A0E', light: '#FFF0E6' }, ... }
```

---

## 4. Content Generation (cooking-gen)

### Skill definition
`.claude/skills/cooking-gen/skill.md` — trigger phrases: "cooking-gen", "generate recipe", "write recipe"

### Manual generation
```bash
npm run generate-recipes -- --count 5          # Generate 5 recipes
npm run generate-recipes -- --count 5 --resume  # Resume from last
npm run generate-recipes -- --count 5 --deploy  # Generate + deploy
```

### How it works
1. Loads `scripts/recipe-index.json` (100 recipes)
2. Picks unwritten recipes, calls Claude API 3-stage pipeline:
   - Stage 1: Outline (structure + cultural context)
   - Stage 2: Article (full recipe with personal voice)
   - Stage 3: De-AI (humanize, remove AI patterns)
3. Auto-classifies cuisine category
4. Saves to `src/content/blog/{slug}-en.md`
5. Updates `recipe-registry.json`

### Recipe frontmatter schema
```yaml
---
title: "Recipe Name"
description: "SEO description under 120 chars"
pubDate: 2026-04-29
category: "Sichuan"  # One of 12 categories
tags: ["tag1", "tag2"]
lang: en
draft: false
adSlots: 2
i18nSlug: "recipe-slug"
difficulty: "Easy|Medium|Hard"
prepTime: "15 min"
cookTime: "20 min"
servings: 4
cuisine: "Chinese"
---
```

---

## 5. Cuisine Categories (12 total)

Defined in `src/utils/classify.ts`:
- Sichuan, Cantonese, Hunan, Shandong
- Jiangsu, Zhejiang, Fujian, Anhui
- Noodles & Dumplings, Rice & Stir-Fry, Soups & Broths, Street Food & Snacks

---

## 6. Project Structure

```
cooking-ad/
├── src/
│   ├── components/
│   │   ├── pages/HomePage.astro       # Hero, categories, recipe grid
│   │   ├── Header.astro               # Nav: Home, Recipes, Categories, About
│   │   ├── Footer.astro               # Dark warm footer
│   │   ├── AdSense.astro              # Google AdSense component
│   │   └── ads/                       # 7 ad platform components
│   ├── layouts/Layout.astro           # Root layout with fonts + ad scripts
│   ├── pages/
│   │   ├── index.astro                # Redirects / → /en/
│   │   └── [lang]/                    # /en/* and /zh/* routes
│   │       ├── index.astro            # Homepage
│   │       ├── blog/index.astro       # Recipe list
│   │       ├── blog/[...slug].astro   # Recipe detail
│   │       ├── about.astro
│   │       └── privacy.astro
│   ├── content/
│   │   ├── blog/                      # Recipe markdown files
│   │   └── config.ts                  # Content collection schema
│   ├── styles/global.css
│   └── utils/
│       ├── i18n.ts                    # Translations (en/zh)
│       └── classify.ts                # Cuisine auto-classification
├── scripts/
│   ├── recipe-index.json              # 100 recipe catalog
│   ├── generate-recipe-posts.js       # AI generation pipeline
│   └── deploy.js                      # Deploy helper
├── .claude/skills/cooking-gen/skill.md
├── .env.example                       # Ad platform placeholders
├── astro.config.mjs
├── tailwind.config.js
└── package.json
```

---

## 7. Deployment

### Vercel (auto)
1. Push to `main` branch on GitHub
2. Vercel auto-builds and deploys
3. Custom domain: `cooking.actfont.top`

### Manual deploy script
```bash
npm run deploy    # Builds, commits, pushes to GitHub
```

### Environment variables (for ads)
Copy `.env.example` → `.env` and fill in real IDs:
```
GOOGLE_ADSENSE_ID=
MEDIA_NET_ID=
CARBON_PLACEMENT=
AMAZON_TRACKING_ID=
PROPELLERADS_ZONE_ID=
INFOLINKS_PID=
EZOIC_ID=
```

---

## 8. Adding a New Recipe Manually

1. Create file: `src/content/blog/{recipe-slug}-en.md`
2. Add frontmatter with all required fields
3. Write article following structure:
   - Introduction (personal hook + cultural context)
   - Ingredients (with Western substitutions)
   - Step-by-Step (numbered, with timing)
   - Pro Tips
   - Common Mistakes
   - Variations / Serving Suggestions
   - Storage & Reheating
4. `npm run build` to verify
5. `git add . && git commit && git push` to deploy

---

## 9. Common Commands

```bash
npm run dev              # Local dev server (localhost:4321)
npm run build            # Static build to dist/
npm run preview          # Preview built site
npm run generate-recipes # AI generate recipe articles
npm run deploy           # Build + push to GitHub
```

---

## 10. Content Status

| Metric | Count |
|--------|-------|
| Recipes published | 3 (Kung Pao Chicken, Mapo Tofu, Yangzhou Fried Rice) |
| Recipes in catalog | 100 |
| Categories | 12 |
| Languages | 2 (en, zh) |

---

*Last updated: 2026-04-29*

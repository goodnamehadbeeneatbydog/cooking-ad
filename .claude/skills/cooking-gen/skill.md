---
name: cooking-gen
description: |
  Chinese recipe article auto-generation and De-AI skill

  Trigger conditions:
  1. User says "cooking-gen", "generate recipe", "write recipe"
  2. User needs recipe articles for the cooking content site
  3. User needs batch Markdown generation and auto-deployment

  Core features:
  - AI auto-generates English recipe articles (via Claude API)
  - Deep De-AI processing (AI pattern detection + humanization)
  - Auto-cuisine-classification (12 Chinese cuisine categories)
  - Auto SEO-friendly frontmatter generation
  - Saves as Markdown to project directory
  - Optional: auto-build and deploy to Vercel

  Output directory: D:\ai-money\10000\cooking-ad\src\content\blog\
---

# Cooking-Gen (Chinese Recipe Article Generator)

## Quick Start

### Method 1: Generate by topic
```
User: cooking-gen write a recipe for Kung Pao Chicken
System: Generate article → De-AI → Auto-classify → Save MD → Return file path
```

### Method 2: Batch generation
```
User: cooking-gen --batch 5 --cuisine "Sichuan"
System: Generate 5 Sichuan recipes → Batch De-AI → Save → Return list
```

### Method 3: Auto-deploy
```
User: cooking-gen --deploy write a recipe for Mapo Tofu
System: Generate → De-AI → Save → Build → Push GitHub → Vercel auto-deploy
```

---

## Workflow

### Step 1: Recipe Analysis & Outline

**Input**: Recipe name or selection from recipe-index.json

**Output**: Article outline
```yaml
outline:
  title: "Recipe Title"
  description: "SEO description (under 120 chars)"
  keywords: ["keyword1", "keyword2"]
  structure:
    - heading: "Introduction"
      points: ["Hook", "Cultural significance", "Why learn this"]
    - heading: "Ingredients"
      points: ["Full list with quantities", "Western substitutes"]
    - heading: "Equipment Needed"
      points: ["Wok/pan", "Tools"]
    - heading: "Step-by-Step Instructions"
      points: ["Numbered steps with timing and visual cues"]
    - heading: "Pro Tips"
      points: ["Secrets for success"]
    - heading: "Common Mistakes"
      points: ["What goes wrong and how to fix"]
    - heading: "Serving Suggestions"
      points: ["Pairing ideas"]
    - heading: "Storage & Reheating"
      points: ["How to store", "How to reheat"]
    - heading: "Conclusion"
      points: ["Encouraging wrap-up"]
```

### Step 2: Article Generation

**Writing Style**:
- Language: English
- Length: 1000-1500 words
- Style: Friendly cooking instructor, personal, encouraging
- Must include: ingredient substitutions, timing cues, sensory details, personal anecdote
- Must include: difficulty level, prep time, cook time, servings

**Article Structure Template**:
```markdown
## Introduction (100-200 words)
- Personal hook
- Cultural context
- Why this recipe matters

## Ingredients (150-200 words)
- Complete list with quantities
- Western substitution notes
- Where to find specialty items

## Equipment Needed (50-100 words)
- Required pots/pans/tools
- Alternative equipment

## Step-by-Step Instructions (400-600 words)
- Numbered steps
- Timing cues
- Visual/sensory cues

## Pro Tips (100-150 words)
- 3-5 expert tips

## Common Mistakes (100-150 words)
- What goes wrong
- How to fix it

## Serving Suggestions (50-100 words)
- What to pair with

## Storage & Reheating (50-100 words)
- Storage tips
- Reheating methods

## Conclusion (50-100 words)
- Encouraging wrap-up
- Call to action
```

### Step 3: De-AI Processing (Core Step)

**3.1 AI Pattern Detection**

| Category | Pattern | Fix |
|----------|---------|-----|
| Language | "Additionally/Moreover/Furthermore" | → "Also" or remove |
| Language | "It's worth noting" | → delete |
| Language | "Undoubtedly" | → "I think" / "Honestly" |
| Language | "Delve" | → "look at" / "explore" |
| Structure | Perfect symmetry | Break with uneven sections |
| Structure | "First/Second/Third" | Use varied transitions |
| Tone | Overly professional | Add casual asides |
| Tone | No personal voice | Add "I", "my", "honestly" |

**3.2 Add Personality**

1. **Personal stories**: "The first time I made this...", "My grandmother always..."
2. **Honest opinions**: "I know this sounds weird, but...", "If you're short on time..."
3. **Conversational**: "You'll want to...", "Don't worry if...", "Here's the trick..."
4. **Imperfection**: Mention times it didn't work, shortcuts
5. **Sensory details**: "smell the garlic", "look for golden edges"

**3.3 Recipe-Specific De-AI**

- **Real kitchen experience**: "I burned the garlic the first three times"
- **Flexible guidance**: "About 2 minutes — you'll know by the smell"
- **Substitution honesty**: "Shaoxing wine is best, but dry shherry works"
- **Equipment realism**: "A wok is ideal, but a large skillet works fine"
- **Timing nuance**: "Usually 5-7 minutes, depending on your stove"

**3.4 Final Audit**

> Q: "Where does this sound like AI wrote it?"
> A: List 3-5 suspicious traces
>
> Q: "How to make it sound human?"
> → Final revision

### Step 4: Auto-Classification

**Cuisine Categories**:
```
Sichuan, Cantonese, Hunan, Shandong, Jiangsu, Zhejiang, Fujian, Anhui,
Noodles & Dumplings, Rice & Stir-Fry, Soups & Broths, Street Food & Snacks
```

### Step 5: Generate Frontmatter

```yaml
---
title: "Recipe Title"
description: "SEO description, under 120 chars"
pubDate: 2025-04-28
category: "Auto-classified cuisine"
tags: ["tag1", "tag2", "tag3"]
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

### Step 6: Save File

**Filename**: `{slug}-en.md`
**Path**: `D:\ai-money\10000\cooking-ad\src\content\blog\`

### Step 7: Optional Deployment

```bash
cd D:\ai-money\10000\cooking-ad
npm run deploy
```

---

## Critical Rules

1. ✅ **De-AI is mandatory** — Every article must pass pattern detection and personality injection
2. ✅ **Real cooking experience** — Include fictional but realistic kitchen stories
3. ✅ **Specific details** — Timing, temperatures, visual cues, smells
4. ✅ **Auto-classify** — Must match cuisine category, not default to "Other"
5. ✅ **SEO-friendly** — Title must include recipe name, description under 120 chars
6. ✅ **Length control** — 1000-1500 words, not too short or too long
7. ✅ **Ad-ready** — Paragraph count > 5 for inline ad insertion
8. ✅ **Self-check** — Before output: "Would a reader think AI wrote this?"

---

## Integration

```
Astro project: D:\ai-money\10000\cooking-ad
Article directory: src/content/blog/
Deploy script: npm run deploy
```

**Usage Examples**:
```bash
# Generate single recipe
cooking-gen "How to make authentic Mapo Tofu"

# Generate and deploy
cooking-gen "Kung Pao Chicken recipe" --deploy

# Batch generation
cooking-gen --batch 5 --cuisine "Sichuan" --lang en
```

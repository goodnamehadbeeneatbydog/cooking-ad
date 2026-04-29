#!/usr/bin/env node
/**
 * Chinese Recipe Batch Article Generator
 * Usage: node generate-recipe-posts.js [options]
 *
 * Options:
 *   --count=N       Number of recipes to generate (default: 10)
 *   --force         Ignore registry, allow regeneration
 *   --dry-run       Only select, no API calls
 *   --deploy        Auto build + commit + push after generation
 *   --select-only   Only select recipes, create summary (Agent mode)
 *   --resume        Resume incomplete batch
 *   --status        Show generation status
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============ Config ============
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = 'claude-sonnet-4-6';
const PROJECT_ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'blog');
const RECIPE_INDEX_PATH = path.join(__dirname, 'recipe-index.json');
const REGISTRY_PATH = path.join(__dirname, 'generated-recipes.json');
const SUMMARY_PATH = path.join(__dirname, 'project_summary.md');

// Cuisine categories for auto-classification
const CUISINE_CATEGORIES = {
  'Sichuan': ['sichuan', 'szechuan', 'mapo', 'kung pao', 'gong bao', 'dan dan', 'hot pot', 'mala', 'spicy', 'chili', 'peppercorn', 'twice-cooked', 'yu xiang', 'fish-fragrant', 'saliva', 'mouth-watering', 'dry-fried'],
  'Cantonese': ['cantonese', 'guangdong', 'char siu', 'siu mai', 'har gow', 'dim sum', 'roast duck', 'wonton', 'congee', 'chow mein', 'oyster sauce', 'white cut', 'steamed', 'bbq', 'bao', 'crispy duck'],
  'Hunan': ['hunan', 'xiang', 'chairman mao', 'duo jiao', 'chopped chili', 'smoky', 'preserved', 'stinky tofu', 'dry pot'],
  'Shandong': ['shandong', 'lu', 'sweet and sour', 'tang cu', 'scallion', 'braised', 'seafood', 'dezhou', 'chicken'],
  'Jiangsu': ['jiangsu', 'su', 'squirrel fish', 'lion head', 'braised pork', 'nanjing', 'salted duck', 'osmanthus', 'beggar', 'three-cup'],
  'Zhejiang': ['zhejiang', 'dongpo', 'west lake', 'vinegar fish', 'longjing', 'drunken', 'hangzhou'],
  'Fujian': ['fujian', 'min', 'oyster', 'buddha jumps', 'fo tiao qiang', 'fish ball', 'lard', 'sweet potato', 'red vinasse', 'lychee'],
  'Anhui': ['anhui', 'hui', 'stewed', 'ham', 'bamboo', 'stone pot', 'li hongzhang', 'stinky mandarin'],
  'Noodles & Dumplings': ['noodle', 'dumpling', 'jiaozi', 'baozi', 'mantou', 'lamian', 'lo mein', 'chow mein', 'pho', 'mi', 'fen', 'nian gao', 'longevity', 'xiao long', 'sheng jian', 'guo tie', 'wonton', 'rou jia', 'jianbing', 'biangbiang', 'knife-cut'],
  'Rice & Stir-Fry': ['fried rice', 'yangzhou', 'egg fried', 'stir-fry', 'wok', 'chow fan', 'claypot', 'paella', 'tomato and egg', 'di san xian', 'moo shu', 'kung pao shrimp', 'garlic broccoli', 'hand-torn'],
  'Soups & Broths': ['soup', 'broth', 'hot and sour', 'egg drop', 'wonton soup', 'bone', 'medicinal', 'herbal', 'tonic', 'winter melon', 'chicken and corn', 'herbal chicken'],
  'Street Food & Snacks': ['street food', 'jianbing', 'baozi', 'youtiao', 'skewer', 'malatang', 'tanghulu', 'bing', 'crepe', 'cold skin', 'donuts', 'soy milk', 'egg custard', 'turnip cake', 'red bean', 'spring rolls', 'salt and pepper'],
};

// ============ Utils ============

function loadRecipeIndex() {
  if (!fs.existsSync(RECIPE_INDEX_PATH)) {
    throw new Error(`Recipe index not found: ${RECIPE_INDEX_PATH}`);
  }
  return JSON.parse(fs.readFileSync(RECIPE_INDEX_PATH, 'utf8'));
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { generated: [], lastRun: null, stats: { totalGenerated: 0, totalRecipesAvailable: 0 } };
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function saveRegistry(registry) {
  registry.lastRun = new Date().toISOString();
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
}

function loadSummary() {
  if (!fs.existsSync(SUMMARY_PATH)) return null;
  const content = fs.readFileSync(SUMMARY_PATH, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  try {
    return parseSimpleYaml(match[1]);
  } catch {
    return null;
  }
}

function parseSimpleYaml(yaml) {
  const result = {};
  const lines = yaml.split('\n');
  let current = result;
  const stack = [];
  let indentStack = [0];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.match(/^(\s*)/)[1].length;
    const trimmed = line.trim();

    if (trimmed.startsWith('- ')) {
      const parentKey = Object.keys(current).pop();
      if (!Array.isArray(current[parentKey])) {
        current[parentKey] = [];
      }
      const value = trimmed.substring(2).trim();
      if (value.includes(': ')) {
        const obj = {};
        const kv = value.split(': ');
        obj[kv[0]] = kv.slice(1).join(': ');
        current[parentKey].push(obj);
      } else {
        current[parentKey].push(value);
      }
    } else if (trimmed.includes(': ')) {
      const [key, ...valParts] = trimmed.split(': ');
      const value = valParts.join(': ').trim();
      const cleanValue = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      current[key] = cleanValue;
    } else if (trimmed.endsWith(':')) {
      const key = trimmed.slice(0, -1);
      current[key] = {};
      current = current[key];
      stack.push(current);
      indentStack.push(indent);
    }
  }
  return result;
}

function saveSummary(summary) {
  const yaml = stringifySimpleYaml(summary);
  fs.writeFileSync(SUMMARY_PATH, `---\n${yaml}\n---\n`, 'utf8');
}

function stringifySimpleYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  let result = '';
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      result += `${spaces}${key}:\n`;
      for (const item of value) {
        if (typeof item === 'object') {
          const kv = Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ');
          result += `${spaces}  - ${kv}\n`;
        } else {
          result += `${spaces}  - ${item}\n`;
        }
      }
    } else if (typeof value === 'object') {
      result += `${spaces}${key}:\n`;
      result += stringifySimpleYaml(value, indent + 1);
    } else {
      result += `${spaces}${key}: ${value}\n`;
    }
  }
  return result;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

function recipeToSlug(recipe) {
  return slugify(recipe.name);
}

function buildRecipeContext(recipe) {
  return `Recipe: ${recipe.name}
Category: ${recipe.category}
Difficulty: ${recipe.difficulty}
Prep Time: ${recipe.prepTime}
Cook Time: ${recipe.cookTime}
Servings: ${recipe.servings}
Key Ingredients: ${recipe.keyIngredients.join(', ')}
Description: ${recipe.description}`;
}

function autoClassify(title, description, content) {
  const text = `${title} ${description} ${content}`.toLowerCase();
  let bestMatch = 'Other';
  let maxScore = 0;

  for (const [cat, keywords] of Object.entries(CUISINE_CATEGORIES)) {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw.toLowerCase(), 'g');
      const matches = text.match(regex);
      if (matches) score += matches.length;
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = cat;
    }
  }
  return bestMatch;
}

function extractTags(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const allKeywords = Object.values(CUISINE_CATEGORIES).flat();
  const tagSet = new Set();

  for (const kw of allKeywords) {
    if (text.includes(kw.toLowerCase()) && kw.length > 2) {
      tagSet.add(kw);
    }
  }

  return Array.from(tagSet).slice(0, 5);
}

function verifyRecipeFiles(slug) {
  const required = [
    path.join(BLOG_DIR, `${slug}-en.md`),
  ];
  return required.map(f => ({ file: f, exists: fs.existsSync(f) }));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callClaude(messages, maxTokens = 4000) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const data = JSON.stringify({
    model: MODEL,
    max_tokens: maxTokens,
    messages: messages,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.content && parsed.content[0]) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('API response format error: ' + JSON.stringify(parsed)));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function callClaudeWithRetry(messages, maxTokens = 4000, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await callClaude(messages, maxTokens);
    } catch (err) {
      if (i === retries - 1) throw err;
      const delay = Math.pow(2, i) * 1000;
      console.log(`    Retry ${i + 1}/${retries}, waiting ${delay}ms...`);
      await sleep(delay);
    }
  }
}

// ============ Article Generation ============

async function generateRecipeArticle(recipe) {
  const recipeContext = buildRecipeContext(recipe);
  console.log(`  Generating English article...`);

  // 1. Generate outline
  console.log(`     1) Generating outline...`);
  const outlinePrompt = `You are an experienced Chinese cooking instructor writing for English-speaking home cooks who want to learn authentic Chinese recipes.

${recipeContext}

Create a detailed article outline. The article should:
- Feel personal and encouraging, like a friend teaching you to cook
- Include cultural context and why this dish matters
- Be practical for home cooks with standard Western kitchen equipment
- Suggest Western ingredient substitutions where helpful
- Target 1000-1500 words

Structure:
1. Introduction — hook the reader, cultural significance, why this recipe is worth learning
2. Ingredients — complete list with quantities, plus substitution notes for hard-to-find items
3. Equipment Needed — what pots, pans, tools you'll need
4. Step-by-Step Instructions — numbered, clear, with timing cues and visual cues (color, texture, smell)
5. Pro Tips — secrets that make the difference between good and great
6. Common Mistakes & How to Avoid Them
7. Serving Suggestions — what to pair it with
8. Storage & Reheating
9. Conclusion — encouraging wrap-up

Output only the outline.`;

  const outline = await callClaudeWithRetry([{ role: 'user', content: outlinePrompt }], 2000);

  // 2. Generate article
  console.log(`     2) Writing article...`);
  const writePrompt = `Write a complete Markdown article for this Chinese recipe based on the outline below.

Recipe Info:
${recipeContext}

Outline:
${outline}

Writing Requirements:
1. Write as "I" — a passionate home cook sharing their knowledge
2. Use sensory details: "the garlic should smell fragrant, not burnt"
3. Include specific timings: "stir-fry for exactly 30 seconds"
4. Add substitution notes in parentheses: "(or use balsamic vinegar if you can't find Chinese black vinegar)"
5. Be honest about difficulty — don't oversimplify hard techniques
6. Include one personal anecdote or memory related to the dish
7. Vary paragraph lengths: some short and punchy, some longer and descriptive
8. Avoid AI buzzwords: "delve", "furthermore", "it's worth noting"
9. Use conversational language: "you'll want to...", "don't worry if...", "here's the trick..."
10. Target 1000-1500 words

Output the article body only, no frontmatter. Start with a # heading for the recipe name.`;

  const article = await callClaudeWithRetry([{ role: 'user', content: writePrompt }], 4000);

  // 3. De-AI processing
  console.log(`     3) De-AI processing...`);
  const deaiPrompt = `The following is a cooking article. Make it read like a real person wrote it — someone who actually cooks this dish regularly and is sharing their experience.

Original:
${article}

De-AI Rules:
1. Replace AI buzzwords:
   - "Additionally/Moreover/Furthermore" → "Also" or remove entirely
   - "It's worth noting" → delete
   - "Undoubtedly" → "I think" or "Honestly"
   - "Delve" → "look at" or "explore"
2. Add personal touches:
   - "Honestly..." / "To be frank..."
   - "I've made this dozens of times..."
   - "The first time I tried this..."
   - "My grandmother always said..."
   - Uncertainty: "maybe...", "I usually...", "about..."
3. Break perfect structure:
   - Make one section unexpectedly short (1-2 sentences)
   - Make one tip feel like an afterthought
   - Break "first/second/third" patterns
4. Add imperfection:
   - Mention a time it didn't work and why
   - "If you're short on time, you can skip..."
   - "I know this sounds weird, but trust me..."
5. Conversational fixes:
   - "One can add" → "You can add"
   - "It is recommended" → "I'd recommend"
   - "The dish is characterized by" → "This dish has"

Output only the modified text, no explanations.`;

  const deaiArticle = await callClaudeWithRetry([{ role: 'user', content: deaiPrompt }], 4000);

  return { outline, article: deaiArticle };
}

// ============ Save Article ============

function saveArticle(article, recipe, i18nSlug, pubDate) {
  const titleMatch = article.match(/^#\s+(.+)$/m) || article.match(/^(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : recipe.name;
  const description = article.replace(/#+\s+/g, '').substring(0, 120).replace(/\n/g, ' ') + '...';
  const category = autoClassify(title, description, article);
  const tags = extractTags(title, article);

  const slug = recipeToSlug(recipe);
  const filename = `${slug}-en.md`;
  const filepath = path.join(BLOG_DIR, filename);

  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }

  const frontmatter = `---
title: "${title}"
description: "${description.substring(0, 120)}"
pubDate: ${pubDate}
category: "${category}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
lang: en
draft: false
adSlots: 2
i18nSlug: "${i18nSlug}"
difficulty: "${recipe.difficulty || 'Medium'}"
prepTime: "${recipe.prepTime || ''}"
cookTime: "${recipe.cookTime || ''}"
servings: ${recipe.servings || 4}
cuisine: "${recipe.category || 'Chinese'}"
---

`;

  const fullContent = frontmatter + article.replace(/^#\s+.+\n?/m, '').trim();
  fs.writeFileSync(filepath, fullContent, 'utf8');

  return { filepath, title, category, tags, description };
}

// ============ Batch Management ============

function createNewBatch(recipes, registry, count) {
  const ungenerated = recipes.filter(r => !registry.generated.includes(r.name));
  const selected = shuffle(ungenerated).slice(0, Math.min(count, ungenerated.length));
  const batchId = `${new Date().toISOString().split('T')[0]}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;

  // Stagger dates backwards
  const today = new Date();
  const pubDates = selected.map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  const summary = {
    batch: {
      id: batchId,
      created_at: new Date().toISOString(),
      target_count: selected.length,
      status: 'in_progress',
    },
    selected_recipes: selected.map((r, i) => ({
      name: r.name,
      status: 'pending',
      pubDate: pubDates[i],
      en_file: `src/content/blog/${recipeToSlug(r)}-en.md`,
    })),
    progress: {
      completed: 0,
      failed: 0,
      remaining: selected.length,
    },
    rolling_context: `Batch ${batchId} created. ${selected.length} recipes selected.`,
    errors: [],
  };

  saveSummary(summary);
  return { summary, selected };
}

function resumeBatch(summary, recipes, registry) {
  console.log(`\n📋 Found incomplete batch: ${summary.batch.id}`);
  console.log(`   Status: ${summary.batch.status}`);
  console.log(`   Progress: ${summary.progress.completed}/${summary.selected_recipes.length}`);

  const pendingRecipes = [];
  for (const item of summary.selected_recipes) {
    const slug = recipeToSlug({ name: item.name });
    const checks = verifyRecipeFiles(slug);
    const allExist = checks.every(c => c.exists);

    if (allExist && item.status !== 'completed') {
      item.status = 'completed';
      if (!registry.generated.includes(item.name)) {
        registry.generated.push(item.name);
      }
    } else if (!allExist && item.status === 'completed') {
      item.status = 'pending';
    }

    if (item.status === 'pending' || item.status === 'failed') {
      const recipe = recipes.find(r => r.name === item.name);
      if (recipe) pendingRecipes.push(recipe);
    }
  }

  summary.progress.completed = summary.selected_recipes.filter(r => r.status === 'completed').length;
  summary.progress.failed = summary.selected_recipes.filter(r => r.status === 'failed').length;
  summary.progress.remaining = summary.selected_recipes.filter(r => r.status === 'pending').length;

  saveSummary(summary);
  saveRegistry(registry);

  console.log(`   Pending: ${pendingRecipes.length} recipes`);
  return pendingRecipes;
}

async function processRecipe(recipe, summary, registry, options, pubDate) {
  const slug = recipeToSlug(recipe);
  const i18nSlug = slug;
  const recipeItem = summary.selected_recipes.find(r => r.name === recipe.name);

  console.log(`\n📦 Processing: ${recipe.name} (${recipe.category}) [${pubDate}]`);

  if (options.dryRun) {
    console.log(`   [Dry-run] Skipping`);
    return { success: true };
  }

  // Check registry
  if (registry.generated.includes(recipe.name) && !options.force) {
    console.log(`   ⚠️ Already in registry, skipping`);
    if (recipeItem) recipeItem.status = 'completed';
    return { success: true, skipped: true };
  }

  // Check files exist
  const checks = verifyRecipeFiles(slug);
  const allExist = checks.every(c => c.exists);
  if (allExist && !options.force) {
    console.log(`   ⚠️ Files exist, registering and skipping`);
    if (!registry.generated.includes(recipe.name)) {
      registry.generated.push(recipe.name);
    }
    if (recipeItem) recipeItem.status = 'completed';
    return { success: true, skipped: true };
  }

  if (recipeItem) recipeItem.status = 'in_progress';

  try {
    // Generate English article
    const enResult = await generateRecipeArticle(recipe);
    const enMeta = saveArticle(enResult.article, recipe, i18nSlug, pubDate);
    console.log(`   ✅ English: ${enMeta.title}`);

    // Update registry
    if (!registry.generated.includes(recipe.name)) {
      registry.generated.push(recipe.name);
    }
    saveRegistry(registry);

    if (recipeItem) recipeItem.status = 'completed';

    // Update summary
    summary.progress.completed = summary.selected_recipes.filter(r => r.status === 'completed').length;
    summary.progress.remaining = summary.selected_recipes.filter(r => r.status === 'pending').length;
    summary.rolling_context = `Last processed: ${recipe.name}. Completed: ${summary.progress.completed}/${summary.selected_recipes.length}.`;
    saveSummary(summary);

    return { success: true };
  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`);
    if (recipeItem) recipeItem.status = 'failed';

    summary.errors.push({
      recipe: recipe.name,
      error: err.message,
      timestamp: new Date().toISOString(),
    });

    summary.progress.failed = summary.selected_recipes.filter(r => r.status === 'failed').length;
    saveSummary(summary);

    fs.appendFileSync(
      path.join(__dirname, 'generation-errors.log'),
      `${new Date().toISOString()} ${recipe.name}: ${err.message}\n`
    );

    return { success: false, error: err.message };
  }
}

// ============ Deploy ============

function deploy() {
  console.log('\n🚀 Starting deployment...');

  try {
    console.log('   1) Building site...');
    execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'inherit' });

    console.log('   2) Committing changes...');
    execSync('git add -A', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    const timestamp = new Date().toISOString().split('T')[0];
    execSync(
      `git commit -m "content: add recipe posts (${timestamp})"`,
      { cwd: PROJECT_ROOT, stdio: 'inherit' }
    );

    console.log('   3) Pushing to GitHub...');
    execSync('git push origin main', { cwd: PROJECT_ROOT, stdio: 'inherit' });

    console.log('   ✅ Deployment complete! Vercel will auto-deploy.');
  } catch (err) {
    console.error('\n❌ Deployment failed:', err.message);
    throw err;
  }
}

// ============ Status ============

function showStatus(recipes, registry) {
  const total = recipes.length;
  const generated = registry.generated.length;
  const remaining = total - generated;

  console.log('\n📊 Cooking-Gen Status');
  console.log('======================');
  console.log(`   Total recipes:   ${total}`);
  console.log(`   Generated:       ${generated}`);
  console.log(`   Remaining:       ${remaining}`);
  console.log(`   Completion:      ${((generated / total) * 100).toFixed(1)}%`);
  console.log(`   Last run:        ${registry.lastRun || 'Never'}`);

  const summary = loadSummary();
  if (summary && summary.batch.status === 'in_progress') {
    console.log(`\n   ⚠️ Incomplete batch:`);
    console.log(`      Batch ID: ${summary.batch.id}`);
    console.log(`      Progress: ${summary.progress.completed}/${summary.selected_recipes.length}`);
    console.log(`      Failed: ${summary.progress.failed}`);
    console.log(`      Use --resume to continue`);
  }

  console.log('\n   Recently generated:');
  registry.generated.slice(-10).forEach((r, i) => {
    console.log(`      ${i + 1}. ${r}`);
  });
}

// ============ Main ============

async function main() {
  const args = process.argv.slice(2);

  const countArg = args.find(a => a.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1], 10) : 10;
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const shouldDeploy = args.includes('--deploy');
  const selectOnly = args.includes('--select-only');
  const resume = args.includes('--resume');
  const showStatusFlag = args.includes('--status');

  console.log('\n🍜 Chinese Recipe Batch Generator');
  console.log('=================================');
  console.log(`Config: count=${count}, force=${force}, dryRun=${dryRun}, deploy=${shouldDeploy}, selectOnly=${selectOnly}, resume=${resume}`);

  // 1. Load recipes
  console.log('\n📂 Loading recipe-index.json...');
  const recipes = loadRecipeIndex();
  console.log(`   Found ${recipes.length} recipes`);

  // 2. Load registry
  const registry = loadRegistry();
  registry.stats.totalRecipesAvailable = recipes.length;
  console.log(`   Already generated: ${registry.generated.length} recipes`);

  // Status mode
  if (showStatusFlag) {
    showStatus(recipes, registry);
    return;
  }

  // 3. Check incomplete batch
  const existingSummary = loadSummary();
  let selectedRecipes = [];
  let summary = null;

  if (resume && existingSummary && existingSummary.batch.status === 'in_progress') {
    selectedRecipes = resumeBatch(existingSummary, recipes, registry);
    summary = existingSummary;
  }

  // 4. Create new batch if not resuming
  if (selectedRecipes.length === 0) {
    const ungenerated = recipes.filter(r => !registry.generated.includes(r.name));
    console.log(`   Ungenerated recipes: ${ungenerated.length}`);

    if (ungenerated.length === 0) {
      console.log('\n✅ All recipes have been generated!');
      return;
    }

    const batchSize = Math.min(count, ungenerated.length);
    const batch = createNewBatch(recipes, registry, batchSize);
    summary = batch.summary;
    selectedRecipes = batch.selected;

    console.log(`\n🎲 New batch: ${summary.batch.id}`);
    console.log(`   Selected ${selectedRecipes.length} recipes:`);
    selectedRecipes.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name} (${r.category}, ${r.difficulty})`);
    });
  }

  if (selectOnly) {
    console.log('\n✅ Recipes selected and project_summary.md created');
    console.log(`   Batch ID: ${summary.batch.id}`);
    return;
  }

  if (dryRun) {
    console.log('\n🛑 Dry-run mode, skipping generation.');
    return;
  }

  // 5. Check API key
  if (!ANTHROPIC_API_KEY) {
    console.error('\n❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('Set it before running:');
    console.error('   $env:ANTHROPIC_API_KEY="your-key"  (PowerShell)');
    console.error('   export ANTHROPIC_API_KEY=your-key   (Bash)');
    process.exit(1);
  }

  // 6. Batch generate
  console.log('\n✨ Starting generation...');
  const results = [];

  for (let i = 0; i < selectedRecipes.length; i++) {
    const recipe = selectedRecipes[i];
    const recipeItem = summary.selected_recipes.find(r => r.name === recipe.name);
    const pubDate = recipeItem?.pubDate || new Date().toISOString().split('T')[0];
    const result = await processRecipe(recipe, summary, registry, { dryRun, force }, pubDate);
    results.push({ recipe: recipe.name, ...result });
  }

  // 7. Completion check
  const allComplete = summary.selected_recipes.every(r => r.status === 'completed');
  const anyFailed = summary.selected_recipes.some(r => r.status === 'failed');

  if (allComplete) {
    summary.batch.status = 'completed';
    summary.rolling_context = `Batch ${summary.batch.id} complete. All ${summary.selected_recipes.length} recipes generated.`;
  } else if (anyFailed) {
    summary.batch.status = 'failed';
    summary.rolling_context = `Batch ${summary.batch.id} partially failed. Success: ${summary.progress.completed}, Failed: ${summary.progress.failed}. Use --resume to retry.`;
  }
  saveSummary(summary);

  // 8. Summary
  const successCount = results.filter(r => r.success && !r.skipped).length;
  const skippedCount = results.filter(r => r.skipped).length;
  const failCount = results.filter(r => !r.success).length;
  const remainingTotal = recipes.length - registry.generated.length;

  console.log('\n=================================');
  console.log('📊 Generation Summary');
  console.log(`   Success: ${successCount}`);
  console.log(`   Skipped (existing): ${skippedCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Total generated: ${registry.generated.length} / ${recipes.length}`);
  console.log(`   Remaining: ${remainingTotal}`);
  console.log(`   Completion: ${((registry.generated.length / recipes.length) * 100).toFixed(1)}%`);

  if (failCount > 0) {
    console.log('\n   Failed recipes:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`     - ${r.recipe}: ${r.error}`);
    });
    console.log('\n   Use --resume to retry failed recipes.');
  }

  // 9. Deploy
  if (shouldDeploy && successCount > 0) {
    deploy();
  }

  console.log('\n✅ Done!\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});

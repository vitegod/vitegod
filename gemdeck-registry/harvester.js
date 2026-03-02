const fs = require('fs');
const path = require('path');

const PROVIDERS_FILE = path.join(__dirname, 'providers.json');
const OUTPUT_DIR = path.join(__dirname, 'public');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'universal-runes.json');

async function fetchGitHub(url) {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Gemdeck-Harvester'
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

function parseMarkdown(content, provider, originalUrl) {
  let title = "Untitled Rune";
  let actionCommand = "";
  let tags = [provider.id];

  // Title: first H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1].trim();
  }

  // Tags: search for keywords
  const keywords = {
    'react': ['react', 'frontend', 'ui'],
    'node': ['node', 'backend', 'js'],
    'python': ['python', 'ai', 'ml'],
    'ai': ['ai', 'llm', 'gpt', 'anthropic', 'openai'],
    'tool': ['tool', 'agent', 'automation'],
    'composio': ['composio', 'integration'],
    'crewai': ['crewai', 'multi-agent'],
    'vercel': ['vercel', 'serverless', 'edge']
  };

  for (const [key, t] of Object.entries(keywords)) {
    if (content.toLowerCase().includes(key)) {
      tags = [...new Set([...tags, ...t])];
    }
  }

  // Action Command: Look for npx or specific patterns
  const npxMatch = content.match(/npx\s+[\w@/-]+/i);
  if (npxMatch) {
    actionCommand = npxMatch[0];
  } else if (provider.id === 'vercel-labs') {
    // Heuristic for Vercel skills if no npx found
    const slug = path.basename(originalUrl, '.md');
    actionCommand = `npx skills add ${slug}`;
  }

  return {
    id: `${provider.id}-${path.basename(originalUrl, '.md')}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    title,
    raw_url: originalUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/'),
    tags,
    actionCommand,
    provider: provider.name,
    originalUrl
  };
}

async function harvest() {
  console.log("🚀 Starting Harvest...");
  const providers = JSON.parse(fs.readFileSync(PROVIDERS_FILE, 'utf8'));
  const allRunes = [];

  for (const provider of providers) {
    console.log(`📦 Processing Provider: ${provider.name}`);
    try {
      const apiUrl = `https://api.github.com/repos/${provider.owner}/${provider.repo}/contents/${provider.path}?ref=${provider.branch}`;
      const contents = await fetchGitHub(apiUrl);

      const files = Array.isArray(contents) ? contents : [contents];
      const mdFiles = files.filter(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'));

      for (const file of mdFiles) {
        console.log(`  📄 Fetching ${file.name}...`);
        const rawResponse = await fetch(file.download_url);
        const content = await rawResponse.text();

        const rune = parseMarkdown(content, provider, file.html_url);
        allRunes.push(rune);
      }
    } catch (err) {
      console.error(`  ❌ Error harvesting from ${provider.name}: ${err.message}`);
    }
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allRunes, null, 2));
  console.log(`✅ Harvest complete! Saved ${allRunes.length} runes to ${OUTPUT_FILE}`);
}

harvest().catch(err => {
  console.error("💥 Critical harvest error:", err);
  process.exit(1);
});

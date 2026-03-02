import fs from 'fs';
import path from 'path';
import { gatherAllSkills } from './fetchers/index.js';
import { parseSkillToRune } from './parser.js';

async function build() {
  console.log("🛠️ Starting Rune Registry Build...");
  
  try {
    const rawSkills = await gatherAllSkills();
    const processedRunes = [];

    for (const skill of rawSkills) {
      const rune = parseSkillToRune(skill.content, skill.url);
      if (rune) {
        processedRunes.push(rune);
      }
    }

    const registry = {
      lastUpdated: new Date().toISOString(),
      totalRunes: processedRunes.length,
      runes: processedRunes
    };

    const outputDir = path.resolve('public');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'registry.json');
    fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));

    console.log(`✅ Registry built successfully! Saved ${processedRunes.length} runes to ${outputPath}`);
  } catch (error) {
    console.error("💥 Build failed:", error);
    process.exit(1);
  }
}

build();

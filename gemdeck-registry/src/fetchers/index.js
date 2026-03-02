import { fetchFromGithub } from './github_raw.js';
import { fetchFromSkillsSh } from './skills_sh.js';

/**
 * Gathers all skills from all configured sources.
 * @returns {Promise<Array<{content: string, url: string}>>}
 */
export async function gatherAllSkills() {
  console.log("🚀 Gathering all skills...");
  
  // Example hardcoded manual URLs (could be from Anthropic or other repos)
  const manualUrls = [
    'https://raw.githubusercontent.com/anthropics/anthropic-cookbook/main/skills/search.md',
    'https://raw.githubusercontent.com/anthropics/anthropic-cookbook/main/skills/calculator.md'
  ];

  const githubSkills = await fetchFromGithub(manualUrls);
  const vlsSkills = await fetchFromSkillsSh();

  const allSkills = [...githubSkills, ...vlsSkills];
  console.log(`✅ Gathered ${allSkills.length} total skills.`);
  return allSkills;
}

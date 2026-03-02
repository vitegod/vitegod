import axios from 'axios';

/**
 * Fetches skills from Vercel Labs (skills.sh).
 * This typically involves listing files in the skills repository and fetching their content.
 * @returns {Promise<Array<{content: string, url: string}>>}
 */
export async function fetchFromSkillsSh() {
  const owner = 'vercel-labs';
  const repo = 'skills';
  const branch = 'main';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`;

  const results = [];
  try {
    console.log(`  📦 Fetching skills from ${owner}/${repo}...`);
    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GemDeck-Harvester'
      }
    });

    const files = response.data.filter(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'));

    for (const file of files) {
      try {
        console.log(`    📄 Fetching ${file.name}...`);
        const rawResponse = await axios.get(file.download_url);
        results.push({
          content: rawResponse.data,
          url: file.html_url
        });
      } catch (err) {
        console.error(`    ❌ Failed to fetch ${file.name}:`, err.message);
      }
    }
  } catch (error) {
    console.error(`  ❌ Error listing skills from ${owner}/${repo}:`, error.message);
  }
  return results;
}

import axios from 'axios';

/**
 * Fetches raw content from a list of GitHub URLs.
 * @param {string[]} urls - Array of raw.githubusercontent URLs.
 * @returns {Promise<Array<{content: string, url: string}>>}
 */
export async function fetchFromGithub(urls) {
  const results = [];
  for (const url of urls) {
    try {
      console.log(`  🔗 Fetching raw: ${url}...`);
      const response = await axios.get(url);
      results.push({
        content: response.data,
        url: url
      });
    } catch (error) {
      console.error(`  ❌ Failed to fetch from ${url}:`, error.message);
    }
  }
  return results;
}

import yaml from 'js-yaml';

/**
 * Parses raw skill markdown into a Rune object.
 * @param {string} rawContent - The raw markdown content.
 * @param {string} sourceUrl - The source URL of the skill.
 * @returns {object|null} - The parsed Rune object or null if parsing fails.
 */
export function parseSkillToRune(rawContent, sourceUrl) {
  try {
    let frontmatter = {};
    let body = rawContent;

    // YAML Extraction
    const yamlMatch = rawContent.match(/^---\s*([\s\S]*?)\s*---/);
    if (yamlMatch) {
      try {
        frontmatter = yaml.load(yamlMatch[1]) || {};
        body = rawContent.slice(yamlMatch[0].length).trim();
      } catch (e) {
        console.warn(`Failed to parse YAML frontmatter for ${sourceUrl}:`, e.message);
      }
    }

    // Content Clean-up: Strip executable code blocks to keep it purely as a prompt injector
    const cleanBody = body.replace(/```(?:bash|python|sh|javascript|js|typescript|ts)[\s\S]*?```/gi, '').trim();

    // Title: frontmatter.name or first H1
    let title = frontmatter.name || frontmatter.title;
    if (!title) {
      const h1Match = body.match(/^#\s+(.+)$/m);
      title = h1Match ? h1Match[1].trim() : 'Untitled Rune';
    }

    // Description: frontmatter.description or first paragraph
    let description = frontmatter.description;
    if (!description) {
      const lines = cleanBody.split('\n').filter(l => l.trim().length > 0 && !l.startsWith('#'));
      description = lines.length > 0 ? lines[0].trim() : '';
    }

    // Tag Generation (The AI Edge)
    let tags = new Set(frontmatter.tags || []);
    if (frontmatter.category) tags.add(frontmatter.category);

    // Extract keywords from body
    const keywords = {
      'react': ['react', 'frontend'],
      'next.js': ['nextjs', 'framework'],
      'node': ['node', 'backend'],
      'python': ['python', 'ai'],
      'testing': ['testing', 'qa'],
      'database': ['db', 'sql'],
      'api': ['rest', 'api']
    };

    const lowercaseBody = cleanBody.toLowerCase();
    for (const [key, t] of Object.entries(keywords)) {
      if (lowercaseBody.includes(key)) {
        t.forEach(tag => tags.add(tag));
      }
    }

    // Type Classification
    let type = 'minor';
    const classificationKeywords = ['architect', 'expert', 'lead', 'master', 'senior', 'principal'];
    const titleAndDesc = (title + ' ' + description).toLowerCase();
    if (classificationKeywords.some(kw => titleAndDesc.includes(kw))) {
      type = 'keystone';
    }

    return {
      title,
      description,
      content: cleanBody,
      type,
      tags: Array.from(tags),
      originalUrl: sourceUrl,
      lastSynced: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error parsing skill from ${sourceUrl}:`, error);
    return null;
  }
}

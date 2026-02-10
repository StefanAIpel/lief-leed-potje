#!/usr/bin/env node
/**
 * Build search index for Straatambassadeurs site
 * Run: node build-search-index.js
 */
const fs = require('fs');
const path = require('path');

const SITE_DIR = __dirname;
const EXCLUDE = ['admin.html', 'taskflow.html', 'logo-preview.html'];

// Get all HTML files
const htmlFiles = fs.readdirSync(SITE_DIR)
  .filter(f => f.endsWith('.html') && !EXCLUDE.includes(f));

function stripHtml(html) {
  // Remove script/style blocks
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  html = html.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  // Remove tags
  html = html.replace(/<[^>]+>/g, ' ');
  // Decode entities
  html = html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  // Normalize whitespace
  html = html.replace(/\s+/g, ' ').trim();
  return html;
}

function getTitle(html) {
  const m = html.match(/<title>(.*?)<\/title>/i);
  return m ? m[1].replace(/\s*[|–—]\s*Straatambassadeurs.*$/i, '').trim() : '';
}

const index = htmlFiles.map(file => {
  const html = fs.readFileSync(path.join(SITE_DIR, file), 'utf-8');
  const title = getTitle(html) || file.replace('.html', '');
  const text = stripHtml(html);
  return { url: file, title, text };
});

const output = `// Auto-generated search index — do not edit manually
// Generated: ${new Date().toISOString()}
var SEARCH_INDEX = ${JSON.stringify(index, null, 0)};
`;

fs.writeFileSync(path.join(SITE_DIR, 'search-index.js'), output);
console.log(`Search index built: ${index.length} pages indexed`);
index.forEach(p => console.log(`  - ${p.url} (${p.title}, ${p.text.length} chars)`));

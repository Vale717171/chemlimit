const assert = require('assert');
const fs = require('fs');

const linksContent = fs.readFileSync('src/lib/links.js', 'utf8');

// evaluate the links build code
const scriptToEval = linksContent.replace(/export function/g, 'function');
eval(scriptToEval);

const echaLinksContent = fs.readFileSync('src/data/external/echa_verified_links.json', 'utf8');
const echaLinks = JSON.parse(echaLinksContent);

function test() {
  // Test no generated links contain generic search engines
  const genericSearchEngines = ['duckduckgo.com', 'google.com/search', 'bing.com'];

  const testCases = [
    { cas: '110-54-3', name_en: 'n-Hexane' },
    { cas: '67-64-1', name_en: 'Acetone' },
    { cas: '123-45-6', name_en: 'Unknown' },
    { name_en: 'Benzene' }
  ];

  for (const tc of testCases) {
    const generatedLinks = mergeExternalLinks({ cas: tc.cas, name_en: tc.name_en }, '', echaLinks);
    for (const key of Object.keys(generatedLinks)) {
      const url = generatedLinks[key].url;
      if (url) {
        for (const engine of genericSearchEngines) {
          if (url.includes(engine)) {
            throw new Error(`Link for ${tc.cas || tc.name_en} uses generic search engine ${engine}: ${url}`);
          }
        }
      }
    }
  }

  // CAS 110-54-3 produces direct ECHA URL ending in /100.003.435
  const hexaneLinks = mergeExternalLinks({ cas: '110-54-3', name_en: 'n-Hexane' }, '', echaLinks);
  assert.strictEqual(hexaneLinks.echa.status, 'verified');
  assert.ok(hexaneLinks.echa.url.endsWith('/100.003.435'), `Hexane ECHA url is wrong: ${hexaneLinks.echa.url}`);

  // CAS 67-64-1 produces direct ECHA URL ending in /100.000.602
  const acetoneLinks = mergeExternalLinks({ cas: '67-64-1', name_en: 'Acetone' }, '', echaLinks);
  assert.strictEqual(acetoneLinks.echa.status, 'verified');
  assert.ok(acetoneLinks.echa.url.endsWith('/100.000.602'), `Acetone ECHA url is wrong: ${acetoneLinks.echa.url}`);

  // Unknown CAS produces official ECHA search fallback, not generic search
  const unknownLinks = mergeExternalLinks({ cas: '123-45-6', name_en: 'Unknown' }, '', echaLinks);
  assert.strictEqual(unknownLinks.echa.status, 'search');
  assert.strictEqual(unknownLinks.echa.url, 'https://www.echa.europa.eu/en/information-on-chemicals');

  console.log('All external links checks passed!');
}

test();

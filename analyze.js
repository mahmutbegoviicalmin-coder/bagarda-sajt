/**
 * analyze.js
 * Reads every image in ./images/, calls Claude Vision API on each,
 * extracts brand/type/color/name, prints a confirmation table,
 * and saves the results to analysis.json.
 *
 * Usage: node analyze.js
 */

import fs   from 'fs';
import path from 'path';

const IMAGES_DIR   = './images';
const OUTPUT_FILE  = './analysis.json';
const SKIP_FILES   = new Set(['tommy-polo-crna.jpg']);
const API_KEY      = process.env.ANTHROPIC_API_KEY;
const MODEL        = 'claude-opus-4-6';

if (!API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY is not set in environment.');
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMediaType(ext) {
  if (ext === '.png')  return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif')  return 'image/gif';
  return 'image/jpeg'; // .jpg / .jpeg / fallback
}

/** Call Claude Vision and return parsed JSON object from the model. */
async function analyzeImage(imagePath) {
  const imageData  = fs.readFileSync(imagePath);
  const base64     = imageData.toString('base64');
  const ext        = path.extname(imagePath).toLowerCase();
  const mediaType  = getMediaType(ext);

  const body = {
    model: MODEL,
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 }
        },
        {
          type: 'text',
          text: `Look at this clothing item and return ONLY a JSON object, nothing else:
{
  "brand": "brand name in ALL CAPS (e.g. TOMMY HILFIGER, LACOSTE, HUGO BOSS, RALPH LAUREN)",
  "type": "polo" or "majica",
  "color": "main color in Bosnian (e.g. crna, bijela, siva, plava, zelena)",
  "name": "short product name in Bosnian (e.g. Polo Majica, Majica na kragnu, Majica s printom)"
}`
        }
      ]
    }]
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content[0].text.trim();

  // Strip markdown code fences if the model wrapped the JSON
  const clean = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(clean);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Collect image files
  const allFiles = fs.readdirSync(IMAGES_DIR)
    .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
    .filter(f => !SKIP_FILES.has(f))
    .sort();

  if (allFiles.length === 0) {
    console.error('❌  No images found in ./images/');
    process.exit(1);
  }

  console.log(`\n📸  Found ${allFiles.length} image(s). Analyzing with Claude Vision...\n`);

  const results = [];

  for (let i = 0; i < allFiles.length; i++) {
    const file     = allFiles[i];
    const imgPath  = path.join(IMAGES_DIR, file);
    const idx      = String(i + 1).padStart(2, ' ');

    process.stdout.write(`  [${idx}/${allFiles.length}]  ${file}  ...`);

    try {
      const info = await analyzeImage(imgPath);
      results.push({ file, ...info });
      console.log(`  ✓  ${info.brand} | ${info.type} | ${info.color}`);
    } catch (err) {
      console.warn(`  ⚠  FAILED (${err.message}) — using filename fallback`);
      // Fallback: derive what we can from the filename
      results.push({
        file,
        brand: 'NEPOZNAT BREND',
        type:  'majica',
        color: 'nepoznata',
        name:  'Majica',
        _fallback: true
      });
    }

    // Small delay between requests to stay under rate limits
    if (i < allFiles.length - 1) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // ─── Print confirmation table ─────────────────────────────────────────────

  const col = {
    file:  Math.max(8,  Math.max(...results.map(r => r.file.length))),
    brand: Math.max(14, Math.max(...results.map(r => r.brand.length))),
    type:  6,
    color: 10,
    name:  Math.max(18, Math.max(...results.map(r => r.name.length)))
  };

  const pad = (str, len) => String(str).padEnd(len);
  const hr  = '─'.repeat(col.file + col.brand + col.type + col.color + col.name + 16);

  console.log('\n' + hr);
  console.log(
    `  ${pad('Fajl', col.file)}  ${pad('Brend', col.brand)}  ${pad('Tip', col.type)}  ${pad('Boja', col.color)}  ${pad('Naziv', col.name)}`
  );
  console.log(hr);

  for (const r of results) {
    const flag = r._fallback ? ' ⚠' : '';
    console.log(
      `  ${pad(r.file, col.file)}  ${pad(r.brand, col.brand)}  ${pad(r.type, col.type)}  ${pad(r.color, col.color)}  ${pad(r.name, col.name)}${flag}`
    );
  }

  console.log(hr);

  // Save to JSON for the generation step
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf8');

  console.log(`\n✅  Analiza završena. Rezultati sačuvani u: ${OUTPUT_FILE}`);
  console.log('\n❓  Sve OK? Mogu li generisati stranice?');
  console.log('    → Pokreni: node generate.js\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

/**
 * generate.js
 * Reads analysis.json, generates one product HTML page per item
 * (using tommy-polo.html as template), then generates index.html.
 *
 * Usage: node generate.js
 */

import fs   from 'fs';
import path from 'path';

const ANALYSIS_FILE = './analysis.json';
const TEMPLATE_FILE = './tommy-polo.html';
const OUTPUT_DIR    = '.';

// ─── Pricing by type ─────────────────────────────────────────────────────────
const PRICE = {
  polo:   { current: '69,90 KM', old: '139,90 KM', num: '69.90', numDisplay: 69.90 },
  majica: { current: '59,90 KM', old: '119,90 KM', num: '59.90', numDisplay: 59.90 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Remove Bosnian diacritics and convert to a URL-safe slug. */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/š/g, 's').replace(/č/g, 'c').replace(/ć/g, 'c')
    .replace(/ž/g, 'z').replace(/đ/g, 'd').replace(/đ/g, 'd')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Convert ALL CAPS brand name to Title Case. */
function titleCase(str) {
  return str.toLowerCase().split(/\s+/).map(
    w => w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
}

/** Capitalize first letter, lowercase the rest. */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ─── Product page generator ──────────────────────────────────────────────────

function generatePage(product, template) {
  const { file, brand, type, color, name } = product;
  const price     = PRICE[type] || PRICE.majica;
  const brandFmt  = titleCase(brand);          // e.g. "Tommy Hilfiger"
  const colorCap  = capitalize(color);         // e.g. "Crna"
  const h1Name    = `${name} — ${colorCap}`;  // e.g. "Polo Majica — Crna"
  const supabase  = `${brand} - ${name} - ${color}`; // Supabase proizvod value

  // Product description
  const description = type === 'polo'
    ? `Klasična ${brandFmt} polo majica izrađena od premium pamuka. Prepoznatljivi dizajn s kranom savršeno kombinira eleganciju i udobnost — idealna za svaku prigodu, od casual do smart-casual stila.`
    : `Elegantna ${brandFmt} majica izrađena od premium pamuka. Moderan dizajn koji savršeno kombinira stil i udobnost — idealna za svaku prigodu, od casual do smart-casual stila.`;

  let html = template;

  // 1. <title>
  html = html.replace(
    'Tommy Hilfiger — Majica na kragnu | Bagarda',
    `${brandFmt} — ${name} | Bagarda`
  );

  // 2. Breadcrumb last segment
  html = html.replace(
    '    Tommy Hilfiger — Majica na kragnu\n  </div>',
    `    ${brandFmt} — ${name}\n  </div>`
  );

  // 3. Main product image (gallery)
  html = html.replace(
    'src="./images/tommy-polo-crna.jpg" alt="Tommy Hilfiger Polo Majica"',
    `src="./images/${file}" alt="${brandFmt} ${name}"`
  );

  // 4. Brand tag
  html = html.replace(
    '>Tommy Hilfiger</span>',
    `>${brandFmt}</span>`
  );

  // 5. Product name h1
  html = html.replace(
    '>Majica na kragnu</h1>',
    `>${h1Name}</h1>`
  );

  // 6. Price current (in product section)
  html = html.replace(
    '<span class="price-current">69,90 KM</span>',
    `<span class="price-current">${price.current}</span>`
  );

  // 7. Price old (in product section)
  html = html.replace(
    '<span class="price-old">139,90 KM</span>',
    `<span class="price-old">${price.old}</span>`
  );

  // 8. Product description paragraph
  html = html.replace(
    /Klasična Tommy Hilfiger polo majica izrađena od premium pamuka\.[\s\S]*?smart-casual stila\./,
    description
  );

  // 9. Form thumbnail image
  html = html.replace(
    'src="./images/tommy-polo-crna.jpg" alt="Tommy Hilfiger polo"',
    `src="./images/${file}" alt="${brandFmt} ${type}"`
  );

  // 10. Form summary product name
  html = html.replace(
    '>Tommy Hilfiger — Majica na kragnu</span>',
    `>${brandFmt} — ${name}</span>`
  );

  // 11. Form summary price
  html = html.replace(
    '<span class="form-summary-price">69,90 KM</span>',
    `<span class="form-summary-price">${price.current}</span>`
  );

  // 12. Order product name
  html = html.replace(
    "proizvod: 'PROIZVOD_NAME'",
    `proizvod: '${supabase}'`
  );

  // 13. Order cijena
  html = html.replace(
    "cijena: 'PROIZVOD_CIJENA'",
    `cijena: '${price.num}'`
  );

  // 13b. Pixel Purchase — value
  html = html.replace(
    "value: parseFloat('PROIZVOD_CIJENA')",
    `value: parseFloat('${price.num}')`
  );

  // 13c. Pixel Purchase — content_name
  html = html.replace(
    "content_name: 'PROIZVOD_NAME'",
    `content_name: '${supabase}'`
  );

  // 14. Order slika
  html = html.replace(
    "'/images/PROIZVOD_IMAGE'",
    `'/images/${file}'`
  );

  // 15. Sticky bar product name
  html = html.replace(
    'id="sticky-name">Tommy Hilfiger — Majica na kragnu</div>',
    `id="sticky-name">${brandFmt} — ${name}</div>`
  );

  // 16. Sticky bar price
  html = html.replace(
    "font-family:'DM Sans',sans-serif; font-size:13px; color:#C9A96E; font-weight:500;\">69,90 KM</div>",
    `font-family:'DM Sans',sans-serif; font-size:13px; color:#C9A96E; font-weight:500;\">${price.current}</div>`
  );

  // 17. Floating CTA — image
  html = html.replace(
    '<img class="fcta-img" src="./images/tommy-polo-crna.jpg">',
    `<img class="fcta-img" src="./images/${file}">`
  );

  // 17b. Floating CTA — product name
  html = html.replace(
    '<div class="fcta-n">Tommy Hilfiger — Majica na kragnu</div>',
    `<div class="fcta-n">${brandFmt} — ${name}</div>`
  );

  // 17c. Floating CTA — current price
  html = html.replace(
    '<span class="fcta-p">69,90 KM</span>',
    `<span class="fcta-p">${price.current}</span>`
  );

  // 17d. Floating CTA — old price
  html = html.replace(
    '<span class="fcta-op">139,90 KM</span>',
    `<span class="fcta-op">${price.old}</span>`
  );

  // 18. Toast message
  html = html.replace(
    'upravo naručio Tommy Hilfiger polo majicu',
    `upravo naručio ${brandFmt} ${name.toLowerCase()}`
  );

  return html;
}

// ─── Index page generator ─────────────────────────────────────────────────────

/** Map ALL-CAPS brand to filter key */
function brandKey(brand) {
  if (brand.includes('TOMMY'))   return 'tommy';
  if (brand.includes('CALVIN'))  return 'calvin';
  if (brand.includes('DIESEL'))  return 'diesel';
  if (brand.includes('ARMANI'))  return 'armani';
  return brand.toLowerCase().replace(/\s+/g, '-');
}

function generateIndex(products, slugMap) {
  const arrowSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

  const cards = products.map((p, i) => {
    const price    = PRICE[p.type] || PRICE.majica;
    const brandFmt = titleCase(p.brand);
    const colorCap = capitalize(p.color);
    const slug     = slugMap[i];
    const href     = `${slug}.html`;
    const bKey     = brandKey(p.brand);
    const brandUpper = brandFmt.toUpperCase();

    return `
    <div class="product-card" data-type="${p.type}" data-brand="${bKey}" onclick="location.href='${href}'">
      <div class="card-image-wrap"><img class="card-image" src="./images/${p.file}" alt="${brandFmt} ${p.name} ${colorCap}" loading="lazy"></div>
      <span class="card-badge">-50%</span>
      <div class="card-body">
        <div class="card-brand">${brandUpper}</div>
        <div class="card-name">${p.name} — ${colorCap}</div>
        <div class="card-bottom">
          <div><span class="card-price">${price.current}</span><span class="card-old">${price.old}</span></div>
          <div class="card-arrow">${arrowSvg}</div>
        </div>
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bagarda — Premium brendovi po outlet cijenama</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '1281626566733051');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=1281626566733051&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #F7F7F5;
      --bg-white: #FFFFFF;
      --text: #111111;
      --text-muted: #888888;
      --border: #E5E5E3;
      --accent: #111111;
      --gold: #C9A96E;
      --red: #E53935;
    }
    html { scroll-behavior: smooth; }
    body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: #E5E5E3;
      max-width: 1280px;
      margin: 32px auto;
      border: 1px solid #E5E5E3;
    }
    .product-card {
      background: #F7F7F5;
      cursor: pointer;
      transition: background 0.2s;
      position: relative;
      overflow: hidden;
    }
    .product-card:hover { background: #fff; }
    .card-image-wrap {
      aspect-ratio: 1/1;
      overflow: hidden;
      background: #EFEFED;
    }
    .card-image {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
      display: block;
    }
    .product-card:hover .card-image { transform: scale(1.04); }
    .card-body { padding: 14px 16px 18px; }
    .card-brand {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px; font-weight: 600;
      letter-spacing: 0.15em; color: #C9A96E;
      margin-bottom: 5px; text-transform: uppercase;
    }
    .card-name {
      font-family: 'Syne', sans-serif;
      font-size: 13px; font-weight: 600;
      color: #111; line-height: 1.3;
      margin-bottom: 10px;
    }
    .card-bottom {
      display: flex; align-items: center;
      justify-content: space-between;
    }
    .card-price {
      font-family: 'DM Sans', sans-serif;
      font-size: 16px; font-weight: 700; color: #111;
    }
    .card-old {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px; color: #bbb;
      text-decoration: line-through; margin-left: 6px;
    }
    .card-arrow {
      width: 30px; height: 30px;
      border: 1px solid #E5E5E3;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .product-card:hover .card-arrow { background: #111; border-color: #111; }
    .product-card:hover .card-arrow svg { stroke: #fff; }
    .card-badge {
      position: absolute; top: 10px; left: 10px;
      background: #E53935; color: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.06em; padding: 3px 7px;
      border-radius: 2px;
    }

    @media (max-width: 900px) {
      .products-grid { grid-template-columns: repeat(2, 1fr); margin: 0; }
    }
    @media (max-width: 480px) {
      .products-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>

  <!-- NAV -->
  <nav style="background:#fff;border-bottom:1px solid #E5E5E3;position:sticky;top:0;z-index:1000;">
    <div style="max-width:1280px;margin:0 auto;padding:0 32px;height:56px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.15em;color:#888;">KOLEKCIJA 2025</span>
      <a href="index.html" style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#111;text-decoration:none;letter-spacing:0.2em;">BAGARDA</a>
      <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.15em;color:#888;">BiH DOSTAVA</span>
    </div>
  </nav>

  <!-- HERO -->
  <section style="background:#fff;padding:80px 32px 64px;border-bottom:1px solid #E5E5E3;">
    <div style="max-width:900px;margin:0 auto;text-align:center;">

      <div style="display:inline-flex;align-items:center;gap:8px;background:#F7F7F5;border:1px solid #E5E5E3;border-radius:999px;padding:6px 16px;margin-bottom:24px;">
        <div style="width:6px;height:6px;border-radius:50%;background:#4a7c59;"></div>
        <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.15em;color:#555;">OUTLET RASPRODAJA — 50% POPUSTA</span>
      </div>

      <h1 style="font-family:'Syne',sans-serif;font-size:clamp(40px,6vw,80px);font-weight:800;color:#111;line-height:1.0;margin-bottom:16px;letter-spacing:-0.02em;">
        Premium brendovi.<br>
        <span style="color:#C9A96E;">Outlet cijene.</span>
      </h1>

      <p style="font-family:'DM Sans',sans-serif;font-size:15px;color:#888;max-width:480px;margin:0 auto 40px;line-height:1.6;">
        Tommy Hilfiger · Calvin Klein · Diesel · Armani Exchange<br>
        Isporuka 1–2 dana · Placanje pouzecem
      </p>

      <a href="#products" style="display:inline-block;background:#111;color:#fff;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.12em;padding:14px 36px;text-decoration:none;border-radius:2px;">
        POGLEDAJ KOLEKCIJU
      </a>

    </div>
  </section>

  <!-- STATS BAR -->
  <div style="background:#F7F7F5;border-bottom:1px solid #E5E5E3;">
    <div style="max-width:1280px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);">
      <div style="padding:20px 32px;text-align:center;border-right:1px solid #E5E5E3;">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#111;">24+</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#888;letter-spacing:0.08em;margin-top:2px;">MODELA</div>
      </div>
      <div style="padding:20px 32px;text-align:center;border-right:1px solid #E5E5E3;">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#111;">4.9/5</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#888;letter-spacing:0.08em;margin-top:2px;">OCJENA</div>
      </div>
      <div style="padding:20px 32px;text-align:center;border-right:1px solid #E5E5E3;">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#111;">1–2</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#888;letter-spacing:0.08em;margin-top:2px;">DANA DOSTAVA</div>
      </div>
      <div style="padding:20px 32px;text-align:center;">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#C9A96E;">-50%</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#888;letter-spacing:0.08em;margin-top:2px;">POPUST</div>
      </div>
    </div>
  </div>

  <!-- FILTER BAR -->
  <div id="products" style="background:#fff;border-bottom:1px solid #E5E5E3;position:sticky;top:56px;z-index:999;">
    <div style="max-width:1280px;margin:0 auto;padding:0 32px;">

      <!-- Level 1: Type -->
      <div style="display:flex;gap:0;border-bottom:1px solid #E5E5E3;overflow-x:auto;scrollbar-width:none;">
        <button class="type-btn active" data-type="all" style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.1em;padding:14px 20px;border:none;background:none;cursor:pointer;color:#111;border-bottom:2px solid #111;white-space:nowrap;">SVE</button>
        <button class="type-btn" data-type="polo" style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.1em;padding:14px 20px;border:none;background:none;cursor:pointer;color:#888;border-bottom:2px solid transparent;white-space:nowrap;">POLO MAJICE</button>
        <button class="type-btn" data-type="majica" style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.1em;padding:14px 20px;border:none;background:none;cursor:pointer;color:#888;border-bottom:2px solid transparent;white-space:nowrap;">T-SHIRTS</button>
      </div>

      <!-- Level 2: Brand -->
      <div id="brand-bar" style="display:flex;gap:8px;padding:10px 0;overflow-x:auto;scrollbar-width:none;">
        <button class="brand-btn active" data-brand="all" style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:6px 14px;border:1px solid #111;border-radius:999px;background:#111;color:#fff;cursor:pointer;white-space:nowrap;">Svi brendovi</button>
        <button class="brand-btn" data-brand="tommy" style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:6px 14px;border:1px solid #E5E5E3;border-radius:999px;background:#fff;color:#888;cursor:pointer;white-space:nowrap;">Tommy Hilfiger</button>
        <button class="brand-btn" data-brand="calvin" style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:6px 14px;border:1px solid #E5E5E3;border-radius:999px;background:#fff;color:#888;cursor:pointer;white-space:nowrap;">Calvin Klein</button>
        <button class="brand-btn" data-brand="diesel" style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:6px 14px;border:1px solid #E5E5E3;border-radius:999px;background:#fff;color:#888;cursor:pointer;white-space:nowrap;">Diesel</button>
        <button class="brand-btn" data-brand="armani" style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:6px 14px;border:1px solid #E5E5E3;border-radius:999px;background:#fff;color:#888;cursor:pointer;white-space:nowrap;">Armani Exchange</button>
      </div>

    </div>
  </div>

  <!-- PRODUCT GRID -->
  <div class="products-grid">
${cards}
  </div>

  <!-- FOOTER -->
  <footer style="background:#111;padding:40px 32px;margin-top:1px;">
    <div style="max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
      <span style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#fff;letter-spacing:0.2em;">BAGARDA</span>
      <div style="display:flex;gap:24px;">
        <span style="font-family:'DM Sans',sans-serif;font-size:12px;color:#555;">Dostava 1–2 dana</span>
        <span style="font-family:'DM Sans',sans-serif;font-size:12px;color:#555;">Placanje pouzecem</span>
        <span style="font-family:'DM Sans',sans-serif;font-size:12px;color:#555;">Povrat 14 dana</span>
      </div>
      <span style="font-family:'DM Sans',sans-serif;font-size:11px;color:#444;">© 2025 Bagarda</span>
    </div>
  </footer>

  <script>
    let activeType = 'all';
    let activeBrand = 'all';

    function filterProducts() {
      document.querySelectorAll('.product-card').forEach(card => {
        const typeMatch = activeType === 'all' || card.dataset.type === activeType;
        const brandMatch = activeBrand === 'all' || card.dataset.brand === activeBrand;
        card.style.display = (typeMatch && brandMatch) ? 'block' : 'none';
      });
    }

    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => {
          b.style.borderBottom = '2px solid transparent';
          b.style.color = '#888';
        });
        btn.style.borderBottom = '2px solid #111';
        btn.style.color = '#111';
        activeType = btn.dataset.type;
        activeBrand = 'all';
        document.querySelectorAll('.brand-btn').forEach(b => {
          b.style.background = '#fff';
          b.style.color = '#888';
          b.style.borderColor = '#E5E5E3';
        });
        document.querySelector('.brand-btn[data-brand="all"]').style.background = '#111';
        document.querySelector('.brand-btn[data-brand="all"]').style.color = '#fff';
        document.querySelector('.brand-btn[data-brand="all"]').style.borderColor = '#111';
        filterProducts();
      });
    });

    document.querySelectorAll('.brand-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.brand-btn').forEach(b => {
          b.style.background = '#fff';
          b.style.color = '#888';
          b.style.borderColor = '#E5E5E3';
        });
        btn.style.background = '#111';
        btn.style.color = '#fff';
        btn.style.borderColor = '#111';
        activeBrand = btn.dataset.brand;
        filterProducts();
      });
    });
  </script>

</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(ANALYSIS_FILE)) {
    console.error(`❌  ${ANALYSIS_FILE} not found. Run: node analyze.js first.`);
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf8'));
  const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

  if (products.length === 0) {
    console.error('❌  analysis.json is empty.');
    process.exit(1);
  }

  console.log(`\n⚙️   Generating ${products.length} product page(s)...\n`);

  const generated = [];
  const slugCount = {};

  for (const product of products) {
    const { brand, color, type, name } = product;
    const price    = PRICE[type] || PRICE.majica;
    const brandFmt = titleCase(brand);
    const baseSlug = slugify(`${brand}-${color}-${type}`);

    // Handle duplicate slugs by appending -2, -3, etc.
    slugCount[baseSlug] = (slugCount[baseSlug] || 0) + 1;
    const slug    = slugCount[baseSlug] === 1 ? baseSlug : `${baseSlug}-${slugCount[baseSlug]}`;
    const outFile = path.join(OUTPUT_DIR, `${slug}.html`);

    const html = generatePage(product, template);
    fs.writeFileSync(outFile, html, 'utf8');

    generated.push({ ...product, slug, outFile, price });
    console.log(`  ✓  ${outFile}   (${brandFmt} — ${name} — ${capitalize(color)}, ${price.current})`);
  }

  // ─── Generate index.html ──────────────────────────────────────────────────

  const slugMap   = generated.map(r => r.slug);
  const indexHtml = generateIndex(products, slugMap);
  const indexFile = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(indexFile, indexHtml, 'utf8');
  console.log(`\n  ✓  ${indexFile}   (${products.length} cards)`);

  // ─── Summary table ────────────────────────────────────────────────────────

  const col = {
    file:  Math.max(8,  Math.max(...generated.map(r => r.outFile.replace('./', '').length))),
    brand: Math.max(14, Math.max(...generated.map(r => r.brand.length))),
    price: 10,
  };
  const pad = (s, l) => String(s).padEnd(l);
  const hr  = '─'.repeat(col.file + col.brand + col.price + 12);

  console.log('\n' + hr);
  console.log(`  ${pad('Stranica', col.file)}  ${pad('Brend', col.brand)}  ${pad('Cijena', col.price)}`);
  console.log(hr);
  for (const r of generated) {
    console.log(`  ${pad(r.outFile.replace('./', ''), col.file)}  ${pad(r.brand, col.brand)}  ${pad(r.price.current, col.price)}`);
  }
  console.log(hr);

  console.log(`\n✅  Generirano ${generated.length} stranica + index.html`);
  console.log('\n💡  Otvori index.html u browseru ili pokreni server:\n    npx serve . -p 3003\n');
}

main();

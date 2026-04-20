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
  const cards = products.map((p, i) => {
    const price    = PRICE[p.type] || PRICE.majica;
    const brandFmt = titleCase(p.brand);
    const colorCap = capitalize(p.color);
    const slug     = slugMap[i];
    const href     = `./${slug}.html`;
    const bKey     = brandKey(p.brand);

    return `    <div class="product-card" data-type="${p.type}" data-brand="${bKey}" onclick="window.location='${href}'">
      <div class="card-image-wrap">
        <img src="./images/${p.file}" alt="${brandFmt} ${p.name}" loading="lazy" />
        <div class="card-badge">−50%</div>
      </div>
      <div class="card-body">
        <div class="card-brand">${brandFmt}</div>
        <div class="card-name">${p.name} — ${colorCap}</div>
        <div class="card-price-row">
          <span class="card-price">${price.current}</span>
          <span class="card-old">${price.old}</span>
        </div>
        <div class="card-cta">Naruči →</div>
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
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@500;600;700&display=swap" rel="stylesheet" />

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
  fbq('init', '928764966432017');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=928764966432017&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAF8F5;
      --text: #1a1a18;
      --accent: #C9A96E;
      --border: #E5E0D8;
      --muted: #7a7670;
    }
    html { scroll-behavior: smooth; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      -webkit-font-smoothing: antialiased;
    }

    /* ─── HERO ─── */
    .hero {
      background: #1a1a18;
      text-align: center;
      padding: 64px 20px 52px;
    }
    .hero-eyebrow {
      font-family: 'Syne', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 20px;
    }
    .hero-title {
      font-family: 'Syne', sans-serif;
      font-size: clamp(34px, 5vw, 54px);
      font-weight: 700;
      line-height: 1.12;
      color: #ffffff;
      margin-bottom: 18px;
    }
    .hero-title span { color: var(--accent); }
    .hero-sub {
      font-size: 15px;
      font-weight: 300;
      color: #a09a94;
      max-width: 480px;
      margin: 0 auto 32px;
      line-height: 1.75;
    }
    .hero-btn {
      display: inline-block;
      background: var(--accent);
      color: #1a1a18;
      font-family: 'Syne', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 14px 36px;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .hero-btn:hover { opacity: 0.85; }

    /* ─── STATS BAR ─── */
    .stats-bar {
      background: #111110;
      display: flex;
      justify-content: center;
      gap: 0;
    }
    .stat-item {
      flex: 1;
      max-width: 240px;
      text-align: center;
      padding: 18px 20px;
      border-right: 1px solid #2a2a27;
    }
    .stat-item:last-child { border-right: none; }
    .stat-num {
      font-family: 'Syne', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--accent);
      line-height: 1;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 300;
      color: #6a6560;
      letter-spacing: 0.08em;
      margin-top: 4px;
    }

    /* ─── FILTER BAR ─── */
    .filter-bar {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 28px 20px 20px;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
    }
    .filter-btn {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 8px 20px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      border-radius: 40px;
      transition: background 0.18s, color 0.18s, border-color 0.18s;
    }
    .filter-btn:hover,
    .filter-btn.active {
      background: var(--text);
      color: #fff;
      border-color: var(--text);
    }

    /* ─── PRODUCTS GRID ─── */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: #e0dbd3;
    }

    /* ─── PRODUCT CARD ─── */
    .product-card {
      background: var(--bg);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      transition: background 0.18s;
    }
    .product-card:hover { background: #f5f2ed; }
    .card-image-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      background: #f0ede8;
      overflow: hidden;
    }
    .card-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      transition: transform 0.4s ease;
    }
    .product-card:hover .card-image-wrap img { transform: scale(1.04); }
    .card-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: #c0392b;
      color: #fff;
      font-family: 'Syne', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 4px 9px;
    }
    .card-body {
      padding: 16px 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex: 1;
    }
    .card-brand {
      font-family: 'Syne', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .card-name {
      font-family: 'Syne', sans-serif;
      font-size: 15px;
      font-weight: 600;
      line-height: 1.35;
      color: var(--text);
    }
    .card-price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 4px;
    }
    .card-price {
      font-family: 'Syne', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
    }
    .card-old {
      font-size: 13px;
      color: #bbb;
      text-decoration: line-through;
    }
    .card-cta {
      margin-top: auto;
      padding-top: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      transition: color 0.2s;
    }
    .product-card:hover .card-cta { color: var(--accent); }

    /* ─── FOOTER ─── */
    footer {
      background: #1a1a18;
      padding: 36px 20px;
      text-align: center;
    }
    .footer-logo {
      font-family: 'Syne', sans-serif;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 10px;
    }
    .footer-copy {
      font-size: 12px;
      color: #504c48;
      letter-spacing: 0.06em;
    }

    /* ─── RESPONSIVE ─── */
    @media (max-width: 900px) {
      .products-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 600px) {
      .products-grid { grid-template-columns: repeat(2, 1fr); }
      .stats-bar { flex-wrap: wrap; }
      .stat-item { border-right: none; border-bottom: 1px solid #2a2a27; min-width: 50%; }
      .hero-title { font-size: 32px; }
    }
  </style>
</head>
<body>

  <!-- ─── HERO ─── -->
  <div class="hero">
    <div class="hero-eyebrow">Bagarda Boutique</div>
    <h1 class="hero-title">Premium brendovi<br><span>po outlet cijenama</span></h1>
    <p class="hero-sub">Tommy Hilfiger, Calvin Klein, Diesel, Armani Exchange — isporuka širom BiH za 1–2 radna dana.</p>
    <a class="hero-btn" href="#proizvodi">Pogledaj kolekciju</a>
  </div>

  <!-- ─── STATS BAR ─── -->
  <div class="stats-bar">
    <div class="stat-item">
      <div class="stat-num">247+</div>
      <div class="stat-label">zadovoljnih kupaca</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">4.9/5</div>
      <div class="stat-label">prosječna ocjena</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">1–2</div>
      <div class="stat-label">dana dostava u BiH</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">−50%</div>
      <div class="stat-label">popust na sve artikle</div>
    </div>
  </div>

  <!-- ─── FILTER BAR ─── -->
  <div class="filter-bar">
    <button class="filter-btn active" data-filter="all">Sve</button>
    <button class="filter-btn" data-filter="polo">Polo majice</button>
    <button class="filter-btn" data-filter="majica">T-Shirts</button>
    <button class="filter-btn" data-filter="tommy">Tommy Hilfiger</button>
    <button class="filter-btn" data-filter="calvin">Calvin Klein</button>
    <button class="filter-btn" data-filter="diesel">Diesel</button>
    <button class="filter-btn" data-filter="armani">Armani Exchange</button>
  </div>

  <!-- ─── PRODUCTS ─── -->
  <div id="proizvodi" class="products-grid">
${cards}
  </div>

  <!-- ─── FOOTER ─── -->
  <footer>
    <div class="footer-logo">Bagarda</div>
    <div class="footer-copy">&copy; 2025 Bagarda. Sva prava zadržana.</div>
  </footer>

  <script>
    (function () {
      var btns  = document.querySelectorAll('.filter-btn');
      var cards = document.querySelectorAll('.product-card');

      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');

          var filter = btn.dataset.filter;
          cards.forEach(function (card) {
            var show = filter === 'all'
              || card.dataset.type  === filter
              || card.dataset.brand === filter;
            card.style.display = show ? 'block' : 'none';
          });
        });
      });
    })();
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

// SEO server-side para páginas /produto/:slug da +QApostilas.
// Entrega ao Google title, description, canonical, Open Graph e Product/Offer
// já no HTML inicial. Depois o JavaScript normal do site assume a página.
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.maisqapostilas.com.br';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function strip(s = '') { return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function jsonSafe(obj) { return JSON.stringify(obj).replace(/</g, '\\u003c'); }
function money(v) { const n = Number(v); return Number.isFinite(n) ? n.toFixed(2) : '0.00'; }

async function getProduct(slug) {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY não configurados');
  const fields = 'id,titulo,slug,orgao,cargo,estado,cidade,descricao,capa_url,preco,preco_original,conteudo_programatico,ativo,updated_at';
  const url = `${base}/rest/v1/produtos?slug=eq.${encodeURIComponent(slug)}&ativo=eq.true&select=${fields}&limit=1`;
  const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  const rows = await r.json();
  return rows && rows[0] ? rows[0] : null;
}

module.exports = async (req, res) => {
  try {
    const slug = String(req.query.slug || '').trim();
    const indexPath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    if (!slug) return res.status(404).send(html);

    const p = await getProduct(slug);
    if (!p) {
      html = html.replace('<meta name="robots" id="meta-robots" content="index, follow, max-image-preview:large, max-snippet:-1">', '<meta name="robots" id="meta-robots" content="noindex, follow">');
      return res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
    }

    const canonical = `${SITE_URL}/produto/${encodeURIComponent(p.slug)}`;
    const title = `${strip(p.titulo)} | +QApostilas`;
    const fallback = [p.orgao, p.cargo, p.estado].filter(Boolean).join(' — ');
    const description = (strip(p.descricao) || `Apostila digital ${strip(p.titulo)}${fallback ? ` para ${fallback}` : ''}. Material para concursos públicos.`).slice(0, 158);
    const image = p.capa_url || DEFAULT_IMAGE;
    const price = money(p.preco);

    const schema = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: strip(p.titulo), description, image: [image],
      sku: String(p.id), brand: { '@type': 'Brand', name: '+QApostilas' },
      offers: { '@type': 'Offer', url: canonical, priceCurrency: 'BRL', price, availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition' },
      url: canonical
    };

    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
      .replace(/<meta name="description" id="meta-description"[^>]*>/i, `<meta name="description" id="meta-description" content="${esc(description)}">`)
      .replace(/<link rel="canonical" id="canonical-link"[^>]*>/i, `<link rel="canonical" id="canonical-link" href="${esc(canonical)}" />`)
      .replace(/<meta property="og:type" id="meta-og-type"[^>]*>/i, `<meta property="og:type" id="meta-og-type" content="product" />`)
      .replace(/<meta property="og:url" id="meta-og-url"[^>]*>/i, `<meta property="og:url" id="meta-og-url" content="${esc(canonical)}" />`)
      .replace(/<meta property="og:title" id="meta-og-title"[^>]*>/i, `<meta property="og:title" id="meta-og-title" content="${esc(title)}" />`)
      .replace(/<meta property="og:description" id="meta-og-description"[^>]*>/i, `<meta property="og:description" id="meta-og-description" content="${esc(description)}" />`)
      .replace(/<meta property="og:image" id="meta-og-image"[^>]*>/i, `<meta property="og:image" id="meta-og-image" content="${esc(image)}" />`)
      .replace(/<meta name="twitter:title" id="meta-twitter-title"[^>]*>/i, `<meta name="twitter:title" id="meta-twitter-title" content="${esc(title)}" />`)
      .replace(/<meta name="twitter:description" id="meta-twitter-description"[^>]*>/i, `<meta name="twitter:description" id="meta-twitter-description" content="${esc(description)}" />`)
      .replace(/<meta name="twitter:image" id="meta-twitter-image"[^>]*>/i, `<meta name="twitter:image" id="meta-twitter-image" content="${esc(image)}" />`)
      .replace('<script type="application/ld+json" id="dynamic-schema"></script>', `<script type="application/ld+json" id="dynamic-schema">${jsonSafe(schema)}</script>`);

    const serverBody = `<main id="mainContent">
      <section class="products-section" style="padding:40px 20px;">
        <div class="container">
          <article>
            <h1>${esc(strip(p.titulo))}</h1>
            <p>${esc(description)}</p>
            ${p.orgao ? `<p><strong>Órgão:</strong> ${esc(p.orgao)}</p>` : ''}
            ${p.cargo ? `<p><strong>Cargo:</strong> ${esc(p.cargo)}</p>` : ''}
            ${p.estado ? `<p><strong>Estado:</strong> ${esc(p.estado)}</p>` : ''}
            ${Number(p.preco) > 0 ? `<p><strong>Preço:</strong> R$ ${esc(price.replace('.', ','))}</p>` : ''}
            ${image ? `<img src="${esc(image)}" alt="${esc(strip(p.titulo))}" width="600" height="800" loading="eager">` : ''}
          </article>
        </div>
      </section>
    </main>`;
    html = html.replace(/<main id="mainContent">[\s\S]*?<\/main>/i, serverBody);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (e) {
    console.error('seo-product:', e);
    try {
      const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (_) {
      return res.status(500).send('Erro ao carregar a página.');
    }
  }
};

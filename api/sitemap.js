// Sitemap dinâmico da +QApostilas.
// Busca produtos e categorias ativos no Supabase e gera /sitemap.xml automaticamente.

const SITE_URL = 'https://www.maisqapostilas.com.br';

function xmlEscape(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(value) {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

async function supabaseGet(table, select, extra = '') {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!base || !key) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY não configurados');
  }

  const url = `${base}/rest/v1/${table}?select=${encodeURIComponent(select)}${extra}`;
  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table}: ${response.status}`);
  }

  return response.json();
}

module.exports = async (req, res) => {
  try {
    const [produtos, categorias] = await Promise.all([
      supabaseGet(
        'produtos',
        'slug,estado,updated_at,created_at',
        '&ativo=eq.true&slug=not.is.null&order=updated_at.desc'
      ),
      supabaseGet(
        'categorias',
        'slug,created_at',
        '&ativo=eq.true&slug=not.is.null&order=ordem.asc'
      )
    ]);

    const urls = [];
    const seen = new Set();

    function add(path, lastmod) {
      const cleanPath = path === '/' ? '/' : `/${String(path).replace(/^\/+|\/+$/g, '')}`;
      const loc = `${SITE_URL}${cleanPath}`;
      if (seen.has(loc)) return;
      seen.add(loc);
      urls.push({ loc, lastmod: isoDate(lastmod) });
    }

    // Páginas institucionais/públicas.
    add('/');
    add('/sobre');
    add('/contato');
    add('/lancamentos');
    add('/mais-vendidas');
    add('/destaques');
    add('/pre-venda');
    add('/politica-de-privacidade');
    add('/termos-de-uso');

    // Categorias ativas.
    for (const categoria of categorias || []) {
      if (categoria.slug) add(`/categoria/${categoria.slug}`, categoria.created_at);
    }

    // Estados que realmente possuem produtos ativos.
    const estados = new Set();
    for (const produto of produtos || []) {
      if (produto.estado) {
        const uf = String(produto.estado).trim().toUpperCase();
        if (/^[A-Z]{2}$/.test(uf)) estados.add(uf);
      }
    }
    for (const uf of estados) add(`/estado/${uf}`);

    // Todos os produtos ativos.
    for (const produto of produtos || []) {
      if (produto.slug) {
        add(`/produto/${produto.slug}`, produto.updated_at || produto.created_at);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(item => `  <url>
    <loc>${xmlEscape(item.loc)}</loc>
    <lastmod>${item.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('sitemap:', error);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).send(
      `<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporariamente indisponível.</error>`
    );
  }
};

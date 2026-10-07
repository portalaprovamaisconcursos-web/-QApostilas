// Feed automático do Google Merchant Center — +QApostilas
// Gera /google-merchant.xml com todos os produtos ativos do Supabase.
// Destino: listagens gratuitas. Os produtos da loja são materiais digitais.

const SITE_URL = 'https://www.maisqapostilas.com.br';

function xmlEscape(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n.toFixed(2) : null;
}

async function getProdutos() {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!base || !key) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY não configurados');
  }

  const fields = [
    'id','titulo','slug','orgao','cargo','estado','cidade','descricao',
    'capa_url','paginas','preco','preco_original','conteudo_programatico',
    'tipo_editorial','codigo','ativo','updated_at'
  ].join(',');

  const url =
    `${base}/rest/v1/produtos?select=${encodeURIComponent(fields)}` +
    `&ativo=eq.true&slug=not.is.null&preco=gt.0&order=updated_at.desc`;

  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase produtos: ${response.status}`);
  }

  return response.json();
}

module.exports = async (req, res) => {
  try {
    const produtos = await getProdutos();

    const items = (produtos || [])
      .filter(p => p.slug && p.titulo && p.capa_url && money(p.preco))
      .map(p => {
        const link = `${SITE_URL}/produto/${encodeURIComponent(p.slug)}`;
        const titulo = cleanText(p.titulo).slice(0, 150);

        const fallback = [
          p.orgao ? `Órgão: ${cleanText(p.orgao)}.` : '',
          p.cargo ? `Cargo: ${cleanText(p.cargo)}.` : '',
          p.estado ? `Estado: ${cleanText(p.estado)}.` : '',
          p.paginas ? `${p.paginas} páginas.` : '',
          'Material digital em PDF para preparação de concursos públicos.'
        ].filter(Boolean).join(' ');

        const descricao = (cleanText(p.descricao) || fallback).slice(0, 5000);
        const preco = money(p.preco);

        // Produtos editoriais/digitais normalmente não possuem GTIN.
        // identifier_exists=no evita inventar EAN/ISBN/GTIN.
        return `  <item>
    <g:id>${xmlEscape(p.codigo || `QA-${p.id}`)}</g:id>
    <g:title>${xmlEscape(titulo)}</g:title>
    <g:description>${xmlEscape(descricao)}</g:description>
    <g:link>${xmlEscape(link)}</g:link>
    <g:image_link>${xmlEscape(p.capa_url)}</g:image_link>
    <g:availability>in_stock</g:availability>
    <g:price>${xmlEscape(preco)} BRL</g:price>
    <g:condition>new</g:condition>
    <g:brand>+QApostilas</g:brand>
    <g:identifier_exists>no</g:identifier_exists>
    <g:product_type>${xmlEscape(
      p.tipo_editorial === 'caderno_questoes'
        ? 'Livros e apostilas > Cadernos de questões'
        : 'Livros e apostilas > Concursos públicos'
    )}</g:product_type>
    <g:included_destination>Free_listings</g:included_destination>
  </item>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>+QApostilas — Produtos</title>
  <link>${SITE_URL}</link>
  <description>Apostilas e cadernos de questões digitais para concursos públicos.</description>
${items}
</channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('google-merchant:', error);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).send(
      '<?xml version="1.0" encoding="UTF-8"?><error>Feed temporariamente indisponível.</error>'
    );
  }
};

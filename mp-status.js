// ============================================================================
// api/mp-status.js — Consulta o Mercado Pago e atualiza o pedido (v1.0)
// Usado pelo botão "Verificar pagamento" do painel. Serve para o caso em que o
// webhook não chegou (URL não configurada no painel MP, site em outro domínio,
// teste local etc.): você pergunta ao MP "este pedido foi pago?" e ele responde.
//
// CAMINHO NO REPOSITÓRIO:  api/mp-status.js
// VARIÁVEIS DE AMBIENTE: MP_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY
// ============================================================================
const MP_API = 'https://api.mercadopago.com';

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

async function supabase(path, options = {}) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    apikey: process.env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const r = await fetch(url, { ...options, headers });
  const text = await r.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

async function createSignedPdfUrl(storagePath) {
  if (!storagePath) return null;
  const url = `${process.env.SUPABASE_URL}/storage/v1/object/sign/apostilas-pdf/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ expiresIn: 60 * 60 * 24 })
  });
  const data = await r.json();
  if (!r.ok || !data.signedURL) return null;
  return process.env.SUPABASE_URL + data.signedURL;
}

function mapearStatus(mpStatus) {
  switch (String(mpStatus || '')) {
    case 'approved': return 'pagamento_confirmado';
    case 'authorized':
    case 'in_process': return 'em_analise';
    case 'pending': return 'aguardando_pagamento';
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back': return 'cancelado';
    default: return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido. Use POST.' });
  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) return json(res, 500, { error: 'MP_ACCESS_TOKEN não configurado na Vercel.' });
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return json(res, 500, { error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY não configurados na Vercel.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const pedidoId = body.pedido_id;
    if (!pedidoId) return json(res, 400, { error: 'Informe pedido_id.' });

    const rows = await supabase(`pedidos?id=eq.${encodeURIComponent(pedidoId)}&select=*`);
    const pedido = Array.isArray(rows) ? rows[0] : null;
    if (!pedido) return json(res, 404, { error: 'Pedido não encontrado.' });

    // Procura o pagamento deste pedido pelo external_reference
    const buscaRes = await fetch(
      `${MP_API}/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(pedidoId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const busca = await buscaRes.json();
    if (!buscaRes.ok) return json(res, 502, { error: 'Mercado Pago recusou a consulta.', detail: busca });

    const pagamentos = (busca && busca.results) || [];
    if (!pagamentos.length) {
      return json(res, 200, { ok: true, encontrado: false, pedido_id: pedido.id });
    }

    const pagamento = pagamentos.find(p => p.status === 'approved') || pagamentos[0];
    const novoStatus = mapearStatus(pagamento.status);

    const patch = {
      mp_payment_id: String(pagamento.id),
      parcelas: pagamento.installments || 1,
      forma_pagamento:
        pagamento.payment_type_id === 'credit_card' ? 'credito' :
        pagamento.payment_type_id === 'debit_card' ? 'debito' :
        pagamento.payment_type_id === 'bank_transfer' ? 'pix' : 'externo',
      updated_at: new Date().toISOString()
    };
    if (novoStatus && pedido.status !== 'entregue' && pedido.status !== 'entregue_transportadora') patch.status = novoStatus;
    if (pagamento.status === 'approved') {
      patch.pago_em = pagamento.date_approved ? new Date(pagamento.date_approved).toISOString() : new Date().toISOString();
    }

    if (pagamento.status === 'approved' && pedido.produto_id) {
      try {
        const prodRes = await supabase(`produtos?id=eq.${encodeURIComponent(pedido.produto_id)}&select=pdf_storage_path`);
        const produto = Array.isArray(prodRes) && prodRes[0];
        if (produto && produto.pdf_storage_path) {
          const signed = await createSignedPdfUrl(produto.pdf_storage_path);
          if (signed) {
            patch.pdf_signed_url = signed;
            patch.pdf_signed_url_expira_em = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          }
        }
      } catch (e) {
        console.warn('Falha ao gerar PDF signed URL:', e.message || e);
      }
    }

    await supabase(`pedidos?id=eq.${pedido.id}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch)
    });

    return json(res, 200, {
      ok: true,
      encontrado: true,
      pedido_id: pedido.id,
      pedido_codigo: pedido.codigo || null,
      mp_payment_id: String(pagamento.id),
      status_mp: pagamento.status,
      status_pedido: patch.status,
      valor_pago: pagamento.transaction_amount || null,
      pdf_liberado: Boolean(patch.pdf_signed_url)
    });
  } catch (e) {
    console.error('Erro em /api/mp-status:', e);
    return json(res, 500, { error: String((e && e.message) || e) });
  }
};

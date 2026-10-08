// ============================================================================
// api/mp-webhook.js — Recebe notificações do MP e libera o PDF (v3.2)
// URL a cadastrar no painel Mercado Pago (Suas integrações -> Webhooks):
//   https://www.maisqapostilas.com.br/api/mp-webhook    (evento: pagamentos)
//
// CAMINHO NO REPOSITÓRIO:  api/mp-webhook.js
// VARIÁVEIS: MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET (assinatura secreta), 
//            SUPABASE_URL, SUPABASE_SERVICE_KEY
// ============================================================================
const crypto = require('crypto');
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

// Cria signed URL do PDF no bucket PRIVADO 'apostilas-pdf' (válida 24h)
async function createSignedPdfUrl(storagePath) {
  if (!storagePath) return null;
  const objRes = await supabase(`storage.objects?select=id,bucket_id,name&bucket_id=eq.apostilas-pdf&name=eq.${encodeURIComponent(storagePath)}&limit=1`);
  const obj = Array.isArray(objRes) && objRes[0];
  if (!obj) return null;
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

// v3.3 — e-mail de entrega (opcional). Usa a RESEND_API_KEY se ela existir;
// se nao existir, simplesmente nao envia e nada mais quebra.
async function enviarEmailEntrega({ para, nome, titulo, link }) {
  const key = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_FROM || 'entrega@maisqapostilas.com.br';
  if (!key || !para || !link) return false;
  try {
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
      <p>Olá, ${nome || ''}!</p>
      <p>Seu pagamento foi confirmado e sua apostila já está liberada.</p>
      <p><strong>${titulo || 'Apostila'}</strong></p>
      <p><a href="${link}" style="background:#16A34A;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block">Baixar meu PDF</a></p>
      <p style="font-size:12px;color:#666">Se o botão não funcionar, copie o link: ${link}</p>
      <p>Qualquer dúvida, responda este e-mail.<br>+QApostilas</p>
    </div>`;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: de, to: [para], subject: `Seu material +QApostilas — ${titulo || 'Apostila'}`, html })
    });
    if (!r.ok) console.warn('Resend recusou o envio:', r.status);
    return r.ok;
  } catch (e) {
    console.warn('Falha ao enviar e-mail de entrega:', e.message || e);
    return false;
  }
}

// Manifesto da assinatura: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
function assinaturaValida(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.error('MP_WEBHOOK_SECRET ausente: webhook bloqueado.');
    return false;
  }
  const xSig = req.headers['x-signature'] || '';
  const xReq = req.headers['x-request-id'] || '';
  if (!xSig) return false;
  const partes = {};
  String(xSig).split(',').forEach(p => { const [k, v] = p.split('='); if (k) partes[k.trim()] = String(v || '').trim(); });
  const ts = partes.ts; const v1 = partes.v1;
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${xReq};ts:${ts};`;
  const esperado = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(esperado, 'utf8'), Buffer.from(v1, 'utf8')); }
  catch (e) { return false; }
}

module.exports = async (req, res) => {
  try {
    // Teste rápido: abrir /api/mp-webhook no navegador responde que está no ar.
    if (req.method === 'GET' && !(req.query && (req.query.type || req.query.topic || req.query['data.id'] || req.query.id))) {
      return json(res, 200, { ok: true, endpoint: 'mp-webhook', versao: '3.2' });
    }

    const query = req.query || {};
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; } }
    body = body || {};

    const topic = query.type || query.topic || body.type || body.topic || '';
    const paymentId = (body.data && body.data.id) || query['data.id'] || query.id || null;
    const dataId = (body.data && body.data.id) || query['data.id'] || query.id || '';

    if (String(topic).toLowerCase().indexOf('payment') === -1) {
      return json(res, 200, { ignored: true, topic });
    }
    if (!paymentId) return json(res, 400, { error: 'Sem id de pagamento.' });

    if (!assinaturaValida(req, dataId)) {
      console.warn('Webhook rejeitado: assinatura inválida', dataId);
      return json(res, 401, { error: 'Assinatura inválida' });
    }

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) return json(res, 500, { error: 'MP_ACCESS_TOKEN não configurado.' });
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return json(res, 500, { error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY não configurados na Vercel.' });
    }

    const pRes = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pagamento = await pRes.json();
    if (!pRes.ok) return json(res, 502, { error: 'MP recusou consulta do pagamento.', detail: pagamento });

    const novoStatus = mapearStatus(pagamento.status);
    const pedidoId = pagamento.external_reference || (pagamento.metadata && pagamento.metadata.pedido_id) || null;

    let pedido = null;
    if (pedidoId) {
      const rows = await supabase(`pedidos?id=eq.${encodeURIComponent(pedidoId)}&select=*`);
      pedido = Array.isArray(rows) ? rows[0] : null;
    }
    if (!pedido && pagamento.order && pagamento.order.id) {
      const rows = await supabase(`pedidos?mp_preference_id=eq.${encodeURIComponent(pagamento.order.id)}&select=*`);
      pedido = Array.isArray(rows) ? rows[0] : null;
    }

    if (!pedido) return json(res, 200, { ignored: true, reason: 'pedido_nao_encontrado' });
    if (pagamento.status === 'approved' && (pagamento.currency_id !== 'BRL' || Math.abs(Number(pagamento.transaction_amount) - Number(pedido.total || pedido.valor)) > 0.009)) {
      console.error('Valor ou moeda divergente para pedido', pedido.id);
      return json(res, 409, { error: 'Pagamento divergente do pedido' });
    }
    const patch = {
      mp_payment_id: String(pagamento.id),
      forma_pagamento:
        pagamento.payment_type_id === 'credit_card' ? 'credito' :
        pagamento.payment_type_id === 'debit_card' ? 'debito' :
        pagamento.payment_type_id === 'bank_transfer' ? 'pix' :
        pagamento.payment_type_id === 'ticket' ? 'boleto' : 'externo',
      parcelas: pagamento.installments || 1,
      updated_at: new Date().toISOString()
    };
    // Não regride um pedido já entregue ao receber notificações repetidas.
    if (novoStatus && !(pedido && (pedido.status === 'entregue' || pedido.status === 'entregue_transportadora'))) {
      patch.status = novoStatus;
    }
    if (pagamento.status === 'approved') {
      patch.pago_em = pagamento.date_approved ? new Date(pagamento.date_approved).toISOString() : new Date().toISOString();
    }

    // >>>>>> libera o PDF quando aprovado <<<<<<
    if (pagamento.status === 'approved' && pedido && pedido.produto_id) {
      try {
        const prodRes = await supabase(`produtos?id=eq.${encodeURIComponent(pedido.produto_id)}&select=pdf_storage_path,download_url,titulo`);
        const produtoDetalhe = Array.isArray(prodRes) && prodRes[0];
        if (produtoDetalhe && produtoDetalhe.pdf_storage_path) {
          const signed = await createSignedPdfUrl(produtoDetalhe.pdf_storage_path);
          if (signed) {
            patch.pdf_signed_url = signed;
            patch.pdf_signed_url_expira_em = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          }
        }
      } catch (e) {
        console.warn('Falha ao gerar PDF signed URL:', e.message || e);
      }
    }

    // v3.3 — entrega automatica: e-mail com o link (so produtos do nosso site)
    let entregaLink = patch.pdf_signed_url || null;
    if (pagamento.status === 'approved' && pedido && pedido.origem !== 'parceiro' && !pedido.entrega_email_em) {
      try {
        if (!entregaLink && pedido.produto_id) {
          const pr = await supabase(`produtos?id=eq.${encodeURIComponent(pedido.produto_id)}&select=download_url,titulo`);
          const pd = Array.isArray(pr) && pr[0];
          if (pd && pd.download_url) entregaLink = pd.download_url;
        }
        if (entregaLink) {
          const enviado = await enviarEmailEntrega({
            para: pedido.cliente_email,
            nome: pedido.cliente_nome,
            titulo: pedido.produto_titulo,
            link: entregaLink
          });
          if (enviado) patch.entrega_email_em = new Date().toISOString();
        }
      } catch (e) {
        console.warn('Falha na entrega por e-mail:', e.message || e);
      }
    }

    if (pedido) {
      await supabase(`pedidos?id=eq.${pedido.id}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(patch)
      });
    }

    await supabase('mp_eventos', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        mp_id: String(pagamento.id),
        topic: String(topic || 'payment'),
        pedido_id: pedido ? pedido.id : null,
        status_mp: pagamento.status || null,
        payload: { payment: pagamento, notification: body }
      })
    }).catch((e) => console.warn('Falha ao gravar mp_eventos:', e.message));

    // Sempre 200: se devolver erro, o Mercado Pago fica reenviando a notificação.
    return json(res, 200, {
      ok: true,
      pedido_id: pedido ? pedido.id : null,
      status_mp: pagamento.status,
      status_pedido: patch.status || (pedido ? pedido.status : null),
      pdf_liberado: Boolean(patch.pdf_signed_url),
      link_entrega: entregaLink || null
    });
  } catch (e) {
    console.error('Erro em /api/mp-webhook:', e);
    return json(res, 500, { ok: false, error: 'Falha ao processar notificação' });
  }
};

// ============================================================================
// api/mp-checkout.js — Mercado Pago Checkout Pro (v3.2)
// Gera um LINK ÚNICO para cada pedido, o que permite controlar cada venda
// (pago / não pago, valor, liberação do PDF). Aceita Pix, crédito (até 6x) e
// débito. NÃO aceita boleto (excluded_payment_types: ticket).
//
// CAMINHO NO REPOSITÓRIO:  api/mp-checkout.js   (mesma pasta dos outros arquivos api/)
// VARIÁVEIS DE AMBIENTE (Vercel -> Settings -> Environment Variables):
//   MP_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY, SITE_URL
//   (SITE_URL = https://www.maisqapostilas.com.br)
// ============================================================================
const MP_API = 'https://api.mercadopago.com';

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
const onlyDigits = (v) => String(v || '').replace(/\D+/g, '');

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

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido. Use POST.' });
  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) return json(res, 500, { error: 'MP_ACCESS_TOKEN não configurado nas variáveis de ambiente da Vercel.' });
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return json(res, 500, { error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY não configurados na Vercel.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const pedidoId = body.pedido_id;
    if (!pedidoId) return json(res, 400, { error: 'Informe pedido_id.' });

    const rows = await supabase(`pedidos?id=eq.${encodeURIComponent(pedidoId)}&select=*`);
    const pedido = Array.isArray(rows) ? rows[0] : null;
    if (!pedido) return json(res, 404, { error: 'Pedido não encontrado.' });
    if (['pagamento_confirmado', 'entregue', 'entregue_transportadora', 'cancelado'].includes(pedido.status)) return json(res, 409, { error: 'Pedido não está disponível para checkout.' });

    const site = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/+$/, '');
    const parcelasMax = Math.max(1, Math.min(12, parseInt(body.parcelas_max || 6, 10) || 6));
    const forma = String(pedido.forma_pagamento || 'pix');
    const parcelasPedido = Math.max(1, Math.min(parcelasMax, parseInt(pedido.parcelas || 1, 10) || 1));

    const paymentMethods = {
      excluded_payment_types: [{ id: 'ticket' }],
      installments: parcelasMax,
      default_installments: forma === 'credito' ? parcelasPedido : 1
    };
    if (forma === 'pix') {
      paymentMethods.excluded_payment_types.push({ id: 'credit_card' }, { id: 'debit_card' });
    } else if (forma === 'credito') {
      paymentMethods.excluded_payment_types.push({ id: 'bank_transfer' }, { id: 'debit_card' });
    } else if (forma === 'debito') {
      paymentMethods.excluded_payment_types.push({ id: 'bank_transfer' }, { id: 'credit_card' });
      paymentMethods.installments = 1;
      paymentMethods.default_installments = 1;
    }

    const titulo = `${pedido.produto_titulo || 'Apostila +QApostilas'} — Versão Digital`;

    // CORREÇÃO: o valor cobrado tem de ser o TOTAL do pedido (já com o cupom
    // descontado). Antes era usado pedido.valor, o que cobrava a mais quando
    // havia cupom.
    const valorCobrar = Number(
      (pedido.total !== null && pedido.total !== undefined && Number(pedido.total) > 0)
        ? pedido.total
        : (pedido.valor || 0)
    );
    if (!valorCobrar || valorCobrar <= 0) {
      return json(res, 400, { error: 'Este pedido está com valor R$ 0,00. Confira o preço do produto antes de gerar o link.' });
    }

    const preference = {
      items: [{
        id: String(pedido.produto_id || pedido.id),
        title: titulo.slice(0, 250),
        description: `Pedido ${pedido.codigo || pedido.id}`,
        category_id: 'books',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: valorCobrar
      }],
      payer: {
        name: pedido.cliente_nome || undefined,
        email: pedido.cliente_email || undefined,
        identification: onlyDigits(pedido.cliente_cpf)
          ? { type: onlyDigits(pedido.cliente_cpf).length > 11 ? 'CNPJ' : 'CPF', number: onlyDigits(pedido.cliente_cpf) }
          : undefined
      },
      external_reference: String(pedido.id),
      statement_descriptor: 'QAPOSTILAS',
      notification_url: `${site}/api/mp-webhook`,
      back_urls: {
        success: `${site}/minha-conta?pedido=${pedido.id}&status=success`,
        pending: `${site}/minha-conta?pedido=${pedido.id}&status=pending`,
        failure: `${site}/minha-conta?pedido=${pedido.id}&status=failure`
      },
      auto_return: 'approved',
      payment_methods: paymentMethods,
      metadata: { pedido_id: pedido.id, codigo: pedido.codigo || null, origem: 'site' }
    };

    const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `qapostilas-${pedido.id}-${Date.now()}`
      },
      body: JSON.stringify(preference)
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) return json(res, 502, { error: 'Mercado Pago recusou a preferência.', detail: mpData });

    await supabase(`pedidos?id=eq.${pedido.id}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        mp_preference_id: mpData.id,
        status: (pedido.status === 'cancelado' ? pedido.status : 'aguardando_pagamento'),
        updated_at: new Date().toISOString()
      })
    });

    return json(res, 200, {
      ok: true,
      pedido_id: pedido.id,
      pedido_codigo: pedido.codigo || null,
      valor: valorCobrar,
      preference_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point
    });
  } catch (e) {
    console.error('Erro em /api/mp-checkout:', e);
    return json(res, 500, { error: String((e && e.message) || e) });
  }
};

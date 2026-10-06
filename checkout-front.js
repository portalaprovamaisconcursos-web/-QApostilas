/* =========================================================================
   +QApostilas — checkout-front.js
   Substitui o uso de Edge Functions do Supabase pelo /api/* do Vercel.
   Carregue DEPOIS de supabase-config.js e do v2_features.js.

   O QUE MUDA:
     1) O pagamento vai pelo Vercel (api/checkout), não pelo Supabase
        Edge Function (que dava erro de Edge Function no painel).
     2) Não há mais "Webhook reddish-task" — o pagamento é confirmado
        via /api/checkout-status (poll) + /api/webhook (notificação MP).
     3) Suporta cartão de crédito PARCELADO (atributo installments
        máximo do painel = mercadopago_parcelas), cartão de débito,
        Pix e boleto.
     4) O botão de compra mostra o preço certo abaixo, sem "sticky"
        — a caixa de compra agora fica embaixo do conteúdo em telas
        pequenas e ao LADO em telas grandes (não rola mais junto).
   ========================================================================= */

(function () {
  'use strict';

  const SUPABASE = () => (typeof supabaseClient !== 'undefined' && supabaseClient) || null;

  function maxParcelas() {
    try {
      const cfg = (window.appState && window.appState.config) || {};
      return Math.max(1, Math.min(24, parseInt(cfg.mercadopago_parcelas, 10) || 12));
    } catch (e) { return 12; }
  }

  function moeda(v) {
    return Number(v || 0).toFixed(2).replace('.', ',');
  }

  function show(msg, tipo) {
    if (typeof showAlert === 'function') showAlert(msg, tipo || 'info');
    else console.log('[checkout]', msg);
  }

  function gerarNumeroPedidoLocal() {
    const a = new Date();
    const yyyymm = a.getFullYear().toString() + String(a.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return 'MQA-' + yyyymm + '-' + rand;
  }

  function gerarCodigoAcessoLocal() {
    return 'MQA-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  /* ==================== 1) BOTÃO "COMPRAR" -> abre modal ==================== */
  function ensureCheckoutModal() {
    if (document.getElementById('checkoutModal')) return;
    const div = document.createElement('div');
    div.className = 'modal';
    div.id = 'checkoutModal';
    div.innerHTML = ''
      + '<div class="modal-content v2-modal">'
      +   '<div class="modal-header">'
      +     '<h2><i class="fas fa-cart-shopping"></i> Finalizar compra</h2>'
      +     '<button class="modal-close" onclick="document.getElementById(\'checkoutModal\').classList.remove(\'active\')">&times;</button>'
      +   '</div>'
      +   '<div class="modal-body" id="checkoutModalBody"></div>'
      + '</div>';
    document.body.appendChild(div);
  }

  async function openCheckout(produtoId) {
    ensureCheckoutModal();
    const produto = (window.appState && (window.appState.allProdutos || window.appState.produtos || []) || [])
      .find(p => String(p.id) === String(produtoId));
    if (!produto) { show('Produto não encontrado.', 'error'); return; }

    const oferta = (typeof getCurrentProductOffer === 'function')
      ? getCurrentProductOffer(produto)
      : { price: produto.preco, value: 'digital', label: 'Digital (PDF)', badge: 'Digital' };

    document.getElementById('checkoutModalBody').innerHTML = ''
      + '<div class="v4-etapa"><span class="on">1. Seus dados</span><span>2. Pagamento</span><span>3. Acesso</span></div>'
      + '<form id="formCheckout" onsubmit="window.__checkout.submit(event)">'
      +   '<input type="hidden" name="produto_id" value="' + produto.id + '">'
      +   '<input type="hidden" name="formato" value="' + (oferta.value || 'digital') + '">'
      +   '<div class="v2-resumo-compra"><strong>' + (produto.titulo || '') + '</strong>'
      +     '<span>' + (oferta.label || oferta.badge || 'Digital') + '</span>'
      +     '<div class="v2-resumo-valor">R$ ' + moeda(oferta.price) + '</div>'
      +   '</div>'
      +   '<div class="form-group"><label>Nome completo *</label><input type="text" name="cliente_nome" required></div>'
      +   '<div class="form-row">'
      +     '<div class="form-group"><label>E-mail (recebe a apostila) *</label><input type="email" name="cliente_email" required></div>'
      +     '<div class="form-group"><label>WhatsApp / Telefone *</label><input type="text" name="cliente_telefone" required></div>'
      +   '</div>'
      +   '<div class="form-row">'
      +     '<div class="form-group"><label>CPF (obrigatório para Pix e boleto) *</label><input type="text" name="cliente_cpf" required placeholder="000.000.000-00"></div>'
      +     '<div class="form-group"><label>CEP (para boleto)</label><input type="text" name="cliente_cep" placeholder="00000-000"></div>'
      +   '</div>'
      +   '<div class="form-group"><label>Forma de pagamento *</label><div class="v2-pag-opcoes">'
      +     '<label class="v2-pag-option selecionado"><input type="radio" name="metodo" value="cartao" checked>'
      +       '<span class="v2-pag-titulo"><i class="fas fa-credit-card"></i> Cartão de crédito</span>'
      +       '<span class="v2-pag-desc">Parcele em até ' + maxParcelas() + 'x sem juros</span></label>'
      +     '<label class="v2-pag-option"><input type="radio" name="metodo" value="debito">'
      +       '<span class="v2-pag-titulo"><i class="fas fa-credit-card"></i> Cartão de débito</span>'
      +       '<span class="v2-pag-desc">À vista, aprovação na hora</span></label>'
      +     '<label class="v2-pag-option"><input type="radio" name="metodo" value="pix">'
      +       '<span class="v2-pag-titulo"><i class="fas fa-qrcode"></i> Pix</span>'
      +       '<span class="v2-pag-desc">QR Code, aprovação imediata</span></label>'
      +     '<label class="v2-pag-option"><input type="radio" name="metodo" value="boleto">'
      +       '<span class="v2-pag-titulo"><i class="fas fa-barcode"></i> Boleto</span>'
      +       '<span class="v2-pag-desc">Vencimento em 1 dia útil</span></label>'
      +   '</div></div>'
      +   '<div class="v4-trust">'
      +     '<div><i class="fas fa-bolt"></i>Liberação imediata</div>'
      +     '<div><i class="fas fa-shield-halved"></i>Ambiente protegido</div>'
      +     '<div><i class="fas fa-headset"></i>Suporte por WhatsApp</div>'
      +   '</div>'
      +   '<button type="submit" class="btn btn-success" style="width:100%;padding:15px;margin-top:14px;">'
      +     '<i class="fas fa-lock"></i> Ir para o pagamento</button>'
      + '</form>'
      + '<div id="v4PagamentoArea" style="margin-top:16px;"></div>';

    // Reseta destaque em troca de método
    document.querySelectorAll('#formCheckout .v2-pag-option').forEach(function (el) {
      el.addEventListener('click', function () {
        document.querySelectorAll('#formCheckout .v2-pag-option').forEach(function (x) { x.classList.remove('selecionado'); });
        el.classList.add('selecionado');
      });
    });

    // Preenche se já tem cliente logado
    try {
      const emailSess = sessionStorage.getItem('cliente_email');
      const nomeSess = sessionStorage.getItem('cliente_nome');
      if (emailSess) document.querySelector('#formCheckout [name=cliente_email]').value = emailSess;
      if (nomeSess) document.querySelector('#formCheckout [name=cliente_nome]').value = nomeSess;
    } catch (_) {}

    window.__checkoutProduto = produto;
    window.__checkoutOferta = oferta;
    document.getElementById('checkoutModal').classList.add('active');
  }

  /* ==================== 2) SUBMIT -> POST /api/checkout ==================== */
  async function submit(ev) {
    ev.preventDefault();
    const form = ev.target;
    const btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando…'; }

    const metodo = (form.querySelector('input[name=metodo]:checked') || {}).value || 'cartao';
    const cliente = {
      nome: form.cliente_nome.value.trim(),
      email: form.cliente_email.value.trim().toLowerCase(),
      telefone: form.cliente_telefone.value.trim(),
      cpf: form.cliente_cpf.value.trim(),
      cep: form.cliente_cep ? form.cliente_cep.value.trim() : ''
    };
    const produto = window.__checkoutProduto;
    const oferta = window.__checkoutOferta;

    // Salva cliente na sessão para preencher o form nas próximas compras
    sessionStorage.setItem('cliente_email', cliente.email);
    sessionStorage.setItem('cliente_nome', cliente.nome);

    // 1) Garante que o cliente está cadastrado (cadastro silencioso).
    if (SUPABASE() && cliente.nome && cliente.email) {
      try {
        await supabaseClient.from('clientes').insert([{
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone || null,
          cpf: cliente.cpf || null
        }]);
      } catch (e) { /* duplicado? tudo bem */ }
    }

    try {
      // 2) POST /api/checkout (Vercel Function)
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_id: produto.id,
          formato: oferta.value || 'digital',
          cliente: cliente,
          metodo: metodo,
          parcelas: 1,
          max_parcelas: maxParcelas(),
          numero_pedido: gerarNumeroPedidoLocal()
        })
      });
      const data = await r.json();

      if (!r.ok || data.erro) {
        show('Não foi possível iniciar o pagamento: ' + (data.erro || ('HTTP ' + r.status)), 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Tentar de novo'; }
        return;
      }

      // 3) Mostra resultado + redireciona para o Mercado Pago.
      const numero = data.numero_pedido;
      const codigo = data.codigo_acesso;

      let html = '<div class="v4-msg ok">'
        + '<i class="fas fa-circle-check"></i> Pedido <strong>' + numero + '</strong> registrado. '
        + 'Código de acesso: <strong>' + codigo + '</strong></div>'
        + '<p style="text-align:center;color:var(--text-muted);">Você será redirecionado para o Mercado Pago em 3 segundos. Se o seu navegador bloquear o redirecionamento, use o botão abaixo.</p>'
        + '<div style="text-align:center;margin-top:14px;">'
        +   '<a class="btn btn-primary" id="v4IrParaMP" href="' + data.init_point + '" target="_blank" rel="noopener">'
        +     '<i class="fas fa-external-link-alt"></i> Abrir Mercado Pago agora'
        +   '</a>'
        + '</div>'
        + '<div id="v4StatusBox" style="margin-top:14px;"></div>';

      document.getElementById('v4PagamentoArea').innerHTML = html;
      document.getElementById('v4PagamentoArea').scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Redireciona automaticamente após 3s
      setTimeout(function () {
        try { window.open(data.init_point, '_blank', 'noopener'); } catch (e) {}
      }, 3000);

      // 4) Inicia o polling de status (Pix e cartão)
      iniciarPolling(numero);
    } catch (err) {
      console.error(err);
      show('Falha ao enviar o pedido: ' + (err.message || err), 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Tentar de novo'; }
    }
  }

  /* ==================== 3) POLLING DE STATUS ==================== */
  function iniciarPolling(numero) {
    let tentativas = 0;
    const max = 30;
    const box = document.getElementById('v4StatusBox');
    if (box) box.innerHTML = '<div class="v4-msg aviso"><i class="fas fa-spinner fa-spin"></i> Aguardando confirmação do Mercado Pago…</div>';

    const timer = setInterval(async function () {
      tentativas++;
      try {
        const r = await fetch('/api/checkout-status?numero=' + encodeURIComponent(numero));
        const data = await r.json();
        if (!box) return;
        if (!data.encontrado) {
          box.innerHTML = '<div class="v4-msg aviso">Aguardando o Mercado Pago confirmar… (' + tentativas + '/' + max + ')</div>';
        } else if (data.status === 'pago') {
          box.innerHTML = '<div class="v4-msg ok"><i class="fas fa-circle-check"></i> Pagamento confirmado! Abra "Minha conta › Meus pedidos" para baixar a apostila.</div>';
          clearInterval(timer);
        } else {
          box.innerHTML = '<div class="v4-msg aviso">Status atual: <strong>' + data.status + '</strong>. Continuando… (' + tentativas + '/' + max + ')</div>';
        }
      } catch (e) {
        if (box) box.innerHTML = '<div class="v4-msg aviso">Continuando a checagem… (' + tentativas + '/' + max + ')</div>';
      }
      if (tentativas >= max) clearInterval(timer);
    }, 4000);
  }

  /* ==================== 4) OVERRIDES ==================== */
  function aplicar() {
    // Substitui o openCheckoutModal antigo
    window.openCheckoutModal = openCheckout;

    // CSS para os métodos de pagamento
    if (!document.getElementById('checkout-v5-css')) {
      const st = document.createElement('style');
      st.id = 'checkout-v5-css';
      st.textContent = [
        '.v2-pag-opcoes{display:flex;flex-direction:column;gap:8px;}',
        '.v2-pag-option{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:border-color .2s;}',
        '.v2-pag-option:hover{border-color:var(--primary);}',
        '.v2-pag-option.selecionado{border-color:var(--primary);background:var(--primary-light);}',
        '.v2-pag-option input{margin-right:8px;accent-color:var(--primary);}',
        '.v2-pag-titulo{font-weight:700;font-size:14px;color:var(--text);}',
        '.v2-pag-desc{font-size:12.5px;color:var(--text-muted);}',
        '.v2-resumo-compra{background:#f8fafc;border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:16px;}',
        '.v2-resumo-compra strong{display:block;font-size:15px;margin-bottom:4px;}',
        '.v2-resumo-compra span{font-size:13px;color:var(--text-muted);}',
        '.v2-resumo-valor{font-size:22px;font-weight:800;color:var(--primary);margin-top:6px;}',
        '.v4-trust{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}',
        '.v4-trust div{border:1px solid var(--border);border-radius:12px;padding:10px 8px;text-align:center;font-size:11.5px;color:var(--text-muted);background:#fbfdff;}',
        '.v4-trust i{display:block;font-size:16px;color:var(--primary);margin-bottom:5px;}',
        '.v4-msg{border-radius:12px;padding:12px;font-size:13.5px;margin-top:12px;line-height:1.5;}',
        '.v4-msg.ok{background:#f0fdf4;border:1px solid #86efac;color:#166534;}',
        '.v4-msg.erro{background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;}',
        '.v4-msg.aviso{background:#fffbeb;border:1px solid #fcd34d;color:#92400e;}',
        '@media (max-width:640px){.v4-trust{grid-template-columns:1fr;}}'
      ].join('');
      document.head.appendChild(st);
    }
  }

  window.__checkout = { submit: submit };

  function iniciar() { try { aplicar(); } catch (e) { console.warn('[checkout-front]', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
  setTimeout(iniciar, 1200);
})();

/* =====================================================================
   +QApostilas — PATCH v4 (parte 2): PÁGINA DO PRODUTO + CHECKOUT COMPLETO
   Carregue DEPOIS do v2_features.js e do v4a.js.
   ===================================================================== */
(function () {
  'use strict';

  function sb() { try { return (typeof supabaseClient !== 'undefined') ? supabaseClient : null; } catch (e) { return null; } }
  function aviso(m, t) { if (typeof showAlert === 'function') showAlert(m, t || 'info'); else console.log('[v4]', m); }
  function esc(v) {
    if (typeof escapeHtml === 'function') return escapeHtml(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function moeda(v) { return (typeof formatPrice === 'function') ? formatPrice(v) : Number(v || 0).toFixed(2).replace('.', ','); }
  function cfg(k, d) { try { return (appState.config && appState.config[k]) || d; } catch (e) { return d; } }
  function maxParcelas() { return Math.max(1, Math.min(24, parseInt(cfg('mercadopago_parcelas', 12), 10) || 12)); }

  /* ==================== 1) PÁGINA DO PRODUTO ==================== */
  function montarPaginaProduto(produto) {
    var stars = (typeof renderStars === 'function') ? renderStars(produto.avaliacao_media || 5) : '';
    var rating = (typeof formatRatingValue === 'function') ? formatRatingValue(produto.avaliacao_media || 5) : '5.0';
    var cat1 = produto.categoria_id ? ((appState.categorias || []).find(function (c) { return c.id === produto.categoria_id; }) || {}).nome || '' : '';
    var cat2 = produto.categoria_id_2 ? ((appState.categorias || []).find(function (c) { return c.id === produto.categoria_id_2; }) || {}).nome || '' : '';
    var cat1slug = produto.categoria_id ? ((appState.categorias || []).find(function (c) { return c.id === produto.categoria_id; }) || {}).slug || '' : '';
    var formats = (typeof getProductFormats === 'function') ? getProductFormats(produto) : [];
    var oferta = (typeof getCurrentProductOffer === 'function') ? getCurrentProductOffer(produto) : { price: produto.preco, value: 'digital' };
    var imagem = (typeof getProductImageByFormat === 'function') ? getProductImageByFormat(produto) : (produto.capa_url || '');
    var entregas = formats.length > 1 ? 'Escolha digital ou impressa' : 'Liberação imediata após o pagamento';
    var conteudo = produto.atualizado_edital ? 'Atualizado conforme o último edital' : 'Organizado por matérias do edital';

    var resumo = [
      produto.orgao ? { l: 'Órgão', v: produto.orgao } : null,
      produto.cargo ? { l: 'Cargo', v: produto.cargo } : null,
      produto.estado ? { l: 'Localização', v: produto.estado + (produto.cidade ? ' - ' + produto.cidade : '') } : null,
      produto.paginas ? { l: 'Páginas', v: produto.paginas } : null,
      produto.nivel ? { l: 'Nível', v: produto.nivel } : null
    ].filter(Boolean);

    var conteudoSec = (typeof parseProductContentSections === 'function') ? parseProductContentSections(produto.conteudo_programatico) : { regular: [], bonus: [] };
    var descricao = (typeof renderDescriptionContent === 'function') ? renderDescriptionContent(produto.descricao) : (produto.descricao || '');

    return '' +
      '<section class="products-section" style="padding:48px 20px 28px;">' +
        '<div class="container">' +
          '<div class="v4-migalha">' +
            '<a href="/" onclick="event.preventDefault(); navigateTo(\'home\');"><i class="fas fa-house"></i> Início</a> <span>›</span>' +
            (cat1 ? '<a href="#" onclick="event.preventDefault(); navigateTo(\'categoria\',\'' + esc(cat1slug) + '\');">' + esc(cat1) + '</a> <span>›</span>' : '') +
            '<span>' + esc(produto.titulo) + '</span>' +
          '</div>' +
          '<div class="product-detail" style="background:var(--white);padding:24px;border-radius:20px;box-shadow:var(--shadow-md);">' +
            '<div class="product-detail-media">' +
              '<div class="product-cover-shell">' +
                (produto.atualizado_edital ? '<span class="v4-capa-selo"><i class="fas fa-check"></i> ATUALIZADO</span>' : '') +
                '<img id="productDetailImage_' + produto.id + '" src="' + esc(imagem) + '" alt="' + esc(produto.titulo) + '" class="product-detail-image" onerror="this.onerror=null;this.src=getCoverPlaceholder();">' +
              '</div>' +
            '</div>' +
            '<div class="product-detail-info">' +
              '<span class="product-category">' + esc(cat1) + (cat2 ? ' • ' + esc(cat2) : '') + '</span>' +
              '<h1 class="product-detail-title">' + esc(produto.titulo) + '</h1>' +
              '<div class="product-rating-inline"><div class="stars">' + stars + '</div><span><strong>' + rating + '</strong></span></div>' +
              (produto.codigo ? '<div class="product-sku">Código: ' + esc(produto.codigo) + '</div>' : '') +
              '<div class="product-detail-badges">' +
                (produto.atualizado_edital ? '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Atualizado conforme último edital</span>' : '') +
                ((typeof getProductAvailabilityBadge === 'function') ? getProductAvailabilityBadge(produto) : '') +
                (produto.pre_venda ? '<span class="badge badge-warning"><i class="fas fa-clock"></i> Em pré-venda</span>' : '') +
              '</div>' +
              '<div class="product-benefits">' +
                '<div class="product-benefit-item"><i class="fas fa-bolt"></i><span class="product-benefit-title">Entrega</span><span class="product-benefit-text">' + esc(entregas) + '</span></div>' +
                '<div class="product-benefit-item"><i class="fas fa-book-open"></i><span class="product-benefit-title">Conteúdo</span><span class="product-benefit-text">' + esc(conteudo) + '</span></div>' +
                '<div class="product-benefit-item"><i class="fas fa-shield-alt"></i><span class="product-benefit-title">Segurança</span><span class="product-benefit-text">Compra em ambiente protegido</span></div>' +
              '</div>' +
              (resumo.length ? '<div class="product-summary-grid">' + resumo.map(function (i) {
                return '<div class="product-summary-item"><span class="product-summary-label">' + esc(i.l) + '</span><span class="product-summary-value">' + esc(i.v) + '</span></div>';
              }).join('') + '</div>' : '') +
            '</div>' +
            '<aside class="product-detail-sidebar"><div id="productPurchaseBox_' + produto.id + '">' + caixaDeCompra(produto, oferta, formats) + '</div></aside>' +
            '<div class="product-detail-sections">' +
              (descricao ? '<div class="product-info-section product-detail-section"><h2><i class="fas fa-align-left"></i> Descrição do concurso</h2>' + descricao + '</div>' : '') +
              ((conteudoSec.regular.length || conteudoSec.bonus.length) ?
                '<div class="content-programatico product-detail-section">' +
                  (conteudoSec.regular.length ? '<h2><i class="fas fa-list-check"></i> Conteúdo Programático</h2><ul>' + conteudoSec.regular.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul>' : '') +
                  (conteudoSec.bonus.length ? '<div class="product-bonus-box"><div class="product-bonus-title"><i class="fas fa-gift"></i> Bônus inclusos</div><ul class="bonus-list">' + conteudoSec.bonus.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul></div>' : '') +
                '</div>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      ((typeof renderRelatedProductsSection === 'function') ? renderRelatedProductsSection(produto) : '');
  }

  function caixaDeCompra(produto, oferta, formats) {
    var desconto = (typeof getDiscountPercentage === 'function') ? getDiscountPercentage(oferta.originalPrice, oferta.price) : 0;
    var parcela = (typeof getInstallmentText === 'function') ? getInstallmentText(oferta.price, oferta.installments) : '';
    var tipo = (typeof getVendaTipo === 'function') ? getVendaTipo(produto) : 'proprio';
    var meta = (typeof getVendaMeta === 'function') ? getVendaMeta(tipo) : { classe: 'btn-buy-proprio', label: 'Produto próprio' };
    var chips = (tipo === 'proprio') ? (
      '<div class="v4-pag-lista">' +
        '<span class="v4-pag-chip"><i class="fas fa-qrcode"></i> Pix com QR Code</span>' +
        '<span class="v4-pag-chip"><i class="fas fa-credit-card"></i> Crédito em até ' + maxParcelas() + 'x</span>' +
        '<span class="v4-pag-chip"><i class="fas fa-credit-card"></i> Débito</span>' +
        '<span class="v4-pag-chip"><i class="fas fa-barcode"></i> Boleto</span>' +
      '</div>') : '';

    return '' +
      '<div class="purchase-box">' +
        '<div class="purchase-box-price-top">' +
          (oferta.originalPrice ? '<span class="purchase-box-original">R$ ' + moeda(oferta.originalPrice) + '</span>' : '') +
          (desconto ? '<span class="discount-pill">' + desconto + '% OFF</span>' : '') +
        '</div>' +
        '<div class="purchase-box-current">R$ ' + moeda(oferta.price) + '</div>' +
        (parcela ? '<div class="purchase-box-installment">' + parcela + '</div>' : '') +
        (formats.length > 1 ?
          '<label class="purchase-box-label" for="format_selector_' + produto.id + '">Formato</label>' +
          '<select id="format_selector_' + produto.id + '" class="purchase-box-select" onchange="setProductFormat(\'' + esc(produto.slug) + '\', this.value)">' +
            formats.map(function (f) { return '<option value="' + esc(f.value) + '"' + (f.value === oferta.value ? ' selected' : '') + '>' + esc(f.label) + '</option>'; }).join('') +
          '</select>'
          : '<div class="purchase-box-label-static">' + esc(oferta.badge || 'Versão Digital (PDF)') + '</div>') +
        (tipo === 'parceiro' ? '<span class="v2-venda-selo v2-venda-selo-parceiro" style="background:' + meta.cor + ';"><i class="fas fa-store"></i> ' + meta.label + '</span>' : '') +
        chips +
        '<button type="button" class="btn ' + meta.classe + ' purchase-box-action" onclick="handleBuyClick(event, ' + produto.id + ')"><i class="fas fa-cart-shopping"></i> Comprar</button>' +
        '<p class="purchase-box-secure"><i class="fas fa-lock"></i> Compra segura</p>' +
        '<div class="v4-trust">' +
          '<div><i class="fas fa-bolt"></i>Liberação imediata</div>' +
          '<div><i class="fas fa-shield-halved"></i>Ambiente protegido</div>' +
          '<div><i class="fas fa-headset"></i>Suporte por WhatsApp</div>' +
        '</div>' +
      '</div>';
  }

  /* ==================== 2) CHECKOUT COMPLETO ==================== */
  function carregarSdkMercadoPago() {
    return new Promise(function (resolve) {
      if (window.MercadoPago) return resolve(window.MercadoPago);
      var s = document.createElement('script');
      s.src = 'https://sdk.mercadopago.com/js/v2';
      s.onload = function () { resolve(window.MercadoPago); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
  }

  function metodoEscolhido() {
    var r = document.querySelector('input[name="v4_metodo"]:checked');
    return r ? r.value : 'cartao';
  }

  function desenharCheckout() {
    var body = document.getElementById('checkoutModalBody');
    if (!body) return;
    var dados = window.__v4Checkout || {};
    var produto = dados.produto, oferta = dados.oferta;
    if (!produto) return;

    var metodos = [
      { v: 'cartao', i: 'fa-credit-card', t: 'Cartão de crédito', d: 'Parcele em até ' + maxParcelas() + 'x' },
      { v: 'debito', i: 'fa-credit-card', t: 'Cartão de débito', d: 'Débito à vista' },
      { v: 'pix', i: 'fa-qrcode', t: 'Pix', d: 'QR Code na hora, aprovação imediata' },
      { v: 'boleto', i: 'fa-barcode', t: 'Boleto', d: 'Vencimento em 1 dia útil' }
    ];

    body.innerHTML = '' +
      '<div class="v4-etapa"><span class="on">1. Seus dados</span><span class="on">2. Pagamento</span><span>3. Acesso</span></div>' +
      '<form onsubmit="v4RegistrarPedido(event)">' +
        '<input type="hidden" name="produto_id" value="' + produto.id + '">' +
        '<input type="hidden" name="formato" value="' + esc(oferta.value || 'digital') + '">' +
        '<div class="v2-resumo-compra"><strong>' + esc(produto.titulo) + '</strong>' +
          '<span>' + esc(oferta.label || oferta.badge || 'Digital') + '</span>' +
          '<div class="v2-resumo-valor">R$ ' + moeda(oferta.price) + '</div></div>' +
        '<div class="form-group"><label>Nome completo *</label><input type="text" name="cliente_nome" required value="' + esc(dados.nome || '') + '"></div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label>E-mail (recebe a apostila) *</label><input type="email" name="cliente_email" required value="' + esc(dados.email || '') + '"></div>' +
          '<div class="form-group"><label>WhatsApp / Telefone *</label><input type="text" name="cliente_telefone" required value="' + esc(dados.telefone || '') + '"></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label>CPF (obrigatório para Pix e boleto) *</label><input type="text" name="cliente_cpf" required value="' + esc(dados.cpf || '') + '" placeholder="000.000.000-00"></div>' +
          '<div class="form-group"><label>CEP (para boleto)</label><input type="text" name="cliente_cep" value="' + esc(dados.cep || '') + '" placeholder="00000-000"></div>' +
        '</div>' +
        '<div class="form-group"><label>Forma de pagamento *</label><div class="v2-pag-opcoes">' +
          metodos.map(function (m, i) {
            return '<label class="v2-pag-option' + (i === 0 ? ' selecionado' : '') + '" for="v4_m_' + m.v + '">' +
              '<input type="radio" name="v4_metodo" id="v4_m_' + m.v + '" value="' + m.v + '"' + (i === 0 ? ' checked' : '') + ' onchange="v4TrocarMetodo()">' +
              '<span class="v2-pag-titulo"><i class="fas ' + m.i + '"></i> ' + m.t + '</span>' +
              '<span class="v2-pag-desc">' + m.d + '</span></label>';
          }).join('') +
        '</div></div>' +
        '<p class="v2-aviso">O valor é conferido no servidor (não vem do navegador). O PDF é liberado em “Meus pedidos” assim que o pagamento for aprovado.</p>' +
        '<button type="submit" class="btn btn-success" style="width:100%;padding:15px;"><i class="fas fa-lock"></i> Ir para o pagamento</button>' +
      '</form>' +
      '<div id="v4PagamentoArea" style="margin-top:16px;"></div>';
  }

  window.v4TrocarMetodo = function () {
    var m = metodoEscolhido();
    document.querySelectorAll('.v2-pag-option').forEach(function (el) {
      var r = el.querySelector('input[type=radio]');
      el.classList.toggle('selecionado', Boolean(r && r.checked));
    });
    if (window.__v4Pedido && window.__v4Brick) {
      window.__v4Brick = null;
      var area = document.getElementById('v4PagamentoArea');
      if (area) area.innerHTML = '';
      montarBrick(window.__v4Pedido, window.__v4Produto, window.__v4Oferta, m);
    }
  };

  window.v4RegistrarPedido = async function (event) {
    event.preventDefault();
    var form = event.target;
    var produtoId = form.produto_id.value;
    var produto = (appState.allProdutos || appState.produtos || []).find(function (p) { return String(p.id) === String(produtoId); });
    if (!produto) { aviso('Produto não encontrado.', 'error'); return; }
    var oferta = (typeof getCurrentProductOffer === 'function') ? getCurrentProductOffer(produto) : { price: produto.preco, value: 'digital' };
    var cliente = {
      nome: form.cliente_nome.value.trim(),
      email: form.cliente_email.value.trim().toLowerCase(),
      telefone: form.cliente_telefone.value.trim(),
      cpf: form.cliente_cpf.value.trim(),
      cep: form.cliente_cep ? form.cliente_cep.value.trim() : ''
    };
    var btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando pedido...'; }

    try {
      var numero = (typeof gerarNumeroPedido === 'function') ? await gerarNumeroPedido() : ('MQA-' + Date.now());
      var codigo = (typeof gerarCodigoAcessoCliente === 'function') ? gerarCodigoAcessoCliente() : ('MQA-' + Math.random().toString(36).slice(2, 10).toUpperCase());
      var metodo = metodoEscolhido();
      var pedido = {
        numero_pedido: numero, codigo_acesso: codigo,
        cliente_nome: cliente.nome, cliente_email: cliente.email, cliente_telefone: cliente.telefone,
        cliente_cpf: cliente.cpf || null, produto_id: produto.id, produto_titulo: produto.titulo,
        produto_slug: produto.slug || null, preco: Number(oferta.price), formato: oferta.value || 'digital',
        parcelas: 1, metodo_pagamento: metodo, status: 'pendente', origem: 'site'
      };
      var salvo = null;
      if (sb()) {
        var r = await sb().from('pedidos').insert([pedido]).select('*').single();
        if (r.error) {
          var minimo = { numero_pedido: numero, cliente_nome: cliente.nome, cliente_email: cliente.email, produto_titulo: produto.titulo, preco: Number(oferta.price), metodo_pagamento: metodo, status: 'pendente', codigo_acesso: codigo };
          var r2 = await sb().from('pedidos').insert([minimo]).select('*').single();
          if (r2.error) throw r2.error;
          salvo = r2.data;
        } else salvo = r.data;
      }
      var pedidoFinal = salvo || pedido;
      window.__v4Pedido = pedidoFinal;
      window.__v4Produto = produto;
      window.__v4Oferta = oferta;
      window.__v4Cliente = cliente;
      sessionStorage.setItem('cliente_email', cliente.email);
      sessionStorage.setItem('cliente_nome', cliente.nome);

      var area = document.getElementById('v4PagamentoArea');
      if (area) {
        area.innerHTML = '<div class="v4-msg aviso"><i class="fas fa-circle-check"></i> Pedido <strong>' + esc(pedidoFinal.numero_pedido || numero) + '</strong> registrado. ' +
          'Código de acesso: <strong>' + esc(pedidoFinal.codigo_acesso || codigo) + '</strong> — agora escolha e conclua o pagamento abaixo.</div>';
        area.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      montarBrick(pedidoFinal, produto, oferta, metodo);
    } catch (err) {
      console.error(err);
      aviso('Não foi possível registrar o pedido: ' + (err.message || err), 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Ir para o pagamento'; }
    }
  };

  async function montarBrick(pedido, produto, oferta, metodo) {
    var area = document.getElementById('v4PagamentoArea');
    if (!area) return;
    var publicKey = String(cfg('mercadopago_public_key', '')).trim();
    if (!publicKey) {
      area.innerHTML += '<div class="v4-msg erro"><i class="fas fa-triangle-exclamation"></i> A <strong>Public Key</strong> do Mercado Pago não está cadastrada no painel (Admin › Checkout próprio). ' +
        'Sem ela não é possível abrir o formulário de cartão, o Pix nem o boleto.</div>';
      return;
    }

    var MP = await carregarSdkMercadoPago();
    if (!MP) {
      area.innerHTML += '<div class="v4-msg erro">Não foi possível carregar o SDK do Mercado Pago. Recarregue a página e tente novamente.</div>';
      return;
    }

    var divId = 'v4-brick-' + Date.now();
    area.insertAdjacentHTML('beforeend', '<div id="' + divId + '" class="v4-brick"></div>');

    var mp = new MP(publicKey);
    var bricks = mp.bricks();
    var pm = {};
    if (metodo === 'cartao') { pm = { creditCard: 'all', maxInstallments: maxParcelas() }; }
    else if (metodo === 'debito') { pm = { debitCard: 'all' }; }
    else if (metodo === 'pix') { pm = { bankTransfer: 'all' }; }
    else if (metodo === 'boleto') { pm = { ticket: 'all' }; }

    try {
      window.__v4Brick = await bricks.create('payment', divId, {
        initialization: {
          amount: Number(oferta.price),
          payer: {
            email: (window.__v4Cliente && window.__v4Cliente.email) || pedido.cliente_email || '',
            firstName: (pedido.cliente_nome || '').split(' ')[0] || '',
            lastName: (pedido.cliente_nome || '').split(' ').slice(1).join(' ') || ''
          }
        },
        customization: {
          paymentMethods: pm,
          visual: { style: { theme: 'default' } }
        },
        callbacks: {
          onReady: function () { },
          onError: function (e) { console.error('Brick MP:', e); },
          onSubmit: function (param) { v4EnviarPagamento(param, pedido, produto, oferta, metodo); }
        }
      });
    } catch (e) {
      console.error(e);
      area.insertAdjacentHTML('beforeend', '<div class="v4-msg erro">Falha ao montar o pagamento: ' + esc(e.message || e) + '</div>');
    }
  }

  async function v4EnviarPagamento(param, pedido, produto, oferta, metodo) {
    var area = document.getElementById('v4PagamentoArea');
    var formData = (param && param.formData) ? param.formData : {};
    if (area) area.insertAdjacentHTML('beforeend', '<div class="v4-msg aviso" id="v4Processando"><i class="fas fa-spinner fa-spin"></i> Processando o pagamento...</div>');
    function fim() { var p = document.getElementById('v4Processando'); if (p) p.remove(); }

    if (!sb() || !sb().functions) { fim(); aviso('Supabase não configurado.', 'error'); return; }
    try {
      var r = await sb().functions.invoke('mercadopago-payment', {
        body: {
          numero_pedido: pedido.numero_pedido,
          codigo_acesso: pedido.codigo_acesso,
          produto_id: produto.id,
          formato: oferta.value || 'digital',
          cliente: window.__v4Cliente || { nome: pedido.cliente_nome, email: pedido.cliente_email, cpf: pedido.cliente_cpf },
          formData: formData
        }
      });
      fim();
      var data = r.data || {};
      if (r.error || data.erro) {
        var msg = data.erro || (r.error && (r.error.message || r.error)) || 'erro desconhecido';
        aviso('Pagamento não concluído: ' + msg, 'error');
        return;
      }
      mostrarResultado(data, pedido, produto, metodo);
    } catch (err) {
      fim();
      console.error(err);
      aviso('Falha ao processar o pagamento: ' + (err.message || err), 'error');
    }
  }

  function mostrarResultado(data, pedido, produto, metodo) {
    var body = document.getElementById('checkoutModalBody');
    if (!body) return;
    var status = String(data.status || '');
    var aprovado = status === 'approved';
    var pendente = ['pending', 'in_process', 'authorized'].indexOf(status) >= 0;
    var titulo = aprovado ? 'Pagamento aprovado!' : (pendente ? 'Pagamento em processamento' : 'Pagamento não aprovado');
    var cor = aprovado ? 'ok' : (pendente ? 'aviso' : 'erro');

    var qr = '';
    if (data.qr_code_base64 || data.qr_code) {
      qr = '<div class="v4-qr">' +
        '<p style="font-weight:700;margin-bottom:8px;"><i class="fas fa-qrcode"></i> Pague com Pix</p>' +
        (data.qr_code_base64 ? '<img src="data:image/png;base64,' + data.qr_code_base64 + '" alt="QR Code Pix">' : '') +
        (data.qr_code ? '<div class="v4-copia"><code id="v4PixCopia">' + esc(data.qr_code) + '</code>' +
          '<button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById(\'v4PixCopia\').textContent); showAlert(\'Código Pix copiado!\',\'success\');"><i class="fas fa-copy"></i> Copiar código</button></div>' : '') +
        '<p style="font-size:12.5px;color:#166534;margin-top:10px;">Abra o app do seu banco › Pix › Ler QR Code (ou Pix Copia e Cola) › cole o código.</p>' +
        '</div>';
    }
    if (data.ticket_url) {
      qr += '<div style="margin-top:12px;"><a class="btn btn-primary" target="_blank" rel="noopener" href="' + esc(data.ticket_url) + '"><i class="fas fa-arrow-up-right-from-square"></i> ' +
        (metodo === 'boleto' ? 'Abrir / imprimir o boleto' : 'Abrir o pagamento') + '</a></div>';
    }
    if (data.barcode) {
      qr += '<div class="v4-copia"><code>' + esc(data.barcode) + '</code></div>';
    }

    body.innerHTML = '' +
      '<div class="v2-sucesso">' +
        '<div class="v2-sucesso-icon"><i class="fas ' + (aprovado ? 'fa-circle-check' : 'fa-hourglass-half') + '"></i></div>' +
        '<h3>' + titulo + '</h3>' +
        '<div class="v4-msg ' + cor + '">' +
          'Pedido <strong>' + esc(pedido.numero_pedido || '') + '</strong> — ' +
          'R$ ' + moeda(data.valor || (window.__v4Oferta && window.__v4Oferta.price) || 0) + '<br>' +
          'Método: <strong>' + esc(metodo) + '</strong> • Situação no Mercado Pago: <strong>' + esc(status) + '</strong>' +
          (data.status_detail ? ' (' + esc(data.status_detail) + ')' : '') +
        '</div>' +
        '<div class="v2-codigo-box"><span>Código de acesso</span><strong>' + esc(pedido.codigo_acesso || '') + '</strong></div>' +
        qr +
        '<p style="font-size:13px;color:var(--text-muted);margin-top:14px;">O PDF é liberado automaticamente em <strong>Minha conta › Meus pedidos</strong> assim que o Mercado Pago confirmar o pagamento.' +
        (pendente ? ' Esta tela confere sozinha, aguarde alguns segundos.' : '') + '</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;justify-content:center;">' +
          '<button class="btn btn-primary" onclick="renderAccountShell(\'pedidos\');"><i class="fas fa-box-open"></i> Ver meus pedidos</button>' +
          '<button class="btn" style="background:#fff;border:1px solid var(--border);" onclick="v4ConferirStatus(\'' + esc(pedido.numero_pedido || '') + '\')"><i class="fas fa-rotate"></i> Já paguei — conferir</button>' +
        '</div>' +
        '<div id="v4StatusBox" style="margin-top:12px;"></div>' +
      '</div>';

    if (pendente) {
      var tentativas = 0;
      var timer = setInterval(function () {
        tentativas++;
        v4ConferirStatus(pedido.numero_pedido, true);
        if (tentativas >= 20) clearInterval(timer);
      }, 8000);
    }
  }

  window.v4ConferirStatus = async function (numeroPedido, silencioso) {
    var box = document.getElementById('v4StatusBox');
    if (!sb() || !numeroPedido) return;
    try {
      var r = await sb().from('pedidos').select('status').eq('numero_pedido', numeroPedido).limit(1);
      if (r.error) throw r.error;
      var st = (r.data && r.data[0] && r.data[0].status) || 'pendente';
      if (box) {
        box.innerHTML = (String(st).toLowerCase() === 'pago')
          ? '<div class="v4-msg ok"><i class="fas fa-circle-check"></i> Pagamento confirmado! Abra “Meus pedidos” para baixar a apostila.</div>'
          : '<div class="v4-msg aviso">Ainda consta como <strong>' + esc(st) + '</strong> no sistema. Assim que o Mercado Pago confirmar, muda para “Pago” automaticamente.</div>';
      }
    } catch (e) {
      if (!silencioso && box) box.innerHTML = '<div class="v4-msg erro">Não foi possível conferir agora: ' + esc(e.message || e) + '</div>';
    }
  };

  /* ==================== 3) OVERRIDES ==================== */
  function aplicarOverrides() {
    // Página do produto: layout leve, capa corrigida, todas as informações mantidas
    var originalDetalhe = window.renderProductDetail;
    window.renderProductDetail = function (productRef) {
      try {
        var produto = (appState.produtos || []).find(function (p) { return p.id === productRef || p.slug === productRef; });
        if (!produto) { if (typeof originalDetalhe === 'function') return originalDetalhe.apply(this, arguments); return; }
        var main = document.getElementById('mainContent');
        main.innerHTML = montarPaginaProduto(produto);
        appState.currentView = 'produto';
        if (typeof setSeoMeta === 'function') {
          setSeoMeta({
            title: produto.titulo + ' | +QApostilas',
            description: (produto.descricao || ('Confira os detalhes da apostila ' + produto.titulo)).replace(/\n/g, ' ').slice(0, 155),
            path: '/produto/' + produto.slug,
            image: produto.capa_url || (typeof DEFAULT_OG_IMAGE !== 'undefined' ? DEFAULT_OG_IMAGE : undefined),
            type: 'product'
          });
        }
        return;
      } catch (e) {
        console.warn('[v4] falha no layout novo, usando o original:', e);
        if (typeof originalDetalhe === 'function') return originalDetalhe.apply(this, arguments);
      }
    };

    // Checkout: novo fluxo com as 4 formas de pagamento
    window.openCheckoutModal = function (produtoId) {
      if (typeof injectModaisV2 === 'function') injectModaisV2();
      var produto = (appState.produtos || []).find(function (p) { return String(p.id) === String(produtoId); }) ||
                    (appState.allProdutos || []).find(function (p) { return String(p.id) === String(produtoId); });
      if (!produto) { aviso('Produto não encontrado.', 'error'); return; }
      var oferta = (typeof getCurrentProductOffer === 'function') ? getCurrentProductOffer(produto) : { price: produto.preco, value: 'digital' };
      if (!oferta || !oferta.price) { aviso('Este produto está sem preço definido.', 'warning'); return; }
      window.__v4Checkout = {
        produto: produto, oferta: oferta,
        nome: sessionStorage.getItem('cliente_nome') || '',
        email: sessionStorage.getItem('cliente_email') || '',
        telefone: '', cpf: '', cep: ''
      };
      window.__v4Pedido = null; window.__v4Produto = null; window.__v4Oferta = null;
      desenharCheckout();
      if (typeof openModalById === 'function') openModalById('checkoutModal');
    };

    // Estados na home: grade escondida (o seletor do topo é o caminho)
    if (typeof window.renderEstadosSection === 'function') {
      window.renderEstadosSection = function () { return ''; };
    }
  }

  function iniciar() {
    try { aplicarOverrides(); } catch (e) { console.warn('[v4b]', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
  // garante o override mesmo se o site reatribuir as funções depois
  setTimeout(iniciar, 1500);
})();

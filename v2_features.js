
/* =====================================================================
   +QApostilas — PATCH v2 (módulo adicional, não remove nada do site atual)
   1) Venda de produto próprio (Mercado Pago Checkout Pro / Pix) + Hotmart + parceiro
   2) Upload de capas e do PDF por arquivo (bucket Supabase), com fallback por link
   3) Seletor de Estados no topo (ícone/pin) e remoção da grade de estados da home
   4) Área do cliente (cadastro, login, meus pedidos, download do PDF)
   5) Painel admin: abas Vendas e Clientes (número do pedido, data, status)
   ===================================================================== */

const V2_BUCKET_CAPAS = 'apostilas';
const V2_BUCKET_PDF = 'apostilas-pdf';
const V2_PLACEHOLDER_COVER = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='580'%3E%3Crect width='420' height='580' fill='%23EEF3FA'/%3E%3Crect x='26' y='26' width='368' height='528' fill='none' stroke='%231E90FF' stroke-width='3'/%3E%3Ctext x='210' y='300' font-family='Arial' font-size='26' fill='%231E90FF' text-anchor='middle'%3EApostila%3C/text%3E%3C/svg%3E";
const V2_PLACEHOLDER_AVATAR = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%2322C55E'/%3E%3Ccircle cx='60' cy='44' r='20' fill='%23ffffff'/%3E%3Cpath d='M18 112c0-23 19-42 42-42s42 19 42 42z' fill='%23ffffff'/%3E%3C/svg%3E";

const V2_ESTADOS_NOMES = {
    'AC':'Acre','AL':'Alagoas','AM':'Amazonas','AP':'Amapá','BA':'Bahia','CE':'Ceará',
    'DF':'Distrito Federal','ES':'Espírito Santo','GO':'Goiás','MA':'Maranhão','MG':'Minas Gerais',
    'MS':'Mato Grosso do Sul','MT':'Mato Grosso','PA':'Pará','PB':'Paraíba','PE':'Pernambuco',
    'PI':'Piauí','PR':'Paraná','RJ':'Rio de Janeiro','RN':'Rio Grande do Norte','RO':'Rondônia',
    'RR':'Roraima','RS':'Rio Grande do Sul','SC':'Santa Catarina','SE':'Sergipe','SP':'São Paulo',
    'TO':'Tocantins','NACIONAL':'Nacional'
};

function getAvatarPlaceholder() { return V2_PLACEHOLDER_AVATAR; }
function getCoverPlaceholder() { return V2_PLACEHOLDER_COVER; }

/* ==================== TIPOS DE VENDA ==================== */
function getVendaTipo(produto) {
    const t = String((produto && (produto.tipo_botao || produto.tipo_venda)) || '').toLowerCase();
    if (t === 'proprio') return 'proprio';
    if (t === 'parceiro' || t === 'terceiro') return 'parceiro';
    return 'hotmart';
}

function getVendaMeta(tipo) {
    const map = {
        proprio:  { label: 'Produto próprio', cor: '#16A34A', classe: 'btn-buy-proprio',  desc: 'Compra no nosso site — Pix ou cartão' },
        hotmart:  { label: 'Hotmart',         cor: '#EA580C', classe: 'btn-buy-hotmart',  desc: 'Checkout seguro Hotmart' },
        parceiro: { label: 'Site parceiro',   cor: '#DC2626', classe: 'btn-buy-parceiro', desc: 'Compra no site do parceiro' }
    };
    return map[tipo] || map.hotmart;
}

function handleBuyClick(event, produtoId) {
    if (event && event.stopPropagation) event.stopPropagation();
    const todos = (appState.allProdutos || appState.produtos || []);
    const produto = todos.find(p => String(p.id) === String(produtoId)) || (appState.produtos || []).find(p => String(p.id) === String(produtoId));
    if (!produto) return;

    const tipo = getVendaTipo(produto);
    if (tipo === 'proprio') { openCheckoutModal(produtoId); return; }

    const url = (produto.mercadopago_url && tipo === 'proprio') ? produto.mercadopago_url : produto.link_compra;
    if (!url) { showAlert('Este produto ainda não tem link de compra cadastrado.', 'warning'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
}

/* ==================== SELETOR DE ESTADOS NO TOPO ==================== */
function getEstadosDisponiveis() {
    const lista = (appState.produtos || []).map(p => String(p.estado || '').toUpperCase().trim()).filter(Boolean);
    lista.unshift('NACIONAL');
    return Array.from(new Set(lista));
}

function updateEstadosDropdown() {
    const estados = getEstadosDisponiveis();
    const html = `
        <a href="#" onclick="filterByEstado('Nacional'); closeNavMenu(); return false;">
            <i class="fas fa-flag"></i> Nacional (todo o Brasil)
        </a>
        ${estados.filter(e => e !== 'NACIONAL').map(sigla => {
            const qtd = (appState.produtos || []).filter(p => String(p.estado || '').toUpperCase() === sigla).length;
            return `<a href="/estado/${sigla.toLowerCase()}" onclick="event.preventDefault(); filterByEstado('${sigla}'); closeNavMenu();">${sigla} — ${V2_ESTADOS_NOMES[sigla] || sigla} <small style="opacity:.6">(${qtd})</small></a>`;
        }).join('')}
    `;
    ['estadosDropdown', 'estadosDropdown2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    });
}

function injectEstadosNoTopo() {
    if (document.getElementById('estadosDropdown')) return;

    const menu = document.getElementById('navMenu');
    if (menu) {
        const li = document.createElement('li');
        li.className = 'dropdown';
        li.innerHTML = `
            <span class="dropdown-toggle"><i class="fas fa-map-marker-alt"></i> Estados <i class="fas fa-chevron-down"></i></span>
            <div class="dropdown-menu" id="estadosDropdown"></div>
        `;
        const categoriasLi = menu.querySelector('.dropdown');
        if (categoriasLi && categoriasLi.nextSibling) menu.insertBefore(li, categoriasLi.nextSibling);
        else menu.appendChild(li);
    }

    const menu2 = document.getElementById('navSecondary');
    if (menu2) {
        const li2 = document.createElement('li');
        li2.className = 'dropdown-secondary';
        li2.innerHTML = `
            <span><i class="fas fa-map-marker-alt"></i> Estados <i class="fas fa-chevron-down" style="font-size:11px;margin-left:2px;"></i></span>
            <div class="dropdown-secondary-menu" id="estadosDropdown2"></div>
        `;
        const catLi2 = menu2.querySelector('.dropdown-secondary');
        if (catLi2 && catLi2.nextSibling) menu2.insertBefore(li2, catLi2.nextSibling);
        else menu2.appendChild(li2);
    }

    updateEstadosDropdown();
}

/* ==================== MODAIS (conta / checkout) ==================== */
function injectModaisV2() {
    if (!document.getElementById('accountModal')) {
        const acc = document.createElement('div');
        acc.className = 'modal';
        acc.id = 'accountModal';
        acc.innerHTML = `
            <div class="modal-content v2-modal">
                <div class="modal-header">
                    <h2 id="accountModalTitle"><i class="fas fa-user-circle"></i> Minha conta</h2>
                    <button class="modal-close" onclick="closeModalById('accountModal')">&times;</button>
                </div>
                <div class="modal-body" id="accountModalBody"></div>
            </div>
        `;
        document.body.appendChild(acc);
    }
    if (!document.getElementById('checkoutModal')) {
        const ck = document.createElement('div');
        ck.className = 'modal';
        ck.id = 'checkoutModal';
        ck.innerHTML = `
            <div class="modal-content v2-modal">
                <div class="modal-header">
                    <h2 id="checkoutModalTitle"><i class="fas fa-cart-shopping"></i> Finalizar compra</h2>
                    <button class="modal-close" onclick="closeModalById('checkoutModal')">&times;</button>
                </div>
                <div class="modal-body" id="checkoutModalBody"></div>
            </div>
        `;
        document.body.appendChild(ck);
    }
}

function closeModalById(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function openModalById(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

/* ==================== ÁREA DO CLIENTE ==================== */
function openAccountModal() {
    injectModaisV2();
    renderAccountShell('menu');
    openModalById('accountModal');
}

function renderAccountShell(passo, extra = {}) {
    const body = document.getElementById('accountModalBody');
    if (!body) return;

    if (passo === 'menu') {
        body.innerHTML = `
            <div class="v2-tabs">
                <button class="v2-tab active" onclick="renderAccountShell('login')"><i class="fas fa-right-to-bracket"></i> Entrar</button>
                <button class="v2-tab" onclick="renderAccountShell('cadastro')"><i class="fas fa-user-plus"></i> Criar conta</button>
                <button class="v2-tab" onclick="renderAccountShell('pedidos')"><i class="fas fa-box-open"></i> Meus pedidos</button>
            </div>
            <p style="color:var(--text-muted); margin-top:12px;">Acesse sua conta para ver seus pedidos, baixar a apostila em PDF e acompanhar o status da compra.</p>
        `;
        return;
    }

    if (passo === 'cadastro') {
        body.innerHTML = `
            <div class="v2-tabs">
                <button class="v2-tab" onclick="renderAccountShell('login')"><i class="fas fa-right-to-bracket"></i> Entrar</button>
                <button class="v2-tab active" onclick="renderAccountShell('cadastro')"><i class="fas fa-user-plus"></i> Criar conta</button>
                <button class="v2-tab" onclick="renderAccountShell('pedidos')"><i class="fas fa-box-open"></i> Meus pedidos</button>
            </div>
            <form onsubmit="handleCustomerSignup(event)" style="margin-top:16px;">
                <div class="form-group"><label>Nome completo *</label><input type="text" name="nome" id="cli_nome" required></div>
                <div class="form-row">
                    <div class="form-group"><label>E-mail *</label><input type="email" name="email" id="cli_email" required></div>
                    <div class="form-group"><label>Telefone / WhatsApp</label><input type="text" name="telefone" id="cli_telefone" placeholder="(11) 99999-9999"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>CPF (opcional)</label><input type="text" name="cpf" id="cli_cpf"></div>
                    <div class="form-group"><label>Senha *</label><input type="password" name="senha" id="cli_senha" minlength="6" required></div>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fas fa-user-plus"></i> Criar minha conta</button>
            </form>
        `;
        return;
    }

    if (passo === 'login') {
        body.innerHTML = `
            <div class="v2-tabs">
                <button class="v2-tab active" onclick="renderAccountShell('login')"><i class="fas fa-right-to-bracket"></i> Entrar</button>
                <button class="v2-tab" onclick="renderAccountShell('cadastro')"><i class="fas fa-user-plus"></i> Criar conta</button>
                <button class="v2-tab" onclick="renderAccountShell('pedidos')"><i class="fas fa-box-open"></i> Meus pedidos</button>
            </div>
            <form onsubmit="handleCustomerLogin(event)" style="margin-top:16px;">
                <div class="form-group"><label>E-mail</label><input type="email" name="email" required></div>
                <div class="form-group"><label>Senha</label><input type="password" name="senha" required></div>
                <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fas fa-sign-in-alt"></i> Entrar</button>
            </form>
            <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
                <p style="font-weight:700; margin-bottom:8px;"><i class="fas fa-key"></i> Tem só o código do pedido?</p>
                <form onsubmit="consultarPedidoPorCodigo(event)" style="display:flex; gap:8px;">
                    <input type="text" name="codigo" placeholder="MQA-XXXXXXXX" style="flex:1; padding:12px; border:1.5px solid var(--border); border-radius:12px;">
                    <button type="submit" class="btn btn-success">Consultar</button>
                </form>
            </div>
        `;
        return;
    }

    if (passo === 'pedidos') {
        body.innerHTML = `
            <div class="v2-tabs">
                <button class="v2-tab" onclick="renderAccountShell('login')"><i class="fas fa-right-to-bracket"></i> Entrar</button>
                <button class="v2-tab" onclick="renderAccountShell('cadastro')"><i class="fas fa-user-plus"></i> Criar conta</button>
                <button class="v2-tab active" onclick="renderAccountShell('pedidos')"><i class="fas fa-box-open"></i> Meus pedidos</button>
            </div>
            <p style="color:var(--text-muted); margin:12px 0;">Informe o e-mail usado na compra (ou o código do pedido) para ver e baixar suas apostilas.</p>
            <form onsubmit="consultarPedidoPorCodigo(event)" style="display:flex; gap:8px; flex-wrap:wrap;">
                <input type="text" name="codigo" placeholder="E-mail ou código MQA-XXXXXXXX" style="flex:1; min-width:220px; padding:12px; border:1.5px solid var(--border); border-radius:12px;">
                <button type="submit" class="btn btn-primary"><i class="fas fa-magnifying-glass"></i> Buscar</button>
            </form>
            <div id="clientPedidosResult" style="margin-top:18px;"></div>
        `;
        return;
    }

    if (passo === 'logado') {
        body.innerHTML = `
            <div class="v2-tabs">
                <button class="v2-tab active" onclick="renderAccountShell('pedidos')"><i class="fas fa-box-open"></i> Meus pedidos</button>
                <button class="v2-tab" onclick="sairDaConta()"><i class="fas fa-right-from-bracket"></i> Sair</button>
            </div>
            <p style="margin:12px 0;">Olá, <strong>${extra.nome || 'cliente'}</strong>! Veja abaixo seus pedidos.</p>
            <div id="clientPedidosResult"></div>
        `;
        carregarPedidosDoCliente(extra.email);
    }
}

async function sha256Hex(texto) {
    try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        return 'plain:' + texto;
    }
}

async function handleCustomerSignup(event) {
    event.preventDefault();
    if (typeof supabaseClient === 'undefined') { showAlert('Supabase não configurado.', 'error'); return; }

    const nome = event.target.nome.value.trim();
    const email = event.target.email.value.trim().toLowerCase();
    const telefone = event.target.telefone.value.trim();
    const cpf = event.target.cpf.value.trim();
    const senha = event.target.senha.value;
    const btn = event.target.querySelector('button[type=submit]');
    if (btn) btn.disabled = true;

    try {
        const senha_hash = await sha256Hex(email + ':' + senha);
        const payload = { nome, email, telefone, senha_hash };
        if (cpf) payload.cpf = cpf;

        let { error } = await supabaseClient.from('clientes').insert([payload]);
        if (error && cpf) {
            delete payload.cpf;
            const retry = await supabaseClient.from('clientes').insert([payload]);
            error = retry.error;
        }
        if (error) throw error;

        mostrarContaLogadaCliente({ nome, email });
        showAlert('Conta criada com sucesso!', 'success');
    } catch (err) {
        console.error(err);
        const msg = String(err.message || err);
        showAlert(msg.includes('duplicate') ? 'Este e-mail já tem cadastro. Tente entrar.' : 'Erro ao criar conta: ' + msg, 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function handleCustomerLogin(event) {
    event.preventDefault();
    if (typeof supabaseClient === 'undefined') { showAlert('Supabase não configurado.', 'error'); return; }

    const email = event.target.email.value.trim().toLowerCase();
    const senha = event.target.senha.value;

    try {
        const { data, error } = await supabaseClient.from('clientes').select('*').eq('email', email).limit(1);
        if (error) throw error;
        if (!data || !data.length) { showAlert('E-mail não encontrado. Crie sua conta.', 'warning'); return; }

        const cliente = data[0];
        const hash = await sha256Hex(email + ':' + senha);
        if (cliente.senha_hash && cliente.senha_hash !== hash) { showAlert('Senha incorreta.', 'error'); return; }

        mostrarContaLogadaCliente({ nome: cliente.nome, email: cliente.email });
    } catch (err) {
        console.error(err);
        showAlert('Erro ao entrar: ' + (err.message || err), 'error');
    }
}

function mostrarContaLogadaCliente(cliente) {
    sessionStorage.setItem('cliente_email', cliente.email);
    sessionStorage.setItem('cliente_nome', cliente.nome || '');
    const label = document.getElementById('accountButtonLabel');
    if (label) label.textContent = (cliente.nome || 'Minha conta').split(' ')[0];
    renderAccountShell('logado', cliente);
}

function sairDaConta() {
    sessionStorage.removeItem('cliente_email');
    sessionStorage.removeItem('cliente_nome');
    const label = document.getElementById('accountButtonLabel');
    if (label) label.textContent = 'Minha conta';
    renderAccountShell('menu');
}

async function carregarPedidosDoCliente(email, containerId = 'clientPedidosResult') {
    const box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = '<p style="color:var(--text-muted)">Carregando pedidos...</p>';
    try {
        const { data, error } = await supabaseClient.from('pedidos').select('*').ilike('cliente_email', email).order('criado_em', { ascending: false });
        if (error) throw error;
        renderPedidosCliente(data || [], containerId);
    } catch (err) {
        box.innerHTML = `<p style="color:#DC2626">Não foi possível carregar seus pedidos. ${escapeHtml(err.message || '')}</p>`;
    }
}

async function consultarPedidoPorCodigo(event) {
    event.preventDefault();
    const valor = event.target.codigo.value.trim();
    if (!valor) return;
    const containerId = event.target.closest('#accountModal') ? 'clientPedidosResult' : 'clientPedidosResult';
    if (valor.includes('@')) { carregarPedidosDoCliente(valor, containerId); return; }

    const box = document.getElementById(containerId);
    if (box) box.innerHTML = '<p style="color:var(--text-muted)">Buscando pedido...</p>';
    try {
        const { data, error } = await supabaseClient.from('pedidos').select('*').ilike('codigo_acesso', valor).order('criado_em', { ascending: false });
        if (error) throw error;
        renderPedidosCliente(data || [], containerId);
    } catch (err) {
        if (box) box.innerHTML = `<p style="color:#DC2626">Erro ao buscar: ${escapeHtml(err.message || '')}</p>`;
    }
}

function statusPedidoBadge(status) {
    const s = String(status || 'pendente').toLowerCase();
    const map = {
        pago: ['badge-success', 'Pago'],
        pendente: ['badge-warning', 'Aguardando pagamento'],
        cancelado: ['badge-error', 'Cancelado'],
        reembolsado: ['badge-error', 'Reembolsado']
    };
    const [classe, label] = map[s] || ['badge-info', s];
    return `<span class="badge ${classe}">${label}</span>`;
}

function renderPedidosCliente(pedidos, containerId = 'clientPedidosResult') {
    const box = document.getElementById(containerId);
    if (!box) return;
    if (!pedidos.length) {
        box.innerHTML = '<p style="color:var(--text-muted)">Nenhum pedido encontrado.</p>';
        return;
    }
    box.innerHTML = pedidos.map(p => {
        const pago = String(p.status || '').toLowerCase() === 'pago';
        return `
            <div class="v2-pedido-card">
                <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
                    <strong>Pedido ${escapeHtml(p.numero_pedido || ('#' + p.id))}</strong>
                    ${statusPedidoBadge(p.status)}
                </div>
                <div class="v2-pedido-meta">
                    <span><i class="fas fa-book"></i> ${escapeHtml(p.produto_titulo || '')}</span>
                    <span><i class="far fa-calendar"></i> ${formatarData(p.criado_em)}</span>
                    <span><i class="fas fa-money-bill"></i> R$ ${formatPrice(p.preco || 0)}</span>
                </div>
                <div class="v2-pedido-meta">
                    <span><i class="fas fa-key"></i> Código de acesso: <strong>${escapeHtml(p.codigo_acesso || '—')}</strong></span>
                </div>
                ${pago
                    ? `<button class="btn btn-success" style="margin-top:10px;" onclick="baixarApostila('${escapeHtml(p.codigo_acesso || '')}')"><i class="fas fa-download"></i> Baixar apostila (PDF)</button>`
                    : `<p style="color:var(--text-muted); margin-top:8px; font-size:13px;">O download é liberado automaticamente após a confirmação do pagamento.</p>`}
            </div>
        `;
    }).join('');
}

async function baixarApostila(codigoAcesso) {
    if (!codigoAcesso) return;
    if (typeof supabaseClient === 'undefined') { showAlert('Supabase não configurado.', 'error'); return; }
    try {
        const { data, error } = await supabaseClient.functions.invoke('liberar-download', { body: { codigo_acesso: codigoAcesso } });
        if (error) throw error;
        if (data && data.url) { window.open(data.url, '_blank', 'noopener'); return; }
        throw new Error((data && (data.erro || data.error)) || 'Download não liberado');
    } catch (err) {
        console.warn(err);
        showAlert('Não foi possível abrir o PDF agora. Guarde seu código de acesso: ' + codigoAcesso + ' e fale com o suporte.', 'warning');
    }
}

function formatarData(valor) {
    if (!valor) return '—';
    try {
        const d = new Date(valor);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return String(valor); }
}

/* ==================== CHECKOUT PRÓPRIO ==================== */
function openCheckoutModal(produtoId) {
    injectModaisV2();
    const produto = (appState.produtos || []).find(p => String(p.id) === String(produtoId)) || (appState.allProdutos || []).find(p => String(p.id) === String(produtoId));
    if (!produto) { showAlert('Produto não encontrado.', 'error'); return; }

    const oferta = getCurrentProductOffer(produto);
    if (!oferta) { showAlert('Este produto está sem preço definido.', 'warning'); return; }

    const maxParcelas = Math.max(1, Math.min(24, parseInt(appState.config.mercadopago_parcelas || 12) || 12));
    const titulo = document.getElementById('checkoutModalTitle');
    if (titulo) titulo.innerHTML = '<i class="fas fa-cart-shopping"></i> Finalizar compra';

    const body = document.getElementById('checkoutModalBody');
    const clienteEmail = sessionStorage.getItem('cliente_email') || '';
    const clienteNome = sessionStorage.getItem('cliente_nome') || '';

    body.innerHTML = `
        <form onsubmit="submitCheckout(event)">
            <input type="hidden" name="produto_id" value="${produto.id}">
            <input type="hidden" name="formato" value="${oferta.value}">
            <div class="v2-resumo-compra">
                <strong>${escapeHtml(produto.titulo)}</strong>
                <span>${escapeHtml(oferta.label || oferta.badge || 'Digital')}</span>
                <div class="v2-resumo-valor">R$ ${formatPrice(oferta.price)}</div>
            </div>

            <div class="form-group"><label>Nome completo *</label><input type="text" name="cliente_nome" required value="${escapeHtml(clienteNome)}"></div>
            <div class="form-row">
                <div class="form-group"><label>E-mail (recebe a apostila) *</label><input type="email" name="cliente_email" required value="${escapeHtml(clienteEmail)}"></div>
                <div class="form-group"><label>WhatsApp / Telefone *</label><input type="text" name="cliente_telefone" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>CPF (opcional)</label><input type="text" name="cliente_cpf"></div>
                <div class="form-group">
                    <label>Forma de pagamento *</label>
                    <select name="metodo_pagamento" id="checkout_metodo" onchange="handleMetodoPagamentoChange()">
                        <option value="mercadopago">Mercado Pago (Pix ou cartão)</option>
                        <option value="pix">Pix direto (chave do site)</option>
                    </select>
                </div>
            </div>
            <div class="form-group" id="checkout_parcelas_group">
                <label>Parcelamento</label>
                <select name="parcelas" id="checkout_parcelas">
                    ${Array.from({ length: maxParcelas }, (_, i) => i + 1).map(n => {
                        const valorParcela = Number(oferta.price) / n;
                        return `<option value="${n}">${n}x de R$ ${formatPrice(valorParcela)} sem juros</option>`;
                    }).join('')}
                </select>
                <small style="color:var(--text-muted)">Parcelamento em até ${maxParcelas}x no cartão, processado pelo Mercado Pago.</small>
            </div>

            <p class="v2-aviso">Ao confirmar, o pedido é registrado no site com <strong>número e data</strong> e você é levado ao pagamento. A apostila em PDF é liberada nesta mesma página (em “Meus pedidos”) assim que o pagamento for aprovado.</p>
            <button type="submit" class="btn btn-success" style="width:100%; padding:15px;"><i class="fas fa-lock"></i> Finalizar e ir para o pagamento</button>
        </form>
    `;

    openModalById('checkoutModal');
}

function handleMetodoPagamentoChange() {
    const metodo = document.getElementById('checkout_metodo');
    const grupo = document.getElementById('checkout_parcelas_group');
    if (metodo && grupo) grupo.style.display = (metodo.value === 'pix') ? 'none' : 'block';
}

async function gerarNumeroPedido() {
    const agora = new Date();
    const prefixo = 'MQA-' + agora.getFullYear() + String(agora.getMonth() + 1).padStart(2, '0');
    let sequencia = 1;
    try {
        const { data } = await supabaseClient.from('pedidos').select('numero_pedido').ilike('numero_pedido', prefixo + '%');
        sequencia = (data || []).length + 1;
    } catch (e) { sequencia = Math.floor(Math.random() * 9000) + 1; }
    return prefixo + '-' + String(sequencia).padStart(4, '0');
}

function gerarCodigoAcessoCliente() {
    const aleatorio = Math.random().toString(36).slice(2, 10).toUpperCase();
    return 'MQA-' + aleatorio;
}

async function submitCheckout(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type=submit]');
    const produtoId = form.produto_id.value;
    const produto = (appState.allProdutos || appState.produtos || []).find(p => String(p.id) === String(produtoId));
    if (!produto) { showAlert('Produto não encontrado.', 'error'); return; }

    const oferta = getCurrentProductOffer(produto);
    const metodo = form.metodo_pagamento.value;
    const parcelas = parseInt(form.parcelas ? form.parcelas.value : 1) || 1;
    const cliente = {
        nome: form.cliente_nome.value.trim(),
        email: form.cliente_email.value.trim().toLowerCase(),
        telefone: form.cliente_telefone.value.trim(),
        cpf: form.cliente_cpf.value.trim()
    };

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando pedido...'; }

    try {
        const numero = await gerarNumeroPedido();
        const codigo = gerarCodigoAcessoCliente();
        const pedidoBase = {
            numero_pedido: numero,
            cliente_nome: cliente.nome,
            cliente_email: cliente.email,
            produto_id: produto.id,
            produto_titulo: produto.titulo,
            preco: Number(oferta.price),
            formato: oferta.value || 'digital',
            metodo_pagamento: metodo === 'pix' ? 'pix' : 'mercadopago',
            status: 'pendente',
            codigo_acesso: codigo
        };
        const extras = {
            cliente_telefone: cliente.telefone,
            cliente_cpf: cliente.cpf || null,
            produto_slug: produto.slug || null,
            parcelas: parcelas,
            origem: 'site'
        };

        let pedidoSalvo = null;
        const tentativaFull = await supabaseClient.from('pedidos').insert([Object.assign({}, pedidoBase, extras)]).select('*').single();
        if (tentativaFull.error) {
            console.warn('Insert completo falhou, tentando versão mínima:', tentativaFull.error.message);
            const tentativaMin = await supabaseClient.from('pedidos').insert([pedidoBase]).select('*').single();
            if (tentativaMin.error) throw tentativaMin.error;
            pedidoSalvo = tentativaMin.data;
        } else {
            pedidoSalvo = tentativaFull.data;
        }

        const pedido = pedidoSalvo || Object.assign({}, pedidoBase, extras);
        sessionStorage.setItem('cliente_email', cliente.email);
        sessionStorage.setItem('cliente_nome', cliente.nome);
        const label = document.getElementById('accountButtonLabel');
        if (label) label.textContent = cliente.nome.split(' ')[0];

        await iniciarPagamento(pedido, produto, oferta, metodo, parcelas);
    } catch (err) {
        console.error(err);
        showAlert('Não foi possível registrar o pedido: ' + (err.message || err), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Finalizar e ir para o pagamento'; }
    }
}

async function iniciarPagamento(pedido, produto, oferta, metodo, parcelas) {
    const cfg = appState.config || {};

    // 1) Checkout Pro via Supabase Edge Function (recomendado: token fica no servidor)
    if (metodo !== 'pix' && typeof supabaseClient !== 'undefined' && supabaseClient.functions) {
        try {
            const { data, error } = await supabaseClient.functions.invoke('mercadopago-preference', {
                body: {
                    numero_pedido: pedido.numero_pedido,
                    codigo_acesso: pedido.codigo_acesso,
                    titulo: produto.titulo,
                    valor: Number(oferta.price),
                    parcelas: parcelas,
                    cliente: { nome: pedido.cliente_nome, email: pedido.cliente_email, telefone: pedido.cliente_telefone, cpf: pedido.cliente_cpf },
                    slug: produto.slug || ''
                }
            });
            if (!error && data && data.init_point) {
                mostrarPedidoCriado(pedido, produto, 'redirecionando');
                window.location.href = data.init_point;
                return;
            }
        } catch (err) { console.warn('Edge Function mercadopago-preference indisponível:', err); }
    }

    // 2) Link de pagamento do Mercado Pago já criado no painel MP
    const linkMp = (cfg.mercadopago_checkout_url || '').trim();
    if (metodo !== 'pix' && linkMp) {
        const sep = linkMp.includes('?') ? '&' : '?';
        window.open(linkMp + sep + 'external_reference=' + encodeURIComponent(pedido.numero_pedido), '_blank', 'noopener');
        mostrarPedidoCriado(pedido, produto, 'link');
        return;
    }

    // 3) Pix direto com a chave cadastrada no painel
    mostrarPedidoCriado(pedido, produto, 'pix');
}

function mostrarPedidoCriado(pedido, produto, modo) {
    const body = document.getElementById('checkoutModalBody');
    if (!body) return;
    const chavePix = (appState.config && appState.config.pix_chave) || '';
    const whats = (appState.config && appState.config.whatsapp) || '';

    body.innerHTML = `
        <div class="v2-sucesso">
            <div class="v2-sucesso-icon"><i class="fas fa-circle-check"></i></div>
            <h3>Pedido ${escapeHtml(pedido.numero_pedido || '')} registrado!</h3>
            <p>Guarde o número do pedido e o código de acesso abaixo. Eles aparecem em <strong>Minha conta › Meus pedidos</strong>.</p>
            <div class="v2-codigo-box">
                <span>Código de acesso</span>
                <strong>${escapeHtml(pedido.codigo_acesso || '')}</strong>
            </div>
            ${modo === 'pix' ? `
                <div class="v2-pix-box">
                    <p><strong>Pague com Pix na chave abaixo</strong> e envie o comprovante para liberarmos o download.</p>
                    ${chavePix
                        ? `<div class="v2-chave-pix"><code>${escapeHtml(chavePix)}</code>
                             <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText('${escapeHtml(chavePix)}'); showAlert('Chave copiada!', 'success');"><i class="fas fa-copy"></i> Copiar</button></div>`
                        : '<p style="color:#DC2626">Nenhuma chave Pix cadastrada no painel admin.</p>'}
                </div>
            ` : `
                <p><strong>Falta só o pagamento.</strong> ${modo === 'redirecionando' ? 'Você está sendo levado ao Mercado Pago.' : 'Conclua a compra na janela do Mercado Pago que foi aberta.'}</p>
            `}
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
                <button class="btn btn-primary" onclick="renderAccountShell('pedidos');"><i class="fas fa-box-open"></i> Ver meus pedidos</button>
                ${whats ? `<a class="btn btn-success" target="_blank" rel="noopener" href="https://wa.me/${escapeHtml(whats)}?text=${encodeURIComponent('Olá! Fiz o pedido ' + (pedido.numero_pedido || '') + ' no site e quero confirmar o pagamento.')}"><i class="fab fa-whatsapp"></i> Enviar comprovante</a>` : ''}
            </div>
        </div>
    `;
}

function escapeHtml(valor) {
    return String(valor == null ? '' : valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ==================== ADMIN: ABAS VENDAS E CLIENTES ==================== */
function injectAdminExtras() {
    const content = document.querySelector('.admin-content');
    const tabsBar = document.querySelector('.admin-tabs');
    if (tabsBar && !document.getElementById('adminTabVendas')) {
        const bt1 = document.createElement('button');
        bt1.className = 'admin-tab';
        bt1.id = 'adminTabVendas';
        bt1.setAttribute('onclick', "abrirAbaAdmin('vendas', this)");
        bt1.innerHTML = '<i class="fas fa-receipt"></i> Vendas';
        const bt2 = document.createElement('button');
        bt2.className = 'admin-tab';
        bt2.id = 'adminTabClientes';
        bt2.setAttribute('onclick', "abrirAbaAdmin('clientes', this)");
        bt2.innerHTML = '<i class="fas fa-users"></i> Clientes';
        tabsBar.appendChild(bt1);
        tabsBar.appendChild(bt2);
    }
    if (!content || document.getElementById('admin-vendas')) return;

    const vendas = document.createElement('div');
    vendas.className = 'admin-section';
    vendas.id = 'admin-vendas';
    vendas.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:18px;">
            <h3><i class="fas fa-receipt"></i> Vendas / Pedidos</h3>
            <button class="btn btn-accent" onclick="loadPedidosAdmin()"><i class="fas fa-rotate"></i> Atualizar lista</button>
        </div>
        <div class="v2-kpis" id="vendasKpis"></div>
        <div class="table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Pedido</th><th>Data</th><th>Cliente</th><th>Produto</th>
                        <th>Valor</th><th>Pagamento</th><th>Status</th><th>Ações</th>
                    </tr>
                </thead>
                <tbody id="vendasTableBody"></tbody>
            </table>
        </div>
    `;
    content.appendChild(vendas);

    const clientes = document.createElement('div');
    clientes.className = 'admin-section';
    clientes.id = 'admin-clientes';
    clientes.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:18px;">
            <h3><i class="fas fa-users"></i> Clientes cadastrados</h3>
            <button class="btn btn-accent" onclick="loadClientesAdmin()"><i class="fas fa-rotate"></i> Atualizar lista</button>
        </div>
        <small id="clientesSummary" style="color:var(--text-muted); display:block; margin-bottom:12px;">Todos os clientes do site</small>
        <div class="table-container">
            <table class="admin-table">
                <thead>
                    <tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Cadastro</th><th>Pedidos</th><th>Ações</th></tr>
                </thead>
                <tbody id="clientesTableBody"></tbody>
            </table>
        </div>
    `;
    content.appendChild(clientes);
}

function abrirAbaAdmin(tab, btn) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    const botao = btn || Array.from(document.querySelectorAll('.admin-tab'))
        .find(b => String(b.getAttribute('onclick') || '').includes(`'${tab}'`));
    if (botao) botao.classList.add('active');

    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    const secao = document.getElementById('admin-' + tab);
    if (secao) secao.classList.add('active');

    if (tab === 'vendas') loadPedidosAdmin();
    if (tab === 'clientes') loadClientesAdmin();
}

// Mantém o comportamento original das abas, sem depender do objeto global "event"
function switchAdminTabSeguro(tab, btn) {
    abrirAbaAdmin(tab, btn || (window.event && window.event.target) || null);
}

async function loadPedidosAdmin() {
    const tbody = document.getElementById('vendasTableBody');
    const kpis = document.getElementById('vendasKpis');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">Carregando pedidos...</td></tr>';

    try {
        const { data, error } = await supabaseClient.from('pedidos').select('*').order('criado_em', { ascending: false }).limit(300);
        if (error) throw error;
        const pedidos = data || [];

        const pagos = pedidos.filter(p => String(p.status || '').toLowerCase() === 'pago');
        const total = pagos.reduce((soma, p) => soma + Number(p.preco || 0), 0);
        if (kpis) {
            kpis.innerHTML = `
                <div class="v2-kpi"><span>Pedidos</span><strong>${pedidos.length}</strong></div>
                <div class="v2-kpi"><span>Pagos</span><strong>${pagos.length}</strong></div>
                <div class="v2-kpi"><span>Pendentes</span><strong>${pedidos.length - pagos.length}</strong></div>
                <div class="v2-kpi"><span>Receita confirmada</span><strong>R$ ${formatPrice(total)}</strong></div>
            `;
        }

        if (!pedidos.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">Nenhum pedido registrado ainda.</td></tr>';
            return;
        }

        tbody.innerHTML = pedidos.map(p => `
            <tr>
                <td style="white-space:nowrap; font-weight:700;">${escapeHtml(p.numero_pedido || ('#' + p.id))}<br><small style="color:var(--text-muted)">${escapeHtml(p.codigo_acesso || '')}</small></td>
                <td style="white-space:nowrap;">${formatarData(p.criado_em)}</td>
                <td>${escapeHtml(p.cliente_nome || '—')}<br><small style="color:var(--text-muted)">${escapeHtml(p.cliente_email || '')}</small></td>
                <td>${escapeHtml(p.produto_titulo || '—')}<br><small style="color:var(--text-muted)">${escapeHtml(p.formato || '')}</small></td>
                <td>R$ ${formatPrice(p.preco || 0)}</td>
                <td>${escapeHtml(p.metodo_pagamento || '—')}${p.parcelas > 1 ? `<br><small style="color:var(--text-muted)">${p.parcelas}x</small>` : ''}</td>
                <td>${statusPedidoBadge(p.status)}</td>
                <td>
                    <div class="action-buttons">
                        ${String(p.status || '').toLowerCase() === 'pago' ? '' : `<button class="btn btn-sm btn-success" onclick="marcarPedidoPago(${p.id})"><i class="fas fa-check"></i> Marcar pago</button>`}
                        <button class="btn btn-sm" style="background:#16a34a;color:#fff;" onclick="baixarApostila('${escapeHtml(p.codigo_acesso || '')}')"><i class="fas fa-download"></i> PDF</button>
                        ${p.cliente_email ? `<a class="btn btn-sm" style="background:#25D366;color:#fff;" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Olá ' + (p.cliente_nome || '') + '! Sobre o pedido ' + (p.numero_pedido || '') + ':')}"><i class="fab fa-whatsapp"></i></a>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#DC2626;">Erro ao carregar pedidos: ${escapeHtml(err.message || '')}<br><small>Se a mensagem citar coluna inexistente, rode o arquivo migrations-v2-site-proprio.sql no Supabase.</small></td></tr>`;
    }
}

async function marcarPedidoPago(id) {
    try {
        const { error } = await supabaseClient.from('pedidos').update({ status: 'pago', pago_em: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        showAlert('Pedido marcado como pago e download liberado.', 'success');
        loadPedidosAdmin();
    } catch (err) {
        console.error(err);
        showAlert('Erro ao atualizar pedido: ' + (err.message || err), 'error');
    }
}

async function loadClientesAdmin() {
    const tbody = document.getElementById('clientesTableBody');
    const summary = document.getElementById('clientesSummary');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">Carregando clientes...</td></tr>';

    try {
        const { data, error } = await supabaseClient.from('clientes').select('*').order('criado_em', { ascending: false }).limit(300);
        if (error) throw error;
        const clientes = data || [];

        let pedidosPorEmail = {};
        try {
            const { data: pedidos } = await supabaseClient.from('pedidos').select('cliente_email, preco, status');
            (pedidos || []).forEach(p => {
                const k = String(p.cliente_email || '').toLowerCase();
                if (!k) return;
                pedidosPorEmail[k] = pedidosPorEmail[k] || { qtd: 0, total: 0 };
                pedidosPorEmail[k].qtd += 1;
                if (String(p.status || '').toLowerCase() === 'pago') pedidosPorEmail[k].total += Number(p.preco || 0);
            });
        } catch (e) { console.warn(e); }

        if (summary) summary.textContent = `${clientes.length} cliente(s) cadastrado(s)`;

        if (!clientes.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Nenhum cliente cadastrado ainda.</td></tr>';
            return;
        }

        tbody.innerHTML = clientes.map(c => {
            const info = pedidosPorEmail[String(c.email || '').toLowerCase()] || { qtd: 0, total: 0 };
            return `
                <tr>
                    <td>${escapeHtml(c.nome || '—')}</td>
                    <td>${escapeHtml(c.email || '—')}</td>
                    <td>${escapeHtml(c.telefone || '—')}</td>
                    <td style="white-space:nowrap;">${formatarData(c.criado_em)}</td>
                    <td>${info.qtd} <small style="color:var(--text-muted)">(R$ ${formatPrice(info.total)})</small></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="buscarPedidosDoCliente('${escapeHtml(c.email || '')}')"><i class="fas fa-receipt"></i> Pedidos</button>
                            <a class="btn btn-sm" style="background:#25D366;color:#fff;" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Olá ' + (c.nome || '') + '!')}"><i class="fab fa-whatsapp"></i></a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#DC2626;">Erro ao carregar clientes: ${escapeHtml(err.message || '')}</td></tr>`;
    }
}

function buscarPedidosDoCliente(email) {
    abrirAbaAdmin('vendas');
    const tbody = document.getElementById('vendasTableBody');
    if (!tbody) return;
    supabaseClient.from('pedidos').select('*').ilike('cliente_email', email).order('criado_em', { ascending: false })
        .then(({ data, error }) => {
            if (error) { showAlert('Erro: ' + error.message, 'error'); return; }
            const pedidos = data || [];
            tbody.innerHTML = pedidos.length ? pedidos.map(p => `
                <tr>
                    <td style="font-weight:700;">${escapeHtml(p.numero_pedido || ('#' + p.id))}</td>
                    <td>${formatarData(p.criado_em)}</td>
                    <td>${escapeHtml(p.cliente_nome || '')}</td>
                    <td>${escapeHtml(p.produto_titulo || '')}</td>
                    <td>R$ ${formatPrice(p.preco || 0)}</td>
                    <td>${escapeHtml(p.metodo_pagamento || '')}</td>
                    <td>${statusPedidoBadge(p.status)}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="loadPedidosAdmin()">Voltar</button></td>
                </tr>
            `).join('') : '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">Este cliente ainda não tem pedidos.</td></tr>';
        });
}

/* ==================== UPLOAD DE CAPAS E PDF ==================== */
function handleCoverModeChange() {
    const modoUpload = document.getElementById('capa_modo_upload');
    const usarUpload = modoUpload && modoUpload.checked;
    const urlInput = document.getElementById('product_capa_url');
    const fileInput = document.getElementById('product_capa_file');
    if (urlInput) urlInput.classList.toggle('hidden', usarUpload);
    if (fileInput) fileInput.classList.toggle('hidden', !usarUpload);
}

function onCoverFilePicked(input, urlFieldId, previewId) {
    const file = input.files && input.files[0];
    const preview = document.getElementById(previewId);
    if (!file) { if (preview) preview.classList.add('hidden'); return; }
    if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
    }
}

let V2_CAPACIDADES = null;
async function verificarColunasV2() {
    if (V2_CAPACIDADES !== null) return V2_CAPACIDADES;
    try {
        const { error } = await supabaseClient.from('produtos').select('capa_storage_path, capa_impresso_storage_path, arquivo_pdf_path, tipo_venda').limit(1);
        V2_CAPACIDADES = !error;
        if (error) console.warn('Colunas v2 ausentes em produtos:', error.message);
    } catch (e) { V2_CAPACIDADES = false; }
    return V2_CAPACIDADES;
}

async function prepararCamposV2(productData) {
    const colunasOk = await verificarColunasV2();
    if (colunasOk) return productData;

    ['capa_storage_path', 'capa_impresso_storage_path', 'arquivo_pdf_path', 'tipo_venda'].forEach(campo => {
        delete productData[campo];
    });

    if (productData.tipo_botao === 'proprio') {
        productData.tipo_botao = 'hotmart';
        showAlert('Para vender produto próprio, rode o arquivo migrations-v2-site-proprio.sql no Supabase (a coluna tipo_venda ainda não existe).', 'warning');
    }
    return productData;
}

async function uploadArquivoSupabase(bucket, file, pasta) {
    const nomeSeguro = String(file.name || 'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
    const caminho = `${pasta}/${Date.now()}-${nomeSeguro}`;
    const { error } = await supabaseClient.storage.from(bucket).upload(caminho, file, { cacheControl: '31536000', upsert: true });
    if (error) throw error;
    return caminho;
}

async function processarUploadsProduto() {
    if (typeof supabaseClient === 'undefined') return;

    const capaFile = document.getElementById('product_capa_file');
    const capaImpressoFile = document.getElementById('product_capa_file_impresso');
    const pdfFile = document.getElementById('product_arquivo_pdf_file');
    const temCapa = capaFile && capaFile.files && capaFile.files[0];
    const temCapaImpressa = capaImpressoFile && capaImpressoFile.files && capaImpressoFile.files[0];
    const temPdf = pdfFile && pdfFile.files && pdfFile.files[0];
    if (!temCapa && !temCapaImpressa && !temPdf) return;

    showAlert('Enviando arquivos... aguarde.', 'info');

    if (temCapa) {
        const caminho = await uploadArquivoSupabase(V2_BUCKET_CAPAS, capaFile.files[0], 'capas');
        const { data } = supabaseClient.storage.from(V2_BUCKET_CAPAS).getPublicUrl(caminho);
        const urlInput = document.getElementById('product_capa_url');
        if (urlInput && data && data.publicUrl) urlInput.value = data.publicUrl;
        const pathInput = document.getElementById('product_capa_storage_path');
        if (pathInput) pathInput.value = caminho;
    }

    if (temCapaImpressa) {
        const caminho = await uploadArquivoSupabase(V2_BUCKET_CAPAS, capaImpressoFile.files[0], 'capas-impressas');
        const { data } = supabaseClient.storage.from(V2_BUCKET_CAPAS).getPublicUrl(caminho);
        const urlInput = document.getElementById('product_capa_url_impresso');
        if (urlInput && data && data.publicUrl) urlInput.value = data.publicUrl;
        const pathInput = document.getElementById('product_capa_impresso_storage_path');
        if (pathInput) pathInput.value = caminho;
    }

    if (temPdf) {
        const podeUsarPdf = await verificarColunasV2();
        if (!podeUsarPdf) {
            throw new Error('O bucket/coluna de PDF ainda não existe. Rode o arquivo migrations-v2-site-proprio.sql no Supabase antes de subir o PDF.');
        }
        const caminho = await uploadArquivoSupabase(V2_BUCKET_PDF, pdfFile.files[0], 'apostilas');
        const pathInput = document.getElementById('product_arquivo_pdf_path');
        if (pathInput) pathInput.value = caminho;
    }
}

/* ==================== INICIALIZAÇÃO ==================== */
(function iniciarPatchV2() {
    try {
        injectEstadosNoTopo();
        injectModaisV2();
        injectAdminExtras();

        // Overrides globais: abas do admin e atualizacao das vendas/clientes
        window.switchAdminTab = function (tab, btn) {
            switchAdminTabSeguro(tab, btn || (window.event && window.event.target) || null);
        };

        const loadAdminDataOriginal = window.loadAdminData;
        if (typeof loadAdminDataOriginal === 'function') {
            window.loadAdminData = async function (...args) {
                await loadAdminDataOriginal.apply(this, args);
                await loadPedidosAdmin();
                await loadClientesAdmin();
            };
        }

        const clienteEmail = sessionStorage.getItem('cliente_email');
        const clienteNome = sessionStorage.getItem('cliente_nome');
        if (clienteEmail) {
            const label = document.getElementById('accountButtonLabel');
            if (label) label.textContent = (clienteNome || 'Minha conta').split(' ')[0] || 'Minha conta';
        }
    } catch (err) {
        console.warn('Patch v2 parcialmente carregado:', err);
    }
})();

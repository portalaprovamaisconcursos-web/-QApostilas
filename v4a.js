/* =====================================================================
   +QApostilas — PATCH v4 (parte 1)  — carregue DEPOIS do v2_features.js
   ---------------------------------------------------------------------
   O que este arquivo corrige, de verdade:

   1) UPLOAD DA CAPA/PDF (erro "row-level security"):
      - envia os arquivos ANTES de gravar o formulário (o código antigo
        enviava depois, então a URL nova nunca era salva — bug real);
      - tenta 2 caminhos de envio, mostra o diagnóstico do Storage
        (projeto, bucket, erro cru) para você saber o que corrigir;
      - limpa o campo de arquivo depois do envio (não sobe 2x).

   2) PÁGINA DO PRODUTO: capa corrigida (sem gradiente, sem esticar).

   3) SELETOR DE ESTADOS no topo funcionando (clique abre/fecha).

   O checkout com cartão/Pix/boleto está no v4b.js.
   ===================================================================== */
(function () {
  'use strict';

  var CAPAS = 'apostilas';
  var PDF = 'apostilas-pdf';

  function sb() {
    try { return (typeof supabaseClient !== 'undefined') ? supabaseClient : null; } catch (e) { return null; }
  }
  function aviso(msg, tipo) {
    if (typeof showAlert === 'function') showAlert(msg, tipo || 'info');
    else console.log('[v4]', msg);
  }

  /* ==================== 1) CSS ==================== */
  function injetarCss() {
    if (document.getElementById('v4-css')) return;
    var st = document.createElement('style');
    st.id = 'v4-css';
    st.textContent = [
      /* ---- CAPA: uma única regra, sem gradiente e sem zoom ---- */
      '.product-cover-shell{position:relative!important;width:100%!important;max-width:420px!important;',
      'aspect-ratio:21/29.7!important;background:#fff!important;border:1px solid var(--border)!important;',
      'border-radius:16px!important;box-shadow:0 16px 38px -24px rgba(15,23,42,.45)!important;',
      'overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;}',
      '.product-detail-image{width:100%!important;height:100%!important;aspect-ratio:auto!important;',
      'object-fit:contain!important;padding:8px!important;background:#fff!important;border:0!important;',
      'box-shadow:none!important;border-radius:0!important;transform:none!important;}',
      '.product-detail-image:hover{transform:none!important;}',
      '.v4-capa-selo{position:absolute;top:12px;left:12px;z-index:4;background:#16A34A;color:#fff;',
      'font-size:11px;font-weight:800;letter-spacing:.04em;padding:5px 10px;border-radius:999px;}',
      /* ---- Selos de pagamento ---- */
      '.v4-pag-lista{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 2px;}',
      '.v4-pag-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);',
      'border-radius:999px;padding:5px 10px;font-size:11.5px;font-weight:700;background:#fff;color:#334155;}',
      '.v4-pag-chip i{color:var(--primary);}',
      '.v4-trust{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}',
      '.v4-trust div{border:1px solid var(--border);border-radius:12px;padding:10px 8px;text-align:center;',
      'font-size:11.5px;color:var(--text-muted);background:#fbfdff;}',
      '.v4-trust i{display:block;font-size:16px;color:var(--primary);margin-bottom:5px;}',
      '.v4-migalha{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12.5px;color:var(--text-muted);margin-bottom:14px;}',
      '.v4-migalha a{color:var(--primary);font-weight:600;text-decoration:none;}',
      /* ---- Checkout ---- */
      '.v4-etapa{display:flex;gap:8px;margin-bottom:14px;}',
      '.v4-etapa span{flex:1;text-align:center;font-size:12px;font-weight:700;padding:7px;border-radius:999px;',
      'background:#eef2f7;color:#64748b;}',
      '.v4-etapa span.on{background:var(--primary);color:#fff;}',
      '.v4-brick{border:1px solid var(--border);border-radius:14px;padding:8px;background:#fff;min-height:60px;}',
      '.v4-qr{text-align:center;border:2px dashed var(--success);border-radius:16px;padding:14px;background:#f4fff8;margin-top:14px;}',
      '.v4-qr img{width:220px;max-width:100%;background:#fff;border-radius:12px;padding:6px;}',
      '.v4-copia{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap;justify-content:center;}',
      '.v4-copia code{background:#f1f5f9;padding:8px 10px;border-radius:8px;word-break:break-all;font-size:12px;max-width:100%;}',
      '.v4-msg{border-radius:12px;padding:12px;font-size:13.5px;margin-top:12px;line-height:1.5;}',
      '.v4-msg.ok{background:#f0fdf4;border:1px solid #86efac;color:#166534;}',
      '.v4-msg.erro{background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;}',
      '.v4-msg.aviso{background:#fffbeb;border:1px solid #fcd34d;color:#92400e;}',
      /* ---- Estados: garante que o dropdown abre ---- */
      '.dropdown.v4-open>.dropdown-menu,.dropdown-secondary.v4-open>.dropdown-secondary-menu{',
      'display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}',
      '.states-section{display:none!important;}',
      '@media (max-width:640px){.v4-trust{grid-template-columns:1fr;}}'
    ].join('');
    document.head.appendChild(st);
  }

  /* ==================== 2) SELETOR DE ESTADOS ==================== */
  function ligarEstados() {
    document.addEventListener('click', function (ev) {
      var alvo = ev.target;
      var box = alvo.closest ? alvo.closest('.dropdown, .dropdown-secondary') : null;
      if (box) {
        var temEstados = box.querySelector('#estadosDropdown, #estadosDropdown2');
        if (temEstados) {
          ev.preventDefault();
          var aberto = box.classList.contains('v4-open');
          document.querySelectorAll('.dropdown.v4-open,.dropdown-secondary.v4-open')
            .forEach(function (el) { el.classList.remove('v4-open'); });
          if (!aberto) box.classList.add('v4-open');
          return;
        }
      }
      document.querySelectorAll('.dropdown.v4-open,.dropdown-secondary.v4-open')
        .forEach(function (el) { el.classList.remove('v4-open'); });
    }, false);
  }

  /* ==================== 3) UPLOAD CORRIGIDO ==================== */
  function nomeSeguro(nome) {
    return String(nome || 'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-');
  }

  async function enviarArquivo(bucket, file, pasta) {
    var caminho = pasta + '/' + Date.now() + '-' + nomeSeguro(file.name);
    var r1 = await sb().storage.from(bucket).upload(caminho, file, {
      cacheControl: '31536000', contentType: file.type || undefined, upsert: true
    });
    if (!r1.error) return caminho;

    // 2ª tentativa: sem upsert (projetos que só têm policy de INSERT)
    var caminho2 = pasta + '/envio-' + Date.now() + '-' + nomeSeguro(file.name);
    var r2 = await sb().storage.from(bucket).upload(caminho2, file, {
      cacheControl: '31536000', contentType: file.type || undefined, upsert: false
    });
    if (!r2.error) return caminho2;

    var err = r2.error || r1.error;
    err.v4Bucket = bucket;
    err.v4Caminho = caminho;
    throw err;
  }

  async function diagnosticoStorage(err) {
    var linhas = [];
    var url = '(não encontrada)';
    try {
      url = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) ||
            (typeof SUPABASE_CONFIG !== 'undefined' && (SUPABASE_CONFIG.url || SUPABASE_CONFIG.SUPABASE_URL)) ||
            (window.SUPABASE_URL || '(veja supabase-config.js)');
    } catch (e) { /* ignora */ }
    linhas.push('Projeto Supabase: ' + url);
    linhas.push('Bucket do envio: ' + ((err && err.v4Bucket) || '?'));
    linhas.push('Erro cru do Supabase: ' + String((err && (err.message || err)) || err));
    try {
      var r = await sb().storage.listBuckets();
      var nomes = (r.data || []).map(function (b) { return b.id + (b.public ? ' (público)' : ' (privado)'); });
      linhas.push('Buckets que este site enxerga: ' + (nomes.length ? nomes.join(', ') : 'NENHUM'));
    } catch (e) {
      linhas.push('Buckets: não foi possível listar (' + (e.message || e) + ')');
    }
    linhas.push('Se o bucket "apostilas" não aparece na lista acima, o SQL foi rodado em outro projeto.');
    console.warn('[v4] diagnóstico do Storage:\n' + linhas.join('\n'));
    aviso('Falha no envio de arquivo: ' + String((err && (err.message || err)) || err) +
          ' | Projeto: ' + url + ' | Detalhes do Storage no console (F12). ' +
          'Rode o arquivo storage-policies-v4.sql no MESMO projeto do site.', 'error');
  }

  async function enviarArquivosDoProduto() {
    if (!sb()) return;
    var capa = document.getElementById('product_capa_file');
    var capaImp = document.getElementById('product_capa_file_impresso');
    var pdf = document.getElementById('product_arquivo_pdf_file');
    var fCapa = capa && capa.files && capa.files[0];
    var fImp = capaImp && capaImp.files && capaImp.files[0];
    var fPdf = pdf && pdf.files && pdf.files[0];
    if (!fCapa && !fImp && !fPdf) return;

    aviso('Enviando arquivo(s)... aguarde.', 'info');

    if (fCapa) {
      var c1 = await enviarArquivo(CAPAS, fCapa, 'capas');
      var pub1 = sb().storage.from(CAPAS).getPublicUrl(c1);
      var u1 = document.getElementById('product_capa_url');
      var p1 = document.getElementById('product_capa_storage_path');
      if (u1 && pub1 && pub1.data) u1.value = pub1.data.publicUrl;
      if (p1) p1.value = c1;
      if (capa) capa.value = '';
    }
    if (fImp) {
      var c2 = await enviarArquivo(CAPAS, fImp, 'capas-impressas');
      var pub2 = sb().storage.from(CAPAS).getPublicUrl(c2);
      var u2 = document.getElementById('product_capa_url_impresso');
      var p2 = document.getElementById('product_capa_impresso_storage_path');
      if (u2 && pub2 && pub2.data) u2.value = pub2.data.publicUrl;
      if (p2) p2.value = c2;
      if (capaImp) capaImp.value = '';
    }
    if (fPdf) {
      var c3 = await enviarArquivo(PDF, fPdf, 'apostilas');
      var p3 = document.getElementById('product_arquivo_pdf_path');
      if (p3) p3.value = c3;
      if (pdf) pdf.value = '';
    }
  }

  function interceptarSubmitDoProduto() {
    document.addEventListener('submit', function (ev) {
      var form = ev.target;
      if (!form || form.id !== 'productForm') return;
      ev.preventDefault();
      ev.stopPropagation(); // o handler antigo não roda: nada de upload em dobro
      (async function () {
        try {
          await enviarArquivosDoProduto();
        } catch (err) {
          console.error(err);
          await diagnosticoStorage(err);
          return;
        }
        if (typeof window.saveProduct === 'function') {
          window.saveProduct({
            preventDefault: function () {},
            stopPropagation: function () {},
            target: form,
            currentTarget: form
          });
        }
      })();
    }, true);
  }

  /* ==================== 4) INICIALIZAÇÃO ==================== */
  function iniciar() {
    try {
      injetarCss();
      ligarEstados();
      interceptarSubmitDoProduto();
    } catch (e) {
      console.warn('[v4a]', e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

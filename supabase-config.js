// =========================================================================
// +QApostilas — supabase-config.js  (mantenha EXATAMENTE este nome)
// =========================================================================
// Onde pegar:
//   1) Supabase › Project Settings › API
//   2) Project URL  -> SUPABASE_URL
//   3) anon public key (sb_publishable_... ou "anon" legacy) -> SUPABASE_ANON_KEY
//
// ⚠️ Esta chave é PÚBLICA (vai no navegador), é seguro deixar aqui.
//    O ACCESS TOKEN do Mercado Pago NUNCA entra aqui — ele vive só
//    nas variáveis de ambiente do Vercel (MP_ACCESS_TOKEN).
// =========================================================================

const SUPABASE_URL = 'https://cjawxciaybhgabxrrtdh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FxH-lFqnf-q0n_mq8sGqTg_eXN23k3Z';

// Cria o client e deixa GLOBAL (para o index.html usar)
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase client carregado:', !!window.supabaseClient);

// =========================================================================
// +QApostilas — config do Checkout próprio (Mercado Pago)
// =========================================================================
// O Access Token NÃO fica aqui — ele está nas variáveis de ambiente do Vercel
// (Settings › Environment Variables › MP_ACCESS_TOKEN).
//
// O que o painel admin salva em site_config:
//   chaves:
//     - mercadopago_public_key       (APP_USR-... de Produção, ou TEST-... de teste)
//     - mercadopago_parcelas         (nº máximo de parcelas sem juros; padrão 12)
//     - mercadopago_metodos          ("cartao,debito,pix,boleto" - liga/desliga)
//     - pix_link_padrao              (link de pagamento fixo opcional p/ Pix)
//
// Estas chaves são lidas em appState.config. No admin (Configs › Checkout),
// cole a public key e clique em Salvar. Pronto.
// =========================================================================

// ============================================================================
// supabase-config.js — +QApostilas (v3.2)
// AVISO: este arquivo é público (vai para o navegador do visitante).
// NUNCA coloque aqui: Access Token do Mercado Pago, chave service_role ou senhas.
// ============================================================================
const SUPABASE_URL = 'https://cjawxciaybhgabxrrtdh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FxH-lFqnf-q0n_mq8sGqTg_eXN23k3Z';

if (!window.supabase || !window.supabase.createClient) {
  console.error('Supabase JS ainda não carregou. Verifique a ordem do <script> no index.html.');
}
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

window.APP_CONFIG = {
  // 'link'  -> tenta gerar um LINK ÚNICO do pedido no Mercado Pago (Checkout Pro,
  //            via /api/mp-checkout). Se a Vercel ainda não tiver as variáveis
  //            de ambiente, cai automaticamente para o link fixo do produto/painel
  //            e, se não houver nenhum, mostra o Pix.
  // 'api'   -> igual, porém mostra erro caso a API não esteja configurada.
  checkout_modo: 'api',
  mp_parcelas_max: 6,
  storage_bucket_capas: 'capas',
  storage_bucket_pdfs: 'apostilas-pdf',
  site_url: 'https://www.maisqapostilas.com.br'
};

console.log('Supabase client pronto:', !!window.supabaseClient);

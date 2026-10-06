// supabase-config.js

// Coloque aqui os dados do seu projeto (Settings > API no Supabase)
const SUPABASE_URL = 'https://cjawxciaybhgabxrrtdh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FxH-lFqnf-q0n_mq8sGqTg_eXN23k3Z';

// Cria o client e deixa GLOBAL (para o index.html usar)
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// (opcional) log de debug
console.log('✅ Supabase client carregado:', !!window.supabaseClient);

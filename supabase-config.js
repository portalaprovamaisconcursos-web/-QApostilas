const SUPABASE_URL = 'https://cjawxciaybhgabxrrtdh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FxH-lFqnf-q0n_mq8sGqTg_eXN23k3Z';
    // Criar cliente Supabase
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase configurado e conectado!');
}

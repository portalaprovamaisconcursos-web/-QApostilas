// ==================== CONFIGURAÇÃO DO SUPABASE ====================
// 
// INSTRUÇÕES:
// 1. Acesse https://supabase.com e crie uma conta gratuita
// 2. Crie um novo projeto
// 3. Vá em Settings > API
// 4. Copie a "Project URL" e cole no lugar de 'SUA_URL_AQUI'
// 5. Copie a "anon public" key e cole no lugar de 'SUA_KEY_AQUI'
// 6. Execute o script database-schema.sql no SQL Editor do Supabase
// 7. Salve este arquivo
//
// IMPORTANTE: 
// - Nunca compartilhe sua anon key publicamente em repositórios públicos
// - A anon key é segura para uso no frontend pois está protegida pelo RLS (Row Level Security)
// - Para produção, configure políticas de segurança adequadas no Supabase
//

const SUPABASE_URL = 'https://cjawxciaybhgabxrrtdh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FxH-lFqnf-q0n_mq8sGqTg_eXN23k3Z';

// Verificar se as credenciais foram configuradas
if (SUPABASE_URL === 'https://cjawxciaybhgabxrrtdh.supabase.co' || SUPABASE_ANON_KEY === 'sb_publishable_FxH-lFqnf-q0n_mq8sGqTg_eXN23k3Z') {
    console.warn('⚠️ Supabase não configurado! Configure as credenciais no arquivo supabase-config.js');
    console.info('📖 Leia o README.md para instruções detalhadas de configuração');
    // O site funcionará com dados de demonstração
} else {
    // Criar cliente Supabase
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase configurado e conectado!');
}

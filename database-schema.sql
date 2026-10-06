-- ==================== SCHEMA DO BANCO DE DADOS - +QAPOSTILAS ====================
-- 
-- INSTRUÇÕES PARA EXECUTAR:
-- 1. Acesse seu projeto no Supabase (https://supabase.com)
-- 2. Vá em "SQL Editor" no menu lateral
-- 3. Clique em "New Query"
-- 4. Cole TODO este código SQL
-- 5. Clique em "Run" para executar
-- 6. Aguarde a confirmação de sucesso
--
-- Este script irá criar todas as tabelas necessárias e inserir dados padrão
--

-- ==================== LIMPAR TABELAS EXISTENTES (opcional) ====================
-- Descomente as linhas abaixo se quiser recriar as tabelas do zero
-- DROP TABLE IF EXISTS depoimentos CASCADE;
-- DROP TABLE IF EXISTS produtos CASCADE;
-- DROP TABLE IF EXISTS categorias CASCADE;
-- DROP TABLE IF EXISTS site_config CASCADE;

-- ==================== TABELA DE CONFIGURAÇÕES DO SITE ====================
CREATE TABLE IF NOT EXISTS site_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações padrão (apenas se não existirem)
INSERT INTO site_config (key, value) 
VALUES
  ('logo_url', ''),
  ('banner_url', ''),
  ('banner_height', '300'),
  ('banner_autoplay_seconds', '5'),
  ('banner_1_image_url', ''),
  ('banner_1_mobile_url', ''),
  ('banner_1_product_ref', ''),
  ('banner_1_link_url', ''),
  ('banner_2_image_url', ''),
  ('banner_2_mobile_url', ''),
  ('banner_2_product_ref', ''),
  ('banner_2_link_url', ''),
  ('banner_3_image_url', ''),
  ('banner_3_mobile_url', ''),
  ('banner_3_product_ref', ''),
  ('banner_3_link_url', ''),
  ('banner_title', 'Apostilas Atualizadas para Concursos Públicos'),
  ('banner_subtitle', 'Material 100% digital, conforme último edital'),
  ('whatsapp', '5511999999999'),
  ('email', 'contato@qapostilas.com.br'),
  ('sobre_nos', 'Somos especializados em apostilas para concursos públicos. Todo nosso material é cuidadosamente preparado e atualizado conforme os editais mais recentes. Nossa missão é ajudar você a conquistar a tão sonhada aprovação com material de qualidade e sempre atualizado.'),
  ('admin_password', 'admin123')
ON CONFLICT (key) DO NOTHING;

-- ==================== TABELA DE CATEGORIAS ====================
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icone TEXT,
  ordem INT DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO categorias (nome, slug, icone, ordem, ativo) 
VALUES
  ('Prefeituras', 'prefeituras', 'fa-city', 1, TRUE),
  ('Área Policial', 'policial', 'fa-shield-halved', 2, TRUE),
  ('Área Saúde', 'saude', 'fa-heart-pulse', 3, TRUE),
  ('Bancos', 'bancos', 'fa-building-columns', 4, TRUE),
  ('Educação', 'educacao', 'fa-graduation-cap', 5, TRUE),
  ('Administrativo', 'administrativo', 'fa-briefcase', 6, TRUE),
  ('Pré-venda', 'pre-venda', 'fa-clock', 7, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ==================== TABELA DE PRODUTOS (APOSTILAS) ====================
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  orgao TEXT NOT NULL,
  cargo TEXT NOT NULL,
  estado TEXT,
  cidade TEXT,
  descricao TEXT,
  capa_url TEXT,
  paginas INT,
  preco DECIMAL(10,2),
  preco_original DECIMAL(10,2),
  conteudo_programatico TEXT,
  atualizado_edital BOOLEAN DEFAULT TRUE,
  tipo_botao TEXT DEFAULT 'hotmart',
  link_compra TEXT NOT NULL,
  categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
  destaque BOOLEAN DEFAULT FALSE,
  lancamento BOOLEAN DEFAULT FALSE,
  mais_vendida BOOLEAN DEFAULT FALSE,
  pre_venda BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  avaliacao_media DECIMAL(3,2) DEFAULT 5.0,
  total_avaliacoes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir produto de demonstração
INSERT INTO produtos (
  titulo, 
  slug, 
  orgao, 
  cargo, 
  estado, 
  cidade, 
  descricao, 
  capa_url, 
  paginas, 
  preco, 
  preco_original, 
  conteudo_programatico, 
  atualizado_edital, 
  tipo_botao, 
  link_compra, 
  categoria_id, 
  destaque, 
  lancamento, 
  mais_vendida, 
  ativo, 
  avaliacao_media, 
  total_avaliacoes
)
VALUES
  (
    'Apostila Completa - Agente Administrativo',
    'apostila-agente-administrativo-sp',
    'Prefeitura Municipal de São Paulo',
    'Agente Administrativo',
    'SP',
    'São Paulo',
    'Apostila completa e atualizada para o cargo de Agente Administrativo da Prefeitura de São Paulo. Material preparado conforme o último edital publicado, com conteúdo teórico, exercícios e questões comentadas. Ideal para quem busca aprovação em concursos municipais.',
    'https://via.placeholder.com/300x400/1E90FF/FFFFFF?text=Apostila+Agente+Administrativo',
    450,
    49.90,
    79.90,
    'Língua Portuguesa
Interpretação de Textos
Gramática e Ortografia
Matemática
Operações Básicas
Porcentagem e Juros
Informática
Windows e Linux
Microsoft Office
Navegadores e E-mail
Direito Administrativo
Princípios da Administração Pública
Atos Administrativos
Servidores Públicos
Direito Constitucional
Direitos e Garantias Fundamentais
Organização do Estado
Administração Pública
Atualidades
Conhecimentos Gerais
Temas Atuais
Política e Economia',
    TRUE,
    'hotmart',
    'https://pay.hotmart.com/exemplo-produto',
    6,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    4.8,
    124
  ),
  (
    'Apostila Soldado PM - Polícia Militar',
    'apostila-soldado-pm',
    'Polícia Militar do Estado',
    'Soldado PM',
    'RJ',
    'Rio de Janeiro',
    'Material completo para concurso de Soldado da Polícia Militar. Conteúdo atualizado conforme último edital, com teoria, exercícios e simulados. Prepare-se para a carreira militar com material de qualidade.',
    'https://via.placeholder.com/300x400/0066CC/FFFFFF?text=PM+Soldado',
    520,
    59.90,
    89.90,
    'Língua Portuguesa
Matemática
História do Brasil
Geografia do Brasil
Legislação Específica
Direitos Humanos
Ética e Cidadania',
    TRUE,
    'hotmart',
    'https://pay.hotmart.com/exemplo-pm',
    2,
    TRUE,
    FALSE,
    TRUE,
    TRUE,
    4.9,
    256
  ),
  (
    'Apostila Técnico de Enfermagem - SUS',
    'apostila-tecnico-enfermagem-sus',
    'Secretaria Municipal de Saúde',
    'Técnico de Enfermagem',
    'MG',
    'Belo Horizonte',
    'Apostila específica para Técnico de Enfermagem do SUS. Material completo com conhecimentos específicos da área de saúde, legislação do SUS e conhecimentos básicos. Atualizada conforme as diretrizes mais recentes.',
    'https://via.placeholder.com/300x400/22C55E/FFFFFF?text=Enfermagem',
    380,
    44.90,
    69.90,
    'Conhecimentos Básicos de Saúde
Legislação do SUS
Políticas de Saúde Pública
Enfermagem Geral
Anatomia e Fisiologia
Procedimentos de Enfermagem
Biossegurança
Ética Profissional
Código de Ética de Enfermagem',
    TRUE,
    'parceiro',
    'https://www.exemplo-parceiro.com.br/apostila-enfermagem',
    3,
    FALSE,
    FALSE,
    FALSE,
    TRUE,
    4.7,
    89
  ),
  (
    'Apostila Escriturário - Banco do Brasil (PRÉ-VENDA)',
    'apostila-escriturario-bb-pre-venda',
    'Banco do Brasil',
    'Escriturário',
    'Nacional',
    '',
    'Em breve! Apostila completa para o concurso de Escriturário do Banco do Brasil. Garanta já a sua com desconto especial de pré-venda. Material será disponibilizado assim que o edital for publicado.',
    'https://via.placeholder.com/300x400/FFD700/000000?text=BB+Pre-Venda',
    500,
    69.90,
    99.90,
    'Língua Portuguesa
Língua Inglesa
Matemática e Raciocínio Lógico
Conhecimentos Bancários
Atualidades do Mercado Financeiro
Informática
Vendas e Marketing
Atendimento ao Cliente',
    TRUE,
    'hotmart',
    'https://pay.hotmart.com/exemplo-bb-prevenda',
    4,
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    5.0,
    0
  )
ON CONFLICT (slug) DO NOTHING;

-- ==================== TABELA DE DEPOIMENTOS ====================
CREATE TABLE IF NOT EXISTS depoimentos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo_aprovado TEXT,
  texto TEXT NOT NULL,
  foto_url TEXT,
  avaliacao INT DEFAULT 5 CHECK (avaliacao >= 1 AND avaliacao <= 5),
  destaque BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir depoimentos de demonstração
INSERT INTO depoimentos (nome, cargo_aprovado, texto, foto_url, avaliacao, destaque, ativo)
VALUES
  (
    'Maria Silva Santos',
    'Técnica Administrativa - Prefeitura de São Paulo',
    'Material excelente! Consegui minha aprovação estudando com as apostilas da +QApostilas. O conteúdo é muito bem organizado e atualizado. Recomendo muito para quem está se preparando para concursos!',
    'https://via.placeholder.com/60/22C55E/FFFFFF?text=MS',
    5,
    TRUE,
    TRUE
  ),
  (
    'João Pedro Oliveira',
    'Soldado PM - Polícia Militar RJ',
    'Excelente material de estudo! A apostila me ajudou muito na preparação para o concurso da PM. Conteúdo completo e didático. Valeu cada centavo investido. Hoje sou Soldado PM graças ao material de vocês!',
    'https://via.placeholder.com/60/1E90FF/FFFFFF?text=JP',
    5,
    TRUE,
    TRUE
  ),
  (
    'Ana Carolina Ferreira',
    'Agente Administrativo - TJ-SP',
    'Material de altíssima qualidade! Sempre atualizado conforme os editais. A equipe está de parabéns pela dedicação e comprometimento. Consegui minha aprovação no TJ-SP estudando exclusivamente com as apostilas daqui.',
    'https://via.placeholder.com/60/FF6B6B/FFFFFF?text=AC',
    5,
    TRUE,
    TRUE
  ),
  (
    'Carlos Eduardo Souza',
    'Técnico de Enfermagem - SUS BH',
    'Apostila completa e bem estruturada. O conteúdo programático está perfeito e cobre tudo que caiu na prova. Recomendo para todos que estão estudando para concursos na área da saúde!',
    'https://via.placeholder.com/60/9B59B6/FFFFFF?text=CE',
    4,
    FALSE,
    TRUE
  ),
  (
    'Juliana Mendes Costa',
    'Professora - Secretaria de Educação',
    'Estou muito satisfeita com a apostila que adquiri. Material completo, atualizado e com preço justo. A entrega foi imediata após o pagamento. Site confiável e apostilas de qualidade. Aprovada e feliz!',
    'https://via.placeholder.com/60/3498DB/FFFFFF?text=JM',
    5,
    FALSE,
    TRUE
  ),
  (
    'Rafael Almeida Lima',
    'Agente de Polícia Federal',
    'Melhor investimento que fiz na minha preparação! As apostilas são atualizadas, completas e com linguagem clara. Consegui minha aprovação no concurso da PF e agradeço à equipe da +QApostilas por todo suporte.',
    'https://via.placeholder.com/60/E67E22/FFFFFF?text=RA',
    5,
    TRUE,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- ==================== HABILITAR ROW LEVEL SECURITY (RLS) ====================
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;

-- ==================== POLÍTICAS DE SEGURANÇA ====================

-- Políticas de LEITURA pública (todos podem visualizar)
DROP POLICY IF EXISTS "public_read_config" ON site_config;
CREATE POLICY "public_read_config" 
  ON site_config FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "public_read_categorias" ON categorias;
CREATE POLICY "public_read_categorias" 
  ON categorias FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "public_read_produtos" ON produtos;
CREATE POLICY "public_read_produtos" 
  ON produtos FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "public_read_depoimentos" ON depoimentos;
CREATE POLICY "public_read_depoimentos" 
  ON depoimentos FOR SELECT 
  USING (true);

-- Políticas de ESCRITA (INSERT, UPDATE, DELETE)
-- IMPORTANTE: Em produção, você deve configurar autenticação adequada
-- Por enquanto, permitimos todas as operações com anon key para facilitar o desenvolvimento

DROP POLICY IF EXISTS "admin_all_config" ON site_config;
CREATE POLICY "admin_all_config" 
  ON site_config FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all_categorias" ON categorias;
CREATE POLICY "admin_all_categorias" 
  ON categorias FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all_produtos" ON produtos;
CREATE POLICY "admin_all_produtos" 
  ON produtos FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all_depoimentos" ON depoimentos;
CREATE POLICY "admin_all_depoimentos" 
  ON depoimentos FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ==================== ÍNDICES PARA MELHOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_estado ON produtos(estado);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque ON produtos(destaque);
CREATE INDEX IF NOT EXISTS idx_produtos_lancamento ON produtos(lancamento);
CREATE INDEX IF NOT EXISTS idx_produtos_mais_vendida ON produtos(mais_vendida);
CREATE INDEX IF NOT EXISTS idx_produtos_pre_venda ON produtos(pre_venda);

-- ==================== FUNÇÕES AUXILIARES ====================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em site_config
DROP TRIGGER IF EXISTS update_site_config_updated_at ON site_config;
CREATE TRIGGER update_site_config_updated_at
    BEFORE UPDATE ON site_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em produtos
DROP TRIGGER IF EXISTS update_produtos_updated_at ON produtos;
CREATE TRIGGER update_produtos_updated_at
    BEFORE UPDATE ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== CONCLUÍDO! ====================
-- 
-- ✅ Todas as tabelas foram criadas com sucesso!
-- ✅ Dados de demonstração foram inseridos
-- ✅ Políticas de segurança (RLS) foram configuradas
-- ✅ Índices para melhor performance foram criados
--
-- PRÓXIMOS PASSOS:
-- 1. Atualize o arquivo supabase-config.js com suas credenciais
-- 2. Acesse o painel admin do site com a senha: admin123
-- 3. Comece a cadastrar seus produtos!
--
-- SENHA ADMIN PADRÃO: admin123
-- ⚠️ IMPORTANTE: Altere a senha admin através do painel de configurações!
--

-- ==================== MIGRAÇÕES SEGURAS (NÃO APAGAM DADOS EXISTENTES) ====================
-- Atualiza o schema para acompanhar o painel administrativo atual e os novos recursos de código/duplicação.

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS imagem_url TEXT;

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS categoria_id_2 INT REFERENCES categorias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS capa_url_impresso TEXT,
  ADD COLUMN IF NOT EXISTS preco_impresso DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS parcelas INT,
  ADD COLUMN IF NOT EXISTS parcelas_impresso INT,
  ADD COLUMN IF NOT EXISTS codigo TEXT,
  ADD COLUMN IF NOT EXISTS codigo_origem TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS tipo_editorial TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS sigla_concurso TEXT;

CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_codigo_unique ON produtos(codigo) WHERE codigo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_2 ON produtos(categoria_id_2);

UPDATE produtos
SET codigo_origem = COALESCE(codigo_origem, 'manual')
WHERE codigo_origem IS NULL;


UPDATE produtos
SET tipo_editorial = COALESCE(tipo_editorial, 'normal')
WHERE tipo_editorial IS NULL;

-- ================================================================================
-- ==================== v2.0 — VENDA DIRETA + ÁREA DO ALUNO + PEDIDOS =============
-- ================================================================================
-- Este bloco NÃO apaga nada: pode ser executado por cima do schema atual.
-- Cole TODO este conteúdo no SQL Editor do Supabase e clique em "Run".
-- ================================================================================

-- ==================== 1) NOVAS CONFIGURAÇÕES DO SITE ====================
INSERT INTO site_config (key, value)
VALUES
  ('checkout_modo', 'link'),        -- 'link' = link de pagamento do Mercado Pago | 'api' = Checkout Pro via /api/mp-checkout
  ('mp_link_pagamento', ''),        -- link de pagamento padrão do site (https://mpago.la/...)
  ('mp_pix_chave', ''),             -- chave Pix para recebimento direto
  ('mp_parcelas_max', '6'),         -- limite de parcelas no cartão de crédito
  ('mp_pix_ativo', 'true'),
  ('mp_credito_ativo', 'true'),
  ('mp_debito_ativo', 'true'),
  ('mp_boleto_ativo', 'false'),     -- boleto desativado (conforme solicitado)
  ('area_aluno_ativa', 'true')
ON CONFLICT (key) DO NOTHING;

-- ==================== 2) PRODUTOS: CAPA POR UPLOAD + VENDA DIRETA ====================
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS capa_origem TEXT DEFAULT 'link',              -- 'link' | 'upload'
  ADD COLUMN IF NOT EXISTS capa_storage_path TEXT,                       -- caminho no bucket 'capas'
  ADD COLUMN IF NOT EXISTS capa_impresso_origem TEXT DEFAULT 'link',
  ADD COLUMN IF NOT EXISTS capa_impresso_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS venda_direta BOOLEAN DEFAULT FALSE,           -- TRUE = compra no próprio site
  ADD COLUMN IF NOT EXISTS permite_parcelamento BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS mp_link_pagamento TEXT;                       -- link de pagamento específico do produto

CREATE INDEX IF NOT EXISTS idx_produtos_capa_origem ON produtos(capa_origem);
CREATE INDEX IF NOT EXISTS idx_produtos_venda_direta ON produtos(venda_direta);

-- ==================== 3) CLIENTES / ALUNOS ====================
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- conta criada na Área do Aluno (Supabase Auth)
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cpf TEXT,
  estado TEXT,
  perfil TEXT DEFAULT 'aluno',               -- 'aluno' | 'cliente'
  aprovacao_pendente BOOLEAN DEFAULT FALSE,
  data_nascimento DATE,
  aceita_marketing BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);

-- ==================== 4) PEDIDOS (venda direta + Hotmart + parceiros) ====================
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE,                                  -- ex: 00401905 (gerado automaticamente)
  cliente_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  cliente_email TEXT,
  cliente_cpf TEXT,
  cliente_telefone TEXT,
  produto_id INT REFERENCES produtos(id) ON DELETE SET NULL,
  produto_titulo TEXT,
  produto_codigo TEXT,
  formato TEXT DEFAULT 'digital',                      -- 'digital' | 'impressa'
  origem TEXT DEFAULT 'site',                          -- 'site' | 'hotmart' | 'parceiro' | 'manual'
  tipo TEXT DEFAULT 'venda',                           -- 'venda' | 'pre_venda'
  status TEXT DEFAULT 'aguardando_pagamento',          -- ver CHECK abaixo
  valor NUMERIC(10,2) DEFAULT 0,
  frete NUMERIC(10,2) DEFAULT 0,
  cupom TEXT,
  cupom_desconto NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  forma_pagamento TEXT,                                -- 'pix' | 'credito' | 'debito' | 'boleto' | 'externo'
  parcelas INT DEFAULT 1,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  envio_status TEXT DEFAULT '--',                      -- '--' | 'digital' | 'transportadora'
  rastreio TEXT,
  observacoes TEXT,
  pago_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pedidos_status_check CHECK (status IN (
    'aguardando_pagamento','em_analise','pagamento_confirmado',
    'em_andamento','entregue_transportadora','entregue','cancelado'
  ))
);

CREATE INDEX IF NOT EXISTS idx_pedidos_user ON pedidos(cliente_user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_email ON pedidos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_pedidos_cpf ON pedidos(cliente_cpf);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_produto ON pedidos(produto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp ON pedidos(mp_payment_id);

-- Numeração sequencial dos pedidos (começa em 00401906, no padrão do painel)
CREATE SEQUENCE IF NOT EXISTS pedido_codigo_seq START WITH 401906;

CREATE OR REPLACE FUNCTION set_pedido_codigo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := LPAD(nextval('pedido_codigo_seq')::TEXT, 8, '0');
  END IF;
  IF NEW.total IS NULL OR NEW.total = 0 THEN
    NEW.total := COALESCE(NEW.valor, 0) + COALESCE(NEW.frete, 0) - COALESCE(NEW.cupom_desconto, 0);
  END IF;
  IF NEW.envio_status IS NULL THEN
    NEW.envio_status := CASE WHEN NEW.formato = 'impressa' THEN 'transportadora' ELSE 'digital' END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pedido_codigo ON pedidos;
CREATE TRIGGER trg_pedido_codigo
  BEFORE INSERT ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_pedido_codigo();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== 5) CUPONS ====================
CREATE TABLE IF NOT EXISTS cupons (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT DEFAULT 'percentual',        -- 'percentual' | 'fixo'
  valor NUMERIC(10,2) DEFAULT 0,
  valor_minimo NUMERIC(10,2) DEFAULT 0,
  uso_maximo INT,
  usos INT DEFAULT 0,
  valido_de DATE,
  valido_ate DATE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 6) LOG DE EVENTOS DO MERCADO PAGO ====================
CREATE TABLE IF NOT EXISTS mp_eventos (
  id SERIAL PRIMARY KEY,
  mp_id TEXT,
  topic TEXT,
  pedido_id INT,
  status_mp TEXT,
  payload JSONB,
  recebido_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_eventos_mp_id ON mp_eventos(mp_id);

-- ==================== 7) ROW LEVEL SECURITY ====================
ALTER TABLE clientes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_eventos ENABLE ROW LEVEL SECURITY;

-- ---------- clientes ----------
DROP POLICY IF EXISTS "cliente_select_own" ON clientes;
CREATE POLICY "cliente_select_own" ON clientes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cliente_insert_own" ON clientes;
CREATE POLICY "cliente_insert_own" ON clientes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cliente_update_own" ON clientes;
CREATE POLICY "cliente_update_own" ON clientes FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Painel administrativo (ainda usa a chave anon + senha do site)
DROP POLICY IF EXISTS "admin_all_clientes" ON clientes;
CREATE POLICY "admin_all_clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);

-- ---------- pedidos ----------
-- Aluno logado vê os próprios pedidos (por user_id OU pelo e-mail da conta)
DROP POLICY IF EXISTS "pedido_select_own" ON pedidos;
CREATE POLICY "pedido_select_own" ON pedidos FOR SELECT
  USING (auth.uid() = cliente_user_id OR cliente_email = (auth.jwt() ->> 'email'));

-- Checkout / registro de compra (visitante e aluno)
DROP POLICY IF EXISTS "pedido_insert_public" ON pedidos;
CREATE POLICY "pedido_insert_public" ON pedidos FOR INSERT WITH CHECK (true);

-- Ao entrar na Área do Aluno, o aluno vincula os pedidos antigos feitos com o mesmo e-mail
DROP POLICY IF EXISTS "pedido_update_own" ON pedidos;
CREATE POLICY "pedido_update_own" ON pedidos FOR UPDATE
  USING (auth.uid() = cliente_user_id OR cliente_email = (auth.jwt() ->> 'email'))
  WITH CHECK (auth.uid() = cliente_user_id OR cliente_email = (auth.jwt() ->> 'email'));

-- Painel administrativo
DROP POLICY IF EXISTS "admin_all_pedidos" ON pedidos;
CREATE POLICY "admin_all_pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);

-- ---------- cupons / eventos ----------
DROP POLICY IF EXISTS "public_read_cupons" ON cupons;
CREATE POLICY "public_read_cupons" ON cupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_all_cupons" ON cupons;
CREATE POLICY "admin_all_cupons" ON cupons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all_mp_eventos" ON mp_eventos;
CREATE POLICY "admin_all_mp_eventos" ON mp_eventos FOR ALL USING (true) WITH CHECK (true);

-- ==================== 8) MIGRAÇÃO: MARCAR O QUE JÁ EXISTE ====================
UPDATE produtos SET capa_origem = COALESCE(capa_origem, 'link') WHERE capa_origem IS NULL;
UPDATE produtos SET permite_parcelamento = TRUE WHERE permite_parcelamento IS NULL;

-- ==================== 9) STORAGE (opcional — pode fazer pelo painel do Supabase) ====================
-- 1. Menu "Storage" > "New bucket" > nome: capas > marque "Public bucket" > Create.
-- 2. Em "Policies" do bucket 'capas', crie as 4 políticas permissivas (SELECT, INSERT, UPDATE, DELETE)
--    com a expressão: true   (enquanto o painel não tiver login real)
--
-- Ou execute o bloco abaixo (o bucket precisa existir antes):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('capas', 'capas', TRUE) ON CONFLICT (id) DO NOTHING;
-- CREATE POLICY "capas_leitura" ON storage.objects FOR SELECT USING (bucket_id = 'capas');
-- CREATE POLICY "capas_upload"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'capas');
-- CREATE POLICY "capas_update"  ON storage.objects FOR UPDATE USING (bucket_id = 'capas');
-- CREATE POLICY "capas_delete"  ON storage.objects FOR DELETE USING (bucket_id = 'capas');

-- ==================== CONCLUÍDO ====================
-- ✅ site_config com chaves de pagamento
-- ✅ produtos com capa por upload e venda direta
-- ✅ tabelas clientes, pedidos, cupons e mp_eventos
-- ✅ RLS + políticas + índices + triggers
-- Próximos passos: criar o bucket 'capas', configurar as variáveis na Vercel
-- (MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY, SITE_URL)
-- e publicar os arquivos atualizados.

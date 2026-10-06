-- ============================================================================
-- +QAPOSTILAS - SCHEMA COMPLETO v3.1 (idempotente, NÃO apaga dados existentes)
-- ============================================================================
-- Como rodar:
--   1. supabase.com -> seu projeto -> SQL Editor -> New query
--   2. Cole este arquivo INTEIRO (não cole o supabase-config.js nem o index.html)
--   3. Clique em "Run" (Ctrl+Enter)
--   4. Pode rodar quantas vezes quiser - não apaga nada
-- ============================================================================

-- ============== TABELAS BASE (criadas se não existirem) ==============
CREATE TABLE IF NOT EXISTS site_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icone TEXT,
  imagem_url TEXT,
  ordem INT DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  categoria_id_2 INT REFERENCES categorias(id) ON DELETE SET NULL,
  destaque BOOLEAN DEFAULT FALSE,
  lancamento BOOLEAN DEFAULT FALSE,
  mais_vendida BOOLEAN DEFAULT FALSE,
  pre_venda BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  avaliacao_media DECIMAL(3,2) DEFAULT 5.0,
  total_avaliacoes INT DEFAULT 0,
  codigo TEXT,
  codigo_origem TEXT DEFAULT 'manual',
  tipo_editorial TEXT DEFAULT 'normal',
  sigla_concurso TEXT,
  -- v2.0:
  capa_origem TEXT DEFAULT 'link',
  capa_storage_path TEXT,
  venda_direta BOOLEAN DEFAULT FALSE,
  permite_parcelamento BOOLEAN DEFAULT TRUE,
  mp_link_pagamento TEXT,
  -- v3.1: caminho do PDF no bucket privado "apostilas-pdf"
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ============== CLIENTES (cria com todas as colunas do formulário) ==============
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cpf TEXT,
  estado TEXT,
  perfil TEXT DEFAULT 'aluno',
  aprovacao_pendente BOOLEAN DEFAULT FALSE,
  data_nascimento DATE,
  aceita_marketing BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== PEDIDOS ==============
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE,
  cliente_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  cliente_email TEXT,
  cliente_cpf TEXT,
  cliente_telefone TEXT,
  produto_id INT REFERENCES produtos(id) ON DELETE SET NULL,
  produto_titulo TEXT,
  produto_codigo TEXT,
  formato TEXT DEFAULT 'digital',
  origem TEXT DEFAULT 'site',
  tipo TEXT DEFAULT 'venda',
  status TEXT DEFAULT 'aguardando_pagamento',
  valor NUMERIC(10,2) DEFAULT 0,
  frete NUMERIC(10,2) DEFAULT 0,
  cupom TEXT,
  cupom_desconto NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  forma_pagamento TEXT,
  parcelas INT DEFAULT 1,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  pdf_signed_url TEXT,
  pdf_signed_url_expira_em TIMESTAMPTZ,
  envio_status TEXT DEFAULT 'digital',
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

-- ============== CUPONS ==============
CREATE TABLE IF NOT EXISTS cupons (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT DEFAULT 'percentual',
  valor NUMERIC(10,2) DEFAULT 0,
  valor_minimo NUMERIC(10,2) DEFAULT 0,
  uso_maximo INT,
  usos INT DEFAULT 0,
  valido_de DATE,
  valido_ate DATE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== LOG MP ==============
CREATE TABLE IF NOT EXISTS mp_eventos (
  id SERIAL PRIMARY KEY,
  mp_id TEXT,
  topic TEXT,
  pedido_id INT,
  status_mp TEXT,
  payload JSONB,
  recebido_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============== SEEDS / CONFIGS ==============
INSERT INTO site_config (key, value) VALUES
  ('logo_url',''),
  ('banner_url',''),
  ('banner_height','300'),
  ('banner_autoplay_seconds','5'),
  ('banner_1_image_url',''),('banner_1_mobile_url',''),('banner_1_product_ref',''),('banner_1_link_url',''),
  ('banner_2_image_url',''),('banner_2_mobile_url',''),('banner_2_product_ref',''),('banner_2_link_url',''),
  ('banner_3_image_url',''),('banner_3_mobile_url',''),('banner_3_product_ref',''),('banner_3_link_url',''),
  ('banner_title','Apostilas Atualizadas para Concursos Públicos'),
  ('banner_subtitle','Material 100% digital, conforme último edital'),
  ('whatsapp','5511999999999'),
  ('email','contato@qapostilas.com.br'),
  ('sobre_nos','Somos especializados em apostilas para concursos públicos. Material 100% digital, atualizado conforme os editais mais recentes.'),
  ('admin_password','admin123'),
  ('checkout_modo','link'),
  ('mp_link_pagamento',''),
  ('mp_pix_chave',''),
  ('mp_parcelas_max','6'),
  ('mp_pix_ativo','true'),
  ('mp_credito_ativo','true'),
  ('mp_debito_ativo','true'),
  ('mp_boleto_ativo','false'),
  ('area_aluno_ativa','true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO categorias (nome, slug, icone, ordem, ativo) VALUES
  ('Prefeituras','prefeituras','fa-city',1,TRUE),
  ('Área Policial','policial','fa-shield-halved',2,TRUE),
  ('Área Saúde','saude','fa-heart-pulse',3,TRUE),
  ('Bancos','bancos','fa-building-columns',4,TRUE),
  ('Educação','educacao','fa-graduation-cap',5,TRUE),
  ('Administrativo','administrativo','fa-briefcase',6,TRUE),
  ('Pré-venda','pre-venda','fa-clock',7,TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============== ADICIONAR COLUNAS EM TABELAS ANTIGAS (sem perder dados) ==============
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS imagem_url TEXT;

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS perfil TEXT DEFAULT 'aluno';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aprovacao_pendente BOOLEAN DEFAULT FALSE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aceita_marketing BOOLEAN DEFAULT FALSE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS categoria_id_2 INT REFERENCES categorias(id) ON DELETE SET NULL;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS codigo TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS codigo_origem TEXT DEFAULT 'manual';
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tipo_editorial TEXT DEFAULT 'normal';
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS sigla_concurso TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS capa_origem TEXT DEFAULT 'link';
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS capa_storage_path TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS venda_direta BOOLEAN DEFAULT FALSE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS permite_parcelamento BOOLEAN DEFAULT TRUE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS mp_link_pagamento TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pdf_signed_url TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pdf_signed_url_expira_em TIMESTAMPTZ;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS produto_codigo TEXT;

-- ============== MIGRAÇÃO: clientes.user_id (cria índice único se não existir) ==============
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_user_id_unique ON clientes(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_pedidos_user ON pedidos(cliente_user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_email ON pedidos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_pedidos_cpf ON pedidos(cliente_cpf);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_venda_direta ON produtos(venda_direta);

-- ============== NUMERAÇÃO AUTOMÁTICA DOS PEDIDOS ==============
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
    NEW.envio_status := 'digital';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pedido_codigo ON pedidos;
CREATE TRIGGER trg_pedido_codigo
  BEFORE INSERT ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_pedido_codigo();

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_config_updated_at ON site_config;
CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============== RLS ==============
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_eventos ENABLE ROW LEVEL SECURITY;

-- Leitura pública
DROP POLICY IF EXISTS "public_read_config" ON site_config;
CREATE POLICY "public_read_config" ON site_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_categorias" ON categorias;
CREATE POLICY "public_read_categorias" ON categorias FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_produtos" ON produtos;
CREATE POLICY "public_read_produtos" ON produtos FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_depoimentos" ON depoimentos;
CREATE POLICY "public_read_depoimentos" ON depoimentos FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_cupons" ON cupons;
CREATE POLICY "public_read_cupons" ON cupons FOR SELECT USING (true);

-- Admin (painel)
DROP POLICY IF EXISTS "admin_all_config" ON site_config;
CREATE POLICY "admin_all_config" ON site_config FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_categorias" ON categorias;
CREATE POLICY "admin_all_categorias" ON categorias FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_produtos" ON produtos;
CREATE POLICY "admin_all_produtos" ON produtos FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_depoimentos" ON depoimentos;
CREATE POLICY "admin_all_depoimentos" ON depoimentos FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_clientes" ON clientes;
CREATE POLICY "admin_all_clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_pedidos" ON pedidos;
CREATE POLICY "admin_all_pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_cupons" ON cupons;
CREATE POLICY "admin_all_cupons" ON cupons FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_mp_eventos" ON mp_eventos;
CREATE POLICY "admin_all_mp_eventos" ON mp_eventos FOR ALL USING (true) WITH CHECK (true);

-- Cliente/aluno vê os próprios dados
DROP POLICY IF EXISTS "cliente_select_own" ON clientes;
CREATE POLICY "cliente_select_own" ON clientes FOR SELECT USING (auth.uid() = user_id OR email = (auth.jwt()->>'email'));
DROP POLICY IF EXISTS "cliente_insert_own" ON clientes;
CREATE POLICY "cliente_insert_own" ON clientes FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
DROP POLICY IF EXISTS "cliente_update_own" ON clientes;
CREATE POLICY "cliente_update_own" ON clientes FOR UPDATE USING (auth.uid() = user_id OR email = (auth.jwt()->>'email')) WITH CHECK (auth.uid() = user_id OR email = (auth.jwt()->>'email'));

DROP POLICY IF EXISTS "pedido_select_own" ON pedidos;
CREATE POLICY "pedido_select_own" ON pedidos FOR SELECT USING (auth.uid() = cliente_user_id OR cliente_email = (auth.jwt()->>'email'));
DROP POLICY IF EXISTS "pedido_insert_public" ON pedidos;
CREATE POLICY "pedido_insert_public" ON pedidos FOR INSERT WITH CHECK (true);

-- Bucket privado para PDFs (libera só via webhook)
INSERT INTO storage.buckets (id, name, public) VALUES ('apostilas-pdf', 'apostilas-pdf', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('capas', 'capas', true)
ON CONFLICT (id) DO NOTHING;

-- ============== CONCLUÍDO ==============

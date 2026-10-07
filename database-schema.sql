-- ============================================================================
-- +QAPOSTILAS - SCHEMA COMPLETO v3.2 (idempotente, NÃO apaga dados existentes)
-- ============================================================================
-- O QUE MUDOU NESTA VERSÃO (v3.2) - é isto que resolve os erros das telas:
--   1) Criadas TODAS as colunas que faltavam em tabelas que JÁ EXISTIAM no seu
--      banco. É exatamente isso que gerava os erros:
--      - "Could not find the 'entregue_em' column of 'pedidos' in the schema cache"
--        -> era o erro do botão "Marcar entregue".
--      - "Could not find the 'aceita_marketing' column of 'clientes'"
--        -> era o erro ao salvar a data de nascimento / dados do aluno.
--      - "Could not find the 'capa_origem' column of 'produtos'"
--      - "column pedidos.cliente_user_id does not exist"
--      - "Could not find the table 'public.cupons'"
--   2) No fim do arquivo existe a linha:  NOTIFY pgrst, 'reload schema';
--      Ela limpa o "schema cache" do Supabase, que é o motivo de a coluna
--      continuar "não existindo" mesmo depois de criada.
--   3) Política extra de RLS para o checkout conseguir atualizar o cliente.
--
-- COMO RODAR (na ordem):
--   1. supabase.com -> seu projeto -> SQL Editor -> New query
--   2. Cole ESTE ARQUIVO INTEIRO e clique em Run (Ctrl+Enter)
--      (NÃO cole aqui o supabase-config.js, o index.html, o vercel.json nem os
--       arquivos api/*.js — era isso que causava "syntax error at or near //")
--   3. Pode rodar quantas vezes quiser - não apaga nada.
--   4. Depois de rodar, recarregue o site com Ctrl+Shift+R.
-- ============================================================================

-- ============== 1) TABELAS BASE (criadas se não existirem) ==============
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
  orgao TEXT,
  cargo TEXT,
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
  link_compra TEXT,
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
  capa_origem TEXT DEFAULT 'link',
  capa_storage_path TEXT,
  venda_direta BOOLEAN DEFAULT FALSE,
  permite_parcelamento BOOLEAN DEFAULT TRUE,
  mp_link_pagamento TEXT,
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
  avaliacao INT DEFAULT 5,
  destaque BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  nome TEXT,
  email TEXT,
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

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  codigo TEXT,
  cliente_user_id UUID,
  cliente_id INT,
  cliente_nome TEXT,
  cliente_email TEXT,
  cliente_cpf TEXT,
  cliente_telefone TEXT,
  produto_id INT,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS mp_eventos (
  id SERIAL PRIMARY KEY,
  mp_id TEXT,
  topic TEXT,
  pedido_id INT,
  status_mp TEXT,
  payload JSONB,
  recebido_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2) COLUNAS QUE FALTAVAM EM TABELAS QUE JÁ EXISTIAM  <<< O CONSERTO PRINCIPAL
--    (o "CREATE TABLE IF NOT EXISTS" não adiciona coluna nova em tabela antiga)
-- ============================================================================

-- ---- pedidos ----
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_user_id UUID;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_id INT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_cpf TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS produto_id INT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS produto_titulo TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS produto_codigo TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS formato TEXT DEFAULT 'digital';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'site';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'venda';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aguardando_pagamento';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS valor NUMERIC(10,2) DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS frete NUMERIC(10,2) DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupom TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupom_desconto NUMERIC(10,2) DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS parcelas INT DEFAULT 1;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pdf_signed_url TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pdf_signed_url_expira_em TIMESTAMPTZ;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_status TEXT DEFAULT 'digital';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS rastreio TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_em TIMESTAMPTZ;
-- ESTA É A COLUNA DO ERRO "Marcar entregue":
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMPTZ;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ---- clientes ---- (aqui estavam 'aceita_marketing' e 'data_nascimento')
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS perfil TEXT DEFAULT 'aluno';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aprovacao_pendente BOOLEAN DEFAULT FALSE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aceita_marketing BOOLEAN DEFAULT FALSE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ---- produtos ----
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS orgao TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS capa_url TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS paginas INT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS preco DECIMAL(10,2);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS preco_original DECIMAL(10,2);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS conteudo_programatico TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS atualizado_edital BOOLEAN DEFAULT TRUE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tipo_botao TEXT DEFAULT 'hotmart';
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS link_compra TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS categoria_id INT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS categoria_id_2 INT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT FALSE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS lancamento BOOLEAN DEFAULT FALSE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS mais_vendida BOOLEAN DEFAULT FALSE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS pre_venda BOOLEAN DEFAULT FALSE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS avaliacao_media DECIMAL(3,2) DEFAULT 5.0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS total_avaliacoes INT DEFAULT 0;
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
-- ---- v3.3: entrega digital ----
-- Link de download do PDF por produto (Google Drive, Dropbox, OneDrive...).
-- Guardamos SO o link: o arquivo NAO fica no banco, entao nao pesa nada.
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS download_url TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS parcelas INT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ---- categorias / depoimentos / cupons / site_config ----
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS ordem INT DEFAULT 0;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS cargo_aprovado TEXT;
ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS avaliacao INT DEFAULT 5;
ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT FALSE;
ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE cupons ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'percentual';
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS valor NUMERIC(10,2) DEFAULT 0;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS valor_minimo NUMERIC(10,2) DEFAULT 0;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS uso_maximo INT;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS usos INT DEFAULT 0;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS valido_de DATE;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS valido_ate DATE;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE mp_eventos ADD COLUMN IF NOT EXISTS mp_id TEXT;
ALTER TABLE mp_eventos ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE mp_eventos ADD COLUMN IF NOT EXISTS pedido_id INT;
ALTER TABLE mp_eventos ADD COLUMN IF NOT EXISTS status_mp TEXT;
ALTER TABLE mp_eventos ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE mp_eventos ADD COLUMN IF NOT EXISTS recebido_em TIMESTAMPTZ DEFAULT NOW();

-- ============== 3) SEEDS / CONFIGURAÇÕES ==============
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

-- CORREÇÃO IMPORTANTE: se o painel salvou os checkboxes como 'on' (valor padrão
-- do HTML), o site entendia que NENHUMA forma de pagamento estava habilitada.
UPDATE site_config SET value = 'true'  WHERE key IN ('mp_pix_ativo','mp_credito_ativo','mp_debito_ativo') AND lower(value) IN ('on','true','1','sim');
UPDATE site_config SET value = 'false' WHERE key IN ('mp_pix_ativo','mp_credito_ativo','mp_debito_ativo','mp_boleto_ativo') AND lower(value) IN ('off','false','0','nao','não');

INSERT INTO categorias (nome, slug, icone, ordem, ativo) VALUES
  ('Prefeituras','prefeituras','fa-city',1,TRUE),
  ('Área Policial','policial','fa-shield-halved',2,TRUE),
  ('Área Saúde','saude','fa-heart-pulse',3,TRUE),
  ('Bancos','bancos','fa-building-columns',4,TRUE),
  ('Educação','educacao','fa-graduation-cap',5,TRUE),
  ('Administrativo','administrativo','fa-briefcase',6,TRUE),
  ('Pré-venda','pre-venda','fa-clock',7,TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============== 4) ÍNDICES ==============
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_user_id_unique ON clientes(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_pedidos_user ON pedidos(cliente_user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_email ON pedidos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_pedidos_cpf ON pedidos(cliente_cpf);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_external ON pedidos(id);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_venda_direta ON produtos(venda_direta);

-- ============== 5) NUMERAÇÃO AUTOMÁTICA DOS PEDIDOS + updated_at ==============
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

-- ============== 6) RLS ==============
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_eventos  ENABLE ROW LEVEL SECURITY;

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

-- Painel/admin (o painel usa a chave publishable, então precisa destas políticas)
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

-- Aluno vê/edita os próprios dados
DROP POLICY IF EXISTS "cliente_select_own" ON clientes;
CREATE POLICY "cliente_select_own" ON clientes FOR SELECT USING (auth.uid() = user_id OR email = (auth.jwt()->>'email'));
DROP POLICY IF EXISTS "cliente_insert_own" ON clientes;
CREATE POLICY "cliente_insert_own" ON clientes FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
DROP POLICY IF EXISTS "cliente_update_own" ON clientes;
CREATE POLICY "cliente_update_own" ON clientes FOR UPDATE USING (auth.uid() = user_id OR email = (auth.jwt()->>'email')) WITH CHECK (auth.uid() = user_id OR email = (auth.jwt()->>'email'));
-- NOVO: permite o checkout (visitante, sem login) atualizar/gravar o cliente pelo e-mail.
DROP POLICY IF EXISTS "cliente_update_public" ON clientes;
CREATE POLICY "cliente_update_public" ON clientes FOR UPDATE USING (true) WITH CHECK (true);

-- Pedidos do próprio aluno
DROP POLICY IF EXISTS "pedido_select_own" ON pedidos;
CREATE POLICY "pedido_select_own" ON pedidos FOR SELECT USING (auth.uid() = cliente_user_id OR cliente_email = (auth.jwt()->>'email'));
DROP POLICY IF EXISTS "pedido_insert_public" ON pedidos;
CREATE POLICY "pedido_insert_public" ON pedidos FOR INSERT WITH CHECK (true);

-- ============== 7) BUCKETS DE ARQUIVOS ==============
INSERT INTO storage.buckets (id, name, public) VALUES ('apostilas-pdf', 'apostilas-pdf', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('capas', 'capas', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "capas_public_read" ON storage.objects;
CREATE POLICY "capas_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'capas');

DROP POLICY IF EXISTS "capas_admin_insert" ON storage.objects;
CREATE POLICY "capas_admin_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('capas','apostilas-pdf'));

DROP POLICY IF EXISTS "capas_admin_update" ON storage.objects;
CREATE POLICY "capas_admin_update" ON storage.objects FOR UPDATE USING (bucket_id IN ('capas','apostilas-pdf')) WITH CHECK (bucket_id IN ('capas','apostilas-pdf'));

DROP POLICY IF EXISTS "capas_admin_delete" ON storage.objects;
CREATE POLICY "capas_admin_delete" ON storage.objects FOR DELETE USING (bucket_id IN ('capas','apostilas-pdf'));

-- ============================================================================
-- 8) LIMPA O "SCHEMA CACHE" DO SUPABASE  <<< sem esta linha o erro
--    "Could not find the 'entregue_em' column ... in the schema cache" continua
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============== 9) CONFERÊNCIA (deve listar as colunas novas) ==============
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'pedidos'  AND column_name IN ('entregue_em','pago_em','produto_codigo','cliente_user_id','mp_preference_id','mp_payment_id'))
    OR (table_name = 'clientes' AND column_name IN ('data_nascimento','aceita_marketing','user_id'))
    OR (table_name = 'produtos' AND column_name IN ('capa_origem','pdf_storage_path','venda_direta','mp_link_pagamento')))
ORDER BY table_name, column_name;

-- ============== CONCLUÍDO ==============

-- ============================================================================
-- v3.5 - PRE-VENDA COM DATA DE LIBERACAO (idempotente - nao apaga nada)
-- ============================================================================
-- Como funciona no site:
--   * produto marcado como "Pre-venda" e com data preenchida
--       -> antes da data: aparece o selo "Pre-venda - disponivel em DD/MM/AAAA"
--       -> na data ou depois: o produto sai da pre-venda sozinho e o botao
--          passa a ser "Comprar agora" automaticamente
--   * produto em "Pre-venda" SEM data -> continua em pre-venda ate voce preencher
--
-- Preencha a data no painel: Admin -> Produtos -> (editar produto) ->
-- "Data de liberacao (pre-venda)".

alter table if exists public.produtos
  add column if not exists data_lancamento date;

-- alias de compatibilidade (o site aceita os dois nomes)
alter table if exists public.produtos
  add column if not exists pre_venda_data date;

comment on column public.produtos.data_lancamento is
  'Data de liberacao da pre-venda. A partir dela o produto sai da pre-venda automaticamente.';

comment on column public.produtos.pre_venda_data is
  'Alias de data_lancamento (compatibilidade).';

create index if not exists produtos_data_lancamento_idx
  on public.produtos (data_lancamento);

-- recarrega o cache de schema do PostgREST (Supabase) para o site enxergar as colunas novas
notify pgrst, 'reload schema';

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

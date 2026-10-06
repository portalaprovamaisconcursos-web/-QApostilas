# +QApostilas - Site Profissional de Apostilas para Concursos Públicos

## 📋 Visão Geral

**+QApostilas** é um site profissional, moderno e totalmente administrável, funcionando como uma vitrine organizada de apostilas para concursos públicos. O site permite cadastro completo de produtos através de um painel administrativo intuitivo, com finalização de compras externa via Hotmart ou sites de parceiros.

### ✨ Características Principais

- 🎨 **Design Moderno**: Interface profissional com cores azul claro, branco e preto
- 📱 **100% Responsivo**: Funciona perfeitamente em dispositivos móveis, tablets e desktop
- 🔐 **Painel Admin Completo**: Gerencie produtos, depoimentos, categorias e configurações
- 🗄️ **Integração Supabase**: Banco de dados PostgreSQL gratuito e escalável
- 🔍 **Busca Avançada**: Pesquisa por concurso, cargo, órgão, estado e categoria
- 🏷️ **Categorias Organizadas**: Prefeituras, Policial, Saúde, Bancos, Educação, Administrativo e Pré-venda
- ⭐ **Seções Estratégicas**: Destaques, Lançamentos, Mais Vendidas e Pré-venda
- 💬 **Depoimentos de Alunos**: Sistema completo de gerenciamento de testemunhais
- 🛒 **Dois Tipos de Compra**: Hotmart (produtos próprios) ou Site Parceiro
- 🚀 **SPA (Single Page Application)**: Navegação rápida sem recarregar a página

---

## 🚀 Configuração Rápida (5 Minutos)

### Passo 1: Criar Conta no Supabase (GRATUITO)

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **"Start your project"** e crie uma conta gratuita
3. Após login, clique em **"New Project"**
4. Preencha:
   - **Name**: qapostilas (ou o nome que preferir)
   - **Database Password**: Crie uma senha forte e **anote-a**
   - **Region**: Escolha o mais próximo do Brasil (South America - São Paulo)
   - **Pricing Plan**: Free (gratuito - 500MB de dados)
5. Clique em **"Create new project"** e aguarde 1-2 minutos

### Passo 2: Configurar o Banco de Dados

1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral esquerdo
2. Clique em **"New Query"**
3. Abra o arquivo `database-schema.sql` deste projeto
4. **Copie TODO o conteúdo** do arquivo
5. **Cole** no SQL Editor do Supabase
6. Clique em **"Run"** (ou pressione Ctrl+Enter)
7. Aguarde a mensagem de sucesso ✅

**Pronto!** Todas as tabelas, dados de demonstração e políticas de segurança foram criadas automaticamente.

### Passo 3: Obter Credenciais do Supabase

1. No painel do Supabase, clique em **"Settings"** (ícone de engrenagem) no menu inferior
2. Clique em **"API"**
3. Você verá duas informações importantes:
   - **Project URL**: algo como `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: uma chave longa começando com `eyJ...`

### Passo 4: Configurar o Site

1. Abra o arquivo **`supabase-config.js`** no seu editor de código
2. Substitua `'SUA_URL_AQUI'` pela sua **Project URL**
3. Substitua `'SUA_KEY_AQUI'` pela sua **anon public key**
4. Salve o arquivo

**Exemplo:**
```javascript
const SUPABASE_URL = 'https://abcdefghij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...';
```

### Passo 5: Abrir o Site

1. Abra o arquivo **`index.html`** no seu navegador
2. **Pronto!** O site está funcionando com dados de demonstração

---

## 🎯 Como Usar o Painel Admin

### Acessar o Admin

1. No site, clique no botão **"Admin"** no canto superior direito
2. **Usuário**: `admin`
3. **Senha padrão**: `admin123`
4. Clique em **"Entrar"**

### Alterar a Senha Admin (RECOMENDADO)

1. No painel admin, vá na aba **"Configurações"**
2. Encontre o campo **"Senha Admin"**
3. Digite uma nova senha segura
4. Clique em **"Salvar Configurações"**

### Gerenciar Produtos (Apostilas)

#### Adicionar Novo Produto

1. Vá na aba **"Produtos"**
2. Clique em **"+ Novo Produto"**
3. Preencha todos os campos:
   - **Título**: Nome da apostila
   - **Órgão**: Nome do órgão (Ex: Prefeitura Municipal de São Paulo)
   - **Cargo**: Cargo da apostila (Ex: Agente Administrativo)
   - **Estado/Cidade**: Localização (Ex: SP / São Paulo)
   - **Descrição**: Descrição detalhada da apostila
   - **URL da Capa**: Link da imagem da capa (pode usar Google Drive, Imgur, etc)
   - **Número de Páginas**: Quantidade de páginas
   - **Preço**: Preço de venda
   - **Preço Original**: Preço antes do desconto (opcional)
   - **Categoria**: Escolha a categoria apropriada
   - **Conteúdo Programático**: Digite as matérias, uma por linha
   - **Tipo de Botão**: 
     - **Hotmart**: Para produtos próprios
     - **Parceiro**: Para produtos de terceiros
   - **Link de Compra**: URL para onde o cliente será redirecionado
   - **Checkboxes**: Marque Destaque, Lançamento, Mais Vendida, etc conforme necessário
4. Clique em **"Salvar Produto"**

#### Editar Produto

1. Na tabela de produtos, clique em **"Editar"** no produto desejado
2. Altere os campos necessários
3. Clique em **"Salvar Produto"**

#### Excluir Produto

1. Na tabela de produtos, clique em **"Excluir"** no produto desejado
2. Confirme a exclusão

### Gerenciar Depoimentos

1. Vá na aba **"Depoimentos"**
2. Clique em **"+ Novo Depoimento"**
3. Preencha:
   - **Nome**: Nome do aluno aprovado
   - **Cargo Aprovado**: Cargo conquistado (Ex: Técnica Administrativa - Prefeitura SP)
   - **Depoimento**: Texto do testemunhal
   - **URL da Foto**: Link da foto do aluno (opcional)
   - **Avaliação**: Estrelas de 1 a 5
   - **Destaque**: Marque para destacar na home
4. Clique em **"Salvar Depoimento"**

### Configurações do Site

Na aba **"Configurações"** você pode alterar:

- **URL da Logo**: Link da logo da empresa
- **URL do Banner**: Link da imagem do banner principal
- **Título do Banner**: Texto grande do banner
- **Subtítulo do Banner**: Texto menor do banner
- **WhatsApp**: Número com código do país (Ex: 5511999999999)
- **E-mail**: E-mail de contato
- **Texto "Sobre Nós"**: Descrição da empresa
- **Senha Admin**: Altere a senha de acesso ao painel

### Gerenciar Categorias

1. Vá na aba **"Categorias"**
2. Você pode **Ativar/Desativar** cada categoria
3. As categorias são predefinidas e não podem ser editadas

---

## 📂 Estrutura de Arquivos

```
+qapostilas/
│
├── index.html              # Arquivo principal do site (HTML + CSS + JS)
├── supabase-config.js      # Configuração do Supabase (EDITAR AQUI)
├── database-schema.sql     # Schema do banco de dados (executar no Supabase)
└── README.md              # Este arquivo de documentação
```

---

## 🎨 Personalização

### Alterar Cores

O site usa CSS Variables. Edite o arquivo `index.html` na seção `<style>`:

```css
:root {
  --primary: #1E90FF;        /* Azul principal */
  --primary-dark: #0066CC;   /* Azul escuro */
  --primary-light: #E8F4FF;  /* Azul claro */
  --accent: #FF4444;         /* Vermelho de destaque */
  /* ... outras cores */
}
```

### Alterar Fontes

As fontes usadas são **Inter** (corpo do texto) e **Poppins** (títulos), carregadas do Google Fonts. Para alterar, edite no `<head>` do `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=SuaFonte:wght@400;700&display=swap" rel="stylesheet">
```

E atualize no CSS:
```css
body {
  font-family: 'SuaFonte', sans-serif;
}
```

---

## 🔧 Recursos Técnicos

### Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilização moderna com Flexbox e Grid
- **JavaScript (ES6+)**: Lógica e interatividade
- **Supabase**: Banco de dados PostgreSQL
- **Supabase JS Client**: Biblioteca oficial via CDN
- **Font Awesome 6**: Ícones vetoriais
- **Google Fonts**: Tipografia (Inter + Poppins)

### Compatibilidade

- ✅ Chrome/Edge (versões recentes)
- ✅ Firefox (versões recentes)
- ✅ Safari (versões recentes)
- ✅ Mobile (iOS/Android)

### Performance

- Single Page Application (SPA) - navegação sem reload
- Carregamento assíncrono de dados
- Otimização de imagens recomendada
- CSS e JS inline (sem requests extras)

---

## 🌐 Deploy / Publicação

### Opção 1: Netlify (RECOMENDADO - GRATUITO)

1. Acesse [https://www.netlify.com](https://www.netlify.com)
2. Crie uma conta gratuita
3. Clique em **"Add new site"** > **"Deploy manually"**
4. Arraste os 3 arquivos (`index.html`, `supabase-config.js`, `database-schema.sql`)
5. **Pronto!** Seu site está no ar com domínio gratuito (ex: `qapostilas.netlify.app`)

### Opção 2: Vercel (GRATUITO)

1. Acesse [https://vercel.com](https://vercel.com)
2. Crie uma conta gratuita
3. Clique em **"Add New"** > **"Project"**
4. Faça upload dos arquivos ou conecte ao GitHub
5. **Pronto!** Domínio gratuito disponível

### Opção 3: GitHub Pages (GRATUITO)

1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Vá em **Settings** > **Pages**
4. Selecione a branch `main` e clique em **Save**
5. Seu site estará em `https://seu-usuario.github.io/qapostilas`

### Opção 4: Domínio Próprio

Se você já tem um domínio pago:

1. Faça o deploy em qualquer uma das opções acima
2. Configure o DNS do seu domínio para apontar para o serviço escolhido
3. Siga as instruções de custom domain de cada plataforma

---

## 📊 Estrutura do Banco de Dados

### Tabela: `site_config`
Armazena configurações gerais do site (logo, banner, contatos, senha admin)

### Tabela: `categorias`
7 categorias predefinidas: Prefeituras, Policial, Saúde, Bancos, Educação, Administrativo, Pré-venda

### Tabela: `produtos`
Apostilas cadastradas com todos os detalhes (título, órgão, cargo, preço, categoria, badges, etc)

### Tabela: `depoimentos`
Testemunhais de alunos aprovados com nome, cargo, texto, foto e avaliação

---

## 🔒 Segurança

### Row Level Security (RLS)

O banco de dados está configurado com RLS (Row Level Security) do Supabase:

- **Leitura**: Todos podem visualizar dados públicos
- **Escrita**: Por padrão, todos podem escrever (para facilitar desenvolvimento)

⚠️ **IMPORTANTE PARA PRODUÇÃO**: Configure políticas de segurança mais restritivas no Supabase ou implemente autenticação no painel admin.

### Recomendações de Segurança

1. **Altere a senha admin** imediatamente após a configuração
2. Use senhas fortes (mínimo 12 caracteres, letras, números e símbolos)
3. Não compartilhe suas credenciais do Supabase publicamente
4. Para produção, implemente autenticação com Supabase Auth
5. Configure políticas RLS mais restritivas para operações de escrita

---

## 🐛 Solução de Problemas

### Site não carrega os dados do banco

**Problema**: Site mostra apenas dados de demonstração

**Solução**:
1. Verifique se editou o `supabase-config.js` corretamente
2. Abra o Console do navegador (F12) e veja se há erros
3. Confirme se executou o `database-schema.sql` no Supabase
4. Verifique se a Project URL e anon key estão corretas

### Erro ao salvar produtos no admin

**Problema**: Mensagem de erro ao tentar criar/editar produtos

**Solução**:
1. Verifique se o banco de dados foi criado corretamente
2. Abra o SQL Editor do Supabase e execute novamente o `database-schema.sql`
3. Verifique se as políticas RLS estão ativas

### Imagens não aparecem

**Problema**: Capas de apostilas ou fotos não carregam

**Solução**:
1. Verifique se as URLs das imagens estão corretas e públicas
2. Certifique-se de que as imagens estão hospedadas em serviços que permitem hotlinking
3. Recomendamos usar: Google Drive (modo público), Imgur, Cloudinary ou Supabase Storage

### Login admin não funciona

**Problema**: Senha não aceita

**Solução**:
1. A senha padrão é `admin123`
2. Se alterou a senha, use a nova senha configurada
3. Para resetar, vá no Supabase > Table Editor > `site_config` > edite o campo `admin_password`

---

## 📈 Próximos Passos Recomendados

### Funcionalidades Não Implementadas (Possíveis Melhorias)

1. **Autenticação Admin Robusta**: Integrar com Supabase Auth para login seguro
2. **Analytics**: Integrar Google Analytics ou similar
3. **SEO**: Adicionar meta tags dinâmicas e Open Graph
4. **Sistema de Reviews**: Permitir que usuários avaliem produtos
5. **Filtros Avançados**: Múltiplos filtros simultâneos na busca
6. **Favoritos**: Sistema para usuários salvarem apostilas favoritas
7. **Newsletter**: Integrar sistema de e-mail marketing
8. **Carrinho de Compras**: Permitir compra de múltiplos produtos (requer backend)
9. **Chat/WhatsApp Widget**: Botão flutuante de atendimento
10. **Blog/Artigos**: Seção de conteúdo educativo sobre concursos

### Sugestões de Conteúdo

1. Cadastre **pelo menos 20-30 produtos** para o site ficar robusto
2. Adicione **10-15 depoimentos** autênticos de alunos
3. Atualize o **"Sobre Nós"** com a história da sua empresa
4. Configure **WhatsApp e E-mail** reais para contato
5. Use **imagens profissionais** para capas das apostilas (mockups de PDF)
6. Mantenha sempre o **banner principal atualizado** com promoções

---

## 🏆 Funcionalidades Implementadas

### ✅ Front-End
- [x] Design moderno e profissional
- [x] 100% responsivo (mobile-first)
- [x] Single Page Application (SPA) com navegação fluida
- [x] Banner hero personalizável
- [x] Barra de pesquisa com filtros
- [x] Grid de categorias interativo
- [x] Cards de produtos com badges dinâmicos
- [x] Página de detalhes do produto (modal)
- [x] Seções: Destaques, Lançamentos, Mais Vendidas, Pré-venda
- [x] Seção de depoimentos
- [x] Páginas: Sobre Nós, Contato
- [x] Rodapé com links e avisos legais
- [x] Sistema de alertas (sucesso/erro)
- [x] Loading states

### ✅ Painel Administrativo
- [x] Login com senha
- [x] Tabs: Configurações, Produtos, Depoimentos, Categorias
- [x] CRUD completo de Produtos
- [x] CRUD completo de Depoimentos
- [x] Gerenciamento de Configurações do Site
- [x] Ativar/Desativar Categorias
- [x] Interface intuitiva e responsiva

### ✅ Back-End (Supabase)
- [x] 4 tabelas criadas e configuradas
- [x] Row Level Security (RLS) ativo
- [x] Políticas de segurança configuradas
- [x] Índices para melhor performance
- [x] Triggers para updated_at automático
- [x] Dados de demonstração

### ✅ Integração
- [x] Supabase JS Client via CDN
- [x] Operações assíncronas (async/await)
- [x] Tratamento de erros
- [x] Fallback para dados demo se Supabase não configurado

---

## 📞 Suporte

### Problemas Técnicos

Se encontrar algum problema:

1. Verifique a seção **"Solução de Problemas"** acima
2. Abra o Console do navegador (F12) e veja erros no JavaScript
3. Verifique se seguiu todos os passos de configuração corretamente

### Documentação Adicional

- **Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **Font Awesome**: [https://fontawesome.com/icons](https://fontawesome.com/icons)
- **Google Fonts**: [https://fonts.google.com](https://fonts.google.com)

---

## 📝 Informações Importantes

### URLs de Compra (Hotmart / Parceiros)

- **Produtos Hotmart**: Use o link do checkout da Hotmart (Ex: `https://pay.hotmart.com/...`)
- **Produtos Parceiros**: Use o link direto do site do parceiro
- Todos os links abrem em **nova aba** com `target="_blank"`

### Dados de Demonstração

O site vem com dados de demonstração incluindo:
- 4 produtos de exemplo
- 6 depoimentos fictícios
- 7 categorias padrão
- Configurações iniciais

### Política de Uso

Este site é uma **vitrine organizacional**. Você é responsável por:
- Garantir que os produtos cadastrados são legítimos
- Informar claramente que compras externas são de responsabilidade do vendedor
- Manter políticas de privacidade e termos de uso atualizados
- Cumprir legislação vigente sobre comércio eletrônico

---

## 🎉 Conclusão

Seu site **+QApostilas** está pronto para uso! Com este sistema você tem:

✅ Uma **vitrine profissional** de apostilas
✅ **Painel admin completo** para gerenciar tudo
✅ **Integração com Supabase** gratuita e escalável
✅ **Design moderno** e totalmente responsivo
✅ **Facilidade de uso** para administradores e visitantes

### Checklist Final

- [ ] Configurei o Supabase corretamente
- [ ] Executei o database-schema.sql
- [ ] Atualizei o supabase-config.js com minhas credenciais
- [ ] Testei o site localmente
- [ ] Alterei a senha admin padrão
- [ ] Cadastrei meus primeiros produtos reais
- [ ] Adicionei depoimentos autênticos
- [ ] Configurei logo, banner e informações de contato
- [ ] Fiz deploy do site
- [ ] Configurei meu domínio próprio (se aplicável)

---

## 📄 Licença

Este projeto foi desenvolvido para uso comercial. Você tem total liberdade para:
- Usar comercialmente
- Modificar o código
- Personalizar design
- Integrar com outros sistemas

---

**Desenvolvido com ❤️ para +QApostilas**

**Versão**: 1.0.0  
**Data**: 2025  
**Autor**: Sistema desenvolvido especialmente para vitrine de apostilas

---

## 💡 Dicas Profissionais

### Marketing Digital

1. **SEO Local**: Otimize para concursos específicos da sua região
2. **Google Ads**: Invista em palavras-chave específicas de concursos
3. **Instagram/Facebook**: Poste dicas de estudo e promoções
4. **YouTube**: Crie vídeos sobre editais e dicas de aprovação
5. **E-mail Marketing**: Envie novidades sobre novos editais

### Conversão

1. Use **badges** chamativos (Atualizado, Novo, Desconto)
2. Destaque **depoimentos autênticos** com fotos reais
3. Mantenha **preços competitivos** e mostre descontos
4. Ofereça **pré-venda** com desconto para novos editais
5. Tenha **WhatsApp** ativo para tirar dúvidas rapidamente

### Qualidade

1. **Atualize sempre** conforme novos editais
2. Use **mockups profissionais** para as capas
3. Descreva **detalhadamente** o conteúdo programático
4. Seja **transparente** sobre a origem dos produtos
5. Responda **rapidamente** às dúvidas dos clientes

---

**Boa sorte com seu negócio de apostilas! 🚀📚**
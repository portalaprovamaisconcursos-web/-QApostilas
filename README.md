# +QApostilas — Site de Apostilas para Concursos Públicos

**Versão 2.0** — agora com **venda direta no site** (Pix, cartão de crédito em até 6x e débito), **Área do Aluno** (login do cliente com histórico de compras), **painel de Pedidos**, **cadastro de Clientes**, **cupons de desconto** e **upload de capas**.

---

## 📦 O que mudou nesta versão

| Recurso | Antes | Agora |
|---|---|---|
| Compra | Só Hotmart / site parceiro | Também **venda direta no site** (Pix, crédito em até 6x, débito) |
| Área do cliente | Não existia | **Área do Aluno** com login, histórico de compras e edição de dados |
| Painel admin | Produtos, Depoimentos, Categorias, Configurações | + **Pedidos**, **Clientes** e **Cupons** |
| Capas | Só por link (URL) | **Por link OU por upload** (Supabase Storage) |
| Menu | Categorias | Categorias + **Estados** (todas as 27 siglas) |
| Home | Grade de botões grandes de categoria | Categorias em barra compacta + seção "Apostilas por estado" |
| Página do produto | Capa menor | **Capa maior com zoom** + botão de compra direta |

> ⚠️ **Importante sobre vendas em sites parceiros:** quando o cliente clica e compra no site do parceiro, o pagamento acontece **fora** do seu sistema. Não existe como o site do parceiro avisar o seu automaticamente (só se o parceiro tiver API/webhook e liberar acesso). Por isso a Área do Aluno mostra essas compras quando:
> 1. o **e-mail ou CPF** da compra for o mesmo do cadastro do aluno — nesse caso basta lançar o pedido no painel (**Pedidos → Lançar pedido manual**) ou o próprio aluno vincula na aba **"Meus dados" → Vincular compras antigas**; ou
> 2. você registrar o pedido manualmente no painel, escolhendo a origem "Site parceiro" ou "Hotmart".

---

## 🗂️ Arquivos do projeto

```
+qapostilas/
├── index.html              # Site completo (HTML + CSS + JS) — v2.0
├── supabase-config.js      # Credenciais públicas do Supabase
├── database-schema.sql     # Banco de dados completo (original + v2.0)
├── vercel.json             # Rotas e cabeçalhos (não captura /api)
├── sitemap.xml             # URLs do site (inclui /estado/UF)
├── robots.txt              # Indexação
├── README.md               # Este guia
└── api/
    ├── mp-checkout.js      # Cria a preferência do Mercado Pago (Checkout Pro)
    └── mp-webhook.js       # Recebe a confirmação de pagamento
```

**Os dois arquivos da pasta `api/` só são usados no modo "api" do checkout.** Se você usar o modo "link", o site funciona sem eles — mas mantenha a pasta publicada, pois ela não atrapalha.

---

## 🚀 PASSO A PASSO PARA ATUALIZAR

### PASSO 1 — Rodar o SQL no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e abra seu projeto.
2. Menu lateral → **SQL Editor** → **New query**.
3. Abra o arquivo **`database-schema.sql`** do projeto, **copie TODO o conteúdo** e cole no editor.
4. Clique em **Run** (ou Ctrl+Enter) e aguarde a mensagem de sucesso.

O arquivo é seguro para rodar mais de uma vez: ele usa `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` e `ON CONFLICT DO NOTHING` — **não apaga** seus produtos, depoimentos nem configurações.

**O que ele cria/atualiza:**

- **`site_config`** — novas chaves: `checkout_modo`, `mp_link_pagamento`, `mp_pix_chave`, `mp_parcelas_max`, `mp_pix_ativo`, `mp_credito_ativo`, `mp_debito_ativo`, `mp_boleto_ativo` (boleto vem **desativado**), `area_aluno_ativa`.
- **`produtos`** — novas colunas: `capa_origem`, `capa_storage_path`, `capa_impresso_origem`, `capa_impresso_storage_path`, `venda_direta`, `permite_parcelamento`, `mp_link_pagamento`.
- **`clientes`** — cadastro do aluno/cliente (nome, e-mail, telefone, CPF, data de nascimento, perfil, aprovação, marketing).
- **`pedidos`** — todos os pedidos, com **numeração automática** começando em `00401906` (o painel de exemplo mostrava `00401905`), status, forma de pagamento, parcelas, frete, cupom, IDs do Mercado Pago.
- **`cupons`** — cupons de desconto (percentual ou valor fixo).
- **`mp_eventos`** — log de tudo que o Mercado Pago enviar (auditoria).
- Índices, triggers de `updated_at` e as **políticas de segurança (RLS)**.

### PASSO 2 — Criar o bucket de capas (upload de imagens)

1. No Supabase, menu lateral → **Storage** → **New bucket**.
2. Nome: **`capas`** (exatamente assim, minúsculo).
3. Marque **Public bucket** → **Create bucket**.
4. Clique no bucket `capas` → aba **Policies** → **New policy** → escolha o modelo **"For full customization"** e crie **quatro** políticas, todas com a expressão `true`:
   - `SELECT` (leitura) para os papéis `anon` e `authenticated`
   - `INSERT` (upload)
   - `UPDATE`
   - `DELETE`

> Enquanto o painel admin usa senha (sem login real), essas políticas permissivas são necessárias para o upload funcionar. Se depois você migrar o admin para o Supabase Auth, restrinja-as.

### PASSO 3 — Ativar a Área do Aluno (Supabase Auth)

1. No Supabase, menu lateral → **Authentication** → **Sign In / Providers**.
2. Confirme que **Email** está habilitado.
3. Em **Authentication → URL Configuration**:
   - **Site URL**: `https://www.maisqapostilas.com.br`
   - **Redirect URLs**: adicione `https://www.maisqapostilas.com.br/**`
4. **Importante:** se **"Confirm email"** estiver ligado, o aluno precisa clicar no link enviado por e-mail antes de entrar. Para simplificar (recomendado no começo), **desligue a confirmação de e-mail** em *Authentication → Sign In / Providers → Email → Confirm email*.

### PASSO 4 — Configurar o Mercado Pago

Você tem **duas formas** de receber. Escolha uma e configure no painel do site (**Admin → Configurações → Pagamentos e Venda Direta**).

#### 🅰️ Modo "link" (mais simples, sem programação)

1. Entre no [Mercado Pago](https://www.mercadopago.com.br) com a sua conta.
2. Menu **Seu negócio → Cobranças → Link de pagamento** (ou *Link de pagamento* no menu lateral).
3. Crie um link de pagamento. Na configuração de **meios de pagamento**, deixe **Pix, Cartão de crédito e Cartão de débito** marcados e **desmarque o Boleto**.
4. Em **parcelamento**, defina o **máximo de 6 parcelas**.
5. Copie o link (algo como `https://mpago.la/xxxxxxx`).
6. No site: **Admin → Configurações → Pagamentos e Venda Direta**:
   - **Modo de checkout**: `Link de pagamento do Mercado Pago (sem backend)`
   - **Link de pagamento Mercado Pago (padrão do site)**: cole o link
   - **Chave Pix**: informe a chave que aparecerá para quem escolher Pix (opcional, mas recomendado)
   - **Máximo de parcelas**: `6`
   - Marque **Pix**, **crédito** e **débito**; deixe **boleto desmarcado**
   - Clique em **Salvar Configurações**

Cada produto pode ter o **seu próprio link** (campo *"Link de pagamento Mercado Pago do produto"* no cadastro da apostila).

#### 🅱️ Modo "api" (Checkout Pro automático — recomendado a médio prazo)

Neste modo o próprio site cria o pagamento e o Mercado Pago redireciona o cliente, sem você precisar criar link por produto.

1. Acesse [https://www.mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app) → **Criar aplicação**.
2. Anote o **Access Token de produção** (começa com `APP_USR-...`).
   > 🔒 O Access Token é **secreto**. Ele **nunca** vai no `index.html` nem no `supabase-config.js` — só nas variáveis de ambiente da Vercel (Passo 5).
3. Ainda no painel da aplicação → **Webhooks** → **Configurar notificações**:
   - **URL de produção**: `https://www.maisqapostilas.com.br/api/mp-webhook`
   - **Eventos**: marque **Pagamentos** (*payment*)
   - Clique em **Salvar** e copie a **chave secreta** que aparece (é o `MP_WEBHOOK_SECRET`).
4. No site: **Admin → Configurações → Pagamentos e Venda Direta** → **Modo de checkout**: `Checkout Pro via API (/api/mp-checkout)`.

**Como o checkout funciona nesse modo:** o cliente escolhe o formato, preenche nome/e-mail/telefone/CPF, escolhe a forma de pagamento (Pix, crédito com as parcelas calculadas, ou débito) e clica em **Finalizar e ir para o pagamento**. O sistema grava o pedido no Supabase e cria a preferência no Mercado Pago com:
- `installments: 6` (limite de 6x) e `default_installments` conforme a escolha do cliente;
- `excluded_payment_types: [{ id: "ticket" }]` → **boleto nunca aparece**;
- `external_reference` = número do pedido (é o que liga o pagamento ao pedido);
- `notification_url` = `/api/mp-webhook`;
- `auto_return: "approved"` e as `back_urls` voltando para `/minha-conta`.

Quando o pagamento é aprovado, o webhook atualiza o pedido para **Pagamento confirmado** e ele aparece na Área do Aluno.

### PASSO 5 — Variáveis de ambiente na Vercel

Na Vercel, abra o projeto → **Settings → Environment Variables** e cadastre (ambiente **Production**, e marque também Preview/Development se quiser):

| Nome | Valor | Obrigatória? |
|---|---|---|
| `MP_ACCESS_TOKEN` | Access Token de produção do Mercado Pago | Só no modo "api" |
| `MP_WEBHOOK_SECRET` | Chave secreta copiada em Webhooks | Só no modo "api" |
| `SUPABASE_URL` | `https://cjawxciaybhgabxrrtdh.supabase.co` | Só no modo "api" |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → **service_role** (secreta) | Só no modo "api" |
| `SITE_URL` | `https://www.maisqapostilas.com.br` | Só no modo "api" |

> 🔒 A chave **service_role** dá acesso total ao banco. Ela fica **apenas** na Vercel — nunca no navegador.
> Sem `MP_WEBHOOK_SECRET`, o webhook aceita as notificações e apenas registra um aviso no log. Configure para valer a assinatura.

Depois de salvar, faça **Redeploy** do projeto (Deployments → ⋯ → Redeploy) para as variáveis entrarem em vigor.

### PASSO 6 — Publicar os arquivos atualizados

Você pode enviar **todos de uma vez** (é o jeito mais seguro):

1. Vercel → seu projeto → aba **Deployments** → ⋯ → **Redeploy** (se o projeto estiver ligado ao GitHub, basta dar *commit/push*; se for upload manual, use *Add New → Project* ou a CLI `vercel --prod`).
2. **Certifique-se de que a pasta `api/` subiu junto com o `index.html`.** Sem ela, o modo "api" do checkout retorna erro 404.

**Onde vai cada arquivo** (na raiz do projeto publicado):

| Arquivo | Destino |
|---|---|
| `index.html` | raiz (`/`) |
| `supabase-config.js` | raiz (`/`) — o site o carrega como `/supabase-config.js` |
| `vercel.json` | raiz (`/`) |
| `sitemap.xml` | raiz (`/`) |
| `robots.txt` | raiz (`/`) |
| `database-schema.sql` | **não precisa publicar** (é só para rodar no Supabase) |
| `README.md` | **não precisa publicar** |
| `api/mp-checkout.js` | pasta **`api/`** |
| `api/mp-webhook.js` | pasta **`api/`** |

### PASSO 7 — Testar tudo

1. **Site**: abra `https://www.maisqapostilas.com.br` → a barra superior mostra **Área do Aluno** e o menu tem **Estados**.
2. **Cadastro de aluno**: clique em **Entrar → Criar minha conta grátis**, preencha e confirme.
3. **Venda direta**: em um produto com *Venda direta = Sim*, clique em **Comprar agora**, preencha os dados, escolha **Pix** → deve aparecer a chave Pix e o pedido é registrado. Confira em **Admin → Pedidos** (status "Aguardando pagamento", cor laranja).
4. **Pagamento de teste**: no modo "api", o Mercado Pago oferece contas/ cartões de teste. Faça um pagamento aprovado e veja o status mudar para **Pagamento confirmado** (verde) — se não mudar, confira se o webhook está cadastrado com a URL exata e se as variáveis foram salvas.
5. **Upload de capa**: **Admin → Produtos → Novo Produto** → em *Origem da capa* escolha **Upload de imagem** → envie um JPG. Se der erro, revise o **Passo 2** (bucket `capas` público + políticas).
6. **Estados**: clique em qualquer sigla (ex.: **SP**) e confira a listagem.

---

## 🧭 Como usar o painel

### Pedidos (novo)
Filtros no topo (pedido, CPF/CNPJ, período, produto, status, forma de pagamento, cupom, envio, tipo), a **legenda de cores** dos status, a lista com status / pedido / cliente / data / frete / pagto / total e a lupa para abrir o pedido. Dentro do pedido você pode mudar o status, registrar rastreio, ver o ID do Mercado Pago e **falar com o cliente no WhatsApp**.

- **Lançar pedido manual** — registra vendas feitas na Hotmart ou em sites parceiros (aparece na Área do Aluno pelo e-mail/CPF).
- **Exportar CSV** — baixa a lista filtrada.
- Selecionando pedidos, os botões **Marcar em andamento / Marcar entregue / Cancelar** alteram em lote.

**Cores dos status (iguais ao modelo que você enviou):**

| Cor | Status |
|---|---|
| 🟧 Laranja | Aguardando pagamento |
| 🟪 Roxo | Em análise |
| 🟩 Verde | Pagamento confirmado |
| 🟦 Azul | Em andamento |
| 🟢 Verde-limão | Entregue a transportadora |
| 🩵 Turquesa | Entregue |
| 🟥 Vermelho | Cancelado |

### Clientes (novo)
Lista com nome, e-mail, telefone, data de cadastro e **último pedido**, além de **Incluir novo cliente**, **Exportar registros**, **Excluir registros selecionados** e o painel lateral de filtros (nome/CPF, e-mail, perfil, aguardando aprovação, último pedido, estado e aniversariantes do mês).

### Cupons (novo)
Crie códigos de desconto (percentual ou valor fixo), com valor mínimo, limite de uso e validade. O cliente digita o cupom na tela de checkout e o desconto entra no total.

### Produtos
Agora com **Origem da capa** (link ou upload), **Venda direta no site** (Sim/Não) e **Link de pagamento do produto**. O campo *Tipo de Botão* ganhou a opção **Venda direta (site próprio)**. No formulário de produto você também vê a prévia da capa enviada.

### Configurações
Ganhou a seção **Pagamentos e Venda Direta** (modo de checkout, link padrão, chave Pix, parcelas, meios ativos, Área do Aluno).

---

## 🔐 Segurança — leia antes de vender

1. **Troque a senha do admin** (padrão `admin123`) em *Configurações → Senha Admin*.
2. **Nunca** coloque o Access Token do Mercado Pago, a chave `service_role` ou senhas no `index.html` / `supabase-config.js` — esses arquivos são públicos.
3. Enquanto o painel admin usar senha simples e o RLS estiver permissivo, qualquer pessoa com a chave pública do Supabase poderia, em tese, escrever no banco. Assim que as vendas começarem, o próximo passo recomendado é migrar o login do painel para o **Supabase Auth** (usuário admin) e restringir as políticas `admin_all_*`.
4. Faça **backup** dos pedidos: *Supabase → Table Editor → pedidos → Export* de tempos em tempos (ou use o **Exportar CSV** do painel).

---

## 🆘 Solução de problemas

**O botão "Comprar agora" não aparece** → no cadastro do produto, marque *Venda direta no site = Sim* (ou *Tipo de Botão = Venda direta*).

**O upload de capa falha** → o bucket precisa se chamar `capas`, estar **público** e ter as 4 políticas (Passo 2).

**"new row violates row-level security policy"** → rode o `database-schema.sql` completo novamente; as políticas de `clientes`, `pedidos` e `cupons` estão na parte final do arquivo.

**A Área do Aluno não mostra as compras antigas** → o pedido precisa ter o mesmo **e-mail** do cadastro, ou use **Meus dados → Vincular compras antigas** informando o e-mail/CPF usado na compra.

**O webhook não atualiza o status** → confirme a URL exata `https://www.maisqapostilas.com.br/api/mp-webhook`, o evento **Pagamentos** marcado, as variáveis `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET` / `SUPABASE_SERVICE_KEY` salvas na Vercel e o **Redeploy** feito depois.

**Erro 404 no checkout (modo api)** → a pasta `api/` não foi publicada. Ela precisa ficar na raiz, ao lado do `index.html`.

**Boleto aparecendo no Mercado Pago** → no modo "link", desmarque boleto no próprio link do Mercado Pago; no modo "api", o site já envia `excluded_payment_types: ticket`.

---

## ✅ Checklist final

- [ ] Rodei o `database-schema.sql` no Supabase
- [ ] Criei o bucket público `capas` com as 4 políticas
- [ ] Ativei o Auth por e-mail e configurei a Site URL
- [ ] Configurei o Mercado Pago (link **ou** aplicação + webhook)
- [ ] Cadastrei as variáveis de ambiente na Vercel (se usar o modo "api")
- [ ] Publiquei `index.html`, `supabase-config.js`, `vercel.json`, `sitemap.xml`, `robots.txt` e a pasta `api/`
- [ ] Marquei os produtos que terão **venda direta**
- [ ] Testei um cadastro de aluno e um pedido de teste
- [ ] Troquei a senha do admin

---

**Desenvolvido para +QApostilas** — versão 2.0 · outubro de 2026

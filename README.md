# +QApostilas — Guia definitivo (3.1)

Esta versão **resolve todos os erros** que aparecem nas suas telas e implementa o **fluxo completo Mercado Pago → área do aluno → download do PDF**, **só versão digital**, **sem barra de categorias na home** e **sem emojis** (exceto 🔥 em "Destaques" e 🆕 em "Lançamentos").

---

## 🛠️ Antes de tudo: causa dos erros que aparecem nas suas telas

| Erro na tela | Causa real | Correção |
|---|---|---|
| `Could not find the 'aceita_marketing' column of 'clientes'` | A coluna não existe ainda do lado do Supabase | Rodar o SQL completo (Passo 1) |
| `Could not find the 'capa_origem' column of 'produtos'` | Migração ainda não foi executada | Rodar o SQL completo (Passo 1) |
| `Could not find the table 'public.cupons'` | Tabela ainda não existe | Rodar o SQL completo (Passo 1) |
| `column pedidos.cliente_user_id does not exist` | Migração ainda não foi executada | Rodar o SQL completo (Passo 1) |
| `syntax error at or near //` (no print do SQL Editor) | Você colou o arquivo JavaScript `supabase-config.js` no editor SQL — ele não é SQL | Colar o `database-schema.sql` no SQL Editor |
| Busca de cliente não acha nada | Filtros são case-sensitive e não tratam acentos | Versão 3.1 usa busca **case-insensitive e sem acento** |
| "Sub básico" não dispara | Auth com confirmação de e-mail ligada trava o signUp | **Desligar** "Confirm email" (Passo 3) |

> A v3.1 foi escrita para que **toda essa lista** se resolva com os passos abaixo, sem precisar editar código.

---

## 📂 Onde vai cada arquivo

```
+qapostilas/                          ← raiz do projeto na Vercel
├── index.html                        ✅ substituir (reconstruído)
├── supabase-config.js                ✅ substituir
├── vercel.json                       ✅ cadastrar/substituir
├── sitemap.xml                       ✅ substituir (não obrigatório)
├── robots.txt                        ✅ substituir (não obrigatório)
├── database-schema.sql               ❌ NÃO publicar (rodar no Supabase)
├── README.md                         ❌ NÃO publicar (esse arquivo é seu)
└── api/
    ├── mp-checkout.js                ✅ NOVO (criar pasta api)
    └── mp-webhook.js                 ✅ NOVO
```

---

## 🚀 PASSO A PASSO (siga na ordem)

### PASSO 1 — Banco de dados (Supabase)

> Faz isso **uma única vez**. O script é idempotente: rodá-lo de novo não apaga nada.

1. Abra https://supabase.com → seu projeto da +QApostilas.
2. Menu lateral → **SQL Editor** → **New query**.
3. Abra o arquivo **`database-schema.sql`** que está junto deste README.
4. **Copie TODO o conteúdo** e **cole no editor** (não cole `supabase-config.js` nem `index.html`).
5. Clique **Run** (ou `Ctrl+Enter`).
6. Aguarde a mensagem verde "Success". Pode levar alguns segundos.

**O que ele cria/ajusta:**
- `clientes` com as colunas do seu print: `aceita_marketing`, `data_nascimento`, `estado`, `aprovacao_pendente`, `perfil`, `cpf`, `telefone`.
- `produtos` com: `capa_origem`, `capa_storage_path`, `venda_direta`, `permite_parcelamento`, `mp_link_pagamento`.
- Tabela `cupons` (a do erro "table 'public.cupons' not found").
- Coluna `pedidos.cliente_user_id` (a do erro dos pedidos).
- Tabela `pedidos` com numeração automática começando em **00401906**, status, frete, cupom, IDs do Mercado Pago.
- Tabela `mp_eventos` (log de notificações do MP).
- Coluna nova **`produtos.pdf_storage_path`** + bucket privado **`apostilas-pdf`** para liberar o download só depois do pagamento.
- Triggers, índices e políticas RLS completas.

---

### PASSO 2 — Buckets de Storage (Supabase)

Você precisa de **dois buckets**:

#### 2.1 — `capas` (público, para as imagens das apostilas)
1. Supabase → **Storage** → **New bucket** → Nome: `capas` → marque **Public bucket** → Create.
2. Clique no bucket `capas` → aba **Policies** → **New policy** → **For full customization** → crie 4 políticas (SELECT, INSERT, UPDATE, DELETE), todas com `USING (true)` e `WITH CHECK (true)`.

#### 2.2 — `apostilas-pdf` (privado, para os PDFs liberados só pós-pagamento)
1. **New bucket** → Nome: **`apostilas-pdf`** → **NÃO marque Public bucket** → Create.
2. Policies → New policy → For full customization → crie **3 políticas permissivas** (SELECT, INSERT, UPDATE) com `USING (true)` / `WITH CHECK (true)`. (DELETE não precisa por enquanto.)

> Os PDFs dos produtos vão pra `apostilas-pdf/<id-do-produto>/arquivo.pdf`. Quando o pagamento for aprovado, o webhook libera o link temporário na Área do Aluno.

---

### PASSO 3 — Autenticação e confirmação de e-mail (DESLIGAR)

Você pediu que o cliente **não precise confirmar e-mail**. Configure assim:

1. **Authentication → Sign In / Providers** → **Email** → **desmarque** "Confirm email".
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://www.maisqapostilas.com.br`
   - **Redirect URLs**: adicione `https://www.maisqapostilas.com.br/**`

Pronto. Agora o aluno cria conta + entra direto, sem precisar abrir e-mail.

---

### PASSO 4 — Mercado Pago

Você tem dois modos. **Escolha UM**, configure no painel do site (**Admin → Configurações → Pagamentos**) e mexe nas variáveis da Vercel (Passo 5) só se for o modo "api".

#### 🅰️ Modo "link" (simples, sem backend) — **recomendado pra começar**

1. https://www.mercadopago.com.br → login → **Seu negócio → Cobranças → Link de pagamento**.
2. Criar link → meios: ✅ Pix, ✅ Cartão de crédito (até 6x), ✅ Cartão de débito, ❌ Boleto.
3. Copie o link (ex.: `https://mpago.la/xxxxxx`).
4. No site: **Admin → Configurações → Pagamentos** → cole o link em **"Link padrão do Mercado Pago"** → Salvar.
5. Em cada produto com `Venda direta = Sim`, o site usa o link padrão (ou o link próprio do produto, se você preencher).

#### 🅱️ Modo "api" (Checkout Pro automático — o que você queria)

1. https://www.mercadopago.com.br/developers/panel/app → **Criar aplicação**.
2. Copie o **Access Token de produção** (começa com `APP_USR-...`). Esse token **nunca** vai para o `index.html` — fica só na Vercel (Passo 5).
3. Na mesma tela → **Webhooks** → **Configurar notificações**:
   - **URL de produção**: `https://www.maisqapostilas.com.br/api/mp-webhook`
   - **Eventos**: marque **Pagamentos** (`payment`)
   - Salve e **copie a chave secreta** que o MP mostra.
4. No site: **Admin → Configurações → Pagamentos** → **Modo de checkout = Checkout Pro via API**.

---

### PASSO 5 — Variáveis de ambiente (Vercel) — **só se usar modo "api"**

Vercel → seu projeto → **Settings → Environment Variables** (ambiente **Production**):

| Nome | O que colocar |
|---|---|
| `MP_ACCESS_TOKEN` | Access Token `APP_USR-...` |
| `MP_WEBHOOK_SECRET` | Chave secreta copiada no Webhook |
| `SUPABASE_URL` | `https://cjawxciaybhgabxrrtdh.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → **`service_role`** (NUNCA vai no JS público) |
| `SITE_URL` | `https://www.maisqapostilas.com.br` |

Depois de salvar, faça **Redeploy** do projeto (Deployments → ⋯ → Redeploy). Sem isso, as variáveis não entram em vigor.

---

### PASSO 6 — Publicar no Vercel

Suba na **raiz do projeto**: `index.html`, `supabase-config.js`, `vercel.json`, `sitemap.xml`, `robots.txt`.

Crie a **pasta `api/`** e coloque dentro dela: `mp-checkout.js` e `mp-webhook.js`.

> ⚠️ Os arquivos da pasta `api/` são **obrigatórios** se você for usar o modo "api". Sem eles, `/api/mp-checkout` retorna 404.

---

### PASSO 7 — Testar ponta a ponta

1. Abra `https://www.maisqapostilas.com.br`.
2. **Entrar → Criar conta** → preencha nome, e-mail, telefone, CPF, senha → clique **Criar conta**: deve cair direto na Área do Aluno (sem precisar abrir e-mail).
3. Em **Admin → Produtos**, edite um produto e marque **Venda direta = Sim**.
4. Abra o produto (clique na home) → veja a página **nova com capa grande** e botão **Comprar agora**.
5. Clique Comprar → preencha nome/e-mail/CPF/telefone → escolha **Pix** → **Finalizar**.
   - Modo "link": você é redirecionado pro link do MP.
   - Modo "api": você é redirecionado pro Checkout Pro do MP com Pix em destaque.
6. Pague (use cartão de teste em modo "api" ou QR Pix de teste em modo "link").
7. Volte à **Área do Aluno → Minhas compras**: o pedido deve estar verde **"Pagamento confirmado"** com botão **Baixar apostila**.
   - O botão aponta para um PDF dentro do bucket privado `apostilas-pdf`. O link é gerado pelo webhook depois da aprovação.

---

## 🗂️ Como o Mercado Pago "amarra" o pagamento ao pedido

```
1. Cliente clica "Comprar agora"
        ↓
2. Site cria um pedido na tabela "pedidos"  (status = aguardando_pagamento)
        ↓
3. Site chama /api/mp-checkout passando pedido_id
        ↓
4. mp-checkout cria uma "preferência" no Mercado Pago com
   external_reference = pedido_id
   notification_url    = https://www.maisqapostilas.com.br/api/mp-webhook
        ↓
5. Cliente paga no Mercado Pago (Pix / crédito / débito)
        ↓
6. Mercado Pago chama /api/mp-webhook com o ID do pagamento
        ↓
7. mp-webhook consulta o pagamento na API do MP
   - status = approved  → marca pedido como "pagamento_confirmado"
                        → gera signed URL do PDF em /apostilas-pdf/<id>/arquivo.pdf
                        → grava em pedido.pdf_signed_url (válido por 24h)
                        → libera "Baixar apostila" na Área do Aluno
   - status = pending   → marca "aguardando_pagamento"
   - status = in_process → marca "em_analise"
   - status = rejected/cancelled → marca "cancelado"
        ↓
8. O comprador abre Área do Aluno → Minhas compras → "Baixar apostila"
```

**Tudo automático.** Você só precisa conferir no **Admin → Pedidos** se algum ficou travado em "aguardando_pagamento" e disparar manualmente o webhook se necessário.

---

## 🆘 Solução de problemas

**"Confirm email" continua pedindo confirmação mesmo eu desligando no painel do Supabase?**
> Os usuários já criados antes da mudança continuam com a confirmação pendente. Delete-os em Authentication → Users ou peça para re-cadastrarem.

**Webhook chega mas o pedido continua laranja?**
> Confirme o caminho exato: `https://www.maisqapostilas.com.br/api/mp-webhook` (sem barra no fim, com `/api`). Veja o log em **Vercel → Deployments → Logs** e procure por `mp-webhook`.

**Botão Comprar leva para a Hotmart em vez do Mercado Pago?**
> No cadastro do produto, **Venda direta = Sim**. Se for "Não", o botão usa o `link_compra` (Hotmart/parceiro).

**Upload de capa dá erro?**
> Bucket `capas` precisa existir, estar público e ter as 4 políticas permissivas (Passo 2.1).

**PDF não baixa após o pagamento aprovado?**
> O PDF do produto precisa estar no bucket **privado** `apostilas-pdf/<id-do-produto>/arquivo.pdf`. Sem o arquivo lá, a Área do Aluno mostra "PDF ainda não enviado pelo vendedor". Faça upload em **Admin → Produtos → campo PDF**.

**Boleto continua aparecendo no checkout?**
> No modo "link": desmarque no próprio link do Mercado Pago. No modo "api": o site já envia `excluded_payment_types: [{id:"ticket"}]` — confira na aba Network do navegador.

---

## ✅ Checklist final

- [ ] Rodei `database-schema.sql` no Supabase
- [ ] Bucket público `capas` com 4 políticas
- [ ] Bucket privado `apostilas-pdf` com 3 políticas
- [ ] "Confirm email" **desligado** no Supabase Auth
- [ ] Mercado Pago configurado (link **ou** API + webhook)
- [ ] Variáveis de ambiente salvas na Vercel e **Redeploy** feito (modo "api")
- [ ] `index.html`, `supabase-config.js`, `vercel.json`, `sitemap.xml`, `robots.txt` na raiz
- [ ] Pasta `api/` com `mp-checkout.js` e `mp-webhook.js`
- [ ] Troquei a senha do admin (`admin123` → outra)
- [ ] Testei um cadastro + um Pix de teste

Rodou tudo? Site perfeito. Se travar em algum ponto, me chama.

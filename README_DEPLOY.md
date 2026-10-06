# +QApostilas — Pacote de Atualização v5

Substitua os arquivos correspondentes do seu projeto no Vercel pelos que estão nesta pasta. **Não apague nada do que já existe** — apenas sobrescreva.

---

## 📦 O que vem neste zip

```
site/
├── supabase-config.js              ← mantém as chaves públicas (anon)
├── vercel.json                     ← headers SEM cache permanente
├── site-fix.css                    ← capas maiores + preço fixo + ajustes
├── checkout-front.js               ← substitui Supabase Edge Functions p/ /api
├── api/
│   ├── checkout.js                 ← cria preferência do Mercado Pago
│   ├── webhook.js                  ← recebe notificação do MP
│   └── checkout-status.js          ← checagem "Já paguei?"
├── _example_env.txt                ← chaves do Vercel (não commitar)
└── sql/
    ├── 01_storage_v5_buckets_policies.sql
    └── 02_pedidos_clientes_produtos_v5.sql
```

---

## 🚀 Passo a passo do deploy

### 1) Banco Supabase (rode UMA vez no SQL Editor do projeto `cjawxciaybhgabxrrtdh`)

```text
Arquivo: sql/01_storage_v5_buckets_policies.sql
   → cria buckets "apostilas" (público, 5 MB) e "apostilas-pdf" (privado, 100 MB).
   → libera INSERT/UPDATE/DELETE para o painel admin.
   → resolve o erro "row-level security policy" que aparece no upload.

Arquivo: sql/02_pedidos_clientes_produtos_v5.sql
   → cria/atualiza tabelas pedidos e clientes.
   → adiciona colunas novas em produtos (capa_storage_path, arquivo_pdf_path, tipo_venda).
   → cria trigger que gera numero_pedido e codigo_acesso automaticamente.
   → não apaga nenhum produto já cadastrado.
```

Para conferir: rode `SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('apostilas','apostilas-pdf');` — devem aparecer 2 linhas.

### 2) Vercel — variáveis de ambiente

Vá em **Settings › Environment Variables** do seu projeto e crie:

| chave                              | valor (exemplo)                                 |
|------------------------------------|-------------------------------------------------|
| `MP_ACCESS_TOKEN`                  | `APP_USR-...` (Produção do Mercado Pago)        |
| `SUPABASE_URL`                     | `https://cjawxciaybhgabxrrtdh.supabase.co`      |
| `SUPABASE_SERVICE_ROLE_KEY`        | `sb_secret_...` (Supabase › Project Settings › API › service_role) |
| `SITE_URL`                         | `https://www.maisqapostilas.com.br`             |

> ⚠️ **O ACCESS TOKEN NUNCA entra em `supabase-config.js`.** Só nas variáveis do Vercel.

### 3) Vercel — arquivos do site

Substitua no seu repositório:

- `index.html`  ← o seu já está OK; só adicione **uma linha** no `<head>` e outra no final do `<body>` (veja abaixo).
- `supabase-config.js` ← sobrescreva pelo desta pasta.
- `vercel.json`           ← sobrescreva pelo desta pasta (resolve o problema de "site não atualiza" — remove cache imutável).
- `site-fix.css`          ← adicione como `<link rel="stylesheet" href="site-fix.css">` no `<head>`.
- `checkout-front.js`     ← adicione como `<script src="checkout-front.js" defer></script>` no final do `<body>` (depois do `v2_features.js`).
- `api/checkout.js`       ← novo (Vercel detecta a pasta `api/` automaticamente).
- `api/webhook.js`        ← novo.
- `api/checkout-status.js`← novo.

Linhas para colar no `index.html`:

**No `<head>` (junto com os outros `<link>`):**
```html
<link rel="stylesheet" href="site-fix.css">
```

**No final do `<body>` (depois de v2_features.js e v4a/v4b, se existirem):**
```html
<script src="checkout-front.js" defer></script>
```

### 4) Painel admin — pegar a Public Key

Faça login no **admin do site**, abra **Configurações**, aba **Checkout próprio**, e salve:

| chave `site_config`        | valor                                           |
|----------------------------|-------------------------------------------------|
| `mercadopago_public_key`   | `APP_USR-...` (public key de produção do MP)    |
| `mercadopago_parcelas`     | `12` (parcelas sem juros; até 24)                |
| `mercadopago_metodos`      | `cartao,debito,pix,boleto`                       |

> A Public Key PODE ficar em `site_config` (ela é pública mesmo — vai no checkout). O Access Token NÃO.

### 5) Webhook no painel do Mercado Pago

Vá em [Suas integrações › Webhooks](https://www.mercadopago.com.br/activities/webhooks) e cadastre:

```
URL:    https://www.maisqapostilas.com.br/api/webhook
Eventos: Pagamentos (payment)
```

### 6) Teste rápido

1. Abra uma página de produto.
2. Clique em **Comprar** → modal "Finalizar compra".
3. Preencha nome/e-mail/CPF/WhatsApp.
4. Escolha **Pix** ou **Cartão de crédito**.
5. Clique em **Ir para o pagamento** → você será redirecionado à tela oficial do Mercado Pago.

### 7) Por que o site "não atualizava" antes

O seu `vercel.json` antigo marcava os `.js` e `.css` como `max-age=31536000, immutable`. Qualquer substituição de arquivo era cacheada por 1 ano no navegador. O `vercel.json` deste zip coloca `max-age=0, must-revalidate` para `.js`, `.css` e `index.html`, então **o navegador sempre baixa a versão nova**.

---

## 🧯 Erros comuns

| erro                                                        | solução                                                                             |
|-------------------------------------------------------------|-------------------------------------------------------------------------------------|
| "Falha no envio de arquivo: row-level security policy"     | Rode o `01_storage_v5_buckets_policies.sql` no Supabase.                            |
| "Bucket not found"                                          | O mesmo arquivo acima também cria os buckets.                                       |
| Cartão não passa                                             | Chave ACCESS_TOKEN de produção? Colocou nas vars do Vercel? Restart do deploy?    |
| "Mercado Pago (401): invalid_token"                         | `MP_ACCESS_TOKEN` expirado ou errado. Gere um novo em Sua conta › Suas integrações. |
| Pix fica "pendente"                                         | O webhook está cadastrado? A URL está exata: `https://.../api/webhook`?            |
| Pedidos não aparecem para o cliente                         | Rode `02_pedidos_clientes_produtos_v5.sql` — a tabela ganhou novas colunas.         |

---

## 🗑️ O que PODE apagar

- As Edge Functions no Supabase (`mercadopago-preference`, `smooth-task`, `mercadopago-payment`, `mercadopago-webhook`, `liberar-download`) **não são mais usadas**. Pode desativar ou deletar para limpar.
- Os arquivos `v4a.js` e `v4b.js` antigos podem ficar (não causam conflito) ou serem substituídos pelo novo `checkout-front.js`.
- O `migrations-v2-site-proprio.sql`, `storage-policies-v3.sql` e `storage-policies-v4.sql` **podem** ter sido rodados antes; tudo bem. Os novos arquivos são idempotentes (rodar de novo não quebra nada).

# Guia de Deploy

Este guia detalha como fazer o deploy do **Backend (QS)** no Render e do **Frontend (QS)** na Vercel.

## Deploy do Backend (Render)

1.  **Criar Novo Web Service**:
    - Vá para o seu [Dashboard do Render](https://dashboard.render.com/).
    - Clique em **New +** -> **Web Service**.
    - Conecte seu repositório do GitHub.

2.  **Configuração**:
    - **Name**: `qs-back` (ou o nome que preferir)
    - **Region**: Escolha a mais próxima (ex: Ohio, Frankfurt).
    - **Branch**: `main`
    - **Root Directory**: `server`
    - **Runtime**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npx prisma migrate deploy && npm run start:prod`

3.  **Variáveis de Ambiente**:
    - Adicione as seguintes variáveis na aba "Environment":
        - `NODE_VERSION`: `20.11.0`
        - `DATABASE_URL`: Sua string de conexão do Supabase.
        - `JWT_SECRET`: Uma chave secreta forte para autenticação.
        - `AWS_ACCESS_KEY_ID`: Sua Access Key da AWS.
        - `AWS_SECRET_ACCESS_KEY`: Sua Secret Key da AWS.
        - `AWS_REGION`: Sua região da AWS (ex: `us-east-1`).
        - `AWS_BUCKET_NAME`: Nome do seu Bucket S3.
        - `CLOUDINARY_CLOUD_NAME`: Seu Cloud Name do Cloudinary.
        - `CLOUDINARY_API_KEY`: Sua API Key do Cloudinary.
        - `CLOUDINARY_API_SECRET`: Seu API Secret do Cloudinary.
        - `EMAIL_USER`: Email para envio de notificações.
        - `EMAIL_PASS`: Senha ou App Password do email.

4.  **Deploy**:
    - Clique em **Create Web Service**.

## Deploy do Frontend (Vercel)

1.  **Importar Projeto**:
    - Vá para o seu [Dashboard da Vercel](https://vercel.com/dashboard).
    - Clique em **Add New...** -> **Project**.
    - Importe seu repositório.

2.  **Configuração**:
    - **Framework Preset**: `Vite`
    - **Root Directory**: `client` (**IMPORTANTE**: Clique em "Edit" ao lado de Root Directory e selecione a pasta `client`. Se você pular isso, o deploy vai falhar).

3.  **Variáveis de Ambiente**:
    - Expanda a seção "Environment Variables".
    - Adicione:
        - `VITE_API_URL`: A URL do seu backend no Render (ex: `https://qs-back.onrender.com`).

4.  **Deploy**:
    - Clique em **Deploy**.

## Verificação

- **Backend**: Acesse a URL do Render (ex: `https://qs-back.onrender.com/health`) para confirmar se está rodando.
- **Frontend**: Acesse a URL da Vercel e tente logar para testar a conexão.

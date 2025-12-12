# Deployment Guide

This guide details how to deploy the **QS Backend** to Render and the **QS Frontend** to Vercel.

## Backend Deployment (Render)

1.  **Create a New Web Service**:
    - Go to your [Render Dashboard](https://dashboard.render.com/).
    - Click **New +** -> **Web Service**.
    - Connect your GitHub repository.

2.  **Configuration**:
    - **Name**: `qs-back` (or your preferred name)
    - **Region**: Choose the one closest to your users (e.g., Ohio, Frankfurt).
    - **Branch**: `main` (or your production branch)
    - **Root Directory**: `server`
    - **Runtime**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npx prisma migrate deploy && npm run start:prod`

3.  **Environment Variables**:
    - Add the following environment variables in the "Environment" tab:
        - `NODE_VERSION`: `20.11.0`
        - `DATABASE_URL`: Your Supabase connection string.
        - `JWT_SECRET`: A strong secret key for authentication.
        - `AWS_ACCESS_KEY_ID`: Your AWS Access Key.
        - `AWS_SECRET_ACCESS_KEY`: Your AWS Secret Key.
        - `AWS_REGION`: Your AWS Region (e.g., `us-east-1`).
        - `AWS_BUCKET_NAME`: Your S3 Bucket Name.
        - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name.
        - `CLOUDINARY_API_KEY`: Your Cloudinary API Key.
        - `CLOUDINARY_API_SECRET`: Your Cloudinary API Secret.
        - `EMAIL_USER`: Email address for sending notifications.
        - `EMAIL_PASS`: Password or App Password for the email.

4.  **Deploy**:
    - Click **Create Web Service**. Render will start the build and deployment process.

## Frontend Deployment (Vercel)

1.  **Import Project**:
    - Go to your [Vercel Dashboard](https://vercel.com/dashboard).
    - Click **Add New...** -> **Project**.
    - Import your GitHub repository.

2.  **Configuration**:
    - **Framework Preset**: `Vite`
    - **Root Directory**: `client` (Click "Edit" next to Root Directory and select `client`).

3.  **Environment Variables**:
    - Expand the "Environment Variables" section.
    - Add:
        - `VITE_API_URL`: The URL of your deployed Render backend (e.g., `https://qs-back.onrender.com`).

4.  **Deploy**:
    - Click **Deploy**. Vercel will build and deploy your frontend.

## Verification

- **Backend**: Visit your Render URL (e.g., `https://qs-back.onrender.com/health` or a known endpoint) to confirm it's running.
- **Frontend**: Visit your Vercel URL and try to log in or interact with the backend to ensure the connection is working.

# MarineProcure AWS + Vercel Deployment Guide

This guide explains how to deploy MarineProcure for client handover using:

- Frontend: Vercel
- Backend API: AWS EC2
- Database: AWS RDS PostgreSQL
- File uploads: AWS S3
- Process manager: PM2
- Reverse proxy/SSL: Nginx + Certbot

## 1. Production Architecture

```text
Client Browser
  -> Vercel React Frontend
  -> AWS EC2 Node/Express API
  -> AWS RDS PostgreSQL
  -> AWS S3 for uploaded documents
```

## 2. AWS RDS PostgreSQL

Create an RDS PostgreSQL database.

Recommended starter settings:

- Engine: PostgreSQL
- Instance: db.t3.micro or db.t4g.micro where available
- Database name: marineprocure
- Public access: No for production, Yes only for temporary setup/testing
- Backup retention: 7 days minimum
- Storage autoscaling: enabled if budget allows

After database creation, copy the RDS endpoint and use it in `DATABASE_URL`.

Example:

```env
DATABASE_URL=postgresql://db_user:db_password@your-rds-endpoint.amazonaws.com:5432/marineprocure
```

Run schema and seed:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

## 3. AWS S3 Upload Bucket

Create an S3 bucket for documents.

Recommended:

- Bucket name: marineprocure-client-documents
- Block public access: keep enabled unless public file URLs are required
- Use IAM user or IAM role with PutObject/GetObject permissions

Backend environment values:

```env
USE_S3_UPLOADS=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
```

For stronger production security, use private S3 objects and signed URLs later.

## 4. AWS EC2 Backend Server

Create an Ubuntu EC2 instance.

Recommended starter:

- Ubuntu 22.04 LTS or 24.04 LTS
- t2.micro/t3.micro for demo
- Open ports: 22, 80, 443
- Keep port 5000 closed publicly if using Nginx reverse proxy

Install server dependencies:

```bash
sudo apt update
sudo apt install -y nodejs npm nginx git postgresql-client certbot python3-certbot-nginx
sudo npm install -g pm2
```

Clone repo:

```bash
git clone https://github.com/Abobbynwa/marine-procurement-frontend.git
cd marine-procurement-frontend/backend
npm install
cp .env.example .env
nano .env
```

Production backend `.env` example:

```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-vercel-domain.vercel.app
DATABASE_URL=postgresql://db_user:db_password@your-rds-endpoint.amazonaws.com:5432/marineprocure
JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d
USE_S3_UPLOADS=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=MarineProcure <your_email@gmail.com>
```

Start backend:

```bash
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 5. Nginx Reverse Proxy

Create Nginx config:

```bash
sudo nano /etc/nginx/sites-available/marineprocure-api
```

Example:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/marineprocure-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Enable SSL:

```bash
sudo certbot --nginx -d api.yourdomain.com
```

## 6. Vercel Frontend

Import the GitHub repo into Vercel.

Vercel settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variable:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Redeploy after saving environment variable.

## 7. Admin Console

Admin console path:

```text
/admin-console
```

Only users with role `admin` can access it.

Initial test login from seed data:

```text
Email: admin@marineprocure.com
Password: Password123!
```

Change the admin password immediately before client use.

## 8. Client Handover Checklist

- Backend is live on HTTPS.
- Frontend is live on Vercel.
- RDS database is connected.
- S3 upload bucket is configured.
- Admin login tested.
- Admin Console tested.
- Purchase request to payment workflow tested.
- PDF download tested.
- Email notification config tested.
- Audit logs tested.
- Client receives admin guide.

## 9. Maintenance Notes

- Review AWS billing weekly during the first month.
- Enable RDS backups.
- Rotate JWT_SECRET and passwords when needed.
- Keep `.env` private.
- Never commit production credentials to GitHub.
- Use stronger admin credentials for production.

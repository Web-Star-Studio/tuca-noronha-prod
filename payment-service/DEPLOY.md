# 🚀 Deploy do Payment Service

## Opções de Deploy Recomendadas

### 1. **Railway (RECOMENDADO) - Mais Fácil**
Railway é o mais simples e tem free tier generoso.

**Passos:**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd payment-service
railway up
```

**Configuração no Railway Dashboard:**
- Adicione as variáveis de ambiente do `.env`
- Configure domínio customizado: `payments.tucanoronha.com.br`
- SSL automático incluído

**Custo:** Free tier inclui $5/mês de créditos

---

### 2. **Render - Segunda Melhor Opção**

**Deploy via GitHub:**
1. Push o código para GitHub
2. Conecte no [render.com](https://render.com)
3. Create New > Web Service
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

**Custo:** Free tier com 750h/mês

---

### 3. **Fly.io - Para Escala Global**

**fly.toml:**
```toml
app = "tuca-payment-service"
primary_region = "gru"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[checks]
  [checks.alive]
    type = "http"
    interval = "10s"
    timeout = "2s"
    method = "GET"
    path = "/health"
```

**Deploy:**
```bash
fly launch
fly deploy
fly secrets set MERCADO_PAGO_ACCESS_TOKEN=xxx
```

**Custo:** Free tier com 3 VMs compartilhadas

---

### 4. **Google Cloud Run - Serverless**

**Deploy direto:**
```bash
# Build e push da imagem
gcloud builds submit --tag gcr.io/PROJECT-ID/payment-service

# Deploy
gcloud run deploy payment-service \
  --image gcr.io/PROJECT-ID/payment-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Custo:** 2M requests free/mês

---

### 5. **Vercel (Adaptação Necessária)**

Precisa converter para serverless functions:

**api/payments.ts:**
```typescript
import { createCheckoutPreference } from '../src/services/mercadopago.service';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const result = await createCheckoutPreference(req.body);
    return res.json(result);
  }
}
```

---

### 6. **VPS Tradicional (DigitalOcean, Linode)**

**Setup com PM2:**
```bash
# No servidor
git clone <repo>
cd payment-service
npm install
npm run build

# Instalar PM2
npm install -g pm2

# Iniciar com PM2
pm2 start dist/index.js --name payment-service
pm2 save
pm2 startup

# Configurar Nginx
sudo nano /etc/nginx/sites-available/payment-service
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name payments.tucanoronha.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Custo:** $5-10/mês

---

## 🔐 Configuração de Produção

### Variáveis de Ambiente Obrigatórias:
```env
NODE_ENV=production
PORT=3001
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx
MERCADO_PAGO_WEBHOOK_SECRET=xxx
API_KEY=your-secure-key-here
CONVEX_URL=https://wonderful-salmon-48.convex.cloud
FRONTEND_URL=https://tucanoronha.com.br
```

### DNS Configuration:
Adicione no seu DNS:
```
Type: A
Name: payments
Value: <IP do servidor>
```

Ou para CNAME:
```
Type: CNAME  
Name: payments
Value: <url-do-deploy.railway.app>
```

---

## 📊 Comparação Rápida

| Plataforma | Facilidade | Custo | Performance | Escala |
|------------|------------|-------|-------------|--------|
| Railway | ⭐⭐⭐⭐⭐ | Free-$5 | Ótima | Auto |
| Render | ⭐⭐⭐⭐ | Free | Boa | Auto |
| Fly.io | ⭐⭐⭐ | Free | Excelente | Global |
| Cloud Run | ⭐⭐⭐ | Free-Pay | Excelente | Infinita |
| Vercel | ⭐⭐⭐⭐ | Free | Ótima | Auto |
| VPS | ⭐⭐ | $5-10 | Boa | Manual |

---

## 🎯 Recomendação

**Para começar rápido:** Railway ou Render
**Para produção séria:** Google Cloud Run ou Fly.io
**Para controle total:** VPS com PM2

---

## 🔄 CI/CD com GitHub Actions

**.github/workflows/deploy.yml:**
```yaml
name: Deploy Payment Service

on:
  push:
    branches: [main]
    paths:
      - 'payment-service/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: payment-service
```

---

## 📝 Checklist de Deploy

- [ ] Configurar variáveis de ambiente
- [ ] Testar localmente com NODE_ENV=production
- [ ] Configurar domínio customizado
- [ ] Configurar SSL/HTTPS
- [ ] Testar webhooks em produção
- [ ] Configurar monitoramento (Sentry, DataDog)
- [ ] Configurar backups
- [ ] Documentar URLs de produção

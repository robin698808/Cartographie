
---

## Déploiement en production

| Service | Plateforme | URL |
|---------|------------|-----|
| Frontend | Vercel | https://cartographie-47pf-lake.vercel.app/ |
| Backend | Railway | https://cartographie-production-76cc.up.railway.app |

### Variables d'environnement Railway

```env
DATABASE_URL=postgresql://...  # fourni par Railway
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=https://cartographie-47pf-lake.vercel.app
```

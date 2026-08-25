# Déploiement StatusMarket sur Render

## Architecture

- **API** : Express.js (Node.js) → Web Service sur Render
- **Web** : Vite + React (static) → Static Site sur Render
- **Base de données** : Supabase (déjà configuré)

## Étapes de déploiement

### 1. Préparer le repo Git

```bash
git add -A
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Déployer sur Render

1. Allez sur [render.com](https://render.com) et connectez-vous
2. Cliquez sur **New** → **Blueprint**
3. Sélectionnez votre repo GitHub `StatusMarket`
4. Render détectera automatiquement `render.yaml` et créera 2 services :
   - `statusmarket-api` (Web Service, plan free)
   - `statusmarket-web` (Static Site, plan free)

### 3. Configurer les variables d'environnement

#### API (`statusmarket-api`)
Dans le dashboard Render → Service `statusmarket-api` → Environment :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | votre clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | votre clé service role Supabase |
| `CORS_ORIGIN` | `https://statusmarket-web.onrender.com` |

> **Important** : `CORS_ORIGIN` doit contenir l'URL du frontend déployé. Ajoutez aussi `http://localhost:5173` séparé par une virgule pour le dev local : `https://statusmarket-web.onrender.com,http://localhost:5173`

#### Web (`statusmarket-web`)
Dans le dashboard Render → Service `statusmarket-web` → Environment :

| Variable | Valeur |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | votre clé anon Supabase |
| `VITE_API_URL` | `https://statusmarket-api.onrender.com` |

### 4. URLs après déploiement

- **Frontend** : `https://statusmarket-web.onrender.com`
- **API** : `https://statusmarket-api.onrender.com`
- **Health check** : `https://statusmarket-api.onrender.com/health`

### 5. Configurer Supabase

Dans Supabase Dashboard → Authentication → URL Configuration :

- **Site URL** : `https://statusmarket-web.onrender.com`
- **Redirect URLs** : ajoutez `https://statusmarket-web.onrender.com/**`

### 6. Lancer le seed (optionnel)

Dans Supabase SQL Editor, exécutez `supabase/seed.sql` pour créer les données de démonstration.

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | `admin@test.com` | `Admin1234!` |
| Vendeur | `vendeur@test.com` | `Test1234!` |

## Passage en mode payant

Quand vous passez en plan payant sur Render :

1. Dashboard Render → Service → **Change Plan**
2. Choisissez **Starter** ou supérieur
3. L'API ne s'endormira plus (le plan free s'endort après 15 min d'inactivité)
4. Le démarrage à froid disparaît

## Notes

- Le plan free de Render s'endort après 15 min d'inactivité → premier request prend ~30s
- Les builds automatiques se déclenchent à chaque `git push` sur `main`
- Pour désactiver l'auto-deploy : Service → Settings → Auto-Deploy → Off

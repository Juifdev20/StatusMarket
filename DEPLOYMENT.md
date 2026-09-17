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
| `CORS_ORIGIN` | `https://statusmarket-agh0.onrender.com,https://www.statusmarket.store` |
| `SITE_URL` | `https://statusmarket-agh0.onrender.com` (temporaire, voir note) |

> **Important** : `CORS_ORIGIN` doit contenir toutes les origines autorisées à appeler l'API, séparées par une virgule. On y met dès maintenant `www.statusmarket.store` même si le DNS n'est pas encore branché, pour ne pas devoir y revenir après.

> **Note `SITE_URL`** : tant que le domaine n'est pas pointé vers Render (étape 5), laissez `SITE_URL` sur l'URL `.onrender.com` du frontend pour que les liens de partage restent fonctionnels dès aujourd'hui. Une fois le domaine actif, changez-la pour `https://www.statusmarket.store` (et pareil pour `VITE_SITE_URL` ci-dessous).

#### Web (`statusmarket-web`)
Dans le dashboard Render → Service `statusmarket-web` → Environment :

| Variable | Valeur |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | votre clé anon Supabase |
| `VITE_API_URL` | `https://statusmarketapi.onrender.com` |
| `VITE_SITE_URL` | `https://statusmarket-agh0.onrender.com` (temporaire, voir note ci-dessus) |

> Après avoir créé le service API, notez son URL réelle et mettez-la aussi à jour dans `render.yaml` (règle de rewrite `/og/*`) — Render ne permet pas de la référencer dynamiquement entre services.

### 4. URLs après déploiement (avant configuration du domaine)

- **Frontend** : `https://statusmarket-agh0.onrender.com`
- **API** : `https://statusmarketapi.onrender.com`
- **Health check** : `https://statusmarketapi.onrender.com/health`

### 5. Pointer le domaine statusmarket.store (GoDaddy) vers Render

Le domaine est enregistré chez GoDaddy avec ses nameservers par défaut (`ns*.domaincontrol.com`) — pas besoin de Cloudflare.

1. Sur Render → Service `statusmarket-web` → **Settings** → **Custom Domains** → ajouter `www.statusmarket.store`. Render indique le CNAME cible à créer.
2. Sur GoDaddy → DNS de `statusmarket.store` → ajouter un enregistrement **CNAME** : `www` → cible fournie par Render.
3. Toujours sur GoDaddy → onglet **Forwarding** → rediriger `statusmarket.store` (apex, sans www) vers `https://www.statusmarket.store` (redirection permanente 301, "Forward only").
4. Attendre la propagation DNS (jusqu'à quelques heures), puis vérifier que Render a bien émis le certificat SSL pour `www.statusmarket.store`.

### 6. Configurer Supabase

Dans Supabase Dashboard → Authentication → URL Configuration :

- **Site URL** : `https://www.statusmarket.store`
- **Redirect URLs** : ajoutez `https://www.statusmarket.store/**`

### 7. Lancer le seed (optionnel)

Dans Supabase SQL Editor, exécutez `supabase/seed.sql` pour créer les données de démonstration.

## Note sur `cloudflare/`

Le worker `cloudflare/og-worker.js` n'est plus utilisé (le domaine ne passe pas par les nameservers Cloudflare). Les liens OG passent maintenant directement par la règle de rewrite `/og/*` dans `render.yaml`. Ce dossier peut être supprimé si vous ne comptez pas migrer vers Cloudflare plus tard.

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

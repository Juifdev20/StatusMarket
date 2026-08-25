# StatusMarket

> Ta boutique, un seul lien.

Plateforme e-commerce qui transforme les statuts WhatsApp des commerçants en véritable canal de vente. Un vendeur publie une photo sur son statut WhatsApp accompagnée d'un lien unique ; ce lien ouvre sa boutique en ligne complète.

## Stack

- **Frontend** : React + Vite + TypeScript + Tailwind CSS
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : Supabase (PostgreSQL managé)
- **Auth** : Supabase Auth
- **Stockage** : Supabase Storage
- **PWA** : vite-plugin-pwa

## Structure

```
statusmarket/
├── apps/
│   ├── web/          # Frontend React (Vite)
│   └── api/          # Backend Express
├── supabase/
│   └── migrations/   # Fichiers SQL versionnés
├── .env.example
└── README.md
```

## Configuration

1. Copier `.env.example` en `.env` et remplir avec les clés Supabase.
2. Exécuter les migrations SQL dans `/supabase/migrations/` via le SQL Editor Supabase ou la CLI Supabase.

## Démarrage

### Backend

```bash
cd apps/api
npm install
npm run dev
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

## Rôles

- `CLIENT` : consultation publique (pas de compte requis pour naviguer)
- `SELLER` : gestion de boutique, produits, statuts, abonnement
- `SUPER_ADMIN` : administration de la plateforme

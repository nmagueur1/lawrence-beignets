# 🍩 Lawrence Beignets — Site web (Vercel)

Version navigateur de la tablette in-game : même Firestore que le bot Discord, déploiement 100% séparé (dossier autonome, aucun fichier du bot importé). Statut : **prototype non testé en conditions réelles** — vérifié uniquement par `node --check`, jamais déployé ni exécuté contre le vrai Firebase dans cette session.

## 1. Ce que c'est

- `index.html` / `style.css` / `app.js` — site statique (aucun framework, aucun build)
- `api/*.js` — fonctions serverless Vercel (une par endpoint), authentifiées par cookie de session
- `api/_lib/` — code partagé (connexion Firestore, session, lecture/écriture des données)

Aucune dépendance au dossier `src/` du bot : ce dossier peut être déployé seul, dans son propre projet Vercel, avec son propre repo Git si tu veux.

## 2. Connexion — comment ça marche

Le site réutilise **le même mécanisme que la tablette in-game** : sur Discord, `/tablette lier` génère un code à 6 caractères (5 minutes, usage unique). Le joueur l'entre sur le site → une session est créée (cookie `lb_session`, httpOnly, 30 jours) → il est reconnu à chaque visite jusqu'à déconnexion ou expiration.

Un même code Discord peut servir à lier soit la tablette en jeu, soit le site — au choix, un seul système de liaison pour les deux.

## 3. Variables d'environnement (à définir dans Vercel, pas dans un fichier commit)

Dans **Project Settings → Environment Variables** sur vercel.com :

```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...          # garde les \n littéraux, entre guillemets
TABLET_NOTIFY_WEBHOOK_URL=...     # optionnel — notifie un salon Discord des déclarations
```

Ce sont exactement les mêmes valeurs que dans le `.env` du bot (même projet Firebase). Ne les commit jamais dans ce dossier.

## 4. Déployer

**Option A — via l'interface Vercel :**
1. Pousse ce dossier (`lawrence-web/`) dans un repo GitHub (séparé du bot, ou même repo avec ce dossier comme racine du projet Vercel).
2. Sur vercel.com → **Add New → Project** → importe le repo.
3. Si c'est le même repo que le bot : dans **Root Directory**, sélectionne `lawrence-web`.
4. Framework Preset : **Other** (aucun build nécessaire, c'est du HTML/JS statique + fonctions serverless).
5. Ajoute les variables d'environnement (section 3).
6. Deploy.

**Option B — via la CLI :**
```bash
npm i -g vercel
cd lawrence-web
vercel
```
Suit les prompts, puis configure les variables d'environnement avec `vercel env add` (ou depuis le dashboard).

Aucun `vercel.json` n'est nécessaire : Vercel détecte automatiquement `api/*.js` comme fonctions serverless et sert le reste (`index.html`, `style.css`, `app.js`) statiquement.

## 5. Ce qui est fonctionnel

Identique à la tablette in-game (voir `SETUP_TABLETTE.md` à la racine du projet bot) : profil, salaire, points, classement, déclaration de vente (non-autoritative, validation staff toujours requise via `/valider-vente`), demande d'absence (écrit dans la même collection que `/absence demander`), règlement, organigramme.

## 6. Limites connues

- Mêmes limites que la tablette (pas d'admin, pas de fil d'annonces stocké) — voir `SETUP_TABLETTE.md`.
- Session liée au compte Discord, pas à un personnage RP.
- Pas de rate-limiting sur `/api/link` : un acharnement par force brute sur des codes à 6 caractères reste théoriquement possible sur un temps très court (5 min de validité) — acceptable pour un prototype, à durcir avant une mise en prod à grande échelle (ex: limiter les tentatives par IP).
- Pas testé en conditions réelles dans cette session : ni déployé sur Vercel, ni connecté à ton vrai Firestore. Vérifié uniquement par lecture de code et `node --check`.

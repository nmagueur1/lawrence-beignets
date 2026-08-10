# 🍩 Lawrence Doughnuts — Bot Discord

Système de gestion d'entreprise GTA RP pour **Lawrence Doughnuts** : recrutement, tickets, salons de paie, ventes, primes, points, sanctions, absences, dashboard, administration.

> Voir [`ARCHITECTURE.md`](./ARCHITECTURE.md) pour l'architecture technique complète et le schéma Firestore.

---

## 1. Prérequis

- Node.js 20 ou plus récent
- Un serveur Discord où tu es propriétaire/administrateur
- Un compte Google pour créer un projet Firebase (gratuit, offre Spark suffisante pour démarrer)

## 2. Créer le bot Discord

1. Va sur https://discord.com/developers/applications → **New Application** → nomme-la `Lawrence Doughnuts`.
2. Onglet **Bot** → **Add Bot**. Active :
   - `Server Members Intent`
   - `Message Content Intent`
3. Copie le **Token** (bouton "Reset Token" si besoin) → à mettre dans `DISCORD_TOKEN`.
4. Onglet **General Information** → copie l'**Application ID** → à mettre dans `CLIENT_ID`.
5. Onglet **OAuth2 → URL Generator** :
   - Scopes : `bot`, `applications.commands`
   - Permissions : `Administrator` (le plus simple pour un bot de gestion interne), ou au minimum : Gérer les salons, Gérer les rôles, Envoyer des messages, Gérer les messages, Intégrer des liens, Joindre des fichiers, Utiliser les commandes slash, Créer des tickets privés (Gérer les salons).
6. Ouvre l'URL générée, invite le bot sur ton serveur Lawrence Doughnuts.
7. Active le mode développeur Discord (Paramètres → Avancés) puis clic droit sur ton serveur → **Copier l'ID** → à mettre dans `GUILD_ID`. Fais la même chose sur ton propre profil pour `OWNER_ID`.

## 3. Créer le projet Firebase

1. Va sur https://console.firebase.google.com → **Ajouter un projet** → nomme-le `lawrence-doughnuts` (ou autre).
2. Une fois créé, va dans **Compilation → Firestore Database** → **Créer une base de données** → mode production → choisis une région proche.
3. Va dans **Paramètres du projet (⚙️) → Comptes de service** → **Générer une nouvelle clé privée**. Un fichier `.json` est téléchargé.
4. Dans ce fichier JSON, récupère :
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (garde les `\n` littéraux, colle la valeur entre guillemets telle quelle)

⚠️ Ne commit jamais ce fichier JSON ni le `.env` dans Git.

## 4. Configuration locale

```bash
cp .env.example .env
# puis remplis .env avec tes valeurs
npm install
```

## 5. Déployer les commandes slash

```bash
npm run deploy
```

À relancer à chaque fois qu'une commande est ajoutée ou modifiée.

## 6. Démarrer le bot

```bash
npm start
# ou en développement (redémarrage auto) :
npm run dev
```

## 6bis. Déploiement sur Railway

1. Pousse le projet sur un dépôt GitHub (assure-toi que `.env` est bien ignoré — voir `.gitignore`).
2. Sur https://railway.app → **New Project → Deploy from GitHub repo** → sélectionne le dépôt.
3. Railway détecte automatiquement Node.js et exécute `npm install` puis `npm start` (défini dans `package.json`). Aucun `Procfile` n'est nécessaire.
4. Dans l'onglet **Variables** du service Railway, ajoute exactement les mêmes variables que dans `.env.example` (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `OWNER_ID`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) — ne pousse jamais le fichier `.env` lui-même.
   - Pour `FIREBASE_PRIVATE_KEY`, colle la clé avec les `\n` littéraux (comme dans `.env.example`) : Railway la transmet telle quelle, et `src/database/firebase.js` la convertit déjà en vrais retours à la ligne au démarrage.
5. Le déploiement de commandes slash (`npm run deploy`) n'a pas besoin de tourner en continu : exécute-le une fois en local (ou via `railway run npm run deploy`) à chaque ajout/modification de commande. Le process Railway lui-même ne doit lancer que `npm start` (le bot lui-même), pas `deploy`.
6. Vérifie les logs dans l'onglet **Deployments → View Logs** pour confirmer `[Lawrence Doughnuts] Connecté en tant que ...`.

## 7. Premier lancement sur le serveur

1. Assure-toi que les rôles suivants existent déjà sur le serveur, avec **exactement** ces noms :
   `👑・PATRON`, `✨・CO-PATRON`, `🧠・MANAGER`, `👥・PRO`, `👤・NOVICE`, `🌲・PINE`, `🗽・GOUVERNEMENT`, `✈️・VISITEUR`.
2. En tant que PATRON ou CO-PATRON, lance `/setup`. Cette commande est **idempotente** (relançable sans risque) :
   - détecte les rôles existants (elle ne les crée jamais)
   - crée uniquement les salons manquants, sans dupliquer ceux déjà présents
   - initialise la configuration par défaut (tarifs, permissions, etc.) dans Firestore
   - poste/actualise les panels (accueil, informations, règlement)
3. Édite le règlement avec `/reglement modifier`.

## 8. Commandes disponibles

| Commande | Accès | Description |
|---|---|---|
| `/setup` | Direction | Configure/synchronise le serveur (idempotent) |
| `/reglement voir\|modifier` | Tous / Direction | Consulter ou modifier le règlement |
| `/recrutement ouvrir\|fermer\|statut` | Direction / Tous | Gérer le statut du recrutement |
| `/valider-vente` | Manager+ | Valider une vente et calculer la prime |
| `/salaire voir\|historique` | Soi-même / Manager+ | Situation de paie et historique |
| `/payer` | Direction (Manager selon config) | Payer un employé |
| `/points voir\|historique` | Soi-même / Manager+ | Consulter les points |
| `/points-regle ajouter\|modifier\|supprimer\|liste` | Direction | Gérer le barème de points |
| `/classement points\|ventes\|gains` | Tous | Classements |
| `/profil` | Soi-même / Manager+ | Profil complet d'un employé |
| `/sanction` / `/sanctions` | Manager+ / Manager+ | Émettre / consulter les sanctions |
| `/absence demander\|historique` | Tous / Manager+ | Demandes d'absence |
| `/promotion` / `/retrogradation` | Direction | Changer le grade d'un employé |
| `/note ajouter\|liste` | Manager+ | Notes internes staff |
| `/organigramme` | Manager+ | Actualiser l'organigramme |
| `/dashboard` | Manager+ | Tableau de bord interactif |
| `/annonce` | Manager+ | Publier une annonce dans #annonces |
| `/admin config voir\|tarif\|paiement-manager` | Direction | Configuration (tarifs, permissions) |
| `/backup create\|list\|restore` | Direction | Sauvegardes Firestore |
| `/maintenance on\|off` | Direction | Mode maintenance |
| `/status` | Tous | État du bot |
| Clic droit → 🍩/💰/🏆 | Soi-même / Manager+ | Raccourcis profil/salaire/points |

Tâches automatiques : rapport hebdomadaire (chaque lundi 9h) et employé du mois (1er du mois, 9h), publiés dans #annonces.

## 9. Structure du projet

Voir `ARCHITECTURE.md` section 2.

## 10. Dépannage

- **`FIREBASE_PRIVATE_KEY` invalide** : vérifie que la clé est bien entre guillemets dans `.env` et que les `\n` n'ont pas été convertis en vrais retours à la ligne par ton éditeur.
- **Les commandes slash n'apparaissent pas** : relance `npm run deploy`, patiente 1 minute, ou recharge Discord (Ctrl+R).
- **`/setup` dit qu'un rôle est manquant** : le nom du rôle Discord doit correspondre exactement (emoji inclus) à celui listé en section 7 ci-dessus.
- **Erreur générique affichée à l'utilisateur** : les détails techniques sont toujours dans les logs du process Node (console), jamais exposés à l'utilisateur final.
- **`FAILED_PRECONDITION: The query requires an index`** : Firestore a besoin d'un index composite pour certaines requêtes (rapport hebdomadaire, historique). Les logs affichent un lien direct — clique dessus pour créer l'index automatiquement (le message d'erreur inclut toujours l'URL exacte). Concerne surtout `sales` (status + validatedAt) et `points` (createdAt).

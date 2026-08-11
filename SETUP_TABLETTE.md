# 📱 Tablette in-game — installation (prototype)

Statut : **prototype non testé en conditions réelles**. Le code est écrit, vérifié syntaxiquement (`node --check` sur tout le JS), mais jamais exécuté contre ton vrai bot Discord / Firebase / serveur FiveM dans cette session — je n'ai touché à aucune credential réelle. À toi de tester en local avant prod.

## 1. Ce que ça ajoute (rien n'est modifié dans le bot existant)

- 1 nouvelle commande Discord : `/tablette lier` (génère un code de liaison)
- 2 nouveaux repos Firestore : `tabletLinks` (codes éphémères), `players` (identifiant FiveM ↔ discordId)
- 1 nouveau repo Firestore : `saleRequests` (déclarations de vente en attente, ne touche jamais aux ventes/soldes réels)
- 1 process Node séparé : `src/api/` — un petit serveur Express qui sert de pont entre la tablette et Firestore. Il tourne **indépendamment** du bot (`npm run start:tablet-api`, différent de `npm start`) et réutilise tes services existants (EmployeeService, PayrollService, PointService, AbsenceService, ConfigService) sans les modifier.
- 1 ressource FiveM : `fivem-tablette/` (NUI + Lua)

Le bot Discord n'a subi aucune modification de fichier existant : tout est additif.

## 2. Variables d'environnement à ajouter (.env du bot)

```
TABLET_API_KEY=choisis-un-secret-long-et-aleatoire
TABLET_API_PORT=3939
TABLET_NOTIFY_WEBHOOK_URL=https://discord.com/api/webhooks/xxxx/yyyy   # optionnel
```

- `TABLET_API_KEY` : doit être identique à `Config.ApiKey` dans `fivem-tablette/server/config.lua`. Sans elle, l'API refuse toutes les requêtes (401).
- `TABLET_NOTIFY_WEBHOOK_URL` : webhook d'un salon (ex: #tickets-staff) qui reçoit une notif à chaque déclaration de vente ou demande d'absence faite depuis la tablette. Optionnel : sans lui, les données sont quand même écrites en Firestore, juste pas notifiées.

## 3. Installer et lancer l'API

```bash
npm install          # récupère express (ajouté à package.json)
npm run start:tablet-api
```

Ça démarre un serveur HTTP local sur le port `TABLET_API_PORT` (3939 par défaut). Aucune connexion Discord gateway dans ce process — uniquement Firestore (mêmes credentials que le bot) et, si configuré, un appel webhook.

En prod (ex: Railway), c'est un **deuxième service** à déployer à côté du bot (même repo, commande de démarrage `npm run start:tablet-api`), avec les mêmes variables Firebase + `TABLET_API_KEY`.

## 4. Déployer la commande Discord

```bash
npm run deploy
```

Ajoute `/tablette lier` aux commandes slash. Nécessite d'être un employé enregistré pour l'utiliser.

## 5. Installer la ressource FiveM

1. Copie le dossier `fivem-tablette/` dans `resources/` de ton serveur FiveM.
2. Édite `fivem-tablette/server/config.lua` :
   - `Config.ApiBaseUrl` → l'adresse où tourne l'API (`http://127.0.0.1:3939` en local, ton URL publique en prod)
   - `Config.ApiKey` → identique à `TABLET_API_KEY`
3. Ajoute dans `server.cfg` :
   ```
   ensure lawrence-tablette
   ```
4. En jeu : touche **F6** (ou commande `/tablette`) ouvre/ferme la tablette.

## 6. Lier un joueur

1. Sur Discord, l'employé lance `/tablette lier` → reçoit un code à 6 caractères (valable 5 minutes, usage unique).
2. En jeu, il ouvre la tablette → écran de liaison → entre le code.
3. La tablette est liée à son identifiant FiveM (license Rockstar par défaut). Il a accès à son profil, salaire, points, etc.

## 7. Ce qui est fonctionnel côté tablette

| App | Ce qu'elle fait |
|---|---|
| 👤 Profil | Lecture seule : nom RP, grade, stats |
| 💰 Salaire | Solde, historique ventes/paiements |
| 🏆 Points | Total + historique |
| 📊 Classement | Top 10 points / ventes / gains |
| 🍩 Déclarer une vente | Crée une demande (`saleRequests`, PENDING) + notif staff. **Ne modifie jamais le solde** : un Manager doit toujours valider via `/valider-vente` comme aujourd'hui. |
| 📅 Absence | Écrit directement dans la même collection `absences` que `/absence demander` — apparaît normalement dans `/absence historique` et le circuit de validation existant. |
| 📜 Règlement | Lecture du règlement configuré (`/reglement voir`) |
| 📋 Organigramme | Liste des employés par grade |

## 8. Limites connues / pas construit

- **Pas d'admin sur la tablette** : sanctions, promotions, paiements, config restent exclusivement sur Discord (volontaire, ce sont des actions sensibles de Direction).
- **Pas de fil d'annonces** : les annonces (`/annonce`) ne sont aujourd'hui pas stockées dans Firestore (juste postées + loguées), donc pas rejouables sur la tablette telles quelles. Ajouter ça proprement demanderait une petite `AnnouncementService` avec stockage — pas fait ici, à voir si utile.
- **Identité = compte Discord, pas personnage RP** : la liaison se fait sur l'identifiant FiveM (`license:...`) d'un joueur, pas sur un `citizenid` de personnage. Si tu veux un lien par personnage (utile en multi-perso ESX/QBCore), il faut adapter `getIdentifier()` dans `server/main.lua`.
- **Standalone par défaut** : aucune dépendance ESX/QBCore. Si tu veux ouvrir la tablette via un item d'inventaire plutôt qu'une commande libre, `Config.UseItem` dans `shared/config.lua` est prévu comme point d'entrée, mais le branchement sur l'event `useItem` de ton framework reste à faire (dépend d'ESX vs QBCore vs autre).
- **Pas testé en conditions réelles** : aucune exécution contre ton vrai Firebase/Discord/serveur FiveM dans cette session, seulement vérification syntaxique statique.

## 9. Sécurité

- La clé API n'est **jamais** envoyée au client NUI/JS : elle vit uniquement dans `server/config.lua` (Lua serveur), jamais dans les fichiers `shared/` ou `html/`.
- Le process API tourne séparément du bot : même s'il plante ou est mal configuré, le bot Discord continue de fonctionner normalement.
- Les déclarations de vente tablette sont **non-autoritatives** : elles ne créent qu'une demande, jamais un mouvement financier direct.

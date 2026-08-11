# 🍩 Lawrence Beignets — Architecture technique

Document de conception avant implémentation. Couvre l'architecture, le schéma Firestore, les services, les permissions, les incohérences identifiées (et leur résolution) et l'ordre de développement.

---

## 1. Stack

- Node.js 20+, Discord.js v14 (slash commands, boutons, select menus, modals, context menus)
- Firebase Admin SDK + Cloud Firestore (seule base de données)
- dotenv pour la config sensible
- Aucune dépendance IA / analyse d'image (vérification humaine uniquement)

## 2. Structure du code

```
src/
├── commands/
│   ├── admin/          setup, admin, maintenance, backup, status, points-regle, point
│   ├── employee/       profil, promotion, retrogradation, sanction, sanctions, absence, note
│   ├── finance/        valider-vente, salaire, payer
│   ├── recruitment/    recrutement (ouvrir/fermer/statut), reglement
│   ├── tickets/        (gestion via boutons, pas de slash dédiée)
│   ├── points/         points, classement
│   └── utility/        dashboard, annonce, organigramme
│
├── events/              ready, interactionCreate, guildMemberRemove, error
│
├── interactions/
│   ├── buttons/         accueil.*, recrutement.candidater, ticket.*, vente.confirm, paiement.confirm
│   ├── modals/           candidature, contact.*, absence, annonce, note
│   └── selects/          contact.categorie, admin.section
│
├── services/
│   ├── PayrollService.js
│   ├── PointService.js
│   ├── PermissionService.js
│   ├── TicketService.js
│   ├── EmployeeService.js
│   ├── RecruitmentService.js
│   ├── SanctionService.js
│   ├── AbsenceService.js
│   ├── AnnouncementService.js
│   ├── BadgeService.js
│   ├── LogService.js
│   └── ConfigService.js   (cache + lecture/écriture config Firestore)
│
├── database/
│   ├── firebase.js
│   └── repositories/     employeeRepo, saleRepo, paymentRepo, pointRepo, ticketRepo,
│                          applicationRepo, sanctionRepo, absenceRepo, badgeRepo, logRepo, configRepo
│
├── utils/                embeds.js, ids.js (transaction IDs LD-xxxxx), format.js (montants, dates),
│                          pagination.js, errors.js
├── config/               constants.js (types/enums non-sensibles : statuts, catégories tickets, types sanctions)
├── jobs/                 weeklyReport.js, employeeOfMonth.js (cron via node-cron)
└── index.js              bootstrap uniquement : login, chargement commandes/events
```

Aucun ID Discord ni tarif n'est écrit en dur : tout passe par `config` (Firestore) chargé et mis en cache par `ConfigService`.

## 3. Schéma Firestore

**employees/{discordId}**
`discordId, username, rpName, prenomRp, nomRp, idRp, grade, joinedAt, active, totalBeignets, totalEarned, totalPaid, balance, points, badges[], payChannelId, lastSaleAt`

**sales/{saleId}** (id lisible `LD-00001` généré via compteur atomique)
`saleId, employeeId, quantity, grade, rate, amount, validatedBy, validatedAt, status(PENDING|VALIDATED|CANCELLED), evidenceChannelId, evidenceBeforeMessageId, evidenceAfterMessageId, pointsAwarded, pointTransactionId`

**payments/{paymentId}**
`paymentId, employeeId, amount, paidBy, paidAt, comment, reference, balanceBefore, balanceAfter`

**points/{pointTransactionId}**
`employeeId, amount, type(SALE|MANUAL|CORRECTION), reason, sourceId(=saleId si applicable), ruleId, createdBy, createdAt`

**pointRules/{ruleId}**
`id, name, description, type(SALE_THRESHOLD|MANUAL), threshold, points, enabled, order`
> Modèle retenu : **par palier, par vente**. Pour chaque vente validée, on prend le palier le plus élevé dont `threshold <= quantity`, on attribue ses `points` une seule fois (lié à `saleId`, jamais recalculé deux fois grâce à `sale.pointTransactionId`).

**tickets/{ticketId}**
`ticketId, channelId, userId, category(QUESTION|FARM|SIGNALEMENT|MANAGEMENT|AUTRE), status(OPEN|CLAIMED|CLOSED), assignedTo, priority, createdAt, closedAt, closedBy, closeReason, transcriptUrl`

**applications/{applicationId}**
`applicationId, userId, prenomRp, nomRp, idRp, ageRp, experience, disponibilites, motivation, pourquoi, tempsDeJeu, status(PENDING|ACCEPTED|REFUSED|WAITING), reviewedBy, reviewedAt, createdAt`

**sanctions/{sanctionId}**
`sanctionId, employeeId, issuedBy, type(WARNING|LAST_WARNING|DISCIPLINARY|SUSPENSION|EXCLUSION), reason, date, expiresAt, note, evidenceUrl`

**absences/{absenceId}**
`absenceId, employeeId, startDate, endDate, reason, comment, status(PENDING|ACCEPTED|REFUSED), reviewedBy, reviewedAt`

**badges/{badgeId}** (catalogue) + `employees.badges[]` (badges obtenus, avec date)
`badgeId, name, emoji, description, criteria`

**logs/{logId}**
`action, targetUserId, actorId, date, details, transactionId`

**pointsOfInterest/{poiId}**
`name, type(FARM|VENTE), location, description, order, active`

**config/** (documents singleton par domaine, pas une collection de règles métier)
- `config/roles` → `{ patron, coPatron, manager, pro, novice, pine, gouvernement, visiteur }` (IDs de rôles)
- `config/channels` → IDs de tous les salons référencés (accueil, reglement, recrutement, localisation, contact, annonces, organigramme, points, staffTickets, logs)
- `config/rates` → `{ NOVICE: 12, PRO: 17.5, MANAGER: 23, PATRON: 32, CO_PATRON: 32 }`
- `config/permissions` → toggles fins (ex: `managerCanPay: true/false`, `managerSanctionTypes: [...]`)
- `config/recruitment` → `{ open: true/false }`
- `config/announcements`, `config/reports`, `config/badges`, `config/tickets` → paramètres dédiés
- `config/counters` → compteurs atomiques (prochain `LD-xxxxx`)

## 4. Services & responsabilités clés

- **PermissionService** : `isDirection(member)` = a le rôle PATRON **ou** CO-PATRON (jamais de logique séparée). `isManager`, `canValidateSale`, `canPayEmployee` (direction toujours, manager si `config.permissions.managerCanPay`), `canPromote`, `canDemote`, `canSanction`, `canManageTickets`, `canManageConfig`.
- **PayrollService** : `calculateSaleAmount(quantity, grade)`, `recordValidatedSale(...)` (transaction Firestore), `recordPayment(...)`, `getBalance(employeeId)`, `getHistory(employeeId)`.
- **PointService** : `getApplicableRule(quantity)`, `processSale(sale)` (appelé dans la même transaction que la vente), garde-fou anti-doublon via `sale.pointTransactionId`.
- **EmployeeService / RecruitmentService / TicketService / SanctionService / AbsenceService / AnnouncementService / BadgeService / LogService / ConfigService** : CRUD + règles métier de leur domaine, tous loguent via `LogService`.

## 5. Permissions — résumé

| Action | Direction | Manager | Pro/Novice |
|---|---|---|---|
| /valider-vente | ✅ | ✅ | ❌ |
| /payer | ✅ | selon `config.permissions.managerCanPay` | ❌ |
| Promotion/rétrogradation direction | ✅ | ❌ (ne peut jamais toucher à la direction) | ❌ |
| /admin, /backup, /maintenance | ✅ | ❌ | ❌ |
| Voir son salon de paie | ✅ (tous) | ✅ (tous) | ✅ (le sien) |

PATRON et CO-PATRON partagent systématiquement `isDirection()` — aucune branche de code ne les distingue.

## 6. Incohérences identifiées & résolutions retenues

1. **Noms de salons tickets** : Discord n'autorise pas les emojis/majuscules fiablement dans les noms de salons → **préfixe texte + ID** (`question-<id>`, `farm-<id>`, `signalement-<id>`, `management-<id>`, `autre-<id>`), l'emoji reste dans l'embed et le topic. *(confirmé)*
2. **Barème de points** : palier déclenché **par vente individuelle**, pas cumulatif. *(confirmé)*
3. **`/payer` accessible aux managers** : dépend d'un toggle de config (`managerCanPay`), désactivé par défaut, modifiable via `/admin`.
4. **Tarif appliqué à une vente** : figé au moment de la validation (`sale.rate`), un changement de grade ultérieur ne modifie jamais les ventes passées.
5. **`/setup` idempotent** : chaque salon/rôle créé est immédiatement écrit dans `config/channels` ou `config/roles` ; toute relance vérifie d'abord l'existence en config **et** sur le serveur avant de créer.

## 7. Ordre de développement (par lots)

**Lot 1 — Fondations** : firebase.js, repositories, ConfigService, PermissionService, LogService, `/setup`, panel accueil, salon informations, règlement.
**Lot 2 — Recrutement + Contact + Tickets** : candidature (modal), validation staff, création employé + salon de paie, panel contact, catégories, tickets, transcript.
**Lot 3 — Paie + Ventes + Points** : preuves avant/après, `/valider-vente`, confirmation + anti-double-validation, `/salaire`, `/payer`, PointService, `/points-regle`, `/classement`.
**Lot 4 — P1** : `/dashboard`, `/profil`, organigramme, `/sanction`, `/absence`, `/promotion`, badges, employé du mois, `/annonce`, rapport hebdomadaire, `/admin`, `/backup`, `/maintenance`, `/status`, context menus.
**Lot 5 — P2** : bonus (liste proposée après le cœur du système, section 72).

Chaque lot sera testé (permissions, transactions financières, idempotence) avant de passer au suivant.

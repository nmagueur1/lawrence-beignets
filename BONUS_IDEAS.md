# 🍩 Lawrence Doughnuts — Idées bonus (P2)

Le cœur du système (P0 + P1) est terminé, testé et livré. Voici des idées bonus, aucune n'est développée pour l'instant — dis-moi lesquelles t'intéressent et je les construis sur le même modèle que le reste (services + Firestore + embeds premium).

1. **Objectifs hebdomadaires d'entreprise** — un objectif configurable de beignets/gains pour la semaine, barre de progression postée dans #annonces, mise à jour à chaque vente validée.
2. **Objectifs individuels** — chaque employé peut se fixer un objectif personnel (via `/objectif`), visible dans son `/profil` et sa fiche de paie.
3. **Streaks de ventes** — compteur de jours consécutifs avec au moins une vente validée, affiché dans `/profil`, avec un badge à 7/30 jours.
4. **Primes exceptionnelles** — `/prime` permettant à la Direction d'accorder un bonus ponctuel hors barème, tracé comme une transaction à part (type `BONUS`) pour ne jamais fausser l'historique des ventes.
5. **Sondages internes** — `/sondage creer` avec réactions ou boutons, résultats en direct, utile pour les décisions d'entreprise (horaires, primes, événements).
6. **Événements d'entreprise** — `/evenement` pour annoncer une session de farm groupée avec inscriptions (bouton "Je participe"), rappel automatique 1h avant.
7. **Bilan mensuel complet** — extension du rapport hebdomadaire : comparatif mois précédent, graphique en texte (barres ASCII) de l'évolution des ventes.
8. **Classement mensuel dédié** — `/classement mensuel` basé sur `StatsService.getMonthlyStats`, remis à zéro chaque mois (complète le classement carrière existant).
9. **Détection d'inactivité** — job quotidien qui repère les employés sans vente depuis X jours (configurable) et alerte discrètement le management dans le salon logs.
10. **Système de mérite / ancienneté** — badge automatique tous les N mois de présence (calculé depuis `employee.joinedAt`), affiché dans `/profil`.
11. **Récompenses échangeables** — les points cumulés deviennent une monnaie d'échange (`/recompense echanger`) contre des avantages RP définis par la Direction, avec traçabilité Firestore.
12. **Historique des changements de grade** — actuellement loggé, mais pourrait avoir sa propre commande `/historique-grade @utilisateur` pour un affichage dédié.
13. **Alertes de solde élevé** — notification automatique au management quand le `reste à payer` d'un employé dépasse un seuil configurable, pour éviter les oublis de paiement.
14. **Export comptable** — `/export` génère un CSV des ventes/paiements sur une période, envoyé en pièce jointe (utile pour un suivi externe en tableur).
15. **Vérification de cohérence Firestore** — `/admin verifier` recalcule les totaux d'un employé à partir de ses ventes/paiements et signale les écarts (garde-fou supplémentaire pour la fiabilité financière déjà exigée en section 76).
16. **Messages de bienvenue personnalisés** — au-delà du DM d'acceptation, un message stylé dans un futur salon `#nouveaux-employés` présentant le nouvel arrivant à l'équipe.
17. **Rappel automatique des tickets ouverts** — un ticket non pris en charge depuis X heures relance automatiquement les Managers.

Aucun de ces éléments n'est nécessaire au fonctionnement du système ; ce sont des compléments. Dis-moi lesquels tu veux et dans quel ordre.

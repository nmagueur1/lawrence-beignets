'use strict';

const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { baseEmbed } = require('../utils/embeds');
const { BRAND } = require('../config/constants');

const CATEGORIES = [
  {
    key: 'general',
    emoji: '🏠',
    label: 'Général',
    commands: [
      { name: '/help', access: 'Tous', desc: "Afficher ce menu d'aide" },
      { name: '/status', access: 'Tous', desc: 'État du bot (ping, Firebase, uptime)' },
      { name: '/profil [employe]', access: 'Soi-même / Manager+', desc: "Profil complet d'un employé" },
      { name: '/classement points|ventes|gains', access: 'Tous', desc: "Classements de l'entreprise" },
    ],
  },
  {
    key: 'vente',
    emoji: '🍩',
    label: 'Ventes & Paie',
    commands: [
      { name: '/valider-vente', access: 'Manager+', desc: 'Valider une vente et calculer la prime' },
      { name: '/salaire voir|historique', access: 'Soi-même / Manager+', desc: 'Situation de paie et historique' },
      { name: '/payer', access: 'Direction (Manager selon config)', desc: 'Payer un employé' },
    ],
  },
  {
    key: 'points',
    emoji: '🏆',
    label: 'Points',
    commands: [
      { name: '/points voir|historique', access: 'Soi-même / Manager+', desc: 'Consulter les points' },
      { name: '/points-regle ajouter|modifier|supprimer|liste', access: 'Direction', desc: 'Gérer le barème de points' },
    ],
  },
  {
    key: 'rh',
    emoji: '👥',
    label: 'Ressources humaines',
    commands: [
      { name: '/sanction', access: 'Manager+', desc: 'Émettre une sanction' },
      { name: '/sanctions', access: 'Soi-même / Manager+', desc: 'Historique des sanctions' },
      { name: '/absence demander|historique', access: 'Tous / Manager+', desc: "Demandes d'absence" },
      { name: '/promotion', access: 'Direction', desc: 'Promouvoir un employé' },
      { name: '/retrogradation', access: 'Direction', desc: 'Rétrograder un employé' },
      { name: '/note ajouter|liste', access: 'Manager+', desc: 'Notes internes staff' },
    ],
  },
  {
    key: 'recrutement',
    emoji: '📋',
    label: 'Recrutement',
    commands: [
      { name: '/recrutement ouvrir|fermer|statut', access: 'Direction / Tous', desc: 'Gérer le statut du recrutement' },
      { name: '/reglement voir|modifier', access: 'Tous / Direction', desc: 'Consulter / modifier le règlement' },
    ],
  },
  {
    key: 'direction',
    emoji: '🏢',
    label: 'Direction & Admin',
    commands: [
      { name: '/setup', access: 'Direction', desc: 'Configurer/synchroniser le serveur (idempotent)' },
      { name: '/dashboard', access: 'Manager+', desc: 'Tableau de bord interactif' },
      { name: '/organigramme', access: 'Manager+', desc: "Actualiser l'organigramme" },
      { name: '/annonce', access: 'Manager+', desc: 'Publier une annonce dans #annonces' },
      { name: '/admin config voir|tarif|paiement-manager', access: 'Direction', desc: 'Configuration (tarifs, permissions)' },
      { name: '/backup create|list|restore', access: 'Direction', desc: 'Sauvegardes Firestore' },
      { name: '/maintenance on|off', access: 'Direction', desc: 'Mode maintenance' },
    ],
  },
];

function buildSelectRow(selectedKey) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('help:categorie')
    .setPlaceholder('Choisis une catégorie...')
    .addOptions(
      CATEGORIES.map((c) => ({
        label: c.label,
        value: c.key,
        emoji: c.emoji,
        default: c.key === selectedKey,
      }))
    );
  return new ActionRowBuilder().addComponents(select);
}

function buildOverviewEmbed() {
  return baseEmbed()
    .setTitle(`${BRAND.EMOJI} Aide — ${BRAND.NAME}`)
    .setDescription(
      [
        "Voici les commandes disponibles, regroupées par catégorie.",
        "Utilise le menu déroulant ci-dessous pour explorer chaque catégorie.",
        '',
        ...CATEGORIES.map((c) => `${c.emoji} **${c.label}** — ${c.commands.length} commande(s)`),
      ].join('\n')
    );
}

function buildCategoryEmbed(key) {
  const category = CATEGORIES.find((c) => c.key === key);
  if (!category) return buildOverviewEmbed();

  return baseEmbed()
    .setTitle(`${category.emoji} ${category.label}`)
    .setDescription(category.commands.map((c) => `**\`${c.name}\`**\n${c.desc} — _accès : ${c.access}_`).join('\n\n'));
}

module.exports = { CATEGORIES, buildSelectRow, buildOverviewEmbed, buildCategoryEmbed };

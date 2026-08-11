'use strict';

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

/**
 * Discord limite un modal à 5 champs texte maximum : la candidature (9 questions)
 * est donc scindée en deux modals. IMPORTANT : discord.js ne permet PAS d'ouvrir un
 * modal directement depuis le submit d'un autre modal (ModalSubmitInteraction n'a
 * pas de showModal()). Le passage step1 → step2 se fait donc via un bouton
 * intermédiaire (les ButtonInteraction, elles, supportent showModal()).
 */
function buildStep1Modal() {
  const modal = new ModalBuilder().setCustomId('candidature:step1').setTitle('Candidature — Étape 1/2');
  const fields = [
    ['prenomRp', 'Prénom RP', TextInputStyle.Short],
    ['nomRp', 'Nom RP', TextInputStyle.Short],
    ['idRp', 'ID RP', TextInputStyle.Short],
    ['ageRp', 'Âge RP', TextInputStyle.Short],
    ['experience', 'Expérience', TextInputStyle.Paragraph],
  ];
  for (const [id, label, style] of fields) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style).setRequired(true).setMaxLength(style === TextInputStyle.Paragraph ? 1000 : 100)
      )
    );
  }
  return modal;
}

function buildStep2Modal() {
  const modal = new ModalBuilder().setCustomId('candidature:step2').setTitle('Candidature — Étape 2/2');
  const fields = [
    ['disponibilites', 'Disponibilités', TextInputStyle.Short],
    ['motivation', 'Motivation', TextInputStyle.Paragraph],
    ['pourquoi', 'Pourquoi Lawrence Beignets ?', TextInputStyle.Paragraph],
    ['tempsDeJeu', 'Temps de jeu approximatif', TextInputStyle.Short],
  ];
  for (const [id, label, style] of fields) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style).setRequired(true).setMaxLength(style === TextInputStyle.Paragraph ? 1000 : 100)
      )
    );
  }
  return modal;
}

module.exports = { buildStep1Modal, buildStep2Modal };

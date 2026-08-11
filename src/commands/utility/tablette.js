'use strict';

const { SlashCommandBuilder } = require('discord.js');
const EmployeeService = require('../../services/EmployeeService');
const tabletLinkRepo = require('../../database/repositories/tabletLinkRepo');
const { baseEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans caractères ambigus (0/O, 1/I/l)
const CODE_LENGTH = 6;

function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tablette')
    .setDescription('Lier ta tablette in-game à ton compte Lawrence Beignets')
    .addSubcommand((s) => s.setName('lier').setDescription('Générer un code de liaison pour la tablette en jeu')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'lier') return;

    // deferReply() acquitte l'interaction en quelques millisecondes, avant même
    // d'interroger Firestore : ça élimine tout risque de dépasser la fenêtre de
    // 3 secondes de Discord (cause probable d'un "L'application ne répond
    // plus" si Firestore met plus de temps à répondre, ex: juste après un
    // redémarrage du process). On a ensuite jusqu'à 15 minutes pour editReply.
    console.log(`[tablette] lier: interaction reçue de ${interaction.user.id}`);
    await interaction.deferReply({ ephemeral: true });
    console.log('[tablette] lier: deferReply OK');

    try {
      const registered = await EmployeeService.isEmployeeRegistered(interaction.user.id);
      console.log(`[tablette] lier: isEmployeeRegistered = ${registered}`);

      if (!registered) {
        throw new AppError('tablette lier: employé non enregistré', {
          userMessage: "❌ Tu dois être un employé enregistré de Lawrence Beignets pour lier une tablette.",
        });
      }

      const code = generateCode();
      await tabletLinkRepo.create(code, interaction.user.id);
      console.log(`[tablette] lier: code créé (${code})`);

      const embed = baseEmbed()
        .setTitle('📱 Liaison tablette')
        .setDescription(
          [
            `Ton code de liaison : \`${code}\``,
            '',
            'En jeu, ouvre ta tablette et entre ce code dans l\'écran de liaison.',
            '⏱️ Valable **5 minutes**. Il ne peut être utilisé qu\'une seule fois.',
            '🔒 Ne partage jamais ce code : il donne accès à ton profil, ta paie et tes points.',
          ].join('\n')
        );

      await interaction.editReply({ embeds: [embed] });
      console.log('[tablette] lier: réponse envoyée');
    } catch (err) {
      console.error('[tablette] lier: ERREUR', err);
      throw err;
    }
  },
};

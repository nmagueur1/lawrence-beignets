'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const AbsenceService = require('../../services/AbsenceService');
const ConfigService = require('../../services/ConfigService');
const { baseEmbed, successEmbed } = require('../../utils/embeds');

module.exports = {
  customId: 'absence:demander',

  async execute(interaction) {
    const startDate = interaction.fields.getTextInputValue('startDate');
    const endDate = interaction.fields.getTextInputValue('endDate');
    const reason = interaction.fields.getTextInputValue('reason');
    const comment = interaction.fields.getTextInputValue('comment');

    const absence = await AbsenceService.requestAbsence({ employeeId: interaction.user.id, startDate, endDate, reason, comment });

    const channels = await ConfigService.getChannels();
    const staffChannel = channels.staffTickets ? await interaction.client.channels.fetch(channels.staffTickets).catch(() => null) : null;

    if (staffChannel) {
      const embed = baseEmbed()
        .setTitle('📅 Nouvelle demande d\'absence')
        .addFields(
          { name: 'Employé', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Début', value: startDate, inline: true },
          { name: 'Fin', value: endDate, inline: true },
          { name: 'Motif', value: reason },
          { name: 'Commentaire', value: comment || '—' }
        );
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`absence:accept:${absence.absenceId}`).setLabel('Accepter').setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`absence:refuse:${absence.absenceId}`).setLabel('Refuser').setEmoji('❌').setStyle(ButtonStyle.Danger)
      );
      await staffChannel.send({ embeds: [embed], components: [row] });
    }

    await interaction.reply({ embeds: [successEmbed('✅ Demande envoyée', 'Ta demande d\'absence a été transmise au management.')], ephemeral: true });
  },
};

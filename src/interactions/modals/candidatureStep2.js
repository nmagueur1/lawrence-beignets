'use strict';

const tempCache = require('../../utils/tempCache');
const RecruitmentService = require('../../services/RecruitmentService');
const ConfigService = require('../../services/ConfigService');
const LogService = require('../../services/LogService');
const applicationRepo = require('../../database/repositories/applicationRepo');
const { successEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'candidature:step2',

  async execute(interaction) {
    const cacheKey = `candidature:${interaction.user.id}`;
    const step1 = tempCache.get(cacheKey);
    if (!step1) {
      throw new AppError('candidature step1 manquante', {
        userMessage: '❌ Ta session de candidature a expiré. Relance `Candidater` depuis le salon recrutement.',
      });
    }
    tempCache.del(cacheKey);

    const step2 = {
      disponibilites: interaction.fields.getTextInputValue('disponibilites'),
      motivation: interaction.fields.getTextInputValue('motivation'),
      pourquoi: interaction.fields.getTextInputValue('pourquoi'),
      tempsDeJeu: interaction.fields.getTextInputValue('tempsDeJeu'),
    };

    await interaction.deferReply({ ephemeral: true });

    const application = await RecruitmentService.submitApplication(interaction.user, { ...step1, ...step2 });

    const channels = await ConfigService.getChannels();
    const staffChannel = channels.staffApplications
      ? await interaction.client.channels.fetch(channels.staffApplications).catch(() => null)
      : null;

    if (staffChannel) {
      const embed = RecruitmentService.buildApplicationEmbed(application, interaction.user);
      const buttons = RecruitmentService.buildApplicationButtons(application.applicationId);
      const sent = await staffChannel.send({ embeds: [embed], components: [buttons] });
      await applicationRepo.update(application.applicationId, { messageId: sent.id });
    }

    await LogService.log(interaction.client, {
      action: 'NOUVELLE CANDIDATURE',
      actorId: interaction.user.id,
      details: { 'ID candidature': application.applicationId },
    });

    await interaction.editReply({
      embeds: [successEmbed('✅ Candidature envoyée', "Ta candidature a bien été transmise au staff Lawrence Doughnuts. Tu recevras une réponse par message privé.")],
    });
  },
};

'use strict';

const RecruitmentService = require('../../services/RecruitmentService');
const { buildStep1Modal } = require('../../utils/candidatureModals');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'recrutement',

  async execute(interaction) {
    if (interaction.customId !== 'recrutement:candidater') return;

    const open = await RecruitmentService.getStatus();
    if (!open) {
      throw new AppError('recrutement fermé', { userMessage: '🔴 Le recrutement est actuellement fermé.' });
    }

    await interaction.showModal(buildStep1Modal());
  },
};

'use strict';

const applicationRepo = require('../../database/repositories/applicationRepo');
const RecruitmentService = require('../../services/RecruitmentService');
const PermissionService = require('../../services/PermissionService');
const tempCache = require('../../utils/tempCache');
const { buildStep2Modal } = require('../../utils/candidatureModals');
const { successEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'candidature',

  async execute(interaction) {
    const [, action, applicationId] = interaction.customId.split(':');

    // Cas particulier : le candidat lui-même passe à l'étape 2/2 de sa candidature.
    // Aucun droit staff requis ici, et aucune candidature n'existe encore en base.
    if (action === 'continue') {
      const step1Data = tempCache.get(`candidature:${interaction.user.id}`);
      if (!step1Data) {
        throw new AppError('candidature: étape 1 expirée', {
          userMessage: "❌ Ta session a expiré. Relance `Candidater` depuis le salon recrutement.",
        });
      }
      await interaction.showModal(buildStep2Modal());
      return;
    }

    const isStaff = await PermissionService.isManagerOrAbove(interaction.member);
    if (!isStaff) {
      throw new AppError('candidature: accès refusé', { userMessage: '❌ Seuls les Managers et la Direction peuvent traiter les candidatures.' });
    }

    const application = await applicationRepo.get(applicationId);
    if (!application) {
      throw new AppError('candidature introuvable', { userMessage: '❌ Candidature introuvable (peut-être déjà traitée).' });
    }

    if (action === 'contact') {
      const user = await interaction.client.users.fetch(application.userId).catch(() => null);
      if (user) {
        await user
          .send({
            embeds: [
              successEmbed(
                '🍩 Lawrence Doughnuts',
                'Le staff souhaite échanger avec toi au sujet de ta candidature. Un membre du management va te contacter prochainement.'
              ),
            ],
          })
          .catch(() => null);
      }
      await interaction.reply({
        embeds: [successEmbed('💬 Candidat notifié', `<@${application.userId}> a été prévenu qu\'un membre du staff va le contacter.`)],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferUpdate();

    if (action === 'accept') {
      await RecruitmentService.acceptApplication(interaction.client, interaction.guild, application, interaction.user);
    } else if (action === 'refuse') {
      await RecruitmentService.refuseApplication(interaction.client, application, interaction.user);
    } else if (action === 'wait') {
      await RecruitmentService.waitApplication(interaction.client, application, interaction.user);
    } else {
      return;
    }

    const updated = await applicationRepo.get(applicationId);
    const embed = RecruitmentService.buildApplicationEmbed(updated, { displayAvatarURL: () => interaction.message.embeds[0]?.thumbnail?.url });
    const buttons = RecruitmentService.buildApplicationButtons(applicationId, true);
    await interaction.message.edit({ embeds: [embed], components: [buttons] });
  },
};

'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const applicationRepo = require('../database/repositories/applicationRepo');
const employeeRepo = require('../database/repositories/employeeRepo');
const ConfigService = require('./ConfigService');
const PayChannelService = require('./PayChannelService');
const LogService = require('./LogService');
const { baseEmbed, successEmbed } = require('../utils/embeds');
const { discordTimestamp } = require('../utils/format');
const { BRAND } = require('../config/constants');
const { AppError } = require('../utils/errors');

async function getStatus() {
  const cfg = await ConfigService.get('recruitment');
  return !!cfg.open;
}

async function setStatus(open) {
  await ConfigService.set('recruitment', { open });
}

function buildRecruitmentPanel(open) {
  const embed = baseEmbed()
    .setTitle(`${BRAND.EMOJI} RECRUTEMENT — ${BRAND.NAME}`)
    .setDescription(
      open
        ? '🟢 **RECRUTEMENT OUVERT**\n\nRejoins l\'équipe Lawrence Beignets ! Clique sur le bouton ci-dessous pour candidater.'
        : '🔴 **RECRUTEMENT FERMÉ**\n\nLe recrutement est actuellement fermé. Reviens plus tard !'
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('recrutement:candidater')
      .setLabel('Candidater')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!open)
  );

  return { embeds: [embed], components: [row] };
}

async function submitApplication(user, data) {
  return applicationRepo.create({ userId: user.id, ...data });
}

function buildApplicationEmbed(application, user) {
  const embed = baseEmbed()
    .setTitle('📝 NOUVELLE CANDIDATURE')
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: '👤 Discord', value: `<@${application.userId}>`, inline: true },
      { name: '🆔 ID RP', value: application.idRp || '—', inline: true },
      { name: '🎂 Âge RP', value: application.ageRp || '—', inline: true },
      { name: '📛 Nom RP', value: `${application.prenomRp || ''} ${application.nomRp || ''}`.trim() || '—' },
      { name: '💼 Expérience', value: application.experience?.slice(0, 1024) || '—' },
      { name: '🕐 Disponibilités', value: application.disponibilites?.slice(0, 1024) || '—' },
      { name: '🎯 Motivation', value: application.motivation?.slice(0, 1024) || '—' },
      { name: '🍩 Pourquoi Lawrence Beignets ?', value: application.pourquoi?.slice(0, 1024) || '—' },
      { name: '⏱️ Temps de jeu approx.', value: application.tempsDeJeu || '—' },
      { name: '📌 Statut', value: statusLabel(application.status) }
    );
  return embed;
}

function statusLabel(status) {
  return { PENDING: '🕐 En attente', ACCEPTED: '✅ Acceptée', REFUSED: '❌ Refusée', WAITING: '🕐 Mise en attente' }[status] || status;
}

function buildApplicationButtons(applicationId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`candidature:accept:${applicationId}`).setLabel('Accepter').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`candidature:refuse:${applicationId}`).setLabel('Refuser').setEmoji('❌').setStyle(ButtonStyle.Danger).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`candidature:wait:${applicationId}`).setLabel('Mettre en attente').setEmoji('🕐').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`candidature:contact:${applicationId}`).setLabel('Contacter').setEmoji('💬').setStyle(ButtonStyle.Primary)
  );
}

async function acceptApplication(client, guild, application, reviewer) {
  if (application.status === 'ACCEPTED') {
    throw new AppError('candidature déjà acceptée', { userMessage: '⚠️ Cette candidature a déjà été acceptée.' });
  }

  const member = await guild.members.fetch(application.userId).catch(() => null);
  if (!member) {
    throw new AppError('membre introuvable', { userMessage: "❌ Ce candidat n'est plus sur le serveur." });
  }

  const roles = await ConfigService.getRoles();
  if (roles.novice) await member.roles.add(roles.novice).catch(() => null);

  const employee = await employeeRepo.create(application.userId, {
    username: member.user.username,
    rpName: `${application.prenomRp || ''} ${application.nomRp || ''}`.trim(),
    prenomRp: application.prenomRp,
    nomRp: application.nomRp,
    idRp: application.idRp,
    grade: 'NOVICE',
  });

  await PayChannelService.ensurePayChannel(guild, member, employee);

  await applicationRepo.update(application.applicationId, {
    status: 'ACCEPTED',
    reviewedBy: reviewer.id,
    reviewedAt: new Date().toISOString(),
  });

  await member
    .send({
      embeds: [
        successEmbed(
          '🍩 Bienvenue chez Lawrence Beignets !',
          `Ta candidature a été **acceptée** par <@${reviewer.id}>.\n\nTu es maintenant **NOVICE**. Ton salon de paie personnel a été créé sur le serveur.`
        ),
      ],
    })
    .catch(() => null);

  await LogService.log(client, {
    action: 'CANDIDATURE ACCEPTÉE',
    actorId: reviewer.id,
    targetUserId: application.userId,
    details: { 'ID candidature': application.applicationId },
  });

  return employee;
}

async function refuseApplication(client, application, reviewer) {
  await applicationRepo.update(application.applicationId, {
    status: 'REFUSED',
    reviewedBy: reviewer.id,
    reviewedAt: new Date().toISOString(),
  });

  const user = await client.users.fetch(application.userId).catch(() => null);
  if (user) {
    await user
      .send({ embeds: [baseEmbed().setTitle('🍩 Lawrence Beignets').setDescription('Ta candidature n\'a malheureusement pas été retenue.')] })
      .catch(() => null);
  }

  await LogService.log(client, {
    action: 'CANDIDATURE REFUSÉE',
    actorId: reviewer.id,
    targetUserId: application.userId,
    details: { 'ID candidature': application.applicationId },
  });
}

async function waitApplication(client, application, reviewer) {
  await applicationRepo.update(application.applicationId, {
    status: 'WAITING',
    reviewedBy: reviewer.id,
    reviewedAt: new Date().toISOString(),
  });

  await LogService.log(client, {
    action: 'CANDIDATURE EN ATTENTE',
    actorId: reviewer.id,
    targetUserId: application.userId,
    details: { 'ID candidature': application.applicationId },
  });
}

module.exports = {
  getStatus,
  setStatus,
  buildRecruitmentPanel,
  submitApplication,
  buildApplicationEmbed,
  buildApplicationButtons,
  statusLabel,
  acceptApplication,
  refuseApplication,
  waitApplication,
};

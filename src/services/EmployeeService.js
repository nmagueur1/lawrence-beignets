'use strict';

const employeeRepo = require('../database/repositories/employeeRepo');
const ConfigService = require('./ConfigService');
const LogService = require('./LogService');
const PayChannelService = require('./PayChannelService');
const { successEmbed } = require('../utils/embeds');
const { GRADE_LABELS } = require('../config/constants');

async function getEmployee(discordId) {
  return employeeRepo.get(discordId);
}

async function isEmployeeRegistered(discordId) {
  return employeeRepo.exists(discordId);
}

async function registerEmployee(discordId, data) {
  return employeeRepo.create(discordId, data);
}

async function updateEmployee(discordId, data) {
  return employeeRepo.update(discordId, data);
}

const GRADE_ROLE_KEY = {
  NOVICE: 'novice',
  PRO: 'pro',
  MANAGER: 'manager',
  PATRON: 'patron',
  CO_PATRON: 'coPatron',
};

/**
 * Change le grade d'un employé : met à jour le rôle Discord (retire l'ancien,
 * ajoute le nouveau) et le champ `grade` Firestore. Utilisé par /promotion et
 * /retrogradation, qui sont tous deux réservés à la Direction.
 */
async function changeGrade(client, member, newGrade, actorId) {
  const employee = await employeeRepo.get(member.id);
  if (!employee) return null;

  const roles = await ConfigService.getRoles();
  const oldRoleId = roles[GRADE_ROLE_KEY[employee.grade]];
  const newRoleId = roles[GRADE_ROLE_KEY[newGrade]];

  if (oldRoleId && member.roles.cache.has(oldRoleId)) await member.roles.remove(oldRoleId).catch(() => null);
  if (newRoleId) await member.roles.add(newRoleId).catch(() => null);

  await employeeRepo.update(member.id, { grade: newGrade });

  await LogService.log(client, {
    action: 'CHANGEMENT DE GRADE',
    actorId,
    targetUserId: member.id,
    details: { 'Ancien grade': GRADE_LABELS[employee.grade] || employee.grade, 'Nouveau grade': GRADE_LABELS[newGrade] || newGrade },
  });

  return { ...employee, grade: newGrade };
}

/**
 * Enregistre manuellement un employé déjà présent sur le serveur, sans passer
 * par le formulaire de candidature (ex : équipe déjà en place avant l'installation
 * du bot). Attribue le rôle du grade choisi, crée la fiche Firestore et le salon
 * de paie, comme le fait l'acceptation d'une candidature.
 */
async function manualRegisterEmployee(client, guild, member, { grade, prenomRp, nomRp, idRp }, actorId) {
  const roles = await ConfigService.getRoles();
  const roleId = roles[GRADE_ROLE_KEY[grade]];
  if (roleId) await member.roles.add(roleId).catch(() => null);

  const employee = await employeeRepo.create(member.id, {
    username: member.user.username,
    rpName: `${prenomRp || ''} ${nomRp || ''}`.trim(),
    prenomRp: prenomRp || null,
    nomRp: nomRp || null,
    idRp: idRp || null,
    grade,
  });

  await PayChannelService.ensurePayChannel(guild, member, employee);

  await LogService.log(client, {
    action: 'EMPLOYÉ ENREGISTRÉ MANUELLEMENT',
    actorId,
    targetUserId: member.id,
    details: { Grade: GRADE_LABELS[grade] || grade },
  });

  await member
    .send({
      embeds: [
        successEmbed(
          '🍩 Bienvenue chez Lawrence Beignets !',
          `Tu as été enregistré comme employé par <@${actorId}>.\n\nTon grade : **${GRADE_LABELS[grade] || grade}**. Ton salon de paie personnel a été créé sur le serveur.`
        ),
      ],
    })
    .catch(() => null);

  return employee;
}

module.exports = {
  getEmployee,
  isEmployeeRegistered,
  registerEmployee,
  updateEmployee,
  changeGrade,
  manualRegisterEmployee,
  GRADE_ROLE_KEY,
};

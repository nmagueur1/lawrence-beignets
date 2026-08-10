'use strict';

const ConfigService = require('./ConfigService');

function hasRole(member, roleId) {
  if (!roleId || !member) return false;
  return member.roles.cache.has(roleId);
}

/**
 * PATRON et CO-PATRON constituent la Direction et doivent TOUJOURS avoir
 * exactement les mêmes permissions. Toute logique administrative doit passer
 * par isDirection() plutôt que de tester les rôles individuellement.
 */
async function isDirection(member) {
  const roles = await ConfigService.getRoles();
  return hasRole(member, roles.patron) || hasRole(member, roles.coPatron);
}

async function isManager(member) {
  const roles = await ConfigService.getRoles();
  return hasRole(member, roles.manager);
}

async function isManagerOrAbove(member) {
  return (await isDirection(member)) || (await isManager(member));
}

async function isEmployee(member) {
  const roles = await ConfigService.getRoles();
  return (
    hasRole(member, roles.patron) ||
    hasRole(member, roles.coPatron) ||
    hasRole(member, roles.manager) ||
    hasRole(member, roles.pro) ||
    hasRole(member, roles.novice)
  );
}

async function canValidateSale(member) {
  return isManagerOrAbove(member);
}

async function canPayEmployee(member) {
  if (await isDirection(member)) return true;
  const perms = await ConfigService.getPermissions();
  if (perms.managerCanPay && (await isManager(member))) return true;
  return false;
}

async function canPromote(member) {
  return isDirection(member);
}

async function canDemote(member) {
  return isDirection(member);
}

async function canSanction(member, sanctionType) {
  if (await isDirection(member)) return true;
  if (await isManager(member)) {
    const perms = await ConfigService.getPermissions();
    return (perms.managerSanctionTypes || []).includes(sanctionType);
  }
  return false;
}

async function canManageTickets(member) {
  return isManagerOrAbove(member);
}

async function canManagePoints(member) {
  return isDirection(member);
}

async function canManageConfig(member) {
  return isDirection(member);
}

/**
 * Un manager ne peut jamais agir (promouvoir, rétrograder, sanctionner...) sur
 * un membre de la Direction. Seule la Direction peut agir sur la Direction.
 */
async function canActOn(actorMember, targetMember) {
  if (await isDirection(actorMember)) return true;
  if (await isDirection(targetMember)) return false;
  return isManagerOrAbove(actorMember);
}

module.exports = {
  isDirection,
  isManager,
  isManagerOrAbove,
  isEmployee,
  canValidateSale,
  canPayEmployee,
  canPromote,
  canDemote,
  canSanction,
  canManageTickets,
  canManagePoints,
  canManageConfig,
  canActOn,
};

'use strict';

const counterRepo = require('../database/repositories/counterRepo');

/**
 * Génère un identifiant lisible et unique pour une vente : LD-00001, LD-00002, ...
 */
async function generateSaleId() {
  const value = await counterRepo.nextValue('saleCounter');
  return `LD-${String(value).padStart(5, '0')}`;
}

module.exports = { generateSaleId };

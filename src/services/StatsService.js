'use strict';

const { db } = require('../database/firebase');

/**
 * Agrège ventes + points validés sur une plage de dates (bornes incluses), par
 * employé. Utilisé par le rapport hebdomadaire et le calcul de l'employé du mois.
 */
async function getSalesInRange(startDate, endDate) {
  const snap = await db
    .collection('sales')
    .where('status', '==', 'VALIDATED')
    .where('validatedAt', '>=', startDate)
    .where('validatedAt', '<=', endDate)
    .get();
  return snap.docs.map((d) => d.data());
}

async function getPointsInRange(startDate, endDate) {
  const snap = await db.collection('points').where('createdAt', '>=', startDate).where('createdAt', '<=', endDate).get();
  return snap.docs.map((d) => d.data());
}

function aggregateByEmployee(sales, points) {
  const byEmployee = new Map();

  for (const sale of sales) {
    const entry = byEmployee.get(sale.employeeId) || { employeeId: sale.employeeId, beignets: 0, earned: 0, points: 0, salesCount: 0 };
    entry.beignets += sale.quantity;
    entry.earned += sale.amount;
    entry.salesCount += 1;
    byEmployee.set(sale.employeeId, entry);
  }

  for (const point of points) {
    const entry = byEmployee.get(point.employeeId) || { employeeId: point.employeeId, beignets: 0, earned: 0, points: 0, salesCount: 0 };
    entry.points += point.amount;
    byEmployee.set(point.employeeId, entry);
  }

  return [...byEmployee.values()];
}

async function getWeeklyStats() {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [sales, points] = await Promise.all([getSalesInRange(start, end), getPointsInRange(start, end)]);
  return { start, end, sales, points, byEmployee: aggregateByEmployee(sales, points) };
}

async function getMonthlyStats(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59);
  const [sales, points] = await Promise.all([getSalesInRange(start, end), getPointsInRange(start, end)]);
  return { start, end, sales, points, byEmployee: aggregateByEmployee(sales, points) };
}

module.exports = { getSalesInRange, getPointsInRange, getWeeklyStats, getMonthlyStats };

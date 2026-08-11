'use strict';

const { listActiveEmployees } = require('./_lib/data');
const { GRADE_LABELS, GRADE_ORDER } = require('./_lib/constants');

module.exports = async (req, res) => {
  try {
    const employees = await listActiveEmployees();
    const byGrade = [...GRADE_ORDER].reverse().map((grade) => ({
      grade,
      gradeLabel: GRADE_LABELS[grade] || grade,
      members: employees.filter((e) => e.grade === grade).map((e) => e.rpName || e.username || 'Employé'),
    }));
    res.json({ byGrade });
  } catch (err) {
    console.error('[lawrence-web][organigramme]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

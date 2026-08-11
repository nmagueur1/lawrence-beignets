'use strict';

const express = require('express');
const employeeRepo = require('../../database/repositories/employeeRepo');
const { GRADE_LABELS, GRADE_ORDER } = require('../../config/constants');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const employees = await employeeRepo.listAllActive();
    const byGrade = [...GRADE_ORDER].reverse().map((grade) => ({
      grade,
      gradeLabel: GRADE_LABELS[grade] || grade,
      members: employees.filter((e) => e.grade === grade).map((e) => e.rpName || e.username || 'Employé'),
    }));
    res.json({ byGrade });
  } catch (err) {
    console.error('[tablet-api][organigramme]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;

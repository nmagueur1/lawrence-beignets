'use strict';

const noteRepo = require('../database/repositories/noteRepo');
const { discordTimestamp } = require('../utils/format');
const { NOTE_LABELS } = require('../config/constants');

async function addNote({ employeeId, authorId, type, content }) {
  return noteRepo.create({ employeeId, authorId, type, content });
}

async function getNotes(employeeId) {
  return noteRepo.listByEmployee(employeeId);
}

function buildNoteLine(note) {
  const date = discordTimestamp(note.createdAt?.toDate ? note.createdAt.toDate() : note.createdAt, 'd');
  return `${NOTE_LABELS[note.type] || note.type} — ${note.content} · par <@${note.authorId}> · ${date}`;
}

module.exports = { addNote, getNotes, buildNoteLine };

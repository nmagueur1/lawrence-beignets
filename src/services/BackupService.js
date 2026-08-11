'use strict';

const { db } = require('../database/firebase');
const backupRepo = require('../database/repositories/backupRepo');
const ConfigService = require('./ConfigService');
const LogService = require('./LogService');
const { AttachmentBuilder } = require('discord.js');
const { AppError } = require('../utils/errors');

const BACKED_UP_COLLECTIONS = ['employees', 'sales', 'payments', 'points', 'pointRules', 'config'];

async function dumpCollections() {
  const dump = {};
  for (const name of BACKED_UP_COLLECTIONS) {
    const snap = await db.collection(name).get();
    dump[name] = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  }
  return dump;
}

async function createBackup(client, actorId) {
  const dump = await dumpCollections();
  const json = JSON.stringify(dump, null, 2);
  const buffer = Buffer.from(json, 'utf-8');

  const channels = await ConfigService.getChannels();
  const logChannel = channels.logs ? await client.channels.fetch(channels.logs).catch(() => null) : null;
  if (!logChannel) {
    throw new AppError('salon logs manquant', { userMessage: '❌ Le salon de logs doit être configuré (lance /setup) pour stocker les sauvegardes.' });
  }

  const filename = `backup-${Date.now()}.json`;
  const attachment = new AttachmentBuilder(buffer, { name: filename });
  const sent = await logChannel.send({ content: `💾 Sauvegarde Lawrence Beignets — ${new Date().toISOString()}`, files: [attachment] });

  const meta = await backupRepo.create({
    createdBy: actorId,
    channelId: logChannel.id,
    messageId: sent.id,
    filename,
    collections: BACKED_UP_COLLECTIONS,
    sizeBytes: buffer.byteLength,
  });

  await LogService.log(client, { action: 'SAUVEGARDE CRÉÉE', actorId, transactionId: meta.backupId });

  return meta;
}

async function listBackups() {
  return backupRepo.listRecent();
}

async function restoreBackup(client, backupId, actorId) {
  const meta = await backupRepo.get(backupId);
  if (!meta) throw new AppError('sauvegarde introuvable', { userMessage: '❌ Sauvegarde introuvable.' });

  const channel = await client.channels.fetch(meta.channelId).catch(() => null);
  if (!channel) throw new AppError('salon de la sauvegarde introuvable', { userMessage: '❌ Le salon contenant cette sauvegarde est introuvable.' });

  const message = await channel.messages.fetch(meta.messageId).catch(() => null);
  const attachment = message?.attachments.first();
  if (!attachment) throw new AppError('fichier de sauvegarde introuvable', { userMessage: '❌ Le fichier de sauvegarde est introuvable (message supprimé ?).' });

  const res = await fetch(attachment.url);
  const dump = await res.json();

  let batch = db.batch();
  let ops = 0;
  for (const [collectionName, docs] of Object.entries(dump)) {
    for (const { id, data } of docs) {
      batch.set(db.collection(collectionName).doc(id), data);
      ops++;
      if (ops >= 450) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
  }
  if (ops > 0) await batch.commit();

  ConfigService.invalidate();

  await LogService.log(client, { action: 'SAUVEGARDE RESTAURÉE', actorId, transactionId: backupId });

  return meta;
}

module.exports = { createBackup, listBackups, restoreBackup, BACKED_UP_COLLECTIONS };

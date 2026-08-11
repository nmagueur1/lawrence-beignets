'use strict';

const crypto = require('node:crypto');
const { db, FieldValue } = require('./firebase');

const COOKIE_NAME = 'lb_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function setSessionCookie(res, token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

/**
 * Crée une session après consommation d'un code de liaison (voir tabletLink.js).
 * Le token est opaque (aléatoire), jamais dérivé du discordId : impossible à
 * deviner ou à forger côté client.
 */
async function createSession(discordId) {
  const token = crypto.randomBytes(24).toString('hex');
  await db.collection('webSessions').doc(token).set({
    token,
    discordId,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

async function resolveSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const ref = db.collection('webSessions').doc(token);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const session = snap.data();
  if (session.expiresAt < Date.now()) {
    await ref.delete().catch(() => null);
    return null;
  }
  return { discordId: session.discordId, token };
}

async function destroySession(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (token) await db.collection('webSessions').doc(token).delete().catch(() => null);
}

module.exports = { COOKIE_NAME, parseCookies, setSessionCookie, clearSessionCookie, createSession, resolveSession, destroySession };

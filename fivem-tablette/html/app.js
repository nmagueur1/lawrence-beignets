(() => {
  'use strict';

  const screen = document.getElementById('screen');
  const clockEl = document.getElementById('clock');
  const inFiveM = typeof window.invokeNative === 'function';

  // --- Communication avec le client Lua (server.js réel côté serveur FiveM) ---
  function call(endpoint, method = 'GET', body = null) {
    if (!inFiveM) return mockCall(endpoint, method, body);
    const resourceName = window.GetParentResourceName ? window.GetParentResourceName() : 'lawrence-tablette';
    return fetch(`https://${resourceName}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ endpoint, method, body }),
    }).then((r) => r.json());
  }

  function closeTablet() {
    if (inFiveM) {
      const resourceName = window.GetParentResourceName ? window.GetParentResourceName() : 'lawrence-tablette';
      fetch(`https://${resourceName}/close`, { method: 'POST' });
    }
    document.body.classList.add('hidden');
  }

  window.addEventListener('message', (e) => {
    if (e.data.action === 'open') document.body.classList.remove('hidden');
    if (e.data.action === 'close') document.body.classList.add('hidden');
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') closeTablet();
  });

  document.getElementById('btn-close').addEventListener('click', closeTablet);
  document.getElementById('btn-home').addEventListener('click', () => boot());

  function tickClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  setInterval(tickClock, 15000);
  tickClock();

  // --- Rendu ---
  function toast(message, isError = false) {
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' error' : '');
    el.textContent = message;
    document.getElementById('tablet').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function money(n) { return `${Math.round(n || 0).toLocaleString('fr-FR')} $`; }
  function num(n) { return Math.round(n || 0).toLocaleString('fr-FR'); }
  function dateFr(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  const APPS = [
    { id: 'profil', emoji: '👤', label: 'Profil' },
    { id: 'salaire', emoji: '💰', label: 'Salaire' },
    { id: 'points', emoji: '🏆', label: 'Points' },
    { id: 'classement', emoji: '📊', label: 'Classement' },
    { id: 'vente', emoji: '🍩', label: 'Déclarer une vente' },
    { id: 'absence', emoji: '📅', label: 'Absence' },
    { id: 'reglement', emoji: '📜', label: 'Règlement' },
    { id: 'organigramme', emoji: '📋', label: 'Organigramme' },
  ];

  let currentProfile = null;

  async function boot() {
    screen.innerHTML = `<div class="empty">Chargement…</div>`;
    const res = await call('profile');
    if (res.status === 404 || (res.data && res.data.linked === false)) {
      renderPairing();
      return;
    }
    if (res.status && res.status >= 400) {
      renderPairing(res.data?.error);
      return;
    }
    currentProfile = res.data;
    renderHome();
  }

  function renderPairing(errorMsg) {
    screen.innerHTML = `
      <div class="pairing">
        <div class="icon">📱</div>
        <h2>Lier la tablette</h2>
        <p>Sur Discord, lance <b>/tablette lier</b> puis entre ici le code à 6 caractères (valable 5 minutes).</p>
        <input id="pairing-code" maxlength="6" placeholder="ABC123" />
        <button class="btn-primary" id="pairing-submit">Lier ma tablette</button>
        ${errorMsg ? `<p style="color:#ed6a5e">${escapeHtml(errorMsg)}</p>` : ''}
      </div>
    `;
    document.getElementById('pairing-submit').addEventListener('click', async () => {
      const code = document.getElementById('pairing-code').value.trim();
      if (!code) return;
      const res = await call('link', 'POST', { code });
      if (res.status && res.status >= 400) {
        toast(res.data?.error || 'Code invalide.', true);
        return;
      }
      toast('Tablette liée avec succès !');
      boot();
    });
  }

  function renderHome() {
    const name = currentProfile?.rpName || 'Employé';
    screen.innerHTML = `
      <div class="welcome">Bienvenue, <b>${escapeHtml(name)}</b> — ${escapeHtml(currentProfile?.gradeLabel || '')}</div>
      <div class="app-grid">
        ${APPS.map((a) => `
          <div class="app-icon" data-app="${a.id}">
            <div class="emoji">${a.emoji}</div>
            <div class="label">${a.label}</div>
          </div>
        `).join('')}
      </div>
    `;
    screen.querySelectorAll('.app-icon').forEach((el) => {
      el.addEventListener('click', () => openApp(el.dataset.app));
    });
  }

  function header(title) {
    return `
      <div class="view-header">
        <span class="back" id="btn-back">←</span>
        <h2>${title}</h2>
      </div>
    `;
  }

  function bindBack() {
    const el = document.getElementById('btn-back');
    if (el) el.addEventListener('click', renderHome);
  }

  async function openApp(id) {
    screen.innerHTML = `<div class="empty">Chargement…</div>`;
    if (id === 'profil') return renderProfil();
    if (id === 'salaire') return renderSalaire();
    if (id === 'points') return renderPoints();
    if (id === 'classement') return renderClassement('points');
    if (id === 'vente') return renderVente();
    if (id === 'absence') return renderAbsence();
    if (id === 'reglement') return renderReglement();
    if (id === 'organigramme') return renderOrganigramme();
  }

  async function renderProfil() {
    const res = await call('profile');
    const e = res.data || {};
    screen.innerHTML = `
      ${header('👤 Profil')}
      <div class="card">
        <div class="row"><span class="k">Nom RP</span><span class="v">${escapeHtml(e.rpName || '—')}</span></div>
        <div class="row"><span class="k">Grade</span><span class="v">${escapeHtml(e.gradeLabel || '—')}</span></div>
        <div class="row"><span class="k">Beignets vendus</span><span class="v">${num(e.totalBeignets)}</span></div>
        <div class="row"><span class="k">Total généré</span><span class="v">${money(e.totalEarned)}</span></div>
        <div class="row"><span class="k">Points</span><span class="v">${num(e.points)}</span></div>
        <div class="row"><span class="k">Badges</span><span class="v">${(e.badges || []).length}</span></div>
      </div>
    `;
    bindBack();
  }

  async function renderSalaire() {
    const res = await call('salaire');
    const d = res.data || {};
    screen.innerHTML = `
      ${header('💰 Salaire')}
      <div class="card">
        <div class="k" style="font-size:12px;color:#9c9187">Reste à payer</div>
        <div class="big">${money(d.balance)}</div>
      </div>
      <div class="card">
        <div class="row"><span class="k">Total généré</span><span class="v">${money(d.totalEarned)}</span></div>
        <div class="row"><span class="k">Total payé</span><span class="v">${money(d.totalPaid)}</span></div>
      </div>
      <div class="card">
        ${(d.history || []).length ? d.history.map((h) => `
          <div class="list-item">
            <div>
              <div>${h.kind === 'SALE' ? `🍩 ${h.saleId} — ${h.quantity} beignets` : '💸 Paiement'}</div>
              <div class="meta">${dateFr(h.date)}</div>
            </div>
            <div class="amount ${h.kind === 'SALE' ? 'positive' : 'negative'}">${h.kind === 'SALE' ? '+' : '-'}${money(h.amount)}</div>
          </div>
        `).join('') : '<div class="empty">Aucun mouvement.</div>'}
      </div>
    `;
    bindBack();
  }

  async function renderPoints() {
    const res = await call('points');
    const d = res.data || {};
    screen.innerHTML = `
      ${header('🏆 Points')}
      <div class="card">
        <div class="k" style="font-size:12px;color:#9c9187">Total</div>
        <div class="big">${num(d.points)}</div>
      </div>
      <div class="card">
        ${(d.history || []).length ? d.history.map((h) => `
          <div class="list-item">
            <div>
              <div>${escapeHtml(h.reason || '')}</div>
              <div class="meta">${dateFr(h.date)}</div>
            </div>
            <div class="amount ${h.amount >= 0 ? 'positive' : 'negative'}">${h.amount >= 0 ? '+' : ''}${h.amount}</div>
          </div>
        `).join('') : '<div class="empty">Aucun historique.</div>'}
      </div>
    `;
    bindBack();
  }

  async function renderClassement(type) {
    const res = await call(`classement?type=${type}`);
    const d = res.data || {};
    const medals = ['🥇', '🥈', '🥉'];
    const tabs = [
      { id: 'points', label: 'Points' },
      { id: 'ventes', label: 'Ventes' },
      { id: 'gains', label: 'Gains' },
    ];
    screen.innerHTML = `
      ${header('📊 Classement')}
      <div class="card" style="display:flex;gap:8px;">
        ${tabs.map((t) => `<span class="app-icon" style="flex:1;padding:8px" data-type="${t.id}"><span class="label">${t.label}</span></span>`).join('')}
      </div>
      <div class="card">
        ${(d.ranking || []).length ? d.ranking.map((r) => `
          <div class="rank">
            <span class="medal">${medals[r.rank - 1] || r.rank}</span>
            <span style="flex:1">${escapeHtml(r.rpName)} <span class="meta">— ${escapeHtml(r.gradeLabel || '')}</span></span>
            <span class="v">${type === 'gains' ? money(r.value) : num(r.value)}</span>
          </div>
        `).join('') : '<div class="empty">Aucune donnée.</div>'}
      </div>
    `;
    bindBack();
    screen.querySelectorAll('[data-type]').forEach((el) => {
      el.addEventListener('click', () => renderClassement(el.dataset.type));
    });
  }

  function renderVente() {
    screen.innerHTML = `
      ${header('🍩 Déclarer une vente')}
      <div class="card">
        <p class="meta" style="margin-bottom:10px">La déclaration est envoyée au staff pour validation via <b>/valider-vente</b>. Elle ne modifie pas encore ton solde.</p>
        <form class="tablet-form" id="vente-form">
          <label>Quantité de beignets vendus</label>
          <input type="number" min="1" id="vente-quantity" required />
          <button type="submit" class="btn-primary">Envoyer la déclaration</button>
        </form>
      </div>
    `;
    bindBack();
    document.getElementById('vente-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const quantity = Number(document.getElementById('vente-quantity').value);
      const res = await call('vente', 'POST', { quantity });
      if (res.status && res.status >= 400) {
        toast(res.data?.error || 'Erreur lors de la déclaration.', true);
        return;
      }
      toast(`Déclaration envoyée (${res.data.requestId}) !`);
      renderHome();
    });
  }

  function renderAbsence() {
    screen.innerHTML = `
      ${header("📅 Demande d'absence")}
      <div class="card">
        <form class="tablet-form" id="absence-form">
          <label>Date de début (JJ/MM/AAAA)</label>
          <input type="text" id="absence-start" placeholder="12/08/2026" required />
          <label>Date de fin (JJ/MM/AAAA)</label>
          <input type="text" id="absence-end" placeholder="15/08/2026" required />
          <label>Motif</label>
          <input type="text" id="absence-reason" required />
          <label>Commentaire (optionnel)</label>
          <textarea id="absence-comment"></textarea>
          <button type="submit" class="btn-primary">Envoyer la demande</button>
        </form>
      </div>
    `;
    bindBack();
    document.getElementById('absence-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        startDate: document.getElementById('absence-start').value.trim(),
        endDate: document.getElementById('absence-end').value.trim(),
        reason: document.getElementById('absence-reason').value.trim(),
        comment: document.getElementById('absence-comment').value.trim(),
      };
      const res = await call('absence', 'POST', body);
      if (res.status && res.status >= 400) {
        toast(res.data?.error || 'Erreur lors de la demande.', true);
        return;
      }
      toast('Demande envoyée !');
      renderHome();
    });
  }

  async function renderReglement() {
    const res = await call('reglement');
    const d = res.data || {};
    screen.innerHTML = `
      ${header('📜 Règlement')}
      <div class="card">
        <div class="reglement-text">${escapeHtml(d.content || 'Aucun règlement configuré.')}</div>
      </div>
    `;
    bindBack();
  }

  async function renderOrganigramme() {
    const res = await call('organigramme');
    const d = res.data || {};
    screen.innerHTML = `
      ${header('📋 Organigramme')}
      ${(d.byGrade || []).map((g) => `
        <div class="card">
          <div class="row"><span class="v">${escapeHtml(g.gradeLabel)}</span><span class="meta">${g.members.length}</span></div>
          ${g.members.length ? g.members.map((m) => `<div class="meta">• ${escapeHtml(m)}</div>`).join('') : '<div class="meta">Aucun membre</div>'}
        </div>
      `).join('')}
    `;
    bindBack();
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // --- Mode démo (hors FiveM, pour prévisualiser dans un navigateur classique) ---
  const MOCK_LINKED = true;
  function mockCall(endpoint, method) {
    const wait = (data, status = 200) => new Promise((r) => setTimeout(() => r({ status, data }), 250));
    if (endpoint === 'profile') {
      if (!MOCK_LINKED) return wait({ error: 'not linked', linked: false }, 404);
      return wait({ rpName: 'Nathan Lawrence', gradeLabel: '🧠 MANAGER', totalBeignets: 842, totalEarned: 15420, points: 340, badges: [1, 2] });
    }
    if (endpoint === 'salaire') return wait({ balance: 1280, totalEarned: 15420, totalPaid: 14140, history: [
      { kind: 'SALE', saleId: 'LD-00231', quantity: 24, amount: 456, date: new Date().toISOString() },
      { kind: 'PAYMENT', amount: 2000, date: new Date(Date.now() - 86400000 * 3).toISOString() },
    ] });
    if (endpoint === 'points') return wait({ points: 340, history: [{ amount: 20, reason: 'Vente x24', date: new Date().toISOString() }] });
    if (endpoint.startsWith('classement')) return wait({ ranking: [
      { rank: 1, rpName: 'Nathan Lawrence', gradeLabel: '🧠 MANAGER', value: 340 },
      { rank: 2, rpName: 'Julie Moreau', gradeLabel: '👥 PRO', value: 210 },
      { rank: 3, rpName: 'Marc Dubois', gradeLabel: '👤 NOVICE', value: 90 },
    ] });
    if (endpoint === 'vente') return wait({ requestId: 'SR-00042' });
    if (endpoint === 'absence') return wait({ ok: true });
    if (endpoint === 'reglement') return wait({ content: '1. Respect entre employés.\n2. Preuves obligatoires avant/après vente.\n3. Ponctualité aux plannings.' });
    if (endpoint === 'organigramme') return wait({ byGrade: [
      { grade: 'PATRON', gradeLabel: '👑 PATRON', members: ['Nathan Lawrence'] },
      { grade: 'MANAGER', gradeLabel: '🧠 MANAGER', members: ['Julie Moreau'] },
      { grade: 'PRO', gradeLabel: '👥 PRO', members: ['Marc Dubois', 'Sarah Petit'] },
      { grade: 'NOVICE', gradeLabel: '👤 NOVICE', members: [] },
    ] });
    if (endpoint === 'link') return wait({ ok: true });
    return wait({ error: 'endpoint inconnu (mode démo)' }, 404);
  }

  if (!inFiveM) {
    document.body.classList.remove('hidden');
  }

  boot();
})();

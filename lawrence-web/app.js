(() => {
  'use strict';

  const app = document.getElementById('app');
  const logoutBtn = document.getElementById('btn-logout');

  async function api(path, method = 'GET', body = null) {
    const res = await fetch(`/api/${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  function toast(message, isError = false) {
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' error' : '');
    el.textContent = message;
    document.body.appendChild(el);
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
  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
    app.innerHTML = `<div class="empty">Chargement…</div>`;
    const res = await api('profile');
    if (res.status === 401 || res.status === 403) {
      logoutBtn.classList.add('hidden');
      renderPairing(res.status === 403 ? res.data?.error : null);
      return;
    }
    if (res.status >= 400) {
      renderPairing(res.data?.error);
      return;
    }
    currentProfile = res.data;
    logoutBtn.classList.remove('hidden');
    renderHome();
  }

  function renderPairing(errorMsg) {
    app.innerHTML = `
      <div class="pairing">
        <div class="icon">🔑</div>
        <h1>Connexion</h1>
        <p>Sur Discord, lance <b>/tablette lier</b> puis entre ici le code à 6 caractères (valable 5 minutes).</p>
        <input id="pairing-code" maxlength="6" placeholder="ABC123" autocomplete="off" />
        <button class="btn-primary" id="pairing-submit">Se connecter</button>
        ${errorMsg ? `<p style="color:#ed6a5e;font-size:13px">${escapeHtml(errorMsg)}</p>` : ''}
      </div>
    `;
    const submit = async () => {
      const code = document.getElementById('pairing-code').value.trim();
      if (!code) return;
      const res = await api('link', 'POST', { code });
      if (res.status >= 400) {
        toast(res.data?.error || 'Code invalide.', true);
        return;
      }
      toast('Connecté !');
      boot();
    };
    document.getElementById('pairing-submit').addEventListener('click', submit);
    document.getElementById('pairing-code').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') submit();
    });
  }

  function renderHome() {
    const name = currentProfile?.rpName || 'Employé';
    app.innerHTML = `
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
    app.querySelectorAll('.app-icon').forEach((el) => {
      el.addEventListener('click', () => openApp(el.dataset.app));
    });
  }

  function header(title) {
    return `<div class="view-header"><span class="back" id="btn-back">← Accueil</span><h2>${title}</h2></div>`;
  }
  function bindBack() {
    const el = document.getElementById('btn-back');
    if (el) el.addEventListener('click', renderHome);
  }

  async function openApp(id) {
    app.innerHTML = `<div class="empty">Chargement…</div>`;
    const renderers = { profil: renderProfil, salaire: renderSalaire, points: renderPoints, classement: () => renderClassement('points'), vente: renderVente, absence: renderAbsence, reglement: renderReglement, organigramme: renderOrganigramme };
    const fn = renderers[id];
    if (fn) await fn();
  }

  async function renderProfil() {
    const res = await api('profile');
    const e = res.data || {};
    app.innerHTML = `
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
    const res = await api('salaire');
    const d = res.data || {};
    app.innerHTML = `
      ${header('💰 Salaire')}
      <div class="card">
        <div class="k" style="font-size:13px;color:#9c9187">Reste à payer</div>
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
              <div>${h.kind === 'SALE' ? `🍩 ${escapeHtml(h.saleId)} — ${h.quantity} beignets` : '💸 Paiement'}</div>
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
    const res = await api('points');
    const d = res.data || {};
    app.innerHTML = `
      ${header('🏆 Points')}
      <div class="card">
        <div class="k" style="font-size:13px;color:#9c9187">Total</div>
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
    const res = await api(`classement?type=${type}`);
    const d = res.data || {};
    const medals = ['🥇', '🥈', '🥉'];
    const tabs = [{ id: 'points', label: 'Points' }, { id: 'ventes', label: 'Ventes' }, { id: 'gains', label: 'Gains' }];
    app.innerHTML = `
      ${header('📊 Classement')}
      <div class="tabs">
        ${tabs.map((t) => `<button class="tab-btn ${t.id === type ? 'active' : ''}" data-type="${t.id}">${t.label}</button>`).join('')}
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
    app.querySelectorAll('[data-type]').forEach((el) => el.addEventListener('click', () => renderClassement(el.dataset.type)));
  }

  function renderVente() {
    app.innerHTML = `
      ${header('🍩 Déclarer une vente')}
      <div class="card">
        <p class="meta" style="margin-bottom:10px">La déclaration est envoyée au staff pour validation via <b>/valider-vente</b>. Elle ne modifie pas encore ton solde.</p>
        <form class="f" id="vente-form">
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
      const res = await api('vente', 'POST', { quantity });
      if (res.status >= 400) return toast(res.data?.error || 'Erreur lors de la déclaration.', true);
      toast(`Déclaration envoyée (${res.data.requestId}) !`);
      renderHome();
    });
  }

  function renderAbsence() {
    app.innerHTML = `
      ${header("📅 Demande d'absence")}
      <div class="card">
        <form class="f" id="absence-form">
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
      const res = await api('absence', 'POST', body);
      if (res.status >= 400) return toast(res.data?.error || 'Erreur lors de la demande.', true);
      toast('Demande envoyée !');
      renderHome();
    });
  }

  async function renderReglement() {
    const res = await api('reglement');
    const d = res.data || {};
    app.innerHTML = `
      ${header('📜 Règlement')}
      <div class="card"><div class="reglement-text">${escapeHtml(d.content || 'Aucun règlement configuré.')}</div></div>
    `;
    bindBack();
  }

  async function renderOrganigramme() {
    const res = await api('organigramme');
    const d = res.data || {};
    app.innerHTML = `
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

  logoutBtn.addEventListener('click', async () => {
    await api('logout', 'POST');
    currentProfile = null;
    logoutBtn.classList.add('hidden');
    boot();
  });

  boot();
})();

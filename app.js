// ── SIDEBAR TOGGLE (mobile) ──
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}
// Close sidebar on outside click (mobile)
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.querySelector('.topbar-menu-btn');
  if (sidebar && !sidebar.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// ── PREMIUM MODAL ──
function showPremiumModal() {
  const modal = document.getElementById('premiumModal');
  if (modal) modal.classList.add('open');
}
function hidePremiumModal() {
  const modal = document.getElementById('premiumModal');
  if (modal) modal.classList.remove('open');
}

// ── LOG MODAL (dashboard) ──
const logConfig = {
  weight:  { icon: '⚖️',  title: 'Log Weight',  label: 'Weight (kg)',      placeholder: '7.5' },
  height:  { icon: '📏',  title: 'Log Height',  label: 'Height (cm)',      placeholder: '68'  },
  sleep:   { icon: '😴',  title: 'Log Sleep',   label: 'Duration (hours)', placeholder: '9.5' },
  feeding: { icon: '🍼',  title: 'Log Feeding', label: 'Amount (ml)',       placeholder: '150' },
};
function showLogModal(type) {
  const cfg   = logConfig[type];
  const modal = document.getElementById('logModal');
  if (!modal || !cfg) return;
  document.getElementById('logTitle').textContent    = cfg.title;
  document.getElementById('logLabel').textContent    = cfg.label;
  document.getElementById('logValue').placeholder    = cfg.placeholder;
  document.getElementById('logSubtitle').textContent = 'Enter the details below';
  // Set current datetime
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('logDate').value = now.toISOString().slice(0, 16);
  modal.classList.add('open');
}
function hideLogModal() {
  const modal = document.getElementById('logModal');
  if (modal) modal.classList.remove('open');
}
function saveLog() {
  const val = document.getElementById('logValue').value;
  if (!val) { alert('Please enter a value.'); return; }
  hideLogModal();
  showToast('Entry saved successfully! 🎉');
}

// ── TOAST ──
function showToast(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.style.cssText = `
      position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(80px);
      background:#fff; color:#1E3A5F; padding:14px 22px; border-radius:50px;
      box-shadow:0 8px 32px rgba(0,0,0,0.15); display:flex; align-items:center;
      gap:10px; font-weight:700; font-size:0.9rem; z-index:9999;
      border-left:4px solid #10B981; transition:transform 0.35s ease;
      font-family:'Nunito',sans-serif;
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fas fa-check-circle" style="color:#10B981"></i> ${msg}`;
  setTimeout(() => toast.style.transform = 'translateX(-50%) translateY(0)', 50);
  setTimeout(() => toast.style.transform = 'translateX(-50%) translateY(80px)', 3500);
}

// ── CLOSE MODALS ON OVERLAY CLICK ──
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ── CLOSE MODALS ON ESC ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

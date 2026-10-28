const INITIAL_SCOOTERS = [
  { id: 'GC-1001', name: 'Самокат #1001', description: 'Лёгкий городской самокат для коротких поездок по центру.', tariff: 'start', tariffName: 'Старт', pricePerMin: 5, charge: 92, x: 180, y: 140, busy: false },
  { id: 'GC-1002', name: 'Самокат #1002', description: 'Мощный самокат с увеличенным запасом хода.', tariff: 'comfort', tariffName: 'Комфорт', pricePerMin: 4, charge: 65, x: 340, y: 100, busy: true },
  { id: 'GC-1003', name: 'Самокат #1003', description: 'Спортивная модель с хорошей амортизацией.', tariff: 'max', tariffName: 'Максимум', pricePerMin: 3, charge: 48, x: 560, y: 90, busy: false },
  { id: 'GC-1004', name: 'Самокат #1004', description: 'Новый самокат с максимальным зарядом батареи.', tariff: 'start', tariffName: 'Старт', pricePerMin: 5, charge: 100, x: 700, y: 180, busy: false },
  { id: 'GC-1005', name: 'Самокат #1005', description: 'Компактный самокат для быстрых перемещений.', tariff: 'comfort', tariffName: 'Комфорт', pricePerMin: 4, charge: 25, x: 120, y: 360, busy: false },
  { id: 'GC-1006', name: 'Самокат #1006', description: 'Усиленная модель для долгих поездок.', tariff: 'max', tariffName: 'Максимум', pricePerMin: 3, charge: 78, x: 360, y: 380, busy: true },
  { id: 'GC-1007', name: 'Самокат #1007', description: 'Премиум-самокат с мягким ходом.', tariff: 'comfort', tariffName: 'Комфорт', pricePerMin: 4, charge: 55, x: 580, y: 340, busy: false },
  { id: 'GC-1008', name: 'Самокат #1008', description: 'Бюджетный вариант для студентов.', tariff: 'max', tariffName: 'Максимум', pricePerMin: 3, charge: 15, x: 720, y: 420, busy: false }
];

const STORAGE_KEY = 'gocity_bookings_v2';
const SCOOTERS_KEY = 'gocity_scooters_v2';

let state = { scooters: [], bookings: [], selectedId: null, filters: { charge: 'all', tariff: 'all' } };

function loadFromStorage() {
  try {
    const s = localStorage.getItem(SCOOTERS_KEY);
    const b = localStorage.getItem(STORAGE_KEY);
    state.scooters = s ? JSON.parse(s) : JSON.parse(JSON.stringify(INITIAL_SCOOTERS));
    state.bookings = b ? JSON.parse(b) : [];
  } catch (e) {
    state.scooters = JSON.parse(JSON.stringify(INITIAL_SCOOTERS));
    state.bookings = [];
    notify('Не удалось загрузить данные', 'warn');
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(SCOOTERS_KEY, JSON.stringify(state.scooters));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
  } catch (e) {
    notify('Не удалось сохранить данные', 'error');
  }
}

function notify(text, type = 'info') {
  const n = document.createElement('div');
  n.textContent = text;
  n.style.cssText = `
    position: fixed; top: 80px; right: 20px; z-index: 1000;
    padding: 12px 18px; border-radius: 8px; font-size: 13px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    background: ${type === 'error' ? '#ff3b30' : type === 'warn' ? '#0a0a0a' : '#0a0a0a'};
    color: ${type === 'error' ? '#fff' : '#c8ff00'};
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    animation: fadeIn 0.3s ease;
    font-weight: 500;
  `;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

function getFiltered() {
  return state.scooters.filter(s => {
    if (state.filters.charge !== 'all' && s.charge < parseInt(state.filters.charge)) return false;
    if (state.filters.tariff !== 'all' && s.tariff !== state.filters.tariff) return false;
    return true;
  });
}

function statusText(s) {
  if (s.busy) return 'Занят';
  if (state.selectedId === s.id) return 'Выбран';
  return 'Свободен';
}

function renderMap() {
  const g = document.getElementById('scooterMarkers');
  g.innerHTML = '';
  const filtered = getFiltered();
  const ids = new Set(filtered.map(s => s.id));

  state.scooters.forEach(s => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.classList.add('scooter-marker');
    el.setAttribute('transform', `translate(${s.x}, ${s.y})`);
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${s.name}, ${statusText(s)}`);

    let cls = 'marker-free';
    if (s.busy) cls = 'marker-busy';
    else if (state.selectedId === s.id) cls = 'marker-selected';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '12');
    circle.setAttribute('class', cls);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('y', '4');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '9');
    text.setAttribute('font-weight', '700');
    text.setAttribute('font-family', 'Helvetica, Arial, sans-serif');
    text.setAttribute('fill', s.busy ? '#c8ff00' : '#0a0a0a');
    text.textContent = s.id.split('-')[1];

    el.appendChild(circle);
    el.appendChild(text);

    if (!s.busy && ids.has(s.id)) {
      el.addEventListener('click', () => select(s.id));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); } });
    }
    g.appendChild(el);
  });
}

function renderList() {
  const list = document.getElementById('scooterList');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('scooterCount');
  list.innerHTML = '';
  const filtered = getFiltered();
  count.textContent = filtered.length;

  if (filtered.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  filtered.forEach(s => {
    const item = document.createElement('div');
    item.className = 'scooter-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `${s.name}, ${statusText(s)}`);
    if (s.busy) item.classList.add('busy');
    else if (state.selectedId === s.id) item.classList.add('selected');

    const dotCls = s.busy ? 'busy' : state.selectedId === s.id ? 'selected' : 'free';
    const num = s.id.split('-')[1];

    item.innerHTML = `
      <div class="scooter-dot ${dotCls}">${num}</div>
      <div class="scooter-info">
        <div class="scooter-name">${s.name}</div>
        <div class="scooter-meta">${s.tariffName} · ${s.charge}%</div>
      </div>
      <div class="scooter-price">${s.pricePerMin} ₽/мин</div>
    `;

    if (!s.busy) {
      item.addEventListener('click', () => select(s.id));
      item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); } });
    }
    list.appendChild(item);
  });
}

function renderCard() {
  const ph = document.getElementById('placeholder');
  const card = document.getElementById('card');

  if (!state.selectedId) { ph.hidden = false; card.hidden = true; return; }

  const s = state.scooters.find(x => x.id === state.selectedId);
  if (!s) { ph.hidden = false; card.hidden = true; state.selectedId = null; return; }

  const filtered = getFiltered();
  if (!filtered.find(x => x.id === s.id)) {
    notify('Выбранный самокат скрыт фильтром', 'warn');
    state.selectedId = null;
    renderAll();
    return;
  }

  ph.hidden = true;
  card.hidden = false;

  document.getElementById('cardId').textContent = s.id;
  document.getElementById('cardTitle').textContent = s.name;
  document.getElementById('cardDesc').textContent = s.description;
  document.getElementById('cardCharge').textContent = `${s.charge}%`;
  document.getElementById('cardPrice').textContent = `${s.pricePerMin} ₽`;
  document.getElementById('cardTariff').textContent = s.tariffName;

  const badge = document.getElementById('cardStatus');
  badge.textContent = s.busy ? 'Занят' : 'Свободен';
  badge.className = `card__badge ${s.busy ? 'busy' : 'free'}`;

  document.getElementById('chargeFill').style.width = `${s.charge}%`;
  document.getElementById('bookingForm').hidden = s.busy;

  if (!s.busy) updateTotal();
}

function renderBookings() {
  const list = document.getElementById('bookingsList');
  const empty = document.getElementById('emptyBookings');
  const count = document.getElementById('bookingsCount');
  list.innerHTML = '';
  count.textContent = state.bookings.length;

  if (state.bookings.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  state.bookings.forEach(b => {
    const item = document.createElement('div');
    item.className = 'booking-item';
    item.innerHTML = `
      <div class="booking-header">
        <span class="booking-id">${b.id}</span>
        <span class="booking-total">${b.total} ₽</span>
      </div>
      <div class="booking-details">${b.scooterName} · ${b.minutes} мин</div>
      <button class="btn-cancel" data-booking="${b.id}" type="button">Отменить</button>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => cancel(btn.dataset.booking));
  });
}

function renderAll() {
  renderMap();
  renderList();
  renderCard();
  renderBookings();
}

function select(id) {
  const s = state.scooters.find(x => x.id === id);
  if (!s || s.busy) return;
  state.selectedId = id;
  renderAll();
  if (window.innerWidth <= 900) {
    document.getElementById('cardSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateTotal() {
  const s = state.scooters.find(x => x.id === state.selectedId);
  if (!s || s.busy) return;
  const min = parseInt(document.getElementById('minutes').value) || 0;
  const el = document.getElementById('totalPrice');
  if (min < 1 || min > 120) { el.textContent = '—'; return; }
  el.textContent = `${min * s.pricePerMin} ₽`;
}

function validate() {
  const inp = document.getElementById('minutes');
  const err = document.getElementById('minutesError');
  const v = parseInt(inp.value);
  inp.classList.remove('error');
  err.textContent = '';

  if (!state.selectedId) { err.textContent = 'Выберите самокат'; return false; }
  const s = state.scooters.find(x => x.id === state.selectedId);
  if (!s || s.busy) { err.textContent = 'Самокат недоступен'; return false; }
  if (isNaN(v) || v < 1) { inp.classList.add('error'); err.textContent = 'Минимум 1 минута'; return false; }
  if (v > 120) { inp.classList.add('error'); err.textContent = 'Максимум 120 минут'; return false; }
  return true;
}

function createBooking() {
  if (!validate()) return;
  const s = state.scooters.find(x => x.id === state.selectedId);
  const min = parseInt(document.getElementById('minutes').value);
  const total = min * s.pricePerMin;

  if (state.bookings.find(b => b.scooterId === s.id && !b.cancelled)) {
    notify('Этот самокат уже забронирован', 'error');
    return;
  }

  const b = {
    id: `BK-${Date.now().toString(36).toUpperCase()}`,
    scooterId: s.id,
    scooterName: s.name,
    minutes: min,
    total,
    createdAt: new Date().toISOString(),
    cancelled: false
  };

  state.bookings.push(b);
  s.busy = true;
  state.selectedId = null;
  saveToStorage();
  renderAll();
  notify(`Бронь ${b.id} создана`, 'info');
}

function cancel(id) {
  const b = state.bookings.find(x => x.id === id);
  if (!b || b.cancelled) return;
  if (!confirm(`Отменить бронь ${id}?`)) return;
  b.cancelled = true;
  const s = state.scooters.find(x => x.id === b.scooterId);
  if (s) s.busy = false;
  saveToStorage();
  renderAll();
  notify(`Бронь ${id} отменена`, 'warn');
}

function resetAll() {
  if (!confirm('Сбросить все данные?')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SCOOTERS_KEY);
  state.scooters = JSON.parse(JSON.stringify(INITIAL_SCOOTERS));
  state.bookings = [];
  state.selectedId = null;
  renderAll();
  notify('Данные сброшены', 'info');
}

function init() {
  loadFromStorage();

  document.getElementById('chargeFilter').addEventListener('change', (e) => { state.filters.charge = e.target.value; renderAll(); });
  document.getElementById('tariffFilter').addEventListener('change', (e) => { state.filters.tariff = e.target.value; renderAll(); });
  document.getElementById('clearFilters').addEventListener('click', () => { state.filters = { charge: 'all', tariff: 'all' }; document.getElementById('chargeFilter').value = 'all'; document.getElementById('tariffFilter').value = 'all'; renderAll(); });
  document.getElementById('clearFiltersList').addEventListener('click', () => { state.filters = { charge: 'all', tariff: 'all' }; document.getElementById('chargeFilter').value = 'all'; document.getElementById('tariffFilter').value = 'all'; renderAll(); });

  document.getElementById('minutes').addEventListener('input', () => { updateTotal(); document.getElementById('minutesError').textContent = ''; document.getElementById('minutes').classList.remove('error'); });
  document.getElementById('bookingForm').addEventListener('submit', (e) => { e.preventDefault(); createBooking(); });
  document.getElementById('resetBtn').addEventListener('click', resetAll);

  renderAll();
}

init();

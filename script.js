window.tailwind = window.tailwind || {};
window.tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                outfit: ['Outfit', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                glass: 'rgba(255, 255, 255, 0.03)',
                'glass-border': 'rgba(255, 255, 255, 0.1)',
            }
        }
    }
};

const API_BASE = 'https://whenisthenextmcufilm.com/api';
let currentData = null;
let hackerMode = false;
let countdownInterval;

async function updateDisplay(date = '', listId = '') {
    const loading = document.getElementById('loading');
    const display = document.getElementById('display-container');
    const lText = document.getElementById('loading-text');

    loading.classList.remove('hidden');
    display.classList.add('hidden');
    lText.textContent = 'SYNCHRONIZING_COORDINATES...';

    try {
        const url = new URL(API_BASE);
        if (date) url.searchParams.set('date', date);
        if (listId) url.searchParams.set('list_id', listId);

        const res = await fetch(url);
        const data = await res.json();
        currentData = data;

        renderData(data);

        setTimeout(() => {
            loading.classList.add('hidden');
            display.classList.remove('hidden');
        }, 800);
    } catch (err) {
        console.error(err);
        lText.textContent = 'CONNECTION_FAILED: RETRY_REQUESTED';
        setTimeout(() => updateDisplay(date, listId), 3000);
    }
}

function renderData(data) {
    document.getElementById('title').textContent = data.title;
    document.getElementById('poster').src = data.poster_url;
    document.getElementById('type-badge').textContent = data.type;
    document.getElementById('overview').textContent = data.overview;
    document.getElementById('days-count').textContent = `T-MINUS ${data.days_until} DAYS`;

    const release = new Date(data.release_date);
    document.getElementById('release-date').textContent = release.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    if (data.following_production) {
        document.getElementById('following-container').classList.remove('hidden', 'pointer-events-none', 'opacity-50');
        document.getElementById('next-title').textContent = data.following_production.title;
        document.getElementById('next-date').textContent = `Scheduled: ${data.following_production.release_date}`;
        document.getElementById('next-poster').src = data.following_production.poster_url;
    } else {
        document.getElementById('following-container').classList.add('hidden');
    }

    startCountdown(data.release_date);
    updateProgressBar(data.release_date);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('translate-x-full');
}

function toggleHackerMode() {
    hackerMode = !hackerMode;
    document.body.classList.toggle('font-mono');
    document.getElementById('hacker-layer').classList.toggle('opacity-50');
    document.getElementById('bg-glow').style.filter = hackerMode ? 'grayscale(1) contrast(1.5)' : '';

    document.querySelectorAll('.gradient-text').forEach((el) => {
        el.classList.toggle('text-amber-500', hackerMode);
        el.classList.toggle('gradient-text', !hackerMode);
    });
}

function setUniverse(id) {
    document.getElementById('list-query').value = id;
    applyFilters();
}

function applyFilters() {
    const date = document.getElementById('date-query').value;
    const listId = document.getElementById('list-query').value;

    const url = new URL(window.location);
    if (date) url.searchParams.set('date', date); else url.searchParams.delete('date');
    if (listId) url.searchParams.set('list_id', listId); else url.searchParams.delete('list_id');
    window.history.pushState({}, '', url);

    updateDisplay(date, listId);
    if (!document.getElementById('sidebar').classList.contains('translate-x-full')) toggleSidebar();
}

function jumpToNext() {
    if (currentData && currentData.release_date) {
        const d = new Date(currentData.release_date);
        d.setDate(d.getDate() + 1);
        const iso = d.toISOString().split('T')[0];
        document.getElementById('date-query').value = iso;
        applyFilters();
    }
}

function startCountdown(dateStr) {
    if (countdownInterval) clearInterval(countdownInterval);
    const target = new Date(dateStr).getTime();

    const update = () => {
        const now = new Date().getTime();
        const diff = target - now;

        const d = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        const h = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        const m = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
        const s = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

        document.getElementById('days').textContent = String(d).padStart(2, '0');
        document.getElementById('hours').textContent = String(h).padStart(2, '0');
        document.getElementById('minutes').textContent = String(m).padStart(2, '0');
        document.getElementById('seconds').textContent = String(s).padStart(2, '0');
    };

    update();
    countdownInterval = setInterval(update, 1000);
}

function updateProgressBar(targetDate) {
    const start = new Date(targetDate).getTime() - (365 * 24 * 60 * 60 * 1000);
    const end = new Date(targetDate).getTime();
    const now = Date.now();
    const prog = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
    document.getElementById('discovery-progress').style.width = `${prog}%`;
}

function shareLink() {
    navigator.clipboard.writeText(window.location.href);
    const toast = document.getElementById('toast');
    toast.classList.remove('opacity-0', 'translate-y-20');
    setTimeout(() => toast.classList.add('opacity-0', 'translate-y-20'), 2500);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    shareLink();
}

function createStars() {
    const container = document.getElementById('starfield');
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'stars';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.setProperty('--delay', `${Math.random() * 5}s`);
        star.style.setProperty('--duration', `${2 + Math.random() * 3}s`);
        star.style.setProperty('--max-opacity', (0.2 + Math.random() * 0.8));
        container.appendChild(star);
    }
}

function setupEventListeners() {
    const universeButtons = document.querySelectorAll('.universe-btn');
    universeButtons.forEach((button) => {
        button.addEventListener('click', () => setUniverse(button.dataset.id));
    });

    document.getElementById('theme-toggle').addEventListener('click', toggleHackerMode);
    document.getElementById('sidebar-open-btn').addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-close-btn').addEventListener('click', toggleSidebar);
    document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    document.getElementById('share-link-btn').addEventListener('click', shareLink);
    document.getElementById('copy-data-btn').addEventListener('click', () => {
        copyToClipboard(currentData?.overview || '');
    });
    document.getElementById('following-container').addEventListener('click', jumpToNext);
}

window.onload = () => {
    createStars();
    setupEventListeners();
    const params = new URLSearchParams(window.location.search);
    const date = params.get('date');
    const listId = params.get('list_id');

    if (date) document.getElementById('date-query').value = date;
    if (listId) document.getElementById('list-query').value = listId;

    updateDisplay(date, listId);
};

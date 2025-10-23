// New downloads page module: centralized state + efficient rendering
(function() {
  const { ipcRenderer, shell } = require('electron');

  // State store
  const Store = {
    active: new Map(),
    history: [],
    urls: {
      'panamera-redux': 'https://github.com/tumbwumba-dot/launcherlaunceherlalalasllasldla/releases/download/panamera/panamera.redux.rar',
      'gucci-redux-v2': 'https://github.com/tumbwumba-dot/launcherlaunceherlalalasllasldla/releases/download/v1.0.5/gucci-redux-v2.zip'
    },
    load() {
      try {
        const a = JSON.parse(localStorage.getItem('activeDownloads')||'[]');
        const h = JSON.parse(localStorage.getItem('downloadHistory')||'[]');
        this.active = new Map(a.map(d => [d.id, d]));
        this.history = h;
      } catch(e) { console.error('load store', e); }
    },
    persist() {
      try {
        localStorage.setItem('activeDownloads', JSON.stringify(Array.from(this.active.values())));
        localStorage.setItem('downloadHistory', JSON.stringify(this.history));
      } catch(e) { console.error('persist store', e); }
    },
    upsert(d) { this.active.set(d.id, d); this.persist(); },
    remove(id) { this.active.delete(id); this.persist(); },
    completeToHistory(id) {
      const d = this.active.get(id);
      if (!d) return;
      this.history.unshift(d);
      if (this.history.length > 20) this.history.pop();
      this.active.delete(id);
      this.persist();
    }
  };

  // Utilities
  const fmt = {
    size(bytes) { return bytes && bytes > 0 ? (bytes/1024/1024).toFixed(1)+' MB' : '0 MB'; },
    speed(bps) { return bps && bps > 0 ? (bps/1024/1024).toFixed(1)+' MB/s' : '0 MB/s'; },
    time(sec) {
      if (!sec || sec<=0 || !isFinite(sec)) return '';
      if (sec < 60) return Math.ceil(sec)+'с';
      if (sec < 3600) return Math.ceil(sec/60)+'м';
      return Math.ceil(sec/3600)+'ч';
    },
    date(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return d.toLocaleDateString('ru-RU');
    }
  };

  // Rendering
  const el = sel => document.querySelector(sel);
  function render() {
    const list = el('#downloads-list');
    const hist = el('#downloads-history');
    const empty = el('#downloads-empty');
    if (!list || !hist || !empty) return;

    const actives = Array.from(Store.active.values());
    const completed = Store.history;

    el('#active-count') && (el('#active-count').textContent = actives.length);
    el('#completed-count') && (el('#completed-count').textContent = completed.length);
    el('#active-count-badge') && (el('#active-count-badge').textContent = actives.length);
    el('#completed-count-badge') && (el('#completed-count-badge').textContent = completed.length);

    empty.style.display = (actives.length + completed.length === 0) ? 'block' : 'none';
    list.style.display = actives.length ? 'grid' : 'none';
    hist.style.display = completed.length ? 'grid' : 'none';

    list.innerHTML = '';
    hist.innerHTML = '';

    const makeCard = d => {
      const card = document.createElement('div');
      card.className = 'download-card';
      const speed = d.speedMBps || 0;
      const downloadedMB = d.downloadedBytes ? (d.downloadedBytes/1024/1024).toFixed(1) : (d.downloaded||'0');
      const totalMB = d.totalBytes ? (d.totalBytes/1024/1024).toFixed(1) : (d.total||'0');
      const remainSec = speed>0 && d.totalBytes && d.downloadedBytes ? (d.totalBytes-d.downloadedBytes)/ (speed*1024*1024) : 0;
      const statusClass = d.state === 'error' ? 'error' : (d.state==='paused'||d.state==='cancelled' ? 'paused' : 'downloading');
      const actions = (d.state==='ready-to-install') ? `<button class="download-card-btn primary" data-act="install" data-id="${d.id}">Установить</button>`
        : (d.state==='downloading') ? `<button class="download-card-btn secondary" data-act="pause" data-id="${d.id}">Пауза</button><button class="download-card-btn danger" data-act="cancel" data-id="${d.id}">Отмена</button>`
        : (d.state==='paused'||d.state==='error'||d.state==='cancelled') ? `<button class="download-card-btn primary" data-act="resume" data-id="${d.id}">Возобновить</button>`
        : (d.state==='installed') ? `<button class="download-card-btn secondary" data-act="open" data-id="${d.id}">Папка</button>` : '';
      card.innerHTML = `
        <div class="download-card-header">
          <div class="download-card-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg></div>
          <div class="download-card-info">
            <div class="download-card-name">${d.name}</div>
            <div class="download-card-status"><span class="status-indicator ${statusClass}"></span>${d.status||''}</div>
          </div>
          <div class="download-card-actions">${actions}</div>
        </div>
        ${d.state!=='installed' ? `<div class="download-progress-section">
          <div class="download-progress"><div class="download-progress-bar" style="width:${Math.max(0,Math.min(100, d.progress||0))}%"></div></div>
          <div class="download-progress-info">
            <span>${downloadedMB} MB / ${totalMB} MB</span>
            <span class="download-speed">${fmt.speed(d.speedBytesPerSec)}</span>
            <span class="download-time-remaining">${fmt.time(remainSec)}</span>
          </div>
        </div>`: ''}
        <div class="download-card-footer">
          <div class="download-file-info"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>
            <span class="download-file-size">${totalMB} MB</span></div>
          <div class="download-date">${fmt.date(d.startTime)}</div>
        </div>`;
      return card;
    };

    const fragA = document.createDocumentFragment();
    actives.forEach(d => fragA.appendChild(makeCard(d)));
    list.appendChild(fragA);

    const fragH = document.createDocumentFragment();
    completed.forEach(d => fragH.appendChild(makeCard(d)));
    hist.appendChild(fragH);

    // delegate actions
    list.onclick = hist.onclick = (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const act = btn.getAttribute('data-act');
      Actions[act] && Actions[act](id);
    };
  }

  // Actions
  const Actions = {
    start(reduxId, name, url) {
      const id = 'dl-'+Date.now();
      const d = { id, reduxId, name, state:'downloading', status:'Загрузка...', progress:0, downloadedBytes:0, totalBytes:0, speedBytesPerSec:0, startTime: Date.now(), downloadUrl: url };
      Store.upsert(d);
      ipcRenderer.send('download-redux', { downloadId: id, url, reduxId });
      render();
      return id;
    },
    pause(id) {
      const d = Store.active.get(id); if (!d) return;
      d.state = 'paused'; d.status = 'Приостановлено';
      Store.upsert(d); render();
      ipcRenderer.send('pause-download', { downloadId: id });
    },
    resume(id) {
      const d = Store.active.get(id); if (!d) return;
      d.state = 'downloading'; d.status = 'Загрузка...';
      Store.upsert(d); render();
      ipcRenderer.send('download-redux', { downloadId: id, url: d.downloadUrl, reduxId: d.reduxId });
    },
    cancel(id) {
      const d = Store.active.get(id); if (!d) return;
      d.status = 'Отмена...'; Store.upsert(d); render();
      ipcRenderer.send('cancel-download', { downloadId: id });
      setTimeout(() => { // safety fallback
        const cur = Store.active.get(id);
        if (cur && cur.status === 'Отмена...') {
          cur.state = 'cancelled'; cur.status = 'Отменено';
          Store.upsert(cur); render();
        }
      }, 3000);
    },
    install(id) {
      const d = Store.active.get(id); if (!d) return;
      d.state = 'installing'; d.status = 'Установка...';
      Store.upsert(d); render();
      ipcRenderer.send('install-downloaded-redux', { downloadId: id, reduxId: d.reduxId, filePath: d.filePath });
    },
    open(id) {
      const d = Store.active.get(id) || Store.history.find(x=>x.id===id);
      if (d && d.filePath) ipcRenderer.send('open-folder', d.filePath);
    }
  };

  // IPC wiring
  ipcRenderer.removeAllListeners('download-progress');
  ipcRenderer.removeAllListeners('download-complete');
  ipcRenderer.removeAllListeners('download-error');
  ipcRenderer.removeAllListeners('download-cancelled');
  ipcRenderer.removeAllListeners('install-complete');

  ipcRenderer.on('download-progress', (e, data) => {
    const d = Store.active.get(data.downloadId); if (!d) return;
    d.progress = data.progress;
    d.speedBytesPerSec = (data.speed && /MB\/s/.test(data.speed)) ? parseFloat(data.speed)*1024*1024 : (data.bytesPerSec||0);
    d.downloaded = data.downloaded; // legacy string
    d.total = data.total;           // legacy string
    d.downloadedBytes = data.downloadedBytes || d.downloadedBytes;
    d.totalBytes = data.totalBytes || d.totalBytes;
    d.status = 'Загрузка...';
    Store.upsert(d);
    render();
  });

  ipcRenderer.on('download-complete', (e, data) => {
    const d = Store.active.get(data.downloadId); if (!d) return;
    d.progress = 100; d.state = 'ready-to-install'; d.status = 'Готов к установке';
    d.filePath = data.filePath; d.speedBytesPerSec = 0;
    Store.upsert(d); render();
  });

  ipcRenderer.on('download-error', (e, data) => {
    const d = Store.active.get(data.downloadId); if (!d) return;
    d.state = 'error'; d.status = `Ошибка: ${data.error}`;
    Store.upsert(d); render();
  });

  ipcRenderer.on('download-cancelled', (e, data) => {
    const d = Store.active.get(data.downloadId); if (!d) return;
    d.state = 'cancelled'; d.status = 'Отменено';
    Store.upsert(d); render();
  });

  ipcRenderer.on('install-complete', (e, data) => {
    const d = Store.active.get(data.downloadId); if (!d) return;
    d.state = 'installed'; d.status = 'Установлен';
    Store.upsert(d); render();
    setTimeout(() => { Store.completeToHistory(data.downloadId); render(); }, 1500);
  });

  // Expose global helpers for existing HTML buttons
  window.addDownload = (reduxId, name, url) => Actions.start(reduxId, name, url || Store.urls[reduxId]);
  window.resumeDownload = id => Actions.resume(id);
  window.pauseDownload = id => Actions.pause(id);
  window.cancelDownload = id => Actions.cancel(id);
  window.installDownloadedRedux = id => Actions.install(id);
  window.openDownloadFolder = id => Actions.open(id);

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    Store.load();
    render();
    // Hook top controls
    const pauseAll = document.getElementById('pause-all-btn');
    const resumeAll = document.getElementById('resume-all-btn');
    const clearCompleted = document.getElementById('clear-completed-btn');
    pauseAll && (pauseAll.onclick = () => Array.from(Store.active.keys()).forEach(Actions.pause));
    resumeAll && (resumeAll.onclick = () => Array.from(Store.active.keys()).forEach(Actions.resume));
    clearCompleted && (clearCompleted.onclick = () => { Store.history = []; Store.persist(); render();});
  });
})();
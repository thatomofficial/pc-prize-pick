"""Tiny stdlib-only dashboard server for live scrape visibility.

Architecture:

  scraper thread  ──emit(event)──▶  EventBus  ──fan-out──▶  N SSE clients
                                       │
                                       └─history (re-played on connect)

The scraper publishes events via ``emit("type", **data)``. Each browser
connection to ``/events`` subscribes to a queue that receives the entire
history immediately, then new events as they're emitted. A 15-second
heartbeat keeps the connection alive through any proxy / browser idle
timeouts.

The dashboard HTML, CSS, and JS are inlined as a single constant so the
scraper has no static-file dependency — drop the script into any folder
and it still serves the UI.
"""

from __future__ import annotations

import http.server
import json
import queue
import threading
import webbrowser
from typing import Any


class EventBus:
    """Thread-safe broadcast bus with re-playable history.

    New subscribers receive every event published so far, then any new ones
    in real time. ``close()`` wakes all blocking ``get()`` calls so threads
    can drain cleanly when the scraper exits.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._subscribers: list[queue.Queue[dict[str, Any] | None]] = []
        self._history: list[dict[str, Any]] = []
        self._closed = False

    def subscribe(self) -> queue.Queue[dict[str, Any] | None]:
        q: queue.Queue[dict[str, Any] | None] = queue.Queue()
        with self._lock:
            for event in self._history:
                q.put(event)
            self._subscribers.append(q)
            if self._closed:
                q.put(None)
        return q

    def unsubscribe(self, q: queue.Queue[dict[str, Any] | None]) -> None:
        with self._lock:
            try:
                self._subscribers.remove(q)
            except ValueError:
                pass

    def publish(self, event: dict[str, Any]) -> None:
        with self._lock:
            if self._closed:
                return
            self._history.append(event)
            subscribers = list(self._subscribers)
        for q in subscribers:
            q.put(event)

    def close(self) -> None:
        with self._lock:
            self._closed = True
            subscribers = list(self._subscribers)
            self._subscribers.clear()
        for q in subscribers:
            q.put(None)


class _DashboardHandler(http.server.BaseHTTPRequestHandler):
    # Populated by ``start_dashboard``.
    bus: EventBus

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        # Silence the default per-request stdout chatter — we have vlog for that.
        return

    def do_GET(self) -> None:  # noqa: N802 (http.server contract)
        if self.path in ("/", "/index.html"):
            self._serve_html()
        elif self.path == "/events":
            self._serve_events()
        else:
            self.send_error(404, "Not found")

    def _serve_html(self) -> None:
        body = _DASHBOARD_HTML.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _serve_events(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-transform")
        self.send_header("Connection", "keep-alive")
        self.send_header("X-Accel-Buffering", "no")  # disable nginx buffering if reverse-proxied
        self.end_headers()

        q = self.bus.subscribe()
        try:
            while True:
                try:
                    event = q.get(timeout=15)
                except queue.Empty:
                    # Heartbeat so the browser keeps the connection alive even
                    # during long pauses between scraper events.
                    try:
                        self.wfile.write(b": ping\n\n")
                        self.wfile.flush()
                    except (BrokenPipeError, ConnectionResetError, OSError):
                        return
                    continue
                if event is None:
                    return
                try:
                    payload = json.dumps(event, ensure_ascii=False)
                    self.wfile.write(f"data: {payload}\n\n".encode("utf-8"))
                    self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError, OSError):
                    return
        finally:
            self.bus.unsubscribe(q)


def start_dashboard(
    port: int,
    bus: EventBus,
    *,
    open_browser: bool = True,
    host: str = "127.0.0.1",
) -> http.server.ThreadingHTTPServer:
    """Spin up the dashboard in a daemon thread and return the server.

    Caller decides when to shut down via ``server.shutdown()`` — typically
    "after the scrape ends, wait for Ctrl-C so the user can browse the
    final state".
    """
    handler_cls = type("BoundDashboardHandler", (_DashboardHandler,), {"bus": bus})
    server = http.server.ThreadingHTTPServer((host, port), handler_cls)
    thread = threading.Thread(target=server.serve_forever, daemon=True, name="dashboard-http")
    thread.start()

    if open_browser:
        try:
            webbrowser.open_new_tab(f"http://{host}:{port}/")
        except Exception:
            # Headless environments / restricted browsers — surface URL via stdout
            # and continue.
            pass

    return server


# ---------------------------------------------------------------- HTML --

_DASHBOARD_HTML = """<!doctype html>
<html lang="en-ZA">
<head>
  <meta charset="utf-8" />
  <title>pc-prize-pick · scraper</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --ink-1000: #050403;
      --ink-900: #0b0907;
      --ink-800: #14110f;
      --ink-700: #1c1815;
      --cream-100: #f6f1e7;
      --cream-200: #e8e2d4;
      --cream-300: #b8b0a3;
      --cream-400: #807870;
      --cream-500: #4a443e;
      --volt: #d8ff3a;
      --signal: #ff5a36;
      --rare: #6aa8ff;
      --hairline: 1px solid rgba(246, 241, 231, 0.08);
      --hairline-strong: 1px solid rgba(246, 241, 231, 0.18);
      --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, ui-monospace, monospace;
      --font-display: 'Instrument Serif', 'Cormorant Garamond', serif;
      --font-body: 'Hanken Grotesk', system-ui, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; }

    html, body {
      background: var(--ink-900);
      color: var(--cream-100);
      font-family: var(--font-body);
      font-size: 15px;
      line-height: 1.5;
      min-height: 100vh;
    }

    a { color: var(--volt); text-decoration: none; }

    header.app {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 1.4rem 2rem;
      border-bottom: var(--hairline);
      background: var(--ink-1000);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    header.app h1 {
      font-family: var(--font-display);
      font-size: 1.6rem;
      letter-spacing: -0.02em;
    }
    header.app h1 .mark {
      color: var(--volt);
      font-style: italic;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.5ch;
      padding: 4px 10px;
      border: var(--hairline-strong);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .status.running { color: var(--volt); border-color: rgba(216, 255, 58, 0.5); }
    .status.done { color: var(--cream-300); }
    .status.idle { color: var(--cream-400); }
    .status .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 0 0 rgba(216, 255, 58, 0.55);
    }
    .status.running .dot { animation: pulse 1.6s cubic-bezier(0.25,1,0.5,1) infinite; }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(216,255,58,0.55); }
      70% { box-shadow: 0 0 0 10px rgba(216,255,58,0); }
      100% { box-shadow: 0 0 0 0 rgba(216,255,58,0); }
    }

    .stats {
      display: inline-flex;
      gap: 1.4rem;
    }
    .stat {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .stat dt {
      font-size: 0.65rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--cream-400);
    }
    .stat dd {
      font-family: var(--font-mono);
      font-size: 1.5rem;
      color: var(--cream-100);
      letter-spacing: -0.03em;
    }
    .stat.errors dd { color: var(--signal); }

    main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 380px;
      gap: 0;
      min-height: calc(100vh - 78px);
    }
    @media (max-width: 920px) {
      main { grid-template-columns: 1fr; }
      aside.activity { border-left: 0; border-top: var(--hairline); max-height: 320px; }
    }

    section.builds {
      padding: 1.5rem 2rem;
    }
    section.builds h2 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--cream-400);
      margin-bottom: 1rem;
    }
    .empty {
      padding: 2rem 1rem;
      border: 1px dashed rgba(246, 241, 231, 0.18);
      color: var(--cream-400);
      text-align: center;
      font-style: italic;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .card {
      background: var(--ink-800);
      border: var(--hairline);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      animation: rise 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
      transition: border-color 240ms ease;
    }
    .card:hover { border-color: rgba(246, 241, 231, 0.22); }
    @keyframes rise {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .card .name {
      font-family: var(--font-display);
      font-size: 1.05rem;
      line-height: 1.2;
      color: var(--cream-100);
    }
    .card .price {
      font-family: var(--font-mono);
      font-size: 1.2rem;
      color: var(--volt);
      letter-spacing: -0.02em;
    }
    .card .specs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.4rem;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3ch;
      padding: 2px 8px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.02em;
      border: 1px solid rgba(246, 241, 231, 0.18);
      color: var(--cream-300);
    }
    .pill.hit { color: var(--volt); border-color: rgba(216, 255, 58, 0.4); }
    .pill.miss { color: var(--cream-500); }
    .pill.fallback { color: var(--rare); border-color: rgba(106, 168, 255, 0.4); }
    .card .warnings {
      list-style: none;
      padding: 0;
      margin-top: 0.4rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .card .warnings li {
      font-size: 0.75rem;
      color: var(--signal);
      padding-left: 0.8rem;
      position: relative;
    }
    .card .warnings li::before {
      content: '!';
      position: absolute;
      left: 0;
      color: var(--signal);
    }
    .card .url {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--cream-500);
      word-break: break-all;
    }
    .card .url a:hover { color: var(--cream-200); }

    aside.activity {
      border-left: var(--hairline);
      background: var(--ink-1000);
      padding: 1.5rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-height: 100%;
      overflow: hidden;
    }
    aside.activity h2 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--cream-400);
      margin-bottom: 0.5rem;
    }
    .log {
      list-style: none;
      padding: 0;
      flex: 1;
      display: flex;
      flex-direction: column-reverse;
      gap: 0.35rem;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--cream-300);
    }
    .log li {
      padding: 0.3rem 0;
      border-bottom: 1px solid rgba(246, 241, 231, 0.04);
      display: grid;
      grid-template-columns: 78px 1fr;
      gap: 0.5rem;
      animation: rise 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .log .tag {
      color: var(--volt);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 0.65rem;
    }
    .log .tag.error { color: var(--signal); }
    .log .tag.catalog-miss { color: var(--cream-400); }
    .log .tag.lookup { color: var(--rare); }
    .log .msg { color: var(--cream-200); word-break: break-word; }

    footer.app {
      padding: 1rem 2rem;
      border-top: var(--hairline);
      color: var(--cream-500);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      grid-column: 1 / -1;
    }
  </style>
</head>
<body>
  <header class="app">
    <h1>
      <span class="mark">PC/</span>
      Prize Pick · scraper
    </h1>

    <div class="stats">
      <div class="stat">
        <dt>Products</dt>
        <dd id="stat-products">0</dd>
      </div>
      <div class="stat">
        <dt>CPUs</dt>
        <dd id="stat-cpus">0</dd>
      </div>
      <div class="stat">
        <dt>GPUs</dt>
        <dd id="stat-gpus">0</dd>
      </div>
      <div class="stat errors">
        <dt>Warnings</dt>
        <dd id="stat-warnings">0</dd>
      </div>
    </div>

    <div class="status idle" id="status">
      <span class="dot"></span>
      <span id="status-text">connecting</span>
    </div>
  </header>

  <main>
    <section class="builds">
      <h2 id="builds-heading">Inventory · 0 build(s)</h2>
      <div class="empty" id="empty">Waiting for the scraper to find its first product…</div>
      <div class="grid" id="grid"></div>
    </section>

    <aside class="activity">
      <h2>Activity feed</h2>
      <ul class="log" id="log"></ul>
    </aside>
  </main>

  <footer class="app">
    Live via Server-Sent Events at <code>/events</code>. Ctrl-C the scraper to stop the dashboard.
  </footer>

  <script>
    const $ = (id) => document.getElementById(id);
    const grid = $('grid');
    const log = $('log');
    const empty = $('empty');
    const cards = new Map(); // build url -> card element
    const counts = { products: 0, cpus: new Set(), gpus: new Set(), warnings: 0 };

    function setStatus(state, text) {
      const s = $('status');
      s.classList.remove('idle', 'running', 'done');
      s.classList.add(state);
      $('status-text').textContent = text;
    }

    function fmtRand(cents) {
      if (typeof cents !== 'number') return '—';
      return 'R' + (cents / 100).toLocaleString('en-ZA', { maximumFractionDigits: 0 });
    }

    function recountStats() {
      $('stat-products').textContent = counts.products;
      $('stat-cpus').textContent = counts.cpus.size;
      $('stat-gpus').textContent = counts.gpus.size;
      $('stat-warnings').textContent = counts.warnings;
      $('builds-heading').textContent = `Inventory · ${counts.products} build(s)`;
    }

    function pushLog(tag, msg) {
      const li = document.createElement('li');
      const tagEl = document.createElement('span');
      const msgEl = document.createElement('span');
      tagEl.className = 'tag ' + tag.replace(/[^a-z0-9-]/gi, '-');
      tagEl.textContent = tag;
      msgEl.className = 'msg';
      msgEl.textContent = msg;
      li.appendChild(tagEl);
      li.appendChild(msgEl);
      log.insertBefore(li, log.firstChild);
      // Cap to last 80 entries.
      while (log.children.length > 80) log.removeChild(log.lastChild);
    }

    function shortUrl(url) {
      if (!url) return '';
      return url.length <= 60 ? url : '…' + url.slice(-59);
    }

    function ensureCard(url) {
      if (cards.has(url)) return cards.get(url);
      empty.style.display = 'none';
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="name">…</div>
        <div class="price"></div>
        <div class="specs">
          <span class="pill miss" data-kind="cpu">cpu ?</span>
          <span class="pill miss" data-kind="gpu">gpu ?</span>
        </div>
        <ul class="warnings"></ul>
        <div class="url"><a target="_blank" rel="noopener">${shortUrl(url)}</a></div>
      `;
      const urlA = card.querySelector('.url a');
      urlA.href = url;
      urlA.textContent = shortUrl(url);
      grid.appendChild(card);
      cards.set(url, card);
      return card;
    }

    function applyProductEvent(data) {
      const card = ensureCard(data.url);
      card.querySelector('.name').textContent = data.name || '(no name)';
      card.querySelector('.price').textContent = fmtRand(data.price_cents);
      counts.products += 1;
      recountStats();
    }

    function applyCatalogEvent(data, status) {
      // status: 'hit' (catalog), 'fallback' (spec lookup), 'miss' (gave up)
      const card = data.build_url ? ensureCard(data.build_url) : null;
      if (!card) return;
      const pill = card.querySelector(`.pill[data-kind="${data.kind}"]`);
      if (!pill) return;
      pill.classList.remove('hit', 'miss', 'fallback');
      pill.classList.add(status);
      const label = status === 'hit'
        ? `${data.kind} ✓ ${data.model || ''}`
        : status === 'fallback'
        ? `${data.kind} ⤴ ${data.model || ''}`
        : `${data.kind} ✗`;
      pill.textContent = label;
      if (status !== 'miss' && data.model) {
        if (data.kind === 'cpu') counts.cpus.add(data.model);
        else if (data.kind === 'gpu') counts.gpus.add(data.model);
        recountStats();
      }
    }

    function applyWarning(data) {
      counts.warnings += 1;
      recountStats();
      const card = data.build_url ? ensureCard(data.build_url) : null;
      if (!card) return;
      const list = card.querySelector('.warnings');
      const li = document.createElement('li');
      li.textContent = data.message;
      list.appendChild(li);
    }

    function applyEvent(event) {
      const { type, data } = event;
      switch (type) {
        case 'config':
          pushLog('config', `${data.sources} source(s) · ${data.spec_sources} spec source(s) · catalog ${data.catalog_cpus}c/${data.catalog_gpus}g`);
          setStatus('running', 'scraping');
          break;
        case 'source_started':
          pushLog('source', `${data.name} · maxPages=${data.max_pages}`);
          break;
        case 'fetch':
          pushLog('fetch', shortUrl(data.url));
          break;
        case 'product':
          pushLog('product', `${data.name} · ${fmtRand(data.price_cents)}`);
          applyProductEvent(data);
          break;
        case 'catalog':
          pushLog('catalog', `${data.kind} ✓ ${data.model}`);
          applyCatalogEvent(data, 'hit');
          break;
        case 'catalog_miss':
          pushLog('catalog-miss', `${data.kind} '${data.model}' miss → fallback`);
          break;
        case 'lookup':
          pushLog('lookup', `${data.kind} ⤴ ${data.model} (${data.source})`);
          applyCatalogEvent(data, 'fallback');
          break;
        case 'lookup_failed':
          pushLog('error', `${data.kind} '${data.model}' unresolved`);
          applyCatalogEvent(data, 'miss');
          break;
        case 'warning':
          applyWarning(data);
          break;
        case 'summary':
          pushLog('summary', `${data.products} build(s) · ${data.cpus} cpu(s) · ${data.gpus} gpu(s) · ${data.fetch_errors} fetch error(s)`);
          break;
        case 'done':
          setStatus('done', 'finished');
          break;
        default:
          pushLog(type, JSON.stringify(data));
      }
    }

    const stream = new EventSource('/events');
    stream.onopen = () => setStatus('running', 'streaming');
    stream.onmessage = (msg) => {
      try {
        applyEvent(JSON.parse(msg.data));
      } catch (err) {
        pushLog('error', 'failed to parse event: ' + err);
      }
    };
    stream.onerror = () => setStatus('idle', 'reconnecting');
  </script>
</body>
</html>
"""

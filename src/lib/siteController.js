let hasInitialized = false;

export function initializeSite() {
  if (hasInitialized) return undefined;
  // Fragments are one document and cannot have distinct SEO metadata. Forward
  // legacy links to the corresponding crawlable, canonical URL.
  var legacyRoute = { '#home': '/', '#works': '/products/', '#system': '/workbench/' }[window.location.hash];
  if (legacyRoute) {
    window.location.replace(legacyRoute);
    return undefined;
  }
  hasInitialized = true;

  const listenerRecords = [];
  const timeoutIds = new Set();
  const intervalIds = new Set();
  const animationFrameIds = new Set();
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);

  EventTarget.prototype.addEventListener = function(type, listener, options) {
    listenerRecords.push([this, type, listener, options]);
    return originalAddEventListener.call(this, type, listener, options);
  };

  function setTimeout(callback, delay, ...args) {
    const timeoutId = nativeSetTimeout(() => {
      timeoutIds.delete(timeoutId);
      callback(...args);
    }, delay);
    timeoutIds.add(timeoutId);
    return timeoutId;
  }

  function clearTimeout(timeoutId) {
    timeoutIds.delete(timeoutId);
    nativeClearTimeout(timeoutId);
  }

  function setInterval(callback, delay, ...args) {
    const intervalId = nativeSetInterval(callback, delay, ...args);
    intervalIds.add(intervalId);
    return intervalId;
  }

  function clearInterval(intervalId) {
    intervalIds.delete(intervalId);
    nativeClearInterval(intervalId);
  }

  function requestAnimationFrame(callback) {
    const frameId = nativeRequestAnimationFrame((timestamp) => {
      animationFrameIds.delete(frameId);
      callback(timestamp);
    });
    animationFrameIds.add(frameId);
    return frameId;
  }

  'use strict';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ===== STATE ===== */
  var typingDone = false;
  var launched = false;   // user has zoomed into the desktop
  var looping = false;

  /* ============================================
     TAB ROUTER (hash-based)
     ============================================ */
  var TABS = ['home', 'works', 'system'];
  var pillNav = document.getElementById('pillNav');
  var canvasFrame = document.getElementById('canvasFrame');
  var canvasLoaded = false;

  function currentTab() {
    var h = location.hash.replace('#', '');
    if (TABS.indexOf(h) >= 0) return h;
    if (location.pathname === '/products/' || location.pathname === '/products') return 'works';
    if (location.pathname === '/workbench/' || location.pathname === '/workbench') return 'system';
    return 'home';
  }

  function applyScrollLock() {
    // Scroll locked only on home tab before launch
    var lock = currentTab() === 'home' && !launched;
    document.documentElement.classList.toggle('scroll-unlocked', !lock);
  }

  function switchTab(tab) {
    TABS.forEach(function(t) {
      document.getElementById('page-' + t).classList.toggle('active', t === tab);
    });
    pillNav.querySelectorAll('a, button').forEach(function(item) {
      var itemTab = item.dataset.tab;
      if (!itemTab) {
        var path = new URL(item.getAttribute('href'), location.origin).pathname;
        itemTab = path === '/products/' ? 'works' : path === '/workbench/' ? 'system' : 'home';
      }
      var active = itemTab === tab;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    if (tab === 'system' && !canvasLoaded) {
      canvasFrame.src = canvasFrame.dataset.src;
      canvasLoaded = true;
    }
    // Force top: immediately and after layout settles (defeats scroll anchoring)
    window.scrollTo(0, 0);
    requestAnimationFrame(function() {
      window.scrollTo(0, 0);
      requestAnimationFrame(function() { window.scrollTo(0, 0); });
    });
    applyScrollLock();
  }

  pillNav.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (btn) location.hash = btn.dataset.tab;
  });
  window.addEventListener('hashchange', function() {
    switchTab(currentTab());
  });

  /* ============================================
     MENUBAR CLOCK
     ============================================ */
  var mbClock = document.getElementById('mbClock');
  function tickClock() {
    var d = new Date();
    mbClock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  tickClock();
  setInterval(tickClock, 30000);

  /* ============================================
     TERMINAL TYPING (first visit) / SKIP (return)
     ============================================ */
  var VISITED_KEY = 'hresh_visited';
  var isReturnVisitor = false;
  try { isReturnVisitor = !!localStorage.getItem(VISITED_KEY); } catch (e) {}

  var terminalData = [
    { type: 'cmd', prompt: '$ ', text: 'whoami' },
    { type: 'output', prefix: '> ', text: 'Hresh赫什' },
    { type: 'blank' },
    { type: 'cmd', prompt: '$ ', text: 'cat about.md' },
    { type: 'output', prefix: '> ', text: '用 AI 把想法做成产品的独立开发者' },
    { type: 'output', prefix: '  ', text: '从需求、设计到上线，持续实践产品' },
    { type: 'output', prefix: '  ', text: 'AI 开发 / 效率工具 / 产品冷启动' },
    { type: 'blank' },
    { type: 'cmd', prompt: '$ ', text: 'echo "1 person + AI = 1 team"' },
    { type: 'gold', prefix: '> ', text: '1 person + AI = 1 team' },
    { type: 'blank' },
    { type: 'cmd', prompt: '$ ', text: 'open hresh-workbench.app', cursor: true }
  ];

  var container = document.getElementById('terminalLines');
  var heroCta = document.getElementById('heroCta');

  function renderLine(item) {
    var div = document.createElement('div');
    div.className = 'term-line';
    if (item.type === 'blank') {
      div.innerHTML = '&nbsp;';
    } else if (item.type === 'cmd') {
      var html = '<span class="term-prompt">' + item.prompt + '</span><span class="term-cmd">' + item.text + '</span>';
      if (item.cursor) html += '<span class="cursor" id="mainCursor"></span>';
      div.innerHTML = html;
    } else if (item.type === 'output') {
      div.innerHTML = '<span class="term-output">' + item.prefix + item.text + '</span>';
    } else if (item.type === 'gold') {
      div.innerHTML = '<span class="term-gold">' + item.prefix + item.text + '</span>';
    }
    container.appendChild(div);
    return div;
  }

  function finishIntro() {
    typingDone = true;
    heroCta.classList.add('visible');
    pillNav.classList.remove('hidden-during-intro');
    try { localStorage.setItem(VISITED_KEY, '1'); } catch (e) {}
  }

  if (currentTab() !== 'home') {
    terminalData.forEach(function(item) { renderLine(item).classList.add('visible'); });
    finishIntro();
  } else if (isReturnVisitor) {
    // Return visitor: terminal shows instantly (no typing), then auto zoom into desktop
    terminalData.forEach(function(item) { renderLine(item).classList.add('visible'); });
    finishIntro();
    setTimeout(launch, 700);
  } else {
    // First visit: full line-by-line typing intro
    var divs = [];
    var lineDelay = 0;
    terminalData.forEach(function(item) {
      var div = renderLine(item);
      if (item.type === 'blank') { lineDelay += 200; }
      else if (item.type === 'cmd') { lineDelay += 400; div.style.animationDelay = lineDelay + 'ms'; lineDelay += 600; }
      else if (item.type === 'output') { lineDelay += 150; div.style.animationDelay = lineDelay + 'ms'; lineDelay += 300; }
      else if (item.type === 'gold') { lineDelay += 150; div.style.animationDelay = lineDelay + 'ms'; lineDelay += 400; }
      div.style.animationDelay = (parseFloat(div.style.animationDelay || '0') * 0.22) + 'ms';
      divs.push(div);
      setTimeout(function() { div.classList.add('visible'); }, 50);
    });

    var typingTimeout = setTimeout(finishIntro, lineDelay * 0.22 + 200);

    var skipTyping = function() {
      if (typingDone) return;
      clearTimeout(typingTimeout);
      divs.forEach(function(d) { d.style.animationDelay = '0ms'; d.classList.add('visible'); });
      finishIntro();
    };

    document.getElementById('heroSection').addEventListener('click', function() {
      if (!typingDone) skipTyping();
    });
    document.addEventListener('keydown', function(e) {
      if (!typingDone && e.key !== 'Enter') skipTyping();
    });
  }

  /* ============================================
     LAUNCH: terminal → progress bar → ZOOM INTO SCREEN
     ============================================ */
  function launch() {
    if (launched || !typingDone || currentTab() !== 'home') return;
    launched = true; // guard re-entry; desktop unlocks after zoom

    heroCta.classList.remove('visible');
    heroCta.classList.add('hidden');

    var cursorEl = document.getElementById('mainCursor');
    if (cursorEl) cursorEl.remove();

    var launchLine = document.createElement('div');
    launchLine.className = 'term-line';
    launchLine.innerHTML = '<span class="term-output">> launching...</span>';
    container.appendChild(launchLine);
    setTimeout(function() { launchLine.classList.add('visible'); }, 50);

    var progressLine = document.createElement('div');
    progressLine.className = 'term-line';
    progressLine.innerHTML = '<span class="term-progress"><span class="term-progress-track"><span class="term-progress-fill" id="progressFill"></span></span><span id="progressText">0%</span></span>';
    container.appendChild(progressLine);
    setTimeout(function() { progressLine.classList.add('visible'); }, 300);

    var progress = 0;
    var barLength = 12;
    setTimeout(function() {
      var progressText = document.getElementById('progressText');
      var progressFill = document.getElementById('progressFill');
      var interval = setInterval(function() {
        progress += 1;
        if (progress > barLength) {
          clearInterval(interval);
          beginZoom();
          return;
        }
        var pct = Math.round((progress / barLength) * 100);
        if (progressText) progressText.textContent = pct + '%';
        if (progressFill) progressFill.style.width = pct + '%';
      }, 80);
    }, 500);
  }

  function beginZoom() {
    var wrapper = document.getElementById('macbookWrapper');
    var screen = document.getElementById('macbookScreen');
    var terminal = document.getElementById('terminal');
    var overlay = document.getElementById('transitionOverlay');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.getElementById('heroSection').style.display = 'none';
      document.getElementById('desktop').classList.add('entered');
      applyScrollLock();
      window.scrollTo(0, 0);
      if (characterStory) characterStory.prime();
      return;
    }

    var screenRect = screen.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var scale = Math.max(vw / screenRect.width, vh / screenRect.height) * 1.05;

    var screenCenterX = screenRect.left + screenRect.width / 2;
    var screenCenterY = screenRect.top + screenRect.height / 2;
    var wrapperRect = wrapper.getBoundingClientRect();
    var wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;
    var wrapperCenterY = wrapperRect.top + wrapperRect.height / 2;
    var offsetX = screenCenterX - wrapperCenterX;
    var offsetY = screenCenterY - wrapperCenterY;
    var tx = vw / 2 - (wrapperCenterX + offsetX * scale);
    var ty = vh / 2 - (wrapperCenterY + offsetY * scale);

    setTimeout(function() { terminal.classList.add('scale-through'); }, 200);

    wrapper.classList.add('zoom-transition');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        wrapper.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')';
      });
    });

    setTimeout(function() { overlay.classList.add('active'); }, 1200);

    setTimeout(function() {
      // While covered: hide hero, land on desktop top
      document.getElementById('heroSection').style.display = 'none';
      applyScrollLock();
      window.scrollTo(0, 0);
      setTimeout(function() {
        overlay.classList.remove('active');
        document.getElementById('desktop').classList.add('entered');
        if (characterStory) characterStory.prime();
      }, 250);
    }, 1800);
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !launched && currentTab() === 'home') {
      if (!typingDone && skipTyping) skipTyping();
      launch();
    }
  });
  document.getElementById('introSkip').addEventListener('click', function() {
    if (!typingDone && skipTyping) skipTyping();
    launch();
  });
  document.getElementById('macbookBezel').addEventListener('click', function() {
    if (typingDone) launch();
  });
  heroCta.addEventListener('click', launch);

  /* ============================================
     DESKTOP WINDOW MANAGER
     ============================================ */
  var surface = document.getElementById('desktopSurface');
  var winZ = 100;
  var openCount = 0;

  function addResize(win) {
    var handle = document.createElement('div');
    handle.className = 'os-resize';
    win.appendChild(handle);
    handle.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var startX = e.clientX, startY = e.clientY;
      var startW = win.offsetWidth, startH = win.offsetHeight;
      var iframes = win.querySelectorAll('iframe');
      iframes.forEach(function(f) { f.style.pointerEvents = 'none'; });
      function onMove(ev) {
        var newW = Math.max(280, startW + ev.clientX - startX);
        var newH = Math.max(200, startH + ev.clientY - startY);
        win.style.width = newW + 'px';
        win.style.height = newH + 'px';
      }
      function onUp() {
        iframes.forEach(function(f) { f.style.pointerEvents = ''; });
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  }

  function templateWindow(tpl) {
    return tpl.content ? tpl.content.firstElementChild : tpl.firstElementChild;
  }

  function openWindow(tplId) {
    // If already open, bring to front
    var existing = surface.querySelector('.os-window[data-from="' + tplId + '"]');
    if (existing) { existing.style.zIndex = ++winZ; return; }

    var tpl = document.getElementById(tplId);
    if (!tpl) return;
    var sourceWindow = templateWindow(tpl);
    if (!sourceWindow) return;
    var win = sourceWindow.cloneNode(true);
    win.dataset.from = tplId;

    // Build chrome: macOS traffic lights + invisible drag bar
    var dragbar = document.createElement('div');
    dragbar.className = 'os-dragbar';
    win.insertBefore(dragbar, win.firstChild);

    var traffic = document.createElement('div');
    traffic.className = 'os-traffic';
    traffic.innerHTML = '<span class="tl-close"></span><span class="tl-min"></span><span class="tl-max"></span>';
    win.insertBefore(traffic, win.firstChild);

    var closeBtn = traffic.querySelector('.tl-close');

    // Center local windows in the usable desktop area, leaving the right-side
    // icon shelf clear, then cascade subsequent windows from that position.
    var isSmall = window.innerWidth <= 768;
    var offset = (openCount % 5) * (isSmall ? 16 : 36);
    win.style.zIndex = ++winZ;
    openCount++;

    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      win.remove();
    });

    // Bring to front on any press
    win.addEventListener('pointerdown', function() { win.style.zIndex = ++winZ; });

    // Drag by dragbar
    dragbar.addEventListener('pointerdown', function(e) {
      if (e.target === closeBtn) return;
      e.preventDefault();
      var startX = e.clientX, startY = e.clientY;
      var origX = win.offsetLeft, origY = win.offsetTop;
      function onMove(ev) {
        win.style.left = (origX + ev.clientX - startX) + 'px';
        win.style.top = (origY + ev.clientY - startY) + 'px';
      }
      function onUp() {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });

    // "open works" style jump buttons
    win.querySelectorAll('[data-goto]').forEach(function(btn) {
      btn.addEventListener('click', function() { location.hash = btn.dataset.goto; });
    });

    addResize(win);
    surface.appendChild(win);

    var surfW = surface.clientWidth || window.innerWidth;
    var surfH = surface.clientHeight || window.innerHeight;
    var winW = win.offsetWidth;
    var winH = win.offsetHeight;
    var rightShelf = isSmall ? 12 : 190;
    var usableW = Math.max(320, surfW - rightShelf);
    var baseX = isSmall ? 12 : Math.max(24, (usableW - winW) / 2);
    var baseY = isSmall ? 60 : Math.max(60, (surfH - winH) / 2 - 40);
    win.style.left = Math.max(8, baseX + offset) + 'px';
    win.style.top = Math.max(8, baseY + offset) + 'px';
  }

  function openIframeWindow(url, title) {
    // If already open, bring to front
    var existing = surface.querySelector('.os-window[data-href-src="' + url + '"]');
    if (existing) { existing.style.zIndex = ++winZ; return; }

    var win = document.createElement('div');
    win.className = 'os-window';
    win.dataset.hrefSrc = url;

    var dragbar = document.createElement('div');
    dragbar.className = 'os-dragbar';
    win.appendChild(dragbar);

    var traffic = document.createElement('div');
    traffic.className = 'os-traffic';
    traffic.innerHTML = '<span class="tl-close"></span><span class="tl-min"></span><span class="tl-max"></span>';
    win.appendChild(traffic);

    var body = document.createElement('div');
    body.className = 'os-body os-body-iframe';
    var iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:0 0 10px 10px;overscroll-behavior:contain;';
    body.appendChild(iframe);
    win.appendChild(body);

    var isSmall = window.innerWidth <= 768;
    var surfW = surface.offsetWidth || window.innerWidth;
    var surfH = surface.offsetHeight || window.innerHeight;
    var winW = Math.min(700, surfW * 0.88);
    var winH = Math.min(520, surfH * 0.75);
    win.style.width = winW + 'px';
    win.style.height = winH + 'px';
    var offset = (openCount % 5) * (isSmall ? 16 : 30);
    win.style.left = Math.max(8, (surfW - winW) / 2 + offset) + 'px';
    win.style.top = Math.max(8, (surfH - winH) / 2 - 20 + offset) + 'px';
    win.style.zIndex = ++winZ;
    openCount++;

    traffic.querySelector('.tl-close').addEventListener('click', function(e) {
      e.stopPropagation();
      win.remove();
    });
    win.addEventListener('pointerdown', function() { win.style.zIndex = ++winZ; });
    dragbar.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      var startX = e.clientX, startY = e.clientY;
      var origX = win.offsetLeft, origY = win.offsetTop;
      function onMove(ev) {
        win.style.left = (origX + ev.clientX - startX) + 'px';
        win.style.top = (origY + ev.clientY - startY) + 'px';
      }
      function onUp() {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });

    // External open button (top-right)
    var extBtn = document.createElement('div');
    extBtn.className = 'os-external';
    extBtn.title = '在新窗口打开';
    extBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
    extBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      window.open(url, '_blank', 'noopener,noreferrer');
    });
    win.appendChild(extBtn);

    addResize(win);
    surface.appendChild(win);
  }

  function openLinkDossier(url, title, category, summary, actionLabel) {
    var existing = Array.from(surface.querySelectorAll('.os-window[data-link-dossier]')).find(function(windowEl) {
      return windowEl.dataset.linkDossier === url;
    });
    if (existing) { existing.style.zIndex = ++winZ; existing.focus(); return; }

    var win = document.createElement('section');
    win.className = 'os-window os-link-dossier';
    win.dataset.linkDossier = url;
    win.tabIndex = -1;

    var dragbar = document.createElement('div');
    dragbar.className = 'os-dragbar';
    var traffic = document.createElement('div');
    traffic.className = 'os-traffic';
    traffic.innerHTML = '<button class="tl-close" type="button" aria-label="关闭窗口"></button>';
    var body = document.createElement('div');
    body.className = 'os-body link-dossier-body';
    var kicker = document.createElement('p');
    kicker.className = 'link-dossier-kicker';
    kicker.textContent = category || 'PUBLIC LINK';
    var heading = document.createElement('h2');
    heading.textContent = title;
    var description = document.createElement('p');
    description.className = 'link-dossier-summary';
    description.textContent = summary || '这是一个公开入口。你可以先在这里了解它，再在新标签页继续访问。';
    var notice = document.createElement('p');
    notice.className = 'link-dossier-notice';
    notice.textContent = '将在新标签页打开，不会中断当前的浏览位置。';
    var action = document.createElement('a');
    action.className = 'win-link link-dossier-action';
    action.href = url;
    action.target = '_blank';
    action.rel = 'noreferrer';
    action.textContent = (actionLabel || '打开入口') + ' ↗';
    body.append(kicker, heading, description, action, notice);
    win.append(dragbar, traffic, body);

    var isSmall = window.innerWidth <= 768;
    var surfW = surface.offsetWidth || window.innerWidth;
    var surfH = surface.offsetHeight || window.innerHeight;
    var winW = Math.min(480, surfW * 0.9);
    win.style.width = winW + 'px';
    win.style.left = Math.max(8, (surfW - winW) / 2 + (openCount % 3) * 24) + 'px';
    win.style.top = Math.max(8, (surfH - 320) / 2 + (isSmall ? 0 : (openCount % 3) * 20)) + 'px';
    win.style.zIndex = ++winZ;
    openCount++;

    traffic.querySelector('.tl-close').addEventListener('click', function(e) { e.stopPropagation(); win.remove(); });
    win.addEventListener('pointerdown', function() { win.style.zIndex = ++winZ; });
    dragbar.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      var startX = e.clientX, startY = e.clientY, origX = win.offsetLeft, origY = win.offsetTop;
      function onMove(ev) { win.style.left = (origX + ev.clientX - startX) + 'px'; win.style.top = (origY + ev.clientY - startY) + 'px'; }
      function onUp() { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); }
      document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp);
    });
    addResize(win);
    surface.appendChild(win);
    win.focus();
  }

  // A portfolio is explored with one click. Dragging was removed because it made the primary action ambiguous, especially on touch screens.
  surface.querySelectorAll('.dicon').forEach(function(icon) {
    icon.addEventListener('click', function() {
      if (icon.dataset.goto) {
        location.hash = icon.dataset.goto;
      } else if (icon.dataset.href) {
        openLinkDossier(icon.dataset.href, icon.querySelector('.dicon-label').textContent, icon.dataset.category, icon.dataset.summary, icon.dataset.actionLabel);
      } else if (icon.dataset.win) {
        openWindow(icon.dataset.win);
      }
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    var windows = surface.querySelectorAll('.os-window');
    var topWindow = Array.from(windows).sort(function(a, b) { return Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0); })[0];
    if (topWindow) topWindow.remove();
  });

  /* ============================================
     CHARACTER STORY: a small call-and-response between Hresh and the corgi.
     ============================================ */
  var characterStory = (function() {
    var person = surface.querySelector('[data-character="person"]');
    var corgi = surface.querySelector('[data-character="corgi"]');
    var greetingTrigger = surface.querySelector('[data-character-trigger]');
    var greetingLabel = greetingTrigger && greetingTrigger.querySelector('.character-greeting-label');
    var personImage = document.getElementById('desktopCharacterPerson');
    var corgiImage = document.getElementById('desktopCharacterCorgi');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var personFrames = {
      idle: '/optimized/hresh-person-idle.png',
      wave: '/optimized/hresh-person-wave.png',
      return: '/optimized/hresh-person-return.png',
      greet: '/optimized/hresh-person-greet.png'
    };
    var corgiFrames = {
      sit: '/optimized/hresh-corgi-sit.png',
      arrive: '/optimized/hresh-corgi-arrive.png',
      run: [
        '/optimized/hresh-corgi-run-1.png',
        '/optimized/hresh-corgi-run-2.png',
        '/optimized/hresh-corgi-run-3.png'
      ]
    };
    var state = 'idle'; // idle | running | settled | returning
    var paused = false;
    var frameId = null;
    var cycleStartedAt = 0;
    var pausedElapsed = 0;
    var corgiStart = null;
    var corgiTarget = null;
    var sceneOrigin = null;
    var returnStart = null;
    var armed = true;
    var hoverTimer = null;

    if (!person || !corgi || !personImage || !corgiImage || !greetingTrigger || !greetingLabel) return null;

    function setFrame(image, source) {
      if (image.getAttribute('src') !== source) image.setAttribute('src', source);
    }

    function setStoryPhase(phase) {
      if (phase) surface.dataset.characterStory = phase;
      else delete surface.dataset.characterStory;
      person.classList.toggle('is-idle', phase === 'idle');
      person.classList.toggle('is-calling', phase === 'calling');
      person.classList.toggle('is-reuniting', phase === 'reunion');
      corgi.classList.toggle('is-idle', phase === 'idle');
      corgi.classList.toggle('is-alert', phase === 'alert');
      corgi.classList.toggle('is-running', phase === 'running');
      corgi.classList.toggle('is-reuniting', phase === 'reunion');
      corgi.classList.toggle('is-returning', phase === 'returning');
    }

    function updateGreetingTrigger(status) {
      var config = {
        idle: { label: '和我打个招呼', title: '点击和 Hresh 打个招呼', className: '' },
        calling: { label: '正在招呼…', title: '互动正在开始', className: 'is-playing' },
        running: { label: '柯基在赶来…', title: '柯基正在赶来', className: 'is-playing' },
        complete: { label: '送它回去', title: '让柯基回到出发位置', className: 'is-complete' },
        returning: { label: '正在归位…', title: '柯基正在回到出发位置', className: 'is-playing' }
      }[status];
      greetingLabel.textContent = config.label;
      greetingTrigger.title = config.title;
      greetingTrigger.disabled = status === 'calling' || status === 'running' || status === 'returning';
      greetingTrigger.classList.toggle('is-playing', config.className === 'is-playing');
      greetingTrigger.classList.toggle('is-complete', config.className === 'is-complete');
    }

    function positionInSurface(character) {
      var rect = character.getBoundingClientRect();
      var surfaceRect = surface.getBoundingClientRect();
      var maxX = Math.max(0, surfaceRect.width - rect.width);
      var maxY = Math.max(0, surfaceRect.height - rect.height);
      var x = rect.left - surfaceRect.left;
      var y = rect.top - surfaceRect.top;

      // Browser zoom and an orientation change can briefly report the prior viewport's
      // layout. Fall back to the active CSS inset, then keep the character on-screen.
      if (x < 0 || x > maxX) {
        var styles = window.getComputedStyle(character);
        var left = parseFloat(styles.left);
        var right = parseFloat(styles.right);
        x = !Number.isNaN(left) ? left : (!Number.isNaN(right) ? surfaceRect.width - right - rect.width : x);
      }
      if (y < 0 || y > maxY) {
        var top = parseFloat(window.getComputedStyle(character).top);
        var bottom = parseFloat(window.getComputedStyle(character).bottom);
        y = !Number.isNaN(top) ? top : (!Number.isNaN(bottom) ? surfaceRect.height - bottom - rect.height : y);
      }
      return { x: clamp(x, 0, maxX), y: clamp(y, 0, maxY) };
    }

    function freezeAtVisualPosition(character) {
      var position = positionInSurface(character);
      character.style.transform = 'none';
      character.style.right = 'auto';
      character.style.bottom = 'auto';
      character.style.left = position.x + 'px';
      character.style.top = position.y + 'px';
      return position;
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function getCorgiTarget() {
      var personRect = person.getBoundingClientRect();
      var corgiRect = corgi.getBoundingClientRect();
      var surfaceRect = surface.getBoundingClientRect();
      return {
        x: clamp(personRect.right - surfaceRect.left + 8, 0, surfaceRect.width - corgiRect.width),
        y: clamp(personRect.bottom - surfaceRect.top - corgiRect.height, 0, surfaceRect.height - corgiRect.height)
      };
    }

    function easeOutCubic(progress) {
      return 1 - Math.pow(1 - progress, 3);
    }

    function cancelPendingHover() {
      if (!hoverTimer) return;
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }

    function prime() {
      cancelPendingHover();
      state = 'idle';
      paused = false;
      pausedElapsed = 0;
      armed = true;
      if (frameId) nativeCancelAnimationFrame(frameId);
      frameId = null;
      person.style.cssText = '';
      corgi.style.cssText = '';
      corgi.style.opacity = '';
      corgi.classList.add('is-settled');
      sceneOrigin = null;
      returnStart = null;
      setFrame(personImage, personFrames.idle);
      setFrame(corgiImage, corgiFrames.sit);
      setStoryPhase('idle');
      updateGreetingTrigger('idle');
    }

    function begin(now) {
      if (state === 'running' || state === 'returning' || !armed || reducedMotion.matches) return;
      if (state === 'settled') {
        returnHome();
        return;
      }
      cancelPendingHover();
      armed = false;
      state = 'running';
      paused = false;
      cycleStartedAt = now || performance.now();
      sceneOrigin = {
        person: freezeAtVisualPosition(person),
        corgi: null
      };
      corgiStart = freezeAtVisualPosition(corgi);
      sceneOrigin.corgi = { x: corgiStart.x, y: corgiStart.y };
      corgiTarget = null;
      corgi.style.opacity = '';
      corgi.style.transform = 'none';
      corgi.classList.remove('is-settled');
      setFrame(personImage, personFrames.idle);
      setFrame(corgiImage, corgiFrames.sit);
      setStoryPhase('calling');
      updateGreetingTrigger('calling');
      frameId = requestAnimationFrame(paint);
    }

    function paint(now) {
      if (paused || state !== 'running') return;
      var elapsed = now - cycleStartedAt;

      if (elapsed < 650) {
        setStoryPhase('calling');
        setFrame(personImage, Math.floor(elapsed / 180) % 2 ? personFrames.wave : personFrames.return);
        setFrame(corgiImage, corgiFrames.sit);
        corgi.classList.add('is-settled');
        corgi.style.transform = 'none';
      } else if (elapsed < 1350) {
        setStoryPhase('alert');
        setFrame(personImage, personFrames.wave);
        setFrame(corgiImage, corgiFrames.sit);
        corgi.classList.add('is-settled');
      } else if (elapsed < 3300) {
        var runElapsed = elapsed - 1350;
        var progress = easeOutCubic(runElapsed / 1950);
        if (!corgiTarget) corgiTarget = getCorgiTarget();
        var offsetX = (corgiTarget.x - corgiStart.x) * progress;
        var hop = Math.sin(progress * Math.PI * 5) * Math.max(5, corgiStart.y * 0.012);
        var offsetY = (corgiTarget.y - corgiStart.y) * progress - hop;
        setStoryPhase('running');
        updateGreetingTrigger('running');
        setFrame(personImage, personFrames.return);
        setFrame(corgiImage, corgiFrames.run[Math.floor(runElapsed / 150) % corgiFrames.run.length]);
        corgi.classList.remove('is-settled');
        corgi.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';
      } else if (elapsed < 5200) {
        var finalX = corgiTarget.x - corgiStart.x;
        var finalY = corgiTarget.y - corgiStart.y;
        setStoryPhase('reunion');
        setFrame(personImage, personFrames.greet);
        setFrame(corgiImage, corgiFrames.arrive);
        corgi.classList.add('is-settled');
        corgi.style.transform = 'translate(' + finalX + 'px, ' + finalY + 'px)';
      } else {
        state = 'settled';
        armed = true;
        setStoryPhase('reunion');
        updateGreetingTrigger('complete');
        frameId = null;
        return;
      }

      frameId = requestAnimationFrame(paint);
    }

    function easeInOutCubic(progress) {
      return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }

    function returnHome(now) {
      if (state !== 'settled' || !sceneOrigin || reducedMotion.matches) return;
      state = 'returning';
      armed = false;
      paused = false;
      cycleStartedAt = now || performance.now();
      returnStart = freezeAtVisualPosition(corgi);
      freezeAtVisualPosition(person);
      corgi.classList.remove('is-settled');
      setStoryPhase('returning');
      updateGreetingTrigger('returning');
      frameId = requestAnimationFrame(paintReturn);
    }

    function paintReturn(now) {
      if (paused || state !== 'returning' || !sceneOrigin || !returnStart) return;
      var elapsed = now - cycleStartedAt;
      var progress = Math.min(1, elapsed / 1700);
      var eased = easeInOutCubic(progress);
      var offsetX = (sceneOrigin.corgi.x - returnStart.x) * eased;
      var hop = Math.sin(eased * Math.PI * 5) * Math.max(5, returnStart.y * 0.012);
      var offsetY = (sceneOrigin.corgi.y - returnStart.y) * eased - hop;

      setStoryPhase('returning');
      setFrame(personImage, personFrames.return);
      setFrame(corgiImage, corgiFrames.run[Math.floor(elapsed / 150) % corgiFrames.run.length]);
      corgi.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';

      if (progress < 1) {
        frameId = requestAnimationFrame(paintReturn);
        return;
      }

      person.style.left = sceneOrigin.person.x + 'px';
      person.style.top = sceneOrigin.person.y + 'px';
      corgi.style.left = sceneOrigin.corgi.x + 'px';
      corgi.style.top = sceneOrigin.corgi.y + 'px';
      corgi.style.transform = 'none';
      corgi.classList.add('is-settled');
      setFrame(personImage, personFrames.idle);
      setFrame(corgiImage, corgiFrames.sit);
      state = 'idle';
      armed = true;
      returnStart = null;
      sceneOrigin = null;
      setStoryPhase('idle');
      updateGreetingTrigger('idle');
      frameId = null;
    }

    greetingTrigger.addEventListener('click', function() {
      if (!reducedMotion.matches) begin();
    });

    return {
      prime: function() {
        if (!personImage.complete || !corgiImage.complete) {
          window.setTimeout(this.prime.bind(this), 100);
          return;
        }
        prime();
      },
      cancelPending: cancelPendingHover,
      pause: function() {
        if ((state !== 'running' && state !== 'returning') || paused) return;
        paused = true;
        pausedElapsed = performance.now() - cycleStartedAt;
        if (frameId) nativeCancelAnimationFrame(frameId);
        frameId = null;
        freezeAtVisualPosition(person);
        freezeAtVisualPosition(corgi);
      },
      resume: function() {
        if ((state !== 'running' && state !== 'returning') || !paused || reducedMotion.matches) return;
        paused = false;
        cycleStartedAt = performance.now() - pausedElapsed;
        if (state === 'returning') {
          returnStart = positionInSurface(corgi);
          frameId = requestAnimationFrame(paintReturn);
        } else {
          corgiStart = positionInSurface(corgi);
          corgiTarget = null;
          frameId = requestAnimationFrame(paint);
        }
      }
    };
  })();

  /* ============================================
     INDEPENDENT DRAGGABLE CHARACTERS
     ============================================ */
  surface.querySelectorAll('.desktop-character').forEach(function(character) {
    character.addEventListener('pointerdown', function(e) {
      if (e.button !== 0) return;
      // The greeting control travels with the person, but keeps its own click action.
      if (e.target.closest('[data-character-trigger]')) return;
      e.preventDefault();
      if (characterStory) characterStory.cancelPending();
      if (characterStory) characterStory.pause();

      var startX = e.clientX;
      var startY = e.clientY;
      var wasDragged = false;
      var characterRect = character.getBoundingClientRect();
      var surfaceRect = surface.getBoundingClientRect();
      var originX = characterRect.left - surfaceRect.left;
      var originY = characterRect.top - surfaceRect.top;
      var maxX = Math.max(0, surfaceRect.width - characterRect.width);
      var maxY = Math.max(0, surfaceRect.height - characterRect.height);

      // A dragged character owns its own left/top coordinates from this point on.
      character.style.transform = 'none';
      character.style.right = 'auto';
      character.style.bottom = 'auto';
      character.style.left = originX + 'px';
      character.style.top = originY + 'px';
      character.classList.add('is-dragging');

      function onMove(ev) {
        var nextX = Math.max(0, Math.min(maxX, originX + ev.clientX - startX));
        var nextY = Math.max(0, Math.min(maxY, originY + ev.clientY - startY));
        if (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4) {
          wasDragged = true;
          character.dataset.dragged = '1';
        }
        character.style.left = nextX + 'px';
        character.style.top = nextY + 'px';
      }

      function onUp() {
        character.classList.remove('is-dragging');
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        if (characterStory) characterStory.resume();
        if (wasDragged) window.setTimeout(function() { delete character.dataset.dragged; }, 300);
      }

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });
  });

  surface.addEventListener('click', function(e) {
    var closeAction = e.target.closest('[data-close-window]');
    if (closeAction) closeAction.closest('.os-window').remove();
    var windowAction = e.target.closest('[data-win]');
    if (windowAction && windowAction.closest('.os-window')) openWindow(windowAction.dataset.win);
  });

  // Folder icon dblclick → open iframe window on desktop
  surface.addEventListener('dblclick', function(e) {
    // Handle data-win (open template window)
    var fiWin = e.target.closest('.folder-icon[data-win]');
    if (fiWin) {
      openWindow(fiWin.dataset.win);
      return;
    }
    var fi = e.target.closest('.folder-icon[data-href]');
    if (!fi) return;
    var url = fi.dataset.href;
    var label = fi.querySelector('.folder-icon-label').textContent;
    openIframeWindow(url, label);
  });

  /* ============================================
     STAR WALLPAPER MOUSE INTERACTION
     ============================================ */
  (function() {
    var wpStars = surface.querySelectorAll('.wp-star');
    var mx = -9999, my = -9999;
    var radius = 130;
    var starFrame = null;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    surface.addEventListener('mousemove', function(e) {
      mx = e.clientX;
      my = e.clientY;
    });

    function updateStars() {
      if (document.hidden || currentTab() !== 'home' || reducedMotion.matches) {
        starFrame = null;
        return;
      }
      wpStars.forEach(function(star) {
        var rect = star.getBoundingClientRect();
        var sx = rect.left + rect.width / 2;
        var sy = rect.top + rect.height / 2;
        var dx = sx - mx;
        var dy = sy - my;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          var force = (1 - dist / radius) * 20;
          var angle = Math.atan2(dy, dx);
          var pushX = Math.cos(angle) * force;
          var pushY = Math.sin(angle) * force;
          var scale = 1 + (1 - dist / radius) * 0.4;
          star.style.setProperty('--push', 'translate(' + pushX + 'px, ' + pushY + 'px) scale(' + scale + ')');
          star.classList.add('disturbed');
        } else {
          star.style.setProperty('--push', 'translate(0, 0) scale(1)');
          star.classList.remove('disturbed');
        }
      });
      starFrame = requestAnimationFrame(updateStars);
    }
    function resumeStars() {
      if (!starFrame) starFrame = requestAnimationFrame(updateStars);
    }
    document.addEventListener('visibilitychange', resumeStars);
    window.addEventListener('hashchange', resumeStars);
    resumeStars();

    // Click to spawn a star
    surface.addEventListener('click', function(e) {
      // Don't spawn on icon/window interactions
      if (e.target.closest('.dicon, .os-window, .desktop-character, .desktop-intro, .character-greeting-trigger')) return;
      var star = document.createElement('span');
      star.className = 'click-star';
      star.textContent = '\u2726';
      var size = 6 + Math.random() * 10;
      star.style.fontSize = size + 'px';
      star.style.left = (e.clientX - size / 2) + 'px';
      star.style.top = (e.clientY - size / 2) + 'px';
      document.body.appendChild(star);
      setTimeout(function() { star.remove(); }, 750);
    });
  })();

  /* ============================================
     EXIT ZOOM-OUT (scroll-driven)
     ============================================ */
  var exitSection = document.getElementById('exitSection');
  var exitCanvasContent = document.getElementById('exitCanvasContent');
  var exitMacbook = document.getElementById('exitMacbook');
  var goodbyeScreen = document.getElementById('goodbyeScreen');
  var exitScreenEl = document.getElementById('exitScreen');
  var exitStickyEl = document.getElementById('exitSticky');

  var isMobile = window.innerWidth <= 768;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  var ticking = false;
  function onScroll() {
    if (!launched || looping || currentTab() !== 'home') return;
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(function() {
      ticking = false;

      var rect = exitSection.getBoundingClientRect();
      var sectionHeight = exitSection.offsetHeight;
      var vh = window.innerHeight;
      var scrolled = -rect.top;
      var scrollableDistance = sectionHeight - vh;
      if (scrollableDistance <= 0) return;

      var progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

      // Phase 1: the full-screen desktop scales down into a normal MacBook.
      var p1 = Math.min(1, progress / 0.5);
      var ep = easeInOutCubic(p1);
      exitMacbook.style.opacity = 1;
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var screenW = exitScreenEl.clientWidth || (isMobile ? 348 : 680);
      var screenH = exitScreenEl.clientHeight || (isMobile ? 260 : 440);
      var baseScale = Math.max(window.innerWidth / screenW, vh / screenH) * 1.05;
      var macScale = reducedMotion ? 1 : baseScale - (baseScale - 1) * ep;
      exitMacbook.style.transform = 'scale(' + macScale + ')';

      // Phase 2: reveal the goodbye terminal after the desktop has started shrinking.
      if (progress >= 0.3) {
        var p2 = Math.min(1, (progress - 0.3) / 0.3);
        goodbyeScreen.classList.add('visible');
        goodbyeScreen.style.opacity = reducedMotion ? 1 : easeInOutCubic(p2);
      } else {
        goodbyeScreen.classList.remove('visible');
        goodbyeScreen.style.opacity = 0;
      }

      // Phase 3: settle at the final terminal size.
      if (progress >= 0.6) {
        exitMacbook.style.transform = 'scale(1)';
        goodbyeScreen.style.opacity = 1;
        goodbyeScreen.classList.add('visible');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function() {
    isMobile = window.innerWidth <= 768;
    onScroll();
  });

  /* ============================================
     LOOP: Say Hi → terminal types → Enter → desktop
     ============================================ */
  function triggerLoop() {
    if (looping || !launched) return;
    looping = true;

    goodbyeScreen.style.transition = 'opacity 0.6s ease';
    goodbyeScreen.style.opacity = '0';
    exitScreenEl.style.transition = 'background 0.6s ease';
    exitScreenEl.style.background = 'var(--term-bg)';

    setTimeout(function() {
      var termArea = document.createElement('div');
      termArea.id = 'loopTerminal';
      termArea.className = 'terminal';
      termArea.style.cssText = 'position:absolute;inset:0;background:var(--term-bg);color:var(--night-text);z-index:10;';

      var titlebar = document.createElement('div');
      titlebar.className = 'terminal-titlebar';
      ['red','yellow','green'].forEach(function(c) {
        var dot = document.createElement('span');
        dot.className = 'terminal-dot ' + c;
        titlebar.appendChild(dot);
      });
      var titleText = document.createElement('span');
      titleText.className = 'terminal-title';
      titleText.textContent = 'hresh@workbench ~ zsh';
      titlebar.appendChild(titleText);
      termArea.appendChild(titlebar);

      var termLines = document.createElement('div');
      termArea.appendChild(termLines);
      exitScreenEl.appendChild(termArea);

      var lineDelay = 0;
      var loopTypingDone = false;
      var loopLaunched = false;

      terminalData.forEach(function(item) {
        var div = document.createElement('div');
        div.style.cssText = 'white-space:pre-wrap;opacity:0;transform:translateY(6px);transition:opacity 0.3s ease,transform 0.3s ease;';
        if (item.type === 'blank') { div.innerHTML = '&nbsp;'; lineDelay += 200; }
        else if (item.type === 'cmd') {
          var html = '<span class="term-prompt">' + item.prompt + '</span><span class="term-cmd">' + item.text + '</span>';
          if (item.cursor) html += '<span class="cursor" id="loopCursor"></span>';
          div.innerHTML = html;
          lineDelay += 400;
        } else if (item.type === 'output') {
          div.innerHTML = '<span class="term-output">' + item.prefix + item.text + '</span>';
          lineDelay += 150;
        } else if (item.type === 'gold') {
          div.innerHTML = '<span class="term-gold">' + item.prefix + item.text + '</span>';
          lineDelay += 150;
        }
        termLines.appendChild(div);
        (function(el, delay) {
          setTimeout(function() { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, delay);
        })(div, lineDelay);
        if (item.type === 'cmd') lineDelay += 600;
        else if (item.type === 'output') lineDelay += 300;
        else if (item.type === 'gold') lineDelay += 400;
      });

      setTimeout(function() {
        loopTypingDone = true;
        var hint = document.createElement('div');
        hint.style.cssText = 'text-align:center;margin-top:16px;font-size:11px;color:var(--night-muted);opacity:0;transition:opacity 0.5s ease;';
        hint.textContent = 'press enter to launch ↵';
        termLines.appendChild(hint);
        setTimeout(function() { hint.style.opacity = '1'; }, 100);
      }, lineDelay + 600);

      function skipLoopTyping() {
        if (loopTypingDone) return;
        loopTypingDone = true;
        termLines.querySelectorAll('div').forEach(function(l) {
          l.style.opacity = '1';
          l.style.transform = 'translateY(0)';
        });
      }

      function loopLaunch() {
        if (loopLaunched || !loopTypingDone) return;
        loopLaunched = true;

        var cursor = document.getElementById('loopCursor');
        if (cursor) cursor.remove();

        var launchLine = document.createElement('div');
        launchLine.style.cssText = 'white-space:pre-wrap;opacity:0;transition:opacity 0.3s ease;';
        launchLine.innerHTML = '<span class="term-prompt">> launching...</span>';
        termLines.appendChild(launchLine);
        setTimeout(function() { launchLine.style.opacity = '1'; }, 50);

        setTimeout(function() {
          var overlay = document.getElementById('transitionOverlay');
          overlay.classList.add('active');

          setTimeout(function() {
            if (termArea.parentNode) termArea.parentNode.removeChild(termArea);

            // Reset exit section state
            exitMacbook.style.transition = 'none';
            exitMacbook.style.transform = '';
            exitMacbook.style.opacity = '1';
            goodbyeScreen.classList.remove('visible');
            goodbyeScreen.style.opacity = '0';
            goodbyeScreen.style.transition = 'none';
            exitScreenEl.style.background = '';
            exitScreenEl.style.transition = 'none';
            exitCanvasContent.style.transform = '';
            exitCanvasContent.style.opacity = '1';
            exitCanvasContent.style.filter = '';

            // Land back on the desktop top
            window.scrollTo(0, 0);
            void document.body.offsetHeight;

            exitMacbook.style.transition = '';
            goodbyeScreen.style.transition = '';
            exitScreenEl.style.transition = '';

            setTimeout(function() {
              overlay.classList.remove('active');
              looping = false;
            }, 300);
          }, 400);
        }, 500);
      }

      function onLoopKey(e) {
        if (e.key === 'Enter') loopLaunch();
        else if (!loopTypingDone) skipLoopTyping();
      }
      function onLoopClick() {
        if (!loopTypingDone) { skipLoopTyping(); return; }
        loopLaunch();
      }
      document.addEventListener('keydown', onLoopKey);
      exitScreenEl.addEventListener('click', onLoopClick);

      var cleanupInterval = setInterval(function() {
        if (!looping) {
          document.removeEventListener('keydown', onLoopKey);
          exitScreenEl.removeEventListener('click', onLoopClick);
          clearInterval(cleanupInterval);
        }
      }, 500);
    }, 700);
  }

  document.getElementById('backToTopLink').addEventListener('click', function(e) {
    e.preventDefault();
    triggerLoop();
  });

  // Init
  switchTab(currentTab());

  return function disposeSite() {
    timeoutIds.forEach((timeoutId) => nativeClearTimeout(timeoutId));
    intervalIds.forEach((intervalId) => nativeClearInterval(intervalId));
    animationFrameIds.forEach((frameId) => nativeCancelAnimationFrame(frameId));
    listenerRecords.forEach(([target, type, listener, options]) => {
      originalRemoveEventListener.call(target, type, listener, options);
    });
    if (EventTarget.prototype.addEventListener !== originalAddEventListener) {
      EventTarget.prototype.addEventListener = originalAddEventListener;
    }
    hasInitialized = false;
  };
}

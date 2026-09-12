import { useState } from 'react';
import {
  desktopIcons,
  wallpaperStars,
  workflowColumns,
  portfolioProducts,
} from './homeData';

const wallpaperStarGlyphs = ['·', '·', '·', '·', '✦', '·', '·', '·'];

function DesktopIcon({ icon }) {
  return (
    <div className={`dicon${icon.featured ? ' is-featured' : ''}`} data-href={icon.href} data-win={icon.win} data-goto={icon.goto} style={icon.style}>
      <div className={icon.artClassName} data-ext={icon.extension}>
        {icon.kind && <IconGlyph kind={icon.kind} />}
        {icon.image && <img src={icon.image.src} alt={icon.image.alt} loading="lazy" />}
        {icon.birthday && <span className="birthday-icon-mark">B</span>}
      </div>
      {icon.featured && <span className="dicon-featured-mark">CORE</span>}
      <div className="dicon-label">{icon.label}</div>
    </div>
  );
}

function IconGlyph({ kind }) {
  const common = { viewBox: '0 0 48 48', 'aria-hidden': 'true', focusable: 'false' };
  const glyphs = {
    about: <><rect x="11" y="10" width="26" height="28" rx="4" /><circle cx="24" cy="20" r="4" /><path d="M17 32c1.8-4.6 12.2-4.6 14 0" /></>,
    works: <><rect x="9" y="14" width="22" height="24" rx="3" /><rect x="17" y="10" width="22" height="24" rx="3" /><path d="M22 18h11M22 23h8" /></>,
    log: <><rect x="11" y="9" width="26" height="30" rx="3" /><path d="M17 17h14M17 23h14M17 29h9" /><circle cx="14" cy="17" r="1" fill="currentColor" stroke="none" /></>,
    nature: <><path d="M13 31c10-1 18-8 21-19-10 1-18 8-21 19Z" /><path d="M13 35c5-7 10-12 18-16" /><circle cx="15" cy="15" r="2" /></>,
    readcover: <><path d="M10 12c5-2 10-1 14 2v22c-4-3-9-4-14-2Z" /><path d="M38 12c-5-2-10-1-14 2v22c4-3 9-4 14-2Z" /><path d="M17 17h5M31 17h-5" /></>,
    universe: <><circle cx="24" cy="24" r="5" /><circle cx="13" cy="14" r="3" /><circle cx="36" cy="13" r="2.5" /><circle cx="35" cy="35" r="3" /><path d="M17 17l3 3M28 20l6-5M28 28l5 5" /></>,
    zhihu: <><path d="M10 13h28v19H10z" /><path d="m15 19 4 4 5-6M27 27h6" /><path d="M16 36h16" /></>,
    bilibili: <><rect x="9" y="14" width="30" height="22" rx="6" /><path d="m18 10 4 4M30 10l-4 4" /><path d="m21 21 8 4-8 4Z" /></>,
    juejin: <><path d="m24 8 13 9-13 23-13-23Z" /><path d="m18 19 6-4 6 4-6 11Z" /><path d="M15 34h18" /></>,
    workspace: <><circle cx="24" cy="22" r="9" /><path d="M16 36c2-5 14-5 16 0" /><path d="M12 13h4M32 13h4" /></>,
  };
  return <svg className={`dicon-glyph glyph-${kind}`} {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{glyphs[kind] || glyphs.works}</svg>;
}

function FolderIcon({ href, win, extension, label }) {
  return (
    <div className="folder-icon" data-href={href} data-win={win}>
      <div className={`folder-icon-art file${extension === '.git' ? ' ext-git' : ' ext-html'}`} data-ext={extension}></div>
      <div className="folder-icon-label">{label}</div>
    </div>
  );
}

function WindowTemplates() {
  return (
    <>
      <div id="win-sayhi" className="window-template" style={{ display: 'none' }}>
        <div className="os-window" data-title="关于 Hresh赫什" data-url="hresh@workbench">
          <div className="os-body win-sayhi">
            <div className="sayhi-heading">Hresh赫什 ✨</div>
            <div className="sayhi-sub">用 AI 把想法做成产品的独立开发者</div>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">🧰</div>
                <div className="service-title">独立产品</div>
                <div className="service-desc">效率工具 / 内容工具 / 生活工具<br />从真实问题做到可用闭环</div>
              </div>
              <div className="service-card">
                <div className="service-icon">🔁</div>
                <div className="service-title">公开构建</div>
                <div className="service-desc">记录产品取舍 / 冷启动 / 反馈迭代<br />把做产品变成可复用案例</div>
              </div>
            </div>
            <div className="sayhi-links">
              <span>📦 <a href="#works">查看产品作品集</a></span>
              <span>🧭 <a href="#system">打开产品工作台</a></span>
            </div>
          </div>
        </div>
      </div>

      <div id="win-design-skill" className="window-template" style={{ display: 'none' }}>
        <div className="os-window" data-title="产品方法" data-url="hresh@workbench" style={{ width: '380px' }}>
          <div className="os-body win-folder">
            <FolderIcon href="#works" extension=".html" label="产品作品集" />
            <FolderIcon href="https://www.readcover.cn" extension=".html" label="ReadCover" />
            <FolderIcon href="https://www.tongliaouniverse.cn" extension=".html" label="通辽宇宙知识库" />
            <FolderIcon href="https://www.yunyanhua.top" extension=".html" label="云上花火" />
            <FolderIcon href="#system" extension=".git" label="公开构建记录" />
          </div>
        </div>
      </div>

      <div id="win-website-history" className="window-template" style={{ display: 'none' }}>
        <div className="os-window" data-title="构建日志 · 通辽宇宙" data-url="hresh@workbench" style={{ width: 'min(430px, 88vw)' }}>
          <div className="os-body tlu-log">
            <div className="tlu-log-kicker">BUILD LOG / 400+ DAYS</div>
            <h2>通辽宇宙更新档案</h2>
            <p>从资料回查工具，到持续生长的内容网络；每一轮更新都记录问题、反馈和最终落地。</p>
            <div className="tlu-log-list">
              <div><b>01</b><span>内容网络重构</span><small>地图、人物、历史、组织与视频串联</small></div>
              <div><b>02</b><span>反馈驱动迭代</span><small>催更、梗反馈与进展页面</small></div>
              <div><b>03</b><span>资料与体验补全</span><small>视频、热评、配乐与互动玩法</small></div>
            </div>
            <a className="win-link" href="https://www.zhihu.com/people/hao-an-kang" target="_blank" rel="noreferrer">在知乎阅读更新记录 ↗</a>
          </div>
        </div>
      </div>

      <div id="win-tongliao" className="window-template" style={{ display: 'none' }}>
        <div className="os-window" data-title="通辽宇宙 · 核心产品" data-url="tongliaouniverse.cn" style={{ width: 'min(560px, 88vw)' }}>
          <div className="os-body tlu-dossier">
            <div className="tlu-dossier-head">
              <span className="tlu-core-badge">CORE PRODUCT</span>
              <span className="tlu-runtime">ONLINE · 400+ DAYS</span>
            </div>
            <h2>通辽宇宙知识库</h2>
            <p className="tlu-lead">把小约翰可汗视频里零散、难回查的国家、人物、历史、组织与梗，重新织成一张可以持续逛下去的内容网络。</p>
            <div className="tlu-principles">
              <div><b>回查</b><span>从一句梗、一个人或一段历史，找回它来自哪里。</span></div>
              <div><b>串联</b><span>让地图、人物、视频和时代背景沿着线索继续展开。</span></div>
              <div><b>共建</b><span>把真实反馈公开跟进，让内容和体验一起慢慢长出来。</span></div>
            </div>
            <div className="tlu-dossier-foot">
              <a className="win-link" href="https://www.tongliaouniverse.cn/" target="_blank" rel="noreferrer">打开核心产品 ↗</a>
              <button className="tlu-log-link" data-win="win-website-history">查看构建日志 →</button>
            </div>
          </div>
        </div>
      </div>

      <div id="win-ver3-cola" className="window-template" style={{ display: 'none' }}>
        <div className="os-window" data-title="⚠️" data-url="" style={{ width: '340px' }}>
          <div className="os-body" style={{ padding: '36px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '20px' }}>⚠️</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a', marginBottom: '10px' }}>无法打开 "Ver 3"</div>
            <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.7, marginBottom: '24px' }}>因为你已经在 Ver 3 里面了。<br />请勿套娃🙅</div>
            <div data-close-window style={{ display: 'inline-block', background: '#2B7FD8', color: '#fff', padding: '8px 28px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>好吧，我知道了</div>
          </div>
        </div>
      </div>

      <div id="win-cola" className="window-template" style={{ display: 'none' }}>
        <div className="os-window cola-window" data-title="产品工作台" data-url="Hresh赫什">
          <div className="os-body" style={{ padding: 0, maxHeight: 'none', height: '100%', overflow: 'hidden' }}>
            <div className="cola-inner">
              <div className="cola-sidebar">
                <div className="cola-sidebar-avatar"><img src="hresh-avatar-transparent.png" alt="Hresh赫什" loading="lazy" /></div>
                <div className="cola-sidebar-mic">
                  <svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                </div>
              </div>
              <div className="cola-main">
                <div className="cola-topbar">
                  <span className="cola-tab active">对话</span><span className="cola-tab">交付</span><span className="cola-tab">闹钟</span><span className="cola-tab">心迹</span><span className="cola-tab">接入</span>
                </div>
                <div className="cola-search">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" fill="none" stroke="#aaa" strokeWidth="2" /><path d="M21 21l-4.35-4.35" fill="none" stroke="#aaa" strokeWidth="2" /></svg>
                  <span>搜索聊天记录...</span>
                </div>
                <div className="cola-chat">
                  <div className="cola-msg-user"><div className="cola-bubble">Hresh赫什，跟来看我产品的人打个招呼吧</div></div>
                  <div className="cola-msg-bot">
                    <div className="cola-bot-avatar"><img src="hresh-avatar-transparent.png" alt="Hresh赫什" loading="lazy" /></div>
                    <div className="cola-bot-content"><div className="cola-mutter">开始自我介绍。</div><div>你好，我是 Hresh赫什。<br /><br />我用 AI 把想法做成 iOS、网页、浏览器扩展和微信小程序，也记录从需求、设计到上线的真实过程。<br /><br />你可以从作品集里挑一个产品，看看它解决了什么麻烦、为什么这样设计，以及我从反馈里改了什么。<br /><br />我不保证每次都做对，但会把过程留下来。</div></div>
                  </div>
                  <div className="cola-msg-user"><div className="cola-bubble">先这样，带我去看看作品集。</div></div>
                  <div className="cola-msg-bot">
                    <div className="cola-bot-avatar"><img src="hresh-avatar-transparent.png" alt="Hresh赫什" loading="lazy" /></div>
                    <div className="cola-bot-content"><div className="cola-mutter">收到，先看作品。</div><div>随时回来继续逛。</div></div>
                  </div>
                </div>
                <div className="cola-input-bar">
                  <div className="cola-input-container">
                    <div className="cola-input-text">输入消息...</div>
                    <div className="cola-input-toolbar">
                      <div className="cola-toolbar-left">
                        <svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M16 12v1a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" /></svg>
                      </div>
                      <div className="cola-toolbar-right"><span className="cola-model-tag">Max</span><div className="cola-send-btn"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" /></svg></div></div>
                    </div>
                    <div className="cola-coming-soon"><a href="#works" style={{ color: 'inherit', textDecoration: 'none' }}>产品目录 - 持续构建中 ✨</a></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function HomeTab() {
  return (
    <main className="tab-page active" id="page-home" aria-labelledby="site-heading">
      <header className="semantic-summary">
        <h1 id="site-heading">Hresh赫什：用 AI 把想法做成产品</h1>
        <p>Hresh赫什是一名独立开发者，从需求、设计到上线实践产品，持续分享 AI 开发、效率工具与产品冷启动。</p>
        <nav aria-label="网站主要内容">
          <a href="#works">Hresh赫什产品矩阵</a>
          <a href="#works">独立产品作品集</a>
          <a href="#system">产品工作台</a>
          <a href="https://www.tongliaouniverse.cn">通辽宇宙知识库</a>
          <a href="https://www.readcover.cn">ReadCover 阅读掩护</a>
        </nav>
      </header>
      <section className="hero-section" id="heroSection">
        <button className="intro-skip" id="introSkip" type="button">进入工作舱 <span aria-hidden="true">↗</span></button>
        <div className="macbook-wrapper" id="macbookWrapper">
          <div className="macbook-screen-bezel" id="macbookBezel">
            <div className="macbook-notch"></div>
            <div className="macbook-screen" id="macbookScreen"><div className="terminal" id="terminal"><div className="terminal-titlebar"><span className="terminal-dot red"></span><span className="terminal-dot yellow"></span><span className="terminal-dot green"></span><span className="terminal-title">hresh@workbench ~ zsh</span></div><div id="terminalLines"></div></div></div>
          </div>
          <div className="macbook-hinge"></div><div className="macbook-base"></div><div className="macbook-shadow"></div>
        </div>
        <div className="hero-cta" id="heroCta"><div className="cta-text">Press Enter to Launch</div><div className="cta-arrow">↓</div></div>
      </section>

      <div className="desktop" id="desktop">
        <div className="desktop-menubar"><span className="mb-logo">Hresh OS</span><span className="mb-item">About</span><span className="mb-item">Values</span><span className="mb-item">Now</span><span className="mb-clock" id="mbClock">--:--</span></div>
        <div className="desktop-surface" id="desktopSurface">
          <div className="desktop-intro">
            <p className="desktop-eyebrow">INDEPENDENT DEVELOPER / AI BUILDER</p>
            <h1>Hresh<span>赫什</span><span className="identity-dot" aria-hidden="true">.</span></h1>
            <p className="desktop-tagline">用 AI 把想法做成产品。</p>
            <a className="desktop-works-link" href="#works">探索我的作品 <span aria-hidden="true">↗</span></a>
          </div>
          {wallpaperStars.map((style, index) => {
            const glyphIndex = index % wallpaperStarGlyphs.length;
            return <span key={index} className={`wp-star wp-star-${glyphIndex}`} style={style} aria-hidden="true">{wallpaperStarGlyphs[glyphIndex]}</span>;
          })}
          <div className="desktop-character desktop-character-person" data-character="person" role="img" aria-label="Hresh赫什正在向柯基招手">
            <img id="desktopCharacterPerson" src="/hresh-animation-person-idle.png" alt="" loading="eager" />
          </div>
          <div className="desktop-character desktop-character-corgi is-settled" data-character="corgi" role="img" aria-label="Hresh赫什的三色柯基">
            <img id="desktopCharacterCorgi" src="/hresh-animation-corgi-sit.png" alt="" loading="eager" />
          </div>
          <div className="desktop-icons">{desktopIcons.map((icon) => <DesktopIcon key={icon.label} icon={icon} />)}</div>
          <WindowTemplates />
        </div>
      </div>

      <section className="exit-section" id="exitSection">
        <div className="exit-sticky" id="exitSticky">
          <div className="exit-canvas-content" id="exitCanvasContent" style={{ display: 'none' }}></div>
          <div className="exit-macbook-wrapper" id="exitMacbook" style={{ opacity: 1 }}>
            <div className="exit-bezel" id="exitBezel"><div className="exit-notch"></div><div className="exit-screen" id="exitScreen"><div className="goodbye-screen" id="goodbyeScreen">
              <div className="goodbye-titlebar"><span className="terminal-dot red"></span><span className="terminal-dot yellow"></span><span className="terminal-dot green"></span><span className="goodbye-title-text">hresh@workbench ~ zsh</span></div>
              <div className="goodbye-body"><div className="goodbye-terminal">
                <div className="gt-line"><span className="gt-prompt">$ </span><span className="gt-cmd">echo "see you"</span></div><div className="gt-line gt-output">See you next time.</div><div className="gt-line">&nbsp;</div>
                <div className="gt-line"><span className="gt-prompt">$ </span><span className="gt-cmd">cat contact.md</span></div><div className="gt-line gt-output">📦 <a href="#works">查看产品作品集</a></div><div className="gt-line gt-output">🧭 <a href="#system">打开产品工作台</a></div><div className="gt-line">&nbsp;</div>
                <div className="gt-line"><span className="gt-prompt">$ </span><span className="gt-cmd">fortune</span></div><div className="gt-line gt-dim">“找到你喜欢的事，然后让它杀死你。” — Bukowski</div><div className="gt-line">&nbsp;</div>
                <div className="gt-line"><span className="gt-prompt">$ </span><span className="gt-cmd">exit</span></div><div className="gt-line gt-output"><span className="gt-gold">[Process completed]</span></div>
              </div></div>
              <div className="goodbye-footer">© 2026 Hresh赫什 · Built with AI &amp; attitude</div>
            </div></div></div>
            <div className="exit-hinge"></div><div className="exit-base"></div><div className="exit-shadow"></div>
          </div>
        </div>
        <div className="back-to-top"><a href="#" id="backToTopLink"><span className="back-arrow">↑</span>回到开始 · Back to Start</a></div>
      </section>
    </main>
  );
}

const accessLabels = {
  website: '访问网站',
  github: '查看源码',
  store: '前往商店',
  article: '阅读介绍',
};

const productScreenshots = {
  '儿童 3D 自然博物馆': '/works/nature-museum.png',
  '收链 / LinkBox': '/works/linkbox-store.png',
  '云锦人物志': '/works/yunjin-article.png',
  '通辽宇宙知识库': '/works/tongliao-universe.png',
  '亲友记 / KinKeep': '/works/kinkeep-store.png',
  TabNest: '/works/tabnest.png',
};

function ProductDossier({ product, index, onClose, onShowQr }) {
  const screenshot = productScreenshots[product.name];
  const highlights = product.highlights || ['产品结构待持续整理', '作品档案持续补全'];

  return <div className="product-dossier-overlay" role="presentation" onClick={onClose}>
    <section className="product-dossier" role="dialog" aria-modal="true" aria-labelledby="product-dossier-title" onClick={(event) => event.stopPropagation()}>
      <div className="product-dossier-topbar">
        <span>works / {String(index + 1).padStart(2, '0')}</span>
        <button className="product-dossier-close" type="button" aria-label="关闭作品详情" onClick={onClose}>×</button>
      </div>
      <div className="product-dossier-body">
        <div className="product-dossier-main">
          <p className="product-dossier-index">PRODUCT DOSSIER — {String(index + 1).padStart(2, '0')}</p>
          <h2 id="product-dossier-title">{product.name}</h2>
          <p className="product-dossier-category">{product.category}</p>
          <p className="product-dossier-description">{product.description}</p>
          <div className="product-dossier-actions">
            <ProductAccess product={product} onShowQr={onShowQr} />
            <span className="product-status">{product.status}</span>
          </div>
        </div>
        <div className={`product-dossier-media${screenshot ? ' has-screenshot' : ''}`}>
          {screenshot ? <img src={screenshot} alt={`${product.name} 的公开页面截图`} /> : product.visual ? <ProductVisual product={product} /> : <div className="product-dossier-placeholder"><span>LOCAL / ARCHIVE</span><strong>作品画面尚未公开</strong><small>保留产品信息与访问入口</small></div>}
          {screenshot && <span className="product-dossier-media-note">LIVE PAGE CAPTURE</span>}
        </div>
      </div>
      <div className="product-dossier-notes">
        <div><span>01 / 作品定位</span><p>{product.category}</p></div>
        <div><span>02 / 核心切面</span><ul>{highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></div>
        <div><span>03 / 交付状态</span><p>{product.status}</p></div>
      </div>
    </section>
  </div>;
}

function ProductAccess({ product, onShowQr }) {
  const links = product.links || [];
  const hasQr = Boolean(product.qr?.src);
  const hasPendingQr = Boolean(product.qr && !product.qr.src);

  if (!links.length && !hasQr && !hasPendingQr) {
    return <span className="product-link muted">链接整理中</span>;
  }

  return <div className="product-access">
    {links.map((link) => <a className={`product-link product-link-${link.type}`} href={link.href} target="_blank" rel="noreferrer" key={link.href}>{accessLabels[link.type] || '访问入口'} <span aria-hidden="true">↗</span></a>)}
    {hasQr && <button className="product-link product-link-qr" type="button" onClick={() => onShowQr(product)}><span aria-hidden="true">▦</span> 扫码打开</button>}
    {hasPendingQr && <span className="product-qr-pending"><span aria-hidden="true">▦</span> {product.qr.searchHint}</span>}
  </div>;
}

function WorksTab() {
  const [qrProduct, setQrProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <main className="tab-page" id="page-works">
      <div className="works-page">
        <div className="workflow-screen">
          <h1 className="workflow-headline">1 Person + AI = 1 Team</h1>
          <p className="workflow-subtitle">Hresh赫什 · 用 AI 把想法做成产品的独立开发者</p>
          <div className="workflow-columns">
            {workflowColumns.map((column) => <div className="workflow-col" key={column.title}><div className="workflow-col-title">{column.title}</div><div className="workflow-col-line"></div>{column.items.map(([label, description]) => <div className="workflow-item" key={label}><span className="workflow-item-label">{label}</span><span className="workflow-item-desc">{description}</span></div>)}</div>)}
          </div>
        </div>
        <div className="section-label" style={{ marginTop: '64px' }}>ls works/</div><h2 className="section-heading">作品集</h2>
        <div className="works-grid">
          {portfolioProducts.map((product, index) => <article className="work-dim" key={product.name}>
            {product.visual && <ProductVisual product={product} />}
            <div className="work-dim-content"><div className="dim-num">product_{String(index + 1).padStart(2, '0')}</div><h3>{product.name}</h3><div className="product-category">{product.category}</div><p className="dim-desc">{product.description}</p>
            {product.highlights && <ul className="product-highlights">{product.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>}
            <div className="product-footer"><span className="product-status">{product.status}</span><button className="product-detail-trigger" type="button" onClick={() => setSelectedProduct({ product, index })}>查看作品档案 <span aria-hidden="true">→</span></button></div></div>
          </article>)}
        </div>
        {selectedProduct && <ProductDossier product={selectedProduct.product} index={selectedProduct.index} onClose={() => setSelectedProduct(null)} onShowQr={setQrProduct} />}
        {qrProduct && <div className="product-qr-overlay" role="presentation" onClick={() => setQrProduct(null)}><section className="product-qr-dialog" role="dialog" aria-modal="true" aria-label={`${qrProduct.name} 小程序码`} onClick={(event) => event.stopPropagation()}><button className="product-qr-close" type="button" aria-label="关闭二维码" onClick={() => setQrProduct(null)}>×</button><div className="product-qr-title">{qrProduct.name}</div><img src={qrProduct.qr.src} alt={`${qrProduct.name} 小程序码`} /><p>微信扫码或长按识别</p></section></div>}
      </div>
    </main>
  );
}

function ProductVisual({ product }) {
  return <div className={`product-visual product-visual-${product.visual}`} aria-label={`${product.name} 功能预览`}>
    <div className="visual-topbar"><span></span><span></span><span></span><i>{product.visual === 'linkbox' ? 'linkbox.app' : product.visual === 'nature' ? 'naturemuseum.top' : 'workspace / local'}</i></div>
    <div className="visual-art">
      {product.visual === 'nature' && <><div className="nature-orb">✦</div><div className="nature-leaf leaf-one">⌁</div><div className="nature-leaf leaf-two">⌁</div><div className="nature-copy">今天，看一只<br />会发光的甲虫</div></>}
      {product.visual === 'readframe' && <><div className="frame-video">▶<span>00:13:26</span></div><div className="frame-lines"><b>00:13:26</b><i></i><i></i><i></i></div></>}
      {product.visual === 'comments' && <><div className="comment-filter">在此范围内检索 <b>⌕</b></div><div className="comment-row"><i></i><span>这段观点值得再核实</span></div><div className="comment-row"><i></i><span>已标记：争议线索</span></div></>}
      {product.visual === 'linkbox' && <><div className="phone-shell"><div className="phone-notch"></div><b>收链</b><div className="saved-link">新收录<br /><strong>值得晚点读的网页</strong></div><div className="phone-tabs">全部　未读　标签</div></div></>}
      {product.visual === 'readcover' && <><div className="cover-doc"><div className="doc-ruler"></div><b>项目周报</b><i></i><i></i><i></i><i></i><div className="cover-caret"></div></div><div className="cover-switch">保护模式　<span>ON</span></div></>}
    </div>
    <div className="visual-caption">{product.visualCaption}</div>
  </div>;
}

function SystemTab() {
  return <main className="tab-page" id="page-system"><div className="canvas-page"><iframe data-src="/whiteboard.html" id="canvasFrame" title="Hresh赫什的产品工作台"></iframe><div className="canvas-hint">Scroll 缩放 · Drag 移动画布</div></div></main>;
}

export default function HomePage() {
  return (
    <>
      <div className="transition-overlay" id="transitionOverlay"></div>
      <nav className="pill-nav hidden-during-intro" id="pillNav"><button data-tab="home" className="active"><span className="pill-num">01</span>主页</button><button data-tab="works"><span className="pill-num">02</span>产品</button><button data-tab="system"><span className="pill-num">03</span>工作台</button></nav>
      <HomeTab />
      <WorksTab />
      <SystemTab />
    </>
  );
}

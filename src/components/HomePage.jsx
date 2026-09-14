import { useState } from 'react';
import {
  desktopIcons,
  wallpaperStars,
  workflowColumns,
  portfolioProducts,
} from './homeData';

const wallpaperStarGlyphs = ['·', '·', '·', '·', '✦', '·', '·', '·'];
const publicPortfolioProducts = portfolioProducts.filter((product) => product.status !== '已完成 · 暂未上线');

function productExtension(product) {
  if (product.category.startsWith('Chrome')) return '.ext';
  if (product.category.startsWith('iOS')) return '.ios';
  if (product.category.startsWith('微信')) return '.mini';
  if (product.category.startsWith('桌面')) return '.app';
  return '.web';
}

function DesktopIcon({ icon }) {
  return (
    <button
      className={`dicon${icon.featured ? ' is-featured' : ''}`}
      type="button"
      data-href={icon.href}
      data-win={icon.win}
      data-goto={icon.goto}
      data-category={icon.category}
      data-summary={icon.summary}
      data-action-label={icon.actionLabel}
      aria-label={`打开${icon.label}`}
      style={icon.style}
    >
      <div className={icon.artClassName} data-ext={icon.extension}>
        {icon.kind && <IconGlyph kind={icon.kind} />}
        {icon.image && <img src={icon.image.src} alt={icon.image.alt} loading="lazy" />}
        {icon.birthday && <span className="birthday-icon-mark">B</span>}
      </div>
      <div className="dicon-label">{icon.label}</div>
    </button>
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
    design: <><path d="M24 9c8.3 0 15 5.7 15 13.4 0 5.4-3.9 7.1-7 6.4-2.2-.5-3.2.4-3.2 2.1 0 2.4-1.9 4.1-4.8 4.1-8.3 0-15-5.7-15-13S15.7 9 24 9Z" /><circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none" /><circle cx="22" cy="15.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="30" cy="16.5" r="1.5" fill="currentColor" stroke="none" /><path d="m31 32 8 8M35 32l4 8" /></>,
  };
  return <svg className={`dicon-glyph glyph-${kind}`} {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{glyphs[kind] || glyphs.works}</svg>;
}

function ProductIndexItem({ product }) {
  const href = product.links?.[0]?.href || '#works';
  const isInternal = href.startsWith('#');

  return (
    <a className="product-index-item" href={href} target={isInternal ? undefined : '_blank'} rel={isInternal ? undefined : 'noreferrer'}>
      <span className="product-index-thumb">
        {product.cover ? <img src={product.cover} alt="" loading="lazy" /> : <span>{productExtension(product)}</span>}
      </span>
      <span className="product-index-copy">
        <strong>{product.name}</strong>
        <span>{product.category}</span>
        <small>{product.status}</small>
      </span>
      <span className="product-index-arrow" aria-hidden="true">↗</span>
    </a>
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
        <div className="os-window" data-title="作品索引" data-url="hresh@workbench" style={{ width: 'min(680px, 92vw)' }}>
          <div className="os-body win-folder">
            <div className="folder-index-heading">
              <div><span>PUBLIC PRODUCTS</span><strong>{publicPortfolioProducts.length} 个已上线作品</strong></div>
              <a href="#works">查看完整档案 ↗</a>
            </div>
            {publicPortfolioProducts.map((product) => <ProductIndexItem key={product.name} product={product} />)}
          </div>
        </div>
      </div>

      <div id="win-design-skills" className="window-template" style={{ display: 'none' }}>
        <div className="os-window" data-title="设计 Skills" data-url="hresh@design-skills" style={{ width: 'min(640px, 92vw)' }}>
          <div className="os-body design-skills-window">
            <header className="design-skills-heading">
              <div className="design-skills-index"><span>SKILL LIBRARY</span><strong>02</strong></div>
              <h2>为中文内容，做两套会讲故事的配图语言。</h2>
            </header>
            <div className="design-skill-list">
              <article className="design-skill-row">
                <div className="design-skill-poster xiaocang-poster" aria-hidden="true">
                  <span>01</span>
                  <img src="/skill-characters/xiaocang-operator-thumb.png" alt="" />
                </div>
                <div className="design-skill-copy">
                  <div className="design-skill-meta">认知锚点 / 怪诞手绘 / 16:9</div>
                  <h3>小仓怪诞正文配图</h3>
                  <p>用小仓承担关键动作，把判断、流程、状态和隐喻变成白底手绘解释图。</p>
                </div>
                <a href="https://github.com/Acorn2/xiaocang-illustrations" target="_blank" rel="noreferrer" aria-label="在 GitHub 查看小仓怪诞正文配图">查看仓库 <span aria-hidden="true">↗</span></a>
              </article>
              <article className="design-skill-row">
                <div className="design-skill-poster erqi-poster" aria-hidden="true">
                  <span>02</span>
                  <img src="/skill-characters/erqi-box-helper-thumb.png" alt="" />
                </div>
                <div className="design-skill-copy">
                  <div className="design-skill-meta">行动角色 / 蜡笔手绘 / 16:9</div>
                  <h3>Hresh 二七正文配图</h3>
                  <p>让二七参与核心动作，以暖米白、蓝黄蜡笔线稿，讲清一个结构或观点。</p>
                </div>
                <a href="https://github.com/Acorn2/hresh-erqi-illustrations" target="_blank" rel="noreferrer" aria-label="在 GitHub 查看 Hresh 二七正文配图">查看仓库 <span aria-hidden="true">↗</span></a>
              </article>
            </div>
            <footer className="design-skills-foot">先提取文章的认知锚点，再规划 shot list，最后生成或编辑单张配图。</footer>
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
          <div className="desktop-character desktop-character-person" data-character="person" role="group" aria-label="Hresh赫什与柯基互动">
            <img id="desktopCharacterPerson" src="/optimized/hresh-person-idle.png" alt="" loading="lazy" />
            <button className="character-greeting-trigger" data-character-trigger type="button" aria-describedby="characterGreetingHint">
              <span className="character-greeting-label">和我打个招呼</span>
              <span className="character-greeting-arrow" aria-hidden="true">↗</span>
              <span className="character-greeting-hint" id="characterGreetingHint" role="tooltip">柯基会听见哦</span>
            </button>
          </div>
          <div className="desktop-character desktop-character-corgi is-settled" data-character="corgi" role="img" aria-label="Hresh赫什的三色柯基">
            <img id="desktopCharacterCorgi" src="/optimized/hresh-corgi-sit.png" alt="" loading="lazy" />
          </div>
          <div className="character-story-effects" aria-hidden="true">
            <span className="story-call-ring"></span>
            <span className="story-call-ray ray-one"></span>
            <span className="story-call-ray ray-two"></span>
            <span className="story-paw paw-one">●</span>
            <span className="story-paw paw-two">●</span>
            <span className="story-paw paw-three">●</span>
            <span className="story-spark spark-one">✦</span>
            <span className="story-spark spark-two">✦</span>
            <span className="story-heart">♥</span>
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
                <div className="gt-line"><span className="gt-prompt">$ </span><span className="gt-cmd">fortune</span></div><div className="gt-line gt-dim">“想要和得到，中间还有两个字，那就是要做到。你只有做到，才能得到。”</div><div className="gt-line">&nbsp;</div>
                <div className="gt-line"><span className="gt-prompt">$ </span><span className="gt-cmd">exit</span></div><div className="gt-line gt-output"><span className="gt-gold">[Process completed]</span></div>
              </div></div>
              <div className="goodbye-footer">
                <span>© 2026 Hresh赫什 · Built with AI &amp; attitude</span>
                <span aria-hidden="true"> · </span>
                <a href="https://github.com/esthersjw/esther-design-system" target="_blank" rel="noreferrer noopener">
                  参考 Esther Design System，已二次开发 ↗
                </a>
                <span aria-hidden="true"> · </span>
                <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer noopener">
                  CC BY-NC-SA 4.0 ↗
                </a>
              </div>
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

function ProductDossier({ product, index, onClose }) {
  const screenshot = productScreenshots[product.name];
  const highlights = product.highlights || ['产品结构待持续整理', '作品档案持续补全'];

  return <div className="product-dossier-overlay" role="presentation" onClick={onClose}>
    <section className="product-dossier" role="dialog" aria-modal="true" aria-labelledby="product-dossier-title" onClick={(event) => event.stopPropagation()}>
      <div className="product-dossier-topbar">
        <span>works / {String(index + 1).padStart(2, '0')}</span>
        <button className="product-dossier-close" type="button" aria-label="关闭作品详情" onClick={onClose}>×</button>
      </div>
      <div className="product-dossier-scroll">
        <div className="product-dossier-hero">
          <div className="product-dossier-main">
            <p className="product-dossier-index">PRODUCT DOSSIER — {String(index + 1).padStart(2, '0')}</p>
            <h2 id="product-dossier-title">{product.name}</h2>
            <p className="product-dossier-category">{product.category}</p>
            <p className="product-dossier-description">{product.description}</p>
            <div className="product-dossier-actions">
              <ProductAccess product={product} />
              <span className="product-status">{product.status}</span>
            </div>
            {product.qr?.src && <ProductInlineQr product={product} />}
          </div>
          <ProductCover product={product} className="product-dossier-artwork" />
        </div>
        <div className="product-dossier-notes">
          <div><span>01 / 产品定位</span><p>{product.category}</p></div>
          <div><span>02 / 核心能力</span><ul>{highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></div>
          <div><span>03 / 交付状态</span><p>{product.status}</p></div>
        </div>
        {screenshot && <section className="product-dossier-proof" aria-label={`${product.name} 的实际界面截图`}>
          <div className="product-dossier-proof-heading"><span>PRODUCT EVIDENCE</span><p>实际界面 / 公开页面截图</p></div>
          <div className="product-dossier-proof-media"><img src={screenshot} alt={`${product.name} 的公开页面截图`} /><span>LIVE PAGE CAPTURE</span></div>
        </section>}
      </div>
    </section>
  </div>;
}

function ProductInlineQr({ product }) {
  return <aside className="product-inline-qr" aria-label={`${product.name} 小程序码`}>
    <img src={product.qr.src} alt={`${product.name} 微信小程序码`} />
    <div><span>WECHAT MINI PROGRAM</span><strong>微信扫码打开</strong><small>{product.qr.searchHint || '长按识别小程序码'}</small></div>
  </aside>;
}

function ProductCover({ product, className = '' }) {
  if (!product.cover) return null;
  return <figure className={`product-cover ${className}`.trim()}>
    <img src={product.cover} alt={`${product.name} 功能插图`} loading="lazy" />
    {product.visualCaption && <figcaption>{product.visualCaption}</figcaption>}
  </figure>;
}

function ProductAccess({ product }) {
  const links = product.links || [];
  const hasPendingQr = Boolean(product.qr && !product.qr.src);

  if (!links.length && product.qr?.src) {
    return null;
  }

  if (!links.length && !hasPendingQr) {
    return <span className="product-link muted">链接整理中</span>;
  }

  return <div className="product-access">
    {links.map((link) => <a className={`product-link product-link-${link.type}`} href={link.href} target="_blank" rel="noreferrer" key={link.href}>{accessLabels[link.type] || '访问入口'} <span aria-hidden="true">↗</span></a>)}
    {hasPendingQr && <span className="product-qr-pending"><span aria-hidden="true">▦</span> {product.qr.searchHint}</span>}
  </div>;
}

function WorksTab() {
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
            <button className="product-card-cover" type="button" onClick={() => setSelectedProduct({ product, index })} aria-label={`查看${product.name}作品档案`}>
              <ProductCover product={product} />
              <span>打开档案 <b aria-hidden="true">↗</b></span>
            </button>
            <div className="work-dim-content"><div className="dim-num">product_{String(index + 1).padStart(2, '0')}</div><h3>{product.name}</h3><div className="product-category">{product.category}</div><p className="dim-desc">{product.description}</p>
            {product.highlights && <ul className="product-highlights">{product.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>}
            <div className="product-footer"><span className="product-status">{product.status}</span><button className="product-detail-trigger" type="button" onClick={() => setSelectedProduct({ product, index })}>查看作品档案 <span aria-hidden="true">→</span></button></div></div>
          </article>)}
        </div>
        {selectedProduct && <ProductDossier product={selectedProduct.product} index={selectedProduct.index} onClose={() => setSelectedProduct(null)} />}
      </div>
    </main>
  );
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

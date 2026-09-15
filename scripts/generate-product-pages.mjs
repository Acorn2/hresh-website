import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { portfolioProducts } from '../src/components/homeData.js';
import { productPages } from '../src/seo/productPages.js';

const siteUrl = 'https://www.hreshhao.com';
const outputRoot = resolve(process.cwd(), 'public', 'products');
const productByName = new Map(portfolioProducts.map((product) => [product.name, product]));

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function pageUrl(path) {
  return `${siteUrl}${path}`;
}

function primaryLink(product) {
  return product.links?.[0]?.href;
}

function renderProductPage(page, product) {
  const canonical = pageUrl(page.path);
  const image = `${siteUrl}${product.cover}`;
  const app = {
    '@type': page.applicationType,
    '@id': `${canonical}#app`,
    name: product.name,
    description: product.description,
    applicationCategory: product.category,
    operatingSystem: page.operatingSystem,
    image,
    url: primaryLink(product),
    isAccessibleForFree: true,
    author: { '@id': `${siteUrl}/#hresh` },
  };
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: page.description,
        inLanguage: 'zh-CN',
        about: { '@id': `${canonical}#app` },
      },
      app,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: '产品', item: `${siteUrl}/products/` },
          { '@type': 'ListItem', position: 3, name: product.name, item: canonical },
        ],
      },
    ],
  };
  const links = (product.links || []).map((link) => `<a class="button button-secondary" href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml({ website: '访问网站', store: '前往商店', github: '查看源码', article: '阅读介绍' }[link.type] || '访问入口')} <span aria-hidden="true">↗</span></a>`).join('');
  const faqHtml = page.faqs.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('');
  const capabilities = product.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const related = productPages.filter((item) => item.path !== page.path).map((item) => `<a href="${item.path}">${escapeHtml(item.productName)} <span aria-hidden="true">→</span></a>`).join('');

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta name="author" content="Hresh赫什" />
    <meta name="theme-color" content="#101115" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="zh-CN" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="zh_CN" />
    <meta property="og:site_name" content="Hresh赫什" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${escapeHtml(`${product.name} 功能插图`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${image}" />
    <script type="application/ld+json">${escapeJson(structuredData)}</script>
    <title>${escapeHtml(page.title)}</title>
    <link rel="icon" type="image/png" href="/optimized/hresh-favicon.png" />
    <link rel="stylesheet" href="/seo/product-page.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/">Hresh<span>赫什</span></a>
      <nav aria-label="主要导航"><a href="/">首页</a><a href="/products/">产品</a><a href="/workbench/">工作台</a></nav>
    </header>
    <main>
      <nav class="breadcrumb" aria-label="面包屑"><a href="/">首页</a><span>/</span><a href="/products/">产品</a><span>/</span><span aria-current="page">${escapeHtml(product.name)}</span></nav>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">${escapeHtml(product.category)}</p>
          <h1>${escapeHtml(product.name)}</h1>
          <p class="lede">${escapeHtml(product.description)}</p>
          <p class="audience"><strong>适合谁：</strong>${escapeHtml(page.audience)}</p>
          <div class="actions">${links}</div>
        </div>
        <figure><img src="${escapeHtml(product.cover)}" alt="${escapeHtml(`${product.name} 功能插图`)}" width="1440" height="900" fetchpriority="high" /><figcaption>${escapeHtml(product.visualCaption || product.category)}</figcaption></figure>
      </section>
      <section class="content-block" aria-labelledby="capabilities-heading"><p class="eyebrow">CORE CAPABILITIES</p><h2 id="capabilities-heading">这个产品如何工作</h2><ul class="capabilities">${capabilities}</ul></section>
      <section class="content-block faq" aria-labelledby="faq-heading"><p class="eyebrow">FAQ</p><h2 id="faq-heading">常见问题</h2>${faqHtml}</section>
      <section class="content-block related" aria-labelledby="related-heading"><p class="eyebrow">MORE PRODUCTS</p><h2 id="related-heading">继续探索</h2><div>${related}</div></section>
    </main>
    <footer>Hresh赫什 · 用 AI 把想法做成产品</footer>
  </body>
</html>`;
}

function renderWorkbenchPage() {
  const canonical = `${siteUrl}/workbench/`;
  const description = 'Hresh赫什的产品工作台：把独立开发中的想法、产品、反馈和下一步，整理为一张可持续更新的视觉化工作地图。';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: 'Hresh赫什产品工作台｜独立开发的想法与构建地图',
    description,
    inLanguage: 'zh-CN',
    author: { '@type': 'Person', '@id': `${siteUrl}/#hresh`, name: 'Hresh赫什', url: siteUrl },
  };
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="zh_CN" />
    <meta property="og:site_name" content="Hresh赫什" />
    <meta property="og:title" content="Hresh赫什产品工作台｜独立开发的想法与构建地图" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${siteUrl}/optimized/hresh-avatar-256.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Hresh赫什产品工作台｜独立开发的想法与构建地图" />
    <meta name="twitter:description" content="${description}" />
    <script type="application/ld+json">${escapeJson(structuredData)}</script>
    <title>Hresh赫什产品工作台｜独立开发的想法与构建地图</title>
    <link rel="icon" type="image/png" href="/optimized/hresh-favicon.png" />
    <style>
      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: #fff9ec;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      }

      iframe {
        display: block;
        width: 100%;
        height: 100dvh;
        border: 0;
      }

      .pill-nav {
        position: fixed;
        bottom: max(24px, env(safe-area-inset-bottom));
        left: 50%;
        z-index: 10;
        display: flex;
        gap: 4px;
        padding: 5px;
        border: 1px solid rgba(255, 249, 236, 0.16);
        border-radius: 999px;
        background: #17191d;
        box-shadow: 0 8px 32px rgba(33, 30, 26, 0.18);
        transform: translateX(-50%);
      }

      .pill-nav a {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 18px;
        border-radius: 999px;
        color: #9ca0a8;
        font-size: 13px;
        font-weight: 600;
        line-height: 1;
        text-decoration: none;
        white-space: nowrap;
      }

      .pill-nav a:hover,
      .pill-nav a:focus-visible {
        color: #f5f0e6;
      }

      .pill-nav a:focus-visible {
        outline: 2px solid #f5d84c;
        outline-offset: 3px;
      }

      .pill-nav a.active {
        background: #303338;
        color: #f5d84c;
      }

      .pill-num {
        margin-right: 5px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 10px;
        opacity: 0.75;
      }

      @media (max-width: 760px) {
        .pill-nav {
          bottom: max(12px, env(safe-area-inset-bottom));
          padding: 4px;
        }

        .pill-nav a {
          min-height: 44px;
          padding: 0 14px;
          font-size: 13px;
        }

        .pill-num {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <iframe src="/whiteboard.html" title="Hresh赫什的产品工作台"></iframe>
    <nav class="pill-nav" aria-label="主要导航">
      <a href="/"><span class="pill-num">01</span>主页</a>
      <a href="/products/"><span class="pill-num">02</span>产品</a>
      <a href="/workbench/" class="active" aria-current="page"><span class="pill-num">03</span>工作台</a>
    </nav>
  </body>
</html>`;
}

const items = productPages.map((page) => {
  const product = productByName.get(page.productName);
  if (!product) throw new Error(`No portfolio product found for ${page.productName}`);
  return { page, product };
});

await mkdir(outputRoot, { recursive: true });
await Promise.all(items.map(async ({ page, product }) => {
  const directory = resolve(process.cwd(), 'public', page.path.replace(/^\//, ''));
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'index.html'), renderProductPage(page, product));
}));
const workbenchDirectory = resolve(process.cwd(), 'public', 'workbench');
await mkdir(workbenchDirectory, { recursive: true });
await writeFile(resolve(workbenchDirectory, 'index.html'), renderWorkbenchPage());

console.log(`Generated ${items.length} product pages and the workbench page.`);

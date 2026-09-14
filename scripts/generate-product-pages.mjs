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

function renderIndexPage(items) {
  const cards = items.map(({ page, product }) => `<article><a href="${page.path}"><img src="${escapeHtml(product.cover)}" alt="${escapeHtml(`${product.name} 功能插图`)}" loading="lazy" width="1440" height="900" /><p>${escapeHtml(product.category)}</p><h2>${escapeHtml(product.name)}</h2><span>查看产品介绍 →</span></a></article>`).join('');
  const canonical = `${siteUrl}/products/`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonical}#collection`,
    url: canonical,
    name: 'Hresh赫什产品作品集',
    inLanguage: 'zh-CN',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map(({ page, product }, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.name,
        url: pageUrl(page.path),
      })),
    },
  };
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="Hresh赫什的公开产品索引：从网页、iOS 应用到 Chrome 扩展，持续把真实问题做成可用产品。" /><meta name="robots" content="index,follow" /><link rel="canonical" href="${canonical}" /><meta property="og:type" content="website" /><meta property="og:locale" content="zh_CN" /><meta property="og:title" content="产品作品集｜Hresh赫什" /><meta property="og:description" content="查看 Hresh赫什的公开产品与独立介绍。" /><meta property="og:url" content="${canonical}" /><script type="application/ld+json">${escapeJson(structuredData)}</script><title>产品作品集｜Hresh赫什</title><link rel="icon" type="image/png" href="/optimized/hresh-favicon.png" /><link rel="stylesheet" href="/seo/product-page.css" /></head><body><header class="site-header"><a class="brand" href="/">Hresh<span>赫什</span></a><nav aria-label="主要导航"><a href="/">首页</a><a href="/products/" aria-current="page">产品</a><a href="/workbench/">工作台</a></nav></header><main><section class="listing-hero"><p class="eyebrow">PRODUCT DIRECTORY</p><h1>把真实问题做成产品</h1><p>这里收录已经公开、并有独立介绍页面的产品。每个页面都解释它解决的问题、适用的人和实际入口。</p></section><section class="product-grid" aria-label="产品列表">${cards}</section></main><footer>Hresh赫什 · 用 AI 把想法做成产品</footer></body></html>`;
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
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="${description}" /><meta name="robots" content="index,follow" /><link rel="canonical" href="${canonical}" /><meta property="og:type" content="website" /><meta property="og:locale" content="zh_CN" /><meta property="og:site_name" content="Hresh赫什" /><meta property="og:title" content="Hresh赫什产品工作台｜独立开发的想法与构建地图" /><meta property="og:description" content="${description}" /><meta property="og:url" content="${canonical}" /><meta property="og:image" content="${siteUrl}/optimized/hresh-avatar-256.png" /><meta name="twitter:card" content="summary" /><meta name="twitter:title" content="Hresh赫什产品工作台｜独立开发的想法与构建地图" /><meta name="twitter:description" content="${description}" /><script type="application/ld+json">${escapeJson(structuredData)}</script><title>Hresh赫什产品工作台｜独立开发的想法与构建地图</title><link rel="icon" type="image/png" href="/optimized/hresh-favicon.png" /><link rel="stylesheet" href="/seo/product-page.css" /></head><body><header class="site-header"><a class="brand" href="/">Hresh<span>赫什</span></a><nav aria-label="主要导航"><a href="/">首页</a><a href="/products/">产品</a><a href="/workbench/" aria-current="page">工作台</a></nav></header><main><section class="workbench-hero"><p class="eyebrow">PRODUCT WORKBENCH</p><h1>产品工作台</h1><p>这是一张独立开发的工作地图：把正在验证的想法、已经上线的产品、用户反馈和下一步行动放在同一张画布上。它不是产品目录，而是 Hresh 公开构建过程中的动态工作现场。</p></section><section class="workbench-notes" aria-label="工作台阅读说明"><article><h2>从问题开始</h2><p>每张卡片先说明真实问题与当前假设，再决定是否值得投入开发。</p></article><article><h2>保留过程证据</h2><p>产品、反馈和待办保持关联，避免只留下结论而丢失做出判断的上下文。</p></article><article><h2>持续更新</h2><p>画布内容会随产品迭代变化；如需了解具体产品，请从产品目录进入独立介绍页。</p></article></section><section class="workbench-frame"><iframe src="/whiteboard.html" title="Hresh赫什的产品工作台" loading="lazy"></iframe></section></main><footer>Hresh赫什 · 用 AI 把想法做成产品</footer></body></html>`;
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
await writeFile(resolve(outputRoot, 'index.html'), renderIndexPage(items));
const workbenchDirectory = resolve(process.cwd(), 'public', 'workbench');
await mkdir(workbenchDirectory, { recursive: true });
await writeFile(resolve(workbenchDirectory, 'index.html'), renderWorkbenchPage());

console.log(`Generated ${items.length} product pages, the product index, and the workbench page.`);

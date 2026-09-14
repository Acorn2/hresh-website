// SEO direction approved on 2026-09-14: retain the interactive homepage while
// giving the highest-intent public products permanent, crawlable static URLs.
export const productPages = [
  {
    productName: '儿童 3D 自然博物馆',
    path: '/products/nature-museum/',
    title: '儿童 3D 自然博物馆｜亲子自然探索网站｜Hresh赫什',
    description: '儿童 3D 自然博物馆面向 3–10 岁儿童与陪伴者，用可旋转的 3D 模型、旁白和自然故事支持主动观察与亲子讨论。',
    audience: '适合想陪孩子从观察开始认识自然，而不想被闯关和排行榜打断的家庭。',
    applicationType: 'WebApplication',
    operatingSystem: 'Web',
    faqs: [
      ['适合多大的孩子？', '目前内容面向 3–10 岁儿童与陪伴者；更重要的是一起观察、提问和讨论。'],
      ['这是课程或闯关游戏吗？', '不是。它不设置排行、闯关或强制学习路线，而是让孩子从一个主题开始自由探索。'],
    ],
  },
  {
    productName: '收链 / LinkBox',
    path: '/products/linkbox/',
    title: '收链 LinkBox｜本地链接收纳与稍后整理工具｜Hresh赫什',
    description: '收链 LinkBox 是一款 iOS 本地链接收纳工具：从分享面板快速保存网页，再用标签、搜索、状态检测和去重慢慢整理。',
    audience: '适合收藏很多链接、却不想在保存当下就完成分类的人。',
    applicationType: 'MobileApplication',
    operatingSystem: 'iOS',
    faqs: [
      ['LinkBox 如何保存链接？', '可以从 Safari、Chrome 等应用的系统分享面板一键收链，再回到应用内慢慢整理。'],
      ['数据保存在哪里？', '产品资料说明中，链接数据默认保存在本机；敏感内容可在隐私模式下隐藏。'],
    ],
  },
  {
    productName: 'ReadCover / 阅读掩护',
    path: '/products/readcover/',
    title: 'ReadCover 阅读掩护｜本地离线隐蔽阅读工具｜Hresh赫什',
    description: 'ReadCover 是一款本地优先的隐蔽阅读工具，支持 TXT、EPUB、离线阅读进度、Word 风格界面、失焦保护与老板键。',
    audience: '适合在办公室、通勤或公共环境中，希望随时安全收起阅读内容的人。',
    applicationType: 'WebApplication',
    operatingSystem: 'Web',
    faqs: [
      ['ReadCover 支持哪些文件？', '当前产品支持 TXT 与 EPUB 阅读，并保存本地阅读进度。'],
      ['ReadCover 能离线使用吗？', '产品以本地阅读与离线 PWA 为设计方向，适合在网络不稳定的场景继续阅读。'],
    ],
  },
  {
    productName: '通辽宇宙知识库',
    path: '/products/tongliao-universe/',
    title: '通辽宇宙知识库｜小约翰可汗视频内容回查｜Hresh赫什',
    description: '通辽宇宙知识库把小约翰可汗视频中分散的国家、人物、历史、组织、梗、配乐和热评，整理为可持续探索的内容档案。',
    audience: '适合想从一句梗、一个人物或一段历史回查视频出处，并继续了解关联线索的观众。',
    applicationType: 'WebApplication',
    operatingSystem: 'Web',
    faqs: [
      ['通辽宇宙知识库能查什么？', '可以从地图、人物、历史、组织、语录或视频入口回查内容，并沿关联线索继续探索。'],
      ['它和视频本身是什么关系？', '这是面向视频内容的资料回查与关联探索工具，不替代原始视频及其创作者的表达。'],
    ],
  },
  {
    productName: 'TabNest',
    path: '/products/tabnest/',
    title: 'TabNest｜本地优先的 Chrome 新标签页工作台｜Hresh赫什',
    description: 'TabNest 将 Chrome 新标签页变为本地优先的工作台，可按域名或窗口管理标签、组织书签资料组合并恢复工作会话。',
    audience: '适合经常在浏览器里切换多个任务，希望保留当前工作现场的人。',
    applicationType: 'SoftwareApplication',
    operatingSystem: 'Chrome',
    faqs: [
      ['TabNest 解决什么问题？', '它将当前标签、阶段性书签、可重复启动的资料组合和长期入口分层安放，减少在多个任务间来回找资料。'],
      ['TabNest 的数据在哪里？', '产品按本地优先设计，资料说明中列出的标签、书签与会话信息均保存在浏览器本地。'],
    ],
  },
];

export const productPageByName = new Map(productPages.map((page) => [page.productName, page]));

export function getProductPage(productName) {
  return productPageByName.get(productName);
}

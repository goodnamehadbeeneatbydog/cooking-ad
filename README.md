# 柳钉鱼的工具屋 (Liudingyu's Tool House)

基于 Astro 的静态内容站，支持 Markdown 文章发布、GitHub 工具导航、Google AdSense 广告变现。

## 功能特性

- **Markdown 文章** - 直接写 `.md` 文件自动发布
- **自动分类** - 根据关键词自动归类文章
- **工具导航** - 自动抓取 GitHub 热门开源工具
- **广告系统** - Google AdSense 自动插入文章段落间
- **多语言** - 支持中文/英文双语
- **SEO 友好** - 静态 HTML 输出，搜索引擎优化
- **一键部署** - 推送 GitHub 自动触发 Vercel 部署

## 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env
# 编辑 .env 填入你的 Google AdSense 发布者ID
```

### 2. 写文章

在 `src/content/blog/` 目录下创建 `.md` 文件：

```markdown
---
title: "文章标题"
description: "文章描述，用于SEO"
pubDate: 2025-04-28
category: "AI工具"  # 可留空，系统自动分类
tags: ["ai", "chatgpt"]
lang: zh  # zh 或 en
---

正文内容支持 Markdown 语法...
```

### 3. 抓取 GitHub 工具

```bash
npm run fetch-tools
# 或指定语言
node scripts/fetch-github-tools.js --lang=zh
```

### 4. 本地预览

```bash
npm run dev
# 访问 http://localhost:4321
```

### 5. 部署

```bash
npm run deploy
```

这会：构建站点 → 推送到 GitHub → Vercel 自动部署

## 项目结构

```
src/
  content/
    blog/          # Markdown 文章
    tools/         # GitHub 工具数据 (JSON)
  components/
    AdSense.astro  # 广告组件
    Header.astro   # 导航头部
    Footer.astro   # 页脚
  layouts/
    Layout.astro   # 基础布局
  pages/
    [lang]/
      index.astro       # 首页
      blog/
        index.astro     # 文章列表
        [...slug].astro # 文章详情
      tools/
        index.astro     # 工具导航
  utils/
    classify.ts    # 自动分类算法
    i18n.ts        # 多语言工具
scripts/
  fetch-github-tools.js  # 抓取 GitHub 工具
  deploy.js              # 一键部署
```

## 广告配置

1. 注册 [Google AdSense](https://www.google.com/adsense/start/)
2. 在 AdSense 后台获取 **发布者ID** (格式: `ca-pub-xxxxxxxxxxxxxxxx`)
3. 填入 `.env` 文件的 `PUBLIC_GOOGLE_ADSENSE_CLIENT`
4. 在 AdSense 后台添加广告单元，记录 **广告位ID** (slot)
5. 广告位ID需要在代码中使用（见 `AdSense.astro` 组件的 slot 属性）

**注意**: AdSense 要求网站先上线且有内容才能审批，建议先发布10-20篇原创文章再申请。

## 域名配置 (Cloudflare + Vercel)

1. **Vercel 侧**: 项目 Settings → Domains → 添加你的域名
2. **Cloudflare 侧**: DNS 记录添加 CNAME 指向 `cname.vercel-dns.com`
3. Cloudflare SSL/TLS 模式设为 **Full (strict)**

## 自动化内容生成 (Skill)

推荐使用 `skill-creator` 创建自定义技能，实现：

```
运行技能 → 输入主题 → AI生成文章 → 自动保存MD → 构建部署
```

skill 可以调用项目的脚本：
- `node scripts/generate-post.js` (需自行实现AI生成逻辑)
- `npm run deploy`

## 技术栈

- [Astro](https://astro.build) - 静态站点生成器
- [Tailwind CSS](https://tailwindcss.com) - 样式 (通过 CDN)
- [Google AdSense](https://adsense.google.com) - 广告变现
- [Vercel](https://vercel.com) - 部署托管

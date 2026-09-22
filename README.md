# travel-page · 高加索三国行程页

2026 年 9 月 25 日至 10 月 7 日的三人行程单页：航班、真实国界地图、逐日安排、共享记账、每人一份的行前清单。

纯静态页面，没有任何构建步骤，也不需要联网（只有「联网更新汇率」按钮会请求一次公开汇率接口）。

## 目录

```
index.html      页面结构
styles.css      样式（含深色模式）
app.js          数据与全部交互逻辑
map-geo.js      地图底图数据（Natural Earth 1:50m 国界与海域，公有领域）
assets/hero.jpg 头图
backend/        三人同步用的后端（Cloudflare Worker，可选，只有 worker.js 一个文件）
```

## 本地打开

直接双击 `index.html` 即可。数据保存在浏览器本地（localStorage），换设备或清空浏览器数据会丢本机记录，可以用「记账 → 汇率与同步 → 导出 JSON」备份。

## 部署到 GitHub Pages

1. 在仓库页面点 **Add file → Upload files**，把本目录里的所有文件（含 `assets/` 和 `backend/`）拖进去，提交。
2. 仓库 **Settings → Pages**：Source 选 `Deploy from a branch`，Branch 选 `main`，目录选 `/ (root)`，保存。
3. 一两分钟后访问 `https://<用户名>.github.io/travel-page/`。

`.nojekyll` 已经放好，避免 GitHub 用 Jekyll 处理静态文件。

## 部署到 Cloudflare Pages（可拖拽，速度也更快）

Workers & Pages → Create → Pages → Upload assets → 拖入本目录（不需要 `backend/` 也可以）。

注意：Pages 的拖拽上传不支持 Functions，所以想要三人同步，仍需按 `backend/README.md` 建一个独立的 Worker。

## 三人同步（可选）

页面默认只把数据存在本机。要让三个人共用一份账和各自的清单，需要一个小后端：

1. 按 [backend/README.md](backend/README.md) 建一个 Cloudflare Worker + KV（都在 Cloudflare 后台点选，不用装工具）。
2. 在页面「记账 → 汇率与同步」里填 Worker 地址和约定好的行程码，三个人填同一个行程码。

同步内容包含记账流水、每人的清单勾选和参考汇率；冲突按更新时间取较新的一份。

## 数据来源

- 地图底图：Natural Earth 1:50m `admin_0_countries` 与海域数据（公有领域），裁剪后存入 `map-geo.js`。
- 头图：Bozzhyra Valley（Berik Aday，CC BY-SA 4.0，来自 Wikimedia Commons）。

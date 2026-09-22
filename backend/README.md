# 部署与三人同步说明

## 先明确一件事

页面本身是纯静态的（`index.html` / `styles.css` / `app.js` / `assets/hero.jpg`，合计约 360KB），上传到任何静态托管都能正常打开。

但**记账数据存在浏览器的 localStorage 里，只属于打开页面的那台设备**：三个人各自打开、各自记录，互相看不到对方的账。

所以：**只上传静态页面 ≠ 多人一起记账**，还需要一个很小的后端。

另外有个关键限制：**Cloudflare Pages 的「拖拽上传 / Direct Upload」不支持 Functions**（官方文档明确标注）。想让静态页和后端待在同一个 Pages 项目里，必须用 Wrangler 命令行或 Git 集成部署。因此推荐下面这条更省事的路线：静态页拖拽上传 + 一个独立的 Worker。

---

## 方案 A：全部在 Cloudflare 后台点选完成（推荐，不用装工具）

**1. 上传静态页**
Workers & Pages → Create → Pages → Upload assets → 把 `outputs/caucasus-2026` 这个文件夹拖进去（只拖这一个，不要带 backend 文件夹）。
部署完会得到一个地址，形如 `https://xxx.pages.dev`。

**2. 建一个 KV 命名空间**
Workers & Pages → KV → Create namespace，名字随意，例如 `caucasus-trips`。

**3. 建 Worker**
Workers & Pages → Create → Worker → 起名例如 `caucasus-ledger` → Deploy → Edit code → 把 `worker.js` 的全部内容粘贴进去 → Deploy。

**4. 绑定 KV**
进入这个 Worker → Settings → Bindings → Add → KV Namespace：

- Variable name 必须填 `TRIPS`（后端代码里就是按这个名字取的）
- KV namespace 选第 2 步建的那个

保存后再 Deploy 一次，绑定才会生效。

**5. 验证后端**
浏览器打开 `https://你的-worker.workers.dev/trips/test1234.json`，看到 `[]` 就说明通了。

**6. 页面里填写**
打开 Pages 上的页面 → 记账 → 「汇率与同步」页：

- 后端地址：`https://你的-worker.workers.dev`
- 行程码：三个人约定一个词，例如 `caucasus-2026`

点「保存并同步」。三个人填**完全一样**的行程码，就会看到同一份账。

---

## 如果更想用 Pages Functions（同域，前端连地址都不用填）

不需要另写一份代码：把 `worker.js` 里的处理逻辑原样搬进 `functions/trips/[[path]].js`，入口换成 Pages Functions 的写法即可——

```js
import worker from '../../worker.js';
export function onRequest(context) {
  return worker.fetch(context.request, context.env);
}
```

或者干脆把 `worker.js` 全文粘进 `functions/trips/[[path]].js`，把 `export default { async fetch(request, env) { ... } }` 改成 `export async function onRequest(context) { const { request, env } = context; ... }`。

之后用 `npx wrangler pages deploy .` 部署，并在 Pages 项目 → Settings → Functions → KV namespace bindings 里绑定 `TRIPS`。
这种方式下页面和接口同域，前端只要填行程码即可（后端地址留空会自动用当前域名）。

---

## 数据是怎么走的

后端存的是一份 JSON。新版格式：

```json
{
  "version": 2,
  "expenses": [ ... ],
  "checks": { "BOFAN": { "items": { "徒步装备::3": true }, "updatedAt": 1730000000000 } },
  "rates": { "KZT": 0.0145, "AZN": 4.2, "GEL": 2.65, "AMD": 0.0185, "RUB": 0.088, "USD": 7.1, "CNY": 1 },
  "ratesUpdatedAt": 1730000000000
}
```

- `expenses` 每条包含：`id`、日期、付款人、金额、货币、记录时汇率、说明、分摊人 / 分摊金额、`updatedAt`。
- `checks` **按人分开**：每个人只维护自己那份清单，互不覆盖。
- **写入**：每次新增、修改、删除、勾选清单或改汇率，都会先拉一次远端并合入本机，再整体写回，避免几个人同时操作时互相覆盖。
- **读取**：每 15 秒轮询一次；页面从后台切回前台时也会拉一次。
- **离线**：没网时不发请求，照常记账和勾选；恢复网络后自动合并并同步。
- **冲突**：记账按 `id` 取 `updatedAt` 较新的一条；清单按人取更新时间较新的一份；汇率同理。旧版只有一个数组的格式也能读。

## 免费额度

Workers 免费版每天 10 万次请求，KV 的免费额度也按天计算（读取十万量级、写入千次量级）。三个人一天记几十笔，完全用不到上限。

## 注意事项

- **行程码等于钥匙**：知道后端地址加行程码的人就能读写这份账，别用太短的词。
- KV 是最终一致的：三人几乎同时写入时，对方的改动可能几秒后才出现，等一次轮询或点一下「保存并同步」即可。
- 数据同时存在浏览器和 KV 里：清理浏览器数据会清掉本机副本（云端仍在，重新填一次行程码就会拉回来）。
- 建议出发前每人先用手机连一次，确认三台设备能看到同一份账。

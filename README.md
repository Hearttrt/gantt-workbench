# 项目交付排期与甘特图工作台 (Cloudflare Pages + KV 云端同步版)

本项目已内置 **Cloudflare KV 轻量键值存储** 前后端同步能力：
- `public/index.html`：单文件前端应用（含月历、甘特图、周工作台、交付清单、KV 云同步面板与本地缓存兜底）。
- `public/_worker.js`：Cloudflare Pages 内置 Worker 脚本（自动拦截 `/api/schedule` 读写 `SCHEDULE_KV`，支持**网页直接拖拽上传 `public` 文件夹**即刻启用后端 API！）。
- `functions/api/schedule.js`：标准 Cloudflare Pages Functions 路由文件（供 Git 仓库集成使用）。

---

## 三步完成 Cloudflare Pages + KV 云端部署（全程网页操作，零命令行）

### 第一步：创建 Cloudflare KV 命名空间
1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)；
2. 在左侧菜单进入 **Storage & Databases (或 Workers & Pages) -> KV**；
3. 点击右上角 **Create a namespace**，输入名称（例如 `project-schedule-kv`），点击 **Add** 完成创建。

### 第二步：上传部署 Pages 项目
1. 进入左侧 **Workers & Pages** -> 点击 **Create application** -> 切换到 **Pages** 标签页 -> 点击 **Upload assets**（直接上传资产）；
2. 输入项目名称（如 `project-delivery-calendar`）；
3. 将本压缩包解压后的 **`public` 文件夹**（里面包含 `index.html` 和 `_worker.js`）直接拖入上传框，点击 **Deploy site**。

### 第三步：绑定 `SCHEDULE_KV` 变量并生效
1. 在刚创建的 Pages 项目详情页，点击顶部 **Settings (设置)** -> 左侧选择 **Bindings (绑定)**（旧版界面在 **Functions -> KV namespace bindings**）；
2. 点击 **Add (添加)** -> 选择 **KV namespace**：
   - **Variable name (变量名)**：必须严格填写为 `SCHEDULE_KV`
   - **KV namespace**：下拉选择第一步创建的 `project-schedule-kv`
   - 点击 **Save** 保存；
3. **重要**：首次添加绑定后，需要重新触发一次部署才能注入环境变量——你可以再次进入 **Deployments** 上传一次 `public` 文件夹（或点击 **Retry deployment**）。
4. 打开你的 Pages 域名，页面顶部状态栏会变为绿色的 **「Cloudflare KV 已同步 (default)」**！

---

## 多团队 / 多项目空间隔离技巧
点击网页右上角的 **「KV 云同步」** 按钮，可以在弹窗中输入不同的**团队空间标识**（例如 `default`、`team-trade`、`team-app`），系统会在同一个 Cloudflare KV 库下按不同 Key 前缀自动隔离存储，无需重复部署多个网站。

# Railway 部署指南

## 修改内容

### 1. 过滤中文论文
所有 fetcher 现在会自动排除标题或摘要含中文字符的论文。

### 2. 邮件订阅功能
- 新增 `POST /api/subscribe` 接口接收订阅
- 每周一北京时间 09:00 自动发送论文周报
- 订阅者数据存储在 `data/subscribers.json`

---

## 部署步骤

### 方式一：通过 Railway Dashboard（推荐）

1. **登录 Railway**
   访问 https://railway.app 并登录

2. **进入项目**
   找到你的 `web-production-24cce` 项目

3. **连接 GitHub 仓库**
   - 将本地代码推送到 GitHub：
     ```bash
     cd /Users/apple/Desktop/Claude/TranslationPapersMiniApp
     git remote add origin <你的GitHub仓库URL>
     git push -u origin master
     ```
   - 在 Railway 项目设置中连接该 GitHub 仓库
   - 设置 Root Directory 为 `backend`

4. **配置环境变量**
   在 Railway 项目的 Variables 中添加：

   | 变量名 | 示例值 | 说明 |
   |--------|--------|------|
   | `SMTP_HOST` | `smtp.gmail.com` | SMTP 服务器地址 |
   | `SMTP_PORT` | `587` | SMTP 端口（587=TLS, 465=SSL） |
   | `SMTP_USER` | `your-email@gmail.com` | 发件邮箱 |
   | `SMTP_PASS` | `your-app-password` | 邮箱密码或应用专用密码 |
   | `FROM_EMAIL` | `Translation Papers <noreply@example.com>` | 发件人显示名称（可选） |

   **Gmail 用户注意**：需要生成应用专用密码
   https://myaccount.google.com/apppasswords

5. **部署**
   推送代码后 Railway 会自动部署，或手动点击 Deploy

---

### 方式二：通过 Railway CLI

1. **安装 Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **登录**
   ```bash
   railway login
   ```

3. **关联项目**
   ```bash
   cd /Users/apple/Desktop/Claude/TranslationPapersMiniApp/backend
   railway link
   ```
   选择你的项目 `web-production-24cce`

4. **设置环境变量**
   ```bash
   railway variables set SMTP_HOST=smtp.gmail.com
   railway variables set SMTP_PORT=587
   railway variables set SMTP_USER=your-email@gmail.com
   railway variables set SMTP_PASS=your-app-password
   railway variables set FROM_EMAIL="Translation Papers <noreply@example.com>"
   ```

5. **部署**
   ```bash
   railway up
   ```

---

## 测试 API

### 1. 测试订阅接口
```bash
curl -X POST https://web-production-24cce.up.railway.app/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

预期响应：
```json
{
  "success": true,
  "message": "Subscribed successfully",
  "total": 1
}
```

### 2. 查看论文列表
```bash
curl https://web-production-24cce.up.railway.app/api/papers
```

### 3. 手动触发更新
```bash
curl -X POST https://web-production-24cce.up.railway.app/api/update
```

---

## 定时任务说明

- **每周一 09:00 CST**：自动发送邮件周报给所有订阅者
- 邮件内容：最新 10 篇论文摘要 + 链接
- 时区：Asia/Shanghai（北京时间）

---

## 常见问题

### Q: 邮件发送失败？
A: 检查环境变量是否正确配置，特别是 `SMTP_PASS`。Gmail 用户需使用应用专用密码。

### Q: 如何查看订阅者列表？
A: 订阅者存储在 `data/subscribers.json`，可通过 Railway 的文件浏览器查看。

### Q: 如何测试邮件发送？
A: 可以手动调用 `scheduler.sendWeeklyEmail()` 或等待下周一 09:00。

### Q: 中文论文过滤规则？
A: 检测标题和摘要中的中文字符（Unicode 范围 U+4E00-U+9FFF, U+3400-U+4DBF），有中文则过滤。

---

## 文件结构

```
backend/
├── server.js           # Express 服务器 + /api/subscribe 接口
├── scheduler.js        # 定时任务 + 订阅者管理
├── emailService.js     # 邮件发送服务（新增）
├── aggregator.js       # 论文聚合
├── config.js           # 配置文件
├── package.json        # 依赖（已添加 nodemailer）
└── fetchers/
    ├── semanticScholar.js  # 已添加中文过滤
    ├── crossref.js         # 已添加中文过滤
    └── arxiv.js            # 已添加中文过滤
```

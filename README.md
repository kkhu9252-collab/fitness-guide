# 健身动作库

一个面向新手的健身房器械动作指导网页小软件。前台给普通用户查看动作教学，后台给管理员维护动作内容。

## 功能

- 手机优先的前台页面：训练部位、动作列表、搜索、动作详情。
- 20 个内置健身房器械动作，每个动作有对应 SVG 示意图。
- 动作详情包含目标肌群、器械设置、动作步骤、呼吸提示、常见错误和安全提醒。
- 后台管理页面支持登录、新增、编辑、删除、启用/隐藏动作。
- SQLite 本地数据库，适合先在本机演示和学习开发。

## 技术栈

- 前端：Vue 3 + Vite
- 后端：Node.js + Express
- 数据库：SQLite，使用 Node.js 自带 `node:sqlite`

## 项目结构

```text
fitness-guide/
  client/                         前端项目
    public/exercise-images/       动作示意图
    src/
      PublicApp.vue               前台页面
      AdminApp.vue                后台页面
      api.js                      前后端接口调用
  server/                         后端项目
    data/fitness.db               SQLite 数据库文件
    src/
      app.js                      API 路由
      db.js                       数据库初始化和种子数据
  scripts/
    dev.ps1                       本机开发启动脚本
    generate-exercise-images.mjs  生成动作 SVG 示意图
```

## 本机启动

当前电脑使用的 Node.js 在：

```powershell
D:\Tools\NodeJS\node-v24.17.0-win-x64
```

推荐启动方式：

```powershell
cd C:\Users\Administrator\Documents\ai学习\fitness-guide
.\scripts\dev.ps1
```

如果端口被占用，也可以分别启动：

```powershell
cd C:\Users\Administrator\Documents\ai学习\fitness-guide\server
D:\Tools\NodeJS\node-v24.17.0-win-x64\node.exe src\index.js
```

```powershell
cd C:\Users\Administrator\Documents\ai学习\fitness-guide\client
D:\Tools\NodeJS\node-v24.17.0-win-x64\node.exe ..\node_modules\vite\bin\vite.js --host 0.0.0.0 --port 5174
```

访问地址：

- 前台：`http://localhost:5174`
- 后台：`http://localhost:5174/admin`
- 后端健康检查：`http://localhost:3000/api/health`

## 默认后台账号

- 账号：`admin`
- 密码：`admin123`

第一次启动后，后端会自动创建数据库、管理员账号和 20 个动作数据。

以后正式上线前必须修改默认密码。可以通过设置环境变量 `ADMIN_PASSWORD` 后重新初始化数据库，或者后续增加“修改密码”功能。

## 数据和图片

- 数据库文件：`server/data/fitness.db`
- 动作图片：`client/public/exercise-images/*.svg`

后台的“图片地址”字段可以填写类似：

```text
/exercise-images/seated-chest-press.svg
```

后续如果换成真实照片，可以把图片放在 `client/public/exercise-images/`，再到后台修改对应动作的图片地址。

## 测试和构建

```powershell
cd C:\Users\Administrator\Documents\ai学习\fitness-guide
$env:PATH = "D:\Tools\NodeJS\node-v24.17.0-win-x64;$env:PATH"
npm test --workspace client
npm test --workspace server
npm run build --workspace client
```

当前已验证：

- 前端测试：6 个通过
- 后端测试：5 个通过
- 前端构建：通过
- 数据库：1 个管理员、20 个动作、0 个缺图片

## 后续上线准备

如果要让别人用手机通过公网访问，需要继续做这些事：

- 准备云服务器或托管平台。
- 设置正式管理员密码，不要使用 `admin123`。
- 配置域名和 HTTPS。
- 决定数据库备份方式，至少定期备份 `server/data/fitness.db`。
- 如果多人维护后台，需要增加管理员账号管理和更严格的登录会话。
- 如果上传真实图片，需要增加图片上传接口、文件大小限制和图片格式校验。

## Ubuntu VPS 上线

第一版推荐用 Ubuntu 22.04/24.04 云服务器，先用公网 IP 访问。

本机打包：

```powershell
cd C:\Users\Administrator\Documents\ai学习\fitness-guide
.\scripts\package-release.ps1
```

生成文件：

```text
release/fitness-guide-vps.zip
```

服务器初始化：

```bash
sudo bash deploy/setup-ubuntu.sh
```

部署前创建生产环境变量：

```bash
cd /var/www/fitness-guide
cp .env.production.example server/.env
nano server/.env
```

必须把 `ADMIN_PASSWORD` 改成强密码。第一次启动时会用这个密码创建管理员账号。

部署：

```bash
sudo bash deploy/deploy-on-server.sh
```

Nginx 配置文件在：

```text
deploy/nginx-fitness-guide.conf
```

它会让：

- `/` 访问前端构建产物
- `/admin` 访问后台页面
- `/api/` 反向代理到后端 `127.0.0.1:3000`

SQLite 备份脚本：

```bash
sudo bash deploy/backup-sqlite.sh
```

可以后续加到 `crontab` 每天执行一次。

## Vercel 临时托管

Vercel 适合先托管前台展示页。当前配置会在构建时导出静态动作数据到：

```text
client/public/data/catalog.json
```

然后前台在没有后端 API 时自动读取这份静态数据。

构建命令：

```bash
npm run build:vercel
```

Vercel 项目配置已经写在：

```text
vercel.json
```

在 Vercel 创建项目时使用这些设置：

- Framework Preset: `Vite`
- Install Command: `npm ci`
- Build Command: `npm run build:vercel`
- Output Directory: `client/dist`

限制：

- Vercel 临时托管只适合前台浏览动作库。
- 后台登录、新增、编辑、删除动作需要后端和数据库，不能只靠静态托管完成。
- 如果要让后台也在线可用，需要继续接云服务器，或把 SQLite 改成 Supabase、Neon、Vercel Postgres 等云数据库方案。

## 健身内容提醒

本项目内容用于普通健身动作学习，不替代医生、康复师或持证教练建议。训练时应从轻重量开始，有疼痛、疾病或伤病史时先咨询专业人士。

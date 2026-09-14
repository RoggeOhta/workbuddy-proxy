<p align="center">
  <img src="assets/icon.svg" width="104" height="104" alt="WorkBuddy Proxy icon" />
</p>

<h1 align="center">WorkBuddy Proxy</h1>

<p align="center"><a href="README.md">English</a> · <strong>简体中文</strong></p>

<p align="center">
  将 WorkBuddy AI 的免费模型，接到你习惯的客户端。
  <br />
  Bun + TypeScript · Docker · 本地 HTTPS · 流式输出
</p>

<p align="center">
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.3.11-18181B?style=flat-square&amp;logo=bun&amp;logoColor=white" alt="Bun 1.3.11" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="TypeScript 5.9" /></a>
  <a href="compose.yaml"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&amp;logo=docker&amp;logoColor=white" alt="Docker Compose" /></a>
  <a href="docs/guide.md#api-示例"><img src="https://img.shields.io/badge/API-Chat_Completions-277A57?style=flat-square" alt="Chat Completions API" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-277A57?style=flat-square" alt="MIT License" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/Runtime_dependencies-0-59636E?style=flat-square" alt="Zero third-party runtime dependencies" /></a>
</p>

## 快速开始

### AI 安装

```text
帮我安装 https://github.com/RoggeOhta/workbuddy-proxy，验证模型调用后给我连接信息。
```

### 手动安装

需要 Git、Docker Compose，以及已登录的 WorkBuddy AI。

```sh
git clone https://github.com/RoggeOhta/workbuddy-proxy.git
cd workbuddy-proxy
```

将 `.env.example` 复制为 `.env`，配置登录文件所在目录：

```dotenv
WORKBUDDY_AUTH_DIR=/path/to/auth-directory
```

目录需包含 `workbuddy-desktop-ai.info`。macOS 默认目录无需配置：

```text
~/Library/Application Support/CodeBuddyExtension/Data/Public/auth
```

Windows 使用 `C:/path/to/auth-directory` 格式。然后启动并读取代理密钥：

```sh
docker compose up -d --build
docker compose exec -T proxy cat /data/.api-key
```

## 客户端配置

| 字段 | 值 |
| --- | --- |
| 协议 | OpenAI Chat Completions |
| Base URL | `http://127.0.0.1:18081/v1` |
| API Key | 上一步输出的代理密钥 |
| 模型 | 点击“获取可用模型”选择 |

仅提供当前免费模型；支持流式输出、推理内容和工具调用。登录过期后需更新认证文件。

## 可选：本地域名

```sh
npm install -g portless
portless alias workbuddy 18081
portless proxy start
```

Base URL 改为 `https://workbuddy.localhost/v1`，密钥不变。

## 常用命令

```sh
docker compose ps                 # 状态
docker compose logs --tail=50     # 日志
git pull
docker compose up -d --build      # 更新
docker compose down              # 停止，保留密钥
```

## 更多

[配置与 API](docs/guide.md) · [开发](CONTRIBUTING.md) · [安全](SECURITY.md) · [MIT License](LICENSE)

非官方项目，适配 WorkBuddy AI 海外版。接口参考 [WorkBuddy2API](https://github.com/Tom6814/WorkBuddy2API)，运行时使用 [Bun](https://bun.sh)。

<p align="center">
  <img src="assets/icon.svg" width="104" height="104" alt="WorkBuddy Proxy icon" />
</p>

<h1 align="center">WorkBuddy Proxy</h1>

<p align="center"><strong>English</strong> · <a href="README.zh-CN.md">简体中文</a></p>

<p align="center">
  Use WorkBuddy AI’s free models in your favorite client.
  <br />
  Bun + TypeScript · Docker · Local HTTPS · Streaming
</p>

<p align="center">
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.3.11-18181B?style=flat-square&amp;logo=bun&amp;logoColor=white" alt="Bun 1.3.11" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="TypeScript 5.9" /></a>
  <a href="compose.yaml"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&amp;logo=docker&amp;logoColor=white" alt="Docker Compose" /></a>
  <a href="docs/guide.md#api-示例"><img src="https://img.shields.io/badge/API-Chat_Completions-277A57?style=flat-square" alt="Chat Completions API" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-277A57?style=flat-square" alt="MIT License" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/Runtime_dependencies-0-59636E?style=flat-square" alt="Zero third-party runtime dependencies" /></a>
</p>

## Quick start

### Let AI install it

```text
Install https://github.com/RoggeOhta/workbuddy-proxy for me, test a model call, and give me the connection details.
```

### Manual installation

You need Git, Docker Compose, and a signed-in WorkBuddy AI account.

```sh
git clone https://github.com/RoggeOhta/workbuddy-proxy.git
cd workbuddy-proxy
```

Copy `.env.example` to `.env` and set the directory containing your login file:

```dotenv
WORKBUDDY_AUTH_DIR=/path/to/auth-directory
```

The directory must contain `workbuddy-desktop-ai.info`. On macOS, you can leave the setting unchanged if you use the default directory:

```text
~/Library/Application Support/CodeBuddyExtension/Data/Public/auth
```

On Windows, use a path such as `C:/path/to/auth-directory`. Start the proxy and retrieve its API key:

```sh
docker compose up -d --build
docker compose exec -T proxy cat /data/.api-key
```

## Client setup

| Field | Value |
| --- | --- |
| Protocol | OpenAI Chat Completions |
| Base URL | `http://127.0.0.1:18081/v1` |
| API key | The proxy key from the previous step |
| Model | Fetch the available models and select one |

Only models currently listed as free are available. Streaming, reasoning content, and tool calls are supported. Update the login file when your session expires.

## Optional: local domain

```sh
npm install -g portless
portless alias workbuddy 18081
portless proxy start
```

Use `https://workbuddy.localhost/v1` as the Base URL. The API key stays the same.

## Common commands

```sh
docker compose ps                # Status
docker compose logs --tail=50     # Logs
git pull
docker compose up -d --build      # Update
docker compose down              # Stop, keeping the API key
```

## More

[Configuration & API (中文)](docs/guide.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [MIT License](LICENSE)

An unofficial project for the international version of WorkBuddy AI. API integration references [WorkBuddy2API](https://github.com/Tom6814/WorkBuddy2API). Powered by [Bun](https://bun.sh).

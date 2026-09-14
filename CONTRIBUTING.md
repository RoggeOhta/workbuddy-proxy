# Contributing

This is a private project. Keep changes small and testable.

1. Use Bun 1.3.11 or later and run `bun install --frozen-lockfile`.
2. Keep free-model selection and SSE decoding independent of I/O.
3. Add offline regression tests for protocol or policy changes.
4. Run `bun run typecheck`, `bun test`, and `docker build .` before submitting.

Do not commit `.api-key`, `.env`, WorkBuddy `.info` files, certificates, raw account responses, or conversation logs. Use synthetic fixtures. Live model calls are separate acceptance tests and must use your own authorized account.

PR descriptions should state the concrete behavior change, validation performed, and remaining limitations. Do not claim an endpoint is fully OpenAI-compatible based only on a simple text response.

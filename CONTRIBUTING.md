# Contributing to PanaStream

Thanks for your interest in contributing.

## How to contribute

1. **Fork the repo** on GitHub and clone your fork locally.
2. **Create a branch**: `git checkout -b feature/your-feature` or `fix/your-fix`.
3. **Make your changes** and test (`npm run dev`, run client + server).
4. **Do not commit secrets** — no `.env`, API keys, or credentials. Use `server/env.example` as a template.
5. **Commit with clear messages** and push to your fork, then open a **Pull Request**.

## Development setup

- Copy `server/env.example` to `server/.env` and set AWS credentials, S3 bucket, CloudFront domain, and `PANASTREAM_API_TOKEN` (run `node generate-token.js` for a token).
- Run `npm run install-all` then `npm run dev`.
- See [README](README.md) and [README-SECURITY](README-SECURITY.md) for API auth and deployment.

## Documentation

- [README](README.md) — Quick start, AWS setup, usage.
- [README-SECURITY](README-SECURITY.md) — API token and security.
- [docs/ARCHITECTURE](docs/ARCHITECTURE.md) — High-level architecture.
- [DEPLOY-DO.md](DEPLOY-DO.md), [DEPLOYMENT.md](DEPLOYMENT.md) — Deployment guides.

## License

By contributing, you agree that your contributions will be licensed under the same [MIT License](LICENSE).

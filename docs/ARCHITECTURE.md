# PanaStream – Architecture

High-level architecture for PanaStream: React client, Express API, and AWS services.

## High-level architecture

```mermaid
flowchart LR
    subgraph Client["React Client"]
        Player[Video Player]
        Upload[Upload UI]
        Library[Library UI]
        Search[Search]
    end

    subgraph API["Express API"]
        Media[Media Routes]
        UploadR[Upload Routes]
        Convert[Convert Jobs]
        DB[(SQLite / DB)]
    end

    subgraph AWS["AWS Services"]
        S3[S3 Storage]
        CF[CloudFront]
        MC[MediaConvert]
    end

    Client <--> API
    API --> S3
    API --> MC
    CF --> S3
    Client --> CF
    API --> DB
```

## Component overview

| Component | Role |
|-----------|------|
| **React Client** | Video player, upload UI, library, search; talks to API and streams via CloudFront. |
| **Express API** | Media CRUD, upload handling, conversion job submission, SQLite/DB; uses PANASTREAM_API_TOKEN for auth. |
| **S3** | Raw uploads and processed media storage. |
| **CloudFront** | CDN for streaming; origin S3. |
| **MediaConvert** | Video transcoding (e.g. MOV → MP4). |

## Data flow (simplified)

```mermaid
sequenceDiagram
    participant User
    participant React
    participant API
    participant S3
    participant MC as MediaConvert
    participant CF as CloudFront

    User->>React: Upload video
    React->>API: POST /api/media (token)
    API->>S3: Store file
    API->>MC: Create job
    API-->>React: Job ID, status
    User->>React: Play video
    React->>API: GET stream URL
    API-->>React: CloudFront URL
    React->>CF: Stream
    CF->>S3: Origin fetch
```

## Project layout

```
panastream/
├── client/          # React app (upload, library, player)
├── server/          # Express API, routes, middleware, env.example
├── app.yaml         # DigitalOcean App Platform spec (root)
├── .do/             # Additional DO app specs
├── server/env.example   # Env template (copy to server/.env)
├── generate-token.js    # Generate PANASTREAM_API_TOKEN
├── README.md, README-SECURITY.md
├── DEPLOY-DO.md, DEPLOYMENT.md, ...
└── docs/ARCHITECTURE.md # This file
```

## Security (relevant for public repo)

- **API token**: Set `PANASTREAM_API_TOKEN` in `server/.env`; generate with `node generate-token.js`. Use `Authorization: Bearer <token>` or `X-API-Key: <token>`.
- **AWS**: Use env vars (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.); never commit `.env`.
- **Secrets**: All sensitive values in app specs are placeholders or set in dashboard; see [README-SECURITY](README-SECURITY.md).

## Clone and run

```bash
git clone https://github.com/xuxogarcia/panastream.git
cd panastream
npm run install-all
cd server && cp env.example .env && cd ..   # Edit .env with your config
npm run dev
```

See [README](README.md) for full setup and AWS configuration.

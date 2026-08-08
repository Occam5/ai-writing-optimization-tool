# AI-powered Academic Writing Optimization Tool

A full-stack web application that turns a general-purpose language model into a structured academic writing assistant. Users can submit a research or coursework draft, receive criterion-based feedback, compare revisions, and review their recent analyses.

The project was built as a compact demonstration of full-stack development, AI API integration, data persistence, authentication, and deployable educational technology.

## Core Features

- **Structured evaluation** across argument and contribution, structure and coherence, academic style, and clarity and language
- **Evidence-based feedback** linked to excerpts from the submitted text
- **Two revision modes** for conservative editing or more polished rewriting
- **Original-versus-revised comparison** with word-level changes highlighted
- **User authentication** with secure password hashing and HTTP-only session cookies
- **Analysis history** stored separately for each account
- **Usage controls** limiting free accounts to five analyses per day
- **Downloadable reports** for saving feedback and revised text
- **Responsive interface** for desktop and mobile use

> The tool provides AI-generated writing feedback. It does not verify facts, citations, research quality, or academic integrity.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js, React, TypeScript, CSS, Lucide React |
| Backend | Next.js Route Handlers, Zod |
| AI | DeepSeek Chat Completions API, structured JSON output |
| Database | PostgreSQL, Prisma ORM |
| Authentication | bcryptjs, JOSE, HTTP-only cookies |
| Deployment | Vercel, Neon Postgres |

## How It Works

1. The user selects a research paper or coursework paper and submits the text.
2. The server validates the request and checks the user's daily allowance.
3. A server-side prompt asks DeepSeek for feedback in a predefined JSON format.
4. Zod validates the model output before it reaches the interface.
5. Prisma stores the analysis and updates the user's daily usage count.
6. The interface presents an overview, detailed feedback, an improved draft, and a word-level comparison.

The DeepSeek API key is used only by the server and is never exposed to the browser.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://user:password@host-pooler/database?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_MODEL="deepseek-chat"
```

Generate an authentication secret with:

```bash
openssl rand -base64 32
```

### 3. Initialize the database

```bash
npx prisma migrate deploy
```

Optional database browser:

```bash
npx prisma studio
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

### 1. Create the project

Import the repository into [Vercel](https://vercel.com/new).

### 2. Add PostgreSQL

From the Vercel project dashboard, create or connect a PostgreSQL database through the Storage Marketplace. Neon Postgres is suitable for this demonstration project.

Confirm that the integration has added a valid `DATABASE_URL` to the project.

### 3. Add environment variables

In **Settings → Environment Variables**, configure:

```text
DATABASE_URL
AUTH_SECRET
DEEPSEEK_API_KEY
DEEPSEEK_MODEL
```

Apply them to Production and, where needed, Preview and Development environments. Never commit real credentials to the repository.

### 4. Deploy

The included `vercel.json` runs the following deployment workflow:

```bash
prisma generate
prisma migrate deploy
next build
```

This generates Prisma Client, applies pending database migrations, and then builds the application. Environment-variable changes require a new deployment before they take effect.

## Project Structure

```text
src/
├── app/
│   ├── api/              # Authentication and writing-analysis endpoints
│   ├── dashboard/        # Authenticated writing workspace
│   ├── login/            # Login page
│   └── register/         # Registration page
├── components/           # Product, dashboard, and authentication UI
└── lib/
    ├── deepseek-analysis.ts  # Prompt construction and AI response validation
    ├── prisma.ts              # Shared Prisma client
    └── session.ts             # Signed cookie sessions
prisma/
├── migrations/           # PostgreSQL schema migrations
└── schema.prisma         # Database models
```

## Data Model

- `User`: account credentials and creation time
- `Analysis`: submitted text, settings, AI output, and creation time
- `DailyUsage`: per-user daily request count

Passwords are stored as bcrypt hashes. Session cookies are HTTP-only, secure in production, and signed with `AUTH_SECRET`.

## Current Scope

This is a focused prototype rather than a complete academic assessment system. It currently accepts text only and uses one model provider. Potential research-oriented extensions include rubric customization, anonymized revision analytics, human-versus-AI feedback comparison, longitudinal writing progress, and instructor-defined evaluation tasks.

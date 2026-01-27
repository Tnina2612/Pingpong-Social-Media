# Pingpong Social Media - Copilot Instructions

## Project Overview

**Pingpong** is a full-stack social media application built with a modern tech stack. The repository is a monorepo structure with separate client and server directories.

### Repository Statistics
- **Size**: ~711MB (with dependencies)
- **Source Files**: 59 TypeScript/JavaScript files (excluding node_modules)
- **Architecture**: Client-Server monorepo
- **Node Version**: v20.20.0
- **npm Version**: 10.8.2

### Tech Stack

**Frontend (client/)**
- React 19.2.0 with TypeScript
- Vite 7.2.4 (build tool)
- TailwindCSS 4.1.18 (styling)
- Tanstack React Query 5.90.17 (state management)
- React Router 7.12.0 (routing)
- Zustand 5.0.10 (state management)
- Framer Motion 12.29.0 (animations)

**Backend (server/)**
- NestJS 11.0.1 (framework)
- Prisma 7.2.0 (ORM)
- PostgreSQL (database)
- Swagger/OpenAPI (API documentation)
- Passport JWT (authentication)
- Jest 30.0.0 (testing)

**Linting/Formatting**
- Biome 2.3.11 (root-level linter/formatter for both client and server)

### Core Features
- Post creation
- Chat (one-on-one, group chat) with AI chatbot integration
- Video calling
- Notifications
- Admin management
- Groups/Pages
- Email verification and password reset
- OAuth (Google, Facebook, GitHub)
- Rate limiting

## Project Structure

```
/
├── .github/              # GitHub configuration (workflows, etc.)
├── client/               # React frontend application
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── app/          # Application pages (public/, private/)
│   │   ├── components/   # Reusable UI components
│   │   ├── config/       # Configuration files
│   │   ├── errors/       # Error handling components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility libraries
│   │   ├── routes/       # Route configuration
│   │   ├── services/     # API service layer
│   │   └── types/        # TypeScript type definitions
│   ├── components.json   # shadcn UI configuration
│   ├── index.html        # HTML entry point
│   ├── package.json      # Client dependencies
│   ├── tsconfig.json     # TypeScript config (references)
│   ├── tsconfig.app.json # App TypeScript config
│   ├── tsconfig.node.json# Node TypeScript config
│   └── vite.config.ts    # Vite configuration
├── server/               # NestJS backend application
│   ├── libs/             # Shared libraries
│   │   └── swagger/      # Swagger setup utilities
│   ├── prisma/
│   │   └── schema.prisma # Prisma database schema
│   ├── src/
│   │   ├── sample/       # Sample module (example code)
│   │   ├── app.module.ts # Root application module
│   │   └── main.ts       # Application entry point
│   ├── test/             # E2E tests
│   ├── dist/             # Build output (excluded from linting)
│   ├── nest-cli.json     # NestJS CLI configuration
│   ├── package.json      # Server dependencies
│   ├── prisma.config.ts  # Prisma configuration
│   ├── tsconfig.json     # TypeScript configuration
│   └── tsconfig.build.json
├── biome.json            # Biome linter/formatter config (root)
├── package.json          # Root package.json (biome dependency)
└── README.md             # Project documentation
```

## Build and Development Instructions

### CRITICAL: Always Install Dependencies First

Dependencies must be installed in the correct order:

```bash
# 1. Install root dependencies (Biome)
npm install

# 2. Install client dependencies
cd client && npm install

# 3. Install server dependencies
cd ../server && npm install
```

**Note**: Server dependencies may show 11 vulnerabilities (1 low, 7 moderate, 3 high) during installation. These are in devDependencies and can be addressed with `npm audit fix` if needed, but are not blocking for development.

### Client Build & Development

**Working Directory**: Always run client commands from `/client` directory.

#### Development Server
```bash
cd client
npm run dev
```
- Starts Vite dev server with HMR
- Usually runs on http://localhost:5173
- Takes ~5-10 seconds to start

#### Build
```bash
cd client
npm run build
```
- Runs TypeScript compilation first: `tsc -b`
- Then runs Vite build
- **KNOWN ISSUE**: Build currently fails with TypeScript errors in `src/components/ui/shape-landing-hero.tsx` (3 errors related to framer-motion Variants type incompatibility on lines 171, 182, 203). The `ease` property type is incompatible with framer-motion's expectations.
- Build time: ~10-20 seconds when successful

#### Lint
```bash
cd client
npm run lint
```
- **DOES NOT WORK**: ESLint is not installed in client dependencies
- Use Biome instead (see "Linting with Biome" section below)

#### Preview
```bash
cd client
npm run preview
```
- Previews the production build locally

### Server Build & Development

**Working Directory**: Always run server commands from `/server` directory.

#### Development Server
```bash
cd server
npm run start:dev
```
- Starts NestJS in watch mode
- Automatically reloads on file changes
- API available at http://localhost:3000 (configurable via PORT env var)
- API docs at http://localhost:3000/docs (Swagger UI)

#### Build
```bash
cd server
npm run build
```
- Runs `nest build` command
- Compiles TypeScript to JavaScript in `dist/` directory
- Build time: ~5-10 seconds
- **SUCCESS**: Server builds without errors

#### Production Start
```bash
cd server
npm run start:prod
```
- Runs compiled code from dist/: `node dist/main`
- Requires successful build first

#### Tests
```bash
cd server
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage report
npm run test:watch  # Watch mode
```
- **SUCCESS**: Default test passes (1 passing test in app.controller.spec.ts)
- Jest is configured in package.json
- Test files: `*.spec.ts` pattern
- Test time: <1 second for default suite

#### Lint
```bash
cd server
npm run lint
```
- **DOES NOT WORK**: ESLint is not installed in server dependencies
- Use Biome instead (see "Linting with Biome" section below)

#### Format
```bash
cd server
npm run format
```
- **NOTE**: Uses Prettier which is not installed; use Biome instead

### Linting with Biome

**Working Directory**: Run Biome commands from **root directory** (not client or server).

Biome is the primary linter and formatter for this project, configured in `biome.json`.

#### Check (Lint + Format)
```bash
# From root directory
npx biome check .
```
- Runs linter and formatter checks
- Shows formatting differences and lint errors
- **KNOWN ISSUES**:
  - Reports errors in `server/dist/` (build output) - these can be ignored as they are generated files
  - Reports Tailwind syntax errors in `client/src/index.css` (Tailwind v4 syntax not fully supported by Biome yet)
  - Reports 1 unused parameter in `server/libs/swagger/setup.ts` (safe to fix or ignore)

#### Fix Issues
```bash
# From root directory
npx biome check --write .
```
- Automatically fixes formatting and safe lint issues
- Use with caution as it modifies files

#### Lint Only
```bash
# From root directory
npx biome lint .
```
- Runs only linter (no formatting)

#### Format Only
```bash
# From root directory
npx biome format --write .
```
- Formats all files according to biome.json config

#### Biome Configuration Highlights (biome.json)
- Indent: 4 spaces
- Line width: 80 characters
- Quote style: Double quotes for client/ and server/ (via overrides)
- Several rules disabled: noAutofocus, noBannedTypes, noUnusedVariables, noExplicitAny, etc.
- **BUG**: Config file itself has formatting issues (uses 2 spaces instead of configured 4)

### Prisma Database Setup

**Working Directory**: Run Prisma commands from `/server` directory.

#### Generate Prisma Client
```bash
cd server
npx prisma generate
```
- **CRITICAL ERROR**: This command fails because the schema.prisma file is missing the `output` path for the generator
- **WORKAROUND**: Before running `prisma generate`, add this to `prisma/schema.prisma`:
  ```prisma
  generator client {
    provider = "prisma-client"
    output   = "../node_modules/@prisma/client"  # Or your preferred path
  }
  ```
- The current schema only has `provider = "prisma-client"` without an output path

#### Database Migrations
```bash
cd server
npx prisma migrate dev --name <migration_name>
```
- Creates and applies migrations
- Requires DATABASE_URL in .env file

#### Database Schema
- Located at: `server/prisma/schema.prisma`
- Models: User, Friendship, Post, Comment, Like, Server, Channel, Member, Message
- Enums: FriendshipStatus, TargetLikeType, ChannelType
- Uses PostgreSQL

### Environment Configuration

#### Server Environment Variables
- Copy `server/.env.example` to `server/.env`
- Required variables:
  ```
  PORT=3000
  NODE_ENV=development
  DATABASE_URL=postgresql://username:password@localhost:5432/db
  POSTGRES_USER=user
  POSTGRES_PASSWORD=password
  POSTGRES_DB=db
  ```

#### Client Environment Variables
- Example file at: `client/src/config/.env.example` (contains placeholder text)
- Create `.env` file in client/ root if needed

## TypeScript Configuration

### Client TypeScript
- Uses project references (tsconfig.json references tsconfig.app.json and tsconfig.node.json)
- Path alias: `@/*` maps to `./src/*`
- Target: ES2020+
- Module: ESNext

### Server TypeScript
- Module: NodeNext
- Target: ES2023
- Decorators enabled (required for NestJS)
- Path alias: `@libs/*` maps to `libs/*`
- Output: `dist/`
- Strict mode enabled (with some relaxations)

## Common Issues and Workarounds

### 1. Client Build Fails (TypeScript Errors)
**Issue**: Build fails with 3 TypeScript errors in `shape-landing-hero.tsx` related to framer-motion Variants type incompatibility.

**Error**: Type of `ease` property (number[]) is incompatible with framer-motion's expected type.

**Workaround**: 
- Fix the `fadeUpVariants` object in the file to match framer-motion's type expectations
- Or add type assertion: `as any` (temporary)
- Or upgrade/downgrade framer-motion version

### 2. ESLint Not Found
**Issue**: `npm run lint` fails in both client and server with "eslint: not found"

**Solution**: Use Biome instead from root directory:
```bash
npx biome check .
```

### 3. Prisma Generate Fails
**Issue**: `npx prisma generate` fails with error about missing output path

**Solution**: Add output path to prisma/schema.prisma:
```prisma
generator client {
  provider = "prisma-client"
  output   = "../node_modules/@prisma/client"
}
```

### 4. Biome Reports Errors in dist/
**Issue**: Biome lints the compiled output in `server/dist/`

**Solution**: These are generated files and can be ignored. The biome.json should ideally be updated to ignore dist/ folders, but currently it checks them.

### 5. Database Connection Required
**Issue**: Server may fail to start without DATABASE_URL

**Solution**: Either:
- Set up a PostgreSQL database and configure .env
- Or comment out Prisma-related code temporarily for testing

## Validation and CI/CD

**Note**: No GitHub Actions workflows are currently configured (no `.github/workflows/` directory exists).

### Manual Validation Steps Before Committing

1. **Install all dependencies** (root, client, server)
2. **Run Biome checks** from root:
   ```bash
   npx biome check .
   ```
   - Ignore dist/ and Tailwind CSS errors
   - Fix any legitimate source code issues

3. **Server validation**:
   ```bash
   cd server
   npm run build    # Should succeed
   npm run test     # Should pass (1 test)
   ```

4. **Client validation** (if build errors are fixed):
   ```bash
   cd client
   npm run build    # Currently fails, skip if not fixed
   ```

## Tips for Efficient Development

1. **Trust these instructions**: The information above has been validated by running actual commands. Only search for additional information if something has changed or these instructions are incomplete.

2. **Monorepo structure**: Remember to navigate to the correct directory (root, client, or server) before running commands.

3. **Use Biome, not ESLint**: This project uses Biome for linting and formatting. Always run it from the root directory.

4. **Client build is broken**: Be aware that the client build currently fails. Focus on server development or fix the framer-motion type errors first.

5. **Prisma needs configuration**: Before using Prisma, fix the schema generator output path issue.

6. **No CI/CD yet**: There are no automated checks. Manual validation is required.

7. **Node version**: Use Node.js v20.20.0 (or compatible version) for best results.

8. **Install order matters**: Always install root dependencies first, then client, then server.

## File Locations Quick Reference

- Swagger setup: `server/libs/swagger/index.ts`
- API entry point: `server/src/main.ts`
- React entry point: `client/src/main.tsx`
- Database schema: `server/prisma/schema.prisma`
- Biome config: `biome.json` (root)
- Client routes: `client/src/routes/route.ts`
- Sample API module: `server/src/sample/`
- UI components: `client/src/components/`
- API services: `client/src/services/`

---

**Last Updated**: January 27, 2026
**Validation Status**: All commands tested and documented with actual results.

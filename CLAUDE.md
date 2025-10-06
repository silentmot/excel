# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ALASLA Operations Dashboard** - Construction site operations management system for tracking materials, equipment, manpower, and production metrics from Excel/CSV data sources.

**Architecture**: Nx monorepo with Next.js 15 (App Router) + Prisma + PostgreSQL + NextAuth.js v5 (Azure AD)

**Key Characteristics**:
- Single Next.js application (NestJS removed, see IMPLEMENTATION_GUIDE.md)
- Azure AD authentication with strict @sirc.sa domain enforcement
- PostgreSQL database via Prisma ORM
- Time-series operational data from CSV sources
- Bun package manager

---

## Common Commands

### Development
```bash
# Start Next.js dev server (http://localhost:4200)
bunx nx dev web

# Build for production
bunx nx build web

# Run tests
bunx nx test web

# Run E2E tests
bunx nx e2e web-e2e

# Lint
bunx nx lint web
```

### Database Operations
```bash
# Generate Prisma Client after schema changes
bunx prisma generate

# Push schema changes to database (dev)
bunx prisma db push

# Create migration (production)
bunx prisma migrate dev --name <migration_name>

# Open Prisma Studio (database GUI at http://localhost:5555)
bunx prisma studio

# Seed database with initial data
bunx tsx prisma/seed.ts
```

### Nx Workspace
```bash
# View project dependency graph
bunx nx graph

# Show project details
bunx nx show project web

# List all projects
bunx nx show projects

# Run tasks on affected projects only
bunx nx affected:test
bunx nx affected:build

# Reset Nx cache (troubleshooting)
bunx nx reset
```

---

## Architecture & Code Structure

### Monorepo Layout
- **apps/web/** - Next.js 15 application (primary application)
- **apps/web-e2e/** - Playwright E2E tests
- **prisma/** - Database schema and seed scripts
- **docs/** - Project documentation and data source (alasla.csv)

### Next.js Application Structure (`apps/web/`)

**Authentication Flow**:
- Root-level `auth.ts` configures NextAuth.js with Azure AD provider
- `middleware.ts` protects all routes except auth endpoints
- Authentication enforces @sirc.sa domain restriction (see auth.ts:32)
- Database session strategy (30-day expiry)

**Key Files**:
- `auth.ts` - NextAuth.js configuration with Azure AD provider
- `apps/web/src/middleware.ts` - Route protection middleware
- `apps/web/src/lib/db.ts` - Prisma client singleton
- `apps/web/src/app/api/auth/[...nextauth]/route.ts` - Auth API route handler

**Database Architecture**:
- NextAuth tables: User, Account, Session, VerificationToken
- Dimension tables: Material, Equipment, ManpowerRole, OperationMetric
- Fact tables (time-series): DailyProduction, DailyDispatched, DailyEquipmentUsage, DailyManpower, DailyOperation
- See `prisma/schema.prisma` for complete schema

### Important Patterns

**Authentication Pages**:
- `/auth/signin` - Azure AD sign-in page (apps/web/src/app/auth/signin/page.tsx)
- `/auth/error` - Authentication error page
- `/dashboard` - Protected dashboard (requires @sirc.sa email)

**Database Queries**:
Always use the Prisma client from `apps/web/src/lib/db.ts`:
```typescript
import { prisma } from "@/lib/db"

// Server component or API route
const materials = await prisma.material.findMany()
```

**Server Actions**:
Use Next.js server actions for mutations (see auth signin page for example):
```typescript
"use server"
import { prisma } from "@/lib/db"

export async function createMaterial(data: MaterialData) {
  return await prisma.material.create({ data })
}
```

---

## Development Workflow

### Adding New Features

1. **Database Changes**:
   - Update `prisma/schema.prisma`
   - Run `bunx prisma db push` (dev) or `bunx prisma migrate dev` (production)
   - Run `bunx prisma generate` to update Prisma Client

2. **API Routes** (Next.js App Router):
   - Create in `apps/web/src/app/api/[route]/route.ts`
   - Export GET, POST, PUT, DELETE functions
   - Use Prisma client for database operations

3. **Pages**:
   - Create in `apps/web/src/app/[route]/page.tsx`
   - Use server components by default (async functions)
   - Client components need `"use client"` directive

4. **Components**:
   - Generate with: `bunx nx g @nx/next:component components/my-component --project=web`
   - Place in `apps/web/src/app/components/` or route-specific folders

### Testing Data Entry

The system is designed to process construction site operations data. Key data categories:
- **Materials**: 15+ types (aggregates, sand, subbase, etc.)
- **Equipment**: 9 types (crushers, excavators, loaders, dumpers)
- **Manpower**: 5 roles (drivers, operators, maintenance, sales)
- **Metrics**: Production vs dispatch tracking, inventory balance

Source data: `docs/alasla.csv` (July 2025 operations)

---

## Environment Configuration

Required environment variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:4200"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# Azure AD (from Azure Portal → App Registrations)
AZURE_AD_CLIENT_ID="<client-id>"
AZURE_AD_CLIENT_SECRET="<client-secret>"
AZURE_AD_TENANT_ID="<tenant-id>"
```

**Azure AD Setup**:
- Redirect URI: `http://localhost:4200/api/auth/callback/azure-ad` (dev)
- Permissions: User.Read, email, openid, profile
- Domain restriction: Only @sirc.sa accounts allowed (enforced in auth.ts)

---

## Critical Implementation Notes

### Authentication Domain Restriction
The system MUST only allow @sirc.sa email addresses. This is enforced in:
- `auth.ts` lines 23-38 (signIn callback)
- Do NOT remove or bypass this security check

### Database Session Strategy
- Uses database sessions (not JWT)
- Session expiry: 30 days
- Prisma adapter handles session storage

### Prisma Client Singleton
Always import from `apps/web/src/lib/db.ts` to avoid multiple client instances:
```typescript
// ✅ Correct
import { prisma } from "@/lib/db"

// ❌ Wrong
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
```

### TypeScript Path Aliases
- `@/` maps to `apps/web/src/`
- Use for imports: `import { auth } from "@/auth"`

### Data Integrity
- Date fields use PostgreSQL `@db.Date` type
- Quantities use `@db.Decimal(10, 2)` for precision
- Unique constraints on `[date, materialId]` pairs prevent duplicates

---

## Common Issues & Solutions

### Prisma Client Not Found
```bash
bunx prisma generate
```

### Database Schema Out of Sync
```bash
bunx prisma db push  # Dev
bunx prisma migrate dev --name fix  # Production
```

### Authentication Redirect Loop
- Verify NEXTAUTH_URL matches actual server URL
- Check middleware.ts matcher pattern
- Verify Azure AD redirect URIs

### Port Already in Use
Next.js dev server uses port 4200 (not 3000):
```bash
# Windows
netstat -ano | findstr :4200
taskkill /PID <pid> /F
```

---

## Code Generation Examples

```bash
# Generate React component
bunx nx g @nx/next:component components/MaterialChart --project=web

# Generate API route (manual creation)
# Create: apps/web/src/app/api/materials/route.ts

# Generate library (shared code)
bunx nx g @nx/react:lib shared-ui
```

---

## Project-Specific Context

### Data Flow
1. CSV data (`docs/alasla.csv`) → Seed script (`prisma/seed.ts`)
2. Database (PostgreSQL via Prisma)
3. Next.js API routes → Server components
4. Dashboard visualization (Recharts - to be implemented)
5. Excel export (ExcelJS - to be implemented)

### Migration History
- Originally planned with NestJS backend + Next.js frontend
- Migrated to Next.js-only architecture (see IMPLEMENTATION_GUIDE.md)
- NestJS apps removed, API routes moved to Next.js App Router

### Testing Philosophy
- Unit tests: Jest (`bunx nx test web`)
- E2E tests: Playwright (`bunx nx e2e web-e2e`)
- Database tests should use separate test database

---

## Next Development Priorities

Based on IMPLEMENTATION_GUIDE.md Phase 10:

1. **Data Entry Forms**: Daily production, dispatch, equipment, manpower
2. **Dashboard Metrics**: Charts (Recharts), equipment utilization, inventory
3. **Export Functionality**: Excel export API (ExcelJS), Power BI datasets

---

## Package Manager

**Always use Bun** (`bunx` for Nx commands):
```bash
bun add <package>        # Add dependency
bun remove <package>     # Remove dependency
bunx nx <command>        # Run Nx commands
bunx prisma <command>    # Run Prisma commands
```

---

## References

- Nx Documentation: https://nx.dev
- Next.js 15 Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth.js v5: https://authjs.dev
- Project README: README.md
- Implementation Guide: IMPLEMENTATION_GUIDE.md
- Database Schema: prisma/schema.prisma
- Data Analysis: docs/Excel_Data_Analysis.md

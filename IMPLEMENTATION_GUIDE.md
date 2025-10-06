# Implementation Guide - Next.js Only Architecture
## ALASLA Operations Dashboard Migration

**Date**: October 5, 2025  
**Target**: Remove NestJS, implement Next.js-only architecture  
**Package Manager**: Bun (bunx)

---

## **Phase 1: Remove NestJS Applications**

### **Step 1.1: Use NX CLI to Remove NestJS Apps**

```bash
# Navigate to project root
cd F:\excel\ops

# Remove API application
bunx nx g @nx/workspace:remove api

# Remove API E2E tests
bunx nx g @nx/workspace:remove api-e2e

# Verify removal
bunx nx show projects
# Should only show: web, web-e2e
```

### **Step 1.2: Remove NestJS Dependencies**

```bash
# Remove NestJS packages
bun remove @nestjs/common @nestjs/core @nestjs/platform-express
bun remove reflect-metadata rxjs axios

# Remove NestJS dev dependencies
bun remove -D @nestjs/schematics @nestjs/testing @nx/nest @nx/express @nx/node @nx/webpack

# Verify package.json is clean
cat package.json | grep -i nest
# Should return nothing
```

---

## **Phase 2: Install New Dependencies**

### **Step 2.1: Install Core Dependencies**

```bash
# Authentication
bun add next-auth@5.0.0-beta.25 @auth/prisma-adapter

# Database ORM
bun add @prisma/client
bun add -D prisma tsx

# Validation & Forms
bun add zod react-hook-form @hookform/resolvers

# UI Components (Radix UI)
bun add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
bun add @radix-ui/react-select @radix-ui/react-toast
bun add @radix-ui/react-label @radix-ui/react-slot

# Charts & Visualization
bun add recharts date-fns

# Excel Export
bun add exceljs

# Utilities
bun add clsx tailwind-merge class-variance-authority lucide-react

# Verify installation
bun list | grep -E "next-auth|prisma|recharts|exceljs"
```

### **Step 2.2: Update Package.json Scripts**

The updated `package.json` artifact contains new scripts. Replace your current package.json with the artifact content.

**Key scripts added**:
- `bun run dev` - Start Next.js dev server
- `bun run db:generate` - Generate Prisma Client
- `bun run db:push` - Push schema to database
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Prisma Studio (database GUI)
- `bun run db:seed` - Seed database with initial data

---

## **Phase 3: Database Setup**

### **Step 3.1: Choose Database Provider**

**Recommended: Neon (PostgreSQL)**

Visit https://neon.tech and:
1. Sign up with GitHub/Email
2. Create new project: "alasla-ops"
3. Copy connection string (starts with `postgresql://...`)

**Alternative: Supabase**
- Visit https://supabase.com
- Create project, get connection string

**Alternative: Railway**
- Visit https://railway.app
- Add PostgreSQL service, get connection string

### **Step 3.2: Initialize Prisma**

```bash
# Initialize Prisma (creates prisma/ directory)
bunx prisma init

# This creates:
# - prisma/schema.prisma (empty schema)
# - .env (with DATABASE_URL placeholder)
```

### **Step 3.3: Configure Database Connection**

Edit `.env` file in project root:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:4200"
NEXTAUTH_SECRET="generate-this-with-openssl-rand-base64-32"

# Azure AD Configuration (get from Azure Portal)
AZURE_AD_CLIENT_ID="your-client-id-here"
AZURE_AD_CLIENT_SECRET="your-client-secret-here"
AZURE_AD_TENANT_ID="your-tenant-id-here"
```

**Generate NEXTAUTH_SECRET**:
```bash
# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# On Linux/Mac
openssl rand -base64 32
```

### **Step 3.4: Apply Prisma Schema**

```bash
# Copy the Prisma schema artifact to prisma/schema.prisma
# Then apply schema to database

# Push schema to database (for development)
bunx prisma db push

# Or create a migration (for production)
bunx prisma migrate dev --name init

# Generate Prisma Client
bunx prisma generate

# Open Prisma Studio to verify tables
bunx prisma studio
# Opens at http://localhost:5555
```

---

## **Phase 4: Azure AD App Registration**

### **Step 4.1: Create Azure AD App**

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate**: Azure Active Directory → App registrations
3. **Click**: New registration

**Registration Details**:
- **Name**: ALASLA Operations Dashboard
- **Supported account types**: Accounts in this organizational directory only (Single tenant)
- **Redirect URI**: 
  - Platform: Web
  - URL: `http://localhost:4200/api/auth/callback/azure-ad`

4. **Click**: Register

### **Step 4.2: Configure App Permissions**

After registration:

1. **API Permissions** → Add a permission
2. Select **Microsoft Graph**
3. Select **Delegated permissions**
4. Add: `User.Read`, `email`, `openid`, `profile`
5. Click **Grant admin consent** (requires admin)

### **Step 4.3: Create Client Secret**

1. **Certificates & secrets** → Client secrets
2. **New client secret**
   - Description: "ALASLA Ops Production"
   - Expires: 24 months (730 days)
3. **Copy the secret value** immediately (shown only once!)

### **Step 4.4: Get Configuration Values**

From the app overview page, copy:
- **Application (client) ID** → `AZURE_AD_CLIENT_ID`
- **Directory (tenant) ID** → `AZURE_AD_TENANT_ID`
- **Client secret value** (from step 4.3) → `AZURE_AD_CLIENT_SECRET`

Update `.env` with these values.

### **Step 4.5: Add Production Redirect URI**

When deploying to production (e.g., Vercel):
1. Go back to **App registrations** → Your app
2. **Authentication** → Add a platform → Web
3. Add redirect URI: `https://your-domain.vercel.app/api/auth/callback/azure-ad`

---

## **Phase 5: Project Structure Setup**

### **Step 5.1: Create Authentication Files**

Create `auth.ts` in project root:
```bash
# Copy the auth-config artifact content to this file
touch auth.ts
```

Create middleware for authentication:
```bash
# Create apps/web/src/middleware.ts
mkdir -p apps/web/src
touch apps/web/src/middleware.ts
```

**File**: `apps/web/src/middleware.ts`
```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
```

### **Step 5.2: Create Database Client**

Create `apps/web/src/lib/db.ts`:
```bash
mkdir -p apps/web/src/lib
touch apps/web/src/lib/db.ts
```

**File**: `apps/web/src/lib/db.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### **Step 5.3: Create API Route Structure**

```bash
cd apps/web/src/app

# Create API routes directory
mkdir -p api/auth/[...nextauth]
mkdir -p api/materials
mkdir -p api/operations
mkdir -p api/equipment
mkdir -p api/manpower
mkdir -p api/dashboard
mkdir -p api/export
```

Create authentication API route:

**File**: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

---

## **Phase 6: Seed Database with CSV Data**

### **Step 6.1: Create Seed Script**

Create `prisma/seed.ts`:
```bash
touch prisma/seed.ts
```

**File**: `prisma/seed.ts`
```typescript
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Read CSV file
  const csvContent = fs.readFileSync('../docs/alasla.csv', 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  })

  // Seed materials
  const materials = [
    { name: 'Aggregate 3/4"', size: '3/4"', category: 'Aggregate' },
    { name: 'Aggregate 1/2"', size: '1/2"', category: 'Aggregate' },
    { name: 'Aggregate 3/8"', size: '3/8"', category: 'Aggregate' },
    { name: 'Subbase', size: null, category: 'Base Material' },
    { name: 'Sand', size: null, category: 'Fine Material' },
    // Add more from docs/Excel_Data_Analysis.md
  ]

  for (const material of materials) {
    await prisma.material.upsert({
      where: { name: material.name },
      update: {},
      create: material
    })
  }

  console.log('✅ Materials seeded')

  // Seed equipment
  const equipment = [
    { name: 'Static Crusher No-1', type: 'Static Crusher' },
    { name: 'Static Crusher No-2', type: 'Static Crusher' },
    { name: 'Excavator', type: 'CAT' },
    { name: 'Front Loader', type: 'Shavol' },
    // Add more from docs/Excel_Data_Analysis.md
  ]

  for (const eq of equipment) {
    await prisma.equipment.upsert({
      where: { name: eq.name },
      update: {},
      create: eq
    })
  }

  console.log('✅ Equipment seeded')

  // Seed manpower roles
  const roles = [
    { modelcode: 'EQUIP-DRV', name: 'Equipment Driver' },
    { modelcode: 'CRU-OP', name: 'Crusher Operator' },
    { modelcode: 'MAINT', name: 'Maintenance Worker' },
    { modelcode: 'SALES', name: 'Sales Representative' },
  ]

  for (const role of roles) {
    await prisma.manpowerRole.upsert({
      where: { modelcode: role.modelcode },
      update: {},
      create: role
    })
  }

  console.log('✅ Manpower roles seeded')

  // TODO: Parse CSV and seed daily data
  // This requires parsing the CSV structure from docs/alasla.csv

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### **Step 6.2: Run Seed**

```bash
bun run db:seed
```

---

## **Phase 7: Update README**

Replace `README.md` with updated architecture documentation that reflects Next.js-only approach.

The artifact contains the updated README - copy it to `F:\excel\ops\README.md`.

---

## **Phase 8: Create Initial Pages**

### **Step 8.1: Create Sign-In Page**

Create `apps/web/src/app/auth/signin/page.tsx`:
```bash
mkdir -p apps/web/src/app/auth/signin
touch apps/web/src/app/auth/signin/page.tsx
```

**File**: `apps/web/src/app/auth/signin/page.tsx`
```typescript
import { signIn } from "@/auth"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ALASLA Operations</h1>
          <p className="mt-2 text-gray-600">Sign in with your Microsoft account</p>
        </div>
        
        <form
          action={async () => {
            "use server"
            await signIn("azure-ad", { redirectTo: "/dashboard" })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign in with Microsoft
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-500">
          Only @sirc.sa accounts are allowed
        </p>
      </div>
    </div>
  )
}
```

### **Step 8.2: Create Dashboard Page**

Create `apps/web/src/app/dashboard/page.tsx`:
```bash
mkdir -p apps/web/src/app/dashboard
touch apps/web/src/app/dashboard/page.tsx
```

**File**: `apps/web/src/app/dashboard/page.tsx`
```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome, {session.user?.name}</p>
      
      {/* TODO: Add dashboard metrics and charts */}
    </div>
  )
}
```

---

## **Phase 9: Testing**

### **Step 9.1: Start Development Server**

```bash
bun run dev
```

Visit http://localhost:4200

### **Step 9.2: Test Authentication**

1. Navigate to http://localhost:4200/auth/signin
2. Click "Sign in with Microsoft"
3. Sign in with a `@sirc.sa` account
4. Should redirect to dashboard after successful authentication
5. Try signing in with a non-`@sirc.sa` account - should be rejected

### **Step 9.3: Test Database Connection**

```bash
# Open Prisma Studio
bun run db:studio

# Visit http://localhost:5555
# Verify tables exist and can view data
```

---

## **Phase 10: Next Development Steps**

### **Priority 1: Data Entry Forms**

Create API routes and forms for:
1. Daily material production entry
2. Daily dispatch entry
3. Equipment usage entry
4. Manpower attendance entry

### **Priority 2: Dashboard Metrics**

Implement:
1. Production vs Dispatch charts (Recharts)
2. Equipment utilization metrics
3. Inventory balance calculations
4. Material flow visualization

### **Priority 3: Export Functionality**

Implement:
1. Excel export API route (using exceljs)
2. Power BI dataset API route
3. Export UI with date range selection

---

## **Quick Reference Commands**

```bash
# Development
bun run dev                    # Start Next.js dev server
bun run build                  # Build for production
bun run start                  # Start production server

# Database
bun run db:generate            # Generate Prisma Client
bun run db:push                # Push schema changes
bun run db:migrate             # Create migration
bun run db:studio              # Open database GUI
bun run db:seed                # Seed with initial data

# Testing
bun run test                   # Run tests
bun run lint                   # Run linter

# NX Commands
bunx nx graph                  # View project graph
bunx nx show project web       # Show project details
bunx nx affected:test          # Test affected projects
```

---

## **Troubleshooting**

### **Issue: Authentication Not Working**

1. Verify `.env` has all Azure AD credentials
2. Check redirect URI matches exactly in Azure Portal
3. Check browser console for errors
4. Verify database connection (users/accounts tables exist)

### **Issue: Database Connection Failed**

1. Verify `DATABASE_URL` in `.env` is correct
2. Check database is running (Neon/Supabase dashboard)
3. Try: `bunx prisma db push` to sync schema
4. Check Prisma Studio: `bun run db:studio`

### **Issue: Prisma Client Not Found**

```bash
# Regenerate Prisma Client
bunx prisma generate

# If still fails, clear and regenerate
rm -rf node_modules/.prisma
bunx prisma generate
```

---

**Status**: Ready for implementation  
**Estimated Time**: 2-3 days for complete setup  
**Next**: Follow Phase 1 to remove NestJS applications

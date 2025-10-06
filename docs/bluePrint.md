# Architecture Decision Document

## Excel Operations Dashboard - ALASLA Construction Site

**Decision Date**: October 5, 2025
**Project Scale**: 15-20 users
**Primary Use Case**: Daily data entry + dashboard + exports

---

## **Requirements Summary**

### **Core Functional Requirements**

1. ✅ Daily data entry interface (materials, equipment, manpower)
2. ✅ Excel mathematical calculations replication
3. ✅ Dashboard visualization (production, dispatch, inventory)
4. ✅ Export capabilities (Excel, Power BI, Web)
5. ✅ Microsoft 365 authentication (@sirc.sa domain restriction)

### **Scale & Performance**

- **User Base**: 15-20 concurrent users
- **Data Volume**: ~1,000 daily entries/month (31 days × ~30 data points)
- **Read:Write Ratio**: Estimated 70:30 (more reads for dashboards)
- **Concurrency**: Low (construction site daily entry patterns)

### **Technical Constraints**

- Microsoft 365 business accounts available
- Bun package manager (not npm)
- Excel/Power BI export requirement

---

## **Architecture Decision: Remove NestJS, Use Next.js Only**

### **Recommendation: ✅ Eliminate NestJS - Use Next.js 15 with App Router**

**Rationale**:

#### **1. Scale Justification**

For 15-20 users with daily entry patterns:

- Next.js API routes handle **thousands of requests/second**
- Your load: ~50-100 requests/day maximum
- **Overhead**: NestJS adds unnecessary complexity for <1% capacity utilization

#### **2. Development Velocity**

```
Next.js Only:
├── Single codebase
├── Unified TypeScript types
├── Shared validation logic
├── One deployment target
└── Faster iteration

NestJS + Next.js:
├── Two codebases to maintain
├── API contract synchronization
├── Duplicate type definitions
├── Two deployment pipelines
└── Slower iteration
```

#### **3. Feature Parity**

| Requirement | Next.js API Routes | NestJS | Winner |
|-------------|-------------------|---------|---------|
| **API Endpoints** | ✅ App Router `/api` | ✅ Controllers | **Tie** |
| **Database ORM** | ✅ Prisma/Drizzle | ✅ TypeORM | **Tie** |
| **Authentication** | ✅ NextAuth.js (Azure AD) | ✅ Passport + Strategy | **Next.js** (simpler) |
| **Validation** | ✅ Zod schemas | ✅ Class validators | **Tie** |
| **Excel Export** | ✅ exceljs library | ✅ exceljs library | **Tie** |
| **Power BI** | ✅ REST API dataset | ✅ REST API dataset | **Tie** |
| **Server Actions** | ✅ Native support | ❌ Not applicable | **Next.js** |
| **Server Components** | ✅ Data fetching | ❌ Not applicable | **Next.js** |
| **Deployment** | ✅ Single app | ❌ Two services | **Next.js** |

#### **4. Microsoft 365 Integration**

**Next.js Advantage**: NextAuth.js (now Auth.js) has **native Azure AD provider**

```typescript
// Authentication is literally 5 lines with Next.js
import NextAuth from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"

export const { auth, handlers } = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email",
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Enforce @sirc.sa domain
      return user.email?.endsWith('@sirc.sa') ?? false
    }
  }
})
```

**NestJS**: Requires Passport setup, strategy configuration, session management - more boilerplate.

#### **5. Excel Calculations in TypeScript**

Both frameworks can handle calculations equally well:

```typescript
// Example: Production vs Dispatch calculation
// Works identically in Next.js API route or NestJS service

function calculateInventoryBalance(
  production: number,
  dispatch: number
): { balance: number; status: 'over' | 'under' | 'balanced' } {
  const balance = production - dispatch;

  if (balance < -100) return { balance, status: 'over' };
  if (balance > 100) return { balance, status: 'under' };
  return { balance, status: 'balanced' };
}
```

**Winner**: Tie - but Next.js wins by eliminating API boundary complexity

#### **6. Export Capabilities**

**Excel Export** (both equal):

```typescript
// Next.js API route: /api/export/excel
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Production Report');

  // Add data from database
  const data = await db.operation.findMany();
  worksheet.addRows(data);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=report.xlsx'
    }
  });
}
```

**Power BI Integration** (both equal):

- Push data via Power BI REST API
- Or expose Next.js API endpoint for Power BI to pull from

---

## **Proposed Technology Stack**

### **✅ Recommended Architecture**

```
┌─────────────────────────────────────────────────────┐
│           Next.js 15 App Router (Single App)        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Frontend (React Server Components)          │  │
│  │  ├─ Dashboard (Charts, Metrics)              │  │
│  │  ├─ Data Entry Forms                         │  │
│  │  └─ Export UI (Excel, Power BI)              │  │
│  └──────────────────────────────────────────────┘  │
│                      ↕                              │
│  ┌──────────────────────────────────────────────┐  │
│  │  API Routes (/app/api/*)                     │  │
│  │  ├─ /api/auth/[...nextauth] (Azure AD)       │  │
│  │  ├─ /api/materials (CRUD)                    │  │
│  │  ├─ /api/operations (CRUD + calcs)           │  │
│  │  ├─ /api/equipment (CRUD)                    │  │
│  │  ├─ /api/dashboard/metrics                   │  │
│  │  ├─ /api/export/excel                        │  │
│  │  └─ /api/export/powerbi                      │  │
│  └──────────────────────────────────────────────┘  │
│                      ↕                              │
│  ┌──────────────────────────────────────────────┐  │
│  │  Server Actions (mutations)                  │  │
│  │  ├─ createMaterialEntry()                    │  │
│  │  ├─ updateEquipmentHours()                   │  │
│  │  └─ calculateInventoryBalance()              │  │
│  └──────────────────────────────────────────────┘  │
│                      ↕                              │
│  ┌──────────────────────────────────────────────┐  │
│  │  Database Layer (Prisma ORM)                 │  │
│  │  ├─ PostgreSQL (primary database)            │  │
│  │  └─ Schema from docs/schema.sql              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### **Core Dependencies**

```bash
# Authentication
bun add next-auth@beta @auth/prisma-adapter

# Database
bun add @prisma/client
bun add -d prisma

# Validation
bun add zod

# UI Components
bun add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
bun add @radix-ui/react-select @radix-ui/react-toast

# Charts/Visualization
bun add recharts date-fns

# Excel Export
bun add exceljs

# Forms
bun add react-hook-form @hookform/resolvers

# Utilities
bun add clsx tailwind-merge
```

---

## **Database Strategy**

### **Option A: PostgreSQL (Recommended)**

**Why PostgreSQL**:

- ✅ Strong TypeScript ORM support (Prisma)
- ✅ JSON column support (flexible data structures)
- ✅ Excellent aggregate functions (SUM, AVG for calculations)
- ✅ Row-level security (future multi-tenant capability)
- ✅ Free tier available (Neon, Supabase, Railway)

**Setup**:

```bash
# Install Prisma
bun add @prisma/client
bun add -d prisma

# Initialize Prisma
bunx prisma init

# Copy schema from docs/schema.sql and convert to Prisma schema
# Then migrate
bunx prisma migrate dev --name init
```

### **Option B: SQLite (Development Only)**

For rapid prototyping before PostgreSQL setup:

```bash
# In prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

---

## **Authentication Implementation**

### **Auth.js (NextAuth v5) with Azure AD**

**File**: `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid email profile User.Read"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // CRITICAL: Enforce @sirc.sa domain
      const email = user.email || profile?.email
      if (!email?.endsWith('@sirc.sa')) {
        return false // Reject sign-in
      }
      return true
    },
    async session({ session, user }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = user.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
})

export { handlers as GET, handlers as POST }
```

**Environment Variables**:

```env
# Get these from Azure Portal > App Registrations
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-random-secret
```

**Azure AD App Registration Steps**:

1. Go to Azure Portal > Azure Active Directory > App registrations
2. New registration: Name "ALASLA Ops Dashboard"
3. Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
4. Certificates & secrets > New client secret
5. API permissions > Add Microsoft Graph > User.Read
6. Copy Client ID, Secret, Tenant ID to `.env.local`

---

## **Excel Mathematical Calculations**

### **Strategy: Server Actions for Real-time Calculations**

**File**: `app/actions/calculations.ts`

```typescript
'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function calculateDailyInventory(date: Date) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // Get production for date
  const production = await prisma.operation.aggregate({
    where: {
      date: date,
      operationType: 'PRODUCTION'
    },
    _sum: { quantity: true }
  })

  // Get dispatch for date
  const dispatch = await prisma.operation.aggregate({
    where: {
      date: date,
      operationType: 'DISPATCH'
    },
    _sum: { quantity: true }
  })

  const balance = (production._sum.quantity || 0) - (dispatch._sum.quantity || 0)

  // Store calculated result
  await prisma.dailySummary.upsert({
    where: { date },
    update: { inventoryBalance: balance },
    create: { date, inventoryBalance: balance }
  })

  revalidatePath('/dashboard')
  return { balance, status: balance < 0 ? 'over-dispatch' : 'balanced' }
}

export async function calculateEquipmentUtilization(
  equipmentId: string,
  dateRange: { start: Date; end: Date }
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const operations = await prisma.equipmentOperation.aggregate({
    where: {
      equipmentId,
      date: { gte: dateRange.start, lte: dateRange.end }
    },
    _sum: { hours: true },
    _avg: { hours: true },
    _count: true
  })

  const totalDays = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
  )

  const utilizationRate = ((operations._sum.hours || 0) / (totalDays * 24)) * 100

  return {
    totalHours: operations._sum.hours || 0,
    avgHoursPerDay: operations._avg.hours || 0,
    utilizationRate: Math.round(utilizationRate * 100) / 100,
    operatingDays: operations._count
  }
}
```

### **Example: Material Balance Formula (from Excel)**

```typescript
// Replicating Excel formula: =Production - Dispatch + PreviousBalance

export async function calculateMaterialBalance(
  materialId: string,
  date: Date
) {
  // Get previous day balance
  const previousDay = new Date(date)
  previousDay.setDate(previousDay.getDate() - 1)

  const previousBalance = await prisma.inventory.findUnique({
    where: {
      materialId_date: { materialId, date: previousDay }
    },
    select: { balance: true }
  })

  // Get today's production
  const production = await prisma.operation.aggregate({
    where: {
      materialId,
      date,
      operationType: 'PRODUCTION'
    },
    _sum: { quantity: true }
  })

  // Get today's dispatch
  const dispatch = await prisma.operation.aggregate({
    where: {
      materialId,
      date,
      operationType: 'DISPATCH'
    },
    _sum: { quantity: true }
  })

  const newBalance =
    (previousBalance?.balance || 0) +
    (production._sum.quantity || 0) -
    (dispatch._sum.quantity || 0)

  // Upsert inventory record
  await prisma.inventory.upsert({
    where: {
      materialId_date: { materialId, date }
    },
    update: {
      balance: newBalance,
      production: production._sum.quantity || 0,
      dispatch: dispatch._sum.quantity || 0
    },
    create: {
      materialId,
      date,
      balance: newBalance,
      production: production._sum.quantity || 0,
      dispatch: dispatch._sum.quantity || 0
    }
  })

  return {
    balance: newBalance,
    production: production._sum.quantity || 0,
    dispatch: dispatch._sum.quantity || 0
  }
}
```

---

## **Export Capabilities**

### **1. Excel Export**

**File**: `app/api/export/excel/route.ts`

```typescript
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = new Date(searchParams.get('start') || '')
  const endDate = new Date(searchParams.get('end') || '')

  // Fetch data
  const operations = await prisma.operation.findMany({
    where: {
      date: { gte: startDate, lte: endDate }
    },
    include: {
      material: true,
      equipment: true
    },
    orderBy: { date: 'asc' }
  })

  // Create workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ALASLA Ops Dashboard'
  workbook.created = new Date()

  // Sheet 1: Production Report
  const prodSheet = workbook.addWorksheet('Production Report')
  prodSheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Material', key: 'material', width: 25 },
    { header: 'Production (Tons)', key: 'production', width: 15 },
    { header: 'Dispatch (Tons)', key: 'dispatch', width: 15 },
    { header: 'Balance', key: 'balance', width: 12 }
  ]

  operations.forEach(op => {
    prodSheet.addRow({
      date: op.date.toISOString().split('T')[0],
      material: op.material.name,
      production: op.operationType === 'PRODUCTION' ? op.quantity : 0,
      dispatch: op.operationType === 'DISPATCH' ? op.quantity : 0,
      balance: 0 // Calculate from aggregates
    })
  })

  // Apply formulas (Excel will calculate)
  prodSheet.getColumn('balance').eachCell((cell, rowNumber) => {
    if (rowNumber > 1) { // Skip header
      cell.value = { formula: `C${rowNumber}-D${rowNumber}` }
    }
  })

  // Style header row
  prodSheet.getRow(1).font = { bold: true }
  prodSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=alasla-report-${startDate.toISOString().split('T')[0]}.xlsx`
    }
  })
}
```

### **2. Power BI Integration**

**Strategy**: REST API endpoint for Power BI to consume

**File**: `app/api/powerbi/dataset/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')

  // Fetch aggregated data suitable for Power BI
  const data = await prisma.$queryRaw`
    SELECT
      DATE(o.date) as date,
      m.name as material_name,
      m.category as material_category,
      SUM(CASE WHEN o.operation_type = 'PRODUCTION' THEN o.quantity ELSE 0 END) as production,
      SUM(CASE WHEN o.operation_type = 'DISPATCH' THEN o.quantity ELSE 0 END) as dispatch,
      SUM(CASE WHEN o.operation_type = 'PRODUCTION' THEN o.quantity ELSE 0 END) -
      SUM(CASE WHEN o.operation_type = 'DISPATCH' THEN o.quantity ELSE 0 END) as balance
    FROM operations o
    JOIN materials m ON o.material_id = m.id
    WHERE o.date >= ${startDate} AND o.date <= ${endDate}
    GROUP BY DATE(o.date), m.name, m.category
    ORDER BY o.date, m.name
  `

  return NextResponse.json(data)
}
```

**Power BI Setup**:

1. Power BI Desktop > Get Data > Web
2. URL: `https://your-app.vercel.app/api/powerbi/dataset?start=2025-07-01&end=2025-07-31`
3. Authentication: Organization account (Azure AD)
4. Transform data as needed
5. Publish to Power BI Service
6. Schedule refresh (Daily at 6 AM)

---

## **Deployment Strategy**

### **Recommended: Vercel (Next.js native platform)**

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
bunx vercel

# Production deployment
bunx vercel --prod
```

**Advantages**:

- ✅ Zero-config Next.js deployment
- ✅ Automatic HTTPS
- ✅ Edge network (fast globally)
- ✅ Preview deployments for testing
- ✅ Free tier suitable for 15-20 users
- ✅ Environment variables management
- ✅ Automatic scaling (though you won't need it)

**Database Hosting**:

- **Neon** (PostgreSQL): Free tier, serverless, great Prisma integration
- **Supabase**: Free tier, includes auth (though using Azure AD)
- **Railway**: Simple, PostgreSQL + Redis if needed

---

## **Redis Clarification Required**

**Question**: You mentioned "Rides on demand" - did you mean:

### **Option A: Redis (Caching)**

Use case: Cache dashboard metrics, reduce database queries

```bash
bun add @upstash/redis
```

**When to use**:

- ✅ Dashboard loads slowly (>2 seconds)
- ✅ Same data queried repeatedly
- ❌ Premature optimization for 15-20 users

**Recommendation**: **NOT NEEDED** initially. Add only if performance issues arise.

### **Option B: Something else?**

Please clarify what "Rides on demand" means in your context.

---

## **Final Recommendation Summary**

### **✅ Technology Stack**

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 only | Simpler, faster for small scale |
| **Database** | PostgreSQL (Neon) | Prisma integration, free tier |
| **Authentication** | Auth.js + Azure AD | Native @sirc.sa enforcement |
| **ORM** | Prisma | TypeScript-first, migrations |
| **UI** | Tailwind + Radix UI | Fast development, accessible |
| **Charts** | Recharts | React-native, good for dashboards |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Deployment** | Vercel | Zero-config Next.js hosting |
| **Package Manager** | Bun | As requested (fast, all-in-one) |

### **❌ Remove from Project**

1. **NestJS** - Unnecessary complexity for this scale
2. **apps/api/** - Delete entire directory
3. **apps/api-e2e/** - Delete E2E tests for API

### **Development Timeline Estimate**

- **Week 1**: Database setup, auth integration, basic CRUD
- **Week 2**: Data entry forms, calculations implementation
- **Week 3**: Dashboard UI, charts, metrics
- **Week 4**: Excel export, Power BI integration, testing
- **Week 5**: Deployment, user testing, refinements

**Total**: 5 weeks for MVP with one developer

---

## **Next Steps**

### **Immediate Actions**

1. **Confirm Architecture Decision**
   - ✅ Remove NestJS?
   - ✅ Proceed with Next.js-only approach?
   - ❓ Clarify "Rides on demand" requirement

2. **Setup Tasks** (if approved):

   ```bash
   # Remove NestJS apps
   rm -rf apps/api apps/api-e2e

   # Install core dependencies
   bun add next-auth@beta @auth/prisma-adapter
   bun add @prisma/client exceljs recharts
   bun add zod react-hook-form @hookform/resolvers
   bun add -d prisma

   # Initialize Prisma
   bunx prisma init
   ```

3. **Azure AD App Registration**
   - Create app registration in Azure Portal
   - Configure redirect URIs
   - Obtain credentials

4. **Database Selection**
   - Choose PostgreSQL provider (Neon/Supabase/Railway)
   - Get connection string
   - Apply schema from `docs/schema.sql`

---

**Awaiting Confirmation**: Should I proceed with NestJS removal and Next.js-only architecture?

# Excel Operations Management System

> **Construction & Demolition Recycling Facility Operations**
> Transform Excel-based operations into modern web application with Next.js, PostgreSQL, and comprehensive export capabilities

---

## **Project Overview**

This project transforms manual Excel-based data entry for a construction & demolition recycling facility into a Next.js 14+ web application with PostgreSQL database, real-time dashboards, and Excel/Power BI export capabilities.

**Phase 1 Status**: ✅ COMPLETED - Analysis & Planning (October 6, 2025)

**Next Phase**: Database Implementation & Web Application Development

### **Key Features**

- 📊 **Dashboard Analytics** - Real-time operational metrics and visualizations
- ✍️ **Daily Data Entry** - User-friendly forms for materials, equipment, manpower
- 🔐 **NextAuth Authentication** - Secure user access control
- 🧮 **Excel Calculations** - Server-side mathematical operations replicated from Excel
- 📤 **Multi-Format Export** - Excel, Power BI dataset generation
- 📈 **Production Tracking** - Materials production, dispatch, and inventory balance
- 🚜 **Equipment Monitoring** - Usage hours, utilization rates, and availability
- 👷 **Manpower Management** - Workforce attendance and role tracking

**Data Source**: 4 CSV files analyzed (Oct 2024 - Jul 2025 operations)
**Architecture**: Next.js 14+ with App Router + PostgreSQL + Prisma ORM

### **Analysis Documents**

- [📊 Data Structure Analysis](./docs/analysis/DATA_STRUCTURE_ANALYSIS.md) - Complete CSV analysis
- [🏷️ Material Taxonomy](./docs/analysis/MATERIAL_TAXONOMY.md) - 25 materials + 35 aliases
- [📋 Project Plan](./docs/analysis/PROJECT_PLAN_SUMMARY.md) - Implementation roadmap

---

## **Technology Stack**

### **Framework & Runtime**

- **Next.js 15.2.4** - Full-stack React framework (App Router)
- **React 19.0** - UI library with Server Components
- **Bun** - Package manager and runtime
- **TypeScript 5.9** - Type safety across the stack

### **Database & ORM**

- **PostgreSQL** - Primary database (Neon/Supabase)
- **Prisma 6** - TypeScript-first ORM with migrations
- **Prisma Studio** - Visual database explorer

### **Authentication**

- **NextAuth.js 5** (Auth.js) - Authentication framework
- **Azure AD Provider** - Microsoft 365 integration
- **Prisma Adapter** - Database session storage

### **UI & Styling**

- **Tailwind CSS 3.4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Recharts** - Data visualization library

### **Forms & Validation**

- **React Hook Form** - Performant form management
- **Zod** - TypeScript schema validation
- **@hookform/resolvers** - Zod integration

### **Export & Integration**

- **ExcelJS** - Excel file generation
- **date-fns** - Date manipulation utilities
- **Power BI REST API** - Dataset integration

### **Development Tools**

- **Nx 21.6** - Monorepo management and build system
- **Playwright** - E2E testing
- **Jest** - Unit testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## **Project Structure**

```
F:\excel\ops/
├── apps/
│   ├── web/                          # Next.js application (ONLY APP)
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages & API routes
│   │   │   │   ├── page.tsx          # Home page
│   │   │   │   ├── dashboard/        # Dashboard pages
│   │   │   │   ├── auth/             # Authentication pages
│   │   │   │   └── api/              # API routes
│   │   │   │       ├── auth/         # NextAuth endpoints
│   │   │   │       ├── materials/    # Material CRUD
│   │   │   │       ├── operations/   # Operations CRUD
│   │   │   │       ├── equipment/    # Equipment CRUD
│   │   │   │       ├── manpower/     # Manpower CRUD
│   │   │   │       ├── dashboard/    # Dashboard metrics
│   │   │   │       └── export/       # Export endpoints
│   │   │   ├── lib/                  # Shared utilities
│   │   │   │   └── db.ts             # Prisma client
│   │   │   ├── components/           # React components
│   │   │   └── middleware.ts         # Auth middleware
│   │   ├── public/                   # Static assets
│   │   └── specs/                    # Unit tests
│   │
│   └── web-e2e/                      # E2E tests (Playwright)
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Database migrations
│   └── seed.ts                       # Database seeding script
│
├── docs/                             # Project documentation
│   ├── alasla.csv                    # Source data (July 2025)
│   ├── Excel_Data_Analysis.md        # Data analysis report
│   ├── schema.sql                    # Original SQL schema
│   ├── comprehensive-erd-system.md   # Entity relationship diagram
│   └── IMPLEMENTATION_GUIDE.md       # Migration guide
│
├── .env                              # Environment variables (gitignored)
├── auth.ts                           # NextAuth configuration
├── package.json                      # Dependencies & scripts
├── nx.json                           # Nx workspace config
└── README.md                         # This file
```

---

## **Architecture**

### **Single Application Design**

```
┌─────────────────────────────────────────────────────────────┐
│                Next.js 15 Full-Stack Application            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend (React Server Components + Client)       │    │
│  │  ├─ Dashboard (Recharts visualizations)            │    │
│  │  ├─ Data Entry Forms (React Hook Form + Zod)       │    │
│  │  ├─ Authentication (NextAuth UI)                   │    │
│  │  └─ Export UI (Excel, Power BI)                    │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Routes (/app/api/*)                          │    │
│  │  ├─ /api/auth/[...nextauth] (Azure AD)            │    │
│  │  ├─ /api/materials (CRUD + calculations)          │    │
│  │  ├─ /api/operations (CRUD + aggregations)         │    │
│  │  ├─ /api/equipment (CRUD + utilization)           │    │
│  │  ├─ /api/manpower (CRUD + attendance)             │    │
│  │  ├─ /api/dashboard/metrics (real-time data)       │    │
│  │  ├─ /api/export/excel (file generation)           │    │
│  │  └─ /api/export/powerbi (dataset endpoint)        │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Server Actions (mutations & calculations)         │    │
│  │  ├─ createMaterialEntry()                          │    │
│  │  ├─ calculateInventoryBalance()                    │    │
│  │  ├─ calculateEquipmentUtilization()                │    │
│  │  └─ updateDailyOperations()                        │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Database Layer (Prisma ORM)                       │    │
│  │  └─ PostgreSQL (Neon/Supabase/Railway)             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Why Next.js Only?**

**Scale Reality**: 15-20 users with daily entry patterns means ~100 requests/day. Next.js API routes handle 100,000+ requests/second.

**Benefits**:

- ✅ **Single Codebase** - One TypeScript project, shared types
- ✅ **Faster Development** - No API contract synchronization
- ✅ **Simpler Deployment** - One Vercel deployment vs two services
- ✅ **Native Azure AD** - NextAuth has first-class Microsoft support
- ✅ **Server Components** - Direct database access, no API overhead
- ✅ **Server Actions** - Type-safe mutations without REST boilerplate

---

## **Getting Started**

### **Prerequisites**

- **Node.js** 20.x or higher
- **Bun** package manager ([install](https://bun.sh))
- **PostgreSQL database** (Neon/Supabase account)
- **Azure AD App Registration** (for Microsoft 365 auth)

### **Initial Setup**

```bash
# Navigate to project
cd F:\excel\ops

# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL (PostgreSQL connection string)
# - AZURE_AD_CLIENT_ID (from Azure Portal)
# - AZURE_AD_CLIENT_SECRET (from Azure Portal)
# - AZURE_AD_TENANT_ID (from Azure Portal)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
```

### **Database Setup**

```bash
# Generate Prisma Client
bun run db:generate

# Push schema to database
bun run db:push

# Seed with initial data (materials, equipment, roles)
bun run db:seed

# Open Prisma Studio to verify
bun run db:studio
# Opens at http://localhost:5555
```

### **Development**

```bash
# Start development server
bun run dev
# Opens at http://localhost:4200

# In a new terminal, open database GUI
bun run db:studio
```

---

## **Available Commands**

### **Development**

```bash
bun run dev                    # Start Next.js dev server (port 4200)
bun run build                  # Build for production
bun run start                  # Start production server
bun run test                   # Run unit tests
bun run lint                   # Run ESLint
```

### **Database**

```bash
bun run db:generate            # Generate Prisma Client from schema
bun run db:push                # Push schema changes to database
bun run db:migrate             # Create new migration
bun run db:studio              # Open Prisma Studio (database GUI)
bun run db:seed                # Seed database with initial data
```

### **Nx Workspace**

```bash
bunx nx graph                  # View interactive project graph
bunx nx show project web       # Show web project details
bunx nx affected:test          # Test only affected projects
bunx nx reset                  # Clear Nx cache
```

---

## **Authentication Setup**

### **Azure AD App Registration**

1. **Go to**: [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. **Create**: New registration
   - Name: "ALASLA Operations Dashboard"
   - Account types: Single tenant
   - Redirect URI: `http://localhost:4200/api/auth/callback/azure-ad`
3. **Configure**:
   - API Permissions → Add → Microsoft Graph → Delegated → `User.Read`, `email`, `openid`, `profile`
   - Grant admin consent
4. **Create Secret**:
   - Certificates & secrets → New client secret
   - Copy the **Value** (shown only once!)
5. **Get IDs**:
   - Overview page → Copy **Application (client) ID** and **Directory (tenant) ID**

### **Environment Configuration**

Update `.env`:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_URL="http://localhost:4200"
NEXTAUTH_SECRET="your-generated-secret"
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"
```

### **Domain Restriction**

The authentication is configured to **only allow @sirc.sa email addresses**. This is enforced in `auth.ts`:

```typescript
async signIn({ user }) {
  if (!user.email?.endsWith('@sirc.sa')) {
    return false // Reject non-@sirc.sa accounts
  }
  return true
}
```

---

## **Database Schema**

### **Core Entities**

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Material** | Aggregate types, materials | name, size, category |
| **Equipment** | Crushers, loaders, vehicles | name, type |
| **ManpowerRole** | Worker roles and codes | modelcode, name |
| **OperationMetric** | Operations KPIs | code, name, unit |

### **Daily Fact Tables**

| Entity | Purpose | Unique Constraint |
|--------|---------|-------------------|
| **DailyProduction** | Material produced per day | (date, materialId) |
| **DailyDispatched** | Material dispatched per day | (date, materialId) |
| **DailyEquipmentUsage** | Equipment hours per day | (date, equipmentId) |
| **DailyManpower** | Workforce count per day | (date, roleId) |
| **DailyOperation** | Operational metrics per day | (date, metricId) |

### **Calculated Metrics**

```typescript
// Example: Inventory Balance
inventoryBalance =
  (previous day balance) +
  (today's production) -
  (today's dispatch)

// Example: Equipment Utilization
utilizationRate =
  (actual hours / (days × 24 hours)) × 100
```

---

## **Excel Mathematical Calculations**

All Excel formulas are replicated as TypeScript functions:

### **Inventory Balance**

```typescript
// Replicates: =SUM(Production) - SUM(Dispatch) + PreviousBalance
async function calculateInventoryBalance(materialId, date) {
  const previous = await getPreviousBalance(materialId, date)
  const production = await getProduction(materialId, date)
  const dispatch = await getDispatch(materialId, date)
  return previous + production - dispatch
}
```

### **Equipment Utilization**

```typescript
// Replicates: =(Hours / (Days × 24)) × 100
async function calculateUtilization(equipmentId, dateRange) {
  const totalHours = await getTotalHours(equipmentId, dateRange)
  const totalDays = getDaysBetween(dateRange.start, dateRange.end)
  return (totalHours / (totalDays * 24)) * 100
}
```

### **Material Flow**

```typescript
// Replicates: Production vs Dispatch comparison
async function analyzeFlow(materialId, dateRange) {
  const production = await getTotalProduction(materialId, dateRange)
  const dispatch = await getTotalDispatch(materialId, dateRange)
  return {
    production,
    dispatch,
    balance: production - dispatch,
    status: production < dispatch ? 'over-dispatch' : 'under-dispatch'
  }
}
```

---

## **Export Capabilities**

### **1. Excel Export**

**Endpoint**: `GET /api/export/excel?start=2025-07-01&end=2025-07-31`

Generates `.xlsx` file with:

- Production Report sheet
- Dispatch Report sheet
- Equipment Usage sheet
- Manpower Attendance sheet
- Inventory Balance sheet (with formulas)

**Technology**: ExcelJS library

### **2. Power BI Integration**

**Endpoint**: `GET /api/export/powerbi?start=2025-07-01&end=2025-07-31`

Returns JSON dataset compatible with Power BI:

```json
{
  "date": "2025-07-15",
  "material_name": "Aggregate 3/4\"",
  "production": 250.5,
  "dispatch": 220.0,
  "balance": 30.5
}
```

**Setup in Power BI**:

1. Get Data → Web
2. Enter API URL with authentication
3. Transform as needed
4. Schedule daily refresh

### **3. Web Dashboard**

Real-time interactive dashboard with:

- Line charts (production trends)
- Bar charts (equipment comparison)
- Pie charts (material distribution)
- KPI cards (daily totals)
- Date range filtering

---

## **Data Source**

**File**: `docs/alasla.csv`
**Period**: July 1-31, 2025
**Site**: ALASLA Construction Site
**Format**: Consolidated CSV with daily operations

### **Data Categories**

1. **Dispatched Materials** (15 types)
   - Total: 34,770 tons
   - Top: Aggregate 3/4" (8,195 tons)

2. **Equipment Operations** (9 units)
   - Total: 1,704 operational hours
   - Highest: Front Loaders (510 hrs)

3. **Manpower Resources** (5 roles)
   - Total: 344 personnel-days
   - Largest: Maintenance (156)

4. **Production Metrics** (18 materials)
   - Total: 54,240 tons produced
   - Top: Sand (11,340 tons)

See `docs/Excel_Data_Analysis.md` for complete analysis.

---

## **Development Roadmap**

### **✅ Phase 1: Foundation** (Current)

- [x] Project setup with Nx + Next.js
- [x] Database schema design
- [x] Authentication architecture
- [x] Documentation

### **🔄 Phase 2: Backend & Auth** (In Progress)

- [ ] Prisma schema migration
- [ ] Azure AD authentication setup
- [ ] Database seeding with CSV data
- [ ] API route structure

### **📋 Phase 3: Data Entry** (Next)

- [ ] Material production forms
- [ ] Dispatch entry forms
- [ ] Equipment usage forms
- [ ] Manpower attendance forms

### **📊 Phase 4: Dashboard** (Planned)

- [ ] Real-time metrics cards
- [ ] Production trend charts
- [ ] Equipment utilization visualization
- [ ] Inventory balance tracking

### **📤 Phase 5: Export** (Planned)

- [ ] Excel export functionality
- [ ] Power BI dataset API
- [ ] Report generation UI

### **🚀 Phase 6: Deployment** (Planned)

- [ ] Vercel deployment
- [ ] Production database setup
- [ ] Azure AD production configuration
- [ ] User acceptance testing

---

## **Deployment**

### **Recommended: Vercel**

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy to preview
bunx vercel

# Deploy to production
bunx vercel --prod
```

**Environment Variables** (set in Vercel dashboard):

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Production URL (<https://your-app.vercel.app>)
- `NEXTAUTH_SECRET` - Same as local
- `AZURE_AD_CLIENT_ID` - Same as local
- `AZURE_AD_CLIENT_SECRET` - Same as local
- `AZURE_AD_TENANT_ID` - Same as local

**Don't forget**: Add production redirect URI to Azure AD app registration:
`https://your-app.vercel.app/api/auth/callback/azure-ad`

---

## **Useful Resources**

### **Documentation**

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://authjs.dev)
- [Nx Next.js Plugin](https://nx.dev/nx-api/next)
- [Recharts Docs](https://recharts.org)

### **Project-Specific**

- `docs/IMPLEMENTATION_GUIDE.md` - Step-by-step migration guide
- `docs/Excel_Data_Analysis.md` - Data analysis and requirements
- `docs/schema.sql` - Original SQL schema
- `docs/comprehensive-erd-system.md` - Entity relationships

### **Tools**

- [Prisma Studio](http://localhost:5555) - Database GUI (when running)
- [Nx Console](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) - VS Code extension
- [Azure Portal](https://portal.azure.com) - Azure AD management

---

## **Troubleshooting**

### **Authentication Issues**

**Symptom**: Can't sign in with Microsoft account

**Solutions**:

1. Verify all Azure AD credentials in `.env`
2. Check redirect URI matches exactly in Azure Portal
3. Ensure @sirc.sa domain restriction is correct
4. Check browser console for detailed errors
5. Verify database tables (users, accounts) exist

### **Database Connection Failed**

**Symptom**: `PrismaClientInitializationError`

**Solutions**:

```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
bunx prisma db push

# Regenerate client
bunx prisma generate

# Check database is running (Neon/Supabase dashboard)
```

### **Port Already in Use**

**Symptom**: `Error: listen EADDRINUSE: address already in use :::4200`

**Solutions**:

```bash
# Find process using port 4200
netstat -ano | findstr :4200

# Kill process (replace PID)
taskkill /PID <process-id> /F

# Or change port in apps/web/project.json
```

### **Module Not Found**

**Symptom**: `Cannot find module '@prisma/client'`

**Solutions**:

```bash
# Install dependencies
bun install

# Generate Prisma Client
bunx prisma generate

# Clear cache and reinstall
rm -rf node_modules bun.lock
bun install
```

---

## **Contributing**

This project follows these standards:

- **Code Style**: ESLint + Prettier enforced
- **Type Safety**: Strict TypeScript mode
- **Testing**: Jest for units, Playwright for E2E
- **Commits**: Conventional commits recommended
- **Branches**: Feature branches, PR review before merge

---

## **License**

MIT License - See LICENSE file for details

---

## **Support**

- **Project Issues**: Create issue in repository
- **Nx Questions**: [Nx Documentation](https://nx.dev)
- **Next.js Questions**: [Next.js Discussions](https://github.com/vercel/next.js/discussions)
- **Prisma Questions**: [Prisma Discussions](https://github.com/prisma/prisma/discussions)
- **Azure AD Setup**: [Microsoft Docs](https://docs.microsoft.com/azure/active-directory/)

---

**Project Status**: 🟡 Setup Phase - Database & Authentication Configuration
**Next Steps**: See `docs/IMPLEMENTATION_GUIDE.md` for detailed migration steps
**Last Updated**: October 5, 2025

# ✅ Migration to Next.js-Only Architecture Complete

## **Files Created & Updated**

### **✅ Created Files**

1. **`IMPLEMENTATION_GUIDE.md`** - Step-by-step migration instructions
2. **`auth.ts`** - NextAuth.js configuration with Azure AD + @sirc.sa restriction
3. **`prisma/schema.prisma`** - Complete database schema (auth + operations tables)
4. **`.env.example`** - Environment variables template

### **📋 Artifacts Ready** (View in sidebar)

1. **Updated package.json** - New dependencies, removed NestJS, added scripts
2. **Prisma Schema** - Database structure for PostgreSQL
3. **Auth Configuration** - NextAuth.js with Microsoft 365 integration
4. **Updated README.md** - Complete Next.js-only documentation
5. **Implementation Guide** - Detailed migration steps

---

## **Your Next Steps (In Order)**

### **Step 1: Remove NestJS Apps** 🎯 *Start Here*

```bash
cd F:\excel\ops

# Remove NestJS applications using NX CLI
bunx nx g @nx/workspace:remove api
bunx nx g @nx/workspace:remove api-e2e

# Verify only web remains
bunx nx show projects
# Should output: web, web-e2e
```

### **Step 2: Update package.json**

Replace your current `package.json` with the artifact content (copy from sidebar), then:

```bash
# Install new dependencies
bun install

# This will install:
# - next-auth (Azure AD authentication)
# - @prisma/client (database ORM)
# - recharts (charts/visualizations)
# - exceljs (Excel export)
# - zod + react-hook-form (forms/validation)
# - Radix UI components
```

### **Step 3: Remove NestJS Dependencies**

```bash
# Clean up NestJS packages
bun remove @nestjs/common @nestjs/core @nestjs/platform-express
bun remove reflect-metadata rxjs axios
bun remove -D @nestjs/schematics @nestjs/testing @nx/nest @nx/express @nx/node @nx/webpack

# Verify cleanup
cat package.json | grep -i nest
# Should return nothing
```

### **Step 4: Database Setup**

#### **4a. Create PostgreSQL Database**

Choose ONE provider (Recommended: Neon):

**Option A: Neon (Recommended)**
1. Go to https://neon.tech
2. Sign up (free)
3. Create project: "alasla-ops"
4. Copy connection string

**Option B: Supabase**
1. Go to https://supabase.com
2. Create project
3. Get connection string from Settings → Database

**Option C: Railway**
1. Go to https://railway.app
2. Add PostgreSQL service
3. Copy connection string

#### **4b. Configure Environment**

Create `.env` file (use `.env.example` as template):

```bash
# Copy template
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL from Neon/Supabase/Railway
# - NEXTAUTH_SECRET (generate with command below)
# - Azure AD credentials (get in step 5)
```

**Generate NEXTAUTH_SECRET**:
```powershell
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### **4c. Apply Database Schema**

```bash
# Generate Prisma Client
bunx prisma generate

# Push schema to database
bunx prisma db push

# Open Prisma Studio to verify tables
bunx prisma studio
# Opens at http://localhost:5555
# You should see: users, accounts, sessions, materials, equipment, etc.
```

### **Step 5: Azure AD Setup**

#### **5a. Create App Registration**

1. Go to https://portal.azure.com
2. Azure Active Directory → App registrations → New registration
3. **Name**: ALASLA Operations Dashboard
4. **Account types**: Single tenant
5. **Redirect URI**: 
   - Platform: Web
   - URL: `http://localhost:4200/api/auth/callback/azure-ad`
6. Click **Register**

#### **5b. Configure Permissions**

1. **API Permissions** → Add permission
2. Microsoft Graph → Delegated permissions
3. Add: `User.Read`, `email`, `openid`, `profile`
4. **Grant admin consent** (requires admin)

#### **5c. Create Client Secret**

1. **Certificates & secrets** → New client secret
2. Description: "ALASLA Ops"
3. Expires: 24 months
4. **COPY THE VALUE** immediately (shown only once!)

#### **5d. Get IDs**

From Overview page, copy:
- **Application (client) ID** → Put in `.env` as `AZURE_AD_CLIENT_ID`
- **Directory (tenant) ID** → Put in `.env` as `AZURE_AD_TENANT_ID`
- **Client secret value** (from 5c) → Put in `.env` as `AZURE_AD_CLIENT_SECRET`

### **Step 6: Project Structure Setup**

#### **6a. Create Authentication Files**

```bash
# Middleware for auth protection
mkdir -p apps/web/src
cat > apps/web/src/middleware.ts << 'EOF'
export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
EOF

# Database client
mkdir -p apps/web/src/lib
cat > apps/web/src/lib/db.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
EOF
```

#### **6b. Create API Routes**

```bash
cd apps/web/src/app

# Create API structure
mkdir -p api/auth/[...nextauth]
mkdir -p api/materials
mkdir -p api/operations
mkdir -p api/equipment
mkdir -p api/manpower
mkdir -p api/dashboard
mkdir -p api/export

# NextAuth API route
cat > api/auth/[...nextauth]/route.ts << 'EOF'
import { handlers } from "@/auth"
export const { GET, POST } = handlers
EOF
```

### **Step 7: Test the Setup**

```bash
# Start development server
bun run dev

# Server should start on http://localhost:4200
# If you see errors, check:
# 1. DATABASE_URL in .env is correct
# 2. Prisma Client was generated (bunx prisma generate)
# 3. All dependencies installed (bun install)
```

#### **Test Checklist**:
- ✅ Server starts without errors
- ✅ Can open http://localhost:4200 in browser
- ✅ No compilation errors in terminal
- ✅ Prisma Studio works (`bun run db:studio`)

### **Step 8: Create Sign-In Page**

```bash
mkdir -p apps/web/src/app/auth/signin

cat > apps/web/src/app/auth/signin/page.tsx << 'EOF'
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
EOF
```

### **Step 9: Test Authentication**

```bash
# Make sure dev server is running
bun run dev

# Open browser
# Go to: http://localhost:4200/auth/signin
# Click "Sign in with Microsoft"
# Sign in with @sirc.sa account
# Should redirect to dashboard after successful login
# Try non-@sirc.sa account - should be rejected
```

---

## **What's Ready Now**

### **✅ Completed**

1. **Project Architecture** - Next.js-only design approved
2. **Database Schema** - PostgreSQL schema created (9 tables)
3. **Authentication Config** - Azure AD with @sirc.sa restriction
4. **Documentation** - Complete guides and README
5. **Dependencies** - Package.json updated with all required packages
6. **Environment Template** - `.env.example` created

### **📋 In Progress** (Your Tasks)

1. **Remove NestJS** - Use `bunx nx g @nx/workspace:remove`
2. **Install Dependencies** - Run `bun install`
3. **Database Setup** - Choose provider, apply schema
4. **Azure AD Setup** - Create app registration
5. **Test Authentication** - Verify @sirc.sa login works

### **⏳ Next Phase** (After Setup)

1. **Seed Database** - Import materials/equipment from `docs/alasla.csv`
2. **Create Data Entry Forms** - Production, dispatch, equipment, manpower
3. **Build Dashboard** - Charts, metrics, real-time data
4. **Export Features** - Excel and Power BI integration
5. **Deploy to Production** - Vercel deployment

---

## **Quick Commands Reference**

```bash
# Development
bun run dev                    # Start Next.js (http://localhost:4200)
bun run build                  # Build for production
bun run start                  # Start production server

# Database
bun run db:generate            # Generate Prisma Client
bun run db:push                # Push schema to database
bun run db:studio              # Open database GUI
bun run db:migrate             # Create migration
bun run db:seed                # Seed with initial data

# Testing
bun run test                   # Run tests
bun run lint                   # Run linter

# Nx
bunx nx graph                  # View project graph
bunx nx show project web       # Show web project details
bunx nx affected:test          # Test affected projects
```

---

## **Troubleshooting**

### **Issue: Port 4200 Already in Use**

```bash
# Find process
netstat -ano | findstr :4200

# Kill process (replace PID)
taskkill /PID <process-id> /F
```

### **Issue: Prisma Client Not Found**

```bash
# Regenerate
bunx prisma generate

# If still fails
rm -rf node_modules/.prisma
bun install
bunx prisma generate
```

### **Issue: Database Connection Failed**

```bash
# Test connection
bunx prisma db push

# Check .env has correct DATABASE_URL
# Verify database is running (Neon/Supabase dashboard)
```

### **Issue: Authentication Redirects to Error**

1. Verify all Azure AD credentials in `.env`
2. Check redirect URI matches exactly: `http://localhost:4200/api/auth/callback/azure-ad`
3. Ensure API permissions granted (admin consent)
4. Check browser console for detailed error

---

## **Documentation Files**

All documentation is available in your project:

1. **`IMPLEMENTATION_GUIDE.md`** - Detailed step-by-step instructions
2. **`README.md`** - Updated with Next.js-only architecture
3. **`docs/Excel_Data_Analysis.md`** - Data analysis and requirements
4. **`docs/schema.sql`** - Original SQL schema
5. **`docs/comprehensive-erd-system.md`** - Entity relationships
6. **`.env.example`** - Environment variables template

---

## **Timeline Estimate**

- **Today**: Remove NestJS, install dependencies, setup database (1-2 hours)
- **Tomorrow**: Azure AD setup, authentication testing (1-2 hours)
- **Day 3-5**: Data entry forms and API routes (2-3 days)
- **Day 6-7**: Dashboard UI and charts (2 days)
- **Day 8-10**: Export features and testing (3 days)
- **Week 2**: Deployment and user acceptance testing

**Total**: ~10-12 working days for complete MVP

---

## **Success Criteria**

### **Phase 1 Complete When**:
- ✅ NestJS apps removed
- ✅ Dependencies installed
- ✅ Database connected and schema applied
- ✅ Azure AD authentication working
- ✅ Can sign in with @sirc.sa account
- ✅ Non-@sirc.sa accounts rejected

### **Ready to Proceed to Phase 2 When**:
- User can successfully authenticate
- Prisma Studio shows all tables
- Development server runs without errors
- Can access protected routes after login

---

**Current Status**: ✅ Setup files ready - Proceed with Step 1 (Remove NestJS)  
**Next Action**: Run `bunx nx g @nx/workspace:remove api`  
**Need Help?**: Check `IMPLEMENTATION_GUIDE.md` for detailed instructions

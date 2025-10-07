# Alasela CDW Recycling Facility - Operations Management System

## Project Overview

Clean database design and web application for Construction & Demolition Waste (CDW) recycling facility operations management, replacing unstructured Excel-based system with normalized relational database and modern web interface.

**Database**: PostgreSQL 14+  
**Framework**: Next.js 14+ with App Router  
**Package Manager**: Bun (replacing npm)  
**CLI**: NX CLI  
**Authentication**: NextAuth.js  
**Type Safety**: TypeScript with Zod validation

---

## 📁 Project Structure

```
D:\excel\
├── database/
│   ├── schema.sql                 # Complete PostgreSQL schema
│   ├── ANALYSIS_REPORT.md         # Comprehensive analysis documentation
│   ├── README.md                  # This file
│   └── DATA_DICTIONARY.md         # Field-level documentation
├── docs/
│   └── csv/                       # Source CSV data files
│       ├── AlaselaMaster.csv
│       ├── AlaselaDispatched.csv
│       ├── AlaselaEquipment.csv
│       └── AlaselaInventory.csv
└── .github/
    └── prompts/
        └── Excel_Data_Analysis.prompt.md  # Requirements specification
```

---

## 🚀 Quick Start

### Prerequisites

- PostgreSQL 14 or higher
- Bun 1.0+ (install from https://bun.sh)
- Node.js 18+ (for NX CLI)
- Git

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install NX CLI globally
bun add -g nx

# Navigate to project directory
cd D:\excel

# Create database
createdb alasela_ops

# Execute schema
psql -d alasela_ops -f database/schema.sql

# Verify installation
psql -d alasela_ops -c "SELECT COUNT(*) FROM materials;"
# Expected output: 25 materials
```

### Configuration

Create `.env` file in project root:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/alasela_ops"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Application Configuration
NODE_ENV="development"
```

---

## 📊 Database Schema

### Core Entities (7 tables)

1. **materials** - Single source of truth for material taxonomy (25 materials)
2. **production_daily** - Daily production tracking per material
3. **dispatch_transactions** - Individual dispatch event records
4. **inventory_summary** - Periodic inventory reconciliation
5. **equipment** - Equipment master data (10 equipment types)
6. **equipment_attendance** - Daily equipment operational tracking
7. **manpower_attendance** - Daily workforce attendance

### Supporting Tables (6 tables)

- **material_aliases** - Material name variations
- **manpower_roles** - Workforce role definitions
- **operational_metrics** - Operational KPI tracking
- **system_audit_log** - Complete audit trail

### Views (4 views)

- **v_current_inventory** - Real-time stock levels
- **v_daily_production_summary** - Daily production aggregates
- **v_daily_dispatch_summary** - Daily dispatch aggregates
- **v_equipment_utilization** - Equipment usage metrics

---

## 🎯 Material Taxonomy

### 5 Material Categories - 25 Total Materials

#### AGGREGATE (6 materials)
- Aggregate 3/4" (19.05mm)
- Aggregate 1/2" (12.70mm)
- Aggregate 3/8" (9.53mm)
- Aggregate 2" (50.80mm)
- Aggregate 1.5" (38.10mm)
- Aggregate 1" (25.40mm)

#### FINE_MATERIAL (5 materials)
- Zero 3/16" (4.76mm)
- Micro 1/16 (1.59mm)
- 0-5mm (5.00mm)
- Powder
- Sand

#### BASE_MATERIAL (4 materials)
- Subbase
- Sub-grade
- Base Course
- Feed (raw input)

#### SPECIALTY (6 materials)
- Oversize
- Pipe Bedding
- Rapid Draining
- ABC (Aggregate Base Course)
- Sc1(0-38mm)
- Cleaning Powder

#### CUSTOM_BLEND (1 material)
- A1A (Powder + Subbase + Aggregate - per client spec)

---

## 🔗 API Endpoints

### Materials

```
GET    /api/materials              # List all materials
GET    /api/materials/:id          # Get material details
POST   /api/materials              # Create material
PUT    /api/materials/:id          # Update material
DELETE /api/materials/:id          # Soft delete material
```

### Production

```
GET    /api/production             # List production records
GET    /api/production/:date       # Get by date
POST   /api/production             # Create record
PUT    /api/production/:id         # Update record
GET    /api/production/summary/:date  # Daily summary
```

### Dispatch

```
GET    /api/dispatch               # List dispatches
GET    /api/dispatch/:date         # Get by date
POST   /api/dispatch               # Create dispatch
PUT    /api/dispatch/:id           # Update dispatch
GET    /api/dispatch/summary/:date    # Daily summary
```

### Inventory

```
GET    /api/inventory              # List inventory
GET    /api/inventory/current      # Current stock
GET    /api/inventory/:material    # Material history
POST   /api/inventory/calculate    # Recalculate inventory
```

### Equipment & Attendance

```
GET    /api/equipment              # List equipment
POST   /api/equipment              # Add equipment
GET    /api/equipment/attendance   # Attendance records
POST   /api/equipment/attendance   # Record attendance

GET    /api/attendance/manpower    # Manpower attendance
POST   /api/attendance/manpower    # Record attendance
```

**Note**: All endpoints follow `/api/[module]/[resource]` pattern with NO versioning.

---

## 💾 Data Flow

### Daily Operations Workflow

```
1. Daily Data Entry
   └─> Production Records → production_daily table
   └─> Dispatch Records → dispatch_transactions table
   └─> Equipment Attendance → equipment_attendance table
   └─> Manpower Attendance → manpower_attendance table

2. Inventory Calculation (Automatic)
   └─> Triggered by production/dispatch entries
   └─> Formula: Closing = Opening + Production - Dispatched
   └─> Results saved to inventory_summary table

3. Dashboard Updates (Real-time)
   └─> Query from views for aggregated data
   └─> Export to Excel/Power BI on demand
```

### Inventory Calculation Logic

```sql
-- Automated by database trigger
closing_balance = opening_balance + total_production - total_dispatched

-- Example:
-- Opening: 1000 tons
-- Production: +500 tons
-- Dispatched: -300 tons
-- Closing: 1200 tons
```

---

## 🛠️ Development Workflow

### Using Bun (NOT npm)

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Run linting
bun run lint
```

### Using NX CLI

```bash
# Generate new API endpoint
bunx nx generate @nx/next:api-route --name=materials --project=alasela-ops

# Run specific target
bunx nx run alasela-ops:build

# Run tests for specific module
bunx nx test alasela-ops --testFile=materials

# View dependency graph
bunx nx graph
```

### Database Migrations

```bash
# Create migration
bunx prisma migrate dev --name descriptive_name

# Apply migration
bunx prisma migrate deploy

# Reset database (development only)
bunx prisma migrate reset

# Generate Prisma Client
bunx prisma generate
```

---

## 🔐 Authentication Setup

### NextAuth.js Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implement your authentication logic
        // Verify against database user table
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
  },
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## 📈 Dashboard Features

### Production Dashboard
- Daily production by material type
- Production trends (line charts)
- Shift-wise production breakdown
- Top producing materials
- Production efficiency metrics

### Inventory Dashboard
- Current stock levels by material
- Stock movement history
- Low stock alerts
- Inventory turnover rates
- Stock aging analysis

### Dispatch Dashboard
- Daily dispatch summary
- Dispatch by material type
- Trip count analysis
- Delivery performance metrics
- Customer dispatch patterns

### Equipment Dashboard
- Equipment utilization rates
- Operational hours tracking
- Maintenance scheduling alerts
- Equipment availability status
- Downtime analysis

---

## 📤 Export Capabilities

### Web Application Exports
- Real-time dashboard views
- Printable reports
- Shareable dashboard links

### Excel Exports
- Production reports
- Inventory snapshots
- Dispatch logs
- Equipment utilization reports

### Power BI Integration
- Live database connection
- Pre-built report templates
- Custom dashboard creation
- Automated data refresh

---

## ✅ Data Validation Rules

### Production Entry Validation
- ✓ Material must exist in materials table
- ✓ Quantity must be non-negative
- ✓ Date cannot be in future
- ✓ Shift must be valid (Day/Night/D&N)
- ✓ No duplicate entries for same material/date/shift

### Dispatch Entry Validation
- ✓ Material must exist in materials table
- ✓ Net weight must be non-negative
- ✓ Trip count must be positive
- ✓ Date cannot be in future
- ✓ Weight consistency: net = entrance - exit (when provided)

### Inventory Validation
- ✓ Balance equation must hold: closing = opening + production - dispatched
- ✓ All quantities non-negative (negative allowed for A1A custom blend)

### Equipment Validation
- ✓ Units operational <= total unit count
- ✓ Hours operated <= 24 per day
- ✓ Equipment must exist in equipment table

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# Test database models
bun test src/lib/db/models

# Test API endpoints
bun test src/api

# Test business logic
bun test src/lib/services
```

### Integration Tests
```bash
# Test complete workflows
bun test src/tests/integration

# Test API endpoints end-to-end
bun test src/tests/api
```

### Database Tests
```sql
-- Test inventory calculation
INSERT INTO production_daily (material_id, production_date, quantity_tons, shift)
VALUES ('material-uuid', '2025-10-07', 100, 'D&N');

-- Verify trigger fired correctly
SELECT * FROM inventory_summary WHERE summary_date = '2025-10-07';
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: Database connection fails
```bash
# Check PostgreSQL service status
pg_ctl status

# Verify connection string
psql -d alasela_ops -c "SELECT version();"
```

**Issue**: Bun command not found
```bash
# Reinstall Bun
curl -fsSL https://bun.sh/install | bash

# Add to PATH (Linux/Mac)
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Issue**: Foreign key violation on insert
```bash
# Verify material exists before creating production record
SELECT material_id, material_code FROM materials WHERE material_code = 'AGG-3/4';

# If not found, insert material first
INSERT INTO materials (material_code, material_name, category, size_mm)
VALUES ('AGG-3/4', 'Aggregate 3/4"', 'AGGREGATE', 19.05);
```

**Issue**: Inventory balance check fails
```bash
# Check trigger is enabled
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname = 'calculate_inventory_before_insert_or_update';

# If disabled, enable it
ALTER TABLE inventory_summary ENABLE TRIGGER calculate_inventory_before_insert_or_update;
```

---

## 📚 Documentation

- **ANALYSIS_REPORT.md**: Comprehensive database analysis and design decisions
- **DATA_DICTIONARY.md**: Complete field-level documentation
- **schema.sql**: Annotated SQL schema with all constraints
- **API Documentation**: Auto-generated from OpenAPI spec (coming soon)

---

## 🎯 Acceptance Criteria

### Phase 1: Database (✅ COMPLETE)
- ✅ All CSV files analyzed and documented
- ✅ Database schema normalized to 3NF
- ✅ Data relationships clearly mapped
- ✅ Material classification standardized
- ✅ Comprehensive analysis report delivered

### Phase 2: Application (🚧 IN PROGRESS)
- [ ] Web application accepts daily input
- [ ] Dashboards replicate Excel functionality
- [ ] Export capabilities operational (Web, Excel, Power BI)
- [ ] User authentication functional
- [ ] Data integrity validation passes
- [ ] Performance requirements met

---

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow TypeScript strict mode
2. **Commits**: Use conventional commit messages
3. **Testing**: Maintain > 80% code coverage
4. **Documentation**: Update docs with code changes
5. **Review**: All changes require code review

### Branching Strategy

```
main          # Production-ready code
├── develop   # Integration branch
    ├── feature/api-endpoints
    ├── feature/dashboard-ui
    └── feature/export-functionality
```

---

## 📞 Support

For questions or issues:

1. Check **ANALYSIS_REPORT.md** for detailed documentation
2. Review **schema.sql** comments for database specifics
3. Consult **DATA_DICTIONARY.md** for field definitions
4. Contact development team

---

## 📝 License

Internal Use Only - Alasela CDW Recycling Facility

---

## 🏗️ Built With

- [PostgreSQL](https://www.postgresql.org/) - Database
- [Next.js](https://nextjs.org/) - React Framework
- [Bun](https://bun.sh/) - JavaScript Runtime & Package Manager
- [NX](https://nx.dev/) - Build System
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Zod](https://zod.dev/) - Schema Validation
- [TailwindCSS](https://tailwindcss.com/) - Styling

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-07  
**Status**: Database Design Complete - Ready for Application Development

# Excel Operations Dashboard (Ops)

> **Construction Site Operations Management System**
> Data transformation and visualization platform for ALASLA construction site operations

---

## **Project Overview**

This is a full-stack monorepo application built with **Nx** that processes and visualizes construction site operations data from Excel/CSV sources. The system handles:

- **Material dispatch tracking** (aggregates, sand, subbase, etc.)
- **Equipment operations monitoring** (crushers, excavators, loaders)
- **Manpower resource management** (drivers, operators, maintenance)
- **Production metrics analysis** (daily output, inventory balance)
- **Operational reporting** (dashboards, analytics, trends)

**Data Source**: `docs/alasla.csv` - ALASLA construction site July 2025 operations
**Project Type**: Small-scale operational analytics platform
**Architecture**: Nx monorepo with Next.js frontend + NestJS backend

---

## **Technology Stack**

### **Monorepo Management**

- **Nx 21.6.3** - Smart monorepo build system
- **Bun** - Package manager (lock file present)

### **Frontend** (`apps/web`)

- **Next.js 15.2.4** - React framework with App Router
- **React 19.0.0** - UI library
- **Tailwind CSS 3.4.3** - Utility-first styling
- **TypeScript 5.9.2** - Type safety

### **Backend** (`apps/api`)

- **NestJS 11.0** - Progressive Node.js framework
- **Express** - HTTP server
- **TypeScript 5.9.2** - Type safety

### **Testing & Quality**

- **Jest 30.0** - Unit testing framework
- **Playwright** - E2E testing
- **ESLint 9.8** - Code linting
- **Prettier 2.6** - Code formatting

### **Build & Development**

- **Webpack** - Module bundler
- **SWC** - Fast TypeScript/JavaScript compiler
- **Autoprefixer** - CSS vendor prefixing

---

## **Project Structure**

```lua
F:\excel\ops/
├── apps/
│   ├── web/              # Next.js frontend application
│   │   ├── src/
│   │   │   └── app/      # App Router pages
│   │   ├── public/       # Static assets
│   │   └── specs/        # Unit tests
│   │
│   ├── web-e2e/          # Frontend E2E tests (Playwright)
│   │
│   ├── api/              # NestJS backend application
│   │   ├── src/
│   │   │   ├── app/      # Application modules
│   │   │   └── main.ts   # Entry point (runs on port 3000)
│   │   └── dist/         # Build output
│   │
│   └── api-e2e/          # Backend E2E tests
│
├── docs/                 # Project documentation
│   ├── alasla.csv                      # Source data (July 2025)
│   ├── Excel_Data_Analysis.md          # Data analysis report
│   ├── schema.sql                      # Database schema
│   ├── comprehensive-erd-system.md     # Entity relationship diagram
│   ├── comprehensive-dfd-system.md     # Data flow diagram
│   └── Comprehensive_DFD_Schema.md     # DFD specifications
│
├── .nx/                  # Nx cache
├── .vscode/              # VS Code workspace settings
├── node_modules/         # Dependencies
│
├── nx.json               # Nx workspace configuration
├── package.json          # Dependencies & workspace config
├── tsconfig.base.json    # Base TypeScript configuration
├── jest.config.ts        # Jest test configuration
└── eslint.config.mjs     # ESLint configuration
```

---

## **Getting Started**

### **Prerequisites**

Ensure you have installed:

- **Node.js** (version 20.x or higher)
- **Bun** (package manager used in this project)

### **Installation**

```bash
# Clone/navigate to project directory
cd F:\excel\ops

# Install dependencies (if not already done)
bun install
```

### **Development Servers**

#### **Run Frontend (Next.js)**

```bash
# Start web application on http://localhost:4200
npx nx dev web
```

#### **Run Backend (NestJS)**

```bash
# Start API server on http://localhost:3000
npx nx serve api
```

#### **Run Both Simultaneously**

```bash
# Terminal 1 - Frontend
npx nx dev web

# Terminal 2 - Backend
npx nx serve api
```

### **Production Builds**

```bash
# Build frontend
npx nx build web

# Build backend
npx nx build api

# Build all projects
npx nx run-many -t build
```

---

## **Available Commands**

### **Development**

```bash
# Start development server for web app
npx nx dev web

# Start development server for API
npx nx serve api

# Run tests for a specific project
npx nx test web
npx nx test api

# Run E2E tests
npx nx e2e web-e2e
npx nx e2e api-e2e

# Lint code
npx nx lint web
npx nx lint api
```

### **Project Management**

```bash
# View project details
npx nx show project web
npx nx show project api

# View project dependency graph (interactive)
npx nx graph

# List all projects
npx nx show projects

# See what's affected by recent changes
npx nx affected:graph
npx nx affected:test
```

### **Code Generation**

```bash
# Generate a new React component
npx nx g @nx/next:component components/my-component --project=web

# Generate a new NestJS controller
npx nx g @nx/nest:controller my-controller --project=api

# Generate a new NestJS service
npx nx g @nx/nest:service my-service --project=api

# Generate a new shared library
npx nx g @nx/react:lib shared-ui
```

---

## **Current Application Status**

### **Frontend (`apps/web`)**

- ✅ Next.js App Router configured
- ✅ Tailwind CSS styling ready
- ✅ Default welcome page active
- ⏳ Excel data integration pending
- ⏳ Dashboard UI pending
- ⏳ Data visualization pending

**Current Page**: <http://localhost:4200>
**Status**: Default Nx welcome screen

### **Backend (`apps/api`)**

- ✅ NestJS application bootstrapped
- ✅ Basic app module/controller/service scaffolded
- ✅ Global API prefix: `/api`
- ⏳ Database connection pending
- ⏳ Data models pending
- ⏳ REST endpoints pending

**Current Endpoint**: <http://localhost:3000/api>
**Status**: Default welcome endpoint

### **Documentation**

- ✅ Excel data analysis completed (see `docs/Excel_Data_Analysis.md`)
- ✅ Database schema designed (`docs/schema.sql`)
- ✅ ERD diagrams created
- ✅ DFD specifications documented

---

## **Next Steps (Development Roadmap)**

### **Phase 1: Database Setup** 🎯 *Start Here*

```bash
# 1. Choose database system (PostgreSQL recommended)
# 2. Install database dependencies
bun add @nestjs/typeorm typeorm pg

# 3. Apply schema from docs/schema.sql
# 4. Configure database connection in api/src/app/app.module.ts
```

### **Phase 2: Backend Development**

```bash
# 1. Create data entities (TypeORM models)
npx nx g @nx/nest:class entities/material --project=api
npx nx g @nx/nest:class entities/operation --project=api
npx nx g @nx/nest:class entities/equipment --project=api

# 2. Create service layer
npx nx g @nx/nest:service services/material --project=api
npx nx g @nx/nest:service services/operation --project=api

# 3. Create REST controllers
npx nx g @nx/nest:controller controllers/material --project=api
npx nx g @nx/nest:controller controllers/operation --project=api

# 4. Import CSV data from docs/alasla.csv
```

### **Phase 3: Frontend Development**

```bash
# 1. Create dashboard layout
npx nx g @nx/next:component components/dashboard-layout --project=web

# 2. Create data visualization components
npx nx g @nx/next:component components/material-chart --project=web
npx nx g @nx/next:component components/equipment-status --project=web
npx nx g @nx/next:component components/production-metrics --project=web

# 3. Add charting library
bun add recharts

# 4. Connect to API endpoints
```

### **Phase 4: Integration & Testing**

- Connect frontend to backend API
- Implement real-time data updates
- Add error handling and loading states
- Write unit and E2E tests
- Performance optimization

---

## **Why Next.js AND NestJS?**

Good question! Here's the rationale for this small project:

### **Next.js (Frontend)**

- **Server Components**: Efficient data fetching
- **App Router**: Modern routing with layouts
- **Built-in API Routes**: Could handle simple APIs alone

### **NestJS (Backend)**

- **Structured Architecture**: Scalable as project grows
- **TypeScript First**: Type safety across stack
- **Database Integration**: TypeORM, Prisma support out-of-box
- **Dependency Injection**: Clean, testable code
- **Swagger/OpenAPI**: Automatic API documentation

**Decision**: While Next.js alone could handle this, NestJS provides:

1. **Separation of Concerns** - Clear frontend/backend boundary
2. **Database Optimization** - Dedicated layer for data operations
3. **Future Scalability** - Easy to add features (auth, real-time, jobs)
4. **Team Collaboration** - Frontend/backend developers can work independently

---

## **Data Source Information**

**File**: `docs/alasla.csv`
**Period**: July 1-31, 2025
**Site**: ALASLA Construction Site

**Data Categories**:

1. **Dispatched Materials** - 15 material types, 34,770 total tons
2. **Equipment Operations** - 9 equipment types, 1,704 operational hours
3. **Manpower Resources** - 5 workforce categories, 344 total personnel
4. **Production Metrics** - 18 materials produced, 54,240 tons output
5. **Operations Data** - Truck acceptance, segregation operations

**Key Insights** (from analysis):

- Over-dispatch detected in Aggregate 3/4" (-355.4 tons)
- Under-utilization in Subbase (+5,219.5 tons inventory)
- High equipment usage: Front loaders (510 hrs), Dumpers (510 hrs)
- Workforce: 156 maintenance, 154 drivers, 26 operators

See `docs/Excel_Data_Analysis.md` for complete analysis report.

---

## **Useful Resources**

### **Nx Documentation**

- [Nx Documentation](https://nx.dev)
- [Next.js Plugin](https://nx.dev/nx-api/next)
- [NestJS Plugin](https://nx.dev/nx-api/nest)
- [Nx Console (VS Code)](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)

### **Framework Documentation**

- [Next.js 15 Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

### **Project-Specific Docs**

- `docs/Excel_Data_Analysis.md` - Data analysis report
- `docs/schema.sql` - Database schema
- `docs/comprehensive-erd-system.md` - Entity relationships
- `docs/comprehensive-dfd-system.md` - Data flow diagrams

---

## **Development Tips**

### **Nx Performance**

```bash
# Use computation caching
npx nx connect  # Connect to Nx Cloud (optional)

# Run tasks in parallel
npx nx run-many -t test --parallel=3

# Clear Nx cache if needed
npx nx reset
```

### **IDE Setup**

- Install **Nx Console** extension for VS Code
- Configurations already present in `.vscode/` folder
- Use `npx nx show project <name>` to explore project structure

### **Debugging**

- Frontend: Next.js dev server includes React DevTools
- Backend: NestJS logs available in terminal
- Use VS Code debugging configurations (if configured)

---

## **Troubleshooting**

### **Port Conflicts**

```bash
# If port 3000 (API) or 4200 (Web) is in use:

# Check process using port
netstat -ano | findstr :3000
netstat -ano | findstr :4200

# Kill process (Windows)
taskkill /PID <process_id> /F

# Or change port in configuration
```

### **Dependency Issues**

```bash
# Clear node_modules and reinstall
rm -rf node_modules
bun install

# Clear Nx cache
npx nx reset
```

### **Build Errors**

```bash
# Check TypeScript errors
npx nx run-many -t typecheck

# Check for lint issues
npx nx run-many -t lint
```

---

## **Contributing**

This project follows Nx workspace conventions:

1. **Code Style**: ESLint + Prettier configured
2. **Testing**: Jest for unit tests, Playwright for E2E
3. **Type Safety**: TypeScript strict mode enabled
4. **Commit Standards**: Consider conventional commits

---

## **License**

MIT License - See project root for details

---

## **Support**

- **Nx Issues**: [GitHub Issues](https://github.com/nrwl/nx/issues)
- **Next.js Issues**: [GitHub Issues](https://github.com/vercel/next.js/issues)
- **NestJS Issues**: [GitHub Issues](https://github.com/nestjs/nest/issues)

---

**Project Status**: 🟡 Initial Setup Complete - Development Ready
**Last Updated**: October 5, 2025

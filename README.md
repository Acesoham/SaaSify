# 🚀 SaaSify – Multi-Tenant Task Management Platform

A production-grade MERN-stack SaaS application with multi-tenancy, RBAC, real-time collaboration, Kanban boards, analytics dashboards, and a premium dark-themed UI.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React + Vite)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Zustand  │  │  Axios   │  │  Router  │  │Socket.io│ │
│  │  Stores   │  │  Client  │  │          │  │ Client  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────────┐
│                  Server (Express.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Routes   │──│Controller│──│ Services │──│  Models │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │   Auth    │  │  Tenant  │  │   RBAC   │  │Validate│ │
│  │Middleware │  │  Scope   │  │Middleware │  │  (Zod) │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │ MongoDB │    │  Redis   │    │Socket.io │
    │         │    │ (Cache)  │    │  Server  │
    └─────────┘    └──────────┘    └──────────┘
```

## Folder Structure

```
saasify/
├── server/                     # Express.js Backend
│   ├── src/
│   │   ├── config/             # DB, env, logger, swagger
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/          # Auth, RBAC, tenant scope, validation
│   │   ├── models/             # Mongoose schemas (7 collections)
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic layer
│   │   ├── sockets/            # Socket.io event handlers
│   │   ├── validators/         # Zod validation schemas
│   │   ├── scripts/            # Seed data script
│   │   └── index.js            # Server entry point
│   ├── Dockerfile
│   └── package.json
│
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/layout/  # Sidebar, TopBar, AppLayout
│   │   ├── pages/              # 8 page components
│   │   ├── store/              # Zustand state management
│   │   ├── services/           # Axios API client
│   │   ├── App.jsx             # Router & route definitions
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind + glassmorphism styles
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml          # Full stack orchestration
└── README.md
```

## Multi-Tenancy

Every document includes a `tenantId` field. The `tenantScope` middleware:
1. Extracts `x-tenant-id` from request headers
2. Verifies the user has an accepted membership in that tenant
3. Attaches `tenantId` and `userRole` to the request

All service-layer queries are automatically scoped to `tenantId`.

## Collections

| Collection | Purpose |
|---|---|
| **Users** | Authentication credentials and profile |
| **Tenants** | Organizations with plans and settings |
| **Memberships** | User-tenant mapping with roles |
| **Projects** | Work containers within tenants |
| **Tasks** | Kanban items with status/priority/assignees |
| **Comments** | Task discussion threads |
| **ActivityLogs** | Audit trail for all actions |

## RBAC Roles

| Role | Permissions |
|---|---|
| **Admin** | Full access, manage members, update tenant |
| **Member** | Create/update projects and tasks |
| **Viewer** | Read-only access to all resources |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional)

### Local Development

```bash
# 1. Backend
cd server
cp .env.example .env
npm install
npm run dev

# 2. Frontend (new terminal)
cd client
npm install
npm run dev

# 3. Seed data
cd server
npm run seed
```

### Docker Compose

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs

### Demo Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | sarah@acme.com | password123 |
| Member | james@acme.com | password123 |
| Member | emma@acme.com | password123 |
| Viewer | michael@acme.com | password123 |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register + create tenant |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/invite` | Invite user (Admin) |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/kanban` | Kanban board |
| POST | `/api/tasks` | Create task |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/productivity` | Productivity metrics |

Full Swagger docs available at `/api-docs`.

## Tech Stack

**Backend**: Express.js, MongoDB/Mongoose, Socket.io, JWT, Winston, Zod, Helmet  
**Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Zustand, Recharts  
**DevOps**: Docker, docker-compose, nginx

## Security

- JWT access + refresh tokens (httpOnly cookies)
- bcrypt password hashing (12 rounds)
- Helmet.js security headers
- Rate limiting (100 req/15min)
- Zod input validation
- Tenant isolation middleware
- RBAC authorization

## License

MIT

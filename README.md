# StudyCircle

> A collaborative learning platform that connects university students for group study sessions, resource sharing, and academic collaboration.

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Deployment](#deployment)

## Features

- **User Authentication** — Secure JWT-based signup/login with email verification
- **Study Sessions** — Create, join, and manage collaborative study sessions
- **Study Groups** — Public and private groups with real-time group chat
- **Direct Messaging** — Private 1-on-1 messaging between students
- **Resource Sharing** — Upload and share study materials within groups
- **AI Course Assistant** — AI-powered chat for course-specific questions
- **Instructor Platform** — Instructors can manage courses, assignments, announcements, and discussions
- **Real-Time Communication** — Socket.io-powered chat and notifications
- **Responsive Design** — Mobile-first interface built with Tailwind CSS v4

## Tech Stack

### Frontend
- **Framework** — React 19 + React Router v7 (framework mode, SPA)
- **State Management** — Zustand (global stores) + Context API (auth, modals)
- **Data Fetching** — TanStack React Query + Axios
- **Styling** — Tailwind CSS v4 with `tailwind-merge` + `clsx`
- **UI** — Framer Motion (animations), Lucide React (icons), Sonner (toasts)
- **Realtime** — Socket.io Client
- **Build** — Vite 8 + TypeScript 5

### Backend
- **Runtime** — Node.js with Express.js 5
- **Language** — TypeScript 6
- **Database** — PostgreSQL with raw SQL (pg driver)
- **Auth** — JWT with bcryptjs
- **Realtime** — Socket.io
- **Email** — Nodemailer / SendGrid
- **Security** — Helmet, express-rate-limit, CORS
- **Dev** — Nodemon + ts-node

### DevOps
- **Frontend Hosting** — Netlify (SPA with API proxy to Railway)
- **Backend Hosting** — Railway
- **Containerization** — Docker (multi-stage Node 20 Alpine build)

## Project Structure

```
study-circle/
├── backend/
│   ├── src/
│   │   ├── controllers/          # Route handlers (auth, courses, groups, etc.)
│   │   ├── db/
│   │   │   ├── migrations/       # SQL migration files
│   │   │   ├── index.ts          # Database connection pool
│   │   │   ├── init.ts           # Schema initialization
│   │   │   ├── schema.sql        # Base schema
│   │   │   ├── seed.ts           # Database seeder
│   │   │   └── seed_instructor.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # JWT verification
│   │   │   └── validate.middleware.ts
│   │   ├── routes/               # Express route definitions
│   │   ├── services/
│   │   │   ├── ai.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── notification.service.ts
│   │   ├── sockets/
│   │   │   └── chat.socket.ts    # Socket.io chat handler
│   │   └── index.ts              # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── groups/           # CreateGroupModal, GroupDetails
│   │   │   ├── resources/        # ResourceItem
│   │   │   ├── sessions/         # SessionCard
│   │   │   ├── ui/               # Button, Input, AuthForm, AuthModal
│   │   │   ├── AiCourseChat.tsx
│   │   │   ├── GeneralChat.tsx
│   │   │   ├── GroupChat.tsx
│   │   │   ├── MentionTextarea.tsx
│   │   │   ├── PrivateChatModal.tsx
│   │   │   ├── ProtectedRote.tsx
│   │   │   ├── SplashScreen.tsx
│   │   │   └── UserAvatar.tsx
│   │   ├── context/              # AuthContext, AuthModalContext, PrivateChatContext
│   │   ├── layout/               # app_layout, dashboard_layout
│   │   ├── routes/
│   │   │   ├── dashboard/
│   │   │   │   ├── instructor/   # Instructor-specific routes (courses, assignments, etc.)
│   │   │   │   ├── courses.tsx
│   │   │   │   ├── friends.tsx
│   │   │   │   ├── groups.tsx
│   │   │   │   ├── messages.tsx
│   │   │   │   ├── sessions.tsx
│   │   │   │   └── ...           # 18 dashboard route files
│   │   │   ├── legal/            # terms, privacy, guidelines
│   │   │   ├── about.tsx
│   │   │   ├── blog.tsx
│   │   │   ├── contact.tsx
│   │   │   ├── home.tsx
│   │   │   └── verify-email.tsx
│   │   ├── store/                # Zustand stores (chat, group, notification, resource, session)
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/
│   │   ├── app.css
│   │   ├── root.tsx              # App root with meta, splash screen, providers
│   │   └── routes.ts             # React Router route config
│   ├── public/                   # Static assets (icons, manifest, _redirects)
│   ├── react-router.config.ts
│   ├── vite.config.ts
│   ├── netlify.toml
│   └── package.json
│
├── Dockerfile                    # Multi-stage production build
├── netlify.toml                  # Netlify deployment config (frontend)
├── package.json                  # Root workspace with dev/build/start scripts
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **PostgreSQL** >= 14
- **npm** >= 10

### Installation

```bash
# Clone the repository
git clone https://github.com/StackKens/study-circle.git
cd study-circle

# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Environment Variables

**Backend** (`backend/.env`):
```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/studycircle
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@studycircle.app
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_TEMPLATE_ID=your-template-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key
```

### Development

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually:
npm run dev:backend   # Express server on port 5000 / 8080
npm run dev:frontend  # Vite dev server on port 5173
```

### Database

```bash
# Initialize schema and seed data
cd backend
npm run seed
```

### Build

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

---

## Contributing

We welcome contributions from the community. Please follow the guidelines below.

### Getting Started

1. Fork the repository and create a feature branch from `main`.
2. Branch naming convention: `feature/short-description` or `fix/short-description`.
3. Make your changes following the code style guidelines below.
4. Ensure the project type-checks: `npm run typecheck`.
5. Submit a pull request targeting `main`.

### Code Style Guidelines

- **TypeScript** — Strict mode enabled. Avoid `any` unless absolutely necessary. Define shared types in `frontend/app/types/`.
- **React Components** — Use default exports for route components, named exports for shared components. Keep components focused and file-scoped when reasonable.
- **Style** — Use Tailwind utility classes. No CSS modules or styled-components. Use `clsx` + `tailwind-merge` (`cn()` helper) for conditional classes.
- **State** — Use Zustand for global state, Context API for auth/modals, React Query for server state. Avoid prop drilling.
- **API calls** — All API requests go through Axios (instance configured in route files). No raw `fetch`.
- **Backend** — Express routes in `backend/src/routes/`, logic in `backend/src/controllers/`. Keep routes thin.
- **SQL** — Raw SQL with `pg` driver. Migrations go in `backend/src/db/migrations/` with sequential numbering.
- **Formatting** — No Prettier/ESLint config currently. Maintain consistency with the surrounding code. 2-space indentation in backend, 2-space in frontend.

### Commit Convention

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>: <short description>

[optional body]
[optional footer]
```

Allowed types:

| Type       | Usage                                              |
| ---------- | -------------------------------------------------- |
| `feat`     | A new feature                                      |
| `fix`      | A bug fix                                          |
| `chore`    | Maintenance, dependencies, tooling                 |
| `refactor` | Code restructuring without feature or fix          |
| `style`    | Formatting, whitespace (not CSS/UI styles)         |
| `docs`     | Documentation changes                              |
| `perf`     | Performance improvements                           |
| `test`     | Adding or updating tests                           |
| `ui`       | Visual/UI changes (CSS, components, layout)        |
| `db`       | Database migrations or schema changes              |

Examples:

```
feat: add study session recurring schedule
fix: prevent double submission on login form
refactor: extract session card into shared component
db: add assignments migration
docs: update api endpoint references in readme
```

### Pull Request Process

1. Keep PRs small and focused on a single concern.
2. Write a clear PR title and description explaining what and why.
3. Link any related issues.
4. Ensure the PR passes type checking and builds successfully.
5. At least one maintainer review is required before merging.
6. Squash-merge into `main` with a clean conventional commit message.

### What Not to Do

- Do not commit `.env` files or secrets.
- Do not commit `node_modules/` or build artifacts.
- Do not commit large binary files or unnecessary assets.
- Do not force-push to `main`.
- Do not introduce new dependencies without discussion.
- Do not bypass the API layer — no direct database access from the frontend.

### Reporting Issues

Use GitHub Issues to report bugs or request features. Include:
- A clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

---

## Deployment

### Frontend (Netlify)

The frontend is configured in `frontend/netlify.toml`. It builds with `react-router build` and deploys the `build/client` directory as a static SPA. API requests are proxied to the backend on Railway.

### Backend (Railway)

The backend runs as a Node.js server. Set the production environment variables on Railway and deploy from the repository root using the Dockerfile.

---

## Author

Developed by [StackKens](https://github.com/StackKens).

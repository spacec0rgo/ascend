# ✧ Ascend

![Ascend banner](/assets/images/ascend_banner.png)

**A self-hosted web application for tracking certification learning paths through interactive skill trees.** Admins define trees in YAML — users register, log in, mark certifications as obtained, and watch their progress build visually in a node-graph interface backed by PostgreSQL.

---

## Features

### Interactive Skill Trees
Visualize certification paths as directed acyclic graphs powered by ReactFlow, with zoom, pan, minimap, and auto-layout.

![Skill tree layout](/assets/images/ascend_skill_tree.png)

### Progress Tracking

Mark individual certifications as obtained; progress is persisted per account in PostgreSQL and shown with a real-time progress bar.

![Skill tree progress tracking](/assets/images/ascend_progress_tracking.png)

### Account Settings

Update username, email, and password (with live strength indicators and availability checks); upload or remove a custom profile picture (max 2 MB); auto-generated avatars via boring-avatars when no picture is set.

![Account settings](/assets/images/ascend_account_settings.png)

### Dark / Light Mode

Full theme toggle with CSS variable theming throughout the UI.

![Dark theme](/assets/images/ascend_home_page_dark.png)
![Bright theme](/assets/images/ascend_home_page_bright.png)

## Confetti on Completion

A canvas-confetti burst fires when you complete an entire skill tree.

![Ascend completion confetti reward](/assets/images/ascend_completion_confetti.gif)

### And many more

- **YAML-Driven Trees** — Add or update learning paths by dropping a `.yml` file into the `skill-trees/` folder; no database migrations required
- **JWT Authentication** — Stateless auth with bcrypt-hashed passwords; password complexity enforced both client- and server-side
- **Guest Browsing** — Skill trees are publicly viewable without an account; progress tracking requires login
- **Health Endpoint** — `GET /api/health` for container orchestration and uptime monitors
- **Fully Dockerized** — Three-container Docker Compose stack (PostgreSQL 17 + Node.js backend + Nginx-served React frontend) with healthcheck-gated startup

---

## Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18 + ReactFlow + Vite             |
| Backend    | Node.js 18+ + Express                   |
| Database   | PostgreSQL 17                           |
| Auth       | JWT + bcryptjs                          |
| Deployment | Docker Compose (multi-stage Dockerfile) |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) (v2+)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/spacec0rgo/ascend.git
cd ascend
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set your credentials (see [Environment Variables](#environment-variables) for details). At minimum, change `DB_PASSWORD` and `JWT_SECRET` before running in any non-local environment.

### 3. Add your skill trees

Place `.yml` files in the `skill-trees/` directory following the [YAML schema](#yaml-skill-tree-schema). Three example trees are already included: AWS Cloud, Cybersecurity, and Full-Stack Web Development.

### 4. Build and run

```bash
docker compose up --build
```

The application will be available at **http://localhost:4080**.

The backend API runs on port `3030` and the database is internal to the Docker network. On first startup the schema (`users` and `user_certifications` tables) is created automatically.

### Stopping

```bash
docker compose down          # stop containers, keep database volume
docker compose down -v       # stop containers AND delete database volume
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```env
# PostgreSQL credentials
DB_NAME="ascend_db"
DB_USER="ascend_admin"
DB_PASSWORD="ascend_pswd"

# PostgreSQL connection string
# Make sure this matches the DB_* credentials and host above
DATABASE_URL="postgres://ascend_admin:ascend_pswd@db:5432/ascend_db"

# A long, random secret for JWT signing — change this before deploying
JWT_SECRET="change-me-to-a-long-random-string"

# Path to your skill trees directory (relative to docker-compose.yml)
SKILL_TREES_PATH="./skill-trees"
```

> **Security note:** Never commit your real `.env` file. The `.gitignore` already excludes it.

---

## YAML Skill Tree Schema

Each `.yml` file placed in `skill-trees/` becomes one skill tree card on the home page. The **filename without extension** is used as the tree ID (e.g., `aws-cloud.yml` → tree ID `aws-cloud`).

### Full schema

```yaml
name: My Certification Path          # Display name shown on the home card (required)
icon: "🚀"                           # Emoji icon shown alongside the name (optional)
description: A short summary         # Subtitle shown on the home card (optional)

nodes:                               # List of root-level certifications (required)
  - id: entry-cert                   # Unique ID within this tree (required)
    label: Entry Certification       # Display name shown on the node (required)
    description: A short summary     # Tooltip / node subtitle (optional)
    vendor: Issuing Organization     # Vendor badge on the node (optional)
    url: https://example.com/cert    # Link to the official cert page (optional)
    children:                        # Certifications unlocked after this one (optional)
      - id: intermediate-cert
        label: Intermediate Certification
        children:
          - id: advanced-cert
            label: Advanced Certification
```

### Schema rules

- `id` values must be **unique within a tree**; duplicate IDs across different parent nodes are silently deduplicated in the graph (useful for shared prerequisites)
- The tree is a **directed acyclic graph** — a node can appear as a child of multiple parents, e.g., a certification that requires two prerequisites
- Nesting depth is unlimited
- Trees are loaded from the filesystem at request time; no restart or migration is needed to add a new tree

---

## Included Example Skill Trees

These are merely opinionated examples, it will be nice to see more diverse and detailed skill tree files in the future. 

### 🌐 AWS Cloud

Covers the official Amazon Web Services certification ladder from foundational to professional level:

```
AWS Cloud Practitioner
├── Solutions Architect Associate
│   └── Solutions Architect Professional
├── Developer Associate
│   └── DevOps Engineer Professional
└── SysOps Administrator Associate
    └── DevOps Engineer Professional
```

### 🔐 Cybersecurity

A structured path from security fundamentals to advanced offensive security:

```
CompTIA Security+
├── CompTIA CySA+
│   └── CompTIA SecurityX
├── eJPT
│   └── eCPPTv2
│       └── OSCP
└── CEH
```

### 💻 Full-Stack Web Development

Tracks a complete progression from web basics to full-stack architecture:

```
Web Development Fundamentals
├── Modern JavaScript (ES6+)
│   ├── Frontend Specialist (React)
│   │   └── Full-Stack Architect
│   └── Backend Specialist (Node.js)
│       └── Full-Stack Architect
└── UI/UX Design Fundamentals
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint    | Body                            | Description              |
|--------|-------------|---------------------------------|--------------------------|
| POST   | `/register` | `{username, email, password}`   | Register a new user      |
| POST   | `/login`    | `{email, password}`             | Login and receive a JWT  |

Password requirements (enforced on registration and password change): minimum 12 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character.

### Trees — `/api/trees`

| Method | Endpoint                             | Auth?    | Description                                      |
|--------|--------------------------------------|----------|--------------------------------------------------|
| GET    | `/`                                  | No       | List all skill trees (id, name, icon, description only) |
| GET    | `/:treeId`                           | Optional | Full tree with nodes; includes `obtained` flags if authenticated |
| POST   | `/:treeId/certifications/:certId`    | Required | Mark a certification as obtained                 |
| DELETE | `/:treeId/certifications/:certId`    | Required | Mark a certification as not obtained             |

### User — `/api/user`

| Method | Endpoint                   | Auth?    | Description                                        |
|--------|----------------------------|----------|----------------------------------------------------|
| GET    | `/profile`                 | Required | Fetch authenticated user's profile                 |
| PATCH  | `/profile`                 | Required | Update username, email, and/or password            |
| POST   | `/profile-picture`         | Required | Upload a new profile picture (multipart, max 2 MB) |
| DELETE | `/profile-picture`         | Required | Remove profile picture and restore default avatar  |
| GET    | `/check-availability`      | Required | Check if a `?type=username&value=...` is available |

### Health

| Method | Endpoint      | Description              |
|--------|---------------|--------------------------|
| GET    | `/api/health` | Returns `{"status":"ok"}` |

---

## Project Structure

```
ascend/
├── .env.example               ← Environment variable template
├── docker-compose.yml         ← Three-service stack definition
├── Dockerfile                 ← Multi-stage build (backend / frontend-builder / frontend)
├── skill-trees/               ← Drop your .yml skill tree files here
│   ├── aws-cloud.yml
│   ├── cybersecurity.yml
│   └── full-stack_web_development.yml
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js           ← Express entry point, route registration
│       ├── db/
│       │   └── index.js       ← PostgreSQL pool + schema auto-init
│       ├── middleware/
│       │   └── auth.js        ← JWT verification middleware
│       └── routes/
│           ├── auth.js        ← /api/auth/* (register, login)
│           ├── trees.js       ← /api/trees/* (list, view, mark obtained)
│           └── user.js        ← /api/user/* (profile, picture, password)
└── frontend/
    ├── nginx.conf             ← Nginx config (SPA fallback, proxy to backend)
    ├── vite.config.js
    ├── public/
    │   └── images/
    │       └── favicon.svg
    └── src/
        ├── App.jsx            ← Router and layout shell
        ├── index.css          ← Global styles and CSS variable theme tokens
        ├── api/
        │   └── index.js       ← Centralized fetch helpers for all API calls
        ├── context/
        │   ├── AuthContext.jsx    ← User session state (JWT, profile)
        │   └── ThemeContext.jsx   ← Dark/light mode toggle and persistence
        ├── components/
        │   ├── CertNode.jsx       ← ReactFlow custom node (obtained toggle, links)
        │   ├── ConfirmationModal.jsx
        │   ├── Navbar.jsx
        │   └── treeLayout.js      ← Auto-layout algorithm for DAG rendering
        └── pages/
            ├── Home.jsx           ← Tree card gallery
            ├── TreeView.jsx       ← Full interactive graph + progress stats
            ├── Login.jsx
            ├── Register.jsx
            └── AccountSettings.jsx
```

---

## Adding a New Skill Tree

Ascend features **Dynamic Path Discovery**. You do not need to rebuild the containers or restart the backend to add new content.

1. Create a new `.yml` file (e.g., `linux-admin.yml`) in the `skill-trees/` directory.
2. Follow the YAML schema defined above.
3. **Simply refresh the Home page.** The backend dynamically scans the directory and registers new paths on-demand.

---

## Development (without Docker)

If you want to run services locally for active development:

**Backend**

```bash
cd backend
npm install
# Set DATABASE_URL, JWT_SECRET, SKILL_TREES_PATH in your shell or a local .env
npm run dev     # nodemon with hot-reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev     # Vite dev server with HMR on http://localhost:5173
```

Make sure the Vite proxy in `vite.config.js` points to your local backend address.

---

## License

MIT

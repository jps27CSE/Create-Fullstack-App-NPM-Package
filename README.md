# **Create Fullstack App CLI**

CLI to scaffold **fullstack applications** with **React, Next.js, Vue, Angular** on the frontend and **Express** on the backend, with support for **JavaScript** and **TypeScript**. It also supports **MongoDB** or **PostgreSQL integration** using environment variables, including **automatic `.env` creation** with default configurations. Optionally generate **Docker Compose** setup for containerized development.

---

## **Table of Contents**

1. [Installation](#installation)
2. [Usage](#usage)
3. [Features](#features)
4. [Frontend Options](#frontend-options)
5. [Backend Options](#backend-options)
6. [Database Setup](#database-setup)
7. [Docker Setup](#docker-setup)
8. [Linting and Formatting](#linting-and-formatting)
9. [Project Structure](#project-structure)
10. [Running the Project](#running-the-project)
11. [Contributing](#contributing)
12. [License](#license)

---

## **Installation**

> ⚠️ Because the name `create-fullstack-app` is already used on npm,
> you’ll need to **install `devstacker`** before using the command.

### Step 1 — Install the package

You can install it globally (recommended):

```bash
npm install -g devstacker
```

Or install locally in your project folder:

```bash
npm install devstacker
```

### Step 2 — Run the CLI

Once installed, you can run:

```bash
npx create-fullstack-app
```

---

## **Usage**

After running the CLI:

1. Enter your **project name** (default is `my-fullstack-app`).
2. Choose a **frontend framework**: React, Next.js, Vue, Angular.
3. Choose **backend language**: JavaScript or TypeScript.
4. If React is selected, choose **setup tool**: Create React App or Vite.
5. Optionally, choose **MongoDB** or **PostgreSQL** as your database.
6. Optionally, choose to install **Tailwind CSS** for the frontend (not available for Angular).
7. Optionally, choose to install **ESLint and Prettier** for code linting and formatting.
8. Optionally, choose to add **Docker support** with Docker Compose setup.

The CLI will automatically:

- Create a **server** folder with Express setup.
- Create a **client** folder with the chosen frontend framework.
- Create a **root `package.json`** with `npm run dev` to run **frontend + backend concurrently**.
- Automatically **generate a `.env` file** in the `server` folder with default database and PORT configuration if a database is selected.
- Install all required dependencies automatically.

---

## **Features**

- Supports **React, Next.js, Vue, Angular** frontend.
- Supports **JavaScript & TypeScript** backend.
- Optional **MongoDB** or **PostgreSQL** setup with **automatic `.env` creation**.
- Optional **Tailwind CSS** setup for frontend frameworks (except Angular).
- Optional **ESLint and Prettier** setup with automatic configuration files in root, client, and server folders.
- Optional **Docker Compose** setup for containerized development and deployment.
- Automatically installs **concurrently** to run frontend and backend together.
- Default project name, author info, and GitHub link included.

---

## **Frontend Options**

| Framework | Setup Tool          |
| --------- | ------------------- |
| React     | CRA / Vite          |
| Next.js   | TypeScript + ESLint |
| Vue       | Vite                |
| Angular   | Angular CLI         |

---

## **Backend Options**

- **JavaScript**: Express + CORS
- **TypeScript**: Express + CORS + ts-node-dev + types packages
- Optional **MongoDB**: Mongoose + dotenv
- Optional **PostgreSQL**: Prisma + dotenv
- `.env` file automatically created in `server` folder with default:

For MongoDB:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://127.0.0.1:27017/myappDB

# Server Port
PORT=5000
```

For PostgreSQL:

```env
# PostgreSQL Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/myappdb?schema=public"

# Server Port
PORT=5000
```

---

## **Database Setup**

If you chose **MongoDB** during project setup:

1. A `.env` file is **automatically created** in the `server` folder:

```
server/.env
```

2. Example `.env` content:

```env
# MongoDB connection URL (local)
MONGODB_URL=mongodb://127.0.0.1:27017/myappDB

# Backend port
PORT=5000
```

> For MongoDB Atlas, replace with:

```env
MONGODB_URL=mongodb+srv://username:password@cluster0.mongodb.net/myappDB?retryWrites=true&w=majority
```

3. Make sure to **add `.env` to `.gitignore`**:

```
server/.env
```

4. The backend automatically reads this `.env` file on startup.

### PostgreSQL Setup

If you chose **PostgreSQL** during project setup:

1. A `.env` file is **automatically created** in the `server` folder:

```
server/.env
```

2. Example `.env` content:

```env
# PostgreSQL connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/myappdb?schema=public"

# Backend port
PORT=5000
```

> Update the DATABASE_URL with your actual PostgreSQL credentials.

3. A `prisma/schema.prisma` file is created with a basic User model.

4. Prisma scripts are added to `server/package.json`:
   - `npm run prisma:generate` - Generate Prisma client
   - `npm run prisma:db:push` - Push schema to database

5. Make sure to **add `.env` to `.gitignore`**:

```
server/.env
```

6. After updating the DATABASE_URL, run:

```bash
cd server
npm run prisma:db:push
```

This will create the database tables based on your schema.

---

## **Docker Setup**

If you chose to enable **Docker support** during setup, the CLI will generate:

### Generated Docker Files:

1. **`Dockerfile`** in both `server` and `client` directories
   - Backend: Optimized Node.js Alpine image for development
   - Frontend: Multi-stage builds for production optimization
     - Next.js: Native Node.js deployment
     - React/Vue/Angular: Nginx reverse proxy for SPA routing

2. **`docker-compose.yml`** at project root
   - Orchestrates frontend, backend, and optional database services
   - Automatic volume mounting for live code changes
   - Environment variables pre-configured
   - Database networking configured

3. **`DOCKER.md`** - Quick reference guide
   - Commands for running containers
   - Service access points
   - Database connection details
   - Troubleshooting tips

4. **`.dockerignore`** files
   - Excludes `node_modules`, `.git`, etc. for faster builds

### Quick Start with Docker:

```bash
cd my-fullstack-app
docker-compose up
```

**Services will be available at:**

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Database (MongoDB): `localhost:27017`
- Database (PostgreSQL): `localhost:5432`

### Common Docker Compose Commands:

```bash
# Start services in foreground
docker-compose up

# Start services in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Rebuild images
docker-compose build

# Remove containers and volumes
docker-compose down -v
```

### Features:

- **Live Code Reloading**: Changes reflected immediately thanks to volume mounts
- **Database Persistence**: Data persists in Docker volumes
- **Service Networking**: All services communicate via service names
- **Environment Configuration**: Pre-configured environment variables
- **Production Ready**: Multi-stage Docker builds for optimal image sizes

---

## **Linting and Formatting**

If you chose to install **ESLint and Prettier** during setup:

- **ESLint** configurations are created in `root`, `client`, and `server` folders for isolated linting rules.
- **Prettier** configurations ensure consistent code formatting across the project.
- You can run linting and formatting commands in each folder:

```bash
# In root, client, or server folder
npm run lint  # If defined in package.json
npx eslint . --ext .js,.jsx,.ts,.tsx
npx prettier --check .
npx prettier --write .
```

This allows different ESLint rules for frontend (e.g., React-specific) and backend (e.g., Node.js-specific) code.

---

## **Project Structure**

After scaffolding, your project will look like:

```
my-fullstack-app/
├─ client/              # Frontend
│  ├─ Dockerfile        # Frontend container (if Docker enabled)
│  ├─ .dockerignore     # Docker ignore file (if Docker enabled)
│  ├─ nginx.conf        # Nginx config for SPA routing (if Docker enabled, non-Next.js)
│  ├─ .eslintrc.js      # ESLint config (if chosen)
│  └─ .prettierrc       # Prettier config (if chosen)
├─ server/              # Backend
│  ├─ index.js or index.ts
│  ├─ Dockerfile        # Backend container (if Docker enabled)
│  ├─ .dockerignore     # Docker ignore file (if Docker enabled)
│  ├─ .env              # Database config (auto-generated if selected)
│  ├─ prisma/           # Prisma folder (if PostgreSQL selected)
│  │  ├─ schema.prisma
│  │  └─ prisma.config.ts
│  ├─ .eslintrc.js      # ESLint config (if chosen)
│  └─ .prettierrc       # Prettier config (if chosen)
├─ .eslintrc.js         # Root ESLint config (if chosen)
├─ .prettierrc          # Root Prettier config (if chosen)
├─ docker-compose.yml   # Docker Compose orchestration (if Docker enabled)
├─ DOCKER.md            # Docker setup guide (if Docker enabled)
├─ package.json         # Root scripts (dev using concurrently)
└─ README.md
```

---

## **Running the Project**

```bash
cd my-fullstack-app
npm run dev
```

- Backend server: **[http://localhost:5000](http://localhost:5000)**
- Frontend: **[http://localhost:3000](http://localhost:3000)** (depends on framework)

---

## **License**

ISC License
Author: **Jack Pritom Soren**
GitHub: [Jack Pritom Soren](https://github.com/jps27CSE)

---

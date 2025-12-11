# **Create Fullstack App CLI**

CLI to scaffold **fullstack applications** with **React, Next.js, Vue, Angular** on the frontend and **Express** on the backend, with support for **JavaScript** and **TypeScript**. It also supports **MongoDB integration** using environment variables, including **automatic `.env` creation** with default configurations.

---

## **Table of Contents**

1. [Installation](#installation)
2. [Usage](#usage)
3. [Features](#features)
4. [Frontend Options](#frontend-options)
5. [Backend Options](#backend-options)
6. [MongoDB Setup](#mongodb-setup)
7. [Linting and Formatting](#linting-and-formatting)
8. [Project Structure](#project-structure)
9. [Running the Project](#running-the-project)
10. [Contributing](#contributing)
11. [License](#license)

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
5. Optionally, choose **MongoDB** as your database.
6. Optionally, choose to install **ESLint and Prettier** for code linting and formatting.

The CLI will automatically:

- Create a **server** folder with Express setup.
- Create a **client** folder with the chosen frontend framework.
- Create a **root `package.json`** with `npm run dev` to run **frontend + backend concurrently**.
- Automatically **generate a `.env` file** in the `server` folder with default MongoDB and PORT configuration if MongoDB is selected.
- Install all required dependencies automatically.

---

## **Features**

- Supports **React, Next.js, Vue, Angular** frontend.
- Supports **JavaScript & TypeScript** backend.
- Optional **MongoDB** setup with **automatic `.env` creation**.
- Optional **ESLint and Prettier** setup with automatic configuration files in root, client, and server folders.
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
- `.env` file automatically created in `server` folder with default:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://127.0.0.1:27017/myappDB

# Server Port
PORT=5000
```

---

## **MongoDB Setup**

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
│  ├─ .eslintrc.js      # ESLint config (if chosen)
│  └─ .prettierrc       # Prettier config (if chosen)
├─ server/              # Backend
│  ├─ index.js or index.ts
│  ├─ .env              # MongoDB config (auto-generated if selected)
│  ├─ .eslintrc.js      # ESLint config (if chosen)
│  └─ .prettierrc       # Prettier config (if chosen)
├─ .eslintrc.js         # Root ESLint config (if chosen)
├─ .prettierrc          # Root Prettier config (if chosen)
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

MIT License
Author: **Jack Pritom Soren**
GitHub: [Jack Pritom Soren](https://github.com/jps27CSE)

---

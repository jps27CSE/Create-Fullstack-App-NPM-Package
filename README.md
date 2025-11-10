# **Create Fullstack App CLI**

CLI to scaffold **fullstack applications** with **React, Next.js, Vue, Angular** on the frontend and **Express** on the backend, with support for **JavaScript** and **TypeScript**. It also supports **MongoDB integration** using environment variables.

---

## **Table of Contents**

1. [Installation](#installation)
2. [Usage](#usage)
3. [Features](#features)
4. [Frontend Options](#frontend-options)
5. [Backend Options](#backend-options)
6. [MongoDB Setup](#mongodb-setup)
7. [Project Structure](#project-structure)
8. [Running the Project](#running-the-project)
9. [Contributing](#contributing)
10. [License](#license)

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

The CLI will automatically:

- Create a **server** folder with Express setup.
- Create a **client** folder with the chosen frontend framework.
- Create a **root `package.json`** with `npm run dev` to run **frontend + backend concurrently**.
- Install all required dependencies automatically.

---

## **Features**

- Supports **React, Next.js, Vue, Angular** frontend.
- Supports **JavaScript & TypeScript** backend.
- Optional **MongoDB** setup.
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

---

## **MongoDB Setup**

If you chose **MongoDB** during project setup:

1. Create a `.env` file in the `server` folder:

```
server/.env
```

2. Example `.env` content:

```env
# MongoDB connection URL (local)
MONGODB_URL=mongodb://127.0.0.1:27017/myappDB

# Optional: Backend port
PORT=5000
```

> For MongoDB Atlas, use:

```env
MONGODB_URL=mongodb+srv://username:password@cluster0.mongodb.net/myappDB?retryWrites=true&w=majority
```

3. Make sure to **add `.env` to `.gitignore`**:

```
server/.env
```

4. Your backend will automatically connect using this environment variable.

---

## **Project Structure**

After scaffolding, your project will look like:

```
my-fullstack-app/
├─ client/          # Frontend
├─ server/          # Backend
│  ├─ index.js or index.ts
│  └─ .env          # MongoDB config (if selected)
├─ package.json     # Root scripts (dev using concurrently)
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

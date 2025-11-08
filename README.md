---

# **Create Fullstack App CLI**

CLI to scaffold **fullstack applications** with **React, Next.js, Vue, Angular** on the frontend and **Express** on the backend, with support for **JavaScript** and **TypeScript**.

---

## **Table of Contents**

1. [Installation](#installation)
2. [Usage](#usage)
3. [Features](#features)
4. [Frontend Options](#frontend-options)
5. [Backend Options](#backend-options)
6. [Project Structure](#project-structure)
7. [Contributing](#contributing)
8. [License](#license)

---

## **Installation**

You can run the CLI directly using `npx`:

```bash
npx create-fullstack-app
```

> If you have installed globally (optional):

```bash
npm install -g create-fullstack-app
create-fullstack-app
```

---

## **Usage**

After running the CLI:

1. Enter your **project name** (default is `my-fullstack-app`).
2. Choose a **frontend framework**: React, Next.js, Vue, Angular.
3. Choose **backend language**: JavaScript or TypeScript.
4. If React is selected, choose **setup tool**: Create React App or Vite.

The CLI will automatically:

* Create a **server** folder with Express setup.
* Create a **client** folder with the chosen frontend framework.
* Create a **root package.json** with `npm run dev` for running **frontend + backend concurrently**.

---

## **Features**

* Supports **React, Next.js, Vue, Angular** frontend.
* Supports **JavaScript & TypeScript** backend.
* Automatically sets up **concurrently** to run backend and frontend together.
* Automatically installs all **required dependencies**.
* Default project name, author info, and GitHub link included.

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

* **JavaScript**: Express + CORS
* **TypeScript**: Express + CORS + ts-node-dev + types packages

---

## **Project Structure**

After scaffolding, your project will look like:

```
my-fullstack-app/
├─ client/          # Frontend
├─ server/          # Backend
│  ├─ index.js or index.ts
├─ package.json     # Root scripts (dev using concurrently)
└─ README.md
```

---

## **Running the Project**

```bash
cd my-fullstack-app
npm run dev
```

* Runs backend server on **[http://localhost:5000](http://localhost:5000)**
* Runs frontend on **[http://localhost:3000](http://localhost:3000)** (depending on framework)

---

## **License**

MIT License
Author: **Jack Pritom Soren**
GitHub: [Jack Pritom Soren](https://github.com/jps27CSE)

---

#!/usr/bin/env node
import inquirer from "inquirer";
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { fileURLToPath } from "url";

// ✅ Cross-platform package.json path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let version = "unknown";

try {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"),
  );
  version = pkg.version;
} catch (err) {
  console.warn("⚠️ Could not read package.json version:", err.message);
}

// 🐳 DOCKER HELPER FUNCTIONS
function createDockerfiles(rootDir, frontend, backendLang) {
  const serverDir = path.join(rootDir, "server");
  const clientDir = path.join(rootDir, "client");

  // Backend Dockerfile
  const backendDockerfile = `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
`;

  fs.writeFileSync(path.join(serverDir, "Dockerfile"), backendDockerfile);
  fs.writeFileSync(
    path.join(serverDir, ".dockerignore"),
    "node_modules\nnpm-debug.log\n.env\n.git\n",
  );

  // Frontend Dockerfile (multi-stage)
  let frontendDockerfile = "";
  if (frontend === "Next.js") {
    frontendDockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
`;
  } else {
    // React, Vue, Angular with Vite/CRA
    frontendDockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
  }

  fs.writeFileSync(path.join(clientDir, "Dockerfile"), frontendDockerfile);
  fs.writeFileSync(
    path.join(clientDir, ".dockerignore"),
    "node_modules\nnpm-debug.log\n.git\nbuild\ndist\n",
  );

  // Create nginx config for non-Next.js frontends
  if (frontend !== "Next.js") {
    const nginxConf = `user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';

  access_log /var/log/nginx/access.log main;

  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  gzip on;

  server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
      try_files $uri $uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
  }
}
`;
    fs.writeFileSync(path.join(clientDir, "nginx.conf"), nginxConf);
  }
}

function createDockerCompose(rootDir, database) {
  const compose = {
    version: "3.8",
    services: {
      backend: {
        build: "./server",
        container_name: "fullstack-backend",
        ports: ["5000:5000"],
        environment: {
          NODE_ENV: "development",
          PORT: 5000,
          ...(database === "MongoDB" && {
            MONGODB_URL: "mongodb://mongo:27017/myappDB",
          }),
          ...(database === "PostgreSQL" && {
            DATABASE_URL:
              "postgresql://postgres:password@postgres:5432/myappdb?schema=public",
          }),
        },
        volumes: ["./server:/app", "/app/node_modules"],
        ...(database === "MongoDB" && { depends_on: ["mongo"] }),
        ...(database === "PostgreSQL" && { depends_on: ["postgres"] }),
      },
      frontend: {
        build: "./client",
        container_name: "fullstack-frontend",
        ports: ["3000:3000"],
        volumes: ["./client:/app", "/app/node_modules"],
        depends_on: ["backend"],
        environment: {
          REACT_APP_API_URL: "http://localhost:5000",
          VITE_API_URL: "http://localhost:5000",
          NEXT_PUBLIC_API_URL: "http://localhost:5000",
        },
      },
      ...(database === "MongoDB" && {
        mongo: {
          image: "mongo:7",
          container_name: "fullstack-mongo",
          ports: ["27017:27017"],
          volumes: ["mongo_data:/data/db"],
          environment: {
            MONGO_INITDB_DATABASE: "myappDB",
          },
        },
      }),
      ...(database === "PostgreSQL" && {
        postgres: {
          image: "postgres:16-alpine",
          container_name: "fullstack-postgres",
          ports: ["5432:5432"],
          volumes: ["postgres_data:/var/lib/postgresql/data"],
          environment: {
            POSTGRES_USER: "postgres",
            POSTGRES_PASSWORD: "password",
            POSTGRES_DB: "myappdb",
          },
        },
      }),
    },
    volumes: {
      ...(database === "MongoDB" && { mongo_data: {} }),
      ...(database === "PostgreSQL" && { postgres_data: {} }),
    },
  };

  fs.writeFileSync(
    path.join(rootDir, "docker-compose.yml"),
    JSON.stringify(compose, null, 2)
      .replace(/"/g, "'")
      .replace(/'/g, ``)
      .split("\n")
      .map((line) => line.replace(/^  /, ""))
      .join("\n"),
  );

  // Create better formatted docker-compose manually
  const dockerComposeContent = `version: '3.8'

services:
  backend:
    build: ./server
    container_name: fullstack-backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      PORT: 5000
      ${database === "MongoDB" ? "MONGODB_URL: mongodb://mongo:27017/myappDB" : ""}
      ${database === "PostgreSQL" ? "DATABASE_URL: postgresql://postgres:password@postgres:5432/myappdb?schema=public" : ""}
    volumes:
      - ./server:/app
      - /app/node_modules
    ${database === "MongoDB" ? "depends_on:\n      - mongo" : ""}
    ${database === "PostgreSQL" ? "depends_on:\n      - postgres" : ""}

  frontend:
    build: ./client
    container_name: fullstack-frontend
    ports:
      - "3000:3000"
    volumes:
      - ./client:/app
      - /app/node_modules
    depends_on:
      - backend
    environment:
      REACT_APP_API_URL: http://localhost:5000
      VITE_API_URL: http://localhost:5000
      NEXT_PUBLIC_API_URL: http://localhost:5000

  ${
    database === "MongoDB"
      ? `mongo:
    image: mongo:7
    container_name: fullstack-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: myappDB
`
      : ""
  }

  ${
    database === "PostgreSQL"
      ? `postgres:
    image: postgres:16-alpine
    container_name: fullstack-postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myappdb
`
      : ""
  }

volumes:
  ${database === "MongoDB" ? `mongo_data:\n` : ""}
  ${database === "PostgreSQL" ? `postgres_data:\n` : ""}
`;

  fs.writeFileSync(
    path.join(rootDir, "docker-compose.yml"),
    dockerComposeContent,
  );
}

function createDockerReadme(rootDir) {
  const dockerReadme = `# 🐳 Docker Setup Guide

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Running with Docker Compose

\`\`\`bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down
\`\`\`

### Access Services
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Database**: See below for port based on your DB choice

## Database Access (if enabled)

### MongoDB
\`\`\`
Host: localhost:27017
Database: myappDB
\`\`\`

### PostgreSQL
\`\`\`
Host: localhost:5432
User: postgres
Password: password
Database: myappdb
\`\`\`

## Common Docker Commands

\`\`\`bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Run command in a container
docker-compose exec backend npm install new-package

# Rebuild images after dependencies change
docker-compose build

# Remove containers and volumes
docker-compose down -v
\`\`\`

## Development Notes

- Changes to code are automatically reflected due to volume mounts
- `.dockerignore` files exclude unnecessary files from Docker builds
- Database data persists in Docker volumes
- Frontend API URL environment variables are configured to point to backend at http://localhost:5000
`;

  fs.writeFileSync(path.join(rootDir, "DOCKER.md"), dockerReadme);
}

async function main() {
  console.log(
    chalk.cyan(`
🚀 Welcome to Create Fullstack App v${version}
👤 Created by Jack Pritom Soren
🔗 GitHub: https://github.com/jps27CSE
`),
  );

  // 1️⃣ Prompt user choices
  const { projectName, frontend, backendLang, database } =
    await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "Enter your project name:",
        default: "my-fullstack-app",
        validate: (input) =>
          input.trim() !== "" || "Project name cannot be empty",
      },
      {
        type: "list",
        name: "frontend",
        message: "Choose a frontend framework:",
        choices: ["React", "Next.js", "Vue", "Angular"],
      },
      {
        type: "list",
        name: "backendLang",
        message: "Backend language:",
        choices: ["JavaScript", "TypeScript"],
      },
      {
        type: "list",
        name: "database",
        message: "Do you want to add a database?",
        choices: ["None", "MongoDB", "PostgreSQL"],
      },
    ]);

  // 1.5️⃣ Prompt for Tailwind CSS (skip for Next.js as it already asks)
  let installTailwind = false;
  if (frontend !== "Next.js") {
    const { tailwind } = await inquirer.prompt([
      {
        type: "confirm",
        name: "tailwind",
        message: "Do you want to install Tailwind CSS for the frontend?",
        default: false,
      },
    ]);
    installTailwind = tailwind;
  }

  // 1.6️⃣ Prompt for linting tools
  const { installLinting } = await inquirer.prompt([
    {
      type: "confirm",
      name: "installLinting",
      message:
        "Do you want to install default settings for ESLint and Prettier?",
      default: false,
    },
  ]);
  // 1.7️⃣ Prompt for Docker setup
  const { enableDocker } = await inquirer.prompt([
    {
      type: "confirm",
      name: "enableDocker",
      message: "Do you want to add Docker support (docker-compose setup)?",
      default: false,
    },
  ]);
  const rootDir = path.resolve(projectName);
  const serverDir = path.join(rootDir, "server");
  const clientDir = path.join(rootDir, "client");

  fs.ensureDirSync(rootDir);

  // 2️⃣ Setup backend with spinner
  const backendSpinner = ora("📦 Setting up Express backend...").start();
  try {
    fs.ensureDirSync(serverDir);
    await execa("npm", ["init", "-y"], { cwd: serverDir });

    const backendDeps = ["express", "cors"];
    if (database === "MongoDB") backendDeps.push("mongoose", "dotenv");
    else if (database === "PostgreSQL")
      backendDeps.push("@prisma/client", "@prisma/adapter-pg", "pg", "dotenv");
    else backendDeps.push("dotenv"); // always add dotenv to read PORT

    const backendDevDeps =
      backendLang === "TypeScript"
        ? [
            "typescript",
            "ts-node-dev",
            "@types/node",
            "@types/express",
            "@types/cors",
            ...(database === "MongoDB" ? ["@types/dotenv"] : []),
            ...(database === "PostgreSQL" ? ["prisma"] : []),
          ]
        : database === "PostgreSQL"
          ? ["prisma"]
          : [];

    await execa("npm", ["install", ...backendDeps], { cwd: serverDir });
    if (backendDevDeps.length)
      await execa("npm", ["install", "-D", ...backendDevDeps], {
        cwd: serverDir,
      });

    const serverFile = backendLang === "TypeScript" ? "index.ts" : "index.js";

    // >>> Server code updated to read PORT from .env
    let serverCode;
    if (backendLang === "TypeScript") {
      serverCode = `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
${database === "MongoDB" ? "import mongoose from 'mongoose';" : ""}
${database === "PostgreSQL" ? "import { PrismaClient } from '@prisma/client';\nimport { PrismaPg } from '@prisma/adapter-pg';" : ""}

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

${
  database === "MongoDB"
    ? `// MongoDB connection
const mongoURL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/myappDB';
mongoose.connect(mongoURL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));`
    : ""
}
${
  database === "PostgreSQL"
    ? `// Prisma client
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });`
    : ""
}

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Hello from TypeScript Express!'));
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));`;
    } else {
      serverCode = `const express = require('express');
const cors = require('cors');
require('dotenv').config();
${database === "MongoDB" ? "const mongoose = require('mongoose');" : ""}
${database === "PostgreSQL" ? "const { PrismaClient } = require('@prisma/client');\nconst { PrismaPg } = require('@prisma/adapter-pg');" : ""}

const app = express();
app.use(cors());
app.use(express.json());

${
  database === "MongoDB"
    ? `// MongoDB connection
const mongoURL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/myappDB';
mongoose.connect(mongoURL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));`
    : ""
}
${
  database === "PostgreSQL"
    ? `// Prisma client
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });`
    : ""
}

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Hello from Express!'));
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));`;
    }

    fs.writeFileSync(path.join(serverDir, serverFile), serverCode);

    // Create Prisma schema if PostgreSQL
    if (database === "PostgreSQL") {
      const prismaDir = path.join(serverDir, "prisma");
      fs.ensureDirSync(prismaDir);
      const schemaContent = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`;
      fs.writeFileSync(path.join(prismaDir, "schema.prisma"), schemaContent);

      const configContent = `import { defineConfig } from 'prisma/config'
import { env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
`;
      fs.writeFileSync(path.join(prismaDir, "prisma.config.ts"), configContent);
    }

    const serverPackage = JSON.parse(
      fs.readFileSync(path.join(serverDir, "package.json")),
    );
    serverPackage.scripts =
      backendLang === "TypeScript"
        ? { dev: "ts-node-dev index.ts" }
        : { dev: "node index.js" };
    if (database === "PostgreSQL") {
      serverPackage.scripts["prisma:generate"] = "prisma generate";
      serverPackage.scripts["prisma:db:push"] = "prisma db push";
    }
    fs.writeFileSync(
      path.join(serverDir, "package.json"),
      JSON.stringify(serverPackage, null, 2),
    );

    // Add linting tools to server if chosen
    if (installLinting) {
      const serverPkg = JSON.parse(
        fs.readFileSync(path.join(serverDir, "package.json"), "utf-8"),
      );
      serverPkg.devDependencies = {
        ...serverPkg.devDependencies,
        eslint: "^9.39.1",
        prettier: "^3.6.2",
      };
      fs.writeFileSync(
        path.join(serverDir, "package.json"),
        JSON.stringify(serverPkg, null, 2),
      );

      // Create ESLint config for server
      const serverEslintConfig = `module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
  },
};`;
      fs.writeFileSync(
        path.join(serverDir, ".eslintrc.js"),
        serverEslintConfig,
      );

      // Create Prettier config for server
      const serverPrettierConfig = {
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: "es5",
      };
      fs.writeFileSync(
        path.join(serverDir, ".prettierrc"),
        JSON.stringify(serverPrettierConfig, null, 2),
      );
    }

    // >>> .env FILE CREATION
    let envContent = `# Server Port
PORT=5000
`;

    if (database === "MongoDB") {
      envContent = `# MongoDB Configuration
MONGODB_URL=mongodb://127.0.0.1:27017/myappDB

# Server Port
PORT=5000
`;
    } else if (database === "PostgreSQL") {
      envContent = `# PostgreSQL Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/myappdb?schema=public"

# Server Port
PORT=5000
`;
    }

    fs.writeFileSync(path.join(serverDir, ".env"), envContent);
    console.log(chalk.green("📄 .env file created in server folder"));
    // <<< END .env CREATION

    // Generate Prisma client if PostgreSQL
    if (database === "PostgreSQL") {
      try {
        await execa("npx", ["prisma", "generate"], { cwd: serverDir });
        console.log(chalk.green("📄 Prisma client generated"));
      } catch (err) {
        console.warn("⚠️ Could not generate Prisma client:", err.message);
      }
    }

    backendSpinner.succeed("✅ Express backend setup complete!");
  } catch (err) {
    backendSpinner.fail("❌ Failed to setup backend");
    console.error(err);
    process.exit(1);
  }

  // 3️⃣ Setup frontend with spinner
  console.log(chalk.yellow("🎨 Creating frontend..."));
  let clientCmd = "start"; // default frontend command
  let reactType = null;

  try {
    if (frontend === "React") {
      const { setupType } = await inquirer.prompt([
        {
          type: "list",
          name: "setupType",
          message: "Choose React setup:",
          choices: ["Create React App", "Vite"],
        },
      ]);
      reactType = setupType;

      if (reactType === "Create React App") {
        await execa("npx", ["create-react-app", "client"], {
          cwd: rootDir,
          stdio: "inherit",
        });
        clientCmd = "start";

        if (installTailwind) {
          console.log("🎨 Installing Tailwind CSS for Create React App...");
          await execa(
            "npm",
            ["install", "-D", "tailwindcss", "postcss", "autoprefixer"],
            { cwd: clientDir },
          );
          await execa("npx", ["tailwindcss", "init", "-p"], { cwd: clientDir });

          const tailwindConfigPath = path.join(clientDir, "tailwind.config.js");
          if (fs.existsSync(tailwindConfigPath)) {
            let config = fs.readFileSync(tailwindConfigPath, "utf-8");
            config = config.replace(
              "content: []",
              'content: ["./src/**/*.{js,jsx,ts,tsx}"]',
            );
            fs.writeFileSync(tailwindConfigPath, config);
          }

          const indexCssPath = path.join(clientDir, "src", "index.css");
          if (fs.existsSync(indexCssPath)) {
            let css = fs.readFileSync(indexCssPath, "utf-8");
            css =
              "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n" +
              css;
            fs.writeFileSync(indexCssPath, css);
          }
        }
      } else {
        await execa(
          "npm",
          ["create", "vite@latest", "client", "--", "--template", "react"],
          {
            cwd: rootDir,
            stdio: "inherit",
          },
        );

        // ✅ Install dependencies inside client folder
        console.log("📦 Installing React Vite frontend dependencies...");
        await execa("npm", ["install"], {
          cwd: path.join(rootDir, "client"),
          stdio: "inherit",
        });

        if (installTailwind) {
          console.log("🎨 Installing Tailwind CSS for React Vite...");
          await execa("npm", ["install", "tailwindcss", "@tailwindcss/vite"], {
            cwd: clientDir,
          });

          const viteConfigPath = path.join(clientDir, "vite.config.js");
          if (fs.existsSync(viteConfigPath)) {
            let config = fs.readFileSync(viteConfigPath, "utf-8");
            config = config.replace(
              "import { defineConfig } from 'vite'",
              "import { defineConfig } from 'vite'\nimport tailwindcss from '@tailwindcss/vite'",
            );
            config = config.replace(
              "plugins: [",
              "plugins: [\n    tailwindcss(),",
            );
            fs.writeFileSync(viteConfigPath, config);
          }

          const indexCssPath = path.join(clientDir, "src", "index.css");
          if (fs.existsSync(indexCssPath)) {
            let css = fs.readFileSync(indexCssPath, "utf-8");
            css = '@import "tailwindcss";\n' + css;
            fs.writeFileSync(indexCssPath, css);
          }
        }

        clientCmd = "dev"; // Vite uses dev
      }
    } else if (frontend === "Next.js") {
      await execa(
        "npx",
        ["create-next-app@latest", "client", "--typescript", "--eslint"],
        { cwd: rootDir, stdio: "inherit" },
      );
      clientCmd = "dev"; // Next.js uses dev
    } else if (frontend === "Vue") {
      await execa(
        "npm",
        ["create", "vite@latest", "client", "--", "--template", "vue"],
        {
          cwd: rootDir,
          stdio: "inherit",
        },
      );

      // ✅ Install dependencies inside client folder
      console.log("📦 Installing Vue Vite frontend dependencies...");
      await execa("npm", ["install"], {
        cwd: path.join(rootDir, "client"),
        stdio: "inherit",
      });

      if (installTailwind) {
        console.log("🎨 Installing Tailwind CSS for Vue...");
        await execa("npm", ["install", "tailwindcss", "@tailwindcss/vite"], {
          cwd: clientDir,
        });

        const viteConfigPath = path.join(clientDir, "vite.config.js");
        if (fs.existsSync(viteConfigPath)) {
          let config = fs.readFileSync(viteConfigPath, "utf-8");
          config = config.replace(
            "import { defineConfig } from 'vite'",
            "import { defineConfig } from 'vite'\nimport tailwindcss from '@tailwindcss/vite'",
          );
          config = config.replace(
            "plugins: [",
            "plugins: [\n    tailwindcss(),",
          );
          fs.writeFileSync(viteConfigPath, config);
        }

        const styleCssPath = path.join(clientDir, "src", "style.css");
        if (fs.existsSync(styleCssPath)) {
          let css = fs.readFileSync(styleCssPath, "utf-8");
          css = '@import "tailwindcss";\n' + css;
          fs.writeFileSync(styleCssPath, css);
        }
      }

      clientCmd = "dev"; // Vite uses dev
    } else if (frontend === "Angular") {
      await execa("npx", ["@angular/cli", "new", "client", "--skip-git"], {
        cwd: rootDir,
        stdio: "inherit",
      });
      clientCmd = "start"; // Angular uses start
    }
  } catch (err) {
    console.error(`❌ Failed to create ${frontend} frontend`);
    console.error(err);
    process.exit(1);
  }

  // Add linting tools to client if chosen
  if (installLinting) {
    const clientPkgPath = path.join(clientDir, "package.json");
    if (fs.existsSync(clientPkgPath)) {
      const clientPkg = JSON.parse(fs.readFileSync(clientPkgPath, "utf-8"));
      clientPkg.devDependencies = {
        ...clientPkg.devDependencies,
        eslint: "^9.39.1",
        prettier: "^3.6.2",
      };
      fs.writeFileSync(clientPkgPath, JSON.stringify(clientPkg, null, 2));

      // Create ESLint config for client
      const clientEslintConfig = `module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
  },
};`;
      fs.writeFileSync(
        path.join(clientDir, ".eslintrc.js"),
        clientEslintConfig,
      );

      // Create Prettier config for client
      const clientPrettierConfig = {
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: "es5",
      };
      fs.writeFileSync(
        path.join(clientDir, ".prettierrc"),
        JSON.stringify(clientPrettierConfig, null, 2),
      );
    }
  }

  // 4️⃣ Root package.json for dev (after frontend is done)
  console.log(chalk.yellow("🧩 Creating root package.json..."));
  const rootPackage = {
    name: projectName,
    version: "1.0.0",
    scripts: {
      dev: `npx concurrently "npm --prefix server run dev" "npm --prefix client run ${clientCmd}"`,
    },
    devDependencies: {
      concurrently: "^8.2.0",
      ...(installLinting && {
        eslint: "^9.39.1",
        prettier: "^3.6.2",
      }),
    },
  };
  fs.writeFileSync(
    path.join(rootDir, "package.json"),
    JSON.stringify(rootPackage, null, 2),
  );

  // Create linting config files if chosen
  if (installLinting) {
    // .prettierrc
    const prettierConfig = {
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: "es5",
    };
    fs.writeFileSync(
      path.join(rootDir, ".prettierrc"),
      JSON.stringify(prettierConfig, null, 2),
    );

    // .eslintrc.js
    const eslintConfig = `module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
  },
};`;
    fs.writeFileSync(path.join(rootDir, ".eslintrc.js"), eslintConfig);
  }

  // Install concurrently with spinner
  const installSpinner = ora("📦 Installing root dependencies...").start();
  try {
    await execa("npm", ["install"], { cwd: rootDir });
    installSpinner.succeed("✅ Root dependencies installed successfully!");
  } catch (err) {
    installSpinner.fail("❌ Failed to install root dependencies");
    console.error(err);
    process.exit(1);
  }

  // 5️⃣ Setup Docker if enabled
  if (enableDocker) {
    const dockerSpinner = ora("🐳 Setting up Docker files...").start();
    try {
      createDockerfiles(rootDir, frontend, backendLang);
      createDockerCompose(rootDir, database);
      createDockerReadme(rootDir);
      dockerSpinner.succeed("✅ Docker setup complete!");
    } catch (err) {
      dockerSpinner.fail("❌ Failed to setup Docker");
      console.error(err);
    }
  }

  console.log(chalk.green("✅ Fullstack App created successfully!"));
  console.log(
    chalk.blue(`
Next steps:
  cd ${projectName}
  ${enableDocker ? "docker-compose up\nor" : ""}
  npm run dev
`),
  );
}

main().catch((err) => {
  console.error(chalk.red("❌ Error:"), err);
  process.exit(1);
});

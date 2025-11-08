#!/usr/bin/env node
import inquirer from "inquirer";
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

async function main() {
console.log(chalk.cyan(`
🚀 Welcome to Create Fullstack App!
👤 Created by Jack Pritom Soren
🔗 GitHub: https://github.com/jps27CSE
`));


  // 1️⃣ Prompt user choices
  const { projectName, frontend, backendLang } = await inquirer.prompt([
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
  ]);

  const rootDir = path.resolve(projectName);
  const serverDir = path.join(rootDir, "server");
  const clientDir = path.join(rootDir, "client");

  fs.ensureDirSync(rootDir);

  // 2️⃣ Setup backend
  console.log(chalk.yellow("📦 Setting up Express backend..."));
  fs.ensureDirSync(serverDir);
  await execa("npm", ["init", "-y"], { cwd: serverDir });

  const backendDeps = ["express", "cors"];
  const backendDevDeps =
    backendLang === "TypeScript"
      ? ["typescript", "ts-node-dev", "@types/node", "@types/express", "@types/cors"]
      : [];

  await execa("npm", ["install", ...backendDeps], { cwd: serverDir });
  if (backendDevDeps.length)
    await execa("npm", ["install", "-D", ...backendDevDeps], { cwd: serverDir });

  const serverFile = backendLang === "TypeScript" ? "index.ts" : "index.js";
  const serverCode =
    backendLang === "TypeScript"
      ? `import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('Hello from TypeScript Express!'));
app.listen(5000, () => console.log('Server running on http://localhost:5000'));`
      : `const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('Hello from Express!'));
app.listen(5000, () => console.log('Server running on http://localhost:5000'));`;

  fs.writeFileSync(path.join(serverDir, serverFile), serverCode);

  const serverPackage = JSON.parse(
    fs.readFileSync(path.join(serverDir, "package.json"))
  );
  serverPackage.scripts = backendLang === "TypeScript"
    ? { dev: "ts-node-dev index.ts" }
    : { dev: "node index.js" };
  fs.writeFileSync(
    path.join(serverDir, "package.json"),
    JSON.stringify(serverPackage, null, 2)
  );

  // 3️⃣ Setup frontend
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
      await execa("npx", ["create-react-app", "client"], { cwd: rootDir, stdio: "inherit" });
      clientCmd = "start";
    } else {
      await execa("npm", ["create", "vite@latest", "client", "--", "--template", "react"], {
        cwd: rootDir,
        stdio: "inherit",
      });
      clientCmd = "dev"; // Vite uses dev
    }
  } else if (frontend === "Next.js") {
    await execa(
      "npx",
      ["create-next-app@latest", "client", "--typescript", "--eslint"],
      { cwd: rootDir, stdio: "inherit" }
    );
    clientCmd = "dev"; // Next.js uses dev
  } else if (frontend === "Vue") {
    await execa("npm", ["create", "vite@latest", "client", "--", "--template", "vue"], {
      cwd: rootDir,
      stdio: "inherit",
    });
    clientCmd = "dev"; // Vue Vite uses dev
  } else if (frontend === "Angular") {
    await execa("npx", ["@angular/cli", "new", "client", "--skip-git"], {
      cwd: rootDir,
      stdio: "inherit",
    });
    clientCmd = "start"; // Angular uses start
  }
} catch (err) {
  console.error(chalk.red("❌ Frontend setup failed:"), err);
  process.exit(1);
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
  },
};

fs.writeFileSync(path.join(rootDir, "package.json"), JSON.stringify(rootPackage, null, 2));

// Install concurrently
console.log(chalk.yellow("📦 Installing root dependencies..."));
await execa("npm", ["install"], { cwd: rootDir });

console.log(chalk.green("✅ Fullstack App created successfully!"));
console.log(chalk.blue(`
Next steps:
  cd ${projectName}
  npm run dev
`));

}

main().catch((err) => {
  console.error(chalk.red("❌ Error:"), err);
  process.exit(1);
});

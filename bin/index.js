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
        choices: ["None", "MongoDB"],
      },
    ]);

  // 1.5️⃣ Prompt for linting tools
  const { installLinting } = await inquirer.prompt([
    {
      type: "confirm",
      name: "installLinting",
      message:
        "Do you want to install default settings for ESLint and Prettier?",
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
          ]
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

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Hello from TypeScript Express!'));
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));`;
    } else {
      serverCode = `const express = require('express');
const cors = require('cors');
require('dotenv').config();
${database === "MongoDB" ? "const mongoose = require('mongoose');" : ""}

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

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Hello from Express!'));
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));`;
    }

    fs.writeFileSync(path.join(serverDir, serverFile), serverCode);

    const serverPackage = JSON.parse(
      fs.readFileSync(path.join(serverDir, "package.json")),
    );
    serverPackage.scripts =
      backendLang === "TypeScript"
        ? { dev: "ts-node-dev index.ts" }
        : { dev: "node index.js" };
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
    }

    fs.writeFileSync(path.join(serverDir, ".env"), envContent);
    console.log(chalk.green("📄 .env file created in server folder"));
    // <<< END .env CREATION

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

  console.log(chalk.green("✅ Fullstack App created successfully!"));
  console.log(
    chalk.blue(`
Next steps:
  cd ${projectName}
  npm run dev
`),
  );
}

main().catch((err) => {
  console.error(chalk.red("❌ Error:"), err);
  process.exit(1);
});

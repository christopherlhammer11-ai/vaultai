#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const templatesDir = path.join(rootDir, "templates");
const templateVaultPath = path.join(templatesDir, "vault.template.json");
const templateEnvPath = path.join(templatesDir, ".env.example");

const envPath = path.join(rootDir, ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const resolvedVaultPath = process.env.VAULT_PATH
  ? path.resolve(process.env.VAULT_PATH)
  : path.join(rootDir, "vault.json");

const program = new Command();
program
  .name("vaultai")
  .description("Operator-first CLI for VaultAI context management")
  .version("0.1.0");

function copyTemplateFile(source, target, force = false) {
  if (!force && fs.existsSync(target)) {
    return false;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

function ensureVault(force = false) {
  if (!fs.existsSync(templateVaultPath)) {
    throw new Error(`Missing template file: ${templateVaultPath}`);
  }
  const created = copyTemplateFile(templateVaultPath, resolvedVaultPath, force);
  return created;
}

program
  .command("status")
  .description("Show vault + environment info")
  .action(() => {
    const envExists = fs.existsSync(envPath);
    const vaultExists = fs.existsSync(resolvedVaultPath);
    console.log(chalk.bold("VaultAI status"));
    console.log(`  vault path: ${resolvedVaultPath}`);
    console.log(`  vault exists: ${vaultExists ? chalk.green("yes") : chalk.red("no")}`);
    console.log(`  env file: ${envPath}`);
    console.log(`  env exists: ${envExists ? chalk.green("yes") : chalk.yellow("no")}`);
    console.log(`  VAULT_PATH override: ${process.env.VAULT_PATH ? "set" : "not set"}`);
  });

program
  .command("init")
  .description("Create (or recreate) the vault from template")
  .option("-f, --force", "overwrite if vault already exists", false)
  .action((options) => {
    const created = ensureVault(options.force);
    if (created) {
      console.log(chalk.green(`vault.json seeded at ${resolvedVaultPath}`));
    } else {
      console.log(chalk.yellow(`vault already exists at ${resolvedVaultPath}; use --force to overwrite`));
    }
  });

program
  .command("path")
  .description("Print the resolved vault path")
  .action(() => {
    console.log(resolvedVaultPath);
  });

program
  .command("template")
  .description("Copy template files (.env.local, vault.json) if missing")
  .action(() => {
    const envCreated = copyTemplateFile(templateEnvPath, envPath, false);
    const vaultCreated = ensureVault(false);
    if (envCreated) {
      console.log(chalk.green(`.env.local created from templates/.env.example`));
    } else {
      console.log(chalk.gray(`.env.local already exists`));
    }
    if (vaultCreated) {
      console.log(chalk.green(`vault.json created from templates/vault.template.json`));
    } else {
      console.log(chalk.gray(`vault.json already exists`));
    }
  });

program.parse();

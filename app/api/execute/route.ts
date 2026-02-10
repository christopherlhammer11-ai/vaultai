import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs/promises";

const execAsync = promisify(exec);
const personaPath = path.join(os.homedir(), "vault", "persona-chris.md");
const planPath = path.join(os.homedir(), "vault", "vaultai-plan.md");
let cachedPersona = "";

async function readFileSafe(target: string) {
  try {
    return await fs.readFile(target, "utf8");
  } catch (error) {
    throw new Error(`Unable to read ${target}: ${(error as Error).message}`);
  }
}

async function writeFileSafe(target: string, content: string) {
  try {
    await fs.writeFile(target, content, "utf8");
  } catch (error) {
    throw new Error(`Unable to write ${target}: ${(error as Error).message}`);
  }
}

async function runStatus() {
  const { stdout } = await execAsync("node ./bin/vaultai.js status");
  return stdout.trim();
}

function sanitizePath(raw: string) {
  const trimmed = raw.replace(/^['"]|['"]$/g, "");
  if (path.isAbsolute(trimmed)) return trimmed;
  return path.join(process.cwd(), trimmed);
}

export async function POST(req: Request) {
  const { command } = await req.json();
  if (!command || typeof command !== "string") {
    return NextResponse.json({ reply: "No command received." }, { status: 400 });
  }

  const normalized = command.trim();
  const lowered = normalized.toLowerCase();

  try {
    if (lowered.startsWith("read file")) {
      const match = normalized.match(/read file\s+(.+)/i);
      if (!match) throw new Error("Provide a file path after 'read file'.");
      const target = sanitizePath(match[1].trim());
      const content = await readFileSafe(target);
      return NextResponse.json({ reply: `### ${target}\n\n\`\`\`\n${content}\n\`\`\`` });
    }

    if (lowered.includes("load persona")) {
      cachedPersona = await readFileSafe(personaPath);
      return NextResponse.json({ reply: "Persona loaded into memory." });
    }

    if (lowered.includes("tell me about myself")) {
      if (!cachedPersona) {
        cachedPersona = await readFileSafe(personaPath);
      }
      return NextResponse.json({ reply: cachedPersona });
    }

    if (lowered.includes("load plan")) {
      const plan = await readFileSafe(planPath);
      return NextResponse.json({ reply: plan });
    }

    if (lowered.includes("status")) {
      const status = await runStatus();
      return NextResponse.json({ reply: status });
    }

    if (lowered.startsWith("write file")) {
      const match = normalized.match(/write file\s+([^:]+)::(.+)/i);
      if (!match) {
        return NextResponse.json({
          reply: "Use 'write file path :: content' to save text."
        });
      }
      const target = sanitizePath(match[1].trim());
      const content = match[2].trim();
      await writeFileSafe(target, content);
      return NextResponse.json({ reply: `Wrote ${content.length} characters to ${target}.` });
    }

    if (lowered.includes("execute step")) {
      return NextResponse.json({
        reply: "Next step execution placeholder — integrate scheduler or CLI hook."
      });
    }

    return NextResponse.json({ reply: `Echo: ${normalized}` });
  } catch (error) {
    return NextResponse.json(
      { reply: `Command failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

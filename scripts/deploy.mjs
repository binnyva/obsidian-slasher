import { access, copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const obsidianConfigPathByEnv = {
  dev: "/Users/binnyva/Temp/logseq/Sample Vault/.obsidian",
  prod: "/Users/binnyva/PKM/Examined Life/.obsidian",
};

const requiredFiles = ["manifest.json", "main.js", "styles.css"];

async function main() {
  const env = process.argv[2];

  if (!env || !(env in obsidianConfigPathByEnv) || process.argv.length !== 3) {
    throw new Error("Usage: node scripts/deploy.mjs <dev|prod>");
  }

  const manifestPath = path.join(projectRoot, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const pluginId = manifest.id;

  if (!pluginId) {
    throw new Error("manifest.json is missing the plugin id.");
  }

  for (const file of requiredFiles) {
    await access(path.join(projectRoot, file));
  }

  const targetDir = path.join(
    obsidianConfigPathByEnv[env],
    "plugins",
    pluginId,
  );
  await mkdir(targetDir, { recursive: true });

  for (const file of requiredFiles) {
    await copyFile(path.join(projectRoot, file), path.join(targetDir, file));
  }

  console.log(`Deployed ${pluginId} to ${targetDir} (${env})`);
}

await main();

import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const devFolder = '/Users/binnyva/Temp/logseq/Sample Vault/.obsidian/plugins/slasher';
const rawArgs = process.argv.slice(2);
const targetDir = rawArgs[0] ?? devFolder;

if (!targetDir) {
	console.error(
		"Usage: npm run dev-deploy -- /absolute/path/to/.obsidian/plugins/obsidian-slasher",
	);
	console.error(
		"Alternatively set OBSIDIAN_PLUGIN_DEV_DIR and run npm run dev-deploy.",
	);
	process.exit(1);
}

const repoRoot = process.cwd();
const filesToCopy = ["main.js", "manifest.json", "styles.css", "versions.json"];

async function ensureDirectory(directoryPath) {
	try {
		const details = await stat(directoryPath);
		if (!details.isDirectory()) {
			throw new Error(`Target exists but is not a directory: ${directoryPath}`);
		}
	} catch (error) {
		if (error?.code === "ENOENT") {
			await mkdir(directoryPath, { recursive: true });
			return;
		}

		throw error;
	}
}

await ensureDirectory(targetDir);

for (const fileName of filesToCopy) {
	const sourcePath = path.join(repoRoot, fileName);
	const destinationPath = path.join(targetDir, fileName);

	try {
		await copyFile(sourcePath, destinationPath);
		console.log(`Copied ${fileName} -> ${destinationPath}`);
	} catch (error) {
		if (error?.code === "ENOENT") {
			if (fileName === "styles.css" || fileName === "versions.json") {
				continue;
			}

			throw new Error(`Missing required build output: ${sourcePath}`);
		}

		throw error;
	}
}

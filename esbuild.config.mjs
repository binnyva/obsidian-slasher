import esbuild from "esbuild";
import process from "node:process";

const production = process.argv.includes("production");
const watch = !production;

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: ["obsidian"],
	format: "cjs",
	platform: "node",
	target: "es2022",
	logLevel: "info",
	sourcemap: production ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
});

if (watch) {
	await context.watch();
} else {
	await context.rebuild();
	await context.dispose();
}

import test from "node:test";
import assert from "node:assert/strict";

import {
	applySedTransform,
	parseTemplate,
	renderShellCommandTemplate,
	renderTemplate,
	shellEscape,
	TemplateError,
} from "../src/template-engine";
import type { TemplateRuntimeContext } from "../src/types";

function createContext(overrides: Partial<TemplateRuntimeContext> = {}): TemplateRuntimeContext {
	return {
		now: new Date("2026-04-15T10:30:00Z"),
		vault: {
			path: "/vault/root",
			name: "My Vault",
		},
		file: {
			path: "Daily/Note.md",
			name: "Note.md",
			stem: "Note",
			folderPath: "Daily",
			creationDate: new Date("2026-04-01T00:00:00Z"),
			modificationDate: new Date("2026-04-10T00:00:00Z"),
		},
		readClipboard: async () => "clipboard value",
		executeShellCommand: async () => "shell output\n",
		pickDate: async () => new Date("2026-04-20T00:00:00Z"),
		...overrides,
	};
}

test("parseTemplate keeps text around formatted tokens", () => {
	const parsed = parseTemplate("Tomorrow: {tomorrow}|format:yyyy-MM-dd in {filePath}");

	assert.equal(parsed.segments.length, 4);
	assert.equal(parsed.segments[0]?.type, "text");
	assert.equal(parsed.segments[1]?.type, "token");
	assert.equal(parsed.segments[2]?.type, "text");
	assert.equal(parsed.segments[2]?.value, " in ");
});

test("renderTemplate defaults date formatting when format is omitted", async () => {
	const output = await renderTemplate("{today}", createContext());
	assert.equal(output, "2026-04-15");
});

test("renderTemplate supports mixed placeholders and text", async () => {
	const output = await renderTemplate(
		"Tomorrow: {tomorrow}|format:yyyy-MM-dd in {filePath}",
		createContext(),
	);

	assert.equal(output, "Tomorrow: 2026-04-16 in Daily/Note.md");
});

test("applySedTransform handles literal replacement with global flag", () => {
	assert.equal(applySedTransform("foo foo", "/foo/bar/g"), "bar bar");
});

test("renderTemplate chains sed transforms", async () => {
	const output = await renderTemplate(
		"{clipboard}|sed:/clipboard/copied/|sed:/value/text/",
		createContext(),
	);

	assert.equal(output, "copied text");
});

test("renderShellCommandTemplate shell-escapes nested placeholders", async () => {
	const output = await renderShellCommandTemplate(
		"printf %s {vaultPath} {fileName}",
		createContext(),
	);

	assert.equal(output, "printf %s '/vault/root' 'Note.md'");
});

test("renderTemplate allows transforms after command output", async () => {
	const output = await renderTemplate(
		"{command:printf %s {vaultName}}|sed:/shell/processed/",
		createContext({
			executeShellCommand: async (command) => {
				assert.equal(command, "printf %s 'My Vault'");
				return "shell result";
			},
		}),
	);

	assert.equal(output, "processed result");
});

test("renderTemplate throws for cancelled date picker", async () => {
	await assert.rejects(
		() =>
			renderTemplate("{date-picker}|format:yyyy-MM-dd", createContext({
				pickDate: async () => null,
			})),
		(error) => error instanceof TemplateError && error.message === "Date picker was cancelled.",
	);
});

test("renderTemplate throws for invalid syntax", async () => {
	await assert.rejects(
		() => renderTemplate("{today", createContext()),
		(error) => error instanceof TemplateError && error.message === "Unclosed template token.",
	);
});

test("shellEscape wraps and escapes single quotes", () => {
	assert.equal(shellEscape("it's here"), "'it'\"'\"'s here'");
});

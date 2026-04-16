import test from "node:test";
import assert from "node:assert/strict";

import {
	parseTemplate,
	renderShellCommandTemplate,
	renderTemplate,
	shellEscape,
	TemplateError,
	validateTemplateCommand,
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

test("parseTemplate keeps text around Liquid output tags", () => {
	const parsed = parseTemplate(
		'Tomorrow: {{ tomorrow | format: "yyyy-MM-dd" }} in {{ file_path }}',
	);

	assert.equal(parsed.segments.length, 4);
	assert.equal(parsed.segments[0]?.type, "text");
	assert.equal(parsed.segments[1]?.type, "output");
	assert.equal(parsed.segments[2]?.type, "text");
	assert.equal(parsed.segments[2]?.value, " in ");
});

test("renderTemplate formats dates through the format filter", async () => {
	const output = await renderTemplate('{{ today | format: "yyyy-MM-dd" }}', createContext());
	assert.equal(output, "2026-04-15");
});

test("renderTemplate supports mixed placeholders and text", async () => {
	const output = await renderTemplate(
		'Tomorrow: {{ tomorrow | format: "yyyy-MM-dd" }} in {{ file_path }}',
		createContext(),
	);

	assert.equal(output, "Tomorrow: 2026-04-16 in Daily/Note.md");
});

test("renderTemplate chains replace filters", async () => {
	const output = await renderTemplate(
		'{{ clipboard | replace_first: "clipboard", "copied" | replace: "value", "text" }}',
		createContext(),
	);

	assert.equal(output, "copied text");
});

test("renderShellCommandTemplate shell-escapes nested placeholders", async () => {
	const output = await renderShellCommandTemplate(
		"printf %s {{ vault_path }} {{ file_name }}",
		createContext(),
	);

	assert.equal(output, "printf %s '/vault/root' 'Note.md'");
});

test("renderTemplate executes command blocks", async () => {
	const output = await renderTemplate(
		"{% command %}printf %s {{ vault_name }}{% endcommand %}",
		createContext({
			executeShellCommand: async (command) => {
				assert.equal(command, "printf %s 'My Vault'");
				return "processed result";
			},
		}),
	);

	assert.equal(output, "processed result");
});

test("renderTemplate renders date_picker output expressions", async () => {
	const output = await renderTemplate(
		'{{ date_picker | format: "yyyy-MM-dd" }}',
		createContext(),
	);

	assert.equal(output, "2026-04-20");
});

test("renderTemplate still accepts legacy date_picker tags", async () => {
	const output = await renderTemplate(
		'{% date_picker format: "yyyy-MM-dd" %}',
		createContext(),
	);

	assert.equal(output, "2026-04-20");
});

test("renderTemplate throws for cancelled date_picker expressions", async () => {
	await assert.rejects(
		() =>
			renderTemplate('{{ date_picker | format: "yyyy-MM-dd" }}', createContext({
				pickDate: async () => null,
			})),
		(error) => error instanceof TemplateError && error.message === "Date picker was cancelled.",
	);
});

test("renderTemplate requires format for date_picker", async () => {
	await assert.rejects(
		() => renderTemplate("{{ date_picker }}", createContext()),
		(error) =>
			error instanceof TemplateError &&
			error.message === "date_picker must use the format filter before insertion.",
	);
});

test("renderTemplate rejects bare date values without format", async () => {
	await assert.rejects(
		() => renderTemplate("{{ today }}", createContext()),
		(error) =>
			error instanceof TemplateError &&
			error.message === "Date values must use the format filter before insertion.",
	);
});

test("validateTemplateCommand surfaces Liquid syntax errors", () => {
	const issues = validateTemplateCommand("Broken", "{{ today ");

	assert.deepEqual(issues, ["Unclosed Liquid output tag."]);
});

test("renderTemplate rejects unsupported Liquid tags", async () => {
	await assert.rejects(
		() => renderTemplate("{% if today %}x{% endif %}", createContext()),
		(error) =>
			error instanceof TemplateError &&
			error.message === "Unsupported Liquid tag: if today",
	);
});

test("renderTemplate throws for invalid syntax", async () => {
	await assert.rejects(
		() => renderTemplate("{{ today ", createContext()),
		(error) => error instanceof TemplateError && error.message === "Unclosed Liquid output tag.",
	);
});

test("shellEscape wraps and escapes single quotes", () => {
	assert.equal(shellEscape("it's here"), "'it'\"'\"'s here'");
});

import { addDays, format as formatDate } from "date-fns";

import type {
	DateTokenName,
	FileContext,
	ParsedTemplate,
	TemplateRuntimeContext,
	TemplateSegment,
	TokenDescriptor,
	TokenSegment,
	TransformDescriptor,
	VaultTokenName,
} from "./types";

type ResolvedValue =
	| {
			kind: "string";
			value: string;
	  }
	| {
			kind: "date";
			value: Date;
	  };

const DATE_TOKEN_ALIASES: Record<string, DateTokenName> = {
	today: "today",
	tomorrow: "tomorrow",
	tomorow: "tomorrow",
	tommorow: "tomorrow",
	yesterday: "yesterday",
	"file-creation-date": "file-creation-date",
	fileCreationDate: "file-creation-date",
	"file-modification-date": "file-modification-date",
	fileModificationDate: "file-modification-date",
};

const VAULT_TOKENS = new Set<VaultTokenName>([
	"filePath",
	"fileName",
	"fileStem",
	"folderPath",
	"vaultPath",
	"vaultName",
]);

export class TemplateError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TemplateError";
	}
}

export function createDefaultSettings() {
	return {
		version: 1 as const,
		commands: [],
	};
}

export function sanitizeCommandName(name: string): string {
	return name.trim();
}

export function sanitizeTemplate(template: string): string {
	return template.trim();
}

export function validateTemplateCommand(name: string, template: string): string[] {
	const issues: string[] = [];

	if (!sanitizeCommandName(name)) {
		issues.push("Command name is required.");
	}

	if (!sanitizeTemplate(template)) {
		issues.push("Template is required.");
	}

	return issues;
}

export function buildCommandRegistrationId(commandId: string): string {
	return `template-command-${commandId}`;
}

export function parseTemplate(template: string): ParsedTemplate {
	const segments: TemplateSegment[] = [];
	let cursor = 0;

	while (cursor < template.length) {
		const start = template.indexOf("{", cursor);

		if (start === -1) {
			segments.push({
				type: "text",
				value: template.slice(cursor),
			});
			break;
		}

		if (start > cursor) {
			segments.push({
				type: "text",
				value: template.slice(cursor, start),
			});
		}

		const parsedToken = parseTokenSegment(template, start);
		segments.push(parsedToken.segment);
		cursor = parsedToken.nextIndex;
	}

	return { segments };
}

function parseTokenSegment(template: string, start: number): { segment: TokenSegment; nextIndex: number } {
	let depth = 0;
	let end = start;

	for (; end < template.length; end += 1) {
		const character = template[end];
		if (character === "{") {
			depth += 1;
		} else if (character === "}") {
			depth -= 1;
			if (depth === 0) {
				break;
			}
		}
	}

	if (depth !== 0) {
		throw new TemplateError("Unclosed template token.");
	}

	const rawToken = template.slice(start + 1, end).trim();
	if (!rawToken) {
		throw new TemplateError("Empty template token.");
	}

	const token = parseTokenDescriptor(rawToken);
	const { transforms, nextIndex } = parseTransforms(template, end + 1);

	return {
		segment: {
			type: "token",
			raw: template.slice(start, nextIndex),
			token,
			transforms,
		},
		nextIndex,
	};
}

function parseTransforms(template: string, start: number): { transforms: TransformDescriptor[]; nextIndex: number } {
	const transforms: TransformDescriptor[] = [];
	let cursor = start;

	while (template[cursor] === "|") {
		const nameStart = cursor + 1;
		const colonIndex = template.indexOf(":", nameStart);
		if (colonIndex === -1) {
			break;
		}

		const name = template.slice(nameStart, colonIndex).trim();
		if (!name || !/^[a-z-]+$/i.test(name)) {
			break;
		}

		const { argument, nextIndex } = parseTransformArgument(template, colonIndex + 1, name);
		transforms.push({ name, argument });
		cursor = nextIndex;
	}

	return {
		transforms,
		nextIndex: cursor,
	};
}

function looksLikeTransformStart(template: string, index: number): boolean {
	const remainder = template.slice(index + 1);
	return /^[a-z-]+:/i.test(remainder);
}

function parseTransformArgument(template: string, start: number, name: string): { argument: string; nextIndex: number } {
	if (name === "sed") {
		return parseSedArgument(template, start);
	}

	let end = start;
	while (end < template.length) {
		const character = template[end];
		if (character === "|" && looksLikeTransformStart(template, end)) {
			break;
		}
		if (character === "{" || /\s/.test(character)) {
			break;
		}
		end += 1;
	}

	return {
		argument: template.slice(start, end),
		nextIndex: end,
	};
}

function parseSedArgument(template: string, start: number): { argument: string; nextIndex: number } {
	if (template[start] !== "/") {
		throw new TemplateError("sed: expressions must start with '/'.");
	}

	let slashCount = 0;
	let escaped = false;
	let index = start;

	for (; index < template.length; index += 1) {
		const character = template[index];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (character === "\\") {
			escaped = true;
			continue;
		}
		if (character === "/") {
			slashCount += 1;
			if (slashCount === 3) {
				index += 1;
				if (template[index] === "g") {
					index += 1;
				}
				break;
			}
		}
	}

	if (slashCount < 3) {
		throw new TemplateError("sed: expressions must look like /from/to/ or /from/to/g.");
	}

	return {
		argument: template.slice(start, index),
		nextIndex: index,
	};
}

export function parseTokenDescriptor(rawToken: string): TokenDescriptor {
	const trimmed = rawToken.trim();

	if (trimmed.startsWith("command:")) {
		const command = trimmed.slice("command:".length).trim();
		if (!command) {
			throw new TemplateError("Command token requires a shell command.");
		}
		return {
			kind: "command",
			command,
		};
	}

	if (trimmed === "clipboard") {
		return { kind: "clipboard" };
	}

	if (trimmed === "date-picker") {
		return { kind: "date-picker" };
	}

	if (trimmed in DATE_TOKEN_ALIASES) {
		return {
			kind: "date",
			token: DATE_TOKEN_ALIASES[trimmed],
		};
	}

	if (VAULT_TOKENS.has(trimmed as VaultTokenName)) {
		return {
			kind: "vault",
			token: trimmed as VaultTokenName,
		};
	}

	throw new TemplateError(`Unsupported template token: ${trimmed}`);
}

export async function renderTemplate(template: string, context: TemplateRuntimeContext): Promise<string> {
	const parsed = parseTemplate(template);
	let output = "";

	for (const segment of parsed.segments) {
		if (segment.type === "text") {
			output += segment.value;
			continue;
		}

		output += await renderTokenSegment(segment, context);
	}

	return output;
}

async function renderTokenSegment(segment: TokenSegment, context: TemplateRuntimeContext): Promise<string> {
	let resolved = await resolveToken(segment.token, context);
	const hasFormatTransform = segment.transforms.some((transform) => transform.name === "format");

	for (const transform of segment.transforms) {
		resolved = applyTransform(resolved, transform);
	}

	if (resolved.kind === "date" && !hasFormatTransform) {
		resolved = applyTransform(resolved, {
			name: "format",
			argument: "yyyy-MM-dd",
		});
	}

	if (resolved.kind === "date") {
		throw new TemplateError("Date values must be formatted before insertion.");
	}

	return resolved.value;
}

async function resolveToken(token: TokenDescriptor, context: TemplateRuntimeContext): Promise<ResolvedValue> {
	switch (token.kind) {
		case "clipboard":
			return {
				kind: "string",
				value: await context.readClipboard(),
			};
		case "command": {
			const command = await renderShellCommandTemplate(token.command, context);
			return {
				kind: "string",
				value: await context.executeShellCommand(command),
			};
		}
		case "date":
			return {
				kind: "date",
				value: resolveDateToken(token.token, context),
			};
		case "date-picker": {
			const pickedDate = await context.pickDate();
			if (!pickedDate) {
				throw new TemplateError("Date picker was cancelled.");
			}
			return {
				kind: "date",
				value: pickedDate,
			};
		}
		case "vault":
			return {
				kind: "string",
				value: resolveVaultToken(token.token, context),
			};
		default:
			throw new TemplateError("Unsupported token.");
	}
}

export async function renderShellCommandTemplate(template: string, context: TemplateRuntimeContext): Promise<string> {
	const parsed = parseTemplate(template);
	let command = "";

	for (const segment of parsed.segments) {
		if (segment.type === "text") {
			command += segment.value;
			continue;
		}

		const resolved = await resolveToken(segment.token, context);
		if (resolved.kind === "date") {
			throw new TemplateError("Date values are not supported inside shell command templates.");
		}
		command += shellEscape(resolved.value);
	}

	return command;
}

function resolveDateToken(token: DateTokenName, context: TemplateRuntimeContext): Date {
	switch (token) {
		case "today":
			return context.now;
		case "tomorrow":
			return addDays(context.now, 1);
		case "yesterday":
			return addDays(context.now, -1);
		case "file-creation-date":
			return requireFileContext(context.file, "file-creation-date").creationDate;
		case "file-modification-date":
			return requireFileContext(context.file, "file-modification-date").modificationDate;
		default:
			throw new TemplateError("Unsupported date token.");
	}
}

function resolveVaultToken(token: VaultTokenName, context: TemplateRuntimeContext): string {
	switch (token) {
		case "vaultPath":
			return context.vault.path;
		case "vaultName":
			return context.vault.name;
		case "filePath":
			return requireFileContext(context.file, "filePath").path;
		case "fileName":
			return requireFileContext(context.file, "fileName").name;
		case "fileStem":
			return requireFileContext(context.file, "fileStem").stem;
		case "folderPath":
			return requireFileContext(context.file, "folderPath").folderPath;
		default:
			throw new TemplateError("Unsupported vault token.");
	}
}

function requireFileContext(file: FileContext | undefined, token: string): FileContext {
	if (!file) {
		throw new TemplateError(`Token {${token}} requires an active file.`);
	}

	return file;
}

function applyTransform(value: ResolvedValue, transform: TransformDescriptor): ResolvedValue {
	switch (transform.name) {
		case "format":
			if (value.kind !== "date") {
				throw new TemplateError("format: can only be used with date values.");
			}
			return {
				kind: "string",
				value: formatDate(value.value, transform.argument || "yyyy-MM-dd"),
			};
		case "sed":
			if (value.kind !== "string") {
				throw new TemplateError("sed: can only be used with string values.");
			}
			return {
				kind: "string",
				value: applySedTransform(value.value, transform.argument),
			};
		default:
			throw new TemplateError(`Unsupported transform: ${transform.name}`);
	}
}

export function applySedTransform(value: string, expression: string): string {
	const parsed = parseSedExpression(expression);
	const flags = parsed.global ? "g" : "";
	const pattern = new RegExp(escapeForRegExp(parsed.search), flags);
	return value.replace(pattern, parsed.replace);
}

function parseSedExpression(expression: string): { search: string; replace: string; global: boolean } {
	if (!expression.startsWith("/")) {
		throw new TemplateError("sed: expressions must start with '/'.");
	}

	const parts: string[] = [];
	let current = "";
	let escaped = false;

	for (let index = 1; index < expression.length; index += 1) {
		const character = expression[index];

		if (escaped) {
			current += character;
			escaped = false;
			continue;
		}

		if (character === "\\") {
			escaped = true;
			continue;
		}

		if (character === "/") {
			parts.push(current);
			current = "";
			continue;
		}

		current += character;
	}

	if (current) {
		parts.push(current);
	}

	if (parts.length < 2 || parts.length > 3) {
		throw new TemplateError("sed: expressions must look like /from/to/ or /from/to/g.");
	}

	const [search, replace, maybeFlag] = parts;
	return {
		search,
		replace,
		global: maybeFlag === "g",
	};
}

function escapeForRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function shellEscape(value: string): string {
	return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

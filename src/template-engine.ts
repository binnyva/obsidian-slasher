import { addDays, format as formatDate } from "date-fns";

import type {
	FileContext,
	FilterDescriptor,
	OutputExpression,
	ParsedTemplate,
	TemplateRuntimeContext,
	TemplateSegment,
	TemplateVariableName,
} from "./types";

type ParseMode = "root" | "command";

type ResolvedValue =
	| {
			kind: "string";
			value: string;
	  }
	| {
			kind: "date";
			value: Date;
	  };

const OUTPUT_TAG_OPEN = "{{";
const OUTPUT_TAG_CLOSE = "}}";
const TAG_OPEN = "{%";
const TAG_CLOSE = "%}";
const END_COMMAND_TAG = "{% endcommand %}";

const TEMPLATE_VARIABLES = new Set<TemplateVariableName>([
	"today",
	"tomorrow",
	"yesterday",
	"clipboard",
	"file_creation_date",
	"file_modification_date",
	"file_path",
	"file_name",
	"file_stem",
	"folder_path",
	"vault_path",
	"vault_name",
	"date_picker",
]);

const FILTER_ARGUMENT_COUNTS: Record<FilterDescriptor["name"], number> = {
	format: 1,
	replace: 2,
	replace_first: 2,
	replace_regex: 2,
	replace_first_regex: 2,
};

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
		return issues;
	}

	try {
		parseTemplate(template);
	} catch (error) {
		issues.push(error instanceof TemplateError ? error.message : "Template syntax is invalid.");
	}

	return issues;
}

export function buildCommandRegistrationId(commandId: string): string {
	return `template-command-${commandId}`;
}

export function parseTemplate(template: string): ParsedTemplate {
	return parseTemplateInternal(template, "root");
}

function parseTemplateInternal(template: string, mode: ParseMode): ParsedTemplate {
	const segments: TemplateSegment[] = [];
	let cursor = 0;

	while (cursor < template.length) {
		const nextOutput = template.indexOf(OUTPUT_TAG_OPEN, cursor);
		const nextTag = template.indexOf(TAG_OPEN, cursor);
		const nextIndex = findNextTokenIndex(nextOutput, nextTag);

		if (nextIndex === -1) {
			segments.push({
				type: "text",
				value: template.slice(cursor),
			});
			break;
		}

		if (nextIndex > cursor) {
			segments.push({
				type: "text",
				value: template.slice(cursor, nextIndex),
			});
		}

		if (nextIndex === nextOutput) {
			const parsedOutput = parseOutputSegment(template, nextIndex);
			segments.push(parsedOutput.segment);
			cursor = parsedOutput.nextIndex;
			continue;
		}

		const parsedTag = parseTagSegment(template, nextIndex, mode);
		segments.push(parsedTag.segment);
		cursor = parsedTag.nextIndex;
	}

	return { segments };
}

function findNextTokenIndex(nextOutput: number, nextTag: number): number {
	if (nextOutput === -1) {
		return nextTag;
	}

	if (nextTag === -1) {
		return nextOutput;
	}

	return Math.min(nextOutput, nextTag);
}

function parseOutputSegment(template: string, start: number): { segment: TemplateSegment; nextIndex: number } {
	const closeIndex = template.indexOf(OUTPUT_TAG_CLOSE, start + OUTPUT_TAG_OPEN.length);
	if (closeIndex === -1) {
		throw new TemplateError("Unclosed Liquid output tag.");
	}

	const raw = template.slice(start, closeIndex + OUTPUT_TAG_CLOSE.length);
	const expressionSource = template.slice(start + OUTPUT_TAG_OPEN.length, closeIndex).trim();
	if (!expressionSource) {
		throw new TemplateError("Empty Liquid output tag.");
	}

	return {
		segment: {
			type: "output",
			raw,
			expression: parseOutputExpression(expressionSource),
		},
		nextIndex: closeIndex + OUTPUT_TAG_CLOSE.length,
	};
}

function parseTagSegment(
	template: string,
	start: number,
	mode: ParseMode,
): { segment: TemplateSegment; nextIndex: number } {
	const closeIndex = template.indexOf(TAG_CLOSE, start + TAG_OPEN.length);
	if (closeIndex === -1) {
		throw new TemplateError("Unclosed Liquid tag.");
	}

	const rawTag = template.slice(start, closeIndex + TAG_CLOSE.length);
	const tagSource = template.slice(start + TAG_OPEN.length, closeIndex).trim();
	if (!tagSource) {
		throw new TemplateError("Empty Liquid tag.");
	}

	if (tagSource === "command") {
		if (mode === "command") {
			throw new TemplateError("Nested command tags are not supported.");
		}

		const endTagIndex = template.indexOf(END_COMMAND_TAG, closeIndex + TAG_CLOSE.length);
		if (endTagIndex === -1) {
			throw new TemplateError("Unclosed command tag.");
		}

		const bodySource = template.slice(closeIndex + TAG_CLOSE.length, endTagIndex);
		const body = parseTemplateInternal(bodySource, "command");
		return {
			segment: {
				type: "command",
				raw: `${rawTag}${bodySource}${END_COMMAND_TAG}`,
				body,
			},
			nextIndex: endTagIndex + END_COMMAND_TAG.length,
		};
	}

	if (tagSource === "endcommand") {
		throw new TemplateError("Unexpected endcommand tag.");
	}

	if (tagSource.startsWith("date_picker")) {
		if (mode === "command") {
			throw new TemplateError("date_picker is not supported inside command tags.");
		}

		const format = parseDatePickerFormat(tagSource);
		return {
			segment: {
				type: "output",
				raw: rawTag,
				expression: {
					variable: "date_picker",
					filters: [
						{
							name: "format",
							arguments: [format],
						},
					],
				},
			},
			nextIndex: closeIndex + TAG_CLOSE.length,
		};
	}

	throw new TemplateError(`Unsupported Liquid tag: ${tagSource}`);
}

function parseDatePickerFormat(tagSource: string): string {
	let index = "date_picker".length;
	index = skipWhitespace(tagSource, index);

	if (index >= tagSource.length) {
		throw new TemplateError("date_picker requires a format argument.");
	}

	if (!tagSource.startsWith("format", index)) {
		throw new TemplateError("date_picker only supports the format argument.");
	}
	index += "format".length;
	index = skipWhitespace(tagSource, index);

	if (tagSource[index] !== ":") {
		throw new TemplateError("date_picker format must use format: \"...\".");
	}
	index += 1;
	index = skipWhitespace(tagSource, index);

	const { value, nextIndex } = parseQuotedString(tagSource, index);
	index = skipWhitespace(tagSource, nextIndex);

	if (index !== tagSource.length) {
		throw new TemplateError("date_picker only supports a single format argument.");
	}

	return value;
}

function parseOutputExpression(source: string): OutputExpression {
	const parts = splitByPipes(source);
	if (parts.length === 0) {
		throw new TemplateError("Empty Liquid expression.");
	}

	const variable = parts[0]?.trim() ?? "";
	if (!TEMPLATE_VARIABLES.has(variable as TemplateVariableName)) {
		throw new TemplateError(`Unsupported template variable: ${variable}`);
	}

	return {
		variable: variable as TemplateVariableName,
		filters: parts.slice(1).map((part) => parseFilter(part.trim())),
	};
}

function splitByPipes(source: string): string[] {
	const parts: string[] = [];
	let current = "";
	let quote: string | null = null;
	let escaped = false;

	for (const character of source) {
		if (escaped) {
			current += character;
			escaped = false;
			continue;
		}

		if (quote) {
			current += character;
			if (character === "\\") {
				escaped = true;
			} else if (character === quote) {
				quote = null;
			}
			continue;
		}

		if (character === "'" || character === "\"") {
			quote = character;
			current += character;
			continue;
		}

		if (character === "|") {
			parts.push(current);
			current = "";
			continue;
		}

		current += character;
	}

	if (quote) {
		throw new TemplateError("Unclosed string literal in Liquid expression.");
	}

	parts.push(current);
	return parts;
}

function parseFilter(source: string): FilterDescriptor {
	if (!source) {
		throw new TemplateError("Empty Liquid filter.");
	}

	const colonIndex = indexOfUnquoted(source, ":");
	const name = (colonIndex === -1 ? source : source.slice(0, colonIndex)).trim();
	if (!(name in FILTER_ARGUMENT_COUNTS)) {
		throw new TemplateError(`Unsupported filter: ${name}`);
	}

	const expectedArgumentCount = FILTER_ARGUMENT_COUNTS[name as FilterDescriptor["name"]];
	const argsSource = colonIndex === -1 ? "" : source.slice(colonIndex + 1).trim();
	const args = argsSource ? parseFilterArguments(argsSource) : [];

	if (name === "replace_regex" || name === "replace_first_regex") {
		if (args.length < expectedArgumentCount || args.length > expectedArgumentCount + 1) {
			throw new TemplateError(`${name} requires 2 or 3 arguments.`);
		}
	} else if (args.length !== expectedArgumentCount) {
		const suffix = expectedArgumentCount === 1 ? "" : "s";
		throw new TemplateError(`${name} requires ${expectedArgumentCount} argument${suffix}.`);
	}

	return {
		name: name as FilterDescriptor["name"],
		arguments: args,
	};
}

function parseFilterArguments(source: string): string[] {
	const args: string[] = [];
	let index = 0;

	while (index < source.length) {
		index = skipWhitespace(source, index);
		if (index >= source.length) {
			break;
		}

		const parsed = parseQuotedString(source, index);
		args.push(parsed.value);
		index = skipWhitespace(source, parsed.nextIndex);

		if (index >= source.length) {
			break;
		}

		if (source[index] !== ",") {
			throw new TemplateError("Filter arguments must be quoted strings separated by commas.");
		}

		index += 1;
	}

	return args;
}

function parseQuotedString(source: string, index: number): { value: string; nextIndex: number } {
	const quote = source[index];
	if (quote !== "'" && quote !== "\"") {
		throw new TemplateError("String arguments must be wrapped in quotes.");
	}

	let value = "";
	let cursor = index + 1;

	while (cursor < source.length) {
		const character = source[cursor];
		if (character === "\\") {
			const nextCharacter = source[cursor + 1];
			if (nextCharacter === undefined) {
				throw new TemplateError("Invalid escape sequence in string argument.");
			}

			if (nextCharacter === "\\" || nextCharacter === quote) {
				value += nextCharacter;
			} else {
				value += `\\${nextCharacter}`;
			}
			cursor += 2;
			continue;
		}

		if (character === quote) {
			return {
				value,
				nextIndex: cursor + 1,
			};
		}

		value += character;
		cursor += 1;
	}

	throw new TemplateError("Unclosed string argument.");
}

function skipWhitespace(source: string, index: number): number {
	while (index < source.length && /\s/.test(source[index] ?? "")) {
		index += 1;
	}

	return index;
}

function indexOfUnquoted(source: string, target: string): number {
	let quote: string | null = null;
	let escaped = false;

	for (let index = 0; index < source.length; index += 1) {
		const character = source[index];
		if (escaped) {
			escaped = false;
			continue;
		}

		if (quote) {
			if (character === "\\") {
				escaped = true;
			} else if (character === quote) {
				quote = null;
			}
			continue;
		}

		if (character === "'" || character === "\"") {
			quote = character;
			continue;
		}

		if (character === target) {
			return index;
		}
	}

	return -1;
}

export async function renderTemplate(template: string, context: TemplateRuntimeContext): Promise<string> {
	const parsed = parseTemplate(template);
	return renderParsedTemplate(parsed, context, "root");
}

export async function renderShellCommandTemplate(
	template: string,
	context: TemplateRuntimeContext,
): Promise<string> {
	const parsed = parseTemplateInternal(template, "command");
	return renderParsedTemplate(parsed, context, "command");
}

async function renderParsedTemplate(
	parsed: ParsedTemplate,
	context: TemplateRuntimeContext,
	mode: ParseMode,
): Promise<string> {
	let output = "";

	for (const segment of parsed.segments) {
		switch (segment.type) {
			case "text":
				output += segment.value;
				break;
			case "output":
				output += await renderOutputExpression(segment.expression, context, mode);
				break;
			case "command": {
				const command = await renderParsedTemplate(segment.body, context, "command");
				output += await context.executeShellCommand(command);
				break;
			}
			default:
				throw new TemplateError("Unsupported template segment.");
		}
	}

	return output;
}

async function renderOutputExpression(
	expression: OutputExpression,
	context: TemplateRuntimeContext,
	mode: ParseMode,
): Promise<string> {
	if (expression.variable === "date_picker") {
		if (mode === "command") {
			throw new TemplateError("date_picker is not supported inside command tags.");
		}

		const hasFormatFilter = expression.filters.some((filter) => filter.name === "format");
		if (!hasFormatFilter) {
			throw new TemplateError("date_picker must use the format filter before insertion.");
		}
	}

	let resolved = await resolveVariable(expression.variable, context);

	for (const filter of expression.filters) {
		resolved = applyFilter(resolved, filter);
	}

	if (resolved.kind === "date") {
		throw new TemplateError("Date values must use the format filter before insertion.");
	}

	return mode === "command" ? shellEscape(resolved.value) : resolved.value;
}

async function resolveVariable(
	variable: TemplateVariableName,
	context: TemplateRuntimeContext,
): Promise<ResolvedValue> {
	switch (variable) {
		case "clipboard":
			return {
				kind: "string",
				value: await context.readClipboard(),
			};
		case "today":
			return {
				kind: "date",
				value: context.now,
			};
		case "tomorrow":
			return {
				kind: "date",
				value: addDays(context.now, 1),
			};
		case "yesterday":
			return {
				kind: "date",
				value: addDays(context.now, -1),
			};
		case "file_creation_date":
			return {
				kind: "date",
				value: requireFileContext(context.file, "file_creation_date").creationDate,
			};
		case "file_modification_date":
			return {
				kind: "date",
				value: requireFileContext(context.file, "file_modification_date").modificationDate,
			};
		case "vault_path":
			return {
				kind: "string",
				value: context.vault.path,
			};
		case "vault_name":
			return {
				kind: "string",
				value: context.vault.name,
			};
		case "file_path":
			return {
				kind: "string",
				value: requireFileContext(context.file, "file_path").path,
			};
		case "file_name":
			return {
				kind: "string",
				value: requireFileContext(context.file, "file_name").name,
			};
		case "file_stem":
			return {
				kind: "string",
				value: requireFileContext(context.file, "file_stem").stem,
			};
		case "folder_path":
			return {
				kind: "string",
				value: requireFileContext(context.file, "folder_path").folderPath,
			};
		case "date_picker":
			return {
				kind: "date",
				value: await requirePickedDate(context),
			};
		default:
			throw new TemplateError(`Unsupported template variable: ${variable}`);
	}
}

async function requirePickedDate(context: TemplateRuntimeContext): Promise<Date> {
	const pickedDate = await context.pickDate();
	if (!pickedDate) {
		throw new TemplateError("Date picker was cancelled.");
	}

	return pickedDate;
}

function requireFileContext(file: FileContext | undefined, variable: TemplateVariableName): FileContext {
	if (!file) {
		throw new TemplateError(`{{ ${variable} }} requires an active file.`);
	}

	return file;
}

function applyFilter(value: ResolvedValue, filter: FilterDescriptor): ResolvedValue {
	switch (filter.name) {
		case "format":
			if (value.kind !== "date") {
				throw new TemplateError("format can only be used with date values.");
			}
			return {
				kind: "string",
				value: formatDate(value.value, filter.arguments[0] ?? "yyyy-MM-dd"),
			};
		case "replace":
			if (value.kind !== "string") {
				throw new TemplateError("replace can only be used with string values.");
			}
			return {
				kind: "string",
				value: value.value.replaceAll(filter.arguments[0] ?? "", filter.arguments[1] ?? ""),
			};
		case "replace_first":
			if (value.kind !== "string") {
				throw new TemplateError("replace_first can only be used with string values.");
			}
			return {
				kind: "string",
				value: value.value.replace(filter.arguments[0] ?? "", filter.arguments[1] ?? ""),
			};
		case "replace_regex":
			if (value.kind !== "string") {
				throw new TemplateError("replace_regex can only be used with string values.");
			}
			return {
				kind: "string",
				value: value.value.replaceAll(createRegexFilterPattern(filter, true), filter.arguments[1] ?? ""),
			};
		case "replace_first_regex":
			if (value.kind !== "string") {
				throw new TemplateError("replace_first_regex can only be used with string values.");
			}
			return {
				kind: "string",
				value: value.value.replace(createRegexFilterPattern(filter, false), filter.arguments[1] ?? ""),
			};
		default:
			throw new TemplateError(`Unsupported filter: ${filter.name}`);
	}
}

function createRegexFilterPattern(filter: FilterDescriptor, replaceAllMatches: boolean): RegExp {
	const source = filter.arguments[0] ?? "";
	const rawFlags = filter.arguments[2] ?? "";
	const flags = replaceAllMatches
		? ensureRegexFlag(rawFlags, "g")
		: removeRegexFlag(rawFlags, "g");

	try {
		return new RegExp(source, flags);
	} catch (error) {
		const reason = error instanceof Error ? error.message : "Invalid regex.";
		throw new TemplateError(`Invalid regular expression for ${filter.name}: ${reason}`);
	}
}

function ensureRegexFlag(flags: string, flag: string): string {
	return flags.includes(flag) ? flags : `${flags}${flag}`;
}

function removeRegexFlag(flags: string, flag: string): string {
	return [...flags].filter((value) => value !== flag).join("");
}

export function shellEscape(value: string): string {
	return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

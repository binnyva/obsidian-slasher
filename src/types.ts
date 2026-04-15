export interface TemplateCommand {
	id: string;
	name: string;
	template: string;
	enabled: boolean;
}

export interface SlasherSettings {
	version: 1;
	commands: TemplateCommand[];
}

export interface FileContext {
	path: string;
	name: string;
	stem: string;
	folderPath: string;
	creationDate: Date;
	modificationDate: Date;
}

export interface VaultContext {
	path: string;
	name: string;
}

export interface TemplateRuntimeContext {
	now: Date;
	vault: VaultContext;
	file?: FileContext;
	readClipboard: () => Promise<string>;
	executeShellCommand: (command: string) => Promise<string>;
	pickDate: () => Promise<Date | null>;
}

export interface ParsedTemplate {
	segments: TemplateSegment[];
}

export type TemplateSegment = TextSegment | TokenSegment;

export interface TextSegment {
	type: "text";
	value: string;
}

export interface TokenSegment {
	type: "token";
	raw: string;
	token: TokenDescriptor;
	transforms: TransformDescriptor[];
}

export type TokenDescriptor =
	| { kind: "date"; token: DateTokenName }
	| { kind: "clipboard" }
	| { kind: "vault"; token: VaultTokenName }
	| { kind: "command"; command: string }
	| { kind: "date-picker" };

export interface TransformDescriptor {
	name: string;
	argument: string;
}

export type DateTokenName =
	| "today"
	| "tomorrow"
	| "yesterday"
	| "file-creation-date"
	| "file-modification-date";

export type VaultTokenName =
	| "filePath"
	| "fileName"
	| "fileStem"
	| "folderPath"
	| "vaultPath"
	| "vaultName";

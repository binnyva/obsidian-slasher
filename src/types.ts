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

export type TemplateSegment = TextSegment | OutputSegment | CommandSegment;

export interface TextSegment {
	type: "text";
	value: string;
}

export interface OutputSegment {
	type: "output";
	raw: string;
	expression: OutputExpression;
}

export interface CommandSegment {
	type: "command";
	raw: string;
	body: ParsedTemplate;
}

export interface OutputExpression {
	variable: TemplateVariableName;
	filters: FilterDescriptor[];
}

export interface FilterDescriptor {
	name: FilterName;
	arguments: string[];
}

export type FilterName = "format" | "replace" | "replace_first";

export type TemplateVariableName =
	| "today"
	| "tomorrow"
	| "yesterday"
	| "clipboard"
	| "file_creation_date"
	| "file_modification_date"
	| "file_path"
	| "file_name"
	| "file_stem"
	| "folder_path"
	| "vault_path"
	| "vault_name"
	| "date_picker";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
	Editor,
	FileSystemAdapter,
	MarkdownFileInfo,
	Notice,
	Plugin,
	TFile,
} from "obsidian";

import { DatePickerModal } from "./modals";
import { SlasherSettingTab } from "./settings";
import {
	buildCommandRegistrationId,
	createDefaultSettings,
	renderTemplate,
	TemplateError,
	validateTemplateCommand,
} from "./template-engine";
import type { FileContext, SlasherSettings, TemplateCommand, TemplateRuntimeContext, VaultContext } from "./types";

const execFileAsync = promisify(execFile);

export default class SlasherPlugin extends Plugin {
	settings: SlasherSettings = createDefaultSettings();
	private registeredCommandIds: string[] = [];

	override async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new SlasherSettingTab(this));
		await this.rebuildCommands();
	}

	override onunload(): void {
		this.clearRegisteredCommands();
	}

	async addEmptyCommand(): Promise<void> {
		this.settings.commands.push({
			id: this.createCommandId(),
			name: "",
			template: "",
			enabled: true,
		});

		await this.saveSettings();
	}

	async removeCommand(commandId: string): Promise<void> {
		this.settings.commands = this.settings.commands.filter((command) => command.id !== commandId);
		await this.saveSettings();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		await this.rebuildCommands();
	}

	private async loadSettings(): Promise<void> {
		const loaded = await this.loadData();
		const defaults = createDefaultSettings();

		if (!loaded || typeof loaded !== "object") {
			this.settings = defaults;
			return;
		}

		const rawCommands = (loaded as { commands?: unknown }).commands;
		const commands = Array.isArray(rawCommands)
			? rawCommands
					.filter((item: unknown): item is Partial<TemplateCommand> & { id: string } => Boolean(item && typeof item === "object" && "id" in item && typeof item.id === "string"))
					.map((item) => ({
						id: item.id,
						name: typeof item.name === "string" ? item.name : "",
						template: typeof item.template === "string" ? item.template : "",
						enabled: typeof item.enabled === "boolean" ? item.enabled : true,
					}))
			: [];

		this.settings = {
			version: 1,
			commands,
		};
	}

	private createCommandId(): string {
		const randomUuid = globalThis.crypto?.randomUUID?.();
		if (randomUuid) {
			return randomUuid;
		}

		return `template-command-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
	}

	private async rebuildCommands(): Promise<void> {
		this.clearRegisteredCommands();

		for (const command of this.settings.commands) {
			if (!command.enabled || validateTemplateCommand(command.name, command.template).length > 0) {
				continue;
			}

			const registered = this.addCommand({
				id: buildCommandRegistrationId(command.id),
				name: command.name.trim(),
				editorCheckCallback: (checking: boolean, editor: Editor, ctx: MarkdownFileInfo) => {
					if (!editor || !ctx) {
						return false;
					}

					if (!checking) {
						void this.runTemplateCommand(command, editor);
					}

					return true;
				},
			});

			this.registeredCommandIds.push(registered.id);
		}
	}

	private clearRegisteredCommands(): void {
		const commandManager = (this.app as typeof this.app & {
			commands?: {
				commands?: Record<string, unknown>;
				editorCommands?: Record<string, unknown>;
			};
		}).commands;

		for (const commandId of this.registeredCommandIds) {
			delete commandManager?.commands?.[commandId];
			delete commandManager?.editorCommands?.[commandId];
		}

		this.registeredCommandIds = [];
	}

	private async runTemplateCommand(command: TemplateCommand, editor: Editor): Promise<void> {
		try {
			const runtimeContext = this.createRuntimeContext();
			const output = await renderTemplate(command.template, runtimeContext);
			editor.replaceSelection(output);
		} catch (error) {
			const message = error instanceof TemplateError ? error.message : "Failed to render template.";
			new Notice(`Slasher: ${message}`);
			console.error("Slasher command failed", error);
		}
	}

	private createRuntimeContext(): TemplateRuntimeContext {
		return {
			now: new Date(),
			vault: this.getVaultContext(),
			file: this.getActiveFileContext(),
			readClipboard: () => this.readClipboard(),
			executeShellCommand: (command) => this.executeShellCommand(command),
			pickDate: () => this.pickDate(),
		};
	}

	private getVaultContext(): VaultContext {
		const adapter = this.app.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			throw new TemplateError("This plugin requires the desktop file system adapter.");
		}

		return {
			name: this.app.vault.getName(),
			path: adapter.getBasePath(),
		};
	}

	private getActiveFileContext(): FileContext | undefined {
		const activeFile = this.app.workspace.getActiveFile();
		if (!(activeFile instanceof TFile)) {
			return undefined;
		}

		return {
			path: activeFile.path,
			name: activeFile.name,
			stem: activeFile.basename,
			folderPath: activeFile.parent?.path === "/" ? "" : activeFile.parent?.path ?? "",
			creationDate: new Date(activeFile.stat.ctime),
			modificationDate: new Date(activeFile.stat.mtime),
		};
	}

	private async readClipboard(): Promise<string> {
		if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
			return navigator.clipboard.readText();
		}

		const electron = (window as Window & {
			require?: (module: string) => { clipboard?: { readText: () => string } } | undefined;
		}).require?.("electron");
		if (electron?.clipboard) {
			return electron.clipboard.readText();
		}

		throw new TemplateError("Clipboard access is unavailable.");
	}

	private async executeShellCommand(command: string): Promise<string> {
		const shell = process.env.SHELL ?? "/bin/bash";
		const vault = this.getVaultContext();

		try {
			const { stdout } = await execFileAsync(shell, ["-lc", command], {
				cwd: vault.path,
				maxBuffer: 1024 * 1024,
			});
			return stdout.replace(/\r?\n$/, "");
		} catch (error) {
			throw new TemplateError(
				error instanceof Error && error.message
					? `Shell command failed: ${error.message}`
					: "Shell command failed.",
			);
		}
	}

	private pickDate(): Promise<Date | null> {
		return new Promise((resolve) => {
			new DatePickerModal(this.app, resolve).open();
		});
	}
}

import {
	ExtraButtonComponent,
	Notice,
	PluginSettingTab,
	TextAreaComponent,
	TextComponent,
	ToggleComponent,
} from "obsidian";

import { TemplateBuilderModal } from "./modals";
import { validateTemplateCommand } from "./template-engine";
import type { TemplateCommand } from "./types";
import type SlasherPlugin from "./main";

interface SelectionRange {
	start: number;
	end: number;
}

export class SlasherSettingTab extends PluginSettingTab {
	private readonly selectionByCommandId = new Map<string, SelectionRange>();

	constructor(private readonly plugin: SlasherPlugin) {
		super(plugin.app, plugin);
	}

	override display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const layoutEl = containerEl.createDiv({ cls: "slasher-settings-layout" });
		layoutEl.createEl("h2", {
			cls: "slasher-settings-title",
			text: "Slasher",
		});

		const introEl = layoutEl.createDiv({ cls: "slasher-settings-intro" });
		introEl.createEl("p", {
			cls: "slasher-settings-help",
			text: 'Use the Add helper inside a row to insert starter snippets such as {{ today | format: "yyyy-MM-dd" }}, {{ date_picker | format: "yyyy-MM-dd" }}, or {% command %}ls -1 {{ vault_path }}{% endcommand %}. ',
		});
		introEl.createEl("a", {
			cls: "slasher-settings-help-link",
			href: "https://github.com/binnyva/obsidian-slasher",
			text: "Documentation",
		});

		const tableEl = layoutEl.createDiv({ cls: "slasher-settings-table" });
		const headerEl = tableEl.createDiv({ cls: "slasher-settings-table-header" });
		headerEl.createDiv({
			cls: "slasher-settings-table-heading",
			text: "Enabled",
		});
		headerEl.createDiv({
			cls: "slasher-settings-table-heading",
			text: "Command Name",
		});
		headerEl.createDiv({
			cls: "slasher-settings-table-heading",
			text: "Template",
		});
		headerEl.createDiv({
			cls: "slasher-settings-table-heading slasher-settings-table-heading--icon",
			text: "Build",
		});
		headerEl.createDiv({
			cls: "slasher-settings-table-heading slasher-settings-table-heading--action",
			text: "Action",
		});

		const bodyEl = tableEl.createDiv({ cls: "slasher-settings-table-body" });

		if (this.plugin.settings.commands.length === 0) {
			bodyEl.createDiv({
				cls: "slasher-settings-empty-state",
				text: "No commands yet. Add a row to create one and it will show up as an editor command immediately after save.",
			});
		} else {
			for (const command of this.plugin.settings.commands) {
				this.renderCommandRow(bodyEl, command);
			}
		}

		const footerEl = layoutEl.createDiv({ cls: "slasher-settings-footer" });
		this.renderAddRowButton(footerEl, "+ Add row");
	}

	private renderAddRowButton(parentEl: HTMLElement, label: string): void {
		const buttonEl = parentEl.createEl("button", {
			cls: "mod-cta slasher-settings-add-row-button",
			text: label,
		});
		buttonEl.type = "button";
		buttonEl.addEventListener("click", async () => {
			try {
				await this.plugin.addEmptyCommand();
				this.display();
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Failed to add a new command row.";
				new Notice(`Slasher: ${message}`);
				console.error("Slasher add row failed", error);
			}
		});
	}

	private renderCommandRow(parentEl: HTMLElement, command: TemplateCommand): void {
		const rowEl = parentEl.createDiv({ cls: "slasher-settings-table-row" });
		if (!command.enabled) {
			rowEl.addClass("is-disabled");
		}

		const issues = validateTemplateCommand(command.name, command.template);
		if (issues.length > 0) {
			rowEl.addClass("is-invalid");
		}

		const enabledCell = rowEl.createDiv({
			cls: "slasher-settings-cell slasher-settings-cell--enabled",
		});
		enabledCell.setAttr("data-label", "Enabled");

		new ToggleComponent(enabledCell)
			.setValue(command.enabled)
			.onChange(async (value) => {
				command.enabled = value;
				await this.plugin.saveSettings();
				this.display();
			});

		const commandCell = rowEl.createDiv({
			cls: "slasher-settings-cell slasher-settings-cell--name",
		});
		commandCell.setAttr("data-label", "Command Name");

		new TextComponent(commandCell)
			.setPlaceholder("Insert tomorrow's date")
			.setValue(command.name)
			.onChange(async (value) => {
				command.name = value;
				await this.plugin.saveSettings();
			})
			.inputEl.addClass("slasher-settings-input");

		const templateCell = rowEl.createDiv({
			cls: "slasher-settings-cell slasher-settings-cell--template",
		});
		templateCell.setAttr("data-label", "Template");

		const textArea = new TextAreaComponent(templateCell);
		textArea
			.setPlaceholder('{{ today | format: "yyyy-MM-dd" }}')
			.setValue(command.template)
			.onChange(async (value) => {
				command.template = value;
				await this.plugin.saveSettings();
			});

		textArea.inputEl.rows = 1;
		textArea.inputEl.addClass("slasher-settings-textarea");
		this.syncTextAreaHeight(textArea.inputEl);

		const updateSelection = () => {
			this.selectionByCommandId.set(command.id, {
				start: textArea.inputEl.selectionStart ?? textArea.inputEl.value.length,
				end: textArea.inputEl.selectionEnd ?? textArea.inputEl.value.length,
			});
		};

		textArea.inputEl.addEventListener("input", () => {
			this.syncTextAreaHeight(textArea.inputEl);
			updateSelection();
		});
		textArea.inputEl.addEventListener("click", updateSelection);
		textArea.inputEl.addEventListener("keyup", updateSelection);
		textArea.inputEl.addEventListener("select", updateSelection);
		textArea.inputEl.addEventListener("focus", updateSelection);

		const helperCell = rowEl.createDiv({
			cls: "slasher-settings-cell slasher-settings-cell--helper",
		});
		helperCell.setAttr("data-label", "Build");
		new ExtraButtonComponent(helperCell)
			.setIcon("settings")
			.setTooltip("Open template helper")
			.onClick(() => {
				new TemplateBuilderModal(this.app, async (snippet) => {
					await this.insertSnippet(command, snippet);
				}).open();
			})
			.extraSettingsEl.addClass("slasher-settings-helper-button");

		const actionCell = rowEl.createDiv({
			cls: "slasher-settings-cell slasher-settings-cell--action",
		});
		actionCell.setAttr("data-label", "Action");
		const deleteButton = new ExtraButtonComponent(actionCell)
			.setIcon("trash")
			.setTooltip("Delete command")
			.onClick(async () => {
				await this.plugin.removeCommand(command.id);
				this.display();
			});
		if (typeof deleteButton.setWarning === "function") {
			deleteButton.setWarning();
		}
		deleteButton.extraSettingsEl.addClass("slasher-settings-delete-button");

		if (issues.length > 0) {
			rowEl.createDiv({
				cls: "slasher-validation slasher-settings-validation",
				text: issues.join(" "),
			});
		}
	}

	private syncTextAreaHeight(textAreaEl: HTMLTextAreaElement): void {
		textAreaEl.style.height = "auto";
		textAreaEl.style.height = `${Math.max(textAreaEl.scrollHeight, 44)}px`;
	}

	private async insertSnippet(command: TemplateCommand, snippet: string): Promise<void> {
		const range = this.selectionByCommandId.get(command.id) ?? {
			start: command.template.length,
			end: command.template.length,
		};

		const currentTemplate = command.template;
		command.template =
			currentTemplate.slice(0, range.start) +
			snippet +
			currentTemplate.slice(range.end);

		const newCursor = range.start + snippet.length;
		this.selectionByCommandId.set(command.id, {
			start: newCursor,
			end: newCursor,
		});

		await this.plugin.saveSettings();
		this.display();
	}
}

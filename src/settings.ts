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

		const introEl = layoutEl.createDiv({ cls: "slasher-settings-intro" });
		const helpEl = introEl.createEl("p", {
			cls: "slasher-settings-help",
		});
		helpEl.appendText("See the ");
		helpEl.createEl("a", {
			cls: "slasher-settings-help-link",
			href: "https://github.com/binnyva/obsidian-slasher",
			text: "documentation",
		});
		helpEl.appendText(" for template string format.");

		const tableEl = layoutEl.createDiv({ cls: "slasher-settings-table" });
		const headerEl = tableEl.createDiv({ cls: "slasher-settings-table-header" });
		headerEl.createDiv({
			cls: "slasher-settings-table-heading",
			text: "Enabled",
		});
		headerEl.createDiv({
			cls: "slasher-settings-table-heading",
			text: "Command name",
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
		this.renderAddRowButton(footerEl, "Add row");
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

		let validationEl: HTMLDivElement | null = null;
		const refreshValidation = () => {
			const issues = validateTemplateCommand(command.name, command.template);
			rowEl.toggleClass("is-invalid", issues.length > 0);

			if (issues.length === 0) {
				validationEl?.remove();
				validationEl = null;
				return;
			}

			if (!validationEl) {
				validationEl = rowEl.createDiv({
					cls: "slasher-validation slasher-settings-validation",
				});
			}

			validationEl.setText(issues.join(" "));
		};

		refreshValidation();

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
		commandCell.setAttr("data-label", "Command name");

		new TextComponent(commandCell)
			.setPlaceholder("Insert tomorrow's date")
			.setValue(command.name)
			.onChange(async (value) => {
				command.name = value;
				refreshValidation();
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
				refreshValidation();
				await this.plugin.saveSettings();
			});

		textArea.inputEl.rows = 3;
		textArea.inputEl.addClass("slasher-settings-textarea");

		const updateSelection = () => {
			this.selectionByCommandId.set(command.id, {
				start: textArea.inputEl.selectionStart ?? textArea.inputEl.value.length,
				end: textArea.inputEl.selectionEnd ?? textArea.inputEl.value.length,
			});
		};

		textArea.inputEl.addEventListener("input", updateSelection);
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
				new TemplateBuilderModal(this.app, (snippet) => {
					void this.insertSnippet(command, snippet);
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
				await this.plugin.removeTemplateCommand(command.id);
				this.display();
			});
		const warningCapableDeleteButton = deleteButton as ExtraButtonComponent & {
			setWarning?: () => ExtraButtonComponent;
		};
		warningCapableDeleteButton.setWarning?.();
		deleteButton.extraSettingsEl.addClass("slasher-settings-delete-button");
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

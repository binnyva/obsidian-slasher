import {
	ButtonComponent,
	Modal,
	Setting,
} from "obsidian";
import type { App, DropdownComponent, TextComponent } from "obsidian";

export type BuilderSnippetKind = "date" | "clipboard" | "command" | "vault" | "date-picker";

export class DatePickerModal extends Modal {
	private readonly onSubmit: (value: Date | null) => void;

	constructor(app: App, onSubmit: (value: Date | null) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	override onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Pick a date" });

		const wrapper = contentEl.createDiv({ cls: "slasher-modal-grid" });
		const label = wrapper.createEl("label", { text: "Date" });
		const input = wrapper.createEl("input", { type: "date" });
		const today = new Date().toISOString().slice(0, 10);
		input.value = today;
		label.appendChild(input);

		const actions = contentEl.createDiv({ cls: "slasher-modal-actions" });
		new ButtonComponent(actions)
			.setButtonText("Cancel")
			.onClick(() => {
				this.onSubmit(null);
				this.close();
			});

		new ButtonComponent(actions)
			.setButtonText("Insert")
			.setCta()
			.onClick(() => {
				this.onSubmit(input.value ? new Date(`${input.value}T00:00:00`) : null);
				this.close();
			});

		input.focus();
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}

export class TemplateBuilderModal extends Modal {
	private readonly onSubmit: (snippet: string) => void;

	constructor(app: App, onSubmit: (snippet: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	override onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Add template snippet" });

		let snippetKind: BuilderSnippetKind = "date";
		let dateToken = "today";
		let dateFormat = "yyyy-MM-dd";
		let replaceFrom = "replace";
		let replaceTo = "this";
		let commandBody = "ls -1 {{ vault_path }}";
		let vaultToken = "file_path";
		let pickerFormat = "yyyy-MM-dd";

		const form = contentEl.createDiv({ cls: "slasher-modal-grid" });
		form.createEl("p", {
			cls: "slasher-settings-help slasher-modal-helper-text",
			text: "The helper inserts a starter snippet into the template field. You can edit it freely afterwards.",
		});

		const dynamicSection = form.createDiv();

		const renderFields = () => {
			dynamicSection.empty();

			new Setting(dynamicSection)
					.setName("Snippet type")
					.setDesc("Choose the kind of snippet to generate.")
					.addDropdown((dropdown: DropdownComponent) => {
						dropdown
							.addOption("date", "Date")
							.addOption("clipboard", "Clipboard")
							.addOption("command", "Command")
							.addOption("vault", "Vault/file")
							.addOption("date-picker", "Date picker")
							.setValue(snippetKind)
							.onChange((value) => {
								snippetKind = value as BuilderSnippetKind;
							renderFields();
						});
				});

			if (snippetKind === "date") {
				new Setting(dynamicSection)
					.setName("Date token")
					.addDropdown((dropdown) => {
						dropdown
							.addOption("today", "today")
							.addOption("tomorrow", "tomorrow")
							.addOption("yesterday", "yesterday")
							.addOption("file_creation_date", "file_creation_date")
							.addOption("file_modification_date", "file_modification_date")
							.setValue(dateToken)
							.onChange((value) => {
								dateToken = value;
							});
					});

				new Setting(dynamicSection)
					.setName("Format")
					.setDesc("Uses date-fns tokens. Use MM for month, not mm.")
					.addText((text) => {
						text.setValue(dateFormat).onChange((value) => {
							dateFormat = value.trim() || "yyyy-MM-dd";
						});
					});
			}

			if (snippetKind === "clipboard") {
				new Setting(dynamicSection)
					.setName("Replace")
					.setDesc("Used to build a starter replace_first filter. Regex replacements are also available in templates.")
					.addText((text) => {
						text.setValue(replaceFrom).onChange((value) => {
							replaceFrom = value;
						});
					});

				new Setting(dynamicSection)
					.setName("With")
					.addText((text) => {
						text.setValue(replaceTo).onChange((value) => {
							replaceTo = value;
						});
					});
			}

			if (snippetKind === "command") {
				new Setting(dynamicSection)
					.setName("Shell command")
					.setDesc("You can include output tags like {{ vault_path }} inside the command body.")
					.addText((text: TextComponent) => {
						text.setPlaceholder("ls -1 {{ vault_path }}")
							.inputEl.addClass("slasher-modal-text-input");
						text
							.setValue(commandBody)
							.onChange((value) => {
								commandBody = value;
							});
					});
			}

			if (snippetKind === "vault") {
				new Setting(dynamicSection)
					.setName("Variable")
					.addDropdown((dropdown) => {
						dropdown
							.addOption("file_path", "{{ file_path }}")
							.addOption("file_name", "{{ file_name }}")
							.addOption("file_stem", "{{ file_stem }}")
							.addOption("folder_path", "{{ folder_path }}")
							.addOption("vault_path", "{{ vault_path }}")
							.addOption("vault_name", "{{ vault_name }}")
							.setValue(vaultToken)
							.onChange((value) => {
								vaultToken = value;
							});
					});
			}

			if (snippetKind === "date-picker") {
				new Setting(dynamicSection)
					.setName("Format")
					.setDesc("Uses date-fns tokens with the date_picker format filter.")
					.addText((text) => {
						text.setValue(pickerFormat).onChange((value) => {
							pickerFormat = value.trim() || "yyyy-MM-dd";
						});
					});
			}
		};

		renderFields();

		const actions = contentEl.createDiv({ cls: "slasher-modal-actions" });
		new ButtonComponent(actions)
			.setButtonText("Cancel")
			.onClick(() => this.close());

		new ButtonComponent(actions)
			.setButtonText("Insert")
			.setCta()
			.onClick(() => {
				this.onSubmit(this.buildSnippet({
					commandBody,
					dateFormat,
					dateToken,
					pickerFormat,
					replaceFrom,
					replaceTo,
					snippetKind,
					vaultToken,
				}));
				this.close();
			});
	}

	private buildSnippet(values: {
		snippetKind: BuilderSnippetKind;
		dateToken: string;
		dateFormat: string;
		replaceFrom: string;
		replaceTo: string;
		commandBody: string;
		vaultToken: string;
		pickerFormat: string;
	}): string {
		switch (values.snippetKind) {
			case "date":
				return `{{ ${values.dateToken} | format: "${escapeLiquidString(values.dateFormat)}" }}`;
			case "clipboard":
				return `{{ clipboard | replace_first: "${escapeLiquidString(values.replaceFrom)}", "${escapeLiquidString(values.replaceTo)}" }}`;
			case "command":
				return `{% command %}${values.commandBody || "ls -1 {{ vault_path }}"}{% endcommand %}`;
			case "vault":
				return `{{ ${values.vaultToken} }}`;
			case "date-picker":
				return `{{ date_picker | format: "${escapeLiquidString(values.pickerFormat)}" }}`;
			default:
				return '{{ today | format: "yyyy-MM-dd" }}';
		}
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}

function escapeLiquidString(value: string): string {
	return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
}

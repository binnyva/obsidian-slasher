# Slasher

Slasher lets you create custom editor commands that appear in Obsidian's command system, which also makes them available from Slash commands. Each command has a name and a template. Template string decides what actually shows up in the editor.

## Template Syntax

Templates are freeform text. Mix plain text with dynamic tokens:

```text
Tomorrow: {{ tomorrow | format: "yyyy-MM-dd" }}
Clipboard: {{ clipboard | replace: "foo", "bar" }}
Clipboard regex: {{ clipboard | replace_regex: "\\d+", "#" }}
Picked: {{ date_picker | format: "yyyy-MM-dd" }}
Files:
{% command %}ls -1 {{ vault_path }}{% endcommand %}
```

### Supported Variables

#### Date variables

- `{{ today }}`
- `{{ tomorrow }}`
- `{{ yesterday }}`
- `{{ file_creation_date }}`
- `{{ file_modification_date }}`

Date values must use the `format` filter before insertion:

```text
{{ today | format: "yyyy-MM-dd" }}
{{ tomorrow | format: "EEE" }}
{{ file_modification_date | format: "PPP" }}
```

Important: use `MM` for months. `mm` means minutes in date-fns.

#### Clipboard variable

- `{{ clipboard }}`

Example:

```text
{{ clipboard | replace_first: "replace", "this" }}
{{ clipboard | replace: "foo", "bar" | replace: "baz", "qux" }}
{{ clipboard | replace_regex: "\\d+", "#" }}
{{ clipboard | replace_first_regex: "foo\\s+bar", "baz", "i" }}
```

#### Vault and file variables

- `{{ file_path }}`
- `{{ file_name }}`
- `{{ file_stem }}`
- `{{ folder_path }}`
- `{{ vault_path }}`
- `{{ vault_name }}`

File-scoped variables require an active file. If no file is active, the command shows a Notice and inserts nothing.

#### Shell command tag

- `{% command %}...{% endcommand %}`

Example:

```text
{% command %}ls -1 {{ vault_path }}{% endcommand %}
{% command %}printf "%s" {{ file_name }}{% endcommand %}
```

Nested Liquid output tags inside the command body are resolved before the shell command runs. Inserted values are shell-escaped.

Shell commands are executed with:

- the user's shell from `process.env.SHELL`, or `/bin/bash` as a fallback
- `-lc`
- the vault path as the working directory

If the command exits with a non-zero status, the plugin shows a Notice and inserts nothing.

#### Date picker variable

- `{{ date_picker | format: "yyyy-MM-dd" }}`

Example:

```text
{{ date_picker | format: "yyyy-MM-dd" }}
```

When the command runs, the plugin opens a small date picker modal and inserts the chosen date using the provided format.

The legacy `{% date_picker format: "..." %}` tag is still accepted for existing templates, but new templates should use the output syntax above.

### Supported Filters

#### `format`

Used with date-like values only:

```text
{{ today | format: "yyyy-MM-dd" }}
{{ file_creation_date | format: "PPP" }}
{{ date_picker | format: "EEE, MMM d" }}
```

#### `replace`

Replaces all literal matches in string values:

```text
{{ clipboard | replace: "from", "to" }}
```

#### `replace_first`

Replaces only the first literal match in string values:

```text
{{ clipboard | replace_first: "from", "to" }}
```

#### `replace_regex`

Replaces all regex matches in string values. The third argument is optional regex flags; `g` is applied automatically:

```text
{{ clipboard | replace_regex: "\\d+", "#" }}
{{ clipboard | replace_regex: "foo\\s+bar", "baz", "i" }}
```

#### `replace_first_regex`

Replaces only the first regex match in string values. The third argument is optional regex flags; any `g` flag is ignored:

```text
{{ clipboard | replace_first_regex: "\\d+", "#" }}
{{ clipboard | replace_first_regex: "foo\\s+bar", "baz", "i" }}
```

## Settings UI

The settings tab lists all configured commands in a table layout with:

- command name
- template
- delete action
- add-row control at the bottom

Each row also keeps an enabled toggle beside the command name, and the template cell includes an `Add helper` button.

The `Add helper` is just a snippet builder. It inserts starter template text at the current cursor position inside the Template field. It does not add extra saved fields.

Builder examples:

- Date -> `{{ today | format: "yyyy-MM-dd" }}`
- Clipboard -> `{{ clipboard | replace_first: "replace", "this" }}`
- Command -> `{% command %}ls -1 {{ vault_path }}{% endcommand %}`
- Vault/File -> `{{ file_path }}`
- Date Picker -> `{{ date_picker | format: "yyyy-MM-dd" }}`

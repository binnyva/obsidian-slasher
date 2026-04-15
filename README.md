# Slasher

Slasher lets you create custom editor commands that appear in Obsidian's command system, which also makes them available from Slash commands.

Each saved item only has two fields:

- `Command name`
- `Template`

The plugin is desktop-only in v1 and targets macOS/Linux. Windows is intentionally out of scope for this release because template execution can run local shell commands.

## How Slash Commands Work

Obsidian does not expose a separate public API for adding slash-only entries. This plugin registers normal editor commands through the plugin API, and those commands become searchable from Slash commands and the command palette.

## Template Syntax

Templates are freeform text. Mix plain text with dynamic tokens:

```text
Tomorrow: {tomorrow}|format:yyyy-MM-dd
Clipboard: {clipboard}|sed:/foo/bar/g
Files:
{command:ls -1 {vaultPath}}
```

### Supported Tokens

#### Date tokens

- `{today}`
- `{tomorrow}`
- `{yesterday}`
- `{file-creation-date}`
- `{file-modification-date}`

Accepted aliases:

- `{tomorow}`
- `{tommorow}`
- `{fileCreationDate}`
- `{fileModificationDate}`

If you use a date token without `|format:`, the default output format is `yyyy-MM-dd`.

Use `format:` with date-fns formatting:

```text
{today}|format:yyyy-MM-dd
{tomorrow}|format:EEE
{file-modification-date}|format:PPP
```

Important: use `MM` for months. `mm` means minutes in date-fns.

#### Clipboard token

- `{clipboard}`

Example:

```text
{clipboard}|sed:/replace/this/
{clipboard}|sed:/foo/bar/g|sed:/baz/qux/g
```

#### Vault and file tokens

- `{filePath}`
- `{fileName}`
- `{fileStem}`
- `{folderPath}`
- `{vaultPath}`
- `{vaultName}`

File-scoped tokens require an active file. If no file is active, the command shows a Notice and inserts nothing.

#### Shell command token

- `{command:...}`

Example:

```text
{command:ls -1 {vaultPath}}
{command:printf "%s" {fileName}}
```

Nested placeholders inside the command body are resolved before the shell command runs. Inserted placeholder values are shell-escaped.

Shell commands are executed with:

- the user's shell from `process.env.SHELL`, or `/bin/bash` as a fallback
- `-lc`
- the vault path as the working directory

If the command exits with a non-zero status, the plugin shows a Notice and inserts nothing.

#### Date picker token

- `{date-picker}`

Example:

```text
{date-picker}|format:yyyy-MM-dd
```

When the command runs, the plugin opens a small date picker modal. The chosen date becomes the token value.

### Supported Transforms

#### `format:`

Used with date-like values only:

```text
{today}|format:yyyy-MM-dd
{date-picker}|format:PPP
```

#### `sed:`

Used with string values:

```text
{clipboard}|sed:/from/to/
{command:ls -1 {vaultPath}}|sed:/md/txt/g
```

This is a plugin-defined lightweight replace syntax, not full `sed` compatibility. v1 supports:

- `/from/to/`
- `/from/to/g`

`from` is treated as a literal string, not a regex.

## Settings UI

The settings tab lists all configured commands in a table layout with:

- command name
- template
- delete action
- add-row control at the bottom

Each row also keeps an enabled toggle beside the command name, and the template cell includes an `Add helper` button.

The `Add helper` is just a snippet builder. It inserts starter template text at the current cursor position inside the Template field. It does not add extra saved fields.

Builder examples:

- Date -> `{today}|format:yyyy-MM-dd`
- Clipboard -> `{clipboard}|sed:/replace/this/`
- Command -> `{command:ls -1 {vaultPath}}`
- Vault/File -> `{filePath}`
- Date Picker -> `{date-picker}|format:yyyy-MM-dd`

## Development

```bash
npm install
npm run dev
```

Build for release:

```bash
npm run build
```

Build and copy the plugin into an Obsidian plugin folder:

```bash
npm run dev-deploy -- /absolute/path/to/.obsidian/plugins/obsidian-slasher
```

You can also set the destination once with an environment variable:

```bash
OBSIDIAN_PLUGIN_DEV_DIR=/absolute/path/to/.obsidian/plugins/obsidian-slasher npm run dev-deploy
```

Run tests:

```bash
npm test
```

## Safety Notes

- Shell commands run locally on your machine.
- Treat imported templates as code, not trusted content.
- This plugin is intentionally desktop-only in v1.

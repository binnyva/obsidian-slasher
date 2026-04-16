# Agents.md

## Purpose

This file gives coding agents the project-specific rules for working on the Slasher Obsidian plugin.

## Project Snapshot

- Plugin name: `Slasher`
- Plugin id: `slasher`
- Platform: desktop-only
- Main source entry: `src/main.ts`
- Settings UI: `src/settings.ts`
- Modal UI: `src/modals.ts`
- Template engine: `src/template-engine.ts`
- Release artifact: `main.js` is generated locally and must not be committed

## Working Rules

- Prefer small, focused edits that preserve the existing behavior and UI patterns.
- Do not edit generated `main.js` by hand. Rebuild it with `npm run build` when needed.
- Keep `main.js` out of version control. It is ignored in `.gitignore` and should only ship in releases.
- Run `npm test`, `npm run lint`, and `npm run build` after meaningful changes.
- Do not revert unrelated user changes in the worktree.

## Obsidian Plugin Guidelines To Follow

### Release and Packaging

- Keep the required plugin metadata files present and valid: `manifest.json`, `README.md`, `LICENSE`, and `versions.json`.
- Do not commit `main.js` to the repository. Include it in release artifacts instead.
- Keep the production build minimized. The current build config uses `minify: production`.
- Avoid adding unnecessary dependencies. Less is safer for community plugins.
- Keep the lockfile committed when dependencies change.

### Compatibility and Platform

- This plugin is desktop-only. If a change adds mobile support, review all Node/Electron usage before changing `isDesktopOnly`.
- Any `FileSystemAdapter` usage must stay behind an `instanceof FileSystemAdapter` guard.
- Avoid hardcoded `.obsidian` paths. Use Obsidian APIs instead.
- Do not use `process.platform` for Obsidian platform logic. Use Obsidian platform APIs if platform checks are needed.

### API Usage

- Use `this.app`, not the global `app`.
- Persist plugin data with `loadData()` and `saveData()`.
- Prefer Obsidian APIs over lower-level adapter access when possible.
- Use the editor APIs for active-editor changes instead of file rewriting patterns.
- If frontmatter support is ever added, use `FileManager.processFrontMatter`.
- If file deletion is ever added, use `trashFile` instead of direct deletion.

### User Interface

- Keep UI text in sentence case.
- Do not use raw `<h1>` or `<h2>` elements for settings-tab headings.
- Avoid adding a settings heading when the page only has one section.
- Do not apply layout or cosmetic styling inline from TypeScript. Prefer CSS classes in `styles.css`.
- Avoid overriding Obsidian core styling globally. Scope styles to Slasher classes.

### Commands and Behavior

- Do not add default hotkeys for plugin commands.
- Do not prefix command display names with the plugin name or plugin id. Obsidian already namespaces commands in the UI.
- Keep command registration IDs stable and derived from stored command ids.
- Preserve validation around invalid commands and templates so broken commands are not registered.

### Security and Disclosures

- Keep the README disclosures accurate.
- Document any capability that may surprise users, especially:
  - local shell command execution
  - clipboard reads
  - access to absolute vault or file paths
  - network access
  - telemetry
  - account requirements
  - payments or ads
- Do not add telemetry.
- If network access is introduced later, disclose it clearly in `README.md`.

## Slasher-Specific Guardrails

- Shell commands are user-authored and run through the user shell with `-lc` and the vault path as the working directory. Treat this as a deliberate power-user feature and do not broaden it casually.
- Keep nested template values shell-escaped before command execution.
- File-scoped variables should continue to fail safely when there is no active file.
- Error paths should prefer user-facing `Notice` messages and should avoid noisy logging.
- When adjusting settings or modal UI, preserve the current table-based command editor workflow unless there is a clear product reason to change it.

## Validation Checklist Before Finishing

- `npm run lint`
- `npm test`
- `npm run build`
- Confirm `manifest.json` still matches the intended platform and versioning changes.
- Confirm README disclosures still match actual plugin behavior.
- Confirm generated `main.js` is not staged for commit.

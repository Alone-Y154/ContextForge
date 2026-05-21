# ContextForge CLI

Website: https://contextforge.org

ContextForge is a registry-powered CLI that installs curated AI-agent instruction packs into existing codebases.

```bash
npx @contextforge/cli init
```

## What Is ContextForge?

ContextForge makes any repo AI-agent ready.

AI coding agents are powerful, but most repositories do not clearly tell them how to work. Agents may guess the architecture, skip verification, add unnecessary dependencies, mishandle Git operations, or ignore project conventions.

ContextForge fixes this by installing repo-level instruction packs that guide agent behavior.

It is not an MCP gateway, tool proxy, API gateway, or replacement for skills.sh. It is a repo-level AI-agent instruction installer.

## How It Works

```txt
Remote registry
https://registry.contextforge.org/index.json
        |
        v
ContextForge CLI
npx @contextforge/cli init
        |
        v
User repo
.contextforge/
  config.json
  lock.json
  agents/
  skills/
        |
        v
Tiny root pointers
AGENTS.md
CLAUDE.md
```

ContextForge fetches packs from the official registry, writes useful instructions under `.contextforge`, and creates tiny root pointer files for supported agents.

Root files stay small. Full prompt and instruction content lives inside `.contextforge`.

## Quick Start

Run this inside an existing project:

```bash
npx @contextforge/cli init
```

Then choose which AI tool to configure:

```txt
All agents
Codex only
Claude Code only
Cursor only
GitHub Copilot only
```

Add a pack:

```bash
npx @contextforge/cli add supabase
```

Sync installed packs:

```bash
npx @contextforge/cli sync
```

Check health:

```bash
npx @contextforge/cli doctor
```

List registry packs:

```bash
npx @contextforge/cli list
```

Search packs:

```bash
npx @contextforge/cli search react
```

## Commands

### init

```bash
npx @contextforge/cli init
```

First setup. Detects the project stack, installs mandatory core packs, installs detected stack packs, writes `.contextforge`, and creates root pointer files.

### add

```bash
npx @contextforge/cli add <pack>
```

Installs one extra pack from the registry.

Examples:

```bash
npx @contextforge/cli add supabase
npx @contextforge/cli add nextjs-best-practices
npx @contextforge/cli add system-design
```

### sync

```bash
npx @contextforge/cli sync
```

Repairs and updates the local ContextForge setup. It re-detects the stack, fetches current pack files, and regenerates `.contextforge` outputs.

### doctor

```bash
npx @contextforge/cli doctor
```

Checks whether ContextForge is correctly installed.

### list

```bash
npx @contextforge/cli list
```

Lists available registry packs grouped by topic.

### search

```bash
npx @contextforge/cli search <query>
```

Searches pack name, title, description, and topic.

## Generated Project Structure

ContextForge stores pack content here:

```txt
.contextforge/
  config.json
  lock.json
  agents/
    codex/<pack>.md
    claude/<pack>.md
    cursor/<pack>.md
    copilot/<pack>.md
  skills/
    <pack>/SKILL.md
```

For auto-discovery, ContextForge may also create small root pointer files:

```txt
AGENTS.md
CLAUDE.md
```

These files only tell the agent to read `.contextforge`. They do not contain full pack content.

## Core Packs

Every project starts with mandatory core behavior packs:

- `verification-before-completion`
- `systematic-debugging`
- `code-review`
- `git-workflow`
- `dependency-management`
- `diataxis-docs`

These packs help agents verify work, debug systematically, review code, handle Git safely, manage dependencies carefully, and keep documentation useful.

## Stack Packs

ContextForge can install detected stack packs such as:

- `nextjs-best-practices`
- `react-performance`
- `react-composition`
- `shadcn-ui`
- `tailwind-v4`
- `ui-ux-design`
- `frontend-aesthetics`
- `typescript-advanced-types`
- `supabase`
- `security-baseline`
- `system-design`
- `frontend-system-design`
- `api-design`
- `test-driven-development`

## Official Registry

The official registry is:

```txt
https://registry.contextforge.org/index.json
```

Normal users do not need to pass a registry URL.

For testing custom registries:

```bash
npx @contextforge/cli list --registry https://example.com/index.json
```

## Safety

ContextForge preserves user-written root file content. It only updates generated blocks between:

```md
<!-- contextforge:start -->
<!-- contextforge:end -->
```

Content outside that block is left alone.

## Links

- Website: https://contextforge.org
- Main repo: https://github.com/Alone-Y154/ContextForge
- Registry repo: https://github.com/Alone-Y154/ContextForge-registry
- Website repo: https://github.com/Alone-Y154/Contextforge-web
- npm CLI: https://www.npmjs.com/package/@contextforge/cli
- npm Core: https://www.npmjs.com/package/@contextforge/core
- Registry: https://registry.contextforge.org/index.json

## License

MIT

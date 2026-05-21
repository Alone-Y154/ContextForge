# ContextForge

ContextForge installs curated AI-agent instruction packs into existing codebases.

## Usage

Run this inside the project you want to prepare:

```bash
npx @contextforge/cli init
```

`init` fetches the official static registry from:

```txt
https://registry.contextforge.org/index.json
```

It installs the mandatory core behavior packs, stores downloaded pack sources under `.contextforge/packs`, writes `.contextforge/config.json` and `.contextforge/lock.json`, then generates tool-specific outputs for the AI tools you select.

## Commands

```bash
npx @contextforge/cli init
npx @contextforge/cli add supabase
npx @contextforge/cli add nextjs-best-practices
npx @contextforge/cli sync
npx @contextforge/cli doctor
npx @contextforge/cli list
npx @contextforge/cli search testing
```

For registry testing, every registry-backed command supports:

```bash
--registry https://example.com/index.json
```

Normal users do not need to pass a registry URL.

## Generated Structure

ContextForge uses `.contextforge` as the local source of truth:

```txt
.contextforge/
  config.json
  lock.json
  packs/
  instructions/
    agents/
    claude/
```

Generated AI-tool outputs live outside `.contextforge`:

```txt
AGENTS.md
CLAUDE.md
.agents/skills/<pack>/SKILL.md
.cursor/rules/<pack>.mdc
.github/instructions/<pack>.instructions.md
```

Root `AGENTS.md` and `CLAUDE.md` stay short. ContextForge updates only the block between:

```md
<!-- contextforge:start -->
<!-- contextforge:end -->
```

User-written content outside that block is preserved.

# Official Remote Registry

ContextForge is designed around a remote prompt registry. The npm package should stay small; large and fast-growing prompt libraries live in the official registry and are cached into each project only when installed.

## User Commands

Normal users should run:

```bash
npx contextforge init
npx contextforge add supabase
npx contextforge sync
npx contextforge doctor
```

The package command is `npx contextforge ...` for one-off use. After a project installs it as a dev dependency, users can also run it through package scripts or `pnpm contextforge ...`.

## Source Order

ContextForge loads packs in this order:

1. Project cache: `.contextforge/packs/<pack-name>`
2. Official registry: `https://registry.contextforge.dev/index.json`
3. Extra registries passed with `--registry` or `CONTEXTFORGE_REGISTRY_URL`

The project cache is not the product registry. It is only a local copy of installed packs so `sync` remains reproducible after installation.

## Private Registry Usage

Use `--registry` only for private, company, or experimental registries:

```bash
npx contextforge init --registry https://registry.example.com/index.json
npx contextforge add analytics-fundamentals --registry https://registry.example.com/index.json
```

You can also set:

```bash
CONTEXTFORGE_REGISTRY_URL=https://registry.example.com/index.json
```

## Registry Shape

The official registry is a static `index.json`:

```json
{
  "version": "1",
  "packs": [
    {
      "name": "supabase",
      "version": "1.0.0",
      "baseUrl": "./packs/supabase/"
    }
  ]
}
```

Each `baseUrl` directory contains:

```txt
pack.json
rules.md
skill.md
cursor.mdc
copilot.md
```

Only `pack.json` and `rules.md` are required. Tool-specific files are optional and fall back to `rules.md` when missing.

## Installed Pack Cache

When a user adds a remote pack, ContextForge stores it in:

```txt
.contextforge/packs/<pack-name>/
```

It also writes:

```txt
.contextforge/installed-packs.json
```

This lets `sync` and `doctor` use the exact installed pack content even if the user is offline later.

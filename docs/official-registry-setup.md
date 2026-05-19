# Official Registry Setup

The official registry should be a separate static site or repository, not bundled into the npm package.

## Recommended Repo

Create a separate repository such as:

```txt
contextforge-registry/
  index.json
  packs/
    supabase/
      pack.json
      rules.md
      skill.md
      cursor.mdc
      copilot.md
    system-design/
      pack.json
      rules.md
      skill.md
      cursor.mdc
      copilot.md
```

Deploy that repo to:

```txt
https://registry.contextforge.dev/
```

The CLI already points the `official` registry alias to:

```txt
https://registry.contextforge.dev/index.json
```

## Minimal Supabase Pack

```json
{
  "name": "supabase",
  "version": "1.0.0",
  "title": "Supabase",
  "description": "Rules for Supabase auth, database, RLS, Edge Functions, and client/server usage.",
  "category": "database",
  "detect": {
    "packages": ["@supabase/supabase-js"]
  },
  "outputs": {
    "globalRules": true,
    "skill": true,
    "cursorRule": true,
    "copilotInstruction": true
  }
}
```

Then add to `index.json`:

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

After deployment, this should work:

```bash
npx contextforge add supabase
```

## Hosting Options

Good first choices:

- Cloudflare Pages
- GitHub Pages
- S3 + CloudFront
- Vercel static output

For production, put a CDN in front of the registry and cache immutable pack files aggressively.

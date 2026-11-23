# Composer repository

A static Composer repository for my WordPress plugins, served by GitHub Pages. Composer downloads each version as its GitHub tag archive: no token, no API rate limit, and files marked `export-ignore` in a plugin's `.gitattributes` are left out.

## Use

```json
"repositories": [
    { "type": "composer", "url": "https://corentin-gautier.github.io/composer-repo" }
],
"require": {
    "cgsoft/no-thanks": "*"
}
```

## Update

`packages.json` lists every tag `vX.Y.Z` of the repos in `repos.json`. It is rebuilt by the `build` workflow every day, on a change to `repos.json`, or on demand, right after tagging a plugin:

```bash
gh workflow run build -R corentin-gautier/composer-repo
```

Locally: `node scripts/build.js` (Node 18+). Add a plugin: add its repo to `repos.json` and push.

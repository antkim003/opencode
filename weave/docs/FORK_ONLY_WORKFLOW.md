# Fork-only Workflow

Use this repository as fork-owned execution and review surface.

## Rules

- Do not open pull requests to `anomalyco/opencode`.
- Keep active integration work on `antkim003/opencode` branches.
- If a PR is needed, create it only against the fork base branch.

## Quick checks

```bash
git remote -v
git branch -vv
```

Expected:

- `origin` -> `antkim003/opencode`
- `upstream` -> `anomalyco/opencode`
- active branch tracks `origin/*`

## Validation commands

```bash
bun run weave:validate
bun run weave:proof
```

## Fork PR command

Use explicit repo to avoid upstream mistakes:

```bash
gh pr create --repo antkim003/opencode --base dev --head <branch>
```

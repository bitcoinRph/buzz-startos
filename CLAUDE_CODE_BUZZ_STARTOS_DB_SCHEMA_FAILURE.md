# Buzz StartOS DB Schema Failure Debug Notes for Claude Code

Generated: 2026-07-26T00:30:37Z

## Executive summary

The installed Buzz StartOS service is running, but the relay/workflow runtime is operating against an unmigrated PostgreSQL database. The live logs repeatedly show missing core schema tables:

- `relation "events" does not exist`
- `relation "channels" does not exist`
- `relation "workflows" does not exist`

The upstream Buzz relay only runs embedded SQLx migrations when `BUZZ_AUTO_MIGRATE` is enabled. The StartOS wrapper's relay daemon environment did not set that variable, so a fresh StartOS install can start the relay and schedulers before the required schema exists.

## Live StartOS evidence

Commands used:

```bash
/opt/data/home/startos-ops/startos-ops.sh package installed-version buzz
/opt/data/home/startos-ops/startos-ops.sh package stats
/opt/data/home/startos-ops/startos-ops.sh package logs buzz --limit 600
```

Installed version:

```text
"0.1.1:0-alpha.0"
```

Package stats show the Buzz container exists and is consuming memory:

```text
| buzz | YG5YIF3F5WZX3E7MOHQW4WU7W62YRUSB | 235 MiB | 37275 MiB | 0.63 |
```

Log counts from the latest 600 log lines:

```text
relation "events" does not exist: 36
relation "channels" does not exist: 6
relation "workflows" does not exist: 6
Database migrations complete: 0
```

Representative log excerpts:

```text
2026-07-26T00:24:21.079Z {"timestamp":"2026-07-26T00:24:21.079067Z","level":"ERROR","message":"Reminder scheduler tick failed: database error: error returned from database: relation \"events\" does not exist at line 1449","target":"buzz_relay"}

2026-07-26T00:24:40.842Z 2026-07-26 00:24:40.842 UTC [30] ERROR: relation "channels" does not exist at character 8
2026-07-26T00:24:40.842Z STATEMENT: UPDATE channels SET archived_at = NOW() WHERE ttl_seconds IS NOT NULL AND ttl_deadline < NOW() AND archived_at IS NULL AND deleted_at IS NULL RETURNING id
2026-07-26T00:24:40.842Z {"timestamp":"2026-07-26T00:24:40.842346Z","level":"ERROR","message":"Ephemeral reaper tick failed: database error: error returned from database: relation \"channels\" does not exist at line 1449","target":"buzz_relay"}

2026-07-26T00:24:40.852Z 2026-07-26 00:24:40.852 UTC [29] ERROR: relation "workflows" does not exist at character 166
2026-07-26T00:24:40.853Z {"timestamp":"2026-07-26T00:24:40.852344Z","level":"ERROR","message":"Cron tick: failed to load workflows: database error: error returned from database: relation \"workflows\" does not exist at line 1449","target":"buzz_workflow"}
```

The full pulled logs are saved locally at:

```text
/opt/data/tmp/buzz-debug/buzz-logs-latest.txt
```

## Code evidence

Upstream relay migration gate:

File:

```text
buzz/crates/buzz-relay/src/main.rs
```

Relevant code:

```rust
let auto_migrate =
    buzz_auto_migrate_enabled(std::env::var("BUZZ_AUTO_MIGRATE").ok().as_deref());
if auto_migrate {
    db.migrate().await.map_err(|e| {
        error!("Failed to run database migrations: {e}");
        anyhow::anyhow!("Database migration failed: {e}")
    })?;
    info!("Database migrations complete");
} else {
    info!("Skipping database migrations because BUZZ_AUTO_MIGRATE is not enabled");
}
```

The parser accepts `"true"`, `"1"`, `"yes"`, or `"on"`.

StartOS wrapper relay daemon env before the fix had `DATABASE_URL`, Redis/S3 variables, and runtime keys, but did **not** set `BUZZ_AUTO_MIGRATE`.

## Local fix applied

File:

```text
startos/main.ts
```

Patch:

```ts
RUST_LOG: 'info',
// StartOS owns this single relay instance; apply Buzz's embedded SQLx
// migrations before the relay starts schedulers/workflows so fresh
// installs have the required events/channels/workflows tables.
BUZZ_AUTO_MIGRATE: 'true',
```

This sets the env var inside the relay daemon `exec.env` block.

## Verification already run locally

```bash
npm run check
npm run build
git diff --check
```

Results:

```text
npm_check=PASS
npm_build=PASS
diff_check=PASS
```

Independent Quinn code-review verdict: `PASS`.

Quinn noted the residual risk is not the code diff itself; it is runtime verification. We still need a new `.s9pk`, sideload it, and prove logs show successful migration and no more missing-table scheduler errors.

## Expected post-fix verification

After building and sideloading a new dev-build artifact:

1. Pull fresh logs:

```bash
/opt/data/home/startos-ops/startos-ops.sh package logs buzz --limit 600
```

2. Confirm positive signal:

```text
Database migrations complete
```

3. Confirm negative signals are gone from fresh logs:

```text
relation "events" does not exist
relation "channels" does not exist
relation "workflows" does not exist
```

4. Confirm container remains running:

```bash
/opt/data/home/startos-ops/startos-ops.sh package installed-version buzz
/opt/data/home/startos-ops/startos-ops.sh package stats
```

## Notes

- Local `.s9pk` build is blocked in this Hermes environment because the Docker daemon is unavailable.
- The GitHub Actions workflow `.github/workflows/buildService.yml` is the intended build path. It runs `npm ci`, `npm run build`, `start-cli s9pk init-workspace ..`, `make x86_64`, then publishes the rolling `dev-build` prerelease asset.

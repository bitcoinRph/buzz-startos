# Resetting the Buzz database (required when coming from an old install)

## Why you may need this

Early builds of this package ran the old `ghcr.io/block/buzz:0.1.1` relay
image. That image predates Buzz's multi-tenant schema (the `communities`
table and per-row `community_id`). A Postgres volume created by `0.1.1` is a
**pre-1321** database.

The current package runs the up-to-date relay (`ghcr.io/block/buzz:main`),
which expects the multi-tenant schema. There is **no in-place migration** from
the old single-community schema to the new one — Buzz's own migrator will fail
partway (`relation "communities" does not exist`) and the relay will
crash-loop. This is by design: the only supported upgrade for existing
pre-1321 data is a one-off operator cutover script, and a database that has
already crash-looped through partial migrations can no longer run it.

So if your relay was ever installed from an older build, you must start its
database fresh.

## How to reset (fresh, clean install)

> This **erases the Buzz service's data volume** (Postgres, Redis, MinIO
> media). Do it only if there is no Buzz data you need to keep. If you *do*
> have data to preserve, stop and take a StartOS backup / `pg_dump` first and
> pursue the data-preserving cutover instead.

1. In the StartOS UI, **uninstall** the existing Buzz service. This removes its
   data volume.
2. **Sideload** the new `buzz_x86_64.s9pk` and start it.
3. On first start, the relay provisions a clean, current schema
   (`BUZZ_AUTO_MIGRATE=true` runs migration `0001`, the consolidated
   multi-tenant schema). You should see `Database migrations complete` and the
   relay reach health.

Important: **do not** sideload the new package as an *in-place update* over the
old install — that keeps the old, incompatible volume and the relay will keep
crash-looping. Uninstall first so the volume is recreated fresh.

## Verify it worked

After start, the service logs should contain:

- `Database migrations complete`
- the relay listening on port 3000 and reaching its health check

and should **not** contain:

- `Failed to run database migrations`
- `relation "communities" does not exist`
- `relation "events" does not exist`
- `Typesense` / `localhost:8108` (the current relay uses Postgres full-text
  search, not Typesense)

## Then onboard mobile

Once healthy: run **Set Owner Pubkey**, optionally **Set Membership Mode →
Closed**, then **Create Mobile Invite** and open the resulting
`https://<relay>/invite/<code>` link on your phone.

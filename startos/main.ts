import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import {
  dbName,
  dbUser,
  postgresPort,
  redisPort,
  resolveCanonicalOrigin,
  s3Bucket,
  s3Port,
  s3User,
  toWebsocketUrl,
  webPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Buzz!'))

  const store = await storeJson.read((s) => s).const(effects)
  const postgresPassword = store?.postgresPassword ?? ''
  const minioRootPassword = store?.minioRootPassword ?? ''

  // Buzz resolves the community (tenant) from the connection host, so one
  // address must be chosen as canonical (see utils.resolveCanonicalOrigin).
  //
  // resolveCanonicalOrigin reads raw host info via effects.getHostInfo rather
  // than sdk.serviceInterface.getOwn(): the SDK's interface enrichment
  // (filledAddress) dereferences host.hostnameInfo without a guard and throws
  // while StartOS is still constructing package state, crash-looping startup.
  // constRetry re-runs setupMain once host info (re)appears.
  const origin = await resolveCanonicalOrigin(
    effects,
    store?.relayHostOverride,
    effects.constRetry,
  )

  const relayUrl = toWebsocketUrl(origin)

  const postgresSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'postgres',
      mountpoint: '/var/lib/postgresql/data',
      readonly: false,
    }),
    'postgres-sub',
  )

  const redisSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'redis' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'redis',
      mountpoint: '/data',
      readonly: false,
    }),
    'redis-sub',
  )

  const minioSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'minio' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'minio',
      mountpoint: '/data',
      readonly: false,
    }),
    'minio-sub',
  )

  const mcSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'mc' },
    sdk.Mounts.of(),
    'mc-sub',
  )

  const relaySub = await sdk.SubContainer.of(
    effects,
    { imageId: 'buzz' },
    sdk.Mounts.of(),
    'buzz-sub',
  )

  return sdk.Daemons.of(effects)
    .addDaemon('postgres', {
      subcontainer: postgresSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          POSTGRES_USER: dbUser,
          POSTGRES_PASSWORD: postgresPassword,
          POSTGRES_DB: dbName,
          PGDATA: '/var/lib/postgresql/data',
        },
      },
      ready: {
        display: i18n('Database'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, postgresPort, {
            successMessage: i18n('PostgreSQL is ready'),
            errorMessage: i18n('PostgreSQL is not ready'),
          }),
      },
      requires: [],
    })
    .addDaemon('redis', {
      subcontainer: redisSub,
      exec: {
        command: sdk.useEntrypoint(),
      },
      ready: {
        display: i18n('Cache'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, redisPort, {
            successMessage: i18n('Redis is ready'),
            errorMessage: i18n('Redis is not ready'),
          }),
      },
      requires: [],
    })
    .addDaemon('minio', {
      subcontainer: minioSub,
      exec: {
        command: sdk.useEntrypoint([
          'server',
          '/data',
          '--address',
          `:${s3Port}`,
        ]),
        env: {
          MINIO_ROOT_USER: s3User,
          MINIO_ROOT_PASSWORD: minioRootPassword,
        },
      },
      ready: {
        display: i18n('Object Storage'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, s3Port, {
            successMessage: i18n('MinIO is ready'),
            errorMessage: i18n('MinIO is not ready'),
          }),
      },
      requires: [],
    })
    .addOneshot('minio-init', {
      subcontainer: mcSub,
      exec: {
        command: [
          '/bin/sh',
          '-c',
          `mc alias set local http://127.0.0.1:${s3Port} ${s3User} "$MINIO_ROOT_PASSWORD" && mc mb --ignore-existing local/${s3Bucket} && mc anonymous set none local/${s3Bucket}`,
        ],
        env: {
          MINIO_ROOT_PASSWORD: minioRootPassword,
        },
      },
      requires: ['minio'],
    })
    .addDaemon('relay', {
      subcontainer: relaySub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          BUZZ_BIND_ADDR: `0.0.0.0:${webPort}`,
          DATABASE_URL: `postgres://${dbUser}:${postgresPassword}@127.0.0.1:${postgresPort}/${dbName}`,
          REDIS_URL: `redis://127.0.0.1:${redisPort}`,
          RELAY_URL: relayUrl,
          BUZZ_WEB_DIR: '/srv/buzz/web',
          BUZZ_SERVE_GIT_WEB_GUI: 'true',
          BUZZ_S3_ENDPOINT: `http://127.0.0.1:${s3Port}`,
          BUZZ_S3_ACCESS_KEY: s3User,
          BUZZ_S3_SECRET_KEY: minioRootPassword,
          BUZZ_S3_BUCKET: s3Bucket,
          BUZZ_MEDIA_BASE_URL: `${origin}/media`,
          // Git scratch is ephemeral by design (authoritative state lives in
          // Postgres and object storage), so it goes to the container tmpfs.
          BUZZ_GIT_REPO_PATH: '/tmp/buzz-repos',
          RUST_LOG: 'info',
          // StartOS owns this single relay instance; apply Buzz's embedded SQLx
          // migrations before the relay starts schedulers/workflows so fresh
          // installs have the required events/channels/workflows tables.
          BUZZ_AUTO_MIGRATE: 'true',
          // Closed (NIP-43) membership: only takes effect with an owner set,
          // otherwise enabling it would lock everyone out. NIP-43 also needs a
          // stable relay key, which is always injected below.
          BUZZ_REQUIRE_RELAY_MEMBERSHIP:
            store?.closedMembership && store?.ownerPubkey ? 'true' : 'false',
          ...(store?.gitHookHmacSecret
            ? { BUZZ_GIT_HOOK_HMAC_SECRET: store.gitHookHmacSecret }
            : {}),
          ...(store?.relayPrivateKey
            ? { BUZZ_RELAY_PRIVATE_KEY: store.relayPrivateKey }
            : {}),
          ...(store?.ownerPubkey
            ? { RELAY_OWNER_PUBKEY: store.ownerPubkey }
            : {}),
        },
      },
      ready: {
        display: i18n('Relay'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, webPort, {
            successMessage: i18n('The Buzz relay is ready'),
            errorMessage: i18n('The Buzz relay is not ready'),
          }),
        gracePeriod: 20_000,
      },
      requires: ['postgres', 'redis', 'minio-init'],
    })
})

/**
 * The bundled start-sdk (0.4.0-beta.48) ships a leftover debug statement in
 * FileHelper's watch loop:
 *
 *   console.error("yielding", JSON.stringify({ prev, newRes }))
 *
 * Every yield prints the full parsed file — for store.json that means the
 * generated secrets (postgres password, MinIO credentials, relay signing
 * key, git hook HMAC secret) land in the service logs on every startup.
 *
 * Until the SDK removes that line, drop exactly those calls here. All other
 * console.error output passes through untouched.
 */
const sdkConsoleError = console.error.bind(console)

console.error = (...args: unknown[]) => {
  if (args[0] === 'yielding') return
  sdkConsoleError(...args)
}

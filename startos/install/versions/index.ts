export { current } from '../../versions/current'

// No StartOS data migrations: the relay owns its forward SQLx migrations.
// Historical migrationless releases do not need empty VersionGraph nodes.
export const other = []

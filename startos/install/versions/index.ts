import { v_0_5_20_0_a3 } from './v_0_5_20_0_a3'

export { v_0_5_23_0 as current } from './v_0_5_23_0'

// These wrapper releases do not perform data migrations. Collapsing the graph
// to the immediately previous package avoids an SDK graph-normalization bug
// where several prerelease nodes incorrectly reduced canMigrateFrom to alpha.0.
// alpha.3's no-op `up` edge still admits every older installed data version.
export const other = [v_0_5_20_0_a3]

import { v_0_5_20_0_a2 } from './v_0_5_20_0_a2'
import { v_0_5_20_0_a3 } from './v_0_5_20_0_a3'

export { v_0_5_20_0_a3 as current }

// These wrapper releases do not perform data migrations. Collapsing the graph
// to the immediately previous package avoids an SDK graph-normalization bug
// where several prerelease nodes incorrectly reduced canMigrateFrom to alpha.0.
// alpha.2's no-op `up` edge still admits every older installed data version.
export const other = [v_0_5_20_0_a2]

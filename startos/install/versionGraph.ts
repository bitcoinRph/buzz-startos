import { VersionGraph } from '@start9labs/start-sdk'
import { current, other, v_0_5_20_0_a0 } from './versions'

export const versionGraph = VersionGraph.of({
  current,
  other: [...other, v_0_5_20_0_a0],
  preInstall: async (effects) => {},
})

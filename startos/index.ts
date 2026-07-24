/**
 * Plumbing. DO NOT EDIT (exception: the redactSdkLogs import, which must
 * stay first so the log filter is installed before any SDK code runs).
 */
import './redactSdkLogs'
export { createBackup } from './backups'
export { main } from './main'
export { init, uninit } from './init'
export { actions } from './actions'
import { buildManifest } from '@start9labs/start-sdk'
import { manifest as sdkManifest } from './manifest'
import { versionGraph } from './install/versionGraph'
export const manifest = buildManifest(versionGraph, sdkManifest)

import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiMultiHostId, webPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, uiMultiHostId)
  const uiMultiOrigin = await uiMulti.bindPort(webPort, {
    protocol: 'http',
  })

  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: 'ui',
    description: i18n(
      'The Buzz web interface (invite landing page and repository browser)',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const relay = sdk.createInterface(effects, {
    name: i18n('Relay API'),
    id: 'relay',
    description: i18n(
      'WebSocket relay endpoint for Buzz desktop, mobile, and CLI clients',
    ),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const uiReceipt = await uiMultiOrigin.export([ui, relay])

  return [uiReceipt]
})

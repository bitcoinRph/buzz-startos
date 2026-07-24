import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { dbName, dbUser, s3Bucket, s3User } from '../utils'

export const getCredentials = sdk.Action.withoutInput(
  'get-credentials',

  async ({ effects }) => ({
    name: i18n('Get Runtime Credentials'),
    description: i18n(
      'View the generated secrets used internally by Buzz (database, object storage, relay identity key)',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const store = await storeJson.read((s) => s).once()

    return {
      version: '1' as const,
      title: 'Runtime Credentials',
      message:
        'These secrets are generated at install time and used internally by the bundled services.',
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: 'PostgreSQL User',
            description: null,
            value: dbUser,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: 'PostgreSQL Password',
            description: null,
            value: store?.postgresPassword ?? 'UNKNOWN',
            masked: true,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: 'PostgreSQL Database',
            description: null,
            value: dbName,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: 'MinIO Root User',
            description: null,
            value: s3User,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: 'MinIO Root Password',
            description: null,
            value: store?.minioRootPassword ?? 'UNKNOWN',
            masked: true,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: 'Media Bucket',
            description: null,
            value: s3Bucket,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: 'Relay Private Key (hex)',
            description: null,
            value: store?.relayPrivateKey ?? 'UNKNOWN',
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)

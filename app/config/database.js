const { DefaultAzureCredential, getBearerTokenProvider } = require('@azure/identity')

function isProd () {
  return process.env.NODE_ENV === 'production'
}

const hooks = {
  beforeConnect: async (cfg) => {
    if (isProd()) {
      const dbAuthEndpoint = 'https://ossrdbms-aad.database.windows.net/.default'
      const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID })
      const tokenProvider = getBearerTokenProvider(
        credential,
        dbAuthEndpoint
      )
      cfg.password = tokenProvider
    }
  }
}

const retry = {
  backoffBase: 500,
  backoffExponent: 1.1,
  match: [/SequelizeConnectionError/],
  max: 10,
  name: 'connection',
  timeout: 360000
}

const dbConfig = {
  database: process.env.POSTGRES_DB || 'ffc_doc_statement_publisher',
  dialect: 'postgres',
  dialectOptions: {
    ssl: isProd()
  },
  hooks,
  host: process.env.POSTGRES_HOST || 'ffc-doc-statement-publisher-postgres',
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
  logging: process.env.POSTGRES_LOGGING || false,
  retry,
  schema: process.env.POSTGRES_SCHEMA_NAME || 'public',
  username: process.env.POSTGRES_USERNAME
}

module.exports = {
  development: dbConfig,
  production: dbConfig,
  test: dbConfig
}

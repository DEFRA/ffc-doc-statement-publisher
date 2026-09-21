const db = require('../../app/data')

const tables = [
  'deliveries',
  'failures',
  'messageClaims',
  'metrics',
  'reports',
  'requests',
  'returned_letters',
  'statements'
]

const truncate = async () => {
  const quoted = tables.map(table => `"${table}"`).join(', ')
  await db.client.raw(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`)
}

module.exports = {
  truncate
}

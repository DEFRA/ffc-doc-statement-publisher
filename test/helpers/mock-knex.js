const { EventEmitter } = require('node:events')

const chainableMethods = [
  'select',
  'where',
  'andWhere',
  'orWhere',
  'whereIn',
  'whereNotIn',
  'whereNot',
  'whereNull',
  'whereNotNull',
  'whereRaw',
  'whereBetween',
  'orWhereNull',
  'orWhereRaw',
  'insert',
  'update',
  'del',
  'returning',
  'limit',
  'offset',
  'orderBy',
  'orderByRaw',
  'groupBy',
  'groupByRaw',
  'first',
  'forUpdate',
  'skipLocked',
  'transacting',
  'onConflict',
  'ignore',
  'merge',
  'count',
  'max',
  'sum',
  'innerJoin',
  'leftJoin',
  'join'
]

const createQueryBuilder = () => {
  const builder = {}
  let pending = Promise.resolve(undefined)

  for (const method of chainableMethods) {
    builder[method] = jest.fn(() => builder)
  }

  builder.modify = jest.fn((fn) => {
    if (typeof fn === 'function') {
      fn(builder)
    }
    return builder
  })

  builder.resolves = (value) => {
    pending = Promise.resolve(value)
    return builder
  }

  builder.rejects = (error) => {
    pending = Promise.reject(error)

    pending.catch(() => {})
    return builder
  }

  builder.then = (onFulfilled, onRejected) => pending.then(onFulfilled, onRejected)
  builder.catch = (onRejected) => pending.catch(onRejected)
  builder.finally = (onFinally) => pending.finally(onFinally)

  return builder
}

const createRawMock = () => {
  const raw = jest.fn((sql, bindings) => {
    const rawResult = {
      sql,
      bindings,
      stream: jest.fn(() => new EventEmitter())
    }
    rawResult.then = (onFulfilled, onRejected) => Promise.resolve(rawResult).then(onFulfilled, onRejected)
    return rawResult
  })
  return raw
}

const createKnexMock = (tableNames = []) => {
  const builder = createQueryBuilder()
  const knex = jest.fn(() => builder)

  knex.raw = createRawMock()
  knex.destroy = jest.fn()

  const trx = jest.fn(() => builder)
  trx.commit = jest.fn()
  trx.rollback = jest.fn()
  trx.raw = knex.raw
  const transaction = jest.fn(async (callback) => (callback ? callback(trx) : trx))

  const tables = Object.fromEntries(
    tableNames.map(name => [name, jest.fn(() => builder)])
  )

  return {
    knex,
    builder,
    trx,
    transaction,
    close: knex.destroy,
    tables
  }
}

module.exports = {
  createKnexMock,
  createQueryBuilder
}

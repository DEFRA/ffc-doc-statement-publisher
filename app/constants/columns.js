const TABLES = require('./tables')

const PRIMARY_KEYS = {
  [TABLES.delivery]: 'deliveryId',
  [TABLES.failure]: 'failureId',
  [TABLES.messageClaim]: 'messageClaimId',
  [TABLES.report]: 'reportId',
  [TABLES.requests]: 'id',
  [TABLES.returnedLetter]: 'id',
  [TABLES.statement]: 'statementId'
}

const COLUMNS = {
  [TABLES.delivery]: [
    'deliveryId',
    'statementId',
    'method',
    'reference',
    'requested',
    'completed'
  ],
  [TABLES.failure]: [
    'failureId',
    'deliveryId',
    'failed',
    'reason',
    'statusCode',
    'error',
    'message'
  ],
  [TABLES.messageClaim]: [
    'messageClaimId',
    'messageId',
    'documentReference',
    'status',
    'createdAt',
    'updatedAt'
  ],
  [TABLES.metric]: [
    'id',
    'snapshot_date',
    'period_type',
    'scheme_name',
    'scheme_year',
    'total_statements',
    'print_post_count',
    'print_post_cost',
    'print_post_unit_cost',
    'email_count',
    'failure_count',
    'calculated_at',
    'data_start_date',
    'data_end_date',
    'month_in_year'
  ],
  [TABLES.report]: [
    'reportId',
    'lastDeliveryId',
    'schemeName',
    'reportStartDate',
    'reportEndDate',
    'requested',
    'sent'
  ],
  [TABLES.requests]: [
    'id',
    'searchTerms',
    'type',
    'username',
    'timestamp'
  ],
  [TABLES.returnedLetter]: [
    'id',
    'notificationId',
    'reference',
    'dateSent',
    'receivedAt'
  ],
  [TABLES.statement]: [
    'statementId',
    'frn',
    'sbi',
    'businessName',
    'addressLine1',
    'addressLine2',
    'addressLine3',
    'addressLine4',
    'addressLine5',
    'postcode',
    'email',
    'filename',
    'received',
    'schemeName',
    'schemeShortName',
    'schemeYear',
    'schemeFrequency',
    'documentReference',
    'emailTemplate',
    'paymentReference'
  ]
}

const pickColumns = (record, table) => {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([column]) => COLUMNS[table].includes(column))
      .filter(([column]) => column !== PRIMARY_KEYS[table])
  )
}

module.exports = {
  PRIMARY_KEYS,
  COLUMNS,
  pickColumns
}

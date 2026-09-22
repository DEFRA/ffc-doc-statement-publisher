const METRIC_COLUMNS = {
  id: 'id',
  snapshotDate: 'snapshot_date',
  periodType: 'period_type',
  schemeName: 'scheme_name',
  schemeYear: 'scheme_year',
  totalStatements: 'total_statements',
  printPostCount: 'print_post_count',
  printPostCost: 'print_post_cost',
  printPostUnitCost: 'print_post_unit_cost',
  emailCount: 'email_count',
  failureCount: 'failure_count',
  calculatedAt: 'calculated_at',
  dataStartDate: 'data_start_date',
  dataEndDate: 'data_end_date',
  monthInYear: 'month_in_year'
}

const METRIC_SELECT = Object.entries(METRIC_COLUMNS).map(([camel, snake]) => `${snake} as ${camel}`)

const toMetricRow = (record) => {
  const row = {}
  for (const [camel, snake] of Object.entries(METRIC_COLUMNS)) {
    if (Object.prototype.hasOwn.call(record, camel)) {
      row[snake] = record[camel]
    }
  }
  return row
}

module.exports = {
  METRIC_COLUMNS,
  METRIC_SELECT,
  toMetricRow
}

const {
  DEFAULT_TOTAL_STATEMENTS,
  DEFAULT_PRINT_POST_COST,
  DEFAULT_PRINT_POST_UNIT_COST,
  DEFAULT_COUNT,
  PERIOD_TYPE_MAX_LENGTH,
  SCHEME_NAME_MAX_LENGTH
} = require('../../constants/metric-defaults')

const idColumn = (DataTypes) => {
  return {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  }
}

const snapshotDateColumn = (DataTypes) => {
  return {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'snapshot_date'
  }
}

const periodTypeColumn = (DataTypes) => {
  return {
    type: DataTypes.STRING(PERIOD_TYPE_MAX_LENGTH),
    allowNull: false,
    field: 'period_type'
  }
}

const schemeNameColumn = (DataTypes) => {
  return {
    type: DataTypes.STRING(SCHEME_NAME_MAX_LENGTH),
    allowNull: true,
    field: 'scheme_name'
  }
}

const schemeYearColumn = (DataTypes) => {
  return {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'scheme_year'
  }
}

const totalStatementsColumn = (DataTypes) => {
  return {
    type: DataTypes.INTEGER,
    defaultValue: DEFAULT_TOTAL_STATEMENTS,
    field: 'total_statements'
  }
}

const printPostCountColumn = (DataTypes) => {
  return {
    type: DataTypes.INTEGER,
    defaultValue: DEFAULT_COUNT,
    field: 'print_post_count'
  }
}

const printPostCostColumn = (DataTypes) => {
  return {
    type: DataTypes.BIGINT,
    defaultValue: DEFAULT_PRINT_POST_COST,
    field: 'print_post_cost'
  }
}

const printPostUnitCostColumn = (DataTypes) => {
  return {
    type: DataTypes.INTEGER,
    defaultValue: DEFAULT_PRINT_POST_UNIT_COST,
    field: 'print_post_unit_cost'
  }
}

const emailCountColumn = (DataTypes) => {
  return {
    type: DataTypes.INTEGER,
    defaultValue: DEFAULT_COUNT,
    field: 'email_count'
  }
}

const failureCountColumn = (DataTypes) => {
  return {
    type: DataTypes.INTEGER,
    defaultValue: DEFAULT_COUNT,
    field: 'failure_count'
  }
}

const calculatedAtColumn = (DataTypes) => {
  return {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'calculated_at'
  }
}

const dataStartDateColumn = (DataTypes) => {
  return {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_start_date'
  }
}

const dataEndDateColumn = (DataTypes) => {
  return {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_end_date'
  }
}

const monthInYearColumn = (DataTypes) => {
  return {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'month_in_year'
  }
}

const defineMetricColumns = (DataTypes) => {
  return {
    id: idColumn(DataTypes),
    snapshotDate: snapshotDateColumn(DataTypes),
    periodType: periodTypeColumn(DataTypes),
    schemeName: schemeNameColumn(DataTypes),
    schemeYear: schemeYearColumn(DataTypes),
    totalStatements: totalStatementsColumn(DataTypes),
    printPostCount: printPostCountColumn(DataTypes),
    printPostCost: printPostCostColumn(DataTypes),
    printPostUnitCost: printPostUnitCostColumn(DataTypes),
    emailCount: emailCountColumn(DataTypes),
    failureCount: failureCountColumn(DataTypes),
    calculatedAt: calculatedAtColumn(DataTypes),
    dataStartDate: dataStartDateColumn(DataTypes),
    dataEndDate: dataEndDateColumn(DataTypes),
    monthInYear: monthInYearColumn(DataTypes)
  }
}

const defineMetricOptions = () => {
  return {
    tableName: 'metrics',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['snapshot_date', 'period_type', 'scheme_name', 'scheme_year', 'month_in_year']
      },
      {
        fields: ['snapshot_date', 'period_type']
      },
      {
        fields: ['scheme_year', 'period_type']
      },
      {
        fields: ['month_in_year']
      }
    ]
  }
}

const metricModel = (sequelize, DataTypes) => {
  const columns = defineMetricColumns(DataTypes)
  const options = defineMetricOptions()
  return sequelize.define('metric', columns, options)
}

module.exports = metricModel

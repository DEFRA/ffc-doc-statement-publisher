const {
  DEFAULT_TOTAL_STATEMENTS,
  DEFAULT_PRINT_POST_COST,
  DEFAULT_PRINT_POST_UNIT_COST,
  DEFAULT_COUNT,
  PERIOD_TYPE_MAX_LENGTH,
  SCHEME_NAME_MAX_LENGTH
} = require('../../constants/metric-defaults')

function defineMetricColumns (DataTypes) {
  return {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    snapshotDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'snapshot_date'
    },
    periodType: {
      type: DataTypes.STRING(PERIOD_TYPE_MAX_LENGTH),
      allowNull: false,
      field: 'period_type'
    },
    schemeName: {
      type: DataTypes.STRING(SCHEME_NAME_MAX_LENGTH),
      allowNull: true,
      field: 'scheme_name'
    },
    schemeYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'scheme_year'
    },
    totalStatements: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_TOTAL_STATEMENTS,
      field: 'total_statements'
    },
    printPostCount: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_COUNT,
      field: 'print_post_count'
    },
    printPostCost: {
      type: DataTypes.BIGINT,
      defaultValue: DEFAULT_PRINT_POST_COST,
      field: 'print_post_cost'
    },
    printPostUnitCost: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_PRINT_POST_UNIT_COST,
      field: 'print_post_unit_cost'
    },
    emailCount: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_COUNT,
      field: 'email_count'
    },
    failureCount: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_COUNT,
      field: 'failure_count'
    },
    calculatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'calculated_at'
    },
    dataStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'data_start_date'
    },
    dataEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'data_end_date'
    }
  }
}

function defineMetricOptions () {
  return {
    tableName: 'metrics',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['snapshot_date', 'period_type', 'scheme_name', 'scheme_year']
      },
      {
        fields: ['snapshot_date', 'period_type']
      },
      {
        fields: ['scheme_year', 'period_type']
      }
    ]
  }
}

function metric (sequelize, DataTypes) {
  const columns = defineMetricColumns(DataTypes)
  const options = defineMetricOptions()
  return sequelize.define('metric', columns, options)
}

module.exports = metric

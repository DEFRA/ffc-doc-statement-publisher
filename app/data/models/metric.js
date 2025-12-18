function metric (sequelize, DataTypes) {
  const metric = sequelize.define('metric', {
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
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'period_type'
    },
    schemeName: {
      type: DataTypes.STRING(50),
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
      defaultValue: 0,
      field: 'total_statements'
    },
    printPostCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'print_post_count'
    },
    printPostCost: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      field: 'print_post_cost'
    },
    printPostUnitCost: {
      type: DataTypes.INTEGER,
      defaultValue: 200,
      field: 'print_post_unit_cost'
    },
    emailCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'email_count'
    },
    failureCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
  }, {
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
  })

  return metric
}

module.exports = metric
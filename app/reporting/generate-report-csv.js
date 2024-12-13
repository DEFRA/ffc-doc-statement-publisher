const { schemeName } = require("../../test/mocks/objects/notify-personalisation");

const getReportCsv = (deliveries) => {
  const headers = Object.keys(deliveries[0]).join(',');
  const rows = deliveries.map(row => Object.values(row).join(',')).join('\n');
  return `${headers}\n${rows}`;
}

const generateReportCsv = (schemaName, runDate, deliveries) => {
  const csv = getReportCsv(deliveries)
  const scheme = schemeName.toLowerCase().replace(/ /g, '_')
  const isoString = date.toISOString()
  const filename = `${scheme}-${isoString}.csv`
  const filedata = Buffer.from(csv, 'utf-8');
  return {
    filename,
    filedata
  }
}

module.exports = generateReportCsv

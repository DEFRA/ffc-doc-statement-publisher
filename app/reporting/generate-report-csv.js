const { format } = require('@fast-csv/format')
const { Transform } = require('stream')

const generateReportCsv = (schemeName, runDate) => {
  console.log('[CSV] Creating CSV stream for:', schemeName)
  const filename = `${schemeName}-${runDate}.csv`
  
  // Create a transform stream that converts objects to CSV
  const transformStream = new Transform({
    objectMode: true,
    transform(data, encoding, callback) {
      console.log('[CSV] Transforming row:')
      const csvFormatter = format({ headers: true })
      csvFormatter.pipe(this)
      // csvFormatter.write(data)
      callback(null, data)
    }
  })

  return {
    filename,
    stream: transformStream
  }
}

module.exports = { generateReportCsv }
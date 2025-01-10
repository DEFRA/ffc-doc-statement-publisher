const { createObjectCsvStringifier } = require('csv-writer')
const { PassThrough } = require('stream')

const generateReportCsv = (schemeName, runDate) => {
  const passThroughStream = new PassThrough({ objectMode: true })
  let headersSet = false
  let csvStringifier

  passThroughStream.on('data', (data) => {
    if (!headersSet) {
      const headers = Object.keys(data).map(key => ({ id: key, title: key }))
      csvStringifier = createObjectCsvStringifier({ header: headers })
      passThroughStream.write(csvStringifier.getHeaderString())
      headersSet = true
    }
    passThroughStream.write(csvStringifier.stringifyRecords([data]))
  })

  const scheme = schemeName.toLowerCase().replace(/ /g, '_')
  const isoString = runDate.toISOString()
  const filename = `${scheme}-${isoString}.csv`

  return {
    filename,
    fileStream: passThroughStream
  }
}

module.exports = generateReportCsv
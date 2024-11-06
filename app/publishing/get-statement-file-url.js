const { statementReceiverApiVersion, statementReceiverEndpoint } = require('../../config')

const getStatementFileUrl = ( filename ) => {
    const url = `${statementReceiverEndpoint}/${statementReceiverApiVersion}/statements/statement/${filename}`
    return url
}

module.exports = getStatementFileUrl

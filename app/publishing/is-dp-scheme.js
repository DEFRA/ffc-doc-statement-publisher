const {
  DP
} = require('../constants/scheme-names').SHORT_NAMES

const isDpScheme = (shortName) => {
  return shortName === DP
}

module.exports = isDpScheme

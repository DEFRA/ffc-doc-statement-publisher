const { MILLISECONDS_PER_DAY } = require('../constants/time')
const {
  FIRST_DAY_OF_MONTH,
  YEAR_START_MONTH,
  END_OF_DAY_HOUR,
  END_OF_DAY_MINUTE,
  END_OF_DAY_SECOND,
  END_OF_DAY_MILLISECOND,
  MONTH_INDEX_OFFSET,
  DECEMBER_MONTH_INDEX,
  LAST_DAY_OF_DECEMBER
} = require('../constants/date')

const getDateRangeForAll = () => ({
  startDate: null,
  endDate: null,
  useSchemeYear: false
})

const getDateRangeForYTD = (now) => ({
  startDate: new Date(now.getFullYear(), YEAR_START_MONTH, FIRST_DAY_OF_MONTH),
  endDate: now,
  useSchemeYear: false
})

const getDateRangeForYear = (schemeYear) => ({
  startDate: new Date(schemeYear, 0, FIRST_DAY_OF_MONTH),
  endDate: new Date(schemeYear, DECEMBER_MONTH_INDEX, LAST_DAY_OF_DECEMBER, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MILLISECOND),
  useSchemeYear: false
})

const getDateRangeForMonthInYear = (schemeYear, month) => {
  if (!schemeYear || !month) {
    throw new Error('schemeYear and month are required for monthInYear period')
  }
  return {
    startDate: new Date(schemeYear, month - MONTH_INDEX_OFFSET, FIRST_DAY_OF_MONTH),
    endDate: new Date(schemeYear, month, 0, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MILLISECOND),
    useSchemeYear: true
  }
}

const getDateRangeForRelativePeriod = (now, days) => ({
  startDate: new Date(now.getTime() - days * MILLISECONDS_PER_DAY),
  endDate: now,
  useSchemeYear: false
})

module.exports = {
  getDateRangeForAll,
  getDateRangeForYTD,
  getDateRangeForYear,
  getDateRangeForMonthInYear,
  getDateRangeForRelativePeriod
}

const {
  EMPTY,
  INVALID,
  REJECTED,
  BAD_REQUEST_TEAM_API_KEY,
  BAD_REQUEST_TRIAL_MODE,
  BAD_REQUEST_UNSUPPORTED_FILE_TYPE,
  BAD_REQUEST_FILENAME_TOO_LONG,
  BAD_REQUEST_FILENAME_EXTENSION,
  BAD_REQUEST_RETENTION_PERIOD,
  BAD_REQUEST_CONFIRM_EMAIL,
  BAD_REQUEST_VIRUS,
  BAD_REQUEST_SETUP_SEND_EMAIL,
  BAD_REQUEST_EMAIL_TEMPLATE,
  AUTH_ERROR_CLOCK,
  AUTH_ERROR_INVALID_TOKEN,
  RATE_LIMIT_EXCEEDED_KEY_TYPE,
  TOO_MANY_REQUESTS,
  INTERNAL_SERVER_ERROR,
  FILE_TOO_BIG
} = require('../constants/failure-reasons')

const handlePublishReasoning = (error) => {
  switch (error?.message) {
    case 'Email is invalid: Email cannot be empty.':
      return EMPTY
    case 'Email is invalid: The email provided is invalid.':
      return INVALID
    case 'Inbox full or rejected as spam':
      return REJECTED
    case "Can't send to this recipient using a team-only API key":
      return BAD_REQUEST_TEAM_API_KEY
    case "Can't send to this recipient when service is in trial mode - see https://www.notifications.service.gov.uk/trial-mode":
      return BAD_REQUEST_TRIAL_MODE
    case "Unsupported file type '(FILE TYPE)'. Supported types are: '(ALLOWED TYPES)'":
      return BAD_REQUEST_UNSUPPORTED_FILE_TYPE
    case '`filename` cannot be longer than 100 characters':
      return BAD_REQUEST_FILENAME_TOO_LONG
    case '`filename` must end with a file extension. For example, filename.csv':
      return BAD_REQUEST_FILENAME_EXTENSION
    case "Unsupported value for retention_period '(PERIOD)'. Supported periods are from 1 to 78 weeks.":
      return BAD_REQUEST_RETENTION_PERIOD
    case "Unsupported value for confirm_email_before_download: '(VALUE)'. Use a boolean true or false value.":
      return BAD_REQUEST_CONFIRM_EMAIL
    case 'File did not pass the virus scan':
      return BAD_REQUEST_VIRUS
    case 'Send files by email has not been set up - add contact details for your service at https://www.notifications.service.gov.uk/services/(SERVICE ID)/service-settings/send-files-by-email':
      return BAD_REQUEST_SETUP_SEND_EMAIL
    case 'Can only send a file by email':
      return BAD_REQUEST_EMAIL_TEMPLATE
    case 'Error: Your system clock must be accurate to within 30 seconds':
      return AUTH_ERROR_CLOCK
    case 'Invalid token: API key not found':
      return AUTH_ERROR_INVALID_TOKEN
    case 'Exceeded rate limit for key type TEAM/TEST/LIVE of 3000 requests per 60 seconds':
      return RATE_LIMIT_EXCEEDED_KEY_TYPE
    case 'Exceeded send limits (LIMIT NUMBER) for today':
      return TOO_MANY_REQUESTS
    case 'Internal server error':
      return INTERNAL_SERVER_ERROR
    case 'File is larger than 2MB':
      return FILE_TOO_BIG
    default:
      console.log(`Publish fail reason ${error.message} not recognised`)
      return undefined
  }
}

module.exports = handlePublishReasoning

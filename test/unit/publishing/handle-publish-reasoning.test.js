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
} = require('../../../app/constants/failure-reasons')

const handlePublishReasoning = require('../../../app/publishing/handle-publish-reasoning')

describe('Handle publish reasoning', () => {
  test('returns EMPTY when error message is "Email is invalid: Email cannot be empty."', () => {
    const error = { message: 'Email is invalid: Email cannot be empty.' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(EMPTY)
  })

  test('returns INVALID when error message is "Email is invalid: The email provided is invalid."', () => {
    const error = { message: 'Email is invalid: The email provided is invalid.' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(INVALID)
  })

  test('returns REJECTED when error message is "Inbox full or rejected as spam"', () => {
    const error = { message: 'Inbox full or rejected as spam' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(REJECTED)
  })

  test('returns BAD_REQUEST_TEAM_API_KEY when error message is "Can\'t send to this recipient using a team-only API key"', () => {
    const error = { message: "Can't send to this recipient using a team-only API key" }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_TEAM_API_KEY)
  })

  test('returns BAD_REQUEST_TRIAL_MODE when error message is "Can\'t send to this recipient when service is in trial mode - see https://www.notifications.service.gov.uk/trial-mode"', () => {
    const error = { message: "Can't send to this recipient when service is in trial mode - see https://www.notifications.service.gov.uk/trial-mode" }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_TRIAL_MODE)
  })

  test('returns BAD_REQUEST_UNSUPPORTED_FILE_TYPE when error message is "Unsupported file type \'(FILE TYPE)\'. Supported types are: \'(ALLOWED TYPES)\'"', () => {
    const error = { message: "Unsupported file type '(FILE TYPE)'. Supported types are: '(ALLOWED TYPES)'" }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_UNSUPPORTED_FILE_TYPE)
  })

  test('returns BAD_REQUEST_FILENAME_TOO_LONG when error message is "`filename` cannot be longer than 100 characters"', () => {
    const error = { message: '`filename` cannot be longer than 100 characters' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_FILENAME_TOO_LONG)
  })

  test('returns BAD_REQUEST_FILENAME_EXTENSION when error message is "`filename` must end with a file extension. For example, filename.csv"', () => {
    const error = { message: '`filename` must end with a file extension. For example, filename.csv' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_FILENAME_EXTENSION)
  })

  test('returns BAD_REQUEST_RETENTION_PERIOD when error message is "Unsupported value for retention_period \'(PERIOD)\'. Supported periods are from 1 to 78 weeks."', () => {
    const error = { message: "Unsupported value for retention_period '(PERIOD)'. Supported periods are from 1 to 78 weeks." }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_RETENTION_PERIOD)
  })

  test('returns BAD_REQUEST_CONFIRM_EMAIL when error message is "Unsupported value for confirm_email_before_download: \'(VALUE)\'. Use a boolean true or false value."', () => {
    const error = { message: "Unsupported value for confirm_email_before_download: '(VALUE)'. Use a boolean true or false value." }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_CONFIRM_EMAIL)
  })

  test('returns BAD_REQUEST_VIRUS when error message is "File did not pass the virus scan"', () => {
    const error = { message: 'File did not pass the virus scan' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_VIRUS)
  })

  test('returns BAD_REQUEST_SETUP_SEND_EMAIL when error message is "Send files by email has not been set up - add contact details for your service at https://www.notifications.service.gov.uk/services/(SERVICE ID)/service-settings/send-files-by-email"', () => {
    const error = { message: 'Send files by email has not been set up - add contact details for your service at https://www.notifications.service.gov.uk/services/(SERVICE ID)/service-settings/send-files-by-email' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_SETUP_SEND_EMAIL)
  })

  test('returns BAD_REQUEST_EMAIL_TEMPLATE when error message is "Can only send a file by email"', () => {
    const error = { message: 'Can only send a file by email' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(BAD_REQUEST_EMAIL_TEMPLATE)
  })

  test('returns AUTH_ERROR_CLOCK when error message is "Error: Your system clock must be accurate to within 30 seconds"', () => {
    const error = { message: 'Error: Your system clock must be accurate to within 30 seconds' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(AUTH_ERROR_CLOCK)
  })

  test('returns AUTH_ERROR_INVALID_TOKEN when error message is "Invalid token: API key not found"', () => {
    const error = { message: 'Invalid token: API key not found' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(AUTH_ERROR_INVALID_TOKEN)
  })

  test('returns RATE_LIMIT_EXCEEDED_KEY_TYPE when error message is "Exceeded rate limit for key type TEAM/TEST/LIVE of 3000 requests per 60 seconds"', () => {
    const error = { message: 'Exceeded rate limit for key type TEAM/TEST/LIVE of 3000 requests per 60 seconds' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(RATE_LIMIT_EXCEEDED_KEY_TYPE)
  })

  test('returns TOO_MANY_REQUESTS when error message is "Exceeded send limits (LIMIT NUMBER) for today"', () => {
    const error = { message: 'Exceeded send limits (LIMIT NUMBER) for today' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(TOO_MANY_REQUESTS)
  })

  test('returns INTERNAL_SERVER_ERROR when error message is "Internal server error"', () => {
    const error = { message: 'Internal server error' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(INTERNAL_SERVER_ERROR)
  })

  test('returns FILE_TOO_BIG when error message is "File is larger than 2MB"', () => {
    const error = { message: 'File is larger than 2MB' }
    const result = handlePublishReasoning(error)
    expect(result).toBe(FILE_TOO_BIG)
  })

  test('returns undefined and logs unrecognized message for unknown error messages', () => {
    console.log = jest.fn()
    const error = { message: 'Unknown error message' }
    const result = handlePublishReasoning(error)
    expect(result).toBeUndefined()
    expect(console.log).toHaveBeenCalledWith('Publish fail reason Unknown error message not recognised')
  })
})

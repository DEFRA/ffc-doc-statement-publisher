const defaultObject = {
  file: 'JVBERi0xLjMKJf////8KNSAwIG9iago8PAovVHlwZSAvWE9ia…M2MwOWI3ODk+XQo+PgpzdGFydHhyZWYKNTcxNTkKJSVFT0YK',
  is_csv: false,
  confirm_email_before_download: false,
  retention_period: null
}

const confirmEmailAndRetentionPeriodSet = {
  ...defaultObject,
  confirm_email_before_download: true,
  retention_period: '78 weeks'
}

module.exports = {
  defaultObject,
  confirmEmailAndRetentionPeriodSet
}

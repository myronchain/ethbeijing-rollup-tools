export const prettifyErrorMessage = (str = '') => {
  if (!str) {
    return ''
  }
  return str.replace(/.*\[ethjs-query\].*"message":"(.*)"\}.*/, '$1')
}

class Logger {
  private prefix: string

  constructor(prefix = '') {
    this.prefix = prefix
  }

  critical = (...input: any[]) => {
    console.error(this.prefix, ...input)
  }

  debug = (...input: any[]) => {
    console.debug(this.prefix, ...input)
  }

  error = (...input: any[]) => {
    console.error(this.prefix, ...input)
  }

  info = (...input: any[]) => {
    console.info(this.prefix, ...input)
  }

  log = (...input: any[]) => {
    console.log(this.prefix, ...input)
  }

  warn = (...input: any[]) => {
    console.warn(this.prefix, ...input)
  }
}

export default new Logger('g1g2:')

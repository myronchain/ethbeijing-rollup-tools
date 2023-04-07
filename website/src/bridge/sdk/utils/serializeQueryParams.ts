interface IOptions {
  snakeCase: boolean
  omitFalsy: boolean
}

const serializeQueryParams = (
  params: any,
  options: Partial<IOptions> = {
    omitFalsy: false
  }
) => {
  const query: string[] = []

  if (params instanceof Object) {
    for (const k in params) {
      const value = params[k]
      const keyName = k

      if (options.omitFalsy && !value) {
        continue
      }

      query.push([keyName, value].join('='))
    }
  }

  return query.join('&')
}

export default serializeQueryParams

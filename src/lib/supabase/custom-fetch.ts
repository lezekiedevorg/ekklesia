let httpsAgent: any = null

export const customServerFetch = async (url: RequestInfo | URL, options: any = {}) => {
  if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
    try {
      if (!httpsAgent) {
        const https = await import('node:https')
        httpsAgent = new https.Agent({
          ALPNProtocols: ['http/1.1'],
          keepAlive: false,
        } as any)
      }
      const { default: nodeFetch } = await import('node-fetch')

      let urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : (url as any).url || url.toString()
      let headersObj: Record<string, string> = {}
      
      if (options.headers) {
        if (typeof options.headers.forEach === 'function') {
          options.headers.forEach((value: string, key: string) => {
            headersObj[key] = value
          })
        } else if (Array.isArray(options.headers)) {
          for (const [key, value] of options.headers) {
            headersObj[key] = value
          }
        } else if (typeof options.headers === 'object') {
          for (const key of Object.keys(options.headers)) {
            headersObj[key] = String(options.headers[key])
          }
        }
      }

      const { next, cache, duplex, priority, ...cleanOptions } = options

      return nodeFetch(urlStr, {
        ...cleanOptions,
        headers: headersObj,
        agent: urlStr.startsWith('https') ? httpsAgent : undefined,
      } as any) as unknown as Promise<Response>
    } catch (err) {
      console.error('customServerFetch fallback to native fetch:', err)
      return fetch(url, options)
    }
  }
  return fetch(url, options)
}

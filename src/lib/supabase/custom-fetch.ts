let httpsAgent: any = null

export const customServerFetch = async (url: RequestInfo | URL, options: any = {}) => {
  if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
    try {
      if (!httpsAgent) {
        const https = await import('node:https')
        // keepAlive impératif : sans réutilisation de socket, chaque appel
        // rouvre une poignée de main TLS. Sur les pages serveur qui enchaînent
        // plusieurs requêtes (backoffice /admin), 7 handshakes à froid vers
        // Supabase dépassaient 2 min et faisaient « tourner » la page sans fin.
        httpsAgent = new https.Agent({
          ALPNProtocols: ['http/1.1'],
          keepAlive: true,
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
        timeout: 15000, // filet de sécurité : échouer vite plutôt que pendre indéfiniment
      } as any) as unknown as Promise<Response>
    } catch (err) {
      console.error('customServerFetch fallback to native fetch:', err)
      return fetch(url, options)
    }
  }
  return fetch(url, options)
}

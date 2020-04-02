import express from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import { ServerAdapter, RequestHandler, HTTPMethod, Middleware, ServerRequest, ServerResponse } from '../interface'

class ExpressAdapter extends ServerAdapter<express.Express> {
  constructor() {
    super(express())
    this.instance.use(bodyParser.json())
    this.instance.disable('x-powered-by')
  }

  listen(port: number, address?: string): Promise<string> {
    const hostname = address || '0.0.0.0'

    return new Promise<string>((res, rej) => 
      http.createServer(this.instance)
        .on('error', (err) => rej(err))
        .on('listening', () => res(`${hostname}:${port}`))
        .listen(port, address)
    )
  }

  private transformTypes(req: any, res: any): [ServerRequest, ServerResponse] {
    req.raw = req
    res.res = res
    res.sent = res.headersSent
    res.headers = res.getHeaders()

    return [req, res]
  }

  route(method: HTTPMethod, url: string, handler: RequestHandler): void {
    this.instance[method.toLowerCase()](
      url,
      (req: express.Request, reply: express.Response) => {
        return handler(...this.transformTypes(req, reply))
      }
    )
  }

  use(middleware: Middleware): void {
    this.instance.use((_req, _res, done) => {
      const [req, res] = this.transformTypes(_req, _res)
      middleware(req, res, done)
    })
  }
}

export default ExpressAdapter

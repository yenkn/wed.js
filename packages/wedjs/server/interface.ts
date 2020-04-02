import http from 'http'

export interface ServerRequest {
  url: string
  params: any
  query: any
  body: any
  headers: any
  raw: http.IncomingMessage
  ip: string
  ips: string[]
  hostname: string
}

export interface ServerResponse {
  sent: boolean
  res: http.ServerResponse

  status(statusCode: number): this
  header(name: string, value: string): this
  headers(obj: any): this
  getHeader(name: string): any
  type(type: string): this
  redirect(url: string, code?: number): this
  send(obj: any): void
}

export type RequestHandler = (request: ServerRequest, response: ServerResponse) => Promise<void>
export type Middleware = (request: ServerRequest, response: ServerResponse, next: () => void) => void
export type HTTPMethod = 'DELETE' | 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'OPTIONS'

export abstract class ServerAdapter<InstanceType = any> {
  constructor(protected instance: InstanceType) {}

  abstract listen(port: number, address?: string): Promise<string>
  abstract route(method: HTTPMethod, path: string, handler: RequestHandler): void
  abstract use(middleware: Middleware): void
}

export abstract class ServerApplier<ConfigType> {
  protected config: ConfigType

  constructor(protected adapter: ServerAdapter) {}

  abstract apply(): void

  setConfig(config: ConfigType) {
    this.config = config
  }
}

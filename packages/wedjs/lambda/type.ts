export interface LambdaRequest {
  params: any[]
}

export interface LambdaResponse {
  code: number
  message?: string
  response: any
}

export const lambdaPath = '/lambda/'

export class LambdaError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export class HTTPError extends Error {
  status: number
  
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

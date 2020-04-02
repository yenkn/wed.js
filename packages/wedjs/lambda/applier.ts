import { LambdaError, lambdaPath, LambdaResponse, LambdaRequest } from './type'
import { ServerApplier } from '../server/interface'

export interface LambdaConfig {
  routes: {
    [path: string]: (...args: any[]) => Promise<any>
  }
}

export class LambdaApplier extends ServerApplier<LambdaConfig> {
  apply(): void {
    this.adapter.route('POST', `${lambdaPath}(*)`, async (request, reply) => {
      const lambdaRequest = request.body as LambdaRequest

      const { routes } = this.config
      const path = Object.keys(routes).find(x => x === request.params[0])

      if(!path) {
        reply.status(404).type('application/json').send({
          message: 'lambda not found'
        })
        return
      }

      try {
        const res = await routes[path](...lambdaRequest.params)
        reply.type('application/json').send({
          code: 0,
          response: res
        } as LambdaResponse)

      } catch(ex) {
        if(ex instanceof LambdaError) {
          reply.type('application/json').send({
            code: ex.status,
            message: ex.message
          } as LambdaResponse)
        } else {
          throw ex
        }
      }
    })
  }
}

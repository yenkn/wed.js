import asyncHooks from 'async_hooks'
import { Namespace } from "./namespace"
import DefaultContext from "./default-context"
import { PromiseReturnType } from "../types"
import { ServerRequest, ServerResponse } from "../server/interface"

export type ContextType<TResult = any> = (req: ServerRequest, res: ServerResponse) => Promise<TResult>

export class ServerContext {
  static namespace = Namespace.createNamespace<Map<ContextType, any>>('WED.JS')

  static async run(contexts: ContextType[], params: Parameters<ContextType>, next: Function) {
    const results = await Promise.all(contexts.map(ctx => ctx(...params)))
    const values = new Map<ContextType, any>()
    contexts.forEach((context, i) => values.set(context, results[i]))

    const eid = asyncHooks.executionAsyncId()
    this.namespace.values.set(eid, values)
    const res = next()
    return res instanceof Promise ? await res : res
  }

  static get(context: ContextType) {
    const eid = asyncHooks.executionAsyncId()
    return this.namespace.values.get(eid)?.get(context)
  }
}

/**
 * Use context in lambda functions
 * 
 * Context is executed when the request is received and the execution result is cached, this function returns cached result
 * @param context context to use (default: `DefaultContext`)
 */
export function useContext<T extends ContextType = typeof DefaultContext>(
  context: T = DefaultContext as T
): PromiseReturnType<T> {
  return ServerContext.get(context) || {}
}

/**
 * Export a router specific context
 * 
 * It will only be executed before the specified routing request, can be used to develop interceptors.
 * You can end the request early by throwing an error in the context function.
 * 
 * usage: `export default routerContext(['admin', 'dashboard'], AuthorityContext)`
 * @param routes routes filter
 * @param context context to export
 */
export function routerContext(routes: string[] | string, context: ContextType) {
  return {
    routes, context
  }
}

import asyncHooks from 'async_hooks'

/**
 * wrapper for `async_hooks`
 *
 * original idea from: https://github.com/guyguyon/node-request-context
 */
export class Namespace<ValueType> {
  static namespaces = new Map<string, any>()

  private static createHooks<T>(namespace: Namespace<T>) {
    const asyncHook = asyncHooks.createHook({
      init(asyncId, type, triggerId) {
        // pass context values to next async level
        if(namespace.values.has(triggerId)) {
          namespace.values.set(asyncId, namespace.values.get(triggerId))
        }
      },

      destroy(asyncId) {
        namespace.values.delete(asyncId)
      }
    })

    asyncHook.enable()
  }

  static createNamespace<T>(name: string) {
    if (this.namespaces[name]) { throw new Error(`A namespace for ${name} already exists`) }

    const namespace = new Namespace<T>()
    this.namespaces[name] = namespace

    this.createHooks(namespace)
    return namespace
  }

  static getNamespace(name: string) {
    return this.namespaces[name]
  }

  // stores context results
  public values = new Map<number, ValueType>()
}

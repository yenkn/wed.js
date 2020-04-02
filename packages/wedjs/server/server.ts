import { RendererConfig, RendererApplier } from '../renderer/applier'
import { LambdaConfig, LambdaApplier } from '../lambda/applier'
import { ServerAdapter } from './interface'
import { AssetConfig, AssetApplier } from "./asset-applier"
import { ContextConfig, ContextApplier } from '../context/applier'
import ExpressAdapter from './adapter/express'

interface ServerOptions {
  assets?: AssetConfig
}

class AppServer {
  protected rendererApplier: RendererApplier
  protected lambdaApplier: LambdaApplier
  protected assetApplier: AssetApplier
  protected contextApplier: ContextApplier

  constructor(options: ServerOptions = {}, protected adapter: ServerAdapter = new ExpressAdapter()) {
    this.contextApplier = new ContextApplier(this.adapter)
    this.contextApplier.apply()

    this.lambdaApplier = new LambdaApplier(this.adapter)
    this.lambdaApplier.apply()

    this.assetApplier = new AssetApplier(this.adapter)
    if(options.assets) {
      this.assetApplier.setConfig(options.assets)
    }

    this.rendererApplier = new RendererApplier(this.adapter)
  }

  /**
   * Context objects are the same within a request, but different across different requests
   */
  setContextConfig(config: ContextConfig) {
    this.contextApplier.setConfig(config)
  }

  setRendererConfig(config: RendererConfig) {
    this.rendererApplier.setConfig(config)
  }

  setLambdaConfig(config: LambdaConfig) {
    this.lambdaApplier.setConfig(config)
  }

  use(middleware) {
    return this.adapter.use(middleware)
  }

  /**
   * make sure all middleware is registered
   * @param port
   */
  start(port: number) {
    this.assetApplier.apply()
    this.rendererApplier.apply()

    process.env['PORT'] = port.toString()
    return this.adapter.listen(port)
  }
}

export default AppServer

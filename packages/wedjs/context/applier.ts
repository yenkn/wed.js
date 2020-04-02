import { ServerApplier } from "../server/interface"
import { ContextType, ServerContext } from './context'
import DefaultContext from "./default-context"

export interface ContextConfig {
  contexts: ContextType[]
}

export class ContextApplier extends ServerApplier<ContextConfig> {
  apply() {
    this.adapter.use(async (req, res, next) => {
      const contexts = [DefaultContext, ...(this.config?.contexts || [])]
      await ServerContext.run(contexts, [req, res], next)  
    })
  }
}

import { ContextType } from './context'
import { ServerRequest, ServerResponse } from '../server/interface'

interface ContextResult {
  request: ServerRequest
  response: ServerResponse
}

/**
 * will be the default context object
 */
const DefaultContext: ContextType<ContextResult> = async (request, response) => {
  return { request, response }
}

export default DefaultContext

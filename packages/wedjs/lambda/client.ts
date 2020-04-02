import { LambdaRequest, lambdaPath, LambdaError, HTTPError, LambdaResponse } from './type'
import React, { useContext } from 'react'
import { usePromise } from "../renderer/context"
import { PromiseReturnType } from '../types'
import 'isomorphic-unfetch'

interface LambdaContextProps {
  config?: RequestInit
}

const IS_SERVER = typeof window === 'undefined'

const LambdaContext = React.createContext<LambdaContextProps>({})
LambdaContext.displayName = 'LambdaConfigContext'

export const LambdaConfigProvider = LambdaContext.Provider

type LambdaType = (...args: any[]) => Promise<any>

export async function requestLambda<F extends LambdaType>(
  lambda: string,
  config: LambdaContextProps,
  ...params: any[]
): Promise<PromiseReturnType<F>> {
  const site = IS_SERVER ? `http://127.0.0.1:${process.env.PORT}` : ''
  const res = await fetch(`${site}${lambdaPath}${lambda}`, {
    ...config.config,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      params
    } as LambdaRequest),
  })
  if(res.status !== 200) {
    throw new HTTPError(res.status, res.statusText)
  }
  const json = await res.json() as LambdaResponse
  if(json.code === 0) {
    return json.response
  } else {
    throw new LambdaError(json.code, json.message)
  }
}

export function useLambdaContext() {
  try {
    return useContext(LambdaContext)
  } catch(ex) {
    return {}
  }
}

/**
 * `usePromise` wrapper for `lambda`, support request config provided by `<LambdaConfigProvider />`
 */
export function useLambda<F extends LambdaType>(func: string, ...params: Parameters<F>) {
  const contextConfig = useContext(LambdaContext)
  return usePromise(() => requestLambda(func, contextConfig, ...params))
}

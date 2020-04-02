import React, { useState, useEffect } from 'react'

export interface ServerPromiseResult {
  res?: any
  err?: Error
  status: 'fulfilled' | 'rejected'
}

export interface CacheType {
  [key: string]: ServerPromiseResult
}

interface ContextProps {
  cache?: CacheType
  addTask: (key: string, promise: Promise<any>) => void
  getKey: () => string
}

interface ProviderProps {
  cache?: CacheType
  tasks?: {
    [key: string]: Promise<any>
  }
}

const initialValue: ContextProps = {
  addTask: null,
  getKey: null,
}

const RendererContext = React.createContext<ContextProps>(initialValue)

export const RendererContextProvider: React.FC<ProviderProps> = ({ children, cache, tasks }) => {
  let counter = 0
  const providerValue: ContextProps = {
    cache,
    addTask: (key, promise) => tasks[key] = promise,
    getKey: () => `promise-${counter++}`,
  }

  return <RendererContext.Provider value={providerValue}>
    {children}
  </RendererContext.Provider>
}

export const useRendererContext = () => React.useContext(RendererContext)

const IS_SERVER = typeof window === 'undefined'

export interface PromiseResult<T> {
  data?: T
  loading: boolean
  error?: Error
}

/**
 * A React hooks wrapper for promises,
 * and promise will be resolved automatically by server in server rendering context,
 * be sure to use node compatible packages like `isomorphic-fetch`
 * @param func function returns promise to call
 */
export function usePromise<T>(func: () => Promise<T>): PromiseResult<T> {
  const { cache, addTask, getKey } = useRendererContext()
  const key = getKey()

  if(IS_SERVER) {
    if(cache && cache[key]) {
      return {
        data: cache[key].res as T,
        error: cache[key].err,
        loading: false,
      }
    } else {
      // add task to server
      addTask(key, func())
      return { loading: true }
    }
  } else {
    // client: cache will be injected into window.__WED_DATA__
    const [data, setData] = useState<T>(cache[key]?.res)
    const [error, setError] = useState(cache[key]?.err)
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
      setLoading(true)
      func().then(setData).catch(setError)
      setLoading(false)
    }

    useEffect(() => {
      !cache[key] && fetchData()
    }, [])

    return {
      data,
      loading,
      error
    }
  }
}

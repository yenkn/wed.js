import React from 'react'
import ReactDOM from 'react-dom'
import { WedApp } from "./document"

declare global {
  interface Window { __wed_cache: any }
}

export function hydrateServerRenderer(app: React.ReactNode) {
  const rendererData = document.getElementById('__WED_DATA__')?.textContent
  let cache = {}
  if(!window.__wed_cache) {
    cache = rendererData ? JSON.parse(rendererData) : {}
    // eslint-disable-next-line @typescript-eslint/camelcase
    window.__wed_cache = cache
  }

  return ReactDOM.hydrate(
    <WedApp rendererCache={cache}>
        {app}
    </WedApp>, document.getElementById('app'))
}

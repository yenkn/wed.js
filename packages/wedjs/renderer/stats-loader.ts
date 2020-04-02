import isObject from 'lodash/isObject'

// This function makes server rendering of asset references consistent with different webpack chunk/entry configurations
function normalizeAssets(assets) {
  if (isObject(assets)) {
    return Object.values(assets)
  }

  return Array.isArray(assets) ? assets : [assets]
}

export function loadStats(replyObject: any) {
  const fs = replyObject.locals.fs
  const webpackStats = replyObject.locals.webpackStats.toJson()
  const { outputPath, assets: _assets } = webpackStats.children ? webpackStats.children[0] : webpackStats
  const assets = _assets.map(x => x.name)
  const styles = assets.filter(path => path.endsWith(".css")) as string[]
  const scripts = assets.filter(path => path.endsWith(".js")) as string[]

  return {
    fs,
    outputPath,
    assets,
    styles,
    scripts,
  }
}

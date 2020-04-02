import glob from 'glob'
import path from 'path'
import webpack from "webpack"
import filesize from "filesize"
import chalk from "chalk"

export function printWebpackStats(stats: webpack.Stats) {
  if(!stats) return
  if (stats.hasErrors()) {
    console.error(stats.toString());
    return
  } else if (stats.hasWarnings()) {
    console.warn(stats.toString());
  }
  let json = stats.toJson()
  if(json.children) json = json.children[0]
  for(const asset of json.assets) {
    console.log(` ✓ [${filesize(asset.size)}]\t${chalk.green(asset.name)}`)
  }
  console.log(` ✓ webpack ${chalk.green('finished')}: ${json.time}ms`)
}

export function getLambdaRoutes(basePath: string) {
  const routes = {}
  const files = glob.sync(`${basePath}/**/*`, { nodir: true, absolute: true })

  for (const lambda of files) {
    try {
      const exportMembers = require(lambda)
      const meta = path.parse(path.relative(basePath, lambda))
      const relative = path.join(meta.dir, meta.name)

      for (const key in exportMembers) {
        const member = exportMembers[key]
        // ignore exported errors
        if(member.prototype instanceof Error) continue

        const route = key === 'default' ? relative : `${relative}/${key}`
        routes[route] = member
      }

    } catch (e) {
      console.error(`error requiring file ${lambda}: `, e)
      return
    }
  }

  return routes
}

export function clearCache(file: string, recursive: boolean) {
  try {
    const modulePath = require.resolve(file)
    const module = require.cache[modulePath]
    // remove reference in module.parent
    if (module.parent) {
      module.parent.children.splice(module.parent.children.indexOf(module), 1)
      recursive && clearCache(module.parent.id, true)
    }
    delete require.cache[modulePath]
    return true
  } catch(ex) {
    return false
  }
}


export function maximumSubPath(paths: string[]) {
  if(paths.length === 0) return ''

  let subPath = paths[0]

  function pathIntersection(a: string, b: string) {
    let pos = 0
    while(pos < a.length && pos < b.length && a.charAt(pos) === b.charAt(pos)) {
      pos++
    }
    return a.slice(0, pos)
  }

  for(let i = 0; i < paths.length - 1; i++) {
    const intersection = pathIntersection(paths[i], paths[i + 1])
    if(intersection.length < subPath.length) {
      subPath = intersection
    }
  }

  return subPath
}

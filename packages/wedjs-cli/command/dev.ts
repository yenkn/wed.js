import { getAppConfig } from '../config'
import path from 'path'
import { getLambdaRoutes, clearCache, printWebpackStats } from '../util'
import AppServer from 'wedjs/cjs/server/server'
import chalk from 'chalk'
import chokidar from 'chokidar'
import getServerBabelOptions from "../build/babel/preset.server"
import WebpackCompiler from "../build/webpack/compiler"
import { EventType } from "../build/webpack/hybrid/interface"
import wdm from 'webpack-dev-middleware'
import whm from 'webpack-hot-middleware'
import NativeModule from 'module'
import glob from 'glob'
import { promisify } from 'util'

const globAsync = promisify(glob)

function evalModuleCode(filename, code) {
  const sandbox = new NativeModule(filename, module.parent)

  // @ts-ignore
  sandbox.paths = NativeModule._nodeModulePaths(path.dirname(filename))
  sandbox.filename = filename
  // @ts-ignore
  sandbox._compile(code, filename)

  return sandbox.exports
}

export default async function({ port }: { port: number }) {
  const config = getAppConfig()
  const babelOptions = getServerBabelOptions(config)
  const appBundle = path.resolve(config.outDir, 'app.js')
  const documentFile = await globAsync(config.includes[config.includes.length - 1], { absolute: true })

  require('@babel/register')({
    ...babelOptions,
    extensions: config.exts,
  })

  try {
    const compiler = new WebpackCompiler({ isDev: true })
    const webpack = compiler.getWebpackCompiler()
    const fs = compiler.getFileSystem()

    const server = new AppServer({
      assets: { dir: path.resolve(config.publicDir) },
    })
    server.use(wdm(webpack, {
      serverSideRender: true,
      fs: fs,
      publicPath: '/_wed/',
      reporter(middlewareOptions, options) {
        const { stats } = options
        printWebpackStats(stats)
      },
    }))
    // the server bundle app.js doesn't need HMR
    server.use(whm(webpack.compilers[0], {
      publicPath: '/_wed/',
    }))

    const address = await server.start(port)

    console.log(`server listening on ${chalk.yellow(address)}`)
    console.log(`watching`, config.includes)

    // === initialize configs ===
    let App, Document
    const resetRendererConfig = (content: string) => {
      try {
        App = evalModuleCode(appBundle, content).default
        server.setRendererConfig({ App, Document })
      } catch(ex) { console.error(ex) }
    }

    const resetDocumentConfig = (document: string) => {
      try {
        Document = require(document).default
        server.setRendererConfig({ App, Document })
      } catch(ex) { console.error(ex) }
    }
    if(documentFile.length > 0) resetDocumentConfig(documentFile[0])

    const resetLambdaConfig = () => {
      server.setLambdaConfig({ routes: getLambdaRoutes(config.lambdaPath) })
    }
    resetLambdaConfig()

    chokidar.watch(config.includes, { ignoreInitial: true }).on('all',  (event, file) => {
      clearCache(path.resolve(file), true)
      if(path.parse(file).name === '_document') {
        if(event === 'unlink') {
          Document = null
        } else {
          resetDocumentConfig(path.resolve(file))
        }
      } else {
        resetLambdaConfig()
      }
      console.log(` ✓ hot reloaded ${chalk.yellow(file)}`)
    })

    fs.getEmitter().on(EventType.FileChanged, (file, content) => {
      if(file === appBundle) {
        resetRendererConfig(content)
      }
    })

  } catch(ex) {
    console.error(ex)
  }
}

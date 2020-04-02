import fs from 'fs'
import path from 'path'
import AppServer from 'wedjs/cjs/server/server'
import { getAppConfig } from '../config'
import { getLambdaRoutes } from '../util'
import chalk from 'chalk'

export default async function({ port }: { port: number }) {
  const config = getAppConfig()
  const basePath = config.outDir

  if(!fs.existsSync(basePath)) {
    console.error(`please run ${chalk.cyan('npm run build')} first!`)
    process.exit(-1)
  }

  try {
    const server = new AppServer({
      assets: { dir: path.resolve(config.publicDir), prefix: '/_wed/' },
    })

    const webpackStats = JSON.parse(fs.readFileSync(config.statsJSON).toString())

    server.use((req, res, next) => {
      res.locals.webpackStats = {
        toJson: () => webpackStats,
      }
      res.locals.fs = fs
      next()
    })

    const App = require(path.resolve(path.join(basePath, 'app.js'))).default

    let Document = null
    const documentFile = path.resolve(path.join(basePath, '_document.js'))
    if(fs.existsSync(documentFile)) {
      Document = require(documentFile).default
    }

    server.setRendererConfig({ App, Document })

    const routes = getLambdaRoutes(path.join(basePath, config.lambdaPath))
    server.setLambdaConfig({ routes })

    const address = await server.start(port)
    console.log(`server listening on ${chalk.yellow(address)}`)
  } catch(ex) {
    console.error(ex)
  }
}

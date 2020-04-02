import { getAppConfig } from "../config"
import build from "../build/babel/lambda"
import WebpackCompiler from "../build/webpack/compiler"
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'

export default async function() {
  const config = getAppConfig()
  const cwd = process.cwd()

  try {
    const serverGenerator = build(config)
    console.log(chalk.bgYellow.black(' [SERVER] '))
    for await (const file of serverGenerator) {
      console.log(` ✓ compiled ${chalk.cyan(path.relative(cwd, file))}`)
    }
    console.log(` ✓ ${chalk.green('finished')}\n`)

    console.log(chalk.bgBlue.black(' [WEB] '))
    const compiler = new WebpackCompiler({ isDev: false })

    compiler.getWebpackCompiler().run((err, stats) => {
      if(err || stats.hasErrors()) {
        console.log(err || stats)
        return
      }
      fs.writeFileSync(config.statsJSON, JSON.stringify(stats.toJson()))
      console.log(stats.toString({ colors: true }))
    })

  } catch(ex) {
    console.error(ex)
  }
}

#!/usr/bin/env node
import commander from 'commander'
import startCommand from './command/start'
import devCommand from './command/dev'
import buildCommand from './command/build'
import '@babel/polyfill'

const program = new commander.Command()
program.name('wedjs').version(require('../package.json').version)

program
  .command('start')
  .description('starts application in production mode')
  .option('-p, --port [port]', 'exposing port (default: 3000)', 3000)
  .action(startCommand)

program
  .command('dev')
  .description('starts application in development mode, reload when source code changes')
  .option('-p, --port [port]', 'exposing port (default: 3000)', 3000)
  .action(devCommand)

program
  .command('build')
  .description('build project')
  .action(buildCommand)

if (!process.argv.slice(2).length) {
  program.outputHelp()
} else {
  program.parse(process.argv)
}

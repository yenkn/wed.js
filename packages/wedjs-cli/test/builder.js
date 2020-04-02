const buildCommand = require('../cjs/command/build').default
const path = require('path')
const fs = require('fs')

process.chdir(path.join(__dirname, './testProject'))
buildCommand()

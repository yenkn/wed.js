import * as babel from '@babel/core'
import glob from 'glob'
import path from 'path'
import flatten from 'lodash/flatten'
import { promisify } from 'util'
import fs from 'fs'
import { InternalAppConfig } from '../../config'
import getServerBabelOptions from './preset.server'

const mkdirAsync = promisify(fs.mkdir)
const writeFileAsync = promisify(fs.writeFile)
const existsAsync = promisify(fs.exists)
const globAsync = promisify(glob)

export default async function *(option: InternalAppConfig) {
  option.outDir = path.resolve(option.outDir)
  const babelOption = getServerBabelOptions(option)
  const globOption = {
    nodir: true, absolute: false
  }

  const files = flatten(await Promise.all(option.includes.map(p => globAsync(p, globOption))))

  // const subPath = maximumSubPath(files)

  for(const file of files) {
    const result = await babel.transformFileAsync(file, babelOption)

    const fileMeta = path.parse(file)
    const dist = path.join(option.outDir, fileMeta.dir, `${fileMeta.name}.js`)
    const distDirectory = path.dirname(dist)

    if(!await existsAsync(distDirectory)) {
      await mkdirAsync(distDirectory, { recursive: true })
    }
    await writeFileAsync(dist, result.code)
    yield dist
  }
}

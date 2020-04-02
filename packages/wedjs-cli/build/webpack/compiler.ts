import { getAppConfig, InternalAppConfig } from '../../config'
import webpack from 'webpack'
import path from "path"
import getWebpackConfig from './config'
import createEntry from './createEntry'
import HybridFileSystem from './hybrid/hybrid-file-system'

interface CompilerOptions {
  isDev: boolean
}

export default class WebpackCompiler {
  appPath: string
  fs: HybridFileSystem
  isDev: boolean
  appConfig: InternalAppConfig

  constructor(options: CompilerOptions) {
    this.appConfig = getAppConfig()
    this.appPath = path.resolve(this.appConfig.appPath)
    this.fs = new HybridFileSystem(!options.isDev)
    this.isDev = options.isDev

    this.createEntryFile()
  }

  get entry() {
    return path.join(this.appPath, 'index.tsx')
  }

  createEntryFile() {
    const file = createEntry(this.appConfig.appEntry, this.isDev)
    this.fs.addVirtualFile(this.entry, file)
  }

  getFileSystem() {
    return this.fs
  }

  getWebpackCompiler() {
    const compiler = webpack(getWebpackConfig(this.entry, this.isDev))

    const compilers = compiler instanceof webpack.Compiler ? [compiler] : compiler.compilers

    compilers.forEach(cpl => {
      this.fs.setInputFileSystem(cpl.inputFileSystem as any)
      this.fs.setOutputFileSystem(cpl.outputFileSystem as any)

      cpl.inputFileSystem = this.fs as any
      cpl.outputFileSystem = this.fs as any
    })

    return compiler
  }
}

import path from 'path'
import fs from 'fs'
import webpack from 'webpack'
import babel from '@babel/core'
import babelRegister, { revert } from '@babel/register'

export interface AppBabelConfig {
  presets?: babel.PluginItem[]
  plugins?: babel.PluginItem[]
}

export interface AppConfig {
  appPath?: string
  lambdaPath?: string
  contextPath?: string
  extraPath?: string[] | string
  extensions: string[]

  appEntry?: string

  outDir?: string
  publicDir?: string

  webpack?: webpack.Configuration
  webpackRules?: webpack.RuleSetRule[]

  serverWebpack?: webpack.Configuration
  serverWebpackRules?: webpack.RuleSetRule[]

  babel?: AppBabelConfig
  webBabel?: AppBabelConfig
  serverBabel?: AppBabelConfig
}

export interface InternalAppConfig extends AppConfig {
  includes?: string[]
  exts?: string[]
  pattern?: string
  statsJSON?: string
}

let cachedConfig: InternalAppConfig = null

function combineBabel(base: AppBabelConfig, config: AppBabelConfig) {
  return {
    presets: (base?.presets || []).concat(config?.presets || []),
    plugins: (base?.plugins || []).concat(config?.plugins || []),
  }
}

export function getAppConfig(): InternalAppConfig {
  if(cachedConfig) return cachedConfig

  const defaultConfig: AppConfig = {
    appPath: './app',
    lambdaPath: './lambda',
    contextPath: './context',
    extraPath: [],
    extensions: ['ts', 'tsx'],

    appEntry: 'App',

    outDir: './dist',
    publicDir: './public',
  }

  cachedConfig = defaultConfig

  if(fs.existsSync('./wed.config.ts')) {
    babelRegister({
      presets: [
        ["@babel/preset-env", { targets: { "node": "current" } }],
        ["@babel/preset-typescript"],
      ],
      extensions: ['.ts']
    })
  }

  try {
    const config = require(path.resolve('./wed.config')).default
    revert()
    Object.assign(cachedConfig, config)
  } catch(ex) {}

  if(typeof cachedConfig.extraPath === 'string') {
    cachedConfig.extraPath = [cachedConfig.extraPath]
  }

  const extensions = cachedConfig.extensions.join(',')
  cachedConfig.pattern = `/**/*.{${extensions}}`
  cachedConfig.includes = [
    cachedConfig.lambdaPath,
    cachedConfig.contextPath,
    ...cachedConfig.extraPath,
  ].map(path => `${path}${cachedConfig.pattern}`)
  cachedConfig.includes.push(`./_document.{${extensions}}`)
  cachedConfig.exts = cachedConfig.extensions.map(x => `.${x}`)
  cachedConfig.statsJSON = path.join(cachedConfig.outDir, 'stats.json')
  cachedConfig.webBabel = combineBabel(cachedConfig.babel, cachedConfig.webBabel)
  cachedConfig.serverBabel = combineBabel(cachedConfig.babel, cachedConfig.serverBabel)
  cachedConfig.webpackRules = cachedConfig.webpackRules || []
  cachedConfig.serverWebpackRules = cachedConfig.serverWebpackRules || []

  return cachedConfig
}

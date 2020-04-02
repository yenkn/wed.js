import { getAppConfig } from "../../config"
import webpack from "webpack"
import path from 'path'
import getWebBabelOptions  from "../babel/preset.web"
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import nodeExternals from 'webpack-node-externals'

export default function getWebpackConfig(webEntry: string, isDev: boolean) {
  const appConfig = getAppConfig()
  const { appPath, appEntry, publicDir, outDir } = appConfig

  const entry = path.join(path.resolve(appPath), appEntry)

  const babelLoader = {
    loader: 'babel-loader',
    options: getWebBabelOptions(appConfig)
  }

  const getFileLoader = (emitFile = true) => ({
    test: /\.(png|svg|jpg|gif|woff|woff2|eot|ttf|otf)$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          publicPath: '/_wed/',
          emitFile,
        }
      }
    ],
  })

  const cssLoader = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDev,
        reloadAll: isDev,
      }
    },
    'css-loader?modules'
  ]

  const commonConfig: webpack.Configuration = {
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'inline-source-map' : false,
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test: /\.tsx?$/,
          use: [babelLoader],
        },
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js', '.jsx' ],
    },
  }

  return [
    {
      ...commonConfig,
      entry: isDev ? ['webpack-hot-middleware/client', webEntry] : [webEntry],
      module: {
        rules: [
          ...commonConfig.module.rules,
          getFileLoader(),
          {
            test: /\.css$/,
            use: cssLoader
          },
          {
            test: /\.scss$/,
            use: cssLoader.concat('sass-loader')
          },
          ...appConfig.webpackRules
        ],
      },
      plugins: [
        new MiniCssExtractPlugin()
      ].concat(isDev ? [new webpack.HotModuleReplacementPlugin()] : []),
      resolve: {
        ...commonConfig.resolve,
        alias: isDev ? {
          'react-dom': '@hot-loader/react-dom',
        }: {}
      },
      ...appConfig.webpack,
      output: {
        filename: 'bundle.js',
        publicPath: '/_wed/',
        path: path.join(path.resolve(publicDir), '_wed'),
      }
    },
    {
      ...commonConfig,
      entry: [entry],
      target: 'node',
      module: {
        rules: [
          ...commonConfig.module.rules,
          getFileLoader(false),
          {
            test: /\.css$/,
            use: ["css-loader?modules&onlyLocals"]
          },
          {
            test: /\.scss$/,
            use: ["css-loader?modules&onlyLocals", 'sass-loader']
          },
          ...appConfig.serverWebpackRules,
        ]
      },
      externals: [nodeExternals()],
      ...appConfig.serverWebpack,
      output: {
        filename: 'app.js',
        publicPath: '/_wed/',
        path: path.resolve(outDir),
        libraryTarget: 'commonjs2',
      }
    }
  ] as webpack.Configuration[]
}

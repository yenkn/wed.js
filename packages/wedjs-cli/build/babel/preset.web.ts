import lambdaImportToRequest from "./plugin/lambda-import-to-request"
import { InternalAppConfig } from "../../config"

export default function(config: InternalAppConfig) {
  const lambdaPath = config.lambdaPath

  return {
    presets: [
      ["@babel/preset-react"],
      ["@babel/preset-env", { targets: "> 0.25%, not dead" }],
      ["@babel/preset-typescript"],
      ...config.webBabel.presets,
    ],
    plugins: [
      "react-hot-loader/babel",
      [lambdaImportToRequest, { lambdaPath }],
      ...config.webBabel.plugins,
    ]
  }
}

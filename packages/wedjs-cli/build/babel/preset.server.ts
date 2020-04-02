import { InternalAppConfig } from "../../config"

export default function(config: InternalAppConfig) {
  return {
    presets: [
      ["@babel/preset-react"],
      ["@babel/preset-env", { targets: { "node": "7.6.0" } }],
      ["@babel/preset-typescript"],
      ...config.serverBabel.presets,
    ],
    plugins: [
      ...config.serverBabel.plugins,
    ]
  }
}

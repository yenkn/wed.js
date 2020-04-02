import { ServerApplier } from '../server/interface'
import fs from 'fs'
import path from 'path'
import mimeTypes from 'mime-types'
import { loadStats } from "../renderer/stats-loader"

export interface AssetConfig {
  dir: string
  prefix?: string
}

export class AssetApplier extends ServerApplier<AssetConfig> {
  cachedFiles = new Map<string, Buffer>()
  files: string[] = []

  apply(): void {
    this.adapter.use((request, reply, next) => {
      if(!this.config) {
        next()
        return
      }
      const { dir, prefix } = this.config

      const realpath = path.join(path.resolve(dir), request.url)
      const type = mimeTypes.lookup(realpath)

      if(this.cachedFiles.has(realpath)) {
        reply.type(type).send(this.cachedFiles.get(realpath))
        return
      }

      let fsToRead = fs

      if(prefix && request.url.startsWith(prefix)) {
        const { fs, assets } = loadStats(reply)

        if(assets.find(asset => realpath.endsWith(prefix + asset))) {
          fsToRead = fs
        } else {
          reply.status(404).send('404 Not Found')
          return
        }
      }

      fsToRead.readFile(realpath, (err, res) => {
        if(err) {
          next()
          return
        }

        this.cachedFiles.set(realpath, res)
        reply.type(type).send(res)
      })
    })
  }
}

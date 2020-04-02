import React from 'react'
import { ServerApplier } from '../server/interface'
import Document from './document'

export interface RendererConfig {
  App: React.ComponentType
  Document?: typeof Document
}

export class RendererApplier extends ServerApplier<RendererConfig> {
  apply(): void {
    this.adapter.route('GET', '*', async (request, reply) => {
      try {
        const CustomDocument = this.config.Document || Document
        const doc = new CustomDocument(request, reply, this.config.App)
        const html = await doc.render()

        reply.status(200).type('text/html').send('<!DOCTYPE html>' + html)
      } catch(ex) {
        reply.status(500).send(ex.toString())
      }
    })
  }
}


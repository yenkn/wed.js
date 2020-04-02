import AppServer from '../server/server'
import React from 'react'
import fetch from 'isomorphic-unfetch'
import { useContext } from '../context/context'

describe('server-test', () => {
  let server: AppServer

  beforeAll(() => {
    server = new AppServer()

    server.setRendererConfig({
      App: React.Fragment
    })
    server.setLambdaConfig({
      routes: {
        "test": async () => {
          const { request } = useContext()
          return request.ip
        }
      }
    })
    server.start(3002).then(addr => console.log(addr))
  })
  
  test('listen-works', async () => {
    const res = await fetch('http://localhost:3002/')
    expect(res.status).toBe(200)
  })

  test('lambda-works', async () => {
    const res = await fetch('http://localhost:3002/lambda/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ params: [] }),
    });
    expect(await res.json()).toEqual({ code: 0, response: '::ffff:127.0.0.1' })
  })
})
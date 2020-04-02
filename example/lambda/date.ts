import { useContext } from 'wedjs/context'

export async function getDate() {
  const { request } = useContext()

  return {
    ip: request.ip,
    time: new Date().toISOString(),
  }
}

export async function setDate() {
  
}
import { createUser } from '../lambda/group/user'
import { useCallback } from 'react'

export default function Dash(props: any) {
  const handler = useCallback(async () => {
    await createUser()
  }, [])

  return <div onClick={handler}></div>
}

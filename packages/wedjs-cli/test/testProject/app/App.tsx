import { usePromise } from 'wedjs/ssr'
import testFunc, { testSubFunc } from '../lambda/testFunc'
import * as user from '../lambda/group/user'
import { useCallback } from 'react'
import Dash from './Dash'

export default function (props: any) {
  const { data: testData } = usePromise(() => testFunc('test'))
  const { data: testSubData } = usePromise(() => testSubFunc())

  const handler = useCallback(async () => {
    await user.createUser()
  }, [])

  return <div onClick={handler}>{testData}, {testSubData} <Dash/></div>
}

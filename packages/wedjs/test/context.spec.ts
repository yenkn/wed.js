import { ServerContext } from '../context/context'
import { useContext } from '../context/context'
import DefaultContext from '../context/default-context'

describe('context-test', () => {
  let ret = {} as any

  test('async context works', async () => {
    const lambdaFunction = async () => {
      ret = useContext()
      return 123
    }

    await ServerContext.run([DefaultContext], [{ abc: 123 } as any, {} as any], async () => {
      const res = await lambdaFunction()
      expect(res).toBe(123)
    })

    expect(ret?.request?.abc).toBe(123)
  })
})
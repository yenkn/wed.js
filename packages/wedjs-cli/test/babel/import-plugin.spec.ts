import * as babel from '@babel/core'
import importRequestPlugin from '../../build/babel/plugin/lambda-import-to-request'
import path from 'path'

const code = `
import types, { getUserList, createUser } from './lambda/test'

const useUserList = () => {
  const fetch = getUserList()
  
  useEffect(() => {
    fetch()
  }, [])
}

const App1 = () => {
  const { data } = useRequest(() => getUserList())
  const { data1 } = useRequest(() => types['getUserList']())
  const { data2 } = useRequest(getUserList, [keyword])
  const { data3 } = useRequest((page) => getUserList('keyword', page), [page])
  
  const handleClick = useCallback(() => {
  	const fetch = () => createUser(state)
    fetch()
  }, [state])
  
  return <div><Dash/></div>
}

function App2(props) {
  const { data } = useUserList()
}

export function App3() {
}

export default function() {
}

export const App4 = () => {
}

const App5 = () => <div></div>
`


describe('import-plugin-test', () => {
  beforeAll(() => {
    process.chdir(__dirname)
  })

  it('plugin-works', async () => {
    const options = {
      presets: [
        ["@babel/preset-react"],
      ],
      plugins: [
        [importRequestPlugin, { lambdaPath: './lambda' }]
      ]
    }

    const res = await babel.transformAsync(code, {
      ...options,
      filename: path.resolve('./App.tsx'),
    })
    // console.log(res.code)
    expect(res.code).toMatchSnapshot()
  })
})

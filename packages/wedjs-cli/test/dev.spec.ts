import devCommand from '../command/dev'
import path from 'path'

describe('dev-test', () => {
  beforeAll(async () => {
    process.chdir(path.join(__dirname, './testProject'))
  })

  it('should start dev service', async () => {
    await devCommand({ port: 3000 })
  })
})

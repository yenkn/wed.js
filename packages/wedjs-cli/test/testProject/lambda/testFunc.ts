export default async function testFunc(param: string): Promise<number> {
  return 123 + parseInt(param)
}

export async function testSubFunc() {
  return 123
}

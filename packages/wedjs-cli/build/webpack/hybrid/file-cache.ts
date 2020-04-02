import { File } from './interface'


export default class FileCache {

  private map = new Map<string, File>()

  set(key: string, file: File) {
    file.timestamp = Date.now()
    this.map.set(key, file)
  }

  get(key: string): File {
    return this.map.get(key)
  }

  has(key: string) {
    return this.map.has(key)
  }

  remove(key: string): boolean {
    return this.map.delete(key)
  }

  getAll() {
    const list: File[] = []
    this.map.forEach((file: File) => {
      list.push(file)
    })
    return list
  }

  getRawStore(): Map<string, File> {
    return this.map
  }
}

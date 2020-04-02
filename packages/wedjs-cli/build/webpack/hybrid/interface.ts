import { VirtualDirStats, VirtualFileStats } from './virtual-file'

export interface File {
  path: string
  content: string
  timestamp?: number
}

export enum EventType {
  FileChanged = 'fileChanged'
}

export interface FileSystem {
  isSync(): boolean
  stat(path: string, callback: Function): any
  statSync(path: string): any
  readdir(path: string, callback: Function): any
  readFile(path: string, callback: Function): any
  readFileSync(path: string): any
  readJson(path: string, callback: Function): any
  readlink(path: string, callback: Function): any
  purge(what: any): void
  writeFile(filePath: string, fileContent: Buffer, callback: Function): void
  mkdirp(filePath: string, callback: Function): void
  mkdir(filePath: string, callback: Function): void
  rmdir(filePath: string, callback: Function): void
  unlink(filePath: string, callback: Function): void
}


export interface VirtualFileSystem {
  addVirtualFile(filePath: string, fileContent: string): void
  getFileContent(filePath: string): string
  getDirectoryStats(path: string): VirtualDirStats
  getSubDirs(directoryPath: string): string[]
  getFileNamesInDirectory(directoryPath: string): string[]
  getAllFileStats():  { [filePath: string]: VirtualFileStats }
  getAllDirStats():  { [filePath: string]: VirtualDirStats }
}

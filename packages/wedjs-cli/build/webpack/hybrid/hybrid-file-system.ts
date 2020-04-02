import { basename, dirname, join } from 'path'
import { EventType, FileSystem, VirtualFileSystem } from './interface'
import FileCache from './file-cache'
import { VirtualDirStats, VirtualFileStats } from './virtual-file'
import { EventEmitter } from "events"

/**
 * Original source code from Ionic Team
 * https://github.com/ionic-team/ionic-app-scripts/blob/master/src/util/hybrid-file-system.ts
 */

export default class HybridFileSystem implements FileSystem, VirtualFileSystem {

  private filesStats: { [filePath: string]: VirtualFileStats } = {}
  private directoryStats: { [filePath: string]: VirtualDirStats } = {}
  private inputFileSystem: FileSystem
  private outputFileSystem: FileSystem
  private readonly writeToDisk: boolean
  private fileCache: FileCache = new FileCache()
  private emitter = new EventEmitter()

  constructor(writeToDisk: boolean) {
    this.writeToDisk = writeToDisk
  }

  setInputFileSystem(fs: FileSystem) {
    this.inputFileSystem = fs
  }

  setOutputFileSystem(fs: FileSystem) {
    this.outputFileSystem = fs
  }

  getEmitter() {
    return this.emitter
  }

  getFileCache() {
    return this.fileCache
  }

  isSync() {
    return this.inputFileSystem.isSync()
  }

  stat(path: string, callback: Function): any {
    // first check the fileStats
    const fileStat = this.filesStats[path]
    if (fileStat) {
      return callback(null, fileStat)
    }
    // then check the directory stats
    const directoryStat = this.directoryStats[path]
    if (directoryStat) {
      return callback(null, directoryStat)
    }
    // fallback to list
    return this.inputFileSystem.stat(path, callback)
  }

  statSync(path: string) {
    const fileStat = this.filesStats[path];
    if (fileStat) {
      return fileStat;
    }
    const directoryStat = this.directoryStats[path];
    if (directoryStat) {
      return directoryStat;
    }
    return this.inputFileSystem.statSync(path);
  }

  readdir(path: string, callback: Function): any {
    return this.inputFileSystem.readdir(path, callback)
  }

  readJson(path: string, callback: Function): any {
    return this.inputFileSystem.readJson(path, callback)
  }

  readlink(path: string, callback: Function): any {
    return this.inputFileSystem.readlink(path, (err: Error, response: any) => {
      callback(err, response)
    })
  }

  purge(pathsToPurge: string[]): void {
    if (this.fileCache) {
      for (const path of pathsToPurge) {
        this.fileCache.remove(path)
      }
    }
  }

  readFile(path: string, callback: Function): any {
    const file = this.fileCache.get(path)
    if (file) {
      callback(null, Buffer.from(file.content))
      return
    }
    return this.inputFileSystem.readFile(path, callback)
  }

  readFileSync(path: string) {
    const file = this.fileCache.get(path);
    if (file) {
      return Buffer.from(file.content);
    }
    return this.inputFileSystem.readFileSync(path);
  }

  addVirtualFile(filePath: string, fileContent: string) {
    this.fileCache.set(filePath, { path: filePath, content: fileContent })
    const fileStats = new VirtualFileStats(filePath, fileContent)
    this.filesStats[filePath] = fileStats
    const directoryPath = dirname(filePath)
    const directoryStats = new VirtualDirStats(directoryPath)
    this.directoryStats[directoryPath] = directoryStats
    this.emitter.emit(EventType.FileChanged, filePath, fileContent)
  }

  getFileContent(filePath: string) {
    const file = this.fileCache.get(filePath)
    if (file) {
      return file.content
    }
    return null
  }

  getFiles() {
    return Object.keys(this.filesStats)
  }

  getDirectoryStats(path: string): VirtualDirStats {
    return this.directoryStats[path]
  }

  getSubDirs(directoryPath: string): string[] {
    return Object.keys(this.directoryStats)
      .filter(filePath => dirname(filePath) === directoryPath)
      .map(filePath => basename(directoryPath))
  }

  getFileNamesInDirectory(directoryPath: string): string[] {
    return Object.keys(this.filesStats).filter(filePath => dirname(filePath) === directoryPath).map(filePath => basename(filePath))
  }

  getAllFileStats(): { [filePath: string]: VirtualFileStats } {
    return this.filesStats
  }

  getAllDirStats():  { [filePath: string]: VirtualDirStats } {
    return this.directoryStats
  }

  mkdirp(filePath: string, callback: Function) {
    if (this.writeToDisk) {
      return this.outputFileSystem.mkdirp(filePath, callback)
    }
    callback()
  }

  mkdir(filePath: string, callback: Function) {
    if (this.writeToDisk) {
      return this.outputFileSystem.mkdir(filePath, callback)
    }
    callback()
  }

  rmdir(filePath: string, callback: Function) {
    if (this.writeToDisk) {
      return this.outputFileSystem.rmdir(filePath, callback)
    }
    callback()
  }

  unlink(filePath: string, callback: Function) {
    if (this.writeToDisk) {
      return this.outputFileSystem.unlink(filePath, callback)
    }
    callback()
  }

  join(dirPath: string, fileName: string) {
    return join(dirPath, fileName)
  }

  writeFile(filePath: string, fileContent: Buffer, callback: Function) {
    const stringContent = fileContent.toString()
    this.addVirtualFile(filePath, stringContent)
    if (this.writeToDisk) {
      return this.outputFileSystem.writeFile(filePath, fileContent, callback)
    }
    callback()
  }
}

import FileCache from './file-cache'
import { EventType, File } from "./interface"
import { EventEmitter } from "events"

export default class WatchMemorySystem {

  private changes: Set<string>
  private isAggregating: boolean
  private isListening: boolean
  private lastWatchEventTimestamp: number = Date.now()

  private filePathsBeingWatched: string[]
  private dirPaths: string[]
  private missing: string[]
  private startTime: number
  private options: any
  private immediateCallback: (filePath: string, timestamp: number) => void
  private aggregatedCallback: (err: Error, changesFilePaths: string[], dirPaths: string[], missingPaths: string[], timesOne: any, timesTwo: any) => void

  constructor(private fileCache: FileCache, private srcDir: string, private emitter: EventEmitter) {

  }

  close() {
    this.isListening = false
  }

  pause() {
    this.isListening = false
  }

  watch(filePathsBeingWatched: string[], dirPaths: string[], missing: string[], startTime: number, options: any, aggregatedCallback: (err: Error, changesFilePaths: string[]) => void, immediateCallback: (filePath: string, timestamp: number) => void) {
    this.filePathsBeingWatched = filePathsBeingWatched
    this.dirPaths = dirPaths
    this.missing = missing
    this.startTime = startTime
    this.options = options

    this.immediateCallback = immediateCallback
    this.aggregatedCallback = aggregatedCallback

    if (!this.isListening) {
      this.startListening()
    }

    return {
      pause: this.pause,
      close: this.close
    }
  }

  private isNewFile = (file: File) => {
    return file.timestamp >= this.lastWatchEventTimestamp
      && file.path.startsWith(this.srcDir)
  }

  startListening() {
    this.isListening = true
    this.emitter.on(EventType.FileChanged, () => {
      this.changes = new Set<string>()
      const filePaths = this.fileCache
        .getAll()
        .filter(this.isNewFile)
        .map(file => file.path)

      this.lastWatchEventTimestamp = Date.now()
      this.processChanges(filePaths)
    })
  }

  processChanges(filePaths: string[]) {
    this.immediateCallback(filePaths[0], Date.now())
    for (const path of filePaths) {
      this.changes.add(path)
    }
    // don't bother waiting around, just call doneAggregating right away.
    // keep it as a function in case we need to wait via setTimeout a bit in the future
    this.doneAggregating(this.changes)
  }

  doneAggregating(changes: Set<string>) {
    this.isAggregating = false
    // process the changes
    const filePaths = Array.from(changes)
    const files = filePaths.filter(filePath => this.filePathsBeingWatched.indexOf(filePath) >= 0).sort()
    const dirs = filePaths.filter(filePath => this.dirPaths.indexOf(filePath) >= 0).sort()
    const missing = filePaths.filter(filePath => this.missing.indexOf(filePath) >= 0).sort()
    const times = this.getTimes(this.filePathsBeingWatched, this.startTime, this.fileCache)
    this.aggregatedCallback(null, files, dirs, missing, times, times)
  }

  getTimes(allFiles: string[], startTime: number, fileCache: FileCache) {
    const times = new Map<string, number>()
    for (const filePath of allFiles) {
      const file = fileCache.get(filePath)
      times.set(filePath, file ? file.timestamp : startTime)
    }
    return times
  }
}

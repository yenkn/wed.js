import { NodePath, PluginObj } from '@babel/core'
import * as BabelTypes from '@babel/types'
import * as BabelParser from '@babel/parser'
import traverse from "@babel/traverse"
import fs from 'fs'
import { join as joinPath, parse as parsePath } from 'path'

/**
 * Load import on demand plugin
 *
 * transform `import { usePromise } from 'wedjs'`
 *  to `import { usePromise } from 'wedjs/cjs/renderer/context'`
 *
 * Steps:
 *
 * 1. read imported symbols
 * 2. resolve module main script (e.g. ./cjs/index.js)
 * 3. read corresponding ./cjs/index.d.ts, transform to babel AST
 * 4. get exported symbols and source files
 * 5. match symbols, replace original import declaration
 */

interface State {
  opts: {
    module: string
  }
}

interface ModuleInfo {
  path: string
  symbols: Map<string, SymbolInfo>
}

interface SymbolInfo {
  source: string
  isDefault: boolean
}

const moduleCache = new Map<string, ModuleInfo>()

function getModuleSymbolMap(path: any, source: string) {
  if(moduleCache.has(source)) {
    return moduleCache.get(source)
  }

  // find module entry file index.js
  let moduleMain: string

  try {
    moduleMain = require.resolve(source)
  } catch(ex) {
    throw path.buildCodeFrameError(`can't resolve module ${source}`)
  }

  // find corresponding index.d.ts, transform to babel AST
  const meta = parsePath(moduleMain)
  const moduleIndexTS = meta.ext === '.ts' ? moduleMain : joinPath(meta.dir, `${meta.name}.d.ts`)
  if(!fs.existsSync(moduleIndexTS)) {
    throw path.buildCodeFrameError("can't find module typing file")
  }
  const typing = fs.readFileSync(moduleIndexTS).toString()
  const ast = BabelParser.parse(typing, {
    strictMode: false,
    allowImportExportEverywhere: true,
  })

  // get exported symbols
  let symbolMap = new Map<string, SymbolInfo>()
  traverse(ast, {
    ExportNamedDeclaration(exportPath) {
      exportPath
        .get('specifiers')
        .forEach(spec => {
          // support `export { NamedExport } from './xxx'` only
          if(!spec.isExportSpecifier()) return

          symbolMap.set(spec.node.exported.name, {
            source: exportPath.node.source.value,
            isDefault: spec.node.local.name === 'default'
          })
        })
    },
  })

  const ret = {
    path: meta.dir,
    symbols: symbolMap,
  }
  moduleCache.set(source, ret)
  return ret
}

export default function({ types: t }: { types: typeof BabelTypes }): PluginObj<State> {
  return {
    visitor: {
      ImportDeclaration(path: NodePath<BabelTypes.ImportDeclaration>, state) {
        const source = path.node.source.value
        if(source !== state.opts.module) {
          return
        }

        const symbolInfo = getModuleSymbolMap(path, source)

        // get imported symbols
        const symbols = path.get('specifiers').map(specifier => {
          if(!specifier.isImportSpecifier()) {
            throw path.buildCodeFrameError("unsupported import type, support { namedImport } only")
          }

          return specifier.node.imported.name
        })

        // match symbols
        const imports = symbols.map(symbol => {
          const source = symbolInfo.symbols.get(symbol)
          if(!source) throw path.buildCodeFrameError(`cannot find exported member ${symbol}`)

          const fromFile = joinPath(symbolInfo.path, source.source)
          const identifier = t.identifier(symbol)
          return t.importDeclaration(
            [source.isDefault
              ? t.importDefaultSpecifier(identifier)
              : t.importSpecifier(identifier, identifier)],
            t.stringLiteral(fromFile)
          )
        })

        path.replaceWithMultiple(imports)
      }
    }
  }
}

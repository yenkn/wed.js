import { NodePath, PluginObj } from '@babel/core'
import * as BabelTypes from '@babel/types'
import { resolve, dirname, parse as parsePath } from 'path'
import template from '@babel/template'

const lambdaClientImports = template.ast(`
  import { 
    requestLambda as __requestLambda,
    useLambdaContext as __useLambdaContext,
  } from 'wedjs/cjs/lambda/client';
  const __wed_lambda_config = {};
`)

const lambdaContextDefinition = template.ast(`
  const __wed_lambda_config = __useLambdaContext();
`)


function transformSpecifier(
  type: typeof BabelTypes,
  path: NodePath<BabelTypes.ImportDeclaration>,
  routePath: string,
  specifier: NodePath<BabelTypes.ImportDefaultSpecifier | BabelTypes.ImportNamespaceSpecifier | BabelTypes.ImportSpecifier>
) {
  function replaceLambdaIdentifier(ref: NodePath<BabelTypes.Node>, route: string) {
    let call: NodePath<BabelTypes.CallExpression>
    if(ref.parentPath.isCallExpression()) {
      call = ref.parentPath
    } else if(ref.parentPath?.parentPath.isCallExpression()) {
      // member expression
      call = ref.parentPath.parentPath
    } else {
      throw ref.buildCodeFrameError("only direct call on lambda function is supported: e.g. callLambda(param)")
    }

    call.replaceWith(
      type.callExpression(
        type.identifier('__requestLambda'),
        [
          type.stringLiteral(route),
          type.identifier('__wed_lambda_config'),
          ...call.node.arguments,
        ]
      )
    )
  }

  if(specifier.isImportDefaultSpecifier()) {
    // import DefaultImport from './lambda/testFunc'
    const defaultName = specifier.node.local.name
    const binding = path.scope.getBinding(defaultName)

    if (!binding) return

    binding.referencePaths.forEach(ref => {
      replaceLambdaIdentifier(ref, routePath)
    })
  } else if(specifier.isImportNamespaceSpecifier()) {
    // import * as namespaceImport from './lambda/test'
    const defaultName = specifier.node.local.name
    const binding = path.scope.getBinding(defaultName)
    if (!binding) return

    binding.referencePaths.forEach(ref => {
      const parent = ref.parentPath

      if(!parent.isMemberExpression()) {
        throw parent.buildCodeFrameError("invalid namespace import usage")
      }

      let value: string
      if(type.isIdentifier(parent.node.property)) {
        value = parent.node.property.name
      } else if(type.isStringLiteral(parent.node.property)) {
        value = parent.node.property.value
      } else {
        throw parent.buildCodeFrameError("invalid member expression")
      }

      replaceLambdaIdentifier(ref, `${routePath}/${value}`)
    })
  } else if(specifier.isImportSpecifier()) {
    // import { importName as localName } from './lambda/test'
    const importName = specifier.node.imported.name
    const localName = specifier.node.local.name

    const binding = path.scope.getBinding(localName)
    if (!binding) return

    binding.referencePaths.forEach(ref => {
      replaceLambdaIdentifier(ref, `${routePath}/${importName}`)
    })
  }
}

const isReactName = (name: string) => name.startsWith('use') || name.charAt(0) === name.charAt(0).toUpperCase()

function addLambdaContext(
  path: NodePath<BabelTypes.FunctionDeclaration | BabelTypes.ArrowFunctionExpression>,
  filename: string
) {
  if(path.node.async || path.node.generator) {
    // no async or generator in react component or react hooks,
    // except for Concurrent Mode
    return false
  }

  // @ts-ignore
  const name: string = path.parentPath?.node.id?.name || path.node.id?.name
  const filemeta = parsePath(filename)
  // react hooks or functional component
  const nameMatched = name && isReactName(name)
  const filenameMatched = isReactName(filemeta.name)
  const isDefaultExported = path.isFunctionDeclaration() && path.parentPath.isExportDefaultDeclaration()

  if(nameMatched || (isDefaultExported && filenameMatched)) {
    const body = path.get('body')
    if(!body.isBlockStatement()) {
      body.replaceWith(BabelTypes.blockStatement([BabelTypes.returnStatement(body.node as any)]))
    }
    body.unshiftContainer('body', lambdaContextDefinition)
  }
}

interface State {
  file: any
  opts: {
    lambdaPath: string
  }
}

export default function({ types: t }): PluginObj<State> {
  return {
    visitor: {
      Program(path) {
        path.unshiftContainer('body', lambdaClientImports)
      },
      ArrowFunctionExpression(path, state) {
        addLambdaContext(path, state.file.opts.filename)
      },
      FunctionDeclaration(path, state) {
        addLambdaContext(path, state.file.opts.filename)
      },
      ImportDeclaration(path, state) {
        const filename = state.file.opts.filename
        const source = path.node.source.value
        const lambdaPath = resolve(state.opts.lambdaPath)
        const realPath = resolve(dirname(filename), source)

        if(!realPath || !realPath.startsWith(lambdaPath)) {
          return
        }

        // remove extension and lambda path: /path/to/lambda/user/admin.ts => user/admin
        const route = realPath.replace(/\.[^/.]+$/, '').replace(lambdaPath, '').slice(1)
        path.get('specifiers').forEach(specifier => {
          transformSpecifier(t, path, route, specifier)
        })

        path.remove()
      }
    }
  }
}

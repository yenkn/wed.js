import React, { HTMLAttributes, useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { HelmetData } from 'react-helmet'
import { ServerRequest, ServerResponse } from "../server/interface"
import { ServerLocation, isRedirect } from "@reach/router"
import { CacheType, RendererContextProvider } from "./context"
import { HelmetProvider } from "react-helmet-async"
import ReactDOM from "react-dom/server"
import fromPairs from "lodash/fromPairs"
import { loadStats } from "./stats-loader"

interface DocumentProps {
  styles?: string[]
  scripts?: string[]
  app?: string
  wedData?: string
  helmet?: HelmetData
}

const DocumentContext = React.createContext<DocumentProps>({})

export const DocumentRenderer: React.FC<DocumentProps> = ({ children, ...restProps }) => {
  return <DocumentContext.Provider value={restProps}>
    {children}
  </DocumentContext.Provider>
}

export interface WedAppProps {
  helmetContext?: { helmet?: HelmetData }
  rendererCache?: CacheType
  rendererTask?: any
}

export const WedApp: React.FC<WedAppProps> = ({ children, helmetContext, rendererCache, rendererTask }) => {
  return <HelmetProvider context={helmetContext}>
    <Helmet>
      <title>Wed Application</title>
      <link rel="icon" href='/favicon.png' />
    </Helmet>
    <RendererContextProvider tasks={rendererTask} cache={rendererCache}>
      {children}
    </RendererContextProvider>
  </HelmetProvider>
}

export default class Document {
  constructor(
    protected request: ServerRequest,
    protected response: ServerResponse,
    protected appComponent: any
  ) {
    this.init()
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  init() {}

  renderDocument() {
    return <Html>
      <Head />
      <body>
        <Main/>
        <Scripts/>
      </body>
    </Html>
  }

  renderRouter() {
    return (
      <ServerLocation url={this.request.url}>
          {this.renderApp(this.appComponent)}
      </ServerLocation>
    )
  }

  renderApp(App: React.ComponentType) {
    return <App />
  }

  renderToString(node: React.ReactElement): string | false {
    try {
      return ReactDOM.renderToString(node)
    } catch (e) {
      if(isRedirect(e)) {
        this.response.redirect(e.uri)
        return false
      } else {
        throw e
      }
    }
  }

  private async execTasks(tasks): Promise<CacheType> {
    const collected = Object.keys(tasks).map(k =>
      tasks[k].then(
        res => [k, { res, status: "fulfilled" }],
        err => [k, { err, status: "rejected" }]
      )
    )

    // execute tasks
    return fromPairs(await Promise.all(collected))
  }

  /**
   * @final
   */
  async render() {
    const router = this.renderRouter()

    // collect tasks
    const tasks = {}
    if(!this.renderToString(<WedApp rendererTask={tasks}>{router}</WedApp>)) return

    const cache = await this.execTasks(tasks)

    const helmetContext = {} as any
    const html = this.renderToString(
      <WedApp rendererCache={cache} helmetContext={helmetContext}>
        {router}
      </WedApp>
    )
    if(!html) return

    const { styles, scripts } = loadStats(this.response)
    return ReactDOM.renderToStaticMarkup(
      <DocumentRenderer
        styles={styles}
        scripts={scripts}
        app={html}
        wedData={JSON.stringify(cache)}
        helmet={helmetContext.helmet}>
        {this.renderDocument()}
      </DocumentRenderer>
    )
  }
}

export const Html: React.FC<HTMLAttributes<HTMLElement>> = ({ children, ...restProps }) => {
  const ctx = useContext(DocumentContext)
  const helmetAttrs = ctx.helmet.htmlAttributes.toComponent()

  return <html {...restProps} {...helmetAttrs}>{children}</html>
}

export const Head: React.FC<HTMLAttributes<HTMLHeadElement>> = ({ children, ...restProps }) => {
  const ctx = useContext(DocumentContext)

  return <head {...restProps}>
    <meta charSet="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    {ctx.styles.map(file => <link key={file} rel="stylesheet" href={`/_wed/${file}`} />)}
    {children}
    {ctx.helmet.title.toComponent()}
    {ctx.helmet.meta.toComponent()}
    {ctx.helmet.link.toComponent()}
    {ctx.helmet.style.toComponent()}
  </head>
}

export const Main: React.FC = () => {
  const ctx = useContext(DocumentContext)

  return <div id="app" dangerouslySetInnerHTML={{ __html: ctx.app }} />
}

const ESCAPED_CHARS = {
  '<'     : '\\u003C',
  '>'     : '\\u003E',
  '/'     : '\\u002F',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029'
}

function escape(str) {
  return str.replace(/[<>/\u2028\u2029]/g, unsafeChar => ESCAPED_CHARS[unsafeChar])
}

export const Scripts: React.FC = () => {
  const ctx = useContext(DocumentContext)

  return <React.Fragment>
    <script type="application/json" id="__WED_DATA__" dangerouslySetInnerHTML={{ __html: escape(ctx.wedData) }} />
    {ctx.scripts.map(file => <script key={file} type="text/javascript" src={`/_wed/${file}`} />)}
    {ctx.helmet.script.toComponent()}
  </React.Fragment>
}

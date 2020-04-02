import React  from 'react'
import { usePromise } from 'wedjs/ssr'
import { Helmet } from 'wedjs/helmet'
import { getDate } from '../lambda/date'
import logo from './wedjs-logo.svg'
import styles from './app.scss'

const App = () => {
  const { data = {} } = usePromise(() => getDate())

  return <div className={styles.app}>
    <Helmet>
      <title>Wed Application</title>
      <link rel="icon" href="/favicon.png" />
    </Helmet>
    <img className={styles.logo} src={logo} />
    <div className={styles.body}>
      <p>
        To get started, edit the <code>app/App.tsx</code> or <code>lambda/date.ts</code> files, <br/>
        then save to reload.
      </p>
      <div className={styles.date}>
        <h3><span>λ</span> Server Date</h3>
        <div className={styles.data}>{data.time}</div>
        <div className={styles.ip}>Client IP: {data.ip}</div>
      </div>
    </div>
  </div>
}

export default App

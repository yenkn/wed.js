# Wed.js
The ultimate isomorphic web framework

[简体中文](README-zh_Hans.md)


> 🛠 Currently under active development, contributions are welcome
>



> ⚠️ Caution: This framework uses Node.js experimental [async_hooks](https://nodejs.org/api/async_hooks.html)，There is a large performance loss at present, see: [Node.js Benchmark Results](https://mscdex.github.io/nodebench/)
>




## Philosophy

The goal of Wed.js is to unify the front-end and back-end development experience and return to the simplest functional programming.

### Functional Node.js

No tedious abstractions anymore, develop Node.js as Lambda functions

**lambda/date.ts**

```typescript
export async function getDate() {
  return new Date().toString()
}
```



### Isomorphism

Developed on one code bases, calls the Node.js Lambda function directly

**app/App.tsx**

```tsx
import { usePromise } from 'wedjs/ssr'
import { getDate } from '../lambda/date'

export default function App() {
  const { data: date, loading, error } = usePromise(() => getDate())
  
  if(loading) return <div>Loading</div>
  if(error) return <code>{error}</code>
  return <div>{date}</div>
}
```




### Server-side Rendering

asynchronous DOM rendering based on **Promise Hooks**, no `getInitialProps` needed.

**app/Stargazers.tsx**

```tsx
import { usePromise } from 'wedjs/ssr'

async function fetchStargazers(repo: string) {
  const res = await fetch('https://api.github.com/repos/' + repo)
  return await res.json()
}

export default function Stars() {
  // Loads data on both client-side and server-side
  const { data, loading, error } = usePromise(() => fetchStargazers('yenkn/wed.js'))
  
  if(loading) return <div>Loading</div>
  if(error) return <code>{error}</code>
  return <div>{data.stargazers_count} Stars</div>
}
```

## Development

```shell script
git clone https://github.com/yenkn/wed.js
cd wed.js
yarn
```


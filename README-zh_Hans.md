# Wed.js
终极同构Web框架



> 🛠 当前处于活跃开发中，欢迎贡献代码
>



> ⚠️ 注意：本框架使用了 Node.js 实验性的 [async_hooks](https://nodejs.org/api/async_hooks.html)，目前有较大性能损耗，详见：[Node.js Benchmark Results](https://mscdex.github.io/nodebench/)
>




## 核心哲学

Wed.js 的目标是统一前后端开发体验，回到 Javascript 最简洁的函数式开发。

### 函数式后端

抛弃繁琐抽象，以 Lambda 函数形式开发后端

**lambda/date.ts**

```typescript
export async function getDate() {
  return new Date().toString()
}
```



### 前后端同构

在一套代码库上开发，前端直接调用后端 Lambda 函数

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




### 服务端渲染

基于 **Promise Hooks** 的异步DOM渲染, 无需使用 `getInitialProps`.

**app/Stars.tsx**

```tsx
import { usePromise } from 'wedjs/ssr'

async function fetchStargazers(repo: string) {
  const res = await fetch('https://api.github.com/repos/' + repo)
  return await res.json()
}

export default function Stars() {
  // 自动适配 SSR 场景
  const { data, loading, error } = usePromise(() => fetchStargazers('yenkn/wed.js'))
  
  if(loading) return <div>Loading</div>
  if(error) return <code>{error}</code>
  return <div>{data.stargazers_count} Stars</div>
}
```

## 开发

```shell script
git clone https://github.com/yenkn/wed.js
cd wed.js
yarn
```


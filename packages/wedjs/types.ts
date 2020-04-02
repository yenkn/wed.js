export type PromiseReturnType<T> = T extends (...args: any[]) => Promise<infer P> ? P : any

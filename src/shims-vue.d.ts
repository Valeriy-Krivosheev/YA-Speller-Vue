declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // import 'vite/client'
  const component: DefineComponent<{}, {}, any>
  export default component
}

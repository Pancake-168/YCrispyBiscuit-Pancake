/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// CSS 模块类型声明
declare module '*.css' {
  const styles: { readonly [key: string]: string }
  export default styles
}

declare module '*.scss' {
  const styles: { readonly [key: string]: string }
  export default styles
}

declare module '*.sass' {
  const styles: { readonly [key: string]: string }
  export default styles
}

declare module '*.less' {
  const styles: { readonly [key: string]: string }
  export default styles
}

declare module '*.styl' {
  const styles: { readonly [key: string]: string }
  export default styles
}

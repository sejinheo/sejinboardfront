/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.jsx' {
  const component: any;
  export default component;
}

declare module '*.js' {
  const content: any;
  export default content;
}

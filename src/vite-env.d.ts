/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BITCART_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

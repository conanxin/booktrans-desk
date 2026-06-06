/// <reference types="vite/client" />

import type { BookTransApi } from "../main/preload.cjs";

declare global {
  interface Window {
    bookTrans: BookTransApi;
  }
}

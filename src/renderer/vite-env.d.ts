/// <reference types="vite/client" />

import type { BookTransApi } from "../main/preload";

declare global {
  interface Window {
    bookTrans: BookTransApi;
  }
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base はリポジトリ名に合わせて変更してください。
// 例：https://<ユーザー名>.github.io/ion-block-lab/ で公開する場合 → "/ion-block-lab/"
// ユーザーサイト（<ユーザー名>.github.io 直下）の場合 → "/"
export default defineConfig({
  plugins: [react()],
  base: "/ion-block-lab/",
});

import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig } from "vite";
import { CRX_CONTENT_SCRIPT_OUTDIR } from "./globalConfig";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // 输出目录
    outDir: CRX_CONTENT_SCRIPT_OUTDIR,
    lib: {
      entry: [path.resolve(__dirname, "src/content-script/index.js")],
      // background script不支持ES6，因此不用使用es模式，需要改为cjs模式
      formats: ["cjs"],
      // 设置生成文件的文件名
      fileName: () => {
        // 将文件后缀名强制定为js，否则会生成cjs的后缀名
        return "content-script.js";
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [vue()],
});

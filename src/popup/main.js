import { createApp } from "vue";
// 全局样式
import "@/common/styles/frame.styl";
import Popup from "@/popup/popup.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import router from "./router";

import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(Popup);
app.use(ElementPlus, {
  locale: zhCn,
});
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(router);
app.mount("#app");

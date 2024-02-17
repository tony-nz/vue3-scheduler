import { defineConfig } from "vite";
import eslintPlugin from "vite-plugin-eslint";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), eslintPlugin()],
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
});

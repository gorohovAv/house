import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Разрешаем подключения с любых IP
    port: 5173,
    strictPort: true, // Не пытаться использовать другой порт если 5173 занят
  },
});

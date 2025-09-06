import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "certs/Server.key")),
      cert: fs.readFileSync(path.resolve(__dirname, "certs/Server.cert")),
    },
    port: 5173,
  },
  plugins: [react()],
})

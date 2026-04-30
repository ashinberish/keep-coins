import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { execSync } from "child_process"
import path from "path"
import { defineConfig } from "vite"

function gitCommitCount() {
  try {
    return execSync("git rev-list --count HEAD").toString().trim()
  } catch {
    return "0"
  }
}

function gitShortHash() {
  try {
    const hash = execSync("git rev-parse --short HEAD").toString().trim()
    // Append "-dirty" if there are uncommitted changes
    try {
      execSync("git diff --quiet HEAD")
      return hash
    } catch {
      return `${hash}-dirty`
    }
  } catch {
    return "unknown"
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const commitCount = gitCommitCount()
  const shortHash = gitShortHash()
  const version = `0.1.${commitCount}`

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __APP_COMMIT__: JSON.stringify(shortHash),
      __APP_IS_DEV__: JSON.stringify(mode === "development"),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router"],
            charts: ["recharts"],
          },
        },
      },
    },
  }
})

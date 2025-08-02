import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  optimizeDeps: {
    exclude: ["lucide-react"],
    include: [
      "react",
      "react-dom",
      "@xstate/react",
      "xstate",
      "tone",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
    ],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom"],
          "xstate-vendor": ["@xstate/react", "xstate"],
          "tone-vendor": ["tone"],
          "radix-vendor": [
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
          ],
          // App chunks
          machines: ["./src/machines"],
          components: [
            "./src/components/SequencerGrid",
            "./src/components/TempoControl",
            "./src/components/PitchControl",
            "./src/components/Keyboard",
            "./src/components/EffectsTabs",
          ],
        },
      },
    },
  },
});

// packages/engine/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json"],
			include: ["src/**/*.{ts,tsx}"],
		},
		include: ["src/**/*.{test,spec}.ts"],
	},
});

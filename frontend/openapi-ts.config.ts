import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "openapi-schema.json",
  output: "src/lib/api-client",
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "./src/lib/hey-api.ts",
    },
  ],
});

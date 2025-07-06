import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "openapi-schema.json",
  output: "src/lib/api-client",
});

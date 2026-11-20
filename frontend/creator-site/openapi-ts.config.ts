import { defineConfig } from "@hey-api/openapi-ts"

// The public site only uses the public API. frontend/scripts/generate-client.sh
// writes the filtered spec (see frontend/scripts/openapi_public.py).
export default defineConfig({
  input: "../openapi.public.json",
  output: "./src/client",

  plugins: [
    "legacy/axios",
    {
      name: "@hey-api/sdk",
      asClass: true,
      operationId: true,
      classNameBuilder: "{{name}}Service",
      methodNameBuilder: (operation) => {
        // @ts-expect-error
        let name: string = operation.name
        // @ts-expect-error
        const service: string = operation.service

        if (service && name.toLowerCase().startsWith(service.toLowerCase())) {
          name = name.slice(service.length)
        }

        return name.charAt(0).toLowerCase() + name.slice(1)
      },
    },
    {
      name: "@hey-api/schemas",
      type: "json",
    },
  ],
})

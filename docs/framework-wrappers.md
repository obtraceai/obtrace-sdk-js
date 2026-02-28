# Framework Wrappers

## Frontend wrappers
- Vite: `initViteBrowserSDK`, `createViteConfigFromImportMetaEnv`
- React: `createReactObtrace`
- Next.js (browser): `initNextBrowserSDK`
- Vue: `createVueObtrace`
- Angular: `createAngularObtrace`
- Svelte: `createSvelteObtrace`

## Backend wrappers
- Express: `expressObtraceMiddleware`
- Fastify: `fastifyObtraceHook`
- Hono: `honoObtraceMiddleware`
- Elysia: `elysiaObtracePlugin`
- NestJS: `nestObtraceMiddleware`
- Next.js route handlers: `withNextRouteHandler`

## Examples
- React + Vite: `../examples/react-vite/main.tsx`
- Vue + Vite: `../examples/vue-vite/main.ts`
- Next app router handler: `../examples/next-app-router/route-handler.ts`
- Nest middleware: `../examples/nestjs/middleware.ts`
- Express middleware: `../examples/express/server.ts`
- Elysia plugin: `../examples/elysia/server.ts`

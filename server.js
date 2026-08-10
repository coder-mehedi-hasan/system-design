import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

const port = Number(process.env.PORT) || 8123;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`System Design viewer running at http://localhost:${info.port}`);
});

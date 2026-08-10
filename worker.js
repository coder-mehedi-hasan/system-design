import { Hono } from "hono";

const app = new Hono();

app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;

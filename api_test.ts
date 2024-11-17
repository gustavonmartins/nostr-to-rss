import { Hono } from "jsr:@hono/hono";
import * as mod from "@std/assert";

import app from "./main.ts";

Deno.test("GET / default route should contain entry page", async () => {
  const res = await app.request("");
  const text = await res.text();

  // Assert that the response text includes the specified string
  mod.assertStringIncludes(text, "Please, use the");
});

Deno.test("GET / unexisting route should contain entry page", async () => {
  const res = await app.request("/feeds");
  const text = await res.text();

  // Assert that the response text includes the specified string
  mod.assertStringIncludes(text, "Please, use the");
});

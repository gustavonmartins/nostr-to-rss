import * as mod from "@std/assert";

import app from "./main.ts";

Deno.test("GET / default route should contain entry page", async () => {
  const res = await app.request("");
  const text = await res.text();
  mod.assertEquals(res.status, 200);

  // Assert that the response text includes the specified string
  mod.assertStringIncludes(text, "Please, use the");
});

Deno.test("GET / unexisting route should contain entry page", async () => {
  const res = await app.request("/feeds");
  const text = await res.text();

  // Assert that the response text includes the specified string
  mod.assertEquals(res.status, 404);
  mod.assertStringIncludes(text, "Please, use the");
});

Deno.test("GET / No replies filter must work", async () => {
  const [replies_false, replies_true] = await Promise.all([
    app.request("/feed?users=namosca@gleasonator.dev&replies=false"),
    app.request("/feed?users=namosca@gleasonator.dev&replies=true"),
  ]);

  mod.assertEquals(replies_false.status, 200);
  mod.assertEquals(replies_true.status, 200);

  mod.assertEquals(
    replies_false.headers.get("Content-Type"),
    "application/atom+xml",
  );
  mod.assertEquals(
    replies_true.headers.get("Content-Type"),
    "application/atom+xml",
  );

  const replies_true_length: number = (await replies_true.text()).length;
  const replies_false_length: number = (await replies_false.text()).length;
  const approval_ratio = replies_false_length / replies_true_length;
  const max_ratio_allowed = 0.2;
  console.log(
    `filtered: ${replies_false_length}, unfiltered: ${replies_true_length}. ratio: ${approval_ratio}`,
  );

  mod.assertLess(
    approval_ratio,
    max_ratio_allowed,
    "Blocking replies should return less items than not blocking it",
  );
});

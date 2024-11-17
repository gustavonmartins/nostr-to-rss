import * as mod from "@std/assert";

import app from "./main.ts";

Deno.test("Get feeds from a users default list", async () => {
  const res = await app.request(
    "/api/v1/rss/user/namosca@gleasonator.dev/defaultlist",
  );

  mod.assertEquals(res.status, 200);
  mod.assertEquals(
    res.headers.get("Content-Type"),
    "application/atom+xml",
  );

  const text = await res.text();
  mod.assertStringIncludes(text, "DUMMY ITEM TITLE 1");
  mod.assertStringIncludes(text, "DUMMY ITEM TITLE 2");
  console.log(text);
});

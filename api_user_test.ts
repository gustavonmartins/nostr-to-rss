import * as mod from "@std/assert";

import app from "./main.ts";

Deno.test("Get feeds from a users default list", async () => {
  const res = await app.request(
    "/api/v1/rss/user/npub1auwq2edy2tahk58uepwyvjjmdvkxdvmrv492xts8m2s030gla0msruxp7s/defaultlist?replies=false&blacklist=bitcoin,btc",
  );

  mod.assertEquals(res.status, 200);
  mod.assertEquals(
    res.headers.get("Content-Type"),
    "application/atom+xml",
  );

  const text = await res.text();
  //mod.assertStringIncludes(text, "DUMMY ITEM CONTENT 1");
  //mod.assertEquals(text.includes("bitcoin"), false, "Blacklist didnt work");
  //mod.assertStringIncludes(text, "DUMMY ITEM CONTENT 2");

  //mod.assertStringIncludes(text, "DUMMY ITEM TITLE 1");
  //mod.assertStringIncludes(text, "DUMMY ARTICLE TITLE 2");
  //console.log(text);
});

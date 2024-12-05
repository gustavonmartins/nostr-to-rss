import * as mod from "@std/assert";

import app from "../main.ts";

Deno.test("Gets OPML from a user default followlist", async () => {
  const filter = "?replies=false&blacklist=bitcoin,btc&whitelist=deno,js,mostr";
  const res = await app.request(
    `/api/v1/opml/user/namosca@gleasonator.dev/defaultlist${filter}`,
  );

  mod.assertEquals(res.status, 200);
  mod.assertEquals(
    res.headers.get("Content-Type"),
    "application/xml",
  );
  mod.assertEquals(
    res.headers.get("Content-Disposition"),
    'attachment; filename="feeds.opml"',
  );

  const text = await res.text();

  mod.assertStringIncludes(text, `<?xml version="1.0" encoding="UTF-8"`);
  mod.assertStringIncludes(text, `<opml version="2.0">`);
  mod.assertStringIncludes(text, `<head>`);
  mod.assertStringIncludes(text, `<title>`);
  mod.assertStringIncludes(text, `</title>`);
  mod.assertStringIncludes(text, `<body>`);
  mod.assertStringIncludes(text, `outline description=`);
  mod.assertStringIncludes(text, `type="rss"`);
  mod.assertStringIncludes(text, `version="ATOM"`);
  mod.assertStringIncludes(text, `xmlUrl="https:`);
  mod.assertStringIncludes(
    text,
    `?users=npub1q3sle0kvfsehgsuexttt3ugjd8xdklxfwwkh559wxckmzddywnws6cd26p${
      filter.replaceAll(`&`, `&amp;`).replace(`?`, `&amp;`)
    }`,
  );
  mod.assertStringIncludes(
    text,
    `?users=npub1acg6thl5psv62405rljzkj8spesceyfz2c32udakc2ak0dmvfeyse9p35c`,
  );
  mod.assertStringIncludes(text, `</outline>`);
  mod.assertStringIncludes(text, `</body>`);
  mod.assertStringIncludes(text, `</opml>`);
});

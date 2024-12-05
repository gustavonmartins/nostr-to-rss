/*
Standard License Header
Copyright (C) [2024] [Gustavo Nunes Martins]

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

*/

import NDK from "@nostr-dev-kit/ndk";

import { Hono } from "jsr:@hono/hono";
import { handleRequest } from "./feedcontroller.ts";

import { getFeedFromDefaultList } from "./feedFromUserList/controller.ts";
import { AtomRepository } from "./atomrepository.ts";
import { NostrRepository } from "./nostrrepo.ts";
import { getOPMLFromDefaultList } from "./OPMLFromDefaultList/controller.ts";
import { OPMLRepository } from "./OPMLFromDefaultList/repository.ts";

const relays = [
  "wss://nostr.mom",
  "wss://nos.lol",
  "wss://nostr.wine",
  "wss://relay.mostr.pub",
];

// Create a new NDK instance with explicit relays
const ndk = new NDK({
  explicitRelayUrls: relays,
});
// Now connect to specified relays
await ndk.connect();
console.log("NOSTR NDK CONNECTED");

const app = new Hono({ strict: false });

const nostrRepo = new NostrRepository(ndk);
const atomRepository = new AtomRepository(nostrRepo);
const opmlRepository = new OPMLRepository(nostrRepo);

app.get("/feed", async (c) => await handleRequest(ndk, c));
app.get("/", (c) => {
  return c.text(
    "Please, use the /feed route. \nExample: https://nostr-to-rss.deno.dev/feed?users=npub1auwq2edy2tahk58uepwyvjjmdvkxdvmrv492xts8m2s030gla0msruxp7s,npub1wqxxe0cjaxnvmrv4lkvx8d5dlft7ewswyn09w5v7fg7642fgzm7srucxws&kinds=1,30023&replies=true&whitelist=art,food,cooking,painting\n users is the list of npubs to follow, \nkinds are the nostr kinds to subscribe (usually 1 and 30023), and \nreplies (true or false) is to indicate if replies are to be shown or not\n\n made by https://njump.me/nprofile1qydhwumn8ghj7emvv4shxmmwv96x7u3wv3jhvtmjv4kxz7gqyrh3cpt953f0k76slny9c3j2td4jce4nvdj54gewqld2p79arl4lwfwgcp6\nhttps://github.com/gustavonmartins/nostr-to-rss",
    {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    },
  );
});
app.notFound((c) => {
  return c.text(
    "Please, use the /feed route. \nExample: https://nostr-to-rss.deno.dev/feed?users=npub1auwq2edy2tahk58uepwyvjjmdvkxdvmrv492xts8m2s030gla0msruxp7s,npub1wqxxe0cjaxnvmrv4lkvx8d5dlft7ewswyn09w5v7fg7642fgzm7srucxws&kinds=1,30023&replies=true&whitelist=art,food,cooking,painting\n users is the list of npubs to follow, \nkinds are the nostr kinds to subscribe (usually 1 and 30023), and \nreplies (true or false) is to indicate if replies are to be shown or not\n\n made by https://njump.me/nprofile1qydhwumn8ghj7emvv4shxmmwv96x7u3wv3jhvtmjv4kxz7gqyrh3cpt953f0k76slny9c3j2td4jce4nvdj54gewqld2p79arl4lwfwgcp6\nhttps://github.com/gustavonmartins/nostr-to-rss",
    {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    },
  );
});

app.get(
  "/api/v1/rss/user/:userid/defaultlist",
  async (c) => await getFeedFromDefaultList(atomRepository, c),
);

app.get(
  "/api/v1/opml/user/:userid/defaultlist",
  async (c) => await getOPMLFromDefaultList(opmlRepository, c),
);

Deno.serve(app.fetch);
export default app;

console.log("Server running on http://localhost:8000");

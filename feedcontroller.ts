import NDK from "@nostr-dev-kit/ndk";

import { NDKFilter } from "@nostr-dev-kit/ndk";
import { Context } from "hono";
import { AtomRepository } from "./atomrepository.ts";
import { NostrRepository } from "./nostrrepo.ts";

export async function handleRequest(ndk: NDK, c: Context) {
  const params = c.req;

  // Extract query parameters
  const userPubkeys: string[] = params.query("users")?.split(",") || [];
  const kinds = params.query("kinds")?.split(",").map(Number) || [1, 30023];
  const whitelist = params.query("whitelist")?.split(",") || [];
  const blacklist = params.query("blacklist")?.split(",") || [];
  const replies = !(params.query("replies") === "false");
  //console.log(params);
  //console.log(params.get("pathname"))
  //console.log(kinds);
  //console.log(userPubkeys);
  console.log(`Query params are ${params.url}`);

  const nip05_separator = ".";

  const userPubkeys_05 = userPubkeys.filter((item) =>
    item.includes(nip05_separator)
  );
  //console.log(userPubkeys_05);

  const userPromises = userPubkeys_05.map((nip05) =>
    ndk.getUserFromNip05(nip05)
  );

  const finalUser05List = await Promise.all(userPromises);

  const finalUserNon05List = userPubkeys.filter((item) =>
    item.startsWith("npub")
  );

  //Create user list as hext
  const userListHex = [
    ...finalUser05List.map((item) => item),
    ...finalUserNon05List.map((npub) => ndk.getUser({ npub: npub })),
  ];

  const userListPubKey = userListHex.map((item) => item.pubkey);

  //Gets info like name
  await userListHex.map((item) => item.fetchProfile());

  // Create a filter
  const filter: NDKFilter = {
    kinds: kinds,
    authors: userListPubKey,
  };
  // Will return all found events

  // Fetch events from Nostr relays
  const events = await NostrRepository.fetchNostrEvents(
    ndk,
    filter,
    whitelist,
    replies,
    blacklist,
  );

  // Convert events to Atom feed
  const feed = AtomRepository.createAtomFeed(Array.from(events), userListHex);

  return c.body(feed.atom1(), {
    headers: { "Content-Type": "application/atom+xml" },
  });
}

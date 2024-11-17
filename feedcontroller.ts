import NDK from "@nostr-dev-kit/ndk";
import * as nostr from "npm:nostr-tools";
import { Feed } from "npm:feed";
import { text_filter } from "./filters.ts";
import { NDKEvent, NDKFilter, NDKUser } from "@nostr-dev-kit/ndk";
import { Context } from "@hono/hono";

export async function handleRequest(ndk: NDK, c:Context) {
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
  const events = await fetchNostrEvents(
    ndk,
    filter,
    whitelist,
    replies,
    blacklist,
  );

  // Convert events to Atom feed
  const feed = createAtomFeed(events, userListHex);

  return c.body(feed.atom1(), {
    headers: { "Content-Type": "application/atom+xml" },
  });
}

async function fetchNostrEvents(
  ndk: NDK,
  filter,
  whitelist: string[],
  replies: boolean,
  blacklist: string[],
) {
  const events = await ndk.fetchEvents(filter);

  const filteredevents = Array.from(events).filter((item) => {
    return passes_reply(item.tags.flat(), replies) &&
      text_filter(item.content, whitelist, blacklist);
  }).sort((a, b) => b.created_at - a.created_at);

  const approval_ratio: number = filteredevents.length / events.size;
  console.log(`Current filter approved ${approval_ratio * 100} pct of events`);

  return new Set(filteredevents);
}

function createAtomFeed(events: Set<NDKEvent>, ndkUsers: NDKUser[]): Feed {
  const feed = new Feed({
    title: `Nostr RSS feed: ${
      (ndkUsers.map((user) => user.profile?.name)).join(", ")
    }`,
    description: "Creates RSS feed from nostr",
    id: "github.com/gustavonmartins/nostr-to-rss",
    link: "github.com/gustavonmartins/nostr-to-rss",
    updated: new Date(),
    ttl: 60,
    copyright:
      "https://njump.me/npub1auwq2edy2tahk58uepwyvjjmdvkxdvmrv492xts8m2s030gla0msruxp7s",
  });

  function resumeString(inputString: string): string {
    return inputString.substring(0, 75) + " (...)";
  }

  console.log(`Atom feed will have ${events.size} events`);
  for (const event of events) {
    if (event.kind === 30023) {
      //const result2 = event.tags.find(subList => subList[0] === "summary");

      feed.addItem({
        title: getTagValue(event.tags.flat(), "title"),
        date: new Date(event.created_at * 1000),
        published: new Date(event.created_at * 1000),
        id: event.id,
        link: `https://njump.me/${event.id}`,
        content: event.content,
        author: [{ name: nostr.nip19.npubEncode(event.pubkey) }],
      });
    } else {
      //const result2 = event.tags.find(subList => subList[0] === "summary");

      feed.addItem({
        title: resumeString(event.content),
        date: new Date(event.created_at * 1000),
        published: new Date(event.created_at * 1000),
        id: event.id,
        link: `https://njump.me/${event.id}`,
        content: event.content,
        author: [{ name: nostr.nip19.npubEncode(event.pubkey) }],
      });
    }
  }

  return feed;
}
function passes_reply(tags: string[], reply_allowed: boolean): boolean {
  if (reply_allowed) return true;
  else if (getTagValue(tags, "e") === "" && getTagValue(tags, "q") === "") {
    {
      return true;
    }
  } else return false;
}

function getTagValue(tags: string[], key: string): string {
  const result = tags.find((subList) => subList[0] === key);
  if (result != undefined) {
    if (result.length > 1) {
      return result[1];
    }
  }
  return "";
}

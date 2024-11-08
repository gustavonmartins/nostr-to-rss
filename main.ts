/*
Standard License Header
Copyright (C) [2024] [Gustavo Nunes Martins]

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

*/
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import * as nostr from "npm:nostr-tools";
import { Feed } from "npm:feed";

function getTagValue(tags: string[], key: string): string {
  const result = tags.find((subList) => subList[0] === key);
  if (result != undefined) {
    if (result.length > 1) {
      return result[1];
    }
  }
  return "";
}

// Import the package
import NDK, { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";

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

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const params = url.searchParams;
  if (path !== "/feed") {
    return new Response(
      "Please, use the /feed route. \nExample: https://nostr-to-rss.deno.dev/feed?users=npub1auwq2edy2tahk58uepwyvjjmdvkxdvmrv492xts8m2s030gla0msruxp7s,npub1wqxxe0cjaxnvmrv4lkvx8d5dlft7ewswyn09w5v7fg7642fgzm7srucxws&kinds=1,30023&replies=true&whitelist=art,food,cooking,painting\n users is the list of npubs to follow, \nkinds are the nostr kinds to subscribe (usually 1 and 30023), and \nreplies (true or false) is to indicate if replies are to be shown or not\n\n made by https://njump.me/nprofile1qydhwumn8ghj7emvv4shxmmwv96x7u3wv3jhvtmjv4kxz7gqyrh3cpt953f0k76slny9c3j2td4jce4nvdj54gewqld2p79arl4lwfwgcp6\nhttps://github.com/gustavonmartins/nostr-to-rss",
      {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }

  // Extract query parameters
  const userPubkeys: string[] = params.get("users")?.split(",") || [];
  const kinds = params.get("kinds")?.split(",").map(Number) || [1, 30023];
  const whitelist = params.get("whitelist")?.split(",") || [];
  const replies = !(params.get("replies") === "false");
  //console.log(params);
  //console.log(params.get("pathname"))
  //console.log(kinds);
  //console.log(userPubkeys);
  console.log(`Query params are ${params}`);

  const userPubkeys_05 = userPubkeys.filter((item) => item.includes("@"));
  //console.log(userPubkeys_05);

  const userPromises = userPubkeys_05.map((nip05) =>
    ndk.getUserFromNip05(nip05)
  );

  const finalUser05List = await Promise.all(userPromises);

  const finalUserNon05List = userPubkeys.filter((item) => !item.includes("@"));

  // Create a filter
  const filter: NDKFilter = {
    kinds: kinds,
    authors: [
      ...finalUser05List.map((item) => item.pubkey),
      ...finalUserNon05List.map((npub) => ndk.getUser({ npub: npub }).pubkey),
    ],
  };
  // Will return all found events

  // Fetch events from Nostr relays
  const events = await fetchNostrEvents(filter, whitelist, replies);

  // Convert events to Atom feed
  const feed = createAtomFeed(events);

  return new Response(feed.atom1(), {
    headers: { "Content-Type": "application/atom+xml" },
  });
}

function passes_reply(tags: string[], reply_allowed: boolean): boolean {
  if (reply_allowed) return true;
  else if (getTagValue(tags, "e") === "") return true;
  else return false;
}

function passes_whitelist(text: string, whitelist: string[]): boolean {
  const delimiters = /[\s\t\n\r!,\.#?()]+/;
  if (whitelist.length === 0) return true;

  // Normalize the string to remove accents
  const normalizedWords = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().split(delimiters);

  const whitelist_processed = whitelist.map((word) =>
    word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );

  // Check for at least one common element
  return whitelist_processed.some(item => normalizedWords.includes(item))
}

async function fetchNostrEvents(filter, whitelist: string[], replies: boolean) {
  const events = await ndk.fetchEvents(filter);
  const filteredevents = Array.from(events).filter((item) => {
    return passes_reply(item.tags, replies) &&
      passes_whitelist(item.content, whitelist);
  }).sort((a, b) => b.created_at - a.created_at);

  return new Set(filteredevents);
}

function createAtomFeed(events: Set<NDKEvent>): Feed {
  const feed = new Feed({
    title: "Nostr RSS Feed",
    description: "Creates RSS feed from nostr",
    id: "github.com/gustavonmartins/nostr-to-rss",
    link: "github.com/gustavonmartins/nostr-to-rss",
    updated: new Date(),
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
        title: getTagValue(event.tags, "title"),
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

serve(handleRequest, { port: 8000 });
console.log("Server running on http://localhost:8000");

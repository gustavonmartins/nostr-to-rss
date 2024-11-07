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

function getTagValue(event: nostr.Event, key: string): string {
  const result = event.tags.find((subList) => subList[0] === key);
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
  console.log(kinds);
  console.log(userPubkeys);
  console.log(whitelist);

  // Create a filter
  const filter: NDKFilter = {
    kinds: kinds,
    authors: userPubkeys.map((npub) => ndk.getUser({ npub: npub }).pubkey),
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

function passes_whitelist(text: string, whitelist: string[]): boolean {
  if (whitelist.length === 0) return true;

  // Normalize the string to remove accents
  const normalizedWords = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().split(/\s+/).sort();

  const whitelist_processed = whitelist.map((word) =>
    word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  ).sort();

  // Check for at least one common element
  for (const textWord of normalizedWords) {
    for (const whitelistWord of whitelist_processed) {
      if (textWord.startsWith(whitelistWord)) {
        return true;
      }
    }
  }
  return false; // No common elements found
}

async function fetchNostrEvents(filter, whitelist: string[], replies: boolean) {
  const events = await ndk.fetchEvents(filter);
  const filteredevents = Array.from(events).filter((item) =>
    passes_whitelist(item.content, whitelist)
  );

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

  console.log("Atom feed will have this much events:" + events.size);
  for (const event of events) {
    if (event.kind === 30023) {
      //const result2 = event.tags.find(subList => subList[0] === "summary");

      feed.addItem({
        title: getTagValue(event, "title"),
        date: new Date(event.created_at * 1000),
        published: new Date(event.created_at * 1000),
        id: event.id,
        link: `https://njump.me/${event.id}`,
        content: event.content,
        author: [{ name: nostr.nip19.npubEncode(event.pubkey) }],
      });
    } else if (event.kind === 1) {
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

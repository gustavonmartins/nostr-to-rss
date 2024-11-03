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

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const params = url.searchParams;
  if (path !== "/feed") {
    return new Response(
      "Please, use the /feed route. Options are /feed?users=npub1,npub2,&kinds=kind1,kind2&replies=true\n users is the list of npubs to follow, kinds are the nostr kinds to subscribe (usually 1 and 30023), and replies (true or false) is to indicate if replies are to be shown or not",
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

  // Create Nostr filter
  const filter: nostr.Filter = {
    authors: userPubkeys.map((upkey) => nostr.nip19.decode(upkey).data),
    kinds: kinds,
  };

  // Fetch events from Nostr relays
  const events = await fetchNostrEvents(filter, whitelist, replies);

  // Convert events to Atom feed
  const feed = createAtomFeed(events);

  return new Response(feed.atom1(), {
    headers: { "Content-Type": "application/atom+xml" },
  });
}

async function fetchNostrEvents(
  filter: nostr.Filter,
  whitelist: string[],
  replies: boolean,
): Promise<nostr.Event[]> {
  const pool = new nostr.SimplePool();
  const relays = [
    "wss://nostr.mom",
    "wss://nos.lol",
    "wss://nostr.wine",
    "wss://relay.mostr.pub",
  ];
  let events = [];
  const sub = pool.subscribeMany(relays, [filter], {
    onevent(event) {
      //Only accepts posts started by the user

      {
        const regex = new RegExp(whitelist.join("|"), "i"); // 'i' for case-insensitive

        let containsAny = false;
        if (event.kind === 1) {
          containsAny = regex.test(event.content);
        } else if (event.kind === 30023) {
          containsAny = regex.test(event.content) ||
            regex.test(getTagValue(event, "title"));
        }

        if (containsAny === true) {
          if (replies === false && getTagValue(event, "e") === "") {
            events.push(event);
            console.log(event);
          } else if (replies === true) {
            events.push(event);
            console.log(event);
          }
        }
      }
    },
    oneose() {
      console.log("END OF STREAM");
      sub.close();
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 15000));
  return events;
}

function createAtomFeed(events: nostr.Event[]): Feed {
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

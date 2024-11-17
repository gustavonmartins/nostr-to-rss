import { Context } from "@hono/hono";
import { AtomRepository } from "../atomrepository.ts";
import { Feed } from "feed";

export async function getFeedFromDefaultList(
  atomRepo: AtomRepository,
  c: Context,
): Promise<Response> {
  ///const atomFeed = await atomRepo.getFeed({ "replies": false });
  /// return c.body(atomFeed, {
  ///  headers: { "Content-Type": "application/atom+xml" },
  /// });
  console.log("Running well here");
  const atomFeed = new Feed({
    title: "DUMMY FEED TITLE",
    description: "DUMMY FEED DESCRIPTION",
    id: "github.com/gustavonmartins/nostr-to-rss",
    link: "github.com/gustavonmartins/nostr-to-rss",
    updated: new Date(),
    ttl: 60,
    copyright:
      "https://njump.me/npub1auwq2edy2tahk58uepwyvjjmdvkxdvmrv492xts8m2s030gla0msruxp7s",
  });

  atomFeed.addItem({
    title: "DUMMY ITEM TITLE 1",
    date: new Date(),
    published: new Date(),
    id: "1234",
    link: `https://njump.me/}`,
    content: "Content of the feeds item",
    author: [{ name: "gustavonmartins" }],
  });

  atomFeed.addItem({
    title: "DUMMY ITEM TITLE 2",
    date: new Date(),
    published: new Date(),
    id: "1234",
    link: `https://njump.me/}`,
    content: "Content of the feeds item",
    author: [{ name: "gustavonmartins" }],
  });

  const p: Promise<Response> = new Promise((resolve, reject) => {
    resolve(
      c.body(atomFeed.atom1(), {
        headers: { "Content-Type": "application/atom+xml" },
      }),
    );
  });

  return p;
}

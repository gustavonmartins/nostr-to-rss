import { NDKEvent } from "@nostr-dev-kit/ndk";
import { NostrRepository } from "./nostrrepo.ts";
import { Feed } from "feed";

class AtomRepository {
  private nostrRepo: NostrRepository;
  private pendingEvents: Set<NDKEvent>;

  constructor(nostrRepo: NostrRepository) {
    this.nostrRepo = nostrRepo;
  }

  getFeedPromise(): Promise<Feed> {
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

    const p: Promise<Feed> = new Promise((resolve, reject) => {
      resolve(atomFeed);
    });

    return p;
  }
}

export { AtomRepository };

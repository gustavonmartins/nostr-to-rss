import { NDKArticle, NDKEvent, NDKUser } from "@nostr-dev-kit/ndk";
import { NostrRepository } from "./nostrrepo.ts";
import { Feed } from "feed";
import * as nostr from "npm:nostr-tools";

class AtomRepository {
  private nostrRepo: NostrRepository;
  private pendingEvents: Set<NDKEvent>;

  constructor(nostrRepo: NostrRepository) {
    this.nostrRepo = nostrRepo;
  }

  getFeedPromise(): Promise<Feed> {
    const p: Promise<Feed> = new Promise((resolve, reject) => {
      //Tells to nostr repo to start fetchin events, and tell when it stopped.
      //All fetched events will be slowly added to a place specified here
      const nostrEvents: Set<NDKEvent> = new Set<NDKEvent>();
      const nostrEventsOpenEded = this.nostrRepo.getOpenEndedEvents(
        nostrEvents,
      );
      //When all events are avaiable, then create a feed (no need to optimiye further, because from here on its pretty quick)
      nostrEventsOpenEded.then(() => {
        const atomFeed = AtomRepository.createAtomFeed(nostrEvents, []);
        resolve(atomFeed);
      });
    });

    return p;
  }

  static createAtomFeed(events: Set<NDKEvent>, ndkUsers: NDKUser[]): Feed {
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
          title: NDKArticle.from(event).title,
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
}

export { AtomRepository };

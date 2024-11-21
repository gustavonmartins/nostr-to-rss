import { NDKArticle, NDKEvent, NDKUser } from "@nostr-dev-kit/ndk";
import { NostrRepository } from "./nostrrepo.ts";
import { Feed } from "feed";
import * as nostr from "npm:nostr-tools";
import { passes_reply, text_filter } from "./filters.ts";

class AtomRepository {
  private nostrRepo: NostrRepository;
  private pendingEvents: Set<NDKEvent>;

  constructor(nostrRepo: NostrRepository) {
    this.nostrRepo = nostrRepo;
  }

  getFeedPromise(filter): Promise<Feed> {
    const p: Promise<Feed> = new Promise((resolve, reject) => {
      //Tells to nostr repo to start fetchin events, and tell when it stopped.
      //All fetched events will be slowly added to a place specified here
      const nostrEvents: Set<NDKEvent> = new Set<NDKEvent>();
      console.log(`ATOM repo: filter is: ${filter.userids}`);
      const nostrEventsOpenEded = this.nostrRepo.getOpenEndedEvents(
        filter,
        nostrEvents,
      );
      //When all events are avaiable, then create a feed (no need to optimiye further, because from here on its pretty quick)
      nostrEventsOpenEded.then(() => {
        const eventListFiltered = Array.from(nostrEvents).filter((event) =>
          passes_reply(event.tags, filter.replies) &&
          text_filter(event.content, filter.whitelist, filter.blacklist)
        );
        const pass_ratio: number = eventListFiltered.length / nostrEvents.size;
        console.log(
          `Userlist: ${pass_ratio * 100} pct of events passed filters`,
        );
        const atomFeed = AtomRepository.createAtomFeed(eventListFiltered, []);
        resolve(atomFeed);
      });
    });

    return p;
  }

  static createAtomFeed(events: NDKEvent[], ndkUsers: NDKUser[]): Feed {
    const feed = new Feed({
      title: `Nostr RSS feed: ${
        (ndkUsers.map((user) => user.profile?.name)).join(", ")
      }`,
      description: "Creates RSS feed from nostr",
      id: "github.com/gustavonmartins/nostr-to-rss",
      link: "github.com/gustavonmartins/nostr-to-rss",
      updated: new Date(),
      ttl: 1440,
      copyright:
        "https://njump.me/npub1auwq2edy2tahk58uepwyvjjmdvkxdvmrv492xts8m2s030gla0msruxp7s",
    });

    function resumeString(inputString: string): string {
      return inputString.substring(0, 75) + " (...)";
    }
    function resumenpub(npub: string): string {
      const firstPart = npub.slice(4, 8);
      const lastPart = npub.slice(-4);

      return `${firstPart}...${lastPart}`;
    }

    console.log(`Atom feed will have ${events.length} events`);
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
          author: [{ name: resumenpub(nostr.nip19.npubEncode(event.pubkey)) }],
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
          author: [{ name: resumenpub(nostr.nip19.npubEncode(event.pubkey)) }],
        });
      }
    }

    return feed;
  }
}

export { AtomRepository };

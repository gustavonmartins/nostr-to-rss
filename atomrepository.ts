import { NDKArticle, NDKEvent, NDKUser } from "@nostr-dev-kit/ndk";
import { NostrRepository } from "./nostrrepo.ts";
import { Feed } from "feed";
import * as nostr from "npm:nostr-tools";
import { passes_reply, text_filter } from "./filters.ts";
import { mediafilter } from "./utils.ts";
import * as xml2js from "npm:xml2js";

class AtomRepository {
  private nostrRepo: NostrRepository;
  private pendingEvents: Set<NDKEvent>;

  constructor(nostrRepo: NostrRepository) {
    this.nostrRepo = nostrRepo;
  }

  getFeedPromise(filter): Promise<string> {
    const p: Promise<string> = new Promise((resolve, reject) => {
      //Tells to nostr repo to start fetchin events, and tell when it stopped.
      //All fetched events will be slowly added to a place specified here
      const nostrEvents: Set<NDKEvent> = new Set<NDKEvent>();
      console.log(`ATOM repo: filter is: ${filter.userids}`);
      const nostrEventsOpenEded = this.nostrRepo.getOpenEndedEvents(
        filter,
        nostrEvents,
      );
      //When all events are avaiable, then create a feed (no need to optimiye further, because from here on its pretty quick)
      nostrEventsOpenEded.then(async () => {
        const eventListFiltered = Array.from(nostrEvents).filter((event) =>
          passes_reply(event.tags, filter.replies) &&
          text_filter(event.content, filter.whitelist, filter.blacklist)
        );
        const pass_ratio: number = eventListFiltered.length / nostrEvents.size;
        console.log(
          `Userlist: ${pass_ratio * 100} pct of events passed filters`,
        );
        const atomXml = await AtomRepository.createAtomFeed(eventListFiltered, []);
        resolve(atomXml);
      });
    });

    return p;
  }

  static async createAtomFeed(events: NDKEvent[], ndkUsers: NDKUser[]): Promise<string> {
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
      return `${firstPart}:${lastPart}`;
    }

    // Helper to extract title from tags
    function getTitleFromTags(tags: string[][]): string | undefined {
      const titleTag = tags.find(tag => tag[0] === "title");
      return titleTag ? titleTag[1] : undefined;
    }

    for (const event of events) {
      // Use mediafilter to extract media links
      const media = mediafilter(event.content);
      let contentWithMedia = `<p>${event.content}</p>`;
      if (media.length > 0) {
        const mediaHtml = media.map((m) => {
          if (m.mimeType.startsWith("image/")) {
            return `<br><img src="${m.uri}" alt="media" style="max-width:100%"/>`;
          } else if (m.mimeType.startsWith("video/")) {
            return `<br><video controls style="max-width:100%"><source src="${m.uri}" type="${m.mimeType}"></video>`;
          } else {
            return `<br><a href="${m.uri}">${m.uri}</a>`;
          }
        }).join("");
        contentWithMedia += mediaHtml;
      }
      const itemBase = {
        date: new Date(event.created_at * 1000),
        published: new Date(event.created_at * 1000),
        id: event.id,
        link: `https://njump.me/${event.id}`,
        content: contentWithMedia,
        author: [{ name: resumenpub(event.pubkey) }],
        content_type: "html",
      };
      if (event.kind === 30023) {
        feed.addItem({
          ...itemBase,
          title: getTitleFromTags(event.tags) || resumeString(event.content),
        });
      } else {
        feed.addItem({
          ...itemBase,
          title: resumeString(event.content),
        });
      }
    }
    // Inject enclosures and return the final XML string
    return await AtomRepository.injectAtomEnclosures(feed.atom1(), events);
  }

  // Helper: inject <link rel="enclosure" ... /> tags into Atom XML
  private static async injectAtomEnclosures(atomXml: string, events: any[]): Promise<string> {
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
    const xmlObj = await parser.parseStringPromise(atomXml);
    if (xmlObj.feed && xmlObj.feed.entry) {
      for (let i = 0; i < xmlObj.feed.entry.length; i++) {
        const entry = xmlObj.feed.entry[i];
        const eventId = entry.id && entry.id[0];
        const event = events.find((e) => e.id === eventId);
        if (event) {
          const media = mediafilter(event.content);
          if (media.length > 0) {
            if (!entry.link) entry.link = [];
            for (const m of media) {
              entry.link.push({
                $: {
                  rel: "enclosure",
                  type: m.mimeType,
                  href: m.uri,
                },
              });
            }
          }
        }
      }
    }
    return builder.buildObject(xmlObj);
  }
}

export { AtomRepository };

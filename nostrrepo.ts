import NDK, { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";
import { passes_reply, text_filter } from "./filters.ts";
import { getTagsMultiple } from "./utils.ts";

class NostrRepository {
  private ndk: NDK;

  constructor(ndk: NDK) {
    this.ndk = ndk;
  }

  async getOpenEndedEvents(
    filter,
    whereToStoreEvents: Set<NDKEvent>,
  ): Promise<boolean> {
    // Create a filter
    console.log(`nostr repo: filter is: ${filter.listownerid}`);

    let subscribedToUsers: string[] = [];

    if (filter.listownerid !== undefined) {
      //Gets pubkey if userid is a nip05
      const nip05_separator = ".";
      let userpubkey: string;
      if (filter.listownerid.includes(nip05_separator)) {
        userpubkey =
          (await this.ndk.getUserFromNip05(filter.listownerid)).pubkey;
      } else if (filter.listownerid.startsWith("npub")) {
        userpubkey = this.ndk.getUser({ npub: filter.listownerid }).pubkey;
      }
      const userListEvent: NDKEvent = await this.ndk.fetchEvent({
        kinds: [3, 30023],
        authors: [userpubkey],
      });
      subscribedToUsers = getTagsMultiple(userListEvent.tags, "p").flat();
      console.log(
        `NOST REPO: LIst subscribe to ${subscribedToUsers.length} users`,
      );
    }

    const ndkfilter: NDKFilter = {
      kinds: [1, 30023],
      authors: subscribedToUsers,
    };

    const p: Promise<boolean> = new Promise((resolve, reject) => {
      //console.log(`nostr repo: subscribing to ${subscribedToUsers}`);
      const sub = this.ndk.subscribe(ndkfilter, { closeOnEose: true });
      console.log("nostr repo: subscribed");
      sub.on("event", (event: NDKEvent) => {
        whereToStoreEvents.add(event);
        //console.log("nostr repo: got an event");
      });

      sub.on("eose", () => {
        console.log("End of stream reached. Subscription will now close.");
        resolve(true);
      });
    });
    return p;
  }

  static async fetchNostrEvents(
    ndk: NDK,
    filter,
    whitelist: string[],
    replies: boolean,
    blacklist: string[],
  ) {
    const events = await ndk.fetchEvents(filter);

    const filteredevents = Array.from(events).filter((item) => {
      return passes_reply(item.tags, replies) &&
        text_filter(item.content, whitelist, blacklist);
    }).sort((a, b) => b.created_at - a.created_at);

    const approval_ratio: number = filteredevents.length / events.size;
    console.log(
      `Current filter approved ${approval_ratio * 100} pct of events`,
    );

    return new Set(filteredevents);
  }
}

export { NostrRepository };

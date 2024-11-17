import NDK, { NDKEvent } from "@nostr-dev-kit/ndk";
import { passes_reply, text_filter } from "./filters.ts";

class NostrRepository {
  private ndk: NDK;

  constructor(ndk: NDK) {
    this.ndk = ndk;
  }

  getOpenEndedEvents(whereToStoreEvents: Set<NDKEvent>): Promise<boolean> {
    const event1 = new NDKEvent(null, {
      created_at: 1731870206,
      content: "DUMMY ITEM CONTENT 1",
      tags: [["faketag"]],
      pubkey:
        "ef1c0565a452fb7b50fcc85c464a5b6b2c66b363654aa32e07daa0f8bd1febf7",
    });
    const event2 = new NDKEvent(null, {
      created_at: 1731870206,
      content: "DUMMY ITEM CONTENT 2",
      tags: [["faketag2"]],
      pubkey:
        "ef1c0565a452fb7b50fcc85c464a5b6b2c66b363654aa32e07daa0f8bd1febf7",
    });
    const p: Promise<boolean> = new Promise((resolve, reject) => {
      whereToStoreEvents.add(event1);
      whereToStoreEvents.add(event2);
      resolve(true);
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

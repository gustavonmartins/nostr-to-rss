import { NDKUser } from "@nostr-dev-kit/ndk";
import { NostrRepository } from "../nostrrepo.ts";
import * as xml2js from "xml2js";

class OPMLRepository {
  private nostrRepo: NostrRepository;

  constructor(nostrRepo: NostrRepository) {
    this.nostrRepo = nostrRepo;
  }

  async getOPML(
    filter: {
      listownerid: string;
      replies: boolean;
      blacklist: string[];
      whitelist: string[];
    },
    query_http: string,
  ) {
    const subscribeedsNpubs: string[] =
      await (this.nostrRepo.getSubscriptionsOf(filter.listownerid));
    const query_http_escaped = query_http;
    console.log(
      `***********************ESCAPED QUERY IS ${query_http_escaped}`,
    );
    const items = [];
    for (const user of subscribeedsNpubs) {
      console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>CURRENT USER IS ${user}`);
      const userHex = this.nostrRepo.ndk.getUser({ pubkey: user });
      const userName = (await userHex.fetchProfile())?.name || "unnamed";
      console.log(`>>>>>>>>>>>>>>>>>>> USER NAME: ${userName}`);
      items.push({
        $: {
          description: userName,
          encoding: "UTF-8",
          text: userName,
          type: "rss",
          version: "ATOM",
          xmlUrl:
            `https://nostr-to-rss.deno.dev/feed?users=${userHex.npub}&${query_http_escaped}`,
        },
      });
    }

    const jObj = {
      opml: {
        $: { version: "2.0" },
        head: { title: "NOSTR-TO-RSS Subscriptions feed" },
        body: {
          outline: {
            $: {
              description: "Your NOSTR subscription",
              text: "NOSTR subs",
            },
            outline: items,
          },
        },
      },
    };

    const builder = new xml2js.Builder();
    const xmlCOntent = builder.buildObject(jObj);

    return xmlCOntent;
  }
}
export { OPMLRepository };

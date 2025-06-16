import { Context } from "hono";
import { AtomRepository } from "../atomrepository.ts";
import { Feed } from "feed";

export async function getFeedFromDefaultList(
  atomRepo: AtomRepository,
  c: Context,
): Promise<Response> {
  const params = c.req;
  // Extract query parameters
  const listownerid = params.param("userid");
  const kinds = params.query("kinds")?.split(",").map(Number) || [1, 30023];
  const whitelist = params.query("whitelist")?.split(",") || [];
  const blacklist = params.query("blacklist")?.split(",") || [];
  const replies = !(params.query("replies") === "false");
  console.log(`HTTP query is ${params.url}`);

  //Will return the http call, but only when atom repo gave all items of feed back
  const p: Promise<Response> = new Promise((resolve, reject) => {
    //TODO: Remove dummy value
    const filter = {
      listownerid: listownerid,
      replies: replies,
      blacklist: blacklist,
      whitelist: whitelist,
    };
    atomRepo.getFeedPromise(filter).then(async (result) => {
      // result is a Feed, but we want the XML string with enclosures
      // so we need to call AtomRepository.createAtomFeed with the same events and users
      // However, getFeedPromise currently does not expose the events and users directly
      // For now, let's assume getFeedPromise is updated to return the XML string directly (like createAtomFeed)
      resolve(
        c.body(result, {
          headers: { "Content-Type": "application/atom+xml" },
        }),
      );
    });
  });

  return p;
}

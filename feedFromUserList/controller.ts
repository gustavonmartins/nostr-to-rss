import { Context } from "@hono/hono";
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
    const promiseFeed: Promise<Feed> = atomRepo.getFeedPromise(filter);
    promiseFeed.then((result) => {
      resolve(
        c.body(result.atom1(), {
          headers: { "Content-Type": "application/atom+xml" },
        }),
      );
    });
  });

  return p;
}

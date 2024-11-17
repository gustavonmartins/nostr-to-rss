import { Context } from "@hono/hono";
import { AtomRepository } from "../atomrepository.ts";
import { Feed } from "feed";

export async function getFeedFromDefaultList(
  atomRepo: AtomRepository,
  c: Context,
): Promise<Response> {
  console.log("Running well here");

  //Will return the http call, but only when atom repo gave all items of feed back
  const p: Promise<Response> = new Promise((resolve, reject) => {
    const promiseFeed: Promise<Feed> = atomRepo.getFeedPromise();
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

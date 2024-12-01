import { Context } from "hono";
import { OPMLRepository } from "./repository.ts";
export async function getOPMLFromDefaultList(
  opmlRepo: OPMLRepository,
  c: Context,
) {
  const params = c.req;

  const query_http = (new URL(params.url)).search.replace("?", "");
  console.log(`-------------I THINK THE QUERY IS ${query_http}`);
  // Extract query parameters
  const listownerid = params.param("userid");
  const kinds = params.query("kinds")?.split(",").map(Number) || [1, 30023];
  const whitelist = params.query("whitelist")?.split(",") || [];
  const blacklist = params.query("blacklist")?.split(",") || [];
  const replies = !(params.query("replies") === "false");

  const filter = {
    listownerid: listownerid,
    replies: replies,
    blacklist: blacklist,
    whitelist: whitelist,
  };

  const fileContent = await opmlRepo.getOPML(filter, query_http);

  return c.body(fileContent, 200, {
    "Content-Type": "application/xml",
    "Content-Disposition": 'attachment; filename="feeds.opml"',
  });
}

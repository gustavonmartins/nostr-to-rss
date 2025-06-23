import * as mod from "@std/assert";
import { getTagsMultiple, mediafilter } from "../utils.ts";

Deno.test("Test extractiung multiple values from tag", () => {
  mod.assertEquals(getTagsMultiple([["p", "npub1"], ["p", "npub2"]], "p"), [
    ["npub1"],
    ["npub2"],
  ], "Filtering multiple tags didn not work");
});

Deno.test("Parses media from a post", () => {
  mod.assertEquals(
    mediafilter(
      "heres a sample image\nhttps://dummy.server.com/a/b/c/d/edfadf.jpg got it? and \nhttp://dummy.server.com/a/b/c/fewfsdf.mp4",
    ),
    [{
      uri: "https://dummy.server.com/a/b/c/d/edfadf.jpg",
      mimeType: "image/jpg",
    }, {
      uri: "http://dummy.server.com/a/b/c/fewfsdf.mp4",
      mimeType: "video/mp4",
    }],
  );
});

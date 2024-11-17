import * as mod from "@std/assert";
import { getTagsMultiple } from "./utils.ts";

Deno.test("Test extractiung multiple values from tag", () => {
  mod.assertEquals(getTagsMultiple([["p", "npub1"], ["p", "npub2"]], "p"), [
    ["npub1"],
    ["npub2"],
  ], "Filtering multiple tags didn not work");
});

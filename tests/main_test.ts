import { assertEquals } from "@std/assert";
import { text_filter } from "../filters.ts";

Deno.test("Test text filters", () => {
  const whitelist = ["health", "pokemon"];
  const blacklist = ["bitcoin", "btc"];

  const pass_01 = "Healthy pokémons are very, very happy pokemons";
  const pass_02 = "He is very Healthy";
  const pass_03 = "He is very #Healthy";
  const pass_04 = "How are you?Healthy";
  const pass_05 = "Super-HealThy";

  const fails_01 = "This shall not pass";

  const fails_02 = "A pokemon ate some #Bitcoins";
  const fails_03 = "Spam me with ?bitcoins";
  const fails_04 = "Spam me with bitcoins";

  assertEquals(text_filter(pass_01, whitelist, blacklist), true);
  assertEquals(text_filter(pass_02, whitelist, blacklist), true);
  assertEquals(text_filter(pass_03, whitelist, blacklist), true);
  assertEquals(text_filter(pass_04, whitelist, blacklist), true);
  assertEquals(text_filter(pass_05, whitelist, blacklist), true);

  assertEquals(text_filter(fails_01, whitelist, blacklist), false);
  assertEquals(text_filter(fails_02, whitelist, blacklist), false);
  assertEquals(text_filter(fails_03, whitelist, blacklist), false);
  assertEquals(text_filter(fails_04, whitelist, blacklist), false);
});

// Missing test: replies filter

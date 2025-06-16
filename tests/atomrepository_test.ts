import { assertStringIncludes } from "jsr:@std/assert";
import { AtomRepository } from "../atomrepository.ts";
import { NDKEvent, NDKUser } from "@nostr-dev-kit/ndk";

const validHexPubkey = "f1e2d3c4b5a697887766554433221100ffeeddccbbaa99887766554433221100";

Deno.test("Atom feed includes media as HTML and enclosure", async () => {
  // Create a real NDKEvent instance
  const mockEvent = new NDKEvent();
  mockEvent.kind = 1;
  mockEvent.content = "Look at this https://example.com/pic.jpg and this https://example.com/clip.mp4";
  mockEvent.created_at = Math.floor(Date.now() / 1000);
  mockEvent.id = "testid123";
  mockEvent.pubkey = validHexPubkey;
  mockEvent.tags = [];

  // Create a real NDKUser instance
  const mockUser = new NDKUser({ pubkey: validHexPubkey });
  mockUser.profile = { name: "Test User" };
  const xmlWithEnclosures = await AtomRepository.createAtomFeed([mockEvent], [mockUser]);
  // Check for escaped <img> and <video> tags in content
  assertStringIncludes(xmlWithEnclosures, '&lt;img src="https://example.com/pic.jpg"');
  assertStringIncludes(xmlWithEnclosures, '&lt;video controls');
  assertStringIncludes(xmlWithEnclosures, '&lt;source src="https://example.com/clip.mp4"');
  // Check for enclosure links
  assertStringIncludes(xmlWithEnclosures, '<link rel="enclosure" type="image/jpg" href="https://example.com/pic.jpg"');
  assertStringIncludes(xmlWithEnclosures, '<link rel="enclosure" type="video/mp4" href="https://example.com/clip.mp4"');
  // Check that original text is present
  assertStringIncludes(xmlWithEnclosures, 'Look at this');
}); 
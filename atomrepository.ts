import  { NDKEvent } from "@nostr-dev-kit/ndk";
import { NostrRepository } from "./nostrrepo.ts";

class AtomRepository {
  private nostrRepo: NostrRepository;
  private pendingEvents: Set<NDKEvent>;

  constructor(nostrRepo: NostrRepository) {
    this.nostrRepo = nostrRepo;
  }
}

export { AtomRepository };

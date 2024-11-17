import NDK from "@nostr-dev-kit/ndk";

class NostrRepository {
  private ndk: NDK;

  constructor(ndk: NDK) {
    this.ndk = ndk;
  }
}

export { NostrRepository };

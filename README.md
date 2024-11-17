NostrRSS: Curate your Nostr feed like a pro

NostrRSS is a powerful RSS-based Nostr client that puts you in control of your
content consumption. Key features:

    Seamless integration with existing RSS readers
    Advanced spam filtering to block unwanted content
    Whitelist filtering for laser-focused curation
    Conversation threading control

Say goodbye to information overload and hello to a tailored Nostr experience1

Enables you to use RSS clients (like the awesome Feeder from spacecowboy) to
receive contents published via NOSTR.

It allows you to:

1. Chose one or many users to follow at once, using their npub or nip05
   addresses (via the options users=user01@domain.com,user02@domain.com,npub...)
2. Choose to show only original posts of your subscriptions, or also replies to
   other posts (via the option "replies=false" or "replies=true")
3. Allows you to receive only posts containing some keywords that you find
   useful. For example, to receive only posts containing any of the words words
   "vegan","vegetarian", "cooking", "cook", "recipe", use the filter:
   whitelist=veg,cook,recipe
4. Usually, only notes and long articles are read. If you want more, you can
   change it via the option "kinds=kind1,kind2,kind3,...)

A full example:
https://nostr-to-rss.deno.dev/feed?users=mike@mikedilger.com,isolabellart@getalby.com,npub1gcxzte5zlkncx26j68ez60fzkvtkm9e0vrwdcvsjakxf9mu9qewqlfnj5z&replies=false&whitelist=veg,cook,recipe

Another example, getting the profile of an user:
https://nostr-to-rss.deno.dev/feed?users=mike@mikedilger.com&kinds=0 (gets the
profile info of this user)

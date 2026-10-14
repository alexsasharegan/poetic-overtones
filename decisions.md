Starting with a short, metrically stable benchmark—like a Shakespearean sonnet (e.g., Sonnet 18)—and a known Shavian target output is the absolute best way to build a test-driven MVP. It gives us a ground truth to validate our parser against before we throw the complex metrical variations of *The Lay of Nimrodel* at it.

To get the core engine running, here are the **4 concrete technical decisions** we need to finalize:

### 1. Shavian Word Boundary & Hyphenation Strategy

* **The Question:** In Shavian, compound words or prefixed words (like "Elven-king" or "unseen") can be written with hyphens, spaces, or merged.
* **The Decision:** Should the Lexical Parser treat hyphenated words as a single `Word` object with internal sub-words, or as completely separate words? *(Recommendation: Treat hyphens as word delimiters while preserving the hyphen in `metadata.suffix` so syllabification doesn't cross word boundaries.)*

**answer:** single word

### 2. Syllable Onset Boundary Heuristic (The Edge Cases)

* **The Question:** When two consonants sit between vowels (e.g., `𐑥𐑮` in "Nimrodel" / `n-m-r-d-l`), Maximal Onset assigns valid clusters to the next syllable (`𐑯𐑦` / `𐑥𐑮𐑩`). However, in English, `/mr/` is not a valid onset cluster at the start of a word.
* **The Decision:** Do we want a simple fallback (e.g., split multi-consonant clusters 50/50 between coda and onset: `𐑯𐑦𐑥` + `𐑮𐑩`), or do we maintain a small list of valid English initial clusters (like `𐑕𐑑`, `𐑓𐑤`, `𐑐𐑮`) to strictly govern onsets? *(Recommendation: A basic list of ~15 common consonant pairs keeps onset assignment remarkably accurate.)*

**answer:** follow the recommendation and maintain a list of valid eng. onset clusters

### 3. Alliterative Target Scope for the MVP

* **The Question:** Do we want the MVP's Foreshadowing Detector to scan *all* matching consonants, or only specific target consonants that we define in a runtime config (e.g., `target_consonants=["𐑓", "𐑤", "𐑮"]`)?
* **The Decision:** *(Recommendation: Start with an explicit `target_consonants` list for the MVP. Scanning every single consonant across a whole poem can generate massive graph noise until we tune our threshold filters.)*

**answer:** let's discuss further. it seems valuable to use a multi-pass enrichment so we can identify the stresses and use that going into a foreshadowing search

### 4. Foreshadowing Window Threshold

* **The Question:** How far forward or backward should the Foreshadowing Detector look?
* **The Decision:** Does an unstressed consonant in Line 1 only foreshadow a stressed consonant in Line 2–4 of the *same* stanza, or can it bridge across to Stanza $+1$? *(Recommendation: Bound the search window to within the current stanza OR adjacent lines across stanza boundaries for the MVP.)*

**answer:** i think +/- 1 stanza might be reasonable

---

### Suggested Next Steps

1. **Provide the Shavian Target:** Go ahead and share the Shavian transliteration for your selected benchmark poem (or a couple of stanzas from a Shakespeare sonnet).
2. **Confirm Decisions:** Let me know if you agree with the recommended defaults above for the four questions, and we can immediately write the functional Python MVP implementation for the parser!


1. single word
2. follow the recommendation and maintain a list of valid eng. onset clusters
3. let's discuss further. it seems valuable to use a multi-pass enrichment so we can identify the stresses and use that going into a foreshadowing search
4. i think +/- 1 stanza might be reasonable

𐑖𐑨𐑤 𐑲 𐑒𐑩𐑥𐑐𐑺 𐑞𐑰 𐑑 𐑩 𐑕𐑳𐑥𐑼’𐑟 𐑛𐑱?
𐑞𐑬 𐑸𐑑 𐑥𐑹 𐑤𐑳𐑝𐑤𐑦 𐑯 𐑥𐑹 𐑑𐑧𐑥𐑐𐑼𐑩𐑑:
𐑮𐑳𐑓 𐑢𐑦𐑯𐑛𐑟 𐑛𐑵 𐑖𐑱𐑒 𐑞 𐑛𐑸𐑤𐑦𐑙 𐑚𐑳𐑛𐑟 𐑝 ·𐑥𐑱,
𐑯 𐑕𐑳𐑥𐑼’𐑟 𐑤𐑰𐑕 𐑣𐑨𐑔 𐑷𐑤 𐑑𐑵 𐑖𐑹𐑑 𐑩 𐑛𐑱𐑑;
𐑕𐑳𐑥𐑑𐑲𐑥 𐑑𐑵 𐑣𐑪𐑑 𐑞 𐑲 𐑝 𐑣𐑧𐑝𐑩𐑯 𐑖𐑲𐑯𐑟,
𐑯 𐑪𐑓𐑩𐑯 𐑦𐑟 𐑣𐑦𐑟 𐑜𐑴𐑤𐑛 𐑒𐑩𐑥𐑐𐑤𐑧𐑒𐑖𐑩𐑯 𐑛𐑦𐑥𐑛;
𐑯 𐑧𐑝𐑮𐑦 𐑓𐑺 𐑓𐑮𐑪𐑥 𐑓𐑺 𐑕𐑳𐑥𐑑𐑲𐑥 𐑛𐑦𐑒𐑤𐑲𐑯𐑟,
𐑚𐑲 𐑗𐑭𐑯𐑕 𐑹 𐑯𐑱𐑗𐑼’𐑟 𐑗𐑱𐑯𐑡𐑦𐑙 𐑒𐑹𐑕 𐑳𐑯𐑑𐑮𐑦𐑥𐑛;
𐑚𐑳𐑑 𐑞𐑲 𐑦𐑑𐑻𐑯𐑩𐑤 𐑕𐑳𐑥𐑼 𐑖𐑨𐑤 𐑯𐑪𐑑 𐑓𐑱𐑛,
𐑯𐑹 𐑤𐑵𐑟 𐑐𐑩𐑟𐑧𐑖𐑩𐑯 𐑝 𐑞𐑨𐑑 𐑓𐑺 𐑞𐑬 𐑴'𐑕𐑑;
𐑯𐑹 𐑖𐑨𐑤 𐑛𐑧𐑔 𐑚𐑮𐑨𐑜 𐑞𐑬 𐑢𐑪𐑯𐑛𐑼'𐑕𐑑 𐑦𐑯 𐑣𐑦𐑟 𐑖𐑱𐑛,
𐑢𐑧𐑯 𐑦𐑯 𐑦𐑑𐑻𐑯𐑩𐑤 𐑤𐑲𐑯𐑟 𐑑 𐑑𐑲𐑥 𐑞𐑬 𐑜𐑮𐑴'𐑕𐑑:
	𐑕𐑴 𐑤𐑪𐑙 𐑨𐑟 𐑥𐑧𐑯 𐑒𐑨𐑯 𐑚𐑮𐑰𐑞 𐑹 𐑲𐑟 𐑒𐑨𐑯 𐑕𐑰,
	𐑕𐑴 𐑤𐑪𐑙 𐑤𐑦𐑝𐑟 𐑞𐑦𐑕, 𐑯 𐑞𐑦𐑕 𐑜𐑦𐑝𐑟 𐑤𐑲𐑓 𐑑 𐑞𐑰.

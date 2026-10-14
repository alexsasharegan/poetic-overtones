import json
import re

# ---------------------------------------------------------------------------
# 1. CONSTANTS & LOOKUP TABLES
# ---------------------------------------------------------------------------

SHAVIAN_REDUCED_VOWELS = {"𐑩"}  # Schwa /ə/

SHAVIAN_FULL_VOWELS = {
    "𐑦",
    "𐑧",
    "𐑨",
    "𐑪",
    "𐑫",
    "𐑳",
    "𐑭",
    "𐑷",
    "𐑵",
    "𐑰",
    "𐑱",
    "𐑲",
    "𐑴",
    "𐑶",
    "𐑸",
    "𐑹",
    "𐑺",
    "𐑻",
    "𐑼",
    "𐑽",
    "𐑾",
    "𐑿",
}

ALL_VOWELS = SHAVIAN_REDUCED_VOWELS | SHAVIAN_FULL_VOWELS

SHAVIAN_CONSONANTS = {
    "𐑐",
    "𐑑",
    "𐑒",
    "𐑓",
    "𐑔",
    "𐑞",
    "𐑕",
    "𐑖",
    "𐑗",
    "𐑘",
    "𐑙",
    "𐑚",
    "𐑛",
    "𐑜",
    "𐑝",
    "𐑟",
    "𐑠",
    "𐑡",
    "𐑢",
    "𐑣",
    "𐑤",
    "𐑥",
    "𐑯",
    "𐑮",
}

VALID_ONSETS = {
    "𐑐𐑮",
    "𐑐𐑤",
    "𐑚𐑮",
    "𐑚𐑤",
    "𐑑𐑮",
    "𐑑𐑢",
    "𐑛𐑮",
    "𐑛𐑢",
    "𐑒𐑮",
    "𐑒𐑤",
    "𐑒𐑢",
    "𐑜𐑮",
    "𐑜𐑤",
    "𐑜𐑢",
    "𐑓𐑮",
    "𐑓𐑤",
    "𐑔𐑮",
    "𐑔𐑢",
    "𐑖𐑮",
    "𐑕𐑥",
    "𐑕𐑯",
    "𐑕𐑐",
    "𐑕𐑑",
    "𐑕𐑒",
    "𐑕𐑤",
    "𐑕𐑢",
    "𐑕𐑐𐑮",
    "𐑕𐑐𐑤",
    "𐑕𐑑𐑮",
    "𐑕𐑒𐑮",
    "𐑕𐑒𐑢",
}

SHAVIAN_TO_IPA = {
    "𐑐": "p",
    "𐑑": "t",
    "𐑒": "k",
    "𐑓": "f",
    "𐑔": "θ",
    "𐑞": "ð",
    "𐑕": "s",
    "𐑖": "ʃ",
    "𐑗": "tʃ",
    "𐑘": "j",
    "𐑙": "ŋ",
    "𐑚": "b",
    "𐑛": "d",
    "𐑜": "ɡ",
    "𐑝": "v",
    "𐑟": "z",
    "𐑠": "ʒ",
    "𐑡": "dʒ",
    "𐑢": "w",
    "𐑣": "h",
    "𐑤": "l",
    "𐑥": "m",
    "𐑯": "n",
    "𐑮": "ɹ",
    "𐑩": "ə",
    "𐑦": "ɪ",
    "𐑧": "ɛ",
    "𐑨": "æ",
    "𐑪": "ɒ",
    "𐑫": "ʊ",
    "𐑳": "ʌ",
    "𐑭": "ɑː",
    "𐑷": "ɔː",
    "𐑵": "uː",
    "𐑰": "iː",
    "𐑱": "eɪ",
    "𐑲": "aɪ",
    "𐑴": "oʊ",
    "𐑶": "ɔɪ",
    "𐑸": "ɑːɹ",
    "𐑹": "ɔːɹ",
    "𐑺": "ɛəɹ",
    "𐑻": "ɜːɹ",
    "𐑼": "əɹ",
    "𐑽": "ɪəɹ",
    "𐑾": "iə",
    "𐑿": "juː",
}

SHAVIAN_TO_XSAMPA = {
    "𐑐": "p",
    "𐑑": "t",
    "𐑒": "k",
    "𐑓": "f",
    "𐑔": "T",
    "𐑞": "D",
    "𐑕": "s",
    "𐑖": "S",
    "𐑗": "tS",
    "𐑘": "j",
    "𐑙": "N",
    "𐑚": "b",
    "𐑛": "d",
    "𐑜": "g",
    "𐑝": "v",
    "𐑟": "z",
    "𐑠": "Z",
    "𐑡": "dZ",
    "𐑢": "w",
    "𐑣": "h",
    "𐑤": "l",
    "𐑥": "m",
    "𐑯": "n",
    "𐑮": "r",
    "𐑩": "@",
    "𐑦": "I",
    "𐑧": "E",
    "𐑨": "{",
    "𐑪": "Q",
    "𐑫": "U",
    "𐑳": "V",
    "𐑭": "A:",
    "𐑷": "O:",
    "𐑵": "u:",
    "𐑰": "i:",
    "𐑱": "eI",
    "𐑲": "aI",
    "𐑴": "oU",
    "𐑶": "OI",
    "𐑸": "A:r",
    "𐑹": "O:r",
    "𐑺": "E@r",
    "𐑻": "3:r",
    "𐑼": "@r",
    "𐑽": "I@r",
    "𐑾": "i@",
    "𐑿": "ju:",
}

UNSTRESSED_PARTICLES = {"𐑑", "𐑞", "𐑯", "𐑝"}

# ---------------------------------------------------------------------------
# 2. HELPER FUNCTIONS
# ---------------------------------------------------------------------------


def transliterate(shavian_str, mapping_dict):
    return "".join(mapping_dict.get(char, char) for char in shavian_str)


def syllabify_shavian_word(word):
    vowel_indices = [i for i, c in enumerate(word) if c in ALL_VOWELS]
    if not vowel_indices:
        return [word]

    syllables = []
    start_idx = 0

    for i in range(len(vowel_indices) - 1):
        v1_idx = vowel_indices[i]
        v2_idx = vowel_indices[i + 1]
        inter_cluster = word[v1_idx + 1 : v2_idx]

        onset_len = 0
        for split_point in range(len(inter_cluster)):
            candidate = inter_cluster[split_point:]
            if len(candidate) == 1 or candidate in VALID_ONSETS:
                onset_len = len(candidate)
                break

        coda_end = v2_idx - onset_len
        syllables.append(word[start_idx:coda_end])
        start_idx = coda_end

    syllables.append(word[start_idx:])
    return syllables


# ---------------------------------------------------------------------------
# 3. PARSER ENGINE
# ---------------------------------------------------------------------------


def parse_phonemic_poetry(raw_text):
    raw_stanzas = [s.strip() for s in re.split(r"\n\s*\n", raw_text) if s.strip()]

    envelope = {
        "document_id": "shavian_poem_parsed",
        "global_metadata": {"total_stanzas": len(raw_stanzas)},
        "body": [],
    }

    # PASS 1: Lexical Structure & Syllabification
    for s_idx, stanza_text in enumerate(raw_stanzas, start=1):
        stanza_obj = {"type": "stanza", "index": s_idx, "lines": []}
        lines = [l.strip() for l in stanza_text.splitlines() if l.strip()]

        for l_idx, line_text in enumerate(lines, start=1):
            line_obj = {
                "index": l_idx,
                "text_shavian": line_text,
                "metadata": {},
                "words": [],
            }

            words = line_text.split()
            for w_idx, word in enumerate(words, start=1):
                # FIXED: Using 32-bit Unicode range \U00010450-\U0001047F
                core_shavian = "".join(
                    c for c in word if "\U00010450" <= c <= "\U0001047f"
                )

                if not core_shavian:
                    continue

                # Extract surrounding punctuation
                m_prefix = re.match(r"^[^\U00010450-\U0001047F]+", word)
                m_suffix = re.search(r"[^\U00010450-\U0001047F]+$", word)
                prefix = m_prefix.group(0) if m_prefix else ""
                suffix = m_suffix.group(0) if m_suffix else ""

                raw_syllables = syllabify_shavian_word(core_shavian)

                word_obj = {
                    "shavian": core_shavian,
                    "ipa": transliterate(core_shavian, SHAVIAN_TO_IPA),
                    "x_sampa": transliterate(core_shavian, SHAVIAN_TO_XSAMPA),
                    "metadata": {"prefix": prefix, "suffix": suffix, "raw_word": word},
                    "syllables": [],
                }

                for syl_idx, syl_text in enumerate(raw_syllables, start=1):
                    vowels_in_syl = [c for c in syl_text if c in ALL_VOWELS]
                    nucleus = vowels_in_syl[0] if vowels_in_syl else ""
                    n_idx = syl_text.find(nucleus) if nucleus else len(syl_text)

                    onset = syl_text[:n_idx]
                    coda = syl_text[n_idx + len(nucleus) :] if nucleus else ""

                    node_id = f"S{s_idx}_L{l_idx}_W{w_idx}_Syl{syl_idx}"

                    syl_obj = {
                        "id": node_id,
                        "shavian": syl_text,
                        "ipa": transliterate(syl_text, SHAVIAN_TO_IPA),
                        "x_sampa": transliterate(syl_text, SHAVIAN_TO_XSAMPA),
                        "onset": onset,
                        "nucleus": nucleus,
                        "coda": coda,
                        "stress_weight": "U",
                        "metadata": {"foreshadows": [], "foreshadowed_by": []},
                    }
                    word_obj["syllables"].append(syl_obj)

                line_obj["words"].append(word_obj)
            stanza_obj["lines"].append(line_obj)
        envelope["body"].append(stanza_obj)

    # PASS 2: Stress Weight Assignment
    for stanza in envelope["body"]:
        for line in stanza["lines"]:
            for word in line["words"]:
                is_particle = word["shavian"] in UNSTRESSED_PARTICLES
                for syl in word["syllables"]:
                    if is_particle:
                        syl["stress_weight"] = "U"
                    elif any(v in SHAVIAN_FULL_VOWELS for v in syl["nucleus"]):
                        syl["stress_weight"] = "S"
                    else:
                        syl["stress_weight"] = "U"

    # PASS 3: Acoustic Foreshadowing Linker
    all_syllables = []
    for stanza in envelope["body"]:
        for line in stanza["lines"]:
            for word in line["words"]:
                for syl in word["syllables"]:
                    all_syllables.append((stanza["index"], syl))

    for i, (s_idx_target, target_syl) in enumerate(all_syllables):
        if target_syl["stress_weight"] == "S":
            target_consonants = {
                c for c in target_syl["shavian"] if c in SHAVIAN_CONSONANTS
            }

            for j in range(max(0, i - 15), i):
                prev_stanza_idx, prev_syl = all_syllables[j]

                if (
                    abs(s_idx_target - prev_stanza_idx) <= 1
                    and prev_syl["stress_weight"] == "U"
                ):
                    prev_consonants = {
                        c for c in prev_syl["shavian"] if c in SHAVIAN_CONSONANTS
                    }
                    shared = target_consonants & prev_consonants

                    for c in shared:
                        target_syl["metadata"]["foreshadowed_by"].append(
                            {
                                "consonant": c,
                                "ipa": SHAVIAN_TO_IPA[c],
                                "from_node": prev_syl["id"],
                            }
                        )
                        prev_syl["metadata"]["foreshadows"].append(
                            {
                                "consonant": c,
                                "ipa": SHAVIAN_TO_IPA[c],
                                "to_node": target_syl["id"],
                            }
                        )

    return envelope

def generate_mermaid_diagram(json_envelope, mode="Shavian", filter_consonant=None):
    """
    Generates a Mermaid diagram from the parsed poem JSON.
    mode: "Shavian", "IPA", or "X-SAMPA"
    filter_consonant: Optional Shavian character (e.g., "𐑥") to isolate one sound's network.
    """
    mermaid_lines = [
        "graph TD",
        "    classDef unstressed fill:#f9f9fb,stroke:#888,stroke-dasharray: 3 3;",
        "    classDef stressed fill:#e6f4ea,stroke:#1e7e34,stroke-width:2px;",
        ""
    ]

    # 1. Build Subgraphs and Nodes
    for stanza in json_envelope["body"]:
        mermaid_lines.append(f"    subgraph Stanza_{stanza['index']} [Stanza {stanza['index']}]")

        for line in stanza["lines"]:
            line_id = f"S{stanza['index']}_L{line['index']}"
            mermaid_lines.append(f"        subgraph {line_id} [Line {line['index']}]")

            # Line direction flow
            syl_node_ids = []
            for word in line["words"]:
                for syl in word["syllables"]:
                    syl_id = syl["id"]

                    # Choose label format based on target mode
                    if mode == "IPA":
                        label = f"/{syl['ipa']}/"
                    elif mode == "X-SAMPA":
                        label = f"[{syl['x_sampa']}]"
                    else:  # Shavian default
                        label = syl["shavian"]

                    # Style class
                    css_class = "stressed" if syl["stress_weight"] == "S" else "unstressed"

                    mermaid_lines.append(f'            {syl_id}["{label}"]:::{css_class}')
                    syl_node_ids.append(syl_id)

            mermaid_lines.append("        end")
        mermaid_lines.append("    end\n")

    # 2. Draw Foreshadowing Connections
    mermaid_lines.append("    %% Foreshadowing Connections")
    for stanza in json_envelope["body"]:
        for line in stanza["lines"]:
            for word in line["words"]:
                for syl in word["syllables"]:
                    for link in syl["metadata"].get("foreshadowed_by", []):
                        c = link["consonant"]
                        if filter_consonant is None or c == filter_consonant:
                            from_id = link["from_node"]
                            to_id = syl["id"]
                            c_label = SHAVIAN_TO_IPA.get(c, c) if mode == "IPA" else c
                            mermaid_lines.append(f'    {from_id} -->|"/ {c_label} /"| {to_id}')

    return "\n".join(mermaid_lines)



# ---------------------------------------------------------------------------
# 4. RUN PARSER ON SONNET 18
# ---------------------------------------------------------------------------

sonnet_18_shavian = """
𐑖𐑨𐑤 𐑲 𐑒𐑩𐑥𐑐𐑺 𐑞𐑰 𐑑 𐑩 𐑕𐑳𐑥𐑼’𐑟 𐑛𐑱?
𐑞𐑬 𐑸𐑑 𐑥𐑹 𐑤𐑳𐑝𐑤𐑦 𐑯 𐑥𐑹 𐑑𐑧𐑥𐑐𐑼𐑩𐑑:
𐑮𐑳𐑓 𐑢𐑦𐑯𐑛𐑟 𐑛𐑵 𐑖𐑱𐑒 𐑞 𐑛𐑸𐑤𐑦𐑙 𐑚𐑳𐑛𐑟 𐑝 ·𐑥𐑱,
𐑯 𐑕𐑳𐑥𐑼’𐑟 𐑤𐑰𐑕 𐑣𐑨𐑔 𐑷𐑤 𐑑𐑵 𐑖𐑹𐑑 𐑩 𐑛𐑱𐑑;
"""

parsed = parse_phonemic_poetry(sonnet_18_shavian)

# Print word 3 ("compare" / 𐑒𐑩𐑥𐑐𐑺)
# print(
#     json.dumps(parsed, indent=2, ensure_ascii=False)
# )

# --- Test generating Mermaid for Sonnet 18 ---
# Isolate the /m/ (𐑥) foreshadowing network in IPA mode
mermaid_output = generate_mermaid_diagram(parsed, mode="Shavian", filter_consonant="𐑥")
print(mermaid_output)

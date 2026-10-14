# Design Document: Phonemic Poetic Structure Parser (PPSP)

## 1. Overview

The Phonemic Poetic Structure Parser (PPSP) is a deterministic text-processing pipeline designed to ingest transliterated phonemic poetry (specifically in Shavian script) and output a highly structured, multi-representation JSON envelope. By leveraging Shavian's strict 1:1 phoneme-to-glyph mapping, PPSP performs zero-dictionary syllabification, infers metrical stress based on vowel weight, and detects structural acoustic patterns like unstressed-to-stressed consonant foreshadowing.

The output serves as a universal data layer for downstream presentation tools, generating visualizations like Mermaid directed acyclic graphs (DAGs) in multiple target scripts (Shavian, IPA, X-SAMPA, and Tengwar).

## 2. System Architecture

The pipeline operates as a sequential chain of single-responsibility modules:

1. **Lexical Parser:** Chunks the UTF-8 text stream into a physical hierarchy (Poem > Stanza > Line > Word).
2. **Syllabification Engine:** Partitions words into syllables around vowel nuclei using the Maximal Onset Principle.
3. **Prosodic Analyzer:** Classifies syllable stress based on full vs. reduced Shavian vowels and infers line-level meter.
4. **Pattern Detector (Foreshadowing):** Scans the data tree to map relationships between incidental (unstressed) consonants and structural (stressed) alliterative anchors.
5. **Multi-Script Transpiler:** Derives parallel Unicode IPA and ASCII X-SAMPA representations from the base Shavian.

## 3. Core Modules & Logic Specifications

### 3.1 Lexical Parser

* **Input:** UTF-8 Shavian text stream.
* **Behavior:** Delimits stanzas via double newlines (`\n\n`) and lines via single newlines (`\n`).
* **Punctuation Handling:** Non-phonemic punctuation is stripped from the phonetic evaluation stream but retained in a `metadata.suffix` field at the word level, allowing perfect orthographic reconstruction without polluting the consonant arrays.

### 3.2 Syllabification Engine

Exploits Shavian orthography to bypass complex English syllabification algorithms.

* **Nucleus Identification:** Scans for vowel glyphs. Every vowel glyph instantiates exactly one syllable.
* **Maximal Onset Allocation:** Consonants between two vowels are assigned to the second vowel's onset, up to the maximum valid English consonant cluster length. Remaining consonants fall to the preceding syllable's coda.

### 3.3 Prosodic & Metrical Analyzer

Determines scansion without dictionary lookups by evaluating vowel types.

* **Stress Weighting:**
* **Unstressed (U):** Syllables containing the Schwa (`𐑩`) or designated reduced vowels.
* **Stressed (S):** Syllables containing any Full Vowel (e.g., `𐑦`, `𐑧`, `𐑨`, `𐑪`, `𐑰`, `𐑴`). Monosyllabic content words with short vowels are correctly captured as stressed.


* **Meter Inference:** Compares the resulting `U S U S` arrays against standard metrical masks (Iambic, Trochaic, Anapestic). Calculates foot count (Tetrameter, Pentameter) and flags anomalous lines in the metadata.

### 3.4 Acoustic Foreshadowing Detector

Tests the acoustic priming hypothesis (e.g., Tolkien's use of off-beat consonants to prep the ear for structural alliteration).

* **Target:** Identifies consonant matches across adjacent lines or stanzas.
* **Vector Mapping:** Flags instances where a consonant appears in an unstressed (`U`) dip, and later reappears as the primary structural lift (`S`) of a subsequent metrical foot.
* **Metadata Injection:** Writes `{"alliterative_role": "foreshadow", "links_to": "node_id"}` into the respective syllable's envelope.

### 3.5 Multi-Script Transpiler

Treats Unicode as the primary data layer and generates secondary formats for maximum system compatibility.

* **IPA (Primary Parallel):** Direct 1:1 UTF-8 mapping from Shavian for standard linguistic presentation.
* **X-SAMPA (Fallback IR):** Computes strict 7-bit ASCII representation from the IPA/Shavian for legacy systems, regex parsing, and CLI compatibility.
* **Tengwar Hook:** X-SAMPA acts as the bridge to downstream Tengwar rendering tools. The `U` / `S` stress tags allow the external Tengwar renderer to deterministically assign short/weak vowels to inline diacritics (e.g., a breve for Schwa) and long/stressed vowels to independent carriers.

## 4. Data Model & JSON Envelope

The output schema utilizes an envelope pattern. The `metadata` block at every structural level allows analytical layers to attach attributes without breaking downstream rendering.

```json
{
  "document_id": "lay_of_nimrodel_01",
  "global_metadata": {
    "inferred_meter": "Iambic",
    "inferred_length": "Tetrameter",
    "total_stanzas": 1
  },
  "body": [
    {
      "type": "stanza",
      "index": 1,
      "lines": [
        {
          "index": 1,
          "metadata": { "meter_match": "Trochaic_Inversion", "feet": 4 },
          "words": [
            {
              "shavian": "𐑯𐑦𐑥𐑮𐑩𐑛𐑧𐑤",
              "ipa": "nɪmɹədɛl",
              "x_sampa": "nImr@dEl",
              "metadata": { "suffix": "," },
              "syllables": [
                {
                  "shavian": "𐑯𐑦𐑥",
                  "ipa": "nɪm",
                  "x_sampa": "nIm",
                  "onset": "𐑯",
                  "nucleus": "𐑦",
                  "coda": "𐑥",
                  "stress_weight": "S",
                  "metadata": {
                    "alliterative_role": "anchor",
                    "linked_from": ["S1_L0_W2_Syl1"]
                  }
                },
                {
                  "shavian": "𐑮𐑩",
                  "ipa": "ɹə",
                  "x_sampa": "r@",
                  "onset": "𐑮",
                  "nucleus": "𐑩",
                  "coda": "",
                  "stress_weight": "U",
                  "metadata": {}
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

```

## 5. Downstream Integration (Visualization Layer)

The structured JSON envelope directly drives diagrammatic generators (such as Mermaid DAGs).

* **Node Abstraction:** The layout engine creates nodes based on the hierarchical coordinates (`S1_L1_W1_Syl1`).
* **Presentation Target Selection:** At render time, the user specifies the target script (`IPA`, `Shavian`, `X-SAMPA`, or `Tengwar`). The layout engine simply pulls the corresponding key from the JSON syllable envelope to label the nodes.
* **Visual Semantics:**
* `stress_weight == "U"` renders as dotted/muted nodes (incidental/foreshadowing).
* `stress_weight == "S"` renders as bold/heavy nodes (structural anchors).
* Edge routing is driven entirely by the `metadata.linked_from` and `links_to` vectors.

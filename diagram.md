graph TD
    classDef unstressed fill:#f9f9fb,stroke:#888,stroke-dasharray: 3 3;
    classDef stressed fill:#e6f4ea,stroke:#1e7e34,stroke-width:2px;

    subgraph Stanza_1 [Stanza 1]
        subgraph S1_L1 [Line 1]
            S1_L1_W1_Syl1["𐑖𐑨𐑤"]:::stressed
            S1_L1_W2_Syl1["𐑲"]:::stressed
            S1_L1_W3_Syl1["𐑒𐑩𐑥"]:::unstressed
            S1_L1_W3_Syl2["𐑐𐑺"]:::stressed
            S1_L1_W4_Syl1["𐑞𐑰"]:::stressed
            S1_L1_W5_Syl1["𐑑"]:::unstressed
            S1_L1_W6_Syl1["𐑩"]:::unstressed
            S1_L1_W7_Syl1["𐑕𐑳"]:::stressed
            S1_L1_W7_Syl2["𐑥𐑼𐑟"]:::stressed
            S1_L1_W8_Syl1["𐑛𐑱"]:::stressed
        end
        subgraph S1_L2 [Line 2]
            S1_L2_W1_Syl1["𐑞𐑬"]:::unstressed
            S1_L2_W2_Syl1["𐑸𐑑"]:::stressed
            S1_L2_W3_Syl1["𐑥𐑹"]:::stressed
            S1_L2_W4_Syl1["𐑤𐑳𐑝"]:::stressed
            S1_L2_W4_Syl2["𐑤𐑦"]:::stressed
            S1_L2_W5_Syl1["𐑯"]:::unstressed
            S1_L2_W6_Syl1["𐑥𐑹"]:::stressed
            S1_L2_W7_Syl1["𐑑𐑧𐑥"]:::stressed
            S1_L2_W7_Syl2["𐑐𐑼"]:::stressed
            S1_L2_W7_Syl3["𐑩𐑑"]:::unstressed
        end
        subgraph S1_L3 [Line 3]
            S1_L3_W1_Syl1["𐑮𐑳𐑓"]:::stressed
            S1_L3_W2_Syl1["𐑢𐑦𐑯𐑛𐑟"]:::stressed
            S1_L3_W3_Syl1["𐑛𐑵"]:::stressed
            S1_L3_W4_Syl1["𐑖𐑱𐑒"]:::stressed
            S1_L3_W5_Syl1["𐑞"]:::unstressed
            S1_L3_W6_Syl1["𐑛𐑸"]:::stressed
            S1_L3_W6_Syl2["𐑤𐑦𐑙"]:::stressed
            S1_L3_W7_Syl1["𐑚𐑳𐑛𐑟"]:::stressed
            S1_L3_W8_Syl1["𐑝"]:::unstressed
            S1_L3_W9_Syl1["𐑥𐑱"]:::stressed
        end
        subgraph S1_L4 [Line 4]
            S1_L4_W1_Syl1["𐑯"]:::unstressed
            S1_L4_W2_Syl1["𐑕𐑳"]:::stressed
            S1_L4_W2_Syl2["𐑥𐑼𐑟"]:::stressed
            S1_L4_W3_Syl1["𐑤𐑰𐑕"]:::stressed
            S1_L4_W4_Syl1["𐑣𐑨𐑔"]:::stressed
            S1_L4_W5_Syl1["𐑷𐑤"]:::stressed
            S1_L4_W6_Syl1["𐑑𐑵"]:::stressed
            S1_L4_W7_Syl1["𐑖𐑹𐑑"]:::stressed
            S1_L4_W8_Syl1["𐑩"]:::unstressed
            S1_L4_W9_Syl1["𐑛𐑱𐑑"]:::stressed
        end
    end

    %% Foreshadowing Connections
    S1_L1_W3_Syl1 -->|"/ 𐑥 /"| S1_L1_W7_Syl2
    S1_L1_W3_Syl1 -->|"/ 𐑥 /"| S1_L2_W3_Syl1
    S1_L1_W3_Syl1 -->|"/ 𐑥 /"| S1_L2_W6_Syl1
    S1_L1_W3_Syl1 -->|"/ 𐑥 /"| S1_L2_W7_Syl1

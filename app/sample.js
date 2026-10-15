// The sample document the app opens with: Twinkle, Twinkle, Little Star (Jane Taylor, 1806,
// public domain) with a few tiers and two themes.
export default `<meta title="Twinkle, Twinkle, Little Star" author="Jane Taylor" year="1806" language="en"/>

<text>
Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.
</text>

<markup>
<span id="1"><span id="9">Twinkle, <span id="10">twinkle</span></span><span id="10b" cont="10">, little</span> st<span id="5">ar</span>,</span>
<span id="2">How I wonder what you <span id="6">are</span>!</span>
<span id="3"><span id="f1"><span id="u1">Up</span> a</span><span id="f2"><span id="u2">bove</span> the</span> <span id="f3"><span id="u3">world</span> so</span> <span id="f4"><span id="u4">h<span id="7">igh</span></span></span>,</span>
<span id="4">Like a diamond in the sk<span id="8">y</span>.</span>
</markup>

<analysis>
  <tier id="t1" name="Lines" role="line">
    <set id="s1" members="1,2,3,4"/>
  </tier>
  <tier id="t2" name="Rhyme scheme" role="rhyme-scheme">
    <set id="s2" name="A" members="1,2"/>
    <set id="s3" name="B" members="3,4"/>
  </tier>
  <tier id="t6" name="Feet" role="foot">
    <set id="s8" name="trochee" members="f1,f2,f3"/>
    <set id="s9" name="catalectic" members="f4"/>
  </tier>
  <tier id="t7" name="Stress" role="stress" provider="english.stress@1">
    <set id="s10" name="stressed" key="primary" members="u1,u2,u3,u4" confirmed="u1,u2"/>
  </tier>
  <tier id="t3" name="Repetition" kind="relation" role="repetition">
    <set id="s4" members="9"/>
  </tier>
  <tier id="t4" name="Short i" kind="relation" role="assonance">
    <set id="s5" members="10"/>
  </tier>
  <tier id="t5" name="End rhyme" kind="relation" role="rhyme">
    <set id="s6" name="A" members="5,6"/>
    <set id="s7" name="B" members="7,8"/>
  </tier>
</analysis>

<style name="Reader">
  tier[role="line"] > set { background: rgb(120 110 90 / .08); border-radius: 4px; }
  tier[role="rhyme-scheme"] > set:nth-child(1) { background: rgb(240 160 60 / .20); border-radius: 4px; }
  tier[role="rhyme-scheme"] > set:nth-child(2) { background: rgb(60 130 230 / .18); border-radius: 4px; }
  tier[role="foot"] { color: #6b665d; }
  tier[role="foot"] > set::before { content: "["; }
  tier[role="foot"] > set::after { content: "]"; }
  tier[role="stress"] > set { font-weight: 700; font-size: 1.15em; }
  tier[role="repetition"] > set { text-decoration: underline wavy #7a4fb3 2px; }
  tier[role="assonance"] > set { outline: 1.5px dashed #1f8a5b; border-radius: 8px; padding: 0 3px; }
  tier[role="rhyme"] > set:nth-child(1) { color: #b3261e; font-weight: 700; }
  tier[role="rhyme"] > set:nth-child(2) { color: #1b5fa8; font-weight: 700; font-style: italic; }
  member[inferred] { outline: 1px dashed #b07a2a; border-radius: 3px; }
</style>

<style name="Ink" disabled="true">
  tier[role="line"] > set { text-decoration: underline solid rgb(0 0 0 / .25) 1px; }
  tier[role="rhyme-scheme"] > set:nth-child(odd) { border: 2px solid rgb(230 180 0); border-radius: 10px; opacity: .8; }
  tier[role="rhyme-scheme"] > set:nth-child(even) { border: 2px dotted rgb(0 160 190); border-radius: 10px; }
  tier[role="foot"] > set::before { content: "‹"; }
  tier[role="foot"] > set::after { content: "›"; }
  tier[role="stress"] > set { font-size: 3em; text-shadow: 0 0 4px rgb(255 120 0 / .7); }
  tier[role="repetition"] > set { background: rgb(160 0 200 / .15); box-shadow: 0 2px 0 rgb(160 0 200 / .5); }
  tier[role="assonance"] > set { background: rgb(255 80 120 / .30); border-radius: 999px; padding: 0 4px; }
  tier[role="rhyme"] > set { color: #c2185b; font-style: italic; }
  member[inferred] { text-decoration: underline dotted #c0600a 2px; }
</style>
`;

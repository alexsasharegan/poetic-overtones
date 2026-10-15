// A small XML 1.0 parser for the pxml subset (spec/format.md B-02 to B-08). No dependencies.
// It accepts elements, attributes, text, the five named entities, numeric character
// references, comments, processing instructions and an XML declaration. It rejects CDATA
// (B-05) and DOCTYPE (B-03) and anything that is not well-formed. Every node records the
// line it starts on.
//
// Node shapes:
//   { type: 'element', name, attrs: { name: value }, children: [...], line }
//   { type: 'text', value, line }
//   { type: 'comment', value, line }
//   { type: 'pi', target, value, line }

export class PxmlError extends Error {
  constructor(code, detail = '', line = null) {
    super(line ? `${code} (line ${line})${detail ? ': ' + detail : ''}` : `${code}${detail ? ': ' + detail : ''}`);
    this.code = code;
    this.detail = detail;
    this.line = line;
  }
}

const NAMED = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
const NAME_START = /[A-Za-z_:À-ÖØ-öø-˿Ͱ-ͽͿ-῿‌‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�]/;
const NAME_CHAR = /[-A-Za-z0-9_:.·À-ÖØ-öø-ͽͿ-῿‌‍‿⁀⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�]/;

export function xmlCharOk(n) {
  return n === 9 || n === 10 || n === 13 || (n >= 0x20 && n <= 0xd7ff) || (n >= 0xe000 && n <= 0xfffd) || (n >= 0x10000 && n <= 0x10ffff);
}

export function parseXml(src) {
  src = src.replace(/\r\n?/g, '\n');          // XML 2.11: line ends become LF
  let i = 0, line = 1;
  const n = src.length;
  const fail = (code, detail) => { throw new PxmlError(code, detail, line); };
  const bad = (detail) => fail('xml-not-wellformed', detail);

  const advance = (k) => {
    for (let e = i + k; i < e; i++) if (src.charCodeAt(i) === 10) line++;
  };
  const startsWith = (s) => src.startsWith(s, i);

  function readName() {
    const s = i;
    if (i >= n || !NAME_START.test(src[i])) bad('expected a name');
    i++;
    while (i < n && NAME_CHAR.test(src[i])) i++;
    return src.slice(s, i);
  }
  function skipSpace() {
    while (i < n && /[ \t\n]/.test(src[i])) advance(1);
  }
  function reference() {           // at '&'
    const semi = src.indexOf(';', i);
    if (semi < 0) bad('unterminated reference');
    const body = src.slice(i + 1, semi);
    let ch;
    if (body[0] === '#') {
      const code = body[1] === 'x' ? (/^[0-9A-Fa-f]+$/.test(body.slice(2)) ? parseInt(body.slice(2), 16) : NaN)
                                   : (/^[0-9]+$/.test(body.slice(1)) ? parseInt(body.slice(1), 10) : NaN);
      if (!(code >= 0) || !xmlCharOk(code)) bad('bad character reference &' + body + ';');
      ch = String.fromCodePoint(code);
    } else if (Object.hasOwn(NAMED, body)) {
      ch = NAMED[body];
    } else {
      bad('unknown entity &' + body + '; (only lt gt amp quot apos, B-06)');
    }
    i = semi + 1;
    return ch;
  }
  function attrValue() {
    const q = src[i];
    if (q !== '"' && q !== "'") bad('attribute value must be quoted');
    i++;
    let out = '';
    while (true) {
      if (i >= n) bad('unterminated attribute value');
      const c = src[i];
      if (c === q) { i++; break; }
      if (c === '<') bad("'<' in an attribute value");
      if (c === '&') { out += reference(); continue; }
      if (c === '\n') { line++; out += ' '; i++; continue; }     // attribute value normalisation
      if (c === '\t') { out += ' '; i++; continue; }
      out += c; i++;
    }
    return out;
  }

  const root = { type: 'element', name: '#document', attrs: {}, children: [], line: 1 };
  const stack = [root];
  let text = '', textLine = line;
  const flush = () => {
    if (text) stack[stack.length - 1].children.push({ type: 'text', value: text, line: textLine });
    text = '';
  };

  while (i < n) {
    const c = src[i];
    if (c === '<') {
      flush();
      const at = line;
      if (startsWith('<!--')) {
        const end = src.indexOf('-->', i + 4);
        if (end < 0) bad('unterminated comment');
        const value = src.slice(i + 4, end);
        if (value.includes('--')) bad("'--' inside a comment");
        advance(end + 3 - i);
        stack[stack.length - 1].children.push({ type: 'comment', value, line: at });
      } else if (startsWith('<![CDATA[')) {
        fail('cdata-not-allowed');
      } else if (startsWith('<!DOCTYPE') || startsWith('<!doctype')) {
        fail('doctype-not-allowed');
      } else if (startsWith('<!')) {
        bad('unexpected <!');
      } else if (startsWith('<?')) {
        const end = src.indexOf('?>', i + 2);
        if (end < 0) bad('unterminated processing instruction');
        i += 2;
        const target = readName();
        const value = src.slice(i, end).replace(/^[ \t\n]+/, '');
        if (target.toLowerCase() === 'xml') bad('XML declaration not at the start');
        advance(end + 2 - i);
        stack[stack.length - 1].children.push({ type: 'pi', target, value, line: at });
      } else if (startsWith('</')) {
        i += 2;
        const name = readName();
        skipSpace();
        if (src[i] !== '>') bad('expected > after end tag');
        i++;
        const open = stack.pop();
        if (open === root || open.name !== name) bad(`end tag </${name}> does not match <${open === root ? '' : open.name}>`);
      } else {
        i++;
        const name = readName();
        const el = { type: 'element', name, attrs: {}, children: [], line: at };
        while (true) {
          const before = i;
          skipSpace();
          if (src[i] === '>') { i++; stack[stack.length - 1].children.push(el); stack.push(el); break; }
          if (startsWith('/>')) { i += 2; stack[stack.length - 1].children.push(el); break; }
          if (i === before) bad('expected whitespace between attributes');
          const an = readName();
          skipSpace();
          if (src[i] !== '=') bad(`attribute ${an} has no value`);
          i++;
          skipSpace();
          if (Object.hasOwn(el.attrs, an)) bad(`duplicate attribute ${an}`);
          el.attrs[an] = attrValue();
        }
      }
      textLine = line;
    } else if (c === '&') {
      if (!text) textLine = line;
      text += reference();
    } else {
      if (!text) textLine = line;
      if (c === ']' && startsWith(']]>')) bad("']]>' in text");
      if (c === '\n') line++;
      text += c;
      i++;
    }
  }
  flush();
  if (stack.length > 1) {
    const open = stack[stack.length - 1];
    throw new PxmlError('xml-not-wellformed', `<${open.name}> is never closed`, open.line);
  }
  return root;
}

// Text content of a node, comments and processing instructions skipped (like ElementTree.itertext).
export function textOf(node) {
  if (node.type === 'text') return node.value;
  if (node.type !== 'element') return '';
  return node.children.map(textOf).join('');
}

// Write a node back as XML (used for extension blocks, which are kept as they are).
export function writeNode(node) {
  if (node.type === 'text') return escText(node.value);
  if (node.type === 'comment') return `<!--${node.value}-->`;
  if (node.type === 'pi') return `<?${node.target}${node.value ? ' ' + node.value : ''}?>`;
  const attrs = Object.entries(node.attrs).map(([k, v]) => ` ${k}="${escAttr(v)}"`).join('');
  if (!node.children.length) return `<${node.name}${attrs}/>`;
  return `<${node.name}${attrs}>${node.children.map(writeNode).join('')}</${node.name}>`;
}

export function escText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#13;');
}
export function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/\n/g, '&#10;').replace(/\t/g, '&#9;').replace(/\r/g, '&#13;');
}

// poetic-overtones core: the document model, its loader, its canonical export and editing.
// Plain ES modules with no dependencies; the same code runs in the browser and in Node.
export { load, spanText, PxmlError } from './load.js';
export { save } from './save.js';
export { Editor, cpIndex, utf16Index } from './edit.js';
export { parseXml } from './xml.js';

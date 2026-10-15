// poetic-parser core: the document model, its loader and its canonical export.
// Plain ES modules with no dependencies; the same code runs in the browser and in Node.
export { load, spanText, PxmlError } from './load.js';
export { save } from './save.js';
export { parseXml } from './xml.js';

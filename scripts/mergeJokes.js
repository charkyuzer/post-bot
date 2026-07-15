const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/jokes.json');
const raw = fs.readFileSync(filePath, 'utf8');

const separatorIdx = raw.indexOf(']\n\n[');
const arr1 = JSON.parse(raw.substring(0, separatorIdx + 1));
const arr2 = JSON.parse(raw.substring(separatorIdx + 3));

const lastId = arr1[arr1.length - 1].id;
const merged = arr1.concat(arr2.map((j, i) => ({ ...j, id: lastId + i + 1 })));

fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
console.log('Merged! Total jokes:', merged.length, '| IDs:', merged[0].id, '->', merged[merged.length - 1].id);

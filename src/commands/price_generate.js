const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const md5 = require('md5');
const api = require('../api');
const config = require('../../.config');

let db;

const customFields = config.price.customFields;

// значение поля по его id
function getItemField(item, fieldId) {
  if (!item.customData) return '';
  const fields = item.customData.customValue;
  const field = fields.find((f) => f.field.id == fieldId);
  const value = field.value;
  return value;
}

// кеширует запросы к Планфиксу
async function apiRequestCached(method, opts, cacheTime=3600) {
  const cache = db.get('cache');
  const key = method + '_' + md5(JSON.stringify(opts));
  const cached = cache.find({ key }).value();

  const isValid = cached && cached.created + cacheTime * 1000 > Date.now();
  if (isValid) return cached.value;

  // update cache
  const newCache = {
    key,
    created: Date.now(),
    value: await api.request(method, opts)
  };

  cache.remove({ key }).write();
  cache.push(newCache).write();

  return newCache.value;
}

// рекурсивный обход дерева справочника
async function processItems(parentKey, level = 0) {
  let allItems = [];
  const outItems = [];
  let pageCurrent = 1;

  let isEnd = false;
  while (!isEnd) {
    const requestOpts = {
      handbook: { id: config.price.handbookId },
      parentKey: parentKey,
      pageSize: 100,
      pageCurrent: pageCurrent,
    };

    const cacheTime = config.price.forceUpdateParents.includes(parseInt(parentKey)) ? 0 : config.price.cacheTime;
    const result = await apiRequestCached('handbook.getRecords', requestOpts, cacheTime);

    let items = result.records.record;
    if (!items) items = []; // вместо пустого результата result.records выдаёт пустую строку
    if (!Array.isArray(items)) items = [items]; // если 1 результат, то его отдают в виде объекта вместо массива

    if (items.length < 100) isEnd = true;
    if (!isEnd) console.log('items.length: ', items.length);

    allItems = [...allItems, ...items];
    pageCurrent++;
  }

  // sort by sku
  allItems = allItems.sort((a, b) => {
    const skuA = getItemField(a, customFields.sku);
    const skuB = getItemField(b, customFields.sku);
    return skuA > skuB ? 1 : (skuA < skuB ? -1 : 0);
  });

  for (let item of allItems) {
    const outItem = {};

    // Группа
    if (item.isGroup === '1') {
      console.log(' '.repeat(level * 2) + item.name);
      // outItem.name = item.name;
      outItem.name = item.name.replace(/^[0-9.]+ /, ''); // убирает цифры в начале названия
      outItem.children = await processItems(item.key, level + 1);
      if (outItem.children.length > 0) {
        outItems.push(outItem);
      }
    }

    // Запись справочника
    if (item.isGroup === '0') {
      const outItem = await processItem(item, level);
      if (outItem) outItems.push(outItem);
    }
  }

  return outItems;
}

// действия с записью справочника (не группы)
async function processItem(item, level) {
  const name = getItemField(item, customFields.name);
  const price = getItemField(item, customFields.price);
  const priceOld = getItemField(item, customFields.priceOld);

  const public = getItemField(item, customFields.public);
  const nameShort = getItemField(item, customFields.nameShort);
  const descrtiptionShort = getItemField(item, customFields.descrtiptionShort);

  if (public != '1') return;

  return {
    name: nameShort || name,
    price: parseInt(price),
    description: descrtiptionShort
  }
}

module.exports = async (opts) => {
  const adapter = new FileSync('data/db.json');
  db = lowdb(adapter);
  db.defaults({ cache: [] }).write();

  const items = await processItems(config.price.startParent);
  console.log('items: ', items);
  fs.writeFileSync(config.price.jsonPath, JSON.stringify(items, null, '  '));
  console.log(`Saved to ${config.price.jsonPath}`);
};

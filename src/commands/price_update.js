const api = require('../api');
const config = require('../../.config');

const customFields = config.price.customFields;
const dryRun = false;

let updatedCount = 0;

// значение поля по его id
function getItemField(item, fieldId) {
  const fields = item.customData.customValue;
  const field = fields.find((f) => f.field.id == fieldId);
  const value = field.value;
  return value;
}

// рекурсивный обход дерева справочника
async function processItems(parentKey, level = 0) {
  let allItems = [];
  let pageCurrent = 1;
  // console.log('parentKey: ', parentKey);

  let isEnd = false;
  while (!isEnd) {
    const requestOpts = {
      handbook: { id: config.price.handbookId },
      parentKey: parentKey,
      pageSize: 100,
      pageCurrent: pageCurrent,
    };

    const result = await api.request('handbook.getRecords', requestOpts);
    let items = result.records.record;
    if (!items) items = []; // вместо пустого результата result.records выдаёт пустую строку
    if (!Array.isArray(items)) items = [items]; // если 1 результат, то его отдают в виде объекта вместо массива

    if (items.length < 100) isEnd = true;
    if (!isEnd) console.log('items.length: ', items.length);

    allItems = [...allItems, ...items];
    pageCurrent++;
  }

  for (let item of allItems) {
    // Группа
    if (item.isGroup === '1') {
      console.log(' ' + repeat(level * 2) + item.name);
      item.children = await processItems(item.key, level + 1);
    }

    // Запись справочника
    if (item.isGroup === '0') {
      await processItem(item, level);
    }
  }

  return allItems;
}

// действия с записью справочника (не группы)
async function processItem(item, level) {
  const name = getItemField(item, customFields.name);
  const price = getItemField(item, customFields.price);
  const priceOld = getItemField(item, customFields.priceOld);
  const isUpdated = !!priceOld;

  // const public = getItemField(item, customFields.public);
  // const used = getItemField(item, customFields.used);
  // const checked = getItemField(item, customFields.checked);

  // вернуть как было
  if(config.price.revert) {
    if (priceOld && price != priceOld) {
      if (!dryRun) {
        await updateItem(item, {
          [customFields.priceOld]: '',
          [customFields.price]: priceOld
        });

        const prefix = ' '.repeat(level * 2) + '- ';
        const url = api.getHandbookUrl(config.price.handbookId, item.key);
        console.log(`${prefix}${price} -> ${priceOld} ${name} - ${url}`);

        updatedCount++;
      }
    }
  }

  // обновить цену, если не заполнена Цена до повышения
  else if (!priceOld) {

    // увеличиваем цену
    let priceNew = Math.round(price * config.price.increaseRatio);

    // округляем до config.price.round в большую сторону
    if (priceNew % config.price.round > 0) {
      priceNew = Math.ceil(priceNew / config.price.round) * config.price.round;
    }

    // обновить услугу
    if (!dryRun) {
      await updateItem(item, {
        [customFields.priceOld]: price,
        [customFields.price]: priceNew
      });

      if (!isUpdated) {
        const prefix = ' '.repeat(level * 2) + '- ';
        const url = api.getHandbookUrl(config.price.handbookId, item.key);
        console.log(`${prefix}${price} -> ${priceNew} ${name} - ${url}`);
        updatedCount++;
      }
    }
  }
}

async function updateItem(item, fields) {
  const opts = {
    handbook: { id: config.price.handbookId },
    key: item.key,
    parentKey: item.parentKey,
    customData: api.buildCustomData(fields)
  };
  return await api.request('handbook.updateRecord', opts);
}

module.exports = async (opts) => {
  const items = await processItems(config.price.startParent);
  console.log('updatedCount: ', updatedCount);
  console.log('items: ', items);
};

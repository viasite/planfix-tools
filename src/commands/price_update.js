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
    if (item.isGroup === '1') {
      console.log(' '.repeat(level * 2) + item.name);
      item.children = await processItems(item.key, level + 1);
    }

    if (item.isGroup === '0') {
      const name = getItemField(item, customFields.name);
      const price = getItemField(item, customFields.price);
      const priceOld = getItemField(item, customFields.priceOld);
      const isUpdated = !!priceOld;

      // const public = getItemField(item, customFields.public);
      // const used = getItemField(item, customFields.used);
      // const checked = getItemField(item, customFields.checked);

      // увеличиваем цену
      let priceNew = Math.round(price * config.price.increaseRatio);

      // округляем до config.price.round в большую сторону
      if (priceNew % config.price.round > 0) {
        priceNew = Math.ceil(priceNew / config.price.round) * config.price.round;
      }

      // вернуть как было
      if(config.price.revert) {
        if (priceOld && price != priceOld) {
          if (!dryRun) {
            const opts = {
              handbook: { id: config.price.handbookId },
              key: item.key,
              parentKey: item.parentKey,
              customData: {
                customValue: [
                  {
                    id: customFields.priceOld,
                    value: '',
                  },
                  {
                    id: customFields.price,
                    value: priceOld,
                  },
                ]
              }
            };
            const result = await api.request('handbook.updateRecord', opts);

            const prefix = ' '.repeat(level * 2) + '- ';
            const url = api.getHandbookUrl(config.price.handbookId, item.key);
            console.log(`${prefix}${price} -> ${priceOld} ${name} - ${url}`);

            updatedCount++;
          }
        }
      }

      else if (!priceOld) {
        // обновить услугу
        if (!dryRun) {
          const opts = {
            handbook: { id: config.price.handbookId },
            key: item.key,
            parentKey: item.parentKey,
            customData: {
              customValue: [
                {
                  id: customFields.priceOld,
                  value: price,
                },
                {
                  id: customFields.price,
                  value: priceNew,
                },
              ]
            }
          };
          const result = await api.request('handbook.updateRecord', opts);

          if (!isUpdated) {
            const prefix = ' '.repeat(level * 2) + '- ';
            const url = api.getHandbookUrl(config.price.handbookId, item.key);
            console.log(`${prefix}${price} -> ${priceNew} ${name} - ${url}`);
            updatedCount++;
          }
        }
      }
    }
  }

  return allItems;
}

module.exports = async (opts) => {
  const items = await processItems(config.price.startParent);
  console.log('updatedCount: ', updatedCount);
  console.log('items: ', items);
};

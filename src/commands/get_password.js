const fs = require('fs');
const api = require('../apiNew');
const config = require('../../.config.js');

module.exports = async (options) => {
  const handbookId = config.password.handbookId;
  const parentKey = config.password.parentKey;
  const cacheFile = 'data/passwords.json';

  api.config = config;

  // if (!options.domain) {
  //   console.error('You must define domain: --domain site.ru');
  //   process.exit(1);
  // }

  async function getPasswords() {
    if (fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile));
    }

    const opts = {
      handbook: {
        id: handbookId,
      },
      parentKey: parentKey,
    };
    const result = await api.requestAll('handbook.getRecords', opts);
    console.log('result: ', result);

    const passwords = result.records.record;

    fs.writeFileSync(cacheFile, JSON.stringify(passwords));

    return passwords;
  }

  const passwords = await getPasswords();

  const items = passwords.map(p => {
    const item = { key: p.key };
    for (let field of p.customData.customValue) {
      const name = config.password.fields[field.field.id];
      item[name] = field.value;
    }
    return item;
  });

  if (options.domain) {
    const found = items.find(item => {
      const reg = new RegExp(`^${options.domain} - (.*)`, 'i');
      const match = reg.exec(item.title);
      if (!match) return;
      if (match[0].match(/(DNS|Яндекс)/i)) return;
      return true;
    })

    if (found) console.log(api.getHandbookUrl(handbookId, found.key));
  }

  // const tasksCount = result.tasks.$.totalCount;
  // console.log(tasksCount);
};

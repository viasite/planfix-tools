const api = require('../api');
const config = require('../../.config');
const parse = require('csv-parse');
const fs = require('fs');

const customFields = {
  value: 105,
  position: 107,
  totalPercent: 109,
};
const csvSkipLines = 3; // надо убрать заголовок, иначе будет ошибка
const fieldsMap = {
  contactName: {
    name: 'Имя',
    num: 0,
  },
  contactId: {
    name: 'Номер',
  },
  value: {
    name: 'Выручка',
  },
};

async function updateContactFields(contact) {
  const requestFields = {};
  for (let name in customFields) {
    requestFields[name] = {
      id: customFields[name],
      value: contact[name],
    };
  }

  const result = await api.request('contact.updateCustomData', {
    contact: {
      general: contact.id,
      customData: requestFields,
    },
  });
  console.log(`${api.getContactUrl(contact.id)}: `, contact);
}

async function parseContacts(rows) {
  let items = [];

  let position = 1;

  for (let row of rows) {
    const contact = {
      id: parseInt(row[fieldsMap.contactId.num]),
      name: row[fieldsMap.contactName.num].trim(),
      value: row[fieldsMap.value.num]
    }
    contact.value = parseInt(contact.value.replace(/ /g, ''));
    if (!contact.id || !contact.value) continue;

    // получение поля Сайт из контакта
    const pfContact = await api.request('contact.get', {
      contact: { general: contact.id },
    });
    console.log(contact.id);
    console.log(pfContact.contact.name);
    const siteField = pfContact.contact.customData.customValue.find(f => f.field.id == config.siteFieldId);
    if (siteField) {
      contact.site = siteField.value;
    }

    let item = {...contact, ...{
      position: position,
      totalPercent: 0,
    }};
    items.push(item);

    position++;
  }

  // считаем totalValue
  const total = items.length;
  let totalValue = 0;
  items.map((item) => {
    totalValue += item.value;
  });

  // считаем position and totalPercent
  items = items.map((item) => {
    item.position = `${item.position} / ${total}`;
    item.totalPercent = Math.round((item.value / totalValue) * 100);
    return item;
  });

  // console.log('items: ', items);
  return items;
}

module.exports = async (opts) => {
  // const result = await api.request('contact.getList', { target: 'company' });

  const raw = fs.readFileSync(opts.csv, 'utf-8');
  const lines = raw.split('\r\n').slice(csvSkipLines);
  parse(lines.join('\r\n'), { delimiter: ';' }, async (err, rows) => {
    // console.log('rows: ', rows);
    if (err) {
      console.error('CSV не распозналась:');
      console.error(err);
      return;
    }

    // ищем номера колонок
    const h = rows[0];
    fieldsMap.contactId.num = h.findIndex((f) => f == fieldsMap.contactId.name);
    fieldsMap.value.num = h.findIndex((f) => f == fieldsMap.value.name);

    if (!fieldsMap.contactId.num || !fieldsMap.value.num) {
      console.error(
        `Таблица не содержит поля: ${fieldsMap.contactId.name}, ${fieldsMap.value.name}`
      );
      return;
    }

    const contacts = await parseContacts(rows);

    // save to json
    fs.writeFileSync('data/contacts.json', JSON.stringify(contacts));

    // send to planfix
    for (let contact of contacts) {
      await updateContactFields(contact);
    }
  });
};

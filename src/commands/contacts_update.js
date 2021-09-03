const api = require('../api');
const config = require('../../.config');
const csvParse = require('csv-parse');
const fs = require('fs');

// id полей Планфикса, из шаблона компании - https://tagilcity.planfix.ru/contact/4504
const customFields = {
  value200: 105, // Поступления за 200 дней
  value30: 133, // Поступления за 30 дней
  value100: 135, // Поступления за 100 дней
  value365: 137, // Поступления за 365 дней
  position: 107, // Рейтинг
  totalPercent: 109, // Сколько процентов от общего приносит
};

const csvSkipLines = 3; // надо убрать заголовок в csv, иначе будет ошибка

// колонки в csv, если указан номер (столбца), используется он, иначе вычисляется по названию колонки
const fieldsMap = {
  contactName: {
    name: 'Имя',
    num: 0,
  },
  contactId: {
    name: 'Номер',
  },
  value200: {
    name: 'Выручка200',
  },
  value30: {
    name: 'Выручка30',
  },
  value100: {
    name: 'Выручка100',
  },
  value365: {
    name: 'Выручка365',
  },
};

// принимает ряды из csv, возвращает контакты
async function parseContacts(rows, reset = false) {
  let items = [];

  let position = 1;

  for (let row of rows) {
    const contact = {
      id: parseInt(row[fieldsMap.contactId.num]),
      name: row[fieldsMap.contactName.num].trim(),
      value200: row[fieldsMap.value200.num],
      value30: row[fieldsMap.value30.num],
      value100: row[fieldsMap.value100.num],
      value365: row[fieldsMap.value365.num],
    }
    if (contact.value200) contact.value200 = parseInt(contact.value200.replace(/ /g, ''));
    if (contact.value30) contact.value30 = parseInt(contact.value30.replace(/ /g, ''));
    if (contact.value100) contact.value100 = parseInt(contact.value100.replace(/ /g, ''));
    if (contact.value365) contact.value365 = parseInt(contact.value365.replace(/ /g, ''));
    if (!contact.id || !(contact.value200 || contact.value30 || contact.value100 || contact.value365)) continue;

    // сбрасываем цены, если указан --reset
    // это нужно, потому что если, например, за последние 30 дней не было поступлений, то останется цифра с прошлого запуска
    if (reset) {
      contact.value30 = 0;
      contact.value100 = 0;
      contact.value200 = 0;
      contact.value365 = 0;
    }

    // получение поля Сайт из контакта
    const pfContact = await api.request('contact.get', {
      contact: {
        general: contact.id
      },
    });
    console.log(contact.id);
    console.log(pfContact.contact.name);
    const siteField = pfContact.contact.customData.customValue.find(f => f.field.id == config.siteFieldId);
    if (siteField) {
      contact.site = siteField.value;
    }

    let item = {
      ...contact,
      ...{
        position: position,
        totalPercent: 0,
      }
    };
    items.push(item);

    position++;
  }

  // считаем totalValue
  const total = items.length;
  let totalValue = 0;
  items.map((item) => {
    totalValue += item.value365;
  });
  // считаем position and totalPercent
  if (totalValue) {
    items = items.map((item) => {
      item.position = `${item.position} / ${total}`;
      item.totalPercent = Math.round((item.value365 / totalValue) * 100);
      return item;
    });
  }
  // console.log('items: ', items);

  return items;
}

// отправляет в ПФ новые значения полей контакта
async function updateContactFields(contact) {
  const requestFields = {};
  for (let name in customFields) {
    if (contact[name] == null || contact[name] == undefined) continue;
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
  // console.log(`${api.getContactUrl(contact.id)}: `, contact);
}

// главная функция
module.exports = async (opts) => {
  // const result = await api.request('contact.getList', { target: 'company' });

  const raw = fs.readFileSync(opts.csv, 'utf-8'); // передаётся через ком. строку: --csv data/contragents-values.csv
  const lines = raw.split('\r\n').slice(csvSkipLines); // убирает шапку
  csvParse(lines.join('\r\n'), {
    delimiter: ';'
  }, async (err, rows) => {
    // console.log('rows: ', rows);
    if (err) {
      console.error('CSV не распозналась:');
      console.error(err);
      return;
    }

    // ищем номера колонок
    const h = rows[0];
    fieldsMap.contactId.num = h.findIndex((f) => f == fieldsMap.contactId.name);
    fieldsMap.value200.num = h.findIndex((f) => f == fieldsMap.value200.name);
    fieldsMap.value30.num = h.findIndex((f) => f == fieldsMap.value30.name);
    fieldsMap.value100.num = h.findIndex((f) => f == fieldsMap.value100.name);
    fieldsMap.value365.num = h.findIndex((f) => f == fieldsMap.value365.name);

    // не найдены обязательные поля из fieldsMap
    if (!fieldsMap.contactId.num || !(fieldsMap.value200.num || fieldsMap.value30.num || fieldsMap.value100.num || fieldsMap.value365.num)) {
      // if (!fieldsMap.contactId.num) {
      console.error(
        `Таблица не содержит поля: ${fieldsMap.contactId.name}, ${fieldsMap.value200.name}`
      );
      return;
    }

    const contacts = await parseContacts(rows, opts.reset);

    // файл нужен для таблицы сайтов, чтобы в нём выводились данные соответствующих компаний
    fs.writeFileSync('data/contacts.json', JSON.stringify(contacts));

    // send to planfix
    for (let contact of contacts) {
      await updateContactFields(contact);
    }
  });
};
const api = require('../api');
const parse = require('csv-parse');
const fs = require('fs');

customFieldId = 105;

async function updateContactValue(id, value) {
  const result = await api.request('contact.updateCustomData', { contact: {
    general: id,
    customData: {
      customValue: {
        id: customFieldId,
        value: value
      }
    }
  }});
  console.log('result: ', result);
}

module.exports = async (opts) => {
  const fieldsMap = {
    contactId: {
      name: 'Номер',
    },
    value: {
      name: 'Выручка',
    }
  };

  // const result = await api.request('contact.getList', { target: 'company' });

  const raw = fs.readFileSync(opts.csv, 'utf-8');
  parse(raw, { delimiter: ';' }, async (err, rows) => {
    const h = rows[0];

    fieldsMap.contactId.num = h.findIndex(f => f == fieldsMap.contactId.name);
    fieldsMap.value.num = h.findIndex(f => f == fieldsMap.value.name);

    for (let row of rows) {
      const contactId = row[fieldsMap.contactId.num];
      let value = row[fieldsMap.value.num];
      value = parseInt(value.replace(/ /g, ''));
      if(!contactId || !value) continue;
      console.log(`${contactId}: ${value} `);
      await updateContactValue(contactId, value);
      // break;
    }

    console.log('rows: ', rows);
  });
};

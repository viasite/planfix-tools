const api = require('../apiNew');
const mqttInit = require('../mqtt');
const config = require('../../.config');

const whenMap = {
  'на сегодня': 1,
  'на неделю': 2,
  'на потом': 3,
  'в идеи': 4,
};
const WhenFieldId = 1720;
const templateId = 98932;
const intervalSecs = 600;

let mqtt;

async function getData() {
  const data = {
    active: 0,
    total: 0,
  }

  const request = {
    filter: 'ACTIVE', //
    filters: [ {
      filter : {
        type: 51,
        operator: 'equal',
        value: templateId,
      }
    } ]
    /* customValue: {
          id: 1720,
          value: whenMap[task.when]
        }
      } */
  };
  const res = await api.request('task.getList', request);
  data.active = res.tasks.$.totalCount;

  delete(request.filter);
  const resTotal = await api.request('task.getList', request);
  data.total = resTotal.tasks.$.totalCount;

  return data;
}

async function send() {
  const data = await getData();
  mqtt.publish(`planfix/tasks/active`, data.active)
  mqtt.publish(`planfix/tasks/total`, data.total)
}

module.exports = async (opts) => {
  mqtt = mqttInit();
  await send();
  setTimeout(() => {
    process.exit(0);
  }, 5000);
  // setInterval(send, intervalSecs * 1000);
};

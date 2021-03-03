const api = require('../apiNew');
const mqttInit = require('../mqtt');
const config = require('../../.config');

const statusMap = {
  'в работе': 2,
  'выполненная': 6,
  'завершенная': 3,
  'новая': 1,
  'отклоненная': 5,
  'отложенная': 4,
  'отмененная': 7,
};
const whenMap = {
  'на сегодня': 1,
  'на неделю': 2,
  'на потом': 3,
  'в идеи': 4,
};

const WhenFieldId = 1720;
const templateId = 98932; // шаблон Trello, не используется
const intervalSecs = 600;

let mqtt;

async function getData() {
  const data = {
    active: 0,
    total: 0,
    closed: 0,
  }

  const whenFilter = whenName => {
    /* customValue: {
        id: WhenFieldId,
        value: whenMap[task.when]
      }
    } */
    return {
      filter : {
        type: 10, // статус
        operator: 'equal',
        value: whenMap[whenName],
      }
    };
  };

  const defaultFilter = {};
  /* const defaultFilter = {
    filter : {
      type: 51,
      operator: 'equal',
      value: templateId,
    }
  }; */

  let res;

  const request = {
    filter: 'ACTIVE',
    filters: [ defaultFilter ],
  };
  res = await api.requestAll('task.getList', request);
  data.active = res.tasks.$.totalCount;

  let taskDays = 0;
  for (let task of res.tasks.task) {
    const d = task.beginDateTime.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (!d) continue;
    const day = parseInt(d[1]),
          month = parseInt(d[2]),
          year = parseInt(d[3]);
    const taskDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const delta = (Date.now() - taskDate) / 1000;
    const days = Math.floor(delta / 86400);
    taskDays += days;
  }

  // задаче-дни всех активных задач
  mqtt.publish('planfix/tasks/task-days', `${taskDays}`);

  delete(request.filter);
  res = await api.request('task.getList', request);
  data.total = res.tasks.$.totalCount;

  request.status = statusMap['завершенная'];
  res = await api.request('task.getList', request);
  data.closed = res.tasks.$.totalCount;

  return data;
}

async function send() {
  const data = await getData();
  // console.log('data: ', data);
  for (let name in data) {
    mqtt.publish(`planfix/tasks/${name}`, data[name]);
  }
}

module.exports = async (opts) => {
  mqtt = mqttInit();
  await send();
  setTimeout(() => {
    process.exit(0);
  }, 5000);
  // setInterval(send, intervalSecs * 1000);
};

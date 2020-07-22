const api = require('./api');

async function init() {
  await showTasksCount()
}

async function showTasksCount() {
  const result = await api.request('task.getList', { filter: 'ACTIVE', pageCurrent: 0 });
  const tasksCount = result.tasks.$.totalCount;
  console.log(tasksCount);
};

init();

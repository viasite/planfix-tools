const api = require('../api');

module.exports = async (options) => {
  const opts = { filter: 'ACTIVE', pageCurrent: 0 };
  if (options.user) {
    opts.filters = [
      {
        filter: {
          type: 2, // исполнитель
          operator: 'equal',
          value: parseInt(options.user)
        }
      }
    ]
  }
  const result = await api.request('task.getList', opts);
  const tasksCount = result.tasks.$.totalCount;
  console.log(tasksCount);
};

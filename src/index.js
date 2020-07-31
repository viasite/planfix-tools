#!/usr/bin/env node
const program = require('commander');
const api = require('./api');
const commands = require('./commands');
const packageJson = require('../package.json');

program.name('planfix-tools').version(packageJson.version).usage('--help');

program
  .command('tasks-count')
  .description('show active tasks count')
  .option('--user <id>', '')
  .action(async (options) => {
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
  });

program
  .command('contacts-update')
  .description('update contacts from csv')
  .option('--csv <path>', '')
  .action(async (options) => {
    await commands.contacts_update(options);
  });

program.parse(process.argv);

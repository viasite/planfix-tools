#!/usr/bin/env node
const program = require('commander');
const api = require('./api');
const commands = require('./commands');
const packageJson = require('../package.json');

program.name('planfix-tools').version(packageJson.version).usage('--help');

program
  .command('tasks-count')
  .description('show active tasks count')
  .action(async (options) => {
    const result = await api.request('task.getList', { filter: 'ACTIVE', pageCurrent: 0 });
    const tasksCount = result.tasks.$.totalCount;
    console.log(tasksCount);
  });

program
  .command('contacts-update')
  .option('--csv <path>', ``)
  .description('update contacts from csv')
  .action(async (options) => {
    await commands.contacts_update(options);
  });

program.parse(process.argv);

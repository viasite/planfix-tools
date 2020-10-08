#!/usr/bin/env node
const program = require('commander');
const commands = require('./commands');
const packageJson = require('../package.json');

program.name('planfix-tools').version(packageJson.version).usage('--help');

program
  .command('tasks-count')
  .description('show active tasks count')
  .option('--user <id>', '')
  .action(commands.tasks_count);

program
  .command('contacts-update')
  .description('update contacts from csv')
  .option('--csv <path>', '')
  .action(async (options) => {
    await commands.contacts_update(options);
  });

program
  .command('mqtt-send')
  .description('send metrics to mqtt')
  // .option('-- <path>', '')
  .action(async (options) => {
    await commands.mqtt_send(options);
  });

program.parse(process.argv);

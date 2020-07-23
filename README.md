## Использование
1. Скопировать `.config.example.js` в `.config.js`
2. Запустить примерно так: `npm start -- tasks-count`.

## Команды

### tasks-count
Тестовая команда, проверить, работает ли API, выводит количество активных задач.

### contacts-update
Подробности - https://tagilcity.planfix.ru/task/607985/?comment=7492257

## Для тех, кто не работает в Viasite
Этот проект может быть полезен как пример использования API Планфикса на nodejs.

Проект использует наработки [boo1ean/planfix-api](https://github.com/boo1ean/planfix-api) и [popstas/planfix-go](https://github.com/popstas/planfix-go).

Я не стал выделять api в отдельный модуль, но вы можете взять [src/api.js](src/api.js) в свой проект.

#### Отличия от https://github.com/boo1ean/planfix-api
- Обработка кодов ошибок от API
- Методы не хардкодятся, вы можете использовать любые методы
- Авторизация проходит прозрачно, вы просто подключаете `api.js` и используете
- Из запросов убраны сигнатуры, т.к. они усложняли реализацию
- Код 2020 года (без лишних модулей, для работы api требуются `axios`, `xml2js`)

#### Пример использования
Код выдаст список активных задач в консоль
``` js
const api = require('./api');

async function start() {
  const result = await api.request('task.getList', { filter: 'ACTIVE', pageCurrent: 0 });
  const tasksCount = result.tasks.$.totalCount;
  console.log(tasksCount);
}

start();
```

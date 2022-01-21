const axios = require('axios');
const xml2js = require('xml2js');
const config = require('../.config-home.js');

const errorCodes = {
  // Без классификации
  '0001': 'Неверный API Key',
  '0002': 'Приложение заблокировано',
  '0003': 'Ошибка XML разбора. Некорректный XML',
  '0004': 'Неизвестный аккаунт',
  '0005': 'Ключ сессии недействителен (время жизни сессии истекло)',
  '0006': 'Неверная подпись',
  '0007':
    'Превышен лимит использования ресурсов (ограничения, связанные с лицензиями или с количеством запросов)',
  '0008': 'Неизвестное имя функции',
  '0009': 'Отсутствует один из обязательных параметров функции',
  '0010': 'Аккаунт заморожен',
  '0011': 'На площадке аккаунта производится обновление программного обеспечения',
  '0012': 'Отсутствует сессия, не передан параметр сессии в запрос',
  '0013': 'Неопределенный пользователь',
  '0014': 'Пользователь неактивен',
  '0015': 'Недопустимое значение параметра',
  '0016': 'В данном контексте параметр не может принимать переданное значение',
  '0017': 'Отсутствует значение для зависящего параметра',
  '0018': 'Функции/функционал не реализована',
  '0019': 'Заданы конфликтующие между собой параметры',
  '0020': 'Вызов функции запрещен',
  '0021': 'Запрошенное количество объектов больше максимально разрешенного для данной функции',
  '0022': 'Использование API недоступно для бесплатного аккаунта',
  '0023': 'Запрошенное действие невозможно в рамках текущего тарифного плана аккаунта',
  '0024': 'Аккаунт расположен в другом датацентре, проверьте url запроса',
  '1001': 'Неверный логин или пароль',
  '1002': 'На выполнение данного запроса отсутствуют права (привилегии)',
  // Проект
  '2001': 'Запрошенный проект не существует',
  '2002': 'На выполнение данного запроса отсутствуют права (привилегии)',
  '2003': 'Ошибка добавления проекта',
  // Задача
  '3001': 'Указанная задача не существует',
  '3002': 'Нет доступа к над задаче',
  '3003': 'Проект, в рамках которого создается задача, не существует',
  '3004': 'Проект, в рамках которого создается задача, не доступен',
  '3005': 'Ошибка добавления задачи',
  '3006': 'Время "Приступить к работе" не может быть больше времени "Закончить работу до"',
  '3007':
    'Неопределенная периодичность, скорее всего задано несколько узлов, которые конфликтуют друг с другом или не указан ни один',
  '3008': 'Нет доступа к задаче',
  '3009': 'Нет доступа на изменение данных задачи',
  '3010': 'Данную задачу отклонить нельзя (скорее всего, она уже принята этим пользователем)',
  '3011': 'Данную задачу принять нельзя (скорее всего, она уже принята этим пользователем)',
  '3012': 'Пользователь, выполняющий запрос, не является исполнителем задачи',
  '3013': 'Задача не принята (для выполнения данной функции задача должна быть принята)',
  // Действие
  '4001': 'На выполнение данного запроса отсутствуют права (привилегии)',
  '4002': 'Действие не существует',
  '4003': 'Ошибка добавления действия',
  '4004': 'Ошибка обновления данных',
  '4005': 'Ошибка обновления данных',
  '4006': 'Попытка изменить статус на недозволенный',
  '4007': 'В данном действии запрещено менять статус',
  '4008': 'Доступ к комментария/действию отсутствует',
  '4009': 'Доступ к задаче отсутствует',
  '4010': 'Указанная аналитика не существует',
  '4011': 'Для аналитики были переданы не все поля',
  '4012': 'Указан несуществующий параметр для аналитики',
  '4013': 'Переданные данные не соответствуют типу поля',
  '4014': 'Указанный ключ справочника нельзя использовать',
  '4015': 'Указанный ключ справочника не существует',
  '4016': 'Указанный ключ данных поля не принадлежит указанной аналитике',
  // Группа пользователей
  '5001': 'Указанная группа пользователей не существует',
  '5002': 'На выполнение данного запроса отсутствуют права (привилегии)',
  '5003': 'Ошибка добавления',
  // Сотрудники
  '6001': 'На выполнение данного запроса отсутствуют права (привилегии)',
  '6002': 'Данный e-mail уже используется',
  '6003': 'Ошибка добавления сотрудника',
  '6004': 'Пользователь не существует',
  '6005': 'Ошибка обновления данных',
  '6006': 'Указан идентификатор несуществующей группы пользователей',
  // Контрагенты
  '7001': 'На выполнение данного запроса отсутствуют права (привилегии)',
  '7002': 'Клиент не существует',
  '7003': 'Ошибка добавления клиента',
  '7004': 'Ошибка обновления данных',
  // Контакты
  '8001': 'На выполнение данного запроса отсутствуют права (привилегии)',
  '8002': 'Контакт не существует',
  '8003': 'Ошибка добавления контакта',
  '8004': 'Ошибка обновления данных',
  '8005': 'Контакт не активировал доступ в ПланФикс',
  '8006': 'Контакту не предоставлен доступ в ПланФикс',
  '8007': 'E-mail, указанный для логина, не уникален',
  '8008': 'Попытка установки пароля для контакта, не активировавшего доступ в ПланФикс',
  '8009': 'Ошибка обновления данных для входа в систему',
  // Файл
  '9001': 'На выполнение данного запроса отсутствуют права (привилегии)',
  '9002': 'Запрашиваемый файл не существует',
  '9003': 'Ошибка загрузки файла',
  '9004': 'Попытка загрузить пустой список файлов',
  '9005': 'Недопустимый символ в имени файла',
  '9006': 'Имя файла не уникально',
  '9007': 'Ошибка файловой системы',
  '9008': 'Ошибка возникает при попытке добавить файл из проекта для проекта',
  '9009': 'Файл, который пытаются добавить к задаче, является файлом другого проекта',
  // Аналитика
  '10001': 'На выполнение данного запроса отсутствуют права (привилегии)',
  '10002': 'Аналитика не существует',
  '10003': 'Переданный параметр группы аналитики не существует',
  '10004': 'Переданный параметр справочника аналитики не существует',
  // Stream API
  '11001': 'Указанной подписки не существует',
};

module.exports = {
  sid: null,
  config: config.planfix,
  async init() {
    /* this.client = new Planfix({
      privateKey: config.private_key,
      apiKey: config.api_key,
    }); */
  },

  async ensureAuthenticated() {
    if (!this.sid) {
      const result = await this.request('auth.login', {
        login: this.config.user_login,
        password: this.config.user_password,
      });

      this.sid = result.sid;
    }
    return !!this.sid;
  },

  checkAnswer(result) {
    if (!result) throw new Error(result);

    if (result.code) {
      const msg =
        result.code + ': ' + errorCodes[result.code] || `Неизвестная ошибка, код ${result.code}`;
      console.error(msg);
      return false;
    }
    return true;
  },

  async requestAll(method, opts) {
    if (method.match(/^handbook/)) return await this.requestAllHandbook(method, opts);

    let tasks = [];
    let res;
    for (let pageNum = 1; pageNum < 20; pageNum++) {
      opts.pageSize = 100;
      opts.pageCurrent = pageNum;
      res = await this.request(method, opts);

      // если приходит 1 результат, то тут объект вместо массива
      if (!res.tasks.task.length) {
        if (res.tasks.task) {
          tasks.push(res.tasks.task);
        }
        break;
      }
      
      tasks = [...tasks, ...res.tasks.task];
      const total = res.tasks.$.totalCount;
      if (total / opts.pageSize < pageNum) break;
    }

    res.tasks.task = tasks;
    return res;
  },

  async requestAllHandbook(method, opts) {
    let items = [];
    let res;
    for (let pageNum = 1; pageNum < 20; pageNum++) {
      opts.pageSize = 100;
      opts.pageCurrent = pageNum;
      res = await this.request(method, opts);
      if (!res.records || !res.records.record.length) break;
      
      items = [...items, ...res.records.record];
      // const total = res.items.$.totalCount;
      // if (total / opts.pageSize < pageNum) break;
    }

    res.records =  { record: items };
    return res;
  },

  async request(method, opts) {
    if (method != 'auth.login') {
      if (!(await this.ensureAuthenticated())) {
        return false;
      }
    }

    /* // from planfix-go
    for try := 0; try < 2; try++ {
      status, data, err = a.tryRequest(requestStruct)
      if err != nil {
        return err
      }
  
      if status.Status == "ok" {
        break
      } else {
        if status.Code == "0005" { // session expired
          a.Logger.Println("[INFO] session expired, relogin")
          a.Sid = ""
          if err := a.ensureAuthenticated(); err != nil {
            return err
          }
          requestStruct.SetSid(a.Sid)
        } else {
          return fmt.Errorf(
            "%s: response status: %s, %s, %s",
            requestStruct.GetMethod(),
            status.Status,
            a.getErrorByCode(status.Code),
            status.Message,
          )
        }
      }
    } */

    var requestObject = {
      ...{
        $: { method: method },
        account: this.config.account,
      },
      ...opts,
    };

    if (this.sid) requestObject.sid = this.sid;

    const builder = new xml2js.Builder();
    const xmlRequest = builder.buildObject(
      { request: requestObject },
      { xmldec: { standalone: false } }
    );

    // console.log('xmlRequest:  ', xmlRequest);

    const answer = await axios.request({
      url: this.config.api_url,
      method: 'post',
      data: xmlRequest,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'User-Agent': 'planfix-js-client',
      },
      responseType: 'text',
      auth: {
        username: this.config.api_key,
        password: 'x', // ignored by server
      },
    });

    const result = await xml2js.parseStringPromise(answer.data, {
      trim: true,
      explicitRoot: false,
      explicitArray: false,
    });
    // console.log('result: ', result);

    if (!this.checkAnswer(result)) {
      console.error('Ошибка при выполнении запроса');
    }

    return result;
  },

  getTaskUrl(generalId) {
    return `https://${this.config.account}.planfix.ru/task/${generalId}`;
  },

  getContactUrl(generalId) {
    return `https://${this.config.account}.planfix.ru/contact/${generalId}`;
  },

  getHandbookUrl(handbookId, parentKey) {
    return `https://${this.config.account}.planfix.ru/?action=handbookdataview&handbook=${handbookId}&key=${parentKey}`;
  },
};

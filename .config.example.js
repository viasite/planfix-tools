module.exports = {
  api_url: 'https://api.planfix.ru/xml/',
  account: '',
  api_key: '',
  user_login: '',
  user_password: '',
  siteFieldId: 38, // id поля Сайт в контактах (у нас оно кастомное)

  price: {
    startParent: 0, // с какой записи начинать обход
    revert: false, // вернёт старую цену, если она не равна новой и не пустая
    updatePublic: false, // обработка "Показывать клиентам"

    cacheTime: 86400,
    forceUpdateParents: [], // id разделов, которые не кешируются
    jsonPath: 'data/price.json',

    increaseRatio: 1100 / 1000, // стало / было
    round: 100, // округлять до 100 руб в большую сторону

    handbookId: 123,
    customFields: {
      name: 1,
      sku: 9,
      price: 2,
      priceOld: 3,

      nameShort: 7,
      descrtiptionShort: 8,

      // flags
      checked: 4, // Проверено
      public: 5, // Показывать клиентам
      used: 6, // Использовалось в 2020
    },
  }
}

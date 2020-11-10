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
    updatePublic: true, // обработка "Показывать клиентам"

    increaseRatio: 1100 / 1000, // стало / было
    round: 100, // округлять до 100 руб в большую сторону

    handbookId: 123,
    customFields: {
      name: 1,
      price: 2,
      priceOld: 3,
    
      // flags
      checked: 4, // Проверено
      public: 5, // Показывать клиентам
      used: 6, // Использовалось в 2020
    },
  }
}

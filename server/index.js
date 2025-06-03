const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Кэш для хранения контекста диалога
const dialogContext = new Map();

app.post("/api/chat", (req, res) => {
  const userId = req.ip; // Используем IP как идентификатор пользователя
  const userMessage = req.body.message.toLowerCase();

  // Получаем или инициализируем контекст диалога
  if (!dialogContext.has(userId)) {
    dialogContext.set(userId, {
      lastQuestions: [],
      context: {}
    });
  }

  const userContext = dialogContext.get(userId);
  const reply = getBotReply(userMessage, userContext);
  
  // Обновляем контекст
  userContext.lastQuestions.unshift(userMessage);
  if (userContext.lastQuestions.length > 3) {
    userContext.lastQuestions.pop();
  }

  // Добавляем быстрые ответы, если это уместно
  let quickReplies = null;
  if (/заказ|оплат|доставк/i.test(userMessage)) {
    quickReplies = ["Статус заказа", "Способы оплаты", "Сроки доставки"];
  } else if (/контакт|связаться/i.test(userMessage)) {
    quickReplies = ["Телефон", "WhatsApp", "Email"];
  }

  res.json({ 
    reply,
    quickReplies 
  });
});

function getBotReply(message, context) {
  // Проверяем, является ли сообщение продолжением предыдущего вопроса
  const lastQuestion = context.lastQuestions[0] || '';
  
  if (/доставк[аиу]|сколько.*длится|время.*доставк|когда.*получу/i.test(message)) {
    return "Доставка осуществляется в течение 3-5 рабочих дней по всей России. Экспресс-доставка доступна за дополнительную плату.";
  }

  if (/оплат[аыу]|способ.*оплат|картой|наличными|счет/i.test(message)) {
    return "Мы принимаем оплату: картой на сайте, по счету для юридических лиц, наличными при получении и через системы электронных платежей.";
  }

  if (/гаранти[яию]|гарантийн|ремонт по гарантии/i.test(message)) {
    return "Гарантия на все запчасти — 6 месяцев. Для активации гарантии сохраняйте чек и упаковку.";
  }

  if (/возврат|вернуть.*товар|условия.*возврат|обмен/i.test(message)) {
    return "Вы можете вернуть товар в течение 14 дней при сохранении упаковки и товарного вида. Возврат возможен в нашем магазине или через маркетплейс.";
  }

  if (/заказ|оформить.*заказ|как.*купить|покупк/i.test(message)) {
    return "Чтобы оформить заказ:\n1. Выберите товар\n2. Добавьте в корзину\n3. Перейдите в оформление заказа\n4. Укажите данные для доставки\n5. Оплатите заказ";
  }

  if (/запчаст|подбор|совместим|диаметр|размер/i.test(message)) {
    return "Для подбора запчастей:\n1. Укажите модель и год выпуска скутера\n2. Проверьте совместимость в описании товара\n3. Если нужна помощь - напишите нам в WhatsApp или Telegram";
  }

  if (/график|время.*работ|когда.*открыт|часы.*работ/i.test(message)) {
    return "Наш магазин работает:\nПн-Пт: 9:00-18:00\nСб: 10:00-15:00\nВс: выходной";
  }

  if (/адрес|где.*находится|как.*доехать|местоположение/i.test(message)) {
    return "Наш магазин находится по адресу:\nРостов-на-Дону, ул. Дранко, д. 141\nРядом с ТЦ 'Горизонт'";
  }

  if (/патрубк|выхлопн?|глушитель/i.test(message)) {
    return "Для подбора патрубков:\n1. Измерьте диаметр выхлопной трубы\n2. Укажите модель скутера\n3. Выберите материал (нержавейка/карбон)\n4. Если сомневаетесь - пришлите фото, поможем с выбором!";
  }

  if (/контакт|связаться|телефон|whatsapp|telegram|почта|email/i.test(message)) {
    return "Наши контакты:\nТелефон: +7 (863) 123-45-67\nWhatsApp: +7 (900) 123-45-67\nTelegram: @scooter_parts_shop\nEmail: info@scooter-parts.ru";
  }

  if (/привет|здравствуй|начать|старт/i.test(message)) {
    return "Привет! Я виртуальный помощник магазина запчастей для скутеров. Задайте ваш вопрос или выберите категорию из меню ниже.";
  }

  // Контекстные ответы
  if (/да|конечно|ага/i.test(message) && /нужна помощь/i.test(lastQuestion)) {
    return "Отлично! Напишите ваш вопрос, и я постараюсь помочь. Или вы можете сразу связаться с нами через мессенджеры.";
  }

  if (/нет|не надо/i.test(message) && /нужна помощь/i.test(lastQuestion)) {
    return "Хорошо! Если передумаете - обращайтесь. Буду рад помочь с выбором запчастей для вашего скутера!";
  }

  return "Извините, я не понял вопрос. Попробуйте сформулировать иначе или выберите один из вариантов:";
}

// Очистка старых контекстов
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dialogContext.entries()) {
    if (now - value.lastActivity > 30 * 60 * 1000) { // 30 минут неактивности
      dialogContext.delete(key);
    }
  }
}, 60 * 1000);

app.listen(3001, () => {
  console.log("🤖 Умный бот работает на http://localhost:3001");
  console.log("🚀 Готов к приему сообщений!");
});
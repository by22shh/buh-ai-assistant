# Модуль проверки (готовый код, JS): requisitesGuard.js

## Связанные страницы

- [JSON-shema](../%D0%A0%D0%B5%D0%BA%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D1%8B%20%D0%B8%20%D1%81%D1%82%D1%80%D1%83%D0%BA%D1%82%D1%83%D1%80%D0%B0%20%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85%20290eb7bb7409800cb033fe6f585d9f78/JSON-shema%2028aeb7bb740980ae995ff9b5c20b86de.md) — соответствие регэкспов/алгоритмов.
- [Поля реквизитов](../%D0%A0%D0%B5%D0%BA%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D1%8B%20%D0%B8%20%D1%81%D1%82%D1%80%D1%83%D0%BA%D1%82%D1%83%D1%80%D0%B0%20%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85%20290eb7bb7409800cb033fe6f585d9f78/%D0%9F%D0%BE%D0%BB%D1%8F%20%D1%80%D0%B5%D0%BA%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BE%D0%B2%2028aeb7bb74098001a86eef46f1ae7bee.md) — маппинг полей на проверки.
- [Создать организацию](../%D0%9E%D1%80%D0%B3%D0%B0%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D0%B8%20(User)%20290eb7bb7409805296c1ef496ca5beed/%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%A1%D0%BE%D0%B7%D0%B4%D0%B0%D1%82%D1%8C%20%D0%BE%D1%80%D0%B3%D0%B0%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8E%C2%BB%20(User)%2028aeb7bb7409809d8022f7110f55b6e7.md) / [Редактировать организацию](../%D0%9E%D1%80%D0%B3%D0%B0%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D0%B8%20(User)%20290eb7bb7409805296c1ef496ca5beed/%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%A0%D0%B5%D0%B4%D0%B0%D0%BA%D1%82%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D1%82%D1%8C%20%D0%BE%D1%80%D0%B3%D0%B0%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8E%C2%BB%20(User)%2028aeb7bb74098009b196db734e80a2de.md) — где исполняется валидация.
- [Заполнение реквизитов](%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%97%D0%B0%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5%20%D1%80%D0%B5%D0%BA%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BE%D0%B2%C2%BB%20(User)%2028feb7bb7409809eac65ca6a6512831e.md) — inline-ошибки и блокировка сборки.

Вот та же спецификация, переписанная на **чистый JS** (ES2020). Копируй-файл как `requisitesGuard.js` и подключай где нужно.

```jsx
// requisitesGuard.js
// MVP-проверка: в тексте/файле не должно быть реквизитов.
// Сложность: O(n). Никакой "магии", только простые RegExp + контекстные проверки.

/**
 * @typedef {"inn"|"kpp"|"ogrn"|"ogrnip"|"bik_ctx"|"account_ctx"|"email"|"phone"|"fio_labeled"|"address_labeled"} RequisitesReason
 */

/**
 * @typedef {Object} RequisitesCheckResult
 * @property {boolean} ok            // true → можно отправлять в ИИ
 * @property {RequisitesReason} [reason]
 * @property {string} [message]      // готовый текст ошибки
 * @property {number} [index]        // позиция первого совпадения
 */

/**
 * @typedef {Object} RequisitesGuardOptions
 * @property {number} [ctxWindow=40] // радиус окна контекста для правил 4 и 5
 */

const ERR_UI =
  "В тексте обнаружены реквизиты (ИНН/КПП/ОГРН/счёт/БИК/e-mail/телефон/ФИО/адрес). Удалите их и попробуйте снова.";

// --- Регулярки (ECMA-safe) ---

// 1. ИНН (10 или 12 подряд идущих цифр)
const RX_INN_10_12 = /\b(?:\d{10}|\d{12})\b/g;

// 2. КПП (9 цифр)
const RX_KPP_9 = /\b\d{9}\b/g;

// 3. ОГРН/ОГРНИП (13 или 15 цифр)
const RX_OGRN_13_OGRNIP_15 = /\b(?:\d{13}|\d{15})\b/g;

// 4. БИК (9 цифр) — с контекстом "банк/бик/к-с/р-с/корсчёт"
const RX_BIK_9 = /\b\d{9}\b/g;
const RX_BIK_CONTEXT = /(банк|бик|корсчет|корсчёт|к\/с|р\/с)/i;

// 5. Расч/корр счёт (20 цифр) — с контекстом "р/с/к/с/расчетный/корреспондентский"
const RX_ACC_20 = /\b\d{20}\b/g;
const RX_ACC_CONTEXT = /(р\/с|к\/с|расчетный|расчётный|корреспондентский)/i;

// 6. E-mail
const RX_EMAIL = /\b[A-Za-z0-9.*%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// 7. Телефон РФ
const RX_PHONE_RU = /\b(?:\+7|8)\d{10}\b/g;

// 8. ФИО (только если есть метка в строке)
const RX_FIO_LABEL = /(фио|руководитель|подписант|директор)/i;
const RX_FIO_STRICT = /\b[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?(?:\s+[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?){2}\b/;

// 9. Адрес (только если есть метка и 2+ маркера в строке)
const RX_ADDR_LABEL = /(юридический адрес|почтовый адрес|адрес:)/i;
const RX_ADDR_ZIP = /\b\d{6}\b/;
const RX_ADDR_STREET = /(ул\.|улица|просп\.|проспект|пер\.|переулок|шоссе|бул\.|бульвар|наб\.|набережная|пл\.|площадь|проезд)/i;
const RX_ADDR_BUILDING = /\b(д\.|дом|к\.|корп\.|корпус|стр\.|строение)\s*\d+[A-Za-zА-Яа-я-]*\b/;
const RX_ADDR_CITY = /(г\.|гор\.|город|пос\.|поселок|с\.|деревня)\s+[А-ЯЁ][а-яё-]+/i;

/**
 * Проверка наличия ключевого слова/контекста вокруг найденного числового фрагмента.
 * @param {string} text
 * @param {number} hitIndex
 * @param {number} hitLength
 * @param {RegExp} ctxRegex
 * @param {number} radius
 * @returns {boolean}
 */
function hasContextAround(text, hitIndex, hitLength, ctxRegex, radius) {
  const start = Math.max(0, hitIndex - radius);
  const end = Math.min(text.length, hitIndex + hitLength + radius);
  const slice = text.slice(start, end);
  ctxRegex.lastIndex = 0; // на всякий случай
  return ctxRegex.test(slice);
}

/**
 * Сбрасывает lastIndex у всех глобальных RegExp перед новым прогоном.
 * (Если использовать один модуль-контейнер, глобальные регэкспы сохраняют указатель.)
 */
function resetAllRegex() {
  RX_INN_10_12.lastIndex = 0;
  RX_KPP_9.lastIndex = 0;
  RX_OGRN_13_OGRNIP_15.lastIndex = 0;
  RX_BIK_9.lastIndex = 0;
  RX_ACC_20.lastIndex = 0;
  RX_EMAIL.lastIndex = 0;
  RX_PHONE_RU.lastIndex = 0;
}

/**
 * Главная функция: проверяет отсутствие реквизитов.
 * @param {string} text
 * @param {RequisitesGuardOptions} [opts]
 * @returns {RequisitesCheckResult}
 */
export function checkNoRequisites(text, opts) {
  const ctxWindow = (opts && Number.isFinite(opts.ctxWindow)) ? opts.ctxWindow : 40;

  // На всякий случай сброс указателей глобальных regex
  resetAllRegex();

  // 1) ИНН (10/12 цифр)
  const mInn = RX_INN_10_12.exec(text);
  if (mInn) return { ok: false, reason: "inn", message: ERR_UI, index: mInn.index };

  // 2) КПП (9 цифр)
  const mKpp = RX_KPP_9.exec(text);
  if (mKpp) return { ok: false, reason: "kpp", message: ERR_UI, index: mKpp.index };

  // 3) ОГРН/ОГРНИП (13/15 цифр)
  const mOgr = RX_OGRN_13_OGRNIP_15.exec(text);
  if (mOgr) {
    // Нельзя точно понять, 13 это ОГРН, а 15 — ОГРНИП, но нам неважно — оба запрещены
    return { ok: false, reason: mOgr[0].length === 13 ? "ogrn" : "ogrnip", message: ERR_UI, index: mOgr.index };
  }

  // 4) БИК (9 цифр) с контекстом
  let mBik;
  while ((mBik = RX_BIK_9.exec(text))) {
    if (hasContextAround(text, mBik.index, mBik[0].length, RX_BIK_CONTEXT, ctxWindow)) {
      return { ok: false, reason: "bik_ctx", message: ERR_UI, index: mBik.index };
    }
  }

  // 5) Счета (20 цифр) с контекстом
  let mAcc;
  while ((mAcc = RX_ACC_20.exec(text))) {
    if (hasContextAround(text, mAcc.index, mAcc[0].length, RX_ACC_CONTEXT, ctxWindow)) {
      return { ok: false, reason: "account_ctx", message: ERR_UI, index: mAcc.index };
    }
  }

  // 6) Email
  const mEmail = RX_EMAIL.exec(text);
  if (mEmail) return { ok: false, reason: "email", message: ERR_UI, index: mEmail.index };

  // 7) Телефон РФ
  const mPhone = RX_PHONE_RU.exec(text);
  if (mPhone) return { ok: false, reason: "phone", message: ERR_UI, index: mPhone.index };

  // Построчные проверки для ФИО/Адресов (чтобы не ловить «обычные» упоминания без лейблов)
  const lines = text.split(/\r?\n/);

  // 8) ФИО с лейблом
  {
    let pos = 0;
    for (const line of lines) {
      if (RX_FIO_LABEL.test(line) && RX_FIO_STRICT.test(line)) {
        const localIndex = line.search(RX_FIO_STRICT);
        return { ok: false, reason: "fio_labeled", message: ERR_UI, index: pos + (localIndex >= 0 ? localIndex : 0) };
      }
      pos += line.length + 1; // + \n
    }
  }

  // 9) Адрес с лейблом (минимум 2 маркера в строке)
  {
    let pos = 0;
    for (const line of lines) {
      if (RX_ADDR_LABEL.test(line)) {
        let markers = 0;
        if (RX_ADDR_ZIP.test(line)) markers++;
        if (RX_ADDR_STREET.test(line)) markers++;
        if (RX_ADDR_BUILDING.test(line)) markers++;
        if (RX_ADDR_CITY.test(line)) markers++;
        if (markers >= 2) {
          const localIndex = line.search(RX_ADDR_LABEL);
          return { ok: false, reason: "address_labeled", message: ERR_UI, index: pos + (localIndex >= 0 ? localIndex : 0) };
        }
      }
      pos += line.length + 1;
    }
  }

  return { ok: true };
}

// --- Пример подключения на экране «Тело документа — чат» ---
// import { checkNoRequisites } from "./requisitesGuard.js";
//
// function onSend(text) {
//   const res = checkNoRequisites(text);
//   if (!res.ok) {
//     showError(res.message);
//     return;
//   }
//   callAI(text);
// }
//
// async function onFileChosen(fileText) {
//   const res = checkNoRequisites(fileText);
//   if (!res.ok) {
//     showError(res.message);
//     return;
//   }
//   callAI(fileText);
// }

```
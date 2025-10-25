/**
 * Валидаторы реквизитов с контрольными суммами
 * Согласно JSON Schema из документации
 */

/**
 * Проверка контрольной суммы ИНН-10 (юрлицо)
 */
export function validateINN10(inn: string): boolean {
  if (!/^\d{10}$/.test(inn)) return false;

  const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(inn[i]) * weights[i];
  }
  const checksum = (sum % 11) % 10;
  return checksum === Number.parseInt(inn[9]);
}

/**
 * Проверка контрольной суммы ИНН-12 (ИП)
 */
export function validateINN12(inn: string): boolean {
  if (!/^\d{12}$/.test(inn)) return false;

  // 11-я цифра
  const weights1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum1 = 0;
  for (let i = 0; i < 10; i++) {
    sum1 += Number.parseInt(inn[i]) * weights1[i];
  }
  const checksum1 = (sum1 % 11) % 10;
  if (checksum1 !== Number.parseInt(inn[10])) return false;

  // 12-я цифра
  const weights2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum2 = 0;
  for (let i = 0; i < 11; i++) {
    sum2 += Number.parseInt(inn[i]) * weights2[i];
  }
  const checksum2 = (sum2 % 11) % 10;
  return checksum2 === Number.parseInt(inn[11]);
}

/**
 * Проверка контрольной суммы ОГРН (13 цифр)
 */
export function validateOGRN(ogrn: string): boolean {
  if (!/^\d{13}$/.test(ogrn)) return false;

  const first12 = ogrn.slice(0, 12);
  const checkDigit = Number.parseInt(ogrn[12]);
  const num = BigInt(first12);
  const calculated = Number((num % BigInt(11)) % BigInt(10));
  return calculated === checkDigit;
}

/**
 * Проверка контрольной суммы ОГРНИП (15 цифр)
 */
export function validateOGRNIP(ogrnip: string): boolean {
  if (!/^\d{15}$/.test(ogrnip)) return false;

  const first14 = ogrnip.slice(0, 14);
  const checkDigit = Number.parseInt(ogrnip[14]);
  const num = BigInt(first14);
  const calculated = Number((num % BigInt(13)) % BigInt(10));
  return calculated === checkDigit;
}

/**
 * Проверка счета с БИК (корреспондентский)
 * Строка: '0' + bik[6:8] + ks (23 цифры)
 * Веса по циклу [7,1,3], Σ(d*w) % 10 == 0
 */
export function validateBankKS(bik: string, ks: string): boolean {
  if (!/^\d{9}$/.test(bik) || !/^\d{20}$/.test(ks)) return false;

  const controlStr = '0' + bik.slice(6, 9) + ks;
  const weights = [7, 1, 3];
  let sum = 0;

  for (let i = 0; i < controlStr.length; i++) {
    sum += Number.parseInt(controlStr[i]) * weights[i % 3];
  }

  return sum % 10 === 0;
}

/**
 * Проверка счета с БИК (расчётный)
 * Строка: bik[6:8] + rs (22 цифры)
 * Веса по циклу [7,1,3], Σ(d*w) % 10 == 0
 */
export function validateBankRS(bik: string, rs: string): boolean {
  if (!/^\d{9}$/.test(bik) || !/^\d{20}$/.test(rs)) return false;

  const controlStr = bik.slice(6, 9) + rs;
  const weights = [7, 1, 3];
  let sum = 0;

  for (let i = 0; i < controlStr.length; i++) {
    sum += Number.parseInt(controlStr[i]) * weights[i % 3];
  }

  return sum % 10 === 0;
}

/**
 * Нормализация телефона к формату +7XXXXXXXXXX
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('8') && cleaned.length === 11) {
    return '+7' + cleaned.slice(1);
  }
  if (cleaned.startsWith('7') && cleaned.length === 11) {
    return '+' + cleaned;
  }
  return phone;
}

/**
 * Валидация email
 */
export function validateEmail(email: string): boolean {
  return /^[A-Za-z0-9.*%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

/**
 * Валидация даты в формате ДД.ММ.ГГГГ
 */
export function validateDate(dateStr: string): boolean {
  if (!/^(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.(19|20)\d{2}$/.test(dateStr)) {
    return false;
  }

  const [day, month, year] = dateStr.split('.').map(Number);
  const date = new Date(year, month - 1, day);

  // Проверка валидности даты
  if (date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day) {
    return false;
  }

  // Проверка что не позже сегодня
  return date <= new Date();
}

/**
 * Валидация ФИО (строгая кириллица)
 */
export function validateFIO(fio: string): boolean {
  return /^[А-ЯЁ][а-яё]+(?:\-[А-ЯЁ][а-яё]+)?\s[А-ЯЁ][а-яё]+(?:\-[А-ЯЁ][а-яё]+)?\s[А-ЯЁ][а-яё]+(?:\-[А-ЯЁ][а-яё]+)?$/.test(fio);
}

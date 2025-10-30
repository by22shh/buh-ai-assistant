# JSON-shema

## Связанные страницы

- [Поля реквизитов](%D0%9F%D0%BE%D0%BB%D1%8F%20%D1%80%D0%B5%D0%BA%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BE%D0%B2%2028aeb7bb74098001a86eef46f1ae7bee.md) — соответствие system_name ↔ описания.
- [Заполнение реквизитов](../%D0%A0%D0%B0%D0%B1%D0%BE%D1%82%D0%B0%20%D1%81%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BC%D0%B8%20(User)%20290eb7bb7409804da0aed86f3433deb2/%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%97%D0%B0%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5%20%D1%80%D0%B5%D0%BA%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BE%D0%B2%C2%BB%20(User)%2028feb7bb7409809eac65ca6a6512831e.md) — сервер/клиент валидируют по схеме.
- [Создать организацию](../%D0%9E%D1%80%D0%B3%D0%B0%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D0%B8%20(User)%20290eb7bb7409805296c1ef496ca5beed/%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%A1%D0%BE%D0%B7%D0%B4%D0%B0%D1%82%D1%8C%20%D0%BE%D1%80%D0%B3%D0%B0%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8E%C2%BB%20(User)%2028aeb7bb7409809d8022f7110f55b6e7.md) / [Редактировать организацию](../%D0%9E%D1%80%D0%B3%D0%B0%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D0%B8%20(User)%20290eb7bb7409805296c1ef496ca5beed/%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%A0%D0%B5%D0%B4%D0%B0%D0%BA%D1%82%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D1%82%D1%8C%20%D0%BE%D1%80%D0%B3%D0%B0%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8E%C2%BB%20(User)%2028aeb7bb74098009b196db734e80a2de.md) — форма и проверки соответствуют схеме.
- [Модуль проверки (JS)](../%D0%A0%D0%B0%D0%B1%D0%BE%D1%82%D0%B0%20%D1%81%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BC%D0%B8%20(User)%20290eb7bb7409804da0aed86f3433deb2/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C%20%D0%BF%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%BA%D0%B8%20(%D0%B3%D0%BE%D1%82%D0%BE%D0%B2%D1%8B%D0%B9%20%D0%BA%D0%BE%D0%B4,%20JS)%20requisitesGuard%20%2028feb7bb7409805ab92ddac72668c178.md) — реализация паттернов и контрольных сумм на фронте.

**Поля схемы сопоставляются с назначенными реквизитами по**

> system_name
> 

Автоподстановка выполняется **только** при совпадении system_name в шаблоне и в данных организации.

{
"$schema": "[http://json-schema.org/draft-07/schema#](http://json-schema.org/draft-07/schema#)",
"title": "Создать организацию — JSON Schema (ECMA-safe regex)",
"type": "object",
"additionalProperties": false,
"properties": {
"is_default": {
"type": "boolean",
"description": "Сделать организацию по умолчанию для пользователя"
},
"subject_type": {
"type": "string",
"enum": ["legal_entity", "sole_proprietor"],
"description": "Тип субъекта: legal_entity — юрлицо; sole_proprietor — ИП"
},
"name_full": {
"type": "string",
"minLength": 2,
"maxLength": 150,
"pattern": "^[A-Za-zА-Яа-яЁё0-9\\s«»\"'\\-\\.,()&/]{2,150}$",
"description": "Полное наименование"
},
"name_short": {
"type": "string",
"minLength": 2,
"maxLength": 80,
"pattern": "^[A-Za-zА-Яа-яЁё0-9\\s«»\"'\\-\\.,()&/]{2,80}$",
"description": "Краткое наименование (опционально)"
},
"inn": {
"type": "string",
"pattern": "^\\d{10}$|^\\d{12}$",
"description": "ИНН: 10 цифр (юрлицо) или 12 цифр (ИП)",
"x-algorithm": "Контрольная сумма: ИНН-10 — веса [2,4,10,3,5,9,4,6,8] → mod11→mod10; ИНН-12 — две КС по весам [7,2,4,10,3,5,9,4,6,8] и [3,7,2,4,10,3,5,9,4,6,8]"
},
"kpp": {
"type": "string",
"pattern": "^\\d{9}$",
"description": "КПП: 9 цифр (только для юрлица)"
},
"ogrn": {
"type": "string",
"pattern": "^\\d{13}$",
"description": "ОГРН: 13 цифр (юрлицо)",
"x-algorithm": "Контрольная цифра: (первые 12 цифр % 11) % 10 == 13-я"
},
"ogrnip": {
"type": "string",
"pattern": "^\\d{15}$",
"description": "ОГРНИП: 15 цифр (ИП)",
"x-algorithm": "Контрольная цифра: (первые 14 цифр % 13) % 10 == 15-я"
},
"okpo": {
"type": "string",
"pattern": "^\\d{8}(\\d{2})?$",
"description": "ОКПО: 8 или 10 цифр"
},
"okved": {
"type": "string",
"pattern": "^\\d{2}(\\.\\d{1,2}){0,2}$",
"description": "ОКВЭД основной (например 62, 62.01, 62.09)"
},
"address_legal": {
"type": "string",
"minLength": 5,
"maxLength": 200,
"pattern": "^[A-Za-zА-Яа-яЁё0-9\\s\\.,;:'\"()\\-/\\\\#№]{5,200}$",
"description": "Юридический адрес"
},
"address_postal": {
"type": ["string","null"],
"minLength": 5,
"maxLength": 200,
"pattern": "^[A-Za-zА-Яа-яЁё0-9\\s\\.,;:'\"()\\-/\\\\#№]{5,200}$",
"description": "Почтовый адрес (может совпадать с юридическим)"
},
"phone": {
"type": ["string","null"],
"pattern": "^(\\+7|8)\\d{10}$",
"description": "Телефон: допускается ввод +7XXXXXXXXXX или 8XXXXXXXXXX; хранить как +7XXXXXXXXXX"
},
"email": {
"type": "string",
"pattern": "^[A-Za-z0-9.*%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
"description": "E-mail для документооборота"
},
"website": {
"type": ["string","null"],
"pattern": "^https?://[^\\s]+$",
"description": "Сайт (URL, начинается с http/https)"
},
"head_title": {
"type": "string",
"minLength": 2,
"maxLength": 80,
"pattern": "^[A-Za-zА-Яа-яЁё\\s\\-«»\"'.]{2,80}$",
"description": "Должность руководителя (например, Генеральный директор)"
},
"head_fio": {
"type": "string",
"description": "ФИО руководителя",
"anyOf": [
{ "pattern": "^[А-ЯЁ][а-яё]+(?:\\-[А-ЯЁ][а-яё]+)?\\s[А-ЯЁ][а-яё]+(?:\\-[А-ЯЁ][а-яё]+)?\\s[А-ЯЁ][а-яё]+(?:\\-[А-ЯЁ][а-яё]+)?$" },
{
"allOf": [
{ "pattern": "^[A-Za-zА-Яа-яЁё\\s\\-]+$" },
{ "minLength": 5 }
]
}
]
},
"authority_base": {
"type": "string",
"enum": ["Устава", "Доверенности"],
"description": "Основание полномочий"
},
"poa_number": {
"type": ["string","null"],
"minLength": 1,
"maxLength": 30,
"pattern": "^[A-Za-zА-Яа-яЁё0-9\\-*/]{1,30}$",
"description": "Номер доверенности (обязательно, если основание — Доверенности)"
},
"poa_date": {
"type": ["string","null"],
"pattern": "^(0[1-9]|[12]\\d|3[01])\\.(0[1-9]|1[0-2])\\.(19|20)\\d{2}$",
"description": "Дата доверенности ДД.ММ.ГГГГ (обязательно, если основание — Доверенности). Должна быть не позже сегодняшней даты (проверка на сервере)."
},
"bank_bik": {
"type": "string",
"pattern": "^\\d{9}$",
"description": "БИК: 9 цифр"
},
"bank_name": {
"type": "string",
"minLength": 2,
"maxLength": 120,
"pattern": "^[A-Za-zА-Яа-яЁё0-9\\s«»\"'\\-\\.,()&/]{2,120}$",
"description": "Наименование банка"
},
"bank_ks": {
"type": "string",
"pattern": "^\\d{20}$",
"description": "Корреспондентский счёт: 20 цифр",
"x-algorithm": "Контроль с БИК: строка '0'+bik[6:8]+ks (23 цифры), веса по циклу [7,1,3], Σ(d*w)%10==0"
},
"bank_rs": {
"type": "string",
"pattern": "^\\d{20}$",
"description": "Расчётный счёт: 20 цифр",
"x-algorithm": "Контроль с БИК: строка bik[6:8]+rs (22 цифры), веса по циклу [7,1,3], Σ(d*w)%10==0"
},
"seal_note": {
"type": ["string","null"],
"maxLength": 120,
"pattern": "^[A-Za-zА-Яа-яЁё0-9\\s«»\"'\\-\\.,()&/]{0,120}$",
"description": "Помета о печати/подписи (опционально)"
},
"notes": {
"type": ["string","null"],
"maxLength": 500,
"pattern": "^[A-Za-zА-Яа-яЁё0-9\\s«»\"'\\-\\.,()&/]{0,500}$",
"description": "Служебные комментарии (не попадают в документы)"
}
},
"required": [
"subject_type",
"name_full",
"address_legal",
"email",
"head_title",
"head_fio",
"authority_base",
"bank_bik",
"bank_name",
"bank_ks",
"bank_rs"
],
"allOf": [
{
"if": {
"properties": { "subject_type": { "const": "legal_entity" } },
"required": ["subject_type"]
},
"then": {
"required": ["inn", "kpp", "ogrn"],
"properties": {
"inn": { "pattern": "^\\d{10}$" },
"kpp": { "pattern": "^\\d{9}$" },
"ogrn": { "pattern": "^\\d{13}$" }
}
}
},
{
"if": {
"properties": { "subject_type": { "const": "sole_proprietor" } },
"required": ["subject_type"]
},
"then": {
"required": ["inn", "ogrnip"],
"properties": {
"inn": { "pattern": "^\\d{12}$" },
"ogrnip": { "pattern": "^\\d{15}$" }
}
}
},
{
"if": {
"properties": { "authority_base": { "const": "Доверенности" } },
"required": ["authority_base"]
},
"then": {
"required": ["poa_number", "poa_date"]
}
}
]
}
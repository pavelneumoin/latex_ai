// Seed: демонстрационный контент маркетплейса (авторы + листы + публикации).
// Идемпотентно (upsert по фиксированным id). Запуск: npx tsx prisma/seed-marketplace.ts
//
// Нужен, чтобы маркетплейс не был пустым: показывает категории, темы и «Лучшее».
// Можно безопасно удалить всё демо: npx tsx prisma/seed-marketplace.ts --clean

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AUTHORS = [
  { id: "seed-author-1", name: "Мария Соколова", email: "m.sokolova@demo.rabochiilist.ru" },
  { id: "seed-author-2", name: "Дмитрий Орлов", email: "d.orlov@demo.rabochiilist.ru" },
  { id: "seed-author-3", name: "Елена Кузнецова", email: "e.kuznetsova@demo.rabochiilist.ru" },
  { id: "seed-author-4", name: "Алексей Морозов", email: "a.morozov@demo.rabochiilist.ru" },
];

type Seed = {
  n: number;
  author: string;
  subject: "math" | "informatics";
  grade: number;
  title: string;
  topic: string;
  tags: string;
  description: string;
  price: number; // копейки
  downloads: number;
  rating: number;
  ratingCount: number;
  featured?: boolean;
  bestlist?: boolean;
  tasks: { condition: string; expected_answer: string }[];
};

const T_MATH = "T1";
const T_INF = "T12";

const DATA: Seed[] = [
  {
    n: 1, author: "seed-author-1", subject: "math", grade: 5,
    title: "Обыкновенные дроби: сложение и вычитание",
    topic: "Обыкновенные дроби",
    tags: "дроби,5 класс,арифметика",
    description: "20 задач на сложение и вычитание дробей с разными знаменателями. С ответами и местом для решения.",
    price: 0, downloads: 142, rating: 4.8, ratingCount: 31, bestlist: true,
    tasks: [
      { condition: "Вычислите: $\\dfrac{2}{5} + \\dfrac{1}{3}$.", expected_answer: "$\\dfrac{11}{15}$" },
      { condition: "Найдите разность: $\\dfrac{7}{8} - \\dfrac{1}{4}$.", expected_answer: "$\\dfrac{5}{8}$" },
      { condition: "Сократите дробь $\\dfrac{18}{24}$.", expected_answer: "$\\dfrac{3}{4}$" },
    ],
  },
  {
    n: 2, author: "seed-author-2", subject: "math", grade: 6,
    title: "Проценты в текстовых задачах",
    topic: "Проценты",
    tags: "проценты,6 класс,текстовые задачи",
    description: "Подборка задач на нахождение процента от числа и числа по проценту. Бытовые сюжеты.",
    price: 0, downloads: 98, rating: 4.6, ratingCount: 18,
    tasks: [
      { condition: "Найдите 15% от 240.", expected_answer: "36" },
      { condition: "Товар стоил 800 ₽ и подорожал на 25%. Какова новая цена?", expected_answer: "1000 ₽" },
      { condition: "Число уменьшили на 20%, получилось 64. Найдите исходное число.", expected_answer: "80" },
    ],
  },
  {
    n: 3, author: "seed-author-1", subject: "math", grade: 7,
    title: "Линейные уравнения: 25 задач с разбором",
    topic: "Линейные уравнения",
    tags: "уравнения,7 класс,алгебра",
    description: "От простых к составным. Отлично подходит для отработки навыка в начале темы.",
    price: 0, downloads: 210, rating: 4.9, ratingCount: 47, featured: true, bestlist: true,
    tasks: [
      { condition: "Решите уравнение: $3x - 7 = 11$.", expected_answer: "$x = 6$" },
      { condition: "Решите уравнение: $5(x - 2) = 3x + 4$.", expected_answer: "$x = 7$" },
      { condition: "Решите уравнение: $\\dfrac{x}{4} + 3 = 8$.", expected_answer: "$x = 20$" },
    ],
  },
  {
    n: 4, author: "seed-author-3", subject: "math", grade: 8,
    title: "Квадратные уравнения: дискриминант и теорема Виета",
    topic: "Квадратные уравнения",
    tags: "уравнения,квадратные,8 класс,алгебра",
    description: "Тренажёр на дискриминант и теорему Виета. Два варианта одинаковой сложности.",
    price: 0, downloads: 175, rating: 4.7, ratingCount: 29, bestlist: true,
    tasks: [
      { condition: "Решите уравнение: $x^2 - 5x + 6 = 0$.", expected_answer: "$x_1 = 2,\\ x_2 = 3$" },
      { condition: "Решите уравнение: $x^2 + 4x - 5 = 0$.", expected_answer: "$x_1 = 1,\\ x_2 = -5$" },
      { condition: "Не решая уравнение $x^2 - 7x + 10 = 0$, найдите сумму корней.", expected_answer: "7" },
    ],
  },
  {
    n: 5, author: "seed-author-2", subject: "math", grade: 8,
    title: "Теорема Пифагора: задачи на готовых чертежах",
    topic: "Теорема Пифагора",
    tags: "геометрия,Пифагор,8 класс",
    description: "Задачи на нахождение сторон прямоугольного треугольника. С клетчатым полем.",
    price: 0, downloads: 64, rating: 4.5, ratingCount: 12,
    tasks: [
      { condition: "Катеты прямоугольного треугольника равны 3 и 4. Найдите гипотенузу.", expected_answer: "5" },
      { condition: "Гипотенуза 13, один катет 5. Найдите второй катет.", expected_answer: "12" },
      { condition: "Найдите диагональ прямоугольника со сторонами 6 и 8.", expected_answer: "10" },
    ],
  },
  {
    n: 6, author: "seed-author-3", subject: "math", grade: 9,
    title: "ОГЭ математика: разбор заданий 20–22",
    topic: "Подготовка к ОГЭ",
    tags: "ОГЭ,математика,9 класс,экзамен",
    description: "Вторая часть ОГЭ: алгебра повышенной сложности с полными решениями.",
    price: 9900, downloads: 320, rating: 4.9, ratingCount: 64, featured: true, bestlist: true,
    tasks: [
      { condition: "Решите систему: $\\begin{cases} x + y = 7 \\\\ x - y = 1 \\end{cases}$", expected_answer: "$x = 4,\\ y = 3$" },
      { condition: "Упростите выражение: $\\dfrac{a^2 - 9}{a + 3}$.", expected_answer: "$a - 3$" },
      { condition: "Найдите значение выражения при $x = 2$: $x^3 - 2x^2 + 1$.", expected_answer: "1" },
    ],
  },
  {
    n: 7, author: "seed-author-1", subject: "math", grade: 10,
    title: "Производная и её применение к графикам",
    topic: "Производная",
    tags: "производная,анализ,10 класс",
    description: "Исследование функций с помощью производной: монотонность и экстремумы.",
    price: 0, downloads: 87, rating: 4.6, ratingCount: 16,
    tasks: [
      { condition: "Найдите производную: $f(x) = 3x^2 - 4x + 1$.", expected_answer: "$f'(x) = 6x - 4$" },
      { condition: "Найдите производную: $f(x) = \\sin x + x^3$.", expected_answer: "$f'(x) = \\cos x + 3x^2$" },
      { condition: "В какой точке производная $f(x) = x^2 - 6x$ равна нулю?", expected_answer: "$x = 3$" },
    ],
  },
  {
    n: 8, author: "seed-author-4", subject: "math", grade: 11,
    title: "ЕГЭ профиль: задание 13 (тригонометрия)",
    topic: "Тригонометрические уравнения",
    tags: "ЕГЭ,профиль,тригонометрия,11 класс,экзамен",
    description: "Тригонометрические уравнения с отбором корней на отрезке. 10 задач уровня ЕГЭ.",
    price: 19900, downloads: 256, rating: 4.8, ratingCount: 52, featured: true, bestlist: true,
    tasks: [
      { condition: "Решите уравнение: $2\\sin x = 1$.", expected_answer: "$x = \\dfrac{\\pi}{6} + 2\\pi n$" },
      { condition: "Решите уравнение: $\\cos x = 0$.", expected_answer: "$x = \\dfrac{\\pi}{2} + \\pi n$" },
      { condition: "Найдите корни на $[0; 2\\pi]$: $\\tg x = 1$.", expected_answer: "$\\dfrac{\\pi}{4};\\ \\dfrac{5\\pi}{4}$" },
    ],
  },
  {
    n: 9, author: "seed-author-2", subject: "math", grade: 11,
    title: "Логарифмы: тренажёр перед ЕГЭ",
    topic: "Логарифмы",
    tags: "логарифмы,11 класс,ЕГЭ",
    description: "Свойства логарифмов и логарифмические уравнения. Растущая сложность.",
    price: 0, downloads: 134, rating: 4.7, ratingCount: 24,
    tasks: [
      { condition: "Вычислите: $\\log_2 8$.", expected_answer: "3" },
      { condition: "Вычислите: $\\log_3 27 - \\log_3 3$.", expected_answer: "2" },
      { condition: "Решите уравнение: $\\log_2 x = 5$.", expected_answer: "$x = 32$" },
    ],
  },
  {
    n: 10, author: "seed-author-3", subject: "math", grade: 7,
    title: "Текстовые задачи на движение",
    topic: "Задачи на движение",
    tags: "задачи,движение,7 класс",
    description: "Классические задачи на скорость, время и расстояние. С таблицами для оформления.",
    price: 0, downloads: 76, rating: 4.4, ratingCount: 11,
    tasks: [
      { condition: "Автомобиль за 3 часа проехал 240 км. Найдите его скорость.", expected_answer: "80 км/ч" },
      { condition: "Велосипедист едет со скоростью 12 км/ч. Какое расстояние он проедет за 2,5 часа?", expected_answer: "30 км" },
      { condition: "Поезд прошёл 360 км со скоростью 90 км/ч. Сколько времени он был в пути?", expected_answer: "4 часа" },
    ],
  },
  {
    n: 11, author: "seed-author-4", subject: "informatics", grade: 8,
    title: "Системы счисления: перевод между основаниями",
    topic: "Системы счисления",
    tags: "информатика,системы счисления,8 класс",
    description: "Перевод чисел между двоичной, восьмеричной, десятичной и шестнадцатеричной.",
    price: 0, downloads: 112, rating: 4.7, ratingCount: 22, bestlist: true,
    tasks: [
      { condition: "Переведите число $25_{10}$ в двоичную систему.", expected_answer: "$11001_2$" },
      { condition: "Переведите число $1010_2$ в десятичную систему.", expected_answer: "10" },
      { condition: "Переведите число $1F_{16}$ в десятичную систему.", expected_answer: "31" },
    ],
  },
  {
    n: 12, author: "seed-author-1", subject: "informatics", grade: 9,
    title: "Циклы в Python: 18 задач",
    topic: "Циклы",
    tags: "Python,циклы,информатика,9 класс,программирование",
    description: "Циклы for и while на реальных задачах: суммы, делители, перебор. С разбором кода.",
    price: 0, downloads: 188, rating: 4.8, ratingCount: 38, featured: true,
    tasks: [
      { condition: "Напишите цикл, выводящий сумму чисел от 1 до 100.", expected_answer: "5050" },
      { condition: "Сколько раз выполнится тело цикла: for i in range(2, 10, 2)?", expected_answer: "4 раза" },
      { condition: "Что выведет: i=1; while i<5: i*=2 — конечное значение i?", expected_answer: "8" },
    ],
  },
  {
    n: 13, author: "seed-author-2", subject: "informatics", grade: 9,
    title: "ОГЭ информатика: задание 15.2 (программирование)",
    topic: "Подготовка к ОГЭ",
    tags: "ОГЭ,информатика,Python,9 класс,экзамен",
    description: "Разбор задания 15.2 ОГЭ: обработка последовательностей на Python.",
    price: 0, downloads: 145, rating: 4.6, ratingCount: 27, bestlist: true,
    tasks: [
      { condition: "Дан массив чисел. Найдите количество чётных элементов.", expected_answer: "перебор с проверкой %2==0" },
      { condition: "Найдите максимальный элемент массива без функции max().", expected_answer: "цикл со сравнением" },
      { condition: "Подсчитайте сумму элементов, больших среднего.", expected_answer: "два прохода по массиву" },
    ],
  },
  {
    n: 14, author: "seed-author-4", subject: "informatics", grade: 11,
    title: "Рекурсия: 11 задач для ЕГЭ",
    topic: "Рекурсивные функции",
    tags: "рекурсия,Python,ЕГЭ,11 класс,программирование",
    description: "Рекурсивные функции и дерево вызовов — ключевая тема задания 16 ЕГЭ.",
    price: 9900, downloads: 167, rating: 4.9, ratingCount: 41, bestlist: true,
    tasks: [
      { condition: "Функция F(n)=F(n-1)+F(n-2), F(1)=F(2)=1. Найдите F(6).", expected_answer: "8" },
      { condition: "Сколько вызовов F сделает F(4) для F(n)=F(n-1)+F(n-2)?", expected_answer: "9 вызовов" },
      { condition: "F(n): если n>0 печатает n и вызывает F(n-2). Что выведет F(7)?", expected_answer: "7 5 3 1" },
    ],
  },
  {
    n: 15, author: "seed-author-1", subject: "informatics", grade: 11,
    title: "ЕГЭ информатика: задание 16 (рекурсивные функции)",
    topic: "ЕГЭ задание 16",
    tags: "ЕГЭ,информатика,рекурсия,11 класс,экзамен",
    description: "Полная подборка прототипов задания 16 с числовыми ответами и проверкой на Python.",
    price: 0, downloads: 203, rating: 4.8, ratingCount: 44, featured: true,
    tasks: [
      { condition: "F(n)=n + F(n-1), F(0)=0. Найдите F(10).", expected_answer: "55" },
      { condition: "F(n)=2*F(n-1), F(1)=1. Найдите F(8).", expected_answer: "128" },
      { condition: "Сколько чисел напечатает F(100), если F(n) вызывает F(n div 2) при n>1?", expected_answer: "7" },
    ],
  },
  {
    n: 16, author: "seed-author-3", subject: "informatics", grade: 8,
    title: "Логические выражения и таблицы истинности",
    topic: "Алгебра логики",
    tags: "логика,информатика,8 класс",
    description: "Построение таблиц истинности для И, ИЛИ, НЕ и составных выражений.",
    price: 0, downloads: 58, rating: 4.3, ratingCount: 9,
    tasks: [
      { condition: "Постройте таблицу истинности для $A \\wedge \\neg B$.", expected_answer: "истинно только при A=1, B=0" },
      { condition: "При каких A, B выражение $A \\vee B$ ложно?", expected_answer: "A=0 и B=0" },
      { condition: "Упростите: $A \\wedge (A \\vee B)$.", expected_answer: "A" },
    ],
  },
];

function wsId(n: number): string {
  return `seed-ws-${String(n).padStart(2, "0")}`;
}
function pubId(n: number): string {
  return `seed-pub-${String(n).padStart(2, "0")}`;
}

async function clean() {
  const ids = DATA.map((d) => pubId(d.n));
  await prisma.publication.deleteMany({ where: { id: { in: ids } } });
  await prisma.worksheet.deleteMany({ where: { id: { in: DATA.map((d) => wsId(d.n)) } } });
  await prisma.user.deleteMany({ where: { id: { in: AUTHORS.map((a) => a.id) } } });
  console.log("🧹 demo-маркетплейс удалён");
}

async function main() {
  if (process.argv.includes("--clean")) {
    await clean();
    return;
  }

  for (const a of AUTHORS) {
    await prisma.user.upsert({
      where: { id: a.id },
      update: { name: a.name },
      create: { id: a.id, email: a.email, name: a.name, passwordHash: "seed-no-login" },
    });
  }

  let created = 0;
  for (const d of DATA) {
    const templateId = d.subject === "informatics" ? T_INF : T_MATH;
    const contentJson = JSON.stringify({
      title: d.title,
      subtitle: `${d.topic} · ${d.grade} класс`,
      tasks: d.tasks.map((t, i) => ({
        n: i + 1,
        condition: t.condition,
        expected_answer: t.expected_answer,
        answer_type: "string",
      })),
    });

    await prisma.worksheet.upsert({
      where: { id: wsId(d.n) },
      update: { title: d.title, topic: d.topic, contentJson, isPublic: true },
      create: {
        id: wsId(d.n),
        userId: d.author,
        templateId,
        title: d.title,
        topic: d.topic,
        subject: d.subject,
        grade: d.grade,
        status: "ready",
        difficulty: "medium",
        promptUsed: "seed",
        contentJson,
        isPublic: true,
        publishedAt: new Date(),
      },
    });

    await prisma.publication.upsert({
      where: { id: pubId(d.n) },
      update: {
        title: d.title,
        description: d.description,
        tags: d.tags,
        price: d.price,
        downloads: d.downloads,
        rating: d.rating,
        ratingCount: d.ratingCount,
        isFeatured: Boolean(d.featured),
        isBestlist: Boolean(d.bestlist),
      },
      create: {
        id: pubId(d.n),
        worksheetId: wsId(d.n),
        userId: d.author,
        title: d.title,
        description: d.description,
        tags: d.tags,
        price: d.price,
        downloads: d.downloads,
        rating: d.rating,
        ratingCount: d.ratingCount,
        isFeatured: Boolean(d.featured),
        isBestlist: Boolean(d.bestlist),
      },
    });
    created++;
  }

  const featured = DATA.filter((d) => d.featured).length;
  const best = DATA.filter((d) => d.bestlist).length;
  console.log(`✅ Маркетплейс: ${created} публикаций (${featured} в «Лучшее», ${best} в bestlist), ${AUTHORS.length} авторов`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

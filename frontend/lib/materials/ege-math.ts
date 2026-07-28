export type EgeMathPart = 1 | 2;

export interface EgeMathSubtopic {
  title: string;
  slug: string;
}

export interface EgeMathTopic {
  number: number;
  title: string;
  slug: string;
  sourceId: string;
  part: EgeMathPart;
  maxScore: number;
  subtopics: EgeMathSubtopic[];
}

export const EGE_MATH_MATERIALS_META = {
  title: "Профильная математика ЕГЭ",
  sourceName: "Профиматика",
  sourceUrl: "https://bank-zadach.ru/build",
  fetchedAt: "2026-07-28",
} as const;

export const EGE_MATH_TOPICS: readonly EgeMathTopic[] = [
  {
    number: 1,
    title: "Простая планиметрия",
    slug: "task-1",
    sourceId: "35c767ca-802d-4a4e-8c16-bc78fd3da903",
    part: 1,
    maxScore: 1,
    subtopics: [
      { title: "Вписанная окружность", slug: "vpisannaya-okruzhnost" },
      { title: "Описанная окружность", slug: "opisannaya-okruzhnost" },
      { title: "Углы фигуры", slug: "ugol-figur" },
      {
        title: "Тригонометрические функции в прямоугольном треугольнике",
        slug: "trigonometricheskie-funktsii-v-pryamougolnom-treug",
      },
      { title: "Стороны фигуры", slug: "storony-figury" },
      { title: "Площадь и периметр фигуры", slug: "ploschad-figury" },
      { title: "Вписанный и центральный углы", slug: "vpisannyy-i-tsentralnyy-ugly" },
    ],
  },
  {
    number: 2,
    title: "Векторы",
    slug: "task-2",
    sourceId: "67fcf45c-c249-4cab-a722-823c00d9c098",
    part: 1,
    maxScore: 1,
    subtopics: [
      { title: "Скалярное произведение", slug: "scalar-product" },
      { title: "Длина вектора", slug: "vector-length" },
    ],
  },
  {
    number: 3,
    title: "Простая стереометрия",
    slug: "task-3",
    sourceId: "31c6186d-7489-4892-8033-400d6a3328b6",
    part: 1,
    maxScore: 1,
    subtopics: [
      { title: "Объём фигуры", slug: "obyom-figury" },
      { title: "Вписанные тела", slug: "vpisannye-tela" },
      { title: "Площадь поверхности", slug: "ploschad-poverhnosti" },
      { title: "Углы в многограннике", slug: "ugly-v-mnogogrannike" },
    ],
  },
  {
    number: 4,
    title: "Простая вероятность",
    slug: "task-4",
    sourceId: "7f184d93-ebbd-4fde-8569-9fd9e62bda05",
    part: 1,
    maxScore: 1,
    subtopics: [
      { title: "Комбинаторная вероятность", slug: "ekzamenatsonnye-bilety" },
      {
        title: "Вероятность объединения независимых событий",
        slug: "veroyatnost-obedineniya-nezavisimyh-sobytiy",
      },
      { title: "Независимые события", slug: "nezavisimye-sobytiya" },
      {
        title: "Вероятность противоположного события",
        slug: "teoremy-o-veroyatnostyah",
      },
    ],
  },
  {
    number: 5,
    title: "Сложная вероятность",
    slug: "task-5",
    sourceId: "ad52c3e2-6837-4bf8-a5bb-cab50d8094c2",
    part: 1,
    maxScore: 1,
    subtopics: [
      {
        title: "Формула вероятности объединения/пересечения событий",
        slug: "formula-obedineniya-peresecheniya",
      },
      { title: "Независимые события", slug: "nezavisimye-sobytiya" },
      { title: "Комбинаторная вероятность", slug: "kombinatornaya-veroyatnost" },
      {
        title: "Нахождение вероятности события через вероятность обратного события",
        slug: "veroyatnost-cherez-obratnoe-sobytie",
      },
      { title: "Формула полной вероятности", slug: "formula-polnoy-veroyatnosti" },
    ],
  },
  {
    number: 6,
    title: "Простейшие уравнения",
    slug: "task-6",
    sourceId: "9138411e-9bd5-40e7-9380-92397716c89d",
    part: 1,
    maxScore: 1,
    subtopics: [
      { title: "Рациональные уравнения", slug: "ratsionalnye-uravneniya" },
      {
        title: "Линейные, квадратные, кубические уравнения",
        slug: "lineynye-kvadratnye-kubicheskie-uravneniya",
      },
      { title: "Иррациональные уравнения", slug: "irratsionalnye-uravneniya" },
      { title: "Показательные уравнения", slug: "pokazatelnye-uravneniya" },
      { title: "Логарифмические уравнения", slug: "logarifmicheskie-uravneniya" },
    ],
  },
  {
    number: 7,
    title: "Вычисления и преобразования",
    slug: "task-7",
    sourceId: "c94f2549-950c-4b67-931b-a0194d445a4c",
    part: 1,
    maxScore: 1,
    subtopics: [
      { title: "Степени и корни", slug: "stepeni-i-korni" },
      { title: "Логарифмы", slug: "logarifmy" },
      { title: "Тригонометрия", slug: "trigonometriya" },
    ],
  },
  {
    number: 8,
    title: "Производная и первообразная",
    slug: "task-8",
    sourceId: "f20d541d-766a-4c47-8f95-50652e1c6a62",
    part: 1,
    maxScore: 1,
    subtopics: [
      { title: "Значение производной", slug: "znachenie-proizvodnoy" },
      { title: "Возрастание/убывание", slug: "vozrastanie-ubyvanie" },
      { title: "Экстремумы", slug: "ekstremumy" },
      {
        title: "Геометрический смысл производной",
        slug: "geometricheskij-smysl-proizvodnoj",
      },
    ],
  },
  {
    number: 9,
    title: "Задачи с прикладным содержанием",
    slug: "task-9",
    sourceId: "32444926-9848-4099-aa2d-a5ec8bb14700",
    part: 1,
    maxScore: 1,
    subtopics: [
      {
        title: "Квадратичная, кубическая зависимость",
        slug: "kvadratichnaya-kubicheskaya-zavisimost",
      },
      { title: "Рациональные уравнения", slug: "ratsionalnye-uravneniya" },
      { title: "Иррациональное уравнение", slug: "irratsionalnoe-uravnenie" },
      {
        title: "Тригонометрическая функция",
        slug: "trigonometricheskaya-funktsiya",
      },
      { title: "Показательное уравнение", slug: "pokazatelnoe-uravnenie" },
      { title: "Логарифм", slug: "logarifm" },
      { title: "Степенное уравнение", slug: "stepennoe-uravnenie" },
    ],
  },
  {
    number: 10,
    title: "Текстовые задачи",
    slug: "task-10",
    sourceId: "dc0d57a1-fc9e-4a41-8af6-777ab8ac336b",
    part: 1,
    maxScore: 1,
    subtopics: [
      { title: "Концентрация", slug: "kontsentratsiya" },
      { title: "Движение по прямой", slug: "dvizhenie-po-pryamoy" },
      { title: "Движение по воде", slug: "dvizhenie-po-vode" },
      { title: "Работа", slug: "rabota" },
      { title: "Протяжённые тела", slug: "protyazhyonnye-tela" },
    ],
  },
  {
    number: 11,
    title: "Графики функций",
    slug: "task-11",
    sourceId: "d1d3a43e-a59e-4ae6-946e-d31c28eda730",
    part: 1,
    maxScore: 1,
    subtopics: [
      { title: "Линейные функции", slug: "lineynye-funktsii" },
      { title: "Иррациональные функции", slug: "irratsionalnye-funktsii" },
      { title: "Гиперболы", slug: "giperboly" },
      { title: "Параболы", slug: "paraboly" },
      { title: "Показательные функции", slug: "pokazatelnye-funktsii" },
      { title: "Логарифмические функции", slug: "logarifmicheskie-funktsii" },
    ],
  },
  {
    number: 12,
    title: "Исследование функций",
    slug: "task-12",
    sourceId: "e27587c3-3f99-4388-90b2-b0fa9b7d4b9a",
    part: 1,
    maxScore: 1,
    subtopics: [
      {
        title: "Многочлены и иррациональные функции",
        slug: "mnogochleny-irratsionalnye-funktsii",
      },
      { title: "Логарифмическая функция", slug: "logarifmicheskaya-funktsiya" },
      { title: "Показательная функция", slug: "pokazatelnaya-funktsiya" },
      {
        title: "Тригонометрическая функция",
        slug: "trigonometricheskaya-funktsiya",
      },
    ],
  },
  {
    number: 13,
    title: "Уравнения",
    slug: "task-13",
    sourceId: "62ee73dc-2ba4-4669-9f7d-6aed97338b29",
    part: 2,
    maxScore: 2,
    subtopics: [
      { title: "Логарифмы", slug: "logarifmy" },
      { title: "Показательные уравнения", slug: "pokazatelnye-uravneniya" },
      {
        title: "Тригонометрия, сводящаяся к квадратному уравнению",
        slug: "trigonometriya-kvadratnoe-uravnenie",
      },
      {
        title: "Тригонометрия, разложение на множители",
        slug: "trigonometriya-razlozhenie-na-mnozhiteli",
      },
      { title: "Тригонометрия и формулы", slug: "trigonometriya-i-formuly" },
      { title: "Тригонометрия и логарифмы", slug: "trigonometriya-i-logarifmy" },
      {
        title: "Тригонометрия и показательные выражения",
        slug: "trigonometriya-i-pokazatelnye-vyrazheniya",
      },
    ],
  },
  {
    number: 14,
    title: "Стереометрия",
    slug: "task-14",
    sourceId: "7dc3a039-78fe-43d6-b16a-2a1537072288",
    part: 2,
    maxScore: 3,
    subtopics: [
      { title: "Пирамиды", slug: "piramidy" },
      { title: "Призмы", slug: "prizmy" },
      { title: "Параллелепипеды", slug: "parallelepipedy" },
      { title: "Цилиндры", slug: "tsilindry" },
      { title: "Конусы", slug: "konusy" },
    ],
  },
  {
    number: 15,
    title: "Неравенства",
    slug: "task-15",
    sourceId: "916d6469-e7b3-4991-bf1b-b0cadd884f1b",
    part: 2,
    maxScore: 2,
    subtopics: [
      { title: "Многочлены", slug: "mnogochleny" },
      { title: "Показательные неравенства", slug: "pokazatelnye-neravenstva" },
      { title: "Логарифмические неравенства", slug: "logarifmicheskie-neravenstva" },
      {
        title: "Логарифмические неравенства с переменным основанием",
        slug: "logarifmicheskie-neravenstva-peremennoe-osnovanie",
      },
      { title: "Неравенства с модулем", slug: "neravenstva-s-modulem" },
    ],
  },
  {
    number: 16,
    title: "Экономические задачи",
    slug: "task-16",
    sourceId: "6b03fa00-d1b1-430b-bb98-09e392485dfc",
    part: 2,
    maxScore: 2,
    subtopics: [
      { title: "Вклады", slug: "vklady" },
      { title: "Кредиты", slug: "kredity" },
      { title: "Оптимизация", slug: "optimizatsiya" },
    ],
  },
  {
    number: 17,
    title: "Планиметрия",
    slug: "task-17",
    sourceId: "e0b05ea9-dc10-4925-a9fd-8af0cfeea0d7",
    part: 2,
    maxScore: 3,
    subtopics: [
      { title: "Треугольники", slug: "treugolniki" },
      {
        title: "Квадрат, прямоугольник, ромб",
        slug: "kvadrat-pryamougolnik-romb",
      },
      { title: "Параллелограмм", slug: "parallelogramm" },
      { title: "Трапеции", slug: "trapetsii" },
      { title: "Окружности", slug: "okruzhnosti" },
    ],
  },
  {
    number: 18,
    title: "Параметры",
    slug: "task-18",
    sourceId: "cb82b19e-657e-47d6-86f3-f1419eabf775",
    part: 2,
    maxScore: 4,
    subtopics: [
      { title: "Параметр с логарифмами", slug: "parametr-s-logarifmami" },
      { title: "Параметр с тригонометрией", slug: "parametr-s-trigonometriey" },
      { title: "Параметр с модулем", slug: "parametr-s-modulem" },
      {
        title: "Показательное уравнение с параметром",
        slug: "pokazatelnoe-uravnenie-s-parametrom",
      },
      {
        title: "Иррациональные уравнения с параметром",
        slug: "irratsionalnye-uravneniya-s-parametrom",
      },
      {
        title: "Системы уравнений с параметром",
        slug: "sistemy-uravneniy-s-parametrom",
      },
      { title: "Многочлены и параметр", slug: "mnogochleny-i-parametr" },
      { title: "Параметр и график функции", slug: "parametr-i-grafik-funktsii" },
      {
        title: "Показательное неравенство с параметром",
        slug: "pokazatelnoe-neravenstvo-s-parametrom",
      },
      {
        title: "Система неравенств с параметром",
        slug: "sistema-neravenstv-s-parametrom",
      },
    ],
  },
  {
    number: 19,
    title: "Теория чисел",
    slug: "task-19",
    sourceId: "36d69885-9184-441e-a092-1ff69a6d48cc",
    part: 2,
    maxScore: 4,
    subtopics: [
      { title: "Свойства чисел", slug: "svoystva-chisel" },
      {
        title: "Набор чисел на доске/карточках",
        slug: "nabor-chisel-na-doske-kartochkah",
      },
      { title: "Задачи с сюжетом", slug: "zadachi-s-syuzhetom" },
      {
        title: "Последовательности и прогрессии",
        slug: "posledovatelnosti-i-progressii",
      },
    ],
  },
] as const;

export function materialProgressKey(
  topic: Pick<EgeMathTopic, "number">,
  subtopic: Pick<EgeMathSubtopic, "slug">
): string {
  return `${topic.number}:${subtopic.slug}`;
}

export const EGE_MATH_SUBTOPIC_COUNT = EGE_MATH_TOPICS.reduce(
  (sum, topic) => sum + topic.subtopics.length,
  0
);

export const EGE_MATH_PROGRESS_KEYS = new Set(
  EGE_MATH_TOPICS.flatMap((topic) =>
    topic.subtopics.map((subtopic) => materialProgressKey(topic, subtopic))
  )
);

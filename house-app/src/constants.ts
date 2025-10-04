export interface ConstructionOption {
  constructionType: string;
  periodKind: string;
  type: string;
  cost: number;
  duration: number;
}

export const CONSTRUCTION_OPTIONS: ConstructionOption[] = [
  // Фундамент
  {
    constructionType: "Фундамент",
    periodKind: "costFoundationPile",
    type: "1 Свайный",
    cost: 4300,
    duration: 9,
  },
  {
    constructionType: "Фундамент",
    periodKind: "costFoundationTape",
    type: "1 Ленточный",
    cost: 5500,
    duration: 18,
  },
  {
    constructionType: "Фундамент",
    periodKind: "costFoundationSlab",
    type: "1 Плитный",
    cost: 8000,
    duration: 17,
  },

  // Стены
  {
    constructionType: "Стены",
    periodKind: "costWallTraditional",
    type: "2 Традиционный стиль",
    cost: 7500,
    duration: 28,
  },
  {
    constructionType: "Стены",
    periodKind: "costWallClassical",
    type: "2 Классический стиль",
    cost: 16000,
    duration: 34,
  },
  {
    constructionType: "Стены",
    periodKind: "costWallGerman",
    type: "2 Немецкий стиль",
    cost: 11000,
    duration: 24,
  },
  {
    constructionType: "Стены",
    periodKind: "costWallHightech",
    type: "2 Стиль хай-тек",
    cost: 21000,
    duration: 38,
  },

  // Перекрытие
  {
    constructionType: "Перекрытие",
    periodKind: "costCeilingMonolith",
    type: "3 Монолитное",
    cost: 3800,
    duration: 12,
  },
  {
    constructionType: "Перекрытие",
    periodKind: "costCeilingPrecast",
    type: "3 Сборное железобетон",
    cost: 3300,
    duration: 4,
  },
  {
    constructionType: "Перекрытие",
    periodKind: "costCeilingWood",
    type: "3 Балочное деревянное",
    cost: 2800,
    duration: 9,
  },

  // Крыша
  {
    constructionType: "Крыша",
    periodKind: "costRoofFlex",
    type: "4 Гибкая/битумная черепица",
    cost: 5900,
    duration: 17,
  },
  {
    constructionType: "Крыша",
    periodKind: "costRoofCeramic",
    type: "4 Керамическая черепица",
    cost: 9500,
    duration: 25,
  },
  {
    constructionType: "Крыша",
    periodKind: "costRoofMetal",
    type: "4 Металлочерепица",
    cost: 5000,
    duration: 14,
  },

  // Двери и Окна
  {
    constructionType: "Двери и Окна",
    periodKind: "costDoorTraditional",
    type: "5 Традиционный стиль",
    cost: 4900,
    duration: 4,
  },
  {
    constructionType: "Двери и Окна",
    periodKind: "costDoorClassical",
    type: "5 Классический стиль",
    cost: 5300,
    duration: 4,
  },
  {
    constructionType: "Двери и Окна",
    periodKind: "costDoorGerman",
    type: "5 Немецкий стиль",
    cost: 5300,
    duration: 4,
  },
  {
    constructionType: "Двери и Окна",
    periodKind: "costDoorHightech",
    type: "5 Стиль хай-тек",
    cost: 11400,
    duration: 6,
  },

  // Благоустройство
  {
    constructionType: "Благоустройство",
    periodKind: "costYardGarden",
    type: "6 Сад",
    cost: 2800,
    duration: 11,
  },
  {
    constructionType: "Благоустройство",
    periodKind: "costYardBridge",
    type: "6 Мостик",
    cost: 900,
    duration: 3,
  },
  {
    constructionType: "Благоустройство",
    periodKind: "costYardPond",
    type: "6 Пруд",
    cost: 1800,
    duration: 8,
  },
];

export const INITIAL_BUDGET = 50000;
export const INITIAL_DURATION = 90;

export interface Risk {
  id: number;
  description: string;
  solution: string;
  cost: number;
  duration: number;
  alternativeDescription: string;
  affectedElement: string;
  affectedStyle: string;
}

export const RISKS: Risk[] = [
  {
    id: 1,
    description:
      "Задерживается доставка свай от завода из-за нехватки водителей",
    solution: "Организовать доставку самостоятельно",
    cost: 300,
    duration: 2,
    alternativeDescription: "Дождаться доставки от завода",
    affectedElement: "Фундамент",
    affectedStyle: "Свайный",
  },
  {
    id: 2,
    description: "Затопило котлован",
    solution: "Организовать дренажную систему",
    cost: 600,
    duration: 5,
    alternativeDescription: "Дождаться самостоятельного осушения",
    affectedElement: "Фундамент",
    affectedStyle: "Ленточный",
  },
  {
    id: 3,
    description: "Возможность ошибки в проекте фундамента",
    solution: "Заказать детальный расчет",
    cost: 800,
    duration: 6,
    alternativeDescription: "Взять паузу для проведения контрольных замеров",
    affectedElement: "Фундамент",
    affectedStyle: "Плитный, Свайный, Ленточный",
  },
  {
    id: 4,
    description: "Растрескивание плиты при усадке",
    solution: "Нанять специалистов для прорезания усадочных швов",
    cost: 500,
    duration: 4,
    alternativeDescription: "Провести дополнительный уход за бетоном",
    affectedElement: "Фундамент",
    affectedStyle: "Плитный",
  },
  {
    id: 5,
    description:
      "Траншея под фундамент осыпалась после дождя в подготовленную опалубку",
    solution: "Укрепить откосы траншеи щитами",
    cost: 400,
    duration: 2,
    alternativeDescription: "Отложить заливку, чтобы грунт просох",
    affectedElement: "Фундамент",
    affectedStyle: "Ленточный",
  },
  {
    id: 6,
    description: "Пожар на складе поставщика древесины",
    solution: "Взять с другого склада дороже",
    cost: 1500,
    duration: 3,
    alternativeDescription: "Дождаться пополнения на складе",
    affectedElement: "Стены",
    affectedStyle: "Традиционный стиль, Немецкий стиль",
  },
  {
    id: 7,
    description: "Материалы импортного производства задерживаются на границе",
    solution: "Закупить отечественного производства",
    cost: 1000,
    duration: 7,
    alternativeDescription: "Дождаться поставки импортных элементов",
    affectedElement: "Стены",
    affectedStyle: "Классический стиль, Стиль хай-тек",
  },
  {
    id: 8,
    description: "Бригада не сможет выйти на объект вовремя",
    solution: "Нанять другую бригаду",
    cost: 3000,
    duration: 3,
    alternativeDescription: "Дождаться бригаду",
    affectedElement: "Стены",
    affectedStyle:
      "Немецкий стиль, Стиль хай-тек, Классический стиль, Традиционный стиль",
  },
  {
    id: 9,
    description: "Привезли партию кирпича с разным оттенком",
    solution: "Закупить новую партию",
    cost: 3000,
    duration: 2,
    alternativeDescription:
      "Отсортировать по оттенкам и использовать для кладки разных стен",
    affectedElement: "Стены",
    affectedStyle: "Классический стиль, Стиль хай-тек",
  },
  {
    id: 10,
    description:
      "Бревна имеют естественную кривизну, стена отклоняется от вертикали",
    solution: "Нанять плотника для выправления конструкции",
    cost: 2000,
    duration: 2,
    alternativeDescription: "Пересобрать стену используя бревна из запаса",
    affectedElement: "Стены",
    affectedStyle: "Традиционный стиль",
  },
  {
    id: 11,
    description: "Во время заливки бетона пошел дождь",
    solution: "Укрыть плотной пленкой и арендовать тепловые пушки",
    cost: 600,
    duration: 1,
    alternativeDescription: "Дождаться прекращения дождя",
    affectedElement: "Перекрытие",
    affectedStyle: "Монолитное",
  },
  {
    id: 12,
    description:
      "Монтажники забыли заложить гильзы для прокладки инженерных коммуникаций",
    solution: "Арендовать алмазное бурение для просверливания отверстий",
    cost: 500,
    duration: 1,
    alternativeDescription: "Приостановить укладку плит для закладки гильз",
    affectedElement: "Перекрытие",
    affectedStyle: "Сборное железобетонное",
  },
  {
    id: 13,
    description:
      'Доски оказались естественной влажности, их начинает "вести" после укладки',
    solution: "Заменить доски на сухие (камерной сушки)",
    cost: 400,
    duration: 2,
    alternativeDescription: "Дать балкам просохнуть в штабеле",
    affectedElement: "Перекрытие",
    affectedStyle: "Балочное деревянное",
  },
  {
    id: 14,
    description: "Деформировались фанерные листы опалубки",
    solution: "Заменить некачественную фанеру на новую",
    cost: 300,
    duration: 1,
    alternativeDescription: "Применить дополнительные регулировки при монтаже",
    affectedElement: "Перекрытие",
    affectedStyle: "Монолитное",
  },
  {
    id: 15,
    description: "Более маленький шаг в разметке уже смонтированных балок",
    solution: "Докупить материал для монтажа балок с текущим шагом",
    cost: 200,
    duration: 2,
    alternativeDescription:
      "Демонтаж и последующий монтаж балок в проектной разметке",
    affectedElement: "Перекрытие",
    affectedStyle: "Балочное деревянное",
  },
  {
    id: 16,
    description:
      "Пароизоляционная лента оказалась из партии с браком, нарушена ее герметичность",
    solution: "Закупить новую параизоляционную ленту",
    cost: 100,
    duration: 2,
    alternativeDescription: "Устранить брак вручную",
    affectedElement: "Двери и Окна",
    affectedStyle: "Традиционный стиль, Стиль хай-тек, Классический стиль",
  },
  {
    id: 17,
    description: "Элементы импортного производства задерживаются на границе",
    solution: "Закупить отечественного производства",
    cost: 1000,
    duration: 7,
    alternativeDescription: "Дождаться поставки импортных элементов",
    affectedElement: "Двери и Окна",
    affectedStyle: "Классический стиль, Стиль хай-тек, Немецкий стиль",
  },
  {
    id: 18,
    description: "Задерживается доставка от завода из-за нехватки водителей",
    solution: "Организовать доставку самостоятельно",
    cost: 300,
    duration: 2,
    alternativeDescription: "Дождаться доставки от завода",
    affectedElement: "Двери и Окна",
    affectedStyle: "Немецкий стиль, Традиционный стиль",
  },
  {
    id: 19,
    description: "Элементы импортного производства задерживаются на границе",
    solution: "Закупить отечественного производства",
    cost: 1000,
    duration: 7,
    alternativeDescription: "Дождаться поставки импортных элементов",
    affectedElement: "Двери и Окна",
    affectedStyle: "Стиль хай-тек, Классический стиль",
  },
  {
    id: 20,
    description: "Проемы еще не готовы к монтажу",
    solution: "Нанять бригаду в срочном порядке",
    cost: 800,
    duration: 3,
    alternativeDescription: "Дождаться возвращения бригады на объект",
    affectedElement: "Двери и Окна",
    affectedStyle: "Немецкий стиль, Традиционный стиль",
  },
  {
    id: 21,
    description: "При раскатке подкладочного ковра пошел дождь",
    solution: "Арендовать тепловые пушки для быстрой сушки",
    cost: 600,
    duration: 2,
    alternativeDescription: "Дать ковру просохнуть самостоятельно",
    affectedElement: "Крыша",
    affectedStyle: "Гибкая/битумная черепица",
  },
  {
    id: 22,
    description: "Цвет черепицы из разных паллет заметно отличается",
    solution: "Докупить палеты под один из имеющихся оттенков",
    cost: 3000,
    duration: 1,
    alternativeDescription:
      "Распределить черепицу так, чтобы добиться равномерного смешения",
    affectedElement: "Крыша",
    affectedStyle: "Керамическая черепица",
  },
  {
    id: 23,
    description: "Нарушение условий хранения, началась коррозия",
    solution: "Закупить новый материал",
    cost: 1000,
    duration: 3,
    alternativeDescription: "Подготовить имеющийся материал к монтажу",
    affectedElement: "Крыша",
    affectedStyle: "Металлочерепица",
  },
  {
    id: 24,
    description:
      "Во время резки листов болгаркой искры повредили подкровельную гидроизоляционную пленку",
    solution: "Закупить и уложить новый материал",
    cost: 400,
    duration: 2,
    alternativeDescription: "Устранить повреждения вручную",
    affectedElement: "Крыша",
    affectedStyle: "Металлочерепица",
  },
  {
    id: 25,
    description: "Пасмурная погода не активируется самоклеящийся слой",
    solution: "Купить строительный фен",
    cost: 200,
    duration: 2,
    alternativeDescription: "Дождаться солнечной погоды",
    affectedElement: "Крыша",
    affectedStyle: "Гибкая/битумная черепица",
  },
  {
    id: 26,
    description:
      "В местном питомнике задерживается поставка нужного сорта вишневых деревьев",
    solution: "Купить сорт дороже",
    cost: 800,
    duration: 3,
    alternativeDescription: "Дождаться поставки",
    affectedElement: "Благоустройство",
    affectedStyle: "Сад",
  },
  {
    id: 27,
    description:
      'Доски оказались естественной влажности, их начинает "вести" на солнце',
    solution: "Заменить доски на сухие (камерной сушки)",
    cost: 400,
    duration: 2,
    alternativeDescription: "Дать доскам полежать и просохнуть",
    affectedElement: "Благоустройство",
    affectedStyle: "Мостик",
  },
  {
    id: 28,
    description: "Повредили пленку для пруда при укладке",
    solution: "Закупить новый материал",
    cost: 300,
    duration: 2,
    alternativeDescription: "Устранить повреждение вручную",
    affectedElement: "Благоустройство",
    affectedStyle: "Пруд",
  },
  {
    id: 29,
    description:
      "Выбранные места оказались в зоне прохождения подземных коммуникаций",
    solution: "Вызвать специалистов с помощью трассоискателем",
    cost: 500,
    duration: 2,
    alternativeDescription:
      "Дождаться точных планов от эксплуатирующих организаций",
    affectedElement: "Благоустройство",
    affectedStyle: "Сад, Мостик, Пруд",
  },
  {
    id: 30,
    description: "Залитые бетонные опоры дали трещины",
    solution: "Сделать инъектирование трещин",
    cost: 300,
    duration: 2,
    alternativeDescription:
      "Провести наблюдение на предмет критичности дефектов",
    affectedElement: "Благоустройство",
    affectedStyle: "Мостик",
  },
];

export interface ConstructionOption {
  constructionType: string
  periodKind: string
  type: string
  cost: number
  duration: number
}

export const CONSTRUCTION_OPTIONS: ConstructionOption[] = [
  // Фундамент
  {
    constructionType: "Фундамент",
    periodKind: "costFoundationPile",
    type: "1 Свайный",
    cost: 4300,
    duration: 9
  },
  {
    constructionType: "Фундамент",
    periodKind: "costFoundationTape",
    type: "1 Ленточный",
    cost: 5500,
    duration: 18
  },
  {
    constructionType: "Фундамент",
    periodKind: "costFoundationSlab",
    type: "1 Плитный",
    cost: 8000,
    duration: 17
  },
  
  // Стены
  {
    constructionType: "Стены",
    periodKind: "costWallTraditional",
    type: "2 Традиционный стиль",
    cost: 7500,
    duration: 28
  },
  {
    constructionType: "Стены",
    periodKind: "costWallClassical",
    type: "2 Классический стиль",
    cost: 16000,
    duration: 34
  },
  {
    constructionType: "Стены",
    periodKind: "costWallGerman",
    type: "2 Немецкий стиль",
    cost: 11000,
    duration: 24
  },
  {
    constructionType: "Стены",
    periodKind: "costWallHightech",
    type: "2 Стиль хай-тек",
    cost: 21000,
    duration: 38
  },
  
  // Перекрытие
  {
    constructionType: "Перекрытие",
    periodKind: "costCeilingMonolith",
    type: "3 Монолитное",
    cost: 3800,
    duration: 12
  },
  {
    constructionType: "Перекрытие",
    periodKind: "costCeilingPrecast",
    type: "3 Сборное железобетон",
    cost: 3300,
    duration: 4
  },
  {
    constructionType: "Перекрытие",
    periodKind: "costCeilingWood",
    type: "3 Балочное деревянное",
    cost: 2800,
    duration: 9
  },
  
  // Крыша
  {
    constructionType: "Крыша",
    periodKind: "costRoofFlex",
    type: "4 Гибкая/битумная черепица",
    cost: 5900,
    duration: 17
  },
  {
    constructionType: "Крыша",
    periodKind: "costRoofCeramic",
    type: "4 Керамическая черепица",
    cost: 9500,
    duration: 25
  },
  {
    constructionType: "Крыша",
    periodKind: "costRoofMetal",
    type: "4 Металлочерепица",
    cost: 5000,
    duration: 14
  },
  
  // Двери и Окна
  {
    constructionType: "Двери и Окна",
    periodKind: "costDoorTraditional",
    type: "5 Традиционный стиль",
    cost: 4900,
    duration: 4
  },
  {
    constructionType: "Двери и Окна",
    periodKind: "costDoorClassical",
    type: "5 Классический стиль",
    cost: 5300,
    duration: 4
  },
  {
    constructionType: "Двери и Окна",
    periodKind: "costDoorGerman",
    type: "5 Немецкий стиль",
    cost: 5300,
    duration: 4
  },
  {
    constructionType: "Двери и Окна",
    periodKind: "costDoorHightech",
    type: "5 Стиль хай-тек",
    cost: 11400,
    duration: 6
  },
  
  // Благоустройство
  {
    constructionType: "Благоустройство",
    periodKind: "costYardGarden",
    type: "6 Сад",
    cost: 2800,
    duration: 11
  },
  {
    constructionType: "Благоустройство",
    periodKind: "costYardBridge",
    type: "6 Мостик",
    cost: 900,
    duration: 3
  },
  {
    constructionType: "Благоустройство",
    periodKind: "costYardPond",
    type: "6 Пруд",
    cost: 1800,
    duration: 8
  }
]

export const INITIAL_BUDGET = 50000
export const INITIAL_DURATION = 90

export interface Risk {
  id: number
  description: string
  solution: string
  cost: number
  duration: number
  alternativeDescription: string
}

export const RISKS: Risk[] = [
  {
    id: 1,
    description: "Задерживается доставка свай от завода из-за нехватки водителей",
    solution: "Организовать доставку самостоятельно",
    cost: 300,
    duration: 2,
    alternativeDescription: "Дождаться доставки от завода"
  },
  {
    id: 2,
    description: "Затопило котлован",
    solution: "Организовать дренажную систему",
    cost: 600,
    duration: 5,
    alternativeDescription: "Дождаться самостоятельного осушения"
  },
  {
    id: 4,
    description: "Пожар на складе поставщика древесины",
    solution: "Взять с другого склада дороже",
    cost: 1500,
    duration: 3,
    alternativeDescription: "Дождаться пополнения на складе"
  },
  {
    id: 5,
    description: "Материалы импортного производства задерживаются на границе",
    solution: "Закупить отечественного производства",
    cost: 1000,
    duration: 7,
    alternativeDescription: "Дождаться поставки импортных элементов"
  },
  {
    id: 6,
    description: "Бригада не сможет выйти на объект вовремя",
    solution: "Нанять другую бригаду",
    cost: 3000,
    duration: 3,
    alternativeDescription: "Дождаться бригаду"
  },
  {
    id: 12,
    description: "Элементы импортного производства задерживаются на границе",
    solution: "Закупить отечественного производства",
    cost: 1000,
    duration: 7,
    alternativeDescription: "Дождаться поставки импортных элементов"
  },
  {
    id: 13,
    description: "Задерживается доставка от завода из-за нехватки водителей",
    solution: "Организовать доставку самостоятельно",
    cost: 300,
    duration: 2,
    alternativeDescription: "Дождаться доставки от завода"
  },
  {
    id: 14,
    description: "Элементы импортного производства задерживаются на границе",
    solution: "Закупить отечественного производства",
    cost: 1000,
    duration: 7,
    alternativeDescription: "Дождаться поставки импортных элементов"
  },
  {
    id: 17,
    description: "Нарушение условий хранения, началась коррозия",
    solution: "Закупить новый материал",
    cost: 1000,
    duration: 3,
    alternativeDescription: "Подготовить имеющийся материал к монтажу"
  },
  {
    id: 18,
    description: "В местном питомнике задерживается поставка нужного сорта вишневых деревьев",
    solution: "Купить сорт дороже",
    cost: 800,
    duration: 3,
    alternativeDescription: "Дождаться поставки"
  },
  {
    id: 20,
    description: "В местном питомнике нет нужного вида рыбок",
    solution: "Купить другой вид рыбок дороже",
    cost: 400,
    duration: 3,
    alternativeDescription: "Дождаться поставки"
  }
]
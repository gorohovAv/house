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

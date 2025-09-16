# Система туров (Tour System)

Переиспользуемая система для создания интерактивных туров по страницам приложения.

## Компоненты

### TourProvider

Контекстный провайдер для управления состоянием туров.

**Использование:**

```tsx
import { TourProvider } from "./components/TourProvider";

function App() {
  return <TourProvider>{/* Ваше приложение */}</TourProvider>;
}
```

### TourOverlay

Основной компонент для отображения туров поверх контента.

**Использование:**

```tsx
import TourOverlay from "./components/TourOverlay";

function App() {
  return (
    <TourProvider>
      <TourOverlay>{/* Ваше приложение */}</TourOverlay>
    </TourProvider>
  );
}
```

### useTour

Хук для управления турами в компонентах.

**API:**

- `startTour(config: TourConfig)` - запустить тур
- `nextStep()` - следующий шаг
- `prevStep()` - предыдущий шаг
- `skipTour()` - пропустить тур
- `completeTour()` - завершить тур
- `closeTour()` - закрыть тур
- `isActive` - активен ли тур
- `currentStep` - текущий шаг
- `activeTour` - активный тур

**Пример:**

```tsx
import { useTour } from "./components/TourProvider";

function MyPage() {
  const { startTour, isActive } = useTour();

  const handleStartTour = () => {
    startTour(MY_TOUR_CONFIG);
  };

  return (
    <div>
      <button onClick={handleStartTour}>Запустить тур</button>
    </div>
  );
}
```

### useTourStorage

Хук для работы с localStorage для сохранения состояния завершенных туров.

**API:**

- `isTourCompleted(tourId: string)` - проверка завершения тура
- `markTourCompleted(tourId: string)` - отметить тур как завершенный
- `getCompletedTours()` - получить список завершенных туров
- `clearCompletedTours()` - очистить все завершенные туры

## Конфигурация туров

### TourConfig

```typescript
interface TourConfig {
  id: string; // Уникальный ID тура
  steps: TourStepConfig[]; // Массив шагов
  onComplete?: () => void; // Колбэк при завершении
  onSkip?: () => void; // Колбэк при пропуске
}
```

### TourStepConfig

```typescript
interface TourStepConfig {
  target: string; // CSS селектор элемента
  title: string; // Заголовок шага
  description: string; // Описание шага
  position?: "top" | "bottom" | "left" | "right" | "center";
  type?: "modal" | "tooltip" | "highlight";
  showArrow?: boolean; // Показывать стрелку
  buttons?: TourButtonConfig[]; // Кастомные кнопки
}
```

### TourButtonConfig

```typescript
interface TourButtonConfig {
  text: string; // Текст кнопки
  action: "next" | "prev" | "skip" | "complete" | "custom";
  onClick?: () => void; // Кастомный обработчик
  variant?: "primary" | "secondary";
}
```

## Примеры использования

### Базовый тур

```typescript
const BASIC_TOUR: TourConfig = {
  id: "basic-tour",
  steps: [
    {
      target: ".my-element",
      title: "Заголовок",
      description: "Описание элемента",
      type: "tooltip",
      position: "bottom",
      showArrow: true,
    },
  ],
};
```

### Тур с модальными окнами

```typescript
const MODAL_TOUR: TourConfig = {
  id: "modal-tour",
  steps: [
    {
      target: ".welcome-section",
      title: "Добро пожаловать!",
      description: "Это модальное окно приветствия",
      type: "modal",
      position: "center",
      buttons: [
        {
          text: "Понятно",
          action: "next",
          variant: "primary",
        },
      ],
    },
  ],
};
```

### Тур с кастомными кнопками

```typescript
const CUSTOM_TOUR: TourConfig = {
  id: "custom-tour",
  steps: [
    {
      target: ".complex-element",
      title: "Сложный элемент",
      description: "Описание с кастомными действиями",
      type: "modal",
      position: "center",
      buttons: [
        {
          text: "Пропустить",
          action: "skip",
          variant: "secondary",
        },
        {
          text: "Понятно",
          action: "next",
          variant: "primary",
        },
        {
          text: "Помощь",
          action: "custom",
          onClick: () => openHelpModal(),
          variant: "secondary",
        },
      ],
    },
  ],
};
```

## Автоматический запуск тура

```typescript
import { useTour } from "./components/TourProvider";
import { useTourStorage } from "./hooks/useTourStorage";
import { MY_TOUR } from "./config/tours";

function MyPage() {
  const { startTour } = useTour();
  const { isTourCompleted } = useTourStorage();

  useEffect(() => {
    if (!isTourCompleted(MY_TOUR.id)) {
      const timer = setTimeout(() => {
        startTour(MY_TOUR);
      }, 500); // Задержка для загрузки элементов

      return () => clearTimeout(timer);
    }
  }, [isTourCompleted, startTour]);

  return <div>...</div>;
}
```

## Стилизация

Система использует CSS переменные из `App.css`:

- `--color-button-primary` - основной цвет кнопок
- `--color-button-secondary` - вторичный цвет кнопок
- `--color-text` - цвет текста
- `--color-text-secondary` - вторичный цвет текста

Все стили находятся в `TourOverlay.css` и адаптированы для мобильных устройств.

## Навигация по туру

- **Тап для продолжения** - пользователь может тапнуть в любом месте экрана для перехода к следующему шагу
- **Автоматическое завершение** - на последнем шаге тап завершает тур
- **Визуальные подсказки** - курсор pointer и текстовые подсказки указывают на возможность тапа
- **Кнопки управления** - альтернативный способ навигации через кнопки

## Лучшие практики

1. **Уникальные ID туров** - используйте понятные и уникальные идентификаторы
2. **Проверка элементов** - убедитесь, что целевые элементы существуют на странице
3. **Задержка запуска** - добавляйте небольшую задержку для загрузки DOM
4. **Мобильная адаптация** - тестируйте на мобильных устройствах
5. **Сохранение состояния** - используйте `useTourStorage` для запоминания завершенных туров
6. **Обработка ошибок** - проверяйте существование элементов перед запуском тура
7. **Однократный запуск** - туры запускаются только один раз при первом посещении страницы

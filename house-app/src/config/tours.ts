import { type TourConfig } from "../components/TourProvider";
import {
  MoneyIcon,
  TimeIcon,
  RiskIcon,
  PlanIcon,
  WarningIcon,
  CheckIcon,
} from "../components/Icons";

export const HOUSE_PLANNING_TOUR: TourConfig = {
  id: "house-planning-tour",
  steps: [
    {
      target: ".card-header",
      title: "🏗️ <b>Время строить планы!</b>",
      description:
        '🏗️ Прежде чем закупать материалы и заливать фундамент, нужен <b>чёткий план</b> — особенно когда ресурсы ограничены!<br><br><div class="tour-budget-info"><div class="tour-budget-item">💰 <b>Ваш бюджет:</b> <span class="tour-text-large">50 000₽</span></div><div class="tour-budget-item">⏰ <b>Срок строительства:</b><br><span class="tour-text-large">90 дней</span></div></div><br><br><div class="tour-features"><b>Здесь вы:</b><br>📋 Спроектируете дом, выбирая конструкции и материалы<br>📊 Увидите, как ваш выбор влияет на бюджет и сроки<br>🗺️ Создадите сбалансированный план — вашу главную дорожную карту</div><br><br><div class="tour-warning">⚠️ <b>Важно:</b> На этапе строительства вас ждут <b>непредвиденные риски</b>, которые могут повлиять на стоимость и сроки. Планируйте с запасом прочности!</div><br><br><div class="tour-advice">💡 Когда план будет готовым и продуманным, смело переходите к строительству.</div>',
      type: "modal",
    },
    {
      target: ".house-display",
      title: "Ваш будущий дом",
      description:
        "Здесь вы видите изображение дома. С каждым вашим выбором он будет визуально меняться и наполняться деталями.",
      type: "bottom",
      scrollTo: false,
    },
    {
      target: ".indicators",
      title: "Ваши ресурсы",
      description:
        "Здесь два важных показателя:<br><b>Остаток лимита</b>: Сколько ещё можно потратить, не выходя за рамки бюджета.<br><b>Остаток дней</b>: Сколько дней у вас осталось, чтобы успеть по плану.",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".controls-panel",
      title: "Каталог элементов",
      description:
        "Это ваш главный инструмент! Здесь спрятаны все возможные варианты для вашего дома: от фундамента до крыши.",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".card-header",
      title: "Клавиши пролистывания",
      description:
        "Используйте эти стрелочки, чтобы листать страницы каталога и находить именно то, что нужно.",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".options",
      title: "Кнопки выбора типа элемента",
      description:
        "На каждой странице каталога вы найдёте вот такие кнопки. На них написано:<br> • Название элемента <br> • Его стоимость<br> • Срок монтажа<br>Просто нажмите на понравившийся вариант, чтобы выбрать его для своего плана.",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".btn-primary",
      title: 'Кнопка <b>"Строить"</b>',
      description:
        "Когда ваш план будет готов и вы уверены в своём выборе — смело жмите эту кнопку!<br><br>• Ваш план сохранится<br>• Вы перейдёте на этап строительства<br>• Изменить план будет уже нельзя!",
      type: "bottom",
      scrollTo: true,
      disableNext: true,
    },
  ],
};

export const CONSTRUCTION_TOUR: TourConfig = {
  id: "construction-tour",
  steps: [
    {
      target: "body",
      title: "🚧 <b>План готов? Пора строить!</b>",
      description:
        '🚧 Пришло время воплотить ваши планы в жизнь! Добро пожаловать на самый <b>динамичный и непредсказуемый этап</b> — этап строительства.<br><br><div class="tour-construction-features"><b>Что вас ждёт:</b><br><div class="tour-feature-item">⚠️ <b>Реальные риски.</b><br>Стройка полна сюрпризов! Каждое решение повлияет на бюджет или сроки.</div><div class="tour-feature-item">📊 <b>Живой контроль.</b><br>Следите за показателями: баланс, стоимость, сроки. Ваш дом "растёт" на глазах!</div><div class="tour-feature-item">🔄 <b>Гибкость.</b><br>Коррективы? Не беда! Меняйте не начатые элементы, чтобы уложиться в рамки.</div><div class="tour-feature-item">💰 <b>Управление ресурсами.</b><br>Денег не хватает? Запросите дополнительное финансирование!</div></div><br><br><div class="tour-mission">🎯 <b>Ваша главная задача:</b><br>Провести проект от фундамента до крыши, минимизируя потери. Чем меньше отклонения — тем выше в рейтинге.</div>',
      type: "modal",
      //position: "center",
    },
    {
      target: [".protection-card", ".risk-card"],
      title: "<b>Блок рисков</b>",
      description:
        "Здесь появляется непредвиденная ситуация, которая может повлиять на вашу стройку.\nЧто делать? Вам нужно будет выбрать одно из двух последствий.\nВарианты могут быть разными: увеличение стоимости, задержка сроков или, если повезёт, сообщение о том, что риск удалось избежать!",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".house-display",
      title: "<b>Картинка дома</b>",
      description:
        "Здесь вы в реальном времени видите, как продвигается строительство вашего дома. С каждым вашим решением он будет становиться всё более завершённым.",
      type: "bottom",
      scrollTo: true,
    },
    {
      //target: ".plan-forecast-cards .balance-simple-badges .next-funding-text",
      //target: ".plan-forecast-cards .balance-simple-badges",
      target: [
        ".plan-forecast-cards",
        ".balance-simple-badges",
        ".next-funding-text",
      ],
      title: "<b>Ваша панель управления</b>",
      description:
        "Здесь собраны все ключевые цифры. Следите за ними, чтобы держать проект под контролем!",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".plan-card",
      title: "<b>План</b>",
      description:
        "<b>План:</b> Это ваши изначальные цели, которые были поставлены на этапе планирования. Ваша задача — постараться не отходить от них далеко.",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".forecast-card",
      title: "<b>Прогноз</b>",
      description:
        "<b>Прогноз:</b> Это обновлённые цифры с учётом всех рисков и решений. Они показывают, к каким итогам вы можете прийти, если ситуация не изменится.",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".balance-badge",
      title: "<b>Баланс</b>",
      description:
        "<b>Баланс:</b> Это количество денег, которые есть у вас на сегодняшний день. Все расходы списываются отсюда.",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".simple-badge",
      title: "<b>Простой</b>",
      description:
        "<b>Простой:</b> Если денег на счёте нет, а работы нужно оплачивать — стройка останавливается. Этот счётчик показывает, сколько дней вы простаиваете. Старайтесь не допускать простоев!",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".next-funding-text",
      title: "<b>Ближайшее авансирование</b>",
      description:
        "<b>Ближайшее авансирование:</b> Здесь указано, когда и какая сумма поступит на ваш баланс.",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".request-money-card",
      title: "<b>Запрос дополнительных средств</b>",
      description:
        'Случилось непредвиденное и денег категорически не хватает?\nВ поле "Запросить ещё" введите сумму, которая вам необходима и нажмите кнопку "Запросить".\n\nВажно: Запросить можно только в пределах общего бюджета строительства (50 000).',
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".construction-options",
      title: "<b>Каталог элементов</b>",
      description:
        "Передумали или хотите сэкономить? Здесь вы можете изменить выбор элементов, строительство которых ещё не началось.",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: [
        ".plan-forecast-badges",
        ".cost-chart-container",
        ".plan-forecast-badge",
        ".forecast-remainder-badge",
      ],
      title: "<b>Аналитика элементов</b>",
      description:
        "Теперь каталог дополнен подробной аналитикой по каждому виду элементов",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: [".cost-chart-container"],
      title: "<b>Диаграмма 'План/Оценка'</b>",
      description:
        "<b>Диаграмма 'План/Оценка'</b> наглядно показывает изменение стоимости",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: [".plan-forecast-badge"],
      title: "<b>Дни 'План/Оценка'</b>",
      description:
        "<b>Дни 'План/Оценка'</b> показывают плановые и прогнозные сроки монтажа",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: [".forecast-remainder-badge"],
      title: "<b>Остаток аванса</b>",
      description:
        "<b>Остаток аванса</b> покажет, сколько денег будет на момент начала строительства",
      type: "bottom",
      scrollTo: true,
    },
    {
      target: ".options",
      title: "<b>Строки с вариантами</b>",
      description:
        "Строки с вариантами:\nЗдесь вы можете просто выберать тот тип, который вам теперь больше подходит!",
      type: "bottom",
      scrollTo: true,
    },
  ],
};

// еперь каталог 8
// диаграмма план оценка 8
// дни план оценка
// остаток авнса
// строки с вариантами

export const ALL_TOURS = {
  HOUSE_PLANNING: HOUSE_PLANNING_TOUR,
  CONSTRUCTION: CONSTRUCTION_TOUR,
};

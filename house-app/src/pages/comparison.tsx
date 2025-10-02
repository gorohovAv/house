import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFactStore } from "../store/factStore";
import { usePlanStore } from "../store/store";
import { useOnboardingStore } from "../store/onboardingStore";
import LayeredCanvas from "../components/LayeredCanvas";
import Indicators from "../components/Indicators";
import { MoneyIcon, TimeIcon } from "../components/Icons";
import "./comparison.css";
import type { ConstructionOption } from "../constants";
import type { PaymentScheduleItem } from "../store/factStore";

interface LayerConfig {
  id: string;
  assetPath: string;
  zIndex: number;
  opacity: number;
  visible: boolean;
  blendMode?: GlobalCompositeOperation;
  offsetX?: number;
  offsetY?: number;
  scaleX?: number;
  scaleY?: number;
}

interface LayeredImageConfig {
  width: number;
  height: number;
  layers: LayerConfig[];
}

// Функция проверки завершенности конструкции (из construction.tsx)
const isConstructionCompleted = (
  constructionType: string,
  paymentSchedule: PaymentScheduleItem[]
): boolean => {
  const constructionPayments = paymentSchedule.filter(
    (payment) => payment.construction === constructionType
  );

  if (constructionPayments.length === 0) return false;

  const totalDaysRequired = constructionPayments[0].daysRequired;
  const totalDaysPayed = constructionPayments.reduce(
    (sum, payment) => sum + (payment.daysPayed || 0),
    0
  );

  return totalDaysPayed >= totalDaysRequired;
};

// Функция для создания конфигурации планового домика (из house.tsx)
const createPlannedHouseConfig = (
  selectedOptions: Record<string, ConstructionOption>
): LayeredImageConfig => {
  const layers: LayerConfig[] = [];
  let zIndex = 1;

  // Плита - всегда показывается как базовый слой (земля)
  layers.push({
    id: "base-ground",
    assetPath: "/Плита.png",
    zIndex: zIndex++,
    opacity: 1,
    visible: true,
  });

  // Фундамент - показывается только если выбран
  const foundationOption = selectedOptions["Фундамент"];
  if (foundationOption) {
    const foundationMap: Record<string, string> = {
      "1 Свайный": "/ФУНДАМЕНТСвайный.png",
      "1 Ленточный": "/ФУНДАМЕНТЛенточный.png",
      "1 Плитный": "/ФУНДАМЕНТПлиточный.png",
    };
    layers.push({
      id: "foundation",
      assetPath:
        foundationMap[foundationOption.type] || "/ФУНДАМЕНТСвайный.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });
  }

  // Стены/Этажи - показываем только если выбран фундамент
  const wallsOption = selectedOptions["Стены"];
  if (wallsOption && foundationOption) {
    // Показываем оба этажа для выбранного стиля
    const wallsMap1: Record<string, string> = {
      "2 Традиционный стиль": "/Этаж1традиционный.png",
      "2 Классический стиль": "/Этаж1классический.png",
      "2 Немецкий стиль": "/Этаж1немецкий.png",
      "2 Стиль хай-тек": "/Этаж1хай-тек.png",
    };
    const wallsMap2: Record<string, string> = {
      "2 Традиционный стиль": "/Этаж2традиционный.png",
      "2 Классический стиль": "/Этаж2классический.png",
      "2 Немецкий стиль": "/Этаж2немецкий.png",
      "2 Стиль хай-тек": "/Этаж-2хай-тек.png",
    };

    // Первый этаж
    layers.push({
      id: "walls-floor1",
      assetPath: wallsMap1[wallsOption.type] || "/Этаж1традиционный.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });

    // Перекрытия между этажами
    const overlayOption = selectedOptions["Перекрытие"];
    if (overlayOption) {
      const overlayMap: Record<string, string> = {
        "3 Монолитное": "/Перекрытия-монолитные-итог.png",
        "3 Сборное железобетон": "/Перекрытия-плиточные.png",
        "3 Балочное деревянное": "/Перекрытия-балочные.png",
      };
      layers.push({
        id: "overlay",
        assetPath:
          overlayMap[overlayOption.type] || "/Перекрытия-монолитные-итог.png",
        zIndex: zIndex++,
        opacity: 1,
        visible: true,
      });
    }

    // Второй этаж
    layers.push({
      id: "walls-floor2",
      assetPath: wallsMap2[wallsOption.type] || "/Этаж2традиционный.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });
  }

  // Окна - показываем только если выбраны стены
  const windowsOption = selectedOptions["Двери и Окна"];
  if (windowsOption && wallsOption && foundationOption) {
    const windowsMap: Record<string, string> = {
      "5 Традиционный стиль": "/ОКНАтрадиционный.png",
      "5 Классический стиль": "/ОКНАклассический.png",
      "5 Немецкий стиль": "/ОКНАнемецкий.png",
      "5 Стиль хай-тек": "/ОКНАхайтек.png",
    };
    layers.push({
      id: "windows",
      assetPath: windowsMap[windowsOption.type] || "/ОКНАтрадиционный.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });
  }

  // Крыша - показываем только если выбраны стены (после окон для правильного z-index)
  const roofOption = selectedOptions["Крыша"];
  if (roofOption && wallsOption && foundationOption) {
    const roofMap: Record<string, string> = {
      "4 Гибкая/битумная черепица": "/КРЫШАбитумная-черепица.png",
      "4 Керамическая черепица": "/КРЫШАкерамическая-черепица.png",
      "4 Металлочерепица": "/КРЫШАметаллочерепица.png",
    };
    layers.push({
      id: "roof",
      assetPath: roofMap[roofOption.type] || "/КРЫШАбитумная-черепица.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });
  }

  // Благоустройство - показываем только если выбраны стены
  const landscapingOption = selectedOptions["Благоустройство"];
  if (landscapingOption && wallsOption && foundationOption) {
    const landscapingMap: Record<string, string> = {
      "6 Сад": "/БУСад.png",
      "6 Мостик": "/БУМостик.png",
      "6 Пруд": "/БУПруд.png",
    };
    layers.push({
      id: "landscaping",
      assetPath: landscapingMap[landscapingOption.type] || "/БУСад.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });
  }

  return {
    width: 288,
    height: 250,
    layers,
  };
};

// Функция для создания конфигурации фактического домика (из construction.tsx)
const createActualHouseConfig = (
  selectedOptions: Record<string, ConstructionOption | null>,
  paymentSchedule: PaymentScheduleItem[]
): LayeredImageConfig => {
  const layers: LayerConfig[] = [];
  let zIndex = 1;

  // 1. Сырая земля (Плита) - всегда показывается как базовый слой
  layers.push({
    id: "base-ground",
    assetPath: "/Плита.png",
    zIndex: zIndex++,
    opacity: 1,
    visible: true,
  });

  // 2. Фундамент конкретный - показывается только если выбран
  const foundationOption = selectedOptions["Фундамент"];
  if (foundationOption) {
    const foundationMap: Record<string, string> = {
      "1 Свайный": "/ФУНДАМЕНТСвайный.png",
      "1 Ленточный": "/ФУНДАМЕНТЛенточный.png",
      "1 Плитный": "/ФУНДАМЕНТПлиточный.png",
    };
    layers.push({
      id: "foundation",
      assetPath:
        foundationMap[foundationOption.type] || "/ФУНДАМЕНТСвайный.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });
  }

  // 3. Фундамент итоговый + стены недострой первый этаж
  const wallsOption = selectedOptions["Стены"];
  const foundationCompleted = isConstructionCompleted(
    "Фундамент",
    paymentSchedule
  );
  const wallsCompleted = isConstructionCompleted("Стены", paymentSchedule);

  if (wallsOption && foundationCompleted) {
    if (wallsCompleted) {
      // Готовые стены первый этаж
      const wallsMap1: Record<string, string> = {
        "2 Традиционный стиль": "/Этаж1традиционный.png",
        "2 Классический стиль": "/Этаж1классический.png",
        "2 Немецкий стиль": "/Этаж1немецкий.png",
        "2 Стиль хай-тек": "/Этаж1хай-тек.png",
      };
      layers.push({
        id: "walls-floor1",
        assetPath: wallsMap1[wallsOption.type] || "/Этаж1традиционный.png",
        zIndex: zIndex++,
        opacity: 1,
        visible: true,
      });
    } else {
      // Недострой первого этажа
      layers.push({
        id: "walls-floor1-construction",
        assetPath: "/Недострой-1этаж.png",
        zIndex: zIndex++,
        opacity: 1,
        visible: true,
      });
    }
  }

  // 4. Перекрытие конкретное готовое + недострой следующего этажа
  const overlayOption = selectedOptions["Перекрытие"];
  const overlayCompleted = isConstructionCompleted(
    "Перекрытие",
    paymentSchedule
  );

  if (overlayOption && wallsCompleted) {
    if (overlayCompleted) {
      // Готовое перекрытие
      const overlayMap: Record<string, string> = {
        "3 Монолитное": "/Перекрытия-монолитные-итог.png",
        "3 Сборное железобетон": "/Перекрытия-плиточные.png",
        "3 Балочное деревянное": "/Перекрытия-балочные.png",
      };
      layers.push({
        id: "overlay",
        assetPath:
          overlayMap[overlayOption.type] || "/Перекрытия-монолитные-итог.png",
        zIndex: zIndex++,
        opacity: 1,
        visible: true,
      });
    } else {
      // Недострой перекрытия
      const overlayConstructionMap: Record<string, string> = {
        "3 Монолитное": "/Перекрытия_монолитные_строительство.png",
        "3 Сборное железобетон": "/Перекрытия_плиточные_строительство.png",
        "3 Балочное деревянное": "/Перекрытия_балочные_строительство.png",
      };
      layers.push({
        id: "overlay-construction",
        assetPath:
          overlayConstructionMap[overlayOption.type] ||
          "/Перекрытия_монолитные_строительство.png",
        zIndex: zIndex++,
        opacity: 1,
        visible: true,
      });
    }
  }

  // 5. Готовые стены второй этаж или недострой второго этажа
  if (wallsOption && foundationCompleted && overlayCompleted) {
    if (wallsCompleted) {
      // Готовые стены второй этаж
      const wallsMap2: Record<string, string> = {
        "2 Традиционный стиль": "/Этаж2традиционный.png",
        "2 Классический стиль": "/Этаж2классический.png",
        "2 Немецкий стиль": "/Этаж2немецкий.png",
        "2 Стиль хай-тек": "/Этаж-2хай-тек.png",
      };
      layers.push({
        id: "walls-floor2",
        assetPath: wallsMap2[wallsOption.type] || "/Этаж2традиционный.png",
        zIndex: zIndex++,
        opacity: 1,
        visible: true,
      });
    } else {
      // Недострой второго этажа
      layers.push({
        id: "walls-floor2-construction",
        assetPath: "/Недострой-2этаж.png",
        zIndex: zIndex++,
        opacity: 1,
        visible: true,
      });
    }
  }

  // 6. Готовые стены недострой крыши
  const roofOption = selectedOptions["Крыша"];
  const roofCompleted = isConstructionCompleted("Крыша", paymentSchedule);

  if (roofOption && wallsCompleted && !roofCompleted) {
    // Недострой крыши
    layers.push({
      id: "roof-construction",
      assetPath: "/КРЫШАстроительство.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });
  }

  // 7. Готовая крыша и окна
  if (roofOption && wallsCompleted && roofCompleted) {
    // Готовая крыша
    const roofMap: Record<string, string> = {
      "4 Гибкая/битумная черепица": "/КРЫШАбитумная-черепица.png",
      "4 Керамическая черепица": "/КРЫШАкерамическая-черепица.png",
      "4 Металлочерепица": "/КРЫШАметаллочерепица.png",
    };
    layers.push({
      id: "roof",
      assetPath: roofMap[roofOption.type] || "/КРЫШАбитумная-черепица.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });

    // Окна - показываем только если выбраны и крыша готова
    const windowsOption = selectedOptions["Двери и Окна"];
    if (windowsOption) {
      const windowsMap: Record<string, string> = {
        "5 Традиционный стиль": "/ОКНАтрадиционный.png",
        "5 Классический стиль": "/ОКНАклассический.png",
        "5 Немецкий стиль": "/ОКНАнемецкий.png",
        "5 Стиль хай-тек": "/ОКНАхайтек.png",
      };
      layers.push({
        id: "windows",
        assetPath: windowsMap[windowsOption.type] || "/ОКНАтрадиционный.png",
        zIndex: zIndex++,
        opacity: 1,
        visible: true,
      });
    }
  }

  // 8. Благоустройство - показываем только если все основные конструкции готовы
  const landscapingOption = selectedOptions["Благоустройство"];
  const landscapingCompleted = isConstructionCompleted(
    "Благоустройство",
    paymentSchedule
  );

  if (
    landscapingOption &&
    wallsCompleted &&
    roofCompleted &&
    landscapingCompleted
  ) {
    const landscapingMap: Record<string, string> = {
      "6 Сад": "/БУСад.png",
      "6 Мостик": "/БУМостик.png",
      "6 Пруд": "/БУПруд.png",
    };
    layers.push({
      id: "landscaping",
      assetPath: landscapingMap[landscapingOption.type] || "/БУСад.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });
  }

  return {
    width: 288,
    height: 250,
    layers,
  };
};

const ComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const factStore = useFactStore();
  const planStore = usePlanStore();
  const { projectName } = useOnboardingStore();

  // Получаем данные из стора плана
  const plannedDuration = planStore.getTotalDuration();
  const plannedCost = planStore.getTotalCost();

  // Рассчитываем фактические данные из paymentSchedule
  const actualCost = factStore.paymentSchedule.reduce((total, payment) => {
    return total + (payment.issued || 0);
  }, 0);

  // Фактическая длительность - количество дней, когда были выданы деньги
  const actualDuration = factStore.paymentSchedule.filter(
    (payment) => payment.issued !== null
  ).length;

  // Конфигурация для планируемого дома (по выборам из planStore)
  const getPlannedHouseConfig = (): LayeredImageConfig => {
    return createPlannedHouseConfig(planStore.selectedOptions);
  };

  // Конфигурация для фактического дома (по выборам из factStore и завершенности)
  const getActualHouseConfig = (): LayeredImageConfig => {
    return createActualHouseConfig(
      factStore.selectedOptions,
      factStore.paymentSchedule
    );
  };

  const handleContinue = () => {
    navigate("/results");
  };

  return (
    <div className="comparison-page">
      <div className="comparison-container">
        <div className="comparison-header">
          <h1 className="comparison-title">Дом достроен!</h1>
        </div>

        <div className="comparison-content">
          <div className="comparison-section">
            <div className="section-header">
              <h2 className="section-title">Проект дома</h2>
            </div>
            <div className="house-display-comparison">
              <LayeredCanvas config={getPlannedHouseConfig()} />
            </div>
            <div className="indicators-block">
              <div className="indicator-item">
                <div className="indicator-title">Бюджет</div>
                <div className="indicator-value-comparison">
                  <MoneyIcon />
                  <span>{plannedCost.toLocaleString()}</span>
                </div>
              </div>
              <div className="indicator-item">
                <div className="indicator-title">Срок</div>
                <div className="indicator-value-comparison">
                  <TimeIcon />
                  <span>{plannedDuration} дней</span>
                </div>
              </div>
            </div>
          </div>

          <div className="comparison-divider"></div>

          <div className="comparison-section">
            <div className="section-header">
              <h2 className="section-title">Итоговая постройка</h2>
            </div>
            <div className="house-display-comparison">
              <LayeredCanvas config={getActualHouseConfig()} />
            </div>
            <div className="indicators-block">
              <div className="indicator-item">
                <div className="indicator-title">Бюджет</div>
                <div className="indicator-value-comparison">
                  <MoneyIcon />
                  <span>{actualCost.toLocaleString()}</span>
                </div>
              </div>
              <div className="indicator-item">
                <div className="indicator-title">Срок</div>
                <div className="indicator-value-comparison">
                  <TimeIcon />
                  <span>{actualDuration} дней</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="comparison-continue-btn" onClick={handleContinue}>
          Далее
        </button>
      </div>
    </div>
  );
};

export default ComparisonPage;

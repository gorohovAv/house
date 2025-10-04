import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./house.css";
import { usePlanStore } from "../store/store";
import { CONSTRUCTION_OPTIONS } from "../constants";
import type { ConstructionOption } from "../constants";
import LayeredCanvas from "../components/LayeredCanvas";
import ConstructionCard from "../components/ConstructionCard";
import Indicators from "../components/Indicators";
import { ArrowLeftIcon, ArrowRightIcon, RiskIcon } from "../components/Icons";
import { useTour } from "../components/TourProvider";
import { useTourStorage } from "../hooks/useTourStorage";
import { HOUSE_PLANNING_TOUR } from "../config/tours";

interface CardData {
  id: number;
  title: string;
  options: ConstructionOption[];
}

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

const getCardsFromConstants = (): CardData[] => {
  const constructionTypes = [
    ...new Set(CONSTRUCTION_OPTIONS.map((option) => option.constructionType)),
  ];

  return constructionTypes.map((type, index) => ({
    id: index + 1,
    title: type,
    options: CONSTRUCTION_OPTIONS.filter(
      (option) => option.constructionType === type
    ),
  }));
};

const mockCards = getCardsFromConstants();

// Функция для создания конфигурации слоев на основе выбранных опций
const createLayeredImageConfig = (
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
      assetPath: "/ФУНДАМЕНТПлиточный-итог.png",
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

export default function HousePage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showLimitsPopup, setShowLimitsPopup] = useState(false);
  const navigate = useNavigate();

  const {
    selectedOptions,
    selectOption,
    getRemainingBudget,
    getRemainingDuration,
  } = usePlanStore();

  const { startTour } = useTour();
  const { isTourCompleted } = useTourStorage();

  const currentCard = mockCards[currentCardIndex];
  const currentSelection = selectedOptions[currentCard.title] || undefined;

  // Проверяем, выбраны ли все элементы
  const allElementsSelected = mockCards.every(
    (card) => selectedOptions[card.title]
  );

  // Проверяем, что остаток по дням и деньгам не отрицательный
  const hasValidBudget = getRemainingBudget() >= 0;
  const hasValidDuration = getRemainingDuration() >= 0;
  const canStartConstruction =
    allElementsSelected && hasValidBudget && hasValidDuration;

  // Проверяем превышение лимитов
  const hasExceededLimits = !hasValidBudget || !hasValidDuration;

  // Показываем попап при превышении лимитов
  useEffect(() => {
    if (hasExceededLimits) {
      setShowLimitsPopup(true);
      setTimeout(() => setShowLimitsPopup(false), 3000);
    }
  }, [hasExceededLimits]);
  const [tourStarted, setTourStarted] = useState(false);
  // Запускаем тур при первом посещении страницы
  useEffect(() => {
    startTour(HOUSE_PLANNING_TOUR);
    setTourStarted(true);
  }, [tourStarted]);

  const handleSwipeLeft = () => {
    if (currentCardIndex < mockCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleOptionSelect = (option: ConstructionOption) => {
    selectOption(currentCard.title, option);
  };

  const handleStartConstruction = () => {
    if (canStartConstruction) {
      navigate("/construction");
    }
  };

  const getCurrentLayeredConfig = () => {
    return createLayeredImageConfig(selectedOptions);
  };

  return (
    <div className="house-page">
      <div className="header-house">
        <h1 className="title">Планирование</h1>
      </div>

      <div className="house-container">
        <div className="house-display">
          <LayeredCanvas config={getCurrentLayeredConfig()} />
        </div>

        <Indicators
          remainingBudget={getRemainingBudget()}
          remainingDuration={getRemainingDuration()}
        />

        <div className="controls-panel">
          <div className="controls-content">
            <div className="card-header">
              <div
                className="nav-arrow"
                onClick={currentCardIndex === 0 ? undefined : handleSwipeRight}
                style={{
                  cursor: currentCardIndex === 0 ? "not-allowed" : "pointer",
                  opacity: currentCardIndex === 0 ? 0.5 : 1,
                  outline: 0,
                }}
              >
                <ArrowLeftIcon />
              </div>
              <h2 className="card-title">{currentCard.title}</h2>
              <div className="card-counter">
                {currentCardIndex + 1}/{mockCards.length}
              </div>
              <div
                className="nav-arrow"
                onClick={
                  currentCardIndex === mockCards.length - 1
                    ? undefined
                    : handleSwipeLeft
                }
                style={{
                  cursor:
                    currentCardIndex === mockCards.length - 1
                      ? "not-allowed"
                      : "pointer",
                  opacity: currentCardIndex === mockCards.length - 1 ? 0.5 : 1,
                  outline: 0,
                }}
              >
                <ArrowRightIcon />
              </div>
            </div>

            <ConstructionCard
              title={currentCard.title}
              options={currentCard.options}
              currentSelection={currentSelection}
              onOptionSelect={handleOptionSelect}
            />
          </div>

          <div className="buttons-wrapper">
            <button
              className="btn-primary"
              disabled={!canStartConstruction}
              onClick={handleStartConstruction}
              id="start-construction-button"
              style={{
                opacity: canStartConstruction ? 1 : 0.5,
                cursor: canStartConstruction ? "pointer" : "not-allowed",
              }}
            >
              Строить
            </button>
          </div>
        </div>
      </div>

      {/* Попап предупреждения о превышении лимитов */}
      {showLimitsPopup && (
        <div className="limits-popup">
          <div className="popup-content">
            <RiskIcon />
            <span>Вы превысили лимиты</span>
          </div>
        </div>
      )}
    </div>
  );
}

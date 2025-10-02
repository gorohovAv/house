import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./house.css";
import { usePlanStore } from "../store/store";
import { CONSTRUCTION_OPTIONS } from "../constants";
import type { ConstructionOption } from "../constants";
import LayeredCanvas from "../components/LayeredCanvas";
import ConstructionCard from "../components/ConstructionCard";
import Indicators from "../components/Indicators";
import { ArrowLeftIcon, ArrowRightIcon } from "../components/Icons";
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

  // Фундамент
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

  // Стены/Этажи
  const wallsOption = selectedOptions["Стены"];
  if (wallsOption) {
    const wallsMap: Record<string, string> = {
      "2 Традиционный стиль": "/Этаж1традиционный.png",
      "2 Классический стиль": "/Этаж1классический.png",
      "2 Немецкий стиль": "/Этаж1немецкий.png",
      "2 Стиль хай-тек": "/Этаж1хай-тек.png",
    };
    layers.push({
      id: "walls",
      assetPath: wallsMap[wallsOption.type] || "/Этаж1традиционный.png",
      zIndex: zIndex++,
      opacity: 1,
      visible: true,
    });
  }

  // Крыша
  const roofOption = selectedOptions["Крыша"];
  if (roofOption) {
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

  // Окна
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

  // Благоустройство
  const landscapingOption = selectedOptions["Благоустройство"];
  if (landscapingOption) {
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
    height: 196,
    layers,
  };
};

export default function HousePage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
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

  // Запускаем тур при первом посещении страницы
  useEffect(() => {
    const timer = setTimeout(() => {
      startTour(HOUSE_PLANNING_TOUR);
    }, 500); // Небольшая задержка для загрузки элементов

    return () => clearTimeout(timer);
  }, [isTourCompleted, startTour]);

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
      <div className="header">
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

          <div className="buttons">
            <button className="btn-secondary">К показателям</button>
            <button
              className="btn-primary"
              disabled={!canStartConstruction}
              onClick={handleStartConstruction}
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
    </div>
  );
}

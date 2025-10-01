import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./construction.css";
import { useFactStore } from "../store/factStore";
import { usePlanStore } from "../store/store";
import { useOnboardingStore } from "../store/onboardingStore";
import { CONSTRUCTION_OPTIONS } from "../constants";
import LayeredCanvas from "../components/LayeredCanvas";
import Indicators from "../components/Indicators";
import ConstructionCard from "../components/ConstructionCard";
import CostChart from "../components/CostChart";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  RiskIcon,
  MoneyIcon,
  TimeIcon,
} from "../components/Icons";
import { useTour } from "../components/TourProvider";
import { useTourStorage } from "../hooks/useTourStorage";
import { CONSTRUCTION_TOUR } from "../config/tours";
import type { ConstructionOption } from "../constants";
import type { CreateResultRequest } from "../types/api";

// Базовый URL API
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8080/api"
    : "https://scheduler-assistant.ru/api";

const getDayDeclension = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "день";
  } else if (
    [2, 3, 4].includes(count % 10) &&
    ![12, 13, 14].includes(count % 100)
  ) {
    return "дня";
  } else {
    return "дней";
  }
};

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

interface CardData {
  id: number;
  title: string;
  options: ConstructionOption[];
}

const layeredImageConfig: LayeredImageConfig = {
  width: 288,
  height: 196,
  layers: [
    {
      id: "house",
      assetPath: "/house.png",
      zIndex: 1,
      opacity: 1,
      visible: true,
    },
    {
      id: "roof-red",
      assetPath: "/redRoof.png",
      zIndex: 2,
      opacity: 1,
      visible: false,
    },
    {
      id: "roof-blue",
      assetPath: "/blueRoof.png",
      zIndex: 2,
      opacity: 1,
      visible: false,
    },
    {
      id: "roof-green",
      assetPath: "/greenRoof.png",
      zIndex: 2,
      opacity: 1,
      visible: false,
    },
    {
      id: "roof-pink",
      assetPath: "/pinkRoof.png",
      zIndex: 2,
      opacity: 1,
      visible: false,
    },
  ],
};

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

export default function ConstructionPage() {
  const [roofType, setRoofType] = useState<string>("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [requestAmount, setRequestAmount] = useState<string>("10000");
  const [showExceededPopup, setShowExceededPopup] = useState(false);
  const [showLimitsPopup, setShowLimitsPopup] = useState(false);
  const [selectedRiskSolution, setSelectedRiskSolution] = useState<
    "solution" | "alternative" | null
  >(null);
  const navigate = useNavigate();

  const {
    selectedOptions,
    selectOption,
    getRemainingBudget,
    getRemainingDuration,
    getTotalCost,
    getTotalDuration,
    getRiskCosts,
    getRiskDuration,
    periods,
    currentPeriodIndex,
    selectRiskSolution,
    initializeFromPlan,
    piggyBank,
    requestMoney,
    moveToNextPeriod,
    processDay,
    fundingPlan,
    paymentSchedule,
    planningRemainder,
    duration,
    budget,
  } = useFactStore();

  const planStore = usePlanStore();
  const { projectName } = useOnboardingStore();
  const { startTour } = useTour();
  const { isTourCompleted } = useTourStorage();

  const currentPeriod = periods[currentPeriodIndex];
  const currentRisk = currentPeriod?.risk;
  const currentCard = mockCards[currentCardIndex];
  const currentSelection = selectedOptions[currentCard?.title] || undefined;

  // Находим ближайший транш
  const nextFunding = fundingPlan.find((funding) => {
    if (currentPeriodIndex < periods.length) {
      return funding.dayIndex > periods[currentPeriodIndex].startDay;
    } else {
      return funding.dayIndex > periods[currentPeriodIndex - 1].startDay;
    }
  });
  const nextFundingText = nextFunding
    ? `Финансирование через ${nextFunding.dayIndex} дней + ${nextFunding.amount}`
    : "Финансирование завершено";

  // Расчеты для карточки выбора
  const plannedOption = planStore.selectedOptions[currentCard?.title || ""];
  const plannedDuration = plannedOption?.duration || 0;
  const forecastDuration = paymentSchedule.filter(
    (payment) => payment.construction === currentCard?.title
  ).length;

  // Расчет остатка аванса для конструкции в менюшке выбора
  const getAdvanceRemainder = () => {
    if (!currentCard) return 0;

    console.log("🔍 currentCard", currentCard);

    // Находим первый день строительства конструкции из менюшки
    const constructionPayments = paymentSchedule.filter(
      (payment) => payment.construction === currentCard.title
    );
    console.log("🔍 constructionPayments", constructionPayments);

    if (constructionPayments.length === 0) return 0;

    const firstConstructionDay = Math.min(
      ...constructionPayments.map((p) => p.dayIndex)
    );
    console.log("🔍 firstConstructionDay", firstConstructionDay);

    // Суммируем все транши до первого дня строительства конструкции из менюшки
    const fundingBeforeConstruction = fundingPlan
      .filter((funding) => funding.dayIndex < firstConstructionDay)
      .reduce((total, funding) => total + funding.amount, 0);
    console.log("🔍 fundingBeforeConstruction", fundingBeforeConstruction);

    // Суммируем все amount до первого дня строительства конструкции из менюшки
    const paymentsBeforeConstruction = paymentSchedule
      .filter((payment) => payment.dayIndex < firstConstructionDay)
      .reduce((total, payment) => total + (payment.amount || 0), 0);
    console.log("🔍 paymentsBeforeConstruction", paymentsBeforeConstruction);

    // Находим транш в день начала строительства конструкции
    const fundingOnConstructionDay = fundingPlan
      .filter((funding) => funding.dayIndex === firstConstructionDay)
      .reduce((total, funding) => total + funding.amount, 0);
    console.log("🔍 fundingOnConstructionDay", fundingOnConstructionDay);

    return (
      fundingBeforeConstruction -
      paymentsBeforeConstruction +
      fundingOnConstructionDay
    );
  };

  const advanceRemainder = getAdvanceRemainder();

  // Расчет данных для графика по текущей конструкции
  const getConstructionData = () => {
    if (!currentCard) return { planned: 0, actual: 0 };

    // Используем уже вычисленную plannedOption
    const plannedCost = plannedOption?.cost || 0;

    // Фактическая стоимость из paymentSchedule
    const actualCost = paymentSchedule
      .filter((payment) => payment.construction === currentCard.title)
      .reduce((total, payment) => {
        return (
          total +
          (payment.issued !== null && payment.issued !== 0
            ? payment.issued
            : payment.amount || 0)
        );
      }, 0);

    return { planned: plannedCost, actual: actualCost };
  };

  const constructionData = getConstructionData();

  // Проверяем превышение лимитов
  const hasExceededPlan = constructionData.actual > constructionData.planned;
  const hasExceededLimits =
    forecastDuration > plannedDuration ||
    paymentSchedule.reduce(
      (total, payment) => total + (payment.amount || 0),
      0
    ) > planStore.getTotalCost();

  // Показываем попапы при превышении
  useEffect(() => {
    if (hasExceededPlan) {
      setShowExceededPopup(true);
      setTimeout(() => setShowExceededPopup(false), 3000);
    }
  }, [hasExceededPlan]);

  useEffect(() => {
    if (hasExceededLimits) {
      setShowLimitsPopup(true);
      setTimeout(() => setShowLimitsPopup(false), 3000);
    }
  }, [hasExceededLimits]);

  // Проверяем, завершены ли все периоды
  const isAllPeriodsCompleted = currentPeriodIndex >= periods.length;

  // Функция проверки блокировки конструкций
  const isConstructionLocked = (constructionType: string): boolean => {
    return paymentSchedule.some(
      (payment) =>
        payment.construction === constructionType && payment.issued !== null
    );
  };

  useEffect(() => {
    initializeFromPlan();
  }, [initializeFromPlan]);

  // Сбрасываем выбор решения при смене периода
  useEffect(() => {
    setSelectedRiskSolution(null);
  }, [currentPeriodIndex]);

  // Функция отправки результатов на бэкенд
  const sendResultsToBackend = async () => {
    try {
      // Получаем данные из стора плана
      const plannedDuration = planStore.getTotalDuration();
      const plannedCost = planStore.getTotalCost();

      // Рассчитываем фактические данные из paymentSchedule
      const actualCost = paymentSchedule.reduce((total, payment) => {
        return total + (payment.issued || 0);
      }, 0);

      // Фактическая длительность - количество дней, когда были выданы деньги
      const actualDuration = paymentSchedule.filter(
        (payment) => payment.issued !== null && payment.issued > 0
      ).length;

      const resultData: CreateResultRequest = {
        name: projectName || "Игрок",
        planned_duration: plannedDuration,
        planned_cost: plannedCost,
        actual_duration: actualDuration,
        actual_cost: actualCost,
      };

      console.log("📊 Данные для отправки:", resultData);

      const response = await fetch(`${API_URL}/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      });

      if (!response.ok) {
        throw new Error("Ошибка при отправке результатов");
      }

      console.log("Результаты успешно отправлены на бэкенд");
    } catch (error) {
      console.error("Ошибка при отправке результатов:", error);
    }
  };

  // Переход на страницу сравнения после завершения всех периодов
  useEffect(() => {
    if (isAllPeriodsCompleted) {
      // Отправляем результаты на бэкенд
      sendResultsToBackend();

      const timer = setTimeout(() => {
        navigate("/comparison");
      }, 2000); // Небольшая задержка для показа финального состояния

      return () => clearTimeout(timer);
    }
  }, [isAllPeriodsCompleted, navigate]);

  // Запускаем тур при первом посещении страницы
  useEffect(() => {
    const timer = setTimeout(() => {
      startTour(CONSTRUCTION_TOUR);
    }, 500);

    return () => clearTimeout(timer);
  }, [isTourCompleted, startTour]);

  useEffect(() => {
    // Обновляем тип крыши на основе выбранных опций
    const roofOption = selectedOptions["Крыша"];
    if (roofOption) {
      const roofTypeMap: Record<string, string> = {
        "4 Гибкая/битумная черепица": "red",
        "4 Керамическая черепица": "blue",
        "4 Металлочерепица": "green",
      };
      setRoofType(roofTypeMap[roofOption.type] || "pink");
    }
  }, [selectedOptions]);

  const handleCardSwipeLeft = () => {
    if (currentCardIndex < mockCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handleCardSwipeRight = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleOptionSelect = (option: ConstructionOption) => {
    selectOption(option.constructionType, option);

    // Если это карточка крыши, обновляем тип крыши
    if (currentCard?.title === "Крыша") {
      const roofTypeMap: Record<string, string> = {
        "4 Гибкая/битумная черепица": "red",
        "4 Керамическая черепица": "blue",
        "4 Металлочерепица": "green",
      };
      setRoofType(roofTypeMap[option.type] || "pink");
    }
  };

  const handleRiskSolutionSelect = (solution: "solution" | "alternative") => {
    setSelectedRiskSolution(solution);
  };

  const handleConfirmRiskSolution = () => {
    if (currentPeriod && selectedRiskSolution) {
      console.log(`🏦 КУБЫШКА ПЕРЕД ВЫБОРОМ РЕШЕНИЯ: ${piggyBank} руб.`);

      // Применяем выбранное решение
      selectRiskSolution(currentPeriod.id, selectedRiskSolution);

      // Обрабатываем дни текущего периода перед переходом
      const currentPeriodDays =
        currentPeriod.endDay - currentPeriod.startDay + 1;
      console.log(
        `🏗️ Обработка ${currentPeriodDays} дней периода ${
          currentPeriodIndex + 1
        }`
      );

      for (
        let day = currentPeriod.startDay;
        day <= currentPeriod.endDay;
        day++
      ) {
        processDay(day);
      }

      // Сбрасываем локальное состояние
      setSelectedRiskSolution(null);

      // Переходим к следующему периоду после выбора решения
      setTimeout(() => {
        moveToNextPeriod();
      }, 1000);
    }
  };

  const updateLayeredConfig = () => {
    const updatedConfig = { ...layeredImageConfig };

    // Скрываем все крыши
    updatedConfig.layers.forEach((layer) => {
      if (layer.id.startsWith("roof-")) {
        layer.visible = false;
      }
    });

    // Показываем выбранную крышу
    if (roofType) {
      const roofLayer = updatedConfig.layers.find(
        (layer) => layer.id === `roof-${roofType}`
      );
      if (roofLayer) {
        roofLayer.visible = true;
      }
    }

    return updatedConfig;
  };

  return (
    <div className="construction-page">
      <div className="construction-scroll-container">
        <div className="header">
          <h1 className="title">Строительство</h1>
        </div>

        <div className="construction-container">
          {isAllPeriodsCompleted ? (
            <div className="completion-card">
              <div className="completion-content">
                <div className="completion-icon">🏠</div>
                <div className="completion-title">Строительство завершено!</div>
                <div className="completion-text">
                  Поздравляем! Вы успешно построили свой дом. Переходим к
                  результатам...
                </div>
              </div>
            </div>
          ) : currentRisk ? (
            currentPeriod?.isProtected ? (
              <div className="protection-card">
                <div className="protection-header">
                  <div className="protection-indicator">
                    <span>🛡️</span>
                    <span>Защита от риска</span>
                  </div>
                </div>

                <div className="protection-description">
                  Риск {currentRisk.id}: {currentRisk.description}
                </div>

                <div className="protection-info">
                  <div className="protection-text">
                    Этот риск действует на другую конструкцию, поэтому вы
                    защищены от его последствий.
                  </div>

                  <button
                    className="btn-primary protection-button"
                    onClick={() => {
                      console.log(
                        `🏦 КУБЫШКА ПЕРЕД ЗАЩИТОЙ: ${piggyBank} руб.`
                      );
                      // Обрабатываем дни текущего периода перед переходом
                      const currentPeriodDays =
                        currentPeriod.endDay - currentPeriod.startDay + 1;
                      console.log(
                        `🛡️ Обработка ${currentPeriodDays} дней периода ${
                          currentPeriodIndex + 1
                        } (защита)`
                      );

                      for (
                        let day = currentPeriod.startDay;
                        day <= currentPeriod.endDay;
                        day++
                      ) {
                        processDay(day);
                      }

                      // Переходим к следующему периоду
                      setTimeout(() => {
                        moveToNextPeriod();
                      }, 1000);
                    }}
                  >
                    Перейти к следующему периоду
                  </button>
                </div>
              </div>
            ) : (
              <div className="risk-card">
                <div className="risk-header">
                  <div className="risk-indicator">
                    <RiskIcon />
                    <span>Риск {currentRisk.id}</span>
                  </div>
                </div>

                <div className="risk-description">
                  {currentRisk.description}
                </div>

                <div className="risk-solutions">
                  <div
                    className={`solution-option ${
                      selectedRiskSolution === "solution" ? "active" : ""
                    }`}
                    onClick={() => handleRiskSolutionSelect("solution")}
                  >
                    <div className="solution-text">{currentRisk.solution}</div>
                    <div className="solution-indicators">
                      <div className="cost-indicator">
                        <MoneyIcon />
                        <span>{currentRisk.cost}</span>
                      </div>
                      <div className="time-indicator">
                        <TimeIcon />
                        <span>0</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`solution-option ${
                      selectedRiskSolution === "alternative" ? "active" : ""
                    }`}
                    onClick={() => handleRiskSolutionSelect("alternative")}
                  >
                    <div className="solution-text">
                      {currentRisk.alternativeDescription}
                    </div>
                    <div className="solution-indicators">
                      <div className="cost-indicator">
                        <MoneyIcon />
                        <span>0</span>
                      </div>
                      <div className="time-indicator">
                        <TimeIcon />
                        <span>
                          +{currentRisk.duration}{" "}
                          {getDayDeclension(currentRisk.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedRiskSolution && (
                  <div className="risk-confirm-section">
                    <div className="risk-confirm-text">
                      Подтвердите выбор риска
                    </div>
                    <button
                      className="btn-primary risk-confirm-button"
                      onClick={handleConfirmRiskSolution}
                    >
                      Подтвердить
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="no-risk-card">
              <div className="no-risk-content">
                <div className="no-risk-icon">✅</div>
                <div className="no-risk-text">В этом периоде рисков нет</div>
              </div>
            </div>
          )}

          <div className="house-display">
            <div className="house-container">
              <div className="house-header">
                <h2 className="house-title">Строительство</h2>
                <div className="period-badge">
                  {isAllPeriodsCompleted
                    ? "Завершено"
                    : `Период ${currentPeriodIndex + 1}`}
                </div>
              </div>
              <LayeredCanvas config={updateLayeredConfig()} />
            </div>
          </div>

          <div className="plan-forecast-cards">
            <div className="plan-card">
              <div className="card-title">План</div>
              <div className="card-content">
                <div className="card-item">
                  <MoneyIcon />
                  <span>{planStore.getTotalCost()}</span>
                </div>
                <div className="card-item">
                  <TimeIcon />
                  <span>{planStore.getTotalDuration()} дней</span>
                </div>
              </div>
            </div>
            <div className="forecast-card">
              <div className="card-title">Прогноз</div>
              <div className="card-content">
                <div className="card-item">
                  <MoneyIcon />
                  <span>
                    {paymentSchedule.reduce(
                      (total, payment) => total + (payment.amount || 0),
                      0
                    )}
                  </span>
                </div>
                <div className="card-item">
                  <TimeIcon />
                  <span>{paymentSchedule.length} дней</span>
                </div>
              </div>
            </div>
          </div>

          <div className="balance-simple-badges">
            <div className="balance-badge">
              <div className="badge-title">Баланс</div>
              <div className="badge-content">
                <MoneyIcon />
                <span>{piggyBank}</span>
              </div>
            </div>
            <div className="simple-badge">
              <div className="badge-title">Простой</div>
              <div className="badge-content">
                <TimeIcon />
                <span>
                  {
                    paymentSchedule.filter((payment) => payment.issued === 0)
                      .length
                  }{" "}
                  дней
                </span>
              </div>
            </div>
          </div>

          <div className="next-funding-text">{nextFundingText}</div>

          <div className="request-money-card">
            <input
              type="number"
              className="request-amount-input"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              placeholder="Сумма"
              min="1"
            />
            <button
              className="btn-request"
              onClick={() => {
                const amount = parseInt(requestAmount) || 0;
                if (amount > 0) {
                  console.log(`🏦 КУБЫШКА ПЕРЕД ЗАПРОСОМ: ${piggyBank} руб.`);
                  requestMoney(amount);
                }
              }}
            >
              Запросить еще
            </button>
          </div>

          <div className="construction-options">
            <div className="options-header">
              <div
                className="nav-arrow"
                onClick={
                  currentCardIndex === 0 ? undefined : handleCardSwipeRight
                }
                style={{
                  cursor: currentCardIndex === 0 ? "not-allowed" : "pointer",
                  opacity: currentCardIndex === 0 ? 0.5 : 1,
                  outline: 0,
                }}
              >
                <ArrowLeftIcon />
              </div>
              <h2 className="options-title">{currentCard?.title}</h2>
              <div className="period-counter">
                {currentCardIndex + 1}/{mockCards.length}
              </div>
              <div
                className="nav-arrow"
                onClick={
                  currentCardIndex === mockCards.length - 1
                    ? undefined
                    : handleCardSwipeLeft
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

            <div className="plan-forecast-badges">
              <div className="plan-forecast-badge">
                <div className="badge-title">План / Прогноз</div>
                <div className="badge-content">
                  <TimeIcon />
                  <span>
                    {plannedDuration} / {forecastDuration} дней
                  </span>
                </div>
              </div>
              <div className="forecast-remainder-badge">
                <div className="badge-title">Остаток аванса</div>
                <div className="badge-content">
                  <MoneyIcon />
                  <span>{advanceRemainder}</span>
                </div>
              </div>
            </div>

            <CostChart
              planned={constructionData.planned}
              actual={constructionData.actual}
              title="План/ Прогноз стоимости"
            />

            {currentCard && (
              <ConstructionCard
                title={currentCard.title}
                options={currentCard.options}
                currentSelection={currentSelection}
                onOptionSelect={handleOptionSelect}
                isLocked={isConstructionLocked(currentCard.title)}
              />
            )}

            <div className="buttons">
              <button className="btn-secondary">К показателям</button>
              <button
                className="btn-primary"
                onClick={() => {
                  console.log(
                    `🏦 КУБЫШКА ПЕРЕД СТРОИТЕЛЬСТВОМ: ${piggyBank} руб.`
                  );
                }}
              >
                Строить
              </button>
            </div>
          </div>
        </div>

        {/* Попапы */}
        {showExceededPopup && (
          <div className="exceeded-popup">
            <div className="popup-content">
              <RiskIcon />
              <span>Вы превысили плановую стоимость</span>
            </div>
          </div>
        )}

        {showLimitsPopup && (
          <div className="limits-popup">
            <div className="popup-content">
              <RiskIcon />
              <span>Вы превысили лимиты</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

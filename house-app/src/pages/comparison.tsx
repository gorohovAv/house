import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFactStore } from "../store/factStore";
import { usePlanStore } from "../store/store";
import { useOnboardingStore } from "../store/onboardingStore";
import LayeredCanvas from "../components/LayeredCanvas";
import Indicators from "../components/Indicators";
import { MoneyIcon, TimeIcon } from "../components/Icons";
import "./comparison.css";

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

  // Функция проверки завершенности конструкции
  const isConstructionCompleted = (constructionType: string) => {
    const constructionPayments = factStore.paymentSchedule.filter(
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

  // Конфигурация для планируемого дома (по выборам из planStore)
  const getPlannedHouseConfig = (): LayeredImageConfig => {
    const baseConfig: LayeredImageConfig = {
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
      ],
    };

    // Добавляем слои для выбранных конструкций
    Object.entries(planStore.selectedOptions).forEach(
      ([constructionType, option]) => {
        if (option) {
          // Пока что только крыша имеет визуальные слои
          if (constructionType === "Крыша") {
            const roofTypeMap: Record<string, string> = {
              "4 Гибкая/битумная черепица": "red",
              "4 Керамическая черепица": "blue",
              "4 Металлочерепица": "green",
            };
            const roofType = roofTypeMap[option.type] || "pink";

            baseConfig.layers.push({
              id: `roof-${roofType}`,
              assetPath: `/${roofType}Roof.png`,
              zIndex: 2,
              opacity: 1,
              visible: true,
            });
          }
        }
      }
    );

    return baseConfig;
  };

  // Конфигурация для фактического дома (по выборам из factStore и завершенности)
  const getActualHouseConfig = (): LayeredImageConfig => {
    const baseConfig: LayeredImageConfig = {
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
      ],
    };

    // Добавляем слои только для завершенных конструкций
    Object.entries(factStore.selectedOptions).forEach(
      ([constructionType, option]) => {
        if (option && isConstructionCompleted(constructionType)) {
          // Пока что только крыша имеет визуальные слои
          if (constructionType === "Крыша") {
            const roofTypeMap: Record<string, string> = {
              "4 Гибкая/битумная черепица": "red",
              "4 Керамическая черепица": "blue",
              "4 Металлочерепица": "green",
            };
            const roofType = roofTypeMap[option.type] || "pink";

            baseConfig.layers.push({
              id: `roof-${roofType}`,
              assetPath: `/${roofType}Roof.png`,
              zIndex: 2,
              opacity: 1,
              visible: true,
            });
          }
        }
      }
    );

    return baseConfig;
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

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
    (payment) => payment.issued !== null && payment.issued > 0
  ).length;

  // Конфигурация для планируемого дома (базовый дом)
  const plannedHouseConfig: LayeredImageConfig = {
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

  // Конфигурация для фактического дома (с выбранной крышей)
  const actualHouseConfig: LayeredImageConfig = {
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

  // Определяем тип крыши для фактического дома
  const getActualHouseConfig = () => {
    const roofOption = factStore.selectedOptions["Крыша"];
    if (roofOption) {
      const roofTypeMap: Record<string, string> = {
        "4 Гибкая/битумная черепица": "red",
        "4 Керамическая черепица": "blue",
        "4 Металлочерепица": "green",
      };
      const roofType = roofTypeMap[roofOption.type] || "pink";

      const updatedConfig = { ...actualHouseConfig };
      updatedConfig.layers.forEach((layer) => {
        if (layer.id.startsWith("roof-")) {
          layer.visible = layer.id === `roof-${roofType}`;
        }
      });
      return updatedConfig;
    }
    return actualHouseConfig;
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
            <div className="house-display">
              <LayeredCanvas config={plannedHouseConfig} />
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
            <div className="house-display">
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

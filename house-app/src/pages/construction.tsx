import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./construction.css";
import { useFactStore } from "../store/factStore";
import { usePlanStore } from "../store/store";
import { useOnboardingStore } from "../store/onboardingStore";
import { CONSTRUCTION_OPTIONS } from "../constants";
import LayeredCanvas from "../components/LayeredCanvas";
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
import type { PaymentScheduleItem } from "../store/factStore";

// Базовый URL API
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "10.92.50.3"
    ? `http://${window.location.hostname}:8080/api`
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

// Функция проверки завершенности конструкции
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

// Функция проверки завершенности этапа стен
const isWallsStageCompleted = (
  stage: "first" | "second",
  paymentSchedule: PaymentScheduleItem[]
): boolean => {
  const wallsPayments = paymentSchedule.filter(
    (payment) => payment.construction === "Стены"
  );

  if (wallsPayments.length === 0) return false;

  const totalDaysRequired = wallsPayments[0].daysRequired;
  const totalDaysPayed = wallsPayments.reduce((sum, payment) => {
    if (payment.issued) {
      return sum + 1;
    }
    return sum + 0;
  }, 0);

  if (stage === "first") {
    // Первый этаж готов, если оплачено больше половины дней стен
    const firstHalfDays = Math.floor(totalDaysRequired / 2);
    return totalDaysPayed >= firstHalfDays;
  }

  // Второй этаж готов, если оплачены все дни стен
  return totalDaysPayed >= totalDaysRequired;
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

// Функция для создания конфигурации слоев на основе готовности конструкций
const createConstructionLayeredConfig = (
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

  const foundationCompleted =
    paymentSchedule.filter(
      (payment) =>
        payment.construction === "Фундамент" && payment.issued === null
    ).length === 0;

  // 2. Фундамент конкретный - показывается только если выбран
  const foundationOption = selectedOptions["Фундамент"];
  if (foundationOption && !foundationCompleted) {
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
  const wallsFirstStageCompleted = isWallsStageCompleted(
    "first",
    paymentSchedule
  );

  if (wallsOption && foundationCompleted) {
    if (wallsFirstStageCompleted) {
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

  if (overlayOption && wallsFirstStageCompleted) {
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
  const wallsSecondStageCompleted = isWallsStageCompleted(
    "second",
    paymentSchedule
  );

  if (wallsOption && foundationCompleted && overlayCompleted) {
    if (wallsSecondStageCompleted) {
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

  // 6. Недострой крыши - показываем только если построены стены второго этажа, крыша начата, но еще не готова
  const roofOption = selectedOptions["Крыша"];
  //const roofCompleted = isConstructionCompleted("Крыша", paymentSchedule);
  const roofCompleted =
    paymentSchedule.filter(
      (payment) => payment.construction === "Крыша" && payment.issued === null
    ).length === 0;

  // Проверяем, что строительство крыши началось (есть хотя бы один день с issued != null и != 0)
  const roofStarted = paymentSchedule.some(
    (payment) =>
      payment.construction === "Крыша" &&
      payment.issued !== null &&
      payment.issued > 0
  );

  // Проверяем, что построены стены второго этажа (перекрытие завершено И стены завершены)
  const secondFloorWallsBuilt = overlayCompleted && wallsSecondStageCompleted;

  if (roofStarted && !roofCompleted) {
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
  if (roofOption && secondFloorWallsBuilt && roofCompleted) {
    // Готовая крыша
    const roofMap: Record<string, string> = {
      "4 Гибкая/битумная черепица": "/КРЫШАбитумная-черепица.png",
      "4 Керамическая черепица": "/КРЫШАкерамическая-черепица.png",
      "4 Металлочерепица": "/КРЫШАметаллочерепица.png",
    };
    layers.push({
      id: "roof",
      assetPath: roofMap[roofOption.type] || "/КРЫШАбитумная-черепица.png",
      zIndex: zIndex + 5,
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
    secondFloorWallsBuilt &&
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

// Типы для истории
interface RequestHistoryItem {
  periodNumber: number;
  requestedAmount: number;
  timestamp: Date;
}

interface ConstructionChangeItem {
  periodNumber: number;
  constructionType: string;
  costDifference: number;
  oldCost: number;
  newCost: number;
  timestamp: Date;
}

export default function ConstructionPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [requestAmount, setRequestAmount] = useState<string>("");
  const [showExceededPopup, setShowExceededPopup] = useState(false);
  const [showLimitsPopup, setShowLimitsPopup] = useState(false);
  const [selectedRiskSolution, setSelectedRiskSolution] = useState<
    "solution" | "alternative" | null
  >(null);
  const [isButtonsBlocked, setIsButtonsBlocked] = useState(false);
  const [isRiskSelectionBlocked, setIsRiskSelectionBlocked] = useState(false);

  // Состояния для истории
  const [requestHistory, setRequestHistory] = useState<RequestHistoryItem[]>(
    []
  );
  const [constructionChangeHistory, setConstructionChangeHistory] = useState<
    ConstructionChangeItem[]
  >([]);

  const navigate = useNavigate();

  const {
    selectedOptions,
    selectOption,
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
  let today = 0;
  if (currentPeriodIndex < periods.length) {
    today = currentPeriod.startDay;
  }
  const nextFundingText = nextFunding
    ? `Авансирование через ${nextFunding.dayIndex - today} дней + ${
        nextFunding.amount
      }`
    : "Авансирование завершено";

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

    // Суммируем запросы денег до начала строительства конструкции
    const requestsBeforeConstruction = requestHistory
      .filter((request) => {
        // Находим период запроса по номеру
        const requestPeriod = periods[request.periodNumber - 1];
        if (!requestPeriod) return false;

        // Проверяем, что запрос был до начала строительства конструкции
        return requestPeriod.startDay < firstConstructionDay;
      })
      .reduce((total, request) => total + request.requestedAmount, 0);
    console.log("🔍 requestsBeforeConstruction", requestsBeforeConstruction);

    // Получаем номинальную стоимость текущей конструкции
    const currentConstructionCost = plannedOption?.cost || 0;
    console.log("🔍 currentConstructionCost", currentConstructionCost);

    // Суммируем дельты изменений конструкций до начала строительства
    const constructionChangesBeforeConstruction = constructionChangeHistory
      .filter((change) => {
        // Находим период изменения по номеру
        const changePeriod = periods[change.periodNumber - 1];
        if (!changePeriod) return false;
        if (change.constructionType === currentCard.title) return false;

        // Проверяем, что изменение было до начала строительства конструкции
        return changePeriod.startDay < firstConstructionDay;
      })
      .reduce((total, change) => total + change.costDifference, 0);
    console.log(
      "🔍 constructionChangesBeforeConstruction",
      constructionChangesBeforeConstruction
    );

    // Суммируем решения рисков (только "solution") до начала строительства
    // ИСПРАВЛЕНИЕ: включаем только риски с решением "solution"
    const riskSolutionsBeforeConstruction = periods
      .slice(0, currentPeriodIndex)
      .filter((period) => {
        if (
          !period.risk ||
          period.isProtected ||
          period.selectedSolution !== "solution" // ИСПРАВЛЕНИЕ: было === "solution"
        )
          return false;
        return period.startDay < firstConstructionDay;
      })
      .reduce((total, period) => {
        return total + (period.risk?.cost || 0);
      }, 0);
    console.log(
      "🔍 riskSolutionsBeforeConstruction",
      riskSolutionsBeforeConstruction
    );

    // Особенная обработка для конструкций
    let additionalRequestsBeforeConstruction = 0;
    let additionalRiskSolutionsBeforeConstruction = 0;

    if (currentCard.title === "Стены") {
      // Для стен учитываем запросы денег и риски в периоды фундамента и перекрытий

      // Находим периоды фундамента (первый период строительства)
      const foundationPeriods = periods.filter((period, index) => {
        // Предполагаем, что фундамент строится в первых периодах
        return index < 3; // первые 3 периода обычно фундамент
      });

      // Находим периоды перекрытий (периоды между этапами стен)
      const overlayPeriods = periods.filter((period, index) => {
        // Перекрытия обычно строятся между первой и второй половиной стен
        return index >= 3 && index < 6; // периоды 3-5 обычно перекрытия
      });

      // Суммируем запросы денег в периоды фундамента
      const foundationRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return foundationPeriods.some(
            (fp) => fp.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      // Суммируем запросы денег в периоды перекрытий
      const overlayRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return overlayPeriods.some(
            (op) => op.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      // Суммируем риски в периоды фундамента
      const foundationRisks = foundationPeriods
        .filter(
          (period) =>
            period.risk &&
            !period.isProtected &&
            period.selectedSolution === "solution"
        )
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      // Суммируем риски в периоды перекрытий
      const overlayRisks = overlayPeriods
        .filter((period) => period.risk && !period.isProtected)
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      additionalRequestsBeforeConstruction =
        foundationRequests + overlayRequests;
      console.log("🔍 foundationRequests 888", foundationRequests);
      console.log("🔍 overlayRequests 888", overlayRequests);
      additionalRiskSolutionsBeforeConstruction =
        foundationRisks + overlayRisks;
      console.log("🔍 foundationRisks 88851", foundationRisks);
      console.log("🔍 overlayRisks 88851", overlayRisks);

      console.log(
        "🔍 walls additional requests:",
        additionalRequestsBeforeConstruction
      );
      console.log(
        "🔍 walls additional risks:",
        additionalRiskSolutionsBeforeConstruction
      );
    } else if (currentCard.title === "Перекрытие") {
      // Для перекрытия учитываем периоды фундамента и стен первого этажа

      // Находим периоды фундамента (первые периоды)
      const foundationPeriods = periods.filter((period, index) => {
        return index < 2; // первые 2 периода обычно фундамент
      });

      // Находим периоды стен первого этажа (следующие периоды)
      const wallsFirstFloorPeriods = periods.filter((period, index) => {
        return index >= 2 && index < 4; // периоды 2-3 обычно стены первого этажа
      });

      // Суммируем запросы денег в периоды фундамента
      const foundationRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return foundationPeriods.some(
            (fp) => fp.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      // Суммируем запросы денег в периоды стен первого этажа
      const wallsFirstFloorRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return wallsFirstFloorPeriods.some(
            (wp) => wp.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      // Суммируем риски в периоды фундамента
      const foundationRisks = foundationPeriods
        .filter(
          (period) =>
            period.risk &&
            !period.isProtected &&
            period.selectedSolution === "solution"
        )
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      // Суммируем риски в периоды стен первого этажа
      const wallsFirstFloorRisks = wallsFirstFloorPeriods
        .filter(
          (period) =>
            period.risk &&
            !period.isProtected &&
            period.selectedSolution === "solution"
        )
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      additionalRequestsBeforeConstruction =
        foundationRequests + wallsFirstFloorRequests;
      additionalRiskSolutionsBeforeConstruction =
        foundationRisks + wallsFirstFloorRisks;

      console.log("🔍 Перекрытие - foundation requests:", foundationRequests);
      console.log(
        "🔍 Перекрытие - walls first floor requests:",
        wallsFirstFloorRequests
      );
      console.log("🔍 Перекрытие - foundation risks:", foundationRisks);
      console.log(
        "🔍 Перекрытие - walls first floor risks:",
        wallsFirstFloorRisks
      );
    } else if (currentCard.title === "Крыша") {
      // Для крыши учитываем периоды фундамента, стен первого этажа, перекрытия и стен второго этажа

      // Находим периоды фундамента
      const foundationPeriods = periods.filter((period, index) => {
        return index < 2;
      });

      // Находим периоды стен первого этажа
      const wallsFirstFloorPeriods = periods.filter((period, index) => {
        return index >= 2 && index < 4;
      });

      // Находим периоды перекрытия
      const overlayPeriods = periods.filter((period, index) => {
        return index >= 4 && index < 5;
      });

      // Находим периоды стен второго этажа
      const wallsSecondFloorPeriods = periods.filter((period, index) => {
        return index >= 5 && index < 6;
      });

      // Суммируем запросы денег во всех предыдущих периодах
      const foundationRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return foundationPeriods.some(
            (fp) => fp.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      const wallsFirstFloorRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return wallsFirstFloorPeriods.some(
            (wp) => wp.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      const overlayRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return overlayPeriods.some(
            (op) => op.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      const wallsSecondFloorRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return wallsSecondFloorPeriods.some(
            (wp) => wp.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      // Суммируем риски во всех предыдущих периодах
      const foundationRisks = foundationPeriods
        .filter(
          (period) =>
            period.risk &&
            !period.isProtected &&
            period.selectedSolution === "solution"
        )
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      const wallsFirstFloorRisks = wallsFirstFloorPeriods
        .filter(
          (period) =>
            period.risk &&
            !period.isProtected &&
            period.selectedSolution === "solution"
        )
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      const overlayRisks = overlayPeriods
        .filter(
          (period) =>
            period.risk &&
            !period.isProtected &&
            period.selectedSolution === "solution"
        )
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      const wallsSecondFloorRisks = wallsSecondFloorPeriods
        .filter(
          (period) =>
            period.risk &&
            !period.isProtected &&
            period.selectedSolution === "solution"
        )
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      additionalRequestsBeforeConstruction =
        foundationRequests +
        wallsFirstFloorRequests +
        overlayRequests +
        wallsSecondFloorRequests;
      additionalRiskSolutionsBeforeConstruction =
        foundationRisks +
        wallsFirstFloorRisks +
        overlayRisks +
        wallsSecondFloorRisks;

      console.log("🔍 Крыша - все предыдущие периоды учтены");
    } else if (currentCard.title === "Двери и Окна") {
      // Для дверей и окон учитываем все предыдущие периоды: фундамент, стены первого этажа, перекрытие, стены второго этажа, крыша

      // Находим все периоды до текущего (все предыдущие конструкции)
      const previousPeriods = periods.filter((period, index) => {
        return index < 5; // все периоды до дверей и окон
      });

      // Суммируем запросы денег во всех предыдущих периодах
      const previousRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return previousPeriods.some(
            (pp) => pp.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      // Суммируем риски во всех предыдущих периодах
      const previousRisks = previousPeriods
        .filter(
          (period) =>
            period.risk &&
            !period.isProtected &&
            period.selectedSolution === "solution"
        )
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      additionalRequestsBeforeConstruction = previousRequests;
      additionalRiskSolutionsBeforeConstruction = previousRisks;

      console.log("🔍 Двери и Окна - все предыдущие периоды учтены");
    } else if (currentCard.title === "Благоустройство") {
      // Для благоустройства учитываем все предыдущие периоды: фундамент, стены первого этажа, перекрытие, стены второго этажа, крыша, двери и окна

      // Находим все периоды до текущего (все предыдущие конструкции)
      const previousPeriods = periods.filter((period, index) => {
        return index < 6; // все периоды до благоустройства
      });

      // Суммируем запросы денег во всех предыдущих периодах
      const previousRequests = requestHistory
        .filter((request) => {
          const requestPeriod = periods[request.periodNumber - 1];
          if (!requestPeriod) return false;
          return previousPeriods.some(
            (pp) => pp.startDay === requestPeriod.startDay
          );
        })
        .reduce((total, request) => total + request.requestedAmount, 0);

      // Суммируем риски во всех предыдущих периодах
      const previousRisks = previousPeriods
        .filter(
          (period) =>
            period.risk &&
            !period.isProtected &&
            period.selectedSolution === "solution"
        )
        .reduce((total, period) => total + (period.risk?.cost || 0), 0);

      additionalRequestsBeforeConstruction = previousRequests;
      additionalRiskSolutionsBeforeConstruction = previousRisks;

      console.log("🔍 Благоустройство - все предыдущие периоды учтены");
    }

    const totalRequestsBeforeConstruction = requestsBeforeConstruction;
    const totalRiskSolutionsBeforeConstruction =
      riskSolutionsBeforeConstruction;

    console.log(
      "🔍 riskSolutionsBeforeConstruction 8885",
      riskSolutionsBeforeConstruction
    );
    console.log(
      "🔍 additionalRiskSolutionsBeforeConstruction 8885",
      additionalRiskSolutionsBeforeConstruction
    );

    // ИСПРАВЛЕНИЕ: риски с решением "solution" должны УВЕЛИЧИВАТЬ расходы, а не вычитаться
    const paymentsBeforeConstruction =
      constructionChangesBeforeConstruction +
      totalRiskSolutionsBeforeConstruction; // ИСПРАВЛЕНИЕ: было вычитание
    console.log(
      "🔍 totalRiskSolutionsBeforeConstruction 888",
      totalRiskSolutionsBeforeConstruction
    );
    console.log(
      "🔍 constructionChangesBeforeConstruction 888",
      constructionChangesBeforeConstruction
    );
    console.log("🔍 paymentsBeforeConstruction", paymentsBeforeConstruction);

    // Добавляем номинальную стоимость текущей конструкции к запросам
    const totalIncome =
      totalRequestsBeforeConstruction + currentConstructionCost;
    console.log("🔍 totalIncome", totalIncome);

    return totalIncome - paymentsBeforeConstruction;
  };

  const advanceRemainder = getAdvanceRemainder();

  // Расчет данных для графика по текущей конструкции
  const getConstructionData = () => {
    if (!currentCard) return { planned: 0, actual: 0 };

    // Используем уже вычисленную plannedOption
    const plannedCost = plannedOption?.cost || 0;

    // Проверяем, заменил ли пользователь тип конструкции
    // Ищем последнее изменение для данной конструкции
    const constructionChanges = constructionChangeHistory.filter(
      (change) => change.constructionType === currentCard?.title
    );
    const constructionChange =
      constructionChanges[constructionChanges.length - 1];

    // Если есть изменение конструкции, используем новую стоимость, иначе - плановую
    const baseCost = constructionChange
      ? constructionChange.newCost
      : plannedCost;

    // Оценка стоимости = Базовая стоимость + Стоимость решений рисков
    const riskCosts = periods
      .filter(
        (period) =>
          period.risk &&
          period.selectedSolution === "solution" &&
          period.risk.affectedElement === currentCard?.title
      )
      .reduce((total, period) => total + (period.risk?.cost || 0), 0);

    const estimatedCost = baseCost + riskCosts;

    return { planned: plannedCost, actual: estimatedCost };
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

  // Блокируем кнопки и выбор решений на 2 секунды при рендере карточек риска/защиты
  useEffect(() => {
    if (currentRisk) {
      setIsButtonsBlocked(true);
      setIsRiskSelectionBlocked(true);

      const timer = setTimeout(() => {
        setIsButtonsBlocked(false);
        setIsRiskSelectionBlocked(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentRisk, currentPeriodIndex]);

  // Функция проверки достроенности дома
  const isHouseCompleted = useCallback(() => {
    // Получаем все уникальные типы конструкций из paymentSchedule
    const constructionTypes = [
      ...new Set(paymentSchedule.map((p) => p.construction)),
    ];

    // Проверяем каждую конструкцию на завершенность
    return constructionTypes.every((constructionType) => {
      const constructionPayments = paymentSchedule.filter(
        (payment) => payment.construction === constructionType
      );

      if (constructionPayments.length === 0) return false;

      // Проверяем, есть ли хотя бы один день где daysRequired === daysPayed
      return constructionPayments.some(
        (payment) => payment.daysRequired === payment.daysPayed
      );
    });
  }, [paymentSchedule]);

  // Функция отправки результатов на бэкенд
  const sendResultsToBackend = useCallback(async () => {
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

      // Проверяем достроенность дома
      const houseCompleted = isHouseCompleted();

      const resultData: CreateResultRequest = {
        name: projectName || "Игрок",
        planned_duration: plannedDuration,
        planned_cost: plannedCost,
        actual_duration: actualDuration,
        actual_cost: actualCost,
        is_completed: houseCompleted,
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
  }, [planStore, paymentSchedule, projectName, isHouseCompleted]);

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
  }, [isAllPeriodsCompleted, navigate, sendResultsToBackend]);

  const [tourStarted, setTourStarted] = useState(false);
  // Запускаем тур при первом посещении страницы
  useEffect(() => {
    startTour(CONSTRUCTION_TOUR);
    setTourStarted(true);
  }, []);

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
    // Получаем текущую выбранную опцию для сравнения
    const currentOption = selectedOptions[option.constructionType];

    // Выбираем новую опцию
    selectOption(option.constructionType, option);

    // Если была выбрана другая опция, записываем изменение в историю
    if (currentOption && currentOption.type !== option.type) {
      const costDifference = option.cost - currentOption.cost;
      const newChangeItem: ConstructionChangeItem = {
        periodNumber: currentPeriodIndex + 1,
        constructionType: option.constructionType,
        costDifference: costDifference,
        oldCost: currentOption.cost,
        newCost: option.cost,
        timestamp: new Date(),
      };
      setConstructionChangeHistory((prev) => [...prev, newChangeItem]);
    }
  };

  const handleRiskSolutionSelect = (solution: "solution" | "alternative") => {
    if (isRiskSelectionBlocked) return;
    setSelectedRiskSolution(solution);
  };

  const handleConfirmRiskSolution = () => {
    if (isButtonsBlocked || !currentPeriod || !selectedRiskSolution) return;

    console.log(`🏦 КУБЫШКА ПЕРЕД ВЫБОРОМ РЕШЕНИЯ: ${piggyBank} руб.`);

    // Применяем выбранное решение
    selectRiskSolution(currentPeriod.id, selectedRiskSolution);

    // Обрабатываем дни текущего периода перед переходом
    const currentPeriodDays = currentPeriod.endDay - currentPeriod.startDay + 1;
    console.log(
      `🏗️ Обработка ${currentPeriodDays} дней периода ${currentPeriodIndex + 1}`
    );

    for (let day = currentPeriod.startDay; day <= currentPeriod.endDay; day++) {
      processDay(day);
    }

    // Сбрасываем локальное состояние
    setSelectedRiskSolution(null);

    // Переходим к следующему периоду после выбора решения
    setTimeout(() => {
      moveToNextPeriod();
    }, 1000);
  };

  const updateLayeredConfig = () => {
    return createConstructionLayeredConfig(
      selectedOptions,
      paymentSchedule.filter((payment) => payment.dayIndex < 90)
    );
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
                    className={`btn-primary protection-button ${
                      isButtonsBlocked ? "blocked" : ""
                    }`}
                    disabled={isButtonsBlocked}
                    onClick={() => {
                      if (isButtonsBlocked) return;

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
                    {isButtonsBlocked
                      ? "Подождите..."
                      : "Перейти к следующему периоду"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="risk-card">
                <div className="risk-header">
                  <div className="risk-indicator">
                    <RiskIcon />
                    <div className="risk-indicator-text">
                      Риск {currentRisk.id}
                    </div>
                  </div>
                </div>

                <div className="risk-description">
                  {currentRisk.description}
                </div>

                <div className="risk-solutions">
                  <div
                    className={`solution-option ${
                      selectedRiskSolution === "solution" ? "active" : ""
                    } ${isRiskSelectionBlocked ? "blocked" : ""}`}
                    onClick={() => handleRiskSolutionSelect("solution")}
                    style={{
                      cursor: isRiskSelectionBlocked
                        ? "not-allowed"
                        : "pointer",
                      opacity: isRiskSelectionBlocked ? 0.5 : 1,
                    }}
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
                    } ${isRiskSelectionBlocked ? "blocked" : ""}`}
                    onClick={() => handleRiskSolutionSelect("alternative")}
                    style={{
                      cursor: isRiskSelectionBlocked
                        ? "not-allowed"
                        : "pointer",
                      opacity: isRiskSelectionBlocked ? 0.5 : 1,
                    }}
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
                      className={`btn-primary risk-confirm-button ${
                        isButtonsBlocked ? "blocked" : ""
                      }`}
                      disabled={isButtonsBlocked}
                      onClick={handleConfirmRiskSolution}
                    >
                      {isButtonsBlocked ? "Подождите..." : "Подтвердить"}
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
                    {(() => {
                      // Стоимость всех выбранных конструкций
                      const constructionsCost = Object.values(
                        selectedOptions
                      ).reduce(
                        (total, option) => total + (option?.cost || 0),
                        0
                      );

                      // Стоимость всех рисков с решением "solution"
                      const risksCost = periods
                        .slice(0, currentPeriodIndex)
                        .reduce((total, period) => {
                          if (
                            period.risk &&
                            !period.isProtected &&
                            period.selectedSolution === "solution"
                          ) {
                            // Проверяем, было ли принято решение "solution" для этого риска
                            // Пока используем базовую стоимость риска, если он не защищен
                            return total + (period.risk.cost || 0);
                          }
                          return total;
                        }, 0);

                      return constructionsCost + risksCost;
                    })()}
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
              placeholder="10000"
              min="1"
            />
            <button
              className="btn-request"
              onClick={() => {
                const amount = parseInt(requestAmount) || 0;
                if (amount > 0) {
                  console.log(`🏦 КУБЫШКА ПЕРЕД ЗАПРОСОМ: ${piggyBank} руб.`);
                  requestMoney(amount);

                  // Добавляем запрос в историю
                  const newRequestItem: RequestHistoryItem = {
                    periodNumber: currentPeriodIndex + 1,
                    requestedAmount: amount,
                    timestamp: new Date(),
                  };
                  setRequestHistory((prev) => [...prev, newRequestItem]);

                  setRequestAmount("");
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
                <div className="badge-title">План / Оценка</div>
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
              title="План/ Оценка стоимости"
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

            <div className="buttons"></div>
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

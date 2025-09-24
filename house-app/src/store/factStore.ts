import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConstructionOption, Risk } from "../constants";
import { RISKS } from "../constants";
import { usePlanStore } from "./store";

export interface Period {
  id: number;
  startDay: number;
  endDay: number;
  risk: Risk | null;
  selectedSolution: "solution" | "alternative" | null;
  isProtected: boolean;
}

export interface PaymentScheduleItem {
  dayIndex: number;
  amount: number;
  issued: number | null;
  construction: string | null;
  daysRequired: number;
  daysPayed: number;
  overallPrice: number;
  overallDuration: number;
}

export interface FundingPlanItem {
  dayIndex: number;
  amount: number;
}

export interface FactState {
  selectedOptions: Record<string, ConstructionOption | null>;
  budget: number;
  duration: number;
  periods: Period[];
  currentPeriodIndex: number;
  paymentSchedule: PaymentScheduleItem[];
  fundingPlan: FundingPlanItem[];
  history: PaymentScheduleItem[];
  piggyBank: number;
  planningRemainder: number;
  constructionDurationModifications: Record<string, number>;

  initializeFromPlan: () => void;
  selectOption: (constructionType: string, option: ConstructionOption) => void;
  clearSelection: (constructionType: string) => void;
  getRemainingBudget: () => number;
  getRemainingDuration: () => number;
  getTotalCost: () => number;
  getTotalDuration: () => number;
  getRiskCosts: () => number;
  getRiskDuration: () => number;
  setCurrentPeriod: (index: number) => void;
  selectRiskSolution: (
    periodId: number,
    solution: "solution" | "alternative"
  ) => void;
  generatePeriods: () => void;
  assignRandomRisk: (periodId: number) => void;
  generatePaymentSchedule: () => void;
  generateFundingPlan: () => void;
  processDay: (day: number) => void;
  requestMoney: (amount: number) => void;
  moveToNextPeriod: () => void;
  resetFact: () => void;
  recalculatePaymentSchedule: () => void;
  recalculateFundingPlan: () => void;
  recalculatePaymentScheduleForAlternative: (
    affectedElement: string,
    additionalDuration: number
  ) => void;
  recalculateFundingPlanForAlternative: (
    affectedElement: string,
    additionalDuration: number
  ) => void;
  preserveIssuedHistory: (
    newPaymentSchedule: PaymentScheduleItem[]
  ) => PaymentScheduleItem[];
  restoreFromHistory: () => void;
  addToHistory: (day: PaymentScheduleItem) => void;
  getModifiedDuration: (constructionType: string) => number;
  addDurationModification: (
    constructionType: string,
    additionalDuration: number
  ) => void;
  addIdleDays: (constructionType: string, idleDays: number) => void;
  insertDayAt: (insertDay: number, newDay: PaymentScheduleItem) => void;
  updateConstructionCost: (
    constructionType: string,
    additionalCost: number
  ) => void;
  shouldContinueProcessing: (day: number) => boolean;
}

export const useFactStore = create<FactState>()(
  persist(
    (set, get) => ({
      selectedOptions: {},
      budget: 50000,
      duration: 90,
      periods: [],
      currentPeriodIndex: 0,
      paymentSchedule: [],
      fundingPlan: [],
      history: [],
      piggyBank: 0,
      planningRemainder: 0,
      constructionDurationModifications: {},

      initializeFromPlan: () => {
        const planStore = usePlanStore.getState();
        const totalCost = Object.values(planStore.selectedOptions)
          .filter((option): option is ConstructionOption => option !== null)
          .reduce((total, option) => total + option.cost, 0);
        const planningRemainder = planStore.budget - totalCost;

        set({
          selectedOptions: { ...planStore.selectedOptions },
          budget: planStore.budget,
          duration: planStore.duration,
          piggyBank: 0,
          planningRemainder: planningRemainder,
        });

        // Генерируем планы после обновления selectedOptions
        setTimeout(() => {
          get().generatePeriods();
          get().generateFundingPlan();
          get().generatePaymentSchedule();

          // Автоматически назначаем риск на первый период
          const { periods, assignRandomRisk } = get();
          if (periods.length > 0) {
            assignRandomRisk(periods[0].id);
            //console.log(`🎲 Риск назначен на период 1 (инициализация)`)
          }
        }, 0);
      },

      selectOption: (constructionType: string, option: ConstructionOption) => {
        set((state) => ({
          selectedOptions: {
            ...state.selectedOptions,
            [constructionType]: option,
          },
        }));

        // Обновляем планы и остаток после изменения опций
        setTimeout(() => {
          const { selectedOptions, budget } = get();
          const totalCost = Object.values(selectedOptions)
            .filter((opt): opt is ConstructionOption => opt !== null)
            .reduce((total, opt) => total + opt.cost, 0);
          const planningRemainder = budget - totalCost;

          set({ planningRemainder });
          get().generateFundingPlan();
          get().generatePaymentSchedule();
        }, 0);
      },

      clearSelection: (constructionType: string) => {
        set((state) => {
          const newSelectedOptions = { ...state.selectedOptions };
          delete newSelectedOptions[constructionType];
          return { selectedOptions: newSelectedOptions };
        });
      },

      getTotalCost: () => {
        const { selectedOptions } = get();
        return Object.values(selectedOptions)
          .filter((option): option is ConstructionOption => option !== null)
          .reduce((total, option) => total + option.cost, 0);
      },

      getTotalDuration: () => {
        const { selectedOptions } = get();
        return Object.values(selectedOptions)
          .filter((option): option is ConstructionOption => option !== null)
          .reduce((total, option) => total + option.duration, 0);
      },

      getRiskCosts: () => {
        const { periods } = get();
        return periods
          .filter(
            (period) => period.risk && period.selectedSolution === "solution"
          )
          .reduce((total, period) => total + (period.risk?.cost || 0), 0);
      },

      getRiskDuration: () => {
        const { periods } = get();
        return periods
          .filter(
            (period) => period.risk && period.selectedSolution === "solution"
          )
          .reduce((total, period) => total + (period.risk?.duration || 0), 0);
      },

      getRemainingBudget: () => {
        const { budget, getTotalCost } = get();
        return budget - getTotalCost();
      },

      getRemainingDuration: () => {
        const { duration, getTotalDuration } = get();
        return duration - getTotalDuration();
      },

      setCurrentPeriod: (index: number) => {
        set({ currentPeriodIndex: index });
      },

      selectRiskSolution: (
        periodId: number,
        solution: "solution" | "alternative"
      ) => {
        const { periods } = get();
        const period = periods.find((p) => p.id === periodId);

        console.log(
          `🎯 Решение по риску: ${
            solution === "solution" ? "Решение" : "Альтернатива"
          } | Период ${periodId}`
        );

        set((state) => ({
          periods: state.periods.map((period: Period) =>
            period.id === periodId
              ? { ...period, selectedSolution: solution }
              : period
          ),
        }));

        // Обрабатываем последствия выбора решения
        if (period && period.risk) {
          if (solution === "solution") {
            // Принимаем решение - обновляем стоимость дней с затронутой конструкцией
            get().updateConstructionCost(
              period.risk.affectedElement,
              period.risk.cost
            );
            //get().recalculateFundingPlan();
          } else {
            const additionalDuration = Math.ceil(period.risk.duration);
            if (additionalDuration > 0) {
              get().recalculatePaymentScheduleForAlternative(
                period.risk.affectedElement,
                additionalDuration
              );
              //get().recalculateFundingPlanForAlternative(
              //  period.risk.affectedElement,
              //  additionalDuration
              //);
            }
          }
        }
      },

      generatePeriods: () => {
        const { getTotalDuration, getModifiedDuration, selectedOptions } =
          get();

        // Рассчитываем общую длительность с учетом всех модификаций
        let totalDuration = 0;
        Object.entries(selectedOptions).forEach(
          ([constructionType, option]) => {
            if (option) {
              const modifiedDuration = getModifiedDuration(constructionType);
              totalDuration += modifiedDuration;
            }
          }
        );

        const periodCount = 5; // Всегда 5 периодов
        const basePeriodDuration = Math.floor(totalDuration / periodCount);
        const remainder = totalDuration % periodCount;

        const periods: Period[] = [];
        let currentDay = 1;

        for (let i = 0; i < periodCount; i++) {
          // Последний период может быть чуть больше, если есть остаток
          const periodDuration =
            i === periodCount - 1
              ? basePeriodDuration + remainder
              : basePeriodDuration;

          const endDay = currentDay + periodDuration - 1;

          periods.push({
            id: i + 1,
            startDay: currentDay,
            endDay: endDay,
            risk: null,
            selectedSolution: null,
            isProtected: false,
          });

          currentDay = endDay + 1;
        }

        set({ periods });
      },

      assignRandomRisk: (periodId: number) => {
        const { selectedOptions, periods } = get();
        const period = periods.find((p) => p.id === periodId);

        if (!period) return;

        // Определяем, какая конструкция строится в этот период
        const currentDay = period.startDay;
        let currentConstructionDay = 1;
        let currentConstructionType = null;
        let currentConstructionStyle = null;

        for (const [type, option] of Object.entries(selectedOptions)) {
          if (
            option &&
            currentDay >= currentConstructionDay &&
            currentDay < currentConstructionDay + option.duration
          ) {
            currentConstructionType = type;
            // Извлекаем стиль из типа опции (например, "2 Классический стиль" -> "Классический стиль")
            currentConstructionStyle = option.type
              .split(" ")
              .slice(1)
              .join(" ");
            break;
          }
          if (option) {
            currentConstructionDay += option.duration;
          }
        }

        // Берем ВСЕ риски для данного элемента конструкции
        const availableRisks = RISKS.filter((risk) => {
          return risk.affectedElement === currentConstructionType;
        });

        if (availableRisks.length === 0) {
          console.log(`⚠️ Нет доступных рисков для ${currentConstructionType}`);
          return;
        }

        // Случайно выбираем любой риск для этого элемента
        const randomRisk =
          availableRisks[Math.floor(Math.random() * availableRisks.length)];

        // Проверяем, защищен ли пользователь от этого риска
        // Пользователь защищен, если стиль риска НЕ совпадает с выбранным стилем
        const isProtected =
          !currentConstructionStyle ||
          !randomRisk.affectedStyle
            .split(", ")
            .map((s) => s.trim())
            .includes(currentConstructionStyle);

        console.log(
          `🎲 Выбран риск ${
            randomRisk.id
          } для ${currentConstructionType} (${currentConstructionStyle}) | Защита: ${
            isProtected ? "ДА" : "НЕТ"
          }`
        );

        set((state) => ({
          periods: state.periods.map((period: Period) =>
            period.id === periodId
              ? { ...period, risk: randomRisk, isProtected }
              : period
          ),
        }));
      },

      generatePaymentSchedule: () => {
        const { selectedOptions, periods, getModifiedDuration } = get();
        const paymentSchedule: PaymentScheduleItem[] = [];

        // Создаем план выплат - распределяем стоимость по всем дням строительства
        let currentDay = 1;
        Object.entries(selectedOptions).forEach(
          ([constructionType, option]) => {
            if (option) {
              // Используем модифицированную длительность
              const modifiedDuration = getModifiedDuration(constructionType);

              // Находим риски, которые влияют на эту конструкцию
              const constructionRisks = periods.filter(
                (period) =>
                  period.risk &&
                  period.selectedSolution === "solution" &&
                  period.risk.affectedElement === constructionType
              );

              // Рассчитываем общую длительность с учетом рисков
              const totalRiskDuration = constructionRisks.reduce(
                (sum, period) => sum + (period.risk?.duration || 0),
                0
              );
              const overallDuration = modifiedDuration + totalRiskDuration;

              // Рассчитываем общую стоимость с учетом рисков
              const totalRiskCost = constructionRisks.reduce(
                (sum, period) => sum + (period.risk?.cost || 0),
                0
              );
              const overallPrice = option.cost + totalRiskCost;

              const dailyAmount = overallPrice / overallDuration;

              // Специальная логика для стен - разбиваем на два периода
              if (constructionType === "Стены") {
                const firstHalfDuration = Math.floor(overallDuration / 2);
                const secondHalfDuration = overallDuration - firstHalfDuration;
                const firstHalfPrice = Math.floor(overallPrice / 2);
                const secondHalfPrice = overallPrice - firstHalfPrice;

                // Первая половина стен
                for (let i = 0; i < firstHalfDuration; i++) {
                  paymentSchedule.push({
                    dayIndex: currentDay + i,
                    amount: Math.floor(firstHalfPrice / firstHalfDuration),
                    issued: null,
                    construction: constructionType,
                    daysRequired: overallDuration,
                    daysPayed: 0,
                    overallPrice: overallPrice,
                    overallDuration: overallDuration,
                  });
                }
                currentDay += firstHalfDuration;

                // Добавляем перекрытия между частями стен
                const ceilingOption = selectedOptions["Перекрытие"];
                if (ceilingOption) {
                  const ceilingDuration = getModifiedDuration("Перекрытие");
                  const ceilingRisks = periods.filter(
                    (period) =>
                      period.risk &&
                      period.selectedSolution === "solution" &&
                      period.risk.affectedElement === "Перекрытие"
                  );
                  const totalCeilingRiskDuration = ceilingRisks.reduce(
                    (sum, period) => sum + (period.risk?.duration || 0),
                    0
                  );
                  const totalCeilingRiskCost = ceilingRisks.reduce(
                    (sum, period) => sum + (period.risk?.cost || 0),
                    0
                  );
                  const overallCeilingDuration =
                    ceilingDuration + totalCeilingRiskDuration;
                  const overallCeilingPrice =
                    ceilingOption.cost + totalCeilingRiskCost;
                  const dailyCeilingAmount =
                    overallCeilingPrice / overallCeilingDuration;

                  for (let i = 0; i < overallCeilingDuration; i++) {
                    paymentSchedule.push({
                      dayIndex: currentDay + i,
                      amount: Math.floor(dailyCeilingAmount),
                      issued: null,
                      construction: "Перекрытие",
                      daysRequired: overallCeilingDuration,
                      daysPayed: 0,
                      overallPrice: overallCeilingPrice,
                      overallDuration: overallCeilingDuration,
                    });
                  }
                  currentDay += overallCeilingDuration;
                }

                // Вторая половина стен
                for (let i = 0; i < secondHalfDuration; i++) {
                  paymentSchedule.push({
                    dayIndex: currentDay + i,
                    amount: Math.floor(secondHalfPrice / secondHalfDuration),
                    issued: null,
                    construction: constructionType,
                    daysRequired: overallDuration,
                    daysPayed: 0,
                    overallPrice: overallPrice,
                    overallDuration: overallDuration,
                  });
                }
                currentDay += secondHalfDuration;
              } else if (constructionType !== "Перекрытие") {
                // Обычная логика для всех остальных конструкций (кроме перекрытий, которые уже обработаны в логике стен)
                for (let i = 0; i < overallDuration; i++) {
                  paymentSchedule.push({
                    dayIndex: currentDay + i,
                    amount: Math.floor(dailyAmount),
                    issued: null,
                    construction: constructionType,
                    daysRequired: overallDuration,
                    daysPayed: 0, // issued = null, значит дней оплачено 0
                    overallPrice: overallPrice,
                    overallDuration: overallDuration,
                  });
                }
                currentDay += overallDuration;
              }
            }
          }
        );

        console.log(
          `📊 График выплат сгенерирован: ${
            paymentSchedule.length
          } дней | Общая сумма: ${paymentSchedule.reduce(
            (sum, p) => sum + p.amount,
            0
          )} руб.`
        );
        set({ paymentSchedule });

        // Восстанавливаем данные из истории
        get().restoreFromHistory();
      },

      generateFundingPlan: () => {
        const { selectedOptions, getModifiedDuration } = get();
        const fundingPlan: FundingPlanItem[] = [];

        // Создаем план финансирования - начисления в первый день строительства каждого элемента
        let currentDay = 1;
        Object.entries(selectedOptions).forEach(
          ([constructionType, option]) => {
            if (option) {
              const modifiedDuration = getModifiedDuration(constructionType);

              // Специальная логика для стен - разбиваем на два периода
              if (constructionType === "Стены") {
                const firstHalfDuration = Math.floor(modifiedDuration / 2);
                const secondHalfDuration = modifiedDuration - firstHalfDuration;

                // Первая половина стен
                fundingPlan.push({
                  dayIndex: currentDay,
                  amount: Math.floor(option.cost / 2),
                });
                currentDay += firstHalfDuration;

                // Добавляем перекрытия между частями стен
                const ceilingOption = selectedOptions["Перекрытие"];
                if (ceilingOption) {
                  fundingPlan.push({
                    dayIndex: currentDay,
                    amount: ceilingOption.cost,
                  });
                  currentDay += getModifiedDuration("Перекрытие");
                }

                // Вторая половина стен
                fundingPlan.push({
                  dayIndex: currentDay,
                  amount: option.cost - Math.floor(option.cost / 2),
                });
                currentDay += secondHalfDuration;
              } else if (constructionType !== "Перекрытие") {
                // Обычная логика для всех остальных конструкций (кроме перекрытий, которые уже обработаны в логике стен)
                fundingPlan.push({
                  dayIndex: currentDay,
                  amount: option.cost,
                });
                currentDay += modifiedDuration;
              }
            }
          }
        );

        console.log(
          `💰 План финансирования сгенерирован: ${
            fundingPlan.length
          } траншей | Общая сумма: ${fundingPlan.reduce(
            (sum, f) => sum + f.amount,
            0
          )} руб.`
        );
        set({ fundingPlan });
      },

      processDay: (day: number) => {
        const {
          fundingPlan,
          piggyBank,
          paymentSchedule,
          periods,
          currentPeriodIndex,
        } = get();

        console.log(`📅 Обработка дня ${day}`);
        console.log(`🏦 КУБЫШКА ДО ОПЕРАЦИЙ: ${piggyBank} руб.`);

        // Зачисляем деньги по плану финансирования
        const dayFunding = fundingPlan.filter(
          (funding) => funding.dayIndex === day
        );
        const totalIncoming = dayFunding.reduce(
          (sum, funding) => sum + funding.amount,
          0
        );

        if (totalIncoming > 0) {
          console.log(
            `💰 ПОСТУПЛЕНИЕ В КУБЫШКУ: +${totalIncoming} руб. (день ${day})`
          );
          console.log(
            `🏦 КУБЫШКА ПОСЛЕ ПОСТУПЛЕНИЯ: ${piggyBank + totalIncoming} руб.`
          );
        }

        // Обновляем кубышку
        set({ piggyBank: piggyBank + totalIncoming });
        console.log(`🏦 КУБЫШКА ОБНОВЛЕНА: ${piggyBank + totalIncoming} руб.`);

        // Находим записи в paymentSchedule для этого дня
        const dayPayments = paymentSchedule.filter(
          (payment) => payment.dayIndex === day
        );

        if (dayPayments.length === 0) {
          // Проверяем, нужно ли продолжать обработку
          if (get().shouldContinueProcessing(day)) {
            console.log(
              `📅 Продолжаем обработку после последнего периода (день ${day})`
            );
            return;
          }

          console.log(`⚠️ Нет записей в графике выплат для дня ${day}`);
          return;
        }

        // Обрабатываем каждую запись для этого дня
        const currentPiggyBank = get().piggyBank;

        let constructionsNeedingIdleDay: string[] = [];

        set((state) => {
          const newPaymentSchedule = state.paymentSchedule.map((payment) => {
            if (payment.dayIndex === day && payment.issued === null) {
              const requiredMoney = payment.amount;
              const isIdle = currentPiggyBank < requiredMoney;
              const issuedMoney = isIdle ? 0 : requiredMoney;

              console.log(
                `💳 ТРЕБУЕТСЯ: ${requiredMoney} руб. | ВЫДАНО: ${issuedMoney} руб. | ПРОСТОЙ: ${
                  isIdle ? "ДА" : "НЕТ"
                }`
              );

              if (issuedMoney > 0) {
                console.log(
                  `💸 СПИСАНИЕ С КУБЫШКИ: -${issuedMoney} руб. (день ${day})`
                );
              }

              // Рассчитываем дни оплаты только если есть выдача денег
              let newDaysPayed = 0;
              if (issuedMoney > 0) {
                // Считаем количество дней строительства (включая текущий день)
                const constructionPayments = state.paymentSchedule
                  .filter(
                    (p) =>
                      p.construction === payment.construction &&
                      p.dayIndex <= day
                  )
                  .sort((a, b) => a.dayIndex - b.dayIndex);
                const constructionZeroPayments = constructionPayments.filter(
                  (p) => p.issued === 0
                );

                newDaysPayed =
                  constructionPayments.length - constructionZeroPayments.length;
                console.log(
                  `📈 ПРОГРЕСС: ${newDaysPayed}/${payment.overallDuration} дней оплачено (конструкция ${payment.construction})`
                );

                // Объясняем логику строительства
                if (payment.construction === "Фундамент" && newDaysPayed > 10) {
                  console.log(
                    `🏗️ ЛОГИКА СТРОИТЕЛЬСТВА: Фундамент построен на ${newDaysPayed} дней (больше 100%) - это означает, что фундамент был недостроен, потом начались стены, а затем фундамент достроили`
                  );
                } else if (
                  payment.construction === "Стены" &&
                  newDaysPayed > 0
                ) {
                  console.log(
                    `🏗️ ЛОГИКА СТРОИТЕЛЬСТВА: Начато строительство стен (${newDaysPayed} дней оплачено) - это происходит после недостроенного фундамента`
                  );
                }
              } else if (issuedMoney === 0) {
                // Простой - сохраняем предыдущее количество оплаченных дней
                const constructionPayments = state.paymentSchedule
                  .filter(
                    (p) =>
                      p.construction === payment.construction &&
                      p.dayIndex < day
                  )
                  .sort((a, b) => b.dayIndex - a.dayIndex);

                if (constructionPayments.length > 0) {
                  const lastPayment = constructionPayments[0];
                  if (lastPayment.issued !== null) {
                    newDaysPayed = lastPayment.daysPayed;
                    console.log(
                      `⏸️ ПРОСТОЙ: дней оплачено сохранено ${newDaysPayed} (конструкция ${payment.construction})`
                    );
                  }
                }

                // Помечаем конструкцию для добавления дня достройки
                if (
                  !constructionsNeedingIdleDay.includes(payment.construction)
                ) {
                  constructionsNeedingIdleDay.push(payment.construction);
                }
              }

              const updatedPayment = {
                ...payment,
                issued: issuedMoney,
                daysPayed: newDaysPayed,
              };

              // Добавляем в историю
              get().addToHistory(updatedPayment);

              return updatedPayment;
            }
            return payment;
          });

          // Обновляем кубышку после всех операций
          const totalIssued = dayPayments.reduce((sum, payment) => {
            if (payment.issued === null) {
              const requiredMoney = payment.amount;
              const isIdle = currentPiggyBank < requiredMoney;
              const issuedMoney = isIdle ? 0 : requiredMoney;
              return sum + issuedMoney;
            }
            return sum + payment.issued;
          }, 0);

          console.log(
            `🏦 КУБЫШКА ПОСЛЕ СПИСАНИЯ: ${currentPiggyBank - totalIssued} руб.`
          );

          return {
            paymentSchedule: newPaymentSchedule,
            piggyBank: currentPiggyBank - totalIssued,
          };
        });

        // Добавляем дни достройки для конструкций с простом
        if (constructionsNeedingIdleDay.length > 0) {
          constructionsNeedingIdleDay.forEach((constructionType) => {
            get().addIdleDays(constructionType, 1);
          });
        }
      },

      requestMoney: (amount: number) => {
        const { planningRemainder, piggyBank } = get();
        if (amount <= planningRemainder) {
          console.log(`🏦 КУБЫШКА ДО ЗАПРОСА: ${piggyBank} руб.`);
          console.log(`💰 ЗАПРОС ДОПОЛНИТЕЛЬНЫХ СРЕДСТВ: +${amount} руб.`);
          console.log(`🏦 КУБЫШКА ПОСЛЕ ЗАПРОСА: ${piggyBank + amount} руб.`);

          set((state) => ({
            piggyBank: state.piggyBank + amount,
            planningRemainder: state.planningRemainder - amount,
          }));
        } else {
          console.log(
            `❌ ЗАПРОС ОТКЛОНЕН: недостаточно средств в планируемом остатке (${planningRemainder} руб.)`
          );
        }
      },

      moveToNextPeriod: () => {
        const {
          currentPeriodIndex,
          periods,
          assignRandomRisk,
          paymentSchedule,
        } = get();

        // Переходим к следующему периоду
        const nextPeriodIndex = currentPeriodIndex + 1;

        console.log(`🔄 Переход к периоду ${nextPeriodIndex + 1}`);

        set({
          currentPeriodIndex: nextPeriodIndex,
        });

        // Назначаем риск на новый период только если он существует
        if (nextPeriodIndex < periods.length) {
          const nextPeriod = periods[nextPeriodIndex];
          if (nextPeriod) {
            assignRandomRisk(nextPeriod.id);
            console.log(`🎲 Риск назначен на период ${nextPeriodIndex + 1}`);
          }
        } else {
          // Если это был последний период, продолжаем обработку до конца paymentSchedule
          const maxDayInSchedule = Math.max(
            ...paymentSchedule.map((p) => p.dayIndex)
          );
          console.log(
            `📅 Последний период завершен, продолжаем обработку до дня ${maxDayInSchedule}`
          );

          // Автоматически обрабатываем все оставшиеся дни
          const currentPeriod = periods[periods.length - 1];
          if (currentPeriod) {
            const startDay = currentPeriod.endDay + 1;
            for (let day = startDay; day <= maxDayInSchedule; day++) {
              console.log(
                `🔄 Автоматическая обработка дня ${day} после последнего периода`
              );
              get().processDay(day);
            }
          }
        }
      },

      resetFact: () => {
        set({
          selectedOptions: {},
          budget: 50000,
          duration: 90,
          periods: [],
          currentPeriodIndex: 0,
          paymentSchedule: [],
          fundingPlan: [],
          history: [],
          piggyBank: 0,
          planningRemainder: 0,
          constructionDurationModifications: {},
        });
      },

      recalculatePaymentSchedule: () => {
        const {
          selectedOptions,
          periods,
          currentPeriodIndex,
          paymentSchedule,
          history,
        } = get();

        // Находим текущий период
        const currentPeriod = periods[currentPeriodIndex];
        if (!currentPeriod) {
          console.log("❌ Текущий период не найден");
          return;
        }

        const startDay = currentPeriod.startDay;
        console.log(
          `📊 Пересчет графика выплат с дня ${startDay} (период ${
            currentPeriodIndex + 1
          })`
        );

        // Сохраняем все записи до дня начала периода
        const preservedPayments = paymentSchedule.filter(
          (payment) => payment.dayIndex < startDay
        );

        // Создаем новый график начиная с дня начала периода
        const newPayments: PaymentScheduleItem[] = [];
        let currentDay = startDay;

        Object.entries(selectedOptions).forEach(
          ([constructionType, option]) => {
            if (option) {
              // Находим риски, которые влияют на эту конструкцию
              const constructionRisks = periods.filter(
                (period) =>
                  period.risk &&
                  period.selectedSolution === "solution" &&
                  period.risk.affectedElement === constructionType
              );

              const overallDuration = option.duration; // пользователь деньгами порешал, ебаный его рот, никаких добавочных дней

              // Рассчитываем общую стоимость с учетом рисков
              const totalRiskCost = constructionRisks.reduce(
                (sum, period) => sum + (period.risk?.cost || 0),
                0
              );
              const overallPrice = option.cost + totalRiskCost;

              // Специальная логика для стен - разбиваем на два периода
              if (constructionType === "Стены") {
                const firstHalfDuration = Math.floor(overallDuration / 2);
                const secondHalfDuration = overallDuration - firstHalfDuration;
                const firstHalfPrice = Math.floor(overallPrice / 2);
                const secondHalfPrice = overallPrice - firstHalfPrice;

                // Первая половина стен
                for (let i = 0; i < firstHalfDuration; i++) {
                  newPayments.push({
                    dayIndex: currentDay + i,
                    amount: Math.floor(firstHalfPrice / firstHalfDuration),
                    issued: null,
                    construction: constructionType,
                    daysRequired: overallDuration,
                    daysPayed: 0,
                    overallPrice: overallPrice,
                    overallDuration: overallDuration,
                  });
                }
                currentDay += firstHalfDuration;

                // Добавляем перекрытия между частями стен
                const ceilingOption = selectedOptions["Перекрытие"];
                if (ceilingOption) {
                  const ceilingDuration = ceilingOption.duration;
                  const ceilingRisks = periods.filter(
                    (period) =>
                      period.risk &&
                      period.selectedSolution === "solution" &&
                      period.risk.affectedElement === "Перекрытие"
                  );
                  const totalCeilingRiskDuration = ceilingRisks.reduce(
                    (sum, period) => sum + (period.risk?.duration || 0),
                    0
                  );
                  const totalCeilingRiskCost = ceilingRisks.reduce(
                    (sum, period) => sum + (period.risk?.cost || 0),
                    0
                  );
                  const overallCeilingDuration =
                    ceilingDuration + totalCeilingRiskDuration;
                  const overallCeilingPrice =
                    ceilingOption.cost + totalCeilingRiskCost;
                  const dailyCeilingAmount =
                    overallCeilingPrice / overallCeilingDuration;

                  for (let i = 0; i < overallCeilingDuration; i++) {
                    newPayments.push({
                      dayIndex: currentDay + i,
                      amount: Math.floor(dailyCeilingAmount),
                      issued: null,
                      construction: "Перекрытие",
                      daysRequired: overallCeilingDuration,
                      daysPayed: 0,
                      overallPrice: overallCeilingPrice,
                      overallDuration: overallCeilingDuration,
                    });
                  }
                  currentDay += overallCeilingDuration;
                }

                // Вторая половина стен
                for (let i = 0; i < secondHalfDuration; i++) {
                  newPayments.push({
                    dayIndex: currentDay + i,
                    amount: Math.floor(secondHalfPrice / secondHalfDuration),
                    issued: null,
                    construction: constructionType,
                    daysRequired: overallDuration,
                    daysPayed: 0,
                    overallPrice: overallPrice,
                    overallDuration: overallDuration,
                  });
                }
                currentDay += secondHalfDuration;
              } else if (constructionType !== "Перекрытие") {
                // Обычная логика для всех остальных конструкций (кроме перекрытий)
                const dailyAmount = overallPrice / overallDuration;
                for (let i = 0; i < overallDuration; i++) {
                  newPayments.push({
                    dayIndex: currentDay + i,
                    amount: Math.floor(dailyAmount),
                    issued: null,
                    construction: constructionType,
                    daysRequired: overallDuration,
                    daysPayed: 0,
                    overallPrice: overallPrice,
                    overallDuration: overallDuration,
                  });
                }
                currentDay += overallDuration;
              }
            }
          }
        );

        // Объединяем сохраненные и новые записи
        let updatedPaymentSchedule = [...preservedPayments, ...newPayments];

        // Восстанавливаем данные из истории
        const historyMap = new Map<number, PaymentScheduleItem>();
        history.forEach((day) => {
          historyMap.set(day.dayIndex, day);
        });

        // Заменяем записи в paymentSchedule на записи из истории
        updatedPaymentSchedule = updatedPaymentSchedule.map((payment) => {
          const historyDay = historyMap.get(payment.dayIndex);
          return historyDay || payment;
        });

        console.log(
          `📊 График выплат пересчитан: сохранено ${preservedPayments.length} записей, добавлено ${newPayments.length} новых`
        );
        console.log(`🔄 Восстановлено из истории: ${historyMap.size} записей`);
        set({ paymentSchedule: updatedPaymentSchedule });
      },

      recalculateFundingPlan: () => {
        const { selectedOptions, periods, getModifiedDuration } = get();
        const fundingPlan: FundingPlanItem[] = [];

        // Создаем новый план финансирования БЕЗ учета рисков
        let currentDay = 1;
        Object.entries(selectedOptions).forEach(
          ([constructionType, option]) => {
            if (option) {
              const modifiedDuration = getModifiedDuration(constructionType);

              // Специальная логика для стен - разбиваем на два периода
              if (constructionType === "Стены") {
                const firstHalfDuration = Math.floor(modifiedDuration / 2);
                const secondHalfDuration = modifiedDuration - firstHalfDuration;

                // Первая половина стен
                fundingPlan.push({
                  dayIndex: currentDay,
                  amount: Math.floor(option.cost / 2),
                });
                currentDay += firstHalfDuration;

                // Добавляем перекрытия между частями стен
                const ceilingOption = selectedOptions["Перекрытие"];
                if (ceilingOption) {
                  fundingPlan.push({
                    dayIndex: currentDay,
                    amount: ceilingOption.cost,
                  });
                  currentDay += getModifiedDuration("Перекрытие");
                }

                // Вторая половина стен
                fundingPlan.push({
                  dayIndex: currentDay,
                  amount: option.cost - Math.floor(option.cost / 2),
                });
                currentDay += secondHalfDuration;
              } else if (constructionType !== "Перекрытие") {
                // Обычная логика для всех остальных конструкций (кроме перекрытий, которые уже обработаны в логике стен)
                fundingPlan.push({
                  dayIndex: currentDay,
                  amount: option.cost,
                });
                currentDay += modifiedDuration;
              }
            }
          }
        );

        console.log(
          `💰 План финансирования пересчитан БЕЗ учета рисков: ${
            fundingPlan.length
          } траншей | Общая сумма: ${fundingPlan.reduce(
            (sum, f) => sum + f.amount,
            0
          )} руб.`
        );
        set({ fundingPlan });
      },

      recalculatePaymentScheduleForAlternative: (
        affectedElement: string,
        additionalDuration: number
      ) => {
        const {
          selectedOptions,
          addDurationModification,
          getModifiedDuration,
        } = get();

        // Сохраняем модификацию длительности
        addDurationModification(affectedElement, additionalDuration);

        // Создаем новый график выплат
        const newPaymentSchedule: PaymentScheduleItem[] = [];
        let newCurrentDay = 1;

        for (const [type, option] of Object.entries(selectedOptions)) {
          if (option) {
            const constructionDuration = getModifiedDuration(type);
            const constructionCost = option.cost;

            // Специальная логика для стен - разбиваем на два периода
            if (type === "Стены") {
              const firstHalfDuration = Math.floor(constructionDuration / 2);
              const secondHalfDuration =
                constructionDuration - firstHalfDuration;
              const firstHalfPrice = Math.floor(constructionCost / 2);
              const secondHalfPrice = constructionCost - firstHalfPrice;

              // Первая половина стен
              for (let i = 0; i < firstHalfDuration; i++) {
                newPaymentSchedule.push({
                  dayIndex: newCurrentDay + i,
                  amount: Math.floor(firstHalfPrice / firstHalfDuration),
                  issued: null,
                  construction: type,
                  daysRequired: constructionDuration,
                  daysPayed: 0,
                  overallPrice: constructionCost,
                  overallDuration: constructionDuration,
                });
              }
              newCurrentDay += firstHalfDuration;

              // Добавляем перекрытия между частями стен
              const ceilingOption = selectedOptions["Перекрытие"];
              if (ceilingOption) {
                const ceilingDuration = getModifiedDuration("Перекрытие");
                const dailyCeilingAmount = ceilingOption.cost / ceilingDuration;

                for (let i = 0; i < ceilingDuration; i++) {
                  newPaymentSchedule.push({
                    dayIndex: newCurrentDay + i,
                    amount: Math.floor(dailyCeilingAmount),
                    issued: null,
                    construction: "Перекрытие",
                    daysRequired: ceilingDuration,
                    daysPayed: 0,
                    overallPrice: ceilingOption.cost,
                    overallDuration: ceilingDuration,
                  });
                }
                newCurrentDay += ceilingDuration;
              }

              // Вторая половина стен
              for (let i = 0; i < secondHalfDuration; i++) {
                newPaymentSchedule.push({
                  dayIndex: newCurrentDay + i,
                  amount: Math.floor(secondHalfPrice / secondHalfDuration),
                  issued: null,
                  construction: type,
                  daysRequired: constructionDuration,
                  daysPayed: 0,
                  overallPrice: constructionCost,
                  overallDuration: constructionDuration,
                });
              }
              newCurrentDay += secondHalfDuration;
            } else if (type !== "Перекрытие") {
              // Обычная логика для всех остальных конструкций (кроме перекрытий)
              const dailyAmount = constructionCost / constructionDuration;
              for (let i = 0; i < constructionDuration; i++) {
                newPaymentSchedule.push({
                  dayIndex: newCurrentDay + i,
                  amount: Math.floor(dailyAmount),
                  issued: null,
                  construction: type,
                  daysRequired: constructionDuration,
                  daysPayed: 0, // issued = null, значит дней оплачено 0
                  overallPrice: constructionCost,
                  overallDuration: constructionDuration,
                });
              }
              newCurrentDay += constructionDuration;
            }
          }
        }

        console.log(
          `📊 График выплат пересчитан для альтернативы: +${additionalDuration} дней для ${affectedElement}`
        );

        // Сохраняем историю issued значений
        const updatedPaymentSchedule =
          get().preserveIssuedHistory(newPaymentSchedule);
        set({ paymentSchedule: updatedPaymentSchedule });

        // Восстанавливаем данные из истории
        get().restoreFromHistory();
      },

      recalculateFundingPlanForAlternative: (
        affectedElement: string,
        additionalDuration: number
      ) => {
        const {
          selectedOptions,
          addDurationModification,
          getModifiedDuration,
        } = get();

        // Сохраняем модификацию длительности
        addDurationModification(affectedElement, additionalDuration);

        // Создаем новый план финансирования БЕЗ учета рисков
        const newFundingPlan: FundingPlanItem[] = [];
        let newCurrentDay = 1;

        for (const [type, option] of Object.entries(selectedOptions)) {
          if (option) {
            const constructionDuration = getModifiedDuration(type);

            // Специальная логика для стен - разбиваем на два периода
            if (type === "Стены") {
              const firstHalfDuration = Math.floor(constructionDuration / 2);
              const secondHalfDuration =
                constructionDuration - firstHalfDuration;

              // Первая половина стен
              newFundingPlan.push({
                dayIndex: newCurrentDay,
                amount: Math.floor(option.cost / 2),
              });
              newCurrentDay += firstHalfDuration;

              // Добавляем перекрытия между частями стен
              const ceilingOption = selectedOptions["Перекрытие"];
              if (ceilingOption) {
                newFundingPlan.push({
                  dayIndex: newCurrentDay,
                  amount: ceilingOption.cost,
                });
                newCurrentDay += getModifiedDuration("Перекрытие");
              }

              // Вторая половина стен
              newFundingPlan.push({
                dayIndex: newCurrentDay,
                amount: option.cost - Math.floor(option.cost / 2),
              });
              newCurrentDay += secondHalfDuration;
            } else if (type !== "Перекрытие") {
              // Обычная логика для всех остальных конструкций (кроме перекрытий, которые уже обработаны в логике стен)
              newFundingPlan.push({
                dayIndex: newCurrentDay,
                amount: option.cost,
              });
              newCurrentDay += constructionDuration;
            }
          }
        }

        console.log(
          `💰 План финансирования пересчитан для альтернативы БЕЗ учета рисков: ${affectedElement} +${additionalDuration} дней`
        );
        set({ fundingPlan: newFundingPlan });
      },

      preserveIssuedHistory: (newPaymentSchedule: PaymentScheduleItem[]) => {
        const { paymentSchedule: currentPaymentSchedule } = get();

        // Создаем карту существующих issued значений по dayIndex
        const issuedHistory = new Map<number, number>();
        currentPaymentSchedule.forEach((payment) => {
          if (payment.issued !== null) {
            issuedHistory.set(payment.dayIndex, payment.issued);
          }
        });

        // Применяем сохраненные issued значения к новому графику
        const updatedPaymentSchedule = newPaymentSchedule.map((payment) => {
          const savedIssued = issuedHistory.get(payment.dayIndex);
          if (savedIssued !== undefined) {
            return { ...payment, issued: savedIssued };
          }
          return payment;
        });

        console.log(
          `📋 Сохранена история issued значений: ${issuedHistory.size} записей`
        );
        return updatedPaymentSchedule;
      },

      getModifiedDuration: (constructionType: string) => {
        const { selectedOptions, constructionDurationModifications } = get();
        const option = selectedOptions[constructionType];
        if (!option) return 0;

        const baseDuration = option.duration;
        const modification =
          constructionDurationModifications[constructionType] || 0;
        return baseDuration + modification;
      },

      addDurationModification: (
        constructionType: string,
        additionalDuration: number
      ) => {
        set((state) => ({
          constructionDurationModifications: {
            ...state.constructionDurationModifications,
            [constructionType]:
              (state.constructionDurationModifications[constructionType] || 0) +
              additionalDuration,
          },
        }));
        console.log(
          `⏱️ Модификация длительности ${constructionType}: +${additionalDuration} дней (общее: +${
            (get().constructionDurationModifications[constructionType] || 0) +
            additionalDuration
          })`
        );
      },

      insertDayAt: (insertDay: number, newDay: PaymentScheduleItem) => {
        const { paymentSchedule } = get();
        const newPaymentSchedule = [...paymentSchedule];

        // Сдвигаем ВСЕ дни с индексом >= insertDay на +1
        const shiftedSchedule = newPaymentSchedule.map((payment) => {
          if (payment.dayIndex >= insertDay) {
            return { ...payment, dayIndex: payment.dayIndex + 1 };
          }
          return payment;
        });

        // Вставляем новый день
        shiftedSchedule.push(newDay);

        // Сортируем по dayIndex
        shiftedSchedule.sort((a, b) => a.dayIndex - b.dayIndex);

        console.log(
          `📅 Вставлен день ${insertDay} для ${newDay.construction}, сдвинуты ВСЕ дни >= ${insertDay}`
        );
        set({ paymentSchedule: shiftedSchedule });
      },

      addIdleDays: (constructionType: string, idleDays: number) => {
        const { paymentSchedule, selectedOptions } = get();
        const option = selectedOptions[constructionType];
        if (!option) return;

        // Находим последний день строительства этой конструкции
        const constructionPayments = paymentSchedule
          .filter((p) => p.construction === constructionType)
          .sort((a, b) => b.dayIndex - a.dayIndex);

        if (constructionPayments.length === 0) return;

        const lastDay = constructionPayments[0].dayIndex;
        const insertDay = lastDay + 1; // Вставляем сразу после последнего дня

        // Используем данные из последней записи для консистентности
        const lastPayment = constructionPayments[0];

        // Создаем новый день для достройки конструкции
        const newDay: PaymentScheduleItem = {
          dayIndex: insertDay,
          amount: lastPayment.amount, // Используем ту же дневную сумму
          issued: null, // Не обработан
          construction: constructionType,
          daysRequired: lastPayment.daysRequired,
          daysPayed: lastPayment.daysPayed, // Сохраняем прогресс
          overallPrice: lastPayment.overallPrice,
          overallDuration: lastPayment.overallDuration,
        };

        // Вставляем день с сдвигом индексов
        get().insertDayAt(insertDay, newDay);

        console.log(
          `⏸️ Добавлен день достройки для ${constructionType} (день ${insertDay})`
        );
      },

      addToHistory: (day: PaymentScheduleItem) => {
        set((state) => {
          // Удаляем старую запись с таким же dayIndex если есть
          const filteredHistory = state.history.filter(
            (h) => h.dayIndex !== day.dayIndex
          );
          return {
            history: [...filteredHistory, day],
          };
        });
        console.log(`📝 Добавлено в историю: день ${day.dayIndex}`);
      },

      restoreFromHistory: () => {
        const { paymentSchedule, history } = get();

        // Создаем карту истории по dayIndex
        const historyMap = new Map<number, PaymentScheduleItem>();
        history.forEach((day) => {
          historyMap.set(day.dayIndex, day);
        });

        // Заменяем записи в paymentSchedule на записи из истории
        const restoredPaymentSchedule = paymentSchedule.map((payment) => {
          const historyDay = historyMap.get(payment.dayIndex);
          return historyDay || payment;
        });

        console.log(`🔄 Восстановлено из истории: ${historyMap.size} записей`);
        set({ paymentSchedule: restoredPaymentSchedule });
      },

      updateConstructionCost: (
        constructionType: string,
        additionalCost: number
      ) => {
        const { paymentSchedule } = get();

        console.log(
          `💰 Обновление стоимости ${constructionType}: +${additionalCost} руб.`
        );

        set((state) => ({
          paymentSchedule: state.paymentSchedule.map((payment) => {
            if (payment.construction === constructionType) {
              const newOverallPrice = payment.overallPrice + additionalCost;
              const newDailyAmount = Math.floor(
                newOverallPrice / payment.overallDuration
              );

              console.log(
                `📊 День ${payment.dayIndex}: ${payment.amount} → ${newDailyAmount} руб.`
              );

              return {
                ...payment,
                amount: newDailyAmount,
                overallPrice: newOverallPrice,
              };
            }
            return payment;
          }),
        }));
      },

      shouldContinueProcessing: (day: number) => {
        const { paymentSchedule, periods, currentPeriodIndex } = get();

        // Находим максимальный день в paymentSchedule
        const maxDayInSchedule = Math.max(
          ...paymentSchedule.map((p) => p.dayIndex)
        );

        // Если день больше максимального дня в расписании, обработка не нужна
        if (day > maxDayInSchedule) {
          return false;
        }

        // Если это последний период и день больше или равен концу последнего периода
        const isLastPeriod = currentPeriodIndex >= periods.length - 1;
        if (isLastPeriod && periods.length > 0) {
          const lastPeriod = periods[periods.length - 1];
          if (lastPeriod && day >= lastPeriod.endDay) {
            // Продолжаем обработку до конца paymentSchedule
            return day <= maxDayInSchedule;
          }
        }

        // Для обычных периодов проверяем, есть ли записи для этого дня
        const dayPayments = paymentSchedule.filter((p) => p.dayIndex === day);
        return dayPayments.length > 0;
      },
    }),
    {
      name: "fact-storage",
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);

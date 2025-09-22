import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConstructionOption, Risk } from '../constants'
import { RISKS } from '../constants'
import { usePlanStore } from './store'

export interface Period {
  id: number
  startDay: number
  endDay: number
  risk: Risk | null
  selectedSolution: 'solution' | 'alternative' | null
  isProtected: boolean
}

export interface PaymentScheduleItem {
  dayIndex: number
  amount: number
  issued: number | null
  construction: string | null
  procent: number
  overallPrice: number
  overallDuration: number
}

export interface FundingPlanItem {
  dayIndex: number
  amount: number
}


export interface FactState {
  selectedOptions: Record<string, ConstructionOption | null>
  budget: number
  duration: number
  periods: Period[]
  currentPeriodIndex: number
  paymentSchedule: PaymentScheduleItem[]
  fundingPlan: FundingPlanItem[]
  history: PaymentScheduleItem[]
  piggyBank: number
  planningRemainder: number
  constructionDurationModifications: Record<string, number>
  
  initializeFromPlan: () => void
  selectOption: (constructionType: string, option: ConstructionOption) => void
  clearSelection: (constructionType: string) => void
  getRemainingBudget: () => number
  getRemainingDuration: () => number
  getTotalCost: () => number
  getTotalDuration: () => number
  getRiskCosts: () => number
  getRiskDuration: () => number
  setCurrentPeriod: (index: number) => void
  selectRiskSolution: (periodId: number, solution: 'solution' | 'alternative') => void
  generatePeriods: () => void
  assignRandomRisk: (periodId: number) => void
  generatePaymentSchedule: () => void
  generateFundingPlan: () => void
  processDay: (day: number) => void
  requestMoney: (amount: number) => void
  moveToNextPeriod: () => void
  resetFact: () => void
  recalculatePaymentSchedule: () => void
  recalculateFundingPlan: () => void
  recalculatePaymentScheduleForAlternative: (affectedElement: string, additionalDuration: number) => void
  recalculateFundingPlanForAlternative: (affectedElement: string, additionalDuration: number) => void
  preserveIssuedHistory: (newPaymentSchedule: PaymentScheduleItem[]) => PaymentScheduleItem[]
  restoreFromHistory: () => void
  addToHistory: (day: PaymentScheduleItem) => void
  getModifiedDuration: (constructionType: string) => number
  addDurationModification: (constructionType: string, additionalDuration: number) => void
  addIdleDays: (constructionType: string, idleDays: number) => void
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
        const planStore = usePlanStore.getState()
        const totalCost = Object.values(planStore.selectedOptions)
          .filter((option): option is ConstructionOption => option !== null)
          .reduce((total, option) => total + option.cost, 0)
        const planningRemainder = planStore.budget - totalCost
        
        set({
          selectedOptions: { ...planStore.selectedOptions },
          budget: planStore.budget,
          duration: planStore.duration,
          piggyBank: 0,
          planningRemainder: planningRemainder
        })
        
        // Генерируем планы после обновления selectedOptions
        setTimeout(() => {
          get().generatePeriods()
          get().generateFundingPlan()
          get().generatePaymentSchedule()
          
          // Автоматически назначаем риск на первый период
          const { periods, assignRandomRisk } = get()
          if (periods.length > 0) {
            assignRandomRisk(periods[0].id)
            console.log(`🎲 Риск назначен на период 1 (инициализация)`)
          }
        }, 0)
      },
      
      selectOption: (constructionType: string, option: ConstructionOption) => {
        set((state) => ({
          selectedOptions: {
            ...state.selectedOptions,
            [constructionType]: option
          }
        }))
        
        // Обновляем планы и остаток после изменения опций
        setTimeout(() => {
          const { selectedOptions, budget } = get()
          const totalCost = Object.values(selectedOptions)
            .filter((opt): opt is ConstructionOption => opt !== null)
            .reduce((total, opt) => total + opt.cost, 0)
          const planningRemainder = budget - totalCost
          
          set({ planningRemainder })
          get().generateFundingPlan()
          get().generatePaymentSchedule()
        }, 0)
      },
      
      clearSelection: (constructionType: string) => {
        set((state) => {
          const newSelectedOptions = { ...state.selectedOptions }
          delete newSelectedOptions[constructionType]
          return { selectedOptions: newSelectedOptions }
        })
      },
      
      getTotalCost: () => {
        const { selectedOptions } = get()
        return Object.values(selectedOptions)
          .filter((option): option is ConstructionOption => option !== null)
          .reduce((total, option) => total + option.cost, 0)
      },
      
      getTotalDuration: () => {
        const { selectedOptions } = get()
        return Object.values(selectedOptions)
          .filter((option): option is ConstructionOption => option !== null)
          .reduce((total, option) => total + option.duration, 0)
      },
      
      getRiskCosts: () => {
        const { periods } = get()
        return periods
          .filter(period => period.risk && period.selectedSolution === 'solution')
          .reduce((total, period) => total + (period.risk?.cost || 0), 0)
      },
      
      getRiskDuration: () => {
        const { periods } = get()
        return periods
          .filter(period => period.risk && period.selectedSolution === 'solution')
          .reduce((total, period) => total + (period.risk?.duration || 0), 0)
      },
      
      getRemainingBudget: () => {
        const { budget, getTotalCost } = get()
        return budget - getTotalCost()
      },
      
      getRemainingDuration: () => {
        const { duration, getTotalDuration } = get()
        return duration - getTotalDuration()
      },
      
      setCurrentPeriod: (index: number) => {
        set({ currentPeriodIndex: index })
      },
      
      selectRiskSolution: (periodId: number, solution: 'solution' | 'alternative') => {
        const { periods } = get()
        const period = periods.find(p => p.id === periodId)
        
        console.log(`🎯 Решение по риску: ${solution === 'solution' ? 'Решение' : 'Альтернатива'} | Период ${periodId}`)
        
        set((state) => ({
          periods: state.periods.map((period: Period) =>
            period.id === periodId
              ? { ...period, selectedSolution: solution }
              : period
          )
        }))
        
        // Обрабатываем последствия выбора решения
        if (period && period.risk) {
          if (solution === 'solution') {
            // Принимаем решение - пересчитываем графики с учетом штрафов
            // Штрафы будут размазаны по дням строительства через пересчет графиков
            get().recalculatePaymentSchedule()
            get().recalculateFundingPlan()
          } else {
            const additionalDuration = Math.ceil(period.risk.duration)
            if (additionalDuration > 0) {
              get().recalculatePaymentScheduleForAlternative(period.risk.affectedElement, additionalDuration)
              get().recalculateFundingPlanForAlternative(period.risk.affectedElement, additionalDuration)
            }
          }
        }
      },
      
      generatePeriods: () => {
        const { getTotalDuration, getModifiedDuration, selectedOptions } = get()
        
        // Рассчитываем общую длительность с учетом всех модификаций
        let totalDuration = 0
        Object.entries(selectedOptions).forEach(([constructionType, option]) => {
          if (option) {
            const modifiedDuration = getModifiedDuration(constructionType)
            totalDuration += modifiedDuration
          }
        })
        
        const periodCount = 5 // Всегда 5 периодов
        const basePeriodDuration = Math.floor(totalDuration / periodCount)
        const remainder = totalDuration % periodCount
        
        const periods: Period[] = []
        let currentDay = 1
        
        for (let i = 0; i < periodCount; i++) {
          // Последний период может быть чуть больше, если есть остаток
          const periodDuration = i === periodCount - 1 
            ? basePeriodDuration + remainder 
            : basePeriodDuration
          
          const endDay = currentDay + periodDuration - 1
          
          periods.push({
            id: i + 1,
            startDay: currentDay,
            endDay: endDay,
            risk: null,
            selectedSolution: null,
            isProtected: false
          })
          
          currentDay = endDay + 1
        }
        
        set({ periods })
      },
      
      assignRandomRisk: (periodId: number) => {
        const { selectedOptions, periods } = get()
        const period = periods.find(p => p.id === periodId)
        
        if (!period) return
        
        // Определяем, какая конструкция строится в этот период
        const currentDay = period.startDay
        let currentConstructionDay = 1
        let currentConstructionType = null
        let currentConstructionStyle = null
        
        for (const [type, option] of Object.entries(selectedOptions)) {
          if (option && currentDay >= currentConstructionDay && currentDay < currentConstructionDay + option.duration) {
            currentConstructionType = type
            // Извлекаем стиль из типа опции (например, "2 Классический стиль" -> "Классический стиль")
            currentConstructionStyle = option.type.split(' ').slice(1).join(' ')
            break
          }
          if (option) {
            currentConstructionDay += option.duration
          }
        }
        
        // Фильтруем риски по условиям выпадения
        const availableRisks = RISKS.filter(risk => {
          // Проверяем соответствие элемента конструкции
          if (risk.affectedElement !== currentConstructionType) {
            return false
          }
          
          // Проверяем соответствие стиля (может быть несколько через запятую)
          if (!currentConstructionStyle) return false
          const riskStyles = risk.affectedStyle.split(', ').map(s => s.trim())
          return riskStyles.includes(currentConstructionStyle)
        })
        
        if (availableRisks.length === 0) {
          console.log(`⚠️ Нет доступных рисков для ${currentConstructionType} (${currentConstructionStyle})`)
          return
        }
        
        const randomRisk = availableRisks[Math.floor(Math.random() * availableRisks.length)]
        
        // Проверяем, защищен ли пользователь от этого риска
        const isProtected = randomRisk.affectedElement !== currentConstructionType || 
                           !currentConstructionStyle || 
                           !randomRisk.affectedStyle.split(', ').map(s => s.trim()).includes(currentConstructionStyle)
        
        console.log(`🎲 Выбран риск ${randomRisk.id} для ${currentConstructionType} (${currentConstructionStyle}) | Защита: ${isProtected ? 'ДА' : 'НЕТ'}`)
        
        set((state) => ({
          periods: state.periods.map((period: Period) =>
            period.id === periodId
              ? { ...period, risk: randomRisk, isProtected }
              : period
          )
        }))
      },

      generatePaymentSchedule: () => {
        const { selectedOptions, periods, getModifiedDuration } = get()
        const paymentSchedule: PaymentScheduleItem[] = []
        
        // Создаем план выплат - распределяем стоимость по всем дням строительства
        let currentDay = 1
        Object.entries(selectedOptions).forEach(([constructionType, option]) => {
          if (option) {
            // Используем модифицированную длительность
            const modifiedDuration = getModifiedDuration(constructionType)
            
            // Находим риски, которые влияют на эту конструкцию
            const constructionRisks = periods.filter(period => 
              period.risk && 
              period.selectedSolution === 'solution' && 
              period.risk.affectedElement === constructionType
            )
            
            // Рассчитываем общую длительность с учетом рисков
            const totalRiskDuration = constructionRisks.reduce((sum, period) => 
              sum + (period.risk?.duration || 0), 0
            )
            const overallDuration = modifiedDuration + totalRiskDuration
            
            // Рассчитываем общую стоимость с учетом рисков
            const totalRiskCost = constructionRisks.reduce((sum, period) => 
              sum + (period.risk?.cost || 0), 0
            )
            const overallPrice = option.cost + totalRiskCost
            
            const dailyAmount = overallPrice / overallDuration
            
            for (let i = 0; i < overallDuration; i++) {
              paymentSchedule.push({
                dayIndex: currentDay + i,
                amount: Math.ceil(dailyAmount),
                issued: null,
                construction: constructionType,
                procent: 0, // issued = null, значит процент только 0
                overallPrice: overallPrice,
                overallDuration: overallDuration
              })
            }
            currentDay += overallDuration
          }
        })
        
        console.log(`📊 График выплат сгенерирован: ${paymentSchedule.length} дней | Общая сумма: ${paymentSchedule.reduce((sum, p) => sum + p.amount, 0)} руб.`)
        set({ paymentSchedule })
        
        // Восстанавливаем данные из истории
        get().restoreFromHistory()
      },

      generateFundingPlan: () => {
        const { selectedOptions, getModifiedDuration } = get()
        const fundingPlan: FundingPlanItem[] = []
        
        // Создаем план финансирования - начисления в первый день строительства каждого элемента
        let currentDay = 1
        Object.entries(selectedOptions).forEach(([constructionType, option]) => {
          if (option) {
            const modifiedDuration = getModifiedDuration(constructionType)
            fundingPlan.push({
              dayIndex: currentDay,
              amount: option.cost
            })
            currentDay += modifiedDuration
          }
        })
        
        console.log(`💰 План финансирования сгенерирован: ${fundingPlan.length} траншей | Общая сумма: ${fundingPlan.reduce((sum, f) => sum + f.amount, 0)} руб.`)
        set({ fundingPlan })
      },

      processDay: (day: number) => {
        const { fundingPlan, piggyBank, paymentSchedule } = get()
        
        console.log(`📅 Обработка дня ${day}`)
        console.log(`🏦 КУБЫШКА ДО ОПЕРАЦИЙ: ${piggyBank} руб.`)
        
        // Зачисляем деньги по плану финансирования
        const dayFunding = fundingPlan.filter(funding => funding.dayIndex === day)
        const totalIncoming = dayFunding.reduce((sum, funding) => sum + funding.amount, 0)
        
        if (totalIncoming > 0) {
          console.log(`💰 ПОСТУПЛЕНИЕ В КУБЫШКУ: +${totalIncoming} руб. (день ${day})`)
          console.log(`🏦 КУБЫШКА ПОСЛЕ ПОСТУПЛЕНИЯ: ${piggyBank + totalIncoming} руб.`)
        }
        
        // Обновляем кубышку
        set({ piggyBank: piggyBank + totalIncoming })
        console.log(`🏦 КУБЫШКА ОБНОВЛЕНА: ${piggyBank + totalIncoming} руб.`)
        
        // Находим записи в paymentSchedule для этого дня
        const dayPayments = paymentSchedule.filter(payment => payment.dayIndex === day)
        
        if (dayPayments.length === 0) {
          console.log(`⚠️ Нет записей в графике выплат для дня ${day}`)
          return
        }
        
        // Обрабатываем каждую запись для этого дня
        const currentPiggyBank = get().piggyBank
        
        set((state) => {
          const newPaymentSchedule = state.paymentSchedule.map(payment => {
            if (payment.dayIndex === day && payment.issued === null) {
              const requiredMoney = payment.amount
              const isIdle = currentPiggyBank < requiredMoney
              const issuedMoney = isIdle ? 0 : requiredMoney
              
              console.log(`💳 ТРЕБУЕТСЯ: ${requiredMoney} руб. | ВЫДАНО: ${issuedMoney} руб. | ПРОСТОЙ: ${isIdle ? 'ДА' : 'НЕТ'}`)
              
              if (issuedMoney > 0) {
                console.log(`💸 СПИСАНИЕ С КУБЫШКИ: -${issuedMoney} руб. (день ${day})`)
              }
              
              // Рассчитываем процент только если есть выдача денег
              let newProcent = 0
              if (issuedMoney > 0) {
                // Находим текущий день строительства для этой конструкции
                const constructionPayments = state.paymentSchedule
                  .filter(p => p.construction === payment.construction && p.dayIndex <= day)
                  .sort((a, b) => a.dayIndex - b.dayIndex)
                
                const currentDayInConstruction = constructionPayments.length
                newProcent = Math.round((currentDayInConstruction / payment.overallDuration) * 100)
                console.log(`📈 ПРОГРЕСС: день ${currentDayInConstruction}/${payment.overallDuration} = ${newProcent}% (конструкция ${payment.construction})`)
              } else if (issuedMoney === 0) {
                // Простой - сохраняем предыдущий процент
                const constructionPayments = state.paymentSchedule
                  .filter(p => p.construction === payment.construction && p.dayIndex < day)
                  .sort((a, b) => b.dayIndex - a.dayIndex)
                
                if (constructionPayments.length > 0) {
                  const lastPayment = constructionPayments[0]
                  if (lastPayment.issued !== null) {
                    newProcent = lastPayment.procent
                    console.log(`⏸️ ПРОСТОЙ: процент сохранен ${newProcent}% (конструкция ${payment.construction})`)
                  }
                }
                
                // Добавляем день простоя для недостроенной конструкции
                get().addIdleDays(payment.construction, 1)
              }
              
              const updatedPayment = {
                ...payment,
                issued: issuedMoney,
                procent: newProcent
              }
              
              // Добавляем в историю
              get().addToHistory(updatedPayment)
              
              return updatedPayment
            }
            return payment
          })
          
          // Обновляем кубышку после всех операций
          const totalIssued = dayPayments.reduce((sum, payment) => {
            if (payment.issued === null) {
              const requiredMoney = payment.amount
              const isIdle = currentPiggyBank < requiredMoney
              const issuedMoney = isIdle ? 0 : requiredMoney
              return sum + issuedMoney
            }
            return sum + payment.issued
          }, 0)
          
          console.log(`🏦 КУБЫШКА ПОСЛЕ СПИСАНИЯ: ${currentPiggyBank - totalIssued} руб.`)
          
          return {
            paymentSchedule: newPaymentSchedule,
            piggyBank: currentPiggyBank - totalIssued
          }
        })
      },

      requestMoney: (amount: number) => {
        const { planningRemainder, piggyBank } = get()
        if (amount <= planningRemainder) {
          console.log(`🏦 КУБЫШКА ДО ЗАПРОСА: ${piggyBank} руб.`)
          console.log(`💰 ЗАПРОС ДОПОЛНИТЕЛЬНЫХ СРЕДСТВ: +${amount} руб.`)
          console.log(`🏦 КУБЫШКА ПОСЛЕ ЗАПРОСА: ${piggyBank + amount} руб.`)
          
          set((state) => ({
            piggyBank: state.piggyBank + amount,
            planningRemainder: state.planningRemainder - amount
          }))
        } else {
          console.log(`❌ ЗАПРОС ОТКЛОНЕН: недостаточно средств в планируемом остатке (${planningRemainder} руб.)`)
        }
      },

      moveToNextPeriod: () => {
        const { currentPeriodIndex, periods, assignRandomRisk } = get()
        
        // Переходим к следующему периоду
        const nextPeriodIndex = currentPeriodIndex + 1
        
        console.log(`🔄 Переход к периоду ${nextPeriodIndex + 1}`)
        
        set({
          currentPeriodIndex: nextPeriodIndex
        })
        
        // Назначаем риск на новый период
        if (nextPeriodIndex < periods.length) {
          const nextPeriod = periods[nextPeriodIndex]
          if (nextPeriod) {
            assignRandomRisk(nextPeriod.id)
            console.log(`🎲 Риск назначен на период ${nextPeriodIndex + 1}`)
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
          constructionDurationModifications: {}
        })
      },


      recalculatePaymentSchedule: () => {
        const { selectedOptions, periods, currentPeriodIndex, paymentSchedule, history } = get()
        
        // Находим текущий период
        const currentPeriod = periods[currentPeriodIndex]
        if (!currentPeriod) {
          console.log('❌ Текущий период не найден')
          return
        }
        
        const startDay = currentPeriod.startDay
        console.log(`📊 Пересчет графика выплат с дня ${startDay} (период ${currentPeriodIndex + 1})`)
        
        // Сохраняем все записи до дня начала периода
        const preservedPayments = paymentSchedule.filter(payment => payment.dayIndex < startDay)
        
        // Создаем новый график начиная с дня начала периода
        const newPayments: PaymentScheduleItem[] = []
        let currentDay = startDay
        
        Object.entries(selectedOptions).forEach(([constructionType, option]) => {
          if (option) {
            // Находим риски, которые влияют на эту конструкцию
            const constructionRisks = periods.filter(period => 
              period.risk && 
              period.selectedSolution === 'solution' && 
              period.risk.affectedElement === constructionType
            )
            
            // Рассчитываем общую длительность с учетом рисков
            const totalRiskDuration = constructionRisks.reduce((sum, period) => 
              sum + (period.risk?.duration || 0), 0
            )
            const overallDuration = option.duration + totalRiskDuration
            
            // Рассчитываем общую стоимость с учетом рисков
            const totalRiskCost = constructionRisks.reduce((sum, period) => 
              sum + (period.risk?.cost || 0), 0
            )
            const overallPrice = option.cost + totalRiskCost
            
            // Распределяем стоимость по дням
            const dailyAmount = overallPrice / overallDuration
            for (let i = 0; i < overallDuration; i++) {
              newPayments.push({
                dayIndex: currentDay + i,
                amount: Math.ceil(dailyAmount),
                issued: null,
                construction: constructionType,
                procent: 0,
                overallPrice: overallPrice,
                overallDuration: overallDuration
              })
            }
            currentDay += overallDuration
          }
        })
        
        // Объединяем сохраненные и новые записи
        let updatedPaymentSchedule = [...preservedPayments, ...newPayments]
        
        // Восстанавливаем данные из истории
        const historyMap = new Map<number, PaymentScheduleItem>()
        history.forEach(day => {
          historyMap.set(day.dayIndex, day)
        })
        
        // Заменяем записи в paymentSchedule на записи из истории
        updatedPaymentSchedule = updatedPaymentSchedule.map(payment => {
          const historyDay = historyMap.get(payment.dayIndex)
          return historyDay || payment
        })
        
        console.log(`📊 График выплат пересчитан: сохранено ${preservedPayments.length} записей, добавлено ${newPayments.length} новых`)
        console.log(`🔄 Восстановлено из истории: ${historyMap.size} записей`)
        set({ paymentSchedule: updatedPaymentSchedule })
      },

      recalculateFundingPlan: () => {
        const { selectedOptions, periods } = get()
        const fundingPlan: FundingPlanItem[] = []
        
        // Создаем новый план финансирования БЕЗ учета рисков
        let currentDay = 1
        Object.values(selectedOptions).forEach((option) => {
          if (option) {
            // Находим риски, которые влияют на эту конструкцию
            const constructionRisks = periods.filter(period => 
              period.risk && 
              period.selectedSolution === 'solution' && 
              period.risk.affectedElement === option.constructionType
            )
            
            // Рассчитываем общую длительность с учетом рисков
            const totalRiskDuration = constructionRisks.reduce((sum, period) => 
              sum + (period.risk?.duration || 0), 0
            )
            const totalDuration = option.duration + totalRiskDuration
            
            // План финансирования содержит ТОЛЬКО базовую стоимость конструкции
            // Штрафы от рисков НЕ включаются в план финансирования
            fundingPlan.push({
              dayIndex: currentDay,
              amount: option.cost
            })
            
            currentDay += totalDuration
          }
        })
        
        console.log(`💰 План финансирования пересчитан БЕЗ учета рисков: ${fundingPlan.length} траншей | Общая сумма: ${fundingPlan.reduce((sum, f) => sum + f.amount, 0)} руб.`)
        set({ fundingPlan })
      },

      recalculatePaymentScheduleForAlternative: (affectedElement: string, additionalDuration: number) => {
        const { selectedOptions, addDurationModification, getModifiedDuration } = get()
        
        // Сохраняем модификацию длительности
        addDurationModification(affectedElement, additionalDuration)
        
        // Создаем новый график выплат
        const newPaymentSchedule: PaymentScheduleItem[] = []
        let newCurrentDay = 1
        
        for (const [type, option] of Object.entries(selectedOptions)) {
          if (option) {
            const constructionDuration = getModifiedDuration(type)
            const constructionCost = option.cost
            
            // Добавляем записи для этой конструкции
            const dailyAmount = constructionCost / constructionDuration
            for (let i = 0; i < constructionDuration; i++) {
              newPaymentSchedule.push({
                dayIndex: newCurrentDay + i,
                amount: Math.ceil(dailyAmount),
                issued: null,
                construction: type,
                procent: 0, // issued = null, значит процент только 0
                overallPrice: constructionCost,
                overallDuration: constructionDuration
              })
            }
            
            newCurrentDay += constructionDuration
          }
        }
        
        console.log(`📊 График выплат пересчитан для альтернативы: +${additionalDuration} дней для ${affectedElement}`)
        
        // Сохраняем историю issued значений
        const updatedPaymentSchedule = get().preserveIssuedHistory(newPaymentSchedule)
        set({ paymentSchedule: updatedPaymentSchedule })
        
        // Восстанавливаем данные из истории
        get().restoreFromHistory()
      },

      recalculateFundingPlanForAlternative: (affectedElement: string, additionalDuration: number) => {
        const { selectedOptions, addDurationModification, getModifiedDuration } = get()
        
        // Сохраняем модификацию длительности
        addDurationModification(affectedElement, additionalDuration)
        
        // Создаем новый план финансирования БЕЗ учета рисков
        const newFundingPlan: FundingPlanItem[] = []
        let newCurrentDay = 1
        
        for (const [type, option] of Object.entries(selectedOptions)) {
          if (option) {
            const constructionDuration = getModifiedDuration(type)
            
            // Финансирование поступает в первый день строительства
            // План финансирования содержит ТОЛЬКО базовую стоимость конструкции
            newFundingPlan.push({
              dayIndex: newCurrentDay,
              amount: option.cost
            })
            
            newCurrentDay += constructionDuration
          }
        }
        
        console.log(`💰 План финансирования пересчитан для альтернативы БЕЗ учета рисков: ${affectedElement} +${additionalDuration} дней`)
        set({ fundingPlan: newFundingPlan })
      },

      preserveIssuedHistory: (newPaymentSchedule: PaymentScheduleItem[]) => {
        const { paymentSchedule: currentPaymentSchedule } = get()
        
        // Создаем карту существующих issued значений по dayIndex
        const issuedHistory = new Map<number, number>()
        currentPaymentSchedule.forEach(payment => {
          if (payment.issued !== null) {
            issuedHistory.set(payment.dayIndex, payment.issued)
          }
        })
        
        // Применяем сохраненные issued значения к новому графику
        const updatedPaymentSchedule = newPaymentSchedule.map(payment => {
          const savedIssued = issuedHistory.get(payment.dayIndex)
          if (savedIssued !== undefined) {
            return { ...payment, issued: savedIssued }
          }
          return payment
        })
        
        console.log(`📋 Сохранена история issued значений: ${issuedHistory.size} записей`)
        return updatedPaymentSchedule
      },

      getModifiedDuration: (constructionType: string) => {
        const { selectedOptions, constructionDurationModifications } = get()
        const option = selectedOptions[constructionType]
        if (!option) return 0
        
        const baseDuration = option.duration
        const modification = constructionDurationModifications[constructionType] || 0
        return baseDuration + modification
      },

      addDurationModification: (constructionType: string, additionalDuration: number) => {
        set((state) => ({
          constructionDurationModifications: {
            ...state.constructionDurationModifications,
            [constructionType]: (state.constructionDurationModifications[constructionType] || 0) + additionalDuration
          }
        }))
        console.log(`⏱️ Модификация длительности ${constructionType}: +${additionalDuration} дней (общее: +${(get().constructionDurationModifications[constructionType] || 0) + additionalDuration})`)
      },

      addIdleDays: (constructionType: string, idleDays: number) => {
        const { paymentSchedule, selectedOptions } = get()
        const option = selectedOptions[constructionType]
        if (!option) return

        // Находим последний день строительства этой конструкции
        const constructionPayments = paymentSchedule
          .filter(p => p.construction === constructionType)
          .sort((a, b) => b.dayIndex - a.dayIndex)
        
        if (constructionPayments.length === 0) return

        const lastDay = constructionPayments[0].dayIndex
        const newPaymentSchedule = [...paymentSchedule]

        // Добавляем дни простоя после последнего дня строительства
        for (let i = 1; i <= idleDays; i++) {
          const idleDay = lastDay + i
          newPaymentSchedule.push({
            dayIndex: idleDay,
            amount: 0, // В дни простоя не тратим деньги
            issued: 0, // Простой
            construction: constructionType,
            procent: constructionPayments[0].procent, // Сохраняем последний процент
            overallPrice: option.cost,
            overallDuration: option.duration
          })
        }

        console.log(`⏸️ Добавлено ${idleDays} дней простоя для ${constructionType} (дни ${lastDay + 1}-${lastDay + idleDays})`)
        set({ paymentSchedule: newPaymentSchedule })
        
        // Восстанавливаем данные из истории
        get().restoreFromHistory()
      },

      addToHistory: (day: PaymentScheduleItem) => {
        set((state) => {
          // Удаляем старую запись с таким же dayIndex если есть
          const filteredHistory = state.history.filter(h => h.dayIndex !== day.dayIndex)
          return {
            history: [...filteredHistory, day]
          }
        })
        console.log(`📝 Добавлено в историю: день ${day.dayIndex}`)
      },

      restoreFromHistory: () => {
        const { paymentSchedule, history } = get()
        
        // Создаем карту истории по dayIndex
        const historyMap = new Map<number, PaymentScheduleItem>()
        history.forEach(day => {
          historyMap.set(day.dayIndex, day)
        })
        
        // Заменяем записи в paymentSchedule на записи из истории
        const restoredPaymentSchedule = paymentSchedule.map(payment => {
          const historyDay = historyMap.get(payment.dayIndex)
          return historyDay || payment
        })
        
        console.log(`🔄 Восстановлено из истории: ${historyMap.size} записей`)
        set({ paymentSchedule: restoredPaymentSchedule })
      }
    }),
    {
      name: 'fact-storage',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name)
        }
      }
    }
  )
)

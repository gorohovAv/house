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
}

export interface FundingPlanItem {
  dayIndex: number
  amount: number
}

export interface FactDay {
  day: number
  constructionType: string | null
  constructionOption: ConstructionOption | null
  risk: Risk | null
  requiredMoney: number
  issuedMoney: number
  isIdle: boolean
}

export interface FactGraph {
  days: FactDay[]
}

export interface FactState {
  selectedOptions: Record<string, ConstructionOption | null>
  budget: number
  duration: number
  periods: Period[]
  currentPeriodIndex: number
  paymentSchedule: PaymentScheduleItem[]
  fundingPlan: FundingPlanItem[]
  piggyBank: number
  planningRemainder: number
  factGraph: FactDay[]
  
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
  applyRiskToPiggyBank: (riskCost: number) => void
  recalculatePaymentScheduleForAlternative: (affectedElement: string, additionalDuration: number) => void
  recalculateFundingPlanForAlternative: (affectedElement: string, additionalDuration: number) => void
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
      piggyBank: 0,
      planningRemainder: 0,
      factGraph: [],
      
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
          planningRemainder: planningRemainder,
          factGraph: []
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
        const { periods, factGraph } = get()
        const period = periods.find(p => p.id === periodId)
        
        console.log(`🎯 Решение по риску: ${solution === 'solution' ? 'Решение' : 'Альтернатива'} | Период ${periodId} | ФактГраф: ${factGraph.length} дней`)
        
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
            // Принимаем решение - применяем штрафы
            if (period.risk.cost > 0) {
              // Денежный штраф - вычитаем из кубышки
              get().applyRiskToPiggyBank(period.risk.cost)
            }
            if (period.risk.duration > 0) {
              // Временной штраф - пересчитываем графики
              get().recalculatePaymentSchedule()
              get().recalculateFundingPlan()
            }
          } else {
            // Альтернатива - увеличиваем время на 50%, но без денежных штрафов
            const additionalDuration = Math.ceil(period.risk.duration * 1.5)
            if (additionalDuration > 0) {
              get().recalculatePaymentScheduleForAlternative(period.risk.affectedElement, additionalDuration)
              get().recalculateFundingPlanForAlternative(period.risk.affectedElement, additionalDuration)
            }
          }
        }
      },
      
      generatePeriods: () => {
        const { getTotalDuration } = get()
        const totalDuration = getTotalDuration()
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
        const { selectedOptions } = get()
        const paymentSchedule: PaymentScheduleItem[] = []
        
        // Создаем план выплат - распределяем стоимость по всем дням строительства
        let currentDay = 1
        Object.values(selectedOptions).forEach((option) => {
          if (option) {
            const dailyAmount = option.cost / option.duration
            for (let i = 0; i < option.duration; i++) {
              paymentSchedule.push({
                dayIndex: currentDay + i,
                amount: Math.ceil(dailyAmount)
              })
            }
            currentDay += option.duration
          }
        })
        
        console.log(`📊 График выплат сгенерирован: ${paymentSchedule.length} дней | Общая сумма: ${paymentSchedule.reduce((sum, p) => sum + p.amount, 0)} руб.`)
        set({ paymentSchedule })
      },

      generateFundingPlan: () => {
        const { selectedOptions } = get()
        const fundingPlan: FundingPlanItem[] = []
        
        // Создаем план финансирования - начисления в первый день строительства каждого элемента
        let currentDay = 1
        Object.values(selectedOptions).forEach((option) => {
          if (option) {
            fundingPlan.push({
              dayIndex: currentDay,
              amount: option.cost
            })
            currentDay += option.duration
          }
        })
        
        console.log(`💰 План финансирования сгенерирован: ${fundingPlan.length} траншей | Общая сумма: ${fundingPlan.reduce((sum, f) => sum + f.amount, 0)} руб.`)
        set({ fundingPlan })
      },

      processDay: (day: number) => {
        const { fundingPlan, piggyBank, selectedOptions, periods, currentPeriodIndex, factGraph } = get()
        
        console.log(`📅 Обработка дня ${day} | ФактГраф: ${factGraph.length} дней`)
        
        // Зачисляем деньги по плану финансирования
        const dayFunding = fundingPlan.filter(funding => funding.dayIndex === day)
        const totalIncoming = dayFunding.reduce((sum, funding) => sum + funding.amount, 0)
        
        if (totalIncoming > 0) {
          console.log(`💰 Поступление: +${totalIncoming} руб. (день ${day})`)
        }
        
        // Обновляем кубышку
        set({ piggyBank: piggyBank + totalIncoming })
        
        // Определяем текущий период
        const currentPeriod = periods[currentPeriodIndex]
        if (!currentPeriod) return
        
        // Определяем, какая конструкция строится в этот день
        // Строим конструкции последовательно
        let currentDay = 1
        let constructionType = null
        let constructionOption = null
        
        for (const [type, option] of Object.entries(selectedOptions)) {
          if (option && day >= currentDay && day < currentDay + option.duration) {
            constructionType = type
            constructionOption = option
            break
          }
          if (option) {
            currentDay += option.duration
          }
        }
        
        if (!constructionOption) return
        
        // Рассчитываем требуемые деньги на день из paymentSchedule
        const { paymentSchedule } = get()
        const dayPayments = paymentSchedule.filter(payment => payment.dayIndex === day)
        const baseRequiredMoney = dayPayments.reduce((sum, payment) => sum + payment.amount, 0)
        
        if (baseRequiredMoney > 0) {
          console.log(`💸 Платеж по графику: ${baseRequiredMoney} руб. (день ${day})`)
        }
        
        // Проверяем риск - теперь риски уже учтены в paymentSchedule
        const risk = currentPeriod.risk
        let riskInfo = ''
        
        if (risk && currentPeriod.selectedSolution === 'solution') {
          riskInfo = ` (включая риск ${risk.id})`
        }
        
        const requiredMoney = Math.ceil(baseRequiredMoney)
        
        if (risk && currentPeriod.selectedSolution === 'solution') {
          console.log(`⚠️ Обработка дня с риском ${risk.id}${riskInfo} (день ${day})`)
        }
        
        // Проверяем, есть ли деньги в кубышке
        const currentPiggyBank = get().piggyBank
        const issuedMoney = Math.min(requiredMoney, currentPiggyBank)
        const isIdle = issuedMoney < requiredMoney
        
        console.log(`💳 Требуется: ${requiredMoney} руб. | Выдано: ${issuedMoney} руб. | Простой: ${isIdle ? 'ДА' : 'НЕТ'}`)
        
        // Обновляем кубышку
        set({ piggyBank: currentPiggyBank - issuedMoney })
        
        // Создаем день факта
        const factDay: FactDay = {
          day,
          constructionType: isIdle ? null : constructionType,
          constructionOption: isIdle ? null : constructionOption,
          risk: isIdle ? null : risk,
          requiredMoney,
          issuedMoney,
          isIdle
        }
        
        // Добавляем день в график факта
        set((state) => {
          const newGraph = [...state.factGraph, factDay]
          console.log(`✅ День ${day} добавлен в ФактГраф | Всего дней: ${newGraph.length}`)
          return { factGraph: newGraph }
        })
      },

      requestMoney: (amount: number) => {
        const { planningRemainder } = get()
        if (amount <= planningRemainder) {
          set((state) => ({
            piggyBank: state.piggyBank + amount,
            planningRemainder: state.planningRemainder - amount
          }))
        }
      },

      moveToNextPeriod: () => {
        const { currentPeriodIndex, periods, assignRandomRisk, factGraph } = get()
        
        // Переходим к следующему периоду
        const nextPeriodIndex = currentPeriodIndex + 1
        
        console.log(`🔄 Переход к периоду ${nextPeriodIndex + 1} | ФактГраф: ${factGraph.length} дней`)
        
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
          piggyBank: 0,
          planningRemainder: 0,
          factGraph: []
        })
      },

      applyRiskToPiggyBank: (riskCost: number) => {
        const { piggyBank } = get()
        const newPiggyBank = Math.max(0, piggyBank - riskCost)
        console.log(`💰 Применен денежный штраф: -${riskCost} руб. | Кубышка: ${piggyBank} → ${newPiggyBank} руб.`)
        set({ piggyBank: newPiggyBank })
      },

      recalculatePaymentSchedule: () => {
        const { selectedOptions, periods } = get()
        const paymentSchedule: PaymentScheduleItem[] = []
        
        // Создаем новый график выплат с учетом рисков
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
            
            // Рассчитываем общую стоимость с учетом рисков
            const totalRiskCost = constructionRisks.reduce((sum, period) => 
              sum + (period.risk?.cost || 0), 0
            )
            const totalCost = option.cost + totalRiskCost
            
            // Распределяем стоимость по дням
            const dailyAmount = totalCost / totalDuration
            for (let i = 0; i < totalDuration; i++) {
              paymentSchedule.push({
                dayIndex: currentDay + i,
                amount: Math.ceil(dailyAmount)
              })
            }
            currentDay += totalDuration
          }
        })
        
        console.log(`📊 График выплат пересчитан с учетом рисков: ${paymentSchedule.length} дней | Общая сумма: ${paymentSchedule.reduce((sum, p) => sum + p.amount, 0)} руб.`)
        set({ paymentSchedule })
      },

      recalculateFundingPlan: () => {
        const { selectedOptions, periods } = get()
        const fundingPlan: FundingPlanItem[] = []
        
        // Создаем новый план финансирования с учетом рисков
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
            
            // Рассчитываем общую стоимость с учетом рисков
            const totalRiskCost = constructionRisks.reduce((sum, period) => 
              sum + (period.risk?.cost || 0), 0
            )
            const totalCost = option.cost + totalRiskCost
            
            // Финансирование поступает в первый день строительства
            fundingPlan.push({
              dayIndex: currentDay,
              amount: totalCost
            })
            
            currentDay += totalDuration
          }
        })
        
        console.log(`💰 План финансирования пересчитан с учетом рисков: ${fundingPlan.length} траншей | Общая сумма: ${fundingPlan.reduce((sum, f) => sum + f.amount, 0)} руб.`)
        set({ fundingPlan })
      },

      recalculatePaymentScheduleForAlternative: (affectedElement: string, additionalDuration: number) => {
        const { selectedOptions, paymentSchedule } = get()
        const newPaymentSchedule = [...paymentSchedule]
        
        // Находим конструкцию, на которую влияет риск
        const affectedOption = Object.values(selectedOptions).find(option => 
          option && option.constructionType === affectedElement
        )
        
        if (!affectedOption) return
        
        // Находим дни, когда строится эта конструкция
        let currentDay = 1
        let constructionStartDay = 0
        let constructionEndDay = 0
        
        for (const [type, option] of Object.entries(selectedOptions)) {
          if (option) {
            if (type === affectedElement) {
              constructionStartDay = currentDay
              constructionEndDay = currentDay + option.duration - 1
              break
            }
            currentDay += option.duration
          }
        }
        
        // Удаляем старые записи для этой конструкции
        const filteredSchedule = newPaymentSchedule.filter(payment => 
          payment.dayIndex < constructionStartDay || payment.dayIndex > constructionEndDay
        )
        
        // Добавляем новые записи с увеличенной длительностью
        const dailyAmount = affectedOption.cost / (affectedOption.duration + additionalDuration)
        for (let i = 0; i < affectedOption.duration + additionalDuration; i++) {
          filteredSchedule.push({
            dayIndex: constructionStartDay + i,
            amount: Math.ceil(dailyAmount)
          })
        }
        
        // Сортируем по дням
        filteredSchedule.sort((a, b) => a.dayIndex - b.dayIndex)
        
        console.log(`📊 График выплат пересчитан для альтернативы: +${additionalDuration} дней для ${affectedElement}`)
        set({ paymentSchedule: filteredSchedule })
      },

      recalculateFundingPlanForAlternative: (affectedElement: string, additionalDuration: number) => {
        const { selectedOptions, fundingPlan } = get()
        const newFundingPlan = [...fundingPlan]
        
        // Находим конструкцию, на которую влияет риск
        const affectedOption = Object.values(selectedOptions).find(option => 
          option && option.constructionType === affectedElement
        )
        
        if (!affectedOption) return
        
        // Находим день начала строительства этой конструкции
        let currentDay = 1
        let constructionStartDay = 0
        
        for (const [type, option] of Object.entries(selectedOptions)) {
          if (option) {
            if (type === affectedElement) {
              constructionStartDay = currentDay
              break
            }
            currentDay += option.duration
          }
        }
        
        // Обновляем план финансирования - сумма остается той же, но длительность увеличивается
        const updatedFundingPlan = newFundingPlan.map(funding => 
          funding.dayIndex === constructionStartDay 
            ? { ...funding, amount: affectedOption.cost }
            : funding
        )
        
        console.log(`💰 План финансирования пересчитан для альтернативы: ${affectedElement} +${additionalDuration} дней`)
        set({ fundingPlan: updatedFundingPlan })
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

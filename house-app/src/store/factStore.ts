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
  factGraphs: FactGraph[]
  currentFactGraph: FactDay[]
  
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
      factGraphs: [],
      currentFactGraph: [],
      
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
          factGraphs: [],
          currentFactGraph: []
        })
        
        // Генерируем планы после обновления selectedOptions
        setTimeout(() => {
          get().generatePeriods()
          get().generateFundingPlan()
          get().generatePaymentSchedule()
          
          // Автоматически назначаем риск на первый период
          const { periods, assignRandomRisk } = get()
          if (periods.length > 0 && !periods[0].risk) {
            assignRandomRisk(periods[0].id)
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
        const { budget, getTotalCost, getRiskCosts } = get()
        return budget - getTotalCost() - getRiskCosts()
      },
      
      getRemainingDuration: () => {
        const { duration, getTotalDuration, getRiskDuration } = get()
        return duration - getTotalDuration() - getRiskDuration()
      },
      
      setCurrentPeriod: (index: number) => {
        set({ currentPeriodIndex: index })
      },
      
      selectRiskSolution: (periodId: number, solution: 'solution' | 'alternative') => {
        set((state) => ({
          periods: state.periods.map((period: Period) =>
            period.id === periodId
              ? { ...period, selectedSolution: solution }
              : period
          )
        }))
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
            selectedSolution: null
          })
          
          currentDay = endDay + 1
        }
        
        set({ periods })
      },
      
      assignRandomRisk: (periodId: number) => {
        const randomRisk = RISKS[Math.floor(Math.random() * RISKS.length)]
        
        set((state) => ({
          periods: state.periods.map((period: Period) =>
            period.id === periodId
              ? { ...period, risk: randomRisk }
              : period
          )
        }))
      },

      generatePaymentSchedule: () => {
        const { selectedOptions, getTotalDuration } = get()
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
        
        set({ fundingPlan })
      },

      processDay: (day: number) => {
        const { fundingPlan, piggyBank, selectedOptions, periods, currentPeriodIndex, currentFactGraph } = get()
        
        console.log('Processing day:', day)
        console.log('Current piggyBank before:', piggyBank)
        
        // Зачисляем деньги по плану финансирования
        const dayFunding = fundingPlan.filter(funding => funding.dayIndex === day)
        const totalIncoming = dayFunding.reduce((sum, funding) => sum + funding.amount, 0)
        
        console.log('Day funding:', dayFunding)
        console.log('Total incoming:', totalIncoming)
        
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
        
        // Проверяем риск
        const risk = currentPeriod.risk
        let riskCost = 0
        let riskDuration = 0
        
        if (risk && currentPeriod.selectedSolution === 'solution') {
          riskCost = risk.cost
          riskDuration = risk.duration
        }
        
        const riskDailyCost = riskDuration > 0 ? riskCost / riskDuration : 0
        const requiredMoney = Math.ceil(baseRequiredMoney + riskDailyCost)
        
        // Проверяем, есть ли деньги в кубышке
        const currentPiggyBank = get().piggyBank
        const issuedMoney = Math.min(requiredMoney, currentPiggyBank)
        const isIdle = issuedMoney < requiredMoney
        
        console.log('Required money:', requiredMoney)
        console.log('Current piggyBank for payment:', currentPiggyBank)
        console.log('Issued money:', issuedMoney)
        console.log('Is idle:', isIdle)
        
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
        
        // Добавляем день в текущий график факта
        console.log('Adding fact day:', factDay)
        set((state) => {
          const newGraph = [...state.currentFactGraph, factDay]
          console.log('New currentFactGraph:', newGraph)
          return { currentFactGraph: newGraph }
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
        const { currentPeriodIndex, periods, currentFactGraph, factGraphs, assignRandomRisk } = get()
        
        // Сохраняем текущий график факта
        const newFactGraphs = [...factGraphs, { days: currentFactGraph }]
        
        // Переходим к следующему периоду
        const nextPeriodIndex = currentPeriodIndex + 1
        
        set({
          factGraphs: newFactGraphs,
          currentFactGraph: [],
          currentPeriodIndex: nextPeriodIndex
        })
        
        // Назначаем риск на новый период
        if (nextPeriodIndex < periods.length) {
          const nextPeriod = periods[nextPeriodIndex]
          if (nextPeriod && !nextPeriod.risk) {
            assignRandomRisk(nextPeriod.id)
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
          factGraphs: [],
          currentFactGraph: []
        })
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

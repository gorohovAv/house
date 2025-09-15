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

export interface FactState {
  selectedOptions: Record<string, ConstructionOption | null>
  budget: number
  duration: number
  periods: Period[]
  currentPeriodIndex: number
  
  initializeFromPlan: () => void
  selectOption: (constructionType: string, option: ConstructionOption) => void
  clearSelection: (constructionType: string) => void
  getRemainingBudget: () => number
  getRemainingDuration: () => number
  getTotalCost: () => number
  getTotalDuration: () => number
  setCurrentPeriod: (index: number) => void
  selectRiskSolution: (periodId: number, solution: 'solution' | 'alternative') => void
  generatePeriods: () => void
  assignRandomRisk: (periodId: number) => void
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
      
      initializeFromPlan: () => {
        const planStore = usePlanStore.getState()
        set({
          selectedOptions: { ...planStore.selectedOptions },
          budget: planStore.budget,
          duration: planStore.duration
        })
        get().generatePeriods()
        
        // Автоматически назначаем риск на первый период
        setTimeout(() => {
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
        const { assignRandomRisk, periods, currentPeriodIndex } = get()
        
        set((state) => ({
          periods: state.periods.map((period: Period) =>
            period.id === periodId
              ? { ...period, selectedSolution: solution }
              : period
          )
        }))
        
        // Автоматически назначаем риск на следующий период
        const nextPeriodIndex = currentPeriodIndex + 1
        if (nextPeriodIndex < periods.length) {
          const nextPeriod = periods[nextPeriodIndex]
          if (nextPeriod && !nextPeriod.risk) {
            assignRandomRisk(nextPeriod.id)
            set({ currentPeriodIndex: nextPeriodIndex })
          }
        }
      },
      
      generatePeriods: () => {
        const { getTotalDuration } = get()
        const totalDuration = getTotalDuration()
        const periodCount = Math.ceil(totalDuration / 7) // 7 дней на период
        
        const periods: Period[] = []
        for (let i = 0; i < periodCount; i++) {
          const startDay = i * 7 + 1
          const endDay = Math.min((i + 1) * 7, totalDuration)
          
          periods.push({
            id: i + 1,
            startDay,
            endDay,
            risk: null,
            selectedSolution: null
          })
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
      
      resetFact: () => {
        set({
          selectedOptions: {},
          budget: 50000,
          duration: 90,
          periods: [],
          currentPeriodIndex: 0
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

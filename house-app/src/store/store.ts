import { create } from 'zustand'
import type { ConstructionOption } from '../constants'
import { INITIAL_BUDGET, INITIAL_DURATION } from '../constants'

interface PlanState {
  selectedOptions: Record<string, ConstructionOption | null>
  budget: number
  duration: number
  
  selectOption: (constructionType: string, option: ConstructionOption) => void
  clearSelection: (constructionType: string) => void
  getRemainingBudget: () => number
  getRemainingDuration: () => number
  getTotalCost: () => number
  getTotalDuration: () => number
  resetPlan: () => void
}

export const usePlanStore = create<PlanState>((set: any, get: any) => ({
  selectedOptions: {},
  budget: INITIAL_BUDGET,
  duration: INITIAL_DURATION,
  
  selectOption: (constructionType: string, option: ConstructionOption) => {
    set((state: any) => ({
      selectedOptions: {
        ...state.selectedOptions,
        [constructionType]: option
      }
    }))
  },
  
  clearSelection: (constructionType: string) => {
    set((state: any) => {
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
  
  resetPlan: () => {
    set({
      selectedOptions: {},
      budget: INITIAL_BUDGET,
      duration: INITIAL_DURATION
    })
  }
}))

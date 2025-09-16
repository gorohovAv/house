import { useCallback } from 'react'

const TOUR_STORAGE_KEY = 'house_app_tours_completed'

export const useTourStorage = () => {
  const getCompletedTours = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [])

  const markTourCompleted = useCallback((tourId: string) => {
    try {
      const completedTours = getCompletedTours()
      if (!completedTours.includes(tourId)) {
        completedTours.push(tourId)
        localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completedTours))
      }
    } catch {
      // Игнорируем ошибки localStorage
    }
  }, [getCompletedTours])

  const isTourCompleted = useCallback((tourId: string): boolean => {
    return getCompletedTours().includes(tourId)
  }, [getCompletedTours])

  const clearCompletedTours = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY)
    } catch {
      // Игнорируем ошибки localStorage
    }
  }, [])

  return {
    getCompletedTours,
    markTourCompleted,
    isTourCompleted,
    clearCompletedTours
  }
}

// Экспортируем функцию для использования вне хука
export const markTourCompleted = (tourId: string) => {
  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY)
    const completedTours = stored ? JSON.parse(stored) : []
    if (!completedTours.includes(tourId)) {
      completedTours.push(tourId)
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completedTours))
    }
  } catch {
    // Игнорируем ошибки localStorage
  }
}

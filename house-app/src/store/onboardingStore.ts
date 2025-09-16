import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OnboardingStep = 'welcome' | 'description' | 'project-name'

interface OnboardingState {
  currentStep: OnboardingStep
  projectName: string
  isProjectNameValid: boolean
  isCompleted: boolean
  
  setCurrentStep: (step: OnboardingStep) => void
  setProjectName: (name: string) => void
  setProjectNameValid: (isValid: boolean) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  nextStep: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set: any, get: any) => ({
      currentStep: 'welcome',
      projectName: '',
      isProjectNameValid: false,
      isCompleted: false,
      
      setCurrentStep: (step: OnboardingStep) => {
        set({ currentStep: step })
      },
      
      setProjectName: (name: string) => {
        set({ 
          projectName: name,
          isProjectNameValid: name.trim().length > 0
        })
      },
      
      setProjectNameValid: (isValid: boolean) => {
        set({ isProjectNameValid: isValid })
      },
      
      completeOnboarding: () => {
        set({ isCompleted: true })
      },
      
      resetOnboarding: () => {
        set({
          currentStep: 'welcome',
          projectName: '',
          isProjectNameValid: false,
          isCompleted: false
        })
      },
      
      nextStep: () => {
        const { currentStep } = get()
        const steps: OnboardingStep[] = ['welcome', 'description', 'project-name']
        const currentIndex = steps.indexOf(currentStep)
        
        if (currentIndex < steps.length - 1) {
          set({ currentStep: steps[currentIndex + 1] })
        } else {
          set({ isCompleted: true })
        }
      }
    }),
    {
      name: 'onboarding-storage',
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

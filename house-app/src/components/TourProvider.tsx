import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { markTourCompleted } from "../hooks/useTourStorage";

export interface TourStepConfig {
  target: string;
  title: string;
  description: string;
  type: "modal" | "bottom";
  scrollTo?: boolean;
}

export interface TourConfig {
  id: string;
  steps: TourStepConfig[];
  onComplete?: () => void;
  onSkip?: () => void;
}

interface TourContextType {
  activeTour: TourConfig | null;
  currentStep: number;
  isActive: boolean;
  startTour: (config: TourConfig) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  closeTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const startTour = useCallback((config: TourConfig) => {
    setActiveTour(config);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const closeTour = useCallback(() => {
    setActiveTour(null);
    setCurrentStep(0);
    setIsActive(false);
  }, []);

  const completeTour = useCallback(() => {
    if (activeTour) {
      // Помечаем тур как завершенный
      markTourCompleted(activeTour.id);

      if (activeTour.onComplete) {
        activeTour.onComplete();
      }
    }
    closeTour();
  }, [activeTour, closeTour]);

  const nextStep = useCallback(() => {
    if (!activeTour) return;

    if (currentStep < activeTour.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  }, [activeTour, currentStep, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    if (activeTour?.onSkip) {
      activeTour.onSkip();
    }
    closeTour();
  }, [activeTour, closeTour]);

  const value: TourContextType = {
    activeTour,
    currentStep,
    isActive,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    closeTour,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

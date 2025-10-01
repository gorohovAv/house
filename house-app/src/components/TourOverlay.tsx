import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTour } from "./TourProvider";
import "./TourOverlay.css";

interface TourOverlayProps {
  children: React.ReactNode;
}

interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TourOverlay: React.FC<TourOverlayProps> = ({ children }) => {
  const {
    activeTour,
    currentStep,
    isActive,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useTour();
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [elementPosition, setElementPosition] =
    useState<ElementPosition | null>(null);
  const [elementCopy, setElementCopy] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepConfig = activeTour?.steps[currentStep];

  const createElementCopy = (element: Element): HTMLElement => {
    const copy = element.cloneNode(true) as HTMLElement;

    // Убираем все обработчики событий и делаем все элементы неинтерактивными
    const allElements = copy.querySelectorAll("*");
    allElements.forEach((el) => {
      el.removeAttribute("onclick");
      el.removeAttribute("onmouseover");
      el.removeAttribute("onmouseout");
      el.removeAttribute("onmousedown");
      el.removeAttribute("onmouseup");
      el.removeAttribute("ontouchstart");
      el.removeAttribute("ontouchend");
      (el as HTMLElement).style.pointerEvents = "none";
      (el as HTMLElement).style.cursor = "default";
      (el as HTMLElement).style.userSelect = "none";
      (el as HTMLElement).style.touchAction = "none";
    });

    return copy;
  };

  const scrollToElement = (element: Element) => {
    // Ищем контейнер скролла (construction-scroll-container)
    const scrollContainer = document.querySelector(
      ".construction-scroll-container"
    );

    if (scrollContainer) {
      // Скроллим внутри контейнера
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    } else {
      // Fallback к обычному скроллу
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  };

  useEffect(() => {
    if (!isActive || !currentStepConfig) {
      setTargetElement(null);
      setElementPosition(null);
      setElementCopy(null);
      return;
    }

    const element = document.querySelector(currentStepConfig.target);
    if (element) {
      setTargetElement(element as Element);

      // Создаем копию элемента
      const copy = createElementCopy(element);
      setElementCopy(copy);

      // Скроллим к элементу только если указано scrollTo: true
      if (currentStepConfig.scrollTo) {
        scrollToElement(element);

        // Небольшая задержка для завершения скролла
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setElementPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          });
        }, 300);
      } else {
        // Устанавливаем позицию сразу без скролла
        const rect = element.getBoundingClientRect();
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    }
  }, [isActive, currentStepConfig]);

  useEffect(() => {
    const handleResize = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    const handleScroll = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    const scrollContainer = document.querySelector(
      ".construction-scroll-container"
    );

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [targetElement]);

  // Обновляем позицию после скролла к элементу
  useEffect(() => {
    if (targetElement && elementPosition) {
      const rect = targetElement.getBoundingClientRect();
      setElementPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [targetElement, currentStep]);

  // Дополнительное обновление позиции после завершения скролла
  useEffect(() => {
    if (targetElement && isActive) {
      const timeoutId = setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }, 500); // Даем время на завершение скролла

      return () => clearTimeout(timeoutId);
    }
  }, [targetElement, isActive, currentStep]);

  const handleButtonClick = (action: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
      return;
    }

    switch (action) {
      case "next":
        nextStep();
        break;
      case "prev":
        prevStep();
        break;
      case "skip":
        skipTour();
        break;
      case "complete":
        completeTour();
        break;
    }
  };

  const handleOverlayClick = () => {
    if (!isActive || !activeTour) return;

    // Если это последний шаг, завершаем тур
    if (currentStep === activeTour.steps.length - 1) {
      completeTour();
    } else {
      // Иначе переходим к следующему шагу
      nextStep();
    }
  };

  if (!isActive || !currentStepConfig) {
    return <>{children}</>;
  }

  const renderTourContent = () => {
    if (currentStepConfig.type === "modal") {
      return (
        <div className="tour-modal">
          <div className="tour-modal-content">
            <h3 className="tour-modal-title">{currentStepConfig.title}</h3>
            <p className="tour-modal-description">
              {currentStepConfig.description}
            </p>
          </div>
        </div>
      );
    }

    if (currentStepConfig.type === "bottom") {
      return (
        <div className="tour-bottom-tooltip">
          <div className="tour-bottom-content">
            <h4 className="tour-bottom-title">{currentStepConfig.title}</h4>
            <p className="tour-bottom-description">
              {currentStepConfig.description}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {children}
      {createPortal(
        <div className="tour-overlay" ref={overlayRef}>
          {/* Темная пелена */}
          <div className="tour-backdrop" onClick={handleOverlayClick} />

          {/* Копия целевого элемента поверх пелены */}
          {elementPosition && elementCopy && (
            <div
              className="tour-element-copy"
              style={{
                top: elementPosition.top,
                left: elementPosition.left,
                width: elementPosition.width,
                height: elementPosition.height,
                pointerEvents: "none",
              }}
              dangerouslySetInnerHTML={{ __html: elementCopy.outerHTML }}
            />
          )}

          {/* Контент тура */}
          {renderTourContent()}

          {/* Фиксированная кнопка Далее */}
          <div className="tour-bottom-button">
            <button
              className="tour-button tour-button-primary"
              onClick={() => handleButtonClick("next")}
            >
              Далее
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TourOverlay;

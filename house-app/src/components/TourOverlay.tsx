import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTour } from "./TourProvider";
import { FormattedText } from "./FormattedText";
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
  const [targetElements, setTargetElements] = useState<Element[]>([]);
  const [elementPositions, setElementPositions] = useState<ElementPosition[]>(
    []
  );
  const [elementCopies, setElementCopies] = useState<HTMLElement[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepConfig = activeTour?.steps[currentStep];

  const createElementCopy = (element: Element): HTMLElement => {
    const copy = element.cloneNode(true) as HTMLElement;

    // Специальная обработка для .house-display - заменяем Canvas на статичное изображение
    if (element.classList.contains("house-display")) {
      const canvas = copy.querySelector("canvas");
      if (canvas) {
        const img = document.createElement("img");
        img.src = "/Плита.png";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        canvas.replaceWith(img);
      }
    }

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

  const scrollToElements = (elements: Element[]) => {
    if (elements.length === 0) return;

    // Ищем контейнер скролла (construction-scroll-container)
    const scrollContainer = document.querySelector(
      ".construction-scroll-container"
    );

    // Скроллим к первому элементу
    const firstElement = elements[0];
    if (scrollContainer) {
      // Скроллим внутри контейнера
      firstElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    } else {
      // Fallback к обычному скроллу
      firstElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  };

  useEffect(() => {
    // Принудительная очистка всех состояний перед новым рендером
    setTargetElements([]);
    setElementPositions([]);
    setElementCopies([]);

    if (!isActive || !currentStepConfig) {
      return;
    }

    // Небольшая задержка для гарантированной очистки
    const cleanupTimeout = setTimeout(() => {
      // Дополнительная очистка для предотвращения гонок состояний
      setTargetElements([]);
      setElementPositions([]);
      setElementCopies([]);
    }, 50);

    return () => {
      clearTimeout(cleanupTimeout);
    };
  }, [isActive, currentStep]);

  // Отдельный useEffect для поиска и рендера элементов после очистки
  useEffect(() => {
    if (!isActive || !currentStepConfig) {
      return;
    }

    // Для модальных туров не нужно искать целевые элементы
    if (currentStepConfig.type === "modal") {
      return;
    }

    // Задержка для гарантированной очистки предыдущих элементов
    const renderTimeout = setTimeout(() => {
      // Преобразуем target в массив селекторов
      const selectors = Array.isArray(currentStepConfig.target)
        ? currentStepConfig.target
        : [currentStepConfig.target];

      // Находим все элементы
      const elements: Element[] = [];
      const foundElementIds = new Set<string>(); // Для предотвращения дублирования

      selectors.forEach((selector) => {
        const foundElements = document.querySelectorAll(selector);
        foundElements.forEach((el) => {
          // Создаем уникальный ID для элемента на основе его позиции и содержимого
          const elementId = `${el.tagName}-${el.className}-${
            el.getBoundingClientRect().top
          }-${el.getBoundingClientRect().left}`;

          // Добавляем только если такого элемента еще нет
          if (!foundElementIds.has(elementId)) {
            foundElementIds.add(elementId);
            elements.push(el);
          }
        });
      });

      if (elements.length > 0) {
        setTargetElements(elements);

        // Создаем копии элементов
        const copies = elements.map((element) => createElementCopy(element));
        setElementCopies(copies);

        // Скроллим к элементам только если указано scrollTo: true
        if (currentStepConfig.scrollTo) {
          scrollToElements(elements);

          // Небольшая задержка для завершения скролла
          setTimeout(() => {
            const positions = elements.map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height,
              };
            });
            setElementPositions(positions);
          }, 300);
        } else {
          // Устанавливаем позиции сразу без скролла
          const positions = elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              height: rect.height,
            };
          });
          setElementPositions(positions);
        }
      }
    }, 100); // Увеличиваем задержку для гарантированной очистки

    return () => {
      clearTimeout(renderTimeout);
    };
  }, [isActive, currentStepConfig]);

  useEffect(() => {
    const handleResize = () => {
      if (targetElements.length > 0) {
        const positions = targetElements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          };
        });
        setElementPositions(positions);
      }
    };

    const handleScroll = () => {
      if (targetElements.length > 0) {
        const positions = targetElements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          };
        });
        setElementPositions(positions);
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
  }, [targetElements]);

  // Дополнительная очистка при смене шага
  useEffect(() => {
    // Принудительно очищаем все элементы при смене шага
    setTargetElements([]);
    setElementPositions([]);
    setElementCopies([]);
  }, [currentStep]);

  // Дополнительное обновление позиции после завершения скролла
  useEffect(() => {
    if (targetElements.length > 0 && isActive) {
      const timeoutId = setTimeout(() => {
        const positions = targetElements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          };
        });
        setElementPositions(positions);
      }, 500); // Даем время на завершение скролла

      return () => clearTimeout(timeoutId);
    }
  }, [targetElements, isActive, currentStep]);

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
    if (!isActive || !activeTour || !currentStepConfig) return;

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
            <h3 className="tour-modal-title">
              <FormattedText text={currentStepConfig.title} />
            </h3>
            <p className="tour-modal-description">
              <FormattedText text={currentStepConfig.description} />
            </p>
          </div>
        </div>
      );
    }

    if (currentStepConfig.type === "bottom") {
      return (
        <div
          className={`tour-bottom-tooltip ${
            currentStepConfig.disableNext ? "no-button" : ""
          }`}
        >
          <div className="tour-bottom-content">
            <h4 className="tour-bottom-title">
              <FormattedText text={currentStepConfig.title} />
            </h4>
            <p className="tour-bottom-description">
              <FormattedText text={currentStepConfig.description} />
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

          {/* Копии целевых элементов поверх пелены */}
          {elementPositions.length > 0 &&
            elementCopies.length > 0 &&
            elementPositions.map(
              (position, index) =>
                elementCopies[index] && (
                  <div
                    key={`${currentStep}-${position.top}-${position.left}-${position.width}-${position.height}-${index}`}
                    className="tour-element-copy"
                    style={{
                      top: position.top,
                      left: position.left,
                      width: position.width,
                      height: position.height,
                      pointerEvents: "none",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: elementCopies[index].outerHTML,
                    }}
                  />
                )
            )}

          {/* Контент тура */}
          {renderTourContent()}

          {/* Фиксированная кнопка Далее */}
          {!currentStepConfig.disableNext && (
            <div className="tour-bottom-button">
              <button
                className="tour-button tour-button-primary"
                onClick={() => handleButtonClick("next")}
              >
                Далее
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default TourOverlay;

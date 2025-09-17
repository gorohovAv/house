import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTour } from './TourProvider'
import './TourOverlay.css'

interface TourOverlayProps {
  children: React.ReactNode
}

interface ElementPosition {
  top: number
  left: number
  width: number
  height: number
}

const TourOverlay: React.FC<TourOverlayProps> = ({ children }) => {
  const { activeTour, currentStep, isActive, nextStep, prevStep, skipTour, completeTour } = useTour()
  const [targetElement, setTargetElement] = useState<Element | null>(null)
  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentStepConfig = activeTour?.steps[currentStep]

  const scrollToElement = (element: Element) => {
    // Ищем контейнер скролла (construction-scroll-container)
    const scrollContainer = document.querySelector('.construction-scroll-container')
    
    if (scrollContainer) {
      // Скроллим внутри контейнера
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    } else {
      // Fallback к обычному скроллу
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    }
  }

  useEffect(() => {
    if (!isActive || !currentStepConfig) {
      setTargetElement(null)
      setElementPosition(null)
      return
    }

    const element = document.querySelector(currentStepConfig.target)
    if (element) {
      setTargetElement(element as Element)
      
      // Скроллим к элементу только если указано scrollTo: true
      if (currentStepConfig.scrollTo) {
        scrollToElement(element)
        
        // Небольшая задержка для завершения скролла
        setTimeout(() => {
          const rect = element.getBoundingClientRect()
          setElementPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          })
        }, 300)
      } else {
        // Устанавливаем позицию сразу без скролла
        const rect = element.getBoundingClientRect()
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        })
      }
    }
  }, [isActive, currentStepConfig])

  useEffect(() => {
    const handleResize = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        })
      }
    }

    const handleScroll = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        })
      }
    }

    const scrollContainer = document.querySelector('.construction-scroll-container')

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)
    
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [targetElement])

  // Обновляем позицию после скролла к элементу
  useEffect(() => {
    if (targetElement && elementPosition) {
      const rect = targetElement.getBoundingClientRect()
      setElementPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      })
    }
  }, [targetElement, currentStep])

  // Дополнительное обновление позиции после завершения скролла
  useEffect(() => {
    if (targetElement && isActive) {
      const timeoutId = setTimeout(() => {
        const rect = targetElement.getBoundingClientRect()
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        })
      }, 500) // Даем время на завершение скролла

      return () => clearTimeout(timeoutId)
    }
  }, [targetElement, isActive, currentStep])

  const handleButtonClick = (action: string, onClick?: () => void) => {
    if (onClick) {
      onClick()
      return
    }

    switch (action) {
      case 'next':
        nextStep()
        break
      case 'prev':
        prevStep()
        break
      case 'skip':
        skipTour()
        break
      case 'complete':
        completeTour()
        break
    }
  }

  const handleOverlayClick = () => {
    if (!isActive || !activeTour) return
    
    // Если это последний шаг, завершаем тур
    if (currentStep === activeTour.steps.length - 1) {
      completeTour()
    } else {
      // Иначе переходим к следующему шагу
      nextStep()
    }
  }

  const getBackdropClipPath = () => {
    if (!elementPosition) {
      return 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%)'
    }

    const { top, left, width, height } = elementPosition
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Добавляем отступы для более плавного перехода
    const padding = 8
    const x1 = Math.max(0, left - padding) / viewportWidth * 100
    const y1 = Math.max(0, top - padding) / viewportHeight * 100
    const x2 = Math.min(100, (left + width + padding) / viewportWidth * 100)
    const y2 = Math.min(100, (top + height + padding) / viewportHeight * 100)

    // Создаем полигон с дыркой для элемента
    return `polygon(
      0% 0%, 
      0% 100%, 
      ${x1}% 100%, 
      ${x1}% ${y1}%, 
      ${x2}% ${y1}%, 
      ${x2}% ${y2}%, 
      ${x1}% ${y2}%, 
      ${x1}% 100%, 
      100% 100%, 
      100% 0%
    )`
  }

  const getTooltipPosition = () => {
    if (!elementPosition || !currentStepConfig) return {}

    const { position = 'bottom' } = currentStepConfig
    const tooltipOffset = 12

    switch (position) {
      case 'top':
        return {
          top: elementPosition.top - tooltipOffset,
          left: elementPosition.left + elementPosition.width / 2,
          transform: 'translateX(-50%) translateY(-100%)'
        }
      case 'bottom':
        return {
          top: elementPosition.top + elementPosition.height + tooltipOffset,
          left: elementPosition.left + elementPosition.width / 2,
          transform: 'translateX(-50%)'
        }
      case 'left':
        return {
          top: elementPosition.top + elementPosition.height / 2,
          left: elementPosition.left - tooltipOffset,
          transform: 'translateX(-100%) translateY(-50%)'
        }
      case 'right':
        return {
          top: elementPosition.top + elementPosition.height / 2,
          left: elementPosition.left + elementPosition.width + tooltipOffset,
          transform: 'translateY(-50%)'
        }
      case 'center':
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }
      default:
        return {}
    }
  }

  const getArrowPosition = () => {
    if (!currentStepConfig) return {}
    
    const { position = 'bottom' } = currentStepConfig
    
    switch (position) {
      case 'top':
        return { bottom: -8, left: '50%', transform: 'translateX(-50%)' }
      case 'bottom':
        return { top: -8, left: '50%', transform: 'translateX(-50%)' }
      case 'left':
        return { right: -8, top: '50%', transform: 'translateY(-50%)' }
      case 'right':
        return { left: -8, top: '50%', transform: 'translateY(-50%)' }
      default:
        return {}
    }
  }

  if (!isActive || !currentStepConfig) {
    return <>{children}</>
  }

  const renderTourContent = () => {
    if (currentStepConfig.type === 'modal') {
      return (
        <div className="tour-modal">
          <div className="tour-modal-content">
            <h3 className="tour-modal-title">{currentStepConfig.title}</h3>
            <p className="tour-modal-description">{currentStepConfig.description}</p>
            
            {currentStepConfig.buttons && currentStepConfig.buttons.length > 0 ? (
              <div className="tour-modal-buttons">
                {currentStepConfig.buttons.map((button, index) => (
                  <button
                    key={index}
                    className={`tour-button tour-button-${button.variant || 'primary'}`}
                    onClick={() => handleButtonClick(button.action, button.onClick)}
                  >
                    {button.text}
                  </button>
                ))}
              </div>
             ) : (
               <div className="tour-modal-buttons">
                 <button
                   className="tour-button tour-button-secondary"
                   onClick={() => handleButtonClick('skip')}
                 >
                   Пропустить
                 </button>
                 <button
                   className="tour-button tour-button-primary"
                   onClick={() => handleButtonClick('next')}
                 >
                   Далее
                 </button>
               </div>
             )}
             
             <div className="tour-tap-hint">
               Или нажмите в любом месте для продолжения
             </div>
          </div>
        </div>
      )
    }

     if (currentStepConfig.type === 'tooltip') {
       return (
         <div 
           className="tour-tooltip"
           style={getTooltipPosition()}
           onClick={handleOverlayClick}
         >
           {currentStepConfig.showArrow && (
             <div 
               className="tour-arrow"
               style={getArrowPosition()}
             />
           )}
           <div className="tour-tooltip-content">
             <h4 className="tour-tooltip-title">{currentStepConfig.title}</h4>
             <p className="tour-tooltip-description">{currentStepConfig.description}</p>
             <div className="tour-tooltip-hint">
               Нажмите для продолжения
             </div>
           </div>
         </div>
       )
     }

    return null
  }

  return (
    <>
      {children}
      {createPortal(
        <div className="tour-overlay" ref={overlayRef}>
          {/* Подсветка фона с обработчиком клика и дыркой для элемента */}
          <div 
            className={`tour-backdrop ${elementPosition ? 'with-highlight' : ''}`}
            style={{
              clipPath: getBackdropClipPath()
            }}
            onClick={handleOverlayClick}
          />
          
          {/* Подсветка целевого элемента */}
          {elementPosition && (
            <div
              className="tour-highlight"
              style={{
                top: elementPosition.top,
                left: elementPosition.left,
                width: elementPosition.width,
                height: elementPosition.height,
              }}
            />
          )}
          
          {/* Контент тура */}
          {renderTourContent()}
        </div>,
        document.body
      )}
    </>
  )
}

export default TourOverlay

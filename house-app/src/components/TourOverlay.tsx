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

  useEffect(() => {
    if (!isActive || !currentStepConfig) {
      setTargetElement(null)
      setElementPosition(null)
      return
    }

    const element = document.querySelector(currentStepConfig.target)
    if (element) {
      setTargetElement(element as Element)
      const rect = element.getBoundingClientRect()
      setElementPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      })
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

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [targetElement])

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
          {/* Подсветка фона с обработчиком клика */}
          <div 
            className="tour-backdrop" 
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

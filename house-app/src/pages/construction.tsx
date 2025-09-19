import { useState, useEffect } from 'react'
import './construction.css'
import { useFactStore } from '../store/factStore'
import { usePlanStore } from '../store/store'
import { CONSTRUCTION_OPTIONS } from '../constants'
import LayeredCanvas from '../components/LayeredCanvas'
import Indicators from '../components/Indicators'
import ConstructionCard from '../components/ConstructionCard'
import { ArrowLeftIcon, ArrowRightIcon, RiskIcon, MoneyIcon, TimeIcon } from '../components/Icons'
import { useTour } from '../components/TourProvider'
import { useTourStorage } from '../hooks/useTourStorage'
import { CONSTRUCTION_TOUR } from '../config/tours'
import type { ConstructionOption } from '../constants'

const getDayDeclension = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'день'
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'дня'
  } else {
    return 'дней'
  }
}

interface LayerConfig {
  id: string
  assetPath: string
  zIndex: number
  opacity: number
  visible: boolean
  blendMode?: GlobalCompositeOperation
  offsetX?: number
  offsetY?: number
  scaleX?: number
  scaleY?: number
}

interface LayeredImageConfig {
  width: number
  height: number
  layers: LayerConfig[]
}

interface CardData {
  id: number
  title: string
  options: ConstructionOption[]
}

const layeredImageConfig: LayeredImageConfig = {
  width: 288,
  height: 196,
  layers: [
    {
      id: 'house',
      assetPath: '/house.png',
      zIndex: 1,
      opacity: 1,
      visible: true
    },
    {
      id: 'roof-red',
      assetPath: '/redRoof.png',
      zIndex: 2,
      opacity: 1,
      visible: false
    },
    {
      id: 'roof-blue',
      assetPath: '/blueRoof.png',
      zIndex: 2,
      opacity: 1,
      visible: false
    },
    {
      id: 'roof-green',
      assetPath: '/greenRoof.png',
      zIndex: 2,
      opacity: 1,
      visible: false
    },
    {
      id: 'roof-pink',
      assetPath: '/pinkRoof.png',
      zIndex: 2,
      opacity: 1,
      visible: false
    }
  ]
}

const getCardsFromConstants = (): CardData[] => {
  const constructionTypes = [...new Set(CONSTRUCTION_OPTIONS.map(option => option.constructionType))]
  
  return constructionTypes.map((type, index) => ({
    id: index + 1,
    title: type,
    options: CONSTRUCTION_OPTIONS.filter(option => option.constructionType === type)
  }))
}

const mockCards = getCardsFromConstants()

export default function ConstructionPage() {
  const [roofType, setRoofType] = useState<string>('')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  
  const { 
    selectedOptions, 
    selectOption, 
    getRemainingBudget, 
    getRemainingDuration,
    periods,
    currentPeriodIndex,
    selectRiskSolution,
    initializeFromPlan,
    piggyBank,
    requestMoney,
    moveToNextPeriod,
    processDay,
    fundingPlan,
    paymentSchedule,
    planningRemainder
  } = useFactStore()
  
  const planStore = usePlanStore()
  const { startTour } = useTour()
  const { isTourCompleted } = useTourStorage()

  const currentPeriod = periods[currentPeriodIndex]
  const currentRisk = currentPeriod?.risk
  const currentCard = mockCards[currentCardIndex]
  const currentSelection = selectedOptions[currentCard?.title] || undefined

  useEffect(() => {
    initializeFromPlan()
  }, [initializeFromPlan])


  // Запускаем тур при первом посещении страницы
  useEffect(() => {
    const timer = setTimeout(() => {
        startTour(CONSTRUCTION_TOUR)
      }, 500)
      
      return () => clearTimeout(timer)
  }, [isTourCompleted, startTour])

  useEffect(() => {
    // Обновляем тип крыши на основе выбранных опций
    const roofOption = selectedOptions["Крыша"]
    if (roofOption) {
      const roofTypeMap: Record<string, string> = {
        "4 Гибкая/битумная черепица": "red",
        "4 Керамическая черепица": "blue", 
        "4 Металлочерепица": "green"
      }
      setRoofType(roofTypeMap[roofOption.type] || "pink")
    }
  }, [selectedOptions])



  const handleCardSwipeLeft = () => {
    if (currentCardIndex < mockCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    }
  }

  const handleCardSwipeRight = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

  const handleOptionSelect = (option: ConstructionOption) => {
    selectOption(option.constructionType, option)
    
    // Если это карточка крыши, обновляем тип крыши
    if (currentCard?.title === "Крыша") {
      const roofTypeMap: Record<string, string> = {
        "4 Гибкая/битумная черепица": "red",
        "4 Керамическая черепица": "blue", 
        "4 Металлочерепица": "green"
      }
      setRoofType(roofTypeMap[option.type] || "pink")
    }
  }

  const handleRiskSolutionSelect = (solution: 'solution' | 'alternative') => {
    if (currentPeriod) {
      console.log(`🏦 КУБЫШКА ПЕРЕД ВЫБОРОМ РЕШЕНИЯ: ${piggyBank} руб.`)
      selectRiskSolution(currentPeriod.id, solution)
      
      // Обрабатываем дни текущего периода перед переходом
      const currentPeriodDays = currentPeriod.endDay - currentPeriod.startDay + 1
      console.log(`🏗️ Обработка ${currentPeriodDays} дней периода ${currentPeriodIndex + 1}`)
      
      for (let day = currentPeriod.startDay; day <= currentPeriod.endDay; day++) {
        processDay(day)
      }
      
      // Переходим к следующему периоду после выбора решения
      setTimeout(() => {
        moveToNextPeriod()
      }, 1000)
    }
  }


  const updateLayeredConfig = () => {
    const updatedConfig = { ...layeredImageConfig }
    
    // Скрываем все крыши
    updatedConfig.layers.forEach(layer => {
      if (layer.id.startsWith('roof-')) {
        layer.visible = false
      }
    })
    
    // Показываем выбранную крышу
    if (roofType) {
      const roofLayer = updatedConfig.layers.find(layer => layer.id === `roof-${roofType}`)
      if (roofLayer) {
        roofLayer.visible = true
      }
    }
    
    return updatedConfig
  }


  return (
    <div className="construction-page">
      <div className="construction-scroll-container">
        <div className="header">
          <h1 className="title">Строительство</h1>
          <div className="period-badge">
            Период {currentPeriodIndex + 1}
          </div>
        </div>
        
        <div className="construction-container">
          {currentRisk ? (
            currentPeriod?.isProtected ? (
              <div className="protection-card">
                <div className="protection-header">
                  <div className="protection-indicator">
                    <span>🛡️</span>
                    <span>Защита от риска</span>
                  </div>
                </div>
                
                <div className="protection-description">
                  Риск {currentRisk.id}: {currentRisk.description}
                </div>
                
                <div className="protection-info">
                  <div className="protection-text">
                    Этот риск действует на другую конструкцию, поэтому вы защищены от его последствий.
                  </div>
                  
                  <button 
                    className="btn-primary protection-button"
                    onClick={() => {
                      console.log(`🏦 КУБЫШКА ПЕРЕД ЗАЩИТОЙ: ${piggyBank} руб.`)
                      // Обрабатываем дни текущего периода перед переходом
                      const currentPeriodDays = currentPeriod.endDay - currentPeriod.startDay + 1
                      console.log(`🛡️ Обработка ${currentPeriodDays} дней периода ${currentPeriodIndex + 1} (защита)`)
                      
                      for (let day = currentPeriod.startDay; day <= currentPeriod.endDay; day++) {
                        processDay(day)
                      }
                      
                      // Переходим к следующему периоду
                      setTimeout(() => {
                        moveToNextPeriod()
                      }, 1000)
                    }}
                  >
                    Перейти к следующему периоду
                  </button>
                </div>
              </div>
            ) : (
              <div className="risk-card">
                <div className="risk-header">
                  <div className="risk-indicator">
                    <RiskIcon />
                    <span>Риск {currentRisk.id}</span>
                  </div>
                </div>
                
                <div className="risk-description">
                  {currentRisk.description}
                </div>
                
                <div className="risk-solutions">
                  <div 
                    className={`solution-option ${currentPeriod?.selectedSolution === 'solution' ? 'active' : ''}`}
                    onClick={() => handleRiskSolutionSelect('solution')}
                  >
                    <div className="solution-text">{currentRisk.solution}</div>
                    <div className="solution-indicators">
                      <div className="cost-indicator">
                        <MoneyIcon />
                        <span>{currentRisk.cost}</span>
                      </div>
                      <div className="time-indicator">
                        <TimeIcon />
                        <span>{currentRisk.duration} {getDayDeclension(currentRisk.duration)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`solution-option ${currentPeriod?.selectedSolution === 'alternative' ? 'active' : ''}`}
                    onClick={() => handleRiskSolutionSelect('alternative')}
                  >
                    <div className="solution-text">{currentRisk.alternativeDescription}</div>
                    <div className="solution-indicators">
                      <div className="cost-indicator">
                        <MoneyIcon />
                        <span>0</span>
                      </div>
                      <div className="time-indicator">
                        <TimeIcon />
                        <span>+{Math.ceil(currentRisk.duration * 1.5)} {getDayDeclension(Math.ceil(currentRisk.duration * 1.5))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="no-risk-card">
              <div className="no-risk-content">
                <div className="no-risk-icon">✅</div>
                <div className="no-risk-text">В этом периоде рисков нет</div>
              </div>
            </div>
          )}
          
          <div className="house-display">
            <LayeredCanvas config={updateLayeredConfig()} />
          </div>
          
          <Indicators 
            remainingBudget={getRemainingBudget()}
            remainingDuration={getRemainingDuration()}
          />
          
          <div className="request-money-card">
            <div className="request-amount">10 000</div>
            <button 
              className="btn-request"
              onClick={() => {
                console.log(`🏦 КУБЫШКА ПЕРЕД ЗАПРОСОМ: ${piggyBank} руб.`)
                requestMoney(10000)
              }}
            >
              Запросить еще
            </button>
          </div>
          
          <div className="construction-options">
            <div className="options-header">
              <div 
                className="nav-arrow"
                onClick={currentCardIndex === 0 ? undefined : handleCardSwipeRight}
                style={{ 
                  cursor: currentCardIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentCardIndex === 0 ? 0.5 : 1,
                  outline: 0 
                }}
              >
                <ArrowLeftIcon />
              </div>
              <h2 className="options-title">{currentCard?.title}</h2>
              <div className="period-counter">{currentCardIndex + 1}/{mockCards.length}</div>
              <div 
                className="nav-arrow"
                onClick={currentCardIndex === mockCards.length - 1 ? undefined : handleCardSwipeLeft}
                style={{ 
                  cursor: currentCardIndex === mockCards.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentCardIndex === mockCards.length - 1 ? 0.5 : 1,
                  outline: 0 
                }}
              >
                <ArrowRightIcon />
              </div>
            </div>
            
            {currentCard && (
              <ConstructionCard
                title={currentCard.title}
                options={currentCard.options}
                currentSelection={currentSelection}
                onOptionSelect={handleOptionSelect}
              />
            )}
            
            <div className="buttons">
              <button className="btn-secondary">
                К показателям
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  console.log(`🏦 КУБЫШКА ПЕРЕД СТРОИТЕЛЬСТВОМ: ${piggyBank} руб.`)
                }}
              >
                Строить
              </button>
            </div>
          
          </div>
        </div>
      </div>
    </div>
  )
}

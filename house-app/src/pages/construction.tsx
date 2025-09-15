import { useState, useEffect } from 'react'
import './construction.css'
import { useFactStore } from '../store/factStore'
import { usePlanStore } from '../store/store'
import { CONSTRUCTION_OPTIONS } from '../constants'
import LayeredCanvas from '../components/LayeredCanvas'
import Indicators from '../components/Indicators'
import ConstructionCard from '../components/ConstructionCard'
import { ArrowLeftIcon, ArrowRightIcon, RiskIcon, MoneyIcon, TimeIcon } from '../components/Icons'
import type { ConstructionOption } from '../constants'

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
    initializeFromPlan
  } = useFactStore()
  
  const planStore = usePlanStore()

  const currentPeriod = periods[currentPeriodIndex]
  const currentRisk = currentPeriod?.risk
  const currentCard = mockCards[currentCardIndex]
  const currentSelection = selectedOptions[currentCard?.title] || undefined

  useEffect(() => {
    initializeFromPlan()
  }, [initializeFromPlan])

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

  // Инициализируем панель значениями из стора плана при загрузке
  useEffect(() => {
    if (Object.keys(selectedOptions).length === 0 && Object.keys(planStore.selectedOptions).length > 0) {
      // Если в factStore нет выбранных опций, но есть в planStore, копируем их
      Object.entries(planStore.selectedOptions).forEach(([key, value]) => {
        if (value) {
          selectOption(key, value)
        }
      })
    }
  }, [planStore.selectedOptions, selectedOptions, selectOption])


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
      selectRiskSolution(currentPeriod.id, solution)
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
                      <span>{currentRisk.cost} р.</span>
                    </div>
                    <div className="time-indicator">
                      <TimeIcon />
                      <span>{currentRisk.duration} дня</span>
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
                      <span>0 р.</span>
                    </div>
                    <div className="time-indicator">
                      <TimeIcon />
                      <span>+{Math.ceil(currentRisk.duration * 1.5)} дня</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="request-amount">10 000 р.</div>
            <button className="btn-request">
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
              <button className="btn-primary">
                Строить
              </button>
            </div>
            
            <div className="navigation-handle"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

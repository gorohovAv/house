import { useState, useEffect } from 'react'
import './construction.css'
import { useFactStore } from '../store/factStore'
import LayeredCanvas from '../components/LayeredCanvas'
import Indicators from '../components/Indicators'
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

export default function ConstructionPage() {
  const [roofType, setRoofType] = useState<string>('')
  
  const { 
    selectedOptions, 
    selectOption, 
    getRemainingBudget, 
    getRemainingDuration,
    periods,
    currentPeriodIndex,
    setCurrentPeriod,
    selectRiskSolution,
    initializeFromPlan
  } = useFactStore()

  const currentPeriod = periods[currentPeriodIndex]
  const currentRisk = currentPeriod?.risk

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

  const handleSwipeLeft = () => {
    if (currentPeriodIndex < periods.length - 1) {
      setCurrentPeriod(currentPeriodIndex + 1)
    }
  }

  const handleSwipeRight = () => {
    if (currentPeriodIndex > 0) {
      setCurrentPeriod(currentPeriodIndex - 1)
    }
  }

  const handleOptionSelect = (option: ConstructionOption) => {
    selectOption(option.constructionType, option)
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

  const getConstructionOptions = (): ConstructionOption[] => {
    const constructionTypes = [...new Set(Object.values(selectedOptions).map(option => option?.constructionType).filter(Boolean))]
    return constructionTypes.map(type => selectedOptions[type as keyof typeof selectedOptions]).filter(Boolean) as ConstructionOption[]
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
                onClick={currentPeriodIndex === 0 ? undefined : handleSwipeRight}
                style={{ 
                  cursor: currentPeriodIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentPeriodIndex === 0 ? 0.5 : 1,
                  outline: 0 
                }}
              >
                <ArrowLeftIcon />
              </div>
              <h2 className="options-title">Выберите фундамент</h2>
              <div className="period-counter">{currentPeriodIndex + 1}/{periods.length}</div>
              <div 
                className="nav-arrow"
                onClick={currentPeriodIndex === periods.length - 1 ? undefined : handleSwipeLeft}
                style={{ 
                  cursor: currentPeriodIndex === periods.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPeriodIndex === periods.length - 1 ? 0.5 : 1,
                  outline: 0 
                }}
              >
                <ArrowRightIcon />
              </div>
            </div>
            
            <div className="options-list">
              {getConstructionOptions().map((option, index) => (
                <div 
                  key={index}
                  className={`option-item ${selectedOptions[option.constructionType]?.type === option.type ? 'active' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="option-text">{option.type}</div>
                  <div className="option-indicators">
                    <div className="cost-indicator">
                      <MoneyIcon />
                      <span>{option.cost} р.</span>
                    </div>
                    <div className="time-indicator">
                      <TimeIcon />
                      <span>{option.duration} дня</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
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

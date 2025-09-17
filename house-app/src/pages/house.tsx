import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './house.css'
import { usePlanStore } from '../store/store'
import { CONSTRUCTION_OPTIONS } from '../constants'
import type { ConstructionOption } from '../constants'
import LayeredCanvas from '../components/LayeredCanvas'
import ConstructionCard from '../components/ConstructionCard'
import Indicators from '../components/Indicators'
import { ArrowLeftIcon, ArrowRightIcon } from '../components/Icons'
import { useTour } from '../components/TourProvider'
import { useTourStorage } from '../hooks/useTourStorage'
import { HOUSE_PLANNING_TOUR } from '../config/tours'

interface CardData {
  id: number
  title: string
  options: ConstructionOption[]
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

const getCardsFromConstants = (): CardData[] => {
  const constructionTypes = [...new Set(CONSTRUCTION_OPTIONS.map(option => option.constructionType))]
  
  return constructionTypes.map((type, index) => ({
    id: index + 1,
    title: type,
    options: CONSTRUCTION_OPTIONS.filter(option => option.constructionType === type)
  }))
}

const mockCards = getCardsFromConstants()

// Конфигурация для многослойного изображения
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


export default function HousePage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [roofType, setRoofType] = useState<string>('')
  const navigate = useNavigate()
  
  const { 
    selectedOptions, 
    selectOption, 
    getRemainingBudget, 
    getRemainingDuration 
  } = usePlanStore()

  const { startTour } = useTour()
  const { isTourCompleted } = useTourStorage()

  const currentCard = mockCards[currentCardIndex]
  const currentSelection = selectedOptions[currentCard.title] || undefined

  // Проверяем, выбраны ли все элементы
  const allElementsSelected = mockCards.every(card => selectedOptions[card.title])

  // Запускаем тур при первом посещении страницы
  useEffect(() => {
    const timer = setTimeout(() => {
        startTour(HOUSE_PLANNING_TOUR)
      }, 500) // Небольшая задержка для загрузки элементов
      
      return () => clearTimeout(timer)
  }, [isTourCompleted, startTour])

  const handleSwipeLeft = () => {
    if (currentCardIndex < mockCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    }
  }

  const handleSwipeRight = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

  const handleOptionSelect = (option: ConstructionOption) => {
    selectOption(currentCard.title, option)
    
    // Если это карточка крыши, обновляем тип крыши
    if (currentCard.title === "Крыша") {
      const roofTypeMap: Record<string, string> = {
        "4 Гибкая/битумная черепица": "red",
        "4 Керамическая черепица": "blue", 
        "4 Металлочерепица": "green"
      }
      setRoofType(roofTypeMap[option.type] || "pink")
    }
  }

  const handleStartConstruction = () => {
    if (allElementsSelected) {
      navigate('/construction')
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
    <div className="house-page">
      <div className="header">
        <h1 className="title">Планирование</h1>
      </div>
      
      <div className="house-container">
        <div className="house-display">
          <LayeredCanvas config={updateLayeredConfig()} />
        </div>
        
        <Indicators 
          remainingBudget={getRemainingBudget()}
          remainingDuration={getRemainingDuration()}
        />
        
        <div className="controls-panel">
          <div className="controls-content">
            <div className="card-header">
              <div 
                className="nav-arrow"
                onClick={currentCardIndex === 0 ? undefined : handleSwipeRight}
                style={{ 
                  cursor: currentCardIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentCardIndex === 0 ? 0.5 : 1,
                  outline: 0 
                }}
              >
                <ArrowLeftIcon />
              </div>
              <h2 className="card-title">{currentCard.title}</h2>
              <div className="card-counter">{currentCardIndex + 1}/{mockCards.length}</div>
              <div 
                className="nav-arrow"
                onClick={currentCardIndex === mockCards.length - 1 ? undefined : handleSwipeLeft}
                style={{ 
                  cursor: currentCardIndex === mockCards.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentCardIndex === mockCards.length - 1 ? 0.5 : 1,
                  outline: 0 
                }}
              >
                <ArrowRightIcon />
              </div>
            </div>
            
            <ConstructionCard
              title={currentCard.title}
              options={currentCard.options}
              currentSelection={currentSelection}
              onOptionSelect={handleOptionSelect}
            />
          </div>
          
          <div className="buttons">
            <button className="btn-secondary">
              К показателям
            </button>
            <button 
              className="btn-primary"
              disabled={!allElementsSelected}
              onClick={handleStartConstruction}
              style={{ 
                opacity: allElementsSelected ? 1 : 0.5,
                cursor: allElementsSelected ? 'pointer' : 'not-allowed'
              }}
            >
              Строить
            </button>
          </div>
        
        </div>
      </div>
    </div>
  )
}


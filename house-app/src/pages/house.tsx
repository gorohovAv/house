import { useState, useRef, useEffect } from 'react'
import './house.css'
import { usePlanStore } from '../store/store'
import { CONSTRUCTION_OPTIONS } from '../constants'
import type { ConstructionOption } from '../constants'

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

const LayeredCanvas = ({ config }: { config: LayeredImageConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Загружаем все изображения
  useEffect(() => {
    const loadImages = async () => {
      const imageMap = new Map<string, HTMLImageElement>()
      const loadPromises = config.layers.map(layer => {
        return new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            imageMap.set(layer.id, img)
            resolve()
          }
          img.onerror = () => {
            console.warn(`Не удалось загрузить изображение: ${layer.assetPath}`)
            // Создаем заглушку для отсутствующих изображений
            const placeholder = new Image()
            placeholder.src = `https://via.placeholder.com/${config.width}x${config.height}/cccccc/ffffff?text=${layer.id}`
            placeholder.onload = () => {
              imageMap.set(layer.id, placeholder)
              resolve()
            }
          }
          img.src = layer.assetPath
        })
      })

      try {
        await Promise.all(loadPromises)
        setLoadedImages(imageMap)
        setIsLoading(false)
      } catch (error) {
        console.error('Ошибка загрузки изображений:', error)
        setIsLoading(false)
      }
    }

    loadImages()
  }, [config])

  // Рисуем слои на canvas
  useEffect(() => {
    if (isLoading || loadedImages.size === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Получаем видимые слои, отсортированные по zIndex
    const visibleLayers = config.layers
      .filter(layer => layer.visible)
      .sort((a, b) => a.zIndex - b.zIndex)

    // Рисуем каждый слой
    visibleLayers.forEach(layer => {
      const img = loadedImages.get(layer.id)
      if (!img) return

      ctx.save()

      // Устанавливаем режим смешивания
      if (layer.blendMode) {
        ctx.globalCompositeOperation = layer.blendMode
      }

      // Устанавливаем прозрачность
      ctx.globalAlpha = layer.opacity

      // Применяем трансформации
      const offsetX = layer.offsetX || 0
      const offsetY = layer.offsetY || 0
      const scaleX = layer.scaleX || 1
      const scaleY = layer.scaleY || 1

      ctx.translate(offsetX, offsetY)
      ctx.scale(scaleX, scaleY)

      // Рисуем изображение
      ctx.drawImage(img, 0, 0, config.width, config.height)

      ctx.restore()
    })
  }, [config, loadedImages, isLoading])

  if (isLoading) {
    return (
      <div className="canvas-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка изображений...</p>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={config.width}
      height={config.height}
      className="layered-canvas"
    />
  )
}

export default function HousePage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [roofType, setRoofType] = useState<string>('')
  
  const { 
    selectedOptions, 
    selectOption, 
    getRemainingBudget, 
    getRemainingDuration 
  } = usePlanStore()

  const currentCard = mockCards[currentCardIndex]
  const currentSelection = selectedOptions[currentCard.title]

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

  const MoneyIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5C5.25 1.5 2.25 4.5 2.25 8.25C2.25 12 5.25 15 9 15C12.75 15 15.75 12 15.75 8.25C15.75 4.5 12.75 1.5 9 1.5ZM9 13.5C6.75 13.5 4.5 11.25 4.5 8.25C4.5 5.25 6.75 3 9 3C11.25 3 13.5 5.25 13.5 8.25C13.5 11.25 11.25 13.5 9 13.5Z" fill="currentColor"/>
      <path d="M9 5.25C7.5 5.25 6.75 6 6.75 7.5H8.25C8.25 7.125 8.625 6.75 9 6.75C9.375 6.75 9.75 7.125 9.75 7.5C9.75 7.875 9.375 8.25 9 8.25V9.75C9.75 9.75 10.5 9 10.5 8.25C10.5 7.5 9.75 6.75 9 6.75V5.25Z" fill="currentColor"/>
    </svg>
  )

  const TimeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5C5.25 1.5 2.25 4.5 2.25 8.25C2.25 12 5.25 15 9 15C12.75 15 15.75 12 15.75 8.25C15.75 4.5 12.75 1.5 9 1.5ZM9 13.5C6.75 13.5 4.5 11.25 4.5 8.25C4.5 5.25 6.75 3 9 3C11.25 3 13.5 5.25 13.5 8.25C13.5 11.25 11.25 13.5 9 13.5Z" fill="currentColor"/>
      <path d="M9 5.25V8.25L11.25 9.75L10.5 10.5L9 9V5.25Z" fill="currentColor"/>
    </svg>
  )

  const ArrowLeftIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M11.25 3.75L6.75 8.25L11.25 12.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const ArrowRightIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M6.75 3.75L11.25 8.25L6.75 12.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  return (
    <div className="house-page">
      <div className="header">
        <h1 className="title">Планирование</h1>
      </div>
      
      <div className="house-container">
        <div className="house-display">
          <LayeredCanvas config={updateLayeredConfig()} />
        </div>
        
        <div className="indicators">
          <div className="indicator">
            <div className="indicator-title">Остаток лимита</div>
            <div className="indicator-value">
              <MoneyIcon />
              <span className="indicator-text">{getRemainingBudget().toLocaleString()} р.</span>
            </div>
          </div>
          <div className="indicator">
            <div className="indicator-title">Остаток по срокам</div>
            <div className="indicator-value">
              <TimeIcon />
              <span className="indicator-text">{getRemainingDuration()} дней</span>
            </div>
          </div>
        </div>
        
        <div className="controls-panel">
          <div className="card-header">
            <button 
              className="nav-arrow"
              onClick={handleSwipeRight}
              disabled={currentCardIndex === 0}
            >
              <ArrowLeftIcon />
            </button>
            <h2 className="card-title">{currentCard.title}</h2>
            <button 
              className="nav-arrow"
              onClick={handleSwipeLeft}
              disabled={currentCardIndex === mockCards.length - 1}
            >
              <ArrowRightIcon />
            </button>
            <div className="card-counter">{currentCardIndex + 1}/{mockCards.length}</div>
          </div>
          
          <div className="options">
            {currentCard.options.map((option, index) => (
              <div 
                key={index} 
                className={`option-item ${currentSelection?.type === option.type ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
              >
                <span className="option-text">{option.type}</span>
                <div className="option-indicators">
                  <div className="option-money">
                    <MoneyIcon />
                    <span className="option-value">{option.cost.toLocaleString()} р.</span>
                  </div>
                  <div className="option-time">
                    <TimeIcon />
                    <span className="option-value">{option.duration} дня</span>
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
  )
}


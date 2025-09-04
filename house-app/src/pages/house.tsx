import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './house.css'

interface CardData {
  id: number
  title: string
  image: string
  options: string[]
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

const mockCards: CardData[] = [
  {
    id: 1,
    title: "Фундамент",
    image: "https://via.placeholder.com/200x150/8B4513/ffffff?text=Фундамент",
    options: ["Ленточный бетонный", "Свайный", "Плитный", "Столбчатый"]
  },
  {
    id: 2,
    title: "Крыша",
    image: "https://via.placeholder.com/200x150/DC143C/ffffff?text=Крыша",
    options: ["Металлочерепица", "Профнастил", "Шифер", "Мягкая кровля"]
  },
  {
    id: 3,
    title: "Стены",
    image: "https://via.placeholder.com/200x150/696969/ffffff?text=Стены",
    options: ["Кирпич", "Газобетон", "Дерево", "Каркас"]
  },
  {
    id: 4,
    title: "Утепление",
    image: "https://via.placeholder.com/200x150/FFD700/ffffff?text=Утепление",
    options: ["Минеральная вата", "Пенопласт", "Эковата", "Пенополиуретан"]
  }
]

// Конфигурация для многослойного изображения
const layeredImageConfig: LayeredImageConfig = {
  width: 400,
  height: 300,
  layers: [
    {
      id: 'foundation',
      assetPath: '/assets/foundation.png',
      zIndex: 1,
      opacity: 1,
      visible: true
    },
    {
      id: 'walls',
      assetPath: '/assets/walls.png',
      zIndex: 2,
      opacity: 0.9,
      visible: true,
      blendMode: 'multiply'
    },
    {
      id: 'roof',
      assetPath: '/assets/roof.png',
      zIndex: 3,
      opacity: 0.8,
      visible: true
    },
    {
      id: 'insulation',
      assetPath: '/assets/insulation.png',
      zIndex: 4,
      opacity: 0.6,
      visible: false,
      blendMode: 'overlay'
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
  const [selectedOption, setSelectedOption] = useState<string>('')

  const currentCard = mockCards[currentCardIndex]

  const handleSwipeLeft = () => {
    if (currentCardIndex < mockCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setSelectedOption('')
    }
  }

  const handleSwipeRight = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setSelectedOption('')
    }
  }

  return (
    <div className="house-page">
      <div className="left-panel">
        <div className="center-component">
          <LayeredCanvas config={layeredImageConfig} />
        </div>
      </div>
      
      <div className="right-panel">
        <div className="cards-container">
          <div className="card">
            <h2 className="card-title">{currentCard.title}</h2>
            <img 
              src={currentCard.image} 
              alt={currentCard.title}
              className="card-image"
            />
            <div className="options">
              {currentCard.options.map((option, index) => (
                <label key={index} className="option-label">
                  <input
                    type="radio"
                    name="materialOption"
                    value={option}
                    checked={selectedOption === option}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    style={{ marginRight: '10px' }}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
          
          <div className="swipe-controls">
            <button 
              className="swipe-btn"
              onClick={handleSwipeRight}
              disabled={currentCardIndex === 0}
            >
              ← Назад
            </button>
            <div className="card-counter">
              {currentCardIndex + 1} / {mockCards.length}
            </div>
            <button 
              className="swipe-btn"
              onClick={handleSwipeLeft}
              disabled={currentCardIndex === mockCards.length - 1}
            >
              Вперед →
            </button>
          </div>
        </div>
        
        <div className="navigation">
          <Link to="/analytics" className="nav-link">
            Аналитика
          </Link>
        </div>
      </div>
    </div>
  )
}


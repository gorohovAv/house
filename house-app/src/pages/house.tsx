import { useState } from 'react'
import { Link } from 'react-router-dom'
import './house.css'

interface CardData {
  id: number
  title: string
  image: string
  options: string[]
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
          <img 
            src="https://via.placeholder.com/300x400/transparent/ffffff?text=Строительство+Дома" 
            alt="Строительство дома" 
            className="main-image"
          />
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


import { type ConstructionOption } from '../constants'
import { MoneyIcon, TimeIcon } from './Icons'

interface ConstructionCardProps {
  title: string
  options: ConstructionOption[]
  currentSelection?: ConstructionOption
  onOptionSelect: (option: ConstructionOption) => void
}

const getDayDeclension = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'день'
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'дня'
  } else {
    return 'дней'
  }
}

const ConstructionCard = ({ title, options, currentSelection, onOptionSelect }: ConstructionCardProps) => {
  return (
    <div className="options">
      {options.map((option, index) => (
        <div 
          key={index} 
          className={`option-item ${currentSelection?.type === option.type ? 'selected' : ''}`}
          onClick={() => onOptionSelect(option)}
        >
            <span className="option-text">{option.type.replace(/^\d+\s/, '')}</span>
          <div className="option-indicators">
            <div className="option-money">
              <MoneyIcon />
              <span className="option-value">{option.cost.toLocaleString()}</span>
            </div>
            <div className="option-time">
              <TimeIcon />
              <span className="option-value">{option.duration} {getDayDeclension(option.duration)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ConstructionCard

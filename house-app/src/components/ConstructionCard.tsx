import { type ConstructionOption } from '../constants'
import { MoneyIcon, TimeIcon } from './Icons'

interface ConstructionCardProps {
  title: string
  options: ConstructionOption[]
  currentSelection?: ConstructionOption
  onOptionSelect: (option: ConstructionOption) => void
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
  )
}

export default ConstructionCard

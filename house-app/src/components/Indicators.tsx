import { MoneyIcon, TimeIcon } from './Icons'

interface IndicatorsProps {
  remainingBudget: number
  remainingDuration: number
}

const Indicators = ({ remainingBudget, remainingDuration }: IndicatorsProps) => {
  return (
    <div className="indicators">
      <div className="indicator">
        <div className="indicator-title">Остаток лимита</div>
        <div className="indicator-value">
          <MoneyIcon />
          <span className="indicator-text">{remainingBudget.toLocaleString()}</span>
        </div>
      </div>
      <div className="indicator">
        <div className="indicator-title">Остаток по срокам</div>
        <div className="indicator-value">
          <TimeIcon />
          <span className="indicator-text">{remainingDuration} дней</span>
        </div>
      </div>
    </div>
  )
}

export default Indicators

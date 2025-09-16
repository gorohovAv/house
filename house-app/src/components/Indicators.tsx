import { MoneyIcon, TimeIcon } from './Icons'

interface IndicatorsProps {
  remainingBudget: number
  remainingDuration: number
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
          <span className="indicator-text">{remainingDuration} {getDayDeclension(remainingDuration)}</span>
        </div>
      </div>
    </div>
  )
}

export default Indicators

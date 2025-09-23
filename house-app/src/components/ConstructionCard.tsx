import { type ConstructionOption } from "../constants";
import { MoneyIcon, TimeIcon } from "./Icons";

interface ConstructionCardProps {
  title: string;
  options: ConstructionOption[];
  currentSelection?: ConstructionOption;
  onOptionSelect: (option: ConstructionOption) => void;
  isLocked?: boolean;
}

const getDayDeclension = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "день";
  } else if (
    [2, 3, 4].includes(count % 10) &&
    ![12, 13, 14].includes(count % 100)
  ) {
    return "дня";
  } else {
    return "дней";
  }
};

const ConstructionCard = ({
  title,
  options,
  currentSelection,
  onOptionSelect,
  isLocked = false,
}: ConstructionCardProps) => {
  return (
    <div className="options">
      {options.map((option, index) => {
        const isSelected = currentSelection?.type === option.type;
        const isOptionLocked = isLocked && !isSelected;

        return (
          <div
            key={index}
            className={`option-item ${isSelected ? "selected" : ""} ${
              isOptionLocked ? "locked" : ""
            }`}
            onClick={() => !isOptionLocked && onOptionSelect(option)}
            style={{
              cursor: isOptionLocked ? "not-allowed" : "pointer",
              opacity: isOptionLocked ? 0.5 : 1,
            }}
          >
            <span className="option-text">
              {option.type.replace(/^\d+\s/, "")}
            </span>
            {isOptionLocked && <span className="locked-indicator">🔒</span>}
            <div className="option-indicators">
              <div className="option-money">
                <MoneyIcon />
                <span className="option-value">
                  {option.cost.toLocaleString()}
                </span>
              </div>
              <div className="option-time">
                <TimeIcon />
                <span className="option-value">
                  {option.duration} {getDayDeclension(option.duration)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConstructionCard;

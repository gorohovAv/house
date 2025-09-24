import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CupGoldIcon,
  CupSilverIcon,
  CupBronzeIcon,
  MedalIcon,
} from "../components/Icons";
import "./results.css";

interface ResultItem {
  id: number;
  position: number;
  name: string;
  isCurrentUser?: boolean;
}

const Results: React.FC = () => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Заглушка данных для визуального теста
    const mockResults: ResultItem[] = [
      { id: 1, position: 1, name: "Усадьба Васнецова", isCurrentUser: true },
      { id: 2, position: 2, name: "Домик Константинова" },
      { id: 3, position: 3, name: "Дача Потапова" },
      { id: 4, position: 4, name: "Строю домик" },
      { id: 5, position: 5, name: "Лучший дом" },
      { id: 6, position: 6, name: "Очень длинный ник не вмещается" },
      { id: 7, position: 7, name: "Зая из рая" },
      { id: 8, position: 8, name: "katusha_22" },
      { id: 9, position: 185, name: "Строю дом" },
    ];

    // Имитация загрузки с бэка
    setTimeout(() => {
      setResults(mockResults);
      setLoading(false);
    }, 1000);
  }, []);

  const getIconForPosition = (position: number) => {
    if (position === 1) return <CupGoldIcon />;
    if (position === 2) return <CupSilverIcon />;
    if (position === 3) return <CupBronzeIcon />;
    return <MedalIcon />;
  };

  const handlePlayAgain = () => {
    // Переход к началу игры (онбординг)
    navigate("/");
  };

  if (loading) {
    return (
      <div className="results-container">
        <div className="results-loading">Загрузка результатов...</div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1 className="results-title">Рейтинг</h1>
      </div>

      <div className="results-content">
        {results.map((result) => (
          <div
            key={result.id}
            className={`results-item ${
              result.isCurrentUser ? "results-item-current" : ""
            }`}
          >
            <span className="results-position">{result.position}</span>
            <div className="results-icon">
              {getIconForPosition(result.position)}
            </div>
            <span className="results-name">{result.name}</span>
          </div>
        ))}

        <div className="results-divider">
          <span>...</span>
        </div>

        <div className="results-item results-item-last">
          <span className="results-position">185</span>
          <div className="results-icon">
            <MedalIcon />
          </div>
          <span className="results-name">Строю дом</span>
        </div>
      </div>

      <button className="results-play-again" onClick={handlePlayAgain}>
        Играть заново
      </button>
    </div>
  );
};

export default Results;

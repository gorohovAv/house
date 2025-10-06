import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CupGoldIcon,
  CupSilverIcon,
  CupBronzeIcon,
  MedalIcon,
} from "../components/Icons";
import type { ResultItem, ConstructionResult } from "../types/api";
import { useOnboardingStore } from "../store/onboardingStore";
import "./results.css";

// Базовый URL API
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "10.92.50.3" // меняем здесь
    ? `http://${window.location.hostname}:8080/api`
    : "https://scheduler-assistant.ru/api";

const Results: React.FC = () => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const navigate = useNavigate();
  const { projectName } = useOnboardingStore();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`${API_URL}/results`);
        if (!response.ok) {
          throw new Error("Ошибка при загрузке результатов");
        }

        const data: ConstructionResult[] = await response.json();

        // Добавляем позицию и отмечаем текущего пользователя по названию дома
        const resultsWithPosition: ResultItem[] = data.map(
          (item: ConstructionResult, index: number) => ({
            ...item,
            position: index + 1,
            isCurrentUser: item.name === projectName, // Текущий пользователь определяется по названию дома
          })
        );

        setResults(resultsWithPosition);
        setLoading(false);

        // Показываем модалку поздравления для текущего пользователя
        if (resultsWithPosition.length > 0) {
          const currentUser = resultsWithPosition.find((r) => r.isCurrentUser);
          if (currentUser && currentUser.position === 1) {
            // Небольшая задержка для корректного отображения модалки
            setTimeout(() => {
              setShowCongratsModal(true);
            }, 100);
          }
        }
      } catch (error) {
        console.error("Ошибка при загрузке результатов:", error);

        // Fallback на заглушку при ошибке
        const mockResults: ResultItem[] = [
          {
            id: 1,
            position: 1,
            name: "Мой дом",
            isCurrentUser: true,
            planned_duration: 90,
            planned_cost: 50000,
            actual_duration: 95,
            actual_cost: 52000,
            cost_difference: 2000,
            duration_difference: 5,
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            position: 2,
            name: "Усадьба Васнецова",
            isCurrentUser: false,
            planned_duration: 90,
            planned_cost: 50000,
            actual_duration: 95,
            actual_cost: 52000,
            cost_difference: 2000,
            duration_difference: 5,
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            position: 3,
            name: "Домик Константинова",
            isCurrentUser: false,
            planned_duration: 90,
            planned_cost: 50000,
            actual_duration: 100,
            actual_cost: 55000,
            cost_difference: 5000,
            duration_difference: 10,
            created_at: new Date().toISOString(),
          },
        ];

        setResults(mockResults);
        setLoading(false);

        // Показываем модалку для первого места в fallback данных
        const currentUser = mockResults.find((r) => r.isCurrentUser);
        if (currentUser && currentUser.position === 1) {
          setTimeout(() => {
            setShowCongratsModal(true);
          }, 100);
        }
      }
    };

    fetchResults();
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

        {/*results.length > 10 && (
          <div className="results-item results-item-last">
            <span className="results-position">
              {results[results.length - 1].position}
            </span>
            <div className="results-icon">
              {getIconForPosition(results[results.length - 1].position)}
            </div>
            <span className="results-name">
              {results[results.length - 1].name}
            </span>
          </div>
        )*/}
      </div>
      {/* 
      <button className="results-play-again" onClick={handlePlayAgain}>
        Играть заново
      </button>*/}

      {/* Модалка поздравления */}
      {showCongratsModal && (
        <div className="congrats-modal-overlay">
          <div className="congrats-modal">
            <div className="congrats-header">
              <CupGoldIcon />
              <h2 className="congrats-title">1 место</h2>
            </div>
            <h3 className="congrats-subtitle">Поздравляем! 🎉🏠</h3>
            <p className="congrats-text">
              Ты построил свой идеальный дом! От заливки фундамента до уютного
              благоустройства — ты проделал огромный путь. Теперь в этом доме
              живут твои старания и усердие!
            </p>
            <button
              className="congrats-close"
              onClick={() => setShowCongratsModal(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStore } from "../store/onboardingStore";
import "./onboarding.css";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    projectName,
    isProjectNameValid,
    setProjectName,
    nextStep,
    completeOnboarding,
  } = useOnboardingStore();

  const [inputValue, setInputValue] = useState(projectName);
  const [showError, setShowError] = useState(false);

  const handleNext = () => {
    if (currentStep === "project-name") {
      if (inputValue.trim().length === 0) {
        setShowError(true);
        return;
      }
      setProjectName(inputValue);
      completeOnboarding();
      navigate("/plan");
    } else {
      nextStep();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowError(false);
    // Обновляем валидность в store при каждом изменении
    setProjectName(value);
  };

  const renderWelcomeStep = () => (
    <div className="onboarding-welcome">
      <div className="onboarding-logo-container">
        <div className="onboarding-logo">
          <img
            src="/src/assets/icons/logo.svg"
            alt="Logo"
            width="40"
            height="44"
          />
        </div>
        <div className="onboarding-title">
          <h1>СТРОИМ ДОМ</h1>
          <p>деловая игра</p>
        </div>
      </div>
      <h2>Добро пожаловать!</h2>
    </div>
  );

  const renderDescriptionStep = () => (
    <div className="onboarding-description">
      <div className="onboarding-content">
        <p>Здесь будет описание игры и инструкции для пользователя</p>
      </div>
    </div>
  );

  const renderProjectNameStep = () => (
    <div className="onboarding-project-name">
      <div className="onboarding-form">
        <h2>Введите наименование проекта</h2>
        <div className="onboarding-input-container">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Название проекта"
            className={`onboarding-input ${
              showError ? "onboarding-input-error" : ""
            }`}
          />
          {showError && (
            <div className="onboarding-error">
              неправильное название проекта
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getButtonText = () => {
    switch (currentStep) {
      case "welcome":
      case "description":
        return "Далее";
      case "project-name":
        return "Начать";
      default:
        return "Далее";
    }
  };

  const getButtonClass = () => {
    if (currentStep === "project-name" && !isProjectNameValid) {
      return "onboarding-button-secondary";
    }
    return "onboarding-button-primary";
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content-wrapper">
        {currentStep === "welcome" && renderWelcomeStep()}
        {currentStep === "description" && renderDescriptionStep()}
        {currentStep === "project-name" && renderProjectNameStep()}
      </div>

      <div className="onboarding-navigation">
        <button className={getButtonClass()} onClick={handleNext}>
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;

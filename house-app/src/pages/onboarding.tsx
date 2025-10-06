import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStore } from "../store/onboardingStore";
import "./onboarding.css";

/*
"Вы стали руководителем собственного строительного проекта! 
Ваша задача — не просто построить дом, а сделать это блестяще: уложиться в бюджет, соблюсти сроки и справиться со всеми неожиданностями, которые приготовила вам стройка.

Вас ждёт увлекательный путь из двух ключевых этапов:
Планирование: где вы создадите идеальный план.
Строительство: где вы воплотите его в жизнь, принимая смелые решения.

Это ваш проект, ваши правила. Проявите стратегическое мышление, будьте внимательны к деталям! Удачи!"


*/

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
  const [showProfanityWarning, setShowProfanityWarning] = useState(false);

  // Расширенный список нецензурных слов
  const profanityWords = [
    // Основные русские маты
    'блядь', 'сука', 'хуй', 'пизда', 'ебать', 'ебаный', 'ебаная', 'ебаное',
    'бля', 'блять', 'хуйня', 'пиздец', 'ебанутый', 'ебанутая', 'ебанутое',
    'говно', 'дерьмо', 'залупа', 'мудак', 'мудачка', 'мудацкий', 'мудацкая',
    'хуевый', 'хуевая', 'хуевое', 'пиздатый', 'пиздатая', 'пиздатое',
    
    // Дополнительные русские выражения
    'ебать-копать', 'ебать-колотить', 'ебать-мать', 'ебать-пизда',
    'хуй с горы', 'хуй на палочке', 'хуй собачий', 'хуй моржовый',
    'пизда на палочке', 'пизда собачья', 'пизда моржовая',
    'блядский', 'блядская', 'блядское', 'сукин', 'сукина', 'сукино',
    'хуев', 'хуева', 'хуево', 'пиздецкий', 'пиздецкая', 'пиздецкое',
    
    // Сленг и жаргон
    'ебало', 'ебала', 'ебал', 'ебалай', 'ебалайка', 'ебалайчик',
    'хуйло', 'хуйла', 'хуйлочка', 'хуйлово', 'хуйловская',
    'пиздюк', 'пиздючка', 'пиздюков', 'пиздюкова', 'пиздюково',
    'блядство', 'блядствовать', 'блядствовал', 'блядствовала',
    'хуесос', 'хуесосить', 'хуесосил', 'хуесосила',
    'пиздобол', 'пиздоболить', 'пиздоболил', 'пиздоболила',
    
    // Английские маты
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'piss',
    'fucking', 'shitting', 'bitching', 'damned', 'crapped',
    'fucker', 'shitter', 'bitchy', 'assholish', 'crapola',
    'fuckup', 'shithead', 'bitchass', 'asshat', 'crapfest',
    'fuckface', 'shitface', 'bitchface', 'assface', 'crapface',
    
    // Другие языки
    'merde', 'putain', 'con', 'salope', 'connard', 'enculé',
    'scheiße', 'ficken', 'arschloch', 'hurensohn', 'fotze',
    'cazzo', 'merda', 'puttana', 'stronzo', 'troia',
    'joder', 'mierda', 'puta', 'cabrón', 'hijo de puta',
    
    // Цифровые замены и символы
    'ху3', 'хуй3', 'пизд3ц', 'бля3', 'еба3', 'сук3',
    'х*й', 'п*зда', 'б*ядь', 'е*ать', 'с*ка', 'г*вно',
    'х@й', 'п@зда', 'б@ядь', 'е@ать', 'с@ка', 'г@вно',
    'х#й', 'п#зда', 'б#ядь', 'е#ать', 'с#ка', 'г#вно',
    
    // Сокращения и аббревиатуры
    'бд', 'хй', 'пзд', 'еб', 'ск', 'гв', 'дрм', 'злп',
    'мдк', 'мдц', 'хв', 'хвй', 'пздт', 'блт', 'ебт',
    'скт', 'гвт', 'дрмт', 'злпт', 'мдкт', 'мдцт',
    
    // Транслитерация
    'blyad', 'suka', 'huy', 'pizda', 'ebat', 'ebany',
    'blya', 'blyat', 'huynya', 'pizdets', 'ebanutiy',
    'govno', 'dermo', 'zalupa', 'mudak', 'mudachka',
    'huevyi', 'huevaya', 'huevoe', 'pizdatyi', 'pizdataya',
    
    // Другие варианты написания
    'бляд', 'блят', 'блятб', 'блятс', 'блятц', 'блятч',
    'сук', 'сукк', 'суккк', 'сукккк', 'суккккк',
    'хуйй', 'хуййй', 'хуйййй', 'хуййййй', 'хуйййййй',
    'пизд', 'пиздд', 'пизддд', 'пиздддд', 'пизддддд',
    'ебт', 'ебтт', 'ебттт', 'ебтттт', 'ебттттт',
    
    // Смешанные варианты
    'блядб', 'сукк', 'хуйй', 'пиздд', 'ебтт', 'гвнн',
    'блядс', 'сукс', 'хуйс', 'пиздс', 'ебтс', 'гвнс',
    'блядц', 'сукц', 'хуйц', 'пиздц', 'ебтц', 'гвнц',
    'блядч', 'сукч', 'хуйч', 'пиздч', 'ебтч', 'гвнч'
  ];

  // Функция проверки на нецензурную лексику
  const checkProfanity = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return profanityWords.some(word => lowerText.includes(word));
  };

  const handleNext = () => {
    if (currentStep === "project-name") {
      if (inputValue.trim().length === 0) {
        setShowError(true);
        setShowProfanityWarning(false);
        return;
      }
      
      if (checkProfanity(inputValue)) {
        setShowProfanityWarning(true);
        setShowError(false);
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
    setShowProfanityWarning(false);
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
        <div className="onboarding-presentation">
          <div className="onboarding-hero">
            <div className="onboarding-icon">👷‍♂️</div>
            <h1 className="onboarding-title">Добро пожаловать в мир строительства!</h1>
          </div>
          
          <div className="onboarding-mission">
            <h2>🎯 Ваша миссия</h2>
            <p>Вы стали <strong>руководителем собственного строительного проекта!</strong></p>
            <p>Ваша задача — не просто построить дом, а сделать это <strong>блестяще</strong>:</p>
            <ul className="onboarding-goals">
              <li>💰 Уложиться в бюджет</li>
              <li>⏰ Соблюсти сроки</li>
              <li>⚡ Справиться со всеми неожиданностями</li>
            </ul>
          </div>

          <div className="onboarding-journey">
            <h2>🛣️ Ваш путь</h2>
            <div className="onboarding-stages">
              <div className="onboarding-stage">
                <div className="stage-icon">📋</div>
                <div className="stage-content">
                  <h3>Планирование</h3>
                  <p>Создайте идеальный план</p>
                </div>
              </div>
              <div className="onboarding-arrow">→</div>
              <div className="onboarding-stage">
                <div className="stage-icon">🚧</div>
                <div className="stage-content">
                  <h3>Строительство</h3>
                  <p>Воплотите план в жизнь, принимая смелые решения</p>
                </div>
              </div>
            </div>
          </div>

          <div className="onboarding-challenge">
            <h2>💪 Ваш вызов</h2>
            <p>Это <strong>ваш проект, ваши правила</strong>.</p>
            <p>Проявите стратегическое мышление, будьте внимательны к деталям!</p>
            <div className="onboarding-wish">🚀 <strong>Удачи!</strong></div>
          </div>
        </div>
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
            } ${
              showProfanityWarning ? "onboarding-input-profanity" : ""
            }`}
          />
          {showError && (
            <div className="onboarding-error">
              неправильное название проекта
            </div>
          )}
          {showProfanityWarning && (
            <div className="onboarding-profanity-warning">
              ⚠️ Пожалуйста, используйте корректную лексику в названии проекта
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

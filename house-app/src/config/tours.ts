import { type TourConfig } from '../components/TourProvider'

export const HOUSE_PLANNING_TOUR: TourConfig = {
  id: 'house-planning-tour',
  steps: [
    {
      target: '.house-display',
      title: 'Добро пожаловать на этап "Планирование"',
      description: 'На этом этапе вам предостоит создать план вашего дома с учетом срока и бюджетов',
      type: 'modal',
      position: 'center',
      buttons: [
        {
          text: 'Понятно',
          action: 'next',
          variant: 'primary'
        }
      ]
    },
    {
      target: '.indicators',
      title: 'Индикаторы бюджета и времени',
      description: 'Данный индикатор показывает остаток вашего бюджета',
      type: 'tooltip',
      position: 'bottom',
      showArrow: true
    },
    {
      target: '.controls-panel',
      title: 'Выберите фундамент',
      description: 'Поле с вариантами материалов, на котором указаны сумма и время строительства',
      type: 'tooltip',
      position: 'top',
      showArrow: true
    }
  ]
}

export const CONSTRUCTION_TOUR: TourConfig = {
  id: 'construction-tour',
  steps: [
    {
      target: '.header',
      title: 'Этап строительства',
      description: 'Здесь вы можете отслеживать прогресс строительства вашего дома',
      type: 'modal',
      position: 'center',
      buttons: [
        {
          text: 'Понятно',
          action: 'next',
          variant: 'primary'
        }
      ]
    },
    {
      target: '.risk-card, .no-risk-card',
      title: 'Управление рисками',
      description: 'Здесь отображаются риски и их решения для текущего периода строительства',
      type: 'tooltip',
      position: 'bottom',
      showArrow: true
    },
    {
      target: '.indicators',
      title: 'Индикаторы бюджета и времени',
      description: 'Отслеживайте оставшийся бюджет и время строительства',
      type: 'tooltip',
      position: 'bottom',
      showArrow: true
    },
    {
      target: '.construction-options',
      title: 'Опции строительства',
      description: 'Здесь вы можете изменить выбранные материалы и решения',
      type: 'tooltip',
      position: 'top',
      showArrow: true
    }
  ]
}

export const ANALYTICS_TOUR: TourConfig = {
  id: 'analytics-tour',
  steps: [
    {
      target: '.analytics-chart',
      title: 'Аналитика строительства',
      description: 'Здесь вы можете просматривать детальную аналитику по затратам и срокам',
      type: 'modal',
      position: 'center',
      buttons: [
        {
          text: 'Понятно',
          action: 'complete',
          variant: 'primary'
        }
      ]
    }
  ]
}

export const ALL_TOURS = {
  HOUSE_PLANNING: HOUSE_PLANNING_TOUR,
  CONSTRUCTION: CONSTRUCTION_TOUR,
  ANALYTICS: ANALYTICS_TOUR
}

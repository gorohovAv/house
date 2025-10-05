// Типы для API запросов и ответов

export interface CreateResultRequest {
  name: string;
  planned_duration: number;
  planned_cost: number;
  actual_duration: number;
  actual_cost: number;
  is_completed: boolean;
}

export interface ConstructionResult {
  id: number;
  name: string;
  planned_duration: number;
  planned_cost: number;
  actual_duration: number;
  actual_cost: number;
  cost_difference: number;
  duration_difference: number;
  is_completed: boolean;
  created_at: string;
}

export interface ResultItem extends ConstructionResult {
  position: number;
  isCurrentUser?: boolean;
}

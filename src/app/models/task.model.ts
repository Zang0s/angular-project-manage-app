export type TaskPriority = 'niski' | 'sredni' | 'wysoki';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  nazwa: string;
  opis: string;
  priorytet: TaskPriority;
  storyId: string;
  przewidywanyCzas: number;
  stan: TaskStatus;
  dataDodania: string;
  dataStartu: string | null;
  dataZakonczenia: string | null;
  przypisanyUzytkownikId: string | null;
  zrealizowaneRoboczogodziny: number;
}

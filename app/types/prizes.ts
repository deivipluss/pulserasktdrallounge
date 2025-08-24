export interface Prize {
  id: number;
  name: string;
  color: string;
  icon?: string;
  stock: number;
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hasStarted: boolean;
}

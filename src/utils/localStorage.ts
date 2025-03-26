
// Type definitions for our data models
export interface Professor {
  id: string;
  nome: string;
  titulo: string;
  materias: Materia[];
  valorHoraAula: number;
  estatutario: boolean;
  observacoes?: string;
}

export interface Materia {
  id: string;
  nome: string;
  data: string;
  horario: string;
  local: string;
  horasAula: number;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  whatsapp: string;
  prioridade: 'alta' | 'media' | 'baixa';
  notificacaoAntecipada: number; // em dias
  notificado: boolean;
}

export interface Aluno {
  id: string;
  nome: string;
  whatsapp?: string; // Novo campo para número de WhatsApp
  notas: Nota[];
  totalAulas: number;
  faltas: number;
  limiteFaltas: number; // em percentual
}

export interface Nota {
  id: string;
  valor: number;
  peso: number;
  descricao: string;
}

export interface AppConfig {
  darkMode: boolean;
  whatsappIntegration: boolean;
}

// StorageKey enum to prevent typos in storage keys
export enum StorageKey {
  PROFESSORES = 'professores',
  EVENTOS = 'eventos',
  ALUNOS = 'alunos',
  CONFIG = 'config',
}

// Generic storage functions
export const getItem = <T>(key: StorageKey): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item from localStorage: ${key}`, error);
    return null;
  }
};

export const setItem = <T>(key: StorageKey, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item to localStorage: ${key}`, error);
  }
};

// Specific storage functions
export const getProfessores = (): Professor[] => {
  return getItem<Professor[]>(StorageKey.PROFESSORES) || [];
};

export const setProfessores = (professores: Professor[]): void => {
  setItem(StorageKey.PROFESSORES, professores);
};

export const getEventos = (): Evento[] => {
  return getItem<Evento[]>(StorageKey.EVENTOS) || [];
};

export const setEventos = (eventos: Evento[]): void => {
  setItem(StorageKey.EVENTOS, eventos);
};

export const getAlunos = (): Aluno[] => {
  return getItem<Aluno[]>(StorageKey.ALUNOS) || [];
};

export const setAlunos = (alunos: Aluno[]): void => {
  setItem(StorageKey.ALUNOS, alunos);
};

export const getConfig = (): AppConfig => {
  return getItem<AppConfig>(StorageKey.CONFIG) || { darkMode: false, whatsappIntegration: true };
};

export const setConfig = (config: AppConfig): void => {
  setItem(StorageKey.CONFIG, config);
};

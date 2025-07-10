export interface BirthdayData {
  PatientId: string;
  Name: string;
  BirthDate: string;
  Email?: string;
  Phone?: string;
  Age?: string;
}

export interface Solution {
  getBirthdays(date: string, subscriberId: string): Promise<BirthdayData[]>;
}

// Função simples para escolher a solução
export function solutionCore(solutionName: string): Solution {
  switch (solutionName) {
    case 'clinicorp':
      return new ClinicorpSolution();
    // case 'dentalx':
    //   return new DentalXSolution();
    default:
      throw new Error(`Solução '${solutionName}' não encontrada`);
  }
}

// Import da ClinicorpSolution
import { ClinicorpSolution } from './clinicorpSolution';

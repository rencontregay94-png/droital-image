export type AutorisationChoice = 'interne' | 'internet' | 'refus';

export type FormulaireStatut = 'a_imprimer' | 'a_recuperer' | 'signe_recu' | 'probleme';

export interface FormulaireItem {
  id: string;
  parentCivilite?: string;
  parentNom: string;
  parentPrenom: string;
  parentEmail?: string;
  parentTelephone?: string;
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  choix: AutorisationChoice;
  faitA: string;
  faitLe: string;
  dateCreation: string;
  statut: FormulaireStatut;
  notes?: string;
  dateSignaturePrevue?: string;
}

export interface FormulaireStats {
  total: number;
  autorisationsInterne: number;
  autorisationsInternet: number;
  autorisationsTotal: number;
  refus: number;
  statuts: {
    a_imprimer: number;
    a_recuperer: number;
    signe_recu: number;
    probleme: number;
  };
  parClasse: Record<string, { total: number; autorisations: number; refus: number }>;
}

export interface AdminUser {
  id: string;
  login: string;
  nom: string;
}

export interface SchoolConfig {
  classes: string[];
  destPersonne: string;
  dateLimite: string;
}

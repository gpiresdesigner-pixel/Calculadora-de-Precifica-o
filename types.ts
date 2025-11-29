export enum TattooStyle {
  FINE_LINE = 'Fine Line',
  OLD_SCHOOL = 'Old School',
  REALISM = 'Realismo',
  BLACKWORK = 'Blackwork',
  WATERCOLOR = 'Aquarela',
  TRIBAL = 'Tribal',
  LETTERING = 'Lettering',
  OTHER = 'Outro'
}

export enum ComplexityLevel {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  EXTREME = 'Extrema'
}

export interface FixedCosts {
  monthlyRent: number;
  monthlyUtilities: number; // Electricity, internet, etc.
  monthlyMarketing: number;
  monthlyMisc: number;
  daysWorkedPerMonth: number;
  hoursWorkedPerDay: number;
}

export interface TattooProject {
  style: TattooStyle;
  complexity: ComplexityLevel;
  widthCm: number; // Changed from sizeCm
  heightCm: number; // Changed from sizeCm
  bodyPart: string;
  sessions: number;
  designTimeHours: number;
  tattooTimeHours: number;
  materialCost: number; // Needles, ink, gloves, paper, etc.
  hourlyRate: number; // Artist's desired hourly wage for labor
  profitMarginPercent: number; // Desired profit on top of costs
  discountAmount: number; // Fixed amount or calculated from %
  discountType: 'percentage' | 'fixed';
}

export interface PricingResult {
  overheadPerHour: number;
  totalOverheadCost: number;
  laborCost: number;
  totalBaseCost: number;
  grossPrice: number; // Before discount
  suggestedPrice: number; // Final price (after discount)
  profitAmount: number;
  breakdown: {
    name: string;
    value: number;
    color: string;
  }[];
}

export interface AIAnalysisResult {
  analysis: string;
  tips: string[];
  isSustainable: boolean;
}

// --- New Types for Database Features ---

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: number;
}

export interface StudioProfile {
  name: string;
  ownerName: string;
  document: string; // CPF or CNPJ
  address: string;
  phone: string;
  email: string;
  logoUrl?: string; // New field for logo
}

export type ProjectStatus = 'draft' | 'completed';

export interface SavedProject extends TattooProject {
  id: string;
  clientId: string;
  clientName?: string; // For easier display
  clientPhone?: string; // Added for WhatsApp integration
  date: number;
  status: ProjectStatus;
  finalPrice: number;
  finalCost: number;
  finalProfit: number;
}

export enum DocumentType {
  CONTRACT = 'Contrato de Prestação de Serviço',
  ANAMNESIS = 'Ficha de Anamnese',
  AFTERCARE = 'Manual de Cuidados'
}
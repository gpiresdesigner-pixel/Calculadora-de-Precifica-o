import { TattooStyle, ComplexityLevel, StudioProfile, TattooProject, FixedCosts } from './types';

// Multiplier based on complexity (Subjective adjustment to the final price)
export const COMPLEXITY_MULTIPLIERS: Record<ComplexityLevel, number> = {
  [ComplexityLevel.LOW]: 1.0,
  [ComplexityLevel.MEDIUM]: 1.15,
  [ComplexityLevel.HIGH]: 1.3,
  [ComplexityLevel.EXTREME]: 1.5,
};

// Base difficulty multiplier by style
export const STYLE_MULTIPLIERS: Record<TattooStyle, number> = {
  [TattooStyle.FINE_LINE]: 1.1,
  [TattooStyle.OLD_SCHOOL]: 1.0,
  [TattooStyle.REALISM]: 1.4,
  [TattooStyle.BLACKWORK]: 1.1,
  [TattooStyle.WATERCOLOR]: 1.25,
  [TattooStyle.TRIBAL]: 1.0,
  [TattooStyle.LETTERING]: 1.05,
  [TattooStyle.OTHER]: 1.0,
};

export const BODY_PARTS = [
  'Antebraço',
  'Braço (Bíceps/Tríceps)',
  'Ombro',
  'Mão',
  'Peito',
  'Costas (Alta)',
  'Costas (Completa)',
  'Costela',
  'Abdômen',
  'Coxa',
  'Panturrilha',
  'Canela',
  'Pé',
  'Pescoço',
  'Rosto',
  'Outro'
];

export const INITIAL_FIXED_COSTS: FixedCosts = {
  monthlyRent: 1500,
  monthlyUtilities: 300,
  monthlyMarketing: 200,
  monthlyMisc: 100,
  daysWorkedPerMonth: 22,
  hoursWorkedPerDay: 6,
};

export const INITIAL_PROJECT: TattooProject = {
  style: TattooStyle.BLACKWORK,
  complexity: ComplexityLevel.MEDIUM,
  widthCm: 10,
  heightCm: 10,
  bodyPart: 'Antebraço',
  sessions: 1,
  designTimeHours: 1,
  tattooTimeHours: 3,
  materialCost: 50,
  hourlyRate: 100,
  profitMarginPercent: 30,
  discountAmount: 0,
  discountType: 'fixed',
};

export const INITIAL_STUDIO_PROFILE: StudioProfile = {
  name: 'Seu Studio',
  ownerName: 'Seu Nome',
  document: '000.000.000-00',
  address: 'Rua da Tatuagem, 123',
  phone: '(00) 00000-0000',
  email: 'contato@seustudio.com',
  logoUrl: ''
};
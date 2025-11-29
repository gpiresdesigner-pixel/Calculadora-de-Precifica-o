import { TattooProject, FixedCosts, PricingResult, AIAnalysisResult } from "../types";

// Lógica de IA desativada para build de produção sem API Key
// Substituído por respostas simuladas (Mocks)

export const analyzePricingWithGemini = async (
  project: TattooProject,
  costs: FixedCosts,
  result: PricingResult
): Promise<AIAnalysisResult> => {
  // Simulação de delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    analysis: "O sistema de IA está temporariamente desativado para esta versão de demonstração. Em produção, aqui apareceria uma análise detalhada sobre a viabilidade do preço baseada nos custos do seu estúdio.",
    tips: [
      "Verifique se o tempo de sessão estimado cobre imprevistos.",
      "Considere oferecer um pacote de sessões para tatuagens grandes.",
      "Lembre-se de incluir o custo de materiais descartáveis extras."
    ],
    isSustainable: true
  };
};

export const generateSalesPitch = async (
  project: TattooProject,
  price: number,
  clientName: string | undefined
): Promise<string> => {
  // Simulação de delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const name = clientName || "Cliente";
  return `Olá ${name}, tudo bem? 

Aqui é do estúdio! Fiz o orçamento para sua tattoo no estilo ${project.style} (${project.bodyPart}).

O valor do investimento para esse projeto exclusivo fica em R$ ${price.toFixed(2)}. 

Trabalhamos com materiais de ponta e total biossegurança. Podemos agendar?`;
};
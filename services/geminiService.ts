import { GoogleGenAI, Type } from "@google/genai";
import { TattooProject, FixedCosts, PricingResult, AIAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePricingWithGemini = async (
  project: TattooProject,
  costs: FixedCosts,
  result: PricingResult
): Promise<AIAnalysisResult> => {
  
  const prompt = `
    Atue como um consultor de negócios experiente para estúdios de tatuagem.
    Analise os seguintes dados de precificação de um projeto de tatuagem:

    CONTEXTO DO ESTÚDIO:
    - Custos Fixos Mensais: R$ ${(costs.monthlyRent + costs.monthlyUtilities + costs.monthlyMarketing + costs.monthlyMisc).toFixed(2)}
    - Custo Fixo por Hora (Calculado): R$ ${result.overheadPerHour.toFixed(2)}
    
    DETALHES DO PROJETO:
    - Estilo: ${project.style}
    - Complexidade: ${project.complexity}
    - Parte do Corpo: ${project.bodyPart}
    - Dimensões: ${project.widthCm}cm (L) x ${project.heightCm}cm (A)
    - Tempo Total (Design + Tattoo): ${project.designTimeHours + project.tattooTimeHours} horas
    - Custo Materiais: R$ ${project.materialCost.toFixed(2)}
    
    RESULTADO FINANCEIRO:
    - Custo Base Total (para o tatuador): R$ ${result.totalBaseCost.toFixed(2)}
    - Preço Sugerido (Venda): R$ ${result.suggestedPrice.toFixed(2)}
    - Lucro Líquido: R$ ${result.profitAmount.toFixed(2)}
    - Margem Aplicada: ${project.profitMarginPercent}%

    Sua tarefa é retornar um JSON com:
    1. Uma análise curta (máximo 2 parágrafos) sobre se esse preço é sustentável e competitivo.
    2. Uma lista de 3 dicas práticas para melhorar a lucratividade ou vender esse valor ao cliente.
    3. Um booleano indicando se o negócio parece sustentável com esses números.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            tips: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            isSustainable: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Erro na análise via Gemini:", error);
    return {
      analysis: "Não foi possível conectar à IA para análise no momento. Verifique sua chave de API.",
      tips: ["Revise seus custos fixos manualmente.", "Compare com a concorrência local.", "Garanta que o tempo de desenho seja cobrado."],
      isSustainable: true
    };
  }
};

export const generateSalesPitch = async (
  project: TattooProject,
  price: number,
  clientName: string | undefined
): Promise<string> => {
  const prompt = `
    Escreva uma proposta comercial persuasiva para um cliente de tatuagem (mensagem para WhatsApp).
    
    DADOS:
    - Cliente: ${clientName ? clientName : 'o cliente'}
    - Tatuagem: ${project.style}, ${project.bodyPart}
    - Tamanho: ${project.widthCm}cm x ${project.heightCm}cm
    - Valor do Orçamento: R$ ${price.toFixed(2)}
    - Diferenciais: Tatuagem exclusiva, materiais de alta qualidade, biossegurança.

    OBJETIVO:
    Crie um texto curto, amigável mas profissional, justificando o valor e criando desejo. Use gatilhos mentais de exclusividade e escassez de agenda.
    IMPORTANTE: Comece saudando o cliente pelo NOME (${clientName || 'Cliente'}).
    Não use hashtags. O tom deve ser "Artistico e Premium".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Erro ao gerar proposta.";
  } catch (error) {
    return "Não foi possível gerar a proposta no momento.";
  }
};
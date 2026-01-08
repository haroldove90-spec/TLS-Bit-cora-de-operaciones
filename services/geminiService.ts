
import { GoogleGenAI } from "@google/genai";

export const getTripInsights = async (origin: string, destination: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza la ruta de carga pesada: Origen: ${origin} -> Destino: ${destination}. Proporciona 3 consejos técnicos sobre seguridad vial, optimización de combustible y posibles puntos críticos de descanso.`,
      config: {
        systemInstruction: "Eres un analista de rutas logísticas de alto nivel con acceso a datos de telemetría y geografía en tiempo real.",
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "No se pudieron cargar recomendaciones automáticas.";
  }
};

export const validateAddressWithMaps = async (address: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Valida esta ubicación para maniobra de transporte pesado: ${address}. Confirma si la zona permite acceso a tractocamiones y si el código postal coincide con la colonia.`,
      config: {
        tools: [{ googleMaps: {} }],
        systemInstruction: "Eres un oficial de cumplimiento logístico. Tu tarea es garantizar que las direcciones de carga sean válidas y seguras. Responde usando Markdown.",
      },
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = groundingChunks
      .map((chunk: any) => chunk.maps?.uri)
      .filter(Boolean);
    
    return {
      text: response.text || "La validación no devolvió texto.",
      links: links
    };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return { text: "Error de conexión con Google Maps.", links: [] };
  }
};

export const getFleetStatusSummary = async (trips: any[], expenses: any[], alerts: any[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Data Thinning: Enviar solo lo necesario para el análisis
    const summarizedTrips = trips.map(t => ({ id: t.id, status: t.status, client: t.client }));
    const summarizedExpenses = expenses.map(e => ({ cat: e.category, amount: e.amount, date: e.date }));
    const summarizedAlerts = alerts.map(a => ({ msg: a.message, type: a.type }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Genera un reporte ejecutivo de la operación actual: 
      VIAJES ACTIVOS: ${JSON.stringify(summarizedTrips)}
      GASTOS RECIENTES: ${JSON.stringify(summarizedExpenses)}
      ALERTAS DE OPERADORES: ${JSON.stringify(summarizedAlerts)}`,
      config: {
        systemInstruction: "Analiza tendencias de gasto, eficiencia de rutas y niveles de riesgo en la flota. Sé directo y ejecutivo.",
        thinkingConfig: { thinkingBudget: 4000 },
        temperature: 0.2,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Análisis de inteligencia no disponible en este momento.";
  }
};

export const analyzeExpenses = async (expenses: any[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const summarizedExpenses = expenses.map(e => ({ amount: e.amount, cat: e.category, desc: e.description, perf: e.performance }));
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analiza los siguientes gastos logísticos y detecta anomalías o áreas de ahorro: ${JSON.stringify(summarizedExpenses)}`,
      config: {
        systemInstruction: "Eres un auditor financiero especializado en logística. Detecta sobrecostos en combustible o mantenimientos excesivos.",
        thinkingConfig: { thinkingBudget: 2000 },
        temperature: 0.3,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    return "No se pudo realizar la auditoría en este momento.";
  }
};

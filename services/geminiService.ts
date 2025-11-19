import { GoogleGenAI, Modality, Type, Part } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("La variable de entorno API_KEY no está definida. Las llamadas a la API fallarán.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || 'dummy-key' });

/**
 * Helper: Limpia bloques de código Markdown de la respuesta JSON.
 */
const cleanJSON = (text: string): string => {
  return text.replace(/```json\n?|```/g, '').trim();
};

/**
 * Genera un nombre de marca basado en una imagen de logo existente.
 */
export const generateNameFromLogo = async (imageBase64: string): Promise<string> => {
   try {
    const model = 'gemini-2.5-flash';
    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: imageBase64.split(',')[1],
      },
    };

    const response = await ai.models.generateContent({
      model,
      contents: {
          parts: [
              imagePart,
              { text: "Mira este logo. ¿Cuál es el nombre de la marca que aparece en él? Si no hay texto, inventa un nombre adecuado basado en el símbolo. Devuelve SOLO el nombre." }
          ]
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error al extraer nombre del logo:", error);
    return "Tu Marca";
  }
}


/**
 * Genera sugerencias de eslóganes (Slogans).
 */
export const generateSloganSuggestions = async (businessName: string, industry: string, description: string): Promise<string[]> => {
  try {
    const model = 'gemini-2.5-flash';
    // Validar inputs mínimos para evitar errores de prompt vacío
    const nameContext = businessName ? `el negocio "${businessName}"` : "un negocio";
    const industryContext = industry ? `de la industria "${industry}"` : "";
    
    const response = await ai.models.generateContent({
      model,
      contents: `Genera 5 eslóganes pegadizos, cortos y comerciales en español de México para ${nameContext} ${industryContext} ${description ? `(Contexto extra: ${description})` : ''}. Devuelve la respuesta como un array JSON de strings puro. Ejemplo: ["Slogan 1", "Slogan 2"...].`,
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
          }
      }
    });
    const jsonStr = cleanJSON(response.text);
    const json = JSON.parse(jsonStr);
    return json.slice(0, 5); // Asegurar 5
  } catch (error) {
    console.error("Error al generar eslóganes:", error);
    return [
        `La mejor opción para tu negocio`, 
        `Calidad y servicio garantizados`, 
        `Innovación y excelencia`, 
        `Tu solución ideal`, 
        `Vive la experiencia`
    ];
  }
};

export const generateSloganSuggestionsFromLogo = async (brandName: string, imageBase64: string): Promise<string[]> => {
    try {
        const model = 'gemini-2.5-flash';
        const imagePart = {
            inlineData: {
                mimeType: 'image/png',
                data: imageBase64.split(',')[1],
            },
        };
        
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    imagePart,
                    { text: `Basándote en el estilo visual de este logo y el nombre de marca "${brandName}", genera 5 eslóganes creativos y comerciales en español de México que combinen con la vibra de la imagen. Devuelve un array JSON de strings puro.` }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const jsonStr = cleanJSON(response.text);
        const json = JSON.parse(jsonStr);
        return json.slice(0, 5);
    } catch (error) {
        console.error("Error slogans from logo:", error);
        return [
            `${brandName}: Estilo único`, 
            `Innovación en ${brandName}`, 
            `Descubre ${brandName}`, 
            `Tu mundo en ${brandName}`, 
            `${brandName} es para ti`
        ];
    }
}

/**
 * Crea un logo desde cero con inputs específicos.
 */
export const createImageWithGemini = async (businessName: string, industry: string, description: string, style: string, slogan?: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image'; 
    
    // Construcción estricta del prompt basada en inputs del usuario
    const fullPrompt = `Diseño de logotipo profesional para el negocio llamado "${businessName}". 
    Industria/Giro: ${industry}. 
    Estilo Visual: ${style}. 
    ${description ? `Instrucciones visuales específicas: ${description}.` : ''}
    ${slogan ? `IMPORTANTE: El diseño debe incluir el eslogan "${slogan}" de forma legible debajo o junto al nombre de la marca.` : ''}
    
    Requisitos:
    1. El texto "${businessName}" debe ser el elemento central y legible.
    2. ${slogan ? `El eslogan "${slogan}" debe ser más pequeño pero legible.` : 'No incluir texto adicional aparte del nombre.'}
    3. Fondo blanco limpio y minimalista.
    4. Alta resolución, diseño vectorial, estético y profesional.
    5. El diseño debe ser 100% coherente con la industria mencionada.`;

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { text: fullPrompt }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("No se generó imagen de respuesta.");

  } catch (error) {
    console.error("Error al crear imagen:", error);
    throw new Error("No se pudo generar el logo. Intenta ajustar la descripción.");
  }
};

/**
 * Edita o genera variaciones de un logo existente.
 */
export const editImageWithGemini = async (imageBase64: string, instructions: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';
    
    const imagePart = {
        inlineData: {
            data: imageBase64.split(',')[1],
            mimeType: 'image/png'
        }
    };

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                imagePart,
                { text: `Sigue estas instrucciones para modificar/recrear este logo: ${instructions}. Mantén la esencia pero aplica los cambios. Alta calidad, fondo blanco.` }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("No se generó imagen de respuesta.");
  } catch (error) {
    console.error("Error al editar imagen:", error);
    throw new Error("No se pudo editar el logo.");
  }
};

/**
 * Genera un Kit de Marca inicial (Colores, Tipografía) analizando el logo o la descripción.
 */
export const getInitialBrandKit = async (businessName: string, industry: string, imageBase64?: string): Promise<{ colors: { hex: string }[], typography: { headingFont: string, bodyFont: string } }> => {
    try {
        const model = 'gemini-2.5-flash';
        let parts: Part[] = [];
        
        if (imageBase64) {
            parts.push({
                inlineData: {
                    data: imageBase64.split(',')[1],
                    mimeType: 'image/png'
                }
            });
            parts.push({ text: "Analiza este logo y extrae su paleta de colores principal y sugiere tipografías que combinen." });
        } else {
            parts.push({ text: `Para el negocio "${businessName}" de la industria "${industry}", sugiere una paleta de colores profesional y tipografía adecuada.` });
        }

        parts.push({ text: `Devuelve un objeto JSON con: 
        1. "colors": array de 5 objetos { "hex": "#RRGGBB", "name": "Nombre en Español" }.
        2. "typography": objeto con "headingFont" (nombre fuente popular) y "bodyFont" (nombre fuente popular).
        Responde SOLO con JSON limpio.` });

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { responseMimeType: "application/json" }
        });

        const cleanText = cleanJSON(response.text);
        const result = JSON.parse(cleanText);
        // Normalizar salida
        return {
            colors: result.colors.map((c: any) => ({ hex: c.hex, name: c.name })),
            typography: result.typography
        };
    } catch (error) {
        console.error("Error obteniendo brand kit:", error);
        // Fallback
        return {
            colors: [{ hex: '#1C1C1E' }, { hex: '#F59E0B' }, { hex: '#FFFFFF' }, { hex: '#E0E0E0' }, { hex: '#4A4A4C' }],
            typography: { headingFont: 'Inter', bodyFont: 'Roboto' }
        };
    }
};

/**
 * Genera un Mockup visual.
 */
export const generateMockup = async (logoBase64: string, type: 't-shirt' | 'business-card' | 'signage'): Promise<string> => {
    try {
         const model = 'gemini-2.5-flash-image';
         const prompts = {
             't-shirt': "Una fotografía realista de una playera (camiseta) de alta calidad doblada sobre una mesa de madera, con este logotipo impreso en el pecho. Iluminación cinemática.",
             'business-card': "Una fotografía macro profesional de tarjetas de presentación (visita) apiladas en un escritorio elegante, mostrando este logotipo claramente en el centro. Profundidad de campo.",
             'signage': "Una foto de un letrero moderno en la fachada de un edificio o tienda, mostrando este logotipo. Estilo urbano, luz natural."
         };

         const response = await ai.models.generateContent({
             model,
             contents: {
                 parts: [
                     { inlineData: { data: logoBase64.split(',')[1], mimeType: 'image/png' } },
                     { text: prompts[type] }
                 ]
             },
             config: { responseModalities: [Modality.IMAGE] }
         });

        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No se generó imagen.");
    } catch (error) {
        console.error("Error generando mockup:", error);
        throw error;
    }
};

/**
 * Genera contenido para redes sociales (Caption + Idea de imagen).
 */
export const generateSocialPost = async (brandName: string, logoBase64: string, topic: string): Promise<{ image: string, caption: string }> => {
    try {
        // 1. Generar el caption
        const textModel = 'gemini-2.5-flash';
        const textResp = await ai.models.generateContent({
            model: textModel,
            contents: `Escribe un post de Instagram atractivo y profesional para la marca "${brandName}". Tema: "${topic}".
            Incluye emojis relevantes. El tono debe ser inspirador y mexicano.
            Usa hashtags.
            Longitud máxima: 280 caracteres.`
        });
        const caption = textResp.text;

        // 2. Generar la imagen del post
        const imageModel = 'gemini-2.5-flash-image';
        const imgResp = await ai.models.generateContent({
            model: imageModel,
            contents: {
                parts: [
                    { inlineData: { data: logoBase64.split(',')[1], mimeType: 'image/png' } },
                    { text: `Crea una imagen cuadrada para redes sociales (Instagram) para la marca "${brandName}". Tema: "${topic}". La imagen debe ser estéticamente agradable, estilo lifestyle o fotografía de producto, e incorporar sutilmente el logo o sus colores.` }
                ]
            },
            config: { responseModalities: [Modality.IMAGE] }
        });
        
        let image = "";
        if (imgResp.candidates?.[0]?.content?.parts) {
            for (const part of imgResp.candidates[0].content.parts) {
                if (part.inlineData) {
                    image = `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }

        return { caption, image };

    } catch (error) {
        console.error("Error generando social post:", error);
        throw error;
    }
};

/**
 * Genera guías de marca textuales.
 */
export const generateBrandGuidelines = async (brandName: string, logoBase64: string): Promise<any> => {
    try {
        const model = 'gemini-2.5-flash';
        // Se asume que pasamos el logo para análisis visual
        const parts: Part[] = [
            { inlineData: { data: logoBase64.split(',')[1], mimeType: 'image/png' } },
            { text: `Actúa como un Director Creativo experto. Para la marca "${brandName}" (cuyo logo adjunto), genera un breve manual de identidad en formato JSON en Español de México.
            
            Campos requeridos:
            - logoPhilosophy: Explicación breve (40 palabras) del significado del logo.
            - clearSpaceRule: Regla de espacio libre (1 frase).
            - minimumSize: Tamaño mínimo recomendado (ej. 20px).
            - colorUsage: Array de 2 strings con reglas de uso de color (ej. "Usar fondo oscuro para...").
            - logoMisuse: Array de 3 cosas que NO hacer con el logo.
            - toneOfVoice: Array de 3 adjetivos que describan la voz de la marca.
            
            Responde SOLO JSON limpio.` }
        ];

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { responseMimeType: "application/json" }
        });

        const cleanText = cleanJSON(response.text);
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error generando guías:", error);
        throw error;
    }
};
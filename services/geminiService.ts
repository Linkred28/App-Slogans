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
    
    // ESTRATEGIA DE TEXTO PRIORITARIO:
    // Movemos el texto al INICIO del prompt para maximizar la atención del modelo.
    // Usamos instrucciones de "renderizado verbatim".
    
    const textInstruction = `TEXTO PRINCIPAL DEL LOGO: "${businessName}"
    ${slogan ? `TEXTO SECUNDARIO (SLOGAN): "${slogan}"` : ''}
    
    INSTRUCCIONES CRÍTICAS DE TEXTO:
    1. Escribe el texto EXACTAMENTE letra por letra. NO cambies la ortografía.
    2. PRESTA ATENCIÓN EXTREMA a la diferencia entre 'C', 'S' y 'Z'. (Ejemplo: "Casa" vs "Zaza").
    3. El texto debe ser perfectamente legible, nítido y sin errores tipográficos.
    4. Si el texto contiene tildes o eñes, inclúyelas correctamente.
    `;

    const visualInstruction = `
    TAREA: Crear un diseño de logotipo vectorizado profesional para la industria: ${industry}.
    ESTILO VISUAL: ${style}.
    ${description ? `DETALLES ESPECÍFICOS: ${description}.` : ''}
    
    COMPOSICIÓN:
    - Fondo blanco sólido o neutro limpio.
    - Diseño centrado y equilibrado.
    - Alta calidad, estilo premium.
    `;

    const fullPrompt = `${textInstruction}\n\n${visualInstruction}`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
       const part = candidates[0].content.parts.find(p => p.inlineData);
       if (part && part.inlineData) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
       }
    }
    throw new Error("No se pudo generar la imagen (sin datos).");
  } catch (error) {
    console.error("Error creating image:", error);
    throw error;
  }
};

/**
 * Edita un logo existente.
 */
export const editImageWithGemini = async (imageBase64: string, instructions: string): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash-image';
        const imagePart = {
            inlineData: {
                mimeType: 'image/png', // Asumimos png o detectamos
                data: imageBase64.split(',')[1],
            },
        };

        // Forzamos la preservación del texto en la edición también
        const strictInstructions = `
        PRIORIDAD MÁXIMA: PRESERVAR LA ORTOGRAFÍA DEL TEXTO.
        Si el logo original tiene texto, o si las instrucciones piden nuevo texto, asegúrate de que se escriba PERFECTAMENTE.
        No confundas letras (Z por C, S por C, T por C).
        
        INSTRUCCIONES DE EDICIÓN: ${instructions}
        `;

        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    imagePart,
                    { text: strictInstructions }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });
         const candidates = response.candidates;
        if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
           const part = candidates[0].content.parts.find(p => p.inlineData);
           if (part && part.inlineData) {
               return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
           }
        }
        throw new Error("No se pudo editar la imagen.");
    } catch (error) {
        console.error("Error editing image:", error);
        throw error;
    }
}

/**
 * Genera un Kit de Marca inicial (Colores, Tipografía) basado en la imagen.
 */
export const getInitialBrandKit = async (name: string, industry: string, logoImageBase64: string) => {
    try {
        const model = 'gemini-2.5-flash';
         const imagePart = {
            inlineData: {
                mimeType: 'image/png',
                data: logoImageBase64.split(',')[1],
            },
        };
        
        const prompt = `Actúa como un director de arte experto. Analiza este logo diseñado para "${name}" (${industry}).
        Extrae y define:
        1. Una paleta de colores de 4-5 colores hexadecimales que coincidan perfectamente con el logo.
        2. Sugiere 2 fuentes (Google Fonts) que combinen bien (una para Títulos, otra para Cuerpo).
        
        Responde EXCLUSIVAMENTE con este JSON schema:
        {
          "colors": [{"hex": "#...", "name": "Nombre Creativo"}],
          "typography": {"headingFont": "Nombre Fuente", "bodyFont": "Nombre Fuente"}
        }`;

        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [imagePart, { text: prompt }]
            },
             config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        colors: { 
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    hex: { type: Type.STRING },
                                    name: { type: Type.STRING }
                                }
                            }
                        },
                        typography: {
                            type: Type.OBJECT,
                            properties: {
                                headingFont: { type: Type.STRING },
                                bodyFont: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        });
        
        const jsonStr = cleanJSON(response.text);
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating brand kit:", error);
        // Fallback data
        return {
            colors: [{hex: '#333333'}, {hex: '#F59E0B'}, {hex: '#FFFFFF'}, {hex: '#cccccc'}],
            typography: { headingFont: 'Inter', bodyFont: 'Roboto' }
        };
    }
};

/**
 * Genera Mockups realistas.
 */
export const generateMockup = async (logoImageBase64: string, mockupType: 't-shirt' | 'business-card' | 'signage' | 'hoodie' | 'mug' | 'neon' | 'notebook' | 'smartphone' | 'pen' | 'thermos' | 'tote-bag'): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash-image';
        const imagePart = {
            inlineData: {
                mimeType: 'image/png',
                data: logoImageBase64.split(',')[1],
            },
        };
        
        let promptDetail = "";
        switch(mockupType) {
            case 't-shirt': promptDetail = "una camiseta blanca de alta calidad doblada sobre una superficie de madera, iluminación suave de estudio"; break;
            case 'hoodie': promptDetail = "una sudadera (hoodie) gris jaspeado o negra, estilo streetwear moderno, colgada o sobre superficie urbana limpia"; break;
            case 'business-card': promptDetail = "tarjetas de presentación elegantes sobre una mesa de mármol, profundidad de campo, render realista"; break;
            case 'signage': promptDetail = "un letrero corporativo moderno montado en la pared de un edificio de oficinas, vidrio y metal, 3d render"; break;
            case 'mug': promptDetail = "una taza de cerámica blanca clásica sobre un escritorio de trabajo con luz natural, estilo lifestyle"; break;
            case 'neon': promptDetail = "un letrero de NEÓN brillante y eléctrico montado sobre una pared de ladrillo oscuro o texturizada. El logo debe brillar intensamente con colores vibrantes, efecto nocturno, alta calidad cinematográfica"; break;
            case 'notebook': promptDetail = "una libreta o cuaderno de notas premium de tapa dura, cerrada, sobre un escritorio ordenado, estilo papelería corporativa"; break;
            case 'smartphone': promptDetail = "un smartphone moderno (iPhone o similar) mostrando el logo en la pantalla como fondo de pantalla, sostenido por una mano o sobre una mesa tecnológica"; break;
            case 'pen': promptDetail = "un bolígrafo corporativo elegante y minimalista de metal o acabado mate de alta calidad, descansando sobre una agenda o superficie de oficina limpia, primer plano detallado"; break;
            case 'thermos': promptDetail = "una botella térmica o termo de acero inoxidable moderno (water bottle) sobre una mesa de madera clara o en un entorno de gimnasio elegante, diseño minimalista"; break;
            case 'tote-bag': promptDetail = "una bolsa de tela (tote bag) de algodón natural o lona ecológica, colgada de un hombro o apoyada sobre una silla, con texturas de tela realistas"; break;
            default: promptDetail = "producto promocional profesional";
        }

        // MOCKUP PROTECTION STRATEGY:
        // Instruimos explícitamente que NO re-dibuje el texto, sino que lo trate como una imagen plana.
        const fullPrompt = `
        ESTRICTO: MANTÉN EL LOGO EXACTAMENTE COMO ES. NO CAMBIES EL TEXTO. NO CORRIJAS LA ORTOGRAFÍA (usa la original).
        Coloca este logo de manera realista en ${promptDetail}. 
        El logo debe adaptarse a la perspectiva, iluminación y textura del objeto. 
        Mantén la integridad visual y textual del logo original al 100%. Fotografía de producto profesional, 4k.`;

        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [imagePart, { text: fullPrompt }]
            },
             config: {
                responseModalities: [Modality.IMAGE],
            }
        });

         const candidates = response.candidates;
        if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
           const part = candidates[0].content.parts.find(p => p.inlineData);
           if (part && part.inlineData) {
               return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
           }
        }
        throw new Error("No se pudo generar el mockup.");
    } catch (error) {
        console.error("Error generating mockup:", error);
        throw error;
    }
};

/**
 * Genera Post para Redes Sociales.
 */
export const generateSocialPost = async (brandName: string, logoImageBase64: string, topic: string) => {
    try {
        // 1. Generar Imagen del Post
        const imageModel = 'gemini-2.5-flash-image';
        const imagePart = {
             inlineData: { mimeType: 'image/png', data: logoImageBase64.split(',')[1] }
        };
        
        const imagePrompt = `
        MANTÉN EL TEXTO DEL LOGO INTACTO.
        Crea una imagen cuadrada para Instagram estética y moderna para la marca "${brandName}". 
        Tema: ${topic}. 
        Estilo: Minimalista, profesional, usa los colores del logo sutilmente. 
        El logo debe aparecer integrado en el diseño de forma elegante (marca de agua o esquina, o elemento central).
        `;

        const imgResponse = await ai.models.generateContent({
            model: imageModel,
            contents: { parts: [imagePart, { text: imagePrompt }] },
            config: { responseModalities: [Modality.IMAGE] }
        });
        
        let postImage = null;
        const candidates = imgResponse.candidates;
        if (candidates && candidates[0]?.content?.parts) {
           const part = candidates[0].content.parts.find(p => p.inlineData);
           if (part && part.inlineData) {
               postImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
           }
        }

        // 2. Generar Copy (Texto)
        const textModel = 'gemini-2.5-flash';
        const textPrompt = `Escribe un caption corto y atractivo para Instagram para la marca "${brandName}" sobre el tema: "${topic}". Usa emojis. Tono profesional pero cercano. Máximo 30 palabras.`;
        
        const textResponse = await ai.models.generateContent({
            model: textModel,
            contents: textPrompt
        });
        
        return {
            image: postImage,
            caption: textResponse.text
        };

    } catch (error) {
        console.error("Error generating social post:", error);
        throw error;
    }
}

/**
 * Genera Guías de Marca (Texto).
 */
export const generateBrandGuidelines = async (brandName: string, logoImageBase64: string) => {
    try {
        const model = 'gemini-2.5-flash';
        const imagePart = {
             inlineData: { mimeType: 'image/png', data: logoImageBase64.split(',')[1] }
        };
        
        const prompt = `Analiza este logo de "${brandName}". Genera un breve manual de identidad en formato JSON.
        Incluye:
        1. "logoPhilosophy": Breve explicación (1 frase) del significado del logo.
        2. "clearSpaceRule": Regla de espacio seguro sugerida.
        3. "minimumSize": Tamaño mínimo sugerido (px).
        4. "logoMisuse": Lista de 3 cosas que NO hacer con el logo (ej. no estirar, no cambiar color).
        
        JSON Schema:
        {
            "logoPhilosophy": string,
            "clearSpaceRule": string,
            "minimumSize": string,
            "logoMisuse": string[]
        }`;

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: "application/json" }
        });
        
        const jsonStr = cleanJSON(response.text);
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Error generating guidelines:", error);
         return {
            logoPhilosophy: "Una representación visual moderna de la marca.",
            clearSpaceRule: "Mantener un margen del 20% del ancho del logo.",
            minimumSize: "32px de ancho",
            logoMisuse: ["No distorsionar proporciones", "No usar sobre fondos del mismo color", "No rotar"]
        };
    }
}
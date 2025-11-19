
import React, { useState, useCallback, ChangeEvent, useRef, useEffect } from 'react';
import { fileToBase64 } from './utils/fileUtils';
import { 
    editImageWithGemini, 
    createImageWithGemini, 
    getInitialBrandKit,
    generateMockup,
    generateSocialPost,
    generateBrandGuidelines,
    generateSloganSuggestions,
    generateNameFromLogo
} from './services/geminiService';

type Mode = 'create' | 'edit';
type Theme = 'light' | 'dark';
type BrandKit = {
  colors: { hex: string; name?: string }[];
  typography: { headingFont: string; bodyFont: string };
};
type Status = 'idle' | 'loading' | 'error' | 'success';

// --- ICONS ---
const UploadIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg> );
const SparklesIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg> );
const PhotoIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg> );
const SwatchIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a16.001 16.001 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg> );
const DocumentTextIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg> );
const ShareIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg> );
const SunIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 21v-2.25m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591-1.591M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" /></svg> );
const MoonIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg> );
const MegaphoneIcon: React.FC<{className?: string}> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.43.816 1.035.816 1.73 0 .695-.32 1.3-.816 1.73" /></svg>);
const TShirtIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 9 9 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> );
const CardIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-1.6-2.926 1.28-1.28a8.741 8.741 0 0 1-12.8 12.8l-1.28-1.28a8.741 8.741 0 0 1 12.8-12.8Z" /><rect x="3" y="6" width="18" height="12" rx="2" ry="2" strokeWidth={1.5} /></svg> );
const SignIcon: React.FC<{className?: string}> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z" /></svg> );


const STYLES = ["Minimalista", "Moderno", "Vintage", "Geométrico", "3D", "Abstracto", "Lujo", "Orgánico", "Tecnológico", "Retro"];
const EDIT_STYLES = ["Mantener Original", ...STYLES];

export default function App() {
  // --- STATE ---
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored as Theme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [mode, setMode] = useState<Mode>('create');
  
  // Inputs
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [logoDescription, setLogoDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Minimalista');
  // Slogan Inputs
  const [slogan, setSlogan] = useState('');
  const [generatedSlogans, setGeneratedSlogans] = useState<string[]>([]);
  const [sloganLoading, setSloganLoading] = useState(false);
  
  // Edit Mode Inputs
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); // Para cambiar el texto del logo
  const [editInstructions, setEditInstructions] = useState('');
  const [editStyle, setEditStyle] = useState('Mantener Original');

  // Output / Results
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // Feature States
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [mockups, setMockups] = useState<{[key: string]: string}>({});
  const [mockupStatus, setMockupStatus] = useState<Status>('idle');
  const [socialPost, setSocialPost] = useState<{image?: string, caption?: string} | null>(null);
  const [guidelines, setGuidelines] = useState<any>(null);
  // Removed slogans state
  const [loadingMessage, setLoadingMessage] = useState('');

  // --- EFFECTS ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // --- HANDLERS ---
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setUploadedImage(base64);
      // Auto-detect brand name if possible
      const detectedName = await generateNameFromLogo(base64);
      setBusinessName(detectedName);
    } catch (err) {
      console.error(err);
      setError("Error al cargar la imagen");
    }
  };

  const handleGenerateSlogansInput = async () => {
      if (!businessName || !industry) {
          alert("Por favor ingresa primero el nombre del negocio y la industria.");
          return;
      }
      setSloganLoading(true);
      try {
          const suggestions = await generateSloganSuggestions(businessName, industry, logoDescription);
          setGeneratedSlogans(suggestions);
      } catch (e) {
          console.error(e);
      } finally {
          setSloganLoading(false);
      }
  }

  const handleGenerate = async () => {
    setStatus('loading');
    setError(null);
    setGeneratedImage(null);
    setBrandKit(null);
    setMockups({});
    setSocialPost(null);
    setGuidelines(null);

    try {
      if (mode === 'create') {
        // VALIDACIÓN: El nombre y la industria son obligatorios para un buen resultado
        if (!businessName.trim()) {
             throw new Error("Por favor escribe el nombre de tu negocio.");
        }
        if (!industry.trim()) {
            throw new Error("Por favor indica la industria o giro.");
        }

        setLoadingMessage("Diseñando tu logotipo...");
        
        // 1. Create Image (Strict inputs + Slogan)
        const image = await createImageWithGemini(businessName, industry, logoDescription, selectedStyle, slogan);
        setGeneratedImage(image);

        // 2. Initial Brand Kit
        setLoadingMessage("Generando paleta de colores...");
        const kit = await getInitialBrandKit(businessName, industry, image);
        setBrandKit(kit);

      } else {
        // EDIT MODE
        if (!uploadedImage) {
            setError("Por favor sube una imagen primero.");
            setStatus('idle');
            return;
        }
        setLoadingMessage("Transformando tu logo...");
        
        let prompt = "";
        
        if (editName) {
            prompt += `Cambia el texto visible en el logo para que diga exactamente: "${editName}". `;
        }
        
        if (editStyle === 'Mantener Original') {
            prompt += `IMPORTANTE: Mantén EXACTAMENTE los mismos colores, tipografía y estilo gráfico del logo original. Solo modifica el texto si se indicó, o mejora la definición. No cambies la estética. `;
        } else {
            prompt += `Aplica un estilo visual ${editStyle}. `;
        }

        if (editInstructions) {
            prompt += `Instrucciones adicionales: ${editInstructions}.`;
        }

        const image = await editImageWithGemini(uploadedImage, prompt);
        setGeneratedImage(image);

        // Update Brand Kit based on new image
        const kit = await getInitialBrandKit("Logo editado", "General", image);
        setBrandKit(kit);
      }
      setStatus('success');
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado");
      setStatus('error');
    }
  };

  const handleCreateMockup = async (type: 't-shirt' | 'business-card' | 'signage') => {
      if (!generatedImage) return;
      setMockupStatus('loading');
      try {
          const res = await generateMockup(generatedImage, type);
          setMockups(prev => ({...prev, [type]: res}));
          setMockupStatus('success');
      } catch (e) {
          setMockupStatus('error');
      }
  };

  const handleSocialPost = async () => {
      if (!generatedImage) return;
      setStatus('loading'); 
      try {
          const res = await generateSocialPost(businessName || editName || "Tu Marca", generatedImage, "Lanzamiento de marca");
          setSocialPost(res);
          setStatus('success');
      } catch (e) {
          setStatus('error');
      }
  };

  const handleGuidelines = async () => {
      if (!generatedImage) return;
      setStatus('loading');
      try {
          const res = await generateBrandGuidelines(businessName || editName || "Tu Marca", generatedImage);
          setGuidelines(res);
          setStatus('success');
      } catch (e) {
          setStatus('error');
      }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* HEADER */}
      <header className="w-full px-6 py-4 flex justify-between items-center border-b border-warm-gray-200 dark:border-warm-gray-800 bg-white/50 dark:bg-warm-gray-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
            AI
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
            Generador de Logos IA
          </h1>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-warm-gray-200 dark:hover:bg-warm-gray-800 transition-colors"
          aria-label="Cambiar tema"
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        
        {/* TABS */}
        <div className="flex justify-center mb-8">
            <div className="bg-warm-gray-200 dark:bg-warm-gray-900 p-1 rounded-xl inline-flex shadow-inner">
                <button 
                    onClick={() => setMode('create')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'create' ? 'bg-white dark:bg-warm-gray-800 shadow-sm text-amber-600 dark:text-amber-400' : 'text-warm-gray-600 dark:text-warm-gray-400 hover:text-warm-gray-900 dark:hover:text-white'}`}
                >
                    Crear Nuevo Logo
                </button>
                <button 
                    onClick={() => setMode('edit')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'edit' ? 'bg-white dark:bg-warm-gray-800 shadow-sm text-amber-600 dark:text-amber-400' : 'text-warm-gray-600 dark:text-warm-gray-400 hover:text-warm-gray-900 dark:hover:text-white'}`}
                >
                    Editar Logo Existente
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* LEFT COLUMN: INPUTS */}
            <div className="space-y-8 animate-fadeInUp">
                <div className="bg-white dark:bg-warm-gray-900 p-6 rounded-2xl shadow-xl shadow-warm-gray-200/50 dark:shadow-none border border-warm-gray-100 dark:border-warm-gray-800">
                    
                    <h2 className="text-2xl font-bold mb-6 text-warm-gray-900 dark:text-white flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-amber-500" />
                        {mode === 'create' ? 'Datos del Negocio' : 'Transforma tu Logo'}
                    </h2>

                    {mode === 'create' ? (
                        <div className="space-y-6">
                            {/* CONTENEDOR 1: NOMBRE DEL NEGOCIO */}
                            <div>
                                <label className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-300 mb-1">
                                    1. Nombre del Negocio <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="Ej. Tacos El Compadre, TechSolutions..."
                                    className="w-full px-4 py-3 rounded-xl bg-warm-gray-50 dark:bg-warm-gray-950 border border-warm-gray-200 dark:border-warm-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {/* CONTENEDOR 2: INDUSTRIA */}
                            <div>
                                <label className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-300 mb-1">
                                    2. Industria / Giro <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    placeholder="Ej. Comida Rápida, Bienes Raíces, Tecnología..."
                                    className="w-full px-4 py-3 rounded-xl bg-warm-gray-50 dark:bg-warm-gray-950 border border-warm-gray-200 dark:border-warm-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {/* CONTENEDOR 3: ESLOGAN (GENERADOR) */}
                            <div className="bg-warm-gray-50 dark:bg-warm-gray-800/50 p-4 rounded-xl border border-warm-gray-100 dark:border-warm-gray-700">
                                <label className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-300 mb-2">
                                    3. Eslogan / Frase <span className="text-amber-500 text-xs font-normal ml-1">(Opcional - Se integrará al logo)</span>
                                </label>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="text"
                                        value={slogan}
                                        onChange={(e) => setSlogan(e.target.value)}
                                        placeholder="Escribe o genera uno..."
                                        className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-warm-gray-900 border border-warm-gray-200 dark:border-warm-gray-700 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                    />
                                    <button 
                                        onClick={handleGenerateSlogansInput}
                                        disabled={sloganLoading}
                                        className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1 border border-amber-200 dark:border-amber-800"
                                    >
                                        {sloganLoading ? <span className="animate-spin">↻</span> : <MegaphoneIcon className="w-4 h-4" />}
                                        Generar Ideas
                                    </button>
                                </div>
                                {generatedSlogans.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {generatedSlogans.map((s, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setSlogan(s)}
                                                className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-warm-gray-800 border border-warm-gray-200 dark:border-warm-gray-700 text-warm-gray-600 dark:text-warm-gray-300 hover:border-amber-500 hover:text-amber-600 transition-all text-left"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CONTENEDOR 4: DESCRIPCIÓN OPCIONAL */}
                            <div>
                                <label className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-300 mb-1">
                                    4. Descripción del Logo (Opcional)
                                </label>
                                <textarea 
                                    value={logoDescription}
                                    onChange={(e) => setLogoDescription(e.target.value)}
                                    placeholder="¿Tienes alguna idea específica? Ej. Quiero que aparezca un sol naciente, usa colores cálidos..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-warm-gray-50 dark:bg-warm-gray-950 border border-warm-gray-200 dark:border-warm-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                            </div>

                            {/* CONTENEDOR 5: ESTILO VISUAL */}
                            <div>
                                <label className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-300 mb-3">5. Estilo Visual</label>
                                <div className="flex flex-wrap gap-2">
                                    {STYLES.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedStyle(s)}
                                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all border ${selectedStyle === s ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400' : 'bg-transparent border-warm-gray-200 dark:border-warm-gray-700 text-warm-gray-600 dark:text-warm-gray-400 hover:border-amber-500/50'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* EDIT MODE INPUTS */
                        <div className="space-y-5">
                             <div className="border-2 border-dashed border-warm-gray-300 dark:border-warm-gray-700 rounded-xl p-8 text-center hover:bg-warm-gray-50 dark:hover:bg-warm-gray-800/50 transition-colors cursor-pointer relative group">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {uploadedImage ? (
                                    <div className="relative w-full aspect-video flex items-center justify-center overflow-hidden rounded-lg bg-checkerboard-light dark:bg-checkerboard-dark">
                                        <img src={uploadedImage} alt="Uploaded" className="max-h-full max-w-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white font-medium">Cambiar imagen</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <UploadIcon className="w-10 h-10 text-warm-gray-400 mb-3" />
                                        <p className="text-sm text-warm-gray-600 dark:text-warm-gray-300 font-medium">Sube tu logo actual</p>
                                        <p className="text-xs text-warm-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                                    </div>
                                )}
                            </div>

                            {uploadedImage && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-300 mb-1">
                                            Nuevo Texto / Nombre <span className="text-xs text-amber-600 ml-1">(Opcional)</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder='Ej. Cambiar nombre a "M"'
                                            className="w-full px-4 py-3 rounded-xl bg-warm-gray-50 dark:bg-warm-gray-950 border border-warm-gray-200 dark:border-warm-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                                        />
                                        <p className="text-xs text-warm-gray-500 mt-1">Deja en blanco para mantener el texto original.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-300 mb-3">Estilo Recomendado</label>
                                        <div className="flex flex-wrap gap-2">
                                            {EDIT_STYLES.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setEditStyle(s)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${editStyle === s ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400' : 'bg-transparent border-warm-gray-200 dark:border-warm-gray-700 text-warm-gray-600 dark:text-warm-gray-400 hover:border-amber-500/50'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-300 mb-1">Instrucciones Adicionales</label>
                                        <textarea 
                                            value={editInstructions}
                                            onChange={(e) => setEditInstructions(e.target.value)}
                                            placeholder="Ej. Hazlo más minimalista, cambia el azul por rojo..."
                                            rows={2}
                                            className="w-full px-4 py-3 rounded-xl bg-warm-gray-50 dark:bg-warm-gray-950 border border-warm-gray-200 dark:border-warm-gray-800 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="mt-8">
                        <button 
                            onClick={handleGenerate}
                            disabled={status === 'loading' || (mode === 'edit' && !uploadedImage)}
                            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-amber-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2
                            ${status === 'loading' ? 'bg-warm-gray-400 cursor-wait' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'}`}
                        >
                            {status === 'loading' ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Diseñando...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    Generar Logo
                                </>
                            )}
                        </button>
                        {status === 'loading' && <p className="text-center text-xs text-warm-gray-500 mt-3 animate-pulse">{loadingMessage}</p>}
                        {error && <p className="text-center text-sm text-red-500 mt-3">{error}</p>}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: RESULTS */}
            <div className="space-y-8">
                {status === 'idle' && !generatedImage && (
                     <div className="h-full min-h-[400px] border-2 border-dashed border-warm-gray-200 dark:border-warm-gray-800 rounded-2xl flex flex-col items-center justify-center text-warm-gray-400 p-12 text-center">
                        <div className="w-20 h-20 bg-warm-gray-100 dark:bg-warm-gray-900 rounded-full flex items-center justify-center mb-4">
                            <SparklesIcon className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-lg font-semibold text-warm-gray-500 dark:text-warm-gray-400">Tu logo aparecerá aquí</h3>
                        <p className="text-sm max-w-xs mt-2">Completa los campos del negocio a la izquierda.</p>
                     </div>
                )}

                {generatedImage && (
                    <div className="animate-fadeInUp space-y-8">
                        
                        {/* MAIN LOGO CARD */}
                        <div className="bg-white dark:bg-warm-gray-900 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden border border-warm-gray-100 dark:border-warm-gray-800">
                             <div className="aspect-square w-full relative bg-checkerboard-light dark:bg-checkerboard-dark flex items-center justify-center p-8 ai-reveal">
                                <img src={generatedImage} alt="Generated Logo" className="max-w-full max-h-full object-contain drop-shadow-xl" />
                                <a 
                                    href={generatedImage} 
                                    download={`${businessName || 'logo'}-ai.png`}
                                    className="absolute bottom-4 right-4 p-3 bg-white dark:bg-warm-gray-800 text-warm-gray-900 dark:text-white rounded-full shadow-lg hover:bg-warm-gray-50 dark:hover:bg-warm-gray-700 transition-all"
                                    title="Descargar"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </a>
                             </div>
                             <div className="p-6 border-t border-warm-gray-100 dark:border-warm-gray-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-warm-gray-900 dark:text-white">{businessName || editName || "Tu Negocio"}</h3>
                                        <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">{industry}</p>
                                    </div>
                                </div>

                                {/* ACTIONS GRID */}
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-6">
                                    <button onClick={() => handleCreateMockup('t-shirt')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-warm-gray-50 dark:bg-warm-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group">
                                        <TShirtIcon className="w-6 h-6 text-warm-gray-600 dark:text-warm-gray-400 group-hover:text-amber-500 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wide text-warm-gray-500 group-hover:text-amber-600">Camiseta</span>
                                    </button>
                                    <button onClick={() => handleCreateMockup('business-card')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-warm-gray-50 dark:bg-warm-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group">
                                        <CardIcon className="w-6 h-6 text-warm-gray-600 dark:text-warm-gray-400 group-hover:text-amber-500 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wide text-warm-gray-500 group-hover:text-amber-600">Tarjeta</span>
                                    </button>
                                    <button onClick={() => handleCreateMockup('signage')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-warm-gray-50 dark:bg-warm-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group">
                                        <SignIcon className="w-6 h-6 text-warm-gray-600 dark:text-warm-gray-400 group-hover:text-amber-500 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wide text-warm-gray-500 group-hover:text-amber-600">Letrero</span>
                                    </button>
                                    <button onClick={handleSocialPost} className="flex flex-col items-center justify-center p-3 rounded-lg bg-warm-gray-50 dark:bg-warm-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group">
                                        <ShareIcon className="w-6 h-6 text-warm-gray-600 dark:text-warm-gray-400 group-hover:text-amber-500 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wide text-warm-gray-500 group-hover:text-amber-600">Social</span>
                                    </button>
                                    <button onClick={handleGuidelines} className="flex flex-col items-center justify-center p-3 rounded-lg bg-warm-gray-50 dark:bg-warm-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group">
                                        <DocumentTextIcon className="w-6 h-6 text-warm-gray-600 dark:text-warm-gray-400 group-hover:text-amber-500 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wide text-warm-gray-500 group-hover:text-amber-600">Guía</span>
                                    </button>
                                </div>
                             </div>
                        </div>

                        {/* BRAND KIT SECTION */}
                        {brandKit && (
                            <div className="bg-white dark:bg-warm-gray-900 p-6 rounded-2xl shadow-xl border border-warm-gray-100 dark:border-warm-gray-800">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-warm-gray-400 mb-4 flex items-center gap-2">
                                    <SwatchIcon className="w-4 h-4" /> Paleta Sugerida
                                </h4>
                                
                                <div className="space-y-6">
                                    {/* Colors */}
                                    <div className="flex rounded-xl overflow-hidden shadow-sm h-16">
                                        {brandKit.colors.map((color, idx) => (
                                            <div key={idx} className="flex-1 group relative flex items-end justify-center pb-2" style={{ backgroundColor: color.hex }}>
                                                <span className="bg-black/50 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{color.hex}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Typography */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-warm-gray-50 dark:bg-warm-gray-800 rounded-xl">
                                            <p className="text-xs text-warm-gray-500 mb-1">Encabezados</p>
                                            <p className="text-lg font-bold text-warm-gray-900 dark:text-white" style={{ fontFamily: brandKit.typography.headingFont + ', sans-serif' }}>
                                                {brandKit.typography.headingFont}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-warm-gray-50 dark:bg-warm-gray-800 rounded-xl">
                                            <p className="text-xs text-warm-gray-500 mb-1">Cuerpo</p>
                                            <p className="text-lg text-warm-gray-900 dark:text-white" style={{ fontFamily: brandKit.typography.bodyFont + ', sans-serif' }}>
                                                {brandKit.typography.bodyFont}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MOCKUPS SECTION */}
                        {Object.keys(mockups).length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(mockups).map(([key, url]) => (
                                    <div key={key} className="relative rounded-xl overflow-hidden shadow-lg group">
                                        <img src={url} alt={key} className="w-full h-48 object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                            <p className="text-white text-sm font-medium capitalize">{key}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* SOCIAL POST PREVIEW */}
                        {socialPost && (
                            <div className="bg-white dark:bg-warm-gray-900 rounded-xl shadow-lg overflow-hidden border border-warm-gray-100 dark:border-warm-gray-800">
                                <div className="p-3 flex items-center gap-3 border-b border-warm-gray-100 dark:border-warm-gray-800">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 p-[2px]">
                                        <div className="w-full h-full rounded-full bg-white dark:bg-warm-gray-900 flex items-center justify-center overflow-hidden">
                                            <img src={generatedImage} className="w-full h-full object-cover" alt="Avatar" />
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-warm-gray-900 dark:text-white">{businessName || editName || "tu_negocio"}</p>
                                </div>
                                {socialPost.image ? (
                                    <img src={socialPost.image} alt="Social Post" className="w-full aspect-square object-cover" />
                                ) : (
                                    <div className="w-full aspect-square bg-warm-gray-100 flex items-center justify-center text-warm-gray-400">Cargando imagen...</div>
                                )}
                                <div className="p-4">
                                    <p className="text-sm text-warm-gray-800 dark:text-warm-gray-200">
                                        <span className="font-bold mr-2">{businessName || editName || "tu_negocio"}</span>
                                        {socialPost.caption}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* GUIDELINES SECTION */}
                        {guidelines && (
                            <div className="bg-white dark:bg-warm-gray-900 p-6 rounded-2xl shadow-xl border border-warm-gray-100 dark:border-warm-gray-800 animate-fadeInUp">
                                <h3 className="font-bold text-lg mb-4 text-warm-gray-900 dark:text-white">Manual de Identidad</h3>
                                <div className="space-y-4 text-sm text-warm-gray-600 dark:text-warm-gray-300">
                                    <div>
                                        <h5 className="font-bold text-amber-600">Filosofía</h5>
                                        <p>{guidelines.logoPhilosophy}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-warm-gray-50 dark:bg-warm-gray-800 p-3 rounded-lg">
                                            <h5 className="font-bold text-warm-gray-900 dark:text-white mb-1">Espacio Seguro</h5>
                                            <p className="text-xs">{guidelines.clearSpaceRule}</p>
                                        </div>
                                        <div className="bg-warm-gray-50 dark:bg-warm-gray-800 p-3 rounded-lg">
                                            <h5 className="font-bold text-warm-gray-900 dark:text-white mb-1">Tamaño Mínimo</h5>
                                            <p className="text-xs">{guidelines.minimumSize}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-warm-gray-900 dark:text-white mb-1">Lo que NO hacer</h5>
                                        <ul className="list-disc pl-4 space-y-1 text-xs">
                                            {guidelines.logoMisuse?.map((rule: string, i: number) => (
                                                <li key={i} className="text-red-500/80">{rule}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* EXTRA SPACE */}
                        <div className="h-12"></div>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

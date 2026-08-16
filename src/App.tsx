// @ts-nocheck
import { useState, useEffect, useRef } from "react";

/* ---------- HELPERS ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const emptyExperience = () => ({ id: uid(), company: "", role: "", start: "", end: "", current: false, bullets: [""] });
const emptyEducation = () => ({ id: uid(), institution: "", degree: "", start: "", end: "" });
const emptyLanguage = () => ({ id: uid(), name: "", level: "" });
const emptySkill = () => ({ id: uid(), name: "", level: 4 });
const emptyTool = () => ({ id: uid(), name: "" });
const emptyCV = () => ({
  personal: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", photo: "" },
  summary: "",
  experience: [emptyExperience()],
  education: [emptyEducation()],
  skills: [emptySkill()],
  languages: [emptyLanguage()],
  tools: [emptyTool()],
});

function normalizeSkills(skills) {
  if (!skills || !skills.length) return [emptySkill()];
  return skills.map((s) => typeof s === "string" ? { id: uid(), name: s, level: 4 } : { id: s.id || uid(), name: s.name || "", level: s.level || 4 });
}

function normalizeTools(tools) {
  if (!tools || !tools.length) return [emptyTool()];
  return tools.map((t) => typeof t === "string" ? { id: uid(), name: t } : { id: t.id || uid(), name: t.name || "" });
}

const STORAGE_KEY = "cv-builder-state";

/* ---------- ÍCONOS VECTORIALES ---------- */
const IconPin = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
const IconPhone = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
const IconMail = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const IconLink = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>);
const IconSparkles = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M12 3v18M3 12h18M15.5 8.5l4-4M8.5 15.5l-4 4M8.5 8.5l-4-4M15.5 15.5l4 4"/></svg>);
const IconEye = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconEyeOff = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>);
const IconArrowUp = ({ color = "currentColor", size = 12 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>);
const IconArrowDown = ({ color = "currentColor", size = 12 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>);
const IconPalette = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><circle cx="13.5" cy="6.5" r=".5" fill={color}/><circle cx="17.5" cy="10.5" r=".5" fill={color}/><circle cx="8.5" cy="7.5" r=".5" fill={color}/><circle cx="6.5" cy="12.5" r=".5" fill={color}/><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.21-.64-1.67-.38-.43-.6-.98-.6-1.58 0-1.38 1.12-2.5 2.5-2.5H18c2.21 0 4-1.79 4-4 0-4.97-4.48-9-10-9z"/></svg>);
const IconHeart = ({ color = "#C47165", size = 15 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginLeft: 6 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);

/* ---------- PALETAS NÓRDICAS ---------- */
const PRESET_PALETTES = [
  { id: "terracota", name: "Terracota", primary: "#9C4235", secondary: "#C47165", accent: "#F5E9E8", textDark: "#2B2625", surface: "#FCFAF9" },
  { id: "oliva", name: "Verde Oliva", primary: "#566345", secondary: "#82916F", accent: "#EAECE6", textDark: "#262923", surface: "#F9FAF8" },
  { id: "arena", name: "Arena Cálida", primary: "#8C7B65", secondary: "#B8A995", accent: "#F2EEE9", textDark: "#2E2A27", surface: "#FDFCFB" },
  { id: "pizarra", name: "Gris Pizarra", primary: "#4A5056", secondary: "#7C838A", accent: "#E8E9EA", textDark: "#222426", surface: "#F8F9FA" },
];

function generateCustomPalette(hex) {
  return { id: "custom", name: "Personalizado", primary: hex, secondary: `${hex}B3`, accent: `${hex}1A`, textDark: "#2B2B2B", surface: `${hex}08` };
}

/* ---------- PLANTILLAS ---------- */
const TEMPLATES = [
  { id: "nordico", name: "Nórdico Minimalista", blurb: "Líneas finas, amplio espacio en blanco, sumamente elegante." },
  { id: "bloque", name: "Bloque Sutil", blurb: "Columna lateral con fondo color tierra pastel. Muy limpio." },
  { id: "ats", name: "ATS Estricto", blurb: "Blanco y negro tradicional. Optimizado para sistemas de selección ATS." },
];

const FONTS = [
  { id: "nunito", name: "Moderna", family: "'Nunito', sans-serif" },
  { id: "inter", name: "Técnica", family: "'Inter', sans-serif" },
  { id: "merriweather", name: "Clásica", family: "'Merriweather', serif" },
];

const ATS_VERBS = ["Lideré", "Optimicé", "Implementé", "Reduje", "Coordiné", "Aumenté", "Diseñé", "Negocié", "Gestioné", "Desarrollé"];
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Nunito:wght@300;400;600;700&display=swap');";

/* ---------- MOTOR DE ANÁLISIS DE RESPALDO ---------- */
function generateFallbackAnalysis(cv) {
  const name = cv.personal.name ? cv.personal.name.split(" ")[0] : "Profesional";
  const hasMetrics = cv.experience.some(e => e.bullets.some(b => /\d+|%|\$/.test(b)));
  
  let fortalezas = `Estructura clara y legible. `;
  if (cv.summary.length > 50) fortalezas += `El resumen sintetiza bien tu perfil.`;
  else fortalezas += `Información completa en tus secciones principales.`;

  let mejoras = `• **Cuantificá tus logros:** `;
  if (!hasMetrics) mejoras += `Agregá porcentajes o métricas en la experiencia laboral (ej. "Aumenté la eficiencia un 15%").\n\n`;
  else mejoras += `Asegurate de incluir al menos 1 resultado medible por puesto.\n\n`;

  if (cv.summary.length < 40) {
    mejoras += `• **Ampliá tu Perfil:** Redactá 2 o 3 oraciones que resuman tus competencias e industria.`;
  } else {
    mejoras += `• **Verbos directos:** Utilizá verbos de acción al inicio de cada logro (Lideré, Coordiné, Implementé).`;
  }

  return `### Puntos Fuertes\nHola ${name}, tu currículum cuenta con un diseño muy limpio y ordenado.\n\n### Oportunidades de Mejora\n${mejoras}\n\n### Recomendación Clave\nAdaptá los títulos de tus experiencias anteriores a la nomenclatura exacta de los puestos que buscás actualmente.`;
}

function generateFallbackBullet(text) {
  const verbs = ["Lideré", "Optimicé", "Coordiné", "Implementé", "Desarrollé"];
  const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
  const clean = text.trim().replace(/^(yo|mi|me|se|encargado de|responsable de)\s+/i, "");
  return `${randomVerb} ${clean.charAt(0).toLowerCase() + clean.slice(1)} alcanzando un alto estándar de eficiencia.`;
}

/* ---------- API IA ---------- */
async function callClaude(prompt) {
  const API_KEY = import.meta.env?.VITE_ANTHROPIC_API_KEY || ""; 
  if (!API_KEY) throw new Error("NO_KEY");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-3-5-sonnet-20240620", max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Error API");
  return (data.content || []).map(b => b.text).join("\n").replace(/```json|```/g, "").trim();
}

/* ---------- APP PRINCIPAL ---------- */
export default function App() {
  const [cv, setCv] = useState(emptyCV());
  const [templateId, setTemplateId] = useState("nordico");
  const [palette, setPalette] = useState(PRESET_PALETTES[0]); 
  const [selectedFont, setSelectedFont] = useState("nunito");
  const [visible, setVisible] = useState({ photo: true, summary: true, experience: true, education: true, skills: true, languages: true, tools: true });
  const [downloading, setDownloading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(""); 
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  const saveTimer = useRef(null);
  const printRef = useRef(null);

  useEffect(() => { document.title = "Impulso CV Premium"; }, []);

  useEffect(() => {
    try {
      const res = localStorage.getItem(STORAGE_KEY);
      if (res) {
        const parsed = JSON.parse(res);
        if (parsed.cv) setCv({ ...emptyCV(), ...parsed.cv, personal: { ...emptyCV().personal, ...parsed.cv.personal }, skills: normalizeSkills(parsed.cv.skills), tools: normalizeTools(parsed.cv.tools) });
        if (parsed.templateId) setTemplateId(parsed.templateId);
        if (parsed.palette) setPalette(parsed.palette);
        if (parsed.selectedFont) setSelectedFont(parsed.selectedFont);
        if (parsed.visible) setVisible(parsed.visible);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ cv, templateId, palette, selectedFont, visible })); } catch (e) {} }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [cv, templateId, palette, selectedFont, visible, loaded]);

  const updatePersonal = (field, value) => setCv((c) => ({ ...c, personal: { ...c.personal, [field]: value } }));
  const moveExperience = (index, direction) => { const newExp = [...cv.experience]; const targetIdx = direction === "up" ? index - 1 : index + 1; if (targetIdx < 0 || targetIdx >= newExp.length) return; [newExp[index], newExp[targetIdx]] = [newExp[targetIdx], newExp[index]]; setCv((c) => ({ ...c, experience: newExp })); };
  const moveEducation = (index, direction) => { const newEd = [...cv.education]; const targetIdx = direction === "up" ? index - 1 : index + 1; if (targetIdx < 0 || targetIdx >= newEd.length) return; [newEd[index], newEd[targetIdx]] = [newEd[targetIdx], newEd[index]]; setCv((c) => ({ ...c, education: newEd })); };
  const updateExperience = (id, field, value) => setCv((c) => ({ ...c, experience: c.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)) }));
  const updateBullet = (expId, idx, value) => setCv((c) => ({ ...c, experience: c.experience.map((e) => e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => (i === idx ? value : b)) } : e ) }));
  const addBullet = (expId) => setCv((c) => ({ ...c, experience: c.experience.map((e) => (e.id === expId ? { ...e, bullets: [...e.bullets, ""] } : e)) }));
  const removeBullet = (expId, idx) => setCv((c) => ({ ...c, experience: c.experience.map((e) => e.id === expId ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) } : e ) }));
  const addExperience = () => setCv((c) => ({ ...c, experience: [...c.experience, emptyExperience()] }));
  const removeExperience = (id) => setCv((c) => ({ ...c, experience: c.experience.filter((e) => e.id !== id) }));
  const updateEducation = (id, field, value) => setCv((c) => ({ ...c, education: c.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)) }));
  const addEducation = () => setCv((c) => ({ ...c, education: [...c.education, emptyEducation()] }));
  
  const updateSkillName = (id, value) => setCv((c) => ({ ...c, skills: c.skills.map((s) => (s.id === id ? { ...s, name: value } : s)) }));
  const addSkill = () => setCv((c) => ({ ...c, skills: [...c.skills, emptySkill()] }));
  const removeSkill = (id) => setCv((c) => ({ ...c, skills: c.skills.filter((s) => s.id !== id) }));

  const updateToolName = (id, value) => setCv((c) => ({ ...c, tools: c.tools.map((t) => (t.id === id ? { ...t, name: value } : t)) }));
  const addTool = () => setCv((c) => ({ ...c, tools: [...c.tools, emptyTool()] }));
  const removeTool = (id) => setCv((c) => ({ ...c, tools: c.tools.filter((t) => t.id !== id) }));

  const updateLanguage = (id, field, value) => setCv((c) => ({ ...c, languages: c.languages.map((l) => (l.id === id ? { ...l, [field]: value } : l)) }));
  const addLanguage = () => setCv((c) => ({ ...c, languages: [...c.languages, emptyLanguage()] }));

  const analyzeEntireCV = async () => {
    setIsAiModalOpen(true);
    setAiFeedback("ANALYZING");
    try {
      const cvText = `Nombre: ${cv.personal.name}\nPerfil: ${cv.summary}\nExperiencia: ${cv.experience.map(e => `${e.role} en ${e.company}. Logros: ${e.bullets.join('; ')}`).join(' | ')}\nEducación: ${cv.education.map(ed => ed.degree).join(', ')}\nHabilidades: ${cv.skills.map(s=>s.name).join(', ')}\nHerramientas: ${cv.tools.map(t=>t.name).join(', ')}`;
      const prompt = `Actuá como un Reclutador experto. Analizá este CV y devolvé tu feedback EXACTAMENTE con esta estructura (usá formato markdown):\n\n### Puntos Fuertes\n(1 aspecto positivo)\n\n### Oportunidades de Mejora\n(2 consejos prácticos sobre redacción o estructura)\n\n### Recomendación Clave\n(Un consejo profesional breve).\n\nSé directo. CV: ${cvText}`;
      const analysis = await callClaude(prompt);
      setAiFeedback(analysis);
    } catch (e) {
      setTimeout(() => {
        setAiFeedback(generateFallbackAnalysis(cv));
      }, 600);
    }
  };

  const improveBulletAI = async (expId, idx, text) => {
    if (!text.trim()) return;
    setLoadingAI(`${expId}-${idx}`);
    try {
      const prompt = `Reescribí esta frase para un CV profesional usando lenguaje de impacto y apto para filtros ATS. Devolvé ÚNICAMENTE la frase mejorada, sin explicaciones. Frase: "${text}"`;
      const improved = await callClaude(prompt);
      updateBullet(expId, idx, improved);
    } catch (e) {
      updateBullet(expId, idx, generateFallbackBullet(text));
    }
    setLoadingAI(null);
  };

  const handlePhotoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updatePersonal("photo", reader.result);
    reader.readAsDataURL(file);
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: 0,
      filename: (cv.personal.name ? cv.personal.name.trim().replace(/\s+/g, "_") : "Mi_CV") + ".pdf",
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save().then(() => setDownloading(false)).catch(() => setDownloading(false));
    } else {
      window.print();
      setDownloading(false);
    }
  };

  const currentFontFamily = FONTS.find(f => f.id === selectedFont)?.family || "'Nunito', sans-serif";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F4F5F4", minHeight: "100vh", position: "relative" }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        .cvb-btn { cursor:pointer; border:none; border-radius:6px; font-weight:600; transition:all .2s; display:inline-flex; align-items:center; justify-content:center; }
        .cvb-btn:hover { opacity:.85; transform: translateY(-1px); }
        .cvb-input { width:100%; border:1px solid #E2E4E2; border-radius:6px; padding:10px 12px; font-size:14px; font-family:'Inter',sans-serif; background: #FCFCFC; color: #333; }
        .cvb-input:focus { outline:2px solid ${palette.primary}; outline-offset:1px; background: #fff; }
        .cvb-label { font-size:11px; font-weight:700; color:#6B726B; text-transform:uppercase; letter-spacing:.05em; display:block; margin-bottom:6px; }
        .print-area { width: 794px; min-height: 1123px; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin: 0 auto; }
        
        .page-block { break-inside: avoid !important; page-break-inside: avoid !important; }
        .page-header-avoid { break-after: avoid !important; page-break-after: avoid !important; }

        .color-swatch { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .color-swatch:hover { transform: scale(1.1); }
        .eye-btn { background: none; border: none; cursor: pointer; opacity: 0.5; padding: 0; display:flex; }
        .eye-btn:hover { opacity: 1; }
        .arrow-btn { background: #EAECE8; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; display:flex; align-items:center; }
        .arrow-btn:hover { background: #D5D7D3; }
        
        .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: #fff; padding: 32px; border-radius: 16px; width: 90%; maxWidth: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .ai-text h3 { color: ${palette.primary}; font-size: 15px; margin: 16px 0 8px; border-bottom: 1px solid ${palette.accent}; padding-bottom: 4px; }
        .ai-text p { font-size: 14px; line-height: 1.6; color: #444; margin: 0 0 12px; }
      `}</style>

      {/* HEADER DE LA APP */}
      <div style={{ padding: "22px 32px", background: "#E8E2D5", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #D8D0C0" }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 800, margin: 0, color: "#2B2B2B", letterSpacing: "-0.5px", display: "flex", alignItems: "center" }}>
            Impulso CV <span style={{ color: palette.primary, background: "#FFF", padding: "3px 10px", borderRadius: 12, fontSize: 11, verticalAlign: "middle", marginLeft: 10, border: `1px solid ${palette.secondary}40`, fontWeight: 700 }}>PREMIUM</span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="cvb-btn" onClick={analyzeEntireCV} style={{ padding: "10px 18px", fontSize: 13, background: "#FFF", border: "1px solid #CFC7B8", color: "#333", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <IconSparkles color={palette.primary} /> Revisar con IA
          </button>
          <button className="cvb-btn" onClick={handleDownloadPdf} disabled={downloading} style={{ padding: "10px 24px", fontSize: 13, background: palette.primary, color: "#fff", opacity: downloading ? 0.6 : 1 }}>
            ⬇ Descargar PDF
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 32, alignItems: "flex-start" }}>
        
        {/* PANEL IZQUIERDO */}
        <div style={{ flex: "1 1 400px", minWidth: 320, maxWidth: 480 }}>
          
          <div style={{ background: "#fff", border: "1px solid #EAECE8", borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 16px", color: "#2B2B2B", textTransform: "uppercase" }}>1. Estilo & Color Tierra</h3>
            
            <label className="cvb-label">Paletas Armónicas</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
              {PRESET_PALETTES.map(p => (
                <div key={p.id} onClick={() => setPalette(p)} className="color-swatch" style={{ background: p.primary, border: palette.id === p.id ? `3px solid #2B2B2B` : "2px solid transparent" }} title={p.name} />
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#F9FAF8", border: "1px solid #EAECE8", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#444" }}>
                <IconPalette color="#444" />
                <span>Elegí tu color personalizado</span>
                <input type="color" value={palette.primary} onChange={(e) => setPalette(generateCustomPalette(e.target.value))} style={{ width: 20, height: 20, border: "none", background: "none", cursor: "pointer", padding: 0 }} />
              </label>
            </div>

            <label className="cvb-label">Tono de Fuente</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {FONTS.map(f => (
                <button key={f.id} onClick={() => setSelectedFont(f.id)} style={{ flex: 1, padding: "8px", fontSize: 12, borderRadius: 6, border: selectedFont === f.id ? `1px solid ${palette.primary}` : "1px solid #EAECE8", background: selectedFont === f.id ? palette.surface : "#fff", color: selectedFont === f.id ? palette.primary : "#666", fontWeight: selectedFont === f.id ? 700 : 500, fontFamily: f.family }}>
                  {f.name}
                </button>
              ))}
            </div>

            <label className="cvb-label">Diseño de Hoja</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              {TEMPLATES.map((t) => (
                <div key={t.id} onClick={() => setTemplateId(t.id)} style={{ padding: "12px 14px", borderRadius: 8, background: templateId === t.id ? palette.surface : "#fff", border: templateId === t.id ? `1px solid ${palette.primary}` : "1px solid #EAECE8", cursor: "pointer", transition: "all 0.2s" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: templateId === t.id ? palette.primary : "#444" }}>{t.name}</span>
                  <p style={{ fontSize: 11, margin: "4px 0 0", color: "#888" }}>{t.blurb}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#F9FAF8", border: "1px solid #EAECE8", borderRadius: 12, padding: 18, marginBottom: 20 }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, margin: "0 0 10px", color: "#444", textTransform: "uppercase", display: "flex", alignItems: "center" }}>
              <IconSparkles color="#444" /> Recomendaciones Clave
            </h4>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#666", lineHeight: 1.6 }}>
              <li style={{ marginBottom: 4 }}><b>Métricas:</b> Cuantificá tus logros siempre que sea posible.</li>
              <li style={{ marginBottom: 4 }}><b>Contacto:</b> Verificá que tu teléfono y mail estén correctos.</li>
              <li><b>Ortografía:</b> Una lectura atenta final suma mucho profesionalismo.</li>
            </ul>
          </div>

          {/* FORMULARIO */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Section title="2. Datos personales" visible={visible.photo} onToggle={() => setVisible(v => ({ ...v, photo: !v.photo }))}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                {cv.personal.photo ? <img src={cv.personal.photo} alt="Perfil" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `1px solid ${palette.secondary}` }} /> : <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F4F5F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#AAA", fontWeight: 600 }}>FOTO</div>}
                <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files && e.target.files[0])} style={{ fontSize: 12, color: "#666" }} />
              </div>
              <Field label="Nombre completo" value={cv.personal.name} onChange={(v) => updatePersonal("name", v)} />
              <Field label="Puesto / Titular" value={cv.personal.title} onChange={(v) => updatePersonal("title", v)} />
              <Row2><Field label="Email" value={cv.personal.email} onChange={(v) => updatePersonal("email", v)} /><Field label="Teléfono" value={cv.personal.phone} onChange={(v) => updatePersonal("phone", v)} /></Row2>
              <Row2><Field label="Ubicación" value={cv.personal.location} onChange={(v) => updatePersonal("location", v)} /><Field label="LinkedIn / URL" value={cv.personal.linkedin} onChange={(v) => updatePersonal("linkedin", v)} /></Row2>
            </Section>

            <Section title="3. Perfil Profesional" visible={visible.summary} onToggle={() => setVisible(v => ({ ...v, summary: !v.summary }))}>
              <textarea className="cvb-input" rows={4} value={cv.summary} onChange={(e) => setCv((c) => ({ ...c, summary: e.target.value }))} placeholder="Breve descripción de tu valor profesional..." />
            </Section>

            <Section title="4. Experiencia Laboral" visible={visible.experience} onToggle={() => setVisible(v => ({ ...v, experience: !v.experience }))} onAdd={addExperience} addLabel="+ Puesto">
              {cv.experience.map((exp, i) => (
                <div key={exp.id} style={{ border: "1px solid #EAECE8", borderRadius: 8, padding: 16, marginBottom: 16, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Puesto #{i + 1}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="arrow-btn" onClick={() => moveExperience(i, "up")} disabled={i === 0}><IconArrowUp color="#666" /></button>
                      <button className="arrow-btn" onClick={() => moveExperience(i, "down")} disabled={i === cv.experience.length - 1}><IconArrowDown color="#666" /></button>
                    </div>
                  </div>
                  <Row2><Field label="Puesto" value={exp.role} onChange={(v) => updateExperience(exp.id, "role", v)} /><Field label="Empresa" value={exp.company} onChange={(v) => updateExperience(exp.id, "company", v)} /></Row2>
                  <Row2><Field label="Desde" value={exp.start} onChange={(v) => updateExperience(exp.id, "start", v)} /><Field label="Hasta" value={exp.end} onChange={(v) => updateExperience(exp.id, "end", v)} /></Row2>
                  
                  <label className="cvb-label" style={{ marginTop: 12 }}>Logros (Mejorar con IA)</label>
                  {exp.bullets.map((b, bi) => (
                    <div key={bi} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <input className="cvb-input" value={b} onChange={(e) => updateBullet(exp.id, bi, e.target.value)} placeholder="Ej: Reduje costos un 10%..." />
                      <button className="cvb-btn" onClick={() => improveBulletAI(exp.id, bi, b)} style={{ background: palette.surface, color: palette.primary, padding: "0 12px" }} title="Optimizar frase">
                        {loadingAI === `${exp.id}-${bi}` ? "…" : <IconSparkles color={palette.primary} />}
                      </button>
                      <button className="cvb-btn" onClick={() => removeBullet(exp.id, bi)} style={{ background: "#FDEAE8", color: "#C45B52", padding: "0 12px" }}>✕</button>
                    </div>
                  ))}
                  <button className="cvb-btn" onClick={() => addBullet(exp.id)} style={{ background: "transparent", color: palette.primary, fontSize: 12, padding: "4px 0" }}>+ Agregar logro</button>
                  {cv.experience.length > 1 && <button className="cvb-btn" onClick={() => removeExperience(exp.id)} style={{ background: "transparent", color: "#C45B52", fontSize: 12, marginLeft: 16 }}>Eliminar Puesto</button>}
                </div>
              ))}

              <div style={{ background: palette.surface, borderRadius: 8, padding: 14, marginTop: 12 }}>
                <h4 style={{ fontSize: 11, fontWeight: 800, margin: "0 0 8px", color: palette.primary, textTransform: "uppercase" }}>Verbos de acción sugeridos:</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ATS_VERBS.map((verb, i) => (
                    <span key={i} style={{ background: "#fff", border: `1px solid ${palette.accent}`, color: palette.secondary, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>{verb}</span>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="5. Educación" visible={visible.education} onToggle={() => setVisible(v => ({ ...v, education: !v.education }))} onAdd={addEducation} addLabel="+ Estudio">
              {cv.education.map((ed, i) => (
                <div key={ed.id} style={{ border: "1px solid #EAECE8", borderRadius: 8, padding: 16, marginBottom: 16, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Estudio #{i + 1}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="arrow-btn" onClick={() => moveEducation(i, "up")} disabled={i === 0}><IconArrowUp color="#666" /></button>
                      <button className="arrow-btn" onClick={() => moveEducation(i, "down")} disabled={i === cv.education.length - 1}><IconArrowDown color="#666" /></button>
                    </div>
                  </div>
                  <Field label="Título / Carrera" value={ed.degree} onChange={(v) => updateEducation(ed.id, "degree", v)} />
                  <Field label="Institución" value={ed.institution} onChange={(v) => updateEducation(ed.id, "institution", v)} />
                  <Row2><Field label="Desde" value={ed.start} onChange={(v) => updateEducation(ed.id, "start", v)} /><Field label="Hasta" value={ed.end} onChange={(v) => updateEducation(ed.id, "end", v)} /></Row2>
                </div>
              ))}
            </Section>

            <Section title="Habilidades" visible={visible.skills} onToggle={() => setVisible(v => ({ ...v, skills: !v.skills }))} onAdd={addSkill} addLabel="+">
              {cv.skills.map((s) => (
                <div key={s.id} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input className="cvb-input" value={s.name} onChange={(e) => updateSkillName(s.id, e.target.value)} placeholder="Ej. Liderazgo de equipos" />
                  <button className="cvb-btn" onClick={() => removeSkill(s.id)} style={{ background: "#FDEAE8", color: "#C45B52", padding: "0 10px" }}>✕</button>
                </div>
              ))}
            </Section>

            <Section title="Herramientas / Software" visible={visible.tools} onToggle={() => setVisible(v => ({ ...v, tools: !v.tools }))} onAdd={addTool} addLabel="+">
              {cv.tools.map((t) => (
                <div key={t.id} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input className="cvb-input" value={t.name} onChange={(e) => updateToolName(t.id, e.target.value)} placeholder="Ej. Excel, Power BI, SAP, Amadeus" />
                  <button className="cvb-btn" onClick={() => removeTool(t.id)} style={{ background: "#FDEAE8", color: "#C45B52", padding: "0 10px" }}>✕</button>
                </div>
              ))}
            </Section>

            <Section title="Idiomas" visible={visible.languages} onToggle={() => setVisible(v => ({ ...v, languages: !v.languages }))} onAdd={addLanguage} addLabel="+">
              {cv.languages.map((l) => (
                <div key={l.id} style={{ marginBottom: 12 }}>
                  <Row2>
                    <Field label="Idioma" value={l.name} onChange={(v) => updateLanguage(l.id, "name", v)} placeholder="Ej. Inglés" />
                    <Field label="Nivel" value={l.level} onChange={(v) => updateLanguage(l.id, "level", v)} placeholder="Ej. Avanzado C1" />
                  </Row2>
                </div>
              ))}
            </Section>
            
            <div style={{ textAlign: "center", padding: "24px 0 12px", color: "#777", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
              Espero te sirva. Muchos éxitos. <IconHeart color={palette.secondary} />
            </div>

          </div>
        </div>

        {/* PANEL DERECHO */}
        <div style={{ flex: "2 1 520px", minWidth: 320, overflowX: "auto", display: "flex", justifyContent: "center", paddingBottom: 60 }}>
          <div ref={printRef} className="print-area">
            <CVPreview data={cv} templateId={templateId} palette={palette} font={currentFontFamily} visible={visible} />
          </div>
        </div>

      </div>

      {/* MODAL IA */}
      {isAiModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAiModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#2B2B2B", display: "flex", alignItems: "center" }}>
                <IconSparkles color={palette.primary} size={18} /> Feedback del Reclutador
              </h2>
              <button onClick={() => setIsAiModalOpen(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888" }}>✕</button>
            </div>
            
            {aiFeedback === "ANALYZING" ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontSize: 15, color: palette.primary, fontWeight: 700 }}>Evaluando estructura y redacción...</p>
                <p style={{ fontSize: 13, color: "#888" }}>Esto toma unos segundos.</p>
              </div>
            ) : (
              <div className="ai-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(aiFeedback) }} style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 10 }} />
            )}
            
            {aiFeedback !== "ANALYZING" && (
              <button className="cvb-btn" onClick={() => setIsAiModalOpen(false)} style={{ width: "100%", padding: "12px", background: palette.primary, color: "#fff", marginTop: 24, fontSize: 14 }}>
                Cerrar y aplicar cambios
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatMarkdown(text) {
  return text.replace(/### (.*?)\n/g, '<h3>$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
}

/* ---------- COMPONENTES SECUNDARIOS ---------- */
function Section({ title, children, onAdd, addLabel, visible = true, onToggle }) { 
  return (
    <div style={{ background: "#fff", border: "1px solid #EAECE8", borderRadius: 12, padding: 24, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: visible ? 18 : 0, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onToggle && <button className="eye-btn" onClick={onToggle} title={visible ? "Ocultar" : "Mostrar"}>{visible ? <IconEye color="#AAA" /> : <IconEyeOff color="#AAA" />}</button>}
          <h3 style={{ fontSize: 12, fontWeight: 800, margin: 0, color: visible ? "#2B2B2B" : "#AAA", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h3>
        </div>
        {visible && onAdd && <button className="cvb-btn" onClick={onAdd} style={{ background: "#F4F5F4", color: "#666", fontSize: 12, padding: "4px 10px" }}>{addLabel}</button>}
      </div>
      {visible && children}
    </div>
  ); 
}
function Field({ label, value, onChange, placeholder }) { return (<div style={{ marginBottom: 10, width: "100%" }}><label className="cvb-label">{label}</label><input className="cvb-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>); }
function Row2({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>{children}</div>; }
function skillNames(items) { return (items || []).filter((s) => s && s.name && s.name.trim()).map((s) => s.name.trim()); }

/* ---------- ENRUTADOR DE PLANTILLAS ---------- */
function CVPreview({ data, templateId, palette, font, visible }) {
  if (templateId === "nordico") return <TplNordico data={data} palette={palette} font={font} visible={visible} />;
  if (templateId === "bloque") return <TplBloque data={data} palette={palette} font={font} visible={visible} />;
  if (templateId === "ats") return <TplATS data={data} visible={visible} />;
  return <TplNordico data={data} palette={palette} font={font} visible={visible} />;
}

/* 1. NÓRDICO MINIMALISTA */
function TplNordico({ data, palette, font, visible }) {
  const toolsList = skillNames(data.tools);
  const skillsList = skillNames(data.skills);

  return (
    <div style={{ fontFamily: font, background: "#fff", color: palette.textDark, padding: "56px 64px", boxSizing: "border-box" }}>
      <div className="page-block" style={{ borderBottom: `1px solid ${palette.accent}`, paddingBottom: 24, marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {visible.photo && data.personal.photo && (
            <img src={data.personal.photo} alt="Perfil" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }} />
          )}
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 4px", color: palette.textDark, letterSpacing: "-0.5px" }}>{data.personal.name || "Nombre Apellido"}</h1>
            <p style={{ fontSize: 16, color: palette.primary, fontWeight: 500, margin: "0 0 12px" }}>{data.personal.title}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 12, color: palette.secondary, fontWeight: 400 }}>
              {data.personal.location && <span><IconPin color={palette.secondary} size={12} />{data.personal.location}</span>}
              {data.personal.phone && <span><IconPhone color={palette.secondary} size={12} />{data.personal.phone}</span>}
              {data.personal.email && <span><IconMail color={palette.secondary} size={12} />{data.personal.email}</span>}
              {data.personal.linkedin && <span><IconLink color={palette.secondary} size={12} />{data.personal.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      {visible.summary && data.summary && (
        <div className="page-block" style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0, fontWeight: 400, color: "#444" }}>{data.summary}</p>
        </div>
      )}

      {visible.experience && (
        <div style={{ marginBottom: 40 }}>
          <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 20, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>
            Experiencia Profesional
          </h2>
          {data.experience.map((e) => (
            <div key={e.id} className="page-block" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{e.role} <span style={{ fontWeight: 400, color: palette.secondary }}>— {e.company}</span></h3>
                <span style={{ fontSize: 12, color: "#888" }}>{e.start} – {e.end || "Actualidad"}</span>
              </div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 13, lineHeight: 1.6, color: "#555" }}>
                {e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 48 }}>
        <div style={{ flex: 1 }}>
          {visible.education && (
            <div style={{ marginBottom: 32 }}>
              <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Educación</h2>
              {data.education.map((ed) => (
                <div key={ed.id} className="page-block" style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: "0 0 2px" }}>{ed.degree}</h3>
                  <p style={{ fontSize: 12.5, color: palette.secondary, margin: "0 0 2px" }}>{ed.institution}</p>
                  <p style={{ fontSize: 11.5, color: "#888", margin: 0 }}>{ed.start} - {ed.end}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          {visible.skills && skillsList.length > 0 && (
            <div className="page-block" style={{ marginBottom: 24 }}>
              <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Habilidades</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skillsList.map((s, i) => (
                  <span key={i} style={{ background: palette.surface, color: palette.textDark, fontSize: 12, padding: "4px 10px", borderRadius: 4, border: `1px solid ${palette.accent}` }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {visible.tools && toolsList.length > 0 && (
            <div className="page-block" style={{ marginBottom: 24 }}>
              <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Herramientas & Software</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {toolsList.map((t, i) => (
                  <span key={i} style={{ background: "#FFF", color: palette.textDark, fontSize: 12, padding: "4px 10px", borderRadius: 4, border: `1px solid ${palette.secondary}50` }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {visible.languages && (
            <div className="page-block">
              <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Idiomas</h2>
              {data.languages.filter(l=>l.name).map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4, color: "#555" }}>
                  <span style={{ fontWeight: 600 }}>{l.name}</span>
                  <span>{l.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* 2. BLOQUE SUTIL */
function TplBloque({ data, palette, font, visible }) {
  const toolsList = skillNames(data.tools);
  const skillsList = skillNames(data.skills);

  return (
    <div style={{ fontFamily: font, display: "flex", minHeight: "100%", background: "#fff" }}>
      <div style={{ width: "32%", background: palette.surface, padding: "48px 32px", color: palette.textDark, display: "flex", flexDirection: "column" }}>
        <div className="page-block" style={{ textAlign: "center", marginBottom: 32 }}>
          {visible.photo && data.personal.photo && (
             <img src={data.personal.photo} alt="Perfil" style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", marginBottom: 16 }} />
          )}
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.1 }}>{data.personal.name || "Nombre Apellido"}</h1>
          <p style={{ fontSize: 13, fontWeight: 600, color: palette.primary, margin: 0 }}>{data.personal.title}</p>
        </div>

        <div className="page-block" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: palette.secondary, borderBottom: `1px solid ${palette.accent}`, paddingBottom: 6, marginBottom: 12, letterSpacing: "1px" }}>Contacto</h3>
          {data.personal.location && <p style={{ fontSize: 12, margin: "0 0 8px" }}><IconPin color={palette.secondary} size={12} />{data.personal.location}</p>}
          {data.personal.phone && <p style={{ fontSize: 12, margin: "0 0 8px" }}><IconPhone color={palette.secondary} size={12} />{data.personal.phone}</p>}
          {data.personal.email && <p style={{ fontSize: 12, margin: "0 0 8px", wordBreak: "break-all" }}><IconMail color={palette.secondary} size={12} />{data.personal.email}</p>}
          {data.personal.linkedin && <p style={{ fontSize: 12, margin: "0 0 8px", wordBreak: "break-all" }}><IconLink color={palette.secondary} size={12} />{data.personal.linkedin}</p>}
        </div>

        {visible.education && (
          <div style={{ marginBottom: 32 }}>
            <h3 className="page-header-avoid" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: palette.secondary, borderBottom: `1px solid ${palette.accent}`, paddingBottom: 6, marginBottom: 12, letterSpacing: "1px" }}>Educación</h3>
            {data.education.map((ed) => (
              <div key={ed.id} className="page-block" style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, margin: "0 0 2px" }}>{ed.degree}</p>
                <p style={{ fontSize: 11.5, color: palette.secondary, margin: "0 0 2px" }}>{ed.institution}</p>
                <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{ed.start} - {ed.end}</p>
              </div>
            ))}
          </div>
        )}

        {visible.languages && (
          <div className="page-block">
            <h3 className="page-header-avoid" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: palette.secondary, borderBottom: `1px solid ${palette.accent}`, paddingBottom: 6, marginBottom: 12, letterSpacing: "1px" }}>Idiomas</h3>
            {data.languages.filter(l=>l.name).map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{l.name}</span>
                <span>{l.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ width: "68%", padding: "48px 40px", color: palette.textDark }}>
        {visible.summary && data.summary && (
          <div className="page-block" style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: palette.primary, textTransform: "uppercase", marginBottom: 12, letterSpacing: "1px" }}>Perfil Profesional</h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "#444", margin: 0 }}>{data.summary}</p>
          </div>
        )}

        {visible.experience && (
          <div style={{ marginBottom: 36 }}>
            <h2 className="page-header-avoid" style={{ fontSize: 14, fontWeight: 800, color: palette.primary, textTransform: "uppercase", marginBottom: 20, letterSpacing: "1px" }}>Experiencia</h2>
            {data.experience.map((e) => (
              <div key={e.id} className="page-block" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px" }}>{e.role}</h3>
                <div style={{ fontSize: 13, color: palette.secondary, fontWeight: 600, marginBottom: 6 }}>{e.company} <span style={{ color: "#888", fontWeight: 400, marginLeft: 6 }}>| {e.start} – {e.end || "Actualidad"}</span></div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.6, color: "#555" }}>
                  {e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {visible.skills && skillsList.length > 0 && (
          <div className="page-block" style={{ marginBottom: 28 }}>
            <h2 className="page-header-avoid" style={{ fontSize: 14, fontWeight: 800, color: palette.primary, textTransform: "uppercase", marginBottom: 14, letterSpacing: "1px" }}>Habilidades</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skillsList.map((s, i) => (
                <span key={i} style={{ border: `1px solid ${palette.accent}`, color: palette.textDark, fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 4 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {visible.tools && toolsList.length > 0 && (
          <div className="page-block">
            <h2 className="page-header-avoid" style={{ fontSize: 14, fontWeight: 800, color: palette.primary, textTransform: "uppercase", marginBottom: 14, letterSpacing: "1px" }}>Herramientas & Software</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {toolsList.map((t, i) => (
                <span key={i} style={{ background: palette.surface, border: `1px solid ${palette.accent}`, color: palette.textDark, fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 4 }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* 3. ATS ESTRICTO */
function TplATS({ data, visible }) {
  const toolsList = skillNames(data.tools);
  const skillsList = skillNames(data.skills);

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#000", padding: "40px", fontSize: 13.5, lineHeight: 1.6, background: "#fff" }}>
      <div className="page-block">
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", textAlign: "center", textTransform: "uppercase" }}>{data.personal.name || "NOMBRE APELLIDO"}</h1>
        <p style={{ margin: "0 0 8px", textAlign: "center", fontSize: 14 }}>{data.personal.title}</p>
        <p style={{ margin: "0 0 20px", fontSize: 12, textAlign: "center" }}>{[data.personal.location, data.personal.email, data.personal.phone, data.personal.linkedin].filter(Boolean).join(" | ")}</p>
      </div>
      
      {visible.summary && data.summary && (
        <div className="page-block">
          <h2 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>Resumen Profesional</h2>
          <p style={{ marginBottom: 16 }}>{data.summary}</p>
        </div>
      )}
      
      {visible.experience && (
        <div style={{ marginBottom: 16 }}>
          <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>Experiencia Laboral</h2>
          {data.experience.map((e) => (
            <div key={e.id} className="page-block" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 2 }}><span>{e.role}, {e.company}</span><span>{e.start} - {e.end || "Actualidad"}</span></div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 3 }}>{b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      
      {visible.education && (
        <div style={{ marginBottom: 16 }}>
          <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 8, marginTop: 16, textTransform: "uppercase" }}>Educación</h2>
          {data.education.map((ed) => (<p key={ed.id} className="page-block" style={{ margin: "0 0 4px", fontWeight: 700 }}>{ed.degree}, {ed.institution} <span style={{ fontWeight: 400 }}>({ed.start} - {ed.end})</span></p>))}
        </div>
      )}
      
      {(visible.skills || visible.tools || visible.languages) && (
        <div className="page-block" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>Habilidades, Herramientas e Idiomas</h2>
          {visible.skills && skillsList.length > 0 && <p style={{ margin: "0 0 4px" }}><strong>Habilidades:</strong> {skillsList.join(", ")}</p>}
          {visible.tools && toolsList.length > 0 && <p style={{ margin: "0 0 4px" }}><strong>Herramientas / Software:</strong> {toolsList.join(", ")}</p>}
          {visible.languages && <p style={{ margin: 0 }}><strong>Idiomas:</strong> {data.languages.filter(l=>l.name).map(l => `${l.name} (${l.level})`).join(", ")}</p>}
        </div>
      )}
    </div>
  );
}

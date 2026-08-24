// @ts-nocheck
import { useState, useEffect, useRef } from "react";

/* ---------- HELPERS ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const emptyExperience = () => ({ id: uid(), company: "", role: "", start: "", end: "", current: false, roleSummary: "", bullets: [""] });
const emptyEducation = () => ({ id: uid(), institution: "", degree: "", start: "", end: "" });
const emptyLanguage = () => ({ id: uid(), name: "", level: "" });
const emptySkill = () => ({ id: uid(), name: "", level: 4 });
const emptyTool = () => ({ id: uid(), name: "" });
const emptyCustomSection = () => ({ id: uid(), title: "Certificaciones / Proyectos", items: [""] });

const emptyCV = () => ({
  personal: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", photo: "" },
  summary: "",
  experience: [emptyExperience()],
  education: [emptyEducation()],
  skills: [emptySkill()],
  languages: [emptyLanguage()],
  tools: [emptyTool()],
  customSections: [],
});

const emptyCoverLetter = () => ({
  date: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }),
  recipientName: "",
  jobTitle: "",
  companyName: "",
  body: "Estimado/a equipo de selección,\n\nLes escribo para presentar mi candidatura al puesto de [Puesto] en [Empresa]. A lo largo de mi trayectoria profesional...\n\nQuedo a su entera disposición para ampliar cualquier información en una entrevista.\n\nAtentamente,\n"
});

function normalizeSkills(skills) {
  if (!skills || !skills.length) return [emptySkill()];
  return skills.map((s) => typeof s === "string" ? { id: uid(), name: s, level: 4 } : { id: s.id || uid(), name: s.name || "", level: s.level || 4 });
}

function normalizeTools(tools) {
  if (!tools || !tools.length) return [emptyTool()];
  return tools.map((t) => typeof t === "string" ? { id: uid(), name: t } : { id: t.id || uid(), name: t.name || "" });
}

function calculateCompleteness(cv) {
  let score = 0;
  if (cv.personal.name) score += 10;
  if (cv.personal.title) score += 10;
  if (cv.personal.email && cv.personal.phone) score += 10;
  if (cv.summary && cv.summary.length > 25) score += 15;
  if (cv.experience.some(e => e.role && e.company && (e.roleSummary || e.bullets.some(b => b.length > 5)))) score += 25;
  if (cv.education.some(ed => ed.degree && ed.institution)) score += 10;
  if (cv.skills.some(s => s.name.trim())) score += 10;
  if (cv.tools.some(t => t.name.trim())) score += 10;
  return Math.min(score, 100);
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
const IconHeart = ({ color = "#C47165", size = 15 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginLeft: 6 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const IconTrash = ({ color = "#888", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const IconTarget = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>);
const IconMoon = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>);
const IconSun = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>);
const IconUpload = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>);

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

const DENSITIES = [
  { id: "compact", name: "Compacto" },
  { id: "normal", name: "Normal" },
  { id: "spacious", name: "Espacioso" },
];

const ATS_VERBS = ["Lideré", "Optimicé", "Implementé", "Reduje", "Coordiné", "Aumenté", "Diseñé", "Negocié", "Gestioné", "Desarrollé"];

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

/* ---------- API IA NATIVA ---------- */
async function callClaude(promptOrMessages) {
  const API_KEY = import.meta.env?.VITE_ANTHROPIC_API_KEY || ""; 
  if (!API_KEY) throw new Error("NO_KEY");

  const content = typeof promptOrMessages === "string" 
    ? [{ role: "user", content: promptOrMessages }]
    : [{ role: "user", content: promptOrMessages }];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-3-5-sonnet-20240620", max_tokens: 1500, messages: content }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Error API");
  return (data.content || []).map(b => b.text).join("\n").replace(/```json|```/g, "").trim();
}

/* ---------- APP PRINCIPAL ---------- */
export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeDoc, setActiveDoc] = useState("cv"); 
  const [darkMode, setDarkMode] = useState(false);
  const [cv, setCv] = useState(emptyCV());
  const [coverLetter, setCoverLetter] = useState(emptyCoverLetter());
  const [templateId, setTemplateId] = useState("nordico");
  const [palette, setPalette] = useState(PRESET_PALETTES[0]); 
  const [selectedFont, setSelectedFont] = useState("nunito");
  const [density, setDensity] = useState("normal");
  const [visible, setVisible] = useState({ photo: true, summary: true, experience: true, education: true, skills: true, languages: true, tools: true });
  const [downloading, setDownloading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(""); 
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState("editor");

  /* ESTADOS CAZADOR ATS */
  const [jobDescription, setJobDescription] = useState("");
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [loadingATS, setLoadingATS] = useState(false);

  /* ESTADOS IMPORTACIÓN DE CV */
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rawCvText, setRawCvText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [loadingImport, setLoadingImport] = useState(false);

  const saveTimer = useRef(null);
  const printRef = useRef(null);

  useEffect(() => { document.title = "Impulso CV Premium"; }, []);

  useEffect(() => {
    try {
      const res = localStorage.getItem(STORAGE_KEY);
      if (res) {
        const parsed = JSON.parse(res);
        if (parsed.cv) setCv({ ...emptyCV(), ...parsed.cv, personal: { ...emptyCV().personal, ...parsed.cv.personal }, skills: normalizeSkills(parsed.cv.skills), tools: normalizeTools(parsed.cv.tools), customSections: parsed.cv.customSections || [] });
        if (parsed.coverLetter) setCoverLetter({ ...emptyCoverLetter(), ...parsed.coverLetter });
        if (parsed.templateId) setTemplateId(parsed.templateId);
        if (parsed.palette) setPalette(parsed.palette);
        if (parsed.selectedFont) setSelectedFont(parsed.selectedFont);
        if (parsed.density) setDensity(parsed.density);
        if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
        if (parsed.visible) setVisible({ photo: true, summary: true, experience: true, education: true, skills: true, languages: true, tools: true, ...parsed.visible, tools: parsed.visible.tools ?? true });
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ cv, coverLetter, templateId, palette, selectedFont, density, darkMode, visible })); } catch (e) {} }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [cv, coverLetter, templateId, palette, selectedFont, density, darkMode, visible, loaded]);

  const handleResetCV = () => {
    if (window.confirm("¿Seguro que querés borrar todo el contenido y empezar un documento desde cero?")) {
      localStorage.removeItem(STORAGE_KEY);
      setCv(emptyCV());
      setCoverLetter(emptyCoverLetter());
      setAtsAnalysis(null);
      setJobDescription("");
      setDensity("normal");
      setRawCvText("");
      setSelectedFile(null);
    }
  };

  const updatePersonal = (field, value) => setCv((c) => ({ ...c, personal: { ...c.personal, [field]: value } }));

  const handlePhotoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updatePersonal("photo", e.target.result);
    };
    reader.readAsDataURL(file);
  };

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

  /* SECCIONES PERSONALIZADAS */
  const addCustomSection = () => setCv(c => ({ ...c, customSections: [...(c.customSections || []), emptyCustomSection()] }));
  const removeCustomSection = (id) => setCv(c => ({ ...c, customSections: (c.customSections || []).filter(s => s.id !== id) }));
  const updateCustomSectionTitle = (id, title) => setCv(c => ({ ...c, customSections: (c.customSections || []).map(s => s.id === id ? { ...s, title } : s) }));
  const addCustomItem = (secId) => setCv(c => ({ ...c, customSections: (c.customSections || []).map(s => s.id === secId ? { ...s, items: [...s.items, ""] } : s) }));
  const updateCustomItem = (secId, idx, val) => setCv(c => ({ ...c, customSections: (c.customSections || []).map(s => s.id === secId ? { ...s, items: s.items.map((item, i) => i === idx ? val : item) } : s) }));
  const removeCustomItem = (secId, idx) => setCv(c => ({ ...c, customSections: (c.customSections || []).map(s => s.id === secId ? { ...s, items: s.items.filter((_, i) => i !== idx) } : s) }));

  /* APLICADOR SEGURO DE DATOS */
  const applyParsedCvData = (parsed) => {
    setCv({
      ...emptyCV(),
      personal: { ...emptyCV().personal, ...(parsed.personal || {}) },
      summary: parsed.summary || "",
      experience: parsed.experience && parsed.experience.length ? parsed.experience.map(e => ({ id: uid(), role: e.role || "", company: e.company || "", start: e.start || "", end: e.end || "", roleSummary: e.roleSummary || "", bullets: e.bullets && e.bullets.length ? e.bullets : [""] })) : [emptyExperience()],
      education: parsed.education && parsed.education.length ? parsed.education.map(ed => ({ id: uid(), degree: ed.degree || "", institution: ed.institution || "", start: ed.start || "", end: ed.end || "" })) : [emptyEducation()],
      skills: parsed.skills && parsed.skills.length ? parsed.skills.map(s => ({ id: uid(), name: typeof s === 'string' ? s : s.name || "" })) : [emptySkill()],
      tools: parsed.tools && parsed.tools.length ? parsed.tools.map(t => ({ id: uid(), name: typeof t === 'string' ? t : t.name || "" })) : [emptyTool()],
      languages: parsed.languages && parsed.languages.length ? parsed.languages.map(l => ({ id: uid(), name: l.name || "", level: l.level || "" })) : [emptyLanguage()],
      customSections: []
    });
    setIsImportModalOpen(false);
    setRawCvText("");
    setSelectedFile(null);
    setPdfBase64(null);
    setShowLanding(false);
  };

  /* SELECCIÓN DE ARCHIVO Y LECTURA INMEDIATA */
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    e.target.value = null; 

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          applyParsedCvData(JSON.parse(event.target.result));
        } catch(err) {
          alert("El archivo JSON no es un respaldo válido.");
        }
      };
      reader.readAsText(file);
      return;
    }

    setSelectedFile(file);
    setRawCvText(`[Archivo seleccionado: ${file.name}]\n\nHacé clic en "Extraer y Auto-completar CV" para procesarlo con IA.`);
  };

  /* EXTRACCIÓN AUTOMÁTICA DE DATOS CON IA */
  const handleExtractCvData = async () => {
    if (!rawCvText.trim() && !selectedFile) return;

    setLoadingImport(true);

    try {
      const API_KEY = import.meta.env?.VITE_ANTHROPIC_API_KEY || "";
      if (!API_KEY) throw new Error("NO_KEY");

      const jsonPrompt = `Analizá el CV adjunto (en texto o documento) y extraé todos los datos estructurados.
Devolvé ÚNICAMENTE un JSON estricto con esta forma:
{
  "personal": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "" },
  "summary": "",
  "experience": [{ "role": "", "company": "", "start": "", "end": "", "roleSummary": "", "bullets": [""] }],
  "education": [{ "degree": "", "institution": "", "start": "", "end": "" }],
  "skills": [{ "name": "" }],
  "tools": [{ "name": "" }],
  "languages": [{ "name": "", "level": "" }]
}
Si algún campo no figura, dejalo como string vacío.`;

      let promptPayload;

      if (selectedFile && selectedFile.type === "application/pdf") {
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(selectedFile);
        });
        
        promptPayload = [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Data
            }
          },
          { type: "text", text: jsonPrompt }
        ];
      } else {
        let textToProcess = rawCvText;
        if (selectedFile && (selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.md'))) {
          textToProcess = await new Promise((resolve) => {
             const reader = new FileReader();
             reader.onload = () => resolve(reader.result);
             reader.readAsText(selectedFile);
          });
        }
        promptPayload = `${jsonPrompt}\n\nTexto a analizar: "${textToProcess.replace(/"/g, "'")}"`;
      }

      const responseText = await callClaude(promptPayload);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Formato JSON no encontrado");
      
      const parsed = JSON.parse(jsonMatch[0]);
      applyParsedCvData(parsed);

    } catch (e) {
      if (e.message === "NO_KEY") {
        alert("Atención: No detectamos tu API Key de Anthropic. El texto se guardará en tu resumen provisoriamente.");
      } else {
        alert("Ocurrió un error al procesar el archivo. Te pegamos el texto en tu perfil para que lo acomodes a mano.");
      }
      
      if (rawCvText && !rawCvText.startsWith("[Archivo seleccionado:")) {
        setCv(c => ({ ...c, summary: rawCvText }));
        setIsImportModalOpen(false);
        setShowLanding(false);
      }
    }
    
    setLoadingImport(false);
  };

  const analyzeEntireCV = async () => {
    setIsAiModalOpen(true);
    setAiFeedback("ANALYZING");
    try {
      const cvText = `Nombre: ${cv.personal.name}\nPerfil: ${cv.summary}\nExperiencia: ${cv.experience.map(e => `${e.role} en ${e.company}. Resumen: ${e.roleSummary || ''}. Logros: ${e.bullets.join('; ')}`).join(' | ')}\nEducación: ${cv.education.map(ed => ed.degree).join(', ')}\nHabilidades: ${cv.skills.map(s=>s.name).join(', ')}\nHerramientas: ${cv.tools.map(t=>t.name).join(', ')}`;
      const prompt = `Actuá como un Reclutador experto. Analizá este CV y devolvé tu feedback EXACTAMENTE con esta estructura (usá formato markdown):\n\n### Puntos Fuertes\n(1 aspecto positivo)\n\n### Oportunidades de Mejora\n(2 consejos prácticos sobre redacción o estructura)\n\n### Recomendación Clave\n(Un consejo profesional breve).\n\nSé directo. CV: ${cvText}`;
      const analysis = await callClaude(prompt);
      setAiFeedback(analysis);
    } catch (e) {
      setTimeout(() => {
        setAiFeedback(generateFallbackAnalysis(cv));
      }, 600);
    }
  };

  const analyzeJobKeywords = async () => {
    if (!jobDescription.trim()) return;
    setLoadingATS(true);
    try {
      const cvFullText = `${cv.summary} ${cv.experience.map(e=> `${e.role} ${e.company} ${e.roleSummary || ''} ${e.bullets.join(' ')}`).join(' ')} ${cv.skills.map(s=>s.name).join(' ')} ${cv.tools.map(t=>t.name).join(' ')}`.toLowerCase();
      
      const prompt = `Analizá la siguiente oferta laboral y extraé entre 5 y 8 PALABRAS CLAVE PROFESIONALES RELEVANTES (habilidades técnicas, conocimientos del sector, herramientas o metodologías).
      REGLAS STRICTAS:
      - IGNORÁ palabras de relleno, nombres de países o ciudades (ej. "Argentina"), verbos genéricos ("buscamos", "encontramos", "expandiendo", "ofrecer", "desafío") e historia corporativa.
      - Solo extraé términos de valor profesional para un filtro ATS (ej. "Logística", "Gestión de inventarios", "SAP", "Excel", "Inglés", "Liderazgo").
      Devolvé ÚNICAMENTE un formato JSON estricto: {"keywords": ["palabra1", "palabra2"]}\n\nOferta Laboral: "${jobDescription}"`;
      
      const responseText = await callClaude(prompt);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Formato JSON no encontrado");

      const parsed = JSON.parse(jsonMatch[0]);
      const extractedKeywords = parsed.keywords || [];

      const matched = [];
      const missing = [];

      extractedKeywords.forEach(word => {
        if (cvFullText.includes(word.toLowerCase())) {
          matched.push(word);
        } else {
          missing.push(word);
        }
      });

      const score = Math.round((matched.length / (extractedKeywords.length || 1)) * 100);
      setAtsAnalysis({ matched, missing, score });
    } catch (e) {
      const stopWords = ["desde", "como", "con", "sobre", "este", "esta", "para", "entre", "donde", "argentina", "encontramos", "expandiendose", "continua", "frente", "nuevo", "desafio", "soluciones", "calidad", "conocimiento", "experiencia", "mercado", "ofrecer", "global", "presencia", "solida", "hemos", "consolidado"];
      const words = jobDescription.toLowerCase().match(/\b[a-záéíóúñ]{4,}\b/g) || [];
      const cvFullText = `${cv.summary} ${cv.experience.map(e=> `${e.role} ${e.bullets.join(' ')}`).join(' ')} ${cv.skills.map(s=>s.name).join(' ')} ${cv.tools.map(t=>t.name).join(' ')}`.toLowerCase();
      const uniqueWords = Array.from(new Set(words)).filter(w => !stopWords.includes(w)).slice(0, 6);
      
      const matched = uniqueWords.filter(w => cvFullText.includes(w));
      const missing = uniqueWords.filter(w => !cvFullText.includes(w));
      const score = Math.round((matched.length / (uniqueWords.length || 1)) * 100);
      setAtsAnalysis({ matched, missing, score });
    }
    setLoadingATS(false);
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

  /* GENERAR CARTA DE PRESENTACIÓN CON IA */
  const handleGenerateCoverLetter = async () => {
    setLoadingAI('letter');
    try {
      const prompt = `Actuá como un profesional postulándose a un trabajo. Redactá una carta de presentación formal y persuasiva.
Mi CV resumido es: Nombre: ${cv.personal.name}. Perfil: ${cv.summary}. Experiencia principal: ${cv.experience.map(e=>`${e.role} en ${e.company}`).join('; ')}.
Escribila para el puesto de "${coverLetter.jobTitle}" en la empresa "${coverLetter.companyName}". Reclutador o Contacto: "${coverLetter.recipientName}".
Devolvé ÚNICAMENTE el texto del cuerpo de la carta (los párrafos), listo para usar. No incluyas fechas, ni nombre del destinatario arriba, ni "Estimado" al principio (ya están integrados en el sistema). Que sea directa, destaque cómo mi experiencia se alinea al puesto y no supere los 3 párrafos cortos.`;
      
      const body = await callClaude(prompt);
      setCoverLetter(prev => ({ ...prev, body }));
    } catch (e) {
      alert("Ocurrió un error al generar la carta con IA. Podés escribirla manualmente.");
    }
    setLoadingAI(null);
  };

  /* DESCARGA DE PDF VECTORIAL CON MARGEN OPTIMIZADO */
  const handleDownloadPdf = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map(s => s.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${(cv.personal.name || "Documento").trim().replace(/\s+/g, "_")}_${activeDoc === 'cv' ? 'CV' : 'Carta'}</title>
          ${styles}
          <style>
            @page { 
              size: A4 portrait; 
              margin: 8mm 0 8mm 0; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              background: white; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .page-break-indicator { display: none !important; }
            .print-area { width: 100% !important; min-height: auto !important; box-shadow: none !important; margin: 0 !important; }
            .page-block { padding-top: 4px !important; margin-top: 2px !important; }
            .exp-item { break-inside: avoid !important; page-break-inside: avoid !important; }
            li { break-inside: avoid !important; page-break-inside: avoid !important; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 300);
  };

  const currentFontFamily = FONTS.find(f => f.id === selectedFont)?.family || "'Nunito', sans-serif";
  const completeness = calculateCompleteness(cv);

  /* ESTILOS DINÁMICOS MODO OSCURO */
  const uiBg = darkMode ? "#181818" : "#F4F5F4";
  const headerBg = darkMode ? "#222222" : "#E8E2D5";
  const headerBorder = darkMode ? "#333333" : "#D8D0C0";
  const cardBg = darkMode ? "#242424" : "#FFFFFF";
  const cardBorder = darkMode ? "#333333" : "#EAECE8";
  const textColor = darkMode ? "#E0E0E0" : "#4A4A4A";
  const headingColor = darkMode ? "#FFFFFF" : "#2B2B2B";
  const inputBg = darkMode ? "#2D2D2D" : "#FCFCFC";
  const inputBorder = darkMode ? "#404040" : "#E2E4E2";

  /* ---------- LANDING PAGE INTRO ---------- */
  if (showLanding) {
    return (
      <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: "#F4F5F4", minHeight: "100vh", color: "#333", display: "flex", flexDirection: "column" }}>
        <style>{`
          * { box-sizing: border-box; }
          .landing-btn-main { background: ${palette.primary}; color: #fff; padding: 16px 36px; border-radius: 30px; border: none; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.12); }
          .landing-btn-main:hover { opacity: 0.92; transform: translateY(-2px); }
          .landing-card { background: #fff; border: 1px solid #E2E4E2; border-radius: 16px; padding: 24px; flex: 1; min-width: 240px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          
          .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            backdrop-filter: blur(4px);
          }
          .modal-content {
            background: #FFFFFF;
            border: 1px solid #E2E4E2;
            padding: 32px;
            border-radius: 16px;
            width: 90%;
            max-width: 520px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          }
        `}</style>
        
        <div style={{ padding: "20px 32px", background: "#E8E2D5", borderBottom: "1px solid #D8D0C0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#2B2B2B" }}>
            Impulso CV <span style={{ color: palette.primary, background: "#FFF", padding: "2px 8px", borderRadius: 10, fontSize: 10, verticalAlign: "middle", marginLeft: 6, fontWeight: 600 }}>PREMIUM</span>
          </h1>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setIsImportModalOpen(true); }} style={{ background: "#FFF", color: "#333", border: "1px solid #CFC7B8", padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              📥 Importar CV Existente
            </button>
            <button onClick={() => setShowLanding(false)} style={{ background: palette.primary, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Crear desde cero
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px 40px", textAlign: "center" }}>
          <span style={{ background: "#E8E2D5", color: "#555", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            ✨ GENERADOR INTELIGENTE DE CURRÍCULUM
          </span>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#222", margin: "20px 0 16px", lineHeight: 1.25 }}>
            Destacá en tus postulaciones con un CV profesional y optimizado.
          </h2>
          <p style={{ fontSize: 16, color: "#666", lineHeight: 1.6, maxWidth: 720, margin: "0 auto 10px" }}>
            Impulso CV combina plantillas profesionales, importación automática de currículums existentes por IA, cazador de palabras clave ATS y evaluación en tiempo real para potenciar tu perfil laboral.
          </p>
          <p style={{ fontSize: 13.5, color: "#888", margin: "0 auto 32px", fontWeight: 500 }}>
            Un servicio gratuito diseñado para impulsar tu carrera.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="landing-btn-main" onClick={() => setShowLanding(false)}>
              Crear un CV nuevo →
            </button>
            <button className="landing-btn-main" onClick={() => setIsImportModalOpen(true)} style={{ background: "#FFF", color: palette.primary, border: `1px solid ${palette.primary}` }}>
              📥 Cargar un CV existente
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1050, margin: "0 auto 60px", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <div className="landing-card">
            <div style={{ fontSize: 28, marginBottom: 12 }}>📥</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#222" }}>Importador por IA</h3>
            <p style={{ fontSize: 13.5, color: "#666", lineHeight: 1.5, margin: 0 }}>
              Cargá un archivo PDF/texto o pegá el contenido de tu CV actual y la IA extraerá tus datos automáticamente.
            </p>
          </div>

          <div className="landing-card">
            <div style={{ fontSize: 28, marginBottom: 12 }}>🎯</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#222" }}>Cazador ATS</h3>
            <p style={{ fontSize: 13.5, color: "#666", lineHeight: 1.5, margin: 0 }}>
              Pegá el texto de cualquier oferta de empleo y detectá al instante qué palabras clave técnicas le faltan a tu CV.
            </p>
          </div>

          <div className="landing-card">
            <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#222" }}>Medidor de Calidad</h3>
            <p style={{ fontSize: 13.5, color: "#666", lineHeight: 1.5, margin: 0 }}>
              Barra de completitud en tiempo real para asegurarte de incluir todos los elementos exigidos por reclutadores.
            </p>
          </div>

          <div className="landing-card">
            <div style={{ fontSize: 28, marginBottom: 12 }}>🤖</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#222" }}>Revisión Inteligente</h3>
            <p style={{ fontSize: 13.5, color: "#666", lineHeight: 1.5, margin: 0 }}>
              Optimización individual de frases y devolución completa del perfil realizada por un Reclutador Virtual.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "auto", padding: "20px", textAlign: "center", borderTop: "1px solid #E2E4E2", fontSize: 13, color: "#777" }}>
          Impulso CV Premium • Servicio Gratuito para Generación Profesional de Currículum
        </div>

        {/* MODAL IMPORTAR CV EN LA LANDING */}
        {isImportModalOpen && (
          <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#222", display: "flex", alignItems: "center" }}>
                  <IconUpload color={palette.primary} /> Importar Datos desde CV Existente
                </h2>
                <button onClick={() => setIsImportModalOpen(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888" }}>✕</button>
              </div>

              <p style={{ fontSize: 12.5, color: "#666", marginBottom: 14 }}>
                Cargá un archivo <b>.pdf</b>, <b>.txt</b> o <b>.md</b> o pegá el texto completo de tu CV actual. La IA extraerá automáticamente tu información para completar los campos.
              </p>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Subir Archivo (.PDF / .TXT / .MD)</label>
                <input type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} style={{ fontSize: 12, color: "#222" }} />
              </div>

              <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>o Pegá el Texto de tu CV:</label>
              <textarea 
                rows={8} 
                value={rawCvText} 
                onChange={(e) => {
                  setRawCvText(e.target.value);
                  if (selectedFile) setSelectedFile(null);
                }} 
                placeholder="Nombre, Experiencia laboral, Educación, Habilidades..." 
                style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #CCC", fontSize: 13, marginBottom: 16, background: "#FFF", color: "#222" }}
              />

              <button 
                onClick={handleExtractCvData} 
                disabled={loadingImport || (!rawCvText.trim() && !selectedFile)} 
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  background: (loadingImport || (!rawCvText.trim() && !selectedFile)) ? "#888" : palette.primary, 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 6, 
                  fontSize: 13, 
                  fontWeight: 600, 
                  cursor: (loadingImport || (!rawCvText.trim() && !selectedFile)) ? "not-allowed" : "pointer" 
                }}
              >
                {loadingImport ? "Procesando e integrando datos..." : "Extraer y Auto-completar CV"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- BUILDER / EDITOR ---------- */
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: uiBg, minHeight: "100vh", position: "relative", color: textColor, transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; }
        .cvb-btn { cursor:pointer; border:none; border-radius:6px; font-weight:500; transition:all .2s; display:inline-flex; align-items:center; justify-content:center; }
        .cvb-btn:hover { opacity:.85; transform: translateY(-1px); }
        .cvb-input { width:100%; border:1px solid ${inputBorder}; border-radius:6px; padding:10px 12px; font-size:13.5px; font-family:'Inter',sans-serif; background: ${inputBg}; color: ${textColor}; font-weight:400; }
        .cvb-input:focus { outline:2px solid ${palette.primary}; outline-offset:1px; background: ${darkMode ? '#333' : '#fff'}; }
        .cvb-label { font-size:11px; font-weight:600; color:${darkMode ? '#A0A0A0' : '#6B726B'}; text-transform:uppercase; letter-spacing:.05em; display:block; margin-bottom:6px; }
        
        .print-area-wrapper { position: relative; }
        .print-area { width: 794px; min-height: 1123px; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin: 0 auto; }
        
        .page-break-indicator {
          position: absolute;
          top: 1123px;
          left: -10px;
          right: -10px;
          border-top: 2px dashed #E53935;
          pointer-events: none;
          z-index: 10;
        }
        .page-break-indicator::after {
          content: "── FIN PÁGINA 1 (A4) ──";
          position: absolute;
          right: 20px;
          top: -9px;
          background: #E53935;
          color: white;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        .page-block { padding-top: 8px; margin-top: 4px; }
        .page-header-avoid { break-after: avoid !important; page-break-after: avoid !important; }
        .exp-item { break-inside: avoid !important; page-break-inside: avoid !important; }
        li { break-inside: avoid !important; page-break-inside: avoid !important; }

        .color-swatch { width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .color-swatch:hover { transform: scale(1.1); }
        .eye-btn { background: none; border: none; cursor: pointer; opacity: 0.5; padding: 0; display:flex; }
        .eye-btn:hover { opacity: 1; }
        .arrow-btn { background: ${darkMode ? '#333' : '#EAECE8'}; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; display:flex; align-items:center; }
        .arrow-btn:hover { background: ${darkMode ? '#444' : '#D5D7D3'}; }
        
        .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 99999; backdrop-filter: blur(4px); }
        .modal-content { background: ${cardBg}; border: 1px solid ${cardBorder}; padding: 32px; border-radius: 16px; width: 90%; max-width: 520px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .ai-text h3 { color: ${palette.primary}; font-size: 15px; margin: 16px 0 8px; border-bottom: 1px solid ${palette.accent}; padding-bottom: 4px; font-weight:600; }
        .ai-text p { font-size: 14px; line-height: 1.6; color: ${textColor}; margin: 0 0 12px; }

        .doc-switcher { display: flex; gap: 8px; margin-bottom: 20px; background: ${darkMode ? "#2D2D2D" : "#EAECE8"}; padding: 6px; border-radius: 8px; }
        .doc-switch-btn { flex: 1; padding: 10px 0; border: none; background: transparent; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; color: ${textColor}; transition: all 0.2s; }
        .doc-switch-btn.active { background: ${cardBg}; color: ${palette.primary}; box-shadow: 0 2px 5px rgba(0,0,0,0.06); }

        @media (min-width: 769px) {
          .mobile-tabs { display: none !important; }
          .panel-right-mobile {
            position: sticky !important;
            top: 20px;
            max-height: calc(100vh - 40px);
            overflow-y: auto !important;
          }
        }

        @media (max-width: 768px) {
          .cvb-header-nav { flex-direction: column; align-items: flex-start !important; gap: 12px; padding: 14px 16px !important; }
          .cvb-header-actions { width: 100%; display: flex; flex-wrap: wrap; gap: 8px; }
          .cvb-header-actions button { flex: 1 1 auto; font-size: 11px !important; padding: 8px 10px !important; justify-content: center; }
          .cvb-main-layout { padding: 12px !important; gap: 16px !important; }
          .mobile-tabs { display: flex !important; width: 100%; background: ${darkMode ? '#333' : '#E2E2E2'}; border-radius: 8px; padding: 4px; margin-bottom: 12px; }
          .mobile-tab-btn { flex: 1; padding: 8px; border: none; background: transparent; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; color: ${textColor}; }
          .mobile-tab-btn.active { background: ${cardBg}; color: ${palette.primary}; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .panel-left-mobile { display: ${activeTabMobile === 'editor' ? 'block' : 'none'} !important; width: 100% !important; max-width: 100% !important; }
          .panel-right-mobile { display: ${activeTabMobile === 'preview' ? 'flex' : 'none'} !important; width: 100% !important; overflow-x: auto !important; }
          .print-area-container { transform: scale(0.44); transform-origin: top center; margin-bottom: -600px; }
        }
      `}</style>

      {/* HEADER DE LA APP */}
      <div className="cvb-header-nav" style={{ padding: "18px 32px", background: headerBg, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${headerBorder}` }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: headingColor, letterSpacing: "-0.5px", display: "flex", alignItems: "center" }}>
            Impulso CV <span style={{ color: palette.primary, background: cardBg, padding: "2px 8px", borderRadius: 10, fontSize: 10, verticalAlign: "middle", marginLeft: 8, border: `1px solid ${palette.secondary}40`, fontWeight: 600 }}>PREMIUM</span>
          </h1>
        </div>
        <div className="cvb-header-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="cvb-btn" onClick={() => setIsImportModalOpen(true)} style={{ padding: "8px 12px", fontSize: 12, background: "transparent", border: `1px solid ${darkMode ? '#555' : '#CFC7B8'}`, color: textColor }}>
            <IconUpload color={textColor} /> Importar Datos
          </button>
          <button className="cvb-btn" onClick={() => setDarkMode(!darkMode)} style={{ padding: "8px 12px", fontSize: 12, background: "transparent", border: `1px solid ${darkMode ? '#555' : '#CFC7B8'}`, color: textColor }}>
            {darkMode ? <IconSun color="#FFD700" /> : <IconMoon color="#555" />} {darkMode ? "Claro" : "Oscuro"}
          </button>
          <button className="cvb-btn" onClick={() => setShowLanding(true)} style={{ padding: "8px 12px", fontSize: 12, background: "transparent", border: `1px solid ${darkMode ? '#555' : '#CFC7B8'}`, color: textColor }}>
            ℹ️ Guía
          </button>
          <button className="cvb-btn" onClick={handleResetCV} style={{ padding: "8px 12px", fontSize: 12, background: "transparent", border: `1px solid ${darkMode ? '#555' : '#CFC7B8'}`, color: textColor }} title="Limpiar todos los campos">
            <IconTrash color={textColor} /> Borrar
          </button>
          {activeDoc === 'cv' && (
            <button className="cvb-btn" onClick={analyzeEntireCV} style={{ padding: "8px 14px", fontSize: 12, background: cardBg, border: `1px solid ${darkMode ? '#555' : '#CFC7B8'}`, color: textColor, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <IconSparkles color={palette.primary} /> Revisar IA
            </button>
          )}
          <button className="cvb-btn" onClick={handleDownloadPdf} disabled={downloading} style={{ padding: "8px 18px", fontSize: 12, background: palette.primary, color: "#fff", opacity: downloading ? 0.6 : 1 }}>
            ⬇ Descargar {activeDoc === 'cv' ? 'CV' : 'Carta'}
          </button>
        </div>
      </div>

      <div className="cvb-main-layout" style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 32, alignItems: "flex-start" }}>
        
        {/* TABS SELECTOR PARA CELULARES */}
        <div className="mobile-tabs">
          <button className={`mobile-tab-btn ${activeTabMobile === 'editor' ? 'active' : ''}`} onClick={() => setActiveTabMobile('editor')}>
            ✏️ Editar Datos
          </button>
          <button className={`mobile-tab-btn ${activeTabMobile === 'preview' ? 'active' : ''}`} onClick={() => setActiveTabMobile('preview')}>
            👁️ Vista Previa
          </button>
        </div>

        {/* PANEL IZQUIERDO */}
        <div className="panel-left-mobile" style={{ flex: "1 1 400px", minWidth: 320, maxWidth: 480 }}>
          
          {activeDoc === 'cv' && (
            <>
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: headingColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    📊 Completitud del CV
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: palette.primary }}>
                    {completeness}%
                  </span>
                </div>
                <div style={{ width: "100%", height: 8, background: darkMode ? "#333" : "#E2E4E2", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${completeness}%`, height: "100%", background: palette.primary, transition: "width 0.4s ease" }} />
                </div>
                <p style={{ fontSize: 11, color: darkMode ? "#888" : "#777", margin: "8px 0 0" }}>
                  {completeness < 50 ? "Agregá más secciones para enriquecer tu perfil." : completeness < 85 ? "¡Vas muy bien! Sumá tus logros o métricas clave." : "¡Excelente nivel de detalle!"}
                </p>
              </div>

              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, margin: "0 0 6px", color: headingColor, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
                  <IconTarget color={palette.primary} /> 🎯 Cazador de Palabras ATS
                </h3>
                <p style={{ fontSize: 11.5, color: darkMode ? "#999" : "#666", margin: "0 0 12px" }}>
                  Pegá el texto del aviso de empleo para verificar qué términos clave te faltan incluir.
                </p>
                
                <textarea 
                  className="cvb-input" 
                  rows={3} 
                  value={jobDescription} 
                  onChange={(e) => setJobDescription(e.target.value)} 
                  placeholder="Pegá aquí el texto de la oferta de trabajo..." 
                  style={{ marginBottom: 10 }}
                />
                
                <button className="cvb-btn" onClick={analyzeJobKeywords} disabled={loadingATS || !jobDescription.trim()} style={{ width: "100%", padding: "8px", fontSize: 12, background: palette.surface, color: palette.primary, border: `1px solid ${palette.accent}` }}>
                  {loadingATS ? "Analizando palabras..." : "Buscar Coincidencias"}
                </button>

                {atsAnalysis && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${cardBorder}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600 }}>Coincidencia con la oferta:</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: atsAnalysis.score > 60 ? "#4CAF50" : "#E53935" }}>{atsAnalysis.score}%</span>
                    </div>

                    {atsAnalysis.missing.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#E53935", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Te faltan agregar:</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {atsAnalysis.missing.map((w, i) => (
                            <span key={i} style={{ background: darkMode ? "#3A1E1E" : "#FDEAE8", color: "#C45B52", fontSize: 11, padding: "2px 6px", borderRadius: 4 }}>+ {w}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {atsAnalysis.matched.length > 0 && (
                      <div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#4CAF50", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Ya incluidas en tu CV:</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {atsAnalysis.matched.map((w, i) => (
                            <span key={i} style={{ background: darkMode ? "#1E3A1E" : "#E8F5E9", color: "#2E7D32", fontSize: 11, padding: "2px 6px", borderRadius: 4 }}>✓ {w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ESTILO Y COLOR */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, margin: "0 0 4px", color: headingColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>1. ESTILO GLOBAL</h3>
              <p style={{ fontSize: 11.5, color: darkMode ? "#999" : "#777", margin: 0 }}>Ajustá la paleta, tipografía y la plantilla de diseño (aplica al CV y la Carta).</p>
            </div>
            
            <label className="cvb-label">Paletas Armónicas</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
              {PRESET_PALETTES.map(p => (
                <div key={p.id} onClick={() => setPalette(p)} className="color-swatch" style={{ background: p.primary, border: palette.id === p.id ? `3px solid ${headingColor}` : "2px solid transparent" }} title={p.name} />
              ))}
            </div>

            <div style={{ marginBottom: 20, background: darkMode ? "#2D2D2D" : "#F9FAF8", border: `1px solid ${cardBorder}`, borderRadius: 10, padding: 12 }}>
              <label className="cvb-label" style={{ marginBottom: 6 }}>Selector Libre (Cualquier tono)</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input 
                  type="color" 
                  value={palette.primary.length === 7 ? palette.primary : "#9C4235"} 
                  onChange={(e) => setPalette(generateCustomPalette(e.target.value))} 
                  style={{ width: 42, height: 36, border: `1px solid ${cardBorder}`, borderRadius: 6, cursor: "pointer", padding: 2, background: cardBg }} 
                />
                <input 
                  className="cvb-input"
                  style={{ flex: 1, textTransform: "uppercase", fontWeight: 600, fontSize: 12 }}
                  value={palette.primary} 
                  onChange={(e) => setPalette(generateCustomPalette(e.target.value))} 
                  placeholder="#000000"
                />
              </div>
            </div>

            <label className="cvb-label">Tono de Fuente</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {FONTS.map(f => (
                <button key={f.id} onClick={() => setSelectedFont(f.id)} style={{ flex: 1, padding: "8px", fontSize: 12, borderRadius: 6, border: selectedFont === f.id ? `1px solid ${palette.primary}` : `1px solid ${cardBorder}`, background: selectedFont === f.id ? palette.surface : cardBg, color: selectedFont === f.id ? palette.primary : textColor, fontWeight: selectedFont === f.id ? 600 : 400, fontFamily: f.family }}>
                  {f.name}
                </button>
              ))}
            </div>

            <label className="cvb-label">Densidad de Hoja</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {DENSITIES.map(d => (
                <button key={d.id} onClick={() => setDensity(d.id)} style={{ flex: 1, padding: "8px", fontSize: 12, borderRadius: 6, border: density === d.id ? `1px solid ${palette.primary}` : `1px solid ${cardBorder}`, background: density === d.id ? palette.surface : cardBg, color: density === d.id ? palette.primary : textColor, fontWeight: density === d.id ? 600 : 400 }}>
                  {d.name}
                </button>
              ))}
            </div>

            <label className="cvb-label" style={{ marginTop: 16 }}>Plantilla de Diseño</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              {TEMPLATES.map((t) => (
                <div key={t.id} onClick={() => setTemplateId(t.id)} style={{ padding: "12px 14px", borderRadius: 8, background: templateId === t.id ? palette.surface : cardBg, border: templateId === t.id ? `1px solid ${palette.primary}` : `1px solid ${cardBorder}`, cursor: "pointer", transition: "all 0.2s" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: templateId === t.id ? palette.primary : headingColor }}>{t.name}</span>
                  <p style={{ fontSize: 11, margin: "4px 0 0", color: darkMode ? "#999" : "#777", fontWeight: 400 }}>{t.blurb}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="doc-switcher">
            <button className={`doc-switch-btn ${activeDoc === 'cv' ? 'active' : ''}`} onClick={() => setActiveDoc('cv')}>
              📄 Curriculum Vitae
            </button>
            <button className={`doc-switch-btn ${activeDoc === 'letter' ? 'active' : ''}`} onClick={() => setActiveDoc('letter')}>
              ✉️ Carta de Presentación
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            <Section title="2. Datos personales" hint="Esta información encabezará tanto tu CV como la Carta." visible={visible.photo} onToggle={() => setVisible(v => ({ ...v, photo: !v.photo }))} darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                {cv.personal.photo ? (
                  <img src={cv.personal.photo} alt="Perfil" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: `2px solid ${palette.primary}` }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: darkMode ? "#333" : "#F4F5F4", border: `1px dashed ${cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#AAA", fontWeight: 500 }}>FOTO</div>
                )}
                <div style={{ flex: 1 }}>
                  <label className="cvb-label">Subir Foto Profesional</label>
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files && e.target.files[0])} style={{ fontSize: 12, color: textColor }} />
                  {cv.personal.photo && (
                    <button onClick={() => updatePersonal("photo", "")} style={{ background: "none", border: "none", color: "#C45B52", fontSize: 11, cursor: "pointer", display: "block", marginTop: 4 }}>
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              <Field label="Nombre completo" value={cv.personal.name} onChange={(v) => updatePersonal("name", v)} />
              <Field label="Puesto / Titular" value={cv.personal.title} onChange={(v) => updatePersonal("title", v)} />
              <Row2><Field label="Email" value={cv.personal.email} onChange={(v) => updatePersonal("email", v)} /><Field label="Teléfono" value={cv.personal.phone} onChange={(v) => updatePersonal("phone", v)} /></Row2>
              <Row2><Field label="Ubicación" value={cv.personal.location} onChange={(v) => updatePersonal("location", v)} /><Field label="LinkedIn / URL" value={cv.personal.linkedin} onChange={(v) => updatePersonal("linkedin", v)} /></Row2>
            </Section>

            {activeDoc === 'cv' && (
              <>
                <Section title="3. Perfil Profesional" hint="Sintetizá en 3 o 4 líneas tus fortalezas, especialidad y valor principal." visible={visible.summary} onToggle={() => setVisible(v => ({ ...v, summary: !v.summary }))} darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                  <textarea className="cvb-input" rows={4} value={cv.summary} onChange={(e) => setCv((c) => ({ ...c, summary: e.target.value }))} placeholder="Breve descripción de tu valor profesional..." />
                </Section>

                <Section title="4. Experiencia Laboral" hint="Detallá puestos pasados iniciando cada logro con verbos de acción e indicadores." visible={visible.experience} onToggle={() => setVisible(v => ({ ...v, experience: !v.experience }))} onAdd={addExperience} addLabel="+ Puesto" darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                  {cv.experience.map((exp, i) => (
                    <div key={exp.id} style={{ border: `1px solid ${cardBorder}`, borderRadius: 8, padding: 16, marginBottom: 16, background: cardBg }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>Puesto #{i + 1}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="arrow-btn" onClick={() => moveExperience(i, "up")} disabled={i === 0}><IconArrowUp color={textColor} /></button>
                          <button className="arrow-btn" onClick={() => moveExperience(i, "down")} disabled={i === cv.experience.length - 1}><IconArrowDown color={textColor} /></button>
                        </div>
                      </div>
                      
                      <Row2><Field label="Puesto" value={exp.role} onChange={(v) => updateExperience(exp.id, "role", v)} /><Field label="Empresa" value={exp.company} onChange={(v) => updateExperience(exp.id, "company", v)} /></Row2>
                      
                      <div style={{ marginTop: 8, marginBottom: 12 }}>
                        <label className="cvb-label">Resumen del Rol / Descripción (Detalle libre)</label>
                        <textarea 
                          className="cvb-input" 
                          rows={2} 
                          value={exp.roleSummary || ""} 
                          onChange={(e) => updateExperience(exp.id, "roleSummary", e.target.value)} 
                          placeholder="Redactá en un párrafo el contexto y tus responsabilidades..." 
                        />
                      </div>

                      <Row2><Field label="Desde" value={exp.start} onChange={(v) => updateExperience(exp.id, "start", v)} /><Field label="Hasta" value={exp.end} onChange={(v) => updateExperience(exp.id, "end", v)} /></Row2>

                      <label className="cvb-label" style={{ marginTop: 16 }}>Logros y Resultados (Mejorar con IA)</label>
                      {exp.bullets.map((b, bi) => (
                        <div key={bi} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          <input className="cvb-input" value={b} onChange={(e) => updateBullet(exp.id, bi, e.target.value)} placeholder="Ej: Reduje costos un 10%..." />
                          <button className="cvb-btn" onClick={() => improveBulletAI(exp.id, bi, b)} style={{ background: palette.surface, color: palette.primary, padding: "0 12px" }} title="Optimizar frase con IA">
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
                    <h4 style={{ fontSize: 11, fontWeight: 700, margin: "0 0 8px", color: palette.primary, textTransform: "uppercase" }}>Verbos de acción sugeridos:</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ATS_VERBS.map((verb, i) => (
                        <span key={i} style={{ background: cardBg, border: `1px solid ${palette.accent}`, color: palette.secondary, fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 4 }}>{verb}</span>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section title="5. Educación" hint="Formación académica, títulos oficiales, cursos relevantes o certificaciones." visible={visible.education} onToggle={() => setVisible(v => ({ ...v, education: !v.education }))} onAdd={addEducation} addLabel="+ Estudio" darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                  {cv.education.map((ed, i) => (
                    <div key={ed.id} style={{ border: `1px solid ${cardBorder}`, borderRadius: 8, padding: 16, marginBottom: 16, background: cardBg }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>Estudio #{i + 1}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="arrow-btn" onClick={() => moveEducation(i, "up")} disabled={i === 0}><IconArrowUp color={textColor} /></button>
                          <button className="arrow-btn" onClick={() => moveEducation(i, "down")} disabled={i === cv.education.length - 1}><IconArrowDown color={textColor} /></button>
                        </div>
                      </div>
                      <Field label="Título / Carrera" value={ed.degree} onChange={(v) => updateEducation(ed.id, "degree", v)} />
                      <Field label="Institución" value={ed.institution} onChange={(v) => updateEducation(ed.id, "institution", v)} />
                      <Row2><Field label="Desde" value={ed.start} onChange={(v) => updateEducation(ed.id, "start", v)} /><Field label="Hasta" value={ed.end} onChange={(v) => updateEducation(ed.id, "end", v)} /></Row2>
                    </div>
                  ))}
                </Section>

                <Section title="Habilidades" hint="Competencias blandas y técnicas esenciales para tu puesto." visible={visible.skills} onToggle={() => setVisible(v => ({ ...v, skills: !v.skills }))} onAdd={addSkill} addLabel="+" darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                  {cv.skills.map((s) => (
                    <div key={s.id} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <input className="cvb-input" value={s.name} onChange={(e) => updateSkillName(s.id, e.target.value)} placeholder="Ej. Liderazgo de equipos" />
                      <button className="cvb-btn" onClick={() => removeSkill(s.id)} style={{ background: "#FDEAE8", color: "#C45B52", padding: "0 10px" }}>✕</button>
                    </div>
                  ))}
                </Section>

                <Section title="Herramientas / Software" hint="Programas, sistemas y tecnologías que manejás (Excel, SAP, etc.)." visible={visible.tools ?? true} onToggle={() => setVisible(v => ({ ...v, tools: !v.tools }))} onAdd={addTool} addLabel="+" darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                  {cv.tools.map((t) => (
                    <div key={t.id} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <input className="cvb-input" value={t.name} onChange={(e) => updateToolName(t.id, e.target.value)} placeholder="Ej. Excel, Power BI, SAP, Amadeus" />
                      <button className="cvb-btn" onClick={() => removeTool(t.id)} style={{ background: "#FDEAE8", color: "#C45B52", padding: "0 10px" }}>✕</button>
                    </div>
                  ))}
                </Section>

                <Section title="Idiomas" hint="Nivel de manejo oral y escrito de otras lenguas." visible={visible.languages} onToggle={() => setVisible(v => ({ ...v, languages: !v.languages }))} onAdd={addLanguage} addLabel="+" darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                  {cv.languages.map((l) => (
                    <div key={l.id} style={{ marginBottom: 12 }}>
                      <Row2>
                        <Field label="Idioma" value={l.name} onChange={(v) => updateLanguage(l.id, "name", v)} placeholder="Ej. Inglés" />
                        <Field label="Nivel" value={l.level} onChange={(v) => updateLanguage(l.id, "level", v)} placeholder="Ej. Avanzado C1" />
                      </Row2>
                    </div>
                  ))}
                </Section>

                <Section title="Secciones Personalizadas" hint="Agregá bloques libres con título a elección (Certificaciones, Voluntariados, Proyectos)." onAdd={addCustomSection} addLabel="+ Nueva Sección" darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                  {(cv.customSections || []).map((sec) => (
                    <div key={sec.id} style={{ border: `1px solid ${cardBorder}`, borderRadius: 8, padding: 16, marginBottom: 16, background: cardBg }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12, alignItems: "center" }}>
                        <input className="cvb-input" style={{ fontWeight: 700, color: palette.primary }} value={sec.title} onChange={(e) => updateCustomSectionTitle(sec.id, e.target.value)} placeholder="Título de la Sección" />
                        <button className="cvb-btn" onClick={() => removeCustomSection(sec.id)} style={{ background: "#FDEAE8", color: "#C45B52", padding: "0 12px", height: 38 }}>✕</button>
                      </div>

                      <label className="cvb-label">Elementos / Ítems</label>
                      {sec.items.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          <input className="cvb-input" value={item} onChange={(e) => updateCustomItem(sec.id, idx, e.target.value)} placeholder="Ej. Certificación Scrum Master (2024)..." />
                          <button className="cvb-btn" onClick={() => removeCustomItem(sec.id, idx)} style={{ background: "#FDEAE8", color: "#C45B52", padding: "0 10px" }}>✕</button>
                        </div>
                      ))}
                      <button className="cvb-btn" onClick={() => addCustomItem(sec.id)} style={{ background: "transparent", color: palette.primary, fontSize: 12, padding: "4px 0" }}>+ Agregar ítem</button>
                    </div>
                  ))}
                </Section>
              </>
            )}

            {activeDoc === 'letter' && (
              <>
                <Section title="Datos de Destino" hint="A quién va dirigida tu carta de presentación." darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                  <Row2>
                    <Field label="Fecha" value={coverLetter.date} onChange={(v) => setCoverLetter(c => ({...c, date: v}))} placeholder="Ej. 24 de Octubre de 2024" />
                    <Field label="Puesto al que aplicás" value={coverLetter.jobTitle} onChange={(v) => setCoverLetter(c => ({...c, jobTitle: v}))} placeholder="Ej. Analista de Marketing" />
                  </Row2>
                  <Row2>
                    <Field label="Empresa" value={coverLetter.companyName} onChange={(v) => setCoverLetter(c => ({...c, companyName: v}))} placeholder="Nombre de la empresa" />
                    <Field label="Dirigido a (Reclutador / Contacto - Opcional)" value={coverLetter.recipientName} onChange={(v) => setCoverLetter(c => ({...c, recipientName: v}))} placeholder="Ej. Lic. Carlos Gómez / Dpto RRHH" />
                  </Row2>
                </Section>

                <Section title="Cuerpo de la Carta" hint="Redactá los párrafos principales. El membrete y la despedida se generan solos." darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                  <div style={{ background: palette.surface, border: `1px solid ${palette.accent}`, padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <h4 style={{ fontSize: 12, color: palette.primary, margin: "0 0 6px", display: "flex", alignItems: "center" }}><IconSparkles color={palette.primary}/> Auto-redactar con IA</h4>
                    <p style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>Usaremos la experiencia que cargaste en la pestaña "CV" para escribir una carta a medida para este puesto.</p>
                    <button 
                      className="cvb-btn" 
                      onClick={handleGenerateCoverLetter} 
                      disabled={loadingAI === 'letter' || !coverLetter.jobTitle || !coverLetter.companyName}
                      style={{ padding: "8px 16px", fontSize: 12, background: palette.primary, color: "#fff", opacity: (loadingAI === 'letter' || !coverLetter.jobTitle) ? 0.6 : 1 }}
                    >
                      {loadingAI === 'letter' ? "Redactando carta..." : "Generar Carta con Inteligencia Artificial"}
                    </button>
                    {(!coverLetter.jobTitle || !coverLetter.companyName) && <span style={{ fontSize: 10, color: "#E53935", marginLeft: 10 }}>Completá el Puesto y Empresa arriba primero.</span>}
                  </div>

                  <textarea 
                    className="cvb-input" 
                    rows={14} 
                    value={coverLetter.body} 
                    onChange={(e) => setCoverLetter(c => ({...c, body: e.target.value}))} 
                    placeholder="Escribí aquí tu carta de presentación..." 
                    style={{ lineHeight: 1.6 }}
                  />
                </Section>
              </>
            )}
            
            <div style={{ textAlign: "center", padding: "24px 0 12px", color: darkMode ? "#999" : "#777", fontSize: 12.5, fontWeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
              Espero te sirva. Muchos éxitos. <IconHeart color={palette.secondary} />
            </div>

          </div>
        </div>

        {/* PANEL DERECHO: VISTA PREVIA DEL CV O CARTA */}
        <div className="panel-right-mobile" style={{ flex: "2 1 520px", minWidth: 320, overflowX: "auto", display: "flex", justifyContent: "center", paddingBottom: 60 }}>
          <div className="print-area-container">
            <div className="print-area-wrapper">
              <div className="page-break-indicator" data-html2canvas-ignore="true" />
              <div ref={printRef} className="print-area">
                {activeDoc === 'cv' ? (
                  <CVPreview data={cv} templateId={templateId} palette={palette} font={currentFontFamily} density={density} visible={visible} />
                ) : (
                  <CoverLetterPreview cvData={cv} letterData={coverLetter} templateId={templateId} palette={palette} font={currentFontFamily} density={density} />
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL IMPORTAR CV EXISTENTE */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: headingColor, display: "flex", alignItems: "center" }}>
                <IconUpload color={palette.primary} /> Importar Datos desde CV Existente
              </h2>
              <button onClick={() => setIsImportModalOpen(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888" }}>✕</button>
            </div>

            <p style={{ fontSize: 12.5, color: darkMode ? "#AAA" : "#666", marginBottom: 14 }}>
              Cargá un archivo <b>.pdf</b>, <b>.txt</b> o <b>.md</b> o pegá el texto completo de tu CV actual. La IA extraerá automáticamente tu información para completar los campos.
            </p>

            <div style={{ marginBottom: 12 }}>
              <label className="cvb-label">Subir Archivo (.PDF / .TXT / .MD)</label>
              <input type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} style={{ fontSize: 12, color: textColor }} />
            </div>

            <label className="cvb-label">o Pegá el Texto de tu CV:</label>
            <textarea 
              className="cvb-input" 
              rows={8} 
              value={rawCvText} 
              onChange={(e) => {
                setRawCvText(e.target.value);
                if (selectedFile) setSelectedFile(null);
              }} 
              placeholder="Nombre, Experiencia laboral, Educación, Habilidades..." 
              style={{ marginBottom: 16 }}
            />

            <button 
              className="cvb-btn" 
              onClick={handleExtractCvData} 
              disabled={loadingImport || (!rawCvText.trim() && !pdfBase64 && !selectedFile)} 
              style={{ 
                width: "100%", 
                padding: "12px", 
                background: (loadingImport || (!rawCvText.trim() && !pdfBase64 && !selectedFile)) ? "#888" : palette.primary, 
                color: "#fff", 
                fontSize: 13, 
                fontWeight: 600,
                cursor: (loadingImport || (!rawCvText.trim() && !selectedFile)) ? "not-allowed" : "pointer" 
              }}
            >
              {loadingImport ? "Procesando e integrando datos..." : "Extraer y Auto-completar CV"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL IA REVISIÓN */}
      {isAiModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAiModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: headingColor, display: "flex", alignItems: "center" }}>
                <IconSparkles color={palette.primary} size={18} /> Feedback del Reclutador
              </h2>
              <button onClick={() => setIsAiModalOpen(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888" }}>✕</button>
            </div>
            
            {aiFeedback === "ANALYZING" ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontSize: 14, color: palette.primary, fontWeight: 600 }}>Evaluando estructura y redacción...</p>
                <p style={{ fontSize: 12.5, color: "#888" }}>Esto toma unos segundos.</p>
              </div>
            ) : (
              <div className="ai-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(aiFeedback) }} style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 10 }} />
            )}
            
            {aiFeedback !== "ANALYZING" && (
              <button className="cvb-btn" onClick={() => setIsAiModalOpen(false)} style={{ width: "100%", padding: "12px", background: palette.primary, color: "#fff", marginTop: 24, fontSize: 13.5, fontWeight: 600 }}>
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
function Section({ title, hint, children, onAdd, addLabel, visible = true, onToggle, cardBg, cardBorder, headingColor, darkMode }) { 
  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 24, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: visible ? (hint ? 6 : 18) : 0, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onToggle && <button className="eye-btn" onClick={onToggle} title={visible ? "Ocultar" : "Mostrar"}>{visible ? <IconEye color="#AAA" /> : <IconEyeOff color="#AAA" />}</button>}
          <h3 style={{ fontSize: 12, fontWeight: 700, margin: 0, color: visible ? headingColor : "#AAA", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h3>
        </div>
        {visible && onAdd && <button className="cvb-btn" onClick={onAdd} style={{ background: darkMode ? "#333" : "#F4F5F4", color: darkMode ? "#DDD" : "#666", fontSize: 12, padding: "4px 10px" }}>{addLabel}</button>}
      </div>
      {visible && hint && <p style={{ fontSize: 11.5, color: darkMode ? "#999" : "#777", margin: "0 0 16px" }}>{hint}</p>}
      {visible && children}
    </div>
  ); 
}
function Field({ label, value, onChange, placeholder }) { return (<div style={{ marginBottom: 10, width: "100%" }}><label className="cvb-label">{label}</label><input className="cvb-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>); }
function Row2({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>{children}</div>; }
function skillNames(items) { return (items || []).filter((s) => s && s.name && s.name.trim()).map((s) => s.name.trim()); }

/* ==========================================================================
   VISTAS PREVIAS DE LA CARTA DE PRESENTACIÓN
   ========================================================================== */
function CoverLetterPreview({ cvData, letterData, templateId, palette, font, density }) {
  if (templateId === "nordico") return <LetterNordico cvData={cvData} letter={letterData} palette={palette} font={font} density={density} />;
  if (templateId === "bloque") return <LetterBloque cvData={cvData} letter={letterData} palette={palette} font={font} density={density} />;
  if (templateId === "ats") return <LetterATS cvData={cvData} letter={letterData} density={density} />;
  return <LetterNordico cvData={cvData} letter={letterData} palette={palette} font={font} density={density} />;
}

function LetterNordico({ cvData, letter, palette, font, density }) {
  const paddings = density === "compact" ? "40px 48px 30px" : density === "spacious" ? "64px 72px 48px" : "56px 64px 40px";
  const sectionGap = density === "compact" ? 22 : density === "spacious" ? 42 : 32;

  return (
    <div style={{ fontFamily: font, background: "#fff", color: palette.textDark, padding: paddings, boxSizing: "border-box", minHeight: "1123px" }}>
      <div className="page-block" style={{ borderBottom: `1px solid ${palette.accent}`, paddingBottom: density === "compact" ? 16 : 24, marginBottom: sectionGap }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {cvData.personal.photo && (
            <img src={cvData.personal.photo} alt="Perfil" style={{ width: density === "compact" ? 68 : 80, height: density === "compact" ? 68 : 80, borderRadius: "50%", objectFit: "cover" }} />
          )}
          <div>
            <h1 style={{ fontSize: density === "compact" ? 26 : 30, fontWeight: 600, margin: "0 0 4px", color: palette.textDark, letterSpacing: "-0.5px" }}>{cvData.personal.name || "Nombre Apellido"}</h1>
            <p style={{ fontSize: density === "compact" ? 14 : 15, color: palette.primary, fontWeight: 500, margin: "0 0 10px" }}>{cvData.personal.title}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: density === "compact" ? 11.5 : 12, color: palette.secondary, fontWeight: 400 }}>
              {cvData.personal.location && <span><IconPin color={palette.secondary} size={12} />{cvData.personal.location}</span>}
              {cvData.personal.phone && <span><IconPhone color={palette.secondary} size={12} />{cvData.personal.phone}</span>}
              {cvData.personal.email && <span><IconMail color={palette.secondary} size={12} />{cvData.personal.email}</span>}
              {cvData.personal.linkedin && <span><IconLink color={palette.secondary} size={12} />{cvData.personal.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: density === "compact" ? 12 : 13.5, lineHeight: 1.8, color: "#333", maxWidth: "90%", paddingTop: 20 }}>
        <p style={{ margin: "0 0 30px", color: "#666" }}>{letter.date}</p>
        
        {(letter.recipientName || letter.companyName || letter.jobTitle) && (
          <div style={{ marginBottom: 40 }}>
            {letter.recipientName && <p style={{ margin: "0 0 2px", fontWeight: 600, color: palette.textDark }}>{letter.recipientName}</p>}
            {letter.companyName && <p style={{ margin: "0 0 2px", fontWeight: 500 }}>{letter.companyName}</p>}
            {letter.jobTitle && <p style={{ margin: 0, color: palette.secondary }}>{`Ref: Postulación para ${letter.jobTitle}`}</p>}
          </div>
        )}

        <div style={{ whiteSpace: "pre-wrap" }}>
          {letter.body}
        </div>
      </div>
    </div>
  );
}

function LetterBloque({ cvData, letter, palette, font, density }) {
  const paddingsLeft = density === "compact" ? "36px 24px" : "48px 32px";
  const paddingsRight = density === "compact" ? "36px 30px" : "48px 40px";
  const sectionGap = density === "compact" ? 24 : 36;

  return (
    <div style={{ fontFamily: font, display: "flex", minHeight: "1123px", background: "#fff" }}>
      <div style={{ width: "32%", background: palette.surface, padding: paddingsLeft, color: palette.textDark, display: "flex", flexDirection: "column" }}>
        <div className="page-block" style={{ textAlign: "center", marginBottom: sectionGap }}>
          {cvData.personal.photo && (
             <img src={cvData.personal.photo} alt="Perfil" style={{ width: density === "compact" ? 80 : 100, height: density === "compact" ? 80 : 100, borderRadius: "50%", objectFit: "cover", marginBottom: 14 }} />
          )}
          <h1 style={{ fontSize: density === "compact" ? 18 : 20, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.1 }}>{cvData.personal.name || "Nombre Apellido"}</h1>
          <p style={{ fontSize: 12, fontWeight: 500, color: palette.primary, margin: 0 }}>{cvData.personal.title}</p>
        </div>

        <div className="page-block" style={{ marginBottom: sectionGap }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: palette.secondary, borderBottom: `1px solid ${palette.accent}`, paddingBottom: 6, marginBottom: 10, letterSpacing: "1px" }}>Contacto</h3>
          {cvData.personal.location && <p style={{ fontSize: 11, margin: "0 0 6px" }}><IconPin color={palette.secondary} size={12} />{cvData.personal.location}</p>}
          {cvData.personal.phone && <p style={{ fontSize: 11, margin: "0 0 6px" }}><IconPhone color={palette.secondary} size={12} />{cvData.personal.phone}</p>}
          {cvData.personal.email && <p style={{ fontSize: 11, margin: "0 0 6px", wordBreak: "break-all" }}><IconMail color={palette.secondary} size={12} />{cvData.personal.email}</p>}
          {cvData.personal.linkedin && <p style={{ fontSize: 11, margin: "0 0 6px", wordBreak: "break-all" }}><IconLink color={palette.secondary} size={12} />{cvData.personal.linkedin}</p>}
        </div>
      </div>
      
      <div style={{ width: "68%", padding: paddingsRight, color: palette.textDark }}>
        <div style={{ fontSize: density === "compact" ? 12 : 13.5, lineHeight: 1.8, color: "#333", paddingTop: 10 }}>
          <p style={{ margin: "0 0 30px", color: "#666" }}>{letter.date}</p>
          
          {(letter.recipientName || letter.companyName || letter.jobTitle) && (
            <div style={{ marginBottom: 40, borderLeft: `3px solid ${palette.accent}`, paddingLeft: 14 }}>
              {letter.recipientName && <p style={{ margin: "0 0 2px", fontWeight: 600, color: palette.textDark }}>{letter.recipientName}</p>}
              {letter.companyName && <p style={{ margin: "0 0 2px", fontWeight: 500 }}>{letter.companyName}</p>}
              {letter.jobTitle && <p style={{ margin: 0, color: palette.secondary }}>{`Asunto: Aplicación para ${letter.jobTitle}`}</p>}
            </div>
          )}

          <div style={{ whiteSpace: "pre-wrap" }}>
            {letter.body}
          </div>
        </div>
      </div>
    </div>
  );
}

function LetterATS({ cvData, letter, density }) {
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#222", padding: density === "compact" ? "40px" : "60px", fontSize: density === "compact" ? 12 : 13, lineHeight: 1.6, background: "#fff", minHeight: "1123px" }}>
      <div className="page-block" style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: density === "compact" ? 16 : 18, fontWeight: 700, margin: "0 0 4px", textAlign: "center", textTransform: "uppercase" }}>{cvData.personal.name || "NOMBRE APELLIDO"}</h1>
        <p style={{ margin: "0 0 6px", textAlign: "center", fontSize: 12.5 }}>{cvData.personal.title}</p>
        <p style={{ margin: "0 0 16px", fontSize: 11, textAlign: "center", color: "#555" }}>{[cvData.personal.location, cvData.personal.email, cvData.personal.phone, cvData.personal.linkedin].filter(Boolean).join(" | ")}</p>
        <hr style={{ border: "none", borderBottom: "1px solid #000" }} />
      </div>
      
      <div style={{ marginBottom: 30 }}>
        <p style={{ margin: "0 0 20px" }}>{letter.date}</p>
        {letter.recipientName && <p style={{ margin: "0 0 2px", fontWeight: 600 }}>{letter.recipientName}</p>}
        {letter.companyName && <p style={{ margin: "0 0 2px" }}>{letter.companyName}</p>}
        {letter.jobTitle && <p style={{ margin: 0, fontStyle: "italic" }}>{`Ref: ${letter.jobTitle}`}</p>}
      </div>

      <div style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}>
        {letter.body}
      </div>
    </div>
  );
}

/* ==========================================================================
   VISTAS PREVIAS DEL CURRICULUM VITAE
   ========================================================================== */
function CVPreview({ data, templateId, palette, font, density, visible }) {
  if (templateId === "nordico") return <TplNordico data={data} palette={palette} font={font} density={density} visible={visible} />;
  if (templateId === "bloque") return <TplBloque data={data} palette={palette} font={font} density={density} visible={visible} />;
  if (templateId === "ats") return <TplATS data={data} density={density} visible={visible} />;
  return <TplNordico data={data} palette={palette} font={font} density={density} visible={visible} />;
}

/* 1. NÓRDICO MINIMALISTA */
function TplNordico({ data, palette, font, density, visible }) {
  const toolsList = skillNames(data.tools);
  const skillsList = skillNames(data.skills);
  const showTools = (visible.tools ?? true) && toolsList.length > 0;
  const customSecs = (data.customSections || []).filter(s => s.title && s.items.some(Boolean));

  const paddings = density === "compact" ? "40px 48px 30px" : density === "spacious" ? "64px 72px 48px" : "56px 64px 40px";
  const sectionGap = density === "compact" ? 22 : density === "spacious" ? 42 : 32;
  const itemGap = density === "compact" ? 14 : density === "spacious" ? 28 : 24;

  return (
    <div style={{ fontFamily: font, background: "#fff", color: palette.textDark, padding: paddings, boxSizing: "border-box" }}>
      <div className="page-block" style={{ borderBottom: `1px solid ${palette.accent}`, paddingBottom: density === "compact" ? 16 : 24, marginBottom: sectionGap }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {visible.photo && data.personal.photo && (
            <img src={data.personal.photo} alt="Perfil" style={{ width: density === "compact" ? 68 : 80, height: density === "compact" ? 68 : 80, borderRadius: "50%", objectFit: "cover" }} />
          )}
          <div>
            <h1 style={{ fontSize: density === "compact" ? 26 : 30, fontWeight: 600, margin: "0 0 4px", color: palette.textDark, letterSpacing: "-0.5px" }}>{data.personal.name || "Nombre Apellido"}</h1>
            <p style={{ fontSize: density === "compact" ? 14 : 15, color: palette.primary, fontWeight: 500, margin: "0 0 10px" }}>{data.personal.title}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: density === "compact" ? 11.5 : 12, color: palette.secondary, fontWeight: 400 }}>
              {data.personal.location && <span><IconPin color={palette.secondary} size={12} />{data.personal.location}</span>}
              {data.personal.phone && <span><IconPhone color={palette.secondary} size={12} />{data.personal.phone}</span>}
              {data.personal.email && <span><IconMail color={palette.secondary} size={12} />{data.personal.email}</span>}
              {data.personal.linkedin && <span><IconLink color={palette.secondary} size={12} />{data.personal.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      {visible.summary && data.summary && (
        <div className="page-block" style={{ marginBottom: sectionGap }}>
          <p style={{ fontSize: density === "compact" ? 12 : 13, lineHeight: 1.6, margin: 0, fontWeight: 400, color: "#4A4A4A" }}>{data.summary}</p>
        </div>
      )}

      {visible.experience && (
        <div style={{ marginBottom: sectionGap }}>
          <h2 className="page-header-avoid" style={{ fontSize: 12.5, fontWeight: 600, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: density === "compact" ? 14 : 20, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>
            Experiencia Profesional
          </h2>
          {data.experience.map((e) => (
            <div key={e.id} className="exp-item" style={{ marginBottom: itemGap }}>
              <div className="page-header-avoid" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <h3 style={{ fontSize: density === "compact" ? 13.5 : 14.5, fontWeight: 600, margin: 0 }}>{e.role} <span style={{ fontWeight: 400, color: palette.secondary }}>— {e.company}</span></h3>
                <span style={{ fontSize: 11.5, color: "#888", fontWeight: 400 }}>{e.start} – {e.end || "Actualidad"}</span>
              </div>
              {e.roleSummary && (
                <p style={{ fontSize: density === "compact" ? 11.5 : 12, lineHeight: 1.5, color: "#555", margin: "4px 0 6px", fontStyle: "italic" }}>
                  {e.roleSummary}
                </p>
              )}
              <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: density === "compact" ? 11.5 : 12.5, lineHeight: 1.5, color: "#555" }}>
                {e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: density === "compact" ? 2 : 4 }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: density === "compact" ? 32 : 48 }}>
        <div style={{ flex: 1 }}>
          {visible.education && (
            <div className="page-block" style={{ marginBottom: sectionGap }}>
              <h2 className="page-header-avoid" style={{ fontSize: 12.5, fontWeight: 600, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Educación</h2>
              {data.education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: density === "compact" ? 8 : 12 }}>
                  <h3 style={{ fontSize: density === "compact" ? 12.5 : 13, fontWeight: 600, margin: "0 0 2px" }}>{ed.degree}</h3>
                  <p style={{ fontSize: 11.5, color: palette.secondary, margin: "0 0 2px", fontWeight: 400 }}>{ed.institution}</p>
                  <p style={{ fontSize: 10.5, color: "#888", margin: 0, fontWeight: 400 }}>{ed.start} - {ed.end}</p>
                </div>
              ))}
            </div>
          )}

          {customSecs.map((cs) => (
            <div key={cs.id} className="page-block" style={{ marginBottom: itemGap }}>
              <h2 className="page-header-avoid" style={{ fontSize: 12.5, fontWeight: 600, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>{cs.title}</h2>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: density === "compact" ? 11.5 : 12, lineHeight: 1.5, color: "#555" }}>
                {cs.items.filter(Boolean).map((item, idx) => <li key={idx} style={{ marginBottom: 3 }}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        
        <div style={{ flex: 1 }}>
          {visible.skills && skillsList.length > 0 && (
            <div className="page-block" style={{ marginBottom: density === "compact" ? 16 : 24 }}>
              <h2 className="page-header-avoid" style={{ fontSize: 12.5, fontWeight: 600, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Habilidades</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skillsList.map((s, i) => (
                  <span key={i} style={{ background: palette.surface, color: palette.textDark, fontSize: density === "compact" ? 11 : 11.5, padding: "3px 8px", borderRadius: 4, border: `1px solid ${palette.accent}`, fontWeight: 400 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {showTools && (
            <div className="page-block" style={{ marginBottom: density === "compact" ? 16 : 24 }}>
              <h2 className="page-header-avoid" style={{ fontSize: 12.5, fontWeight: 600, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Herramientas & Software</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {toolsList.map((t, i) => (
                  <span key={i} style={{ background: "#FFF", color: palette.textDark, fontSize: density === "compact" ? 11 : 11.5, padding: "3px 8px", borderRadius: 4, border: `1px solid ${palette.secondary}50`, fontWeight: 400 }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {visible.languages && (
            <div className="page-block">
              <h2 className="page-header-avoid" style={{ fontSize: 12.5, fontWeight: 600, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Idiomas</h2>
              {data.languages.filter(l=>l.name).map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: density === "compact" ? 11.5 : 12, marginBottom: 4, color: "#555" }}>
                  <span style={{ fontWeight: 500 }}>{l.name}</span>
                  <span style={{ fontWeight: 400 }}>{l.level}</span>
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
function TplBloque({ data, palette, font, density, visible }) {
  const toolsList = skillNames(data.tools);
  const skillsList = skillNames(data.skills);
  const showTools = (visible.tools ?? true) && toolsList.length > 0;
  const customSecs = (data.customSections || []).filter(s => s.title && s.items.some(Boolean));

  const paddingsLeft = density === "compact" ? "36px 24px" : "48px 32px";
  const paddingsRight = density === "compact" ? "36px 30px" : "48px 40px";
  const sectionGap = density === "compact" ? 24 : 36;

  return (
    <div style={{ fontFamily: font, display: "flex", minHeight: "1123px", background: "#fff" }}>
      <div style={{ width: "32%", background: palette.surface, padding: paddingsLeft, color: palette.textDark, display: "flex", flexDirection: "column" }}>
        <div className="page-block" style={{ textAlign: "center", marginBottom: sectionGap }}>
          {visible.photo && data.personal.photo && (
             <img src={data.personal.photo} alt="Perfil" style={{ width: density === "compact" ? 80 : 100, height: density === "compact" ? 80 : 100, borderRadius: "50%", objectFit: "cover", marginBottom: 14 }} />
          )}
          <h1 style={{ fontSize: density === "compact" ? 18 : 20, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.1 }}>{data.personal.name || "Nombre Apellido"}</h1>
          <p style={{ fontSize: 12, fontWeight: 500, color: palette.primary, margin: 0 }}>{data.personal.title}</p>
        </div>

        <div className="page-block" style={{ marginBottom: sectionGap }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: palette.secondary, borderBottom: `1px solid ${palette.accent}`, paddingBottom: 6, marginBottom: 10, letterSpacing: "1px" }}>Contacto</h3>
          {data.personal.location && <p style={{ fontSize: 11, margin: "0 0 6px" }}><IconPin color={palette.secondary} size={12} />{data.personal.location}</p>}
          {data.personal.phone && <p style={{ fontSize: 11, margin: "0 0 6px" }}><IconPhone color={palette.secondary} size={12} />{data.personal.phone}</p>}
          {data.personal.email && <p style={{ fontSize: 11, margin: "0 0 6px", wordBreak: "break-all" }}><IconMail color={palette.secondary} size={12} />{data.personal.email}</p>}
          {data.personal.linkedin && <p style={{ fontSize: 11, margin: "0 0 6px", wordBreak: "break-all" }}><IconLink color={palette.secondary} size={12} />{data.personal.linkedin}</p>}
        </div>

        {visible.education && (
          <div className="page-block" style={{ marginBottom: sectionGap }}>
            <h3 className="page-header-avoid" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: palette.secondary, borderBottom: `1px solid ${palette.accent}`, paddingBottom: 6, marginBottom: 10, letterSpacing: "1px" }}>Educación</h3>
            {data.education.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11.5, fontWeight: 600, margin: "0 0 2px" }}>{ed.degree}</p>
                <p style={{ fontSize: 10.5, color: palette.secondary, margin: "0 0 2px" }}>{ed.institution}</p>
                <p style={{ fontSize: 10, color: "#888", margin: 0 }}>{ed.start} - {ed.end}</p>
              </div>
            ))}
          </div>
        )}

        {visible.languages && (
          <div className="page-block">
            <h3 className="page-header-avoid" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: palette.secondary, borderBottom: `1px solid ${palette.accent}`, paddingBottom: 6, marginBottom: 10, letterSpacing: "1px" }}>Idiomas</h3>
            {data.languages.filter(l=>l.name).map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{l.name}</span>
                <span>{l.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ width: "68%", padding: paddingsRight, color: palette.textDark }}>
        {visible.summary && data.summary && (
          <div className="page-block" style={{ marginBottom: sectionGap }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", marginBottom: 10, letterSpacing: "1px" }}>Perfil Profesional</h2>
            <p style={{ fontSize: density === "compact" ? 12 : 13, lineHeight: 1.6, color: "#4A4A4A", margin: 0 }}>{data.summary}</p>
          </div>
        )}

        {visible.experience && (
          <div style={{ marginBottom: sectionGap }}>
            <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", marginBottom: 16, letterSpacing: "1px" }}>Experiencia</h2>
            {data.experience.map((e) => (
              <div key={e.id} className="exp-item" style={{ marginBottom: density === "compact" ? 14 : 20 }}>
                <h3 className="page-header-avoid" style={{ fontSize: density === "compact" ? 13.5 : 14.5, fontWeight: 600, margin: "0 0 2px" }}>{e.role}</h3>
                <div className="page-header-avoid" style={{ fontSize: 12, color: palette.secondary, fontWeight: 500, marginBottom: 4 }}>{e.company} <span style={{ color: "#888", fontWeight: 400, marginLeft: 6 }}>| {e.start} – {e.end || "Actualidad"}</span></div>
                {e.roleSummary && (
                  <p style={{ fontSize: density === "compact" ? 11.5 : 12, lineHeight: 1.5, color: "#555", margin: "4px 0 6px", fontStyle: "italic" }}>
                    {e.roleSummary}
                  </p>
                )}
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: density === "compact" ? 11.5 : 12.5, lineHeight: 1.5, color: "#555" }}>
                  {e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 3 }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {visible.skills && skillsList.length > 0 && (
          <div className="page-block" style={{ marginBottom: 20 }}>
            <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", marginBottom: 12, letterSpacing: "1px" }}>Habilidades</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skillsList.map((s, i) => (
                <span key={i} style={{ border: `1px solid ${palette.accent}`, color: palette.textDark, fontSize: 11, fontWeight: 400, padding: "3px 8px", borderRadius: 4 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {showTools && (
          <div className="page-block" style={{ marginBottom: 20 }}>
            <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", marginBottom: 12, letterSpacing: "1px" }}>Herramientas & Software</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {toolsList.map((t, i) => (
                <span key={i} style={{ background: palette.surface, border: `1px solid ${palette.accent}`, color: palette.textDark, fontSize: 11, fontWeight: 400, padding: "3px 8px", borderRadius: 4 }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {customSecs.map((cs) => (
          <div key={cs.id} className="page-block" style={{ marginBottom: 20 }}>
            <h2 className="page-header-avoid" style={{ fontSize: 13, fontWeight: 700, color: palette.primary, textTransform: "uppercase", marginBottom: 12, letterSpacing: "1px" }}>{cs.title}</h2>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: density === "compact" ? 11.5 : 12.5, lineHeight: 1.5, color: "#555" }}>
              {cs.items.filter(Boolean).map((item, idx) => <li key={idx} style={{ marginBottom: 3 }}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 3. ATS ESTRICTO */
function TplATS({ data, density, visible }) {
  const toolsList = skillNames(data.tools);
  const skillsList = skillNames(data.skills);
  const showTools = (visible.tools ?? true) && toolsList.length > 0;
  const customSecs = (data.customSections || []).filter(s => s.title && s.items.some(Boolean));

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#222", padding: density === "compact" ? "30px" : "40px", fontSize: density === "compact" ? 12 : 13, lineHeight: 1.5, background: "#fff" }}>
      <div className="page-block">
        <h1 style={{ fontSize: density === "compact" ? 16 : 18, fontWeight: 700, margin: "0 0 4px", textAlign: "center", textTransform: "uppercase" }}>{data.personal.name || "NOMBRE APELLIDO"}</h1>
        <p style={{ margin: "0 0 6px", textAlign: "center", fontSize: 12.5 }}>{data.personal.title}</p>
        <p style={{ margin: "0 0 16px", fontSize: 11, textAlign: "center", color: "#555" }}>{[data.personal.location, data.personal.email, data.personal.phone, data.personal.linkedin].filter(Boolean).join(" | ")}</p>
      </div>
      
      {visible.summary && data.summary && (
        <div className="page-block">
          <h2 style={{ fontSize: 11.5, fontWeight: 700, borderBottom: "1px solid #222", paddingBottom: 3, marginBottom: 6, textTransform: "uppercase" }}>Resumen Profesional</h2>
          <p style={{ marginBottom: 12 }}>{data.summary}</p>
        </div>
      )}
      
      {visible.experience && (
        <div style={{ marginBottom: 12 }}>
          <h2 className="page-header-avoid" style={{ fontSize: 11.5, fontWeight: 700, borderBottom: "1px solid #222", paddingBottom: 3, marginBottom: 6, textTransform: "uppercase" }}>Experiencia Laboral</h2>
          {data.experience.map((e) => (
            <div key={e.id} className="exp-item" style={{ marginBottom: 10 }}>
              <div className="page-header-avoid" style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, marginBottom: 2 }}><span>{e.role}, {e.company}</span><span>{e.start} - {e.end || "Actualidad"}</span></div>
              {e.roleSummary && <p style={{ margin: "2px 0 4px", fontSize: 11.5, fontStyle: "italic", color: "#444" }}>{e.roleSummary}</p>}
              <ul style={{ margin: 0, paddingLeft: 18 }}>{e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 2 }}>{b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      
      {visible.education && (
        <div className="page-block" style={{ marginBottom: 12 }}>
          <h2 className="page-header-avoid" style={{ fontSize: 11.5, fontWeight: 700, borderBottom: "1px solid #222", paddingBottom: 3, marginBottom: 6, marginTop: 12, textTransform: "uppercase" }}>Educación</h2>
          {data.education.map((ed) => (<p key={ed.id} style={{ margin: "0 0 4px", fontWeight: 600 }}>{ed.degree}, {ed.institution} <span style={{ fontWeight: 400 }}>({ed.start} - {ed.end})</span></p>))}
        </div>
      )}
      
      {(visible.skills || showTools || visible.languages) && (
        <div className="page-block" style={{ marginTop: 12 }}>
          <h2 style={{ fontSize: 11.5, fontWeight: 700, borderBottom: "1px solid #222", paddingBottom: 3, marginBottom: 6, textTransform: "uppercase" }}>Habilidades, Herramientas e Idiomas</h2>
          {visible.skills && skillsList.length > 0 && <p style={{ margin: "0 0 4px" }}><strong>Habilidades:</strong> {skillsList.join(", ")}</p>}
          {showTools && <p style={{ margin: "0 0 4px" }}><strong>Herramientas / Software:</strong> {toolsList.join(", ")}</p>}
          {visible.languages && <p style={{ margin: "0 0 4px" }}><strong>Idiomas:</strong> {data.languages.filter(l=>l.name).map(l => `${l.name} (${l.level})`).join(", ")}</p>}
        </div>
      )}

      {customSecs.map((cs) => (
        <div key={cs.id} className="page-block" style={{ marginTop: 12 }}>
          <h2 style={{ fontSize: 11.5, fontWeight: 700, borderBottom: "1px solid #222", paddingBottom: 3, marginBottom: 6, textTransform: "uppercase" }}>{cs.title}</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {cs.items.filter(Boolean).map((item, idx) => <li key={idx} style={{ marginBottom: 2 }}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

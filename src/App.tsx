// @ts-nocheck
import { useState, useEffect, useRef } from "react";

/* ---------- HELPERS ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const emptyExperience = () => ({ id: uid(), company: "", role: "", start: "", end: "", current: false, bullets: [""] });
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
  if (cv.experience.some(e => e.role && e.company && e.bullets.some(b => b.length > 5))) score += 25;
  if (cv.education.some(ed => ed.degree && ed.institution)) score += 10;
  if (cv.skills.some(s => s.name.trim())) score += 10;
  if (cv.tools.some(t => t.name.trim())) score += 10;
  return Math.min(score, 100);
}

const STORAGE_KEY = "cv-builder-state";

/* ---------- ÍCONOS VECTORIALES ---------- */
const IconHome = ({ size = 16, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>);
const IconFile = ({ size = 16, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const IconTimer = ({ size = 16, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const IconCheck = ({ size = 16, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>);
const IconWallet = ({ size = 16, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>);
const IconMoon = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>);
const IconSun = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>);
const IconSparkles = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M3 12h18M15.5 8.5l4-4M8.5 15.5l-4 4M8.5 8.5l-4-4M15.5 15.5l4 4"/></svg>);
const IconPin = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
const IconPhone = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
const IconMail = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const IconLink = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>);
const IconEye = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconEyeOff = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>);
const IconArrowUp = ({ color = "currentColor", size = 12 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>);
const IconArrowDown = ({ color = "currentColor", size = 12 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>);
const IconPalette = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><circle cx="13.5" cy="6.5" r=".5" fill={color}/><circle cx="17.5" cy="10.5" r=".5" fill={color}/><circle cx="8.5" cy="7.5" r=".5" fill={color}/><circle cx="6.5" cy="12.5" r=".5" fill={color}/><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.21-.64-1.67-.38-.43-.6-.98-.6-1.58 0-1.38 1.12-2.5 2.5-2.5H18c2.21 0 4-1.79 4-4 0-4.97-4.48-9-10-9z"/></svg>);
const IconTrash = ({ color = "#888", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const IconTarget = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>);
const IconUpload = ({ color = "currentColor", size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>);
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

const DENSITIES = [
  { id: "compact", name: "Compacto" },
  { id: "normal", name: "Normal" },
  { id: "spacious", name: "Espacioso" },
];

const ATS_VERBS = ["Lideré", "Optimicé", "Implementé", "Reduje", "Coordiné", "Aumenté", "Diseñé", "Negocié", "Gestioné", "Desarrollé"];

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

/* ---------- APP PRINCIPAL (NUBE / OS) ---------- */
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'cv' | 'focus' | 'habits' | 'finance'
  
  // Estados Globales (Compartidos en la nube)
  const [darkMode, setDarkMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Estados CV Builder
  const [cv, setCv] = useState(emptyCV());
  const [templateId, setTemplateId] = useState("nordico");
  const [palette, setPalette] = useState(PRESET_PALETTES[0]); 
  const [selectedFont, setSelectedFont] = useState("nunito");
  const [density, setDensity] = useState("normal");
  const [visible, setVisible] = useState({ photo: true, summary: true, experience: true, education: true, skills: true, languages: true, tools: true });
  const [downloading, setDownloading] = useState(false);
  
  // Estados Módulos Extra (ATS/IA)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rawCvText, setRawCvText] = useState("");
  const [loadingImport, setLoadingImport] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [loadingATS, setLoadingATS] = useState(false);
  const [loadingAI, setLoadingAI] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");

  // Estados Focus (Pomodoro)
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusMode, setFocusMode] = useState("Trabajo"); // Trabajo, Descanso

  const saveTimer = useRef(null);
  const printRef = useRef(null);

  useEffect(() => { document.title = "Impulso Cloud"; }, []);

  // Cargar datos al inicio
  useEffect(() => {
    try {
      const res = localStorage.getItem(STORAGE_KEY);
      if (res) {
        const parsed = JSON.parse(res);
        if (parsed.cv) setCv({ ...emptyCV(), ...parsed.cv, personal: { ...emptyCV().personal, ...parsed.cv.personal }, skills: normalizeSkills(parsed.cv.skills), tools: normalizeTools(parsed.cv.tools), customSections: parsed.cv.customSections || [] });
        if (parsed.templateId) setTemplateId(parsed.templateId);
        if (parsed.palette) setPalette(parsed.palette);
        if (parsed.selectedFont) setSelectedFont(parsed.selectedFont);
        if (parsed.density) setDensity(parsed.density);
        if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
        if (parsed.visible) setVisible({ photo: true, summary: true, experience: true, education: true, skills: true, languages: true, tools: true, ...parsed.visible });
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  // Guardar datos al cambiar
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ cv, templateId, palette, selectedFont, density, darkMode, visible })); } catch (e) {} }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [cv, templateId, palette, selectedFont, density, darkMode, visible, loaded]);

  // Lógica Pomodoro (Impulso Focus)
  useEffect(() => {
    let interval = null;
    if (isFocusActive && focusTime > 0) {
      interval = setInterval(() => setFocusTime(time => time - 1), 1000);
    } else if (focusTime === 0) {
      setIsFocusActive(false);
      alert(`¡Tiempo de ${focusMode} terminado!`);
    }
    return () => clearInterval(interval);
  }, [isFocusActive, focusTime, focusMode]);

  const toggleTimer = () => setIsFocusActive(!isFocusActive);
  const resetTimer = (mins, mode) => { setIsFocusActive(false); setFocusTime(mins * 60); setFocusMode(mode); };
  const formatTime = (secs) => { const m = Math.floor(secs / 60); const s = secs % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };

  // Funciones CV Builder
  const handleResetCV = () => { if (window.confirm("¿Borrar todo y empezar un CV desde cero?")) { localStorage.removeItem(STORAGE_KEY); setCv(emptyCV()); setAtsAnalysis(null); setJobDescription(""); } };
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
  const addCustomSection = () => setCv(c => ({ ...c, customSections: [...(c.customSections || []), emptyCustomSection()] }));
  const removeCustomSection = (id) => setCv(c => ({ ...c, customSections: (c.customSections || []).filter(s => s.id !== id) }));
  const updateCustomSectionTitle = (id, title) => setCv(c => ({ ...c, customSections: (c.customSections || []).map(s => s.id === id ? { ...s, title } : s) }));
  const addCustomItem = (secId) => setCv(c => ({ ...c, customSections: (c.customSections || []).map(s => s.id === secId ? { ...s, items: [...s.items, ""] } : s) }));
  const updateCustomItem = (secId, idx, val) => setCv(c => ({ ...c, customSections: (c.customSections || []).map(s => s.id === secId ? { ...s, items: s.items.map((item, i) => i === idx ? val : item) } : s) }));
  const removeCustomItem = (secId, idx) => setCv(c => ({ ...c, customSections: (c.customSections || []).map(s => s.id === secId ? { ...s, items: s.items.filter((_, i) => i !== idx) } : s) }));

  /* EXTRACCIÓN AUTOMÁTICA DE DATOS CON IA DESDE TEXTO COPIADO O PDF */
  const handleExtractCvData = async () => {
    if (!rawCvText.trim()) return;
    setLoadingImport(true);
    try {
      const prompt = `Analizá el siguiente texto de un CV y extraé todos los datos estructurados.
      Devolvé ÚNICAMENTE un JSON estricto con esta forma:
      {
        "personal": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "" },
        "summary": "",
        "experience": [{ "role": "", "company": "", "start": "", "end": "", "bullets": [""] }],
        "education": [{ "degree": "", "institution": "", "start": "", "end": "" }],
        "skills": [{ "name": "" }],
        "tools": [{ "name": "" }],
        "languages": [{ "name": "", "level": "" }]
      }
      Si algún campo no figura, dejalo como string vacío.
      Texto a analizar: "${rawCvText.replace(/"/g, "'")}"`;

      const responseText = await callClaude(prompt);
      const parsed = JSON.parse(responseText);

      setCv({
        ...emptyCV(),
        personal: { ...emptyCV().personal, ...(parsed.personal || {}) },
        summary: parsed.summary || "",
        experience: parsed.experience && parsed.experience.length ? parsed.experience.map(e => ({ id: uid(), role: e.role || "", company: e.company || "", start: e.start || "", end: e.end || "", bullets: e.bullets && e.bullets.length ? e.bullets : [""] })) : [emptyExperience()],
        education: parsed.education && parsed.education.length ? parsed.education.map(ed => ({ id: uid(), degree: ed.degree || "", institution: ed.institution || "", start: ed.start || "", end: ed.end || "" })) : [emptyEducation()],
        skills: parsed.skills && parsed.skills.length ? parsed.skills.map(s => ({ id: uid(), name: typeof s === 'string' ? s : s.name || "" })) : [emptySkill()],
        tools: parsed.tools && parsed.tools.length ? parsed.tools.map(t => ({ id: uid(), name: typeof t === 'string' ? t : t.name || "" })) : [emptyTool()],
        languages: parsed.languages && parsed.languages.length ? parsed.languages.map(l => ({ id: uid(), name: l.name || "", level: l.level || "" })) : [emptyLanguage()],
        customSections: []
      });

      setIsImportModalOpen(false);
      setRawCvText("");
    } catch (e) {
      alert("No pudimos estructurar automáticamente todos los datos. Podés ajustar los campos manualmente.");
    }
    setLoadingImport(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setLoadingImport(true);
      try {
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(" ") + "\n";
        }
        setRawCvText(fullText);
      } catch (err) {
        alert("No se pudo extraer el texto del PDF. Copialo manualmente.");
      }
      setLoadingImport(false);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => setRawCvText(event.target.result);
      reader.readAsText(file);
    }
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [0.35, 0, 0.35, 0],
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
  const completeness = calculateCompleteness(cv);

  /* ESTILOS DINÁMICOS MODO OSCURO (LA NUBE) */
  const osBg = darkMode ? "#121212" : "#F4F5F4";
  const sidebarBg = darkMode ? "#1E1E1E" : "#E8E2D5";
  const headerBg = darkMode ? "#1E1E1E" : "#E8E2D5";
  const cardBg = darkMode ? "#242424" : "#FFFFFF";
  const cardBorder = darkMode ? "#333333" : "#EAECE8";
  const textColor = darkMode ? "#E0E0E0" : "#4A4A4A";
  const headingColor = darkMode ? "#FFFFFF" : "#2B2B2B";
  const inputBg = darkMode ? "#2D2D2D" : "#FCFCFC";
  const inputBorder = darkMode ? "#404040" : "#E2E4E2";

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: osBg, height: "100vh", display: "flex", color: textColor, transition: "background 0.3s, color 0.3s", overflow: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow: hidden; }
        .cvb-btn { cursor:pointer; border:none; border-radius:6px; font-weight:500; transition:all .2s; display:inline-flex; align-items:center; justify-content:center; }
        .cvb-btn:hover { opacity:.85; transform: translateY(-1px); }
        .cvb-input { width:100%; border:1px solid ${inputBorder}; border-radius:6px; padding:10px 12px; font-size:13.5px; font-family:'Inter',sans-serif; background: ${inputBg}; color: ${textColor}; font-weight:400; }
        .cvb-input:focus { outline:2px solid ${palette.primary}; outline-offset:1px; background: ${darkMode ? '#333' : '#fff'}; }
        .cvb-label { font-size:11px; font-weight:600; color:${darkMode ? '#A0A0A0' : '#6B726B'}; text-transform:uppercase; letter-spacing:.05em; display:block; margin-bottom:6px; }
        
        .sidebar-item { padding: 12px 16px; margin: 4px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13.5px; font-weight: 600; color: ${textColor}; transition: all 0.2s; }
        .sidebar-item:hover { background: ${darkMode ? '#333' : '#D8D0C0'}; }
        .sidebar-item.active { background: ${palette.primary}; color: #fff; }

        .print-area-wrapper { position: relative; }
        .print-area { width: 794px; min-height: 1123px; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin: 0 auto; }
        .page-break-indicator { position: absolute; top: 1123px; left: -10px; right: -10px; border-top: 2px dashed #E53935; pointer-events: none; z-index: 10; }
        .page-break-indicator::after { content: "── FIN PÁGINA 1 (A4) ──"; position: absolute; right: 20px; top: -9px; background: #E53935; color: white; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
        .page-block { break-inside: avoid !important; page-break-inside: avoid !important; padding-top: 14px; margin-top: 6px; }
        .page-header-avoid { break-after: avoid !important; page-break-after: avoid !important; }

        .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: ${cardBg}; border: 1px solid ${cardBorder}; padding: 32px; border-radius: 16px; width: 90%; maxWidth: 520px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }

        .scrollable-area::-webkit-scrollbar { width: 8px; }
        .scrollable-area::-webkit-scrollbar-track { background: transparent; }
        .scrollable-area::-webkit-scrollbar-thumb { background: ${darkMode ? '#444' : '#CCC'}; border-radius: 4px; }

        @media (max-width: 768px) {
          .os-sidebar { display: none !important; } /* A futuro: menú hamburguesa */
          .os-content { width: 100% !important; }
        }
      `}</style>

      {/* SIDEBAR NAVEGACIÓN (ESTILO NUBE) */}
      <div className="os-sidebar" style={{ width: 250, background: sidebarBg, borderRight: `1px solid ${headerBorder}`, display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: headingColor, display: "flex", alignItems: "center" }}>
            Impulso <span style={{ color: palette.primary, marginLeft: 6 }}>Cloud</span>
          </h1>
          <p style={{ fontSize: 11, color: darkMode ? '#888' : '#777', margin: "4px 0 0" }}>Tu espacio de crecimiento.</p>
        </div>

        <div style={{ flex: 1 }}>
          <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <IconHome size={18} /> Inicio (Dashboard)
          </div>
          <div style={{ padding: "16px 24px 8px", fontSize: 11, fontWeight: 700, color: darkMode ? '#666' : '#999', textTransform: "uppercase", letterSpacing: "1px" }}>Carrera</div>
          <div className={`sidebar-item ${activeTab === 'cv' ? 'active' : ''}`} onClick={() => setActiveTab('cv')}>
            <IconFile size={18} /> Creador de CV
          </div>
          <div style={{ padding: "16px 24px 8px", fontSize: 11, fontWeight: 700, color: darkMode ? '#666' : '#999', textTransform: "uppercase", letterSpacing: "1px" }}>Lifestyle</div>
          <div className={`sidebar-item ${activeTab === 'focus' ? 'active' : ''}`} onClick={() => setActiveTab('focus')}>
            <IconTimer size={18} /> Impulso Focus
          </div>
          <div className={`sidebar-item ${activeTab === 'habits' ? 'active' : ''}`} onClick={() => setActiveTab('habits')}>
            <IconCheck size={18} /> Hábitos (Próximamente)
          </div>
          <div className={`sidebar-item ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
            <IconWallet size={18} /> Finanzas (Próximamente)
          </div>
        </div>

        <div style={{ padding: "0 24px" }}>
          <button className="cvb-btn" onClick={() => setDarkMode(!darkMode)} style={{ width: "100%", padding: "10px", fontSize: 12, background: cardBg, border: `1px solid ${cardBorder}`, color: textColor }}>
            {darkMode ? <IconSun color="#FFD700" /> : <IconMoon color="#555" />} Modo {darkMode ? "Claro" : "Oscuro"}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="os-content scrollable-area" style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        
        {/* --- VISTA DASHBOARD (INICIO) --- */}
        {activeTab === 'dashboard' && (
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: headingColor }}>
              ¡Buen día, {cv.personal.name ? cv.personal.name.split(' ')[0] : 'creador'}! 👋
            </h2>
            <p style={{ fontSize: 14, color: darkMode ? '#999' : '#666', marginBottom: 40 }}>
              Bienvenido a tu espacio personal. Así viene tu progreso hoy:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              
              {/* Widget CV */}
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: headingColor }}><IconFile color={palette.primary}/> Tu Currículum</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: palette.primary }}>{completeness}% Completo</span>
                </div>
                <div style={{ width: "100%", height: 8, background: darkMode ? "#333" : "#E2E4E2", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ width: `${completeness}%`, height: "100%", background: palette.primary }} />
                </div>
                <button onClick={() => setActiveTab('cv')} className="cvb-btn" style={{ width: "100%", padding: "10px", background: palette.surface, color: palette.primary, fontSize: 13 }}>Continuar Editando</button>
              </div>

              {/* Widget Focus */}
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: headingColor }}><IconTimer color={palette.primary}/> Impulso Focus</div>
                  {isFocusActive && <span style={{ fontSize: 11, background: "#E8F5E9", color: "#2E7D32", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>En Curso</span>}
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: headingColor, textAlign: "center", fontFamily: "monospace", margin: "10px 0 20px" }}>
                  {formatTime(focusTime)}
                </div>
                <button onClick={() => setActiveTab('focus')} className="cvb-btn" style={{ width: "100%", padding: "10px", background: darkMode ? '#333' : '#F4F5F4', color: textColor, fontSize: 13 }}>Abrir Temporizador</button>
              </div>

              {/* Widget Extras */}
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px", color: headingColor }}>Pronto: Hábitos y Finanzas</h3>
                <p style={{ fontSize: 12, color: darkMode ? '#999' : '#666', margin: 0 }}>Estamos preparando nuevas herramientas para que gestiones tu rutina diaria.</p>
              </div>

            </div>
          </div>
        )}

        {/* --- VISTA FOCUS (POMODORO) --- */}
        {activeTab === 'focus' && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: headingColor }}>Impulso Focus 🧘‍♂️</h2>
              <p style={{ fontSize: 14, color: darkMode ? '#999' : '#666' }}>Mejorá tu productividad alternando ciclos de trabajo y descanso.</p>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 24, padding: "40px 60px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 32 }}>
                <button onClick={() => resetTimer(25, "Trabajo")} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: focusMode === "Trabajo" ? palette.primary : "transparent", color: focusMode === "Trabajo" ? "#fff" : textColor, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>🧠 Enfoque (25m)</button>
                <button onClick={() => resetTimer(5, "Descanso Corto")} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: focusMode === "Descanso Corto" ? "#4CAF50" : "transparent", color: focusMode === "Descanso Corto" ? "#fff" : textColor, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>☕ Corto (5m)</button>
                <button onClick={() => resetTimer(15, "Descanso Largo")} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: focusMode === "Descanso Largo" ? "#2196F3" : "transparent", color: focusMode === "Descanso Largo" ? "#fff" : textColor, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>🚶‍♂️ Largo (15m)</button>
              </div>

              <div style={{ fontSize: 80, fontWeight: 800, fontFamily: "monospace", color: headingColor, margin: "0 0 40px", fontVariantNumeric: "tabular-nums" }}>
                {formatTime(focusTime)}
              </div>

              <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                <button className="cvb-btn" onClick={toggleTimer} style={{ padding: "16px 48px", fontSize: 16, fontWeight: 700, background: isFocusActive ? "#E53935" : palette.primary, color: "#fff", borderRadius: 30 }}>
                  {isFocusActive ? "Pausar" : "Comenzar"}
                </button>
                <button className="cvb-btn" onClick={() => resetTimer(focusMode === "Trabajo" ? 25 : focusMode === "Descanso Corto" ? 5 : 15, focusMode)} style={{ padding: "16px", background: darkMode ? '#333' : '#EAECE8', color: textColor, borderRadius: "50%", width: 52, height: 52 }} title="Reiniciar">
                  ↻
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA COMING SOON --- */}
        {(activeTab === 'habits' || activeTab === 'finance') && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>{activeTab === 'habits' ? '✅' : '💰'}</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px", color: headingColor }}>Herramienta en Construcción</h2>
            <p style={{ fontSize: 15, color: darkMode ? '#999' : '#666', maxWidth: 400 }}>
              Estamos diseñando una experiencia increíble para que gestiones tus {activeTab === 'habits' ? 'rutinas diarias y hábitos saludables' : 'finanzas personales y ahorros'} desde la misma nube.
            </p>
          </div>
        )}

        {/* --- VISTA CV BUILDER (COMPLETA) --- */}
        {activeTab === 'cv' && (
          <div style={{ padding: "20px 32px" }}>
            
            {/* Header Interno CV */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, background: cardBg, padding: "16px 24px", borderRadius: 12, border: `1px solid ${cardBorder}` }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: headingColor }}>Editor de Currículum</h2>
                <p style={{ fontSize: 12, color: darkMode ? '#999' : '#777', margin: "4px 0 0" }}>Diseñá, analizá y descargá tu perfil.</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="cvb-btn" onClick={() => setIsImportModalOpen(true)} style={{ padding: "8px 14px", fontSize: 12, background: palette.surface, color: palette.primary, border: `1px solid ${palette.accent}` }}><IconUpload color={palette.primary}/> Importar CV Viejo</button>
                <button className="cvb-btn" onClick={handleDownloadPdf} disabled={downloading} style={{ padding: "8px 18px", fontSize: 12, background: palette.primary, color: "#fff", opacity: downloading ? 0.6 : 1 }}>⬇ Descargar PDF</button>
              </div>
            </div>

            {/* Layout Dividido CV */}
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              
              {/* PANEL IZQUIERDO CV */}
              <div style={{ flex: "1 1 400px", minWidth: 320, maxWidth: 480 }}>
                
                {/* ESTILO Y COLOR */}
                <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 700, margin: "0 0 4px", color: headingColor, textTransform: "uppercase" }}>1. ESTILO</h3>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    {PRESET_PALETTES.map(p => (
                      <div key={p.id} onClick={() => setPalette(p)} className="color-swatch" style={{ background: p.primary, border: palette.id === p.id ? `3px solid ${headingColor}` : "2px solid transparent" }} />
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                    {TEMPLATES.map((t) => (
                      <div key={t.id} onClick={() => setTemplateId(t.id)} style={{ padding: "10px 14px", borderRadius: 8, background: templateId === t.id ? palette.surface : cardBg, border: templateId === t.id ? `1px solid ${palette.primary}` : `1px solid ${cardBorder}`, cursor: "pointer" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: templateId === t.id ? palette.primary : headingColor }}>{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FORMULARIO DE DATOS */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <Section title="2. Datos personales" visible={visible.photo} onToggle={() => setVisible(v => ({ ...v, photo: !v.photo }))} darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                      {cv.personal.photo ? <img src={cv.personal.photo} alt="Perfil" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 60, height: 60, borderRadius: "50%", background: darkMode ? "#333" : "#F4F5F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#AAA" }}>FOTO</div>}
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files && e.target.files[0])} style={{ fontSize: 12, color: textColor }} />
                    </div>
                    <Field label="Nombre completo" value={cv.personal.name} onChange={(v) => updatePersonal("name", v)} />
                    <Field label="Puesto / Titular" value={cv.personal.title} onChange={(v) => updatePersonal("title", v)} />
                    <Row2><Field label="Email" value={cv.personal.email} onChange={(v) => updatePersonal("email", v)} /><Field label="Teléfono" value={cv.personal.phone} onChange={(v) => updatePersonal("phone", v)} /></Row2>
                    <Row2><Field label="Ubicación" value={cv.personal.location} onChange={(v) => updatePersonal("location", v)} /><Field label="LinkedIn / URL" value={cv.personal.linkedin} onChange={(v) => updatePersonal("linkedin", v)} /></Row2>
                  </Section>

                  <Section title="3. Perfil Profesional" visible={visible.summary} onToggle={() => setVisible(v => ({ ...v, summary: !v.summary }))} darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                    <textarea className="cvb-input" rows={4} value={cv.summary} onChange={(e) => setCv((c) => ({ ...c, summary: e.target.value }))} placeholder="Breve descripción..." />
                  </Section>

                  <Section title="4. Experiencia Laboral" visible={visible.experience} onToggle={() => setVisible(v => ({ ...v, experience: !v.experience }))} onAdd={addExperience} addLabel="+ Puesto" darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
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
                        <Row2><Field label="Desde" value={exp.start} onChange={(v) => updateExperience(exp.id, "start", v)} /><Field label="Hasta" value={exp.end} onChange={(v) => updateExperience(exp.id, "end", v)} /></Row2>
                        
                        <label className="cvb-label" style={{ marginTop: 12 }}>Logros</label>
                        {exp.bullets.map((b, bi) => (
                          <div key={bi} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                            <input className="cvb-input" value={b} onChange={(e) => updateBullet(exp.id, bi, e.target.value)} placeholder="Ej: Reduje costos..." />
                            <button className="cvb-btn" onClick={() => removeBullet(exp.id, bi)} style={{ background: "#FDEAE8", color: "#C45B52", padding: "0 12px" }}>✕</button>
                          </div>
                        ))}
                        <button className="cvb-btn" onClick={() => addBullet(exp.id)} style={{ background: "transparent", color: palette.primary, fontSize: 12, padding: "4px 0" }}>+ Agregar logro</button>
                      </div>
                    ))}
                  </Section>

                  <Section title="5. Educación" visible={visible.education} onToggle={() => setVisible(v => ({ ...v, education: !v.education }))} onAdd={addEducation} addLabel="+ Estudio" darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                    {cv.education.map((ed, i) => (
                      <div key={ed.id} style={{ border: `1px solid ${cardBorder}`, borderRadius: 8, padding: 16, marginBottom: 16, background: cardBg }}>
                        <Field label="Título / Carrera" value={ed.degree} onChange={(v) => updateEducation(ed.id, "degree", v)} />
                        <Field label="Institución" value={ed.institution} onChange={(v) => updateEducation(ed.id, "institution", v)} />
                        <Row2><Field label="Desde" value={ed.start} onChange={(v) => updateEducation(ed.id, "start", v)} /><Field label="Hasta" value={ed.end} onChange={(v) => updateEducation(ed.id, "end", v)} /></Row2>
                      </div>
                    ))}
                  </Section>

                  <Section title="Habilidades" visible={visible.skills} onToggle={() => setVisible(v => ({ ...v, skills: !v.skills }))} onAdd={addSkill} addLabel="+" darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} headingColor={headingColor}>
                    {cv.skills.map((s) => (
                      <div key={s.id} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        <input className="cvb-input" value={s.name} onChange={(e) => updateSkillName(s.id, e.target.value)} placeholder="Ej. Liderazgo de equipos" />
                        <button className="cvb-btn" onClick={() => removeSkill(s.id)} style={{ background: "#FDEAE8", color: "#C45B52", padding: "0 10px" }}>✕</button>
                      </div>
                    ))}
                  </Section>

                </div>
              </div>

              {/* PANEL DERECHO CV (VISTA PREVIA FIJA) */}
              <div style={{ flex: "2 1 520px", position: "sticky", top: 20, maxHeight: "calc(100vh - 40px)", overflowY: "auto", paddingBottom: 60, display: "flex", justifyContent: "center" }}>
                <div className="print-area-wrapper">
                  <div className="page-break-indicator" data-html2canvas-ignore="true" />
                  <div ref={printRef} className="print-area">
                    <CVPreview data={cv} templateId={templateId} palette={palette} font={currentFontFamily} density={density} visible={visible} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL IMPORTAR CV */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: headingColor, display: "flex", alignItems: "center" }}><IconUpload color={palette.primary} /> Importar Datos CV</h2>
              <button onClick={() => setIsImportModalOpen(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888" }}>✕</button>
            </div>
            <p style={{ fontSize: 12.5, color: darkMode ? "#AAA" : "#666", marginBottom: 14 }}>Cargá un <b>.pdf</b>, <b>.txt</b> o pegá tu CV. La IA extraerá los datos.</p>
            <input type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} style={{ fontSize: 12, color: textColor, marginBottom: 16, display: "block" }} />
            <textarea className="cvb-input" rows={6} value={rawCvText} onChange={(e) => setRawCvText(e.target.value)} placeholder="O pegá el texto aquí..." style={{ marginBottom: 16 }} />
            <button className="cvb-btn" onClick={handleExtractCvData} disabled={loadingImport || !rawCvText.trim()} style={{ width: "100%", padding: "12px", background: palette.primary, color: "#fff", fontSize: 13, fontWeight: 600 }}>
              {loadingImport ? "Procesando..." : "Extraer y Auto-completar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMarkdown(text) {
  return text.replace(/### (.*?)\n/g, '<h3>$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
}

function Section({ title, hint, children, onAdd, addLabel, visible = true, onToggle, cardBg, cardBorder, headingColor, darkMode }) { 
  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 24, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: visible ? (hint ? 6 : 18) : 0, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onToggle && <button className="eye-btn" onClick={onToggle}>{visible ? <IconEye color="#AAA" /> : <IconEyeOff color="#AAA" />}</button>}
          <h3 style={{ fontSize: 12, fontWeight: 700, margin: 0, color: visible ? headingColor : "#AAA", textTransform: "uppercase" }}>{title}</h3>
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

/* ---------- ENRUTADOR DE PLANTILLAS ---------- */
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
          {visible.photo && data.personal.photo && <img src={data.personal.photo} alt="Perfil" style={{ width: density === "compact" ? 68 : 80, height: density === "compact" ? 68 : 80, borderRadius: "50%", objectFit: "cover" }} />}
          <div>
            <h1 style={{ fontSize: density === "compact" ? 26 : 30, fontWeight: 600, margin: "0 0 4px", color: palette.textDark, letterSpacing: "-0.5px" }}>{data.personal.name || "Nombre Apellido"}</h1>
            <p style={{ fontSize: density === "compact" ? 14 : 15, color: palette.primary, fontWeight: 500, margin: "0 0 10px" }}>{data.personal.title}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: density === "compact" ? 11.5 : 12, color: palette.secondary, fontWeight: 400 }}>
              {data.personal.location && <span><IconPin color={palette.secondary} size={12} />{data.personal.location}</span>}
              {data.personal.phone && <span><IconPhone color={palette.secondary} size={12} />{data.personal.phone}</span>}
              {data.personal.email && <span><IconMail color={palette.secondary} size={12} />{data.personal.email}</span>}
            </div>
          </div>
        </div>
      </div>
      {visible.summary && data.summary && <div className="page-block" style={{ marginBottom: sectionGap }}><p style={{ fontSize: density === "compact" ? 12 : 13, lineHeight: 1.6, margin: 0, fontWeight: 400, color: "#4A4A4A" }}>{data.summary}</p></div>}
      {visible.experience && (
        <div style={{ marginBottom: sectionGap }}>
          <h2 className="page-header-avoid" style={{ fontSize: 12.5, fontWeight: 600, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: density === "compact" ? 14 : 20, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Experiencia Profesional</h2>
          {data.experience.map((e) => (
            <div key={e.id} className="page-block" style={{ marginBottom: itemGap }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}><h3 style={{ fontSize: density === "compact" ? 13.5 : 14.5, fontWeight: 600, margin: 0 }}>{e.role} <span style={{ fontWeight: 400, color: palette.secondary }}>— {e.company}</span></h3><span style={{ fontSize: 11.5, color: "#888", fontWeight: 400 }}>{e.start} – {e.end || "Actualidad"}</span></div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: density === "compact" ? 11.5 : 12.5, lineHeight: 1.5, color: "#555" }}>{e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: density === "compact" ? 2 : 4 }}>{b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: density === "compact" ? 32 : 48 }}>
        <div style={{ flex: 1 }}>
          {visible.education && (
            <div className="page-block" style={{ marginBottom: sectionGap }}>
              <h2 className="page-header-avoid" style={{ fontSize: 12.5, fontWeight: 600, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Educación</h2>
              {data.education.map((ed) => (<div key={ed.id} style={{ marginBottom: density === "compact" ? 8 : 12 }}><h3 style={{ fontSize: density === "compact" ? 12.5 : 13, fontWeight: 600, margin: "0 0 2px" }}>{ed.degree}</h3><p style={{ fontSize: 11.5, color: palette.secondary, margin: "0 0 2px", fontWeight: 400 }}>{ed.institution}</p><p style={{ fontSize: 10.5, color: "#888", margin: 0, fontWeight: 400 }}>{ed.start} - {ed.end}</p></div>))}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {visible.skills && skillsList.length > 0 && (
            <div className="page-block" style={{ marginBottom: density === "compact" ? 16 : 24 }}>
              <h2 className="page-header-avoid" style={{ fontSize: 12.5, fontWeight: 600, color: palette.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, paddingBottom: 6, borderBottom: `1px solid ${palette.accent}` }}>Habilidades</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{skillsList.map((s, i) => <span key={i} style={{ background: palette.surface, color: palette.textDark, fontSize: density === "compact" ? 11 : 11.5, padding: "3px 8px", borderRadius: 4, border: `1px solid ${palette.accent}` }}>{s}</span>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* 2. BLOQUE SUTIL */
function TplBloque({ data, palette, font, density, visible }) {
  const skillsList = skillNames(data.skills);
  return (
    <div style={{ fontFamily: font, display: "flex", minHeight: "1123px", background: "#fff" }}>
      <div style={{ width: "32%", background: palette.surface, padding: "48px 32px", color: palette.textDark }}>
        <div className="page-block" style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>{data.personal.name || "Nombre"}</h1>
          <p style={{ fontSize: 12, fontWeight: 500, color: palette.primary, margin: 0 }}>{data.personal.title}</p>
        </div>
      </div>
      <div style={{ width: "68%", padding: "48px 40px", color: palette.textDark }}>
        {visible.summary && data.summary && <div className="page-block" style={{ marginBottom: 36 }}><p style={{ fontSize: 13, lineHeight: 1.65 }}>{data.summary}</p></div>}
      </div>
    </div>
  );
}

/* 3. ATS ESTRICTO */
function TplATS({ data, density, visible }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#222", padding: "40px", fontSize: 13, background: "#fff" }}>
      <div className="page-block"><h1 style={{ fontSize: 18, textAlign: "center" }}>{data.personal.name}</h1><p style={{ textAlign: "center" }}>{data.personal.title}</p></div>
    </div>
  );
}

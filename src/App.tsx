// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";

/* ---------- helpers ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const emptyExperience = () => ({ id: uid(), company: "", role: "", start: "", end: "", current: false, bullets: [""] });
const emptyEducation = () => ({ id: uid(), institution: "", degree: "", start: "", end: "" });
const emptyLanguage = () => ({ id: uid(), name: "", level: "" });
const emptySkill = () => ({ id: uid(), name: "", level: 4 });
const emptyCV = () => ({
  personal: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", photo: "" },
  summary: "",
  experience: [emptyExperience()],
  education: [emptyEducation()],
  skills: [emptySkill()],
  languages: [emptyLanguage()],
});

function normalizeSkills(skills) {
  if (!skills || !skills.length) return [emptySkill()];
  return skills.map((s) => typeof s === "string" ? { id: uid(), name: s, level: 4 } : { id: s.id || uid(), name: s.name || "", level: s.level || 4 });
}

const STORAGE_KEY = "cv-builder-state";

/* ---------- PLANTILLAS ---------- */
const TEMPLATES = [
  { id: "ejecutivo", name: "Ejecutivo Moderno", blurb: "Cabecera de color sólido, estructura a 2 columnas limpia." },
  { id: "impacto", name: "Impacto Lateral", blurb: "Columna de color, fondo gris perla elegante." },
  { id: "tarjetas", name: "Tarjetas Corporativas", blurb: "Fondo tintado suave con experiencias en bloques blancos." },
  { id: "ats", name: "ATS Estricto", blurb: "Blanco y negro puro. Ideal para portales automáticos." },
];

const FONTS = [
  { id: "nunito", name: "Moderna", family: "'Nunito', sans-serif" },
  { id: "inter", name: "Técnica", family: "'Inter', sans-serif" },
  { id: "merriweather", name: "Corporativa / Serif", family: "'Merriweather', serif" },
];

const ATS_VERBS = ["Lideré", "Optimicé", "Implementé", "Reduje", "Coordiné", "Aumenté", "Diseñé", "Negocié"];

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Nunito:wght@400;600;700;800&display=swap');";

/* ---------- llamada a la API ---------- */
async function callClaude(prompt) {
  const API_KEY = import.meta.env?.VITE_ANTHROPIC_API_KEY || ""; 
  if (!API_KEY) throw new Error("Falta configurar la API Key para IA");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-3-5-sonnet-20240620", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Error de la API");
  const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
  return text.replace(/```json|```/g, "").trim();
}

/* ---------- APP PRINCIPAL ---------- */
export default function App() {
  const [cv, setCv] = useState(emptyCV());
  const [templateId, setTemplateId] = useState("ejecutivo");
  const [accentColor, setAccentColor] = useState("#1E3A8A"); 
  const [selectedFont, setSelectedFont] = useState("nunito");
  
  // Control de Visibilidad de Secciones (👁️)
  const [visible, setVisible] = useState({ photo: true, summary: true, experience: true, education: true, skills: true, languages: true });
  
  const [downloading, setDownloading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);
  const printRef = useRef(null);

  useEffect(() => { document.title = "Impulso CV Premium"; }, []);

  useEffect(() => {
    try {
      const res = localStorage.getItem(STORAGE_KEY);
      if (res) {
        const parsed = JSON.parse(res);
        if (parsed.cv) setCv({ ...emptyCV(), ...parsed.cv, personal: { ...emptyCV().personal, ...parsed.cv.personal }, skills: normalizeSkills(parsed.cv.skills) });
        if (parsed.templateId) setTemplateId(parsed.templateId);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
        if (parsed.selectedFont) setSelectedFont(parsed.selectedFont);
        if (parsed.visible) setVisible(parsed.visible);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ cv, templateId, accentColor, selectedFont, visible })); } catch (e) {} }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [cv, templateId, accentColor, selectedFont, visible, loaded]);

  const updatePersonal = (field, value) => setCv((c) => ({ ...c, personal: { ...c.personal, [field]: value } }));
  
  /* Reordenar experiencias (⬆️ ⬇️) */
  const moveExperience = (index, direction) => {
    const newExp = [...cv.experience];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newExp.length) return;
    [newExp[index], newExp[targetIdx]] = [newExp[targetIdx], newExp[index]];
    setCv((c) => ({ ...c, experience: newExp }));
  };

  /* Reordenar educación (⬆️ ⬇️) */
  const moveEducation = (index, direction) => {
    const newEd = [...cv.education];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newEd.length) return;
    [newEd[index], newEd[targetIdx]] = [newEd[targetIdx], newEd[index]];
    setCv((c) => ({ ...c, education: newEd }));
  };

  const updateExperience = (id, field, value) => setCv((c) => ({ ...c, experience: c.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)) }));
  const updateBullet = (expId, idx, value) => setCv((c) => ({ ...c, experience: c.experience.map((e) => e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => (i === idx ? value : b)) } : e ) }));
  const addBullet = (expId) => setCv((c) => ({ ...c, experience: c.experience.map((e) => (e.id === expId ? { ...e, bullets: [...e.bullets, ""] } : e)) }));
  const removeBullet = (expId, idx) => setCv((c) => ({ ...c, experience: c.experience.map((e) => e.id === expId ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) } : e ) }));
  const addExperience = () => setCv((c) => ({ ...c, experience: [...c.experience, emptyExperience()] }));
  const removeExperience = (id) => setCv((c) => ({ ...c, experience: c.experience.filter((e) => e.id !== id) }));

  const updateEducation = (id, field, value) => setCv((c) => ({ ...c, education: c.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)) }));
  const addEducation = () => setCv((c) => ({ ...c, education: [...c.education, emptyEducation()] }));
  const removeEducation = (id) => setCv((c) => ({ ...c, education: c.education.filter((e) => e.id !== id) }));

  const updateSkillName = (id, value) => setCv((c) => ({ ...c, skills: c.skills.map((s) => (s.id === id ? { ...s, name: value } : s)) }));
  const addSkill = () => setCv((c) => ({ ...c, skills: [...c.skills, emptySkill()] }));
  const removeSkill = (id) => setCv((c) => ({ ...c, skills: c.skills.filter((s) => s.id !== id) }));

  const updateLanguage = (id, field, value) => setCv((c) => ({ ...c, languages: c.languages.map((l) => (l.id === id ? { ...l, [field]: value } : l)) }));
  const addLanguage = () => setCv((c) => ({ ...c, languages: [...c.languages, emptyLanguage()] }));

  /* Mejora con IA de texto */
  const improveBulletAI = async (expId, idx, text) => {
    if (!text.trim()) return;
    setLoadingAI(`${expId}-${idx}`);
    try {
      const prompt = `Reescribí esta frase para un CV profesional usando lenguaje de impacto y apto para filtros ATS. Devolvé ÚNICAMENTE la frase mejorada, sin explicaciones ni comillas. Frase: "${text}"`;
      const improved = await callClaude(prompt);
      updateBullet(expId, idx, improved);
    } catch (e) {
      alert("Configurá tu VITE_ANTHROPIC_API_KEY para usar la IA.");
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
      filename: (cv.personal.name ? cv.personal.name.trim().replace(/\s+/g, "_") : "Mi_CV_Premium") + ".pdf",
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => setDownloading(false)).catch(() => setDownloading(false));
  };

  const PRESET_COLORS = ["#1E3A8A", "#0F172A", "#1B4332", "#7F1D1D", "#5B21B6", "#000000", "#4B5563"];
  const currentFontFamily = FONTS.find(f => f.id === selectedFont)?.family || "'Inter', sans-serif";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F3F4F6", minHeight: "100vh" }}>
      <style>{`
        ${FONT_IMPORT}
        .cvb-btn { cursor:pointer; border:none; border-radius:6px; font-weight:600; transition:all .2s; }
        .cvb-btn:hover { opacity:.85; transform: translateY(-1px); }
        .cvb-input { width:100%; border:1px solid #D1D5DB; border-radius:6px; padding:10px 12px; font-size:14px; font-family:'Inter',sans-serif; background: #F9FAFB; }
        .cvb-input:focus { outline:2px solid ${accentColor}; outline-offset:1px; background: #fff; }
        .cvb-label { font-size:11px; font-weight:700; color:#4B5563; text-transform:uppercase; letter-spacing:.05em; display:block; margin-bottom:6px; }
        .print-area { width: 794px; min-height: 1123px; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.15); margin: 0 auto; overflow: hidden; }
        .color-swatch { width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .color-swatch:hover { transform: scale(1.1); }
        .eye-btn { background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.7; }
        .eye-btn:hover { opacity: 1; }
        .arrow-btn { background: #E5E7EB; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 12px; }
        .arrow-btn:hover { background: #D1D5DB; }
      `}</style>

      {/* HEADER DE LA APP */}
      <div style={{ padding: "20px 32px", background: "#0F172A", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#F8FAFC", letterSpacing: "-0.5px" }}>Impulso CV <span style={{ color: accentColor, background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 12, verticalAlign: "middle", marginLeft: 8 }}>PREMIUM</span></h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>Plataforma Profesional de Creación de CVs</p>
        </div>
        <button className="cvb-btn" onClick={handleDownloadPdf} disabled={downloading} style={{ padding: "12px 28px", fontSize: 14, background: accentColor, color: "#fff", opacity: downloading ? 0.6 : 1 }}>
          {downloading ? "Generando..." : "⬇ Descargar PDF"}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 32, alignItems: "flex-start" }}>
        
        {/* PANEL IZQUIERDO: CONTROLES */}
        <div style={{ flex: "1 1 400px", minWidth: 320, maxWidth: 480 }}>
          
          {/* PERSONALIZACIÓN VISUAL */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 16px", color: "#111", textTransform: "uppercase" }}>1. Estilo & Tipografía</h3>
            
            {/* COLOR */}
            <label className="cvb-label">Color de Acento</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
              {PRESET_COLORS.map(c => (
                <div key={c} onClick={() => setAccentColor(c)} className="color-swatch" style={{ background: c, borderColor: accentColor === c ? "#111" : "transparent" }} />
              ))}
              <div style={{ position: "relative", width: 30, height: 30, borderRadius: "50%", overflow: "hidden", border: "2px solid #E5E7EB", cursor: "pointer" }}>
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ width: 50, height: 50, padding: 0, border: "none", position: "absolute", top: -5, left: -5, cursor: "pointer" }} />
              </div>
            </div>

            {/* TIPOGRAFÍA */}
            <label className="cvb-label">Tono de Fuente</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {FONTS.map(f => (
                <button key={f.id} onClick={() => setSelectedFont(f.id)} style={{ flex: 1, padding: "8px", fontSize: 12, borderRadius: 6, border: selectedFont === f.id ? `2px solid ${accentColor}` : "1px solid #D1D5DB", background: selectedFont === f.id ? `${accentColor}10` : "#fff", fontWeight: selectedFont === f.id ? 700 : 500, fontFamily: f.family }}>
                  {f.name}
                </button>
              ))}
            </div>

            {/* PLANTILLAS */}
            <label className="cvb-label">Plantilla</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              {TEMPLATES.map((t) => (
                <div key={t.id} onClick={() => setTemplateId(t.id)} style={{ padding: "12px 14px", borderRadius: 8, background: templateId === t.id ? `${accentColor}10` : "#fff", border: templateId === t.id ? `2px solid ${accentColor}` : "1px solid #E5E7EB", cursor: "pointer", transition: "all 0.2s" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: templateId === t.id ? accentColor : "#374151" }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PALABRAS CLAVE ATS DE IMPACTO */}
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 18, marginBottom: 20 }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, margin: "0 0 8px", color: "#1E40AF", textTransform: "uppercase" }}>⚡ Verbos ATS de alto impacto</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ATS_VERBS.map((verb, i) => (
                <span key={i} style={{ background: "#fff", border: "1px solid #93C5FD", color: "#1E3A8A", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{verb}</span>
              ))}
            </div>
          </div>

          {/* FORMULARIO DE DATOS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            <Section title="2. Datos personales" visible={visible.photo} onToggle={() => setVisible(v => ({ ...v, photo: !v.photo }))}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                {cv.personal.photo ? <img src={cv.personal.photo} alt="Perfil" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: `2px solid ${accentColor}` }} /> : <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>FOTO</div>}
                <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files && e.target.files[0])} style={{ fontSize: 12 }} />
              </div>
              <Field label="Nombre completo" value={cv.personal.name} onChange={(v) => updatePersonal("name", v)} />
              <Field label="Puesto / Titular" value={cv.personal.title} onChange={(v) => updatePersonal("title", v)} />
              <Row2><Field label="Email" value={cv.personal.email} onChange={(v) => updatePersonal("email", v)} /><Field label="Teléfono" value={cv.personal.phone} onChange={(v) => updatePersonal("phone", v)} /></Row2>
              <Row2><Field label="Ubicación" value={cv.personal.location} onChange={(v) => updatePersonal("location", v)} /><Field label="LinkedIn / URL" value={cv.personal.linkedin} onChange={(v) => updatePersonal("linkedin", v)} /></Row2>
            </Section>

            <Section title="3. Perfil Profesional" visible={visible.summary} onToggle={() => setVisible(v => ({ ...v, summary: !v.summary }))}>
              <textarea className="cvb-input" rows={4} value={cv.summary} onChange={(e) => setCv((c) => ({ ...c, summary: e.target.value }))} placeholder="Escribí un párrafo de impacto sobre tus mayores fortalezas." />
            </Section>

            <Section title="4. Experiencia Laboral" visible={visible.experience} onToggle={() => setVisible(v => ({ ...v, experience: !v.experience }))} onAdd={addExperience} addLabel="+ Añadir puesto">
              {cv.experience.map((exp, i) => (
                <div key={exp.id} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, marginBottom: 16, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280" }}>Puesto #{i + 1}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="arrow-btn" onClick={() => moveExperience(i, "up")} disabled={i === 0}>⬆</button>
                      <button className="arrow-btn" onClick={() => moveExperience(i, "down")} disabled={i === cv.experience.length - 1}>⬇</button>
                    </div>
                  </div>
                  <Row2><Field label="Puesto" value={exp.role} onChange={(v) => updateExperience(exp.id, "role", v)} /><Field label="Empresa" value={exp.company} onChange={(v) => updateExperience(exp.id, "company", v)} /></Row2>
                  <Row2><Field label="Desde" value={exp.start} onChange={(v) => updateExperience(exp.id, "start", v)} /><Field label="Hasta" value={exp.end} onChange={(v) => updateExperience(exp.id, "end", v)} /></Row2>
                  
                  <label className="cvb-label" style={{ marginTop: 12 }}>Logros (Usá la varita ✨ para IA)</label>
                  {exp.bullets.map((b, bi) => (
                    <div key={bi} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <input className="cvb-input" value={b} onChange={(e) => updateBullet(exp.id, bi, e.target.value)} placeholder="Ej: Coordiné el equipo de logística..." />
                      <button className="cvb-btn" onClick={() => improveBulletAI(exp.id, bi, b)} style={{ background: `${accentColor}15`, color: accentColor, padding: "0 10px" }} title="Mejorar con IA">
                        {loadingAI === `${exp.id}-${bi}` ? "…" : "✨"}
                      </button>
                      <button className="cvb-btn" onClick={() => removeBullet(exp.id, bi)} style={{ background: "#FEE2E2", color: "#DC2626", padding: "0 10px" }}>✕</button>
                    </div>
                  ))}
                  <button className="cvb-btn" onClick={() => addBullet(exp.id)} style={{ background: "transparent", color: accentColor, fontSize: 13, padding: "4px 0" }}>+ Otro logro</button>
                  {cv.experience.length > 1 && <button className="cvb-btn" onClick={() => removeExperience(exp.id)} style={{ background: "transparent", color: "#DC2626", fontSize: 13, marginLeft: 16 }}>Eliminar Puesto</button>}
                </div>
              ))}
            </Section>

            <Section title="5. Educación" visible={visible.education} onToggle={() => setVisible(v => ({ ...v, education: !v.education }))} onAdd={addEducation} addLabel="+ Añadir estudio">
              {cv.education.map((ed, i) => (
                <div key={ed.id} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, marginBottom: 16, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280" }}>Estudio #{i + 1}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="arrow-btn" onClick={() => moveEducation(i, "up")} disabled={i === 0}>⬆</button>
                      <button className="arrow-btn" onClick={() => moveEducation(i, "down")} disabled={i === cv.education.length - 1}>⬇</button>
                    </div>
                  </div>
                  <Field label="Título / Carrera" value={ed.degree} onChange={(v) => updateEducation(ed.id, "degree", v)} />
                  <Field label="Institución" value={ed.institution} onChange={(v) => updateEducation(ed.id, "institution", v)} />
                  <Row2><Field label="Desde" value={ed.start} onChange={(v) => updateEducation(ed.id, "start", v)} /><Field label="Hasta" value={ed.end} onChange={(v) => updateEducation(ed.id, "end", v)} /></Row2>
                </div>
              ))}
            </Section>

            <Row2>
              <Section title="Habilidades" visible={visible.skills} onToggle={() => setVisible(v => ({ ...v, skills: !v.skills }))} onAdd={addSkill} addLabel="+">
                {cv.skills.map((s) => (
                  <div key={s.id} style={{ display: "flex", gap: 6, marginBottom: 6 }}><input className="cvb-input" value={s.name} onChange={(e) => updateSkillName(s.id, e.target.value)} /><button className="cvb-btn" onClick={() => removeSkill(s.id)} style={{ background: "#FEE2E2", color: "#DC2626", padding: "0 8px" }}>✕</button></div>
                ))}
              </Section>
              <Section title="Idiomas" visible={visible.languages} onToggle={() => setVisible(v => ({ ...v, languages: !v.languages }))} onAdd={addLanguage} addLabel="+">
                {cv.languages.map((l) => (
                  <div key={l.id} style={{ marginBottom: 10 }}>
                    <Field label="Idioma" value={l.name} onChange={(v) => updateLanguage(l.id, "name", v)} />
                    <Field label="Nivel" value={l.level} onChange={(v) => updateLanguage(l.id, "level", v)} />
                  </div>
                ))}
              </Section>
            </Row2>
          </div>
        </div>

        {/* PANEL DERECHO: PREVIEW A4 ESTRICTO */}
        <div style={{ flex: "2 1 520px", minWidth: 320, overflowX: "auto", display: "flex", justifyContent: "center", paddingBottom: 60 }}>
          <div ref={printRef} className="print-area">
            <CVPreview data={cv} templateId={templateId} color={accentColor} font={currentFontFamily} visible={visible} />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------- COMPONENTES SECUNDARIOS ---------- */
function Section({ title, children, onAdd, addLabel, visible = true, onToggle }) { 
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: visible ? 16 : 0, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onToggle && <button className="eye-btn" onClick={onToggle} title={visible ? "Ocultar en CV" : "Mostrar en CV"}>{visible ? "👁️" : "🙈"}</button>}
          <h3 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: visible ? "#111" : "#888", textTransform: "uppercase" }}>{title}</h3>
        </div>
        {visible && onAdd && <button className="cvb-btn" onClick={onAdd} style={{ background: "#F3F4F6", color: "#374151", fontSize: 12, padding: "4px 10px" }}>{addLabel}</button>}
      </div>
      {visible && children}
    </div>
  ); 
}

function Field({ label, value, onChange, placeholder }) { return (<div style={{ marginBottom: 10 }}><label className="cvb-label">{label}</label><input className="cvb-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>); }
function Row2({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>; }
function ContactLine({ p, sep = " · " }) { const items = [p.location, p.email, p.phone, p.linkedin].filter(Boolean); return <span>{items.join(sep)}</span>; }
function skillNames(skills) { return (skills || []).filter((s) => s && s.name).map((s) => s.name); }

/* ---------- ENRUTADOR DE PLANTILLAS ---------- */
function CVPreview({ data, templateId, color, font, visible }) {
  if (templateId === "ats") return <TplATS data={data} visible={visible} />;
  if (templateId === "ejecutivo") return <TplEjecutivo data={data} color={color} font={font} visible={visible} />;
  if (templateId === "impacto") return <TplImpacto data={data} color={color} font={font} visible={visible} />;
  if (templateId === "tarjetas") return <TplTarjetas data={data} color={color} font={font} visible={visible} />;
  return <TplEjecutivo data={data} color={color} font={font} visible={visible} />;
}

/* ---------- DISEÑOS CON SOPORTE DE VISIBILIDAD Y FUENTES ---------- */

function TplATS({ data, visible }) {
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#000", padding: "48px", fontSize: 14, lineHeight: 1.6, background: "#fff", height: "100%" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", textAlign: "center", textTransform: "uppercase" }}>{data.personal.name || "NOMBRE APELLIDO"}</h1>
      <p style={{ margin: "0 0 10px", textAlign: "center", fontSize: 16 }}>{data.personal.title}</p>
      <p style={{ margin: "0 0 24px", fontSize: 12, textAlign: "center" }}><ContactLine p={data.personal} sep=" | " /></p>
      
      {visible.summary && data.summary && (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 12, textTransform: "uppercase" }}>Resumen Profesional</h2>
          <p style={{ marginBottom: 24 }}>{data.summary}</p>
        </>
      )}
      
      {visible.experience && (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 12, textTransform: "uppercase" }}>Experiencia Laboral</h2>
          {data.experience.map((e) => (
            <div key={e.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 4 }}><span>{e.role}, {e.company}</span><span>{e.start} - {e.end || "Actualidad"}</span></div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>{e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}</ul>
            </div>
          ))}
        </>
      )}
      
      {visible.education && (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 12, marginTop: 24, textTransform: "uppercase" }}>Educación</h2>
          {data.education.map((ed) => (<p key={ed.id} style={{ margin: "0 0 6px", fontWeight: 700 }}>{ed.degree}, {ed.institution} <span style={{ fontWeight: 400 }}>({ed.start} - {ed.end})</span></p>))}
        </>
      )}
      
      {visible.skills && (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 12, marginTop: 24, textTransform: "uppercase" }}>Habilidades e Idiomas</h2>
          <p>{skillNames(data.skills).join(", ")}</p>
          {visible.languages && <p>{data.languages.filter(l=>l.name).map(l => `${l.name} (${l.level})`).join(", ")}</p>}
        </>
      )}
    </div>
  );
}

function TplEjecutivo({ data, color, font, visible }) {
  return (
    <div style={{ fontFamily: font, background: "#fff", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: color, padding: "40px 48px", color: "#fff", display: "flex", alignItems: "center", gap: 32 }}>
        {visible.photo && data.personal.photo && (
          <img src={data.personal.photo} alt="Perfil" style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "4px solid rgba(255,255,255,0.2)" }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px" }}>{data.personal.name || "Nombre Apellido"}</h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.9)", fontWeight: 600, margin: "0 0 16px" }}>{data.personal.title}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px", fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
             {data.personal.location && <span>📍 {data.personal.location}</span>}
             {data.personal.phone && <span>📱 {data.personal.phone}</span>}
             {data.personal.email && <span>✉️ {data.personal.email}</span>}
             {data.personal.linkedin && <span>🔗 {data.personal.linkedin}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, padding: "40px 48px", gap: 40 }}>
        <div style={{ flex: "2" }}>
          {visible.summary && data.summary && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: color, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, borderBottom: `2px solid ${color}30`, paddingBottom: 6 }}>Perfil</h2>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#374151" }}>{data.summary}</p>
            </div>
          )}

          {visible.experience && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: color, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 20, borderBottom: `2px solid ${color}30`, paddingBottom: 6 }}>Experiencia</h2>
              {data.experience.map((e) => (
                <div key={e.id} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>{e.role}</h3>
                    <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>{e.start} – {e.end || "Actualidad"}</span>
                  </div>
                  <p style={{ fontSize: 14, color: color, fontWeight: 600, margin: "4px 0 10px" }}>{e.company}</p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: "#4B5563" }}>
                    {e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: "1" }}>
          {visible.education && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: color, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16, borderBottom: `2px solid ${color}30`, paddingBottom: 6 }}>Educación</h2>
              {data.education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111" }}>{ed.degree}</h3>
                  <p style={{ fontSize: 13, color: "#4B5563", margin: "0 0 4px" }}>{ed.institution}</p>
                  <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{ed.start} – {ed.end}</span>
                </div>
              ))}
            </div>
          )}

          {visible.skills && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: color, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16, borderBottom: `2px solid ${color}30`, paddingBottom: 6 }}>Habilidades</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {skillNames(data.skills).map((s, i) => (
                  <div key={i} style={{ fontSize: 13.5, color: "#374151", fontWeight: 600, display: "flex", alignItems: "center" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, marginRight: 10 }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible.languages && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: color, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16, borderBottom: `2px solid ${color}30`, paddingBottom: 6 }}>Idiomas</h2>
              {data.languages.filter(l=>l.name).map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#374151", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{l.name}</span>
                  <span style={{ color: "#6B7280" }}>{l.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TplImpacto({ data, color, font, visible }) {
  return (
    <div style={{ fontFamily: font, display: "flex", minHeight: "100%", height: 1123, background: "#F8FAFC" }}>
      <div style={{ width: "34%", background: color, padding: "48px 32px", color: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          {visible.photo && data.personal.photo && (
             <img src={data.personal.photo} alt="Perfil" style={{ width: 130, height: 130, borderRadius: "50%", objectFit: "cover", border: "4px solid rgba(255,255,255,0.2)", marginBottom: 24 }} />
          )}
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.1 }}>{data.personal.name || "Nombre Apellido"}</h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: 0, textTransform: "uppercase" }}>{data.personal.title}</p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 8, marginBottom: 16 }}>Contacto</h3>
          {[data.personal.location, data.personal.phone, data.personal.email, data.personal.linkedin].filter(Boolean).map((c, i) => (
            <p key={i} style={{ fontSize: 13, margin: "0 0 10px", color: "rgba(255,255,255,0.9)", wordBreak: "break-word" }}>{c}</p>
          ))}
        </div>

        {visible.education && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 8, marginBottom: 16 }}>Educación</h3>
            {data.education.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px", color: "#fff" }}>{ed.degree}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0 }}>{ed.institution} <br/> {ed.start} - {ed.end}</p>
              </div>
            ))}
          </div>
        )}

        {visible.languages && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 8, marginBottom: 16 }}>Idiomas</h3>
            {data.languages.filter(l=>l.name).map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, color: "rgba(255,255,255,0.9)" }}>
                <span style={{ fontWeight: 700 }}>{l.name}</span>
                <span>{l.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ width: "66%", padding: "48px 40px" }}>
        {visible.summary && data.summary && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: color, textTransform: "uppercase", marginBottom: 16 }}>Perfil Profesional</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#334155" }}>{data.summary}</p>
          </div>
        )}

        {visible.experience && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: color, textTransform: "uppercase", marginBottom: 24 }}>Experiencia</h2>
            {data.experience.map((e) => (
              <div key={e.id} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>{e.role}</h3>
                <div style={{ fontSize: 13.5, color: color, fontWeight: 700, marginBottom: 8 }}>{e.company} <span style={{ color: "#94A3B8", fontWeight: 600, marginLeft: 8 }}>| {e.start} – {e.end || "Actualidad"}</span></div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: "#475569" }}>
                  {e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {visible.skills && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: color, textTransform: "uppercase", marginBottom: 20 }}>Habilidades Principales</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {skillNames(data.skills).map((s, i) => (
                <span key={i} style={{ background: "#fff", border: `1px solid ${color}40`, color: color, fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 20 }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TplTarjetas({ data, color, font, visible }) {
  const bgColor = `${color}08`; 

  return (
    <div style={{ fontFamily: font, background: bgColor, padding: "40px", minHeight: "100%" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "32px 40px", display: "flex", alignItems: "center", gap: 32, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", borderLeft: `6px solid ${color}` }}>
        {visible.photo && data.personal.photo && (
          <img src={data.personal.photo} alt="Perfil" style={{ width: 90, height: 90, borderRadius: 16, objectFit: "cover" }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px", color: "#111" }}>{data.personal.name || "Nombre Apellido"}</h1>
          <p style={{ fontSize: 15, color: color, fontWeight: 700, margin: "0 0 12px", textTransform: "uppercase" }}>{data.personal.title}</p>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0, fontWeight: 500 }}><ContactLine p={data.personal} sep="   |   " /></p>
        </div>
      </div>

      {visible.summary && data.summary && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 40px", marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, color: "#374151" }}>{data.summary}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 24 }}>
        {visible.experience && (
          <div style={{ flex: "2" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: "0 0 16px 8px" }}>Experiencia Profesional</h2>
            {data.experience.map((e) => (
              <div key={e.id} style={{ background: "#fff", borderRadius: 16, padding: "24px 32px", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{e.role}</h3>
                    <p style={{ fontSize: 14, color: color, margin: 0, fontWeight: 600 }}>{e.company}</p>
                  </div>
                  <div style={{ background: `${color}15`, color: color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {e.start} – {e.end || "Actualidad"}
                  </div>
                </div>
                <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: "#4B5563" }}>
                  {e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: 24 }}>
          {visible.education && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>Educación</h2>
              {data.education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: color }}>{ed.degree}</h3>
                  <p style={{ fontSize: 13, color: "#4B5563", margin: "0 0 4px" }}>{ed.institution}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, fontWeight: 600 }}>{ed.start} - {ed.end}</p>
                </div>
              ))}
            </div>
          )}

          {visible.skills && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>Habilidades</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skillNames(data.skills).map((s, i) => (
                  <span key={i} style={{ background: "#F3F4F6", color: "#374151", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
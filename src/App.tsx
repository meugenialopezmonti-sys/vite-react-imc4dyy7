// @ts-nocheck
import { useState, useEffect, useRef } from "react";

/* ==========================================================================
   HELPERS & CONSTANTES
   ========================================================================== */
const uid = () => Math.random().toString(36).slice(2, 10);
const STORAGE_KEY = "impulso-finanzas-v1";

const CATEGORIES = {
  expense: ["🛒 Supermercado", "🍔 Delivery/Restaurantes", "🚗 Transporte", "🏠 Hogar/Servicios", "🎉 Ocio/Salidas", "👕 Ropa", "🏥 Salud", "❓ Otros"],
  income: ["💼 Sueldo", "📈 Inversiones", "🎁 Regalos", "🛠️ Freelance", "❓ Otros"]
};

// Cálculo de días restantes del mes (simplificado para el prototipo)
const getDaysLeftInMonth = () => {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDay.getDate() - today.getDate() + 1;
};

/* ==========================================================================
   ÍCONOS VECTORIALES
   ========================================================================== */
const IconHome = ({s=18,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const IconWallet = ({s=18,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>;
const IconTarget = ({s=18,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const IconSparkles = ({s=18,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M3 12h18M15.5 8.5l4-4M8.5 15.5l-4 4M8.5 8.5l-4-4M15.5 15.5l4 4"/></svg>;
const IconMoon = ({s=14,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const IconSun = ({s=14,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>;
const IconTrash = ({s=14,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconTrendingUp = ({s=18,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const IconTrendingDown = ({s=18,c="currentColor"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>;

/* ==========================================================================
   API IA
   ========================================================================== */
async function callClaude(prompt) {
  const API_KEY = import.meta.env?.VITE_ANTHROPIC_API_KEY || ""; 
  if (!API_KEY) throw new Error("NO_KEY");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-3-5-sonnet-20240620", max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return (data.content || []).map(b => b.text).join("\n").trim();
}

/* ==========================================================================
   APP PRINCIPAL (OS FINANZAS)
   ========================================================================== */
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, transactions, goals, ai
  const [darkMode, setDarkMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Estados Base de Datos
  const [balanceBase, setBalanceBase] = useState(0);
  const [transactions, setTransactions] = useState([]); // {id, type, amount, category, desc, date}
  const [goals, setGoals] = useState([]); // {id, name, target, current}

  const saveTimer = useRef(null);

  // Cargar info
  useEffect(() => {
    document.title = "Impulso Finanzas OS";
    try {
      const res = localStorage.getItem(STORAGE_KEY);
      if (res) {
        const parsed = JSON.parse(res);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.balanceBase !== undefined) setBalanceBase(parsed.balanceBase);
        if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  // Guardar info
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, goals, balanceBase, darkMode })); } catch (e) {}
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [transactions, goals, balanceBase, darkMode, loaded]);

  // Cálculos Core
  const totalIncomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const currentBalance = balanceBase + totalIncomes - totalExpenses;
  
  const savedForGoals = goals.reduce((acc, g) => acc + g.current, 0);
  const availableToSpend = currentBalance - savedForGoals;
  
  const daysLeft = getDaysLeftInMonth();
  const dailySafeLimit = daysLeft > 0 ? (availableToSpend / daysLeft).toFixed(0) : availableToSpend;

  // Acciones
  const addTransaction = (type, amount, category, desc) => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return alert("Ingresá un monto válido.");
    setTransactions([{ id: uid(), type, amount: n, category, desc, date: new Date().toISOString() }, ...transactions]);
  };

  const removeTransaction = (id) => setTransactions(transactions.filter(t => t.id !== id));

  // Tema Visual
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const brandColor = "#10B981"; // Verde Esmeralda Fintech
  const uiBg = darkMode ? "#0F1115" : "#F3F4F6";
  const sidebarBg = darkMode ? "#181A1F" : "#FFFFFF";
  const cardBg = darkMode ? "#1F2229" : "#FFFFFF";
  const borderCol = darkMode ? "#2D313A" : "#E5E7EB";
  const textCol = darkMode ? "#D1D5DB" : "#4B5563";
  const headCol = darkMode ? "#FFFFFF" : "#111827";

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: uiBg, minHeight: "100vh", display: "flex", color: textCol }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .os-btn { cursor:pointer; border:none; border-radius:8px; font-weight:600; font-size: 13px; transition:all .2s; display:inline-flex; align-items:center; justify-content:center; padding: 10px 16px; }
        .os-btn:hover { opacity:.9; transform: translateY(-1px); }
        .os-input { width:100%; border:1px solid ${borderCol}; border-radius:8px; padding:12px 14px; font-size:14px; background: ${darkMode ? '#181A1F' : '#F9FAFB'}; color: ${headCol}; }
        .os-input:focus { outline:2px solid ${brandColor}; outline-offset:-1px; }
        .os-label { font-size:11px; font-weight:700; color:${textCol}; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:8px; }
        
        .sidebar-item { padding: 12px 16px; margin: 4px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13.5px; font-weight: 600; transition: all 0.2s; color: ${textCol}; }
        .sidebar-item:hover { background: ${darkMode ? '#2D313A' : '#F3F4F6'}; }
        .sidebar-item.active { background: ${brandColor}15; color: ${brandColor}; }

        .scroll-area { height: 100vh; overflow-y: auto; flex: 1; padding: 32px 40px; }
        .scroll-area::-webkit-scrollbar { width: 6px; }
        .scroll-area::-webkit-scrollbar-thumb { background: ${borderCol}; border-radius: 4px; }

        .glass-card { background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }

        @media (max-width: 768px) {
          .os-sidebar { display: none !important; }
          .mobile-nav { display: flex !important; overflow-x: auto; background: ${sidebarBg}; padding: 12px; border-bottom: 1px solid ${borderCol}; gap:8px; }
          .mobile-nav button { white-space: nowrap; padding: 8px 14px; border:none; background:transparent; font-weight:600; color:${textCol}; border-radius:8px; font-size: 13px; }
          .mobile-nav button.active { background: ${brandColor}15; color: ${brandColor}; }
          .scroll-area { padding: 20px 16px; }
        }
      `}</style>

      {/* SIDEBAR NUBE */}
      <div className="os-sidebar" style={{ width: 260, background: sidebarBg, borderRight: `1px solid ${borderCol}`, display: "flex", flexDirection: "column", padding: "24px 0" }}>
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: headCol }}>Impulso <span style={{ color: brandColor }}>Finanzas</span></h1>
          <p style={{ fontSize: 12, color: textCol, marginTop: 4 }}>OS de Salud Financiera</p>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ padding: "0 12px", marginBottom: 20 }}>
            <div style={{ background: `${brandColor}10`, padding: "16px", borderRadius: 12, border: `1px solid ${brandColor}20` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: textCol, textTransform: "uppercase", marginBottom: 4 }}>Saldo Actual</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: headCol }}>${currentBalance.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ padding: "0 24px 8px", fontSize: 11, fontWeight: 700, color: textCol, textTransform: "uppercase", letterSpacing: "1px" }}>Mi Espacio</div>
          <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><IconHome/> Dashboard</div>
          <div className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}><IconWallet/> Movimientos</div>
          <div className={`sidebar-item ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => setActiveTab('goals')}><IconTarget/> Metas de Ahorro</div>
          <div style={{ padding: "20px 24px 8px", fontSize: 11, fontWeight: 700, color: textCol, textTransform: "uppercase", letterSpacing: "1px" }}>Inteligencia</div>
          <div className={`sidebar-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}><IconSparkles/> Asesor IA</div>
        </div>

        <div style={{ padding: "0 24px" }}>
          <button className="os-btn" onClick={toggleDarkMode} style={{ width: "100%", background: "transparent", border: `1px solid ${borderCol}`, color: textCol }}>
            {darkMode ? <IconSun/> : <IconMoon/>} <span style={{marginLeft: 8}}>{darkMode ? "Tema Claro" : "Tema Oscuro"}</span>
          </button>
        </div>
      </div>

      {/* CONTENEDOR DERECHO */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        
        {/* NAV MOBILE */}
        <div className="mobile-nav" style={{ display: "none" }}>
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Inicio</button>
          <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>Movimientos</button>
          <button className={activeTab === 'goals' ? 'active' : ''} onClick={() => setActiveTab('goals')}>Metas</button>
          <button className={activeTab === 'ai' ? 'active' : ''} onClick={() => setActiveTab('ai')}>IA</button>
        </div>

        {/* VISTAS */}
        <div className="scroll-area">
          {activeTab === 'dashboard' && <DashboardView 
            availableToSpend={availableToSpend} dailySafeLimit={dailySafeLimit} daysLeft={daysLeft} 
            addTransaction={addTransaction} transactions={transactions} 
            brandColor={brandColor} headCol={headCol} textCol={textCol} borderCol={borderCol} cardBg={cardBg} 
          />}
          
          {activeTab === 'transactions' && <TransactionsView 
            transactions={transactions} removeTransaction={removeTransaction} setBalanceBase={setBalanceBase} balanceBase={balanceBase}
            brandColor={brandColor} headCol={headCol} textCol={textCol} borderCol={borderCol} cardBg={cardBg} darkMode={darkMode}
          />}
          
          {activeTab === 'goals' && <GoalsView 
            goals={goals} setGoals={setGoals} currentBalance={currentBalance}
            brandColor={brandColor} headCol={headCol} textCol={textCol} borderCol={borderCol} cardBg={cardBg} darkMode={darkMode}
          />}
          
          {activeTab === 'ai' && <AiAdvisorView 
            transactions={transactions} goals={goals} currentBalance={currentBalance}
            brandColor={brandColor} headCol={headCol} textCol={textCol} borderCol={borderCol} cardBg={cardBg} darkMode={darkMode}
          />}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VISTA 1: DASHBOARD
   ========================================================================== */
function DashboardView({ availableToSpend, dailySafeLimit, daysLeft, addTransaction, transactions, brandColor, headCol, textCol, borderCol, cardBg }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = () => {
    if(!amount || !cat) return alert("Completá monto y categoría.");
    addTransaction(type, amount, cat, desc);
    setAmount(''); setDesc('');
  };

  const recent = transactions.slice(0, 4);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: headCol, marginBottom: 24 }}>Tu Resumen de Hoy</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
        {/* TARJETA GASTO SEGURO */}
        <div className="glass-card" style={{ background: `linear-gradient(135deg, ${brandColor}, #059669)`, color: "#fff", border: "none" }}>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, opacity: 0.9 }}>Gasto Diario Seguro</div>
          <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 8 }}>${dailySafeLimit}</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Es lo que podés gastar hoy para llegar a fin de mes (quedan {daysLeft} días), sin tocar tus ahorros.</div>
        </div>

        {/* TARJETA DISPONIBLE LIBRE */}
        <div className="glass-card">
          <div style={{ fontSize: 12, fontWeight: 700, color: textCol, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Disponible para Gastar</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: headCol, marginBottom: 8 }}>${availableToSpend.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: textCol }}>Este es tu saldo total menos el dinero que tenés reservado para tus metas de ahorro.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        
        {/* CARGA RÁPIDA */}
        <div className="glass-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: headCol, marginBottom: 20 }}>⚡ Carga Rápida</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={()=>setType('expense')} className="os-btn" style={{ flex: 1, background: type==='expense' ? '#FEE2E2' : 'transparent', color: type==='expense' ? '#DC2626' : textCol, border: `1px solid ${type==='expense'?'#DC2626':borderCol}` }}>Gasto</button>
            <button onClick={()=>setType('income')} className="os-btn" style={{ flex: 1, background: type==='income' ? '#D1FAE5' : 'transparent', color: type==='income' ? '#059669' : textCol, border: `1px solid ${type==='income'?'#059669':borderCol}` }}>Ingreso</button>
          </div>
          
          <label className="os-label">Monto ($)</label>
          <input type="number" className="os-input" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{marginBottom: 16, fontSize: 18, fontWeight: 700}}/>
          
          <label className="os-label">Categoría</label>
          <select className="os-input" value={cat} onChange={e=>setCat(e.target.value)} style={{marginBottom: 16}}>
            <option value="">Seleccionar...</option>
            {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label className="os-label">Descripción (Opcional)</label>
          <input className="os-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ej. Cena con amigos" style={{marginBottom: 20}}/>
          
          <button onClick={handleAdd} className="os-btn" style={{ width: "100%", background: brandColor, color: "#fff", padding: "14px" }}>Registrar Movimiento</button>
        </div>

        {/* ÚLTIMOS MOVIMIENTOS */}
        <div className="glass-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: headCol, marginBottom: 20 }}>Últimos Movimientos</h3>
          {recent.length === 0 ? (
            <p style={{ fontSize: 14, color: textCol }}>Todavía no registraste gastos ni ingresos.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recent.map(t => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: `1px solid ${borderCol}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.type === 'expense' ? '#FEE2E2' : '#D1FAE5', color: t.type === 'expense' ? '#DC2626' : '#059669', display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {t.type === 'expense' ? <IconTrendingDown s={18}/> : <IconTrendingUp s={18}/>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: headCol, fontSize: 14 }}>{t.category.split(' ')[0]} {t.desc && `- ${t.desc}`}</div>
                      <div style={{ fontSize: 11, color: textCol, marginTop: 2 }}>{new Date(t.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: t.type === 'expense' ? '#DC2626' : headCol }}>
                    {t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VISTA 2: MOVIMIENTOS COMPLETOS Y AJUSTES
   ========================================================================== */
function TransactionsView({ transactions, removeTransaction, setBalanceBase, balanceBase, brandColor, headCol, textCol, borderCol, cardBg, darkMode }) {
  const [baseInput, setBaseInput] = useState(balanceBase.toString());

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: headCol, marginBottom: 24 }}>Historial y Ajustes</h2>
      
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: headCol, marginBottom: 12 }}>Ajuste Manual de Cuenta</h3>
        <p style={{ fontSize: 13, color: textCol, marginBottom: 16 }}>Si querés que la app inicie con plata que ya tenías en el banco, cargala acá como base.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <input type="number" className="os-input" value={baseInput} onChange={e=>setBaseInput(e.target.value)} placeholder="Plata en cuenta" />
          <button onClick={() => {setBalanceBase(parseFloat(baseInput)||0); alert("Base actualizada");}} className="os-btn" style={{ background: darkMode ? '#333' : '#EEE', color: headCol }}>Actualizar</button>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: headCol, marginBottom: 20 }}>Todos tus movimientos</h3>
        {transactions.map(t => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${borderCol}` }}>
             <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.type === 'expense' ? '#FEE2E2' : '#D1FAE5', color: t.type === 'expense' ? '#DC2626' : '#059669', display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.type === 'expense' ? <IconTrendingDown s={16}/> : <IconTrendingUp s={16}/>}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: headCol, fontSize: 14 }}>{t.category} {t.desc && `(${t.desc})`}</div>
                <div style={{ fontSize: 11, color: textCol, marginTop: 2 }}>{new Date(t.date).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: t.type === 'expense' ? '#DC2626' : headCol }}>
                {t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()}
              </span>
              <button onClick={()=>removeTransaction(t.id)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 4 }}><IconTrash s={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   VISTA 3: METAS DE AHORRO
   ========================================================================== */
function GoalsView({ goals, setGoals, currentBalance, brandColor, headCol, textCol, borderCol, cardBg, darkMode }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  
  const addGoal = () => {
    if(!name || !target) return;
    setGoals([...goals, { id: uid(), name, target: parseFloat(target), current: 0 }]);
    setName(''); setTarget('');
  };

  const addFunds = (id, amount) => {
    setGoals(goals.map(g => {
      if (g.id !== id) return g;
      const newCurrent = g.current + parseFloat(amount);
      return { ...g, current: newCurrent > g.target ? g.target : newCurrent };
    }));
  };

  const removeGoal = (id) => setGoals(goals.filter(g => g.id !== id));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: headCol }}>Tus Metas Visibles</h2>
          <p style={{ fontSize: 14, color: textCol, marginTop: 4 }}>Separar el dinero mentalmente te ayuda a no gastarlo.</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 32, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}><label className="os-label">¿Qué querés lograr?</label><input className="os-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Viaje a Bariloche" /></div>
        <div style={{ flex: 1, minWidth: 150 }}><label className="os-label">Monto Objetivo ($)</label><input type="number" className="os-input" value={target} onChange={e=>setTarget(e.target.value)} placeholder="500000" /></div>
        <button onClick={addGoal} className="os-btn" style={{ background: headCol, color: cardBg, padding: "14px 24px" }}>Crear Meta</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {goals.map(g => {
          const perc = Math.min(Math.round((g.current / g.target) * 100), 100);
          return (
            <div key={g.id} className="glass-card" style={{ position: "relative" }}>
              <button onClick={()=>removeGoal(g.id)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}><IconTrash/></button>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: headCol, marginBottom: 8, paddingRight: 20 }}>{g.name}</h3>
              <div style={{ fontSize: 13, color: textCol, marginBottom: 16 }}>Ahorrado: <strong style={{color:headCol}}>${g.current.toLocaleString()}</strong> de ${g.target.toLocaleString()}</div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: brandColor, marginBottom: 6 }}>
                <span>Progreso</span><span>{perc}%</span>
              </div>
              <div style={{ width: "100%", height: 10, background: darkMode ? "#333" : "#F3F4F6", borderRadius: 5, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ width: `${perc}%`, height: "100%", background: brandColor, borderRadius: 5, transition: "width 0.4s" }} />
              </div>

              {perc < 100 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => addFunds(g.id, 5000)} className="os-btn" style={{ flex: 1, fontSize: 11, background: darkMode ? '#2D313A' : '#E5E7EB', color: headCol }}>+ $5.000</button>
                  <button onClick={() => addFunds(g.id, 10000)} className="os-btn" style={{ flex: 1, fontSize: 11, background: darkMode ? '#2D313A' : '#E5E7EB', color: headCol }}>+ $10.000</button>
                </div>
              )}
              {perc === 100 && <div style={{ fontSize: 13, fontWeight: 700, color: brandColor, textAlign: "center", padding: "8px" }}>¡Meta Completada! 🎉</div>}
            </div>
          );
        })}
        {goals.length === 0 && <p style={{ fontSize: 14, color: textCol, gridColumn: "1/-1", textAlign: "center", padding: 40 }}>No tenés metas activas. ¡Creá una para empezar a separar plata!</p>}
      </div>
    </div>
  );
}

/* ==========================================================================
   VISTA 4: ASESOR IA FINANCIERO
   ========================================================================== */
function AiAdvisorView({ transactions, goals, currentBalance, brandColor, headCol, textCol, borderCol, cardBg, darkMode }) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState("");

  const analyzeFinances = async () => {
    setLoading(true);
    try {
      const expenses = transactions.filter(t => t.type === 'expense');
      const cats = {};
      expenses.forEach(e => { cats[e.category] = (cats[e.category]||0) + e.amount; });
      
      const prompt = `Actuá como un asesor financiero personal amistoso y directo. Analizá los siguientes datos de un usuario:
      - Saldo actual: $${currentBalance}
      - Gastos por categoría: ${JSON.stringify(cats)}
      - Metas de ahorro: ${goals.length} metas activas.
      
      Devolvé un análisis corto con formato Markdown que incluya:
      1. Un diagnóstico de su salud financiera.
      2. Dónde está gastando de más (el "gasto hormiga").
      3. Un consejo accionable para llegar a sus metas más rápido.
      No uses lenguaje complejo. Hablale en argentino (vos).`;

      const res = await callClaude(prompt);
      setInsight(res);
    } catch (e) {
      setInsight(`### Diagnóstico Financiero\nParece que no tenés suficientes movimientos cargados o no pusiste la clave de IA.\n\n**Consejo:** Empezá a registrar todo lo que gastás (el café, el taxi, las suscripciones). Ahí es donde se esconde la plata que te falta para tus metas.`);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div className="glass-card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${brandColor}20`, color: brandColor, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <IconSparkles s={32}/>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: headCol, marginBottom: 12 }}>Asesor Financiero con IA</h2>
        <p style={{ fontSize: 14, color: textCol, marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
          La IA lee tus patrones de gasto, detecta "fugas de dinero" y te recomienda cómo ajustar tu presupuesto para llegar a fin de mes.
        </p>
        
        <button onClick={analyzeFinances} disabled={loading || transactions.length === 0} className="os-btn" style={{ padding: "14px 32px", fontSize: 15, background: brandColor, color: "#fff" }}>
          {loading ? "Analizando tus gastos..." : "Escanear mis Finanzas"}
        </button>
        {transactions.length === 0 && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 12 }}>Cargá algunos gastos primero para que la IA tenga datos.</p>}
      </div>

      {insight && (
        <div className="glass-card" style={{ marginTop: 24 }}>
          <div dangerouslySetInnerHTML={{ __html: insight.replace(/### (.*?)\n/g, '<h3 style="color:'+brandColor+'; font-size:16px; margin: 16px 0 8px;">$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong style="color:'+headCol+'">$1</strong>').replace(/\n/g, '<br/>') }} style={{ fontSize: 14, lineHeight: 1.6 }} />
        </div>
      )}
    </div>
  );
}

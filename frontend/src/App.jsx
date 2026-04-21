import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, ReferenceDot,
} from "recharts";

const C = {
  bg:"#08090C", panel:"#0F1117", panelHi:"#13161F",
  border:"#1C2130", borderHi:"#2A3347",
  accent:"#F5A623", accentDim:"#6B470F",
  green:"#22D3A4", greenDim:"#0D4033",
  red:"#F43F5E", redDim:"#4C0F1A",
  blue:"#38BDF8", blueDim:"#0C2D40",
  purple:"#A78BFA",
  muted:"#374151", text:"#DDE3EF",
  textDim:"#5A6578", textMid:"#8896A8",
};

const injectStyles = () => {
  if (document.getElementById("bhctrl-css")) return;
  const el = document.createElement("style");
  el.id = "bhctrl-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#08090C;}
    ::-webkit-scrollbar{width:6px;height:6px;}
    ::-webkit-scrollbar-track{background:#0F1117;}
    ::-webkit-scrollbar-thumb{background:#1C2130;border-radius:3px;}
    input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;}
    input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:#1C2130;}
    input[type=range]::-webkit-slider-thumb{
      -webkit-appearance:none;appearance:none;
      width:18px;height:18px;border-radius:50%;margin-top:-7px;
      background:#F5A623;box-shadow:0 0 10px #F5A62370;cursor:pointer;
      border:2px solid #0F1117;transition:box-shadow 0.2s;
    }
    input[type=range]::-webkit-slider-thumb:hover{box-shadow:0 0 18px #F5A623;}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
    .fu{animation:fadeUp 0.45s ease both;}
    .fu1{animation:fadeUp 0.45s 0.09s ease both;}
    .fu2{animation:fadeUp 0.45s 0.18s ease both;}
    .fu3{animation:fadeUp 0.45s 0.27s ease both;}
    .fu4{animation:fadeUp 0.45s 0.36s ease both;}
  `;
  document.head.appendChild(el);
};

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"#161C28",border:`1px solid ${C.border}`,borderRadius:8,
      padding:"10px 14px",fontSize:11,fontFamily:"'Space Mono',monospace",
      boxShadow:"0 8px 24px #00000070",
    }}>
      <div style={{color:C.textDim,marginBottom:8,fontSize:10}}>⏱ {label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color,marginBottom:4,display:"flex",gap:8,alignItems:"center"}}>
          <span style={{width:10,height:2,background:p.color,display:"inline-block",borderRadius:1}}/>
          <span style={{color:C.textMid,fontSize:10}}>{p.name}:</span>
          <strong>{typeof p.value==="number"?p.value.toFixed(2):p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const LegRow = ({items})=>(
  <div style={{display:"flex",gap:16,flexWrap:"wrap",paddingBottom:12,borderBottom:`1px solid ${C.border}`,marginBottom:14}}>
    {items.map(({color,dash,label,note},i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:9,color:C.textMid}}>
        <svg width="26" height="10">
          <line x1="0" y1="5" x2="26" y2="5" stroke={color} strokeWidth={2} strokeDasharray={dash||"none"}/>
        </svg>
        {label}{note&&<span style={{color:C.textDim,fontSize:8}}>({note})</span>}
      </div>
    ))}
  </div>
);

const Panel=({children,glow,className="",style={}})=>(
  <div className={className} style={{
    background:C.panel,border:`1px solid ${glow?C.accentDim:C.border}`,
    borderRadius:12,padding:24,
    boxShadow:glow?`0 0 28px ${C.accentDim}60,inset 0 1px 0 ${C.accentDim}40`:"none",
    ...style,
  }}>{children}</div>
);

const STitle=({icon,children,color=C.accent})=>(
  <div style={{
    fontSize:9,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",
    color,marginBottom:18,display:"flex",alignItems:"center",gap:8,
    fontFamily:"'Space Mono',monospace",
  }}><span>{icon}</span><span>{children}</span></div>
);

const StatCard=({label,value,unit,icon,color,sub})=>(
  <div style={{background:`${color}0C`,border:`1px solid ${color}28`,borderRadius:10,padding:"14px 16px"}}>
    <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:5}}>
      <span style={{fontSize:15}}>{icon}</span>
      <span style={{fontSize:value!=="—"?21:16,fontWeight:700,color,fontFamily:"'Space Mono',monospace",letterSpacing:"-0.02em"}}>
        {value}{value!=="—"&&<span style={{fontSize:12,opacity:.7}}>{unit}</span>}
      </span>
    </div>
    <div style={{fontSize:8,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.14em"}}>{label}</div>
    {sub&&<div style={{fontSize:8,color:C.textDim,marginTop:3}}>Ideal: {sub}</div>}
  </div>
);

const BestBanner=({data})=>{
  if(!data) return null;
  const items=[
    {label:"Minuto Óptimo",value:data.minuto,unit:" min",icon:"⏱",color:C.accent},
    {label:"Temperatura",value:data.temp,unit:" °C",icon:"🌡",color:C.red},
    {label:"Humedad",value:data.hum,unit:" %",icon:"💧",color:C.blue},
    {label:"Ventilación",value:data.vent,unit:" %",icon:"🌬",color:C.textMid},
    {label:"Agua (Esponja)",value:data.agua,unit:" ml",icon:"🫧",color:C.blue},
    {label:"Jarabe (Bote)",value:data.jarabe,unit:" g",icon:"🍯",color:C.green},
    {label:"Fitness",value:data.fitness,unit:"",icon:"🎯",color:C.green},
  ];
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10}}>
      {items.map((it,i)=>(
        <div key={i} style={{
          background:`${it.color}0A`,border:`1px solid ${it.color}30`,
          borderRadius:10,padding:"14px 12px",textAlign:"center",
        }}>
          <div style={{fontSize:17,marginBottom:6}}>{it.icon}</div>
          <div style={{fontSize:17,fontWeight:700,color:it.color,fontFamily:"'Space Mono',monospace"}}>
            {it.value}<span style={{fontSize:11,opacity:.7}}>{it.unit}</span>
          </div>
          <div style={{fontSize:7,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.12em",marginTop:4}}>{it.label}</div>
        </div>
      ))}
    </div>
  );
};

export default function BeeHiveCtrl(){
  const [temp,setTemp]=useState(41.0);
  const [hum,setHum]=useState(44.0);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState(null);
  const [elapsed,setElapsed]=useState(0);
  const [selMin,setSelMin]=useState(0);
  const timerRef=useRef(null);
  const logRef=useRef(null);

  useEffect(()=>{injectStyles();},[]);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[result?.logs]);

  const handleRun=async()=>{
    setLoading(true);setError(null);setResult(null);setElapsed(0);setSelMin(0);
    let t=0;
    timerRef.current=setInterval(()=>{t++;setElapsed(t);},1000);
    try{
      const res=await fetch("http://localhost:8000/api/ejecutar-simulacion",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({temp_inicial:temp,hum_inicial:hum}),
      });
      if(!res.ok)throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data=await res.json();
      setResult(data);
    }catch(e){setError(e.message);}
    finally{clearInterval(timerRef.current);setLoading(false);}
  };

  const lastData=result?.data_simulacion?.at(-1);

  const riskData=result?.data_simulacion?.map((d,i)=>({
    minuto:d.minuto,
    "Sin Intervención":parseFloat((temp+i*0.85+i*0.06).toFixed(2)),
    "Con BEEHIVECTRL":d.temp,
  }))??[];

  const histSel=result?.historial_generaciones?.[selMin];
  const convData=histSel
    ?histSel.hist_mejor.map((v,i)=>({
        gen:i+1,
        "Mejor Individuo":v,
        "Promedio Población":histSel.hist_promedio[i],
      }))
    :[];
  const bestGenIdx=convData.length
    ?convData.reduce((bi,d,i)=>d["Mejor Individuo"]<convData[bi]["Mejor Individuo"]?i:bi,0)
    :null;

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Space Mono',monospace",color:C.text}}>

      <header style={{
        background:"linear-gradient(135deg,#0C0F16 0%,#111827 100%)",
        borderBottom:`1px solid ${C.border}`,padding:"18px 36px",
        display:"flex",alignItems:"center",gap:18,
        position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)",
      }}>
        <div style={{
          width:46,height:46,flexShrink:0,
          background:`linear-gradient(135deg,${C.accent},#C97D10)`,
          clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
        }}>🐝</div>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#fff",letterSpacing:"0.06em",fontFamily:"'Syne',sans-serif"}}>BEEHIVECTRL</div>
          <div style={{fontSize:9,color:C.textDim,letterSpacing:"0.22em",textTransform:"uppercase"}}>Sistema de Control Adaptativo · Algoritmo Genético Dinámico</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:9,color:C.textDim,letterSpacing:"0.15em"}}>
            {loading?`EJECUTANDO ${elapsed}s`:result?"SIMULACIÓN COMPLETA":"EN ESPERA"}
          </span>
          <div style={{
            width:8,height:8,borderRadius:"50%",
            background:result&&!loading?C.green:loading?C.accent:C.muted,
            boxShadow:result&&!loading?`0 0 10px ${C.green}`:"none",
            animation:loading?"pulse 1s infinite":result?"pulse 3s infinite":"none",
          }}/>
        </div>
      </header>

      <main style={{padding:"28px 36px",maxWidth:1440,margin:"0 auto"}}>

        <div style={{display:"grid",gridTemplateColumns:"290px 1fr",gap:18,marginBottom:18}}>

          <Panel>
            <STitle icon="⚙">Parámetros Iniciales</STitle>
            {[
              {label:"🌡 Temperatura actual (°C)",val:temp,set:setTemp,min:20,max:50,color:C.red,ideal:"34–35 °C"},
              {label:"💧 Humedad actual (%)",val:hum,set:setHum,min:10,max:90,color:C.blue,ideal:"50–60 %"},
            ].map(({label,val,set,min,max,color,ideal})=>(
              <div key={label} style={{marginBottom:22}}>
                <div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:6}}>{label}</div>
                <div style={{fontSize:28,fontWeight:700,color,letterSpacing:"-0.03em",marginBottom:8}}>{val.toFixed(2)}</div>
                <input type="range" min={min} max={max} step={0.1} value={val} style={{width:"100%"}}
                  onChange={e=>set(parseFloat(e.target.value))}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:C.textDim,marginTop:4}}>
                  <span>{min}</span><span style={{color:C.textMid}}>Ideal: {ideal}</span><span>{max}</span>
                </div>
              </div>
            ))}
            {error&&(
              <div style={{background:`${C.red}10`,border:`1px solid ${C.red}40`,borderRadius:8,padding:"10px 12px",fontSize:10,color:C.red,marginBottom:14}}>
                ⚠ {error}
                <div style={{color:C.textDim,fontSize:8,marginTop:4}}>Verifica FastAPI en localhost:8000</div>
              </div>
            )}
            <button onClick={handleRun} disabled={loading} style={{
              width:"100%",padding:"13px 0",border:"none",borderRadius:8,
              background:loading?C.muted:`linear-gradient(135deg,${C.accent},#C97D10)`,
              color:loading?C.textDim:"#08090C",fontSize:10,fontWeight:700,
              letterSpacing:"0.18em",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",
              fontFamily:"'Space Mono',monospace",transition:"opacity 0.2s",
            }}>
              {loading?` PROCESANDO (${elapsed}s)…`:" Ejecutar Optimización"}
            </button>
          </Panel>

          <Panel glow={!!result}>
            <STitle icon="📊">Estado de la Colmena</STitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:12}}>
              <StatCard label="Temp. Entrada" value={temp.toFixed(1)} unit="°C" icon="🌡" color={temp>38?C.red:C.green} sub="34–35 °C"/>
              <StatCard label="Humedad Entrada" value={hum.toFixed(1)} unit="%" icon="💧" color={hum<50||hum>60?C.accent:C.green} sub="50–60 %"/>
              <StatCard label="Temp. Óptima (AG)" value={result?.mejor_intervencion_global?.temp??lastData?.temp??"—"} unit="°C" icon="✅" color={C.blue} sub="34–35 °C"/>
              <StatCard label="Hum. Óptima (AG)" value={result?.mejor_intervencion_global?.hum??lastData?.hum??"—"} unit="%" icon="💦" color={C.green} sub="50–60 %"/>
            </div>
            {result&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                <StatCard label="Ventilación Óptima" value={result.tabla_top3?.[0]?.vent} unit="%" icon="🌬" color={C.accent}/>
                <StatCard label="Agua Óptima" value={result.tabla_top3?.[0]?.agua} unit=" ml" icon="🫧" color={C.blue}/>
                <StatCard label="Jarabe Óptimo" value={result.tabla_top3?.[0]?.jarabe} unit=" g" icon="🍯" color={C.green}/>
                <StatCard label="Fitness Óptimo" value={result.tabla_top3?.[0]?.fitness} unit="" icon="🎯" color={C.purple}/>
              </div>
            )}
            {!result&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:110,color:C.textDim,gap:10}}>
                <span style={{fontSize:34}}>🐝</span>
                <span style={{fontSize:9,letterSpacing:"0.12em"}}>Ejecuta la optimización para ver resultados</span>
              </div>
            )}
          </Panel>
        </div>

        {result&&(<>

          <Panel className="fu" style={{marginBottom:18}}>
            <STitle icon="⭐" color={C.green}>Mejor Intervención Global — Minuto más óptimo de toda la simulación</STitle>
            <div style={{fontSize:10,color:C.textDim,marginBottom:14,background:`${C.green}08`,border:`1px solid ${C.green}22`,borderRadius:6,padding:"8px 14px"}}>
              El AG evaluó múltiples escenarios. Este es el minuto exacto donde encontró la combinación con <strong style={{color:C.green}}>menor fitness</strong> (solución más cercana al óptimo biológico de la colmena).
            </div>
            <BestBanner data={result.mejor_intervencion_global}/>
          </Panel>

          <Panel className="fu1" style={{marginBottom:18}}>
            <STitle icon="📋">Plan de Intervención Óptimo — Top 3 configuraciones</STitle>
            <div style={{fontSize:10,color:C.textDim,marginBottom:14,background:`${C.blue}08`,border:`1px solid ${C.blue}20`,borderRadius:6,padding:"8px 14px"}}>
              Las 3 configuraciones más costo-efectivas. <strong style={{color:C.green}}>Temp ideal 34–35 °C</strong> · <strong style={{color:C.blue}}>Hum ideal 50–60 %</strong> · Fitness <strong style={{color:C.accent}}>más bajo = más óptimo</strong>.
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead>
                <tr>
                  {["#","Opción","Temp Esperada","Hum Esperada","Ventilación","Agua (Esponja)","Jarabe (Bote)","Costo / Fitness"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:8,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.16em",borderBottom:`1px solid ${C.border}`,fontWeight:700}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.tabla_top3.map((row,i)=>{
                  const tOk=row.temp>=34&&row.temp<=35.5;
                  const hOk=row.hum>=50&&row.hum<=60.5;
                  return(
                    <tr key={i} style={{background:i===0?`${C.accent}06`:"transparent"}}>
                      <td style={{padding:"13px 14px",borderBottom:`1px solid ${C.border}18`}}>
                        {i===0?<span style={{display:"inline-block",padding:"3px 10px",background:`${C.accent}20`,border:`1px solid ${C.accent}50`,borderRadius:4,fontSize:8,color:C.accent,fontWeight:700}}>★ TOP</span>
                          :<span style={{color:C.muted,fontSize:10}}>{i}</span>}
                      </td>
                      <td style={{padding:"13px 14px",borderBottom:`1px solid ${C.border}18`}}><strong style={{color:i===0?C.accent:C.text}}>{row.opcion}</strong></td>
                      <td style={{padding:"13px 14px",borderBottom:`1px solid ${C.border}18`}}>
                        <span style={{color:tOk?C.green:C.red}}>{row.temp} °C</span>
                        {!tOk&&<span style={{fontSize:8,color:C.red,marginLeft:4}}>↑ fuera rango</span>}
                      </td>
                      <td style={{padding:"13px 14px",borderBottom:`1px solid ${C.border}18`}}>
                        <span style={{color:hOk?C.green:C.accent}}>{row.hum} %</span>
                        {!hOk&&<span style={{fontSize:8,color:C.accent,marginLeft:4}}>↑ fuera rango</span>}
                      </td>
                      <td style={{padding:"13px 14px",borderBottom:`1px solid ${C.border}18`}}>{row.vent} %</td>
                      <td style={{padding:"13px 14px",borderBottom:`1px solid ${C.border}18`}}>{row.agua} ml</td>
                      <td style={{padding:"13px 14px",borderBottom:`1px solid ${C.border}18`}}>{row.jarabe} g</td>
                      <td style={{padding:"13px 14px",borderBottom:`1px solid ${C.border}18`}}>
                        <span style={{display:"inline-block",padding:"3px 10px",background:i===0?`${C.green}18`:`${C.muted}18`,border:`1px solid ${i===0?C.green:C.muted}40`,borderRadius:4,fontSize:8,color:i===0?C.green:C.textMid,fontWeight:700}}>{row.fitness}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          <div className="fu2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>

            <Panel>
              <STitle icon="📈" color={C.red}>Simulación Proyectada de Riesgo</STitle>
              <div style={{fontSize:10,color:C.textDim,marginBottom:10,background:`${C.redDim}40`,border:`1px solid ${C.red}20`,borderRadius:6,padding:"8px 12px"}}>
                Temperatura en las próximas 2 h: <strong style={{color:C.red}}>sin actuar</strong> vs <strong style={{color:C.green}}>con BEEHIVECTRL</strong>
              </div>
              <LegRow items={[
                {color:C.red,dash:"6,3",label:"Sin Intervención (Riesgo)"},
                {color:C.green,label:"Con BEEHIVECTRL"},
                {color:C.green,label:"Zona segura 34–35 °C",note:"área"},
                {color:C.green,dash:"4,4",label:"Ideal 35 °C"},
              ]}/>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={riskData} margin={{top:4,right:14,bottom:22,left:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="minuto" stroke={C.muted} tick={{fontSize:9,fill:C.textDim}}
                    label={{value:"Minutos Proyectados",position:"insideBottom",offset:-14,fill:C.textDim,fontSize:9}}/>
                  <YAxis stroke={C.muted} tick={{fontSize:9,fill:C.textDim}}
                    label={{value:"Temperatura (°C)",angle:-90,position:"insideLeft",offset:8,fill:C.textDim,fontSize:9}}/>
                  <Tooltip content={<Tip/>}/>
                  <ReferenceArea y1={34} y2={35} fill={C.green} fillOpacity={0.1}/>
                  <ReferenceLine y={35} stroke={C.green} strokeDasharray="4 4" strokeWidth={1.5} strokeOpacity={0.7}/>
                  <Line type="monotone" dataKey="Sin Intervención" stroke={C.red} strokeDasharray="6 3" strokeWidth={2} dot={{r:3.5,fill:C.red}}/>
                  <Line type="monotone" dataKey="Con BEEHIVECTRL" stroke={C.green} strokeWidth={2.5} dot={{r:3.5,fill:C.green}}/>
                </LineChart>
              </ResponsiveContainer>
            </Panel>

            <Panel>
              <STitle icon="🧬" color={C.purple}>Convergencia del Algoritmo Genético</STitle>
              <div style={{fontSize:10,color:C.textDim,marginBottom:10,background:`${C.blueDim}40`,border:`1px solid ${C.blue}20`,borderRadius:6,padding:"8px 12px"}}>
                Evolución del fitness en 20 generaciones. <strong style={{color:C.blue}}>Fitness más bajo = mejor solución.</strong><br/>
              </div>

              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {result.historial_generaciones.map((h,i)=>(
                  <button key={i} onClick={()=>setSelMin(i)} style={{
                    padding:"4px 10px",border:`1px solid ${selMin===i?C.purple:C.border}`,
                    borderRadius:5,background:selMin===i?`${C.purple}20`:C.panelHi,
                    color:selMin===i?C.purple:C.textDim,fontSize:8,cursor:"pointer",
                    fontFamily:"'Space Mono',monospace",transition:"all 0.15s",
                  }}>min {h.minuto}</button>
                ))}
              </div>

              <LegRow items={[
                {color:C.accent,label:"Aptitud Promedio (Población)"},
                {color:C.blue,dash:"4,2",label:"Aptitud Mejor Individuo"},
                ...(bestGenIdx!==null?[{color:C.green,label:`★ Generación más óptima: #${bestGenIdx+1}`}]:[]),
              ]}/>

              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={convData} margin={{top:4,right:14,bottom:22,left:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="gen" stroke={C.muted} tick={{fontSize:9,fill:C.textDim}}
                    label={{value:"Generaciones",position:"insideBottom",offset:-14,fill:C.textDim,fontSize:9}}/>
                  <YAxis stroke={C.muted} tick={{fontSize:9,fill:C.textDim}}
                    label={{value:"Fitness",angle:-90,position:"insideLeft",offset:8,fill:C.textDim,fontSize:9}}/>
                  <Tooltip content={<Tip/>}/>
                  {bestGenIdx!==null&&(
                    <ReferenceLine x={bestGenIdx+1} stroke={C.green} strokeDasharray="4 4" strokeWidth={1.5}
                      label={{value:"★",fill:C.green,fontSize:12,position:"top"}}/>
                  )}
                  <Line type="monotone" dataKey="Promedio Población" stroke={C.accent} strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="Mejor Individuo" stroke={C.blue} strokeWidth={2.5} dot={false} strokeDasharray="4 2"/>
                  {bestGenIdx!==null&&convData[bestGenIdx]&&(
                    <ReferenceDot x={convData[bestGenIdx].gen} y={convData[bestGenIdx]["Mejor Individuo"]}
                      r={6} fill={C.green} stroke={C.panel} strokeWidth={2}/>
                  )}
                </LineChart>
              </ResponsiveContainer>

              {histSel&&(
                <div style={{
                  marginTop:12,padding:"10px 14px",
                  background:`${C.purple}08`,border:`1px solid ${C.purple}25`,borderRadius:8,
                  display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,
                }}>
                  {[
                    {label:"Ventilación",value:`${histSel.mejor_accion.vent}%`},
                    {label:"Agua",value:`${histSel.mejor_accion.agua} ml`},
                    {label:"Jarabe",value:`${histSel.mejor_accion.jarabe} g`},
                    {label:"Fitness",value:histSel.mejor_fitness},
                  ].map(({label,value})=>(
                    <div key={label} style={{textAlign:"center"}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.purple,fontFamily:"'Space Mono',monospace"}}>{value}</div>
                      <div style={{fontSize:7,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.12em",marginTop:3}}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="fu3" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>

            <Panel>
              <STitle icon="🌡" color={C.red}>Temperatura Interna vs Tiempo</STitle>
              <LegRow items={[
                {color:C.red,label:"Temp. optimizada por el AG"},
                {color:C.green,label:"Zona ideal 34–35 °C",note:"área sombreada"},
                {color:C.green,dash:"4,4",label:"Ideal 35 °C"},
                {color:C.accent,dash:"3,3",label:"Temperatura de entrada"},
              ]}/>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.data_simulacion} margin={{top:8,right:24,bottom:22,left:8}}>
                  <defs>
                    <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.red} stopOpacity={0.35}/>
                      <stop offset="95%" stopColor={C.red} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="minuto" stroke={C.muted} tick={{fontSize:9,fill:C.textDim}}
                    label={{value:"Minutos",position:"insideBottom",offset:-14,fill:C.textDim,fontSize:9}}/>
                  <YAxis stroke={C.muted} tick={{fontSize:9,fill:C.textDim}}
                    domain={([dataMin,dataMax])=>{
                      const lo = Math.min(dataMin, 33);
                      const hi = Math.max(dataMax, temp+1);
                      const pad = (hi-lo)*0.12;
                      return [Math.floor(lo-pad), Math.ceil(hi+pad)];
                    }}
                    label={{value:"Temperatura (°C)",angle:-90,position:"insideLeft",offset:8,fill:C.textDim,fontSize:9}}/>
                  <Tooltip content={<Tip/>}/>
                  {/* Zona ideal sombreada */}
                  <ReferenceArea y1={34} y2={35} fill={C.green} fillOpacity={0.13}/>
                  {/* Línea ideal */}
                  <ReferenceLine y={35} stroke={C.green} strokeDasharray="4 4" strokeWidth={1.5} strokeOpacity={0.9}
                    label={{value:"Ideal 35 °C",position:"right",fill:C.green,fontSize:8}}/>
                  {/* Línea de temperatura inicial */}
                  <ReferenceLine y={temp} stroke={C.accent} strokeDasharray="3 3" strokeWidth={1.5} strokeOpacity={0.7}
                    label={{value:`Entrada ${temp.toFixed(1)} °C`,position:"right",fill:C.accent,fontSize:8}}/>
                  <Area type="monotone" dataKey="temp" name="Temp. Interna Real (°C)" stroke={C.red} strokeWidth={2.5} fill="url(#gT)" dot={{r:4,fill:C.red,stroke:C.panel,strokeWidth:1.5}}/>
                </AreaChart>
              </ResponsiveContainer>
            </Panel>

            <Panel>
              <STitle icon="💧" color={C.blue}>Humedad Relativa vs Tiempo</STitle>
              <LegRow items={[
                {color:C.green,label:"Humedad Interna Real"},
                {color:C.green,label:"Zona ideal 50–60 %",note:"área"},
                {color:C.blue,dash:"4,4",label:"Límite inferior 50 %"},
                {color:C.blue,dash:"4,4",label:"Límite superior 60 %"},
              ]}/>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.data_simulacion} margin={{top:4,right:14,bottom:22,left:4}}>
                  <defs>
                    <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.green} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="minuto" stroke={C.muted} tick={{fontSize:9,fill:C.textDim}}
                    label={{value:"Minutos",position:"insideBottom",offset:-14,fill:C.textDim,fontSize:9}}/>
                  <YAxis stroke={C.muted} tick={{fontSize:9,fill:C.textDim}} domain={[30,75]}
                    label={{value:"Humedad (%)",angle:-90,position:"insideLeft",offset:8,fill:C.textDim,fontSize:9}}/>
                  <Tooltip content={<Tip/>}/>
                  <ReferenceArea y1={50} y2={60} fill={C.green} fillOpacity={0.1}/>
                  <ReferenceLine y={50} stroke={C.blue} strokeDasharray="4 4" strokeWidth={1.5} strokeOpacity={0.8}/>
                  <ReferenceLine y={60} stroke={C.blue} strokeDasharray="4 4" strokeWidth={1.5} strokeOpacity={0.8}/>
                  <Area type="monotone" dataKey="hum" name="Humedad Interna Real (%)" stroke={C.green} strokeWidth={2} fill="url(#gH)" dot={{r:3.5,fill:C.green}}/>
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <Panel className="fu4" style={{marginBottom:18}}>
            <STitle icon="🔧">Recursos Utilizados por Intervención</STitle>
            <LegRow items={[
              {color:C.blue,label:"Agua (ml)"},
              {color:C.accent,label:"Jarabe (g)"},
              {color:C.green,label:"Ventilación (%)"},
            ]}/>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={result.data_simulacion} margin={{top:4,right:14,bottom:22,left:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="minuto" stroke={C.muted} tick={{fontSize:9,fill:C.textDim}}
                  label={{value:"Minutos",position:"insideBottom",offset:-14,fill:C.textDim,fontSize:9}}/>
                <YAxis stroke={C.muted} tick={{fontSize:9,fill:C.textDim}}
                  label={{value:"Cantidad",angle:-90,position:"insideLeft",offset:8,fill:C.textDim,fontSize:9}}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="agua" name="Agua (ml)" fill={C.blue} fillOpacity={0.85} radius={[3,3,0,0]}/>
                <Bar dataKey="jarabe" name="Jarabe (g)" fill={C.accent} fillOpacity={0.85} radius={[3,3,0,0]}/>
                <Bar dataKey="vent" name="Ventilación (%)" fill={C.green} fillOpacity={0.5} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel style={{marginBottom:18}}>
            <STitle icon="🖥">Log Textual del AG</STitle>
            <div ref={logRef} style={{
              background:"#060709",border:`1px solid ${C.border}`,borderRadius:8,
              padding:16,height:210,overflowY:"auto",fontSize:10,lineHeight:1.9,
              fontFamily:"'Space Mono',monospace",
            }}>
              {result.logs.map((line,i)=>(
                <div key={i} style={{
                  color:line.includes("DECISIÓN")?C.accent:line.includes("RESULTADO")?C.green:line.includes("SENSOR")?C.blue:C.textDim,
                  paddingLeft:line.startsWith("  ")?16:0,
                }}>{line||<br/>}</div>
              ))}
            </div>
          </Panel>
        </>)}

        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:8,color:C.muted,letterSpacing:"0.12em"}}>BEEHIVECTRL · AG Dinámico · FastAPI + React + Recharts</span>
          <span style={{fontSize:8,color:C.muted}}>API → localhost:8000</span>
        </div>
      </main>
    </div>
  );
}
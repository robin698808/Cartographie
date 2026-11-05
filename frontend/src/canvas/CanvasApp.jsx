import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import CanvasHome from './CanvasHome';
import { ItsiBudgetWidget, ItsiPatrimoineWidget } from './ItsiWidgets';
import {
  COST_TYPES, COST_COLORS, HOSTING_OPTS, HOSTING_COLORS, APPTYPE_OPTS, APPTYPE_COLORS, EOS_BUCKETS, ITSI_FIELDS, DEAL_ONLY_PATTERNS,
  normText, parseAmount, parseDate, canonOption, eosBucket, formatEuro, formatDateFr,
} from './itsi';

// Dynamic imports — these heavy libs (XLSX ~816KB, PptxGenJS ~505KB) load only when
/*
    if(!urbZone){
      var isDarkMode=!!isDark;
      var criticalApps=apps.filter(function(a){return a.criticality==="Haute";});
      var connectedCriticalApps=criticalApps.filter(function(a){return flows.some(function(f){return f.from===a.id||f.to===a.id;});});
      var dayOneCriticalApps=connectedCriticalApps.filter(function(a){return !!a.statusD1;});
      var dayTwoCriticalApps=dayOneCriticalApps.filter(function(a){return !!a.statusD2;});
      var funnelStages=[
        {label:"Applications du périmètre",value:apps.length,color:"#6366F1",hint:"Inventaire complet"},
        {label:"Applications critiques",value:criticalApps.length,color:"#F97316",hint:"Criticité haute"},
        {label:"Critiques connectées",value:connectedCriticalApps.length,color:"#06B6D4",hint:"Au moins un flux"},
        {label:"Stratégie Day 1 définie",value:dayOneCriticalApps.length,color:"#10B981",hint:"Parmi les critiques reliées"},
        {label:"Cible Day 2 définie",value:dayTwoCriticalApps.length,color:"#8B5CF6",hint:"Parcours qualifié"}
      ];
      var domainRanked=allDoms2.map(function(dom){
        var domApps=apps.filter(function(a){return a.domain===dom;});
        var domFlows=flows.filter(function(f){
          var fa=apps.find(function(a){return a.id===f.from;});
          var ta=apps.find(function(a){return a.id===f.to;});
          return (fa&&fa.domain===dom)||(ta&&ta.domain===dom);
        }).length;
        return {name:dom,apps:domApps.length,flows:domFlows,critical:domApps.filter(function(a){return a.criticality==="Haute";}).length,d1:domApps.filter(function(a){return !!a.statusD1;}).length,d2:domApps.filter(function(a){return !!a.statusD2;}).length,color:(DC[dom]||DC.Autre).ac};
      }).sort(function(a,b){return b.apps-a.apps;});
      var maxDomainApps=Math.max.apply(null,domainRanked.map(function(d){return d.apps;}).concat([1]));
      var totalCriticalFlows=flows.filter(function(f){
        var fa=apps.find(function(a){return a.id===f.from;});
        var ta=apps.find(function(a){return a.id===f.to;});
        return (fa&&fa.criticality==="Haute")||(ta&&ta.criticality==="Haute");
      }).length;
      var funnelBg=isDarkMode?"#10131f":"#ffffff";
      var funnelMuted=isDarkMode?"#9298ac":"#687187";
      var funnelLine=isDarkMode?"rgba(148,163,184,0.14)":"rgba(71,85,105,0.14)";
      var funnelCard={background:funnelBg,border:"1px solid "+funnelLine,borderRadius:18,boxShadow:isDarkMode?"0 18px 50px rgba(0,0,0,0.2)":"0 16px 42px rgba(15,23,42,0.06)"};
      return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg,minWidth:0}}>
        <UrbTopbar/>
        <div style={{flex:1,overflow:"auto",padding:"30px clamp(18px, 4vw, 56px) 48px",background:isDarkMode?"radial-gradient(ellipse at 68% 0%, rgba(99,102,241,0.10), transparent 42%), "+T.bg:"radial-gradient(ellipse at 68% 0%, rgba(99,102,241,0.08), transparent 42%), "+T.bg}}>
          <div style={{maxWidth:1320,margin:"0 auto"}}>
            <section style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:24,marginBottom:26,flexWrap:"wrap"}}>
              <div>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:999,background:"rgba(99,102,241,0.12)",color:isDarkMode?"#a5b4fc":"#4f46e5",fontSize:10,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>
                  <span style={{width:7,height:7,borderRadius:99,background:"#818cf8",boxShadow:"0 0 12px #818cf8"}}/>Vue macro · Architecture SI
                </div>
                <h1 style={{fontSize:"clamp(26px, 3vw, 38px)",lineHeight:1.08,letterSpacing:"-0.045em",fontWeight:850,color:T.fg,margin:0}}>L’essentiel de votre SI,<br/><span style={{background:"linear-gradient(90deg,#818cf8,#22d3ee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>en un regard.</span></h1>
                <p style={{fontSize:13,color:funnelMuted,margin:"12px 0 0",maxWidth:650,lineHeight:1.65}}>Une lecture progressive du portefeuille applicatif, des domaines métiers jusqu’à la préparation des applications critiques.</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 13px",borderRadius:12,border:"1px solid "+funnelLine,background:isDarkMode?"rgba(15,23,42,0.52)":"rgba(255,255,255,0.76)",color:funnelMuted,fontSize:11}}>
                <span style={{width:8,height:8,borderRadius:99,background:apps.length?"#34d399":"#fbbf24"}}/>
                {apps.length?"Données du projet à jour":"Aucune application dans le périmètre"}
              </div>
            </section>

            <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:18}}>
              {[
                {label:"Domaines métiers",value:allDoms2.length,caption:"périmètres représentés",color:"#818cf8",icon:"◈"},
                {label:"Applications",value:apps.length,caption:"dans le portefeuille",color:"#22d3ee",icon:"▦"},
                {label:"Flux cartographiés",value:flows.length,caption:"échanges recensés",color:"#34d399",icon:"↗"},
                {label:"Applications critiques",value:criticalApps.length,caption:totalCriticalFlows+" flux impliquant une app critique",color:"#fb923c",icon:"◇"}
              ].map(function(kpi,i){return <div key={kpi.label} style={{...funnelCard,padding:"16px 18px",position:"relative",overflow:"hidden",animation:"cardIn 0.3s cubic-bezier(0.16,1,0.3,1) both",animationDelay:(i*0.05)+"s"}}>
                <div style={{position:"absolute",right:-10,top:-17,fontSize:70,color:kpi.color,opacity:isDarkMode?0.08:0.1,fontWeight:800,lineHeight:1}}>{kpi.icon}</div>
                <div style={{fontSize:10,fontWeight:750,letterSpacing:"0.09em",textTransform:"uppercase",color:funnelMuted}}>{kpi.label}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:10}}><span style={{fontSize:31,fontWeight:850,letterSpacing:"-0.05em",lineHeight:1,color:T.fg,fontVariantNumeric:"tabular-nums"}}>{kpi.value}</span><span style={{width:7,height:7,borderRadius:9,background:kpi.color}}/></div>
                <div style={{fontSize:10,color:funnelMuted,marginTop:7}}>{kpi.caption}</div>
              </div>;})}
            </section>

            <section style={{display:"grid",gridTemplateColumns:"minmax(0,1.3fr) minmax(320px,0.9fr)",gap:16,alignItems:"stretch"}}>
              <div style={{...funnelCard,padding:"22px clamp(18px, 3vw, 34px) 26px",minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:20}}>
                  <div><div style={{fontSize:15,fontWeight:800,color:T.fg,letterSpacing:"-0.02em"}}>Parcours de qualification</div><div style={{fontSize:11,color:funnelMuted,marginTop:5}}>Zoom progressif sur les applications à enjeu</div></div>
                  <span style={{fontSize:10,color:isDarkMode?"#c4b5fd":"#6d28d9",background:"rgba(139,92,246,0.12)",border:"1px solid rgba(139,92,246,0.22)",padding:"5px 9px",borderRadius:999,fontWeight:700,whiteSpace:"nowrap"}}>Focus criticité haute</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"4px 0 14px"}}>
                  {funnelStages.map(function(stage,i){
                    var previous=i===0?apps.length:funnelStages[i-1].value;
                    var rate=previous?Math.round(stage.value/previous*100):0;
                    var relative=apps.length?stage.value/apps.length:0;
                    var width=Math.max(48,Math.min(100,relative*100));
                    return <div key={stage.label} style={{width:width+"%",minHeight:66,position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"10px clamp(16px, 4vw, 32px)",boxSizing:"border-box",clipPath:"polygon(4% 0, 96% 0, 89% 100%, 11% 100%)",background:"linear-gradient(105deg,"+stage.color+(isDarkMode?"30":"20")+", "+stage.color+(isDarkMode?"12":"0b")+" 75%)",borderTop:"1px solid "+stage.color+"50",animation:"cardIn 0.35s cubic-bezier(0.16,1,0.3,1) both",animationDelay:(i*0.07)+"s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0}}><span style={{flexShrink:0,width:27,height:27,borderRadius:9,display:"grid",placeItems:"center",background:stage.color+"22",color:stage.color,fontSize:11,fontWeight:850}}>{String(i+1).padStart(2,"0")}</span><div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:750,color:T.fg,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{stage.label}</div><div style={{fontSize:9,color:funnelMuted,marginTop:3}}>{stage.hint}</div></div></div>
                      <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}><span style={{fontSize:9,color:funnelMuted,background:isDarkMode?"rgba(15,23,42,0.45)":"rgba(255,255,255,0.62)",padding:"4px 7px",borderRadius:99}}>{i===0?"100%":rate+"%"}</span><span style={{fontSize:22,fontWeight:850,color:T.fg,letterSpacing:"-0.04em",fontVariantNumeric:"tabular-nums"}}>{stage.value}</span></div>
                    </div>;
                  })}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"11px 13px",borderRadius:11,background:isDarkMode?"rgba(15,23,42,0.72)":"#f8fafc",border:"1px solid "+funnelLine,fontSize:10,color:funnelMuted,lineHeight:1.55}}><span style={{color:"#818cf8",fontSize:15}}>ⓘ</span><span>Chaque étape conserve les filtres précédents : les taux indiquent la conversion depuis l’étape précédente.</span></div>
              </div>

              <div style={{...funnelCard,padding:"22px 22px 18px",minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:17}}><div><div style={{fontSize:15,fontWeight:800,color:T.fg,letterSpacing:"-0.02em"}}>Domaines métiers</div><div style={{fontSize:11,color:funnelMuted,marginTop:5}}>Sélectionnez un domaine pour explorer</div></div><span style={{fontSize:10,color:funnelMuted,background:isDarkMode?"rgba(148,163,184,0.1)":"#f1f5f9",padding:"5px 8px",borderRadius:7}}>{allDoms2.length} domaines</span></div>
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  {domainRanked.slice(0,8).map(function(dom,i){
                    var pct=Math.round(dom.apps/maxDomainApps*100);
                    var coverage=dom.apps?Math.round(dom.d2/dom.apps*100):0;
                    return <div key={dom.name} role="button" tabIndex={0} onClick={function(){setUrbZone(dom.name);setUrbSelApp(null);setUrbFlowPair(null);}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();setUrbZone(dom.name);setUrbSelApp(null);setUrbFlowPair(null);}}} style={{display:"grid",gridTemplateColumns:"minmax(82px,0.85fr) minmax(65px,1.4fr) 34px",alignItems:"center",gap:10,padding:"9px 8px",borderRadius:10,cursor:"pointer",transition:"background 0.15s ease"}} onMouseEnter={function(e){e.currentTarget.style.background=isDarkMode?"rgba(148,163,184,0.08)":"#f8fafc";}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
                      <div style={{minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{display:"inline-block",width:7,height:7,borderRadius:8,background:dom.color,marginRight:6}}/>{dom.name}</div><div style={{fontSize:9,color:funnelMuted,marginTop:3}}>{dom.flows} flux · {dom.critical} critiques</div></div>
                      <div style={{height:7,borderRadius:99,background:isDarkMode?"rgba(148,163,184,0.13)":"#e9edf5",overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",borderRadius:99,background:"linear-gradient(90deg,"+dom.color+", "+dom.color+"99)",transition:"width 0.5s ease"}}/></div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:800,color:T.fg,fontVariantNumeric:"tabular-nums"}}>{dom.apps}</div><div style={{fontSize:8,color:funnelMuted}}>{coverage}% D2</div></div>
                    </div>;
                  })}
                  {domainRanked.length===0&&<div style={{padding:"34px 12px",textAlign:"center",fontSize:11,color:funnelMuted}}>Ajoutez des applications pour voir les domaines.</div>}
                </div>
                {domainRanked.length>8&&<div style={{padding:"9px 8px 0",fontSize:10,color:funnelMuted,borderTop:"1px solid "+funnelLine,marginTop:8}}>+ {domainRanked.length-8} autres domaines · cliquez sur un domaine dans la liste pour l’explorer</div>}
              </div>
            </section>

            {interDomLinks.length>0&&<section style={{...funnelCard,marginTop:16,overflow:"hidden"}}>
              <div style={{padding:"17px 22px",borderBottom:"1px solid "+funnelLine,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><div style={{fontSize:14,fontWeight:800,color:T.fg}}>Connexions entre domaines</div><div style={{fontSize:10,color:funnelMuted,marginTop:4}}>Les échanges qui structurent le paysage applicatif</div></div><span style={{fontSize:10,color:"#22d3ee",background:"rgba(34,211,238,0.10)",border:"1px solid rgba(34,211,238,0.2)",padding:"5px 9px",borderRadius:99,fontWeight:700}}>{interDomLinks.length} liaisons</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))"}}>{interDomLinks.slice(0,6).map(function(link,i){var c1=(DC[link.d1]||DC.Autre).ac;var c2=(DC[link.d2]||DC.Autre).ac;return <div key={i} onClick={function(){setUrbZone(link.d1);setUrbSelApp(null);setUrbFlowPair(null);}} style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:9,borderRight:"1px solid "+funnelLine,borderBottom:"1px solid "+funnelLine,cursor:"pointer"}}>
                <span style={{fontSize:10,fontWeight:700,color:c1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link.d1}</span><span style={{fontSize:9,color:funnelMuted}}>→</span><span style={{fontSize:10,fontWeight:700,color:c2,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{link.d2}</span><span style={{fontSize:10,fontWeight:800,color:T.fg,background:isDarkMode?"rgba(148,163,184,0.12)":"#f1f5f9",padding:"4px 7px",borderRadius:7,fontVariantNumeric:"tabular-nums"}}>{link.cnt}</span>
              </div>;})}</div>
            </section>}
          </div>
        </div>
      </div></div></AppCtx.Provider>;
    }
*/
// the user triggers an import/export action, not on initial canvas open.
let XLSX = null;
let PptxGenJS = null;
const ensureXLSX  = async () => { if (!XLSX)       XLSX       = await import('xlsx'); };
const ensurePptx  = async () => { if (!PptxGenJS)  PptxGenJS  = (await import('pptxgenjs')).default; };


const DC_DEFAULT = {
  Finance:{bg:"#0A2E1C",fg:"#D4FFED",ac:"#00C853"},
  RH:{bg:"#1A0A3E",fg:"#E4DAFF",ac:"#7C4DFF"},
  IT:{bg:"#0A1E3E",fg:"#CCE5FF",ac:"#2979FF"},
  Commercial:{bg:"#3E0A0A",fg:"#FFD6D6",ac:"#FF5252"},
  Production:{bg:"#3E2800",fg:"#FFF0C2",ac:"#EF6C00"},
  Logistique:{bg:"#0A3E36",fg:"#C8F7F0",ac:"#00BFA5"},
  Marketing:{bg:"#3E0A22",fg:"#FFDCE8",ac:"#FF4081"},
  Juridique:{bg:"#0A2E3E",fg:"#D0F0FF",ac:"#26C6DA"},
  Direction:{bg:"#14103E",fg:"#DEDCFF",ac:"#536DFE"},
  Autre:{bg:"#2A2A2A",fg:"#E0E0E0",ac:"#78909C"},
};
const acToPalette=(ac)=>{
  const r=parseInt(ac.slice(1,3),16),g=parseInt(ac.slice(3,5),16),b=parseInt(ac.slice(5,7),16);
  const bg="#"+[r,g,b].map(v=>Math.round(v*0.15).toString(16).padStart(2,"0")).join("");
  const fg="#"+[r,g,b].map(v=>Math.min(255,Math.round(v*0.4+180)).toString(16).padStart(2,"0")).join("");
  return {bg,fg,ac};
};
// Texte lisible sur fond clair à partir d'une couleur d'accent quelconque (même très
// claire/pastel) : on assombrit la teinte par recherche dichotomique jusqu'à atteindre une
// luminance perçue cible (~0.15, ≈ contraste 5:1 sur fond blanc), en conservant teinte et
// saturation. Une simple clarté HSL fixe ne suffit pas : à HSL identique, jaune/vert restent
// perçus bien plus clairs que bleu/rouge — d'où la recherche par luminance réelle plutôt que HSL brut.
const accentTextForLight=(hex)=>{
  const r0=parseInt(hex.slice(1,3),16)/255,g0=parseInt(hex.slice(3,5),16)/255,b0=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r0,g0,b0),min=Math.min(r0,g0,b0);let h=0,s=0;const l0=(max+min)/2;
  if(max!==min){
    const d=max-min;
    s=l0>0.5?d/(2-max-min):d/(max+min);
    if(max===r0)h=(g0-b0)/d+(g0<b0?6:0);else if(max===g0)h=(b0-r0)/d+2;else h=(r0-g0)/d+4;
    h/=6;
  }
  const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
  const hslToRgb=(l)=>{
    if(s===0)return [l,l,l];
    const q=l<0.5?l*(1+s):l+s-l*s;const p=2*l-q;
    return [hue2rgb(p,q,h+1/3),hue2rgb(p,q,h),hue2rgb(p,q,h-1/3)];
  };
  const relLum=(rgb)=>{
    const f=(v)=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);
    return 0.2126*f(rgb[0])+0.7152*f(rgb[1])+0.0722*f(rgb[2]);
  };
  let lo=0.02,hi=0.55,target=0.15;
  for(let i=0;i<14;i++){
    const mid=(lo+hi)/2;
    if(relLum(hslToRgb(mid))>target)hi=mid;else lo=mid;
  }
  const rgb=hslToRgb((lo+hi)/2);
  return "#"+rgb.map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("");
};
var THEMES={dark:{bg:"#08080F",bgAlt:"#0D0D1A",bgCard:"#13132A",bgInput:"#0D0D1A",bgHover:"#1C1C38",fg:"#F0F0FB",fgMuted:"#8080B0",fgDim:"#5A5A85",fgFaint:"#3A3A60",border:"#22224A",borderLight:"#1A1A3A",overlay:"#000000A8",grid:"#111128",shadow:"var(--shadow-md)",accent:"#6366F1",accentMuted:"#6366F118",pres:"#05050A"},light:{bg:"#F2F4F9",bgAlt:"#E8ECF4",bgCard:"#FBFCFF",bgInput:"#FFFFFF",bgHover:"#E1E7F1",fg:"#182033",fgMuted:"#536078",fgDim:"#69758D",fgFaint:"#8792A7",border:"#CBD4E2",borderLight:"#DEE4ED",overlay:"#11182738",grid:"#D5DDE9",shadow:"0 8px 26px rgba(30,41,59,.08)",accent:"#5965D8",accentMuted:"#5965D815",pres:"#F6F8FC"}};
const ALLDOM_DEFAULT = Object.keys(DC_DEFAULT);
const CC = {Haute:"#FF5252",Moyenne:"#EF6C00",Basse:"#00C853"};
const SD1={"Transfert TSA":"#F59E0B","Abandon":"#EF4444","Maintien":"#10B981","Rebuild":"#6366F1"};
const SD2={"Clone & Clean":"#3B82F6","Transfert":"#10B981","Abandon":"#EF4444","Rebuild":"#8B5CF6"};
const D1_OPTS=["","Transfert TSA","Maintien","Rebuild","Abandon"];
const D2_OPTS=["","Clone & Clean","Transfert","Abandon","Rebuild"];
const STATUT_OPTS=["","Actif","Actif dégradé","Legacy","En décommissionnement","Décommissionné","En maintenance","Suspendu","Inconnu","Cible","À refondre","À migrer","À consolider","À décommissionner","À remplacer","À créer","En étude"];
const STATUT_COLORS={"Actif":"#10B981","Actif dégradé":"#F59E0B","Legacy":"#8B5CF6","En décommissionnement":"#EF4444","Décommissionné":"#6B7280","En maintenance":"#3B82F6","Suspendu":"#F97316","Inconnu":"#9CA3AF","Cible":"#06B6D4","À refondre":"#EC4899","À migrer":"#14B8A6","À consolider":"#A78BFA","À décommissionner":"#F87171","À remplacer":"#FB923C","À créer":"#34D399","En étude":"#60A5FA"};
const PROTOS = ["API","REST","SOAP","SFTP","ETL","JDBC","ODBC","Webhook","MQ","Batch","Manuel","Fichier","Autre"];
const FREQS = ["","Temps réel","Horaire","Journalier","Hebdomadaire","Mensuel","À la demande"];
const uid = () => Math.random().toString(36).slice(2,10);


const FIELDS = [
  {key:"name",label:"Nom application",req:true},{key:"domain",label:"Domaine",req:true},{key:"category",label:"Catégorie (niveau 1)"},
  {key:"description",label:"Description"},{key:"criticality",label:"Criticité"},
  {key:"vendor",label:"Éditeur / Fournisseur"},{key:"version",label:"Version"},{key:"owner",label:"Responsable"},
  {key:"users",label:"Nb utilisateurs"},{key:"statut",label:"Statut"},{key:"statusD1",label:"Statut Day 1"},{key:"statusD2",label:"Statut Day 2"},{key:"flowTo",label:"Flux vers (séparés par |)"},{key:"flowProtocol",label:"Protocole flux"},{key:"flowLabel",label:"Objet du flux (séparés par |)"},
];

// Champs propres au type de projet : Day 1 / Day 2 pour Deal IT/TECH, patrimoine & coûts pour IT/SI
const ALL_FIELDS = [...FIELDS, ...ITSI_FIELDS.map(f=>({key:f.key,label:f.label,itsi:true}))];
const fieldsFor = (projectType) => ALL_FIELDS.filter(f=>projectType==='deal'||(f.key!=="statusD1"&&f.key!=="statusD2"));

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length<2)return[];
  const hd = lines[0].split(/[;,\t]/).map(s=>s.trim().replace(/^"|"$/g,""));
  return lines.slice(1).map(line=>{
    const v=line.split(/[;,\t]/).map(s=>s.trim().replace(/^"|"$/g,""));
    const o={}; hd.forEach((h,i)=>o[h]=v[i]||""); return o;
  });
};

const STATUT_DEFS = [
  ["Actif","Application en production, utilisée activement et maintenue. Aucune anomalie bloquante connue."],
  ["Actif dégradé","En production mais avec une dette technique importante, des anomalies connues non résolues ou sans maintenance active."],
  ["Legacy","Technologie obsolète, non maintenable techniquement, mais toujours critique pour le fonctionnement métier."],
  ["En décommissionnement","Décision d'arrêt formellement prise. Le processus de retrait et de migration est en cours."],
  ["Décommissionné","Application définitivement arrêtée. Conservée dans le référentiel pour traçabilité et mémoire du patrimoine."],
  ["En maintenance","Temporairement indisponible dans le cadre d'une maintenance planifiée (patch, upgrade, migration infra)."],
  ["Suspendu","Arrêt temporaire sans décision définitive prise à ce stade. La reprise ou l'arrêt reste à décider."],
  ["Inconnu","Statut non encore déterminé. À investiguer en priorité — fréquent lors d'une phase de découverte du patrimoine."],
  ["Cible","Application retenue dans l'architecture future. À maintenir, fiabiliser ou faire évoluer à l'horizon cible."],
  ["À refondre","Les fonctions sont conservées mais une refonte technique et/ou fonctionnelle profonde est nécessaire."],
  ["À migrer","Les fonctions seront transférées vers une autre application cible identifiée dans la cartographie."],
  ["À consolider","Fusion planifiée avec une ou plusieurs autres applications pour réduire la redondance du patrimoine."],
  ["À décommissionner","Sortie définitive du patrimoine planifiée à l'horizon cible. Aucune reprise fonctionnelle prévue."],
  ["À remplacer","Remplacement par un nouvel outil : progiciel (COTS), solution SaaS ou développement spécifique."],
  ["À créer","Nouvelle application inexistante dans le As-Is, identifiée comme nécessaire pour couvrir un besoin cible."],
  ["En étude","Décision non encore arrêtée. En cours d'analyse (build vs buy, périmètre fonctionnel, opportunité)."],
];

const downloadTemplate = async (projectType = "deal") => {
  await ensureXLSX();
  const isDeal = projectType === "deal";
  const wb = XLSX.utils.book_new();
  const hdr = isDeal
    ? ["Nom Application","Catégorie","Domaine","Description","Criticité","Éditeur / Fournisseur","Version","Responsable","Nb Utilisateurs","Statut Day 1","Statut Day 2","Flux vers (séparés par |)","Protocole flux","Objet du flux (séparés par |)","Commentaires","Coût annuel (€)","Coût mensuel (€)","Type de coût","Nb licences","Hébergement","Type d'application","Date de fin de mise en service"]
    : ["Nom Application","Catégorie","Domaine","Description","Criticité","Éditeur / Fournisseur","Version","Responsable","Nb Utilisateurs","Statut","Coût annuel (€)","Coût mensuel (€)","Type de coût","Nb licences","Hébergement","Type d'application","Date de fin de mise en service","Flux vers (séparés par |)","Protocole flux","Objet du flux (séparés par |)","Commentaires"];
  const dealRows = [
    ["SAP S/4HANA","Opérations Cœur","Finance","ERP central","Haute","SAP SE","S/4HANA 2023","J. Dupont",250,"Transfert TSA","Clone & Clean","Salesforce|Power BI","API|API","Données clients|Reporting financier","Système central"],
    ["Salesforce","Commercial","CRM","Haute","Salesforce Inc.","Enterprise","M. Martin",120,"Transfert TSA","Transfert","SAP S/4HANA|Mailchimp","API|REST","Commandes|Contacts marketing",""],
    ["Power BI","IT","Business Intelligence","Moyenne","Microsoft","Pro","A. Bernard",80,"Transfert TSA","Clone & Clean","","","",""],
    ["ADP","RH","Paie et gestion RH","Haute","ADP","v12","L. Petit",15,"Abandon","Rebuild","SAP S/4HANA","SFTP","Écritures de paie",""],
    ["Mailchimp","Marketing","Emailing marketing","Basse","Intuit","Premium","S. Moreau",10,"Maintien","","","","",""],
    ["Jira","IT","Gestion de projet IT","Moyenne","Atlassian","Cloud","P. Durand",45,"Transfert TSA","Clone & Clean","Confluence","REST","Documentation technique",""],
    ["WMS Reflex","Logistique","Gestion d'entrepôt","Haute","Hardis Group","v6.2","C. Roux",35,"Rebuild","Rebuild","SAP S/4HANA","API","Mouvements de stock",""],
    ["DocuSign","Juridique","Signature électronique","Moyenne","DocuSign","Enterprise","N. Blanc",30,"Transfert TSA","Transfert","Salesforce","API","Contrats signés",""],
    ["MES Wonderware","Production","Pilotage atelier","Haute","AVEVA","2023","F. Garcia",40,"Abandon","Clone & Clean","SAP S/4HANA|WMS Reflex","API|MQ","Ordres de fabrication|Bons de sortie",""],
    ["Workday","RH","Gestion des talents","Moyenne","Workday","2024R1","L. Petit",0,"Transfert TSA","Transfert","ADP","API","Données collaborateurs","Déploiement S2 2025"],
  ];
  const dealExtra = [[420000,"","OPEX",250,"On-premise","Progiciel (COTS)","2030-12-31"],["",15000,"OPEX",120,"SaaS","Progiciel (COTS)","2027-03-31"],[45000,"","OPEX",80,"SaaS","Progiciel (COTS)",""],[95000,"","OPEX",15,"SaaS","Progiciel (COTS)","2026-12-31"]];
  const dealEx = dealRows.map((r,i)=>(i===0?r:[r[0],"",...r.slice(1)]).concat(dealExtra[i]||[]));
  const siRows = [
    ["SAP S/4HANA","Opérations Cœur","Finance","ERP central","Haute","SAP SE","S/4HANA 2023","J. Dupont",250,"Actif",420000,"Mixte",250,"On-premise","Progiciel (COTS)","2030-12-31","Salesforce|Power BI","API|API","Données clients|Reporting financier","Système central"],
    ["Salesforce","Relation client","Commercial","Gestion de la relation client","Haute","Salesforce Inc.","Enterprise","M. Martin",120,"Actif",180000,"OPEX",120,"SaaS","Progiciel (COTS)","2027-03-31","SAP S/4HANA|Mailchimp","API|REST","Commandes|Contacts marketing",""],
    ["Power BI","Pilotage","IT","Reporting et tableaux de bord","Moyenne","Microsoft","Pro","A. Bernard",80,"Cible",45000,"OPEX",80,"SaaS","Progiciel (COTS)","","","","",""],
    ["ADP","Ressources humaines","RH","Paie","Haute","ADP","v12","L. Petit",15,"Legacy",95000,"OPEX",15,"SaaS","Progiciel (COTS)","2026-12-31","SAP S/4HANA","SFTP","Écritures de paie","Remplacement prévu par Workday"],
    ["Mailchimp","Marketing digital","Marketing","Emailing marketing","Basse","Intuit","Premium","S. Moreau",10,"Actif dégradé",12000,"OPEX",10,"SaaS","Progiciel (COTS)","2026-06-30","","","",""],
    ["Jira","Outils IT","IT","Gestion de projet IT","Moyenne","Atlassian","Cloud","P. Durand",45,"Actif",38000,"OPEX",45,"SaaS","Progiciel (COTS)","2028-09-30","Confluence","REST","Documentation technique",""],
    ["WMS Reflex","Supply chain","Logistique","Gestion d'entrepôt","Haute","Hardis Group","v6.2","C. Roux",35,"À refondre",150000,"Mixte",35,"On-premise","Progiciel (COTS)","2027-12-31","SAP S/4HANA","API","Mouvements de stock",""],
    ["DocuSign","Juridique","Juridique","Signature électronique","Moyenne","DocuSign","Enterprise","N. Blanc",30,"Actif",22000,"OPEX",30,"SaaS","Progiciel (COTS)","2029-06-30","Salesforce","API","Contrats signés",""],
    ["MES Wonderware","Production","Production","Pilotage atelier","Haute","AVEVA","2023","F. Garcia",40,"À migrer",210000,"CAPEX",40,"On-premise","Progiciel (COTS)","2026-12-31","SAP S/4HANA|WMS Reflex","API|MQ","Ordres de fabrication|Bons de sortie",""],
    ["Workday","Ressources humaines","RH","Gestion des talents","Moyenne","Workday","2024R1","L. Petit",0,"À créer",65000,"OPEX",0,"SaaS","Progiciel (COTS)","2032-12-31","ADP","API","Données collaborateurs","Déploiement S2 2025"],
    ["Portail Extranet","Relation client","IT","Portail clients développé en interne","Moyenne","Interne","3.4","P. Durand",900,"Actif dégradé",70000,"Mixte",0,"Cloud privé","Développement spécifique","2027-06-30","Salesforce","API","Comptes clients",""],
  ];
  const siEx = siRows.map((r,i)=>{const b=r[10];const tp=r[11]==="Mixte"?"OPEX":r[11];return [...r.slice(0,10),i%2?"":b,i%2?Math.round(b/12):"",tp,...r.slice(12)];});
  const ex = isDeal ? dealEx : siEx;
  const ws1 = XLSX.utils.aoa_to_sheet([hdr,...ex]);
  ws1["!cols"]= isDeal
    ? [{wch:22},{wch:20},{wch:16},{wch:35},{wch:12},{wch:12},{wch:22},{wch:12},{wch:18},{wch:14},{wch:18},{wch:18},{wch:28},{wch:16},{wch:30},{wch:28},{wch:16},{wch:16},{wch:12},{wch:12},{wch:24},{wch:28},{wch:18}]
    : [{wch:24},{wch:20},{wch:16},{wch:35},{wch:12},{wch:22},{wch:14},{wch:14},{wch:14},{wch:16},{wch:16},{wch:16},{wch:12},{wch:12},{wch:24},{wch:28},{wch:18},{wch:28},{wch:16},{wch:30},{wch:28}];
  XLSX.utils.book_append_sheet(wb,ws1,"Applications");
  var fluxHdr=["N° Ordre","Application Émettrice","Application Réceptrice","Nom du Flux Métier","Protocole","Fréquence","Description"];
  var fluxEx=[[1,"SAP S/4HANA","Salesforce","Synchronisation clients","API","Temps réel","Envoi fiches clients"],[2,"SAP S/4HANA","Salesforce","Tarifs catalogue","API","Journalier","MAJ prix"],[3,"SAP S/4HANA","Power BI","Reporting financier","API","Journalier","Données comptables"],[4,"Salesforce","SAP S/4HANA","Commandes validées","REST","Temps réel","Retour commandes"],[5,"ADP","SAP S/4HANA","Écritures de paie","SFTP","Mensuel","Intégration paie"],[6,"MES Wonderware","SAP S/4HANA","Ordres de fabrication","API","Temps réel","Retour production"]];
  var wsFlux=XLSX.utils.aoa_to_sheet([fluxHdr].concat(fluxEx));wsFlux["!cols"]=[{wch:10},{wch:24},{wch:24},{wch:28},{wch:14},{wch:16},{wch:45}];
  XLSX.utils.book_append_sheet(wb,wsFlux,"Flux Métier");
  const ref=[["Domaine","Description","Couleur"],["Finance","Comptabilité, controlling","#52B788"],["RH","Paie, talents, formation","#9D4EDD"],["IT","Infra, dev, BI","#548CA8"],["Commercial","CRM, ventes","#E06C75"],["Production","MES, qualité","#D4A017"],["Logistique","WMS, supply chain","#40A578"],["Marketing","Emailing, CMS","#D63384"],["Juridique","Contrats, conformité","#57A0A0"],["Direction","Reporting, stratégie","#7B78FF"],["Autre","Non classifié","#9E9E9E"]];
  const ws2=XLSX.utils.aoa_to_sheet(ref); ws2["!cols"]=[{wch:16},{wch:40},{wch:12}]; XLSX.utils.book_append_sheet(wb,ws2,"Référentiel Domaines");
  if(!isDeal){
    const wsStatuts=XLSX.utils.aoa_to_sheet([["Statut","Définition"],...STATUT_DEFS]);
    wsStatuts["!cols"]=[{wch:22},{wch:90}];
    XLSX.utils.book_append_sheet(wb,wsStatuts,"Référentiel Statuts");
  }
  {
    const wsPatr=XLSX.utils.aoa_to_sheet([["Champ","Valeur","Définition"],
      ["Type de coût","CAPEX","Investissement immobilisé : acquisition de licences perpétuelles, matériel, développement activé"],
      ["Type de coût","OPEX","Charge récurrente : abonnement, maintenance, support, hébergement, run"],
      ["Hébergement","On-premise","Hébergé sur les serveurs de l'entreprise ou d'un datacenter dédié"],
      ["Hébergement","Cloud privé","Infrastructure cloud dédiée à l'entreprise"],
      ["Hébergement","Cloud public (IaaS/PaaS)","Application déployée par l'entreprise sur AWS, Azure, GCP…"],
      ["Hébergement","SaaS","Application opérée et hébergée par l'éditeur"],
      ["Hébergement","Hybride","Composants répartis entre on-premise et cloud"],
      ["Hébergement","Inconnu","À investiguer"],
      ["Type d'application","Progiciel (COTS)","Solution éditeur paramétrée, hors SaaS pur"],
      ["Type d'application","Développement spécifique","Application développée sur mesure (interne ou prestataire)"],
      ["Type d'application","Open source","Solution open source déployée et opérée par l'entreprise"],
      ["Type d'application","Socle / Middleware","Brique d'infrastructure ou d'intégration (bus, annuaire, base de données…)"],
      ["Type d'application","Poste de travail / Bureautique","Outils utilisateurs et bureautique"],
      ["Type d'application","Autre","Cas non couvert ci-dessus"],
      ["Coût annuel (€)","Nombre","Coût annuel de l'application en euros HT, sans symbole ni séparateur de milliers (ex : 125000)"],
      ["Coût mensuel (€)","Nombre","Alternative au coût annuel : si seul le coût mensuel est renseigné, le coût annuel est calculé (×12)"],
      ["Nb licences","Entier","Nombre de licences ou de sièges achetés"],
      ["Date de fin de mise en service","AAAA-MM-JJ","Date prévue d'arrêt ou de fin de support (ex : 2027-06-30). Les formats JJ/MM/AAAA, MM/AAAA et AAAA sont aussi reconnus"]]);
    wsPatr["!cols"]=[{wch:30},{wch:32},{wch:95}];
    XLSX.utils.book_append_sheet(wb,wsPatr,"Référentiel Patrimoine");
  }
  const ins = isDeal ? [["TEMPLATE CARTOGRAPHIE APPLICATIVE",""],["",""],["COLONNES OBLIGATOIRES",""],["Nom Application","Nom unique de l'application"],["Domaine","Finance, RH, IT, Commercial, Production, Logistique, Marketing, Juridique, Direction, Autre"],["",""],["COLONNES OPTIONNELLES",""],["Criticité","Haute / Moyenne / Basse"],["Statut Day 1","Stratégie de closing : Transfert TSA / Maintien / Rebuild / Abandon"],["Statut Day 2","Stratégie cible : Clone & Clean / Transfert / Rebuild / Abandon"],["Flux vers","Noms des applications cibles séparés par |"],["Protocole","API, REST, SFTP, ETL… séparés par |"],["Objet du flux","Libellé de la donnée échangée. Séparés par | si multiples"],["Coût annuel (€) / Coût mensuel (€)","Optionnel : l'un ou l'autre (annuel = mensuel ×12). Alimente le widget « Budget & coûts »"],["Type de coût","Optionnel : OPEX / CAPEX"],["Nb licences, Hébergement, Type d'application, Date de fin de mise en service","Optionnels : alimentent le widget « Patrimoine applicatif » (valeurs attendues : onglet « Référentiel Patrimoine »)"],["",""],["CONSEILS",""],["1.","Les noms dans 'Flux vers' = noms exacts de la colonne A"],["2.","Day 1 = statut de closing (J1) · Day 2 = vision cible à terme"],["3.","Voir onglet 'Référentiel Domaines' pour les couleurs"]]
  : [["TEMPLATE CARTOGRAPHIE APPLICATIVE",""],["",""],["COLONNES OBLIGATOIRES",""],["Nom Application","Nom unique de l'application"],["Domaine","Finance, RH, IT, Commercial, Production, Logistique, Marketing, Juridique, Direction, Autre"],["",""],["COLONNES OPTIONNELLES",""],["Criticité","Haute / Moyenne / Basse"],["Statut","Voir l'onglet 'Référentiel Statuts' pour la liste complète et les définitions"],["Coût annuel (€)","Coût annuel de l'application en euros HT (nombre, sans séparateur de milliers)"],["Coût mensuel (€)","Alternative au coût annuel (le coût annuel est alors calculé ×12)"],["Type de coût","OPEX / CAPEX"],["Nb licences","Nombre de licences ou de sièges"],["Hébergement","On-premise / Cloud privé / Cloud public (IaaS/PaaS) / SaaS / Hybride / Inconnu"],["Type d'application","Progiciel (COTS) / Développement spécifique / Open source / Socle / Middleware / Poste de travail / Bureautique / Autre"],["Date de fin de mise en service","Au format AAAA-MM-JJ (ex : 2027-06-30)"],["Flux vers","Noms des applications cibles séparés par |"],["Protocole","API, REST, SFTP, ETL… séparés par |"],["Objet du flux","Libellé de la donnée échangée. Séparés par | si multiples"],["",""],["CONSEILS",""],["1.","Les noms dans 'Flux vers' = noms exacts de la colonne A"],["2.","Voir onglet 'Référentiel Statuts' pour la liste des statuts d'application"],["3.","Voir onglet 'Référentiel Domaines' pour les couleurs"],["4.","Voir onglet 'Référentiel Patrimoine' pour les valeurs attendues (type de coût, hébergement, type d'application, formats)"],["5.","Colonnes Coût, Hébergement, Type d'application et Date de fin de mise en service : alimentent les widgets « Budget & coûts » et « Patrimoine applicatif » du dashboard"]];
  const ws3=XLSX.utils.aoa_to_sheet(ins); ws3["!cols"]=[{wch:30},{wch:70}]; XLSX.utils.book_append_sheet(wb,ws3,"Instructions");
  XLSX.writeFile(wb,"template_cartographie.xlsx");
};


// ═══ SIDEBAR COMPONENT (V11) ═══
function Sidebar(){
  var ref=React.useContext(AppCtx);
  if(!ref)return null;
  var view=ref.view,setView=ref.setView,isDark=ref.isDark,T=ref.T,apps=ref.apps,flows=ref.flows,sidebarOpen=ref.sidebarOpen,setSidebarOpen=ref.setSidebarOpen,projectType=ref.projectType;
  var W=sidebarOpen?200:56;
  var NAV=[
    {id:"mapping",icon:"Map",label:"Cartographie",color:"#6366F1"},
    {id:"urbanisme",icon:"Grid",label:"Urbanisme",color:"#F59E0B"},
    {id:"dashboard",icon:"BarChart",label:"Dashboard",color:"#8B5CF6"},
    ...(projectType==='deal'?[{id:"decisions",icon:"Target",label:"Decisions D1/D2",color:"#EF4444"}]:[]),
  ];
  return <div className="sidebar" style={{width:W,height:"100%",background:T.bgAlt,borderRight:"1px solid "+T.border,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden",zIndex:200}}>
    <div style={{padding:"14px 10px",display:"flex",alignItems:"center",gap:8,borderBottom:"1px solid "+T.border,flexShrink:0}}>
      <div onClick={function(){setSidebarOpen(function(p){return !p;});}} title={sidebarOpen?"Réduire":"Agrandir"} style={{width:32,height:32,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 12px #6366F140",cursor:"pointer",transition:"opacity 0.15s"}} onMouseEnter={function(e){e.currentTarget.style.opacity="0.8";}} onMouseLeave={function(e){e.currentTarget.style.opacity="1";}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Central hub */}
          <circle cx="12" cy="12" r="2.8" fill="white"/>
          {/* Outer nodes */}
          <circle cx="12"  cy="4.5" r="1.6" fill="white" opacity="0.9"/>
          <circle cx="18.7" cy="8.2" r="1.6" fill="white" opacity="0.9"/>
          <circle cx="18.7" cy="15.8" r="1.6" fill="white" opacity="0.9"/>
          <circle cx="12"  cy="19.5" r="1.6" fill="white" opacity="0.9"/>
          <circle cx="5.3" cy="15.8" r="1.6" fill="white" opacity="0.9"/>
          <circle cx="5.3" cy="8.2" r="1.6" fill="white" opacity="0.9"/>
          {/* Spokes */}
          <line x1="12" y1="9.2"  x2="12"   y2="6.1"  stroke="white" strokeWidth="1.3" opacity="0.55"/>
          <line x1="14.4" y1="10.6" x2="17.3" y2="9"  stroke="white" strokeWidth="1.3" opacity="0.55"/>
          <line x1="14.4" y1="13.4" x2="17.3" y2="15" stroke="white" strokeWidth="1.3" opacity="0.55"/>
          <line x1="12" y1="14.8" x2="12"   y2="17.9" stroke="white" strokeWidth="1.3" opacity="0.55"/>
          <line x1="9.6" y1="13.4" x2="6.7"  y2="15" stroke="white" strokeWidth="1.3" opacity="0.55"/>
          <line x1="9.6" y1="10.6" x2="6.7"  y2="9"  stroke="white" strokeWidth="1.3" opacity="0.55"/>
          {/* Cross-links (ring) */}
          <line x1="12" y1="4.5" x2="18.7" y2="8.2"  stroke="white" strokeWidth="0.8" opacity="0.3"/>
          <line x1="18.7" y1="8.2" x2="18.7" y2="15.8" stroke="white" strokeWidth="0.8" opacity="0.3"/>
          <line x1="18.7" y1="15.8" x2="12"  y2="19.5" stroke="white" strokeWidth="0.8" opacity="0.3"/>
          <line x1="12"  y1="19.5" x2="5.3"  y2="15.8" stroke="white" strokeWidth="0.8" opacity="0.3"/>
          <line x1="5.3" y1="15.8" x2="5.3"  y2="8.2"  stroke="white" strokeWidth="0.8" opacity="0.3"/>
          <line x1="5.3" y1="8.2"  x2="12"   y2="4.5"  stroke="white" strokeWidth="0.8" opacity="0.3"/>
        </svg>
      </div>
      {sidebarOpen&&<div style={{fontSize:12,fontWeight:800,color:T.fg,letterSpacing:"-0.02em",lineHeight:1}}>Cartographe</div>}
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"8px 6px"}}>
      {NAV.map(function(n){
        var active=view===n.id;
        return <div key={n.id} className={"sidebar-item"+(active?" active":"")} onClick={function(){setView(n.id);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",marginBottom:2,cursor:"pointer",color:active?n.color:T.fgMuted,background:active?n.color+"15":"transparent",border:active?"1px solid "+n.color+"30":"1px solid transparent"}}>
          <span style={{flexShrink:0,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center"}} dangerouslySetInnerHTML={{__html:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+{Map:'<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>',Grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',Layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',Boxes:'<rect x="3" y="3" width="10" height="10" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="15" y="11" width="6" height="10" rx="1"/><rect x="3" y="15" width="10" height="6" rx="1"/>',BarChart:'<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>',Target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'}[n.icon]+'</svg>'}}></span>
          {sidebarOpen&&<span style={{fontSize:12,fontWeight:active?600:400,whiteSpace:"nowrap",letterSpacing:"-0.01em"}}>{n.label}</span>}
          {sidebarOpen&&active&&<div style={{width:4,height:4,borderRadius:2,background:n.color,marginLeft:"auto"}}/>}
        </div>;
      })}
    </div>
    <div style={{padding:"8px 6px",borderTop:"1px solid "+T.border,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,color:T.fgMuted}}>
        <span style={{fontSize:13,width:22,textAlign:"center"}}>●</span>
        {sidebarOpen&&<div style={{fontSize:10,lineHeight:1.4}}>
          <div style={{color:T.fg,fontWeight:600}}>{apps.length} apps</div>
          <div style={{color:T.fgMuted}}>{flows.length} flux</div>
        </div>}
      </div>
    </div>
  </div>;
}

// ═══ VUE PAYSAGE — treemap urbanistique (domaine ⊃ catégorie) ═══
// Fonctions pures (aucune dépendance React) : la surface de chaque rectangle
// est proportionnelle au nombre d'applications. Algorithme "squarified treemap".
function pvFitText(text,maxWidth,avgCharWidth){
  if(!text)return"";
  if(maxWidth<=avgCharWidth)return"";
  var maxChars=Math.max(1,Math.floor(maxWidth/avgCharWidth));
  if(text.length<=maxChars)return text;
  return text.slice(0,Math.max(1,maxChars-1))+"…";
}
function pvSquarify(values,rect){
  if(values.length===0)return[];
  var total=values.reduce(function(a,b){return a+b;},0);
  if(total===0)return values.map(function(){return Object.assign({},rect);});
  var area=rect.w*rect.h;
  var scaled=values.map(function(v){return v/total*area;});
  var results=new Array(values.length);
  var cursor=Object.assign({},rect);
  var remaining=scaled.map(function(v,i){return{v:v,i:i};});
  while(remaining.length>0){
    var short=Math.min(cursor.w,cursor.h);
    var row=[];
    var bestWorst=Infinity;
    for(var k=0;k<remaining.length;k++){
      var candidate=row.concat([remaining[k]]);
      var csum=candidate.reduce(function(a,b){return a+b.v;},0);
      var worst=Math.max.apply(null,candidate.map(function(c){
        return Math.max(short*short*c.v/(csum*csum),csum*csum/(short*short*c.v));
      }));
      if(worst>bestWorst&&row.length>0)break;
      row.push(remaining[k]);
      bestWorst=worst;
    }
    var sum=row.reduce(function(a,b){return a+b.v;},0);
    var horizontal=cursor.w>=cursor.h;
    var rowThickness=horizontal?sum/cursor.h:sum/cursor.w;
    if(horizontal){
      var cy=cursor.y;
      row.forEach(function(item){
        var hh=item.v/sum*cursor.h;
        results[item.i]={x:cursor.x,y:cy,w:rowThickness,h:hh};
        cy+=hh;
      });
      cursor={x:cursor.x+rowThickness,y:cursor.y,w:cursor.w-rowThickness,h:cursor.h};
    }else{
      var cx=cursor.x;
      row.forEach(function(item){
        var ww=item.v/sum*cursor.w;
        results[item.i]={x:cx,y:cursor.y,w:ww,h:rowThickness};
        cx+=ww;
      });
      cursor={x:cursor.x,y:cursor.y+rowThickness,w:cursor.w,h:cursor.h-rowThickness};
    }
    remaining.splice(0,row.length);
  }
  return results;
}
// Construit le layout à 3 niveaux : domaines → catégories → applications.
function pvBuildLayout(apps,w,h,fontSc){
  var fs=fontSc||1;
  var D_HEADER_H=Math.round(22*fs);
  var Q_HEADER_H=Math.round(16*fs);
  var domMap={};
  apps.forEach(function(a){var d=a.domain||"Autre";(domMap[d]=domMap[d]||[]).push(a);});
  var domsInfo=Object.keys(domMap)
    .map(function(d){return{domaine:d,apps:domMap[d],nbApps:domMap[d].length};})
    .filter(function(d){return d.nbApps>0;})
    .sort(function(a,b){return b.nbApps-a.nbApps;});
  var domRects=pvSquarify(domsInfo.map(function(d){return d.nbApps;}),{x:0,y:0,w:w,h:h});
  return domsInfo.map(function(d,i){
    var r=domRects[i];
    var catMap={};
    d.apps.forEach(function(a){var c=a.category||"—";(catMap[c]=catMap[c]||[]).push(a);});
    var cats=Object.keys(catMap)
      .map(function(c){return{quartier:c,apps:catMap[c],nbApps:catMap[c].length};})
      .filter(function(x){return x.nbApps>0;})
      .sort(function(a,b){return b.nbApps-a.nbApps;});
    var inner={x:r.x+4,y:r.y+D_HEADER_H+10,w:Math.max(0,r.w-8),h:Math.max(0,r.h-D_HEADER_H-14)};
    var qRects=pvSquarify(cats.map(function(x){return x.nbApps;}),inner);
    return{
      domaine:d.domaine,nbApps:d.nbApps,rect:r,
      quartiers:cats.map(function(x,j){
        var qr=qRects[j];
        var appInner={x:qr.x+2,y:qr.y+Q_HEADER_H+2,w:Math.max(0,qr.w-4),h:Math.max(0,qr.h-Q_HEADER_H-4)};
        var appRects=pvSquarify(x.apps.map(function(){return 1;}),appInner);
        return{
          quartier:x.quartier,nbApps:x.nbApps,rect:qr,
          apps:x.apps.map(function(a,k){return{app:a,rect:appRects[k]};})
        };
      }),
    };
  });
}

function UrbFlowArrow({ color = "#38bdf8", width = 28 }){
  return <svg width={width} height="18" viewBox="0 0 42 20" fill="none" aria-hidden="true" style={{display:"block",flexShrink:0,overflow:"visible"}}>
    <path d="M4 10h30m-7-7 7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3">
      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="0.7s" repeatCount="indefinite"/>
    </path>
    <circle r="2" fill={color}>
      <animateMotion path="M5 10H29" dur="1.1s" repeatCount="indefinite"/>
    </circle>
  </svg>;
}

// ═══ APP CONTEXT ═══
var AppCtx=React.createContext(null);

function App({ initialSnapshot, onSave, wsMessage, projectId, onThemeChange, topOffset = 0, projectType = "deal" }) {
  var _stateKey = projectId ? "carto_state_" + projectId : "carto_state";
  var snapshotApplied = useRef(false);
  var _tk=useState(function(){try{return localStorage.getItem("carto_theme")||"dark";}catch(e){return "dark";}});
  var themeKey=_tk[0],setThemeKey=_tk[1];
  var T=THEMES[themeKey]||THEMES.dark;
  var isDark=themeKey==="dark";
  var toggleTheme=function(){setThemeKey(function(p){return p==="dark"?"light":"dark";});};
  useEffect(function(){
    document.body.style.background=T.bg;
    document.body.style.color=T.fg;
    try{localStorage.setItem("carto_theme",themeKey);}catch(e){}
    if(onThemeChange) onThemeChange(isDark);
    return function(){ document.body.style.background=""; document.body.style.color=""; };
  },[themeKey]);

  var B={border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:isDark?"#EEEEF8":"#fff",letterSpacing:"-0.01em",transition:"all 0.15s"};
  var I={background:T.bgInput,border:"1px solid "+T.border,borderRadius:8,padding:"6px 10px",color:T.fg,fontSize:12,width:"100%",boxSizing:"border-box"};
  const [view,setView]=useState(function(){
    try{var s=localStorage.getItem(_stateKey);if(s){var d=JSON.parse(s);if(d.apps&&d.apps.length&&d.view)return d.view;}}catch(e){}return"home";
  });
  const [rawData,setRawData]=useState(null);
  const [rawHdr,setRawHdr]=useState([]);
  const [cMap,setCMap]=useState({});
  const [apps,setApps]=useState(function(){
    try{var s=localStorage.getItem(_stateKey);if(s){var d=JSON.parse(s);if(d.apps&&d.apps.length)return d.apps;}}catch(e){}return[];
  });
  const [flows,setFlows]=useState(function(){
    try{var s=localStorage.getItem(_stateKey);if(s){var d=JSON.parse(s);if(d.flows)return d.flows;}}catch(e){}return[];
  });
  const [selDom,setSelDom]=useState([]);
  const [selCrit,setSelCrit]=useState([]);
  const [selCat,setSelCat]=useState([]);
  const [openFilter,setOpenFilter]=useState(null); // "domain"|"category"|"status"|"criticality"|null
  const [search,setSearch]=useState("");
  const [selD1,setSelD1]=useState("");
  const [selD2,setSelD2]=useState("");
  const [selStatut,setSelStatut]=useState("");
  const [selHost,setSelHost]=useState([]);
  const [selAType,setSelAType]=useState([]);
  const [selEos,setSelEos]=useState([]);
  const [activeDomFilter,setActiveDomFilter]=useState("");
  const [selApp,setSelApp]=useState(null);
  const [selFlow,setSelFlow]=useState(null);// selected flow (click)
  const [flowCtx,setFlowCtx]=useState(null);// context menu {flow, x, y}
  const [drag,setDrag]=useState(null); // {id,ox,oy} for app or {domain,ox,oy,appIds} for domain group
  const dragRef=useRef(null); // mirror of drag for always-current access in event handlers
  const startDrag=(val)=>{dragRef.current=val;setDrag(val);};
  const stopDrag=()=>{dragRef.current=null;setDrag(null);};
  const [showAM,setShowAM]=useState(false);
  const [eApp,setEApp]=useState(null);
  const [eFlow,setEFlow]=useState(null);
  const [showFM,setShowFM]=useState(false);
  const cvRef=useRef(null);
  const toolbarRef=useRef(null);
  const [toolbarH,setToolbarH]=useState(48);
  const [off,setOff]=useState(function(){
    try{var s=localStorage.getItem(_stateKey);if(s){var d=JSON.parse(s);if(d.off)return d.off;}}catch(e){}return{x:0,y:0};
  });
  const [zm,setZm]=useState(function(){
    try{var s=localStorage.getItem(_stateKey);if(s){var d=JSON.parse(s);if(d.zm)return d.zm;}}catch(e){}return 1;
  });
  const [pan,setPan]=useState(false);
  const pRef=useRef({x:0,y:0});
  const zmRef=useRef(1); // always-current zoom for document-level handlers
  const catDocDragRef=useRef(null); // {cat, appIds, lastX, lastY} for category drag via document events
  const [fFrom,setFFrom]=useState(null);
  const [cMode,setCMode]=useState(false);
const [multiSel,setMultiSel]=useState([]);
const [selMode,setSelMode]=useState(false); // toggle select mode
  const [shts,setShts]=useState([]);
  const [wbR,setWbR]=useState(null);
  const [showSP,setShowSP]=useState(false);
  const [fName,setFName]=useState("");
  const [loadStatus,setLoadStatus]=useState(null);
  const [rawFluxData,setRawFluxData]=useState(null); // null | {step, detail, stats}
  const [domColors,setDomColors]=useState({...DC_DEFAULT});

  // ═══════════════════════════════════════════════════════════════
  // BRIDGE D'INTÉGRATION REACT (postMessage parent ↔ iframe)
  // Connecte ce canvas standalone au frontend de gestion de projets
  // ═══════════════════════════════════════════════════════════════
  // ── Charger le snapshot initial depuis les props ──
  useEffect(function(){
    if(initialSnapshot && !snapshotApplied.current){
      snapshotApplied.current = true;
      // N'appliquer que si le snapshot serveur contient des données
      // (ne pas écraser les apps importées/localStorage avec un snapshot vide)
      if(initialSnapshot.apps && initialSnapshot.apps.length > 0){
        setApps(initialSnapshot.apps);
        if(initialSnapshot.flows) setFlows(initialSnapshot.flows);
        if(initialSnapshot.dom_colors) setDomColors(initialSnapshot.dom_colors);
        setView("mapping");
      }
    }
  }, [initialSnapshot]);

  // ── Recevoir les mises à jour WebSocket via props ──
  useEffect(function(){
    if(!wsMessage) return;
    if(wsMessage.type==="apps_update" && wsMessage.payload?.payload){
      setApps(wsMessage.payload.payload.apps||apps);
    }
    if(wsMessage.type==="flows_update" && wsMessage.payload?.payload){
      setFlows(wsMessage.payload.payload.flows||flows);
    }
    if(wsMessage.type==="dom_colors_update" && wsMessage.payload?.payload){
      setDomColors(wsMessage.payload.payload.domColors||domColors);
    }
  }, [wsMessage]);

  // ── Auto-save : exposer l'état au parent via callback ──
  useEffect(function(){
    if(onSave) onSave({ apps, flows, domColors });
  }, [apps,flows,domColors,onSave]);

  var DC=domColors;
  var DC_DARK=domColors;
  const ALLDOM=[...new Set([...ALLDOM_DEFAULT,...Object.keys(domColors)])];
  const [showDomEdit,setShowDomEdit]=useState(null); // domain name being edited
  const [showCatColorEdit,setShowCatColorEdit]=useState(null); // category name being color-edited
  const [showCatModal,setShowCatModal]=useState(false);
  const [catColors,setCatColors]=useState({}); // per-category custom color overrides
  const [catPads,setCatPads]=useState({}); // per-category extra padding {cat:{w,h}}
  const [catBounds,setCatBounds]=useState({}); // per-category fixed min bounds {cat:{x1,y1,x2,y2}}
  const [catEditName,setCatEditName]=useState("");
  const [catEditDomains,setCatEditDomains]=useState([]);
  const [globalScale,setGlobalScale]=useState(1); // global size multiplier
  const [domScales,setDomScales]=useState({}); // per-domain size overrides
  const [domPads,setDomPads]=useState({}); // per-domain extra size {domain:{w,h}}

  // ── Persist canvas state across view switches and page refreshes ──────
  // (MUST be after all const declarations to avoid TDZ ReferenceError)
  useEffect(()=>{
    if(apps.length===0)return;
    try{
      localStorage.setItem(_stateKey,JSON.stringify({
        apps,flows,off,zm,domColors,domPads,view,version:1
      }));
    }catch(e){}
  },[apps,flows,off,zm,domColors,domPads,view]);

  useEffect(()=>{
    if(!toolbarRef.current)return;
    const obs=new ResizeObserver(entries=>{
      for(const e of entries)setToolbarH(Math.ceil(e.contentRect.height)+16);
    });
    obs.observe(toolbarRef.current);
    setToolbarH(Math.ceil(toolbarRef.current.getBoundingClientRect().height));
    return()=>obs.disconnect();
  },[]);

  // Keep zmRef always current for document-level handlers
  useEffect(()=>{zmRef.current=zm;},[zm]);

  // Initialize catBounds for newly-seen categories (only expand, never shrink)
  useEffect(()=>{
    if(apps.length===0)return;
    // Compute domain bounds
    const db={};
    apps.forEach(a=>{
      if(!db[a.domain])db[a.domain]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity};
      const ds=domScales[a.domain]||1;
      db[a.domain].x1=Math.min(db[a.domain].x1,a.x);
      db[a.domain].y1=Math.min(db[a.domain].y1,a.y);
      db[a.domain].x2=Math.max(db[a.domain].x2,a.x+Math.round(AW_BASE*(globalScale||1)*ds));
      db[a.domain].y2=Math.max(db[a.domain].y2,a.y+Math.round(AH_BASE*(globalScale||1)*ds));
    });
    // Compute natural category bounds
    const nb={};
    apps.forEach(a=>{
      const cat=a.category;if(!cat)return;
      if(!nb[cat])nb[cat]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity};
      const b=db[a.domain];if(!b)return;
      nb[cat].x1=Math.min(nb[cat].x1,b.x1);nb[cat].y1=Math.min(nb[cat].y1,b.y1);
      nb[cat].x2=Math.max(nb[cat].x2,b.x2);nb[cat].y2=Math.max(nb[cat].y2,b.y2);
    });
    setCatBounds(prev=>{
      const next={...prev};
      let changed=false;
      Object.entries(nb).forEach(([cat,b])=>{
        if(!prev[cat]){next[cat]={...b};changed=true;}
      });
      return changed?next:prev;
    });
  },[apps.map(a=>a.id+a.category).join(',')]); // only when app list / categories change

  const [ctxMenu,setCtxMenu]=useState(null); // {x,y,type,target} for right-click menus
  const [presMode,setPresMode]=useState(false);
  const [focusApp,setFocusApp]=useState(null);
  const [flowSuppressed,setFlowSuppressed]=useState(false);
  const [flowDomFilter,setFlowDomFilter]=useState("");
  const [showFluxListModal,setShowFluxListModal]=useState(null);
  const [flowThickness,setFlowThickness]=useState(2);
  const [flowFontSize,setFlowFontSize]=useState(9);
  const [flowDisplayMode,setFlowDisplayMode]=useState("dynamic"); // dynamic: au survol, static: tous les flux
  const [appSpacing,setAppSpacing]=useState(2);
  const [domainSpacing,setDomainSpacing]=useState(44);
  const [categorySpacing,setCategorySpacing]=useState(30);
  const [domainPadding,setDomainPadding]=useState(18);
  const [categoryScale,setCategoryScale]=useState(1);
  const [categoryBorderW,setCategoryBorderW]=useState(2.5);
  const [highlightApps,setHighlightApps]=useState(true);
  const [highlightDomains,setHighlightDomains]=useState(true);
  const [highlightCategories,setHighlightCategories]=useState(true);
  const [highlightStrength,setHighlightStrength]=useState(65);
  const [appFontScale,setAppFontScale]=useState(1.6);
  const [domainFontScale,setDomainFontScale]=useState(1.5);
  const [categoryFontScale,setCategoryFontScale]=useState(1.45);
  const [flowDash,setFlowDash]=useState("none");
  const [flowColorCustom,setFlowColorCustom]=useState("");
  const [domBorderW,setDomBorderW]=useState(1.5);
  const [openMenu,setOpenMenu]=useState(null);
  const [urbZone,setUrbZone]=useState(null);
  const [urbExpanded,setUrbExpanded]=useState(false);
  const [urbFlowPair,setUrbFlowPair]=useState(null);
  const [urbSelApp,setUrbSelApp]=useState(null);
  const [cardSelApp,setCardSelApp]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [decisionStates,setDecisionStates]=useState({});
  const [cardZoom,setCardZoom]=useState(1);
  const [pvHover,setPvHover]=useState(""); // survol treemap vue Paysage
  const [pvZm,setPvZm]=useState(1);       // zoom treemap (0.5 → 3)
  const [pvFontSc,setPvFontSc]=useState(1); // échelle police treemap (0.5 → 2)
  const [domW,setDomW]=useState(240);
  const [domH,setDomH]=useState(0);
  const [domPos,setDomPos]=useState({});
  const [domWidths,setDomWidths]=useState({});
  const [domDrag,setDomDrag]=useState(null);
  const [showSettings,setShowSettings]=useState(false); // presentation mode
  const [showExportModal,setShowExportModal]=useState(false);
  const [exportOpts,setExportOpts]=useState({
    inclExecSlides:true,
    inclPaysage:true,          // slide treemap paysage applicatif
    inclMatrices:true,        // tableau récap + vue agrégée domaines
    inclConsolidatedCarto:true,
    inclDomainStatus:false,   // vision Day 1 & Day 2
    cartoMode:"byHub",
    hubLimit:8,               // nombre max de hubs (mode byHub)
    hubDomainFilter:null,     // null = tous les domaines, sinon tableau de noms de domaines
    flowLineStyle:"solid",    // "solid" | "dash" | "dot"
    clientPrimary:"2979FF",
    clientLogo:null,
    statusColorsD1:{"Transfert TSA":"F59E0B","Maintien":"10B981","Rebuild":"6366F1","Abandon":"EF4444","Non défini":"94A3B8"},
    statusColorsD2:{"Clone & Clean":"3B82F6","Transfert":"10B981","Rebuild":"8B5CF6","Abandon":"EF4444","Non défini":"94A3B8"},
  });
  const [fontScale,setFontScale]=useState(1.35); // global canvas text scale
  const [renCat,setRenCat]=useState(null) // {old,new} for renaming category

  // Keyboard shortcuts
  React.useEffect(()=>{
    const handleKey=e=>{
      if(e.key==="Escape"&&presMode) setPresMode(false);
      if(e.key==="Escape"&&!presMode&&multiSel.length>0){setMultiSel([]);return;}
      if(e.key==="p"&&e.ctrlKey){e.preventDefault();setPresMode(p=>!p);}
      if(multiSel.length>0&&["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)){
        e.preventDefault();
        const step=e.shiftKey?20:5;
        const dx=e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0;
        const dy=e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0;
        setApps(p=>p.map(a=>multiSel.includes(a.id)?{...a,x:a.x+dx,y:a.y+dy}:a));
      }
      if(multiSel.length>0&&(e.key==="Delete"||e.key==="Backspace")){
        if(confirm("Supprimer "+multiSel.length+" application(s) ?")){
          setApps(p=>p.filter(a=>!multiSel.includes(a.id)));
          setFlows(p=>p.filter(f=>!multiSel.includes(f.from)&&!multiSel.includes(f.to)));
          setMultiSel([]);
        }
      }
      // Delete selected flow
      if(selFlow&&(e.key==="Delete"||e.key==="Backspace")){
        if(confirm("Supprimer ce flux ?")){
          setFlows(p=>p.filter(f=>f.id!==selFlow));
          setSelFlow(null);
        }
      }
      if(e.key==="Escape"){setFlowCtx(null);setSelFlow(null);}
    };
    window.addEventListener("keydown",handleKey);
    return ()=>window.removeEventListener("keydown",handleKey);
  },[presMode,multiSel,selFlow]);

  const autoMap=(hds)=>{
    const m={};
    const n=s=>s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
    const used=new Set();
    // Les colonnes propres à l'autre type de projet sont écartées pour ne pas être confondues avec un champ courant
    const otherPats=projectType==='deal'?[]:DEAL_ONLY_PATTERNS.statusD1.concat(DEAL_ONLY_PATTERNS.statusD2);
    hds.forEach(function(h){if(otherPats.some(function(p){return n(h).indexOf(p)>=0;}))used.add(h);});
    if(projectType==='deal'){
      var d1best=hds.find(function(h){return["day 1","statut day 1","d1"].some(function(p){return n(h).indexOf(p)>=0;});});
      var d2best=hds.find(function(h){return h!==d1best&&["day 2","statut day 2","d2"].some(function(p){return n(h).indexOf(p)>=0;});});
      if(d1best){m.statusD1=d1best;used.add(d1best);}
      if(d2best){m.statusD2=d2best;used.add(d2best);}
    }
    const P={name:["nom","application","app","name"],x:["x","pos x","position x"],y:["y","pos y","position y"],domain:["domaine","domain"],description:["description","desc"],statut:["statut as-is","as-is","statut actuel","statut","status","état"],criticality:["criticité","criticite","criticality","importance"],vendor:["éditeur","editeur","vendor","fournisseur"],version:["version"],owner:["responsable","owner"],users:["utilisateur","users","nb util"],flowTo:["flux vers","flow to","interface vers","cible","target"],flowFrom:["source","emettrice","from"],flowProtocol:["protocole","protocol"],category:["catégorie","categorie","category","macro","zone","groupe","group","périmètre","perimetre"],flowLabel:["objet","object","libellé flux","donnée"]};
    ITSI_FIELDS.forEach(function(f){P[f.key]=f.patterns;});
    fieldsFor(projectType).forEach(function(f){
      if(m[f.key])return;
      var best=hds.find(function(h){return!used.has(h)&&P[f.key]&&P[f.key].some(function(p){return n(h).indexOf(p)>=0;});});
      if(best){m[f.key]=best;used.add(best);}
    });
    setCMap(m);return m;
  };

  const computeStats=(data, mapping)=>{
    const domSet=new Set(); let flowCount=0; const critCount={};
    data.forEach(r=>{
      const dom=r[mapping.domain]||"Autre"; domSet.add(dom);
      const cr=r[mapping.criticality]||"Moyenne"; critCount[cr]=(critCount[cr]||0)+1;
      if(mapping.flowTo&&r[mapping.flowTo]) r[mapping.flowTo].split("|").forEach(t=>{if(t.trim())flowCount++;});
    });
    // Colonnes reconnues mais propres à l'autre type de projet : signalées à l'utilisateur, jamais importées
    const mapped=new Set(Object.values(mapping).filter(Boolean));
    const otherPatterns=projectType==='deal'?{}:{"Day 1":DEAL_ONLY_PATTERNS.statusD1,"Day 2":DEAL_ONLY_PATTERNS.statusD2};
    const ignored=Object.keys(data[0]||{}).filter(h=>!mapped.has(h)).map(h=>{const label=Object.keys(otherPatterns).find(l=>otherPatterns[l].some(p=>normText(h).indexOf(p)>=0));return label?{header:h,field:label}:null;}).filter(Boolean);
    return {apps:data.length, domains:domSet.size, domainList:[...domSet], flows:flowCount, critCount, ignored, mappedFields:Object.keys(mapping).filter(k=>mapping[k]).length, totalFields:fieldsFor(projectType).length};
  };

  const loadSheet=useCallback((wb,nm)=>{
    setLoadStatus({step:"parsing",detail:"Analyse de la feuille « "+nm+" »..."});
    setTimeout(()=>{
      const ws=wb.Sheets[nm];const j=XLSX.utils.sheet_to_json(ws,{defval:""});
      if(j.length>0){
        const cl=j.map(r=>{const o={};Object.keys(r).forEach(k=>o[k]=String(r[k]??""));return o;});
        setRawData(cl);setRawHdr(Object.keys(cl[0]));
        var fluxSN=wb.SheetNames.find(function(s){var ln=s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");return ln.indexOf("flux")>=0||ln.indexOf("interface")>=0||ln.indexOf("flow")>=0;});
        if(fluxSN&&fluxSN!==nm){var fws=wb.Sheets[fluxSN];var fj=XLSX.utils.sheet_to_json(fws,{defval:""});if(fj.length>0){var fd=fj.map(function(r){var o={};Object.keys(r).forEach(function(k){o[k]=String(r[k]!=null?r[k]:"");});return o;});setRawFluxData(fd);}}else{setRawFluxData(null);}
        setLoadStatus({step:"mapping",detail:"Détection des colonnes..."});
        setTimeout(()=>{
          const mapping=autoMap(Object.keys(cl[0]));
          const stats=computeStats(cl,mapping);
          setShowSP(false);
          setLoadStatus({step:"ready",detail:"Fichier prêt",stats,fileName:fName});
          setView("import");
        },300);
      } else { setLoadStatus({step:"error",detail:"Aucune donnée trouvée dans cette feuille"}); }
    },200);
  },[fName]);

  const handleFile=useCallback(async(file)=>{
    setFName(file.name);const ext=file.name.split(".").pop().toLowerCase();
    setLoadStatus({step:"reading",detail:"Lecture de "+file.name+"..."});
    setView("loading");
    try{
      if(["csv","tsv","txt"].includes(ext)){
        const t=await file.text();
        setLoadStatus({step:"parsing",detail:"Analyse du fichier CSV..."});
        await new Promise(r=>setTimeout(r,200));
        const d=parseCSV(t);
        if(d.length>0){
          setRawData(d);setRawHdr(Object.keys(d[0]));
          setLoadStatus({step:"mapping",detail:"Détection des colonnes..."});
          await new Promise(r=>setTimeout(r,300));
          const mapping=autoMap(Object.keys(d[0]));
          const stats=computeStats(d,mapping);
          setLoadStatus({step:"ready",detail:"Fichier prêt",stats,fileName:file.name});
          setView("import");
        } else { setLoadStatus({step:"error",detail:"Aucune donnée trouvée"}); }
      }
      else if(["xlsx","xls","xlsm","xlsb","ods"].includes(ext)){
        setLoadStatus({step:"reading",detail:"Lecture du fichier Excel..."});
        const buf=await file.arrayBuffer();
        setLoadStatus({step:"parsing",detail:"Décompression des données..."});
        await ensureXLSX();
        await new Promise(r=>setTimeout(r,200));
        const wb=XLSX.read(buf,{type:"array"});setWbR(wb);
        var appSN=wb.SheetNames.find(function(s){var ln=s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");return ln.indexOf("application")>=0||ln.indexOf("apps")>=0||ln.indexOf("inventaire")>=0;});
        if(appSN) loadSheet(wb,appSN);
        else if(wb.SheetNames.length===1) loadSheet(wb,wb.SheetNames[0]);
        else{setShts(wb.SheetNames);setShowSP(true);setLoadStatus(null);}
      }
      else {setLoadStatus({step:"error",detail:"Format non supporté"});alert("Formats acceptés: CSV, TSV, XLSX, XLS, ODS");}
    }catch(e){setLoadStatus({step:"error",detail:"Erreur: "+e.message});}
  },[loadSheet]);

  const processImport=()=>{
    if(!cMap.name||!cMap.domain){alert("Mappez au minimum: Nom et Domaine");return;}
    const na=rawData.map((r,i)=>({id:uid(),name:r[cMap.name]||"App_"+i,domain:r[cMap.domain]||"Autre",category:r[cMap.category]||"",description:r[cMap.description]||"",criticality:r[cMap.criticality]||"Moyenne",vendor:r[cMap.vendor]||"",version:r[cMap.version]||"",owner:r[cMap.owner]||"",users:parseInt(r[cMap.users])||0,statut:r[cMap.statut]||"",statusD1:r[cMap.statusD1]||"",statusD2:r[cMap.statusD2]||"",x:0,y:0,_ft:r[cMap.flowTo]||"",_fp:r[cMap.flowProtocol]||"",_fl:r[cMap.flowLabel]||"",...(function(){var an=parseAmount(r[cMap.budget]),mo=parseAmount(r[cMap.monthlyCost]);return{budget:an!=null?an:(mo!=null?Math.round(mo*12*100)/100:null),monthlyCost:mo!=null?mo:(an!=null?Math.round(an/12*100)/100:null)};})(),...{costType:canonOption(r[cMap.costType],COST_TYPES),licenses:parseInt(String(r[cMap.licenses]||"").replace(/\s/g,""))||0,hosting:canonOption(r[cMap.hosting],HOSTING_OPTS),appType:canonOption(r[cMap.appType],APPTYPE_OPTS),endOfService:parseDate(r[cMap.endOfService])}}));
    const nf=[];
    if(rawFluxData&&rawFluxData.length>0){
      var nrm=function(s){return(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();};
      var fHdr=Object.keys(rawFluxData[0]);
      var findCol=function(kw){return fHdr.find(function(h){return kw.some(function(k){return nrm(h).indexOf(k)>=0;});});};
      var colFrom=findCol(["emettrice","source","from"]);
      var colTo=findCol(["receptrice","cible","to","vers"]);
      var colName=findCol(["nom du flux","flux metier","nom flux","libelle","label","name"]);
      var colProto=findCol(["protocole","protocol"]);
      var colFreq=findCol(["frequence","frequency"]);
      var colDesc=findCol(["description","desc"]);
      var colOrder=findCol(["ordre","order","n"]);
      if(colFrom&&colTo){
        rawFluxData.forEach(function(row,idx){
          var fromName=(row[colFrom]||"").trim();var toName=(row[colTo]||"").trim();if(!fromName||!toName)return;
          var fromApp=na.find(function(a){return nrm(a.name)===nrm(fromName);});
          var toApp=na.find(function(a){return nrm(a.name)===nrm(toName);});
          if(fromApp&&toApp)nf.push({id:uid(),from:fromApp.id,to:toApp.id,label:(colName?row[colName]:"")||"",protocol:(colProto?row[colProto]:"")||"API",frequency:(colFreq?row[colFreq]:"")||"",description:(colDesc?row[colDesc]:"")||"",order:parseInt(colOrder?row[colOrder]:"")||(idx+1)});
        });
      }
    }
    if(nf.length===0)
    na.forEach(a=>{if(a._ft)a._ft.split("|").forEach((t,idx)=>{const dest=na.find(x=>x.name.toLowerCase().trim()===t.trim().toLowerCase());if(dest){const ps=(a._fp||"").split("|");const ls=(a._fl||"").split("|");nf.push({id:uid(),from:a.id,to:dest.id,protocol:(ps[idx]||ps[0]||"API").trim(),label:(ls[idx]||ls[0]||"").trim(),description:"",frequency:""});}});delete a._ft;delete a._fp;delete a._fl;});
    na.forEach(function(a){delete a._ft;delete a._fp;delete a._fl;});
    // Compact layout optimized for 100+ apps: all domains visible on screen
    // Group by domain, sort by size
    const domGr={};na.forEach(a=>{if(!domGr[a.domain])domGr[a.domain]=[];domGr[a.domain].push(a);});
    const sortedDoms=Object.entries(domGr).sort((a,b)=>b[1].length-a[1].length);

    // Compact card dimensions
    const cW=AW,cH=AH,cGx=6,cGy=4; // app card + gaps
    const perRow=Math.max(2,Math.min(5,Math.ceil(Math.sqrt(Math.max(...sortedDoms.map(d=>d[1].length)))))); // adaptive apps per row
    const domPad=28,domSide=10,domGap=18; // domain zone padding
    const colW=perRow*(cW+cGx)+domSide*2; // uniform domain block width

    const hasCatsImport=na.some(a=>a.category);
    if(hasCatsImport){
      // Layout groupé par catégorie : domaines d'une même catégorie sont placés ensemble
      // → les boîtes catégorie du canvas sont propres et bien délimitées
      const catDomMap={};
      sortedDoms.forEach(([d,dApps])=>{
        const catCounts={};
        dApps.forEach(a=>{const c=a.category||"";if(c)catCounts[c]=(catCounts[c]||0)+1;});
        const domCat=Object.keys(catCounts).sort((a,b)=>catCounts[b]-catCounts[a])[0]||"";
        if(!catDomMap[domCat])catDomMap[domCat]=[];
        catDomMap[domCat].push([d,dApps]);
      });
      const sortedCats=Object.entries(catDomMap).sort((a,b)=>{
        const aT=a[1].reduce((s,[,ap])=>s+ap.length,0);
        const bT=b[1].reduce((s,[,ap])=>s+ap.length,0);
        return bT-aT;
      });
      const catExtraGap=60; // espacement supplémentaire entre catégories
      let globalX=30;
      sortedCats.forEach(([,catDoms])=>{
        const catNcols=Math.max(1,Math.min(Math.ceil(catDoms.length/2),3));
        const catTitleOffset=90; // espace pour le bandeau titre de la catégorie
        const catColTops=Array(catNcols).fill(30+catTitleOffset);
        const catColXs=Array.from({length:catNcols},(_,i)=>globalX+i*(colW+domGap));
        catDoms.forEach(([,dApps])=>{
          const h=Math.ceil(dApps.length/perRow)*(cH+cGy)+domPad+12;
          let best=0;
          for(let c=1;c<catNcols;c++) if(catColTops[c]<catColTops[best]) best=c;
          const bx=catColXs[best], by=catColTops[best];
          dApps.forEach((app,ai)=>{
            app.x=bx+domSide+(ai%perRow)*(cW+cGx);
            app.y=by+domPad+Math.floor(ai/perRow)*(cH+cGy);
          });
          catColTops[best]+=h+domGap;
        });
        globalX+=catNcols*(colW+domGap)+catExtraGap;
      });
    } else {
      // Layout original sans catégories : bin-packing en colonnes
      const targetW=1800;
      const nCols=Math.max(1,Math.min(Math.floor(targetW/(colW+domGap)),Math.ceil(sortedDoms.length/2)));
      const colTops=Array(nCols).fill(30);
      const colXs=Array.from({length:nCols},(_,i)=>30+i*(colW+domGap));
      sortedDoms.forEach(([,dApps])=>{
        const h=Math.ceil(dApps.length/perRow)*(cH+cGy)+domPad+12;
        let best=0;
        for(let c=1;c<nCols;c++) if(colTops[c]<colTops[best]) best=c;
        const bx=colXs[best], by=colTops[best];
        dApps.forEach((app,ai)=>{
          app.x=bx+domSide+(ai%perRow)*(cW+cGx);
          app.y=by+domPad+Math.floor(ai/perRow)*(cH+cGy);
        });
        colTops[best]+=h+domGap;
      });
    }

    // Auto-fit zoom to show everything
    const maxX=Math.max(...na.map(a=>a.x+cW),100);
    const maxY=Math.max(...na.map(a=>a.y+cH),100);
    const vw=window.innerWidth||1400;
    const vh=(window.innerHeight||800)-60; // minus toolbar
    const fitZm=Math.min(vw/(maxX+80),vh/(maxY+80),1.2);

    // Compute catBounds directly from imported layout (reset old bounds to avoid stale positions)
    const impDomBounds={};
    na.forEach(a=>{
      if(!impDomBounds[a.domain])impDomBounds[a.domain]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity};
      impDomBounds[a.domain].x1=Math.min(impDomBounds[a.domain].x1,a.x);
      impDomBounds[a.domain].y1=Math.min(impDomBounds[a.domain].y1,a.y);
      impDomBounds[a.domain].x2=Math.max(impDomBounds[a.domain].x2,a.x+cW);
      impDomBounds[a.domain].y2=Math.max(impDomBounds[a.domain].y2,a.y+cH);
    });
    const impCatBounds={};
    na.forEach(a=>{
      const cat=a.category;if(!cat)return;
      if(!impCatBounds[cat])impCatBounds[cat]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity};
      const db=impDomBounds[a.domain];if(!db)return;
      impCatBounds[cat].x1=Math.min(impCatBounds[cat].x1,db.x1);
      impCatBounds[cat].y1=Math.min(impCatBounds[cat].y1,db.y1);
      impCatBounds[cat].x2=Math.max(impCatBounds[cat].x2,db.x2);
      impCatBounds[cat].y2=Math.max(impCatBounds[cat].y2,db.y2);
    });

    setCatBounds(impCatBounds);
    setDomPads({});
    setApps(na);setFlows(nf);setOff({x:10,y:10});setZm(Math.max(0.3,Math.min(fitZm,1)));setView("mapping");
  };

  // ── Category drag via document-level events (bypasses React event batching issues) ──
  const _catDocMove=useCallback((e)=>{
    const dr=catDocDragRef.current;if(!dr)return;
    const dx=(e.clientX-dr.lastX)/zmRef.current;
    const dy=(e.clientY-dr.lastY)/zmRef.current;
    dr.lastX=e.clientX;dr.lastY=e.clientY;
    setApps(p=>p.map(a=>dr.appIds.includes(a.id)?{...a,x:a.x+dx,y:a.y+dy}:a));
    setCatBounds(p=>{const b=p[dr.cat];if(!b)return p;return{...p,[dr.cat]:{x1:b.x1+dx,y1:b.y1+dy,x2:b.x2+dx,y2:b.y2+dy}};});
  },[]);
  const _catDocUp=useCallback(()=>{
    catDocDragRef.current=null;
    document.body.style.cursor='';
    document.removeEventListener('mousemove',_catDocMove);
    document.removeEventListener('mouseup',_catDocUp);
  },[_catDocMove]);
  const startCatDrag=useCallback((e,cat,appIds)=>{
    e.preventDefault();e.stopPropagation();
    catDocDragRef.current={cat,appIds,lastX:e.clientX,lastY:e.clientY};
    document.body.style.cursor='grabbing';
    document.addEventListener('mousemove',_catDocMove);
    document.addEventListener('mouseup',_catDocUp);
  },[_catDocMove,_catDocUp]);

  const onCD=e=>{
    setOpenFilter(null); // close any open dropdown
    if(e.button===1){e.preventDefault();setPan(true);pRef.current={x:e.clientX-off.x,y:e.clientY-off.y};return;}
    // Only pan if click is directly on the canvas area (not modals, not apps, not buttons)
    const inModal=e.target.closest&&e.target.closest('.moverlay');
    if(inModal) return;
    const inPanel=e.target.closest&&e.target.closest('[data-panel]');
    if(inPanel) return;
    const isApp=e.target.closest&&e.target.closest('[data-app]');
    const tag=e.target.tagName;
    if(!isApp&&tag!=="BUTTON"&&tag!=="INPUT"&&tag!=="SELECT"&&tag!=="A"&&tag!=="LABEL"&&tag!=="TEXTAREA"){
      setPan(true);pRef.current={x:e.clientX-off.x,y:e.clientY-off.y};setSelApp(null);setFocusApp(null);setSelFlow(null);setFlowSuppressed(true);
    }
  };
  const onCM=e=>{
    if(pan)setOff({x:e.clientX-pRef.current.x,y:e.clientY-pRef.current.y});
    const dr=dragRef.current;
    if(dr){
      if(dr.resizeCat){
        const dx=(e.clientX-dr.lx)/zm,dy=(e.clientY-dr.ly)/zm;
        dr.lx=e.clientX;dr.ly=e.clientY;
        setCatBounds(p=>{const b=p[dr.resizeCat];if(!b)return p;return{...p,[dr.resizeCat]:{...b,x2:b.x2+dx,y2:b.y2+dy}};});
        return;
      }
      if(dr.resize){
        const dx=(e.clientX-dr.lx)/zm,dy=(e.clientY-dr.ly)/zm;
        dr.lx=e.clientX;dr.ly=e.clientY;
        setDomPads(p=>{const cur=p[dr.resize]||{w:0,h:0};return{...p,[dr.resize]:{w:Math.max(0,cur.w+dx),h:Math.max(0,cur.h+dy)}};});
        return;
      }
      if(dr.ids){
        const dx=(e.clientX-dr.lx)/zm,dy=(e.clientY-dr.ly)/zm;
        dr.lx=e.clientX;dr.ly=e.clientY;
        setApps(p=>p.map(a=>dr.ids.includes(a.id)?{...a,x:a.x+dx,y:a.y+dy}:a));
        return;
      }
      if(dr.domain){
        // Domain or category group drag: move all apps in appIds
        const dx=(e.clientX-dr.lastX)/zm;
        const dy=(e.clientY-dr.lastY)/zm;
        dr.lastX=e.clientX;dr.lastY=e.clientY;
        setApps(p=>p.map(a=>dr.appIds.includes(a.id)?{...a,x:a.x+dx,y:a.y+dy}:a));
        // Si c'est un drag de catégorie entière, déplacer aussi les bounds fixes
        if(dr.domain.startsWith("__cat__")){
          const cat=dr.domain.slice(7);
          setCatBounds(p=>{const b=p[cat];if(!b)return p;return{...p,[cat]:{x1:b.x1+dx,y1:b.y1+dy,x2:b.x2+dx,y2:b.y2+dy}};});
        }
      } else {
        // Single app drag
        setApps(p=>p.map(a=>a.id===dr.id?{...a,x:(e.clientX-dr.ox-off.x)/zm,y:(e.clientY-dr.oy-off.y)/zm}:a));
      }
    }
  };
  const onCU=e=>{
    setPan(false);
    const dr=dragRef.current;
    // Check if app was dropped onto a different domain zone
    if(dr&&dr.id&&!dr.domain&&e){
      const draggedApp=apps.find(a=>a.id===dr.id);
      if(draggedApp){
        const appCx=draggedApp.x+AW/2, appCy=draggedApp.y+AH/2;
        const zones={};
        apps.forEach(a=>{
          if(a.id===dr.id) return;
          if(!zones[a.domain]) zones[a.domain]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity};
          zones[a.domain].x1=Math.min(zones[a.domain].x1,a.x-30);
          zones[a.domain].y1=Math.min(zones[a.domain].y1,a.y-52);
          zones[a.domain].x2=Math.max(zones[a.domain].x2,a.x+AW+30);
          zones[a.domain].y2=Math.max(zones[a.domain].y2,a.y+AH+30);
        });
        for(const [dom,b] of Object.entries(zones)){
          if(dom!==draggedApp.domain && appCx>=b.x1 && appCx<=b.x2 && appCy>=b.y1 && appCy<=b.y2){
            setApps(p=>p.map(a=>a.id===dr.id?{...a,domain:dom}:a));
            break;
          }
        }
      }
    }
    stopDrag();
  };
  const onWh=e=>{e.preventDefault();
    if(e.ctrlKey||e.metaKey){setZm(z=>Math.max(0.25,Math.min(2.5,z-e.deltaY*0.003)));}
    else{setOff(o=>({x:o.x-e.deltaX*0.8,y:o.y-e.deltaY*0.8}));}
  };

  var ctxValue={view,setView,isDark,T,apps,flows,sidebarOpen,setSidebarOpen,projectType};
  const applyStarLayout=(sourceApps)=>{
    var layoutApps=sourceApps||apps;
    if(layoutApps.length===0)return;
    const cW=Math.round(AW_BASE*globalScale*Math.max(0.7,fontScale));
    const cH=Math.round(AH_BASE*globalScale*Math.max(0.7,fontScale));
    const cGx=18+appSpacing,cGy=14+appSpacing,domPad=44,domSide=22,domGap=flowDisplayMode==="static"?Math.max(domainSpacing,220):domainSpacing;
    // 1. Compter les flux inter-domaines
    const domFlows={};
    const pairFlows={};
    const appConn={};
    flows.forEach(function(f){
      var fa=layoutApps.find(function(a){return a.id===f.from;});
      var ta=layoutApps.find(function(a){return a.id===f.to;});
      if(!fa||!ta)return;
      appConn[fa.id]=(appConn[fa.id]||0)+1;
      appConn[ta.id]=(appConn[ta.id]||0)+1;
      domFlows[fa.domain]=(domFlows[fa.domain]||0)+1;
      domFlows[ta.domain]=(domFlows[ta.domain]||0)+1;
      if(fa.domain!==ta.domain){var pairKey=[fa.domain,ta.domain].sort().join("\x00");pairFlows[pairKey]=(pairFlows[pairKey]||0)+1;}
    });
    const doms=[...new Set(layoutApps.map(function(a){return a.domain;}))];
    if(doms.length===0)return;
    // 2. Compter les applications par domaine.
    const domAppCnt={};
    layoutApps.forEach(function(a){domAppCnt[a.domain]=(domAppCnt[a.domain]||0)+1;});
    // 3. Taille de chaque domaine (grille compacte)
    var getDomSize=function(dom){
      var scale=domScales[dom]||1;
      var appW=Math.round(cW*scale),appH=Math.round(cH*scale);
      var groups={};
      layoutApps.filter(function(a){return a.domain===dom;}).forEach(function(a){var cat=a.category||"";(groups[cat]=groups[cat]||[]).push(a);});
      var categoryGapX=categorySpacing+appSpacing,categoryGapY=categorySpacing+28+appSpacing;
      var layouts=Object.keys(groups).map(function(category){
        var groupApps=groups[category].slice().sort(function(a,b){return(appConn[b.id]||0)-(appConn[a.id]||0);});
        var cols=Math.max(1,Math.min(3,Math.ceil(Math.sqrt(groupApps.length))));
        var rows=Math.ceil(groupApps.length/cols);
        return{category:category,apps:groupApps,cols:cols,rows:rows,w:cols*appW+(cols-1)*cGx,h:rows*appH+(rows-1)*cGy};
      }).sort(function(a,b){return b.apps.length-a.apps.length;});
      var categoryCols=Math.max(1,Math.min(3,Math.ceil(Math.sqrt(layouts.length))));
      var categoryRows=Math.ceil(layouts.length/categoryCols);
      var colWidths=new Array(categoryCols).fill(0),rowHeights=new Array(categoryRows).fill(0);
      layouts.forEach(function(layout,i){var col=i%categoryCols,row=Math.floor(i/categoryCols);colWidths[col]=Math.max(colWidths[col],layout.w);rowHeights[row]=Math.max(rowHeights[row],layout.h);});
      var xOffsets=[],yOffsets=[],cursor=0;
      colWidths.forEach(function(width,i){xOffsets[i]=cursor;cursor+=width+(i<colWidths.length-1?categoryGapX:0);});
      var contentW=cursor;
      cursor=0;
      rowHeights.forEach(function(height,i){yOffsets[i]=cursor;cursor+=height+(i<rowHeights.length-1?categoryGapY:0);});
      var contentH=cursor;
      layouts.forEach(function(layout,i){layout.x=xOffsets[i%categoryCols];layout.y=yOffsets[Math.floor(i/categoryCols)];});
      return{w:contentW+domSide*2,h:contentH+domPad+26,layouts:layouts,appW:appW,appH:appH};
    };
    // 4. Ordonner les domaines par proximité réelle des flux, puis les placer en grille compacte.
    var pendingDomains=doms.slice();
    var firstDomain=pendingDomains.slice().sort(function(a,b){return(domFlows[b]||0)-(domFlows[a]||0)||(domAppCnt[b]||0)-(domAppCnt[a]||0)||a.localeCompare(b);})[0];
    var domainOrder=firstDomain?[firstDomain]:[];
    pendingDomains=pendingDomains.filter(function(dom){return dom!==firstDomain;});
    while(pendingDomains.length){
      pendingDomains.sort(function(a,b){
        var affinity=function(dom){return domainOrder.reduce(function(total,placed){var key=[dom,placed].sort().join("\x00");return total+(pairFlows[key]||0);},0);};
        return affinity(b)-affinity(a)||(domFlows[b]||0)-(domFlows[a]||0)||(domAppCnt[b]||0)-(domAppCnt[a]||0)||a.localeCompare(b);
      });
      domainOrder.push(pendingDomains.shift());
    }
    var domainLayouts=domainOrder.map(function(dom){return{domain:dom,size:getDomSize(dom),apps:domAppCnt[dom]||0,flows:domFlows[dom]||0};});
    var domainCols=Math.min(3,Math.max(1,Math.ceil(Math.sqrt(domainLayouts.length/2))));
    var domainRows=Math.ceil(domainLayouts.length/domainCols);
    var colWidths=new Array(domainCols).fill(0),rowHeights=new Array(domainRows).fill(0);
    domainLayouts.forEach(function(item,index){var col=index%domainCols,row=Math.floor(index/domainCols);colWidths[col]=Math.max(colWidths[col],item.size.w);rowHeights[row]=Math.max(rowHeights[row],item.size.h);});
    var domainGap=Math.max(34,Math.min(domGap,96));
    var colOffsets=[],rowOffsets=[],offset=0;
    colWidths.forEach(function(width,index){colOffsets[index]=offset;offset+=width+(index<colWidths.length-1?domainGap:0);});
    offset=0;
    rowHeights.forEach(function(height,index){rowOffsets[index]=offset;offset+=height+(index<rowHeights.length-1?domainGap:0);});
    // 5. Positionner les applications par domaine, puis par catégorie.
    var na=layoutApps.map(function(a){return Object.assign({},a);});
    domainLayouts.forEach(function(item,index){
      var col=index%domainCols,row=Math.floor(index/domainCols),domainX=colOffsets[col]+domSide,domainY=rowOffsets[row]+domPad;
      item.size.layouts.forEach(function(group){group.apps.forEach(function(app,indexInGroup){
        var target=na.find(function(candidate){return candidate.id===app.id;});
        if(!target)return;
        target.x=domainX+group.x+(indexInGroup%group.cols)*(item.size.appW+cGx);
        target.y=domainY+group.y+Math.floor(indexInGroup/group.cols)*(item.size.appH+cGy);
      });});
    });
    // Compute category bounds from their own applications so groups stay distinct.
    var newCatBounds={};
    na.forEach(function(a){
      var cat=a.category;if(!cat)return;
      if(!newCatBounds[cat])newCatBounds[cat]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity};
      var appW=AW_BASE*globalScale*(domScales[a.domain]||1)*Math.max(0.7,fontScale);
      var appH=AH_BASE*globalScale*(domScales[a.domain]||1)*Math.max(0.7,fontScale);
      newCatBounds[cat].x1=Math.min(newCatBounds[cat].x1,a.x);
      newCatBounds[cat].y1=Math.min(newCatBounds[cat].y1,a.y);
      newCatBounds[cat].x2=Math.max(newCatBounds[cat].x2,a.x+appW);
      newCatBounds[cat].y2=Math.max(newCatBounds[cat].y2,a.y+appH);
    });
    setApps(na);
    setCatBounds(newCatBounds);
    setDomPads({});
    setTimeout(function(){fitCanvas(na);},50);
  };

  const previousLayoutScale=useRef({fontScale:fontScale,globalScale:globalScale,appSpacing:appSpacing,domainSpacing:domainSpacing,categorySpacing:categorySpacing,flowDisplayMode:flowDisplayMode});
  // The layout helper intentionally uses the latest render state when layout controls change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{
    const previous=previousLayoutScale.current;
    if(previous.fontScale===fontScale&&previous.globalScale===globalScale&&previous.appSpacing===appSpacing&&previous.domainSpacing===domainSpacing&&previous.categorySpacing===categorySpacing&&previous.flowDisplayMode===flowDisplayMode)return;
    previousLayoutScale.current={fontScale:fontScale,globalScale:globalScale,appSpacing:appSpacing,domainSpacing:domainSpacing,categorySpacing:categorySpacing,flowDisplayMode:flowDisplayMode};
    if(apps.length>0)applyStarLayout();
  },[fontScale,globalScale,appSpacing,domainSpacing,categorySpacing,flowDisplayMode]);

  const fitCanvas=(layoutApps=filtered)=>{
    if(!layoutApps.length)return;
    const appWidth=(a)=>AW_BASE*globalScale*(domScales[a.domain]||1)*Math.max(0.7,fontScale);
    const appHeight=(a)=>AH_BASE*globalScale*(domScales[a.domain]||1)*Math.max(0.7,fontScale);
    const minX=Math.min(...layoutApps.map(a=>a.x)),minY=Math.min(...layoutApps.map(a=>a.y));
    const maxX=Math.max(...layoutApps.map(a=>a.x+appWidth(a))),maxY=Math.max(...layoutApps.map(a=>a.y+appHeight(a)));
    const framePad=72;
    const boundsW=Math.max(1,maxX-minX+framePad*2),boundsH=Math.max(1,maxY-minY+framePad*2);
    const rect=cvRef.current?.getBoundingClientRect();
    const vw=rect?.width||window.innerWidth||1400;
    const vh=rect?.height||((window.innerHeight||800)-100);
    const fitZm=Math.min((vw-40)/boundsW,(vh-40)/boundsH,1.5);
    const finalZm=Math.max(0.08,Math.min(fitZm,1.5));
    setZm(finalZm);
    setOff({x:(vw-boundsW*finalZm)/2-(minX-framePad)*finalZm,y:(vh-boundsH*finalZm)/2-(minY-framePad)*finalZm});
  };

  useEffect(function(){
    if(!initialSnapshot||!initialSnapshot.apps||!initialSnapshot.apps.length)return;
    var migrationKey=_stateKey+"_dense_layout_v6";
    try{if(localStorage.getItem(migrationKey)==="done")return;}catch(e){}
    try{localStorage.setItem(migrationKey,"done");}catch(e){}
    applyStarLayout(initialSnapshot.apps);
  },[apps,initialSnapshot]);


  const exportXLSX=async()=>{
    await ensureXLSX();
    try{
      var wb=XLSX.utils.book_new();

      // ── Onglet 1: Applications (format reimportable) ──
      var ah=["Nom","Domaine","Categorie","Criticite","Editeur","Version","Responsable","Utilisateurs","Description",...(projectType==='deal'?["Day 1","Day 2"]:["Statut"]),"Coût annuel (€)","Coût mensuel (€)","Type de coût","Nb licences","Hébergement","Type d'application","Date de fin de mise en service","x","y"];
      var ar=apps.map(function(a){return[
        a.name,
        a.domain,
        a.category||"",
        a.criticality,
        a.vendor||"",
        a.version||"",
        a.owner||"",
        a.users||"",
        a.description||"",
        ...(projectType==='deal'?[a.statusD1||"",a.statusD2||""]:[a.statut||""]),typeof a.budget==="number"?a.budget:"",typeof a.monthlyCost==="number"?a.monthlyCost:"",a.costType||"",a.licenses||"",a.hosting||"",a.appType||"",a.endOfService||"",
        Math.round(a.x)||0,
        Math.round(a.y)||0
      ];});
      var ws1=XLSX.utils.aoa_to_sheet([ah].concat(ar));
      ws1["!cols"]=projectType==='deal'?[{wch:24},{wch:16},{wch:14},{wch:12},{wch:18},{wch:10},{wch:18},{wch:10},{wch:35},{wch:18},{wch:16},{wch:16},{wch:12},{wch:12},{wch:24},{wch:28},{wch:18},{wch:7},{wch:7}]:[{wch:24},{wch:16},{wch:14},{wch:12},{wch:18},{wch:10},{wch:18},{wch:10},{wch:35},{wch:18},{wch:16},{wch:16},{wch:12},{wch:12},{wch:24},{wch:28},{wch:18},{wch:7},{wch:7}];
      ws1["!freeze"]={xSplit:0,ySplit:1};
      XLSX.utils.book_append_sheet(wb,ws1,"Applications");

      // ── Onglet 2: Flux (format reimportable) ──
      var fh=["Source","Cible","Protocole","Frequence","Label","Description"];
      var fr=flows.map(function(f){
        var fa=apps.find(function(a){return a.id===f.from;});
        var ta=apps.find(function(a){return a.id===f.to;});
        return[
          fa?fa.name:"",
          ta?ta.name:"",
          f.protocol||"",
          f.frequency||"",
          f.label||"",
          f.description||""
        ];
      });
      var ws2=XLSX.utils.aoa_to_sheet([fh].concat(fr));
      ws2["!cols"]=[{wch:24},{wch:24},{wch:12},{wch:14},{wch:30},{wch:40}];
      ws2["!freeze"]={xSplit:0,ySplit:1};
      XLSX.utils.book_append_sheet(wb,ws2,"Flux");

      // ── Onglet 3: Dashboard de synthese ──
      var tot=apps.length||1; var totF=flows.length;
      var doms=[...new Set(apps.map(function(a){return a.domain;}))].sort();
      var dd=[];
      dd.push(["DASHBOARD",""]);
      dd.push(["Date",new Date().toLocaleDateString("fr-FR")]);
      dd.push([""]);
      dd.push(["KPIs","Valeur"]);
      dd.push(["Applications",tot]);
      dd.push(["Domaines",doms.length]);
      dd.push(["Interfaces",totF]);
      dd.push(["Apps critiques",apps.filter(function(a){return a.criticality==="Haute";}).length]);
      dd.push([""]);
      dd.push(["CRITICITE","Nb","%"]);
      ["Haute","Moyenne","Basse"].forEach(function(cr){var n=apps.filter(function(a){return a.criticality===cr;}).length;dd.push([cr,n,Math.round(n/tot*100)+"%"]);});
      dd.push([""]);
      dd.push(["PAR DOMAINE","Apps","Flux","Critiques","TSA D1","Abandon D1"]);
      doms.forEach(function(d){var da=apps.filter(function(a){return a.domain===d;});var df=flows.filter(function(f){var fa=apps.find(function(a){return a.id===f.from;});var ta=apps.find(function(a){return a.id===f.to;});return fa&&ta&&(fa.domain===d||ta.domain===d);});dd.push([d,da.length,df.length,da.filter(function(a){return a.criticality==="Haute";}).length,da.filter(function(a){return a.statusD1==="Transfert TSA";}).length,da.filter(function(a){return a.statusD1==="Abandon";}).length]);});
      dd.push([""]);
      dd.push(["CARVE-OUT","Nb"]);
      dd.push(["Apps avec D1",apps.filter(function(a){return a.statusD1;}).length]);
      dd.push(["Apps avec D2",apps.filter(function(a){return a.statusD2;}).length]);
      dd.push(["Sans trajectoire",apps.filter(function(a){return !a.statusD1&&!a.statusD2;}).length]);
      dd.push([""]);
      dd.push(["DAY 1","Nb","%"]);
      ["Transfert TSA","Maintien","Rebuild","Abandon"].forEach(function(s){var n=apps.filter(function(a){return a.statusD1===s;}).length;dd.push([s,n,Math.round(n/tot*100)+"%"]);});
      dd.push(["Non defini",apps.filter(function(a){return !a.statusD1;}).length,Math.round(apps.filter(function(a){return !a.statusD1;}).length/tot*100)+"%"]);
      dd.push([""]);
      dd.push(["DAY 2","Nb","%"]);
      ["Clone & Clean","Transfert","Abandon","Rebuild"].forEach(function(s){var n=apps.filter(function(a){return a.statusD2===s;}).length;dd.push([s,n,Math.round(n/tot*100)+"%"]);});
      dd.push(["Non defini",apps.filter(function(a){return !a.statusD2;}).length,Math.round(apps.filter(function(a){return !a.statusD2;}).length/tot*100)+"%"]);
      var ws3=XLSX.utils.aoa_to_sheet(dd);
      ws3["!cols"]=[{wch:28},{wch:14},{wch:10},{wch:10},{wch:10},{wch:10}];
      XLSX.utils.book_append_sheet(wb,ws3,"Dashboard");

      // ── Onglet 4: Config couleurs domaines ──
      var ch4=["Domaine","Couleur"];
      var cr4=doms.map(function(d){return[d,(DC[d]||DC.Autre).ac];});
      var ws4=XLSX.utils.aoa_to_sheet([ch4].concat(cr4));
      ws4["!cols"]=[{wch:20},{wch:12}];
      XLSX.utils.book_append_sheet(wb,ws4,"Config");

      XLSX.writeFile(wb,"Cartographie_"+new Date().toISOString().slice(0,10)+".xlsx");
    }catch(err){alert("Erreur export XLSX: "+err.message);}
  };

  const exportCSV=()=>{const h=["Nom","Domaine","Criticité","Éditeur","Version","Responsable","Utilisateurs","Description"];const rows=apps.map(a=>[a.name,a.domain,a.criticality,a.vendor,a.version,a.owner,a.users,a.description].map(v=>'"'+v+'"').join(";"));const blob=new Blob(["\uFEFF"+[h.join(";"),...rows].join("\n")],{type:"text/csv;charset=utf-8;"});const l=document.createElement("a");l.href=URL.createObjectURL(blob);l.download="cartographie.csv";l.click();};

  const saveJSON=()=>{
    const data={version:2,theme:themeKey,date:new Date().toISOString(),apps,flows,domColors,domScales,domPads,catColors,catPads,catBounds,globalScale,fontScale,zoom:zm,offset:off};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const l=document.createElement("a");l.href=URL.createObjectURL(blob);
    l.download="cartographie_"+new Date().toISOString().slice(0,10)+".json";l.click();
  };
  const loadJSON=useCallback((file)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const data=JSON.parse(e.target.result);
        if(data.apps&&Array.isArray(data.apps)){
          setApps(data.apps);
          setFlows(data.flows||[]);
          if(data.domColors) setDomColors(p=>({...p,...data.domColors}));
          if(data.domScales) setDomScales(data.domScales);
          if(data.domPads) setDomPads(data.domPads);
          if(data.catColors) setCatColors(data.catColors);
          if(data.catPads) setCatPads(data.catPads);
          if(data.catBounds) setCatBounds(data.catBounds);
          if(data.globalScale) setGlobalScale(data.globalScale);
          if(data.fontScale) setFontScale(data.fontScale);
          if(data.zoom) setZm(data.zoom);
          if(data.offset) setOff(data.offset);
          if(data.theme)setThemeKey(data.theme);
          setView("mapping");
        } else {alert("Format JSON invalide: pas de tableau 'apps' trouvé");}
      }catch(err){alert("Erreur lecture JSON:\n"+err.message);}
    };
    reader.readAsText(file);
  },[]);

  const exportPPTX=async(opts)=>exportPPTXLocal(opts);

  const exportPPTXLocal=async(opts)=>{
    await ensurePptx();
    var _rawOpts=opts||exportOpts;
    var _opts=Object.assign({},_rawOpts,{
      // mapper les nouveaux opts simplifiés vers les anciens flags internes
      inclPaysage:_rawOpts.inclPaysage!==false,
      inclRecapTable:!!_rawOpts.inclMatrices,
      inclAggregated:!!_rawOpts.inclMatrices,
      inclDomainStatus:!!_rawOpts.inclDomainStatus,
      // options retirées du formulaire — valeurs fixes
      synthDetail:"none",
      inclFocusDomain:false,
      inclKPI:false,
      inclHubSlides:false,
      inclLegend:true,
      flowLineStyle:_rawOpts.flowLineStyle||"solid",
      hubLimit:Math.max(1,parseInt(_rawOpts.hubLimit)||8),
      hubDomainFilter:(_rawOpts.hubDomainFilter&&_rawOpts.hubDomainFilter.length>0)?_rawOpts.hubDomainFilter:null,
    });
    var _pDC=DC_DARK;
    const pres=new PptxGenJS();
    pres.layout="LAYOUT_WIDE";
    pres.author="Cartographe";
    pres.title="Cartographie Applicative";
    const W=13.333, H=7.5;
    // Wrapper : trace tous les slides créés pour tamponner le logo EN DERNIER (au-dessus de tout)
    var _allSlides=[];
    const _addSlide=function(){
      var sld=pres.addSlide();
      _allSlides.push(sld);
      return sld;
    };
    const mkSh=()=>({type:"outer",blur:4,offset:2,color:"000000",opacity:0.12,angle:135});
    // Slides hérités conçus pour 10×5.625 → proxy d'échelle uniforme vers 13.333×7.5 (même ratio 16:9)
    const K=W/10;
    const scaleOpts=(o)=>{
      if(!o||typeof o!=="object"||Array.isArray(o))return o;
      const n={...o};
      ["x","y","w","h"].forEach(p=>{if(typeof n[p]==="number")n[p]=n[p]*K;});
      if(n.colW)n.colW=Array.isArray(n.colW)?n.colW.map(v=>v*K):n.colW*K;
      if(typeof n.rowH==="number")n.rowH=n.rowH*K;
      return n;
    };
    const SS=(sl)=>new Proxy(sl,{
      get(t,prop){
        if(prop==="addText")return (txt,o)=>t.addText(txt,scaleOpts(o));
        if(prop==="addShape")return (s,o)=>t.addShape(s,scaleOpts(o));
        if(prop==="addTable")return (r,o)=>t.addTable(r,scaleOpts(o));
        const v=t[prop];
        return typeof v==="function"?v.bind(t):v;
      },
      set(t,prop,val){t[prop]=val;return true;}
    });

    const cp=_opts.clientPrimary||"2979FF";
    // ─── Slide 1: Title / cover ───
    if(_opts.inclExecSlides){
    const s1=SS(_addSlide());
    s1.background={color:"FFFFFF"};
    // Left accent panel
    s1.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:0.18,h:5.625,fill:{color:cp},line:{type:"none"}});
    // Bottom footer band
    s1.addShape(pres.shapes.RECTANGLE,{x:0,y:4.80,w:10,h:0.825,fill:{color:"F1F5F9"},line:{type:"none"}});
    s1.addShape(pres.shapes.RECTANGLE,{x:0,y:4.80,w:10,h:0.04,fill:{color:cp},line:{type:"none"}});
    // Logo client (if provided)
    if(_opts.clientLogo){
      s1.addImage({data:_opts.clientLogo,x:9.05,y:0.04,w:0.90,h:0.42,sizing:{type:"contain",w:0.90,h:0.42}});
    }
    // Icon accent
    s1.addShape(pres.shapes.RECTANGLE,{x:0.50,y:1.10,w:0.06,h:1.60,fill:{color:cp},line:{type:"none"}});
    // Title
    s1.addText("Cartographie Applicative",{x:0.72,y:1.10,w:6.60,h:0.90,fontSize:36,bold:true,color:"0F172A",fontFace:"Trebuchet MS",margin:0});
    s1.addText("Analyse du Système d'Information",{x:0.72,y:2.05,w:6.60,h:0.40,fontSize:16,bold:false,color:"475569",fontFace:"Calibri",margin:0});
    // Stats chips
    var chips=[{l:String(apps.length)+" applications",c:cp},{l:String(doms.length)+" domaines",c:"475569"},{l:String(flows.length)+" interfaces",c:"475569"}];
    var chipXt=0.72;
    chips.forEach(function(ch){
      s1.addShape(pres.shapes.RECTANGLE,{x:chipXt,y:2.62,w:2.10,h:0.36,fill:{color:ch.c,transparency:ch.c===cp?88:95},line:{color:ch.c,width:0.5}});
      s1.addText(ch.l,{x:chipXt+0.10,y:2.62,w:1.90,h:0.36,fontSize:10.5,bold:true,color:ch.c,fontFace:"Calibri",margin:0,valign:"middle"});
      chipXt+=2.24;
    });
    s1.addText("CONFIDENTIEL",{x:5.50,y:4.87,w:4.30,h:0.30,fontSize:9,bold:true,color:cp,fontFace:"Calibri",align:"right",margin:0,charSpacing:2});

    // ─── Slide 2: Synthèse & Messages clés ───
    {
    const sSC=SS(_addSlide());
    sSC.background={color:"F8F9FC"};
    sSC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.60,fill:{color:cp},line:{type:"none"}});
    sSC.addShape(pres.shapes.RECTANGLE,{x:0,y:0.585,w:10,h:0.022,fill:{color:"FFFFFF",transparency:70},line:{type:"none"}});
    sSC.addText("SYNTHÈSE & MESSAGES CLÉS",{x:0.35,y:0.08,w:8,h:0.46,fontSize:22,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
    // Données
    const scPairs={};
    flows.forEach(function(f){
      const fd=(apps.find(function(a){return a.id===f.from;})||{}).domain;
      const td=(apps.find(function(a){return a.id===f.to;})||{}).domain;
      if(fd&&td&&fd!==td){const k=fd+" → "+td;scPairs[k]=(scPairs[k]||0)+1;}
    });
    const scTopP=Object.entries(scPairs).sort(function(a,b){return b[1]-a[1]||(a[0]<b[0]?-1:1);}).slice(0,5);
    const scTotI=Object.values(scPairs).reduce(function(acc,v){return acc+v;},0);
    const scConn={};
    apps.forEach(function(a){scConn[a.id]=0;});
    flows.forEach(function(f){if(scConn[f.from]!==undefined)scConn[f.from]++;if(scConn[f.to]!==undefined)scConn[f.to]++;});
    const scHubs=apps.filter(function(a){return scConn[a.id]>0;}).sort(function(a,b){return scConn[b.id]-scConn[a.id];}).slice(0,5);
    // Domaines classés par volume de flux (total entrants + sortants)
    const scDomFl={};
    apps.forEach(function(a){scDomFl[a.domain]=0;});
    flows.forEach(function(f){
      const fd=(apps.find(function(a){return a.id===f.from;})||{}).domain;
      const td=(apps.find(function(a){return a.id===f.to;})||{}).domain;
      if(fd)scDomFl[fd]=(scDomFl[fd]||0)+1;
      if(td)scDomFl[td]=(scDomFl[td]||0)+1;
    });
    const scDomFlE=Object.entries(scDomFl).sort(function(a,b){return b[1]-a[1];});
    const scDomTop=scDomFlE[0]||null;
    const scDomBot=scDomFlE.length>1?scDomFlE[scDomFlE.length-1]:null;
    // 3 cartes messages
    const scCW=3.02,scCH=3.52,scCGap=0.23,scCX0=0.25,scCY0=0.72;
    const scCardDefs=[
      {icon:"◎",title:"CONCENTRATION DES FLUX",accent:"6366F1",type:"pairs"},
      {icon:"◎",title:"DOMAINES PAR VOLUME DE FLUX",accent:"0EA5E9",type:"domflow"},
      {icon:"◈",title:"HUBS DU SYSTÈME D'INFORMATION",accent:"F59E0B",type:"hubs"},
    ];
    scCardDefs.forEach(function(card,ci){
      const cx=scCX0+ci*(scCW+scCGap);const cy=scCY0;
      sSC.addShape(pres.shapes.RECTANGLE,{x:cx,y:cy,w:scCW,h:scCH,fill:{color:"FFFFFF"},line:{color:"E2E8F0",width:0.5},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:0.08,angle:135}});
      sSC.addShape(pres.shapes.RECTANGLE,{x:cx,y:cy,w:scCW,h:0.28,fill:{color:card.accent,transparency:88},line:{type:"none"}});
      sSC.addShape(pres.shapes.RECTANGLE,{x:cx,y:cy,w:0.06,h:scCH,fill:{color:card.accent},line:{type:"none"}});
      sSC.addText(card.icon+" "+card.title,{x:cx+0.12,y:cy+0.06,w:scCW-0.20,h:0.20,fontSize:8,bold:true,color:card.accent,fontFace:"Calibri",charSpacing:0.5,margin:0,shrinkText:true});
      sSC.addShape(pres.shapes.LINE,{x:cx+0.12,y:cy+0.30,w:scCW-0.24,h:0,line:{color:"E2E8F0",width:0.35}});
      if(card.type==="pairs"){
        if(scTopP.length===0){
          sSC.addText("Aucun flux inter-domaine",{x:cx+0.12,y:cy+0.50,w:scCW-0.24,h:0.30,fontSize:9,color:"94A3B8",fontFace:"Calibri",margin:0});
        } else {
          const scMaxPv=scTopP[0][1];
          scTopP.forEach(function(pe,pi){
            const py=cy+0.44+pi*0.58;
            const pct3=scTotI>0?Math.round(pe[1]/scTotI*100):0;
            sSC.addText(String(pe[1]),{x:cx+0.12,y:py,w:0.45,h:0.30,fontSize:22,bold:true,color:card.accent,fontFace:"Trebuchet MS",margin:0});
            sSC.addText("flux — "+pct3+"%",{x:cx+0.60,y:py+0.10,w:scCW-0.80,h:0.18,fontSize:7,color:"64748B",fontFace:"Calibri",margin:0});
            sSC.addText(pe[0],{x:cx+0.12,y:py+0.28,w:scCW-0.24,h:0.18,fontSize:8,color:"334155",fontFace:"Calibri",margin:0,shrinkText:true});
            const bw6=(pe[1]/scMaxPv)*(scCW-0.30);
            sSC.addShape(pres.shapes.RECTANGLE,{x:cx+0.12,y:py+0.46,w:bw6,h:0.06,fill:{color:card.accent},line:{type:"none"}});
          });
        }
      } else if(card.type==="domflow"){
        // Classement des domaines par volume de flux — même pattern que le panneau hubs
        const dfMaxV=scDomFlE.length>0?(scDomFlE[0][1]||1):1;
        const dfRows=scDomFlE.slice(0,5);
        if(dfRows.length===0){
          sSC.addText("Aucun flux défini",{x:cx+0.12,y:cy+0.50,w:scCW-0.24,h:0.30,fontSize:9,color:"94A3B8",fontFace:"Calibri",margin:0});
        } else {
          dfRows.forEach(function(de,di){
            const dhy=cy+0.42+di*0.58;
            const dFlV=de[1];
            const dDC=(_pDC[de[0]]||_pDC.Autre).ac.replace("#","");
            const dbw=Math.max(0.06,(dFlV/dfMaxV)*(scCW-0.70));
            // Accent color strip
            sSC.addShape(pres.shapes.RECTANGLE,{x:cx+0.12,y:dhy+0.04,w:0.06,h:0.14,fill:{color:dDC},line:{type:"none"}});
            sSC.addText(de[0],{x:cx+0.22,y:dhy,w:scCW-0.36,h:0.22,fontSize:9,bold:true,color:"0F172A",fontFace:"Calibri",margin:0,shrinkText:true});
            // Bar track (gris clair)
            sSC.addShape(pres.shapes.RECTANGLE,{x:cx+0.12,y:dhy+0.28,w:scCW-0.28,h:0.14,fill:{color:"F1F5F9"},line:{type:"none"}});
            // Bar fill (couleur domaine)
            sSC.addShape(pres.shapes.RECTANGLE,{x:cx+0.12,y:dhy+0.28,w:dbw,h:0.14,fill:{color:dDC},line:{type:"none"}});
            // Count at end
            sSC.addText(String(dFlV)+" flux",{x:cx+0.18+dbw,y:dhy+0.26,w:scCW-0.36-dbw,h:0.18,fontSize:7.5,bold:true,color:dDC,fontFace:"Calibri",margin:0,shrinkText:true});
          });
        }
      } else if(card.type==="hubs"){
        if(scHubs.length===0){
          sSC.addText("Aucun flux défini",{x:cx+0.12,y:cy+0.50,w:scCW-0.24,h:0.30,fontSize:9,color:"5577AA",fontFace:"Calibri",margin:0});
        } else {
          const scMaxConn=scConn[scHubs[0].id]||1;
          scHubs.forEach(function(a,hi){
            const hy=cy+0.44+hi*0.60;
            const conn3=scConn[a.id]||0;
            const bw7=(conn3/scMaxConn)*(scCW-0.70);
            sSC.addText(a.name,{x:cx+0.12,y:hy,w:scCW-0.28,h:0.22,fontSize:9,bold:true,color:"0F172A",fontFace:"Calibri",margin:0,shrinkText:true});
            sSC.addShape(pres.shapes.RECTANGLE,{x:cx+0.12,y:hy+0.26,w:bw7,h:0.14,fill:{color:card.accent},line:{type:"none"}});
            sSC.addText(String(conn3)+" cx",{x:cx+0.18+bw7,y:hy+0.24,w:0.50,h:0.18,fontSize:8,bold:true,color:card.accent,fontFace:"Calibri",margin:0});
            sSC.addText(a.domain,{x:cx+0.12,y:hy+0.42,w:scCW-0.24,h:0.14,fontSize:7,color:"64748B",fontFace:"Calibri",margin:0,shrinkText:true});
          });
        }
      }
    });
    // Bandeau chiffres bas
    const scInterDoms=new Set();
    Object.keys(scPairs).forEach(function(k){scInterDoms.add(k.split(" → ")[0]);});
    const scBsy=scCY0+scCH+0.16;
    sSC.addShape(pres.shapes.RECTANGLE,{x:0.25,y:scBsy,w:9.50,h:0.76,fill:{color:"FFFFFF"},line:{color:"E2E8F0",width:0.5},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});
    const scBKpi=[
      {l:"Total flux",v:flows.length,c:"6366F1"},
      {l:"Flux inter-domaines",v:scTotI,c:"8B5CF6"},
      {l:"Ratio flux / app",v:apps.length?+(flows.length/apps.length).toFixed(1):0,c:"22D3EE"},
      {l:"Domaines avec flux sortants",v:scInterDoms.size,c:"F59E0B"},
    ];
    scBKpi.forEach(function(k,i){
      const bkx2=0.60+i*2.30;
      sSC.addShape(pres.shapes.RECTANGLE,{x:bkx2-0.08,y:scBsy+0.06,w:0.04,h:0.65,fill:{color:k.c},line:{type:"none"}});
      sSC.addText(String(k.v),{x:bkx2+0.06,y:scBsy+0.06,w:1.80,h:0.40,fontSize:24,bold:true,color:k.c,fontFace:"Trebuchet MS",margin:0});
      sSC.addText(k.l,{x:bkx2+0.06,y:scBsy+0.48,w:2.05,h:0.22,fontSize:7.5,color:"64748B",fontFace:"Calibri",margin:0});
    });
    }// end sSC block

    // --- Slide Synthese Executive ---
    {
    const _sXRaw=_addSlide();// raw slide : addChart requiert les coords 13.333" réelles
    const sSX=SS(_sXRaw);
    sSX.background={color:"F8F9FC"};
    // Bandeau header clair
    sSX.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.60,fill:{color:cp},line:{type:"none"}});
    sSX.addShape(pres.shapes.RECTANGLE,{x:0,y:0.585,w:10,h:0.022,fill:{color:"FFFFFF",transparency:70},line:{type:"none"}});
    sSX.addText("SYNTHÈSE EXÉCUTIVE",{x:0.35,y:0.08,w:7.5,h:0.46,fontSize:22,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
    // Calculs D1/D2/risques
    const sxD1Def=apps.filter(function(a){return a.statusD1;}).length;
    const sxD2Def=apps.filter(function(a){return a.statusD2;}).length;
    const sxPctD1=apps.length?Math.round(sxD1Def/apps.length*100):0;
    const sxPctD2=apps.length?Math.round(sxD2Def/apps.length*100):0;
    // KPI strip (3 tuiles)
    const sxKpis=[
      {l:"Applications",v:String(apps.length),c:"6366F1"},
      {l:"Domaines",v:String(doms.length),c:"8B5CF6"},
      {l:"Interfaces",v:String(flows.length),c:"22D3EE"},
    ];
    sxKpis.forEach(function(k,i){
      const kx=0.25+i*2.30;const ky=0.72;
      sSX.addShape(pres.shapes.RECTANGLE,{x:kx,y:ky,w:1.75,h:0.95,fill:{color:"FFFFFF"},line:{color:"E2E8F0",width:0.5},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});
      sSX.addShape(pres.shapes.RECTANGLE,{x:kx,y:ky,w:0.055,h:0.95,fill:{color:k.c},line:{type:"none"}});
      sSX.addText(k.v,{x:kx+0.14,y:ky+0.06,w:1.50,h:0.52,fontSize:30,bold:true,color:k.c,fontFace:"Trebuchet MS",margin:0});
      sSX.addText(k.l,{x:kx+0.14,y:ky+0.60,w:1.50,h:0.18,fontSize:8,color:"64748B",fontFace:"Calibri",margin:0});
      if(k.sub)sSX.addText(k.sub,{x:kx+0.14,y:ky+0.78,w:1.50,h:0.14,fontSize:6.5,color:"94A3B8",fontFace:"Calibri",margin:0});
    });
    // ── Helper donut (dessine sur le raw slide en coords 13.333") ──
    // bx,by,bw,bh : coords de la carte en espace 10" SS ; defCnt : nb définis
    const sxDrawDonut=function(bx,by,bw,bh,stats,tot,defCnt){
      if(!tot)return;
      var RK=K; // K=13.333/10 déjà défini
      // Carte en coords raw
      var rbx=bx*RK,rby=by*RK,rbw=bw*RK,rbh=bh*RK;
      var hdrH=0.28*RK; // hauteur de la banderole
      // Zone de contenu (sous la banderole, avec marges)
      var cx=rbx+0.14*RK, cy=rby+hdrH+0.10*RK;
      var cw=rbw-0.28*RK, ch=rbh-hdrH-0.18*RK;
      // Donut : carré, à gauche de la zone
      var dSide=Math.min(ch,cw*0.46);
      var dx=cx, dy=cy+(ch-dSide)/2;
      // Légende : à droite du donut
      var legX=dx+dSide+0.18, legW=cw-dSide-0.22, legY=cy, legH=ch;
      // Donut : uniquement les valeurs > 0 (segment 0 = invisible dans PowerPoint)
      var chartSt=stats.filter(function(s){return s.v>0;});
      if(chartSt.length===0)return;
      _sXRaw.addChart("doughnut",[{name:"S",labels:chartSt.map(function(s){return s.l;}),values:chartSt.map(function(s){return s.v;})}],{
        x:dx,y:dy,w:dSide,h:dSide,
        holeSize:62,
        chartColors:chartSt.map(function(s){return s.c;}),
        showLegend:false,
        showValue:false,
        showPercent:false,
        showTitle:false,
        dataLabelFontSize:1,
      });
      // Texte central (nb définis + %)
      var pctDef=tot?Math.round(defCnt/tot*100):0;
      var ctX=dx+dSide/2-0.52, ctY=dy+dSide/2-0.28;
      _sXRaw.addText(String(defCnt),{x:ctX,y:ctY,w:1.04,h:0.34,fontSize:18,bold:true,color:"1E293B",fontFace:"Trebuchet MS",align:"center",valign:"middle",margin:0});
      _sXRaw.addText(pctDef+"% définis",{x:ctX,y:ctY+0.32,w:1.04,h:0.20,fontSize:7,color:"94A3B8",fontFace:"Calibri",align:"center",valign:"top",margin:0});
      // Légende : TOUS les statuts affichés (y compris ceux à 0) pour une légende exhaustive
      var rowH=Math.min(0.38,legH/Math.max(stats.length,1));
      var totLH=stats.length*rowH;
      var lY=legY+(legH-totLH)/2;
      stats.forEach(function(s){
        var pct=Math.round(s.v/tot*100);
        var isZero=s.v===0;
        // Pastille colorée (grisée si 0)
        _sXRaw.addShape(pres.shapes.OVAL,{x:legX,y:lY+(rowH-0.14)/2,w:0.14,h:0.14,fill:{color:isZero?"D1D5DB":s.c},line:{type:"none"}});
        // Libellé (grisé si 0)
        _sXRaw.addText(s.l,{x:legX+0.19,y:lY,w:legW-0.68,h:rowH,fontSize:7.5,color:isZero?"9CA3AF":"374151",fontFace:"Calibri",valign:"middle",margin:0,shrinkText:true,italic:isZero});
        // Valeur + %
        _sXRaw.addText(isZero?"—":s.v+" | "+pct+"%",{x:legX+legW-0.64,y:lY,w:0.64,h:rowH,fontSize:7,color:isZero?"CBD5E1":"94A3B8",fontFace:"Calibri",align:"right",valign:"middle",margin:0});
        lY+=rowH;
      });
    };
    if(projectType==='deal'){
    // Bloc Day 1
    const d1Stats2=[
      {l:"Transfert TSA",v:apps.filter(function(a){return a.statusD1==="Transfert TSA";}).length,c:"F59E0B"},
      {l:"Maintien",v:apps.filter(function(a){return a.statusD1==="Maintien";}).length,c:"10B981"},
      {l:"Rebuild",v:apps.filter(function(a){return a.statusD1==="Rebuild";}).length,c:"6366F1"},
      {l:"Abandon",v:apps.filter(function(a){return a.statusD1==="Abandon";}).length,c:"EF4444"},
      {l:"Non défini",v:apps.filter(function(a){return !a.statusD1;}).length,c:"94A3B8"},
    ];
    const d1bx=0.25,d1by=1.80,d1bw=4.50,d1bh=2.30;
    sSX.addShape(pres.shapes.RECTANGLE,{x:d1bx,y:d1by,w:d1bw,h:d1bh,fill:{color:"FFFFFF"},line:{color:"E2E8F0",width:0.5},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});
    sSX.addShape(pres.shapes.RECTANGLE,{x:d1bx,y:d1by,w:d1bw,h:0.28,fill:{color:"FEF3C7"},line:{type:"none"}});
    sSX.addText("VISION CLOSING — DAY 1",{x:d1bx+0.14,y:d1by+0.05,w:3.2,h:0.20,fontSize:9,bold:true,color:"D97706",fontFace:"Calibri",charSpacing:1,margin:0});
    sSX.addText(sxD1Def+" / "+apps.length+" définies",{x:d1bx+d1bw-1.55,y:d1by+0.05,w:1.45,h:0.18,fontSize:8,color:"94A3B8",fontFace:"Calibri",align:"right",margin:0});
    sxDrawDonut(d1bx,d1by,d1bw,d1bh,d1Stats2,apps.length,sxD1Def);
    // Bloc Day 2
    const d2Stats2=[
      {l:"Clone & Clean",v:apps.filter(function(a){return a.statusD2==="Clone & Clean";}).length,c:"3B82F6"},
      {l:"Transfert",v:apps.filter(function(a){return a.statusD2==="Transfert";}).length,c:"10B981"},
      {l:"Rebuild",v:apps.filter(function(a){return a.statusD2==="Rebuild";}).length,c:"8B5CF6"},
      {l:"Abandon",v:apps.filter(function(a){return a.statusD2==="Abandon";}).length,c:"EF4444"},
      {l:"Non défini",v:apps.filter(function(a){return !a.statusD2;}).length,c:"94A3B8"},
    ];
    const d2bx=5.00,d2by=1.80,d2bw=4.75,d2bh=2.30;
    sSX.addShape(pres.shapes.RECTANGLE,{x:d2bx,y:d2by,w:d2bw,h:d2bh,fill:{color:"FFFFFF"},line:{color:"E2E8F0",width:0.5},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});
    sSX.addShape(pres.shapes.RECTANGLE,{x:d2bx,y:d2by,w:d2bw,h:0.28,fill:{color:"EDE9FE"},line:{type:"none"}});
    sSX.addText("VISION CIBLE — DAY 2",{x:d2bx+0.14,y:d2by+0.05,w:3.2,h:0.20,fontSize:9,bold:true,color:"7C3AED",fontFace:"Calibri",charSpacing:1,margin:0});
    sSX.addText(sxD2Def+" / "+apps.length+" définies",{x:d2bx+d2bw-1.55,y:d2by+0.05,w:1.45,h:0.18,fontSize:8,color:"94A3B8",fontFace:"Calibri",align:"right",margin:0});
    sxDrawDonut(d2bx,d2by,d2bw,d2bh,d2Stats2,apps.length,sxD2Def);
    } else {
    // Bloc Statut (remplace Day 1 / Day 2 pour les projets Cartographie SI)
    const stStats2=STATUT_OPTS.filter(function(v){return v;}).map(function(v){
      return {l:v,v:apps.filter(function(a){return a.statut===v;}).length,c:(STATUT_COLORS[v]||"#94A3B8").replace("#","")};
    });
    const stDef=apps.filter(function(a){return a.statut;}).length;
    const stbx=0.25,stby=1.80,stbw=9.50,stbh=2.30;
    sSX.addShape(pres.shapes.RECTANGLE,{x:stbx,y:stby,w:stbw,h:stbh,fill:{color:"FFFFFF"},line:{color:"E2E8F0",width:0.5},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});
    sSX.addShape(pres.shapes.RECTANGLE,{x:stbx,y:stby,w:stbw,h:0.28,fill:{color:"DBEAFE"},line:{type:"none"}});
    sSX.addText("RÉPARTITION PAR STATUT",{x:stbx+0.14,y:stby+0.05,w:3.2,h:0.20,fontSize:9,bold:true,color:"1D4ED8",fontFace:"Calibri",charSpacing:1,margin:0});
    sSX.addText(stDef+" / "+apps.length+" définies",{x:stbx+stbw-1.55,y:stby+0.05,w:1.45,h:0.18,fontSize:8,color:"94A3B8",fontFace:"Calibri",align:"right",margin:0});
    sxDrawDonut(stbx,stby,stbw,stbh,stStats2,apps.length,stDef);
    }
    // Bloc responsables (bas)
    const sxOwners={};
    apps.forEach(function(a){const o=a.owner&&a.owner.trim()?a.owner.trim():"Non renseigné";sxOwners[o]=(sxOwners[o]||0)+1;});
    const sxTopOwn=Object.entries(sxOwners).filter(function(e){return e[0]!=="Non renseigné";}).sort(function(a,b){return b[1]-a[1];}).slice(0,7);
    const oby3=4.22;
    sSX.addShape(pres.shapes.RECTANGLE,{x:0.25,y:oby3,w:9.50,h:1.22,fill:{color:"FFFFFF"},line:{color:"E2E8F0",width:0.5},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});
    sSX.addText("RÉPARTITION PAR RESPONSABLE",{x:0.40,y:oby3+0.06,w:5,h:0.18,fontSize:8,bold:true,color:cp,fontFace:"Calibri",charSpacing:1,margin:0});
    if(sxTopOwn.length>0){
      const sxMaxOv=sxTopOwn[0][1];
      const sxColW2=9.0/Math.min(sxTopOwn.length,7);
      sxTopOwn.forEach(function(oe,i){
        const ox=0.45+i*sxColW2;
        const bw5=(oe[1]/sxMaxOv)*(sxColW2-0.18);
        sSX.addShape(pres.shapes.RECTANGLE,{x:ox,y:oby3+0.33,w:bw5,h:0.20,fill:{color:cp},line:{type:"none"}});
        sSX.addText(String(oe[1]),{x:ox+bw5+0.04,y:oby3+0.32,w:0.32,h:0.22,fontSize:8,bold:true,color:cp,fontFace:"Calibri",margin:0,valign:"middle"});
        sSX.addText(oe[0],{x:ox,y:oby3+0.57,w:sxColW2-0.06,h:0.20,fontSize:7,color:"475569",fontFace:"Calibri",margin:0,shrinkText:true});
        sSX.addText(Math.round(oe[1]/apps.length*100)+"%",{x:ox,y:oby3+0.78,w:sxColW2-0.06,h:0.16,fontSize:6.5,color:"94A3B8",fontFace:"Calibri",margin:0});
      });
    } else {
      sSX.addText("Aucun responsable renseigné",{x:0.40,y:oby3+0.50,w:9,h:0.30,fontSize:10,color:"5577AA",fontFace:"Calibri",margin:0});
    }
    }// end sSX block

    // ─── Slides: Vue par domaine - Statut Day 1 & Day 2 ───
    // Source unique de vérité : la légende est dérivée du colorMap pour garantir l'alignement.
    if(_opts.inclDomainStatus){
      const d1Colors={"Transfert TSA":"F59E0B","Maintien":"10B981","Rebuild":"6366F1","Abandon":"EF4444","Non défini":"94A3B8"};
      const d2Colors={"Clone & Clean":"3B82F6","Transfert":"10B981","Rebuild":"8B5CF6","Abandon":"EF4444","Non défini":"94A3B8"};
      [
        {label:"CARTOGRAPHIE PAR DOMAINE — STATUT DAY 1 (CLOSING)",field:"statusD1",colorMap:d1Colors,legend:Object.entries(d1Colors)},
        {label:"CARTOGRAPHIE PAR DOMAINE — STATUT DAY 2 (CIBLE)",field:"statusD2",colorMap:d2Colors,legend:Object.entries(d2Colors)},
      ].forEach(function(cfg){
        const dsSlide=SS(_addSlide());
        dsSlide.background={color:"F8F9FC"};
        // Header
        dsSlide.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.50,fill:{color:cp},line:{type:"none"}});
        dsSlide.addText(cfg.label,{x:0.30,y:0.08,w:8.0,h:0.35,fontSize:13,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0,charSpacing:0.5});
        // Legend
        var legX=0.30,legY=0.58;
        cfg.legend.forEach(function(le){
          dsSlide.addShape(pres.shapes.RECTANGLE,{x:legX,y:legY+0.04,w:0.18,h:0.14,fill:{color:le[1]},line:{type:"none"}});
          dsSlide.addText(le[0],{x:legX+0.22,y:legY,w:1.30,h:0.22,fontSize:7.5,color:"444444",fontFace:"Calibri",margin:0});
          legX+=1.58;
        });
        // Domain rows — multi-chip-row + pagination
        const domList2=[...new Set(apps.map(function(a){return a.domain;}))];
        const cW=0.85,cH=0.24,cGap=0.05,cRowGap=0.03;
        const contentX2=2.18,labelW2=1.80;
        const cpr=Math.max(1,Math.floor((9.50-contentX2)/(cW+cGap)));
        const domPad2=0.06,interDomGap2=0.05;
        const slideStartY=0.88,slideMaxY=5.55;
        function addDsSlideNew(){
          const sl=SS(_addSlide());
          sl.background={color:"F8F9FC"};
          sl.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.50,fill:{color:cp},line:{type:"none"}});
          sl.addText(cfg.label,{x:0.30,y:0.08,w:8.0,h:0.35,fontSize:13,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0,charSpacing:0.5});
          var legX2=0.30,legY2=0.58;
          cfg.legend.forEach(function(le){
            sl.addShape(pres.shapes.RECTANGLE,{x:legX2,y:legY2+0.04,w:0.18,h:0.14,fill:{color:le[1]},line:{type:"none"}});
            sl.addText(le[0],{x:legX2+0.22,y:legY2,w:1.30,h:0.22,fontSize:7.5,color:"444444",fontFace:"Calibri",margin:0});
            legX2+=1.58;
          });
          return sl;
        }
        var curDsSlide=dsSlide;
        var curDsY=slideStartY;
        domList2.forEach(function(dom){
          const domAppsD=apps.filter(function(a){return a.domain===dom;});
          const dc=_pDC[dom]||_pDC.Autre;
          const domAc=(dc.ac||"#548CA8").replace("#","");
          const chipRows=Math.ceil(domAppsD.length/cpr)||1;
          const domBlockH=domPad2*2+chipRows*cH+(chipRows-1)*cRowGap;
          // New slide if overflow
          if(curDsY+domBlockH>slideMaxY){curDsSlide=addDsSlideNew();curDsY=slideStartY;}
          // Domain label
          curDsSlide.addShape(pres.shapes.RECTANGLE,{x:0.25,y:curDsY,w:labelW2,h:domBlockH,fill:{color:domAc,transparency:88},line:{color:domAc,width:0.5}});
          curDsSlide.addText(dom,{x:0.28,y:curDsY+domPad2,w:labelW2-0.06,h:domBlockH*0.55,fontSize:8,bold:true,color:domAc,fontFace:"Calibri",margin:0,shrinkText:true,valign:"middle"});
          curDsSlide.addText(domAppsD.length+" app"+(domAppsD.length>1?"s":""),{x:0.28,y:curDsY+domBlockH*0.62,w:labelW2-0.06,h:domBlockH*0.32,fontSize:6,color:"888888",fontFace:"Calibri",margin:0,valign:"top"});
          // Chips
          domAppsD.forEach(function(app,ai){
            const row=Math.floor(ai/cpr),col=ai%cpr;
            const chipX=contentX2+col*(cW+cGap);
            const chipY=curDsY+domPad2+row*(cH+cRowGap);
            const st=app[cfg.field]||"Non défini";
            const stc=cfg.colorMap[st]||"94A3B8";
            curDsSlide.addShape(pres.shapes.RECTANGLE,{x:chipX,y:chipY,w:cW,h:cH,fill:{color:stc,transparency:82},line:{color:stc,width:0.5}});
            curDsSlide.addShape(pres.shapes.RECTANGLE,{x:chipX,y:chipY,w:0.04,h:cH,fill:{color:stc},line:{type:"none"}});
            curDsSlide.addText(app.name,{x:chipX+0.07,y:chipY,w:cW-0.10,h:cH*0.58,fontSize:6,bold:true,color:"1a1a1a",fontFace:"Calibri",margin:0,shrinkText:true,valign:"middle"});
            curDsSlide.addText(st==="Non défini"?"—":st,{x:chipX+0.07,y:chipY+cH*0.56,w:cW-0.10,h:cH*0.40,fontSize:5,color:stc,fontFace:"Calibri",margin:0,shrinkText:true});
          });
          curDsSlide.addShape(pres.shapes.LINE,{x:0.25,y:curDsY+domBlockH,w:9.50,h:0,line:{color:"E2E8F0",width:0.35}});
          curDsY+=domBlockH+interDomGap2;
        });
      });
    }// end inclDomainStatus

    // ─── Slides: Environnement applicatif Day 1 & Day 2 ───
    // Style : grandes zones Catégorie (tirets + fond teinté) > Domaines (boîtes) > Chips applicatifs
    (projectType==='deal'?[
      {title:"ENVIRONNEMENT APPLICATIF — DAY 1",subtitle:"STATUT DE CLOSING",field:"statusD1",
       colorMap:_opts.statusColorsD1||{"Transfert TSA":"F59E0B","Maintien":"10B981","Rebuild":"6366F1","Abandon":"EF4444","Non défini":"94A3B8"}},
      {title:"ENVIRONNEMENT APPLICATIF — DAY 2",subtitle:"VISION CIBLE",field:"statusD2",
       colorMap:_opts.statusColorsD2||{"Clone & Clean":"3B82F6","Transfert":"10B981","Rebuild":"8B5CF6","Abandon":"EF4444","Non défini":"94A3B8"}},
    ]:[]).forEach(function(cfg){
      if(!apps.length)return;

      // ── Dimensions fixes du slide (no SS proxy) ──
      var mX=0.22, mY_top=0.58; // marges
      var hdrH=0.56, legH=0.33, statsH=0.46;
      var cY=hdrH+legH+0.05; // début zone contenu
      var cH=H-cY-statsH-0.08; // hauteur disponible ≈ 5.97"
      var cW=W-2*mX; // largeur disponible ≈ 12.893"

      // ── Palette catégories ──
      var CAT_PAL=["548CA8","D4A017","E06C75","52B788","9D4EDD","D63384","7B78FF","40A578"];

      // ── Dimensions chips & domaines (vertical → scalable) ──
      var CW=1.24,CH=0.225; // chip width/height
      var CGH=0.052,CGV=0.040; // chip gaps H/V
      var DPX=0.09,DPY=0.088; // padding intérieur boîte domaine
      var DNH=0.21; // hauteur étiquette nom domaine (au-dessus de la boîte)
      var DDGH=0.095,DDGV=0.10; // gap entre domaines H/V

      // ── Dimensions zones catégorie ──
      var CPX=0.12; // padding horizontal dans la catégorie
      var CPTY=0.28; // padding haut (pour le nom de catégorie)
      var CPBY=0.09; // padding bas
      var CCGH=0.10; // gap horizontal entre colonnes de catégories
      var CCGV=0.08; // gap vertical entre catégories empilées

      // ── Construction liste domaines ──
      var envDoms=[...new Set(apps.map(function(a){return a.domain;}))]
        .map(function(d){
          var dc=_pDC[d]||_pDC.Autre;
          var dApps=apps.filter(function(a){return a.domain===d;});
          var catCounts={};
          dApps.forEach(function(a){var c=a.category||"";if(c)catCounts[c]=(catCounts[c]||0)+1;});
          var dCat=Object.keys(catCounts).sort(function(a,b){return catCounts[b]-catCounts[a];})[0]||"";
          return{name:d,apps:dApps,ac:(dc.ac||"#78909C").replace("#",""),category:dCat};
        })
        .sort(function(a,b){return b.apps.length-a.apps.length;});
      var hasCats=envDoms.some(function(d){return d.category;});

      // ── Regroupement par catégorie ──
      var catMap={},catOrder=[];
      if(hasCats){
        envDoms.forEach(function(dom){
          var cat=dom.category||"Sans catégorie";
          if(!catMap[cat]){catMap[cat]=[];catOrder.push(cat);}
          catMap[cat].push(dom);
        });
        catOrder.sort(function(a,b){
          return catMap[b].reduce(function(s,d){return s+d.apps.length;},0)
                -catMap[a].reduce(function(s,d){return s+d.apps.length;},0);
        });
      } else {
        catMap["__all__"]=envDoms;
        catOrder=["__all__"];
      }

      // ── Layout colonnes au niveau slide ──
      var nSlCols=catOrder.length<=1?1:2;
      var catColW=(cW-(nSlCols-1)*CCGH)/nSlCols;

      // ── Calcul du nombre de colonnes de domaines et largeur domaine ──
      function getCatLayout(catName){
        var doms=catMap[catName];
        var nDC=doms.length<=1?1:2;
        var dw=(catColW-2*CPX-(nDC-1)*DDGH)/nDC;
        if(dw<1.55&&nDC>1){nDC=1;dw=catColW-2*CPX;}
        return{nDC:nDC,dw:dw};
      }

      // ── Fonctions hauteur (valeurs NON scalées → multiplier par sf au rendu) ──
      function cprFn(dw){return Math.max(1,Math.floor((dw-2*DPX+CGH)/(CW+CGH)));}
      function domBH(n,dw){var r=Math.ceil(n/cprFn(dw))||1;return DPY+r*(CH+CGV)-CGV+DPY;}
      function domTH(n,dw){return DNH+domBH(n,dw);}
      function catContentH(catName){
        var info=getCatLayout(catName),doms=catMap[catName];
        var cHs=new Array(info.nDC).fill(0);
        doms.forEach(function(dom){
          var best=0;for(var i=1;i<info.nDC;i++){if(cHs[i]<cHs[best])best=i;}
          cHs[best]+=domTH(dom.apps.length,info.dw)+DDGV;
        });
        return Math.max.apply(null,cHs)-DDGV;
      }
      function catTH(catName){return CPTY+catContentH(catName)+CPBY;}

      // ── Layout slide : greedy packing des catégories dans nSlCols colonnes ──
      function computeLayout(sf){
        var cHs=new Array(nSlCols).fill(0),asgns=[];
        catOrder.forEach(function(cat){
          var best=0;for(var i=1;i<nSlCols;i++){if(cHs[i]<cHs[best])best=i;}
          asgns.push({cat:cat,col:best,yOff:cHs[best]});
          cHs[best]+=catTH(cat)*sf+CCGV*sf;
        });
        return{asgns:asgns,totalH:Math.max.apply(null,cHs)-(CCGV*sf)};
      }

      // Calcul du facteur d'échelle
      var lay0=computeLayout(1.0);
      var sf=Math.min(1.0,cH/Math.max(0.01,lay0.totalH));
      var layout=computeLayout(sf);

      // ── Création du slide (header + légende + barre stats) ──
      var sl=_addSlide();
      sl.background={color:"F8F9FC"};
      sl.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:W,h:hdrH,fill:{color:cp},line:{type:"none"}});
      sl.addShape(pres.shapes.RECTANGLE,{x:0,y:hdrH-0.025,w:W,h:0.025,fill:{color:"FFFFFF",transparency:75},line:{type:"none"}});
      sl.addText(cfg.title,{x:mX,y:0.08,w:9.5,h:0.32,fontSize:15,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0,charSpacing:0.5});
      sl.addText(cfg.subtitle,{x:mX,y:0.38,w:6.0,h:0.15,fontSize:7.5,color:"FFFFFFCC",fontFace:"Calibri",margin:0,charSpacing:2});
      sl.addText(apps.length+" applications · "+envDoms.length+" domaines",{x:W-3.0,y:0.33,w:2.75,h:0.16,fontSize:7,color:"FFFFFFAA",fontFace:"Calibri",align:"right",margin:0});
      // Légende
      var lx=mX,lly=hdrH+0.07;
      Object.entries(cfg.colorMap).forEach(function(le){
        sl.addShape(pres.shapes.RECTANGLE,{x:lx,y:lly+0.08,w:0.24,h:0.11,fill:{color:le[1]},line:{type:"none"},rounding:0.01});
        sl.addText(le[0],{x:lx+0.30,y:lly+0.04,w:1.82,h:0.22,fontSize:7.5,color:"374151",fontFace:"Calibri",margin:0,valign:"middle"});
        lx+=2.08;
      });
      // Barre stats en bas
      var stY=H-statsH+0.05,bH2=0.22;
      sl.addShape(pres.shapes.LINE,{x:mX,y:stY-0.05,w:cW,h:0,line:{color:"E2E8F0",width:0.75}});
      var bsx=mX;
      Object.entries(cfg.colorMap).forEach(function(e){
        var cnt=e[0]==="Non défini"?apps.filter(function(a){return !a[cfg.field];}).length:apps.filter(function(a){return a[cfg.field]===e[0];}).length;
        if(!cnt)return;
        var pct=cnt/apps.length,bw=cW*pct;
        if(bw<0.02)return;
        sl.addShape(pres.shapes.RECTANGLE,{x:bsx,y:stY,w:bw,h:bH2,fill:{color:e[1]},line:{type:"none"}});
        if(bw>0.40){
          sl.addText(e[0],{x:bsx,y:stY+bH2+0.03,w:bw,h:0.13,fontSize:5,color:"64748B",fontFace:"Calibri",align:"center",margin:0,shrinkText:true});
          sl.addText(cnt+" ("+Math.round(pct*100)+"%)",{x:bsx,y:stY+bH2+0.15,w:bw,h:0.13,fontSize:6,bold:true,color:e[1],fontFace:"Calibri",align:"center",margin:0,shrinkText:true});
        }
        bsx+=bw;
      });

      // ── Rendu des catégories ──
      var colXsSlide=Array.from({length:nSlCols},function(_,i){return mX+i*(catColW+CCGH);});
      layout.asgns.forEach(function(asgn){
        var catName=asgn.cat;
        var ci=catOrder.indexOf(catName);
        var catColor=hasCats?CAT_PAL[ci%CAT_PAL.length]:cp;
        var info=getCatLayout(catName);
        var catX=colXsSlide[asgn.col];
        var catY=cY+asgn.yOff;   // asgn.yOff est déjà mis à l'échelle par sf
        var ch=catTH(catName)*sf;

        // Zone catégorie : fond gris clair + bordure grise + nom catégorie en bleu
        sl.addShape(pres.shapes.RECTANGLE,{x:catX,y:catY,w:catColW,h:ch,
          fill:{color:"F1F5F9"},
          line:{color:"CBD5E1",width:0.7,dashType:"dash"}});
        if(hasCats){
          var catLblW=Math.min(3.6,catColW*0.55);
          sl.addText(catName,{x:catX+catColW-catLblW-0.06,y:catY+0.04,
            w:catLblW,h:Math.max(0.18,CPTY*sf*0.75),
            fontSize:9.5,bold:true,color:"1D4ED8",fontFace:"Trebuchet MS",
            align:"right",margin:0,valign:"middle",shrinkText:true,italic:true});
        }

        // ── Rendu des domaines dans la catégorie ──
        var doms=catMap[catName];
        var domColHs=new Array(info.nDC).fill(0);
        var domColXs=Array.from({length:info.nDC},function(_,i2){return catX+CPX+i2*(info.dw+DDGH);});

        doms.forEach(function(dom){
          // Trouver la colonne la moins haute
          var best=0;
          for(var i=1;i<info.nDC;i++){if(domColHs[i]<domColHs[best])best=i;}
          var dx=domColXs[best];
          var dy=catY+CPTY*sf+domColHs[best];

          // Calcul hauteurs scalées
          var lCpr=cprFn(info.dw);
          var sCH=CH*sf,sCGV=CGV*sf,sDPY=DPY*sf,sDNH=DNH*sf;
          var bh=sDPY+Math.ceil(dom.apps.length/lCpr||1)*(sCH+sCGV)-sCGV+sDPY;

          // Nom domaine au-dessus de la boîte (bold, majuscules, couleur domaine)
          sl.addText(dom.name,{x:dx,y:dy,w:info.dw,h:sDNH,
            fontSize:6.5,bold:true,color:"1E293B",fontFace:"Calibri",
            margin:0,valign:"bottom",shrinkText:true});

          // Boîte domaine
          var boxY=dy+sDNH;
          sl.addShape(pres.shapes.RECTANGLE,{x:dx,y:boxY,w:info.dw,h:bh,
            fill:{color:"FFFFFF"},line:{color:dom.ac,width:0.6},
            shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});

          // Chips applicatifs
          dom.apps.forEach(function(app,ai){
            var col=ai%lCpr,row=Math.floor(ai/lCpr);
            var cx=dx+DPX+col*(CW+CGH);
            var cy2=boxY+sDPY+row*(sCH+sCGV);
            var st=app[cfg.field]||"Non défini";
            var stc=cfg.colorMap[st]||"94A3B8";
            sl.addShape(pres.shapes.RECTANGLE,{x:cx,y:cy2,w:CW,h:sCH,
              fill:{color:stc,transparency:82},line:{color:stc,width:0.4}});
            sl.addShape(pres.shapes.RECTANGLE,{x:cx,y:cy2,w:0.05,h:sCH,
              fill:{color:stc},line:{type:"none"}});
            sl.addText(app.name,{x:cx+0.09,y:cy2,w:CW-0.12,h:sCH,
              fontSize:5.5,bold:true,color:"1E293B",fontFace:"Calibri",
              margin:0,shrinkText:true,valign:"middle"});
          });

          domColHs[best]+=domTH(dom.apps.length,info.dw)*sf+DDGV*sf;
        });
      });
    });

    }// end inclExecSlides

    // ─── Slide Paysage applicatif (treemap) ───
    if(_opts.inclPaysage&&apps.length>0){
      var pvSl=_addSlide();
      pvSl.background={color:"F8FAFC"};
      // Header — même style que les autres slides
      pvSl.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:13.333,h:0.55,fill:{color:cp||"0B2545"},line:{type:"none"}});
      pvSl.addText("PAYSAGE APPLICATIF",{x:0.3,y:0.10,w:9,h:0.35,fontSize:14,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
      pvSl.addText(apps.length+" applications · "+[...new Set(apps.map(function(a){return a.domain;}))].length+" domaines",{x:0,y:0.12,w:13.1,h:0.30,fontSize:9,color:"CBD5E1",fontFace:"Calibri",margin:0,align:"right"});
      // Palette sobre gris-bleu — une couleur par domaine, identique pour catégories et apps
      var PV_PAL=["2563EB","475569","0891B2","4F46E5","0E7490","64748B","1D4ED8","0369A1","334155","6366F1","1E40AF","0F766E"];
      // Attribution couleur par domaine (ordre d'apparition dans pvBuildLayout)
      var PVW=1600,PVH=900;
      var pvHdrH=0.60; // header + petit espace
      var pvMargin=0.15;
      var pvAreaW=W-pvMargin*2;
      var pvAreaH=H-pvHdrH-pvMargin;
      var scX=pvAreaW/PVW;
      var scY=pvAreaH/PVH;
      var pvL=pvBuildLayout(apps,PVW,PVH);
      pvL.forEach(function(dom,di){
        var dc=PV_PAL[di%PV_PAL.length];
        var dr=dom.rect;
        var dx=pvMargin+dr.x*scX,dy=pvHdrH+dr.y*scY,dw=dr.w*scX,dh=dr.h*scY;
        // Fond domaine — léger
        pvSl.addShape(pres.shapes.RECTANGLE,{x:dx+0.01,y:dy+0.01,w:Math.max(0.01,dw-0.02),h:Math.max(0.01,dh-0.02),fill:{color:dc,transparency:92},line:{color:dc,width:1.2,transparency:20}});
        // Header domaine
        var dhH=Math.max(0.14,Math.min(0.22,dh*0.15));
        pvSl.addShape(pres.shapes.RECTANGLE,{x:dx+0.01,y:dy+0.01,w:Math.max(0.01,dw-0.02),h:dhH,fill:{color:dc,transparency:0},line:{type:"none"}});
        if(dw>0.35){
          pvSl.addText(dom.domaine+(dw>1.0?" · "+dom.nbApps:""),{x:dx+0.04,y:dy+0.01,w:Math.max(0.05,dw-0.08),h:dhH,fontSize:Math.max(5,Math.min(9,Math.round(dw*8))),bold:true,color:"FFFFFF",fontFace:"Calibri",margin:0,valign:"middle",fit:"shrink"});
        }
        // Catégories
        dom.quartiers.forEach(function(q){
          var qr=q.rect;
          var qx=pvMargin+qr.x*scX,qy=pvHdrH+qr.y*scY,qw=qr.w*scX,qh=qr.h*scY;
          // Fond catégorie — même couleur, plus opaque
          pvSl.addShape(pres.shapes.RECTANGLE,{x:qx+0.006,y:qy+0.006,w:Math.max(0.01,qw-0.012),h:Math.max(0.01,qh-0.012),fill:{color:dc,transparency:83},line:{color:dc,width:0.6,transparency:30}});
          if(qw>0.28&&qh>0.12){
            pvSl.addText(q.quartier,{x:qx+0.02,y:qy+0.01,w:Math.max(0.05,qw-0.04),h:Math.min(0.14,qh*0.30),fontSize:Math.max(4,Math.min(7,Math.round(qw*7))),bold:true,color:dc,fontFace:"Calibri",margin:0,valign:"top",fit:"shrink"});
          }
          // Apps individuelles — même couleur, plus remplies
          q.apps.forEach(function(item){
            var ar=item.rect;
            var ax=pvMargin+ar.x*scX,ay=pvHdrH+ar.y*scY,aw=ar.w*scX,ah=ar.h*scY;
            pvSl.addShape(pres.shapes.RECTANGLE,{x:ax+0.003,y:ay+0.003,w:Math.max(0.005,aw-0.006),h:Math.max(0.005,ah-0.006),fill:{color:"E2E8F0",transparency:0},line:{color:dc,width:0.25,transparency:20}});
            if(aw>0.20&&ah>0.08){
              pvSl.addText(item.app.name,{x:ax+0.007,y:ay+0.004,w:Math.max(0.04,aw-0.014),h:Math.max(0.03,ah-0.008),fontSize:Math.max(4,Math.min(7,Math.round(aw*9))),color:"1E293B",fontFace:"Calibri",margin:0,valign:"middle",fit:"shrink"});
            }
          });
        });
      });
      // Footer
    }// end inclPaysage

    // ═══════════════════════════════════════════════════════════════════
    // ─── Cartographie style URBANISATION SI (diagramme d'architecte) ───
    // ═════════════════════════════════════════════════════════════════════
    // - Domaines en panneaux gris clair avec titre fin
    // - Apps en boîtes simples (nom uniquement)
    // - Flux colorés par protocole (ETL=vert, API=bleu, SFTP=violet, …)
    // - Labels avec ID FX_NNN
    // - Légende protocoles visible sur le slide
    // - Routage orthogonal en L avec halo blanc
    const PROTO_COLORS={
      "ETL":"00C853","API":"2979FF","REST":"2979FF","Webhook":"448AFF",
      "SOAP":"7C4DFF","SFTP":"AA00FF","Fichier":"AA00FF",
      "JDBC":"FF6D00","ODBC":"FF6D00",
      "MQ":"00BFA5","Batch":"8D6E63","Manuel":"78909C","Autre":"546E7A"
    };
    const protoColor=(p)=>PROTO_COLORS[p]||"455A64";
    const protoLabel=(p)=>{
      if(p==="API"||p==="REST"||p==="Webhook")return"Web Service / API";
      if(p==="SFTP"||p==="Fichier")return"File Transfer";
      if(p==="JDBC"||p==="ODBC")return"Database link";
      if(p==="MQ")return"Message Queue";
      return p||"Autre";
    };

    // Grid hub-centric : domaine le plus connecté au centre + cellules spiralées
    const arrangeGrid=(subset,subFlows,CW,CH)=>{
      const byDom={};
      subset.forEach(a=>{(byDom[a.domain]=byDom[a.domain]||[]).push(a);});
      const domList=Object.keys(byDom);
      const n=domList.length;
      if(n===0)return{byDom,domList,cells:{},cols:0,rows:0,cellW:0,cellH:0,gap:0};

      // Connectivité par domaine (#flux entrants+sortants inter-domaines + intra)
      const domConn={};
      domList.forEach(d=>domConn[d]=0);
      // Aussi mesurer hub par app la plus connectée
      const appConn={};
      (subFlows||[]).forEach(f=>{
        const fa=subset.find(a=>a.id===f.from),ta=subset.find(a=>a.id===f.to);
        if(!fa||!ta)return;
        appConn[fa.id]=(appConn[fa.id]||0)+1;
        appConn[ta.id]=(appConn[ta.id]||0)+1;
        domConn[fa.domain]=(domConn[fa.domain]||0)+1;
        domConn[ta.domain]=(domConn[ta.domain]||0)+1;
      });
      // Ordre : connectivité décroissante, puis nb apps décroissant
      const sortedDoms=[...domList].sort((a,b)=>
        ((domConn[b]||0)-(domConn[a]||0))||(byDom[b].length-byDom[a].length)
      );

      // Dim grille
      const aspect=CW/CH;
      let cols=Math.max(1,Math.round(Math.sqrt(n*aspect)));
      cols=Math.min(cols,5);
      let rows=Math.ceil(n/cols);
      if(n%cols>0&&n%cols<=Math.floor(cols/2)&&rows>1&&(cols-1)>=2){
        const altRows=Math.ceil(n/(cols-1));
        if(altRows<=rows+1){cols=cols-1;rows=Math.ceil(n/cols);}
      }
      const gap=0.70;
      const cellW=(CW-gap*(cols-1))/cols;
      const cellH=(CH-gap*(rows-1))/rows;

      // Liste des cellules ordonnées par distance au centre (spirale)
      const ccx=(cols-1)/2,ccy=(rows-1)/2;
      const cellList=[];
      for(let r=0;r<rows;r++)for(let cc=0;cc<cols;cc++){
        cellList.push({r,c:cc,dist:Math.hypot(cc-ccx,r-ccy)});
      }
      cellList.sort((a,b)=>{
        if(Math.abs(a.dist-b.dist)>0.01)return a.dist-b.dist;
        // Tie-breaker : prefer left then top
        return (a.c-b.c)||(a.r-b.r);
      });

      // Assign : domaine le plus connecté → cellule centrale, etc.
      const cells={};
      sortedDoms.forEach((d,idx)=>{
        if(idx>=cellList.length)return;
        const cell=cellList[idx];
        cells[d]={row:cell.r,col:cell.c,x:cell.c*(cellW+gap),y:cell.r*(cellH+gap),w:cellW,h:cellH};
      });

      // ── Minimisation des croisements (greedy pairwise swap) ──
      // Compte le nb d'arêtes inter-domaines qui se croisent (en grille logique).
      const ccw=(ax,ay,bx,by,cx,cy)=>(cy-ay)*(bx-ax)>(by-ay)*(cx-ax);
      const segIntersect=(e1,e2)=>{
        // Ignore si partagent un endpoint
        if((e1.a===e2.a)||(e1.a===e2.b)||(e1.b===e2.a)||(e1.b===e2.b))return false;
        return ccw(e1.x1,e1.y1,e2.x1,e2.y1,e2.x2,e2.y2)!==ccw(e1.x2,e1.y2,e2.x1,e2.y1,e2.x2,e2.y2)
            && ccw(e1.x1,e1.y1,e1.x2,e1.y2,e2.x1,e2.y1)!==ccw(e1.x1,e1.y1,e1.x2,e1.y2,e2.x2,e2.y2);
      };
      const buildEdges=(c)=>{
        const edges=[];
        (subFlows||[]).forEach(f=>{
          const fa=subset.find(a=>a.id===f.from),ta=subset.find(a=>a.id===f.to);
          if(!fa||!ta||fa.domain===ta.domain)return;
          const c1=c[fa.domain],c2=c[ta.domain];
          if(!c1||!c2)return;
          edges.push({a:fa.domain,b:ta.domain,x1:c1.col,y1:c1.row,x2:c2.col,y2:c2.row});
        });
        return edges;
      };
      const countCrossings=(c)=>{
        const edges=buildEdges(c);
        let n=0;
        for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++)
          if(segIntersect(edges[i],edges[j]))n++;
        return n;
      };
      const swapCells=(d1,d2)=>{
        const a=cells[d1],b=cells[d2];
        [a.row,b.row]=[b.row,a.row];
        [a.col,b.col]=[b.col,a.col];
        [a.x,b.x]=[b.x,a.x];
        [a.y,b.y]=[b.y,a.y];
      };
      let best=countCrossings(cells);
      const placedDoms=Object.keys(cells);
      let improved=true,iter=0;
      while(improved&&iter<25){
        improved=false;iter++;
        for(let i=0;i<placedDoms.length;i++){
          for(let j=i+1;j<placedDoms.length;j++){
            swapCells(placedDoms[i],placedDoms[j]);
            const nc=countCrossings(cells);
            if(nc<best){best=nc;improved=true;}
            else swapCells(placedDoms[i],placedDoms[j]); // revert
          }
        }
      }

      return{byDom,domList,cells,cols,rows,cellW,cellH,gap,domConn,appConn,crossings:best};
    };

    const drawCartoSlide=(title,subset,subFlows,showFlows,showLabels=true,greyedIds=null)=>{
      const sC=_addSlide();
      sC.background={color:"FFFFFF"};
      const sW=13.333,sH=7.5;

      // Helper : line segment from (x1,y1) to (x2,y2) — always positive w/h with flipH/flipV
      // so OOXML extent is valid (negative cx/cy is silently dropped by PowerPoint).
      const addLineSeg=(x1,y1,x2,y2,arrow,color,width,dash)=>{
        const w=Math.abs(x2-x1),h=Math.abs(y2-y1);
        if(w<0.005&&h<0.005)return; // skip zero-length
        const opts={x:Math.min(x1,x2),y:Math.min(y1,y2),w:w||0.001,h:h||0.001,line:{color:color,width:width,dashType:dash?"sysDot":"solid"}};
        if(x2<x1)opts.flipH=true;
        if(y2<y1)opts.flipV=true;
        if(arrow){opts.line.endArrowType="triangle";opts.line.endArrowSize=7;}
        sC.addShape(pres.shapes.LINE,opts);
      };
      const drawPath=(pts,color,dash,width=1.2)=>{
        // Trait coloré + très fin halo blanc (0.4pt de chaque côté) pour le contraste sur croisements.
        const segs=[];
        for(let i=0;i<pts.length-1;i++){
          const[x1,y1]=pts[i],[x2,y2]=pts[i+1];
          if(Math.abs(x2-x1)<0.005&&Math.abs(y2-y1)<0.005)continue;
          segs.push({x1,y1,x2,y2});
        }
        if(segs.length===0)return;
        // Halo blanc pour contraste sur croisements
        segs.forEach(s=>addLineSeg(s.x1,s.y1,s.x2,s.y2,false,"FFFFFF",width+1.8,false));
        // Trait coloré principal
        segs.forEach((s,idx)=>addLineSeg(s.x1,s.y1,s.x2,s.y2,idx===segs.length-1,color,width,dash));
      };

      // Title
      sC.addText(title,{x:0.3,y:0.12,w:sW-0.6,h:0.5,fontSize:20,bold:true,color:"0B2545",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
      const dCount=[...new Set(subset.map(a=>a.domain))].length;
      sC.addText(subset.length+" applications · "+dCount+" domaines"+(showFlows?" · "+subFlows.length+" flux":""),{x:0.3,y:0.58,w:sW-0.6,h:0.2,fontSize:10,color:"888888",fontFace:"Calibri",align:"center",margin:0});

      const legW=showFlows?1.4:0,legH=showFlows?0.6:0;
      const CX=0.3,CY=0.92,CW=sW-0.6,CH=sH-1.15;

      if(subset.length===0){sC.addText("Aucune application à afficher",{x:CX,y:CY+CH/2-0.2,w:CW,h:0.4,fontSize:13,color:"999999",fontFace:"Calibri",align:"center"});return;}

      // Grid arrangement — hub-centric
      const gr=arrangeGrid(subset,subFlows,CW,CH);
      const HEAD=0.26,dPad=0.06,aGap=0.04;

      // Build domBoxes (absolute coords) and app positions
      // Within each domain, sort apps by connectivity desc → hub app first (top)
      Object.keys(gr.byDom).forEach(d=>{
        gr.byDom[d].sort((a,b)=>(gr.appConn[b.id]||0)-(gr.appConn[a.id]||0));
      });
      const domBoxes={};
      const positions={};
      Object.entries(gr.cells).forEach(([d,cell])=>{
        const dApps=gr.byDom[d];
        const n=dApps.length;
        const cc=_pDC[d]||_pDC.Autre;
        // Choose app columns within the cell
        let aCols;
        if(n<=2)aCols=1;
        else if(n<=6)aCols=2;
        else if(n<=12)aCols=3;
        else aCols=4;
        aCols=Math.min(aCols,Math.ceil(Math.sqrt(n*1.5)));
        const aRows=Math.ceil(n/aCols);
        // App dimensions to fill the cell
        const innerW=cell.w-dPad*2;
        const innerH=cell.h-HEAD-dPad*1.4;
        // Cap app size so cells keep routing slack between domain panels
        const aWmax=0.95,aHmax=0.34;
        const aW=Math.min(aWmax,(innerW-aGap*(aCols-1))/aCols);
        const aH=Math.min(aHmax,Math.max(0.24,(innerH-aGap*(aRows-1))/aRows));
        const actualGap=aRows>1?Math.max(aGap,(innerH-aRows*aH)/(aRows-1)):0;
        const usedH=HEAD+aRows*aH+(aRows-1)*actualGap+dPad*1.4;
        const usedW=aCols*aW+(aCols-1)*aGap+dPad*2;
        const absX=CX+cell.x,absY=CY+cell.y;
        domBoxes[d]={
          x:absX,y:absY,w:cell.w,h:cell.h,
          ac:cc.ac.replace("#",""),bg:cc.bg.replace("#",""),
          aCols,aRows,aW,aH
        };
        const innerX=absX+(cell.w-usedW)/2+dPad;
        const innerY=absY+HEAD+dPad*0.7;
        dApps.forEach((app,ai)=>{
          const col=ai%aCols,row=Math.floor(ai/aCols);
          const ax=innerX+col*(aW+aGap),ay=innerY+row*(aH+(typeof actualGap!=='undefined'?actualGap:aGap));
          positions[app.id]={x:ax,y:ay,w:aW,h:aH,cx:ax+aW/2,cy:ay+aH/2,domain:d};
        });
      });

      // ── Pass 1 : Domain panels ──
      Object.entries(domBoxes).forEach(([d,box])=>{
        sC.addShape(pres.shapes.RECTANGLE,{x:box.x,y:box.y,w:box.w,h:box.h,fill:{color:box.bg||"F5F6FA"},line:{color:box.ac,width:1.0},shadow:{type:"outer",blur:4,offset:1.5,color:"000000",opacity:0.09,angle:135}});
        sC.addShape(pres.shapes.RECTANGLE,{x:box.x,y:box.y,w:box.w,h:HEAD,fill:{color:box.ac},line:{type:"none"}});
        sC.addText(d+" ("+gr.byDom[d].length+")",{x:box.x+0.12,y:box.y,w:box.w-0.24,h:HEAD,fontSize:11,bold:true,color:"FFFFFF",fontFace:"Calibri",valign:"middle",margin:0});
      });

      // ── Pass 3 : Flow arrows — routage par couloirs inter-domaines ──
      const labelRects=[];
      Object.values(positions).forEach(p=>labelRects.push({x:p.x-0.02,y:p.y-0.02,w:p.w+0.04,h:p.h+0.04,_isApp:true}));
      Object.values(domBoxes).forEach(b=>labelRects.push({x:b.x,y:b.y,w:b.w,h:HEAD,_isApp:true}));
      const flowMeta=[];
      const flowSegs=[]; // all drawn flow line segments for label-vs-flow collision
      const usedProtos=new Set();

      if(showFlows){
        const validFlows=subFlows.filter(f=>positions[f.from]&&positions[f.to]);
        const pairMap={};
        const sideExitCount={},sideEntryCount={},sideExitIdx={},sideEntryIdx={};

        const computePairAxis=(A,B)=>{
          const dx=B.x+B.w/2-(A.x+A.w/2),dy=B.y+B.h/2-(A.y+A.h/2);
          const xSep=(A.x+A.w<B.x)||(B.x+B.w<A.x);
          const ySep=(A.y+A.h<B.y)||(B.y+B.h<A.y);
          if(xSep&&!ySep)return"X";
          if(ySep&&!xSep)return"Y";
          return Math.abs(dx)>=Math.abs(dy)?"X":"Y";
        };
        // Channel coord must lie in an inter-cell gap (never through a cell interior).
        // For non-adjacent domains, pick the gap just BEFORE the target (so vertical/horizontal
        // travel stays in the gap, not crossing intermediate cells).
        const channelCoord=(A,B,axis)=>{
          if(axis==="X"){
            const srcCell=gr.cells[Object.keys(domBoxes).find(k=>domBoxes[k]===A)];
            const tgtCell=gr.cells[Object.keys(domBoxes).find(k=>domBoxes[k]===B)];
            if(!srcCell||!tgtCell){
              if(B.x+B.w/2>A.x+A.w/2)return(A.x+A.w+B.x)/2;
              return(B.x+B.w+A.x)/2;
            }
            const gapIdx=tgtCell.col>srcCell.col?tgtCell.col-1:tgtCell.col;
            return CX+gapIdx*(gr.cellW+gr.gap)+gr.cellW+gr.gap/2;
          } else {
            const srcCell=gr.cells[Object.keys(domBoxes).find(k=>domBoxes[k]===A)];
            const tgtCell=gr.cells[Object.keys(domBoxes).find(k=>domBoxes[k]===B)];
            if(!srcCell||!tgtCell){
              if(B.y+B.h/2>A.y+A.h/2)return(A.y+A.h+B.y)/2;
              return(B.y+B.h+A.y)/2;
            }
            const gapIdx=tgtCell.row>srcCell.row?tgtCell.row-1:tgtCell.row;
            return CY+gapIdx*(gr.cellH+gr.gap)+gr.cellH+gr.gap/2;
          }
        };

        validFlows.forEach(f=>{
          const Aa=positions[f.from],Bb=positions[f.to];
          if(Aa.domain===Bb.domain)return;
          const Ad=domBoxes[Aa.domain],Bd=domBoxes[Bb.domain];
          const key=Aa.domain+"|"+Bb.domain;
          if(!pairMap[key]){
            const axis=computePairAxis(Ad,Bd);
            const coord=channelCoord(Ad,Bd,axis);
            let sideA,sideB;
            if(axis==="X"){
              sideA=(Bd.x+Bd.w/2)>(Ad.x+Ad.w/2)?"right":"left";
              sideB=(Bd.x+Bd.w/2)>(Ad.x+Ad.w/2)?"left":"right";
            } else {
              sideA=(Bd.y+Bd.h/2)>(Ad.y+Ad.h/2)?"bottom":"top";
              sideB=(Bd.y+Bd.h/2)>(Ad.y+Ad.h/2)?"top":"bottom";
            }
            pairMap[key]={flows:[],axis,coord,sideA,sideB};
          }
          pairMap[key].flows.push(f);
          const sA=f.from+"|"+pairMap[key].sideA;
          const sB=f.to+"|"+pairMap[key].sideB;
          sideExitCount[sA]=(sideExitCount[sA]||0)+1;
          sideEntryCount[sB]=(sideEntryCount[sB]||0)+1;
        });

        // ── PRÉ-PASSE : distribution radiale globale des ancres sur les hubs ──
        // Compte le nb TOTAL de paires d'apps qui sortent/entrent sur chaque (appId, côté)
        // toutes paires de domaines confondues → évite la convergence en un point unique.
        const _gExitCnt={},_gEntryCnt={};
        Object.entries(pairMap).forEach(function([_k,_pr]){
          var _apm2={};
          _pr.flows.forEach(function(f){var apk2=f.from+"|"+f.to;(_apm2[apk2]=_apm2[apk2]||[]).push(f);});
          Object.entries(_apm2).forEach(function([,_gf]){
            var ek=_gf[0].from+"|"+_pr.sideA,nk=_gf[0].to+"|"+_pr.sideB;
            _gExitCnt[ek]=(_gExitCnt[ek]||0)+1;
            _gEntryCnt[nk]=(_gEntryCnt[nk]||0)+1;
          });
        });
        const _gExitIdx={},_gEntryIdx={};
        const _gSlotT=function(cnt,idx,appId,side){
          var k=appId+"|"+side;
          var tot=cnt[k]||1;
          var i2=idx[k]||0;
          idx[k]=i2+1;
          // Étale les points d'ancrage entre 12% et 88% du bord, uniformément
          return tot===1?0.5:Math.max(0.12,Math.min(0.88,(i2+1)/(tot+1)));
        };

        const sidePt=(box,side,t)=>{
          if(side==="right")return{x:box.x+box.w,y:box.y+0.04+t*(box.h-0.08)};
          if(side==="left") return{x:box.x,       y:box.y+0.04+t*(box.h-0.08)};
          if(side==="top")  return{x:box.x+0.04+t*(box.w-0.08),y:box.y};
          return                 {x:box.x+0.04+t*(box.w-0.08),y:box.y+box.h};
        };
        const LANE_SPACE=0.14;

        let flowIdx=1;
        // Inter-domain — aggregated by app pair (×N badge + proportional thickness)
        Object.entries(pairMap).forEach(([key,pair])=>{
          // Group flows by app pair (from+"|"+to)
          const appPairMap={};
          pair.flows.forEach(function(f){const apk=f.from+"|"+f.to;(appPairMap[apk]=appPairMap[apk]||[]).push(f);});
          const appPairList=Object.entries(appPairMap);
          const nPairs=appPairList.length;

          appPairList.forEach(function([apk,groupFlows],i){
            flowIdx++;
            // Most common protocol in the group
            const protoCounts={};
            groupFlows.forEach(function(f){const p=f.protocol||"Autre";protoCounts[p]=(protoCounts[p]||0)+1;});
            const proto=Object.entries(protoCounts).sort(function(a,b){return b[1]-a[1];})[0][0];
            const lineColor=protoColor(proto);
            usedProtos.add(proto);
            const count=groupFlows.length;
            const lineWidth=Math.min(3.0,1.2+(count-1)*0.5);

            const f=groupFlows[0];
            const Aa=positions[f.from],Bb=positions[f.to];
            // Use evenly spaced t for exit/entry on app box edges
            // t global par (appId, côté) → ancres étalées même si l'app est hub vers N domaines
            const tA=_gSlotT(_gExitCnt,_gExitIdx,f.from,pair.sideA);
            const tB=_gSlotT(_gEntryCnt,_gEntryIdx,f.to,pair.sideB);
            const p1=sidePt(Aa,pair.sideA,tA);
            const p2=sidePt(Bb,pair.sideB,tB);

            const maxSpread=gr.gap*0.40;
            const rawOff=nPairs===1?0:(i-(nPairs-1)/2)*LANE_SPACE;
            const laneOff=Math.max(-maxSpread,Math.min(maxSpread,rawOff));
            var MIN_LEG=0.15;
            var channelC=pair.coord+laneOff;
            if(pair.axis==="X"){if(Math.abs(channelC-p1.x)<MIN_LEG)channelC=p1.x+(channelC>=p1.x?MIN_LEG:-MIN_LEG);if(Math.abs(channelC-p2.x)<MIN_LEG)channelC=p2.x+(channelC>=p2.x?MIN_LEG:-MIN_LEG);}
            else{if(Math.abs(channelC-p1.y)<MIN_LEG)channelC=p1.y+(channelC>=p1.y?MIN_LEG:-MIN_LEG);if(Math.abs(channelC-p2.y)<MIN_LEG)channelC=p2.y+(channelC>=p2.y?MIN_LEG:-MIN_LEG);}

            var x1=p1.x,y1=p1.y,x2=p2.x,y2=p2.y;
            var pts2,channelSeg;
            if(pair.axis==="X"){
              pts2=[[x1,y1],[channelC,y1],[channelC,y2],[x2,y2]];
              channelSeg={x:channelC,y:Math.min(y1,y2),w:0,h:Math.abs(y2-y1)};
            }else{
              pts2=[[x1,y1],[x1,channelC],[x2,channelC],[x2,y2]];
              channelSeg={x:Math.min(x1,x2),y:channelC,w:Math.abs(x2-x1),h:0};
            }
            drawPath(pts2,lineColor,false,lineWidth);
            for(var si=0;si<pts2.length-1;si++)flowSegs.push({x1:pts2[si][0],y1:pts2[si][1],x2:pts2[si+1][0],y2:pts2[si+1][1]});
            sC.addShape(pres.shapes.OVAL,{x:x1-0.04,y:y1-0.04,w:0.08,h:0.08,fill:{color:lineColor},line:{color:"FFFFFF",width:0.5}});
            // ×N badge for aggregated flows
            if(count>1){
              var bx2=channelSeg.x+channelSeg.w/2-0.14;
              var by2=channelSeg.y+channelSeg.h/2-0.09;
              sC.addShape(pres.shapes.RECTANGLE,{x:bx2,y:by2,w:0.28,h:0.17,fill:{color:lineColor},line:{type:"none"}});
              sC.addText("×"+count,{x:bx2,y:by2,w:0.28,h:0.17,fontSize:7,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
              // Inclure le badge dans la zone d'exclusion des labels (évite superposition)
              labelRects.push({x:bx2-0.03,y:by2-0.03,w:0.34,h:0.23});
            }
            flowMeta.push({flow:f,channelSeg,channelAxis:pair.axis,p1:{x:x1,y:y1},p2:{x:x2,y:y2},lineColor,count});
          });
        });

        // Intra-domain : L simple
        validFlows.forEach(f=>{
          if(positions[f.from].domain!==positions[f.to].domain)return;
          flowIdx++;
          const proto=f.protocol||"Autre";
          const lineColor=protoColor(proto);
          usedProtos.add(proto);
          const Aa=positions[f.from],Bb=positions[f.to];
          const dx=Bb.cx-Aa.cx,dy=Bb.cy-Aa.cy;
          const horiz=Math.abs(dx)>=Math.abs(dy);
          const sA=horiz?(dx>0?"right":"left"):(dy>0?"bottom":"top");
          const sB=horiz?(dx>0?"left":"right"):(dy>0?"top":"bottom");
          const p1=sidePt(Aa,sA,0.5),p2=sidePt(Bb,sB,0.5);
          let x1=p1.x,y1=p1.y,x2=p2.x,y2=p2.y;
          const mid=horiz?{x:(x1+x2)/2,y:y1}:{x:x1,y:(y1+y2)/2};
          const pts=horiz?[[x1,y1],[mid.x,y1],[mid.x,y2],[x2,y2]]:[[x1,y1],[x1,mid.y],[x2,mid.y],[x2,y2]];
          drawPath(pts,lineColor,true);
          for(let si=0;si<pts.length-1;si++)flowSegs.push({x1:pts[si][0],y1:pts[si][1],x2:pts[si+1][0],y2:pts[si+1][1]});
          sC.addShape(pres.shapes.OVAL,{x:x1-0.04,y:y1-0.04,w:0.08,h:0.08,fill:{color:lineColor},line:{color:"FFFFFF",width:0.5}});
          const channelSeg=horiz?{x:mid.x,y:Math.min(y1,y2),w:0,h:Math.abs(y2-y1)}:{x:Math.min(x1,x2),y:mid.y,w:Math.abs(x2-x1),h:0};
          flowMeta.push({flow:f,channelSeg,channelAxis:horiz?"X":"Y",p1:{x:x1,y:y1},p2:{x:x2,y:y2},lineColor});
        });

        // ── Pass 4 : Labels — placement intelligent ou légende numérotée (skipped si showLabels=false) ──
        // Au-delà de LEGEND_THRESH flux labellisés, on bascule en mode numéroté :
        // chaque flux reçoit un numéro sur sa ligne + une table récap en bas de slide.
        const LEGEND_THRESH=18;
        if(showLabels){
        const rectsOver=(a,b)=>!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
        const rectDist=(a,b)=>{
          const dx=Math.max(0,Math.max(a.x-b.x-b.w,b.x-a.x-a.w));
          const dy=Math.max(0,Math.max(a.y-b.y-b.h,b.y-a.y-a.h));
          return Math.hypot(dx,dy);
        };
        // Check if a line segment crosses a rectangle (inflated by margin)
        const segCrossRect=(seg,r,m)=>{
          const rx=r.x-m,ry=r.y-m,rw=r.w+2*m,rh=r.h+2*m;
          const sx1=seg.x1,sy1=seg.y1,sx2=seg.x2,sy2=seg.y2;
          const minX=Math.min(sx1,sx2),maxX=Math.max(sx1,sx2);
          const minY=Math.min(sy1,sy2),maxY=Math.max(sy1,sy2);
          if(maxX<rx||minX>rx+rw||maxY<ry||minY>ry+rh)return false;
          if(Math.abs(sx2-sx1)<0.005||Math.abs(sy2-sy1)<0.005)return true;
          return true;
        };
        // Compte les flux qui ont un label (pour décider du mode)
        const labeledFlows=flowMeta.filter(function(m){return !!(m.flow.label||protoLabel(m.flow.protocol||"Autre"));});
        const useLegend=labeledFlows.length>LEGEND_THRESH;
        const legendEntries=[];

        // Trier : couloirs courts d'abord (peu de marge → placer en premier)
        flowMeta.sort((A,B)=>(A.channelSeg.w+A.channelSeg.h)-(B.channelSeg.w+B.channelSeg.h));
        var legendNum=0;
        flowMeta.forEach(function({flow,channelSeg,channelAxis,p1,p2,lineColor}){
          const txt=flow.label||protoLabel(flow.protocol||"Autre");
          if(!txt)return;
          const cx0=channelSeg.x+channelSeg.w/2,cy0=channelSeg.y+channelSeg.h/2;

          if(useLegend){
            // Mode numéroté : badge compact (numéro) sur le couloir
            legendNum++;
            const numStr=String(legendNum);
            const bw=Math.min(0.22,0.14+numStr.length*0.03),bh=0.16;
            const bx=cx0-bw/2,by=cy0-bh/2;
            // Éviter superposition avec app boxes
            const badgeR={x:bx-0.02,y:by-0.02,w:bw+0.04,h:bh+0.04};
            const hitApp=labelRects.filter(function(r){return r._isApp;}).some(function(r){return rectsOver(badgeR,r);});
            // Si collision avec app, essayer légèrement décalé
            var finalBx=bx,finalBy=by;
            if(hitApp){
              // Essayer 3 positions alternatives le long du couloir
              var tried=[[cx0+0.15,cy0],[cx0-0.15,cy0],[cx0,cy0+0.15],[cx0,cy0-0.15]];
              for(var ti=0;ti<tried.length;ti++){
                var tr={x:tried[ti][0]-bw/2-0.02,y:tried[ti][1]-bh/2-0.02,w:bw+0.04,h:bh+0.04};
                if(!labelRects.filter(function(r){return r._isApp;}).some(function(r){return rectsOver(tr,r);})){
                  finalBx=tried[ti][0]-bw/2;finalBy=tried[ti][1]-bh/2;break;
                }
              }
            }
            sC.addShape(pres.shapes.OVAL,{x:finalBx,y:finalBy,w:bw,h:bh,fill:{color:lineColor},line:{color:"FFFFFF",width:0.5}});
            sC.addText(numStr,{x:finalBx,y:finalBy,w:bw,h:bh,fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
            labelRects.push({x:finalBx-0.02,y:finalBy-0.02,w:bw+0.04,h:bh+0.04});
            legendEntries.push({num:legendNum,txt,lineColor});
          } else {
            // Mode texte inline — placement par scoring
            const lw=Math.min(1.7,Math.max(0.42,txt.length*0.052+0.10));
            const lh=0.19;
            const along=channelAxis==="X"
              ?[0.2,0.35,0.5,0.65,0.8].map(function(t){return{x:cx0,y:channelSeg.y+channelSeg.h*t};})
              :[0.2,0.35,0.5,0.65,0.8].map(function(t){return{x:channelSeg.x+channelSeg.w*t,y:cy0};});
            const legPts=[];
            [0.25,0.5,0.75].forEach(function(t){
              legPts.push({x:p1.x+(cx0-p1.x)*t,y:p1.y+(cy0-p1.y)*t});
              legPts.push({x:cx0+(p2.x-cx0)*t,y:cy0+(p2.y-cy0)*t});
            });
            const candidates=[];
            const offsets=[[0,0],[0,-lh-0.04],[0,lh*0.5+0.04],[-lw/2-0.06,0],[lw/2+0.06,0],[-lw/2-0.06,-lh-0.04],[lw/2+0.06,-lh-0.04],[-lw/2-0.06,lh*0.5+0.04],[lw/2+0.06,lh*0.5+0.04]];
            along.forEach(function(p){offsets.forEach(function([ox,oy]){candidates.push({x:p.x-lw/2+ox,y:p.y-lh/2+oy});});});
            legPts.forEach(function(p){offsets.forEach(function([ox,oy]){candidates.push({x:p.x-lw/2+ox,y:p.y-lh/2+oy});});});
            let bestR=null,bestScore=-Infinity,fallbackR=null;
            for(const c of candidates){
              const r={x:c.x,y:c.y,w:lw,h:lh};
              const inCanvas=r.x>=CX-0.10&&r.x+r.w<=CX+CW+0.10&&r.y>=CY-0.05&&r.y+r.h<=CY+CH+0.05;
              const inLegend=showFlows&&r.x<CX+legW+0.05&&r.y+r.h>CY+CH-legH;
              if(!inCanvas||inLegend){if(!fallbackR&&r.x>=CX-0.3&&r.x+r.w<=CX+CW+0.3)fallbackR=r;continue;}
              if(labelRects.filter(function(p){return p._isApp;}).some(function(pl){return rectsOver(r,pl);}))continue;
              let score=0;
              const overlaps=labelRects.filter(function(p){return !p._isApp&&rectsOver(r,p);});
              if(overlaps.length>0)score-=overlaps.length*100;
              else{const minD=labelRects.filter(function(p){return !p._isApp;}).reduce(function(m,p){return Math.min(m,rectDist(r,p));},9999);score+=Math.min(minD,0.5)*2;}
              const flowCross=flowSegs.filter(function(s){return segCrossRect(s,r,0.02);}).length;
              if(flowCross>0)score-=flowCross*30;
              const dToChan=channelAxis==="X"?Math.abs(r.x+r.w/2-cx0):Math.abs(r.y+r.h/2-cy0);
              score-=dToChan*0.5;
              if(score>bestScore){bestScore=score;bestR=r;}
            }
            const chosen=bestR||fallbackR||{x:cx0-lw/2,y:cy0-lh/2,w:lw,h:lh};
            labelRects.push(chosen);
            sC.addShape(pres.shapes.RECTANGLE,{x:chosen.x-0.03,y:chosen.y-0.02,w:chosen.w+0.06,h:chosen.h+0.04,fill:{color:"FFFFFF"},line:{color:lineColor,width:0.6},shadow:{type:"outer",blur:2,offset:1,color:"000000",opacity:0.10,angle:135}});
            sC.addText(txt,{x:chosen.x,y:chosen.y,w:chosen.w,h:chosen.h,fontSize:7.5,color:lineColor,fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
          }
        });

        // ── Légende numérotée (mode dense) ──
        if(useLegend&&legendEntries.length>0){
          const COLS=legendEntries.length>24?3:2;
          const rowH=0.135;
          const perCol=Math.ceil(legendEntries.length/COLS);
          const tblH=Math.min(perCol*rowH+0.22,2.2);
          const tblW=COLS===3?6.8:4.8;
          const tblX=CX+CW-tblW;
          const tblY=CY+CH-tblH+0.02;
          // Fond de la table
          sC.addShape(pres.shapes.RECTANGLE,{x:tblX-0.08,y:tblY-0.08,w:tblW+0.16,h:tblH+0.08,fill:{color:"F8F9FB"},line:{color:"D1D5DB",width:0.5},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.07,angle:135}});
          sC.addText("INDEX DES FLUX",{x:tblX,y:tblY-0.04,w:tblW,h:0.14,fontSize:6,bold:true,color:"0B2545",fontFace:"Calibri",charSpacing:0.6,margin:0});
          const colW=tblW/COLS;
          legendEntries.forEach(function(e,ei){
            var col=Math.floor(ei/perCol);
            var row=ei%perCol;
            var ex=tblX+col*colW;
            var ey=tblY+0.16+row*rowH;
            if(ey+rowH>tblY+tblH)return; // débordement
            // Pastille couleur
            sC.addShape(pres.shapes.OVAL,{x:ex,y:ey+rowH*0.2,w:0.11,h:0.11,fill:{color:e.lineColor},line:{type:"none"}});
            // Texte : numéro + libellé
            sC.addText(e.num+".  "+e.txt,{x:ex+0.14,y:ey,w:colW-0.18,h:rowH,fontSize:6,color:"222222",fontFace:"Calibri",valign:"middle",margin:0,shrinkText:true});
          });
        }

        }// end showLabels
      }

            // ─ Protocol legend (style référence : encart bas-gauche) ─
      if(showFlows&&usedProtos.size>0){
        const lx=CX,ly=CY+CH-legH+0.05;
        sC.addShape(pres.shapes.RECTANGLE,{x:lx,y:ly,w:legW,h:legH-0.05,fill:{color:"FAFBFC"},line:{color:"E8EAED",width:0.3}});
        sC.addText("LÉGENDE",{x:lx+0.04,y:ly+0.01,w:legW-0.08,h:0.10,fontSize:5.5,bold:true,color:"0B2545",fontFace:"Calibri",charSpacing:0.8,margin:0});
        // Group used protocols by display label to avoid duplicates (API+REST+Webhook→Web Service)
        const seen=new Set();
        const entries=[];
        [...usedProtos].forEach(p=>{
          const lbl=protoLabel(p);
          if(seen.has(lbl))return;
          seen.add(lbl);
          entries.push({label:lbl,color:protoColor(p)});
        });
        entries.forEach((e,i)=>{
          const ey=ly+0.12+i*0.09;
          if(ey+0.1>ly+legH-0.02)return;
          sC.addShape(pres.shapes.LINE,{x:lx+0.04,y:ey+0.04,w:0.15,h:0,line:{color:e.color,width:1,endArrowType:"triangle",endArrowSize:3}});
          sC.addText(e.label,{x:lx+0.22,y:ey,w:legW-0.26,h:0.09,fontSize:5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
        });
      }

      // ── Pass 5 : App boxes (rendered AFTER flows so apps are on top) ──
      Object.entries(positions).forEach(([id,p])=>{
        const app=subset.find(x=>x.id===id);if(!app)return;
        const box=domBoxes[app.domain];const ac=box?box.ac:"888888";
        const isGreyed=greyedIds&&greyedIds.has(id);
        if(isGreyed){
          sC.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:p.w,h:p.h,fill:{color:"F0F2F5"},line:{color:"C8CDD6",width:0.5}});
          var fSizeG=Math.min(7,p.w*6);
          sC.addText(app.name,{x:p.x+0.04,y:p.y,w:p.w-0.08,h:p.h,fontSize:fSizeG,bold:false,color:"9CA3AF",fontFace:"Calibri",margin:0,valign:"middle",align:"center",shrinkText:true,wrap:true});
        }else{
          sC.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:p.w,h:p.h,fill:{color:"FFFFFF"},line:{color:ac,width:1.0},shadow:{type:"outer",blur:2,offset:1,color:"000000",opacity:0.10,angle:135}});
          var fSize=Math.min(9,Math.max(7,p.w*7.5));
          sC.addText(app.name,{x:p.x+0.05,y:p.y,w:p.w-0.1,h:p.h,fontSize:fSize,bold:true,color:"1A1A1A",fontFace:"Calibri",margin:0,valign:"middle",align:"center",shrinkText:true,wrap:true});
        }
      });

    };

    // ── Hub radial slide : hub au centre, voisins en couronne ──
    const drawHubRadialSlide=(hub,subset,subFlows,totalFlowCount)=>{
      const sC=_addSlide();
      sC.background={color:"FFFFFF"};
      const sW=13.333,sH=7.5;
      // Header bar
      sC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:sW,h:0.58,fill:{color:cp||"0B2545"},line:{type:"none"}});
      sC.addText("HUB · "+hub.name.toUpperCase(),{x:0.3,y:0.10,w:sW-1.6,h:0.38,fontSize:16,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
      sC.addText((totalFlowCount||0)+" flux · "+hub.domain,{x:0.3,y:0.40,w:6,h:0.18,fontSize:8,color:"BFD7FF",fontFace:"Calibri",margin:0});

      const CX=0.3,CY=0.70,CW=sW-0.6,CH=sH-0.85;
      const cx=CX+CW/2,cy=CY+CH/2;
      const hubDomColor=(_pDC[hub.domain]||_pDC.Autre).ac.replace("#","");
      const hubW=1.80,hubH=0.78;
      const hubCx=cx,hubCy=cy;
      // Neighbors
      const neighbors=subset.filter(function(a){return a.id!==hub.id;});
      const nN=neighbors.length;
      // Aggregate flows per neighbor: {out, in, protos}
      const neighFlows={};
      subFlows.forEach(function(f){
        var nid=null;
        if(f.from===hub.id)nid=f.to;
        else if(f.to===hub.id)nid=f.from;
        if(!nid)return;
        if(!neighFlows[nid])neighFlows[nid]={out:0,in:0,protos:{}};
        var p=f.protocol||"Autre";
        neighFlows[nid].protos[p]=(neighFlows[nid].protos[p]||0)+1;
        if(f.from===hub.id)neighFlows[nid].out++;else neighFlows[nid].in++;
      });
      // Ring geometry — satellites poussés vers le bord du canvas
      // neighW calculé en premier pour dimensionner la marge des rayons
      const neighW=Math.min(1.55,Math.max(0.90,2.8-nN*0.04));
      const neighH=0.56;
      // Rayon horizontal : canvas width / 2 moins la moitié de la boîte satellite + marge
      // Rayon vertical   : canvas height / 2 moins la moitié de la boîte satellite + marge
      // Le max() garantit un rayon minimum large même avec peu de voisins
      var rx=Math.min(CW/2-neighW*0.60-0.10, Math.max(4.4, nN*0.28));
      var ry=Math.min(CH/2-neighH*0.60-0.14, Math.max(2.7, nN*0.17));
      // Sort neighbors: by domain then name (visual grouping)
      const sorted=[...neighbors].sort(function(a,b){return a.domain.localeCompare(b.domain)||a.name.localeCompare(b.name);});
      const neighPos={};
      sorted.forEach(function(a,i){
        var ang=-Math.PI/2+(nN>0?2*Math.PI*i/nN:0);
        var ncx=cx+rx*Math.cos(ang),ncy=cy+ry*Math.sin(ang);
        neighPos[a.id]={x:ncx-neighW/2,y:ncy-neighH/2,w:neighW,h:neighH,cx:ncx,cy:ncy};
      });
      // Edge point helper (rect boundary toward target)
      const edgePt=function(bcx,bcy,bw,bh,tx,ty){
        var dx=tx-bcx,dy=ty-bcy;
        if(Math.abs(dx)<0.001&&Math.abs(dy)<0.001)return{x:bcx,y:bcy};
        var sx=(bw/2)/Math.abs(dx||0.001),sy=(bh/2)/Math.abs(dy||0.001),s=Math.min(sx,sy)*0.96;
        return{x:bcx+dx*s,y:bcy+dy*s};
      };
      // Segment helper — épaisseur uniforme, style de trait selon _opts.flowLineStyle
      var hubDashType=_opts.flowLineStyle==="dash"?"lgDash":_opts.flowLineStyle==="dot"?"sysDot":"solid";
      const seg=function(x1,y1,x2,y2,arrow,color,width){
        var w=Math.abs(x2-x1),h=Math.abs(y2-y1);
        if(w<0.004&&h<0.004)return;
        var o={x:Math.min(x1,x2),y:Math.min(y1,y2),w:w||0.001,h:h||0.001,line:{color:color,width:width,dashType:color==="FFFFFF"?"solid":hubDashType}};
        if(x2<x1)o.flipH=true;if(y2<y1)o.flipV=true;
        if(arrow){o.line.endArrowType="triangle";o.line.endArrowSize=6;}
        sC.addShape(pres.shapes.LINE,o);
      };
      // Draw edges (under nodes)
      var hubLineW=_FLOW_LW; // épaisseur uniforme
      sorted.forEach(function(a){
        var nf=neighFlows[a.id]||{out:0,in:0,protos:{}};
        var np=neighPos[a.id];
        var total=nf.out+nf.in;
        var domP=Object.entries(nf.protos).sort(function(a,b){return b[1]-a[1];})[0];
        var color=protoColor(domP?domP[0]:"Autre");
        if(total===0)return;
        var p1=edgePt(hubCx,hubCy,hubW,hubH,np.cx,np.cy);
        var p2=edgePt(np.cx,np.cy,np.w,np.h,hubCx,hubCy);
        var bidir=nf.out>0&&nf.in>0;
        if(bidir){
          var dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1;
          var ox=-dy/len*0.065,oy=dx/len*0.065;
          seg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,false,"FFFFFF",hubLineW+2.0);
          seg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,true,color,hubLineW);
          // Point de départ hub→voisin
          sC.addShape(pres.shapes.OVAL,{x:p1.x+ox-0.05,y:p1.y+oy-0.05,w:0.10,h:0.10,fill:{color:color},line:{color:"FFFFFF",width:0.8}});
          seg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,false,"FFFFFF",hubLineW+2.0);
          seg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,true,color,hubLineW);
          // Point de départ voisin→hub
          sC.addShape(pres.shapes.OVAL,{x:p2.x-ox-0.05,y:p2.y-oy-0.05,w:0.10,h:0.10,fill:{color:color},line:{color:"FFFFFF",width:0.8}});
        }else if(nf.out>0){
          seg(p1.x,p1.y,p2.x,p2.y,false,"FFFFFF",hubLineW+2.0);
          seg(p1.x,p1.y,p2.x,p2.y,true,color,hubLineW);
          sC.addShape(pres.shapes.OVAL,{x:p1.x-0.05,y:p1.y-0.05,w:0.10,h:0.10,fill:{color:color},line:{color:"FFFFFF",width:0.8}});
        }else{
          seg(p2.x,p2.y,p1.x,p1.y,false,"FFFFFF",hubLineW+2.0);
          seg(p2.x,p2.y,p1.x,p1.y,true,color,hubLineW);
          sC.addShape(pres.shapes.OVAL,{x:p2.x-0.05,y:p2.y-0.05,w:0.10,h:0.10,fill:{color:color},line:{color:"FFFFFF",width:0.8}});
        }
        // Badge nombre de flux au milieu (ovale au lieu de rectangle)
        var mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2;
        var bw=total>=10?0.30:0.24,bh=0.18;
        sC.addShape(pres.shapes.OVAL,{x:mx-bw/2,y:my-bh/2,w:bw,h:bh,fill:{color:color},line:{color:"FFFFFF",width:0.8}});
        sC.addText(String(total),{x:mx-bw/2,y:my-bh/2,w:bw,h:bh,fontSize:7.5,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
      });
      // Neighbor boxes
      sorted.forEach(function(a){
        var np=neighPos[a.id];
        var domColor=(_pDC[a.domain]||_pDC.Autre).ac.replace("#","");
        // Domain color accent left strip
        sC.addShape(pres.shapes.RECTANGLE,{x:np.x,y:np.y,w:0.05,h:np.h,fill:{color:domColor},line:{type:"none"}});
        sC.addShape(pres.shapes.RECTANGLE,{x:np.x,y:np.y,w:np.w,h:np.h,fill:{color:"FFFFFF"},line:{color:domColor,width:1.0},shadow:{type:"outer",blur:2,offset:1,color:"000000",opacity:0.08,angle:135}});
        sC.addText(a.name,{x:np.x+0.08,y:np.y,w:np.w-0.12,h:np.h*0.62,fontSize:8,bold:true,color:"1A1A1A",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
        sC.addText(a.domain,{x:np.x+0.08,y:np.y+np.h*0.60,w:np.w-0.12,h:np.h*0.40,fontSize:6,color:"6B7280",fontFace:"Calibri",align:"center",valign:"top",margin:0,shrinkText:true});
      });
      // Hub box (on top)
      sC.addShape(pres.shapes.RECTANGLE,{x:hubCx-hubW/2,y:hubCy-hubH/2,w:hubW,h:hubH,fill:{color:hubDomColor},line:{color:"FFFFFF",width:2.5},shadow:{type:"outer",blur:6,offset:2,color:"000000",opacity:0.18,angle:135}});
      sC.addText("★  "+hub.name,{x:hubCx-hubW/2+0.06,y:hubCy-hubH/2,w:hubW-0.12,h:hubH*0.60,fontSize:12,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",align:"center",valign:"middle",margin:0,shrinkText:true});
      sC.addText(hub.domain,{x:hubCx-hubW/2+0.06,y:hubCy-hubH/2+hubH*0.57,w:hubW-0.12,h:hubH*0.43,fontSize:7.5,color:"D0E8FF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
      // Protocol legend
      var usedPH=new Set();
      sorted.forEach(function(a){var nf=neighFlows[a.id]||{protos:{}};var domP=Object.entries(nf.protos).sort(function(a,b){return b[1]-a[1];})[0];if(domP)usedPH.add(domP[0]);});
      var seenH=new Set(),entriesH=[];
      [...usedPH].forEach(function(p){var lbl=protoLabel(p);if(seenH.has(lbl))return;seenH.add(lbl);entriesH.push({label:lbl,color:protoColor(p)});});
      if(entriesH.length){
        var lw=1.9,lh=0.18+entriesH.length*0.13,lx=CX,ly=CY+CH-lh;
        sC.addShape(pres.shapes.RECTANGLE,{x:lx,y:ly,w:lw,h:lh,fill:{color:"FAFBFC"},line:{color:"E8EAED",width:0.3}});
        sC.addText("PROTOCOLES",{x:lx+0.04,y:ly+0.01,w:lw-0.08,h:0.12,fontSize:5.5,bold:true,color:"0B2545",fontFace:"Calibri",charSpacing:0.5,margin:0});
        entriesH.forEach(function(e,i){var ey=ly+0.18+i*0.13;sC.addShape(pres.shapes.LINE,{x:lx+0.08,y:ey+0.05,w:0.2,h:0,line:{color:e.color,width:1.5,endArrowType:"triangle",endArrowSize:4}});sC.addText(e.label,{x:lx+0.32,y:ey,w:lw-0.38,h:0.12,fontSize:6.5,color:"333333",fontFace:"Calibri",margin:0,valign:"middle"});});
      }
    };

    // ── Hub détaillé : panneau gauche = index · panneau droit = carto radiale ──
    const drawHubDetailSlide=(hub,subset,subFlows,totalFlowCount)=>{
      if(subFlows.length===0)return;
      const sC=_addSlide();
      sC.background={color:"FFFFFF"};
      const sW=13.333,sH=7.5;

      // ── Dimensions des deux panneaux ──
      const HDR=0.60;             // hauteur header
      const LP_X=0,LP_W=3.90;    // panneau gauche (index)
      const SEP=LP_X+LP_W;       // ligne séparatrice
      const RP_X=SEP+0.08;       // panneau droit (carto)
      const RP_W=sW-RP_X-0.10;   // largeur carto ≈ 9.18"

      // Header pleine largeur
      sC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:sW,h:HDR,fill:{color:cp||"0B2545"},line:{type:"none"}});
      sC.addText("DÉTAIL FLUX · "+hub.name.toUpperCase(),{x:0.20,y:0.08,w:RP_W,h:0.32,fontSize:15,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
      sC.addText(subFlows.length+" flux · "+hub.domain,{x:0.20,y:0.38,w:6,h:0.18,fontSize:8,color:"BFD7FF",fontFace:"Calibri",margin:0});


      // Séparateur vertical
      sC.addShape(pres.shapes.RECTANGLE,{x:SEP,y:HDR,w:0.015,h:sH-HDR,fill:{color:"E5E7EB"},line:{type:"none"}});

      // Fond panneau gauche
      sC.addShape(pres.shapes.RECTANGLE,{x:LP_X,y:HDR,w:LP_W,h:sH-HDR,fill:{color:"F8F9FB"},line:{type:"none"}});
      // Panneau droit : zone de la carto radiale
      const CY=HDR+0.08, CH=sH-HDR-0.12;
      const cx=RP_X+RP_W/2, cy=CY+CH/2;
      const hubDomColor=(_pDC[hub.domain]||_pDC.Autre).ac.replace("#","");
      const hubW=1.70,hubH=0.76;

      // Géométrie radiale contrainte au panneau droit
      const neighbors=subset.filter(function(a){return a.id!==hub.id;});
      const nN=neighbors.length;
      const neighW=Math.min(1.50,Math.max(0.88,2.7-nN*0.04));
      const neighH=0.54;
      // rx limité par la demi-largeur du panneau droit
      var rx=Math.min(RP_W/2-neighW*0.55-0.10, Math.max(3.4,nN*0.24));
      var ry=Math.min(CH/2-neighH*0.60-0.12,   Math.max(2.6,nN*0.17));
      const sorted=[...neighbors].sort(function(a,b){return a.domain.localeCompare(b.domain)||a.name.localeCompare(b.name);});
      const neighPos={};
      sorted.forEach(function(a,i){
        var ang=-Math.PI/2+(nN>0?2*Math.PI*i/nN:0);
        var ncx=cx+rx*Math.cos(ang),ncy=cy+ry*Math.sin(ang);
        neighPos[a.id]={x:ncx-neighW/2,y:ncy-neighH/2,w:neighW,h:neighH,cx:ncx,cy:ncy};
      });

      var dDash=_opts.flowLineStyle==="dash"?"lgDash":_opts.flowLineStyle==="dot"?"sysDot":"solid";
      const seg=function(x1,y1,x2,y2,arrow,color,width){
        var w=Math.abs(x2-x1),h=Math.abs(y2-y1);
        if(w<0.004&&h<0.004)return;
        var o={x:Math.min(x1,x2),y:Math.min(y1,y2),w:w||0.001,h:h||0.001,line:{color:color,width:width,dashType:color==="FFFFFF"?"solid":dDash}};
        if(x2<x1)o.flipH=true;if(y2<y1)o.flipV=true;
        if(arrow){o.line.endArrowType="triangle";o.line.endArrowSize=5;}
        sC.addShape(pres.shapes.LINE,o);
      };

      // ── Ancrage distribué sur la face du nœud ──
      // Calcule le point d'entrée/sortie sur la face d'un rectangle rectangulaire
      // (bcx,bcy) = centre de la boîte, (bw,bh) = dimensions
      // (dx,dy) = direction vers la cible (depuis le centre de la boîte)
      // faceOff = décalage LE LONG de la face (en pouces), positif = sens anti-horaire
      const facePt=function(bcx,bcy,bw,bh,dx,dy,faceOff){
        var adx=Math.abs(dx)||0.001,ady=Math.abs(dy)||0.001;
        var sx=(bw/2)/adx,sy=(bh/2)/ady;
        var marg=0.05; // marge pour ne pas sortir des coins arrondis
        if(sx<=sy){
          // Face gauche ou droite — exit en X, spread en Y
          var exitX=bcx+(dx>0?1:-1)*(bw/2);
          var baseY=bcy+dy*sx; // Y où la direction touche la face
          return{x:exitX,y:Math.max(bcy-bh/2+marg,Math.min(bcy+bh/2-marg,baseY+faceOff))};
        }else{
          // Face haute ou basse — exit en Y, spread en X
          var exitY=bcy+(dy>0?1:-1)*(bh/2);
          var baseX=bcx+dx*sy; // X où la direction touche la face
          return{x:Math.max(bcx-bw/2+marg,Math.min(bcx+bw/2-marg,baseX+faceOff)),y:exitY};
        }
      };

      // Grouper les flux par voisin, sortir sortants avant entrants (stabilité visuelle)
      var flowsByNeigh={};
      subFlows.forEach(function(f){
        var nid=f.from===hub.id?f.to:f.from;
        if(!flowsByNeigh[nid])flowsByNeigh[nid]=[];
        flowsByNeigh[nid].push(f);
      });
      Object.values(flowsByNeigh).forEach(function(arr){
        arr.sort(function(a,b){
          // sortants d'abord, puis par label
          var ao=a.from===hub.id?0:1,bo=b.from===hub.id?0:1;
          if(ao!==bo)return ao-bo;
          return (a.label||"").localeCompare(b.label||"");
        });
      });

      var usedProtos=new Set();
      // Entrées de la légende numérotée : {num, color, dir, neighName, label, proto}
      var legendRows=[];
      var flowNum=0;

      // ── Dessin des flux individuels — rendu en 2 passes ──
      // Passe 1 : halos blancs (tous en premier pour ne masquer aucune flèche colorée)
      // Passe 2 : flèches colorées + points de départ + badges
      // Calcul des points d'ancrage une seule fois, stockés pour les deux passes
      var _flowSegs=[];
      sorted.forEach(function(a){
        var np=neighPos[a.id];if(!np)return;
        var nFlows=flowsByNeigh[a.id]||[];
        var n=nFlows.length;if(n===0)return;
        var dxHN=np.cx-cx,dyHN=np.cy-cy;
        var adxHN=Math.abs(dxHN)||0.001,adyHN=Math.abs(dyHN)||0.001;
        var hubFaceHalf=(adxHN/adyHN>=1?hubH:hubW)/2;
        var nFaceHalf  =(adxHN/adyHN>=1?neighH:neighW)/2;
        var hubStep=n>1?Math.min(0.15,hubFaceHalf*0.55/((n-1)/2||1)):0;
        var nStep  =n>1?Math.min(0.13,nFaceHalf  *0.55/((n-1)/2||1)):0;
        nFlows.forEach(function(f,fi){
          flowNum++;
          var off=fi-(n-1)/2;
          var pHub  =facePt(cx,   cy,   hubW, hubH, dxHN, dyHN,  off*hubStep);
          var pNeigh=facePt(np.cx,np.cy,np.w, np.h,-dxHN,-dyHN,  off*nStep);
          var color=protoColor(f.protocol||"Autre");
          usedProtos.add(f.protocol||"Autre");
          var isOut=f.from===hub.id;
          var fromPt=isOut?pHub:pNeigh, toPt=isOut?pNeigh:pHub;
          var txt=(f.label&&f.label.trim())||protoLabel(f.protocol||"Autre");
          _flowSegs.push({fromPt:fromPt,toPt:toPt,color:color,num:flowNum,isOut:isOut,neighName:a.name,label:txt,proto:protoLabel(f.protocol||"Autre")});
          legendRows.push({num:flowNum,color:color,dir:isOut?"→":"←",neighName:a.name,label:txt,proto:protoLabel(f.protocol||"Autre")});
        });
      });
      // ── Correction des croisements : décalage perpendiculaire ──
      function segsCross(a1,a2,b1,b2){
        var dx1=a2.x-a1.x,dy1=a2.y-a1.y;
        var dx2=b2.x-b1.x,dy2=b2.y-b1.y;
        var cross=dx1*dy2-dy1*dx2;
        if(Math.abs(cross)<1e-10)return false;
        var dx3=b1.x-a1.x,dy3=b1.y-a1.y;
        var t=(dx3*dy2-dy3*dx2)/cross;
        var u=(dx3*dy1-dy3*dx1)/cross;
        return t>0.05&&t<0.95&&u>0.05&&u<0.95;
      }
      for(var _ci=0;_ci<_flowSegs.length;_ci++){
        for(var _cj=_ci+1;_cj<_flowSegs.length;_cj++){
          var _si=_flowSegs[_ci],_sj=_flowSegs[_cj];
          if(segsCross(_si.fromPt,_si.toPt,_sj.fromPt,_sj.toPt)){
            var _dx=_sj.toPt.x-_sj.fromPt.x,_dy=_sj.toPt.y-_sj.fromPt.y;
            var _len=Math.sqrt(_dx*_dx+_dy*_dy)||1;
            var _px=-_dy/_len*0.08,_py=_dx/_len*0.08;
            _sj.fromPt={x:_sj.fromPt.x+_px,y:_sj.fromPt.y+_py};
            _sj.toPt={x:_sj.toPt.x+_px,y:_sj.toPt.y+_py};
          }
        }
      }
      // Passe 1 : tous les halos
      _flowSegs.forEach(function(s){
        seg(s.fromPt.x,s.fromPt.y,s.toPt.x,s.toPt.y,false,"FFFFFF",_FLOW_LW+1.6);
      });
      // Passe 2 : flèches colorées + points de départ + badges
      _flowSegs.forEach(function(s){
        seg(s.fromPt.x,s.fromPt.y,s.toPt.x,s.toPt.y,true,s.color,_FLOW_LW);
        sC.addShape(pres.shapes.OVAL,{x:s.fromPt.x-0.05,y:s.fromPt.y-0.05,w:0.10,h:0.10,fill:{color:s.color},line:{color:"FFFFFF",width:0.7}});
        var mx=(s.fromPt.x+s.toPt.x)/2, my=(s.fromPt.y+s.toPt.y)/2;
        var bw=s.num>=10?0.22:0.17, bh=0.15;
        sC.addShape(pres.shapes.OVAL,{x:mx-bw/2,y:my-bh/2,w:bw,h:bh,fill:{color:s.color},line:{color:"FFFFFF",width:0.8}});
        sC.addText(String(s.num),{x:mx-bw/2,y:my-bh/2,w:bw,h:bh,fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
      });

      // ── Boîtes voisins (par-dessus les flèches) ──
      sorted.forEach(function(a){
        var np=neighPos[a.id];if(!np)return;
        var domColor=(_pDC[a.domain]||_pDC.Autre).ac.replace("#","");
        sC.addShape(pres.shapes.RECTANGLE,{x:np.x,y:np.y,w:0.05,h:np.h,fill:{color:domColor},line:{type:"none"}});
        sC.addShape(pres.shapes.RECTANGLE,{x:np.x,y:np.y,w:np.w,h:np.h,
          fill:{color:"FFFFFF"},line:{color:domColor,width:1.0},
          shadow:{type:"outer",blur:2,offset:1,color:"000000",opacity:0.08,angle:135}});
        sC.addText(a.name,{x:np.x+0.08,y:np.y,w:np.w-0.12,h:np.h*0.62,
          fontSize:8,bold:true,color:"1A1A1A",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
        sC.addText(a.domain,{x:np.x+0.08,y:np.y+np.h*0.60,w:np.w-0.12,h:np.h*0.40,
          fontSize:6,color:"6B7280",fontFace:"Calibri",align:"center",valign:"top",margin:0,shrinkText:true});
        // Pastille nb flux dans le coin supérieur droit de la boîte
        var nf=(flowsByNeigh[a.id]||[]).length;
        if(nf>0){
          sC.addShape(pres.shapes.OVAL,{x:np.x+np.w-0.17,y:np.y-0.08,w:0.17,h:0.17,fill:{color:hubDomColor},line:{color:"FFFFFF",width:0.8}});
          sC.addText(String(nf),{x:np.x+np.w-0.17,y:np.y-0.08,w:0.17,h:0.17,fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
        }
      });

      // ── Hub (au-dessus de tout) ──
      sC.addShape(pres.shapes.RECTANGLE,{x:cx-hubW/2,y:cy-hubH/2,w:hubW,h:hubH,
        fill:{color:hubDomColor},line:{color:"FFFFFF",width:2.5},
        shadow:{type:"outer",blur:6,offset:2,color:"000000",opacity:0.18,angle:135}});
      sC.addText("★  "+hub.name,{x:cx-hubW/2+0.06,y:cy-hubH/2,w:hubW-0.12,h:hubH*0.60,
        fontSize:12,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",align:"center",valign:"middle",margin:0,shrinkText:true});
      sC.addText(hub.domain,{x:cx-hubW/2+0.06,y:cy-hubH/2+hubH*0.57,w:hubW-0.12,h:hubH*0.43,
        fontSize:7.5,color:"D0E8FF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});

      // ── Panneau gauche : index des flux (tableau + ovales superposés) ──
      if(legendRows.length>0){
        var IDX_X=LP_X+0.10, IDX_W=LP_W-0.18;
        var IDX_Y=HDR+0.08,  IDX_H=sH-HDR-0.12;
        // Titre
        sC.addText("INDEX DES FLUX",{x:IDX_X,y:IDX_Y,w:IDX_W,h:0.18,
          fontSize:7,bold:true,color:"0B2545",fontFace:"Calibri",charSpacing:1.0,margin:0});
        sC.addText(legendRows.length+" flux",{x:IDX_X,y:IDX_Y+0.18,w:IDX_W,h:0.13,
          fontSize:6,color:"9CA3AF",fontFace:"Calibri",margin:0});
        sC.addShape(pres.shapes.RECTANGLE,{x:IDX_X,y:IDX_Y+0.33,w:IDX_W,h:0.012,fill:{color:"D1D5DB"},line:{type:"none"}});

        // ── Dimensions ──
        var tblY=IDX_Y+0.36;
        var tblAvailH=IDX_H-(tblY-IDX_Y)-0.06;
        var dynRowH=Math.min(0.155,Math.max(0.128,tblAvailH/(legendRows.length+1)));
        var visRows=legendRows.slice(0,Math.floor(tblAvailH/dynRowH)-1);

        // Largeurs colonnes : badge (manuel) | direction | nom app | label/protocole
        var C0=0.32,C1=0.52,C2=1.40,C3=IDX_W-C0-C1-C2;
        var noB={type:"none"};

        // ── Tableau 4 colonnes (# avec fond coloré | direction | app | flux) ──
        var hdrCells=[
          {text:"#",               options:{fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",fill:{color:"0B2545"},border:noB}},
          {text:"Direction",       options:{fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",fill:{color:"0B2545"},border:noB}},
          {text:"Application",     options:{fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",valign:"middle",fill:{color:"0B2545"},border:noB}},
          {text:"Flux / Protocole",options:{fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",valign:"middle",fill:{color:"0B2545"},border:noB}},
        ];
        var dataRows=visRows.map(function(r,ri){
          var altFill={color:ri%2===0?"F1F5F9":"FFFFFF"};
          var dirColor=r.dir==="→"?"059669":"2563EB";
          var labelTxt=r.label&&r.label!==r.proto?r.label:r.proto;
          return [
            {text:String(r.num),options:{fontSize:6.5,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",fill:{color:r.color},border:noB}},
            {text:r.dir,        options:{fontSize:8,bold:true,color:dirColor,fontFace:"Calibri",align:"center",valign:"middle",fill:altFill,border:noB}},
            {text:r.neighName,  options:{fontSize:6.5,bold:true,color:"111827",fontFace:"Calibri",valign:"middle",fill:altFill,border:noB,shrinkText:true}},
            {text:labelTxt,     options:{fontSize:6,italic:true,color:"6B7280",fontFace:"Calibri",valign:"middle",fill:altFill,border:noB,shrinkText:true}},
          ];
        });
        sC.addTable([hdrCells].concat(dataRows),{
          x:IDX_X,y:tblY,w:IDX_W,
          colW:[C0,C1,C2,C3],
          rowH:dynRowH,
          border:noB,
        });

        // Indicateur si lignes tronquées
        if(legendRows.length>visRows.length){
          var truncY=tblY+(visRows.length+1)*dynRowH+0.03;
          sC.addText("+"+(legendRows.length-visRows.length)+" flux non affichés",{
            x:IDX_X,y:truncY,w:IDX_W,h:0.14,fontSize:6,color:"9CA3AF",fontFace:"Calibri",italic:true,align:"center",margin:0});
        }
      }
    };

    // ── Consolidated A supprimé (vue secteurs) ──
    const drawConsolidatedSectorSlide=function(){return;// supprimé
      if(apps.length===0)return;
      var sC=_addSlide();
      sC.background={color:"F8F9FA"};
      var sW=13.333,sH=7.5;
      sC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:sW,h:0.58,fill:{color:cp||"0B2545"},line:{type:"none"}});
      sC.addText("CARTOGRAPHIE CONSOLIDÉE — VUE PAR SECTEURS",{x:0.3,y:0.08,w:sW-2.5,h:0.28,fontSize:14,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
      sC.addText(apps.length+" applications · "+[...new Set(apps.map(function(a){return a.domain;}))].length+" domaines · "+flows.length+" flux",{x:0.3,y:0.37,w:7,h:0.17,fontSize:8,color:"BFD7FF",fontFace:"Calibri",margin:0});

      var CX=0.20,CY=0.68,CW=sW-0.40,CH=sH-0.78;
      var cx=CX+CW/2,cy=CY+CH/2;
      // Hub = app with most flows
      var deg={};apps.forEach(function(a){deg[a.id]=0;});
      flows.forEach(function(f){deg[f.from]=(deg[f.from]||0)+1;deg[f.to]=(deg[f.to]||0)+1;});
      var hub=apps.reduce(function(best,a){return(deg[a.id]||0)>(deg[best.id]||0)?a:best;},apps[0]);
      var hubW=1.70,hubH=0.72;
      // Ring 1 (direct neighbors of hub) for edge filter
      var ring1Ids=new Set();
      flows.forEach(function(f){if(f.from===hub.id)ring1Ids.add(f.to);if(f.to===hub.id)ring1Ids.add(f.from);});
      // Domain grouping — sorted alphabetically
      var domOrder=[...new Set(apps.map(function(a){return a.domain;}))].sort();
      var domAppsMap={};
      domOrder.forEach(function(d){domAppsMap[d]=apps.filter(function(a){return a.domain===d&&a.id!==hub.id;}).sort(function(a,b){return a.name.localeCompare(b.name);});});
      var nonHubApps=apps.filter(function(a){return a.id!==hub.id;});
      var N=nonHubApps.length;
      // Geometry
      var r1=Math.min(CW/2,CH/2)*0.60;
      var aW=Math.min(1.20,Math.max(0.52,2*Math.PI*r1/Math.max(N,1)*0.62));
      var aH=0.37;
      var rLabel=r1+0.52;
      // Sector angle allocation — proportional to app count per domain, with small gap between sectors
      var gapAng=domOrder.length>1?0.08:0; // radians gap between sectors
      var totalGap=gapAng*domOrder.length;
      var usableAngle=2*Math.PI-totalGap;
      var pos={};
      pos[hub.id]={x:cx-hubW/2,y:cy-hubH/2,w:hubW,h:hubH,cx:cx,cy:cy};
      var angleOffset=-Math.PI/2;
      var domSectorMid={};
      var domSectorStartAng={};
      domOrder.forEach(function(d){
        var dApps=domAppsMap[d];
        var dFrac=N>0?dApps.length/N:1/domOrder.length;
        var dAngle=dFrac*usableAngle;
        domSectorStartAng[d]=angleOffset;
        if(dApps.length>0){
          dApps.forEach(function(a,i){
            var ang=angleOffset+dAngle*(i+0.5)/dApps.length;
            var acx=cx+r1*Math.cos(ang),acy=cy+r1*Math.sin(ang);
            pos[a.id]={x:acx-aW/2,y:acy-aH/2,w:aW,h:aH,cx:acx,cy:acy};
          });
        }
        domSectorMid[d]=angleOffset+dAngle/2;
        angleOffset+=dAngle+gapAng;
      });
      // Draw sector divider tick lines
      domOrder.forEach(function(d){
        var ang=domSectorStartAng[d];
        var sx=cx+(hubW*0.6)*Math.cos(ang),sy=cy+(hubH*0.6)*Math.sin(ang);
        var ex=cx+(r1+0.40)*Math.cos(ang),ey=cy+(r1+0.40)*Math.sin(ang);
        var w=Math.abs(ex-sx)||0.001,h=Math.abs(ey-sy)||0.001;
        var o={x:Math.min(sx,ex),y:Math.min(sy,ey),w:w,h:h,line:{color:"C5CAD3",width:0.5,dashType:"dash"}};
        if(ex<sx)o.flipH=true;if(ey<sy)o.flipV=true;
        sC.addShape(pres.shapes.LINE,o);
      });
      // Draw domain label badges at outer ring
      domOrder.forEach(function(d){
        var ang=domSectorMid[d];
        var lx=cx+rLabel*Math.cos(ang),ly=cy+rLabel*Math.sin(ang);
        var dc=(_pDC[d]||_pDC.Autre).ac.replace("#","");
        var lw=1.0,lh=0.22;
        sC.addShape(pres.shapes.RECTANGLE,{x:lx-lw/2,y:ly-lh/2,w:lw,h:lh,fill:{color:dc},line:{type:"none"}});
        sC.addText(d,{x:lx-lw/2,y:ly-lh/2,w:lw,h:lh,fontSize:6.5,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
      });
      // Helpers
      var edgePt=function(p,tx,ty){var dx=tx-p.cx,dy=ty-p.cy;if(Math.abs(dx)<0.001&&Math.abs(dy)<0.001)return{x:p.cx,y:p.cy};var sx=(p.w/2)/Math.abs(dx||0.001),sy=(p.h/2)/Math.abs(dy||0.001),s=Math.min(sx,sy)*0.95;return{x:p.cx+dx*s,y:p.cy+dy*s};};
      var drawSeg=function(x1,y1,x2,y2,arrow,color,width){var w=Math.abs(x2-x1),h=Math.abs(y2-y1);if(w<0.003&&h<0.003)return;var o={x:Math.min(x1,x2),y:Math.min(y1,y2),w:w||0.001,h:h||0.001,line:{color:color,width:width,dashType:"solid"}};if(x2<x1)o.flipH=true;if(y2<y1)o.flipV=true;if(arrow){o.line.endArrowType="triangle";o.line.endArrowSize=5;}sC.addShape(pres.shapes.LINE,o);};
      var addBadge=function(x,y,val,col){var bw=val>=10?0.26:0.20,bh=0.14;sC.addShape(pres.shapes.RECTANGLE,{x:x-bw/2,y:y-bh/2,w:bw,h:bh,fill:{color:col},line:{type:"none"}});sC.addText(String(val),{x:x-bw/2,y:y-bh/2,w:bw,h:bh,fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});};
      // Aggregate flows
      var pAgg={};
      flows.forEach(function(f){
        if(!pos[f.from]||!pos[f.to])return;
        var ka=f.from<f.to?f.from:f.to,kb=f.from<f.to?f.to:f.from;
        var k=ka+"|"+kb;
        if(!pAgg[k])pAgg[k]={a:ka,b:kb,out:0,in:0};
        if(f.from===ka)pAgg[k].out++;else pAgg[k].in++;
      });
      // Draw edges
      var flowCol=cp||"2979FF";
      Object.values(pAgg).forEach(function(pa){
        var pA=pos[pa.a],pB=pos[pa.b];if(!pA||!pB)return;
        var isHubEdge=pa.a===hub.id||pa.b===hub.id;
        var isR1R1=ring1Ids.has(pa.a)&&ring1Ids.has(pa.b);
        if(!isHubEdge&&!isR1R1)return;
        var total=pa.out+pa.in;
        var lw=Math.min(2.5,0.8+total*0.18);
        var p1=edgePt(pA,pB.cx,pB.cy),p2=edgePt(pB,pA.cx,pA.cy);
        if(pa.out>0&&pa.in>0){
          var dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1;
          var ox=-dy/len*0.05,oy=dx/len*0.05;
          drawSeg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,false,"FFFFFF",lw+1.6);
          drawSeg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,true,flowCol,lw);
          addBadge((p1.x+ox+p2.x+ox)/2,(p1.y+oy+p2.y+oy)/2,pa.out,flowCol);
          drawSeg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,false,"FFFFFF",lw+1.6);
          drawSeg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,true,flowCol,lw);
          addBadge((p2.x-ox+p1.x-ox)/2,(p2.y-oy+p1.y-oy)/2,pa.in,flowCol);
        }else{
          var from=pa.out>0?p1:p2,to=pa.out>0?p2:p1;
          drawSeg(from.x,from.y,to.x,to.y,false,"FFFFFF",lw+1.6);
          drawSeg(from.x,from.y,to.x,to.y,true,flowCol,lw);
          addBadge((from.x+to.x)/2,(from.y+to.y)/2,total,flowCol);
        }
      });
      // Draw app boxes (non-hub)
      nonHubApps.forEach(function(a){
        var p=pos[a.id];if(!p)return;
        var dc=(_pDC[a.domain]||_pDC.Autre).ac.replace("#","");
        var isR1=ring1Ids.has(a.id);
        sC.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:p.w,h:p.h,fill:{color:isR1?"FFFFFF":"F0F2F7"},line:{color:dc,width:isR1?1.0:0.6},shadow:isR1?{type:"outer",blur:2,offset:1,color:"000000",opacity:0.09,angle:135}:undefined});
        sC.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:0.05,h:p.h,fill:{color:dc},line:{type:"none"}});
        sC.addText(a.name,{x:p.x+0.08,y:p.y,w:p.w-0.12,h:p.h,fontSize:isR1?7:6.5,bold:isR1,color:"1A1A1A",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
      });
      // Hub box (top layer)
      var hubDC=(_pDC[hub.domain]||_pDC.Autre).ac.replace("#","");
      sC.addShape(pres.shapes.RECTANGLE,{x:pos[hub.id].x,y:pos[hub.id].y,w:hubW,h:hubH,fill:{color:hubDC},line:{color:"FFFFFF",width:2.5},shadow:{type:"outer",blur:7,offset:2,color:"000000",opacity:0.20,angle:135}});
      sC.addText("★  "+hub.name,{x:pos[hub.id].x+0.06,y:pos[hub.id].y,w:hubW-0.12,h:hubH*0.60,fontSize:12,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",align:"center",valign:"middle",margin:0,shrinkText:true});
      sC.addText(hub.domain+" · "+(deg[hub.id]||0)+" flux",{x:pos[hub.id].x+0.06,y:pos[hub.id].y+hubH*0.57,w:hubW-0.12,h:hubH*0.43,fontSize:7,color:"D0E8FF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
    };

    // ── Shared helpers for consolidated slides ──
    var _mkEdgePt=function(p,tx,ty){var dx=tx-p.cx,dy=ty-p.cy;if(Math.abs(dx)<0.001&&Math.abs(dy)<0.001)return{x:p.cx,y:p.cy};var sx=(p.w/2)/Math.abs(dx||0.001),sy=(p.h/2)/Math.abs(dy||0.001),s=Math.min(sx,sy)*0.95;return{x:p.cx+dx*s,y:p.cy+dy*s};};
    // dashType selon flowLineStyle : "solid" | "lgDash" | "sysDot"
    var _flowDash=_opts.flowLineStyle==="dash"?"lgDash":_opts.flowLineStyle==="dot"?"sysDot":"solid";
    // Épaisseur uniforme pour toutes les flèches carto-consolidée & hub
    var _FLOW_LW=1.8;
    var _mkDrawSeg=function(sld){return function(x1,y1,x2,y2,arrow,color,width){var w=Math.abs(x2-x1),h=Math.abs(y2-y1);if(w<0.003&&h<0.003)return;var o={x:Math.min(x1,x2),y:Math.min(y1,y2),w:w||0.001,h:h||0.001,line:{color:color,width:width,dashType:color==="FFFFFF"?"solid":_flowDash}};if(x2<x1)o.flipH=true;if(y2<y1)o.flipV=true;if(arrow){o.line.endArrowType="triangle";o.line.endArrowSize=5;}sld.addShape(pres.shapes.LINE,o);};};
    var _mkAddBadge=function(sld){return function(x,y,val,col){var bw=val>=10?0.28:0.22,bh=0.16;sld.addShape(pres.shapes.OVAL,{x:x-bw/2,y:y-bh/2,w:bw,h:bh,fill:{color:col},line:{color:"FFFFFF",width:0.8}});sld.addText(String(val),{x:x-bw/2,y:y-bh/2,w:bw,h:bh,fontSize:6.5,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});};};
    var _drawClusterArrows=function(sld,clAgg,clPos,flowCol){
      var drawSeg=_mkDrawSeg(sld),addBadge=_mkAddBadge(sld);
      var lw=_FLOW_LW;
      Object.values(clAgg).forEach(function(ca){
        var pA=clPos[ca.a],pB=clPos[ca.b];if(!pA||!pB)return;
        var p1=_mkEdgePt(pA,pB.cx,pB.cy),p2=_mkEdgePt(pB,pA.cx,pA.cy);
        if(ca.out>0&&ca.in>0){
          var dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1;
          var ox=-dy/len*0.07,oy=dx/len*0.07;
          // Halo + flèche A→B
          drawSeg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,false,"FFFFFF",lw+2.0);
          drawSeg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,true,flowCol,lw);
          addBadge((p1.x+ox+p2.x+ox)/2,(p1.y+oy+p2.y+oy)/2,ca.out,flowCol);
          // Point de départ A→B
          sld.addShape(pres.shapes.OVAL,{x:p1.x+ox-0.07,y:p1.y+oy-0.07,w:0.09,h:0.09,fill:{color:flowCol},line:{color:"FFFFFF",width:0.8}});
          // Halo + flèche B→A
          drawSeg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,false,"FFFFFF",lw+2.0);
          drawSeg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,true,flowCol,lw);
          addBadge((p2.x-ox+p1.x-ox)/2,(p2.y-oy+p1.y-oy)/2,ca.in,flowCol);
          // Point de départ B→A
          sld.addShape(pres.shapes.OVAL,{x:p2.x-ox-0.07,y:p2.y-oy-0.07,w:0.09,h:0.09,fill:{color:flowCol},line:{color:"FFFFFF",width:0.8}});
        }else{
          var from=ca.out>0?p1:p2,to=ca.out>0?p2:p1;
          drawSeg(from.x,from.y,to.x,to.y,false,"FFFFFF",lw+2.0);
          drawSeg(from.x,from.y,to.x,to.y,true,flowCol,lw);
          addBadge((from.x+to.x)/2,(from.y+to.y)/2,ca.out+ca.in,flowCol);
          // Point de départ
          sld.addShape(pres.shapes.OVAL,{x:from.x-0.07,y:from.y-0.07,w:0.09,h:0.09,fill:{color:flowCol},line:{color:"FFFFFF",width:0.8}});
        }
      });
    };

    // ── Consolidated — clusters par domaine (Options A+B : hub central si dominant, sinon intégré) ──
    const drawConsolidatedRingSlide=function(){
      if(apps.length===0)return;
      var sC=_addSlide();
      sC.background={color:"FFFFFF"};
      var sW=13.333,sH=7.5;
      sC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:sW,h:0.58,fill:{color:cp||"0B2545"},line:{type:"none"}});
      sC.addText("CARTOGRAPHIE CONSOLIDÉE — CLUSTERS PAR DOMAINE",{x:0.3,y:0.08,w:sW-2.5,h:0.28,fontSize:14,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
      sC.addText(apps.length+" applications · "+[...new Set(apps.map(function(a){return a.domain;}))].length+" domaines · "+flows.length+" flux",{x:0.3,y:0.37,w:7,h:0.17,fontSize:8,color:"BFD7FF",fontFace:"Calibri",margin:0});

      var CX=0.20,CY=0.68,CW=sW-0.40,CH=sH-0.78;
      var cx=CX+CW/2,cy=CY+CH/2;
      // Hub = app with most flows
      var degMap={};apps.forEach(function(a){degMap[a.id]=0;});
      flows.forEach(function(f){degMap[f.from]=(degMap[f.from]||0)+1;degMap[f.to]=(degMap[f.to]||0)+1;});
      var hub=apps.reduce(function(best,a){return(degMap[a.id]||0)>(degMap[best.id]||0)?a:best;},apps[0]);
      // Dominant = hub connects to ≥ 5 flows and reaches ≥ 2 distinct foreign domains
      var hubForeignDoms=new Set();
      flows.forEach(function(f){
        if(f.from===hub.id){var t=apps.find(function(a){return a.id===f.to;});if(t&&t.domain!==hub.domain)hubForeignDoms.add(t.domain);}
        if(f.to===hub.id){var t=apps.find(function(a){return a.id===f.from;});if(t&&t.domain!==hub.domain)hubForeignDoms.add(t.domain);}
      });
      var hubIsDominant=(degMap[hub.id]||0)>=5&&hubForeignDoms.size>=2;
      var hubW=1.60,hubH=0.70;
      var cAW=0.95,cAH=0.30,cGap=0.05,cHdr=0.22,cPad=0.08;
      var flowCol=cp||"2979FF";
      // Domain order: exclude hub from its own domain cluster only when dominant
      var domOrder;
      if(hubIsDominant){
        domOrder=[...new Set(apps.filter(function(a){return a.id!==hub.id;}).map(function(a){return a.domain;}))].sort();
      }else{
        domOrder=[...new Set(apps.map(function(a){return a.domain;}))].sort();
      }
      var NDoms=domOrder.length;if(NDoms===0)return;
      var domInfo={};
      domOrder.forEach(function(d){
        var dApps;
        if(hubIsDominant){
          dApps=apps.filter(function(a){return a.domain===d&&a.id!==hub.id;}).sort(function(a,b){return a.name.localeCompare(b.name);});
        }else{
          dApps=apps.filter(function(a){return a.domain===d;}).sort(function(a,b){if(a.id===hub.id)return -1;if(b.id===hub.id)return 1;return a.name.localeCompare(b.name);});
        }
        var k=dApps.length,cols=k<=1?1:k<=4?2:3,rows=Math.ceil(k/cols);
        domInfo[d]={dApps:dApps,k:k,cols:cols,rows:rows,cW:cPad*2+cols*cAW+(cols-1)*cGap,cH:cPad*2+cHdr+rows*cAH+(rows-1)*cGap};
      });
      var maxCW=domOrder.reduce(function(m,d){return Math.max(m,domInfo[d].cW);},0);
      var maxCH=domOrder.reduce(function(m,d){return Math.max(m,domInfo[d].cH);},0);
      // Éloigner les clusters au maximum du canvas → flèches longues & lisibles
      var rxEll=Math.min(CW/2-maxCW/2-0.18,Math.max(5.2,hubW/2+3.2+maxCW/2));
      var ryEll=Math.min(CH/2-maxCH/2-0.18,Math.max(2.95,hubH/2+2.4+maxCH/2));
      var domPos={};
      domOrder.forEach(function(d,i){
        var ang=-Math.PI/2+2*Math.PI*i/NDoms;
        domPos[d]={ccx:cx+rxEll*Math.cos(ang),ccy:cy+ryEll*Math.sin(ang)};
      });
      // Cluster position map
      var clPos={};
      if(hubIsDominant){clPos["__hub__"]={cx:cx,cy:cy,w:hubW,h:hubH};}
      domOrder.forEach(function(d){var di=domInfo[d],dp=domPos[d];clPos[d]={cx:dp.ccx,cy:dp.ccy,w:di.cW,h:di.cH};});
      // Flow aggregation
      var getClKey=function(appId){if(hubIsDominant&&appId===hub.id)return"__hub__";return(apps.find(function(a){return a.id===appId;})||{domain:"__unk__"}).domain;};
      var clAgg={};
      flows.forEach(function(f){
        var sc=getClKey(f.from),tc=getClKey(f.to);if(!sc||!tc||sc===tc)return;
        var ka=sc<tc?sc:tc,kb=sc<tc?tc:sc,k=ka+"|||"+kb;
        if(!clAgg[k])clAgg[k]={a:ka,b:kb,out:0,in:0};
        if(sc===ka)clAgg[k].out++;else clAgg[k].in++;
      });
      // Layer 1: domain clusters
      domOrder.forEach(function(d){
        var di=domInfo[d],dp=domPos[d];
        var dc=(_pDC[d]||_pDC.Autre).ac.replace("#","");
        var bx=dp.ccx-di.cW/2,by=dp.ccy-di.cH/2;
        sC.addShape(pres.shapes.RECTANGLE,{x:bx,y:by,w:di.cW,h:di.cH,fill:{color:"EEF2FB"},line:{color:dc,width:1.2},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:0.10,angle:135}});
        sC.addShape(pres.shapes.RECTANGLE,{x:bx,y:by,w:di.cW,h:cHdr,fill:{color:dc},line:{type:"none"}});
        sC.addText(d,{x:bx+0.05,y:by,w:di.cW-0.10,h:cHdr,fontSize:7,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
        di.dApps.forEach(function(a,i){
          var col=i%di.cols,row=Math.floor(i/di.cols);
          var ax=bx+cPad+col*(cAW+cGap),ay=by+cPad+cHdr+row*(cAH+cGap);
          var isHubApp=!hubIsDominant&&a.id===hub.id;
          sC.addShape(pres.shapes.RECTANGLE,{x:ax,y:ay,w:cAW,h:cAH,fill:{color:isHubApp?dc:"FFFFFF"},line:{color:dc,width:isHubApp?1.5:0.6}});
          sC.addText((isHubApp?"★ ":"")+a.name,{x:ax+0.04,y:ay,w:cAW-0.08,h:cAH,fontSize:isHubApp?7:6.5,bold:isHubApp,color:isHubApp?"FFFFFF":"1A1A1A",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
        });
      });
      // Layer 2: arrows
      _drawClusterArrows(sC,clAgg,clPos,flowCol);
      // Layer 3: hub box at center (only when dominant)
      if(hubIsDominant){
        var hubDC=(_pDC[hub.domain]||_pDC.Autre).ac.replace("#","");
        sC.addShape(pres.shapes.RECTANGLE,{x:cx-hubW/2,y:cy-hubH/2,w:hubW,h:hubH,fill:{color:hubDC},line:{color:"FFFFFF",width:2.5},shadow:{type:"outer",blur:7,offset:2,color:"000000",opacity:0.20,angle:135}});
        sC.addText("★  "+hub.name,{x:cx-hubW/2+0.06,y:cy-hubH/2,w:hubW-0.12,h:hubH*0.60,fontSize:12,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",align:"center",valign:"middle",margin:0,shrinkText:true});
        sC.addText(hub.domain+" · "+(degMap[hub.id]||0)+" flux",{x:cx-hubW/2+0.06,y:cy-hubH/2+hubH*0.57,w:hubW-0.12,h:hubH*0.43,fontSize:7,color:"D0E8FF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
      }
    };

    // ── Consolidated — vue domaine central (Option C) ──
    const drawDomainCentricSlide=function(){
      if(apps.length===0)return;
      var sC=_addSlide();
      sC.background={color:"FFFFFF"};
      var sW=13.333,sH=7.5;
      sC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:sW,h:0.58,fill:{color:cp||"0B2545"},line:{type:"none"}});
      sC.addText("CARTOGRAPHIE CONSOLIDÉE — VUE PAR DOMAINE PIVOT",{x:0.3,y:0.08,w:sW-2.5,h:0.28,fontSize:14,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
      sC.addText(apps.length+" applications · "+[...new Set(apps.map(function(a){return a.domain;}))].length+" domaines · "+flows.length+" flux",{x:0.3,y:0.37,w:7,h:0.17,fontSize:8,color:"BFD7FF",fontFace:"Calibri",margin:0});

      var CX=0.20,CY=0.68,CW=sW-0.40,CH=sH-0.78;
      var cx=CX+CW/2,cy=CY+CH/2;
      // Hub app (for visual highlight inside its cluster)
      var degMap={};apps.forEach(function(a){degMap[a.id]=0;});
      flows.forEach(function(f){degMap[f.from]=(degMap[f.from]||0)+1;degMap[f.to]=(degMap[f.to]||0)+1;});
      var hub=apps.reduce(function(best,a){return(degMap[a.id]||0)>(degMap[best.id]||0)?a:best;},apps[0]);
      var cAW=0.95,cAH=0.30,cGap=0.05,cHdr=0.22,cPad=0.08;
      var flowCol=cp||"2979FF";
      // All domains — hub app stays in its domain cluster
      var allDoms=[...new Set(apps.map(function(a){return a.domain;}))].sort();
      var domInfo={};
      allDoms.forEach(function(d){
        var dApps=apps.filter(function(a){return a.domain===d;}).sort(function(a,b){if(a.id===hub.id)return -1;if(b.id===hub.id)return 1;return a.name.localeCompare(b.name);});
        var k=dApps.length,cols=k<=1?1:k<=4?2:3,rows=Math.ceil(k/cols);
        domInfo[d]={dApps:dApps,k:k,cols:cols,rows:rows,cW:cPad*2+cols*cAW+(cols-1)*cGap,cH:cPad*2+cHdr+rows*cAH+(rows-1)*cGap};
      });
      // Pivot domain = domain with most inter-domain flows
      var domScore={};allDoms.forEach(function(d){domScore[d]=0;});
      flows.forEach(function(f){
        var fa=apps.find(function(a){return a.id===f.from;}),ta=apps.find(function(a){return a.id===f.to;});
        if(!fa||!ta||fa.domain===ta.domain)return;
        domScore[fa.domain]=(domScore[fa.domain]||0)+1;
        domScore[ta.domain]=(domScore[ta.domain]||0)+1;
      });
      var pivotDom=allDoms.reduce(function(best,d){return(domScore[d]||0)>(domScore[best]||0)?d:best;},allDoms[0]);
      var satelliteDoms=allDoms.filter(function(d){return d!==pivotDom;});
      var NDoms=satelliteDoms.length;
      var pivDI=domInfo[pivotDom];
      var maxCW=satelliteDoms.reduce(function(m,d){return Math.max(m,domInfo[d].cW);},pivDI.cW);
      var maxCH=satelliteDoms.reduce(function(m,d){return Math.max(m,domInfo[d].cH);},pivDI.cH);
      // Éloigner les clusters satellites au maximum → flèches longues & lisibles
      var rxEll=Math.min(CW/2-maxCW/2-0.18,Math.max(5.2,pivDI.cW/2+3.2+maxCW/2));
      var ryEll=Math.min(CH/2-maxCH/2-0.18,Math.max(2.95,pivDI.cH/2+2.4+maxCH/2));
      // Cluster positions: pivot at center, satellites on ellipse
      var domPos={};
      domPos[pivotDom]={ccx:cx,ccy:cy};
      satelliteDoms.forEach(function(d,i){
        var ang=-Math.PI/2+2*Math.PI*i/Math.max(NDoms,1);
        domPos[d]={ccx:cx+rxEll*Math.cos(ang),ccy:cy+ryEll*Math.sin(ang)};
      });
      var clPos={};
      allDoms.forEach(function(d){var di=domInfo[d],dp=domPos[d];clPos[d]={cx:dp.ccx,cy:dp.ccy,w:di.cW,h:di.cH};});
      // Aggregate inter-domain flows only
      var clAgg={};
      flows.forEach(function(f){
        var fa=apps.find(function(a){return a.id===f.from;}),ta=apps.find(function(a){return a.id===f.to;});
        if(!fa||!ta||fa.domain===ta.domain)return;
        var sc=fa.domain,tc=ta.domain;
        var ka=sc<tc?sc:tc,kb=sc<tc?tc:sc,k=ka+"|||"+kb;
        if(!clAgg[k])clAgg[k]={a:ka,b:kb,out:0,in:0};
        if(sc===ka)clAgg[k].out++;else clAgg[k].in++;
      });
      // Draw cluster helper
      var drawCluster=function(d,isPivot){
        var di=domInfo[d],dp=domPos[d];
        var dc=(_pDC[d]||_pDC.Autre).ac.replace("#","");
        var bx=dp.ccx-di.cW/2,by=dp.ccy-di.cH/2;
        sC.addShape(pres.shapes.RECTANGLE,{x:bx,y:by,w:di.cW,h:di.cH,fill:{color:isPivot?"E8F0FE":"EEF2FB"},line:{color:dc,width:isPivot?2.5:1.2},shadow:{type:"outer",blur:isPivot?8:4,offset:isPivot?3:2,color:"000000",opacity:isPivot?0.18:0.10,angle:135}});
        sC.addShape(pres.shapes.RECTANGLE,{x:bx,y:by,w:di.cW,h:cHdr,fill:{color:dc},line:{type:"none"}});
        var hdrTxt=isPivot?"★ "+d+" — domaine pivot":d;
        sC.addText(hdrTxt,{x:bx+0.05,y:by,w:di.cW-0.10,h:cHdr,fontSize:isPivot?7.5:7,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
        di.dApps.forEach(function(a,i){
          var col=i%di.cols,row=Math.floor(i/di.cols);
          var ax=bx+cPad+col*(cAW+cGap),ay=by+cPad+cHdr+row*(cAH+cGap);
          var isHubApp=a.id===hub.id;
          sC.addShape(pres.shapes.RECTANGLE,{x:ax,y:ay,w:cAW,h:cAH,fill:{color:isHubApp?dc:"FFFFFF"},line:{color:dc,width:isHubApp?1.5:0.6}});
          sC.addText((isHubApp?"★ ":"")+a.name,{x:ax+0.04,y:ay,w:cAW-0.08,h:cAH,fontSize:isHubApp?7:6.5,bold:isHubApp,color:isHubApp?"FFFFFF":"1A1A1A",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
        });
      };
      // Layer 1: satellite clusters
      satelliteDoms.forEach(function(d){drawCluster(d,false);});
      // Layer 2: arrows
      _drawClusterArrows(sC,clAgg,clPos,flowCol);
      // Layer 3: pivot cluster on top (above arrows)
      drawCluster(pivotDom,true);
      // Legend note
      sC.addText("Le domaine pivot est celui qui concentre le plus de flux inter-domaines.",{x:CX,y:CY+CH+0.05,w:CW,h:0.16,fontSize:6.5,color:"888888",fontFace:"Calibri",italic:true,align:"center",margin:0});
    };

    // ── Tableau récapitulatif des flux (paginé) ──
    const drawRecapTableSlides=()=>{
      const ROWS_PER_SLIDE=18;
      const SD1C={"Transfert TSA":"F59E0B","Maintien":"10B981","Rebuild":"6366F1","Abandon":"EF4444"};
      const SD2C={"Clone & Clean":"3B82F6","Transfert":"10B981","Abandon":"EF4444","Rebuild":"8B5CF6"};
      // Aggregate flows by app pair
      const pairAgg={};
      flows.forEach(function(f){
        const fa=apps.find(function(a){return a.id===f.from;});
        const ta=apps.find(function(a){return a.id===f.to;});
        if(!fa||!ta)return;
        const k=f.from+"|"+f.to;
        if(!pairAgg[k])pairAgg[k]={fa,ta,labels:[],protocols:new Set()};
        pairAgg[k].labels.push(f.label||"");
        if(f.protocol)pairAgg[k].protocols.add(f.protocol);
      });
      const rows=Object.values(pairAgg).sort(function(a,b){
        if(a.fa.domain!==b.fa.domain)return a.fa.domain.localeCompare(b.fa.domain);
        return a.fa.name.localeCompare(b.fa.name);
      });
      if(rows.length===0)return;
      const totalPages=Math.ceil(rows.length/ROWS_PER_SLIDE);
      for(var page=0;page<totalPages;page++){
        const sT=_addSlide();
        sT.background={color:"FFFFFF"};
        const suffix=totalPages>1?" ("+(page+1)+"/"+totalPages+")":"";
        sT.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:13.333,h:0.55,fill:{color:cp||"0B2545"},line:{type:"none"}});
        sT.addText("RÉCAPITULATIF DES FLUX"+suffix,{x:0.3,y:0.10,w:12,h:0.35,fontSize:14,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
        const pageRows=rows.slice(page*ROWS_PER_SLIDE,(page+1)*ROWS_PER_SLIDE);
        const hdrOpts=function(txt){return {text:txt,options:{bold:true,fill:{color:"1E293B"},color:"FFFFFF",fontSize:8,fontFace:"Calibri",valign:"middle"}};};
        const header=projectType==='deal'
          ?[[hdrOpts("Domaine"),hdrOpts("App. Source"),hdrOpts("App. Cible"),hdrOpts("Flux / Protocole"),hdrOpts("Statut Day 1"),hdrOpts("Statut Day 2")]]
          :[[hdrOpts("Domaine"),hdrOpts("App. Source"),hdrOpts("App. Cible"),hdrOpts("Flux / Protocole"),hdrOpts("Statut")]];
        const tblRows=pageRows.map(function(r,ri){
          const d1c=SD1C[r.fa.statusD1]||null;
          const d2c=SD2C[r.fa.statusD2]||null;
          const statC=STATUT_COLORS[r.fa.statut]||null;
          const rowBg=ri%2===0?"FFFFFF":"F8FAFC";
          const cell=function(txt,extra){return {text:txt,options:Object.assign({fontSize:8,fontFace:"Calibri",valign:"middle",fill:{color:rowBg},color:"1E293B"},extra||{})};};
          const fluxTxt=[...r.protocols].join(", ")+(r.labels.filter(Boolean).length?" · "+r.labels.filter(Boolean).slice(0,3).join(", ")+(r.labels.filter(Boolean).length>3?" …":""):"");
          const baseCells=[
            cell(r.fa.domain,{color:"6B7280",italic:true}),
            cell(r.fa.name,{bold:true}),
            cell(r.ta.name),
            cell(fluxTxt,{color:"475569",shrinkText:true}),
          ];
          return projectType==='deal'
            ?[...baseCells,
              cell(r.fa.statusD1||"—",d1c?{bold:true,color:d1c}:{color:"9CA3AF"}),
              cell(r.fa.statusD2||"—",d2c?{bold:true,color:d2c}:{color:"9CA3AF"})]
            :[...baseCells,
              cell(r.fa.statut||"—",statC?{bold:true,color:statC.replace("#","")}:{color:"9CA3AF"})];
        });
        sT.addTable([...header,...tblRows],{x:0.25,y:0.65,w:12.83,colW:projectType==='deal'?[2.0,2.60,2.60,3.00,1.30,1.33]:[2.2,2.85,2.85,3.30,1.63],border:{pt:0.4,color:"E2E8F0"},rowH:0.35});
        sT.addText("Données : "+rows.length+" paires d'applications · "+flows.length+" flux total",{x:0.25,y:7.30,w:12.83,h:0.18,fontSize:7,color:"94A3B8",fontFace:"Calibri",margin:0,italic:true,align:"center"});
      }
    };

    // ── Vue agrégée domaine→domaine (diagramme circulaire d'interactions) ──
    const drawDomainFlowSlide=(title,subset,subFlows)=>{
      const sC=_addSlide();
      sC.background={color:"FFFFFF"};
      const sW=13.333,sH=7.5;
      sC.addText(title,{x:0.3,y:0.12,w:sW-0.6,h:0.5,fontSize:20,bold:true,color:"0B2545",fontFace:"Calibri",align:"center",valign:"middle",margin:0});

      const byDom={};
      subset.forEach(a=>{(byDom[a.domain]=byDom[a.domain]||[]).push(a);});
      const domList=Object.keys(byDom).sort((a,b)=>byDom[b].length-byDom[a].length);
      const N=domList.length;
      sC.addText(subset.length+" applications · "+N+" domaines · "+subFlows.length+" flux — vue agrégée par domaine (épaisseur ∝ nb de flux)",{x:0.3,y:0.58,w:sW-0.6,h:0.2,fontSize:10,color:"888888",fontFace:"Calibri",align:"center",margin:0});
      if(N===0)return;
      const seg=(x1,y1,x2,y2,arrow,color,width)=>{
        const w=Math.abs(x2-x1),h=Math.abs(y2-y1);
        if(w<0.004&&h<0.004)return;
        const o={x:Math.min(x1,x2),y:Math.min(y1,y2),w:w||0.001,h:h||0.001,line:{color:color,width:width,dashType:"solid"}};
        if(x2<x1)o.flipH=true;
        if(y2<y1)o.flipV=true;
        if(arrow){o.line.endArrowType="triangle";o.line.endArrowSize=7;}
        sC.addShape(pres.shapes.LINE,o);
      };
      const pairAgg={};
      subFlows.forEach(f=>{
        const fa=subset.find(a=>a.id===f.from),ta=subset.find(a=>a.id===f.to);
        if(!fa||!ta||fa.domain===ta.domain)return;
        const k=fa.domain+"\u0001"+ta.domain;
        if(!pairAgg[k])pairAgg[k]={from:fa.domain,to:ta.domain,count:0,protos:{}};
        pairAgg[k].count++;
        const p=f.protocol||"Autre";
        pairAgg[k].protos[p]=(pairAgg[k].protos[p]||0)+1;
      });
      const CX=0.3,CY=0.92,CW=sW-0.6,CH=sH-1.15;
      const cx=CX+CW/2,cy=CY+CH/2;
      const nodeW=Math.min(2.1,Math.max(1.4,CW/Math.max(5,N)*1.4)),nodeH=0.66;
      const rx=CW/2-nodeW/2-0.35,ry=CH/2-nodeH/2-0.3;
      const nodes={};
      domList.forEach((d,i)=>{
        const ang=-Math.PI/2+2*Math.PI*i/N;
        nodes[d]={cx:cx+rx*Math.cos(ang),cy:cy+ry*Math.sin(ang),w:nodeW,h:nodeH};
        nodes[d].x=nodes[d].cx-nodeW/2;nodes[d].y=nodes[d].cy-nodeH/2;
      });
      const edgePoint=(box,tx,ty)=>{
        const dx=tx-box.cx,dy=ty-box.cy;
        if(dx===0&&dy===0)return{x:box.cx,y:box.cy};
        const sx=dx!==0?(box.w/2)/Math.abs(dx):Infinity;
        const sy=dy!==0?(box.h/2)/Math.abs(dy):Infinity;
        const s=Math.min(sx,sy);
        return{x:box.cx+dx*s,y:box.cy+dy*s};
      };
      const maxCount=Math.max(...Object.values(pairAgg).map(p=>p.count),1);
      // edges first (under nodes)
      Object.values(pairAgg).forEach(pr=>{
        const A=nodes[pr.from],B=nodes[pr.to];
        if(!A||!B)return;
        let domP="Autre",mx=0;
        Object.entries(pr.protos).forEach(([p,cc])=>{if(cc>mx){mx=cc;domP=p;}});
        const color=protoColor(domP);
        const dx=B.cx-A.cx,dy=B.cy-A.cy,len=Math.hypot(dx,dy)||1;
        const px=-dy/len,py=dx/len,off=0.08;
        const p1=edgePoint(A,B.cx,B.cy),p2=edgePoint(B,A.cx,A.cy);
        const x1=p1.x+px*off,y1=p1.y+py*off,x2=p2.x+px*off,y2=p2.y+py*off;
        const width=Math.min(6,1.2+pr.count/maxCount*4.5);
        seg(x1,y1,x2,y2,false,"FFFFFF",width+1.6);
        seg(x1,y1,x2,y2,true,color,width);
        const mxp=(x1+x2)/2+px*0.13,myp=(y1+y2)/2+py*0.13;
        sC.addText("×"+pr.count,{x:mxp-0.26,y:myp-0.11,w:0.52,h:0.22,fontSize:11,bold:true,color:color,fontFace:"Calibri",align:"center",valign:"middle",margin:0});
      });
      // nodes
      domList.forEach(d=>{
        const nd=nodes[d];const cc=_pDC[d]||_pDC.Autre;const ac=cc.ac.replace("#","");
        sC.addShape(pres.shapes.RECTANGLE,{x:nd.x,y:nd.y,w:nd.w,h:nd.h,fill:{color:ac},line:{color:"FFFFFF",width:1.75}});
        sC.addText(d+"  ("+byDom[d].length+")",{x:nd.x+0.05,y:nd.y,w:nd.w-0.1,h:nd.h,fontSize:11,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
      });
      // protocol legend bottom-left
      const usedP=new Set();Object.values(pairAgg).forEach(pr=>{let dp="Autre",m=0;Object.entries(pr.protos).forEach(([p,cc])=>{if(cc>m){m=cc;dp=p;}});usedP.add(dp);});
      const seen=new Set(),entries=[];
      [...usedP].forEach(p=>{const lbl=protoLabel(p);if(seen.has(lbl))return;seen.add(lbl);entries.push({label:lbl,color:protoColor(p)});});
      if(entries.length){
        const lw=1.8,lh=0.16+entries.length*0.13,lx=CX,ly=CY+CH-lh;
        sC.addShape(pres.shapes.RECTANGLE,{x:lx,y:ly,w:lw,h:lh,fill:{color:"FAFBFC"},line:{color:"E8EAED",width:0.3}});
        sC.addText("PROTOCOLES",{x:lx+0.04,y:ly+0.01,w:lw-0.08,h:0.10,fontSize:5,bold:true,color:"0B2545",fontFace:"Calibri",charSpacing:0.5,margin:0});
        entries.forEach((e,i)=>{const ey=ly+0.16+i*0.13;sC.addShape(pres.shapes.LINE,{x:lx+0.08,y:ey+0.05,w:0.2,h:0,line:{color:e.color,width:1.5,endArrowType:"triangle",endArrowSize:4}});sC.addText(e.label,{x:lx+0.32,y:ey,w:lw-0.38,h:0.12,fontSize:6.5,color:"333333",fontFace:"Calibri",margin:0,valign:"middle"});});
      }
    };

    // Helpers criticité de flux
    const critRank=(a)=>a?(a.criticality==="Haute"?3:a.criticality==="Moyenne"?2:1):1;
    const flowCrit=(f)=>{const fa=apps.find(a=>a.id===f.from),ta=apps.find(a=>a.id===f.to);return Math.max(critRank(fa),critRank(ta));};

    var MFS=6; // max flows per slide

    // ── Cartographie consolidée : Option A (secteurs) + Option C (anneau) ──
    if(_opts.inclConsolidatedCarto){
      drawConsolidatedSectorSlide();
      drawConsolidatedRingSlide();
      drawDomainCentricSlide();
    }

    // ── Cartographie principale selon le mode choisi ──
    if(_opts.cartoMode==="byDomain"){
      doms.forEach(function(D){
        const domApps=apps.filter(function(a){return a.domain===D;});
        const neighborIds=new Set();
        flows.forEach(function(f){
          const fa=apps.find(function(a){return a.id===f.from;});
          const ta=apps.find(function(a){return a.id===f.to;});
          if(!fa||!ta)return;
          if(fa.domain===D&&ta.domain!==D)neighborIds.add(ta.id);
          if(ta.domain===D&&fa.domain!==D)neighborIds.add(fa.id);
        });
        const subset=[...domApps,...apps.filter(function(a){return neighborIds.has(a.id);})];
        const subFlows=flows.filter(function(f){
          const fa=apps.find(function(a){return a.id===f.from;});
          const ta=apps.find(function(a){return a.id===f.to;});
          return fa&&ta&&(fa.domain===D||ta.domain===D);
        });
        if(subset.length===0)return;
        // Greyed IDs = neighbor apps from other domains (context, not focal)
        const externalIds=new Set(subset.filter(function(a){return a.domain!==D;}).map(function(a){return a.id;}));
        drawCartoSlide("Cartographie — "+D,subset,subFlows,true,true,externalIds);
      });
    } else if(_opts.cartoMode==="byHub"){
      const appConn={};
      flows.forEach(function(f){appConn[f.from]=(appConn[f.from]||0)+1;appConn[f.to]=(appConn[f.to]||0)+1;});
      const sortedHubs=[...apps].sort(function(a,b){return (appConn[b.id]||0)-(appConn[a.id]||0);});
      const domFilter=_opts.hubDomainFilter;
      const topHubs=sortedHubs.filter(function(a){return (appConn[a.id]||0)>0&&(!domFilter||domFilter.includes(a.domain));}).slice(0,_opts.hubLimit);
      topHubs.forEach(function(hub){
        const neighborIds=new Set([hub.id]);
        flows.forEach(function(f){if(f.from===hub.id)neighborIds.add(f.to);if(f.to===hub.id)neighborIds.add(f.from);});
        const subset=apps.filter(function(a){return neighborIds.has(a.id);});
        const subFlows=flows.filter(function(f){return neighborIds.has(f.from)||neighborIds.has(f.to);}).filter(function(f){return f.from===hub.id||f.to===hub.id;});
        drawHubRadialSlide(hub,subset,subFlows,appConn[hub.id]||0);
        drawHubDetailSlide(hub,subset,subFlows,appConn[hub.id]||0);
      });
      if(topHubs.length===0){drawCartoSlide("Cartographie globale AS-IS",apps,[],false);drawCartoSlide("Cartographie globale — avec flux",apps,flows,true);}
    } else if(_opts.cartoMode==="global"){
      drawCartoSlide("CARTOGRAPHIE GLOBALE — TOUTES APPLICATIONS",apps,flows,true);
    }
    // cartoMode "none" → pas de slides de cartographie détaillée

    // ── Slide SYNTHÈSE GLOBALE (fonction réutilisable, pagination si saturé) ──
    var _sharedSynPos={};// hoisted: shared between drawSynthSlide and drawDetailedSynth
    var drawSynthSlide=function(synApps,synFlows,titleSuffix){
      var _synSatS={v:1.0};

      var synSl=_addSlide();// raw slide: synthesis computes directly in 13.333x7.5 wide space (no SS proxy)
      synSl.background={color:"F5F6FA"};
      synSl.addText("SYNTH\u00C8SE \u2014 CARTOGRAPHIE & FLUX"+(titleSuffix||""),{x:0.3,y:0.05,w:6,h:0.35,fontSize:13,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});
      _sharedSynPos={};// reset
      var synPos=_sharedSynPos;
      var synDoms=[...new Set(synApps.map(function(a){return a.domain;}))];
      // === Hub-centric pre-analysis ===
      // 1. Find the central hub app (most total synFlows in+out)
      var appDeg={};
      synApps.forEach(function(a){appDeg[a.id]=0;});
      synFlows.forEach(function(f){appDeg[f.from]=(appDeg[f.from]||0)+1;appDeg[f.to]=(appDeg[f.to]||0)+1;});
      var hubApp=synApps.reduce(function(best,a){return(appDeg[a.id]||0)>(appDeg[best.id]||0)?a:best;},synApps[0]);
      var hubDom=hubApp.domain;
      // 2. Compute inter-domain flow matrix
      var domPairFlows={};
      synFlows.forEach(function(f){
        var fa=synApps.find(function(a){return a.id===f.from;});
        var ta=synApps.find(function(a){return a.id===f.to;});
        if(!fa||!ta||fa.domain===ta.domain)return;
        var k=fa.domain+">>"+ta.domain;
        domPairFlows[k]=(domPairFlows[k]||0)+1;
      });
      // 3. Sort domains: hub in CENTER, left=receives FROM hub, right=sends TO hub
      var leftDoms=[],rightDoms=[];
      synDoms.forEach(function(d){
        if(d===hubDom)return;
        var fromHub=domPairFlows[hubDom+">>"+d]||0;// hub sends TO d
        var toHub=domPairFlows[d+">>"+hubDom]||0;// d sends TO hub
        if(fromHub>=toHub)leftDoms.push({dom:d,count:fromHub+toHub});
        else rightDoms.push({dom:d,count:fromHub+toHub});
      });
      // Sort by flow count (most connected closest to center)
      leftDoms.sort(function(a,b){return b.count-a.count;});
      rightDoms.sort(function(a,b){return b.count-a.count;});
      // Build final order: left domains (reversed so closest to center is last) + hub + right domains
      synDoms=leftDoms.map(function(d){return d.dom;}).reverse().concat([hubDom]).concat(rightDoms.map(function(d){return d.dom;}));
      var hubDomIdx=synDoms.indexOf(hubDom);
      var hubFlowCount=synFlows.filter(function(f){return f.from===hubApp.id||f.to===hubApp.id;}).length;
      var hubDominant=hubFlowCount>synFlows.length*0.4;
      synSl.addText(synApps.length+" synApps · "+synFlows.length+" flux · "+doms.length+" domaines · Hub: "+hubApp.name+" ("+(appDeg[hubApp.id]||0)+" flux)",{x:5.5,y:0.08,w:5.5,h:0.25,fontSize:6,color:"888888",fontFace:"Calibri",align:"right",margin:0});
      var nDoms=synDoms.length;
      var _sX=0.15,_sY=0.5,_sW=W-0.3,_sH=H-0.6;
      var domColW=_sW/nDoms;
      var appH4=0.18;
      var colGap=0.10; // gap between 2 columns inside a domain (for intra synFlows)
      // === Barycentric ordering: align connected synApps across domains ===
      // Step 1: Sort domains by connectivity (most connected first as anchor)
      var domAppMap={};
      synDoms.forEach(function(d){domAppMap[d]=synApps.filter(function(a){return a.domain===d;});});
      // Step 2: For each domain, compute ideal Y based on connected synApps
      // We do 3 iterations to converge
      var domOrder={};// domain -> sorted app list
      synDoms.forEach(function(d){domOrder[d]=domAppMap[d].slice();});
      for(var iter=0;iter<3;iter++){
        synDoms.forEach(function(dom,di){
          var dApps=domOrder[dom];
          var scores={};
          dApps.forEach(function(app){
            var connected=[];
            synFlows.forEach(function(f){
              var partnerId=null;
              if(f.from===app.id){var ta=synApps.find(function(a){return a.id===f.to;});if(ta&&ta.domain!==dom)partnerId=f.to;}
              if(f.to===app.id){var fa=synApps.find(function(a){return a.id===f.from;});if(fa&&fa.domain!==dom)partnerId=f.from;}
              if(partnerId){
                // Find partner position in its domain
                var pDom=synApps.find(function(a){return a.id===partnerId;}).domain;
                var pList=domOrder[pDom];
                var pIdx=pList.findIndex(function(a){return a.id===partnerId;});
                if(pIdx>=0)connected.push(pIdx/Math.max(1,pList.length-1));
              }
            });
            scores[app.id]=connected.length>0?connected.reduce(function(a,b){return a+b;},0)/connected.length:0.5;
          });
          // Sort by barycentric score (keep unconnected synApps in middle)
          dApps.sort(function(a,b){return scores[a.id]-scores[b.id];});
          domOrder[dom]=dApps;
        });
      }
      // Step 2b: Refine with per-app LR score (sources up, targets down)
      var appLR={};
      synApps.forEach(function(app){
        var outD=0,inD=0;
        synFlows.forEach(function(f){
          if(f.from===app.id)outD++;
          if(f.to===app.id)inD++;
        });
        appLR[app.id]=(inD-outD)/(outD+inD+1);// -1=pure source, +1=pure target, 0=balanced
      });
      synDoms.forEach(function(dom){
        var dApps=domOrder[dom];
        // Stable sort: primary=barycentric position, secondary=LR score
        var baryPos={};
        dApps.forEach(function(a,i){baryPos[a.id]=i;});
        dApps.sort(function(a,b){
          var posDiff=baryPos[a.id]-baryPos[b.id];
          if(Math.abs(posDiff)>1)return posDiff;// barycentric wins if clearly different
          return appLR[a.id]-appLR[b.id];// LR refines ties: sources before targets
        });
        domOrder[dom]=dApps;
      });
      // Step 3: Place synApps — content-packed domains + WIDE corridors for arrows/labels
      var slideBottom=H-0.25;
      // Pre-compute content width of each domain (apps packed left)
      var domNColsM={},domContentW={};
      synDoms.forEach(function(d){
        var n=domOrder[d].length;
        var nc=n>8?2:1;
        var maxRowsP=Math.floor((_sH-0.25)/(appH4+0.02));
        if(Math.ceil(n/nc)>maxRowsP&&nc<3)nc=3;
        domNColsM[d]=nc;
        domContentW[d]=0.12+nc*0.88+(nc-1)*colGap;
      });
      var totContentW=0;synDoms.forEach(function(d){totContentW+=domContentW[d];});
      var corridorW=synDoms.length>1?Math.max(0.80,(_sW-totContentW)/(synDoms.length-1)):0;
      var domColXsM={};var _cx0=_sX;
      synDoms.forEach(function(d){domColXsM[d]=_cx0;_cx0+=domContentW[d]+corridorW;});
      synDoms.forEach(function(dom,di){
        var dApps=domOrder[dom];
        var cc4=_pDC[dom]||_pDC.Autre;
        var colX=domColXsM[dom];
        var nCols4=domNColsM[dom];
        var innerW4=domContentW[dom]-0.12;
        var nRows4=Math.ceil(dApps.length/nCols4);
        var appW4=nCols4>1?(innerW4-(nCols4-1)*colGap)/nCols4:innerW4;
        appW4=Math.min(0.88,appW4);
        var availH4=slideBottom-_sY-0.2;
        // Adaptive app height: shrink if too many rows
        var ah4=appH4;
        var totalNeeded=nRows4*ah4+(nRows4-1)*0.02;
        if(totalNeeded>availH4){ah4=Math.max(0.10,(availH4-nRows4*0.02)/(nRows4+nRows4*0.15));}
        var gap4=nRows4>1?Math.max(0.02,(availH4-nRows4*ah4)/(nRows4-1)):0;
        // Domain header drawn AFTER BBox scaling (see below)
        var colXs=[];
        for(var ci=0;ci<nCols4;ci++){colXs.push(colX+0.06+ci*(appW4+colGap));}
        // Assign columns: hub-facing synApps toward CENTER, internal synApps to EDGE
        var colAssign={};
        if(nCols4>=2){
          var hasHubLink={};
          dApps.forEach(function(app){
            var linked=synFlows.some(function(f){
              if(f.from===app.id){var ta=synApps.find(function(a){return a.id===f.to;});return ta&&ta.domain!==dom;}
              if(f.to===app.id){var fa=synApps.find(function(a){return a.id===f.from;});return fa&&fa.domain!==dom;}
              return false;
            });
            hasHubLink[app.id]=linked;
          });
          var isLeftOfHub=di<hubDomIdx;
          var isRightOfHub=di>hubDomIdx;
          var facingCol=isLeftOfHub?nCols4-1:0;
          var backCol=isLeftOfHub?0:nCols4-1;
          var faceApps=[],backApps=[];
          dApps.forEach(function(app){
            if(dom===hubDom&&app.id===hubApp.id)faceApps.unshift(app);
            else if(hasHubLink[app.id])faceApps.push(app);
            else backApps.push(app);
          });
          var rowIdx2=[];for(var rc2=0;rc2<nCols4;rc2++)rowIdx2.push(0);
          faceApps.forEach(function(a){colAssign[a.id]={col:facingCol,row:rowIdx2[facingCol]};rowIdx2[facingCol]++;});
          backApps.forEach(function(a){colAssign[a.id]={col:backCol,row:rowIdx2[backCol]};rowIdx2[backCol]++;});
          var mpc=Math.ceil(dApps.length/nCols4)+2;
          dApps.forEach(function(a){var ca=colAssign[a.id];if(!ca)return;if(ca.row>=mpc){var oc=ca.col===0?1:0;colAssign[a.id]={col:oc,row:rowIdx2[oc]};rowIdx2[oc]++;}});
        } else {
          var sorted4=dApps.slice();
          if(dom===hubDom){sorted4.sort(function(a,b){return a.id===hubApp.id?-1:b.id===hubApp.id?1:0;});}
          sorted4.forEach(function(a,i){colAssign[a.id]={col:0,row:i};});
        }
        var maxRow0=0,maxRow1=0;
        dApps.forEach(function(a){var ca=colAssign[a.id];if(!ca)return;if(ca.col===0&&ca.row>maxRow0)maxRow0=ca.row;if(ca.col>=1&&ca.row>maxRow1)maxRow1=ca.row;});
        var nRowsActual=Math.max(maxRow0,maxRow1)+1;
        var gap4r=nRowsActual>1?Math.max(0.02,(availH4-nRowsActual*ah4)/(nRowsActual-1)):0;
        dApps.forEach(function(app){
          var ca=colAssign[app.id];if(!ca)return;
          var ax=colXs[ca.col]||colXs[0];
          var ay=_sY+0.18+ca.row*(ah4+gap4r);
          ay=Math.min(ay,slideBottom-ah4);
          ax=Math.min(ax,W-appW4-0.05);
          synPos[app.id]={x:ax,y:ay,w:appW4,h:ah4,cx:ax+appW4/2,cy:ay+ah4/2,di:di,dom:dom,col4:ca.col,colGapX:colXs[0]+appW4+(colGap/2)};
        });
      });
      // === RADIAL LAYOUT (hub dominant, ≤8 satellite domains) ===
      // Falls back to left/right stacks if >8 satellite domains
      if(hubDominant){
        var satDoms=synDoms.filter(function(d){return d!==hubDom;});
        var nSat=satDoms.length;
        if(nSat<=8){
          // ── RADIAL/ORBITAL ──
          // Compute connection count per satellite domain
          var satConn={};
          satDoms.forEach(function(d){
            var cnt=0;
            synFlows.forEach(function(f){
              var fa=synApps.find(function(a){return a.id===f.from;});
              var ta=synApps.find(function(a){return a.id===f.to;});
              if(!fa||!ta)return;
              if((fa.domain===d&&f.to===hubApp.id)||(f.from===hubApp.id&&ta.domain===d))cnt++;
            });
            satConn[d]=cnt;
          });
          // Sort: most connected → equatorial slots (3h/9h); least → polar (12h/6h)
          var satSorted=satDoms.slice().sort(function(a,b){return satConn[b]-satConn[a];});
          // Build angle list: uniform, starting at top (-90°), clockwise
          var rawAngles=[];
          for(var ai2=0;ai2<nSat;ai2++) rawAngles.push(-90+ai2*(360/nSat));
          // Sort angles by proximity to equator (0° / 180°)
          var eqAngles=rawAngles.slice().sort(function(a,b){
            var absA=Math.abs(((a%360)+360)%360);if(absA>180)absA=360-absA;var dA2=Math.abs(absA-90);
            var absB=Math.abs(((b%360)+360)%360);if(absB>180)absB=360-absB;var dB2=Math.abs(absB-90);
            return dA2-dB2;// closest to equator (0° or 180°) first
          });
          var angleMap={};
          satSorted.forEach(function(d,si){angleMap[d]=eqAngles[si]*Math.PI/180;});
          // Slide geometry — work in FINAL 13.333×7.5 space directly (no BBox scaling for radial)
          // Dynamic radius: ensure corridor ≥ 1.4" between hub edge and satellite block edge
          var HCX=W/2,HCY=(H+0.5)/2;
          var BW2=2.0,BH_MAX=2.4;
          var HUB_W=2.2,HUB_H=0.38;// hub box dimensions
          // Base radii — will be adjusted per-satellite during placement
          var RX2=5.2,RY2=2.9;// larger base to push satellites outward
          // Place each satellite block centered on its ellipse point
          satDoms.forEach(function(dom){
            var ang=angleMap[dom];
            var dA=synApps.filter(function(a){return a.domain===dom;});
            var nc=dA.length>4?2:1;
            var nr=Math.ceil(dA.length/nc);
            var aw2=(BW2-0.06-(nc-1)*0.05)/nc;
            var ah2=Math.min(0.17,Math.max(0.10,(BH_MAX-0.13-0.03*(nr-1))/nr));
            var blkH=0.12+nr*ah2+(nr-1)*0.03;
            var blkW2=BW2;
            // Compute dynamic radius for this satellite so corridor ≥ 1.4"
            // Distance from hub center to hub edge along this ray
            var cosA=Math.cos(ang),sinA=Math.sin(ang);
            var hubEdge=Math.min(Math.abs(cosA)>0.01?(HUB_W/2)/Math.abs(cosA):999,Math.abs(sinA)>0.01?(HUB_H/2)/Math.abs(sinA):999);
            // Distance from satellite center to satellite near edge
            var satNearEdge=Math.min(Math.abs(cosA)>0.01?(blkW2/2)/Math.abs(cosA):999,Math.abs(sinA)>0.01?(blkH/2)/Math.abs(sinA):999);
            // Required radius: hubEdge + corridor + satNearEdge
            var CORRIDOR=1.4;
            var dynR=hubEdge+CORRIDOR+satNearEdge;
            // Compute ellipse scale factor (keep aspect ratio)
            var baseR=Math.sqrt((RX2*cosA)*(RX2*cosA)+(RY2*sinA)*(RY2*sinA));
            var scale=Math.max(1,dynR/baseR);
            var rX2d=RX2*scale,rY2d=RY2*scale;
            var bcx=HCX+rX2d*cosA;
            var bcy=HCY+rY2d*sinA;
            var blkX=bcx-blkW2/2;
            var blkY=bcy-blkH/2;
            // Hard clamp so blocks stay in slide
            blkX=Math.max(0.06,Math.min(W-blkW2-0.06,blkX));
            blkY=Math.max(0.45,Math.min(H-blkH-0.08,blkY));
            // Update bcx/bcy to clamped center (for flux routing)
            bcx=blkX+blkW2/2;bcy=blkY+blkH/2;
            // Domain header above apps
            var cc2=_pDC[dom]||_pDC.Autre;
            synSl.addShape(pres.shapes.RECTANGLE,{x:blkX,y:blkY,w:BW2,h:0.10,fill:{color:cc2.ac.replace("#","")},line:{type:"none"}});
            synSl.addText(dom+" ("+dA.length+")",{x:blkX+0.02,y:blkY+0.005,w:BW2-0.04,h:0.09,fontSize:3.5,bold:true,color:"FFFFFF",fontFace:"Calibri",margin:0,shrinkText:true});
            dA.forEach(function(a,ai){
              var col=ai%nc,row=Math.floor(ai/nc);
              var ax=blkX+0.03+col*(aw2+0.05);
              var ay=blkY+0.12+row*(ah2+0.03);
              synPos[a.id]={x:ax,y:ay,w:aw2,h:ah2,cx:ax+aw2/2,cy:ay+ah2/2,dom:dom,di:0,col4:0,colGapX:0};
            });
          });
          // Hub at exact center — prominent box
          synPos[hubApp.id]={x:HCX-1.1,y:HCY-0.19,w:2.2,h:0.38,cx:HCX,cy:HCY,dom:hubDom,di:0,col4:0,colGapX:0};
          // Hub domain other apps — cluster below hub
          var hubOthers=synApps.filter(function(a){return a.domain===hubDom&&a.id!==hubApp.id;});
          if(hubOthers.length>0){
            var nc9=hubOthers.length>4?2:1;
            var aw9=(2.0-(nc9-1)*0.06)/nc9;
            hubOthers.forEach(function(a,ai){
              var col=ai%nc9,row=Math.floor(ai/nc9);
              var ax=HCX-1.0+col*(aw9+0.06);
              var ay=HCY+0.25+row*0.17;
              synPos[a.id]={x:ax,y:ay,w:aw9,h:0.14,cx:ax+aw9/2,cy:ay+0.07,dom:hubDom,di:0,col4:0,colGapX:0};
            });
          }
          // Draw hub domain header from hub position
          var hubCC=_pDC[hubDom]||_pDC.Autre;
          var hbx=HCX-1.1,hby=HCY-0.35;
          synSl.addShape(pres.shapes.RECTANGLE,{x:hbx,y:hby,w:2.2,h:0.13,fill:{color:hubCC.ac.replace("#","")},line:{type:"none"}});
          synSl.addText(hubDom+" ("+synApps.filter(function(a){return a.domain===hubDom;}).length+")",{x:hbx+0.03,y:hby+0.005,w:2.14,h:0.12,fontSize:4.5,bold:true,color:"FFFFFF",fontFace:"Calibri",margin:0,shrinkText:true});
          // Disable domain headers in post-render pass for radial (already drawn above)
          synSl._radialHeadersDone=true;
        } else {
          // ── FALLBACK: left/right stacks (>8 satellite domains) ──
          var leftD=[],rightD=[];
          satDoms.forEach(function(d){
            var toHub=0,fromHub=0;
            synFlows.forEach(function(f){
              var fa=synApps.find(function(a){return a.id===f.from;});
              var ta=synApps.find(function(a){return a.id===f.to;});
              if(!fa||!ta)return;
              if(fa.domain===d&&f.to===hubApp.id)toHub++;
              if(f.from===hubApp.id&&ta.domain===d)fromHub++;
            });
            if(toHub>=fromHub)leftD.push({d:d,n:toHub+fromHub});
            else rightD.push({d:d,n:toHub+fromHub});
          });
          leftD.sort(function(a,b){return b.n-a.n;});
          rightD.sort(function(a,b){return b.n-a.n;});
          var placeStack=function(domsArr,x0,colW2){
            var blocks=domsArr.map(function(o){
              var dA=synApps.filter(function(a){return a.domain===o.d;});
              var nc=dA.length>4?2:1;
              var nr=Math.ceil(dA.length/nc);
              return{d:o.d,dA:dA,nc:nc,nr:nr,h:0.18+nr*0.18+0.06};
            });
            var totH=0;blocks.forEach(function(b){totH+=b.h;});
            totH+=(blocks.length-1)*0.08;
            var y0=Math.max(0.5,(H-totH)/2);
            blocks.forEach(function(b){
              var aw=(colW2-0.1-(b.nc-1)*0.05)/b.nc;
              b.dA.forEach(function(a,ai){
                var col=ai%b.nc,row=Math.floor(ai/b.nc);
                var ax=x0+0.05+col*(aw+0.05);
                var ay=y0+0.16+row*0.18;
                synPos[a.id]={x:ax,y:ay,w:aw,h:0.14,cx:ax+aw/2,cy:ay+0.07,dom:b.d,di:0,col4:0,colGapX:0};
              });
              y0+=b.h+0.08;
            });
          };
          var sideW=3.4;
          placeStack(leftD,0.15,sideW);
          placeStack(rightD,W-sideW-0.15,sideW);
          var hubA=synApps.filter(function(a){return a.domain===hubDom;});
          var hcx=W/2;
          synPos[hubApp.id]={x:hcx-0.95,y:H/2-0.18,w:1.9,h:0.3,cx:hcx,cy:H/2-0.03,dom:hubDom,di:0,col4:0,colGapX:0};
          var others9=hubA.filter(function(a){return a.id!==hubApp.id;});
          var nc9b=others9.length>6?2:1;
          var aw9b=(2.6-(nc9b-1)*0.06)/nc9b;
          others9.forEach(function(a,ai){
            var col=ai%nc9b,row=Math.floor(ai/nc9b);
            var ax=hcx-1.3+col*(aw9b+0.06);
            var ay=H/2+0.18+row*0.18;
            synPos[a.id]={x:ax,y:ay,w:aw9b,h:0.14,cx:ax+aw9b/2,cy:ay+0.07,dom:hubDom,di:0,col4:0,colGapX:0};
          });
        }
      }
      // === BBox Auto-Scaling (skipped for radial — positions already in final space) ===
      if(!synSl._radialHeadersDone){
      var bMinX=Infinity,bMinY=_sY,bMaxX=-Infinity,bMaxY=-Infinity;
      Object.values(synPos).forEach(function(p){
        bMinX=Math.min(bMinX,p.x);
        bMinY=Math.min(bMinY,p.y);
        bMaxX=Math.max(bMaxX,p.x+p.w);
        bMaxY=Math.max(bMaxY,p.y+p.h);
      });
      var bboxW=bMaxX-bMinX,bboxH=bMaxY-bMinY;
      var margin=0.15;
      var availW=W-margin*2,availH5=H-0.5-margin;
      var scaleX=bboxW>0?availW/bboxW:1;
      var scaleY=bboxH>0?availH5/bboxH:1;
      var S=Math.min(scaleX,scaleY,1.5);_synSatS.v=S;// upscale up to 1.5x to fill empty slides
      var fS=Math.max(1,Math.min(1.4,S));// font multiplier
      // ALWAYS normalize: scale (if needed) + translate/center into slide bounds
      var offX2=margin+(availW-bboxW*S)/2;
      var offY2=0.5+(availH5-bboxH*S)/2;
      Object.keys(synPos).forEach(function(id){
        var p=synPos[id];
        p.x=(p.x-bMinX)*S+offX2;
        p.y=(p.y-bMinY)*S+offY2;
        p.w=p.w*S;
        p.h=p.h*S;
        // Hard clamp as last resort
        if(p.x+p.w>W-0.05)p.x=W-0.05-p.w;
        if(p.x<0.05)p.x=0.05;
        if(p.y+p.h>H-0.08)p.y=H-0.08-p.h;
        if(p.y<0.45)p.y=0.45;
        p.cx=p.x+p.w/2;
        p.cy=p.y+p.h/2;
      });
      // === Domain headers (drawn from SCALED app positions) ===
      synDoms.forEach(function(dom){
        var cc7=_pDC[dom]||_pDC.Autre;
        var dminX=Infinity,dmaxX=-Infinity,dminY=Infinity;
        var dcount=0;
        synApps.forEach(function(a){
          if(a.domain!==dom)return;
          var p=synPos[a.id];if(!p)return;
          dminX=Math.min(dminX,p.x);dmaxX=Math.max(dmaxX,p.x+p.w);dminY=Math.min(dminY,p.y);
          dcount++;
        });
        if(dcount===0)return;
        var hx=Math.max(0.02,dminX-0.02);
        var hw=Math.min(W-hx-0.02,dmaxX-dminX+0.04);
        var hy=Math.max(0.02,dminY-0.16*fS);
        synSl.addShape(pres.shapes.RECTANGLE,{x:hx,y:hy,w:hw,h:0.13*fS,fill:{color:cc7.ac.replace("#","")},line:{type:"none"}});
        synSl.addText(dom+" ("+dcount+")",{x:hx+0.03,y:hy+0.005,w:hw-0.06,h:0.12*fS,fontSize:Math.round(4.5*fS*10)/10,bold:true,color:"FFFFFF",fontFace:"Calibri",margin:0,shrinkText:true});
      });
      } else {
        // Radial mode: fS=1 (no scaling), _synSatS.v=1
        var fS=1;_synSatS.v=1;
        // Clamp all positions
        Object.keys(synPos).forEach(function(id){
          var p=synPos[id];
          if(p.x+p.w>W-0.05)p.x=W-0.05-p.w;
          if(p.x<0.05)p.x=0.05;
          if(p.y+p.h>H-0.08)p.y=H-0.08-p.h;
          if(p.y<0.45)p.y=0.45;
          p.cx=p.x+p.w/2;p.cy=p.y+p.h/2;
        });
      }
      // === Bundled synFlows: group by (from,to) pair ===
      var bundles={};
      synFlows.forEach(function(f){
        var A=synPos[f.from],B=synPos[f.to];
        if(!A||!B)return;
        if(A.dom===B.dom)return; // Skip intra-domain
        var k;
        if(hubDominant&&f.to===hubApp.id){
          // Aggregate: all synFlows from same domain TO hub = one bundle
          k="DOM:"+A.dom+">>HUB";
          if(!bundles[k])bundles[k]={fromDom:A.dom,toHub:true,synFlows:[],protocols:{},agg:true};
        } else if(hubDominant&&f.from===hubApp.id){
          k="HUB>>DOM:"+B.dom;
          if(!bundles[k])bundles[k]={toDom:B.dom,fromHub:true,synFlows:[],protocols:{},agg:true};
        } else {
          k=f.from+">>"+f.to;
          if(!bundles[k])bundles[k]={from:f.from,to:f.to,synFlows:[],protocols:{}};
        }
        bundles[k].synFlows.push(f);
        bundles[k].protocols[f.protocol||"?"]=true;
      });
      var bundleList=Object.values(bundles);
      var synLR=[];
      // App boxes = obstacles pour le placement des labels
      Object.values(synPos).forEach(function(p){synLR.push({x:p.x-0.05,y:p.y-0.05,w:p.w+0.10,h:p.h+0.10});});
      var clipP=function(cx5,cy5,w5,h5,tx5,ty5){var dx5=tx5-cx5,dy5=ty5-cy5;if(Math.abs(dx5)<0.01&&Math.abs(dy5)<0.01)return{x:cx5,y:cy5};var sx5=Math.abs(dx5)>0.01?(w5/2)/Math.abs(dx5):999;var sy5=Math.abs(dy5)>0.01?(h5/2)/Math.abs(dy5):999;var s5=Math.min(sx5,sy5);return{x:cx5+dx5*s5,y:cy5+dy5*s5};};
      var hubP=synPos[hubApp.id];
      bundleList.forEach(function(bun){
        var A,B;
        if(bun.agg&&bun.toHub){
          // Ancrage sur la bounding-box réelle du bloc domaine source
          var dApps7=synApps.filter(function(a){return a.domain===bun.fromDom;});
          var bx7=Infinity,bX7=-Infinity,by7=Infinity,bY7=-Infinity;
          dApps7.forEach(function(a){var p=synPos[a.id];if(!p)return;bx7=Math.min(bx7,p.x);bX7=Math.max(bX7,p.x+p.w);by7=Math.min(by7,p.y);bY7=Math.max(bY7,p.y+p.h);});
          if(bx7===Infinity||!hubP)return;
          var bw7=bX7-bx7,bh7=bY7-by7;
          A={cx:bx7+bw7/2,cy:by7+bh7/2,x:bx7,y:by7,w:bw7,h:bh7,dom:bun.fromDom};
          B=hubP;
        } else if(bun.agg&&bun.fromHub){
          var dApps8=synApps.filter(function(a){return a.domain===bun.toDom;});
          var bx8=Infinity,bX8=-Infinity,by8=Infinity,bY8=-Infinity;
          dApps8.forEach(function(a){var p=synPos[a.id];if(!p)return;bx8=Math.min(bx8,p.x);bX8=Math.max(bX8,p.x+p.w);by8=Math.min(by8,p.y);bY8=Math.max(bY8,p.y+p.h);});
          if(bx8===Infinity||!hubP)return;
          var bw8=bX8-bx8,bh8=bY8-by8;
          A=hubP;
          B={cx:bx8+bw8/2,cy:by8+bh8/2,x:bx8,y:by8,w:bw8,h:bh8,dom:bun.toDom};
        } else {
          A=synPos[bun.from];B=synPos[bun.to];
        }
        if(!A||!B)return;
        var n=bun.synFlows.length;
        var protos6=Object.keys(bun.protocols).sort();
        var mainProto=protos6[0];
        var pc=protoColor(mainProto);
        var isMixed=protos6.length>1;
        var lineW=Math.min(2.5,0.5+bun.synFlows.length*0.12);// épaisseur ∝ nb flux agrégés
        var ep=clipP(A.cx,A.cy,A.w,A.h,B.cx,B.cy);
        var en=clipP(B.cx,B.cy,B.w,B.h,A.cx,A.cy);
        var rdx=en.x-ep.x,rdy=en.y-ep.y;
        // ── Routage en L avec coude ──
        var routeSegs,lblCx,lblCy,lblHoriz;
        if(Math.abs(rdx)<0.08||Math.abs(rdy)<0.08){
          // Quasi-droit : segment unique
          routeSegs=[[ep.x,ep.y,en.x,en.y]];
          lblCx=(ep.x+en.x)/2;lblCy=(ep.y+en.y)/2;lblHoriz=Math.abs(rdx)>Math.abs(rdy);
        } else if(!synSl._radialHeadersDone){
          // Layout colonnes : 3 segments via corridor vertical au milieu
          var midX=ep.x+rdx*0.5;
          routeSegs=[[ep.x,ep.y,midX,ep.y],[midX,ep.y,midX,en.y],[midX,en.y,en.x,en.y]];
          lblCx=midX;lblCy=(ep.y+en.y)/2;lblHoriz=false;
        } else if(Math.abs(rdx)>=Math.abs(rdy)){
          // Radial, dominant horizontal : sortie horiz puis arrivée verticale
          routeSegs=[[ep.x,ep.y,en.x,ep.y],[en.x,ep.y,en.x,en.y]];
          lblCx=(ep.x+en.x)/2;lblCy=ep.y;lblHoriz=true;
        } else {
          // Radial, dominant vertical : sortie verticale puis arrivée horiz
          routeSegs=[[ep.x,ep.y,ep.x,en.y],[ep.x,en.y,en.x,en.y]];
          lblCx=ep.x;lblCy=(ep.y+en.y)/2;lblHoriz=false;
        }
        // Dessin : halo blanc + trait coloré pour chaque segment
        routeSegs.forEach(function(seg,si){
          var sw=Math.abs(seg[2]-seg[0]),sh=Math.abs(seg[3]-seg[1]);
          if(sw<0.003&&sh<0.003)return;
          var bx=Math.min(seg[0],seg[2]),by=Math.min(seg[1],seg[3]);
          var bw=sw||0.001,bh=sh||0.001;
          var fH=seg[2]<seg[0],fV=seg[3]<seg[1];
          var halo={x:bx,y:by,w:bw,h:bh,line:{color:"FFFFFF",width:lineW+2}};
          if(fH)halo.flipH=true;if(fV)halo.flipV=true;
          synSl.addShape(pres.shapes.LINE,halo);
          var mLine={color:pc,width:lineW};if(isMixed)mLine.dashType="lgDash";
          if(si===routeSegs.length-1){mLine.endArrowType="triangle";mLine.endArrowSize=2;}
          var mOpts={x:bx,y:by,w:bw,h:bh,line:mLine};
          if(fH)mOpts.flipH=true;if(fV)mOpts.flipV=true;
          synSl.addShape(pres.shapes.LINE,mOpts);
        });
        // Point source
        synSl.addShape(pres.shapes.OVAL,{x:ep.x-0.015,y:ep.y-0.015,w:0.03,h:0.03,fill:{color:pc},line:{type:"none"}});
        // Label centré sur le segment principal, décalages perpendiculaires
        var txt5=n===1?(bun.synFlows[0].label||n+" flux"):n+" flux";
        if(txt5){
          var lblW5=Math.min(1.5*fS,(txt5.length*0.042+0.12)*fS);
          var lblH5=0.17*fS;
          var bestLbl=null;
          var perpOff=lblHoriz?[[0,0.20],[0,-0.20],[0,0.40],[0,-0.40],[0,0.60],[0,-0.60],[0,0]]:[[0.20,0],[-0.20,0],[0.40,0],[-0.40,0],[0.60,0],[-0.60,0],[0,0]];
          for(var oi2=0;oi2<perpOff.length;oi2++){
            var clx=lblCx+perpOff[oi2][0]-lblW5/2;
            var cly=lblCy+perpOff[oi2][1]-lblH5/2;
            clx=Math.max(0.04,Math.min(W-lblW5-0.04,clx));
            cly=Math.max(0.04,Math.min(H-lblH5-0.04,cly));
            var clear=true;
            synLR.forEach(function(r){if(!(clx+lblW5<r.x||r.x+r.w<clx||cly+lblH5<r.y||r.y+r.h<cly))clear=false;});
            if(clear){bestLbl={x:clx,y:cly};break;}
          }
          if(!bestLbl)bestLbl={x:Math.max(0.04,Math.min(W-lblW5-0.04,lblCx-lblW5/2)),y:Math.max(0.04,Math.min(H-lblH5-0.04,lblCy-lblH5/2))};
          synLR.push({x:bestLbl.x,y:bestLbl.y,w:lblW5,h:lblH5});
          synSl.addShape(pres.shapes.RECTANGLE,{x:bestLbl.x-0.02,y:bestLbl.y-0.02,w:lblW5+0.04,h:lblH5+0.04,fill:{color:"FFFFFF"},line:{color:pc,width:0.55}});
          synSl.addText(txt5,{x:bestLbl.x,y:bestLbl.y,w:lblW5,h:lblH5,fontSize:Math.round(7*(bun.agg?1:fS)*10)/10,color:"222222",fontFace:"Calibri",margin:0,valign:"middle",shrinkText:true});
        }
      });
      // Apps ON TOP
      synApps.forEach(function(app){
        var p=synPos[app.id];if(!p)return;
        var ac5=(_pDC[app.domain]||_pDC.Autre).ac.replace("#","");
        var dg9=appDeg[app.id]||0;
        var bw9=dg9>=8?1.1:dg9>=3?0.7:0.5;
        var fz9=Math.round((5+(dg9>=8?1:0))*fS*10)/10;
        synSl.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:p.w,h:p.h,fill:{color:"FFFFFF"},line:{color:ac5,width:bw9},shadow:{type:"outer",blur:1,offset:0.3,color:"000000",opacity:0.05,angle:135}});
        synSl.addText(app.name,{x:p.x+0.02,y:p.y,w:p.w-0.04,h:p.h,fontSize:fz9,bold:true,color:"1A1A2E",fontFace:"Calibri",margin:0,valign:"middle",shrinkText:true});
      });
    
      // Mini-légende des conventions (bas-gauche)
      var lgX=0.15,lgY=H-0.42,lgW2=3.6,lgH2=0.32;
      synSl.addShape(pres.shapes.RECTANGLE,{x:lgX,y:lgY,w:lgW2,h:lgH2,fill:{color:"FFFFFF"},line:{color:"E0E3E8",width:0.3}});
      synSl.addShape(pres.shapes.LINE,{x:lgX+0.06,y:lgY+0.09,w:0.22,h:0.001,line:{color:"546E7A",width:1,endArrowType:"triangle",endArrowSize:2}});
      synSl.addText("inter-domaine",{x:lgX+0.31,y:lgY+0.03,w:0.85,h:0.12,fontSize:5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
      synSl.addShape(pres.shapes.LINE,{x:lgX+0.06,y:lgY+0.24,w:0.22,h:0.001,line:{color:"546E7A",width:1,dashType:"sysDot"}});
      synSl.addText("intra / multi-proto",{x:lgX+0.31,y:lgY+0.18,w:0.95,h:0.12,fontSize:5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
      synSl.addShape(pres.shapes.OVAL,{x:lgX+1.32,y:lgY+0.06,w:0.04,h:0.04,fill:{color:"546E7A"},line:{type:"none"}});
      synSl.addText("source",{x:lgX+1.40,y:lgY+0.03,w:0.5,h:0.12,fontSize:5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
      synSl.addShape(pres.shapes.LINE,{x:lgX+1.32,y:lgY+0.26,w:0.14,h:0.001,line:{color:"546E7A",width:2.2}});
      synSl.addText("\u00E9paisseur = volume",{x:lgX+1.50,y:lgY+0.18,w:1.0,h:0.12,fontSize:5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
      synSl.addText("couleur = protocole",{x:lgX+2.45,y:lgY+0.03,w:1.05,h:0.12,fontSize:5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
      synSl.addText("\u201Cn flux\u201D = agr\u00E9g\u00E9",{x:lgX+2.45,y:lgY+0.18,w:1.05,h:0.12,fontSize:5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
      return {sat:_synSatS.v,pos:synPos};
    };
    if(false&&flows.length>0){
      // Slide Synthèse-Cartographie & flux supprimé
      var estCols=0;
      [...new Set(apps.map(function(a){return a.domain;}))].forEach(function(d){
        var n=apps.filter(function(a){return a.domain===d;}).length;
        estCols+=n>8?2:1;
      });
      var estSat=estCols>14;
      if(estSat){
        // Split synthesis: half the domains per slide
        var allD=[...new Set(apps.map(function(a){return a.domain;}))];
        // Sort by app count desc, alternate assignment for balance
        allD.sort(function(a,b){return apps.filter(function(x){return x.domain===b;}).length-apps.filter(function(x){return x.domain===a;}).length;});
        var g1=[],g2=[];
        allD.forEach(function(d,i){(i%2===0?g1:g2).push(d);});
        var grpData=[];
        var mk=function(grp,sfx){
          var gApps=apps.filter(function(a){return grp.indexOf(a.domain)>=0;});
          var gIds=new Set(gApps.map(function(a){return a.id;}));
          var gFlows=flows.filter(function(f){return gIds.has(f.from)&&gIds.has(f.to);});
          if(gApps.length>0){var r=drawSynthSlide(gApps,gFlows,sfx);grpData.push({gApps:gApps,gFlows:gFlows,sfx:sfx,pos:r.pos});}
        };
        mk(g1," (1/2)");
        mk(g2," (2/2)");
      } else {
        drawSynthSlide(apps,flows,"");
      }
      // ── Slide SYNTHÈSE DÉTAILLÉE: same layout, all individual flows (paginated if needed) ──
      var drawDetailedSynth=function(synApps2,synFlows2,sfx2,_hub,_appDeg,_hubDom,_detMode,_posOverride){
        var _synPos=_posOverride||_sharedSynPos;
        var mode=_detMode||"radial";
        // ── Mode byDomain: one slide per satellite domain → hub ──
        if(mode==="byDomain"){
          var satDoms2=[...new Set(synApps2.map(function(a){return a.domain;}))].filter(function(d){return d!==_hubDom.domain;});
          satDoms2.forEach(function(dom){
            var domApps=synApps2.filter(function(a){return a.domain===dom||a.domain===_hubDom.domain;});
            var domIds=new Set(domApps.map(function(a){return a.id;}));
            var domFlows=synFlows2.filter(function(f){return domIds.has(f.from)&&domIds.has(f.to);});
            if(domFlows.length===0)return;
            var dSlide=SS(_addSlide());
            dSlide.background={color:"F5F6FA"};
            var domCC=_pDC[dom]||_pDC.Autre;
            var hubCC=_pDC[_hubDom.domain]||_pDC.Autre;
            dSlide.addText("SYNTH\u00C8SE D\u00C9TAILL\u00C9E \u2014 "+dom.toUpperCase()+" \u2192 "+_hubDom.name.toUpperCase(),{x:0.3,y:0.1,w:9,h:0.4,fontSize:13,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});
            dSlide.addText(domFlows.length+" flux",{x:9.5,y:0.15,w:0.5,h:0.25,fontSize:10,color:domCC.ac.replace("#",""),fontFace:"Calibri",align:"right",margin:0});
            // Layout: dom apps left (col 0-4), hub app right (col 5.5-9.5)
            var leftApps=domApps.filter(function(a){return a.domain===dom;});
            var rightApps=domApps.filter(function(a){return a.domain===_hubDom.domain;});
            var posD={};
            // Left column: domain apps
            var lah=Math.min(0.3,Math.max(0.18,(4.2-leftApps.length*0.06)/leftApps.length));
            var lgap=leftApps.length>1?(4.2-leftApps.length*lah)/(leftApps.length-1):0;
            lgap=Math.min(0.4,Math.max(0.04,lgap));
            leftApps.forEach(function(a,i){
              var ax=0.4,ay=0.65+i*(lah+lgap);
              posD[a.id]={x:ax,y:ay,w:3.5,h:lah,cx:ax+1.75,cy:ay+lah/2};
            });
            // Right column: hub domain apps (hub first)
            var sortedR=[_hubDom].concat(rightApps.filter(function(a){return a.id!==_hubDom.id;}));
            var rah=Math.min(0.3,Math.max(0.18,(4.2-sortedR.length*0.06)/sortedR.length));
            var rgap=sortedR.length>1?(4.2-sortedR.length*rah)/(sortedR.length-1):0;
            rgap=Math.min(0.4,Math.max(0.04,rgap));
            sortedR.forEach(function(a,i){
              var ax=6.1,ay=0.65+i*(rah+rgap);
              posD[a.id]={x:ax,y:ay,w:3.5,h:rah,cx:ax+1.75,cy:ay+rah/2};
            });
            // Domain headers
            dSlide.addShape(pres.shapes.RECTANGLE,{x:0.3,y:0.55,w:3.7,h:0.12,fill:{color:domCC.ac.replace("#","")},line:{type:"none"}});
            dSlide.addText(dom,{x:0.35,y:0.555,w:3.6,h:0.11,fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",margin:0,shrinkText:true});
            dSlide.addShape(pres.shapes.RECTANGLE,{x:6.0,y:0.55,w:3.7,h:0.12,fill:{color:hubCC.ac.replace("#","")},line:{type:"none"}});
            dSlide.addText(_hubDom.domain,{x:6.05,y:0.555,w:3.6,h:0.11,fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",margin:0,shrinkText:true});
            // Flows — L-routing via corridor vertical central
            var lblRects=[];
            var clipPD=function(cx,cy,w,h,tx,ty){var dx=tx-cx,dy=ty-cy;if(Math.abs(dx)<0.01&&Math.abs(dy)<0.01)return{x:cx,y:cy};var sx=Math.abs(dx)>0.01?(w/2)/Math.abs(dx):999,sy=Math.abs(dy)>0.01?(h/2)/Math.abs(dy):999,s=Math.min(sx,sy);return{x:cx+dx*s,y:cy+dy*s};};
            // Corridor vertical au centre entre les deux colonnes (bord droit col gauche=3.9, bord gauche col droite=6.1)
            var corrXD=5.0;
            domFlows.forEach(function(f){
              var A=posD[f.from],B=posD[f.to];if(!A||!B)return;
              var pc=protoColor(f.protocol||"Autre");
              var ep=clipPD(A.cx,A.cy,A.w,A.h,B.cx,B.cy);
              var en=clipPD(B.cx,B.cy,B.w,B.h,A.cx,A.cy);
              // L-routing : 3 segments via corridor vertical
              var dyAbs=Math.abs(en.y-ep.y);
              var segsD;
              if(dyAbs<0.05){
                // Quasi-horizontale : segment direct
                segsD=[[ep.x,ep.y,en.x,en.y]];
              } else {
                segsD=[[ep.x,ep.y,corrXD,ep.y],[corrXD,ep.y,corrXD,en.y],[corrXD,en.y,en.x,en.y]];
              }
              segsD.forEach(function(seg,si){
                var sw=Math.abs(seg[2]-seg[0]),sh=Math.abs(seg[3]-seg[1]);
                if(sw<0.003&&sh<0.003)return;
                var bx=Math.min(seg[0],seg[2]),by=Math.min(seg[1],seg[3]);
                var bw=sw||0.001,bh=sh||0.001;
                var fH=seg[2]<seg[0],fV=seg[3]<seg[1];
                var halo={x:bx,y:by,w:bw,h:bh,line:{color:"F5F6FA",width:2.5}};
                if(fH)halo.flipH=true;if(fV)halo.flipV=true;
                dSlide.addShape(pres.shapes.LINE,halo);
                var mLine={color:pc,width:0.7};
                if(si===segsD.length-1){mLine.endArrowType="triangle";mLine.endArrowSize=3;}
                var mOpts={x:bx,y:by,w:bw,h:bh,line:mLine};
                if(fH)mOpts.flipH=true;if(fV)mOpts.flipV=true;
                dSlide.addShape(pres.shapes.LINE,mOpts);
              });
              dSlide.addShape(pres.shapes.OVAL,{x:ep.x-0.04,y:ep.y-0.04,w:0.08,h:0.08,fill:{color:pc},line:{type:"none"}});
              if(f.label){
                var lw2=Math.min(1.6,f.label.length*0.052+0.12);var lh2=0.19;
                // Label centré sur le segment vertical du corridor
                var lblCyD=(ep.y+en.y)/2;
                var hOffsD=[0,0.18,-0.18,0.36,-0.36,0.54,-0.54,0.72,-0.72];
                var bestD=null;
                for(var oiD=0;oiD<hOffsD.length;oiD++){
                  var clxD=corrXD+hOffsD[oiD]-lw2/2;
                  var clyD=lblCyD-lh2/2;
                  clxD=Math.max(0.05,Math.min(9.9-lw2,clxD));
                  clyD=Math.max(0.50,Math.min(4.85-lh2,clyD));
                  var okD=true;lblRects.forEach(function(r){if(!(clxD+lw2<r.x||r.x+r.w<clxD||clyD+lh2<r.y||r.y+r.h<clyD))okD=false;});
                  if(okD){bestD={x:clxD,y:clyD};break;}
                }
                if(!bestD)bestD={x:Math.max(0.05,Math.min(9.9-lw2,corrXD-lw2/2)),y:Math.max(0.50,Math.min(4.85-lh2,lblCyD-lh2/2))};
                lblRects.push({x:bestD.x,y:bestD.y,w:lw2,h:lh2});
                dSlide.addShape(pres.shapes.RECTANGLE,{x:bestD.x-0.03,y:bestD.y-0.02,w:lw2+0.06,h:lh2+0.04,fill:{color:"FFFFFF"},line:{color:pc,width:0.55}});
                dSlide.addText(f.label,{x:bestD.x,y:bestD.y,w:lw2,h:lh2,fontSize:10,bold:false,color:"333333",fontFace:"Calibri",margin:0,valign:"middle",shrinkText:true});
                if(f.protocol){
                  dSlide.addShape(pres.shapes.RECTANGLE,{x:bestD.x-0.03,y:bestD.y+lh2-0.01,w:Math.min(lw2+0.06,0.55),h:0.13,fill:{color:pc},line:{type:"none"}});
                  dSlide.addText(f.protocol,{x:bestD.x-0.03,y:bestD.y+lh2-0.01,w:Math.min(lw2+0.06,0.55),h:0.13,fontSize:6,color:"FFFFFF",fontFace:"Calibri",bold:true,margin:0,valign:"middle",align:"center"});
                }
              }
            });
            // Apps
            domApps.forEach(function(a){
              var p=posD[a.id];if(!p)return;
              var ac=(_pDC[a.domain]||_pDC.Autre).ac.replace("#","");
              var isHub=a.id===_hubDom.id;
              dSlide.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:p.w,h:p.h,fill:{color:isHub?"FAFEFF":"FFFFFF"},line:{color:ac,width:isHub?1.5:0.7}});
              dSlide.addText(a.name,{x:p.x+0.06,y:p.y,w:p.w-0.12,h:p.h,fontSize:isHub?9:8,bold:isHub,color:"1A1A2E",fontFace:"Calibri",margin:0,valign:"middle",shrinkText:true});
            });
          });
          return;
        }

        var detSlide=_addSlide();
        detSlide.background={color:"F5F6FA"};
        detSlide.addText("SYNTH\u00C8SE D\u00C9TAILL\u00C9E \u2014 FLUX INDIVIDUELS"+(sfx2||""),{x:0.3,y:0.05,w:8,h:0.35,fontSize:13,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});
        detSlide.addText(synApps2.length+" apps \u00B7 "+synFlows2.length+" flux \u00B7 "+[...new Set(synApps2.map(function(a){return a.domain;}))].length+" domaines",{x:8.5,y:0.08,w:4.5,h:0.25,fontSize:6,color:"888888",fontFace:"Calibri",align:"right",margin:0});
        // ① DOMAIN HEADERS — drawn FIRST (behind everything)
        var detDoms=[...new Set(synApps2.map(function(a){return a.domain;}))];
        detDoms.forEach(function(dom){
          var cc7=_pDC[dom]||_pDC.Autre;
          var dminX=Infinity,dmaxX=-Infinity,dminY=Infinity;
          synApps2.forEach(function(a){if(a.domain!==dom)return;var p=_synPos[a.id];if(!p)return;dminX=Math.min(dminX,p.x);dmaxX=Math.max(dmaxX,p.x+p.w);dminY=Math.min(dminY,p.y);});
          if(dminX===Infinity)return;
          var hx=Math.max(0.02,dminX-0.03);
          var hw=Math.min(W-hx-0.02,dmaxX-dminX+0.06);
          var hy=Math.max(0.38,dminY-0.14);
          detSlide.addShape(pres.shapes.RECTANGLE,{x:hx-0.02,y:hy,w:hw+0.04,h:0.11,fill:{color:cc7.ac.replace("#","")},line:{type:"none"}});
          detSlide.addText(dom,{x:hx,y:hy+0.005,w:hw,h:0.10,fontSize:4,bold:true,color:"FFFFFF",fontFace:"Calibri",margin:0,shrinkText:true});
        });
        var clipP2=function(cx5,cy5,w5,h5,tx5,ty5){var dx5=tx5-cx5,dy5=ty5-cy5;if(Math.abs(dx5)<0.01&&Math.abs(dy5)<0.01)return{x:cx5,y:cy5};var sx5=Math.abs(dx5)>0.01?(w5/2)/Math.abs(dx5):999;var sy5=Math.abs(dy5)>0.01?(h5/2)/Math.abs(dy5):999;var s5=Math.min(sx5,sy5);return{x:cx5+dx5*s5,y:cy5+dy5*s5};};
        // ② FLOW LINES — collect data for label pass later
        var flowData=[];
        synFlows2.forEach(function(f){
          var A=_synPos[f.from],B=_synPos[f.to];
          if(!A||!B||A.dom===B.dom)return;
          var pc=protoColor(f.protocol||"Autre");
          var ep=clipP2(A.cx,A.cy,A.w,A.h,B.cx,B.cy);
          var en=clipP2(B.cx,B.cy,B.w,B.h,A.cx,A.cy);
          var lx5=Math.min(ep.x,en.x),ly5=Math.min(ep.y,en.y);
          var lw5=Math.abs(en.x-ep.x)||0.001,lh5=Math.abs(en.y-ep.y)||0.001;
          detSlide.addShape(pres.shapes.LINE,{x:lx5,y:ly5,w:lw5,h:lh5,line:{color:"F5F6FA",width:1.5},flipH:en.x<ep.x,flipV:en.y<ep.y});
          detSlide.addShape(pres.shapes.LINE,{x:lx5,y:ly5,w:lw5,h:lh5,line:{color:pc,width:0.5,endArrowType:"triangle",endArrowSize:2},flipH:en.x<ep.x,flipV:en.y<ep.y});
          detSlide.addShape(pres.shapes.OVAL,{x:ep.x-0.015,y:ep.y-0.015,w:0.03,h:0.03,fill:{color:pc},line:{type:"none"}});
          flowData.push({f:f,ep:ep,en:en,pc:pc});
        });
        // ③ APPS — drawn before labels so labels appear on top
        synApps2.forEach(function(app){
          var p=_synPos[app.id];if(!p)return;
          var ac5=(_pDC[app.domain]||_pDC.Autre).ac.replace("#","");
          var dg9=(_appDeg&&_appDeg[app.id])||0;
          var bw9=dg9>=8?1.1:dg9>=3?0.7:0.5;
          detSlide.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:p.w,h:p.h,fill:{color:"FFFFFF"},line:{color:ac5,width:bw9}});
          detSlide.addText(app.name,{x:p.x+0.02,y:p.y,w:p.w-0.04,h:p.h,fontSize:4.5,bold:true,color:"1A1A2E",fontFace:"Calibri",margin:0,valign:"middle",shrinkText:true});
        });
        // ④ LABELS — drawn LAST, always on top
        // Register app bboxes as obstacles
        var obstacles=[];
        synApps2.forEach(function(app){var p=_synPos[app.id];if(p)obstacles.push({x:p.x,y:p.y,w:p.w,h:p.h});});
        var synLR2=obstacles.slice();
        var overlaps2=function(x,y,w,h){return synLR2.some(function(r){return !(x+w<r.x||r.x+r.w<x||y+h<r.y||r.y+r.h<y);});};
        flowData.forEach(function(fd){
          var txt5=fd.f.label||"";if(!txt5)return;
          var ep=fd.ep,en=fd.en,pc=fd.pc;
          var lblW5=Math.min(1.0,txt5.length*0.022+0.05);
          var lblH5=0.075;
          var dx_l=en.x-ep.x,dy_l=en.y-ep.y,len_l=Math.sqrt(dx_l*dx_l+dy_l*dy_l)||1;
          var px_l=-dy_l/len_l,py_l=dx_l/len_l;
          var best=null;
          var tPos=[0.35,0.5,0.65,0.2,0.8,0.1,0.9];
          var offs=[0.07,-0.07,0.13,-0.13,0.2,-0.2,0.27,-0.27];
          outer2: for(var ti=0;ti<tPos.length;ti++){
            for(var oi=0;oi<offs.length;oi++){
              var lx2=ep.x+dx_l*tPos[ti]+px_l*offs[oi]-lblW5/2;
              var ly2=ep.y+dy_l*tPos[ti]+py_l*offs[oi]-lblH5/2;
              lx2=Math.max(0.04,Math.min(W-lblW5-0.04,lx2));
              ly2=Math.max(0.40,Math.min(H-lblH5-0.06,ly2));
              if(!overlaps2(lx2,ly2,lblW5,lblH5)){best={x:lx2,y:ly2};break outer2;}
            }
          }
          if(!best){best={x:Math.max(0.04,Math.min(W-lblW5-0.04,ep.x+dx_l*0.4+px_l*0.09-lblW5/2)),y:Math.max(0.40,Math.min(H-lblH5-0.06,ep.y+dy_l*0.4+py_l*0.09-lblH5/2))};}
          synLR2.push({x:best.x,y:best.y,w:lblW5,h:lblH5});
          detSlide.addShape(pres.shapes.RECTANGLE,{x:best.x-0.01,y:best.y-0.005,w:lblW5+0.02,h:lblH5+0.01,fill:{color:"FFFFFF"},line:{color:pc,width:0.3}});
          detSlide.addText(txt5,{x:best.x,y:best.y,w:lblW5,h:lblH5,fontSize:4,color:"333333",fontFace:"Calibri",margin:0,valign:"middle",shrinkText:true});
        });
        // ⑤ MINI-LEGEND
        var lgX2=0.15,lgY2=H-0.42;
        detSlide.addShape(pres.shapes.RECTANGLE,{x:lgX2,y:lgY2,w:3.6,h:0.32,fill:{color:"FFFFFF"},line:{color:"E0E3E8",width:0.3}});
        detSlide.addShape(pres.shapes.LINE,{x:lgX2+0.06,y:lgY2+0.09,w:0.22,h:0.001,line:{color:"546E7A",width:1,endArrowType:"triangle",endArrowSize:2}});
        detSlide.addText("flux individuel",{x:lgX2+0.31,y:lgY2+0.03,w:1.0,h:0.12,fontSize:4.5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
        detSlide.addShape(pres.shapes.OVAL,{x:lgX2+1.32,y:lgY2+0.06,w:0.04,h:0.04,fill:{color:"546E7A"},line:{type:"none"}});
        detSlide.addText("source",{x:lgX2+1.40,y:lgY2+0.03,w:0.5,h:0.12,fontSize:4.5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
        detSlide.addText("couleur = protocole",{x:lgX2+2.45,y:lgY2+0.03,w:1.05,h:0.12,fontSize:4.5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
        detSlide.addText("label = nom du flux",{x:lgX2+2.45,y:lgY2+0.18,w:1.05,h:0.12,fontSize:4.5,color:"555555",fontFace:"Calibri",margin:0,valign:"middle"});
      };
      // Call detailed synth — reuses synPos from last drawSynthSlide call
      // Re-compute outer-scope vars needed by drawDetailedSynth
      if(flows.length>0&&_opts.synthDetail!=="none"){
        var _outerAppDeg={};
        apps.forEach(function(a){_outerAppDeg[a.id]=0;});
        flows.forEach(function(f){_outerAppDeg[f.from]=(_outerAppDeg[f.from]||0)+1;_outerAppDeg[f.to]=(_outerAppDeg[f.to]||0)+1;});
        var _outerHub=apps.reduce(function(best,a){return(_outerAppDeg[a.id]||0)>(_outerAppDeg[best.id]||0)?a:best;},apps[0]);
        var _outerHubFlows=flows.filter(function(f){return f.from===_outerHub.id||f.to===_outerHub.id;}).length;
        var _outerHubDominant=_outerHubFlows>flows.length*0.4;
        if(estSat&&grpData.length>0){
          grpData.forEach(function(gd){
            var gdeg={};gd.gApps.forEach(function(a){gdeg[a.id]=0;});gd.gFlows.forEach(function(f){gdeg[f.from]=(gdeg[f.from]||0)+1;gdeg[f.to]=(gdeg[f.to]||0)+1;});
            var ghub=gd.gApps.reduce(function(best,a){return(gdeg[a.id]||0)>(gdeg[best.id]||0)?a:best;},gd.gApps[0]);
            drawDetailedSynth(gd.gApps,gd.gFlows,gd.sfx,ghub,gdeg,ghub,_opts.synthDetail,gd.pos);
          });
        } else {
          drawDetailedSynth(apps,flows,"",_outerHub,_outerAppDeg,_outerHub,_opts.synthDetail);
        }
      }
    }

    // ── Slide 2: Vue agrégée domaine→domaine ──
    if(_opts.inclAggregated&&flows.length>0) drawDomainFlowSlide("FLUX — VUE AGR\u00C9G\u00C9E PAR DOMAINE",apps,flows);

    // ── Slides 3+: Hub-based cluster splitting ──
    if(_opts.inclHubSlides&&flows.length>0){
      var clusterOf={};
      apps.forEach(function(a){clusterOf[a.id]=a.id;});
      var findRoot=function(id){while(clusterOf[id]!==id)id=clusterOf[id];return id;};
      var merge2=function(a,b){var ra=findRoot(a),rb=findRoot(b);if(ra!==rb)clusterOf[ra]=rb;};
      flows.forEach(function(f){merge2(f.from,f.to);});
      var clusters={};
      apps.forEach(function(a){var root=findRoot(a.id);if(!clusters[root])clusters[root]=[];clusters[root].push(a);});
      var clusterList=Object.values(clusters).sort(function(a,b){return b.length-a.length;});

      clusterList.forEach(function(cApps){
        var cIds=new Set(cApps.map(function(a){return a.id;}));
        var cFlows=flows.filter(function(f){return cIds.has(f.from)&&cIds.has(f.to);});
        if(cFlows.length===0&&cApps.length<=2)return;
        if(cFlows.length<=MFS){
          var d2=[...new Set(cApps.map(function(a){return a.domain;}))].join(" / ");
          drawCartoSlide("CARTOGRAPHIE — "+d2,cApps,cFlows,true);
          return;
        }
        // Find hub
        var hubDeg={};
        cFlows.forEach(function(f){hubDeg[f.from]=(hubDeg[f.from]||0)+1;hubDeg[f.to]=(hubDeg[f.to]||0)+1;});
        var hubApp=cApps.reduce(function(best,a){return(hubDeg[a.id]||0)>(hubDeg[best.id]||0)?a:best;},cApps[0]);
        var hubFlows=cFlows.filter(function(f){return f.from===hubApp.id||f.to===hubApp.id;});
        var usedIds=new Set();
        // Hub pages
        for(var hi=0;hi<hubFlows.length;hi+=MFS){
          var batch=hubFlows.slice(hi,hi+MFS);
          var bIds=new Set();batch.forEach(function(f){bIds.add(f.from);bIds.add(f.to);});
          var bApps=cApps.filter(function(a){return bIds.has(a.id);});
          var pg=Math.floor(hi/MFS)+1,tot=Math.ceil(hubFlows.length/MFS);
          drawCartoSlide("FLUX "+hubApp.name.toUpperCase()+(tot>1?" ("+pg+"/"+tot+")":""),bApps,batch,true);
          batch.forEach(function(f){usedIds.add(f.id);});
        }
        // Remaining non-hub flows
        var rest=cFlows.filter(function(f){return!usedIds.has(f.id);});
        for(var ri=0;ri<rest.length;ri+=MFS){
          var batch2=rest.slice(ri,ri+MFS);
          var bIds2=new Set();batch2.forEach(function(f){bIds2.add(f.from);bIds2.add(f.to);});
          var bApps2=cApps.filter(function(a){return bIds2.has(a.id);});
          var d3=[...new Set(bApps2.map(function(a){return a.domain;}))].join(", ");
          drawCartoSlide("CARTOGRAPHIE "+d3,bApps2,batch2,true);
        }
      });
    }

    // ── Focus domaine (paginé) ──
    if(_opts.inclFocusDomain){
    [...new Set(apps.map(a=>a.domain))].forEach(dom=>{
      const inApps=apps.filter(a=>a.domain===dom);
      if(inApps.length===0)return;
      const neighIds=new Set();
      flows.forEach(f=>{
        const fa=apps.find(a=>a.id===f.from),ta=apps.find(a=>a.id===f.to);
        if(!fa||!ta)return;
        if(fa.domain===dom)neighIds.add(ta.id);
        if(ta.domain===dom)neighIds.add(fa.id);
      });
      const subset=apps.filter(a=>a.domain===dom||neighIds.has(a.id));
      const subFlows=flows.filter(f=>{
        const fa=apps.find(a=>a.id===f.from),ta=apps.find(a=>a.id===f.to);
        return fa&&ta&&(fa.domain===dom||ta.domain===dom);
      });
      if(subFlows.length===0)return;
      if(subFlows.length<=MFS){drawCartoSlide("FOCUS "+dom.toUpperCase(),subset,subFlows,true);return;}
      // Paginate: batch all flows by MFS
      for(var fi=0;fi<subFlows.length;fi+=MFS){
        var batch3=subFlows.slice(fi,fi+MFS);
        var bIds3=new Set();batch3.forEach(function(f){bIds3.add(f.from);bIds3.add(f.to);});
        var bApps3=apps.filter(function(a){return bIds3.has(a.id);});
        var pg3=Math.floor(fi/MFS)+1,tot3=Math.ceil(subFlows.length/MFS);
        drawCartoSlide("FOCUS "+dom.toUpperCase()+" ("+pg3+"/"+tot3+")",bApps3,batch3,true);
      }
    });

    }// end inclFocusDomain
    if(false){// Vue d'ensemble KPIs supprimée
    // ─── Slide 2: Vue d'ensemble KPIs ───
    const s2=SS(_addSlide());
    s2.background={color:"F5F6FA"};
    s2.addText("Vue d'ensemble",{x:0.6,y:0.3,w:8,h:0.6,fontSize:28,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});
    const kpis=[{l:"Applications",v:apps.length,c:"548CA8"},{l:"Domaines",v:doms.length,c:"9D4EDD"},{l:"Interfaces",v:flows.length,c:"52B788"},{l:"Apps critiques",v:apps.filter(a=>a.criticality==="Haute").length,c:"E06C75"}];
    kpis.forEach((k,i)=>{
      const kx=0.5+i*2.35;
      s2.addShape(pres.shapes.RECTANGLE,{x:kx,y:1.1,w:2.1,h:1.2,fill:{color:"FFFFFF"},shadow:mkSh()});
      s2.addShape(pres.shapes.RECTANGLE,{x:kx,y:1.1,w:0.06,h:1.2,fill:{color:k.c}});
      s2.addText(String(k.v),{x:kx+0.2,y:1.15,w:1.7,h:0.7,fontSize:32,bold:true,color:k.c,fontFace:"Trebuchet MS",margin:0});
      s2.addText(k.l,{x:kx+0.2,y:1.8,w:1.7,h:0.4,fontSize:10,color:"666666",fontFace:"Calibri",margin:0});
    });

    // Domain breakdown table
    const domStats=doms.map(d=>({d,n:apps.filter(a=>a.domain===d).length,c:apps.filter(a=>a.domain===d&&a.criticality==="Haute").length,f:flows.filter(f=>{const fa=apps.find(a=>a.id===f.from);return fa?.domain===d;}).length}));
    const tblH=[[{text:"Domaine",options:{bold:true,fill:{color:"0B2545"},color:"FFFFFF",fontSize:10}},{text:"Apps",options:{bold:true,fill:{color:"0B2545"},color:"FFFFFF",fontSize:10,align:"center"}},{text:"Critiques",options:{bold:true,fill:{color:"0B2545"},color:"FFFFFF",fontSize:10,align:"center"}},{text:"Flux sortants",options:{bold:true,fill:{color:"0B2545"},color:"FFFFFF",fontSize:10,align:"center"}}]];
    const tblR=domStats.sort((a,b)=>b.n-a.n).map(d=>[{text:d.d,options:{fontSize:10,color:"333333"}},{text:String(d.n),options:{fontSize:10,align:"center"}},{text:String(d.c),options:{fontSize:10,align:"center",color:d.c>0?"E06C75":"999999"}},{text:String(d.f),options:{fontSize:10,align:"center"}}]);
    s2.addTable([...tblH,...tblR],{x:0.5,y:2.6,w:9,colW:[3,2,2,2],border:{pt:0.5,color:"DDDDDD"},rowH:0.35});

    }// end inclKPI
    // ─── Final slide: Matrice des flux ───
    const sf=SS(_addSlide());
    sf.background={color:"F5F6FA"};
    sf.addText("Matrice des interfaces inter-domaines",{x:0.6,y:0.3,w:8,h:0.6,fontSize:24,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});
    const mtx={};flows.forEach(f=>{const fd=apps.find(a=>a.id===f.from)?.domain,td=apps.find(a=>a.id===f.to)?.domain;if(fd&&td)mtx[fd+"→"+td]=(mtx[fd+"→"+td]||0)+1;});
    const mHdr=[{text:"",options:{fill:{color:"0B2545"},fontSize:8}},...doms.map(d=>({text:d,options:{fill:{color:"0B2545"},color:"FFFFFF",fontSize:10,bold:true,align:"center"}}))];
    const mRows=doms.map(fr=>[{text:fr,options:{fontSize:10,bold:true,color:(_pDC[fr]||_pDC.Autre).ac.replace("#","")}},...doms.map(to=>{const v=mtx[fr+"→"+to]||0;return {text:v?String(v):"—",options:{fontSize:10,align:"center",color:v?"1a1a1a":"CCCCCC",fill:v?{color:(_pDC[fr]||_pDC.Autre).ac.replace("#",""),transparency:85}:{color:"FFFFFF"}}};})]);
    const cw=doms.length>0?(8.5/(doms.length+1)):1;
    sf.addTable([mHdr,...mRows],{x:0.5,y:1.1,w:9,colW:Array(doms.length+1).fill(cw),border:{pt:0.5,color:"DDDDDD"},rowH:0.32});


    // ── Récapitulatif des applications (paginé) — avant le récap flux ──
    if(_opts.inclRecapTable){
      (function drawAppRecapSlides(){
        const ROWS_PER_SLIDE=22;
        const SD1C={"Transfert TSA":"F59E0B","Maintien":"10B981","Rebuild":"6366F1","Abandon":"EF4444"};
        const SD2C={"Clone & Clean":"3B82F6","Transfert":"10B981","Abandon":"EF4444","Rebuild":"8B5CF6"};
        const sortedApps=[...apps].sort(function(a,b){
          if(a.domain!==b.domain)return a.domain.localeCompare(b.domain);
          return a.name.localeCompare(b.name);
        });
        if(sortedApps.length===0)return;
        const totalPages=Math.ceil(sortedApps.length/ROWS_PER_SLIDE);
        for(var page=0;page<totalPages;page++){
          var sA=_addSlide();
          sA.background={color:"FFFFFF"};
          var suffix=totalPages>1?" ("+(page+1)+"/"+totalPages+")":"";
          sA.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:13.333,h:0.55,fill:{color:cp||"0B2545"},line:{type:"none"}});
          sA.addText("RÉCAPITULATIF DES APPLICATIONS"+suffix,{x:0.3,y:0.10,w:12,h:0.35,fontSize:14,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
          var pageApps=sortedApps.slice(page*ROWS_PER_SLIDE,(page+1)*ROWS_PER_SLIDE);
          var hdr=function(txt){return {text:txt,options:{bold:true,fill:{color:"1E293B"},color:"FFFFFF",fontSize:9,fontFace:"Calibri",valign:"middle"}};};
          var header=projectType==='deal'
            ?[[hdr("Domaine"),hdr("Application"),hdr("Statut Day 1"),hdr("Statut Day 2")]]
            :[[hdr("Domaine"),hdr("Application"),hdr("Statut")]];
          var tblRows=pageApps.map(function(app,ri){
            var d1c=SD1C[app.statusD1]||null;
            var d2c=SD2C[app.statusD2]||null;
            var statC=STATUT_COLORS[app.statut]||null;
            var rowBg=ri%2===0?"FFFFFF":"F8FAFC";
            var domColor=(_pDC[app.domain]||_pDC.Autre).ac.replace("#","");
            var cell=function(txt,extra){return {text:txt,options:Object.assign({fontSize:9,fontFace:"Calibri",valign:"middle",fill:{color:rowBg},color:"1E293B"},extra||{})};};
            return projectType==='deal'
              ?[cell(app.domain,{color:domColor,bold:true}),
                cell(app.name,{bold:true}),
                cell(app.statusD1||"—",d1c?{bold:true,color:d1c}:{color:"9CA3AF"}),
                cell(app.statusD2||"—",d2c?{bold:true,color:d2c}:{color:"9CA3AF"})]
              :[cell(app.domain,{color:domColor,bold:true}),
                cell(app.name,{bold:true}),
                cell(app.statut||"—",statC?{bold:true,color:statC.replace("#","")}:{color:"9CA3AF"})];
          });
          sA.addTable([...header,...tblRows],{x:0.25,y:0.65,w:12.83,colW:projectType==='deal'?[2.80,6.10,1.97,1.96]:[3.30,7.20,2.33],border:{pt:0.4,color:"E2E8F0"},rowH:0.32});
          sA.addText(sortedApps.length+" applications · "+doms.length+" domaines",{x:0.25,y:7.30,w:12.83,h:0.18,fontSize:7,color:"94A3B8",fontFace:"Calibri",margin:0,italic:true,align:"center"});
        }
      })();
      drawRecapTableSlides();
    }
    if(_opts.inclLegend){
    // ─── Slide Légende ───
    const sLeg=SS(_addSlide());
    sLeg.background={color:"F5F6FA"};
    sLeg.addText("Légende",{x:0.6,y:0.3,w:4,h:0.5,fontSize:24,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});

    // Criticité
    sLeg.addText("CRITICITÉ",{x:0.6,y:1.0,w:3,h:0.3,fontSize:10,bold:true,color:"0B2545",fontFace:"Calibri",margin:0});
    [["Haute","E06C75"],["Moyenne","D4A017"],["Basse","52B788"]].forEach(([l,c],i)=>{
      sLeg.addShape(pres.shapes.RECTANGLE,{x:0.6,y:1.35+i*0.35,w:0.3,h:0.2,fill:{color:c}});
      sLeg.addText(l,{x:1.0,y:1.35+i*0.35,w:2,h:0.2,fontSize:10,color:"333333",fontFace:"Calibri",margin:0});
    });

    // Domaines
    sLeg.addText("DOMAINES",{x:6.5,y:1.0,w:3,h:0.3,fontSize:10,bold:true,color:"0B2545",fontFace:"Calibri",margin:0});
    Object.entries(_pDC).forEach(([d,c],i)=>{
      if(i>9) return;
      const row=i%5,col=Math.floor(i/5);
      sLeg.addShape(pres.shapes.RECTANGLE,{x:6.2+col*1.6,y:1.35+row*0.35,w:0.25,h:0.2,fill:{color:c.ac.replace("#","")}});
      sLeg.addText(d,{x:6.55+col*1.6,y:1.35+row*0.35,w:1.4,h:0.2,fontSize:11,color:"333333",fontFace:"Calibri",margin:0});
    });

    // Couches
    sLeg.addText("COUCHES D'URBANISATION",{x:0.6,y:3.0,w:4,h:0.3,fontSize:10,bold:true,color:"0B2545",fontFace:"Calibri",margin:0});
    [["Couche Front","Interactions clients & partenaires (CRM, Marketing)","E06C75"],
     ["Couche Métier","Cœur opérationnel (ERP, RH, Production, Logistique)","D4A017"],
     ["Couche Support","Outils transverses & pilotage (IT, BI, Juridique)","548CA8"]].forEach(([l,d,c],i)=>{
      sLeg.addShape(pres.shapes.RECTANGLE,{x:0.6,y:3.4+i*0.4,w:0.04,h:0.25,fill:{color:c}});
      sLeg.addText(l,{x:0.75,y:3.4+i*0.4,w:2,h:0.25,fontSize:10,bold:true,color:c,fontFace:"Calibri",margin:0});
      sLeg.addText(d,{x:2.8,y:3.4+i*0.4,w:5,h:0.25,fontSize:11,color:"666666",fontFace:"Calibri",margin:0});
    });

    // Flux
    sLeg.addText("FLUX / INTERFACES",{x:0.6,y:4.6,w:4,h:0.3,fontSize:10,bold:true,color:"0B2545",fontFace:"Calibri",margin:0});
    sLeg.addShape(pres.shapes.LINE,{x:0.6,y:5.05,w:1.2,h:0,line:{color:"548CA8",width:1,dashType:"dash"}});
    sLeg.addText("Flux faible (1-2)",{x:2.0,y:4.95,w:2,h:0.2,fontSize:11,color:"666666",fontFace:"Calibri",margin:0});
    sLeg.addShape(pres.shapes.LINE,{x:0.6,y:5.3,w:1.2,h:0,line:{color:"548CA8",width:2.5,dashType:"solid"}});
    sLeg.addText("Flux dense (3+)",{x:2.0,y:5.2,w:2,h:0.2,fontSize:11,color:"666666",fontFace:"Calibri",margin:0});

    }// end inclLegend

    // Tamponner le logo en dernier sur chaque slide (au-dessus de tout le contenu)
    if(_opts.clientLogo){
      _allSlides.forEach(function(sld){
        sld.addImage({data:_opts.clientLogo,x:12.10,y:0.06,w:1.00,h:0.46,sizing:{type:"contain",w:1.00,h:0.46}});
      });
    }
    pres.writeFile({fileName:"Cartographie_Applicative.pptx"});
  };

  const filtered=useMemo(()=>{let r=apps;if(selDom.length)r=r.filter(a=>selDom.includes(a.domain));if(selCat.length)r=r.filter(a=>selCat.includes(a.category||""));if(selCrit.length)r=r.filter(a=>selCrit.includes(a.criticality));if(projectType==='deal'){if(selD1)r=r.filter(a=>a.statusD1===selD1);if(selD2)r=r.filter(a=>a.statusD2===selD2);}else{if(selStatut)r=r.filter(a=>a.statut===selStatut);if(selHost.length)r=r.filter(a=>selHost.includes(a.hosting||""));if(selAType.length)r=r.filter(a=>selAType.includes(a.appType||""));if(selEos.length)r=r.filter(a=>selEos.includes(eosBucket(a.endOfService)));}if(search){const s=search.toLowerCase();r=r.filter(a=>a.name.toLowerCase().includes(s)||a.domain.toLowerCase().includes(s)||(a.vendor||"").toLowerCase().includes(s));}return r;},[apps,selDom,selCat,selCrit,selD1,selD2,selStatut,selHost,selAType,selEos,projectType,search]);
  const activeFilters=(selDom.length+selCat.length+selCrit.length+selHost.length+selAType.length+selEos.length)>0;
  const cats=[...new Set(apps.map(a=>a.category).filter(Boolean))];
  const doms=[...new Set(apps.map(a=>a.domain))];

  /* ── Components ── */
  const AW_BASE=220,AH_BASE=84;
  const fs=fontScale;
  const AW=Math.round(AW_BASE*globalScale*Math.max(0.7,fs)),AH=Math.round(AH_BASE*globalScale*Math.max(0.7,fs));
  const domSc=(d)=>(domScales[d]||1)*globalScale;
  const AppNode=({app})=>{const c=DC[app.domain]||DC.Autre;const sel=selApp?.id===app.id;
    const msel=multiSel.includes(app.id);
    const crC=CC[app.criticality]||"#999";
    // En mode jour, les tuiles ne réutilisent plus le fond sombre pensé pour le mode nuit —
    // fond pastel translucide de l'accent + texte de l'accent lui-même (meilleure cohérence visuelle).
    const cardBg=isDark?"linear-gradient(135deg,"+c.bg+", "+T.bgCard+" 170%)":sel?"linear-gradient(135deg,#FFFFFF,"+c.ac+"1C 165%)":"linear-gradient(145deg,#FBFCFF,"+c.ac+"12 72%, #F6F8FC)";
    const cardFgLight=accentTextForLight(c.ac);
    const cardFg=isDark?c.fg:cardFgLight;
    const cardFgSub=isDark?c.fg+"99":cardFgLight+"B0";
    // D1-driven color: if D1 is set, use D1 color for border/bandeau; else domain color
    const d1C=app.statusD1?(SD1[app.statusD1]||"#888"):null;
    const statutC=app.statut?(STATUT_COLORS[app.statut]||"#888"):null;
    const effectiveColor=projectType==='deal'?d1C:statutC;
    const cardColor=effectiveColor||c.ac; // status color > domain accent
    const isNeg=app.statusD1==="Abandon"||(app.statusD2==="Abandon"&&!app.statusD1);
    const ds=domScales[app.domain]||1;
    const fsD=fs*ds;
    const aw=Math.round(AW_BASE*globalScale*ds*Math.max(0.7,fs)),ah=Math.round(AH_BASE*globalScale*ds*Math.max(0.7,fs));
    var isFocusTarget=flowDisplayMode==="static"||!focusApp||focusApp===app.id||flows.some(function(f){return(f.from===focusApp&&f.to===app.id)||(f.to===focusApp&&f.from===app.id);});
    var dimmed=flowDisplayMode!=="static"&&focusApp&&!isFocusTarget;
    var appOpacity=dimmed?(isDark?0.48:0.70):isNeg?0.72:1;
    // D1 tint overlay on card background
    var d1BgTint=app.statusD1==="Abandon"?"#EF444412":app.statusD1==="Transfert TSA"?"#F59E0B0E":null;
    var crLabel=app.criticality==="Haute"?"●":app.criticality==="Basse"?"○":"◐";
    var appGlow=highlightApps?Math.round(highlightStrength*0.55):0;
    return <div style={{position:"absolute",left:app.x,top:app.y,width:aw,height:ah,background:cardBg,border:`${msel?"2.5px":"1.5px"} solid ${msel?"#4ECDC4":sel?T.accent:cardColor+"88"}`,borderRadius:10,cursor:cMode?"crosshair":selMode?"pointer":msel?"move":"grab",boxShadow:msel?"0 0 16px #4ECDC480":sel?`0 0 18px ${cardColor}80`:appGlow?`0 3px 10px ${cardColor}${Math.min(99,Math.round(appGlow*0.45)).toString(16).padStart(2,"0")}, 0 0 ${appGlow}px ${cardColor}${Math.min(99,Math.round(appGlow*0.25)).toString(16).padStart(2,"0")}`:isDark?"0 9px 22px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045)":"0 7px 18px rgba(15,23,42,0.12)",userSelect:"none",zIndex:sel?10:1,overflow:"hidden",opacity:appOpacity,transform:"translateZ(0)",transition:"opacity 0.15s, box-shadow 0.2s, border-color 0.2s, transform 0.16s cubic-bezier(.2,.8,.2,1)"}}
      data-app="1" className="app-card"
      onContextMenu={function(e){e.preventDefault();e.stopPropagation();setCtxMenu({x:e.clientX,y:e.clientY,type:"app",target:app.id});}}
      onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-2px) scale(1.025)";e.currentTarget.style.zIndex="20";e.currentTarget.style.boxShadow="0 12px 28px "+cardColor+"55, 0 0 0 1px "+cardColor+"55";setFlowSuppressed(false);if(flowDisplayMode==="dynamic"&&!drag&&!cMode&&!selMode){setFocusApp(app.id);if(selFlow)setSelFlow(null);}}}
      onMouseLeave={function(e){e.currentTarget.style.transform="translateZ(0)";e.currentTarget.style.zIndex=sel?"10":"1";if(!sel&&!msel)e.currentTarget.style.boxShadow=isDark?"0 9px 22px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045)":"0 7px 18px rgba(15,23,42,0.12)";if(flowDisplayMode==="dynamic"&&focusApp===app.id&&selApp?.id!==app.id)setFocusApp(null);}}
      onMouseDown={e=>{e.stopPropagation();if(cMode){if(!fFrom)setFFrom(app.id);else if(fFrom!==app.id){const nf={id:uid(),from:fFrom,to:app.id,protocol:"API",label:"",description:"",frequency:""};setFlows(p=>[...p,nf]);setEFlow({...nf});setShowFM(true);setFFrom(null);setCMode(false);}return;}if(e.shiftKey){setMultiSel(p=>p.includes(app.id)?p.filter(x=>x!==app.id):[...p,app.id]);return;}
        setMultiSel([]);setSelApp(app);setFocusApp(app.id);setSelFlow(null);setFlowSuppressed(false);const rect=e.currentTarget.getBoundingClientRect();startDrag({id:app.id,ox:e.clientX-rect.left,oy:e.clientY-rect.top});}}
      onDoubleClick={()=>{setEApp({...app});setShowAM(true);}}>

      {/* D1 tint overlay */}
      {d1BgTint&&<div style={{position:"absolute",inset:0,background:d1BgTint,pointerEvents:"none",zIndex:0}}/>}
      <div aria-hidden="true" style={{position:"absolute",left:0,top:0,bottom:app.statusD1||app.statut?Math.max(7,Math.round(7*fsD)):0,width:4,background:cardColor,opacity:0.92,pointerEvents:"none",zIndex:1}}/>

      {/* D1/Statut bandeau bas */}
      {projectType==='deal'?
        (app.statusD1&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:Math.max(10,Math.round(9*fsD)),background:d1C,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>
          <span style={{fontSize:Math.max(7,Math.round(6*fsD*appFontScale)),color:"#fff",fontWeight:800,letterSpacing:0.5,textTransform:"uppercase",opacity:0.97}}>{app.statusD1==="Transfert TSA"?"TSA":app.statusD1}</span>
        </div>)
        :(app.statut&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:Math.max(10,Math.round(9*fsD)),background:statutC,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>
          <span style={{fontSize:Math.max(7,Math.round(6*fsD*appFontScale)),color:"#fff",fontWeight:800,letterSpacing:0.5,textTransform:"uppercase",opacity:0.97}}>{app.statut}</span>
        </div>)
      }



      {/* Content */}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 8px 0 12px",height:"100%",position:"relative",zIndex:1}}>
        <div style={{overflow:"hidden",flex:1,minWidth:0}}>
          <div style={{color:cardFg,fontSize:Math.round(15*fsD*appFontScale),fontWeight:900,lineHeight:1.12,letterSpacing:"-0.025em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textDecoration:isNeg?"line-through":"none"}}>{app.name}</div>
          <div style={{color:cardFgSub,fontSize:Math.round(11*fsD*appFontScale),fontWeight:600,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{app.vendor||app.category||""}</div>
          {projectType==='deal'?(app.statusD1||app.statusD2)&&<div style={{display:"flex",gap:3,marginTop:2,overflow:"hidden"}}>
            {app.statusD2&&<span style={{fontSize:Math.round(8*fsD*appFontScale),background:(SD2[app.statusD2]||"#3B82F6")+"28",color:SD2[app.statusD2]||"#3B82F6",border:"1px solid "+((SD2[app.statusD2]||"#3B82F6")+"66"),borderRadius:4,padding:"1px 5px",fontWeight:800,lineHeight:1.35,flexShrink:0,whiteSpace:"nowrap"}}>{"D2 · "+(app.statusD2==="Clone & Clean"?"Clone":app.statusD2)}</span>}
          </div>:null}
        </div>
        <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
          <span style={{color:crC,fontSize:Math.round(15*fsD*appFontScale),lineHeight:1}}>{crLabel}</span>
          <span style={{fontSize:Math.round(9*fsD*appFontScale),color:crC,fontWeight:850,lineHeight:1,whiteSpace:"nowrap"}}>{app.criticality==="Standalone temporaire"?"Stand.":app.criticality}</span>
        </div>
      </div>
    </div>;
  };
  const FlowLines=()=>{
    const staticMode=flowDisplayMode==="static";
    if(flowSuppressed)return null;
    if(!staticMode&&!focusApp&&!flowDomFilter)return null;
    var visFlows=flows;
    if(flowDomFilter){visFlows=visFlows.filter(function(f){var fa=apps.find(function(a){return a.id===f.from;});var ta=apps.find(function(a){return a.id===f.to;});return(fa&&fa.domain===flowDomFilter)||(ta&&ta.domain===flowDomFilter);});}
    if(!staticMode&&focusApp){visFlows=visFlows.filter(function(f){return f.from===focusApp||f.to===focusApp;});}
    if(selFlow){visFlows=visFlows.filter(function(f){return f.id===selFlow;});}
    if(visFlows.length===0)return null;
    var defCol=staticMode?(isDark?"#B9C4FF":"#334155"):(isDark?"#548CA8":"#3D7A9E");
    var lineCol=flowColorCustom||defCol;
    var dashVal=flowDash==="dashed"?"8 4":flowDash==="dotted"?"3 3":"none";
    var domainFlowCounts={};
    visFlows.forEach(function(f){var fa=apps.find(function(a){return a.id===f.from;}),ta=apps.find(function(a){return a.id===f.to;});if(fa&&ta){domainFlowCounts[fa.domain]=(domainFlowCounts[fa.domain]||0)+1;domainFlowCounts[ta.domain]=(domainFlowCounts[ta.domain]||0)+1;}});
    var hubDomain=Object.keys(domainFlowCounts).sort(function(a,b){return domainFlowCounts[b]-domainFlowCounts[a];})[0]||"";
    var laneGroups={};
    visFlows.forEach(function(f){var key=[f.from,f.to].sort().join("\x00");(laneGroups[key]=laneGroups[key]||[]).push(f);});
    var laneById={};
    Object.values(laneGroups).forEach(function(group){group.forEach(function(f,i){laneById[f.id]=i-(group.length-1)/2;});});
    var clip=function(cx2,cy2,w,h,tx,ty){var ddx=tx-cx2,ddy=ty-cy2;if(Math.abs(ddx)<0.5&&Math.abs(ddy)<0.5)return{x:cx2,y:cy2};var sx2=Math.abs(ddx)>0.5?(w/2)/Math.abs(ddx):9999;var sy2=Math.abs(ddy)>0.5?(h/2)/Math.abs(ddy):9999;var s=Math.min(sx2,sy2);return{x:cx2+ddx*s,y:cy2+ddy*s};};
        return <svg className="flow-layer" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
          {visFlows.map(function(f,flowIndex){var fa=apps.find(function(a){return a.id===f.from;}),ta=apps.find(function(a){return a.id===f.to;});if(!fa||!ta)return null;
            var flowColor=focusApp===f.from?"#34D399":focusApp===f.to?"#38BDF8":lineCol;
            var flowIsSelected=selFlow===f.id;
            var flowOpacity=selFlow?(flowIsSelected?1:0.07):staticMode?0.82:0.65;
            var flowLabelOpacity=selFlow?(flowIsSelected?1:0.10):1;
            var arrowId="ah-"+String(f.id).replace(/[^a-zA-Z0-9_-]/g,"");
            var aw=AW_BASE*globalScale*(domScales[fa.domain]||1)*Math.max(0.7,fontScale),ah=AH_BASE*globalScale*(domScales[fa.domain]||1)*Math.max(0.7,fontScale);
            var bw=AW_BASE*globalScale*(domScales[ta.domain]||1)*Math.max(0.7,fontScale),bh=AH_BASE*globalScale*(domScales[ta.domain]||1)*Math.max(0.7,fontScale);
            var x1=fa.x+aw/2,y1=fa.y+ah/2,x2=ta.x+bw/2,y2=ta.y+bh/2;
            var ep=clip(x1,y1,aw,ah,x2,y2);
            var en=clip(x2,y2,bw,bh,x1,y1);
        var dx=en.x-ep.x,dy=en.y-ep.y,len=Math.max(1,Math.hypot(dx,dy));
        var lane=staticMode?(laneById[f.id]||0)*Math.max(18,flowFontSize*2.1)/Math.max(0.08,zm):0;
        var mx=(ep.x+en.x)/2-(dy/len)*lane,my=(ep.y+en.y)/2+(dx/len)*lane-(staticMode?28:20);
        var pathD="M"+ep.x+" "+ep.y+" Q"+mx+" "+my+" "+en.x+" "+en.y;
        var labelT=staticMode&&fa.domain!==ta.domain?(fa.domain===hubDomain?0.72:ta.domain===hubDomain?0.28:0.5):0.5;
        var labelX=ep.x+dx*labelT-(dy/len)*lane,labelY=ep.y+dy*labelT+(dx/len)*lane-(staticMode?14:0);
        var txt=[f.label,f.protocol].filter(Boolean).join(" · ")||(staticMode?"Flux":"");
        var labelFont=Math.max(10,flowFontSize);
        var lblW=Math.max(60,txt.length*labelFont*0.55+16);
        return <g key={f.id}>
          <defs><marker id={arrowId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" fill={flowColor}><polygon points="0 0,10 3.5,0 7"/></marker></defs>
          <path d={pathD} stroke="transparent" strokeWidth={Math.max(16,flowThickness*4)} fill="none" style={{cursor:"pointer",pointerEvents:"stroke"}}
            onClick={function(e){e.stopPropagation();setFlowSuppressed(false);setSelFlow(selFlow===f.id?null:f.id);setFocusApp(f.from===focusApp?focusApp:f.to===focusApp?focusApp:selApp?.id||f.from);setFlowCtx(null);}}
            onDoubleClick={function(e){e.stopPropagation();setEFlow(Object.assign({},f));setShowFM(true);setSelFlow(null);}}
            onContextMenu={function(e){e.preventDefault();e.stopPropagation();setFlowCtx({flow:f,x:e.clientX,y:e.clientY});setSelFlow(f.id);}}/>
          <path d={pathD} stroke={flowColor} strokeWidth={flowIsSelected?flowThickness+2:flowThickness} strokeOpacity={flowOpacity} strokeDasharray={dashVal} fill="none" markerEnd={"url(#"+arrowId+")"} style={{pointerEvents:"stroke",cursor:"pointer"}}
            onClick={function(e){e.stopPropagation();setFlowSuppressed(false);setSelFlow(selFlow===f.id?null:f.id);setFocusApp(f.from===focusApp?focusApp:f.to===focusApp?focusApp:selApp?.id||f.from);setFlowCtx(null);}}
            onDoubleClick={function(e){e.stopPropagation();setEFlow(Object.assign({},f));setShowFM(true);setSelFlow(null);}}
            onContextMenu={function(e){e.preventDefault();e.stopPropagation();setFlowCtx({flow:f,x:e.clientX,y:e.clientY});setSelFlow(f.id);}}/>
          <circle cx={ep.x} cy={ep.y} r={Math.max(3,flowThickness+1)} fill={flowColor} fillOpacity={flowOpacity}/>
          {!staticMode&&flowIndex<16&&<circle r="3.2" fill={flowColor} opacity={flowOpacity} style={{filter:"drop-shadow(0 0 4px "+flowColor+")",pointerEvents:"none"}}><animateMotion path={pathD} dur={(1.5+(flowIndex%4)*0.22)+"s"} begin={(flowIndex%8)*0.13+"s"} repeatCount="indefinite"/></circle>}
          {txt&&<g opacity={flowLabelOpacity} transform={"translate("+labelX+" "+labelY+") scale("+(1/Math.max(0.08,zm))+") translate("+(-labelX)+" "+(-labelY)+")"}>
            <rect x={labelX-lblW/2} y={labelY-labelFont*0.8} width={lblW} height={labelFont*1.5} rx="4" fill={T.bgCard} fillOpacity="0.96" stroke={flowColor} strokeWidth="0.8" strokeOpacity="0.55"/>
            <text x={labelX} y={labelY+labelFont*0.25} fill={flowColor} fontSize={labelFont} textAnchor="middle" fontFamily="inherit" fontWeight="600" style={{pointerEvents:"none"}}>{txt}</text>
          </g>}
        </g>;})}
    </svg>;
  };

  const CAT_COLORS=["#548CA8","#D4A017","#E06C75","#52B788","#9D4EDD","#D63384","#7B78FF","#40A578"];
  const CategoryZones=()=>{
        // Build category frames from their own application bounds (not entire domains).
    const cats={};
    filtered.forEach(a=>{
      const cat=a.category;
      if(!cat) return;
      if(!cats[cat]) cats[cat]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity,domains:new Set(),ids:[]};
          const _ds=domScales[a.domain]||1;
          cats[cat].x1=Math.min(cats[cat].x1,a.x);
          cats[cat].y1=Math.min(cats[cat].y1,a.y);
          cats[cat].x2=Math.max(cats[cat].x2,a.x+Math.round(AW_BASE*globalScale*_ds*Math.max(0.7,fontScale)));
          cats[cat].y2=Math.max(cats[cat].y2,a.y+Math.round(AH_BASE*globalScale*_ds*Math.max(0.7,fontScale)));
      cats[cat].domains.add(a.domain);
      cats[cat].ids.push(a.id);
    });
    const catEntries=Object.entries(cats);
    if(catEntries.length===0) return null;
    return <>{catEntries.map(([cat,b],ci)=>{
      const cc=catColors[cat]||CAT_COLORS[ci%CAT_COLORS.length];
        const headerColor=accentTextForLight(cc);
      // Utiliser catBounds fixes (mis à jour uniquement par drag ✥ ou resize ⌟)
      // Jamais l'union avec les bornes naturelles — la zone reste stable
      const fb=catBounds[cat]||b;
      const bx1=fb.x1, bx2=fb.x2, by1=fb.y1, by2=fb.y2;
      const sidePad=Math.round(30*categoryScale), bottomPad=Math.round(32*categoryScale);
      const barH=Math.max(Math.round(38*fontScale*categoryScale*categoryFontScale),Math.round(34/zm));
      const domLabelSpace=38+Math.round(28*fontScale)+24;
      const topPad=Math.max(sidePad,domLabelSpace);
      const fz=Math.max(Math.round(13*fontScale*categoryScale*categoryFontScale),Math.round(13/zm));
      const fzSub=Math.max(Math.round(9*fontScale*categoryScale*categoryFontScale),Math.round(10/zm));
      const rzSz=Math.max(20,Math.round(20/zm));
      const catShadow=highlightCategories?Math.round(highlightStrength*0.35):0;
      return <div key={cat} style={{position:"absolute",left:bx1-sidePad,top:by1-topPad-barH,width:bx2-bx1+sidePad*2,height:by2-by1+topPad+bottomPad+barH,border:`${categoryBorderW}px solid ${cc}${isDark?"B0":"88"}`,borderRadius:18,background:isDark?cc+"16":"linear-gradient(145deg,#F8FAFD,"+cc+"0D 78%)",boxShadow:catShadow?`${isDark?"0 12px 32px rgba(0,0,0,0.38)":"0 10px 24px rgba(51,65,85,0.08)"}, 0 0 ${catShadow}px ${cc}28, inset 0 0 0 1px ${cc}${isDark?"20":"12"}`:"none",pointerEvents:"none"}}>
        {/* Bandeau titre */}
        <div style={{position:"absolute",top:-1,left:-1,right:-1,height:barH,background:headerColor,borderRadius:"16px 16px 0 0",borderBottom:`1px solid ${cc}90`,boxShadow:"0 3px 10px "+cc+"30",display:"flex",alignItems:"center",padding:"0 12px",gap:6,pointerEvents:"auto",userSelect:"none"}}
          onContextMenu={e=>{e.preventDefault();e.stopPropagation();setCtxMenu({x:e.clientX,y:e.clientY,type:"category",target:cat});}}>
          {/* Bouton déplacer (document-level drag) */}
          <span title="Déplacer la catégorie" data-app="1"
            style={{fontSize:Math.max(12,Math.round(14/zm)),cursor:"grab",color:"#fff",opacity:0.9,flexShrink:0,lineHeight:1,padding:"0 2px"}}
            onMouseDown={e=>startCatDrag(e,cat,b.ids)}>✥</span>
          <span style={{fontSize:fz,fontWeight:700,color:"#fff",letterSpacing:1.5,textTransform:"uppercase",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat}</span>
          <span style={{fontSize:fzSub,color:"rgba(255,255,255,0.7)",flexShrink:0}}>{b.domains.size} dom · {b.ids.length} apps</span>
          <span title="Changer couleur" style={{fontSize:Math.max(10,Math.round(11/zm)),cursor:"pointer",flexShrink:0,opacity:0.85}}
            onMouseDown={e=>{e.stopPropagation();e.preventDefault();setShowCatColorEdit(cat);}}>🎨</span>
        </div>
        {/* Accents coins */}
        <div style={{position:"absolute",top:barH,left:0,width:20,height:2,background:cc,borderRadius:"0 2px 2px 0"}}/>
        <div style={{position:"absolute",top:barH,right:0,width:20,height:2,background:cc,borderRadius:"2px 0 0 2px"}}/>
        <div style={{position:"absolute",bottom:0,left:0,width:20,height:2,background:cc,borderRadius:"0 2px 2px 0"}}/>
        <div style={{position:"absolute",bottom:0,right:0,width:20,height:2,background:cc,borderRadius:"2px 0 0 2px"}}/>
        {/* Handle resize — coin bas-droite */}
        <div style={{position:"absolute",bottom:0,right:0,width:rzSz,height:rzSz,cursor:"nwse-resize",pointerEvents:"auto",display:"flex",alignItems:"center",justifyContent:"center"}}
          data-app="1" onMouseDown={e=>{e.stopPropagation();e.preventDefault();startDrag({resizeCat:cat,lx:e.clientX,ly:e.clientY});}}>
          <svg width={Math.max(10,Math.round(10/zm))} height={Math.max(10,Math.round(10/zm))} style={{opacity:0.5}}>
            <path d="M10 0L10 10L0 10" fill="none" stroke={cc} strokeWidth="1.5"/>
            <path d="M10 4L10 10L4 10" fill="none" stroke={cc} strokeWidth="1.5"/>
          </svg>
        </div>
      </div>;
    })}</>;
  };

  const DomainZones=()=>{const z={};filtered.forEach(a=>{if(!z[a.domain])z[a.domain]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity,ids:[]};z[a.domain].x1=Math.min(z[a.domain].x1,a.x);z[a.domain].y1=Math.min(z[a.domain].y1,a.y);const _ds=domScales[a.domain]||1;z[a.domain].x2=Math.max(z[a.domain].x2,a.x+Math.round(AW_BASE*globalScale*_ds*Math.max(0.7,fontScale)));z[a.domain].y2=Math.max(z[a.domain].y2,a.y+Math.round(AH_BASE*globalScale*_ds*Math.max(0.7,fontScale)));z[a.domain].ids.push(a.id);});
    const draggingApp=drag&&drag.id&&!drag.domain;
    return <>{Object.entries(z).map(([d,b])=>{const c=DC[d]||DC.Autre;const p=domainPadding;
      const dp=domPads[d]||{w:0,h:0};
      const zw=b.x2-b.x1+p*2+dp.w;
      const domainHeaderH=Math.round(24*fontScale*domainFontScale);
      const zh=b.y2-b.y1+p*2+domainHeaderH+dp.h;
      const isDropTarget=draggingApp&&d!==(apps.find(a=>a.id===drag.id)||{}).domain;
          var _domBrd=isDropTarget?"2px dashed "+c.ac:Math.max(1.5,domBorderW)+"px solid "+c.ac+"A0";
          var domainGlow=highlightDomains?Math.round(highlightStrength*0.35):0;
          var domainShadow=domainGlow?isDark?"0 10px 28px rgba(0,0,0,0.38), 0 0 "+domainGlow+"px "+c.ac+"35, inset 0 0 0 1px "+c.ac+"30":"0 10px 24px rgba(51,65,85,0.08), 0 0 "+domainGlow+"px "+c.ac+"24, inset 0 0 0 1px "+c.ac+"14":isDark?"inset 0 1px 0 rgba(255,255,255,.045)":"0 4px 14px rgba(51,65,85,.05), inset 0 1px 0 rgba(255,255,255,.92)";
          return <div key={d} style={{position:"absolute",left:b.x1-p,top:b.y1-p-domainHeaderH,width:zw,height:zh,border:_domBrd,borderRadius:20,background:isDropTarget?c.ac+"20":isDark?"radial-gradient(ellipse at 12% 0%, "+c.ac+"24, transparent 62%), linear-gradient(145deg, "+c.ac+"17, rgba(15,23,42,.16))":"radial-gradient(ellipse at 12% 0%, "+c.ac+"14, transparent 62%), linear-gradient(145deg, "+c.ac+"0E, #F6F8FC 76%)",boxShadow:isDropTarget?"0 0 0 4px "+c.ac+"35, 0 12px 28px rgba(0,0,0,0.24)":domainShadow,pointerEvents:"none",transition:"border 0.2s, background 0.2s, box-shadow 0.2s"}}>
        <div style={{padding:"6px 13px",fontSize:Math.round(13*fontScale*domainFontScale),fontWeight:850,color:isDark?c.ac:accentTextForLight(c.ac),letterSpacing:1,textTransform:"uppercase",pointerEvents:"auto",cursor:"grab",userSelect:"none",display:"flex",alignItems:"center",gap:8,maxWidth:"100%",borderRadius:"10px 10px 0 0",background:isDark?c.ac+"20":c.ac+"24",border:"1px solid "+c.ac+(isDark?"35":"55"),boxShadow:isDark?"0 5px 14px rgba(0,0,0,.12)":"0 5px 14px rgba(30,41,59,.08)"}}
          data-app="1" onMouseDown={e=>{e.stopPropagation();startDrag({domain:d,appIds:b.ids,lastX:e.clientX,lastY:e.clientY});}}
          onContextMenu={e=>{e.preventDefault();e.stopPropagation();setCtxMenu({x:e.clientX,y:e.clientY,type:"domain",target:d});}}>
          <span style={{width:8,height:8,flexShrink:0,borderRadius:99,background:c.ac,boxShadow:"0 0 10px "+c.ac+"88"}}/>
          <span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{d}</span>
          <span style={{fontSize:Math.max(10,Math.round(10/zm)),opacity:0.65}}>⠿</span>
          <span style={{cursor:"pointer",fontSize:Math.max(10,Math.round(10/zm)),flexShrink:0}} onMouseDown={e=>{e.stopPropagation();e.preventDefault();setShowDomEdit(d);}} title="Changer couleur">🎨</span></div>
        {/* Resize handle (coin) */}
        <div style={{position:"absolute",bottom:0,right:0,width:16,height:16,cursor:"nwse-resize",pointerEvents:"auto",display:"flex",alignItems:"center",justifyContent:"center"}}
          data-app="1" onMouseDown={e=>{e.stopPropagation();e.preventDefault();startDrag({resize:d,lx:e.clientX,ly:e.clientY});}}>
          <svg width="10" height="10" style={{opacity:0.4}}><path d="M10 0L10 10L0 10" fill="none" stroke={c.ac} strokeWidth="1.5"/><path d="M10 4L10 10L4 10" fill="none" stroke={c.ac} strokeWidth="1.5"/></svg>
        </div>
      </div>;})}</>;
  };

  /* Dashboard */
  const Dashboard=()=>{
    const [dbFilter,setDbFilter]=useState({});// {domain: {status:"",criticality:""}}
    const [hiddenSections,setHiddenSections]=useState([]);// ["charts","matrix","domain_Finance"]
    const [flxSearch,setFlxSearch]=useState("");
    const [fSrcApp,setFSrcApp]=useState("");
    const [fSrcDom,setFSrcDom]=useState("");
    const [fTgtApp,setFTgtApp]=useState("");
    const [fTgtDom,setFTgtDom]=useState("");
    const [fProto,setFProto]=useState("");
    const [fFreq,setFFreq]=useState("");
    const [fDesc,setFDesc]=useState("");
    const [showFlxFilter,setShowFlxFilter]=useState(false);
    const [activeDomain,setActiveDomain]=useState(null);
    const [chartTip,setChartTip]=useState(null); // {x,y,label,val,pct}
    const [quickFilter,setQuickFilter]=useState(""); // "" | "critiques"
    const [hovSlice,setHovSlice]=useState(null); // {id,idx}
    const clearTip=function(){setChartTip(null);};
    const hexToRgbCo=function(hex){var r=parseInt(hex.slice(1,3),16)||102,g=parseInt(hex.slice(3,5),16)||102,b=parseInt(hex.slice(5,7),16)||102;return r+","+g+","+b;};
    const toggleSection=(id)=>setHiddenSections(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
    const DEFAULT_SIZES={chart_apps:"m",flow_matrix:"l",critical_apps:"l",chart_criticality:"m",chart_owner:"m",carveout:"l",it_budget:"m",it_patrimoine:"m",flowreg:"l"};
    const [widgetSizes,setWidgetSizes]=useState(function(){try{var s=localStorage.getItem("dash_sizes_"+(projectId||"default"));if(s)return Object.assign({},DEFAULT_SIZES,JSON.parse(s));}catch(e){}return Object.assign({},DEFAULT_SIZES);});
    const saveWidgetSizes=(sz)=>{setWidgetSizes(sz);try{localStorage.setItem("dash_sizes_"+(projectId||"default"),JSON.stringify(sz));}catch(e){}};
    const [hovWid,setHovWid]=useState(null);
    const hiddenKey="dash_hidden_"+(projectId||"default");
    const [hiddenWidgets,setHiddenRaw]=useState(function(){try{var s=localStorage.getItem(hiddenKey);if(s){var a=JSON.parse(s);if(Array.isArray(a))return a;}}catch(e){}return[];});
    const setHiddenWidgets=function(v){
      setHiddenRaw(function(prev){
        var next=typeof v==="function"?v(prev):v;
        try{localStorage.setItem(hiddenKey,JSON.stringify(next));}catch(e){}
        return next;
      });
    };
    const [showCustom,setShowCustom]=useState(false);
    const [widgetPos,setWidgetPos]=useState(function(){try{var s=localStorage.getItem("dash_pos_v2_"+(projectId||"default"));if(s)return JSON.parse(s);}catch(e){}return{};});
    const saveWidgetPos=function(p){setWidgetPos(p);try{localStorage.setItem("dash_pos_v2_"+(projectId||"default"),JSON.stringify(p));}catch(e){}};
    const [dragInfo,setDragInfo]=useState(null);
    const [wZIndex,setWZIndex]=useState({});
    const [zCounter,setZCounter]=useState(100);
    // Refs pour éviter les stale closures dans les listeners document
    const dragInfoRef=useRef(null);
    const widgetPosRef=useRef(widgetPos);
    useEffect(function(){widgetPosRef.current=widgetPos;},[widgetPos]);
    useEffect(function(){
      if(!dragInfo){document.body.style.cursor="";document.body.style.userSelect="";return;}
      dragInfoRef.current=dragInfo;
      var onMove=function(e){
        var info=dragInfoRef.current;if(!info)return;
        var np=Object.assign({},widgetPosRef.current);
        np[info.id]={x:Math.max(0,e.clientX-info.ox),y:Math.max(0,e.clientY-info.oy)};
        widgetPosRef.current=np;
        setWidgetPos(function(){return np;});
      };
      var onUp=function(){
        saveWidgetPos(widgetPosRef.current);
        setDragInfo(null);dragInfoRef.current=null;
        document.body.style.cursor="";document.body.style.userSelect="";
        document.removeEventListener("mousemove",onMove,true);
        document.removeEventListener("mouseup",onUp,true);
      };
      document.body.style.cursor="grabbing";
      document.body.style.userSelect="none";
      document.addEventListener("mousemove",onMove,true);
      document.addEventListener("mouseup",onUp,true);
      return function(){
        document.removeEventListener("mousemove",onMove,true);
        document.removeEventListener("mouseup",onUp,true);
        document.body.style.cursor="";document.body.style.userSelect="";
      };
    },[dragInfo]);
    // Resize gauche & droite — même pattern que dragInfo
    const [resizeInfo,setResizeInfo]=useState(null);
    const resizeInfoRef=useRef(null);
    useEffect(function(){
      if(!resizeInfo){document.body.style.cursor="";return;}
      resizeInfoRef.current=resizeInfo;
      var isHoriz=resizeInfo.side==="left"||resizeInfo.side==="right";
      var onMove=function(e){
        var info=resizeInfoRef.current;if(!info)return;
        var np=Object.assign({},widgetPosRef.current);
        var cur=np[info.id]||getDefaultPos(info.id);
        if(info.side==="right"){
          var dx=e.clientX-info.startX;
          np[info.id]=Object.assign({},cur,{w:Math.max(240,info.startW+dx)});
        } else if(info.side==="left"){
          var dx2=e.clientX-info.startX;
          var newW=Math.max(240,info.startW-dx2);
          np[info.id]=Object.assign({},cur,{w:newW,x:Math.max(0,info.startPosX+(info.startW-newW))});
        } else if(info.side==="bottom"){
          var dy=e.clientY-info.startY;
          np[info.id]=Object.assign({},cur,{h:Math.max(120,info.startH+dy)});
        } else if(info.side==="top"){
          var dy2=e.clientY-info.startY;
          var newH=Math.max(120,info.startH-dy2);
          np[info.id]=Object.assign({},cur,{h:newH,y:Math.max(0,info.startPosY+(info.startH-newH))});
        }
        widgetPosRef.current=np;
        setWidgetPos(function(){return np;});
      };
      var onUp=function(){
        saveWidgetPos(widgetPosRef.current);
        setResizeInfo(null);resizeInfoRef.current=null;
        document.body.style.cursor="";
        document.removeEventListener("mousemove",onMove,true);
        document.removeEventListener("mouseup",onUp,true);
      };
      document.body.style.cursor=isHoriz?"ew-resize":"ns-resize";
      document.addEventListener("mousemove",onMove,true);
      document.addEventListener("mouseup",onUp,true);
      return function(){
        document.removeEventListener("mousemove",onMove,true);
        document.removeEventListener("mouseup",onUp,true);
        document.body.style.cursor="";
      };
    },[resizeInfo]);
    const [expandedWidget,setExpandedWidget]=useState(null);
    const [flowMatrixMode,setFlowMatrixMode]=useState("heatmap");
    const [selectedFlowCell,setSelectedFlowCell]=useState(null);
    const [selectedCriticalApp,setSelectedCriticalApp]=useState(null);
    const CHART_TYPES_DEF={chart_apps:"bar",chart_owner:"donut",it_budget:"bars",it_patrimoine:"bars",chart_criticality:"bars"};
    const [chartTypes,setChartTypes]=useState(Object.assign({},CHART_TYPES_DEF));
    const setChartType=function(id,t){setChartTypes(function(p){return Object.assign({},p,{[id]:t});});};
    const dm=[...new Set(apps.map(a=>a.domain))];
    const [domFilters,setDomFilters]=useState({});
    const [expFlow,setExpFlow]=useState(null);
    const domApps=function(id){var d=domFilters[id];return d?apps.filter(function(a){return a.domain===d;}):apps;};
    const domFlows=function(id){var d=domFilters[id];if(!d)return flows;var ids={};apps.forEach(function(a){if(a.domain===d)ids[a.id]=1;});return flows.filter(function(f){return ids[f.from]||ids[f.to];});};
    const DOM_FILTER_IDS=["chart_owner","it_budget","it_patrimoine","carveout"];
    const CHEV="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239aa4c7' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";
    const WIDGET_SEL_STYLE={background:T.bgAlt+" "+CHEV+" no-repeat right 7px center",color:T.fg,border:"1px solid "+T.border,borderRadius:8,padding:"0 22px 0 10px",fontSize:10.5,fontWeight:600,cursor:"pointer",outline:"none",height:26,boxSizing:"border-box",appearance:"none",WebkitAppearance:"none",maxWidth:150,transition:"border-color .15s, background-color .15s"};
    const domSel=function(id){
      var cur=domFilters[id]||"";
      return <select value={cur} title="Filtrer par domaine" onClick={function(e){e.stopPropagation();}} onMouseDown={function(e){e.stopPropagation();}}
        onChange={function(e){var v=e.target.value;setDomFilters(function(p){return Object.assign({},p,{[id]:v});});}}
        style={Object.assign({},WIDGET_SEL_STYLE,cur?{border:"1px solid #6366F1",color:"#818CF8",background:"rgba(99,102,241,0.14) "+CHEV+" no-repeat right 7px center"}:{})}>
        <option value="" style={{background:T.bgCard,color:T.fg}}>Tous les domaines</option>
        {dm.slice().sort().map(function(d){return <option key={d} value={d} style={{background:T.bgCard,color:T.fg}}>{d}</option>;})}
      </select>;
    };
    const st=dm.map(d=>{const da=apps.filter(a=>a.domain===d);const df=flows.filter(f=>{const fa=apps.find(a=>a.id===f.from);const ta=apps.find(a=>a.id===f.to);return fa?.domain===d||ta?.domain===d;});return{domain:d,count:da.length,flows:df.length,critical:da.filter(a=>a.criticality==="Haute").length,apps:da};});
    const tot=apps.length,totF=flows.length,totC=apps.filter(a=>a.criticality==="Haute").length;
    const mxF=Math.max(...st.map(d=>d.flows),1),mxA=Math.max(...st.map(d=>d.count),1);
    const mtx={};flows.forEach(f=>{const fd=apps.find(a=>a.id===f.from)?.domain,td=apps.find(a=>a.id===f.to)?.domain;if(fd&&td)mtx[fd+"→"+td]=(mtx[fd+"→"+td]||0)+1;});
    const SectionHdr=({id,title,extra})=>{
      const hidden=hiddenSections.includes(id);
      return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:hidden?0:16}}>
        <h3 style={{fontSize:14,fontWeight:700,margin:0,cursor:"pointer",display:"flex",alignItems:"center",gap:6}} onClick={()=>toggleSection(id)}>
          <span style={{fontSize:10,color:T.fgDim}}>{hidden?"▶":"▼"}</span>{title}
        </h3>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>{extra}</div>
      </div>;
    };
    var ITSI_CHART_OPTS=[{k:"bars",label:"Barres"},{k:"columns",label:"Colonnes"},{k:"donut",label:"Donut"},{k:"pie",label:"Camembert"}];
    var buildArcs=function(slices,total,cx,cy,r,ir){
      var cum=0;
      return slices.map(function(sl,i){
        var sa=cum/total*Math.PI*2-Math.PI/2;cum+=sl.value;var ea=cum/total*Math.PI*2-Math.PI/2;
        var mid=(sa+ea)/2;
        var x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa),x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea);
        var ix1=cx+ir*Math.cos(sa),iy1=cy+ir*Math.sin(sa),ix2=cx+ir*Math.cos(ea),iy2=cy+ir*Math.sin(ea);
        var lg=sl.value/total>0.5?1:0;
        var d=ir===0
          ?("M "+cx+" "+cy+" L "+x1+" "+y1+" A "+r+" "+r+" 0 "+lg+" 1 "+x2+" "+y2+" Z")
          :("M"+ix1+" "+iy1+" L"+x1+" "+y1+" A"+r+" "+r+" 0 "+lg+" 1 "+x2+" "+y2+" L"+ix2+" "+iy2+" A"+ir+" "+ir+" 0 "+lg+" 0 "+ix1+" "+iy1);
        return{d:d,color:sl.color,name:sl.name,pct:Math.round(sl.value/total*100),value:sl.value,mid:mid,idx:i};
      });
    };
    var mkChartSwitch=function(id,extraOpts,onlyOpts){
      var cur=chartTypes[id]||"donut";
      var opts=onlyOpts||[{k:"donut",label:"Donut"},{k:"pie",label:"Camembert"},{k:"bar",label:"Histogramme"},{k:"area",label:"Aires"}].concat(extraOpts||[]);
      return <select
        value={cur}
        onClick={function(e){e.stopPropagation();}}
        onChange={function(e){e.stopPropagation();setChartType(id,e.target.value);}}
        style={WIDGET_SEL_STYLE}
      >
        {opts.map(function(o){return <option key={o.k} value={o.k} style={{background:T.bgCard,color:T.fg}}>{o.label}</option>;})}
      </select>;
    };
    var ALL_WIDGETS_LIST=["chart_apps","chart_criticality","critical_apps","flow_matrix","chart_owner",...(projectType==='deal'?["carveout"]:[]),"it_budget","it_patrimoine","flowreg"];
    var getWidgetH=function(id){return{chart_apps:280,chart_criticality:320,critical_apps:480,flow_matrix:460,chart_owner:260,carveout:760,it_budget:560,it_patrimoine:680,flowreg:720}[id]||300;};
    var buildDashboardLayout=function(columns,columnWidth,hidden){
      var hid=hidden||[];
      var rows=[{ids:["chart_apps","chart_criticality"]},{ids:["critical_apps"],wide:true},{ids:["flow_matrix"],wide:true},{ids:["chart_owner"]},{ids:["it_budget","it_patrimoine"]}];
      var fullWidth=columns===1?columnWidth:columnWidth*2+20;
      var layout={};var y=16;
      rows.forEach(function(row){
        var widgets=row.ids.filter(function(id){        return ALL_WIDGETS_LIST.includes(id)&&!hid.includes(id);});
        if(row.wide){
          var wideId=widgets[0];
          if(wideId){layout[wideId]={x:16,y:y,w:fullWidth,h:getWidgetH(wideId)};y+=getWidgetH(wideId)+32;}
          return;
        }
        for(var start=0;start<widgets.length;start+=columns){
          var group=widgets.slice(start,start+columns);
          var rowHeight=Math.max.apply(null,group.map(getWidgetH));
          group.forEach(function(id,index){layout[id]={x:16+index*(columnWidth+20),y:y,w:columnWidth,h:getWidgetH(id)};});
          y+=rowHeight+32;
        }
      });
      if(projectType==="deal"&&!hid.includes("carveout")){layout.carveout={x:16,y:y,w:fullWidth,h:getWidgetH("carveout")};y+=getWidgetH("carveout")+32;}
      if(!hid.includes("flowreg"))layout.flowreg={x:16,y:y,w:fullWidth,h:getWidgetH("flowreg")};
      return layout;
    };
    var relayoutWith=function(hidden){
      var columns=window.innerWidth<940?1:2;
      var columnWidth=columns===1?Math.min(600,Math.max(300,window.innerWidth-280)):Math.min(500,Math.max(300,(window.innerWidth-320)/2));
      saveWidgetPos(buildDashboardLayout(columns,columnWidth,hidden));
      setHiddenWidgets(hidden);
    };
    var WIDGET_THEMES=[
      {id:"kpi",label:"Indicateurs clés",icon:"◎",color:"#2979FF",desc:"Synthèse chiffrée du périmètre",widgets:[{id:"kpi_bar",label:"Bandeau d'indicateurs"}]},
      {id:"overview",label:"Vue d'ensemble",icon:"▣",color:"#7C4DFF",desc:"Répartition du patrimoine applicatif",widgets:[{id:"chart_apps",label:"Apps par domaine"},{id:"chart_criticality",label:"Criticité"}]},
      {id:"risk",label:"Risques & criticité",icon:"⚠",color:"#FF5252",desc:"Applications sensibles à surveiller",widgets:[{id:"critical_apps",label:"Applications critiques"}]},
      {id:"flows",label:"Flux & interfaces",icon:"⇄",color:"#00C853",desc:"Échanges entre domaines et registre",widgets:[{id:"flow_matrix",label:"Matrice des flux"},{id:"flowreg",label:"Registre des flux"}]},
      {id:"org",label:"Organisation",icon:"◉",color:"#00B8D4",desc:"Répartition par responsable",widgets:[{id:"chart_owner",label:"Par responsable"}]}
    ].concat(projectType==="deal"?[{id:"deal",label:"Carve-out & Day 1/2",icon:"✂",color:"#FF9100",desc:"Trajectoire de séparation",widgets:[{id:"carveout",label:"Carve-out"}]}]:[]).concat([{id:"budget",label:"Budget & coûts",icon:"€",color:"#FFB300",desc:"Coûts annuels/mensuels, OPEX/CAPEX, licences",widgets:[{id:"it_budget",label:"Budget & coûts IT"}]},{id:"patrimoine",label:"Patrimoine",icon:"☁",color:"#26A69A",desc:"Hébergement, type d'app, fin de service",widgets:[{id:"it_patrimoine",label:"Patrimoine applicatif"}]}]);
    var toggleWidgetIds=function(ids,show){
      var next=hiddenWidgets.filter(function(x){return!ids.includes(x);});
      if(!show)next=next.concat(ids.filter(function(x){return!next.includes(x);}));
      relayoutWith(next);
    };
    var getDefaultPos=function(id){
      var columns=window.innerWidth<940?1:2;
      var width=columns===1?Math.min(600,Math.max(300,window.innerWidth-280)):Math.min(500,Math.max(300,(window.innerWidth-320)/2));
      return buildDashboardLayout(columns,width)[id]||{x:16,y:16,w:width,h:300};
    };
    var getWidgetW=function(id){var size=widgetSizes[id]||DEFAULT_SIZES[id]||"m";return{s:340,m:500,l:1020}[size]||500;};
    var optimizeDashboard=function(){
      var columns=window.innerWidth<940?1:2;
      var columnWidth=columns===1?Math.min(600,Math.max(300,window.innerWidth-280)):Math.min(500,Math.max(300,(window.innerWidth-320)/2));
      var next=buildDashboardLayout(columns,columnWidth,hiddenWidgets);
      saveWidgetPos(next);
      saveWidgetSizes(Object.assign({},DEFAULT_SIZES));
      setWZIndex({});
    };
    const wrapWidget=function(id,accentColor,title,extraHeader,content,chartSwitcher){
      if(hiddenWidgets.includes(id))return null;
      var isExpanded=expandedWidget===id;
      var size=widgetSizes[id]||DEFAULT_SIZES[id]||"m";
      var isHov=hovWid===id||isExpanded;
      var pos=widgetPos[id]||getDefaultPos(id);
      var ww=(pos&&pos.w)||getWidgetW(id);
      var wh=(pos&&pos.h)||undefined;
      var resolvedContent=typeof content==="function"?content(isExpanded,ww,wh):content;
      if(isExpanded){
        return <div key={id} style={{position:"fixed",inset:0,zIndex:9900,background:T.bg,overflow:"auto",display:"flex",flexDirection:"column"}}
          onMouseEnter={function(){setHovWid(id);}}
          onMouseLeave={function(){setHovWid(null);}}>
          {/* Controls overlay */}
          <div style={{position:"fixed",top:16,right:16,zIndex:9910,display:"flex",gap:3,alignItems:"center"}}>
            {DOM_FILTER_IDS.indexOf(id)>=0&&domSel(id)}
            {chartSwitcher}
            <button onClick={function(e){e.stopPropagation();setExpandedWidget(null);}}
              style={{background:"rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:4,padding:"4px 10px",fontSize:14,cursor:"pointer",color:"#fff",backdropFilter:"blur(4px)"}}
              title="Réduire">⊡</button>
          </div>
          <div style={{padding:32,flex:1,display:"flex",flexDirection:"column"}}>
            {resolvedContent}
          </div>
        </div>;
      }
      var isResizing=resizeInfo&&resizeInfo.id===id;
      var rSide=isResizing?resizeInfo.side:"";
      var hlColor=function(side){return rSide===side?"#6366F1":(accentColor||"rgba(255,255,255,0.32)");};
      var hlGlow=function(side){return rSide===side?"0 0 8px #6366F1":"none";};
      var hlOp=function(side){return(isHov||rSide===side)?1:0;};
      return <div key={id} data-wid={id} style={{
        position:"absolute",
        left:pos.x, top:pos.y,
        width:ww,
        height:wh,
        zIndex:wZIndex[id]||10,
        borderRadius:14,
        outline:dragInfo&&dragInfo.id===id?"2px solid #6366F1":"2px solid transparent",
        outlineOffset:3,
        opacity:dragInfo&&dragInfo.id===id?0.85:1,
        cursor:dragInfo&&dragInfo.id===id?"grabbing":"default",
        userSelect:"none",
      }}
        onMouseDown={function(){
          var nz=zCounter+1; setZCounter(nz); setWZIndex(function(p){return Object.assign({},p,{[id]:nz});});
        }}
        onMouseEnter={function(){setHovWid(id);}}
        onMouseLeave={function(){setHovWid(null);}}
      >
        {/* Drag handle */}
        <div onMouseDown={function(e){
          e.preventDefault(); e.stopPropagation();
          var rect=e.currentTarget.closest('[data-wid]').getBoundingClientRect();
          setDragInfo({id:id,ox:e.clientX-rect.left,oy:e.clientY-rect.top});
          var nz=zCounter+1; setZCounter(nz); setWZIndex(function(p){return Object.assign({},p,{[id]:nz});});
        }} style={{position:"absolute",top:12,left:12,zIndex:20,opacity:isHov?0.75:0,transition:"opacity 0.12s",pointerEvents:isHov?"all":"none",cursor:"grab",background:"rgba(0,0,0,0.45)",borderRadius:4,padding:"3px 5px",fontSize:13,color:"#fff",userSelect:"none",lineHeight:1,backdropFilter:"blur(4px)"}}
          title="Déplacer">⣿</div>
        {/* Controls */}
        <div style={{position:"absolute",top:10,right:10,zIndex:20,display:"flex",gap:6,alignItems:"center",padding:4,borderRadius:12,background:T.bgCard+"E6",border:"1px solid "+T.border,boxShadow:"0 6px 20px rgba(0,0,0,0.28)",backdropFilter:"blur(10px)",opacity:(isHov||domFilters[id])?1:0,transition:"opacity 0.12s",pointerEvents:(isHov||domFilters[id])?"all":"none"}}>
          {DOM_FILTER_IDS.indexOf(id)>=0&&domSel(id)}
          {chartSwitcher}
          <div style={{display:"flex",background:T.bgAlt,border:"1px solid "+T.border,borderRadius:8,padding:2,gap:1}}>
          {[{k:"s",t:"Compact"},{k:"m",t:"Moyen"},{k:"l",t:"Large"}].map(function(sz){
            var isAct=size===sz.k;
            return <button key={sz.k} onClick={function(e){e.stopPropagation();var ns=Object.assign({},widgetSizes);ns[id]=sz.k;saveWidgetSizes(ns);}}
              style={{background:isAct?"#6366F1":"transparent",border:"none",borderRadius:6,width:22,height:20,fontSize:9.5,cursor:"pointer",color:isAct?"#fff":T.fgMuted,fontWeight:700,transition:"all .15s"}}
              title={sz.t}>{sz.k.toUpperCase()}</button>;
          })}
          </div>
          <button onClick={function(e){e.stopPropagation();setExpandedWidget(id);}}
            style={{background:T.bgAlt,border:"1px solid "+T.border,borderRadius:8,width:26,height:26,cursor:"pointer",color:T.fgMuted,display:"flex",alignItems:"center",justifyContent:"center",padding:0}} onMouseEnter={function(e){e.currentTarget.style.color="#818CF8";e.currentTarget.style.borderColor="#6366F1";}} onMouseLeave={function(e){e.currentTarget.style.color=T.fgMuted;e.currentTarget.style.borderColor=T.border;}}
            title="Agrandir"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></button>
          <button onClick={function(e){e.stopPropagation();setHiddenWidgets(function(p){return[...p,id];});}}
            style={{background:T.bgAlt,border:"1px solid "+T.border,borderRadius:8,width:26,height:26,cursor:"pointer",color:T.fgMuted,display:"flex",alignItems:"center",justifyContent:"center",padding:0}} onMouseEnter={function(e){e.currentTarget.style.color="#818CF8";e.currentTarget.style.borderColor="#6366F1";}} onMouseLeave={function(e){e.currentTarget.style.color=T.fgMuted;e.currentTarget.style.borderColor=T.border;}}
            title="Masquer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="12" rx="10" ry="6.5"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        {/* ── Poignée gauche ── */}
        <div onMouseDown={function(e){e.preventDefault();e.stopPropagation();setResizeInfo({id:id,side:"left",startX:e.clientX,startW:ww,startPosX:pos.x});var nz=zCounter+1;setZCounter(nz);setWZIndex(function(p){return Object.assign({},p,{[id]:nz});});}}
          style={{position:"absolute",top:0,left:-5,width:10,height:"100%",cursor:"ew-resize",zIndex:25,display:"flex",alignItems:"center",justifyContent:"center",opacity:hlOp("left"),transition:"opacity 0.15s"}}>
          <div style={{width:3,height:40,borderRadius:3,background:hlColor("left"),boxShadow:hlGlow("left"),transition:"background 0.12s, box-shadow 0.12s"}}/>
        </div>
        {/* ── Poignée droite ── */}
        <div onMouseDown={function(e){e.preventDefault();e.stopPropagation();setResizeInfo({id:id,side:"right",startX:e.clientX,startW:ww});var nz=zCounter+1;setZCounter(nz);setWZIndex(function(p){return Object.assign({},p,{[id]:nz});});}}
          style={{position:"absolute",top:0,right:-5,width:10,height:"100%",cursor:"ew-resize",zIndex:25,display:"flex",alignItems:"center",justifyContent:"center",opacity:hlOp("right"),transition:"opacity 0.15s"}}>
          <div style={{width:3,height:40,borderRadius:3,background:hlColor("right"),boxShadow:hlGlow("right"),transition:"background 0.12s, box-shadow 0.12s"}}/>
        </div>
        {/* ── Poignée haut ── */}
        <div onMouseDown={function(e){e.preventDefault();e.stopPropagation();var rect=e.currentTarget.closest('[data-wid]').getBoundingClientRect();setResizeInfo({id:id,side:"top",startY:e.clientY,startH:rect.height,startPosY:pos.y});var nz=zCounter+1;setZCounter(nz);setWZIndex(function(p){return Object.assign({},p,{[id]:nz});});}}
          style={{position:"absolute",top:-5,left:0,width:"100%",height:10,cursor:"ns-resize",zIndex:25,display:"flex",alignItems:"center",justifyContent:"center",opacity:hlOp("top"),transition:"opacity 0.15s"}}>
          <div style={{height:3,width:40,borderRadius:3,background:hlColor("top"),boxShadow:hlGlow("top"),transition:"background 0.12s, box-shadow 0.12s"}}/>
        </div>
        {/* ── Poignée bas ── */}
        <div onMouseDown={function(e){e.preventDefault();e.stopPropagation();var rect=e.currentTarget.closest('[data-wid]').getBoundingClientRect();setResizeInfo({id:id,side:"bottom",startY:e.clientY,startH:rect.height});var nz=zCounter+1;setZCounter(nz);setWZIndex(function(p){return Object.assign({},p,{[id]:nz});});}}
          style={{position:"absolute",bottom:-5,left:0,width:"100%",height:10,cursor:"ns-resize",zIndex:25,display:"flex",alignItems:"center",justifyContent:"center",opacity:hlOp("bottom"),transition:"opacity 0.15s"}}>
          <div style={{height:3,width:40,borderRadius:3,background:hlColor("bottom"),boxShadow:hlGlow("bottom"),transition:"background 0.12s, box-shadow 0.12s"}}/>
        </div>
        {/* ── Contenu (scroll si hauteur fixée) ── */}
        {wh
          ?<div style={{height:"100%",overflowY:"auto",overflowX:"hidden",borderRadius:12,background:T.bgCard,boxSizing:"border-box"}}>{resolvedContent}</div>
          :resolvedContent
        }
      </div>;
    };
    return <div style={{width:"100%",padding:"24px 32px",boxSizing:"border-box"}} onMouseLeave={clearTip}>
      {/* Tooltip flottant pour les graphiques */}
      {chartTip&&<div style={{position:"fixed",left:chartTip.x+14,top:chartTip.y-36,background:T.bgCard,border:"1px solid "+T.border,borderRadius:6,padding:"5px 10px",fontSize:11,color:T.fg,pointerEvents:"none",zIndex:9999,boxShadow:T.shadow,whiteSpace:"nowrap"}}>
        <span style={{fontWeight:700}}>{chartTip.label}</span>
        {" · "}<span style={{color:T.fgMuted}}>{chartTip.val}{chartTip.pct!=null?" ("+chartTip.pct+"%)" :""}</span>
      </div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div><h2 style={{fontSize:24,fontWeight:700,margin:0}}>Dashboard Interfaces</h2><p style={{color:T.fgMuted,fontSize:13,marginTop:4}}>Vue d'ensemble des domaines et flux applicatifs</p></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={function(){setShowCustom(function(p){return!p;});}} style={{background:showCustom?"linear-gradient(135deg,#2979FF,#00B8D4)":T.bgAlt,border:"1px solid "+(showCustom?"transparent":T.border),color:showCustom?"#fff":T.fg,borderRadius:9,padding:"8px 12px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}} title="Choisir les thèmes et widgets affichés">
            <span aria-hidden="true">⚙</span> Personnaliser
            <span style={{background:showCustom?"rgba(255,255,255,.25)":"rgba(41,121,255,.15)",color:showCustom?"#fff":"#2979FF",borderRadius:10,padding:"1px 7px",fontSize:10}}>{ALL_WIDGETS_LIST.filter(function(id){return!hiddenWidgets.includes(id);}).length}/{ALL_WIDGETS_LIST.length}</span>
          </button>
          {hiddenWidgets.length>0&&<button onClick={function(){relayoutWith([]);}} style={{background:T.bgAlt,border:"1px solid "+T.border,color:T.fg,borderRadius:9,padding:"8px 12px",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            👁 Afficher ({hiddenWidgets.length})
          </button>}
          <button className="dashboard-optimize-button" onClick={optimizeDashboard} title="Réorganiser automatiquement les widgets affichés">
            <span aria-hidden="true">✦</span> Optimiser le cockpit
          </button>
          <button onClick={function(){saveWidgetPos({});saveWidgetSizes(Object.assign({},DEFAULT_SIZES));setHiddenWidgets([]);setWZIndex({});}} style={{background:"transparent",border:"1px solid "+T.border,color:T.fgMuted,borderRadius:9,padding:"8px 12px",fontSize:11,cursor:"pointer"}} title="Réinitialiser la disposition">↺ Reset</button>
        </div>
      </div>
      {showCustom&&<div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:14,padding:18,marginBottom:20,boxShadow:T.shadow}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:10,flexWrap:"wrap"}}>
          <div><div style={{fontSize:14,fontWeight:700}}>Personnaliser le dashboard</div><div style={{fontSize:11,color:T.fgMuted,marginTop:2}}>Cochez les thèmes ou widgets à afficher — votre choix est mémorisé pour ce projet.</div></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={function(){relayoutWith([]);}} style={{background:T.bgAlt,border:"1px solid "+T.border,color:T.fg,borderRadius:8,padding:"6px 11px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Tout afficher</button>
            <button onClick={function(){relayoutWith(ALL_WIDGETS_LIST.concat(["kpi_bar"]));}} style={{background:T.bgAlt,border:"1px solid "+T.border,color:T.fg,borderRadius:8,padding:"6px 11px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Tout masquer</button>
            <button onClick={function(){setShowCustom(false);}} style={{background:"transparent",border:"1px solid "+T.border,color:T.fgMuted,borderRadius:8,padding:"6px 11px",fontSize:11,cursor:"pointer"}}>Fermer</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
          {WIDGET_THEMES.map(function(th){
            var ids=th.widgets.map(function(w){return w.id;});
            var shown=ids.filter(function(i){return!hiddenWidgets.includes(i);}).length;
            var allOn=shown===ids.length;
            return <div key={th.id} style={{border:"1px solid "+(shown>0?th.color+"55":T.border),borderRadius:12,padding:12,background:shown>0?th.color+"0D":"transparent",opacity:shown>0?1:.7,transition:"all .2s"}}>
              <div onClick={function(){toggleWidgetIds(ids,!allOn);}} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <div style={{width:34,height:34,borderRadius:10,background:th.color+"22",color:th.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0}}>{th.icon}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:700}}>{th.label}</div><div style={{fontSize:10.5,color:T.fgMuted}}>{th.desc}</div></div>
                <div role="switch" aria-checked={shown>0} style={{width:34,height:19,borderRadius:10,background:shown>0?th.color:T.border,position:"relative",flexShrink:0,transition:"background .2s"}}>
                  <div style={{position:"absolute",top:2,left:shown>0?17:2,width:15,height:15,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                </div>
              </div>
              <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:5}}>
                {th.widgets.map(function(w){
                  var on=!hiddenWidgets.includes(w.id);
                  return <label key={w.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:11.5,cursor:"pointer",padding:"4px 6px",borderRadius:7,background:on?th.color+"14":"transparent"}}>
                    <input type="checkbox" checked={on} onChange={function(){toggleWidgetIds([w.id],!on);}} style={{accentColor:th.color}}/>
                    <span style={{color:on?T.fg:T.fgMuted}}>{w.label}</span>
                  </label>;
                })}
              </div>
            </div>;
          })}
        </div>
      </div>}
      {/* KPIs — barre horizontale unifiée */}
      {!hiddenWidgets.includes("kpi_bar")&&function(){
        var kpis=[
          {l:"Applications",v:tot,c:"#2979FF",glow:"rgba(41,121,255,0.18)",icon:"▣",key:""},
          {l:"Interfaces",v:totF,c:"#00C853",glow:"rgba(0,200,83,0.18)",icon:"⇄",key:""},
          {l:"Domaines",v:dm.length,c:"#7C4DFF",glow:"rgba(124,77,255,0.18)",icon:"◉",key:""},
          {l:"Critiques",v:totC,c:"#FF5252",glow:"rgba(255,82,82,0.18)",icon:"⚠",key:"critiques"},
        ];
        return <div className="dashboard-kpi-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:24}}>
          {kpis.map(function(k){
            var isActive=k.key&&quickFilter===k.key;
            var clickable=!!k.key;
            return <div key={k.l}
              onClick={clickable?function(){setQuickFilter(function(p){return p===k.key?"":k.key;});}:undefined}
              className="dashboard-kpi"
              style={{background:T.bgCard,borderRadius:14,padding:"15px 17px",border:"1px solid "+(isActive?k.c+"70":T.border),boxShadow:isActive?"0 8px 22px "+k.glow:"0 4px 16px rgba(30,27,75,.045)",display:"flex",alignItems:"center",gap:12,transition:"box-shadow 0.2s, transform 0.2s, border-color 0.2s",cursor:clickable?"pointer":"default",transform:isActive?"translateY(-2px)":"translateY(0)"}}>
              <div style={{width:40,height:40,borderRadius:11,background:"linear-gradient(145deg,"+k.glow+",transparent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:k.c,flexShrink:0,border:"1px solid "+k.c+"20"}}>{k.icon}</div>
              <div>
                <div style={{fontSize:22,fontWeight:700,color:k.c,lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:10,color:T.fgMuted,marginTop:3,lineHeight:1.2}}>{k.l}</div>
              </div>
              {isActive&&<div style={{marginLeft:"auto",fontSize:8,color:k.c,border:"1px solid "+k.c,borderRadius:4,padding:"1px 4px",fontWeight:700}}>✕</div>}
            </div>;
          })}
        </div>;
      }()}
      
      <div style={{position:"relative",width:"100%",minHeight:Math.max(hiddenWidgets.length>=ALL_WIDGETS_LIST.length?300:1000,...ALL_WIDGETS_LIST.filter(function(id){return!hiddenWidgets.includes(id);}).map(function(id){var pos=widgetPos[id]||getDefaultPos(id);return(pos.y||0)+(pos.h||340)+64;}))}}>
      {ALL_WIDGETS_LIST.filter(function(id){return!hiddenWidgets.includes(id);}).map(function(sid){
        if(sid==="chart_apps")return wrapWidget(sid,"#7C4DFF","Apps par domaine",null,function(isExpanded,ww,wh){
          var barData=[...st].sort(function(a,b){return b.count-a.count;});
          var mx2=Math.max.apply(null,barData.map(function(d){return d.count;}))||1;
          var ctype=chartTypes[sid]||"bar";
          var appSlices=barData.map(function(d){return{name:d.domain,value:d.count,color:(DC[d.domain]||DC.Autre).ac};});
          var totalApps=apps.length||1;
          var cw=ww||500;var svgW=isExpanded?560:Math.max(160,cw-56);var svgH=isExpanded?300:160;
          var renderBarV=function(){
            var W=svgW;var H=svgH;
            var pad={l:40,r:10,t:30,b:50};var n=barData.length;
            var bW=Math.max(8,Math.floor((W-pad.l-pad.r)/n*0.55));
            var gap=(W-pad.l-pad.r)/n;
            return <div style={{overflowX:"auto"}}>
              <svg width={W} height={H} style={{overflow:"visible"}}>
                <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H-pad.b} stroke={T.border} strokeWidth="1"/>
                <line x1={pad.l} y1={H-pad.b} x2={W-pad.r} y2={H-pad.b} stroke={T.border} strokeWidth="1"/>
                {barData.map(function(d,i){
                  var ac2=(DC[d.domain]||DC.Autre).ac;
                  var bh=Math.max(2,(d.count/mx2)*(H-pad.t-pad.b));
                  var x=pad.l+i*gap+gap/2-bW/2;var y=H-pad.b-bh;
                  var label=d.domain;
                  return <g key={d.domain} style={{cursor:"pointer"}}
                    onMouseMove={function(e){setChartTip({x:e.clientX,y:e.clientY,label:d.domain,val:d.count+" apps",pct:Math.round(d.count/totalApps*100)});}}
                    onMouseLeave={clearTip}
                    onClick={function(){setActiveDomain(d.domain);}}>
                    <rect x={x} y={y} width={bW} height={bh} fill={ac2} rx="3" opacity="0.85"/>
                    <text x={x+bW/2} y={y-5} textAnchor="middle" fill={ac2} fontSize="10" fontWeight="700">{d.count}</text>
                    <text x={x+bW/2} y={H-pad.b+14} textAnchor="middle" fill={T.fgMuted} fontSize="8" transform={"rotate(-30,"+(x+bW/2)+","+(H-pad.b+14)+")"}>{label.length>9?label.slice(0,8)+"\u2026":label}</text>
                  </g>;
                })}
              </svg>
            </div>;
          };
          var renderCircle=function(useHole){
            var isNarrow=!isExpanded&&cw<420;
            var donutSz=isExpanded?320:Math.min(140,Math.max(96,cw/2.6));
            var donutR=Math.round(donutSz*0.434);var donutIr=Math.round(donutSz*0.276);
            var donutCx=Math.round(donutSz/2);var donutCy=Math.round(donutSz/2);
            var arcs=buildArcs(appSlices,totalApps,donutCx,donutCy,donutR,useHole?donutIr:0);
            var isHovA=hovSlice&&hovSlice.id==="apps";
            return <div style={{display:"flex",flexDirection:isNarrow?"column":"row",gap:isExpanded?28:(isNarrow?6:12),alignItems:isNarrow?"flex-start":"center",flex:isExpanded?1:undefined,minHeight:0}}>
              <svg width={donutSz} height={donutSz} viewBox={"0 0 "+(donutCx*2)+" "+(donutCy*2)} style={{flexShrink:0}} onMouseLeave={function(){setHovSlice(null);clearTip();}}>
                {arcs.map(function(p){
                  var h=isHovA&&hovSlice.idx===p.idx;
                  var tx=h?Math.cos(p.mid)*6:0;var ty=h?Math.sin(p.mid)*6:0;
                  var op=isHovA?(h?1:0.22):0.88;
                  return <path key={p.idx} d={p.d} fill={p.color} opacity={op} stroke={T.bg} strokeWidth="2.5"
                    transform={"translate("+tx.toFixed(1)+","+ty.toFixed(1)+")"}
                    style={{cursor:"pointer",transition:"opacity 0.12s"}}
                    onMouseMove={function(e){setHovSlice({id:"apps",idx:p.idx});setChartTip({x:e.clientX,y:e.clientY,label:p.name,val:p.value+" apps",pct:p.pct});}}
                    onMouseLeave={function(){setHovSlice(null);clearTip();}}
                    onClick={function(){setActiveDomain(p.name);}}/>;
                })}
                {useHole&&<text x={donutCx} y={donutCy-3} textAnchor="middle" fill={T.fg} fontSize={isExpanded?34:Math.round(donutSz*0.17)} fontWeight="800">{totalApps}</text>}
                {useHole&&<text x={donutCx} y={donutCy+Math.round(donutSz*0.1)} textAnchor="middle" fill={T.fgMuted} fontSize={Math.max(6,Math.round(donutSz*0.055))} letterSpacing="0.08em">APPS</text>}
              </svg>
              <div style={{flex:1,minWidth:0,overflowY:"auto",maxHeight:isExpanded?360:(isNarrow?110:160)}}>
                {arcs.map(function(p){return <div key={p.name} style={{display:"flex",alignItems:"center",gap:5,marginBottom:isNarrow?3:5}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                  <span style={{fontSize:isNarrow?9:10,color:T.fg,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                  <span style={{fontSize:isNarrow?9:10,fontWeight:700,color:p.color}}>{p.value}</span>
                </div>;})}
              </div>
            </div>;
          };
          var renderArea=function(){
            var W=svgW;var H=svgH;var n=appSlices.length;var maxV=mx2;
            if(n<2)return renderBarV();
            var pts=appSlices.map(function(sl,i){return{x:40+i*(W-80)/(n-1),y:(1-sl.value/maxV)*(H-60)+20,sl:sl};});
            var areaD="M"+pts[0].x+" "+(H-30)+" L"+pts.map(function(p){return p.x+" "+p.y;}).join(" L ")+" L"+pts[pts.length-1].x+" "+(H-30)+" Z";
            var lineD="M"+pts.map(function(p){return p.x+" "+p.y;}).join(" L ");
            var gradId="apg_"+sid;
            return <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              <svg width={W} height={H} style={{overflow:"visible"}}>
                <defs><linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C4DFF" stopOpacity="0.5"/><stop offset="100%" stopColor="#7C4DFF" stopOpacity="0.04"/></linearGradient></defs>
                <path d={areaD} fill={"url(#"+gradId+")"} />
                <path d={lineD} fill="none" stroke="#7C4DFF" strokeWidth="2"/>
                {pts.map(function(p,i){return <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill={p.sl.color} stroke={T.bg} strokeWidth="2"
                    onMouseMove={function(e){setChartTip({x:e.clientX,y:e.clientY,label:p.sl.name,val:p.sl.value+" apps",pct:Math.round(p.sl.value/totalApps*100)});}}
                    onMouseLeave={clearTip}/>
                  <text x={p.x} y={p.y-10} textAnchor="middle" fill={p.sl.color} fontSize="10" fontWeight="700">{p.sl.value}</text>
                  <text x={p.x} y={H-14} textAnchor="middle" fill={T.fgMuted} fontSize="9">{p.sl.name.length>7?p.sl.name.slice(0,6)+"…":p.sl.name}</text>
                </g>;})}
              </svg>
            </div>;
          };
          return <div style={{background:T.bgCard,borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,0.14), 0 0 0 1px "+T.border,height:(isExpanded||wh)?"100%":undefined,display:(isExpanded||wh)?"flex":undefined,flexDirection:(isExpanded||wh)?"column":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:3,height:15,borderRadius:2,background:"#7C4DFF",flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:700,color:T.fg}}>Apps par domaine</span>
            </div>
            <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              {ctype==="bar"?renderBarV():ctype==="donut"?renderCircle(true):ctype==="pie"?renderCircle(false):renderArea()}
            </div>
          </div>;
        },mkChartSwitch(sid));
        if(sid==="flow_matrix")return wrapWidget(sid,"#06B6D4","Matrice des flux inter-domaines",null,function(isExpanded,ww,wh){
          var matrixDomains=dm.map(function(domain){
            var outgoing=dm.reduce(function(sum,target){return sum+(mtx[domain+"→"+target]||0);},0);
            var incoming=dm.reduce(function(sum,source){return sum+(mtx[source+"→"+domain]||0);},0);
            return{domain:domain,outgoing:outgoing,incoming:incoming,total:outgoing+incoming,color:(DC[domain]||DC.Autre).ac};
          }).sort(function(a,b){return b.total-a.total;});
          var routes=matrixDomains.flatMap(function(source){return matrixDomains.map(function(target){var count=mtx[source.domain+"→"+target.domain]||0;return{from:source.domain,to:target.domain,count:count};});}).filter(function(route){return route.count>0;}).sort(function(a,b){return b.count-a.count;});
          var topRoutes=routes.slice(0,6);
          var maxRoute=topRoutes[0]||null;
          var maxCell=Math.max.apply(null,routes.map(function(route){return route.count;}).concat([1]));
          var totalActivePairs=routes.length;
          var selectedRoute=selectedFlowCell?routes.find(function(route){return route.from===selectedFlowCell.from&&route.to===selectedFlowCell.to;}):null;
          var focusedRoute=selectedRoute||maxRoute;
          var matrixMinWidth=100+matrixDomains.length*48;
          var cellSize=Math.min(58,Math.max(42,Math.floor(((ww||1020)-132)/Math.max(matrixDomains.length,1))));
          var shortDomain=function(value){return value.length>9?value.slice(0,8)+"…":value;};
          var selectRoute=function(route){setSelectedFlowCell({from:route.from,to:route.to});setActiveDomain(route.from);};
          return <div className="dashboard-widget-surface flow-matrix-widget" style={{background:T.bgCard,borderRadius:16,padding:18,boxShadow:"0 8px 24px rgba(30,27,75,.07), 0 0 0 1px "+T.border,height:(isExpanded||wh)?"100%":undefined,display:(isExpanded||wh)?"flex":undefined,flexDirection:(isExpanded||wh)?"column":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:12,display:"grid",placeItems:"center",background:"linear-gradient(145deg,#06B6D426,#6366F11C)",color:"#06B6D4",fontSize:17,boxShadow:"0 5px 16px #06B6D422"}}>↗</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:800,color:T.fg}}>Échanges entre domaines</div><div style={{fontSize:9,color:T.fgMuted,marginTop:2}}>Survolez ou sélectionnez une cellule pour explorer les flux</div></div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}><button aria-pressed={flowMatrixMode==="routes"} onClick={function(){setFlowMatrixMode(function(mode){return mode==="heatmap"?"routes":"heatmap";});}} style={{border:"1px solid "+T.border,borderRadius:9,padding:"6px 10px",background:T.bgAlt,color:T.fg,fontSize:9,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{flowMatrixMode==="heatmap"?"☷ Top échanges":"▦ Vue matrice"}</button></div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[{label:"Flux",value:totF,color:"#06B6D4"},{label:"Routes actives",value:totalActivePairs,color:"#8B5CF6"},{label:"Route dominante",value:focusedRoute?focusedRoute.count+" flux":"—",color:"#F59E0B"}].map(function(metric){return <div key={metric.label} style={{flex:1,minWidth:0,padding:"8px 10px",borderRadius:10,background:T.bgAlt,border:"1px solid "+T.border}}><div style={{fontSize:8,color:T.fgMuted,marginBottom:3}}>{metric.label}</div><div style={{fontSize:14,fontWeight:800,color:metric.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{metric.value}</div></div>;})}
            </div>
            {!routes.length?<div style={{flex:1,display:"grid",placeItems:"center",fontSize:11,color:T.fgMuted}}>Aucun flux inter-domaines à visualiser.</div>:flowMatrixMode==="heatmap"?<div className="flow-matrix-scroll" style={{flex:1,minHeight:0,overflow:"auto",borderRadius:12,border:"1px solid "+T.border,background:T.bgAlt,padding:8}}>
              <div style={{display:"grid",gridTemplateColumns:"92px repeat("+matrixDomains.length+","+cellSize+"px)",gap:4,minWidth:matrixMinWidth}}>
                <div style={{display:"flex",alignItems:"end",padding:"0 4px 6px",fontSize:8,fontWeight:800,color:T.fgMuted,letterSpacing:".05em"}}>ÉMETTEUR ↓</div>
                {matrixDomains.map(function(domain){return <div key={domain.domain} title={domain.domain} style={{height:30,display:"grid",placeItems:"center",padding:"2px",fontSize:8,fontWeight:750,color:domain.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shortDomain(domain.domain)}</div>;})}
                {matrixDomains.map(function(source){return <React.Fragment key={source.domain}>
                  <div title={source.domain+" · "+source.outgoing+" sortant(s)"} style={{display:"flex",alignItems:"center",gap:6,padding:"0 5px",fontSize:9,fontWeight:750,color:source.color,overflow:"hidden"}}><span style={{width:6,height:6,borderRadius:2,background:source.color,flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shortDomain(source.domain)}</span></div>
                  {matrixDomains.map(function(target){
                    var count=mtx[source.domain+"→"+target.domain]||0;
                    var intensity=count?0.12+Math.log1p(count)/Math.log1p(maxCell)*0.68:0;
                    var isSelected=selectedFlowCell&&selectedFlowCell.from===source.domain&&selectedFlowCell.to===target.domain;
                    return <button key={source.domain+"→"+target.domain} aria-label={source.domain+" vers "+target.domain+" : "+count+" flux"} title={source.domain+" → "+target.domain+" · "+count+" flux"} onMouseEnter={function(e){if(count)setChartTip({x:e.clientX,y:e.clientY,label:source.domain+" → "+target.domain,val:count+" flux",pct:Math.round(count/(totF||1)*100)});}} onMouseMove={function(e){setChartTip(function(t){return t?Object.assign({},t,{x:e.clientX,y:e.clientY}):t;});}} onMouseLeave={clearTip} onClick={function(){if(count)selectRoute({from:source.domain,to:target.domain,count:count});}} style={{height:34,borderRadius:8,border:"1px solid "+(isSelected?"#67E8F9":count?"rgba(99,102,241,.2)":T.border),background:count?"linear-gradient(145deg,rgba(99,102,241,"+intensity+"),rgba(6,182,212,"+(intensity*.78)+"))":T.bgCard,color:count?T.fgMuted:T.fgFaint,fontSize:9,fontWeight:count?800:500,cursor:count?"pointer":"default",boxShadow:isSelected?"0 0 0 2px #06B6D455,0 0 18px #06B6D433":count?"inset 0 1px 0 rgba(255,255,255,.07)":"none",transform:isSelected?"scale(1.05)":"scale(1)",transition:"transform .16s,box-shadow .16s,background .25s"}}>{count||"·"}</button>;
                  })}
                </React.Fragment>;})}
              </div>
            </div>:<div className="flow-route-list" style={{flex:1,minHeight:0,overflowY:"auto",display:"grid",gap:7,paddingRight:3}}>
              {topRoutes.map(function(route,index){var selectedRouteNow=focusedRoute&&focusedRoute.from===route.from&&focusedRoute.to===route.to;var pct=Math.round(route.count/maxCell*100);return <button key={route.from+"→"+route.to} onClick={function(){selectRoute(route);}} style={{width:"100%",padding:"9px 11px",borderRadius:11,border:"1px solid "+(selectedRouteNow?"#06B6D466":T.border),background:selectedRouteNow?"linear-gradient(110deg,#06B6D414,#6366F10B)":T.bgAlt,color:T.fg,textAlign:"left",cursor:"pointer",transition:"transform .18s,border-color .18s,background .18s"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}><span style={{width:22,height:22,borderRadius:7,display:"grid",placeItems:"center",background:"#06B6D416",color:"#06B6D4",fontSize:9,fontWeight:800}}>{index+1}</span><span style={{flex:1,minWidth:0,fontSize:10,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:(DC[route.from]||DC.Autre).ac}}>{route.from}</span><span style={{color:T.fgMuted,margin:"0 7px"}}>→</span><span style={{color:(DC[route.to]||DC.Autre).ac}}>{route.to}</span></span><b style={{fontSize:13,color:"#06B6D4",fontVariantNumeric:"tabular-nums"}}>{route.count}</b></div>
                <div className="dashboard-meter-track"><span style={{width:pct+"%",background:"linear-gradient(90deg,#6366F1,#06B6D4)"}}/></div>
              </button>;})}
            </div>}
            {focusedRoute&&<div style={{marginTop:9,display:"flex",justifyContent:"space-between",gap:8,fontSize:8,color:T.fgMuted}}><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Focus : <b style={{color:T.fg}}>{focusedRoute.from} → {focusedRoute.to}</b></span><span>{Math.round(focusedRoute.count/(totF||1)*100)}% du total</span></div>}
          </div>;
        });
        if(sid==="chart_flux_legacy")return wrapWidget(sid,"#2979FF","Flux par domaine",null,function(isExpanded,ww,wh){
          var fluxData=dm.map(function(d){
            var out=flows.filter(function(f){var fa=apps.find(function(a){return a.id===f.from;});return fa&&fa.domain===d;}).length;
            var inn=flows.filter(function(f){var ta=apps.find(function(a){return a.id===f.to;});return ta&&ta.domain===d;}).length;
            return{domain:d,out:out,inn:inn,total:out+inn,net:out-inn};
          }).sort(function(a,b){return b.total-a.total;});
          var mx3=Math.max.apply(null,fluxData.map(function(d){return d.total;}))||1;
          var ctype=chartTypes[sid]||"bar";
          var totalFlux=flows.length||1;
          var cw=ww||500;var svgW=isExpanded?560:Math.max(160,cw-56);var svgH=isExpanded?300:160;
          var renderBarH=function(){
            var mx=Math.max.apply(null,fluxData.map(function(d){return d.out+d.inn;}))||1;
            return <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              <div style={{display:"flex",gap:12,marginBottom:8,fontSize:9}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:"#00C853"}}/>Sortants</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:"#2979FF"}}/>Entrants</span>
              </div>
              <div style={{overflowY:"auto",maxHeight:isExpanded?480:undefined}}>
              {fluxData.map(function(d){
                var pOut=d.out/mx*100;var pIn=d.inn/mx*100;
                var net=d.net;var nLbl=net>1?"↑":net<-1?"↓":"≈";var nCol=net>1?"#00C853":net<-1?"#2979FF":"#78909C";
                var isAct=activeDomain===d.domain;
                return <div key={d.domain} style={{marginBottom:10,cursor:"pointer"}}
                  onMouseEnter={function(e){setChartTip({x:e.clientX,y:e.clientY,label:d.domain,val:d.out+"↑ · "+d.inn+"↓",pct:null});}}
                  onMouseMove={function(e){setChartTip(function(t){return t?Object.assign({},t,{x:e.clientX,y:e.clientY}):t;});}}
                  onMouseLeave={clearTip}
                  onClick={function(){setActiveDomain(d.domain);}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:10,color:isAct?"#2979FF":T.fg,fontWeight:isAct?700:400}}>{d.domain}</span>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:9,color:T.fgDim}}>{d.total} flux</span>
                      <span style={{fontSize:9,color:nCol,background:nCol+"18",borderRadius:3,padding:"1px 5px",fontWeight:700}}>{nLbl}{Math.abs(net)>1?" "+Math.abs(net):""}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",background:T.border}}>
                    <div style={{width:pOut+"%",background:"linear-gradient(90deg,#00C85366,#00C853)",transition:"width 0.5s ease"}}/>
                    <div style={{width:pIn+"%",background:"linear-gradient(90deg,#2979FF66,#2979FF)",transition:"width 0.5s ease"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:2,fontSize:8,color:T.fgMuted}}>
                    <span style={{color:"#00C853",fontWeight:600}}>{d.out}↑</span>
                    <span style={{color:"#2979FF",fontWeight:600}}>{d.inn}↓</span>
                  </div>
                </div>;
              })}
              </div>
            </div>;
          };
          var renderBarV=function(){
            var W=svgW;var H=svgH;
            var pad={l:40,r:10,t:30,b:50};var n=fluxData.length;
            var bW=Math.max(6,Math.floor((W-pad.l-pad.r)/n*0.45));
            var gap=(W-pad.l-pad.r)/n;
            return <div style={{overflowX:"auto"}}>
              <div style={{display:"flex",gap:12,marginBottom:6,fontSize:9}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:2,background:"#00C853"}}/>Sortants</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:2,background:"#2979FF"}}/>Entrants</span>
              </div>
              <svg width={W} height={H} style={{overflow:"visible"}}>
                <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H-pad.b} stroke={T.border} strokeWidth="1"/>
                <line x1={pad.l} y1={H-pad.b} x2={W-pad.r} y2={H-pad.b} stroke={T.border} strokeWidth="1"/>
                {fluxData.map(function(d,i){
                  var bhOut=Math.max(0,(d.out/mx3)*(H-pad.t-pad.b));
                  var bhIn=Math.max(0,(d.inn/mx3)*(H-pad.t-pad.b));
                  var cx=pad.l+i*gap+gap/2;
                  var xOut=cx-bW-2;var xIn=cx+2;
                  var yOut=H-pad.b-bhOut;var yIn=H-pad.b-bhIn;
                  var label=d.domain;
                  return <g key={d.domain} style={{cursor:"pointer"}}
                    onMouseMove={function(e){setChartTip({x:e.clientX,y:e.clientY,label:d.domain,val:d.out+"\u2191 sortants \xB7 "+d.inn+"\u2193 entrants",pct:null});}}
                    onMouseLeave={clearTip}
                    onClick={function(){setActiveDomain(d.domain);}}>
                    {bhOut>0&&<rect x={xOut} y={yOut} width={bW} height={bhOut} fill="#00C853" rx="2" opacity="0.85"/>}
                    {bhIn>0&&<rect x={xIn} y={yIn} width={bW} height={bhIn} fill="#2979FF" rx="2" opacity="0.85"/>}
                    {bhOut>0&&<text x={xOut+bW/2} y={yOut-4} textAnchor="middle" fill="#00C853" fontSize="9" fontWeight="700">{d.out}</text>}
                    {bhIn>0&&<text x={xIn+bW/2} y={yIn-4} textAnchor="middle" fill="#2979FF" fontSize="9" fontWeight="700">{d.inn}</text>}
                    <text x={cx} y={H-pad.b+14} textAnchor="middle" fill={T.fgMuted} fontSize="8" transform={"rotate(-30,"+cx+","+(H-pad.b+14)+")"}>{label.length>9?label.slice(0,8)+"\u2026":label}</text>
                  </g>;
                })}
              </svg>
            </div>;
          };
          var fluxSlices=fluxData.map(function(d){return{name:d.domain,value:d.total,color:(DC[d.domain]||DC.Autre).ac};});
          var renderCircle=function(useHole){
            var isNarrow=!isExpanded&&cw<420;
            var donutSz=isExpanded?320:Math.min(140,Math.max(96,cw/2.6));
            var donutR=Math.round(donutSz*0.434);var donutIr=Math.round(donutSz*0.276);
            var donutCx=Math.round(donutSz/2);var donutCy=Math.round(donutSz/2);
            var arcs=buildArcs(fluxSlices,totalFlux,donutCx,donutCy,donutR,useHole?donutIr:0);
            var isHovFl=hovSlice&&hovSlice.id==="flux";
            return <div style={{display:"flex",flexDirection:isNarrow?"column":"row",gap:isExpanded?28:(isNarrow?6:12),alignItems:isNarrow?"flex-start":"center",flex:isExpanded?1:undefined,minHeight:0}}>
              <svg width={donutSz} height={donutSz} viewBox={"0 0 "+(donutCx*2)+" "+(donutCy*2)} style={{flexShrink:0}} onMouseLeave={function(){setHovSlice(null);clearTip();}}>
                {arcs.map(function(p){
                  var h=isHovFl&&hovSlice.idx===p.idx;
                  var tx=h?Math.cos(p.mid)*6:0;var ty=h?Math.sin(p.mid)*6:0;
                  var op=isHovFl?(h?1:0.22):0.88;
                  return <path key={p.idx} d={p.d} fill={p.color} opacity={op} stroke={T.bg} strokeWidth="2.5"
                    transform={"translate("+tx.toFixed(1)+","+ty.toFixed(1)+")"}
                    style={{cursor:"pointer",transition:"opacity 0.12s"}}
                    onMouseMove={function(e){setHovSlice({id:"flux",idx:p.idx});setChartTip({x:e.clientX,y:e.clientY,label:p.name,val:p.value+" flux",pct:p.pct});}}
                    onMouseLeave={function(){setHovSlice(null);clearTip();}}
                    onClick={function(){setActiveDomain(p.name);}}/>;
                })}
                {useHole&&<text x={donutCx} y={donutCy-3} textAnchor="middle" fill={T.fg} fontSize={isExpanded?34:Math.round(donutSz*0.17)} fontWeight="800">{totalFlux}</text>}
                {useHole&&<text x={donutCx} y={donutCy+Math.round(donutSz*0.1)} textAnchor="middle" fill={T.fgMuted} fontSize={Math.max(6,Math.round(donutSz*0.055))} letterSpacing="0.08em">FLUX</text>}
              </svg>
              <div style={{flex:1,minWidth:0,overflowY:"auto",maxHeight:isExpanded?360:(isNarrow?110:160)}}>
                {arcs.map(function(p){return <div key={p.name} style={{display:"flex",alignItems:"center",gap:5,marginBottom:isNarrow?3:5}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                  <span style={{fontSize:isNarrow?9:10,color:T.fg,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                  <span style={{fontSize:isNarrow?9:10,fontWeight:700,color:p.color}}>{p.value}</span>
                </div>;})}
              </div>
            </div>;
          };
          var renderArea=function(){
            var W=svgW;var H=svgH;var n=fluxData.length;if(n<2)return renderBarV();
            var maxOut=Math.max.apply(null,fluxData.map(function(d){return d.out;}))||1;
            var maxIn=Math.max.apply(null,fluxData.map(function(d){return d.inn;}))||1;
            var ptsOut=fluxData.map(function(d,i){return{x:40+i*(W-80)/(n-1),y:(1-d.out/maxOut)*(H/2-30)+10,v:d.out,domain:d.domain};});
            var ptsIn=fluxData.map(function(d,i){return{x:40+i*(W-80)/(n-1),y:H/2+10+(1-d.inn/maxIn)*(H/2-40),v:d.inn,domain:d.domain};});
            var aOut="M"+ptsOut[0].x+" "+(H/2-10)+" L"+ptsOut.map(function(p){return p.x+" "+p.y;}).join(" L ")+" L"+ptsOut[n-1].x+" "+(H/2-10)+" Z";
            var aIn="M"+ptsIn[0].x+" "+H+" L"+ptsIn.map(function(p){return p.x+" "+p.y;}).join(" L ")+" L"+ptsIn[n-1].x+" "+H+" Z";
            return <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              <svg width={W} height={H} style={{overflow:"visible"}}>
                <defs>
                  <linearGradient id="flgOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00C853" stopOpacity="0.5"/><stop offset="100%" stopColor="#00C853" stopOpacity="0.04"/></linearGradient>
                  <linearGradient id="flgIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2979FF" stopOpacity="0.5"/><stop offset="100%" stopColor="#2979FF" stopOpacity="0.04"/></linearGradient>
                </defs>
                <text x="8" y="18" fill="#00C853" fontSize="9" fontWeight="700">Sortants</text>
                <path d={aOut} fill="url(#flgOut)"/>
                <path d={"M"+ptsOut.map(function(p){return p.x+" "+p.y;}).join(" L ")} fill="none" stroke="#00C853" strokeWidth="2"/>
                <text x="8" y={H/2+22} fill="#2979FF" fontSize="9" fontWeight="700">Entrants</text>
                <path d={aIn} fill="url(#flgIn)"/>
                <path d={"M"+ptsIn.map(function(p){return p.x+" "+p.y;}).join(" L ")} fill="none" stroke="#2979FF" strokeWidth="2"/>
                {ptsOut.map(function(p,i){return <text key={"l"+i} x={p.x} y={H-4} textAnchor="middle" fill={T.fgMuted} fontSize="8">{p.domain.length>6?p.domain.slice(0,5)+"…":p.domain}</text>;})}
              </svg>
            </div>;
          };
          return <div style={{background:T.bgCard,borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,0.14), 0 0 0 1px "+T.border,height:(isExpanded||wh)?"100%":undefined,display:(isExpanded||wh)?"flex":undefined,flexDirection:(isExpanded||wh)?"column":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:3,height:15,borderRadius:2,background:"#2979FF",flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:700,color:T.fg}}>Flux par domaine</span>
            </div>
            <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              {ctype==="hbar"?renderBarH():ctype==="bar"?renderBarV():ctype==="donut"?renderCircle(true):ctype==="pie"?renderCircle(false):renderArea()}
            </div>
          </div>;
        },mkChartSwitch(sid,[{k:"hbar",label:"Barres In/Out"}]));
        if(sid==="chart_owner")return wrapWidget(sid,"#6366F1","Apps par responsable",null,function(isExpanded,ww,wh){
          var apps=domApps(sid);
          var ownerMap={};
          apps.forEach(function(a){var o=a.owner&&a.owner.trim()?a.owner.trim():"Non renseigné";ownerMap[o]=(ownerMap[o]||0)+1;});
          var allOwners=Object.entries(ownerMap).map(function(e){return{owner:e[0],count:e[1]};}).sort(function(a,b){return b.count-a.count;});
          var assigned=allOwners.filter(function(d){return d.owner!=="Non renseigné";});
          var unassigned=ownerMap["Non renseigné"]||0;
          var displaySlices=assigned.concat(unassigned>0?[{owner:"Non renseigné",count:unassigned,isNA:true}]:[]);
          var total4=apps.length||1;
          var assignedN=total4-unassigned;var assignedPct=Math.round(assignedN/total4*100);
          var ownerCount=assigned.length;
          var oc=["#6366F1","#00C853","#EF6C00","#FF5252","#00BFA5","#F59E0B"];
          var ctype=chartTypes[sid]||"donut";
          var owSlices=displaySlices.map(function(d,i){
            var col=d.isNA?"#455A64":(d.isOther?"#546E7A":oc[i%oc.length]);
            return{name:d.owner,value:d.count,color:col,isNA:d.isNA||false,isOther:d.isOther||false};
          });
          var cw=ww||500;var isNarrow=!isExpanded&&cw<420;
          var donutSz=isExpanded?320:Math.min(140,Math.max(96,cw/2.6));
          var donutR=Math.round(donutSz*0.434);var donutIr=Math.round(donutSz*0.276);
          var donutCx=Math.round(donutSz/2);var donutCy=Math.round(donutSz/2);
          var renderCircle=function(useHole){
            var arcs=buildArcs(owSlices,total4,donutCx,donutCy,donutR,useHole?donutIr:0);
            var isHovOwn=hovSlice&&hovSlice.id==="owner";
            return <div style={{display:"flex",flexDirection:isNarrow?"column":"row",gap:isExpanded?28:(isNarrow?6:12),alignItems:isNarrow?"flex-start":"flex-start",flex:isExpanded?1:undefined,minHeight:0}}>
              <svg width={donutSz} height={donutSz} viewBox={"0 0 "+(donutCx*2)+" "+(donutCy*2)} style={{flexShrink:0}} onMouseLeave={function(){setHovSlice(null);clearTip();}}>
                {arcs.map(function(p,i){
                  var sl=owSlices[i]||{};
                  var h=isHovOwn&&hovSlice.idx===p.idx;
                  var tx=h?Math.cos(p.mid)*6:0;var ty=h?Math.sin(p.mid)*6:0;
                  var op=isHovOwn?(h?1:0.2):(sl.isNA||sl.isOther?0.38:0.88);
                  return <path key={p.idx} d={p.d} fill={p.color} opacity={op} stroke={T.bg} strokeWidth="2.5"
                    transform={"translate("+tx.toFixed(1)+","+ty.toFixed(1)+")"}
                    style={{cursor:"pointer",transition:"opacity 0.12s"}}
                    onMouseMove={function(e){setHovSlice({id:"owner",idx:p.idx});setChartTip({x:e.clientX,y:e.clientY,label:p.name,val:p.value+" apps",pct:sl.isNA||sl.isOther?null:p.pct});}}
                    onMouseLeave={function(){setHovSlice(null);clearTip();}}/>;
                })}
                {useHole&&<text x={donutCx} y={donutCy-3} textAnchor="middle" fill={T.fg} fontSize={isExpanded?34:Math.round(donutSz*0.17)} fontWeight="800">{ownerCount}</text>}
                {useHole&&<text x={donutCx} y={donutCy+Math.round(donutSz*0.1)} textAnchor="middle" fill={T.fgMuted} fontSize={Math.max(5,Math.round(donutSz*0.048))} letterSpacing="0.06em">RESPONSABLES</text>}
              </svg>
              <div style={{flex:1,minWidth:0,maxHeight:isExpanded?360:(isNarrow?110:150),overflowY:"auto",paddingRight:2}}>
                {owSlices.map(function(p,i){return <div key={p.name} style={{display:"flex",alignItems:"center",gap:5,marginBottom:isNarrow?3:5}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:p.color,flexShrink:0,opacity:p.isNA?0.5:1}}/>
                  <span style={{fontSize:10,color:p.isNA?T.fgMuted:T.fg,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontStyle:p.isNA?"italic":"normal"}}>{p.name}</span>
                  <span style={{fontSize:10,fontWeight:700,color:p.color,opacity:p.isNA?0.7:1}}>{p.value}</span>
                </div>;})}
              </div>
            </div>;
          };
          var renderBarV=function(){
            var sorted=[...owSlices].sort(function(a,b){return b.value-a.value;}).slice(0,15);
            var mx4=Math.max.apply(null,sorted.map(function(s){return s.value;}))||1;
            var W=isExpanded?560:Math.max(160,cw-56);var H=isExpanded?300:180;
            var pad={l:40,r:10,t:30,b:50};var n=sorted.length;
            var bW=Math.max(8,Math.floor((W-pad.l-pad.r)/n*0.55));
            var gap=(W-pad.l-pad.r)/n;
            return <div style={{overflowX:"auto"}}>
              <svg width={W} height={H} style={{overflow:"visible"}}>
                <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H-pad.b} stroke={T.border} strokeWidth="1"/>
                <line x1={pad.l} y1={H-pad.b} x2={W-pad.r} y2={H-pad.b} stroke={T.border} strokeWidth="1"/>
                {sorted.map(function(sl,i){
                  var bh=Math.max(2,(sl.value/mx4)*(H-pad.t-pad.b));
                  var x=pad.l+i*gap+gap/2-bW/2;var y=H-pad.b-bh;
                  var label=sl.name;
                  return <g key={sl.name} style={{cursor:"pointer"}}
                    onMouseMove={function(e){setChartTip({x:e.clientX,y:e.clientY,label:sl.name,val:sl.value+" apps",pct:Math.round(sl.value/total4*100)});}}
                    onMouseLeave={clearTip}>
                    <rect x={x} y={y} width={bW} height={bh} fill={sl.color} rx="3" opacity={sl.isNA?0.38:0.85}/>
                    <text x={x+bW/2} y={y-5} textAnchor="middle" fill={sl.color} fontSize="10" fontWeight="700">{sl.value}</text>
                    <text x={x+bW/2} y={H-pad.b+14} textAnchor="middle" fill={T.fgMuted} fontSize="8" transform={"rotate(-30,"+(x+bW/2)+","+(H-pad.b+14)+")"}>{label.length>9?label.slice(0,8)+"\u2026":label}</text>
                  </g>;
                })}
              </svg>
            </div>;
          };
          var renderArea=function(){
            var sorted=[...owSlices].sort(function(a,b){return b.value-a.value;});
            var W=isExpanded?560:280;var H=isExpanded?280:150;var n=sorted.length;var maxV=Math.max.apply(null,sorted.map(function(s){return s.value;}))||1;
            if(n<2)return renderBarV();
            var pts=sorted.map(function(sl,i){return{x:40+i*(W-80)/(n-1),y:(1-sl.value/maxV)*(H-60)+20,sl:sl};});
            var areaD="M"+pts[0].x+" "+(H-30)+" L"+pts.map(function(p){return p.x+" "+p.y;}).join(" L ")+" L"+pts[pts.length-1].x+" "+(H-30)+" Z";
            var lineD="M"+pts.map(function(p){return p.x+" "+p.y;}).join(" L ");
            var gradId="owg_"+sid;
            return <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              <svg width={W} height={H} style={{overflow:"visible"}}>
                <defs><linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity="0.5"/><stop offset="100%" stopColor="#6366F1" stopOpacity="0.04"/></linearGradient></defs>
                <path d={areaD} fill={"url(#"+gradId+")"} />
                <path d={lineD} fill="none" stroke="#6366F1" strokeWidth="2"/>
                {pts.map(function(p,i){return <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill={p.sl.color} stroke={T.bg} strokeWidth="2"
                    onMouseMove={function(e){setChartTip({x:e.clientX,y:e.clientY,label:p.sl.name,val:p.sl.value+" apps",pct:Math.round(p.sl.value/total4*100)});}}
                    onMouseLeave={clearTip}/>
                  <text x={p.x} y={p.y-10} textAnchor="middle" fill={p.sl.color} fontSize="10" fontWeight="700">{p.sl.value}</text>
                  <text x={p.x} y={H-14} textAnchor="middle" fill={T.fgMuted} fontSize="8">{p.sl.name.length>6?p.sl.name.slice(0,5)+"…":p.sl.name}</text>
                </g>;})}
              </svg>
            </div>;
          };
          return <div style={{background:T.bgCard,borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,0.14), 0 0 0 1px "+T.border,height:(isExpanded||wh)?"100%":undefined,display:(isExpanded||wh)?"flex":undefined,flexDirection:(isExpanded||wh)?"column":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:3,height:15,borderRadius:2,background:"#6366F1",flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:700,color:T.fg}}>Apps par responsable</span>
            </div>
            <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              {ctype==="donut"?renderCircle(true):ctype==="pie"?renderCircle(false):ctype==="bar"?renderBarV():renderArea()}
            </div>
          </div>;
        },mkChartSwitch(sid));
        if(sid==="chart_criticality")return wrapWidget(sid,"#EF4444","Criticité du portefeuille",null,function(isExpanded,ww,wh){
          var totalPortfolio=apps.length||1;
          var levels=[
            {label:"Haute",color:"#EF4444"},
            {label:"Moyenne",color:"#F59E0B"},
            {label:"Basse",color:"#10B981"},
            {label:"Non renseignée",color:"#94A3B8"},
          ].map(function(level){
            var count=level.label==="Non renseignée"
              ?apps.filter(function(a){return !["Haute","Moyenne","Basse"].includes(a.criticality);}).length
              :apps.filter(function(a){return a.criticality===level.label;}).length;
            return Object.assign({},level,{count:count,pct:Math.round(count/totalPortfolio*100)});
          });
          var criticalPct=Math.round((totC/totalPortfolio)*100);
          return <div className="dashboard-widget-surface" style={{background:T.bgCard,borderRadius:16,padding:18,boxShadow:"0 8px 24px rgba(30,27,75,.07), 0 0 0 1px "+T.border,height:(isExpanded||wh)?"100%":undefined,display:(isExpanded||wh)?"flex":undefined,flexDirection:(isExpanded||wh)?"column":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <div style={{width:34,height:34,borderRadius:11,display:"grid",placeItems:"center",background:"linear-gradient(145deg,#EF444426,#EF44440A)",color:"#EF4444",fontSize:16}}>⚑</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:750,color:T.fg}}>Criticité des applications</div><div style={{fontSize:9,color:T.fgMuted,marginTop:2}}>Répartition réelle du portefeuille</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:800,color:"#EF4444",lineHeight:1}}>{totC}</div><div style={{fontSize:9,color:T.fgMuted,marginTop:3}}>haute · {criticalPct}%</div></div>
            </div>
            {(chartTypes.chart_criticality==="matrix")?function(){
              var isNR=function(a){return!["Haute","Moyenne","Basse"].includes(a.criticality);};
              var inCell=function(r,c){return r.apps.filter(function(a){return c.label==="Non renseignée"?isNR(a):a.criticality===c.label;});};
              var cols=levels.filter(function(l){return l.label!=="Non renseignée"||l.count>0;});
              var rowsM=st.map(function(d){return{domain:d.domain,apps:d.apps};}).sort(function(a,b){return b.apps.length-a.apps.length;});
              var maxCell=1;
              rowsM.forEach(function(r){cols.forEach(function(c){var n=inCell(r,c).length;if(n>maxCell)maxCell=n;});});
              return <div style={{overflow:"auto",flex:(isExpanded||wh)?1:undefined,minHeight:0}}>
                <div style={{display:"grid",gridTemplateColumns:"minmax(80px,1.2fr) repeat("+cols.length+",minmax(56px,1fr))",gap:4,fontSize:10}}>
                  <div/>
                  {cols.map(function(c){return <div key={c.label} style={{textAlign:"center",fontWeight:800,color:c.color,padding:"4px 2px",fontSize:9.5}}>{c.label}</div>;})}
                  {rowsM.map(function(r){
                    return [<div key={r.domain+"-l"} style={{display:"flex",alignItems:"center",gap:6,color:T.fg,fontWeight:700,minWidth:0}}><span style={{width:7,height:7,borderRadius:2,background:(DC[r.domain]||DC.Autre).ac,flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={r.domain}>{r.domain}</span></div>].concat(cols.map(function(c){
                      var list=inCell(r,c);
                      var alpha=list.length?(0.14+0.5*list.length/maxCell):0;
                      return <div key={r.domain+c.label} title={list.length?c.label+" · "+r.domain+" : "+list.map(function(a){return a.name;}).join(", "):"Aucune application"}
                        onClick={list.length?function(){setSelApp(list[0]);}:undefined}
                        style={{minHeight:42,borderRadius:8,background:list.length?c.color+Math.round(alpha*255).toString(16).padStart(2,"0"):T.bgAlt,border:"1px solid "+(list.length?c.color+"55":T.border),display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3px 2px",cursor:list.length?"pointer":"default"}}>
                        <span style={{fontSize:15,fontWeight:850,color:list.length?T.fg:T.fgFaint}}>{list.length||"·"}</span>
                        {list.length>0&&<span style={{fontSize:8,color:T.fgMuted,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{list.slice(0,2).map(function(a){return a.name;}).join(", ")}{list.length>2?" +"+(list.length-2):""}</span>}
                      </div>;
                    }));
                  })}
                </div>
                <div style={{fontSize:9,color:T.fgMuted,marginTop:10}}>Domaine × criticité · cliquez une case pour ouvrir une application</div>
              </div>;
            }():<>
            <div style={{display:"flex",height:10,borderRadius:8,overflow:"hidden",background:T.border,marginBottom:16}}>
              {levels.map(function(level){return level.count>0&&<div key={level.label} title={level.label+": "+level.count} style={{width:level.pct+"%",background:"linear-gradient(90deg,"+level.color+"99,"+level.color+")",transition:"width .6s cubic-bezier(.16,1,.3,1)"}}/>;})}
            </div>
            <div style={{display:"grid",gap:12}}>
              {levels.map(function(level){return <div key={level.label}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:10,marginBottom:5}}>
                  <span style={{display:"flex",alignItems:"center",gap:7,color:T.fg}}><span style={{width:8,height:8,borderRadius:3,background:level.color,boxShadow:"0 0 10px "+level.color+"55"}}/>{level.label}</span>
                  <span style={{color:T.fgMuted,fontVariantNumeric:"tabular-nums"}}><b style={{color:T.fg,marginRight:6}}>{level.count}</b>{level.pct}%</span>
                </div>
                <div className="dashboard-meter-track"><span style={{width:level.pct+"%",background:"linear-gradient(90deg,"+level.color+"99,"+level.color+")"}}/></div>
              </div>;})}
            </div></>}
          </div>;
        },mkChartSwitch("chart_criticality",null,[{k:"bars",label:"Répartition"},{k:"matrix",label:"Matrice"}]));
        if(sid==="critical_apps")return wrapWidget(sid,"#EF4444","Top 10 — Applications critiques",null,function(isExpanded,ww,wh){
          var severityWeight={Critique:4,Haute:3,Moyenne:2,Basse:1};
          var severityColor={Critique:"#B91C1C",Haute:"#EF4444",Moyenne:"#F59E0B",Basse:"#10B981"};
          var ranked=apps.map(function(app){
            var incoming=flows.filter(function(flow){return flow.to===app.id;}).length;
            var outgoing=flows.filter(function(flow){return flow.from===app.id;}).length;
            return{app:app,incoming:incoming,outgoing:outgoing,degree:incoming+outgoing,weight:severityWeight[app.criticality]||0};
          }).sort(function(a,b){return b.weight-a.weight||b.degree-a.degree||String(a.app.name||"").localeCompare(String(b.app.name||""));});
          var top10=ranked.filter(function(item){return item.weight>=2;}).slice(0,10);
          if(top10.length<10)top10=top10.concat(ranked.filter(function(item){return item.weight<2;}).slice(0,10-top10.length));
          var selected=top10.find(function(item){return item.app.id===selectedCriticalApp;})||top10[0];
          var maxDegree=Math.max.apply(null,top10.map(function(item){return item.degree;}).concat([1]));
          var highCount=apps.filter(function(app){return app.criticality==="Critique"||app.criticality==="Haute";}).length;
          var selectedFlows=[];
          if(selected){
            var seenPeers={};
            selectedFlows=flows.filter(function(flow){return flow.from===selected.app.id||flow.to===selected.app.id;}).filter(function(flow){var peerId=flow.from===selected.app.id?flow.to:flow.from;if(seenPeers[peerId])return false;seenPeers[peerId]=true;return true;}).slice(0,3);
          }
          var cardWidth=ww||500;
          return <div className="dashboard-widget-surface critical-apps-widget" style={{background:T.bgCard,borderRadius:16,padding:18,boxShadow:"0 8px 24px rgba(30,27,75,.07), 0 0 0 1px "+T.border,height:(isExpanded||wh)?"100%":undefined,display:(isExpanded||wh)?"flex":undefined,flexDirection:(isExpanded||wh)?"column":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingRight:82}}>
              <div style={{width:36,height:36,borderRadius:12,display:"grid",placeItems:"center",background:"linear-gradient(145deg,#EF44442b,#F9731620)",color:"#EF4444",fontSize:16,boxShadow:"0 5px 16px #EF444422"}}>⚠</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:800,color:T.fg}}>Applications à traiter en priorité</div><div style={{fontSize:9,color:T.fgMuted,marginTop:2}}>Criticité, puis nombre de liaisons directes</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:18,fontWeight:850,color:"#EF4444",lineHeight:1}}>{top10.length}<span style={{fontSize:10,color:T.fgMuted,fontWeight:600}}> / 10</span></div><div style={{fontSize:8,color:T.fgMuted,marginTop:3}}>dont {highCount} haute(s)</div></div>
            </div>
            {!top10.length?<div style={{flex:1,display:"grid",placeItems:"center",fontSize:11,color:T.fgMuted}}>Aucune application à afficher.</div>:<>
              <div className="critical-apps-list" style={{flex:1,minHeight:0,overflowY:"auto",display:"grid",gap:5,paddingRight:3}}>
                {top10.map(function(item,index){
                  var selectedId=selected&&selected.app.id===item.app.id;
                  var color=severityColor[item.app.criticality]||"#94A3B8";
                  var barPct=Math.round(item.degree/maxDegree*100);
                  return <button key={item.app.id} className="critical-app-row" aria-pressed={selectedId} onClick={function(){setSelectedCriticalApp(item.app.id);}} style={{width:"100%",display:"grid",gridTemplateColumns:cardWidth<430?"24px minmax(0,1fr) auto":"28px minmax(0,1.35fr) minmax(74px,.8fr) minmax(76px,.85fr)",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:10,border:"1px solid "+(selectedId?color+"66":T.border),background:selectedId?color+"12":T.bgAlt,color:T.fg,textAlign:"left",cursor:"pointer",transition:"background .18s,border-color .18s,transform .18s"}}>
                    <span style={{width:22,height:22,borderRadius:7,display:"grid",placeItems:"center",background:selectedId?color+"24":T.bgCard,color:selectedId?color:T.fgMuted,fontSize:9,fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{String(index+1).padStart(2,"0")}</span>
                    <span style={{minWidth:0}}><span style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:10,fontWeight:700}}>{item.app.name||"Application sans nom"}</span><span style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:8,color:T.fgMuted,marginTop:2}}>{item.app.domain||"Domaine non renseigné"}</span></span>
                    {cardWidth>=430&&<span style={{justifySelf:"start",fontSize:8,fontWeight:750,color:color,padding:"4px 7px",borderRadius:99,background:color+"19",whiteSpace:"nowrap"}}>{item.app.criticality||"Non définie"}</span>}
                    <span style={{minWidth:0}}><span style={{display:"flex",justifyContent:"space-between",fontSize:8,color:T.fgMuted,marginBottom:4}}><span>Flux</span><b style={{color:T.fg,fontSize:9}}>{item.degree}<span style={{color:"#06B6D4",fontWeight:500}}> · {item.incoming}↓ {item.outgoing}↑</span></b></span><span className="dashboard-meter-track" style={{display:"block",height:4}}><span style={{width:barPct+"%",background:"linear-gradient(90deg,"+color+"77,"+color+")"}}/></span></span>
                  </button>;
                })}
              </div>
              {selected&&<div className="critical-app-detail" style={{marginTop:10,padding:"9px 11px",borderRadius:11,background:"linear-gradient(110deg,#EF444414,#8B5CF60A)",border:"1px solid #EF444428"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:5}}><span style={{fontSize:9,fontWeight:800,color:T.fg}}>Liaisons directes · {selected.app.name||"Application"}</span><span style={{fontSize:8,color:severityColor[selected.app.criticality]||T.fgMuted,fontWeight:700}}>{selected.incoming} entrante(s) · {selected.outgoing} sortante(s)</span></div>
                {selectedFlows.length?selectedFlows.map(function(flow,index){var isOutbound=flow.from===selected.app.id;var peer=apps.find(function(app){return app.id===(isOutbound?flow.to:flow.from);});return <div key={flow.id||index} style={{display:"flex",alignItems:"center",gap:6,fontSize:8,color:T.fgMuted,marginTop:3}}><span style={{color:isOutbound?"#06B6D4":"#8B5CF6",fontWeight:800}}>{isOutbound?"→ sortant":"← entrant"}</span><span style={{color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{peer?peer.name:"Application inconnue"}</span><span style={{marginLeft:"auto",whiteSpace:"nowrap"}}>{flow.protocol||flow.frequency||"Interface"}</span></div>;}):<div style={{fontSize:8,color:T.fgMuted}}>Aucune liaison directe enregistrée.</div>}
              </div>}
            </>}
          </div>;
        });
        if(sid==="it_budget")return wrapWidget(sid,"#10B981","Budget & coûts IT",null,function(isExpanded,ww,wh){
          return <ItsiBudgetWidget apps={domApps("it_budget")} T={T} expanded={isExpanded} fillHeight={!!(isExpanded||wh)} colorOf={function(d){return (DC[d]||DC.Autre).ac;}} chartType={chartTypes.it_budget||"bars"}/>;
        },mkChartSwitch("it_budget",null,ITSI_CHART_OPTS));
        if(sid==="it_patrimoine")return wrapWidget(sid,"#6366F1","Patrimoine applicatif",null,function(isExpanded,ww,wh){
          return <ItsiPatrimoineWidget apps={domApps("it_patrimoine")} T={T} expanded={isExpanded} fillHeight={!!(isExpanded||wh)} chartType={chartTypes.it_patrimoine||"bars"}/>;
        },mkChartSwitch("it_patrimoine",null,ITSI_CHART_OPTS));
        if(sid==="carveout")return wrapWidget(sid,"#F59E0B","Trajectoires D1/D2",null,<div style={{background:T.bgCard,borderRadius:8,padding:20,border:"1px solid #F59E0B44"}}>
        <SectionHdr id="carveout" title="Trajectoires Carve-Out — Suivi Day 1 / Day 2"/>
        {!hiddenSections.includes("carveout")&&function(){
          var apps=domApps("carveout");var flows=domFlows("carveout");
          var d1Def=apps.filter(function(a){return a.statusD1;});
          var d2Def=apps.filter(function(a){return a.statusD2;});
          var riskApps=apps.filter(function(a){return a.statusD1==="Abandon"&&flows.some(function(f){return f.from===a.id||f.to===a.id;});});
          var tot3=apps.length||1;
          var coKpis=[
            {v:d1Def.length,l:"Apps avec D1",c:"#F59E0B",glow:"rgba(245,158,11,0.18)",icon:"①"},
            {v:d2Def.length,l:"Apps avec D2",c:"#8B5CF6",glow:"rgba(139,92,246,0.18)",icon:"②"},
            {v:apps.filter(function(a){return!a.statusD1&&!a.statusD2;}).length,l:"Sans trajectoire",c:"#78909C",glow:"rgba(120,144,156,0.12)",icon:"○"},
            {v:riskApps.length,l:"Abandon D1 + flux",c:"#EF4444",glow:"rgba(239,68,68,0.18)",icon:"⚠"},
          ];
          var d2Cols=["Clone & Clean","Transfert","Abandon","Rebuild"];
          var d1Rows=["Transfert TSA","Maintien","Rebuild","Abandon"];
          var allMatrixN=d1Rows.map(function(d1){return d2Cols.map(function(d2){return apps.filter(function(a){return a.statusD1===d1&&a.statusD2===d2;}).length;});}).flat();
          var mxMat=Math.max.apply(null,allMatrixN)||1;
          return <div>
            {/* KPI cards avec glow */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
              {coKpis.map(function(k){return <div key={k.l} style={{background:T.bgCard,borderRadius:10,padding:"12px 14px",boxShadow:"0 0 0 1px "+T.border+", 0 4px 14px "+k.glow,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:7,background:k.glow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:k.c,flexShrink:0}}>{k.icon}</div>
                <div><div style={{fontSize:20,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div><div style={{fontSize:9,color:T.fgMuted,marginTop:3,lineHeight:1.3}}>{k.l}</div></div>
              </div>;})}
            </div>
            {/* Donuts D1/D2 avec jauges */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginBottom:16}}>
              {[{title:"Day 1 — Closing",opts:["Transfert TSA","Maintien","Rebuild","Abandon"],colors:SD1,field:"statusD1",defN:d1Def.length,ac:"#F59E0B"},{title:"Day 2 — Cible",opts:["Clone & Clean","Transfert","Abandon","Rebuild"],colors:SD2,field:"statusD2",defN:d2Def.length,ac:"#8B5CF6"}].map(function(cfg){
                var data3=cfg.opts.map(function(s){return{s:s,n:apps.filter(function(a){return a[cfg.field]===s;}).length};}).concat([{s:"Non défini",n:apps.filter(function(a){return!a[cfg.field];}).length}]).filter(function(d){return d.n>0;});
                var cumA=0;var hovId="co_"+cfg.field;
                var arcs=data3.map(function(d,i){
                  var sa=cumA/tot3*Math.PI*2-Math.PI/2;cumA+=d.n;var ea=cumA/tot3*Math.PI*2-Math.PI/2;
                  var mid=(sa+ea)/2;var r=60,ir=38,cx=70,cy=70;
                  var x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa),x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea);
                  var ix1=cx+ir*Math.cos(sa),iy1=cy+ir*Math.sin(sa),ix2=cx+ir*Math.cos(ea),iy2=cy+ir*Math.sin(ea);
                  var lg=d.n/tot3>0.5?1:0;var col=cfg.colors[d.s]||"#78909C";
                  var dp="M"+ix1+" "+iy1+" L"+x1+" "+y1+" A"+r+" "+r+" 0 "+lg+" 1 "+x2+" "+y2+" L"+ix2+" "+iy2+" A"+ir+" "+ir+" 0 "+lg+" 0 "+ix1+" "+iy1;
                  return{dp:dp,col:col,label:d.s,n:d.n,pct:Math.round(d.n/tot3*100),isNA:d.s==="Non défini",mid:mid,idx:i};
                });
                var isHovCo=hovSlice&&hovSlice.id===hovId;
                var defPct=Math.round(cfg.defN/tot3*100);
                return <div key={cfg.field} style={{background:T.bgAlt,borderRadius:10,padding:16,border:"1px solid "+T.border}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.fg,marginBottom:12}}>{cfg.title}</div>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                    <svg width="140" height="140" viewBox="0 0 140 140" style={{flexShrink:0}} onMouseLeave={function(){setHovSlice(null);clearTip();}}>
                      {arcs.map(function(p){
                        var h=isHovCo&&hovSlice.idx===p.idx;
                        var tx=h?Math.cos(p.mid)*6:0;var ty=h?Math.sin(p.mid)*6:0;
                        var op=isHovCo?(h?1:0.2):(p.isNA?0.18:0.88);
                        return <path key={p.idx} d={p.dp} fill={p.col} opacity={op} stroke={T.bgAlt} strokeWidth="2"
                          transform={"translate("+tx.toFixed(1)+","+ty.toFixed(1)+")"}
                          style={{cursor:"pointer",transition:"opacity 0.12s"}}
                          onMouseMove={function(e){setHovSlice({id:hovId,idx:p.idx});setChartTip({x:e.clientX,y:e.clientY,label:p.label,val:p.n+" apps",pct:p.isNA?null:p.pct});}}
                          onMouseLeave={function(){setHovSlice(null);clearTip();}}/>;
                      })}
                      <text x="70" y="65" textAnchor="middle" fill={T.fg} fontSize="20" fontWeight="800">{cfg.defN}</text>
                      <text x="70" y="80" textAnchor="middle" fill={cfg.ac} fontSize="9" fontWeight="700">{defPct}% définis</text>
                    </svg>
                    <div style={{fontSize:10,flex:1}}>{arcs.map(function(p){return <div key={p.label} style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
                      <div style={{width:8,height:8,borderRadius:2,background:p.col,flexShrink:0,opacity:p.isNA?0.25:1}}/>
                      <span style={{flex:1,color:p.isNA?T.fgMuted:T.fg,fontStyle:p.isNA?"italic":"normal",fontSize:10}}>{p.label}</span>
                      <span style={{color:p.col,fontWeight:700,opacity:p.isNA?0.4:1}}>{p.n}</span>
                    </div>;})}
                    </div>
                  </div>
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.fgMuted,marginBottom:4}}>
                      <span>Couverture {cfg.title.split("—")[0].trim()}</span>
                      <span style={{fontWeight:700,color:cfg.ac}}>{cfg.defN}/{tot3} · {defPct}%</span>
                    </div>
                    <div style={{height:5,background:T.border,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:defPct+"%",borderRadius:3,background:"linear-gradient(90deg,"+cfg.ac+"88,"+cfg.ac+")",transition:"width 0.7s cubic-bezier(.4,0,.2,1)"}}/>
                    </div>
                  </div>
                </div>;
              })}
            </div>
            {/* Heatmap matrice D1 → D2 */}
            {d1Def.length>0&&d2Def.length>0&&<div style={{background:T.bgAlt,borderRadius:10,padding:16,border:"1px solid "+T.border}}>
              <div style={{fontSize:11,fontWeight:700,color:T.fg,marginBottom:12}}>Matrice D1 → D2</div>
              <table style={{borderCollapse:"collapse",fontSize:10,width:"100%"}}>
                <thead><tr>
                  <th style={{padding:"6px 10px",color:T.fgDim,textAlign:"left",borderBottom:"1px solid "+T.border,fontSize:9}}> </th>
                  {d2Cols.map(function(d2){return <th key={d2} style={{padding:"6px 8px",color:SD2[d2],fontWeight:700,borderBottom:"1px solid "+T.border,textAlign:"center",fontSize:10}}>{d2==="Clone & Clean"?"Clone":d2}</th>;})}
                  <th style={{padding:"6px 8px",color:T.fgDim,borderBottom:"1px solid "+T.border,textAlign:"center",fontSize:9}}>N/A</th>
                </tr></thead>
                <tbody>{d1Rows.map(function(d1){return <tr key={d1}>
                  <td style={{padding:"7px 10px",color:SD1[d1],fontWeight:700,borderBottom:"1px solid "+T.border,fontSize:10}}>{d1==="Transfert TSA"?"TSA":d1}</td>
                  {d2Cols.map(function(d2){
                    var n=apps.filter(function(a){return a.statusD1===d1&&a.statusD2===d2;}).length;
                    var contra=d1==="Abandon"&&d2==="Rebuild";
                    var intensity=n>0?Math.round(n/mxMat*100):0;
                    var bg=n>0?(contra?"rgba(239,68,68,"+(0.1+intensity/100*0.5)+")":"rgba("+hexToRgbCo(SD2[d2]||"#666")+","+(0.08+intensity/100*0.45)+")"):"transparent";
                    return <td key={d2} style={{padding:"8px",textAlign:"center",borderBottom:"1px solid "+T.border,background:bg,color:n>0?(contra?"#EF4444":(SD2[d2]||"#888")):T.fgFaint,fontWeight:n>0?800:400,fontSize:n>0?12:10,transition:"background 0.2s"}}>
                      {n>0?n:"—"}
                    </td>;
                  })}
                  <td style={{padding:"7px 8px",textAlign:"center",borderBottom:"1px solid "+T.border,color:T.fgDim,fontSize:10}}>{apps.filter(function(a){return a.statusD1===d1&&!a.statusD2;}).length||"—"}</td>
                </tr>;})}
                </tbody>
              </table>
              {riskApps.length>0&&<div style={{marginTop:12,padding:"8px 12px",background:"#EF444415",border:"1px solid #EF444440",borderRadius:7,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13}}>⚠</span><span style={{fontSize:11,color:"#EF4444",fontWeight:600}}>Abandon D1 avec flux actifs : </span><span style={{fontSize:10,color:"#EF4444"}}>{riskApps.map(function(a){return a.name;}).join(", ")}</span></div>}
            </div>}
          </div>;
        }()}
      </div>);
        if(sid==="flowreg")return wrapWidget(sid,"#2979FF","Registre des flux",null,<div style={{background:T.bgCard,borderRadius:8,padding:20}}>
          <SectionHdr id="flowreg" title={"REGISTRE D'ÉCHANGES DES FLUX ("+flows.length+")"} extra={<span style={{fontSize:11,color:T.fgMuted}}>Séquençier technique complet des interconnexions IT</span>}/>
          {!hiddenSections.includes("flowreg")&&function(){
            // Compute unique values for each column
            var enriched=flows.map(function(f,fi){
              var fa=apps.find(function(a){return a.id===f.from;});
              var ta=apps.find(function(a){return a.id===f.to;});
            return{f:f,fi:fi,srcName:fa?fa.name:"?",srcDom:fa?fa.domain:"?",tgtName:ta?ta.name:"?",tgtDom:ta?ta.domain:"?",proto:f.protocol||"",freq:f.frequency||"",desc:f.label||f.description||""};
          });
          var uniq=function(arr){return[...new Set(arr)].filter(Boolean).sort();};
          var uSrcApp=uniq(enriched.map(function(e){return e.srcName;}));
          var uSrcDom=uniq(enriched.map(function(e){return e.srcDom;}));
          var uTgtApp=uniq(enriched.map(function(e){return e.tgtName;}));
          var uTgtDom=uniq(enriched.map(function(e){return e.tgtDom;}));
          var uProto=uniq(enriched.map(function(e){return e.proto;}));
          var uFreq=uniq(enriched.map(function(e){return e.freq;}));
          var uDesc=uniq(enriched.map(function(e){return e.desc;}));
          var filtered2=enriched.filter(function(e){
            if(fSrcApp&&e.srcName!==fSrcApp)return false;
            if(fSrcDom&&e.srcDom!==fSrcDom)return false;
            if(fTgtApp&&e.tgtName!==fTgtApp)return false;
            if(fTgtDom&&e.tgtDom!==fTgtDom)return false;
            if(fProto&&e.proto!==fProto)return false;
            if(fFreq&&e.freq!==fFreq)return false;
            if(fDesc&&e.desc!==fDesc)return false;
            if(flxSearch){var q=flxSearch.toLowerCase();if((e.srcName+e.tgtName+e.desc).toLowerCase().indexOf(q)<0)return false;}
            return true;
          });
          var hasFilter=fSrcApp||fSrcDom||fTgtApp||fTgtDom||fProto||fFreq||fDesc||flxSearch;
          var activeFilterCount=[fSrcApp,fSrcDom,fTgtApp,fTgtDom,fProto,fFreq,fDesc].filter(Boolean).length;
          var selSt={background:T.bgInput,border:"1px solid "+T.border,borderRadius:4,padding:"4px 6px",color:T.fg,fontSize:10,cursor:"pointer",width:"100%"};
          var selAct=Object.assign({},selSt,{borderColor:"#2979FF",background:"#2979FF10"});
          var clearAll=function(){setFlxSearch("");setFSrcApp("");setFSrcDom("");setFTgtApp("");setFTgtDom("");setFProto("");setFFreq("");setFDesc("");};
          return <div style={{display:"flex",gap:0}}>
            {/* Panneau latéral de filtres */}
            {showFlxFilter&&<div style={{width:220,flexShrink:0,background:T.bgAlt,borderRadius:8,padding:14,marginRight:12,border:"1px solid "+T.border,alignSelf:"flex-start",position:"sticky",top:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:11,fontWeight:700,color:T.fg}}>Filtres</span>
                {activeFilterCount>0&&<button onClick={clearAll} style={{background:"#FF525215",color:"#FF5252",border:"none",borderRadius:4,padding:"2px 6px",fontSize:9,cursor:"pointer"}}>Effacer ({activeFilterCount})</button>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div><div style={{fontSize:9,color:T.fgMuted,marginBottom:3,textTransform:"uppercase",fontWeight:600}}>Application source</div><select value={fSrcApp} onChange={function(e){setFSrcApp(e.target.value);}} style={fSrcApp?selAct:selSt}><option value="">Toutes</option>{uSrcApp.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:9,color:T.fgMuted,marginBottom:3,textTransform:"uppercase",fontWeight:600}}>Domaine source</div><select value={fSrcDom} onChange={function(e){setFSrcDom(e.target.value);}} style={fSrcDom?selAct:selSt}><option value="">Tous</option>{uSrcDom.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:9,color:T.fgMuted,marginBottom:3,textTransform:"uppercase",fontWeight:600}}>Application cible</div><select value={fTgtApp} onChange={function(e){setFTgtApp(e.target.value);}} style={fTgtApp?selAct:selSt}><option value="">Toutes</option>{uTgtApp.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:9,color:T.fgMuted,marginBottom:3,textTransform:"uppercase",fontWeight:600}}>Domaine cible</div><select value={fTgtDom} onChange={function(e){setFTgtDom(e.target.value);}} style={fTgtDom?selAct:selSt}><option value="">Tous</option>{uTgtDom.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:9,color:T.fgMuted,marginBottom:3,textTransform:"uppercase",fontWeight:600}}>Protocole</div><select value={fProto} onChange={function(e){setFProto(e.target.value);}} style={fProto?selAct:selSt}><option value="">Tous</option>{uProto.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:9,color:T.fgMuted,marginBottom:3,textTransform:"uppercase",fontWeight:600}}>Fréquence</div><select value={fFreq} onChange={function(e){setFFreq(e.target.value);}} style={fFreq?selAct:selSt}><option value="">Toutes</option>{uFreq.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:9,color:T.fgMuted,marginBottom:3,textTransform:"uppercase",fontWeight:600}}>Description</div><select value={fDesc} onChange={function(e){setFDesc(e.target.value);}} style={fDesc?selAct:selSt}><option value="">Toutes</option>{uDesc.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
              </div>
            </div>}
            <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
              <input placeholder="Rechercher..." value={flxSearch} onChange={function(e){setFlxSearch(e.target.value);}} style={{...I,width:160,padding:"5px 8px",fontSize:10}}/>
              <button onClick={function(){setShowFlxFilter(function(p){return !p;});}} style={{background:showFlxFilter?"#2979FF20":T.bgAlt,color:showFlxFilter?"#2979FF":T.fg,border:"1px solid "+(showFlxFilter?"#2979FF":T.border),borderRadius:5,padding:"5px 10px",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                {"⊟ Filtres"}{activeFilterCount>0&&<span style={{background:"#2979FF",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{activeFilterCount}</span>}
              </button>
              <span style={{fontSize:10,color:T.fgDim}}>{filtered2.length}/{flows.length} flux</span>
              {hasFilter&&!showFlxFilter&&<button onClick={clearAll} style={{background:"#FF525215",color:"#FF5252",border:"none",borderRadius:4,padding:"3px 8px",fontSize:9,cursor:"pointer"}}>Effacer filtres</button>}
              <button onClick={function(){
                var cols=["ID","Source","Domaine source","Cible","Domaine cible","Protocole","Fréquence","Description"];
                var rows=filtered2.map(function(e){return["F-"+(e.f.order||e.fi+1),e.srcName,e.srcDom,e.tgtName,e.tgtDom,e.proto,e.freq,e.desc].map(function(v){return '"'+(v||"").replace(/"/g,'""')+'"';}).join(",");});
                var csv=[cols.join(",")].concat(rows).join("\n");
                var a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download="flux_export.csv";a.click();
              }} style={{background:T.bgAlt,color:T.fg,border:"1px solid "+T.border,borderRadius:5,padding:"5px 10px",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
                ⬇ CSV
              </button>
            </div>
            {function(){
              var protoCount={};enriched.forEach(function(e){if(e.proto)protoCount[e.proto]=(protoCount[e.proto]||0)+1;});
              var protoList=Object.keys(protoCount).sort(function(x,y){return protoCount[y]-protoCount[x];}).slice(0,8);
              var cols="52px minmax(0,1fr) 120px minmax(0,1fr) 84px";
              var hd={fontSize:9,color:T.fgMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5};
              var chip=function(active,col){return {background:active?col+"25":T.bgAlt,color:active?col:T.fgMuted,border:"1px solid "+(active?col:T.border),borderRadius:14,padding:"3px 10px",fontSize:10,fontWeight:600,cursor:"pointer"};};
              var openApp=function(name,ev){ev.stopPropagation();var ap=apps.find(function(a){return a.name===name;});if(ap)setSelApp(ap);};
              var domPill=function(dom,isSrc){var ac=(DC[dom]||DC.Autre).ac;var on=(isSrc?fSrcDom:fTgtDom)===dom;return <span title={"Filtrer : domaine "+dom} onClick={function(ev){ev.stopPropagation();if(isSrc)setFSrcDom(on?"":dom);else setFTgtDom(on?"":dom);}} style={{fontSize:9,fontWeight:700,color:ac,background:ac+(on?"40":"18"),border:"1px solid "+ac+(on?"":"40"),borderRadius:10,padding:"1px 7px",cursor:"pointer",whiteSpace:"nowrap"}}>{dom}</span>;};
              return <div>
                {protoList.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
                  <span style={{fontSize:9,color:T.fgMuted,fontWeight:700,textTransform:"uppercase"}}>Protocole</span>
                  {protoList.map(function(pr){return <span key={pr} onClick={function(){setFProto(fProto===pr?"":pr);}} style={chip(fProto===pr,"#2979FF")}>{pr} <b style={{opacity:0.7}}>{protoCount[pr]}</b></span>;})}
                </div>}
                <div style={{border:"1px solid "+T.border,borderRadius:10,overflow:"hidden"}}>
                  <div style={{display:"grid",gridTemplateColumns:cols,gap:8,padding:"8px 12px",background:T.bgAlt,borderBottom:"1px solid "+T.border}}>
                    <span style={hd}>ID</span><span style={hd}>Source</span><span style={{...hd,textAlign:"center"}}>Échange</span><span style={hd}>Cible</span><span style={{...hd,textAlign:"right"}}>Fréquence</span>
                  </div>
                  <div style={{maxHeight:520,overflowY:"auto"}}>
                    {filtered2.length===0&&<div style={{padding:28,textAlign:"center",color:T.fgMuted,fontSize:11}}>Aucun flux ne correspond aux filtres.{hasFilter&&<span> <a onClick={clearAll} style={{color:"#2979FF",cursor:"pointer"}}>Effacer les filtres</a></span>}</div>}
                    {filtered2.map(function(e){
                      var faAc=(DC[e.srcDom]||DC.Autre).ac;var taAc=(DC[e.tgtDom]||DC.Autre).ac;
                      var open=expFlow===e.f.id;
                      return <div key={e.f.id} style={{borderBottom:"1px solid "+T.borderLight,borderLeft:"3px solid "+faAc,background:open?T.bgAlt:"transparent"}}>
                        <div onClick={function(){setExpFlow(open?null:e.f.id);}} onMouseEnter={function(ev){if(!open)ev.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(ev){ev.currentTarget.style.background="transparent";}}
                          style={{display:"grid",gridTemplateColumns:cols,gap:8,padding:"10px 12px",alignItems:"center",cursor:"pointer"}}>
                          <span style={{color:T.fgDim,fontSize:10,fontFamily:"monospace"}}>{"F-"+(e.f.order||e.fi+1)}</span>
                          <div style={{minWidth:0}}><div style={{fontWeight:700,color:T.fg,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.srcName}</div>{domPill(e.srcDom,true)}</div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                            <span style={{background:faAc+"20",color:faAc,padding:"1px 8px",borderRadius:10,fontSize:9,fontWeight:700,maxWidth:116,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.proto||"?"}</span>
                            <div style={{display:"flex",alignItems:"center",width:"100%"}}><div style={{flex:1,height:2,background:"linear-gradient(90deg,"+faAc+","+taAc+")",borderRadius:1}}/><span style={{color:taAc,fontSize:10,lineHeight:1,marginLeft:-2}}>▶</span></div>
                          </div>
                          <div style={{minWidth:0}}><div style={{fontWeight:700,color:T.fg,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.tgtName}</div>{domPill(e.tgtDom,false)}</div>
                          <span style={{textAlign:"right",color:T.fgMuted,fontSize:10,display:"flex",justifyContent:"flex-end",alignItems:"center",gap:6}}>{e.freq||"\u2014"}<span style={{color:T.fgDim,fontSize:9,transform:open?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span></span>
                        </div>
                        {open&&<div style={{padding:"4px 14px 14px 68px",display:"flex",flexDirection:"column",gap:8}}>
                          <div style={{fontSize:11,color:T.fg,lineHeight:1.5}}>{e.desc||<span style={{color:T.fgMuted}}>Aucune description renseign?e.</span>}</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                            <span style={{fontSize:10,color:T.fgMuted}}>Protocole : <b style={{color:T.fg}}>{e.proto||"?"}</b></span>
                            <span style={{fontSize:10,color:T.fgMuted}}>· Fréquence : <b style={{color:T.fg}}>{e.freq||"\u2014"}</b></span>
                            <span style={{marginLeft:"auto",display:"flex",gap:6}}>
                              <button onClick={function(ev){openApp(e.srcName,ev);}} style={{background:faAc+"20",color:faAc,border:"1px solid "+faAc+"55",borderRadius:6,padding:"4px 10px",fontSize:10,fontWeight:600,cursor:"pointer"}}>Ouvrir {e.srcName}</button>
                              <button onClick={function(ev){openApp(e.tgtName,ev);}} style={{background:taAc+"20",color:taAc,border:"1px solid "+taAc+"55",borderRadius:6,padding:"4px 10px",fontSize:10,fontWeight:600,cursor:"pointer"}}>Ouvrir {e.tgtName}</button>
                            </span>
                          </div>
                        </div>}
                      </div>;
                    })}
                  </div>
                </div>
              </div>;
            }()}
          </div></div>;
        }()}
      </div>);
        return null;
      })}
      </div>

    </div>;
  };

  /* ═══ VIEWS ═══ */

  // LOADING SCREEN
  if(view==="loading"&&loadStatus) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg}}><div style={{textAlign:"center",maxWidth:400,padding:20}}>
    <div className="spinner" style={{margin:"0 auto 24px"}}/>
    <div style={{marginBottom:24}}>
      {loadStatus.step==="error"?<div style={{fontSize:48,marginBottom:8}}>⚠️</div>:<div style={{fontSize:48,marginBottom:8,animation:"spin 1s linear infinite"}}>◈</div>}
      <style>{"@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>
    </div>
    <h2 style={{fontSize:18,fontWeight:700,marginBottom:8}}>{loadStatus.step==="error"?"Erreur":"Chargement en cours"}</h2>
    <p style={{color:T.fgMuted,fontSize:13,marginBottom:24}}>{loadStatus.detail}</p>
    {/* Progress steps */}
    <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
      {["reading","parsing","mapping","ready"].map((s,i)=>{
        const steps=["reading","parsing","mapping","ready"];
        const cur=steps.indexOf(loadStatus.step);
        const done=i<=cur;
        return <div key={s} style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:done?"#52B788":"#333",transition:"background 0.3s"}}/>
          {i<3&&<div style={{width:24,height:2,background:done?"#52B788":"#333",transition:"background 0.3s"}}/>}
        </div>;
      })}
    </div>
    <div style={{display:"flex",gap:4,justifyContent:"center",fontSize:10,color:T.fgDim}}>
      <span>Lecture</span><span style={{width:26}}/>
      <span>Analyse</span><span style={{width:20}}/>
      <span>Mapping</span><span style={{width:20}}/>
      <span>Prêt</span>
    </div>
    {loadStatus.step==="error"&&<button onClick={()=>{setLoadStatus(null);setView("home");}} style={{...B,background:T.border,marginTop:24}}>← Retour</button>}
  </div></div>;

  if(view==="home") return <CanvasHome isDark={isDark} onToggleTheme={toggleTheme} projectType={projectType} onImportFile={handleFile} onScratch={function(){setApps([]);setFlows([]);setView("mapping");}} onLoadJson={loadJSON} onDownloadTemplate={function(){downloadTemplate(projectType);}}/>;

  if(showSP&&shts.length>0) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:T.bgCard,borderRadius:8,padding:32,width:420,textAlign:"center"}}>
    <div style={{fontSize:32,marginBottom:12}}>📑</div><h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Fichier multi-feuilles</h2>
    <p style={{color:T.fgMuted,fontSize:12,marginBottom:20}}><strong style={{color:T.fg}}>{fName}</strong> — {shts.length} feuilles</p>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>{shts.map(nm=>{const ws=wbR.Sheets[nm],rng=ws["!ref"];const rc=rng?parseInt((rng.split(":")[1]||"").replace(/[A-Z]/g,"")||"0"):0;return <button key={nm} onClick={()=>loadSheet(wbR,nm)} style={{...B,background:T.bg,border:"1px solid "+T.border,padding:"12px 16px",display:"flex",justifyContent:"space-between",width:"100%"}}><span>📄 {nm}</span><span style={{fontSize:10,color:T.fgMuted}}>~{rc} lignes</span></button>;})}</div>
    <button onClick={()=>{setShowSP(false);setView("home");}} style={{...B,background:T.border,marginTop:16}}>← Retour</button>
  </div></div>;

  if(view==="import") return <div style={{height:"100vh",padding:32,overflowY:"auto",boxSizing:"border-box"}}><div style={{maxWidth:800,margin:"0 auto"}}>
    {/* Status banner */}
    {loadStatus?.stats&&<div style={{background:"#52B78815",border:"1px solid #52B78840",borderRadius:8,padding:16,marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{color:"#52B788",fontSize:16}}>✓</span><span style={{fontSize:13,fontWeight:700,color:"#52B788"}}>Fichier chargé avec succès</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[{l:"Applications",v:loadStatus.stats.apps,c:"#548CA8"},{l:"Domaines",v:loadStatus.stats.domains,c:"#9D4EDD"},{l:"Flux détectés",v:loadStatus.stats.flows,c:"#52B788"},{l:"Champs mappés",v:loadStatus.stats.mappedFields+"/"+loadStatus.stats.totalFields,c:"#D4A017"}].map(k=>
          <div key={k.l} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div><div style={{fontSize:10,color:T.fgMuted,marginTop:2}}>{k.l}</div></div>)}
      </div>
      {loadStatus.stats.domainList&&<div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>{loadStatus.stats.domainList.map(d=>{const c=DC[d]||DC.Autre;return <span key={d} style={{fontSize:10,padding:"2px 8px",background:c.ac+"20",color:c.ac,borderRadius:4,border:"1px solid "+c.ac+"40"}}>{d} ({rawData?.filter(r=>r[cMap.domain]===d).length||0})</span>;})}</div>}
      {loadStatus.stats.ignored&&loadStatus.stats.ignored.length>0&&<div style={{marginTop:12,padding:"8px 10px",borderRadius:6,background:"#F59E0B14",border:"1px solid #F59E0B40",fontSize:11,color:T.fgMuted,lineHeight:1.5}}><strong style={{color:"#F59E0B"}}>Colonnes non utilisées pour ce type de projet :</strong> {loadStatus.stats.ignored.map(x=>x.header).join(", ")}. Elles correspondent à un autre type de projet ({projectType==='deal'?"IT/SI":"Deal IT/TECH"}) et sont ignorées à l'import.</div>}
    </div>}
    <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Mapping des colonnes</h2>
    <p style={{color:T.fgMuted,fontSize:12,marginBottom:24}}>{fName&&<><strong style={{color:"#548CA8"}}>{fName}</strong> · </>}{rawData?.length} lignes · Vérifiez ou ajustez le mapping</p>
    <div style={{background:T.bgCard,borderRadius:8,padding:24}}>{fieldsFor(projectType).map(({key,label,req})=><div key={key} style={{display:"flex",alignItems:"center",marginBottom:12,gap:16}}><div style={{width:200,fontSize:12,color:req?"#E8E8E8":"#888"}}>{label}{req&&<span style={{color:"#E06C75"}}> *</span>}</div><select value={cMap[key]||""} onChange={e=>setCMap(p=>({...p,[key]:e.target.value}))} style={{...I,flex:1,borderColor:cMap[key]?"#52B78860":"#333"}}><option value="">— Ignorer —</option>{rawHdr.map(h=><option key={h} value={h}>{h}</option>)}</select>{cMap[key]&&<span style={{color:"#52B788",fontSize:12}}>✓</span>}</div>)}</div>
    <div style={{marginTop:24,background:T.bgCard,borderRadius:8,padding:16,overflowX:"auto"}}>
      <div style={{fontSize:11,fontWeight:700,color:"#548CA8",marginBottom:8}}>APERÇU (5 premières lignes)</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr>{rawHdr.map(h=><th key={h} style={{padding:"4px 8px",textAlign:"left",color:T.fgMuted,borderBottom:"1px solid "+T.border}}>{h}</th>)}</tr></thead>
        <tbody>{rawData?.slice(0,5).map((r,i)=><tr key={i}>{rawHdr.map(h=><td key={h} style={{padding:"4px 8px",color:T.fg,borderBottom:"1px solid "+T.borderLight}}>{r[h]}</td>)}</tr>)}</tbody></table>
    </div>
    <div style={{display:"flex",gap:12,marginTop:24,justifyContent:"flex-end"}}><button onClick={()=>setView("home")} style={{...B,background:T.border}}>Retour</button><button onClick={processImport} style={{...B,background:"#548CA8"}}>Générer la cartographie →</button></div>
  </div></div>;


  // ═══ SETTINGS MODAL ═══
  if(showSettings) return <div style={{position:"fixed",inset:0,background:T.overlay,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={function(){setShowSettings(false);}}>
    <div style={{background:T.bgCard,borderRadius:12,padding:24,width:480,maxHeight:"80vh",overflowY:"auto",boxShadow:"0 8px 32px #00000040"}} onClick={function(e){e.stopPropagation();}}>
      <h2 style={{margin:"0 0 16px",fontSize:18,color:T.fg}}>Paramètres</h2>
      <div style={{marginBottom:20}}>
        <h3 style={{fontSize:13,color:T.fgMuted,marginBottom:8}}>Import de données</h3>
        <button onClick={function(){setShowSettings(false);setView("home");}} style={{...B,background:"#2979FF",padding:"8px 16px"}}>Réimporter un fichier XLSX</button>
      </div>
      <div style={{marginBottom:20}}>
        <h3 style={{fontSize:13,color:T.fgMuted,marginBottom:8}}>Thème</h3>
        <div style={{display:"flex",gap:8}}>
          <button onClick={function(){setThemeKey("dark");}} style={{...B,background:isDark?"#548CA8":T.border,padding:"8px 16px"}}>Mode sombre</button>
          <button onClick={function(){setThemeKey("light");}} style={{...B,background:isDark?T.border:"#548CA8",padding:"8px 16px"}}>Mode clair</button>
        </div>
      </div>
      <div style={{marginBottom:20}}>
        <h3 style={{fontSize:13,color:T.fgMuted,marginBottom:8}}>Épaisseur des flux</h3>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <input type="range" min="1" max="6" step="0.5" value={flowThickness} onChange={function(e){setFlowThickness(parseFloat(e.target.value));}} style={{width:180}}/>
          <span style={{fontSize:12,color:T.fg}}>{flowThickness}px</span>
        </div>
      </div>
      <button onClick={function(){setShowSettings(false);}} style={{...B,background:T.border,marginTop:8}}>Fermer</button>
    </div>
  </div>;

  // ═══ CARDS VIEW ═══
  if(view==="cards"){
  var cz=cardZoom;
  var outF=cardSelApp?flows.filter(function(f){return f.from===cardSelApp.id;}):[];
  var inF=cardSelApp?flows.filter(function(f){return f.to===cardSelApp.id;}):[];
  var allDoms=[...new Set(apps.map(function(a){return a.domain;}))].sort();
  var filteredDoms=activeDomFilter?allDoms.filter(function(d){return d===activeDomFilter;}):allDoms;
  var handleDomDown=function(dom,e){
    e.preventDefault();
    var el=e.currentTarget.parentElement;
    var rect=el.getBoundingClientRect();
    var parentRect=el.parentElement.getBoundingClientRect();
    var startX=e.clientX,startY=e.clientY;
    var origLeft=rect.left-parentRect.left,origTop=rect.top-parentRect.top;
    var onMove=function(ev){
      var dx=ev.clientX-startX,dy=ev.clientY-startY;
      setDomPos(function(p){var n=Object.assign({},p);n[dom]={x:origLeft+dx,y:origTop+dy};return n;});
    };
    var onUp=function(){document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  };
  var hasDomPos=Object.keys(domPos).length>0;
  var handleDomResize=function(dom,e){
    e.preventDefault();e.stopPropagation();
    var startX=e.clientX;
    var startW=domWidths[dom]||domW;
    var onMove=function(ev){
      var newW=Math.max(160,startW+(ev.clientX-startX));
      setDomWidths(function(p){var n=Object.assign({},p);n[dom]=newW;return n;});
    };
    var onUp=function(){document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  };
  return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg}}>

    {/* ── Topbar ── */}
    <div style={{background:T.bgAlt,borderBottom:"1px solid "+T.border,padding:"10px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
      <div>
        <div style={{fontSize:16,fontWeight:800,color:T.fg,letterSpacing:"-0.025em",lineHeight:1}}>Vue Cartes</div>
        <div style={{color:T.fgMuted,fontSize:11,marginTop:2}}>{apps.length} applications · {flows.length} flux</div>
      </div>

      {/* Domain filter pills */}
      <div style={{flex:1,display:"flex",gap:6,alignItems:"center",overflowX:"auto",padding:"2px 0"}}>
        <button onClick={function(){setActiveDomFilter("");}} style={{flexShrink:0,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:activeDomFilter?"400":"700",background:activeDomFilter?T.bgCard:"#6366F1",color:activeDomFilter?T.fgMuted:"#fff",border:"1px solid "+(activeDomFilter?T.border:"#6366F1"),cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>Tous ({apps.length})</button>
        {allDoms.map(function(dom){
          var n=apps.filter(function(a){return a.domain===dom;}).length;
          var cc=DC[dom]||DC.Autre;
          var active=activeDomFilter===dom;
          return <button key={dom} onClick={function(){setActiveDomFilter(active?"":dom);}} style={{flexShrink:0,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:active?"700":"400",background:active?cc.ac:T.bgCard,color:active?"#fff":T.fg,border:"1px solid "+(active?cc.ac:T.border),cursor:"pointer",transition:"all 0.15s ease",whiteSpace:"nowrap"}}>{dom} <span style={{opacity:0.7}}>·{n}</span></button>;
        })}
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
        <span style={{fontSize:11,color:T.fgMuted}}>Zoom</span>
        <input type="range" min="0.5" max="1.5" step="0.1" value={cardZoom} onChange={function(e){setCardZoom(parseFloat(e.target.value));}} style={{width:60,cursor:"pointer",accentColor:"#6366F1"}}/>
        {(hasDomPos||Object.keys(domWidths).length>0)&&<button onClick={function(){setDomPos({});setDomWidths({});}} style={{...B,background:T.border,padding:"4px 10px",fontSize:11,borderRadius:8}}>Reset</button>}
        <button onClick={function(){setActiveDomFilter("");setView("urbanisme");}} style={{...B,background:"#F59E0B",padding:"6px 14px",fontSize:11,fontWeight:600,borderRadius:8,display:"flex",alignItems:"center",gap:5}}><span>&#8592;</span> Urbanisme</button>
        <button onClick={function(){setView("mapping");setTimeout(fitCanvas,50);}} style={{...B,background:"#6366F1",padding:"6px 14px",fontSize:11,fontWeight:600,borderRadius:8,display:"flex",alignItems:"center",gap:5}}><span>&#8592;</span> Cartographie</button>
      </div>
    </div>

    {/* ── Main content ── */}
    <div style={{flex:1,overflow:"auto",padding:"16px 20px"}}>

      {/* Empty state */}
      {filteredDoms.length===0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}>
        <div style={{fontSize:36,opacity:0.3}}>⊘</div>
        <div style={{fontSize:14,fontWeight:600,color:T.fgMuted}}>Aucun domaine correspondant</div>
        <button onClick={function(){setActiveDomFilter("");}} style={{...B,background:T.bgCard,border:"1px solid "+T.border,color:T.fg,padding:"6px 16px",fontSize:12,borderRadius:8}}>Effacer le filtre</button>
      </div>}

      <div style={{position:"relative",display:hasDomPos?"block":"flex",gap:Math.round(12*cz),alignItems:"flex-start",flexWrap:"wrap",minHeight:hasDomPos?800:"auto"}}>
        {filteredDoms.map(function(dom,di){
          var domApps=apps.filter(function(a){return a.domain===dom;});
          var cc=DC[dom]||DC.Autre;
          var colW=Math.round((domWidths[dom]||domW)*cz);
          var pos=domPos[dom];
          var wrapStyle={position:"relative",width:colW,flexShrink:0};
          if(pos){wrapStyle.position="absolute";wrapStyle.left=pos.x;wrapStyle.top=pos.y;wrapStyle.zIndex=2;}
          if(domH>0)wrapStyle.height=Math.round(domH*cz);
          return <div key={dom} style={{...wrapStyle,display:"flex",flexDirection:"row",animation:"cardIn 0.22s cubic-bezier(0.16,1,0.3,1) both",animationDelay:(di*0.04)+"s"}}>
            {/* Column content */}
            <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
            {/* Domain header */}
            <div onMouseDown={function(e){handleDomDown(dom,e);}} style={{background:"linear-gradient(135deg,"+cc.ac+","+cc.ac+"CC)",color:"#fff",padding:Math.round(8*cz)+"px "+Math.round(12*cz)+"px",borderRadius:Math.round(8*cz)+"px "+Math.round(8*cz)+"px 0 0",fontSize:Math.round(12*cz),fontWeight:700,cursor:"grab",userSelect:"none",display:"flex",justifyContent:"space-between",alignItems:"center",letterSpacing:"-0.01em"}}>
              <span>{dom}</span>
              <span style={{fontSize:Math.round(10*cz),fontWeight:500,opacity:0.8,background:"rgba(255,255,255,0.18)",padding:"1px 6px",borderRadius:10}}>{domApps.length}</span>
            </div>
            {/* Cards container */}
            <div style={{background:T.bgCard,border:"1px solid "+T.border,borderTop:"none",borderRadius:"0 0 "+Math.round(8*cz)+"px "+Math.round(8*cz)+"px",padding:Math.round(8*cz),display:"flex",flexWrap:"wrap",gap:Math.round(6*cz),alignContent:"flex-start",height:domH>0?Math.round((domH-38)*cz):"auto",overflowY:domH>0?"auto":"visible"}}>
              {domApps.map(function(app,ai){
                var isAct=cardSelApp&&cardSelApp.id===app.id;
                var d1C=app.statusD1?(SD1[app.statusD1]||"#F59E0B"):null;
                var d2C=app.statusD2?(SD2[app.statusD2]||"#F97316"):null;
                var nOut=flows.filter(function(f){return f.from===app.id;}).length;
                var nIn=flows.filter(function(f){return f.to===app.id;}).length;
                var totalFlux=nOut+nIn;
                var cardMinW=Math.round(130*cz);
                var innerPad=Math.round(8*cz);
                var gapPx=Math.round(6*cz);
                var avail=colW-innerPad*2;
                var perRow=Math.max(1,Math.floor((avail+gapPx)/(cardMinW+gapPx)));
                var cardW2=Math.floor((avail-(perRow-1)*gapPx)/perRow);
                return <div key={app.id} onClick={function(){setCardSelApp(isAct?null:app);}}
                  style={{
                    background:isAct?cc.ac+"18":T.bgAlt,
                    border:"1.5px solid "+(isAct?cc.ac:T.border),
                    borderRadius:Math.round(8*cz),
                    padding:Math.round(8*cz)+"px "+Math.round(10*cz)+"px",
                    cursor:"pointer",
                    width:cardW2,flexShrink:0,
                    position:"relative",
                    transition:"transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease",
                    boxShadow:isAct?"0 4px 16px "+cc.ac+"35":"0 1px 3px rgba(0,0,0,0.15)",
                    animation:"cardIn 0.2s cubic-bezier(0.16,1,0.3,1) both",
                    animationDelay:(di*0.04+ai*0.02)+"s",
                  }}
                  onMouseEnter={function(e){if(!isAct){e.currentTarget.style.transform="translateY(-2px) scale(1.015)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.28)";e.currentTarget.style.borderColor=cc.ac+"80";}}}
                  onMouseLeave={function(e){if(!isAct){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.15)";e.currentTarget.style.borderColor=T.border;}}}
                  onMouseDown={function(e){e.currentTarget.style.transform="scale(0.96)";e.currentTarget.style.transition="transform 80ms ease";}}
                  onMouseUp={function(e){e.currentTarget.style.transform="";e.currentTarget.style.transition="transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease";}}>

                  {/* Flux badge */}
                  {totalFlux>0&&<div style={{position:"absolute",top:Math.round(-4*cz),right:Math.round(-4*cz),width:Math.round(16*cz),height:Math.round(16*cz),background:cc.ac,color:"#fff",borderRadius:"50%",fontSize:Math.round(8*cz),fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+T.bgCard,zIndex:1}}>{totalFlux}</div>}

                  {/* App name */}
                  <div style={{fontSize:Math.round(11*cz),fontWeight:700,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"-0.01em",lineHeight:1.3}}>{app.name}</div>

                  {/* Vendor */}
                  {app.vendor&&<div style={{fontSize:Math.round(9*cz),color:T.fgMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:Math.round(1*cz),lineHeight:1.2}}>{app.vendor}</div>}

                  {/* Criticality indicator */}
                  <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginTop:Math.round(4*cz)}}>
                    <span style={{fontSize:Math.round(9*cz),color:CC[app.criticality]||"#888"}}>{app.criticality==="Haute"?"●":app.criticality==="Basse"?"○":"◐"}</span>
                  </div>

                  {/* D1/D2 badges */}
                  {(d1C||d2C)&&<div style={{display:"flex",gap:3,marginTop:Math.round(4*cz),flexWrap:"wrap"}}>
                    {d1C&&<span style={{fontSize:Math.round(8*cz),background:d1C+"22",color:d1C,border:"1px solid "+d1C+"55",borderRadius:4,padding:"0 4px",fontWeight:700,lineHeight:1.6}}>{"D1:"+(app.statusD1==="Transfert TSA"?"TSA":app.statusD1)}</span>}
                    {d2C&&<span style={{fontSize:Math.round(8*cz),background:d2C+"22",color:d2C,border:"1px solid "+d2C+"55",borderRadius:4,padding:"0 4px",fontWeight:700,lineHeight:1.6}}>{"D2:"+(app.statusD2==="Clone & Clean"?"Clone":app.statusD2)}</span>}
                  </div>}
                </div>;
              })}
            </div>
            </div>{/* end column content */}
            {/* Right resize handle — inline flex strip */}
            <div title="Ajuster la largeur du domaine" onMouseDown={function(e){handleDomResize(dom,e);}}
              style={{width:10,flexShrink:0,cursor:"ew-resize",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"0 4px 4px 0",background:cc.ac+"20",borderTop:"1px solid "+cc.ac+"40",borderRight:"1px solid "+cc.ac+"40",borderBottom:"1px solid "+cc.ac+"40",transition:"background 0.15s"}}
              onMouseEnter={function(e){e.currentTarget.style.background=cc.ac+"50";}}
              onMouseLeave={function(e){e.currentTarget.style.background=cc.ac+"20";}}>
              <svg width="4" height="20" viewBox="0 0 4 20" style={{pointerEvents:"none"}}><line x1="1" y1="2" x2="1" y2="18" stroke={cc.ac} strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="2" x2="3" y2="18" stroke={cc.ac} strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </div>;
        })}
      </div>
    </div>

    {/* ── Detail panel (slide-in) ── */}
    {cardSelApp&&<div style={{position:"fixed",right:0,top:topOffset,bottom:0,width:360,background:T.bgAlt,borderLeft:"1px solid "+T.border,overflowY:"auto",zIndex:200,boxShadow:"-8px 0 32px rgba(0,0,0,0.25)",animation:"panelIn 0.22s cubic-bezier(0.16,1,0.3,1)"}}>
      <div style={{background:(DC[cardSelApp.domain]||DC.Autre).ac,padding:"20px 20px 16px",position:"sticky",top:0,zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{cardSelApp.domain}</div>
            <div style={{fontSize:17,fontWeight:800,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cardSelApp.name}</div>
            {cardSelApp.vendor&&<div style={{fontSize:11,color:"rgba(255,255,255,0.65)",marginTop:3}}>{cardSelApp.vendor}</div>}
          </div>
          <button onClick={function(){setCardSelApp(null);}} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",cursor:"pointer",padding:"4px 8px",borderRadius:6,fontSize:14,lineHeight:1,flexShrink:0,marginLeft:8}}>✕</button>
        </div>
        <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}>
          <span style={{background:"rgba(255,255,255,0.18)",color:"#fff",padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:600}}>{cardSelApp.criticality||"—"}</span>
          {cardSelApp.statusD1&&<span style={{background:"rgba(255,255,255,0.18)",color:"#fff",padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:700}}>D1: {cardSelApp.statusD1==="Transfert TSA"?"TSA":cardSelApp.statusD1}</span>}
          {cardSelApp.statusD2&&<span style={{background:"rgba(255,255,255,0.18)",color:"#fff",padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:700}}>D2: {cardSelApp.statusD2==="Clone & Clean"?"Clone":cardSelApp.statusD2}</span>}
        </div>
      </div>

      <div style={{padding:16}}>
        {/* Metadata */}
        {[["\u00c9diteur",cardSelApp.vendor],["Version",cardSelApp.version],["Responsable",cardSelApp.owner],["Utilisateurs",cardSelApp.users]].filter(function(p){return p[1];}).length>0&&<div style={{background:T.bgCard,borderRadius:8,padding:12,marginBottom:14,border:"1px solid "+T.border}}>
          {[["\u00c9diteur",cardSelApp.vendor],["Version",cardSelApp.version],["Responsable",cardSelApp.owner],["Utilisateurs",cardSelApp.users]].filter(function(p){return p[1];}).map(function(p){
            return <div key={p[0]} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+T.borderLight}}>
              <span style={{fontSize:11,color:T.fgMuted}}>{p[0]}</span>
              <span style={{fontSize:11,color:T.fg,fontWeight:500}}>{p[1]}</span>
            </div>;
          })}
        </div>}

        {/* Description */}
        {cardSelApp.description&&<div style={{background:T.bgCard,borderRadius:8,padding:10,marginBottom:14,border:"1px solid "+T.border,fontSize:11,color:T.fgMuted,lineHeight:1.5}}>{cardSelApp.description}</div>}

        {/* Outgoing flows */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
            <div style={{width:3,height:14,borderRadius:2,background:"#10B981"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"#10B981"}}>Sortants ({outF.length})</span>
          </div>
          {outF.length===0&&<div style={{fontSize:11,color:T.fgFaint,fontStyle:"italic",padding:"4px 0"}}>Aucun flux sortant</div>}
          {outF.map(function(f){
            var ta=apps.find(function(a){return a.id===f.to;});
            var taAc=ta?(DC[ta.domain]||DC.Autre).ac:"#888";
            return <div key={f.id} style={{background:T.bgCard,borderRadius:8,padding:"8px 10px",marginBottom:6,border:"1px solid "+T.borderLight,borderLeft:"3px solid #10B981"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:700,color:T.fg}}>{ta?ta.name:"?"}</span>
                <span style={{fontSize:10,color:"#fff",background:taAc,padding:"1px 7px",borderRadius:4,fontWeight:600}}>{f.protocol||"?"}</span>
              </div>
              {ta&&<div style={{fontSize:10,color:taAc,marginTop:2,fontWeight:600}}>{ta.domain}</div>}
              {f.label&&<div style={{fontSize:10,color:T.fgDim,marginTop:3}}>{f.label}</div>}
            </div>;
          })}
        </div>

        {/* Incoming flows */}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
            <div style={{width:3,height:14,borderRadius:2,background:"#6366F1"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"#6366F1"}}>Entrants ({inF.length})</span>
          </div>
          {inF.length===0&&<div style={{fontSize:11,color:T.fgFaint,fontStyle:"italic",padding:"4px 0"}}>Aucun flux entrant</div>}
          {inF.map(function(f){
            var fa=apps.find(function(a){return a.id===f.from;});
            var faAc=fa?(DC[fa.domain]||DC.Autre).ac:"#888";
            return <div key={f.id} style={{background:T.bgCard,borderRadius:8,padding:"8px 10px",marginBottom:6,border:"1px solid "+T.borderLight,borderLeft:"3px solid #6366F1"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:700,color:T.fg}}>{fa?fa.name:"?"}</span>
                <span style={{fontSize:10,color:"#fff",background:faAc,padding:"1px 7px",borderRadius:4,fontWeight:600}}>{f.protocol||"?"}</span>
              </div>
              {fa&&<div style={{fontSize:10,color:faAc,marginTop:2,fontWeight:600}}>{fa.domain}</div>}
              {f.label&&<div style={{fontSize:10,color:T.fgDim,marginTop:3}}>{f.label}</div>}
            </div>;
          })}
        </div>
      </div>
    </div>}
  </div></div></AppCtx.Provider>;
  }

if(view==="urbanisme"){
  var allDoms2=[...new Set(apps.map(function(a){return a.domain;}))].sort();
  var domFlowCounts={};
  flows.forEach(function(f){
    var fa=apps.find(function(a){return a.id===f.from;});
    var ta=apps.find(function(a){return a.id===f.to;});
    if(!fa||!ta||fa.domain===ta.domain)return;
    var k1=fa.domain+">>"+ta.domain;
    domFlowCounts[k1]=(domFlowCounts[k1]||0)+1;
  });
  var intraCounts={};
  flows.forEach(function(f){
    var fa=apps.find(function(a){return a.id===f.from;});
    var ta=apps.find(function(a){return a.id===f.to;});
    if(!fa||!ta||fa.domain!==ta.domain)return;
    intraCounts[fa.domain]=(intraCounts[fa.domain]||0)+1;
  });

  // Shared topbar
  var UrbTopbar=function(props){
    return <div style={{background:T.bgAlt,borderBottom:"1px solid "+T.border,padding:"10px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <div>
        <div style={{fontSize:15,fontWeight:800,color:T.fg,letterSpacing:"-0.02em",lineHeight:1}}>Urbanisme SI</div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
          <span style={{fontSize:11,color:T.fgMuted,cursor:urbZone?"pointer":"default"}} onClick={function(){if(urbZone){setUrbZone(null);setUrbFlowPair(null);setUrbSelApp(null);setUrbExpanded(false);}}}>Vue macro</span>
          {urbZone&&<><span style={{fontSize:11,color:T.fgDim}}>/</span>
          <span style={{fontSize:11,color:(DC[urbZone]||DC.Autre).ac,fontWeight:600,cursor:urbSelApp?"pointer":"default"}} onClick={function(){if(urbSelApp){setUrbSelApp(null);setUrbFlowPair(null);}}}>{urbZone}</span>
          {urbSelApp&&<><span style={{fontSize:11,color:T.fgDim}}>/</span>
          <span style={{fontSize:11,color:T.fgMuted,fontWeight:600}}>{urbSelApp.name}</span></>}
          {urbFlowPair&&!urbSelApp&&<><span style={{fontSize:11,color:T.fgDim}}>/</span>
          <span style={{fontSize:11,color:T.fgMuted}}>Flux</span></>}</>}
        </div>
      </div>
      <div style={{flex:1}}/>
      {urbSelApp&&<button onClick={function(){setUrbSelApp(null);setUrbFlowPair(null);}} style={{...B,background:T.bgCard,border:"1px solid "+T.border,color:T.fg,padding:"5px 12px",fontSize:11,borderRadius:8,display:"flex",alignItems:"center",gap:5}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Tous les flux
      </button>}
      {urbZone&&<button onClick={function(){setUrbZone(null);setUrbFlowPair(null);setUrbSelApp(null);setUrbExpanded(false);}} style={{...B,background:T.bgCard,border:"1px solid "+T.border,color:T.fg,padding:"5px 12px",fontSize:11,borderRadius:8,display:"flex",alignItems:"center",gap:5}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Vue macro
      </button>}
      <button onClick={function(){setView("mapping");setTimeout(fitCanvas,50);}} style={{...B,background:"#6366F1",padding:"5px 12px",fontSize:11,borderRadius:8,display:"flex",alignItems:"center",gap:5}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Cartographie
      </button>
    </div>;
  };

  // ══ NIVEAU 1: Macro ══
  if(!urbZone){
    var interDomLinks=[];
    allDoms2.forEach(function(d1,i){
      allDoms2.forEach(function(d2,j){
        if(i>=j)return;
        var cnt=(domFlowCounts[d1+">>"+d2]||0)+(domFlowCounts[d2+">>"+d1]||0);
        if(cnt>0)interDomLinks.push({d1:d1,d2:d2,cnt:cnt});
      });
    });
    interDomLinks.sort(function(a,b){return b.cnt-a.cnt;});

    var criticalApps=apps.filter(function(a){return a.criticality==="Haute";});
    var connectedCritical=criticalApps.filter(function(a){return flows.some(function(f){return f.from===a.id||f.to===a.id;});});
    var dayOneCritical=connectedCritical.filter(function(a){return !!a.statusD1;});
    var dayTwoCritical=dayOneCritical.filter(function(a){return !!a.statusD2;});
    var urbDark=!!isDark;
    var urbMuted=urbDark?"#9298ac":"#64748B";
    var urbLine=urbDark?"rgba(148,163,184,0.14)":"rgba(71,85,105,0.15)";
    var urbPanel={background:urbDark?"#10131f":"#FBFCFF",border:"1px solid "+urbLine,borderRadius:18,boxShadow:urbDark?"0 18px 50px rgba(0,0,0,0.2)":"0 14px 34px rgba(51,65,85,0.08)"};
    var urbStages=[
      {label:"Applications du périmètre",value:apps.length,color:"#6366F1",hint:"Inventaire complet"},
      {label:"Applications critiques",value:criticalApps.length,color:"#F97316",hint:"Criticité haute"},
      {label:"Critiques connectées",value:connectedCritical.length,color:"#06B6D4",hint:"Au moins un flux"},
      {label:"Stratégie Day 1 définie",value:dayOneCritical.length,color:"#10B981",hint:"Parmi les critiques reliées"},
      {label:"Cible Day 2 définie",value:dayTwoCritical.length,color:"#8B5CF6",hint:"Parcours qualifié"}
    ];
    var urbDomains=allDoms2.map(function(dom){
      var da=apps.filter(function(a){return a.domain===dom;});
      var df=flows.filter(function(f){var fa=apps.find(function(a){return a.id===f.from;});var ta=apps.find(function(a){return a.id===f.to;});return (fa&&fa.domain===dom)||(ta&&ta.domain===dom);}).length;
      return {name:dom,apps:da.length,flows:df,critical:da.filter(function(a){return a.criticality==="Haute";}).length,d2:da.filter(function(a){return !!a.statusD2;}).length,color:(DC[dom]||DC.Autre).ac};
    }).sort(function(a,b){return b.apps-a.apps;});
    return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg,minWidth:0}}>
      <UrbTopbar/>
      <div style={{flex:1,overflow:"auto",padding:"clamp(20px,3vw,42px) clamp(18px,4vw,56px) 48px",background:urbDark?"radial-gradient(ellipse at 75% -10%, rgba(99,102,241,0.12), transparent 45%), "+T.bg:"radial-gradient(ellipse at 10% 0%, rgba(99,102,241,0.075), transparent 38%), radial-gradient(ellipse at 94% 82%, rgba(14,165,233,0.045), transparent 35%), "+T.bg}}>
        <div style={{maxWidth:1320,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:24,flexWrap:"wrap",marginBottom:28}}>
            <div><div style={{fontSize:10,fontWeight:800,letterSpacing:".14em",textTransform:"uppercase",color:"#818cf8",marginBottom:12}}>Architecture · Explorer le paysage</div><h1 style={{fontSize:"clamp(28px,3.8vw,46px)",lineHeight:1.04,letterSpacing:"-.05em",fontWeight:850,color:T.fg,margin:0}}>Du domaine au flux,<br/><span style={{background:"linear-gradient(90deg,#818cf8,#22d3ee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>explorez votre SI.</span></h1><p style={{fontSize:13,color:urbMuted,margin:"14px 0 0",maxWidth:600,lineHeight:1.7}}>Choisissez un domaine métier pour entrer dans son portefeuille applicatif, puis suivez chaque échange jusqu’au détail du flux.</p></div>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:13,border:"1px solid "+urbLine,background:urbDark?"rgba(15,23,42,.58)":"rgba(255,255,255,.78)",color:urbMuted,fontSize:11}}><span style={{width:8,height:8,borderRadius:99,background:apps.length?"#34d399":"#fbbf24",boxShadow:apps.length?"0 0 12px #34d399":"none"}}/>{allDoms2.length} domaines <span style={{color:urbLine}}>·</span> {apps.length} applications <span style={{color:urbLine}}>·</span> {flows.length} flux</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,margin:"0 0 14px"}}><div style={{width:30,height:30,borderRadius:10,display:"grid",placeItems:"center",background:"rgba(99,102,241,.14)",color:"#a5b4fc",fontSize:14}}>01</div><div><div style={{fontSize:14,fontWeight:800,color:T.fg}}>Domaines métiers</div><div style={{fontSize:10,color:urbMuted,marginTop:3}}>Sélectionnez un domaine pour révéler ses applications et ses flux</div></div></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,270px),1fr))",gap:13}}>
            {urbDomains.map(function(dom,di){
              var dc=(DC[dom.name]||DC.Autre);var domApps=apps.filter(function(a){return a.domain===dom.name;});
              var rankedApps=domApps.map(function(app){return{app:app,flowCount:flows.filter(function(f){return f.from===app.id||f.to===app.id;}).length};}).sort(function(a,b){var rank={Haute:3,Moyenne:2,Basse:1};return (rank[b.app.criticality]||0)-(rank[a.app.criticality]||0)||b.flowCount-a.flowCount;});
              var featuredApp=rankedApps[0]||null;
              var hot=domApps.filter(function(a){return a.criticality==="Haute";}).length;
              var out=allDoms2.reduce(function(n,d){return n+(domFlowCounts[dom.name+">>"+d]||0);},0);
              var into=allDoms2.reduce(function(n,d){return n+(domFlowCounts[d+">>"+dom.name]||0);},0);
              var local=intraCounts[dom.name]||0;
              var flowTotal=out+into+local;
              var topPartner=interDomLinks.filter(function(link){return link.d1===dom.name||link.d2===dom.name;}).sort(function(a,b){return b.cnt-a.cnt;})[0]||null;
              var partnerName=topPartner?(topPartner.d1===dom.name?topPartner.d2:topPartner.d1):"";
              return <div key={dom.name} role="button" tabIndex={0} onClick={function(){setUrbZone(dom.name);setUrbSelApp(null);setUrbFlowPair(null);setUrbExpanded(false);}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();setUrbZone(dom.name);setUrbSelApp(null);setUrbFlowPair(null);setUrbExpanded(false);}}}
                style={{...urbPanel,position:"relative",overflow:"hidden",padding:18,cursor:"pointer",transition:"transform .22s cubic-bezier(.2,.8,.2,1),border-color .2s,box-shadow .2s",animation:"cardIn .3s cubic-bezier(.16,1,.3,1) both",animationDelay:(di*.035)+"s"}}
                onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor=dc.ac+"90";e.currentTarget.style.boxShadow="0 18px 38px "+dc.ac+"22";}}
                onMouseLeave={function(e){e.currentTarget.style.transform="";e.currentTarget.style.borderColor=urbLine;e.currentTarget.style.boxShadow=urbPanel.boxShadow;}}>
                <div style={{position:"absolute",width:170,height:170,right:-82,top:-90,borderRadius:"50%",background:"radial-gradient(circle,"+dc.ac+"30, transparent 70%)",pointerEvents:"none"}}/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,position:"relative"}}><div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}><span style={{width:34,height:34,borderRadius:11,display:"grid",placeItems:"center",background:dc.ac+"22",color:dc.ac,fontSize:16,fontWeight:800}}>◈</span><div style={{fontSize:16,fontWeight:800,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dom.name}</div></div><span style={{width:28,height:28,borderRadius:99,display:"grid",placeItems:"center",border:"1px solid "+dc.ac+"35",color:dc.ac,fontSize:15,transition:"transform .2s"}}>↗</span></div>
                <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:8,marginTop:17}}><div style={{display:"flex",alignItems:"baseline",gap:7}}><span style={{fontSize:34,lineHeight:1,fontWeight:850,letterSpacing:"-.06em",color:T.fg,fontVariantNumeric:"tabular-nums"}}>{dom.apps}</span><span style={{fontSize:11,color:urbMuted}}>applications</span></div><span style={{fontSize:10,color:hot?"#fb7185":urbMuted,background:hot?"rgba(244,63,94,.1)":(urbDark?"rgba(148,163,184,.08)":"#f1f5f9"),padding:"5px 8px",borderRadius:8}}><b style={{fontWeight:850}}>{hot}</b> critiques</span></div>
                {featuredApp&&<div style={{marginTop:13,padding:"10px 11px",borderRadius:11,background:"linear-gradient(110deg,"+dc.ac+(urbDark?"20":"12")+", "+(urbDark?"rgba(15,23,42,.58)":"#f8fafc")+")",border:"1px solid "+dc.ac+"35"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:7}}><span style={{fontSize:8,fontWeight:850,letterSpacing:".1em",color:urbMuted,textTransform:"uppercase"}}>{featuredApp.app.criticality==="Haute"?"Application critique":"Application prioritaire"}</span><span style={{fontSize:8,fontWeight:800,color:CC[featuredApp.app.criticality]||urbMuted,background:(CC[featuredApp.app.criticality]||urbMuted)+"18",padding:"3px 6px",borderRadius:6}}>{featuredApp.app.criticality||"Criticité n.d."}</span></div><div style={{fontSize:12,fontWeight:800,color:T.fg,marginTop:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={featuredApp.app.name}>{featuredApp.app.name}</div><div style={{fontSize:9,color:urbMuted,marginTop:3}}>{featuredApp.flowCount} flux associés{featuredApp.app.vendor?" · "+featuredApp.app.vendor:""}</div></div>}
                <div style={{marginTop:13}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:9,color:urbMuted,marginBottom:6}}><span style={{fontWeight:750,letterSpacing:".04em",textTransform:"uppercase"}}>Circulation des flux</span><span style={{fontVariantNumeric:"tabular-nums"}}>{flowTotal} au total</span></div><div style={{height:7,display:"flex",overflow:"hidden",borderRadius:99,background:urbDark?"rgba(148,163,184,.12)":"#e9edf5"}}><div title={out+" sortants"} style={{width:(flowTotal?out/flowTotal*100:0)+"%",background:"#34d399",transition:"width .45s ease"}}/><div title={into+" entrants"} style={{width:(flowTotal?into/flowTotal*100:0)+"%",background:"#818cf8",transition:"width .45s ease"}}/><div title={local+" internes"} style={{width:(flowTotal?local/flowTotal*100:0)+"%",background:dc.ac,transition:"width .45s ease"}}/></div><div style={{display:"flex",justifyContent:"space-between",gap:5,marginTop:7,fontSize:8,color:urbMuted}}><span><i style={{display:"inline-block",width:6,height:6,borderRadius:9,background:"#34d399",marginRight:4}}/>{out} sortants</span><span><i style={{display:"inline-block",width:6,height:6,borderRadius:9,background:"#818cf8",marginRight:4}}/>{into} entrants</span><span><i style={{display:"inline-block",width:6,height:6,borderRadius:9,background:dc.ac,marginRight:4}}/>{local} internes</span></div></div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:7,marginTop:12,paddingTop:10,borderTop:"1px solid "+urbLine}}>{topPartner?<><span style={{fontSize:9,color:urbMuted}}>Partenaire principal</span><span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:10,fontWeight:750,color:(DC[partnerName]||DC.Autre).ac}}>{partnerName}</span><span style={{flexShrink:0,fontSize:9,color:T.fg,background:urbDark?"rgba(148,163,184,.1)":"#f1f5f9",padding:"3px 6px",borderRadius:6}}>{topPartner.cnt} flux</span></>:<span style={{fontSize:9,color:urbMuted}}>Aucune connexion inter-domaine</span>}</div>
                {rankedApps.length>1&&<div style={{display:"flex",gap:5,marginTop:9,overflow:"hidden"}}>{rankedApps.slice(1,3).map(function(item){return <span key={item.app.id} title={item.app.name+" · "+item.flowCount+" flux"} style={{minWidth:0,maxWidth:"50%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:8,color:T.fgMuted,border:"1px solid "+urbLine,background:urbDark?"rgba(15,23,42,.55)":"#f8fafc",borderRadius:6,padding:"4px 6px"}}>{item.app.name}</span>;})}</div>}
                <div style={{height:2,position:"absolute",left:0,right:0,bottom:0,background:"linear-gradient(90deg,transparent,"+dc.ac+",transparent)",opacity:.8}}/>
              </div>;
            })}
            {urbDomains.length===0&&<div style={{...urbPanel,padding:40,textAlign:"center",color:urbMuted}}>Aucun domaine à afficher. Ajoutez des applications à la cartographie.</div>}
          </div>
          {interDomLinks.length>0&&<div style={{...urbPanel,marginTop:24,overflow:"hidden"}}><div style={{padding:"17px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid "+urbLine}}><div><div style={{fontSize:13,fontWeight:800,color:T.fg}}>Connexions entre domaines</div><div style={{fontSize:10,color:urbMuted,marginTop:4}}>Les principaux ponts de votre architecture</div></div><span style={{fontSize:10,color:"#22d3ee",background:"rgba(34,211,238,.1)",padding:"5px 9px",borderRadius:99}}>{interDomLinks.length} liaisons</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))"}}>{interDomLinks.slice(0,8).map(function(link,i){var c1=(DC[link.d1]||DC.Autre).ac;var c2=(DC[link.d2]||DC.Autre).ac;return <div key={i} onClick={function(){setUrbZone(link.d1);setUrbSelApp(null);setUrbFlowPair(null);}} style={{padding:"15px 18px",display:"flex",alignItems:"center",gap:9,borderRight:"1px solid "+urbLine,borderBottom:"1px solid "+urbLine,cursor:"pointer",transition:"background .15s"}} onMouseEnter={function(e){e.currentTarget.style.background=urbDark?"rgba(148,163,184,.06)":"#f8fafc";}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><span style={{width:8,height:8,borderRadius:99,background:c1,boxShadow:"0 0 10px "+c1,flexShrink:0}}/><span style={{fontSize:10,fontWeight:700,color:c1,flex:1}}>{link.d1}</span><span style={{fontSize:12,color:urbMuted}}>→</span><span style={{fontSize:10,fontWeight:700,color:c2,flex:1,textAlign:"right"}}>{link.d2}</span><span style={{fontSize:10,fontWeight:800,color:T.fg,background:urbDark?"rgba(148,163,184,.12)":"#f1f5f9",padding:"4px 7px",borderRadius:7}}>{link.cnt}</span></div>;})}</div></div>}
        </div>
      </div>
    </div></div></AppCtx.Provider>;

    return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg,minWidth:0}}>
      <UrbTopbar/>
      <div style={{flex:1,overflow:"auto",padding:"30px clamp(18px, 4vw, 56px) 48px",background:urbDark?"radial-gradient(ellipse at 68% 0%, rgba(99,102,241,0.10), transparent 42%), "+T.bg:"radial-gradient(ellipse at 68% 0%, rgba(99,102,241,0.08), transparent 42%), "+T.bg}}>
        <div style={{maxWidth:1320,margin:"0 auto"}}>
          <section style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:18,padding:"14px 18px",borderRadius:14,border:"1px solid "+urbLine,background:urbDark?"rgba(15,23,42,0.52)":"rgba(255,255,255,0.72)",boxShadow:urbDark?"0 12px 28px rgba(15,23,42,0.22)":"0 9px 22px rgba(15,23,42,0.06)"}}>
            <div>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:zoneCC.ac,marginBottom:6}}>Exploration visuelle</div>
              <div style={{fontSize:14,fontWeight:700,color:T.fg,letterSpacing:"-0.02em"}}>Cliquez un domaine pour zoomer sur ses applications puis sur leurs flux.</div>
            </div>
            <div style={{fontSize:10,color:urbMuted,background:urbDark?"rgba(148,163,184,0.08)":"#f1f5f9",border:"1px solid "+urbLine,borderRadius:999,padding:"6px 10px",whiteSpace:"nowrap"}}>{allDoms2.length} domaines · {apps.length} applications</div>
          </section>
        </div>
      </div>
    </div></div></AppCtx.Provider>;

    return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg}}>
      <UrbTopbar/>
      <div style={{flex:1,overflow:"auto",padding:"24px 28px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>

          {/* Domain grid — auto-fill responsive */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16,marginBottom:28}}>
            {allDoms2.map(function(dom,di){
              var domApps=apps.filter(function(a){return a.domain===dom;});
              var cc=DC[dom]||DC.Autre;
              var intra=intraCounts[dom]||0;
              var interOut=allDoms2.reduce(function(s,d2){return s+(domFlowCounts[dom+">>"+d2]||0);},0);
              var interIn=allDoms2.reduce(function(s,d1){return s+(domFlowCounts[d1+">>"+dom]||0);},0);
              var totalFlux=intra+interOut+interIn;
              var critH=domApps.filter(function(a){return a.criticality==="Haute";}).length;
              return <div key={dom}
                style={{background:T.bgCard,border:"1.5px solid "+T.border,borderRadius:12,cursor:"pointer",overflow:"hidden",
                  boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
                  animation:"cardIn 0.22s cubic-bezier(0.16,1,0.3,1) both",
                  animationDelay:(di*0.04)+"s",
                  transition:"transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, border-color 0.15s ease"}}
                onClick={function(){setUrbZone(dom);setUrbSelApp(null);setUrbFlowPair(null);}}
                onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-3px) scale(1.02)";e.currentTarget.style.boxShadow="0 8px 24px "+cc.ac+"35";e.currentTarget.style.borderColor=cc.ac;}}
                onMouseLeave={function(e){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.15)";e.currentTarget.style.borderColor=T.border;}}
                onMouseDown={function(e){e.currentTarget.style.transform="scale(0.97)";e.currentTarget.style.transition="transform 80ms ease";}}
                onMouseUp={function(e){e.currentTarget.style.transform="";e.currentTarget.style.transition="transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, border-color 0.15s ease";}}>

                {/* Domain color bar */}
                <div style={{height:4,background:"linear-gradient(90deg,"+cc.ac+","+cc.ac+"88)"}}/>

                <div style={{padding:"14px 16px 12px"}}>
                  {/* Domain name */}
                  <div style={{fontSize:14,fontWeight:800,color:T.fg,letterSpacing:"-0.02em",marginBottom:8}}>{dom}</div>

                  {/* KPI row */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:20,fontWeight:800,color:cc.ac,letterSpacing:"-0.03em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{domApps.length}</div>
                      <div style={{fontSize:10,color:T.fgMuted,marginTop:2}}>apps</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:20,fontWeight:800,color:T.fg,letterSpacing:"-0.03em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{totalFlux}</div>
                      <div style={{fontSize:10,color:T.fgMuted,marginTop:2}}>flux</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:20,fontWeight:800,color:critH>0?"#EF4444":T.fgDim,letterSpacing:"-0.03em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{critH}</div>
                      <div style={{fontSize:10,color:T.fgMuted,marginTop:2}}>critiques</div>
                    </div>
                  </div>

                  {/* Inter-domain flux badges */}
                  {(interOut>0||interIn>0)&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {interOut>0&&<span style={{fontSize:10,background:"#10B98118",color:"#10B981",border:"1px solid #10B98140",borderRadius:4,padding:"1px 6px",fontWeight:600,display:"flex",alignItems:"center",gap:3}}>
                      <span style={{fontSize:8}}>↑</span>{interOut} sortants
                    </span>}
                    {interIn>0&&<span style={{fontSize:10,background:"#6366F118",color:"#6366F1",border:"1px solid #6366F140",borderRadius:4,padding:"1px 6px",fontWeight:600,display:"flex",alignItems:"center",gap:3}}>
                      <span style={{fontSize:8}}>↓</span>{interIn} entrants
                    </span>}
                  </div>}

                  {/* D1/D2 coverage */}
                  {function(){
                    var d1=domApps.filter(function(a){return a.statusD1;}).length;
                    var d2=domApps.filter(function(a){return a.statusD2;}).length;
                    if(!d1&&!d2)return null;
                    return <div style={{display:"flex",gap:5,marginTop:8}}>
                      {d1>0&&<span style={{fontSize:10,background:"#F59E0B12",color:"#F59E0B",border:"1px solid #F59E0B35",borderRadius:4,padding:"1px 6px"}}>D1: {d1}/{domApps.length}</span>}
                      {d2>0&&<span style={{fontSize:10,background:"#8B5CF612",color:"#8B5CF6",border:"1px solid #8B5CF635",borderRadius:4,padding:"1px 6px"}}>D2: {d2}/{domApps.length}</span>}
                    </div>;
                  }()}

                  <div style={{fontSize:10,color:T.fgMuted,marginTop:10,display:"flex",alignItems:"center",gap:4}}>
                    <span>Détail</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
                  </div>
                </div>
              </div>;
            })}
          </div>

          {/* Inter-domain flow table */}
          {interDomLinks.length>0&&<div style={{background:T.bgCard,borderRadius:12,border:"1px solid "+T.border,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",gap:8}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"#6366F1"}}><path d="M18 7l4 4-4 4"/><path d="M6 17l-4-4 4-4"/><path d="M14.5 4l-5 16"/></svg>
              <span style={{fontSize:12,fontWeight:700,color:T.fg}}>Flux inter-domaines</span>
              <span style={{fontSize:11,color:T.fgMuted}}>({interDomLinks.length} connexions)</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))"}}>
              {interDomLinks.slice(0,12).map(function(link,i){
                var cc1=DC[link.d1]||DC.Autre;
                var cc2=DC[link.d2]||DC.Autre;
                return <div key={i} style={{padding:"10px 16px",borderBottom:"1px solid "+T.borderLight,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,fontWeight:600,color:cc1.ac,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link.d1}</span>
                  <span style={{fontSize:10,background:"#6366F118",color:"#6366F1",border:"1px solid #6366F130",borderRadius:10,padding:"1px 7px",fontWeight:700,flexShrink:0}}>{link.cnt}</span>
                  <span style={{fontSize:11,fontWeight:600,color:cc2.ac,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{link.d2}</span>
                </div>;
              })}
            </div>
          </div>}
        </div>
      </div>
    </div></div></AppCtx.Provider>;
  }

  // ══ NIVEAU 2: Zone detail ══
  var zoneApps=apps.filter(function(a){return a.domain===urbZone;});
  var zoneCC=(DC[urbZone]||DC.Autre);
  var quartiers={};
  zoneApps.forEach(function(a){var cat=a.category||"Autre";if(!quartiers[cat])quartiers[cat]=[];quartiers[cat].push(a);});
  var quartierList=Object.entries(quartiers).sort(function(a,b){return b[1].length-a[1].length;});
  var zoneFlowsOut=flows.filter(function(f){var fa=apps.find(function(a){return a.id===f.from;});return fa&&fa.domain===urbZone;});
  var zoneFlowsIn=flows.filter(function(f){var ta=apps.find(function(a){return a.id===f.to;});return ta&&ta.domain===urbZone;});
  var pairFlows={};
  zoneFlowsOut.concat(zoneFlowsIn).forEach(function(f){
    var fa=apps.find(function(a){return a.id===f.from;});
    var ta=apps.find(function(a){return a.id===f.to;});
    if(!fa||!ta)return;
    var k=fa.id+">>"+ta.id;
    if(!pairFlows[k])pairFlows[k]={from:fa,to:ta,flows:[],count:0};
    pairFlows[k].flows.push(f);pairFlows[k].count++;
  });
  var pairList=Object.values(pairFlows).sort(function(a,b){return b.count-a.count;});
  var filteredPairList=urbSelApp?pairList.filter(function(p){return p.from.id===urbSelApp.id||p.to.id===urbSelApp.id;}):pairList;
  var detailFlows=urbFlowPair?pairFlows[urbFlowPair]:null;
  var urbDark=!!isDark;
  var urbMuted=urbDark?"#a0a7ba":"#59657B";
  var urbLine=urbDark?"rgba(148,163,184,0.14)":"rgba(71,85,105,0.17)";
  var selectedAppFlows=urbSelApp?flows.filter(function(f){return f.from===urbSelApp.id||f.to===urbSelApp.id;}):[];
  var selectedAppOut=selectedAppFlows.filter(function(f){return f.from===urbSelApp.id;}).length;
  var selectedAppIn=selectedAppFlows.length-selectedAppOut;
  var selectedAppPairs=filteredPairList.length;
  var selectedAppStatusColor=urbSelApp&&urbSelApp.criticality==="Haute"?"#fb7185":urbSelApp&&urbSelApp.criticality==="Moyenne"?"#fbbf24":"#34d399";
  var selectedPairColor="#38bdf8";

  return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg,minWidth:0}}>
    <UrbTopbar/>
    <div style={{flex:1,overflowY:"auto",padding:"clamp(18px,3vw,34px) clamp(16px,3vw,42px) 48px",background:urbDark?"radial-gradient(ellipse at 82% 0%, rgba(99,102,241,.09), transparent 38%), "+T.bg:"radial-gradient(ellipse at 12% 0%, rgba(99,102,241,.075), transparent 38%), radial-gradient(ellipse at 92% 78%, rgba(14,165,233,.045), transparent 34%), "+T.bg}}>
      <div style={{maxWidth:urbExpanded?1500:1240,margin:"0 auto",transition:"max-width 0.25s ease"}}>

        {/* Zone header */}
        <div style={{position:"relative",overflow:"hidden",borderRadius:18,marginBottom:17,padding:"23px clamp(18px,3vw,30px)",background:urbDark?"linear-gradient(112deg,"+zoneCC.ac+"35, #10131f 70%)":"linear-gradient(112deg,"+zoneCC.ac+"22, #FBFCFF 72%)",border:"1px solid "+zoneCC.ac+(urbDark?"45":"55"),boxShadow:urbDark?"0 18px 46px "+zoneCC.ac+"12":"0 16px 38px rgba(30,41,59,.08), 0 0 0 1px "+zoneCC.ac+"0A",animation:"cardIn .25s cubic-bezier(.16,1,.3,1)"}}>
          <div style={{position:"absolute",width:220,height:220,right:-85,top:-118,borderRadius:"50%",background:"radial-gradient(circle,"+zoneCC.ac+"35,transparent 70%)",pointerEvents:"none"}}/>
          <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:800,letterSpacing:".14em",textTransform:"uppercase",color:zoneCC.ac,marginBottom:8}}>02 · Domaine métier</div><div style={{fontSize:"clamp(24px,3vw,34px)",fontWeight:850,letterSpacing:"-.04em",color:T.fg,lineHeight:1.05}}>{urbZone}</div><div style={{display:"flex",gap:7,alignItems:"center",marginTop:12,flexWrap:"wrap"}}><span style={{fontSize:10,color:urbMuted}}>{zoneApps.length} applications</span><span style={{color:urbLine}}>·</span><span style={{fontSize:10,color:urbMuted}}>{zoneFlowsOut.length+zoneFlowsIn.length} flux associés</span><span style={{color:urbLine}}>·</span><span style={{fontSize:10,color:urbMuted}}>{pairList.length} connexions</span></div></div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={function(e){e.stopPropagation();setUrbExpanded(function(p){return !p;});}} title={urbExpanded?"Reduire":"Agrandir"} style={{background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:4,transition:"background 0.12s"}}
              onMouseEnter={function(e){e.currentTarget.style.background="rgba(255,255,255,0.28)";}}
              onMouseLeave={function(e){e.currentTarget.style.background="rgba(255,255,255,0.18)";}}>
              {urbExpanded
                ?<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/><polyline points="9 18 3 12 9 6"/></svg>
                :<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/><polyline points="15 6 21 12 15 18"/></svg>}
              {urbExpanded?"Réduire":"Élargir"}
            </button>
            </div>
          </div>
        </div>

        {/* Workspace à trois étapes : application → connexion → détail du flux */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,270px),1fr))",gap:14,alignItems:"start",transition:"grid-template-columns .25s ease"}}>

          {/* Left: quartiers */}
          <div style={{...urbPanel,padding:16,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><span style={{width:28,height:28,borderRadius:9,display:"grid",placeItems:"center",background:zoneCC.ac+"20",color:zoneCC.ac,fontSize:11,fontWeight:850}}>01</span><div><div style={{fontSize:13,fontWeight:800,color:T.fg}}>Applications</div><div style={{fontSize:10,color:urbMuted,marginTop:3}}>{urbSelApp?"Point de départ sélectionné":"Choisissez une application"}</div></div><span style={{marginLeft:"auto",fontSize:9,color:urbMuted,background:urbDark?"rgba(148,163,184,.08)":"#f1f5f9",padding:"5px 7px",borderRadius:7}}>{zoneApps.length}</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {quartierList.map(function(entry,qi){
                var cat=entry[0];var catApps=entry[1];
                var isOtherCategory=cat==="Autre";
                return <div key={cat} style={isOtherCategory?{animation:"cardIn .2s cubic-bezier(.16,1,.3,1) both",animationDelay:(qi*.04)+"s"}:{background:urbDark?"rgba(148,163,184,.045)":"#F5F7FC",borderRadius:12,padding:"11px 12px",border:"1px solid "+urbLine,animation:"cardIn .2s cubic-bezier(.16,1,.3,1) both",animationDelay:(qi*.04)+"s"}}>
                  {!isOtherCategory&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:9,fontWeight:800,color:zoneCC.ac,textTransform:"uppercase",letterSpacing:".1em",marginBottom:9}}>{cat}<span style={{color:urbMuted,fontWeight:600,letterSpacing:0}}>{catApps.length} apps</span></div>}
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {catApps.map(function(app){
                      var nFlux=flows.filter(function(f){return f.from===app.id||f.to===app.id;}).length;
                      var isSelApp=urbSelApp&&urbSelApp.id===app.id;
                      return <div key={app.id} role="button" tabIndex={0} title={app.name+(nFlux>0?" · "+nFlux+" flux":"")} onClick={function(){setUrbSelApp(isSelApp?null:app);setUrbFlowPair(null);}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();setUrbSelApp(isSelApp?null:app);setUrbFlowPair(null);}}}
                        style={{display:"flex",alignItems:"center",gap:9,background:isSelApp?zoneCC.ac+(urbDark?"20":"12"):(urbDark?"rgba(15,23,42,.52)":"#fff"),border:"1px solid "+(isSelApp?zoneCC.ac+"90":urbLine),borderRadius:10,padding:"9px 10px",fontSize:11,color:T.fg,fontWeight:650,position:"relative",cursor:"pointer",transition:"transform .16s ease, box-shadow .16s ease, border-color .16s ease",userSelect:"none"}}
                        onMouseEnter={function(e){e.currentTarget.style.transform="translateX(2px)";e.currentTarget.style.boxShadow="0 5px 16px rgba(0,0,0,.13)";e.currentTarget.style.borderColor=zoneCC.ac+"90";}}
                        onMouseLeave={function(e){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor=isSelApp?zoneCC.ac+"90":urbLine;}}>
                        <span style={{width:25,height:25,flexShrink:0,borderRadius:8,display:"grid",placeItems:"center",background:zoneCC.ac+"20",color:zoneCC.ac,fontSize:11,fontWeight:800}}>▦</span>
                        <span style={{minWidth:0,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{app.name}</span>
                        {app.criticality&&<span style={{width:7,height:7,borderRadius:99,background:app.criticality==="Haute"?"#fb7185":app.criticality==="Moyenne"?"#fbbf24":"#34d399",boxShadow:app.criticality==="Haute"?"0 0 8px #fb718580":"none"}} title={"Criticité "+app.criticality}/>}
                        <span style={{fontSize:9,color:urbMuted,background:urbDark?"rgba(148,163,184,.1)":"#f1f5f9",padding:"4px 6px",borderRadius:7,whiteSpace:"nowrap"}}>{nFlux} flux</span>
                      </div>;
                    })}
                  </div>
                </div>;
              })}
            </div>
          </div>

          {/* Right: flux */}
          <div style={{...urbPanel,padding:16,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{width:28,height:28,borderRadius:9,display:"grid",placeItems:"center",background:"rgba(56,189,248,.13)",color:"#38bdf8",fontSize:11,fontWeight:850}}>02</span>
                <div><div style={{fontSize:13,fontWeight:800,color:T.fg}}>Connexions</div><div style={{fontSize:10,color:urbMuted,marginTop:3}}>{filteredPairList.length}{urbSelApp?" / "+pairList.length:""} itinéraires{urbSelApp?" · filtrés par application":" · dans le domaine"}</div></div>
              </div>
              {detailFlows&&<button onClick={function(){setUrbFlowPair(null);}} style={{fontSize:10,color:"#38bdf8",background:"rgba(56,189,248,.1)",border:"1px solid rgba(56,189,248,.2)",borderRadius:8,cursor:"pointer",padding:"6px 8px",fontWeight:700}}>Toutes</button>}
            </div>

            {filteredPairList.length===0&&<div style={{fontSize:11,color:urbMuted,fontStyle:"italic",padding:"20px 12px",textAlign:"center",border:"1px dashed "+urbLine,borderRadius:11,marginTop:12}}>{urbSelApp?"Aucun flux pour cette application":"Aucun flux pour ce domaine"}</div>}

            {!detailFlows&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
              {filteredPairList.map(function(pair,pi){
                var fa=pair.from;var ta=pair.to;
                var faCC=DC[fa.domain]||DC.Autre;
                var taCC=DC[ta.domain]||DC.Autre;
                var isSameZone=fa.domain===urbZone&&ta.domain===urbZone;
                var pairKey=fa.id+">>"+ta.id;
                var pairIsSelected=urbFlowPair===pairKey;
                return <div key={pi} onClick={function(){setUrbFlowPair(pairKey);}}
                  style={{background:pairIsSelected?(urbDark?"rgba(56,189,248,.12)":"rgba(14,165,233,.08)"):(urbDark?"rgba(148,163,184,.045)":"#f8fafc"),borderRadius:12,padding:"12px 12px",border:"1px solid "+(pairIsSelected?"rgba(56,189,248,.52)":urbLine),cursor:"pointer",transition:"transform .16s,background .16s,border-color .16s,box-shadow .16s",animation:"cardIn .18s ease both",animationDelay:(pi*.025)+"s"}}
                  onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.background=urbDark?"rgba(56,189,248,.1)":"#f0f9ff";e.currentTarget.style.borderColor="rgba(56,189,248,.52)";e.currentTarget.style.boxShadow="0 6px 18px rgba(14,165,233,.09)";}}
                  onMouseLeave={function(e){e.currentTarget.style.transform="";e.currentTarget.style.background=pairIsSelected?(urbDark?"rgba(56,189,248,.12)":"rgba(14,165,233,.08)"):(urbDark?"rgba(148,163,184,.045)":"#f8fafc");e.currentTarget.style.borderColor=pairIsSelected?"rgba(56,189,248,.52)":urbLine;e.currentTarget.style.boxShadow="";}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:12,fontWeight:700,color:T.fg,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fa.name}</span>
                    <UrbFlowArrow color={pairIsSelected?"#22d3ee":"#818cf8"} width={26}/>
                    <span style={{fontSize:12,fontWeight:700,color:T.fg,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{ta.name}</span>
                    <span style={{fontSize:10,background:"rgba(56,189,248,.12)",color:"#38bdf8",border:"1px solid rgba(56,189,248,.22)",borderRadius:8,padding:"3px 7px",fontWeight:800,flexShrink:0}}>{pair.count}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span style={{fontSize:10,color:faCC.ac,fontWeight:600}}>{isSameZone?"interne":fa.domain}</span>
                    <span style={{fontSize:10,color:urbMuted}}>{pair.flows.length} flux métier</span>
                    <span style={{fontSize:10,color:taCC.ac,fontWeight:600}}>{isSameZone?"":ta.domain}</span>
                  </div>
                </div>;
              })}
            </div>}

          </div>

          {/* Third step: selected application or selected flow details */}
          <div style={{...urbPanel,padding:16,minWidth:0,minHeight:250,animation:"cardIn .22s cubic-bezier(.16,1,.3,1) both"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><span style={{width:28,height:28,borderRadius:9,display:"grid",placeItems:"center",background:"rgba(139,92,246,.14)",color:"#a78bfa",fontSize:11,fontWeight:850}}>03</span><div><div style={{fontSize:13,fontWeight:800,color:T.fg}}>{detailFlows?"Détail des flux":urbSelApp?"Fiche application":"Détail"}</div><div style={{fontSize:10,color:urbMuted,marginTop:3}}>{detailFlows?"Données échangées et protocoles":urbSelApp?"Dépendances et informations clés":"Sélectionnez une application ou une connexion"}</div></div></div>

            {detailFlows&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 34px minmax(0,1fr)",alignItems:"center",gap:7,padding:"14px 11px",borderRadius:14,background:"linear-gradient(120deg,"+(DC[detailFlows.from.domain]||DC.Autre).ac+"22, rgba(56,189,248,.10), "+(DC[detailFlows.to.domain]||DC.Autre).ac+"22)",border:"1px solid rgba(56,189,248,.24)"}}><div style={{minWidth:0}}><div style={{fontSize:8,color:urbMuted,textTransform:"uppercase",letterSpacing:".1em"}}>Émetteur</div><div style={{fontSize:11,fontWeight:800,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:4}}>{detailFlows.from.name}</div><div style={{fontSize:8,color:(DC[detailFlows.from.domain]||DC.Autre).ac,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{detailFlows.from.domain}</div></div><div style={{width:32,height:32,borderRadius:11,display:"grid",placeItems:"center",background:"rgba(56,189,248,.16)",boxShadow:"0 0 18px rgba(56,189,248,.12)"}}><UrbFlowArrow color="#38bdf8" width={30}/></div><div style={{minWidth:0,textAlign:"right"}}><div style={{fontSize:8,color:urbMuted,textTransform:"uppercase",letterSpacing:".1em"}}>Récepteur</div><div style={{fontSize:11,fontWeight:800,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:4}}>{detailFlows.to.name}</div><div style={{fontSize:8,color:(DC[detailFlows.to.domain]||DC.Autre).ac,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{detailFlows.to.domain}</div></div></div>
              <div style={{fontSize:10,color:urbMuted}}>{detailFlows.flows.length} flux métier dans cette connexion</div>
              {detailFlows.flows.map(function(f,fi){return <div key={f.id||fi} style={{background:urbDark?"rgba(148,163,184,.045)":"#F5F7FC",borderRadius:12,padding:12,border:"1px solid "+urbLine,animation:"cardIn .18s ease both",animationDelay:(fi*.04)+"s"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><span style={{fontSize:10,fontWeight:800,color:"#38bdf8",background:"rgba(56,189,248,.12)",border:"1px solid rgba(56,189,248,.2)",padding:"5px 8px",borderRadius:7}}>{f.protocol||"Protocole non renseigné"}</span>{f.frequency&&<span style={{fontSize:9,color:urbMuted,background:urbDark?"rgba(148,163,184,.1)":"#eef2f7",padding:"5px 7px",borderRadius:7}}>{f.frequency}</span>}</div>
                <div style={{fontSize:12,fontWeight:750,color:T.fg,marginTop:10}}>{f.label||"Flux sans libellé"}</div>{f.description&&<div style={{fontSize:10,color:urbMuted,marginTop:5,lineHeight:1.6}}>{f.description}</div>}
              </div>;})}
            </div>}

            {!detailFlows&&urbSelApp&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{padding:14,borderRadius:14,background:"linear-gradient(135deg,"+zoneCC.ac+"24, "+(urbDark?"rgba(15,23,42,.8)":"#f8fafc")+")",border:"1px solid "+zoneCC.ac+"35"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}><div style={{minWidth:0}}><div style={{fontSize:10,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",color:zoneCC.ac}}>Application</div><div style={{fontSize:18,fontWeight:850,letterSpacing:"-.03em",color:T.fg,marginTop:5,overflowWrap:"anywhere"}}>{urbSelApp.name}</div></div><span style={{fontSize:9,fontWeight:800,color:selectedAppStatusColor,background:selectedAppStatusColor+"18",border:"1px solid "+selectedAppStatusColor+"35",borderRadius:8,padding:"6px 8px",whiteSpace:"nowrap"}}>{urbSelApp.criticality||"Criticité n.d."}</span></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:14}}>{[["FLUX",selectedAppFlows.length],["SORTANTS",selectedAppOut],["ENTRANTS",selectedAppIn]].map(function(m){return <div key={m[0]} style={{padding:"8px 6px",borderRadius:9,textAlign:"center",background:urbDark?"rgba(2,6,23,.32)":"rgba(255,255,255,.72)"}}><div style={{fontSize:15,fontWeight:850,color:T.fg}}>{m[1]}</div><div style={{fontSize:8,color:urbMuted,letterSpacing:".06em",marginTop:3}}>{m[0]}</div></div>;})}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{[["Éditeur",urbSelApp.vendor],["Version",urbSelApp.version],["Responsable",urbSelApp.owner],["Utilisateurs",urbSelApp.users],["Statut",urbSelApp.status],["Catégorie",urbSelApp.category]].filter(function(x){return x[1]&&!(x[0]==="Catégorie"&&x[1]==="Autre");}).map(function(x){return <div key={x[0]} style={{padding:"8px 9px",borderRadius:9,background:urbDark?"rgba(148,163,184,.045)":"#f8fafc",border:"1px solid "+urbLine,minWidth:0}}><div style={{fontSize:8,color:urbMuted,textTransform:"uppercase",letterSpacing:".08em"}}>{x[0]}</div><div style={{fontSize:10,color:T.fg,fontWeight:650,marginTop:4,overflowWrap:"anywhere"}}>{x[1]}</div></div>;})}</div>
              {urbSelApp.description&&<div style={{fontSize:10,color:urbMuted,lineHeight:1.6,padding:"10px 11px",borderLeft:"2px solid "+zoneCC.ac,background:urbDark?"rgba(148,163,184,.04)":"#f8fafc",borderRadius:"0 9px 9px 0"}}>{urbSelApp.description}</div>}
              <div style={{fontSize:10,fontWeight:750,color:T.fg,marginTop:2}}>Flux associés <span style={{color:urbMuted,fontWeight:500}}>· cliquez une connexion pour le détail</span></div>
              {selectedAppFlows.length===0&&<div style={{fontSize:10,color:urbMuted,fontStyle:"italic",padding:"12px 4px"}}>Aucune dépendance recensée.</div>}
              {selectedAppFlows.slice(0,8).map(function(f,i){var outbound=f.from===urbSelApp.id;var other=apps.find(function(a){return a.id===(outbound?f.to:f.from);});var pairKey=f.from+">>"+f.to;return <div key={f.id||i} onClick={function(){setUrbFlowPair(pairKey);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 9px",borderRadius:9,background:urbDark?"rgba(148,163,184,.045)":"#f8fafc",border:"1px solid "+urbLine,cursor:"pointer"}}><span style={{fontSize:8,fontWeight:800,color:outbound?"#34d399":"#818cf8",background:outbound?"rgba(52,211,153,.12)":"rgba(129,140,248,.12)",padding:"4px 5px",borderRadius:6}}>{outbound?"SORTANT":"ENTRANT"}</span><span style={{minWidth:0,flex:1,fontSize:10,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{other?other.name:"Application inconnue"}</span><UrbFlowArrow color={outbound?"#34d399":"#818cf8"} width={22}/></div>;})}
            </div>}

            {!detailFlows&&!urbSelApp&&<div style={{height:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:18}}><div style={{width:52,height:52,borderRadius:17,display:"grid",placeItems:"center",background:urbDark?"rgba(139,92,246,.12)":"#f5f3ff",color:"#a78bfa",fontSize:22,marginBottom:14}}>⌁</div><div style={{fontSize:12,fontWeight:750,color:T.fg}}>Votre architecture, en détail</div><div style={{fontSize:10,color:urbMuted,lineHeight:1.6,maxWidth:240,marginTop:7}}>Sélectionnez une application à gauche ou une connexion au centre pour afficher ses dépendances et ses flux métier.</div></div>}
          </div>
        </div>
      </div>
    </div>
  </div></div></AppCtx.Provider>;
  }


  if(view==="decisions"&&projectType==='deal'){
    var doms_dec=[...new Set(apps.map(function(a){return a.domain;}))].sort();
    var sd1c={"Transfert TSA":"#F59E0B","Maintien":"#10B981","Rebuild":"#6366F1","Abandon":"#EF4444"};
    var sd2c={"Clone & Clean":"#3B82F6","Transfert":"#10B981","Abandon":"#EF4444","Rebuild":"#8B5CF6"};
    function getDecState(id){return decisionStates[id]||0;}
    function cycleState(id){setDecisionStates(function(p){var cur=p[id]||0;return{...p,[id]:(cur+1)%3};});}
    function setAllState(n){var ns={};apps.forEach(function(a){ns[a.id]=n;});setDecisionStates(ns);}
    var d1TotDef=apps.filter(function(a){return a.statusD1;}).length;
    var d2TotDef=apps.filter(function(a){return a.statusD2;}).length;
    var activeCount=Object.keys(decisionStates).filter(function(k){return decisionStates[k]>0;}).length;

    return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg}}>
      {/* Topbar */}
      <div style={{background:T.bgAlt,borderBottom:"1px solid "+T.border,padding:"10px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:T.fg,letterSpacing:"-0.02em",lineHeight:1}}>Decisions Carve-Out</div>
          <div style={{fontSize:11,color:T.fgMuted,marginTop:2}}>Cliquez une fois pour D1, deux fois pour D2</div>
        </div>
        <div style={{flex:1}}/>
        {/* Global controls */}
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {[["Tout neutre",0,"#6B6B9A"],["Tout Day 1",1,"#F59E0B"],["Tout Day 2",2,"#8B5CF6"]].map(function(m){
            return <button key={m[0]} onClick={function(){setAllState(m[1]);}} style={{background:m[2]+"18",border:"1px solid "+m[2]+"45",color:m[2],borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>{m[0]}</button>;
          })}
          <button onClick={function(){setDecisionStates({});}} style={{background:T.bgCard,border:"1px solid "+T.border,color:T.fgMuted,borderRadius:8,padding:"5px 12px",fontSize:11,cursor:"pointer"}}>Reset</button>
        </div>
        {/* Stats */}
        <div style={{display:"flex",gap:8,marginLeft:4}}>
          <span style={{fontSize:10,background:"#F59E0B15",color:"#F59E0B",border:"1px solid #F59E0B40",borderRadius:6,padding:"3px 8px",fontWeight:600}}>D1: {d1TotDef} def.</span>
          <span style={{fontSize:10,background:"#8B5CF615",color:"#8B5CF6",border:"1px solid #8B5CF640",borderRadius:6,padding:"3px 8px",fontWeight:600}}>D2: {d2TotDef} def.</span>
          {activeCount>0&&<span style={{fontSize:10,background:"#6366F115",color:"#6366F1",border:"1px solid #6366F140",borderRadius:6,padding:"3px 8px",fontWeight:600}}>{activeCount} visibles</span>}
        </div>
        <button onClick={function(){setView("mapping");setTimeout(fitCanvas,50);}} style={{...B,background:"#6366F1",padding:"5px 12px",fontSize:11,borderRadius:8,display:"flex",alignItems:"center",gap:5}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Cartographie
        </button>
      </div>

      {/* Grid by domain */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        {doms_dec.map(function(dom,di){
          var da=apps.filter(function(a){return a.domain===dom;});
          if(!da.length)return null;
          var dc=DC[dom]||DC.Autre;
          return <div key={dom} style={{marginBottom:20,animation:"cardIn 0.22s cubic-bezier(0.16,1,0.3,1) both",animationDelay:(di*0.04)+"s"}}>
            {/* Domain header */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:3,height:18,background:dc.ac,borderRadius:2,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:800,color:T.fg,textTransform:"uppercase",letterSpacing:"0.06em"}}>{dom}</span>
              <span style={{fontSize:10,color:T.fgMuted,background:T.bgCard,border:"1px solid "+T.border,borderRadius:4,padding:"1px 6px"}}>{da.length} app{da.length>1?"s":""}</span>
            </div>
            {/* App cards */}
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              {da.sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(app,ai){
                var st=getDecState(app.id);
                var d1c=app.statusD1?sd1c[app.statusD1]:null;
                var d2c=app.statusD2?sd2c[app.statusD2]:null;
                var borderColor=st===1?(d1c||"#F59E0B"):st===2?(d2c||"#8B5CF6"):(dc.ac+"80");
                var bandeauColor=st===1?(d1c||"#F59E0B"):st===2?(d2c||"#8B5CF6"):null;
                var bandeauLabel=st===1?(app.statusD1?(app.statusD1==="Transfert TSA"?"TSA":app.statusD1):"Non defini"):st===2?(app.statusD2?(app.statusD2==="Clone & Clean"?"Clone":app.statusD2):"Non defini"):null;
                var isUndef=(st===1&&!app.statusD1)||(st===2&&!app.statusD2);
                var d1Label=app.statusD1?(app.statusD1==="Transfert TSA"?"TSA":app.statusD1):null;
                var d2Label=app.statusD2?(app.statusD2==="Clone & Clean"?"Clone":app.statusD2):null;
                var isRisk=app.statusD1==="Abandon"&&flows.some(function(f){return f.from===app.id||f.to===app.id;});
                return <div key={app.id}
                  onClick={function(){cycleState(app.id);}}
                  style={{
                    background:st===0?T.bgCard:(bandeauColor||borderColor)+"10",
                    border:"2px solid "+(isUndef?"#3A3A6080":borderColor),
                    borderRadius:10,
                    width:160,
                    overflow:"hidden",
                    opacity:isUndef?0.5:1,
                    cursor:"pointer",
                    userSelect:"none",
                    display:"flex",
                    flexDirection:"column",
                    transition:"background 0.18s ease, border-color 0.18s ease, box-shadow 0.15s ease, opacity 0.18s ease",
                    boxShadow:st>0?"0 4px 16px "+(bandeauColor||borderColor)+"30":"0 1px 4px rgba(0,0,0,0.12)",
                    animation:"cardIn 0.2s cubic-bezier(0.16,1,0.3,1) both",
                    animationDelay:(di*0.04+ai*0.015)+"s",
                    position:"relative",
                  }}
                  onMouseEnter={function(e){e.currentTarget.style.filter="brightness(1.07)";}}
                  onMouseLeave={function(e){e.currentTarget.style.filter="";}}
                  onMouseDown={function(e){e.currentTarget.style.transform="scale(0.96)";e.currentTarget.style.transition="transform 80ms ease";}}
                  onMouseUp={function(e){e.currentTarget.style.transform="";e.currentTarget.style.transition="background 0.18s ease, border-color 0.18s ease, box-shadow 0.15s ease, opacity 0.18s ease";}}>
                  {/* Risk indicator */}
                  {isRisk&&st===1&&<div style={{position:"absolute",top:4,right:4,width:6,height:6,borderRadius:"50%",background:"#EF4444",boxShadow:"0 0 6px #EF4444"}}/>}
                  {/* Card body — flex:1 pour pousser le footer en bas */}
                  <div style={{flex:1,padding:"10px 12px 8px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <div style={{fontSize:10,fontWeight:700,color:st===0?T.fgDim:borderColor,textTransform:"uppercase",letterSpacing:"0.05em",lineHeight:1}}>{st===0?"neutre":st===1?"day 1":"day 2"}</div>
                      <div style={{fontSize:10,color:CC[app.criticality]||"#888",flexShrink:0}}>{app.criticality==="Haute"?"●":app.criticality==="Basse"?"○":"◐"}</div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:T.fg,lineHeight:1.3,letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{app.name}</div>
                    {app.vendor&&<div style={{fontSize:10,color:T.fgMuted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{app.vendor}</div>}
                  </div>
                  {/* Footer — même hauteur pour bandeau actif et hints neutres */}
                  {bandeauLabel&&<div style={{background:bandeauColor||"#6366F1",padding:"5px 12px",flexShrink:0,animation:"bandeauIn 0.18s cubic-bezier(0.16,1,0.3,1)"}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#fff",letterSpacing:"0.02em"}}>{bandeauLabel}</span>
                  </div>}
                  {st===0&&<div style={{padding:"5px 12px 6px",flexShrink:0}}>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {app.statusD1&&<span style={{fontSize:9,color:"#fff",background:sd1c[app.statusD1]||"#888",borderRadius:3,padding:"1px 6px",fontWeight:700,letterSpacing:"0.02em"}}>D1 · {d1Label}</span>}
                      {app.statusD2&&<span style={{fontSize:9,color:"#fff",background:sd2c[app.statusD2]||"#888",borderRadius:3,padding:"1px 6px",fontWeight:700,letterSpacing:"0.02em"}}>D2 · {d2Label}</span>}
                      {!app.statusD1&&<span style={{fontSize:9,color:T.fgFaint,background:T.bgAlt,borderRadius:3,padding:"1px 5px",border:"1px dashed "+T.border}}>D1 —</span>}
                      {!app.statusD2&&<span style={{fontSize:9,color:T.fgFaint,background:T.bgAlt,borderRadius:3,padding:"1px 5px",border:"1px dashed "+T.border}}>D2 —</span>}
                    </div>
                  </div>}
                </div>;
              })}
            </div>
          </div>;
        })}
        {/* Empty state */}
        {apps.length===0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}>
          <div style={{fontSize:36,opacity:0.3}}>◎</div>
          <div style={{fontSize:14,color:T.fgMuted,fontWeight:500}}>Aucune application chargee</div>
          <div style={{fontSize:12,color:T.fgDim}}>Importez un fichier Excel ou ajoutez des apps manuellement</div>
        </div>}
      </div>
    </div></div></AppCtx.Provider>;
  }

if(view==="dashboard") return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div style={{flex:1,display:"flex",flexDirection:"column"}}>
      <div style={{background:T.bgAlt,borderBottom:"1px solid "+T.borderLight,padding:"8px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <span style={{fontSize:16}}>&#128202;</span>
        <span style={{fontSize:13,fontWeight:700,color:T.fg}}>Dashboard</span>
        <div style={{flex:1}}/>
        <button onClick={function(){setView("mapping");setTimeout(fitCanvas,50);}} style={{...B,background:"#2979FF",padding:"6px 14px",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5}}><span>&#8592;</span> Retour Cartographie</button>
      </div>
      <div style={{overflowY:"auto",flex:1}}><Dashboard/></div>
    </div></div></AppCtx.Provider>;

  /* ═══ MAPPING ═══ */
  var toolbarSurface=isDark?"linear-gradient(145deg, rgba(38,41,68,.96), rgba(20,22,42,.96))":"linear-gradient(145deg,#FFFFFF,#F2F3FB)";
  return <AppCtx.Provider value={ctxValue}><div style={{height:"100%",display:"flex",overflow:"hidden"}}><Sidebar/><div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
    <div ref={toolbarRef} className="mapping-toolbar" style={{background:"linear-gradient(180deg,"+T.bgAlt+","+T.bg+")",borderBottom:"1px solid "+T.borderLight,padding:"10px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0,zIndex:200,flexWrap:"wrap",position:"relative",boxShadow:"0 8px 24px rgba(0,0,0,0.14)"}}>
      <input placeholder="Rechercher apps, domaines…" value={search} onChange={e=>setSearch(e.target.value)} style={{...I,width:180,padding:"8px 11px",borderRadius:10,boxShadow:isDark?"inset 0 1px 0 rgba(255,255,255,.03)":"0 2px 8px rgba(15,23,42,.04)"}}/>
      {/* Dropdown filters */}
      {[
        {id:"domain",label:"Domaine",sel:selDom,setSel:setSelDom,items:doms.map(d=>({v:d,label:d,color:(DC[d]||DC.Autre).ac}))},
        {id:"category",label:"Catégorie",sel:selCat,setSel:setSelCat,items:cats.map(c=>({v:c,label:c,color:"#D63384"}))},
        {id:"criticality",label:"Criticité",sel:selCrit,setSel:setSelCrit,items:["Haute","Moyenne","Basse"].map(c=>({v:c,label:c,color:CC[c]||"#888"}))},
        ...(projectType==='deal'?[
          {id:"d1",label:"Day 1",sel:selD1?[selD1]:[],setSel:function(updater){var prev=selD1?[selD1]:[];var next=typeof updater==="function"?updater(prev):updater;setSelD1(next.length?next[next.length-1]:"");},items:[{v:"Transfert TSA",label:"TSA",color:"#F59E0B"},{v:"Maintien",label:"Maintien",color:"#10B981"},{v:"Rebuild",label:"Rebuild",color:"#6366F1"},{v:"Abandon",label:"Abandon",color:"#EF4444"}]},
          {id:"d2",label:"Day 2",sel:selD2?[selD2]:[],setSel:function(updater){var prev=selD2?[selD2]:[];var next=typeof updater==="function"?updater(prev):updater;setSelD2(next.length?next[next.length-1]:"");},items:[{v:"Clone & Clean",label:"Clone",color:"#3B82F6"},{v:"Transfert",label:"Transfert",color:"#10B981"},{v:"Abandon",label:"Abandon",color:"#EF4444"},{v:"Rebuild",label:"Rebuild",color:"#8B5CF6"}]}
        ]:[
          {id:"statut",label:"Statut",sel:selStatut?[selStatut]:[],setSel:function(updater){var prev=selStatut?[selStatut]:[];var next=typeof updater==="function"?updater(prev):updater;setSelStatut(next.length?next[next.length-1]:"");},          items:STATUT_OPTS.filter(v=>v).map(v=>({v,label:v,color:STATUT_COLORS[v]||"#888"}))}
        ]),
        {id:"hosting",label:"Hébergement",sel:selHost,setSel:setSelHost,items:HOSTING_OPTS.map(v=>({v,label:v,color:HOSTING_COLORS[v]||"#888"}))},
                    {id:"apptype",label:"Type d'app",sel:selAType,setSel:setSelAType,items:APPTYPE_OPTS.map(v=>({v,label:v,color:APPTYPE_COLORS[v]||"#888"}))},
                    {id:"eos",label:"Fin de service",sel:selEos,setSel:setSelEos,items:EOS_BUCKETS.map(b=>({v:b.id,label:b.label,color:b.color}))}
      ].map(flt=>{
        const isOpen=openFilter===flt.id;
        const count=flt.sel.length;
        const activeColor=count>0&&flt.sel[0]&&flt.items.find(it=>it.v===flt.sel[0])?.color||"#548CA8";
        return <div key={flt.id} className="mapping-trigger-anchor" style={{position:"relative"}}>
          <button className="mapping-trigger" aria-haspopup="true" aria-expanded={isOpen} onMouseDown={e=>{e.stopPropagation();setOpenFilter(isOpen?null:flt.id);}} style={{...B,padding:"7px 12px",fontSize:10,background:count>0?"linear-gradient(135deg,"+activeColor+"32,"+activeColor+"12)":toolbarSurface,color:count>0?activeColor:T.fgMuted,border:"1px solid "+(count>0?activeColor+"75":T.border),borderRadius:10,display:"flex",alignItems:"center",gap:6,boxShadow:count>0?"0 4px 12px "+activeColor+"18":"0 2px 8px rgba(0,0,0,.12)"}}>
            {flt.label}{count>0&&<span style={{background:activeColor,color:"#fff",fontSize:10,borderRadius:8,padding:"0 5px",lineHeight:"14px",minWidth:14,textAlign:"center"}}>{count}</span>}
            <span style={{fontSize:10,marginLeft:2}}>{isOpen?"▲":"▼"}</span>
          </button>
          {isOpen&&<div className="mapping-menu" style={{position:"absolute",top:"100%",left:0,marginTop:6,background:T.bgCard,border:"1px solid "+T.border,borderRadius:12,padding:8,minWidth:190,zIndex:300,boxShadow:"0 16px 38px rgba(0,0,0,.32)",maxHeight:280,overflowY:"auto"}} onMouseDown={e=>e.stopPropagation()}>
            <div className="mapping-menu-filter-head" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,padding:"2px 6px"}}>
              <span style={{fontSize:11,color:T.fgMuted}}>{flt.items.length} options</span>
              {flt.sel.length>0&&<span style={{fontSize:11,color:"#E06C75",cursor:"pointer"}} onMouseDown={e=>{e.stopPropagation();flt.setSel([]);}}>Effacer</span>}
            </div>
            {flt.items.map(it=>{
              const on=flt.sel.includes(it.v);
              const appCount=apps.filter(a=>flt.id==="domain"?a.domain===it.v:flt.id==="category"?a.category===it.v:flt.id==="d1"?a.statusD1===it.v:flt.id==="d2"?a.statusD2===it.v:flt.id==="statut"?a.statut===it.v:flt.id==="hosting"?a.hosting===it.v:flt.id==="apptype"?a.appType===it.v:flt.id==="eos"?eosBucket(a.endOfService)===it.v:a.criticality===it.v).length;
              return <div key={it.v} className="mapping-menu-option" aria-selected={on} onMouseDown={e=>{e.stopPropagation();flt.setSel(p=>on?p.filter(x=>x!==it.v):[...p,it.v]);}} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:4,cursor:"pointer",background:on?it.color+"18":"transparent",transition:"background 0.1s"}}
                onMouseEnter={e=>{if(!on)e.currentTarget.style.background="#ffffff08";}} onMouseLeave={e=>{e.currentTarget.style.background=on?it.color+"18":"transparent";}}>
                <div style={{width:14,height:14,borderRadius:4,border:`2px solid ${on?it.color:"#444"}`,background:on?it.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{on&&<span style={{color:"#fff",fontSize:9}}>✓</span>}</div>
                <div style={{width:8,height:8,borderRadius:2,background:it.color,flexShrink:0}}/>
                <span style={{fontSize:11,color:T.fg,flex:1}}>{it.label}</span>
                <span style={{fontSize:11,color:T.fgDim}}>{appCount}</span>
              </div>;})}
          </div>}
        </div>;})}
      {activeFilters&&<button onMouseDown={e=>{e.stopPropagation();setSelDom([]);setSelCat([]);setSelCrit([]);setSelHost([]);setSelAType([]);setSelEos([]);}} style={{...B,padding:"4px 8px",fontSize:11,background:"#FF525220",color:"#FF5252",borderRadius:4}}>✕</button>}
      <div style={{flex:1}}/>
      <button className="mapping-trigger mapping-trigger-primary" onMouseDown={e=>{e.stopPropagation();applyStarLayout();}} title="Regroupe les applications par catégorie, rapproche les domaines les plus connectés et cadre la carte. Les fonctions d’édition restent disponibles." style={{...B,padding:"7px 11px",fontSize:9.5,background:"linear-gradient(120deg,#4F46E5,#6366F1 58%,#0EA5E9)",color:"#fff",border:"1px solid rgba(165,180,252,.45)",borderRadius:11,display:"flex",alignItems:"center",gap:6,fontWeight:800,boxShadow:"0 6px 16px rgba(79,70,229,.28)"}}><span style={{fontSize:13}}>✦</span> Optimiser la disposition</button>
      {/* ── Navigation menu (mouse icon) ── */}
      <div className="mapping-trigger-anchor" style={{position:"relative"}}>
        <button className="mapping-trigger" aria-haspopup="true" aria-expanded={openMenu==="modes"} onClick={function(){setOpenMenu(openMenu==="modes"?null:"modes");}} style={{...B,background:openMenu==="modes"?"linear-gradient(135deg,#6366F130,#0EA5E918)":(!selMode&&!cMode?"linear-gradient(135deg,#6366F12E,#0EA5E91A)":selMode?"linear-gradient(135deg,#00BFA52B,#34D39918)":toolbarSurface),color:!selMode&&!cMode?"#A5B4FC":selMode?"#34D399":T.fgMuted,border:"1px solid "+(!selMode&&!cMode?"#6366F155":selMode?"#00BFA555":T.border),padding:"7px 11px",fontSize:10,borderRadius:10,display:"flex",alignItems:"center",gap:7,boxShadow:"0 3px 10px rgba(0,0,0,.12)"}} title="Mode navigation">
          <span style={{width:20,height:20,borderRadius:7,display:"grid",placeItems:"center",background:!selMode&&!cMode?"rgba(99,102,241,.18)":selMode?"rgba(16,185,129,.16)":"rgba(148,163,184,.12)",fontSize:12}}>&#128432;</span>
          <span style={{fontSize:10,color:!selMode&&!cMode?"#2979FF":selMode?"#00BFA5":T.fg,fontWeight:600}}>{!selMode&&!cMode?"Nav":selMode?"Sél":"Flux"}</span>
          <span style={{fontSize:10,color:T.fgMuted}}>▾</span>
        </button>
        {openMenu==="modes"&&<div className="mapping-menu" style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:T.bgCard,border:"1px solid "+T.border,borderRadius:12,padding:8,minWidth:210,boxShadow:"0 16px 38px rgba(0,0,0,.32)",zIndex:300}}>
          <div className="mapping-menu-heading">Mode de navigation</div>
          <div className="mapping-menu-item" aria-current={!selMode&&!cMode?"true":undefined} onMouseDown={function(e){e.stopPropagation();setSelMode(false);setCMode(false);setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:4,cursor:"pointer",background:!selMode&&!cMode?"#2979FF15":"transparent",border:!selMode&&!cMode?"1px solid #2979FF30":"1px solid transparent",marginBottom:2}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background=!selMode&&!cMode?"#2979FF15":"transparent";}}>
            <span className="mapping-menu-icon" style={{fontSize:16,color:"#818CF8"}}>&#128432;</span>
            <div><div style={{fontSize:11,fontWeight:600,color:!selMode&&!cMode?"#2979FF":T.fg}}>Navigation</div><div style={{fontSize:11,color:T.fgMuted}}>Pan, zoom, déplacer apps</div></div>
          </div>
          <div className="mapping-menu-item" aria-current={selMode?"true":undefined} onMouseDown={function(e){e.stopPropagation();setSelMode(true);setCMode(false);setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:4,cursor:"pointer",background:selMode?"#00BFA515":"transparent",border:selMode?"1px solid #00BFA530":"1px solid transparent"}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background=selMode?"#00BFA515":"transparent";}}>
            <span className="mapping-menu-icon" style={{fontSize:16,color:"#34D399"}}>&#9654;</span>
            <div><div style={{fontSize:11,fontWeight:600,color:selMode?"#00BFA5":T.fg}}>Sélection</div><div style={{fontSize:11,color:T.fgMuted}}>Shift+clic, déplacement groupé</div></div>
          </div>
        </div>}
      </div>
      {/* ── Création menu ── */}
      <div className="mapping-trigger-anchor" style={{position:"relative"}}>
        <button className="mapping-trigger" aria-haspopup="true" aria-expanded={openMenu==="create"} onClick={function(){setOpenMenu(openMenu==="create"?null:"create");}} style={{...B,background:openMenu==="create"?"linear-gradient(135deg,#6366F126,#8B5CF618)":cMode?"linear-gradient(135deg,#EF44442E,#F9731618)":toolbarSurface,color:cMode?"#FB7185":T.fgMuted,border:"1px solid "+(cMode?"#EF444466":openMenu==="create"?"#8B5CF655":T.border),padding:"7px 11px",fontSize:10,borderRadius:10,display:"flex",alignItems:"center",gap:7,boxShadow:cMode?"0 4px 14px rgba(239,68,68,.14)":"0 3px 10px rgba(0,0,0,.12)"}}>
          <span style={{width:20,height:20,borderRadius:7,display:"grid",placeItems:"center",background:cMode?"rgba(239,68,68,.16)":"rgba(16,185,129,.16)",fontSize:14,fontWeight:800,color:cMode?"#FB7185":"#34D399"}}>+</span>
          <span style={{fontSize:10,fontWeight:600,color:cMode?"#FF5252":T.fg}}>Création</span>
          <span style={{fontSize:10,color:T.fgMuted}}>▾</span>
        </button>
        {openMenu==="create"&&<div className="mapping-menu" style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:T.bgCard,border:"1px solid "+T.border,borderRadius:12,padding:8,minWidth:210,boxShadow:"0 16px 38px rgba(0,0,0,.32)",zIndex:300}}>
          <div className="mapping-menu-heading">Créer un élément</div>
          <div className="mapping-menu-item" onClick={function(){setEApp({id:"",name:"",domain:"IT",category:"",description:"",status:"Maintien",criticality:"Moyenne",vendor:"",version:"",owner:"",users:0,x:200-off.x/zm,y:200-off.y/zm,statusD1:"",statusD2:"",statut:""});setShowAM(true);setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:4,cursor:"pointer",marginBottom:2}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
            <span className="mapping-menu-icon" style={{fontSize:16,color:"#34D399"}}>&#9633;</span>
            <div><div style={{fontSize:11,fontWeight:600,color:"#00C853"}}>+ Application</div><div style={{fontSize:11,color:T.fgMuted}}>Ajouter une app au canvas</div></div>
          </div>
          <div className="mapping-menu-item" aria-current={cMode?"true":undefined} onClick={function(){setCMode(!cMode);setFFrom(null);setSelMode(false);setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:4,cursor:"pointer",background:cMode?"#FF525215":"transparent",border:cMode?"1px solid #FF525230":"1px solid transparent"}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background=cMode?"#FF525215":"transparent";}}>
            <span className="mapping-menu-icon" style={{fontSize:16,color:"#FB7185"}}>&#8594;</span>
            <div><div style={{fontSize:11,fontWeight:600,color:cMode?"#FF5252":T.fg}}>Créer un flux</div><div style={{fontSize:11,color:T.fgMuted}}>Clic source → clic cible</div></div>
          </div>
        </div>}
      </div>
      {multiSel.length>0&&<div style={{display:"flex",gap:4,alignItems:"center"}}><span style={{fontSize:10,color:"#00BFA5"}}>{multiSel.length} sél.</span><button onMouseDown={e=>{e.stopPropagation();if(confirm("Supprimer "+multiSel.length+" app(s) ?")){setApps(p=>p.filter(a=>!multiSel.includes(a.id)));setFlows(p=>p.filter(f=>!multiSel.includes(f.from)&&!multiSel.includes(f.to)));setMultiSel([]);}}} style={{...B,padding:"3px 6px",fontSize:11,background:"#FF525220",color:"#FF5252",borderRadius:3}}>🗑</button><button onMouseDown={e=>{e.stopPropagation();setMultiSel([]);}} style={{...B,padding:"3px 6px",fontSize:11,background:T.border,borderRadius:3}}>✕</button></div>}
      {/* ── MENU: Fichier ── */}
      <div className="mapping-trigger-anchor" style={{position:"relative"}}>
        <button className="mapping-trigger" aria-haspopup="true" aria-expanded={openMenu==="file"} onClick={function(){setOpenMenu(openMenu==="file"?null:"file");}} style={{...B,background:openMenu==="file"?"linear-gradient(135deg,#F59E0B22,#F9731612)":toolbarSurface,color:openMenu==="file"?"#FBBF24":T.fgMuted,border:"1px solid "+(openMenu==="file"?"#F59E0B55":T.border),padding:"7px 11px",fontSize:10,letterSpacing:0.1,borderRadius:10,boxShadow:"0 3px 10px rgba(0,0,0,.12)"}}><span style={{width:20,height:20,borderRadius:7,display:"grid",placeItems:"center",background:"rgba(245,158,11,.14)",fontSize:12,marginRight:1}}>&#128193;</span>Fichier ▾</button>
        {openMenu==="file"&&<div className="mapping-menu" style={{position:"absolute",top:"100%",right:0,marginTop:6,background:T.bgCard,border:"1px solid "+T.border,borderRadius:12,padding:8,minWidth:220,boxShadow:"0 16px 38px rgba(0,0,0,.32)",zIndex:300}}>
          <div className="mapping-menu-heading">Données & exports</div>
          <label className="mapping-menu-item" style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><span className="mapping-menu-icon" style={{color:"#38BDF8"}}>↑</span><span>Charger un fichier JSON</span><input type="file" accept=".json" style={{display:"none"}} onChange={function(e){if(e.target.files[0])loadJSON(e.target.files[0]);setOpenMenu(null);}}/></label>
          <div className="mapping-menu-item" onClick={function(){saveJSON();setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><span className="mapping-menu-icon" style={{color:"#34D399"}}>↓</span><span>Sauvegarder en JSON</span></div>
          <div className="mapping-menu-separator" style={{height:1,background:T.border,margin:"4px 0"}}/>
          <div className="mapping-menu-item" onClick={function(){exportCSV();setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><span className="mapping-menu-icon" style={{color:"#38BDF8"}}>⇩</span><span>Exporter CSV</span></div>
          <div className="mapping-menu-item" onClick={function(){exportXLSX();setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><span className="mapping-menu-icon" style={{color:"#34D399"}}>▦</span><span>Exporter XLSX <small style={{display:"block",fontSize:9,color:T.fgMuted,marginTop:2}}>Applications · flux · dashboard</small></span></div>
          <div className="mapping-menu-item" onClick={function(){setShowExportModal(true);setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><span className="mapping-menu-icon" style={{color:"#FB923C"}}>▤</span><span>Exporter PowerPoint</span></div>
          <div className="mapping-menu-separator" style={{height:1,background:T.border,margin:"4px 0"}}/>
          <div className="mapping-menu-item" onClick={function(){setView("home");setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fgMuted}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}><span className="mapping-menu-icon" style={{color:T.fgMuted}}>↻</span><span>Réimporter un fichier</span></div>
        </div>}
      </div>
      {/* ── MENU: Édition de la cartographie ── */}
      <div className="mapping-trigger-anchor" style={{position:"relative"}}>
        <button className="mapping-trigger" aria-haspopup="true" aria-expanded={openMenu==="edit"} onClick={function(){setOpenMenu(openMenu==="edit"?null:"edit");}} style={{...B,background:openMenu==="edit"?"linear-gradient(135deg,#8B5CF626,#6366F116)":toolbarSurface,color:openMenu==="edit"?"#C4B5FD":T.fgMuted,padding:"7px 11px",fontSize:10,letterSpacing:0.1,borderRadius:10,border:"1px solid "+(openMenu==="edit"?"#8B5CF655":T.border),boxShadow:"0 3px 10px rgba(0,0,0,.12)"}}><span style={{width:20,height:20,borderRadius:7,display:"grid",placeItems:"center",background:"rgba(139,92,246,.16)",fontSize:12,marginRight:1}}>✎</span>Édition ▾</button>
        {openMenu==="edit"&&<div className="mapping-menu" style={{position:"fixed",top:toolbarH+topOffset+8,right:12,background:T.bgCard,border:"1px solid "+T.border,borderRadius:14,padding:14,width:340,maxHeight:"78vh",overflowY:"auto",boxShadow:"0 18px 46px rgba(0,0,0,.36)",zIndex:250}}>
          <div className="mapping-menu-header"><div className="mapping-menu-title">Affichage & édition</div><div className="mapping-menu-subtitle">Personnalisez la lecture de votre cartographie</div></div>
          <div className="mapping-menu-section-title">Apparence</div>
          <div className="mapping-segmented">
            <button aria-pressed={!isDark} onClick={function(){setThemeKey("light");}} style={{...B,flex:1,padding:"8px 10px",fontSize:11,background:!isDark?"linear-gradient(135deg,#6366F1,#8B5CF6)":"transparent",color:!isDark?"#fff":T.fgMuted,border:!isDark?"1px solid #818CF8":"1px solid transparent",borderRadius:8}}>☀ Clair</button>
            <button aria-pressed={isDark} onClick={function(){setThemeKey("dark");}} style={{...B,flex:1,padding:"8px 10px",fontSize:11,background:isDark?"linear-gradient(135deg,#6366F1,#8B5CF6)":"transparent",color:isDark?"#fff":T.fgMuted,border:isDark?"1px solid #818CF8":"1px solid transparent",borderRadius:8}}>☾ Sombre</button>
          </div>
          <div className="mapping-menu-section-title">Comportement des flux</div>
          <div className="mapping-segmented">
            <button aria-pressed={flowDisplayMode==="dynamic"} onClick={function(){setFlowDisplayMode("dynamic");setFlowSuppressed(false);setFocusApp(null);setSelFlow(null);}} style={{...B,flex:1,padding:"8px 10px",fontSize:11,background:flowDisplayMode==="dynamic"?"linear-gradient(135deg,#2563EB,#0EA5E9)":"transparent",color:flowDisplayMode==="dynamic"?"#fff":T.fgMuted,border:flowDisplayMode==="dynamic"?"1px solid #38BDF8":"1px solid transparent",borderRadius:8}}>Au survol</button>
            <button aria-pressed={flowDisplayMode==="static"} onClick={function(){setFlowDisplayMode("static");setFlowSuppressed(false);setFocusApp(null);setSelFlow(null);setTimeout(function(){fitCanvas();},80);}} style={{...B,flex:1,padding:"8px 10px",fontSize:11,background:flowDisplayMode==="static"?"linear-gradient(135deg,#2563EB,#0EA5E9)":"transparent",color:flowDisplayMode==="static"?"#fff":T.fgMuted,border:flowDisplayMode==="static"?"1px solid #38BDF8":"1px solid transparent",borderRadius:8}}>Statique</button>
          </div>
          <div style={{height:1,background:T.border,margin:"3px 4px 8px"}}/>
          <div className="mapping-menu-section-title">Lisibilité</div>
          {[{label:"Applications",value:appFontScale,set:setAppFontScale},{label:"Domaines",value:domainFontScale,set:setDomainFontScale},{label:"Catégories",value:categoryFontScale,set:setCategoryFontScale}].map(function(item){return <div key={item.label} style={{padding:"4px 6px"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.fgMuted,marginBottom:2}}><span>{item.label}</span><span style={{color:T.fg}}>{Math.round(item.value*100)}%</span></div>
            <input aria-label={"Police "+item.label} type="range" min="0.8" max="2.4" step="0.1" value={item.value} onChange={function(e){item.set(parseFloat(e.target.value));}} style={{width:"100%",cursor:"pointer"}}/>
          </div>;})}
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"2px 6px 8px"}}>
            <span style={{fontSize:10,color:T.fgMuted,whiteSpace:"nowrap"}}>Police générale</span>
            <input aria-label="Police générale" type="range" min="0.8" max="2.2" step="0.1" value={fontScale} onChange={function(e){setFontScale(parseFloat(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:32,textAlign:"right"}}>{Math.round(fontScale*100)}%</span>
          </div>
          <div className="mapping-menu-action" onClick={function(){setPresMode(true);setOpenMenu(null);}}>▶ Lancer le mode présentation</div>
          <div style={{height:1,background:T.border,margin:"3px 4px 8px"}}/>
          <div className="mapping-menu-section-title">Mise en évidence</div>
          <div style={{display:"flex",gap:5,padding:"3px 4px 8px"}}>
            {[{label:"Apps",value:highlightApps,set:setHighlightApps,color:"#38BDF8"},{label:"Domaines",value:highlightDomains,set:setHighlightDomains,color:"#8B5CF6"},{label:"Catégories",value:highlightCategories,set:setHighlightCategories,color:"#F59E0B"}].map(function(item){return <button key={item.label} onClick={function(){item.set(!item.value);}} style={{flex:1,border:"1px solid "+(item.value?item.color+"80":T.border),background:item.value?item.color+"18":T.bgAlt,color:item.value?item.color:T.fgMuted,borderRadius:6,padding:"5px 3px",fontSize:9,fontWeight:700,cursor:"pointer"}}>{item.value?"✓ ":""}{item.label}</button>;})}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"2px 6px 9px"}}>
            <span style={{fontSize:10,color:T.fgMuted,whiteSpace:"nowrap"}}>Intensité</span>
            <input aria-label="Intensité de surbrillance" type="range" min="0" max="100" step="5" value={highlightStrength} onChange={function(e){setHighlightStrength(parseInt(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:30,textAlign:"right"}}>{highlightStrength}%</span>
          </div>
          <div style={{height:1,background:T.border,margin:"3px 4px 8px"}}/>
          <div className="mapping-menu-section-title">Espacement des groupes</div>
          {[{label:"Applications",value:appSpacing,min:0,max:100,step:5,set:setAppSpacing},{label:"Catégories",value:categorySpacing,min:30,max:360,step:10,set:setCategorySpacing},{label:"Domaines",value:domainSpacing,min:40,max:520,step:20,set:setDomainSpacing}].map(function(item){return <div key={item.label} style={{padding:"4px 6px"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.fgMuted,marginBottom:2}}><span>{item.label}</span><span style={{color:T.fg}}>{item.value}px</span></div>
            <input aria-label={"Espacement "+item.label} type="range" min={item.min} max={item.max} step={item.step} value={item.value} onChange={function(e){item.set(parseInt(e.target.value));}} style={{width:"100%",cursor:"pointer"}}/>
          </div>;})}
          <div style={{height:1,background:T.border,margin:"5px 4px 8px"}}/>
          <div className="mapping-menu-section-title">Dimensions</div>
          {[{label:"Applications",value:globalScale,min:0.5,max:2,step:0.1,set:setGlobalScale,format:function(v){return Math.round(v*100)+"%";}},{label:"Domaines · marge",value:domainPadding,min:20,max:100,step:5,set:setDomainPadding,format:function(v){return v+" px";}},{label:"Catégories · taille",value:categoryScale,min:0.6,max:1.8,step:0.1,set:setCategoryScale,format:function(v){return Math.round(v*100)+"%";}}].map(function(item){return <div key={item.label} style={{padding:"4px 6px"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.fgMuted,marginBottom:2}}><span>{item.label}</span><span style={{color:T.fg}}>{item.format(item.value)}</span></div>
            <input aria-label={"Taille "+item.label} type="range" min={item.min} max={item.max} step={item.step} value={item.value} onChange={function(e){item.set(parseFloat(e.target.value));}} style={{width:"100%",cursor:"pointer"}}/>
          </div>;})}
          <div style={{height:1,background:T.border,margin:"5px 4px 8px"}}/>
          <div className="mapping-menu-section-title">Contours</div>
          {[{label:"Domaines",value:domBorderW,set:setDomBorderW},{label:"Catégories",value:categoryBorderW,set:setCategoryBorderW}].map(function(item){return <div key={item.label} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 6px"}}>
            <span style={{fontSize:10,color:T.fgMuted,minWidth:62}}>{item.label}</span><input aria-label={"Bordure "+item.label} type="range" min="0.5" max="6" step="0.5" value={item.value} onChange={function(e){item.set(parseFloat(e.target.value));}} style={{flex:1,cursor:"pointer"}}/><span style={{fontSize:10,color:T.fg,minWidth:28,textAlign:"right"}}>{item.value}px</span>
          </div>;})}
          <button onClick={function(){setOpenMenu(null);applyStarLayout();}} style={{...B,width:"100%",marginTop:8,padding:"7px 10px",fontSize:10,background:"#6366F1",color:"#fff"}}>⟳ Appliquer le réagencement auto</button>
        </div>}
      </div>
      {/* ── MENU: Flux & Domaines ── */}
      <div className="mapping-trigger-anchor" style={{position:"relative"}}>
        <button className="mapping-trigger" aria-haspopup="true" aria-expanded={openMenu==="flux"} onClick={function(){setOpenMenu(openMenu==="flux"?null:"flux");}} style={{...B,background:openMenu==="flux"?"linear-gradient(135deg,#38BDF826,#06B6D416)":toolbarSurface,color:openMenu==="flux"?"#7DD3FC":T.fgMuted,border:"1px solid "+(openMenu==="flux"?"#38BDF855":T.border),padding:"7px 11px",fontSize:10,letterSpacing:0.1,borderRadius:10,boxShadow:"0 3px 10px rgba(0,0,0,.12)"}}><span style={{width:20,height:20,borderRadius:7,display:"grid",placeItems:"center",background:"rgba(56,189,248,.15)",fontSize:12,marginRight:1}}>&#8644;</span>Flux ▾</button>
        {openMenu==="flux"&&<div className="mapping-menu" style={{position:"absolute",top:"100%",right:0,marginTop:6,background:T.bgCard,border:"1px solid "+T.border,borderRadius:12,padding:10,minWidth:250,boxShadow:"0 16px 38px rgba(0,0,0,.32)",zIndex:300}}>
          <div className="mapping-menu-section-title">Épaisseur des flux</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px"}}>
            <input type="range" min="1" max="6" step="0.5" value={flowThickness} onChange={function(e){setFlowThickness(parseFloat(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:24}}>{flowThickness}px</span>
          </div>
          <div className="mapping-menu-section-title">Taille des libellés</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px"}}>
            <input type="range" min="7" max="18" step="1" value={flowFontSize} onChange={function(e){setFlowFontSize(parseInt(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:24}}>{flowFontSize}pt</span>
          </div>
          <div className="mapping-menu-section-title">Style de trait</div>
          <div className="mapping-segmented mapping-segmented-3">
            <button aria-pressed={flowDash==="none"} onClick={function(){setFlowDash("none");}} style={{...B,background:flowDash==="none"?"linear-gradient(135deg,#2563EB,#0EA5E9)":"transparent",color:flowDash==="none"?"#fff":T.fgMuted,border:flowDash==="none"?"1px solid #38BDF8":"1px solid transparent",padding:"7px 8px",fontSize:10,flex:1}}>Plein</button>
            <button aria-pressed={flowDash==="dashed"} onClick={function(){setFlowDash("dashed");}} style={{...B,background:flowDash==="dashed"?"linear-gradient(135deg,#2563EB,#0EA5E9)":"transparent",color:flowDash==="dashed"?"#fff":T.fgMuted,border:flowDash==="dashed"?"1px solid #38BDF8":"1px solid transparent",padding:"7px 8px",fontSize:10,flex:1}}>Tirets</button>
            <button aria-pressed={flowDash==="dotted"} onClick={function(){setFlowDash("dotted");}} style={{...B,background:flowDash==="dotted"?"linear-gradient(135deg,#2563EB,#0EA5E9)":"transparent",color:flowDash==="dotted"?"#fff":T.fgMuted,border:flowDash==="dotted"?"1px solid #38BDF8":"1px solid transparent",padding:"7px 8px",fontSize:10,flex:1}}>Points</button>
          </div>
          <div className="mapping-menu-section-title">Couleur du flux</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px"}}>
            <input type="color" value={flowColorCustom||"#548CA8"} onChange={function(e){setFlowColorCustom(e.target.value);}} style={{width:24,height:24,border:"none",borderRadius:4,cursor:"pointer",padding:0}}/>
            <span style={{fontSize:10,color:T.fg}}>{flowColorCustom||"Auto"}</span>
            {flowColorCustom&&<button onClick={function(){setFlowColorCustom("");}} style={{...B,padding:"2px 8px",fontSize:11,background:T.border}}>Reset</button>}
          </div>
          <div onClick={function(){setShowCatModal(true);setOpenMenu(null);}} style={{padding:"6px 8px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg,marginTop:4}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>◫ Catégories</div>
        </div>}
      </div>
    </div>
    <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>
      <div ref={cvRef} style={{flex:1,overflow:"hidden",position:"relative",background:isDark?"#0B0B14":"#FFFFFF",cursor:pan?"grabbing":cMode?"crosshair":selMode?"default":"grab"}} onMouseDown={function(e){if(openMenu)setOpenMenu(null);const onBackground=!e.target.closest?.('[data-app]')&&!e.target.closest?.('.flow-layer');if(onBackground){setFocusApp(null);setSelFlow(null);setFlowSuppressed(true);}onCD(e);}} onMouseMove={function(e){if(!e.target.closest?.('[data-app]')&&!e.target.closest?.('[data-panel]')&&!e.target.closest?.('.flow-layer')){setFlowSuppressed(true);if(focusApp)setFocusApp(null);if(selFlow)setSelFlow(null);}onCM(e);}} onMouseUp={onCU} onMouseLeave={function(e){onCU(e);const enteringPanel=e.relatedTarget?.closest?.('[data-panel]');if(!enteringPanel){setFlowSuppressed(true);setFocusApp(null);setSelFlow(null);}}} onWheel={onWh} onContextMenu={e=>e.preventDefault()}>
        <div className="cbg" style={{position:"absolute",inset:0,backgroundColor:T.bg,backgroundImage:isDark?"radial-gradient(circle,rgba(148,163,184,.24) 1.15px,transparent 1.15px), radial-gradient(ellipse at 54% 46%,rgba(99,102,241,.08),transparent 68%)":"radial-gradient(circle,rgba(71,85,105,.16) 1px,transparent 1px), radial-gradient(ellipse at 18% 14%,rgba(99,102,241,.08),transparent 52%), radial-gradient(ellipse at 84% 86%,rgba(34,211,238,.08),transparent 56%)",backgroundSize:isDark?"34px 34px,100% 100%":"32px 32px,100% 100%,100% 100%"}}/>
      <div style={{transform:`translate(${off.x}px,${off.y}px) scale(${zm})`,transformOrigin:"0 0",position:"absolute",top:0,left:0,width:5000,height:4000}}>
        <CategoryZones/><DomainZones/><FlowLines/>{filtered.map(a=><AppNode key={a.id} app={a}/>)}
      </div>
      <div data-app="1" style={{position:"absolute",bottom:16,right:16,display:"flex",alignItems:"center",gap:6,padding:6,borderRadius:13,background:isDark?"rgba(19,19,42,.92)":"rgba(255,255,255,.94)",border:"1px solid "+T.border,boxShadow:"0 10px 30px rgba(0,0,0,.2)",backdropFilter:"blur(12px)",color:T.fgMuted}}>
        <button title="Dézoomer" onMouseDown={function(e){e.stopPropagation();setZm(function(z){return Math.max(.25,+(z-.1).toFixed(2));});}} style={{...B,width:30,height:30,padding:0,background:T.bgHover,color:T.fg,borderRadius:8,fontSize:17}}>−</button>
        <span style={{minWidth:44,textAlign:"center",fontSize:10,fontWeight:800,color:T.fg,fontVariantNumeric:"tabular-nums"}}>{Math.round(zm*100)}%</span>
        <button title="Zoomer" onMouseDown={function(e){e.stopPropagation();setZm(function(z){return Math.min(2.5,+(z+.1).toFixed(2));});}} style={{...B,width:30,height:30,padding:0,background:T.bgHover,color:T.fg,borderRadius:8,fontSize:17}}>+</button>
        <span style={{width:1,height:22,background:T.border,margin:"0 2px"}}/>
        <button title="Cadrer toute la cartographie sans déplacer les applications" onMouseDown={function(e){e.stopPropagation();fitCanvas();}} style={{...B,padding:"7px 10px",background:"#6366F1",color:"#fff",borderRadius:8,fontSize:10,whiteSpace:"nowrap"}}>⌖ Ajuster</button>
        <span style={{width:1,height:22,background:T.border,margin:"0 2px"}}/>
        <span style={{padding:"0 6px",fontSize:9,fontWeight:650,whiteSpace:"nowrap"}}>{activeFilters?filtered.length+" / ":""}{apps.length} apps · {flows.length} flux{activeFilters?" filtrés":""}</span>
      </div>
    </div>
    {selApp&&!showAM&&<div data-panel="1" style={{width:360,flexShrink:0,background:T.bgAlt,borderLeft:"1px solid "+T.borderLight,overflowY:"auto",display:"flex",flexDirection:"column",zIndex:10}}>
      {/* Header with domain color accent */}
      <div style={{background:isDark?"linear-gradient(145deg,"+(DC[selApp.domain]||DC.Autre).bg+","+T.bgAlt+")":"linear-gradient(145deg,"+(DC[selApp.domain]||DC.Autre).ac+"20,#fff)",padding:"19px 18px 16px",borderBottom:"3px solid "+(DC[selApp.domain]||DC.Autre).ac,position:"relative",overflow:"hidden",flexShrink:0}}>
        <div style={{position:"absolute",right:-28,top:-36,width:130,height:130,borderRadius:"50%",border:"1px solid "+(DC[selApp.domain]||DC.Autre).ac+"30",boxShadow:"0 0 0 18px "+(DC[selApp.domain]||DC.Autre).ac+"0A, 0 0 0 38px "+(DC[selApp.domain]||DC.Autre).ac+"08",pointerEvents:"none"}}/>
        <div style={{position:"relative",display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{width:46,height:46,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:14,background:(DC[selApp.domain]||DC.Autre).ac+"25",border:"1px solid "+(DC[selApp.domain]||DC.Autre).ac+"65",color:(DC[selApp.domain]||DC.Autre).ac,fontSize:21,fontWeight:900,boxShadow:"0 5px 18px "+(DC[selApp.domain]||DC.Autre).ac+"25"}}>{(selApp.name||"?").trim().charAt(0).toUpperCase()}</div>
          <div style={{minWidth:0,flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <span style={{fontSize:10,color:(DC[selApp.domain]||DC.Autre).ac,fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>{selApp.domain}</span>
              {selApp.category&&<><span style={{fontSize:10,color:T.fgDim}}>›</span><span style={{fontSize:10,color:T.fgMuted,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selApp.category}</span></>}
            </div>
            <div style={{fontSize:19,fontWeight:850,color:T.fg,lineHeight:1.18,letterSpacing:"-0.035em",overflowWrap:"anywhere"}}>{selApp.name}</div>
            {selApp.vendor&&<div style={{fontSize:11,color:T.fgMuted,marginTop:5,fontWeight:500}}>{selApp.vendor}{selApp.version?" · "+selApp.version:""}</div>}
          </div>
          <button onClick={()=>setSelApp(null)} title="Fermer la fiche" style={{background:T.bgCard+"90",border:"1px solid "+T.border,color:T.fgMuted,cursor:"pointer",fontSize:18,lineHeight:1,padding:"5px 8px",borderRadius:8,flexShrink:0}}>×</button>
        </div>
        <div style={{position:"relative",display:"flex",gap:6,marginTop:13,flexWrap:"wrap"}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:10,padding:"4px 9px",borderRadius:99,background:(CC[selApp.criticality]||"#888")+"20",color:CC[selApp.criticality]||"#888",border:"1px solid "+(CC[selApp.criticality]||"#888")+"55",fontWeight:800}}><span>{selApp.criticality==="Haute"?"●":selApp.criticality==="Basse"?"○":"◐"}</span>{selApp.criticality||"Criticité non renseignée"}</span>
          {projectType==='deal'&&selApp.statusD1&&<span style={{fontSize:10,padding:"4px 9px",borderRadius:99,background:(SD1[selApp.statusD1]||"#888")+"20",color:SD1[selApp.statusD1]||"#888",border:"1px solid "+(SD1[selApp.statusD1]||"#888")+"55",fontWeight:800}}>D1 · {selApp.statusD1}</span>}
          {projectType==='deal'&&selApp.statusD2&&<span style={{fontSize:10,padding:"4px 9px",borderRadius:99,background:(SD2[selApp.statusD2]||"#888")+"20",color:SD2[selApp.statusD2]||"#888",border:"1px solid "+(SD2[selApp.statusD2]||"#888")+"55",fontWeight:800}}>D2 · {selApp.statusD2}</span>}
          {projectType!=='deal'&&selApp.statut&&<span style={{fontSize:10,padding:"4px 9px",borderRadius:99,background:(STATUT_COLORS[selApp.statut]||"#888")+"20",color:STATUT_COLORS[selApp.statut]||"#888",border:"1px solid "+(STATUT_COLORS[selApp.statut]||"#888")+"55",fontWeight:800}}>{selApp.statut}</span>}
        </div>
        <div style={{position:"relative",display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:7,marginTop:13}}>
          {[{label:"Utilisateurs",value:selApp.users||"—",color:"#8B5CF6",icon:"◉"},{label:"Entrants",value:flows.filter(f=>f.to===selApp.id).length,color:"#38BDF8",icon:"↓"},{label:"Sortants",value:flows.filter(f=>f.from===selApp.id).length,color:"#34D399",icon:"↑"}].map(function(kpi){return <div key={kpi.label} style={{minWidth:0,padding:"9px 8px",borderRadius:10,background:kpi.color+"12",border:"1px solid "+kpi.color+"30"}}><div style={{fontSize:9,color:kpi.color,fontWeight:800,whiteSpace:"nowrap"}}>{kpi.icon} {kpi.label}</div><div style={{fontSize:16,fontWeight:850,color:T.fg,marginTop:5,lineHeight:1}}>{kpi.value}</div></div>;})}
        </div>
      </div>
      {/* Info fields */}
      <div style={{padding:"14px 15px 16px",flex:1,overflowY:"auto"}}>
        {[["Application",selApp.name],["Éditeur",selApp.vendor],["Version",selApp.version],["Nb utilisateurs",selApp.users],["Responsable",selApp.owner]].map(([k,v])=>
          <div key={k} style={{marginBottom:7,padding:"9px 11px",borderRadius:9,background:T.bgCard,border:"1px solid "+T.borderLight,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:9,color:T.fgDim,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7,fontWeight:800}}>{k}</div>
            <div style={{fontSize:13,color:v?T.fg:T.fgFaint,fontWeight:v?650:400,paddingLeft:2,fontStyle:v?"normal":"italic",overflowWrap:"anywhere"}}>{v||"Non renseigné"}</div>
          </div>)}
        {projectType!=='deal'&&selApp.statut&&<div style={{marginBottom:14,padding:"10px 12px",borderRadius:8,background:T.bgCard,border:"1px solid "+T.borderLight}}>
          <div style={{fontSize:10,color:T.fgDim,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Statut</div>
          <div style={{display:"flex",gap:8}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:11,fontWeight:700,letterSpacing:0.3,padding:"4px 11px",borderRadius:999,background:(STATUT_COLORS[selApp.statut]||"#888")+"1E",color:STATUT_COLORS[selApp.statut]||"#888",border:"1px solid "+(STATUT_COLORS[selApp.statut]||"#888")+"45"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:STATUT_COLORS[selApp.statut]||"#888",boxShadow:"0 0 6px "+(STATUT_COLORS[selApp.statut]||"#888")+"A0",flexShrink:0}}/>
              {selApp.statut}
            </span>
          </div>
        </div>}
        {function(){
          var eb=EOS_BUCKETS.find(function(b){return b.id===eosBucket(selApp.endOfService);});
          var rows=[["Coût annuel",typeof selApp.budget==="number"&&selApp.budget>0?formatEuro(selApp.budget):""],["Coût mensuel",typeof selApp.monthlyCost==="number"&&selApp.monthlyCost>0?formatEuro(selApp.monthlyCost):""],["Type de coût",selApp.costType],["Nb licences",selApp.licenses>0?selApp.licenses.toLocaleString("fr-FR"):""],["Hébergement",selApp.hosting],["Type d'application",selApp.appType]];
          return <div style={{marginTop:12,padding:"11px 12px",borderRadius:10,background:T.bgCard,border:"1px solid "+T.borderLight,borderLeft:"3px solid #10B981"}}>
            <div style={{fontSize:9,color:"#10B981",marginBottom:8,textTransform:"uppercase",letterSpacing:0.7,fontWeight:800}}>Patrimoine &amp; coûts</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {rows.map(function(r){return <div key={r[0]} style={{minWidth:0}}><div style={{fontSize:9,color:T.fgDim,marginBottom:2}}>{r[0]}</div><div style={{fontSize:12,fontWeight:r[1]?650:400,color:r[1]?T.fg:T.fgFaint,fontStyle:r[1]?"normal":"italic",overflowWrap:"anywhere"}}>{r[1]||"Non renseigné"}</div></div>;})}
              <div style={{minWidth:0}}><div style={{fontSize:9,color:T.fgDim,marginBottom:2}}>Fin de mise en service</div>{selApp.endOfService?<span style={{display:"inline-block",fontSize:10,fontWeight:700,color:eb.color,background:eb.color+"1F",border:"1px solid "+eb.color+"40",borderRadius:99,padding:"2px 8px"}}>{formatDateFr(selApp.endOfService)} · {eb.label}</span>:<div style={{fontSize:12,color:T.fgFaint,fontStyle:"italic"}}>Non renseignée</div>}</div>
            </div>
          </div>;
        }()}
        <div style={{marginTop:12,padding:"11px 12px",borderRadius:10,background:T.bgCard,border:"1px solid "+T.borderLight,borderLeft:"3px solid "+(DC[selApp.domain]||DC.Autre).ac}}>
          <div style={{fontSize:9,color:(DC[selApp.domain]||DC.Autre).ac,marginBottom:5,textTransform:"uppercase",letterSpacing:0.7,fontWeight:800}}>Description fonctionnelle</div>
          <div style={{fontSize:12,color:selApp.description?T.fg:T.fgFaint,lineHeight:1.55,fontStyle:selApp.description?"normal":"italic"}}>{selApp.description||"Aucune description renseignée"}</div>
        </div>
        <div style={{paddingTop:14,marginTop:14,borderTop:"1px solid "+T.borderLight}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
            <span style={{width:25,height:25,borderRadius:8,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#38BDF81A",border:"1px solid #38BDF840",color:"#38BDF8",fontSize:15,fontWeight:800}}>↓</span>
            <span style={{fontSize:10,color:"#38BDF8",fontWeight:800,textTransform:"uppercase",letterSpacing:0.7,flex:1}}>Flux entrants</span>
            <span style={{fontSize:10,color:"#38BDF8",background:"#38BDF81A",border:"1px solid #38BDF830",borderRadius:99,padding:"2px 8px",fontWeight:700}}>{flows.filter(f=>f.to===selApp.id).length}</span>
          </div>
          {flows.filter(f=>f.to===selApp.id).length===0&&<div style={{fontSize:11,color:T.fgFaint,fontStyle:"italic",margin:"0 0 12px 33px"}}>Aucun flux entrant</div>}
          {flows.filter(f=>f.to===selApp.id).map(f=>{
            const source=apps.find(a=>a.id===f.from);
            const sourceColor=(DC[source?.domain||""]||DC.Autre).ac;
            return <button key={f.id} onClick={()=>{setFlowSuppressed(false);setSelFlow(f.id);setFocusApp(selApp.id);}} style={{width:"100%",textAlign:"left",marginBottom:7,padding:"9px 10px",borderTop:"1px solid "+(selFlow===f.id?"#38BDF8":"#38BDF840"),borderRight:"1px solid "+(selFlow===f.id?"#38BDF8":"#38BDF840"),borderBottom:"1px solid "+(selFlow===f.id?"#38BDF8":"#38BDF840"),borderLeft:"3px solid #38BDF8",borderRadius:9,background:selFlow===f.id?"#38BDF820":"#38BDF80D",color:T.fg,cursor:"pointer",transition:"background .15s,border-color .15s,transform .15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:7,height:7,borderRadius:99,background:sourceColor,boxShadow:"0 0 8px "+sourceColor,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{source?.name||"Application inconnue"}</span>
              </div>
              <div style={{fontSize:10,color:T.fgMuted,margin:"5px 0 0 13px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.label||"Flux sans libellé"}</div>
              {f.protocol&&<span style={{display:"inline-block",margin:"6px 0 0 13px",fontSize:9,fontWeight:700,color:"#38BDF8",background:"#38BDF81A",borderRadius:99,padding:"2px 7px"}}>{f.protocol}</span>}
            </button>;
          })}
          <div style={{display:"flex",alignItems:"center",gap:8,margin:"13px 0 9px"}}>
            <span style={{width:25,height:25,borderRadius:8,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#34D3991A",border:"1px solid #34D39940",color:"#34D399",fontSize:15,fontWeight:800}}>↑</span>
            <span style={{fontSize:10,color:"#34D399",fontWeight:800,textTransform:"uppercase",letterSpacing:0.7,flex:1}}>Flux sortants</span>
            <span style={{fontSize:10,color:"#34D399",background:"#34D3991A",border:"1px solid #34D39930",borderRadius:99,padding:"2px 8px",fontWeight:700}}>{flows.filter(f=>f.from===selApp.id).length}</span>
          </div>
          {flows.filter(f=>f.from===selApp.id).length===0&&<div style={{fontSize:11,color:T.fgFaint,fontStyle:"italic",marginLeft:33}}>Aucun flux sortant</div>}
          {flows.filter(f=>f.from===selApp.id).map(f=>{
            const target=apps.find(a=>a.id===f.to);
            const targetColor=(DC[target?.domain||""]||DC.Autre).ac;
            return <button key={f.id} onClick={()=>{setFlowSuppressed(false);setSelFlow(f.id);setFocusApp(selApp.id);}} style={{width:"100%",textAlign:"left",marginBottom:7,padding:"9px 10px",borderTop:"1px solid "+(selFlow===f.id?"#34D399":"#34D39940"),borderRight:"1px solid "+(selFlow===f.id?"#34D399":"#34D39940"),borderBottom:"1px solid "+(selFlow===f.id?"#34D399":"#34D39940"),borderLeft:"3px solid #34D399",borderRadius:9,background:selFlow===f.id?"#34D39920":"#34D3990D",color:T.fg,cursor:"pointer",transition:"background .15s,border-color .15s,transform .15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:7,height:7,borderRadius:99,background:targetColor,boxShadow:"0 0 8px "+targetColor,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{target?.name||"Application inconnue"}</span>
              </div>
              <div style={{fontSize:10,color:T.fgMuted,margin:"5px 0 0 13px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.label||"Flux sans libellé"}</div>
              {f.protocol&&<span style={{display:"inline-block",margin:"6px 0 0 13px",fontSize:9,fontWeight:700,color:"#34D399",background:"#34D3991A",borderRadius:99,padding:"2px 7px"}}>{f.protocol}</span>}
            </button>;
          })}
        </div>
        <div style={{display:"flex",gap:8,marginTop:20}}>
          <button onClick={()=>{setEApp({...selApp});setShowAM(true);}} style={{...B,background:"#548CA8",flex:1,padding:8}}>Éditer</button>
          <button onClick={()=>{if(confirm("Supprimer "+selApp.name+" ?")){setApps(p=>p.filter(a=>a.id!==selApp.id));setFlows(p=>p.filter(f=>f.from!==selApp.id&&f.to!==selApp.id));setSelApp(null);}}} style={{...B,background:"#E06C75",flex:1,padding:8}}>Supprimer</button>
        </div>
      </div>
    </div>}
    </div>
    {/* Presentation mode overlay */}
    {presMode&&<div style={{position:"fixed",inset:0,zIndex:500,background:isDark?"#0B0B14":"#FFFFFF",display:"flex",flexDirection:"column"}}>
      {/* Pres toolbar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:40,background:T.pres,display:"flex",alignItems:"center",padding:"0 16px",gap:12,zIndex:10,opacity:0.9,transition:"opacity 0.3s"}}
        onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>
        <span style={{fontSize:13,color:"#7B78FF",fontWeight:700}}>◈ Mode Présentation</span>
        <div style={{flex:1}}/>
        <span style={{fontSize:10,color:T.fgMuted}}>{apps.length} apps · {doms.length} domaines</span>
        <div style={{display:"flex",gap:2,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.fgDim}}>Zoom</span>
          <button onMouseDown={e=>{e.stopPropagation();setZm(z=>Math.max(0.15,z-0.1));}} style={{...B,padding:"3px 8px",fontSize:11,background:T.bgHover}}>−</button>
          <span style={{fontSize:10,color:"#aaa",minWidth:36,textAlign:"center"}}>{Math.round(zm*100)}%</span>
          <button onMouseDown={e=>{e.stopPropagation();setZm(z=>Math.min(3,z+0.1));}} style={{...B,padding:"3px 8px",fontSize:11,background:T.bgHover}}>+</button>
          <button onMouseDown={e=>{e.stopPropagation();
            const maxX=Math.max(...apps.map(a=>a.x+AW),100);const maxY=Math.max(...apps.map(a=>a.y+AH),100);
            const vw=window.innerWidth||1400;const vh=window.innerHeight-40;
            setZm(Math.min(vw/(maxX+60),vh/(maxY+60),2));setOff({x:20,y:20});
          }} style={{...B,padding:"3px 8px",fontSize:11,background:T.border}}>Ajuster</button>
        </div>
        <div style={{display:"flex",gap:2,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.fgDim}}>Police</span>
          <button onMouseDown={e=>{e.stopPropagation();setFontScale(s=>Math.max(0.6,+(s-0.15).toFixed(2)));}} style={{...B,padding:"3px 8px",fontSize:11,background:T.bgHover}}>A−</button>
          <span style={{fontSize:10,color:"#aaa",minWidth:32,textAlign:"center"}}>{Math.round(fontScale*100)}%</span>
          <button onMouseDown={e=>{e.stopPropagation();setFontScale(s=>Math.min(3,+(s+0.15).toFixed(2)));}} style={{...B,padding:"3px 8px",fontSize:11,background:T.bgHover}}>A+</button>
        </div>
        <button onMouseDown={e=>{e.stopPropagation();setPresMode(false);}} style={{...B,padding:"3px 12px",background:"#E06C75",fontSize:11}}>✕ Quitter</button>
      </div>
      {/* Pres canvas */}
      <div style={{flex:1,overflow:"hidden",position:"relative",cursor:pan?"grabbing":"grab",marginTop:40}} onMouseDown={e=>{setPan(true);pRef.current={x:e.clientX-off.x,y:e.clientY-off.y};}} onMouseMove={e=>{if(pan)setOff({x:e.clientX-pRef.current.x,y:e.clientY-pRef.current.y});}} onMouseUp={()=>setPan(false)} onMouseLeave={()=>setPan(false)}
        onWheel={e=>{e.preventDefault();if(e.ctrlKey||e.metaKey)setZm(z=>Math.max(0.15,Math.min(3,z-e.deltaY*0.003)));else setOff(o=>({x:o.x-e.deltaX*0.8,y:o.y-e.deltaY*0.8}));}}>
        <div style={{position:"absolute",inset:0,backgroundColor:isDark?"#0B0B14":"#FFFFFF",backgroundImage:"radial-gradient(circle,"+(isDark?"#292941":"#D6DCE8")+" 1px,transparent 1px)",backgroundSize:"30px 30px"}}/>
        <div style={{transform:`translate(${off.x}px,${off.y}px) scale(${zm})`,transformOrigin:"0 0",position:"absolute",top:0,left:0,width:8000,height:6000}}>
          <CategoryZones/><DomainZones/><FlowLines/>{filtered.map(a=><AppNode key={a.id} app={a}/>)}
        </div>
      </div>
      {/* Keyboard hint */}
      <div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",background:T.bgCard,borderRadius:8,padding:"4px 16px",fontSize:11,color:T.fgFaint}}>
        Molette = déplacer · Ctrl+Molette = zoom · Échap = quitter
      </div>
    </div>}
    {showAM&&eApp&&<div className="moverlay" style={{position:"fixed",inset:0,background:T.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={()=>setShowAM(false)}><div style={{background:T.bgCard,borderRadius:8,padding:24,width:420,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>{eApp.id&&apps.find(a=>a.id===eApp.id)?"Modifier":"Nouvelle"} application</h3>
      {[{k:"name",l:"Nom *",t:"text"},{k:"description",l:"Description",t:"text"},{k:"vendor",l:"Éditeur",t:"text"},{k:"version",l:"Version",t:"text"},{k:"owner",l:"Responsable",t:"text"},{k:"users",l:"Nb utilisateurs",t:"number"}].map(({k,l,t})=><div key={k} style={{marginBottom:10}}><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>{l}</label><input type={t} value={eApp[k]||""} onChange={e=>setEApp(p=>({...p,[k]:t==="number"?parseInt(e.target.value)||0:e.target.value}))} style={I}/></div>)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
        <div style={{marginBottom:10}}><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Catégorie</label><input type="text" value={eApp.category||""} placeholder="Ex: Opérations Cœur, Relation Client, Sécurité..." onChange={e=>setEApp(p=>({...p,category:e.target.value}))} style={I} list="catlist"/><datalist id="catlist">{[...new Set(apps.map(a=>a.category).filter(Boolean))].map(c=><option key={c} value={c}/>)}</datalist></div>
            <div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Domaine</label>
              <input type="text" value={eApp.domain||""} onChange={e=>setEApp(p=>({...p,domain:e.target.value}))} style={I} list="domlist" placeholder="Saisir ou choisir..."/>
              <datalist id="domlist">{ALLDOM.map(d=><option key={d} value={d}/>)}</datalist></div>
            {[{k:"criticality",l:"Criticité",o:["Haute","Moyenne","Basse"]}].map(({k,l,o})=><div key={k}><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>{l}</label><select value={eApp[k]||""} onChange={e=>setEApp(p=>({...p,[k]:e.target.value}))} style={I}>{o.map(v=><option key={v} value={v}>{v}</option>)}</select></div>)}
      {projectType==='cartographie'?(
        <>
        <div style={{background:T.bgAlt,borderRadius:8,padding:10,marginTop:8}}>
          <div style={{fontSize:10,fontWeight:700,color:T.fgMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Statut</div>
          <div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Statut</label><select value={eApp.statut||""} onChange={e=>setEApp(a=>({...a,statut:e.target.value}))} style={I}>{STATUT_OPTS.map(v=><option key={v} value={v}>{v||"— Non défini —"}</option>)}</select></div>
        </div>
                  </>
                ):(
        <div style={{background:T.bgAlt,borderRadius:8,padding:10,marginTop:8}}><div style={{fontSize:10,fontWeight:700,color:T.fgMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Trajectoire Carve-Out</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Day 1</label><select value={eApp.statusD1||""} onChange={e=>setEApp(p=>({...p,statusD1:e.target.value}))} style={I}>{D1_OPTS.map(v=><option key={v} value={v}>{v||"Non défini"}</option>)}</select></div><div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Day 2</label><select value={eApp.statusD2||""} onChange={e=>setEApp(p=>({...p,statusD2:e.target.value}))} style={I}>{D2_OPTS.map(v=><option key={v} value={v}>{v||"Non défini"}</option>)}</select></div></div></div>
      )}
                  <div style={{gridColumn:"1 / -1",background:T.bgAlt,borderRadius:8,padding:10}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.fgMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Patrimoine &amp; coûts</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Coût annuel (€)</label><input type="number" min="0" step="100" value={eApp.budget??""} onChange={e=>setEApp(p=>({...p,budget:e.target.value===""?null:parseFloat(e.target.value),monthlyCost:e.target.value===""?null:Math.round(parseFloat(e.target.value)/12*100)/100}))} style={I}/></div>
                      <div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Coût mensuel (€)</label><input type="number" min="0" step="10" value={eApp.monthlyCost??""} onChange={e=>setEApp(p=>({...p,monthlyCost:e.target.value===""?null:parseFloat(e.target.value),budget:e.target.value===""?null:Math.round(parseFloat(e.target.value)*12*100)/100}))} style={I}/></div>
                      <div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Type de coût</label><select value={eApp.costType||""} onChange={e=>setEApp(p=>({...p,costType:e.target.value}))} style={I}><option value="">— Non défini —</option>{COST_TYPES.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
                      <div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Nb licences</label><input type="number" min="0" value={eApp.licenses||""} onChange={e=>setEApp(p=>({...p,licenses:parseInt(e.target.value)||0}))} style={I}/></div>
                      <div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Fin de mise en service</label><input type="date" value={eApp.endOfService||""} onChange={e=>setEApp(p=>({...p,endOfService:e.target.value}))} style={I}/></div>
                      <div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Hébergement</label><select value={eApp.hosting||""} onChange={e=>setEApp(p=>({...p,hosting:e.target.value}))} style={I}><option value="">— Non défini —</option>{eApp.hosting&&!HOSTING_OPTS.includes(eApp.hosting)&&<option value={eApp.hosting}>{eApp.hosting}</option>}{HOSTING_OPTS.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
                      <div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Type d'application</label><select value={eApp.appType||""} onChange={e=>setEApp(p=>({...p,appType:e.target.value}))} style={I}><option value="">— Non défini —</option>{eApp.appType&&!APPTYPE_OPTS.includes(eApp.appType)&&<option value={eApp.appType}>{eApp.appType}</option>}{APPTYPE_OPTS.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
                    </div>
                  </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}><button onClick={()=>setShowAM(false)} style={{...B,background:T.border}}>Annuler</button><button onClick={()=>{if(!eApp.name)return alert("Nom requis");
                // Auto-create domain color if new
                if(eApp.domain&&!domColors[eApp.domain]){
                  const hue=Math.floor(Math.random()*360);
                  const ac="#"+[0,120,240].map(off=>{const h=(hue+off)%360;return Math.round(128+64*Math.cos(h*Math.PI/180)).toString(16).padStart(2,"0");}).join("").slice(0,6);
                  setDomColors(p=>({...p,[eApp.domain]:acToPalette("#"+[Math.round(80+Math.random()*120),Math.round(80+Math.random()*120),Math.round(80+Math.random()*120)].map(v=>v.toString(16).padStart(2,"0")).join(""))}));
                }
                if(eApp.id&&apps.find(a=>a.id===eApp.id))setApps(p=>p.map(a=>a.id===eApp.id?{...a,...eApp}:a));else setApps(p=>[...p,{...eApp,id:uid()}]);setShowAM(false);setSelApp(null);}} style={{...B,background:"#548CA8"}}>{eApp.id&&apps.find(a=>a.id===eApp.id)?"Sauvegarder":"Créer"}</button></div>
    </div></div>}
    {/* Domain color editor */}
    {showExportModal&&(function(){
      var _hubLim=Math.max(1,parseInt(exportOpts.hubLimit)||8);
      var _hubDomF=exportOpts.hubDomainFilter&&exportOpts.hubDomainFilter.length>0?exportOpts.hubDomainFilter:null;
      var _hubConn=apps.filter(function(a){return flows.some(function(f){return f.from===a.id||f.to===a.id;})&&(!_hubDomF||_hubDomF.includes(a.domain));});
      var nCarto=Math.min(_hubConn.length,_hubLim)*2;
      var slideCount=1;// matrice flux (toujours présente)
      if(exportOpts.inclExecSlides)slideCount+=2;
      if(exportOpts.inclPaysage!==false)slideCount+=1;
      if(exportOpts.inclMatrices)slideCount+=1+(Math.ceil(flows.length/18)||1);
      if(exportOpts.inclConsolidatedCarto)slideCount+=2;
      if(exportOpts.inclDomainStatus)slideCount+=2;
      slideCount+=nCarto;
      var set=function(k,v){setExportOpts(function(p){var n=Object.assign({},p);n[k]=v;return n;});};
      var applyPreset=function(p){
        var allowD1D2=projectType==='deal';
        setExportOpts(function(prev){
          var base2={inclExecSlides:false,inclPaysage:true,inclMatrices:false,inclConsolidatedCarto:false,inclDomainStatus:false,cartoMode:"none"};
          if(p==="cartographie")return Object.assign({},prev,base2,{inclExecSlides:true,inclConsolidatedCarto:true,cartoMode:"byDomain"});
          if(p==="decision")return Object.assign({},prev,base2,{inclExecSlides:true,inclMatrices:true,inclDomainStatus:allowD1D2,cartoMode:"byDomain",inclConsolidatedCarto:true});
          return Object.assign({},prev,base2,{inclExecSlides:true,inclMatrices:true,inclConsolidatedCarto:true,inclDomainStatus:allowD1D2,cartoMode:"byDomain"});
        });
      };
      var Chk=function(k,label,desc,n){
        var on=exportOpts[k];
        return <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",padding:"11px 14px",borderRadius:9,background:on?"#2979FF0D":"transparent",border:"1px solid "+(on?"#2979FF50":T.border),marginBottom:6,transition:"background .12s,border .12s"}}>
          <input type="checkbox" checked={on} onChange={function(e){set(k,e.target.checked);}} style={{accentColor:"#2979FF",width:16,height:16,marginTop:1,flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:T.fg}}>{label}</div>
            <div style={{fontSize:10,color:T.fgMuted,marginTop:2}}>{desc}</div>
          </div>
          <span style={{fontSize:9,fontWeight:700,color:on?"#2979FF":T.fgMuted,background:on?"#2979FF15":T.bgAlt,border:"1px solid "+(on?"#2979FF30":T.border),borderRadius:10,padding:"2px 8px",whiteSpace:"nowrap",alignSelf:"center",flexShrink:0}}>{"+"+n+" slide"+(n>1?"s":"")}</span>
        </label>;
      };
      return <div style={{position:"fixed",inset:0,background:T.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:400}} onMouseDown={function(e){if(e.target===e.currentTarget)setShowExportModal(false);}}>
        <div style={{background:T.bgCard,borderRadius:14,width:580,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 12px 50px #00000070",display:"flex",flexDirection:"column"}} onMouseDown={function(e){e.stopPropagation();}}>

          {/* ── En-tête ── */}
          <div style={{padding:"20px 22px 14px",borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.bgCard,zIndex:2,borderRadius:"14px 14px 0 0"}}>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:T.fg}}>Export PowerPoint</div>
              <div style={{fontSize:10,color:T.fgMuted,marginTop:3}}>{apps.length} applications · {flows.length} flux · {doms.length} domaines</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{textAlign:"center",background:"#EF6C0015",borderRadius:10,padding:"6px 16px",border:"1px solid #EF6C0040"}}>
                <div style={{fontSize:24,fontWeight:800,color:"#EF6C00",lineHeight:1}}>{slideCount}</div>
                <div style={{fontSize:8,color:"#EF6C00",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6,marginTop:2}}>slides</div>
              </div>
              <button onClick={function(){setShowExportModal(false);}} style={{background:"none",border:"none",fontSize:18,color:T.fgMuted,cursor:"pointer"}}>✕</button>
            </div>
          </div>

          <div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:20}}>

            {/* ── Recommandations ── */}
            <div style={{background:T.bgAlt,borderRadius:10,padding:14}}>
              <div style={{fontSize:10,fontWeight:700,color:T.fgMuted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Générations recommandées</div>
              <div style={{display:"flex",gap:8}}>
                {[
                  {id:"cartographie",icon:"🗺",label:"Cartographie",desc:"Slides exécutives + carto consolidée et détaillée par domaine",color:"#2979FF"},
                  {id:"decision",icon:"📊",label:"Aide à la décision",desc:projectType==='deal'?"Carto + matrices de flux + vision Day 1 & Day 2":"Carto + matrices de flux + statuts applicatifs",color:"#8B5CF6"},
                  {id:"complet",icon:"📦",label:"Livrable complet",desc:projectType==='deal'?"Toutes les sections — cartographie, flux et trajectoires":"Toutes les sections — cartographie, flux et statuts",color:"#EF6C00"},
                ].map(function(pr){
                  return <button key={pr.id} onMouseDown={function(e){e.preventDefault();applyPreset(pr.id);}} style={{flex:1,background:pr.color+"10",border:"1px solid "+pr.color+"35",borderRadius:9,padding:"10px 8px",cursor:"pointer",textAlign:"left",transition:"background .12s"}}>
                    <div style={{fontSize:14,marginBottom:4}}>{pr.icon}</div>
                    <div style={{fontSize:11,fontWeight:700,color:pr.color,marginBottom:3}}>{pr.label}</div>
                    <div style={{fontSize:9,color:T.fgMuted,lineHeight:1.4}}>{pr.desc}</div>
                  </button>;
                })}
              </div>
            </div>

            {/* ── Identité client ── */}
            <div style={{background:T.bgAlt,borderRadius:10,padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:T.fg,marginBottom:12}}>Identité client</div>
              <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div>
                  <label style={{fontSize:10,color:T.fgMuted,display:"block",marginBottom:4}}>Couleur principale</label>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <input type="color" value={"#"+(exportOpts.clientPrimary||"2979FF")} onChange={function(e){set("clientPrimary",e.target.value.replace("#",""));}} style={{width:38,height:30,border:"1px solid "+T.border,borderRadius:4,cursor:"pointer",padding:2}}/>
                    <span style={{fontSize:10,color:T.fgDim,fontFamily:"monospace"}}>{"#"+(exportOpts.clientPrimary||"2979FF")}</span>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {["0B2545","1B3A5C","2979FF","10B981","6366F1","EF6C00","E06C75","2D6A4F"].map(function(c){
                      return <div key={c} onMouseDown={function(e){e.preventDefault();set("clientPrimary",c);}} style={{width:22,height:22,borderRadius:5,background:"#"+c,cursor:"pointer",border:exportOpts.clientPrimary===c?"2px solid "+T.bgCard:"2px solid transparent",boxShadow:exportOpts.clientPrimary===c?"0 0 0 2px #"+c:"none"}}/>;
                    })}
                  </div>
                </div>
                <div>
                  <label style={{fontSize:10,color:T.fgMuted,display:"block",marginBottom:4}}>Logo (PNG/JPG)</label>
                  <input type="file" accept="image/*" onChange={function(e){var f=e.target.files&&e.target.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(ev){set("clientLogo",ev.target.result);};rd.readAsDataURL(f);}} style={{fontSize:10,color:T.fg,cursor:"pointer"}}/>
                  {exportOpts.clientLogo&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
                    <img src={exportOpts.clientLogo} alt="logo" style={{height:28,maxWidth:80,objectFit:"contain",borderRadius:4,border:"1px solid "+T.border}}/>
                    <button onMouseDown={function(){set("clientLogo",null);}} style={{background:"none",border:"none",fontSize:13,color:T.fgMuted,cursor:"pointer"}}>✕</button>
                  </div>}
                </div>
              </div>
            </div>

            {/* ── Contenu du livrable ── */}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:T.fg,marginBottom:10}}>Contenu du livrable</div>
              {Chk("inclExecSlides","Slides exécutives","Page de titre + Synthèse & Messages clés",2)}
              {Chk("inclPaysage","Paysage applicatif","Treemap hiérarchique domaines → catégories → applications",1)}
              {Chk("inclMatrices","Matrices de flux",projectType==='deal'?"Récap applications (Domaine / App / D1 / D2) + récap flux + vue agrégée par domaine":"Récap applications (Domaine / App / Statut) + récap flux + vue agrégée par domaine",2+(Math.ceil(flows.length/18)||1)+(Math.ceil(apps.length/22)||1))}
              {Chk("inclConsolidatedCarto","Vues de cartographie consolidée","Clusters par domaine + vue domaine pivot",2)}
              {projectType==='deal' && Chk("inclDomainStatus","Vision Day 1 & Day 2","Applications colorées par stratégie de closing et cible (Transfert TSA, Maintien, Rebuild, Abandon)",2)}
            </div>

            {/* ── Style des flèches de flux ── */}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:T.fg,marginBottom:4}}>Style des flèches de flux</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[
                  {v:"solid",l:"Trait plein",icon:"—"},
                  {v:"dash", l:"Tirets",     icon:"- -"},
                  {v:"dot",  l:"Points",     icon:"···"},
                ].map(function(s){
                  var sel=exportOpts.flowLineStyle===s.v;
                  return <label key={s.v} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 14px",borderRadius:8,background:sel?"#2979FF0D":"transparent",border:"1px solid "+(sel?"#2979FF50":T.border),flex:"1 1 auto",minWidth:90}}>
                    <input type="radio" name="flowLineStyle" value={s.v} checked={sel} onChange={function(){set("flowLineStyle",s.v);}} style={{accentColor:"#2979FF"}}/>
                    <span style={{fontSize:14,fontFamily:"monospace",color:sel?"#2979FF":T.fgMuted,marginRight:4}}>{s.icon}</span>
                    <span style={{fontSize:11,fontWeight:sel?700:400,color:T.fg}}>{s.l}</span>
                  </label>;
                })}
              </div>
            </div>

            {/* ── Cartographie par Hub applicatif ── */}
            {(function(){
              var connectedApps=apps.filter(function(a){return flows.some(function(f){return f.from===a.id||f.to===a.id;});});
              var domFilter=exportOpts.hubDomainFilter||[];
              var filteredConn=domFilter.length>0?connectedApps.filter(function(a){return domFilter.includes(a.domain);}):connectedApps;
              var toggleDom=function(d){
                var cur=exportOpts.hubDomainFilter||[];
                var next=cur.includes(d)?cur.filter(function(x){return x!==d;}):[...cur,d];
                set("hubDomainFilter",next.length>0?next:null);
              };
              return <div>
                <div style={{fontSize:11,fontWeight:700,color:T.fg,marginBottom:4}}>Cartographie par Hub applicatif</div>
                <div style={{fontSize:10,color:T.fgMuted,marginBottom:10}}>Un slide synthèse + un slide détail flux par hub, triés par connectivité décroissante.</div>
                <div style={{padding:"12px 14px",borderRadius:9,background:"#2979FF08",border:"1px solid #2979FF40"}}>
                  {/* Nombre de hubs */}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <span style={{fontSize:11,fontWeight:600,color:T.fg,whiteSpace:"nowrap"}}>Nombre de hubs :</span>
                    <input type="number" min={1} max={filteredConn.length||1} value={Math.min(exportOpts.hubLimit,filteredConn.length||1)} onChange={function(e){set("hubLimit",Math.max(1,Math.min(parseInt(e.target.value)||1,filteredConn.length||1)));}} style={{width:60,padding:"3px 8px",borderRadius:6,border:"1px solid "+T.border,background:T.bg,color:T.fg,fontSize:12,fontWeight:700,textAlign:"center"}}/>
                    <span style={{fontSize:10,color:T.fgMuted}}>{filteredConn.length} apps connectées {domFilter.length>0?"dans les domaines sélectionnés":"au total"}</span>
                  </div>
                  {/* Filtre par domaine */}
                  <div style={{fontSize:10,fontWeight:700,color:T.fg,marginBottom:6}}>Filtrer par domaine <span style={{fontWeight:400,color:T.fgMuted}}>(tous si aucun coché)</span></div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {doms.map(function(d){
                      var sel2=domFilter.includes(d);
                      var dc=domColors[d]||{ac:"#9E9E9E"};
                      var nConn=connectedApps.filter(function(a){return a.domain===d;}).length;
                      return <button key={d} onClick={function(){toggleDom(d);}} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,border:"1.5px solid "+(sel2?dc.ac:"#D1D5DB"),background:sel2?dc.ac+"22":"transparent",cursor:"pointer",fontSize:10,fontWeight:sel2?700:400,color:sel2?dc.ac:T.fgMuted,transition:"all .12s"}}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:dc.ac,flexShrink:0,display:"inline-block"}}/>
                        {d}
                        <span style={{fontSize:9,opacity:0.7}}>({nConn})</span>
                      </button>;
                    })}
                  </div>
                </div>
              </div>;
            })()}

          </div>

            {/* ── Couleurs des statuts Day 1 & Day 2 ── */}
            {projectType==='deal' && (function(){
              var D1_KEYS=["Transfert TSA","Maintien","Rebuild","Abandon","Non défini"];
              var D2_KEYS=["Clone & Clean","Transfert","Rebuild","Abandon","Non défini"];
              var colD1=exportOpts.statusColorsD1||{};
              var colD2=exportOpts.statusColorsD2||{};
              var setColor=function(day,key,hex){
                var field=day===1?"statusColorsD1":"statusColorsD2";
                var prev=exportOpts[field]||{};
                set(field,Object.assign({},prev,{[key]:hex.replace("#","")}));
              };
              var ColorRow=function(day,keys,colors){
                return <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#1D4ED8",textTransform:"uppercase",letterSpacing:0.7,marginBottom:8}}>
                    {day===1?"Day 1 — Statut de Closing":"Day 2 — Vision Cible"}
                  </div>
                  {keys.map(function(k){
                    var hex="#"+(colors[k]||"94A3B8");
                    return <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <input type="color" value={hex}
                        onChange={function(e){setColor(day,k,e.target.value);}}
                        style={{width:28,height:22,border:"1px solid "+T.border,borderRadius:4,cursor:"pointer",padding:1,flexShrink:0}}/>
                      <span style={{fontSize:10.5,color:T.fg,flex:1}}>{k}</span>
                      <span style={{fontSize:9,fontFamily:"monospace",color:T.fgMuted}}>{hex}</span>
                    </div>;
                  })}
                </div>;
              };
              return <div style={{background:T.bgAlt,borderRadius:10,padding:14}}>
                <div style={{fontSize:11,fontWeight:700,color:T.fg,marginBottom:12}}>Couleurs des statuts applicatifs</div>
                <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                  {ColorRow(1,D1_KEYS,colD1)}
                  {ColorRow(2,D2_KEYS,colD2)}
                </div>
              </div>;
            })()}

          {/* ── Pied de page ── */}
          <div style={{padding:"12px 22px",borderTop:"1px solid "+T.border,display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",position:"sticky",bottom:0,background:T.bgCard,borderRadius:"0 0 14px 14px"}}>
            <div style={{fontSize:10,color:T.fgMuted}}><strong style={{color:T.fg}}>{slideCount} slides</strong> seront générées</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={function(){setShowExportModal(false);}} style={{...B,background:T.border,padding:"9px 20px",fontSize:12}}>Annuler</button>
              <button onClick={function(){setShowExportModal(false);exportPPTX(exportOpts).catch(function(err){alert("Erreur export PPTX :\n"+(err&&err.message?err.message:String(err)));});}} style={{...B,background:"#EF6C00",padding:"9px 28px",fontWeight:800,fontSize:13}}>⬇ Générer le PPTX</button>
            </div>
          </div>

        </div>
      </div>;
    })()}
    {showDomEdit!=null&&showDomEdit!==false&&<div className="moverlay" style={{position:"fixed",inset:0,background:T.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:350}} onMouseDown={e=>{if(e.target===e.currentTarget)setShowDomEdit(null);}}><div style={{background:T.bgCard,borderRadius:8,padding:24,width:380}} onMouseDown={e=>e.stopPropagation()}>
      <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Couleur du domaine</h3>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"12px 16px",background:T.bg,borderRadius:8}}>
        <div style={{width:44,height:44,borderRadius:8,background:(domColors[showDomEdit]||{bg:"#3D3D3D"}).bg,border:"2px solid "+((domColors[showDomEdit]||{ac:"#9E9E9E"}).ac),display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:(domColors[showDomEdit]||{ac:"#9E9E9E"}).ac,fontSize:16,fontWeight:700}}>{apps.filter(a=>a.domain===showDomEdit).length}</span>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.fg}}>{showDomEdit}</div>
          <div style={{fontSize:10,color:T.fgMuted,marginTop:2}}>{apps.filter(a=>a.domain===showDomEdit).length} applications</div>
        </div>
      </div>
      <div style={{fontSize:11,color:T.fgMuted,marginBottom:10}}>Choisissez une couleur :</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:8,marginBottom:20}}>
        {["#52B788","#9D4EDD","#548CA8","#E06C75","#D4A017","#40A578","#D63384","#57A0A0","#7B78FF","#FF6B35","#4ECDC4","#C44536","#2EC4B6","#E71D36","#FF9F1C","#6A0572","#00B4D8","#E9C46A","#264653","#F4845F","#2D6A4F","#B5179E","#7209B7","#4361EE"].map(c=>{
          const isActive=(domColors[showDomEdit]||{ac:""}).ac===c;
          return <div key={c} onMouseDown={e=>{e.stopPropagation();e.preventDefault();setDomColors(prev=>{const n={...prev};n[showDomEdit]=acToPalette(c);return n;});}}
            style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",border:isActive?"3px solid "+T.bgCard:"3px solid transparent",boxShadow:isActive?"0 0 8px "+c+"80":"none",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {isActive&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}
          </div>;})}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <span style={{fontSize:11,color:T.fgMuted}}>Personnalisée :</span>
        <input type="color" value={(domColors[showDomEdit]||{ac:"#9E9E9E"}).ac}
          onChange={e=>{setDomColors(prev=>{const n={...prev};n[showDomEdit]=acToPalette(e.target.value);return n;});}}
          style={{width:48,height:32,border:"1px solid #555",borderRadius:4,background:T.bg,cursor:"pointer",padding:2}}/>
        <span style={{fontSize:11,color:T.fgDim,fontFamily:"monospace"}}>{(domColors[showDomEdit]||{ac:"#9E9E9E"}).ac}</span>
      </div>
      <div style={{padding:"10px 14px",borderRadius:8,background:(domColors[showDomEdit]||{bg:"#3D3D3D"}).bg,border:"1px solid "+((domColors[showDomEdit]||{ac:"#9E9E9E"}).ac)+"40",marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:(domColors[showDomEdit]||{ac:"#9E9E9E"}).ac,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>APERÇU</div>
        <div style={{display:"flex",gap:6}}>
          {apps.filter(a=>a.domain===showDomEdit).slice(0,3).map(a=><div key={a.id} style={{background:(domColors[showDomEdit]||{bg:"#3D3D3D"}).bg,border:"1.5px solid "+((domColors[showDomEdit]||{ac:"#9E9E9E"}).ac),borderRadius:4,padding:"4px 8px",fontSize:11,color:(domColors[showDomEdit]||{fg:"#E8E8E8"}).fg}}>{a.name}</div>)}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}><button onMouseDown={e=>{e.stopPropagation();setShowDomEdit(null);}} style={{...B,background:"#548CA8"}}>Fermer</button></div>
    </div></div>}
    {/* Category color modal */}
    {showCatColorEdit!=null&&<div className="moverlay" style={{position:"fixed",inset:0,background:T.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:350}} onMouseDown={e=>{if(e.target===e.currentTarget)setShowCatColorEdit(null);}}>
      <div style={{background:T.bgCard,borderRadius:8,padding:24,width:360}} onMouseDown={e=>e.stopPropagation()}>
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:16,color:T.fg}}>Couleur de la catégorie</h3>
        <div style={{fontSize:13,fontWeight:600,color:T.fgMuted,marginBottom:14}}>{showCatColorEdit}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:8,marginBottom:20}}>
          {["#548CA8","#D4A017","#E06C75","#52B788","#9D4EDD","#D63384","#7B78FF","#40A578","#FF6B35","#4ECDC4","#C44536","#2EC4B6","#E71D36","#FF9F1C","#6A0572","#00B4D8","#E9C46A","#264653","#F4845F","#2D6A4F","#B5179E","#7209B7","#4361EE","#F72585"].map(c=>{
            const isActive=(catColors[showCatColorEdit]||CAT_COLORS[0])===c;
            return <div key={c} onMouseDown={e=>{e.stopPropagation();e.preventDefault();setCatColors(p=>({...p,[showCatColorEdit]:c}));}}
              style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",border:isActive?"3px solid "+T.bgCard:"3px solid transparent",boxShadow:isActive?"0 0 8px "+c+"80":"none",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {isActive&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}
            </div>;
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <span style={{fontSize:11,color:T.fgMuted}}>Personnalisée :</span>
          <input type="color" value={catColors[showCatColorEdit]||CAT_COLORS[0]}
            onChange={e=>{setCatColors(p=>({...p,[showCatColorEdit]:e.target.value}));}}
            style={{width:48,height:32,border:"1px solid #555",borderRadius:4,background:T.bg,cursor:"pointer",padding:2}}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button onMouseDown={e=>{e.stopPropagation();setShowCatColorEdit(null);}} style={{...B,background:"#548CA8"}}>Fermer</button>
        </div>
      </div>
    </div>}
    {/* Category grouping modal */}
    {showCatModal&&<div className="moverlay" style={{position:"fixed",inset:0,background:T.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:250}} onClick={()=>setShowCatModal(false)}><div style={{background:T.bgCard,borderRadius:8,padding:24,width:440,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Gérer les catégories</h3>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input type="text" value={catEditName} onChange={e=>setCatEditName(e.target.value)} placeholder="Nom de la catégorie..." style={{...I,flex:1}}/>
          <button onClick={()=>{if(catEditName.trim()){const name=catEditName.trim();catEditDomains.forEach(d=>{setApps(p=>p.map(a=>a.domain===d?{...a,category:name}:a));});setCatEditName("");setCatEditDomains([]);}}} style={{...B,background:"#52B788",padding:"6px 16px",whiteSpace:"nowrap"}}>{catEditDomains.length>0?"Appliquer":"Créer"}</button>
        </div>
        <div style={{fontSize:11,color:T.fgMuted,marginBottom:8}}>Sélectionnez les domaines à inclure :</div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {[...new Set(apps.map(a=>a.domain))].map(d=>{
            const c=DC[d]||DC.Autre;const checked=catEditDomains.includes(d);const curCat=apps.find(a=>a.domain===d)?.category||"";
            return <div key={d} onClick={()=>setCatEditDomains(p=>checked?p.filter(x=>x!==d):[...p,d])} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:checked?c.ac+"20":"#0d0d0d",border:`1px solid ${checked?c.ac:"#333"}`,borderRadius:4,cursor:"pointer"}}>
              <div style={{width:14,height:14,borderRadius:4,border:`2px solid ${checked?c.ac:"#555"}`,background:checked?c.ac:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{checked&&<span style={{color:"#fff",fontSize:10}}>✓</span>}</div>
              <div style={{width:8,height:8,borderRadius:2,background:c.ac}}/>
              <span style={{fontSize:12,color:T.fg,flex:1}}>{d}</span>
              <span style={{fontSize:10,color:T.fgMuted}}>{apps.filter(a=>a.domain===d).length} apps</span>
              {curCat&&<span style={{fontSize:11,color:"#548CA8",background:"#548CA820",padding:"1px 6px",borderRadius:3}}>{curCat}</span>}
            </div>;})}
        </div>
      </div>
      <div style={{fontSize:11,color:T.fgMuted,marginBottom:8}}>Catégories existantes :</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {[...new Set(apps.map(a=>a.category).filter(Boolean))].map(cat=>{
          const catDoms=[...new Set(apps.filter(a=>a.category===cat).map(a=>a.domain))];
          const catApps=apps.filter(a=>a.category===cat).length;
          return <div key={cat} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:T.bg,borderRadius:8,border:"1px solid "+T.border,marginBottom:6}}>
            <span style={{flex:1,fontSize:11,color:T.fg,cursor:"pointer"}} onClick={()=>{setCatEditName(cat);setCatEditDomains(catDoms);}}>{cat}</span>
            <span style={{fontSize:11,color:T.fgMuted}}>{catDoms.length}d · {catApps}a</span>
            <span style={{cursor:"pointer",fontSize:10,color:"#548CA8",padding:"2px 4px"}} onMouseDown={e=>{e.stopPropagation();const nw=prompt("Nouveau nom :",cat);if(nw&&nw.trim()){setApps(p=>p.map(a=>a.category===cat?{...a,category:nw.trim()}:a));}}} title="Renommer">✏️</span>
            <span style={{cursor:"pointer",fontSize:10,color:"#E06C75",padding:"2px 4px"}} onMouseDown={e=>{e.stopPropagation();if(confirm("Supprimer la catégorie « "+cat+" » ? Les domaines resteront.")){setApps(p=>p.map(a=>a.category===cat?{...a,category:""}:a));}}} title="Supprimer">🗑</span>
          </div>;})}
        {[...new Set(apps.map(a=>a.category).filter(Boolean))].length===0&&<span style={{fontSize:10,color:T.fgDim}}>Aucune catégorie définie</span>}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}><button onClick={()=>setShowCatModal(false)} style={{...B,background:T.border}}>Fermer</button></div>
    </div></div>}
    {/* Context menu */}
    {ctxMenu&&<div style={{position:"fixed",inset:0,zIndex:400}} onMouseDown={()=>setCtxMenu(null)}>
      <div style={{position:"absolute",left:ctxMenu.x,top:ctxMenu.y,background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:4,minWidth:220,boxShadow:"0 8px 32px #00000070"}} onMouseDown={e=>e.stopPropagation()}>
        {ctxMenu.type==="category"&&<>
          <div style={{padding:"6px 12px",fontSize:11,color:T.fgMuted,fontWeight:700}}>{ctxMenu.target}</div>
          <div style={{height:1,background:T.border,margin:"2px 0"}}/>
          <div style={{padding:"6px 12px",fontSize:12,color:T.fg,cursor:"pointer",borderRadius:4}} onMouseDown={()=>{const nw=prompt("Nouveau nom pour la catégorie :",ctxMenu.target);if(nw&&nw.trim()){setApps(p=>p.map(a=>a.category===ctxMenu.target?{...a,category:nw.trim()}:a));}setCtxMenu(null);}}
            onMouseEnter={e=>e.currentTarget.style.background="#333"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✏️ Renommer</div>
          <div style={{padding:"6px 12px",fontSize:12,color:"#E06C75",cursor:"pointer",borderRadius:4}} onMouseDown={()=>{setApps(p=>p.map(a=>a.category===ctxMenu.target?{...a,category:""}:a));setCtxMenu(null);}}
            onMouseEnter={e=>e.currentTarget.style.background="#E06C7520"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>🗑 Supprimer la catégorie</div>
        </>}
        {ctxMenu.type==="app"&&function(){
          var app2=apps.find(function(a){return a.id===ctxMenu.target;});
          if(!app2)return null;
          var appOut=flows.filter(function(f){return f.from===app2.id;});
          var appIn=flows.filter(function(f){return f.to===app2.id;});
          var allF=appOut.map(function(f){return{f:f,dir:"out"};}).concat(appIn.map(function(f){return{f:f,dir:"in"};}));
          var dc2=DC[app2.domain]||DC.Autre;
          return <>
            <div style={{padding:"8px 12px 6px",borderBottom:"1px solid "+T.border}}>
              <div style={{fontSize:12,fontWeight:800,color:T.fg}}>{app2.name}</div>
              <div style={{fontSize:10,color:dc2.ac,fontWeight:600,marginTop:1}}>{app2.domain}</div>
            </div>
            <div style={{padding:"3px 4px",borderBottom:"1px solid "+T.border}}>
              {[["Modifier l'app","#6366F1",function(){setEApp(Object.assign({},app2));setShowAM(true);setCtxMenu(null);}],
                ["Supprimer l'app","#EF4444",function(){if(window.confirm("Supprimer "+app2.name+" ?")){setApps(function(p){return p.filter(function(a){return a.id!==app2.id;});});setFlows(function(p){return p.filter(function(f){return f.from!==app2.id&&f.to!==app2.id;});});}setCtxMenu(null);}]
              ].map(function(item){return <div key={item[0]} style={{padding:"6px 8px",fontSize:11,color:item[1],cursor:"pointer",borderRadius:5,display:"flex",alignItems:"center",gap:6}}
                onMouseEnter={function(e){e.currentTarget.style.background=item[1]+"15";}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}
                onMouseDown={item[2]}>{item[0]}</div>;})}
            </div>
            <div style={{padding:"4px 12px 4px",fontSize:10,fontWeight:700,color:T.fgMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>Flux ({allF.length})</div>
            <div style={{maxHeight:200,overflowY:"auto"}}>
              {allF.length===0&&<div style={{padding:"6px 12px",fontSize:11,color:T.fgFaint,fontStyle:"italic"}}>Aucun flux</div>}
              {allF.map(function(item){
                var other=item.dir==="out"?apps.find(function(a){return a.id===item.f.to;}):apps.find(function(a){return a.id===item.f.from;});
                var oCC=other?DC[other.domain]||DC.Autre:{ac:"#888"};
                return <div key={item.f.id} style={{padding:"5px 8px",display:"flex",alignItems:"center",gap:5,borderTop:"1px solid "+T.borderLight}}>
                  <span style={{fontSize:10,fontWeight:700,color:item.dir==="out"?"#10B981":"#6366F1",width:12,flexShrink:0}}>{item.dir==="out"?"→":"←"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:600,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{other?other.name:"?"}</div>
                    <div style={{fontSize:9,color:oCC.ac}}>{item.f.protocol||""}{item.f.label?" · "+item.f.label:""}</div>
                  </div>
                  <button onMouseDown={function(e){e.stopPropagation();setEFlow(Object.assign({},item.f));setShowFM(true);setCtxMenu(null);}} style={{background:"#6366F118",border:"1px solid #6366F140",color:"#6366F1",borderRadius:4,padding:"2px 5px",fontSize:11,cursor:"pointer",flexShrink:0}}>✏</button>
                  <button onMouseDown={function(e){e.stopPropagation();if(window.confirm("Supprimer ce flux ?")){setFlows(function(p){return p.filter(function(fl){return fl.id!==item.f.id;});});}setCtxMenu(null);}} style={{background:"#EF444415",border:"1px solid #EF444440",color:"#EF4444",borderRadius:4,padding:"2px 5px",fontSize:11,cursor:"pointer",flexShrink:0}}>&#128465;</button>
                </div>;
              })}
            </div>
          </>;
        }()}
        {ctxMenu.type==="domain"&&<>

          <div style={{padding:"6px 12px",fontSize:11,color:T.fgMuted,fontWeight:700}}>{ctxMenu.target}</div>
          <div style={{height:1,background:T.border,margin:"2px 0"}}/>
          <div style={{padding:"6px 12px",fontSize:12,color:T.fg,cursor:"pointer",borderRadius:4}} onMouseDown={()=>{setDomScales(p=>({...p,[ctxMenu.target]:(p[ctxMenu.target]||1)*1.2}));setCtxMenu(null);}}
            onMouseEnter={e=>e.currentTarget.style.background="#333"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>🔍+ Agrandir le domaine</div>
          <div style={{padding:"6px 12px",fontSize:12,color:T.fg,cursor:"pointer",borderRadius:4}} onMouseDown={()=>{setDomScales(p=>({...p,[ctxMenu.target]:Math.max(0.5,(p[ctxMenu.target]||1)*0.85)}));setCtxMenu(null);}}
            onMouseEnter={e=>e.currentTarget.style.background="#333"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>🔍- Réduire le domaine</div>
          <div style={{padding:"6px 12px",fontSize:12,color:T.fgMuted,cursor:"pointer",borderRadius:4}} onMouseDown={()=>{setDomScales(p=>{const n={...p};delete n[ctxMenu.target];return n;});setCtxMenu(null);}}
            onMouseEnter={e=>e.currentTarget.style.background="#333"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>↺ Taille par défaut</div>
          <div style={{height:1,background:T.border,margin:"2px 0"}}/>
          <div style={{padding:"6px 12px",fontSize:12,color:T.fg,cursor:"pointer",borderRadius:4}} onMouseDown={()=>{setShowDomEdit(ctxMenu.target);setCtxMenu(null);}}
            onMouseEnter={e=>e.currentTarget.style.background="#333"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>🎨 Changer la couleur</div>
        </>}
      </div>
    </div>}
    {showFM&&eFlow&&<div className="moverlay" style={{position:"fixed",inset:0,background:T.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}} onClick={()=>setShowFM(false)}><div style={{background:T.bgCard,borderRadius:8,padding:24,width:420,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Éditer le flux</h3>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,padding:"10px 14px",background:T.bg,borderRadius:6}}>
        <div><div style={{fontSize:10,color:T.fgMuted,marginBottom:2}}>Source</div><div style={{fontSize:13,fontWeight:600}}>{apps.find(a=>a.id===eFlow.from)?.name||"?"}</div></div>
        <span style={{fontSize:18,color:"#548CA8",margin:"0 12px"}}>→</span>
        <div style={{textAlign:"right"}}><div style={{fontSize:10,color:T.fgMuted,marginBottom:2}}>Cible</div><div style={{fontSize:13,fontWeight:600}}>{apps.find(a=>a.id===eFlow.to)?.name||"?"}</div></div>
      </div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Libellé du flux</label><input type="text" value={eFlow.label||""} placeholder="Ex: Données clients, Commandes..." onChange={e=>setEFlow(p=>({...p,label:e.target.value}))} style={I}/></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Protocole / Type</label><select value={eFlow.protocol||"API"} onChange={e=>setEFlow(p=>({...p,protocol:e.target.value}))} style={I}>{PROTOS.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Fréquence</label><select value={eFlow.frequency||""} onChange={e=>setEFlow(p=>({...p,frequency:e.target.value}))} style={I}>{FREQS.map(o=><option key={o} value={o}>{o||"— Non défini —"}</option>)}</select></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Description / Notes</label><textarea value={eFlow.description||""} placeholder="Détails sur ce flux..." rows={3} onChange={e=>setEFlow(p=>({...p,description:e.target.value}))} style={{...I,resize:"vertical",fontFamily:"inherit"}}/></div>
      <div style={{display:"flex",gap:8,marginTop:20,justifyContent:"space-between"}}>
        <button onClick={()=>{setFlows(p=>p.filter(f=>f.id!==eFlow.id));setShowFM(false);}} style={{...B,background:"#E06C75",padding:"8px 14px"}}>🗑 Supprimer</button>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setShowFM(false)} style={{...B,background:T.border}}>Annuler</button><button onClick={()=>{setFlows(p=>p.map(f=>f.id===eFlow.id?{...eFlow}:f));setShowFM(false);}} style={{...B,background:"#548CA8"}}>Sauvegarder</button></div>
      </div>
    </div></div>}
    {/* Flow context menu (right-click) */}
    {flowCtx&&<div style={{position:"fixed",left:flowCtx.x,top:flowCtx.y,background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:5,minWidth:160,boxShadow:"0 4px 20px #00000050",zIndex:500}} onMouseLeave={function(){setFlowCtx(null);}}>
      <div style={{padding:"4px 10px 6px",fontSize:11,fontWeight:600,color:T.fgDim,textTransform:"uppercase",letterSpacing:1}}>
        {apps.find(function(a){return a.id===flowCtx.flow.from;})?.name||"?"} → {apps.find(function(a){return a.id===flowCtx.flow.to;})?.name||"?"}
      </div>
      <div onClick={function(){setEFlow(Object.assign({},flowCtx.flow));setShowFM(true);setFlowCtx(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:4,cursor:"pointer"}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
        <span style={{fontSize:14}}>&#9998;</span><span style={{fontSize:11,color:T.fg}}>Éditer</span>
      </div>
      <div onClick={function(){if(confirm("Supprimer ce flux ?")){setFlows(function(p){return p.filter(function(f){return f.id!==flowCtx.flow.id;});});setFlowCtx(null);setSelFlow(null);}}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:4,cursor:"pointer"}} onMouseEnter={function(e){e.currentTarget.style.background="#FF525220";}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
        <span style={{fontSize:14}}>&#128465;</span><span style={{fontSize:11,color:"#E06C75",fontWeight:600}}>Supprimer</span>
      </div>
    </div>}
  </div></div></AppCtx.Provider>;
}

export default App;

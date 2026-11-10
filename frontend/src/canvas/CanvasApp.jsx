import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import CanvasHome from './CanvasHome';
import { ItsiBudgetWidget, ItsiPatrimoineWidget } from './ItsiWidgets';
import { routeFlows, pathToD, placeLabels } from './flowRouting';
import ViewsMenu from './ViewsMenu';
import ExportModal from './ExportModal';
import OptionListsEditor from './OptionListsEditor';
import { STATUT_OPTS, STATUT_COLORS, applyOptionLists, currentLists } from './optionLists';
import { translateString, getLang } from '../i18n';
import { canonLabel, DOMAIN_OPTS } from './templateI18n';
import API from '../api/client';
import { getMode, setMode, toggleMode } from '../utils/mode';
import { createPortal } from 'react-dom';
import {
  COST_TYPES, COST_COLORS, HOSTING_OPTS, HOSTING_COLORS, APPTYPE_OPTS, APPTYPE_COLORS, EOS_BUCKETS, ITSI_FIELDS, DEAL_ONLY_PATTERNS,
  normText, parseAmount, parseDate, canonOption, eosBucket, formatEuro, formatDateFr,
} from './itsi';

// Dynamic imports — these heavy libs (XLSX ~816KB, ) load only when
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
const ensureXLSX  = async () => { if (!XLSX)       XLSX       = await import('xlsx'); };


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
const CRIT_OPTS=["Haute","Moyenne","Basse","Critique"];
const D1_OPTS=["","Transfert TSA","Maintien","Rebuild","Abandon"];
const D2_OPTS=["","Clone & Clean","Transfert","Abandon","Rebuild"];
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
  const en = getLang() === "en";
  const T = (s) => (typeof s === "string" ? translateString(s).trim() : s);
  const TR = (rows) => rows.map((r) => r.map(T));
  const sheetName = (s) => T(s).replace(/[\\/?*\[\]:]/g, "-").slice(0, 31);
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
  // Les flux sont décrits dans l'onglet « Flux Métier » : on retire les colonnes Flux vers / Protocole / Objet de l'onglet Applications
  const flowColIdx = isDeal ? [11,12,13] : [17,18,19];
  const dropFlowCols = (row)=>row.filter((_,i)=>!flowColIdx.includes(i));
  const ws1 = XLSX.utils.aoa_to_sheet(TR([dropFlowCols(hdr),...ex.map(dropFlowCols)]));
  ws1["!cols"]= (isDeal
    ? [{wch:22},{wch:20},{wch:16},{wch:35},{wch:12},{wch:12},{wch:22},{wch:12},{wch:18},{wch:14},{wch:18},{wch:18},{wch:28},{wch:16},{wch:30},{wch:28},{wch:16},{wch:16},{wch:12},{wch:12},{wch:24},{wch:28},{wch:18}]
    : [{wch:24},{wch:20},{wch:16},{wch:35},{wch:12},{wch:22},{wch:14},{wch:14},{wch:14},{wch:16},{wch:16},{wch:16},{wch:12},{wch:12},{wch:24},{wch:28},{wch:18},{wch:28},    {wch:16},{wch:30},{wch:28}]).filter((_,i)=>!flowColIdx.includes(i));
  XLSX.utils.book_append_sheet(wb,ws1,sheetName("Applications"));
  var fluxHdr=["N° Ordre","Application Émettrice","Application Réceptrice","Nom du Flux Métier","Protocole","Fréquence","Description"];
  var fluxEx=[[1,"SAP S/4HANA","Salesforce","Synchronisation clients","API","Temps réel","Envoi fiches clients"],[2,"SAP S/4HANA","Salesforce","Tarifs catalogue","API","Journalier","MAJ prix"],[3,"SAP S/4HANA","Power BI","Reporting financier","API","Journalier","Données comptables"],[4,"Salesforce","SAP S/4HANA","Commandes validées","REST","Temps réel","Retour commandes"],[5,"ADP","SAP S/4HANA","Écritures de paie","SFTP","Mensuel","Intégration paie"],[6,"MES Wonderware","SAP S/4HANA","Ordres de fabrication","API","Temps réel","Retour production"],[7,"WMS Reflex","SAP S/4HANA","Mouvements de stock","API","Temps réel","Entrées/sorties d'entrepôt"],[8,"DocuSign","Salesforce","Contrats signés","API","À la demande","Retour des signatures"],[9,"Workday","ADP","Données collaborateurs","API","Journalier","Synchronisation RH"],[10,"MES Wonderware","WMS Reflex","Bons de sortie","MQ","Temps réel","Préparation des expéditions"]];
  var wsFlux=XLSX.utils.aoa_to_sheet(TR([fluxHdr].concat(fluxEx)));wsFlux["!cols"]=[{wch:10},{wch:24},{wch:24},{wch:28},{wch:14},{wch:16},{wch:45}];
  XLSX.utils.book_append_sheet(wb,wsFlux,sheetName("Flux Métier"));
  const ref=[["Domaine","Description","Couleur"],["Finance","Comptabilité, controlling","#52B788"],["RH","Paie, talents, formation","#9D4EDD"],["IT","Infra, dev, BI","#548CA8"],["Commercial","CRM, ventes","#E06C75"],["Production","MES, qualité","#D4A017"],["Logistique","WMS, supply chain","#40A578"],["Marketing","Emailing, CMS","#D63384"],["Juridique","Contrats, conformité","#57A0A0"],["Direction","Reporting, stratégie","#7B78FF"],["Autre","Non classifié","#9E9E9E"]];
  const ws2=XLSX.utils.aoa_to_sheet(TR(ref)); ws2["!cols"]=[{wch:16},{wch:40},{wch:12}]; XLSX.utils.book_append_sheet(wb,ws2,sheetName("Référentiel Domaines"));
  if(!isDeal){
    const wsStatuts=XLSX.utils.aoa_to_sheet(TR([["Statut","Définition"],...STATUT_DEFS]));
    wsStatuts["!cols"]=[{wch:22},{wch:90}];
    XLSX.utils.book_append_sheet(wb,wsStatuts,sheetName("Référentiel Statuts"));
  }
  {
    const wsPatr=XLSX.utils.aoa_to_sheet(TR([["Champ","Valeur","Définition"],
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
      ["Date de fin de mise en service","AAAA-MM-JJ","Date prévue d'arrêt ou de fin de support (ex : 2027-06-30). Les formats JJ/MM/AAAA, MM/AAAA et AAAA sont aussi reconnus"]]));
    wsPatr["!cols"]=[{wch:30},{wch:32},{wch:95}];
    XLSX.utils.book_append_sheet(wb,wsPatr,sheetName("Référentiel Patrimoine"));
  }
  const ins = isDeal ? [["TEMPLATE CARTOGRAPHIE APPLICATIVE",""],["",""],["COLONNES OBLIGATOIRES",""],["Nom Application","Nom unique de l'application"],["Domaine","Finance, RH, IT, Commercial, Production, Logistique, Marketing, Juridique, Direction, Autre"],["",""],["COLONNES OPTIONNELLES",""],["Criticité","Haute / Moyenne / Basse"],["Statut Day 1","Stratégie de closing : Transfert TSA / Maintien / Rebuild / Abandon"],["Statut Day 2","Stratégie cible : Clone & Clean / Transfert / Rebuild / Abandon"],["Flux","Décrits dans l'onglet « Flux Métier » : une ligne par flux (application émettrice, réceptrice, nom, protocole, fréquence)"],["Coût annuel (€) / Coût mensuel (€)","Optionnel : l'un ou l'autre (annuel = mensuel ×12). Alimente le widget « Budget & coûts »"],["Type de coût","Optionnel : OPEX / CAPEX"],["Nb licences, Hébergement, Type d'application, Date de fin de mise en service","Optionnels : alimentent le widget « Patrimoine applicatif » (valeurs attendues : onglet « Référentiel Patrimoine »)"],["",""],["CONSEILS",""],["1.","Les noms des applications émettrice et réceptrice (onglet 'Flux Métier') = noms exacts de la colonne A"],["2.","Day 1 = statut de closing (J1) · Day 2 = vision cible à terme"],["3.","Voir onglet 'Référentiel Domaines' pour les couleurs"]]
  : [["TEMPLATE CARTOGRAPHIE APPLICATIVE",""],["",""],["COLONNES OBLIGATOIRES",""],["Nom Application","Nom unique de l'application"],["Domaine","Finance, RH, IT, Commercial, Production, Logistique, Marketing, Juridique, Direction, Autre"],["",""],["COLONNES OPTIONNELLES",""],["Criticité","Haute / Moyenne / Basse"],["Statut","Voir l'onglet 'Référentiel Statuts' pour la liste complète et les définitions"],["Coût annuel (€)","Coût annuel de l'application en euros HT (nombre, sans séparateur de milliers)"],["Coût mensuel (€)","Alternative au coût annuel (le coût annuel est alors calculé ×12)"],["Type de coût","OPEX / CAPEX"],["Nb licences","Nombre de licences ou de sièges"],["Hébergement","On-premise / Cloud privé / Cloud public (IaaS/PaaS) / SaaS / Hybride / Inconnu"],["Type d'application","Progiciel (COTS) / Développement spécifique / Open source / Socle / Middleware / Poste de travail / Bureautique / Autre"],["Date de fin de mise en service","Au format AAAA-MM-JJ (ex : 2027-06-30)"],["Flux","Décrits dans l'onglet « Flux Métier » : une ligne par flux (application émettrice, réceptrice, nom, protocole, fréquence)"],["",""],["CONSEILS",""],["1.","Les noms des applications émettrice et réceptrice (onglet 'Flux Métier') = noms exacts de la colonne A"],["2.","Voir onglet 'Référentiel Statuts' pour la liste des statuts d'application"],["3.","Voir onglet 'Référentiel Domaines' pour les couleurs"],["4.","Voir onglet 'Référentiel Patrimoine' pour les valeurs attendues (type de coût, hébergement, type d'application, formats)"],["5.","Colonnes Coût, Hébergement, Type d'application et Date de fin de mise en service : alimentent les widgets « Budget & coûts » et « Patrimoine applicatif » du dashboard"]];
  const ws3=XLSX.utils.aoa_to_sheet(TR(ins)); ws3["!cols"]=[{wch:30},{wch:70}]; XLSX.utils.book_append_sheet(wb,ws3,sheetName("Instructions"));
  XLSX.writeFile(wb,en?"application_map_template.xlsx":"template_cartographie.xlsx");
};


// ═══ SIDEBAR COMPONENT (V11) ═══
function Sidebar(){
  var ref=React.useContext(AppCtx);
  if(!ref)return null;
  var view=ref.view,setView=ref.setView,isDark=ref.isDark,T=ref.T,apps=ref.apps,flows=ref.flows,sidebarOpen=ref.sidebarOpen,setSidebarOpen=ref.setSidebarOpen,projectType=ref.projectType;
  var W=sidebarOpen?200:56;
  var NAV=[
    {id:"mapping",icon:"Map",label:"Cartographie",color:"#6366F1"},
    {id:"urbanisme",icon:"Grid",label:"Paysage",color:"#F59E0B"},
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

function App({ initialSnapshot, onSave, wsMessage, projectId, onThemeChange, topOffset = 0, projectType = "deal", viewsSlot = null, isAdmin = false }) {
  var _stateKey = projectId ? "carto_state_" + projectId : "carto_state";
  var snapshotApplied = useRef(false);
  var [canvasReady, setCanvasReady] = useState(false);
  var _tk=useState(getMode);
  var themeKey=_tk[0],setThemeKey=_tk[1];
  var T=THEMES[themeKey]||THEMES.dark;
  var isDark=themeKey==="dark";
  var toggleTheme=function(){toggleMode();};
  useEffect(function(){
    var h=function(e){setThemeKey(e.detail);};
    window.addEventListener("carto:mode-change",h);
    return function(){window.removeEventListener("carto:mode-change",h);};
  },[]);
  useEffect(function(){
    document.body.style.background=T.bg;
    document.body.style.color=T.fg;
    setMode(themeKey);
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
  const routeCacheRef=useRef({sig:"",paths:null});
  const dragRef=useRef(null); // mirror of drag for always-current access in event handlers
  const startDrag=(val)=>{dragRef.current=val;setDrag(val);};
  const stopDrag=()=>{dragRef.current=null;setDrag(null);};
  const [showAM,setShowAM]=useState(false);
  const [listsV,setListsV]=useState(0);
  const [listsEditor,setListsEditor]=useState(null);
  useEffect(function(){API.get("/settings/option-lists").then(function(r){if(r.data){applyOptionLists(r.data);setListsV(function(v){return v+1;});}}).catch(function(){});},[]);
  function migrateApp(a,migrations){var n=a;Object.keys(migrations).forEach(function(f){var m=migrations[f];var cv=a[f]||"";if(cv&&Object.prototype.hasOwnProperty.call(m,cv))n={...n,[f]:m[cv]};});return n;}
  function saveOptionLists(lists,migrations){
    return API.put("/settings/option-lists",lists).then(function(r){
      applyOptionLists(r.data);
      setApps(function(prev){return prev.map(function(a){return migrateApp(a,migrations);});});
      setEApp(function(a){return a?migrateApp(a,migrations):a;});
      setListsV(function(v){return v+1;});
    });
  }
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
const lassoRef=useRef(null);
const [lasso,setLasso]=useState(null);
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
    setCanvasReady(true);
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
    if(!canvasReady) return;
    if(onSave) onSave({ apps, flows, domColors });
  }, [apps,flows,domColors,onSave,canvasReady]);

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
  const [flowProto,setFlowProto]=useState("");
  const [flowCrit,setFlowCrit]=useState("");
  const [flowDir,setFlowDir]=useState(""); // "" | "in" | "out" | "bi"
  const [showFluxListModal,setShowFluxListModal]=useState(null);
  const [flowThickness,setFlowThickness]=useState(2);
  const [flowFontSize,setFlowFontSize]=useState(13);
  const [panelOpen,setPanelOpen]=useState(false);
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
  const [toolbarHidden,setToolbarHidden]=useState(function(){try{return localStorage.getItem("carto:toolbarHidden")==="1";}catch(e){return false;}});
  function toggleToolbar(){var v=!toolbarHidden;setToolbarHidden(v);setOpenMenu(null);try{localStorage.setItem("carto:toolbarHidden",v?"1":"0");}catch(e){}}
  const [urbZone,setUrbZone]=useState(null);
  const [urbSearch,setUrbSearch]=useState("");
  const [urbSort,setUrbSort]=useState("apps");
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
    const na=rawData.map((r,i)=>({id:uid(),name:r[cMap.name]||"App_"+i,domain:canonLabel(r[cMap.domain],DOMAIN_OPTS)||"Autre",category:r[cMap.category]||"",description:r[cMap.description]||"",criticality:canonLabel(r[cMap.criticality],CRIT_OPTS)||"Moyenne",vendor:r[cMap.vendor]||"",version:r[cMap.version]||"",owner:r[cMap.owner]||"",users:parseInt(r[cMap.users])||0,statut:canonLabel(r[cMap.statut],STATUT_OPTS),statusD1:canonLabel(r[cMap.statusD1],D1_OPTS),statusD2:canonLabel(r[cMap.statusD2],D2_OPTS),x:0,y:0,_ft:r[cMap.flowTo]||"",_fp:r[cMap.flowProtocol]||"",_fl:r[cMap.flowLabel]||"",...(function(){var an=parseAmount(r[cMap.budget]),mo=parseAmount(r[cMap.monthlyCost]);return{budget:an!=null?an:(mo!=null?Math.round(mo*12*100)/100:null),monthlyCost:mo!=null?mo:(an!=null?Math.round(an/12*100)/100:null)};})(),...{costType:canonOption(r[cMap.costType],COST_TYPES),licenses:parseInt(String(r[cMap.licenses]||"").replace(/\s/g,""))||0,hosting:canonOption(r[cMap.hosting],HOSTING_OPTS),appType:canonOption(r[cMap.appType],APPTYPE_OPTS),endOfService:parseDate(r[cMap.endOfService])}}));
    const nf=[];
    if(rawFluxData&&rawFluxData.length>0){
      var nrm=function(s){return(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();};
      var fHdr=Object.keys(rawFluxData[0]);
      var findCol=function(kw){return fHdr.find(function(h){return kw.some(function(k){return nrm(h).indexOf(k)>=0;});});};
      var colFrom=findCol(["emettrice","source","from","sending"]);
      var colTo=findCol(["receptrice","receiving","cible","to","vers"]);
      var colName=findCol(["nom du flux","flux metier","nom flux","libelle","label","name","flow"]);
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
      if((e.shiftKey||selMode)&&cvRef.current&&!cMode){
        const r=cvRef.current.getBoundingClientRect();
        const wx=(e.clientX-r.left-off.x)/zm,wy=(e.clientY-r.top-off.y)/zm;
        lassoRef.current={x0:wx,y0:wy,add:e.shiftKey};
        setLasso({x0:wx,y0:wy,x1:wx,y1:wy});setSelApp(null);setFocusApp(null);setSelFlow(null);
        return;
      }
      setPan(true);pRef.current={x:e.clientX-off.x,y:e.clientY-off.y};setSelApp(null);setFocusApp(null);setSelFlow(null);setFlowSuppressed(true);setMultiSel([]);
    }
  };
  const onCM=e=>{
    if(pan)setOff({x:e.clientX-pRef.current.x,y:e.clientY-pRef.current.y});
    if(lassoRef.current&&cvRef.current){
      const r=cvRef.current.getBoundingClientRect();
      const l=lassoRef.current;
      setLasso({x0:l.x0,y0:l.y0,x1:(e.clientX-r.left-off.x)/zm,y1:(e.clientY-r.top-off.y)/zm});
      return;
    }
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
    if(lassoRef.current){
      const l=lassoRef.current;
      const box=lasso;
      lassoRef.current=null;setLasso(null);
      if(box){
        const bx1=Math.min(box.x0,box.x1),bx2=Math.max(box.x0,box.x1),by1=Math.min(box.y0,box.y1),by2=Math.max(box.y0,box.y1);
        if(bx2-bx1>4/zm||by2-by1>4/zm){
          const hit=apps.filter(function(a){
            const k=AW_BASE*globalScale*(domScales[a.domain]||1)*Math.max(0.7,fontScale),kh=AH_BASE*globalScale*(domScales[a.domain]||1)*Math.max(0.7,fontScale);
            return a.x<bx2&&a.x+k>bx1&&a.y<by2&&a.y+kh>by1;
          }).map(function(a){return a.id;});
          setMultiSel(function(p){return l.add?Array.from(new Set(p.concat(hit))):hit;});
        }else if(!l.add)setMultiSel([]);
      }
      return;
    }
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
    const hasFlowsToRoute=flows.length>0;
    const cGx=Math.max(18+appSpacing,hasFlowsToRoute?46:0),cGy=Math.max(14+appSpacing,hasFlowsToRoute?40:0),domPad=44,domSide=22,domGap=flowDisplayMode==="static"?Math.max(domainSpacing,220):domainSpacing;
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
    // Affinage : ?changes de domaines entre cases pour minimiser flux x distance.
    var slotCost=function(arr){var c=0;for(var i=0;i<arr.length;i++)for(var j=i+1;j<arr.length;j++){var w=pairFlows[[arr[i].domain,arr[j].domain].sort().join("\x00")]||0;if(w)c+=w*(Math.abs(i%domainCols-j%domainCols)+Math.abs(Math.floor(i/domainCols)-Math.floor(j/domainCols)));}return c;};
    for(var pass=0;pass<12;pass++){
      var improvedSwap=false;
      for(var si=0;si<domainLayouts.length;si++)for(var sj=si+1;sj<domainLayouts.length;sj++){
        var before=slotCost(domainLayouts);
        var tmpL=domainLayouts[si];domainLayouts[si]=domainLayouts[sj];domainLayouts[sj]=tmpL;
        if(slotCost(domainLayouts)<before)improvedSwap=true;else{tmpL=domainLayouts[si];domainLayouts[si]=domainLayouts[sj];domainLayouts[sj]=tmpL;}
      }
      if(!improvedSwap)break;
    }
    var colWidths=new Array(domainCols).fill(0),rowHeights=new Array(domainRows).fill(0);
    domainLayouts.forEach(function(item,index){var col=index%domainCols,row=Math.floor(index/domainCols);colWidths[col]=Math.max(colWidths[col],item.size.w);rowHeights[row]=Math.max(rowHeights[row],item.size.h);});
    var domainGap=Math.max(70,Math.min(domGap,96));
    // Couloirs proportionnels au nombre de flux qui traversent chaque fronti?re.
    var crossing=function(axis,boundary){var c=0;for(var i=0;i<domainLayouts.length;i++)for(var j=i+1;j<domainLayouts.length;j++){var w=pairFlows[[domainLayouts[i].domain,domainLayouts[j].domain].sort().join("\x00")]||0;if(!w)continue;var ai=axis===0?i%domainCols:Math.floor(i/domainCols),aj=axis===0?j%domainCols:Math.floor(j/domainCols);if(Math.min(ai,aj)<=boundary&&Math.max(ai,aj)>boundary)c+=w;}return c;};
    var colOffsets=[],rowOffsets=[],offset=0;
    colWidths.forEach(function(width,index){colOffsets[index]=offset;offset+=width+(index<colWidths.length-1?Math.min(420,domainGap+crossing(0,index)*8):0);});
    offset=0;
    rowHeights.forEach(function(height,index){rowOffsets[index]=offset;offset+=height+(index<rowHeights.length-1?Math.min(420,domainGap+crossing(1,index)*8):0);});
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

  const viewSettings=[["domScales",domScales,setDomScales],["domPads",domPads,setDomPads],["catPads",catPads,setCatPads],["catBounds",catBounds,setCatBounds],["catColors",catColors,setCatColors],["domColors",domColors,setDomColors],["globalScale",globalScale,setGlobalScale],["fontScale",fontScale,setFontScale],["appFontScale",appFontScale,setAppFontScale],["domainFontScale",domainFontScale,setDomainFontScale],["categoryFontScale",categoryFontScale,setCategoryFontScale],["categoryScale",categoryScale,setCategoryScale],["domainPadding",domainPadding,setDomainPadding],["domBorderW",domBorderW,setDomBorderW],["categoryBorderW",categoryBorderW,setCategoryBorderW],["appSpacing",appSpacing,setAppSpacing],["domainSpacing",domainSpacing,setDomainSpacing],["categorySpacing",categorySpacing,setCategorySpacing],["flowThickness",flowThickness,setFlowThickness],["flowFontSize",flowFontSize,setFlowFontSize],["flowDisplayMode",flowDisplayMode,setFlowDisplayMode],["flowDash",flowDash,setFlowDash],["flowColorCustom",flowColorCustom,setFlowColorCustom],["zoom",zm,setZm],["offset",off,setOff]];
  const getViewState=()=>{
    const positions={};apps.forEach(a=>{positions[a.id]=[a.x,a.y];});
    const st={version:1,positions:positions};
    viewSettings.forEach(t=>{st[t[0]]=t[1];});
    return st;
  };
  const applyViewState=(st)=>{
    if(!st)return;
    if(st.positions)setApps(p=>p.map(a=>st.positions[a.id]?{...a,x:st.positions[a.id][0],y:st.positions[a.id][1]}:a));
    viewSettings.forEach(t=>{if(st[t[0]]!==undefined)t[2](st[t[0]]);});
  };

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

  const exportPPTX=async(payload)=>{
    const res=await API.post("/export/pptx",payload,{responseType:"blob"});
    const url=URL.createObjectURL(res.data);
    const a=document.createElement("a");a.href=url;a.download="Cartographie_Applicative.pptx";
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
  };

  const appFiltered=useMemo(()=>{let r=apps;if(selDom.length)r=r.filter(a=>selDom.includes(a.domain));if(selCat.length)r=r.filter(a=>selCat.includes(a.category||""));if(selCrit.length)r=r.filter(a=>selCrit.includes(a.criticality));if(projectType==='deal'){if(selD1)r=r.filter(a=>a.statusD1===selD1);if(selD2)r=r.filter(a=>a.statusD2===selD2);}else{if(selStatut)r=r.filter(a=>a.statut===selStatut);if(selHost.length)r=r.filter(a=>selHost.includes(a.hosting||""));if(selAType.length)r=r.filter(a=>selAType.includes(a.appType||""));if(selEos.length)r=r.filter(a=>selEos.includes(eosBucket(a.endOfService)));}if(search){const s=search.toLowerCase();r=r.filter(a=>a.name.toLowerCase().includes(s)||a.domain.toLowerCase().includes(s)||(a.vendor||"").toLowerCase().includes(s));}return r;},[apps,selDom,selCat,selCrit,selD1,selD2,selStatut,selHost,selAType,selEos,projectType,search]);
  // Flux visibles selon les filtres (apps visibles aux deux extrémités). refApp = application survolée/sélectionnée.
  const computeVisFlows=useCallback((refApp)=>{
    const ids={};appFiltered.forEach(a=>{ids[a.id]=a;});
    const rev={};flows.forEach(f=>{rev[f.from+"|"+f.to]=true;});
    const doms=selDom.length?selDom:(flowDomFilter?[flowDomFilter]:[]);
    return flows.filter(f=>{
      const fa=ids[f.from],ta=ids[f.to];
      if(!fa||!ta)return false;
      if(flowDomFilter&&fa.domain!==flowDomFilter&&ta.domain!==flowDomFilter)return false;
      if(flowProto&&f.protocol!==flowProto)return false;
      if(flowCrit&&fa.criticality!==flowCrit&&ta.criticality!==flowCrit)return false;
      if(flowDir){
        const bi=!!rev[f.to+"|"+f.from];
        if(flowDir==="bi"){if(!bi)return false;}
        else{
          if(bi)return false;
          if(refApp){if(flowDir==="in"&&f.to!==refApp)return false;if(flowDir==="out"&&f.from!==refApp)return false;}
          else if(doms.length){
            const fi=doms.includes(fa.domain),ti=doms.includes(ta.domain);
            if(flowDir==="in"&&!(ti&&!fi))return false;
            if(flowDir==="out"&&!(fi&&!ti))return false;
          }
        }
      }
      return true;
    });
  },[appFiltered,flows,selDom,flowDomFilter,flowProto,flowCrit,flowDir]);
  // Quand un filtre de flux est actif, seules les applications concernées restent affichées.
  const flowFilterActive=!!(flowDir||flowProto||flowCrit||flowDomFilter);
  const filtered=useMemo(()=>{
    if(!flowFilterActive)return appFiltered;
    const keep={};computeVisFlows(null).forEach(f=>{keep[f.from]=true;keep[f.to]=true;});
    return appFiltered.filter(a=>keep[a.id]||(flowDomFilter&&a.domain===flowDomFilter));
  },[appFiltered,flowFilterActive,computeVisFlows,flowDomFilter]);
  const activeFilters=(selDom.length+selCat.length+selCrit.length+selHost.length+selAType.length+selEos.length)>0||!!(selD1||selD2||selStatut||flowDir);
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
      onMouseDown={e=>{e.stopPropagation();if(cMode){if(!fFrom)setFFrom(app.id);else if(fFrom!==app.id){const nf={id:uid(),from:fFrom,to:app.id,protocol:"API",label:"",description:"",frequency:""};setFlows(p=>[...p,nf]);setEFlow({...nf});setShowFM(true);setFFrom(null);setCMode(false);}return;}if(e.shiftKey||e.ctrlKey||e.metaKey){setMultiSel(p=>p.includes(app.id)?p.filter(x=>x!==app.id):[...p,app.id]);return;}
        if(multiSel.length>1&&multiSel.includes(app.id)){setFlowSuppressed(false);startDrag({ids:multiSel.slice(),lx:e.clientX,ly:e.clientY});return;}
        setMultiSel([]);setSelApp(app);if(e.detail>=2){setPanelOpen(true);return;}setPanelOpen(false);setFocusApp(app.id);setSelFlow(null);setFlowSuppressed(false);const rect=e.currentTarget.getBoundingClientRect();startDrag({id:app.id,ox:e.clientX-rect.left,oy:e.clientY-rect.top});}}
      onDoubleClick={()=>{setSelApp(app);setPanelOpen(true);}}>

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
    if(flowSuppressed&&!staticMode)return null;
    var panelApp=panelOpen&&selApp?selApp.id:null;
    var refApp=focusApp||panelApp;
    if(!staticMode&&!refApp&&!selFlow&&!flowDomFilter&&!flowDir&&!flowProto&&!flowCrit)return null;
    var visFlows=computeVisFlows(refApp);
    if(refApp){visFlows=visFlows.filter(function(f){return f.from===refApp||f.to===refApp;});}
    if(selFlow){visFlows=visFlows.filter(function(f){return f.id===selFlow;});}
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
    var cardDims=function(a){var k=AW_BASE*globalScale*(domScales[a.domain]||1)*Math.max(0.7,fontScale);var kh=AH_BASE*globalScale*(domScales[a.domain]||1)*Math.max(0.7,fontScale);return{id:a.id,x:a.x,y:a.y,w:k,h:kh};};
    var shortTxt=function(f){var l=f.label||"";if(l.length>22)l=l.slice(0,21)+"\u2026";return l||(staticMode?"Flux":"");};
    var lblScale=Math.min(1/Math.max(0.08,zm),1.6);
    var routed={},labelPos={};
    if(visFlows.length>0&&visFlows.length<=250){
      var cards=filtered.map(cardDims);
      var links=visFlows.map(function(f){return{id:f.id,from:f.from,to:f.to};});
      var sig=cards.map(function(c){return c.id+":"+Math.round(c.x)+","+Math.round(c.y)+","+Math.round(c.w);}).join("|")+"#"+links.map(function(l){return l.id+l.from+l.to;}).join("|");
      var rc=routeCacheRef.current;
      if(rc.sig===sig&&rc.paths){routed=rc.paths;}
      else if(!drag){try{routed=routeFlows(cards,links).paths;}catch(err){console.error("routeFlows",err);routed={};}routeCacheRef.current={sig:sig,paths:routed};}
      var zmS=1/lblScale,lf=Math.max(8,flowFontSize);
      var specs=visFlows.filter(function(f){return routed[f.id];}).map(function(f){var t=shortTxt(f);return t?{id:f.id,w:Math.max(60,t.length*lf*0.55+16)/zmS,h:lf*1.5/zmS}:null;}).filter(Boolean);
      labelPos=placeLabels(routed,specs,cards);
    }
    var clip=function(cx2,cy2,w,h,tx,ty){var ddx=tx-cx2,ddy=ty-cy2;if(Math.abs(ddx)<0.5&&Math.abs(ddy)<0.5)return{x:cx2,y:cy2};var sx2=Math.abs(ddx)>0.5?(w/2)/Math.abs(ddx):9999;var sy2=Math.abs(ddy)>0.5?(h/2)/Math.abs(ddy):9999;var s=Math.min(sx2,sy2);return{x:cx2+ddx*s,y:cy2+ddy*s};};
        return <svg className="flow-layer" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
          {visFlows.map(function(f,flowIndex){var fa=apps.find(function(a){return a.id===f.from;}),ta=apps.find(function(a){return a.id===f.to;});if(!fa||!ta)return null;
            var flowColor=focusApp===f.from?"#34D399":focusApp===f.to?"#38BDF8":lineCol;
            var flowIsSelected=selFlow===f.id;
            var flowOpacity=staticMode?0.82:selFlow?(flowIsSelected?1:0.07):0.65;
            var flowLabelOpacity=staticMode?1:selFlow?(flowIsSelected?1:0.10):1;
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
        var rt=routed[f.id];
        if(rt){ep=rt[0];pathD=pathToD(rt,8);}
        var labelT=staticMode&&fa.domain!==ta.domain?(fa.domain===hubDomain?0.72:ta.domain===hubDomain?0.28:0.5):0.5;
        var labelX=ep.x+dx*labelT-(dy/len)*lane,labelY=ep.y+dy*labelT+(dx/len)*lane-(staticMode?14:0);
        if(rt&&labelPos[f.id]){labelX=labelPos[f.id].x;labelY=labelPos[f.id].y;}
        var txt=shortTxt(f);
        var labelFont=Math.max(8,flowFontSize);
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
          {txt&&<g opacity={flowLabelOpacity} transform={"translate("+labelX+" "+labelY+") scale("+lblScale+") translate("+(-labelX)+" "+(-labelY)+")"}>
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
    const DEFAULT_SIZES={chart_apps:"m",flow_matrix:"l",critical_apps:"l",chart_owner:"m",carveout:"l",it_budget:"l",it_patrimoine:"l",flowreg:"l"};
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
    const [critFilter,setCritFilter]=useState("");
    const [ownCrit,setOwnCrit]=useState("");
    const [flowSort,setFlowSort]=useState({k:"id",dir:1});
    const [ficheId,setFicheId]=useState(null);
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
    const CHART_TYPES_DEF={chart_apps:"bar",chart_owner:"donut",it_budget:"bars",it_patrimoine:"bars"};
    const [chartTypes,setChartTypes]=useState(Object.assign({},CHART_TYPES_DEF));
    const setChartType=function(id,t){setChartTypes(function(p){return Object.assign({},p,{[id]:t});});};
    const dm=[...new Set(apps.map(a=>a.domain))];
    const [domFilters,setDomFilters]=useState({});
    const [expFlow,setExpFlow]=useState(null);
    const domApps=function(id){var d=domFilters[id];return d?apps.filter(function(a){return a.domain===d;}):apps;};
    const domFlows=function(id){var d=domFilters[id];if(!d)return flows;var ids={};apps.forEach(function(a){if(a.domain===d)ids[a.id]=1;});return flows.filter(function(f){return ids[f.from]||ids[f.to];});};
    const DOM_FILTER_IDS=["chart_owner","it_budget","it_patrimoine","carveout"];
    const CHEV="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239aa4c7' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";
    const WIDGET_SEL_STYLE={background:T.bgAlt+" "+CHEV+" no-repeat right 7px center",color:T.fg,border:"1px solid "+T.border,borderRadius:8,padding:"0 22px 0 10px",fontSize:10.5,fontWeight:600,cursor:"pointer",outline:"none",height:26,boxSizing:"border-box",appearance:"none",WebkitAppearance:"none",maxWidth:118,minWidth:0,transition:"border-color .15s, background-color .15s"};
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
    var ALL_WIDGETS_LIST=["chart_apps","critical_apps","flow_matrix","chart_owner",...(projectType==='deal'?["carveout"]:[]),"it_budget","it_patrimoine","flowreg"];
    var getWidgetH=function(id){return{chart_apps:280,critical_apps:480,flow_matrix:460,chart_owner:260,carveout:760,it_budget:560,it_patrimoine:680,flowreg:720}[id]||300;};
    var buildDashboardLayout=function(columns,columnWidth,hidden){
      var hid=hidden||[];
      var rows=[{ids:["chart_apps"]},{ids:["critical_apps"],wide:true},{ids:["flow_matrix"],wide:true},{ids:["chart_owner"]},{ids:["it_budget","it_patrimoine"]}];
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
      {id:"overview",label:"Vue d'ensemble",icon:"▣",color:"#7C4DFF",desc:"Répartition du patrimoine applicatif",widgets:[{id:"chart_apps",label:"Apps par domaine"}]},
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
      var span={s:4,m:6,l:12}[size]||6;
      var fullW=Math.max(300,window.innerWidth<=900?window.innerWidth-80:window.innerWidth-270);var ww=Math.round((fullW-220)/12*span+(span-1)*20);
      var wh=undefined;
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
      var spanCols={s:4,m:6,l:12}[size]||6;
      return <div key={id} data-wid={id} className="dash-cell" style={{gridColumn:"span "+spanCols,minWidth:0,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"nowrap",justifyContent:"flex-end",minHeight:30}}>
          <div style={{flex:1}}/>
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
        <div className="dash-body" style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>{resolvedContent}</div>
      </div>;
    };
    return <div style={{width:"100%",padding:"24px 32px",boxSizing:"border-box"}} onMouseLeave={clearTip}>
      {/* Tooltip flottant pour les graphiques */}
      {chartTip&&<div style={{position:"fixed",left:chartTip.x+14,top:chartTip.y-36,background:T.bgCard,border:"1px solid "+T.border,borderRadius:6,padding:"5px 10px",fontSize:11,color:T.fg,pointerEvents:"none",zIndex:9999,boxShadow:T.shadow,whiteSpace:"nowrap"}}>
        <span style={{fontWeight:700}}>{chartTip.label}</span>
        {" · "}<span style={{color:T.fgMuted}}>{chartTip.val}{chartTip.pct!=null?" ("+chartTip.pct+"%)" :""}</span>
      </div>}
      <div style={{position:"sticky",top:0,zIndex:50,margin:"-24px -32px 16px",padding:"10px 20px",background:T.bgAlt,borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:T.fg,letterSpacing:"-0.02em",lineHeight:1}}>Dashboard</div>
          <div style={{fontSize:11,color:T.fgMuted,marginTop:3}}>Vue d'ensemble des domaines et flux applicatifs</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={function(){setShowCustom(function(p){return!p;});}} style={{background:showCustom?"linear-gradient(135deg,#2979FF,#00B8D4)":T.bgAlt,border:"1px solid "+(showCustom?"transparent":T.border),color:showCustom?"#fff":T.fg,borderRadius:9,padding:"8px 12px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}} title="Choisir les thèmes et widgets affichés">
            <span aria-hidden="true">⚙</span> Personnaliser
            <span style={{background:showCustom?"rgba(255,255,255,.25)":"rgba(41,121,255,.15)",color:showCustom?"#fff":"#2979FF",borderRadius:10,padding:"1px 7px",fontSize:10}}>{ALL_WIDGETS_LIST.filter(function(id){return!hiddenWidgets.includes(id);}).length}/{ALL_WIDGETS_LIST.length}</span>
          </button>
          <button onClick={function(){saveWidgetPos({});saveWidgetSizes(Object.assign({},DEFAULT_SIZES));setHiddenWidgets([]);setWZIndex({});}} style={{background:"transparent",border:"1px solid "+T.border,color:T.fgMuted,borderRadius:9,padding:"8px 12px",fontSize:11,cursor:"pointer"}} title="Réinitialiser la disposition">↺ Réinitialiser</button>
          <button onClick={function(){setView("mapping");setTimeout(fitCanvas,50);}} style={{...B,background:"#6366F1",padding:"5px 12px",fontSize:11,borderRadius:8,display:"flex",alignItems:"center",gap:5}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Cartographie
          </button>
        </div>
      </div>
      {hiddenWidgets.some(function(id){return ALL_WIDGETS_LIST.includes(id);})&&<div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <span style={{fontSize:11,color:T.fgMuted,fontWeight:600}}>Widgets masqués :</span>
        {ALL_WIDGETS_LIST.filter(function(id){return hiddenWidgets.includes(id);}).map(function(id){
          var lbl="";WIDGET_THEMES.forEach(function(th){th.widgets.forEach(function(w){if(w.id===id)lbl=w.label;});});
          return <button key={id} onClick={function(){toggleWidgetIds([id],true);}} title="Afficher ce widget" style={{background:T.bgAlt,border:"1px dashed "+T.border,color:T.fg,borderRadius:16,padding:"4px 11px",fontSize:11,cursor:"pointer"}}>+ {lbl||id}</button>;
        })}
        <button onClick={function(){relayoutWith([]);}} style={{background:"transparent",border:"none",color:"#6366F1",fontSize:11,fontWeight:700,cursor:"pointer"}}>Tout afficher</button>
      </div>}
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
      
      {function(){
        var fa=ficheId?apps.find(function(a){return a.id===ficheId;}):null;
        if(!fa)return null;
        var dcol=(DC[fa.domain]||DC.Autre).ac;var ccol=CC[fa.criticality]||"#888";
        var inF=flows.filter(function(f){return f.to===fa.id;});var outF=flows.filter(function(f){return f.from===fa.id;});
        var eb=EOS_BUCKETS.find(function(b){return b.id===eosBucket(fa.endOfService);});
        var alerts=[];
        if(fa.criticality==="Haute"||fa.criticality==="Critique"){alerts.push({c:"#EF4444",t:"Application \u00e0 criticit\u00e9 "+fa.criticality.toLowerCase()+" : continuit\u00e9 de service \u00e0 s\u00e9curiser."});}
        if(inF.length+outF.length>=6)alerts.push({c:"#F59E0B",t:"Forte connectivit\u00e9 ("+(inF.length+outF.length)+" flux) : impact \u00e9lev\u00e9 en cas de migration ou d'arr\u00eat."});
        if(inF.length+outF.length===0)alerts.push({c:"#F59E0B",t:"Aucun flux document\u00e9 : interfaces \u00e0 v\u00e9rifier."});
        if(fa.endOfService&&eb&&(eb.id==="expired"))alerts.push({c:"#EF4444",t:"Fin de mise en service d\u00e9pass\u00e9e ("+formatDateFr(fa.endOfService)+")."});
        else if(fa.endOfService&&eb&&(eb.id==="lt6"||eb.id==="lt12"))alerts.push({c:"#F59E0B",t:"Fin de mise en service proche ("+formatDateFr(fa.endOfService)+")."});
        if(!fa.owner||!String(fa.owner).trim())alerts.push({c:"#F59E0B",t:"Aucun responsable renseign\u00e9."});
        if(["Legacy","En d\u00e9commissionnement","\u00c0 migrer","\u00c0 refondre","\u00c0 remplacer","\u00c0 d\u00e9commissionner"].includes(fa.statut))alerts.push({c:"#8B5CF6",t:"Statut \u00ab "+fa.statut+" \u00bb : trajectoire \u00e0 planifier."});
        var infos=[["\u00c9diteur",fa.vendor],["Version",fa.version],["Responsable",fa.owner],["Cat\u00e9gorie",fa.category],["Utilisateurs",fa.users],["H\u00e9bergement",fa.hosting],["Type d'application",fa.appType],["Co\u00fbt annuel",typeof fa.budget==="number"&&fa.budget>0?formatEuro(fa.budget):""],["Co\u00fbt mensuel",typeof fa.monthlyCost==="number"&&fa.monthlyCost>0?formatEuro(fa.monthlyCost):""],["Licences",fa.licenses>0?fa.licenses.toLocaleString("fr-FR"):""],["Fin de mise en service",fa.endOfService?formatDateFr(fa.endOfService):""]];
        var badge=function(txt,col){return <span style={{fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:99,background:col+"20",color:col,border:"1px solid "+col+"55"}}>{txt}</span>;};
        var flowRow=function(f,out){var pid=out?f.to:f.from;var peer=apps.find(function(a){return a.id===pid;});return <div key={f.id||(f.from+"-"+f.to)} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 10px",borderRadius:8,background:T.bgAlt,border:"1px solid "+T.border,fontSize:12}}><b style={{color:out?"#06B6D4":"#8B5CF6"}}>{out?"\u2192":"\u2190"}</b><span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:T.fg,fontWeight:600}}>{peer?peer.name:"Inconnue"}</span><span style={{color:T.fgMuted,fontSize:11}}>{f.protocol||f.frequency||""}</span></div>;};
        return <div onClick={function(){setFicheId(null);}} onKeyDown={function(e){if(e.key==="Escape")setFicheId(null);}} ref={function(el){if(el)el.focus();}} tabIndex={-1} style={{position:"fixed",inset:0,zIndex:9950,background:"rgba(8,10,24,0.62)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,outline:"none"}}>
          <div onClick={function(e){e.stopPropagation();}} style={{width:"min(760px,100%)",maxHeight:"92vh",overflowY:"auto",background:T.bgCard,borderRadius:16,border:"1px solid "+T.border,borderTop:"4px solid "+dcol,boxShadow:"0 24px 70px rgba(0,0,0,0.45)",padding:22}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:800,color:dcol,textTransform:"uppercase",letterSpacing:.6}}>{fa.domain||"Domaine non renseign\u00e9"}</div>
                <div style={{fontSize:22,fontWeight:800,color:T.fg,letterSpacing:"-0.02em",marginTop:2,overflowWrap:"anywhere"}}>{fa.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                  {badge(fa.criticality?"Criticit\u00e9 "+fa.criticality:"Criticit\u00e9 non renseign\u00e9e",ccol)}
                  {projectType!=="deal"&&fa.statut&&badge(fa.statut,STATUT_COLORS[fa.statut]||"#888")}
                  {projectType==="deal"&&fa.statusD1&&badge("D1 \u00b7 "+fa.statusD1,SD1[fa.statusD1]||"#888")}
                  {projectType==="deal"&&fa.statusD2&&badge("D2 \u00b7 "+fa.statusD2,SD2[fa.statusD2]||"#888")}
                </div>
              </div>
              <button onClick={function(){setFicheId(null);}} title="Fermer" style={{background:T.bgAlt,border:"1px solid "+T.border,color:T.fgMuted,cursor:"pointer",fontSize:20,lineHeight:1,padding:"4px 10px",borderRadius:8}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
              {[{l:"Utilisateurs",v:fa.users||"\u2014",c:"#8B5CF6"},{l:"Flux entrants",v:inF.length,c:"#8B5CF6"},{l:"Flux sortants",v:outF.length,c:"#06B6D4"}].map(function(m){return <div key={m.l} style={{padding:"12px 10px",borderRadius:10,background:m.c+"12",border:"1px solid "+m.c+"30",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:T.fg,lineHeight:1}}>{m.v}</div><div style={{fontSize:11,color:m.c,fontWeight:700,marginTop:5}}>{m.l}</div></div>;})}
            </div>
            <div style={{marginTop:16,padding:"12px 14px",borderRadius:12,background:alerts.length?"rgba(245,158,11,0.08)":"rgba(16,185,129,0.08)",border:"1px solid "+(alerts.length?"rgba(245,158,11,0.35)":"rgba(16,185,129,0.35)")}}>
              <div style={{fontSize:12,fontWeight:800,color:alerts.length?"#F59E0B":"#10B981",textTransform:"uppercase",letterSpacing:.5,marginBottom:alerts.length?8:0}}>{alerts.length?"Points d'attention ("+alerts.length+")":"Aucun point d'attention d\u00e9tect\u00e9"}</div>
              {alerts.map(function(a,i){return <div key={i} style={{display:"flex",gap:8,fontSize:13,color:T.fg,padding:"3px 0"}}><span style={{color:a.c,fontWeight:800}}>●</span><span>{a.t}</span></div>;})}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8,marginTop:16}}>
              {infos.map(function(r){return <div key={r[0]} style={{padding:"8px 11px",borderRadius:9,background:T.bgAlt,border:"1px solid "+T.border,minWidth:0}}><div style={{fontSize:10,color:T.fgDim,textTransform:"uppercase",letterSpacing:.6,fontWeight:800}}>{r[0]}</div><div style={{fontSize:13,marginTop:3,color:r[1]?T.fg:T.fgFaint,fontWeight:r[1]?650:400,fontStyle:r[1]?"normal":"italic",overflowWrap:"anywhere"}}>{r[1]||"Non renseign\u00e9"}</div></div>;})}
            </div>
            {fa.description&&<div style={{marginTop:14,fontSize:13,color:T.fg,lineHeight:1.55}}>{fa.description}</div>}
            {(inF.length+outF.length>0)&&<div style={{marginTop:16}}>
              <div style={{fontSize:12,fontWeight:800,color:T.fgMuted,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Flux connectés</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:6}}>
                {inF.map(function(f){return flowRow(f,false);})}{outF.map(function(f){return flowRow(f,true);})}
              </div>
            </div>}
            <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}>
              <button onClick={function(){setSelApp(fa);setPanelOpen(true);setFicheId(null);setView("mapping");setTimeout(fitCanvas,50);}} style={{background:T.bgAlt,color:T.fg,border:"1px solid "+T.border,borderRadius:9,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Voir dans la cartographie</button>
              <button onClick={function(){setFicheId(null);}} style={{background:"#6366F1",color:"#fff",border:"none",borderRadius:9,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Fermer</button>
            </div>
          </div>
        </div>;
      }()}
      <style>{".dash-body>*{flex:1 1 auto;min-width:0;box-sizing:border-box}@media (max-width:900px){.dash-cell{grid-column:span 12 !important}}"}</style>
      {ALL_WIDGETS_LIST.every(function(id){return hiddenWidgets.includes(id);})&&<div style={{padding:"60px 20px",textAlign:"center",color:T.fgMuted,fontSize:13,border:"1px dashed "+T.border,borderRadius:14}}>Tous les widgets sont masqués. <button onClick={function(){relayoutWith([]);}} style={{marginLeft:8,background:"#6366F1",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Tout afficher</button></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(12,minmax(0,1fr))",gap:"22px 20px",gridAutoFlow:"row dense",alignItems:"stretch",width:"100%"}}>
      {ALL_WIDGETS_LIST.filter(function(id){return!hiddenWidgets.includes(id);}).map(function(sid){
        if(sid==="chart_apps")return wrapWidget(sid,"#7C4DFF","Apps par domaine",null,function(isExpanded,ww,wh){
          var critMatch=function(a){return!critFilter||(critFilter==="Non renseignée"?!["Haute","Moyenne","Basse"].includes(a.criticality):a.criticality===critFilter);};
          var barData=st.map(function(d){var fa=d.apps.filter(critMatch);return Object.assign({},d,{count:fa.length,apps:fa});}).filter(function(d){return d.count>0;}).sort(function(a,b){return b.count-a.count;});
          var mx2=Math.max.apply(null,barData.map(function(d){return d.count;}))||1;
          var ctype=chartTypes[sid]||"bar";
          var appSlices=barData.map(function(d){return{name:d.domain,value:d.count,color:(DC[d.domain]||DC.Autre).ac};});
          var totalApps=apps.filter(critMatch).length||1;
          var cw=ww||500;var svgW=isExpanded?560:Math.max(160,cw-56);var svgH=isExpanded?300:250;
          if(!barData.length)return <div style={{background:T.bgCard,borderRadius:12,padding:40,textAlign:"center",color:T.fgMuted,fontSize:13,boxShadow:"0 0 0 1px "+T.border}}>Aucune application ne correspond à ce niveau de criticité.</div>;
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
        },<>
          <select value={critFilter} title="Filtrer par criticité" onClick={function(e){e.stopPropagation();}} onChange={function(e){setCritFilter(e.target.value);}}
            style={Object.assign({},WIDGET_SEL_STYLE,critFilter?{border:"1px solid #EF4444",color:"#EF4444",background:"rgba(239,68,68,0.12) "+CHEV+" no-repeat right 7px center"}:{})}>
            <option value="" style={{background:T.bgCard,color:T.fg}}>Toutes criticités</option>
            {["Haute","Moyenne","Basse","Non renseignée"].map(function(c){return <option key={c} value={c} style={{background:T.bgCard,color:T.fg}}>{c}</option>;})}
          </select>
          {mkChartSwitch("chart_apps")}
        </>);
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
          var apps=domApps(sid).filter(function(a){return!ownCrit||(ownCrit==="Non renseign\u00e9e"?!["Haute","Moyenne","Basse"].includes(a.criticality):a.criticality===ownCrit);});
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
          var donutSz=isExpanded?320:Math.min(190,Math.max(110,cw/2.3));
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
              <div style={{flex:1,minWidth:0,maxHeight:isExpanded?360:(isNarrow?130:donutSz),overflowY:"auto",paddingRight:2}}>
                {owSlices.map(function(p,i){return <div key={p.name} style={{display:"flex",alignItems:"center",gap:6,marginBottom:isNarrow?4:7}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0,opacity:p.isNA?0.5:1}}/>
                  <span style={{fontSize:12,color:p.isNA?T.fgMuted:T.fg,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontStyle:p.isNA?"italic":"normal"}}>{p.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:p.color,opacity:p.isNA?0.7:1}}>{p.value}</span>
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
        },<>
          <select value={ownCrit} title="Filtrer par criticité" onClick={function(e){e.stopPropagation();}} onChange={function(e){setOwnCrit(e.target.value);}}
            style={Object.assign({},WIDGET_SEL_STYLE,ownCrit?{border:"1px solid #EF4444",color:"#EF4444",background:"rgba(239,68,68,0.12) "+CHEV+" no-repeat right 7px center"}:{})}>
            <option value="" style={{background:T.bgCard,color:T.fg}}>Toutes criticités</option>
            {["Haute","Moyenne","Basse","Non renseign\u00e9e"].map(function(c){return <option key={c} value={c} style={{background:T.bgCard,color:T.fg}}>{c}</option>;})}
          </select>
          {mkChartSwitch(sid)}
        </>);
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
            selectedFlows=flows.filter(function(flow){return flow.from===selected.app.id||flow.to===selected.app.id;}).filter(function(flow){var peerId=flow.from===selected.app.id?flow.to:flow.from;if(seenPeers[peerId])return false;seenPeers[peerId]=true;return true;}).slice(0,8);
          }
          var cardWidth=ww||500;
          var wide=cardWidth>=680;
          var showPill=wide?cardWidth>=1000:cardWidth>=520;
          var sevPill=function(crit){var c=severityColor[crit]||"#94A3B8";return <span style={{fontSize:12,fontWeight:700,color:c,padding:"3px 11px",borderRadius:99,background:c+"1F",whiteSpace:"nowrap"}}>{crit||"Non définie"}</span>;};
          var selColor=selected?(severityColor[selected.app.criticality]||"#94A3B8"):"#94A3B8";
          return <div className="dashboard-widget-surface" style={{background:T.bgCard,borderRadius:16,padding:20,boxShadow:"0 8px 24px rgba(30,27,75,.07), 0 0 0 1px "+T.border,display:"flex",flexDirection:"column",height:(isExpanded||wh)?"100%":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:40,height:40,borderRadius:12,display:"grid",placeItems:"center",background:"linear-gradient(145deg,#EF44442b,#F9731620)",color:"#EF4444",fontSize:18}}>⚠</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:800,color:T.fg}}>Applications à traiter en priorité</div><div style={{fontSize:12,color:T.fgMuted,marginTop:3}}>Classées par criticité puis par nombre de liaisons directes</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:26,fontWeight:800,color:"#EF4444",lineHeight:1}}>{highCount}</div><div style={{fontSize:12,color:T.fgMuted,marginTop:4}}>critiques / hautes</div></div>
            </div>
            {!top10.length?<div style={{flex:1,display:"grid",placeItems:"center",fontSize:13,color:T.fgMuted,padding:30}}>Aucune application à afficher.</div>:
            <div style={{display:"grid",gridTemplateColumns:wide?"minmax(0,1.6fr) minmax(300px,1fr)":"minmax(0,1fr)",gap:20,flex:1,minHeight:0}}>
              <div style={{minWidth:0,display:"flex",flexDirection:"column",gap:6}}>
                <div style={{display:"grid",gridTemplateColumns:showPill?"34px minmax(0,1fr) 100px 130px":"34px minmax(0,1fr) 110px",gap:10,padding:"0 12px 4px",fontSize:11,fontWeight:700,color:T.fgMuted,textTransform:"uppercase",letterSpacing:.5}}>
                  <span>#</span><span>Application</span>{showPill&&<span>Criticité</span>}<span>Flux</span>
                </div>
                <div className="critical-apps-list" style={{display:"grid",gap:6,maxHeight:isExpanded?undefined:600,overflowY:"auto"}}>
                  {top10.map(function(item,index){
                    var on=selected&&selected.app.id===item.app.id;
                    var color=severityColor[item.app.criticality]||"#94A3B8";
                    var barPct=Math.round(item.degree/maxDegree*100);
                    return <button key={item.app.id} className="critical-app-row" aria-pressed={on} onClick={function(){setSelectedCriticalApp(item.app.id);}} style={{width:"100%",display:"grid",gridTemplateColumns:showPill?"34px minmax(0,1fr) 100px 130px":"34px minmax(0,1fr) 110px",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:"1px solid "+(on?color+"88":T.border),borderLeft:"4px solid "+color,background:on?color+"12":T.bgAlt,color:T.fg,textAlign:"left",cursor:"pointer"}}>
                      <span style={{width:26,height:26,borderRadius:8,display:"grid",placeItems:"center",background:on?color+"28":T.bgCard,color:on?color:T.fgMuted,fontSize:12,fontWeight:800}}>{index+1}</span>
                      <span style={{minWidth:0}}>
                        <span style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:14,fontWeight:700}}>{item.app.name||"Application sans nom"}</span>
                        <span style={{display:"flex",alignItems:"center",gap:6,marginTop:3,fontSize:12,color:T.fgMuted}}>
                          <span style={{width:8,height:8,borderRadius:3,background:(DC[item.app.domain]||DC.Autre).ac,flexShrink:0}}/>
                          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.app.domain||"Domaine non renseigné"}</span>
                          {!showPill&&<span style={{color:color,fontWeight:700}}>· {item.app.criticality||"?"}</span>}
                        </span>
                      </span>
                      {showPill&&<span>{sevPill(item.app.criticality)}</span>}
                      <span style={{minWidth:0}}>
                        <span style={{display:"flex",alignItems:"baseline",gap:8}}><b style={{fontSize:16}}>{item.degree}</b><span style={{fontSize:12,color:T.fgMuted}}>↓{item.incoming} ↑{item.outgoing}</span></span>
                        <span className="dashboard-meter-track" style={{display:"block",height:6,marginTop:5}}><span style={{width:barPct+"%",background:"linear-gradient(90deg,"+color+"88,"+color+")"}}/></span>
                      </span>
                    </button>;
                  })}
                </div>
              </div>
              {selected&&<div className="critical-app-detail" style={{minWidth:0,alignSelf:"start",padding:16,borderRadius:14,background:selColor+"0D",border:"1px solid "+selColor+"33",display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
                  <div style={{minWidth:0}}><div style={{fontSize:16,fontWeight:800,color:T.fg,overflow:"hidden",textOverflow:"ellipsis"}}>{selected.app.name}</div><div style={{fontSize:12,color:T.fgMuted,marginTop:3}}>{selected.app.domain||"Domaine non renseigné"}</div></div>
                  {sevPill(selected.app.criticality)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {[{l:"Entrants",v:selected.incoming,c:"#8B5CF6"},{l:"Sortants",v:selected.outgoing,c:"#06B6D4"},{l:"Total",v:selected.degree,c:selColor}].map(function(m){return <div key={m.l} style={{padding:"10px 8px",borderRadius:10,background:T.bgCard,border:"1px solid "+T.border,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:m.c,lineHeight:1}}>{m.v}</div><div style={{fontSize:11.5,color:T.fgMuted,marginTop:5}}>{m.l}</div></div>;})}
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:T.fgMuted,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Liaisons directes</div>
                  {selectedFlows.length?<div style={{display:"grid",gap:6}}>{selectedFlows.map(function(flow,index){var isOutbound=flow.from===selected.app.id;var peer=apps.find(function(app){return app.id===(isOutbound?flow.to:flow.from);});var dc=isOutbound?"#06B6D4":"#8B5CF6";return <div key={flow.id||index} style={{display:"grid",gridTemplateColumns:"88px minmax(0,1fr) auto",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,background:T.bgCard,border:"1px solid "+T.border}}>
                    <span style={{fontSize:12,fontWeight:700,color:dc}}>{isOutbound?"→ Sortant":"← Entrant"}</span>
                    <span style={{fontSize:13,color:T.fg,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{peer?peer.name:"Application inconnue"}</span>
                    <span style={{fontSize:11.5,color:T.fgMuted,whiteSpace:"nowrap"}}>{flow.protocol||flow.frequency||"Interface"}</span>
                  </div>;})}</div>:<div style={{fontSize:13,color:T.fgMuted}}>Aucune liaison directe enregistrée.</div>}
                </div>
                <button onClick={function(){setFicheId(selected.app.id);}} style={{background:selColor,color:"#fff",border:"none",borderRadius:10,padding:"9px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Ouvrir la fiche</button>
              </div>}
            </div>}
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
        if(sid==="flowreg")return wrapWidget(sid,"#2979FF","Registre des flux",null,<div style={{background:T.bgCard,borderRadius:16,padding:20,boxShadow:"0 8px 24px rgba(30,27,75,.07), 0 0 0 1px "+T.border}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><div style={{width:40,height:40,borderRadius:12,display:"grid",placeItems:"center",background:"#2979FF1F",color:"#2979FF",fontSize:18}}>⇄</div><div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:T.fg}}>Registre des échanges de flux</div><div style={{fontSize:12,color:T.fgMuted,marginTop:3}}>Toutes les interconnexions entre applications · cliquez une ligne pour le détail</div></div><div style={{textAlign:"right"}}><div style={{fontSize:26,fontWeight:800,color:"#2979FF",lineHeight:1}}>{flows.length}</div><div style={{fontSize:12,color:T.fgMuted,marginTop:4}}>flux</div></div></div>
          {function(){
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
          var selSt={background:T.bgInput,border:"1px solid "+T.border,borderRadius:8,padding:"7px 9px",color:T.fg,fontSize:12.5,cursor:"pointer",width:"100%"};
          var selAct=Object.assign({},selSt,{borderColor:"#2979FF",background:"#2979FF10"});
          var clearAll=function(){setFlxSearch("");setFSrcApp("");setFSrcDom("");setFTgtApp("");setFTgtDom("");setFProto("");setFFreq("");setFDesc("");};
          return <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {/* Panneau latéral de filtres */}
            {showFlxFilter&&<div style={{background:T.bgAlt,borderRadius:12,padding:14,marginBottom:14,border:"1px solid "+T.border}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:14,fontWeight:700,color:T.fg}}>Filtres</span>
                {activeFilterCount>0&&<button onClick={clearAll} style={{background:"#FF525215",color:"#FF5252",border:"none",borderRadius:4,padding:"2px 6px",fontSize:9,cursor:"pointer"}}>Effacer ({activeFilterCount})</button>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
                <div><div style={{fontSize:11,color:T.fgMuted,marginBottom:4,textTransform:"uppercase",fontWeight:700}}>Application source</div><select value={fSrcApp} onChange={function(e){setFSrcApp(e.target.value);}} style={fSrcApp?selAct:selSt}><option value="">Toutes</option>{uSrcApp.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:11,color:T.fgMuted,marginBottom:4,textTransform:"uppercase",fontWeight:700}}>Domaine source</div><select value={fSrcDom} onChange={function(e){setFSrcDom(e.target.value);}} style={fSrcDom?selAct:selSt}><option value="">Tous</option>{uSrcDom.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:11,color:T.fgMuted,marginBottom:4,textTransform:"uppercase",fontWeight:700}}>Application cible</div><select value={fTgtApp} onChange={function(e){setFTgtApp(e.target.value);}} style={fTgtApp?selAct:selSt}><option value="">Toutes</option>{uTgtApp.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:11,color:T.fgMuted,marginBottom:4,textTransform:"uppercase",fontWeight:700}}>Domaine cible</div><select value={fTgtDom} onChange={function(e){setFTgtDom(e.target.value);}} style={fTgtDom?selAct:selSt}><option value="">Tous</option>{uTgtDom.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:11,color:T.fgMuted,marginBottom:4,textTransform:"uppercase",fontWeight:700}}>Protocole</div><select value={fProto} onChange={function(e){setFProto(e.target.value);}} style={fProto?selAct:selSt}><option value="">Tous</option>{uProto.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:11,color:T.fgMuted,marginBottom:4,textTransform:"uppercase",fontWeight:700}}>Fréquence</div><select value={fFreq} onChange={function(e){setFFreq(e.target.value);}} style={fFreq?selAct:selSt}><option value="">Toutes</option>{uFreq.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
                <div><div style={{fontSize:11,color:T.fgMuted,marginBottom:4,textTransform:"uppercase",fontWeight:700}}>Description</div><select value={fDesc} onChange={function(e){setFDesc(e.target.value);}} style={fDesc?selAct:selSt}><option value="">Toutes</option>{uDesc.map(function(v){return <option key={v} value={v}>{v}</option>;})}</select></div>
              </div>
            </div>}
            <div style={{flex:1,minWidth:0}}>
            {function(){
              var pc={};enriched.forEach(function(e){if(e.proto)pc[e.proto]=(pc[e.proto]||0)+1;});
              var topP=Object.keys(pc).sort(function(x,y){return pc[y]-pc[x];})[0];
              var involved={};enriched.forEach(function(e){involved[e.srcName]=1;involved[e.tgtName]=1;});
              var kp=[{l:"Flux affich\u00e9s",v:filtered2.length+" / "+enriched.length,c:"#2979FF"},{l:"Applications connect\u00e9es",v:Object.keys(involved).length,c:"#8B5CF6"},{l:"Protocoles distincts",v:uProto.length,c:"#06B6D4"},{l:"Protocole dominant",v:topP||"\u2014",c:"#10B981",h:topP?pc[topP]+" flux":""}];
              return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
                {kp.map(function(k){return <div key={k.l} style={{padding:"11px 14px",borderRadius:12,background:k.c+"12",border:"1px solid "+k.c+"30",borderLeft:"4px solid "+k.c,minWidth:0}}>
                  <div style={{fontSize:11,color:T.fgMuted,fontWeight:700}}>{k.l}</div>
                  <div style={{fontSize:22,fontWeight:850,color:T.fg,marginTop:5,lineHeight:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k.v}</div>
                  {k.h&&<div style={{fontSize:11,color:T.fgMuted,marginTop:5}}>{k.h}</div>}
                </div>;})}
              </div>;
            }()}
            <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
              <input placeholder="Rechercher..." value={flxSearch} onChange={function(e){setFlxSearch(e.target.value);}} style={{...I,width:280,maxWidth:"100%",padding:"9px 13px",fontSize:13,borderRadius:10}}/>
              <button onClick={function(){setShowFlxFilter(function(p){return !p;});}} style={{background:showFlxFilter?"#2979FF20":T.bgAlt,color:showFlxFilter?"#2979FF":T.fg,border:"1px solid "+(showFlxFilter?"#2979FF":T.border),borderRadius:9,padding:"9px 14px",fontSize:12.5,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                {"⊟ Filtres"}{activeFilterCount>0&&<span style={{background:"#2979FF",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{activeFilterCount}</span>}
              </button>
              <span style={{fontSize:13,color:T.fgMuted}}>{filtered2.length}/{flows.length} flux</span>
              {hasFilter&&!showFlxFilter&&<button onClick={clearAll} style={{background:"#FF525215",color:"#FF5252",border:"none",borderRadius:4,padding:"3px 8px",fontSize:9,cursor:"pointer"}}>Effacer filtres</button>}
              <button onClick={function(){
                var cols=["ID","Source","Domaine source","Cible","Domaine cible","Protocole","Fréquence","Description"];
                var rows=filtered2.map(function(e){return["F-"+(e.f.order||e.fi+1),e.srcName,e.srcDom,e.tgtName,e.tgtDom,e.proto,e.freq,e.desc].map(function(v){return '"'+(v||"").replace(/"/g,'""')+'"';}).join(",");});
                var csv=[cols.join(",")].concat(rows).join("\n");
                var a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download="flux_export.csv";a.click();
              }} style={{background:T.bgAlt,color:T.fg,border:"1px solid "+T.border,borderRadius:9,padding:"9px 14px",fontSize:12.5,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
                ⬇ CSV
              </button>
            </div>
            {function(){
              var protoCount={};enriched.forEach(function(e){if(e.proto)protoCount[e.proto]=(protoCount[e.proto]||0)+1;});
              var protoList=Object.keys(protoCount).sort(function(x,y){return protoCount[y]-protoCount[x];}).slice(0,8);
              var cols="48px minmax(100px,1fr) minmax(96px,0.7fr) minmax(100px,1fr) 96px minmax(100px,1fr)";
              var hd={fontSize:11,color:T.fgMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5};
              var chip=function(active,col){return {background:active?col+"25":T.bgAlt,color:active?col:T.fgMuted,border:"1px solid "+(active?col:T.border),borderRadius:14,padding:"5px 13px",fontSize:12.5,fontWeight:600,cursor:"pointer"};};
              var openApp=function(name,ev){ev.stopPropagation();var ap=apps.find(function(a){return a.name===name;});if(ap)setFicheId(ap.id);};
              var domPill=function(dom,isSrc){var ac=(DC[dom]||DC.Autre).ac;var on=(isSrc?fSrcDom:fTgtDom)===dom;return <span title={"Filtrer : domaine "+dom} onClick={function(ev){ev.stopPropagation();if(isSrc)setFSrcDom(on?"":dom);else setFTgtDom(on?"":dom);}} style={{display:"inline-block",fontSize:11,fontWeight:700,color:ac,background:ac+(on?"40":"18"),border:"1px solid "+ac+(on?"":"40"),borderRadius:10,padding:"2px 9px",cursor:"pointer",whiteSpace:"nowrap"}}>{dom}</span>;};
              return <div>
                {protoList.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
                  <span style={{fontSize:11,color:T.fgMuted,fontWeight:700,textTransform:"uppercase"}}>Protocole</span>
                  {protoList.map(function(pr){return <span key={pr} onClick={function(){setFProto(fProto===pr?"":pr);}} style={chip(fProto===pr,"#2979FF")}>{pr} <b style={{opacity:0.7}}>{protoCount[pr]}</b></span>;})}
                </div>}
                {function(){
                  var dirv=flowSort.dir;
                  var keyOf={id:function(e){return e.f.order||e.fi+1;},src:function(e){return e.srcName.toLowerCase();},proto:function(e){return e.proto.toLowerCase();},tgt:function(e){return e.tgtName.toLowerCase();},freq:function(e){return e.freq.toLowerCase();},desc:function(e){return e.desc.toLowerCase();}}[flowSort.k];
                  var rowsS=filtered2.slice().sort(function(x,y){var kx=keyOf(x),ky=keyOf(y);return(kx<ky?-1:kx>ky?1:0)*dirv;});
                  var th=function(k,label,align){var on=flowSort.k===k;return <span onClick={function(){setFlowSort(on?{k:k,dir:-flowSort.dir}:{k:k,dir:1});}} style={Object.assign({},hd,{cursor:"pointer",userSelect:"none",textAlign:align||"left",color:on?"#2979FF":T.fgMuted,display:"flex",alignItems:"center",gap:4,justifyContent:align==="center"?"center":(align==="right"?"flex-end":"flex-start")})}>{label}<span style={{fontSize:9,opacity:on?1:0.35}}>{on?(flowSort.dir>0?"\u25b2":"\u25bc"):"\u21c5"}</span></span>;};
                  var appCell=function(name,dom,ac,isSrc){var bar=<span style={{width:4,alignSelf:"stretch",minHeight:30,borderRadius:3,background:ac,flexShrink:0}}/>;
                    return <div style={{minWidth:0,display:"flex",alignItems:"center",gap:9,justifyContent:isSrc?"flex-end":"flex-start",textAlign:isSrc?"right":"left"}}>
                    {!isSrc&&bar}
                    <div style={{minWidth:0}}><div style={{fontWeight:700,color:T.fg,fontSize:13.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={name}>{name}</div><div style={{marginTop:3}}>{domPill(dom,isSrc)}</div></div>
                    {isSrc&&bar}
                  </div>;};
                  return <div style={{border:"1px solid "+T.border,borderRadius:12,overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}><div style={{minWidth:620}}>
                    <div style={{display:"grid",gridTemplateColumns:cols,gap:10,padding:"11px 14px",background:T.bgAlt,borderBottom:"1px solid "+T.border}}>
                      {th("id","ID")}{th("src","Source","right")}{th("proto","Protocole","center")}{th("tgt","Cible")}{th("freq","Fr\u00e9quence")}{th("desc","Description")}
                    </div>
                    <div style={{maxHeight:640,overflowY:"auto"}}>
                      {rowsS.length===0&&<div style={{padding:28,textAlign:"center",color:T.fgMuted,fontSize:13}}>Aucun flux ne correspond aux filtres.{hasFilter&&<span> <a onClick={clearAll} style={{color:"#2979FF",cursor:"pointer"}}>Effacer les filtres</a></span>}</div>}
                      {rowsS.map(function(e,ri){
                        var faAc=(DC[e.srcDom]||DC.Autre).ac;var taAc=(DC[e.tgtDom]||DC.Autre).ac;
                        var open=expFlow===e.f.id;
                        var zebra=ri%2?T.bgAlt+"66":"transparent";
                        return <div key={e.f.id} style={{borderBottom:"1px solid "+T.borderLight,background:open?T.bgAlt:zebra}}>
                          <div onClick={function(){setExpFlow(open?null:e.f.id);}} onMouseEnter={function(ev){if(!open)ev.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(ev){ev.currentTarget.style.background="transparent";}}
                            style={{display:"grid",gridTemplateColumns:cols,gap:10,padding:"12px 14px",alignItems:"center",cursor:"pointer"}}>
                            <span style={{color:T.fgMuted,fontSize:12,fontFamily:"monospace",fontWeight:700}}>{"F-"+(e.f.order||e.fi+1)}</span>
                            {appCell(e.srcName,e.srcDom,faAc,true)}
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                              <span style={{background:faAc+"20",color:faAc,padding:"3px 10px",borderRadius:10,fontSize:11.5,fontWeight:700,maxWidth:124,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.proto||"Non pr\u00e9cis\u00e9"}</span>
                              <div style={{display:"flex",alignItems:"center",width:"100%"}}><div style={{flex:1,height:2,background:"linear-gradient(90deg,"+faAc+","+taAc+")",borderRadius:1}}/><span style={{color:taAc,fontSize:10,lineHeight:1,marginLeft:-2}}>▶</span></div>
                            </div>
                            {appCell(e.tgtName,e.tgtDom,taAc,false)}
                            <span style={{minWidth:0}}>{e.freq?<span style={{fontSize:11.5,fontWeight:700,color:T.fg,background:T.bgAlt,border:"1px solid "+T.border,borderRadius:99,padding:"3px 10px",whiteSpace:"nowrap"}}>{e.freq}</span>:<span style={{color:T.fgFaint}}>—</span>}</span>
                            <span style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}><span style={{flex:1,minWidth:0,fontSize:12.5,color:e.desc?T.fg:T.fgFaint,fontStyle:e.desc?"normal":"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={e.desc}>{e.desc||"Non renseign\u00e9e"}</span><span style={{color:T.fgDim,fontSize:9,transform:open?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span></span>
                          </div>
                          {open&&<div style={{padding:"4px 16px 16px 76px",display:"flex",flexDirection:"column",gap:10}}>
                            <div style={{fontSize:13.5,color:T.fg,lineHeight:1.55}}>{e.desc||<span style={{color:T.fgMuted}}>Aucune description renseignée.</span>}</div>
                            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                              <span style={{fontSize:12.5,color:T.fgMuted}}>Protocole : <b style={{color:T.fg}}>{e.proto||"Non pr\u00e9cis\u00e9"}</b></span>
                              <span style={{fontSize:12.5,color:T.fgMuted}}>· Fréquence : <b style={{color:T.fg}}>{e.freq||"\u2014"}</b></span>
                              <span style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
                                <button onClick={function(ev){openApp(e.srcName,ev);}} style={{background:faAc+"20",color:faAc,border:"1px solid "+faAc+"55",borderRadius:8,padding:"7px 13px",fontSize:12.5,fontWeight:600,cursor:"pointer"}}>Ouvrir {e.srcName}</button>
                                <button onClick={function(ev){openApp(e.tgtName,ev);}} style={{background:taAc+"20",color:taAc,border:"1px solid "+taAc+"55",borderRadius:8,padding:"7px 13px",fontSize:12.5,fontWeight:600,cursor:"pointer"}}>Ouvrir {e.tgtName}</button>
                              </span>
                            </div>
                          </div>}
                        </div>;
                      })}
                    </div>
                  </div></div>
                  </div>;
                }()}
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
        <button onClick={function(){setActiveDomFilter("");setView("urbanisme");}} style={{...B,background:"#F59E0B",padding:"6px 14px",fontSize:11,fontWeight:600,borderRadius:8,display:"flex",alignItems:"center",gap:5}}><span>&#8592;</span> Paysage</button>
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
        <div style={{fontSize:15,fontWeight:800,color:T.fg,letterSpacing:"-0.02em",lineHeight:1}}>Paysage SI</div>
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
          {/* Hero + KPI */}
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:24,flexWrap:"wrap",marginBottom:24}}>
            <div style={{minWidth:0}}><div style={{fontSize:11,fontWeight:800,letterSpacing:".14em",textTransform:"uppercase",color:"#818cf8",marginBottom:10}}>Paysage applicatif</div><h1 style={{fontSize:"clamp(26px,3.2vw,38px)",lineHeight:1.08,letterSpacing:"-.04em",fontWeight:850,color:T.fg,margin:0}}>Explorez votre SI <span style={{background:"linear-gradient(90deg,#818cf8,#22d3ee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>par domaine</span></h1><p style={{fontSize:14,color:urbMuted,margin:"10px 0 0",maxWidth:560,lineHeight:1.6}}>Cliquez sur un domaine pour découvrir ses applications, ses connexions et le détail de chaque flux.</p></div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[["Domaines",allDoms2.length,"#818cf8"],["Applications",apps.length,"#22d3ee"],["Flux",flows.length,"#34d399"],["Critiques",criticalApps.length,"#fb7185"]].map(function(k){return <div key={k[0]} style={{minWidth:108,padding:"12px 16px",borderRadius:14,background:urbDark?"rgba(15,23,42,.6)":"#fff",border:"1px solid "+urbLine,boxShadow:urbDark?"none":"0 6px 16px rgba(51,65,85,.05)",borderTop:"3px solid "+k[2]}}><div style={{fontSize:26,fontWeight:850,lineHeight:1,color:T.fg,fontVariantNumeric:"tabular-nums"}}>{k[1]}</div><div style={{fontSize:11,color:urbMuted,marginTop:7,fontWeight:600}}>{k[0]}</div></div>;})}
            </div>
          </div>
          {/* Toolbar */}
          {(function(){
            var q=urbSearch.trim().toLowerCase();
            var shown=urbDomains.filter(function(d){return !q||d.name.toLowerCase().indexOf(q)>=0||apps.some(function(a){return a.domain===d.name&&(a.name||"").toLowerCase().indexOf(q)>=0;});}).sort(function(a,b){return urbSort==="name"?a.name.localeCompare(b.name):urbSort==="critical"?(b.critical-a.critical)||(b.apps-a.apps):urbSort==="flows"?(b.flows-a.flows)||(b.apps-a.apps):(b.apps-a.apps);});
            var sorts=[["apps","Taille"],["flows","Flux"],["critical","Criticité"],["name","A–Z"]];
            return <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flex:"1 1 260px",maxWidth:380,padding:"0 12px",height:38,borderRadius:11,background:urbDark?"rgba(15,23,42,.6)":"#fff",border:"1px solid "+urbLine}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={urbMuted} strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
              <input value={urbSearch} onChange={function(e){setUrbSearch(e.target.value);}} placeholder="Rechercher un domaine ou une application…" style={{flex:1,minWidth:0,border:"none",outline:"none",background:"transparent",color:T.fg,fontSize:13}}/>
              {urbSearch&&<span onClick={function(){setUrbSearch("");}} style={{cursor:"pointer",color:urbMuted,fontSize:13}}>✕</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,color:urbMuted,marginRight:4}}>Trier par</span>
              {sorts.map(function(o){var on=urbSort===o[0];return <button key={o[0]} onClick={function(){setUrbSort(o[0]);}} style={{height:32,padding:"0 13px",borderRadius:99,fontSize:12,fontWeight:700,cursor:"pointer",border:"1px solid "+(on?"#818cf8":urbLine),background:on?"rgba(129,140,248,.16)":"transparent",color:on?(urbDark?"#c7d2fe":"#4f46e5"):urbMuted}}>{o[1]}</button>;})}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,300px),1fr))",gap:16}}>
            {shown.map(function(dom,di){
              var dc=(DC[dom.name]||DC.Autre);var domApps=apps.filter(function(a){return a.domain===dom.name;});
              var rankedApps=domApps.map(function(app){return{app:app,flowCount:flows.filter(function(f){return f.from===app.id||f.to===app.id;}).length};}).sort(function(a,b){var rank={Haute:3,Moyenne:2,Basse:1};return (rank[b.app.criticality]||0)-(rank[a.app.criticality]||0)||b.flowCount-a.flowCount;});
              var hot=dom.critical;
              var out=allDoms2.reduce(function(n,d){return n+(domFlowCounts[dom.name+">>"+d]||0);},0);
              var into=allDoms2.reduce(function(n,d){return n+(domFlowCounts[d+">>"+dom.name]||0);},0);
              var local=intraCounts[dom.name]||0;
              var flowTotal=out+into+local;
              var topPartner=interDomLinks.filter(function(link){return link.d1===dom.name||link.d2===dom.name;}).sort(function(a,b){return b.cnt-a.cnt;})[0]||null;
              var partnerName=topPartner?(topPartner.d1===dom.name?topPartner.d2:topPartner.d1):"";
              var open=function(){setUrbZone(dom.name);setUrbSelApp(null);setUrbFlowPair(null);setUrbExpanded(false);};
              var stat=function(label,val,col){return <div style={{flex:1,textAlign:"center",padding:"9px 4px",borderRadius:10,background:urbDark?"rgba(148,163,184,.06)":"#f6f8fc"}}><div style={{fontSize:20,fontWeight:850,lineHeight:1,color:col||T.fg,fontVariantNumeric:"tabular-nums"}}>{val}</div><div style={{fontSize:11,color:urbMuted,marginTop:5}}>{label}</div></div>;};
              return <div key={dom.name} role="button" tabIndex={0} onClick={open} onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}}}
                style={{...urbPanel,position:"relative",overflow:"hidden",padding:"18px 18px 16px",cursor:"pointer",borderTopWidth:4,borderTopColor:dc.ac,transition:"transform .22s cubic-bezier(.2,.8,.2,1),border-color .2s,box-shadow .2s",animation:"cardIn .3s cubic-bezier(.16,1,.3,1) both",animationDelay:Math.min(di,10)*.03+"s"}}
                onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 18px 38px "+dc.ac+"26";}}
                onMouseLeave={function(e){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=urbPanel.boxShadow;}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0}}><span style={{width:38,height:38,borderRadius:12,display:"grid",placeItems:"center",background:dc.ac+"22",color:dc.ac,fontSize:17,fontWeight:800,flexShrink:0}}>◈</span><div style={{fontSize:17,fontWeight:800,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dom.name}</div></div>
                  <span style={{fontSize:12,fontWeight:700,color:dc.ac,whiteSpace:"nowrap"}}>Explorer →</span>
                </div>
                <div style={{display:"flex",gap:8,marginTop:16}}>{stat("applications",dom.apps)}{stat("flux",flowTotal)}{stat("critiques",hot,hot?"#fb7185":null)}</div>
                <div style={{marginTop:16}}>
                  <div style={{height:8,display:"flex",overflow:"hidden",borderRadius:99,background:urbDark?"rgba(148,163,184,.12)":"#e9edf5"}}><div title={out+" sortants"} style={{width:(flowTotal?out/flowTotal*100:0)+"%",background:"#34d399"}}/><div title={into+" entrants"} style={{width:(flowTotal?into/flowTotal*100:0)+"%",background:"#818cf8"}}/><div title={local+" internes"} style={{width:(flowTotal?local/flowTotal*100:0)+"%",background:dc.ac}}/></div>
                  <div style={{display:"flex",justifyContent:"space-between",gap:6,marginTop:8,fontSize:11,color:urbMuted}}><span><i style={{display:"inline-block",width:7,height:7,borderRadius:9,background:"#34d399",marginRight:5}}/>{out} sortants</span><span><i style={{display:"inline-block",width:7,height:7,borderRadius:9,background:"#818cf8",marginRight:5}}/>{into} entrants</span><span><i style={{display:"inline-block",width:7,height:7,borderRadius:9,background:dc.ac,marginRight:5}}/>{local} internes</span></div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:14}}>{rankedApps.slice(0,4).map(function(item){var cc=item.app.criticality==="Haute"?"#fb7185":item.app.criticality==="Moyenne"?"#fbbf24":"#34d399";return <span key={item.app.id} title={item.app.name+" · "+item.flowCount+" flux"} style={{display:"inline-flex",alignItems:"center",gap:6,maxWidth:"100%",fontSize:12,color:T.fg,border:"1px solid "+urbLine,background:urbDark?"rgba(15,23,42,.55)":"#fff",borderRadius:8,padding:"4px 9px"}}><span style={{width:6,height:6,borderRadius:99,background:cc,flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.app.name}</span></span>;})}{rankedApps.length>4&&<span style={{fontSize:12,color:urbMuted,padding:"4px 4px"}}>+{rankedApps.length-4}</span>}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginTop:14,paddingTop:12,borderTop:"1px solid "+urbLine,fontSize:12}}>{topPartner?<><span style={{color:urbMuted}}>Lien principal</span><span style={{minWidth:0,flex:1,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:750,color:(DC[partnerName]||DC.Autre).ac}}>{partnerName}</span><span style={{fontSize:11,fontWeight:700,color:T.fg,background:urbDark?"rgba(148,163,184,.12)":"#f1f5f9",padding:"3px 8px",borderRadius:7}}>{topPartner.cnt}</span></>:<span style={{color:urbMuted}}>Aucune connexion inter-domaine</span>}</div>
              </div>;
            })}
            {shown.length===0&&<div style={{...urbPanel,gridColumn:"1 / -1",padding:40,textAlign:"center",color:urbMuted,fontSize:14}}>{urbDomains.length===0?"Aucun domaine à afficher. Ajoutez des applications à la cartographie.":"Aucun résultat pour « "+urbSearch+" »"}</div>}
          </div>
            </>;
          })()}
          {interDomLinks.length>0&&<div style={{...urbPanel,marginTop:28,overflow:"hidden"}}>
            <div style={{padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid "+urbLine}}><div><div style={{fontSize:15,fontWeight:800,color:T.fg}}>Connexions entre domaines</div><div style={{fontSize:12,color:urbMuted,marginTop:4}}>Les principaux ponts de votre architecture · cliquez pour ouvrir le domaine émetteur</div></div><span style={{fontSize:12,fontWeight:700,color:"#22d3ee",background:"rgba(34,211,238,.1)",padding:"5px 11px",borderRadius:99}}>{interDomLinks.length} liaisons</span></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,340px),1fr))"}}>{interDomLinks.slice(0,8).map(function(link,i){var c1=(DC[link.d1]||DC.Autre).ac;var c2=(DC[link.d2]||DC.Autre).ac;var maxC=interDomLinks[0].cnt||1;return <div key={i} onClick={function(){setUrbZone(link.d1);setUrbSelApp(null);setUrbFlowPair(null);}} style={{padding:"14px 22px",cursor:"pointer",borderRight:"1px solid "+urbLine,borderBottom:"1px solid "+urbLine,transition:"background .15s"}} onMouseEnter={function(e){e.currentTarget.style.background=urbDark?"rgba(148,163,184,.06)":"#f8fafc";}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
              <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 24px minmax(0,1fr) 40px",alignItems:"center",columnGap:8}}>
                <span style={{display:"flex",alignItems:"center",gap:7,minWidth:0,fontSize:13,fontWeight:750,color:T.fg}}><span style={{width:8,height:8,borderRadius:99,background:c1,flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link.d1}</span></span>
                <span style={{textAlign:"center",fontSize:14,color:urbMuted}}>→</span>
                <span style={{display:"flex",alignItems:"center",gap:7,minWidth:0,fontSize:13,fontWeight:750,color:T.fg}}><span style={{width:8,height:8,borderRadius:99,background:c2,flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link.d2}</span></span>
                <span style={{justifySelf:"end",fontSize:12,fontWeight:800,color:T.fg,background:urbDark?"rgba(148,163,184,.12)":"#f1f5f9",padding:"3px 8px",borderRadius:7,fontVariantNumeric:"tabular-nums"}}>{link.cnt}</span>
              </div>
              <div style={{height:4,borderRadius:99,marginTop:10,background:urbDark?"rgba(148,163,184,.12)":"#e9edf5",overflow:"hidden"}}><div style={{width:Math.max(6,link.cnt/maxC*100)+"%",height:"100%",borderRadius:99,background:"linear-gradient(90deg,"+c1+","+c2+")"}}/></div>
            </div>;})}</div>
          </div>}
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
  var urbPanel={background:urbDark?"#10131f":"#FBFCFF",border:"1px solid "+urbLine,borderRadius:18,boxShadow:urbDark?"0 18px 50px rgba(0,0,0,0.2)":"0 14px 34px rgba(51,65,85,0.08)"};
  var zoneHigh=zoneApps.filter(function(a){return a.criticality==="Haute";}).length;
  var pairGrid="minmax(0,1fr) 30px minmax(0,1fr) 46px";

  return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg,minWidth:0}}>
    <UrbTopbar/>
    <div style={{flex:1,overflowY:"auto",padding:"clamp(18px,3vw,34px) clamp(16px,3vw,42px) 48px",background:urbDark?"radial-gradient(ellipse at 82% 0%, rgba(99,102,241,.09), transparent 38%), "+T.bg:"radial-gradient(ellipse at 12% 0%, rgba(99,102,241,.075), transparent 38%), radial-gradient(ellipse at 92% 78%, rgba(14,165,233,.045), transparent 34%), "+T.bg}}>
      <div style={{maxWidth:urbExpanded?1500:1240,margin:"0 auto",transition:"max-width 0.25s ease"}}>

        {/* Zone header */}
        <div style={{position:"relative",overflow:"hidden",borderRadius:18,marginBottom:17,padding:"23px clamp(18px,3vw,30px)",background:urbDark?"linear-gradient(112deg,"+zoneCC.ac+"35, #10131f 70%)":"linear-gradient(112deg,"+zoneCC.ac+"22, #FBFCFF 72%)",border:"1px solid "+zoneCC.ac+(urbDark?"45":"55"),boxShadow:urbDark?"0 18px 46px "+zoneCC.ac+"12":"0 16px 38px rgba(30,41,59,.08), 0 0 0 1px "+zoneCC.ac+"0A",animation:"cardIn .25s cubic-bezier(.16,1,.3,1)"}}>
          <div style={{position:"absolute",width:220,height:220,right:-85,top:-118,borderRadius:"50%",background:"radial-gradient(circle,"+zoneCC.ac+"35,transparent 70%)",pointerEvents:"none"}}/>
          <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
            <div style={{minWidth:0}}><div style={{fontSize:11,fontWeight:800,letterSpacing:".14em",textTransform:"uppercase",color:zoneCC.ac,marginBottom:8}}>Domaine métier</div><div style={{fontSize:"clamp(26px,3vw,36px)",fontWeight:850,letterSpacing:"-.04em",color:T.fg,lineHeight:1.05}}>{urbZone}</div></div>
            <div style={{display:"flex",gap:10,alignItems:"stretch",flexWrap:"wrap"}}>
              {[["Applications",zoneApps.length,T.fg],["Flux associés",zoneFlowsOut.length+zoneFlowsIn.length,T.fg],["Connexions",pairList.length,T.fg],["Criticité haute",zoneHigh,zoneHigh>0?"#fb7185":T.fg]].map(function(k){return <div key={k[0]} style={{minWidth:104,padding:"10px 14px",borderRadius:12,background:urbDark?"rgba(2,6,23,.35)":"rgba(255,255,255,.78)",border:"1px solid "+urbLine,textAlign:"center"}}><div style={{fontSize:22,fontWeight:850,color:k[2],lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{k[1]}</div><div style={{fontSize:10,color:urbMuted,marginTop:6,fontWeight:600,whiteSpace:"nowrap"}}>{k[0]}</div></div>;})}
              <button onClick={function(e){e.stopPropagation();setUrbExpanded(function(p){return !p;});}} title={urbExpanded?"Réduire la largeur":"Élargir la largeur"} style={{alignSelf:"center",background:urbDark?"rgba(148,163,184,.12)":"#fff",border:"1px solid "+urbLine,color:T.fg,borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{urbExpanded?<><polyline points="15 18 9 12 15 6"/><polyline points="9 18 3 12 9 6"/></>:<><polyline points="9 6 15 12 9 18"/><polyline points="15 6 21 12 15 18"/></>}</svg>
                {urbExpanded?"Réduire":"Élargir"}
              </button>
            </div>
          </div>
        </div>

        {/* Workspace à trois étapes : application → connexion → détail du flux */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,300px),1fr))",gap:16,alignItems:"stretch",transition:"grid-template-columns .25s ease"}}>

          {/* Left: quartiers */}
          <div style={{...urbPanel,padding:16,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><span style={{width:28,height:28,borderRadius:9,display:"grid",placeItems:"center",background:zoneCC.ac+"20",color:zoneCC.ac,fontSize:11,fontWeight:850}}>01</span><div><div style={{fontSize:13,fontWeight:800,color:T.fg}}>Applications</div><div style={{fontSize:10,color:urbMuted,marginTop:3}}>{urbSelApp?"Point de départ sélectionné":"Choisissez une application"}</div></div><span style={{marginLeft:"auto",fontSize:9,color:urbMuted,background:urbDark?"rgba(148,163,184,.08)":"#f1f5f9",padding:"5px 7px",borderRadius:7}}>{zoneApps.length}</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:"calc(100vh - 330px)",minHeight:200,overflowY:"auto",paddingRight:4}}>
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
                        <span style={{fontSize:10,fontWeight:650,color:urbMuted,background:urbDark?"rgba(148,163,184,.1)":"#f1f5f9",padding:"4px 8px",borderRadius:7,whiteSpace:"nowrap",minWidth:52,textAlign:"center",fontVariantNumeric:"tabular-nums",flexShrink:0}}>{nFlux} flux</span>
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

            {filteredPairList.length>0&&<div style={{display:"grid",gridTemplateColumns:pairGrid,columnGap:8,padding:"0 12px 8px",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:urbMuted}}><span>Émetteur</span><span/><span>Récepteur</span><span style={{textAlign:"right"}}>Flux</span></div>}
            <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:"calc(100vh - 360px)",minHeight:200,overflowY:"auto",paddingRight:4}}>
              {filteredPairList.map(function(pair,pi){
                var fa=pair.from;var ta=pair.to;
                var faCC=DC[fa.domain]||DC.Autre;
                var taCC=DC[ta.domain]||DC.Autre;
                var isSameZone=fa.domain===urbZone&&ta.domain===urbZone;
                var pairKey=fa.id+">>"+ta.id;
                var pairIsSelected=urbFlowPair===pairKey;
                var restBg=pairIsSelected?(urbDark?"rgba(56,189,248,.12)":"rgba(14,165,233,.08)"):(urbDark?"rgba(148,163,184,.045)":"#f8fafc");
                var chip=function(a,cc){return <span style={{display:"inline-flex",alignItems:"center",gap:5,minWidth:0,fontSize:10.5,fontWeight:650,color:cc.ac}}><span style={{width:6,height:6,borderRadius:99,background:cc.ac,flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isSameZone?(a.category&&a.category!=="Autre"?a.category:"Interne"):a.domain}</span></span>;};
                return <div key={pi} role="button" tabIndex={0} onClick={function(){setUrbFlowPair(pairKey);}} onKeyDown={function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();setUrbFlowPair(pairKey);}}}
                  style={{display:"grid",gridTemplateColumns:pairGrid,columnGap:8,rowGap:6,alignItems:"center",background:restBg,borderRadius:12,padding:"12px",border:"1px solid "+(pairIsSelected?"rgba(56,189,248,.6)":urbLine),cursor:"pointer",transition:"transform .16s,background .16s,border-color .16s,box-shadow .16s",animation:"cardIn .18s ease both",animationDelay:Math.min(pi,12)*.02+"s"}}
                  onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.borderColor="rgba(56,189,248,.6)";e.currentTarget.style.boxShadow="0 6px 18px rgba(14,165,233,.09)";}}
                  onMouseLeave={function(e){e.currentTarget.style.transform="";e.currentTarget.style.borderColor=pairIsSelected?"rgba(56,189,248,.6)":urbLine;e.currentTarget.style.boxShadow="";}}>
                  <span title={fa.name} style={{fontSize:12.5,fontWeight:750,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fa.name}</span>
                  <span style={{display:"grid",placeItems:"center"}}><UrbFlowArrow color={pairIsSelected?"#22d3ee":"#818cf8"} width={24}/></span>
                  <span title={ta.name} style={{fontSize:12.5,fontWeight:750,color:T.fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ta.name}</span>
                  <span style={{gridColumn:4,gridRow:"1 / span 2",justifySelf:"end",alignSelf:"center",minWidth:30,textAlign:"center",fontSize:11,background:"rgba(56,189,248,.12)",color:"#38bdf8",border:"1px solid rgba(56,189,248,.25)",borderRadius:8,padding:"4px 8px",fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{pair.count}</span>
                  {chip(fa,faCC)}<span/>{chip(ta,taCC)}
                </div>;
              })}
            </div>

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
      <div style={{overflowY:"auto",flex:1}}><Dashboard/></div>
    </div></div></AppCtx.Provider>;

  /* ═══ MAPPING ═══ */
  var pinBtn=<button onClick={toggleToolbar} title={toolbarHidden?"Afficher le bandeau":"Masquer le bandeau"} aria-expanded={!toolbarHidden} style={{width:22,height:22,flexShrink:0,padding:0,borderRadius:7,display:"grid",placeItems:"center",cursor:"pointer",border:"1px solid transparent",background:"transparent",color:T.fgMuted,opacity:.6,transition:"all .2s ease"}} onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.background=T.bgAlt;e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color="#2979FF";}} onMouseLeave={e=>{e.currentTarget.style.opacity=".6";e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=T.fgMuted;}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform:toolbarHidden?"rotate(180deg)":"rotate(0deg)",transition:"transform .3s cubic-bezier(.34,1.56,.64,1)"}}><path d="m18 15-6-6-6 6"/></svg></button>;
  var toolbarSurface=isDark?"linear-gradient(145deg, rgba(38,41,68,.96), rgba(20,22,42,.96))":"linear-gradient(145deg,#FFFFFF,#F2F3FB)";
  return <AppCtx.Provider value={ctxValue}><div style={{height:"100%",display:"flex",overflow:"hidden"}}><Sidebar/><div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,overflow:"hidden",flexShrink:0,maxHeight:toolbarHidden?30:0,opacity:toolbarHidden?1:0,padding:toolbarHidden?"3px 12px":"0 12px",background:"linear-gradient(180deg,"+T.bgAlt+","+T.bg+")",borderBottom:toolbarHidden?"1px solid "+T.borderLight:"none",transition:"max-height .3s ease,opacity .25s ease,padding .3s ease"}}>{pinBtn}</div>
    <div ref={toolbarRef} className="mapping-toolbar" style={{background:"linear-gradient(180deg,"+T.bgAlt+","+T.bg+")",borderBottom:"1px solid "+T.borderLight,padding:toolbarHidden?"0 12px":"10px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0,zIndex:200,flexWrap:"wrap",position:"relative",maxHeight:toolbarHidden?0:600,opacity:toolbarHidden?0:1,overflow:toolbarHidden?"hidden":"visible",pointerEvents:toolbarHidden?"none":"auto",borderBottomWidth:toolbarHidden?0:1,transition:"max-height .3s ease,opacity .25s ease,padding .3s ease",boxShadow:"0 8px 24px rgba(0,0,0,0.14)"}}>
      {pinBtn}
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
        {id:"flowdir",label:"Direction du flux",sel:flowDir?[flowDir]:[],setSel:function(updater){var prev=flowDir?[flowDir]:[];var next=typeof updater==="function"?updater(prev):updater;setFlowDir(next.length?next[next.length-1]:"");},items:[{v:"in",label:"Entrants",color:"#10B981"},{v:"out",label:"Sortants",color:"#F59E0B"},{v:"bi",label:"Bi-directionnels",color:"#6366F1"}]},
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
                <span style={{fontSize:11,color:T.fgDim}}>{flt.id==="flowdir"?"":appCount}</span>
              </div>;})}
          </div>}
        </div>;})}
      {activeFilters&&<button onMouseDown={e=>{e.stopPropagation();setSelDom([]);setSelCat([]);setSelCrit([]);setSelHost([]);setSelAType([]);setSelEos([]);setSelD1("");setSelD2("");setSelStatut("");setFlowDir("");}} style={{...B,padding:"4px 8px",fontSize:11,background:"#FF525220",color:"#FF5252",borderRadius:4}}>✕</button>}
      <div style={{flex:1}}/>
      <button className="mapping-trigger mapping-trigger-primary" onMouseDown={e=>{e.stopPropagation();applyStarLayout();}} title="Regroupe les applications par catégorie, rapproche les domaines les plus connectés et cadre la carte. Les fonctions d’édition restent disponibles." style={{...B,padding:"7px 11px",fontSize:9.5,background:"linear-gradient(120deg,#4F46E5,#6366F1 58%,#0EA5E9)",color:"#fff",border:"1px solid rgba(165,180,252,.45)",borderRadius:11,display:"flex",alignItems:"center",gap:6,fontWeight:800,boxShadow:"0 6px 16px rgba(79,70,229,.28)"}}><span style={{fontSize:13}}>✦</span> Optimiser la disposition</button>
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
          <div className="mapping-menu-section-title">Comportement des flux</div>
          <div className="mapping-segmented">
            <button aria-pressed={flowDisplayMode==="dynamic"} onClick={function(){setFlowDisplayMode("dynamic");setFlowSuppressed(false);setFocusApp(null);setSelFlow(null);}} style={{...B,flex:1,padding:"8px 10px",fontSize:11,background:flowDisplayMode==="dynamic"?"linear-gradient(135deg,#2563EB,#0EA5E9)":"transparent",color:flowDisplayMode==="dynamic"?"#fff":T.fgMuted,border:flowDisplayMode==="dynamic"?"1px solid #38BDF8":"1px solid transparent",borderRadius:8}}>Au survol</button>
            <button aria-pressed={flowDisplayMode==="static"} onClick={function(){setFlowDisplayMode("static");setFlowSuppressed(false);setFocusApp(null);setSelFlow(null);setFlowProto("");setFlowCrit("");setTimeout(function(){fitCanvas();},80);}} style={{...B,flex:1,padding:"8px 10px",fontSize:11,background:flowDisplayMode==="static"?"linear-gradient(135deg,#2563EB,#0EA5E9)":"transparent",color:flowDisplayMode==="static"?"#fff":T.fgMuted,border:flowDisplayMode==="static"?"1px solid #38BDF8":"1px solid transparent",borderRadius:8}}>Statique</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7,padding:"2px 4px 8px"}}>
            <div style={{display:"flex",gap:6}}>
              <select aria-label="Filtrer par protocole" value={flowProto} onChange={function(e){setFlowProto(e.target.value);}} style={{flex:1,minWidth:0,background:flowProto?"#6366F122":T.bgAlt,color:flowProto?"#A5B4FC":T.fgMuted,border:"1px solid "+(flowProto?"#6366F1":T.border),borderRadius:8,padding:"6px 8px",fontSize:10.5,fontWeight:600}}>
                <option value="">Tous protocoles</option>
                {[...new Set(flows.map(function(f){return f.protocol;}).filter(Boolean))].sort().map(function(v){return <option key={v} value={v}>{v}</option>;})}
              </select>
              <select aria-label="Filtrer par criticité" value={flowCrit} onChange={function(e){setFlowCrit(e.target.value);}} style={{flex:1,minWidth:0,background:flowCrit?"#6366F122":T.bgAlt,color:flowCrit?"#A5B4FC":T.fgMuted,border:"1px solid "+(flowCrit?"#6366F1":T.border),borderRadius:8,padding:"6px 8px",fontSize:10.5,fontWeight:600}}>
                <option value="">Toute criticité</option>
                {["Haute","Moyenne","Basse"].map(function(v){return <option key={v} value={v}>{"Criticité "+v.toLowerCase()}</option>;})}
              </select>
            </div>
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
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"2px 6px 8px"}}>
            <span style={{fontSize:10,color:T.fgMuted,whiteSpace:"nowrap"}}>Étiquettes de flux</span>
            <input aria-label="Police étiquettes de flux" type="range" min="8" max="32" step="1" value={flowFontSize} onChange={function(e){setFlowFontSize(parseInt(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:32,textAlign:"right"}}>{flowFontSize}pt</span>
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
      {projectId&&viewsSlot&&createPortal(<ViewsMenu projectId={projectId} T={T} B={B} toolbarSurface={toolbarSurface} open={openMenu==="views"} onToggle={function(){setOpenMenu(openMenu==="views"?null:"views");}} getViewState={getViewState} applyViewState={applyViewState}/>,viewsSlot)}
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
            <input type="range" min="8" max="32" step="1" value={flowFontSize} onChange={function(e){setFlowFontSize(parseInt(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
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
      <div ref={cvRef} style={{flex:1,overflow:"hidden",position:"relative",background:isDark?"#0B0B14":"#FFFFFF",cursor:pan?"grabbing":cMode?"crosshair":selMode?"default":"grab"}} onMouseDown={function(e){if(openMenu)setOpenMenu(null);const onBackground=!e.target.closest?.('[data-app]')&&!e.target.closest?.('.flow-layer');if(onBackground){setFocusApp(null);setSelFlow(null);setFlowSuppressed(true);}onCD(e);}} onMouseMove={function(e){if(!e.target.closest?.('[data-app]')&&!e.target.closest?.('[data-panel]')&&!e.target.closest?.('.flow-layer')){if(flowDisplayMode==='dynamic'){setFlowSuppressed(true);if(focusApp&&!panelOpen)setFocusApp(null);if(selFlow&&!panelOpen)setSelFlow(null);}}onCM(e);}} onMouseUp={onCU} onMouseLeave={function(e){onCU(e);const enteringPanel=e.relatedTarget?.closest?.('[data-panel]');if(!enteringPanel&&flowDisplayMode==='dynamic'){setFlowSuppressed(true);setFocusApp(null);setSelFlow(null);}}} onWheel={onWh} onContextMenu={e=>e.preventDefault()}>
        <div className="cbg" style={{position:"absolute",inset:0,backgroundColor:T.bg,backgroundImage:isDark?"radial-gradient(circle,rgba(148,163,184,.24) 1.15px,transparent 1.15px), radial-gradient(ellipse at 54% 46%,rgba(99,102,241,.08),transparent 68%)":"radial-gradient(circle,rgba(71,85,105,.16) 1px,transparent 1px), radial-gradient(ellipse at 18% 14%,rgba(99,102,241,.08),transparent 52%), radial-gradient(ellipse at 84% 86%,rgba(34,211,238,.08),transparent 56%)",backgroundSize:isDark?"34px 34px,100% 100%":"32px 32px,100% 100%,100% 100%"}}/>
      <div style={{transform:`translate(${off.x}px,${off.y}px) scale(${zm})`,transformOrigin:"0 0",position:"absolute",top:0,left:0,width:5000,height:4000}}>
        <CategoryZones/><DomainZones/><FlowLines/>{filtered.map(a=><AppNode key={a.id} app={a}/>)}
        {lasso&&<div style={{position:"absolute",left:Math.min(lasso.x0,lasso.x1),top:Math.min(lasso.y0,lasso.y1),width:Math.abs(lasso.x1-lasso.x0),height:Math.abs(lasso.y1-lasso.y0),border:(1.5/zm)+"px dashed #34D399",background:"rgba(52,211,153,.10)",borderRadius:6/zm,pointerEvents:"none",zIndex:50}}/>}
      </div>
      <div data-app="1" style={{position:"absolute",bottom:16,right:16,display:"flex",alignItems:"center",gap:6,padding:6,borderRadius:13,background:isDark?"rgba(19,19,42,.92)":"rgba(255,255,255,.94)",border:"1px solid "+T.border,boxShadow:"0 10px 30px rgba(0,0,0,.2)",backdropFilter:"blur(12px)",color:T.fgMuted}}>
        <button title="Dézoomer" onMouseDown={function(e){e.stopPropagation();setZm(function(z){return Math.max(.25,+(z-.1).toFixed(2));});}} style={{...B,width:30,height:30,padding:0,background:T.bgHover,color:T.fg,borderRadius:8,fontSize:17}}>−</button>
        <span style={{minWidth:44,textAlign:"center",fontSize:10,fontWeight:800,color:T.fg,fontVariantNumeric:"tabular-nums"}}>{Math.round(zm*100)}%</span>
        <button title="Zoomer" onMouseDown={function(e){e.stopPropagation();setZm(function(z){return Math.min(2.5,+(z+.1).toFixed(2));});}} style={{...B,width:30,height:30,padding:0,background:T.bgHover,color:T.fg,borderRadius:8,fontSize:17}}>+</button>
        <span style={{width:1,height:22,background:T.border,margin:"0 2px"}}/>
        <button title="Cadrer toute la cartographie sans déplacer les applications" onMouseDown={function(e){e.stopPropagation();fitCanvas();}} style={{...B,padding:"7px 10px",background:"#6366F1",color:"#fff",borderRadius:8,fontSize:10,whiteSpace:"nowrap"}}>⌖ Recentrer</button>
        <span style={{width:1,height:22,background:T.border,margin:"0 2px"}}/>
        <span style={{padding:"0 6px",fontSize:9,fontWeight:650,whiteSpace:"nowrap"}}>{activeFilters?filtered.length+" / ":""}{apps.length} apps · {flows.length} flux{activeFilters?" filtrés":""}</span>
      </div>
    </div>
    {selApp&&panelOpen&&!showAM&&<div data-panel="1" style={{width:360,flexShrink:0,background:T.bgAlt,borderLeft:"1px solid "+T.borderLight,overflowY:"auto",display:"flex",flexDirection:"column",zIndex:10}}>
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
          <button onClick={()=>{setSelApp(null);setPanelOpen(false);}} title="Fermer la fiche" style={{background:T.bgCard+"90",border:"1px solid "+T.border,color:T.fgMuted,cursor:"pointer",fontSize:18,lineHeight:1,padding:"5px 8px",borderRadius:8,flexShrink:0}}>×</button>
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
          }} style={{...B,padding:"3px 8px",fontSize:11,background:T.border}}>Recentrer</button>
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
    {listsEditor&&isAdmin&&<OptionListsEditor T={T} I={I} B={B} apps={apps} lists={currentLists()} initialTab={listsEditor} onSave={saveOptionLists} onClose={function(){setListsEditor(null);}}/>}
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
          <div><label style={{fontSize:11,color:T.fgMuted,display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}><span>Statut</span>{isAdmin&&<button type="button" title="Modifier la liste (administrateur)" onClick={function(){setListsEditor("statuts");}} style={{background:"transparent",border:"none",color:"#2979FF",cursor:"pointer",fontSize:10,padding:0}}>⚙ <span>Gérer</span></button>}</label><select value={eApp.statut||""} onChange={e=>setEApp(a=>({...a,statut:e.target.value}))} style={I}>{STATUT_OPTS.map(v=><option key={v} value={v}>{v||"— Non défini —"}</option>)}</select></div>
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
                      <div><label style={{fontSize:11,color:T.fgMuted,display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}><span>Type d'application</span>{isAdmin&&<button type="button" title="Modifier la liste (administrateur)" onClick={function(){setListsEditor("appTypes");}} style={{background:"transparent",border:"none",color:"#2979FF",cursor:"pointer",fontSize:10,padding:0}}>⚙ <span>Gérer</span></button>}</label><select value={eApp.appType||""} onChange={e=>setEApp(p=>({...p,appType:e.target.value}))} style={I}><option value="">— Non défini —</option>{eApp.appType&&!APPTYPE_OPTS.includes(eApp.appType)&&<option value={eApp.appType}>{eApp.appType}</option>}{APPTYPE_OPTS.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
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
    {showExportModal&&<ExportModal T={T} apps={apps} flows={flows} doms={doms} projectType={projectType} initialOpts={exportOpts} onClose={function(){setShowExportModal(false);}} onExport={exportPPTX}/>}
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

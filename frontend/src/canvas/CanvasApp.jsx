import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';

// Dynamic imports — these heavy libs (XLSX ~816KB, PptxGenJS ~505KB) load only when
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
var THEMES={dark:{bg:"#08080F",bgAlt:"#0D0D1A",bgCard:"#13132A",bgInput:"#0D0D1A",bgHover:"#1C1C38",fg:"#F0F0FB",fgMuted:"#8080B0",fgDim:"#5A5A85",fgFaint:"#3A3A60",border:"#22224A",borderLight:"#1A1A3A",overlay:"#000000A8",grid:"#111128",shadow:"var(--shadow-md)",accent:"#6366F1",accentMuted:"#6366F118",pres:"#05050A"},light:{bg:"#F7F8FD",bgAlt:"#EEF0FA",bgCard:"#FFFFFF",bgInput:"#FFFFFF",bgHover:"#E8EAF8",fg:"#0F1030",fgMuted:"#3D3D70",fgDim:"#6868A0",fgFaint:"#9090C0",border:"#CDD0E8",borderLight:"#DDE0F0",overlay:"#00000030",grid:"#D8DAF0",shadow:"0 4px 24px #00000015",accent:"#6366F1",accentMuted:"#6366F115",pres:"#F0F2FC"}};
const ALLDOM_DEFAULT = Object.keys(DC_DEFAULT);
const SI = {Maintien:"●",Arrêt:"◌","Standalone temporaire":"◐","Migrée":"◇","Remplacée":"◈"};
const CC = {Haute:"#FF5252",Moyenne:"#EF6C00",Basse:"#00C853"};
const SD1={"Transfert TSA":"#F59E0B","Abandon":"#EF4444"};
const SD2={"Clone & Clean":"#3B82F6","Transfert":"#10B981","Abandon":"#EF4444","Rebuild":"#F97316"};
const D1_OPTS=["","Transfert TSA","Abandon"];
const D2_OPTS=["","Clone & Clean","Transfert","Abandon","Rebuild"];
const SC = {Maintien:"#00C853",Arrêt:"#FF5252","Standalone temporaire":"#EF6C00","Migrée":"#2979FF","Remplacée":"#7C4DFF"};
const PROTOS = ["API","REST","SOAP","SFTP","ETL","JDBC","ODBC","Webhook","MQ","Batch","Manuel","Fichier","Autre"];
const FREQS = ["","Temps réel","Horaire","Journalier","Hebdomadaire","Mensuel","À la demande"];
const uid = () => Math.random().toString(36).slice(2,10);


const FIELDS = [
  {key:"name",label:"Nom application",req:true},{key:"domain",label:"Domaine",req:true},{key:"category",label:"Catégorie (niveau 1)"},
  {key:"description",label:"Description"},{key:"status",label:"Statut"},{key:"criticality",label:"Criticité"},
  {key:"vendor",label:"Éditeur / Fournisseur"},{key:"version",label:"Version"},{key:"owner",label:"Responsable"},
  {key:"users",label:"Nb utilisateurs"},{key:"statusD1",label:"Statut Day 1"},{key:"statusD2",label:"Statut Day 2"},{key:"flowTo",label:"Flux vers (séparés par |)"},{key:"flowProtocol",label:"Protocole flux"},{key:"flowLabel",label:"Objet du flux (séparés par |)"},
];

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length<2)return[];
  const hd = lines[0].split(/[;,\t]/).map(s=>s.trim().replace(/^"|"$/g,""));
  return lines.slice(1).map(line=>{
    const v=line.split(/[;,\t]/).map(s=>s.trim().replace(/^"|"$/g,""));
    const o={}; hd.forEach((h,i)=>o[h]=v[i]||""); return o;
  });
};

const downloadTemplate = async () => {
  await ensureXLSX();
  const wb = XLSX.utils.book_new();
  const hdr = ["Nom Application","Catégorie","Domaine","Description","Statut","Criticité","Éditeur / Fournisseur","Version","Responsable","Nb Utilisateurs","Statut Day 1","Statut Day 2","Flux vers (séparés par |)","Protocole flux","Objet du flux (séparés par |)","Commentaires"];
  const ex = [
    ["SAP S/4HANA","Opérations Cœur","Finance","ERP central","Maintien","Haute","SAP SE","S/4HANA 2023","J. Dupont",250,"Transfert TSA","Clone & Clean","Salesforce|Power BI","API|API","Données clients|Reporting financier","Système central"],
    ["Salesforce","Commercial","CRM","Maintien","Haute","Salesforce Inc.","Enterprise","M. Martin",120,"Transfert TSA","Transfert","SAP S/4HANA|Mailchimp","API|REST","Commandes|Contacts marketing",""],
    ["Power BI","IT","Business Intelligence","Maintien","Moyenne","Microsoft","Pro","A. Bernard",80,"Transfert TSA","Clone & Clean","","","",""],
    ["ADP","RH","Paie et gestion RH","Maintien","Haute","ADP","v12","L. Petit",15,"Abandon","Rebuild","SAP S/4HANA","SFTP","Écritures de paie",""],
    ["Mailchimp","Marketing","Emailing marketing","Maintien","Basse","Intuit","Premium","S. Moreau",10,"","","","","",""],
    ["Jira","IT","Gestion de projet IT","Maintien","Moyenne","Atlassian","Cloud","P. Durand",45,"Transfert TSA","Clone & Clean","Confluence","REST","Documentation technique",""],
    ["WMS Reflex","Logistique","Gestion d'entrepôt","Maintien","Haute","Hardis Group","v6.2","C. Roux",35,"Abandon","Rebuild","SAP S/4HANA","API","Mouvements de stock",""],
    ["DocuSign","Juridique","Signature électronique","Maintien","Moyenne","DocuSign","Enterprise","N. Blanc",30,"Transfert TSA","Transfert","Salesforce","API","Contrats signés",""],
    ["MES Wonderware","Production","Pilotage atelier","Maintien","Haute","AVEVA","2023","F. Garcia",40,"Abandon","Clone & Clean","SAP S/4HANA|WMS Reflex","API|MQ","Ordres de fabrication|Bons de sortie",""],
    ["Workday","RH","Gestion des talents","Migrée","Moyenne","Workday","2024R1","L. Petit",0,"Transfert TSA","Transfert","ADP","API","Données collaborateurs","Déploiement S2 2025"],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet([hdr,...ex]);
  ws1["!cols"]=[{wch:22},{wch:20},{wch:16},{wch:35},{wch:12},{wch:12},{wch:22},{wch:12},{wch:18},{wch:14},{wch:18},{wch:18},{wch:28},{wch:16},{wch:30},{wch:28}];
  XLSX.utils.book_append_sheet(wb,ws1,"Applications");
  var fluxHdr=["N° Ordre","Application Émettrice","Application Réceptrice","Nom du Flux Métier","Protocole","Fréquence","Description"];
  var fluxEx=[[1,"SAP S/4HANA","Salesforce","Synchronisation clients","API","Temps réel","Envoi fiches clients"],[2,"SAP S/4HANA","Salesforce","Tarifs catalogue","API","Journalier","MAJ prix"],[3,"SAP S/4HANA","Power BI","Reporting financier","API","Journalier","Données comptables"],[4,"Salesforce","SAP S/4HANA","Commandes validées","REST","Temps réel","Retour commandes"],[5,"ADP","SAP S/4HANA","Écritures de paie","SFTP","Mensuel","Intégration paie"],[6,"MES Wonderware","SAP S/4HANA","Ordres de fabrication","API","Temps réel","Retour production"]];
  var wsFlux=XLSX.utils.aoa_to_sheet([fluxHdr].concat(fluxEx));wsFlux["!cols"]=[{wch:10},{wch:24},{wch:24},{wch:28},{wch:14},{wch:16},{wch:45}];
  XLSX.utils.book_append_sheet(wb,wsFlux,"Flux Métier");
  const ref=[["Domaine","Description","Couleur"],["Finance","Comptabilité, controlling","#52B788"],["RH","Paie, talents, formation","#9D4EDD"],["IT","Infra, dev, BI","#548CA8"],["Commercial","CRM, ventes","#E06C75"],["Production","MES, qualité","#D4A017"],["Logistique","WMS, supply chain","#40A578"],["Marketing","Emailing, CMS","#D63384"],["Juridique","Contrats, conformité","#57A0A0"],["Direction","Reporting, stratégie","#7B78FF"],["Autre","Non classifié","#9E9E9E"]];
  const ws2=XLSX.utils.aoa_to_sheet(ref); ws2["!cols"]=[{wch:16},{wch:40},{wch:12}]; XLSX.utils.book_append_sheet(wb,ws2,"Référentiel Domaines");
  const ins=[["TEMPLATE CARTOGRAPHIE APPLICATIVE",""],["",""],["COLONNES OBLIGATOIRES",""],["Nom Application","Nom unique de l'application"],["Domaine","Finance, RH, IT, Commercial, Production, Logistique, Marketing, Juridique, Direction, Autre"],["",""],["COLONNES OPTIONNELLES",""],["Statut","Maintien / Arrêt / Standalone temporaire / Migrée / Remplacée"],["Criticité","Haute / Moyenne / Basse"],["Statut Day 1","Stratégie de closing : Transfert TSA / Abandon"],["Statut Day 2","Stratégie cible : Clone & Clean / Transfert / Rebuild / Abandon"],["Flux vers","Noms des applications cibles séparés par |"],["Protocole","API, REST, SFTP, ETL… séparés par |"],["Objet du flux","Libellé de la donnée échangée. Séparés par | si multiples"],["",""],["CONSEILS",""],["1.","Les noms dans 'Flux vers' = noms exacts de la colonne A"],["2.","Day 1 = statut de closing (J1) · Day 2 = vision cible à terme"],["3.","Voir onglet 'Référentiel Domaines' pour les couleurs"]];
  const ws3=XLSX.utils.aoa_to_sheet(ins); ws3["!cols"]=[{wch:30},{wch:70}]; XLSX.utils.book_append_sheet(wb,ws3,"Instructions");
  XLSX.writeFile(wb,"template_cartographie.xlsx");
};


// ═══ SIDEBAR COMPONENT (V11) ═══
function Sidebar(){
  var ref=React.useContext(AppCtx);
  if(!ref)return null;
  var view=ref.view,setView=ref.setView,isDark=ref.isDark,T=ref.T,apps=ref.apps,flows=ref.flows,sidebarOpen=ref.sidebarOpen,setSidebarOpen=ref.setSidebarOpen;
  var W=sidebarOpen?200:56;
  var NAV=[
    {id:"mapping",icon:"Map",label:"Cartographie",color:"#6366F1"},
    {id:"urbanisme",icon:"Grid",label:"Urbanisme",color:"#F59E0B"},
    {id:"cards",icon:"Layers",label:"Cartes",color:"#10B981"},
    {id:"paysage",icon:"Boxes",label:"Paysage",color:"#0EA5E9"},
    {id:"dashboard",icon:"BarChart",label:"Dashboard",color:"#8B5CF6"},
    {id:"decisions",icon:"Target",label:"Decisions D1/D2",color:"#EF4444"},
  ];
  return <div className="sidebar" style={{width:W,height:"100vh",background:T.bgAlt,borderRight:"1px solid "+T.border,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden",zIndex:200}}>
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
// Construit le layout à 2 niveaux à partir du tableau `apps` (clés domain/category
// inchangées) : domaines découpant l'écran, catégories découpant chaque domaine.
function pvBuildLayout(apps,w,h){
  var D_HEADER_H=26;
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
      .map(function(c){return{quartier:c,nbApps:catMap[c].length};})
      .filter(function(x){return x.nbApps>0;})
      .sort(function(a,b){return b.nbApps-a.nbApps;});
    var inner={x:r.x+4,y:r.y+D_HEADER_H+4,w:Math.max(0,r.w-8),h:Math.max(0,r.h-D_HEADER_H-8)};
    var qRects=pvSquarify(cats.map(function(x){return x.nbApps;}),inner);
    return{
      domaine:d.domaine,nbApps:d.nbApps,rect:r,
      quartiers:cats.map(function(x,j){return{quartier:x.quartier,nbApps:x.nbApps,rect:qRects[j]};}),
    };
  });
}

// ═══ APP CONTEXT ═══
var AppCtx=React.createContext(null);

function App({ initialSnapshot, onSave, wsMessage, projectId, onThemeChange, topOffset = 0 }) {
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
  const [selStat,setSelStat]=useState([]);
  const [selCrit,setSelCrit]=useState([]);
  const [selCat,setSelCat]=useState([]);
  const [openFilter,setOpenFilter]=useState(null); // "domain"|"category"|"status"|"criticality"|null
  const [search,setSearch]=useState("");
  const [selD1,setSelD1]=useState("");
  const [selD2,setSelD2]=useState("");
  const [activeDomFilter,setActiveDomFilter]=useState("");
  const [selApp,setSelApp]=useState(null);
  const [selFlow,setSelFlow]=useState(null);// selected flow (click)
  const [flowCtx,setFlowCtx]=useState(null);// context menu {flow, x, y}
  const [drag,setDrag]=useState(null); // {id,ox,oy} for app or {domain,ox,oy,appIds} for domain group
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
  }, []); // appelé au montage pour signaler CANVAS_READY

  var DC=domColors;
  var DC_DARK=domColors;
  const ALLDOM=[...new Set([...ALLDOM_DEFAULT,...Object.keys(domColors)])];
  const [showDomEdit,setShowDomEdit]=useState(null); // domain name being edited
  const [showCatModal,setShowCatModal]=useState(false);
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

  const [ctxMenu,setCtxMenu]=useState(null); // {x,y,type,target} for right-click menus
  const [presMode,setPresMode]=useState(false);
  const [focusApp,setFocusApp]=useState(null);
  const [flowDomFilter,setFlowDomFilter]=useState("");
  const [showFluxListModal,setShowFluxListModal]=useState(null);
  const [flowThickness,setFlowThickness]=useState(2);
  const [flowFontSize,setFlowFontSize]=useState(9);
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
  const [domW,setDomW]=useState(240);
  const [domH,setDomH]=useState(0);
  const [domPos,setDomPos]=useState({});
  const [domWidths,setDomWidths]=useState({});
  const [domDrag,setDomDrag]=useState(null);
  const [showSettings,setShowSettings]=useState(false); // presentation mode
  const [showExportModal,setShowExportModal]=useState(false);
  const [exportOpts,setExportOpts]=useState({
    synthDetail:"radial",// "none" | "radial" | "byDomain"
    inclExecSlides:true,
    inclFocusDomain:true,
    inclKPI:true,
    inclLegend:true,
    inclAggregated:true,
    inclHubSlides:true,
    inclDomainStatus:true,
    cartoMode:"global", // "global" | "byDomain" | "byHub"
    inclConsolidatedCarto:true,
    inclRecapTable:true,
    clientPrimary:"2979FF",
    clientLogo:null,
  });
  const [fontScale,setFontScale]=useState(1); // font size multiplier (independent of card size)
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
    var d1best=hds.find(function(h){return["day 1","statut day 1","d1"].some(function(p){return n(h).indexOf(p)>=0;});});
    var d2best=hds.find(function(h){return h!==d1best&&["day 2","statut day 2","d2"].some(function(p){return n(h).indexOf(p)>=0;});});
    if(d1best){m.statusD1=d1best;used.add(d1best);}
    if(d2best){m.statusD2=d2best;used.add(d2best);}
    const P={name:["nom","application","app","name"],x:["x","pos x","position x"],y:["y","pos y","position y"],domain:["domaine","domain"],description:["description","desc"],status:["statut as-is","as-is","statut actuel","statut","status","état"],criticality:["criticité","criticite","criticality","importance"],vendor:["éditeur","editeur","vendor","fournisseur"],version:["version"],owner:["responsable","owner"],users:["utilisateur","users","nb util"],flowTo:["flux vers","flow to","interface vers","cible","target"],flowFrom:["source","emettrice","from"],flowProtocol:["protocole","protocol"],category:["catégorie","categorie","category","macro","zone","groupe","group","périmètre","perimetre"],flowLabel:["objet","object","libellé flux","donnée"]};
    FIELDS.forEach(function(f){
      if(m[f.key])return;
      var best=hds.find(function(h){return!used.has(h)&&P[f.key]&&P[f.key].some(function(p){return n(h).indexOf(p)>=0;});});
      if(best){m[f.key]=best;used.add(best);}
    });
    setCMap(m);return m;
  };

  const computeStats=(data, mapping)=>{
    const domSet=new Set(); let flowCount=0; const statusCount={};const critCount={};
    data.forEach(r=>{
      const dom=r[mapping.domain]||"Autre"; domSet.add(dom);
      const st=r[mapping.status]||"Maintien"; statusCount[st]=(statusCount[st]||0)+1;
      const cr=r[mapping.criticality]||"Moyenne"; critCount[cr]=(critCount[cr]||0)+1;
      if(mapping.flowTo&&r[mapping.flowTo]) r[mapping.flowTo].split("|").forEach(t=>{if(t.trim())flowCount++;});
    });
    return {apps:data.length, domains:domSet.size, domainList:[...domSet], flows:flowCount, statusCount, critCount, mappedFields:Object.keys(mapping).filter(k=>mapping[k]).length, totalFields:FIELDS.length};
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
    const na=rawData.map((r,i)=>({id:uid(),name:r[cMap.name]||"App_"+i,domain:r[cMap.domain]||"Autre",category:r[cMap.category]||"",description:r[cMap.description]||"",status:r[cMap.status]||"Maintien",criticality:r[cMap.criticality]||"Moyenne",vendor:r[cMap.vendor]||"",version:r[cMap.version]||"",owner:r[cMap.owner]||"",users:parseInt(r[cMap.users])||0,statusD1:r[cMap.statusD1]||"",statusD2:r[cMap.statusD2]||"",x:0,y:0,_ft:r[cMap.flowTo]||"",_fp:r[cMap.flowProtocol]||"",_fl:r[cMap.flowLabel]||""}));
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

    // Layout: greedy column packing to minimize total height
    // Target: fill viewport ~1600x900 worth of space
    const targetW=1800;
    // Compute domain block widths and heights
    const domBlocks=sortedDoms.map(([d,dApps])=>{
      const rows=Math.ceil(dApps.length/perRow);
      const w=perRow*(cW+cGx)+domSide*2;
      const h=rows*(cH+cGy)+domPad+12;
      return {name:d,apps:dApps,w,h};
    });
    
    // Greedy bin-pack into columns fitting targetW
    const colW=domBlocks.length>0?domBlocks[0].w:300;
    const nCols=Math.max(1,Math.min(Math.floor(targetW/(colW+domGap)),Math.ceil(domBlocks.length/2)));
    const colTops=Array(nCols).fill(30);
    const colXs=Array.from({length:nCols},(_,i)=>30+i*(colW+domGap));

    domBlocks.forEach(db=>{
      // Find shortest column
      let best=0;
      for(let c=1;c<nCols;c++) if(colTops[c]<colTops[best]) best=c;
      const bx=colXs[best];
      const by=colTops[best];
      // Position apps
      db.apps.forEach((app,ai)=>{
        const col=ai%perRow,row=Math.floor(ai/perRow);
        app.x=bx+domSide+col*(cW+cGx);
        app.y=by+domPad+row*(cH+cGy);
      });
      colTops[best]+=db.h+domGap;
    });

    // Auto-fit zoom to show everything
    const maxX=Math.max(...na.map(a=>a.x+cW),100);
    const maxY=Math.max(...na.map(a=>a.y+cH),100);
    const vw=window.innerWidth||1400;
    const vh=(window.innerHeight||800)-60; // minus toolbar
    const fitZm=Math.min(vw/(maxX+80),vh/(maxY+80),1.2);

    setApps(na);setFlows(nf);setOff({x:10,y:10});setZm(Math.max(0.3,Math.min(fitZm,1)));setView("mapping");
  };

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
      setPan(true);pRef.current={x:e.clientX-off.x,y:e.clientY-off.y};setSelApp(null);
    }
  };
  const onCM=e=>{
    if(pan)setOff({x:e.clientX-pRef.current.x,y:e.clientY-pRef.current.y});
    if(drag){
      if(drag.resize){
        const dx=(e.clientX-drag.lx)/zm,dy=(e.clientY-drag.ly)/zm;
        drag.lx=e.clientX;drag.ly=e.clientY;
        setDomPads(p=>{const cur=p[drag.resize]||{w:0,h:0};return{...p,[drag.resize]:{w:Math.max(0,cur.w+dx),h:Math.max(0,cur.h+dy)}};});
        return;
      }

      if(drag.ids){
        const dx=(e.clientX-drag.lx)/zm,dy=(e.clientY-drag.ly)/zm;
        drag.lx=e.clientX;drag.ly=e.clientY;
        setApps(p=>p.map(a=>drag.ids.includes(a.id)?{...a,x:a.x+dx,y:a.y+dy}:a));
        return;
      }
      if(drag.domain){
        // Domain or category group drag: move all apps
        const dx=(e.clientX-drag.lastX)/zm;
        const dy=(e.clientY-drag.lastY)/zm;
        drag.lastX=e.clientX;drag.lastY=e.clientY;
        setApps(p=>p.map(a=>drag.appIds.includes(a.id)?{...a,x:a.x+dx,y:a.y+dy}:a));
      } else {
        // Single app drag
        setApps(p=>p.map(a=>a.id===drag.id?{...a,x:(e.clientX-drag.ox-off.x)/zm,y:(e.clientY-drag.oy-off.y)/zm}:a));
      }
    }
  };
  const onCU=e=>{
    setPan(false);
    // Check if app was dropped onto a different domain zone
    if(drag&&drag.id&&!drag.domain&&e){
      const draggedApp=apps.find(a=>a.id===drag.id);
      if(draggedApp){
        const appCx=draggedApp.x+AW/2, appCy=draggedApp.y+AH/2;
        // Build domain bounding boxes
        const zones={};
        apps.forEach(a=>{
          if(a.id===drag.id) return; // skip the dragged app itself
          if(!zones[a.domain]) zones[a.domain]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity};
          zones[a.domain].x1=Math.min(zones[a.domain].x1,a.x-30);
          zones[a.domain].y1=Math.min(zones[a.domain].y1,a.y-52);
          zones[a.domain].x2=Math.max(zones[a.domain].x2,a.x+AW+30);
          zones[a.domain].y2=Math.max(zones[a.domain].y2,a.y+AH+30);
        });
        // Check which zone the app center falls into
        for(const [dom,b] of Object.entries(zones)){
          if(dom!==draggedApp.domain && appCx>=b.x1 && appCx<=b.x2 && appCy>=b.y1 && appCy<=b.y2){
            setApps(p=>p.map(a=>a.id===drag.id?{...a,domain:dom}:a));
            break;
          }
        }
      }
    }

    setDrag(null);
  };
  const onWh=e=>{e.preventDefault();
    if(e.ctrlKey||e.metaKey){setZm(z=>Math.max(0.25,Math.min(2.5,z-e.deltaY*0.003)));}
    else{setOff(o=>({x:o.x-e.deltaX*0.8,y:o.y-e.deltaY*0.8}));}
  };

  var ctxValue={view,setView,isDark,T,apps,flows,sidebarOpen,setSidebarOpen};
  const fitCanvas=()=>{
    if(!apps.length)return;
    const maxX=Math.max(...apps.map(a=>a.x+(AW_BASE*globalScale||140)),100);
    const maxY=Math.max(...apps.map(a=>a.y+(AH_BASE*globalScale||80)),100);
    const vw=window.innerWidth||1400;
    const vh=(window.innerHeight||800)-100;
    const fitZm=Math.min(vw/(maxX+80),vh/(maxY+80),1.2);
    setZm(Math.max(0.25,Math.min(fitZm,1.2)));
    setOff({x:20,y:20});
  };


  const exportXLSX=async()=>{
    await ensureXLSX();
    try{
      var wb=XLSX.utils.book_new();

      // ── Onglet 1: Applications (format reimportable) ──
      var ah=["Nom","Domaine","Categorie","Statut","Criticite","Editeur","Version","Responsable","Utilisateurs","Description","Day 1","Day 2","x","y"];
      var ar=apps.map(function(a){return[
        a.name,
        a.domain,
        a.category||"",
        a.status,
        a.criticality,
        a.vendor||"",
        a.version||"",
        a.owner||"",
        a.users||"",
        a.description||"",
        a.statusD1||"",
        a.statusD2||"",
        Math.round(a.x)||0,
        Math.round(a.y)||0
      ];});
      var ws1=XLSX.utils.aoa_to_sheet([ah].concat(ar));
      ws1["!cols"]=[{wch:24},{wch:16},{wch:14},{wch:18},{wch:12},{wch:18},{wch:10},{wch:18},{wch:10},{wch:35},{wch:18},{wch:16},{wch:7},{wch:7}];
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
      dd.push(["Ratio flux/app",(totF/tot).toFixed(2)]);
      dd.push([""]);
      dd.push(["STATUTS","Nb","%"]);
      ["Maintien","Arret","Standalone temporaire","Migree","Remplacee"].forEach(function(s){var n=apps.filter(function(a){return a.status===s;}).length;dd.push([s,n,Math.round(n/tot*100)+"%"]);});
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
      ["Transfert TSA","Abandon"].forEach(function(s){var n=apps.filter(function(a){return a.statusD1===s;}).length;dd.push([s,n,Math.round(n/tot*100)+"%"]);});
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

  const exportCSV=()=>{const h=["Nom","Domaine","Statut","Criticité","Éditeur","Version","Responsable","Utilisateurs","Description"];const rows=apps.map(a=>[a.name,a.domain,a.status,a.criticality,a.vendor,a.version,a.owner,a.users,a.description].map(v=>'"'+v+'"').join(";"));const blob=new Blob(["\uFEFF"+[h.join(";"),...rows].join("\n")],{type:"text/csv;charset=utf-8;"});const l=document.createElement("a");l.href=URL.createObjectURL(blob);l.download="cartographie.csv";l.click();};

  const saveJSON=()=>{
    const data={version:2,theme:themeKey,date:new Date().toISOString(),apps,flows,domColors,domScales,domPads,globalScale,fontScale,zoom:zm,offset:off};
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

  const exportPPTX=async(opts)=>{
    await ensurePptx();
    var _opts=opts||exportOpts;
    var _pDC=DC_DARK;
    const pres=new PptxGenJS();
    pres.layout="LAYOUT_WIDE";
    pres.author="Cartographe";
    pres.title="Cartographie Applicative";
    const W=13.333, H=7.5;
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
    // ─── Slide 0: Synthèse & Messages clés (premier slide) ───
    {
    const sccp=cp;
    const sSC=SS(pres.addSlide());
    sSC.background={color:"F8F9FC"};
    sSC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.60,fill:{color:sccp},line:{type:"none"}});
    sSC.addShape(pres.shapes.RECTANGLE,{x:0,y:0.585,w:10,h:0.022,fill:{color:"FFFFFF",transparency:70},line:{type:"none"}});
    if(_opts.clientLogo){sSC.addImage({data:_opts.clientLogo,x:9.05,y:0.04,w:0.90,h:0.52,sizing:{type:"contain",w:0.90,h:0.52}});}
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
    // ─── Slide 1: Title ───
    if(_opts.inclExecSlides){
    const s1=SS(pres.addSlide());
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
    s1.addText("Généré le "+new Date().toLocaleDateString("fr-FR"),{x:0.50,y:4.87,w:5,h:0.30,fontSize:9,color:"94A3B8",fontFace:"Calibri",margin:0});
    s1.addText("CONFIDENTIEL",{x:5.50,y:4.87,w:4.30,h:0.30,fontSize:9,bold:true,color:cp,fontFace:"Calibri",align:"right",margin:0,charSpacing:2});

    // --- Slide Synthese Executive ---
    {
    const sSX=SS(pres.addSlide());
    sSX.background={color:"F8F9FC"};
    // Bandeau header clair
    sSX.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.60,fill:{color:cp},line:{type:"none"}});
    sSX.addShape(pres.shapes.RECTANGLE,{x:0,y:0.585,w:10,h:0.022,fill:{color:"FFFFFF",transparency:70},line:{type:"none"}});
    if(_opts.clientLogo){sSX.addImage({data:_opts.clientLogo,x:9.05,y:0.04,w:0.90,h:0.52,sizing:{type:"contain",w:0.90,h:0.52}});}
    sSX.addText("SYNTHÈSE EXÉCUTIVE",{x:0.35,y:0.08,w:7.5,h:0.46,fontSize:22,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
    sSX.addText("Généré le "+new Date().toLocaleDateString("fr-FR"),{x:7.5,y:0.18,w:2.2,h:0.25,fontSize:9,color:"FFFFFFAA",fontFace:"Calibri",align:"right",margin:0});
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
    // Helper barres horizontales empilees + legende
    const sxDrawBars=function(sl,bx,by,bw,stats,tot){
      if(!tot)return;
      let cx2=bx;
      stats.forEach(function(st){
        if(!st.v)return;
        const sw=(st.v/tot)*bw;
        sl.addShape(pres.shapes.RECTANGLE,{x:cx2,y:by,w:sw,h:0.24,fill:{color:st.c},line:{type:"none"}});
        cx2+=sw;
      });
      let lx2=bx;let ly2=by+0.30;
      stats.forEach(function(st){
        if(!st.v)return;
        const pct2=Math.round(st.v/tot*100);
        const lw3=1.48;
        if(lx2+lw3>bx+bw+0.05){lx2=bx;ly2+=0.24;}
        sl.addShape(pres.shapes.RECTANGLE,{x:lx2,y:ly2+0.055,w:0.10,h:0.10,fill:{color:st.c},line:{type:"none"}});
        sl.addText(st.l+" ("+st.v+" — "+pct2+"%)",{x:lx2+0.14,y:ly2,w:lw3-0.14,h:0.22,fontSize:7.5,color:"AABBCC",fontFace:"Calibri",margin:0,shrinkText:true});
        lx2+=lw3;
      });
    };
    // Bloc Day 1
    const d1Stats2=[
      {l:"Transfert TSA",v:apps.filter(function(a){return a.statusD1==="Transfert TSA";}).length,c:"F59E0B"},
      {l:"Abandon",v:apps.filter(function(a){return a.statusD1==="Abandon";}).length,c:"EF4444"},
      {l:"Non défini",v:apps.filter(function(a){return !a.statusD1;}).length,c:"4A5568"},
    ];
    const d1bx=0.25,d1by=1.80,d1bw=4.50,d1bh=2.30;
    sSX.addShape(pres.shapes.RECTANGLE,{x:d1bx,y:d1by,w:d1bw,h:d1bh,fill:{color:"FFFFFF"},line:{color:"E2E8F0",width:0.5},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});
    sSX.addShape(pres.shapes.RECTANGLE,{x:d1bx,y:d1by,w:d1bw,h:0.28,fill:{color:"FEF3C7"},line:{type:"none"}});
    sSX.addText("VISION CLOSING — DAY 1",{x:d1bx+0.14,y:d1by+0.05,w:3.2,h:0.20,fontSize:9,bold:true,color:"D97706",fontFace:"Calibri",charSpacing:1,margin:0});
    sSX.addText(sxD1Def+" définies / "+apps.length,{x:d1bx+d1bw-1.55,y:d1by+0.05,w:1.45,h:0.18,fontSize:8,color:"94A3B8",fontFace:"Calibri",align:"right",margin:0});
    sxDrawBars(sSX,d1bx+0.15,d1by+0.36,d1bw-0.30,d1Stats2,apps.length);
    // Bloc Day 2
    const d2Stats2=[
      {l:"Clone & Clean",v:apps.filter(function(a){return a.statusD2==="Clone & Clean";}).length,c:"3B82F6"},
      {l:"Transfert",v:apps.filter(function(a){return a.statusD2==="Transfert";}).length,c:"10B981"},
      {l:"Rebuild",v:apps.filter(function(a){return a.statusD2==="Rebuild";}).length,c:"8B5CF6"},
      {l:"Abandon",v:apps.filter(function(a){return a.statusD2==="Abandon";}).length,c:"EF4444"},
      {l:"Non défini",v:apps.filter(function(a){return !a.statusD2;}).length,c:"4A5568"},
    ];
    const d2bx=5.00,d2by=1.80,d2bw=4.75,d2bh=2.30;
    sSX.addShape(pres.shapes.RECTANGLE,{x:d2bx,y:d2by,w:d2bw,h:d2bh,fill:{color:"FFFFFF"},line:{color:"E2E8F0",width:0.5},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});
    sSX.addShape(pres.shapes.RECTANGLE,{x:d2bx,y:d2by,w:d2bw,h:0.28,fill:{color:"EDE9FE"},line:{type:"none"}});
    sSX.addText("VISION CIBLE — DAY 2",{x:d2bx+0.14,y:d2by+0.05,w:3.2,h:0.20,fontSize:9,bold:true,color:"7C3AED",fontFace:"Calibri",charSpacing:1,margin:0});
    sSX.addText(sxD2Def+" définies / "+apps.length,{x:d2bx+d2bw-1.55,y:d2by+0.05,w:1.45,h:0.18,fontSize:8,color:"94A3B8",fontFace:"Calibri",align:"right",margin:0});
    sxDrawBars(sSX,d2bx+0.15,d2by+0.36,d2bw-0.30,d2Stats2,apps.length);
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
    if(_opts.inclDomainStatus){
      const d1Colors={"Transfert TSA":"F59E0B","Abandon":"EF4444","Non défini":"94A3B8"};
      const d2Colors={"Clone & Clean":"3B82F6","Transfert":"10B981","Rebuild":"8B5CF6","Abandon":"EF4444","Non défini":"94A3B8"};
      [
        {label:"CARTOGRAPHIE PAR DOMAINE — STATUT DAY 1 (CLOSING)",field:"statusD1",colorMap:d1Colors,legend:[["Transfert TSA","F59E0B"],["Abandon","EF4444"],["Non défini","94A3B8"]]},
        {label:"CARTOGRAPHIE PAR DOMAINE — STATUT DAY 2 (CIBLE)",field:"statusD2",colorMap:d2Colors,legend:[["Clone & Clean","3B82F6"],["Transfert","10B981"],["Rebuild","8B5CF6"],["Abandon","EF4444"],["Non défini","94A3B8"]]},
      ].forEach(function(cfg){
        const dsSlide=SS(pres.addSlide());
        dsSlide.background={color:"F8F9FC"};
        // Header
        dsSlide.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.50,fill:{color:cp},line:{type:"none"}});
        if(_opts.clientLogo){dsSlide.addImage({data:_opts.clientLogo,x:9.05,y:0.04,w:0.90,h:0.42,sizing:{type:"contain",w:0.90,h:0.42}});}
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
          const sl=SS(pres.addSlide());
          sl.background={color:"F8F9FC"};
          sl.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.50,fill:{color:cp},line:{type:"none"}});
          if(_opts.clientLogo){sl.addImage({data:_opts.clientLogo,x:9.05,y:0.04,w:0.90,h:0.42,sizing:{type:"contain",w:0.90,h:0.42}});}
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

    }// end inclExecSlides

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
      const sC=pres.addSlide();
      sC.background={color:"FFFFFF"};
      const sW=13.333,sH=7.5;
      if(_opts.clientLogo){sC.addImage({data:_opts.clientLogo,x:12.10,y:0.10,w:1.00,h:0.48,sizing:{type:"contain",w:1.00,h:0.48}});}

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
        // Halo blanc élargi pour contraste sur croisements
        segs.forEach(s=>addLineSeg(s.x1,s.y1,s.x2,s.y2,false,"FFFFFF",width+2.3,false));
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
      const HEAD=0.20,dPad=0.06,aGap=0.03;

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
        const aWmax=0.95,aHmax=0.26;
        const aW=Math.min(aWmax,(innerW-aGap*(aCols-1))/aCols);
        const aH=Math.min(aHmax,Math.max(0.20,(innerH-aGap*(aRows-1))/aRows));
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
        sC.addShape(pres.shapes.RECTANGLE,{x:box.x,y:box.y,w:box.w,h:box.h,fill:{color:"F5F6FA"},line:{color:"D8DCE0",width:0.4}});
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
            const tA=nPairs===1?0.5:(i+1)/(nPairs+1);
            const tB=nPairs===1?0.5:(i+1)/(nPairs+1);
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

        // ── Pass 4 : Labels — placement intelligent par scoring (skipped si showLabels=false) ──
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
          // Clip segment to rect bounding box — if any part inside, it crosses
          const sx1=seg.x1,sy1=seg.y1,sx2=seg.x2,sy2=seg.y2;
          const minX=Math.min(sx1,sx2),maxX=Math.max(sx1,sx2);
          const minY=Math.min(sy1,sy2),maxY=Math.max(sy1,sy2);
          // AABB overlap test
          if(maxX<rx||minX>rx+rw||maxY<ry||minY>ry+rh)return false;
          // For axis-aligned segments (most of ours), AABB test is sufficient
          if(Math.abs(sx2-sx1)<0.005||Math.abs(sy2-sy1)<0.005)return true;
          // For diagonal: check if segment endpoints are on same side of rect edges
          return true; // conservative — diagonal segments through rect count as crossing
        };
        // Trier par longueur de couloir desc : les flux longs ont plus de positions possibles, on les place après
        // les courts pour leur laisser de la place. INVERSE : court d'abord (peu de marge), puis long.
        flowMeta.sort((A,B)=>(A.channelSeg.w+A.channelSeg.h)-(B.channelSeg.w+B.channelSeg.h));
        flowMeta.forEach(({flow,channelSeg,channelAxis,p1,p2,lineColor})=>{
          // Pas d'ID dans le label — uniquement le libellé (ou protocole en fallback)
          const txt=flow.label||protoLabel(flow.protocol||"Autre");
          if(!txt)return;
          const lw=Math.min(1.4,Math.max(0.35,txt.length*0.045+0.08));
          const lh=0.14;
          // Construire un large set de candidats autour du couloir ET des jambes
          const cx0=channelSeg.x+channelSeg.w/2,cy0=channelSeg.y+channelSeg.h/2;
          const along=channelAxis==="X"
            ?[0.2,0.35,0.5,0.65,0.8].map(t=>({x:cx0,y:channelSeg.y+channelSeg.h*t}))
            :[0.2,0.35,0.5,0.65,0.8].map(t=>({x:channelSeg.x+channelSeg.w*t,y:cy0}));
          // Sur les jambes courtes (exit/entry legs)
          // Points along exit and entry legs (not just midpoints)
          const legPts=[];
          [0.25,0.5,0.75].forEach(t=>{
            legPts.push({x:p1.x+(cx0-p1.x)*t,y:p1.y+(cy0-p1.y)*t});
            legPts.push({x:cx0+(p2.x-cx0)*t,y:cy0+(p2.y-cy0)*t});
          });
          const candidates=[];
          const offsets=[
            [0,0],
            [0,-lh-0.04],[0,lh*0.5+0.04],
            [-lw/2-0.06,0],[lw/2+0.06,0],
            [-lw/2-0.06,-lh-0.04],[lw/2+0.06,-lh-0.04],
            [-lw/2-0.06,lh*0.5+0.04],[lw/2+0.06,lh*0.5+0.04]
          ];
          along.forEach(p=>{
            offsets.forEach(([ox,oy])=>{
              candidates.push({x:p.x-lw/2+ox,y:p.y-lh/2+oy});
            });
          });
          legPts.forEach(p=>{
            offsets.forEach(([ox,oy])=>{
              candidates.push({x:p.x-lw/2+ox,y:p.y-lh/2+oy});
            });
          });
          // Évaluer chaque candidat
          let bestR=null,bestScore=-Infinity;
          let fallbackR=null;
          for(const c of candidates){
            const r={x:c.x,y:c.y,w:lw,h:lh};
            const inCanvas=r.x>=CX-0.10&&r.x+r.w<=CX+CW+0.10&&r.y>=CY-0.05&&r.y+r.h<=CY+CH+0.05;
            const inLegend=showFlows&&r.x<CX+legW+0.05&&r.y+r.h>CY+CH-legH;
            if(!inCanvas||inLegend){if(!fallbackR&&r.x>=CX-0.3&&r.x+r.w<=CX+CW+0.3)fallbackR=r;continue;}
            // Reject if overlap with app box (HARD)
            if(labelRects.filter(p=>p._isApp).some(pl=>rectsOver(r,pl)))continue;
            // Score : distance min aux labels existants (+) et au point d'origine sur la ligne (−)
            let score=0;
            const overlaps=labelRects.filter(p=>!p._isApp&&rectsOver(r,p));
            if(overlaps.length>0)score-=overlaps.length*100; // strong penalty
            else {
              const minD=labelRects.filter(p=>!p._isApp).reduce((m,p)=>Math.min(m,rectDist(r,p)),9999);
              score+=Math.min(minD,0.5)*2;
            }
            // Penalize labels that cross flow line segments
            const flowCross=flowSegs.filter(s=>segCrossRect(s,r,0.02)).length;
            if(flowCross>0)score-=flowCross*30;
            // Slight preference : être proche du segment couloir (lisibilité)
            const dToChan=channelAxis==="X"
              ?Math.abs(r.x+r.w/2-cx0)
              :Math.abs(r.y+r.h/2-cy0);
            score-=dToChan*0.5;
            if(score>bestScore){bestScore=score;bestR=r;}
          }
          const chosen=bestR||fallbackR||{x:cx0-lw/2,y:cy0-lh/2,w:lw,h:lh};
          labelRects.push(chosen);
          sC.addShape(pres.shapes.RECTANGLE,{x:chosen.x-0.02,y:chosen.y-0.01,w:chosen.w+0.04,h:chosen.h+0.02,fill:{color:"FFFFFF"},line:{color:lineColor,width:0.4}});
          sC.addText(txt,{x:chosen.x,y:chosen.y,w:chosen.w,h:chosen.h,fontSize:6,color:lineColor,fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
        });
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
        const isArret=app.status==="Arrêt";
        const isGreyed=greyedIds&&greyedIds.has(id);
        if(isGreyed){
          sC.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:p.w,h:p.h,fill:{color:"F0F2F5"},line:{color:"C8CDD6",width:0.5}});
          var fSizeG=Math.min(7,p.w*6);
          sC.addText(app.name,{x:p.x+0.04,y:p.y,w:p.w-0.08,h:p.h,fontSize:fSizeG,bold:false,color:"9CA3AF",fontFace:"Calibri",margin:0,valign:"middle",align:"center",shrinkText:true,wrap:true});
        }else{
          sC.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:p.w,h:p.h,fill:{color:isArret?"FFEAEA":"FFFFFF"},line:{color:ac,width:0.8},shadow:{type:"outer",blur:1,offset:0.5,color:"000000",opacity:0.06,angle:135}});
          var fSize=Math.min(7,p.w*6);
          sC.addText(app.name,{x:p.x+0.05,y:p.y,w:p.w-0.1,h:p.h,fontSize:fSize,bold:true,color:isArret?"990000":"1A1A1A",fontFace:"Calibri",margin:0,valign:"middle",align:"center",shrinkText:true,wrap:true});
        }
      });

    };

    // ── Hub radial slide : hub au centre, voisins en couronne ──
    const drawHubRadialSlide=(hub,subset,subFlows,totalFlowCount)=>{
      const sC=pres.addSlide();
      sC.background={color:"FFFFFF"};
      const sW=13.333,sH=7.5;
      // Header bar
      sC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:sW,h:0.58,fill:{color:cp||"0B2545"},line:{type:"none"}});
      sC.addText("HUB · "+hub.name.toUpperCase(),{x:0.3,y:0.10,w:sW-1.6,h:0.38,fontSize:16,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
      sC.addText((totalFlowCount||0)+" flux · "+hub.domain,{x:0.3,y:0.40,w:6,h:0.18,fontSize:8,color:"BFD7FF",fontFace:"Calibri",margin:0});
      if(_opts.clientLogo){sC.addImage({data:_opts.clientLogo,x:12.10,y:0.05,w:1.00,h:0.48,sizing:{type:"contain",w:1.00,h:0.48}});}
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
      // Ring geometry — adapt radii to number of neighbors
      var rx=Math.min(CW/2-1.0,Math.max(2.2,nN*0.38));
      var ry=Math.min(CH/2-0.55,Math.max(1.5,nN*0.24));
      const neighW=Math.min(1.55,Math.max(1.0,2.8-nN*0.04));
      const neighH=0.56;
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
      // Segment helper
      const seg=function(x1,y1,x2,y2,arrow,color,width){
        var w=Math.abs(x2-x1),h=Math.abs(y2-y1);
        if(w<0.004&&h<0.004)return;
        var o={x:Math.min(x1,x2),y:Math.min(y1,y2),w:w||0.001,h:h||0.001,line:{color:color,width:width,dashType:"solid"}};
        if(x2<x1)o.flipH=true;if(y2<y1)o.flipV=true;
        if(arrow){o.line.endArrowType="triangle";o.line.endArrowSize=6;}
        sC.addShape(pres.shapes.LINE,o);
      };
      // Draw edges (under nodes)
      sorted.forEach(function(a){
        var nf=neighFlows[a.id]||{out:0,in:0,protos:{}};
        var np=neighPos[a.id];
        var total=nf.out+nf.in;
        var domP=Object.entries(nf.protos).sort(function(a,b){return b[1]-a[1];})[0];
        var color=protoColor(domP?domP[0]:"Autre");
        if(total===0)return;
        var lineW=Math.min(3.2,1.2+(total-1)*0.28);
        var p1=edgePt(hubCx,hubCy,hubW,hubH,np.cx,np.cy);
        var p2=edgePt(np.cx,np.cy,np.w,np.h,hubCx,hubCy);
        var bidir=nf.out>0&&nf.in>0;
        if(bidir){
          var dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1;
          var ox=-dy/len*0.055,oy=dx/len*0.055;
          seg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,false,"FFFFFF",lineW+1.8);
          seg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,true,color,lineW);
          seg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,false,"FFFFFF",lineW+1.8);
          seg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,true,color,lineW);
        }else if(nf.out>0){
          seg(p1.x,p1.y,p2.x,p2.y,false,"FFFFFF",lineW+1.8);
          seg(p1.x,p1.y,p2.x,p2.y,true,color,lineW);
        }else{
          seg(p2.x,p2.y,p1.x,p1.y,false,"FFFFFF",lineW+1.8);
          seg(p2.x,p2.y,p1.x,p1.y,true,color,lineW);
        }
        // Count badge at midpoint
        var mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2;
        if(total>1){
          sC.addShape(pres.shapes.RECTANGLE,{x:mx-0.18,y:my-0.11,w:0.36,h:0.21,fill:{color:color},line:{type:"none"}});
          sC.addText("×"+total,{x:mx-0.18,y:my-0.11,w:0.36,h:0.21,fontSize:7.5,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
        }
      });
      // Neighbor boxes
      sorted.forEach(function(a){
        var np=neighPos[a.id];
        var domColor=(_pDC[a.domain]||_pDC.Autre).ac.replace("#","");
        var isArret=a.status==="Arrêt";
        // Domain color accent left strip
        sC.addShape(pres.shapes.RECTANGLE,{x:np.x,y:np.y,w:0.05,h:np.h,fill:{color:domColor},line:{type:"none"}});
        sC.addShape(pres.shapes.RECTANGLE,{x:np.x,y:np.y,w:np.w,h:np.h,fill:{color:isArret?"FFF0F0":"FFFFFF"},line:{color:isArret?"E06C75":domColor,width:1.0},shadow:{type:"outer",blur:2,offset:1,color:"000000",opacity:0.08,angle:135}});
        sC.addText(a.name,{x:np.x+0.08,y:np.y,w:np.w-0.12,h:np.h*0.62,fontSize:8,bold:true,color:isArret?"CC0000":"1A1A1A",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
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

    // ── Consolidated A : hub au centre, secteurs angulaires par domaine ──
    const drawConsolidatedSectorSlide=function(){
      if(apps.length===0)return;
      var sC=pres.addSlide();
      sC.background={color:"F8F9FA"};
      var sW=13.333,sH=7.5;
      sC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:sW,h:0.58,fill:{color:cp||"0B2545"},line:{type:"none"}});
      sC.addText("CARTOGRAPHIE CONSOLIDÉE — VUE PAR SECTEURS",{x:0.3,y:0.08,w:sW-2.5,h:0.28,fontSize:14,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
      sC.addText(apps.length+" applications · "+[...new Set(apps.map(function(a){return a.domain;}))].length+" domaines · "+flows.length+" flux",{x:0.3,y:0.37,w:7,h:0.17,fontSize:8,color:"BFD7FF",fontFace:"Calibri",margin:0});
      if(_opts.clientLogo){sC.addImage({data:_opts.clientLogo,x:12.10,y:0.05,w:1.00,h:0.48,sizing:{type:"contain",w:1.00,h:0.48}});}
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
        var isArret=a.status==="Arrêt";
        var isR1=ring1Ids.has(a.id);
        sC.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:p.w,h:p.h,fill:{color:isArret?"FFEAEA":isR1?"FFFFFF":"F0F2F7"},line:{color:isArret?"E06C75":dc,width:isR1?1.0:0.6},shadow:isR1?{type:"outer",blur:2,offset:1,color:"000000",opacity:0.09,angle:135}:undefined});
        sC.addShape(pres.shapes.RECTANGLE,{x:p.x,y:p.y,w:0.05,h:p.h,fill:{color:dc},line:{type:"none"}});
        sC.addText(a.name,{x:p.x+0.08,y:p.y,w:p.w-0.12,h:p.h,fontSize:isR1?7:6.5,bold:isR1,color:isArret?"990000":"1A1A1A",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
      });
      // Hub box (top layer)
      var hubDC=(_pDC[hub.domain]||_pDC.Autre).ac.replace("#","");
      sC.addShape(pres.shapes.RECTANGLE,{x:pos[hub.id].x,y:pos[hub.id].y,w:hubW,h:hubH,fill:{color:hubDC},line:{color:"FFFFFF",width:2.5},shadow:{type:"outer",blur:7,offset:2,color:"000000",opacity:0.20,angle:135}});
      sC.addText("★  "+hub.name,{x:pos[hub.id].x+0.06,y:pos[hub.id].y,w:hubW-0.12,h:hubH*0.60,fontSize:12,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",align:"center",valign:"middle",margin:0,shrinkText:true});
      sC.addText(hub.domain+" · "+(deg[hub.id]||0)+" flux",{x:pos[hub.id].x+0.06,y:pos[hub.id].y+hubH*0.57,w:hubW-0.12,h:hubH*0.43,fontSize:7,color:"D0E8FF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
    };

    // ── Consolidated C : hub au centre, clusters rectangulaires par domaine ──
    const drawConsolidatedRingSlide=function(){
      if(apps.length===0)return;
      var sC=pres.addSlide();
      sC.background={color:"FFFFFF"};
      var sW=13.333,sH=7.5;
      sC.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:sW,h:0.58,fill:{color:cp||"0B2545"},line:{type:"none"}});
      sC.addText("CARTOGRAPHIE CONSOLIDÉE — CLUSTERS PAR DOMAINE",{x:0.3,y:0.08,w:sW-2.5,h:0.28,fontSize:14,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
      sC.addText(apps.length+" applications · "+[...new Set(apps.map(function(a){return a.domain;}))].length+" domaines · "+flows.length+" flux",{x:0.3,y:0.37,w:7,h:0.17,fontSize:8,color:"BFD7FF",fontFace:"Calibri",margin:0});
      if(_opts.clientLogo){sC.addImage({data:_opts.clientLogo,x:12.10,y:0.05,w:1.00,h:0.48,sizing:{type:"contain",w:1.00,h:0.48}});}
      var CX=0.20,CY=0.68,CW=sW-0.40,CH=sH-0.78;
      var cx=CX+CW/2,cy=CY+CH/2;
      // Hub = app with most flows
      var degMap={};apps.forEach(function(a){degMap[a.id]=0;});
      flows.forEach(function(f){degMap[f.from]=(degMap[f.from]||0)+1;degMap[f.to]=(degMap[f.to]||0)+1;});
      var hub=apps.reduce(function(best,a){return(degMap[a.id]||0)>(degMap[best.id]||0)?a:best;},apps[0]);
      var hubW=1.60,hubH=0.70;
      var ring1Ids=new Set();
      flows.forEach(function(f){if(f.from===hub.id)ring1Ids.add(f.to);if(f.to===hub.id)ring1Ids.add(f.from);});
      // Cluster grid constants (app boxes inside clusters)
      var cAW=0.95,cAH=0.30,cGap=0.05,cHdr=0.22,cPad=0.08;
      // Build domain cluster info
      var domOrder=[...new Set(apps.filter(function(a){return a.id!==hub.id;}).map(function(a){return a.domain;}))].sort();
      var NDoms=domOrder.length;
      if(NDoms===0)return;
      var domInfo={};
      domOrder.forEach(function(d){
        var dApps=apps.filter(function(a){return a.domain===d&&a.id!==hub.id;}).sort(function(a,b){return a.name.localeCompare(b.name);});
        var k=dApps.length;
        var cols=k<=1?1:k<=4?2:3;
        var rows=Math.ceil(k/cols);
        domInfo[d]={dApps:dApps,k:k,cols:cols,rows:rows,cW:cPad*2+cols*cAW+(cols-1)*cGap,cH:cPad*2+cHdr+rows*cAH+(rows-1)*cGap};
      });
      // Ellipse radii for cluster centers — adapt to cluster sizes
      var maxCW=domOrder.reduce(function(m,d){return Math.max(m,domInfo[d].cW);},0);
      var maxCH=domOrder.reduce(function(m,d){return Math.max(m,domInfo[d].cH);},0);
      var rxEll=Math.min(CW/2-maxCW/2-0.10,Math.max(2.6,hubW/2+maxCW*0.55+NDoms*0.14));
      var ryEll=Math.min(CH/2-maxCH/2-0.10,Math.max(1.9,hubH/2+maxCH*0.55+NDoms*0.10));
      // Cluster center positions on ellipse
      var domPos={};
      domOrder.forEach(function(d,i){
        var ang=-Math.PI/2+2*Math.PI*i/NDoms;
        domPos[d]={ccx:cx+rxEll*Math.cos(ang),ccy:cy+ryEll*Math.sin(ang)};
      });
      // App positions within clusters (for per-app pos map)
      var pos={};
      pos[hub.id]={x:cx-hubW/2,y:cy-hubH/2,w:hubW,h:hubH,cx:cx,cy:cy};
      domOrder.forEach(function(d){
        var di=domInfo[d],dp=domPos[d];
        var bx=dp.ccx-di.cW/2,by=dp.ccy-di.cH/2;
        di.dApps.forEach(function(a,i){
          var col=i%di.cols,row=Math.floor(i/di.cols);
          var ax=bx+cPad+col*(cAW+cGap),ay=by+cPad+cHdr+row*(cAH+cGap);
          pos[a.id]={x:ax,y:ay,w:cAW,h:cAH,cx:ax+cAW/2,cy:ay+cAH/2};
        });
      });
      // Cluster-level position map (used for inter-cluster arrows)
      var clPos={"__hub__":{cx:cx,cy:cy,w:hubW,h:hubH}};
      domOrder.forEach(function(d){var di=domInfo[d],dp=domPos[d];clPos[d]={cx:dp.ccx,cy:dp.ccy,w:di.cW,h:di.cH};});
      // Helpers
      var edgePt=function(p,tx,ty){var dx=tx-p.cx,dy=ty-p.cy;if(Math.abs(dx)<0.001&&Math.abs(dy)<0.001)return{x:p.cx,y:p.cy};var sx=(p.w/2)/Math.abs(dx||0.001),sy=(p.h/2)/Math.abs(dy||0.001),s=Math.min(sx,sy)*0.95;return{x:p.cx+dx*s,y:p.cy+dy*s};};
      var drawSeg=function(x1,y1,x2,y2,arrow,color,width){var w=Math.abs(x2-x1),h=Math.abs(y2-y1);if(w<0.003&&h<0.003)return;var o={x:Math.min(x1,x2),y:Math.min(y1,y2),w:w||0.001,h:h||0.001,line:{color:color,width:width,dashType:"solid"}};if(x2<x1)o.flipH=true;if(y2<y1)o.flipV=true;if(arrow){o.line.endArrowType="triangle";o.line.endArrowSize=5;}sC.addShape(pres.shapes.LINE,o);};
      var addBadge=function(x,y,val,col){var bw=val>=10?0.26:0.20,bh=0.14;sC.addShape(pres.shapes.RECTANGLE,{x:x-bw/2,y:y-bh/2,w:bw,h:bh,fill:{color:col},line:{type:"none"}});sC.addText(String(val),{x:x-bw/2,y:y-bh/2,w:bw,h:bh,fontSize:6,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});};
      // Aggregate flows at cluster level (one arrow per inter-cluster pair)
      var getClKey=function(appId){return appId===hub.id?"__hub__":(apps.find(function(a){return a.id===appId;})||{domain:"__unk__"}).domain;};
      var clAgg={};
      flows.forEach(function(f){
        var sc=getClKey(f.from),tc=getClKey(f.to);
        if(!sc||!tc||sc===tc)return;
        var ka=sc<tc?sc:tc,kb=sc<tc?tc:sc;
        var k=ka+"|||"+kb;
        if(!clAgg[k])clAgg[k]={a:ka,b:kb,out:0,in:0};
        if(sc===ka)clAgg[k].out++;else clAgg[k].in++;
      });
      var flowCol=cp||"2979FF";
      // Layer 1: cluster backgrounds + domain headers + app boxes
      domOrder.forEach(function(d){
        var di=domInfo[d],dp=domPos[d];
        var dc=(_pDC[d]||_pDC.Autre).ac.replace("#","");
        var bx=dp.ccx-di.cW/2,by=dp.ccy-di.cH/2;
        // Cluster background
        sC.addShape(pres.shapes.RECTANGLE,{x:bx,y:by,w:di.cW,h:di.cH,fill:{color:"EEF2FB"},line:{color:dc,width:1.2},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:0.10,angle:135}});
        // Domain header band
        sC.addShape(pres.shapes.RECTANGLE,{x:bx,y:by,w:di.cW,h:cHdr,fill:{color:dc},line:{type:"none"}});
        sC.addText(d,{x:bx+0.05,y:by,w:di.cW-0.10,h:cHdr,fontSize:7,bold:true,color:"FFFFFF",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
        // App boxes in grid
        di.dApps.forEach(function(a,i){
          var col=i%di.cols,row=Math.floor(i/di.cols);
          var ax=bx+cPad+col*(cAW+cGap),ay=by+cPad+cHdr+row*(cAH+cGap);
          var isArret=a.status==="Arrêt";
          var isR1=ring1Ids.has(a.id);
          sC.addShape(pres.shapes.RECTANGLE,{x:ax,y:ay,w:cAW,h:cAH,fill:{color:isArret?"FFEAEA":"FFFFFF"},line:{color:isArret?"E06C75":dc,width:isR1?0.9:0.6}});
          if(isR1){sC.addShape(pres.shapes.RECTANGLE,{x:ax,y:ay,w:0.05,h:cAH,fill:{color:dc},line:{type:"none"}});}
          sC.addText(a.name,{x:ax+(isR1?0.08:0.04),y:ay,w:cAW-(isR1?0.12:0.08),h:cAH,fontSize:isR1?6.5:6,bold:isR1,color:isArret?"990000":"1A1A1A",fontFace:"Calibri",align:"center",valign:"middle",margin:0,shrinkText:true});
        });
      });
      // Layer 2: inter-cluster arrows (drawn on top so arrowheads visible at cluster edges)
      Object.values(clAgg).forEach(function(ca){
        var pA=clPos[ca.a],pB=clPos[ca.b];if(!pA||!pB)return;
        var total=ca.out+ca.in;
        var lw=Math.min(2.8,1.0+total*0.16);
        var p1=edgePt(pA,pB.cx,pB.cy),p2=edgePt(pB,pA.cx,pA.cy);
        if(ca.out>0&&ca.in>0){
          var dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1;
          var ox=-dy/len*0.06,oy=dx/len*0.06;
          drawSeg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,false,"FFFFFF",lw+1.8);
          drawSeg(p1.x+ox,p1.y+oy,p2.x+ox,p2.y+oy,true,flowCol,lw);
          addBadge((p1.x+ox+p2.x+ox)/2,(p1.y+oy+p2.y+oy)/2,ca.out,flowCol);
          drawSeg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,false,"FFFFFF",lw+1.8);
          drawSeg(p2.x-ox,p2.y-oy,p1.x-ox,p1.y-oy,true,flowCol,lw);
          addBadge((p2.x-ox+p1.x-ox)/2,(p2.y-oy+p1.y-oy)/2,ca.in,flowCol);
        }else{
          var from=ca.out>0?p1:p2,to=ca.out>0?p2:p1;
          drawSeg(from.x,from.y,to.x,to.y,false,"FFFFFF",lw+1.8);
          drawSeg(from.x,from.y,to.x,to.y,true,flowCol,lw);
          addBadge((from.x+to.x)/2,(from.y+to.y)/2,total,flowCol);
        }
      });
      // Layer 3: hub box (topmost)
      var hubDC=(_pDC[hub.domain]||_pDC.Autre).ac.replace("#","");
      sC.addShape(pres.shapes.RECTANGLE,{x:pos[hub.id].x,y:pos[hub.id].y,w:hubW,h:hubH,fill:{color:hubDC},line:{color:"FFFFFF",width:2.5},shadow:{type:"outer",blur:7,offset:2,color:"000000",opacity:0.20,angle:135}});
      sC.addText("★  "+hub.name,{x:pos[hub.id].x+0.06,y:pos[hub.id].y,w:hubW-0.12,h:hubH*0.60,fontSize:12,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",align:"center",valign:"middle",margin:0,shrinkText:true});
      sC.addText(hub.domain+" · "+(degMap[hub.id]||0)+" flux",{x:pos[hub.id].x+0.06,y:pos[hub.id].y+hubH*0.57,w:hubW-0.12,h:hubH*0.43,fontSize:7,color:"D0E8FF",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
    };

    // ── Tableau récapitulatif des flux (paginé) ──
    const drawRecapTableSlides=()=>{
      const ROWS_PER_SLIDE=18;
      const SD1C={"Transfert TSA":"F59E0B","Abandon":"EF4444"};
      const SD2C={"Clone & Clean":"3B82F6","Transfert":"10B981","Abandon":"EF4444","Rebuild":"F97316"};
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
        const sT=pres.addSlide();
        sT.background={color:"FFFFFF"};
        const suffix=totalPages>1?" ("+(page+1)+"/"+totalPages+")":"";
        sT.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:13.333,h:0.55,fill:{color:cp||"0B2545"},line:{type:"none"}});
        sT.addText("RÉCAPITULATIF DES FLUX"+suffix,{x:0.3,y:0.10,w:12,h:0.35,fontSize:14,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0});
        if(_opts.clientLogo){sT.addImage({data:_opts.clientLogo,x:12.10,y:0.10,w:1.00,h:0.48,sizing:{type:"contain",w:1.00,h:0.48}});}
        const pageRows=rows.slice(page*ROWS_PER_SLIDE,(page+1)*ROWS_PER_SLIDE);
        const hdrOpts=function(txt){return {text:txt,options:{bold:true,fill:{color:"1E293B"},color:"FFFFFF",fontSize:8,fontFace:"Calibri",valign:"middle"}};};
        const header=[[hdrOpts("Domaine"),hdrOpts("App. Source"),hdrOpts("App. Cible"),hdrOpts("Flux / Protocole"),hdrOpts("Statut Day 1"),hdrOpts("Statut Day 2")]];
        const tblRows=pageRows.map(function(r,ri){
          const d1c=SD1C[r.fa.statusD1]||null;
          const d2c=SD2C[r.fa.statusD2]||null;
          const rowBg=ri%2===0?"FFFFFF":"F8FAFC";
          const cell=function(txt,extra){return {text:txt,options:Object.assign({fontSize:8,fontFace:"Calibri",valign:"middle",fill:{color:rowBg},color:"1E293B"},extra||{})};};
          const fluxTxt=[...r.protocols].join(", ")+(r.labels.filter(Boolean).length?" · "+r.labels.filter(Boolean).slice(0,3).join(", ")+(r.labels.filter(Boolean).length>3?" …":""):"");
          return [
            cell(r.fa.domain,{color:"6B7280",italic:true}),
            cell(r.fa.name,{bold:true}),
            cell(r.ta.name),
            cell(fluxTxt,{color:"475569",shrinkText:true}),
            cell(r.fa.statusD1||"—",d1c?{bold:true,color:d1c}:{color:"9CA3AF"}),
            cell(r.fa.statusD2||"—",d2c?{bold:true,color:d2c}:{color:"9CA3AF"}),
          ];
        });
        sT.addTable([...header,...tblRows],{x:0.25,y:0.65,w:12.83,colW:[2.0,2.60,2.60,3.00,1.30,1.33],border:{pt:0.4,color:"E2E8F0"},rowH:0.35});
        sT.addText("Données : "+rows.length+" paires d'applications · "+flows.length+" flux total · Généré le "+new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),{x:0.25,y:7.30,w:12.83,h:0.18,fontSize:7,color:"94A3B8",fontFace:"Calibri",margin:0,italic:true,align:"center"});
      }
    };

    // ── Vue agrégée domaine→domaine (diagramme circulaire d'interactions) ──
    const drawDomainFlowSlide=(title,subset,subFlows)=>{
      const sC=pres.addSlide();
      sC.background={color:"FFFFFF"};
      const sW=13.333,sH=7.5;
      sC.addText(title,{x:0.3,y:0.12,w:sW-0.6,h:0.5,fontSize:20,bold:true,color:"0B2545",fontFace:"Calibri",align:"center",valign:"middle",margin:0});
      if(_opts.clientLogo){sC.addImage({data:_opts.clientLogo,x:12.10,y:0.10,w:1.00,h:0.48,sizing:{type:"contain",w:1.00,h:0.48}});}
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
      const topHubs=sortedHubs.filter(function(a){return (appConn[a.id]||0)>0;}).slice(0,8);
      topHubs.forEach(function(hub){
        const neighborIds=new Set([hub.id]);
        flows.forEach(function(f){if(f.from===hub.id)neighborIds.add(f.to);if(f.to===hub.id)neighborIds.add(f.from);});
        const subset=apps.filter(function(a){return neighborIds.has(a.id);});
        const subFlows=flows.filter(function(f){return neighborIds.has(f.from)||neighborIds.has(f.to);}).filter(function(f){return f.from===hub.id||f.to===hub.id;});
        drawHubRadialSlide(hub,subset,subFlows,appConn[hub.id]||0);
      });
      if(topHubs.length===0){drawCartoSlide("Cartographie globale AS-IS",apps,[],false);drawCartoSlide("Cartographie globale — avec flux",apps,flows,true);}
    } else {
      // global (default)
      drawCartoSlide("URBANISATION — VUE D'ENSEMBLE",apps,[],false);
    }

    // ── Slide SYNTHÈSE GLOBALE (fonction réutilisable, pagination si saturé) ──
    var _sharedSynPos={};// hoisted: shared between drawSynthSlide and drawDetailedSynth
    var drawSynthSlide=function(synApps,synFlows,titleSuffix){
      var _synSatS={v:1.0};

      var synSl=pres.addSlide();// raw slide: synthesis computes directly in 13.333x7.5 wide space (no SS proxy)
      synSl.background={color:"F5F6FA"};
      synSl.addText("SYNTH\u00C8SE \u2014 CARTOGRAPHIE & FLUX"+(titleSuffix||""),{x:0.3,y:0.05,w:6,h:0.35,fontSize:13,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});
      if(_opts.clientLogo){synSl.addImage({data:_opts.clientLogo,x:12.10,y:0.10,w:1.00,h:0.48,sizing:{type:"contain",w:1.00,h:0.48}});}
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
    if(flows.length>0){
      // Dry-run check: estimate saturation by app count per slide width
      var estCols=0;
      [...new Set(apps.map(function(a){return a.domain;}))].forEach(function(d){
        var n=apps.filter(function(a){return a.domain===d;}).length;
        estCols+=n>8?2:1;
      });
      var estSat=estCols>14;// too many columns = will be squeezed
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
            var dSlide=SS(pres.addSlide());
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

        var detSlide=pres.addSlide();
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
    if(_opts.inclKPI){
    // ─── Slide 2: Vue d'ensemble KPIs ───
    const s2=SS(pres.addSlide());
    s2.background={color:"F5F6FA"};
    s2.addText("Vue d'ensemble",{x:0.6,y:0.3,w:8,h:0.6,fontSize:28,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});
    if(_opts.clientLogo){s2.addImage({data:_opts.clientLogo,x:9.05,y:0.04,w:0.90,h:0.42,sizing:{type:"contain",w:0.90,h:0.42}});}
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
    // ─── Slide 3: Synthèse compacte ───
    const catDomMap={};
    apps.forEach(a=>{
      const cat=a.category||"Autre";
      if(!catDomMap[cat]) catDomMap[cat]={};
      if(!catDomMap[cat][a.domain]) catDomMap[cat][a.domain]=[];
      catDomMap[cat][a.domain].push(a);
    });
    const cats=Object.keys(catDomMap);
    const hasCategories=cats.length>1||(cats.length===1&&cats[0]!=="Autre");
    const autoLayers={Commercial:"front",Marketing:"front",Finance:"metier",RH:"metier",Production:"metier",Logistique:"metier",IT:"support",Juridique:"support",Direction:"support",Autre:"support"};
    let zones;
    if(hasCategories){
      zones=cats.map(cat=>({name:cat,domains:Object.entries(catDomMap[cat]).map(([d,a])=>({name:d,apps:a}))}));
    } else {
      const lg={front:[],metier:[],support:[]};
      doms.forEach(d=>{const l=autoLayers[d]||"support";const da=apps.filter(a=>a.domain===d);if(da.length>0) lg[l].push({name:d,apps:da});});
      zones=[];
      if(lg.front.length>0) zones.push({name:"Front / Client",domains:lg.front});
      if(lg.metier.length>0) zones.push({name:"Métier / Opérations",domains:lg.metier});
      if(lg.support.length>0) zones.push({name:"Support / Transverse",domains:lg.support});
    }

    // Compact synthesis: categories as horizontal bands, domains as columns, apps as colored blocks
    // ALL apps must be visible — auto-paginate across multiple slides
    const sW=10,sH=5.625,sM=0.25;
    const aH=0.14,aGx=0.03,aGy=0.02; // app block dimensions

    // Pre-compute zone heights to know how to split across slides
    // Domain block inner structure: title=0.16, then app grid
    // Zone structure: title=0.22, then domain blocks with dH=zH-0.26
    // Apps start at dY+0.16, so app area height = dH-0.16 = zH-0.42
    // Need: maxRows*(aH+aGy) <= zH-0.42  =>  zH >= maxRows*(aH+aGy)+0.42
    const zoneHeights=zones.map(zone=>{
      const nd=zone.domains.length;
      const dW=((sW-sM*2-0.12)-(nd-1)*0.06)/nd;
      const aAreaW=dW-0.08;
      const aCols=Math.max(1,Math.floor(aAreaW/0.72));
      const maxRows=Math.max(...zone.domains.map(d=>Math.ceil(d.apps.length/aCols)));
      return Math.max(0.5,maxRows*(aH+aGy)+0.44);
    });

    // Paginate: pack zones into slides so they fit
    const slideZones=[]; // [[{zone,height},...],...]
    let curSlide=[],curH=0;
    const maxH=sH-0.7;
    zones.forEach((zone,zi)=>{
      const h=zoneHeights[zi]+0.08;
      if(curH+h>maxH&&curSlide.length>0){slideZones.push(curSlide);curSlide=[];curH=0;}
      curSlide.push({zone,height:zoneHeights[zi]});
      curH+=h;
    });
    if(curSlide.length>0) slideZones.push(curSlide);

    const sl3cp=_opts.clientPrimary||"2979FF";
    slideZones.forEach((szList,pageIdx)=>{
      const sl3=SS(pres.addSlide());
      sl3.background={color:"F8F9FC"};
      // Header bar avec couleur client
      sl3.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.50,fill:{color:sl3cp},line:{type:"none"}});
      if(_opts.clientLogo){sl3.addImage({data:_opts.clientLogo,x:9.05,y:0.04,w:0.90,h:0.42,sizing:{type:"contain",w:0.90,h:0.42}});}
      sl3.addText(pageIdx===0?"SYNTHÈSE — CARTOGRAPHIE APPLICATIVE":"SYNTHÈSE (SUITE "+(pageIdx+1)+"/"+slideZones.length+")",{x:sM,y:0.08,w:7.5,h:0.35,fontSize:13,bold:true,color:"FFFFFF",fontFace:"Trebuchet MS",margin:0,charSpacing:0.5});
      sl3.addText(apps.length+" applications · "+doms.length+" domaines · "+flows.length+" flux",{x:sM,y:0.54,w:5,h:0.16,fontSize:9,color:"64748B",fontFace:"Calibri",margin:0});
      let cy=0.76;

      szList.forEach(({zone,height},zi)=>{
        const zApps=zone.domains.reduce((s,d)=>s+d.apps.length,0);
        const zH=height;
        const zW=sW-sM*2;
        const zColor=["1B4332","3C1642","0B2545","6B2737","5C4B00","2C3333","4A1942","1A3636"][zi%8];

        // Category band
        sl3.addShape(pres.shapes.RECTANGLE,{x:sM,y:cy,w:zW,h:zH,fill:{color:"FFFFFF"},shadow:{type:"outer",blur:3,offset:1,color:"000000",opacity:0.06,angle:135}});
        sl3.addShape(pres.shapes.RECTANGLE,{x:sM,y:cy,w:0.04,h:zH,fill:{color:zColor}});
        sl3.addText(zone.name.toUpperCase(),{x:sM+0.1,y:cy+0.03,w:2.5,h:0.15,fontSize:10,bold:true,color:zColor,fontFace:"Calibri",charSpacing:1.5,margin:0});
        sl3.addText(zApps+" apps",{x:sM+zW-1.2,y:cy+0.03,w:1,h:0.15,fontSize:6,color:"999999",fontFace:"Calibri",align:"right",margin:0});

        // Domains as columns
        const nd=zone.domains.length;
        const dGap=0.06;
        const dAreaX=sM+0.06,dAreaW=zW-0.12;
        const dW=(dAreaW-(nd-1)*dGap)/nd;
        const dY=cy+0.22,dH=zH-0.26;

        zone.domains.forEach((dom,di)=>{
          const c=_pDC[dom.name]||_pDC.Autre;
          const ac=c.ac.replace("#",""),bg=c.bg.replace("#",""),fg=c.fg.replace("#","");
          const dx=dAreaX+di*(dW+dGap);

          // Domain block
          sl3.addShape(pres.shapes.RECTANGLE,{x:dx,y:dY,w:dW,h:dH,fill:{color:"EDEDED"}});
          sl3.addShape(pres.shapes.RECTANGLE,{x:dx,y:dY,w:dW,h:0.015,fill:{color:ac}});
          sl3.addText(dom.name.toUpperCase()+" ("+dom.apps.length+")",{x:dx+0.03,y:dY+0.02,w:dW-0.06,h:0.12,fontSize:5.5,bold:true,color:ac,fontFace:"Calibri",charSpacing:0.8,margin:0});

          // Apps as compact colored blocks — ALL apps rendered
          const aYstart=dY+0.16;
          const aAreaW=dW-0.08;
          const aCols=Math.max(1,Math.floor(aAreaW/0.72));
          const aW=Math.min(0.7,(aAreaW-(aCols-1)*aGx)/aCols);
          dom.apps.forEach((app,ai)=>{
            const col=ai%aCols,row=Math.floor(ai/aCols);
            const ax=dx+0.04+col*(aW+aGx);
            const ay2=aYstart+row*(aH+aGy);
            const stHex=(SC[app.status]||"#888").replace("#","");
            const isArret=app.status==="Arrêt";
            sl3.addShape(pres.shapes.RECTANGLE,{x:ax,y:ay2,w:aW,h:aH,fill:{color:isArret?"FF9999":"FFFFFF"},shadow:{type:"outer",blur:1,offset:0.5,color:"000000",opacity:0.1,angle:135}});
            sl3.addShape(pres.shapes.RECTANGLE,{x:ax,y:ay2+aH-0.025,w:aW,h:0.025,fill:{color:stHex}});
            sl3.addText(app.name,{x:ax+0.02,y:ay2,w:aW-0.04,h:aH-0.03,fontSize:4.5,bold:true,color:isArret?"990000":"1a1a1a",fontFace:"Calibri",margin:0,valign:"middle"});
          });
        });

        cy+=zH+0.08;
      });
    });

    // ─── Slides: One slide per domain ───
    doms.forEach(dom=>{
      const c=_pDC[dom]||_pDC.Autre;
      const domApps=apps.filter(a=>a.domain===dom);
      const cat=domApps[0]?.category||"";
      const bg=c.bg.replace("#",""),ac=c.ac.replace("#",""),fg=c.fg.replace("#","");

      // Table header row
      const mkHdr=()=>[[
        {text:"Application",options:{bold:true,fill:{color:bg},color:fg,fontSize:8}},
        {text:"Éditeur",options:{bold:true,fill:{color:bg},color:fg,fontSize:8}},
        {text:"Statut",options:{bold:true,fill:{color:bg},color:fg,fontSize:10,align:"center"}},
        {text:"Criticité",options:{bold:true,fill:{color:bg},color:fg,fontSize:10,align:"center"}}
      ]];

      // Paginate — 22 rows per slide for compact display
      const rowsPerPage=22;
      const pages=Math.ceil(domApps.length/rowsPerPage);
      for(let pg=0;pg<pages;pg++){
        const sl=SS(pres.addSlide());
        sl.background={color:"F5F6FA"};
        // Header bar
        sl.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.65,fill:{color:bg}});
        sl.addShape(pres.shapes.RECTANGLE,{x:0,y:0.63,w:10,h:0.03,fill:{color:ac}});
        const title=pg===0?dom.toUpperCase():dom.toUpperCase()+" ("+(pg+1)+"/"+pages+")";
        sl.addText(title,{x:0.5,y:0.1,w:5,h:0.45,fontSize:20,bold:true,color:fg,fontFace:"Trebuchet MS",margin:0});
        sl.addText(domApps.length+" applications"+(cat?" · "+cat:""),{x:6,y:0.15,w:3.5,h:0.35,fontSize:11,color:ac,fontFace:"Calibri",align:"right",margin:0});

        // Table
        const pageApps=domApps.slice(pg*rowsPerPage,(pg+1)*rowsPerPage);
        const tblRows=pageApps.map((app,ai)=>{
          const stHex=(SC[app.status]||"#888").replace("#","");
          const crHex=(CC[app.criticality]||"#999").replace("#","");
          const rowBg=app.status==="Arrêt"?"FF9999":ai%2===0?"FFFFFF":"F5F6FA";
          return [
            {text:app.name,options:{fontSize:7.5,bold:true,color:"333333",fill:{color:rowBg}}},
            {text:app.vendor||"—",options:{fontSize:7.5,color:"555555",fill:{color:rowBg}}},
            {text:app.status,options:{fontSize:10,color:app.status==="Arrêt"?"FFFFFF":stHex,align:"center",bold:true,fill:{color:app.status==="Arrêt"?"E06C75":stHex,transparency:app.status==="Arrêt"?0:85}}},
            {text:app.criticality,options:{fontSize:10,color:crHex,align:"center",fill:{color:rowBg}}}
          ];
        });
        sl.addTable([...mkHdr(),...tblRows],{x:0.4,y:0.8,w:9.2,colW:[3.5,2.5,1.6,1.6],border:{pt:0.5,color:"DDDDDD"},rowH:0.21});
      }
    });

    // ─── Final slide: Matrice des flux ───
    const sf=SS(pres.addSlide());
    sf.background={color:"F5F6FA"};
    sf.addText("Matrice des interfaces inter-domaines",{x:0.6,y:0.3,w:8,h:0.6,fontSize:24,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});
    if(_opts.clientLogo){sf.addImage({data:_opts.clientLogo,x:9.05,y:0.04,w:0.90,h:0.42,sizing:{type:"contain",w:0.90,h:0.42}});}
    const mtx={};flows.forEach(f=>{const fd=apps.find(a=>a.id===f.from)?.domain,td=apps.find(a=>a.id===f.to)?.domain;if(fd&&td)mtx[fd+"→"+td]=(mtx[fd+"→"+td]||0)+1;});
    const mHdr=[{text:"",options:{fill:{color:"0B2545"},fontSize:8}},...doms.map(d=>({text:d,options:{fill:{color:"0B2545"},color:"FFFFFF",fontSize:10,bold:true,align:"center"}}))];
    const mRows=doms.map(fr=>[{text:fr,options:{fontSize:10,bold:true,color:(_pDC[fr]||_pDC.Autre).ac.replace("#","")}},...doms.map(to=>{const v=mtx[fr+"→"+to]||0;return {text:v?String(v):"—",options:{fontSize:10,align:"center",color:v?"1a1a1a":"CCCCCC",fill:v?{color:(_pDC[fr]||_pDC.Autre).ac.replace("#",""),transparency:85}:{color:"FFFFFF"}}};})]);
    const cw=doms.length>0?(8.5/(doms.length+1)):1;
    sf.addTable([mHdr,...mRows],{x:0.5,y:1.1,w:9,colW:Array(doms.length+1).fill(cw),border:{pt:0.5,color:"DDDDDD"},rowH:0.32});


    if(_opts.inclRecapTable){drawRecapTableSlides();}
    if(_opts.inclLegend){
    // ─── Slide Légende ───
    const sLeg=SS(pres.addSlide());
    sLeg.background={color:"F5F6FA"};
    sLeg.addText("Légende",{x:0.6,y:0.3,w:4,h:0.5,fontSize:24,bold:true,color:"0B2545",fontFace:"Trebuchet MS",margin:0});
    if(_opts.clientLogo){sLeg.addImage({data:_opts.clientLogo,x:9.05,y:0.04,w:0.90,h:0.42,sizing:{type:"contain",w:0.90,h:0.42}});}

    // Criticité
    sLeg.addText("CRITICITÉ",{x:0.6,y:1.0,w:3,h:0.3,fontSize:10,bold:true,color:"0B2545",fontFace:"Calibri",margin:0});
    [["Haute","E06C75"],["Moyenne","D4A017"],["Basse","52B788"]].forEach(([l,c],i)=>{
      sLeg.addShape(pres.shapes.RECTANGLE,{x:0.6,y:1.35+i*0.35,w:0.3,h:0.2,fill:{color:c}});
      sLeg.addText(l,{x:1.0,y:1.35+i*0.35,w:2,h:0.2,fontSize:10,color:"333333",fontFace:"Calibri",margin:0});
    });

    // Statut
    sLeg.addText("STATUT",{x:3.5,y:1.0,w:3,h:0.3,fontSize:10,bold:true,color:"0B2545",fontFace:"Calibri",margin:0});
    [["Maintien","52B788","●"],["Arrêt","E06C75","\u25CC"],["Standalone temporaire","D4A017","\u25D0"],["Migrée","548CA8","\u25C7"],["Remplacée","9D4EDD","\u25C8"]].forEach(([l,c,ic],i)=>{
      sLeg.addText(ic+" "+l,{x:3.5,y:1.35+i*0.35,w:2.5,h:0.2,fontSize:10,color:c,fontFace:"Calibri",margin:0});
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

    pres.writeFile({fileName:"Cartographie_Applicative.pptx"});
  };

  const filtered=useMemo(()=>{let r=apps;if(selDom.length)r=r.filter(a=>selDom.includes(a.domain));if(selCat.length)r=r.filter(a=>selCat.includes(a.category||""));if(selStat.length)r=r.filter(a=>selStat.includes(a.status));if(selCrit.length)r=r.filter(a=>selCrit.includes(a.criticality));if(selD1)r=r.filter(a=>a.statusD1===selD1);if(selD2)r=r.filter(a=>a.statusD2===selD2);if(search){const s=search.toLowerCase();r=r.filter(a=>a.name.toLowerCase().includes(s)||a.domain.toLowerCase().includes(s)||(a.vendor||"").toLowerCase().includes(s));}return r;},[apps,selDom,selCat,selStat,selCrit,selD1,selD2,search]);
  const activeFilters=(selDom.length+selCat.length+selStat.length+selCrit.length)>0;
  const cats=[...new Set(apps.map(a=>a.category).filter(Boolean))];
  const doms=[...new Set(apps.map(a=>a.domain))];

  /* ── Components ── */
  const AW_BASE=130,AH_BASE=46;
  const fs=fontScale;
  const AW=Math.round(AW_BASE*globalScale*Math.max(1,fs*0.6)),AH=Math.round(AH_BASE*globalScale*Math.max(1,fs*0.5));
  const domSc=(d)=>(domScales[d]||1)*globalScale;
  const AppNode=({app})=>{const c=DC[app.domain]||DC.Autre;const sel=selApp?.id===app.id;
    const msel=multiSel.includes(app.id);
    const crC=CC[app.criticality]||"#999";
    const stC=SC[app.status]||"#888";
    // D1-driven color: if D1 is set, use D1 color for border/bandeau; else domain color
    const d1C=app.statusD1?(SD1[app.statusD1]||"#888"):null;
    const cardColor=d1C||c.ac||stC; // D1 color > domain accent > status
    const isNeg=app.statusD1==="Abandon"||(app.statusD2==="Abandon"&&!app.statusD1);
    const ds=domScales[app.domain]||1;
    const fsD=fs*ds;
    const aw=Math.round(AW_BASE*globalScale*ds*Math.max(1,fs*0.6)),ah=Math.round(AH_BASE*globalScale*ds*Math.max(1,fs*0.5));
    var isFocusTarget=!focusApp||focusApp===app.id||flows.some(function(f){return(f.from===focusApp&&f.to===app.id)||(f.to===focusApp&&f.from===app.id);});
    var dimmed=focusApp&&!isFocusTarget;
    var appOpacity=dimmed?0.18:isNeg?0.72:1;
    // D1 tint overlay on card background
    var d1BgTint=app.statusD1==="Abandon"?"#EF444412":app.statusD1==="Transfert TSA"?"#F59E0B0E":null;
    var crLabel=app.criticality==="Haute"?"●":app.criticality==="Basse"?"○":"◐";
    return <div style={{position:"absolute",left:app.x,top:app.y,width:aw,height:ah,background:c.bg,border:`${msel?"2.5px":"1.5px"} solid ${msel?"#4ECDC4":sel?"#fff":cardColor}`,borderRadius:4,cursor:cMode?"crosshair":selMode?"pointer":msel?"move":"grab",boxShadow:msel?"0 0 12px #4ECDC480":sel?`0 0 14px ${cardColor}80`:"0 1px 4px #00000040",userSelect:"none",zIndex:sel?10:1,overflow:"hidden",opacity:appOpacity,transition:"opacity 0.15s"}}
      data-app="1" className="app-card"
      onContextMenu={function(e){e.preventDefault();e.stopPropagation();setCtxMenu({x:e.clientX,y:e.clientY,type:"app",target:app.id});}}
      onMouseEnter={function(){if(!drag&&!cMode&&!selMode)setFocusApp(app.id);}}
      onMouseLeave={function(){if(focusApp===app.id)setFocusApp(null);}}
      onMouseDown={e=>{e.stopPropagation();if(cMode){if(!fFrom)setFFrom(app.id);else if(fFrom!==app.id){const nf={id:uid(),from:fFrom,to:app.id,protocol:"API",label:"",description:"",frequency:""};setFlows(p=>[...p,nf]);setEFlow({...nf});setShowFM(true);setFFrom(null);setCMode(false);}return;}if(e.shiftKey){setMultiSel(p=>p.includes(app.id)?p.filter(x=>x!==app.id):[...p,app.id]);return;}
        setMultiSel([]);setSelApp(app);const rect=e.currentTarget.getBoundingClientRect();setDrag({id:app.id,ox:e.clientX-rect.left,oy:e.clientY-rect.top});}}
      onDoubleClick={()=>{setEApp({...app});setShowAM(true);}}>

      {/* D1 tint overlay */}
      {d1BgTint&&<div style={{position:"absolute",inset:0,background:d1BgTint,pointerEvents:"none",zIndex:0}}/>}

      {/* D1 bandeau bas */}
      {app.statusD1&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:Math.max(7,Math.round(7*fsD)),background:d1C,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>
        <span style={{fontSize:Math.max(5,Math.round(5*fsD)),color:"#fff",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",opacity:0.97}}>{app.statusD1==="Transfert TSA"?"TSA":app.statusD1}</span>
      </div>}



      {/* Content */}
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 6px",height:"100%",position:"relative",zIndex:1}}>
        <div style={{overflow:"hidden",flex:1,minWidth:0}}>
          <div style={{color:c.fg,fontSize:Math.round(10*fsD),fontWeight:700,lineHeight:1.3,letterSpacing:"-0.015em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textDecoration:isNeg?"line-through":"none"}}>{app.name}</div>
          <div style={{color:c.fg+"99",fontSize:Math.round(8*fsD),lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{app.vendor||""}</div>
          {(app.statusD1||app.statusD2)&&<div style={{display:"flex",gap:3,marginTop:2,overflow:"hidden"}}>
            {app.statusD2&&<span style={{fontSize:Math.round(7*fsD),background:(SD2[app.statusD2]||"#3B82F6")+"28",color:SD2[app.statusD2]||"#3B82F6",border:"1px solid "+((SD2[app.statusD2]||"#3B82F6")+"66"),borderRadius:2,padding:"0 3px",fontWeight:700,lineHeight:1.5,flexShrink:0,whiteSpace:"nowrap"}}>{"D2:"+(app.statusD2==="Clone & Clean"?"Clone":app.statusD2)}</span>}
          </div>}
        </div>
        <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
          <span style={{color:crC,fontSize:Math.round(10*fsD),lineHeight:1}}>{crLabel}</span>
          <span style={{fontSize:Math.round(5.5*fsD),color:crC,fontWeight:600,lineHeight:1,whiteSpace:"nowrap"}}>{app.criticality==="Standalone temporaire"?"Stand.":app.criticality}</span>
        </div>
      </div>
    </div>;
  };
  const FlowLines=()=>{
    if(!focusApp&&!flowDomFilter)return null;
    var visFlows=flows;
    if(flowDomFilter){visFlows=visFlows.filter(function(f){var fa=apps.find(function(a){return a.id===f.from;});var ta=apps.find(function(a){return a.id===f.to;});return(fa&&fa.domain===flowDomFilter)||(ta&&ta.domain===flowDomFilter);});}
    if(focusApp){visFlows=visFlows.filter(function(f){return f.from===focusApp||f.to===focusApp;});}
    if(visFlows.length===0)return null;
    var defCol=isDark?"#548CA8":"#3D7A9E";
    var lineCol=flowColorCustom||defCol;
    var dashVal=flowDash==="dashed"?"8 4":flowDash==="dotted"?"3 3":"none";
    var clip=function(cx2,cy2,w,h,tx,ty){var ddx=tx-cx2,ddy=ty-cy2;if(Math.abs(ddx)<0.5&&Math.abs(ddy)<0.5)return{x:cx2,y:cy2};var sx2=Math.abs(ddx)>0.5?(w/2)/Math.abs(ddx):9999;var sy2=Math.abs(ddy)>0.5?(h/2)/Math.abs(ddy):9999;var s=Math.min(sx2,sy2);return{x:cx2+ddx*s,y:cy2+ddy*s};};
    return <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
      <defs>
        <marker id="ah" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" fill={lineCol}><polygon points="0 0,10 3.5,0 7"/></marker>
      </defs>
      {visFlows.map(function(f){var fa=apps.find(function(a){return a.id===f.from;}),ta=apps.find(function(a){return a.id===f.to;});if(!fa||!ta)return null;
        var x1=fa.x+AW/2,y1=fa.y+AH/2,x2=ta.x+AW/2,y2=ta.y+AH/2;
        var ep=clip(x1,y1,AW,AH,x2,y2);
        var en=clip(x2,y2,AW,AH,x1,y1);
        var mx=(ep.x+en.x)/2,my=(ep.y+en.y)/2-20;
        var txt=[f.label,f.protocol].filter(Boolean).join(" · ")||"";
        var lblW=Math.max(60,txt.length*flowFontSize*0.55+16);
        return <g key={f.id}>
          <path d={"M"+ep.x+" "+ep.y+" Q"+mx+" "+my+" "+en.x+" "+en.y} stroke="transparent" strokeWidth={Math.max(16,flowThickness*4)} fill="none" style={{cursor:"pointer",pointerEvents:"stroke"}}
            onClick={function(e){e.stopPropagation();setSelFlow(selFlow===f.id?null:f.id);setFlowCtx(null);}}
            onDoubleClick={function(e){e.stopPropagation();setEFlow(Object.assign({},f));setShowFM(true);setSelFlow(null);}}
            onContextMenu={function(e){e.preventDefault();e.stopPropagation();setFlowCtx({flow:f,x:e.clientX,y:e.clientY});setSelFlow(f.id);}}/>
          <path d={"M"+ep.x+" "+ep.y+" Q"+mx+" "+my+" "+en.x+" "+en.y} stroke={selFlow===f.id?"#fff":lineCol} strokeWidth={selFlow===f.id?flowThickness+1:flowThickness} strokeOpacity={selFlow===f.id?0.95:0.65} strokeDasharray={dashVal} fill="none" markerEnd="url(#ah)" style={{pointerEvents:"stroke",cursor:"pointer"}}
            onClick={function(e){e.stopPropagation();setSelFlow(selFlow===f.id?null:f.id);setFlowCtx(null);}}
            onDoubleClick={function(e){e.stopPropagation();setEFlow(Object.assign({},f));setShowFM(true);setSelFlow(null);}}
            onContextMenu={function(e){e.preventDefault();e.stopPropagation();setFlowCtx({flow:f,x:e.clientX,y:e.clientY});setSelFlow(f.id);}}/>
          <circle cx={ep.x} cy={ep.y} r={Math.max(3,flowThickness+1)} fill={lineCol} fillOpacity="0.8"/>
          {txt&&<g>
            <rect x={mx-lblW/2} y={my-flowFontSize*0.8} width={lblW} height={flowFontSize*1.5} rx="4" fill={T.bgCard} fillOpacity="0.92" stroke={lineCol} strokeWidth="0.5" strokeOpacity="0.3"/>
            <text x={mx} y={my+flowFontSize*0.25} fill={lineCol} fontSize={flowFontSize} textAnchor="middle" fontFamily="inherit" fontWeight="500" style={{pointerEvents:"none"}}>{txt}</text>
          </g>}
        </g>;})}
    </svg>;
  };

  const CAT_COLORS=["#548CA8","#D4A017","#E06C75","#52B788","#9D4EDD","#D63384","#7B78FF","#40A578"];
  const CategoryZones=()=>{
    // First compute domain bounding boxes with domPads
    const domBounds={};
    filtered.forEach(a=>{
      if(!domBounds[a.domain]) domBounds[a.domain]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity};
      const _ds=domScales[a.domain]||1;
      domBounds[a.domain].x1=Math.min(domBounds[a.domain].x1,a.x);
      domBounds[a.domain].y1=Math.min(domBounds[a.domain].y1,a.y);
      domBounds[a.domain].x2=Math.max(domBounds[a.domain].x2,a.x+Math.round(AW_BASE*globalScale*_ds));
      domBounds[a.domain].y2=Math.max(domBounds[a.domain].y2,a.y+Math.round(AH_BASE*globalScale*_ds));
    });
    // Apply domPads to domain bounds
    Object.entries(domBounds).forEach(([d,b])=>{
      const dp=domPads[d]||{w:0,h:0};
      b.x2+=dp.w;
      b.y2+=dp.h;
    });
    // Group domains by category using domain bounds
    const cats={};
    filtered.forEach(a=>{
      const cat=a.category;
      if(!cat) return;
      if(!cats[cat]) cats[cat]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity,domains:new Set(),ids:[]};
      const db=domBounds[a.domain];
      if(db){
        cats[cat].x1=Math.min(cats[cat].x1,db.x1);
        cats[cat].y1=Math.min(cats[cat].y1,db.y1);
        cats[cat].x2=Math.max(cats[cat].x2,db.x2);
        cats[cat].y2=Math.max(cats[cat].y2,db.y2);
      }
      cats[cat].domains.add(a.domain);
      cats[cat].ids.push(a.id);
    });
    const catEntries=Object.entries(cats);
    if(catEntries.length===0) return null;
    return <>{catEntries.map(([cat,b],ci)=>{
      const cc=CAT_COLORS[ci%CAT_COLORS.length];
      const pad=50;
      return <div key={cat} style={{position:"absolute",left:b.x1-pad,top:b.y1-pad-Math.round(32*fontScale),width:b.x2-b.x1+pad*2,height:b.y2-b.y1+pad*2+Math.round(32*fontScale),border:`2px solid ${cc}30`,borderRadius:14,background:`${cc}06`,pointerEvents:"none"}}>
        {/* Category title bar */}
        <div style={{position:"absolute",top:-1,left:-1,right:-1,height:Math.round(28*fontScale),background:`${cc}18`,borderRadius:"14px 14px 0 0",borderBottom:`1px solid ${cc}25`,display:"flex",alignItems:"center",padding:"0 14px",pointerEvents:"auto",cursor:"grab",userSelect:"none"}}
          data-app="1" onMouseDown={e=>{e.stopPropagation();setDrag({domain:"__cat__"+cat,appIds:b.ids,lastX:e.clientX,lastY:e.clientY});}}
          onContextMenu={e=>{e.preventDefault();e.stopPropagation();setCtxMenu({x:e.clientX,y:e.clientY,type:"category",target:cat});}}>
          <span style={{fontSize:Math.round(11*fontScale),fontWeight:700,color:cc,letterSpacing:1.5,textTransform:"uppercase"}}>{cat}</span>
          <span style={{fontSize:Math.round(9*fontScale),color:cc+"88",marginLeft:8}}>{b.domains.size} domaines · {b.ids.length} apps</span>
          <span style={{fontSize:10,opacity:0.5,color:cc,marginLeft:6}}>⠿</span>
        </div>
        {/* Corner accent marks */}
        <div style={{position:"absolute",top:Math.round(28*fontScale),left:0,width:20,height:2,background:cc,borderRadius:"0 2px 2px 0"}}/>
        <div style={{position:"absolute",top:Math.round(28*fontScale),right:0,width:20,height:2,background:cc,borderRadius:"2px 0 0 2px"}}/>
        <div style={{position:"absolute",bottom:0,left:0,width:20,height:2,background:cc,borderRadius:"0 2px 2px 0"}}/>
        <div style={{position:"absolute",bottom:0,right:0,width:20,height:2,background:cc,borderRadius:"2px 0 0 2px"}}/>
      </div>;
    })}</>;
  };

  const DomainZones=()=>{const z={};filtered.forEach(a=>{if(!z[a.domain])z[a.domain]={x1:Infinity,y1:Infinity,x2:-Infinity,y2:-Infinity,ids:[]};z[a.domain].x1=Math.min(z[a.domain].x1,a.x);z[a.domain].y1=Math.min(z[a.domain].y1,a.y);const _ds=domScales[a.domain]||1;z[a.domain].x2=Math.max(z[a.domain].x2,a.x+Math.round(AW_BASE*globalScale*_ds));z[a.domain].y2=Math.max(z[a.domain].y2,a.y+Math.round(AH_BASE*globalScale*_ds));z[a.domain].ids.push(a.id);});
    const draggingApp=drag&&drag.id&&!drag.domain;
    return <>{Object.entries(z).map(([d,b])=>{const c=DC[d]||DC.Autre;const p=30;
      const dp=domPads[d]||{w:0,h:0};
      const zw=b.x2-b.x1+p*2+dp.w;
      const zh=b.y2-b.y1+p*2+Math.round(22*fontScale)+dp.h;
      const isDropTarget=draggingApp&&d!==(apps.find(a=>a.id===drag.id)||{}).domain;
      var _domBrd=isDropTarget?"2px dashed "+c.ac:domBorderW+"px dashed "+c.ac+"40";
      return <div key={d} style={{position:"absolute",left:b.x1-p,top:b.y1-p-Math.round(22*fontScale),width:zw,height:zh,border:_domBrd,borderRadius:12,background:isDropTarget?c.ac+"18":c.ac+"08",pointerEvents:"none",transition:"border 0.2s, background 0.2s"}}>
        <div style={{padding:"5px 12px",fontSize:Math.round(10*fontScale),fontWeight:700,color:c.ac,letterSpacing:1.5,textTransform:"uppercase",pointerEvents:"auto",cursor:"grab",userSelect:"none",display:"inline-block",borderRadius:"6px 6px 0 0",background:`${c.ac}15`}}
          data-app="1" onMouseDown={e=>{e.stopPropagation();setDrag({domain:d,appIds:b.ids,lastX:e.clientX,lastY:e.clientY});}}
          onContextMenu={e=>{e.preventDefault();e.stopPropagation();setCtxMenu({x:e.clientX,y:e.clientY,type:"domain",target:d});}}>{d} <span style={{fontSize:Math.round(8*fontScale),opacity:0.6}}>⠿</span>
          <span style={{marginLeft:6,cursor:"pointer",fontSize:Math.round(9*fontScale)}} onMouseDown={e=>{e.stopPropagation();e.preventDefault();}} onClick={e=>{e.stopPropagation();setShowDomEdit(d);}} title="Changer couleur">🎨</span></div>
        {/* Resize handle (coin) */}
        <div style={{position:"absolute",bottom:0,right:0,width:16,height:16,cursor:"nwse-resize",pointerEvents:"auto",display:"flex",alignItems:"center",justifyContent:"center"}}
          data-app="1" onMouseDown={e=>{e.stopPropagation();e.preventDefault();setDrag({resize:d,lx:e.clientX,ly:e.clientY});}}>
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
    const [statusFilter,setStatusFilter]=useState(""); // filter domain table by app status
    const clearTip=function(){setChartTip(null);};
    const hexToRgbCo=function(hex){var r=parseInt(hex.slice(1,3),16)||102,g=parseInt(hex.slice(3,5),16)||102,b=parseInt(hex.slice(5,7),16)||102;return r+","+g+","+b;};
    const toggleSection=(id)=>setHiddenSections(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
    const ALL_WIDGETS=["chart_status","chart_apps","chart_flux","chart_owner","carveout","flowreg"];
    const DEFAULT_SIZES={chart_status:"m",chart_apps:"m",chart_flux:"m",chart_owner:"m",carveout:"l",flowreg:"l"};
    const [widgetSizes,setWidgetSizes]=useState(function(){try{var s=localStorage.getItem("dash_sizes_"+(projectId||"default"));if(s)return Object.assign({},DEFAULT_SIZES,JSON.parse(s));}catch(e){}return Object.assign({},DEFAULT_SIZES);});
    const saveWidgetSizes=(sz)=>{setWidgetSizes(sz);try{localStorage.setItem("dash_sizes_"+(projectId||"default"),JSON.stringify(sz));}catch(e){}};
    const [hovWid,setHovWid]=useState(null);
    const [hiddenWidgets,setHiddenWidgets]=useState([]);
    const [widgetPos,setWidgetPos]=useState(function(){try{var s=localStorage.getItem("dash_pos_"+(projectId||"default"));if(s)return JSON.parse(s);}catch(e){}return{};});
    const saveWidgetPos=function(p){setWidgetPos(p);try{localStorage.setItem("dash_pos_"+(projectId||"default"),JSON.stringify(p));}catch(e){}};
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
    const CHART_TYPES_DEF={chart_status:"donut",chart_apps:"bar",chart_flux:"bar",chart_owner:"donut"};
    const [chartTypes,setChartTypes]=useState(Object.assign({},CHART_TYPES_DEF));
    const setChartType=function(id,t){setChartTypes(function(p){return Object.assign({},p,{[id]:t});});};
    const dm=[...new Set(apps.map(a=>a.domain))];
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
    var mkChartSwitch=function(id,extraOpts){
      var cur=chartTypes[id]||"donut";
      var opts=[{k:"donut",label:"Donut"},{k:"pie",label:"Camembert"},{k:"bar",label:"Histogramme"},{k:"area",label:"Aires"}].concat(extraOpts||[]);
      return <select
        value={cur}
        onClick={function(e){e.stopPropagation();}}
        onChange={function(e){e.stopPropagation();setChartType(id,e.target.value);}}
        style={{
          background:"rgba(0,0,0,0.55)",
          color:"#fff",
          border:"1px solid rgba(255,255,255,0.25)",
          borderRadius:5,
          padding:"3px 6px",
          fontSize:10,
          cursor:"pointer",
          backdropFilter:"blur(4px)",
          outline:"none",
          marginRight:4,
          appearance:"auto",
        }}
      >
        {opts.map(function(o){return <option key={o.k} value={o.k} style={{background:"#1A1A35",color:"#fff"}}>{o.label}</option>;})}
      </select>;
    };
    var ALL_WIDGETS_LIST=["chart_status","chart_apps","chart_flux","chart_owner","carveout","flowreg"];
    var getDefaultPos=function(id){
      var idx=ALL_WIDGETS_LIST.indexOf(id);
      var col=idx%2; var row=Math.floor(idx/2);
      return{x:col*520+16, y:row*400+16};
    };
    var getWidgetW=function(id){var size=widgetSizes[id]||DEFAULT_SIZES[id]||"m";return{s:340,m:500,l:1020}[size]||500;};
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
        <div style={{position:"absolute",top:12,right:12,zIndex:20,display:"flex",gap:3,alignItems:"center",opacity:isHov?1:0,transition:"opacity 0.12s",pointerEvents:isHov?"all":"none"}}>
          {chartSwitcher}
          {[{k:"s",t:"Compact"},{k:"m",t:"Moyen"},{k:"l",t:"Large"}].map(function(sz){
            var isAct=size===sz.k;
            return <button key={sz.k} onClick={function(e){e.stopPropagation();var ns=Object.assign({},widgetSizes);ns[id]=sz.k;saveWidgetSizes(ns);}}
              style={{background:isAct?"rgba(255,255,255,0.25)":"rgba(0,0,0,0.4)",border:"1px solid "+(isAct?"rgba(255,255,255,0.5)":"transparent"),borderRadius:4,padding:"2px 7px",fontSize:9,cursor:"pointer",color:"#fff",fontWeight:isAct?700:400,backdropFilter:"blur(4px)"}}
              title={sz.t}>{sz.k.toUpperCase()}</button>;
          })}
          <button onClick={function(e){e.stopPropagation();setExpandedWidget(id);}}
            style={{background:"rgba(0,0,0,0.4)",border:"1px solid transparent",borderRadius:4,padding:"2px 8px",fontSize:13,cursor:"pointer",color:"rgba(255,255,255,0.8)",backdropFilter:"blur(4px)"}}
            title="Agrandir">⛶</button>
          <button onClick={function(e){e.stopPropagation();setHiddenWidgets(function(p){return[...p,id];});}}
            style={{background:"rgba(0,0,0,0.4)",border:"1px solid transparent",borderRadius:4,padding:"3px 7px",cursor:"pointer",color:"rgba(255,255,255,0.8)",backdropFilter:"blur(4px)",marginLeft:2,display:"flex",alignItems:"center",justifyContent:"center"}}
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
          {hiddenWidgets.length>0&&<button onClick={function(){setHiddenWidgets([]);}} style={{background:T.bgAlt,border:"1px solid "+T.border,color:T.fg,borderRadius:5,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            👁 Afficher ({hiddenWidgets.length})
          </button>}
          <button onClick={function(){saveWidgetPos({});saveWidgetSizes(Object.assign({},DEFAULT_SIZES));setHiddenWidgets([]);setWZIndex({});}} style={{background:"transparent",border:"1px solid "+T.border,color:T.fgMuted,borderRadius:5,padding:"6px 12px",fontSize:11,cursor:"pointer"}} title="Réinitialiser la disposition">↺ Reset</button>
        </div>
      </div>
      {/* KPIs — barre horizontale unifiée */}
      {function(){
        var ratio=tot>0?(totF/tot).toFixed(1):"0";
        var kpis=[
          {l:"Applications",v:tot,c:"#2979FF",glow:"rgba(41,121,255,0.18)",icon:"▣",key:""},
          {l:"Interfaces",v:totF,c:"#00C853",glow:"rgba(0,200,83,0.18)",icon:"⇄",key:""},
          {l:"Domaines",v:dm.length,c:"#7C4DFF",glow:"rgba(124,77,255,0.18)",icon:"◉",key:""},
          {l:"Critiques",v:totC,c:"#FF5252",glow:"rgba(255,82,82,0.18)",icon:"⚠",key:"critiques"},
          {l:"Ratio flux/app",v:ratio,c:"#EF6C00",glow:"rgba(239,108,0,0.18)",icon:"∿",key:""},
        ];
        return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:24}}>
          {kpis.map(function(k){
            var isActive=k.key&&quickFilter===k.key;
            var clickable=!!k.key;
            return <div key={k.l}
              onClick={clickable?function(){setQuickFilter(function(p){return p===k.key?"":k.key;});}:undefined}
              style={{background:T.bgCard,borderRadius:10,padding:"14px 16px",boxShadow:isActive?"0 0 0 2px "+k.c+", 0 4px 20px "+k.glow:"0 0 0 1px "+T.border+", 0 4px 16px "+k.glow,display:"flex",alignItems:"center",gap:12,transition:"box-shadow 0.15s, transform 0.1s",cursor:clickable?"pointer":"default",transform:isActive?"scale(1.02)":"scale(1)"}}>
              <div style={{width:36,height:36,borderRadius:8,background:k.glow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:k.c,flexShrink:0}}>{k.icon}</div>
              <div>
                <div style={{fontSize:22,fontWeight:700,color:k.c,lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:10,color:T.fgMuted,marginTop:3,lineHeight:1.2}}>{k.l}</div>
              </div>
              {isActive&&<div style={{marginLeft:"auto",fontSize:8,color:k.c,border:"1px solid "+k.c,borderRadius:4,padding:"1px 4px",fontWeight:700}}>✕</div>}
            </div>;
          })}
        </div>;
      }()}
      
      <div style={{position:"relative",width:"100%",minHeight:1800}}>
      {ALL_WIDGETS_LIST.filter(function(id){return!hiddenWidgets.includes(id);}).map(function(sid){
        if(sid==="chart_status")return wrapWidget(sid,"#00C853","Répartition par statut",null,function(isExpanded,ww,wh){
          var SC2={"Maintien":"#00C853","Arrêt":"#FF5252","Standalone temporaire":"#EF6C00","Migrée":"#2979FF","Remplacée":"#7C4DFF"};
          var total2=apps.length||1;var slices=[];
          ["Maintien","Arrêt","Standalone temporaire","Migrée","Remplacée"].forEach(function(s){var n=apps.filter(function(a){return a.status===s;}).length;if(n>0)slices.push({name:s,value:n,pct:Math.round(n/total2*100),color:SC2[s]||"#888"});});
          var ctype=chartTypes[sid]||"donut";
          var isHovSt=hovSlice&&hovSlice.id==="status";
          var cw=ww||500;var isNarrow=!isExpanded&&cw<420;
          var donutSz=isExpanded?320:Math.min(140,Math.max(96,cw/2.6));
          var donutR=Math.round(donutSz*0.434);var donutIr=Math.round(donutSz*0.276);
          var donutCx=Math.round(donutSz/2);var donutCy=Math.round(donutSz/2);
          var svgW=isExpanded?560:Math.max(160,cw-56);var svgH=isExpanded?320:150;
          var renderCircle=function(useHole){
            var arcs=buildArcs(slices,total2,donutCx,donutCy,donutR,useHole?donutIr:0);
            return <div style={{display:"flex",flexDirection:isNarrow?"column":"row",gap:isExpanded?28:(isNarrow?6:12),alignItems:isNarrow?"flex-start":"center",flex:isExpanded?1:undefined,minHeight:0}}>
              <svg width={donutSz} height={donutSz} viewBox={"0 0 "+(donutCx*2)+" "+(donutCy*2)} style={{flexShrink:0}} onMouseLeave={function(){setHovSlice(null);clearTip();}}>
                {arcs.map(function(p){
                  var h=isHovSt&&hovSlice.idx===p.idx;
                  var tx=h?Math.cos(p.mid)*6:0;var ty=h?Math.sin(p.mid)*6:0;
                  var op=isHovSt?(h?1:0.22):0.88;
                  return <path key={p.idx} d={p.d} fill={p.color} opacity={op} stroke={T.bg} strokeWidth="2.5"
                    transform={"translate("+tx.toFixed(1)+","+ty.toFixed(1)+")"}
                    style={{cursor:"pointer",transition:"opacity 0.12s"}}
                    onMouseMove={function(e){setHovSlice({id:"status",idx:p.idx});setChartTip({x:e.clientX,y:e.clientY,label:p.name,val:p.value+" apps",pct:p.pct});}}
                    onMouseLeave={function(){setHovSlice(null);clearTip();}}
                    onClick={function(){setStatusFilter(function(f){return f===p.name?"":p.name;})}}/>;
                })}
                {useHole&&<text x={donutCx} y={donutCy-3} textAnchor="middle" fill={T.fg} fontSize={isExpanded?34:Math.round(donutSz*0.17)} fontWeight="800">{apps.length}</text>}
                {useHole&&<text x={donutCx} y={donutCy+Math.round(donutSz*0.1)} textAnchor="middle" fill={T.fgMuted} fontSize={isExpanded?11:Math.max(6,Math.round(donutSz*0.055))} letterSpacing="0.08em">APPS</text>}
              </svg>
              <div style={{flex:1,minWidth:0,overflowY:"auto",maxHeight:isExpanded?360:(isNarrow?110:undefined)}}>
                {slices.map(function(sl){
                  var act=statusFilter===sl.name;
                  return <div key={sl.name} onClick={function(){setStatusFilter(function(f){return f===sl.name?"":sl.name;});}}
                    style={{display:"flex",alignItems:"center",gap:5,marginBottom:isNarrow?3:6,padding:isNarrow?"3px 5px":"4px 7px",borderRadius:5,cursor:"pointer",background:act?sl.color+"18":"transparent",border:"1px solid "+(act?sl.color+"55":"transparent"),transition:"all 0.12s"}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:sl.color,flexShrink:0}}/>
                    <span style={{fontSize:isExpanded?13:(isNarrow?9:10),color:act?sl.color:T.fg,flex:1,fontWeight:act?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sl.name}</span>
                    <span style={{fontSize:isExpanded?13:(isNarrow?10:11),fontWeight:700,color:sl.color,minWidth:16,textAlign:"right"}}>{sl.value}</span>
                    <span style={{fontSize:isExpanded?10:(isNarrow?8:9),color:T.fgMuted,minWidth:24,textAlign:"right"}}>{sl.pct}%</span>
                  </div>;
                })}
              </div>
            </div>;
          };
          var renderBar=function(){
            var sorted=[...slices].sort(function(a,b){return b.value-a.value;});
            var W=svgW;var H=svgH;var pad=32;var maxV=Math.max.apply(null,sorted.map(function(s){return s.value;}))||1;
            var barW=Math.floor((W-pad*2)/sorted.length*0.6);var gap=Math.floor((W-pad*2)/sorted.length);
            return <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              <svg width={W} height={H} style={{overflow:"visible"}}>
                {sorted.map(function(sl,i){
                  var bh=Math.max(4,(sl.value/maxV)*(H-60));
                  var x=pad+i*gap+gap/2-barW/2;var y=H-30-bh;
                  var h=isHovSt&&hovSlice&&hovSlice.idx===i;
                  return <g key={sl.name} style={{cursor:"pointer"}}
                    onMouseMove={function(e){setHovSlice({id:"status",idx:i});setChartTip({x:e.clientX,y:e.clientY,label:sl.name,val:sl.value+" apps",pct:sl.pct});}}
                    onMouseLeave={function(){setHovSlice(null);clearTip();}}
                    onClick={function(){setStatusFilter(function(f){return f===sl.name?"":sl.name;});}}>
                    <rect x={x} y={y} width={barW} height={bh} fill={sl.color} opacity={h?1:0.8} rx="3"/>
                    <text x={x+barW/2} y={y-5} textAnchor="middle" fill={sl.color} fontSize="11" fontWeight="700">{sl.value}</text>
                    <text x={x+barW/2} y={H-14} textAnchor="middle" fill={T.fgMuted} fontSize="9">{sl.name.length>8?sl.name.slice(0,7)+"…":sl.name}</text>
                  </g>;
                })}
              </svg>
            </div>;
          };
          var renderArea=function(){
            var sorted=[...slices].sort(function(a,b){return b.value-a.value;});
            var W=svgW;var H=svgH;var n=sorted.length;var maxV=Math.max.apply(null,sorted.map(function(s){return s.value;}))||1;
            if(n<2)return renderBar();
            var pts=sorted.map(function(sl,i){return{x:40+i*(W-80)/(n-1),y:(1-sl.value/maxV)*(H-60)+20,sl:sl};});
            var areaD="M"+pts[0].x+" "+(H-30)+" L"+pts.map(function(p){return p.x+" "+p.y;}).join(" L ")+" L"+pts[pts.length-1].x+" "+(H-30)+" Z";
            var lineD="M"+pts.map(function(p){return p.x+" "+p.y;}).join(" L ");
            var gradId="stg_"+sid;
            return <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              <svg width={W} height={H} style={{overflow:"visible"}}>
                <defs><linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={slices[0]?slices[0].color:"#00C853"} stopOpacity="0.5"/><stop offset="100%" stopColor={slices[0]?slices[0].color:"#00C853"} stopOpacity="0.04"/></linearGradient></defs>
                <path d={areaD} fill={"url(#"+gradId+")"} />
                <path d={lineD} fill="none" stroke={slices[0]?slices[0].color:"#00C853"} strokeWidth="2"/>
                {pts.map(function(p,i){return <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill={p.sl.color} stroke={T.bg} strokeWidth="2"
                    onMouseMove={function(e){setChartTip({x:e.clientX,y:e.clientY,label:p.sl.name,val:p.sl.value+" apps",pct:p.sl.pct});}}
                    onMouseLeave={clearTip}/>
                  <text x={p.x} y={p.y-10} textAnchor="middle" fill={p.sl.color} fontSize="10" fontWeight="700">{p.sl.value}</text>
                  <text x={p.x} y={H-14} textAnchor="middle" fill={T.fgMuted} fontSize="9">{p.sl.name.length>7?p.sl.name.slice(0,6)+"…":p.sl.name}</text>
                </g>;})}
              </svg>
            </div>;
          };
          return <div style={{background:T.bgCard,borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,0.14), 0 0 0 1px "+T.border,height:(isExpanded||wh)?"100%":undefined,display:(isExpanded||wh)?"flex":undefined,flexDirection:(isExpanded||wh)?"column":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:3,height:15,borderRadius:2,background:"#00C853",flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:700,color:T.fg}}>Répartition par statut</span>
              {statusFilter&&<button onClick={function(e){e.stopPropagation();setStatusFilter("");}} style={{background:"#FF525218",color:"#FF5252",border:"1px solid #FF525440",borderRadius:4,padding:"1px 7px",fontSize:9,cursor:"pointer",fontWeight:700}}>✕ {statusFilter}</button>}
            </div>
            <div style={{flex:isExpanded?1:undefined,minHeight:0}}>
              {ctype==="donut"?renderCircle(true):ctype==="pie"?renderCircle(false):ctype==="area"?renderArea():renderBar()}
            </div>
          </div>;
        },mkChartSwitch(sid));
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
        if(sid==="chart_flux")return wrapWidget(sid,"#2979FF","Flux par domaine",null,function(isExpanded,ww,wh){
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
        if(sid==="carveout")return wrapWidget(sid,"#F59E0B","Trajectoires D1/D2",null,<div style={{background:T.bgCard,borderRadius:8,padding:20,border:"1px solid #F59E0B44"}}>
        <SectionHdr id="carveout" title="Trajectoires Carve-Out — Suivi Day 1 / Day 2"/>
        {!hiddenSections.includes("carveout")&&function(){
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
          var d1Rows=["Transfert TSA","Abandon"];
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
              {[{title:"Day 1 — Closing",opts:["Transfert TSA","Abandon"],colors:SD1,field:"statusD1",defN:d1Def.length,ac:"#F59E0B"},{title:"Day 2 — Cible",opts:["Clone & Clean","Transfert","Abandon","Rebuild"],colors:SD2,field:"statusD2",defN:d2Def.length,ac:"#8B5CF6"}].map(function(cfg){
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
        <SectionHdr id="flowreg" title={"REGISTRE D'ÉCHANGES DES FLUX ("+flows.length+")"} extra={<span style={{fontSize:11,color:T.fgMuted}}>Séquencier technique complet des interconnexions IT</span>}/>
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
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead>
                <tr style={{borderBottom:"2px solid "+T.border}}>
                  <th style={{padding:"6px 8px",textAlign:"left",color:T.fgMuted,fontWeight:600,fontSize:9,textTransform:"uppercase"}}>ID</th>
                  <th style={{padding:"6px 8px",textAlign:"left",color:T.fgMuted,fontWeight:600,fontSize:9,textTransform:"uppercase"}}>Source</th>
                  <th style={{padding:"6px 2px",width:16}}></th>
                  <th style={{padding:"6px 8px",textAlign:"left",color:T.fgMuted,fontWeight:600,fontSize:9,textTransform:"uppercase"}}>Cible</th>
                  <th style={{padding:"6px 8px",textAlign:"center",color:T.fgMuted,fontWeight:600,fontSize:9,textTransform:"uppercase"}}>Protocole</th>
                  <th style={{padding:"6px 8px",textAlign:"left",color:T.fgMuted,fontWeight:600,fontSize:9,textTransform:"uppercase"}}>Fréquence</th>
                  <th style={{padding:"6px 8px",textAlign:"left",color:T.fgMuted,fontWeight:600,fontSize:9,textTransform:"uppercase"}}>Description</th>
                </tr>
              </thead>
              <tbody>{filtered2.map(function(e){
                var faAc=(DC[e.srcDom]||DC.Autre).ac;
                var taAc=(DC[e.tgtDom]||DC.Autre).ac;
                return <tr key={e.f.id} style={{borderBottom:"1px solid "+T.borderLight}}>
                  <td style={{padding:"8px",color:T.fgDim,fontSize:10,fontFamily:"monospace"}}>{"F-"+(e.f.order||e.fi+1)}</td>
                  <td style={{padding:"8px"}}><div style={{fontWeight:600,color:T.fg,fontSize:11}}>{e.srcName}</div><div style={{fontSize:9,color:faAc}}>{e.srcDom}</div></td>
                  <td style={{padding:"2px",textAlign:"center",color:T.fgFaint,fontSize:12}}>→</td>
                  <td style={{padding:"8px"}}><div style={{fontWeight:600,color:T.fg,fontSize:11}}>{e.tgtName}</div><div style={{fontSize:9,color:taAc}}>{e.tgtDom}</div></td>
                  <td style={{padding:"8px",textAlign:"center"}}><span style={{background:faAc+"20",color:faAc,padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:600}}>{e.proto||"?"}</span></td>
                  <td style={{padding:"8px",color:T.fg,fontSize:10}}>{e.freq||"\u2014"}</td>
                  <td style={{padding:"8px",color:T.fgMuted,fontSize:10,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.desc||"\u2014"}</td>
                </tr>;
              })}</tbody>
            </table></div>
          </div></div>;
        }()}
      </div>);
        return null;
      })}
      </div>

      {/* Détail par domaine — navigation par onglets */}
      {function(){
        var curDom=activeDomain||st[0]?.domain;
        var ds=st.find(function(d){return d.domain===curDom;})||st[0];
        if(!ds) return null;
        var c=DC[ds.domain]||DC.Autre;
        var flt=dbFilter[ds.domain]||{status:"",criticality:"",search:""};
        var setFlt=function(k,v){setDbFilter(function(p){var next=Object.assign({},p);next[ds.domain]=Object.assign({},flt);next[ds.domain][k]=v;return next;});};
        var filtApps=ds.apps.filter(function(a){
          if(flt.status&&a.status!==flt.status) return false;
          if(flt.criticality&&a.criticality!==flt.criticality) return false;
          if(flt.search&&!a.name.toLowerCase().includes(flt.search.toLowerCase())&&!(a.vendor||"").toLowerCase().includes(flt.search.toLowerCase())) return false;
          if(quickFilter==="critiques"&&a.criticality!=="Haute") return false;
          if(statusFilter&&a.status!==statusFilter) return false;
          return true;
        });
        return <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{fontSize:16,fontWeight:700,margin:0}}>Détail par domaine</h3>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {quickFilter&&<button onClick={function(){setQuickFilter("");}} style={{background:"#FF525215",color:"#FF5252",border:"1px solid #FF525240",borderRadius:5,padding:"4px 10px",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>⚠ Critiques uniquement <span style={{opacity:0.6}}>✕</span></button>}
              {statusFilter&&<button onClick={function(){setStatusFilter("");}} style={{background:"#2979FF15",color:"#2979FF",border:"1px solid #2979FF40",borderRadius:5,padding:"4px 10px",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>◉ {statusFilter} <span style={{opacity:0.6}}>✕</span></button>}
            </div>
          </div>
          {/* Onglets */}
          <div style={{display:"flex",gap:0,marginBottom:0,borderBottom:"2px solid "+T.border,overflowX:"auto",flexWrap:"nowrap"}}>
            {st.map(function(d){
              var dc=DC[d.domain]||DC.Autre;
              var isActive=d.domain===curDom;
              return <button key={d.domain} onClick={function(){setActiveDomain(d.domain);}} style={{background:"transparent",border:"none",borderBottom:isActive?"2px solid "+dc.ac:"2px solid transparent",marginBottom:-2,padding:"8px 14px",fontSize:11,fontWeight:isActive?700:500,color:isActive?dc.ac:T.fgMuted,cursor:"pointer",whiteSpace:"nowrap",transition:"color 0.15s",display:"flex",alignItems:"center",gap:5}}>
                <span>{d.domain}</span>
                <span style={{background:isActive?dc.ac+"20":T.border,color:isActive?dc.ac:T.fgDim,borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:700}}>{d.count}</span>
              </button>;
            })}
          </div>
          {/* Contenu de l'onglet actif */}
          <div style={{background:T.bgCard,borderRadius:"0 0 8px 8px",padding:20,borderLeft:"3px solid "+c.ac,border:"1px solid "+T.border,borderTop:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <span style={{fontSize:14,fontWeight:700,color:c.ac}}>{ds.domain}</span>
                <span style={{fontSize:11,color:T.fgMuted,marginLeft:10}}>{ds.count} apps · {ds.flows} flux · {ds.critical} critiques</span>
              </div>
            </div>
            {/* Filtres */}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
              <input placeholder="Rechercher..." value={flt.search||""} onChange={function(e){setFlt("search",e.target.value);}} style={{...I,width:140,padding:"4px 8px",fontSize:11}}/>
              <select value={flt.status||""} onChange={function(e){setFlt("status",e.target.value);}} style={{...I,width:130,padding:"4px 8px",fontSize:11}}>
                <option value="">Tous statuts</option>
                {["Maintien","Arrêt","Standalone temporaire","Migrée","Remplacée"].map(function(s){return <option key={s} value={s}>{s}</option>;})}
              </select>
              <select value={flt.criticality||""} onChange={function(e){setFlt("criticality",e.target.value);}} style={{...I,width:110,padding:"4px 8px",fontSize:11}}>
                <option value="">Toutes criticités</option>
                {["Haute","Moyenne","Basse"].map(function(cr){return <option key={cr} value={cr}>{cr}</option>;})}
              </select>
              {(flt.status||flt.criticality||flt.search)&&<button onClick={function(){setFlt("status","");setFlt("criticality","");setFlt("search","");}} style={{...B,padding:"3px 8px",fontSize:9,background:"#E06C7520",color:"#E06C75",borderRadius:3}}>✕</button>}
              <span style={{fontSize:10,color:T.fgDim}}>{filtApps.length}/{ds.count}</span>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:"1px solid "+T.border}}>{["Application","Statut","Criticité","Éditeur","Responsable","Flux sortants"].map(function(h){return <th key={h} style={{padding:"6px 8px",textAlign:"left",color:T.fgMuted,fontWeight:600}}>{h}</th>;})}</tr></thead>
              <tbody>{filtApps.map(function(app){var of2=flows.filter(function(f){return f.from===app.id;});return <tr key={app.id} style={{borderBottom:"1px solid "+T.borderLight}}>
                <td style={{padding:"6px 8px",fontWeight:500}}>{app.name}</td>
                <td style={{padding:"6px 8px",color:(SC[app.status]||"#888")}}>{app.status}</td>
                <td style={{padding:"6px 8px",color:CC[app.criticality]}}>{app.criticality}</td>
                <td style={{padding:"6px 8px",color:T.fgMuted}}>{app.vendor||"—"}</td>
                <td style={{padding:"6px 8px",color:T.fgMuted}}>{app.owner||"—"}</td>
                <td style={{padding:"6px 8px",color:"#548CA8"}}>{of2.length>0?of2.map(function(f){var n=(apps.find(function(a){return a.id===f.to;})||{}).name||"?";return f.label?n+" ("+f.label+")":n;}).join(", "):"—"}</td>
              </tr>;})}
              </tbody>
            </table>
          </div>
        </div>;
      }()}
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

  if(view==="home") return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:isDark?"linear-gradient(160deg,#08080F 0%,#0D0D20 50%,#0A0A1A 100%)":"linear-gradient(160deg,#F0F0FF 0%,#F7F7FF 100%)",position:"relative",overflow:"hidden",padding:"40px 20px"}}>

    {/* ── Réseau décoratif SVG en fond ── */}
    <svg aria-hidden="true" style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",opacity:isDark?0.07:0.05}} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      {[[80,90],[200,60],[340,120],[500,80],[650,130],[100,250],[260,210],[420,270],[580,220],[720,270],[60,400],[200,370],[360,420],[520,380],[680,410],[140,520],[320,500],[480,530],[640,490]].map(function(n,i){return <circle key={i} cx={n[0]} cy={n[1]} r={i<4?5:3.5} fill="#6366F1" fillOpacity={i<4?0.8:0.5}><animate attributeName="r" values={(i<4?5:3.5)+";"+(i<4?7:5)+";"+(i<4?5:3.5)} dur={(2.5+i*0.3)+"s"} repeatCount="indefinite"/></circle>;})}
      {[[0,1],[1,2],[2,3],[3,4],[0,5],[1,6],[2,7],[3,8],[4,9],[5,6],[6,7],[7,8],[8,9],[5,10],[6,11],[7,12],[8,13],[9,14],[10,11],[11,12],[12,13],[13,14],[10,15],[11,16],[12,17],[13,18]].map(function(e,i){var ns=[[80,90],[200,60],[340,120],[500,80],[650,130],[100,250],[260,210],[420,270],[580,220],[720,270],[60,400],[200,370],[360,420],[520,380],[680,410],[140,520],[320,500],[480,530],[640,490]];return <line key={i} x1={ns[e[0]][0]} y1={ns[e[0]][1]} x2={ns[e[1]][0]} y2={ns[e[1]][1]} stroke="#6366F1" strokeWidth="0.8" strokeOpacity="0.4"><animate attributeName="strokeOpacity" values="0.15;0.6;0.15" dur={(3+i*0.2)+"s"} begin={(i*0.15)+"s"} repeatCount="indefinite"/></line>;})}
    </svg>



    {/* ── Logo SVG Cartographe ── */}
    <div style={{marginBottom:20,position:"relative",zIndex:1}}>
      <div style={{display:"inline-block",borderRadius:20,padding:5,background:"linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.25))",boxShadow:"0 0 0 0 rgba(99,102,241,0.4)",animation:"homePulse 3s ease-in-out infinite"}}>
        <svg width="72" height="72" viewBox="0 0 64 64" fill="none" aria-label="Cartographe">
          <defs>
            <linearGradient id="hLg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1"/><stop offset="1" stopColor="#7C3AED"/>
            </linearGradient>
            <linearGradient id="hLb" x1="32" y1="1" x2="32" y2="31" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" stopOpacity="0.22"/><stop offset="1" stopColor="white" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="18" fill="url(#hLg)"/>
          <rect x="1" y="1" width="62" height="30" rx="17" fill="url(#hLb)"/>
          <rect x="0" y="32" width="64" height="32" rx="17" fill="rgba(0,0,0,0.08)"/>
          <line x1="32" y1="16" x2="16" y2="38" stroke="rgba(255,255,255,0.40)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="32" y1="16" x2="48" y2="38" stroke="rgba(255,255,255,0.40)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="16" y1="38" x2="48" y2="38" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="32" y1="16" x2="32" y2="50" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3.5"/>
          <line x1="16" y1="38" x2="10" y2="50" stroke="rgba(255,255,255,0.20)" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="48" y1="38" x2="54" y2="50" stroke="rgba(255,255,255,0.20)" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="32" cy="16" r="7" fill="white"/>
          <circle cx="32" cy="16" r="3.5" fill="url(#hLg)" opacity="0.5"/>
          <circle cx="16" cy="38" r="5.5" fill="rgba(255,255,255,0.92)"/>
          <circle cx="48" cy="38" r="5.5" fill="rgba(255,255,255,0.92)"/>
          <circle cx="32" cy="50" r="3.5" fill="rgba(255,255,255,0.65)"/>
          <circle cx="10" cy="50" r="2.5" fill="rgba(255,255,255,0.45)"/>
          <circle cx="54" cy="50" r="2.5" fill="rgba(255,255,255,0.45)"/>
        </svg>
      </div>
    </div>

    {/* ── Titre ── */}
    <div style={{textAlign:"center",marginBottom:8,position:"relative",zIndex:1}}>
      <h1 style={{fontSize:32,fontWeight:900,letterSpacing:"-0.04em",marginBottom:6,color:isDark?"#FFFFFF":T.fg}}>Cartographe</h1>
      <p style={{color:T.fgMuted,fontSize:13,lineHeight:1.7,maxWidth:440,margin:"0 auto"}}>Cartographie applicative pour due diligence IT &amp; audit.<br/>Choisissez comment démarrer votre projet.</p>
    </div>


    {/* ── Cartes d'action ── */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,width:"100%",maxWidth:780,position:"relative",zIndex:1,marginBottom:20}}>

      {/* Carte 1 — Import fichier */}
      <label style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:10,padding:"22px 20px",background:isDark?"rgba(41,121,255,0.10)":"rgba(41,121,255,0.07)",border:"1.5px solid "+(isDark?"rgba(41,121,255,0.35)":"rgba(41,121,255,0.3)"),borderRadius:14,cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(41,121,255,0.08),transparent)",pointerEvents:"none"}}/>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#2979FF,#1565C0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 16px rgba(41,121,255,0.4)",flexShrink:0,color:"#fff"}}>⬆</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.fg,marginBottom:4}}>Importer un fichier</div>
          <div style={{fontSize:11,color:T.fgMuted,lineHeight:1.5}}>Excel, CSV, TSV, ODS — mappage automatique des colonnes</div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:2}}>
          {["XLSX","CSV","XLS","ODS","TSV"].map(function(f){return <span key={f} style={{fontSize:9,padding:"2px 7px",background:"rgba(41,121,255,0.15)",borderRadius:4,color:"#64B5F6",border:"1px solid rgba(41,121,255,0.25)",fontWeight:700,letterSpacing:"0.05em"}}>{f}</span>;})}
        </div>
        <input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,.xlsb,.ods" style={{display:"none"}} onChange={function(e){e.target.files[0]&&handleFile(e.target.files[0]);}}/>
      </label>

      {/* Carte 2 — From scratch */}
      <button onClick={function(){setApps([]);setFlows([]);setView("mapping");}} style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:10,padding:"22px 20px",background:isDark?"rgba(99,102,241,0.10)":"rgba(99,102,241,0.07)",border:"1.5px solid rgba(99,102,241,0.35)",borderRadius:14,cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden",textAlign:"left",fontFamily:"inherit"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(99,102,241,0.08),transparent)",pointerEvents:"none"}}/>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#6366F1,#4F46E5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 16px rgba(99,102,241,0.4)",flexShrink:0,color:"#fff"}}>✦</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.fg,marginBottom:4}}>Créer from scratch</div>
          <div style={{fontSize:11,color:T.fgMuted,lineHeight:1.5}}>Canvas vierge — ajoutez vos applications manuellement</div>
        </div>
        <div style={{marginTop:"auto",fontSize:11,color:"#818CF8",fontWeight:600}}>Canvas vide →</div>
      </button>

      {/* Carte 3 — Charger JSON */}
      <label style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:10,padding:"22px 20px",background:isDark?"rgba(0,191,165,0.08)":"rgba(0,191,165,0.06)",border:"1.5px solid "+(isDark?"rgba(0,191,165,0.30)":"rgba(0,191,165,0.25)"),borderRadius:14,cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(0,191,165,0.06),transparent)",pointerEvents:"none"}}/>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#00BFA5,#00897B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 16px rgba(0,191,165,0.3)",flexShrink:0}}>📂</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.fg,marginBottom:4}}>Charger un export</div>
          <div style={{fontSize:11,color:T.fgMuted,lineHeight:1.5}}>Reprendre un projet sauvegardé au format .json</div>
        </div>
        <div style={{marginTop:"auto",fontSize:11,color:"#4DB6AC",fontWeight:600}}>Fichier .json →</div>
        <input type="file" accept=".json" style={{display:"none"}} onChange={function(e){e.target.files[0]&&loadJSON(e.target.files[0]);}}/>
      </label>
    </div>

    {/* ── Template d'import ── */}
    <div style={{width:"100%",maxWidth:780,position:"relative",zIndex:1,padding:"16px 18px",background:T.bgCard,borderRadius:12,border:"1px solid "+T.border,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div>
        <div style={{fontSize:12,fontWeight:700,color:"#52B788",marginBottom:3}}>📋 Template Excel</div>
        <div style={{fontSize:11,color:T.fgMuted}}>Pré-formaté avec exemples &amp; instructions</div>
      </div>
      <button onClick={downloadTemplate} style={{...B,background:"#52B788",padding:"8px 14px",whiteSpace:"nowrap",fontSize:11,flexShrink:0}}>⬇ .xlsx</button>
    </div>

    {/* ── Bouton thème ── */}
    <div style={{marginTop:24,position:"relative",zIndex:1}}>
      <button onClick={toggleTheme} style={{background:T.bgCard,color:T.fg,border:"1px solid "+T.border,padding:"8px 16px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600,boxShadow:T.shadow,transition:"all 0.2s"}}>{isDark?"☀️ Mode clair":"🌙 Mode sombre"}</button>
    </div>

    {/* ── Keyframes ── */}
    <style>{"@keyframes homePulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)}50%{box-shadow:0 0 0 12px rgba(99,102,241,0)}}"}</style>
  </div>;

  if(showSP&&shts.length>0) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:T.bgCard,borderRadius:8,padding:32,width:420,textAlign:"center"}}>
    <div style={{fontSize:32,marginBottom:12}}>📑</div><h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Fichier multi-feuilles</h2>
    <p style={{color:T.fgMuted,fontSize:12,marginBottom:20}}><strong style={{color:T.fg}}>{fName}</strong> — {shts.length} feuilles</p>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>{shts.map(nm=>{const ws=wbR.Sheets[nm],rng=ws["!ref"];const rc=rng?parseInt((rng.split(":")[1]||"").replace(/[A-Z]/g,"")||"0"):0;return <button key={nm} onClick={()=>loadSheet(wbR,nm)} style={{...B,background:T.bg,border:"1px solid "+T.border,padding:"12px 16px",display:"flex",justifyContent:"space-between",width:"100%"}}><span>📄 {nm}</span><span style={{fontSize:10,color:T.fgMuted}}>~{rc} lignes</span></button>;})}</div>
    <button onClick={()=>{setShowSP(false);setView("home");}} style={{...B,background:T.border,marginTop:16}}>← Retour</button>
  </div></div>;

  if(view==="import") return <div style={{minHeight:"100vh",padding:32,overflowY:"auto"}}><div style={{maxWidth:800,margin:"0 auto"}}>
    {/* Status banner */}
    {loadStatus?.stats&&<div style={{background:"#52B78815",border:"1px solid #52B78840",borderRadius:8,padding:16,marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{color:"#52B788",fontSize:16}}>✓</span><span style={{fontSize:13,fontWeight:700,color:"#52B788"}}>Fichier chargé avec succès</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[{l:"Applications",v:loadStatus.stats.apps,c:"#548CA8"},{l:"Domaines",v:loadStatus.stats.domains,c:"#9D4EDD"},{l:"Flux détectés",v:loadStatus.stats.flows,c:"#52B788"},{l:"Champs mappés",v:loadStatus.stats.mappedFields+"/"+loadStatus.stats.totalFields,c:"#D4A017"}].map(k=>
          <div key={k.l} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div><div style={{fontSize:10,color:T.fgMuted,marginTop:2}}>{k.l}</div></div>)}
      </div>
      {loadStatus.stats.domainList&&<div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>{loadStatus.stats.domainList.map(d=>{const c=DC[d]||DC.Autre;return <span key={d} style={{fontSize:10,padding:"2px 8px",background:c.ac+"20",color:c.ac,borderRadius:4,border:"1px solid "+c.ac+"40"}}>{d} ({rawData?.filter(r=>r[cMap.domain]===d).length||0})</span>;})}</div>}
    </div>}
    <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Mapping des colonnes</h2>
    <p style={{color:T.fgMuted,fontSize:12,marginBottom:24}}>{fName&&<><strong style={{color:"#548CA8"}}>{fName}</strong> · </>}{rawData?.length} lignes · Vérifiez ou ajustez le mapping</p>
    <div style={{background:T.bgCard,borderRadius:8,padding:24}}>{FIELDS.map(({key,label,req})=><div key={key} style={{display:"flex",alignItems:"center",marginBottom:12,gap:16}}><div style={{width:200,fontSize:12,color:req?"#E8E8E8":"#888"}}>{label}{req&&<span style={{color:"#E06C75"}}> *</span>}</div><select value={cMap[key]||""} onChange={e=>setCMap(p=>({...p,[key]:e.target.value}))} style={{...I,flex:1,borderColor:cMap[key]?"#52B78860":"#333"}}><option value="">— Ignorer —</option>{rawHdr.map(h=><option key={h} value={h}>{h}</option>)}</select>{cMap[key]&&<span style={{color:"#52B788",fontSize:12}}>✓</span>}</div>)}</div>
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

  // ═══ PAYSAGE VIEW (treemap urbanistique) ═══
  if(view==="paysage"){
    var PV_W=1600,PV_H=900;
    var pvLayout=pvBuildLayout(apps,PV_W,PV_H);
    var pvDoms=[...new Set(apps.map(function(a){return a.domain;}))];
    // Drill-down : réutilise la vue Cartes filtrée sur le domaine cliqué.
    var pvDrill=function(dom){setActiveDomFilter(dom);setView("cards");};
    return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg}}>
      {/* ── Topbar ── */}
      <div style={{background:T.bgAlt,borderBottom:"1px solid "+T.border,padding:"10px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:T.fg,letterSpacing:"-0.025em",lineHeight:1}}>Vue Paysage</div>
          <div style={{color:T.fgMuted,fontSize:11,marginTop:2}}>{pvDoms.length} domaine{pvDoms.length>1?"s":""} · {apps.length} applications — surface ∝ nombre d'apps</div>
        </div>
        <div style={{flex:1}}/>
        <button onClick={function(){setView("mapping");setTimeout(fitCanvas,50);}} style={{...B,background:"#0EA5E9",padding:"6px 14px",fontSize:11,fontWeight:600,borderRadius:8,display:"flex",alignItems:"center",gap:5}}><span>&#8592;</span> Cartographie</button>
      </div>
      {/* ── Treemap SVG ── */}
      <div style={{flex:1,overflow:"hidden",padding:16,boxSizing:"border-box"}}>
        {apps.length===0?
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12}}>
            <div style={{fontSize:36,opacity:0.3}}>▦</div>
            <div style={{fontSize:14,fontWeight:600,color:T.fgMuted}}>Aucune application à cartographier</div>
          </div>
        :
          <svg viewBox={"0 0 "+PV_W+" "+PV_H} preserveAspectRatio="xMidYMid meet" style={{display:"block",width:"100%",height:"100%",background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,userSelect:"none"}}>
            {pvLayout.map(function(dom){
              var color=(DC[dom.domaine]||DC.Autre).ac;
              var isDomHover=pvHover==="d::"+dom.domaine;
              return <g key={"d-"+dom.domaine}>
                {/* Fond domaine */}
                <rect x={dom.rect.x+2} y={dom.rect.y+2} width={Math.max(0,dom.rect.w-4)} height={Math.max(0,dom.rect.h-4)} fill={color} fillOpacity={0.06} stroke={color} strokeOpacity={isDomHover?0.85:0.55} strokeWidth={1.5} rx={3}/>
                {/* Header domaine cliquable */}
                <g onMouseEnter={function(){setPvHover("d::"+dom.domaine);}} onMouseLeave={function(){setPvHover("");}} onClick={function(){pvDrill(dom.domaine);}} style={{cursor:"pointer"}}>
                  <rect x={dom.rect.x+2} y={dom.rect.y+2} width={Math.max(0,dom.rect.w-4)} height={26} fill={color} fillOpacity={isDomHover?0.3:0.18} rx={3}/>
                  {dom.rect.w>60&&<text x={dom.rect.x+10} y={dom.rect.y+18} style={{fontSize:14,fontWeight:700,fill:color,pointerEvents:"none"}}>{pvFitText(dom.domaine,dom.rect.w-46,9)}</text>}
                  {dom.rect.w>60&&<text x={dom.rect.x+dom.rect.w-10} y={dom.rect.y+18} textAnchor="end" style={{fontSize:12,fontWeight:600,fill:T.fg,pointerEvents:"none"}}>{dom.nbApps}</text>}
                </g>
                {/* Catégories (quartiers) */}
                {dom.quartiers.map(function(q){
                  var isQHover=pvHover==="q::"+dom.domaine+"::"+q.quartier;
                  return <g key={"q-"+q.quartier} onMouseEnter={function(){setPvHover("q::"+dom.domaine+"::"+q.quartier);}} onMouseLeave={function(){setPvHover("");}} onClick={function(e){e.stopPropagation();pvDrill(dom.domaine);}} style={{cursor:"pointer"}}>
                    <rect x={q.rect.x+1} y={q.rect.y+1} width={Math.max(0,q.rect.w-2)} height={Math.max(0,q.rect.h-2)} fill={isQHover?color:T.bg} fillOpacity={isQHover?0.18:1} stroke={color} strokeOpacity={isQHover?0.9:0.4} strokeWidth={isQHover?1.2:0.8} rx={2}/>
                    {q.rect.w>50&&q.rect.h>24&&<text x={q.rect.x+8} y={q.rect.y+16} style={{fontSize:11,fontWeight:600,fill:T.fg,pointerEvents:"none"}}>{pvFitText(q.quartier,q.rect.w-16,6.3)}</text>}
                    {q.rect.w>50&&q.rect.h>36&&<text x={q.rect.x+8} y={q.rect.y+30} style={{fontSize:9,fontWeight:500,fill:T.fgDim,pointerEvents:"none",letterSpacing:"0.06em"}}>{q.nbApps} app{q.nbApps>1?"s":""}</text>}
                  </g>;
                })}
              </g>;
            })}
          </svg>
        }
      </div>
    </div></div></AppCtx.Provider>;
  }

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
                var stC=SC[app.status]||"#888";
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

                  {/* Status row */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:Math.round(4*cz)}}>
                    <span style={{fontSize:Math.round(9*cz),color:stC,fontWeight:600,display:"flex",alignItems:"center",gap:2}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:stC,display:"inline-block",flexShrink:0}}/>
                      {app.status==="Standalone temporaire"?"Standalone":app.status}
                    </span>
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
          <span style={{background:"rgba(255,255,255,0.18)",color:"#fff",padding:"2px 8px",borderRadius:12,fontSize:10}}>{cardSelApp.status}</span>
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
    var k=fa.name+">>"+ta.name;
    if(!pairFlows[k])pairFlows[k]={from:fa,to:ta,flows:[],count:0};
    pairFlows[k].flows.push(f);pairFlows[k].count++;
  });
  var pairList=Object.values(pairFlows).sort(function(a,b){return b.count-a.count;});
  var filteredPairList=urbSelApp?pairList.filter(function(p){return p.from.id===urbSelApp.id||p.to.id===urbSelApp.id;}):pairList;
  var detailFlows=urbFlowPair?pairFlows[urbFlowPair]:null;

  return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div className="view-container" style={{flex:1,display:"flex",flexDirection:"column",background:T.bg}}>
    <UrbTopbar/>
    <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
      <div style={{maxWidth:urbExpanded?"100%":1100,margin:"0 auto",transition:"max-width 0.25s ease"}}>

        {/* Zone header */}
        <div style={{background:"linear-gradient(135deg,"+zoneCC.ac+","+zoneCC.ac+"CC)",color:"#fff",borderRadius:"12px 12px 0 0",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",animation:"cardIn 0.2s cubic-bezier(0.16,1,0.3,1)"}}>
          <span style={{fontSize:15,fontWeight:800,letterSpacing:"-0.02em"}}>{urbZone}</span>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:11,opacity:0.85}}>{zoneApps.length} app{zoneApps.length>1?"s":""}</span>
            <span style={{fontSize:11,opacity:0.85}}>{zoneFlowsOut.length+zoneFlowsIn.length} flux</span>
            <span style={{fontSize:11,opacity:0.85}}>{pairList.length} paires</span>
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

        {/* Main 2-col layout: quartiers left, flux right */}
        <div style={{display:"grid",gridTemplateColumns:urbExpanded?"1fr 1fr 1fr":"1fr 1fr",gap:0,border:"2px solid "+zoneCC.ac,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden",background:T.bgCard,transition:"grid-template-columns 0.25s ease"}}>

          {/* Left: quartiers */}
          <div style={{padding:14,borderRight:"1px solid "+T.border,gridColumn:urbExpanded?"span 1":"span 1"}}>
            <div style={{fontSize:10,fontWeight:700,color:T.fgDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Quartiers</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {quartierList.map(function(entry,qi){
                var cat=entry[0];var catApps=entry[1];
                return <div key={cat} style={{background:T.bgAlt,borderRadius:8,padding:"10px 12px",border:"1px solid "+T.border,animation:"cardIn 0.2s cubic-bezier(0.16,1,0.3,1) both",animationDelay:(qi*0.04)+"s"}}>
                  <div style={{fontSize:11,fontWeight:700,color:zoneCC.ac,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{cat} <span style={{color:T.fgMuted,fontWeight:400}}>({catApps.length})</span></div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {catApps.map(function(app){
                      var stC=SC[app.status]||"#888";
                      var nFlux=flows.filter(function(f){return f.from===app.id||f.to===app.id;}).length;
                      var isSelApp=urbSelApp&&urbSelApp.id===app.id;
                      return <div key={app.id} title={app.name+" · "+app.status+(nFlux>0?" · "+nFlux+" flux":"")} onClick={function(){setUrbSelApp(isSelApp?null:app);setUrbFlowPair(null);}}
                        style={{background:isSelApp?zoneCC.ac+"20":T.bgCard,border:"1.5px solid "+(isSelApp?zoneCC.ac:T.border),borderRadius:6,padding:"4px 7px",fontSize:11,color:T.fg,fontWeight:600,position:"relative",cursor:"pointer",transition:"transform 0.12s ease, box-shadow 0.12s ease",whiteSpace:"nowrap",userSelect:"none"}}
                        onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.2)";e.currentTarget.style.borderColor=zoneCC.ac;}}
                        onMouseLeave={function(e){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor=isSelApp?zoneCC.ac:T.border;}}>
                        <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:stC,marginRight:4,verticalAlign:"middle"}}/>
                        {app.name.length>18?app.name.slice(0,17)+"…":app.name}
                        {nFlux>0&&<span style={{position:"absolute",top:-5,right:-5,width:14,height:14,background:zoneCC.ac,color:"#fff",borderRadius:"50%",fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",border:"1.5px solid "+T.bgCard}}>{nFlux}</span>}
                      </div>;
                    })}
                  </div>
                </div>;
              })}
            </div>
          </div>

          {/* Right: flux */}
          <div style={{padding:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:T.fgDim,textTransform:"uppercase",letterSpacing:"0.08em"}}>
                Flux ({filteredPairList.length}{urbSelApp?" / "+pairList.length:""} paires)
                {urbSelApp&&<span style={{marginLeft:6,fontSize:10,fontWeight:600,color:zoneCC.ac,textTransform:"none"}}>— {urbSelApp.name}</span>}
              </div>
              {urbFlowPair&&<button onClick={function(){setUrbFlowPair(null);}} style={{fontSize:10,color:"#6366F1",background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:600}}>← Toutes les paires</button>}
            </div>

            {filteredPairList.length===0&&<div style={{fontSize:11,color:T.fgFaint,fontStyle:"italic",padding:"8px 0"}}>{urbSelApp?"Aucun flux pour cette application":"Aucun flux pour ce domaine"}</div>}

            {!urbFlowPair&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
              {filteredPairList.map(function(pair,pi){
                var fa=pair.from;var ta=pair.to;
                var faCC=DC[fa.domain]||DC.Autre;
                var taCC=DC[ta.domain]||DC.Autre;
                var isSameZone=fa.domain===urbZone&&ta.domain===urbZone;
                return <div key={pi} onClick={function(){setUrbFlowPair(fa.name+">>"+ta.name);}}
                  style={{background:T.bgAlt,borderRadius:8,padding:"8px 12px",border:"1px solid "+T.border,cursor:"pointer",transition:"background 0.12s, border-color 0.12s",animation:"cardIn 0.18s ease both",animationDelay:(pi*0.025)+"s"}}
                  onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;e.currentTarget.style.borderColor=zoneCC.ac+"80";}}
                  onMouseLeave={function(e){e.currentTarget.style.background=T.bgAlt;e.currentTarget.style.borderColor=T.border;}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:12,fontWeight:700,color:T.fg,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fa.name}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
                    <span style={{fontSize:12,fontWeight:700,color:T.fg,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{ta.name}</span>
                    <span style={{fontSize:10,background:"#6366F118",color:"#6366F1",border:"1px solid #6366F130",borderRadius:8,padding:"1px 7px",fontWeight:700,flexShrink:0}}>{pair.count}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                    <span style={{fontSize:10,color:faCC.ac,fontWeight:600}}>{isSameZone?"interne":fa.domain}</span>
                    <span style={{fontSize:10,color:taCC.ac,fontWeight:600}}>{isSameZone?"":ta.domain}</span>
                  </div>
                </div>;
              })}
            </div>}

            {detailFlows&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{fontSize:12,fontWeight:700,color:T.fg,marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                <span>{detailFlows.from.name}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
                <span>{detailFlows.to.name}</span>
              </div>
              {detailFlows.flows.map(function(f,fi){
                return <div key={fi} style={{background:T.bgAlt,borderRadius:8,padding:"8px 12px",border:"1px solid "+T.border,animation:"cardIn 0.18s ease both",animationDelay:(fi*0.03)+"s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#fff",background:"#6366F1",padding:"1px 8px",borderRadius:4}}>{f.protocol||"?"}</span>
                    {f.frequency&&<span style={{fontSize:10,color:T.fgMuted}}>{f.frequency}</span>}
                  </div>
                  {f.label&&<div style={{fontSize:11,color:T.fg,marginTop:4}}>{f.label}</div>}
                  {f.description&&<div style={{fontSize:10,color:T.fgDim,marginTop:2,lineHeight:1.4}}>{f.description}</div>}
                </div>;
              })}
            </div>}
          </div>
        </div>
      </div>
    </div>
  </div></div></AppCtx.Provider>;
  }


  if(view==="decisions"){
    var doms_dec=[...new Set(apps.map(function(a){return a.domain;}))].sort();
    var sd1c={"Transfert TSA":"#F59E0B","Abandon":"#EF4444"};
    var sd2c={"Clone & Clean":"#3B82F6","Transfert":"#10B981","Abandon":"#EF4444","Rebuild":"#F97316"};
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
  return <AppCtx.Provider value={ctxValue}><div style={{height:"100vh",display:"flex",overflow:"hidden"}}><Sidebar/><div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
    <div ref={toolbarRef} style={{background:T.bgAlt,borderBottom:"1px solid "+T.borderLight,padding:"8px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0,zIndex:200,flexWrap:"wrap",position:"relative"}}>
      <input placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} style={{...I,width:140}}/>
      {/* Dropdown filters */}
      {[
        {id:"domain",label:"Domaine",sel:selDom,setSel:setSelDom,items:doms.map(d=>({v:d,label:d,color:(DC[d]||DC.Autre).ac}))},
        {id:"category",label:"Catégorie",sel:selCat,setSel:setSelCat,items:cats.map(c=>({v:c,label:c,color:"#D63384"}))},
        {id:"status",label:"Statut",sel:selStat,setSel:setSelStat,items:["Maintien","Arrêt","Standalone temporaire","Migrée","Remplacée"].map(s=>({v:s,label:s==="Standalone temporaire"?"Standalone temp.":s,color:SC[s]||"#888"}))},
        {id:"criticality",label:"Criticité",sel:selCrit,setSel:setSelCrit,items:["Haute","Moyenne","Basse"].map(c=>({v:c,label:c,color:CC[c]||"#888"}))},
        {id:"d1",label:"Day 1",sel:selD1?[selD1]:[],setSel:function(updater){var prev=selD1?[selD1]:[];var next=typeof updater==="function"?updater(prev):updater;setSelD1(next.length?next[next.length-1]:"");},items:[{v:"Transfert TSA",label:"TSA",color:"#F59E0B"},{v:"Abandon",label:"Abandon",color:"#EF4444"}]},
        {id:"d2",label:"Day 2",sel:selD2?[selD2]:[],setSel:function(updater){var prev=selD2?[selD2]:[];var next=typeof updater==="function"?updater(prev):updater;setSelD2(next.length?next[next.length-1]:"");},items:[{v:"Clone & Clean",label:"Clone",color:"#3B82F6"},{v:"Transfert",label:"Transfert",color:"#10B981"},{v:"Abandon",label:"Abandon",color:"#EF4444"},{v:"Rebuild",label:"Rebuild",color:"#F97316"}]}
      ].map(flt=>{
        const isOpen=openFilter===flt.id;
        const count=flt.sel.length;
        const activeColor=count>0&&flt.sel[0]&&flt.items.find(it=>it.v===flt.sel[0])?.color||"#548CA8";
        return <div key={flt.id} style={{position:"relative"}}>
          <button onMouseDown={e=>{e.stopPropagation();setOpenFilter(isOpen?null:flt.id);}} style={{...B,padding:"4px 10px",fontSize:10,background:count>0?activeColor+"22":T.bgCard,color:count>0?activeColor:T.fgMuted,border:"1px solid "+(count>0?activeColor:T.border),borderRadius:4,display:"flex",alignItems:"center",gap:4}}>
            {flt.label}{count>0&&<span style={{background:activeColor,color:"#fff",fontSize:10,borderRadius:8,padding:"0 5px",lineHeight:"14px",minWidth:14,textAlign:"center"}}>{count}</span>}
            <span style={{fontSize:10,marginLeft:2}}>{isOpen?"▲":"▼"}</span>
          </button>
          {isOpen&&<div style={{position:"absolute",top:"100%",left:0,marginTop:4,background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:6,minWidth:180,zIndex:200,boxShadow:"0 4px 16px #00000060",maxHeight:240,overflowY:"auto"}} onMouseDown={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,padding:"2px 6px"}}>
              <span style={{fontSize:11,color:T.fgMuted}}>{flt.items.length} options</span>
              {flt.sel.length>0&&<span style={{fontSize:11,color:"#E06C75",cursor:"pointer"}} onMouseDown={e=>{e.stopPropagation();flt.setSel([]);}}>Effacer</span>}
            </div>
            {flt.items.map(it=>{
              const on=flt.sel.includes(it.v);
              const appCount=apps.filter(a=>flt.id==="domain"?a.domain===it.v:flt.id==="category"?a.category===it.v:flt.id==="status"?a.status===it.v:flt.id==="d1"?a.statusD1===it.v:flt.id==="d2"?a.statusD2===it.v:a.criticality===it.v).length;
              return <div key={it.v} onMouseDown={e=>{e.stopPropagation();flt.setSel(p=>on?p.filter(x=>x!==it.v):[...p,it.v]);}} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:4,cursor:"pointer",background:on?it.color+"18":"transparent",transition:"background 0.1s"}}
                onMouseEnter={e=>{if(!on)e.currentTarget.style.background="#ffffff08";}} onMouseLeave={e=>{e.currentTarget.style.background=on?it.color+"18":"transparent";}}>
                <div style={{width:14,height:14,borderRadius:4,border:`2px solid ${on?it.color:"#444"}`,background:on?it.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{on&&<span style={{color:"#fff",fontSize:9}}>✓</span>}</div>
                <div style={{width:8,height:8,borderRadius:2,background:it.color,flexShrink:0}}/>
                <span style={{fontSize:11,color:T.fg,flex:1}}>{it.label}</span>
                <span style={{fontSize:11,color:T.fgDim}}>{appCount}</span>
              </div>;})}
          </div>}
        </div>;})}
      {activeFilters&&<button onMouseDown={e=>{e.stopPropagation();setSelDom([]);setSelCat([]);setSelStat([]);setSelCrit([]);}} style={{...B,padding:"4px 8px",fontSize:11,background:"#FF525220",color:"#FF5252",borderRadius:4}}>✕</button>}
      <div style={{flex:1}}/>
      {/* ── Navigation menu (mouse icon) ── */}
      <div style={{position:"relative"}}>
        <button onClick={function(){setOpenMenu(openMenu==="modes"?null:"modes");}} style={{...B,background:openMenu==="modes"?T.bgHover:(!selMode&&!cMode?"#2979FF22":selMode?"#00BFA522":"transparent"),border:"1px solid "+(!selMode&&!cMode?"#2979FF":selMode?"#00BFA5":"transparent"),padding:"4px 10px",fontSize:11,borderRadius:4,display:"flex",alignItems:"center",gap:5}} title="Mode navigation">
          <span style={{fontSize:14}}>&#128432;</span>
          <span style={{fontSize:10,color:!selMode&&!cMode?"#2979FF":selMode?"#00BFA5":T.fg,fontWeight:600}}>{!selMode&&!cMode?"Nav":selMode?"Sél":"Flux"}</span>
          <span style={{fontSize:10,color:T.fgMuted}}>▾</span>
        </button>
        {openMenu==="modes"&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:6,minWidth:170,boxShadow:"0 4px 20px #00000040",zIndex:300}}>
          <div style={{fontSize:11,fontWeight:600,color:T.fgDim,textTransform:"uppercase",letterSpacing:1,padding:"4px 10px 6px"}}>Mode</div>
          <div onMouseDown={function(e){e.stopPropagation();setSelMode(false);setCMode(false);setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:4,cursor:"pointer",background:!selMode&&!cMode?"#2979FF15":"transparent",border:!selMode&&!cMode?"1px solid #2979FF30":"1px solid transparent",marginBottom:2}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background=!selMode&&!cMode?"#2979FF15":"transparent";}}>
            <span style={{fontSize:16}}>&#128432;</span>
            <div><div style={{fontSize:11,fontWeight:600,color:!selMode&&!cMode?"#2979FF":T.fg}}>Navigation</div><div style={{fontSize:11,color:T.fgMuted}}>Pan, zoom, déplacer apps</div></div>
          </div>
          <div onMouseDown={function(e){e.stopPropagation();setSelMode(true);setCMode(false);setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:4,cursor:"pointer",background:selMode?"#00BFA515":"transparent",border:selMode?"1px solid #00BFA530":"1px solid transparent"}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background=selMode?"#00BFA515":"transparent";}}>
            <span style={{fontSize:16}}>&#9654;</span>
            <div><div style={{fontSize:11,fontWeight:600,color:selMode?"#00BFA5":T.fg}}>Sélection</div><div style={{fontSize:11,color:T.fgMuted}}>Shift+clic, déplacement groupé</div></div>
          </div>
        </div>}
      </div>
      {/* ── Création menu ── */}
      <div style={{position:"relative"}}>
        <button onClick={function(){setOpenMenu(openMenu==="create"?null:"create");}} style={{...B,background:openMenu==="create"?T.bgHover:cMode?"#FF525222":T.border,border:"1px solid "+(cMode?"#FF5252":T.border),padding:"4px 10px",fontSize:11,borderRadius:4,display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:13,color:cMode?"#FF5252":"#00C853"}}>+</span>
          <span style={{fontSize:10,fontWeight:600,color:cMode?"#FF5252":T.fg}}>Création</span>
          <span style={{fontSize:10,color:T.fgMuted}}>▾</span>
        </button>
        {openMenu==="create"&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:6,minWidth:170,boxShadow:"0 4px 20px #00000040",zIndex:300}}>
          <div style={{fontSize:11,fontWeight:600,color:T.fgDim,textTransform:"uppercase",letterSpacing:1,padding:"4px 10px 6px"}}>Créer</div>
          <div onClick={function(){setEApp({id:"",name:"",domain:"IT",category:"",description:"",status:"Maintien",criticality:"Moyenne",vendor:"",version:"",owner:"",users:0,x:200-off.x/zm,y:200-off.y/zm,statusD1:"",statusD2:""});setShowAM(true);setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:4,cursor:"pointer",marginBottom:2}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
            <span style={{fontSize:16,color:"#00C853"}}>&#9633;</span>
            <div><div style={{fontSize:11,fontWeight:600,color:"#00C853"}}>+ Application</div><div style={{fontSize:11,color:T.fgMuted}}>Ajouter une app au canvas</div></div>
          </div>
          <div onClick={function(){setCMode(!cMode);setFFrom(null);setSelMode(false);setOpenMenu(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:4,cursor:"pointer",background:cMode?"#FF525215":"transparent",border:cMode?"1px solid #FF525230":"1px solid transparent"}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background=cMode?"#FF525215":"transparent";}}>
            <span style={{fontSize:16,color:"#FF5252"}}>&#8594;</span>
            <div><div style={{fontSize:11,fontWeight:600,color:cMode?"#FF5252":T.fg}}>Créer un flux</div><div style={{fontSize:11,color:T.fgMuted}}>Clic source → clic cible</div></div>
          </div>
        </div>}
      </div>
      {multiSel.length>0&&<div style={{display:"flex",gap:4,alignItems:"center"}}><span style={{fontSize:10,color:"#00BFA5"}}>{multiSel.length} sél.</span><button onMouseDown={e=>{e.stopPropagation();if(confirm("Supprimer "+multiSel.length+" app(s) ?")){setApps(p=>p.filter(a=>!multiSel.includes(a.id)));setFlows(p=>p.filter(f=>!multiSel.includes(f.from)&&!multiSel.includes(f.to)));setMultiSel([]);}}} style={{...B,padding:"3px 6px",fontSize:11,background:"#FF525220",color:"#FF5252",borderRadius:3}}>🗑</button><button onMouseDown={e=>{e.stopPropagation();setMultiSel([]);}} style={{...B,padding:"3px 6px",fontSize:11,background:T.border,borderRadius:3}}>✕</button></div>}
      {/* ── MENU: Fichier ── */}
      <div style={{position:"relative"}}>
        <button onClick={function(){setOpenMenu(openMenu==="file"?null:"file");}} style={{...B,background:openMenu==="file"?T.bgHover:T.border,padding:"5px 10px",fontSize:11,letterSpacing:0.3}}><span style={{fontSize:12,marginRight:4}}>&#128193;</span>Fichier ▾</button>
        {openMenu==="file"&&<div style={{position:"absolute",top:"100%",right:0,marginTop:4,background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:6,minWidth:180,boxShadow:"0 4px 16px #00000030",zIndex:200}}>
          <label style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>↑ Charger JSON<input type="file" accept=".json" style={{display:"none"}} onChange={function(e){if(e.target.files[0])loadJSON(e.target.files[0]);setOpenMenu(null);}}/></label>
          <div onClick={function(){saveJSON();setOpenMenu(null);}} style={{padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>↓ Sauvegarder</div>
          <div style={{height:1,background:T.border,margin:"4px 0"}}/>
          <div onClick={function(){exportCSV();setOpenMenu(null);}} style={{padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>⬇ Exporter CSV</div>
          <div onClick={function(){exportXLSX();setOpenMenu(null);}} style={{padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:"#10B981",fontWeight:600}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>⬇ Exporter XLSX (Apps·Flux·Dashboard)</div>
          <div onClick={function(){setShowExportModal(true);setOpenMenu(null);}} style={{padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:"#EF6C00",fontWeight:600}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>⬇ Exporter PPTX…</div>
          <div style={{height:1,background:T.border,margin:"4px 0"}}/>
          <div onClick={function(){setView("home");setOpenMenu(null);}} style={{padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fgMuted}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>Réimporter XLSX</div>
        </div>}
      </div>
      {/* ── MENU: Affichage ── */}
      <div style={{position:"relative"}}>
        <button onClick={function(){setOpenMenu(openMenu==="view"?null:"view");}} style={{...B,background:openMenu==="view"?T.bgHover:T.border,padding:"5px 10px",fontSize:11,letterSpacing:0.3}}><span style={{fontSize:12,marginRight:4}}>&#128065;</span>Affichage ▾</button>
        {openMenu==="view"&&<div style={{position:"absolute",top:"100%",right:0,marginTop:4,background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:8,minWidth:200,boxShadow:"0 4px 16px #00000030",zIndex:200}}>
          <div style={{padding:"4px 8px",fontSize:10,color:T.fgMuted,fontWeight:600,marginBottom:4}}>Thème</div>
          <div style={{display:"flex",gap:4,padding:"0 8px",marginBottom:8}}>
            <button onClick={function(){setThemeKey("dark");}} style={{...B,background:isDark?"#2979FF":T.border,padding:"4px 12px",fontSize:10,flex:1}}>Sombre</button>
            <button onClick={function(){setThemeKey("light");}} style={{...B,background:isDark?T.border:"#2979FF",padding:"4px 12px",fontSize:10,flex:1}}>Clair</button>
          </div>
          <div style={{padding:"4px 8px",fontSize:10,color:T.fgMuted,fontWeight:600}}>Taille apps</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px"}}>
            <input type="range" min="0.5" max="2" step="0.1" value={globalScale} onChange={function(e){setGlobalScale(parseFloat(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:30}}>{Math.round(globalScale*100)}%</span>
          </div>
          <div style={{padding:"4px 8px",fontSize:10,color:T.fgMuted,fontWeight:600}}>Police</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",marginBottom:6}}>
            <input type="range" min="0.6" max="3" step="0.15" value={fontScale} onChange={function(e){setFontScale(parseFloat(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:30}}>{Math.round(fontScale*100)}%</span>
          </div>
          <div style={{height:1,background:T.border,margin:"4px 0"}}/>
          <div onClick={function(){setPresMode(true);setOpenMenu(null);}} style={{padding:"6px 8px",borderRadius:4,cursor:"pointer",fontSize:11,color:"#536DFE",fontWeight:600}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>▶ Présentation</div>
        </div>}
      </div>
      {/* ── MENU: Flux & Domaines ── */}
      <div style={{position:"relative"}}>
        <button onClick={function(){setOpenMenu(openMenu==="flux"?null:"flux");}} style={{...B,background:openMenu==="flux"?T.bgHover:T.border,padding:"5px 10px",fontSize:11,letterSpacing:0.3}}><span style={{fontSize:12,marginRight:4}}>&#8644;</span>Flux ▾</button>
        {openMenu==="flux"&&<div style={{position:"absolute",top:"100%",right:0,marginTop:4,background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:8,minWidth:220,boxShadow:"0 4px 16px #00000030",zIndex:200}}>
          <div style={{padding:"4px 8px",fontSize:10,color:T.fgMuted,fontWeight:600}}>Épaisseur</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px"}}>
            <input type="range" min="1" max="6" step="0.5" value={flowThickness} onChange={function(e){setFlowThickness(parseFloat(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:24}}>{flowThickness}px</span>
          </div>
          <div style={{padding:"4px 8px",fontSize:10,color:T.fgMuted,fontWeight:600}}>Police labels</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px"}}>
            <input type="range" min="7" max="18" step="1" value={flowFontSize} onChange={function(e){setFlowFontSize(parseInt(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:24}}>{flowFontSize}pt</span>
          </div>
          <div style={{padding:"4px 8px",fontSize:10,color:T.fgMuted,fontWeight:600}}>Style de trait</div>
          <div style={{display:"flex",gap:4,padding:"4px 8px"}}>
            <button onClick={function(){setFlowDash("none");}} style={{...B,background:flowDash==="none"?"#2979FF":T.border,padding:"3px 10px",fontSize:10,flex:1}}>Plein</button>
            <button onClick={function(){setFlowDash("dashed");}} style={{...B,background:flowDash==="dashed"?"#2979FF":T.border,padding:"3px 10px",fontSize:10,flex:1}}>Tirets</button>
            <button onClick={function(){setFlowDash("dotted");}} style={{...B,background:flowDash==="dotted"?"#2979FF":T.border,padding:"3px 10px",fontSize:10,flex:1}}>Points</button>
          </div>
          <div style={{padding:"4px 8px",fontSize:10,color:T.fgMuted,fontWeight:600,marginTop:4}}>Couleur</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px"}}>
            <input type="color" value={flowColorCustom||"#548CA8"} onChange={function(e){setFlowColorCustom(e.target.value);}} style={{width:24,height:24,border:"none",borderRadius:4,cursor:"pointer",padding:0}}/>
            <span style={{fontSize:10,color:T.fg}}>{flowColorCustom||"Auto"}</span>
            {flowColorCustom&&<button onClick={function(){setFlowColorCustom("");}} style={{...B,padding:"2px 8px",fontSize:11,background:T.border}}>Reset</button>}
          </div>
          <div style={{height:1,background:T.border,margin:"6px 0"}}/>
          <div style={{padding:"4px 8px",fontSize:10,color:T.fgMuted,fontWeight:600}}>Bordure domaines</div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px"}}>
            <input type="range" min="0.5" max="4" step="0.5" value={domBorderW} onChange={function(e){setDomBorderW(parseFloat(e.target.value));}} style={{flex:1,cursor:"pointer"}}/>
            <span style={{fontSize:10,color:T.fg,minWidth:24}}>{domBorderW}px</span>
          </div>
          <div onClick={function(){setShowCatModal(true);setOpenMenu(null);}} style={{padding:"6px 8px",borderRadius:4,cursor:"pointer",fontSize:11,color:T.fg,marginTop:4}} onMouseEnter={function(e){e.currentTarget.style.background=T.bgHover;}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>◫ Catégories</div>
        </div>}
      </div>
    </div>
    <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>
    <div ref={cvRef} style={{flex:1,overflow:"hidden",position:"relative",cursor:pan?"grabbing":cMode?"crosshair":selMode?"default":"grab"}} onMouseDown={function(e){if(openMenu)setOpenMenu(null);onCD(e);}} onMouseMove={onCM} onMouseUp={onCU} onMouseLeave={onCU} onWheel={onWh} onContextMenu={e=>e.preventDefault()}>
      <div className="cbg" style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,"+T.grid+" 1px,transparent 1px)",backgroundSize:"30px 30px"}}/>
      <div style={{transform:`translate(${off.x}px,${off.y}px) scale(${zm})`,transformOrigin:"0 0",position:"absolute",top:0,left:0,width:5000,height:4000}}>
        <CategoryZones/><DomainZones/><FlowLines/>{filtered.map(a=><AppNode key={a.id} app={a}/>)}
      </div>
      <div style={{position:"absolute",bottom:12,right:12,background:T.bgCard,borderRadius:4,padding:"4px 10px",fontSize:10,color:T.fgMuted}}>{Math.round(zm*100)}% · {activeFilters?filtered.length+"/":""}{apps.length} apps · {flows.length} flux{activeFilters?" (filtré)":""}</div>
      {!focusApp&&!flowDomFilter&&flows.length>0&&<div style={{position:"absolute",bottom:12,left:12,background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:"6px 12px",fontSize:10,color:T.fgMuted,opacity:0.8}}>Survolez une application pour voir ses flux</div>}
    </div>
    {selApp&&!showAM&&<div data-panel="1" style={{width:300,flexShrink:0,background:T.bgAlt,borderLeft:"1px solid "+T.borderLight,overflowY:"auto",display:"flex",flexDirection:"column",zIndex:10}}>
      {/* Header with domain color accent */}
      <div style={{background:isDark?(DC[selApp.domain]||DC.Autre).bg:((DC[selApp.domain]||DC.Autre).ac+"18"),padding:"16px 18px 12px",borderBottom:"2px solid "+(DC[selApp.domain]||DC.Autre).ac,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontSize:11,color:(DC[selApp.domain]||DC.Autre).ac,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{selApp.domain}</div>
          <div style={{fontSize:16,fontWeight:700,color:isDark?T.fg:(DC[selApp.domain]||DC.Autre).ac,lineHeight:1.3}}>{selApp.name}</div></div>
          <button onClick={()=>setSelApp(null)} style={{background:"none",border:"none",color:T.fgMuted,cursor:"pointer",fontSize:20,lineHeight:1,padding:"0 2px",marginTop:-2,flexShrink:0}}>×</button>
        </div>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:(SC[selApp.status]||"#888")+"25",color:SC[selApp.status]||"#888",border:"1px solid "+(SC[selApp.status]||"#888")+"40"}}>{selApp.status}</span>
          <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:(CC[selApp.criticality]||"#888")+"25",color:CC[selApp.criticality]||"#888",border:"1px solid "+(CC[selApp.criticality]||"#888")+"40"}}>{selApp.criticality}</span>
        </div>
      </div>
      {/* Info fields */}
      <div style={{padding:"20px 18px 12px",flex:1,overflowY:"auto"}}>
        {[["Application",selApp.name],["Éditeur",selApp.vendor],["Version",selApp.version],["Nb utilisateurs",selApp.users],["Responsable",selApp.owner]].map(([k,v])=>
          <div key={k} style={{marginBottom:14}}>
            <div style={{fontSize:10,color:T.fgDim,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{k}</div>
            <div style={{fontSize:13,color:v?T.fg:T.fgFaint,fontWeight:v?500:400,paddingLeft:2,fontStyle:v?"normal":"italic"}}>{v||"Non renseigné"}</div>
          </div>)}
        {(selApp.statusD1||selApp.statusD2)&&<div style={{marginBottom:14,padding:"10px 12px",borderRadius:8,background:T.bgCard,border:"1px solid "+T.borderLight}}>
          <div style={{fontSize:10,color:T.fgDim,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Trajectoire Carve-Out</div>
          <div style={{display:"flex",gap:8}}>
            {selApp.statusD1&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:(SD1[selApp.statusD1]||"#888")+"25",color:SD1[selApp.statusD1]||"#888",border:"1px solid "+(SD1[selApp.statusD1]||"#888")+"40"}}>D1 · {selApp.statusD1}</span>}
            {selApp.statusD2&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:(SD2[selApp.statusD2]||"#888")+"25",color:SD2[selApp.statusD2]||"#888",border:"1px solid "+(SD2[selApp.statusD2]||"#888")+"40"}}>D2 · {selApp.statusD2}</span>}
          </div>
        </div>}
        <div style={{paddingTop:14,borderTop:"1px solid "+T.borderLight}}>
          <div style={{fontSize:10,color:T.fgDim,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Description</div>
          <div style={{fontSize:12,color:selApp.description?T.fg:T.fgFaint,lineHeight:1.6,paddingLeft:2,fontStyle:selApp.description?"normal":"italic"}}>{selApp.description||"Non renseignée"}</div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:20}}>
          <button onClick={()=>{setEApp({...selApp});setShowAM(true);}} style={{...B,background:"#548CA8",flex:1,padding:8}}>Éditer</button>
          <button onClick={()=>{if(confirm("Supprimer "+selApp.name+" ?")){setApps(p=>p.filter(a=>a.id!==selApp.id));setFlows(p=>p.filter(f=>f.from!==selApp.id&&f.to!==selApp.id));setSelApp(null);}}} style={{...B,background:"#E06C75",flex:1,padding:8}}>Supprimer</button>
        </div>
      </div>
    </div>}
    </div>
    {/* Presentation mode overlay */}
    {presMode&&<div style={{position:"fixed",inset:0,zIndex:500,background:T.pres,display:"flex",flexDirection:"column"}}>
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
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,"+T.grid+" 1px,transparent 1px)",backgroundSize:"30px 30px"}}/>
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
            {[{k:"status",l:"Statut AS-IS",o:["Maintien","Arrêt","Standalone temporaire","Migrée","Remplacée"]},{k:"criticality",l:"Criticité",o:["Haute","Moyenne","Basse"]}].map(({k,l,o})=><div key={k}><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>{l}</label><select value={eApp[k]||""} onChange={e=>setEApp(p=>({...p,[k]:e.target.value}))} style={I}>{o.map(v=><option key={v} value={v}>{v}</option>)}</select></div>)}
      <div style={{background:T.bgAlt,borderRadius:8,padding:10,marginTop:8}}><div style={{fontSize:10,fontWeight:700,color:T.fgMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Trajectoire Carve-Out</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Day 1</label><select value={eApp.statusD1||""} onChange={e=>setEApp(p=>({...p,statusD1:e.target.value}))} style={I}>{D1_OPTS.map(v=><option key={v} value={v}>{v||"Non défini"}</option>)}</select></div><div><label style={{fontSize:11,color:T.fgMuted,display:"block",marginBottom:3}}>Day 2</label><select value={eApp.statusD2||""} onChange={e=>setEApp(p=>({...p,statusD2:e.target.value}))} style={I}>{D2_OPTS.map(v=><option key={v} value={v}>{v||"Non défini"}</option>)}</select></div></div></div>
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
    {showExportModal&&<div style={{position:"fixed",inset:0,background:T.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:400}} onMouseDown={function(e){if(e.target===e.currentTarget)setShowExportModal(false);}}>
      <div style={{background:T.bgCard,borderRadius:12,padding:28,width:580,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px #00000060"}} onMouseDown={function(e){e.stopPropagation();}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><div style={{fontSize:16,fontWeight:700,color:T.fg}}>Options d&apos;export PowerPoint</div><div style={{fontSize:11,color:T.fgMuted,marginTop:2}}>{apps.length} apps &middot; {flows.length} flux &middot; {doms.length} domaines</div></div>
          <button onClick={function(){setShowExportModal(false);}} style={{background:"none",border:"none",fontSize:18,color:T.fgMuted,cursor:"pointer"}}>&#10005;</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* Identité client */}
          <div style={{background:T.bgAlt,borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:600,color:T.fg,marginBottom:10}}>&#127775; Identit&#233; client</div>
            <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={{fontSize:10,color:T.fgMuted}}>Couleur principale</label>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="color" value={"#"+(exportOpts.clientPrimary||"2979FF")} onChange={function(e){var hex=e.target.value.replace("#","");setExportOpts(function(p){return Object.assign({},p,{clientPrimary:hex});});}} style={{width:40,height:32,border:"1px solid #555",borderRadius:4,cursor:"pointer",padding:2}}/>
                  <span style={{fontSize:10,color:T.fgDim,fontFamily:"monospace"}}>{"#"+(exportOpts.clientPrimary||"2979FF")}</span>
                </div>
                <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                  {["1B3A5C","2979FF","10B981","6366F1","EF6C00","E06C75","0B2545","2D6A4F"].map(function(c){
                    return <div key={c} onMouseDown={function(e){e.preventDefault();setExportOpts(function(p){return Object.assign({},p,{clientPrimary:c});});}} style={{width:20,height:20,borderRadius:4,background:"#"+c,cursor:"pointer",border:exportOpts.clientPrimary===c?"2px solid #fff":"2px solid transparent",boxShadow:exportOpts.clientPrimary===c?"0 0 6px #"+c+"80":"none"}}/>;
                  })}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={{fontSize:10,color:T.fgMuted}}>Logo client (PNG/JPG)</label>
                <input type="file" accept="image/*" onChange={function(e){var f=e.target.files&&e.target.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(ev){setExportOpts(function(p){return Object.assign({},p,{clientLogo:ev.target.result});});};rd.readAsDataURL(f);}} style={{fontSize:10,color:T.fg,cursor:"pointer"}}/>
                {exportOpts.clientLogo&&<div style={{display:"flex",alignItems:"center",gap:6}}>
                  <img src={exportOpts.clientLogo} alt="logo" style={{height:28,maxWidth:80,objectFit:"contain",borderRadius:4,border:"1px solid "+T.border}}/>
                  <button onMouseDown={function(){setExportOpts(function(p){return Object.assign({},p,{clientLogo:null});});}} style={{background:"none",border:"none",fontSize:12,color:T.fgMuted,cursor:"pointer"}}>✕</button>
                </div>}
              </div>
            </div>
          </div>

          {/* Slides exécutives */}
          <div style={{background:T.bgAlt,borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:600,color:T.fg,marginBottom:10}}>&#128101; Slides ex&#233;cutives</div>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 8px",borderRadius:4,background:exportOpts.inclExecSlides?T.bgHover:"transparent"}}>
              <input type="checkbox" checked={exportOpts.inclExecSlides} onChange={function(e){var v=e.target.checked;setExportOpts(function(p){var n=Object.assign({},p);n.inclExecSlides=v;return n;});}} style={{accentColor:"#2979FF",width:14,height:14}}/>
              <span style={{fontSize:11,color:T.fg}}>Inclure les slides ex&#233;cutives (Page de titre + Synth&#232;se ex&#233;cutive)</span>
            </label>
          </div>

          {/* Mode de rendu cartographie */}
          <div style={{background:T.bgAlt,borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:600,color:T.fg,marginBottom:10}}>Mode de rendu cartographie</div>
            {[
              {v:"global",l:"Vue globale",d:"Toutes les applications sur un slide unifié"},
              {v:"byDomain",l:"Par domaine fonctionnel",d:"Un slide par domaine · apps et flux contextualisés"},
              {v:"byHub",l:"Par système drainant",d:"Slides centrés sur les hubs · app la plus connectée au centre"},
            ].map(function(opt){
              return <label key={opt.v} style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"8px 10px",borderRadius:8,background:exportOpts.cartoMode===opt.v?T.bgHover:"transparent",border:exportOpts.cartoMode===opt.v?"1px solid #2979FF30":"1px solid transparent",marginBottom:4}}>
                <input type="radio" name="cartoMode" value={opt.v} checked={exportOpts.cartoMode===opt.v} onChange={function(){setExportOpts(function(p){return Object.assign({},p,{cartoMode:opt.v});});}} style={{marginTop:2,accentColor:"#2979FF"}}/>
                <div><div style={{fontSize:12,fontWeight:600,color:T.fg}}>{opt.l}</div><div style={{fontSize:10,color:T.fgMuted}}>{opt.d}</div></div>
              </label>;
            })}
          </div>

          {/* Slides de synthèse */}
          <div style={{background:T.bgAlt,borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:600,color:T.fg,marginBottom:10}}>&#128202; Slides de synth&#232;se</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                {k:"inclDomainStatus",l:"Vue par domaine (Day 1 & Day 2)",d:"2 slides · applications colorées par statut"},
              ].map(function(item){
                return <label key={item.k} style={{display:"flex",alignItems:"flex-start",gap:8,cursor:"pointer",padding:"6px 8px",borderRadius:4,background:exportOpts[item.k]?T.bgHover:"transparent"}}>
                  <input type="checkbox" checked={exportOpts[item.k]} onChange={function(e){var v=e.target.checked;setExportOpts(function(p){var n=Object.assign({},p);n[item.k]=v;return n;});}} style={{accentColor:"#2979FF",width:14,height:14,marginTop:2}}/>
                  <div><div style={{fontSize:11,color:T.fg}}>{item.l}</div><div style={{fontSize:9,color:T.fgMuted}}>{item.d}</div></div>
                </label>;
              })}
            </div>
          </div>

          {/* Synthèse détaillée */}
          <div style={{background:T.bgAlt,borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:600,color:T.fg,marginBottom:10}}>Slide Synth&#232;se d&#233;taill&#233;e (flux)</div>
            {[
              {v:"none",l:"Ne pas inclure",d:"Uniquement la synth\u00e8se agr\u00e9g\u00e9e"},
              {v:"radial",l:"Vue radiale",d:"Tous les flux individuels sur un slide orbital"},
              {v:"byDomain",l:"Par domaine source",d:"Un slide par domaine \u2192 hub (plus lisible)"},
            ].map(function(opt){
              return <label key={opt.v} style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"8px 10px",borderRadius:8,background:exportOpts.synthDetail===opt.v?T.bgHover:"transparent",border:exportOpts.synthDetail===opt.v?"1px solid #2979FF30":"1px solid transparent",marginBottom:4}}>
                <input type="radio" name="synthDetail" value={opt.v} checked={exportOpts.synthDetail===opt.v} onChange={function(){setExportOpts(function(p){return Object.assign({},p,{synthDetail:opt.v});});}} style={{marginTop:2,accentColor:"#2979FF"}}/>
                <div><div style={{fontSize:12,fontWeight:600,color:T.fg}}>{opt.l}</div><div style={{fontSize:10,color:T.fgMuted}}>{opt.d}</div></div>
              </label>;
            })}
          </div>

          {/* Slides à inclure */}
          <div style={{background:T.bgAlt,borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:600,color:T.fg,marginBottom:10}}>Autres slides &#224; inclure</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                {k:"inclConsolidatedCarto",l:"Carto consolidée (sans étiquettes)"},
                {k:"inclRecapTable",l:"Tableau récapitulatif flux"},
                {k:"inclAggregated",l:"Vue agr\u00e9g\u00e9e domaines"},
                {k:"inclHubSlides",l:"Slides hub (flux d\u00e9taill\u00e9s)"},
                {k:"inclFocusDomain",l:"Focus par domaine"},
                {k:"inclKPI",l:"KPIs & synth\u00e8se"},
                {k:"inclLegend",l:"Slide l\u00e9gende"},
              ].map(function(item){
                return <label key={item.k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 8px",borderRadius:4,background:exportOpts[item.k]?T.bgHover:"transparent"}}>
                  <input type="checkbox" checked={exportOpts[item.k]} onChange={function(e){var v=e.target.checked;setExportOpts(function(p){var n=Object.assign({},p);n[item.k]=v;return n;});}} style={{accentColor:"#2979FF",width:14,height:14}}/>
                  <span style={{fontSize:11,color:T.fg}}>{item.l}</span>
                </label>;
              })}
            </div>
          </div>

          {/* Estimation */}
          <div style={{fontSize:10,color:T.fgDim,padding:"6px 10px",background:T.bgAlt,borderRadius:6}}>
            &#128196; Estimation&nbsp;: environ {
              (function(){
                var n=1;// urbanisation
                n++;// synthèse compacte
                n++;// matrice flux
                if(exportOpts.inclExecSlides)n+=2;// title + exec
                if(exportOpts.synthDetail!=="none")n+=(exportOpts.synthDetail==="byDomain"?doms.length:1);
                if(exportOpts.inclConsolidatedCarto)n++;
                if(exportOpts.inclRecapTable)n+=Math.ceil(flows.length/18)||1;
                if(exportOpts.inclAggregated)n++;
                if(exportOpts.inclHubSlides)n+=Math.ceil(flows.length/6)+2;
                if(exportOpts.inclFocusDomain)n+=doms.length*2;
                if(exportOpts.inclKPI)n+=2;
                if(exportOpts.inclLegend)n++;
                if(exportOpts.inclDomainStatus)n+=2;
                return n;
              })()
            } slides
          </div>
        </div>

        <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
          <button onClick={function(){setShowExportModal(false);}} style={{...B,background:T.border,padding:"8px 18px"}}>Annuler</button>
          <button onClick={function(){setShowExportModal(false);exportPPTX(exportOpts).catch(function(err){alert("Erreur export PPTX:\n"+(err&&err.message?err.message:String(err))+"\n\n"+(err&&err.stack?err.stack.slice(0,400):""));});}} style={{...B,background:"#EF6C00",padding:"8px 24px",fontWeight:700,fontSize:13}}>&#11015; G&#233;n&#233;rer le PPTX</button>
        </div>
      </div>
    </div>}
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
            style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",border:isActive?"3px solid #fff":"3px solid transparent",boxShadow:isActive?"0 0 8px "+c+"80":"none",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
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
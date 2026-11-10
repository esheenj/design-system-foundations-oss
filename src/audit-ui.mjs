import {auditControls} from "./audit-controls.mjs";
const field=id=>document.getElementById(id);
const demo=[
 {id:"fictional-submit",name:"Save fictional draft",foreground:"#111111",background:"#ffffff",width:48,height:48},
 {id:"fictional-small",name:"",foreground:"#aaaaaa",background:"#ffffff",width:16,height:20}
];
field("fixture").value=JSON.stringify(demo,null,2);
function draw(){
 field("rows").replaceChildren();
 const value=field("fixture").value;
 if(new TextEncoder().encode(value).length>16384){
  field("status").textContent="Rejected: input is too large for this educational tool.";
  return;
 }
 let report;
 try{report=auditControls(JSON.parse(value));}
 catch(_){
  field("status").textContent="Rejected: validate the JSON array, six-digit hex colors, unique IDs and dimensions.";
  return;
 }
 field("status").textContent=report.inspected+" synthetic controls inspected · "+report.findings+" illustrative findings.";
 for(const row of report.rows){
  const li=document.createElement("li");
  const heading=document.createElement("strong");
  heading.textContent=row.id+" — "+(row.name||"no supplied name");
  const metrics=document.createElement("p");
  metrics.textContent="Example contrast ratio: "+row.contrastRatio.toFixed(2)+":1";
  const notes=document.createElement("p");
  notes.textContent=row.findings.length?row.findings.join(" · "):"No modeled heuristic flags (not proof of accessibility).";
  li.append(heading,metrics,notes);
  field("rows").append(li);
 }
}
field("run-audit").addEventListener("click",draw);
field("reset-audit").addEventListener("click",()=>{
 field("fixture").value=JSON.stringify(demo,null,2);
 draw();
 field("fixture").focus();
});
draw();

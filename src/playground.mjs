// Original offline browser adapter. No remote requests or user accounts.
import {compileTheme,contrastRatio,TokenError} from "./tokens.mjs";
const $=selector=>document.querySelector(selector);
const initial=Object.freeze({brand:"#2563eb",text:"#111827",surface:"#ffffff",spacing:16});
let latestCss="";
function readTheme(){
 const spacing=Number($("#spacing").value);
 if(!Number.isSafeInteger(spacing)||spacing<4||spacing>32||spacing%4!==0)
  throw new TokenError("Spacing must be 4–32 in increments of 4.");
 return {
  color:{brand:$("#brand").value,text:$("#text-color").value,
         surface:$("#surface").value,action:"{color.brand}"},
  spacing:{base:spacing+"px"}
 };
}
function render(){
 try{
  const theme=readTheme();
  const {resolved,css}=compileTheme(theme);
  const colors={brand:resolved["color.brand"],text:resolved["color.text"],
   surface:resolved["color.surface"],action:resolved["color.action"]};
  for(const [key,value] of Object.entries(colors))
   $("#preview").style.setProperty("--color-"+key,value);
  $("#preview").style.setProperty("--spacing-base",resolved["spacing.base"]);
  $("#preview").style.padding=resolved["spacing.base"];
  $("#spacing-output").textContent=String(Number($("#spacing").value));
  $("#compiled").value=css;
  latestCss=css;
  const ratio=contrastRatio(colors.text,colors.surface);
  $("#metric").textContent="Text / surface contrast: "+ratio.toFixed(2)+":1 (numerical example only)";
  $("#status").textContent="Compiled locally; no file uploaded.";
  $("#download").disabled=false;
 }catch(error){
  $("#status").textContent=error instanceof TokenError?"Invalid fictional token input.":"Unable to compile sample.";
  $("#download").disabled=true;
 }
}
["#brand","#text-color","#surface","#spacing"].forEach(id=>{
 $(id).addEventListener("input",render);
 $(id).addEventListener("change",render);
});
$("#reset").addEventListener("click",()=>{
 $("#brand").value=initial.brand;$("#text-color").value=initial.text;
 $("#surface").value=initial.surface;$("#spacing").value=String(initial.spacing);
 render();$("#brand").focus();
});
$("#download").addEventListener("click",()=>{
 if(!latestCss||$("#download").disabled)return;
 const anchor=document.createElement("a");
 anchor.href="data:text/css;charset=utf-8,"+encodeURIComponent(latestCss);
 anchor.download="fictional-theme-tokens.css";
 document.body.append(anchor);anchor.click();anchor.remove();
 $("#status").textContent="Compiled fictional CSS prepared for local download; nothing uploaded.";
});
render();

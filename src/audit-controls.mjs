// Original offline heuristic workbook: NOT an accessibility audit or certification.
import {contrastRatio} from "./tokens.mjs";
export class AuditFault extends Error {
 constructor(code){super(code);this.name="AuditFault";this.code=code;}
}
const ID=/^[a-z][a-z0-9-]{2,40}$/;
const COLOR=/^#[0-9a-fA-F]{6}$/;
const KEYS=["id","name","foreground","background","width","height"];
function checkRow(row){
 if(!row||typeof row!=="object"||Array.isArray(row)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(row))||
    Object.keys(row).length!==KEYS.length||!KEYS.every(k=>Object.hasOwn(row,k)))
  throw new AuditFault("INVALID_ROW_SHAPE");
 if(typeof row.id!=="string"||!ID.test(row.id))throw new AuditFault("INVALID_ID");
 if(typeof row.name!=="string"||row.name.length>80)throw new AuditFault("INVALID_NAME");
 if(typeof row.foreground!=="string"||typeof row.background!=="string"||
    !COLOR.test(row.foreground)||!COLOR.test(row.background))throw new AuditFault("INVALID_COLOR");
 for(const k of ["width","height"]){
  if(!Number.isInteger(row[k])||row[k]<0||row[k]>200)throw new AuditFault("INVALID_DIMENSION");
 }
}
export function auditControls(rows) {
 if(!Array.isArray(rows)||rows.length<1||rows.length>20)throw new AuditFault("INVALID_LIST");
 const seen=new Set();
 const results=rows.map(row=>{
  checkRow(row);
  if(seen.has(row.id))throw new AuditFault("DUPLICATE_ID");
  seen.add(row.id);
  const ratio=contrastRatio(row.foreground,row.background);
  const notes=[];
  if(row.name.trim().length===0)notes.push("MISSING_ACCESSIBLE_NAME_EXAMPLE");
  if(ratio<4.5)notes.push("LOW_TEXT_CONTRAST_EXAMPLE");
  if(row.width<24||row.height<24)notes.push("SMALL_TARGET_EXAMPLE");
  return Object.freeze({id:row.id,name:row.name,contrastRatio:ratio,findings:Object.freeze(notes)});
 });
 return Object.freeze({
  schema:"esheen-fictional-control-audit-v1",
  disclaimer:"Educational metadata heuristics only. Not a DOM audit, WCAG judgement or certification.",
  inspected:results.length,
  findings:results.reduce((sum,row)=>sum+row.findings.length,0),
  rows:Object.freeze(results)
 });
}

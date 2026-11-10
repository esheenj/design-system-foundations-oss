import test from "node:test";
import assert from "node:assert/strict";
import {auditControls,AuditFault} from "../src/audit-controls.mjs";
const fixture=()=>[
 {id:"fictional-submit",name:"Submit example",foreground:"#111111",background:"#ffffff",width:48,height:48},
 {id:"fictional-small",name:"",foreground:"#aaaaaa",background:"#ffffff",width:16,height:20}
];
test("audits fictional controls with explainable stable findings",()=>{
 const rows=fixture(),result=auditControls(rows);
 assert.equal(result.inspected,2);
 assert.equal(result.findings,3);
 assert.equal(result.rows[0].findings.length,0);
 assert.deepEqual(result.rows[1].findings,[
  "MISSING_ACCESSIBLE_NAME_EXAMPLE","LOW_TEXT_CONTRAST_EXAMPLE","SMALL_TARGET_EXAMPLE"
 ]);
 assert.equal(result.schema,"esheen-fictional-control-audit-v1");
 assert.match(result.disclaimer,/Not a DOM audit/);
 assert(Object.isFrozen(result.rows));
 assert.deepEqual(rows,fixture(),"input remains unchanged");
});
test("rejects oversized, malformed or forged metadata without partial success",()=>{
 const base=fixture()[0];
 for(const invalid of [
  [], Array(21).fill(base),[{...base,id:"x"}],[{...base,id:"hi!"}],
  [{...base,width:NaN}],[{...base,width:true}],[{...base,height:-2}],
  [{...base,background:"url(https://example.invalid/track)"}],
  [{...base,extra:"private"}],[Object.assign(Object.create(Date.prototype),base)],
  [base,{...base}],
 ])assert.throws(()=>auditControls(invalid),AuditFault);
});
test("does not render or execute markup-looking name strings",()=>{
 const rows=fixture();
 rows[0].name="<img src=x onerror=alert(1)>";
 const result=auditControls(rows);
 assert.equal(result.rows[0].name,rows[0].name);
 assert.equal(result.rows[0].findings.length,0);
 assert.equal(auditControls(rows).findings,result.findings);
});

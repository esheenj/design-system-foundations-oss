import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,existsSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {stagePages} from "../scripts/stage_pages.mjs";
test("staged public demo is the complete allowlisted source-only artifact",async()=>{
 const root=mkdtempSync(join(tmpdir(),"public-pages-"));
 try{
  const a=join(root,"first"),b=join(root,"second");
  const first=await stagePages(a),second=await stagePages(b);
  assert.equal(first.state,"STAGED_ONLY");
  assert.equal(first.verifiedHosting,false);
  assert.deepEqual(first.files,second.files);
  assert.deepEqual(first.files.map(x=>x.path),[".nojekyll","index.html","src/playground.mjs","src/tokens.mjs"]);
  for(const row of first.files){
    assert.match(row.sha256,/^[a-f0-9]{64}$/);
    assert.deepEqual(readFileSync(join(a,row.path)),readFileSync(join(b,row.path)));
    assert.equal(readFileSync(join(a,row.path)).length,row.size);
  }
  for(const excluded of [".git","AGENTS.md",".github","tests","CONTRIBUTING.md"])
   assert.equal(existsSync(join(a,excluded)),false);
  await assert.rejects(stagePages(a),/EEXIST/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test("stager rejects source-tree output and existing destination without changing data",async()=>{
 await assert.rejects(stagePages("src/website"),/SOURCE_TREE_DESTINATION/);
 const root=mkdtempSync(join(tmpdir(),"public-pages-existing-"));
 try{
  const existing=join(root,"reserved");mkdirSync(existing);
  writeFileSync(join(existing,"marker"),"DO_NOT_REPLACE");
  await assert.rejects(stagePages(existing),/EEXIST/);
  assert.equal(readFileSync(join(existing,"marker"),"utf8"),"DO_NOT_REPLACE");
 }finally{rmSync(root,{recursive:true,force:true});}
});

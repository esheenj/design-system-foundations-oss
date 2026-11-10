// Deterministic source-only GitHub Pages staging for an original public demo.
import {mkdir,lstat,readFile,copyFile,writeFile,readdir,rm,realpath} from "node:fs/promises";
import {resolve,dirname,join,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
const ROOT=fileURLToPath(new URL("../",import.meta.url));
const FILES=Object.freeze(["index.html","audit.html","src/audit-controls.mjs","src/audit-ui.mjs","src/playground.mjs","src/tokens.mjs"]);
const SCHEMA="public-design-tokens-pages-v1";
function fail(reason){throw Error("PUBLIC_PAGES_STAGE_"+reason);}
async function checkedSource(root,relative){
 let item=root;
 for(const part of relative.split("/")){
  item=join(item,part);
  const stat=await lstat(item);
  if(stat.isSymbolicLink())fail("SOURCE_LINK");
 }
 if(!(await lstat(item)).isFile())fail("SOURCE_NOT_FILE");
}
async function walk(path,prefix=""){
 const result=[];
 for(const entry of await readdir(path,{withFileTypes:true})){
  if(entry.isSymbolicLink())fail("OUTPUT_LINK");
  if(entry.isDirectory())result.push(...await walk(join(path,entry.name),prefix+entry.name+"/"));
  else if(entry.isFile())result.push(prefix+entry.name);
  else fail("OUTPUT_NONREGULAR");
 }
 return result;
}
export async function stagePages(destination){
 if(typeof destination!=="string"||!destination.trim())fail("INVALID_DESTINATION");
 const root=await realpath(ROOT),out=resolve(destination);
 if((out===root||out.startsWith(root+sep))&&out!==join(root,"dist","pages"))
  fail("SOURCE_TREE_DESTINATION");
 for(const file of FILES)await checkedSource(root,file);
 await mkdir(dirname(out),{recursive:true});
 const parent=await lstat(dirname(out));
 if(!parent.isDirectory()||parent.isSymbolicLink())fail("OUTPUT_PARENT");
 await mkdir(out); // exclusive; existing folder and symlinks rejected
 try{
  for(const file of FILES){
   await mkdir(dirname(join(out,file)),{recursive:true});
   await copyFile(join(root,file),join(out,file));
  }
  await writeFile(join(out,".nojekyll"),"",{flag:"wx"});
  const actual=(await walk(out)).sort();
  if(JSON.stringify(actual)!==JSON.stringify([".nojekyll",...FILES].sort()))
   fail("STAGE_UNEXPECTED_FILE");
  const index=await readFile(join(out,"index.html"),"utf8");
  const adapter=await readFile(join(out,"src/playground.mjs"),"utf8");
  if(!index.includes("./src/playground.mjs")||!adapter.includes("./tokens.mjs"))
   fail("IMPORT_LINK_MISSING");
  const audit=await readFile(join(out,"audit.html"),"utf8");
  const auditUI=await readFile(join(out,"src/audit-ui.mjs"),"utf8");
  if(!audit.includes("./src/audit-ui.mjs")||!auditUI.includes("./audit-controls.mjs")||
     !index.includes("audit.html")||!audit.includes("connect-src 'none'"))
   fail("AUDIT_LINK_OR_OFFLINE_POLICY");
  const entries=[];
  for(const file of actual){
   const bytes=await readFile(join(out,file));
   entries.push({path:file,size:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")});
  }
  return {schema:SCHEMA,state:"STAGED_ONLY",verifiedHosting:false,
   files:entries,sourceOfTruth:"exact-checked-out-public-commit"};
 }catch(error){await rm(out,{recursive:true,force:true});throw error;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await stagePages(process.argv[2]||"dist/pages"),null,2));}
 catch(error){console.error(JSON.stringify({status:"REJECTED",reason:String(error.message).slice(0,90)}));process.exitCode=2;}
}

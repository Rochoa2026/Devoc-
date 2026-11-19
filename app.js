const $=id=>document.getElementById(id);
const DB_NAME="devocionario_biblico_db", STORE="items";
let db, books=[], currentBook=null, currentChapter=1, deferredPrompt=null;
const seed=[
 {id:"marcos",name:"Evangelio de Marcos",chapters:16,description:"Guía para el predicador · 16 prédicas",docTitle:"Devocionario_Guia_Predicador_Evangelio_Marcos_1_a_16.docx",content:null},
 {id:"lucas",name:"Evangelio de Lucas",chapters:24,description:"Jesús, el Salvador que transforma vidas · 24 prédicas",docTitle:"Devocionario_Lucas_24_Capitulos.docx",content:null}
];
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:"id"});r.onsuccess=()=>{db=r.result;resolve()};r.onerror=()=>reject(r.error)})}
function put(item){return new Promise((res,rej)=>{let t=db.transaction(STORE,"readwrite");t.objectStore(STORE).put(item);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
function all(){return new Promise((res,rej)=>{let r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function del(id){return new Promise(res=>{let t=db.transaction(STORE,"readwrite");t.objectStore(STORE).delete(id);t.oncomplete=res})}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600)}
function show(view){document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));$(view+"View").classList.remove("hidden");document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("sidebar").classList.remove("open");}
function safe(s){return (s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function refresh(){
 const items=await all(); books=items.filter(x=>x.type==="book");
 const allBooks=[...seed.filter(s=>!books.some(b=>b.id===s.id)),...books];
 $("stats").innerHTML=`<div class="stat"><strong>${allBooks.length}</strong><span>Libros registrados</span></div><div class="stat"><strong>${items.filter(x=>x.type==="doc").length}</strong><span>Documentos Word</span></div><div class="stat"><strong>${items.filter(x=>x.type==="image").length}</strong><span>Infografías agregadas</span></div>`;
 $("homeBooks").innerHTML=allBooks.map(bookCard).join("");
 $("booksList").innerHTML=allBooks.map(bookCard).join("");
 $("documentsList").innerHTML=[...seed.filter(b=>!books.some(x=>x.id===b.id)).map(b=>({name:b.docTitle,book:b.name,seed:true})),...items.filter(x=>x.type==="doc").map(d=>({name:d.title,book:d.bookName,id:d.id}))].map(d=>`<div class="doc-row"><div><strong>${safe(d.name)}</strong><span class="small muted">${safe(d.book)}</span></div><span class="tag">${d.seed?"Word por incorporar":"Importado"}</span></div>`).join("");
 $("imageBook").innerHTML=allBooks.map(b=>`<option value="${b.id}">${safe(b.name)}</option>`).join("");
 updateImageChapters();
}
function bookCard(b){return `<button class="book-card" data-book="${b.id}"><div class="symbol">✧</div><h3>${safe(b.name)}</h3><p>${safe(b.description||`${b.chapters} capítulos`)}</p><span class="tag">${b.chapters} capítulos</span></button>`}
function findBook(id){return books.find(b=>b.id===id)||seed.find(b=>b.id===id)}
async function openBook(id,chapter=1){currentBook=findBook(id);if(!currentBook)return;currentChapter=chapter;show("reader");await renderChapter()}
async function renderChapter(){
 let b=currentBook; $("readerBookLabel").textContent=b.name.toUpperCase();$("readerTitle").textContent=`Capítulo ${currentChapter}`;$("readerRef").textContent=b.description||"Devocionario bíblico";
 $("chapterSelect").innerHTML=Array.from({length:b.chapters},(_,i)=>`<option value="${i+1}" ${i+1===currentChapter?"selected":""}>Capítulo ${i+1}</option>`).join("");
 let content=b.chapterContent?.[currentChapter]||b.content;
 if(content){$("sermonContent").innerHTML=content}else{$("sermonContent").innerHTML=`<h2>Material pendiente de incorporar</h2><p>Este capítulo está registrado en el índice. Para leer la prédica completa, importa el documento Word correspondiente desde <b>Agregar contenido</b>.</p><p>Documento esperado: <b>${safe(b.docTitle||"Documento Word del libro")}</b></p><p>Una vez importado, el texto del capítulo se mostrará aquí y podrás asociar sus infografías.</p>`}
 let imgs=(await all()).filter(x=>x.type==="image"&&x.bookId===b.id&&x.chapter===currentChapter);
 $("chapterImages").innerHTML=imgs.length?imgs.map(i=>`<div class="image-card"><img src="${i.data}" alt="${safe(i.caption)}"><p>${safe(i.caption)}</p></div>`).join(""):"<p class='muted'>No hay infografías incorporadas a este capítulo todavía.</p>";
 $("prevChapter").disabled=currentChapter===1;$("nextChapter").disabled=currentChapter===b.chapters;
 localStorage.setItem("devocionario_recent",JSON.stringify({id:b.id,chapter:currentChapter,name:b.name}));
 $("recentBox").textContent=`${b.name} · Capítulo ${currentChapter}`;
}
function updateImageChapters(){let b=findBook($("imageBook").value)||seed[0];$("imageChapter").innerHTML=Array.from({length:b.chapters},(_,i)=>`<option value="${i+1}">Capítulo ${i+1}</option>`).join("")}
document.addEventListener("click",e=>{let c=e.target.closest("[data-book]");if(c)openBook(c.dataset.book)});
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>show(b.dataset.view));
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
$("continueBtn").onclick=()=>{let r=JSON.parse(localStorage.getItem("devocionario_recent")||"null");openBook(r?.id||"marcos",r?.chapter||1)};
$("backBooks").onclick=()=>show("books");
$("chapterSelect").onchange=e=>{currentChapter=+e.target.value;renderChapter()};
$("prevChapter").onclick=()=>{if(currentChapter>1){currentChapter--;renderChapter()}};
$("nextChapter").onclick=()=>{if(currentChapter<currentBook.chapters){currentChapter++;renderChapter()}};
$("printBtn").onclick=()=>window.print();
$("favoriteBtn").onclick=()=>{let a=JSON.parse(localStorage.getItem("devocionario_favs")||"[]"),k=currentBook.id+":"+currentChapter;if(!a.includes(k))a.push(k);else a=a.filter(x=>x!==k);localStorage.setItem("devocionario_favs",JSON.stringify(a));toast("Favorito actualizado")};
$("markReadBtn").onclick=()=>{let a=JSON.parse(localStorage.getItem("devocionario_read")||"[]"),k=currentBook.id+":"+currentChapter;if(!a.includes(k))a.push(k);localStorage.setItem("devocionario_read",JSON.stringify(a));toast("Capítulo marcado como leído")};
$("bookSearch").oninput=e=>{let q=e.target.value.toLowerCase();$("booksList").innerHTML=[...seed.filter(s=>!books.some(b=>b.id===s.id)),...books].filter(b=>b.name.toLowerCase().includes(q)).map(bookCard).join("")};
$("imageBook").onchange=updateImageChapters;
$("importWordBtn").onclick=async()=>{
 const f=$("wordFile").files[0],name=$("bookName").value.trim(),title=$("docTitle").value.trim()||f?.name;
 if(!f||!name){$("importStatus").textContent="Selecciona un archivo Word y escribe el nombre del libro.";return}
 $("importStatus").textContent="Leyendo documento...";
 try{
  if(!window.mammoth)throw new Error("No se pudo cargar el lector DOCX. Verifica tu conexión.");
  const result=await mammoth.convertToHtml({arrayBuffer:await f.arrayBuffer()},{styleMap:["p[style-name='Title'] => h1:fresh","p[style-name='Heading 1'] => h1:fresh","p[style-name='Heading 2'] => h2:fresh","p[style-name='Heading 3'] => h3:fresh"]});
  let html=result.value;const parser=new DOMParser(),doc=parser.parseFromString(html,"text/html");
  // Algunos Word usan párrafos normales en vez de estilos de encabezado.
  [...doc.body.querySelectorAll('p')].forEach(p=>{if(/^(cap[ií]tulo|pr[eé]dica)\s*\d+/i.test(p.textContent.trim())){const h=doc.createElement('h2');h.innerHTML=p.innerHTML;p.replaceWith(h)}});
  const nodes=[...doc.body.children],chapters={};let active=null,buffer=[];
  const save=()=>{if(active!==null)chapters[active]=buffer.join('')};
  for(const el of nodes){
    const m=el.textContent.trim().match(/^(?:cap[ií]tulo|pr[eé]dica)\s*(\d+)\b/i);
    if(m){save();active=Number(m[1]);buffer=[`<h2>${safe(el.textContent.trim())}</h2>`]}
    else if(active!==null)buffer.push(el.outerHTML);
  }
  save();
  const max=Math.max(0,...Object.keys(chapters).map(Number));
  const normalized=name.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const known=seed.find(b=>normalized.includes(b.name.replace(/^Evangelio de /i,'').toLocaleLowerCase('es')));
  const existing=known||books.find(b=>normalized===b.name.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,''));
  const id=existing?.id||('book_'+Date.now());
  const chapterCount=max||existing?.chapters||1;
  const book={...(existing||{}),id,type:'book',name:existing?.name||name,chapters:chapterCount,description:existing?.description||title,docTitle:title,chapterContent:{...(existing?.chapterContent||{}),...chapters},content:html,addedAt:existing?.addedAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  await put(book);
  const prior=(await all()).find(x=>x.type==='doc'&&x.title===title&&x.bookId===id);
  await put({id:prior?.id||'doc_'+Date.now(),type:'doc',title,bookId:id,bookName:book.name,addedAt:prior?.addedAt||new Date().toISOString()});
  const found=Object.keys(chapters).length;
  $('importStatus').textContent=`Documento incorporado a ${book.name}. ${found} capítulos detectados. ${found<book.chapters?'Los capítulos no detectados se conservan como pendientes.':'Índice actualizado.'}`;
  await refresh();toast('Libro actualizado sin crear duplicados');

 }catch(err){$("importStatus").textContent="No se pudo importar: "+err.message}
};
$("addImageBtn").onclick=async()=>{
 const f=$("imageFile").files[0];if(!f){$("imageStatus").textContent="Selecciona una imagen.";return}
 const reader=new FileReader();reader.onload=async()=>{await put({id:"img_"+Date.now(),type:"image",bookId:$("imageBook").value,chapter:+$("imageChapter").value,caption:$("imageCaption").value||"Infografía",data:reader.result});$("imageStatus").textContent="Infografía agregada.";if(currentBook?.id===$("imageBook").value)renderChapter();refresh()};reader.readAsDataURL(f)
};
$("backupBtn").onclick=async()=>{let data={version:1,items:await all(),favorites:localStorage.getItem("devocionario_favs"),read:localStorage.getItem("devocionario_read")};let blob=new Blob([JSON.stringify(data)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="respaldo_devocionario.json";a.click();URL.revokeObjectURL(a.href)};
$("restoreFile").onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let d=JSON.parse(await f.text());for(const x of d.items||[])await put(x);if(d.favorites)localStorage.setItem("devocionario_favs",d.favorites);if(d.read)localStorage.setItem("devocionario_read",d.read);await refresh();toast("Respaldo restaurado")}catch(err){toast("No se pudo restaurar el respaldo")}};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden")});
$("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null}else toast("Usa el menú del navegador: Añadir a pantalla de inicio")};
(async()=>{await openDB();await refresh();let r=JSON.parse(localStorage.getItem("devocionario_recent")||"null");if(r)$("recentBox").textContent=`${r.name} · Capítulo ${r.chapter}`;})();

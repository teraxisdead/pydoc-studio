(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = { files: [], dragIndex: null };
  const els = {
    input: $("fileInput"), choose: $("chooseBtn"), browse: $("browseBtn"),
    drop: $("dropZone"), list: $("fileList"), empty: $("emptyState"),
    count: $("fileCount"), size: $("totalSize"), clear: $("clearBtn"),
    search: $("searchInput"), generate: $("generateBtn"),
    progress: $("progressWrap"), progressText: $("progressText"),
    progressPercent: $("progressPercent"), progressBar: $("progressBar"),
    message: $("message"), modal: $("previewModal"),
    previewTitle: $("previewTitle"), previewContent: $("previewContent")
  };

  const formatSize = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1048576).toFixed(2)} MB`;
  const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function setMessage(message, error=false) {
    els.message.textContent = message;
    els.message.classList.toggle("error", error);
  }
  function render() {
    const query = els.search.value.trim().toLowerCase();
    const visible = state.files.map((f,i)=>({...f,index:i})).filter(f=>f.name.toLowerCase().includes(query));
    els.list.innerHTML = "";
    visible.forEach(file => {
      const row = document.createElement("div");
      row.className = "file-row";
      row.draggable = true;
      row.dataset.index = file.index;
      row.innerHTML = `
        <div class="file-type">${file.binary ? "BIN" : escapeHtml((file.name.split(".").pop() || "TXT").slice(0,4).toUpperCase())}</div>
        <div><div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div><div class="file-meta">${formatSize(file.size)}</div></div>
        <button class="row-action preview-action" data-action="preview" data-index="${file.index}">Preview</button>
        <button class="row-action" data-action="up" data-index="${file.index}" title="Move up">↑</button>
        <button class="row-action remove" data-action="remove" data-index="${file.index}" title="Remove">×</button>`;
      row.addEventListener("dragstart", e => { state.dragIndex=file.index; row.classList.add("dragging"); e.dataTransfer.effectAllowed="move"; });
      row.addEventListener("dragend", ()=>row.classList.remove("dragging"));
      row.addEventListener("dragover", e=>{e.preventDefault();row.classList.add("over");});
      row.addEventListener("dragleave", ()=>row.classList.remove("over"));
      row.addEventListener("drop", e=>{
        e.preventDefault(); row.classList.remove("over");
        const from=state.dragIndex, to=file.index;
        if(from!==null && from!==to){const [moved]=state.files.splice(from,1);state.files.splice(to,0,moved);render();}
      });
      els.list.appendChild(row);
    });
    const total = state.files.reduce((n,f)=>n+f.size,0);
    els.count.textContent = `${state.files.length} ${state.files.length===1?"file":"files"}`;
    els.size.textContent = ` · ${formatSize(total)}`;
    els.empty.hidden = visible.length>0;
    if (state.files.length && !visible.length) { els.empty.hidden=false; els.empty.innerHTML="<strong>No matching filenames</strong><span>Try a different search.</span>"; }
    els.clear.disabled = !state.files.length;
    els.generate.disabled = !state.files.length;
  }
  function looksBinary(bytes) {
    const sample = bytes.subarray(0, Math.min(bytes.length, 8192));
    if (sample.includes(0)) return true;
    let unusual = 0;
    for (const b of sample) {
      if (b === 9 || b === 10 || b === 13 || b >= 32) continue;
      unusual++;
    }
    return sample.length > 0 && unusual / sample.length > 0.12;
  }
  function hexDump(bytes) {
    const lines = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.subarray(i, i + 16);
      const hex = Array.from(chunk, b => b.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
      const ascii = Array.from(chunk, b => b >= 32 && b <= 126 ? String.fromCharCode(b) : ".").join("");
      lines.push(`${i.toString(16).padStart(8, "0")}  ${hex}  ${ascii}`);
    }
    return lines.join("\n");
  }
  async function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const existing = new Set(state.files.map(f=>`${f.name}:${f.size}:${f.lastModified}`));
    let added=0;
    for (const file of incoming) {
      const key=`${file.name}:${file.size}:${file.lastModified}`;
      if(existing.has(key)) continue;
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const binary = looksBinary(bytes);
        let content;
        if (binary) {
          const MAX_BINARY_DUMP = 2 * 1024 * 1024;
          const shown = bytes.subarray(0, Math.min(bytes.length, MAX_BINARY_DUMP));
          content = `[BINARY FILE: ${file.name}]\nOriginal size: ${formatSize(file.size)} (${file.size} bytes)\nDisplayed as hexadecimal and ASCII bytes.\n\n${hexDump(shown)}`;
          if (bytes.length > MAX_BINARY_DUMP) content += `\n\n[TRUNCATED: showing first ${MAX_BINARY_DUMP} bytes of ${bytes.length} total bytes.]`;
        } else {
          content = new TextDecoder("utf-8").decode(bytes);
        }
        state.files.push({name:file.name,size:file.size,lastModified:file.lastModified,content,binary});
        existing.add(key); added++;
      } catch (err) {
        console.error("Unable to read file", file.name, err);
        setMessage(`Could not read ${file.name}.`,true);
      }
    }
    render();
    if(added) setMessage(`Added ${added} file${added===1?"":"s"}. All file types are accepted; binary files are shown as a hex dump.`);
    else setMessage("No new files were added. They may already be in the list.");
    els.input.value="";
  }
  els.choose.addEventListener("click",()=>els.input.click());
  els.browse.addEventListener("click",e=>{e.stopPropagation();els.input.click();});
  els.drop.addEventListener("click",e=>{if(e.target.closest("button"))return;els.input.click();});
  els.drop.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();els.input.click();}});
  els.input.addEventListener("change",e=>addFiles(e.target.files));
  ["dragenter","dragover"].forEach(type=>els.drop.addEventListener(type,e=>{e.preventDefault();els.drop.classList.add("dragover");}));
  ["dragleave","drop"].forEach(type=>els.drop.addEventListener(type,e=>{e.preventDefault();els.drop.classList.remove("dragover");}));
  els.drop.addEventListener("drop",e=>addFiles(e.dataTransfer.files));
  els.search.addEventListener("input",render);
  els.clear.addEventListener("click",()=>{state.files=[];render();setMessage("All files removed.");});
  els.list.addEventListener("click",e=>{
    const btn=e.target.closest("button[data-action]"); if(!btn)return;
    const i=Number(btn.dataset.index), action=btn.dataset.action;
    if(action==="remove"){state.files.splice(i,1);render();setMessage("File removed.");}
    if(action==="up" && i>0){[state.files[i-1],state.files[i]]=[state.files[i],state.files[i-1]];render();}
    if(action==="preview"){const f=state.files[i];els.previewTitle.textContent=f.name+(f.binary?" · binary hex view":"");els.previewContent.textContent=f.content;els.modal.hidden=false;}
  });
  function closePreview(){els.modal.hidden=true;}
  $("closePreview").addEventListener("click",closePreview);
  els.modal.addEventListener("click",e=>{if(e.target.dataset.close)closePreview();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closePreview();});

  function wrapCodeLine(line, maxChars) {
    if(line.length<=maxChars) return [line];
    const chunks=[];
    let rest=line;
    while(rest.length>maxChars){
      let cut=rest.lastIndexOf(" ",maxChars);
      if(cut<Math.floor(maxChars*.45)) cut=maxChars;
      chunks.push(rest.slice(0,cut));
      rest=rest.slice(cut);
    }
    chunks.push(rest);
    return chunks;
  }
  async function buildPdf() {
    if(!window.jspdf?.jsPDF){setMessage("PDF library did not load. Check your internet connection and reload the page.",true);return;}
    els.generate.disabled=true;els.progress.hidden=false;setMessage("");
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
    const pageW=210,pageH=297,left=17,right=15,top=19,bottom=17;
    const usableW=pageW-left-right;
    const codeFontSize=8.2,lineH=4.1;
    const maxChars=Math.floor(usableW/(codeFontSize*0.1778));
    let pageHasContent=false;
    function footer(){
      const n=doc.internal.getNumberOfPages();
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(125,132,148);
      doc.text(`PyDoc Studio  ·  Page ${n}`,pageW-right,pageH-8,{align:"right"});
      doc.setDrawColor(220,223,230);doc.setLineWidth(.2);doc.line(left,pageH-13,pageW-right,pageH-13);
    }
    function newPage(){if(pageHasContent)footer();doc.addPage();pageHasContent=true;}
    // Cover page
    doc.setFillColor(18,21,32);doc.rect(0,0,pageW,pageH,"F");
    doc.setTextColor(165,154,255);doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("PYDOC STUDIO",left,57);
    doc.setTextColor(245,246,250);doc.setFontSize(27);doc.text("Python Code Collection",left,78);
    doc.setTextColor(173,181,198);doc.setFont("helvetica","normal");doc.setFontSize(11);
    doc.text(`${state.files.length} files · Generated ${new Date().toLocaleString()}`,left,90);
    doc.setDrawColor(100,91,180);doc.line(left,101,pageW-right,101);
    doc.setTextColor(225,229,239);doc.setFontSize(10);doc.text("FILES INCLUDED",left,114);
    doc.setFontSize(9);let y=124;
    state.files.forEach((f,i)=>{
      if(y>pageH-28){footer();doc.addPage();y=top;}
      doc.setTextColor(160,169,188);doc.text(`${String(i+1).padStart(2,"0")}.`,left,y);
      doc.setTextColor(230,233,242);doc.text(f.name.slice(0,72),left+10,y);
      y+=7;
    });
    footer(); pageHasContent=false;

    for(let fi=0;fi<state.files.length;fi++){
      const f=state.files[fi];
      doc.addPage();pageHasContent=true;
      let y=top;
      doc.setFont("helvetica","bold");doc.setFontSize(17);doc.setTextColor(36,39,52);
      const titleLines=doc.splitTextToSize(f.name,usableW);
      titleLines.forEach(line=>{doc.text(line,left,y);y+=7;});
      if (f.binary) { doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(145,91,50); doc.text("BINARY FILE · displayed as hexadecimal / ASCII",left,y); y+=5; }
      doc.setDrawColor(133,121,240);doc.setLineWidth(.8);doc.line(left,y+1,pageW-right,y+1);y+=9;
      doc.setFont("courier","normal");doc.setFontSize(codeFontSize);doc.setTextColor(35,39,48);
      const rawLines=f.content.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n");
      const showNums=$("lineNumbers").checked;
      const numberWidth=showNums?9:0;
      rawLines.forEach((original,index)=>{
        const prefix=showNums?`${String(index+1).padStart(4," ")}  `:"";
        const line=prefix+original.replace(/\t/g,"    ");
        const pieces=wrapCodeLine(line,Math.max(20,maxChars-(showNums?7:0)));
        pieces.forEach((piece,pi)=>{
          if(y>pageH-bottom){footer();doc.addPage();pageHasContent=true;y=top;doc.setFont("courier","normal");doc.setFontSize(codeFontSize);doc.setTextColor(35,39,48);}
          // Use split text only for a single physical line so blank lines and ordering remain intact.
          doc.text(piece.length?piece:" ",left+(pi>0?numberWidth:0),y,{maxWidth:usableW-(pi>0?numberWidth:0),renderingMode:"fill"});
          y+=lineH;
        });
      });
      const pct=Math.round(((fi+1)/state.files.length)*100);
      els.progressBar.style.width=pct+"%";els.progressPercent.textContent=pct+"%";
      els.progressText.textContent=`Formatting ${f.name} (${fi+1} of ${state.files.length})`;
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(pageHasContent)footer();
    const safeBase=(state.files.length===1?state.files[0].name.replace(/\.[^.]+$/,""):"python-files-collection").replace(/[^\w.-]+/g,"_");
    doc.save(`${safeBase}.pdf`);
    els.progressText.textContent="PDF generated successfully";els.progressPercent.textContent="100%";els.progressBar.style.width="100%";
    setMessage("Your PDF has been generated and downloaded.");
    els.generate.disabled=false;
  }
  els.generate.addEventListener("click",()=>buildPdf().catch(err=>{console.error(err);setMessage("PDF generation failed. Try fewer files or smaller files.",true);els.generate.disabled=false;}));
  render();
})();

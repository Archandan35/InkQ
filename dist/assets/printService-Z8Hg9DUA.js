import{l as H,a as D}from"./index-CGDvAPPI.js";const E=210,T=297,z=13,U=t=>String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),Y=t=>String(t||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();function S(t,i){const e=i<t;return{landscape:e,wMm:e?T:E,hMm:e?E:T}}function j(t){const i=t||{},e=i.unit==="cm"?(Number(i.size)||0)*10:Number(i.size)||0;return{mL:i.side==="left"?e:0,mR:i.side==="right"?e:0}}function _(t,i,e,a){return t&&t.widths&&t.widths[i.id]?e/t.widths[i.id]:t&&t.displayW?e/t.displayW:e/a}function N(t){const i=document.createElement("iframe");i.title=t,i.setAttribute("aria-hidden","true"),i.className="print-frame",document.body.appendChild(i);const e=i.contentWindow;return e.document.title=t,{frame:i,win:e}}function B(t,i){return(t||[]).filter(e=>e.pageId===i&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&Number.isFinite(e.width)&&Number.isFinite(e.height)&&e.width>0&&e.height>0&&e.x>=-.001&&e.y>=-.001&&e.x+e.width<=1.001&&e.y+e.height<=1.001)}function C(t,i){const e=document.createElement("div");e.innerHTML=t||"";const a=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT);for(;a.nextNode();){const o=a.currentNode;if(o.style&&o.style.fontSize&&/px$/i.test(o.style.fontSize)){const n=parseFloat(o.style.fontSize)*i;o.style.fontSize=`${n.toFixed(2)}mm`,o.setAttribute("data-mm",n.toFixed(2))}}return e.innerHTML}function I(t,i){const e=parseFloat(t.getAttribute("data-mm"));e&&(t.style.fontSize=`${(e*i).toFixed(2)}mm`),t.querySelectorAll("[data-mm]").forEach(a=>{a.style.fontSize=`${(parseFloat(a.getAttribute("data-mm"))*i).toFixed(2)}mm`})}function G(t){t.document.querySelectorAll(".space-content").forEach(i=>{if(!i.getAttribute("data-mm")||i.scrollWidth<=i.clientWidth+.5&&i.scrollHeight<=i.clientHeight+.5)return;let e=.1,a=1;for(let o=0;o<16;o++){const n=(e+a)/2;I(i,n),i.scrollWidth<=i.clientWidth+.5&&i.scrollHeight<=i.clientHeight+.5?e=n:a=n}I(i,e)})}const J=`
@page { margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet {
  position: relative;
  overflow: hidden;
  page-break-after: always;
  background: #fff;
  margin: 0 auto;
}
.sheet:last-child { page-break-after: auto; }
.sheet img.bg {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: none;
  object-fit: contain;
}
.space-layer {
  position: absolute;
}
.space {
  position: absolute;
  border: none;
  background: transparent;
  border-radius: 6px;
  overflow: hidden;
}
.space .space-tag {
  position: absolute;
  top: 0; left: 0;
  font-weight: 700;
  color: #fff;
  background: #6a32f0;
  border-radius: 0 0 5px 0;
  padding: 1px 6px;
  line-height: 1.4;
  z-index: 2;
}
.space-content {
  width: 100%;
  height: 100%;
  font-size: 12px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  line-height: 1.5;
  text-align: justify;
  color: #161620;
  overflow: hidden;
  word-wrap: break-word;
}
`;function A(t,i){t.document.write(`<html><head><title>${U(t.document.title)}</title><style>${J}${i}</style></head><body>`)}async function K(t){await new Promise(e=>setTimeout(e,120));const i=t.document.querySelectorAll("img");await Promise.all([...i].map(e=>e.complete||new Promise(a=>{e.onload=e.onerror=a})))}function L(t,i,e){t.document.write("</body></html>"),t.document.close(),setTimeout(()=>{(e?Promise.resolve().then(e):Promise.resolve()).then(()=>{G(t),t.print();const n=()=>{i&&i.parentNode&&i.parentNode.removeChild(i)};t.onafterprint=n,setTimeout(n,6e4)})},400)}function q(t){return`font-size: ${(z*t).toFixed(2)}mm; padding: ${(8*t).toFixed(2)}mm 0;`}function O(t,i){return((i||{}).side||"off")==="off"?0:10*t}async function Z(t){const{frame:i,win:e}=N("InkQ — Print Scanned Image Only"),a=[];for(let o=0;o<t.length;o++){const n=await H(t[o].src),{wMm:r}=S(n.naturalWidth,n.naturalHeight),p=r,m=n.naturalHeight/n.naturalWidth*r;a.push(`@page print-raw-${o} { size: ${p.toFixed(2)}mm ${m.toFixed(2)}mm; margin: 0; }`)}A(e,a.join(""));for(let o=0;o<t.length;o++){const n=await H(t[o].src),{wMm:r}=S(n.naturalWidth,n.naturalHeight),p=r,m=n.naturalHeight/n.naturalWidth*r;e.document.write(`<div class="sheet" style="page: print-raw-${o}; width: ${p.toFixed(2)}mm; height: ${m.toFixed(2)}mm;"><img class="bg" src="${t[o].src}" style="width: ${p.toFixed(2)}mm; height: ${m.toFixed(2)}mm;" /></div>`)}L(e,i)}async function tt(t,i,e,a){const{frame:o,win:n}=N("InkQ — Print Whole Page (with Smart Blocks)"),{mL:r,mR:p}=j(a),m=(a||{}).side||"off",y=[];for(let d=0;d<t.length;d++){const s=await H(t[d].src),{wMm:l}=S(s.naturalWidth,s.naturalHeight),h=l,u=s.naturalHeight/s.naturalWidth*l;y.push(`@page print-page-${d} { size: ${h.toFixed(2)}mm ${u.toFixed(2)}mm; margin: 0; }`)}A(n,y.join(""));for(let d=0;d<t.length;d++){const s=t[d],l=await H(s.src),{wMm:h}=S(l.naturalWidth,l.naturalHeight),u=_(e,s,h,l.naturalWidth),g=h,w=l.naturalHeight/l.naturalWidth*h,$=await D(s),b=B(i,s.id),F=g-r-p;if(n.document.write(`<div class="sheet" style="page: print-page-${d}; width: ${g.toFixed(2)}mm; height: ${w.toFixed(2)}mm;"><img class="bg" src="${$}" style="width: ${g.toFixed(2)}mm; height: ${w.toFixed(2)}mm;" />`),b.length){const x=O(u,a),W=m==="right"?r+x:r,v=Math.max(0,F-x),c=u*(F>0?v/F:1);n.document.write(`<div class="space-layer" style="left: ${W.toFixed(2)}mm; top: 0; width: ${v.toFixed(2)}mm; height: ${w.toFixed(2)}mm;">`);for(const f of b){const k=m!=="off"&&f.pinned!==!1?m==="left"?0:1-f.width:f.x,M=C(f.text,c);n.document.write(`<div class="space" style="left: ${(k*100).toFixed(4)}%; top: ${(f.y*100).toFixed(4)}%; width: ${(f.width*100).toFixed(4)}%; height: ${(f.height*100).toFixed(4)}%;"><div class="space-content" data-mm="${(z*c).toFixed(2)}" style="${q(c)}">${M}</div></div>`)}n.document.write("</div>")}n.document.write("</div>")}L(n,o,()=>K(n))}async function et(t,i,e,a){const{frame:o,win:n}=N("InkQ — Print Smart Blocks Only"),{mL:r,mR:p}=j(a),m=(a||{}).side||"off",y=[],d=[];for(let s=0;s<t.length;s++){const l=await H(t[s].src),{wMm:h,hMm:u}=S(l.naturalWidth,l.naturalHeight),g=_(e,t[s],h,l.naturalWidth),w=B(i,t[s].id).map(c=>({s:c,plain:Y(c.text)})).filter(c=>c.plain);if(!w.length)continue;y.push(`@page print-block-${s} { size: ${h}mm ${u}mm; margin: 0; }`);const $=h-r-p,b=O(g,a),F=m==="right"?r+b:r,x=Math.max(0,$-b),W=g*($>0?x/$:1),v=w.map(({s:c})=>{const P=m!=="off"&&c.pinned!==!1?m==="left"?0:1-c.width:c.x,k=F+P*x,M=c.y*u,R=c.width*x,Q=c.height*u,X=C(c.text,W);return`<div class="space-content" data-mm="${(z*W).toFixed(2)}" style="position: absolute; left: ${k.toFixed(2)}mm; top: ${M.toFixed(2)}mm; width: ${R.toFixed(2)}mm; height: ${Q.toFixed(2)}mm; ${q(W)}">${X}</div>`}).join("");d.push(`<div class="sheet" style="page: print-block-${s}; width: ${h}mm; height: ${u}mm;">${v}</div>`)}A(n,y.join("")),d.forEach(s=>n.document.write(s)),L(n,o)}export{Z as printScannedOnly,et as printSmartBlocks,tt as printWholePage};

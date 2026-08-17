/**
 * Copyright 2025 Aiden Bai, Million Software, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
(function(e,t){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});var n=Object.defineProperty,r=(e,t)=>()=>(e&&(t=e(e=0)),t),i=(e,t)=>{let r={};for(var i in e)n(r,i,{get:e[i],enumerable:!0});return t||n(r,Symbol.toStringTag,{value:`Module`}),r};Array.prototype.toSorted||Object.defineProperty(Array.prototype,`toSorted`,{value:function(e){return[...this].sort(e)},writable:!0,configurable:!0});var a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,ee,te,ne,x=r((()=>{a=e=>Object.assign(e,{[Symbol.dispose]:e}),o=`0.6.0`,s=`bippy-${o}`,c=Object.defineProperty,l=Object.prototype.hasOwnProperty,u=()=>{},d=e=>{try{Function.prototype.toString.call(e).indexOf(`^_^`)>-1&&setTimeout(()=>{throw Error(`React is running in production mode, but dead code elimination has not been applied. Read how to correctly configure React for production: https://reactjs.org/link/perf-use-production-build`)})}catch{}},f=(e=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__)=>!!(e&&`getFiberRoots`in e),p=!1,h=(e=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__)=>p?!0:(e&&typeof e.inject==`function`&&(m=e.inject.toString()),!!(m!=null&&m.includes(`(injected)`))),g=new Set,_=new Set,v=e=>{e&&g.add(e);let t=new Map,n=0,r={_instrumentationIsActive:!1,_instrumentationSource:s,checkDCE:d,hasUnsupportedRendererAttached:!1,inject(e){let i=++n;return t.set(i,e),_.add(e),r._instrumentationIsActive||(r._instrumentationIsActive=!0,g.forEach(e=>e())),i},on:u,onCommitFiberRoot:u,onCommitFiberUnmount:u,onPostCommitFiberRoot:u,renderers:t,supportsFiber:!0,supportsFlight:!0};try{c(globalThis,`__REACT_DEVTOOLS_GLOBAL_HOOK__`,{configurable:!0,enumerable:!0,get(){return r},set(t){if(t&&typeof t==`object`){let n=r.renderers;r=t,n.size>0&&(n.forEach((e,n)=>{_.add(e),t.renderers.set(n,e)}),y(e))}}});let t=window.hasOwnProperty,n=!1;c(window,`hasOwnProperty`,{configurable:!0,value:function(...e){try{if(!n&&e[0]===`__REACT_DEVTOOLS_GLOBAL_HOOK__`)return globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__=void 0,n=!0,-0}catch{}return t.apply(this,e)},writable:!0})}catch{y(e)}return r},y=e=>{e&&g.add(e);try{let t=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!t)return;if(!t._instrumentationSource){t.checkDCE=d,t.supportsFiber=!0,t.supportsFlight=!0,t.hasUnsupportedRendererAttached=!1,t._instrumentationSource=s,t._instrumentationIsActive=!1;let e=f(t);if(e||(t.on=u),t.renderers.size){t._instrumentationIsActive=!0,g.forEach(e=>e());return}let n=t.inject,r=h(t);r&&!e&&(p=!0,t.inject({scheduleRefresh(){}})&&(t._instrumentationIsActive=!0)),t.inject=e=>{let i=n(e);return _.add(e),r&&t.renderers.set(i,e),t._instrumentationIsActive=!0,g.forEach(e=>e()),i}}(t.renderers.size||t._instrumentationIsActive||h())&&(e==null||e())}catch{}},b=()=>l.call(globalThis,`__REACT_DEVTOOLS_GLOBAL_HOOK__`),ee=e=>b()?(y(e),globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__):v(e),te=()=>{var e,t;return!!(typeof window<`u`&&((e=window.document)!=null&&e.createElement||((t=window.navigator)==null?void 0:t.product)===`ReactNative`))},ne=()=>{try{te()&&ee()}catch{}}})),S=r((()=>{x(),ne()}));function re(e,t,n=!1){if(!e)return null;let r=t(e);if(r instanceof Promise)return(async()=>{if(await r===!0)return e;let i=n?e.return:e.child;for(;i;){let e=await ge(i,t,n);if(e)return e;i=n?null:i.sibling}return null})();if(r===!0)return e;let i=n?e.return:e.child;for(;i;){let e=he(i,t,n);if(e)return e;i=n?null:i.sibling}return null}var ie,ae,oe,se,ce,le,ue,de,fe,C,pe,me,he,ge,w,_e,ve,ye,be,xe,Se,Ce,we,Te,Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re,ze,Be,Ve,He,Ue,We=r((()=>{x(),ie=60111,ae=`Symbol(react.concurrent_mode)`,oe=`Symbol(react.async_mode)`,se=13366,ce=e=>{switch(e.tag){case 5:case 26:case 27:return!0;default:return typeof e.type==`string`}},le=e=>{switch(e.tag){case 1:case 11:case 0:case 14:case 15:return!0;default:return!1}},ue=(e,t)=>{try{var n;let r=e.dependencies,i=(n=e.alternate)==null?void 0:n.dependencies;if(!r||!i||typeof r!=`object`||!(`firstContext`in r)||typeof i!=`object`||!(`firstContext`in i))return!1;let a=r.firstContext,o=i.firstContext;for(;a&&typeof a==`object`&&`memoizedValue`in a||o&&typeof o==`object`&&`memoizedValue`in o;){if(t(a,o)===!0)return!0;a=a==null?void 0:a.next,o=o==null?void 0:o.next}}catch{}return!1},de=e=>{var t,n,r;let i=e.memoizedProps,a=((t=e.alternate)==null?void 0:t.memoizedProps)||{},o=(n=(r=e.flags)==null?e.effectTag:r)==null?0:n;switch(e.tag){case 1:case 9:case 11:case 0:case 14:case 15:return(o&1)==1;default:return e.alternate?a!==i||e.alternate.memoizedState!==e.memoizedState||e.alternate.ref!==e.ref:!0}},fe=e=>!!(e.flags&(se|8)||e.subtreeFlags&(se|8)),C=e=>{let t=[],n=[e];for(;n.length;){let e=n.pop();e&&(ce(e)&&fe(e)&&de(e)&&t.push(e),e.child&&n.push(e.child),e.sibling&&n.push(e.sibling))}return t},pe=e=>{switch(e.tag){case 18:return!0;case 7:case 6:case 23:case 22:return!0;case 3:return!1;default:{let t=typeof e.type==`object`&&e.type!==null?e.type.$$typeof:e.type;if(typeof t==`symbol`)return t.description===`react.concurrent_mode`||t.description===`react.async_mode`;switch(t){case ie:case ae:case oe:return!0;default:return!1}}}},me=e=>{let t=[],n=[];for(ce(e)?t.push(e):e.child&&n.push(e.child);n.length;){let e=n.pop();if(!e)break;ce(e)?t.push(e):e.child&&n.push(e.child),e.sibling&&n.push(e.sibling)}return t},he=(e,t,n=!1)=>{if(!e)return null;if(t(e)===!0)return e;let r=n?e.return:e.child;for(;r;){let e=he(r,t,n);if(e)return e;r=n?null:r.sibling}return null},ge=async(e,t,n=!1)=>{if(!e)return null;if(await t(e)===!0)return e;let r=n?e.return:e.child;for(;r;){let e=await ge(r,t,n);if(e)return e;r=n?null:r.sibling}return null},w=e=>{var t,n,r;let i=(t=e==null?void 0:e.actualDuration)==null?0:t,a=i,o=(n=e==null?void 0:e.child)==null?null:n;for(;i>0&&o!=null;)a-=(r=o.actualDuration)==null?0:r,o=o.sibling;return{selfTime:a,totalTime:i}},_e=e=>{var t;return!!((t=e.updateQueue)!=null&&t.memoCache)},ve=e=>{let t=e;return typeof t==`function`?t:typeof t==`object`&&t?ve(t.type||t.render):null},ye=e=>{let t=e;if(typeof t==`string`)return t;if(typeof t!=`function`&&!(typeof t==`object`&&t))return null;let n=t.displayName||t.name||null;if(n)return n;let r=ve(t);return r&&(r.displayName||r.name)||null},be=e=>{try{if(typeof e.version==`string`&&e.bundleType>0)return`development`}catch{}return`production`},xe=()=>{let e=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;return!!(e!=null&&e._instrumentationIsActive)||f(e)||h(e)},Se=new Set,Ce=0,we=new WeakMap,Te=(e,t=Ce++)=>{we.set(e,t)},Ee=e=>{let t=we.get(e);return!t&&e.alternate&&(t=we.get(e.alternate)),t||(t=Ce++,Te(e,t)),t},De=(e,t,n)=>{let r=t;for(;r!=null;){if(we.has(r)||Ee(r),!pe(r)&&de(r)&&e(r,`mount`),r.tag===13)if(r.memoizedState!==null){let t=r.child,n=t?t.sibling:null;if(n){let t=n.child;t!==null&&De(e,t,!1)}}else{let t=null;r.child!==null&&(t=r.child.child),t!==null&&De(e,t,!1)}else r.child!=null&&De(e,r.child,!0);r=n?r.sibling:null}},Oe=(e,t,n,r)=>{if(we.has(t)||Ee(t),!n)return;we.has(n)||Ee(n);let i=t.tag===13,a=!pe(t);a&&de(t)&&e(t,`update`);let o=i&&n.memoizedState!==null,s=i&&t.memoizedState!==null;if(o&&s){var c,l,u,d;let r=(c=(l=t.child)==null?void 0:l.sibling)==null?null:c,i=(u=(d=n.child)==null?void 0:d.sibling)==null?null:u;r!==null&&i!==null&&Oe(e,r,i,t)}else if(o&&!s){let n=t.child;n!==null&&De(e,n,!0)}else if(!o&&s){var f,p;Ae(e,n);let r=(f=(p=t.child)==null?void 0:p.sibling)==null?null:f;r!==null&&De(e,r,!0)}else if(t.child!==n.child){let n=t.child;for(;n;){if(n.alternate){let i=n.alternate;Oe(e,n,i,a?t:r)}else De(e,n,!1);n=n.sibling}}},ke=(e,t)=>{(t.tag===3||!pe(t))&&e(t,`unmount`)},Ae=(e,t)=>{var n,r,i,a;let o=t.tag===13&&t.memoizedState!==null,s=t.child;for(o&&(s=(n=(r=(i=(a=t.child)==null?void 0:a.sibling)==null?null:i)==null?void 0:r.child)==null?null:n);s!==null;)s.return!==null&&(ke(e,s),Ae(e,s)),s=s.sibling},je=0,Me=new WeakMap,Ne=(e,t)=>{let n=`current`in e?e.current:e,r=Me.get(e);r||(r={id:je++,prevFiber:null},Me.set(e,r));let{prevFiber:i}=r;if(!n)ke(t,n);else if(i!==null){let e=i&&i.memoizedState!=null&&i.memoizedState.element!=null&&i.memoizedState.isDehydrated!==!0,r=n.memoizedState!=null&&n.memoizedState.element!=null&&n.memoizedState.isDehydrated!==!0;!e&&r?De(t,n,!1):e&&r?Oe(t,n,n.alternate,null):e&&!r&&ke(t,n)}else De(t,n,!0);r.prevFiber=n},Pe=e=>Object.prototype.toString.call(e)===`[object Object]`&&(Object.getPrototypeOf(e)===Object.prototype||Object.getPrototypeOf(e)===null),Fe=(e,t=[])=>{if(!Pe(e))return[{path:t,value:e}];let n=[];for(let r in e){let i=e[r],a=t.concat(r);Pe(i)?n.push(...Fe(i,a)):n.push({path:a,value:i})}return n},Ie=new Set,Le=new Set,Re=new Set,ze=new Set,Be=new WeakMap,Ve=new WeakMap,He=e=>{var t;let n=(t=Be.get(e))==null?{}:t;if(Be.set(e,n),!n.onCommitFiberRoot||e.onCommitFiberRoot!==n.onCommitFiberRoot){let t=e.onCommitFiberRoot,r=(n,i,a)=>{var o;if(t==null||t(n,i,a),((o=Be.get(e))==null?void 0:o.onCommitFiberRoot)===r){Se.add(i),Ve.set(i,n);for(let e of Ie)e(n,i,a)}};n.onCommitFiberRoot=r,e.onCommitFiberRoot=r}if(!n.onCommitFiberUnmount||e.onCommitFiberUnmount!==n.onCommitFiberUnmount){let t=e.onCommitFiberUnmount,r=(n,i)=>{var a;if(t==null||t(n,i),((a=Be.get(e))==null?void 0:a.onCommitFiberUnmount)===r)for(let e of Le)e(n,i)};n.onCommitFiberUnmount=r,e.onCommitFiberUnmount=r}if(!n.onPostCommitFiberRoot||e.onPostCommitFiberRoot!==n.onPostCommitFiberRoot){let t=e.onPostCommitFiberRoot,r=(n,i)=>{var a;if(t==null||t(n,i),((a=Be.get(e))==null?void 0:a.onPostCommitFiberRoot)===r)for(let e of Re)e(n,i)};n.onPostCommitFiberRoot=r,e.onPostCommitFiberRoot=r}if(!n.onScheduleFiberRoot||e.onScheduleFiberRoot!==n.onScheduleFiberRoot){let t=e.onScheduleFiberRoot,r=(n,i,a)=>{var o;if(t==null||t(n,i,a),((o=Be.get(e))==null?void 0:o.onScheduleFiberRoot)===r)for(let e of ze)e(n,i,a)};n.onScheduleFiberRoot=r,e.onScheduleFiberRoot=r}},Ue=e=>{var t;let n=ee(e.onActive);n._instrumentationSource=(t=e.name)==null?s:t,He(n);let{onActive:r,onCommitFiberRoot:i,onCommitFiberUnmount:o,onPostCommitFiberRoot:c,onScheduleFiberRoot:l}=e;return i&&Ie.add(i),o&&Le.add(o),c&&Re.add(c),l&&ze.add(l),a(()=>{r&&g.delete(r),i&&Ie.delete(i),o&&Le.delete(o),c&&Re.delete(c),l&&ze.delete(l)})}})),Ge=r((()=>{x(),S(),We()})),Ke,qe=r((()=>{Ke=typeof window<`u`}));function Je(e){let t=String(e),n=t.length-1;return M.context.id+(n?String.fromCharCode(96+n):``)+t}function Ye(e){M.context=e}function Xe(){return{...M.context,id:M.getNextContextId(),count:0}}function Ze(e,t){let n=F,r=N,i=e.length===0,a=t===void 0?r:t,o=i?Qt:{owned:null,cleanups:null,context:a?a.context:null,owner:a},s=i?e:()=>e(()=>$e(()=>Ct(o)));N=o,F=null;try{return gt(s,!0)}finally{F=n,N=r}}function T(e,t){t=t?Object.assign({},qt,t):qt;let n={value:e,observers:null,observerSlots:null,comparator:t.equals||void 0};return[ut.bind(n),e=>(typeof e==`function`&&(e=P&&P.running&&P.sources.has(n)?e(n.tValue):e(n.value)),dt(n,e))]}function E(e,t,n){let r=mt(e,t,!1,Xt);$t&&P&&P.running?tn.push(r):ft(r)}function D(e,t,n){Yt=bt;let r=mt(e,t,!1,Xt),i=sn&&ct(sn);i&&(r.suspense=i),(!n||!n.render)&&(r.user=!0),nn?nn.push(r):ft(r)}function O(e,t,n){n=n?Object.assign({},qt,n):qt;let r=mt(e,t,!0,0);return r.observers=null,r.observerSlots=null,r.comparator=n.equals||void 0,$t&&P&&P.running?(r.tState=Xt,tn.push(r)):ft(r),ut.bind(r)}function Qe(e){return gt(e,!1)}function $e(e){if(!en&&F===null)return e();let t=F;F=null;try{return en?en.untrack(e):e()}finally{F=t}}function et(e,t,n){let r=Array.isArray(e),i,a=n&&n.defer;return n=>{let o;if(r){o=Array(e.length);for(let t=0;t<e.length;t++)o[t]=e[t]()}else o=e();if(a)return a=!1,n;let s=$e(()=>t(o,i,n));return i=o,s}}function tt(e){D(()=>$e(e))}function k(e){return N===null||(N.cleanups===null?N.cleanups=[e]:N.cleanups.push(e)),e}function nt(e,t){Jt||(Jt=Symbol(`error`)),N=mt(void 0,void 0,!0),N.context={...N.context,[Jt]:[t]},P&&P.running&&P.sources.add(N);try{return e()}catch(e){Dt(e)}finally{N=N.owner}}function rt(){return F}function it(){return N}function at(e,t){let n=N,r=F;N=e,F=null;try{return gt(t,!0)}catch(e){Dt(e)}finally{N=n,F=r}}function ot(e){if(P&&P.running)return e(),P.done;let t=F,n=N;return Promise.resolve().then(()=>{F=t,N=n;let r;return($t||sn)&&(r=P||(P={sources:new Set,effects:[],promises:new Set,disposed:new Set,queue:new Set,running:!0}),r.done||(r.done=new Promise(e=>r.resolve=e)),r.running=!0),gt(e,!1),F=N=null,r?r.done:void 0})}function st(e,t){let n=Symbol(`context`);return{id:n,Provider:kt(n),defaultValue:e}}function ct(e){let t;return N&&N.context&&(t=N.context[e.id])!==void 0?t:e.defaultValue}function lt(e){let t=O(e),n=O(()=>Ot(t()));return n.toArray=()=>{let e=n();return Array.isArray(e)?e:e==null?[]:[e]},n}function ut(){let e=P&&P.running;if(this.sources&&(e?this.tState:this.state))if((e?this.tState:this.state)===Xt)ft(this);else{let e=tn;tn=null,gt(()=>xt(this),!1),tn=e}if(F){let e=this.observers;if(!e||e[e.length-1]!==F){let t=e?e.length:0;F.sources?(F.sources.push(this),F.sourceSlots.push(t)):(F.sources=[this],F.sourceSlots=[t]),e?(e.push(F),this.observerSlots.push(F.sources.length-1)):(this.observers=[F],this.observerSlots=[F.sources.length-1])}}return e&&P.sources.has(this)?this.tValue:this.value}function dt(e,t,n){let r=P&&P.running&&P.sources.has(e)?e.tValue:e.value;if(!e.comparator||!e.comparator(r,t)){if(P){let r=P.running;(r||!n&&P.sources.has(e))&&(P.sources.add(e),e.tValue=t),r||(e.value=t)}else e.value=t;e.observers&&e.observers.length&&gt(()=>{for(let t=0;t<e.observers.length;t+=1){let n=e.observers[t],r=P&&P.running;r&&P.disposed.has(n)||((r?!n.tState:!n.state)&&(n.pure?tn.push(n):nn.push(n),n.observers&&St(n)),r?n.tState=Xt:n.state=Xt)}if(tn.length>1e6)throw tn=[],Error()},!1)}return t}function ft(e){if(!e.fn)return;Ct(e);let t=rn;pt(e,P&&P.running&&P.sources.has(e)?e.tValue:e.value,t),P&&!P.running&&P.sources.has(e)&&queueMicrotask(()=>{gt(()=>{P&&(P.running=!0),F=N=e,pt(e,e.tValue,t),F=N=null},!1)})}function pt(e,t,n){let r,i=N,a=F;F=N=e;try{r=e.fn(t)}catch(t){return e.pure&&(P&&P.running?(e.tState=Xt,e.tOwned&&e.tOwned.forEach(Ct),e.tOwned=void 0):(e.state=Xt,e.owned&&e.owned.forEach(Ct),e.owned=null)),e.updatedAt=n+1,Dt(t)}finally{F=a,N=i}(!e.updatedAt||e.updatedAt<=n)&&(e.updatedAt!=null&&`observers`in e?dt(e,r,!0):P&&P.running&&e.pure?(P.sources.has(e)||(e.value=r),P.sources.add(e),e.tValue=r):e.value=r,e.updatedAt=n)}function mt(e,t,n,r=Xt,i){let a={fn:e,state:r,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:t,owner:N,context:N?N.context:null,pure:n};if(P&&P.running&&(a.state=0,a.tState=r),N===null||N!==Qt&&(P&&P.running&&N.pure?N.tOwned?N.tOwned.push(a):N.tOwned=[a]:N.owned?N.owned.push(a):N.owned=[a]),en&&a.fn){let e=a.fn,[t,n]=T(void 0,{equals:!1}),r=en.factory(e,n);k(()=>r.dispose());let i,o=()=>ot(n).then(()=>{i&&(i.dispose(),i=void 0)});a.fn=n=>(t(),P&&P.running?(i||(i=en.factory(e,o)),i.track(n)):r.track(n))}return a}function ht(e){let t=P&&P.running;if((t?e.tState:e.state)===0)return;if((t?e.tState:e.state)===Zt)return xt(e);if(e.suspense&&$e(e.suspense.inFallback))return e.suspense.effects.push(e);let n=[e];for(;(e=e.owner)&&(!e.updatedAt||e.updatedAt<rn);){if(t&&P.disposed.has(e))return;(t?e.tState:e.state)&&n.push(e)}for(let r=n.length-1;r>=0;r--){if(e=n[r],t){let t=e,i=n[r+1];for(;(t=t.owner)&&t!==i;)if(P.disposed.has(t))return}if((t?e.tState:e.state)===Xt)ft(e);else if((t?e.tState:e.state)===Zt){let t=tn;tn=null,gt(()=>xt(e,n[0]),!1),tn=t}}}function gt(e,t){if(tn)return e();let n=!1;t||(tn=[]),nn?n=!0:nn=[],rn++;try{let t=e();return _t(n),t}catch(e){n||(nn=null),tn=null,Dt(e)}}function _t(e){if(tn&&($t&&P&&P.running?yt(tn):vt(tn),tn=null),e)return;let t;if(P){if(!P.promises.size&&!P.queue.size){let e=P.sources,n=P.disposed;nn.push.apply(nn,P.effects),t=P.resolve;for(let e of nn)`tState`in e&&(e.state=e.tState),delete e.tState;P=null,gt(()=>{for(let e of n)Ct(e);for(let t of e){if(t.value=t.tValue,t.owned)for(let e=0,n=t.owned.length;e<n;e++)Ct(t.owned[e]);t.tOwned&&(t.owned=t.tOwned),delete t.tValue,delete t.tOwned,t.tState=0}on(!1)},!1)}else if(P.running){P.running=!1,P.effects.push.apply(P.effects,nn),nn=null,on(!0);return}}let n=nn;nn=null,n.length&&gt(()=>Yt(n),!1),t&&t()}function vt(e){for(let t=0;t<e.length;t++)ht(e[t])}function yt(e){for(let t=0;t<e.length;t++){let n=e[t],r=P.queue;r.has(n)||(r.add(n),$t(()=>{r.delete(n),gt(()=>{P.running=!0,ht(n)},!1),P&&(P.running=!1)}))}}function bt(e){let t,n=0;for(t=0;t<e.length;t++){let r=e[t];r.user?e[n++]=r:ht(r)}if(M.context){if(M.count){M.effects||(M.effects=[]),M.effects.push(...e.slice(0,n));return}Ye()}for(M.effects&&(M.done||!M.count)&&(e=[...M.effects,...e],n+=M.effects.length,delete M.effects),t=0;t<n;t++)ht(e[t])}function xt(e,t){let n=P&&P.running;n?e.tState=0:e.state=0;for(let r=0;r<e.sources.length;r+=1){let i=e.sources[r];if(i.sources){let e=n?i.tState:i.state;e===Xt?i!==t&&(!i.updatedAt||i.updatedAt<rn)&&ht(i):e===Zt&&xt(i,t)}}}function St(e){let t=P&&P.running;for(let n=0;n<e.observers.length;n+=1){let r=e.observers[n];(t?!r.tState:!r.state)&&(t?r.tState=Zt:r.state=Zt,r.pure?tn.push(r):nn.push(r),r.observers&&St(r))}}function Ct(e){let t;if(e.sources)for(;e.sources.length;){let t=e.sources.pop(),n=e.sourceSlots.pop(),r=t.observers;if(r&&r.length){let e=r.pop(),i=t.observerSlots.pop();n<r.length&&(e.sourceSlots[i]=n,r[n]=e,t.observerSlots[n]=i)}}if(e.tOwned){for(t=e.tOwned.length-1;t>=0;t--)Ct(e.tOwned[t]);delete e.tOwned}if(P&&P.running&&e.pure)wt(e,!0);else if(e.owned){for(t=e.owned.length-1;t>=0;t--)Ct(e.owned[t]);e.owned=null}if(e.cleanups){for(t=e.cleanups.length-1;t>=0;t--)e.cleanups[t]();e.cleanups=null}P&&P.running?e.tState=0:e.state=0}function wt(e,t){if(t||(e.tState=0,P.disposed.add(e)),e.owned)for(let t=0;t<e.owned.length;t++)wt(e.owned[t])}function Tt(e){return e instanceof Error?e:Error(typeof e==`string`?e:`Unknown error`,{cause:e})}function Et(e,t,n){try{for(let n of t)n(e)}catch(e){Dt(e,n&&n.owner||null)}}function Dt(e,t=N){let n=Jt&&t&&t.context&&t.context[Jt],r=Tt(e);if(!n)throw r;nn?nn.push({fn(){Et(r,n,t)},state:Xt}):Et(r,n,t)}function Ot(e){if(typeof e==`function`&&!e.length)return Ot(e());if(Array.isArray(e)){let t=[];for(let n=0;n<e.length;n++){let r=Ot(e[n]);if(Array.isArray(r))if(r.length<32768)t.push.apply(t,r);else for(let e=0;e<r.length;e++)t.push(r[e]);else t.push(r)}return t}return e}function kt(e,t){return function(t){let n;return E(()=>n=$e(()=>(N.context={...N.context,[e]:t.value},lt(()=>t.children))),void 0),n}}function At(e){for(let t=0;t<e.length;t++)e[t]()}function jt(e,t,n={}){let r=[],i=[],a=[],o=0,s=t.length>1?[]:null;return k(()=>At(a)),()=>{let c=e()||[],l=c.length,u,d;return c[Kt],$e(()=>{let e,t,p,m,h,g,_,v,y;if(l===0)o!==0&&(At(a),a=[],r=[],i=[],o=0,s&&(s=[])),n.fallback&&(r=[cn],i[0]=Ze(e=>(a[0]=e,n.fallback())),o=1);else if(o===0){for(i=Array(l),d=0;d<l;d++)r[d]=c[d],i[d]=Ze(f);o=l}else{for(p=Array(l),m=Array(l),s&&(h=Array(l)),g=0,_=Math.min(o,l);g<_&&r[g]===c[g];g++);for(_=o-1,v=l-1;_>=g&&v>=g&&r[_]===c[v];_--,v--)p[v]=i[_],m[v]=a[_],s&&(h[v]=s[_]);for(e=new Map,t=Array(v+1),d=v;d>=g;d--)y=c[d],u=e.get(y),t[d]=u===void 0?-1:u,e.set(y,d);for(u=g;u<=_;u++)y=r[u],d=e.get(y),d!==void 0&&d!==-1?(p[d]=i[u],m[d]=a[u],s&&(h[d]=s[u]),d=t[d],e.set(y,d)):a[u]();for(d=g;d<l;d++)d in p?(i[d]=p[d],a[d]=m[d],s&&(s[d]=h[d],s[d](d))):i[d]=Ze(f);i=i.slice(0,o=l),r=c.slice(0)}return i});function f(e){if(a[d]=e,s){let[e,n]=T(d);return s[d]=n,t(c[d],e)}return t(c[d])}}}function Mt(e,t,n={}){let r=[],i=[],a=[],o=[],s=0,c;return k(()=>At(a)),()=>{let l=e()||[],u=l.length;return l[Kt],$e(()=>{if(u===0)return s!==0&&(At(a),a=[],r=[],i=[],s=0,o=[]),n.fallback&&(r=[cn],i[0]=Ze(e=>(a[0]=e,n.fallback())),s=1),i;for(r[0]===cn&&(a[0](),a=[],r=[],i=[],s=0),c=0;c<u;c++)c<r.length&&r[c]!==l[c]?o[c](()=>l[c]):c>=r.length&&(i[c]=Ze(d));for(;c<r.length;c++)a[c]();return s=o.length=a.length=u,r=l.slice(0),i=i.slice(0,s)});function d(e){a[c]=e;let[n,r]=T(l[c]);return o[c]=r,t(n,c)}}}function A(e,t){if(ln&&M.context){let n=M.context;Ye(Xe());let r=$e(()=>e(t||{}));return Ye(n),r}return $e(()=>e(t||{}))}function Nt(){return!0}function Pt(e){return(e=typeof e==`function`?e():e)?e:{}}function Ft(){for(let e=0,t=this.length;e<t;++e){let t=this[e]();if(t!==void 0)return t}}function It(...e){let t=!1;for(let n=0;n<e.length;n++){let r=e[n];t=t||!!r&&Wt in r,e[n]=typeof r==`function`?(t=!0,O(r)):r}if(Gt&&t)return new Proxy({get(t){for(let n=e.length-1;n>=0;n--){let r=Pt(e[n])[t];if(r!==void 0)return r}},has(t){for(let n=e.length-1;n>=0;n--)if(t in Pt(e[n]))return!0;return!1},keys(){let t=[];for(let n=0;n<e.length;n++)t.push(...Object.keys(Pt(e[n])));return[...new Set(t)]}},un);let n={},r=Object.create(null);for(let t=e.length-1;t>=0;t--){let i=e[t];if(!i)continue;let a=Object.getOwnPropertyNames(i);for(let e=a.length-1;e>=0;e--){let t=a[e];if(t===`__proto__`||t===`constructor`)continue;let o=Object.getOwnPropertyDescriptor(i,t);if(!r[t])r[t]=o.get?{enumerable:!0,configurable:!0,get:Ft.bind(n[t]=[o.get.bind(i)])}:o.value===void 0?void 0:o;else{let e=n[t];e&&(o.get?e.push(o.get.bind(i)):o.value!==void 0&&e.push(()=>o.value))}}}let i={},a=Object.keys(r);for(let e=a.length-1;e>=0;e--){let t=a[e],n=r[t];n&&n.get?Object.defineProperty(i,t,n):i[t]=n?n.value:void 0}return i}function Lt(e,...t){let n=t.length;if(Gt&&Wt in e){let r=n>1?t.flat():t[0],i=t.map(t=>new Proxy({get(n){return t.includes(n)?e[n]:void 0},has(n){return t.includes(n)&&n in e},keys(){return t.filter(t=>t in e)}},un));return i.push(new Proxy({get(t){return r.includes(t)?void 0:e[t]},has(t){return r.includes(t)?!1:t in e},keys(){return Object.keys(e).filter(e=>!r.includes(e))}},un)),i}let r=[];for(let e=0;e<=n;e++)r[e]={};for(let i of Object.getOwnPropertyNames(e)){let a=n;for(let e=0;e<t.length;e++)if(t[e].includes(i)){a=e;break}let o=Object.getOwnPropertyDescriptor(e,i);!o.get&&!o.set&&o.enumerable&&o.writable&&o.configurable?r[a][i]=o.value:Object.defineProperty(r[a],i,o)}return r}function Rt(e){let t=`fallback`in e&&{fallback:()=>e.fallback};return O(jt(()=>e.each,e.children,t||void 0))}function zt(e){let t=`fallback`in e&&{fallback:()=>e.fallback};return O(Mt(()=>e.each,e.children,t||void 0))}function j(e){let t=e.keyed,n=O(()=>e.when,void 0,void 0),r=t?n:O(n,void 0,{equals:(e,t)=>!e==!t});return O(()=>{let i=r();if(i){let a=e.children;return typeof a==`function`&&a.length>0?$e(()=>a(t?i:()=>{if(!$e(r))throw dn(`Show`);return n()})):a}return e.fallback},void 0,void 0)}function Bt(e){let t=lt(()=>e.children),n=O(()=>{let e=t(),n=Array.isArray(e)?e:[e],r=()=>void 0;for(let e=0;e<n.length;e++){let t=e,i=n[e],a=r,o=O(()=>a()?void 0:i.when,void 0,void 0),s=i.keyed?o:O(o,void 0,{equals:(e,t)=>!e==!t});r=()=>a()||(s()?[t,o,i]:void 0)}return r});return O(()=>{let t=n()();if(!t)return e.fallback;let[r,i,a]=t,o=a.children;return typeof o==`function`&&o.length>0?$e(()=>o(a.keyed?i():()=>{var e;if(((e=$e(n)())==null?void 0:e[0])!==r)throw dn(`Match`);return i()})):o},void 0,void 0)}function Vt(e){return e}function Ht(e){let t;M.context&&M.load&&(t=M.load(M.getContextId()));let[n,r]=T(t,void 0);return fn||(fn=new Set),fn.add(r),k(()=>fn.delete(r)),O(()=>{let t;if(t=n()){let n=e.fallback;return typeof n==`function`&&n.length?$e(()=>n(t,()=>r())):n}return nt(()=>e.children,r)},void 0,void 0)}var M,Ut,Wt,Gt,Kt,qt,Jt,Yt,Xt,Zt,Qt,N,P,$t,en,F,tn,nn,rn,an,on,sn,cn,ln,un,dn,fn,I=r((()=>{M={context:void 0,registry:void 0,effects:void 0,done:!1,getContextId(){return Je(this.context.count)},getNextContextId(){return Je(this.context.count++)}},Ut=(e,t)=>e===t,Wt=Symbol(`solid-proxy`),Gt=typeof Proxy==`function`,Kt=Symbol(`solid-track`),qt={equals:Ut},Jt=null,Yt=vt,Xt=1,Zt=2,Qt={owned:null,cleanups:null,context:null,owner:null},N=null,P=null,$t=null,en=null,F=null,tn=null,nn=null,rn=0,[an,on]=T(!1),cn=Symbol(`fallback`),ln=!1,un={get(e,t,n){return t===Wt?n:e.get(t)},has(e,t){return t===Wt?!0:e.has(t)},set:Nt,deleteProperty:Nt,getOwnPropertyDescriptor(e,t){return{configurable:!0,enumerable:!0,get(){return e.get(t)},set:Nt,deleteProperty:Nt}},ownKeys(e){return e.keys()}},dn=e=>`Stale read from <${e}>.`}));function pn(e,t){return t-e}function mn(e){let t=e[0].name,n=e.length,r=Math.min(4,n);for(let n=1;n<r;n++)t+=`, ${e[n].name}`;return t}function hn(e){let t=e[0].time;for(let n=1,r=e.length;n<r;n++)t+=e[n].time;return t}function gn(e){for(let t=0,n=e.length;t<n;t++)if(e[t].forget)return!0;return!1}function _n(e,t){return e===t||e!==e&&t!==t}var vn,yn,bn,xn=r((()=>{qe(),vn=e=>{let t=``,n=new Map;for(let t of e){let{forget:e,time:r,aggregatedCount:i,name:a}=t;n.has(i)||n.set(i,[]);let o=n.get(i);o&&o.push({name:a,forget:e,time:r==null?0:r})}let r=Array.from(n.keys()).sort(pn),i=[],a=0;for(let e of r){let t=n.get(e);if(!t)continue;let r=mn(t),o=hn(t),s=gn(t);a+=o,t.length>4&&(r+=`…`),e>1&&(r+=` × ${e}`),s&&(r=`✨${r}`),i.push(r)}return t=i.join(`, `),t.length?(t.length>40&&(t=`${t.slice(0,40)}…`),a>=.01&&(t+=` (${Number(a.toFixed(2))}ms)`),t):null},yn=()=>Ke?(window.reactScanIdCounter===void 0&&(window.reactScanIdCounter=0),`${++window.reactScanIdCounter}`):`0`,bn=e=>{let t=e.createOscillator(),n=e.createGain();t.connect(n),n.connect(e.destination);let r={type:`sine`,freq:[392,600],duration:.3,gain:.12},i=r.freq,a=r.duration/i.length;i.forEach((n,r)=>{t.frequency.setValueAtTime(n,e.currentTime+r*a)}),t.type=r.type,n.gain.setValueAtTime(r.gain,e.currentTime),n.gain.setTargetAtTime(0,e.currentTime+r.duration*.7,.05),t.start(),t.stop(e.currentTime+r.duration)}})),Sn,Cn=r((()=>{I(),Sn=e=>{let[t,n]=T(e),r=new Set,i=e=>{let i=t();return Object.is(i,e)?i:(n(()=>e),r.forEach(t=>t(e)),e)};return{get:t,set:i,facade:{get value(){return t()},set value(e){i(e)},subscribe:e=>(r.add(e),()=>{r.delete(e)})}}}})),wn,Tn,En,Dn,On,L,kn,An,jn,Mn,R,Nn,Pn,Fn,In=r((()=>{Cn(),qe(),wn=Sn(!0),Tn=Sn(Ke&&window.self!==window.top),En=Sn({kind:`uninitialized`}),Dn=Sn(0),On=Sn({enabled:!0,log:!1,showToolbar:!0,animationSpeed:`fast`,dangerouslyForceRunInProduction:!1,showFPS:!0,showNotificationCount:!0,allowInIframe:!1}),L=En.get,kn=En.set,An=Dn.get,jn=Dn.set,Mn=Tn.get,R=On.get,Nn=On.set,Pn=On.facade,Fn={wasDetailsOpen:wn.facade,isInIframe:Tn.facade,inspectState:En.facade,fiberRoots:new Set,reportData:new Map,legacyReportData:new Map,lastReportTime:Dn.facade,interactionListeningForRenders:null,changesListeners:new Map}})),Ln,Rn,zn=r((()=>{Ln=e=>e(),Rn=class e extends Array{constructor(e=25){super(),this.capacity=e}push(...e){let t=super.push(...e);for(;this.length>this.capacity;)this.shift();return t}static fromArray(t,n){let r=new e(n);return r.push(...t),r}}}));function Bn(e,n=0){if(n<0)return`…`;switch(typeof e){case`function`:return e.toString();case`string`:return e;case`number`:case`boolean`:case`undefined`:return String(e);case`object`:break;default:return String(e)}if(e===null)return`null`;if(er.has(e)){let t=er.get(e);if(t!==void 0)return t}if(Array.isArray(e)){let t=e.length?`[${e.length}]`:`[]`;return er.set(e,t),t}if((0,t.isValidElement)(e)){var r;let t=`<${(r=ye(e.type))==null?``:r} ${e.props?Object.keys(e.props).length:0}>`;return er.set(e,t),t}if(Object.getPrototypeOf(e)===Object.prototype){let t=Object.keys(e),n=t.length?`{${t.length}}`:`{}`;return er.set(e,n),n}let i=e&&typeof e==`object`?e.constructor:void 0;if(i&&typeof i==`function`&&i.name){let t=`${i.name}{…}`;return er.set(e,t),t}let a=`${Object.prototype.toString.call(e).slice(8,-1)}{…}`;return er.set(e,a),a}function Vn(e,t){var n;if(!e||!t)return;let r=e.memoizedValue,i={type:4,name:(n=e.context.displayName)==null?`Context.Provider`:n,value:r,contextType:ir(e.context)};this.push(i)}function Hn(e){return String(Ee(e))}function Un(e){let t=Hn(e),n=ur.get(ve(e));if(n)return n.get(t)}function Wn(e,t){let n=ve(e.type),r=Hn(e),i=ur.get(n);i||(i=new Map,ur.set(n,i)),i.set(r,t)}var Gn,Kn,qn,Jn,Yn,Xn,Zn,Qn,$n,er,tr,nr,rr,ir,ar,or,sr,cr,lr,ur,dr,fr,pr=r((()=>{Cn(),Ge(),xn(),Lr(),In(),Gn={mount:1,update:2,unmount:4},Kn=0,qn=performance.now(),Jn=0,Yn=!1,Xn=()=>{Jn++;let e=performance.now();e-qn>=1e3&&(Kn=Jn,Jn=0,qn=e),requestAnimationFrame(Xn)},Zn=()=>(Yn||(Yn=!0,Xn(),Kn=60),Kn),Qn=(e,t)=>Bn(e)===Bn(t)&&$n.includes(typeof e)&&$n.includes(typeof t),$n=[`function`,`object`],er=new WeakMap,tr=e=>{if(!e)return[];let t=[];if(e.tag===0||e.tag===11||e.tag===15||e.tag===14){var n;let r=e.memoizedState,i=(n=e.alternate)==null?void 0:n.memoizedState,a=0;for(;r;){if(r.queue&&r.memoizedState!==void 0){let e={type:2,name:a.toString(),value:r.memoizedState,prevValue:i==null?void 0:i.memoizedState};_n(e.prevValue,e.value)||t.push(e)}r=r.next,i=i==null?void 0:i.next,a++}return t}if(e.tag===1){var r;let n={type:3,name:`state`,value:e.memoizedState,prevValue:(r=e.alternate)==null?void 0:r.memoizedState};return _n(n.prevValue,n.value)||t.push(n),t}return t},nr=0,rr=new WeakMap,ir=e=>rr.get(e)||(nr++,rr.set(e,nr),nr),ar=e=>{let t=[];return ue(e,Vn.bind(t)),t},or=new Map,sr=!1,cr=()=>Array.from(or.values()),lr=16,ur=new WeakMap,dr=(e,t,n,r,i)=>{let a=Date.now(),o=Un(e);if((r||i)&&(!o||a-(o.lastRenderTimestamp||0)>lr)){let r=o||{selfTime:0,totalTime:0,renderCount:0,lastRenderTimestamp:a};r.renderCount=(r.renderCount||0)+1,r.selfTime=t||0,r.totalTime=n||0,r.lastRenderTimestamp=a,Wn(e,{...r})}},fr=(e,t)=>{let n=Sn(!R().enabled),r={isPaused:n.facade,getIsPaused:n.get,setIsPaused:n.set,fiberRoots:new WeakSet};return or.set(e,{key:e,config:t,instrumentation:r}),sr||(sr=!0,Ue({name:`react-scan`,onActive:t.onActive,onCommitFiberRoot(e,t){r.fiberRoots.add(t);let n=cr();for(let e of n)e.config.onCommitStart();Ne(t.current,(e,t)=>{let n=ve(e.type);if(!n)return null;let r=cr(),i=[];for(let t=0,n=r.length;t<n;t++)r[t].config.isValidFiber(e)&&i.push(t);if(!i.length)return null;let a=[];if(r.some(e=>e.config.trackChanges)){let t=Ar(e).changes,n=jr(e).changes,r=Mr(e).changes;a.push.apply(null,t.map(e=>({type:1,name:e.name,value:e.value})));for(let t of n)e.tag===1?a.push({type:3,name:t.name.toString(),value:t.value}):a.push({type:2,name:t.name.toString(),value:t.value});a.push.apply(null,r.map(e=>({type:4,name:e.name,value:e.value,contextType:Number(e.contextType)})))}let{selfTime:o,totalTime:s}=w(e),c=Zn(),l={phase:Gn[t],componentName:ye(n),count:1,changes:a,time:o,forget:_e(e),unnecessary:null,didCommit:fe(e),fps:c},u=a.length>0,d=C(e).length>0;t===`update`&&dr(e,o,s,u,d);for(let t=0,n=i.length;t<n;t++)r[i[t]].config.onRender(e,[l])});for(let e of n)e.config.onCommitFinish()},onPostCommitFiberRoot(){let e=cr();for(let t of e)t.config.onPostCommitFiberRoot()}})),r}})),mr,hr,gr,_r,vr=r((()=>{Ge(),pr(),xn(),mr=e=>{if(`__REACT_DEVTOOLS_GLOBAL_HOOK__`in window){let n=window.__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!(n!=null&&n.renderers))return null;for(let[,r]of Array.from(n.renderers))try{var t;let n=(t=r.findFiberByHostInstance)==null?void 0:t.call(r,e);if(n)return n}catch{}}if(`_reactRootContainer`in e){var n,r;return(n=(r=e._reactRootContainer)==null||(r=r._internalRoot)==null||(r=r.current)==null?void 0:r.child)==null?null:n}for(let t in e)if(t.startsWith(`__reactInternalInstance$`)||t.startsWith(`__reactFiber`))return e[t];return null},hr=e=>{let t=e,n=null;for(;t;){if(le(t))return[t,n];ce(t)&&!n&&(n=t),t=t.return}return null},gr=e=>{var t,n,r;let i=(t=e.memoizedProps)==null?{}:t,a=(n=(r=e.alternate)==null?void 0:r.memoizedProps)==null?{}:n,o=[];for(let e in i){if(e===`children`)continue;let t=i[e],n=a[e];_n(t,n)||o.push({name:e,value:t,prevValue:n,type:1})}return o},_r=e=>e instanceof Promise||typeof e==`object`&&!!e&&`then`in e})),yr,br,xr,Sr,Cr,wr,Tr,Er,Dr,Or,kr,Ar,jr,Mr,Nr,Pr,Fr,Ir,Lr=r((()=>{Ge(),xn(),vr(),yr=new Map,br=new Map,xr=new Map,Sr=null,Cr=/\[(?<name>\w+),\s*set\w+\]/g,wr=()=>({current:[],changes:new Set,changesCounts:new Map}),Tr=e=>{var t,n;let r=((t=e.type)==null||(n=t.toString)==null?void 0:n.call(t))||``;return r?Array.from(r.matchAll(Cr),e=>{var t,n;return(t=(n=e.groups)==null?void 0:n.name)==null?``:t}):[]},Er=()=>{yr.clear(),br.clear(),xr.clear(),Sr=null},Dr=e=>{let t=e.type!==Sr;return Sr=e.type,t},Or=(e,t,n,r)=>{let i=e.get(t),a=e===yr||e===xr,o=!_n(n,r);if(!i)return e.set(t,{count:o&&a?1:0,currentValue:n,previousValue:r,lastUpdated:Date.now()}),{hasChanged:o,count:o&&a?1:+!a};if(!_n(i.currentValue,n)){let r=i.count+1;return e.set(t,{count:r,currentValue:n,previousValue:i.currentValue,lastUpdated:Date.now()}),{hasChanged:!0,count:r}}return{hasChanged:!1,count:i.count}},kr=e=>{if(!e)return{};if(e.tag===0||e.tag===11||e.tag===15||e.tag===14){let t=e.memoizedState,n={},r=0;for(;t;)t.queue&&t.memoizedState!==void 0&&(n[r]=t.memoizedState),t=t.next,r++;return n}return e.tag===1&&e.memoizedState||{}},Ar=e=>{var t;let n=e.memoizedProps||{},r=((t=e.alternate)==null?void 0:t.memoizedProps)||{},i={},a={};for(let e of Object.keys(n))e in n&&(i[e]=n[e],a[e]=r[e]);return{current:i,prev:a,changes:gr(e).map(e=>({name:e.name,value:e.value,prevValue:e.prevValue}))}},jr=e=>{let t=kr(e),n=e.alternate?kr(e.alternate):{},r=[];for(let[i,a]of Object.entries(t)){let t=e.tag===1?i:Number(i);e.alternate&&!_n(n[i],a)&&r.push({name:t,value:a,prevValue:n[i]})}return{current:t,prev:n,changes:r}},Mr=e=>{let t=Fr(e),n=e.alternate?Fr(e.alternate):new Map,r={},i={},a=[],o=new Set;for(let[e,s]of t){let t=s.displayName;if(o.has(e))continue;o.add(e),r[t]=s.value;let c=n.get(e);c&&(i[t]=c.value,_n(c.value,s.value)||a.push({name:t,value:s.value,prevValue:c.value,contextType:e}))}return{current:r,prev:i,changes:a}},Nr=e=>{if(!e)return{data:{fiberProps:wr(),fiberState:wr(),fiberContext:wr()},shouldUpdate:!1};let t=!1,n=Dr(e),r=wr();if(e.memoizedProps){let{current:n,changes:i}=Ar(e);for(let[e,t]of Object.entries(n))r.current.push({name:e,value:_r(t)?{type:`promise`,displayValue:`Promise`}:t});for(let e of i){let{hasChanged:n,count:i}=Or(yr,e.name,e.value,e.prevValue);n&&(t=!0,r.changes.add(e.name),r.changesCounts.set(e.name,i))}}let i=wr(),{current:a,changes:o}=jr(e);for(let[t,n]of Object.entries(a)){let r=e.tag===1?t:Number(t);i.current.push({name:r,value:n})}for(let e of o){let{hasChanged:n,count:r}=Or(br,e.name,e.value,e.prevValue);n&&(t=!0,i.changes.add(e.name),i.changesCounts.set(e.name,r))}let s=wr(),{current:c,changes:l}=Mr(e);for(let[e,t]of Object.entries(c))s.current.push({name:e,value:t});if(!n)for(let e of l){let{hasChanged:n,count:r}=Or(xr,e.name,e.value,e.prevValue);n&&(t=!0,s.changes.add(e.name),s.changesCounts.set(e.name,r))}return!t&&!n&&(r.changes.clear(),i.changes.clear(),s.changes.clear()),{data:{fiberProps:r,fiberState:i,fiberContext:s},shouldUpdate:t||n}},Pr=new WeakMap,Fr=e=>{if(!e)return new Map;let t=Pr.get(e);if(t)return t;let n=new Map,r=e;for(;r;){let e=r.dependencies;if(e!=null&&e.firstContext){let t=e.firstContext;for(;t;){var i;let e=t.memoizedValue,r=(i=t.context)==null?void 0:i.displayName;if(n.has(e)||n.set(t.context,{value:e,displayName:r==null?`UnnamedContext`:r,contextType:null}),t===t.next)break;t=t.next}}r=r.return}return Pr.set(e,n),n},Ir=e=>{if(!e)return{fiberProps:wr(),fiberState:wr(),fiberContext:wr()};let t=wr();if(e.memoizedProps){let{current:n,changes:r}=Ar(e);for(let[e,r]of Object.entries(n))t.current.push({name:e,value:_r(r)?{type:`promise`,displayValue:`Promise`}:r});for(let e of r)t.changes.add(e.name),t.changesCounts.set(e.name,1)}let n=wr();if(e.memoizedState){let{current:t,changes:r}=jr(e);for(let[e,r]of Object.entries(t))n.current.push({name:e,value:_r(r)?{type:`promise`,displayValue:`Promise`}:r});for(let e of r)n.changes.add(e.name),n.changesCounts.set(e.name,1)}let r=wr(),{current:i,changes:a}=Mr(e);for(let[e,t]of Object.entries(i))r.current.push({name:e,value:_r(t)?{type:`promise`,displayValue:`Promise`}:t});for(let e of a)r.changes.add(e.name),r.changesCounts.set(e.name,1);return{fiberProps:t,fiberState:n,fiberContext:r}}})),Rr,zr,Br,Vr,Hr,Ur,Wr,Gr,Kr,qr,Jr,Yr,Xr,Zr,Qr,$r,ei,ti,ni,ri,ii,ai,oi,si,ci,li,ui,di,fi,pi,mi,hi,gi,_i=r((()=>{Ge(),In(),zn(),Lr(),vr(),xn(),Rr={skipProviders:!0,skipHocs:!0,skipContainers:!0,skipMinified:!0,skipUtilities:!0,skipBoundaries:!0},zr={providers:[/Provider$/,/^Provider$/,/^Context$/],hocs:[/^with[A-Z]/,/^forward(?:Ref)?$/i,/^Forward(?:Ref)?\(/],containers:[/^(?:App)?Container$/,/^Root$/,/^ReactDev/],utilities:[/^Fragment$/,/^Suspense$/,/^ErrorBoundary$/,/^Portal$/,/^Consumer$/,/^Layout$/,/^Router/,/^Hydration/],boundaries:[/^Boundary$/,/Boundary$/,/^Provider$/,/Provider$/]},Br=(e,t=Rr)=>{let n=[];return t.skipProviders&&n.push(...zr.providers),t.skipHocs&&n.push(...zr.hocs),t.skipContainers&&n.push(...zr.containers),t.skipUtilities&&n.push(...zr.utilities),t.skipBoundaries&&n.push(...zr.boundaries),!n.some(t=>t.test(e))},Vr=[/^[a-z]$/,/^[a-z][0-9]$/,/^_+$/,/^[A-Za-z][_$]$/,/^[a-z]{1,2}$/],Hr=e=>{var t,n;for(let t=0;t<Vr.length;t++)if(Vr[t].test(e))return!0;let r=!/[aeiou]/i.test(e),i=((t=(n=e.match(/\d/g))==null?void 0:n.length)==null?0:t)>e.length/2,a=/^[a-z]+$/.test(e),o=/[$_]{2,}/.test(e);return Number(r)+Number(i)+Number(a)+Number(o)>=2},Ur=e=>{let t=ye(e);return t?t.replace(/^(?:Memo|Forward(?:Ref)?|With.*?)\((?<inner>.*?)\)$/,`$<inner>`):``},Wr=(e,t=Rr)=>{if(!e||!ye(e.type))return[];let n=[],r=e;for(;r.return;){let e=Ur(r.type);e&&!Hr(e)&&Br(e,t)&&e.toLowerCase()!==e&&n.push(e),r=r.return}let i=Array(n.length);for(let e=0;e<n.length;e++)i[e]=n[n.length-e-1];return i},Gr=(e,t=()=>!0)=>{let n=e;for(;n;){let e=ye(n.type);if(e&&t(e))return e;n=n.return}return null},qr=`never-hidden`,Jr=()=>{Kr==null||Kr();let e=()=>{document.hidden&&(qr=Date.now())};document.addEventListener(`visibilitychange`,e),Kr=()=>{document.removeEventListener(`visibilitychange`,e)}},Yr=50,Xr=new Rn(Yr),Zr=new Set,Qr=e=>{Xr.push(e),Zr.forEach(t=>t(e))},$r=e=>(Xr.forEach(t=>e(t)),Zr.add(e),()=>{Zr.delete(e)}),ei=()=>Xr.length>0,ti=()=>{Xr=new Rn(Yr)},ni=e=>[`pointerup`,`click`].includes(e)?`pointer`:(e.includes(`key`),[`keydown`,`keyup`].includes(e)?`keyboard`:null),ri=null,ii=e=>{Jr();let t=new Map,n=new Map,r=r=>{if(!r.interactionId)return;if(r.interactionId&&r.target&&!n.has(r.interactionId)&&n.set(r.interactionId,r.target),r.target){let e=r.target;for(;e;){if(e.id===`react-scan-toolbar-root`||e.id===`react-scan-root`)return;e=e.parentElement}}let i=t.get(r.interactionId);if(i)r.duration>i.latency?(i.entries=[r],i.latency=r.duration):r.duration===i.latency&&r.startTime===i.entries[0].startTime&&i.entries.push(r);else{let n=ni(r.name);if(!n)return;let i={id:r.interactionId,latency:r.duration,entries:[r],target:r.target,type:n,startTime:r.startTime,endTime:Date.now(),processingStart:r.processingStart,processingEnd:r.processingEnd,duration:r.duration,inputDelay:r.processingStart-r.startTime,processingDuration:r.processingEnd-r.processingStart,presentationDelay:r.duration-(r.processingEnd-r.startTime),timestamp:Date.now(),timeSinceTabInactive:qr===`never-hidden`?`never-hidden`:Date.now()-qr,visibilityState:document.visibilityState,timeOrigin:performance.timeOrigin,referrer:document.referrer};t.set(i.id,i),ri||(ri=requestAnimationFrame(()=>{requestAnimationFrame(()=>{e(t.get(i.id)),ri=null})}))}},i=new PerformanceObserver(e=>{let t=e.getEntries();for(let e=0,n=t.length;e<n;e++){let n=t[e];r(n)}});try{i.observe({type:`event`,buffered:!0,durationThreshold:16}),i.observe({type:`first-input`,buffered:!0})}catch{}return()=>i.disconnect()},ai=()=>ii(e=>{Qr({kind:`entry-received`,entry:e})}),oi=new Rn(25),si=(e,t)=>{let n=null;for(let r of t){if(r.type!==e.type)continue;if(n===null){n=r;continue}let t=(e,t)=>Math.abs(e.startDateTime)-(t.startTime+t.timeOrigin);t(r,e)<t(n,e)&&(n=r)}return n},ci=()=>$r(e=>{let t=e.kind===`auto-complete-race`?oi.find(t=>t.interactionUUID===e.interactionUUID):si(e.entry,oi);t&&t.completeInteraction(e)}),li=({onMicroTask:e,onRAF:t,onTimeout:n,abort:r})=>{queueMicrotask(()=>{(r==null?void 0:r())!==!0&&e()&&requestAnimationFrame(()=>{(r==null?void 0:r())!==!0&&t()&&setTimeout(()=>{(r==null?void 0:r())!==!0&&n()},0)})})},ui=e=>{let t=mr(e);if(!t)return;let n=t?ye(t==null?void 0:t.type):`N/A`;if(!n){var r;n=(r=Gr(t,e=>e.length>2))==null?`N/A`:r}if(n)return{componentPath:Wr(t),childrenTree:{},componentName:n,elementFiber:t}},di=(e,t)=>{let n=null,r=t=>{switch(e){case`pointer`:return t.phase===`start`?`pointerup`:t.target instanceof HTMLInputElement||t.target instanceof HTMLSelectElement?`change`:`click`;case`keyboard`:return t.phase===`start`?`keydown`:`change`}},i={current:{kind:`uninitialized-stage`,interactionUUID:yn(),stageStart:Date.now(),interactionType:e}},a=n=>{var a;if(n.composedPath().some(e=>e instanceof Element&&e.id===`react-scan-toolbar-root`)||(Date.now()-i.current.stageStart>2e3&&(i.current={kind:`uninitialized-stage`,interactionUUID:yn(),stageStart:Date.now(),interactionType:e}),i.current.kind!==`uninitialized-stage`))return;let s=performance.now();t==null||(a=t.onStart)==null||a.call(t,i.current.interactionUUID);let c=ui(n.target);if(!c){var l;t==null||(l=t.onError)==null||l.call(t,i.current.interactionUUID);return}let u={},d=mi(u);i.current={...i.current,interactionType:e,blockingTimeStart:Date.now(),childrenTree:c.childrenTree,componentName:c.componentName,componentPath:c.componentPath,fiberRenders:u,kind:`interaction-start`,interactionStartDetail:s,stopListeningForRenders:d};let f=r({phase:`end`,target:n.target});document.addEventListener(f,o,{once:!0}),requestAnimationFrame(()=>{document.removeEventListener(f,o)})};document.addEventListener(r({phase:`start`}),a,{capture:!0});let o=(r,a,o)=>{if(i.current.kind!==`interaction-start`&&a===n){var s;if(e===`pointer`&&r.target instanceof HTMLSelectElement){i.current={kind:`uninitialized-stage`,interactionUUID:yn(),stageStart:Date.now(),interactionType:e};return}t==null||(s=t.onError)==null||s.call(t,i.current.interactionUUID),i.current={kind:`uninitialized-stage`,interactionUUID:yn(),stageStart:Date.now(),interactionType:e};return}n=a,li({abort:o,onMicroTask:()=>i.current.kind===`uninitialized-stage`?!1:(i.current={...i.current,kind:`js-end-stage`,jsEndDetail:performance.now()},!0),onRAF:()=>{if(i.current.kind!==`js-end-stage`&&i.current.kind!==`raf-stage`){var n;return t==null||(n=t.onError)==null||n.call(t,i.current.interactionUUID),i.current={kind:`uninitialized-stage`,interactionUUID:yn(),stageStart:Date.now(),interactionType:e},!1}return i.current={...i.current,kind:`raf-stage`,rafStart:performance.now()},!0},onTimeout:()=>{if(i.current.kind!==`raf-stage`){var n;t==null||(n=t.onError)==null||n.call(t,i.current.interactionUUID),i.current={kind:`uninitialized-stage`,interactionUUID:yn(),stageStart:Date.now(),interactionType:e};return}let r=Date.now(),a=Object.freeze({...i.current,kind:`timeout-stage`,blockingTimeEnd:r,commitEnd:performance.now()});i.current={kind:`uninitialized-stage`,interactionUUID:yn(),stageStart:r,interactionType:e};let o=!1,s=e=>{var n;o=!0;let r={detailedTiming:a,latency:e.kind===`auto-complete-race`?e.detailedTiming.commitEnd-e.detailedTiming.interactionStartDetail:e.entry.latency,completedAt:Date.now(),flushNeeded:!0};t==null||(n=t.onComplete)==null||n.call(t,a.interactionUUID,r,e);let i=oi.filter(e=>e.interactionUUID!==a.interactionUUID);return oi=Rn.fromArray(i,25),r},c={completeInteraction:s,endDateTime:Date.now(),startDateTime:a.blockingTimeStart,type:e,interactionUUID:a.interactionUUID};if(oi.push(c),pi())setTimeout(()=>{if(o)return;s({kind:`auto-complete-race`,detailedTiming:a,interactionUUID:a.interactionUUID});let e=oi.filter(e=>e.interactionUUID!==a.interactionUUID);oi=Rn.fromArray(e,25)},1e3);else{let e=oi.filter(e=>e.interactionUUID!==a.interactionUUID);oi=Rn.fromArray(e,25),s({kind:`auto-complete-race`,detailedTiming:a,interactionUUID:a.interactionUUID})}}})},s=e=>{let t=yn();o(e,t,()=>t!==n)};return e===`keyboard`&&document.addEventListener(`keypress`,s),()=>{document.removeEventListener(r({phase:`start`}),a,{capture:!0}),document.removeEventListener(`keypress`,s)}},fi=e=>{var t;return(t=re(e,e=>{if(ce(e))return!0}))==null?void 0:t.stateNode},pi=()=>`PerformanceEventTiming`in globalThis,mi=e=>{let t=t=>{var n,r,i,a,o;let s=ye(t.type);if(!s)return;let c=e[s];if(!c){var l;let n=new Set,r=t.return&&hr(t.return),i=r&&ye(r[0]);i&&n.add(i);let{selfTime:a,totalTime:o}=w(t),c=Ir(t),u={current:[],changes:new Set,changesCounts:new Map},d={fiberProps:c.fiberProps||u,fiberState:c.fiberState||u,fiberContext:c.fiberContext||u};e[s]={renderCount:1,hasMemoCache:_e(t),wasFiberRenderMount:gi(t),parents:n,selfTime:a,totalTime:o,nodeInfo:[{element:fi(t),name:(l=ye(t.type))==null?`Unknown`:l,selfTime:w(t).selfTime}],changes:d};return}if(!((n=hr(t))==null||(n=n[0])==null)&&n.type){let e=t.return&&hr(t.return),n=e&&ye(e[0]);n&&c.parents.add(n)}let{selfTime:u,totalTime:d}=w(t),f=Ir(t);if(!f)return;let p={current:[],changes:new Set,changesCounts:new Map};c.wasFiberRenderMount=c.wasFiberRenderMount||gi(t),c.hasMemoCache=c.hasMemoCache||_e(t),c.changes={fiberProps:hi(((r=c.changes)==null?void 0:r.fiberProps)||p,f.fiberProps||p),fiberState:hi(((i=c.changes)==null?void 0:i.fiberState)||p,f.fiberState||p),fiberContext:hi(((a=c.changes)==null?void 0:a.fiberContext)||p,f.fiberContext||p)},c.renderCount+=1,c.selfTime+=u,c.totalTime+=d,c.nodeInfo.push({element:fi(t),name:(o=ye(t.type))==null?`Unknown`:o,selfTime:w(t).selfTime})};return Fn.interactionListeningForRenders=t,()=>{Fn.interactionListeningForRenders===t&&(Fn.interactionListeningForRenders=null)}},hi=(e,t)=>{let n={current:[...e.current],changes:new Set,changesCounts:new Map};for(let e of t.current)n.current.some(t=>t.name===e.name)||n.current.push(e);for(let r of t.changes)if(typeof r==`string`||typeof r==`number`){n.changes.add(r);let i=e.changesCounts.get(r)||0,a=t.changesCounts.get(r)||0;n.changesCounts.set(r,i+a)}return n},gi=e=>{if(!e.alternate)return!0;let t=e.alternate,n=t&&t.memoizedState!=null&&t.memoizedState.element!=null&&t.memoizedState.isDehydrated!==!0,r=e.memoizedState!=null&&e.memoizedState.element!=null&&e.memoizedState.isDehydrated!==!0;return!n&&r}}));function vi(){let e,t;function n(){let r=null;yi=null,yi={},r=mi(yi);let i=performance.timeOrigin,a=performance.now();return e=requestAnimationFrame(()=>{t=setTimeout(()=>{let e=performance.now(),t=e-a,o=performance.timeOrigin;Ni.push(e+o);let s=Ni.filter(t=>e+o-t<=1e3),c=s.length;Ni=s;let l=Di!==null&&Oi!==null?e+o-(Oi+Di)<100:null,u=Ai!==null&&Ai;if(t>150&&!l&&document.visibilityState===`visible`&&!u){let n=o+e,r=a+i;Ei({kind:`long-render`,id:yn(),data:{endAt:n,startAt:r,meta:{fiberRenders:yi,latency:t,fps:c}}})}Di=null,Oi=null,r==null||r(),n()},0)}),r}let r=n();return()=>{r(),cancelAnimationFrame(e),clearTimeout(t)}}var yi,bi,xi,Si,Ci,wi,Ti,Ei,Di,Oi,ki,Ai,ji,Mi,Ni,Pi,Fi=r((()=>{xn(),_i(),zn(),yi=null,bi=200,xi=new Rn(bi),Si=new Set,Ci=()=>xi,wi=e=>(Si.add(e),()=>{Si.delete(e)}),Ti=()=>{xi=new Rn(bi),Si.forEach(e=>e())},Ei=e=>{let t=[...xi,e],n=(e,n)=>{let r=t.find(t=>t.kind===`long-render`||t.id===e.id?!1:e.data.startAt<=t.data.startAt&&e.data.endAt<=t.data.endAt&&e.data.endAt>=t.data.startAt||t.data.startAt<=e.data.startAt&&t.data.endAt>=e.data.startAt||e.data.startAt<=t.data.startAt&&e.data.endAt>=t.data.endAt);r&&n(r)},r=new Set;t.forEach(e=>{e.kind!==`interaction`&&n(e,()=>{r.add(e.id)})}),xi=Rn.fromArray(t.filter(e=>!r.has(e.id)),bi),Si.forEach(e=>e())},Di=null,Oi=null,ki=null,ji=()=>{let e=e=>{Ai=e.composedPath().map(e=>e.id).filter(Boolean).includes(`react-scan-toolbar`)};return document.addEventListener(`mouseover`,e),ki=e,()=>{ki&&document.removeEventListener(`mouseover`,ki)}},Mi=()=>{let e=()=>{Di=performance.now(),Oi=performance.timeOrigin};return document.addEventListener(`visibilitychange`,e),()=>{document.removeEventListener(`visibilitychange`,e)}},Ni=[],Pi=()=>{let e=ai(),t=ji(),n=Mi(),r=vi(),i=async(e,t,n)=>{Ei({kind:`interaction`,id:yn(),data:{startAt:t.detailedTiming.blockingTimeStart,endAt:performance.now()+performance.timeOrigin,meta:{...t,kind:n.kind}}}),t.detailedTiming.stopListeningForRenders(),ei()&&ti()},a=di(`pointer`,{onComplete:i}),o=di(`keyboard`,{onComplete:i}),s=ci();return()=>{t(),n(),r(),e(),a(),s(),o()}}}));function Ii(){Ri&&(cancelAnimationFrame(Ri),Ri=null),z!=null&&z.parentNode&&z.parentNode.removeChild(z),z=null,Li=null}var z,Li,Ri,zi,Bi,Vi,Hi,Ui,Wi,Gi,Ki,qi,Ji,Yi,Xi=r((()=>{I(),zn(),z=null,Li=null,Ri=null,[zi,Bi]=T({kind:`idle`,current:null}),Vi=e=>{Bi(e),requestAnimationFrame(()=>{qi()})},Hi=null,Ui=0,Wi=1.8,Gi=.05,Ki=1/60,qi=()=>{Hi&&cancelAnimationFrame(Hi),Hi=requestAnimationFrame(e=>{if(!z||!Li)return;let t=Ui?Math.min((e-Ui)/1e3,Gi):Ki;Ui=e;let n=Wi*t;Li.clearRect(0,0,z.width,z.height);let r=`hsl(271, 76%, 53%)`,i=zi(),{alpha:a,current:o}=Ln(()=>{switch(i.kind){case`transition`:{var e;let t=(e=i.current)!=null&&e.alpha&&i.current.alpha>0?i.current:i.transitionTo;return{alpha:t?t.alpha:0,current:t}}case`move-out`:var t,n;return{alpha:(t=(n=i.current)==null?void 0:n.alpha)==null?0:t,current:i.current};case`idle`:return{alpha:1,current:i.current}}});switch(o==null||o.rects.forEach(e=>{Li&&(Li.shadowColor=r,Li.shadowBlur=6,Li.strokeStyle=r,Li.lineWidth=2,Li.globalAlpha=a,Li.beginPath(),Li.rect(e.left,e.top,e.width,e.height),Li.stroke(),Li.shadowBlur=0,Li.beginPath(),Li.rect(e.left,e.top,e.width,e.height),Li.stroke())}),i.kind){case`move-out`:if(i.current.alpha===0){Vi({kind:`idle`,current:null}),Ui=0;return}i.current.alpha<=.01&&(i.current.alpha=0),i.current.alpha=Math.max(0,i.current.alpha-n),qi();return;case`transition`:if(i.current&&i.current.alpha>0){i.current.alpha=Math.max(0,i.current.alpha-n),qi();return}if(i.transitionTo.alpha===1){Vi({kind:`idle`,current:i.transitionTo}),Ui=0;return}i.transitionTo.alpha=Math.min(i.transitionTo.alpha+n,1),qi();case`idle`:Ui=0;return}})},Ji=null,Yi=e=>{if(z=document.createElement(`canvas`),Li=z.getContext(`2d`,{alpha:!0}),!Li)return null;let t=window.devicePixelRatio||1,{innerWidth:n,innerHeight:r}=window;z.style.width=`${n}px`,z.style.height=`${r}px`,z.width=n*t,z.height=r*t,z.style.position=`fixed`,z.style.left=`0`,z.style.top=`0`,z.style.pointerEvents=`none`,z.style.zIndex=`2147483600`,Li.scale(t,t),e.appendChild(z),Ji&&window.removeEventListener(`resize`,Ji);let i=()=>{if(!z||!Li)return;let e=window.devicePixelRatio||1,{innerWidth:t,innerHeight:n}=window;z.style.width=`${t}px`,z.style.height=`${n}px`,z.width=t*e,z.height=n*e,Li.scale(e,e),qi()};return Ji=i,window.addEventListener(`resize`,i),Ii}})),Zi,Qi,$i,ea,ta,na=r((()=>{Zi={width:550,height:350,initialHeight:400},Qi=`react-scan-widget-settings-v2`,$i=`react-scan-toolbar-state-v1`,ea=.5,ta=2147483678})),ra,ia,aa,oa,sa,ca,la=r((()=>{na(),ra=[`class`,`style`,`data-theme`,`data-mode`,`data-color-scheme`,`data-bs-theme`,`data-mui-color-scheme`],ia=e=>{if(e.classList.contains(`dark`))return`dark`;if(e.classList.contains(`light`))return`light`;for(let n of ra){var t;let r=(t=e.getAttribute(n))==null?void 0:t.toLowerCase();if(r===`dark`||r===`light`)return r}},aa=e=>{let t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4},oa=e=>{var t;let n=(t=getComputedStyle(e).backgroundColor.match(/[\d.]+/g))==null?void 0:t.map(Number);if(!(!n||n.length<3||n[3]===0))return aa(n[0])*.2126+aa(n[1])*.7152+aa(n[2])*.0722<.18?`dark`:`light`},sa=()=>{var e,t,n,r;return(e=(t=(n=(r=ia(document.documentElement))==null?document.body?ia(document.body):void 0:r)==null?document.body?oa(document.body):void 0:n)==null?oa(document.documentElement):t)==null?`light`:e},ca=e=>{let t,n=()=>{let t=sa();e.dataset.reactScanTheme=t===`dark`?`light`:`dark`},r=()=>{var e;cancelAnimationFrame((e=t)==null?0:e),t=requestAnimationFrame(n)};n();let i=new MutationObserver(r);i.observe(document.documentElement,{attributes:!0,attributeFilter:[...ra]}),document.body&&i.observe(document.body,{attributes:!0,attributeFilter:[...ra]});let a=window.matchMedia(`(prefers-color-scheme: dark)`);return a.addEventListener(`change`,r),()=>{var e;i.disconnect(),a.removeEventListener(`change`,r),cancelAnimationFrame((e=t)==null?0:e)}}})),ua,da,fa=r((()=>{la(),ua=`/*! tailwindcss v4.2.4 | MIT License | https://tailwindcss.com */
@layer properties;
@layer theme, base, components, utilities;
@layer theme {
  :root, :host {
    --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
      "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    --color-red-300: oklch(80.8% 0.114 19.571);
    --color-red-400: oklch(70.4% 0.191 22.216);
    --color-red-500: oklch(63.7% 0.237 25.331);
    --color-red-600: oklch(57.7% 0.245 27.325);
    --color-red-950: oklch(25.8% 0.092 26.042);
    --color-yellow-300: oklch(90.5% 0.182 98.111);
    --color-yellow-500: oklch(79.5% 0.184 86.047);
    --color-green-500: oklch(72.3% 0.219 149.579);
    --color-purple-400: oklch(71.4% 0.203 305.504);
    --color-purple-500: oklch(62.7% 0.265 303.9);
    --color-purple-800: oklch(43.8% 0.218 303.724);
    --color-gray-100: oklch(96.7% 0.003 264.542);
    --color-gray-400: oklch(70.7% 0.022 261.325);
    --color-gray-500: oklch(55.1% 0.027 264.364);
    --color-zinc-400: oklch(70.5% 0.015 286.067);
    --color-zinc-500: oklch(55.2% 0.016 285.938);
    --color-zinc-600: oklch(44.2% 0.017 285.786);
    --color-zinc-700: oklch(37% 0.013 285.805);
    --color-zinc-800: oklch(27.4% 0.006 286.033);
    --color-zinc-900: oklch(21% 0.006 285.885);
    --color-neutral-300: oklch(87% 0 0);
    --color-neutral-400: oklch(70.8% 0 0);
    --color-neutral-500: oklch(55.6% 0 0);
    --color-neutral-700: oklch(37.1% 0 0);
    --color-black: #000;
    --color-white: #fff;
    --spacing: 4px;
    --container-md: 448px;
    --text-xs: 12px;
    --text-xs--line-height: calc(1 / 0.75);
    --text-sm: 14px;
    --text-sm--line-height: calc(1.25 / 0.875);
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --tracking-wide: 0.025em;
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-xl: 12px;
    --ease-in: cubic-bezier(0.4, 0, 1, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --blur-sm: 8px;
    --default-transition-duration: 150ms;
    --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    --default-font-family: var(--font-sans);
  }
}
@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
  }
  html, :host {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    -moz-tab-size: 4;
      -o-tab-size: 4;
         tab-size: 4;
    font-family: var(--default-font-family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
    font-feature-settings: var(--default-font-feature-settings, normal);
    font-variation-settings: var(--default-font-variation-settings, normal);
    -webkit-tap-highlight-color: transparent;
  }
  hr {
    height: 0;
    color: inherit;
    border-top-width: 1px;
  }
  abbr:where([title]) {
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
  }
  h1, h2, h3, h4, h5, h6 {
    font-size: inherit;
    font-weight: inherit;
  }
  a {
    color: inherit;
    -webkit-text-decoration: inherit;
    text-decoration: inherit;
  }
  b, strong {
    font-weight: bolder;
  }
  code, kbd, samp, pre {
    font-family: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;
    font-feature-settings: normal;
    font-variation-settings: normal;
    font-size: 1em;
  }
  small {
    font-size: 80%;
  }
  sub, sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }
  sub {
    bottom: -0.25em;
  }
  sup {
    top: -0.5em;
  }
  table {
    text-indent: 0;
    border-color: inherit;
    border-collapse: collapse;
  }
  :-moz-focusring {
    outline: auto;
  }
  progress {
    vertical-align: baseline;
  }
  summary {
    display: list-item;
  }
  ol, ul, menu {
    list-style: none;
  }
  img, svg, video, canvas, audio, iframe, embed, object {
    display: block;
    vertical-align: middle;
  }
  img, video {
    max-width: 100%;
    height: auto;
  }
  button, input, select, optgroup, textarea, ::file-selector-button {
    font: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: inherit;
    border-radius: 0;
    background-color: transparent;
    opacity: 1;
  }
  :where(select:is([multiple], [size])) optgroup {
    font-weight: bolder;
  }
  :where(select:is([multiple], [size])) optgroup option {
    padding-inline-start: 20px;
  }
  ::file-selector-button {
    margin-inline-end: 4px;
  }
  ::-moz-placeholder {
    opacity: 1;
  }
  ::placeholder {
    opacity: 1;
  }
  @supports (not (-webkit-appearance: -apple-pay-button))  or (contain-intrinsic-size: 1px) {
    ::-moz-placeholder {
      color: currentcolor;
      @supports (color: color-mix(in lab, red, red)) {
        color: color-mix(in oklab, currentcolor 50%, transparent);
      }
    }
    ::placeholder {
      color: currentcolor;
      @supports (color: color-mix(in lab, red, red)) {
        color: color-mix(in oklab, currentcolor 50%, transparent);
      }
    }
  }
  textarea {
    resize: vertical;
  }
  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }
  ::-webkit-date-and-time-value {
    min-height: 1lh;
    text-align: inherit;
  }
  ::-webkit-datetime-edit {
    display: inline-flex;
  }
  ::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }
  ::-webkit-datetime-edit, ::-webkit-datetime-edit-year-field, ::-webkit-datetime-edit-month-field, ::-webkit-datetime-edit-day-field, ::-webkit-datetime-edit-hour-field, ::-webkit-datetime-edit-minute-field, ::-webkit-datetime-edit-second-field, ::-webkit-datetime-edit-millisecond-field, ::-webkit-datetime-edit-meridiem-field {
    padding-block: 0;
  }
  ::-webkit-calendar-picker-indicator {
    line-height: 1;
  }
  :-moz-ui-invalid {
    box-shadow: none;
  }
  button, input:where([type="button"], [type="reset"], [type="submit"]), ::file-selector-button {
    -webkit-appearance: button;
       -moz-appearance: button;
            appearance: button;
  }
  ::-webkit-inner-spin-button, ::-webkit-outer-spin-button {
    height: auto;
  }
  [hidden]:where(:not([hidden="until-found"])) {
    display: none !important;
  }
}
@layer utilities {
  .pointer-events-auto {
    pointer-events: auto;
  }
  .pointer-events-bounding-box {
    pointer-events: bounding-box;
  }
  .pointer-events-none {
    pointer-events: none;
  }
  .collapse {
    visibility: collapse;
  }
  .visible {
    visibility: visible;
  }
  .absolute {
    position: absolute;
  }
  .fixed {
    position: fixed;
  }
  .relative {
    position: relative;
  }
  .static {
    position: static;
  }
  .inset-0 {
    inset: calc(var(--spacing) * 0);
  }
  .inset-x-0 {
    inset-inline: calc(var(--spacing) * 0);
  }
  .inset-x-1 {
    inset-inline: calc(var(--spacing) * 1);
  }
  .inset-y-0 {
    inset-block: calc(var(--spacing) * 0);
  }
  .start {
    inset-inline-start: var(--spacing);
  }
  .end {
    inset-inline-end: var(--spacing);
  }
  .-top-1 {
    top: calc(var(--spacing) * -1);
  }
  .-top-2\\.5 {
    top: calc(var(--spacing) * -2.5);
  }
  .top-0 {
    top: calc(var(--spacing) * 0);
  }
  .top-0\\.5 {
    top: calc(var(--spacing) * 0.5);
  }
  .top-1\\/2 {
    top: calc(1 / 2 * 100%);
  }
  .top-2 {
    top: calc(var(--spacing) * 2);
  }
  .top-full {
    top: 100%;
  }
  .-right-1 {
    right: calc(var(--spacing) * -1);
  }
  .-right-2\\.5 {
    right: calc(var(--spacing) * -2.5);
  }
  .right-0 {
    right: calc(var(--spacing) * 0);
  }
  .right-0\\.5 {
    right: calc(var(--spacing) * 0.5);
  }
  .right-2 {
    right: calc(var(--spacing) * 2);
  }
  .right-4 {
    right: calc(var(--spacing) * 4);
  }
  .right-full {
    right: 100%;
  }
  .bottom-0 {
    bottom: calc(var(--spacing) * 0);
  }
  .bottom-4 {
    bottom: calc(var(--spacing) * 4);
  }
  .bottom-full {
    bottom: 100%;
  }
  .left-0 {
    left: calc(var(--spacing) * 0);
  }
  .left-3 {
    left: calc(var(--spacing) * 3);
  }
  .left-full {
    left: 100%;
  }
  .z-10 {
    z-index: 10;
  }
  .z-50 {
    z-index: 50;
  }
  .z-100 {
    z-index: 100;
  }
  .z-\\[214748365\\] {
    z-index: 214748365;
  }
  .z-\\[214748367\\] {
    z-index: 214748367;
  }
  .z-\\[124124124124\\] {
    z-index: 124124124124;
  }
  .container {
    width: 100%;
    @media (width >= 640px) {
      max-width: 640px;
    }
    @media (width >= 768px) {
      max-width: 768px;
    }
    @media (width >= 1024px) {
      max-width: 1024px;
    }
    @media (width >= 1280px) {
      max-width: 1280px;
    }
    @media (width >= 1536px) {
      max-width: 1536px;
    }
  }
  .m-\\[2px\\] {
    margin: 2px;
  }
  .mx-0\\.5 {
    margin-inline: calc(var(--spacing) * 0.5);
  }
  .mt-0\\.5 {
    margin-top: calc(var(--spacing) * 0.5);
  }
  .mt-1 {
    margin-top: calc(var(--spacing) * 1);
  }
  .mt-2\\.5 {
    margin-top: calc(var(--spacing) * 2.5);
  }
  .mr-0\\.5 {
    margin-right: calc(var(--spacing) * 0.5);
  }
  .mr-1 {
    margin-right: calc(var(--spacing) * 1);
  }
  .mr-1\\.5 {
    margin-right: calc(var(--spacing) * 1.5);
  }
  .mr-2\\.5 {
    margin-right: calc(var(--spacing) * 2.5);
  }
  .mr-16 {
    margin-right: calc(var(--spacing) * 16);
  }
  .mr-auto {
    margin-right: auto;
  }
  .mb-1\\.5 {
    margin-bottom: calc(var(--spacing) * 1.5);
  }
  .mb-2 {
    margin-bottom: calc(var(--spacing) * 2);
  }
  .mb-2\\.5 {
    margin-bottom: calc(var(--spacing) * 2.5);
  }
  .mb-3 {
    margin-bottom: calc(var(--spacing) * 3);
  }
  .mb-4 {
    margin-bottom: calc(var(--spacing) * 4);
  }
  .mb-px {
    margin-bottom: 1px;
  }
  .\\!ml-0 {
    margin-left: calc(var(--spacing) * 0) !important;
  }
  .ml-1 {
    margin-left: calc(var(--spacing) * 1);
  }
  .ml-1\\.5 {
    margin-left: calc(var(--spacing) * 1.5);
  }
  .ml-2\\.5 {
    margin-left: calc(var(--spacing) * 2.5);
  }
  .ml-auto {
    margin-left: auto;
  }
  .block {
    display: block;
  }
  .flex {
    display: flex;
  }
  .hidden {
    display: none;
  }
  .inline {
    display: inline;
  }
  .aspect-square {
    aspect-ratio: 1 / 1;
  }
  .size-5 {
    width: calc(var(--spacing) * 5);
    height: calc(var(--spacing) * 5);
  }
  .size-full {
    width: 100%;
    height: 100%;
  }
  .h-1 {
    height: calc(var(--spacing) * 1);
  }
  .h-4 {
    height: calc(var(--spacing) * 4);
  }
  .h-5 {
    height: calc(var(--spacing) * 5);
  }
  .h-6 {
    height: calc(var(--spacing) * 6);
  }
  .h-7 {
    height: calc(var(--spacing) * 7);
  }
  .h-8 {
    height: calc(var(--spacing) * 8);
  }
  .h-10 {
    height: calc(var(--spacing) * 10);
  }
  .h-12 {
    height: calc(var(--spacing) * 12);
  }
  .h-\\[28px\\] {
    height: 28px;
  }
  .h-\\[48px\\] {
    height: 48px;
  }
  .h-\\[50px\\] {
    height: 50px;
  }
  .h-\\[150px\\] {
    height: 150px;
  }
  .h-\\[235px\\] {
    height: 235px;
  }
  .h-\\[calc\\(100\\%-25px\\)\\] {
    height: calc(100% - 25px);
  }
  .h-\\[calc\\(100\\%-40px\\)\\] {
    height: calc(100% - 40px);
  }
  .h-\\[calc\\(100\\%-48px\\)\\] {
    height: calc(100% - 48px);
  }
  .h-\\[calc\\(100\\%-150px\\)\\] {
    height: calc(100% - 150px);
  }
  .h-\\[calc\\(100\\%-200px\\)\\] {
    height: calc(100% - 200px);
  }
  .h-fit {
    height: -moz-fit-content;
    height: fit-content;
  }
  .h-full {
    height: 100%;
  }
  .h-px {
    height: 1px;
  }
  .h-screen {
    height: 100vh;
  }
  .max-h-0 {
    max-height: calc(var(--spacing) * 0);
  }
  .max-h-40 {
    max-height: calc(var(--spacing) * 40);
  }
  .min-h-\\[48px\\] {
    min-height: 48px;
  }
  .min-h-fit {
    min-height: -moz-fit-content;
    min-height: fit-content;
  }
  .w-1 {
    width: calc(var(--spacing) * 1);
  }
  .w-1\\/2 {
    width: calc(1 / 2 * 100%);
  }
  .w-1\\/3 {
    width: calc(1 / 3 * 100%);
  }
  .w-2\\/4 {
    width: calc(2 / 4 * 100%);
  }
  .w-3 {
    width: calc(var(--spacing) * 3);
  }
  .w-4 {
    width: calc(var(--spacing) * 4);
  }
  .w-4\\/5 {
    width: calc(4 / 5 * 100%);
  }
  .w-5 {
    width: calc(var(--spacing) * 5);
  }
  .w-6 {
    width: calc(var(--spacing) * 6);
  }
  .w-80 {
    width: calc(var(--spacing) * 80);
  }
  .w-\\[20px\\] {
    width: 20px;
  }
  .w-\\[72px\\] {
    width: 72px;
  }
  .w-\\[90\\%\\] {
    width: 90%;
  }
  .w-\\[calc\\(100\\%-200px\\)\\] {
    width: calc(100% - 200px);
  }
  .w-fit {
    width: -moz-fit-content;
    width: fit-content;
  }
  .w-full {
    width: 100%;
  }
  .w-px {
    width: 1px;
  }
  .w-screen {
    width: 100vw;
  }
  .max-w-md {
    max-width: var(--container-md);
  }
  .min-w-0 {
    min-width: calc(var(--spacing) * 0);
  }
  .min-w-\\[200px\\] {
    min-width: 200px;
  }
  .min-w-fit {
    min-width: -moz-fit-content;
    min-width: fit-content;
  }
  .flex-1 {
    flex: 1;
  }
  .shrink-0 {
    flex-shrink: 0;
  }
  .grow {
    flex-grow: 1;
  }
  .-translate-y-1\\/2 {
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  .translate-y-0 {
    --tw-translate-y: calc(var(--spacing) * 0);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  .scale-75 {
    --tw-scale-x: 75%;
    --tw-scale-y: 75%;
    --tw-scale-z: 75%;
    scale: var(--tw-scale-x) var(--tw-scale-y);
  }
  .-rotate-90 {
    rotate: calc(90deg * -1);
  }
  .rotate-90 {
    rotate: 90deg;
  }
  .rotate-180 {
    rotate: 180deg;
  }
  .transform {
    transform: var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,);
  }
  .animate-\\[react-scan-tooltip-in_100ms_ease-out\\] {
    animation: react-scan-tooltip-in 100ms ease-out;
  }
  .cursor-default {
    cursor: default;
  }
  .cursor-e-resize {
    cursor: e-resize;
  }
  .cursor-ew-resize {
    cursor: ew-resize;
  }
  .cursor-ew-resize {
    cursor: ew-resize;
  }
  .cursor-grab {
    cursor: grab;
  }
  .cursor-grabbing {
    cursor: grabbing;
  }
  .cursor-move {
    cursor: move;
  }
  .cursor-move {
    cursor: move;
  }
  .cursor-nesw-resize {
    cursor: nesw-resize;
  }
  .cursor-nesw-resize {
    cursor: nesw-resize;
  }
  .cursor-ns-resize {
    cursor: ns-resize;
  }
  .cursor-ns-resize {
    cursor: ns-resize;
  }
  .cursor-nwse-resize {
    cursor: nwse-resize;
  }
  .cursor-nwse-resize {
    cursor: nwse-resize;
  }
  .cursor-pointer {
    cursor: pointer;
  }
  .cursor-w-resize {
    cursor: w-resize;
  }
  .\\[touch-action\\:none\\] {
    touch-action: none;
  }
  .resize {
    resize: both;
  }
  .flex-col {
    flex-direction: column;
  }
  .items-center {
    align-items: center;
  }
  .items-end {
    align-items: flex-end;
  }
  .items-start {
    align-items: flex-start;
  }
  .justify-between {
    justify-content: space-between;
  }
  .justify-center {
    justify-content: center;
  }
  .justify-end {
    justify-content: flex-end;
  }
  .justify-start {
    justify-content: flex-start;
  }
  .gap-0\\.5 {
    gap: calc(var(--spacing) * 0.5);
  }
  .gap-1 {
    gap: calc(var(--spacing) * 1);
  }
  .gap-1\\.5 {
    gap: calc(var(--spacing) * 1.5);
  }
  .gap-2 {
    gap: calc(var(--spacing) * 2);
  }
  .gap-4 {
    gap: calc(var(--spacing) * 4);
  }
  .space-y-1\\.5 {
    :where(& > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block-start: calc(calc(var(--spacing) * 1.5) * var(--tw-space-y-reverse));
      margin-block-end: calc(calc(var(--spacing) * 1.5) * calc(1 - var(--tw-space-y-reverse)));
    }
  }
  .gap-x-0\\.5 {
    -moz-column-gap: calc(var(--spacing) * 0.5);
         column-gap: calc(var(--spacing) * 0.5);
  }
  .gap-x-1 {
    -moz-column-gap: calc(var(--spacing) * 1);
         column-gap: calc(var(--spacing) * 1);
  }
  .gap-x-1\\.5 {
    -moz-column-gap: calc(var(--spacing) * 1.5);
         column-gap: calc(var(--spacing) * 1.5);
  }
  .gap-x-2 {
    -moz-column-gap: calc(var(--spacing) * 2);
         column-gap: calc(var(--spacing) * 2);
  }
  .gap-x-3 {
    -moz-column-gap: calc(var(--spacing) * 3);
         column-gap: calc(var(--spacing) * 3);
  }
  .gap-x-4 {
    -moz-column-gap: calc(var(--spacing) * 4);
         column-gap: calc(var(--spacing) * 4);
  }
  .gap-y-0\\.5 {
    row-gap: calc(var(--spacing) * 0.5);
  }
  .gap-y-1 {
    row-gap: calc(var(--spacing) * 1);
  }
  .gap-y-2 {
    row-gap: calc(var(--spacing) * 2);
  }
  .gap-y-4 {
    row-gap: calc(var(--spacing) * 4);
  }
  .divide-y {
    :where(& > :not(:last-child)) {
      --tw-divide-y-reverse: 0;
      border-bottom-style: var(--tw-border-style);
      border-top-style: var(--tw-border-style);
      border-top-width: calc(1px * var(--tw-divide-y-reverse));
      border-bottom-width: calc(1px * calc(1 - var(--tw-divide-y-reverse)));
    }
  }
  .divide-zinc-800 {
    :where(& > :not(:last-child)) {
      border-color: var(--color-zinc-800);
    }
  }
  .self-end {
    align-self: flex-end;
  }
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .\\!overflow-visible {
    overflow: visible !important;
  }
  .overflow-auto {
    overflow: auto;
  }
  .overflow-hidden {
    overflow: hidden;
  }
  .overflow-x-auto {
    overflow-x: auto;
  }
  .overflow-x-hidden {
    overflow-x: hidden;
  }
  .overflow-y-auto {
    overflow-y: auto;
  }
  .rounded {
    border-radius: 4px;
  }
  .rounded-full {
    border-radius: calc(infinity * 1px);
  }
  .rounded-lg {
    border-radius: var(--radius-lg);
  }
  .rounded-md {
    border-radius: var(--radius-md);
  }
  .rounded-sm {
    border-radius: var(--radius-sm);
  }
  .rounded-xl {
    border-radius: var(--radius-xl);
  }
  .rounded-l-md {
    border-top-left-radius: var(--radius-md);
    border-bottom-left-radius: var(--radius-md);
  }
  .rounded-l-sm {
    border-top-left-radius: var(--radius-sm);
    border-bottom-left-radius: var(--radius-sm);
  }
  .rounded-r-md {
    border-top-right-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }
  .rounded-r-sm {
    border-top-right-radius: var(--radius-sm);
    border-bottom-right-radius: var(--radius-sm);
  }
  .border {
    border-style: var(--tw-border-style);
    border-width: 1px;
  }
  .border-4 {
    border-style: var(--tw-border-style);
    border-width: 4px;
  }
  .border-t {
    border-top-style: var(--tw-border-style);
    border-top-width: 1px;
  }
  .border-r {
    border-right-style: var(--tw-border-style);
    border-right-width: 1px;
  }
  .border-b {
    border-bottom-style: var(--tw-border-style);
    border-bottom-width: 1px;
  }
  .border-l {
    border-left-style: var(--tw-border-style);
    border-left-width: 1px;
  }
  .border-l-0 {
    border-left-style: var(--tw-border-style);
    border-left-width: 0px;
  }
  .border-l-1 {
    border-left-style: var(--tw-border-style);
    border-left-width: 1px;
  }
  .border-none {
    --tw-border-style: none;
    border-style: none;
  }
  .\\!border-red-500 {
    border-color: var(--color-red-500) !important;
  }
  .border-\\[\\#1e1e1e\\] {
    border-color: #1e1e1e;
  }
  .border-\\[\\#333\\] {
    border-color: #333;
  }
  .border-\\[\\#27272A\\] {
    border-color: #27272A;
  }
  .border-\\[var\\(--rs-border-subtle\\)\\] {
    border-color: var(--rs-border-subtle);
  }
  .border-transparent {
    border-color: transparent;
  }
  .border-zinc-800 {
    border-color: var(--color-zinc-800);
  }
  .bg-\\[\\#0A0A0A\\] {
    background-color: #0A0A0A;
  }
  .bg-\\[\\#1D3A66\\] {
    background-color: #1D3A66;
  }
  .bg-\\[\\#1E1E1E\\] {
    background-color: #1E1E1E;
  }
  .bg-\\[\\#1a2a1a\\] {
    background-color: #1a2a1a;
  }
  .bg-\\[\\#1e1e1e\\] {
    background-color: #1e1e1e;
  }
  .bg-\\[\\#2a1515\\] {
    background-color: #2a1515;
  }
  .bg-\\[\\#4b4b4b\\] {
    background-color: #4b4b4b;
  }
  .bg-\\[\\#5f3f9a\\] {
    background-color: #5f3f9a;
  }
  .bg-\\[\\#5f3f9a\\]\\/40 {
    background-color: color-mix(in oklab, #5f3f9a 40%, transparent);
  }
  .bg-\\[\\#6a369e\\] {
    background-color: #6a369e;
  }
  .bg-\\[\\#8e61e3\\] {
    background-color: #8e61e3;
  }
  .bg-\\[\\#7521c8\\] {
    background-color: #7521c8;
  }
  .bg-\\[\\#18181B\\] {
    background-color: #18181B;
  }
  .bg-\\[\\#18181B\\]\\/50 {
    background-color: color-mix(in oklab, #18181B 50%, transparent);
  }
  .bg-\\[\\#27272A\\] {
    background-color: #27272A;
  }
  .bg-\\[\\#44444a\\] {
    background-color: #44444a;
  }
  .bg-\\[\\#141414\\] {
    background-color: #141414;
  }
  .bg-\\[\\#214379d4\\] {
    background-color: #214379d4;
  }
  .bg-\\[\\#412162\\] {
    background-color: #412162;
  }
  .bg-\\[\\#EFD81A\\] {
    background-color: #EFD81A;
  }
  .bg-\\[\\#b77116\\] {
    background-color: #b77116;
  }
  .bg-\\[\\#b94040\\] {
    background-color: #b94040;
  }
  .bg-\\[\\#d36cff\\] {
    background-color: #d36cff;
  }
  .bg-\\[\\#efd81a6b\\] {
    background-color: #efd81a6b;
  }
  .bg-\\[var\\(--rs-panel-bg\\)\\] {
    background-color: var(--rs-panel-bg);
  }
  .bg-\\[var\\(--rs-surface-active\\)\\] {
    background-color: var(--rs-surface-active);
  }
  .bg-black {
    background-color: var(--color-black);
  }
  .bg-black\\/40 {
    background-color: color-mix(in srgb, #000 40%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-black) 40%, transparent);
    }
  }
  .bg-green-500\\/50 {
    background-color: color-mix(in srgb, oklch(72.3% 0.219 149.579) 50%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-green-500) 50%, transparent);
    }
  }
  .bg-green-500\\/60 {
    background-color: color-mix(in srgb, oklch(72.3% 0.219 149.579) 60%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-green-500) 60%, transparent);
    }
  }
  .bg-neutral-700 {
    background-color: var(--color-neutral-700);
  }
  .bg-purple-500 {
    background-color: var(--color-purple-500);
  }
  .bg-purple-500\\/90 {
    background-color: color-mix(in srgb, oklch(62.7% 0.265 303.9) 90%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-purple-500) 90%, transparent);
    }
  }
  .bg-purple-800 {
    background-color: var(--color-purple-800);
  }
  .bg-red-500 {
    background-color: var(--color-red-500);
  }
  .bg-red-500\\/90 {
    background-color: color-mix(in srgb, oklch(63.7% 0.237 25.331) 90%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-red-500) 90%, transparent);
    }
  }
  .bg-red-950\\/50 {
    background-color: color-mix(in srgb, oklch(25.8% 0.092 26.042) 50%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-red-950) 50%, transparent);
    }
  }
  .bg-transparent {
    background-color: transparent;
  }
  .bg-white {
    background-color: var(--color-white);
  }
  .bg-white\\/25 {
    background-color: color-mix(in srgb, #fff 25%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-white) 25%, transparent);
    }
  }
  .bg-yellow-300 {
    background-color: var(--color-yellow-300);
  }
  .bg-zinc-800 {
    background-color: var(--color-zinc-800);
  }
  .bg-zinc-900\\/30 {
    background-color: color-mix(in srgb, oklch(21% 0.006 285.885) 30%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-zinc-900) 30%, transparent);
    }
  }
  .bg-zinc-900\\/50 {
    background-color: color-mix(in srgb, oklch(21% 0.006 285.885) 50%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-zinc-900) 50%, transparent);
    }
  }
  .p-0 {
    padding: calc(var(--spacing) * 0);
  }
  .p-1 {
    padding: calc(var(--spacing) * 1);
  }
  .p-2 {
    padding: calc(var(--spacing) * 2);
  }
  .p-3 {
    padding: calc(var(--spacing) * 3);
  }
  .p-4 {
    padding: calc(var(--spacing) * 4);
  }
  .p-5 {
    padding: calc(var(--spacing) * 5);
  }
  .p-6 {
    padding: calc(var(--spacing) * 6);
  }
  .px-1 {
    padding-inline: calc(var(--spacing) * 1);
  }
  .px-1\\.5 {
    padding-inline: calc(var(--spacing) * 1.5);
  }
  .px-2 {
    padding-inline: calc(var(--spacing) * 2);
  }
  .px-2\\.5 {
    padding-inline: calc(var(--spacing) * 2.5);
  }
  .px-3 {
    padding-inline: calc(var(--spacing) * 3);
  }
  .px-4 {
    padding-inline: calc(var(--spacing) * 4);
  }
  .py-0\\.5 {
    padding-block: calc(var(--spacing) * 0.5);
  }
  .py-1 {
    padding-block: calc(var(--spacing) * 1);
  }
  .py-1\\.5 {
    padding-block: calc(var(--spacing) * 1.5);
  }
  .py-2 {
    padding-block: calc(var(--spacing) * 2);
  }
  .py-3 {
    padding-block: calc(var(--spacing) * 3);
  }
  .py-4 {
    padding-block: calc(var(--spacing) * 4);
  }
  .py-\\[1px\\] {
    padding-block: 1px;
  }
  .py-\\[3px\\] {
    padding-block: 3px;
  }
  .py-\\[5px\\] {
    padding-block: 5px;
  }
  .pt-0 {
    padding-top: calc(var(--spacing) * 0);
  }
  .pt-2 {
    padding-top: calc(var(--spacing) * 2);
  }
  .pt-5 {
    padding-top: calc(var(--spacing) * 5);
  }
  .pr-1 {
    padding-right: calc(var(--spacing) * 1);
  }
  .pr-1\\.5 {
    padding-right: calc(var(--spacing) * 1.5);
  }
  .pr-2 {
    padding-right: calc(var(--spacing) * 2);
  }
  .pb-2 {
    padding-bottom: calc(var(--spacing) * 2);
  }
  .pl-1 {
    padding-left: calc(var(--spacing) * 1);
  }
  .pl-2 {
    padding-left: calc(var(--spacing) * 2);
  }
  .pl-3 {
    padding-left: calc(var(--spacing) * 3);
  }
  .pl-5 {
    padding-left: calc(var(--spacing) * 5);
  }
  .pl-6 {
    padding-left: calc(var(--spacing) * 6);
  }
  .text-left {
    text-align: left;
  }
  .font-mono {
    font-family: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;
  }
  .font-sans {
    font-family: var(--font-sans);
  }
  .text-sm {
    font-size: var(--text-sm);
    line-height: var(--tw-leading, var(--text-sm--line-height));
  }
  .text-xs {
    font-size: var(--text-xs);
    line-height: var(--tw-leading, var(--text-xs--line-height));
  }
  .text-\\[8px\\] {
    font-size: 8px;
  }
  .text-\\[10px\\] {
    font-size: 10px;
  }
  .text-\\[11px\\] {
    font-size: 11px;
  }
  .text-\\[13px\\] {
    font-size: 13px;
  }
  .text-\\[14px\\] {
    font-size: 14px;
  }
  .text-\\[17px\\] {
    font-size: 17px;
  }
  .leading-4 {
    --tw-leading: calc(var(--spacing) * 4);
    line-height: calc(var(--spacing) * 4);
  }
  .leading-6 {
    --tw-leading: calc(var(--spacing) * 6);
    line-height: calc(var(--spacing) * 6);
  }
  .leading-none {
    --tw-leading: 1;
    line-height: 1;
  }
  .font-bold {
    --tw-font-weight: var(--font-weight-bold);
    font-weight: var(--font-weight-bold);
  }
  .font-medium {
    --tw-font-weight: var(--font-weight-medium);
    font-weight: var(--font-weight-medium);
  }
  .font-semibold {
    --tw-font-weight: var(--font-weight-semibold);
    font-weight: var(--font-weight-semibold);
  }
  .tracking-wide {
    --tw-tracking: var(--tracking-wide);
    letter-spacing: var(--tracking-wide);
  }
  .text-wrap {
    text-wrap: wrap;
  }
  .break-words {
    overflow-wrap: break-word;
  }
  .break-all {
    word-break: break-all;
  }
  .whitespace-nowrap {
    white-space: nowrap;
  }
  .whitespace-pre-wrap {
    white-space: pre-wrap;
  }
  .text-\\[\\#4ade80\\] {
    color: #4ade80;
  }
  .text-\\[\\#5a5a5a\\] {
    color: #5a5a5a;
  }
  .text-\\[\\#6E6E77\\] {
    color: #6E6E77;
  }
  .text-\\[\\#6F6F78\\] {
    color: #6F6F78;
  }
  .text-\\[\\#8e61e3\\] {
    color: #8e61e3;
  }
  .text-\\[\\#666\\] {
    color: #666;
  }
  .text-\\[\\#888\\] {
    color: #888;
  }
  .text-\\[\\#7346a0\\] {
    color: #7346a0;
  }
  .text-\\[\\#65656D\\] {
    color: #65656D;
  }
  .text-\\[\\#737373\\] {
    color: #737373;
  }
  .text-\\[\\#A1A1AA\\] {
    color: #A1A1AA;
  }
  .text-\\[\\#A855F7\\] {
    color: #A855F7;
  }
  .text-\\[\\#E4E4E7\\] {
    color: #E4E4E7;
  }
  .text-\\[\\#d36cff\\] {
    color: #d36cff;
  }
  .text-\\[\\#f87171\\] {
    color: #f87171;
  }
  .text-\\[var\\(--rs-text-primary\\)\\] {
    color: var(--rs-text-primary);
  }
  .text-\\[var\\(--rs-text-secondary\\)\\] {
    color: var(--rs-text-secondary);
  }
  .text-black {
    color: var(--color-black);
  }
  .text-current {
    color: currentcolor;
  }
  .text-gray-100 {
    color: var(--color-gray-100);
  }
  .text-gray-400 {
    color: var(--color-gray-400);
  }
  .text-gray-500 {
    color: var(--color-gray-500);
  }
  .text-green-500 {
    color: var(--color-green-500);
  }
  .text-neutral-300 {
    color: var(--color-neutral-300);
  }
  .text-neutral-400 {
    color: var(--color-neutral-400);
  }
  .text-neutral-500 {
    color: var(--color-neutral-500);
  }
  .text-purple-400 {
    color: var(--color-purple-400);
  }
  .text-red-300 {
    color: var(--color-red-300);
  }
  .text-red-400 {
    color: var(--color-red-400);
  }
  .text-red-500 {
    color: var(--color-red-500);
  }
  .text-white {
    color: var(--color-white);
  }
  .text-white\\/30 {
    color: color-mix(in srgb, #fff 30%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      color: color-mix(in oklab, var(--color-white) 30%, transparent);
    }
  }
  .text-white\\/70 {
    color: color-mix(in srgb, #fff 70%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      color: color-mix(in oklab, var(--color-white) 70%, transparent);
    }
  }
  .text-yellow-300 {
    color: var(--color-yellow-300);
  }
  .text-yellow-500 {
    color: var(--color-yellow-500);
  }
  .text-zinc-400 {
    color: var(--color-zinc-400);
  }
  .text-zinc-500 {
    color: var(--color-zinc-500);
  }
  .text-zinc-600 {
    color: var(--color-zinc-600);
  }
  .uppercase {
    text-transform: uppercase;
  }
  .italic {
    font-style: italic;
  }
  .opacity-0 {
    opacity: 0%;
  }
  .opacity-50 {
    opacity: 50%;
  }
  .opacity-80 {
    opacity: 80%;
  }
  .opacity-100 {
    opacity: 100%;
  }
  .shadow-lg {
    --tw-shadow: 0 10px 15px -3px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 4px 6px -4px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .ring-1 {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .\\[box-shadow\\:var\\(--rs-shadow\\)\\] {
    box-shadow: var(--rs-shadow);
  }
  .ring-white\\/\\[0\\.08\\] {
    --tw-ring-color: color-mix(in srgb, #fff 8%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      --tw-ring-color: color-mix(in oklab, var(--color-white) 8%, transparent);
    }
  }
  .outline {
    outline-style: var(--tw-outline-style);
    outline-width: 1px;
  }
  .filter {
    filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,);
  }
  .backdrop-blur-sm {
    --tw-backdrop-blur: blur(var(--blur-sm));
    backdrop-filter: var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);
  }
  .transition {
    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, backdrop-filter, display, content-visibility, overlay, pointer-events;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-\\[color\\,transform\\] {
    transition-property: color,transform;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-\\[max-height\\] {
    transition-property: max-height;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-\\[opacity\\] {
    transition-property: opacity;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-all {
    transition-property: all;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-colors {
    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-opacity {
    transition-property: opacity;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-transform {
    transition-property: transform, translate, scale, rotate;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-none {
    transition-property: none;
  }
  .delay-0 {
    transition-delay: 0ms;
  }
  .delay-150 {
    transition-delay: 150ms;
  }
  .delay-300 {
    transition-delay: 300ms;
  }
  .\\!duration-0 {
    --tw-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
  .duration-0 {
    --tw-duration: 0ms;
    transition-duration: 0ms;
  }
  .duration-120 {
    --tw-duration: 120ms;
    transition-duration: 120ms;
  }
  .duration-200 {
    --tw-duration: 200ms;
    transition-duration: 200ms;
  }
  .duration-300 {
    --tw-duration: 300ms;
    transition-duration: 300ms;
  }
  .ease-\\[cubic-bezier\\(0\\.25\\,0\\.1\\,0\\.25\\,1\\)\\] {
    --tw-ease: cubic-bezier(0.25,0.1,0.25,1);
    transition-timing-function: cubic-bezier(0.25,0.1,0.25,1);
  }
  .ease-in {
    --tw-ease: var(--ease-in);
    transition-timing-function: var(--ease-in);
  }
  .ease-in-out {
    --tw-ease: var(--ease-in-out);
    transition-timing-function: var(--ease-in-out);
  }
  .ease-out {
    --tw-ease: var(--ease-out);
    transition-timing-function: var(--ease-out);
  }
  .\\[will-change\\:transform\\] {
    will-change: transform;
  }
  .will-change-transform {
    will-change: transform;
  }
  .select-none {
    -webkit-user-select: none;
    -moz-user-select: none;
         user-select: none;
  }
  .animation-delay-0 {
    animation-delay: 0s;
  }
  .animation-delay-100 {
    animation-delay: .1s;
  }
  .animation-delay-150 {
    animation-delay: .15s;
  }
  .animation-delay-200 {
    animation-delay: .2s;
  }
  .animation-delay-300 {
    animation-delay: .3s;
  }
  .animation-delay-500 {
    animation-delay: .5s;
  }
  .animation-delay-700 {
    animation-delay: .7s;
  }
  .animation-delay-1000 {
    animation-delay: 1s;
  }
  .animation-duration-0 {
    animation-duration: 0s;
  }
  .animation-duration-100 {
    animation-duration: .1s;
  }
  .animation-duration-200 {
    animation-duration: .2s;
  }
  .animation-duration-300 {
    animation-duration: .3s;
  }
  .animation-duration-500 {
    animation-duration: .5s;
  }
  .animation-duration-700 {
    animation-duration: .7s;
  }
  .animation-duration-1000 {
    animation-duration: 1s;
  }
  .group-hover\\:bg-\\[\\#5b2d89\\] {
    &:is(:where(.group):hover *) {
      @media (hover: hover) {
        background-color: #5b2d89;
      }
    }
  }
  .group-hover\\:bg-\\[\\#6a6a6a\\] {
    &:is(:where(.group):hover *) {
      @media (hover: hover) {
        background-color: #6a6a6a;
      }
    }
  }
  .group-hover\\:bg-\\[\\#21437982\\] {
    &:is(:where(.group):hover *) {
      @media (hover: hover) {
        background-color: #21437982;
      }
    }
  }
  .group-hover\\:bg-\\[\\#efda1a2f\\] {
    &:is(:where(.group):hover *) {
      @media (hover: hover) {
        background-color: #efda1a2f;
      }
    }
  }
  .group-hover\\:opacity-100 {
    &:is(:where(.group):hover *) {
      @media (hover: hover) {
        opacity: 100%;
      }
    }
  }
  .peer-hover\\/bottom\\:rounded-b-none {
    &:is(:where(.peer\\/bottom):hover ~ *) {
      @media (hover: hover) {
        border-bottom-right-radius: 0;
        border-bottom-left-radius: 0;
      }
    }
  }
  .peer-hover\\/left\\:rounded-l-none {
    &:is(:where(.peer\\/left):hover ~ *) {
      @media (hover: hover) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }
  }
  .peer-hover\\/right\\:rounded-r-none {
    &:is(:where(.peer\\/right):hover ~ *) {
      @media (hover: hover) {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
    }
  }
  .peer-hover\\/top\\:rounded-t-none {
    &:is(:where(.peer\\/top):hover ~ *) {
      @media (hover: hover) {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }
    }
  }
  .after\\:absolute {
    &::after {
      content: var(--tw-content);
      position: absolute;
    }
  }
  .after\\:inset-0 {
    &::after {
      content: var(--tw-content);
      inset: calc(var(--spacing) * 0);
    }
  }
  .after\\:top-\\[100\\%\\] {
    &::after {
      content: var(--tw-content);
      top: 100%;
    }
  }
  .after\\:left-1\\/2 {
    &::after {
      content: var(--tw-content);
      left: calc(1 / 2 * 100%);
    }
  }
  .after\\:h-\\[6px\\] {
    &::after {
      content: var(--tw-content);
      height: 6px;
    }
  }
  .after\\:w-\\[10px\\] {
    &::after {
      content: var(--tw-content);
      width: 10px;
    }
  }
  .after\\:-translate-x-1\\/2 {
    &::after {
      content: var(--tw-content);
      --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
      translate: var(--tw-translate-x) var(--tw-translate-y);
    }
  }
  .after\\:animate-\\[fadeOut_1s_ease-out_forwards\\] {
    &::after {
      content: var(--tw-content);
      animation: fadeOut 1s ease-out forwards;
    }
  }
  .after\\:border-t-\\[6px\\] {
    &::after {
      content: var(--tw-content);
      border-top-style: var(--tw-border-style);
      border-top-width: 6px;
    }
  }
  .after\\:border-r-\\[5px\\] {
    &::after {
      content: var(--tw-content);
      border-right-style: var(--tw-border-style);
      border-right-width: 5px;
    }
  }
  .after\\:border-l-\\[5px\\] {
    &::after {
      content: var(--tw-content);
      border-left-style: var(--tw-border-style);
      border-left-width: 5px;
    }
  }
  .after\\:border-t-white {
    &::after {
      content: var(--tw-content);
      border-top-color: var(--color-white);
    }
  }
  .after\\:border-r-transparent {
    &::after {
      content: var(--tw-content);
      border-right-color: transparent;
    }
  }
  .after\\:border-l-transparent {
    &::after {
      content: var(--tw-content);
      border-left-color: transparent;
    }
  }
  .after\\:bg-purple-500\\/30 {
    &::after {
      content: var(--tw-content);
      background-color: color-mix(in srgb, oklch(62.7% 0.265 303.9) 30%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-purple-500) 30%, transparent);
      }
    }
  }
  .after\\:content-\\[\\"\\"\\] {
    &::after {
      --tw-content: "";
      content: var(--tw-content);
    }
  }
  .focus-within\\:border-\\[\\#454545\\] {
    &:focus-within {
      border-color: #454545;
    }
  }
  .hover\\:bg-\\[\\#0f0f0f\\] {
    &:hover {
      @media (hover: hover) {
        background-color: #0f0f0f;
      }
    }
  }
  .hover\\:bg-\\[\\#5f3f9a\\]\\/20 {
    &:hover {
      @media (hover: hover) {
        background-color: color-mix(in oklab, #5f3f9a 20%, transparent);
      }
    }
  }
  .hover\\:bg-\\[\\#5f3f9a\\]\\/40 {
    &:hover {
      @media (hover: hover) {
        background-color: color-mix(in oklab, #5f3f9a 40%, transparent);
      }
    }
  }
  .hover\\:bg-\\[\\#18181B\\] {
    &:hover {
      @media (hover: hover) {
        background-color: #18181B;
      }
    }
  }
  .hover\\:bg-\\[\\#34343b\\] {
    &:hover {
      @media (hover: hover) {
        background-color: #34343b;
      }
    }
  }
  .hover\\:bg-\\[var\\(--rs-surface-hover\\)\\] {
    &:hover {
      @media (hover: hover) {
        background-color: var(--rs-surface-hover);
      }
    }
  }
  .hover\\:bg-red-600 {
    &:hover {
      @media (hover: hover) {
        background-color: var(--color-red-600);
      }
    }
  }
  .hover\\:bg-zinc-700 {
    &:hover {
      @media (hover: hover) {
        background-color: var(--color-zinc-700);
      }
    }
  }
  .hover\\:bg-zinc-800\\/50 {
    &:hover {
      @media (hover: hover) {
        background-color: color-mix(in srgb, oklch(27.4% 0.006 286.033) 50%, transparent);
        @supports (color: color-mix(in lab, red, red)) {
          background-color: color-mix(in oklab, var(--color-zinc-800) 50%, transparent);
        }
      }
    }
  }
  .hover\\:text-neutral-300 {
    &:hover {
      @media (hover: hover) {
        color: var(--color-neutral-300);
      }
    }
  }
}
:host,
:host([data-react-scan-theme="dark"]) {
  --rs-panel-bg: #161616;
  --rs-panel-raised: #202020;
  --rs-text-primary: #fff;
  --rs-text-secondary: #a7a7a7;
  --rs-surface-hover: rgb(255 255 255 / 10%);
  --rs-surface-active: rgb(255 255 255 / 15%);
  --rs-border-subtle: rgb(255 255 255 / 10%);
  --rs-shadow: 0 2px 8px rgb(0 0 0 / 8%);
  --rs-ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --rs-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
:host([data-react-scan-theme="light"]) {
  --rs-panel-bg: #fff;
  --rs-panel-raised: #f5f5f5;
  --rs-text-primary: #171717;
  --rs-text-secondary: #737373;
  --rs-surface-hover: rgb(0 0 0 / 5%);
  --rs-surface-active: rgb(0 0 0 / 8%);
  --rs-border-subtle: rgb(0 0 0 / 8%);
  --rs-shadow: 0 2px 12px rgb(0 0 0 / 10%);
}
@keyframes react-scan-tooltip-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes react-scan-shake {
  0%,
  100% {
    translate: 0;
  }
  25% {
    translate: -3px;
  }
  50% {
    translate: 3px;
  }
  75% {
    translate: -2px;
  }
}
.react-scan-interactive-scale {
  transition: transform 400ms var(--rs-ease-spring);
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: scale(1.05);
    }
  }
  &:active {
    transform: scale(0.96);
    transition: transform 60ms cubic-bezier(0, 0, 0.2, 1);
  }
}
.react-scan-a11y-hitbox {
  position: relative;
  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: max(100%, 24px);
    height: max(100%, 24px);
    transform: translate(-50%, -50%);
    pointer-events: auto;
  }
}
@media (prefers-reduced-motion: reduce) {
  :host,
  :host *,
  :host *::before,
  :host *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
* {
  outline: none !important;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    border-radius: 10px;
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.3);
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
  }
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
}
@-moz-document url-prefix() {
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.4) transparent;
    scrollbar-width: 6px;
  }
}
button {
  &:hover {
    @media (hover: hover) {
      background-image: none;
    }
  }
  --tw-outline-style: none;
  outline-style: none;
  --tw-border-style: none;
  border-style: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-ease: var(--ease-out);
  transition-timing-function: var(--ease-out);
  cursor: pointer;
}
input {
  --tw-outline-style: none;
  outline-style: none;
  --tw-border-style: none;
  border-style: none;
  background-color: transparent;
  background-image: none;
  &::-moz-placeholder {
    font-size: var(--text-xs);
    line-height: var(--tw-leading, var(--text-xs--line-height));
  }
  &::placeholder {
    font-size: var(--text-xs);
    line-height: var(--tw-leading, var(--text-xs--line-height));
  }
  &::-moz-placeholder {
    color: var(--color-neutral-500);
  }
  &::placeholder {
    color: var(--color-neutral-500);
  }
  &::-moz-placeholder {
    font-style: italic;
  }
  &::placeholder {
    font-style: italic;
  }
  &:-moz-placeholder {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &:placeholder-shown {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
svg {
  height: auto;
  width: auto;
  pointer-events: none;
}
.with-data-text {
  overflow: hidden;
  &::before {
    content: attr(data-text);
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
#react-scan-toolbar {
  position: fixed;
  top: calc(var(--spacing) * 0);
  left: calc(var(--spacing) * 0);
  display: flex;
  flex-direction: column;
  --tw-shadow: 0 10px 15px -3px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 4px 6px -4px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
  font-family: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;
  font-size: 13px;
  color: var(--color-white);
  background-color: var(--color-black);
  -webkit-user-select: none;
  -moz-user-select: none;
       user-select: none;
  cursor: move;
  opacity: 0%;
  z-index: 2147483678;
  animation: fadeIn ease-in forwards;
  animation-delay: .3s;
  animation-duration: .3s;
  --tw-shadow: 0 4px 12px var(--tw-shadow-color, rgba(0,0,0,0.2));
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  place-self: start;
  will-change: transform;
  backface-visibility: hidden;
}
#react-scan-toolbar pre,
#react-scan-toolbar textarea,
#react-scan-toolbar input[type="text"],
#react-scan-toolbar input[type="search"],
#react-scan-toolbar [data-react-scan-selectable] {
  -webkit-user-select: text;
  -moz-user-select: text;
       user-select: text;
  cursor: text;
}
.button {
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  &:active {
    background: rgba(255, 255, 255, 0.15);
  }
}
.resize-line-wrapper {
  position: absolute;
  overflow: hidden;
}
.resize-line {
  position: absolute;
  inset: calc(var(--spacing) * 0);
  overflow: hidden;
  background-color: var(--color-black);
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  svg {
    position: absolute;
    top: calc(1 / 2 * 100%);
    left: calc(1 / 2 * 100%);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
}
.resize-right,
.resize-left {
  inset-block: calc(var(--spacing) * 0);
  width: calc(var(--spacing) * 6);
  cursor: ew-resize;
  .resize-line-wrapper {
    inset-block: calc(var(--spacing) * 0);
    width: calc(1 / 2 * 100%);
  }
  &:hover {
    .resize-line {
      --tw-translate-x: calc(var(--spacing) * 0);
      translate: var(--tw-translate-x) var(--tw-translate-y);
    }
  }
}
.resize-right {
  right: calc(var(--spacing) * 0);
  --tw-translate-x: calc(1 / 2 * 100%);
  translate: var(--tw-translate-x) var(--tw-translate-y);
  .resize-line-wrapper {
    right: calc(var(--spacing) * 0);
  }
  .resize-line {
    border-top-right-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
    --tw-translate-x: -100%;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
}
.resize-left {
  left: calc(var(--spacing) * 0);
  --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
  translate: var(--tw-translate-x) var(--tw-translate-y);
  .resize-line-wrapper {
    left: calc(var(--spacing) * 0);
  }
  .resize-line {
    border-top-left-radius: var(--radius-lg);
    border-bottom-left-radius: var(--radius-lg);
    --tw-translate-x: 100%;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
}
.resize-top,
.resize-bottom {
  inset-inline: calc(var(--spacing) * 0);
  height: calc(var(--spacing) * 6);
  cursor: ns-resize;
  .resize-line-wrapper {
    inset-inline: calc(var(--spacing) * 0);
    height: calc(1 / 2 * 100%);
  }
  &:hover {
    .resize-line {
      --tw-translate-y: calc(var(--spacing) * 0);
      translate: var(--tw-translate-x) var(--tw-translate-y);
    }
  }
}
.resize-top {
  top: calc(var(--spacing) * 0);
  --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
  translate: var(--tw-translate-x) var(--tw-translate-y);
  .resize-line-wrapper {
    top: calc(var(--spacing) * 0);
  }
  .resize-line {
    border-top-left-radius: var(--radius-lg);
    border-top-right-radius: var(--radius-lg);
    --tw-translate-y: 100%;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
}
.resize-bottom {
  bottom: calc(var(--spacing) * 0);
  --tw-translate-y: calc(1 / 2 * 100%);
  translate: var(--tw-translate-x) var(--tw-translate-y);
  .resize-line-wrapper {
    bottom: calc(var(--spacing) * 0);
  }
  .resize-line {
    border-bottom-right-radius: var(--radius-lg);
    border-bottom-left-radius: var(--radius-lg);
    --tw-translate-y: -100%;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
}
.react-scan-header {
  display: flex;
  align-items: center;
  -moz-column-gap: calc(var(--spacing) * 2);
       column-gap: calc(var(--spacing) * 2);
  padding-right: calc(var(--spacing) * 2);
  padding-left: calc(var(--spacing) * 3);
  min-height: calc(var(--spacing) * 9);
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 1px;
  border-color: #222;
  overflow: hidden;
  white-space: nowrap;
}
.react-scan-replay-button,
.react-scan-close-button {
  display: flex;
  align-items: center;
  padding: calc(var(--spacing) * 1);
  min-width: -moz-fit-content;
  min-width: fit-content;
  border-radius: 4px;
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-duration: 300ms;
  transition-duration: 300ms;
}
.react-scan-replay-button {
  position: relative;
  overflow: hidden;
  background-color: color-mix(in srgb, oklch(62.7% 0.265 303.9) 50%, transparent) !important;
  @supports (color: color-mix(in lab, red, red)) {
    background-color: color-mix(in oklab, var(--color-purple-500) 50%, transparent) !important;
  }
  &:hover {
    background-color: color-mix(in srgb, oklch(62.7% 0.265 303.9) 25%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-purple-500) 25%, transparent);
    }
  }
  &.disabled {
    opacity: 50%;
    pointer-events: none;
  }
  &:before {
    content: "";
    position: absolute;
    inset: calc(var(--spacing) * 0);
    --tw-translate-x: -100%;
    translate: var(--tw-translate-x) var(--tw-translate-y);
    animation: shimmer 2s infinite;
    background: linear-gradient(to right, transparent, rgba(142, 97, 227, 0.3), transparent);
  }
}
.react-scan-close-button {
  background-color: color-mix(in srgb, #fff 10%, transparent);
  @supports (color: color-mix(in lab, red, red)) {
    background-color: color-mix(in oklab, var(--color-white) 10%, transparent);
  }
  &:hover {
    background-color: color-mix(in srgb, #fff 15%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-white) 15%, transparent);
    }
  }
}
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
.react-section-header {
  position: sticky;
  z-index: 100;
  display: flex;
  align-items: center;
  -moz-column-gap: calc(var(--spacing) * 2);
       column-gap: calc(var(--spacing) * 2);
  padding-inline: calc(var(--spacing) * 3);
  height: calc(var(--spacing) * 7);
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #888;
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 1px;
  border-color: #222;
  background-color: #0a0a0a;
}
.react-scan-section {
  display: flex;
  flex-direction: column;
  padding-inline: calc(var(--spacing) * 2);
  color: #888;
  &::before {
    content: var(--tw-content);
    color: var(--color-gray-500);
  }
  &::before {
    --tw-content: attr(data-section);
    content: var(--tw-content);
  }
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
  > .react-scan-property {
    margin-left: calc(14px * -1);
  }
}
.react-scan-property {
  position: relative;
  display: flex;
  flex-direction: column;
  padding-left: calc(var(--spacing) * 8);
  border-left-style: var(--tw-border-style);
  border-left-width: 1px;
  border-color: transparent;
  overflow: hidden;
}
.react-scan-property-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: calc(var(--spacing) * 7);
  max-width: 100%;
  overflow: hidden;
}
.react-scan-string {
  color: #9ecbff;
}
.react-scan-number {
  color: #79c7ff;
}
.react-scan-boolean {
  color: #56b6c2;
}
.react-scan-key {
  width: -moz-fit-content;
  width: fit-content;
  max-width: calc(var(--spacing) * 60);
  white-space: nowrap;
  color: var(--color-white);
}
.react-scan-input {
  color: var(--color-white);
  background-color: var(--color-black);
}
@keyframes blink {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.react-scan-arrow {
  position: absolute;
  top: calc(var(--spacing) * 0);
  left: calc(var(--spacing) * 7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  height: calc(var(--spacing) * 7);
  width: calc(var(--spacing) * 6);
  --tw-translate-x: -100%;
  translate: var(--tw-translate-x) var(--tw-translate-y);
  z-index: 10;
  > svg {
    transition-property: transform, translate, scale, rotate;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
}
.react-scan-nested {
  position: relative;
  overflow: hidden;
  &:before {
    content: "";
    position: absolute;
    top: calc(var(--spacing) * 0);
    left: calc(var(--spacing) * 0);
    height: 100%;
    width: 1px;
    background-color: color-mix(in srgb, oklch(55.1% 0.027 264.364) 30%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-gray-500) 30%, transparent);
    }
  }
}
.react-scan-settings {
  position: absolute;
  inset: calc(var(--spacing) * 0);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 4);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 2);
  color: #888;
  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
    --tw-duration: 300ms;
    transition-duration: 300ms;
  }
}
.react-scan-preview-line {
  position: relative;
  display: flex;
  min-height: calc(var(--spacing) * 7);
  align-items: center;
  -moz-column-gap: calc(var(--spacing) * 2);
       column-gap: calc(var(--spacing) * 2);
}
.react-scan-flash-overlay {
  position: absolute;
  inset: calc(var(--spacing) * 0);
  opacity: 0%;
  z-index: 50;
  pointer-events: none;
  transition-property: opacity;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  mix-blend-mode: multiply;
  background-color: color-mix(in srgb, oklch(62.7% 0.265 303.9) 90%, transparent);
  @supports (color: color-mix(in lab, red, red)) {
    background-color: color-mix(in oklab, var(--color-purple-500) 90%, transparent);
  }
}
.react-scan-toggle {
  position: relative;
  display: inline-flex;
  height: calc(var(--spacing) * 6);
  width: calc(var(--spacing) * 10);
  input {
    position: absolute;
    inset: calc(var(--spacing) * 0);
    z-index: 20;
    opacity: 0%;
    cursor: pointer;
    height: 100%;
    width: 100%;
  }
  input:checked {
    + div {
      background-color: #5f3f9a;
      &::before {
        --tw-translate-x: 100%;
        translate: var(--tw-translate-x) var(--tw-translate-y);
        left: auto;
        border-color: #5f3f9a;
      }
    }
  }
  > div {
    position: absolute;
    inset: calc(var(--spacing) * 1);
    background-color: var(--color-neutral-700);
    border-radius: calc(infinity * 1px);
    pointer-events: none;
    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
    --tw-duration: 300ms;
    transition-duration: 300ms;
    &:before {
      --tw-content: '';
      content: var(--tw-content);
      position: absolute;
      top: calc(1 / 2 * 100%);
      left: calc(var(--spacing) * 0);
      --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
      translate: var(--tw-translate-x) var(--tw-translate-y);
      height: calc(var(--spacing) * 4);
      width: calc(var(--spacing) * 4);
      background-color: var(--color-white);
      border-style: var(--tw-border-style);
      border-width: 2px;
      border-color: var(--color-neutral-700);
      border-radius: calc(infinity * 1px);
      --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      transition-property: all;
      transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
      transition-duration: var(--tw-duration, var(--default-transition-duration));
      --tw-duration: 300ms;
      transition-duration: 300ms;
    }
  }
}
.react-scan-flash-active {
  opacity: 40%;
  transition-property: opacity;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-duration: 300ms;
  transition-duration: 300ms;
}
.react-scan-inspector-overlay {
  display: flex;
  flex-direction: column;
  opacity: 0%;
  transition-property: opacity;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-duration: 200ms;
  transition-duration: 200ms;
  --tw-ease: var(--ease-out);
  transition-timing-function: var(--ease-out);
  will-change: opacity;
  &.fade-out {
    opacity: 0%;
  }
  &.fade-in {
    opacity: 100%;
  }
}
.react-scan-what-changed {
  ul {
    list-style-type: disc;
    padding-left: calc(var(--spacing) * 4);
  }
  li {
    white-space: nowrap;
    > div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      -moz-column-gap: calc(var(--spacing) * 2);
           column-gap: calc(var(--spacing) * 2);
    }
  }
}
.count-badge {
  display: flex;
  align-items: center;
  -moz-column-gap: calc(var(--spacing) * 2);
       column-gap: calc(var(--spacing) * 2);
  padding-inline: calc(var(--spacing) * 1.5);
  padding-block: calc(var(--spacing) * 0.5);
  border-radius: 4px;
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
  color: #a855f7;
  --tw-numeric-spacing: tabular-nums;
  font-variant-numeric: var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,);
  background-color: color-mix(in oklab, #a855f7 10%, transparent);
  transform-origin: center;
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-delay: 150ms;
  --tw-duration: 300ms;
  transition-duration: 300ms;
}
.count-flash {
  animation: countFlash .3s ease-out forwards;
}
.count-flash-white {
  animation: countFlashShake .3s ease-out forwards;
  transition-delay: 500ms !important;
}
.change-scope {
  display: flex;
  align-items: center;
  -moz-column-gap: calc(var(--spacing) * 1);
       column-gap: calc(var(--spacing) * 1);
  color: #666;
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
  font-family: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;
  > div {
    padding-inline: calc(var(--spacing) * 1.5);
    padding-block: calc(var(--spacing) * 0.5);
    border-radius: 4px;
    font-size: var(--text-xs);
    line-height: var(--tw-leading, var(--text-xs--line-height));
    --tw-font-weight: var(--font-weight-medium);
    font-weight: var(--font-weight-medium);
    --tw-numeric-spacing: tabular-nums;
    font-variant-numeric: var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,);
    transform-origin: center;
    transition-property: all;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
    transition-delay: 150ms;
    --tw-duration: 300ms;
    transition-duration: 300ms;
    &[data-flash="true"] {
      background-color: color-mix(in oklab, #a855f7 10%, transparent);
      color: #a855f7;
    }
  }
}
.react-scan-slider {
  position: relative;
  min-height: calc(var(--spacing) * 6);
  > input {
    position: absolute;
    inset: calc(var(--spacing) * 0);
    opacity: 0%;
  }
  &:before {
    --tw-content: '';
    content: var(--tw-content);
    position: absolute;
    inset-inline: calc(var(--spacing) * 0);
    top: calc(1 / 2 * 100%);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
    height: calc(var(--spacing) * 1.5);
    background-color: color-mix(in oklab, #8e61e3 40%, transparent);
    border-radius: var(--radius-lg);
    pointer-events: none;
  }
  &:after {
    --tw-content: '';
    content: var(--tw-content);
    position: absolute;
    inset-inline: calc(var(--spacing) * 0);
    inset-block: calc(var(--spacing) * -2);
    z-index: calc(10 * -1);
  }
  span {
    position: absolute;
    top: calc(1 / 2 * 100%);
    left: calc(var(--spacing) * 0);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
    height: calc(var(--spacing) * 2.5);
    width: calc(var(--spacing) * 2.5);
    border-radius: var(--radius-lg);
    background-color: #8e61e3;
    pointer-events: none;
    transition-property: transform, translate, scale, rotate;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
    --tw-duration: 75ms;
    transition-duration: 75ms;
  }
}
.resize-v-line {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: calc(var(--spacing) * 1);
  min-width: calc(var(--spacing) * 1);
  height: 100%;
  width: 100%;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:hover,
  &:active {
    > span {
      background-color: #222;
    }
    svg {
      opacity: 100%;
    }
  }
  &::before {
    --tw-content: "";
    content: var(--tw-content);
    position: absolute;
    inset: calc(var(--spacing) * 0);
    left: calc(1 / 2 * 100%);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
    width: 1px;
    background-color: #222;
    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  > span {
    position: absolute;
    top: calc(1 / 2 * 100%);
    left: calc(1 / 2 * 100%);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
    height: 18px;
    width: calc(var(--spacing) * 1.5);
    border-radius: 4px;
    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  svg {
    position: absolute;
    top: calc(1 / 2 * 100%);
    left: calc(1 / 2 * 100%);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
    rotate: 90deg;
    color: var(--color-neutral-400);
    opacity: 0%;
    transition-property: opacity;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
    z-index: 50;
  }
}
.tree-node-search-highlight {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  span {
    padding-block: 1px;
    border-radius: var(--radius-sm);
    background-color: var(--color-yellow-300);
    --tw-font-weight: var(--font-weight-medium);
    font-weight: var(--font-weight-medium);
    color: var(--color-black);
  }
  .single {
    margin-right: 1px;
    padding-inline: 2px;
  }
  .regex {
    padding-inline: 2px;
  }
  .start {
    margin-left: 1px;
    border-top-left-radius: var(--radius-sm);
    border-bottom-left-radius: var(--radius-sm);
  }
  .end {
    margin-right: 1px;
    border-top-right-radius: var(--radius-sm);
    border-bottom-right-radius: var(--radius-sm);
  }
  .middle {
    margin-inline: 1px;
    border-radius: var(--radius-sm);
  }
}
.react-scan-toolbar-notification {
  position: absolute;
  inset-inline: calc(var(--spacing) * 0);
  display: flex;
  align-items: center;
  -moz-column-gap: calc(var(--spacing) * 2);
       column-gap: calc(var(--spacing) * 2);
  padding: calc(var(--spacing) * 1);
  padding-left: calc(var(--spacing) * 2);
  font-size: 10px;
  color: var(--color-neutral-300);
  background-color: color-mix(in srgb, #000 90%, transparent);
  @supports (color: color-mix(in lab, red, red)) {
    background-color: color-mix(in oklab, var(--color-black) 90%, transparent);
  }
  transition-property: transform, translate, scale, rotate;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:before {
    --tw-content: '';
    content: var(--tw-content);
    position: absolute;
    inset-inline: calc(var(--spacing) * 0);
    background-color: var(--color-black);
    height: calc(var(--spacing) * 2);
  }
  &.position-top {
    top: 100%;
    --tw-translate-y: -100%;
    translate: var(--tw-translate-x) var(--tw-translate-y);
    border-bottom-right-radius: var(--radius-lg);
    border-bottom-left-radius: var(--radius-lg);
    &::before {
      top: calc(var(--spacing) * 0);
      --tw-translate-y: -100%;
      translate: var(--tw-translate-x) var(--tw-translate-y);
    }
  }
  &.position-bottom {
    bottom: 100%;
    --tw-translate-y: 100%;
    translate: var(--tw-translate-x) var(--tw-translate-y);
    border-top-left-radius: var(--radius-lg);
    border-top-right-radius: var(--radius-lg);
    &::before {
      bottom: calc(var(--spacing) * 0);
      --tw-translate-y: 100%;
      translate: var(--tw-translate-x) var(--tw-translate-y);
    }
  }
  &.is-open {
    --tw-translate-y: calc(var(--spacing) * 0);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
}
.react-scan-header-item {
  position: absolute;
  inset: calc(var(--spacing) * 0);
  --tw-translate-y: calc(200% * -1);
  translate: var(--tw-translate-x) var(--tw-translate-y);
  transition-property: transform, translate, scale, rotate;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-duration: 300ms;
  transition-duration: 300ms;
  &.is-visible {
    --tw-translate-y: calc(var(--spacing) * 0);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
}
.react-scan-components-tree:has(.resize-v-line:hover, .resize-v-line:active) .tree {
  overflow: hidden;
}
.react-scan-expandable {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-duration: 75ms;
  transition-duration: 75ms;
  transition-timing-function: ease-out;
  > * {
    min-height: 0;
  }
  &.react-scan-expanded {
    grid-template-rows: 1fr;
    transition-duration: 100ms;
  }
}
@property --tw-translate-x {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-translate-y {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-translate-z {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-scale-x {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-scale-y {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-scale-z {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-rotate-x {
  syntax: "*";
  inherits: false;
}
@property --tw-rotate-y {
  syntax: "*";
  inherits: false;
}
@property --tw-rotate-z {
  syntax: "*";
  inherits: false;
}
@property --tw-skew-x {
  syntax: "*";
  inherits: false;
}
@property --tw-skew-y {
  syntax: "*";
  inherits: false;
}
@property --tw-space-y-reverse {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-divide-y-reverse {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-border-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}
@property --tw-leading {
  syntax: "*";
  inherits: false;
}
@property --tw-font-weight {
  syntax: "*";
  inherits: false;
}
@property --tw-tracking {
  syntax: "*";
  inherits: false;
}
@property --tw-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-inset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-inset-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-inset-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-ring-color {
  syntax: "*";
  inherits: false;
}
@property --tw-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-inset-ring-color {
  syntax: "*";
  inherits: false;
}
@property --tw-inset-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-ring-inset {
  syntax: "*";
  inherits: false;
}
@property --tw-ring-offset-width {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}
@property --tw-ring-offset-color {
  syntax: "*";
  inherits: false;
  initial-value: #fff;
}
@property --tw-ring-offset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-outline-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}
@property --tw-blur {
  syntax: "*";
  inherits: false;
}
@property --tw-brightness {
  syntax: "*";
  inherits: false;
}
@property --tw-contrast {
  syntax: "*";
  inherits: false;
}
@property --tw-grayscale {
  syntax: "*";
  inherits: false;
}
@property --tw-hue-rotate {
  syntax: "*";
  inherits: false;
}
@property --tw-invert {
  syntax: "*";
  inherits: false;
}
@property --tw-opacity {
  syntax: "*";
  inherits: false;
}
@property --tw-saturate {
  syntax: "*";
  inherits: false;
}
@property --tw-sepia {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-drop-shadow-size {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-blur {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-brightness {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-contrast {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-grayscale {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-hue-rotate {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-invert {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-opacity {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-saturate {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-sepia {
  syntax: "*";
  inherits: false;
}
@property --tw-duration {
  syntax: "*";
  inherits: false;
}
@property --tw-ease {
  syntax: "*";
  inherits: false;
}
@property --tw-content {
  syntax: "*";
  initial-value: "";
  inherits: false;
}
@property --tw-ordinal {
  syntax: "*";
  inherits: false;
}
@property --tw-slashed-zero {
  syntax: "*";
  inherits: false;
}
@property --tw-numeric-figure {
  syntax: "*";
  inherits: false;
}
@property --tw-numeric-spacing {
  syntax: "*";
  inherits: false;
}
@property --tw-numeric-fraction {
  syntax: "*";
  inherits: false;
}
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes countFlash {
  0% {
    background-color: rgba(168, 85, 247, 0.3);
    transform: scale(1.05);
  }
  100% {
    background-color: rgba(168, 85, 247, 0.1);
    transform: scale(1);
  }
}
@keyframes countFlashShake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(5px) scale(1.1);
  }
  75% {
    transform: translateX(-5px);
  }
  100% {
    transform: translateX(0);
  }
}
@layer properties {
  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
    *, ::before, ::after, ::backdrop {
      --tw-translate-x: 0;
      --tw-translate-y: 0;
      --tw-translate-z: 0;
      --tw-scale-x: 1;
      --tw-scale-y: 1;
      --tw-scale-z: 1;
      --tw-rotate-x: initial;
      --tw-rotate-y: initial;
      --tw-rotate-z: initial;
      --tw-skew-x: initial;
      --tw-skew-y: initial;
      --tw-space-y-reverse: 0;
      --tw-divide-y-reverse: 0;
      --tw-border-style: solid;
      --tw-leading: initial;
      --tw-font-weight: initial;
      --tw-tracking: initial;
      --tw-shadow: 0 0 #0000;
      --tw-shadow-color: initial;
      --tw-shadow-alpha: 100%;
      --tw-inset-shadow: 0 0 #0000;
      --tw-inset-shadow-color: initial;
      --tw-inset-shadow-alpha: 100%;
      --tw-ring-color: initial;
      --tw-ring-shadow: 0 0 #0000;
      --tw-inset-ring-color: initial;
      --tw-inset-ring-shadow: 0 0 #0000;
      --tw-ring-inset: initial;
      --tw-ring-offset-width: 0px;
      --tw-ring-offset-color: #fff;
      --tw-ring-offset-shadow: 0 0 #0000;
      --tw-outline-style: solid;
      --tw-blur: initial;
      --tw-brightness: initial;
      --tw-contrast: initial;
      --tw-grayscale: initial;
      --tw-hue-rotate: initial;
      --tw-invert: initial;
      --tw-opacity: initial;
      --tw-saturate: initial;
      --tw-sepia: initial;
      --tw-drop-shadow: initial;
      --tw-drop-shadow-color: initial;
      --tw-drop-shadow-alpha: 100%;
      --tw-drop-shadow-size: initial;
      --tw-backdrop-blur: initial;
      --tw-backdrop-brightness: initial;
      --tw-backdrop-contrast: initial;
      --tw-backdrop-grayscale: initial;
      --tw-backdrop-hue-rotate: initial;
      --tw-backdrop-invert: initial;
      --tw-backdrop-opacity: initial;
      --tw-backdrop-saturate: initial;
      --tw-backdrop-sepia: initial;
      --tw-duration: initial;
      --tw-ease: initial;
      --tw-content: "";
      --tw-ordinal: initial;
      --tw-slashed-zero: initial;
      --tw-numeric-figure: initial;
      --tw-numeric-spacing: initial;
      --tw-numeric-fraction: initial;
    }
  }
}
`,da=()=>{let e=document.createElement(`div`);e.id=`react-scan-root`;let t=e.attachShadow({mode:`open`}),n=document.createElement(`style`);n.textContent=ua,t.appendChild(n),document.documentElement.appendChild(e);let r=ca(e);return{shadowRoot:t,dispose:()=>{r(),e.remove()}}}}));function pa(e,t){let n=Ba[e];return typeof n==`object`?n[t]?n.$:void 0:n}function ma(e,t,n){let r=n.length,i=t.length,a=r,o=0,s=0,c=t[i-1].nextSibling,l=null;for(;o<i||s<a;){if(t[o]===n[s]){o++,s++;continue}for(;t[i-1]===n[a-1];)i--,a--;if(i===o){let t=a<r?s?n[s-1].nextSibling:n[a-s]:c;for(;s<a;)e.insertBefore(n[s++],t)}else if(a===s)for(;o<i;)(!l||!l.has(t[o]))&&t[o].remove(),o++;else if(t[o]===n[a-1]&&n[s]===t[i-1]){let r=t[--i].nextSibling;e.insertBefore(n[s++],t[o++].nextSibling),e.insertBefore(n[--a],r),t[i]=n[a]}else{if(!l){l=new Map;let e=s;for(;e<a;)l.set(n[e],e++)}let r=l.get(t[o]);if(r!=null)if(s<r&&r<a){let c=o,u=1,d;for(;++c<i&&c<a&&!((d=l.get(t[c]))==null||d!==r+u);)u++;if(u>r-s){let i=t[o];for(;s<r;)e.insertBefore(n[s++],i)}else e.replaceChild(n[s++],t[o++])}else o++;else t[o++].remove()}}}function ha(e,t,n,r={}){let i;return Ze(r=>{i=r,t===document?e():U(t,e(),t.firstChild?null:void 0,n)},r.owner),()=>{i(),t.textContent=``}}function B(e,t,n,r){let i,a=()=>{let t=r?document.createElementNS(`http://www.w3.org/1998/Math/MathML`,`template`):document.createElement(`template`);return t.innerHTML=e,n?t.content.firstChild.firstChild:r?t.firstChild:t.content.firstChild},o=t?()=>$e(()=>document.importNode(i||(i=a()),!0)):()=>(i||(i=a())).cloneNode(!0);return o.cloneNode=o,o}function ga(e,t=window.document){let n=t[Ua]||(t[Ua]=new Set);for(let r=0,i=e.length;r<i;r++){let i=e[r];n.has(i)||(n.add(i),t.addEventListener(i,Aa))}}function V(e,t,n){Ea(e)||(n==null?e.removeAttribute(t):e.setAttribute(t,n))}function _a(e,t,n,r){Ea(e)||(r==null?e.removeAttributeNS(t,n):e.setAttributeNS(t,n,r))}function va(e,t,n){Ea(e)||(n?e.setAttribute(t,``):e.removeAttribute(t))}function H(e,t){Ea(e)||(t==null?e.removeAttribute(`class`):e.className=t)}function ya(e,t,n,r){if(r)Array.isArray(n)?(e[`$$${t}`]=n[0],e[`$$${t}Data`]=n[1]):e[`$$${t}`]=n;else if(Array.isArray(n)){let r=n[0];e.addEventListener(t,n[0]=t=>r.call(e,n[1],t))}else e.addEventListener(t,n,typeof n!=`function`&&n)}function ba(e,t,n={}){let r=Object.keys(t||{}),i=Object.keys(n),a,o;for(a=0,o=i.length;a<o;a++){let r=i[a];!r||r===`undefined`||t[r]||(Oa(e,r,!1),delete n[r])}for(a=0,o=r.length;a<o;a++){let i=r[a],o=!!t[i];!i||i===`undefined`||n[i]===o||!o||(Oa(e,i,!0),n[i]=o)}return n}function xa(e,t,n){if(!t)return n?V(e,`style`):t;let r=e.style;if(typeof t==`string`)return r.cssText=t;typeof n==`string`&&(r.cssText=n=void 0),n||(n={}),t||(t={});let i,a;for(a in n)t[a]==null&&r.removeProperty(a),delete n[a];for(a in t)i=t[a],i!==n[a]&&(r.setProperty(a,i),n[a]=i);return n}function Sa(e,t,n){n==null?e.style.removeProperty(t):e.style.setProperty(t,n)}function Ca(e,t={},n,r){let i={};return r||E(()=>i.children=ja(e,t.children,i.children)),E(()=>typeof t.ref==`function`&&wa(t.ref,e)),E(()=>Ta(e,t,n,!0,i,!0)),i}function wa(e,t,n){return $e(()=>e(t,n))}function U(e,t,n,r){if(n!==void 0&&!r&&(r=[]),typeof t!=`function`)return ja(e,t,r,n);E(r=>ja(e,t(),r,n),r)}function Ta(e,t,n,r,i={},a=!1){t||(t={});for(let r in i)if(!(r in t)){if(r===`children`)continue;i[r]=ka(e,r,null,i[r],n,a,t)}for(let o in t){if(o===`children`){r||ja(e,t.children);continue}let s=t[o];i[o]=ka(e,o,s,i[o],n,a,t)}}function Ea(e){return!!M.context&&!M.done&&(!e||e.isConnected)}function Da(e){return e.toLowerCase().replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function Oa(e,t,n){let r=t.trim().split(/\s+/);for(let t=0,i=r.length;t<i;t++)e.classList.toggle(r[t],n)}function ka(e,t,n,r,i,a,o){let s,c,l,u,d;if(t===`style`)return xa(e,n,r);if(t===`classList`)return ba(e,n,r);if(n===r)return r;if(t===`ref`)a||n(e);else if(t.slice(0,3)===`on:`){let i=t.slice(3);r&&e.removeEventListener(i,r,typeof r!=`function`&&r),n&&e.addEventListener(i,n,typeof n!=`function`&&n)}else if(t.slice(0,10)===`oncapture:`){let i=t.slice(10);r&&e.removeEventListener(i,r,!0),n&&e.addEventListener(i,n,!0)}else if(t.slice(0,2)===`on`){let i=t.slice(2).toLowerCase(),a=Va.has(i);if(!a&&r){let t=Array.isArray(r)?r[0]:r;e.removeEventListener(i,t)}(a||n)&&(ya(e,i,n,a),a&&ga([i]))}else if(t.slice(0,5)===`attr:`)V(e,t.slice(5),n);else if(t.slice(0,5)===`bool:`)va(e,t.slice(5),n);else if((d=t.slice(0,5)===`prop:`)||(l=Ra.has(t))||!i&&((u=pa(t,e.tagName))||(c=La.has(t)))||(s=e.nodeName.includes(`-`)||`is`in o)){if(d)t=t.slice(5),c=!0;else if(Ea(e))return n;t===`class`||t===`className`?H(e,n):s&&!c&&!l?e[Da(t)]=n:e[u||t]=n}else{let r=i&&t.indexOf(`:`)>-1&&Ha[t.split(`:`)[0]];r?_a(e,r,t,n):V(e,za[t]||t,n)}return n}function Aa(e){if(M.registry&&M.events&&M.events.find(([t,n])=>n===e))return;let t=e.target,n=`$$${e.type}`,r=e.target,i=e.currentTarget,a=t=>Object.defineProperty(e,`target`,{configurable:!0,value:t}),o=()=>{let r=t[n];if(r&&!t.disabled){let i=t[`${n}Data`];if(i===void 0?r.call(t,e):r.call(t,i,e),e.cancelBubble)return}return t.host&&typeof t.host!=`string`&&!t.host._$host&&t.contains(e.target)&&a(t.host),!0},s=()=>{for(;o()&&(t=t._$host||t.parentNode||t.host););};if(Object.defineProperty(e,`currentTarget`,{configurable:!0,get(){return t||document}}),M.registry&&!M.done&&(M.done=_$HY.done=!0),e.composedPath){let n=e.composedPath();a(n[0]);for(let e=0;e<n.length-2&&(t=n[e],o());e++){if(t._$host){t=t._$host,s();break}if(t.parentNode===i)break}}else s();a(r)}function ja(e,t,n,r,i){let a=Ea(e);if(a){!n&&(n=[...e.childNodes]);let t=[];for(let e=0;e<n.length;e++){let r=n[e];r.nodeType===8&&r.data.slice(0,2)===`!$`?r.remove():t.push(r)}n=t}for(;typeof n==`function`;)n=n();if(t===n)return n;let o=typeof t,s=r!==void 0;if(e=s&&n[0]&&n[0].parentNode||e,o===`string`||o===`number`){if(a||o===`number`&&(t=t.toString(),t===n))return n;if(s){let i=n[0];i&&i.nodeType===3?i.data!==t&&(i.data=t):i=document.createTextNode(t),n=Pa(e,n,r,i)}else n=n!==``&&typeof n==`string`?e.firstChild.data=t:e.textContent=t}else if(t==null||o===`boolean`){if(a)return n;n=Pa(e,n,r)}else if(o===`function`)return E(()=>{let i=t();for(;typeof i==`function`;)i=i();n=ja(e,i,n,r)}),()=>n;else if(Array.isArray(t)){let o=[],c=n&&Array.isArray(n);if(Ma(o,t,n,i))return E(()=>n=ja(e,o,n,r,!0)),()=>n;if(a){if(!o.length)return n;if(r===void 0)return n=[...e.childNodes];let t=o[0];if(t.parentNode!==e)return n;let i=[t];for(;(t=t.nextSibling)!==r;)i.push(t);return n=i}if(o.length===0){if(n=Pa(e,n,r),s)return n}else c?n.length===0?Na(e,o,r):ma(e,n,o):(n&&Pa(e),Na(e,o));n=o}else if(t.nodeType){if(a&&t.parentNode)return n=s?[t]:t;if(Array.isArray(n)){if(s)return n=Pa(e,n,r,t);Pa(e,n,null,t)}else n==null||n===``||!e.firstChild?e.appendChild(t):e.replaceChild(t,e.firstChild);n=t}return n}function Ma(e,t,n,r){let i=!1;for(let a=0,o=t.length;a<o;a++){let o=t[a],s=n&&n[e.length],c;if(!(o==null||o===!0||o===!1))if((c=typeof o)==`object`&&o.nodeType)e.push(o);else if(Array.isArray(o))i=Ma(e,o,s)||i;else if(c===`function`)if(r){for(;typeof o==`function`;)o=o();i=Ma(e,Array.isArray(o)?o:[o],Array.isArray(s)?s:[s])||i}else e.push(o),i=!0;else{let t=String(o);s&&s.nodeType===3&&s.data===t?e.push(s):e.push(document.createTextNode(t))}}return i}function Na(e,t,n=null){for(let r=0,i=t.length;r<i;r++)e.insertBefore(t[r],n)}function Pa(e,t,n,r){if(n===void 0)return e.textContent=``;let i=r||document.createTextNode(``);if(t.length){let r=!1;for(let a=t.length-1;a>=0;a--){let o=t[a];if(i!==o){let t=o.parentNode===e;!r&&!a?t?e.replaceChild(i,o):e.insertBefore(i,n):t&&o.remove()}else r=!0}}else e.insertBefore(i,n);return[i]}function Fa(e,t=!1,n=void 0){return t?document.createElementNS(Wa,e):document.createElement(e,{is:n})}function Ia(e){let{useShadow:t}=e,n=document.createTextNode(``),r=()=>e.mount||document.body,i=it(),a,o=!!M.context;return D(()=>{o&&(it().user=o=!1),a||(a=at(i,()=>O(()=>e.children)));let s=r();if(s instanceof HTMLHeadElement){let[e,t]=T(!1);Ze(t=>U(s,()=>e()?t():a(),null)),k(()=>t(!0))}else{let r=Fa(e.isSVG?`g`:`div`,e.isSVG),i=t&&r.attachShadow?r.attachShadow({mode:`open`}):r;Object.defineProperty(r,`_$host`,{get(){return n.parentNode},configurable:!0}),U(i,a),s.appendChild(r),e.ref&&e.ref(r),k(()=>s.contains(r)&&s.removeChild(r))}},void 0,{render:!o}),n}var La,Ra,za,Ba,Va,Ha,W,Ua,Wa,G=r((()=>{I(),La=new Set([`className`,`value`,`readOnly`,`noValidate`,`formNoValidate`,`isMap`,`noModule`,`playsInline`,`adAuctionHeaders`,`allowFullscreen`,`browsingTopics`,`defaultChecked`,`defaultMuted`,`defaultSelected`,`disablePictureInPicture`,`disableRemotePlayback`,`preservesPitch`,`shadowRootClonable`,`shadowRootCustomElementRegistry`,`shadowRootDelegatesFocus`,`shadowRootSerializable`,`sharedStorageWritable`,...`allowfullscreen.async.alpha.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.hidden.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.adauctionheaders.browsingtopics.credentialless.defaultchecked.defaultmuted.defaultselected.defer.disablepictureinpicture.disableremoteplayback.preservespitch.shadowrootclonable.shadowrootcustomelementregistry.shadowrootdelegatesfocus.shadowrootserializable.sharedstoragewritable`.split(`.`)]),Ra=new Set([`innerHTML`,`textContent`,`innerText`,`children`]),za=Object.assign(Object.create(null),{className:`class`,htmlFor:`for`}),Ba=Object.assign(Object.create(null),{class:`className`,novalidate:{$:`noValidate`,FORM:1},formnovalidate:{$:`formNoValidate`,BUTTON:1,INPUT:1},ismap:{$:`isMap`,IMG:1},nomodule:{$:`noModule`,SCRIPT:1},playsinline:{$:`playsInline`,VIDEO:1},readonly:{$:`readOnly`,INPUT:1,TEXTAREA:1},adauctionheaders:{$:`adAuctionHeaders`,IFRAME:1},allowfullscreen:{$:`allowFullscreen`,IFRAME:1},browsingtopics:{$:`browsingTopics`,IMG:1},defaultchecked:{$:`defaultChecked`,INPUT:1},defaultmuted:{$:`defaultMuted`,AUDIO:1,VIDEO:1},defaultselected:{$:`defaultSelected`,OPTION:1},disablepictureinpicture:{$:`disablePictureInPicture`,VIDEO:1},disableremoteplayback:{$:`disableRemotePlayback`,AUDIO:1,VIDEO:1},preservespitch:{$:`preservesPitch`,AUDIO:1,VIDEO:1},shadowrootclonable:{$:`shadowRootClonable`,TEMPLATE:1},shadowrootdelegatesfocus:{$:`shadowRootDelegatesFocus`,TEMPLATE:1},shadowrootserializable:{$:`shadowRootSerializable`,TEMPLATE:1},sharedstoragewritable:{$:`sharedStorageWritable`,IFRAME:1,IMG:1}}),Va=new Set([`beforeinput`,`click`,`dblclick`,`contextmenu`,`focusin`,`focusout`,`input`,`keydown`,`keyup`,`mousedown`,`mousemove`,`mouseout`,`mouseover`,`mouseup`,`pointerdown`,`pointermove`,`pointerout`,`pointerover`,`pointerup`,`touchend`,`touchmove`,`touchstart`]),Ha={xlink:`http://www.w3.org/1999/xlink`,xml:`http://www.w3.org/XML/1998/namespace`},W=e=>O(()=>e()),Ua=`_$DX_DELEGATE`,Wa=`http://www.w3.org/2000/svg`})),Ga,K,Ka=r((()=>{G(),Ga=B(`<svg aria-hidden=true><use>`),K=e=>{let t=()=>{var t;let n=(t=e.size)==null?15:t;return Array.isArray(n)?{width:n[0],height:n[1]||n[0]}:{width:n,height:n}},n=()=>{var t;return`${(t=e.externalURL)==null?``:t}#${e.name}`};return(()=>{var r=Ga(),i=r.firstChild;return E(a=>{var o,s,c=`${t().width}px`,l=`${t().height}px`,u=(o=e.fill)==null?`currentColor`:o,d=(s=e.stroke)==null?`currentColor`:s,f=e.class,p={...e.style,"min-width":`${t().width}px`,"max-width":`${t().width}px`,"min-height":`${t().height}px`,"max-height":`${t().height}px`},m=n();return c!==a.e&&V(r,`width`,a.e=c),l!==a.t&&V(r,`height`,a.t=l),u!==a.a&&V(r,`fill`,a.a=u),d!==a.o&&V(r,`stroke`,a.o=d),f!==a.i&&V(r,`class`,a.i=f),a.n=xa(r,p,a.n),m!==a.s&&V(i,`href`,a.s=m),a},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),r})()}})),qa,Ja,Ya=r((()=>{G(),qa=B(`<svg xmlns=http://www.w3.org/2000/svg style=display:none><title>React Scan Icons</title><symbol id=icon-react-scan-logo viewBox="0 0 24 24"fill=none><circle cx=12 cy=12 r=1.7 fill=currentColor></circle><ellipse cx=12 cy=12 rx=10 ry=4.2 stroke=currentColor stroke-width=1.4></ellipse><ellipse cx=12 cy=12 rx=10 ry=4.2 stroke=currentColor stroke-width=1.4 transform="rotate(60 12 12)"></ellipse><ellipse cx=12 cy=12 rx=10 ry=4.2 stroke=currentColor stroke-width=1.4 transform="rotate(120 12 12)"></ellipse></symbol><symbol id=icon-inspect viewBox="0 0 24 24"fill=none stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"></path><path d="M5 3a2 2 0 0 0-2 2"></path><path d="M19 3a2 2 0 0 1 2 2"></path><path d="M5 21a2 2 0 0 1-2-2"></path><path d="M9 3h1"></path><path d="M9 21h2"></path><path d="M14 3h1"></path><path d="M3 9v1"></path><path d="M21 9v2"></path><path d="M3 14v1"></path></symbol><symbol id=icon-focus viewBox="0 0 24 24"fill=none stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"></path><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"></path></symbol><symbol id=icon-close viewBox="0 0 24 24"fill=none stroke-width=2 stroke-linecap=round stroke-linejoin=round><line x1=18 y1=6 x2=6 y2=18></line><line x1=6 y1=6 x2=18 y2=18></line></symbol><symbol id=icon-ellipsis viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><circle cx=12 cy=12 r=1></circle><circle cx=19 cy=12 r=1></circle><circle cx=5 cy=12 r=1></circle></symbol><symbol id=icon-copy viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><rect width=14 height=14 x=8 y=8 rx=2 ry=2></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></symbol><symbol id=icon-check viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M20 6 9 17l-5-5"></path></symbol><symbol id=icon-chevron-right viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="m9 18 6-6-6-6"></path></symbol><symbol id=icon-flame viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></symbol><symbol id=icon-function viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><rect width=18 height=18 x=3 y=3 rx=2 ry=2></rect><path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3"></path><path d="M9 11.2h5.7"></path></symbol><symbol id=icon-triangle-alert viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></symbol><symbol id=icon-search viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><circle cx=11 cy=11 r=8></circle><line x1=21 y1=21 x2=16.65 y2=16.65>`),Ja=()=>qa()}));function Xa(e){var t,n,r=``;if(typeof e==`string`||typeof e==`number`)r+=e;else if(typeof e==`object`)if(Array.isArray(e)){var i=e.length;for(t=0;t<i;t++)e[t]&&(n=Xa(e[t]))&&(r&&(r+=` `),r+=n)}else for(n in e)e[n]&&(r&&(r+=` `),r+=n);return r}function Za(){for(var e,t,n=0,r=``,i=arguments.length;n<i;n++)(e=arguments[n])&&(t=Xa(e))&&(r&&(r+=` `),r+=t);return r}var Qa=r((()=>{})),$a,eo,to,no,ro,io,ao,oo,so,co,lo,uo,fo,po,mo,ho,go,_o,vo,yo,bo,xo,So,Co,wo,To,Eo,Do,Oo,ko,Ao,jo,Mo,No,Po,Fo,Io,Lo,Ro,zo,Bo,Vo,q,Ho,Uo,Wo,Go,Ko,qo,Jo,Yo,Xo,Zo,J,Qo,$o,es,ts,ns,rs,is,Y,as,os,ss,cs,ls,us,ds,fs,ps,ms,hs,gs,_s,vs,ys,bs,xs,Ss,Cs,ws=r((()=>{$a=(e,t)=>{let n=Array(e.length+t.length);for(let t=0;t<e.length;t++)n[t]=e[t];for(let r=0;r<t.length;r++)n[e.length+r]=t[r];return n},eo=(e,t)=>({classGroupId:e,validator:t}),to=(e=new Map,t=null,n)=>({nextPart:e,validators:t,classGroupId:n}),no=`-`,ro=[],io=`arbitrary..`,ao=e=>{let t=co(e),{conflictingClassGroups:n,conflictingClassGroupModifiers:r}=e;return{getClassGroupId:e=>{if(e.startsWith(`[`)&&e.endsWith(`]`))return so(e);let n=e.split(no);return oo(n,+(n[0]===``&&n.length>1),t)},getConflictingClassGroupIds:(e,t)=>{if(t){let t=r[e],i=n[e];return t?i?$a(i,t):t:i||ro}return n[e]||ro}}},oo=(e,t,n)=>{if(e.length-t===0)return n.classGroupId;let r=e[t],i=n.nextPart.get(r);if(i){let n=oo(e,t+1,i);if(n)return n}let a=n.validators;if(a===null)return;let o=t===0?e.join(no):e.slice(t).join(no),s=a.length;for(let e=0;e<s;e++){let t=a[e];if(t.validator(o))return t.classGroupId}},so=e=>e.slice(1,-1).indexOf(`:`)===-1?void 0:(()=>{let t=e.slice(1,-1),n=t.indexOf(`:`),r=t.slice(0,n);return r?io+r:void 0})(),co=e=>{let{theme:t,classGroups:n}=e;return lo(n,t)},lo=(e,t)=>{let n=to();for(let r in e){let i=e[r];uo(i,n,r,t)}return n},uo=(e,t,n,r)=>{let i=e.length;for(let a=0;a<i;a++){let i=e[a];fo(i,t,n,r)}},fo=(e,t,n,r)=>{if(typeof e==`string`){po(e,t,n);return}if(typeof e==`function`){mo(e,t,n,r);return}ho(e,t,n,r)},po=(e,t,n)=>{let r=e===``?t:go(t,e);r.classGroupId=n},mo=(e,t,n,r)=>{if(_o(e)){uo(e(r),t,n,r);return}t.validators===null&&(t.validators=[]),t.validators.push(eo(n,e))},ho=(e,t,n,r)=>{let i=Object.entries(e),a=i.length;for(let e=0;e<a;e++){let[a,o]=i[e];uo(o,go(t,a),n,r)}},go=(e,t)=>{let n=e,r=t.split(no),i=r.length;for(let e=0;e<i;e++){let t=r[e],i=n.nextPart.get(t);i||(i=to(),n.nextPart.set(t,i)),n=i}return n},_o=e=>`isThemeGetter`in e&&e.isThemeGetter===!0,vo=e=>{if(e<1)return{get:()=>void 0,set:()=>{}};let t=0,n=Object.create(null),r=Object.create(null),i=(i,a)=>{n[i]=a,t++,t>e&&(t=0,r=n,n=Object.create(null))};return{get(e){let t=n[e];if(t!==void 0)return t;if((t=r[e])!==void 0)return i(e,t),t},set(e,t){e in n?n[e]=t:i(e,t)}}},yo=`!`,bo=`:`,xo=[],So=(e,t,n,r,i)=>({modifiers:e,hasImportantModifier:t,baseClassName:n,maybePostfixModifierPosition:r,isExternal:i}),Co=e=>{let{prefix:t,experimentalParseClassName:n}=e,r=e=>{let t=[],n=0,r=0,i=0,a,o=e.length;for(let s=0;s<o;s++){let o=e[s];if(n===0&&r===0){if(o===bo){t.push(e.slice(i,s)),i=s+1;continue}if(o===`/`){a=s;continue}}o===`[`?n++:o===`]`?n--:o===`(`?r++:o===`)`&&r--}let s=t.length===0?e:e.slice(i),c=s,l=!1;s.endsWith(yo)?(c=s.slice(0,-1),l=!0):s.startsWith(yo)&&(c=s.slice(1),l=!0);let u=a&&a>i?a-i:void 0;return So(t,l,c,u)};if(t){let e=t+bo,n=r;r=t=>t.startsWith(e)?n(t.slice(e.length)):So(xo,!1,t,void 0,!0)}if(n){let e=r;r=t=>n({className:t,parseClassName:e})}return r},wo=e=>{let t=new Map;return e.orderSensitiveModifiers.forEach((e,n)=>{t.set(e,1e6+n)}),e=>{let n=[],r=[];for(let i=0;i<e.length;i++){let a=e[i],o=a[0]===`[`,s=t.has(a);o||s?(r.length>0&&(r.sort(),n.push(...r),r=[]),n.push(a)):r.push(a)}return r.length>0&&(r.sort(),n.push(...r)),n}},To=e=>({cache:vo(e.cacheSize),parseClassName:Co(e),sortModifiers:wo(e),...ao(e)}),Eo=/\s+/,Do=(e,t)=>{let{parseClassName:n,getClassGroupId:r,getConflictingClassGroupIds:i,sortModifiers:a}=t,o=[],s=e.trim().split(Eo),c=``;for(let e=s.length-1;e>=0;--e){let t=s[e],{isExternal:l,modifiers:u,hasImportantModifier:d,baseClassName:f,maybePostfixModifierPosition:p}=n(t);if(l){c=t+(c.length>0?` `+c:c);continue}let m=!!p,h=r(m?f.substring(0,p):f);if(!h){if(!m){c=t+(c.length>0?` `+c:c);continue}if(h=r(f),!h){c=t+(c.length>0?` `+c:c);continue}m=!1}let g=u.length===0?``:u.length===1?u[0]:a(u).join(`:`),_=d?g+yo:g,v=_+h;if(o.indexOf(v)>-1)continue;o.push(v);let y=i(h,m);for(let e=0;e<y.length;++e){let t=y[e];o.push(_+t)}c=t+(c.length>0?` `+c:c)}return c},Oo=(...e)=>{let t=0,n,r,i=``;for(;t<e.length;)(n=e[t++])&&(r=ko(n))&&(i&&(i+=` `),i+=r);return i},ko=e=>{if(typeof e==`string`)return e;let t,n=``;for(let r=0;r<e.length;r++)e[r]&&(t=ko(e[r]))&&(n&&(n+=` `),n+=t);return n},Ao=(e,...t)=>{let n,r,i,a,o=o=>(n=To(t.reduce((e,t)=>t(e),e())),r=n.cache.get,i=n.cache.set,a=s,s(o)),s=e=>{let t=r(e);if(t)return t;let a=Do(e,n);return i(e,a),a};return a=o,(...e)=>a(Oo(...e))},jo=[],Mo=e=>{let t=t=>t[e]||jo;return t.isThemeGetter=!0,t},No=/^\[(?:(\w[\w-]*):)?(.+)\]$/i,Po=/^\((?:(\w[\w-]*):)?(.+)\)$/i,Fo=/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,Io=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,Lo=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,Ro=/^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,zo=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Bo=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,Vo=e=>Fo.test(e),q=e=>!!e&&!Number.isNaN(Number(e)),Ho=e=>!!e&&Number.isInteger(Number(e)),Uo=e=>e.endsWith(`%`)&&q(e.slice(0,-1)),Wo=e=>Io.test(e),Go=()=>!0,Ko=e=>Lo.test(e)&&!Ro.test(e),qo=()=>!1,Jo=e=>zo.test(e),Yo=e=>Bo.test(e),Xo=e=>!J(e)&&!Y(e),Zo=e=>fs(e,gs,qo),J=e=>No.test(e),Qo=e=>fs(e,_s,Ko),$o=e=>fs(e,vs,q),es=e=>fs(e,bs,Go),ts=e=>fs(e,ys,qo),ns=e=>fs(e,ms,qo),rs=e=>fs(e,hs,Yo),is=e=>fs(e,xs,Jo),Y=e=>Po.test(e),as=e=>ps(e,_s),os=e=>ps(e,ys),ss=e=>ps(e,ms),cs=e=>ps(e,gs),ls=e=>ps(e,hs),us=e=>ps(e,xs,!0),ds=e=>ps(e,bs,!0),fs=(e,t,n)=>{let r=No.exec(e);return r?r[1]?t(r[1]):n(r[2]):!1},ps=(e,t,n=!1)=>{let r=Po.exec(e);return r?r[1]?t(r[1]):n:!1},ms=e=>e===`position`||e===`percentage`,hs=e=>e===`image`||e===`url`,gs=e=>e===`length`||e===`size`||e===`bg-size`,_s=e=>e===`length`,vs=e=>e===`number`,ys=e=>e===`family-name`,bs=e=>e===`number`||e===`weight`,xs=e=>e===`shadow`,Ss=()=>{let e=Mo(`color`),t=Mo(`font`),n=Mo(`text`),r=Mo(`font-weight`),i=Mo(`tracking`),a=Mo(`leading`),o=Mo(`breakpoint`),s=Mo(`container`),c=Mo(`spacing`),l=Mo(`radius`),u=Mo(`shadow`),d=Mo(`inset-shadow`),f=Mo(`text-shadow`),p=Mo(`drop-shadow`),m=Mo(`blur`),h=Mo(`perspective`),g=Mo(`aspect`),_=Mo(`ease`),v=Mo(`animate`),y=()=>[`auto`,`avoid`,`all`,`avoid-page`,`page`,`left`,`right`,`column`],b=()=>[`center`,`top`,`bottom`,`left`,`right`,`top-left`,`left-top`,`top-right`,`right-top`,`bottom-right`,`right-bottom`,`bottom-left`,`left-bottom`],ee=()=>[...b(),Y,J],te=()=>[`auto`,`hidden`,`clip`,`visible`,`scroll`],ne=()=>[`auto`,`contain`,`none`],x=()=>[Y,J,c],S=()=>[Vo,`full`,`auto`,...x()],re=()=>[Ho,`none`,`subgrid`,Y,J],ie=()=>[`auto`,{span:[`full`,Ho,Y,J]},Ho,Y,J],ae=()=>[Ho,`auto`,Y,J],oe=()=>[`auto`,`min`,`max`,`fr`,Y,J],se=()=>[`start`,`end`,`center`,`between`,`around`,`evenly`,`stretch`,`baseline`,`center-safe`,`end-safe`],ce=()=>[`start`,`end`,`center`,`stretch`,`center-safe`,`end-safe`],le=()=>[`auto`,...x()],ue=()=>[Vo,`auto`,`full`,`dvw`,`dvh`,`lvw`,`lvh`,`svw`,`svh`,`min`,`max`,`fit`,...x()],de=()=>[Vo,`screen`,`full`,`dvw`,`lvw`,`svw`,`min`,`max`,`fit`,...x()],fe=()=>[Vo,`screen`,`full`,`lh`,`dvh`,`lvh`,`svh`,`min`,`max`,`fit`,...x()],C=()=>[e,Y,J],pe=()=>[...b(),ss,ns,{position:[Y,J]}],me=()=>[`no-repeat`,{repeat:[``,`x`,`y`,`space`,`round`]}],he=()=>[`auto`,`cover`,`contain`,cs,Zo,{size:[Y,J]}],ge=()=>[Uo,as,Qo],w=()=>[``,`none`,`full`,l,Y,J],_e=()=>[``,q,as,Qo],ve=()=>[`solid`,`dashed`,`dotted`,`double`],ye=()=>[`normal`,`multiply`,`screen`,`overlay`,`darken`,`lighten`,`color-dodge`,`color-burn`,`hard-light`,`soft-light`,`difference`,`exclusion`,`hue`,`saturation`,`color`,`luminosity`],be=()=>[q,Uo,ss,ns],xe=()=>[``,`none`,m,Y,J],Se=()=>[`none`,q,Y,J],Ce=()=>[`none`,q,Y,J],we=()=>[q,Y,J],Te=()=>[Vo,`full`,...x()];return{cacheSize:500,theme:{animate:[`spin`,`ping`,`pulse`,`bounce`],aspect:[`video`],blur:[Wo],breakpoint:[Wo],color:[Go],container:[Wo],"drop-shadow":[Wo],ease:[`in`,`out`,`in-out`],font:[Xo],"font-weight":[`thin`,`extralight`,`light`,`normal`,`medium`,`semibold`,`bold`,`extrabold`,`black`],"inset-shadow":[Wo],leading:[`none`,`tight`,`snug`,`normal`,`relaxed`,`loose`],perspective:[`dramatic`,`near`,`normal`,`midrange`,`distant`,`none`],radius:[Wo],shadow:[Wo],spacing:[`px`,q],text:[Wo],"text-shadow":[Wo],tracking:[`tighter`,`tight`,`normal`,`wide`,`wider`,`widest`]},classGroups:{aspect:[{aspect:[`auto`,`square`,Vo,J,Y,g]}],container:[`container`],columns:[{columns:[q,J,Y,s]}],"break-after":[{"break-after":y()}],"break-before":[{"break-before":y()}],"break-inside":[{"break-inside":[`auto`,`avoid`,`avoid-page`,`avoid-column`]}],"box-decoration":[{"box-decoration":[`slice`,`clone`]}],box:[{box:[`border`,`content`]}],display:[`block`,`inline-block`,`inline`,`flex`,`inline-flex`,`table`,`inline-table`,`table-caption`,`table-cell`,`table-column`,`table-column-group`,`table-footer-group`,`table-header-group`,`table-row-group`,`table-row`,`flow-root`,`grid`,`inline-grid`,`contents`,`list-item`,`hidden`],sr:[`sr-only`,`not-sr-only`],float:[{float:[`right`,`left`,`none`,`start`,`end`]}],clear:[{clear:[`left`,`right`,`both`,`none`,`start`,`end`]}],isolation:[`isolate`,`isolation-auto`],"object-fit":[{object:[`contain`,`cover`,`fill`,`none`,`scale-down`]}],"object-position":[{object:ee()}],overflow:[{overflow:te()}],"overflow-x":[{"overflow-x":te()}],"overflow-y":[{"overflow-y":te()}],overscroll:[{overscroll:ne()}],"overscroll-x":[{"overscroll-x":ne()}],"overscroll-y":[{"overscroll-y":ne()}],position:[`static`,`fixed`,`absolute`,`relative`,`sticky`],inset:[{inset:S()}],"inset-x":[{"inset-x":S()}],"inset-y":[{"inset-y":S()}],start:[{"inset-s":S(),start:S()}],end:[{"inset-e":S(),end:S()}],"inset-bs":[{"inset-bs":S()}],"inset-be":[{"inset-be":S()}],top:[{top:S()}],right:[{right:S()}],bottom:[{bottom:S()}],left:[{left:S()}],visibility:[`visible`,`invisible`,`collapse`],z:[{z:[Ho,`auto`,Y,J]}],basis:[{basis:[Vo,`full`,`auto`,s,...x()]}],"flex-direction":[{flex:[`row`,`row-reverse`,`col`,`col-reverse`]}],"flex-wrap":[{flex:[`nowrap`,`wrap`,`wrap-reverse`]}],flex:[{flex:[q,Vo,`auto`,`initial`,`none`,J]}],grow:[{grow:[``,q,Y,J]}],shrink:[{shrink:[``,q,Y,J]}],order:[{order:[Ho,`first`,`last`,`none`,Y,J]}],"grid-cols":[{"grid-cols":re()}],"col-start-end":[{col:ie()}],"col-start":[{"col-start":ae()}],"col-end":[{"col-end":ae()}],"grid-rows":[{"grid-rows":re()}],"row-start-end":[{row:ie()}],"row-start":[{"row-start":ae()}],"row-end":[{"row-end":ae()}],"grid-flow":[{"grid-flow":[`row`,`col`,`dense`,`row-dense`,`col-dense`]}],"auto-cols":[{"auto-cols":oe()}],"auto-rows":[{"auto-rows":oe()}],gap:[{gap:x()}],"gap-x":[{"gap-x":x()}],"gap-y":[{"gap-y":x()}],"justify-content":[{justify:[...se(),`normal`]}],"justify-items":[{"justify-items":[...ce(),`normal`]}],"justify-self":[{"justify-self":[`auto`,...ce()]}],"align-content":[{content:[`normal`,...se()]}],"align-items":[{items:[...ce(),{baseline:[``,`last`]}]}],"align-self":[{self:[`auto`,...ce(),{baseline:[``,`last`]}]}],"place-content":[{"place-content":se()}],"place-items":[{"place-items":[...ce(),`baseline`]}],"place-self":[{"place-self":[`auto`,...ce()]}],p:[{p:x()}],px:[{px:x()}],py:[{py:x()}],ps:[{ps:x()}],pe:[{pe:x()}],pbs:[{pbs:x()}],pbe:[{pbe:x()}],pt:[{pt:x()}],pr:[{pr:x()}],pb:[{pb:x()}],pl:[{pl:x()}],m:[{m:le()}],mx:[{mx:le()}],my:[{my:le()}],ms:[{ms:le()}],me:[{me:le()}],mbs:[{mbs:le()}],mbe:[{mbe:le()}],mt:[{mt:le()}],mr:[{mr:le()}],mb:[{mb:le()}],ml:[{ml:le()}],"space-x":[{"space-x":x()}],"space-x-reverse":[`space-x-reverse`],"space-y":[{"space-y":x()}],"space-y-reverse":[`space-y-reverse`],size:[{size:ue()}],"inline-size":[{inline:[`auto`,...de()]}],"min-inline-size":[{"min-inline":[`auto`,...de()]}],"max-inline-size":[{"max-inline":[`none`,...de()]}],"block-size":[{block:[`auto`,...fe()]}],"min-block-size":[{"min-block":[`auto`,...fe()]}],"max-block-size":[{"max-block":[`none`,...fe()]}],w:[{w:[s,`screen`,...ue()]}],"min-w":[{"min-w":[s,`screen`,`none`,...ue()]}],"max-w":[{"max-w":[s,`screen`,`none`,`prose`,{screen:[o]},...ue()]}],h:[{h:[`screen`,`lh`,...ue()]}],"min-h":[{"min-h":[`screen`,`lh`,`none`,...ue()]}],"max-h":[{"max-h":[`screen`,`lh`,...ue()]}],"font-size":[{text:[`base`,n,as,Qo]}],"font-smoothing":[`antialiased`,`subpixel-antialiased`],"font-style":[`italic`,`not-italic`],"font-weight":[{font:[r,ds,es]}],"font-stretch":[{"font-stretch":[`ultra-condensed`,`extra-condensed`,`condensed`,`semi-condensed`,`normal`,`semi-expanded`,`expanded`,`extra-expanded`,`ultra-expanded`,Uo,J]}],"font-family":[{font:[os,ts,t]}],"font-features":[{"font-features":[J]}],"fvn-normal":[`normal-nums`],"fvn-ordinal":[`ordinal`],"fvn-slashed-zero":[`slashed-zero`],"fvn-figure":[`lining-nums`,`oldstyle-nums`],"fvn-spacing":[`proportional-nums`,`tabular-nums`],"fvn-fraction":[`diagonal-fractions`,`stacked-fractions`],tracking:[{tracking:[i,Y,J]}],"line-clamp":[{"line-clamp":[q,`none`,Y,$o]}],leading:[{leading:[a,...x()]}],"list-image":[{"list-image":[`none`,Y,J]}],"list-style-position":[{list:[`inside`,`outside`]}],"list-style-type":[{list:[`disc`,`decimal`,`none`,Y,J]}],"text-alignment":[{text:[`left`,`center`,`right`,`justify`,`start`,`end`]}],"placeholder-color":[{placeholder:C()}],"text-color":[{text:C()}],"text-decoration":[`underline`,`overline`,`line-through`,`no-underline`],"text-decoration-style":[{decoration:[...ve(),`wavy`]}],"text-decoration-thickness":[{decoration:[q,`from-font`,`auto`,Y,Qo]}],"text-decoration-color":[{decoration:C()}],"underline-offset":[{"underline-offset":[q,`auto`,Y,J]}],"text-transform":[`uppercase`,`lowercase`,`capitalize`,`normal-case`],"text-overflow":[`truncate`,`text-ellipsis`,`text-clip`],"text-wrap":[{text:[`wrap`,`nowrap`,`balance`,`pretty`]}],indent:[{indent:x()}],"vertical-align":[{align:[`baseline`,`top`,`middle`,`bottom`,`text-top`,`text-bottom`,`sub`,`super`,Y,J]}],whitespace:[{whitespace:[`normal`,`nowrap`,`pre`,`pre-line`,`pre-wrap`,`break-spaces`]}],break:[{break:[`normal`,`words`,`all`,`keep`]}],wrap:[{wrap:[`break-word`,`anywhere`,`normal`]}],hyphens:[{hyphens:[`none`,`manual`,`auto`]}],content:[{content:[`none`,Y,J]}],"bg-attachment":[{bg:[`fixed`,`local`,`scroll`]}],"bg-clip":[{"bg-clip":[`border`,`padding`,`content`,`text`]}],"bg-origin":[{"bg-origin":[`border`,`padding`,`content`]}],"bg-position":[{bg:pe()}],"bg-repeat":[{bg:me()}],"bg-size":[{bg:he()}],"bg-image":[{bg:[`none`,{linear:[{to:[`t`,`tr`,`r`,`br`,`b`,`bl`,`l`,`tl`]},Ho,Y,J],radial:[``,Y,J],conic:[Ho,Y,J]},ls,rs]}],"bg-color":[{bg:C()}],"gradient-from-pos":[{from:ge()}],"gradient-via-pos":[{via:ge()}],"gradient-to-pos":[{to:ge()}],"gradient-from":[{from:C()}],"gradient-via":[{via:C()}],"gradient-to":[{to:C()}],rounded:[{rounded:w()}],"rounded-s":[{"rounded-s":w()}],"rounded-e":[{"rounded-e":w()}],"rounded-t":[{"rounded-t":w()}],"rounded-r":[{"rounded-r":w()}],"rounded-b":[{"rounded-b":w()}],"rounded-l":[{"rounded-l":w()}],"rounded-ss":[{"rounded-ss":w()}],"rounded-se":[{"rounded-se":w()}],"rounded-ee":[{"rounded-ee":w()}],"rounded-es":[{"rounded-es":w()}],"rounded-tl":[{"rounded-tl":w()}],"rounded-tr":[{"rounded-tr":w()}],"rounded-br":[{"rounded-br":w()}],"rounded-bl":[{"rounded-bl":w()}],"border-w":[{border:_e()}],"border-w-x":[{"border-x":_e()}],"border-w-y":[{"border-y":_e()}],"border-w-s":[{"border-s":_e()}],"border-w-e":[{"border-e":_e()}],"border-w-bs":[{"border-bs":_e()}],"border-w-be":[{"border-be":_e()}],"border-w-t":[{"border-t":_e()}],"border-w-r":[{"border-r":_e()}],"border-w-b":[{"border-b":_e()}],"border-w-l":[{"border-l":_e()}],"divide-x":[{"divide-x":_e()}],"divide-x-reverse":[`divide-x-reverse`],"divide-y":[{"divide-y":_e()}],"divide-y-reverse":[`divide-y-reverse`],"border-style":[{border:[...ve(),`hidden`,`none`]}],"divide-style":[{divide:[...ve(),`hidden`,`none`]}],"border-color":[{border:C()}],"border-color-x":[{"border-x":C()}],"border-color-y":[{"border-y":C()}],"border-color-s":[{"border-s":C()}],"border-color-e":[{"border-e":C()}],"border-color-bs":[{"border-bs":C()}],"border-color-be":[{"border-be":C()}],"border-color-t":[{"border-t":C()}],"border-color-r":[{"border-r":C()}],"border-color-b":[{"border-b":C()}],"border-color-l":[{"border-l":C()}],"divide-color":[{divide:C()}],"outline-style":[{outline:[...ve(),`none`,`hidden`]}],"outline-offset":[{"outline-offset":[q,Y,J]}],"outline-w":[{outline:[``,q,as,Qo]}],"outline-color":[{outline:C()}],shadow:[{shadow:[``,`none`,u,us,is]}],"shadow-color":[{shadow:C()}],"inset-shadow":[{"inset-shadow":[`none`,d,us,is]}],"inset-shadow-color":[{"inset-shadow":C()}],"ring-w":[{ring:_e()}],"ring-w-inset":[`ring-inset`],"ring-color":[{ring:C()}],"ring-offset-w":[{"ring-offset":[q,Qo]}],"ring-offset-color":[{"ring-offset":C()}],"inset-ring-w":[{"inset-ring":_e()}],"inset-ring-color":[{"inset-ring":C()}],"text-shadow":[{"text-shadow":[`none`,f,us,is]}],"text-shadow-color":[{"text-shadow":C()}],opacity:[{opacity:[q,Y,J]}],"mix-blend":[{"mix-blend":[...ye(),`plus-darker`,`plus-lighter`]}],"bg-blend":[{"bg-blend":ye()}],"mask-clip":[{"mask-clip":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]},`mask-no-clip`],"mask-composite":[{mask:[`add`,`subtract`,`intersect`,`exclude`]}],"mask-image-linear-pos":[{"mask-linear":[q]}],"mask-image-linear-from-pos":[{"mask-linear-from":be()}],"mask-image-linear-to-pos":[{"mask-linear-to":be()}],"mask-image-linear-from-color":[{"mask-linear-from":C()}],"mask-image-linear-to-color":[{"mask-linear-to":C()}],"mask-image-t-from-pos":[{"mask-t-from":be()}],"mask-image-t-to-pos":[{"mask-t-to":be()}],"mask-image-t-from-color":[{"mask-t-from":C()}],"mask-image-t-to-color":[{"mask-t-to":C()}],"mask-image-r-from-pos":[{"mask-r-from":be()}],"mask-image-r-to-pos":[{"mask-r-to":be()}],"mask-image-r-from-color":[{"mask-r-from":C()}],"mask-image-r-to-color":[{"mask-r-to":C()}],"mask-image-b-from-pos":[{"mask-b-from":be()}],"mask-image-b-to-pos":[{"mask-b-to":be()}],"mask-image-b-from-color":[{"mask-b-from":C()}],"mask-image-b-to-color":[{"mask-b-to":C()}],"mask-image-l-from-pos":[{"mask-l-from":be()}],"mask-image-l-to-pos":[{"mask-l-to":be()}],"mask-image-l-from-color":[{"mask-l-from":C()}],"mask-image-l-to-color":[{"mask-l-to":C()}],"mask-image-x-from-pos":[{"mask-x-from":be()}],"mask-image-x-to-pos":[{"mask-x-to":be()}],"mask-image-x-from-color":[{"mask-x-from":C()}],"mask-image-x-to-color":[{"mask-x-to":C()}],"mask-image-y-from-pos":[{"mask-y-from":be()}],"mask-image-y-to-pos":[{"mask-y-to":be()}],"mask-image-y-from-color":[{"mask-y-from":C()}],"mask-image-y-to-color":[{"mask-y-to":C()}],"mask-image-radial":[{"mask-radial":[Y,J]}],"mask-image-radial-from-pos":[{"mask-radial-from":be()}],"mask-image-radial-to-pos":[{"mask-radial-to":be()}],"mask-image-radial-from-color":[{"mask-radial-from":C()}],"mask-image-radial-to-color":[{"mask-radial-to":C()}],"mask-image-radial-shape":[{"mask-radial":[`circle`,`ellipse`]}],"mask-image-radial-size":[{"mask-radial":[{closest:[`side`,`corner`],farthest:[`side`,`corner`]}]}],"mask-image-radial-pos":[{"mask-radial-at":b()}],"mask-image-conic-pos":[{"mask-conic":[q]}],"mask-image-conic-from-pos":[{"mask-conic-from":be()}],"mask-image-conic-to-pos":[{"mask-conic-to":be()}],"mask-image-conic-from-color":[{"mask-conic-from":C()}],"mask-image-conic-to-color":[{"mask-conic-to":C()}],"mask-mode":[{mask:[`alpha`,`luminance`,`match`]}],"mask-origin":[{"mask-origin":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]}],"mask-position":[{mask:pe()}],"mask-repeat":[{mask:me()}],"mask-size":[{mask:he()}],"mask-type":[{"mask-type":[`alpha`,`luminance`]}],"mask-image":[{mask:[`none`,Y,J]}],filter:[{filter:[``,`none`,Y,J]}],blur:[{blur:xe()}],brightness:[{brightness:[q,Y,J]}],contrast:[{contrast:[q,Y,J]}],"drop-shadow":[{"drop-shadow":[``,`none`,p,us,is]}],"drop-shadow-color":[{"drop-shadow":C()}],grayscale:[{grayscale:[``,q,Y,J]}],"hue-rotate":[{"hue-rotate":[q,Y,J]}],invert:[{invert:[``,q,Y,J]}],saturate:[{saturate:[q,Y,J]}],sepia:[{sepia:[``,q,Y,J]}],"backdrop-filter":[{"backdrop-filter":[``,`none`,Y,J]}],"backdrop-blur":[{"backdrop-blur":xe()}],"backdrop-brightness":[{"backdrop-brightness":[q,Y,J]}],"backdrop-contrast":[{"backdrop-contrast":[q,Y,J]}],"backdrop-grayscale":[{"backdrop-grayscale":[``,q,Y,J]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[q,Y,J]}],"backdrop-invert":[{"backdrop-invert":[``,q,Y,J]}],"backdrop-opacity":[{"backdrop-opacity":[q,Y,J]}],"backdrop-saturate":[{"backdrop-saturate":[q,Y,J]}],"backdrop-sepia":[{"backdrop-sepia":[``,q,Y,J]}],"border-collapse":[{border:[`collapse`,`separate`]}],"border-spacing":[{"border-spacing":x()}],"border-spacing-x":[{"border-spacing-x":x()}],"border-spacing-y":[{"border-spacing-y":x()}],"table-layout":[{table:[`auto`,`fixed`]}],caption:[{caption:[`top`,`bottom`]}],transition:[{transition:[``,`all`,`colors`,`opacity`,`shadow`,`transform`,`none`,Y,J]}],"transition-behavior":[{transition:[`normal`,`discrete`]}],duration:[{duration:[q,`initial`,Y,J]}],ease:[{ease:[`linear`,`initial`,_,Y,J]}],delay:[{delay:[q,Y,J]}],animate:[{animate:[`none`,v,Y,J]}],backface:[{backface:[`hidden`,`visible`]}],perspective:[{perspective:[h,Y,J]}],"perspective-origin":[{"perspective-origin":ee()}],rotate:[{rotate:Se()}],"rotate-x":[{"rotate-x":Se()}],"rotate-y":[{"rotate-y":Se()}],"rotate-z":[{"rotate-z":Se()}],scale:[{scale:Ce()}],"scale-x":[{"scale-x":Ce()}],"scale-y":[{"scale-y":Ce()}],"scale-z":[{"scale-z":Ce()}],"scale-3d":[`scale-3d`],skew:[{skew:we()}],"skew-x":[{"skew-x":we()}],"skew-y":[{"skew-y":we()}],transform:[{transform:[Y,J,``,`none`,`gpu`,`cpu`]}],"transform-origin":[{origin:ee()}],"transform-style":[{transform:[`3d`,`flat`]}],translate:[{translate:Te()}],"translate-x":[{"translate-x":Te()}],"translate-y":[{"translate-y":Te()}],"translate-z":[{"translate-z":Te()}],"translate-none":[`translate-none`],accent:[{accent:C()}],appearance:[{appearance:[`none`,`auto`]}],"caret-color":[{caret:C()}],"color-scheme":[{scheme:[`normal`,`dark`,`light`,`light-dark`,`only-dark`,`only-light`]}],cursor:[{cursor:[`auto`,`default`,`pointer`,`wait`,`text`,`move`,`help`,`not-allowed`,`none`,`context-menu`,`progress`,`cell`,`crosshair`,`vertical-text`,`alias`,`copy`,`no-drop`,`grab`,`grabbing`,`all-scroll`,`col-resize`,`row-resize`,`n-resize`,`e-resize`,`s-resize`,`w-resize`,`ne-resize`,`nw-resize`,`se-resize`,`sw-resize`,`ew-resize`,`ns-resize`,`nesw-resize`,`nwse-resize`,`zoom-in`,`zoom-out`,Y,J]}],"field-sizing":[{"field-sizing":[`fixed`,`content`]}],"pointer-events":[{"pointer-events":[`auto`,`none`]}],resize:[{resize:[`none`,``,`y`,`x`]}],"scroll-behavior":[{scroll:[`auto`,`smooth`]}],"scroll-m":[{"scroll-m":x()}],"scroll-mx":[{"scroll-mx":x()}],"scroll-my":[{"scroll-my":x()}],"scroll-ms":[{"scroll-ms":x()}],"scroll-me":[{"scroll-me":x()}],"scroll-mbs":[{"scroll-mbs":x()}],"scroll-mbe":[{"scroll-mbe":x()}],"scroll-mt":[{"scroll-mt":x()}],"scroll-mr":[{"scroll-mr":x()}],"scroll-mb":[{"scroll-mb":x()}],"scroll-ml":[{"scroll-ml":x()}],"scroll-p":[{"scroll-p":x()}],"scroll-px":[{"scroll-px":x()}],"scroll-py":[{"scroll-py":x()}],"scroll-ps":[{"scroll-ps":x()}],"scroll-pe":[{"scroll-pe":x()}],"scroll-pbs":[{"scroll-pbs":x()}],"scroll-pbe":[{"scroll-pbe":x()}],"scroll-pt":[{"scroll-pt":x()}],"scroll-pr":[{"scroll-pr":x()}],"scroll-pb":[{"scroll-pb":x()}],"scroll-pl":[{"scroll-pl":x()}],"snap-align":[{snap:[`start`,`end`,`center`,`align-none`]}],"snap-stop":[{snap:[`normal`,`always`]}],"snap-type":[{snap:[`none`,`x`,`y`,`both`]}],"snap-strictness":[{snap:[`mandatory`,`proximity`]}],touch:[{touch:[`auto`,`none`,`manipulation`]}],"touch-x":[{"touch-pan":[`x`,`left`,`right`]}],"touch-y":[{"touch-pan":[`y`,`up`,`down`]}],"touch-pz":[`touch-pinch-zoom`],select:[{select:[`none`,`text`,`all`,`auto`]}],"will-change":[{"will-change":[`auto`,`scroll`,`contents`,`transform`,Y,J]}],fill:[{fill:[`none`,...C()]}],"stroke-w":[{stroke:[q,as,Qo,$o]}],stroke:[{stroke:[`none`,...C()]}],"forced-color-adjust":[{"forced-color-adjust":[`auto`,`none`]}]},conflictingClassGroups:{overflow:[`overflow-x`,`overflow-y`],overscroll:[`overscroll-x`,`overscroll-y`],inset:[`inset-x`,`inset-y`,`inset-bs`,`inset-be`,`start`,`end`,`top`,`right`,`bottom`,`left`],"inset-x":[`right`,`left`],"inset-y":[`top`,`bottom`],flex:[`basis`,`grow`,`shrink`],gap:[`gap-x`,`gap-y`],p:[`px`,`py`,`ps`,`pe`,`pbs`,`pbe`,`pt`,`pr`,`pb`,`pl`],px:[`pr`,`pl`],py:[`pt`,`pb`],m:[`mx`,`my`,`ms`,`me`,`mbs`,`mbe`,`mt`,`mr`,`mb`,`ml`],mx:[`mr`,`ml`],my:[`mt`,`mb`],size:[`w`,`h`],"font-size":[`leading`],"fvn-normal":[`fvn-ordinal`,`fvn-slashed-zero`,`fvn-figure`,`fvn-spacing`,`fvn-fraction`],"fvn-ordinal":[`fvn-normal`],"fvn-slashed-zero":[`fvn-normal`],"fvn-figure":[`fvn-normal`],"fvn-spacing":[`fvn-normal`],"fvn-fraction":[`fvn-normal`],"line-clamp":[`display`,`overflow`],rounded:[`rounded-s`,`rounded-e`,`rounded-t`,`rounded-r`,`rounded-b`,`rounded-l`,`rounded-ss`,`rounded-se`,`rounded-ee`,`rounded-es`,`rounded-tl`,`rounded-tr`,`rounded-br`,`rounded-bl`],"rounded-s":[`rounded-ss`,`rounded-es`],"rounded-e":[`rounded-se`,`rounded-ee`],"rounded-t":[`rounded-tl`,`rounded-tr`],"rounded-r":[`rounded-tr`,`rounded-br`],"rounded-b":[`rounded-br`,`rounded-bl`],"rounded-l":[`rounded-tl`,`rounded-bl`],"border-spacing":[`border-spacing-x`,`border-spacing-y`],"border-w":[`border-w-x`,`border-w-y`,`border-w-s`,`border-w-e`,`border-w-bs`,`border-w-be`,`border-w-t`,`border-w-r`,`border-w-b`,`border-w-l`],"border-w-x":[`border-w-r`,`border-w-l`],"border-w-y":[`border-w-t`,`border-w-b`],"border-color":[`border-color-x`,`border-color-y`,`border-color-s`,`border-color-e`,`border-color-bs`,`border-color-be`,`border-color-t`,`border-color-r`,`border-color-b`,`border-color-l`],"border-color-x":[`border-color-r`,`border-color-l`],"border-color-y":[`border-color-t`,`border-color-b`],translate:[`translate-x`,`translate-y`,`translate-none`],"translate-none":[`translate`,`translate-x`,`translate-y`,`translate-z`],"scroll-m":[`scroll-mx`,`scroll-my`,`scroll-ms`,`scroll-me`,`scroll-mbs`,`scroll-mbe`,`scroll-mt`,`scroll-mr`,`scroll-mb`,`scroll-ml`],"scroll-mx":[`scroll-mr`,`scroll-ml`],"scroll-my":[`scroll-mt`,`scroll-mb`],"scroll-p":[`scroll-px`,`scroll-py`,`scroll-ps`,`scroll-pe`,`scroll-pbs`,`scroll-pbe`,`scroll-pt`,`scroll-pr`,`scroll-pb`,`scroll-pl`],"scroll-px":[`scroll-pr`,`scroll-pl`],"scroll-py":[`scroll-pt`,`scroll-pb`],touch:[`touch-x`,`touch-y`,`touch-pz`],"touch-x":[`touch`],"touch-y":[`touch`],"touch-pz":[`touch`]},conflictingClassGroupModifiers:{"font-size":[`leading`]},orderSensitiveModifiers:[`*`,`**`,`after`,`backdrop`,`before`,`details-content`,`file`,`first-letter`,`first-line`,`marker`,`placeholder`,`selection`]}},Cs=Ao(Ss)})),Ts,Es=r((()=>{qe(),Ts=e=>{if(!Ke)return null;try{let t=localStorage.getItem(e);return t?JSON.parse(t):null}catch{return null}}})),Ds,Os=r((()=>{qe(),Ds=(e,t)=>{if(Ke)try{window.localStorage.setItem(e,JSON.stringify(t))}catch{}}})),X,ks,As,js,Ms,Z=r((()=>{Ge(),Qa(),ws(),Es(),Os(),X=(...e)=>Cs(Za(e)),ks=(e,t)=>{let n=0;return r=>{let i=Date.now();if(i-n>=t)return n=i,e(r)}},As=24,js=12,Ms=e=>{if(!e)return{name:`Unknown`,wrappers:[],wrapperTypes:[]};let{tag:t,type:n,elementType:r}=e,i=ye(n),a=[],o=[];if(_e(e)||t===15||t===14||(n==null?void 0:n.$$typeof)===Symbol.for(`react.memo`)||(r==null?void 0:r.$$typeof)===Symbol.for(`react.memo`)){let t=_e(e);o.push({type:`memo`,title:t?`This component has been auto-memoized by the React Compiler.`:`Memoized component that skips re-renders if props are the same`,compiler:t})}if(t===As&&o.push({type:`lazy`,title:`Lazily loaded component that supports code splitting`}),t===13&&o.push({type:`suspense`,title:`Component that can suspend while content is loading`}),t===js&&o.push({type:`profiler`,title:`Component that measures rendering performance`}),typeof i==`string`){let e=/^(\w+)\((.*)\)$/,t=i;for(;e.test(t);){let n=t.match(e);if(n!=null&&n[1]&&n!=null&&n[2])a.unshift(n[1]),t=n[2];else break}i=t}return{name:i||`Unknown`,wrappers:a,wrapperTypes:o}}})),Ns,Ps,Fs,Is,Ls,Rs,zs,Bs,Vs,Hs,Us,Ws,Gs,Ks=r((()=>{I(),na(),Z(),[Ns,Ps]=T(null),Fs=()=>({corner:`bottom-right`,dimensions:{isFullWidth:!1,isFullHeight:!1,width:Zi.width,height:Zi.height,position:{x:24,y:24}},lastDimensions:{isFullWidth:!1,isFullHeight:!1,width:Zi.width,height:Zi.height,position:{x:24,y:24}},componentsTree:{width:240}}),Is=()=>{var e,t,n,r,i;let a=Fs(),o=Ts(Qi);return o?{corner:(e=o.corner)==null?a.corner:e,dimensions:(t=o.dimensions)==null?a.dimensions:t,lastDimensions:(n=(r=o.lastDimensions)==null?o.dimensions:r)==null?a.lastDimensions:n,componentsTree:(i=o.componentsTree)==null?a.componentsTree:i}:(Ds(Qi,{corner:a.corner,dimensions:a.dimensions,lastDimensions:a.lastDimensions,componentsTree:a.componentsTree}),a)},[Ls,Rs]=T(Is()),[zs,Bs]=T({view:`none`}),Vs=e=>e===`top`||e===`bottom`||e===`left`||e===`right`,Hs=()=>{let e=Ts($i);return{edge:Vs(e==null?void 0:e.edge)?e.edge:`bottom`,ratio:typeof(e==null?void 0:e.ratio)==`number`?e.ratio:ea,collapsed:(e==null?void 0:e.collapsed)===!0}},[Us,Ws]=T(Hs()),Gs=e=>{let t=e(Us());Ws(t),Ds($i,t)}})),qs,Js=r((()=>{qs=(e,t,n)=>Math.min(Math.max(e,t),Math.max(t,n))})),Ys,Xs=r((()=>{Ys=()=>{let e=window.visualViewport;return e?{width:e.width,height:e.height,offsetLeft:e.offsetLeft,offsetTop:e.offsetTop}:{width:window.innerWidth,height:window.innerHeight,offsetLeft:0,offsetTop:0}}})),Zs,Qs=r((()=>{Zs=e=>typeof e==`number`&&Number.isFinite(e)&&e>=0})),$s,ec=r((()=>{$s=e=>!!e&&typeof e==`object`&&!Array.isArray(e)})),tc,nc=r((()=>{In(),Qs(),ec(),na(),tc=()=>{let e=R().safeArea;if(Zs(e))return{top:e,right:e,bottom:e,left:e};if($s(e)){let t=e.top,n=e.right,r=e.bottom,i=e.left;return{top:Zs(t)?t:24,right:Zs(n)?n:24,bottom:Zs(r)?r:24,left:Zs(i)?i:24}}return{top:24,right:24,bottom:24,left:24}}})),rc,ic,ac,oc,sc,cc,lc,uc=r((()=>{na(),Js(),Xs(),nc(),rc=e=>e===`top`||e===`bottom`,ic=e=>{let t=rc(e);return{width:t?30:16,height:t?16:30}},ac=(e,t)=>{let n=Ys(),r=tc(),i=Math.max(16,r.left),a=Math.max(16,r.right),o=Math.max(16,r.top),s=Math.max(16,r.bottom),c=n.offsetLeft+i,l=n.offsetTop+o;return{minimumX:c,maximumX:Math.max(c,n.offsetLeft+n.width-e-a),minimumY:l,maximumY:Math.max(l,n.offsetTop+n.height-t-s)}},oc=(e,t,n,r)=>{let i=ac(n,r);return rc(e)?{x:i.minimumX+(i.maximumX-i.minimumX)*qs(t,0,1),y:e===`top`?i.minimumY:i.maximumY}:{x:e===`left`?i.minimumX:i.maximumX,y:i.minimumY+(i.maximumY-i.minimumY)*qs(t,0,1)}},sc=(e,t,n,r,i)=>{let a=ac(r,i);if(rc(e)){let e=a.maximumX-a.minimumX;return e<=0?ea:qs((t-a.minimumX)/e,0,1)}let o=a.maximumY-a.minimumY;return o<=0?ea:qs((n-a.minimumY)/o,0,1)},cc=(e,t,n,r)=>{let i=Ys();return rc(e)?{x:qs(t.x+(n.width-r.width)/2,i.offsetLeft,i.offsetLeft+i.width-r.width),y:e===`top`?i.offsetTop:i.offsetTop+i.height-r.height}:{x:e===`left`?i.offsetLeft:i.offsetLeft+i.width-r.width,y:qs(t.y+(n.height-r.height)/2,i.offsetTop,i.offsetTop+i.height-r.height)}},lc=(e,t,n,r,i,a)=>{let o=Ys(),s=e+i*150,c=t+a*150,l=s+n/2,u=c+r/2,d=u-o.offsetTop,f=o.offsetTop+o.height-u,p=l-o.offsetLeft,m=o.offsetLeft+o.width-l,h=Math.min(d,f,p,m),g=`bottom`;h===d?g=`top`:h===p?g=`left`:h===m&&(g=`right`);let _=ac(n,r);return{edge:g,x:g===`left`?_.minimumX:g===`right`?_.maximumX:qs(s,_.minimumX,_.maximumX),y:g===`top`?_.minimumY:g===`bottom`?_.maximumY:qs(c,_.minimumY,_.maximumY)}}})),dc,fc=r((()=>{I(),na(),uc(),dc=e=>{let[t,n]=T(!1),[r,i]=T(!1),a=!1,o=!1,s=0,c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g,_,v,y=()=>{g==null||g.abort(),g=void 0},b=t=>{if(!a){if(Math.hypot(t.clientX-l,t.clientY-u)<=5)return;a=!0,e.onDragStart()}let n=performance.now(),r=n-p;r>0&&(m=(t.clientX-d)/r,h=(t.clientY-f)/r),d=t.clientX,f=t.clientY,p=n,e.onPositionUpdate({x:t.clientX-s,y:t.clientY-c})},ee=()=>{var t;if(y(),n(!1),!a)return;o=!0;let r=e.getContainer(),s=r==null?void 0:r.getBoundingClientRect();if(!s)return;let c=lc(s.left,s.top,s.width,s.height,m,h),l=sc(c.edge,c.x,c.y,s.width,s.height);e.onSnapEdgeChange(c.edge,l),i(!0),cancelAnimationFrame((t=_)==null?0:t),_=requestAnimationFrame(()=>{var t;let n=(t=r==null?void 0:r.getBoundingClientRect())==null?s:t;_=requestAnimationFrame(()=>{let t=oc(c.edge,l,n.width,n.height);e.onSnapComplete(c.edge,l,t),clearTimeout(v),v=setTimeout(()=>i(!1),300)})})};return k(()=>{var e;y(),cancelAnimationFrame((e=_)==null?0:e),clearTimeout(v)}),{isDragging:t,isSnapping:r,handlePointerDown:t=>{var i;if(t.button!==0||e.isCollapsed()||r())return;let o=(i=e.getContainer())==null?void 0:i.getBoundingClientRect();if(!o)return;l=t.clientX,u=t.clientY,d=t.clientX,f=t.clientY,p=performance.now(),s=t.clientX-o.left,c=t.clientY-o.top,m=0,h=0,a=!1,n(!0),y(),g=new AbortController;let _={signal:g.signal};window.addEventListener(`pointermove`,b,_),window.addEventListener(`pointerup`,ee,_),window.addEventListener(`pointercancel`,ee,_)},createDragAwareHandler:e=>t=>{if(t.stopImmediatePropagation(),o){o=!1;return}e()}}}})),pc,mc=r((()=>{pc=(e,t)=>{let n=t<.5;return e===`top`?n?`top-left`:`top-right`:e===`bottom`?n?`bottom-left`:`bottom-right`:e===`left`?n?`top-left`:`bottom-left`:n?`top-right`:`bottom-right`}})),hc,gc=r((()=>{I(),hc=(e,t,n=t)=>{let[r,i]=T(e());return D(()=>{let a=e();if(a===$e(r))return;let o=setTimeout(()=>i(a),a?t:n);k(()=>clearTimeout(o))}),r}}));function _c(e,t,n=!1){if(!e)return null;let r=t(e);if(r instanceof Promise)return(async()=>{if(await r===!0)return e;let i=n?e.return:e.child;for(;i;){let e=await ol(i,t,n);if(e)return e;i=n?null:i.sibling}return null})();if(r===!0)return e;let i=n?e.return:e.child;for(;i;){let e=al(i,t,n);if(e)return e;i=n?null:i.sibling}return null}function vc(e,t){let n=0,r=0,i=0;do i=jl[e.next()],n|=(i&31)<<r,r+=5;while(i&32);let a=n&1;return n>>>=1,a&&(n=-2147483648|-n),t+n}function yc(e,t){return e.pos>=t?!1:e.peek()!==Ol}function bc(e){let{length:t}=e,n=new Ml(e),r=[],i=0,a=0,o=0,s=0,c=0;do{let e=n.indexOf(`;`),t=[],l=!0,u=0;for(i=0;n.pos<e;){let r;i=vc(n,i),i<u&&(l=!1),u=i,yc(n,e)?(a=vc(n,a),o=vc(n,o),s=vc(n,s),yc(n,e)?(c=vc(n,c),r=[i,a,o,s,c]):r=[i,a,o,s]):r=[i],t.push(r),n.pos++}l||xc(t),r.push(t),n.pos=e+1}while(n.pos<=t);return r}function xc(e){e.sort(Sc)}function Sc(e,t){return e[0]-t[0]}var Cc,wc,Tc,Ec,Dc,Oc,kc,Ac,jc,Mc,Nc,Pc,Fc,Ic,Lc,Rc,zc,Bc,Vc,Hc,Uc,Wc,Gc,Kc,qc,Jc,Yc,Xc,Zc,Qc,$c,el,tl,nl,rl,il,al,ol,sl,cl,ll,ul,dl,fl,pl,ml,hl,gl,_l,vl,yl,bl,xl,Sl,Cl,wl,Tl,El,Dl,Ol,kl,Al,jl,Ml,Nl,Pl,Fl,Il,Ll,Rl,zl,Bl,Vl,Hl,Ul,Wl,Gl,Kl,ql,Jl,Yl,Xl,Zl,Ql,$l,eu,tu,nu,ru,iu,au,ou,su,cu,lu,uu,du,fu,pu,mu,hu,gu,_u,vu,yu,Q,bu,$,xu,Su,Cu,wu,Tu,Eu,Du,Ou,ku,Au,ju,Mu,Nu,Pu,Fu,Iu,Lu,Ru,zu,Bu,Vu,Hu,Uu,Wu,Gu,Ku,qu,Ju,Yu,Xu,Zu,Qu,$u,ed,td,nd,rd,id,ad,od,sd,cd=r((()=>{Dc=null,Oc=()=>{if(Dc!==null)return Dc;try{Dc=window.matchMedia(`(color-gamut: p3)`).matches}catch{Dc=!1}return Dc},kc=Oc(),Ac=e=>kc?`color(display-p3 0.84 0.19 0.78 / ${e})`:`rgba(210, 57, 192, ${e})`,jc=[`/components/ui/`,`/packages/ui/`,`/design-system/`,`/design-systems/`,`/primitives/`],Mc=5e3,Nc=8e3,Pc=1e4,Ac(.4),Ac(.05),Ac(.5),Ac(.08),Ac(.15),Fc=new Set([`id`,`data-testid`,`aria-label`,`href`,`src`,`alt`,`type`,`name`,`placeholder`,`role`,`for`,`action`,`method`,`title`,`disabled`,`checked`,`readonly`,`required`,`selected`,`open`]),Ic=new Set([`a`,`code`,`pre`]),Lc=new Set([`script`,`style`,`template`,`noscript`]),new Set([`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`]),Rc=`data-react-grab-frozen`,zc=new Set(`display.position.top.right.bottom.left.z-index.overflow.overflow-x.overflow-y.width.height.min-width.min-height.max-width.max-height.margin-top.margin-right.margin-bottom.margin-left.padding-top.padding-right.padding-bottom.padding-left.flex-direction.flex-wrap.justify-content.align-items.align-self.align-content.flex-grow.flex-shrink.flex-basis.order.gap.row-gap.column-gap.grid-template-columns.grid-template-rows.grid-template-areas.font-family.font-size.font-weight.font-style.line-height.letter-spacing.text-align.text-decoration-line.text-decoration-style.text-transform.text-overflow.text-shadow.white-space.word-break.overflow-wrap.vertical-align.color.background-color.background-image.background-position.background-size.background-repeat.border-top-width.border-right-width.border-bottom-width.border-left-width.border-top-style.border-right-style.border-bottom-style.border-left-style.border-top-color.border-right-color.border-bottom-color.border-left-color.border-top-left-radius.border-top-right-radius.border-bottom-left-radius.border-bottom-right-radius.box-shadow.opacity.transform.filter.backdrop-filter.object-fit.object-position`.split(`.`)),Bc=e=>(e.tagName||``).toLowerCase(),Vc=`bippy-0.5.43`,Hc=Object.defineProperty,Uc=Object.prototype.hasOwnProperty,Wc=()=>{},Gc=e=>{try{Function.prototype.toString.call(e).indexOf(`^_^`)>-1&&setTimeout(()=>{throw Error(`React is running in production mode, but dead code elimination has not been applied. Read how to correctly configure React for production: https://reactjs.org/link/perf-use-production-build`)})}catch{}},Kc=(e=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__)=>!!(e&&`getFiberRoots`in e),qc=!1,Yc=(e=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__)=>qc?!0:(e&&typeof e.inject==`function`&&(Jc=e.inject.toString()),!!(Jc!=null&&Jc.includes(`(injected)`))),Xc=new Set,Zc=new Set,Qc=e=>{let t=new Map,n=0,r={_instrumentationIsActive:!1,_instrumentationSource:Vc,checkDCE:Gc,hasUnsupportedRendererAttached:!1,inject(e){let i=++n;return t.set(i,e),Zc.add(e),r._instrumentationIsActive||(r._instrumentationIsActive=!0,Xc.forEach(e=>e())),i},on:Wc,onCommitFiberRoot:Wc,onCommitFiberUnmount:Wc,onPostCommitFiberRoot:Wc,renderers:t,supportsFiber:!0,supportsFlight:!0};try{Hc(globalThis,`__REACT_DEVTOOLS_GLOBAL_HOOK__`,{configurable:!0,enumerable:!0,get(){return r},set(t){if(t&&typeof t==`object`){let n=r.renderers;r=t,n.size>0&&(n.forEach((e,n)=>{Zc.add(e),t.renderers.set(n,e)}),$c(e))}}});let t=window.hasOwnProperty,n=!1;Hc(window,`hasOwnProperty`,{configurable:!0,value:function(...e){try{if(!n&&e[0]===`__REACT_DEVTOOLS_GLOBAL_HOOK__`)return globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__=void 0,n=!0,-0}catch{}return t.apply(this,e)},writable:!0})}catch{$c(e)}return r},$c=e=>{e&&Xc.add(e);try{let t=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!t)return;if(!t._instrumentationSource){t.checkDCE=Gc,t.supportsFiber=!0,t.supportsFlight=!0,t.hasUnsupportedRendererAttached=!1,t._instrumentationSource=Vc,t._instrumentationIsActive=!1;let e=Kc(t);if(e||(t.on=Wc),t.renderers.size){t._instrumentationIsActive=!0,Xc.forEach(e=>e());return}let n=t.inject,r=Yc(t);r&&!e&&(qc=!0,t.inject({scheduleRefresh(){}})&&(t._instrumentationIsActive=!0)),t.inject=e=>{let i=n(e);return Zc.add(e),r&&t.renderers.set(i,e),t._instrumentationIsActive=!0,Xc.forEach(e=>e()),i}}(t.renderers.size||t._instrumentationIsActive||Yc())&&(e==null||e())}catch{}},el=()=>Uc.call(globalThis,`__REACT_DEVTOOLS_GLOBAL_HOOK__`),tl=e=>el()?($c(e),globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__):Qc(e),nl=()=>{var e,t;return!!(typeof window<`u`&&((e=window.document)!=null&&e.createElement||((t=window.navigator)==null?void 0:t.product)===`ReactNative`))},rl=()=>{try{nl()&&tl()}catch{}},il=e=>{switch(e.tag){case 1:case 11:case 0:case 14:case 15:return!0;default:return!1}},al=(e,t,n=!1)=>{if(!e)return null;if(t(e)===!0)return e;let r=n?e.return:e.child;for(;r;){let e=al(r,t,n);if(e)return e;r=n?null:r.sibling}return null},ol=async(e,t,n=!1)=>{if(!e)return null;if(await t(e)===!0)return e;let r=n?e.return:e.child;for(;r;){let e=await ol(r,t,n);if(e)return e;r=n?null:r.sibling}return null},sl=e=>{let t=e;return typeof t==`function`?t:typeof t==`object`&&t?sl(t.type||t.render):null},cl=e=>{let t=e;if(typeof t==`string`)return t;if(typeof t!=`function`&&!(typeof t==`object`&&t))return null;let n=t.displayName||t.name||null;if(n)return n;let r=sl(t);return r&&(r.displayName||r.name)||null},ll=()=>{let e=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;return!!(e!=null&&e._instrumentationIsActive)||Kc(e)||Yc(e)},ul=e=>Object.prototype.toString.call(e)===`[object Object]`&&(Object.getPrototypeOf(e)===Object.prototype||Object.getPrototypeOf(e)===null),dl=(e,t=[])=>{if(!ul(e))return[{path:t,value:e}];let n=[];for(let r in e){let i=e[r],a=t.concat(r);ul(i)?n.push(...dl(i,a)):n.push({path:a,value:i})}return n},fl=e=>{let t=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;if(t!=null&&t.renderers)for(let r of t.renderers.values())try{var n;let t=(n=r.findFiberByHostInstance)==null?void 0:n.call(r,e);if(t)return t}catch{}if(typeof e==`object`&&e){var r;if(`_reactRootContainer`in e)return(r=e._reactRootContainer)==null||(r=r._internalRoot)==null||(r=r.current)==null?void 0:r.child;for(let t in e)if(t.startsWith(`__reactContainer$`)||t.startsWith(`__reactInternalInstance$`)||t.startsWith(`__reactFiber`))return e[t]||null}return null},pl=/^[a-zA-Z][a-zA-Z\d+\-.]*:/,ml=[`rsc://`,`file:///`,`webpack-internal://`,`webpack://`,`node:`,`turbopack://`,`metro://`,`/app-pages-browser/`,`/(app-pages-browser)/`],hl=[`<anonymous>`,`eval`,``],gl=/\.(jsx|tsx|ts|js)$/,_l=/(\.min|bundle|chunk|vendor|vendors|runtime|polyfill|polyfills)\.(js|mjs|cjs)$|(chunk|bundle|vendor|vendors|runtime|polyfill|polyfills|framework|app|main|index)[-_.][A-Za-z0-9_-]{4,}\.(js|mjs|cjs)$|[\da-f]{8,}\.(js|mjs|cjs)$|[-_.][\da-f]{20,}\.(js|mjs|cjs)$|\/dist\/|\/build\/|\/.next\/|\/out\/|\/node_modules\/|\.webpack\.|\.vite\.|\.turbopack\./i,vl=/^\?[\w~.-]+(?:=[^&#]*)?(?:&[\w~.-]+(?:=[^&#]*)?)*$/,yl=/\(at [^)]+\)$/,bl=/(^|@)\S+:\d+/,xl=/^\s*at .*(\S+:\d+|\(native\))/m,Sl=/^(eval@)?(\[native code\])?$/,Cl=(e,t)=>{if((t==null?void 0:t.includeInElement)!==!1){let n=e.split(`
`),r=[];for(let e of n)if(/^\s*at\s+/.test(e)){let t=El(e,void 0)[0];t&&r.push(t)}else if(/^\s*in\s+/.test(e)){let t=e.replace(/^\s*in\s+/,``).replace(/\s*\(at .*\)$/,``);r.push({functionName:t,source:e})}else if(e.match(bl)){let t=Dl(e,void 0)[0];t&&r.push(t)}return Tl(r,t)}return e.match(xl)?El(e,t):Dl(e,t)},wl=e=>{if(!e.includes(`:`))return[e,void 0,void 0];let t=e.startsWith(`(`)&&/:\d+\)$/.test(e)?e.slice(1,-1):e,n=/(.+?)(?::(\d+))?(?::(\d+))?$/.exec(t);return n?[n[1],n[2]||void 0,n[3]||void 0]:[t,void 0,void 0]},Tl=(e,t)=>t&&t.slice!=null?Array.isArray(t.slice)?e.slice(t.slice[0],t.slice[1]):e.slice(0,t.slice):e,El=(e,t)=>Tl(e.split(`
`).filter(e=>!!e.match(xl)),t).map(e=>{let t=e;t.includes(`(eval `)&&(t=t.replace(/eval code/g,`eval`).replace(/(\(eval at [^()]*)|(,.*$)/g,``));let n=t.replace(/^\s+/,``).replace(/\(eval code/g,`(`).replace(/^.*?\s+/,``),r=n.match(/ (\(.+\)$)/);n=r?n.replace(r[0],``):n;let i=wl(r?r[1]:n);return{functionName:r&&n||void 0,fileName:[`eval`,`<anonymous>`].includes(i[0])?void 0:i[0],lineNumber:i[1]?+i[1]:void 0,columnNumber:i[2]?+i[2]:void 0,source:t}}),Dl=(e,t)=>Tl(e.split(`
`).filter(e=>!e.match(Sl)),t).map(e=>{let t=e;if(t.includes(` > eval`)&&(t=t.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,`:$1`)),!t.includes(`@`)&&!t.includes(`:`))return{functionName:t};{let e=/(([^\n\r"\u2028\u2029]*".[^\n\r"\u2028\u2029]*"[^\n\r@\u2028\u2029]*(?:@[^\n\r"\u2028\u2029]*"[^\n\r@\u2028\u2029]*)*(?:[\n\r\u2028\u2029][^@]*)?)?[^@]*)@/,n=t.match(e),r=n&&n[1]?n[1]:void 0,i=wl(t.replace(e,``));return{functionName:r,fileName:i[0],lineNumber:i[1]?+i[1]:void 0,columnNumber:i[2]?+i[2]:void 0,source:t}}}),Ol=44,kl=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`,Al=new Uint8Array(64),jl=new Uint8Array(128);for(let e=0;e<kl.length;e++){let t=kl.charCodeAt(e);Al[e]=t,jl[t]=e}Ml=class{constructor(e){this.pos=0,this.buffer=e}next(){return this.buffer.charCodeAt(this.pos++)}peek(){return this.buffer.charCodeAt(this.pos)}indexOf(e){let{buffer:t,pos:n}=this,r=t.indexOf(e,n);return r===-1?t.length:r}},Nl=/^[a-zA-Z][a-zA-Z\d+\-.]*:/,Pl=/^data:application\/json[^,]+base64,/,Fl=/(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^*]+?)[ \t]*(?:\*\/)[ \t]*$)/,Il=new Map,Ll=new Map,Rl=(e,t,n,r)=>{if(n<0||n>=e.length)return null;let i=e[n];if(!i||i.length===0)return null;let a=null;for(let e of i)if(e[0]<=r)a=e;else break;if(!a||a.length<4)return null;let[,o,s,c]=a;if(o===void 0||s===void 0||c===void 0)return null;let l=t[o];return l?{columnNumber:c,fileName:l,lineNumber:s+1}:null},zl=(e,t,n)=>{if(e.sections){let r=null;for(let i of e.sections)if(t>i.offset.line||t===i.offset.line&&n>=i.offset.column)r=i;else break;if(!r)return null;let i=t-r.offset.line,a=t===r.offset.line?n-r.offset.column:n;return Rl(r.map.mappings,r.map.sources,i,a)}return Rl(e.mappings,e.sources,t-1,n)},Bl=(e,t)=>{let n=t.split(`
`),r;for(let e=n.length-1;e>=0&&!r;e--){let t=n[e].match(Fl);t&&(r=t[1]||t[2])}if(!r)return null;let i=Nl.test(r);if(!(Pl.test(r)||i||r.startsWith(`/`))){let t=e.split(`/`);t[t.length-1]=r,r=t.join(`/`)}return r},Vl=e=>({file:e.file,mappings:bc(e.mappings),names:e.names,sourceRoot:e.sourceRoot,sources:e.sources,sourcesContent:e.sourcesContent,version:3}),Hl=e=>{let t=e.sections.map(({map:e,offset:t})=>({map:{...e,mappings:bc(e.mappings)},offset:t})),n=new Set;for(let e of t)for(let t of e.map.sources)n.add(t);return{file:e.file,mappings:[],names:[],sections:t,sourceRoot:void 0,sources:Array.from(n),sourcesContent:void 0,version:3}},Ul=e=>{if(!e)return!1;let t=e.trim();if(!t)return!1;let n=t.match(Nl);if(!n)return!0;let r=n[0].toLowerCase();return r===`http:`||r===`https:`},Wl=async(e,t=fetch)=>{if(!Ul(e))return null;let n=await t(e);if(!n.ok)return null;let r=await n.text();if(!r)return null;let i=Bl(e,r);if(!i||!Ul(i))return null;let a=await t(i);if(!a.ok)return null;try{let e=await a.json();return`sections`in e?Hl(e):Vl(e)}catch{return null}},Gl=async(e,t=!0,n)=>{var r;if(t&&Il.has(e))return(r=Il.get(e))==null?null:r;let i=t?Ll.get(e):void 0;if(i)return(await i).sourceMap;let a=Wl(e,n).then(e=>({sourceMap:e,isTransientFailure:!1}),()=>({sourceMap:null,isTransientFailure:!0}));t&&Ll.set(e,a);let{sourceMap:o,isTransientFailure:s}=await a;return t&&(Ll.delete(e),s||Il.set(e,o)),o},Kl=async(e,t=!0,n)=>await Promise.all(e.map(async e=>{if(!e.fileName)return e;let r=await Gl(e.fileName,t,n);if(!r||typeof e.lineNumber!=`number`||typeof e.columnNumber!=`number`)return e;let i=zl(r,e.lineNumber,e.columnNumber);return i?{...e,source:i.fileName&&e.source?e.source.replace(e.fileName,i.fileName):e.source,fileName:i.fileName,lineNumber:i.lineNumber,columnNumber:i.columnNumber,isSymbolicated:!0}:e})),ql=e=>{var t;return e._debugStack instanceof Error&&typeof((t=e._debugStack)==null?void 0:t.stack)==`string`},Jl=()=>{let e=tl();for(let t of[...Array.from(Zc),...Array.from(e.renderers.values())]){let e=t.currentDispatcherRef;if(e&&typeof e==`object`)return`H`in e?e.H:e.current}return null},Yl=e=>{for(let t of Zc){let n=t.currentDispatcherRef;n&&typeof n==`object`&&(`H`in n?n.H=e:n.current=e)}},Xl=e=>`\n    in ${e}`,Zl=(e,t)=>{let n=Xl(e);return t&&(n+=` (at ${t})`),n},Ql=!1,$l=(e,t)=>{if(!e||Ql)return``;let n=Error.prepareStackTrace;Error.prepareStackTrace=void 0,Ql=!0;let r=Jl();Yl(null);let i=console.error,a=console.warn;console.error=()=>{},console.warn=()=>{};try{var o;let n={DetermineComponentFrameRoot(){let n;try{if(t){let t=function(){throw Error()};if(Object.defineProperty(t.prototype,`props`,{set:function(){throw Error()}}),typeof Reflect==`object`&&Reflect.construct){try{Reflect.construct(t,[])}catch(e){n=e}Reflect.construct(e,[],t)}else{try{t.call()}catch(e){n=e}e.call(t.prototype)}}else{try{throw Error()}catch(e){n=e}let t=e();t&&typeof t.catch==`function`&&t.catch(()=>{})}}catch(e){if(e instanceof Error&&n instanceof Error&&typeof e.stack==`string`)return[e.stack,n.stack]}return[null,null]}};n.DetermineComponentFrameRoot.displayName=`DetermineComponentFrameRoot`,(o=Object.getOwnPropertyDescriptor(n.DetermineComponentFrameRoot,`name`))!=null&&o.configurable&&Object.defineProperty(n.DetermineComponentFrameRoot,`name`,{value:`DetermineComponentFrameRoot`});let[r,i]=n.DetermineComponentFrameRoot();if(r&&i){let t=r.split(`
`),n=i.split(`
`),a=0,o=0;for(;a<t.length&&!t[a].includes(`DetermineComponentFrameRoot`);)a++;for(;o<n.length&&!n[o].includes(`DetermineComponentFrameRoot`);)o++;if(a===t.length||o===n.length)for(a=t.length-1,o=n.length-1;a>=1&&o>=0&&t[a]!==n[o];)o--;for(;a>=1&&o>=0;a--,o--)if(t[a]!==n[o]){if(a!==1||o!==1)do if(a--,o--,o<0||t[a]!==n[o]){let n=`\n${t[a].replace(` at new `,` at `)}`,r=cl(e);return r&&n.includes(`<anonymous>`)&&(n=n.replace(`<anonymous>`,r)),n}while(a>=1&&o>=0);break}}}finally{Ql=!1,Error.prepareStackTrace=n,Yl(r),console.error=i,console.warn=a}let s=e?cl(e):``;return s?Xl(s):``},eu=(e,t)=>{let n=e.tag,r=``;switch(n){case 28:r=Xl(`Activity`);break;case 1:r=$l(e.type,!0);break;case 11:r=$l(e.type.render,!1);break;case 0:case 15:r=$l(e.type,!1);break;case 5:case 26:case 27:r=Xl(e.type);break;case 16:r=Xl(`Lazy`);break;case 13:r=e.child!==t&&t!==null?Xl(`Suspense Fallback`):Xl(`Suspense`);break;case 19:r=Xl(`SuspenseList`);break;case 30:r=Xl(`ViewTransition`);break;default:return``}return r},tu=e=>{try{let t=``,n=e,r=null;do{t+=eu(n,r);let e=n._debugInfo;if(e&&Array.isArray(e))for(let n=e.length-1;n>=0;n--){let r=e[n];typeof r.name==`string`&&(t+=Zl(r.name,r.env))}r=n,n=n.return}while(n);return t}catch(e){return e instanceof Error?`\nError generating stack: ${e.message}\n${e.stack}`:``}},nu=e=>{let t=Error.prepareStackTrace;Error.prepareStackTrace=void 0;let n=e;if(!n)return``;Error.prepareStackTrace=t,n.startsWith(`Error: react-stack-top-frame
`)&&(n=n.slice(29));let r=n.indexOf(`
`);if(r!==-1&&(n=n.slice(r+1)),r=Math.max(n.indexOf(`react_stack_bottom_frame`),n.indexOf(`react-stack-bottom-frame`)),r!==-1&&(r=n.lastIndexOf(`
`,r)),r!==-1)n=n.slice(0,r);else return``;return n},ru=e=>!!(e.functionName&&e.fileName&&(e.fileName.startsWith(`rsc://`)||e.fileName.startsWith(`about://React/`))),iu=(e,t)=>e.fileName===t.fileName&&e.lineNumber===t.lineNumber&&e.columnNumber===t.columnNumber,au=e=>{let t=new Map;for(let r of e)for(let e of r.stackFrames){var n;if(!ru(e))continue;let r=e.functionName,i=(n=t.get(r))==null?[]:n;i.some(t=>iu(t,e))||(i.push(e),t.set(r,i))}return t},ou=(e,t,n)=>{var r,i;if(!e.functionName)return{...e,isServer:!0};let a=t.get(e.functionName);if(!a||a.length===0)return{...e,isServer:!0};let o=(r=n.get(e.functionName))==null?0:r,s=a[o%a.length];return n.set(e.functionName,o+1),{...e,isServer:!0,fileName:s.fileName,lineNumber:s.lineNumber,columnNumber:s.columnNumber,source:(i=e.source)==null?void 0:i.replace(`(at Server)`,`(${s.fileName}:${s.lineNumber}:${s.columnNumber})`)}},su=e=>{let t=[];return _c(e,e=>{var n;if(!ql(e))return;let r=typeof e.type==`string`?e.type:cl(e.type)||`<anonymous>`;t.push({componentName:r,stackFrames:Cl(nu((n=e._debugStack)==null?void 0:n.stack))})},!0),t},cu=async(e,t=!0,n)=>{let r=su(e),i=Cl(tu(e)),a=au(r),o=new Map;return Kl(i.map(e=>{var t,n;return(t=(n=e.source)==null?void 0:n.includes(`(at Server)`))!=null&&t||e.source!=null&&yl.test(e.source)?ou(e,a,o):e}).filter((e,t,n)=>{if(t===0)return!0;let r=n[t-1];return e.functionName!==r.functionName}),t,n)},lu=e=>{let t=e._debugSource;return t?typeof t==`object`&&!!t&&`fileName`in t&&typeof t.fileName==`string`&&`lineNumber`in t&&typeof t.lineNumber==`number`:!1},uu=async(e,t=!0,n)=>{if(lu(e))return e._debugSource||null;let r=await cu(e,t,n);for(let e of r)if(e.fileName)return{fileName:e.fileName,lineNumber:e.lineNumber,columnNumber:e.columnNumber,functionName:e.functionName};return null},du=e=>e.split(`/`).filter(Boolean).length,fu=e=>{var t;return(t=e.split(`/`).filter(Boolean)[0])==null?null:t},pu=e=>{let t=e.indexOf(`/`,1);if(t===-1||du(e.slice(0,t))!==1)return e;let n=e.slice(t);if(!gl.test(n)||du(n)<2)return e;let r=fu(n);return!r||r.startsWith(`@`)||r.length>4?e:n},mu=e=>{if(!e||hl.some(t=>t===e))return``;let t=e,n=t.startsWith(`http://`)||t.startsWith(`https://`);if(n)try{t=new URL(t).pathname}catch{}if(n&&(t=pu(t)),t.startsWith(`about://React/`)){let e=t.slice(14),n=e.indexOf(`/`),r=e.indexOf(`:`);t=n!==-1&&(r===-1||n<r)?e.slice(n+1):e}let r=!0;for(;r;){r=!1;for(let e of ml)if(t.startsWith(e)){t=t.slice(e.length),e===`file:///`&&(t=`/${t.replace(/^\/+/,``)}`),r=!0;break}}if(pl.test(t)){let e=t.match(pl);e&&(t=t.slice(e[0].length))}if(t.startsWith(`//`)){let e=t.indexOf(`/`,2);t=e===-1?``:t.slice(e)}let i=t.indexOf(`?`);if(i!==-1){let e=t.slice(i);vl.test(e)&&(t=t.slice(0,i))}return t},hu=e=>{let t=mu(e);return!(!t||!gl.test(t)||_l.test(t))},gu=Symbol.for(`react.context`),_u=[],vu=null,yu=Error("Suspense Exception: This is not a real error! It's an implementation detail of `use` to interrupt the current render."),Q=()=>{let e=vu;return e!==null&&(vu=e.next),e},bu=e=>e._currentValue,$=(e,t,n,r=null)=>{_u.push({displayName:r,primitive:e,stackError:Error(),value:t,dispatcherHookName:n})},xu=e=>{if(typeof e==`object`&&e){let t=e;if(typeof t.then==`function`){let e=t;switch(e.status){case`fulfilled`:return $(`Promise`,e.value,`Use`),e.value;case`rejected`:throw e.reason}throw $(`Unresolved`,e,`Use`),yu}if(t.$$typeof===gu&&`_currentValue`in t){let e=t,n=bu(e);return $(`Context (use)`,n,`Use`,e.displayName||`Context`),n}}throw Error(`An unsupported type was passed to use(): `+String(e))},Su=e=>{let t=bu(e);return $(`Context`,t,`Context`,e.displayName||null),t},Cu=e=>{let t=Q(),n=t===null?typeof e==`function`?e():e:t.memoizedState;return $(`State`,n,`State`),[n,()=>{}]},wu=(e,t,n)=>{let r=Q(),i=r===null?n===void 0?t:n(t):r.memoizedState;return $(`Reducer`,i,`Reducer`),[i,()=>{}]},Tu=e=>{let t=Q(),n=t===null?{current:e}:t.memoizedState;return $(`Ref`,n.current,`Ref`),n},Eu=()=>{let e=Q();return $(`CacheRefresh`,e===null?()=>{}:e.memoizedState,`CacheRefresh`),()=>{}},Du=e=>{Q(),$(`LayoutEffect`,e,`LayoutEffect`)},Ou=e=>{Q(),$(`InsertionEffect`,e,`InsertionEffect`)},ku=e=>{Q(),$(`Effect`,e,`Effect`)},Au=e=>{Q();let t;typeof e==`object`&&e&&`current`in e&&(t=e.current),$(`ImperativeHandle`,t,`ImperativeHandle`)},ju=(e,t)=>{$(`DebugValue`,typeof t==`function`?t(e):e,`DebugValue`)},Mu=e=>{let t=Q();return $(`Callback`,t===null?e:t.memoizedState[0],`Callback`),e},Nu=e=>{let t=Q(),n=t===null?e():t.memoizedState[0];return $(`Memo`,n,`Memo`),n},Pu=(e,t)=>{let n=Q();Q();let r=n===null?t():n.memoizedState;return $(`SyncExternalStore`,r,`SyncExternalStore`),r},Fu=()=>{let e=Q();Q();let t=e===null?!1:e.memoizedState;return $(`Transition`,t,`Transition`),[t,()=>{}]},Iu=e=>{let t=Q(),n=t===null?e:t.memoizedState;return $(`DeferredValue`,n,`DeferredValue`),n},Lu=()=>{let e=Q(),t=e===null?``:e.memoizedState;return $(`Id`,t,`Id`),t},Ru=e=>[],zu=e=>{let t=Q(),n=t===null?e:t.memoizedState;return $(`Optimistic`,n,`Optimistic`),[n,()=>{}]},Bu=(e,t)=>{let n,r=null;if(e!==null){let t=e.memoizedState;if(typeof t==`object`&&t&&`then`in t&&typeof t.then==`function`){let e=t;switch(e.status){case`fulfilled`:n=e.value;break;case`rejected`:r=e.reason;break;default:r=yu,n=e}}else n=t}else n=t;return{value:n,error:r}},Vu=e=>(t,n)=>{let r=Q();Q(),Q();let i=Error(),{value:a,error:o}=Bu(r,n);if(_u.push({displayName:null,primitive:e,stackError:i,value:a,dispatcherHookName:e}),o!==null)throw o;return[a,()=>{},!1]},Hu=Vu(`ActionState`),Uu={readContext:bu,use:xu,useCallback:Mu,useContext:Su,useEffect:ku,useImperativeHandle:Au,useLayoutEffect:Du,useInsertionEffect:Ou,useMemo:Nu,useReducer:wu,useRef:Tu,useState:Cu,useDebugValue:ju,useDeferredValue:Iu,useTransition:Fu,useSyncExternalStore:Pu,useId:Lu,useHostTransitionStatus:()=>{let e=bu({_currentValue:null});return $(`HostTransitionStatus`,e,`HostTransitionStatus`),e},useFormState:Vu(`FormState`),useActionState:Hu,useOptimistic:zu,useMemoCache:Ru,useCacheRefresh:Eu,useEffectEvent:e=>(Q(),$(`EffectEvent`,e,`EffectEvent`),e)},typeof Proxy>`u`||new Proxy(Uu,{get(e,t){if(Object.prototype.hasOwnProperty.call(e,t))return e[t];let n=Error(`Missing method in Dispatcher: `+t);throw n.name=`ReactDebugToolsUnsupportedHookError`,n}}),rl(),Wu=/^(?:\.\/)?\/?\([a-z][a-z0-9-]*\)\//,Gu=e=>{let t=mu(e);return t=t.replace(Wu,``),t.startsWith(`./`)&&(t=t.slice(2)),t},qu=e=>(e&&(Ku=void 0),Ku!=null||(Ku=typeof document<`u`&&!!(document.getElementById(`__NEXT_DATA__`)||document.querySelector(`nextjs-portal`))),Ku),Yu=()=>{var e;if(Ju!==void 0)return Ju;let t=(e=document.querySelector(`script[src*="/_next/"]`))==null?void 0:e.src,n=t?new URL(t).pathname:``,r=n.indexOf(`/_next/`);return Ju=r>0?n.slice(0,r):``,Ju},Xu=typeof window<`u`,Zu=e=>0,Qu=e=>{},$u=Xu?((Cc=(wc=Object.getOwnPropertyDescriptor(Window.prototype,`requestAnimationFrame`))==null?void 0:wc.value)==null?window.requestAnimationFrame:Cc).bind(window):Zu,ed=Xu?((Tc=(Ec=Object.getOwnPropertyDescriptor(Window.prototype,`cancelAnimationFrame`))==null?void 0:Ec.value)==null?window.cancelAnimationFrame:Tc).bind(window):Qu,td=!1,nd=new Map,rd=-1,id=new WeakSet,ad=new Map,od=new Map,sd=e=>{var t;return id.has(e)?!0:!td||!(`gsapVersions`in window)||!((t=Error().stack)==null?``:t).includes(`_tick`)?!1:(id.add(e),!0)},typeof window<`u`&&(window.requestAnimationFrame=e=>{if(!sd(e))return $u(e);if(td){let t=rd--;return nd.set(t,e),t}let t=$u(n=>{if(td){let n=rd--;nd.set(n,e),ad.set(t,n);return}e(n)});return t},window.cancelAnimationFrame=e=>{if(nd.has(e)){nd.delete(e);return}let t=od.get(e);if(t!==void 0){ed(t.nativeId),od.delete(e);return}let n=ad.get(e);if(n!==void 0){nd.delete(n),ad.delete(e);return}ed(e)}),`${Rc}${Rc}`})),ld,ud,dd,fd,pd,md,hd,gd,_d,vd,yd,bd,xd,Sd,Cd,wd,Td,Ed,Dd,Od,kd,Ad,jd,Md,Nd,Pd,Fd,Id,Ld,Rd,zd,Bd,Vd,Hd,Ud,Wd,Gd,Kd,qd,Jd,Yd,Xd,Zd,Qd,$d,ef,tf,nf,rf,af,of,sf,cf,lf,uf,df,ff,pf,mf,hf,gf,_f,vf,yf,bf,xf,Sf,Cf,wf,Tf,Ef,Df,Of,kf,Af,jf,Mf,Nf,Pf,Ff,If,Lf,Rf,zf,Bf,Vf,Hf,Uf,Wf,Gf,Kf,qf,Jf,Yf,Xf,Zf,Qf,$f,ep,tp,np,rp,ip,ap,op,sp,cp,lp,up,dp,fp,pp,mp=r((()=>{cd(),ld=class extends Error{constructor(e){super(e),this.name=`ReactGrabError`}},ud=class extends ld{constructor(){super(`Can't generate CSS selector for non-element node type.`),this.name=`NonElementNodeError`}},dd=class extends ld{constructor(e){super(`Timeout: Can't find a unique selector after ${e}ms`),this.name=`SelectorTimeoutError`,this.timeoutMs=e}},fd=class extends ld{constructor(){super(`Selector was not found.`),this.name=`SelectorNotFoundError`}},pd=e=>e===void 0||!Number.isFinite(e)?3:Math.max(0,Math.floor(e)),md=e=>{try{return decodeURIComponent(e)}catch{return e}},hd=/(?:^|[/\\])node_modules[/\\]/,gd=/[/\\]\.vite[/\\]deps[^/\\]*[/\\]/,_d=/\.[mc]?[jt]sx?$/i,vd=/^chunk-[A-Za-z0-9_-]+$/,yd=/[/\\]/,bd=/^(.+?)@v?\d/,xd=e=>e.split(yd).filter(Boolean),Sd=e=>{let[t,n]=xd(e);return!t||t.startsWith(`.`)?null:t.startsWith(`@`)?n?`${t}/${n}`:null:t},Cd=e=>{let t=xd(e)[0];if(!t)return null;let n=t.replace(_d,``);if(vd.test(n))return null;if(!n.startsWith(`@`))return n;let r=n.indexOf(`_`);return r===-1?null:`${n.slice(0,r)}/${n.slice(r+1)}`},wd=(e,t,n)=>{let r=e.split(t);return r.length>1?n(r[r.length-1]):null},Td=e=>{var t,n;return(t=e==null||(n=e.match(bd))==null?void 0:n[1])==null?null:t},Ed=e=>{let t;try{t=new URL(e)}catch{return null}if(!t.hostname)return null;let n=xd(t.pathname).map(md);for(let[e,t]of n.entries()){if(t.startsWith(`@`)){let r=Td(n[e+1]);if(r)return`${t}/${r}`;continue}let r=Td(t);if(r)return r}return null},Dd=e=>{var t;return(t=wd(e,gd,Cd))==null?wd(e,hd,Sd):t},Od=e=>{if(!e)return null;let t=mu(e);return t&&(Dd(md(t))||Ed(e))||null},kd=/^@[A-Za-z0-9][A-Za-z0-9._-]*$/,Ad=/^[A-Za-z0-9][A-Za-z0-9._-]*$/,jd=new Set([`app`,`web`,`website`,`frontend`,`client`,`src`]),Md=new Set([`app`,`src`,`components`,`pages`,`features`,`modules`,`hooks`,`lib`,`utils`,`ui`,`shared`,`common`,`core`,`styles`,`assets`]),Nd=e=>{let t=e;for(;t.startsWith(`../`)||t.startsWith(`./`);)t=t.slice(t.startsWith(`../`)?3:2);return t},Pd=e=>{let t=Nd(md(mu(e)));if(t.startsWith(`/`))return null;let[n,r,...i]=xd(t);return!n||!r||i.length===0||!kd.test(n)||Md.has(n.slice(1))||!Ad.test(r)||_d.test(r)||jd.has(r)?null:`${n}/${r}`},Fd=e=>{var t;return e?(t=Od(e))==null?Pd(e):t:null},Id=e=>{if(!e)return{origin:`unknown`,packageName:null};let t=Fd(e);return t?{origin:`package`,packageName:t}:hu(e)?{origin:`app`,packageName:null}:{origin:`unknown`,packageName:null}},Ld=new Set([`role`,`name`,`aria-label`,`rel`,`href`]),Rd=e=>{if(!/^[a-z-]{3,}$/i.test(e))return!1;let t=e.split(/-|[A-Z]/);for(let e of t)if(e.length<=2||/[^aeiou]{4,}/i.test(e))return!1;return!0},zd=(e,t)=>{let n=Ld.has(e)||e.startsWith(`data-`)&&Rd(e),r=Rd(t)&&t.length<100||t.startsWith(`#`)&&Rd(t.slice(1));return n&&r},Bd=e=>{let t=e[0].name;for(let n=1;n<e.length;n++)t=`${e[n].name} > ${t}`;return t},Vd=e=>{let t=0;for(let n of e)t+=n.penalty;return t},Hd=(e,t)=>Vd(e)-Vd(t),Ud=(e,t)=>{let n=e.parentNode;if(!n)return;let r=n.firstChild;if(!r)return;let i=0;for(;r&&(r instanceof Element&&(t===void 0||r.tagName.toLowerCase()===t)&&i++,r!==e);)r=r.nextSibling;return i},Wd=(e,t)=>e===`html`?`html`:`${e}:nth-child(${t})`,Gd=(e,t)=>e===`html`?`html`:`${e}:nth-of-type(${t})`,Kd=(e,t)=>{let n=[],r=e.getAttribute(`id`),i=e.tagName.toLowerCase();r&&Rd(r)&&n.push({name:`#${CSS.escape(r)}`,penalty:0});for(let t of e.classList)Rd(t)&&n.push({name:`.${CSS.escape(t)}`,penalty:1});for(let r of e.attributes)t(r.name,r.value)&&n.push({name:`[${CSS.escape(r.name)}="${CSS.escape(r.value)}"]`,penalty:2});n.push({name:i,penalty:5});let a=Ud(e,i);a!==void 0&&n.push({name:Gd(i,a),penalty:10});let o=Ud(e);return o!==void 0&&n.push({name:Wd(i,o),penalty:50}),n},qd=(e,t=Pc,n=[])=>{if(t<=0)return[];if(e.length===0)return[n];let r=[];for(let i of e[0]){let a=t-r.length;if(a<=0)break;r.push(...qd(e.slice(1),a,[...n,i]))}return r},Jd=(e,t)=>{var n;let r=(n=t.getRootNode)==null?void 0:n.call(t);return r instanceof ShadowRoot?r:e instanceof Document?e:e.ownerDocument},Yd=(e,t)=>t.querySelectorAll(Bd(e)).length===1,Xd=(e,t)=>{let n=e,r=[];for(;n&&n!==t;){let e=n.tagName.toLowerCase(),t=Ud(n,e);if(t===void 0)return;r.push({name:Gd(e,t),penalty:10}),n=n.parentElement}return Yd(r,t)?r:void 0},Zd=(e,t,n,r)=>{if(e.nodeType!==Node.ELEMENT_NODE)throw new ud;if(e.tagName.toLowerCase()===`html`)return`html`;let i=Jd(t,e),a=Date.now(),o=[],s=e,c=0,l;for(;s&&s!==i&&!l;)if(o.push(Kd(s,r)),s=s.parentElement,c++,c>=3){let t=qd(o);t.sort(Hd);for(let r of t){if(Date.now()-a>n){let t=Xd(e,i);if(!t)throw new dd(n);return Bd(t)}if(Yd(r,i)){l=r;break}}}if(!l&&c<3){let e=qd(o);e.sort(Hd);for(let t of e){if(Date.now()-a>n)break;if(Yd(t,i)){l=t;break}}}if(!l)throw new fd;return Bd(l)},Qd=e=>{var t;return(t=e.ownerDocument.body)==null?e.ownerDocument.documentElement:t},$d=new Set([`data-testid`,`data-test-id`,`data-test`,`data-cy`,`data-qa`,`aria-label`,`href`,`src`,`role`,`name`,`title`,`alt`]),ef=e=>e.length>0&&e.length<=120,tf=(e,t)=>{try{let n=e.ownerDocument.querySelectorAll(t);return n.length===1&&n[0]===e}catch{return!1}},nf=e=>{if(e instanceof HTMLElement&&e.id){let t=`#${CSS.escape(e.id)}`;if(tf(e,t))return t}for(let t of $d){let n=e.getAttribute(t);if(!n||!ef(n))continue;let r=`[${t}=${JSON.stringify(n)}]`;if(tf(e,r))return r;let i=`${e.tagName.toLowerCase()}${r}`;if(tf(e,i))return i}return null},rf=e=>{let t=[],n=Qd(e),r=e;for(;r;){if(r instanceof HTMLElement&&r.id){t.unshift(`#${CSS.escape(r.id)}`);break}let e=r.parentElement;if(!e){t.unshift(r.tagName.toLowerCase());break}let i=Array.from(e.children).indexOf(r)+1;if(t.unshift(`${r.tagName.toLowerCase()}:nth-child(${i})`),e===n){t.unshift(n.tagName.toLowerCase());break}r=e}return t.join(` > `)},af=e=>{let t=nf(e);if(t)return t;try{let t=Zd(e,Qd(e),200,(e,t)=>zd(e,t)||$d.has(e)&&ef(t));if(t)return t}catch{}return rf(e)},of=e=>{if(!e)return!1;let t=`/${Gu(e)}/`.toLowerCase();return jc.some(e=>t.includes(e))},sf=e=>e.map(e=>`\n  in ${e}`).join(``),cf=[`about://React/`,`rsc://React/`],lf=e=>cf.some(t=>e.startsWith(t)),uf=e=>{for(let t of cf){if(!e.startsWith(t))continue;let n=e.indexOf(`/`,t.length);if(n===-1)continue;let r=n+1,i=e.lastIndexOf(`?`);return md(i>r?e.slice(r,i):e.slice(r))}return e},df=e=>{if(typeof e!=`object`||!e||!(`status`in e)||e.status!==`fulfilled`||!(`value`in e)||typeof e.value!=`object`||e.value===null||!(`originalStackFrame`in e.value))return null;let t=e.value.originalStackFrame;return typeof t!=`object`||!t||!(`file`in t)||typeof t.file!=`string`||!t.file||`ignored`in t&&t.ignored?null:{file:t.file,line1:`line1`in t&&typeof t.line1==`number`?t.line1:null,column1:`column1`in t&&typeof t.column1==`number`?t.column1:null}},ff=async(e,t)=>{let n=[],r=[];for(let t=0;t<e.length;t++){var i,a,o;let s=e[t];!s.isServer||!s.fileName||(n.push(t),r.push({file:uf(s.fileName),methodName:(i=s.functionName)==null?`<unknown>`:i,line1:(a=s.lineNumber)==null?null:a,column1:(o=s.columnNumber)==null?null:o,arguments:[]}))}if(r.length===0)return e;let s=new AbortController,c=setTimeout(()=>s.abort(),Mc),l=()=>s.abort();t!=null&&t.aborted&&s.abort(),t==null||t.addEventListener(`abort`,l);try{let t=await fetch(`${Yu()}/__nextjs_original-stack-frames`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({frames:r,isServer:!0,isEdgeServer:!1,isAppDirectory:!0}),priority:`high`,signal:s.signal});if(!t.ok)return e;let i=await t.json();if(!Array.isArray(i))return e;let a=[...e];for(let t=0;t<n.length;t++){var u,d;let r=df(i[t]);if(!r)continue;let o=n[t];a[o]={...e[o],fileName:r.file,lineNumber:(u=r.line1)==null?void 0:u,columnNumber:(d=r.column1)==null?void 0:d,isSymbolicated:!0}}return a}catch{return e}finally{clearTimeout(c),t==null||t.removeEventListener(`abort`,l)}},pf=e=>{let t=new Map;return _c(e,e=>{if(!ql(e))return!1;let n=nu(e._debugStack.stack);if(!n)return!1;for(let e of Cl(n))!e.functionName||!e.fileName||lf(e.fileName)&&(t.has(e.functionName)||t.set(e.functionName,{...e,isServer:!0}));return!1},!0),t},mf=(e,t)=>{if(!t.some(e=>e.isServer&&!e.fileName&&e.functionName))return t;let n=pf(e);return n.size===0?t:t.map(e=>{if(!e.isServer||e.fileName||!e.functionName)return e;let t=n.get(e.functionName);return t?{...e,fileName:t.fileName,lineNumber:t.lineNumber,columnNumber:t.columnNumber}:e})},hf=0,gf=[],_f=()=>hf<3?(hf+=1,Promise.resolve()):new Promise(e=>{gf.push(e)}),vf=()=>{let e=gf.shift();if(e){e();return}--hf},yf=async(e,t,n=Nc)=>{await _f();let r=new AbortController,i,a=new Promise(e=>{i=setTimeout(()=>{r.abort(),e(t)},n)}),o=e(r.signal);o.catch(()=>{});try{return await Promise.race([o,a])}finally{clearTimeout(i),vf()}},bf=(e,t)=>e.length>t?`${e.slice(0,t)}...`:e,xf=e=>e.startsWith(`data-react-grab-`),Sf=e=>e.replace(/\s+/g,` `).trim(),Cf=e=>{let t=[];for(let r of e.childNodes){var n;if(r.nodeType!==Node.TEXT_NODE)continue;let e=Sf((n=r.textContent)==null?``:n);e&&t.push(e)}return t.join(` `)},wf=e=>e.getAttribute(`aria-hidden`)===`true`||e.hasAttribute(`hidden`)?!0:Lc.has(e.tagName.toLowerCase()),Tf=(e,t,n)=>{if(e.nodeType===Node.TEXT_NODE){var r;let i=Sf((r=e.textContent)==null?``:r);return i?(t.push(i),n-i.length):n}if(!(e instanceof Element)||wf(e))return n;for(let r of e.childNodes)if(n=Tf(r,t,n),n<=0)break;return n},Ef=(e,t)=>{if(wf(e))return``;let n=Cf(e);if(!Ic.has(t)||n&&e.children.length===0)return n;let r=[];return Tf(e,r,100),r.join(` `)},Df=e=>bf(e,15),Of=e=>e===`class`||e===`className`||e===`style`,kf=e=>{let t=[],n=[],r=``;for(let{name:i,value:a}of e.attributes)if(!xf(i)){if(Of(i)){i!==`style`&&a&&(r=` class="${Df(a)}"`);continue}Fc.has(i)?t.push(a?` ${i}="${a}"`:` ${i}`):a&&n.push(` ${i}="${Df(a)}"`)}return t.join(``)+n.join(``)+r},Af=e=>e.length===0?``:e.length<=2?e.map(e=>`<${Bc(e)} ...>`).join(`
  `):`(${e.length} elements)`,jf=e=>{let t=Bc(e),n=kf(e),r=Ef(e,t),i=[],a=[],o=!1;for(let t of e.childNodes)t.nodeType!==Node.COMMENT_NODE&&(t.nodeType===Node.TEXT_NODE?t.textContent&&t.textContent.trim().length>0&&(o=!0):t instanceof Element&&(o?a.push(t):i.push(t)));let s=r.length>0&&Ic.has(t),c=``,l=Af(i);l&&!s&&(c+=`\n  ${l}`),r&&(c+=`\n  ${bf(r,100)}`);let u=Af(a);return u&&!s&&(c+=`\n  ${u}`),c.length>0?`<${t}${n}>${c}\n</${t}>`:`<${t}${n} />`},Mf=new Set([`_`,`$`,`motion.`,`styled.`,`chakra.`,`ark.`,`Primitive.`,`Slot.`]),Nf=new Set(`AppRouter.AppRouterAnnouncer.AppDevOverlay.AppDevOverlayErrorBoundary.ClientPageRoot.ClientSegmentRoot.DevRootHTTPAccessFallbackBoundary.ErrorBoundary.ErrorBoundaryHandler.GracefulDegradeBoundary.HTTPAccessErrorFallback.HTTPAccessFallbackBoundary.HTTPAccessFallbackErrorBoundary.HandleRedirect.Head.HistoryUpdater.HotReload.InnerLayoutRouter.InnerScrollAndFocusHandler.InnerScrollAndFocusHandlerOld.InnerScrollAndMaybeFocusHandler.InnerScrollHandlerNew.LoadableComponent.LoadingBoundary.LoadingBoundaryProvider.NotAllowedRootHTTPFallbackError.OfflineProvider.OuterLayoutRouter.RedirectBoundary.RedirectErrorBoundary.RenderFromTemplateContext.RenderValidationBoundaryAtThisLevel.ReplaySsrOnlyErrors.RootErrorBoundary.RootLevelDevOverlayElement.Router.ScrollAndFocusHandler.ScrollAndMaybeFocusHandler.SegmentBoundaryTrigger.SegmentBoundaryTriggerNode.SegmentStateProvider.SegmentTrieNode.SegmentViewNode.SegmentViewStateNode.ServerRoot.body.html`.split(`.`)),Pf=new Set([`Suspense`,`Fragment`,`StrictMode`,`Profiler`,`SuspenseList`]),Ff=new Set([`MotionDOMComponent`]),If=e=>{if(Nf.has(e)||Pf.has(e)||Ff.has(e))return!0;for(let t of Mf)if(e.startsWith(t))return!0;return!1},Lf=e=>!(!e||If(e)||e===`SlotClone`||e===`Slot`),Rf=e=>!(e.length<=1||If(e)||e[0]!==e[0].toUpperCase()||e.endsWith(`Provider`)||e.endsWith(`Context`)),zf=e=>e&&Rf(e)?e:null,Bf=e=>{if(!ll())return e;let t=e;for(;t;){if(fl(t))return t;t=t.parentElement}return e},Vf=e=>{if(!ll())return null;let t=fl(Bf(e)),n=0;for(;t;){if(t.key)return t.key;if(il(t)&&(n+=1,n===2))break;t=t.return}return null},Hf=new WeakMap,Uf=new WeakMap,Wf=e=>t=>fetch(t,{signal:e,priority:`high`}),Gf=e=>yf(async t=>{try{let n=fl(e);if(!n)return null;let r=await cu(n,!0,Wf(t));return qu()?await ff(mf(n,r),t):r}catch{return null}},null),Kf=e=>{if(!ll())return Promise.resolve([]);let t=Bf(e),n=Hf.get(t);if(n)return n;let r=Gf(t).then(e=>(e===null&&Hf.delete(t),e));return Hf.set(t,r),r},qf=e=>{var t,n;return(t=(n=e.find(e=>!!zf(e.functionName)))==null?e[0]:n)==null?null:t},Jf=e=>!e||!il(e)?null:zf(cl(e.type)),Yf=e=>yf(async t=>{let n=fl(Bf(e));if(!n)return null;try{var r,i,a;let e=await uu(n,!0,Wf(t));return e!=null&&e.fileName?{filePath:Gu(e.fileName),lineNumber:(r=e.lineNumber)==null?null:r,columnNumber:(i=e.columnNumber)==null?null:i,componentName:(a=zf(e.functionName))==null?Jf(n._debugOwner):a,origin:Id(e.fileName).origin}:null}catch{return null}},null),Xf=e=>{let t=Bf(e),n=Uf.get(t);if(n)return n;let r=Yf(t).then(e=>(e||Uf.delete(t),e));return Uf.set(t,r),r},Zf=[`app`,`package`],Qf=(e,t)=>{for(let i of Zf){var n,r;if((e==null?void 0:e.origin)===i)return e;let a=qf(t.filter(e=>Id(e.fileName).origin===i));if(a!=null&&a.fileName)return{filePath:Gu(a.fileName),lineNumber:(n=a.lineNumber)==null?null:n,columnNumber:(r=a.columnNumber)==null?null:r,componentName:zf(a.functionName),origin:i}}return null},$f=async e=>{var t;let n=await Xf(e);return(n==null?void 0:n.origin)===`app`?n:Qf(n,(t=await Kf(e))==null?[]:t)},ep=e=>{var t;return(t=tp(Bf(e),1)[0])==null?null:t},tp=(e,t,n=()=>!0)=>{if(!ll())return[];let r=fl(e);if(!r)return[];let i=[];return _c(r,e=>{if(i.length>=t)return!0;if(il(e)){let t=cl(e.type);t&&Lf(t)&&n(t)&&i.push(t)}return!1},!0),i},np=[`/src/app/`,`/src/pages/`,`/app/`,`/pages/`],rp=(e,t)=>{let n=Gu(e);if(!t||!n.startsWith(`/`))return n;for(let e of np){let t=n.indexOf(e);if(t!==-1)return`/./${n.slice(t+1)}`}return n},ip=(e,t)=>{let n=rp(e.filePath,t),r=t&&e.lineNumber?`${n}:${e.lineNumber}${e.columnNumber?`:${e.columnNumber}`:``}`:n;return e.componentName?`\n  in ${e.componentName} (at ${r})`:`\n  in ${r}`},ap={isAppSource:!1,consumesBudget:!1},op=(e,t,n,r)=>{var i,a;let o=t.packageName,s=t.origin===`app`?e.fileName:null;if(e.isServer&&!s&&(n||!e.functionName)){let e=o?`${o} at Server`:`at Server`;return{text:`\n  in ${n==null?`<anonymous>`:n} (${e})`,...ap}}return!s&&n?{text:o?`\n  in ${n} (${o})`:`\n  in ${n}`,...ap}:o?{text:`\n  in ${o}`,...ap}:s?{text:ip({componentName:n,filePath:s,lineNumber:(i=e.lineNumber)==null?null:i,columnNumber:(a=e.columnNumber)==null?null:a},r),isAppSource:!0,consumesBudget:!of(s)}:null},sp=(e,t={},n=null)=>{let r=pd(t.maxLines),i=Math.max(r,20),a=qu(),o=[],s=new Set,c=null,l=!1,u=!1,d=!1,f=0,p=e=>{e&&s.add(e)};n&&(u=n.origin===`app`,of(n.filePath)||(f+=1),p(n.componentName),o.push(ip(n,a)));for(let t of e){if(f>=r||o.length>=i)break;let e=Id(t.fileName),s=zf(t.functionName),m=e.packageName?`${e.packageName}:${s==null?``:s}:${t.isServer?`server`:`client`}`:null;if(m&&m===c)continue;if(!l&&s&&s===(n==null?void 0:n.componentName)){l=!0;continue}let h=op(t,e,s,a);h!==null&&h.text!==o[o.length-1]&&(h.isAppSource&&(u=!0),h.consumesBudget&&(f+=1,d=!0),p(s),o.push(h.text),c=m)}return{text:o.join(``),shouldAppendSelectorHint:!u,hasBudgetedStackFrame:d,renderedComponentNames:s}},cp=async e=>{let t=await Xf(e);return(t==null?void 0:t.origin)===`app`?t:null},lp=(e,t,n)=>{let r=tp(Bf(e),n,e=>Rf(e)&&!t.renderedComponentNames.has(e));return r.length===0?t:{...t,text:`${t.text}${sf(r)}`}},up=async(e,t={})=>{let n=await cp(e),r=await Kf(e),i=pd(t.maxLines),a=sp(r==null?[]:r,t,n);if(a.text)return a.hasBudgetedStackFrame?a:lp(e,a,i);let o=tp(Bf(e),i);return{text:sf(o),shouldAppendSelectorHint:!0,hasBudgetedStackFrame:!1,renderedComponentNames:new Set(o)}},dp=async(e,t={})=>(await up(e,t)).text,fp=(e,t)=>{let n=Vf(e),r=n===null?``:`\n  key: "${n}"`,i=t.shouldAppendSelectorHint?`\n  selector: ${af(e)}`:``;return`${t.text}${r}${i}`},pp=async(e,t={})=>{let n=Bf(e);return`${jf(n)}${fp(n,await up(n,t))}`}})),hp,gp,_p,vp,yp,bp,xp,Sp,Cp=r((()=>{cd(),mp(),hp=new Map([`top`,`right`,`bottom`,`left`].flatMap(e=>[[`border-${e}-style`,e],[`border-${e}-color`,e]])),gp=null,_p=new Map,vp=()=>gp||(gp=document.createElement(`iframe`),gp.style.cssText=`position:fixed;left:-9999px;width:0;height:0;border:none;visibility:hidden;`,document.body.appendChild(gp),gp),yp=e=>{let t=_p.get(e);if(t)return t;let n=vp(),r=n.contentDocument,i=r.createElement(e);r.body.appendChild(i);let a=n.contentWindow.getComputedStyle(i),o=new Map;for(let e of zc){let t=a.getPropertyValue(e);t&&o.set(e,t)}return i.remove(),_p.set(e,o),o},bp=(e,t)=>{let n=hp.get(e);if(!n)return!1;let r=t.getPropertyValue(`border-${n}-width`);return r===`0px`||r===`0`},xp=e=>{var t;let n=yp(e.tagName.toLowerCase()),r=getComputedStyle(e),i=[];for(let e of zc){let t=r.getPropertyValue(e);t&&t!==n.get(e)&&(bp(e,r)||i.push(`${e}: ${t};`))}let a=(t=e.getAttribute(`class`))==null?void 0:t.trim(),o=i.join(`
`);return a?o?`className: ${a}\n\n${o}`:`className: ${a}`:o},Sp=async e=>{var t,n,r;let[i,a,o]=await Promise.all([pp(e),$f(e),Kf(e).then(e=>e==null?[]:e)]),s=await dp(e),c=jf(e),l=ep(e),u=fl(e),d=af(e),f=xp(e);return{element:e,snippet:i,htmlPreview:c,stackString:s,stack:o,componentName:l,filePath:(t=a==null?void 0:a.filePath)==null?null:t,lineNumber:(n=a==null?void 0:a.lineNumber)==null?null:n,columnNumber:(r=a==null?void 0:a.columnNumber)==null?null:r,fiber:u,selector:d,styles:f}}})),wp,Tp=r((()=>{Cp(),wp=async e=>{try{let t=await Sp(e),n=`${t.htmlPreview}${t.stackString}`;return n.trim()?(await navigator.clipboard.writeText(n),!0):!1}catch{return!1}}})),Ep,Dp=r((()=>{Ep=()=>{var e,t;let n=(e=(t=window).getSelection)==null?void 0:e.call(t);return!!(n&&n.toString().length>0)}})),Op,kp=r((()=>{Op=()=>{let e=document.activeElement;if(!e)return!1;let t=e.tagName;return!!(t===`INPUT`||t===`TEXTAREA`||t===`SELECT`||e instanceof HTMLElement&&e.isContentEditable)}})),Ap,jp=r((()=>{Ap=()=>{if(typeof navigator>`u`)return!1;let e=navigator.platform||``;return e?/Mac|iPhone|iPad|iPod/i.test(e):/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)}})),Mp,Np=r((()=>{Mp=()=>typeof window<`u`&&!!window.__REACT_GRAB__})),Pp,Fp,Ip,Lp,Rp,zp,Bp,Vp,Hp,Up,Wp,Gp,Kp=r((()=>{I(),Pp=1e3,Fp={lastRendered:new Map,expandedPaths:new Set},Ip={updates:[],currentFiber:null,totalUpdates:0,windowOffset:0,currentIndex:0,isViewingHistory:!1,latestFiber:null,isVisible:!1,playbackSpeed:1},[Lp,Rp]=T(Ip),[zp,Bp]=T(0),Vp=()=>{Bp(e=>e+1)},Hp=[],Up=null,Wp=()=>{if(Hp.length===0)return;let e=[...Hp],{updates:t,totalUpdates:n,currentIndex:r,isViewingHistory:i}=Lp(),a=[...t],o=n;for(let{update:t}of e)a.length>=1e3&&a.shift(),a.push(t),o++;let s=Math.max(0,o-Pp),c;c=i?r===n-1?a.length-1:r===0?0:s===0?r:r-1:a.length-1;let l=e[e.length-1];Rp({...Lp(),latestFiber:l.fiber,updates:a,totalUpdates:o,windowOffset:s,currentIndex:c,isViewingHistory:i}),Hp=Hp.slice(e.length)},Gp={showTimeline:()=>{Rp({...Lp(),isVisible:!0})},hideTimeline:()=>{let e=Lp();Rp({...e,isVisible:!1,currentIndex:e.updates.length-1})},updateFrame:(e,t)=>{Rp({...Lp(),currentIndex:e,isViewingHistory:t})},updatePlaybackSpeed:e=>{Rp({...Lp(),playbackSpeed:e})},addUpdate:(e,t)=>{if(Hp.push({update:e,fiber:t}),!Up){let e=()=>{Wp(),Up=null,Hp.length>0&&(Up=setTimeout(e,96))};Up=setTimeout(e,96)}},reset:()=>{Up&&(clearTimeout(Up),Up=null),Hp=[],Rp(Ip)}}})),qp,Jp,Yp,Xp,Zp,Qp,$p=r((()=>{G(),I(),In(),Z(),Kp(),qp=B(`<span class="text-[10px] text-neutral-400">×`),Jp=B(`<span class="flex items-center gap-x-1"><span class="flex items-center gap-x-1 text-[10px] text-purple-400">`),Yp=B(`<span>`),Xp=B(`<span class=text-yellow-300>✨`),Zp=B(`<div class="absolute inset-0 flex translate-y-0 items-center gap-x-2 transition-transform duration-300"><div class="flex items-center gap-x-2 mr-auto text-xs text-[#888]"><span class="with-data-text cursor-pointer !overflow-visible"title="Click to toggle between rerenders and total renders"></span><span class="with-data-text !overflow-visible">`),Qp=()=>{let e,t,n=O(()=>{let e=L();return e.kind===`focused`?e.fiber:null});D(()=>{let n=Lp();$e(()=>{if(L().kind!==`focused`||!e||!t)return;let{totalUpdates:r,currentIndex:i,updates:a,isVisible:o,windowOffset:s}=n,c=Math.max(0,r-1),l=o?`#${s+i} Re-render`:c>0?`×${c}`:``,u;if(c>0&&i>=0&&i<a.length){var d;let e=(d=a[i])==null||(d=d.fiberInfo)==null?void 0:d.selfTime;u=e>0?e<.1-2**-52?`< 0.1ms`:`${Number(e.toFixed(1))}ms`:void 0}e.dataset.text=l?` • ${l}`:``,t.dataset.text=u?` • ${u}`:``})});let r=O(()=>{let e=n();if(!e)return null;let{name:t,wrappers:r,wrapperTypes:i}=Ms(e),a=r.length?`${r.join(`(`)}(${t})${`)`.repeat(r.length)}`:t==null?``:t,o=i[0];return(()=>{var e=Jp(),n=e.firstChild;return V(e,`title`,a),U(e,t==null?`Unknown`:t,n),U(n,A(j,{when:o,children:e=>[(()=>{var t=Yp();return U(t,()=>e().type),E(()=>H(t,X(`rounded py-[1px] px-1`,`truncate`,e().compiler&&`bg-purple-800 text-neutral-400`,!e().compiler&&`bg-neutral-700 text-neutral-300`,e().type===`memo`&&`bg-[#5f3f9a] text-white`))),t})(),A(j,{get when(){return e().compiler},get children(){return Xp()}})]})),U(e,A(j,{get when(){return i.length>1},get children(){var e=qp();return e.firstChild,U(e,()=>i.length-1,null),e}}),null),E(()=>V(n,`title`,o==null?void 0:o.title)),e})()});return(()=>{var n=Zp(),i=n.firstChild,a=i.firstChild,o=a.nextSibling;U(n,r,i);var s=e;typeof s==`function`?wa(s,a):e=a;var c=t;return typeof c==`function`?wa(c,o):t=o,n})()}})),em,tm,nm,rm=r((()=>{G(),I(),In(),Ka(),na(),gc(),Ks(),Tp(),Dp(),Z(),kp(),jp(),Np(),$p(),em=B(`<button type=button class=react-scan-close-button>`),tm=B(`<div class=react-scan-header><div class="relative flex-1 h-full"><div></div></div><button type=button title=Close class=react-scan-close-button>`),nm=()=>{let e=hc(()=>L().kind===`focused`,150,0),[t,n]=T(!1),r,i=()=>{Bs({view:`none`}),kn({kind:`inspect-off`})},a=async()=>{let e=L();e.kind!==`focused`||!e.focusedDomElement||await wp(e.focusedDomElement)&&(n(!0),r=setTimeout(()=>{n(!1),i()},600))};tt(()=>{let e=e=>{let t=L();t.kind!==`focused`||!t.focusedDomElement||Mp()||(e.metaKey||e.ctrlKey)&&(e.shiftKey||e.altKey||e.key!==`c`&&e.code!==`KeyC`||Op()||Ep()||(e.preventDefault(),e.stopImmediatePropagation(),a()))};document.addEventListener(`keydown`,e,{capture:!0}),k(()=>{document.removeEventListener(`keydown`,e,{capture:!0}),clearTimeout(r)})});let o=()=>L().kind===`focused`,s=Ap()?`⌘C`:`Ctrl+C`;return A(j,{get when(){return zs().view!==`notifications`},get children(){var n=tm(),r=n.firstChild,c=r.firstChild,l=r.nextSibling;return U(c,A(Qp,{})),U(n,A(j,{get when(){return o()},get children(){var e=em();return e.$$click=a,V(e,`title`,`Copy element (${s})`),U(e,A(K,{get name(){return t()?`icon-check`:`icon-copy`},get class(){return X(t()&&`text-green-500`)}})),e}}),l),l.$$click=i,U(l,A(K,{name:`icon-close`})),E(()=>H(c,X(`react-scan-header-item is-visible`,!e()&&`!duration-0`))),n}})},ga([`click`])})),im,am=r((()=>{im=e=>{let t=[],n=e;for(;n;){var r;let e=n.elementType,i=typeof e==`function`?e.displayName||e.name:typeof e==`string`?e:`Unknown`,a=n.index===void 0?``:`[${n.index}]`;t.unshift(`${i}${a}`),n=(r=n.return)==null?null:r}return t.join(`::`)}}));function om(e){let t=e.replace(/\s+/g,` `).trim(),n=[],r=``;for(let e=0;e<t.length;e++){let i=t[e];if(i===`=`&&t[e+1]===`>`){r.trim()&&n.push(r.trim()),n.push(`=>`),r=``,e++;continue}/[(){}[\];,<>:?!]/.test(i)?(r.trim()&&n.push(r.trim()),n.push(i),r=``):/\s/.test(i)?(r.trim()&&n.push(r.trim()),r=``):r+=i}r.trim()&&n.push(r.trim());let i=[];for(let e=0;e<n.length;e++){let t=n[e],r=n[e+1];t===`(`&&r===`)`||t===`[`&&r===`]`||t===`{`&&r===`}`||t===`<`&&r===`>`?(i.push(t+r),e++):i.push(t)}let a=new Set,o=new Set;function s(e,t,n){let r=0;for(let a=n;a<i.length;a++){let n=i[a];if(n===e)r++;else if(n===t&&(r--,r===0))return a}return-1}for(let e=0;e<i.length;e++)if(i[e]===`(`){let t=s(`(`,`)`,e);if(t!==-1&&i[t+1]===`=>`)for(let n=e;n<=t;n++)a.add(n)}for(let e=1;e<i.length;e++){let t=i[e-1],n=i[e];if(/^[a-zA-Z0-9_$]+$/.test(t)&&n===`<`){let t=s(`<`,`>`,e);if(t!==-1)for(let n=e;n<=t;n++)o.add(n)}}let c=0,l=[],u=``;function d(){u.trim()&&l.push(u.replace(/\s+$/,``)),u=``}function f(){d(),u=`  `.repeat(c)}let p=[];function m(){return p.length?p[p.length-1]:null}function h(e,t=!1){u.trim()?t||/^[),;:\].}>]$/.test(e)?u+=e:u+=` ${e}`:u+=e}for(let e=0;e<i.length;e++){let t=i[e],n=i[e+1]||``;if([`(`,`{`,`[`,`<`].includes(t))h(t),p.push(t),t===`{`?(c++,f()):(t===`(`||t===`[`||t===`<`)&&(a.has(e)&&t===`(`||o.has(e)&&t===`<`||n!=={"(":`)`,"[":`]`,"<":`>`}[t]&&n!==`()`&&n!==`[]`&&n!==`<>`&&(c++,f()));else if([`)`,`}`,`]`,`>`].includes(t)){let n=m();t===`)`&&n===`(`||t===`]`&&n===`[`||t===`>`&&n===`<`?!(a.has(e)&&t===`)`)&&!(o.has(e)&&t===`>`)&&(c=Math.max(c-1,0),f()):t===`}`&&n===`{`&&(c=Math.max(c-1,0),f()),p.pop(),h(t),t===`}`&&f()}else if(/^\(\)|\[\]|\{\}|<>$/.test(t))h(t);else if(t===`=>`)h(t);else if(t===`;`)h(t,!0),f();else if(t===`,`){h(t,!0);let n=m();!(a.has(e)&&n===`(`)&&!(o.has(e)&&n===`<`)&&n&&[`{`,`[`,`(`,`<`].includes(n)&&f()}else h(t)}return d(),l.join(`
`).replace(/\n\s*\n+/g,`
`).trim()}var sm,cm,lm,um,dm,fm,pm,mm,hm,gm,_m,vm,ym,bm,xm,Sm,Cm,wm=r((()=>{Ge(),Kx(),vr(),sm=e=>{let t=e;for(;t;){if(t.stateNode instanceof Element)return t.stateNode;if(!t.child)break;t=t.child}for(;t;){if(t.stateNode instanceof Element)return t.stateNode;if(!t.return)break;t=t.return}return null},cm=e=>{if(!e)return null;try{let t=mr(e);if(!t)return null;let n=hr(t);return n?n[0]:null}catch{return null}},lm=(e,t)=>!!re(t,t=>t===e),um=async e=>{let t=cm(e);if(!t)return null;let n=sm(t);return n?await new Promise(e=>{let t=new IntersectionObserver(n=>{var r,i;t.disconnect(),e((r=(i=n[0])==null?void 0:i.boundingClientRect)==null?null:r)});t.observe(n)}):null},dm=e=>{let t=cm(e);if(!t||!sm(t))return{};let n=hr(t);if(!n)return{};let[r]=n;return{parentCompositeFiber:r}},fm=(e,t)=>{var n,r,i;if(!e.isConnected)return{};let a=t==null?cm(e):t;if(!a)return{};let o=a,s=null,c=null;for(;o;){var l;if(!o.stateNode){o=o.return;continue}if((l=Ax.instrumentation)!=null&&l.fiberRoots.has(o.stateNode)){s=o,c=o.stateNode.current;break}o=o.return}if(!s||!c||(a=lm(a,c)||(n=a.alternate)==null?a:n,!a)||!sm(a))return{};let u=(r=hr(a))==null?void 0:r[0];return u?{parentCompositeFiber:lm(u,c)||(i=u.alternate)==null?u:i}:{}},pm=new Set([`HTML`,`HEAD`,`META`,`TITLE`,`BASE`,`SCRIPT`,`SCRIPT`,`STYLE`,`LINK`,`NOSCRIPT`,`SOURCE`,`TRACK`,`EMBED`,`OBJECT`,`PARAM`,`TEMPLATE`,`PORTAL`,`SLOT`,`AREA`,`XML`,`DOCTYPE`,`COMMENT`]),mm=(e,t=!0)=>{if(e.stateNode&&`nodeType`in e.stateNode){let n=e.stateNode;return t&&n.tagName&&pm.has(n.tagName)?null:n}let n=e.child;for(;n;){let e=mm(n,t);if(e)return e;n=n.sibling}return null},hm=(e=document.body)=>{let t=[],n=e=>{if(!e)return null;let{parentCompositeFiber:t}=dm(e);return t&&mm(t)===e?e:null},r=(e,i=0)=>{let a=n(e);if(a){var o;let{parentCompositeFiber:e}=dm(a);if(!e)return;t.push({element:a,depth:i,name:(o=ye(e.type))==null?`Unknown`:o,fiber:e})}for(let t of Array.from(e.children))r(t,a?i+1:i)};return r(e),t},gm=e=>{try{if(e===null)return`null`;if(e===void 0)return`undefined`;if(_r(e))return`Promise`;if(typeof e==`function`){let t=e.toString();try{return t.replace(/\s+/g,` `).replace(/{\s+/g,`{
  `).replace(/;\s+/g,`;
  `).replace(/}\s*$/g,`
}`).replace(/\(\s+/g,`(`).replace(/\s+\)/g,`)`).replace(/,\s+/g,`, `)}catch{return t}}switch(!0){case e instanceof Date:return e.toISOString();case e instanceof RegExp:return e.toString();case e instanceof Error:return`${e.name}: ${e.message}`;case e instanceof Map:return JSON.stringify(Array.from(e.entries()),null,2);case e instanceof Set:return JSON.stringify(Array.from(e),null,2);case e instanceof DataView:return JSON.stringify(Array.from(new Uint8Array(e.buffer)),null,2);case e instanceof ArrayBuffer:return JSON.stringify(Array.from(new Uint8Array(e)),null,2);case ArrayBuffer.isView(e)&&`length`in e:return JSON.stringify(Array.from(e),null,2);case Array.isArray(e):return JSON.stringify(e,null,2);case typeof e==`object`:return JSON.stringify(e,null,2);default:return String(e)}}catch{return String(e)}},_m=(e,t)=>{try{return typeof e!=`function`||typeof t!=`function`?!1:e.toString()===t.toString()}catch{return!1}},vm=(e,t,n=[],r=new WeakSet)=>{if(e===t)return{type:`primitive`,changes:[],hasDeepChanges:!1};if(typeof e==`function`&&typeof t==`function`){let r=_m(e,t);return{type:`primitive`,changes:[{path:n,prevValue:e,currentValue:t,sameFunction:r}],hasDeepChanges:!r}}if(e===null||t===null||e===void 0||t===void 0||typeof e!=`object`||typeof t!=`object`)return{type:`primitive`,changes:[{path:n,prevValue:e,currentValue:t}],hasDeepChanges:!0};if(r.has(e)||r.has(t))return{type:`object`,changes:[{path:n,prevValue:`[Circular]`,currentValue:`[Circular]`}],hasDeepChanges:!1};r.add(e),r.add(t);let i=e,a=t,o=new Set([...Object.keys(i),...Object.keys(a)]),s=[],c=!1;for(let e of o){let t=i[e],o=a[e];if(t!==o)if(typeof t==`object`&&typeof o==`object`&&t!==null&&o!==null){let i=vm(t,o,[...n,e],r);s.push(...i.changes),i.hasDeepChanges&&(c=!0)}else s.push({path:[...n,e],prevValue:t,currentValue:o}),c=!0}return{type:`object`,changes:s,hasDeepChanges:c}},ym=e=>e.length===0?``:e.reduce((e,t,n)=>/^\d+$/.test(t)?`${e}[${t}]`:n===0?t:`${e}.${t}`,``),bm=(e,t=!1)=>{try{let n=e.toString(),r=n.match(/(?:function\s*)?(?:\(([^)]*)\)|([^=>\s]+))\s*=>?/);if(!r)return`ƒ`;let i=(r[1]||r[2]||``).replace(/\s+/g,``);return t?om(n):`ƒ (${i}) => ...`}catch{return`ƒ`}},xm=e=>{if(e===null)return`null`;if(e===void 0)return`undefined`;if(typeof e==`string`)return`"${e.length>150?`${e.slice(0,20)}...`:e}"`;if(typeof e==`number`||typeof e==`boolean`)return String(e);if(typeof e==`function`)return bm(e);if(Array.isArray(e))return`Array(${e.length})`;if(e instanceof Map)return`Map(${e.size})`;if(e instanceof Set)return`Set(${e.size})`;if(e instanceof Date)return e.toISOString();if(e instanceof RegExp)return e.toString();if(e instanceof Error)return`${e.name}: ${e.message}`;if(typeof e==`object`){let t=Object.keys(e);return`{${t.length>2?`${t.slice(0,2).join(`, `)}, ...`:t.join(`, `)}}`}return String(e)},Sm=e=>{if(e==null||typeof e==`function`||typeof e!=`object`)return{value:e};if(_r(e))return{value:`Promise`};try{var t;let n=Object.getPrototypeOf(e);return n===Promise.prototype||(n==null||(t=n.constructor)==null?void 0:t.name)===`Promise`?{value:`Promise`}:{value:e}}catch{return{value:null,error:`Error accessing value`}}},Cm=e=>{var t,n;let r=w(e);return{displayName:ye(e)||`Unknown`,type:e.type,key:e.key,id:e.index,selfTime:(t=r==null?void 0:r.selfTime)==null?null:t,totalTime:(n=r==null?void 0:r.totalTime)==null?null:n}}})),Tm,Em,Dm,Om,km=r((()=>{I(),[Tm,Em]=T({query:``,matches:[],currentMatchIndex:-1}),[Dm,Om]=T(!1)})),Am,jm=r((()=>{I(),Am=e=>{let[t,n]=T(0),[r,i]=T(0),a=e.estimateSize(),o=new Map,s;tt(()=>{let t=e.getScrollElement();if(!t)return;let r=()=>{i(t.getBoundingClientRect().height)},a=()=>{s!==void 0&&cancelAnimationFrame(s),s=requestAnimationFrame(()=>{r(),s=void 0})},o=()=>{n(t.scrollTop)};r();let c=new ResizeObserver(a);c.observe(t),t.addEventListener(`scroll`,o,{passive:!0});let l=new MutationObserver(a);l.observe(t,{attributes:!0,childList:!0,subtree:!0}),k(()=>{t.removeEventListener(`scroll`,o),c.disconnect(),l.disconnect(),s!==void 0&&cancelAnimationFrame(s)})});let c=O(()=>{let n=Math.floor(t()/a),i=Math.ceil(r()/a);return{start:Math.max(0,n-e.overscan),end:Math.min(e.count(),n+i+e.overscan)}});return{virtualItems:O(()=>{let e=[],t=c();for(let n=t.start;n<t.end;n++){let t=o.get(n);t||(t={key:n,index:n,start:n*a},o.set(n,t)),e.push(t)}return e}),totalSize:()=>e.count()*a}}})),Mm,Nm,Pm,Fm,Im,Lm,Rm,zm,Bm,Vm,Hm,Um,Wm,Gm,Km,qm,Jm,Ym,Xm,Zm,Qm,$m,eh,th=r((()=>{G(),I(),In(),pr(),Ka(),na(),Ks(),Z(),am(),Kp(),wm(),km(),jm(),Mm=B(`<span class=truncate>`),Nm=B(`<span class=tree-node-search-highlight>`),Pm=B(`<span>`),Fm=B(`<span class=tree-node-search-highlight><span class=single>`),Im=B(`<span><span class=count-badge>×`),Lm=B(`<span class="text-yellow-300 ml-1">✨`),Rm=B(`<div role=button tabindex=0><button type=button>`),zm=B(`<span class="flex items-center gap-x-0.5 text-xs text-neutral-500">|`),Bm=B(`<button type=button class="button rounded w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-300">`),Vm=B(`<div class="react-scan-components-tree flex"><div class="relative resize-v-line"><span></span></div><div class="flex flex-col h-full"><div class="p-2 border-b border-[#1e1e1e]"><div title="Search components by:

• Name (e.g., &quot;Button&quot;) — Case insensitive, matches any part

• Regular Expression (e.g., &quot;/^Button/&quot;) — Use forward slashes

• Wrapper Type (e.g., &quot;[memo,forwardRef]&quot;):
   - Available types: memo, forwardRef, lazy, suspense
   - Matches any part of type name (e.g., &quot;mo&quot; matches &quot;memo&quot;)
   - Use commas for multiple types

• Combined Search:
   - Mix name/regex with type: &quot;button [for]&quot;
   - Will match components satisfying both conditions

• Navigation:
   - Enter → Next match
   - Shift + Enter → Previous match
   - Cmd/Ctrl + Enter → Select and focus match
"><div class="relative flex-1 h-7 overflow-hidden"><input type=text class="absolute inset-y-0 inset-x-1"placeholder="Component name, /regex/, or [type]"></div></div></div><div class="flex-1 overflow-hidden"><div class="tree h-full overflow-auto will-change-transform"><div class="relative w-full">`),Hm=B(`<span class="text-xs text-neutral-500">`),Um=B(`<div style=height:28px><div class="w-full h-full">`),Wm=(e,t=0,n=null)=>e.reduce((e,r,i)=>{var a,o;let s=r.element?im(r.fiber):`${n}-${i}`,c=(a=r.fiber)!=null&&a.type?Un(r.fiber):void 0,l={...r,depth:t,nodeId:s,parentId:n,fiber:r.fiber,renderData:c};return e.push(l),(o=r.children)!=null&&o.length&&e.push(...Wm(r.children,t+1,s)),e},[]),Gm=e=>e.reduce((e,t)=>Math.max(e,t.depth),0),Km=(e,t)=>{if(t<=0)return 24;let n=Math.max(0,e-240);if(n<24)return 0;let r=Math.min(n*.3,t*24)/t;return Math.max(0,Math.min(24,r))},qm=[`memo`,`forwardRef`,`lazy`,`suspense`],Jm=e=>{let t=e.match(/\[(.*?)\]/);if(!t)return null;let n=[],r=t[1].split(`,`);for(let e of r){let t=e.trim().toLowerCase();t&&n.push(t)}return n},Ym=e=>{if(e.length===0)return!1;for(let t of e){let e=!1;for(let n of qm)if(n.toLowerCase().includes(t)){e=!0;break}if(!e)return!1}return!0},Xm=(e,t)=>{if(e.length===0)return!0;if(!t.length)return!1;for(let n of e){let e=!1;for(let r of t)if(r.type.toLowerCase().includes(n)){e=!0;break}if(!e)return!1}return!0},Zm=(e,t)=>O(()=>{let n=e(),{query:r,matches:i}=t(),a=i.some(e=>e.nodeId===n.nodeId),o=Jm(r)||[],s=r?r.replace(/\[.*?\]/,``).trim():``;if(!r||!a)return{highlightedText:(()=>{var e=Mm();return U(e,()=>n.label),e})(),typeHighlight:!1};let c=!0;if(o.length>0)if(!n.fiber)c=!1;else{let{wrapperTypes:e}=Ms(n.fiber);c=Xm(o,e)}let l=(()=>{var e=Mm();return U(e,()=>n.label),e})();if(s)try{if(s.startsWith(`/`)&&s.endsWith(`/`)){let e=s.slice(1,-1),t=RegExp(`(${e})`,`i`),r=n.label.split(t);l=(()=>{var e=Nm();return U(e,A(Rt,{each:r,children:(e,n)=>t.test(e)?(()=>{var i=Pm();return U(i,e),E(()=>H(i,X(`regex`,{start:t.test(e)&&n()===0,middle:t.test(e)&&n()%2==1,end:t.test(e)&&n()===r.length-1,"!ml-0":n()===1}))),i})():e})),e})()}else{let e=n.label.toLowerCase(),t=s.toLowerCase(),r=e.indexOf(t);r>=0&&(l=(()=>{var e=Fm(),t=e.firstChild;return U(e,()=>n.label.slice(0,r),t),U(t,()=>n.label.slice(r,r+s.length)),U(e,()=>n.label.slice(r+s.length),null),e})())}}catch{}return{highlightedText:l,typeHighlight:c&&o.length>0}}),Qm=e=>e>0?e<.1-2**-52?`< 0.1`:e<1e3?Number(e.toFixed(1)).toString():`${(e/1e3).toFixed(1)}k`:`0`,$m=e=>{var t,n;let r,i=(t=(n=e.node.renderData)==null?void 0:n.renderCount)==null?0:t,a=Zm(()=>e.node,()=>e.searchValue);D(()=>{var t;let n=(t=e.node.renderData)==null?void 0:t.renderCount,a=r;!a||!i||!n||i===n||(a.classList.remove(`count-flash`),a.offsetWidth,a.classList.add(`count-flash`),i=n)});let o=O(()=>{if(!e.node.renderData)return null;let{selfTime:t,totalTime:n,renderCount:i}=e.node.renderData;return i?(()=>{var e=Im(),a=e.firstChild;a.firstChild;var o=r;return typeof o==`function`?wa(o,a):r=a,U(a,i,null),E(r=>{var i=X(`flex items-center gap-x-0.5 ml-1.5`,`text-[10px] text-neutral-400`),o=`Self time: ${Qm(t)}ms\nTotal time: ${Qm(n)}ms`;return i!==r.e&&H(e,r.e=i),o!==r.t&&V(a,`title`,r.t=o),r},{e:void 0,t:void 0}),e})():null}),s=O(()=>{if(!e.node.fiber)return null;let{wrapperTypes:t}=Ms(e.node.fiber),n=t[0];return(()=>{var e=Pm();return U(e,A(j,{when:n,children:e=>[(()=>{var t=Pm();return U(t,()=>e().type),E(n=>{var r=e().title,i=X(`rounded py-[1px] px-1`,`bg-neutral-700 text-neutral-300`,`truncate`,e().type===`memo`&&`bg-[#8e61e3] text-white`,a().typeHighlight&&`bg-yellow-300 text-black`);return r!==n.e&&V(t,`title`,n.e=r),i!==n.t&&H(t,n.t=i),n},{e:void 0,t:void 0}),t})(),A(j,{get when(){return e().compiler},get children(){return Lm()}})]}),null),U(e,A(j,{get when(){return t.length>1},get children(){return[`×`,W(()=>t.length)]}}),null),U(e,o,null),E(()=>H(e,X(`flex items-center gap-x-1`,`text-[10px] text-neutral-400 tracking-wide`,`overflow-hidden`))),e})()});return(()=>{var t=Rm(),n=t.firstChild;return t.$$keydown=t=>{t.key!==`Enter`&&t.key!==` `||(t.preventDefault(),e.handleTreeNodeClick(t))},ya(t,`click`,e.handleTreeNodeClick,!0),ya(n,`click`,e.handleTreeNodeToggle,!0),U(n,A(j,{get when(){return e.hasChildren},get children(){return A(K,{name:`icon-chevron-right`,size:12,get class(){return X(`transition-transform`,!e.isCollapsed&&`rotate-90`)}})}})),U(t,()=>a().highlightedText,null),U(t,s,null),E(r=>{var i=e.node.title,a=e.nodeIndex,o=X(`flex items-center gap-x-1`,`pl-1 pr-2`,`w-full h-7`,`text-left`,`rounded`,`cursor-pointer select-none`),s=e.nodeIndex,c=X(`w-6 h-6 flex items-center justify-center`,`text-left`);return i!==r.e&&V(t,`title`,r.e=i),a!==r.t&&V(t,`data-index`,r.t=a),o!==r.a&&H(t,r.a=o),s!==r.o&&V(n,`data-index`,r.o=s),c!==r.i&&H(n,r.i=c),r},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),t})()},eh=()=>{let e,t,n,r,i=null,a=0,o=!1,s=!1,c,[l,u]=T([]),[d,f]=T(new Set),[p,m]=T(void 0),h=O(()=>{let e=[],t=l(),n=new Map(t.map(e=>[e.nodeId,e]));for(let r of t){let t=!0,i=r;for(;i.parentId;){let e=n.get(i.parentId);if(!e)break;if(d().has(e.nodeId)){t=!1;break}i=e}t&&e.push(r)}return e}),{virtualItems:g,totalSize:_}=Am({count:()=>h().length,getScrollElement:()=>e,estimateSize:()=>28,overscan:5}),v=t=>{o=!0,r==null||r.blur(),Om(!0);let{parentCompositeFiber:n}=dm(t);if(!n)return;kn({kind:`focused`,focusedDomElement:t,fiber:n});let i=h().findIndex(e=>e.element===t);if(i!==-1){m(i);let t=i*28,n=e;if(n){let e=n.clientHeight,r=n.scrollTop;(t<r||t+28>r+e)&&n.scrollTo({top:Math.max(0,t-e/2),behavior:`instant`})}}},y=e=>{let t=e.currentTarget,n=Number(t.dataset.index);if(Number.isNaN(n))return;let r=h()[n].element;r&&v(r)},b=e=>{f(t=>{let n=new Set(t);return n.has(e)?n.delete(e):n.add(e),n})},ee=e=>{e.stopPropagation();let t=e.currentTarget,n=Number(t.dataset.index);if(Number.isNaN(n))return;let r=h()[n].nodeId;b(r)},te=t=>{n==null||n.classList.remove(`!border-red-500`);let r=[];if(!t){Em({query:t,matches:r,currentMatchIndex:-1});return}if(t.includes(`[`)&&!t.includes(`]`)&&t.length>t.indexOf(`[`)+1){n==null||n.classList.add(`!border-red-500`);return}let i=Jm(t)||[];if(t.includes(`[`)&&!Ym(i)){n==null||n.classList.add(`!border-red-500`);return}let a=t.replace(/\[.*?\]/,``).trim(),o=/^\/.*\/$/.test(a),s=e=>!1;if(a.startsWith(`/`)&&!o&&a.length>1){n==null||n.classList.add(`!border-red-500`);return}if(o)try{let e=a.slice(1,-1),t=new RegExp(e,`i`);s=e=>t.test(e)}catch{n==null||n.classList.add(`!border-red-500`);return}else if(a){let e=a.toLowerCase();s=t=>t.toLowerCase().includes(e)}for(let e of l()){let t=!0;if(a&&(t=s(e.label)),t&&i.length>0)if(!e.fiber)t=!1;else{let{wrapperTypes:n}=Ms(e.fiber);t=Xm(i,n)}t&&r.push(e)}if(Em({query:t,matches:r,currentMatchIndex:r.length>0?0:-1}),r.length>0){let t=r[0],n=h().findIndex(e=>e.nodeId===t.nodeId);if(n!==-1){let t=n*28,r=e;if(r){let e=r.clientHeight;r.scrollTo({top:Math.max(0,t-e/2),behavior:`instant`})}}}},ne=e=>{let t=e.currentTarget;t&&te(t.value)},x=t=>{let{matches:n,currentMatchIndex:r}=Tm();if(n.length===0)return;let i=t===`next`?(r+1)%n.length:(r-1+n.length)%n.length;Em({...Tm(),currentMatchIndex:i});let a=n[i],o=h().findIndex(e=>e.nodeId===a.nodeId);if(o!==-1){m(o);let t=o*28,n=e;if(n){let e=n.clientHeight;n.scrollTo({top:Math.max(0,t-e/2),behavior:`instant`})}}},S=n=>{if(t&&(t.style.width=`${n}px`),e){e.style.width=`${n}px`;let t=Km(n,a);e.style.setProperty(`--indentation-size`,`${t}px`)}},re=e=>{if(!c)return;let t=Ls().dimensions.width,n=Math.floor(t-240/2);c.classList.remove(`cursor-ew-resize`,`cursor-w-resize`,`cursor-e-resize`),e<=240?c.classList.add(`cursor-w-resize`):e>=n?c.classList.add(`cursor-e-resize`):c.classList.add(`cursor-ew-resize`)},ie=()=>{},ae=t=>{if(t.preventDefault(),t.stopPropagation(),!e)return;e.style.setProperty(`pointer-events`,`none`),s=!0;let n=t.clientX,r=e.offsetWidth,i=Ls().dimensions.width,a=Math.floor(i-240/2);re(r);let o=e=>{let t=r+(n-e.clientX);re(t),S(Math.min(a,Math.max(240,t)))},c=()=>{e&&(e.style.removeProperty(`pointer-events`),ie(),Rs(t=>({...t,componentsTree:{...t.componentsTree,width:e.offsetWidth}})),Ds(Qi,Ls()),s=!1)};ie(),ie=()=>{document.removeEventListener(`pointermove`,o),document.removeEventListener(`pointerup`,c)},document.addEventListener(`pointermove`,o),document.addEventListener(`pointerup`,c)};k(()=>ie()),D(et(Ls,()=>{e&&re(e.offsetWidth)}));let oe=()=>{o=!1};tt(()=>{let t=!0,n,r=e=>{let t=new Map,n=[];for(let{element:n,name:r,fiber:i}of e){if(!n)continue;let e=r,{name:a,wrappers:o}=Ms(i);a&&(e=o.length>0?`${o.join(`(`)}(${a})${`)`.repeat(o.length)}`:a),t.set(n,{label:a||r,title:e,children:[],element:n,fiber:i})}for(let{element:r,depth:i}of e){if(!r)continue;let e=t.get(r);if(e)if(i===0)n.push(e);else{let n=r.parentElement;for(;n;){let r=t.get(n);if(r){r.children=r.children||[],r.children.push(e);break}n=n.parentElement}}}return n},o=()=>{let o=i;if(!o)return;let s=r(hm());if(s.length>0){let r=Wm(s);if(a=Gm(r),S(Ls().componentsTree.width),u(r),t){t=!1;let i=r.findIndex(e=>e.element===o);if(i!==-1){let t=i*28,r=e;r&&(n=setTimeout(()=>{r.scrollTo({top:t,behavior:`instant`})},96))}}}};D(et(L,e=>{if(e.kind===`focused`){if(Dm())return;te(``),i=e.focusedDomElement,o()}},{defer:!0}));let c=0;D(et(zp,()=>{if(L().kind===`focused`){if(cancelAnimationFrame(c),s)return;c=requestAnimationFrame(()=>{Om(!1),o()})}},{defer:!0})),k(()=>{Em({query:``,matches:[],currentMatchIndex:-1}),cancelAnimationFrame(c),clearTimeout(n)})}),tt(()=>{let e=e=>{if(!o)return;let t=p();if(t!==void 0)switch(e.key){case`ArrowUp`:if(e.preventDefault(),e.stopPropagation(),t>0){let e=h()[t-1];e!=null&&e.element&&v(e.element)}return;case`ArrowDown`:if(e.preventDefault(),e.stopPropagation(),t<h().length-1){let e=h()[t+1];e!=null&&e.element&&v(e.element)}return;case`ArrowLeft`:{e.preventDefault(),e.stopPropagation();let n=h()[t];n!=null&&n.nodeId&&b(n.nodeId);return}case`ArrowRight`:{e.preventDefault(),e.stopPropagation();let n=h()[t];n!=null&&n.nodeId&&b(n.nodeId);return}}};document.addEventListener(`keydown`,e),k(()=>{document.removeEventListener(`keydown`,e)})});let se;return D(et(Ls,e=>{t==null||t.style.setProperty(`transition`,`width 0.1s`),S(e.componentsTree.width),clearTimeout(se),se=setTimeout(()=>{t==null||t.style.removeProperty(`transition`)},500)})),k(()=>{clearTimeout(se)}),(()=>{var i=Vm(),a=i.firstChild,o=a.firstChild,s=a.nextSibling,u=s.firstChild,f=u.firstChild,m=f.firstChild,b=m.firstChild,S=u.nextSibling.firstChild,re=S.firstChild;a.$$pointerdown=ae;var ie=c;typeof ie==`function`?wa(ie,a):c=a,U(o,A(K,{name:`icon-ellipsis`,size:18}));var se=t;typeof se==`function`?wa(se,s):t=s;var ce=n;typeof ce==`function`?wa(ce,f):n=f,U(f,A(K,{name:`icon-search`,size:12,class:` text-neutral-500`}),m),b.$$input=ne,b.$$keydown=e=>{e.key===`Escape`&&e.currentTarget.blur(),Tm().matches.length&&(e.key===`Enter`&&e.shiftKey?x(`prev`):e.key===`Enter`&&(e.metaKey||e.ctrlKey?(e.preventDefault(),e.stopPropagation(),v(Tm().matches[Tm().currentMatchIndex].element),e.currentTarget.focus()):x(`next`)))},b.$$pointerdown=e=>{e.stopPropagation()},b.$$click=e=>{e.stopPropagation(),e.currentTarget.focus()};var le=r;typeof le==`function`?wa(le,b):r=b,U(f,A(j,{get when(){return Tm().query},get fallback(){return A(j,{get when(){return l().length>0},get children(){var e=Hm();return U(e,()=>l().length),e}})},get children(){return[(()=>{var e=zm(),t=e.firstChild;return U(e,()=>Tm().currentMatchIndex+1,t),U(e,()=>Tm().matches.length,null),e})(),A(j,{get when(){return Tm().matches.length>0},get children(){return[(()=>{var e=Bm();return e.$$click=e=>{e.stopPropagation(),x(`prev`)},U(e,A(K,{name:`icon-chevron-right`,class:`-rotate-90`,size:12})),e})(),(()=>{var e=Bm();return e.$$click=e=>{e.stopPropagation(),x(`next`)},U(e,A(K,{name:`icon-chevron-right`,class:`rotate-90`,size:12})),e})()]}}),(()=>{var e=Bm();return e.$$click=e=>{e.stopPropagation(),te(``)},U(e,A(K,{name:`icon-close`,size:12})),e})()]}}),null),S.addEventListener(`pointerleave`,oe);var ue=e;return typeof ue==`function`?wa(ue,S):e=S,U(re,A(Rt,{get each(){return g()},children:e=>{let t=()=>h()[e.index],n=()=>{var e;let n=L();return n.kind===`focused`&&((e=t())==null?void 0:e.element)===n.focusedDomElement},r=()=>e.index===p();return A(j,{get when(){return t()},children:t=>(()=>{var i=Um(),a=i.firstChild;return U(a,A($m,{get node(){return t()},get nodeIndex(){return e.index},get hasChildren(){var e;return!!((e=t().children)!=null&&e.length)},get isCollapsed(){return d().has(t().nodeId)},handleTreeNodeClick:y,handleTreeNodeToggle:ee,get searchValue(){return Tm()}})),E(o=>{var s=X(`absolute left-0 w-full overflow-hidden`,`text-neutral-400 hover:text-neutral-300`,`bg-transparent hover:bg-[#5f3f9a]/20`,(n()||r())&&`text-neutral-300 bg-[#5f3f9a]/40 hover:bg-[#5f3f9a]/40`),c=`${e.start}px`,l=`calc(${t().depth} * var(--indentation-size))`;return s!==o.e&&H(i,o.e=s),c!==o.t&&Sa(i,`top`,o.t=c),l!==o.a&&Sa(a,`padding-left`,o.a=l),o},{e:void 0,t:void 0,a:void 0}),i})()})}})),E(e=>{var t=X(`relative`,`flex items-center gap-x-1 px-2`,`rounded`,`border border-transparent`,`focus-within:border-[#454545]`,`bg-[#1e1e1e] text-neutral-300`,`transition-colors`,`whitespace-nowrap`,`overflow-hidden`),n=`${_()}px`;return t!==e.e&&H(f,e.e=t),n!==e.t&&Sa(re,`height`,e.t=n),e},{e:void 0,t:void 0}),E(()=>b.value=Tm().query),i})()},ga([`click`,`keydown`,`pointerdown`,`input`])})),nh,rh,ih,ah=r((()=>{nh=new WeakMap,rh=(e,t)=>{let n=t.bind(null,e);return document.addEventListener(`scroll`,n,{passive:!0,capture:!0}),()=>{document.removeEventListener(`scroll`,n,{capture:!0})}},ih={activeFlashes:new Map,create(e){let t=e.querySelector(`.react-scan-flash-overlay`),n=t instanceof HTMLElement?t:(()=>{let t=document.createElement(`div`);t.className=`react-scan-flash-overlay`,e.appendChild(t);let n=rh(e,()=>{e.querySelector(`.react-scan-flash-overlay`)&&this.create(e)});return this.activeFlashes.set(e,{element:e,overlay:t,scrollCleanup:n}),t})(),r=nh.get(n);r&&(clearTimeout(r),nh.delete(n)),requestAnimationFrame(()=>{n.style.transition=`none`,n.style.opacity=`0.9`;let t=setTimeout(()=>{n.style.transition=`opacity 150ms ease-out`,n.style.opacity=`0`;let t=setTimeout(()=>{n.parentNode&&n.parentNode.removeChild(n);let t=this.activeFlashes.get(e);t!=null&&t.scrollCleanup&&t.scrollCleanup(),this.activeFlashes.delete(e),nh.delete(n)},150);nh.set(n,t)},300);nh.set(n,t)})},cleanup(e){let t=this.activeFlashes.get(e);if(t){let n=nh.get(t.overlay);n&&(clearTimeout(n),nh.delete(t.overlay)),t.overlay.parentNode&&t.overlay.parentNode.removeChild(t.overlay),t.scrollCleanup&&t.scrollCleanup(),this.activeFlashes.delete(e)}},cleanupAll(){for(let[,e]of this.activeFlashes)this.cleanup(e.element)}}})),oh,sh,ch=r((()=>{G(),I(),na(),Z(),Ka(),oh=B(`<button type=button>`),sh=e=>{let[t,n]=T(!1),r,i=t=>{t.preventDefault(),t.stopPropagation(),navigator.clipboard.writeText(e.text).then(()=>{var t;n(!0),(t=e.onCopy)==null||t.call(e,!0,e.text),clearTimeout(r),r=setTimeout(()=>n(!1),600)},()=>{var t;(t=e.onCopy)==null||t.call(e,!1,e.text)})};k(()=>{clearTimeout(r)});let a=()=>{var n;let r=(n=e.iconSize)==null?14:n;return(()=>{var n=oh();return n.$$click=i,Sa(n,`width`,`${r}px`),Sa(n,`height`,`${r}px`),U(n,A(K,{get name(){return`icon-${t()?`check`:`copy`}`},size:r,get class(){return X(t()&&`text-green-500`)}})),E(()=>H(n,X(`z-10 flex items-center justify-center hover:text-dev-pink-400`,`transition-colors duration-200 ease-in-out cursor-pointer`,e.class))),n})()};return e.children?e.children({ClipboardIcon:a(),onClick:i}):a()},ga([`click`])})),lh,uh,dh,fh,ph,mh,hh,gh,_h,vh,yh,bh,xh,Sh=r((()=>{G(),I(),ch(),Ka(),Z(),wm(),lh=B(`<div class="flex items-center gap-1"><button type=button class="flex items-center p-0 opacity-50"></button><span>Array(<!>)`),uh=B(`<span class=truncate>`),dh=B(`<div class="pl-5 border-l border-[#333] mt-0.5 ml-1 flex flex-col gap-0.5">`),fh=B(`<div class="flex flex-col"><div class="flex items-center gap-1"><button type=button class="flex items-center p-0 opacity-50"></button><span class=text-gray-500>:`),ph=B(`<div class="flex items-center gap-1"><span class=text-gray-500>:</span><span class=truncate>`),mh=B(`<div class="pl-2 border-l border-[#333] mt-0.5 ml-1 flex flex-col gap-0.5">`),hh=B(`<div class="flex flex-col gap-1 relative">`),gh=B(`<span class="text-gray-500 font-italic">`),_h=B(`<span>`),vh=B(`<div class="flex items-start gap-1 relative"><button type=button></button><div class=flex-1>`),yh=e=>(()=>{var t=lh(),n=t.firstChild,r=n.nextSibling,i=r.firstChild.nextSibling;return i.nextSibling,ya(n,`click`,e.onToggle,!0),U(n,A(K,{name:`icon-chevron-right`,size:12,get class(){return X(`transition-[color,transform]`,e.isNegative?`text-[#f87171]`:`text-[#4ade80]`,e.expanded&&`rotate-90`)}})),U(r,()=>e.length,i),t})(),bh=e=>{let[t,n]=T(!1),r=O(()=>e.value!==null&&typeof e.value==`object`&&!(e.value instanceof Date)),i=O(()=>r()?Object.keys(e.value):[]),a=t=>r()?e.value[t]:void 0;return A(j,{get when(){return r()},get fallback(){return(()=>{var t=ph(),n=t.firstChild,r=n.firstChild,i=n.nextSibling;return U(n,()=>e.path,r),U(i,()=>xm(e.value)),t})()},get children(){var r=fh(),o=r.firstChild,s=o.firstChild,c=s.nextSibling,l=c.firstChild;return s.$$click=()=>n(e=>!e),U(s,A(K,{name:`icon-chevron-right`,size:12,get class(){return X(`transition-[color,transform]`,e.isNegative?`text-[#f87171]`:`text-[#4ade80]`,t()&&`rotate-90`)}})),U(c,()=>e.path,l),U(o,A(j,{get when(){return!t()},get children(){var t=uh();return U(t,(()=>{var t=W(()=>e.value instanceof Date);return()=>t()?xm(e.value):`{${Object.keys(e.value).join(`, `)}}`})()),t}}),null),U(r,A(j,{get when(){return t()},get children(){var t=dh();return U(t,A(Rt,{get each(){return i()},children:t=>A(bh,{get value(){return a(t)},path:t,get isNegative(){return e.isNegative}})})),t}}),null),r}})},xh=e=>{let t=O(()=>Sm(e.value)),n=()=>t().value,r=()=>n()!==null&&typeof n()==`object`&&!(n()instanceof Promise),i=O(()=>r()&&!Array.isArray(n())?Object.keys(n()):[]),a=e=>n()[e];return A(j,{get when(){return!t().error},get fallback(){return(()=>{var e=gh();return U(e,()=>t().error),e})()},get children(){return A(j,{get when(){return r()},get fallback(){return(()=>{var e=_h();return U(e,()=>xm(n())),e})()},get children(){return A(j,{get when(){return Array.isArray(n())},get fallback(){return(()=>{var t=vh(),r=t.firstChild,o=r.nextSibling;return ya(r,`click`,e.onToggle,!0),U(r,A(K,{name:`icon-chevron-right`,size:12,get class(){return X(`transition-[color,transform]`,e.isNegative?`text-[#f87171]`:`text-[#4ade80]`,e.expanded&&`rotate-90`)}})),U(o,A(j,{get when(){return e.expanded},get fallback(){return(()=>{var e=_h();return U(e,()=>xm(n())),e})()},get children(){var t=mh();return U(t,A(Rt,{get each(){return i()},children:t=>A(bh,{get value(){return a(t)},path:t,get isNegative(){return e.isNegative}})})),t}})),U(t,A(sh,{get text(){return gm(n())},class:`absolute top-0.5 right-0.5 opacity-0 transition-opacity group-hover:opacity-100 self-end`,children:({ClipboardIcon:e})=>e}),null),E(()=>H(r,X(`flex items-center`,`p-0 mt-0.5 mr-1`,`opacity-50`))),t})()},get children(){var t=hh();return U(t,A(yh,{get length(){return n().length},get expanded(){return e.expanded},get onToggle(){return e.onToggle},get isNegative(){return e.isNegative}}),null),U(t,A(j,{get when(){return e.expanded},get children(){var t=mh();return U(t,A(zt,{get each(){return n()},children:(t,n)=>A(bh,{get value(){return t()},get path(){return n.toString()},get isNegative(){return e.isNegative}})})),t}}),null),U(t,A(sh,{get text(){return gm(n())},class:`absolute top-0.5 right-0.5 opacity-0 transition-opacity group-hover:opacity-100 self-end`,children:({ClipboardIcon:e})=>e}),null),t}})}})}})},ga([`click`])})),Ch,wh,Th,Eh,Dh,Oh,kh,Ah,jh,Mh,Nh=r((()=>{I(),In(),Ge(),xn(),Ch=50,wh=e=>{switch(e.kind){case`initialized`:return e.changes.currentValue;case`partially-initialized`:return e.value}},Th=(e,t)=>{for(let n of e){let e=t.get(n.name);if(e){t.set(e.name,{count:e.count+1,currentValue:n.value,id:e.name,lastUpdated:Date.now(),name:e.name,previousValue:n.prevValue});continue}t.set(n.name,{count:1,currentValue:n.value,id:n.name,lastUpdated:Date.now(),name:n.name,previousValue:n.prevValue})}},Eh=(e,t)=>{for(let n of e){let e=t.contextChanges.get(n.contextType);if(e){if(_n(wh(e),n.value))continue;if(e.kind===`partially-initialized`){t.contextChanges.set(n.contextType,{kind:`initialized`,changes:{count:1,currentValue:n.value,id:n.contextType.toString(),lastUpdated:Date.now(),name:n.name,previousValue:e.value}});continue}t.contextChanges.set(n.contextType,{kind:`initialized`,changes:{count:e.changes.count+1,currentValue:n.value,id:n.contextType.toString(),lastUpdated:Date.now(),name:n.name,previousValue:e.changes.currentValue}});continue}t.contextChanges.set(n.contextType,{kind:`partially-initialized`,id:n.contextType.toString(),lastUpdated:Date.now(),name:n.name,value:n.value})}},Dh=e=>{let t={contextChanges:new Map,propsChanges:new Map,stateChanges:new Map};return e.forEach(e=>{Eh(e.contextChanges,t),Th(e.stateChanges,t.stateChanges),Th(e.propsChanges,t.propsChanges)}),t},Oh=(e,t)=>{let n=new Map;return e.forEach((e,t)=>{n.set(t,e)}),t.forEach((e,t)=>{let r=n.get(t);if(!r){n.set(t,e);return}n.set(t,{count:r.count+e.count,currentValue:e.currentValue,id:e.id,lastUpdated:e.lastUpdated,name:e.name,previousValue:e.previousValue})}),n},kh=(e,t)=>{let n=new Map;return e.contextChanges.forEach((e,t)=>{n.set(t,e)}),t.contextChanges.forEach((e,t)=>{let r=n.get(t);if(!r){n.set(t,e);return}if(wh(e)!==wh(r))switch(r.kind){case`initialized`:switch(e.kind){case`initialized`:n.set(t,{kind:`initialized`,changes:{...e.changes,count:e.changes.count+r.changes.count+1,currentValue:e.changes.currentValue,previousValue:e.changes.previousValue}});return;case`partially-initialized`:n.set(t,{kind:`initialized`,changes:{count:r.changes.count+1,currentValue:e.value,id:e.id,lastUpdated:e.lastUpdated,name:e.name,previousValue:r.changes.currentValue}});return}case`partially-initialized`:switch(e.kind){case`initialized`:n.set(t,{kind:`initialized`,changes:{count:e.changes.count+1,currentValue:e.changes.currentValue,id:e.changes.id,lastUpdated:e.changes.lastUpdated,name:e.changes.name,previousValue:r.value}});return;case`partially-initialized`:n.set(t,{kind:`initialized`,changes:{count:1,currentValue:e.value,id:e.id,lastUpdated:e.lastUpdated,name:e.name,previousValue:r.value}});return}}}),n},Ah=(e,t)=>({contextChanges:kh(e,t),propsChanges:Oh(e.propsChanges,t.propsChanges),stateChanges:Oh(e.stateChanges,t.stateChanges)}),jh=e=>Array.from(e.propsChanges.values()).reduce((e,t)=>e+t.count,0)+Array.from(e.stateChanges.values()).reduce((e,t)=>e+t.count,0)+Array.from(e.contextChanges.values()).filter(e=>e.kind===`initialized`).reduce((e,t)=>e+t.changes.count,0),Mh=e=>{let t={queue:[]},[n,r]=T({propsChanges:new Map,stateChanges:new Map,contextChanges:new Map}),i=O(()=>{let e=L();return e.kind===`focused`?Ee(e.fiber):null});return tt(()=>{let n=setInterval(()=>{t.queue.length!==0&&(r(n=>{var r;let i=Ah(n,Dh(t.queue)),a=jh(n),o=jh(i)-a;return e==null||(r=e.onChangeUpdate)==null||r.call(e,o),i}),t.queue=[])},Ch);k(()=>{clearInterval(n)})}),D(()=>{let e=i();if(!e)return;let n=e=>{t.queue.push(e)},a=Fn.changesListeners.get(e);a||(a=[],Fn.changesListeners.set(e,a)),a.push(n),k(()=>{var i,a;r({propsChanges:new Map,stateChanges:new Map,contextChanges:new Map}),t.queue=[],Fn.changesListeners.set(e,(i=(a=Fn.changesListeners.get(e))==null?void 0:a.filter(e=>e!==n))==null?[]:i)})}),n}})),Ph,Fh,Ih,Lh,Rh,zh,Bh,Vh,Hh,Uh,Wh,Gh,Kh,qh,Jh,Yh,Xh,Zh,Qh,$h,eg,tg,ng,rg,ig,ag,og,sg,cg=r((()=>{G(),I(),ch(),Ka(),Z(),Sh(),Kp(),wm(),Nh(),Ge(),In(),Ph=B(`<div class="text-sm text-[#737373] bg-[#1E1E1E] rounded-md p-4 flex flex-col gap-4"><div>No changes detected since selecting</div><div>The props, state, and context changes within your component will be reported here`),Fh=B(`<div class="overflow-hidden h-full flex flex-col gap-y-2"><div class="flex flex-col gap-2 px-3 pt-2"><span class="text-sm font-medium text-[#888]">Why did <span class=text-[#A855F7]></span> render?</span></div><div>`),Ih=B(`<span class=truncate><span class=text-white> hook </span><span style=color:#666>called in <i class="text-[#A855F7] truncate">`),Lh=B(`<button type=button><div><div class=overflow-hidden><div class="flex items-center whitespace-nowrap"><div class="flex items-center gap-x-2">What changed?</div><div><div>props</div><div>state</div><div>context`),Rh=B(`<div><div class="text-xs text-[#888] mb-1.5"></div><div class="flex flex-col gap-2">`),zh=B(`<div><button class="flex items-center gap-2 w-full bg-transparent border-none p-0 cursor-pointer text-white text-xs"><div class="flex items-center gap-1.5 flex-1"><div class="whitespace-pre-wrap break-words text-left font-medium flex items-center gap-x-1.5"></div></div></button><div><div class="pl-3 text-xs font-mono border-l-1 border-[#333]"><div class="flex flex-col gap-0.5">`),Bh=B(`<div class="text-[#f87171] bg-[#2a1515] pr-1.5 py-[3px] rounded italic">`),Vh=B(`<div class="text-[#4ade80] bg-[#1a2a1a] pr-1.5 py-[3px] rounded italic mt-0.5">`),Hh=B(`<div class="text-[#666] text-[10px]">`),Uh=B(`<div><div><span class="w-3 flex items-center justify-center opacity-50">-</span><span class="flex-1 whitespace-nowrap font-mono"></span></div><div><span class="w-3 flex items-center justify-center opacity-50">+</span><span class="flex-1 whitespace-pre-wrap font-mono">`),Wh=B(`<span class="italic text-[#f87171]">`),Gh=B(`<div class="flex gap-1 items-start flex-col"><div class="flex gap-1 items-start w-full"><span class="flex-1 max-h-40">`),Kh=B(`<div class="text-[10px] text-[#666] italic">Function reference changed`),qh=B(`<span class="italic text-[#4ade80]">`),Jh=B(`<div class="flex gap-1 items-start flex-col"><div class="flex gap-1 items-start w-full"><span class=flex-1>`),Yh=B(`<div class="group flex gap-0.5 items-start text-[#f87171] bg-[#2a1515] py-[3px] px-1.5 rounded"><span class="w-3 flex items-center justify-center opacity-50">-</span><span class="flex-1 overflow-hidden whitespace-pre-wrap font-mono">`),Xh=B(`<div class="group flex gap-0.5 items-start text-[#4ade80] bg-[#1a2a1a] py-[3px] px-1.5 rounded mt-0.5"><span class="w-3 flex items-center justify-center opacity-50">+</span><span class="flex-1 overflow-hidden whitespace-pre-wrap font-mono">`),Zh=B(`<div class="text-[#666] text-[10px] italic mt-1 flex items-center gap-x-1"><span>Reference changed but objects are structurally the same`),Qh=B(`<div class=count-badge>x`),$h=()=>{let[e,t]=T(!0),n=Mh(),[r,i]=T(!1),a=O(()=>jh(n())>0);D(()=>{if(!r()&&a()){let e=setTimeout(()=>{i(!0),requestAnimationFrame(()=>{t(!0)})},0);k(()=>clearTimeout(e))}});let o=O(()=>new Map(Array.from(n().contextChanges.entries()).flatMap(([e,t])=>t.kind===`initialized`?[[e,t.changes]]:[]))),s=O(()=>{let e=L();return e.kind===`focused`?e.fiber:null});return A(j,{get when(){return s()},children:t=>[A(tg,{}),(()=>{var r=Fh(),i=r.firstChild,s=i.firstChild.firstChild.nextSibling,c=i.nextSibling;return U(s,()=>ye(t())),U(i,A(j,{get when(){return!a()},get children(){return Ph()}}),null),U(c,A(rg,{get changes(){return n().propsChanges},title:`Changed Props`,get isExpanded(){return e()}}),null),U(c,A(rg,{renderName:e=>{var n;return eg(e,(n=ye(ve(t())))==null?`Unknown Component`:n)},get changes(){return n().stateChanges},title:`Changed State`,get isExpanded(){return e()}}),null),U(c,A(rg,{get changes(){return o()},title:`Changed Context`,get isExpanded(){return e()}}),null),E(()=>H(c,X(`flex flex-col gap-y-2 pl-3 relative overflow-y-auto h-full`))),r})()]})},eg=(e,t)=>{if(Number.isNaN(Number(e)))return e;let n=Number.parseInt(e),r=e=>{let t=e%10,n=e%100;if(n>=11&&n<=13)return`th`;switch(t){case 1:return`st`;case 2:return`nd`;case 3:return`rd`;default:return`th`}};return(()=>{var e=Ih(),i=e.firstChild,a=i.firstChild,o=i.nextSibling.firstChild.nextSibling;return U(i,n,a),U(i,()=>r(n),a),U(o,t),e})()},tg=()=>{let e,t,n,r={isPropsChanged:!1,isStateChanged:!1,isContextChanged:!1},i=ks(()=>{let r=[];(e==null?void 0:e.dataset.flash)===`true`&&r.push(e),(t==null?void 0:t.dataset.flash)===`true`&&r.push(t),(n==null?void 0:n.dataset.flash)===`true`&&r.push(n);for(let e of r)e.classList.remove(`count-flash-white`),e.offsetWidth,e.classList.add(`count-flash-white`)},400);return D(et(Lp,a=>{var o,s,c,l,u,d;if(!e||!t||!n)return;let{currentIndex:f,updates:p}=a,m=p[f];!m||f===0||(i(),r={isPropsChanged:((o=(s=m.props)==null||(s=s.changes)==null?void 0:s.size)==null?0:o)>0,isStateChanged:((c=(l=m.state)==null||(l=l.changes)==null?void 0:l.size)==null?0:c)>0,isContextChanged:((u=(d=m.context)==null||(d=d.changes)==null?void 0:d.size)==null?0:u)>0},e.dataset.flash!==`true`&&(e.dataset.flash=r.isPropsChanged.toString()),t.dataset.flash!==`true`&&(t.dataset.flash=r.isStateChanged.toString()),n.dataset.flash!==`true`&&(n.dataset.flash=r.isContextChanged.toString()))},{defer:!0})),(()=>{var r=Lh(),i=r.firstChild,a=i.firstChild.firstChild.firstChild.nextSibling,o=a.firstChild,s=o.nextSibling,c=s.nextSibling,l=e;typeof l==`function`?wa(l,o):e=o;var u=t;typeof u==`function`?wa(u,s):t=s;var d=n;return typeof d==`function`?wa(d,c):n=c,E(e=>{var t=X(`react-section-header`,`overflow-hidden`,`max-h-0`,`transition-[max-height]`),n=X(`flex-1 react-scan-expandable`),o=X(`ml-auto`,`change-scope`,`transition-opacity duration-300 delay-150`);return t!==e.e&&H(r,e.e=t),n!==e.t&&H(i,e.t=n),o!==e.a&&H(a,e.a=o),e},{e:void 0,t:void 0,a:void 0}),r})()},ng=e=>e,rg=e=>{let[t,n]=T(new Set),[r,i]=T(new Set),a=O(()=>Array.from(e.changes.keys())),o=t=>{var n;return((n=e.renderName)==null?ng:n)(t)};return A(j,{get when(){return e.changes.size>0},get children(){var s=Rh(),c=s.firstChild,l=c.nextSibling;return U(c,()=>e.title),U(l,A(Rt,{get each(){return a()},children:a=>{let s=()=>r().has(String(a)),c=O(()=>e.changes.get(a)),l=O(()=>{var e;return Sm((e=c())==null?void 0:e.previousValue)}),u=O(()=>{var e;return Sm((e=c())==null?void 0:e.currentValue)}),d=O(()=>vm(l().value,u().value));return A(j,{get when(){return c()},children:r=>(()=>{var c=zh(),f=c.firstChild,p=f.firstChild,m=p.firstChild,h=f.nextSibling,g=h.firstChild.firstChild;return f.$$click=()=>{i(e=>{let t=new Set(e);return t.has(String(a))?t.delete(String(a)):t.add(String(a)),t})},U(p,A(K,{name:`icon-chevron-right`,size:12,get class(){return X(`text-[#666] transition-transform duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]`,{"rotate-90":s()})}}),m),U(m,()=>o(r().name),null),U(m,A(sg,{get count(){return r().count},get isFunction(){return typeof r().currentValue==`function`},get showWarning(){return d().changes.length===0},forceFlash:!0}),null),U(g,A(j,{get when(){return W(()=>!l().error)()&&!u().error},get fallback(){return A(ig,{get currError(){return u().error},get prevError(){return l().error}})},get children(){return A(j,{get when(){return d().changes.length>0},get fallback(){return A(og,{get currValue(){return u().value},entryKey:a,get expandedFunctions(){return t()},get prevValue(){return l().value},setExpandedFunctions:n})},get children(){return A(ag,{get change(){return r()},get diff(){return d()},get expandedFunctions(){return t()},renderName:o,setExpandedFunctions:n,get title(){return e.title}})}})}})),E(()=>H(h,X(`react-scan-expandable`,{"react-scan-expanded":s()}))),c})()})}})),s}})},ig=e=>[A(j,{get when(){return e.prevError},get children(){var t=Bh();return U(t,()=>e.prevError),t}}),A(j,{get when(){return e.currError},get children(){var t=Vh();return U(t,()=>e.currError),t}})],ag=e=>A(zt,{get each(){return e.diff.changes},children:(t,n)=>{let r=O(()=>Sm(t().prevValue)),i=O(()=>Sm(t().currentValue)),a=()=>typeof r().value==`function`||typeof i().value==`function`,o=n=>{let r=`${ym(t().path)}-${n}`;e.setExpandedFunctions(e=>{let t=new Set(e);return t.has(r)?t.delete(r):t.add(r),t})},s=(e,t)=>{t.key!==`Enter`&&t.key!==` `||(t.preventDefault(),o(e))},c=()=>e.title===`Props`?t().path.length>0?`${e.renderName(String(e.change.name))}.${ym(t().path)}`:void 0:e.title===`State`&&t().path.length>0?`state.${ym(t().path)}`:ym(t().path);return(()=>{var l=Uh(),u=l.firstChild,d=u.firstChild.nextSibling,f=u.nextSibling,p=f.firstChild.nextSibling;return U(l,A(j,{get when(){return c()},get children(){var e=Hh();return U(e,c),e}}),u),ya(u,`keydown`,a()?e=>s(`prev`,e):void 0,!0),ya(u,`click`,a()?()=>o(`prev`):void 0,!0),U(d,(()=>{var n=W(()=>!!r().error);return()=>n()?(()=>{var e=Wh();return U(e,()=>r().error),e})():W(()=>!!a())()?(()=>{var n=Gh(),a=n.firstChild,o=a.firstChild;return U(o,()=>bm(r().value,e.expandedFunctions.has(`${ym(t().path)}-prev`))),U(a,(()=>{var e=W(()=>typeof r().value==`function`);return()=>e()&&A(sh,{get text(){return String(r().value)},class:`opacity-0 transition-opacity group-hover:opacity-100`,children:({ClipboardIcon:e})=>e})})(),null),U(n,(()=>{var e=W(()=>{var e,t;return((e=r().value)==null?void 0:e.toString())===((t=i().value)==null?void 0:t.toString())});return()=>e()&&Kh()})(),null),n})():A(xh,{get value(){return r().value},get expanded(){return e.expandedFunctions.has(`${ym(t().path)}-prev`)},onToggle:()=>{let n=`${ym(t().path)}-prev`;e.setExpandedFunctions(e=>{let t=new Set(e);return t.has(n)?t.delete(n):t.add(n),t})},isNegative:!0})})()),ya(f,`keydown`,a()?e=>s(`current`,e):void 0,!0),ya(f,`click`,a()?()=>o(`current`):void 0,!0),U(p,(()=>{var n=W(()=>!!i().error);return()=>n()?(()=>{var e=qh();return U(e,()=>i().error),e})():W(()=>!!a())()?(()=>{var n=Jh(),a=n.firstChild,o=a.firstChild;return U(o,()=>bm(i().value,e.expandedFunctions.has(`${ym(t().path)}-current`))),U(a,(()=>{var e=W(()=>typeof i().value==`function`);return()=>e()&&A(sh,{get text(){return String(i().value)},class:`opacity-0 transition-opacity group-hover:opacity-100`,children:({ClipboardIcon:e})=>e})})(),null),U(n,(()=>{var e=W(()=>{var e,t;return((e=r().value)==null?void 0:e.toString())===((t=i().value)==null?void 0:t.toString())});return()=>e()&&Kh()})(),null),n})():A(xh,{get value(){return i().value},get expanded(){return e.expandedFunctions.has(`${ym(t().path)}-current`)},onToggle:()=>{let n=`${ym(t().path)}-current`;e.setExpandedFunctions(e=>{let t=new Set(e);return t.has(n)?t.delete(n):t.add(n),t})},isNegative:!1})})()),E(t=>{var r=X(`flex flex-col gap-y-1`,n<e.diff.changes.length-1&&`mb-4`),i=a()?`button`:void 0,o=a()?0:void 0,s=X(`group`,`flex items-start`,`py-[3px] px-1.5`,`text-left text-[#f87171] bg-[#2a1515]`,`rounded`,`overflow-hidden break-all`,a()&&`cursor-pointer`),c=a()?`button`:void 0,d=a()?0:void 0,p=X(`group`,`flex items-start`,`py-[3px] px-1.5`,`text-left text-[#4ade80] bg-[#1a2a1a]`,`rounded`,`overflow-hidden break-all`,a()&&`cursor-pointer`);return r!==t.e&&H(l,t.e=r),i!==t.t&&V(u,`role`,t.t=i),o!==t.a&&V(u,`tabindex`,t.a=o),s!==t.o&&H(u,t.o=s),c!==t.i&&V(f,`role`,t.i=c),d!==t.n&&V(f,`tabindex`,t.n=d),p!==t.s&&H(f,t.s=p),t},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),l})()}}),og=e=>[(()=>{var t=Yh(),n=t.firstChild.nextSibling;return U(n,A(xh,{get value(){return e.prevValue},get expanded(){return e.expandedFunctions.has(`${String(e.entryKey)}-prev`)},onToggle:()=>{let t=`${String(e.entryKey)}-prev`;e.setExpandedFunctions(e=>{let n=new Set(e);return n.has(t)?n.delete(t):n.add(t),n})},isNegative:!0})),t})(),(()=>{var t=Xh(),n=t.firstChild.nextSibling;return U(n,A(xh,{get value(){return e.currValue},get expanded(){return e.expandedFunctions.has(`${String(e.entryKey)}-current`)},onToggle:()=>{let t=`${String(e.entryKey)}-current`;e.setExpandedFunctions(e=>{let n=new Set(e);return n.has(t)?n.delete(t):n.add(t),n})},isNegative:!1})),t})(),A(j,{get when(){return W(()=>typeof e.currValue==`object`)()&&e.currValue!==null},get children(){var e=Zh(),t=e.firstChild;return U(e,A(K,{name:`icon-triangle-alert`,class:`text-yellow-500 mb-px`,size:14}),t),e}})],sg=e=>{let t=!0,n,r=e.count;return D(()=>{let t=e.count,i=n;!i||r===t||(i.classList.remove(`count-flash`),i.offsetWidth,i.classList.add(`count-flash`),r=t)}),D(()=>{let r=e.forceFlash;if(t){t=!1;return}if(r){let e=setTimeout(()=>{n==null||n.classList.add(`count-flash-white`),e=setTimeout(()=>{n==null||n.classList.remove(`count-flash-white`)},300)},500);k(()=>{clearTimeout(e)})}}),(()=>{var t=Qh(),r=t.firstChild,i=n;return typeof i==`function`?wa(i,t):n=t,U(t,A(j,{get when(){return e.showWarning},get children(){return A(K,{name:`icon-triangle-alert`,class:`text-yellow-500 mb-px`,size:14})}}),r),U(t,A(j,{get when(){return e.isFunction},get children(){return A(K,{name:`icon-function`,class:`text-[#A855F7] mb-px`,size:14})}}),r),U(t,()=>e.count,null),t})()},ga([`click`,`keydown`])})),lg,ug,dg,fg,pg,mg,hg,gg=r((()=>{G(),I(),In(),Ka(),Ks(),Z(),th(),ah(),Kp(),Lr(),wm(),cg(),lg=B(`<div class="p-4 bg-red-950/50 h-screen backdrop-blur-sm"><div class="flex items-center gap-2 mb-3 text-red-400 font-medium">Something went wrong in the inspector</div><div class="p-3 bg-black/40 rounded font-mono text-xs text-red-300 mb-4 break-words"></div><button type=button class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">Reset Inspector`),ug=B(`<div><div class="w-full h-full">`),dg=()=>{Fp.lastRendered.clear(),Fp.expandedPaths.clear(),ih.cleanupAll(),Er(),Gp.reset()},fg=(e,t)=>{let n=()=>{dg(),t()};return(()=>{var t=lg(),r=t.firstChild,i=r.firstChild,a=r.nextSibling,o=a.nextSibling;return U(r,A(K,{name:`icon-flame`,class:`text-red-500`,size:16}),i),U(a,()=>e.message||JSON.stringify(e)),o.$$click=n,t})()},pg=X(`react-scan-inspector`,`flex-1`,`opacity-100`,`overflow-y-auto overflow-x-hidden`,`transition-opacity delay-300`,`pointer-events-auto`),mg=()=>{let e=null,t=t=>{if(!t)return;e=t;let{data:n,shouldUpdate:r}=Nr(t);if(r){let e={timestamp:Date.now(),fiberInfo:Cm(t),props:n.fiberProps,state:n.fiberState,context:n.fiberContext,stateNames:Tr(t)};Gp.addUpdate(e,t)}};return D(()=>{let n=L();$e(()=>{if(n.kind!==`focused`||!n.focusedDomElement){e=null,dg();return}let{parentCompositeFiber:r}=fm(n.focusedDomElement,n.fiber);if(!r){kn({kind:`inspect-off`}),Bs({view:`none`});return}(e==null?void 0:e.type)!==r.type&&(e=r,dg(),t(r))})}),D(()=>{zp(),$e(()=>{let n=L();if(n.kind!==`focused`||!n.focusedDomElement){e=null,dg();return}let{parentCompositeFiber:r}=fm(n.focusedDomElement,n.fiber);if(!r){kn({kind:`inspect-off`}),Bs({view:`none`});return}t(r),n.focusedDomElement.isConnected||(e=null,dg(),kn({kind:`inspecting`,hoveredDomElement:null}))})}),k(()=>{dg()}),A(Ht,{fallback:fg,get children(){var e=ug(),t=e.firstChild;return H(e,pg),U(t,A($h,{})),e}})},hg=()=>A(Ht,{fallback:fg,get children(){return A(j,{get when(){return L().kind===`focused`},get children(){return[A(mg,{}),A(eh,{})]}})}}),ga([`click`])}));function _g(e){let t=e[Wt];if(!t&&(Object.defineProperty(e,Wt,{value:t=new Proxy(e,Fg)}),!Array.isArray(e))){let n=Object.keys(e),r=Object.getOwnPropertyDescriptors(e),i=Object.getPrototypeOf(e),a=i!==null&&typeof e==`object`&&!!e&&!Array.isArray(e)&&i!==Object.prototype;if(a){let e=Object.getOwnPropertyDescriptors(i);n.push(...Object.keys(e)),Object.assign(r,e)}for(let i=0,o=n.length;i<o;i++){let o=n[i];a&&o===`constructor`||r[o].get&&Object.defineProperty(e,o,{configurable:!0,enumerable:r[o].enumerable,get:r[o].get.bind(t)})}}return t}function vg(e){let t;return typeof e==`object`&&!!e&&(e[Wt]||!(t=Object.getPrototypeOf(e))||t===Object.prototype||Array.isArray(e))}function yg(e,t=new Set){let n,r,i,a;if(n=e!=null&&e[jg])return n;if(!vg(e)||t.has(e))return e;if(Array.isArray(e)){Object.isFrozen(e)?e=e.slice(0):t.add(e);for(let n=0,a=e.length;n<a;n++)i=e[n],(r=yg(i,t))!==i&&(e[n]=r)}else{Object.isFrozen(e)?e=Object.assign({},e):t.add(e);let n=Object.keys(e),o=Object.getOwnPropertyDescriptors(e);for(let s=0,c=n.length;s<c;s++)a=n[s],!o[a].get&&(i=e[a],(r=yg(i,t))!==i&&(e[a]=r))}return e}function bg(e,t){let n=e[t];return n||Object.defineProperty(e,t,{value:n=Object.create(null)}),n}function xg(e,t,n){if(e[t])return e[t];let[r,i]=T(n,{equals:!1,internal:!0});return r.$=i,e[t]=r}function Sg(e,t){let n=Reflect.getOwnPropertyDescriptor(e,t);return!n||n.get||!n.configurable||t===Wt||t===Mg?n:(delete n.value,delete n.writable,n.get=()=>e[Wt][t],n)}function Cg(e){rt()&&xg(bg(e,Mg),Pg)()}function wg(e){return Cg(e),Reflect.ownKeys(e)}function Tg(e,t,n,r=!1){if(t===`__proto__`||!r&&e[t]===n)return;let i=e[t],a=e.length;n===void 0?(delete e[t],e[Ng]&&e[Ng][t]&&i!==void 0&&e[Ng][t].$()):(e[t]=n,e[Ng]&&e[Ng][t]&&i===void 0&&e[Ng][t].$());let o=bg(e,Mg),s;if((s=xg(o,t,i))&&s.$(()=>n),Array.isArray(e)&&e.length!==a){for(let t=e.length;t<a;t++)(s=o[t])&&s.$();(s=xg(o,`length`,a))&&s.$(e.length)}(s=o[Pg])&&s.$()}function Eg(e,t){let n=Object.keys(t);for(let r=0;r<n.length;r+=1){let i=n[r];Dg(i)||Tg(e,i,t[i])}}function Dg(e){return e===`__proto__`||e===`constructor`||e===`prototype`}function Og(e,t){if(typeof t==`function`&&(t=t(e)),t=yg(t),Array.isArray(t)){if(e===t)return;let n=0,r=t.length;for(;n<r;n++){let r=t[n];e[n]!==r&&Tg(e,n,r)}Tg(e,`length`,r)}else Eg(e,t)}function kg(e,t,n=[]){let r,i=e;if(t.length>1){r=t.shift();let a=typeof r,o=Array.isArray(e);if(a===`string`&&(r===`__proto__`||t.length>1&&Dg(r)))return;if(Array.isArray(r)){for(let i=0;i<r.length;i++)kg(e,[r[i]].concat(t),n);return}else if(o&&a===`function`){for(let i=0;i<e.length;i++)r(e[i],i)&&kg(e,[i].concat(t),n);return}else if(o&&a===`object`){let{from:i=0,to:a=e.length-1,by:o=1}=r;for(let r=i;r<=a;r+=o)kg(e,[r].concat(t),n);return}else if(t.length>1){kg(e[r],t,[r].concat(n));return}i=e[r],n=[r].concat(n)}let a=t[0];typeof a==`function`&&(a=a(i,n),a===i)||r===void 0&&a==null||(a=yg(a),r===void 0||vg(i)&&vg(a)&&!Array.isArray(a)?Eg(i,a):Tg(e,r,a))}function Ag(...[e,t]){let n=yg(e||{}),r=Array.isArray(n),i=_g(n);function a(...e){Qe(()=>{r&&e.length===1?Og(n,e[0]):kg(n,e)})}return[i,a]}var jg,Mg,Ng,Pg,Fg,Ig=r((()=>{I(),jg=Symbol(`store-raw`),Mg=Symbol(`store-node`),Ng=Symbol(`store-has`),Pg=Symbol(`store-self`),Fg={get(e,t,n){if(t===jg)return e;if(t===Wt)return n;if(t===Kt)return Cg(e),n;let r=bg(e,Mg),i=r[t],a=i?i():e[t];if(t===Mg||t===Ng||t===`__proto__`)return a;if(!i){let n=Object.getOwnPropertyDescriptor(e,t);rt()&&(typeof a!=`function`||Object.prototype.hasOwnProperty.call(e,t))&&!(n&&n.get)&&(a=xg(r,t,a)())}return vg(a)?_g(a):a},has(e,t){return t===jg||t===Wt||t===Kt||t===Mg||t===Ng||t===`__proto__`?!0:(rt()&&xg(bg(e,Ng),t)(),t in e)},set(){return!0},deleteProperty(){return!0},ownKeys:wg,getOwnPropertyDescriptor:Sg}})),Lg,Rg,zg,Bg,Vg,Hg,Ug=r((()=>{I(),Fi(),Lg=e=>{let t=e.filter(e=>e.length>2);if(t.length===0){var n;return(n=e.at(-1))==null?`Unknown`:n}return t.at(-1)},Rg=e=>{switch(e.kind){case`interaction`:{let{renderTime:t,otherJSTime:n,framePreparation:r,frameConstruction:i,frameDraw:a}=e;return t+n+r+i+(a==null?0:a)}case`dropped-frames`:return e.otherTime+e.renderTime}},zg=e=>e.wasFiberRenderMount||e.hasMemoCache?!1:e.changes.context.length===0&&e.changes.props.length===0&&e.changes.state.length===0,Bg=e=>{let t=Rg(e.timing);switch(e.kind){case`interaction`:return t<200?`low`:t<500?`needs-improvement`:`high`;case`dropped-frames`:return t<50?`low`:t<150?`needs-improvement`:`high`}},Vg=st(),Hg=()=>{let e=ct(Vg);if(!e)throw Error(`Notifications context is unavailable`);return e}})),Wg,Gg,Kg,qg,Jg,Yg,Xg,Zg,Qg,$g,e_,t_,n_,r_,i_,a_,o_,s_,c_,l_,u_,d_=r((()=>{G(),In(),Z(),Wg=B(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="m9 18 6-6-6-6">`),Gg=B(`<div class=relative><svg xmlns=http://www.w3.org/2000/svg aria-hidden=true viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326">`),Kg=B(`<div>`),qg=B(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M18 6 6 18"></path><path d="m6 6 12 12">`),Jg=B(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path><path d="M16 9a5 5 0 0 1 0 6"></path><path d="M19.364 18.364a9 9 0 0 0 0-12.728">`),Yg=B(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M16 9a5 5 0 0 1 .95 2.293"></path><path d="M19.364 5.636a9 9 0 0 1 1.889 9.96"></path><path d="m2 2 20 20"></path><path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"></path><path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686">`),Xg=B(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="m12 19-7-7 7-7"></path><path d="M19 12H5">`),Zg=B(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M14 4.1 12 6"></path><path d="m5.1 8-2.9-.8"></path><path d="m6 12-1.9 2"></path><path d="M7.2 2.2 8 5.1"></path><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z">`),Qg=B(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M10 8h.01"></path><path d="M12 12h.01"></path><path d="M14 8h.01"></path><path d="M16 12h.01"></path><path d="M18 8h.01"></path><path d="M6 8h.01"></path><path d="M7 16h10"></path><path d="M8 12h.01"></path><rect width=20 height=16 x=2 y=4 rx=2>`),$g=B(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round style=transform:rotate(180deg)><circle cx=12 cy=12 r=10></circle><path d="m4.9 4.9 14.2 14.2">`),e_=B(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11">`),t_=e=>(()=>{var t=Wg();return E(n=>{var r,i,a=(r=e.size)==null?24:r,o=(i=e.size)==null?24:i,s=X([`lucide lucide-chevron-right`,e.class]);return a!==n.e&&V(t,`width`,n.e=a),o!==n.t&&V(t,`height`,n.t=o),s!==n.a&&V(t,`class`,n.a=s),n},{e:void 0,t:void 0,a:void 0}),t})(),n_=e=>{let t=()=>e.events.includes(!0),n=()=>e.events.filter(e=>e).length,r=()=>n()>99?`>99`:n(),i=()=>{var n,r;return t()?Math.max(((n=e.size)==null?24:n)*.6,14):Math.max(((r=e.size)==null?24:r)*.4,6)};return(()=>{var a=Gg(),o=a.firstChild;return U(a,(()=>{var a=W(()=>!!(e.events.length>0&&n()>0&&R().showNotificationCount));return()=>a()&&(()=>{var e=Kg();return U(e,(()=>{var e=W(()=>!!t());return()=>e()&&r()})()),E(n=>{var r=X([`absolute`,t()?`-top-2.5 -right-2.5`:`-top-1 -right-1`,`rounded-full`,`flex items-center justify-center`,`text-[8px] font-medium text-white`,`aspect-square`,t()?`bg-red-500/90`:`bg-purple-500/90`]),a=`${i()}px`,o=`${i()}px`,s=t()?`0.5px`:`0`;return r!==n.e&&H(e,n.e=r),a!==n.t&&Sa(e,`width`,n.t=a),o!==n.a&&Sa(e,`height`,n.a=o),s!==n.o&&Sa(e,`padding`,n.o=s),n},{e:void 0,t:void 0,a:void 0,o:void 0}),e})()})(),null),E(t=>{var n,r,i,a=(n=e.size)==null?24:n,s=(r=e.size)==null?24:r,c=`lucide lucide-bell ${(i=e.class)==null?``:i}`;return a!==t.e&&V(o,`width`,t.e=a),s!==t.t&&V(o,`height`,t.t=s),c!==t.a&&V(o,`class`,t.a=c),t},{e:void 0,t:void 0,a:void 0}),a})()},r_=e=>(()=>{var t=qg();return E(n=>{var r,i,a,o=(r=e.size)==null?24:r,s=(i=e.size)==null?24:i,c=(a=e.class)==null?``:a;return o!==n.e&&V(t,`width`,n.e=o),s!==n.t&&V(t,`height`,n.t=s),c!==n.a&&V(t,`class`,n.a=c),n},{e:void 0,t:void 0,a:void 0}),t})(),i_=e=>(()=>{var t=Jg();return E(n=>{var r,i,a,o=(r=e.size)==null?24:r,s=(i=e.size)==null?24:i,c=(a=e.class)==null?``:a;return o!==n.e&&V(t,`width`,n.e=o),s!==n.t&&V(t,`height`,n.t=s),c!==n.a&&V(t,`class`,n.a=c),n},{e:void 0,t:void 0,a:void 0}),t})(),a_=e=>(()=>{var t=Yg();return E(n=>{var r,i,a,o=(r=e.size)==null?24:r,s=(i=e.size)==null?24:i,c=(a=e.class)==null?``:a;return o!==n.e&&V(t,`width`,n.e=o),s!==n.t&&V(t,`height`,n.t=s),c!==n.a&&V(t,`class`,n.a=c),n},{e:void 0,t:void 0,a:void 0}),t})(),o_=e=>(()=>{var t=Xg();return E(n=>{var r,i,a=(r=e.size)==null?24:r,o=(i=e.size)==null?24:i,s=X([`lucide lucide-arrow-left`,e.class]);return a!==n.e&&V(t,`width`,n.e=a),o!==n.t&&V(t,`height`,n.t=o),s!==n.a&&V(t,`class`,n.a=s),n},{e:void 0,t:void 0,a:void 0}),t})(),s_=e=>(()=>{var t=Zg();return E(n=>{var r,i,a,o=(r=e.size)==null?24:r,s=(i=e.size)==null?24:i,c=(a=e.class)==null?``:a;return o!==n.e&&V(t,`width`,n.e=o),s!==n.t&&V(t,`height`,n.t=s),c!==n.a&&V(t,`class`,n.a=c),n},{e:void 0,t:void 0,a:void 0}),t})(),c_=e=>(()=>{var t=Qg();return E(n=>{var r,i,a,o=(r=e.size)==null?24:r,s=(i=e.size)==null?24:i,c=(a=e.class)==null?``:a;return o!==n.e&&V(t,`width`,n.e=o),s!==n.t&&V(t,`height`,n.t=s),c!==n.a&&V(t,`class`,n.a=c),n},{e:void 0,t:void 0,a:void 0}),t})(),l_=e=>(()=>{var t=$g();return E(n=>{var r,i,a,o=(r=e.size)==null?24:r,s=(i=e.size)==null?24:i,c=(a=e.class)==null?``:a;return o!==n.e&&V(t,`width`,n.e=o),s!==n.t&&V(t,`height`,n.t=s),c!==n.a&&V(t,`class`,n.a=c),n},{e:void 0,t:void 0,a:void 0}),t})(),u_=e=>(()=>{var t=e_();return E(n=>{var r,i,a,o=(r=e.size)==null?24:r,s=(i=e.size)==null?24:i,c=(a=e.class)==null?``:a;return o!==n.e&&V(t,`width`,n.e=o),s!==n.t&&V(t,`height`,n.t=s),c!==n.a&&V(t,`class`,n.a=c),n},{e:void 0,t:void 0,a:void 0}),t})()})),f_,p_,m_,h_=r((()=>{G(),I(),Z(),dx(),f_=B(`<div>`),p_=B(`<div style="min-width:175px;will-change:opacity, transform">`),m_=e=>{let[t,n]=T(`closed`),[r,i]=T(),[a,o]=T({width:window.innerWidth,height:window.innerHeight}),s=ct(lx),c,l,u=!1,d=()=>{if(!c||!s)return;let e=c.getBoundingClientRect(),t=s.getBoundingClientRect();i(new DOMRect(e.left+e.width/2-t.left,e.top-t.top,e.width,e.height))};tt(()=>{d();let e=()=>{o({width:window.innerWidth,height:window.innerHeight}),d()},r=setInterval(()=>{!u&&t()!==`closed`&&n(`closing`)},1e3);window.addEventListener(`resize`,e),k(()=>{window.removeEventListener(`resize`,e),clearInterval(r)})}),D(()=>{let e=t();if(e!==`opening`&&e!==`closing`)return;let r=setTimeout(()=>n(e===`opening`?`open`:`closed`),120);k(()=>clearTimeout(r))});let f=O(()=>{let e=r();if(!e||!s)return{top:0,left:0};let t=s.getBoundingClientRect(),n=(l==null?void 0:l.offsetHeight)||40,i=e.x+t.left,o=e.y+t.top,c=i,u=o-4;return c-175/2<5?c=92.5:c+175/2>a().width-5&&(c=a().width-5-175/2),u-n<5&&(u=o+e.height+4),{top:u-t.top,left:c-t.left}}),p=()=>{u=!0,d(),n(`opening`)},m=()=>{u=!1,d(),n(`closing`)};return[A(j,{get when(){return s&&r()&&t()!==`closed`&&s},children:n=>A(Ia,{get mount(){return n()},get children(){var n=p_(),r=l;return typeof r==`function`?wa(r,n):l=n,U(n,()=>e.children),E(e=>{var r=X([`absolute z-100 bg-white text-black rounded-lg px-3 py-2 shadow-lg`,`transition-[opacity] duration-120 ease-out`,`after:content-[""] after:absolute after:top-[100%]`,`after:left-1/2 after:-translate-x-1/2`,`after:w-[10px] after:h-[6px]`,`after:border-l-[5px] after:border-l-transparent`,`after:border-r-[5px] after:border-r-transparent`,`after:border-t-[6px] after:border-t-white`,`pointer-events-none`,t()===`opening`||t()===`closing`?`opacity-0`:`opacity-100`]),i=`${f().top}px`,a=`${f().left}px`,o=`translate(-50%, calc(-100% - 4px)) scale(${t()===`open`?1:.97})`;return r!==e.e&&H(n,e.e=r),i!==e.t&&Sa(n,`top`,e.t=i),a!==e.a&&Sa(n,`left`,e.a=a),o!==e.o&&Sa(n,`transform`,e.o=o),e},{e:void 0,t:void 0,a:void 0,o:void 0}),n}})}),(()=>{var t=f_(),n=c;return typeof n==`function`?wa(n,t):c=t,Ca(t,It(()=>e.wrapperProps,{onMouseEnter:p,onMouseLeave:m}),!1,!0),U(t,()=>e.triggerContent),t})()]}})),g_,__,v_,y_=r((()=>{G(),Z(),Ug(),h_(),d_(),xn(),g_=B(`<div><div><button>Ranked</button><button>Overview`),__=B(`<button class=ml-auto><div><span>Alerts`),v_=e=>{let{notificationState:t,setNotificationState:n,setRoute:r}=Hg();return(()=>{var e=g_(),i=e.firstChild,a=i.firstChild,o=a.nextSibling;return a.$$click=()=>{r({route:`render-visualization`,routeMessage:null})},o.$$click=()=>{r({route:`other-visualization`,routeMessage:null})},U(e,A(m_,{get triggerContent(){return(()=>{var e=__(),r=e.firstChild;return r.firstChild,e.$$click=()=>{let e=t.audioNotificationsOptions;if(e.enabled&&e.audioContext.state!==`closed`&&e.audioContext.close(),localStorage.setItem(`react-scan-notifications-audio`,String(!e.enabled)),e.enabled){n(`audioNotificationsOptions`,{audioContext:null,enabled:!1});return}let r=new AudioContext;bn(r),n(`audioNotificationsOptions`,{audioContext:r,enabled:!0})},U(r,(()=>{var e=W(()=>!!t.audioNotificationsOptions.enabled);return()=>e()?A(i_,{size:16,class:`text-[#6E6E77]`}):A(a_,{size:16,class:`text-[#6E6E77]`})})(),null),E(()=>H(r,X([`flex gap-x-2 justify-center items-center text-[#6E6E77]`]))),e})()},get children(){return`Play a chime when a slowdown is recorded`}}),null),E(n=>{var r=X([`flex w-full justify-between items-center px-3 py-2 text-xs`]),s=X([`bg-[#18181B] flex items-center gap-x-1 p-1 rounded-sm`]),c=X([`w-1/2 flex items-center justify-center whitespace-nowrap py-[5px] px-1 gap-x-1`,t.route===`render-visualization`||t.route===`render-explanation`?`text-white bg-[#7521c8] rounded-sm`:`text-[#6E6E77] bg-[#18181B] rounded-sm`]),l=X([`w-1/2 flex items-center justify-center whitespace-nowrap py-[5px] px-1 gap-x-1`,t.route===`other-visualization`?`text-white bg-[#7521c8] rounded-sm`:`text-[#6E6E77] bg-[#18181B] rounded-sm`]);return r!==n.e&&H(e,n.e=r),s!==n.t&&H(i,n.t=s),c!==n.a&&H(a,n.a=c),l!==n.o&&H(o,n.o=l),n},{e:void 0,t:void 0,a:void 0,o:void 0}),e})()},ga([`click`])})),b_,x_,S_,C_,w_,T_,E_,D_,O_,k_,A_,j_,M_,N_,P_,F_,I_,L_,R_,z_,B_,V_,H_,U_,W_=r((()=>{G(),I(),Kx(),zn(),Z(),Ug(),dx(),b_=B(`<div class="rounded-sm border border-zinc-800 text-xs"><div class="p-2 border-b border-zinc-800 bg-zinc-900/50"><div class="flex items-center justify-between"><h3 class="text-xs font-medium">What was time spent on?</h3><span class="text-xs text-zinc-400">Total: <!>ms</span></div></div><div class="divide-y divide-zinc-800">`),x_=B(`<div class="bg-zinc-900/30 border-t border-zinc-800 px-2.5 py-3"><p class=" text-zinc-400 mb-4 text-xs">`),S_=B(`<div><button class="w-full px-3 py-2 flex items-center gap-4 hover:bg-zinc-800/50 transition-colors"><div class=flex-1><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-0.5"><svg fill=none stroke=currentColor viewBox="0 0 24 24"><path stroke-linecap=round stroke-linejoin=round stroke-width=2 d="M9 5l7 7-7 7"></path></svg><span class="font-medium flex items-center text-left"></span></div><span class=" text-zinc-400">ms</span></div><div class="h-1 bg-zinc-800 rounded-full overflow-hidden"><div>`),C_=B(`<div><p>This is the time it took to draw the entire frame that was presented to the user. To be at 60FPS, this number needs to be &lt;=16ms</p><p>To debug the issue, check the "Ranked" tab to see if there are significant component renders</p><p>On a production React build, React Scan can't access the time it took for component to render. To get that information, run React Scan on a development build</p><p>To understand precisely what caused the slowdown while in production, use the <strong>Chrome profiler</strong> and analyze the function call times.</p><p>`),w_=B(`<div><p>This is the time it took React to run components, and internal logic to handle the output of your component.</p><div><p>The slowest components for this time period were:</p></div><p>To view the render times of all your components, and what caused them to render, go to the "Ranked" tab</p><p>The "Ranked" tab shows the render times of every component.</p><p>The render times of the same components are grouped together into one bar.</p><p>Clicking the component will show you what props, state, or context caused the component to re-render.`),T_=B(`<div><strong></strong>: <!>% of total`),E_=B(`<div><p>This is the period when JavaScript hooks and other JavaScript outside of React Renders run.</p><p>The most common culprit for high JS time is expensive hooks, like expensive callbacks inside of <code>useEffect</code>'s or a large number of useEffect's called, but this can also be JavaScript event handlers (<code>'onclick'</code>, <code>'onchange'</code>) that performed expensive computation.</p><p>If you have lots of components rendering that call hooks, like useEffect, it can add significant overhead even if the callbacks are not expensive. If this is the case, you can try optimizing the renders of those components to avoid the hook from having to run.</p><p>You should profile your app using the <strong>Chrome DevTools profiler</strong> to learn exactly which functions took the longest to execute.`),D_=B(`<div><p>This is the period when JavaScript hooks and other JavaScript outside of React Renders run.`),O_=B(`<p>There were no renders, which means nothing related to React caused this slowdown. The most likely cause of the slowdown is a slow JavaScript event handler, or code related to a Web API`),k_=B(`<p>You should try to reproduce the slowdown while profiling your website with the<strong>Chrome DevTools profiler</strong> to see exactly what functions took the longest to execute.`),A_=B(`<p>There were <strong></strong> renders, which could have contributed to the high JavaScript/Hook time if they ran lots of hooks, like <code>useEffects</code>.`),j_=B(`<div><p>You should try optimizing the renders of:`),M_=B(`<p>You can also try profiling your app using the <strong>Chrome DevTools profiler</strong> to see exactly what functions took the longest to execute.`),N_=B(`<div>- <strong></strong> (rendered <!>x)`),P_=B(`<div><p>This is the period when JavaScript hooks and other JavaScript outside of React Renders run.</p><p>There were only <strong></strong> renders detected, which means either you had very expensive hooks like <code>useEffect</code>/<code>useLayoutEffect</code>, or there is other JavaScript running during this interaction that took up the majority of the time.</p><p>To understand precisely what caused the slowdown, use the <strong>Chrome profiler</strong> and analyze the function call times.`),F_=B(`<div><p>These are the calculations the browser is forced to do in response to the JavaScript that ran during the interaction.</p><p>This can be caused by CSS updates/CSS recalculations, or new DOM elements/DOM mutations.</p><p>During this interaction, there were <strong></strong> renders, which was <strong>%</strong> of the time spent processing</p><p>The work performed as a result of the renders may have forced the browser to spend a lot of time to draw the next frame.</p><p>You can try optimizing the renders to see if the performance problem still exists using the "Ranked" tab.`),I_=B(`<div><p>These are the calculations the browser is forced to do in response to the JavaScript that ran during the interaction.</p><p>This can be caused by CSS updates/CSS recalculations, or new DOM elements/DOM mutations.`),L_=B(`<div><p>This is the time it took to run everything other than React renders. This can be hooks like <code>useEffect</code>, other JavaScript not part of React, or work the browser has to do to update the DOM and draw the next frame.</p><p>To get a better picture of what happened, profile your app using the <strong>Chrome profiler</strong> when the performance problem arises.`),R_=(e,t)=>{switch(e.kind){case`dropped-frames`:return[...t?[{name:`Total Processing Time`,time:Rg(e.timing),color:`bg-red-500`,kind:`total-processing-time`}]:[{name:`Renders`,time:e.timing.renderTime,color:`bg-purple-500`,kind:`render`},{name:`JavaScript, DOM updates, Draw Frame`,time:e.timing.otherTime,color:`bg-[#4b4b4b]`,kind:`other-frame-drop`}]];case`interaction`:return[...t?[]:[{name:`Renders`,time:e.timing.renderTime,color:`bg-purple-500`,kind:`render`}],{name:t?`React Renders, Hooks, Other JavaScript`:`JavaScript/React Hooks `,time:e.timing.otherJSTime,color:`bg-[#EFD81A]`,kind:`other-javascript`},{name:`Update DOM and Draw New Frame`,time:Rg(e.timing)-e.timing.renderTime-e.timing.otherJSTime,color:`bg-[#1D3A66]`,kind:`other-not-javascript`}]}},z_=e=>{var t,n;let r=(t=Rx())==null?!1:t,{notificationState:i}=Hg(),[a,o]=T((n=i.routeMessage)!=null&&n.name?[i.routeMessage.name]:[]),s=O(()=>R_(e.selectedEvent,r)),c=ct(lx);D(()=>{var e;if(i.route===`other-visualization`&&(e=i.routeMessage)!=null&&e.name){let e=c==null?void 0:c.querySelector(`#overview-scroll-container`),t=c==null?void 0:c.querySelector(`#react-scan-overview-bar-${i.routeMessage.name}`);if(e instanceof HTMLElement&&t instanceof HTMLElement){let n=t.getBoundingClientRect().top-e.getBoundingClientRect().top;e.scrollTop+=n}}}),D(()=>{i.route===`other-visualization`&&o(e=>{var t;return(t=i.routeMessage)!=null&&t.name?[i.routeMessage.name]:e})});let l=O(()=>s().reduce((e,t)=>e+t.time,0));return(()=>{var t=b_(),n=t.firstChild,r=n.firstChild.firstChild.nextSibling,i=r.firstChild.nextSibling;i.nextSibling;var c=n.nextSibling;return U(r,()=>l().toFixed(0),i),U(c,A(Rt,{get each(){return s()},children:t=>{let n=()=>a().includes(t.kind);return(()=>{var r=S_(),i=r.firstChild,a=i.firstChild.firstChild,s=a.firstChild,c=s.firstChild,u=c.nextSibling,d=s.nextSibling,f=d.firstChild,p=a.nextSibling.firstChild;return i.$$click=()=>o(e=>e.includes(t.kind)?e.filter(e=>e!==t.kind):[...e,t.kind]),U(u,()=>t.name),U(d,()=>t.time.toFixed(0),f),U(r,A(j,{get when(){return n()},get children(){var n=x_(),r=n.firstChild;return U(r,()=>Ln(()=>{let n=e.selectedEvent;switch(n.kind){case`interaction`:switch(t.kind){case`render`:return A(U_,{get input(){return V_(n)}});case`other-javascript`:return A(U_,{get input(){return H_(n)}});case`other-not-javascript`:return A(U_,{get input(){return B_(n)}})}case`dropped-frames`:switch(t.kind){case`total-processing-time`:return A(U_,{get input(){return{kind:`total-processing`,data:{time:Rg(n.timing)}}}});case`render`:return A(U_,{get input(){return{kind:`render`,data:{topByTime:n.groupedFiberRenders.toSorted((e,t)=>t.totalTime-e.totalTime).slice(0,3).map(e=>({name:e.name,percentage:e.totalTime/Rg(n.timing)}))}}}});case`other-frame-drop`:return A(U_,{input:{kind:`other`}})}}})),n}}),null),E(e=>{var i=`react-scan-overview-bar-${t.kind}`,a=`h-4 w-4 text-zinc-400 transition-transform ${n()?`rotate-90`:``}`,o=`h-full ${t.color} transition-all`,s=`${t.time/l()*100}%`;return i!==e.e&&V(r,`id`,e.e=i),a!==e.t&&V(c,`class`,e.t=a),o!==e.a&&H(p,e.a=o),s!==e.o&&Sa(p,`width`,e.o=s),e},{e:void 0,t:void 0,a:void 0,o:void 0}),r})()}})),t})()},B_=e=>{let t=e.groupedFiberRenders.reduce((e,t)=>e+t.count,0),n=e.timing.renderTime/Rg(e.timing)*100;return t>100?{kind:`high-render-count-update-dom-draw-frame`,data:{count:t,percentageOfTotal:n}}:{kind:`update-dom-draw-frame`}},V_=e=>e.timing.renderTime/Rg(e.timing)>.3?{kind:`render`,data:{topByTime:e.groupedFiberRenders.toSorted((e,t)=>t.totalTime-e.totalTime).slice(0,3).map(t=>({percentage:t.totalTime/Rg(e.timing),name:t.name}))}}:{kind:`other`},H_=e=>{let t=e.groupedFiberRenders.reduce((e,t)=>e+t.count,0);return e.timing.otherJSTime/Rg(e.timing)<.2?{kind:`js-explanation-base`}:e.groupedFiberRenders.find(e=>e.count>200)||e.groupedFiberRenders.reduce((e,t)=>e+t.count,0)>500?{kind:`high-render-count-high-js`,data:{renderCount:t,topByCount:e.groupedFiberRenders.filter(e=>e.count>100).toSorted((e,t)=>t.count-e.count).slice(0,3)}}:e.timing.otherJSTime/Rg(e.timing)>.3?e.timing.renderTime>.2?{kind:`js-explanation-base`}:{kind:`low-render-count-high-js`,data:{renderCount:t}}:{kind:`js-explanation-base`}},U_=e=>W(O(()=>{let t=e.input;switch(t.kind){case`total-processing`:return(()=>{var e=C_();return E(()=>H(e,X([`text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2`]))),e})();case`render`:return(()=>{var e=w_(),n=e.firstChild.nextSibling;return n.firstChild,U(n,A(Rt,{get each(){return t.data.topByTime},children:e=>(()=>{var t=T_(),n=t.firstChild,r=n.nextSibling.nextSibling;return r.nextSibling,U(n,()=>e.name),U(t,()=>(e.percentage*100).toFixed(0),r),t})()}),null),E(t=>{var r=X([`text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2`]),i=X([`flex flex-col`]);return r!==t.e&&H(e,t.e=r),i!==t.t&&H(n,t.t=i),t},{e:void 0,t:void 0}),e})();case`js-explanation-base`:return(()=>{var e=E_();return E(()=>H(e,X([`text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2`]))),e})();case`high-render-count-high-js`:return(()=>{var e=D_();return e.firstChild,U(e,(()=>{var e=W(()=>t.data.renderCount===0);return()=>e()?[O_(),k_()]:[` `,(()=>{var e=A_(),n=e.firstChild.nextSibling;return U(n,()=>t.data.renderCount),e})(),(()=>{var e=j_();return e.firstChild,U(e,A(Rt,{get each(){return t.data.topByCount},children:e=>(()=>{var t=N_(),n=t.firstChild.nextSibling,r=n.nextSibling.nextSibling;return r.nextSibling,U(n,()=>e.name),U(t,()=>e.count,r),t})()}),null),E(()=>H(e,X([`flex flex-col`]))),e})(),`and then checking if the problem still exists.`,M_()]})(),null),E(()=>H(e,X([`text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2`]))),e})();case`low-render-count-high-js`:return(()=>{var e=P_(),n=e.firstChild.nextSibling.firstChild.nextSibling;return U(n,()=>t.data.renderCount),E(()=>H(e,X([`text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2`]))),e})();case`high-render-count-update-dom-draw-frame`:return(()=>{var e=F_(),n=e.firstChild.nextSibling.nextSibling.firstChild.nextSibling,r=n.nextSibling.nextSibling,i=r.firstChild;return U(n,()=>t.data.count),U(r,()=>t.data.percentageOfTotal.toFixed(0),i),E(()=>H(e,X([`text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2`]))),e})();case`update-dom-draw-frame`:return(()=>{var e=I_();return E(()=>H(e,X([`text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2`]))),e})();case`other`:return(()=>{var e=L_();return E(()=>H(e,X([`text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2`]))),e})()}})),ga([`click`])})),G_,K_,q_=r((()=>{pr(),xn(),G_=e=>{let t=new Map;for(let r=0,i=e.length;r<i;r++){var n;let i=e[r];if(!i.componentName)continue;let a=(n=t.get(i.componentName))==null?[]:n,o=vn([{aggregatedCount:1,computedKey:null,name:i.componentName,frame:null,...i,changes:{type:i.changes.reduce((e,t)=>e|t.type,0),unstable:i.changes.some(e=>Qn(e.prevValue,e.value))},phase:i.phase,computedCurrent:null}]);if(!o)continue;let s=null,c=null;if(i.changes)for(let e=0,t=i.changes.length;e<t;e++){let{name:t,prevValue:n,value:r,type:o}=i.changes[e],l=Qn(n,r);o===1?(s!=null||(s={}),c!=null||(c={}),s[`${l?`⚠️`:``}${t} (prev)`]=n,c[`${l?`⚠️`:``}${t} (next)`]=r):a.push({prev:n,next:r,type:o===4?`context`:`state`,unstable:l==null?!1:l})}s&&c&&a.push({prev:s,next:c,type:`props`,unstable:!1}),t.set(o,a)}for(let[e,n]of Array.from(t.entries())){console.group(`%c${e}`,`background: hsla(0,0%,70%,.3); border-radius:3px; padding: 0 2px;`);for(let{type:e,prev:t,next:r,unstable:i}of n)console.log(`${e}:`,i?`⚠️`:``,t,`!==`,r);console.groupEnd()}},K_=()=>{if(window.hideIntro){window.hideIntro=void 0;return}console.log(`%c[·] %cReact Scan`,`font-weight:bold;color:#7a68e8;font-size:20px;`,`font-weight:bold;font-size:14px;`)}}));function J_(e,t){return t[0]-e[0]}function Y_(e){return[...e.entries()].sort(J_)}function X_([e,t]){let n=`${t.slice(0,tv).join(`, `)} ×${e}`;return n.length>nv&&(n=`${n.slice(0,nv)}…`),n}var Z_,Q_,$_,ev,tv,nv,rv,iv,av,ov,sv,cv,lv,uv,dv=r((()=>{Z_=`Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace`,Q_=.2,$_=.5,ev=(e,t)=>{let n=t-e;return Math.abs(n)<$_?t:e+n*Q_},tv=4,nv=40,rv=45,iv=`115,97,230`,av=e=>{let t=new Map;for(let{name:n,count:r}of e)t.set(n,(t.get(n)||0)+r);let n=new Map;for(let[e,r]of t){let t=n.get(r);t?t.push(e):n.set(r,[e])}let r=Y_(n),i=X_(r[0]);for(let e=1,t=r.length;e<t;e++)i+=`, `+X_(r[e]);return i.length>nv?`${i.slice(0,nv)}…`:i},ov=e=>{let t=0;for(let n of e)t+=n.width*n.height;return t},sv=(e,t)=>{for(let{id:n,name:r,count:i,x:a,y:o,width:s,height:c,didCommit:l}of t){let t={id:n,name:r,count:i,x:a,y:o,width:s,height:c,frame:0,targetX:a,targetY:o,targetWidth:s,targetHeight:c,didCommit:l},u=String(t.id),d=e.get(u);d?(d.count++,d.frame=0,d.targetX=a,d.targetY=o,d.targetWidth=s,d.targetHeight=c,d.didCommit=l):e.set(u,t)}},cv=(e,t,n)=>{for(let r of e.values()){let e=r.x-t,i=r.y-n;r.targetX=e,r.targetY=i}},lv=(e,t)=>{let n=e.getContext(`2d`,{alpha:!0});return n&&n.scale(t,t),n},uv=(e,t,n,r)=>{e.clearRect(0,0,t.width/n,t.height/n);let i=new Map,a=new Map;for(let e of r.values()){let{x:t,y:n,width:r,height:o,targetX:s,targetY:c,targetWidth:l,targetHeight:u,frame:d}=e;s!==t&&(e.x=ev(t,s)),c!==n&&(e.y=ev(n,c)),l!==r&&(e.width=ev(r,l)),u!==o&&(e.height=ev(o,u));let f=`${s==null?t:s},${c==null?n:c}`,p=`${f},${l==null?r:l},${u==null?o:u}`,m=i.get(f);m?m.push(e):i.set(f,[e]);let h=1-d/rv;e.frame++;let g=a.get(p)||{x:t,y:n,width:r,height:o,alpha:h};h>g.alpha&&(g.alpha=h),a.set(p,g)}for(let{x:t,y:n,width:r,height:i,alpha:o}of a.values()){e.strokeStyle=`rgba(${iv},${o})`,e.lineWidth=1;let a=Math.round(t)+.5,s=Math.round(n)+.5,c=Math.round(r),l=Math.round(i);e.beginPath(),e.rect(a,s,c,l),e.stroke(),e.fillStyle=`rgba(${iv},${o*.1})`,e.fill()}e.font=`11px ${Z_}`;let o=new Map;e.textRendering=`optimizeSpeed`;for(let t of i.values()){let{x:n,y:i,frame:a}=t[0],s=1-a/rv,c=av(t),{width:l}=e.measureText(c);o.set(`${n},${i},${l},${c}`,{text:c,width:l,height:11,alpha:s,x:n,y:i,outlines:t});let u=i-11-4;if(u<0&&(u=0),a>rv)for(let e of t)r.delete(String(e.id))}let s=Array.from(o.entries()).sort(([e,t],[n,r])=>ov(r.outlines)-ov(t.outlines));for(let[t,n]of s)if(o.has(t))for(let[r,i]of o.entries()){if(t===r)continue;let{x:a,y:s,width:c,height:l}=n,{x:u,y:d,width:f,height:p}=i;a+c>u&&u+f>a&&s+l>d&&d+p>s&&(n.text=av(n.outlines.concat(i.outlines)),n.width=e.measureText(n.text).width,o.delete(r))}for(let t of o.values()){let{x:n,y:r,alpha:i,width:a,height:o,text:s}=t,c=r-o-4;c<0&&(c=0),e.fillStyle=`rgba(${iv},${i})`,e.fillRect(n,c,a+4,o+4),e.fillStyle=`rgba(255,255,255,${i})`,e.fillText(s,n+2,c+o)}return r.size>0}}));function fv(e,t){let n=[];for(let t of e){let e=t.target;this.seenElements.has(e)||(this.seenElements.add(e),n.push(t))}n.length>0&&this.resolveNext&&(this.resolveNext(n),this.resolveNext=null),this.seenElements.size===this.uniqueElements.size&&(t.disconnect(),this.done=!0,this.resolveNext&&this.resolveNext([]))}var pv,mv,hv,gv,_v,vv,yv,bv,xv,Sv,Cv,wv,Tv,Ev,Dv,Ov,kv,Av,jv,Mv,Nv,Pv,Fv,Iv,Lv,Rv,zv,Bv,Vv=r((()=>{Ge(),Kx(),In(),pr(),vr(),q_(),Kp(),dv(),pv='"use strict";(()=>{var D="Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace";var T=(t,n)=>{let r=n-t;return Math.abs(r)<.5?n:t+r*.2};var x="115,97,230";function P(t,n){return n[0]-t[0]}function F(t){return[...t.entries()].sort(P)}function v([t,n]){let r=`${n.slice(0,4).join(", ")} \\xD7${t}`;return r.length>40&&(r=`${r.slice(0,40)}\\u2026`),r}var $=t=>{let n=new Map;for(let{name:e,count:u}of t)n.set(e,(n.get(e)||0)+u);let r=new Map;for(let[e,u]of n){let A=r.get(u);A?A.push(e):r.set(u,[e])}let m=F(r),a=v(m[0]);for(let e=1,u=m.length;e<u;e++)a+=", "+v(m[e]);return a.length>40?`${a.slice(0,40)}\\u2026`:a},N=t=>{let n=0;for(let r of t)n+=r.width*r.height;return n};var H=(t,n)=>{let r=t.getContext("2d",{alpha:!0});return r&&r.scale(n,n),r},X=(t,n,r,m)=>{t.clearRect(0,0,n.width/r,n.height/r);let a=new Map,e=new Map;for(let i of m.values()){let{x:s,y:c,width:l,height:f,targetX:o,targetY:g,targetWidth:h,targetHeight:d,frame:O}=i;o!==s&&(i.x=T(s,o)),g!==c&&(i.y=T(c,g)),h!==l&&(i.width=T(l,h)),d!==f&&(i.height=T(f,d));let M=`${o!=null?o:s},${g!=null?g:c}`,L=`${M},${h!=null?h:l},${d!=null?d:f}`,S=a.get(M);S?S.push(i):a.set(M,[i]);let C=1-O/45;i.frame++;let _=e.get(L)||{x:s,y:c,width:l,height:f,alpha:C};C>_.alpha&&(_.alpha=C),e.set(L,_)}for(let{x:i,y:s,width:c,height:l,alpha:f}of e.values()){t.strokeStyle=`rgba(${x},${f})`,t.lineWidth=1;let o=Math.round(i)+.5,g=Math.round(s)+.5,h=Math.round(c),d=Math.round(l);t.beginPath(),t.rect(o,g,h,d),t.stroke(),t.fillStyle=`rgba(${x},${f*.1})`,t.fill()}t.font=`11px ${D}`;let u=new Map;t.textRendering="optimizeSpeed";for(let i of a.values()){let s=i[0],{x:c,y:l,frame:f}=s,o=1-f/45,g=$(i),{width:h}=t.measureText(g),d=11;u.set(`${c},${l},${h},${g}`,{text:g,width:h,height:d,alpha:o,x:c,y:l,outlines:i});let O=l-d-4;if(O<0&&(O=0),f>45)for(let M of i)m.delete(String(M.id))}let A=Array.from(u.entries()).sort(([i,s],[c,l])=>N(l.outlines)-N(s.outlines));for(let[i,s]of A)if(u.has(i))for(let[c,l]of u.entries()){if(i===c)continue;let{x:f,y:o,width:g,height:h}=s,{x:d,y:O,width:M,height:L}=l;f+g>d&&d+M>f&&o+h>O&&O+L>o&&(s.text=$(s.outlines.concat(l.outlines)),s.width=t.measureText(s.text).width,u.delete(c))}for(let i of u.values()){let{x:s,y:c,alpha:l,width:f,height:o,text:g}=i,h=c-o-4;h<0&&(h=0),t.fillStyle=`rgba(${x},${l})`,t.fillRect(s,h,f+4,o+4),t.fillStyle=`rgba(255,255,255,${l})`,t.fillText(g,s+2,h+o)}return m.size>0};var p=null,w=null,b=1,y=new Map,E=null,R=()=>{if(!w||!p)return;X(w,p,b,y)?E=requestAnimationFrame(R):E=null};self.onmessage=t=>{let{type:n}=t.data;if(n==="init"&&(p=t.data.canvas,b=t.data.dpr,p&&(p.width=t.data.width,p.height=t.data.height,w=H(p,b))),!(!p||!w)){if(n==="resize"){b=t.data.dpr,p.width=t.data.width*b,p.height=t.data.height*b,w.resetTransform(),w.scale(b,b),R();return}if(n==="draw-outlines"){let{data:r,names:m}=t.data,a=new Float32Array(r);for(let e=0;e<a.length;e+=7){let u=a[e+2],A=a[e+3],i=a[e+4],s=a[e+5],c=a[e+6],l={id:a[e],name:m[e/7],count:a[e+1],x:u,y:A,width:i,height:s,frame:0,targetX:u,targetY:A,targetWidth:i,targetHeight:s,didCommit:c},f=String(l.id),o=y.get(f);o?(o.count++,o.frame=0,o.targetX=u,o.targetY=A,o.targetWidth=i,o.targetHeight=s,o.didCommit=c):y.set(f,l)}E||(E=requestAnimationFrame(R));return}if(n==="scroll"){let{deltaX:r,deltaY:m}=t.data;for(let a of y.values()){let e=a.x-r,u=a.y-m;a.targetX=e,a.targetY=u}}}};})();\n',mv=null,hv=null,gv=null,_v=1,vv=null,yv=new Map,bv=new Map,xv=new Set,Sv=e=>{if(!le(e))return;let t=typeof e.type==`string`?e.type:ye(e);if(!t)return;let n=bv.get(e),r=me(e),i=fe(e);n?n.count++:(bv.set(e,{name:t,count:1,elements:r.map(e=>e.stateNode),didCommit:+!!i}),xv.add(e))},Cv=e=>{let t=e[0];if(e.length===1)return t;let n,r,i,a;for(let t=0,o=e.length;t<o;t++){let o=e[t];n=n==null?o.x:Math.min(n,o.x),r=r==null?o.y:Math.min(r,o.y),i=i==null?o.x+o.width:Math.max(i,o.x+o.width),a=a==null?o.y+o.height:Math.max(a,o.y+o.height)}return n==null||r==null||i==null||a==null?e[0]:new DOMRect(n,r,i-n,a-r)},wv=async function*(e){let t={uniqueElements:new Set(e),seenElements:new Set,resolveNext:null,done:!1},n=new IntersectionObserver(fv.bind(t));for(let e of t.uniqueElements)n.observe(e);for(;!t.done;){let e=await new Promise(e=>{t.resolveNext=e});e.length>0&&(yield e)}},Tv=typeof SharedArrayBuffer<`u`?SharedArrayBuffer:ArrayBuffer,Ev=async()=>{let e=[];for(let t of xv){let n=bv.get(t);if(n)for(let t=0;t<n.elements.length;t++)n.elements[t]instanceof Element&&e.push(n.elements[t])}let t=new Map;for await(let n of wv(e)){for(let e of n){let n=e.target,r=e.intersectionRect;e.isIntersecting&&r.width&&r.height&&t.set(n,r)}let e=[],r=[],i=[];for(let n of xv){let a=bv.get(n);if(!a)continue;let o=[];for(let e=0;e<a.elements.length;e++){let n=a.elements[e],r=t.get(n);r&&o.push(r)}o.length&&(e.push(a),r.push(Cv(o)),i.push(Ee(n)))}if(e.length>0){let t=new Tv(e.length*7*4),n=new Float32Array(t),a=Array(e.length),o;for(let t=0,s=e.length;t<s;t++){let s=e[t],c=i[t],{x:l,y:u,width:d,height:f}=r[t],{count:p,name:m,didCommit:h}=s;if(mv){let e=t*7;n[e]=c,n[e+1]=p,n[e+2]=l,n[e+3]=u,n[e+4]=d,n[e+5]=f,n[e+6]=h,a[t]=m}else o||(o=Array(e.length)),o[t]={id:c,name:m,count:p,x:l,y:u,width:d,height:f,didCommit:h}}mv?mv.postMessage({type:`draw-outlines`,data:t,names:a}):hv&&gv&&o&&(sv(yv,o),vv||(vv=requestAnimationFrame(Dv)))}}for(let e of xv)bv.delete(e),xv.delete(e)},Dv=()=>{!gv||!hv||(vv=uv(gv,hv,_v,yv)?requestAnimationFrame(Dv):null)},Ov=typeof OffscreenCanvas<`u`&&typeof Worker<`u`,kv=pv!==`__WORKER_CODE__`,Av=()=>Math.min(window.devicePixelRatio||1,2),jv=()=>{Nv();let e=document.createElement(`div`);e.setAttribute(`data-react-scan`,`true`);let t=e.attachShadow({mode:`open`}),n=document.createElement(`canvas`);if(n.style.position=`fixed`,n.style.top=`0`,n.style.left=`0`,n.style.pointerEvents=`none`,n.style.zIndex=`2147483646`,n.setAttribute(`aria-hidden`,`true`),t.appendChild(n),!n)return null;_v=Av(),hv=n;let{innerWidth:r,innerHeight:i}=window;n.style.width=`${r}px`,n.style.height=`${i}px`;let a=r*_v,o=i*_v;n.width=a,n.height=o;let s=R().useOffscreenCanvasWorker===!1;if(Ov&&kv&&!window.__REACT_SCAN_EXTENSION__&&!s)try{let e=URL.createObjectURL(new Blob([pv],{type:`application/javascript`}));mv=new Worker(e);let t=n.transferControlToOffscreen();mv.postMessage({type:`init`,canvas:t,width:n.width,height:n.height,dpr:_v},[t])}catch(e){mv=null,R()._debug===`verbose`&&console.warn(`Failed to initialize OffscreenCanvas worker:`,e)}mv||(gv=lv(n,_v));let c=!1;window.addEventListener(`resize`,()=>{c||(c=!0,setTimeout(()=>{let e=window.innerWidth,t=window.innerHeight;_v=Av(),n.style.width=`${e}px`,n.style.height=`${t}px`,mv?mv.postMessage({type:`resize`,width:e,height:t,dpr:_v}):(n.width=e*_v,n.height=t*_v,gv&&(gv.resetTransform(),gv.scale(_v,_v)),Dv()),c=!1}))});let l=window.scrollX,u=window.scrollY,d=!1;return window.addEventListener(`scroll`,()=>{d||(d=!0,setTimeout(()=>{let{scrollX:e,scrollY:t}=window,n=e-l,r=t-u;l=e,u=t,mv?mv.postMessage({type:`scroll`,deltaX:n,deltaY:r}):requestAnimationFrame(cv.bind(null,yv,n,r)),d=!1},32))}),setInterval(()=>{xv.size&&requestAnimationFrame(Ev)},32),t.appendChild(n),e},Mv=()=>globalThis.__REACT_SCAN_STOP__,Nv=()=>{let e=document.querySelector(`[data-react-scan]`);e&&e.remove()},Pv=e=>{if(le(e)&&R().showToolbar!==!1&&L().kind===`focused`){var t,n;let r=e,{selfTime:i}=w(e),a=ye(e.type),o=Ee(r),s=Fn.reportData.get(o),c=(t=s==null?void 0:s.count)==null?0:t,l=(n=s==null?void 0:s.time)==null?0:n,u=[],d=Fn.changesListeners.get(Ee(e));if(d!=null&&d.length){let t=gr(e).map(e=>({type:1,name:e.name,value:e.value,prevValue:e.prevValue,unstable:!1})),n=tr(e),r=ar(e).map(e=>({name:e.name,type:4,value:e.value,contextType:e.contextType}));d.forEach(e=>{e({propsChanges:t,stateChanges:n,contextChanges:r})})}let f={count:c+1,time:l+i||0,renders:[],displayName:a,type:ve(e.type)||null,changes:u};Fn.reportData.set(o,f),Fv=!0}},Fv=!1,Lv=()=>{clearInterval(Iv),Iv=setInterval(()=>{Fv&&(jn(Date.now()),Fv=!1)},50)},Rv=e=>!Wx.has(e.memoizedProps),zv=!1,Bv=e=>{if(Mv()||zv)return;zv=!0;let t,n=!1,r=()=>{n||(t&&cancelAnimationFrame(t),t=requestAnimationFrame(()=>{n=!0;let t=jv();t&&document.documentElement.appendChild(t),e()}))},i=fr(`react-scan-devtools-0.1.0`,{onCommitStart:()=>{var e,t;(e=(t=R()).onCommitStart)==null||e.call(t)},onActive:(()=>{let e=!1;return()=>{Mv()||e||(e=!0,r(),window.__REACT_SCAN_EXTENSION__||(globalThis.__REACT_SCAN__={ReactScanInternals:Ax}),Lv(),K_())}})(),onError:()=>{},isValidFiber:Rv,onRender:(e,t)=>{var n,r;if(le(e)){var a;(a=Fn.interactionListeningForRenders)==null||a.call(Fn,e,t)}let o=i.getIsPaused(),s=L(),c=s.kind===`inspect-off`||s.kind===`uninitialized`;o&&c||(o||Sv(e),R().log&&G_(t),s.kind===`focused`&&Vp(),c||Pv(e),(n=(r=R()).onRender)==null||n.call(r,e,t))},onCommitFinish:()=>{var e,t;r(),(e=(t=R()).onCommitFinish)==null||e.call(t)},onPostCommitFiberRoot(){r()},trackChanges:!1});Ax.instrumentation=i}})),Hv,Uv,Wv,Gv,Kv,qv,Jv,Yv,Xv,Zv,Qv,$v,ey,ty,ny=r((()=>{G(),I(),Vv(),Kx(),zn(),Z(),Ug(),Xi(),d_(),Hv=B(`<div>`),Uv=B(`<div class="flex flex-col items-center justify-center h-full text-zinc-400"><p class="text-sm w-full text-left text-white mb-1.5">No data available</p><p class="text-x w-full text-lefts">No data was collected during this period`),Wv=B(`<div class="flex flex-col items-center justify-center h-full text-zinc-400"><p class="text-sm w-full text-left text-white mb-1.5">No renders collected</p><p class="text-x w-full text-lefts">There were no renders during this period`),Gv=B(`<div class="pl-3 flex flex-col gap-y-1 mt-1">`),Kv=B(`<div class=w-full><div><button><div style=min-width:fit-content></div><div><div class="flex items-center gap-x-2 min-w-0 w-full"><span></span></div></div></button><button><div class="w-[20px] flex items-center justify-center"></div><div class="flex items-center justify-end gap-x-1">`),qv=B(`<div style=line-height:10px>Memoizable`),Jv=B(`<span>x`),Yv=B(`<span class="text-[10px] text-[#7346a0] pr-1">ms`),Xv=B(`<div>Click to learn more`),Zv=B(`<div class=w-full><div class="w-full flex items-center relative text-xs"><div class="h-full w-full flex items-center relative"><div class="flex items-center rounded-sm text-white text-xs h-[28px] w-full"></div><div class="absolute inset-0 flex items-center px-2"><span class="truncate whitespace-nowrap text-white/70 w-full">`),Qv=()=>{let e=zi(),t=e.current?e.current:e.kind===`transition`?e.transitionTo:null;if(t){if(e.kind===`transition`){var n,r;Vi({kind:`move-out`,current:((n=e.current)==null?void 0:n.alpha)===0||(r=e.current)==null?e.transitionTo:r});return}Vi({kind:`move-out`,current:{alpha:0,...t}})}},$v=e=>{let t=Rx(),n=O(()=>{let n=e.selectedEvent,r=Rg(n.timing),i=n.groupedFiberRenders.map(e=>({event:e,kind:`render`,totalTime:t?e.count:e.totalTime})),a=n.kind===`dropped-frames`?n.timing.renderTime/r<.1:(n.timing.otherJSTime+n.timing.renderTime)/r<.2;return n.kind===`interaction`&&!t&&i.push({kind:`other-javascript`,totalTime:n.timing.otherJSTime}),a&&!t&&(n.kind===`interaction`?i.push({kind:`other-not-javascript`,totalTime:r-n.timing.renderTime-n.timing.otherJSTime}):i.push({kind:`other-frame-drop`,totalTime:r-n.timing.renderTime})),i}),r={lastCallAt:null,timer:null},i=O(()=>n().reduce((e,t)=>e+t.totalTime,0));return(()=>{var e=Hv();return U(e,()=>Ln(()=>{if(t&&n().length===0)return Uv();if(n().length===0)return Wv()}),null),U(e,A(Rt,{get each(){return n().toSorted((e,t)=>t.totalTime-e.totalTime)},children:e=>A(ty,{get bars(){return n()},bar:e,debouncedMouseEnter:r,get totalBarTime(){return i()},isProduction:t})}),null),E(()=>H(e,X([`flex flex-col h-full w-full gap-y-1`]))),e})()},ey=e=>e.current&&e.current.alpha>0?`fading-out`:`fading-in`,ty=({bar:e,debouncedMouseEnter:t,totalBarTime:n,isProduction:r,bars:i,depth:a=0})=>{let{setNotificationState:o,setRoute:s}=Hg(),[c,l]=T(!1),u=e.kind===`render`?e.event.parents.size===0:!0,d=i.filter(t=>t.kind===`render`&&e.kind===`render`?e.event.parents.has(t.event.name)&&t.event.name!==e.event.name:!1),f=e.kind===`render`?Array.from(e.event.parents).filter(e=>!i.some(t=>t.kind===`render`&&t.event.name===e)):[],p=()=>{e.kind===`render`?(o(`selectedFiber`,e.event),s({route:`render-explanation`,routeMessage:null})):s({route:`other-visualization`,routeMessage:{kind:`auto-open-overview-accordion`,name:e.kind}})};return(()=>{var o=Kv(),s=o.firstChild,m=s.firstChild,h=m.firstChild,g=h.nextSibling,_=g.firstChild,v=_.firstChild,y=m.nextSibling,b=y.firstChild,ee=b.nextSibling;return m.$$click=p,m.addEventListener(`mouseenter`,async()=>{let n=async()=>{if(t.lastCallAt=Date.now(),e.kind!==`render`){let e=zi(),t=e.current?e.current:e.kind===`transition`?e.transitionTo:null;if(!t){Vi({kind:`idle`,current:null});return}Vi({kind:`move-out`,current:{alpha:0,...t}});return}let n=zi(),r=Ln(()=>{switch(n.kind){case`transition`:return n.transitionTo;case`idle`:case`move-out`:return n.current}}),i=[];if(n.kind===`transition`){let t=ey(n);Ln(()=>{switch(t){case`fading-in`:Vi({kind:`transition`,current:n.transitionTo,transitionTo:{rects:i,alpha:0,name:e.event.name}});return;case`fading-out`:Vi({kind:`transition`,current:n.current?{...n.current}:null,transitionTo:{rects:i,alpha:0,name:e.event.name}});return}})}else Vi({kind:`transition`,transitionTo:{rects:i,alpha:0,name:e.event.name},current:r?{alpha:0,...r}:null});let a=e.event.elements.filter(e=>e instanceof Element);for await(let e of wv(a))e.forEach(({boundingClientRect:e})=>{i.push(e)}),qi()};if(t.lastCallAt&&Date.now()-t.lastCallAt<200){t.timer&&clearTimeout(t.timer),t.timer=setTimeout(()=>{n()},200);return}n()}),m.addEventListener(`mouseleave`,()=>{t.timer&&clearTimeout(t.timer),Qv()}),U(v,()=>Ln(()=>{switch(e.kind){case`other-frame-drop`:return`JavaScript, DOM updates, Draw Frame`;case`other-javascript`:return`JavaScript/React Hooks`;case`other-not-javascript`:return`Update DOM and Draw New Frame`;case`render`:return e.event.name}})),U(_,(()=>{var t=W(()=>!!(e.kind===`render`&&zg(e.event)));return()=>t()&&(()=>{var e=qv();return E(()=>H(e,X([`px-1 py-0.5 bg-[#6a369e] flex items-center rounded-sm font-semibold text-[8px] shrink-0`]))),e})()})(),null),y.$$click=()=>e.kind===`render`&&!u&&l(!c()),U(b,(()=>{var t=W(()=>e.kind===`render`&&!u);return()=>t()&&A(t_,{get class(){return X(`transition-transform`,c()&&`rotate-90`)},size:16})})()),Sa(ee,`min-width`,u?`fit-content`:r?`30px`:`60px`),U(ee,(()=>{var t=W(()=>e.kind===`render`);return()=>t()&&(()=>{var t=Jv();return t.firstChild,U(t,()=>e.event.count,null),E(()=>H(t,X([`text-[10px]`]))),t})()})(),null),U(ee,(()=>{var t=W(()=>e.kind!==`render`||!r);return()=>t()&&(()=>{var t=Yv(),n=t.firstChild;return U(t,(()=>{var t=W(()=>e.totalTime<1);return()=>t()?`<1`:e.totalTime.toFixed(0)})(),n),t})()})(),null),U(s,a===0&&(()=>{var e=Xv();return E(()=>H(e,X([`absolute right-0 top-1/2 transition-none -translate-y-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity mr-16`,`pointer-events-none`]))),e})(),null),U(o,A(j,{get when(){return W(()=>!!c())()&&(d.length>0||f.length>0)},get children(){var e=Gv();return U(e,A(Rt,{get each(){return d.toSorted((e,t)=>t.totalTime-e.totalTime)},children:e=>A(ty,{depth:a+1,bar:e,debouncedMouseEnter:t,totalBarTime:n,isProduction:r,bars:i})}),null),U(e,A(Rt,{each:f,children:e=>(()=>{var t=Zv(),n=t.firstChild.firstChild.firstChild.nextSibling.firstChild;return U(n,e),t})()}),null),e}}),null),E(t=>{var r=X([`w-full flex items-center relative text-xs min-w-0`]),i=X([`h-full w-[90%] flex items-center hover:bg-[#0f0f0f] rounded-l-md min-w-0 relative`]),a=`${e.totalTime/n*100}%`,o=X([`flex items-center rounded-sm text-white text-xs h-[28px] shrink-0`,e.kind===`render`&&`bg-[#412162] group-hover:bg-[#5b2d89]`,e.kind===`other-frame-drop`&&`bg-[#44444a] group-hover:bg-[#6a6a6a]`,e.kind===`other-javascript`&&`bg-[#efd81a6b] group-hover:bg-[#efda1a2f]`,e.kind===`other-not-javascript`&&`bg-[#214379d4] group-hover:bg-[#21437982]`]),c=X([`absolute inset-0 flex items-center px-2`,`min-w-0`]),l=X([`truncate`]),d=X([`flex items-center min-w-fit shrink-0 rounded-r-md h-[28px]`,!u&&`hover:bg-[#0f0f0f]`,e.kind===`render`&&!u?`cursor-pointer`:`cursor-default`]);return r!==t.e&&H(s,t.e=r),i!==t.t&&H(m,t.t=i),a!==t.a&&Sa(h,`width`,t.a=a),o!==t.o&&H(h,t.o=o),c!==t.i&&H(g,t.i=c),l!==t.n&&H(v,t.n=l),d!==t.s&&H(y,t.s=d),t},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),o})()},ga([`click`])})),ry,iy,ay,oy,sy,cy,ly,uy,dy=r((()=>{G(),Z(),Ug(),I(),d_(),Kx(),ry=B(`<div><button></button><div></div><div><div>How to stop renders</div><div>Stop the following props, state and context from changing between renders, and wrap the component in React.memo if not already`),iy=B(`<div><div></div><div><div>No changes detected</div><div>This component would not have rendered if it was memoized`),ay=B(`<div><div><button> <span>Overview</span></button><div><div><div class="flex items-center gap-x-2 truncate"></div></div><div><div>• Renders: <!>x</div></div></div></div><div><div><div>Changed Props</div></div><div><div>Changed State</div></div><div><div>Changed Context`),oy=B(`<div>• Render time: <!>ms`),sy=B(`<div>No changes`),cy=B(`<div><span></span><div>/<!>x`),ly=B(`<div><span>index </span><div>/<!>x`),uy=e=>{let{setRoute:t}=Hg(),[n,r]=T(!0),i=Rx();tt(()=>{let e=localStorage.getItem(`react-scan-tip-shown`),t=e===`true`?!0:e===`false`?!1:null;if(t===null){r(!0),localStorage.setItem(`react-scan-tip-is-shown`,`true`);return}t||r(!1)});let a=()=>e.selectedFiber.changes.context.length===0&&e.selectedFiber.changes.props.length===0&&e.selectedFiber.changes.state.length===0;return(()=>{var o=ay(),s=o.firstChild,c=s.firstChild,l=c.firstChild,u=c.nextSibling,d=u.firstChild,f=d.firstChild,p=d.nextSibling,m=p.firstChild,h=m.firstChild.nextSibling;h.nextSibling;var g=s.nextSibling,_=g.firstChild,v=_.firstChild,y=_.nextSibling,b=y.firstChild,ee=y.nextSibling,te=ee.firstChild;return c.$$click=()=>{t({route:`render-visualization`,routeMessage:null})},U(c,A(o_,{size:14}),l),U(f,()=>e.selectedFiber.name),U(p,!i&&(()=>{var t=oy(),n=t.firstChild.nextSibling;return n.nextSibling,U(t,()=>e.selectedFiber.totalTime.toFixed(0),n),E(()=>H(t,X([`text-xs text-gray-400`]))),t})(),m),U(m,()=>e.selectedFiber.count,h),U(o,A(j,{get when(){return W(()=>!!n())()&&!a()},get children(){var e=ry(),t=e.firstChild,n=t.nextSibling,i=n.nextSibling,a=i.firstChild,o=a.nextSibling;return t.$$click=()=>{r(!1),localStorage.setItem(`react-scan-tip-shown`,`false`)},U(t,A(r_,{size:12})),E(r=>{var s=X([`w-full mb-4 bg-[#0A0A0A] border border-[#27272A] rounded-sm overflow-hidden flex relative`]),c=X([`absolute right-2 top-2 rounded-sm p-1 hover:bg-[#18181B]`]),l=X([`w-1 bg-[#d36cff]`]),u=X([`flex-1`]),d=X([`px-3 py-2 text-gray-100 text-xs font-semibold`]),f=X([`px-3 pb-2 text-gray-400 text-[10px]`]);return s!==r.e&&H(e,r.e=s),c!==r.t&&H(t,r.t=c),l!==r.a&&H(n,r.a=l),u!==r.o&&H(i,r.o=u),d!==r.i&&H(a,r.i=d),f!==r.n&&H(o,r.n=f),r},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0}),e}}),g),U(o,A(j,{get when(){return a()},get children(){var e=iy(),t=e.firstChild,n=t.nextSibling,r=n.firstChild,i=r.nextSibling;return E(a=>{var o=X([`w-full mb-4 bg-[#0A0A0A] border border-[#27272A] rounded-sm overflow-hidden flex`]),s=X([`w-1 bg-[#d36cff]`]),c=X([`flex-1`]),l=X([`px-3 py-2 text-gray-100 text-sm font-semibold`]),u=X([`px-3 pb-2 text-gray-400 text-xs`]);return o!==a.e&&H(e,a.e=o),s!==a.t&&H(t,a.t=s),c!==a.a&&H(n,a.a=c),l!==a.o&&H(r,a.o=l),u!==a.i&&H(i,a.i=u),a},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),e}}),g),U(_,A(j,{get when(){return e.selectedFiber.changes.props.length>0},get fallback(){return(()=>{var e=sy();return E(()=>H(e,X([`flex items-center justify-center h-full bg-[#0A0A0A] text-[#A1A1AA] border-t border-[#27272A]`]))),e})()},get children(){return A(Rt,{get each(){return e.selectedFiber.changes.props.toSorted((e,t)=>t.count-e.count)},children:t=>(()=>{var n=cy(),r=n.firstChild,i=r.nextSibling,a=i.firstChild,o=a.nextSibling;return o.nextSibling,U(r,()=>t.name),U(i,()=>t.count,a),U(i,()=>e.selectedFiber.count,o),E(e=>{var t=X([`flex flex-col justify-between items-center border-t overflow-x-auto border-[#27272A] px-1 py-1 text-wrap bg-[#0A0A0A] text-[10px]`]),a=X([`text-white `]),o=X([` text-[8px]  text-[#d36cff] pl-1 py-1 `]);return t!==e.e&&H(n,e.e=t),a!==e.t&&H(r,e.t=a),o!==e.a&&H(i,e.a=o),e},{e:void 0,t:void 0,a:void 0}),n})()})}}),null),U(y,A(j,{get when(){return e.selectedFiber.changes.state.length>0},get fallback(){return(()=>{var e=sy();return E(()=>H(e,X([`flex items-center justify-center h-full bg-[#0A0A0A] text-[#A1A1AA] border-t border-[#27272A]`]))),e})()},get children(){return A(Rt,{get each(){return e.selectedFiber.changes.state.toSorted((e,t)=>t.count-e.count)},children:t=>(()=>{var n=ly(),r=n.firstChild;r.firstChild;var i=r.nextSibling,a=i.firstChild,o=a.nextSibling;return o.nextSibling,U(r,()=>t.index,null),U(i,()=>t.count,a),U(i,()=>e.selectedFiber.count,o),E(e=>{var t=X([`flex flex-col justify-between items-center border-t overflow-x-auto border-[#27272A] px-1 py-1 text-wrap bg-[#0A0A0A] text-[10px]`]),a=X([`text-white `]),o=X([`rounded-full  text-[#d36cff] pl-1 py-1 text-[8px]`]);return t!==e.e&&H(n,e.e=t),a!==e.t&&H(r,e.t=a),o!==e.a&&H(i,e.a=o),e},{e:void 0,t:void 0,a:void 0}),n})()})}}),null),U(ee,A(j,{get when(){return e.selectedFiber.changes.context.length>0},get fallback(){return(()=>{var e=sy();return E(()=>H(e,X([`flex items-center justify-center h-full bg-[#0A0A0A] text-[#A1A1AA] border-t border-[#27272A] py-2`]))),e})()},get children(){return A(Rt,{get each(){return e.selectedFiber.changes.context.toSorted((e,t)=>t.count-e.count)},children:t=>(()=>{var n=cy(),r=n.firstChild,i=r.nextSibling,a=i.firstChild,o=a.nextSibling;return o.nextSibling,U(r,()=>t.name),U(i,()=>t.count,a),U(i,()=>e.selectedFiber.count,o),E(e=>{var t=X([`flex flex-col justify-between items-center border-t  border-[#27272A] px-1 py-1 bg-[#0A0A0A] text-[10px] overflow-x-auto`]),a=X([`text-white `]),o=X([`rounded-full text-[#d36cff] pl-1 py-1 text-[8px] text-wrap`]);return t!==e.e&&H(n,e.e=t),a!==e.t&&H(r,e.t=a),o!==e.a&&H(i,e.a=o),e},{e:void 0,t:void 0,a:void 0}),n})()})}}),null),E(e=>{var t=X([`w-full min-h-fit h-full flex flex-col py-4 pt-0 rounded-sm`]),n=X([`flex items-start gap-x-4 `]),r=X([`text-white hover:bg-[#34343b] flex gap-x-1 justify-center items-center mb-4 w-fit px-2.5 py-1.5 text-xs rounded-sm bg-[#18181B]`]),i=X([`flex flex-col gap-y-1`]),a=X([`text-sm font-bold text-white overflow-x-hidden`]),l=X([`flex gap-x-2`]),f=X([`text-xs text-gray-400 mb-4`]),h=X([`flex w-full`]),ne=X([`flex flex-col border border-[#27272A] rounded-l-sm overflow-hidden w-1/3`]),x=X([`text-[14px] font-semibold px-2 py-2 bg-[#18181B] text-white flex justify-center`]),S=X([`flex flex-col border border-[#27272A] border-l-0 overflow-hidden w-1/3`]),re=X([` text-[14px] font-semibold px-2 py-2 bg-[#18181B] text-white flex justify-center`]),ie=X([`flex flex-col border border-[#27272A] border-l-0 rounded-r-sm overflow-hidden w-1/3`]),ae=X([` text-[14px] font-semibold px-2 py-2 bg-[#18181B] text-white flex justify-center`]);return t!==e.e&&H(o,e.e=t),n!==e.t&&H(s,e.t=n),r!==e.a&&H(c,e.a=r),i!==e.o&&H(u,e.o=i),a!==e.i&&H(d,e.i=a),l!==e.n&&H(p,e.n=l),f!==e.s&&H(m,e.s=f),h!==e.h&&H(g,e.h=h),ne!==e.r&&H(_,e.r=ne),x!==e.d&&H(v,e.d=x),S!==e.l&&H(y,e.l=S),re!==e.u&&H(b,e.u=re),ie!==e.c&&H(ee,e.c=ie),ae!==e.w&&H(te,e.w=ae),e},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0,d:void 0,l:void 0,u:void 0,c:void 0,w:void 0}),o})()},ga([`click`])})),fy,py,my,hy,gy,_y,vy,yy=r((()=>{G(),I(),xn(),Ks(),Z(),Ug(),d_(),y_(),W_(),ny(),dy(),fy=B(`<p>Click on an item in the <span>History</span> list to get started`),py=B(`<div><div><button></button></div><div><div><div><span>Scanning for slowdowns</span></div><p>You don't need to keep this panel open for React Scan to record slowdowns</p><p>Enable audio alerts to hear a delightful ding every time a large slowdown is recorded</p><button><span class="flex items-center gap-x-1">`),my=B(`<div id=overview-scroll-container>`),hy=B(`<div>Unable to show render details`),gy=B(`<div><div></div><div>`),_y=()=>{let{notificationState:e,setNotificationState:t}=Hg(),[n,r]=T(`...`);return tt(()=>{let e=setInterval(()=>{r(e=>e===`...`?``:`${e}.`)},500);k(()=>clearInterval(e))}),A(j,{get when(){return e.selectedEvent},get fallback(){return(()=>{var r=py(),i=r.firstChild,a=i.firstChild,o=i.nextSibling,s=o.firstChild,c=s.firstChild,l=c.firstChild;l.firstChild;var u=c.nextSibling,d=u.nextSibling,f=d.nextSibling,p=f.firstChild;return a.$$click=()=>{Bs({view:`none`})},U(a,A(r_,{size:18,class:`text-[#6F6F78]`})),U(l,n,null),U(s,A(j,{get when(){return e.events.length!==0},get children(){var e=fy(),t=e.firstChild.nextSibling;return E(n=>{var r=X([`text-xs`]),i=X([`text-purple-400`]);return r!==n.e&&H(e,n.e=r),i!==n.t&&H(t,n.t=i),n},{e:void 0,t:void 0}),e}}),u),f.$$click=()=>{let n=e.audioNotificationsOptions;if(n.enabled){n.audioContext.state!==`closed`&&n.audioContext.close(),localStorage.setItem(`react-scan-notifications-audio`,`false`),t(`audioNotificationsOptions`,{audioContext:null,enabled:!1});return}localStorage.setItem(`react-scan-notifications-audio`,`true`);let r=new AudioContext;bn(r),t(`audioNotificationsOptions`,{enabled:!0,audioContext:r})},U(p,()=>e.audioNotificationsOptions.enabled?`Disable audio alerts`:`Enable audio alerts`),E(e=>{var t=X([`h-full w-full flex flex-col items-center justify-center relative py-2 px-4`]),n=X([`p-2 flex justify-center items-center border-[#27272A] absolute top-0 right-0`]),a=X([`flex flex-col items-start pt-5 bg-[#0A0A0A] p-5 rounded-sm max-w-md`,`shadow-lg`]),p=X([`flex flex-col items-start gap-y-4`]),m=X([`flex items-center`]),h=X([`text-zinc-400 font-medium text-[17px]`]),g=X([`text-zinc-600 text-xs`]),_=X([`text-zinc-600 text-xs`]),v=X([`px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-sm w-full`,`text-sm flex items-center gap-x-2 justify-center`]);return t!==e.e&&H(r,e.e=t),n!==e.t&&H(i,e.t=n),a!==e.a&&H(o,e.a=a),p!==e.o&&H(s,e.o=p),m!==e.i&&H(c,e.i=m),h!==e.n&&H(l,e.n=h),g!==e.s&&H(u,e.s=g),_!==e.h&&H(d,e.h=_),v!==e.r&&H(f,e.r=v),e},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0}),r})()},children:t=>A(Bt,{get children(){return[A(Vt,{get when(){return e.route===`render-visualization`},get children(){return A(vy,{get children(){return A($v,{get selectedEvent(){return t()}})}})}}),A(Vt,{get when(){return e.route===`render-explanation`},get children(){return A(j,{get when(){return e.selectedFiber},get fallback(){return hy()},children:e=>A(vy,{get children(){return A(uy,{get selectedFiber(){return e()},get selectedEvent(){return t()}})}})})}}),A(Vt,{get when(){return e.route===`other-visualization`},get children(){return A(vy,{get children(){var e=my();return U(e,A(z_,{get selectedEvent(){return t()}})),E(()=>H(e,X([`flex w-full h-full flex-col overflow-y-auto`]))),e}})}})]}})})},vy=e=>{let{notificationState:t}=Hg();return(()=>{var n=gy(),r=n.firstChild,i=r.nextSibling;return U(r,A(j,{get when(){return t.selectedEvent},children:e=>A(v_,{get selectedEvent(){return e()}})})),U(i,()=>e.children),E(e=>{var t=X([`w-full h-full flex flex-col gap-y-2`]),a=X([`h-[50px] w-full`]),o=X([`h-calc(100%-50px) flex flex-col overflow-y-auto px-3`]);return t!==e.e&&H(n,e.e=t),a!==e.t&&H(r,e.t=a),o!==e.a&&H(i,e.a=o),e},{e:void 0,t:void 0,a:void 0}),n})()},ga([`click`])})),by,xy,Sy,Cy=r((()=>{G(),Z(),Ug(),d_(),Ks(),I(),by=B(`<div><div><div><span></span><span></span><div>ms processing time</div></div><div><div><button title=Close>`),xy=B(`<div><div><div>FPS Drop<div>dropped to <!> FPS</div></div><div><div><button>`),Sy=e=>W(O(()=>{let t=e.selectedEvent,n=Bg(t);switch(t.kind){case`interaction`:return(()=>{var e=by(),r=e.firstChild,i=r.firstChild,a=i.firstChild,o=a.nextSibling,s=o.nextSibling,c=s.firstChild,l=i.nextSibling,u=l.firstChild,d=u.firstChild;return U(a,()=>t.type===`click`?`Clicked `:`Typed in `),U(o,()=>Lg(t.componentPath)),U(s,()=>Rg(t.timing).toFixed(0),c),d.$$click=()=>{Bs({view:`none`})},U(d,A(r_,{size:18,class:`text-[#6F6F78]`})),E(t=>{var o=X([`w-full flex border-b border-[#27272A] min-h-[48px]`]),c=X([`min-w-fit w-full justify-start flex items-center border-r border-[#27272A] pl-5 pr-2 text-sm gap-x-4`]),d=X([`flex items-center gap-x-2 `]),f=X([`text-[#5a5a5a] mr-0.5`]),p=X([`w-fit flex items-center justify-center h-fit text-white px-1 rounded-sm font-semibold text-[10px] whitespace-nowrap`,n===`low`&&`bg-green-500/50`,n===`needs-improvement`&&`bg-[#b77116]`,n===`high`&&`bg-[#b94040]`]),m=X([`flex items-center gap-x-2  justify-end ml-auto`]),h=X([`p-2 flex justify-center items-center border-[#27272A]`]);return o!==t.e&&H(e,t.e=o),c!==t.t&&H(r,t.t=c),d!==t.a&&H(i,t.a=d),f!==t.o&&H(a,t.o=f),p!==t.i&&H(s,t.i=p),m!==t.n&&H(l,t.n=m),h!==t.s&&H(u,t.s=h),t},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),e})();case`dropped-frames`:return(()=>{var e=xy(),r=e.firstChild,i=r.firstChild,a=i.firstChild.nextSibling,o=a.firstChild.nextSibling;o.nextSibling;var s=i.nextSibling,c=s.firstChild,l=c.firstChild;return U(a,()=>t.fps,o),l.$$click=()=>{Bs({view:`none`})},U(l,A(r_,{size:18,class:`text-[#6F6F78]`})),E(t=>{var o=X([`w-full flex border-b border-[#27272A] min-h-[48px]`]),l=X([`min-w-fit w-full justify-start flex items-center border-r border-[#27272A] pl-5 pr-2 text-sm gap-x-4`]),u=X([`flex items-center gap-x-2 `]),d=X([`w-fit flex items-center justify-center h-fit text-white px-1 rounded-sm font-semibold text-[10px] whitespace-nowrap`,n===`low`&&`bg-green-500/50`,n===`needs-improvement`&&`bg-[#b77116]`,n===`high`&&`bg-[#b94040]`]),f=X([`flex items-center gap-x-2 w-2/4 justify-end ml-auto`]),p=X([`p-2 flex justify-center items-center border-[#27272A]`]);return o!==t.e&&H(e,t.e=o),l!==t.t&&H(r,t.t=l),u!==t.a&&H(i,t.a=u),d!==t.o&&H(a,t.o=d),f!==t.i&&H(s,t.i=f),p!==t.n&&H(c,t.n=p),t},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0}),e})()}})),ga([`click`])})),wy,Ty,Ey,Dy,Oy,ky=r((()=>{G(),I(),Z(),Ug(),d_(),Hy(),wy=B(`<div><button><div><span></span><span></span></div><div><div style=line-height:10px>x`),Ty=B(`<div class="relative pl-6 flex flex-col gap-y-1"><div class="absolute left-3 top-0 bottom-0 w-px bg-[#27272A]">`),Ey=(e,t)=>{let[n,r]=T(!1),i=0,a=0;return D(()=>{e();let n=t();if(i>=n)return;let o=Math.max(0,250-(Date.now()-a)),s,c,l=setTimeout(()=>{r(!1),s=setTimeout(()=>{i=n,a=Date.now(),r(!0),c=setTimeout(()=>r(!1),2e3)},50)},o);k(()=>{clearTimeout(l),s&&clearTimeout(s),c&&clearTimeout(c)})}),n},Dy=e=>{let[t,n]=T(!1),r=O(()=>e.item.events.map(Bg).reduce((e,t)=>{switch(t){case`high`:return`high`;case`needs-improvement`:return e===`high`?`high`:`needs-improvement`;case`low`:return e}},`low`)),i=Ey(O(()=>e.item.events.reduce((t,n)=>e.shouldFlash(n.id)?t+1:t,0)),()=>e.item.events.length);return(()=>{var a=wy(),o=a.firstChild,s=o.firstChild,c=s.firstChild,l=c.nextSibling,u=s.nextSibling,d=u.firstChild;return d.firstChild,o.$$click=()=>n(e=>!e),U(c,A(t_,{get class(){return X([`text-[#A1A1AA] transition-transform`,t()?`rotate-90`:``])},size:14})),U(l,(()=>{var t=W(()=>e.item.kind===`collapsed-frame-drops`);return()=>{var n,r;return t()?`FPS Drops`:Lg((n=(r=e.item.events.at(0))==null?void 0:r.componentPath)==null?[]:n)}})()),U(d,()=>e.item.events.length,null),U(a,A(j,{get when(){return t()},get children(){return A(Oy,{get children(){return A(Rt,{get each(){return e.item.events.toSorted((e,t)=>t.timestamp-e.timestamp)},children:t=>A(Ry,{event:t,get shouldFlash(){return e.shouldFlash(t.id)}})})}})}}),null),E(e=>{var n=X([`flex flex-col gap-y-0.5`]),f=X([`pl-2 py-1.5 text-sm flex items-center rounded-sm hover:bg-[#18181B] relative overflow-hidden`,i()&&!t()&&`after:absolute after:inset-0 after:bg-purple-500/30 after:animate-[fadeOut_1s_ease-out_forwards]`]),p=X([`w-4/5 flex items-center justify-start h-full text-xs truncate gap-x-1.5`]),m=X([`min-w-fit`]),h=X([`text-xs`]),g=X([`ml-auto min-w-fit flex justify-end items-center`]),_=X([`w-fit flex items-center text-[10px] justify-center h-full text-white px-1 py-1 rounded-sm font-semibold`,r()===`low`&&`bg-green-500/60`,r()===`needs-improvement`&&`bg-[#b77116] text-[10px]`,r()===`high`&&`bg-[#b94040]`]);return n!==e.e&&H(a,e.e=n),f!==e.t&&H(o,e.t=f),p!==e.a&&H(s,e.a=p),m!==e.o&&H(c,e.o=m),h!==e.i&&H(l,e.i=h),g!==e.n&&H(u,e.n=g),_!==e.s&&H(d,e.s=_),e},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),a})()},Oy=e=>(()=>{var t=Ty();return t.firstChild,U(t,()=>e.children,null),t})(),ga([`click`])})),Ay,jy,My,Ny,Py,Fy,Iy,Ly,Ry,zy,By,Vy,Hy=r((()=>{G(),I(),Fi(),zn(),Z(),ky(),Ug(),d_(),h_(),Ay=B(`<button><div><span></span><span></span></div><div><div style=line-height:10px><div style=line-height:10px>ms`),jy=B(`<button><div> FPS Drop</div><div><div style=line-height:10px> FPS`),My=B(`<div>Clear all events`),Ny=B(`<div><div><span>History</span></div><div>`),Py=B(`<button title="Clear all events">`),Fy=B(`<div>No Events`),Iy=e=>{let t=[],n=!0,[r,i]=T(new Set);return D(()=>{let r=e();if(n){n=!1,t=r;return}let a=new Set(t.map(e=>e.id)),o=new Set(r.map(e=>e.id).filter(e=>!a.has(e)));if(o.size>0){i(o);let e=setTimeout(()=>i(new Set),2e3);k(()=>clearTimeout(e))}t=r}),e=>r().has(e)},Ly=e=>{let[t,n]=T(e());return D(()=>{if(!e())return;n(!0);let t=setTimeout(()=>n(!1),1e3);k(()=>clearTimeout(t))}),t},Ry=e=>{let{notificationState:t,setNotificationState:n}=Hg(),r=Ly(()=>e.shouldFlash);return W(()=>O(()=>{let i=e.event,a=Bg(i);switch(i.kind){case`interaction`:return(()=>{var e=Ay(),o=e.firstChild,s=o.firstChild,c=s.nextSibling,l=o.nextSibling,u=l.firstChild,d=u.firstChild,f=d.firstChild;return e.$$click=()=>{n({selectedEvent:i,route:`render-visualization`,selectedFiber:null})},U(s,(()=>{var e=W(()=>i.type===`click`);return()=>e()?A(s_,{size:14}):A(c_,{size:14})})()),U(c,()=>Lg(i.componentPath)),U(d,()=>Rg(i.timing).toFixed(0),f),E(n=>{var f,p=X([`pl-2 py-1.5 text-sm flex w-full items-center rounded-sm hover:bg-[#18181B] relative overflow-hidden`,i.id===((f=t.selectedEvent)==null?void 0:f.id)&&`bg-[#18181B]`,r()&&`after:absolute after:inset-0 after:bg-purple-500/30 after:animate-[fadeOut_1s_ease-out_forwards]`]),m=X([`w-4/5 flex items-center justify-start h-full gap-x-1.5`]),h=X([`min-w-fit text-xs`]),g=X([`text-xs pr-1 truncate`]),_=X([`min-w-fit flex justify-end items-center ml-auto`]),v=X([`gap-x-0.5 w-fit flex items-end justify-center h-full text-white px-1 py-1 rounded-sm font-semibold text-[10px]`,a===`low`&&`bg-green-500/50`,a===`needs-improvement`&&`bg-[#b77116] text-[10px]`,a===`high`&&`bg-[#b94040]`]),y=X([`text-[10px] text-white flex items-end`]);return p!==n.e&&H(e,n.e=p),m!==n.t&&H(o,n.t=m),h!==n.a&&H(s,n.a=h),g!==n.o&&H(c,n.o=g),_!==n.i&&H(l,n.i=_),v!==n.n&&H(u,n.n=v),y!==n.s&&H(d,n.s=y),n},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),e})();case`dropped-frames`:return(()=>{var e=jy(),o=e.firstChild,s=o.firstChild,c=o.nextSibling,l=c.firstChild,u=l.firstChild;return e.$$click=()=>{n({selectedEvent:i,route:`render-visualization`,selectedFiber:null})},U(o,A(u_,{size:14,class:`mr-1.5`}),s),U(l,()=>i.fps,u),E(n=>{var s,u=X([`pl-2 py-1.5 w-full text-sm flex items-center rounded-sm hover:bg-[#18181B] relative overflow-hidden`,i.id===((s=t.selectedEvent)==null?void 0:s.id)&&`bg-[#18181B]`,r()&&`after:absolute after:inset-0 after:bg-purple-500/30 after:animate-[fadeOut_1s_ease-out_forwards]`]),d=X([`w-4/5 flex items-center justify-start h-full text-xs truncate`]),f=X([`min-w-fit flex justify-end items-center ml-auto`]),p=X([`w-fit flex items-center justify-center h-full text-white px-1 py-1 rounded-sm text-[10px] font-bold`,a===`low`&&`bg-green-500/60`,a===`needs-improvement`&&`bg-[#b77116] text-[10px]`,a===`high`&&`bg-[#b94040]`]);return u!==n.e&&H(e,n.e=u),d!==n.t&&H(o,n.t=d),f!==n.a&&H(c,n.a=f),p!==n.o&&H(l,n.o=p),n},{e:void 0,t:void 0,a:void 0,o:void 0}),e})()}})())},zy=e=>e.reduce((e,t)=>{let n=e.at(-1);if(!n)return[{kind:`single`,event:t,timestamp:t.timestamp}];switch(n.kind){case`collapsed-keyboard`:if(t.kind===`interaction`&&t.type===`keyboard`&&t.componentPath.join(`-`)===n.events[0].componentPath.join(`-`)){let r=[...n.events,t];return[...e.filter(e=>e!==n),{kind:`collapsed-keyboard`,events:r,timestamp:Math.max(...r.map(e=>e.timestamp))}]}break;case`single`:if(n.event.kind===`interaction`&&n.event.type===`keyboard`&&t.kind===`interaction`&&t.type===`keyboard`&&n.event.componentPath.join(`-`)===t.componentPath.join(`-`))return[...e.filter(e=>e!==n),{kind:`collapsed-keyboard`,events:[n.event,t],timestamp:Math.max(n.event.timestamp,t.timestamp)}];if(n.event.kind===`dropped-frames`&&t.kind===`dropped-frames`)return[...e.filter(e=>e!==n),{kind:`collapsed-frame-drops`,events:[n.event,t],timestamp:Math.max(n.event.timestamp,t.timestamp)}];break;case`collapsed-frame-drops`:if(t.kind===`dropped-frames`){let r=[...n.events,t];return[...e.filter(e=>e!==n),{kind:`collapsed-frame-drops`,events:r,timestamp:Math.max(...r.map(e=>e.timestamp))}]}break}return[...e,{kind:`single`,event:t,timestamp:t.timestamp}]},[]),By=(e=150)=>{let{notificationState:t}=Hg(),[n,r]=T([...t.events]);return D(()=>{let n=[...t.events],i=setTimeout(()=>r(n),e);k(()=>clearTimeout(i))}),[n,r]},Vy=()=>{let{notificationState:e,setNotificationState:t}=Hg(),n=Iy(()=>e.events),[r,i]=By(),a=O(()=>zy(r()).toSorted((e,t)=>t.timestamp-e.timestamp));return(()=>{var r=Ny(),o=r.firstChild;o.firstChild;var s=o.nextSibling;return U(o,A(m_,{wrapperProps:{class:`h-full flex items-center justify-center ml-auto`},get triggerContent(){return(()=>{var n=Py();return n.$$click=()=>{Ti(),t({selectedEvent:null,selectedFiber:null,route:e.route===`other-visualization`?`other-visualization`:`render-visualization`}),i([])},U(n,A(l_,{size:16})),E(()=>H(n,X([`hover:bg-[#18181B] rounded-full p-2`]))),n})()},get children(){var e=My();return E(()=>H(e,X([`w-full flex justify-center`]))),e}}),null),U(s,A(j,{get when(){return a().length>0},get fallback(){return(()=>{var e=Fy();return E(()=>H(e,X([`flex items-center justify-center text-zinc-500 text-sm py-4`]))),e})()},get children(){return A(Rt,{get each(){return a()},children:e=>Ln(()=>{switch(e.kind){case`collapsed-keyboard`:case`collapsed-frame-drops`:return A(Dy,{shouldFlash:n,item:e});case`single`:return A(Ry,{get event(){return e.event},get shouldFlash(){return n(e.event.id)}})}})})}})),E(e=>{var t=X([`w-full h-full gap-y-2 flex flex-col border-r border-[#27272A] overflow-y-auto`]),n=X([`text-sm text-[#65656D] pl-3 pr-1 w-full flex items-center justify-between`]),i=X([`flex flex-col px-1 gap-y-1`]);return t!==e.e&&H(r,e.e=t),n!==e.t&&H(o,e.t=n),i!==e.a&&H(s,e.a=i),e},{e:void 0,t:void 0,a:void 0}),r})()},ga([`click`])})),Uy,Wy,Gy,Ky,qy,Jy,Yy,Xy,Zy,Qy,$y,eb,tb,nb,rb,ib=r((()=>{G(),I(),Ig(),Fi(),zn(),xn(),Z(),Ug(),yy(),Cy(),ny(),Hy(),Uy=B(`<div><div><div></div><div>`),Wy=B(`<div>`),Gy=B(`<div><span class="text-[#6F6F78] text-xs font-medium"></span><div class="font-mono text-[#E4E4E7] flex items-center bg-[#27272A] pl-2 py-1 rounded-sm overflow-x-auto">`),Ky=B(`<div><div><div><span class="text-[#6F6F78] text-xs font-medium">Total Time</span><span class="text-[#E4E4E7] bg-[#27272A] px-1.5 py-1 rounded-sm text-xs">ms</span></div><div><span class="text-[#6F6F78] text-xs font-medium">Occurred</span><span class="text-[#E4E4E7] bg-[#27272A] px-1.5 py-1 rounded-sm text-xs">`),qy=B(`<span class="text-[10px] whitespace-nowrap"style=line-height:14px>`),Jy=B(`<span class="text-[#6F6F78] mx-0.5">‹`),Yy=1e3,Xy=5e3,Zy=e=>Object.values(e).map(e=>({id:yn(),totalTime:e.nodeInfo.reduce((e,t)=>e+t.selfTime,0),count:e.nodeInfo.length,name:e.nodeInfo[0].name,deletedAll:!1,parents:e.parents,hasMemoCache:e.hasMemoCache,wasFiberRenderMount:e.wasFiberRenderMount,elements:e.nodeInfo.map(e=>e.element),changes:{context:e.changes.fiberContext.current.filter(t=>e.changes.fiberContext.changesCounts.get(t.name)).map(t=>{var n;return{name:String(t.name),count:(n=e.changes.fiberContext.changesCounts.get(t.name))==null?0:n}}),props:e.changes.fiberProps.current.filter(t=>e.changes.fiberProps.changesCounts.get(t.name)).map(t=>{var n;return{name:String(t.name),count:(n=e.changes.fiberProps.changesCounts.get(t.name))==null?0:n}}),state:e.changes.fiberState.current.filter(t=>e.changes.fiberState.changesCounts.get(Number(t.name))).map(t=>{var n;return{index:Number(t.name),count:(n=e.changes.fiberState.changesCounts.get(Number(t.name)))==null?0:n}})}})),Qy=e=>{tt(()=>{let t=setInterval(()=>{e().forEach(e=>{e.groupedFiberRenders.forEach(e=>{if(e.deletedAll)return;if(e.elements.length===0){e.deletedAll=!0;return}let t=e.elements.length;e.elements=e.elements.filter(e=>e.isConnected),e.elements.length===0&&t>0&&(e.deletedAll=!0)})})},Xy);k(()=>clearInterval(t))})},$y=()=>{let[e,t]=T(Ci());tt(()=>{k(wi(()=>{t(()=>Ci())}))});let n=O(()=>{let t=[];return e().forEach(e=>{let n=Zy(e.kind===`interaction`?e.data.meta.detailedTiming.fiberRenders:e.data.meta.fiberRenders),r=n.reduce((e,t)=>e+t.totalTime,0);switch(e.kind){case`interaction`:{let{commitEnd:i,jsEndDetail:a,interactionStartDetail:o,rafStart:s}=e.data.meta.detailedTiming;a-o-r;let c=Math.max(0,a-o-r),l=Math.max(e.data.meta.latency-(i-o),0);t.push({componentPath:e.data.meta.detailedTiming.componentPath,groupedFiberRenders:n,id:e.id,kind:`interaction`,memory:null,timestamp:e.data.startAt,type:e.data.meta.detailedTiming.interactionType===`keyboard`?`keyboard`:`click`,timing:{renderTime:r,kind:`interaction`,otherJSTime:c,framePreparation:s-a,frameConstruction:i-s,frameDraw:l}});break}case`long-render`:t.push({kind:`dropped-frames`,id:e.id,memory:null,timing:{kind:`dropped-frames`,renderTime:r,otherTime:e.data.meta.latency},groupedFiberRenders:n,timestamp:e.data.startAt,fps:e.data.meta.fps});break}}),t});return Qy(n),n},eb=()=>{let{notificationState:e,setNotificationState:t}=Hg(),[n]=By(),r=null,i,a=0,o=O(()=>n().filter(e=>Bg(e)===`high`).length);return tt(()=>{let n=localStorage.getItem(`react-scan-notifications-audio`);if(n!==`false`&&n!==`true`){localStorage.setItem(`react-scan-notifications-audio`,`false`);return}n===`true`&&!e.audioNotificationsOptions.enabled&&t(`audioNotificationsOptions`,{enabled:!0,audioContext:new AudioContext})}),D(()=>{let t=o(),n=e.audioNotificationsOptions;if(!n.enabled||t===0||r!==null&&r>=t)return;i&&clearTimeout(i);let s=Math.max(0,Yy-(Date.now()-a));i=setTimeout(()=>{bn(n.audioContext),r=t,a=Date.now(),i=void 0},s)}),D(()=>{o()===0&&(r=null)}),k(()=>{i&&clearTimeout(i)}),null},tb=e=>{var t;let n=$y(),r=n(),[i,a]=Ag({detailsExpanded:!1,events:r,filterBy:`latest`,moreInfoExpanded:!1,route:`render-visualization`,selectedEvent:(t=r.toSorted((e,t)=>e.timestamp-t.timestamp).at(-1))==null?null:t,selectedFiber:null,routeMessage:null,audioNotificationsOptions:{enabled:!1,audioContext:null}});return D(()=>{a(`events`,n())}),A(Vg.Provider,{value:{notificationState:i,setNotificationState:a,setRoute:({route:e,routeMessage:t})=>{Qv(),a({route:e,routeMessage:t,selectedFiber:e===`render-explanation`?i.selectedFiber:null})}},get children(){return[A(eb,{}),A(nb,{ref(t){var n=e.ref;typeof n==`function`?n(t):e.ref=t}})]}})},nb=e=>{let{notificationState:t}=Hg();return(()=>{var n=Uy(),r=n.firstChild,i=r.firstChild,a=i.nextSibling,o=e.ref;return typeof o==`function`?wa(o,n):e.ref=n,U(n,A(j,{get when(){return t.selectedEvent},children:e=>(()=>{var n=Wy();return U(n,A(Sy,{get selectedEvent(){return e()}}),null),U(n,A(j,{get when(){return t.moreInfoExpanded},get children(){return A(rb,{})}}),null),E(()=>H(n,X([`w-full h-[48px] flex flex-col`,t.moreInfoExpanded&&`h-[235px]`,t.moreInfoExpanded&&e().kind===`dropped-frames`&&`h-[150px]`]))),n})()}),r),U(i,A(Vy,{})),U(a,A(_y,{})),E(e=>{var o,s=X([`h-full w-full flex flex-col`]),c=X([`flex`,t.selectedEvent?`h-[calc(100%-48px)]`:`h-full`,t.moreInfoExpanded&&`h-[calc(100%-200px)]`,t.moreInfoExpanded&&((o=t.selectedEvent)==null?void 0:o.kind)===`dropped-frames`&&`h-[calc(100%-150px)]`]),l=X([`h-full min-w-[200px]`]),u=X([`w-[calc(100%-200px)] h-full overflow-y-auto`]);return s!==e.e&&H(n,e.e=s),c!==e.t&&H(r,e.t=c),l!==e.a&&H(i,e.a=l),u!==e.o&&H(a,e.o=u),e},{e:void 0,t:void 0,a:void 0,o:void 0}),n})()},rb=()=>{let{notificationState:e}=Hg(),t=O(()=>{var t;return((t=e.selectedEvent)==null?void 0:t.kind)===`interaction`?e.selectedEvent:null});return A(j,{get when(){return e.selectedEvent},children:e=>(()=>{var n=Ky(),r=n.firstChild,i=r.firstChild,a=i.firstChild.nextSibling,o=a.firstChild,s=i.nextSibling,c=s.firstChild.nextSibling;return U(r,A(j,{get when(){return e().kind===`interaction`},get children(){var e=Gy(),n=e.firstChild,r=n.nextSibling;return U(n,()=>{var e;return((e=t())==null?void 0:e.type)===`click`?`Clicked component location`:`Typed in component location`}),U(r,A(Rt,{get each(){var e,n;return(e=(n=t())==null?void 0:n.componentPath.toReversed())==null?[]:e},children:(e,n)=>[(()=>{var t=qy();return U(t,e),t})(),A(j,{get when(){var e,r;return n()<((e=(r=t())==null?void 0:r.componentPath.length)==null?0:e)-1},get children(){return Jy()}})]})),E(()=>H(e,X([`flex items-center gap-x-3`]))),e}}),i),U(a,()=>Rg(e().timing).toFixed(0),o),U(c,()=>`${((Date.now()-e().timestamp)/1e3).toFixed(0)}s ago`),E(t=>{var a=X([`px-4 py-2 border-b border-[#27272A] bg-[#18181B]/50 h-[calc(100%-40px)]`,e().kind===`dropped-frames`&&`h-[calc(100%-25px)]`]),o=X([`flex flex-col gap-y-4 h-full`]),c=X([`flex items-center gap-x-3`]),l=X([`flex items-center gap-x-3`]);return a!==t.e&&H(n,t.e=a),o!==t.t&&H(r,t.t=o),c!==t.a&&H(i,t.a=c),l!==t.o&&H(s,t.o=l),t},{e:void 0,t:void 0,a:void 0,o:void 0}),n})()})}})),ab,ob,sb,cb,lb,ub,db,fb,pb=r((()=>{G(),I(),In(),Ks(),Z(),rm(),gg(),ib(),ab=B(`<div><div><div>`),ob=B(`<div><div class="absolute inset-0 flex">`),sb=()=>L().kind===`inspecting`,cb=()=>X(`relative flex flex-1 flex-col overflow-hidden rounded-xl opacity-100`,`transition-opacity`,sb()&&`opacity-0 duration-0 delay-0`),lb=()=>zs().view===`inspector`,ub=()=>zs().view===`notifications`,db=()=>(()=>{var e=ab(),t=e.firstChild,n=t.firstChild;return U(t,A(nm,{}),n),U(n,A(fb,{isOpen:lb,get children(){return A(hg,{})}}),null),U(n,A(fb,{isOpen:ub,get children(){return A(tb,{})}}),null),E(r=>{var i=X(`flex flex-1 flex-col overflow-hidden rounded-xl`,`border border-[var(--rs-border-subtle)]`,`bg-[var(--rs-panel-bg)] text-[var(--rs-text-primary)]`,`[box-shadow:var(--rs-shadow)]`,`peer-hover/left:rounded-l-none`,`peer-hover/right:rounded-r-none`,`peer-hover/top:rounded-t-none`,`peer-hover/bottom:rounded-b-none`),a=cb(),o=X(`relative flex flex-1 overflow-hidden`,`bg-[var(--rs-panel-bg)] text-[var(--rs-text-primary)]`,`transition-opacity delay-150`);return i!==r.e&&H(e,r.e=i),a!==r.t&&H(t,r.t=a),o!==r.a&&H(n,r.a=o),r},{e:void 0,t:void 0,a:void 0}),e})(),fb=e=>{let t=O(()=>X(`flex-1 opacity-0 overflow-y-auto overflow-x-hidden`,`transition-opacity delay-0 pointer-events-none`,e.isOpen()&&`opacity-100 delay-150 pointer-events-auto`));return(()=>{var n=ob(),r=n.firstChild;return U(r,()=>e.children),E(()=>H(n,t())),n})()}})),mb,hb,gb,_b=r((()=>{G(),I(),na(),Z(),mb=B(`<div>`),hb=0,gb=e=>{let[t,n]=T(!1),[r,i]=T(!0),a;D(()=>{if(clearTimeout(a),!e.visible){t()&&(hb=Date.now()),n(!1);return}if(Date.now()-hb<800){i(!1),n(!0);return}i(!0),a=setTimeout(()=>n(!0),400)}),k(()=>{clearTimeout(a),t()&&(hb=Date.now())});let o=()=>e.position===`top`||e.position===`bottom`?{left:`50%`,translate:`-50%`,"z-index":ta}:{top:`50%`,translate:`0 -50%`,"z-index":ta};return A(j,{get when(){return t()},get children(){var t=mb();return U(t,()=>e.children),E(n=>{var i=X(`absolute whitespace-nowrap px-2 py-0.5 rounded-full`,`text-[10px] font-sans font-medium leading-4 pointer-events-none`,`bg-[var(--rs-panel-bg)] text-[var(--rs-text-primary)]`,`[box-shadow:var(--rs-shadow)]`,e.position===`top`&&`bottom-full mb-2.5`,e.position===`bottom`&&`top-full mt-2.5`,e.position===`left`&&`right-full mr-2.5`,e.position===`right`&&`left-full ml-2.5`,r()&&`animate-[react-scan-tooltip-in_100ms_ease-out]`),a=o();return i!==n.e&&H(t,n.e=i),n.t=xa(t,a,n.t),n},{e:void 0,t:void 0}),t}})}})),vb,yb,bb=r((()=>{G(),I(),Z(),vb=B(`<div><input type=checkbox><div>`),yb=e=>{let[t,n]=Lt(e,[`class`]);return(()=>{var e=vb(),r=e.firstChild;return Ca(r,n,!1,!1),E(()=>H(e,X(`react-scan-toggle`,t.class))),e})()}})),xb,Sb,Cb,wb,Tb=r((()=>{G(),I(),pr(),na(),Z(),xb=B(`<div><div class="text-sm font-semibold tracking-wide transition-colors ease-in-out w-full flex justify-center items-center"></div><span class="text-white/30 text-[11px] font-medium tracking-wide ml-auto min-w-fit">FPS`),Sb=B(`<div>`),Cb=e=>{let t=e=>e<30?`#EF4444`:e<50?`#F59E0B`:`rgb(214,132,245)`;return(()=>{var n=xb(),r=n.firstChild;return U(r,()=>e.fps),E(i=>{var a=X(`flex items-center gap-x-1 px-2 w-full`,`h-6`,`rounded-md`,`font-mono leading-none`,`bg-[#141414]`,`ring-1 ring-white/[0.08]`),o=t(e.fps);return a!==i.e&&H(n,i.e=a),o!==i.t&&Sa(r,`color`,i.t=o),i},{e:void 0,t:void 0}),n})()},wb=()=>{let[e,t]=T();return tt(()=>{let e=setInterval(()=>{t(Zn())},200);k(()=>clearInterval(e))}),(()=>{var t=Sb();return U(t,A(j,{get when(){return e()},children:e=>A(Cb,{get fps(){return e()}})})),E(()=>H(t,X(`flex items-center justify-end gap-x-2 px-1 ml-1 w-[72px]`,`whitespace-nowrap text-sm text-white`))),t})()}})),Eb,Db,Ob=r((()=>{G(),I(),Kx(),In(),Ka(),_b(),bb(),na(),Ks(),Z(),Tb(),Ug(),d_(),ib(),Eb=B(`<div class="flex h-7 items-center gap-0.5 rounded-full border border-[var(--rs-border-subtle)] bg-[var(--rs-panel-bg)] px-1 text-[var(--rs-text-secondary)] [box-shadow:var(--rs-shadow)]"><div class="flex h-5 w-5 items-center justify-center text-[#8e61e3]"></div><div class="relative size-5"><button type=button id=react-scan-inspect-element title="Inspect element"aria-label="Inspect element"></button></div><div class="relative size-5"><button type=button id=react-scan-notifications title=Notifications aria-label=Notifications></button></div><div class="relative size-5"><button type=button title="Collapse React Scan"aria-label="Collapse React Scan"class="react-scan-interactive-scale react-scan-a11y-hitbox flex size-5 items-center justify-center rounded-full hover:bg-[var(--rs-surface-hover)]">`),Db=e=>{let t=$y(),[n,r]=T(t()),[i,a]=T([]),[o,s]=T(null),c=L,l=()=>c().kind===`inspecting`,u=()=>c().kind===`focused`;D(()=>{let e=t(),n=setTimeout(()=>{r(e)},600);k(()=>clearTimeout(n))});let d=()=>{switch(L().kind){case`inspecting`:Bs({view:`none`}),kn({kind:`inspect-off`});return;case`focused`:Bs({view:`inspector`}),kn({kind:`inspecting`,hoveredDomElement:null});return;case`inspect-off`:Bs({view:`none`}),kn({kind:`inspecting`,hoveredDomElement:null});return;case`uninitialized`:return}},f=e=>{if(e.preventDefault(),e.stopPropagation(),!Ax.instrumentation)return;let t=!Ax.instrumentation.getIsPaused();Ax.instrumentation.setIsPaused(t),Ds(`react-scan-options`,{...Ts(`react-scan-options`),enabled:!t})};D(()=>{L().kind===`uninitialized`&&kn({kind:`inspect-off`})}),D(()=>{zs().view===`notifications`&&a([...new Set(t().map(e=>e.id)).values()])});let p=O(()=>u()?`icon-focus`:`icon-inspect`),m=()=>l()||u(),h=()=>{switch(e.edge){case`top`:return`-rotate-90`;case`bottom`:return`rotate-90`;case`left`:return`rotate-180`;case`right`:return``}},g=()=>{switch(e.edge){case`top`:return`bottom`;case`bottom`:return`top`;case`left`:return`right`;case`right`:return`left`}},_=()=>{if(L().kind!==`inspect-off`&&kn({kind:`inspect-off`}),zs().view===`notifications`){Bs({view:`none`});return}a(t().map(e=>e.id)),Bs({view:`notifications`})};return(()=>{var t=Eb(),r=t.firstChild,a=r.nextSibling,c=a.firstChild,l=a.nextSibling,u=l.firstChild,v=l.nextSibling,y=v.firstChild;return U(r,A(K,{name:`icon-react-scan-logo`,size:14})),a.addEventListener(`mouseleave`,()=>s(null)),a.addEventListener(`mouseenter`,()=>s(`inspect`)),c.$$click=d,U(c,A(K,{get name(){return p()},size:13})),U(a,A(gb,{get visible(){return o()===`inspect`},get position(){return g()},children:`Inspect element`}),null),l.addEventListener(`mouseleave`,()=>s(null)),l.addEventListener(`mouseenter`,()=>s(`notifications`)),u.$$click=_,U(u,A(n_,{get events(){return n().filter(e=>!i().includes(e.id)).map(e=>Bg(e)===`high`)},size:13,class:`text-current`})),U(l,A(gb,{get visible(){return o()===`notifications`},get position(){return g()},children:`Notifications`}),null),U(t,A(yb,{get checked(){var e;return!((e=Ax.instrumentation)!=null&&e.getIsPaused())},onChange:f,class:`mx-0.5 scale-75`,title:`Outline re-renders`,"aria-label":`Outline re-renders`}),v),U(t,A(j,{get when(){return R().showFPS},get children(){return A(wb,{})}}),v),v.addEventListener(`mouseleave`,()=>s(null)),v.addEventListener(`mouseenter`,()=>s(`collapse`)),ya(y,`click`,e.onCollapse,!0),U(y,A(K,{name:`icon-chevron-right`,size:11,get class(){return X(`transition-transform duration-200`,h())}})),U(v,A(gb,{get visible(){return o()===`collapse`},get position(){return g()},children:`Collapse`}),null),E(e=>{var t=m(),n=X(`react-scan-interactive-scale react-scan-a11y-hitbox`,`flex size-5 items-center justify-center rounded-full`,`hover:bg-[var(--rs-surface-hover)]`,m()&&`bg-[#8e61e3] text-white`),r=zs().view===`notifications`,i=X(`react-scan-interactive-scale react-scan-a11y-hitbox`,`flex size-5 items-center justify-center rounded-full`,`hover:bg-[var(--rs-surface-hover)]`,zs().view===`notifications`&&`bg-[var(--rs-surface-active)] text-[#8e61e3]`);return t!==e.e&&V(c,`aria-pressed`,e.e=t),n!==e.t&&H(c,e.t=n),r!==e.a&&V(u,`aria-pressed`,e.a=r),i!==e.o&&H(u,e.o=i),e},{e:void 0,t:void 0,a:void 0,o:void 0}),t})()},ga([`click`])})),kb,Ab,jb,Mb,Nb,Pb,Fb=r((()=>{G(),Ge(),I(),In(),qe(),Ks(),Z(),wm(),kb=B(`<div style=pointer-events:none>`),Ab=B(`<canvas dir=ltr>`),jb=(e,t,n)=>e+(t-e)*n,Mb={frameInterval:1e3/60,speeds:{fast:.51,slow:.1,off:0}},Nb=Ke&&window.devicePixelRatio||1,Pb=()=>{let e,t,n=null,r=null,i=null,a=0,o,s=new Map,c=!1,l=0,u=(e,t,n,r)=>{e.save(),e.strokeStyle=`white`,e.fillStyle=`white`,e.lineWidth=1.5;let i=r*.6,a=r*.5,o=t+(r-i)/2,s=n;e.beginPath(),e.arc(o+i/2,s+a/2,i/2,Math.PI,0,!1),e.stroke();let c=r*.8,l=r*.5,u=t+(r-c)/2,d=n+a/2;e.fillRect(u,d,c,l),e.restore()},d=(e,t,n,i)=>{var a;if(!i)return;let o=(a=(i==null?void 0:i.type)&&ye(i.type))==null?`Unknown`:a;e.save(),e.font=`12px system-ui, -apple-system, sans-serif`;let s=e.measureText(o).width,c=n===`locked`?14:0,l=n===`locked`?6:0,d=s+16+c+l,f=t.left,p=t.top-24-4;if(e.fillStyle=`rgb(37, 37, 38, .75)`,e.beginPath(),e.roundRect(f,p,d,24,3),e.fill(),n===`locked`){let t=f+8,n=p+(24-c)/2+2;u(e,t,n,c),r={x:t,y:n,width:c,height:c}}else r=null;e.fillStyle=`white`,e.textBaseline=`middle`;let m=f+8+(n===`locked`?c+l:0);e.fillText(o,m,p+24/2),e.restore()},f=(e,t,r,i)=>{if(!n)return;let a=n;t.clearRect(0,0,e.width,e.height),t.strokeStyle=`rgba(142, 97, 227, 0.5)`,t.fillStyle=`rgba(173, 97, 230, 0.10)`,r===`locked`?t.setLineDash([]):t.setLineDash([4]),t.lineWidth=1,t.fillRect(a.left,a.top,a.width,a.height),t.strokeRect(a.left,a.top,a.width,a.height),d(t,a,r,i)},p=(e,t,r,i,s,c)=>{var u;let d=R().animationSpeed,p=(u=Mb.speeds[d])==null?Mb.speeds.off:u,m=o=>{if(o-l<Mb.frameInterval){a=requestAnimationFrame(m);return}if(l=o,!n){cancelAnimationFrame(a);return}n={left:jb(n.left,r.left,p),top:jb(n.top,r.top,p),width:jb(n.width,r.width,p),height:jb(n.height,r.height,p)},f(e,t,i,s),Math.abs(n.left-r.left)>.1||Math.abs(n.top-r.top)>.1||Math.abs(n.width-r.width)>.1||Math.abs(n.height-r.height)>.1?a=requestAnimationFrame(m):(n=r,f(e,t,i,s),cancelAnimationFrame(a),t.restore(),c==null||c())};cancelAnimationFrame(a),clearTimeout(o),a=requestAnimationFrame(m),o=setTimeout(()=>{cancelAnimationFrame(a),n=r,f(e,t,i,s),t.restore(),c==null||c()},1e3)},m=(e,t,r,i,a)=>{if(t.save(),!n){n=r,f(e,t,i,a),t.restore();return}p(e,t,r,i,a)},h=async(e,t,n,r)=>{if(!e||!t||!n)return;let{parentCompositeFiber:i}=dm(e),a=await um(e);!i||!a||m(t,n,a,r,i)},g=()=>{for(let e of s.values())e==null||e()},_=e=>{let t=e.getContext(`2d`);t&&t.clearRect(0,0,e.width,e.height),n=null,r=null,i=null,e.classList.remove(`fade-in`),c=!1},v=t=>{if(!e||c)return;let n=r=>{!e||r.propertyName!==`opacity`||!c||(e.removeEventListener(`transitionend`,n),_(e),t==null||t())},r=s.get(`fade-out`);r&&(r(),s.delete(`fade-out`)),e.addEventListener(`transitionend`,n),s.set(`fade-out`,()=>{e==null||e.removeEventListener(`transitionend`,n)}),c=!0,e.classList.remove(`fade-in`),requestAnimationFrame(()=>{e==null||e.classList.add(`fade-out`)})},y=()=>{e&&(c=!1,e.classList.remove(`fade-out`),requestAnimationFrame(()=>{e==null||e.classList.add(`fade-in`)}))},b=e=>{e!==i&&(i=e,pm.has(e.tagName)?v():y(),kn({kind:`inspecting`,hoveredDomElement:e}))},ee=()=>{!n||!e||c||v()},te=ks(n=>{var r,i;if(L().kind!==`inspecting`||!t)return;t.style.pointerEvents=`none`;let a=document.elementFromPoint((r=n==null?void 0:n.clientX)==null?0:r,(i=n==null?void 0:n.clientY)==null?0:i);if(t.style.removeProperty(`pointer-events`),clearTimeout(o),a&&a!==e){let{parentCompositeFiber:e}=dm(a);if(e){let t=mm(e);if(t){b(t);return}}}ee()},32),ne=(e,t)=>{let n=r;if(!n)return!1;let i=t.getBoundingClientRect(),a=t.width/i.width,o=t.height/i.height,s=(e.clientX-i.left)*a,c=(e.clientY-i.top)*o,l=s/Nb,u=c/Nb;return l>=n.x&&l<=n.x+n.width&&u>=n.y&&u<=n.y+n.height},x=e=>{e.kind===`focused`&&kn({kind:`inspecting`,hoveredDomElement:e.focusedDomElement})},S=e=>{var t;let n=[`react-scan-inspect-element`,`react-scan-power`];if(e.target instanceof HTMLElement&&n.includes(e.target.id))return;let r=i==null?void 0:i.tagName;if(r&&pm.has(r))return;e.preventDefault(),e.stopPropagation();let a=(t=i)==null?document.elementFromPoint(e.clientX,e.clientY):t;if(!a)return;let o=e.composedPath().at(0);if(o instanceof HTMLElement&&n.includes(o.id)){let t=Object.assign(new MouseEvent(e.type,e),{__reactScanSyntheticEvent:!0});o.dispatchEvent(t);return}let{parentCompositeFiber:s}=dm(a);if(!s)return;let c=mm(s);if(!c){i=null,kn({kind:`inspect-off`});return}kn({kind:`focused`,focusedDomElement:c,fiber:s})},re=n=>{if(`__reactScanSyntheticEvent`in n&&n.__reactScanSyntheticEvent===!0)return;let r=L(),i=e;if(!(!i||!t)){if(ne(n,i)){n.preventDefault(),n.stopPropagation(),x(r);return}r.kind===`inspecting`&&S(n)}},ie=t=>{var r;if(t.key!==`Escape`)return;let a=L();if(e&&((r=document.activeElement)==null?void 0:r.id)!==`react-scan-root`&&(Bs({view:`none`}),a.kind===`focused`||a.kind===`inspecting`))switch(t.preventDefault(),t.stopPropagation(),a.kind){case`focused`:y(),n=null,i=a.focusedDomElement,kn({kind:`inspecting`,hoveredDomElement:a.focusedDomElement});break;case`inspecting`:v(()=>{kn({kind:`inspect-off`})});break}},ae=(e,n,r)=>{var o;switch((o=s.get(e.kind))==null||o(),t&&e.kind!==`inspecting`&&(t.style.pointerEvents=`none`),a&&cancelAnimationFrame(a),e.kind){case`inspect-off`:v();return;case`inspecting`:h(e.hoveredDomElement,n,r,`inspecting`);break;case`focused`:if(!e.focusedDomElement)return;i!==e.focusedDomElement&&(i=e.focusedDomElement),Bs({view:`inspector`}),h(e.focusedDomElement,n,r,`locked`);break}},oe=(e,t)=>{let n=e.getBoundingClientRect();e.width=n.width*Nb,e.height=n.height*Nb,t.scale(Nb,Nb),t.save()},se=()=>{let t=L(),r=e;if(!r)return;let i=r==null?void 0:r.getContext(`2d`);i&&(cancelAnimationFrame(a),clearTimeout(o),oe(r,i),n=null,t.kind===`focused`&&t.focusedDomElement?h(t.focusedDomElement,r,i,`locked`):t.kind===`inspecting`&&t.hoveredDomElement&&h(t.hoveredDomElement,r,i,`inspecting`))},ce=t=>{let n=L(),r=e;r&&(n.kind===`inspecting`||ne(t,r))&&(t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation())};return tt(()=>{let t=e;if(!t)return;let r=t==null?void 0:t.getContext(`2d`);r&&(oe(t,r),D(et(L,e=>{ae(e,t,r)},{defer:!0})),D(et(An,()=>{let e=L();if(e.kind!==`focused`||!a||!n)return;let{parentCompositeFiber:i}=dm(e.focusedDomElement);i&&h(e.focusedDomElement,t,r,`locked`)},{defer:!0})),window.addEventListener(`scroll`,se,{passive:!0}),window.addEventListener(`resize`,se,{passive:!0}),document.addEventListener(`pointermove`,te,{passive:!0,capture:!0}),document.addEventListener(`pointerdown`,ce,{capture:!0}),document.addEventListener(`click`,re,{capture:!0}),document.addEventListener(`keydown`,ie,{capture:!0}),k(()=>{g(),window.removeEventListener(`scroll`,se),window.removeEventListener(`resize`,se),document.removeEventListener(`pointermove`,te,{capture:!0}),document.removeEventListener(`click`,re,{capture:!0}),document.removeEventListener(`pointerdown`,ce,{capture:!0}),document.removeEventListener(`keydown`,ie,{capture:!0}),a&&cancelAnimationFrame(a),clearTimeout(o)}))}),[(()=>{var e=kb(),n=t;return typeof n==`function`?wa(n,e):t=e,E(()=>H(e,X(`fixed top-0 left-0 w-screen h-screen`,`z-[214748365]`))),e})(),(()=>{var t=Ab(),n=e;return typeof n==`function`?wa(n,t):e=t,E(()=>H(t,X(`react-scan-inspector-overlay`,`fixed top-0 left-0 w-screen h-screen`,`pointer-events-none`,`z-[214748367]`))),t})()]}}));function Ib(e){"@babel/helpers - typeof";return Ib=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},Ib(e)}var Lb=r((()=>{}));function Rb(e,t){if(Ib(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t||`default`);if(Ib(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}var zb=r((()=>{Lb()}));function Bb(e){var t=Rb(e,`string`);return Ib(t)==`symbol`?t:t+``}var Vb=r((()=>{Lb(),zb()}));function Hb(e,t,n){return(t=Bb(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var Ub=r((()=>{Vb()})),Wb,Gb,Kb,qb,Jb,Yb,Xb,Zb,Qb,$b,ex=r((()=>{na(),nc(),Ub(),Wb=class{constructor(e,t,n){this.width=e,this.height=t,this.safeArea=n,Hb(this,`maxWidth`,void 0),Hb(this,`maxHeight`,void 0),this.maxWidth=e-n.left-n.right,this.maxHeight=t-n.top-n.bottom}rightEdge(e){return this.width-e-this.safeArea.right}bottomEdge(e){return this.height-e-this.safeArea.bottom}isFullWidth(e){return e>=this.maxWidth}isFullHeight(e){return e>=this.maxHeight}},Kb=(e,t)=>e.top===t.top&&e.right===t.right&&e.bottom===t.bottom&&e.left===t.left,qb=()=>{let e=window.innerWidth,t=window.innerHeight,n=tc();return Gb&&Gb.width===e&&Gb.height===t&&Kb(Gb.safeArea,n)||(Gb=new Wb(e,t,n)),Gb},Jb=(e,t,n,r,i)=>{if(n){if(e===`top-left`)return`bottom-right`;if(e===`top-right`)return`bottom-left`;if(e===`bottom-left`)return`top-right`;if(e===`bottom-right`)return`top-left`;let[n,r]=t.split(`-`);if(e===`left`)return`${n}-right`;if(e===`right`)return`${n}-left`;if(e===`top`)return`bottom-${r}`;if(e===`bottom`)return`top-${r}`}if(r){if(e===`left`)return`${t.split(`-`)[0]}-right`;if(e===`right`)return`${t.split(`-`)[0]}-left`}if(i){if(e===`top`)return`bottom-${t.split(`-`)[1]}`;if(e===`bottom`)return`top-${t.split(`-`)[1]}`}return t},Yb=(e,t,n)=>{let r=getComputedStyle(document.body).direction===`rtl`,i=window.innerWidth,a=window.innerHeight,o=tc(),s=t===Zi.width,c=s?t:Math.min(t,i-o.left-o.right),l=s?n:Math.min(n,a-o.top-o.bottom),u,d,f=o.left,p=i-c-o.right,m=o.top,h=a-l-o.bottom,g=-o.right,_=-(i-c-o.left);switch(e){case`top-right`:u=r?g:p,d=m;break;case`bottom-right`:u=r?g:p,d=h;break;case`bottom-left`:u=r?_:f,d=h;break;case`top-left`:u=r?_:f,d=m;break;default:u=f,d=m;break}return s&&(u=r?Math.min(g,Math.max(u,_)):Math.max(f,Math.min(u,p)),d=Math.max(m,Math.min(d,h))),{x:u,y:d}},Xb=(e,t)=>{let[n,r]=t.split(`-`);return e!==n&&e!==r},Zb=(e,t,n,r)=>n&&r?!0:!n&&!r?Xb(e,t):n?e!==t.split(`-`)[0]:r?e!==t.split(`-`)[1]:!1,Qb=(e,t,n,r,i)=>{let a=getComputedStyle(document.body).direction===`rtl`,o=tc(),s=window.innerWidth-o.left-o.right,c=window.innerHeight-o.top-o.bottom,l=t.width,u=t.height,d=n.x,f=n.y;if(a&&e.includes(`right`)){let e=-n.x+t.width-o.right,i=Math.min(t.width+r,e);l=Math.min(s,Math.max(Zi.width,i)),d=n.x+(l-t.width)}if(a&&e.includes(`left`)){let e=window.innerWidth-n.x-o.left,i=Math.min(t.width-r,e);l=Math.min(s,Math.max(Zi.width,i))}if(!a&&e.includes(`right`)){let e=window.innerWidth-n.x-o.right,i=Math.min(t.width+r,e);l=Math.min(s,Math.max(Zi.width,i))}if(!a&&e.includes(`left`)){let e=n.x+t.width-o.left,i=Math.min(t.width-r,e);l=Math.min(s,Math.max(Zi.width,i)),d=n.x-(l-t.width)}if(e.includes(`bottom`)){let e=window.innerHeight-n.y-o.bottom,r=Math.min(t.height+i,e);u=Math.min(c,Math.max(Zi.initialHeight,r))}if(e.includes(`top`)){let e=n.y+t.height-o.top,r=Math.min(t.height-i,e);u=Math.min(c,Math.max(Zi.initialHeight,r)),f=n.y-(u-t.height)}let p=o.left,m=window.innerWidth-o.right-l,h=o.top,g=window.innerHeight-o.bottom-u,_=-o.right,v=-(window.innerWidth-l-o.left);return d=a?Math.min(_,Math.max(d,v)):Math.max(p,Math.min(d,m)),f=Math.max(h,Math.min(f,g)),{newSize:{width:l,height:u},newPosition:{x:d,y:f}}},$b=e=>{let t=qb(),n={"top-left":Math.hypot(e.x,e.y),"top-right":Math.hypot(t.maxWidth-e.x,e.y),"bottom-left":Math.hypot(e.x,t.maxHeight-e.y),"bottom-right":Math.hypot(t.maxWidth-e.x,t.maxHeight-e.y)},r=`top-left`;for(let e in n)n[e]<n[r]&&(r=e);return r}})),tx,nx,rx=r((()=>{G(),Ka(),tx=B(`<button type=button aria-label="Expand React Scan"title="Expand React Scan"class="react-scan-interactive-scale relative flex size-full items-center justify-center overflow-hidden rounded-full bg-[#8e61e3] text-white"><span class="absolute rounded-full bg-white/25">`),nx=e=>(()=>{var t=tx(),n=t.firstChild;return ya(t,`click`,e.onExpand,!0),U(t,A(K,{name:`icon-react-scan-logo`,size:12}),null),E(t=>ba(n,{"inset-x-0 top-0 h-px":e.edge===`top`,"inset-x-0 bottom-0 h-px":e.edge===`bottom`,"inset-y-0 left-0 w-px":e.edge===`left`,"inset-y-0 right-0 w-px":e.edge===`right`},t)),t})(),ga([`click`])})),ix,ax,ox=r((()=>{G(),I(),In(),Ka(),na(),Ks(),Z(),ex(),ix=B(`<div><span class=resize-line-wrapper><span class=resize-line>`),ax=e=>{let t;D(()=>{if(!t)return;t.classList.remove(`pointer-events-none`);let n=Ls(),r=L().kind===`focused`,i=zs().view!==`none`;(r||i)&&Zb(e.position,n.corner,n.dimensions.isFullWidth,n.dimensions.isFullHeight)?t.classList.remove(`hidden`,`pointer-events-none`,`opacity-0`):t.classList.add(`hidden`,`pointer-events-none`,`opacity-0`)});let n=t=>{t.preventDefault(),t.stopPropagation();let n=Ns();if(!n)return;let r=n.style,{dimensions:i}=Ls(),a=t.clientX,o=t.clientY,s=i.width,c=i.height,l=i.position;Rs(e=>({...e,dimensions:{...i,isFullWidth:!1,isFullHeight:!1,width:s,height:c,position:l}}));let u=null,d=t=>{u||(r.transition=`none`,u=requestAnimationFrame(()=>{let{newSize:n,newPosition:i}=Qb(e.position,{width:s,height:c},l,t.clientX-a,t.clientY-o);r.transform=`translate3d(${i.x}px, ${i.y}px, 0)`,r.width=`${n.width}px`,r.height=`${n.height}px`;let d=Math.floor(n.width-240/2),f=Ls().componentsTree.width,p=Math.min(d,Math.max(240,f));Rs(e=>({...e,dimensions:{isFullWidth:!1,isFullHeight:!1,width:n.width,height:n.height,position:i},componentsTree:{...e.componentsTree,width:p}})),u=null}))},f=()=>{u&&(cancelAnimationFrame(u),u=null),document.removeEventListener(`pointermove`,d),document.removeEventListener(`pointerup`,f);let{dimensions:e,corner:t}=Ls(),i=qb(),a=i.isFullWidth(e.width),o=i.isFullHeight(e.height),s=a&&o,c=t;(s||a||o)&&(c=$b(e.position));let l=Yb(c,e.width,e.height),p=()=>{n.removeEventListener(`transitionend`,p)};n.addEventListener(`transitionend`,p),r.transform=`translate3d(${l.x}px, ${l.y}px, 0)`,Rs(t=>({...t,corner:c,dimensions:{isFullWidth:a,isFullHeight:o,width:e.width,height:e.height,position:l},lastDimensions:{isFullWidth:a,isFullHeight:o,width:e.width,height:e.height,position:l}}));let m=Ls();Ds(Qi,{corner:c,dimensions:m.dimensions,lastDimensions:m.lastDimensions,componentsTree:m.componentsTree})};document.addEventListener(`pointermove`,d,{passive:!0}),document.addEventListener(`pointerup`,f)},r=t=>{t.preventDefault(),t.stopPropagation();let n=Ns();if(!n)return;let r=n.style,{dimensions:i,corner:a}=Ls(),o=qb(),s=o.isFullWidth(i.width),c=o.isFullHeight(i.height),l=s&&c,u=(s||c)&&!l,d=i.width,f=i.height,p=Jb(e.position,a,l,s,c);e.position===`left`||e.position===`right`?(d=s?i.width:o.maxWidth,u&&(d=s?Zi.width:o.maxWidth)):(f=c?i.height:o.maxHeight,u&&(f=c?Zi.initialHeight:o.maxHeight)),l&&(e.position===`left`||e.position===`right`?d=Zi.width:f=Zi.initialHeight);let m=Yb(p,d,f),h={isFullWidth:o.isFullWidth(d),isFullHeight:o.isFullHeight(f),width:d,height:f,position:m},g=Math.floor(d-Zi.width/2),_=Ls().componentsTree.width,v=Math.floor(d*.3),y=s?240:(e.position===`left`||e.position===`right`)&&!s?Math.min(g,Math.max(240,v)):Math.min(g,Math.max(240,_));requestAnimationFrame(()=>{Rs(e=>({corner:p,dimensions:h,lastDimensions:i,componentsTree:{...e.componentsTree,width:y}})),r.transition=`all 0.25s cubic-bezier(0, 0, 0.2, 1)`,r.width=`${d}px`,r.height=`${f}px`,r.transform=`translate3d(${m.x}px, ${m.y}px, 0)`}),Ds(Qi,{corner:p,dimensions:h,lastDimensions:i,componentsTree:{...Ls().componentsTree,width:y}})};return(()=>{var i=ix(),a=i.firstChild.firstChild;i.$$dblclick=r,i.$$pointerdown=n;var o=t;return typeof o==`function`?wa(o,i):t=i,U(a,A(K,{name:`icon-ellipsis`,size:18,get class(){return X(`text-neutral-400`,(e.position===`left`||e.position===`right`)&&`rotate-90`)}})),E(()=>H(i,X(`absolute z-50`,`flex items-center justify-center`,`group`,`transition-colors select-none`,`peer`,{"resize-left peer/left":e.position===`left`,"resize-right peer/right z-10":e.position===`right`,"resize-top peer/top":e.position===`top`,"resize-bottom peer/bottom":e.position===`bottom`}))),i})()},ga([`pointerdown`,`dblclick`])})),sx,cx,lx,ux,dx=r((()=>{G(),I(),In(),na(),Ks(),fc(),mc(),Z(),nc(),uc(),pb(),Ob(),Fb(),ex(),rx(),ox(),sx=B(`<div id=react-scan-toolbar dir=ltr class="fixed left-0 top-0 select-none font-sans text-[13px] [touch-action:none] [will-change:transform]">`),cx=B(`<div id=react-scan-panel dir=ltr class="fixed left-0 top-0 flex flex-col rounded-xl font-sans text-[13px] [will-change:transform]">`),lx=st(null),ux=()=>{let e,t,n,r,[i,a]=T(!1),[o,s]=T(!1),[c,l]=T({width:130,height:28}),[u,d]=T(oc(Us().edge,Us().ratio,130,28)),f=()=>Us().collapsed,p=O(()=>zs().view!==`none`||L().kind===`focused`),m=()=>ic(Us().edge),h=()=>f()?cc(Us().edge,u(),c(),m()):u(),g=()=>{let e=Ls();Ds(Qi,{corner:e.corner,dimensions:e.dimensions,lastDimensions:e.lastDimensions,componentsTree:e.componentsTree})},_=(e,t)=>{let n=pc(e,t),r=Ls().dimensions,i=Yb(n,r.width,r.height);Rs(e=>({...e,corner:n,dimensions:{...r,position:i}})),g()},v=()=>{let e=c();d(oc(Us().edge,Us().ratio,e.width,e.height))},y=()=>{if(!e||f())return;let t=e.getBoundingClientRect();t.width<=0||t.height<=0||(l({width:t.width,height:t.height}),v())},b=dc({getContainer:()=>e,isCollapsed:f,onDragStart:()=>{Bs({view:`none`})},onPositionUpdate:d,onSnapEdgeChange:(e,t)=>{Gs(n=>({...n,edge:e,ratio:t})),_(e,t)},onSnapComplete:(e,t,n)=>{d(n),Gs(n=>({...n,edge:e,ratio:t}))}}),ee=e=>{Gs(t=>({...t,collapsed:e})),e&&Bs({view:`none`})},te=()=>{var e;cancelAnimationFrame((e=r)==null?0:e),r=requestAnimationFrame(()=>{v(),_(Us().edge,Us().ratio)})};tt(()=>{var e,r;if(t){Ps(t);let e=tc();t.style.maxWidth=`calc(100vw - ${e.left+e.right}px)`,t.style.maxHeight=`calc(100vh - ${e.top+e.bottom}px)`}y(),_(Us().edge,Us().ratio),n=setTimeout(()=>a(!0),500),window.addEventListener(`resize`,te,{passive:!0}),(e=window.visualViewport)==null||e.addEventListener(`resize`,te,{passive:!0}),(r=window.visualViewport)==null||r.addEventListener(`scroll`,te,{passive:!0})}),D(()=>{f()||requestAnimationFrame(y)}),k(()=>{var e,t,i;clearTimeout(n),cancelAnimationFrame((e=r)==null?0:e),window.removeEventListener(`resize`,te),(t=window.visualViewport)==null||t.removeEventListener(`resize`,te),(i=window.visualViewport)==null||i.removeEventListener(`scroll`,te),Ps(null),g()});let ne=()=>{let e=h(),t=m();return{width:f()?`${t.width}px`:`max-content`,height:f()?`${t.height}px`:`max-content`,opacity:+!!i(),transform:`translate3d(${e.x}px, ${e.y}px, 0)`,transition:b.isDragging()&&!b.isSnapping()?`none`:`transform 300ms var(--rs-ease-drawer), width 260ms var(--rs-ease-drawer), height 260ms var(--rs-ease-drawer), opacity 260ms ease-out`,"z-index":ta}},x=()=>{let e=Ls().dimensions;return{width:`${e.width}px`,height:`${e.height}px`,transform:`translate3d(${e.position.x}px, ${e.position.y}px, 0)`,"z-index":ta-1}};return[A(Pb,{}),(()=>{var t=sx();t.addEventListener(`mouseleave`,()=>s(!1)),t.addEventListener(`mouseenter`,()=>s(!0)),ya(t,`pointerdown`,b.handlePointerDown,!0);var n=e;return typeof n==`function`?wa(n,t):e=t,U(t,A(j,{get when(){return!f()},get fallback(){return A(nx,{get edge(){return Us().edge},get onExpand(){return b.createDragAwareHandler(()=>ee(!1))}})},get children(){return A(Db,{get edge(){return Us().edge},get onCollapse(){return b.createDragAwareHandler(()=>ee(!0))}})}})),E(e=>{var n=!!b.isDragging(),r=!b.isDragging()&&!f(),i=ne();return n!==e.e&&t.classList.toggle(`cursor-grabbing`,e.e=n),r!==e.t&&t.classList.toggle(`cursor-grab`,e.t=r),e.a=xa(t,i,e.a),e},{e:void 0,t:void 0,a:void 0}),t})(),(()=>{var e,n=cx(),r=t;return typeof r==`function`?wa(r,n):t=n,U(n,A(lx.Provider,{value:(e=t)==null?null:e,get children(){return[A(ax,{position:`top`}),A(ax,{position:`bottom`}),A(ax,{position:`left`}),A(ax,{position:`right`}),A(db,{})]}})),E(e=>{var t=!p(),r=!!(!o()&&b.isDragging()),i=x();return t!==e.e&&n.classList.toggle(`hidden`,e.e=t),r!==e.t&&n.classList.toggle(`opacity-80`,e.t=r),e.a=xa(n,i,e.a),e},{e:void 0,t:void 0,a:void 0}),n})()]},ga([`pointerdown`])})),fx=i({createToolbar:()=>hx}),px,mx,hx,gx=r((()=>{G(),I(),Ka(),Ya(),dx(),px=B(`<div class="fixed bottom-4 right-4 z-[124124124124]"><div class="p-3 bg-black rounded-lg shadow-lg w-80"><div class="flex items-center gap-2 mb-2 text-red-400 text-sm font-medium">React Scan ran into a problem</div><div class="p-2 bg-black rounded font-mono text-xs text-red-300 mb-3 break-words"></div><button type=button class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5">Restart`),mx=(e,t)=>(()=>{var n=px(),r=n.firstChild.firstChild,i=r.firstChild,a=r.nextSibling,o=a.nextSibling;return U(r,A(K,{name:`icon-flame`,class:`text-red-500`,size:14}),i),U(a,()=>e.message||JSON.stringify(e)),ya(o,`click`,t,!0),n})(),hx=e=>{let t=document.createElement(`div`);t.id=`react-scan-toolbar-root`,window.__REACT_SCAN_TOOLBAR_CONTAINER__=t,e.appendChild(t);let n=ha(()=>A(Ht,{fallback:mx,get children(){return[A(Ja,{}),A(ux,{})]}}),t);return{container:t,dispose:()=>{window.__REACT_SCAN_TOOLBAR_CONTAINER__===t&&(window.__REACT_SCAN_TOOLBAR_CONTAINER__=void 0),n(),t.remove()}}},ga([`click`])})),_x,vx,yx,bx;r((()=>{I(),Fi(),Xi(),fa(),_x=null,vx=e=>{try{return Yi(document.documentElement)}catch(t){e()&&console.error(`[React Scan Internal Error]`,`Failed to create notifications outline canvas`,t)}},yx=()=>{_x==null||_x(),_x=null,window.reactScanCleanupListeners=void 0},bx=e=>{yx();let t=Ze(t=>{let n=!1,r=null,i=null,a=Pi(),o=vx(e.isVerbose);return k(()=>{n=!0,i==null||i(),r==null||r.dispose(),a(),o==null||o(),window.__REACT_SCAN_TOOLBAR_CONTAINER__=void 0}),e.showToolbar&&(r=da(),Promise.resolve().then(()=>(gx(),fx)).then(({createToolbar:e})=>{n||!r||(i=e(r.shadowRoot).dispose)})),t});_x=t,window.reactScanCleanupListeners=t}}))();var xx=`0.1.48`,Sx,Cx,wx=r((()=>{Sx=!1,Cx=()=>{if(Sx||(Sx=!0,typeof window>`u`)||window.__REACT_GRAB__||!navigator.onLine||!xx)return;let e={referrerPolicy:`origin`,keepalive:!0,priority:`low`,cache:`no-store`};try{fetch(`https://www.react-grab.com/api/version?source=react-scan&v=${xx}&t=${Date.now()}`,e).then(e=>e.ok?e.text():null).then(e=>{if(!e)return;let t=e.trim();/^\d+\.\d+\.\d+/.test(t)&&t!==xx&&console.warn(`[React Scan] react-grab v${xx} is outdated (latest: v${t}). Update react-scan to pick up the newer react-grab.`)}).catch(()=>null)}catch{}}})),Tx,Ex,Dx=r((()=>{Qs(),ec(),Tx=[`top`,`right`,`bottom`,`left`],Ex=e=>{if(Zs(e))return{ok:!0,value:e};if(!$s(e))return{ok:!1,error:`- safeArea must be a non-negative number or { top?, right?, bottom?, left? }. Got "${JSON.stringify(e)}"`};let t={};for(let n of Tx){let r=e[n];if(r!==void 0){if(!Zs(r))return{ok:!1,error:`- safeArea.${n} must be a non-negative number. Got "${JSON.stringify(r)}"`};t[n]=r}}return{ok:!0,value:t}}}));wx(),Dx();var Ox=`0.5.7`,kx,Ax,jx,Mx,Nx,Px,Fx,Ix,Lx,Rx,zx,Bx,Vx,Hx,Ux,Wx,Gx,Kx=r((()=>{Ge(),Vv(),qe(),Es(),Os(),In(),kx=Fn,Ax={instrumentation:null,componentAllowList:null,options:Pn,runInAllEnvironments:!1,onRender:null,Store:kx,version:Ox},Ke&&window.__REACT_SCAN_EXTENSION__&&(window.__REACT_SCAN_VERSION__=Ax.version),jx=e=>{let{onCommitStart:t,onRender:n,onCommitFinish:r,...i}=e;return i},Mx=e=>{let t=[],n={};for(let r in e){let i=e[r];switch(r){case`enabled`:case`log`:case`showToolbar`:case`showNotificationCount`:case`dangerouslyForceRunInProduction`:case`showFPS`:case`allowInIframe`:case`useOffscreenCanvasWorker`:typeof i==`boolean`?n[r]=i:t.push(`- ${r} must be a boolean. Got "${i}"`);break;case`animationSpeed`:[`slow`,`fast`,`off`].includes(i)?n[r]=i:t.push(`- Invalid animation speed "${i}". Using default "fast"`);break;case`safeArea`:{let e=Ex(i);e.ok?n.safeArea=e.value:t.push(e.error);break}case`onCommitStart`:typeof i==`function`?n.onCommitStart=i:t.push(`- ${r} must be a function. Got "${i}"`);break;case`onCommitFinish`:typeof i==`function`?n.onCommitFinish=i:t.push(`- ${r} must be a function. Got "${i}"`);break;case`onRender`:typeof i==`function`?n.onRender=i:t.push(`- ${r} must be a function. Got "${i}"`);break;default:t.push(`- Unknown option "${r}"`)}}return t.length>0&&console.warn(`[React Scan] Invalid options:\n${t.join(`
`)}`),n},Nx=e=>{if(e){for(let t of Array.from(kx.legacyReportData.values()))if(t.type===e)return t;return null}return kx.legacyReportData},Px=e=>{try{let n=Mx(e);if(Object.keys(n).length===0)return;let r=`showToolbar`in n&&n.showToolbar!==void 0,i={...R(),...n},{instrumentation:a}=Ax;a&&`enabled`in n&&a.setIsPaused(n.enabled===!1),Nn(i);try{var t;let e=(t=Ts(`react-scan-options`))==null?void 0:t.enabled;typeof e==`boolean`&&(i.enabled=e)}catch(e){R()._debug===`verbose`&&console.error(`[React Scan Internal Error]`,`Failed to create notifications outline canvas`,e)}return Ds(`react-scan-options`,jx(i)),r&&Bx(!!i.showToolbar),i}catch(e){R()._debug===`verbose`&&console.error(`[React Scan Internal Error]`,`Failed to create notifications outline canvas`,e)}},Fx=()=>Ax.options,Ix=null,Rx=()=>{if(Ix===!1)return!1;Lx!=null||(Lx=ee());let e=Array.from(Lx.renderers.values());if(e.length===0)return null;for(let t of e)if(be(t)!==`production`)return Ix=!1,!1;return!0},zx=()=>{try{if(!Ke||!Ax.runInAllEnvironments&&Rx()&&!R().dangerouslyForceRunInProduction)return;Cx();let e=Ts(`react-scan-options`);if(e){let t=Mx(e);Object.keys(t).length>0&&Nn({...R(),...t})}Bv(()=>{Bx(!!R().showToolbar)}),Ke&&setTimeout(()=>{xe()||console.error(`[React Scan] Failed to load. Must import React Scan before React runs.`)},5e3)}catch(e){R()._debug===`verbose`&&console.error(`[React Scan Internal Error]`,`Failed to create notifications outline canvas`,e)}},Bx=e=>{bx({showToolbar:e,isVerbose:()=>R()._debug===`verbose`})},Vx=(e={})=>{Px(e),!(Mn()&&!R().allowInIframe&&!Ax.runInAllEnvironments)&&(e.enabled===!1&&e.showToolbar!==!0||zx())},Hx=(e={})=>{Px(e),zx()},Ux=(e,t)=>{let n=Ax.onRender;Ax.onRender=(r,i)=>{n==null||n(r,i),ve(r.type)===e&&t(r,i)}},Wx=new WeakSet,Gx=e=>{e&&typeof e==`object`&&Wx.add(e)}}));return Ge(),Kx(),Ge(),qe(),Kx(),Ke&&(Vx(),window.reactScan=Vx),e.ReactScanInternals=Ax,e.Store=kx,e.getIsProduction=Rx,e.getOptions=Fx,e.getReport=Nx,e.ignoreScan=Gx,e.ignoredProps=Wx,e.onRender=Ux,e.scan=Vx,e.setOptions=Px,e.start=zx,e.useScan=Hx,e})({},React);
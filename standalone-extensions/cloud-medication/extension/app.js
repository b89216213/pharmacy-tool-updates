
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(){'use strict';(function(c,x){"object"===typeof exports&&"undefined"!==typeof module?x(exports):"function"===typeof define&&define.amd?define(["exports"],x):(c=c||self,x(c.React={}))})(this,function(c){function x(a){if(null===a||"object"!==typeof a)return null;a=V&&a[V]||a["@@iterator"];return"function"===typeof a?a:null}function w(a,b,e){this.props=a;this.context=b;this.refs=W;this.updater=e||X}function Y(){}function K(a,b,e){this.props=a;this.context=b;this.refs=W;this.updater=e||X}function Z(a,b,
e){var m,d={},c=null,h=null;if(null!=b)for(m in void 0!==b.ref&&(h=b.ref),void 0!==b.key&&(c=""+b.key),b)aa.call(b,m)&&!ba.hasOwnProperty(m)&&(d[m]=b[m]);var l=arguments.length-2;if(1===l)d.children=e;else if(1<l){for(var f=Array(l),k=0;k<l;k++)f[k]=arguments[k+2];d.children=f}if(a&&a.defaultProps)for(m in l=a.defaultProps,l)void 0===d[m]&&(d[m]=l[m]);return{$$typeof:y,type:a,key:c,ref:h,props:d,_owner:L.current}}function na(a,b){return{$$typeof:y,type:a.type,key:b,ref:a.ref,props:a.props,_owner:a._owner}}
function M(a){return"object"===typeof a&&null!==a&&a.$$typeof===y}function oa(a){var b={"=":"=0",":":"=2"};return"$"+a.replace(/[=:]/g,function(a){return b[a]})}function N(a,b){return"object"===typeof a&&null!==a&&null!=a.key?oa(""+a.key):b.toString(36)}function B(a,b,e,m,d){var c=typeof a;if("undefined"===c||"boolean"===c)a=null;var h=!1;if(null===a)h=!0;else switch(c){case "string":case "number":h=!0;break;case "object":switch(a.$$typeof){case y:case pa:h=!0}}if(h)return h=a,d=d(h),a=""===m?"."+
N(h,0):m,ca(d)?(e="",null!=a&&(e=a.replace(da,"$&/")+"/"),B(d,b,e,"",function(a){return a})):null!=d&&(M(d)&&(d=na(d,e+(!d.key||h&&h.key===d.key?"":(""+d.key).replace(da,"$&/")+"/")+a)),b.push(d)),1;h=0;m=""===m?".":m+":";if(ca(a))for(var l=0;l<a.length;l++){c=a[l];var f=m+N(c,l);h+=B(c,b,e,f,d)}else if(f=x(a),"function"===typeof f)for(a=f.call(a),l=0;!(c=a.next()).done;)c=c.value,f=m+N(c,l++),h+=B(c,b,e,f,d);else if("object"===c)throw b=String(a),Error("Objects are not valid as a React child (found: "+
("[object Object]"===b?"object with keys {"+Object.keys(a).join(", ")+"}":b)+"). If you meant to render a collection of children, use an array instead.");return h}function C(a,b,e){if(null==a)return a;var c=[],d=0;B(a,c,"","",function(a){return b.call(e,a,d++)});return c}function qa(a){if(-1===a._status){var b=a._result;b=b();b.then(function(b){if(0===a._status||-1===a._status)a._status=1,a._result=b},function(b){if(0===a._status||-1===a._status)a._status=2,a._result=b});-1===a._status&&(a._status=
0,a._result=b)}if(1===a._status)return a._result.default;throw a._result;}function O(a,b){var e=a.length;a.push(b);a:for(;0<e;){var c=e-1>>>1,d=a[c];if(0<D(d,b))a[c]=b,a[e]=d,e=c;else break a}}function p(a){return 0===a.length?null:a[0]}function E(a){if(0===a.length)return null;var b=a[0],e=a.pop();if(e!==b){a[0]=e;a:for(var c=0,d=a.length,k=d>>>1;c<k;){var h=2*(c+1)-1,l=a[h],f=h+1,g=a[f];if(0>D(l,e))f<d&&0>D(g,l)?(a[c]=g,a[f]=e,c=f):(a[c]=l,a[h]=e,c=h);else if(f<d&&0>D(g,e))a[c]=g,a[f]=e,c=f;else break a}}return b}
function D(a,b){var c=a.sortIndex-b.sortIndex;return 0!==c?c:a.id-b.id}function P(a){for(var b=p(r);null!==b;){if(null===b.callback)E(r);else if(b.startTime<=a)E(r),b.sortIndex=b.expirationTime,O(q,b);else break;b=p(r)}}function Q(a){z=!1;P(a);if(!u)if(null!==p(q))u=!0,R(S);else{var b=p(r);null!==b&&T(Q,b.startTime-a)}}function S(a,b){u=!1;z&&(z=!1,ea(A),A=-1);F=!0;var c=k;try{P(b);for(n=p(q);null!==n&&(!(n.expirationTime>b)||a&&!fa());){var m=n.callback;if("function"===typeof m){n.callback=null;
k=n.priorityLevel;var d=m(n.expirationTime<=b);b=v();"function"===typeof d?n.callback=d:n===p(q)&&E(q);P(b)}else E(q);n=p(q)}if(null!==n)var g=!0;else{var h=p(r);null!==h&&T(Q,h.startTime-b);g=!1}return g}finally{n=null,k=c,F=!1}}function fa(){return v()-ha<ia?!1:!0}function R(a){G=a;H||(H=!0,I())}function T(a,b){A=ja(function(){a(v())},b)}var y=Symbol.for("react.element"),pa=Symbol.for("react.portal"),ra=Symbol.for("react.fragment"),sa=Symbol.for("react.strict_mode"),ta=Symbol.for("react.profiler"),
ua=Symbol.for("react.provider"),va=Symbol.for("react.context"),wa=Symbol.for("react.forward_ref"),xa=Symbol.for("react.suspense"),ya=Symbol.for("react.memo"),za=Symbol.for("react.lazy"),V=Symbol.iterator,X={isMounted:function(a){return!1},enqueueForceUpdate:function(a,b,c){},enqueueReplaceState:function(a,b,c,m){},enqueueSetState:function(a,b,c,m){}},ka=Object.assign,W={};w.prototype.isReactComponent={};w.prototype.setState=function(a,b){if("object"!==typeof a&&"function"!==typeof a&&null!=a)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
this.updater.enqueueSetState(this,a,b,"setState")};w.prototype.forceUpdate=function(a){this.updater.enqueueForceUpdate(this,a,"forceUpdate")};Y.prototype=w.prototype;var t=K.prototype=new Y;t.constructor=K;ka(t,w.prototype);t.isPureReactComponent=!0;var ca=Array.isArray,aa=Object.prototype.hasOwnProperty,L={current:null},ba={key:!0,ref:!0,__self:!0,__source:!0},da=/\/+/g,g={current:null},J={transition:null};if("object"===typeof performance&&"function"===typeof performance.now){var Aa=performance;
var v=function(){return Aa.now()}}else{var la=Date,Ba=la.now();v=function(){return la.now()-Ba}}var q=[],r=[],Ca=1,n=null,k=3,F=!1,u=!1,z=!1,ja="function"===typeof setTimeout?setTimeout:null,ea="function"===typeof clearTimeout?clearTimeout:null,ma="undefined"!==typeof setImmediate?setImmediate:null;"undefined"!==typeof navigator&&void 0!==navigator.scheduling&&void 0!==navigator.scheduling.isInputPending&&navigator.scheduling.isInputPending.bind(navigator.scheduling);var H=!1,G=null,A=-1,ia=5,ha=
-1,U=function(){if(null!==G){var a=v();ha=a;var b=!0;try{b=G(!0,a)}finally{b?I():(H=!1,G=null)}}else H=!1};if("function"===typeof ma)var I=function(){ma(U)};else if("undefined"!==typeof MessageChannel){t=new MessageChannel;var Da=t.port2;t.port1.onmessage=U;I=function(){Da.postMessage(null)}}else I=function(){ja(U,0)};t={ReactCurrentDispatcher:g,ReactCurrentOwner:L,ReactCurrentBatchConfig:J,Scheduler:{__proto__:null,unstable_ImmediatePriority:1,unstable_UserBlockingPriority:2,unstable_NormalPriority:3,
unstable_IdlePriority:5,unstable_LowPriority:4,unstable_runWithPriority:function(a,b){switch(a){case 1:case 2:case 3:case 4:case 5:break;default:a=3}var c=k;k=a;try{return b()}finally{k=c}},unstable_next:function(a){switch(k){case 1:case 2:case 3:var b=3;break;default:b=k}var c=k;k=b;try{return a()}finally{k=c}},unstable_scheduleCallback:function(a,b,c){var e=v();"object"===typeof c&&null!==c?(c=c.delay,c="number"===typeof c&&0<c?e+c:e):c=e;switch(a){case 1:var d=-1;break;case 2:d=250;break;case 5:d=
1073741823;break;case 4:d=1E4;break;default:d=5E3}d=c+d;a={id:Ca++,callback:b,priorityLevel:a,startTime:c,expirationTime:d,sortIndex:-1};c>e?(a.sortIndex=c,O(r,a),null===p(q)&&a===p(r)&&(z?(ea(A),A=-1):z=!0,T(Q,c-e))):(a.sortIndex=d,O(q,a),u||F||(u=!0,R(S)));return a},unstable_cancelCallback:function(a){a.callback=null},unstable_wrapCallback:function(a){var b=k;return function(){var c=k;k=b;try{return a.apply(this,arguments)}finally{k=c}}},unstable_getCurrentPriorityLevel:function(){return k},unstable_shouldYield:fa,
unstable_requestPaint:function(){},unstable_continueExecution:function(){u||F||(u=!0,R(S))},unstable_pauseExecution:function(){},unstable_getFirstCallbackNode:function(){return p(q)},get unstable_now(){return v},unstable_forceFrameRate:function(a){0>a||125<a?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):ia=0<a?Math.floor(1E3/a):5},unstable_Profiling:null}};c.Children={map:C,forEach:function(a,b,c){C(a,function(){b.apply(this,
arguments)},c)},count:function(a){var b=0;C(a,function(){b++});return b},toArray:function(a){return C(a,function(a){return a})||[]},only:function(a){if(!M(a))throw Error("React.Children.only expected to receive a single React element child.");return a}};c.Component=w;c.Fragment=ra;c.Profiler=ta;c.PureComponent=K;c.StrictMode=sa;c.Suspense=xa;c.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=t;c.cloneElement=function(a,b,c){if(null===a||void 0===a)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+
a+".");var e=ka({},a.props),d=a.key,k=a.ref,h=a._owner;if(null!=b){void 0!==b.ref&&(k=b.ref,h=L.current);void 0!==b.key&&(d=""+b.key);if(a.type&&a.type.defaultProps)var l=a.type.defaultProps;for(f in b)aa.call(b,f)&&!ba.hasOwnProperty(f)&&(e[f]=void 0===b[f]&&void 0!==l?l[f]:b[f])}var f=arguments.length-2;if(1===f)e.children=c;else if(1<f){l=Array(f);for(var g=0;g<f;g++)l[g]=arguments[g+2];e.children=l}return{$$typeof:y,type:a.type,key:d,ref:k,props:e,_owner:h}};c.createContext=function(a){a={$$typeof:va,
_currentValue:a,_currentValue2:a,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null};a.Provider={$$typeof:ua,_context:a};return a.Consumer=a};c.createElement=Z;c.createFactory=function(a){var b=Z.bind(null,a);b.type=a;return b};c.createRef=function(){return{current:null}};c.forwardRef=function(a){return{$$typeof:wa,render:a}};c.isValidElement=M;c.lazy=function(a){return{$$typeof:za,_payload:{_status:-1,_result:a},_init:qa}};c.memo=function(a,b){return{$$typeof:ya,type:a,
compare:void 0===b?null:b}};c.startTransition=function(a,b){b=J.transition;J.transition={};try{a()}finally{J.transition=b}};c.unstable_act=function(a){throw Error("act(...) is not supported in production builds of React.");};c.useCallback=function(a,b){return g.current.useCallback(a,b)};c.useContext=function(a){return g.current.useContext(a)};c.useDebugValue=function(a,b){};c.useDeferredValue=function(a){return g.current.useDeferredValue(a)};c.useEffect=function(a,b){return g.current.useEffect(a,
b)};c.useId=function(){return g.current.useId()};c.useImperativeHandle=function(a,b,c){return g.current.useImperativeHandle(a,b,c)};c.useInsertionEffect=function(a,b){return g.current.useInsertionEffect(a,b)};c.useLayoutEffect=function(a,b){return g.current.useLayoutEffect(a,b)};c.useMemo=function(a,b){return g.current.useMemo(a,b)};c.useReducer=function(a,b,c){return g.current.useReducer(a,b,c)};c.useRef=function(a){return g.current.useRef(a)};c.useState=function(a){return g.current.useState(a)};
c.useSyncExternalStore=function(a,b,c){return g.current.useSyncExternalStore(a,b,c)};c.useTransition=function(){return g.current.useTransition()};c.version="18.2.0"});
})();

/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(){/*
 Modernizr 3.0.0pre (Custom Build) | MIT
*/
'use strict';(function(Q,mb){"object"===typeof exports&&"undefined"!==typeof module?mb(exports,require("react")):"function"===typeof define&&define.amd?define(["exports","react"],mb):(Q=Q||self,mb(Q.ReactDOM={},Q.React))})(this,function(Q,mb){function n(a){for(var b="https://reactjs.org/docs/error-decoder.html?invariant="+a,c=1;c<arguments.length;c++)b+="&args[]="+encodeURIComponent(arguments[c]);return"Minified React error #"+a+"; visit "+b+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}
function nb(a,b){Ab(a,b);Ab(a+"Capture",b)}function Ab(a,b){$b[a]=b;for(a=0;a<b.length;a++)cg.add(b[a])}function cj(a){if(Zd.call(dg,a))return!0;if(Zd.call(eg,a))return!1;if(dj.test(a))return dg[a]=!0;eg[a]=!0;return!1}function ej(a,b,c,d){if(null!==c&&0===c.type)return!1;switch(typeof b){case "function":case "symbol":return!0;case "boolean":if(d)return!1;if(null!==c)return!c.acceptsBooleans;a=a.toLowerCase().slice(0,5);return"data-"!==a&&"aria-"!==a;default:return!1}}function fj(a,b,c,d){if(null===
b||"undefined"===typeof b||ej(a,b,c,d))return!0;if(d)return!1;if(null!==c)switch(c.type){case 3:return!b;case 4:return!1===b;case 5:return isNaN(b);case 6:return isNaN(b)||1>b}return!1}function Y(a,b,c,d,e,f,g){this.acceptsBooleans=2===b||3===b||4===b;this.attributeName=d;this.attributeNamespace=e;this.mustUseProperty=c;this.propertyName=a;this.type=b;this.sanitizeURL=f;this.removeEmptyString=g}function $d(a,b,c,d){var e=R.hasOwnProperty(b)?R[b]:null;if(null!==e?0!==e.type:d||!(2<b.length)||"o"!==
b[0]&&"O"!==b[0]||"n"!==b[1]&&"N"!==b[1])fj(b,c,e,d)&&(c=null),d||null===e?cj(b)&&(null===c?a.removeAttribute(b):a.setAttribute(b,""+c)):e.mustUseProperty?a[e.propertyName]=null===c?3===e.type?!1:"":c:(b=e.attributeName,d=e.attributeNamespace,null===c?a.removeAttribute(b):(e=e.type,c=3===e||4===e&&!0===c?"":""+c,d?a.setAttributeNS(d,b,c):a.setAttribute(b,c)))}function ac(a){if(null===a||"object"!==typeof a)return null;a=fg&&a[fg]||a["@@iterator"];return"function"===typeof a?a:null}function bc(a,b,
c){if(void 0===ae)try{throw Error();}catch(d){ae=(b=d.stack.trim().match(/\n( *(at )?)/))&&b[1]||""}return"\n"+ae+a}function be(a,b){if(!a||ce)return"";ce=!0;var c=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(b)if(b=function(){throw Error();},Object.defineProperty(b.prototype,"props",{set:function(){throw Error();}}),"object"===typeof Reflect&&Reflect.construct){try{Reflect.construct(b,[])}catch(m){var d=m}Reflect.construct(a,[],b)}else{try{b.call()}catch(m){d=m}a.call(b.prototype)}else{try{throw Error();
}catch(m){d=m}a()}}catch(m){if(m&&d&&"string"===typeof m.stack){for(var e=m.stack.split("\n"),f=d.stack.split("\n"),g=e.length-1,h=f.length-1;1<=g&&0<=h&&e[g]!==f[h];)h--;for(;1<=g&&0<=h;g--,h--)if(e[g]!==f[h]){if(1!==g||1!==h){do if(g--,h--,0>h||e[g]!==f[h]){var k="\n"+e[g].replace(" at new "," at ");a.displayName&&k.includes("<anonymous>")&&(k=k.replace("<anonymous>",a.displayName));return k}while(1<=g&&0<=h)}break}}}finally{ce=!1,Error.prepareStackTrace=c}return(a=a?a.displayName||a.name:"")?bc(a):
""}function gj(a){switch(a.tag){case 5:return bc(a.type);case 16:return bc("Lazy");case 13:return bc("Suspense");case 19:return bc("SuspenseList");case 0:case 2:case 15:return a=be(a.type,!1),a;case 11:return a=be(a.type.render,!1),a;case 1:return a=be(a.type,!0),a;default:return""}}function de(a){if(null==a)return null;if("function"===typeof a)return a.displayName||a.name||null;if("string"===typeof a)return a;switch(a){case Bb:return"Fragment";case Cb:return"Portal";case ee:return"Profiler";case fe:return"StrictMode";
case ge:return"Suspense";case he:return"SuspenseList"}if("object"===typeof a)switch(a.$$typeof){case gg:return(a.displayName||"Context")+".Consumer";case hg:return(a._context.displayName||"Context")+".Provider";case ie:var b=a.render;a=a.displayName;a||(a=b.displayName||b.name||"",a=""!==a?"ForwardRef("+a+")":"ForwardRef");return a;case je:return b=a.displayName||null,null!==b?b:de(a.type)||"Memo";case Ta:b=a._payload;a=a._init;try{return de(a(b))}catch(c){}}return null}function hj(a){var b=a.type;
switch(a.tag){case 24:return"Cache";case 9:return(b.displayName||"Context")+".Consumer";case 10:return(b._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return a=b.render,a=a.displayName||a.name||"",b.displayName||(""!==a?"ForwardRef("+a+")":"ForwardRef");case 7:return"Fragment";case 5:return b;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return de(b);case 8:return b===fe?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";
case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if("function"===typeof b)return b.displayName||b.name||null;if("string"===typeof b)return b}return null}function Ua(a){switch(typeof a){case "boolean":case "number":case "string":case "undefined":return a;case "object":return a;default:return""}}function ig(a){var b=a.type;return(a=a.nodeName)&&"input"===a.toLowerCase()&&("checkbox"===b||"radio"===
b)}function ij(a){var b=ig(a)?"checked":"value",c=Object.getOwnPropertyDescriptor(a.constructor.prototype,b),d=""+a[b];if(!a.hasOwnProperty(b)&&"undefined"!==typeof c&&"function"===typeof c.get&&"function"===typeof c.set){var e=c.get,f=c.set;Object.defineProperty(a,b,{configurable:!0,get:function(){return e.call(this)},set:function(a){d=""+a;f.call(this,a)}});Object.defineProperty(a,b,{enumerable:c.enumerable});return{getValue:function(){return d},setValue:function(a){d=""+a},stopTracking:function(){a._valueTracker=
null;delete a[b]}}}}function Pc(a){a._valueTracker||(a._valueTracker=ij(a))}function jg(a){if(!a)return!1;var b=a._valueTracker;if(!b)return!0;var c=b.getValue();var d="";a&&(d=ig(a)?a.checked?"true":"false":a.value);a=d;return a!==c?(b.setValue(a),!0):!1}function Qc(a){a=a||("undefined"!==typeof document?document:void 0);if("undefined"===typeof a)return null;try{return a.activeElement||a.body}catch(b){return a.body}}function ke(a,b){var c=b.checked;return E({},b,{defaultChecked:void 0,defaultValue:void 0,
value:void 0,checked:null!=c?c:a._wrapperState.initialChecked})}function kg(a,b){var c=null==b.defaultValue?"":b.defaultValue,d=null!=b.checked?b.checked:b.defaultChecked;c=Ua(null!=b.value?b.value:c);a._wrapperState={initialChecked:d,initialValue:c,controlled:"checkbox"===b.type||"radio"===b.type?null!=b.checked:null!=b.value}}function lg(a,b){b=b.checked;null!=b&&$d(a,"checked",b,!1)}function le(a,b){lg(a,b);var c=Ua(b.value),d=b.type;if(null!=c)if("number"===d){if(0===c&&""===a.value||a.value!=
c)a.value=""+c}else a.value!==""+c&&(a.value=""+c);else if("submit"===d||"reset"===d){a.removeAttribute("value");return}b.hasOwnProperty("value")?me(a,b.type,c):b.hasOwnProperty("defaultValue")&&me(a,b.type,Ua(b.defaultValue));null==b.checked&&null!=b.defaultChecked&&(a.defaultChecked=!!b.defaultChecked)}function mg(a,b,c){if(b.hasOwnProperty("value")||b.hasOwnProperty("defaultValue")){var d=b.type;if(!("submit"!==d&&"reset"!==d||void 0!==b.value&&null!==b.value))return;b=""+a._wrapperState.initialValue;
c||b===a.value||(a.value=b);a.defaultValue=b}c=a.name;""!==c&&(a.name="");a.defaultChecked=!!a._wrapperState.initialChecked;""!==c&&(a.name=c)}function me(a,b,c){if("number"!==b||Qc(a.ownerDocument)!==a)null==c?a.defaultValue=""+a._wrapperState.initialValue:a.defaultValue!==""+c&&(a.defaultValue=""+c)}function Db(a,b,c,d){a=a.options;if(b){b={};for(var e=0;e<c.length;e++)b["$"+c[e]]=!0;for(c=0;c<a.length;c++)e=b.hasOwnProperty("$"+a[c].value),a[c].selected!==e&&(a[c].selected=e),e&&d&&(a[c].defaultSelected=
!0)}else{c=""+Ua(c);b=null;for(e=0;e<a.length;e++){if(a[e].value===c){a[e].selected=!0;d&&(a[e].defaultSelected=!0);return}null!==b||a[e].disabled||(b=a[e])}null!==b&&(b.selected=!0)}}function ne(a,b){if(null!=b.dangerouslySetInnerHTML)throw Error(n(91));return E({},b,{value:void 0,defaultValue:void 0,children:""+a._wrapperState.initialValue})}function ng(a,b){var c=b.value;if(null==c){c=b.children;b=b.defaultValue;if(null!=c){if(null!=b)throw Error(n(92));if(cc(c)){if(1<c.length)throw Error(n(93));
c=c[0]}b=c}null==b&&(b="");c=b}a._wrapperState={initialValue:Ua(c)}}function og(a,b){var c=Ua(b.value),d=Ua(b.defaultValue);null!=c&&(c=""+c,c!==a.value&&(a.value=c),null==b.defaultValue&&a.defaultValue!==c&&(a.defaultValue=c));null!=d&&(a.defaultValue=""+d)}function pg(a,b){b=a.textContent;b===a._wrapperState.initialValue&&""!==b&&null!==b&&(a.value=b)}function qg(a){switch(a){case "svg":return"http://www.w3.org/2000/svg";case "math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}
function oe(a,b){return null==a||"http://www.w3.org/1999/xhtml"===a?qg(b):"http://www.w3.org/2000/svg"===a&&"foreignObject"===b?"http://www.w3.org/1999/xhtml":a}function rg(a,b,c){return null==b||"boolean"===typeof b||""===b?"":c||"number"!==typeof b||0===b||dc.hasOwnProperty(a)&&dc[a]?(""+b).trim():b+"px"}function sg(a,b){a=a.style;for(var c in b)if(b.hasOwnProperty(c)){var d=0===c.indexOf("--"),e=rg(c,b[c],d);"float"===c&&(c="cssFloat");d?a.setProperty(c,e):a[c]=e}}function pe(a,b){if(b){if(jj[a]&&
(null!=b.children||null!=b.dangerouslySetInnerHTML))throw Error(n(137,a));if(null!=b.dangerouslySetInnerHTML){if(null!=b.children)throw Error(n(60));if("object"!==typeof b.dangerouslySetInnerHTML||!("__html"in b.dangerouslySetInnerHTML))throw Error(n(61));}if(null!=b.style&&"object"!==typeof b.style)throw Error(n(62));}}function qe(a,b){if(-1===a.indexOf("-"))return"string"===typeof b.is;switch(a){case "annotation-xml":case "color-profile":case "font-face":case "font-face-src":case "font-face-uri":case "font-face-format":case "font-face-name":case "missing-glyph":return!1;
default:return!0}}function re(a){a=a.target||a.srcElement||window;a.correspondingUseElement&&(a=a.correspondingUseElement);return 3===a.nodeType?a.parentNode:a}function tg(a){if(a=ec(a)){if("function"!==typeof se)throw Error(n(280));var b=a.stateNode;b&&(b=Rc(b),se(a.stateNode,a.type,b))}}function ug(a){Eb?Fb?Fb.push(a):Fb=[a]:Eb=a}function vg(){if(Eb){var a=Eb,b=Fb;Fb=Eb=null;tg(a);if(b)for(a=0;a<b.length;a++)tg(b[a])}}function wg(a,b,c){if(te)return a(b,c);te=!0;try{return xg(a,b,c)}finally{if(te=
!1,null!==Eb||null!==Fb)yg(),vg()}}function fc(a,b){var c=a.stateNode;if(null===c)return null;var d=Rc(c);if(null===d)return null;c=d[b];a:switch(b){case "onClick":case "onClickCapture":case "onDoubleClick":case "onDoubleClickCapture":case "onMouseDown":case "onMouseDownCapture":case "onMouseMove":case "onMouseMoveCapture":case "onMouseUp":case "onMouseUpCapture":case "onMouseEnter":(d=!d.disabled)||(a=a.type,d=!("button"===a||"input"===a||"select"===a||"textarea"===a));a=!d;break a;default:a=!1}if(a)return null;
if(c&&"function"!==typeof c)throw Error(n(231,b,typeof c));return c}function kj(a,b,c,d,e,f,g,h,k){gc=!1;Sc=null;lj.apply(mj,arguments)}function nj(a,b,c,d,e,f,g,h,k){kj.apply(this,arguments);if(gc){if(gc){var m=Sc;gc=!1;Sc=null}else throw Error(n(198));Tc||(Tc=!0,ue=m)}}function ob(a){var b=a,c=a;if(a.alternate)for(;b.return;)b=b.return;else{a=b;do b=a,0!==(b.flags&4098)&&(c=b.return),a=b.return;while(a)}return 3===b.tag?c:null}function zg(a){if(13===a.tag){var b=a.memoizedState;null===b&&(a=a.alternate,
null!==a&&(b=a.memoizedState));if(null!==b)return b.dehydrated}return null}function Ag(a){if(ob(a)!==a)throw Error(n(188));}function oj(a){var b=a.alternate;if(!b){b=ob(a);if(null===b)throw Error(n(188));return b!==a?null:a}for(var c=a,d=b;;){var e=c.return;if(null===e)break;var f=e.alternate;if(null===f){d=e.return;if(null!==d){c=d;continue}break}if(e.child===f.child){for(f=e.child;f;){if(f===c)return Ag(e),a;if(f===d)return Ag(e),b;f=f.sibling}throw Error(n(188));}if(c.return!==d.return)c=e,d=f;
else{for(var g=!1,h=e.child;h;){if(h===c){g=!0;c=e;d=f;break}if(h===d){g=!0;d=e;c=f;break}h=h.sibling}if(!g){for(h=f.child;h;){if(h===c){g=!0;c=f;d=e;break}if(h===d){g=!0;d=f;c=e;break}h=h.sibling}if(!g)throw Error(n(189));}}if(c.alternate!==d)throw Error(n(190));}if(3!==c.tag)throw Error(n(188));return c.stateNode.current===c?a:b}function Bg(a){a=oj(a);return null!==a?Cg(a):null}function Cg(a){if(5===a.tag||6===a.tag)return a;for(a=a.child;null!==a;){var b=Cg(a);if(null!==b)return b;a=a.sibling}return null}
function pj(a,b){if(Ca&&"function"===typeof Ca.onCommitFiberRoot)try{Ca.onCommitFiberRoot(Uc,a,void 0,128===(a.current.flags&128))}catch(c){}}function qj(a){a>>>=0;return 0===a?32:31-(rj(a)/sj|0)|0}function hc(a){switch(a&-a){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return a&
4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return a&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return a}}function Vc(a,b){var c=a.pendingLanes;if(0===c)return 0;var d=0,e=a.suspendedLanes,f=a.pingedLanes,g=c&268435455;if(0!==g){var h=g&~e;0!==h?d=hc(h):(f&=g,0!==f&&(d=hc(f)))}else g=c&~e,0!==g?d=hc(g):0!==f&&(d=hc(f));if(0===d)return 0;if(0!==b&&b!==d&&0===(b&e)&&
(e=d&-d,f=b&-b,e>=f||16===e&&0!==(f&4194240)))return b;0!==(d&4)&&(d|=c&16);b=a.entangledLanes;if(0!==b)for(a=a.entanglements,b&=d;0<b;)c=31-ta(b),e=1<<c,d|=a[c],b&=~e;return d}function tj(a,b){switch(a){case 1:case 2:case 4:return b+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return b+5E3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;
case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function uj(a,b){for(var c=a.suspendedLanes,d=a.pingedLanes,e=a.expirationTimes,f=a.pendingLanes;0<f;){var g=31-ta(f),h=1<<g,k=e[g];if(-1===k){if(0===(h&c)||0!==(h&d))e[g]=tj(h,b)}else k<=b&&(a.expiredLanes|=h);f&=~h}}function ve(a){a=a.pendingLanes&-1073741825;return 0!==a?a:a&1073741824?1073741824:0}function Dg(){var a=Wc;Wc<<=1;0===(Wc&4194240)&&(Wc=64);return a}function we(a){for(var b=[],c=0;31>c;c++)b.push(a);
return b}function ic(a,b,c){a.pendingLanes|=b;536870912!==b&&(a.suspendedLanes=0,a.pingedLanes=0);a=a.eventTimes;b=31-ta(b);a[b]=c}function vj(a,b){var c=a.pendingLanes&~b;a.pendingLanes=b;a.suspendedLanes=0;a.pingedLanes=0;a.expiredLanes&=b;a.mutableReadLanes&=b;a.entangledLanes&=b;b=a.entanglements;var d=a.eventTimes;for(a=a.expirationTimes;0<c;){var e=31-ta(c),f=1<<e;b[e]=0;d[e]=-1;a[e]=-1;c&=~f}}function xe(a,b){var c=a.entangledLanes|=b;for(a=a.entanglements;c;){var d=31-ta(c),e=1<<d;e&b|a[d]&
b&&(a[d]|=b);c&=~e}}function Eg(a){a&=-a;return 1<a?4<a?0!==(a&268435455)?16:536870912:4:1}function Fg(a,b){switch(a){case "focusin":case "focusout":Va=null;break;case "dragenter":case "dragleave":Wa=null;break;case "mouseover":case "mouseout":Xa=null;break;case "pointerover":case "pointerout":jc.delete(b.pointerId);break;case "gotpointercapture":case "lostpointercapture":kc.delete(b.pointerId)}}function lc(a,b,c,d,e,f){if(null===a||a.nativeEvent!==f)return a={blockedOn:b,domEventName:c,eventSystemFlags:d,
nativeEvent:f,targetContainers:[e]},null!==b&&(b=ec(b),null!==b&&Gg(b)),a;a.eventSystemFlags|=d;b=a.targetContainers;null!==e&&-1===b.indexOf(e)&&b.push(e);return a}function wj(a,b,c,d,e){switch(b){case "focusin":return Va=lc(Va,a,b,c,d,e),!0;case "dragenter":return Wa=lc(Wa,a,b,c,d,e),!0;case "mouseover":return Xa=lc(Xa,a,b,c,d,e),!0;case "pointerover":var f=e.pointerId;jc.set(f,lc(jc.get(f)||null,a,b,c,d,e));return!0;case "gotpointercapture":return f=e.pointerId,kc.set(f,lc(kc.get(f)||null,a,b,
c,d,e)),!0}return!1}function Hg(a){var b=pb(a.target);if(null!==b){var c=ob(b);if(null!==c)if(b=c.tag,13===b){if(b=zg(c),null!==b){a.blockedOn=b;xj(a.priority,function(){yj(c)});return}}else if(3===b&&c.stateNode.current.memoizedState.isDehydrated){a.blockedOn=3===c.tag?c.stateNode.containerInfo:null;return}}a.blockedOn=null}function Xc(a){if(null!==a.blockedOn)return!1;for(var b=a.targetContainers;0<b.length;){var c=ye(a.domEventName,a.eventSystemFlags,b[0],a.nativeEvent);if(null===c){c=a.nativeEvent;
var d=new c.constructor(c.type,c);ze=d;c.target.dispatchEvent(d);ze=null}else return b=ec(c),null!==b&&Gg(b),a.blockedOn=c,!1;b.shift()}return!0}function Ig(a,b,c){Xc(a)&&c.delete(b)}function zj(){Ae=!1;null!==Va&&Xc(Va)&&(Va=null);null!==Wa&&Xc(Wa)&&(Wa=null);null!==Xa&&Xc(Xa)&&(Xa=null);jc.forEach(Ig);kc.forEach(Ig)}function mc(a,b){a.blockedOn===b&&(a.blockedOn=null,Ae||(Ae=!0,Jg(Kg,zj)))}function nc(a){if(0<Yc.length){mc(Yc[0],a);for(var b=1;b<Yc.length;b++){var c=Yc[b];c.blockedOn===a&&(c.blockedOn=
null)}}null!==Va&&mc(Va,a);null!==Wa&&mc(Wa,a);null!==Xa&&mc(Xa,a);b=function(b){return mc(b,a)};jc.forEach(b);kc.forEach(b);for(b=0;b<Ya.length;b++)c=Ya[b],c.blockedOn===a&&(c.blockedOn=null);for(;0<Ya.length&&(b=Ya[0],null===b.blockedOn);)Hg(b),null===b.blockedOn&&Ya.shift()}function Aj(a,b,c,d){var e=z,f=Gb.transition;Gb.transition=null;try{z=1,Be(a,b,c,d)}finally{z=e,Gb.transition=f}}function Bj(a,b,c,d){var e=z,f=Gb.transition;Gb.transition=null;try{z=4,Be(a,b,c,d)}finally{z=e,Gb.transition=
f}}function Be(a,b,c,d){if(Zc){var e=ye(a,b,c,d);if(null===e)Ce(a,b,d,$c,c),Fg(a,d);else if(wj(e,a,b,c,d))d.stopPropagation();else if(Fg(a,d),b&4&&-1<Cj.indexOf(a)){for(;null!==e;){var f=ec(e);null!==f&&Dj(f);f=ye(a,b,c,d);null===f&&Ce(a,b,d,$c,c);if(f===e)break;e=f}null!==e&&d.stopPropagation()}else Ce(a,b,d,null,c)}}function ye(a,b,c,d){$c=null;a=re(d);a=pb(a);if(null!==a)if(b=ob(a),null===b)a=null;else if(c=b.tag,13===c){a=zg(b);if(null!==a)return a;a=null}else if(3===c){if(b.stateNode.current.memoizedState.isDehydrated)return 3===
b.tag?b.stateNode.containerInfo:null;a=null}else b!==a&&(a=null);$c=a;return null}function Lg(a){switch(a){case "cancel":case "click":case "close":case "contextmenu":case "copy":case "cut":case "auxclick":case "dblclick":case "dragend":case "dragstart":case "drop":case "focusin":case "focusout":case "input":case "invalid":case "keydown":case "keypress":case "keyup":case "mousedown":case "mouseup":case "paste":case "pause":case "play":case "pointercancel":case "pointerdown":case "pointerup":case "ratechange":case "reset":case "resize":case "seeked":case "submit":case "touchcancel":case "touchend":case "touchstart":case "volumechange":case "change":case "selectionchange":case "textInput":case "compositionstart":case "compositionend":case "compositionupdate":case "beforeblur":case "afterblur":case "beforeinput":case "blur":case "fullscreenchange":case "focus":case "hashchange":case "popstate":case "select":case "selectstart":return 1;
case "drag":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "mousemove":case "mouseout":case "mouseover":case "pointermove":case "pointerout":case "pointerover":case "scroll":case "toggle":case "touchmove":case "wheel":case "mouseenter":case "mouseleave":case "pointerenter":case "pointerleave":return 4;case "message":switch(Ej()){case De:return 1;case Mg:return 4;case ad:case Fj:return 16;case Ng:return 536870912;default:return 16}default:return 16}}function Og(){if(bd)return bd;
var a,b=Ee,c=b.length,d,e="value"in Za?Za.value:Za.textContent,f=e.length;for(a=0;a<c&&b[a]===e[a];a++);var g=c-a;for(d=1;d<=g&&b[c-d]===e[f-d];d++);return bd=e.slice(a,1<d?1-d:void 0)}function cd(a){var b=a.keyCode;"charCode"in a?(a=a.charCode,0===a&&13===b&&(a=13)):a=b;10===a&&(a=13);return 32<=a||13===a?a:0}function dd(){return!0}function Pg(){return!1}function ka(a){function b(b,d,e,f,g){this._reactName=b;this._targetInst=e;this.type=d;this.nativeEvent=f;this.target=g;this.currentTarget=null;
for(var c in a)a.hasOwnProperty(c)&&(b=a[c],this[c]=b?b(f):f[c]);this.isDefaultPrevented=(null!=f.defaultPrevented?f.defaultPrevented:!1===f.returnValue)?dd:Pg;this.isPropagationStopped=Pg;return this}E(b.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():"unknown"!==typeof a.returnValue&&(a.returnValue=!1),this.isDefaultPrevented=dd)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():
"unknown"!==typeof a.cancelBubble&&(a.cancelBubble=!0),this.isPropagationStopped=dd)},persist:function(){},isPersistent:dd});return b}function Gj(a){var b=this.nativeEvent;return b.getModifierState?b.getModifierState(a):(a=Hj[a])?!!b[a]:!1}function Fe(a){return Gj}function Qg(a,b){switch(a){case "keyup":return-1!==Ij.indexOf(b.keyCode);case "keydown":return 229!==b.keyCode;case "keypress":case "mousedown":case "focusout":return!0;default:return!1}}function Rg(a){a=a.detail;return"object"===typeof a&&
"data"in a?a.data:null}function Jj(a,b){switch(a){case "compositionend":return Rg(b);case "keypress":if(32!==b.which)return null;Sg=!0;return Tg;case "textInput":return a=b.data,a===Tg&&Sg?null:a;default:return null}}function Kj(a,b){if(Hb)return"compositionend"===a||!Ge&&Qg(a,b)?(a=Og(),bd=Ee=Za=null,Hb=!1,a):null;switch(a){case "paste":return null;case "keypress":if(!(b.ctrlKey||b.altKey||b.metaKey)||b.ctrlKey&&b.altKey){if(b.char&&1<b.char.length)return b.char;if(b.which)return String.fromCharCode(b.which)}return null;
case "compositionend":return Ug&&"ko"!==b.locale?null:b.data;default:return null}}function Vg(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return"input"===b?!!Lj[a.type]:"textarea"===b?!0:!1}function Mj(a){if(!Ia)return!1;a="on"+a;var b=a in document;b||(b=document.createElement("div"),b.setAttribute(a,"return;"),b="function"===typeof b[a]);return b}function Wg(a,b,c,d){ug(d);b=ed(b,"onChange");0<b.length&&(c=new He("onChange","change",null,c,d),a.push({event:c,listeners:b}))}function Nj(a){Xg(a,
0)}function fd(a){var b=Ib(a);if(jg(b))return a}function Oj(a,b){if("change"===a)return b}function Yg(){oc&&(oc.detachEvent("onpropertychange",Zg),pc=oc=null)}function Zg(a){if("value"===a.propertyName&&fd(pc)){var b=[];Wg(b,pc,a,re(a));wg(Nj,b)}}function Pj(a,b,c){"focusin"===a?(Yg(),oc=b,pc=c,oc.attachEvent("onpropertychange",Zg)):"focusout"===a&&Yg()}function Qj(a,b){if("selectionchange"===a||"keyup"===a||"keydown"===a)return fd(pc)}function Rj(a,b){if("click"===a)return fd(b)}function Sj(a,b){if("input"===
a||"change"===a)return fd(b)}function Tj(a,b){return a===b&&(0!==a||1/a===1/b)||a!==a&&b!==b}function qc(a,b){if(ua(a,b))return!0;if("object"!==typeof a||null===a||"object"!==typeof b||null===b)return!1;var c=Object.keys(a),d=Object.keys(b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!Zd.call(b,e)||!ua(a[e],b[e]))return!1}return!0}function $g(a){for(;a&&a.firstChild;)a=a.firstChild;return a}function ah(a,b){var c=$g(a);a=0;for(var d;c;){if(3===c.nodeType){d=a+c.textContent.length;
if(a<=b&&d>=b)return{node:c,offset:b-a};a=d}a:{for(;c;){if(c.nextSibling){c=c.nextSibling;break a}c=c.parentNode}c=void 0}c=$g(c)}}function bh(a,b){return a&&b?a===b?!0:a&&3===a.nodeType?!1:b&&3===b.nodeType?bh(a,b.parentNode):"contains"in a?a.contains(b):a.compareDocumentPosition?!!(a.compareDocumentPosition(b)&16):!1:!1}function ch(){for(var a=window,b=Qc();b instanceof a.HTMLIFrameElement;){try{var c="string"===typeof b.contentWindow.location.href}catch(d){c=!1}if(c)a=b.contentWindow;else break;
b=Qc(a.document)}return b}function Ie(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return b&&("input"===b&&("text"===a.type||"search"===a.type||"tel"===a.type||"url"===a.type||"password"===a.type)||"textarea"===b||"true"===a.contentEditable)}function Uj(a){var b=ch(),c=a.focusedElem,d=a.selectionRange;if(b!==c&&c&&c.ownerDocument&&bh(c.ownerDocument.documentElement,c)){if(null!==d&&Ie(c))if(b=d.start,a=d.end,void 0===a&&(a=b),"selectionStart"in c)c.selectionStart=b,c.selectionEnd=Math.min(a,c.value.length);
else if(a=(b=c.ownerDocument||document)&&b.defaultView||window,a.getSelection){a=a.getSelection();var e=c.textContent.length,f=Math.min(d.start,e);d=void 0===d.end?f:Math.min(d.end,e);!a.extend&&f>d&&(e=d,d=f,f=e);e=ah(c,f);var g=ah(c,d);e&&g&&(1!==a.rangeCount||a.anchorNode!==e.node||a.anchorOffset!==e.offset||a.focusNode!==g.node||a.focusOffset!==g.offset)&&(b=b.createRange(),b.setStart(e.node,e.offset),a.removeAllRanges(),f>d?(a.addRange(b),a.extend(g.node,g.offset)):(b.setEnd(g.node,g.offset),
a.addRange(b)))}b=[];for(a=c;a=a.parentNode;)1===a.nodeType&&b.push({element:a,left:a.scrollLeft,top:a.scrollTop});"function"===typeof c.focus&&c.focus();for(c=0;c<b.length;c++)a=b[c],a.element.scrollLeft=a.left,a.element.scrollTop=a.top}}function dh(a,b,c){var d=c.window===c?c.document:9===c.nodeType?c:c.ownerDocument;Je||null==Jb||Jb!==Qc(d)||(d=Jb,"selectionStart"in d&&Ie(d)?d={start:d.selectionStart,end:d.selectionEnd}:(d=(d.ownerDocument&&d.ownerDocument.defaultView||window).getSelection(),d=
{anchorNode:d.anchorNode,anchorOffset:d.anchorOffset,focusNode:d.focusNode,focusOffset:d.focusOffset}),rc&&qc(rc,d)||(rc=d,d=ed(Ke,"onSelect"),0<d.length&&(b=new He("onSelect","select",null,b,c),a.push({event:b,listeners:d}),b.target=Jb)))}function gd(a,b){var c={};c[a.toLowerCase()]=b.toLowerCase();c["Webkit"+a]="webkit"+b;c["Moz"+a]="moz"+b;return c}function hd(a){if(Le[a])return Le[a];if(!Kb[a])return a;var b=Kb[a],c;for(c in b)if(b.hasOwnProperty(c)&&c in eh)return Le[a]=b[c];return a}function $a(a,
b){fh.set(a,b);nb(b,[a])}function gh(a,b,c){var d=a.type||"unknown-event";a.currentTarget=c;nj(d,b,void 0,a);a.currentTarget=null}function Xg(a,b){b=0!==(b&4);for(var c=0;c<a.length;c++){var d=a[c],e=d.event;d=d.listeners;a:{var f=void 0;if(b)for(var g=d.length-1;0<=g;g--){var h=d[g],k=h.instance,m=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;gh(e,h,m);f=k}else for(g=0;g<d.length;g++){h=d[g];k=h.instance;m=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;
gh(e,h,m);f=k}}}if(Tc)throw a=ue,Tc=!1,ue=null,a;}function B(a,b){var c=b[Me];void 0===c&&(c=b[Me]=new Set);var d=a+"__bubble";c.has(d)||(hh(b,a,2,!1),c.add(d))}function Ne(a,b,c){var d=0;b&&(d|=4);hh(c,a,d,b)}function sc(a){if(!a[id]){a[id]=!0;cg.forEach(function(b){"selectionchange"!==b&&(Vj.has(b)||Ne(b,!1,a),Ne(b,!0,a))});var b=9===a.nodeType?a:a.ownerDocument;null===b||b[id]||(b[id]=!0,Ne("selectionchange",!1,b))}}function hh(a,b,c,d,e){switch(Lg(b)){case 1:e=Aj;break;case 4:e=Bj;break;default:e=
Be}c=e.bind(null,b,c,a);e=void 0;!Oe||"touchstart"!==b&&"touchmove"!==b&&"wheel"!==b||(e=!0);d?void 0!==e?a.addEventListener(b,c,{capture:!0,passive:e}):a.addEventListener(b,c,!0):void 0!==e?a.addEventListener(b,c,{passive:e}):a.addEventListener(b,c,!1)}function Ce(a,b,c,d,e){var f=d;if(0===(b&1)&&0===(b&2)&&null!==d)a:for(;;){if(null===d)return;var g=d.tag;if(3===g||4===g){var h=d.stateNode.containerInfo;if(h===e||8===h.nodeType&&h.parentNode===e)break;if(4===g)for(g=d.return;null!==g;){var k=g.tag;
if(3===k||4===k)if(k=g.stateNode.containerInfo,k===e||8===k.nodeType&&k.parentNode===e)return;g=g.return}for(;null!==h;){g=pb(h);if(null===g)return;k=g.tag;if(5===k||6===k){d=f=g;continue a}h=h.parentNode}}d=d.return}wg(function(){var d=f,e=re(c),g=[];a:{var h=fh.get(a);if(void 0!==h){var k=He,n=a;switch(a){case "keypress":if(0===cd(c))break a;case "keydown":case "keyup":k=Wj;break;case "focusin":n="focus";k=Pe;break;case "focusout":n="blur";k=Pe;break;case "beforeblur":case "afterblur":k=Pe;break;
case "click":if(2===c.button)break a;case "auxclick":case "dblclick":case "mousedown":case "mousemove":case "mouseup":case "mouseout":case "mouseover":case "contextmenu":k=ih;break;case "drag":case "dragend":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "dragstart":case "drop":k=Xj;break;case "touchcancel":case "touchend":case "touchmove":case "touchstart":k=Yj;break;case jh:case kh:case lh:k=Zj;break;case mh:k=ak;break;case "scroll":k=bk;break;case "wheel":k=ck;break;case "copy":case "cut":case "paste":k=
dk;break;case "gotpointercapture":case "lostpointercapture":case "pointercancel":case "pointerdown":case "pointermove":case "pointerout":case "pointerover":case "pointerup":k=nh}var l=0!==(b&4),p=!l&&"scroll"===a,A=l?null!==h?h+"Capture":null:h;l=[];for(var v=d,q;null!==v;){q=v;var M=q.stateNode;5===q.tag&&null!==M&&(q=M,null!==A&&(M=fc(v,A),null!=M&&l.push(tc(v,M,q))));if(p)break;v=v.return}0<l.length&&(h=new k(h,n,null,c,e),g.push({event:h,listeners:l}))}}if(0===(b&7)){a:{h="mouseover"===a||"pointerover"===
a;k="mouseout"===a||"pointerout"===a;if(h&&c!==ze&&(n=c.relatedTarget||c.fromElement)&&(pb(n)||n[Ja]))break a;if(k||h){h=e.window===e?e:(h=e.ownerDocument)?h.defaultView||h.parentWindow:window;if(k){if(n=c.relatedTarget||c.toElement,k=d,n=n?pb(n):null,null!==n&&(p=ob(n),n!==p||5!==n.tag&&6!==n.tag))n=null}else k=null,n=d;if(k!==n){l=ih;M="onMouseLeave";A="onMouseEnter";v="mouse";if("pointerout"===a||"pointerover"===a)l=nh,M="onPointerLeave",A="onPointerEnter",v="pointer";p=null==k?h:Ib(k);q=null==
n?h:Ib(n);h=new l(M,v+"leave",k,c,e);h.target=p;h.relatedTarget=q;M=null;pb(e)===d&&(l=new l(A,v+"enter",n,c,e),l.target=q,l.relatedTarget=p,M=l);p=M;if(k&&n)b:{l=k;A=n;v=0;for(q=l;q;q=Lb(q))v++;q=0;for(M=A;M;M=Lb(M))q++;for(;0<v-q;)l=Lb(l),v--;for(;0<q-v;)A=Lb(A),q--;for(;v--;){if(l===A||null!==A&&l===A.alternate)break b;l=Lb(l);A=Lb(A)}l=null}else l=null;null!==k&&oh(g,h,k,l,!1);null!==n&&null!==p&&oh(g,p,n,l,!0)}}}a:{h=d?Ib(d):window;k=h.nodeName&&h.nodeName.toLowerCase();if("select"===k||"input"===
k&&"file"===h.type)var ma=Oj;else if(Vg(h))if(ph)ma=Sj;else{ma=Qj;var va=Pj}else(k=h.nodeName)&&"input"===k.toLowerCase()&&("checkbox"===h.type||"radio"===h.type)&&(ma=Rj);if(ma&&(ma=ma(a,d))){Wg(g,ma,c,e);break a}va&&va(a,h,d);"focusout"===a&&(va=h._wrapperState)&&va.controlled&&"number"===h.type&&me(h,"number",h.value)}va=d?Ib(d):window;switch(a){case "focusin":if(Vg(va)||"true"===va.contentEditable)Jb=va,Ke=d,rc=null;break;case "focusout":rc=Ke=Jb=null;break;case "mousedown":Je=!0;break;case "contextmenu":case "mouseup":case "dragend":Je=
!1;dh(g,c,e);break;case "selectionchange":if(ek)break;case "keydown":case "keyup":dh(g,c,e)}var ab;if(Ge)b:{switch(a){case "compositionstart":var da="onCompositionStart";break b;case "compositionend":da="onCompositionEnd";break b;case "compositionupdate":da="onCompositionUpdate";break b}da=void 0}else Hb?Qg(a,c)&&(da="onCompositionEnd"):"keydown"===a&&229===c.keyCode&&(da="onCompositionStart");da&&(Ug&&"ko"!==c.locale&&(Hb||"onCompositionStart"!==da?"onCompositionEnd"===da&&Hb&&(ab=Og()):(Za=e,Ee=
"value"in Za?Za.value:Za.textContent,Hb=!0)),va=ed(d,da),0<va.length&&(da=new qh(da,a,null,c,e),g.push({event:da,listeners:va}),ab?da.data=ab:(ab=Rg(c),null!==ab&&(da.data=ab))));if(ab=fk?Jj(a,c):Kj(a,c))d=ed(d,"onBeforeInput"),0<d.length&&(e=new gk("onBeforeInput","beforeinput",null,c,e),g.push({event:e,listeners:d}),e.data=ab)}Xg(g,b)})}function tc(a,b,c){return{instance:a,listener:b,currentTarget:c}}function ed(a,b){for(var c=b+"Capture",d=[];null!==a;){var e=a,f=e.stateNode;5===e.tag&&null!==
f&&(e=f,f=fc(a,c),null!=f&&d.unshift(tc(a,f,e)),f=fc(a,b),null!=f&&d.push(tc(a,f,e)));a=a.return}return d}function Lb(a){if(null===a)return null;do a=a.return;while(a&&5!==a.tag);return a?a:null}function oh(a,b,c,d,e){for(var f=b._reactName,g=[];null!==c&&c!==d;){var h=c,k=h.alternate,m=h.stateNode;if(null!==k&&k===d)break;5===h.tag&&null!==m&&(h=m,e?(k=fc(c,f),null!=k&&g.unshift(tc(c,k,h))):e||(k=fc(c,f),null!=k&&g.push(tc(c,k,h))));c=c.return}0!==g.length&&a.push({event:b,listeners:g})}function rh(a){return("string"===
typeof a?a:""+a).replace(hk,"\n").replace(ik,"")}function jd(a,b,c,d){b=rh(b);if(rh(a)!==b&&c)throw Error(n(425));}function kd(){}function Qe(a,b){return"textarea"===a||"noscript"===a||"string"===typeof b.children||"number"===typeof b.children||"object"===typeof b.dangerouslySetInnerHTML&&null!==b.dangerouslySetInnerHTML&&null!=b.dangerouslySetInnerHTML.__html}function jk(a){setTimeout(function(){throw a;})}function Re(a,b){var c=b,d=0;do{var e=c.nextSibling;a.removeChild(c);if(e&&8===e.nodeType)if(c=
e.data,"/$"===c){if(0===d){a.removeChild(e);nc(b);return}d--}else"$"!==c&&"$?"!==c&&"$!"!==c||d++;c=e}while(c);nc(b)}function Ka(a){for(;null!=a;a=a.nextSibling){var b=a.nodeType;if(1===b||3===b)break;if(8===b){b=a.data;if("$"===b||"$!"===b||"$?"===b)break;if("/$"===b)return null}}return a}function sh(a){a=a.previousSibling;for(var b=0;a;){if(8===a.nodeType){var c=a.data;if("$"===c||"$!"===c||"$?"===c){if(0===b)return a;b--}else"/$"===c&&b++}a=a.previousSibling}return null}function pb(a){var b=a[Da];
if(b)return b;for(var c=a.parentNode;c;){if(b=c[Ja]||c[Da]){c=b.alternate;if(null!==b.child||null!==c&&null!==c.child)for(a=sh(a);null!==a;){if(c=a[Da])return c;a=sh(a)}return b}a=c;c=a.parentNode}return null}function ec(a){a=a[Da]||a[Ja];return!a||5!==a.tag&&6!==a.tag&&13!==a.tag&&3!==a.tag?null:a}function Ib(a){if(5===a.tag||6===a.tag)return a.stateNode;throw Error(n(33));}function Rc(a){return a[uc]||null}function bb(a){return{current:a}}function w(a,b){0>Mb||(a.current=Se[Mb],Se[Mb]=null,Mb--)}
function y(a,b,c){Mb++;Se[Mb]=a.current;a.current=b}function Nb(a,b){var c=a.type.contextTypes;if(!c)return cb;var d=a.stateNode;if(d&&d.__reactInternalMemoizedUnmaskedChildContext===b)return d.__reactInternalMemoizedMaskedChildContext;var e={},f;for(f in c)e[f]=b[f];d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=b,a.__reactInternalMemoizedMaskedChildContext=e);return e}function ea(a){a=a.childContextTypes;return null!==a&&void 0!==a}function th(a,b,c){if(J.current!==cb)throw Error(n(168));
y(J,b);y(S,c)}function uh(a,b,c){var d=a.stateNode;b=b.childContextTypes;if("function"!==typeof d.getChildContext)return c;d=d.getChildContext();for(var e in d)if(!(e in b))throw Error(n(108,hj(a)||"Unknown",e));return E({},c,d)}function ld(a){a=(a=a.stateNode)&&a.__reactInternalMemoizedMergedChildContext||cb;qb=J.current;y(J,a);y(S,S.current);return!0}function vh(a,b,c){var d=a.stateNode;if(!d)throw Error(n(169));c?(a=uh(a,b,qb),d.__reactInternalMemoizedMergedChildContext=a,w(S),w(J),y(J,a)):w(S);
y(S,c)}function wh(a){null===La?La=[a]:La.push(a)}function kk(a){md=!0;wh(a)}function db(){if(!Te&&null!==La){Te=!0;var a=0,b=z;try{var c=La;for(z=1;a<c.length;a++){var d=c[a];do d=d(!0);while(null!==d)}La=null;md=!1}catch(e){throw null!==La&&(La=La.slice(a+1)),xh(De,db),e;}finally{z=b,Te=!1}}return null}function rb(a,b){Ob[Pb++]=nd;Ob[Pb++]=od;od=a;nd=b}function yh(a,b,c){na[oa++]=Ma;na[oa++]=Na;na[oa++]=sb;sb=a;var d=Ma;a=Na;var e=32-ta(d)-1;d&=~(1<<e);c+=1;var f=32-ta(b)+e;if(30<f){var g=e-e%5;
f=(d&(1<<g)-1).toString(32);d>>=g;e-=g;Ma=1<<32-ta(b)+e|c<<e|d;Na=f+a}else Ma=1<<f|c<<e|d,Na=a}function Ue(a){null!==a.return&&(rb(a,1),yh(a,1,0))}function Ve(a){for(;a===od;)od=Ob[--Pb],Ob[Pb]=null,nd=Ob[--Pb],Ob[Pb]=null;for(;a===sb;)sb=na[--oa],na[oa]=null,Na=na[--oa],na[oa]=null,Ma=na[--oa],na[oa]=null}function zh(a,b){var c=pa(5,null,null,0);c.elementType="DELETED";c.stateNode=b;c.return=a;b=a.deletions;null===b?(a.deletions=[c],a.flags|=16):b.push(c)}function Ah(a,b){switch(a.tag){case 5:var c=
a.type;b=1!==b.nodeType||c.toLowerCase()!==b.nodeName.toLowerCase()?null:b;return null!==b?(a.stateNode=b,la=a,fa=Ka(b.firstChild),!0):!1;case 6:return b=""===a.pendingProps||3!==b.nodeType?null:b,null!==b?(a.stateNode=b,la=a,fa=null,!0):!1;case 13:return b=8!==b.nodeType?null:b,null!==b?(c=null!==sb?{id:Ma,overflow:Na}:null,a.memoizedState={dehydrated:b,treeContext:c,retryLane:1073741824},c=pa(18,null,null,0),c.stateNode=b,c.return=a,a.child=c,la=a,fa=null,!0):!1;default:return!1}}function We(a){return 0!==
(a.mode&1)&&0===(a.flags&128)}function Xe(a){if(D){var b=fa;if(b){var c=b;if(!Ah(a,b)){if(We(a))throw Error(n(418));b=Ka(c.nextSibling);var d=la;b&&Ah(a,b)?zh(d,c):(a.flags=a.flags&-4097|2,D=!1,la=a)}}else{if(We(a))throw Error(n(418));a.flags=a.flags&-4097|2;D=!1;la=a}}}function Bh(a){for(a=a.return;null!==a&&5!==a.tag&&3!==a.tag&&13!==a.tag;)a=a.return;la=a}function pd(a){if(a!==la)return!1;if(!D)return Bh(a),D=!0,!1;var b;(b=3!==a.tag)&&!(b=5!==a.tag)&&(b=a.type,b="head"!==b&&"body"!==b&&!Qe(a.type,
a.memoizedProps));if(b&&(b=fa)){if(We(a)){for(a=fa;a;)a=Ka(a.nextSibling);throw Error(n(418));}for(;b;)zh(a,b),b=Ka(b.nextSibling)}Bh(a);if(13===a.tag){a=a.memoizedState;a=null!==a?a.dehydrated:null;if(!a)throw Error(n(317));a:{a=a.nextSibling;for(b=0;a;){if(8===a.nodeType){var c=a.data;if("/$"===c){if(0===b){fa=Ka(a.nextSibling);break a}b--}else"$"!==c&&"$!"!==c&&"$?"!==c||b++}a=a.nextSibling}fa=null}}else fa=la?Ka(a.stateNode.nextSibling):null;return!0}function Qb(){fa=la=null;D=!1}function Ye(a){null===
wa?wa=[a]:wa.push(a)}function xa(a,b){if(a&&a.defaultProps){b=E({},b);a=a.defaultProps;for(var c in a)void 0===b[c]&&(b[c]=a[c]);return b}return b}function Ze(){$e=Rb=qd=null}function af(a,b){b=rd.current;w(rd);a._currentValue=b}function bf(a,b,c){for(;null!==a;){var d=a.alternate;(a.childLanes&b)!==b?(a.childLanes|=b,null!==d&&(d.childLanes|=b)):null!==d&&(d.childLanes&b)!==b&&(d.childLanes|=b);if(a===c)break;a=a.return}}function Sb(a,b){qd=a;$e=Rb=null;a=a.dependencies;null!==a&&null!==a.firstContext&&
(0!==(a.lanes&b)&&(ha=!0),a.firstContext=null)}function qa(a){var b=a._currentValue;if($e!==a)if(a={context:a,memoizedValue:b,next:null},null===Rb){if(null===qd)throw Error(n(308));Rb=a;qd.dependencies={lanes:0,firstContext:a}}else Rb=Rb.next=a;return b}function cf(a){null===tb?tb=[a]:tb.push(a)}function Ch(a,b,c,d){var e=b.interleaved;null===e?(c.next=c,cf(b)):(c.next=e.next,e.next=c);b.interleaved=c;return Oa(a,d)}function Oa(a,b){a.lanes|=b;var c=a.alternate;null!==c&&(c.lanes|=b);c=a;for(a=a.return;null!==
a;)a.childLanes|=b,c=a.alternate,null!==c&&(c.childLanes|=b),c=a,a=a.return;return 3===c.tag?c.stateNode:null}function df(a){a.updateQueue={baseState:a.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Dh(a,b){a=a.updateQueue;b.updateQueue===a&&(b.updateQueue={baseState:a.baseState,firstBaseUpdate:a.firstBaseUpdate,lastBaseUpdate:a.lastBaseUpdate,shared:a.shared,effects:a.effects})}function Pa(a,b){return{eventTime:a,lane:b,
tag:0,payload:null,callback:null,next:null}}function eb(a,b,c){var d=a.updateQueue;if(null===d)return null;d=d.shared;if(0!==(p&2)){var e=d.pending;null===e?b.next=b:(b.next=e.next,e.next=b);d.pending=b;return lk(a,c)}e=d.interleaved;null===e?(b.next=b,cf(d)):(b.next=e.next,e.next=b);d.interleaved=b;return Oa(a,c)}function sd(a,b,c){b=b.updateQueue;if(null!==b&&(b=b.shared,0!==(c&4194240))){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;xe(a,c)}}function Eh(a,b){var c=a.updateQueue,d=a.alternate;
if(null!==d&&(d=d.updateQueue,c===d)){var e=null,f=null;c=c.firstBaseUpdate;if(null!==c){do{var g={eventTime:c.eventTime,lane:c.lane,tag:c.tag,payload:c.payload,callback:c.callback,next:null};null===f?e=f=g:f=f.next=g;c=c.next}while(null!==c);null===f?e=f=b:f=f.next=b}else e=f=b;c={baseState:d.baseState,firstBaseUpdate:e,lastBaseUpdate:f,shared:d.shared,effects:d.effects};a.updateQueue=c;return}a=c.lastBaseUpdate;null===a?c.firstBaseUpdate=b:a.next=b;c.lastBaseUpdate=b}function td(a,b,c,d){var e=
a.updateQueue;fb=!1;var f=e.firstBaseUpdate,g=e.lastBaseUpdate,h=e.shared.pending;if(null!==h){e.shared.pending=null;var k=h,m=k.next;k.next=null;null===g?f=m:g.next=m;g=k;var n=a.alternate;null!==n&&(n=n.updateQueue,h=n.lastBaseUpdate,h!==g&&(null===h?n.firstBaseUpdate=m:h.next=m,n.lastBaseUpdate=k))}if(null!==f){var l=e.baseState;g=0;n=m=k=null;h=f;do{var r=h.lane,p=h.eventTime;if((d&r)===r){null!==n&&(n=n.next={eventTime:p,lane:0,tag:h.tag,payload:h.payload,callback:h.callback,next:null});a:{var x=
a,F=h;r=b;p=c;switch(F.tag){case 1:x=F.payload;if("function"===typeof x){l=x.call(p,l,r);break a}l=x;break a;case 3:x.flags=x.flags&-65537|128;case 0:x=F.payload;r="function"===typeof x?x.call(p,l,r):x;if(null===r||void 0===r)break a;l=E({},l,r);break a;case 2:fb=!0}}null!==h.callback&&0!==h.lane&&(a.flags|=64,r=e.effects,null===r?e.effects=[h]:r.push(h))}else p={eventTime:p,lane:r,tag:h.tag,payload:h.payload,callback:h.callback,next:null},null===n?(m=n=p,k=l):n=n.next=p,g|=r;h=h.next;if(null===h)if(h=
e.shared.pending,null===h)break;else r=h,h=r.next,r.next=null,e.lastBaseUpdate=r,e.shared.pending=null}while(1);null===n&&(k=l);e.baseState=k;e.firstBaseUpdate=m;e.lastBaseUpdate=n;b=e.shared.interleaved;if(null!==b){e=b;do g|=e.lane,e=e.next;while(e!==b)}else null===f&&(e.shared.lanes=0);ra|=g;a.lanes=g;a.memoizedState=l}}function Fh(a,b,c){a=b.effects;b.effects=null;if(null!==a)for(b=0;b<a.length;b++){var d=a[b],e=d.callback;if(null!==e){d.callback=null;d=c;if("function"!==typeof e)throw Error(n(191,
e));e.call(d)}}}function ef(a,b,c,d){b=a.memoizedState;c=c(d,b);c=null===c||void 0===c?b:E({},b,c);a.memoizedState=c;0===a.lanes&&(a.updateQueue.baseState=c)}function Gh(a,b,c,d,e,f,g){a=a.stateNode;return"function"===typeof a.shouldComponentUpdate?a.shouldComponentUpdate(d,f,g):b.prototype&&b.prototype.isPureReactComponent?!qc(c,d)||!qc(e,f):!0}function Hh(a,b,c){var d=!1,e=cb;var f=b.contextType;"object"===typeof f&&null!==f?f=qa(f):(e=ea(b)?qb:J.current,d=b.contextTypes,f=(d=null!==d&&void 0!==
d)?Nb(a,e):cb);b=new b(c,f);a.memoizedState=null!==b.state&&void 0!==b.state?b.state:null;b.updater=ud;a.stateNode=b;b._reactInternals=a;d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=e,a.__reactInternalMemoizedMaskedChildContext=f);return b}function Ih(a,b,c,d){a=b.state;"function"===typeof b.componentWillReceiveProps&&b.componentWillReceiveProps(c,d);"function"===typeof b.UNSAFE_componentWillReceiveProps&&b.UNSAFE_componentWillReceiveProps(c,d);b.state!==a&&ud.enqueueReplaceState(b,
b.state,null)}function ff(a,b,c,d){var e=a.stateNode;e.props=c;e.state=a.memoizedState;e.refs=Jh;df(a);var f=b.contextType;"object"===typeof f&&null!==f?e.context=qa(f):(f=ea(b)?qb:J.current,e.context=Nb(a,f));e.state=a.memoizedState;f=b.getDerivedStateFromProps;"function"===typeof f&&(ef(a,b,f,c),e.state=a.memoizedState);"function"===typeof b.getDerivedStateFromProps||"function"===typeof e.getSnapshotBeforeUpdate||"function"!==typeof e.UNSAFE_componentWillMount&&"function"!==typeof e.componentWillMount||
(b=e.state,"function"===typeof e.componentWillMount&&e.componentWillMount(),"function"===typeof e.UNSAFE_componentWillMount&&e.UNSAFE_componentWillMount(),b!==e.state&&ud.enqueueReplaceState(e,e.state,null),td(a,c,e,d),e.state=a.memoizedState);"function"===typeof e.componentDidMount&&(a.flags|=4194308)}function vc(a,b,c){a=c.ref;if(null!==a&&"function"!==typeof a&&"object"!==typeof a){if(c._owner){c=c._owner;if(c){if(1!==c.tag)throw Error(n(309));var d=c.stateNode}if(!d)throw Error(n(147,a));var e=
d,f=""+a;if(null!==b&&null!==b.ref&&"function"===typeof b.ref&&b.ref._stringRef===f)return b.ref;b=function(a){var b=e.refs;b===Jh&&(b=e.refs={});null===a?delete b[f]:b[f]=a};b._stringRef=f;return b}if("string"!==typeof a)throw Error(n(284));if(!c._owner)throw Error(n(290,a));}return a}function vd(a,b){a=Object.prototype.toString.call(b);throw Error(n(31,"[object Object]"===a?"object with keys {"+Object.keys(b).join(", ")+"}":a));}function Kh(a){var b=a._init;return b(a._payload)}function Lh(a){function b(b,
c){if(a){var d=b.deletions;null===d?(b.deletions=[c],b.flags|=16):d.push(c)}}function c(c,d){if(!a)return null;for(;null!==d;)b(c,d),d=d.sibling;return null}function d(a,b){for(a=new Map;null!==b;)null!==b.key?a.set(b.key,b):a.set(b.index,b),b=b.sibling;return a}function e(a,b){a=gb(a,b);a.index=0;a.sibling=null;return a}function f(b,c,d){b.index=d;if(!a)return b.flags|=1048576,c;d=b.alternate;if(null!==d)return d=d.index,d<c?(b.flags|=2,c):d;b.flags|=2;return c}function g(b){a&&null===b.alternate&&
(b.flags|=2);return b}function h(a,b,c,d){if(null===b||6!==b.tag)return b=gf(c,a.mode,d),b.return=a,b;b=e(b,c);b.return=a;return b}function k(a,b,c,d){var f=c.type;if(f===Bb)return l(a,b,c.props.children,d,c.key);if(null!==b&&(b.elementType===f||"object"===typeof f&&null!==f&&f.$$typeof===Ta&&Kh(f)===b.type))return d=e(b,c.props),d.ref=vc(a,b,c),d.return=a,d;d=wd(c.type,c.key,c.props,null,a.mode,d);d.ref=vc(a,b,c);d.return=a;return d}function m(a,b,c,d){if(null===b||4!==b.tag||b.stateNode.containerInfo!==
c.containerInfo||b.stateNode.implementation!==c.implementation)return b=hf(c,a.mode,d),b.return=a,b;b=e(b,c.children||[]);b.return=a;return b}function l(a,b,c,d,f){if(null===b||7!==b.tag)return b=ub(c,a.mode,d,f),b.return=a,b;b=e(b,c);b.return=a;return b}function u(a,b,c){if("string"===typeof b&&""!==b||"number"===typeof b)return b=gf(""+b,a.mode,c),b.return=a,b;if("object"===typeof b&&null!==b){switch(b.$$typeof){case xd:return c=wd(b.type,b.key,b.props,null,a.mode,c),c.ref=vc(a,null,b),c.return=
a,c;case Cb:return b=hf(b,a.mode,c),b.return=a,b;case Ta:var d=b._init;return u(a,d(b._payload),c)}if(cc(b)||ac(b))return b=ub(b,a.mode,c,null),b.return=a,b;vd(a,b)}return null}function r(a,b,c,d){var e=null!==b?b.key:null;if("string"===typeof c&&""!==c||"number"===typeof c)return null!==e?null:h(a,b,""+c,d);if("object"===typeof c&&null!==c){switch(c.$$typeof){case xd:return c.key===e?k(a,b,c,d):null;case Cb:return c.key===e?m(a,b,c,d):null;case Ta:return e=c._init,r(a,b,e(c._payload),d)}if(cc(c)||
ac(c))return null!==e?null:l(a,b,c,d,null);vd(a,c)}return null}function p(a,b,c,d,e){if("string"===typeof d&&""!==d||"number"===typeof d)return a=a.get(c)||null,h(b,a,""+d,e);if("object"===typeof d&&null!==d){switch(d.$$typeof){case xd:return a=a.get(null===d.key?c:d.key)||null,k(b,a,d,e);case Cb:return a=a.get(null===d.key?c:d.key)||null,m(b,a,d,e);case Ta:var f=d._init;return p(a,b,c,f(d._payload),e)}if(cc(d)||ac(d))return a=a.get(c)||null,l(b,a,d,e,null);vd(b,d)}return null}function x(e,g,h,k){for(var n=
null,m=null,l=g,q=g=0,v=null;null!==l&&q<h.length;q++){l.index>q?(v=l,l=null):v=l.sibling;var A=r(e,l,h[q],k);if(null===A){null===l&&(l=v);break}a&&l&&null===A.alternate&&b(e,l);g=f(A,g,q);null===m?n=A:m.sibling=A;m=A;l=v}if(q===h.length)return c(e,l),D&&rb(e,q),n;if(null===l){for(;q<h.length;q++)l=u(e,h[q],k),null!==l&&(g=f(l,g,q),null===m?n=l:m.sibling=l,m=l);D&&rb(e,q);return n}for(l=d(e,l);q<h.length;q++)v=p(l,e,q,h[q],k),null!==v&&(a&&null!==v.alternate&&l.delete(null===v.key?q:v.key),g=f(v,
g,q),null===m?n=v:m.sibling=v,m=v);a&&l.forEach(function(a){return b(e,a)});D&&rb(e,q);return n}function F(e,g,h,k){var m=ac(h);if("function"!==typeof m)throw Error(n(150));h=m.call(h);if(null==h)throw Error(n(151));for(var l=m=null,q=g,v=g=0,A=null,t=h.next();null!==q&&!t.done;v++,t=h.next()){q.index>v?(A=q,q=null):A=q.sibling;var x=r(e,q,t.value,k);if(null===x){null===q&&(q=A);break}a&&q&&null===x.alternate&&b(e,q);g=f(x,g,v);null===l?m=x:l.sibling=x;l=x;q=A}if(t.done)return c(e,q),D&&rb(e,v),m;
if(null===q){for(;!t.done;v++,t=h.next())t=u(e,t.value,k),null!==t&&(g=f(t,g,v),null===l?m=t:l.sibling=t,l=t);D&&rb(e,v);return m}for(q=d(e,q);!t.done;v++,t=h.next())t=p(q,e,v,t.value,k),null!==t&&(a&&null!==t.alternate&&q.delete(null===t.key?v:t.key),g=f(t,g,v),null===l?m=t:l.sibling=t,l=t);a&&q.forEach(function(a){return b(e,a)});D&&rb(e,v);return m}function w(a,d,f,h){"object"===typeof f&&null!==f&&f.type===Bb&&null===f.key&&(f=f.props.children);if("object"===typeof f&&null!==f){switch(f.$$typeof){case xd:a:{for(var k=
f.key,m=d;null!==m;){if(m.key===k){k=f.type;if(k===Bb){if(7===m.tag){c(a,m.sibling);d=e(m,f.props.children);d.return=a;a=d;break a}}else if(m.elementType===k||"object"===typeof k&&null!==k&&k.$$typeof===Ta&&Kh(k)===m.type){c(a,m.sibling);d=e(m,f.props);d.ref=vc(a,m,f);d.return=a;a=d;break a}c(a,m);break}else b(a,m);m=m.sibling}f.type===Bb?(d=ub(f.props.children,a.mode,h,f.key),d.return=a,a=d):(h=wd(f.type,f.key,f.props,null,a.mode,h),h.ref=vc(a,d,f),h.return=a,a=h)}return g(a);case Cb:a:{for(m=f.key;null!==
d;){if(d.key===m)if(4===d.tag&&d.stateNode.containerInfo===f.containerInfo&&d.stateNode.implementation===f.implementation){c(a,d.sibling);d=e(d,f.children||[]);d.return=a;a=d;break a}else{c(a,d);break}else b(a,d);d=d.sibling}d=hf(f,a.mode,h);d.return=a;a=d}return g(a);case Ta:return m=f._init,w(a,d,m(f._payload),h)}if(cc(f))return x(a,d,f,h);if(ac(f))return F(a,d,f,h);vd(a,f)}return"string"===typeof f&&""!==f||"number"===typeof f?(f=""+f,null!==d&&6===d.tag?(c(a,d.sibling),d=e(d,f),d.return=a,a=d):
(c(a,d),d=gf(f,a.mode,h),d.return=a,a=d),g(a)):c(a,d)}return w}function vb(a){if(a===wc)throw Error(n(174));return a}function jf(a,b){y(xc,b);y(yc,a);y(Ea,wc);a=b.nodeType;switch(a){case 9:case 11:b=(b=b.documentElement)?b.namespaceURI:oe(null,"");break;default:a=8===a?b.parentNode:b,b=a.namespaceURI||null,a=a.tagName,b=oe(b,a)}w(Ea);y(Ea,b)}function Tb(a){w(Ea);w(yc);w(xc)}function Mh(a){vb(xc.current);var b=vb(Ea.current);var c=oe(b,a.type);b!==c&&(y(yc,a),y(Ea,c))}function kf(a){yc.current===a&&
(w(Ea),w(yc))}function yd(a){for(var b=a;null!==b;){if(13===b.tag){var c=b.memoizedState;if(null!==c&&(c=c.dehydrated,null===c||"$?"===c.data||"$!"===c.data))return b}else if(19===b.tag&&void 0!==b.memoizedProps.revealOrder){if(0!==(b.flags&128))return b}else if(null!==b.child){b.child.return=b;b=b.child;continue}if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return null;b=b.return}b.sibling.return=b.return;b=b.sibling}return null}function lf(){for(var a=0;a<mf.length;a++)mf[a]._workInProgressVersionPrimary=
null;mf.length=0}function V(){throw Error(n(321));}function nf(a,b){if(null===b)return!1;for(var c=0;c<b.length&&c<a.length;c++)if(!ua(a[c],b[c]))return!1;return!0}function of(a,b,c,d,e,f){wb=f;C=b;b.memoizedState=null;b.updateQueue=null;b.lanes=0;zd.current=null===a||null===a.memoizedState?mk:nk;a=c(d,e);if(zc){f=0;do{zc=!1;Ac=0;if(25<=f)throw Error(n(301));f+=1;N=K=null;b.updateQueue=null;zd.current=ok;a=c(d,e)}while(zc)}zd.current=Ad;b=null!==K&&null!==K.next;wb=0;N=K=C=null;Bd=!1;if(b)throw Error(n(300));
return a}function pf(){var a=0!==Ac;Ac=0;return a}function Fa(){var a={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};null===N?C.memoizedState=N=a:N=N.next=a;return N}function sa(){if(null===K){var a=C.alternate;a=null!==a?a.memoizedState:null}else a=K.next;var b=null===N?C.memoizedState:N.next;if(null!==b)N=b,K=a;else{if(null===a)throw Error(n(310));K=a;a={memoizedState:K.memoizedState,baseState:K.baseState,baseQueue:K.baseQueue,queue:K.queue,next:null};null===N?C.memoizedState=
N=a:N=N.next=a}return N}function Bc(a,b){return"function"===typeof b?b(a):b}function qf(a,b,c){b=sa();c=b.queue;if(null===c)throw Error(n(311));c.lastRenderedReducer=a;var d=K,e=d.baseQueue,f=c.pending;if(null!==f){if(null!==e){var g=e.next;e.next=f.next;f.next=g}d.baseQueue=e=f;c.pending=null}if(null!==e){f=e.next;d=d.baseState;var h=g=null,k=null,m=f;do{var l=m.lane;if((wb&l)===l)null!==k&&(k=k.next={lane:0,action:m.action,hasEagerState:m.hasEagerState,eagerState:m.eagerState,next:null}),d=m.hasEagerState?
m.eagerState:a(d,m.action);else{var u={lane:l,action:m.action,hasEagerState:m.hasEagerState,eagerState:m.eagerState,next:null};null===k?(h=k=u,g=d):k=k.next=u;C.lanes|=l;ra|=l}m=m.next}while(null!==m&&m!==f);null===k?g=d:k.next=h;ua(d,b.memoizedState)||(ha=!0);b.memoizedState=d;b.baseState=g;b.baseQueue=k;c.lastRenderedState=d}a=c.interleaved;if(null!==a){e=a;do f=e.lane,C.lanes|=f,ra|=f,e=e.next;while(e!==a)}else null===e&&(c.lanes=0);return[b.memoizedState,c.dispatch]}function rf(a,b,c){b=sa();
c=b.queue;if(null===c)throw Error(n(311));c.lastRenderedReducer=a;var d=c.dispatch,e=c.pending,f=b.memoizedState;if(null!==e){c.pending=null;var g=e=e.next;do f=a(f,g.action),g=g.next;while(g!==e);ua(f,b.memoizedState)||(ha=!0);b.memoizedState=f;null===b.baseQueue&&(b.baseState=f);c.lastRenderedState=f}return[f,d]}function Nh(a,b,c){}function Oh(a,b,c){c=C;var d=sa(),e=b(),f=!ua(d.memoizedState,e);f&&(d.memoizedState=e,ha=!0);d=d.queue;sf(Ph.bind(null,c,d,a),[a]);if(d.getSnapshot!==b||f||null!==N&&
N.memoizedState.tag&1){c.flags|=2048;Cc(9,Qh.bind(null,c,d,e,b),void 0,null);if(null===O)throw Error(n(349));0!==(wb&30)||Rh(c,b,e)}return e}function Rh(a,b,c){a.flags|=16384;a={getSnapshot:b,value:c};b=C.updateQueue;null===b?(b={lastEffect:null,stores:null},C.updateQueue=b,b.stores=[a]):(c=b.stores,null===c?b.stores=[a]:c.push(a))}function Qh(a,b,c,d){b.value=c;b.getSnapshot=d;Sh(b)&&Th(a)}function Ph(a,b,c){return c(function(){Sh(b)&&Th(a)})}function Sh(a){var b=a.getSnapshot;a=a.value;try{var c=
b();return!ua(a,c)}catch(d){return!0}}function Th(a){var b=Oa(a,1);null!==b&&ya(b,a,1,-1)}function Uh(a){var b=Fa();"function"===typeof a&&(a=a());b.memoizedState=b.baseState=a;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Bc,lastRenderedState:a};b.queue=a;a=a.dispatch=pk.bind(null,C,a);return[b.memoizedState,a]}function Cc(a,b,c,d){a={tag:a,create:b,destroy:c,deps:d,next:null};b=C.updateQueue;null===b?(b={lastEffect:null,stores:null},C.updateQueue=b,b.lastEffect=a.next=
a):(c=b.lastEffect,null===c?b.lastEffect=a.next=a:(d=c.next,c.next=a,a.next=d,b.lastEffect=a));return a}function Vh(a){return sa().memoizedState}function Cd(a,b,c,d){var e=Fa();C.flags|=a;e.memoizedState=Cc(1|b,c,void 0,void 0===d?null:d)}function Dd(a,b,c,d){var e=sa();d=void 0===d?null:d;var f=void 0;if(null!==K){var g=K.memoizedState;f=g.destroy;if(null!==d&&nf(d,g.deps)){e.memoizedState=Cc(b,c,f,d);return}}C.flags|=a;e.memoizedState=Cc(1|b,c,f,d)}function Wh(a,b){return Cd(8390656,8,a,b)}function sf(a,
b){return Dd(2048,8,a,b)}function Xh(a,b){return Dd(4,2,a,b)}function Yh(a,b){return Dd(4,4,a,b)}function Zh(a,b){if("function"===typeof b)return a=a(),b(a),function(){b(null)};if(null!==b&&void 0!==b)return a=a(),b.current=a,function(){b.current=null}}function $h(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return Dd(4,4,Zh.bind(null,b,a),c)}function tf(a,b){}function ai(a,b){var c=sa();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&nf(b,d[1]))return d[0];c.memoizedState=[a,
b];return a}function bi(a,b){var c=sa();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&nf(b,d[1]))return d[0];a=a();c.memoizedState=[a,b];return a}function ci(a,b,c){if(0===(wb&21))return a.baseState&&(a.baseState=!1,ha=!0),a.memoizedState=c;ua(c,b)||(c=Dg(),C.lanes|=c,ra|=c,a.baseState=!0);return b}function qk(a,b,c){c=z;z=0!==c&&4>c?c:4;a(!0);var d=uf.transition;uf.transition={};try{a(!1),b()}finally{z=c,uf.transition=d}}function di(){return sa().memoizedState}function rk(a,b,
c){var d=hb(a);c={lane:d,action:c,hasEagerState:!1,eagerState:null,next:null};if(ei(a))fi(b,c);else if(c=Ch(a,b,c,d),null!==c){var e=Z();ya(c,a,d,e);gi(c,b,d)}}function pk(a,b,c){var d=hb(a),e={lane:d,action:c,hasEagerState:!1,eagerState:null,next:null};if(ei(a))fi(b,e);else{var f=a.alternate;if(0===a.lanes&&(null===f||0===f.lanes)&&(f=b.lastRenderedReducer,null!==f))try{var g=b.lastRenderedState,h=f(g,c);e.hasEagerState=!0;e.eagerState=h;if(ua(h,g)){var k=b.interleaved;null===k?(e.next=e,cf(b)):
(e.next=k.next,k.next=e);b.interleaved=e;return}}catch(m){}finally{}c=Ch(a,b,e,d);null!==c&&(e=Z(),ya(c,a,d,e),gi(c,b,d))}}function ei(a){var b=a.alternate;return a===C||null!==b&&b===C}function fi(a,b){zc=Bd=!0;var c=a.pending;null===c?b.next=b:(b.next=c.next,c.next=b);a.pending=b}function gi(a,b,c){if(0!==(c&4194240)){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;xe(a,c)}}function Ub(a,b){try{var c="",d=b;do c+=gj(d),d=d.return;while(d);var e=c}catch(f){e="\nError generating stack: "+f.message+
"\n"+f.stack}return{value:a,source:b,stack:e,digest:null}}function vf(a,b,c){return{value:a,source:null,stack:null!=c?c:null,digest:null!=b?b:null}}function wf(a,b){try{console.error(b.value)}catch(c){setTimeout(function(){throw c;})}}function hi(a,b,c){c=Pa(-1,c);c.tag=3;c.payload={element:null};var d=b.value;c.callback=function(){Ed||(Ed=!0,xf=d);wf(a,b)};return c}function ii(a,b,c){c=Pa(-1,c);c.tag=3;var d=a.type.getDerivedStateFromError;if("function"===typeof d){var e=b.value;c.payload=function(){return d(e)};
c.callback=function(){wf(a,b)}}var f=a.stateNode;null!==f&&"function"===typeof f.componentDidCatch&&(c.callback=function(){wf(a,b);"function"!==typeof d&&(null===ib?ib=new Set([this]):ib.add(this));var c=b.stack;this.componentDidCatch(b.value,{componentStack:null!==c?c:""})});return c}function ji(a,b,c){var d=a.pingCache;if(null===d){d=a.pingCache=new sk;var e=new Set;d.set(b,e)}else e=d.get(b),void 0===e&&(e=new Set,d.set(b,e));e.has(c)||(e.add(c),a=tk.bind(null,a,b,c),b.then(a,a))}function ki(a){do{var b;
if(b=13===a.tag)b=a.memoizedState,b=null!==b?null!==b.dehydrated?!0:!1:!0;if(b)return a;a=a.return}while(null!==a);return null}function li(a,b,c,d,e){if(0===(a.mode&1))return a===b?a.flags|=65536:(a.flags|=128,c.flags|=131072,c.flags&=-52805,1===c.tag&&(null===c.alternate?c.tag=17:(b=Pa(-1,1),b.tag=2,eb(c,b,1))),c.lanes|=1),a;a.flags|=65536;a.lanes=e;return a}function aa(a,b,c,d){b.child=null===a?mi(b,null,c,d):Vb(b,a.child,c,d)}function ni(a,b,c,d,e){c=c.render;var f=b.ref;Sb(b,e);d=of(a,b,c,d,f,
e);c=pf();if(null!==a&&!ha)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Qa(a,b,e);D&&c&&Ue(b);b.flags|=1;aa(a,b,d,e);return b.child}function oi(a,b,c,d,e){if(null===a){var f=c.type;if("function"===typeof f&&!yf(f)&&void 0===f.defaultProps&&null===c.compare&&void 0===c.defaultProps)return b.tag=15,b.type=f,pi(a,b,f,d,e);a=wd(c.type,null,d,b,b.mode,e);a.ref=b.ref;a.return=b;return b.child=a}f=a.child;if(0===(a.lanes&e)){var g=f.memoizedProps;c=c.compare;c=null!==c?c:qc;if(c(g,d)&&a.ref===
b.ref)return Qa(a,b,e)}b.flags|=1;a=gb(f,d);a.ref=b.ref;a.return=b;return b.child=a}function pi(a,b,c,d,e){if(null!==a){var f=a.memoizedProps;if(qc(f,d)&&a.ref===b.ref)if(ha=!1,b.pendingProps=d=f,0!==(a.lanes&e))0!==(a.flags&131072)&&(ha=!0);else return b.lanes=a.lanes,Qa(a,b,e)}return zf(a,b,c,d,e)}function qi(a,b,c){var d=b.pendingProps,e=d.children,f=null!==a?a.memoizedState:null;if("hidden"===d.mode)if(0===(b.mode&1))b.memoizedState={baseLanes:0,cachePool:null,transitions:null},y(Ga,ba),ba|=c;
else{if(0===(c&1073741824))return a=null!==f?f.baseLanes|c:c,b.lanes=b.childLanes=1073741824,b.memoizedState={baseLanes:a,cachePool:null,transitions:null},b.updateQueue=null,y(Ga,ba),ba|=a,null;b.memoizedState={baseLanes:0,cachePool:null,transitions:null};d=null!==f?f.baseLanes:c;y(Ga,ba);ba|=d}else null!==f?(d=f.baseLanes|c,b.memoizedState=null):d=c,y(Ga,ba),ba|=d;aa(a,b,e,c);return b.child}function ri(a,b){var c=b.ref;if(null===a&&null!==c||null!==a&&a.ref!==c)b.flags|=512,b.flags|=2097152}function zf(a,
b,c,d,e){var f=ea(c)?qb:J.current;f=Nb(b,f);Sb(b,e);c=of(a,b,c,d,f,e);d=pf();if(null!==a&&!ha)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Qa(a,b,e);D&&d&&Ue(b);b.flags|=1;aa(a,b,c,e);return b.child}function si(a,b,c,d,e){if(ea(c)){var f=!0;ld(b)}else f=!1;Sb(b,e);if(null===b.stateNode)Fd(a,b),Hh(b,c,d),ff(b,c,d,e),d=!0;else if(null===a){var g=b.stateNode,h=b.memoizedProps;g.props=h;var k=g.context,m=c.contextType;"object"===typeof m&&null!==m?m=qa(m):(m=ea(c)?qb:J.current,m=Nb(b,
m));var l=c.getDerivedStateFromProps,n="function"===typeof l||"function"===typeof g.getSnapshotBeforeUpdate;n||"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||(h!==d||k!==m)&&Ih(b,g,d,m);fb=!1;var r=b.memoizedState;g.state=r;td(b,d,g,e);k=b.memoizedState;h!==d||r!==k||S.current||fb?("function"===typeof l&&(ef(b,c,l,d),k=b.memoizedState),(h=fb||Gh(b,c,h,d,r,k,m))?(n||"function"!==typeof g.UNSAFE_componentWillMount&&"function"!==typeof g.componentWillMount||
("function"===typeof g.componentWillMount&&g.componentWillMount(),"function"===typeof g.UNSAFE_componentWillMount&&g.UNSAFE_componentWillMount()),"function"===typeof g.componentDidMount&&(b.flags|=4194308)):("function"===typeof g.componentDidMount&&(b.flags|=4194308),b.memoizedProps=d,b.memoizedState=k),g.props=d,g.state=k,g.context=m,d=h):("function"===typeof g.componentDidMount&&(b.flags|=4194308),d=!1)}else{g=b.stateNode;Dh(a,b);h=b.memoizedProps;m=b.type===b.elementType?h:xa(b.type,h);g.props=
m;n=b.pendingProps;r=g.context;k=c.contextType;"object"===typeof k&&null!==k?k=qa(k):(k=ea(c)?qb:J.current,k=Nb(b,k));var p=c.getDerivedStateFromProps;(l="function"===typeof p||"function"===typeof g.getSnapshotBeforeUpdate)||"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||(h!==n||r!==k)&&Ih(b,g,d,k);fb=!1;r=b.memoizedState;g.state=r;td(b,d,g,e);var x=b.memoizedState;h!==n||r!==x||S.current||fb?("function"===typeof p&&(ef(b,c,p,d),x=b.memoizedState),
(m=fb||Gh(b,c,m,d,r,x,k)||!1)?(l||"function"!==typeof g.UNSAFE_componentWillUpdate&&"function"!==typeof g.componentWillUpdate||("function"===typeof g.componentWillUpdate&&g.componentWillUpdate(d,x,k),"function"===typeof g.UNSAFE_componentWillUpdate&&g.UNSAFE_componentWillUpdate(d,x,k)),"function"===typeof g.componentDidUpdate&&(b.flags|=4),"function"===typeof g.getSnapshotBeforeUpdate&&(b.flags|=1024)):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=
4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),b.memoizedProps=d,b.memoizedState=x),g.props=d,g.state=x,g.context=k,d=m):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),d=!1)}return Af(a,b,c,d,f,e)}function Af(a,b,c,d,e,f){ri(a,b);var g=0!==(b.flags&128);if(!d&&!g)return e&&vh(b,c,!1),
Qa(a,b,f);d=b.stateNode;uk.current=b;var h=g&&"function"!==typeof c.getDerivedStateFromError?null:d.render();b.flags|=1;null!==a&&g?(b.child=Vb(b,a.child,null,f),b.child=Vb(b,null,h,f)):aa(a,b,h,f);b.memoizedState=d.state;e&&vh(b,c,!0);return b.child}function ti(a){var b=a.stateNode;b.pendingContext?th(a,b.pendingContext,b.pendingContext!==b.context):b.context&&th(a,b.context,!1);jf(a,b.containerInfo)}function ui(a,b,c,d,e){Qb();Ye(e);b.flags|=256;aa(a,b,c,d);return b.child}function Bf(a){return{baseLanes:a,
cachePool:null,transitions:null}}function vi(a,b,c){var d=b.pendingProps,e=G.current,f=!1,g=0!==(b.flags&128),h;(h=g)||(h=null!==a&&null===a.memoizedState?!1:0!==(e&2));if(h)f=!0,b.flags&=-129;else if(null===a||null!==a.memoizedState)e|=1;y(G,e&1);if(null===a){Xe(b);a=b.memoizedState;if(null!==a&&(a=a.dehydrated,null!==a))return 0===(b.mode&1)?b.lanes=1:"$!"===a.data?b.lanes=8:b.lanes=1073741824,null;g=d.children;a=d.fallback;return f?(d=b.mode,f=b.child,g={mode:"hidden",children:g},0===(d&1)&&null!==
f?(f.childLanes=0,f.pendingProps=g):f=Gd(g,d,0,null),a=ub(a,d,c,null),f.return=b,a.return=b,f.sibling=a,b.child=f,b.child.memoizedState=Bf(c),b.memoizedState=Cf,a):Df(b,g)}e=a.memoizedState;if(null!==e&&(h=e.dehydrated,null!==h))return vk(a,b,g,d,h,e,c);if(f){f=d.fallback;g=b.mode;e=a.child;h=e.sibling;var k={mode:"hidden",children:d.children};0===(g&1)&&b.child!==e?(d=b.child,d.childLanes=0,d.pendingProps=k,b.deletions=null):(d=gb(e,k),d.subtreeFlags=e.subtreeFlags&14680064);null!==h?f=gb(h,f):(f=
ub(f,g,c,null),f.flags|=2);f.return=b;d.return=b;d.sibling=f;b.child=d;d=f;f=b.child;g=a.child.memoizedState;g=null===g?Bf(c):{baseLanes:g.baseLanes|c,cachePool:null,transitions:g.transitions};f.memoizedState=g;f.childLanes=a.childLanes&~c;b.memoizedState=Cf;return d}f=a.child;a=f.sibling;d=gb(f,{mode:"visible",children:d.children});0===(b.mode&1)&&(d.lanes=c);d.return=b;d.sibling=null;null!==a&&(c=b.deletions,null===c?(b.deletions=[a],b.flags|=16):c.push(a));b.child=d;b.memoizedState=null;return d}
function Df(a,b,c){b=Gd({mode:"visible",children:b},a.mode,0,null);b.return=a;return a.child=b}function Hd(a,b,c,d){null!==d&&Ye(d);Vb(b,a.child,null,c);a=Df(b,b.pendingProps.children);a.flags|=2;b.memoizedState=null;return a}function vk(a,b,c,d,e,f,g){if(c){if(b.flags&256)return b.flags&=-257,d=vf(Error(n(422))),Hd(a,b,g,d);if(null!==b.memoizedState)return b.child=a.child,b.flags|=128,null;f=d.fallback;e=b.mode;d=Gd({mode:"visible",children:d.children},e,0,null);f=ub(f,e,g,null);f.flags|=2;d.return=
b;f.return=b;d.sibling=f;b.child=d;0!==(b.mode&1)&&Vb(b,a.child,null,g);b.child.memoizedState=Bf(g);b.memoizedState=Cf;return f}if(0===(b.mode&1))return Hd(a,b,g,null);if("$!"===e.data){d=e.nextSibling&&e.nextSibling.dataset;if(d)var h=d.dgst;d=h;f=Error(n(419));d=vf(f,d,void 0);return Hd(a,b,g,d)}h=0!==(g&a.childLanes);if(ha||h){d=O;if(null!==d){switch(g&-g){case 4:e=2;break;case 16:e=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:e=
32;break;case 536870912:e=268435456;break;default:e=0}e=0!==(e&(d.suspendedLanes|g))?0:e;0!==e&&e!==f.retryLane&&(f.retryLane=e,Oa(a,e),ya(d,a,e,-1))}Ef();d=vf(Error(n(421)));return Hd(a,b,g,d)}if("$?"===e.data)return b.flags|=128,b.child=a.child,b=wk.bind(null,a),e._reactRetry=b,null;a=f.treeContext;fa=Ka(e.nextSibling);la=b;D=!0;wa=null;null!==a&&(na[oa++]=Ma,na[oa++]=Na,na[oa++]=sb,Ma=a.id,Na=a.overflow,sb=b);b=Df(b,d.children);b.flags|=4096;return b}function wi(a,b,c){a.lanes|=b;var d=a.alternate;
null!==d&&(d.lanes|=b);bf(a.return,b,c)}function Ff(a,b,c,d,e){var f=a.memoizedState;null===f?a.memoizedState={isBackwards:b,rendering:null,renderingStartTime:0,last:d,tail:c,tailMode:e}:(f.isBackwards=b,f.rendering=null,f.renderingStartTime=0,f.last=d,f.tail=c,f.tailMode=e)}function xi(a,b,c){var d=b.pendingProps,e=d.revealOrder,f=d.tail;aa(a,b,d.children,c);d=G.current;if(0!==(d&2))d=d&1|2,b.flags|=128;else{if(null!==a&&0!==(a.flags&128))a:for(a=b.child;null!==a;){if(13===a.tag)null!==a.memoizedState&&
wi(a,c,b);else if(19===a.tag)wi(a,c,b);else if(null!==a.child){a.child.return=a;a=a.child;continue}if(a===b)break a;for(;null===a.sibling;){if(null===a.return||a.return===b)break a;a=a.return}a.sibling.return=a.return;a=a.sibling}d&=1}y(G,d);if(0===(b.mode&1))b.memoizedState=null;else switch(e){case "forwards":c=b.child;for(e=null;null!==c;)a=c.alternate,null!==a&&null===yd(a)&&(e=c),c=c.sibling;c=e;null===c?(e=b.child,b.child=null):(e=c.sibling,c.sibling=null);Ff(b,!1,e,c,f);break;case "backwards":c=
null;e=b.child;for(b.child=null;null!==e;){a=e.alternate;if(null!==a&&null===yd(a)){b.child=e;break}a=e.sibling;e.sibling=c;c=e;e=a}Ff(b,!0,c,null,f);break;case "together":Ff(b,!1,null,null,void 0);break;default:b.memoizedState=null}return b.child}function Fd(a,b){0===(b.mode&1)&&null!==a&&(a.alternate=null,b.alternate=null,b.flags|=2)}function Qa(a,b,c){null!==a&&(b.dependencies=a.dependencies);ra|=b.lanes;if(0===(c&b.childLanes))return null;if(null!==a&&b.child!==a.child)throw Error(n(153));if(null!==
b.child){a=b.child;c=gb(a,a.pendingProps);b.child=c;for(c.return=b;null!==a.sibling;)a=a.sibling,c=c.sibling=gb(a,a.pendingProps),c.return=b;c.sibling=null}return b.child}function xk(a,b,c){switch(b.tag){case 3:ti(b);Qb();break;case 5:Mh(b);break;case 1:ea(b.type)&&ld(b);break;case 4:jf(b,b.stateNode.containerInfo);break;case 10:var d=b.type._context,e=b.memoizedProps.value;y(rd,d._currentValue);d._currentValue=e;break;case 13:d=b.memoizedState;if(null!==d){if(null!==d.dehydrated)return y(G,G.current&
1),b.flags|=128,null;if(0!==(c&b.child.childLanes))return vi(a,b,c);y(G,G.current&1);a=Qa(a,b,c);return null!==a?a.sibling:null}y(G,G.current&1);break;case 19:d=0!==(c&b.childLanes);if(0!==(a.flags&128)){if(d)return xi(a,b,c);b.flags|=128}e=b.memoizedState;null!==e&&(e.rendering=null,e.tail=null,e.lastEffect=null);y(G,G.current);if(d)break;else return null;case 22:case 23:return b.lanes=0,qi(a,b,c)}return Qa(a,b,c)}function Dc(a,b){if(!D)switch(a.tailMode){case "hidden":b=a.tail;for(var c=null;null!==
b;)null!==b.alternate&&(c=b),b=b.sibling;null===c?a.tail=null:c.sibling=null;break;case "collapsed":c=a.tail;for(var d=null;null!==c;)null!==c.alternate&&(d=c),c=c.sibling;null===d?b||null===a.tail?a.tail=null:a.tail.sibling=null:d.sibling=null}}function W(a){var b=null!==a.alternate&&a.alternate.child===a.child,c=0,d=0;if(b)for(var e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags&14680064,d|=e.flags&14680064,e.return=a,e=e.sibling;else for(e=a.child;null!==e;)c|=e.lanes|e.childLanes,
d|=e.subtreeFlags,d|=e.flags,e.return=a,e=e.sibling;a.subtreeFlags|=d;a.childLanes=c;return b}function yk(a,b,c){var d=b.pendingProps;Ve(b);switch(b.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return W(b),null;case 1:return ea(b.type)&&(w(S),w(J)),W(b),null;case 3:d=b.stateNode;Tb();w(S);w(J);lf();d.pendingContext&&(d.context=d.pendingContext,d.pendingContext=null);if(null===a||null===a.child)pd(b)?b.flags|=4:null===a||a.memoizedState.isDehydrated&&0===(b.flags&
256)||(b.flags|=1024,null!==wa&&(Gf(wa),wa=null));yi(a,b);W(b);return null;case 5:kf(b);var e=vb(xc.current);c=b.type;if(null!==a&&null!=b.stateNode)zk(a,b,c,d,e),a.ref!==b.ref&&(b.flags|=512,b.flags|=2097152);else{if(!d){if(null===b.stateNode)throw Error(n(166));W(b);return null}a=vb(Ea.current);if(pd(b)){d=b.stateNode;c=b.type;var f=b.memoizedProps;d[Da]=b;d[uc]=f;a=0!==(b.mode&1);switch(c){case "dialog":B("cancel",d);B("close",d);break;case "iframe":case "object":case "embed":B("load",d);break;
case "video":case "audio":for(e=0;e<Ec.length;e++)B(Ec[e],d);break;case "source":B("error",d);break;case "img":case "image":case "link":B("error",d);B("load",d);break;case "details":B("toggle",d);break;case "input":kg(d,f);B("invalid",d);break;case "select":d._wrapperState={wasMultiple:!!f.multiple};B("invalid",d);break;case "textarea":ng(d,f),B("invalid",d)}pe(c,f);e=null;for(var g in f)if(f.hasOwnProperty(g)){var h=f[g];"children"===g?"string"===typeof h?d.textContent!==h&&(!0!==f.suppressHydrationWarning&&
jd(d.textContent,h,a),e=["children",h]):"number"===typeof h&&d.textContent!==""+h&&(!0!==f.suppressHydrationWarning&&jd(d.textContent,h,a),e=["children",""+h]):$b.hasOwnProperty(g)&&null!=h&&"onScroll"===g&&B("scroll",d)}switch(c){case "input":Pc(d);mg(d,f,!0);break;case "textarea":Pc(d);pg(d);break;case "select":case "option":break;default:"function"===typeof f.onClick&&(d.onclick=kd)}d=e;b.updateQueue=d;null!==d&&(b.flags|=4)}else{g=9===e.nodeType?e:e.ownerDocument;"http://www.w3.org/1999/xhtml"===
a&&(a=qg(c));"http://www.w3.org/1999/xhtml"===a?"script"===c?(a=g.createElement("div"),a.innerHTML="<script>\x3c/script>",a=a.removeChild(a.firstChild)):"string"===typeof d.is?a=g.createElement(c,{is:d.is}):(a=g.createElement(c),"select"===c&&(g=a,d.multiple?g.multiple=!0:d.size&&(g.size=d.size))):a=g.createElementNS(a,c);a[Da]=b;a[uc]=d;Ak(a,b,!1,!1);b.stateNode=a;a:{g=qe(c,d);switch(c){case "dialog":B("cancel",a);B("close",a);e=d;break;case "iframe":case "object":case "embed":B("load",a);e=d;break;
case "video":case "audio":for(e=0;e<Ec.length;e++)B(Ec[e],a);e=d;break;case "source":B("error",a);e=d;break;case "img":case "image":case "link":B("error",a);B("load",a);e=d;break;case "details":B("toggle",a);e=d;break;case "input":kg(a,d);e=ke(a,d);B("invalid",a);break;case "option":e=d;break;case "select":a._wrapperState={wasMultiple:!!d.multiple};e=E({},d,{value:void 0});B("invalid",a);break;case "textarea":ng(a,d);e=ne(a,d);B("invalid",a);break;default:e=d}pe(c,e);h=e;for(f in h)if(h.hasOwnProperty(f)){var k=
h[f];"style"===f?sg(a,k):"dangerouslySetInnerHTML"===f?(k=k?k.__html:void 0,null!=k&&zi(a,k)):"children"===f?"string"===typeof k?("textarea"!==c||""!==k)&&Fc(a,k):"number"===typeof k&&Fc(a,""+k):"suppressContentEditableWarning"!==f&&"suppressHydrationWarning"!==f&&"autoFocus"!==f&&($b.hasOwnProperty(f)?null!=k&&"onScroll"===f&&B("scroll",a):null!=k&&$d(a,f,k,g))}switch(c){case "input":Pc(a);mg(a,d,!1);break;case "textarea":Pc(a);pg(a);break;case "option":null!=d.value&&a.setAttribute("value",""+Ua(d.value));
break;case "select":a.multiple=!!d.multiple;f=d.value;null!=f?Db(a,!!d.multiple,f,!1):null!=d.defaultValue&&Db(a,!!d.multiple,d.defaultValue,!0);break;default:"function"===typeof e.onClick&&(a.onclick=kd)}switch(c){case "button":case "input":case "select":case "textarea":d=!!d.autoFocus;break a;case "img":d=!0;break a;default:d=!1}}d&&(b.flags|=4)}null!==b.ref&&(b.flags|=512,b.flags|=2097152)}W(b);return null;case 6:if(a&&null!=b.stateNode)Bk(a,b,a.memoizedProps,d);else{if("string"!==typeof d&&null===
b.stateNode)throw Error(n(166));c=vb(xc.current);vb(Ea.current);if(pd(b)){d=b.stateNode;c=b.memoizedProps;d[Da]=b;if(f=d.nodeValue!==c)if(a=la,null!==a)switch(a.tag){case 3:jd(d.nodeValue,c,0!==(a.mode&1));break;case 5:!0!==a.memoizedProps.suppressHydrationWarning&&jd(d.nodeValue,c,0!==(a.mode&1))}f&&(b.flags|=4)}else d=(9===c.nodeType?c:c.ownerDocument).createTextNode(d),d[Da]=b,b.stateNode=d}W(b);return null;case 13:w(G);d=b.memoizedState;if(null===a||null!==a.memoizedState&&null!==a.memoizedState.dehydrated){if(D&&
null!==fa&&0!==(b.mode&1)&&0===(b.flags&128)){for(f=fa;f;)f=Ka(f.nextSibling);Qb();b.flags|=98560;f=!1}else if(f=pd(b),null!==d&&null!==d.dehydrated){if(null===a){if(!f)throw Error(n(318));f=b.memoizedState;f=null!==f?f.dehydrated:null;if(!f)throw Error(n(317));f[Da]=b}else Qb(),0===(b.flags&128)&&(b.memoizedState=null),b.flags|=4;W(b);f=!1}else null!==wa&&(Gf(wa),wa=null),f=!0;if(!f)return b.flags&65536?b:null}if(0!==(b.flags&128))return b.lanes=c,b;d=null!==d;d!==(null!==a&&null!==a.memoizedState)&&
d&&(b.child.flags|=8192,0!==(b.mode&1)&&(null===a||0!==(G.current&1)?0===L&&(L=3):Ef()));null!==b.updateQueue&&(b.flags|=4);W(b);return null;case 4:return Tb(),yi(a,b),null===a&&sc(b.stateNode.containerInfo),W(b),null;case 10:return af(b.type._context),W(b),null;case 17:return ea(b.type)&&(w(S),w(J)),W(b),null;case 19:w(G);f=b.memoizedState;if(null===f)return W(b),null;d=0!==(b.flags&128);g=f.rendering;if(null===g)if(d)Dc(f,!1);else{if(0!==L||null!==a&&0!==(a.flags&128))for(a=b.child;null!==a;){g=
yd(a);if(null!==g){b.flags|=128;Dc(f,!1);d=g.updateQueue;null!==d&&(b.updateQueue=d,b.flags|=4);b.subtreeFlags=0;d=c;for(c=b.child;null!==c;)f=c,a=d,f.flags&=14680066,g=f.alternate,null===g?(f.childLanes=0,f.lanes=a,f.child=null,f.subtreeFlags=0,f.memoizedProps=null,f.memoizedState=null,f.updateQueue=null,f.dependencies=null,f.stateNode=null):(f.childLanes=g.childLanes,f.lanes=g.lanes,f.child=g.child,f.subtreeFlags=0,f.deletions=null,f.memoizedProps=g.memoizedProps,f.memoizedState=g.memoizedState,
f.updateQueue=g.updateQueue,f.type=g.type,a=g.dependencies,f.dependencies=null===a?null:{lanes:a.lanes,firstContext:a.firstContext}),c=c.sibling;y(G,G.current&1|2);return b.child}a=a.sibling}null!==f.tail&&P()>Hf&&(b.flags|=128,d=!0,Dc(f,!1),b.lanes=4194304)}else{if(!d)if(a=yd(g),null!==a){if(b.flags|=128,d=!0,c=a.updateQueue,null!==c&&(b.updateQueue=c,b.flags|=4),Dc(f,!0),null===f.tail&&"hidden"===f.tailMode&&!g.alternate&&!D)return W(b),null}else 2*P()-f.renderingStartTime>Hf&&1073741824!==c&&(b.flags|=
128,d=!0,Dc(f,!1),b.lanes=4194304);f.isBackwards?(g.sibling=b.child,b.child=g):(c=f.last,null!==c?c.sibling=g:b.child=g,f.last=g)}if(null!==f.tail)return b=f.tail,f.rendering=b,f.tail=b.sibling,f.renderingStartTime=P(),b.sibling=null,c=G.current,y(G,d?c&1|2:c&1),b;W(b);return null;case 22:case 23:return ba=Ga.current,w(Ga),d=null!==b.memoizedState,null!==a&&null!==a.memoizedState!==d&&(b.flags|=8192),d&&0!==(b.mode&1)?0!==(ba&1073741824)&&(W(b),b.subtreeFlags&6&&(b.flags|=8192)):W(b),null;case 24:return null;
case 25:return null}throw Error(n(156,b.tag));}function Ck(a,b,c){Ve(b);switch(b.tag){case 1:return ea(b.type)&&(w(S),w(J)),a=b.flags,a&65536?(b.flags=a&-65537|128,b):null;case 3:return Tb(),w(S),w(J),lf(),a=b.flags,0!==(a&65536)&&0===(a&128)?(b.flags=a&-65537|128,b):null;case 5:return kf(b),null;case 13:w(G);a=b.memoizedState;if(null!==a&&null!==a.dehydrated){if(null===b.alternate)throw Error(n(340));Qb()}a=b.flags;return a&65536?(b.flags=a&-65537|128,b):null;case 19:return w(G),null;case 4:return Tb(),
null;case 10:return af(b.type._context),null;case 22:case 23:return ba=Ga.current,w(Ga),null;case 24:return null;default:return null}}function Wb(a,b){var c=a.ref;if(null!==c)if("function"===typeof c)try{c(null)}catch(d){H(a,b,d)}else c.current=null}function If(a,b,c){try{c()}catch(d){H(a,b,d)}}function Dk(a,b){Jf=Zc;a=ch();if(Ie(a)){if("selectionStart"in a)var c={start:a.selectionStart,end:a.selectionEnd};else a:{c=(c=a.ownerDocument)&&c.defaultView||window;var d=c.getSelection&&c.getSelection();
if(d&&0!==d.rangeCount){c=d.anchorNode;var e=d.anchorOffset,f=d.focusNode;d=d.focusOffset;try{c.nodeType,f.nodeType}catch(M){c=null;break a}var g=0,h=-1,k=-1,m=0,t=0,u=a,r=null;b:for(;;){for(var p;;){u!==c||0!==e&&3!==u.nodeType||(h=g+e);u!==f||0!==d&&3!==u.nodeType||(k=g+d);3===u.nodeType&&(g+=u.nodeValue.length);if(null===(p=u.firstChild))break;r=u;u=p}for(;;){if(u===a)break b;r===c&&++m===e&&(h=g);r===f&&++t===d&&(k=g);if(null!==(p=u.nextSibling))break;u=r;r=u.parentNode}u=p}c=-1===h||-1===k?null:
{start:h,end:k}}else c=null}c=c||{start:0,end:0}}else c=null;Kf={focusedElem:a,selectionRange:c};Zc=!1;for(l=b;null!==l;)if(b=l,a=b.child,0!==(b.subtreeFlags&1028)&&null!==a)a.return=b,l=a;else for(;null!==l;){b=l;try{var x=b.alternate;if(0!==(b.flags&1024))switch(b.tag){case 0:case 11:case 15:break;case 1:if(null!==x){var w=x.memoizedProps,z=x.memoizedState,A=b.stateNode,v=A.getSnapshotBeforeUpdate(b.elementType===b.type?w:xa(b.type,w),z);A.__reactInternalSnapshotBeforeUpdate=v}break;case 3:var q=
b.stateNode.containerInfo;1===q.nodeType?q.textContent="":9===q.nodeType&&q.documentElement&&q.removeChild(q.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(n(163));}}catch(M){H(b,b.return,M)}a=b.sibling;if(null!==a){a.return=b.return;l=a;break}l=b.return}x=Ai;Ai=!1;return x}function Gc(a,b,c){var d=b.updateQueue;d=null!==d?d.lastEffect:null;if(null!==d){var e=d=d.next;do{if((e.tag&a)===a){var f=e.destroy;e.destroy=void 0;void 0!==f&&If(b,c,f)}e=e.next}while(e!==d)}}
function Id(a,b){b=b.updateQueue;b=null!==b?b.lastEffect:null;if(null!==b){var c=b=b.next;do{if((c.tag&a)===a){var d=c.create;c.destroy=d()}c=c.next}while(c!==b)}}function Lf(a){var b=a.ref;if(null!==b){var c=a.stateNode;switch(a.tag){case 5:a=c;break;default:a=c}"function"===typeof b?b(a):b.current=a}}function Bi(a){var b=a.alternate;null!==b&&(a.alternate=null,Bi(b));a.child=null;a.deletions=null;a.sibling=null;5===a.tag&&(b=a.stateNode,null!==b&&(delete b[Da],delete b[uc],delete b[Me],delete b[Ek],
delete b[Fk]));a.stateNode=null;a.return=null;a.dependencies=null;a.memoizedProps=null;a.memoizedState=null;a.pendingProps=null;a.stateNode=null;a.updateQueue=null}function Ci(a){return 5===a.tag||3===a.tag||4===a.tag}function Di(a){a:for(;;){for(;null===a.sibling;){if(null===a.return||Ci(a.return))return null;a=a.return}a.sibling.return=a.return;for(a=a.sibling;5!==a.tag&&6!==a.tag&&18!==a.tag;){if(a.flags&2)continue a;if(null===a.child||4===a.tag)continue a;else a.child.return=a,a=a.child}if(!(a.flags&
2))return a.stateNode}}function Mf(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?8===c.nodeType?c.parentNode.insertBefore(a,b):c.insertBefore(a,b):(8===c.nodeType?(b=c.parentNode,b.insertBefore(a,c)):(b=c,b.appendChild(a)),c=c._reactRootContainer,null!==c&&void 0!==c||null!==b.onclick||(b.onclick=kd));else if(4!==d&&(a=a.child,null!==a))for(Mf(a,b,c),a=a.sibling;null!==a;)Mf(a,b,c),a=a.sibling}function Nf(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?c.insertBefore(a,b):c.appendChild(a);
else if(4!==d&&(a=a.child,null!==a))for(Nf(a,b,c),a=a.sibling;null!==a;)Nf(a,b,c),a=a.sibling}function jb(a,b,c){for(c=c.child;null!==c;)Ei(a,b,c),c=c.sibling}function Ei(a,b,c){if(Ca&&"function"===typeof Ca.onCommitFiberUnmount)try{Ca.onCommitFiberUnmount(Uc,c)}catch(h){}switch(c.tag){case 5:X||Wb(c,b);case 6:var d=T,e=za;T=null;jb(a,b,c);T=d;za=e;null!==T&&(za?(a=T,c=c.stateNode,8===a.nodeType?a.parentNode.removeChild(c):a.removeChild(c)):T.removeChild(c.stateNode));break;case 18:null!==T&&(za?
(a=T,c=c.stateNode,8===a.nodeType?Re(a.parentNode,c):1===a.nodeType&&Re(a,c),nc(a)):Re(T,c.stateNode));break;case 4:d=T;e=za;T=c.stateNode.containerInfo;za=!0;jb(a,b,c);T=d;za=e;break;case 0:case 11:case 14:case 15:if(!X&&(d=c.updateQueue,null!==d&&(d=d.lastEffect,null!==d))){e=d=d.next;do{var f=e,g=f.destroy;f=f.tag;void 0!==g&&(0!==(f&2)?If(c,b,g):0!==(f&4)&&If(c,b,g));e=e.next}while(e!==d)}jb(a,b,c);break;case 1:if(!X&&(Wb(c,b),d=c.stateNode,"function"===typeof d.componentWillUnmount))try{d.props=
c.memoizedProps,d.state=c.memoizedState,d.componentWillUnmount()}catch(h){H(c,b,h)}jb(a,b,c);break;case 21:jb(a,b,c);break;case 22:c.mode&1?(X=(d=X)||null!==c.memoizedState,jb(a,b,c),X=d):jb(a,b,c);break;default:jb(a,b,c)}}function Fi(a){var b=a.updateQueue;if(null!==b){a.updateQueue=null;var c=a.stateNode;null===c&&(c=a.stateNode=new Gk);b.forEach(function(b){var d=Hk.bind(null,a,b);c.has(b)||(c.add(b),b.then(d,d))})}}function Aa(a,b,c){c=b.deletions;if(null!==c)for(var d=0;d<c.length;d++){var e=
c[d];try{var f=a,g=b,h=g;a:for(;null!==h;){switch(h.tag){case 5:T=h.stateNode;za=!1;break a;case 3:T=h.stateNode.containerInfo;za=!0;break a;case 4:T=h.stateNode.containerInfo;za=!0;break a}h=h.return}if(null===T)throw Error(n(160));Ei(f,g,e);T=null;za=!1;var k=e.alternate;null!==k&&(k.return=null);e.return=null}catch(m){H(e,b,m)}}if(b.subtreeFlags&12854)for(b=b.child;null!==b;)Gi(b,a),b=b.sibling}function Gi(a,b,c){var d=a.alternate;c=a.flags;switch(a.tag){case 0:case 11:case 14:case 15:Aa(b,a);
Ha(a);if(c&4){try{Gc(3,a,a.return),Id(3,a)}catch(F){H(a,a.return,F)}try{Gc(5,a,a.return)}catch(F){H(a,a.return,F)}}break;case 1:Aa(b,a);Ha(a);c&512&&null!==d&&Wb(d,d.return);break;case 5:Aa(b,a);Ha(a);c&512&&null!==d&&Wb(d,d.return);if(a.flags&32){var e=a.stateNode;try{Fc(e,"")}catch(F){H(a,a.return,F)}}if(c&4&&(e=a.stateNode,null!=e)){var f=a.memoizedProps,g=null!==d?d.memoizedProps:f,h=a.type,k=a.updateQueue;a.updateQueue=null;if(null!==k)try{"input"===h&&"radio"===f.type&&null!=f.name&&lg(e,f);
qe(h,g);var m=qe(h,f);for(g=0;g<k.length;g+=2){var t=k[g],u=k[g+1];"style"===t?sg(e,u):"dangerouslySetInnerHTML"===t?zi(e,u):"children"===t?Fc(e,u):$d(e,t,u,m)}switch(h){case "input":le(e,f);break;case "textarea":og(e,f);break;case "select":var r=e._wrapperState.wasMultiple;e._wrapperState.wasMultiple=!!f.multiple;var p=f.value;null!=p?Db(e,!!f.multiple,p,!1):r!==!!f.multiple&&(null!=f.defaultValue?Db(e,!!f.multiple,f.defaultValue,!0):Db(e,!!f.multiple,f.multiple?[]:"",!1))}e[uc]=f}catch(F){H(a,a.return,
F)}}break;case 6:Aa(b,a);Ha(a);if(c&4){if(null===a.stateNode)throw Error(n(162));e=a.stateNode;f=a.memoizedProps;try{e.nodeValue=f}catch(F){H(a,a.return,F)}}break;case 3:Aa(b,a);Ha(a);if(c&4&&null!==d&&d.memoizedState.isDehydrated)try{nc(b.containerInfo)}catch(F){H(a,a.return,F)}break;case 4:Aa(b,a);Ha(a);break;case 13:Aa(b,a);Ha(a);e=a.child;e.flags&8192&&(f=null!==e.memoizedState,e.stateNode.isHidden=f,!f||null!==e.alternate&&null!==e.alternate.memoizedState||(Of=P()));c&4&&Fi(a);break;case 22:t=
null!==d&&null!==d.memoizedState;a.mode&1?(X=(m=X)||t,Aa(b,a),X=m):Aa(b,a);Ha(a);if(c&8192){m=null!==a.memoizedState;if((a.stateNode.isHidden=m)&&!t&&0!==(a.mode&1))for(l=a,t=a.child;null!==t;){for(u=l=t;null!==l;){r=l;p=r.child;switch(r.tag){case 0:case 11:case 14:case 15:Gc(4,r,r.return);break;case 1:Wb(r,r.return);var x=r.stateNode;if("function"===typeof x.componentWillUnmount){c=r;b=r.return;try{d=c,x.props=d.memoizedProps,x.state=d.memoizedState,x.componentWillUnmount()}catch(F){H(c,b,F)}}break;
case 5:Wb(r,r.return);break;case 22:if(null!==r.memoizedState){Hi(u);continue}}null!==p?(p.return=r,l=p):Hi(u)}t=t.sibling}a:for(t=null,u=a;;){if(5===u.tag){if(null===t){t=u;try{e=u.stateNode,m?(f=e.style,"function"===typeof f.setProperty?f.setProperty("display","none","important"):f.display="none"):(h=u.stateNode,k=u.memoizedProps.style,g=void 0!==k&&null!==k&&k.hasOwnProperty("display")?k.display:null,h.style.display=rg("display",g))}catch(F){H(a,a.return,F)}}}else if(6===u.tag){if(null===t)try{u.stateNode.nodeValue=
m?"":u.memoizedProps}catch(F){H(a,a.return,F)}}else if((22!==u.tag&&23!==u.tag||null===u.memoizedState||u===a)&&null!==u.child){u.child.return=u;u=u.child;continue}if(u===a)break a;for(;null===u.sibling;){if(null===u.return||u.return===a)break a;t===u&&(t=null);u=u.return}t===u&&(t=null);u.sibling.return=u.return;u=u.sibling}}break;case 19:Aa(b,a);Ha(a);c&4&&Fi(a);break;case 21:break;default:Aa(b,a),Ha(a)}}function Ha(a){var b=a.flags;if(b&2){try{a:{for(var c=a.return;null!==c;){if(Ci(c)){var d=c;
break a}c=c.return}throw Error(n(160));}switch(d.tag){case 5:var e=d.stateNode;d.flags&32&&(Fc(e,""),d.flags&=-33);var f=Di(a);Nf(a,f,e);break;case 3:case 4:var g=d.stateNode.containerInfo,h=Di(a);Mf(a,h,g);break;default:throw Error(n(161));}}catch(k){H(a,a.return,k)}a.flags&=-3}b&4096&&(a.flags&=-4097)}function Ik(a,b,c){l=a;Ii(a,b,c)}function Ii(a,b,c){for(var d=0!==(a.mode&1);null!==l;){var e=l,f=e.child;if(22===e.tag&&d){var g=null!==e.memoizedState||Jd;if(!g){var h=e.alternate,k=null!==h&&null!==
h.memoizedState||X;h=Jd;var m=X;Jd=g;if((X=k)&&!m)for(l=e;null!==l;)g=l,k=g.child,22===g.tag&&null!==g.memoizedState?Ji(e):null!==k?(k.return=g,l=k):Ji(e);for(;null!==f;)l=f,Ii(f,b,c),f=f.sibling;l=e;Jd=h;X=m}Ki(a,b,c)}else 0!==(e.subtreeFlags&8772)&&null!==f?(f.return=e,l=f):Ki(a,b,c)}}function Ki(a,b,c){for(;null!==l;){b=l;if(0!==(b.flags&8772)){c=b.alternate;try{if(0!==(b.flags&8772))switch(b.tag){case 0:case 11:case 15:X||Id(5,b);break;case 1:var d=b.stateNode;if(b.flags&4&&!X)if(null===c)d.componentDidMount();
else{var e=b.elementType===b.type?c.memoizedProps:xa(b.type,c.memoizedProps);d.componentDidUpdate(e,c.memoizedState,d.__reactInternalSnapshotBeforeUpdate)}var f=b.updateQueue;null!==f&&Fh(b,f,d);break;case 3:var g=b.updateQueue;if(null!==g){c=null;if(null!==b.child)switch(b.child.tag){case 5:c=b.child.stateNode;break;case 1:c=b.child.stateNode}Fh(b,g,c)}break;case 5:var h=b.stateNode;if(null===c&&b.flags&4){c=h;var k=b.memoizedProps;switch(b.type){case "button":case "input":case "select":case "textarea":k.autoFocus&&
c.focus();break;case "img":k.src&&(c.src=k.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(null===b.memoizedState){var m=b.alternate;if(null!==m){var t=m.memoizedState;if(null!==t){var p=t.dehydrated;null!==p&&nc(p)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(n(163));}X||b.flags&512&&Lf(b)}catch(r){H(b,b.return,r)}}if(b===a){l=null;break}c=b.sibling;if(null!==c){c.return=b.return;l=c;break}l=b.return}}function Hi(a){for(;null!==l;){var b=l;if(b===
a){l=null;break}var c=b.sibling;if(null!==c){c.return=b.return;l=c;break}l=b.return}}function Ji(a){for(;null!==l;){var b=l;try{switch(b.tag){case 0:case 11:case 15:var c=b.return;try{Id(4,b)}catch(k){H(b,c,k)}break;case 1:var d=b.stateNode;if("function"===typeof d.componentDidMount){var e=b.return;try{d.componentDidMount()}catch(k){H(b,e,k)}}var f=b.return;try{Lf(b)}catch(k){H(b,f,k)}break;case 5:var g=b.return;try{Lf(b)}catch(k){H(b,g,k)}}}catch(k){H(b,b.return,k)}if(b===a){l=null;break}var h=b.sibling;
if(null!==h){h.return=b.return;l=h;break}l=b.return}}function Hc(){Hf=P()+500}function Z(){return 0!==(p&6)?P():-1!==Kd?Kd:Kd=P()}function hb(a){if(0===(a.mode&1))return 1;if(0!==(p&2)&&0!==U)return U&-U;if(null!==Jk.transition)return 0===Ld&&(Ld=Dg()),Ld;a=z;if(0!==a)return a;a=window.event;a=void 0===a?16:Lg(a.type);return a}function ya(a,b,c,d){if(50<Ic)throw Ic=0,Pf=null,Error(n(185));ic(a,c,d);if(0===(p&2)||a!==O)a===O&&(0===(p&2)&&(Md|=c),4===L&&kb(a,U)),ia(a,d),1===c&&0===p&&0===(b.mode&1)&&
(Hc(),md&&db())}function ia(a,b){var c=a.callbackNode;uj(a,b);var d=Vc(a,a===O?U:0);if(0===d)null!==c&&Li(c),a.callbackNode=null,a.callbackPriority=0;else if(b=d&-d,a.callbackPriority!==b){null!=c&&Li(c);if(1===b)0===a.tag?kk(Mi.bind(null,a)):wh(Mi.bind(null,a)),Kk(function(){0===(p&6)&&db()}),c=null;else{switch(Eg(d)){case 1:c=De;break;case 4:c=Mg;break;case 16:c=ad;break;case 536870912:c=Ng;break;default:c=ad}c=Ni(c,Oi.bind(null,a))}a.callbackPriority=b;a.callbackNode=c}}function Oi(a,b){Kd=-1;
Ld=0;if(0!==(p&6))throw Error(n(327));var c=a.callbackNode;if(Xb()&&a.callbackNode!==c)return null;var d=Vc(a,a===O?U:0);if(0===d)return null;if(0!==(d&30)||0!==(d&a.expiredLanes)||b)b=Nd(a,d);else{b=d;var e=p;p|=2;var f=Pi();if(O!==a||U!==b)Ra=null,Hc(),xb(a,b);do try{Lk();break}catch(h){Qi(a,h)}while(1);Ze();Od.current=f;p=e;null!==I?b=0:(O=null,U=0,b=L)}if(0!==b){2===b&&(e=ve(a),0!==e&&(d=e,b=Qf(a,e)));if(1===b)throw c=Jc,xb(a,0),kb(a,d),ia(a,P()),c;if(6===b)kb(a,d);else{e=a.current.alternate;
if(0===(d&30)&&!Mk(e)&&(b=Nd(a,d),2===b&&(f=ve(a),0!==f&&(d=f,b=Qf(a,f))),1===b))throw c=Jc,xb(a,0),kb(a,d),ia(a,P()),c;a.finishedWork=e;a.finishedLanes=d;switch(b){case 0:case 1:throw Error(n(345));case 2:yb(a,ja,Ra);break;case 3:kb(a,d);if((d&130023424)===d&&(b=Of+500-P(),10<b)){if(0!==Vc(a,0))break;e=a.suspendedLanes;if((e&d)!==d){Z();a.pingedLanes|=a.suspendedLanes&e;break}a.timeoutHandle=Rf(yb.bind(null,a,ja,Ra),b);break}yb(a,ja,Ra);break;case 4:kb(a,d);if((d&4194240)===d)break;b=a.eventTimes;
for(e=-1;0<d;){var g=31-ta(d);f=1<<g;g=b[g];g>e&&(e=g);d&=~f}d=e;d=P()-d;d=(120>d?120:480>d?480:1080>d?1080:1920>d?1920:3E3>d?3E3:4320>d?4320:1960*Nk(d/1960))-d;if(10<d){a.timeoutHandle=Rf(yb.bind(null,a,ja,Ra),d);break}yb(a,ja,Ra);break;case 5:yb(a,ja,Ra);break;default:throw Error(n(329));}}}ia(a,P());return a.callbackNode===c?Oi.bind(null,a):null}function Qf(a,b){var c=Kc;a.current.memoizedState.isDehydrated&&(xb(a,b).flags|=256);a=Nd(a,b);2!==a&&(b=ja,ja=c,null!==b&&Gf(b));return a}function Gf(a){null===
ja?ja=a:ja.push.apply(ja,a)}function Mk(a){for(var b=a;;){if(b.flags&16384){var c=b.updateQueue;if(null!==c&&(c=c.stores,null!==c))for(var d=0;d<c.length;d++){var e=c[d],f=e.getSnapshot;e=e.value;try{if(!ua(f(),e))return!1}catch(g){return!1}}}c=b.child;if(b.subtreeFlags&16384&&null!==c)c.return=b,b=c;else{if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return!0;b=b.return}b.sibling.return=b.return;b=b.sibling}}return!0}function kb(a,b){b&=~Sf;b&=~Md;a.suspendedLanes|=b;a.pingedLanes&=
~b;for(a=a.expirationTimes;0<b;){var c=31-ta(b),d=1<<c;a[c]=-1;b&=~d}}function Mi(a){if(0!==(p&6))throw Error(n(327));Xb();var b=Vc(a,0);if(0===(b&1))return ia(a,P()),null;var c=Nd(a,b);if(0!==a.tag&&2===c){var d=ve(a);0!==d&&(b=d,c=Qf(a,d))}if(1===c)throw c=Jc,xb(a,0),kb(a,b),ia(a,P()),c;if(6===c)throw Error(n(345));a.finishedWork=a.current.alternate;a.finishedLanes=b;yb(a,ja,Ra);ia(a,P());return null}function Tf(a,b){var c=p;p|=1;try{return a(b)}finally{p=c,0===p&&(Hc(),md&&db())}}function zb(a){null!==
lb&&0===lb.tag&&0===(p&6)&&Xb();var b=p;p|=1;var c=ca.transition,d=z;try{if(ca.transition=null,z=1,a)return a()}finally{z=d,ca.transition=c,p=b,0===(p&6)&&db()}}function xb(a,b){a.finishedWork=null;a.finishedLanes=0;var c=a.timeoutHandle;-1!==c&&(a.timeoutHandle=-1,Ok(c));if(null!==I)for(c=I.return;null!==c;){var d=c;Ve(d);switch(d.tag){case 1:d=d.type.childContextTypes;null!==d&&void 0!==d&&(w(S),w(J));break;case 3:Tb();w(S);w(J);lf();break;case 5:kf(d);break;case 4:Tb();break;case 13:w(G);break;
case 19:w(G);break;case 10:af(d.type._context);break;case 22:case 23:ba=Ga.current,w(Ga)}c=c.return}O=a;I=a=gb(a.current,null);U=ba=b;L=0;Jc=null;Sf=Md=ra=0;ja=Kc=null;if(null!==tb){for(b=0;b<tb.length;b++)if(c=tb[b],d=c.interleaved,null!==d){c.interleaved=null;var e=d.next,f=c.pending;if(null!==f){var g=f.next;f.next=e;d.next=g}c.pending=d}tb=null}return a}function Qi(a,b){do{var c=I;try{Ze();zd.current=Ad;if(Bd){for(var d=C.memoizedState;null!==d;){var e=d.queue;null!==e&&(e.pending=null);d=d.next}Bd=
!1}wb=0;N=K=C=null;zc=!1;Ac=0;Uf.current=null;if(null===c||null===c.return){L=1;Jc=b;I=null;break}a:{var f=a,g=c.return,h=c,k=b;b=U;h.flags|=32768;if(null!==k&&"object"===typeof k&&"function"===typeof k.then){var m=k,l=h,p=l.tag;if(0===(l.mode&1)&&(0===p||11===p||15===p)){var r=l.alternate;r?(l.updateQueue=r.updateQueue,l.memoizedState=r.memoizedState,l.lanes=r.lanes):(l.updateQueue=null,l.memoizedState=null)}var w=ki(g);if(null!==w){w.flags&=-257;li(w,g,h,f,b);w.mode&1&&ji(f,m,b);b=w;k=m;var x=b.updateQueue;
if(null===x){var z=new Set;z.add(k);b.updateQueue=z}else x.add(k);break a}else{if(0===(b&1)){ji(f,m,b);Ef();break a}k=Error(n(426))}}else if(D&&h.mode&1){var y=ki(g);if(null!==y){0===(y.flags&65536)&&(y.flags|=256);li(y,g,h,f,b);Ye(Ub(k,h));break a}}f=k=Ub(k,h);4!==L&&(L=2);null===Kc?Kc=[f]:Kc.push(f);f=g;do{switch(f.tag){case 3:f.flags|=65536;b&=-b;f.lanes|=b;var A=hi(f,k,b);Eh(f,A);break a;case 1:h=k;var v=f.type,q=f.stateNode;if(0===(f.flags&128)&&("function"===typeof v.getDerivedStateFromError||
null!==q&&"function"===typeof q.componentDidCatch&&(null===ib||!ib.has(q)))){f.flags|=65536;b&=-b;f.lanes|=b;var B=ii(f,h,b);Eh(f,B);break a}}f=f.return}while(null!==f)}Ri(c)}catch(ma){b=ma;I===c&&null!==c&&(I=c=c.return);continue}break}while(1)}function Pi(){var a=Od.current;Od.current=Ad;return null===a?Ad:a}function Ef(){if(0===L||3===L||2===L)L=4;null===O||0===(ra&268435455)&&0===(Md&268435455)||kb(O,U)}function Nd(a,b){var c=p;p|=2;var d=Pi();if(O!==a||U!==b)Ra=null,xb(a,b);do try{Pk();break}catch(e){Qi(a,
e)}while(1);Ze();p=c;Od.current=d;if(null!==I)throw Error(n(261));O=null;U=0;return L}function Pk(){for(;null!==I;)Si(I)}function Lk(){for(;null!==I&&!Qk();)Si(I)}function Si(a){var b=Rk(a.alternate,a,ba);a.memoizedProps=a.pendingProps;null===b?Ri(a):I=b;Uf.current=null}function Ri(a){var b=a;do{var c=b.alternate;a=b.return;if(0===(b.flags&32768)){if(c=yk(c,b,ba),null!==c){I=c;return}}else{c=Ck(c,b);if(null!==c){c.flags&=32767;I=c;return}if(null!==a)a.flags|=32768,a.subtreeFlags=0,a.deletions=null;
else{L=6;I=null;return}}b=b.sibling;if(null!==b){I=b;return}I=b=a}while(null!==b);0===L&&(L=5)}function yb(a,b,c){var d=z,e=ca.transition;try{ca.transition=null,z=1,Sk(a,b,c,d)}finally{ca.transition=e,z=d}return null}function Sk(a,b,c,d){do Xb();while(null!==lb);if(0!==(p&6))throw Error(n(327));c=a.finishedWork;var e=a.finishedLanes;if(null===c)return null;a.finishedWork=null;a.finishedLanes=0;if(c===a.current)throw Error(n(177));a.callbackNode=null;a.callbackPriority=0;var f=c.lanes|c.childLanes;
vj(a,f);a===O&&(I=O=null,U=0);0===(c.subtreeFlags&2064)&&0===(c.flags&2064)||Pd||(Pd=!0,Ni(ad,function(){Xb();return null}));f=0!==(c.flags&15990);if(0!==(c.subtreeFlags&15990)||f){f=ca.transition;ca.transition=null;var g=z;z=1;var h=p;p|=4;Uf.current=null;Dk(a,c);Gi(c,a);Uj(Kf);Zc=!!Jf;Kf=Jf=null;a.current=c;Ik(c,a,e);Tk();p=h;z=g;ca.transition=f}else a.current=c;Pd&&(Pd=!1,lb=a,Qd=e);f=a.pendingLanes;0===f&&(ib=null);pj(c.stateNode,d);ia(a,P());if(null!==b)for(d=a.onRecoverableError,c=0;c<b.length;c++)e=
b[c],d(e.value,{componentStack:e.stack,digest:e.digest});if(Ed)throw Ed=!1,a=xf,xf=null,a;0!==(Qd&1)&&0!==a.tag&&Xb();f=a.pendingLanes;0!==(f&1)?a===Pf?Ic++:(Ic=0,Pf=a):Ic=0;db();return null}function Xb(){if(null!==lb){var a=Eg(Qd),b=ca.transition,c=z;try{ca.transition=null;z=16>a?16:a;if(null===lb)var d=!1;else{a=lb;lb=null;Qd=0;if(0!==(p&6))throw Error(n(331));var e=p;p|=4;for(l=a.current;null!==l;){var f=l,g=f.child;if(0!==(l.flags&16)){var h=f.deletions;if(null!==h){for(var k=0;k<h.length;k++){var m=
h[k];for(l=m;null!==l;){var t=l;switch(t.tag){case 0:case 11:case 15:Gc(8,t,f)}var u=t.child;if(null!==u)u.return=t,l=u;else for(;null!==l;){t=l;var r=t.sibling,w=t.return;Bi(t);if(t===m){l=null;break}if(null!==r){r.return=w;l=r;break}l=w}}}var x=f.alternate;if(null!==x){var y=x.child;if(null!==y){x.child=null;do{var C=y.sibling;y.sibling=null;y=C}while(null!==y)}}l=f}}if(0!==(f.subtreeFlags&2064)&&null!==g)g.return=f,l=g;else b:for(;null!==l;){f=l;if(0!==(f.flags&2048))switch(f.tag){case 0:case 11:case 15:Gc(9,
f,f.return)}var A=f.sibling;if(null!==A){A.return=f.return;l=A;break b}l=f.return}}var v=a.current;for(l=v;null!==l;){g=l;var q=g.child;if(0!==(g.subtreeFlags&2064)&&null!==q)q.return=g,l=q;else b:for(g=v;null!==l;){h=l;if(0!==(h.flags&2048))try{switch(h.tag){case 0:case 11:case 15:Id(9,h)}}catch(ma){H(h,h.return,ma)}if(h===g){l=null;break b}var B=h.sibling;if(null!==B){B.return=h.return;l=B;break b}l=h.return}}p=e;db();if(Ca&&"function"===typeof Ca.onPostCommitFiberRoot)try{Ca.onPostCommitFiberRoot(Uc,
a)}catch(ma){}d=!0}return d}finally{z=c,ca.transition=b}}return!1}function Ti(a,b,c){b=Ub(c,b);b=hi(a,b,1);a=eb(a,b,1);b=Z();null!==a&&(ic(a,1,b),ia(a,b))}function H(a,b,c){if(3===a.tag)Ti(a,a,c);else for(;null!==b;){if(3===b.tag){Ti(b,a,c);break}else if(1===b.tag){var d=b.stateNode;if("function"===typeof b.type.getDerivedStateFromError||"function"===typeof d.componentDidCatch&&(null===ib||!ib.has(d))){a=Ub(c,a);a=ii(b,a,1);b=eb(b,a,1);a=Z();null!==b&&(ic(b,1,a),ia(b,a));break}}b=b.return}}function tk(a,
b,c){var d=a.pingCache;null!==d&&d.delete(b);b=Z();a.pingedLanes|=a.suspendedLanes&c;O===a&&(U&c)===c&&(4===L||3===L&&(U&130023424)===U&&500>P()-Of?xb(a,0):Sf|=c);ia(a,b)}function Ui(a,b){0===b&&(0===(a.mode&1)?b=1:(b=Rd,Rd<<=1,0===(Rd&130023424)&&(Rd=4194304)));var c=Z();a=Oa(a,b);null!==a&&(ic(a,b,c),ia(a,c))}function wk(a){var b=a.memoizedState,c=0;null!==b&&(c=b.retryLane);Ui(a,c)}function Hk(a,b){var c=0;switch(a.tag){case 13:var d=a.stateNode;var e=a.memoizedState;null!==e&&(c=e.retryLane);
break;case 19:d=a.stateNode;break;default:throw Error(n(314));}null!==d&&d.delete(b);Ui(a,c)}function Ni(a,b){return xh(a,b)}function Uk(a,b,c,d){this.tag=a;this.key=c;this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null;this.index=0;this.ref=null;this.pendingProps=b;this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null;this.mode=d;this.subtreeFlags=this.flags=0;this.deletions=null;this.childLanes=this.lanes=0;this.alternate=null}function yf(a){a=
a.prototype;return!(!a||!a.isReactComponent)}function Vk(a){if("function"===typeof a)return yf(a)?1:0;if(void 0!==a&&null!==a){a=a.$$typeof;if(a===ie)return 11;if(a===je)return 14}return 2}function gb(a,b){var c=a.alternate;null===c?(c=pa(a.tag,b,a.key,a.mode),c.elementType=a.elementType,c.type=a.type,c.stateNode=a.stateNode,c.alternate=a,a.alternate=c):(c.pendingProps=b,c.type=a.type,c.flags=0,c.subtreeFlags=0,c.deletions=null);c.flags=a.flags&14680064;c.childLanes=a.childLanes;c.lanes=a.lanes;c.child=
a.child;c.memoizedProps=a.memoizedProps;c.memoizedState=a.memoizedState;c.updateQueue=a.updateQueue;b=a.dependencies;c.dependencies=null===b?null:{lanes:b.lanes,firstContext:b.firstContext};c.sibling=a.sibling;c.index=a.index;c.ref=a.ref;return c}function wd(a,b,c,d,e,f){var g=2;d=a;if("function"===typeof a)yf(a)&&(g=1);else if("string"===typeof a)g=5;else a:switch(a){case Bb:return ub(c.children,e,f,b);case fe:g=8;e|=8;break;case ee:return a=pa(12,c,b,e|2),a.elementType=ee,a.lanes=f,a;case ge:return a=
pa(13,c,b,e),a.elementType=ge,a.lanes=f,a;case he:return a=pa(19,c,b,e),a.elementType=he,a.lanes=f,a;case Vi:return Gd(c,e,f,b);default:if("object"===typeof a&&null!==a)switch(a.$$typeof){case hg:g=10;break a;case gg:g=9;break a;case ie:g=11;break a;case je:g=14;break a;case Ta:g=16;d=null;break a}throw Error(n(130,null==a?a:typeof a,""));}b=pa(g,c,b,e);b.elementType=a;b.type=d;b.lanes=f;return b}function ub(a,b,c,d){a=pa(7,a,d,b);a.lanes=c;return a}function Gd(a,b,c,d){a=pa(22,a,d,b);a.elementType=
Vi;a.lanes=c;a.stateNode={isHidden:!1};return a}function gf(a,b,c){a=pa(6,a,null,b);a.lanes=c;return a}function hf(a,b,c){b=pa(4,null!==a.children?a.children:[],a.key,b);b.lanes=c;b.stateNode={containerInfo:a.containerInfo,pendingChildren:null,implementation:a.implementation};return b}function Wk(a,b,c,d,e){this.tag=b;this.containerInfo=a;this.finishedWork=this.pingCache=this.current=this.pendingChildren=null;this.timeoutHandle=-1;this.callbackNode=this.pendingContext=this.context=null;this.callbackPriority=
0;this.eventTimes=we(0);this.expirationTimes=we(-1);this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0;this.entanglements=we(0);this.identifierPrefix=d;this.onRecoverableError=e;this.mutableSourceEagerHydrationData=null}function Vf(a,b,c,d,e,f,g,h,k,m){a=new Wk(a,b,c,h,k);1===b?(b=1,!0===f&&(b|=8)):b=0;f=pa(3,null,null,b);a.current=f;f.stateNode=a;f.memoizedState={element:d,isDehydrated:c,cache:null,transitions:null,
pendingSuspenseBoundaries:null};df(f);return a}function Xk(a,b,c){var d=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null;return{$$typeof:Cb,key:null==d?null:""+d,children:a,containerInfo:b,implementation:c}}function Wi(a){if(!a)return cb;a=a._reactInternals;a:{if(ob(a)!==a||1!==a.tag)throw Error(n(170));var b=a;do{switch(b.tag){case 3:b=b.stateNode.context;break a;case 1:if(ea(b.type)){b=b.stateNode.__reactInternalMemoizedMergedChildContext;break a}}b=b.return}while(null!==b);throw Error(n(171));
}if(1===a.tag){var c=a.type;if(ea(c))return uh(a,c,b)}return b}function Xi(a,b,c,d,e,f,g,h,k,m){a=Vf(c,d,!0,a,e,f,g,h,k);a.context=Wi(null);c=a.current;d=Z();e=hb(c);f=Pa(d,e);f.callback=void 0!==b&&null!==b?b:null;eb(c,f,e);a.current.lanes=e;ic(a,e,d);ia(a,d);return a}function Sd(a,b,c,d){var e=b.current,f=Z(),g=hb(e);c=Wi(c);null===b.context?b.context=c:b.pendingContext=c;b=Pa(f,g);b.payload={element:a};d=void 0===d?null:d;null!==d&&(b.callback=d);a=eb(e,b,g);null!==a&&(ya(a,e,g,f),sd(a,e,g));return g}
function Td(a){a=a.current;if(!a.child)return null;switch(a.child.tag){case 5:return a.child.stateNode;default:return a.child.stateNode}}function Yi(a,b){a=a.memoizedState;if(null!==a&&null!==a.dehydrated){var c=a.retryLane;a.retryLane=0!==c&&c<b?c:b}}function Wf(a,b){Yi(a,b);(a=a.alternate)&&Yi(a,b)}function Yk(a){a=Bg(a);return null===a?null:a.stateNode}function Zk(a){return null}function Xf(a){this._internalRoot=a}function Ud(a){this._internalRoot=a}function Yf(a){return!(!a||1!==a.nodeType&&9!==
a.nodeType&&11!==a.nodeType)}function Vd(a){return!(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType&&(8!==a.nodeType||" react-mount-point-unstable "!==a.nodeValue))}function Zi(){}function $k(a,b,c,d,e){if(e){if("function"===typeof d){var f=d;d=function(){var a=Td(g);f.call(a)}}var g=Xi(b,d,a,0,null,!1,!1,"",Zi);a._reactRootContainer=g;a[Ja]=g.current;sc(8===a.nodeType?a.parentNode:a);zb();return g}for(;e=a.lastChild;)a.removeChild(e);if("function"===typeof d){var h=d;d=function(){var a=Td(k);
h.call(a)}}var k=Vf(a,0,!1,null,null,!1,!1,"",Zi);a._reactRootContainer=k;a[Ja]=k.current;sc(8===a.nodeType?a.parentNode:a);zb(function(){Sd(b,k,c,d)});return k}function Wd(a,b,c,d,e){var f=c._reactRootContainer;if(f){var g=f;if("function"===typeof e){var h=e;e=function(){var a=Td(g);h.call(a)}}Sd(b,g,a,e)}else g=$k(c,b,a,e,d);return Td(g)}var cg=new Set,$b={},Ia=!("undefined"===typeof window||"undefined"===typeof window.document||"undefined"===typeof window.document.createElement),Zd=Object.prototype.hasOwnProperty,
dj=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,eg={},dg={},R={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a){R[a]=
new Y(a,0,!1,a,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(a){var b=a[0];R[b]=new Y(b,1,!1,a[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(a){R[a]=new Y(a,2,!1,a.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(a){R[a]=new Y(a,2,!1,a,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a){R[a]=
new Y(a,3,!1,a.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(a){R[a]=new Y(a,3,!0,a,null,!1,!1)});["capture","download"].forEach(function(a){R[a]=new Y(a,4,!1,a,null,!1,!1)});["cols","rows","size","span"].forEach(function(a){R[a]=new Y(a,6,!1,a,null,!1,!1)});["rowSpan","start"].forEach(function(a){R[a]=new Y(a,5,!1,a.toLowerCase(),null,!1,!1)});var Zf=/[\-:]([a-z])/g,$f=function(a){return a[1].toUpperCase()};"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a){var b=
a.replace(Zf,$f);R[b]=new Y(b,1,!1,a,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a){var b=a.replace(Zf,$f);R[b]=new Y(b,1,!1,a,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(a){var b=a.replace(Zf,$f);R[b]=new Y(b,1,!1,a,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(a){R[a]=new Y(a,1,!1,a.toLowerCase(),null,!1,!1)});R.xlinkHref=new Y("xlinkHref",
1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(a){R[a]=new Y(a,1,!1,a.toLowerCase(),null,!0,!0)});var Sa=mb.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,xd=Symbol.for("react.element"),Cb=Symbol.for("react.portal"),Bb=Symbol.for("react.fragment"),fe=Symbol.for("react.strict_mode"),ee=Symbol.for("react.profiler"),hg=Symbol.for("react.provider"),gg=Symbol.for("react.context"),ie=Symbol.for("react.forward_ref"),ge=Symbol.for("react.suspense"),
he=Symbol.for("react.suspense_list"),je=Symbol.for("react.memo"),Ta=Symbol.for("react.lazy");Symbol.for("react.scope");Symbol.for("react.debug_trace_mode");var Vi=Symbol.for("react.offscreen");Symbol.for("react.legacy_hidden");Symbol.for("react.cache");Symbol.for("react.tracing_marker");var fg=Symbol.iterator,E=Object.assign,ae,ce=!1,cc=Array.isArray,Xd,zi=function(a){return"undefined"!==typeof MSApp&&MSApp.execUnsafeLocalFunction?function(b,c,d,e){MSApp.execUnsafeLocalFunction(function(){return a(b,
c,d,e)})}:a}(function(a,b){if("http://www.w3.org/2000/svg"!==a.namespaceURI||"innerHTML"in a)a.innerHTML=b;else{Xd=Xd||document.createElement("div");Xd.innerHTML="<svg>"+b.valueOf().toString()+"</svg>";for(b=Xd.firstChild;a.firstChild;)a.removeChild(a.firstChild);for(;b.firstChild;)a.appendChild(b.firstChild)}}),Fc=function(a,b){if(b){var c=a.firstChild;if(c&&c===a.lastChild&&3===c.nodeType){c.nodeValue=b;return}}a.textContent=b},dc={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,
borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,
strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},al=["Webkit","ms","Moz","O"];Object.keys(dc).forEach(function(a){al.forEach(function(b){b=b+a.charAt(0).toUpperCase()+a.substring(1);dc[b]=dc[a]})});var jj=E({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0}),ze=null,se=null,Eb=null,Fb=null,xg=function(a,b){return a(b)},yg=function(){},te=!1,Oe=!1;if(Ia)try{var Lc={};Object.defineProperty(Lc,
"passive",{get:function(){Oe=!0}});window.addEventListener("test",Lc,Lc);window.removeEventListener("test",Lc,Lc)}catch(a){Oe=!1}var lj=function(a,b,c,d,e,f,g,h,k){var m=Array.prototype.slice.call(arguments,3);try{b.apply(c,m)}catch(t){this.onError(t)}},gc=!1,Sc=null,Tc=!1,ue=null,mj={onError:function(a){gc=!0;Sc=a}},Ba=mb.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Scheduler,Jg=Ba.unstable_scheduleCallback,Kg=Ba.unstable_NormalPriority,xh=Jg,Li=Ba.unstable_cancelCallback,Qk=Ba.unstable_shouldYield,
Tk=Ba.unstable_requestPaint,P=Ba.unstable_now,Ej=Ba.unstable_getCurrentPriorityLevel,De=Ba.unstable_ImmediatePriority,Mg=Ba.unstable_UserBlockingPriority,ad=Kg,Fj=Ba.unstable_LowPriority,Ng=Ba.unstable_IdlePriority,Uc=null,Ca=null,ta=Math.clz32?Math.clz32:qj,rj=Math.log,sj=Math.LN2,Wc=64,Rd=4194304,z=0,Ae=!1,Yc=[],Va=null,Wa=null,Xa=null,jc=new Map,kc=new Map,Ya=[],Cj="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" "),
Gb=Sa.ReactCurrentBatchConfig,Zc=!0,$c=null,Za=null,Ee=null,bd=null,Yb={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(a){return a.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},He=ka(Yb),Mc=E({},Yb,{view:0,detail:0}),bk=ka(Mc),ag,bg,Nc,Yd=E({},Mc,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Fe,button:0,buttons:0,relatedTarget:function(a){return void 0===a.relatedTarget?a.fromElement===a.srcElement?a.toElement:a.fromElement:
a.relatedTarget},movementX:function(a){if("movementX"in a)return a.movementX;a!==Nc&&(Nc&&"mousemove"===a.type?(ag=a.screenX-Nc.screenX,bg=a.screenY-Nc.screenY):bg=ag=0,Nc=a);return ag},movementY:function(a){return"movementY"in a?a.movementY:bg}}),ih=ka(Yd),bl=E({},Yd,{dataTransfer:0}),Xj=ka(bl),cl=E({},Mc,{relatedTarget:0}),Pe=ka(cl),dl=E({},Yb,{animationName:0,elapsedTime:0,pseudoElement:0}),Zj=ka(dl),el=E({},Yb,{clipboardData:function(a){return"clipboardData"in a?a.clipboardData:window.clipboardData}}),
dk=ka(el),fl=E({},Yb,{data:0}),qh=ka(fl),gk=qh,gl={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},hl={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",
112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Hj={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"},il=E({},Mc,{key:function(a){if(a.key){var b=gl[a.key]||a.key;if("Unidentified"!==b)return b}return"keypress"===a.type?(a=cd(a),13===a?"Enter":String.fromCharCode(a)):"keydown"===a.type||"keyup"===a.type?hl[a.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,
metaKey:0,repeat:0,locale:0,getModifierState:Fe,charCode:function(a){return"keypress"===a.type?cd(a):0},keyCode:function(a){return"keydown"===a.type||"keyup"===a.type?a.keyCode:0},which:function(a){return"keypress"===a.type?cd(a):"keydown"===a.type||"keyup"===a.type?a.keyCode:0}}),Wj=ka(il),jl=E({},Yd,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),nh=ka(jl),kl=E({},Mc,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,
ctrlKey:0,shiftKey:0,getModifierState:Fe}),Yj=ka(kl),ll=E({},Yb,{propertyName:0,elapsedTime:0,pseudoElement:0}),ak=ka(ll),ml=E({},Yd,{deltaX:function(a){return"deltaX"in a?a.deltaX:"wheelDeltaX"in a?-a.wheelDeltaX:0},deltaY:function(a){return"deltaY"in a?a.deltaY:"wheelDeltaY"in a?-a.wheelDeltaY:"wheelDelta"in a?-a.wheelDelta:0},deltaZ:0,deltaMode:0}),ck=ka(ml),Ij=[9,13,27,32],Ge=Ia&&"CompositionEvent"in window,Oc=null;Ia&&"documentMode"in document&&(Oc=document.documentMode);var fk=Ia&&"TextEvent"in
window&&!Oc,Ug=Ia&&(!Ge||Oc&&8<Oc&&11>=Oc),Tg=String.fromCharCode(32),Sg=!1,Hb=!1,Lj={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0},oc=null,pc=null,ph=!1;Ia&&(ph=Mj("input")&&(!document.documentMode||9<document.documentMode));var ua="function"===typeof Object.is?Object.is:Tj,ek=Ia&&"documentMode"in document&&11>=document.documentMode,Jb=null,Ke=null,rc=null,Je=!1,Kb={animationend:gd("Animation","AnimationEnd"),
animationiteration:gd("Animation","AnimationIteration"),animationstart:gd("Animation","AnimationStart"),transitionend:gd("Transition","TransitionEnd")},Le={},eh={};Ia&&(eh=document.createElement("div").style,"AnimationEvent"in window||(delete Kb.animationend.animation,delete Kb.animationiteration.animation,delete Kb.animationstart.animation),"TransitionEvent"in window||delete Kb.transitionend.transition);var jh=hd("animationend"),kh=hd("animationiteration"),lh=hd("animationstart"),mh=hd("transitionend"),
fh=new Map,$i="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
(function(){for(var a=0;a<$i.length;a++){var b=$i[a],c=b.toLowerCase();b=b[0].toUpperCase()+b.slice(1);$a(c,"on"+b)}$a(jh,"onAnimationEnd");$a(kh,"onAnimationIteration");$a(lh,"onAnimationStart");$a("dblclick","onDoubleClick");$a("focusin","onFocus");$a("focusout","onBlur");$a(mh,"onTransitionEnd")})();Ab("onMouseEnter",["mouseout","mouseover"]);Ab("onMouseLeave",["mouseout","mouseover"]);Ab("onPointerEnter",["pointerout","pointerover"]);Ab("onPointerLeave",["pointerout","pointerover"]);nb("onChange",
"change click focusin focusout input keydown keyup selectionchange".split(" "));nb("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));nb("onBeforeInput",["compositionend","keypress","textInput","paste"]);nb("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));nb("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));nb("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Ec="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Vj=new Set("cancel close invalid load scroll toggle".split(" ").concat(Ec)),id="_reactListening"+Math.random().toString(36).slice(2),hk=/\r\n?/g,ik=/\u0000|\uFFFD/g,Jf=null,Kf=null,Rf="function"===typeof setTimeout?setTimeout:void 0,Ok="function"===typeof clearTimeout?
clearTimeout:void 0,aj="function"===typeof Promise?Promise:void 0,Kk="function"===typeof queueMicrotask?queueMicrotask:"undefined"!==typeof aj?function(a){return aj.resolve(null).then(a).catch(jk)}:Rf,Zb=Math.random().toString(36).slice(2),Da="__reactFiber$"+Zb,uc="__reactProps$"+Zb,Ja="__reactContainer$"+Zb,Me="__reactEvents$"+Zb,Ek="__reactListeners$"+Zb,Fk="__reactHandles$"+Zb,Se=[],Mb=-1,cb={},J=bb(cb),S=bb(!1),qb=cb,La=null,md=!1,Te=!1,Ob=[],Pb=0,od=null,nd=0,na=[],oa=0,sb=null,Ma=1,Na="",la=
null,fa=null,D=!1,wa=null,Jk=Sa.ReactCurrentBatchConfig,rd=bb(null),qd=null,Rb=null,$e=null,tb=null,lk=Oa,fb=!1,Jh=(new mb.Component).refs,ud={isMounted:function(a){return(a=a._reactInternals)?ob(a)===a:!1},enqueueSetState:function(a,b,c){a=a._reactInternals;var d=Z(),e=hb(a),f=Pa(d,e);f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=eb(a,f,e);null!==b&&(ya(b,a,e,d),sd(b,a,e))},enqueueReplaceState:function(a,b,c){a=a._reactInternals;var d=Z(),e=hb(a),f=Pa(d,e);f.tag=1;f.payload=b;void 0!==c&&null!==
c&&(f.callback=c);b=eb(a,f,e);null!==b&&(ya(b,a,e,d),sd(b,a,e))},enqueueForceUpdate:function(a,b){a=a._reactInternals;var c=Z(),d=hb(a),e=Pa(c,d);e.tag=2;void 0!==b&&null!==b&&(e.callback=b);b=eb(a,e,d);null!==b&&(ya(b,a,d,c),sd(b,a,d))}},Vb=Lh(!0),mi=Lh(!1),wc={},Ea=bb(wc),yc=bb(wc),xc=bb(wc),G=bb(0),mf=[],zd=Sa.ReactCurrentDispatcher,uf=Sa.ReactCurrentBatchConfig,wb=0,C=null,K=null,N=null,Bd=!1,zc=!1,Ac=0,nl=0,Ad={readContext:qa,useCallback:V,useContext:V,useEffect:V,useImperativeHandle:V,useInsertionEffect:V,
useLayoutEffect:V,useMemo:V,useReducer:V,useRef:V,useState:V,useDebugValue:V,useDeferredValue:V,useTransition:V,useMutableSource:V,useSyncExternalStore:V,useId:V,unstable_isNewReconciler:!1},mk={readContext:qa,useCallback:function(a,b){Fa().memoizedState=[a,void 0===b?null:b];return a},useContext:qa,useEffect:Wh,useImperativeHandle:function(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return Cd(4194308,4,Zh.bind(null,b,a),c)},useLayoutEffect:function(a,b){return Cd(4194308,4,a,b)},useInsertionEffect:function(a,
b){return Cd(4,2,a,b)},useMemo:function(a,b){var c=Fa();b=void 0===b?null:b;a=a();c.memoizedState=[a,b];return a},useReducer:function(a,b,c){var d=Fa();b=void 0!==c?c(b):b;d.memoizedState=d.baseState=b;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:a,lastRenderedState:b};d.queue=a;a=a.dispatch=rk.bind(null,C,a);return[d.memoizedState,a]},useRef:function(a){var b=Fa();a={current:a};return b.memoizedState=a},useState:Uh,useDebugValue:tf,useDeferredValue:function(a){return Fa().memoizedState=
a},useTransition:function(){var a=Uh(!1),b=a[0];a=qk.bind(null,a[1]);Fa().memoizedState=a;return[b,a]},useMutableSource:function(a,b,c){},useSyncExternalStore:function(a,b,c){var d=C,e=Fa();if(D){if(void 0===c)throw Error(n(407));c=c()}else{c=b();if(null===O)throw Error(n(349));0!==(wb&30)||Rh(d,b,c)}e.memoizedState=c;var f={value:c,getSnapshot:b};e.queue=f;Wh(Ph.bind(null,d,f,a),[a]);d.flags|=2048;Cc(9,Qh.bind(null,d,f,c,b),void 0,null);return c},useId:function(){var a=Fa(),b=O.identifierPrefix;
if(D){var c=Na;var d=Ma;c=(d&~(1<<32-ta(d)-1)).toString(32)+c;b=":"+b+"R"+c;c=Ac++;0<c&&(b+="H"+c.toString(32));b+=":"}else c=nl++,b=":"+b+"r"+c.toString(32)+":";return a.memoizedState=b},unstable_isNewReconciler:!1},nk={readContext:qa,useCallback:ai,useContext:qa,useEffect:sf,useImperativeHandle:$h,useInsertionEffect:Xh,useLayoutEffect:Yh,useMemo:bi,useReducer:qf,useRef:Vh,useState:function(a){return qf(Bc)},useDebugValue:tf,useDeferredValue:function(a){var b=sa();return ci(b,K.memoizedState,a)},
useTransition:function(){var a=qf(Bc)[0],b=sa().memoizedState;return[a,b]},useMutableSource:Nh,useSyncExternalStore:Oh,useId:di,unstable_isNewReconciler:!1},ok={readContext:qa,useCallback:ai,useContext:qa,useEffect:sf,useImperativeHandle:$h,useInsertionEffect:Xh,useLayoutEffect:Yh,useMemo:bi,useReducer:rf,useRef:Vh,useState:function(a){return rf(Bc)},useDebugValue:tf,useDeferredValue:function(a){var b=sa();return null===K?b.memoizedState=a:ci(b,K.memoizedState,a)},useTransition:function(){var a=rf(Bc)[0],
b=sa().memoizedState;return[a,b]},useMutableSource:Nh,useSyncExternalStore:Oh,useId:di,unstable_isNewReconciler:!1},sk="function"===typeof WeakMap?WeakMap:Map,uk=Sa.ReactCurrentOwner,ha=!1,Cf={dehydrated:null,treeContext:null,retryLane:0};var Ak=function(a,b,c,d){for(c=b.child;null!==c;){if(5===c.tag||6===c.tag)a.appendChild(c.stateNode);else if(4!==c.tag&&null!==c.child){c.child.return=c;c=c.child;continue}if(c===b)break;for(;null===c.sibling;){if(null===c.return||c.return===b)return;c=c.return}c.sibling.return=
c.return;c=c.sibling}};var yi=function(a,b){};var zk=function(a,b,c,d,e){var f=a.memoizedProps;if(f!==d){a=b.stateNode;vb(Ea.current);e=null;switch(c){case "input":f=ke(a,f);d=ke(a,d);e=[];break;case "select":f=E({},f,{value:void 0});d=E({},d,{value:void 0});e=[];break;case "textarea":f=ne(a,f);d=ne(a,d);e=[];break;default:"function"!==typeof f.onClick&&"function"===typeof d.onClick&&(a.onclick=kd)}pe(c,d);var g;c=null;for(m in f)if(!d.hasOwnProperty(m)&&f.hasOwnProperty(m)&&null!=f[m])if("style"===
m){var h=f[m];for(g in h)h.hasOwnProperty(g)&&(c||(c={}),c[g]="")}else"dangerouslySetInnerHTML"!==m&&"children"!==m&&"suppressContentEditableWarning"!==m&&"suppressHydrationWarning"!==m&&"autoFocus"!==m&&($b.hasOwnProperty(m)?e||(e=[]):(e=e||[]).push(m,null));for(m in d){var k=d[m];h=null!=f?f[m]:void 0;if(d.hasOwnProperty(m)&&k!==h&&(null!=k||null!=h))if("style"===m)if(h){for(g in h)!h.hasOwnProperty(g)||k&&k.hasOwnProperty(g)||(c||(c={}),c[g]="");for(g in k)k.hasOwnProperty(g)&&h[g]!==k[g]&&(c||
(c={}),c[g]=k[g])}else c||(e||(e=[]),e.push(m,c)),c=k;else"dangerouslySetInnerHTML"===m?(k=k?k.__html:void 0,h=h?h.__html:void 0,null!=k&&h!==k&&(e=e||[]).push(m,k)):"children"===m?"string"!==typeof k&&"number"!==typeof k||(e=e||[]).push(m,""+k):"suppressContentEditableWarning"!==m&&"suppressHydrationWarning"!==m&&($b.hasOwnProperty(m)?(null!=k&&"onScroll"===m&&B("scroll",a),e||h===k||(e=[])):(e=e||[]).push(m,k))}c&&(e=e||[]).push("style",c);var m=e;if(b.updateQueue=m)b.flags|=4}};var Bk=function(a,
b,c,d){c!==d&&(b.flags|=4)};var Jd=!1,X=!1,Gk="function"===typeof WeakSet?WeakSet:Set,l=null,Ai=!1,T=null,za=!1,Nk=Math.ceil,Od=Sa.ReactCurrentDispatcher,Uf=Sa.ReactCurrentOwner,ca=Sa.ReactCurrentBatchConfig,p=0,O=null,I=null,U=0,ba=0,Ga=bb(0),L=0,Jc=null,ra=0,Md=0,Sf=0,Kc=null,ja=null,Of=0,Hf=Infinity,Ra=null,Ed=!1,xf=null,ib=null,Pd=!1,lb=null,Qd=0,Ic=0,Pf=null,Kd=-1,Ld=0;var Rk=function(a,b,c){if(null!==a)if(a.memoizedProps!==b.pendingProps||S.current)ha=!0;else{if(0===(a.lanes&c)&&0===(b.flags&
128))return ha=!1,xk(a,b,c);ha=0!==(a.flags&131072)?!0:!1}else ha=!1,D&&0!==(b.flags&1048576)&&yh(b,nd,b.index);b.lanes=0;switch(b.tag){case 2:var d=b.type;Fd(a,b);a=b.pendingProps;var e=Nb(b,J.current);Sb(b,c);e=of(null,b,d,a,e,c);var f=pf();b.flags|=1;"object"===typeof e&&null!==e&&"function"===typeof e.render&&void 0===e.$$typeof?(b.tag=1,b.memoizedState=null,b.updateQueue=null,ea(d)?(f=!0,ld(b)):f=!1,b.memoizedState=null!==e.state&&void 0!==e.state?e.state:null,df(b),e.updater=ud,b.stateNode=
e,e._reactInternals=b,ff(b,d,a,c),b=Af(null,b,d,!0,f,c)):(b.tag=0,D&&f&&Ue(b),aa(null,b,e,c),b=b.child);return b;case 16:d=b.elementType;a:{Fd(a,b);a=b.pendingProps;e=d._init;d=e(d._payload);b.type=d;e=b.tag=Vk(d);a=xa(d,a);switch(e){case 0:b=zf(null,b,d,a,c);break a;case 1:b=si(null,b,d,a,c);break a;case 11:b=ni(null,b,d,a,c);break a;case 14:b=oi(null,b,d,xa(d.type,a),c);break a}throw Error(n(306,d,""));}return b;case 0:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:xa(d,e),zf(a,b,d,e,c);
case 1:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:xa(d,e),si(a,b,d,e,c);case 3:a:{ti(b);if(null===a)throw Error(n(387));d=b.pendingProps;f=b.memoizedState;e=f.element;Dh(a,b);td(b,d,null,c);var g=b.memoizedState;d=g.element;if(f.isDehydrated)if(f={element:d,isDehydrated:!1,cache:g.cache,pendingSuspenseBoundaries:g.pendingSuspenseBoundaries,transitions:g.transitions},b.updateQueue.baseState=f,b.memoizedState=f,b.flags&256){e=Ub(Error(n(423)),b);b=ui(a,b,d,c,e);break a}else if(d!==e){e=
Ub(Error(n(424)),b);b=ui(a,b,d,c,e);break a}else for(fa=Ka(b.stateNode.containerInfo.firstChild),la=b,D=!0,wa=null,c=mi(b,null,d,c),b.child=c;c;)c.flags=c.flags&-3|4096,c=c.sibling;else{Qb();if(d===e){b=Qa(a,b,c);break a}aa(a,b,d,c)}b=b.child}return b;case 5:return Mh(b),null===a&&Xe(b),d=b.type,e=b.pendingProps,f=null!==a?a.memoizedProps:null,g=e.children,Qe(d,e)?g=null:null!==f&&Qe(d,f)&&(b.flags|=32),ri(a,b),aa(a,b,g,c),b.child;case 6:return null===a&&Xe(b),null;case 13:return vi(a,b,c);case 4:return jf(b,
b.stateNode.containerInfo),d=b.pendingProps,null===a?b.child=Vb(b,null,d,c):aa(a,b,d,c),b.child;case 11:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:xa(d,e),ni(a,b,d,e,c);case 7:return aa(a,b,b.pendingProps,c),b.child;case 8:return aa(a,b,b.pendingProps.children,c),b.child;case 12:return aa(a,b,b.pendingProps.children,c),b.child;case 10:a:{d=b.type._context;e=b.pendingProps;f=b.memoizedProps;g=e.value;y(rd,d._currentValue);d._currentValue=g;if(null!==f)if(ua(f.value,g)){if(f.children===
e.children&&!S.current){b=Qa(a,b,c);break a}}else for(f=b.child,null!==f&&(f.return=b);null!==f;){var h=f.dependencies;if(null!==h){g=f.child;for(var k=h.firstContext;null!==k;){if(k.context===d){if(1===f.tag){k=Pa(-1,c&-c);k.tag=2;var m=f.updateQueue;if(null!==m){m=m.shared;var l=m.pending;null===l?k.next=k:(k.next=l.next,l.next=k);m.pending=k}}f.lanes|=c;k=f.alternate;null!==k&&(k.lanes|=c);bf(f.return,c,b);h.lanes|=c;break}k=k.next}}else if(10===f.tag)g=f.type===b.type?null:f.child;else if(18===
f.tag){g=f.return;if(null===g)throw Error(n(341));g.lanes|=c;h=g.alternate;null!==h&&(h.lanes|=c);bf(g,c,b);g=f.sibling}else g=f.child;if(null!==g)g.return=f;else for(g=f;null!==g;){if(g===b){g=null;break}f=g.sibling;if(null!==f){f.return=g.return;g=f;break}g=g.return}f=g}aa(a,b,e.children,c);b=b.child}return b;case 9:return e=b.type,d=b.pendingProps.children,Sb(b,c),e=qa(e),d=d(e),b.flags|=1,aa(a,b,d,c),b.child;case 14:return d=b.type,e=xa(d,b.pendingProps),e=xa(d.type,e),oi(a,b,d,e,c);case 15:return pi(a,
b,b.type,b.pendingProps,c);case 17:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:xa(d,e),Fd(a,b),b.tag=1,ea(d)?(a=!0,ld(b)):a=!1,Sb(b,c),Hh(b,d,e),ff(b,d,e,c),Af(null,b,d,!0,a,c);case 19:return xi(a,b,c);case 22:return qi(a,b,c)}throw Error(n(156,b.tag));};var pa=function(a,b,c,d){return new Uk(a,b,c,d)},bj="function"===typeof reportError?reportError:function(a){console.error(a)};Ud.prototype.render=Xf.prototype.render=function(a){var b=this._internalRoot;if(null===b)throw Error(n(409));
Sd(a,b,null,null)};Ud.prototype.unmount=Xf.prototype.unmount=function(){var a=this._internalRoot;if(null!==a){this._internalRoot=null;var b=a.containerInfo;zb(function(){Sd(null,a,null,null)});b[Ja]=null}};Ud.prototype.unstable_scheduleHydration=function(a){if(a){var b=ol();a={blockedOn:null,target:a,priority:b};for(var c=0;c<Ya.length&&0!==b&&b<Ya[c].priority;c++);Ya.splice(c,0,a);0===c&&Hg(a)}};var Dj=function(a){switch(a.tag){case 3:var b=a.stateNode;if(b.current.memoizedState.isDehydrated){var c=
hc(b.pendingLanes);0!==c&&(xe(b,c|1),ia(b,P()),0===(p&6)&&(Hc(),db()))}break;case 13:zb(function(){var b=Oa(a,1);if(null!==b){var c=Z();ya(b,a,1,c)}}),Wf(a,1)}};var Gg=function(a){if(13===a.tag){var b=Oa(a,134217728);if(null!==b){var c=Z();ya(b,a,134217728,c)}Wf(a,134217728)}};var yj=function(a){if(13===a.tag){var b=hb(a),c=Oa(a,b);if(null!==c){var d=Z();ya(c,a,b,d)}Wf(a,b)}};var ol=function(){return z};var xj=function(a,b){var c=z;try{return z=a,b()}finally{z=c}};se=function(a,b,c){switch(b){case "input":le(a,
c);b=c.name;if("radio"===c.type&&null!=b){for(c=a;c.parentNode;)c=c.parentNode;c=c.querySelectorAll("input[name="+JSON.stringify(""+b)+'][type="radio"]');for(b=0;b<c.length;b++){var d=c[b];if(d!==a&&d.form===a.form){var e=Rc(d);if(!e)throw Error(n(90));jg(d);le(d,e)}}}break;case "textarea":og(a,c);break;case "select":b=c.value,null!=b&&Db(a,!!c.multiple,b,!1)}};(function(a,b,c){xg=a;yg=c})(Tf,function(a,b,c,d,e){var f=z,g=ca.transition;try{return ca.transition=null,z=1,a(b,c,d,e)}finally{z=f,ca.transition=
g,0===p&&Hc()}},zb);var pl={usingClientEntryPoint:!1,Events:[ec,Ib,Rc,ug,vg,Tf]};(function(a){a={bundleType:a.bundleType,version:a.version,rendererPackageName:a.rendererPackageName,rendererConfig:a.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Sa.ReactCurrentDispatcher,findHostInstanceByFiber:Yk,
findFiberByHostInstance:a.findFiberByHostInstance||Zk,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.2.0"};if("undefined"===typeof __REACT_DEVTOOLS_GLOBAL_HOOK__)a=!1;else{var b=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(b.isDisabled||!b.supportsFiber)a=!0;else{try{Uc=b.inject(a),Ca=b}catch(c){}a=b.checkDCE?!0:!1}}return a})({findFiberByHostInstance:pb,bundleType:0,version:"18.2.0-next-9e3b772b8-20220608",
rendererPackageName:"react-dom"});Q.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=pl;Q.createPortal=function(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null;if(!Yf(b))throw Error(n(200));return Xk(a,b,null,c)};Q.createRoot=function(a,b){if(!Yf(a))throw Error(n(299));var c=!1,d="",e=bj;null!==b&&void 0!==b&&(!0===b.unstable_strictMode&&(c=!0),void 0!==b.identifierPrefix&&(d=b.identifierPrefix),void 0!==b.onRecoverableError&&(e=b.onRecoverableError));b=Vf(a,1,!1,null,null,
c,!1,d,e);a[Ja]=b.current;sc(8===a.nodeType?a.parentNode:a);return new Xf(b)};Q.findDOMNode=function(a){if(null==a)return null;if(1===a.nodeType)return a;var b=a._reactInternals;if(void 0===b){if("function"===typeof a.render)throw Error(n(188));a=Object.keys(a).join(",");throw Error(n(268,a));}a=Bg(b);a=null===a?null:a.stateNode;return a};Q.flushSync=function(a){return zb(a)};Q.hydrate=function(a,b,c){if(!Vd(b))throw Error(n(200));return Wd(null,a,b,!0,c)};Q.hydrateRoot=function(a,b,c){if(!Yf(a))throw Error(n(405));
var d=null!=c&&c.hydratedSources||null,e=!1,f="",g=bj;null!==c&&void 0!==c&&(!0===c.unstable_strictMode&&(e=!0),void 0!==c.identifierPrefix&&(f=c.identifierPrefix),void 0!==c.onRecoverableError&&(g=c.onRecoverableError));b=Xi(b,null,a,1,null!=c?c:null,e,!1,f,g);a[Ja]=b.current;sc(a);if(d)for(a=0;a<d.length;a++)c=d[a],e=c._getVersion,e=e(c._source),null==b.mutableSourceEagerHydrationData?b.mutableSourceEagerHydrationData=[c,e]:b.mutableSourceEagerHydrationData.push(c,e);return new Ud(b)};Q.render=
function(a,b,c){if(!Vd(b))throw Error(n(200));return Wd(null,a,b,!1,c)};Q.unmountComponentAtNode=function(a){if(!Vd(a))throw Error(n(40));return a._reactRootContainer?(zb(function(){Wd(null,null,a,!1,function(){a._reactRootContainer=null;a[Ja]=null})}),!0):!1};Q.unstable_batchedUpdates=Tf;Q.unstable_renderSubtreeIntoContainer=function(a,b,c,d){if(!Vd(c))throw Error(n(200));if(null==a||void 0===a._reactInternals)throw Error(n(38));return Wd(a,b,c,!1,d)};Q.version="18.2.0-next-9e3b772b8-20220608"});
})();

const {
  useState,
  useMemo,
  useEffect
} = React;

// ── helpers ───────────────────────────────────────────────────────────────────

const NO_DOSE_UNITS = ["ML", "ml"];
const NO_DOSE_KEYWORDS = ["ophthalmic", "eye drop", "eye solution", "ophthalmic solution", "udv", "inhalation", "suspension", "inhaler", "nasal", "ointment", "cream", "gel", "patch", "drops", "spray"];
function isNoDoseRoute(drugName, unit) {
  if (NO_DOSE_UNITS.includes(unit)) return true;
  return NO_DOSE_KEYWORDS.some(k => (drugName || "").toLowerCase().includes(k));
}

// Infer the dose unit word from drug name + raw unit column
// Returns { unit: string, isNoDose: boolean }
function inferDoseUnit(drugName, rawUnit) {
  const name = (drugName || "").toLowerCase();
  const u    = (rawUnit   || "").toUpperCase();

  // FIRST: check drug-name keywords for non-per-dose routes (injections, topical, inhaled, drops)
  // These override whatever rawUnit says.
  if (/injection|infusion|intravenous|\biv\b|intramuscul|subcutan/.test(name)) {
    return { unit: "", isNoDose: true };
  }
  if (/ophthalmic|eye drop|eye solution|eye sol|ophth sol|eye ointment/.test(name)) {
    return { unit: "drops", isNoDose: true };
  }
  if (/udv|nebul|inhalation|inhaler|inhalant|metered dose|turbuhaler|diskus|accuhaler|handihaler|\bmdi\b|\bdpi\b/.test(name)) {
    return { unit: "puff", isNoDose: true };
  }
  if (/nasal spray|nasal drop/.test(name)) {
    return { unit: "spray", isNoDose: true };
  }
  if (/patch|transdermal/.test(name)) {
    return { unit: "patch", isNoDose: true };
  }
  if (/ointment|\bcream\b|\bgel\b|\blotion\b|\bpaste\b/.test(name)) {
    return { unit: "", isNoDose: true };
  }

  // Explicit mass units for powders — typically injections handled above
  if (u === "GM" || u === "G" || u === "MG") {
    return { unit: u.toLowerCase(), isNoDose: true };
  }

  // Volume units — likely oral syrup/suspension (since non-oral routes caught above)
  if (u === "ML" || u === "CC") {
    return { unit: "mL", isNoDose: false };
  }

  if (u === "IU" || u === "U" || u === "UNIT") {
    return { unit: u.toLowerCase(), isNoDose: false };
  }

  // No explicit unit — infer from drug name
  // Order matters: check most-specific keywords first
  const formRules = [
    { kw: ["suppositor"],                                                  unit: "supp",     isNoDose: false },
    { kw: ["enema"],                                                       unit: "enema",    isNoDose: false },
    // Oral solid
    { kw: ["capsule","caps."," cap "," cap,","caplet","capsul"],           unit: "cap",      isNoDose: false },
    { kw: ["f.c. tablet","f.c.tablet","f.c. talbet","film-coated tablet","film coated tablet","tablet","tab.","pulvule"], unit: "tab", isNoDose: false },
    // Oral liquid
    { kw: ["syrup","suspension","elixir","solution","mixture","liquid"],   unit: "mL",       isNoDose: false },
    // Powder / granule
    { kw: ["sachet","granule","powder for oral","oral powder"],            unit: "pack",     isNoDose: false },
    // Catch-all for vial/ampoule when name wasn't injection-related
    { kw: ["vial","ampoule","ampule"],                                     unit: "vial",     isNoDose: true },
  ];

  for (const rule of formRules) {
    if (rule.kw.some(k => name.includes(k))) {
      return { unit: rule.unit, isNoDose: rule.isNoDose };
    }
  }

  // Default: assume tablet
  return { unit: "tab", isNoDose: false };
}


const SALT_SUFFIXES = [/ hcl$/i, / hydrochloride$/i, / chloride$/i, / sodium$/i, / calcium$/i, / potassium$/i, / magnesium$/i, / zinc$/i, / iron$/i, / acetate$/i, / sulfate$/i, / sulphate$/i, / citrate$/i, / besylate$/i, / maleate$/i, / tartrate$/i, / mesylate$/i, / fumarate$/i, / phosphate$/i, / cypionate$/i, / hemihydrate$/i, / methylsulfate$/i, / dihydrochloride$/i, / monohydrate$/i, / trihydrate$/i, / hydrobromide$/i, / bromide$/i, / iodide$/i, / nitrate$/i, / succinate$/i, / oxalate$/i, / propionate$/i, / valerate$/i, / enanthate$/i, / decanoate$/i, / lactate$/i, / gluconate$/i, / carbonate$/i, / bicarbonate$/i, / stearate$/i, / palmitate$/i, / benzoate$/i, / salicylate$/i];
function stripSalt(name) {
  let n = (name || "").trim();
  let prev;
  do {
    prev = n;
    for (const re of SALT_SUFFIXES) n = n.replace(re, "");
  } while (n !== prev);
  n = n.replace(/\s*\(=[^)]*\)/g, "").replace(/\s*\([^)]*\)/g, "").trim();
  n = n.replace(/\s*\(=.*$/, "").trim();
  return n;
}

// Canonical drug identity key: stripped ingredient name + strength (merges same drug across brands/NHI codes)
function drugKey(r) {
  // Macro dedups by 健保碼 (NHI code) — precise to the product. Fall back to ingredient+strength.
  const code = (r.nhiCode || "").trim();
  if (code) return "c:" + code;
  const base = stripSalt(r.ingName || "").toLowerCase().trim();
  const s = extractStrength(r.drugName || "");
  const strengthPart = s ? (s.val + s.unit) : "";
  return base + "|" + strengthPart;
}

function extractStrength(drugName) {
  const m = (drugName || "").match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ug|g|%|iu|IU|units?)/i);
  if (!m) return null;
  let unit = m[2].toLowerCase();
  if (unit === "ug") unit = "mcg";
  if (unit === "iu" || unit === "units") unit = "IU";
  return {
    val: m[1],
    unit
  };
}
function fmtDate(d) {
  if (!d) return "";
  const p = d.split("/");
  if (p.length !== 3) return d;
  return `${p[0]}/${p[1].padStart(2, "0")}/${p[2].padStart(2, "0")}`;
}

// Short form omitting year (used in compare table when year is consistent)
function fmtDateShort(d) {
  if (!d) return "";
  const p = d.split("/");
  if (p.length !== 3) return d;
  return `${p[1].padStart(2, "0")}/${p[2].padStart(2, "0")}`;
}

// Compare two raw date strings (YYYY/M/D) correctly by padding first
function cmpDate(a, b) {
  return fmtDate(a).localeCompare(fmtDate(b));
}
// Decode HTML entities that leak through when the table is copied from Chrome
// (e.g. frequency arrives as "TIDPC&amp;HS").
function decodeEntities(s) {
  return s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&amp;/g, "&");
}
function parseRows(raw) {
  const sourceTypes = ["他院藥局", "他院門診", "本院門診", "本院藥局"];
  const freqKW = new Set(["QD", "BID", "TID", "QID", "Q12H", "Q8H", "Q6H", "Q4H", "Q3H", "Q2H", "Q1H", "Q3W", "Q2W", "Q4W", "QW", "BIW", "TIW", "QOD", "QODPC", "QODAC", "QIDAC", "QIDPC", "STAT", "PRN", "ASORDER", "IRRE", "TIDAC", "TIDPC", "BIDAC", "BIDPC", "QDAC", "QDPC", "HS", "HSPRN", "AM", "PM", "AC", "PC", "AC3", "PC3", "TIDACHS", "QIDACHS", "BIDACHS"]);
  const cleaned = decodeEntities(raw.replace(/\r/g, "")).replace(/\u3000/g, " ").replace(/\u00a0/g, " ");
  const rawLines = cleaned.split(/\n/);
  // Format C \u2014 Chrome copies the NHI table as tab-separated columns (one row
  // per line). Detect before trimming so empty trailing cells survive.
  const tabLines = rawLines.filter(l => l.indexOf("\t") >= 0 && sourceTypes.includes(l.split("\t")[0].trim()));
  if (tabLines.length) {
    return parseFormatC(tabLines, sourceTypes);
  }
  const lines = rawLines.map(l => l.trim()).filter(Boolean);
  const hasSoloSourceLine = lines.some(l => sourceTypes.includes(l));
  const hasInlineRows = lines.some(l => sourceTypes.some(s => l.startsWith(s + " ")));
  if (hasSoloSourceLine && !hasInlineRows) {
    return parseFormatA(lines, sourceTypes, freqKW);
  }
  return parseFormatB(lines, sourceTypes, freqKW);
}
// Tab-separated rows (Chrome / Excel paste). Column order:
// 來源 主診斷碼 主診斷名 ATC5代碼 ATC名稱 成分代碼 成分名稱 健保碼 藥名
// 藥品規格量 藥品規格量單位 頻率 就醫日期 慢連箋領藥日 藥品用量 給藥日數 餘藥量天數 機構
function parseFormatC(tabLines, sourceTypes) {
  const rows = [];
  for (const rawLine of tabLines) {
    const cols = rawLine.split("\t").map(c => c.trim());
    if (!sourceTypes.includes(cols[0])) continue;
    if (cols.length < 16) continue;
    // Head is left-anchored (來源…頻率), tail right-anchored (藥品用量…機構);
    // whatever sits between holds the date column(s), which may be blank.
    const source = cols[0],
      diagCode = cols[1],
      diagName = cols[2],
      atc5 = cols[3],
      atcName = cols[4],
      ingCode = cols[5],
      ingName = cols[6],
      nhiCode = cols[7],
      drugName = cols[8],
      unit = cols[10],
      freq = cols[11];
    const amtRaw = cols[9] || "0.000";
    const n = cols.length;
    const institution = cols[n - 1],
      remaining = cols[n - 2],
      days = cols[n - 3],
      qty = cols[n - 4];
    const dates = cols.slice(12, n - 4).filter(c => /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(c));
    const date1 = dates[0] || "",
      date2 = dates[1] || "";
    if (!date1) continue;
    rows.push({
      source,
      diagCode,
      diagName,
      atc5,
      atcName,
      ingCode,
      ingName,
      nhiCode,
      drugName,
      amtRaw,
      unit,
      freq,
      date1,
      date2,
      qty,
      days,
      remaining,
      institution
    });
  }
  return rows;
}
function parseFormatA(lines, sourceTypes, freqKW) {
  const rows = [];
  let i = 0;
  while (i < lines.length) {
    if (!sourceTypes.includes(lines[i])) {
      i++;
      continue;
    }
    const source = lines[i++];
    const diagCode = lines[i++] || "";
    const diagName = lines[i++] || "";
    const atc5 = lines[i++] || "";
    const atcName = lines[i++] || "";
    const ingCode = lines[i++] || "";
    const ingName = lines[i++] || "";
    const nhiCode = lines[i++] || "";
    const drugName = lines[i++] || "";
    const amtRaw = lines[i++] || "";
    let unit = "";
    if (!freqKW.has(lines[i] || "") && !/^\d{4}\//.test(lines[i] || "") && (lines[i] || "").length < 10) unit = lines[i++] || "";
    const freq = lines[i++] || "";
    const date1 = lines[i++] || "";
    let date2 = "";
    if (/^\d{4}\//.test(lines[i] || "")) date2 = lines[i++];
    const qty = lines[i++] || "";
    const days = lines[i++] || "";
    const remaining = lines[i++] || "";
    const institution = lines[i++] || "";
    rows.push({
      source,
      diagCode,
      diagName,
      atc5,
      atcName,
      ingCode,
      ingName,
      nhiCode,
      drugName,
      amtRaw,
      unit,
      freq,
      date1,
      date2,
      qty,
      days,
      remaining,
      institution
    });
  }
  return rows;
}
function parseFormatB(lines, sourceTypes, freqKW) {
  const rows = [];
  for (const rawLine of lines) {
    const source = sourceTypes.find(s => rawLine.startsWith(s + " ") || rawLine === s);
    if (!source) continue;
    const rest = rawLine.slice(source.length).trim();
    const tokens = rest.split(/\s+/).filter(Boolean);
    if (tokens.length < 10) continue;
    let t = 0;
    const diagCode = tokens[t++];
    const atc5Re = /^[A-Z]\d{2}[A-Z]{1,2}\d{0,3}$/;
    let atc5Idx = -1;
    for (let k = t; k < Math.min(tokens.length, t + 10); k++) {
      if (atc5Re.test(tokens[k])) {
        atc5Idx = k;
        break;
      }
    }
    if (atc5Idx < 0) continue;
    const diagName = tokens.slice(t, atc5Idx).join(" ");
    const atc5 = tokens[atc5Idx];
    t = atc5Idx + 1;
    let ingCodeIdx = -1;
    for (let k = t; k < Math.min(tokens.length, t + 15); k++) {
      if (/^\d{7,}$/.test(tokens[k])) {
        ingCodeIdx = k;
        break;
      }
    }
    if (ingCodeIdx < 0) continue;
    const atcName = tokens.slice(t, ingCodeIdx).join(" ");
    const ingCode = tokens[ingCodeIdx];
    t = ingCodeIdx + 1;
    const nhiRe = /^[A-Z]{1,2}\d{4,}[A-Z0-9]*$/;
    let nhiIdx = -1;
    for (let k = t; k < Math.min(tokens.length, t + 20); k++) {
      if (nhiRe.test(tokens[k]) && tokens[k].length >= 8) {
        nhiIdx = k;
        break;
      }
    }
    if (nhiIdx < 0) continue;
    const ingName = tokens.slice(t, nhiIdx).join(" ");
    const nhiCode = tokens[nhiIdx];
    t = nhiIdx + 1;
    const institution = tokens[tokens.length - 1];
    const remaining = tokens[tokens.length - 2];
    const days = tokens[tokens.length - 3];
    const qty = tokens[tokens.length - 4];
    let rightEnd = tokens.length - 4;
    let date1Idx = -1,
      date2Idx = -1;
    for (let k = rightEnd - 1; k >= t; k--) {
      if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(tokens[k])) {
        if (date2Idx < 0) date2Idx = k;else if (date1Idx < 0) {
          date1Idx = k;
          break;
        }
      }
    }
    let date1 = "",
      date2 = "";
    if (date1Idx >= 0 && date2Idx >= 0) {
      date1 = tokens[date1Idx];
      date2 = tokens[date2Idx];
    } else if (date2Idx >= 0) {
      date1 = tokens[date2Idx];
      date2 = "";
      date1Idx = date2Idx;
    } else continue;
    const freqIdx = date1Idx - 1;
    if (freqIdx < t) continue;
    const freq = tokens[freqIdx];
    let amtIdx = -1;
    for (let k = freqIdx - 1; k >= t; k--) {
      if (/^\d+\.\d+$/.test(tokens[k])) {
        amtIdx = k;
        break;
      }
    }
    let drugName = "",
      amtRaw = "0.000",
      unit = "";
    if (amtIdx >= 0) {
      amtRaw = tokens[amtIdx];
      if (freqIdx - amtIdx === 2) unit = tokens[amtIdx + 1];
      drugName = tokens.slice(t, amtIdx).join(" ");
    } else {
      drugName = tokens.slice(t, freqIdx).join(" ");
    }
    rows.push({
      source,
      diagCode,
      diagName,
      atc5,
      atcName,
      ingCode,
      ingName,
      nhiCode,
      drugName,
      amtRaw,
      unit,
      freq,
      date1,
      date2,
      qty,
      days,
      remaining,
      institution
    });
  }
  return rows;
}

// ── filter / deduplicate ──────────────────────────────────────────────────────

function filterRows(rows, opts) {
  return rows.filter(r => {
    if (opts.filterSourceOPD && !/門診|藥局/.test(r.source)) return false;
    if (opts.filterShortDays && parseFloat(r.days) < 14) return false;
    return true;
  });
}
function deduplicateAndCollect(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = drugKey(r);
    if (!map.has(key)) {
      map.set(key, {
        latest: r,
        allRows: [r]
      });
    } else {
      const entry = map.get(key);
      entry.allRows.push(r);
      if (cmpDate(r.date1, entry.latest.date1) > 0) entry.latest = r;
    }
  }
  return map;
}

// ── analysis helpers ──────────────────────────────────────────────────────────

function looksLikeCombo(r) {
  return /\d+(\.\d+)?\/\d+(\.\d+)?/.test(r.drugName || "");
}
function isRegular(allRows) {
  const dates = new Set(allRows.map(r => r.date1));
  return dates.size >= 2;
}
function hasChanged(allRows) {
  if (allRows.length < 2) return false;
  const sorted = [...allRows].sort((a, b) => cmpDate(a.date1, b.date1));
  const sig = r => {
    const q = parseFloat(r.qty),
      d = parseFloat(r.days);
    const dose = !isNaN(q) && !isNaN(d) && d > 0 ? Math.round(q / d * 10) / 10 : null;
    return `${r.freq}|${dose}`;
  };
  const first = sig(sorted[0]);
  return sorted.some(r => sig(r) !== first);
}

// ── 修正後的 format 核心邏輯 ───────────────────────────────────────────────────

function extractBrandName(drugName) {
  if (!drugName) return "";
  let n = drugName.trim();
  n = n.replace(/\s*"[^"]*"\s*$/g, "");
  n = n.replace(/\s*\([^)]*\)\s*$/g, "");
  
  // 修改：保留 Solution, Syrup, Suspension, Drop, Injection 等劑型關鍵字
  const cutRe = /\s+(tablets?|capsules?|caplets?|f\.?c\.?\s*tablets?|film-?coated\s+tablets?|sustained-?released?\s+tablets?|enteric-?microencapsulated\s+capsules?|o\.?d\.?t\.?|la\b|sr\b|xr\b|cr\b|er\b|ir\b)\b/i;
  const m = n.match(cutRe);
  if (m) n = n.slice(0, m.index).trim();

  // 移除末尾純數字強度，但保留複合型如 mg/mL
  n = n.replace(/\s+\d+(?:\.\d+)?\s*(?:mg|mcg|ug|g|%|iu|units?)(?:\/\d*\s*(?:ml|l|g))?$/gi, "");
  return n.replace(/[,.\-:]\s*$/, "").trim();
}

function extractStrength(drugName) {
  const dn = drugName || "";
  // 0. 複方優先：抓 數字/數字 (+ 可選單位)，例 "2/10 Mg"、"10/20"
  const c = dn.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?:\s*(mg|mcg|ug|g|iu|IU|units?))?/i);
  if (c) {
    let unit = c[3] ? c[3].toLowerCase() : "";
    if (unit === "ug") unit = "mcg";
    if (unit === "iu" || unit === "units") unit = "IU";
    return { val: unit ? `${c[1]}/${c[2]} ${unit}` : `${c[1]}/${c[2]}`, unit: "" };
  }
  // 支援 100 mg/1 mL, 100mg/mL, 500mg 等格式
  const m = dn.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ug|g|%|iu|IU|units?)(?:\/(\d*)\s*(ml|l|g))?/i);
  if (!m) return null;

  let val = m[1];
  let unit = m[2].toLowerCase();
  let perVal = m[3] || "";
  let perUnit = m[4] ? m[4].toLowerCase() : "";

  if (unit === "ug") unit = "mcg";
  if (unit === "iu" || unit === "units") unit = "IU";

  // A space between the number and its unit — "40 mg", not "40mg". Percent
  // stays tight ("5%"), which is how it is written.
  let strengthStr = unit === "%" ? val + unit : val + " " + unit;
  if (perUnit) {
    strengthStr += "/" + (perVal ? perVal + " " : "") + perUnit;
  }

  return { val: strengthStr, unit: "" };
}

function getFreqDivisor(freq) {
  if (!freq) return 1;
  let f = freq.toUpperCase().trim().replace(/[\s\+&]/g, "");

  const exactMap = {
    // 每日一次
    "QD": 1, "QDAC": 1, "QDPC": 1, "QDAM": 1, "QDPM": 1, "QDHS": 1, "QN": 1, "HS": 1, "STAT": 1, "ONCE": 1,
    "QDPC1HR": 1, "QDAC1HR": 1, "QDAC2HR": 1, "QDAC15": 1, "QDAC30": 1,
    // 每日兩次
    "BID": 2, "BIDAC": 2, "BIDPC": 2, "Q12H": 2, "Q12HAC": 2, "Q12HPC": 2, "BIDAC1HR": 2, "BIDAC30": 2,
    // 每日三次
    "TID": 3, "TIDAC": 3, "TIDPC": 3, "Q8H": 3, "Q8HAC": 3, "Q8HPC": 3, "BIDHS": 3, "BIDACHS": 3, "TIDAC30": 3,
    // 每日四次
    "QID": 4, "QIDAC": 4, "QIDPC": 4, "Q6H": 4, "Q6HAC": 4, "Q6HPC": 4, "TIDHS": 4,
    // 每日更多次
    "5XDAY": 5, "5X/DAY": 5, "Q4H": 6, "Q3H": 8, "Q2H": 12, "Q1H": 24,
    // 週期性
    "QOD": 0.5, "Q3D": 1/3, "Q4D": 1/4, "QW": 1/7, "BIW": 2/7, "TIW": 3/7, "Q2W": 1/14, "Q4W": 1/28, "Q1M": 1/30, "Q3M": 1/84
  };

  if (exactMap[f] !== undefined) return exactMap[f];
  
  // 模糊匹配
  if (f.includes("QOD")) return 0.5;
  if (f.includes("QID")) return 4;
  if (f.includes("TID")) return 3;
  if (f.includes("BID")) return 2;
  if (f.includes("QD"))  return 1;
  
  // 處理 QxH 正則
  let m = f.match(/Q(\d+)H/);
  if (m) return 24 / parseInt(m[1]);

  return 1; 
}

function formatDrugParts(r, opts) {
  const ingName = stripSalt(r.ingName);
  const brandName = extractBrandName(r.drugName);
  const nameDisplay = opts.nameMode === "both" && brandName && brandName !== ingName
    ? brandName + " (" + ingName + ")"
    : opts.nameMode === "brand" ? (brandName || ingName) : ingName;
    
  const strength = extractStrength(r.drugName);
  const formInfo = inferDoseUnit(r.drugName, r.unit);
  const strengthStr = strength ? strength.val : "";
  
  let doseStr = "";
  if (!formInfo.isNoDose && formInfo.unit) {
    const qty = parseFloat(r.qty),
      days = parseFloat(r.days);
    if (!isNaN(qty) && !isNaN(days) && days > 0 && qty > 0) {
      const totalDaily = qty / days;
      const freqDiv = getFreqDivisor(r.freq);
      let dr = totalDaily / freqDiv;
      
      // mL 水劑特殊處理
      if (formInfo.unit.toLowerCase() === "ml") {
          // 容許 0.2 以內的誤差自動修正為整數
          dr = (Math.abs(dr - Math.round(dr)) < 0.2) ? Math.round(dr) : Math.round(dr * 2) / 2;
      } else {
          dr = Math.round(dr * 10) / 10;
      }
      
      if (dr > 0) doseStr = `${dr} ${formInfo.unit}`;
    }
  }
  
  const freqStr = r.freq || "";
  let daysStr = "";
  if (opts.showDays) {
    const d = parseFloat(r.days);
    if (!isNaN(d) && d > 0) daysStr = `${d}天`;
  }
  return {
    name: nameDisplay,
    strength: strengthStr,
    dose: doseStr,
    freq: freqStr,
    days: daysStr
  };
}
function visualWidth(s) {
  let w = 0;
  for (const c of s) {
    const code = c.codePointAt(0);
    if (code >= 0x2E80 && code <= 0x9FFF || code >= 0xAC00 && code <= 0xD7AF || code >= 0xF900 && code <= 0xFAFF || code >= 0xFF00 && code <= 0xFF60) w += 2;else w += 1;
  }
  return w;
}
function padRightVisual(s, width) {
  const gap = width - visualWidth(s);
  return s + (gap > 0 ? " ".repeat(gap) : "");
}
function padLeftVisual(s, width) {
  const gap = width - visualWidth(s);
  return (gap > 0 ? " ".repeat(gap) : "") + s;
}
function layoutPartsLines(partsList, opts, externalWidths) {
  const mode = opts.alignColumns === true ? "local"
             : opts.alignColumns === false ? "none"
             : (opts.alignColumns || "none");
  if (mode === "none") {
    return partsList.map(p => {
      const segs = [p.name, p.strength, p.dose, p.freq, p.days].filter(Boolean);
      return segs.join("    ");
    });
  }
  const cols = ["name", "strength", "dose", "freq", "days"];
  let widths;
  if (externalWidths) {
    widths = externalWidths;
  } else {
    widths = {};
    for (const c of cols) widths[c] = Math.max(0, ...partsList.map(p => visualWidth(p[c] || "")));
  }
  return partsList.map(p => {
    const parts = [];
    for (const c of cols) {
      if ((widths[c] || 0) === 0) continue;
      parts.push((c === "name" || c === "freq") ? padRightVisual(p[c] || "", widths[c]) : padLeftVisual(p[c] || "", widths[c]));
    }
    return parts.join("    ").trimEnd();
  });
}

function computeGlobalWidths(allPartsList) {
  const cols = ["name", "strength", "dose", "freq", "days"];
  const widths = {};
  for (const c of cols) widths[c] = Math.max(0, ...allPartsList.map(p => visualWidth(p[c] || "")));
  return widths;
}

// ── grouping ──────────────────────────────────────────────────────────────────

// Helper: does this row produce a calculable per-day dose?
function rowHasDose(r) {
  const formInfo = inferDoseUnit(r.drugName, r.unit);
  if (formInfo.isNoDose || !formInfo.unit) return false;
  const qty = parseFloat(r.qty),
    days = parseFloat(r.days);
  if (isNaN(qty) || isNaN(days) || days <= 0 || qty <= 0) return false;
  const dr = Math.round(qty / days * 10) / 10;
  return Math.abs(dr - Math.round(dr)) < 0.05 ? Math.round(dr) > 0 : dr > 0;
}

// later of two YYYY/M/D date strings (for 連續處方 refills, use the most recent dispensing)
function laterDate(a, b) {
  const ok = s => /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s || "");
  const va = ok(a) ? a : null, vb = ok(b) ? b : null;
  if (va && vb) return cmpDate(vb, va) > 0 ? vb : va;
  return va || vb || (a || "");
}
// Helper: is this row's supply expired?
// Macro logic: end = (latest dispensing date) + days + 彈性緩衝(grace, default 14); expired if today > end.
function isExpired(r, graceDays) {
  try {
    const g = (graceDays == null || isNaN(graceDays)) ? 14 : graceDays;
    const parts = laterDate(r.date1, r.date2).split("/");
    if (parts.length !== 3) return false;
    const visitDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = parseFloat(r.days) || 0;
    const expiry = new Date(visitDate);
    expiry.setDate(expiry.getDate() + days + g);
    return expiry < new Date();
  } catch {
    return false;
  }
}
function groupByInstitution(latestRows) {
  // Group by date + institution
  const groups = new Map();
  for (const r of latestRows) {
    const key = `${r.date1}|${r.institution || "未知機構"}`;
    if (!groups.has(key)) groups.set(key, {
      date: r.date1,
      inst: r.institution || "未知機構",
      rows: []
    });
    groups.get(key).rows.push(r);
  }
  // Sort by date desc first, then institution — pure chronological across all institutions
  const sorted = Array.from(groups.entries()).sort((a, b) => cmpDate(b[1].date, a[1].date) || a[1].inst.localeCompare(b[1].inst));
  // Within each group: sort alphabetically
  for (const [, g] of sorted) g.rows.sort((a, b) => a.ingName.localeCompare(b.ingName));
  return sorted;
}

// ── copy text ─────────────────────────────────────────────────────────────────

// Find modal (most common) days value in a group of rows
function modalDaysCopy(rows) {
  const freq = {};
  for (const r of rows) {
    const d = parseFloat(r.days);
    if (!isNaN(d) && d > 0) freq[d] = (freq[d] || 0) + 1;
  }
  let best = null,
    bestCount = 0;
  for (const [d, c] of Object.entries(freq)) {
    if (c > bestCount) {
      best = parseFloat(d);
      bestCount = c;
    }
  }
  return best;
}
// Keep the common duration in the visit header and show only row exceptions.
function visitDrugParts(rows, opts) {
  const commonDays = opts.showDays ? modalDaysCopy(rows) : null;
  const partsList = rows.map(r => {
    const parts = formatDrugParts(r, opts);
    if (commonDays !== null && parseFloat(r.days) === commonDays) parts.days = "";
    return parts;
  });
  return { commonDays, partsList };
}
function buildCopyText(groups, dedupMap, opts) {
  // Common dispensing days belong to the visit header; exceptions stay on rows.
  const rowOpts = opts;
  const globalWidths = (opts.alignColumns === "global")
    ? computeGlobalWidths(groups.flatMap(([, { rows }]) => rows.map(r => formatDrugParts(r, rowOpts))))
    : null;
  const out = [];
  for (const [, {
    date,
    inst,
    rows
  }] of groups) {
    const { commonDays, partsList } = visitDrugParts(rows, rowOpts);
    out.push(`【${inst}】${fmtDate(date)}${commonDays !== null ? `　${commonDays}天` : ""}`);
    const lines = layoutPartsLines(partsList, rowOpts, globalWidths);
    rows.forEach((r, i) => {
      const key = r.ingName.toLowerCase().trim();
      const entry = dedupMap.get(key);
      let line = lines[i];
      const tags = [];
      if (opts.showRegular && entry && isRegular(entry.allRows)) tags.push("定期");
      if (opts.showChanged && entry && hasChanged(entry.allRows)) tags.push("用法有變");
      if (tags.length) line += `  [${tags.join("・")}]`;
      out.push(line);
    });
    out.push("");
  }
  return out.join("\n").trim();
}

// ── persisted state hook ──────────────────────────────────────────────────────

function usePersistedState(key, defaultValue) {
  const [val, setVal] = useState(() => {
    const saved = globalThis.medicationSettings?.[key];
    if (typeof saved !== typeof defaultValue || saved === null ||
        (typeof saved === "number" && !Number.isFinite(saved))) return defaultValue;
    return saved;
  });
  useEffect(() => {
    if (Object.is(globalThis.medicationSettings?.[key], val)) return;
    globalThis.medicationSettings[key] = val;
    globalThis.saveMedicationSettings({[key]:val});
  }, [key, val]);
  return [val, setVal];
}

// ── comparison view builder ───────────────────────────────────────────────────

// Pivot allRows into a comparison matrix:
//   columns = unique visit dates (newest first), each with institution
//   rows = unique drugs by NHI code, each with cells per visit date
//   active = Set of drug keys that appear in each institution's most recent visit
function buildComparison(allRows, opts, dedupMap) {
  // Group rows by DATE only (merge institutions on the same day)
  const colMap = new Map(); // date → { date, insts:Set, rows[] }
  for (const r of allRows) {
    const key = r.date1;
    if (!colMap.has(key)) colMap.set(key, {
      date: r.date1,
      insts: new Set(),
      rows: []
    });
    const c = colMap.get(key);
    c.insts.add(r.institution);
    c.rows.push(r);
  }
  // Normalize institution list; sort by date desc
  const cols = Array.from(colMap.values()).map(c => ({
    date: c.date,
    inst: Array.from(c.insts).join(" / "),
    rows: c.rows
  })).sort((a, b) => cmpDate(b.date, a.date));

  // Most recent visit date across all data (we treat everything from that date as "active")
  let latestOverall = "";
  for (const r of allRows) {
    if (!latestOverall || cmpDate(r.date1, latestOverall) > 0) latestOverall = r.date1;
  }

  // A drug is "active" if it appears on the latest date
  const activeKeys = new Set();
  for (const r of allRows) {
    if (r.date1 === latestOverall) {
      const key = drugKey(r);
      activeKeys.add(key);
    }
  }

  // Build row map
  const rowMap = new Map();
  cols.forEach((col, ci) => {
    for (const r of col.rows) {
      const key = drugKey(r);
      if (!rowMap.has(key)) {
        const parts0 = formatDrugParts(r, opts);
        rowMap.set(key, {
          key,
          displayName: parts0.name,
          strength: parts0.strength,
          ingNameLower: r.ingName.toLowerCase().trim(),
          cells: new Map(),
          firstSeenColIdx: ci,
          isActive: activeKeys.has(key)
        });
      }
      const entry = rowMap.get(key);
      const cellParts = formatDrugParts(r, opts);
      if (!entry.strength && cellParts.strength) entry.strength = cellParts.strength;
      // If same drug appears twice on same day (e.g. from two institutions), keep the one already set;
      // user most likely cares about the prescription.
      if (!entry.cells.has(ci)) entry.cells.set(ci, cellParts);
    }
  });

  // Sort rows to match 整理結果 order:
  // 1. Group by latest visit date (desc) of each drug (from dedupMap)
  // 2. Within same date group, alphabetical by displayName
  const getLatestDate = key => {
    if (dedupMap) {
      const entry = dedupMap.get(key);
      if (entry) return fmtDate(entry.latest.date1);
    }
    // fallback: use first cell date
    const row = rowMap.get(key);
    if (row && row.cells.size > 0) return fmtDate(allRows.find(r => (drugKey(r)) === key)?.date1 || "");
    return "";
  };
  const sortedRows = Array.from(rowMap.values()).sort((a, b) => {
    const da = getLatestDate(a.key),
      db = getLatestDate(b.key);
    if (da !== db) return db.localeCompare(da); // newer first
    return a.displayName.localeCompare(b.displayName);
  });
  return {
    cols,
    rows: sortedRows
  };
}

// Format a parts object into a single-line string for the cell (no strength — shown in row header)
function partsToInline(parts) {
  if (!parts) return "";
  const segs = [parts.dose, parts.freq, parts.days].filter(Boolean);
  return segs.join(" ");
}

// ── CompareTable component ────────────────────────────────────────────────────

function CompareTable({
  allRows,
  dedupMap,
  opts
}) {
  const {
    cols: allCols,
    rows: allDrugs
  } = useMemo(() => buildComparison(allRows, opts, dedupMap), [allRows, opts, dedupMap]);
  const [copiedTable, setCopiedTable] = useState(false);
  const [selectedDrugs, setSelectedDrugs] = useState(() => new Set()); // drug keys
  const [selectedDates, setSelectedDates] = useState(() => new Set()); // colKey "date|inst"

  // Set of drug keys that appear in the "整理結果" (dedupMap latest rows)
  const inResultKeys = useMemo(() => {
    const s = new Set();
    if (dedupMap) {
      for (const entry of dedupMap.values()) {
        const r = entry.latest;
        s.add(drugKey(r));
      }
    }
    return s;
  }, [dedupMap]);
  function colKey(c) {
    return `${c.date}|${c.inst}`;
  }

  // Get the set of drug keys present in a given column
  function drugsInCol(c) {
    return new Set(c.rows.map(r => drugKey(r)));
  }
  function toggleDrug(key) {
    setSelectedDrugs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);else next.add(key);
      return next;
    });
  }
  function toggleDate(c) {
    const k = colKey(c);
    const wasSelected = selectedDates.has(k);
    const newDates = new Set(selectedDates);
    if (wasSelected) newDates.delete(k);else newDates.add(k);
    setSelectedDates(newDates);

    // Recompute selected drugs as union of drugs from all currently selected dates,
    // preserving any drugs the user manually selected outside of date selection.
    setSelectedDrugs(prev => {
      // Drugs that were ONLY there because of the toggled date
      const drugsOfThisDate = drugsInCol(c);
      // Build union of drugs from all OTHER selected dates
      const drugsFromOtherSelectedDates = new Set();
      for (const col of allCols) {
        if (newDates.has(colKey(col))) {
          for (const k of drugsInCol(col)) drugsFromOtherSelectedDates.add(k);
        }
      }
      // Drugs the user manually selected (not driven by date selection):
      // these are drugs in `prev` that are NOT in the previously-selected-date union
      const prevDateUnion = new Set();
      for (const col of allCols) {
        if (selectedDates.has(colKey(col))) {
          for (const k of drugsInCol(col)) prevDateUnion.add(k);
        }
      }
      const manuallyKept = new Set([...prev].filter(k => !prevDateUnion.has(k)));
      // Final selection = manually kept + drugs from currently selected dates
      const next = new Set(manuallyKept);
      for (const k of drugsFromOtherSelectedDates) next.add(k);
      return next;
    });
  }
  function clearDrugs() {
    setSelectedDrugs(new Set());
  }
  function clearDates() {
    setSelectedDates(new Set());
  }

  // Group drugs into 3 buckets: selected (top), in-result (main), out-of-result (bottom)
  const orderedDrugs = useMemo(() => {
    const sel = [],
      inResult = [],
      outResult = [];
    for (const r of allDrugs) {
      if (selectedDrugs.has(r.key)) sel.push(r);else if (inResultKeys.has(r.key)) inResult.push(r);else outResult.push(r);
    }
    return {
      sel,
      inResult,
      outResult
    };
  }, [allDrugs, selectedDrugs, inResultKeys]);

  // Reorder columns: selected first (in date-desc order), then unselected (in date-desc order)
  const orderedCols = useMemo(() => {
    const sel = [],
      unsel = [];
    for (const c of allCols) (selectedDates.has(colKey(c)) ? sel : unsel).push(c);
    return [...sel, ...unsel];
  }, [allCols, selectedDates]);

  // Map original col idx → new col idx (for cells.get())
  const colIdxMap = useMemo(() => {
    const m = new Map();
    orderedCols.forEach((c, newIdx) => {
      const origIdx = allCols.findIndex(x => x.date === c.date && x.inst === c.inst);
      m.set(newIdx, origIdx);
    });
    return m;
  }, [orderedCols, allCols]);
  function copyTableTSV() {
    const drugsToExport = selectedDrugs.size > 0
      ? orderedDrugs.sel
      : [...orderedDrugs.sel, ...orderedDrugs.inResult, ...orderedDrugs.outResult];

    // Build raw cell content for every drug × column
    const colHeaders = orderedCols.map(c => `${fmtDate(c.date)} ${c.inst}`);
    const drugRows = drugsToExport.map(r => {
      const nameCol = r.strength ? `${r.displayName} ${r.strength}` : r.displayName;
      const cells = orderedCols.map((_, ci) => {
        const origIdx = colIdxMap.get(ci);
        const p = r.cells.get(origIdx);
        if (!p) return "—";
        // Check ditto vs newer
        let newerCell = null;
        for (let k = origIdx - 1; k >= 0; k--) {
          const c = r.cells.get(k);
          if (c) { newerCell = c; break; }
        }
        if (opts.showDitto && newerCell) {
          const sigA = `${p.dose}|${p.freq}|${p.days}`;
          const sigB = `${newerCell.dose}|${newerCell.freq}|${newerCell.days}`;
          if (sigA === sigB) return "〃";
        }
        return partsToInline(p) || "—";
      });
      return { nameCol, cells };
    });

    // Compute column widths for fixed-width alignment
    const nameW = Math.max(
      visualWidth("藥品"),
      ...drugRows.map(r => visualWidth(r.nameCol))
    );
    const colW = colHeaders.map((h, ci) => Math.max(
      visualWidth(h),
      ...drugRows.map(r => visualWidth(r.cells[ci]))
    ));

    // Build aligned output
    const SEP = "  ";
    const header = padRightVisual("藥品", nameW) + SEP + colHeaders.map((h, i) => padRightVisual(h, colW[i])).join(SEP);
    const divider = "─".repeat(visualWidth(header));
    const dataLines = drugRows.map(({ nameCol, cells }) =>
      padRightVisual(nameCol, nameW) + SEP + cells.map((c, i) => padRightVisual(c, colW[i])).join(SEP)
    );

    const text = [header, divider, ...dataLines].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2000);
    });
  }
  if (!allDrugs.length) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 20,
        color: "#666",
        fontSize: 14
      }
    }, "\u6C92\u6709\u53EF\u6BD4\u8F03\u7684\u8CC7\u6599\u3002");
  }
  const copyCount = selectedDrugs.size > 0 ? selectedDrugs.size : allDrugs.length;

  // Helper: get cell content to display; returns "〃" if same as the chronologically NEXT NEWER column
  function cellDisplay(rowEntry, newColIdx) {
    const origIdx = colIdxMap.get(newColIdx);
    const here = rowEntry.cells.get(origIdx);
    if (!here) return {
      text: "—",
      isDitto: false,
      hasValue: false
    };

    // Find the next chronologically newer column (lower origIdx = newer date in allCols)
    // that also has data for this drug
    let newerCell = null;
    for (let k = origIdx - 1; k >= 0; k--) {
      const c = rowEntry.cells.get(k);
      if (c) {
        newerCell = c;
        break;
      }
    }
    if (newerCell) {
      const sigA = `${here.dose}|${here.freq}|${here.days}`;
      const sigB = `${newerCell.dose}|${newerCell.freq}|${newerCell.days}`;
      if (sigA === sigB && opts.showDitto) return { text: "〃", isDitto: true, hasValue: true };
    }
    return {
      text: partsToInline(here),
      isDitto: false,
      hasValue: true
    };
  }
  const renderRow = (r, ri, isSelected) => {
    const isOut = !isSelected && !inResultKeys.has(r.key); // drug is not in 整理結果
    return /*#__PURE__*/React.createElement("tr", {
      key: r.key,
      style: {
        background: isSelected ? "#fffbe8" : ri % 2 ? "#fafafa" : "#fff"
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        ...styles.tdFirst,
        cursor: "pointer",
        background: isSelected ? "#fffbe8" : "inherit"
      },
      onClick: () => toggleDrug(r.key),
      title: isSelected ? "點擊取消選取" : "點擊選取（移到上方）"
    }, isSelected && /*#__PURE__*/React.createElement("span", {
      style: styles.drugSelected
    }, "\u2605"), /*#__PURE__*/React.createElement("span", {
      style: {
        ...styles.drugName,
        color: isSelected ? "#8a4a00" : isOut ? "#888" : "#111"
      }
    }, r.displayName), r.strength && /*#__PURE__*/React.createElement("span", {
      style: styles.drugStrengthInline
    }, " ", r.strength)), orderedCols.map((c, ci) => {
      const disp = cellDisplay(r, ci);
      // Changed = has value, is NOT ditto, and there IS a chronologically newer cell to compare to
      let changed = false;
      if (disp.hasValue && !disp.isDitto) {
        const origIdx = colIdxMap.get(ci);
        for (let k = origIdx - 1; k >= 0; k--) {
          if (r.cells.has(k)) {
            changed = true;
            break;
          }
        }
      }
      const isDateSel = selectedDates.has(colKey(c));
      return /*#__PURE__*/React.createElement("td", {
        key: ci,
        style: {
          ...styles.td,
          ...(isDateSel ? styles.tdSelectedCol : {}),
          ...(changed ? styles.tdChanged : {}),
          ...(disp.isDitto ? styles.tdDitto : {}),
          ...(isOut && !changed ? styles.tdOut : {})
        }
      }, disp.hasValue ? /*#__PURE__*/React.createElement("span", {
        style: disp.isDitto ? styles.dittoMark : undefined
      }, disp.text) : /*#__PURE__*/React.createElement("span", {
        style: styles.empty
      }, "\u2014"));
    }));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: styles.compareWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.compareToolbar
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.compareInfoBox
  }, /*#__PURE__*/React.createElement("span", {
    style: styles.compareInfo
  }, allDrugs.length, " \u7A2E\u85E5\u54C1 \xD7 ", allCols.length, " \u6B21\u5C31\u8A3A"), selectedDrugs.size > 0 && /*#__PURE__*/React.createElement("span", {
    style: styles.compareBaseline
  }, "\xB7 \u5DF2\u9078 ", selectedDrugs.size, " \u7A2E"), selectedDates.size > 0 && /*#__PURE__*/React.createElement("span", {
    style: styles.compareBaseline
  }, "\xB7 \u5DF2\u9078 ", selectedDates.size, " \u500B\u65E5\u671F")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, selectedDrugs.size > 0 && /*#__PURE__*/React.createElement("button", {
    style: styles.btnLink,
    onClick: clearDrugs
  }, "\u6E05\u9664\u85E5\u54C1\u9078\u64C7"), selectedDates.size > 0 && /*#__PURE__*/React.createElement("button", {
    style: styles.btnLink,
    onClick: clearDates
  }, "\u6E05\u9664\u65E5\u671F\u9078\u64C7"), /*#__PURE__*/React.createElement("button", {
    style: copiedTable ? styles.btnCopiedDark : styles.btnCopyDark,
    onClick: copyTableTSV
  }, copiedTable ? "✓ 已複製" : `複製 ${copyCount} 筆`))), /*#__PURE__*/React.createElement("div", {
    style: styles.compareHint
  }, "\u4E0A\u65B9\u70BA\u5404\u6A5F\u69CB\u6700\u65B0\u8655\u65B9\u4E2D\u7684\u85E5\uFF1B\u4E0B\u65B9\u70BA\u904E\u53BB\u66FE\u7528\u3001\u8FD1\u671F\u672A\u518D\u958B\u7684\u85E5\u3002\u9EDE\u64CA\u85E5\u540D\u53EF\u7F6E\u9802\uFF1B\u9EDE\u64CA\u65E5\u671F\u53EF\u79FB\u5230\u5DE6\u5074"), /*#__PURE__*/React.createElement("div", {
    style: styles.compareScroll
  }, /*#__PURE__*/React.createElement("table", {
    style: styles.compareTable
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: styles.thFirst
  }, "\u85E5\u54C1"), orderedCols.map((c, ci) => {
    const isSel = selectedDates.has(colKey(c));
    // Show year only for the leftmost col or when year differs from col to the left
    const myYear = c.date.split("/")[0];
    const prevYear = ci > 0 ? orderedCols[ci - 1].date.split("/")[0] : null;
    const showYear = ci === 0 || myYear !== prevYear;
    const dateText = showYear ? fmtDate(c.date) : fmtDateShort(c.date);
    return /*#__PURE__*/React.createElement("th", {
      key: ci,
      style: {
        ...styles.th,
        ...(isSel ? styles.thSelected : {}),
        cursor: "pointer"
      },
      onClick: () => toggleDate(c),
      title: isSel ? "點擊取消選取" : "點擊選取（移至左側）"
    }, /*#__PURE__*/React.createElement("div", {
      style: styles.thDate
    }, isSel && "★ ", dateText), /*#__PURE__*/React.createElement("div", {
      style: styles.thInst
    }, c.inst));
  }))), /*#__PURE__*/React.createElement("tbody", null, orderedDrugs.sel.length > 0 && /*#__PURE__*/React.createElement("tr", {
    style: styles.divider
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: orderedCols.length + 1,
    style: {
      ...styles.dividerCell,
      ...styles.dividerCellSel
    }
  }, "\u2605 \u5DF2\u9078\u53D6\u85E5\u54C1\uFF08", orderedDrugs.sel.length, "\uFF09")), orderedDrugs.sel.map((r, ri) => renderRow(r, ri, true)), orderedDrugs.inResult.length > 0 && /*#__PURE__*/React.createElement("tr", {
    style: styles.divider
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: orderedCols.length + 1,
    style: styles.dividerCell
  }, "\u76EE\u524D\u8655\u65B9\uFF08", orderedDrugs.inResult.length, "\uFF09")), orderedDrugs.inResult.map((r, ri) => renderRow(r, ri, false)), orderedDrugs.outResult.length > 0 && /*#__PURE__*/React.createElement("tr", {
    style: styles.divider
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: orderedCols.length + 1,
    style: {
      ...styles.dividerCell,
      ...styles.dividerCellOut
    }
  }, "\u5176\u4ED6\uFF08\u77ED\u671F\u7528\u85E5\uFF0F\u5DF2\u505C\u7528\uFF0F\u5C1A\u672A\u9818\u85E5\uFF09\uFF08", orderedDrugs.outResult.length, "\uFF09")), orderedDrugs.outResult.map((r, ri) => renderRow(r, ri, false))))), /*#__PURE__*/React.createElement("div", {
    style: styles.compareLegend
  }, /*#__PURE__*/React.createElement("span", {
    style: styles.legendDot
  }), /*#__PURE__*/React.createElement("span", null, "\u6A58\u5E95\uFF1D\u5291\u91CF\u6216\u983B\u7387\u6709\u8B8A\u52D5\u3000\u3000\u3003\uFF1D\u8207\u5DE6\u5074\uFF08\u8F03\u65B0\uFF09\u4E00\u6B21\u76F8\u540C")));
}

// ── HelpModal component ───────────────────────────────────────────────────────

function HelpSection({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: helpStyles.section
  }, /*#__PURE__*/React.createElement("div", {
    style: helpStyles.sectionTitle
  }, title), children);
}
function HelpRow({
  label,
  desc
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: helpStyles.row
  }, /*#__PURE__*/React.createElement("span", {
    style: helpStyles.label
  }, label), /*#__PURE__*/React.createElement("span", {
    style: helpStyles.desc
  }, desc));
}
function HelpModal({
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: helpStyles.overlay,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: helpStyles.modal,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: helpStyles.header
  }, /*#__PURE__*/React.createElement("span", {
    style: helpStyles.title
  }, "\u4F7F\u7528\u8AAA\u660E"), /*#__PURE__*/React.createElement("button", {
    style: helpStyles.closeBtn,
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: helpStyles.body
  }, /*#__PURE__*/React.createElement(HelpSection, {
    title: "\u5FEB\u901F\u958B\u59CB"
  }, /*#__PURE__*/React.createElement("div", {
    style: helpStyles.steps
  }, /*#__PURE__*/React.createElement("div", {
    style: helpStyles.step
  }, /*#__PURE__*/React.createElement("span", {
    style: helpStyles.stepNum
  }, "1"), "\u5728\u5065\u4FDD\u96F2\u7AEF\u85E5\u6B77\u9801\u9762\u5168\u9078\uFF08Ctrl+A\uFF09\u4E26\u8907\u88FD\uFF08Ctrl+C\uFF09"), /*#__PURE__*/React.createElement("div", {
    style: helpStyles.step
  }, /*#__PURE__*/React.createElement("span", {
    style: helpStyles.stepNum
  }, "2"), "\u8CBC\u5230\u4E0B\u65B9\u6587\u5B57\u6846\uFF08Ctrl+V\uFF09"), /*#__PURE__*/React.createElement("div", {
    style: helpStyles.step
  }, /*#__PURE__*/React.createElement("span", {
    style: helpStyles.stepNum
  }, "3"), "\u6309\u300C\u6574\u7406\u85E5\u6B77\u300D\uFF0C\u518D\u6309\u300C\u4E00\u9375\u8907\u88FD\u300D")), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u652F\u63F4\u683C\u5F0F",
    desc: "Edge IE \u6A21\u5F0F\u3001Chrome\u3001Excel \u8CBC\u4E0A\u7684\u683C\u5F0F\u90FD\u6703\u81EA\u52D5\u8FA8\u8B58\uFF0C\u4E0D\u7528\u5148\u6574\u7406"
  })),/*#__PURE__*/React.createElement(HelpSection, {
    title: "\u6574\u7406\u908F\u8F2F"
  }, /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u9810\u8A2D\u53EA\u986F\u793A",
    desc: "\u9580\u8A3A\u53CA\u85E5\u5C40\u7684\u9577\u671F\u8655\u65B9\uFF08\u226514\u5929\uFF09\uFF0C\u77ED\u671F\u9EDE\u6EF4\u3001\u6025\u8A3A\u7528\u85E5\u4E0D\u8A08\u5165"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u6BCF\u7A2E\u85E5\u53EA\u7559\u6700\u65B0",
    desc: "\u540C\u6210\u5206\u6709\u591A\u6B21\u9818\u85E5\uFF0C\u9810\u8A2D\u53EA\u986F\u793A\u6700\u65B0\u4E00\u7B46\uFF1B\u958B\u555F\u300C\u5B8C\u6574\u8A18\u9304\u300D\u53EF\u770B\u5168\u90E8\u6B77\u53F2"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u85E5\u54C1\u5224\u65B7\u4F9D\u64DA",
    desc: "\u4EE5\u5065\u4FDD\u78BC\u8B58\u5225\u540C\u4E00\u85E5\u54C1\uFF1B\u540C\u6210\u5206\u4E0D\u540C\u5EE0\u724C\u8996\u70BA\u540C\u4E00\u85E5\uFF0C\u4FDD\u7559\u6700\u65B0\u4E00\u7B46"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u904E\u671F\u8655\u65B9",
    desc: "\u5C31\u8A3A\u65E5 + \u7D66\u85E5\u5929\u6578 < \u4ECA\u65E5\uFF0C\u8A72\u7D44\u81EA\u52D5\u6DE1\u5316\u4E26\u6A19\u793A\u300C\u5DF2\u7121\u85E5\u91CF\u300D"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u5291\u91CF\u8A08\u7B97",
    desc: "\u85E5\u54C1\u7528\u91CF \xF7 \u7D66\u85E5\u5929\u6578\uFF08\u773C\u85E5\u6C34\u3001\u6CE8\u5C04\u5291\u4E0D\u8A08\u7B97\uFF09"
  })), /*#__PURE__*/React.createElement(HelpSection, {
    title: "\u9078\u9805\u8AAA\u660E"
  }, /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u50C5\u4FDD\u7559\u9580\u8A3A/\u85E5\u5C40",
    desc: "\u6392\u9664\u4F4F\u9662\u7528\u85E5\u7B49\u5176\u4ED6\u4F86\u6E90"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u6392\u9664\u77ED\u671F\u8655\u65B9",
    desc: "\u6392\u9664\u7D66\u85E5\u5929\u6578 < 14 \u5929\u7684\u8655\u65B9"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u986F\u793A\u5B8C\u6574\u9818\u85E5\u8A18\u9304",
    desc: "\u986F\u793A\u6240\u6709\u6B77\u6B21\u5C31\u8A3A\uFF0C\u4E0D\u53BB\u9664\u91CD\u8907\u85E5\u7269"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u986F\u793A\u7D66\u85E5\u5929\u6578",
    desc: "\u5929\u6578\u986F\u793A\u5728\u7FA4\u7D44\u6A19\u984C\uFF0C\u4E0D\u540C\u5929\u6578\u7684\u85E5\u53E6\u884C\u6A19\u793A"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u6A19\u793A\u5B9A\u671F\u9818\u85E5",
    desc: "\u540C\u6210\u5206\u51FA\u73FE 2 \u6B21\u4EE5\u4E0A \u2192 \u7DA0\u8272\u300C\u5B9A\u671F\u300D\u6A19\u7C64"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u6A19\u793A\u7528\u6CD5\u6709\u8B8A\u5316",
    desc: "\u5291\u91CF\u6216\u983B\u7387\u8DE8\u6B21\u6539\u8B8A \u2192 \u6A58\u8272\u300C\u7528\u6CD5\u6709\u8B8A\u300D\u6A19\u7C64"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u5C0D\u9F4A",
    desc: "\u95DC\u9589\u3001\u540C\u4E00\u5C31\u8A3A\u5167\u5C0D\u9F4A\u3001\u6216\u6240\u6709\u5C31\u8A3A\u5168\u90E8\u5C0D\u9F4A"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u85E5\u54C1\u540D\u7A31",
    desc: "\u5207\u63DB\u5B78\u540D\u3001\u5546\u54C1\u540D\u3001\u6216\u5546\u54C1\u540D\uFF08\u5B78\u540D\uFF09\u4E26\u5217"
  })), /*#__PURE__*/React.createElement(HelpSection, {
    title: "\u8868\u683C\u5448\u73FE\uFF08\u9032\u968E\uFF09"
  }, /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u958B\u555F",
    desc: "\u6574\u7406\u5B8C\u6210\u5F8C\u6309\u53F3\u4E0A\u89D2\u300C\u8868\u683C\u5448\u73FE\u300D\uFF0C\u756B\u9762\u6703\u81EA\u52D5\u653E\u5BEC"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u3003",
    desc: "\u8207\u5DE6\u6B04\uFF08\u8F03\u65B0\u4E00\u6B21\uFF09\u7528\u6CD5\u76F8\u540C\uFF0C\u4EE5\u3003\u986F\u793A\u6E1B\u5C11\u8996\u89BA\u5E72\u64FE"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u6A58\u8272\u5E95",
    desc: "\u8207\u5DE6\u6B04\u76F8\u6BD4\uFF0C\u5291\u91CF\u6216\u983B\u7387\u6709\u8B8A\u52D5"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u9EDE\u64CA\u85E5\u54C1\u540D",
    desc: "\u9078\u53D6\u7F6E\u9802\uFF0C\u8907\u88FD\u6642\u53EA\u8F38\u51FA\u5DF2\u9078\u85E5\u54C1"
  }), /*#__PURE__*/React.createElement(HelpRow, {
    label: "\u9EDE\u64CA\u65E5\u671F\u6B04",
    desc: "\u9078\u53D6\u4E26\u79FB\u5230\u5DE6\u5074\uFF0C\u81EA\u52D5\u9078\u53D6\u8A72\u65E5\u7684\u85E5\u54C1"
  })), React.createElement(HelpSection, { title: "自備藥核對" },
    React.createElement(HelpRow, { label: "用途", desc: "貼上雲端藥歷與自備藥醫囑，按「核對自備藥」跳到表格結果；「← 返回編輯」可修改後重新核對" }),
    React.createElement(HelpRow, { label: "整頁貼上", desc: "自備藥欄也可貼整個病人頁面，只會讀自備藥表；頁面內含雲端藥歷且雲端欄空白時直接使用。出院時重新開立的自備藥（起日在出院日當天或之後）與同藥同用法的重複醫囑不重複計入日量，列在結果頁下方" }),
    React.createElement(HelpRow, { label: "表一 自備藥 → 雲端", desc: "依醫囑順序對照雲端最近一次領藥，核對品項、含量、每日用量、頻率與剩餘藥量" }),
    React.createElement(HelpRow, { label: "表二 雲端 → 自備藥", desc: "雲端近 3／5／8 次或全部領藥由新到舊排列；綠底＝該次日量與自備藥相同，橘底＝不同，可看出自備藥用法來自哪幾次領藥" }),
    React.createElement(HelpRow, { label: "配對", desc: "先比商品名，再比成分（內建常用商品名對照、雲端成分欄、自訂對照）；同一藥品的多筆醫囑合併計算日量" }),
    React.createElement(HelpRow, { label: "相符／需確認／查無", desc: "需確認包含含量不同、劑量不同、頻率不同、部分成分相同、雲端已無藥量" }),
    React.createElement(HelpRow, { label: "未開自備藥", desc: "表二下方；參考日（自備藥起日）時仍在給藥天數＋緩衝內，卻沒有自備藥醫囑的品項標示「未開（仍有藥）」" }),
    React.createElement(HelpRow, { label: "入院前用藥紀錄", desc: "整理結果或自備藥核對結果頁按「入院前用藥紀錄」：列出參考日仍在用藥期間的雲端藥品（外觀圖、中英文藥名、白話用法、開立診斷），可在畫面上勾選病人回答後「複製確認結果」，或列印成紙本與病人逐項確認" }),
    React.createElement(HelpRow, { label: "藥品資料庫", desc: "自動下載食藥署公開資料（每 7 天更新，顯示選項可立即更新）；以健保碼對應許可證，複方顯示完整成分、自備藥商品名查成分，並顯示藥品外觀圖（約三成藥品有圖，滑過放大；結果頁「一鍵複製」左邊的「圖片：開／關」可隨時切換，「顯示選項」可選小／中／大／特大或自訂高度 px）。點縮圖或「仿單」開啟食藥署仿單資料頁核對中英文品名與許可證號；點「外觀圖」直接開啟食藥署藥品外觀詳細資料頁看原圖" }),
    React.createElement(HelpRow, { label: "一鍵複製", desc: "依整理結果格式（藥名顯示、對齊、天數沿用顯示選項）：先列雲端各藥最近一次領藥，再列自備藥，最後是不一致摘要" }),
    React.createElement(HelpRow, { label: "手動對應", desc: "查無或配錯時可從下拉選單指定雲端藥品；「記住對照」會保存商品名→成分，之後自動套用" })),
  React.createElement(HelpSection, { title: "出院用藥比較" },
    React.createElement(HelpRow, { label: "使用方式", desc: "病人頁面先按「轉床」「出院」，再 Ctrl+A 全選、Ctrl+C 複製，貼到左格；健保雲端藥歷貼在右格，這格與「整理結果」「自備藥核對」共用，任一頁貼過即可（右格空白時改用左格內容裡附帶的雲端藥歷）" }),
    React.createElement(HelpRow, { label: "入院日／出院日", desc: "入院日取轉床紀錄最早的起始時間（多次轉床也一樣）；出院日取未取消、最後設定的准許出院日（取消過幾次都會略過）。讀不到或都已取消時，日期欄會標示要手動輸入，可一鍵套用醫囑最早開方日、出院醫囑開方日或今天" }),
    React.createElement(HelpRow, { label: "比較方向", desc: "以出院後要用的藥為主：出院處方＋出院自備藥（起日為出院日當天或之後的自備藥醫囑，同藥同用法只列一次），逐項往前對照入院時仍有藥的雲端最近一次領藥；雲端沒有時才用入院時的自備藥。右側列出雲端近幾次領藥（近 3／5／8 次或全部），綠底＝日量與出院相同，橘底＝不同" }),
    React.createElement(HelpRow, { label: "四種結果", desc: "用法有變化（含量、日量、頻率不同）、新增（入院時雲端沒有藥；註記是否曾領過、住院中是否已使用）、沿用（只差飯前飯後等服用時間也算沿用，另註明）；最下方另列入院前有藥、出院未開的品項（入院時的自備藥出院時沒有重新開立也算）。出院自備藥與出院處方同成分時會提醒確認是否重複" }),
    React.createElement(HelpRow, { label: "出院用藥說明", desc: "結果頁按「出院用藥說明」：依出院處方號（含開立日期）分組，列出外觀圖、中英文藥名、白話用法、天數與總量，以及與入院前的差異；出院自備藥另列；入院前使用、出院未開立的藥在畫面上列出供藥師參考，預設不列印（可勾選列印）。供藥師向病人說明時列印使用，外觀圖預設顯示" }),
    React.createElement(HelpRow, { label: "一鍵複製", desc: "先列出院用藥（標示變化，附入院前用法），再列出院未開；病人資料只在畫面上，不會儲存" })),
  React.createElement(HelpSection, { title: "一鍵載入／讀取目前頁面" },
    React.createElement(HelpRow, { label: "一鍵載入", desc: "在 HIS 病人頁面點 Rx，到「出院用藥比較」或「自備藥核對」按「⚡ 一鍵載入」：自動按「轉床」「出院」（已顯示就不按，等頁面更新完才按下一個），再按「雲端」，從跳出的雲端視窗讀回雲端藥歷後關閉該視窗。結果與每個步驟（已按／已顯示／找不到按鈕）會顯示在按鈕旁" }),
    React.createElement(HelpRow, { label: "整理結果", desc: "「整理結果」的貼上欄有「⚡ 一鍵載入雲端藥歷」：只按「雲端」，讀回雲端視窗內容後直接整理（不會按轉床、出院）；讀到的雲端藥歷也同步給自備藥核對與出院用藥比較" }),
    React.createElement(HelpRow, { label: "用法", desc: "在 HIS 病人頁面或健保雲端藥歷頁面點工具列 Rx 開啟本工具，按「讀取目前頁面」直接讀入，不必全選複製。病人頁面會同時帶入「出院用藥比較」與「自備藥核對」；雲端藥歷帶入共用的雲端藥歷欄" }),
    React.createElement(HelpRow, { label: "跨分頁", desc: "在健保雲端分頁讀取後，30 分鐘內到 HIS 分頁開啟本工具，雲端藥歷欄下方會出現「另一分頁 hh:mm 讀取的健保雲端藥歷」，按「套用」即可；請核對時間與病人。暫存只在瀏覽器記憶體，關閉瀏覽器或按「清除」即刪除" }),
    React.createElement(HelpRow, { label: "限制", desc: "只在按下按鈕時操作或讀取本工具所在的分頁；按鈕依畫面上的文字「轉床」「出院」「雲端」尋找，同名按鈕不只一個時不會自動按。雲端視窗若在其他網域，需在該視窗全選複製貼上。獨立小視窗（如 IE 模式頁面）無法讀取。重新整理或換頁後需再點一次 Rx" })))));
}
const helpStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(7,19,27,0.55)",
    backdropFilter: "blur(2px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  modal: {
    background: "var(--surface)",
    width: "min(680px, 94vw)",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    boxShadow: "var(--shadow-lg)",
    fontFamily: "var(--sans)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    background: "var(--surface-3)",
    color: "var(--fg)",
    borderBottom: "1px solid var(--line)",
    boxShadow: "inset 3px 0 0 var(--accent-bright)",
    flexShrink: 0
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.08em"
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--fg-muted)",
    fontSize: 16,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1
  },
  body: {
    overflowY: "auto",
    padding: "0 0 22px",
    background: "var(--surface)"
  },
  section: {
    padding: "18px 24px 0"
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "var(--fg-muted)",
    fontFamily: "var(--mono)",
    borderBottom: "1px solid var(--line)",
    paddingBottom: 7,
    marginBottom: 11
  },
  row: {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: "4px 12px",
    padding: "5px 0",
    fontSize: 14,
    lineHeight: 1.65
  },
  label: {
    fontWeight: 700,
    color: "var(--fg)",
    fontFamily: "var(--mono)",
    fontSize: 14
  },
  desc: {
    color: "var(--fg-soft)"
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 8
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 14,
    color: "var(--fg-soft)",
    lineHeight: 1.65
  },
  stepNum: {
    flexShrink: 0,
    width: 20,
    height: 20,
    borderRadius: 6,
    background: "var(--accent)",
    color: "var(--on-accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    marginTop: 1
  }
};

// ── Toggle component ──────────────────────────────────────────────────────────

function SegmentedOption({ label, value, options, onChange }) {
  return React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--sans)", fontSize: 14, flexWrap: "wrap" }
  },
    React.createElement("span", { style: { color: "var(--fg-soft)", letterSpacing: "0.02em" } }, label),
    React.createElement("div", {
      style: {
        display: "flex",
        gap: 3,
        padding: 3,
        border: "1px solid var(--line)",
        borderRadius: 8,
        background: "var(--surface-2)"
      }
    },
      options.map(opt =>
        React.createElement("button", {
          key: opt.value,
          onClick: () => onChange(opt.value),
          className: "seg-btn" + (value === opt.value ? " on" : ""),
          style: {
            padding: "4px 11px",
            fontSize: 14,
            letterSpacing: "0.06em",
            fontFamily: "var(--mono)",
            border: "1px solid transparent",
            borderRadius: 5,
            background: value === opt.value ? "var(--accent)" : "transparent",
            color:      value === opt.value ? "var(--on-accent)" : "var(--fg-muted)",
            fontWeight: value === opt.value ? 700 : 400,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background .2s var(--ease), color .2s var(--ease), border-color .2s var(--ease)"
          }
        }, opt.label)
      )
    )
  );
}

function Toggle({label, checked, onChange}) {
  return React.createElement("label", {className:"toggle-control", style:styles.toggle},
    React.createElement("input", {type:"checkbox", role:"switch", checked,
      onChange:e=>onChange(e.target.checked), "aria-label":label}),
    React.createElement("span", {style:styles.toggleLabel}, label));
}

// ── Disclosure (collapsible control panel) ────────────────────────────────────

function Disclosure({ open, onToggle, title, meta, index, children }) {
  const h = React.createElement;
  return h("section", { style: styles.card, className: "disclosure no-print" },
    h("button", {
      className: "disc-head",
      style: styles.discHead,
      onClick: onToggle,
      "aria-expanded": open
    },
      index ? h("span", { style: styles.discIndex }, index) : null,
      
      h("span", { style: styles.discTitle }, title),
      h("span", { className:"disc-meta", style: styles.discMeta }, meta || ""),
      h("span", { className: "chev" + (open ? " open" : ""), style: styles.discChev }, "⌄")
    ),
    open ? h("div", { className: "disc-body", style: styles.cardBody }, children) : null
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────



function TimelineView({ allRows, dedupMap, opts, darkMode }) {
  const { cols: allCols, rows: allDrugs } = React.useMemo(
    () => buildComparison(allRows, opts, dedupMap), [allRows, opts, dedupMap]
  );
  const inResultKeys = React.useMemo(() => {
    const s = new Set();
    if (dedupMap) for (const e of dedupMap.values()) {
      const r = e.latest;
      s.add(drugKey(r));
    }
    return s;
  }, [dedupMap]);

  const [highlightKey, setHighlightKey] = React.useState(null);
  const [dayPx, setDayPx] = usePersistedState("med-org-timeline-dayPx", 4);
  const ZOOM_STEPS = [2, 3, 4, 6, 8, 12, 18, 28];
  const [rowH, setRowH] = usePersistedState("med-org-timeline-rowH", 36);
  const ROW_STEPS = [28, 32, 36, 44, 56, 72, 96];
  const [labelEvery, setLabelEvery] = usePersistedState("med-org-timeline-labelEvery", 0);
  const [showTlDays, setShowTlDays] = usePersistedState("med-org-timeline-showDays", true);
  const [showTlInst, setShowTlInst] = usePersistedState("med-org-timeline-showInst", true);
  const [showTodayLine, setShowTodayLine] = usePersistedState("med-org-timeline-showToday", true);
  const LABEL_OPTIONS = [
    { v: 0,  label: "自動" },
    { v: 1,  label: "每天" },
    { v: 2,  label: "每 2 天" },
    { v: 3,  label: "每 3 天" },
    { v: 7,  label: "每週" },
    { v: 14, label: "每 2 週" },
    { v: 30, label: "每月" }
  ];
  const inResult  = allDrugs.filter(r => inResultKeys.has(r.key));
  const outResult = allDrugs.filter(r => !inResultKeys.has(r.key));

  // Parse date string "YYYY/M/D" to JS Date
  function parseDate(s) {
    const p = s.split("/");
    return new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]));
  }
  function daysBetween(d1, d2) {
    return Math.round((d2 - d1) / 86400000);
  }

  // Build per-drug segments; deduplicate same drug on same date from different institutions
  const drugSegments = React.useMemo(() => {
    const dateMap = new Map(); // "key|date" → segment (dedupe)
    const orderMap = new Map(); // key → array of unique dateKeys in encounter order

    for (const r of allRows) {
      const key = drugKey(r);
      const days = parseFloat(r.days) || 0;
      if (days <= 0) continue;
      const startDate = parseDate(r.date1);
      const parts = formatDrugParts(r, opts);
      const dk = key + "|" + r.date1;

      if (!dateMap.has(dk)) {
        dateMap.set(dk, { startDate, dateStr: r.date1, days, parts, inst: r.institution || "" });
        if (!orderMap.has(key)) orderMap.set(key, []);
        orderMap.get(key).push(dk);
      } else {
        // Same drug same date: keep longer days, merge institution label
        const existing = dateMap.get(dk);
        if (days > existing.days) existing.days = days;
        if (r.institution && r.institution !== existing.inst) {
          existing.inst = existing.inst ? existing.inst + "/" + r.institution : r.institution;
        }
      }
    }

    const result = new Map();
    for (const [key, dks] of orderMap.entries()) {
      const segs = dks.map(dk => dateMap.get(dk)).sort((a, b) => a.startDate - b.startDate);
      result.set(key, segs);
    }
    return result;
  }, [allRows, opts]);

  // Compute global time range: earliest start → max(latest end, today)
  const timeRange = React.useMemo(() => {
    let minT = Infinity, maxT = -Infinity;
    for (const segs of drugSegments.values()) {
      for (const seg of segs) {
        if (seg.startDate < minT) minT = seg.startDate.getTime();
        const end = seg.startDate.getTime() + seg.days * 86400000;
        if (end > maxT) maxT = end;
      }
    }
    if (!isFinite(minT)) { minT = Date.now() - 90*86400000; maxT = Date.now(); }
    // Add small padding
    const padMs = 3 * 86400000;
    return { start: new Date(minT - padMs), end: new Date(maxT + padMs) };
  }, [drugSegments]);

  const totalDays = daysBetween(timeRange.start, timeRange.end);
  const NAME_W = 180;
  const DAY_PX = dayPx; // pixels per day (zoom-controlled)
  const TRACK_W = Math.max(400, totalDays * DAY_PX);
  const ROW_H = rowH;
  const BAR_H = Math.max(16, rowH - 18);

  function dateToX(date) {
    return daysBetween(timeRange.start, date) * DAY_PX;
  }

  function sigOf(p) { return p ? p.dose + "|" + p.freq + "|" + p.days : ""; }

  function renderDrugRow(r, isOut) {
    const isHL = highlightKey === r.key;
    const segs = drugSegments.get(r.key) || [];
    // Determine previous sig for change detection (compare chronologically: each segment to the previous one)
    const enrichedSegs = segs.map((seg, i) => {
      const prev = i > 0 ? segs[i-1] : null;
      const changed = prev && sigOf(seg.parts) !== sigOf(prev.parts);
      const same    = prev && !changed;
      const color   = changed ? "#e07820" : same ? "#c0c0c0" : "#5580b0";
      return { ...seg, changed, same, color };
    });

    // Reverse X-axis: newest on the LEFT
    // X of a date d = (totalDays - daysBetween(start, d)) * DAY_PX - width
    // Or simpler: flip by transform. We'll compute from the right edge.
    function xFromRight(date, widthPx) {
      return TRACK_W - dateToX(date) - widthPx;
    }

    return React.createElement("div", {
      key: r.key,
      style: {
        display: "flex", alignItems: "center", height: ROW_H,
        borderBottom: "1px solid #f0f0f0",
        background: isHL ? "#fffbe8" : "transparent",
        opacity: isOut ? 0.55 : 1,
      },
      onMouseEnter: () => setHighlightKey(r.key),
      onMouseLeave: () => setHighlightKey(null),
    },
      // Name cell
      React.createElement("div", {
        style: { width: NAME_W, flexShrink: 0, paddingRight: 10, paddingLeft: 4, overflow: "hidden", position: "sticky", left: 0, background: isHL ? (darkMode ? "#3a3520" : "#fffbe8") : (darkMode ? "#1a1a1a" : "#fff"), zIndex: 2, boxShadow: "1px 0 3px rgba(0,0,0,0.06)" }
      },
        React.createElement("div", { style: { fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace", fontSize: 14, fontWeight: "bold", color: isOut ? "#666" : (darkMode ? "#e0e0e0" : "#111"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, r.displayName),
        r.strength && React.createElement("div", { style: { fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace", fontSize: 14, color: "#aaa" } }, r.strength)
      ),
      // Timeline track
      React.createElement("div", {
        style: { width: TRACK_W, height: ROW_H, position: "relative", flexShrink: 0 }
      },
        enrichedSegs.map((seg, i) => {
          const widthPx = Math.max(12, seg.days * DAY_PX);
          const leftPx = xFromRight(seg.startDate, widthPx);
          const showDt = opts.showDitto && seg.same;
          let labelText;
          if (showDt) {
            labelText = "〃";
          } else {
            const p = seg.parts;
            const segs = [p.dose, p.freq].filter(Boolean);
            let txt = segs.join(" ");
            if (showTlDays) txt += " / " + seg.days + "天";
            labelText = txt;
          }
          const instText  = showTlInst ? seg.inst : "";
          return React.createElement("div", {
            key: i,
            style: {
              position: "absolute",
              left: leftPx + "px",
              top: (ROW_H - BAR_H) / 2,
              width: widthPx + "px",
              height: BAR_H,
              background: seg.color + "22",
              borderLeft: "4px solid " + seg.color,
              display: "flex", alignItems: "center",
              paddingLeft: 6, paddingRight: 4,
              overflow: "hidden", whiteSpace: "nowrap",
              fontSize: 14, fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
              color: seg.changed ? "#8a4a00" : seg.same ? "#888" : "#2a4a70",
              fontWeight: seg.changed ? "bold" : "normal",
            },
            title: [
              [seg.parts.dose, seg.parts.freq].filter(Boolean).join(" "),
              seg.days + "天",
              seg.inst,
              seg.dateStr
            ].filter(Boolean).join(" · "),
          },
            // ◀ at RIGHT edge (= 開藥日 position), pointing LEFT toward 迄日
            React.createElement("div", {
              style: {
                position: "absolute",
                right: 2, top: "50%",
                transform: "translateY(-50%)",
                width: 0, height: 0,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderRight: "7px solid " + seg.color,
                flexShrink: 0,
              }
            }),
            React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", paddingLeft: 6, paddingRight: 14 } },
              labelText,
              instText && React.createElement("span", { style: { marginLeft: 5, color: "#999", fontSize: 14 } },
                "· " + instText
              )
            )
          );
        })
      )
    );
  }

  // Time axis header: month ticks
  function renderTimeAxis() {
    // Show day ticks (every day) with labels on meaningful intervals
    const totalDaysInRange = daysBetween(timeRange.start, timeRange.end);
    let labelEveryEffective = labelEvery;
    if (labelEveryEffective === 0) {
      labelEveryEffective = 1;
      if (totalDaysInRange > 180) labelEveryEffective = 14;
      else if (totalDaysInRange > 90) labelEveryEffective = 7;
      else if (totalDaysInRange > 45) labelEveryEffective = 3;
      else if (totalDaysInRange > 21) labelEveryEffective = 2;
    }

    const ticks = [];
    const cur = new Date(timeRange.start);
    cur.setHours(0,0,0,0);
    while (cur <= timeRange.end) {
      ticks.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    return React.createElement("div", {
      style: { width: TRACK_W, height: 40, position: "relative", flexShrink: 0, borderBottom: "2px solid " + (darkMode ? "#e0e0e0" : "#111") }
    },
      ticks.map((d, i) => {
        const leftPx = TRACK_W - dateToX(d);
        const isFirstOfMonth = d.getDate() === 1;
        const showLabel = isFirstOfMonth || (i % labelEveryEffective === 0);
        const isToday   = daysBetween(d, new Date()) === 0;
        const prev = i > 0 ? ticks[i-1] : null;
        const showYear = isFirstOfMonth && (!prev || prev.getFullYear() !== d.getFullYear());

        return React.createElement("div", {
          key: i,
          style: {
            position: "absolute",
            left: (leftPx - 0.5) + "px",
            top: 0,
            width: 1,
            height: "100%",
            borderLeft: isFirstOfMonth ? ("1px solid " + (darkMode ? "#555" : "#999")) : (isToday ? "1px solid #d44" : ("1px solid " + (darkMode ? "#333" : "#eee"))),
          }
        },
          showLabel && React.createElement("div", {
            style: {
              position: "absolute",
              left: 2,
              top: showYear ? 12 : (isFirstOfMonth ? 12 : 22),
              fontSize: 14,
              fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
              color: isToday ? "#f66" : (isFirstOfMonth ? (darkMode ? "#ccc" : "#111") : (darkMode ? "#888" : "#666")),
              fontWeight: isFirstOfMonth ? "bold" : "normal",
              whiteSpace: "nowrap",
            }
          },
            isFirstOfMonth
              ? (String(d.getMonth()+1).padStart(2,"0") + "/" + String(d.getDate()).padStart(2,"0"))
              : String(d.getDate()).padStart(2,"0")
          ),
          showYear && React.createElement("div", {
            style: {
              position: "absolute",
              left: 2, top: 0,
              fontSize: 14, color: darkMode ? "#666" : "#bbb",
              whiteSpace: "nowrap",
            }
          }, d.getFullYear())
        );
      })
    );
  }

  return React.createElement("div", { style: { background: darkMode ? "#1a1a1a" : "#fff" } },
    React.createElement("div", {
      style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px", fontSize: 14, color: darkMode ? "#888" : "#888", background: darkMode ? "#242424" : "#fafafa", borderBottom: "1px solid " + (darkMode ? "#333" : "#eee"), flexWrap: "wrap", gap: 8 }
    },
      React.createElement("span", null, "最新在左 · 色條長度 = 給藥天數 · 藍=首次、灰=同上次、橘=用法有變化"),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 } },
        React.createElement("span", { style: { fontSize: 14, color: "#888" } }, "縮放"),
        React.createElement("button", {
          onClick: () => setDayPx(p => {
            const idx = ZOOM_STEPS.indexOf(p);
            return idx > 0 ? ZOOM_STEPS[idx - 1] : ZOOM_STEPS[0];
          }),
          disabled: dayPx <= ZOOM_STEPS[0],
          style: { width: 28, fontSize: 14, cursor: dayPx <= ZOOM_STEPS[0] ? "default" : "pointer", border: "1px solid #ccc", background: "#fff", lineHeight: "22px", opacity: dayPx <= ZOOM_STEPS[0] ? 0.3 : 1 }
        }, "−"),
        React.createElement("span", { style: { fontSize: 14, minWidth: 52, textAlign: "center", fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" } },
          dayPx + " px/天"
        ),
        React.createElement("button", {
          onClick: () => setDayPx(p => {
            const idx = ZOOM_STEPS.indexOf(p);
            return idx < ZOOM_STEPS.length - 1 ? ZOOM_STEPS[idx + 1] : ZOOM_STEPS[ZOOM_STEPS.length - 1];
          }),
          disabled: dayPx >= ZOOM_STEPS[ZOOM_STEPS.length - 1],
          style: { width: 28, fontSize: 14, cursor: dayPx >= ZOOM_STEPS[ZOOM_STEPS.length - 1] ? "default" : "pointer", border: "1px solid #ccc", background: "#fff", lineHeight: "22px", opacity: dayPx >= ZOOM_STEPS[ZOOM_STEPS.length - 1] ? 0.3 : 1 }
        }, "+"),
        React.createElement("select", {
          value: dayPx,
          onChange: e => setDayPx(parseInt(e.target.value)),
          style: { fontSize: 14, border: "1px solid #ccc", padding: "2px 4px", background: "#fff", marginLeft: 4 }
        },
          ZOOM_STEPS.map(v =>
            React.createElement("option", { key: v, value: v },
              v <= 2 ? "縮到最小" : v <= 3 ? "極小" : v <= 4 ? "小" : v <= 6 ? "中（預設）" : v <= 8 ? "大" : v <= 12 ? "較大" : v <= 18 ? "放大" : "最大"
            )
          )
        ),
        React.createElement("span", { style: { fontSize: 14, color: "#888", marginLeft: 10 } }, "行高"),
        React.createElement("button", {
          onClick: () => setRowH(h => {
            const i = ROW_STEPS.indexOf(h);
            return i > 0 ? ROW_STEPS[i - 1] : (h > ROW_STEPS[0] ? ROW_STEPS[0] : ROW_STEPS[0]);
          }),
          disabled: rowH <= ROW_STEPS[0],
          style: { width: 28, fontSize: 14, cursor: rowH <= ROW_STEPS[0] ? "default" : "pointer", border: "1px solid #ccc", background: "#fff", lineHeight: "22px", opacity: rowH <= ROW_STEPS[0] ? 0.3 : 1 }
        }, "−"),
        React.createElement("span", { style: { fontSize: 14, minWidth: 38, textAlign: "center", fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" } },
          rowH + " px"
        ),
        React.createElement("button", {
          onClick: () => setRowH(h => {
            const i = ROW_STEPS.indexOf(h);
            return i >= 0 && i < ROW_STEPS.length - 1 ? ROW_STEPS[i + 1] : ROW_STEPS[ROW_STEPS.length - 1];
          }),
          disabled: rowH >= ROW_STEPS[ROW_STEPS.length - 1],
          style: { width: 28, fontSize: 14, cursor: rowH >= ROW_STEPS[ROW_STEPS.length - 1] ? "default" : "pointer", border: "1px solid #ccc", background: "#fff", lineHeight: "22px", opacity: rowH >= ROW_STEPS[ROW_STEPS.length - 1] ? 0.3 : 1 }
        }, "+"),
        React.createElement("span", { style: { fontSize: 14, color: "#888", marginLeft: 10 } }, "日期標籤"),
        React.createElement("select", {
          value: labelEvery,
          onChange: e => setLabelEvery(parseInt(e.target.value)),
          style: { fontSize: 14, border: "1px solid #ccc", padding: "2px 4px", background: "#fff", marginLeft: 4 }
        },
          LABEL_OPTIONS.map(o =>
            React.createElement("option", { key: o.v, value: o.v }, o.label)
          )
        ),
        React.createElement("label", { style: { fontSize: 14, color: darkMode ? "#aaa" : "#888", marginLeft: 10, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" } },
          React.createElement("input", { type: "checkbox", checked: showTlDays, onChange: e => setShowTlDays(e.target.checked), style: { margin: 0 } }),
          "天數"
        ),
        React.createElement("label", { style: { fontSize: 14, color: darkMode ? "#aaa" : "#888", marginLeft: 4, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" } },
          React.createElement("input", { type: "checkbox", checked: showTlInst, onChange: e => setShowTlInst(e.target.checked), style: { margin: 0 } }),
          "機構"
        ),
        React.createElement("label", { style: { fontSize: 14, color: darkMode ? "#aaa" : "#888", marginLeft: 4, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" } },
          React.createElement("input", { type: "checkbox", checked: showTodayLine, onChange: e => setShowTodayLine(e.target.checked), style: { margin: 0 } }),
          "今日線"
        )
      )
    ),
    React.createElement("div", { style: { overflowX: "auto", padding: "0 16px 16px" } },
      React.createElement("div", { style: { minWidth: NAME_W + TRACK_W + 16, position: "relative" } },
        // Today vertical line overlay — positioned absolutely over the timeline
        showTodayLine && (() => {
          const today = new Date();
          if (today < timeRange.start || today > timeRange.end) return null;
          const todayX = NAME_W + (TRACK_W - dateToX(today));
          return React.createElement("div", {
            style: {
              position: "absolute",
              left: todayX + "px",
              top: 0,
              bottom: 0,
              width: 0,
              borderLeft: "2px solid " + (darkMode ? "#ff7070" : "#d44"),
              zIndex: 4,
              pointerEvents: "none",
            }
          },
            React.createElement("div", {
              style: {
                position: "absolute",
                left: -16,
                top: -2,
                background: darkMode ? "#ff7070" : "#d44",
                color: "#fff",
                fontSize: 14,
                padding: "1px 4px",
                whiteSpace: "nowrap",
                fontWeight: "bold",
                letterSpacing: "0.05em",
                lineHeight: 1.3,
              }
            }, "今日")
          );
        })(),
        // Header row
        React.createElement("div", { style: { display: "flex", alignItems: "flex-end" } },
          React.createElement("div", { style: { width: NAME_W, flexShrink: 0, fontSize: 14, fontWeight: "bold", color: "var(--fg-soft)", letterSpacing: "0.06em", textTransform: "uppercase", paddingLeft: 4, paddingBottom: 4, borderBottom: "2px solid var(--accent-bright)", position: "sticky", left: 0, background: "var(--surface)", zIndex: 3, boxShadow: "1px 0 3px rgba(0,0,0,0.06)" } }, "藥品"),
          renderTimeAxis()
        ),
        // Drug rows
        inResult.length > 0 && React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 14, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 4px 4px", position: "sticky", left: 0, background: "#fff", zIndex: 2, width: "fit-content" } }, "目前處方"),
          inResult.map(r => renderDrugRow(r, false))
        ),
        outResult.length > 0 && React.createElement("div", { style: { borderTop: "1px dashed #ccc", marginTop: 8 } },
          React.createElement("div", { style: { fontSize: 14, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 4px 4px", position: "sticky", left: 0, background: "#fff", zIndex: 2, width: "fit-content" } }, "其他"),
          outResult.map(r => renderDrugRow(r, true))
        )
      )
    ),
    React.createElement("div", { style: { display: "flex", gap: 16, padding: "8px 16px", borderTop: "1px solid " + (darkMode ? "#333" : "#eee"), flexWrap: "wrap" } },
      [["#5580b0","首次"],["#c0c0c0","同上次"],["#e07820","用法有變化"]].map(([color, label]) =>
        React.createElement("span", { key: label, style: { display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "#666" } },
          React.createElement("div", { style: { width: 24, height: 14, background: color + "22", borderLeft: "3px solid " + color } }),
          label
        )
      )
    )
  );
}

// ── shared vocab for 自備藥核對 ─────────────────────────────────────────────────

const RECON_FREQ_KW = new Set(["QD", "QID", "TID", "BID", "QOD", "HS", "HSPRN", "PRN", "STAT", "ONCE", "ASORDER", "IRRE",
  "QN", "Q1H", "Q2H", "Q3H", "Q4H", "Q6H", "Q8H", "Q12H", "Q24H", "Q48H", "Q72H",
  "QW", "BIW", "TIW", "Q2W", "Q3W", "Q4W", "Q1M", "Q2M", "Q3M", "DAILY", "WEEKLY", "BIWEEKLY",
  "Q1HPRN", "Q2HPRN", "Q4HPRN", "Q6HPRN", "Q8HPRN", "Q12HPRN", "QDPRN", "BIDPRN", "TIDPRN", "QIDPRN", "PRNHS",
  "QDAC", "QDPC", "QDHS", "BIDAC", "BIDPC", "TIDAC", "TIDPC", "QIDAC", "QIDPC", "QODPC", "QODAC",
  "TIDACHS", "QIDACHS", "BIDACHS", "TIDAC30", "BIDAC30", "QDAC30", "QDPC30", "5XDAY"]);
const RECON_FORM_WORDS = new Set(["tab", "tabs", "tablet", "tablets", "cap", "caps", "capsule", "capsules", "caplet", "caplets",
  "film", "coated", "film-coated", "filmcoated", "fc", "sr", "xr", "cr", "er", "la", "ir", "odt", "od", "mr", "xl",
  "inj", "injection", "amp", "ampoule", "ampule", "vial", "btl", "bottle", "bag", "pack", "sachet", "pen",
  "soln", "solution", "susp", "suspension", "syrup", "syr", "elixir", "cream", "gel", "ointment", "oint", "lotion",
  "patch", "supp", "suppository", "drop", "drops", "spray", "powder", "granule", "granules", "lozenge", "emulsion",
  "mg", "mcg", "ug", "g", "kg", "ml", "l", "iu", "unit", "units", "meq", "mmol"]);
const RECON_SALT_WORDS = new Set(["hcl", "hydrochloride", "dihydrochloride", "hbr", "hydrobromide", "bromide", "iodide",
  "sodium", "calcium", "potassium", "magnesium", "zinc", "sulfate", "sulphate", "besylate", "maleate", "mesylate",
  "fumarate", "succinate", "tartrate", "citrate", "phosphate", "acetate", "chloride", "nitrate", "gluconate", "carbonate",
  "bicarbonate", "stearate", "palmitate", "benzoate", "salicylate", "valerate", "propionate", "decanoate", "enanthate",
  "monohydrate", "dihydrate", "trihydrate", "hemihydrate", "hydrate", "anhydrous", "as"]);
// status text meaning an order is no longer actively in use
const INACTIVE_STATUS = new Set(["停", "退", "作", "廢", "完"]);
function isInactiveStatus(s) {
  s = (s || "").trim();
  if (!s) return false;
  if (INACTIVE_STATUS.has(s)) return true;
  return /停用|退藥|作廢|廢止|取消|註銷/.test(s);
}
function statusReason(s) {
  s = (s || "").trim();
  if (/作|廢/.test(s)) return "作廢";
  if (/退/.test(s)) return "退藥";
  if (/取消/.test(s)) return "取消";
  if (/註銷/.test(s)) return "註銷";
  if (/停/.test(s)) return "停用";
  if (/完/.test(s)) return "已完成";
  return s || "非作用中";
}

// ── 自備藥核對 (self-med order × 雲端藥歷) ─────────────────────────────────────
// Each 自備藥 order is matched to the patient's cloud products by brand name
// first, then by ingredient (built-in brand→ingredient table, names learned
// from the cloud data itself, or user-saved pairings). Strength, daily amount,
// frequency and remaining supply on the reference date are compared.

// Common brand → ingredient(s). Keys: lowercase brand words; values: "+"-joined ingredients.
const SC_BRAND_TABLE = `
norvasc|amlodipine;exforge|amlodipine+valsartan;exforge hct|amlodipine+valsartan+hydrochlorothiazide;
sevikar|olmesartan+amlodipine;sevikar hct|olmesartan+amlodipine+hydrochlorothiazide;twynsta|telmisartan+amlodipine;
caduet|amlodipine+atorvastatin;diovan|valsartan;codiovan|valsartan+hydrochlorothiazide;cozaar|losartan;
hyzaar|losartan+hydrochlorothiazide;fortzaar|losartan+hydrochlorothiazide;micardis|telmisartan;
micardis plus|telmisartan+hydrochlorothiazide;blopress|candesartan;aprovel|irbesartan;
coaprovel|irbesartan+hydrochlorothiazide;olmetec|olmesartan;olmetec plus|olmesartan+hydrochlorothiazide;
edarbi|azilsartan;entresto|sacubitril+valsartan;concor|bisoprolol;dilatrend|carvedilol;tenormin|atenolol;
betaloc|metoprolol;inderal|propranolol;pronolol|propranolol;nebilet|nebivolol;trandate|labetalol;
herbesser|diltiazem;isoptin|verapamil;adalat|nifedipine;plendil|felodipine;zanidip|lercanidipine;
atelec|cilnidipine;coniel|benidipine;cardura|doxazosin;minipress|prazosin;lasix|furosemide;
aldactone|spironolactone;fluitran|trichlormethiazide;natrilix|indapamide;burinex|bumetanide;samsca|tolvaptan;
tritace|ramipril;coversyl|perindopril;acertil|perindopril;renitec|enalapril;zestril|lisinopril;capoten|captopril;
apresoline|hydralazine;lipitor|atorvastatin;crestor|rosuvastatin;zocor|simvastatin;livalo|pitavastatin;
lescol|fluvastatin;mevalotin|pravastatin;ezetrol|ezetimibe;vytorin|ezetimibe+simvastatin;
atozet|ezetimibe+atorvastatin;lopid|gemfibrozil;tricor|fenofibrate;lipanthyl|fenofibrate;repatha|evolocumab;
praluent|alirocumab;leqvio|inclisiran;plavix|clopidogrel;brilinta|ticagrelor;efient|prasugrel;bokey|aspirin;
pletaal|cilostazol;persantin|dipyridamole;xarelto|rivaroxaban;eliquis|apixaban;pradaxa|dabigatran;
lixiana|edoxaban;coumadin|warfarin;cordarone|amiodarone;multaq|dronedarone;lanoxin|digoxin;sigmart|nicorandil;
nitrostat|nitroglycerin;imdur|isosorbide mononitrate;elantan|isosorbide mononitrate;isordil|isosorbide dinitrate;
procoralan|ivabradine;ranexa|ranolazine;rythmol|propafenone;mexitil|mexiletine;
harnalidge|tamsulosin;omnic|tamsulosin;xatral|alfuzosin;urief|silodosin;avodart|dutasteride;
duodart|dutasteride+tamsulosin;proscar|finasteride;detrusitol|tolterodine;vesicare|solifenacin;
betmiga|mirabegron;toviaz|fesoterodine;ditropan|oxybutynin;viagra|sildenafil;cialis|tadalafil;
glucophage|metformin;amaryl|glimepiride;diamicron|gliclazide;euglucon|glibenclamide;daonil|glibenclamide;
glucobay|acarbose;novonorm|repaglinide;starlix|nateglinide;actos|pioglitazone;januvia|sitagliptin;
janumet|sitagliptin+metformin;galvus|vildagliptin;galvus met|vildagliptin+metformin;trajenta|linagliptin;
trajenta duo|linagliptin+metformin;onglyza|saxagliptin;nesina|alogliptin;forxiga|dapagliflozin;
xigduo|dapagliflozin+metformin;jardiance|empagliflozin;jardiance duo|empagliflozin+metformin;
glyxambi|empagliflozin+linagliptin;qtern|dapagliflozin+saxagliptin;rybelsus|semaglutide;ozempic|semaglutide;
trulicity|dulaglutide;victoza|liraglutide;lantus|insulin glargine;toujeo|insulin glargine;
levemir|insulin detemir;tresiba|insulin degludec;novorapid|insulin aspart;humalog|insulin lispro;
apidra|insulin glulisine;eltroxin|levothyroxine;euthyrox|levothyroxine;fosamax|alendronate;evista|raloxifene;
actonel|risedronate;bonviva|ibandronate;prolia|denosumab;rocaltrol|calcitriol;onealpha|alfacalcidol;
medrol|methylprednisolone;decadron|dexamethasone;feburic|febuxostat;zyloric|allopurinol;
nexium|esomeprazole;losec|omeprazole;pariet|rabeprazole;takepron|lansoprazole;dexilant|dexlansoprazole;
pantoloc|pantoprazole;gaster|famotidine;mucosta|rebamipide;primperan|metoclopramide;motilium|domperidone;
gasmotin|mosapride;dulcolax|bisacodyl;duphalac|lactulose;forlax|macrogol;imodium|loperamide;
buscopan|butylscopolamine;urso|ursodeoxycholic acid;baraclude|entecavir;vemlidy|tenofovir;viread|tenofovir;
kalimate|calcium polystyrene sulfonate;kayexalate|sodium polystyrene sulfonate;fosrenol|lanthanum;renvela|sevelamer;
madopar|levodopa+benserazide;sinemet|levodopa+carbidopa;numient|levodopa+carbidopa;rytary|levodopa+carbidopa;
stalevo|levodopa+carbidopa+entacapone;comtan|entacapone;ongentys|opicapone;mirapex|pramipexole;
sifrol|pramipexole;requip|ropinirole;neupro|rotigotine;azilect|rasagiline;xadago|safinamide;
amanda|amantadine;pkmerz|amantadine;artane|trihexyphenidyl;aricept|donepezil;exelon|rivastigmine;
reminyl|galantamine;ebixa|memantine;keppra|levetiracetam;depakine|valproate;tegretol|carbamazepine;
trileptal|oxcarbazepine;lamictal|lamotrigine;topamax|topiramate;dilantin|phenytoin;lyrica|pregabalin;
neurontin|gabapentin;vimpat|lacosamide;fycompa|perampanel;briviact|brivaracetam;rivotril|clonazepam;
xanax|alprazolam;ativan|lorazepam;stilnox|zolpidem;imovane|zopiclone;lexotan|bromazepam;valium|diazepam;
eurodin|estazolam;halcion|triazolam;sirdalud|tizanidine;myonal|eperisone;lioresal|baclofen;
merislon|betahistine;betaserc|betahistine;cephadol|difenidol;stugeron|cinnarizine;sibelium|flunarizine;
nimotop|nimodipine;mestinon|pyridostigmine;
zoloft|sertraline;lexapro|escitalopram;cipram|citalopram;prozac|fluoxetine;seroxat|paroxetine;luvox|fluvoxamine;
cymbalta|duloxetine;efexor|venlafaxine;remeron|mirtazapine;wellbutrin|bupropion;trittico|trazodone;
mesyrel|trazodone;brintellix|vortioxetine;trintellix|vortioxetine;valdoxan|agomelatine;seroquel|quetiapine;
zyprexa|olanzapine;risperdal|risperidone;abilify|aripiprazole;invega|paliperidone;clozaril|clozapine;
geodon|ziprasidone;solian|amisulpride;haldol|haloperidol;latuda|lurasidone;rexulti|brexpiprazole;
dogmatyl|sulpiride;concerta|methylphenidate;ritalin|methylphenidate;
panadol|acetaminophen;scanol|acetaminophen;tylenol|acetaminophen;ultracet|tramadol+acetaminophen;
tramal|tramadol;celebrex|celecoxib;arcoxia|etoricoxib;mobic|meloxicam;voltaren|diclofenac;
ponstan|mefenamic acid;durogesic|fentanyl;oxycontin|oxycodone;
singulair|montelukast;mucosolvan|ambroxol;bisolvon|bromhexine;fluimucil|acetylcysteine;allegra|fexofenadine;
xyzal|levocetirizine;zyrtec|cetirizine;clarityne|loratadine;aerius|desloratadine;theodur|theophylline;
spiriva|tiotropium;seretide|salmeterol+fluticasone;symbicort|budesonide+formoterol;
relvar|fluticasone+vilanterol;trelegy|fluticasone+umeclidinium+vilanterol;anoro|umeclidinium+vilanterol;
ultibro|indacaterol+glycopyrronium;spiolto|tiotropium+olodaterol;berodual|fenoterol+ipratropium;
ventolin|salbutamol;atrovent|ipratropium;pulmicort|budesonide;flixotide|fluticasone;plaquenil|hydroxychloroquine`;
const SC_BRANDS = (() => {
  const m = new Map();
  for (const pair of SC_BRAND_TABLE.split(";")) {
    const [k, v] = pair.split("|").map(s => (s || "").trim());
    if (k && v) m.set(k, v.split("+").map(s => s.trim()).filter(Boolean));
  }
  return m;
})();

// ingredient spelling variants → one canonical name
const SC_ING_ALIAS = {
  "paracetamol": "acetaminophen", "acetylsalicylic acid": "aspirin", "acetylsalicylic": "aspirin",
  "valproic acid": "valproate", "divalproex": "valproate", "albuterol": "salbutamol", "glyburide": "glibenclamide",
  "thyroxine": "levothyroxine", "l thyroxine": "levothyroxine", "frusemide": "furosemide",
  "hyoscine butylbromide": "butylscopolamine", "scopolamine butylbromide": "butylscopolamine",
  "hyoscine": "butylscopolamine", "diphenidol": "difenidol", "polyethylene glycol": "macrogol",
  "ursodiol": "ursodeoxycholic acid", "ursodeoxycholic": "ursodeoxycholic acid", "glyceryl trinitrate": "nitroglycerin"
};
const SC_EXTRA_SALT = new Set(["bisulfate", "hydrogensulfate", "besilate", "mesilate", "tosilate", "tosylate",
  "medoxomil", "cilexetil", "erbumine", "arginine", "axetil", "hyclate", "dipropionate", "xinafoate", "trometamol",
  "alafenamide", "disoproxil", "dimesylate", "pamoate", "disodium", "dipotassium", "sesquihydrate",
  "monohydrochloride", "ltartrate", "bitartrate", "hydrogen", "base"]);
// first words too generic to identify a product or an ingredient on their own
const SC_GENERIC_HEADS = new Set(["insulin", "vitamin", "vit", "calcium", "magnesium", "sodium", "potassium", "ferrous",
  "ferric", "iron", "zinc", "folic", "isosorbide", "human", "alpha", "beta", "aluminium", "aluminum", "compound",
  "co", "b", "d", "k", "mg", "oral", "the", "new", "super", "multi", "fish", "omega"]);
const SC_COUNT_UNITS = new Set(["tab", "tabs", "tablet", "cap", "caps", "capsule", "pc", "pcs", "pill", "pack", "pk",
  "supp", "粒", "顆", "錠", "包", "片", "支", "pen", "puff", "patch"]);
const SC_MASS = { mg: 1, mcg: 0.001, ug: 0.001, "μg": 0.001, g: 1000, gm: 1000 };
const SC_NONSCHEDULED = /PRN|STAT|ONCE|ASORDER|IRRE/i;

function scWords(name) {
  return (name || "").toLowerCase().replace(/"[^"]*"/g, " ").replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9.%/\-]+/g, " ").split(/[\s/]+/).filter(Boolean);
}
// brand key: leading words before strength / dosage-form words ("250 Madopar /tab" → "madopar")
function scBrandKey(name) {
  const toks = scWords(name);
  let i = 0;
  while (i < toks.length && /\d/.test(toks[i])) i++;
  const kept = [];
  for (; i < toks.length; i++) {
    const t = toks[i], base = t.replace(/[.\-]/g, "");
    if (/\d/.test(t)) break;
    if (RECON_FORM_WORDS.has(t) || RECON_FORM_WORDS.has(base)) break;
    if (base) kept.push(base);
    if (kept.length >= 4) break;
  }
  return kept.join(" ");
}
// canonical ingredient: salts dropped only after the main ingredient word (keeps "magnesium oxide")
function scCanonIng(name) {
  const toks = scWords(stripSalt(name || ""));
  const kept = [];
  let hasMain = false;
  for (const t of toks) {
    const base = t.replace(/[.\-]/g, "");
    if (/\d/.test(t)) { if (kept.length) break; continue; }
    if (RECON_FORM_WORDS.has(t) || RECON_FORM_WORDS.has(base)) { if (kept.length) break; continue; }
    const salt = RECON_SALT_WORDS.has(base) || SC_EXTRA_SALT.has(base);
    if (salt && hasMain) continue;
    if (base) { kept.push(base); if (!salt) hasMain = true; }
  }
  let s = kept.join(" ");
  if (SC_ING_ALIAS[s]) return SC_ING_ALIAS[s];
  const head = kept[0] || "";
  if (SC_ING_ALIAS[head] && !SC_GENERIC_HEADS.has(head)) return SC_ING_ALIAS[head];
  return s;
}
function scIngSame(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const ha = a.split(" ")[0], hb = b.split(" ")[0];
  return ha === hb && !SC_GENERIC_HEADS.has(ha);
}
function scSplitIngs(ingName) {
  return (ingName || "").split(/\s*(?:\+|,|;|&|\band\b|\/|、)\s*/i).map(scCanonIng).filter(Boolean);
}
function scLookupBrand(key, table) {
  const words = (key || "").split(" ").filter(Boolean);
  for (let n = words.length; n >= 1; n--) {
    const k = words.slice(0, n).join(" ");
    if (n === 1 && SC_GENERIC_HEADS.has(k)) break;
    if (table.has(k)) return { key: k, ings: table.get(k) };
  }
  return null;
}

// strength groups: "36.25/145MG" → {nums:[36.25,145], mg:[…]}; "250 Madopar" → {nums:[250]}
function scStrengths(name) {
  const s = (name || "").replace(/"[^"]*"/g, " ");
  const re = /(?<![A-Za-z0-9.])(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*)\s*(mg|mcg|μg|ug|gm|g|iu|units?|%|meq|mmol)?(?![A-Za-z0-9])/gi;
  const out = [];
  let m;
  while ((m = re.exec(s))) {
    const rest = s.slice(m.index + m[0].length);
    if (!m[2] && /^\s*\/?\s*(ml|l)\b/i.test(rest)) continue;          // per-volume number
    if (m[2] && /^\s*\/\s*\d*\s*(ml|l)\b/i.test(rest) && !out.length) { /* concentration: keep */ }
    const nums = m[1].split("/").map(x => parseFloat(x)).filter(x => !isNaN(x));
    if (!nums.length) continue;
    const unit = (m[2] || "").toLowerCase();
    const f = SC_MASS[unit];
    out.push({ nums, unit, mg: f ? nums.map(x => x * f) : null, text: m[0].trim() });
  }
  return out;
}
const scClose = (a, b) => Math.abs(a - b) <= Math.max(1e-6, 0.02 * Math.max(Math.abs(a), Math.abs(b)));
function scGroupEq(a, b) {
  const useMg = a.mg && b.mg;
  const x = useMg ? a.mg : a.nums, y = useMg ? b.mg : b.nums;
  if (x.length === y.length && [...x].sort((p, q) => p - q).every((v, i) => scClose(v, [...y].sort((p, q) => p - q)[i]))) return true;
  const sum = arr => arr.reduce((p, q) => p + q, 0);
  if (x.length === 1 && y.length > 1 && !a.unit) return scClose(x[0], sum(y)) || y.some(v => scClose(v, x[0]));
  if (y.length === 1 && x.length > 1 && !b.unit) return scClose(y[0], sum(x)) || x.some(v => scClose(v, y[0]));
  return false;
}
// true = same, false = different, null = unknown (one side has no strength)
function scStrengthEq(a, b) {
  if (!a.length || !b.length) return null;
  return a.some(p => b.some(q => scGroupEq(p, q)));
}
function scSingleMg(groups) {
  const g = groups.find(x => x.mg);
  return g && g.mg.length === 1 ? g.mg[0] : null;
}

function scYmd(s) {
  s = (s || "").trim();
  let m = s.match(/^(\d{4})(\d{2})(\d{2})$/) || s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}
function scFmt(d) {
  if (!d) return "";
  return d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0");
}
const scDayDiff = (a, b) => Math.round((a - b) / 86400000);
const scNum = v => { const x = Math.round(v * 100) / 100; return String(x); };

function scIsFreq(s) {
  const u = (s || "").toUpperCase().replace(/\s+/g, "");
  if (!u) return false;
  if (RECON_FREQ_KW.has(u)) return true;
  return /^(QD|QOD|BID|TID|QID|QN|Q?HS|PRN|STAT|ONCE|ASORDER|IRRE|QW|BIW|TIW|QAM|QPM|Q\d+(H|D|W|M)|\d+X(DAY|\/DAY|D))([A-Z0-9&+\/]*)$/.test(u);
}
const SC_CODE_ONE = /^[A-Z]{2,3}\d[A-Z]{2}\d{2}$/;
// 自備藥: 類別 狀態 [藥碼] 藥名 劑量 單位 途徑 頻率 起日 時 迄日 時 [備註] [異動時間]
function parseSelfOrders(raw) {
  const text = (raw || "").replace(/\r/g, "").replace(/　/g, " ").replace(/ /g, " ");
  const out = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line.trim()) continue;
    let cols = (line.indexOf("\t") >= 0 ? line.split(/\t+/) : line.split(/\s{2,}/)).map(c => c.trim()).filter(Boolean);
    let F = -1;
    const findF = () => { for (let k = cols.length - 1; k >= 3; k--) if (scIsFreq(cols[k])) return k; return -1; };
    F = cols.length >= 5 ? findF() : -1;
    let rec = null;
    if (F >= 4 && /^\d+(\.\d+)?$/.test(cols[F - 3] || "")) {
      rec = { code: cols.slice(2, F - 4).join(" "), name: cols[F - 4] || "" };
    } else if (line.indexOf("\t") < 0) {
      // single-space fallback
      cols = line.trim().split(/\s+/);
      F = findF();
      if (F < 5 || !/^\d+(\.\d+)?$/.test(cols[F - 3] || "")) continue;
      let nameToks = cols.slice(2, F - 3), code = "";
      if (nameToks.length > 1 && SC_CODE_ONE.test(nameToks[0])) code = nameToks.shift();
      else if (nameToks.length > 2 && /^[A-Z]{2}$/.test(nameToks[0]) && /^\d[A-Z]{2}\d{2}$/.test(nameToks[1])) code = nameToks.splice(0, 2).join(" ");
      rec = { code, name: nameToks.join(" ") };
    }
    if (!rec || !rec.name) continue;
    out.push(Object.assign(rec, {
      category: cols[0] || "", status: cols[1] || "",
      dose: cols[F - 3], unit: cols[F - 2] || "", route: cols[F - 1] || "", freq: cols[F] || "",
      startDate: cols[F + 1] || "", startHour: cols[F + 2] || "", endDate: cols[F + 3] || "", endHour: cols[F + 4] || "",
      note: cols.slice(F + 5).filter(c => !/^\d{8}(\d{4,6})?$|^\d{4}\/\d{1,2}\/\d{1,2}/.test(c)).join(" ")
    }));
  }
  return out;
}

// One entry per cloud product (健保碼), latest dispensing first.
function scCloudProducts(cloudRows, refDate, grace) {
  const m = new Map();
  for (const r of cloudRows) {
    const k = drugKey(r);
    const disp = laterDate(r.date1, r.date2);
    const ex = m.get(k);
    if (!ex) m.set(k, { key: k, latest: r, disp, count: 1 });
    else { ex.count++; if (cmpDate(disp, ex.disp) > 0) { ex.latest = r; ex.disp = disp; } }
  }
  const list = [];
  for (const p of m.values()) {
    const r = p.latest;
    const brandKey = scBrandKey(r.drugName);
    const ings = scSplitIngs(r.ingName);
    const add = list => { for (const g of list) if (g && !ings.some(x => scIngSame(x, g))) ings.push(g); };
    if (r.ref && r.ref.ings.length) add(r.ref.ings.map(i => i.canon));   // 食藥署成分為準
    else { const dict = scLookupBrand(brandKey, SC_BRANDS); if (dict) add(dict.ings); }
    const dispD = scYmd(p.disp);
    const days = parseFloat(r.days) || 0;
    const end = dispD ? new Date(dispD.getTime() + days * 86400000) : null;
    const active = end ? scDayDiff(refDate, end) <= grace : false;
    const form = inferDoseUnit(r.drugName, r.unit);
    const qty = parseFloat(r.qty);
    const daily = !form.isNoDose && form.unit && qty > 0 && days > 0 ? qty / days : null;
    const parts = formatDrugParts(r, { nameMode: "brand", showDays: false });
    list.push(Object.assign(p, {
      brandKey, ings, strengths: scStrengths(r.drugName), dispDate: dispD, end, days, active,
      daily, dailyUnit: form.unit || "", perDose: parts.dose, freq: r.freq || "",
      label: extractBrandName(r.drugName) || r.drugName, strengthText: parts.strength,
      ingText: stripSalt(r.ingName || ""), inst: r.institution || "", short: days > 0 && days < 14, ref: r.ref || null
    }));
  }
  return list.sort((a, b) => (b.dispDate || 0) - (a.dispDate || 0));
}

function scSelfInfo(r, cloud, custom, medref) {
  const brandKey = scBrandKey(r.name);
  const pm = (r.name || "").match(/\(([^)]+)\)/);
  let ings = [], ingSource = "";
  if (pm) { ings = scSplitIngs(pm[1]); if (ings.length) ingSource = "藥名"; }
  if (!ings.length) {
    const c = scLookupBrand(brandKey, custom);
    if (c) { ings = c.ings.slice(); ingSource = "自訂對照"; }
  }
  if (!ings.length) {
    const d = scLookupBrand(brandKey, SC_BRANDS);
    if (d) { ings = d.ings.slice(); ingSource = "內建對照"; }
  }
  let fda = null;
  if (medref) {
    fda = mrBrandIngs(medref, { brandKey, strengths: scStrengths(r.name) });
    if (fda && !ings.length) { ings = fda.ings.slice(); ingSource = "食藥署"; }
  }
  const head = brandKey.split(" ")[0] || "";
  if (!ings.length && head && !SC_GENERIC_HEADS.has(head)) {
    const same = cloud.find(p => p.brandKey.split(" ")[0] === head && p.ings.length);
    if (same) { ings = same.ings.slice(); ingSource = "雲端同名"; }
    else if (cloud.some(p => p.ings.some(g => scIngSame(g, scCanonIng(r.name))))) { ings = [scCanonIng(r.name)]; ingSource = "學名"; }
  }
  return { brandKey, ings, ingSource, strengths: scStrengths(r.name), fda: fda ? fda.entry : null };
}
function scIngLevel(si, p) {
  if (!si.ings.length || !p.ings.length) return 0;
  const sIn = si.ings.filter(a => p.ings.some(b => scIngSame(a, b))).length;
  if (!sIn) return 0;
  const pIn = p.ings.filter(b => si.ings.some(a => scIngSame(a, b))).length;
  return sIn === si.ings.length && pIn === p.ings.length ? 2 : 1;
}
function scMatchLevel(si, p) {
  const sh = si.brandKey.split(" ")[0], ph = p.brandKey.split(" ")[0];
  const ing = scIngLevel(si, p);
  if (sh && sh === ph && !SC_GENERIC_HEADS.has(sh) && !p.ings.some(g => g.split(" ")[0] === sh)) {
    // same brand word but a different combination (e.g. Exforge vs Exforge HCT)
    return ing === 1 && si.brandKey !== p.brandKey ? 1 : 3;
  }
  return ing;
}
function scInactive(status) {
  const s = (status || "").trim();
  return isInactiveStatus(s) || /停|取消|作廢|刪除|註銷|^D\/?C$/i.test(s);
}
const SC_LEVEL = { 3: "同商品名", 2: "同成分", 1: "部分成分相同", 9: "手動對應" };

function buildSelfCheck(cloudRows, selfRowsAll, opts) {
  const grace = opts && Number.isFinite(opts.grace) ? opts.grace : 14;
  const custom = new Map(Object.entries((opts && opts.customMap) || {}));
  const overrides = (opts && opts.overrides) || {};
  const selfRows = selfRowsAll.map((r, idx) => Object.assign({ idx }, r));
  const inactive = selfRows.filter(r => scInactive(r.status));
  const active = selfRows.filter(r => !scInactive(r.status));
  const starts = active.map(r => scYmd(r.startDate)).filter(Boolean).sort((a, b) => a - b);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const refDate = (opts && opts.refDate) || starts[0] || today;
  const cloud = scCloudProducts(cloudRows, refDate, grace);
  const byKey = new Map(cloud.map(p => [p.key, p]));

  // best cloud product per order
  const matched = active.map(r => {
    const si = scSelfInfo(r, cloud, custom, opts && opts.medref);
    const ov = overrides[r.idx];
    if (ov && byKey.has(ov)) return { r, si, level: 9, best: byKey.get(ov), alts: [] };
    // same brand or same ingredient form one pool; partial-ingredient matches only when nothing better
    const all = cloud.map(p => ({ p, lv: scMatchLevel(si, p) })).filter(x => x.lv > 0);
    if (!all.length) return { r, si, level: 0, best: null, alts: [] };
    const pool = all.some(x => x.lv >= 2) ? all.filter(x => x.lv >= 2) : all;
    const sh = si.brandKey.split(" ")[0];
    // what the patient is currently supplied with comes first, then brand, then strength
    const rank = x => (x.p.active ? 16 : 0) + (sh && x.p.brandKey.split(" ")[0] === sh ? 8 : 0) +
      (scStrengthEq(si.strengths, x.p.strengths) === true ? 4 : scStrengthEq(si.strengths, x.p.strengths) === null ? 2 : 0);
    pool.sort((a, b) => rank(b) - rank(a) || (b.p.dispDate || 0) - (a.p.dispDate || 0));
    return { r, si, level: pool[0].lv, best: pool[0].p, alts: pool.slice(1).map(x => x.p) };
  });

  // orders pointing at the same product are one regimen (e.g. 2 tab TIDAC + 0.5 tab HS)
  const groupMap = new Map();
  for (const m of matched) {
    const gk = m.best ? "p:" + m.best.key + (m.level === 1 ? "|" + m.r.idx : "") : "s:" + m.si.brandKey + "|" + m.si.strengths.map(g => g.text).join(",") + "|" + m.r.idx;
    if (!groupMap.has(gk)) groupMap.set(gk, { key: gk, items: [], best: m.best, level: m.level, alts: m.alts, si: m.si });
    const g = groupMap.get(gk);
    g.items.push(m);
    if (m.level > g.level) g.level = m.level;
  }
  const covered = new Set();
  const groups = Array.from(groupMap.values()).map(g => {
    const p = g.best, issues = [], notes = [];
    let status = "ok";
    const bump = s => { const order = { ok: 0, info: 1, warn: 2, bad: 3 }; if (order[s] > order[status]) status = s; };
    // self daily amount
    let selfDaily = 0, selfMgDaily = 0, selfUnit = "", countOK = true, mgOK = true, prn = false;
    const selfMgPer = scSingleMg(g.si.strengths);
    for (const { r } of g.items) {
      const dose = parseFloat(r.dose);
      if (SC_NONSCHEDULED.test(r.freq)) { prn = true; continue; }
      const div = getFreqDivisor(r.freq);
      const u = (r.unit || "").toLowerCase();
      if (SC_COUNT_UNITS.has(u)) {
        selfDaily += dose * div; selfUnit = selfUnit || u;
        if (selfMgPer != null) selfMgDaily += dose * div * selfMgPer; else mgOK = false;
      } else if (SC_MASS[u]) {
        countOK = false; selfMgDaily += dose * div * SC_MASS[u];
      } else { countOK = false; mgOK = false; }
    }
    const scheduled = g.items.some(({ r }) => !SC_NONSCHEDULED.test(r.freq));
    let strengthEq = null, cloudDailyText = "", selfDailyText = "", dailyMatch = null;
    if (scheduled) {
      if (countOK && selfDaily > 0) selfDailyText = scNum(selfDaily) + " " + selfUnit + "/日";
      else if (mgOK && selfMgDaily > 0) selfDailyText = scNum(selfMgDaily) + " mg/日";
    }
    if (!p) {
      status = "bad"; issues.push("雲端查無");
    } else {
      covered.add(p.key);
      for (const a of g.alts) if (scStrengthEq(g.si.strengths, a.strengths) !== false && scStrengthEq(p.strengths, a.strengths) !== false) covered.add(a.key);
      if (g.level === 1) { bump("warn"); issues.push("部分成分相同"); }
      if (g.level === 2) notes.push("不同廠牌");
      strengthEq = scStrengthEq(g.si.strengths, p.strengths);
      if (strengthEq === false) issues.push("含量不同");
      if (p.daily) cloudDailyText = scNum(p.daily) + " " + p.dailyUnit + "/日";
      if (!p.active) {
        bump("warn");
        issues.push("雲端已無藥量");
      }
      if (prn && !scheduled) notes.push("PRN 未比對劑量");
      else if (scheduled && p.daily && !SC_NONSCHEDULED.test(p.freq)) {
        let cmp = null;
        if (strengthEq !== false && countOK && selfDaily > 0) {
          cmp = scClose(selfDaily, p.daily);
        } else {
          const pMg = scSingleMg(p.strengths);
          if (pMg != null && mgOK && selfMgDaily > 0) {
            const cMg = p.daily * pMg;
            cmp = scClose(selfMgDaily, cMg);
            selfDailyText = scNum(selfMgDaily) + " mg/日"; cloudDailyText = scNum(cMg) + " mg/日";
          }
        }
        dailyMatch = cmp;
        if (cmp === false) { bump("warn"); issues.push("劑量不同"); }
        else if (cmp === null) notes.push("劑量無法換算");
        if (cmp !== false && g.items.length === 1) {
          const sd = getFreqDivisor(g.items[0].r.freq), cd = getFreqDivisor(p.freq);
          if (Math.abs(sd - cd) > 1e-6) { bump("info"); issues.push("頻率不同"); }
        }
      } else if (scheduled && !p.daily) notes.push("劑量無法換算");
      if (prn && scheduled) notes.push("含 PRN 醫囑");
      // a different tablet strength is only a reminder when the daily mg still agrees
      if (strengthEq === false) bump(dailyMatch === true ? "info" : "warn");
    }
    return Object.assign(g, { status, issues, notes, strengthEq, selfDailyText, cloudDailyText, dailyMatch,
      selfDaily, selfMgDaily, countOK, mgOK, scheduled,
      firstIdx: Math.min(...g.items.map(x => x.r.idx)) });
  }).sort((a, b) => a.firstIdx - b.firstIdx);

  // active cloud products with no 自備藥 order
  const missing = cloud.filter(p => p.active && !covered.has(p.key)).map(p => {
    const related = groups.filter(g => g.si.ings.some(a => p.ings.some(b => scIngSame(a, b))) ||
      (g.best && g.best.ings.some(a => p.ings.some(b => scIngSame(a, b)))));
    return Object.assign({}, p, { related: related.map(g => g.items[0].r.name) });
  });
  const counts = { ok: 0, info: 0, warn: 0, bad: 0 };
  for (const g of groups) counts[g.status]++;
  return { refDate, refFromOrder: !(opts && opts.refDate) && !!starts[0], refLabel: opts && opts.refLabel, grace, groups, missing, inactive, cloud, counts,
    selfCount: active.length, cloudCount: cloud.length };
}

// "250 Madopar /tab" → "Madopar"; "Amanda 100 mg/tab" → "Amanda"
function scSelfBrand(name) {
  const n = (name || "").replace(/^\s*\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)*\s+/, "")
    .replace(/\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*\s*(?:mg|mcg|μg|ug|gm|g|iu|units?|%|meq|mmol)?(?:\s*\/\s*[a-z]+)?\s*$/i, "")
    .replace(/\s*\/\s*(?:tab|cap|tablet|capsule|amp|vial|btl|bot|pc|pack|supp)\.?\s*$/i, "")
    .replace(/\s+/g, " ").trim();
  return n || (name || "").trim();
}
function scSelfStrength(si) {
  const g = si.strengths.find(x => x.unit) || si.strengths[0];
  if (!g) return "";
  return g.nums.map(scNum).join("/") + (g.unit ? (g.unit === "%" ? "%" : " " + g.unit) : "");
}
// one 自備藥 order as 整理結果 columns (name / strength / dose / freq)
function scSelfParts(r, g, nameMode) {
  const brand = scSelfBrand(r.name);
  let ing = "";
  if (g.best && (g.level === 2 || g.level === 3 || g.level === 9)) ing = stripSalt(g.best.latest.ingName || "");
  if (!ing && g.si.ings.length) ing = g.si.ings.join(" + ");
  const name = nameMode === "brand" ? brand
    : nameMode === "both" ? (ing && ing.toLowerCase() !== brand.toLowerCase() ? brand + " (" + ing + ")" : brand)
    : (ing || brand);
  const route = (r.route || "").trim();
  return { name, strength: scSelfStrength(g.si), dose: [r.dose, r.unit].filter(Boolean).join(" "),
    freq: [r.freq, route && route.toUpperCase() !== "PO" ? route : ""].filter(Boolean).join(" "), days: "" };
}
function scIssueLine(g) {
  const p = g.best;
  const name = Array.from(new Set(g.items.map(x => x.r.name))).join("／");
  const selfUse = g.items.map(({ r }) => scOrderUsage(r)).join(" + ");
  if (!p) return `・${name}：雲端查無領藥紀錄（自備 ${selfUse}）`;
  const cloudName = [p.label, p.strengthText].filter(Boolean).join(" ");
  const where = `${scFmt(p.dispDate)} ${p.inst}`;
  const parts = [];
  for (const is of g.issues) {
    if (is === "劑量不同") parts.push(`劑量不同，自備 ${selfUse}${g.selfDailyText ? "（" + g.selfDailyText + "）" : ""}，雲端 ${cloudName} ${scCloudUsage(p)}${g.cloudDailyText ? "（" + g.cloudDailyText + "）" : ""}，${where}`);
    else if (is === "含量不同") parts.push(`含量不同，自備 ${scSelfStrength(g.si) || "?"}，雲端 ${cloudName}${g.dailyMatch === true ? "，日量相同" : ""}`);
    else if (is === "頻率不同") parts.push(`頻率不同，自備 ${g.items[0].r.freq}，雲端 ${p.freq}（${where}）`);
    else if (is === "部分成分相同") parts.push(`成分不完全相同，雲端為 ${cloudName}${p.ingText ? "（" + p.ingText.toLowerCase() + "）" : ""}`);
    else if (is === "雲端已無藥量") parts.push(`雲端已無藥量，最後領藥 ${where} ${p.days}天，${scFmt(p.end)} 用完`);
  }
  return `・${name}：${parts.join("；")}`;
}
// 一鍵複製：雲端各藥最近一次領藥（整理結果格式）→ 自備藥（同格式）→ 不一致摘要
function selfCheckText(res, fmt) {
  const o = Object.assign({ nameMode: "ingredient", alignColumns: "global", showDays: true }, fmt || {});
  // latest dispensing of each product behind the orders, plus products still supplied without an order
  const seen = new Set(), recs = [];
  for (const g of res.groups) if (g.best && !seen.has(g.best.key)) { seen.add(g.best.key); recs.push(g.best.latest); }
  for (const p of res.missing) if (!seen.has(p.key)) { seen.add(p.key); recs.push(p.latest); }
  const blocks = groupByInstitution(recs).map(([, { date, inst, rows }]) => {
    const { commonDays, partsList } = visitDrugParts(rows, o);
    // split schedules (e.g. TIDAC+HS) read better as a daily total
    rows.forEach((r, i) => { if (/[+&]/.test(r.freq || "")) { const d = scRecordDaily(r); if (d) partsList[i].dose = scNum(d.daily) + " " + d.unit + "/日"; } });
    return { head: `【${inst}】${fmtDate(date)}${commonDays !== null ? `　${commonDays}天` : ""}`, parts: partsList };
  });
  const items = res.groups.flatMap(g => g.items.map(x => ({ r: x.r, g }))).sort((a, b) => a.r.idx - b.r.idx);
  blocks.push({ head: `【自備藥】${scFmt(res.refDate)}`, parts: items.map(({ r, g }) => scSelfParts(r, g, o.nameMode)) });
  const widths = o.alignColumns === "global" ? computeGlobalWidths(blocks.flatMap(b => b.parts)) : null;
  const out = [];
  for (const b of blocks) {
    if (!b.parts.length) continue;
    out.push(b.head);
    for (const line of layoutPartsLines(b.parts, o, widths)) out.push(line);
    out.push("");
  }
  out.push("【不一致】");
  const lines = res.groups.filter(g => g.status !== "ok").map(scIssueLine);
  for (const p of res.missing) {
    const usage = scCloudUsage(p);
    lines.push(`・雲端有藥、未開自備藥：${[p.label, p.strengthText].filter(Boolean).join(" ")}${usage ? " " + usage : ""}（${scFmt(p.dispDate)} ${p.inst} ${p.days}天${p.short ? "，短期處方" : ""}）`);
  }
  out.push(...(lines.length ? lines : ["・無"]));
  return out.join("\n").trim();
}

// daily amount of one cloud dispensing (count units only)
function scRecordDaily(r) {
  const form = inferDoseUnit(r.drugName, r.unit);
  const qty = parseFloat(r.qty), days = parseFloat(r.days);
  return !form.isNoDose && form.unit && qty > 0 && days > 0 ? { daily: qty / days, unit: form.unit } : null;
}
// same rule as the product check: count/day when strength agrees, otherwise mg/day
function scCompareDaily(g, strengths, daily, freq) {
  if (!g.scheduled || !daily || SC_NONSCHEDULED.test(freq || "")) return null;
  if (scStrengthEq(g.si.strengths, strengths) !== false && g.countOK && g.selfDaily > 0) return scClose(g.selfDaily, daily);
  const mg = scSingleMg(strengths);
  if (mg != null && g.mgOK && g.selfMgDaily > 0) return scClose(g.selfMgDaily, daily * mg);
  return null;
}
// 雲端近幾次領藥 × 自備藥: columns = dispensings (newest first), rows = cloud products
function buildSelfCheckVisits(res, cloudRows, maxVisits) {
  const colMap = new Map();
  for (const r of cloudRows) {
    const disp = laterDate(r.date1, r.date2);
    const k = fmtDate(disp) + "|" + (r.institution || "");
    if (!colMap.has(k)) colMap.set(k, { key: k, date: scYmd(disp), inst: r.institution || "", refill: false, rows: [] });
    const c = colMap.get(k);
    if (r.date2 && fmtDate(r.date2) === fmtDate(disp) && fmtDate(r.date1) !== fmtDate(r.date2)) c.refill = true;
    c.rows.push(r);
  }
  const allCols = Array.from(colMap.values()).sort((a, b) => (b.date || 0) - (a.date || 0) || a.inst.localeCompare(b.inst));
  const cols = maxVisits > 0 ? allCols.slice(0, maxVisits) : allCols;
  const byKey = new Map(res.cloud.map(p => [p.key, p]));
  // 自備藥 orders that correspond to a cloud product (best level only)
  const linksFor = p => {
    const scored = res.groups.filter(g => g.best).map(g => ({ g, lv: g.best.key === p.key ? (g.level || 3) : g.level === 9 ? 0 : scMatchLevel(g.si, p),
      own: g.best.key === p.key }));
    const top = Math.max(0, ...scored.map(x => x.own ? 2 : x.lv >= 2 ? 2 : x.lv));
    if (!top) return [];
    return scored.filter(x => (x.own || x.lv >= 2 ? 2 : x.lv) === top && x.lv > 0)
      .sort((a, b) => (b.own - a.own) || a.g.firstIdx - b.g.firstIdx);
  };
  const rowMap = new Map();
  const addRow = p => { if (p && !rowMap.has(p.key)) rowMap.set(p.key, { p, cells: new Map(), links: linksFor(p) }); return p && rowMap.get(p.key); };
  cols.forEach((c, ci) => {
    for (const r of c.rows) {
      const row = addRow(byKey.get(drugKey(r)));
      if (!row || row.cells.has(ci)) continue;
      const parts = formatDrugParts(r, { nameMode: "brand", showDays: true });
      const d = scRecordDaily(r);
      const g = row.links.length ? row.links[0].g : null;
      row.cells.set(ci, { parts, freq: r.freq || "", daily: d, cmp: g ? scCompareDaily(g, row.p.strengths, d && d.daily, r.freq) : null });
    }
  });
  for (const g of res.groups) if (g.best) addRow(g.best);          // matched, last dispensed before the window
  for (const p of res.missing) addRow(byKey.get(p.key));           // still supplied, no 自備藥 order
  const rows = Array.from(rowMap.values());
  const withSelf = rows.filter(x => x.links.length)
    .sort((a, b) => a.links[0].g.firstIdx - b.links[0].g.firstIdx || (b.p.dispDate || 0) - (a.p.dispDate || 0));
  const noSelf = rows.filter(x => !x.links.length)
    .sort((a, b) => (b.p.active - a.p.active) || (b.p.dispDate || 0) - (a.p.dispDate || 0));
  return { cols, totalVisits: allCols.length, withSelf, noSelf, notFound: res.groups.filter(g => !g.best) };
}
function scCellText(cell) {
  const p = cell.parts;
  if (/[+&,\/\s]/.test((cell.freq || "").trim()) && cell.daily) return [scNum(cell.daily.daily) + " " + cell.daily.unit + "/日", cell.freq, p.days].filter(Boolean).join(" ");
  return [p.dose, p.freq, p.days].filter(Boolean).join(" ") || "（有）";
}

// ── 食藥署藥品資料庫（背景下載的公開資料；健保碼 → 許可證 → 完整成分／外觀圖）──
const MR_DATA_KEY = "medref-data";
const MR_STATUS_KEY = "medref-status";
// 健保碼第 1 碼（證別）→ 許可證類別（去掉衛署／衛部）
const MR_TYPE = { A: "藥製", B: "藥輸", N: "內衛藥製", P: "內衛藥輸", V: "罕藥輸", W: "罕藥製",
  J: "菌疫製", K: "菌疫輸", R: "內衛菌疫製", S: "內衛菌疫輸", Y: "罕菌疫輸", Z: "罕菌疫製" };
function mrLicParts(L) {
  const m = (L || "").match(/^(內衛|衛署|衛部)(.*?)字第([A-Z]?\d+)號$/);
  return m ? { t: (m[1] === "內衛" ? "內衛" : "") + m[2], num: m[3] } : null;
}
function mrPrepare(data) {
  if (!data || !data.lic) return null;
  const byCode = new Map(), byHead = new Map();
  const push = (m, k, v) => { const a = m.get(k); if (a) a.push(v); else m.set(k, [v]); };
  for (const L in data.lic) {
    const p = mrLicParts(L);
    if (p) push(byCode, p.t + "|" + p.num.slice(-5), L);
    const head = scBrandKey(data.lic[L][0]).split(" ")[0];
    if (head && !SC_GENERIC_HEADS.has(head)) push(byHead, head, L);
  }
  return { updatedAt: data.updatedAt, counts: data.counts || {}, lic: data.lic, byCode, byHead };
}
function mrEntry(ref, L) {
  const e = ref.lic[L];
  if (!e) return null;
  const seen = new Set(), ings = [];
  for (const x of e[3] || []) {
    const canon = scCanonIng(x[0]);
    if (!canon || seen.has(canon)) continue;
    seen.add(canon);
    ings.push({ name: x[0], label: stripSalt(x[0]).replace(/\s+hydrogen$/i, "").trim() || x[0], canon, amt: x[1], unit: x[2] });
  }
  const a = e[4];
  return { lic: L, en: e[0], zh: e[1], cancelled: !!e[2], ings,
    app: a ? { img: a[0], shape: a[1], color: a[2], score: a[3], marks: a[4], size: a[5] } : null };
}
// 健保碼：第 1 碼證別、第 2–7 碼許可證號（第 2 碼可能是品質等級碼），比對後 5 碼並以藥名確認
function mrForCode(ref, code, drugName) {
  if (!ref) return null;
  code = (code || "").trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9]\d{5}/.test(code)) return null;
  const t = MR_TYPE[code[0]];
  if (!t) return null;
  let c = ref.byCode.get(t + "|" + code.slice(2, 7)) || [];
  if (!c.length) return null;
  if (/\d/.test(code[1])) {
    const exact = c.filter(L => (mrLicParts(L) || {}).num === code.slice(1, 7));
    if (exact.length) c = exact;
  }
  if (c.length > 1) {
    const head = scBrandKey(drugName).split(" ")[0];
    const named = c.filter(L => scBrandKey(ref.lic[L][0]).split(" ")[0] === head);
    if (named.length) c = named;
    const valid = c.filter(L => !ref.lic[L][2]);
    if (valid.length) c = valid;
  }
  return mrEntry(ref, c[0]);
}
// 自備藥商品名 → 成分（同商品名的有效許可證；多個時以第二個字、含量篩選，取最多數的成分組合）
function mrBrandIngs(ref, si) {
  if (!ref) return null;
  const words = (si.brandKey || "").split(" ").filter(Boolean);
  const head = words[0];
  if (!head || SC_GENERIC_HEADS.has(head)) return null;
  let c = (ref.byHead.get(head) || []).filter(L => (ref.lic[L][3] || []).length);
  if (!c.length) return null;
  const valid = c.filter(L => !ref.lic[L][2]);
  if (valid.length) c = valid;
  if (words.length > 1) {
    const w2 = c.filter(L => scBrandKey(ref.lic[L][0]).split(" ")[1] === words[1]);
    if (w2.length) c = w2;
  }
  if (si.strengths.length) {
    const st = c.filter(L => scStrengthEq(si.strengths, scStrengths(ref.lic[L][0])) === true);
    if (st.length) c = st;
  }
  const groups = new Map();
  for (const L of c) {
    const e = mrEntry(ref, L);
    const sig = e.ings.map(i => i.canon).sort().join("+");
    if (!sig) continue;
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(e);
  }
  const best = Array.from(groups.values()).sort((a, b) => b.length - a.length)[0];
  return best ? { ings: best[0].ings.map(i => i.canon), entry: best[0] } : null;
}
// 雲端藥歷列加上許可證資料；複方以食藥署成分取代雲端只列出的部分成分
function enrichCloudRows(rows, ref) {
  if (!rows || !ref) return rows;
  return rows.map(r => {
    const e = mrForCode(ref, r.nhiCode, r.drugName);
    if (!e) return r;
    const nr = Object.assign({}, r, { ref: e });
    if (e.ings.length > 1) { nr.ingNameOrig = r.ingName; nr.ingName = e.ings.map(i => i.label).join(" + "); }
    return nr;
  });
}
function mrIngText(e) {
  return e.ings.map(i => i.label.toLowerCase() + (i.amt !== "" && i.amt != null ? " " + scNum(+i.amt) + " " + (i.unit || "").toLowerCase() : "")).join(" + ");
}
function useMedRef() {
  const [ref, setRef] = useState(null);
  const [status, setStatus] = useState(null);
  useEffect(() => {
    const local = globalThis.chrome && chrome.storage && chrome.storage.local;
    if (!local) return;
    let alive = true;
    local.get([MR_DATA_KEY, MR_STATUS_KEY]).then(o => {
      if (!alive) return;
      const st = o[MR_STATUS_KEY] || null;
      setStatus(st);
      setRef(mrPrepare(o[MR_DATA_KEY]));
      mrSend(st && st.state === "ready" && !o[MR_DATA_KEY] ? "medref-update" : "medref-ensure");
    }).catch(() => {});
    const onChanged = (ch, area) => {
      if (area !== "local" || !alive) return;
      if (ch[MR_STATUS_KEY]) setStatus(ch[MR_STATUS_KEY].newValue || null);
      if (ch[MR_DATA_KEY]) setRef(mrPrepare(ch[MR_DATA_KEY].newValue));
    };
    try { chrome.storage.onChanged.addListener(onChanged); } catch (e) {}
    return () => { alive = false; try { chrome.storage.onChanged.removeListener(onChanged); } catch (e) {} };
  }, []);
  return { ref, status, update: () => mrSend("medref-update") };
}
function mrSend(type) {
  try { chrome.runtime.sendMessage({ type }, () => void chrome.runtime.lastError); } catch (e) {}
}
function mrStatusText(medref) {
  const s = (medref && medref.status) || {};
  const fmt = t => { const d = new Date(t); return isNaN(d) ? "" : scFmt(d) + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  if (s.state === "downloading" && s.startedAt && Date.now() - s.startedAt < 5 * 60000) return { kind: "busy", text: "下載食藥署資料中（" + (s.step || "") + "）…" };
  if (s.state === "error") return { kind: "error", text: "更新失敗：" + (s.error || "未知錯誤") + (medref.ref ? "（沿用 " + fmt(medref.ref.updatedAt) + " 的資料）" : "") };
  if (medref && medref.ref) {
    const c = medref.ref.counts || {};
    return { kind: "ok", text: "已更新 " + fmt(medref.ref.updatedAt) + "・許可證 " + (c.licenses || 0).toLocaleString() + " 筆・外觀圖 " + (c.images || 0).toLocaleString() + " 筆" };
  }
  return { kind: "none", text: "尚未下載" };
}
function MedRefPanel({ medref }) {
  const h = React.createElement;
  const st = mrStatusText(medref);
  return h("div", { className: "mr-panel" },
    h("div", { className: "mr-status is-" + st.kind }, st.text),
    h("button", { type: "button", className: "mr-update", disabled: st.kind === "busy", onClick: medref.update }, st.kind === "busy" ? "下載中…" : "立即更新"),
    h("div", { className: "mr-note" }, "用健保碼對應食藥署許可證，補齊複方成分並顯示藥品外觀圖；每 7 天自動更新，只下載公開藥品資料，不傳送病人資料。"));
}
// 食藥署仿單資料頁（顯示中英文品名、許可證號；頁面上「藥品外觀」可看原始外觀圖）
function mrDetailUrl(e) { return e && e.lic ? "https://mcp.fda.gov.tw/im_detail_1/" + encodeURIComponent(e.lic) : ""; }
// 外觀詳細資料頁需要 item 編號（開放資料沒有）：點擊時讀取該許可證的外觀清單頁，取最新一筆
const MR_SHAPE_URLS = new Map();
function mrShapeListUrl(lic) { return "https://mcp.fda.gov.tw/im_shape/" + encodeURIComponent(lic); }
async function mrShapeDetailUrl(lic) {
  if (MR_SHAPE_URLS.has(lic)) return MR_SHAPE_URLS.get(lic);
  const base = "https://mcp.fda.gov.tw", listUrl = mrShapeListUrl(lic);
  try {
    const html = await fetch(listUrl, { credentials: "omit", cache: "no-store" }).then(r => r.ok ? r.text() : "");
    const doc = new DOMParser().parseFromString(html, "text/html");
    let best = null;
    for (const a of doc.querySelectorAll('a[href*="/im_shape_detail/"]')) {
      const row = a.closest("tr");
      const d = ((row && row.textContent) || "").match(/\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2})?/);
      const key = d ? d[0] : "";
      if (!best || key > best.key) best = { href: a.getAttribute("href"), key };
    }
    if (best) {
      let url = new URL(best.href, base).href;
      url += (url.indexOf("?") >= 0 ? "&" : "?") + "open=1";
      MR_SHAPE_URLS.set(lic, url);
      return url;
    }
  } catch (e) {}
  return listUrl;
}
function mrOpenShape(ev, lic) {
  ev.preventDefault();
  ev.stopPropagation();
  const w = window.open("about:blank", "_blank");   // 先開分頁，避免查詢後被當成彈出視窗擋下
  if (w) { try { w.opener = null; w.document.title = "載入藥品外觀…"; } catch (e) {} }
  mrShapeDetailUrl(lic).then(url => { if (w && !w.closed) w.location.href = url; else window.open(url, "_blank", "noreferrer"); });
}
function ShapeLink({ e, label }) {
  if (!e || !e.lic || !e.app) return null;
  return React.createElement("a", { className: "med-doc med-shape", href: mrShapeListUrl(e.lic), target: "_blank", rel: "noreferrer",
    title: "開啟食藥署藥品外觀詳細資料頁（" + e.lic + "）", onClick: ev => mrOpenShape(ev, e.lic) }, label || "外觀圖");
}
// 外觀圖大小：清單縮圖高度、滑過放大倍率、入院前用藥紀錄的圖片高度
const PILL_SIZES = { s: { h: 20, zoom: 7, sheet: 52 }, m: { h: 28, zoom: 5, sheet: 72 }, l: { h: 44, zoom: 3.6, sheet: 100 }, xl: { h: 64, zoom: 2.6, sheet: 130 } };
function MedThumb({ e }) {
  const h = React.createElement;
  const [bad, setBad] = useState(false);
  if (!e || !e.lic) return null;
  const a = e.app;
  const href = mrDetailUrl(e);
  const tip = [e.zh, e.en, e.lic, a ? [a.shape, a.color].filter(Boolean).join("・") : "", a && a.score && a.score !== "無" ? "刻痕 " + a.score : "",
    a && a.marks ? "標註 " + a.marks : "", a && a.size ? a.size + " mm" : ""].filter(Boolean).join("｜") +
    "\n點擊開啟食藥署仿單資料頁核對品名；該頁「藥品外觀」可看原始外觀圖";
  const stop = ev => ev.stopPropagation();
  if (!a || !a.img || bad) return h(React.Fragment, null,
    h("a", { className: "med-doc", href, target: "_blank", rel: "noreferrer", title: tip, onClick: stop }, "仿單"),
    h(ShapeLink, { e }));
  return h(React.Fragment, null,
    h("a", { className: "med-thumb", href, target: "_blank", rel: "noreferrer", title: tip, onClick: stop },
      h("img", { src: a.img, alt: "藥品外觀", loading: "lazy", referrerPolicy: "no-referrer", onError: () => setBad(true) })),
    h(ShapeLink, { e }));
}

// ── 入院前用藥紀錄（列印給藥師與病人逐項確認）──────────────────────────────────
const AD_COUNT = { QD: 1, QDAM: 1, QAM: 1, QDPM: 1, QPM: 1, BID: 2, TID: 3, QID: 4, HS: 1, QN: 1, QHS: 1 };
const AD_PLAIN = { QOD: "隔天 1 次", QW: "每週 1 次", BIW: "每週 2 次", TIW: "每週 3 次", STAT: "立即使用", ONCE: "使用 1 次",
  ASORDER: "依醫師指示", IRRE: "不定時使用" };
function adWhen(base, meal) {
  if (!meal) return { TID: "早、中、晚", BID: "早、晚", QID: "早、中、晚、睡前", HS: "睡前", QN: "睡前", QHS: "睡前",
    QDAM: "早上", QAM: "早上", QDPM: "晚上", QPM: "晚上" }[base] || "";
  return { TID: "三餐" + meal, BID: "早晚" + meal, QID: "三餐" + meal + "、睡前", QDAM: "早餐" + meal, QAM: "早餐" + meal }[base] || meal;
}
// 頻率代碼 → 白話（看不懂的代碼原樣保留）
function adFreqZh(freq) {
  const raw = (freq || "").toUpperCase().replace(/\s+/g, "");
  if (!raw) return "";
  const parts = raw.split(/[+&]/).filter(Boolean).map(p0 => {
    let p = p0, prn = false, meal = "", hs = false;
    if (/PRN/.test(p)) { prn = true; p = p.replace("PRN", ""); }
    const m = p.match(/^(QD|QDAM|QAM|BID|TID|QID|QOD)(AC|PC)\d*(HS)?$/);
    if (m) { p = m[1]; meal = m[2] === "AC" ? "飯前" : "飯後"; hs = !!m[3]; }
    else if (/^(BID|TID)HS$/.test(p)) { p = p.slice(0, 3); hs = true; }
    let text = "";
    const qh = p.match(/^Q(\d+)H$/), qdN = p.match(/^Q(\d+)D$/);
    if (AD_COUNT[p]) {
      const n = AD_COUNT[p] + (hs ? 1 : 0), w = adWhen(p, meal);
      text = "每天 " + n + " 次" + (w || hs ? "（" + [w, hs ? "睡前" : ""].filter(Boolean).join("、") + "）" : "");
      if (p === "HS" || p === "QN" || p === "QHS") text = "睡前 1 次";
    } else if (AD_PLAIN[p]) text = AD_PLAIN[p] + (meal ? "（" + meal + "）" : "");
    else if (qh) text = "每 " + qh[1] + " 小時 1 次";
    else if (qdN) text = "每 " + qdN[1] + " 天 1 次";
    else if (!p && prn) text = "";
    else return null;
    return (prn ? "需要時使用" + (text ? "，最多" + text : "") : text);
  });
  return parts.every(Boolean) ? parts.join("；") : "";
}
const AD_UNIT = { tab: "顆", cap: "顆", ml: "mL", pack: "包", supp: "顆", puff: "下", drops: "滴", patch: "片", vial: "瓶", enema: "支" };
function adAmountZh(n, unit) {
  const u = AD_UNIT[(unit || "").toLowerCase()] || unit || "";
  if (Math.abs(n - 0.5) < 1e-6) return "半" + u;
  if (Math.abs(n - 0.25) < 1e-6) return "1/4 " + u;
  if (Math.abs(n - 0.75) < 1e-6) return "3/4 " + u;
  return scNum(n) + " " + u;
}
function adUsage(p) {
  const fz = adFreqZh(p.freq);
  const compound = /[+&]/.test(p.freq || "");
  const m = (p.perDose || "").match(/^([\d.]+)\s*(.*)$/);
  let main;
  if (compound && p.daily) main = "每天共 " + adAmountZh(p.daily, p.dailyUnit);
  else if (m) main = "每次 " + adAmountZh(parseFloat(m[1]), m[2]);
  else main = "依指示使用";
  return { main, freq: fz || p.freq || "", code: p.freq || "" };
}
function buildAdmitList(rows, refDate, grace, flags) {
  const products = scCloudProducts(rows || [], refDate, grace);
  const recentFrom = new Date(refDate.getTime() - 90 * 86400000);
  const picked = products.filter(p => {
    if (p.dispDate && p.dispDate > refDate) return false;
    if (p.active) return flags.short || !p.short;
    return flags.recent && p.end && p.end >= recentFrom && (flags.short || !p.short);
  });
  const groups = groupByInstitution(picked.map(p => p.latest)).map(([key, g]) => ({
    key, date: g.date, inst: g.inst,
    items: g.rows.map(r => picked.find(p => p.latest === r)).filter(Boolean)
  }));
  return { groups, count: picked.length };
}

function AdmitRecordView({ rows, initialRef, grace, links, source, onClose }) {
  const h = React.createElement;
  const [showPills, setShowPills] = useState(true);   // 紙本預設一律顯示外觀圖（與清單的圖片開關分開）
  const [refStr, setRefStr] = useState(() => scFmt(initialRef || new Date()).replace(/\//g, "-"));
  const [flags, setFlags] = useState({ short: true, recent: false });
  const [checks, setChecks] = useState({});
  const [copied, setCopied] = useState(false);
  const refDate = useMemo(() => { const d = scYmd(refStr.replace(/-/g, "/")); if (d) return d; const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, [refStr]);
  const list = useMemo(() => buildAdmitList(rows, refDate, grace, flags), [rows, refDate, grace, flags]);
  const today = new Date();
  const setCheck = (k, patch) => setChecks(prev => Object.assign({}, prev, { [k]: Object.assign({}, prev[k] || {}, patch) }));
  const box = on => on ? "☑" : "☐";

  function copy() {
    const out = [`【入院前用藥紀錄】參考日 ${scFmt(refDate)}　確認日 ${scFmt(today)}`];
    const pending = [];
    for (const g of list.groups) {
      out.push(`【${g.inst}】${fmtDate(g.date)}`);
      for (const p of g.items) {
        const c = checks[p.key] || {};
        const u = adUsage(p);
        const name = [p.label, p.strengthText].filter(Boolean).join(" ") + (p.ingText ? `（${p.ingText.toLowerCase()}）` : "");
        const st = c.take === "yes" ? "有服用" : c.take === "no" ? "未服用" : c.take === "diff" ? "用法不同" : "";
        if (!st) pending.push(name);
        out.push(`・${name}　${u.main}，${u.freq}${u.code && u.freq !== u.code ? `（${u.code}）` : ""}` +
          (st ? `：${st}` : "：未確認") + (c.brought ? "，有帶藥" : "") + (c.note ? `（${c.note}）` : ""));
      }
    }
    if (pending.length) out.push("", `未確認 ${pending.length} 項`);
    navigator.clipboard.writeText(out.join("\n")).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }

  function row(p) {
    const c = checks[p.key] || {};
    const u = adUsage(p);
    const e = p.ref;
    const look = e && e.app ? [e.app.shape, e.app.color, e.app.score && e.app.score !== "無" ? "刻痕" + e.app.score : "", e.app.marks ? "標註 " + e.app.marks : ""].filter(Boolean).join("・") : "";
    const r = p.latest;
    const dx = [r.diagCode, r.diagName].filter(Boolean).join(" ");
    const linked = links && links.get(p.key);
    const pick = (v, label) => h("button", { type: "button", className: "ad-choice no-print" + (c.take === v ? " on" : ""),
      "aria-pressed": c.take === v, onClick: () => setCheck(p.key, { take: c.take === v ? "" : v }) }, label);
    return h("tr", { key: p.key, className: "ad-row" },
      !showPills ? null : h("td", { className: "ad-img" }, e && e.app
        ? h("a", { href: mrDetailUrl(e), target: "_blank", rel: "noreferrer", title: "開啟食藥署仿單資料頁核對品名" },
            h("img", { src: e.app.img, alt: "藥品外觀", referrerPolicy: "no-referrer", onError: ev => { ev.currentTarget.style.display = "none"; } }))
        : h("span", { className: "ad-noimg" }, "無圖")),
      h("td", { className: "ad-drug" },
        e && e.zh ? h("div", { className: "ad-zh" }, e.zh) : null,
        h("div", { className: "ad-en" }, [p.label, p.strengthText].filter(Boolean).join(" ")),
        p.ingText ? h("div", { className: "ad-ing" }, p.ingText.toLowerCase()) : null,
        look ? h("div", { className: "ad-look" }, look) : null,
        e && e.lic ? h("div", { className: "ad-lic" }, h("a", { href: mrDetailUrl(e), target: "_blank", rel: "noreferrer" }, e.lic),
          e.app ? h("span", { className: "no-print" }, " ", h(ShapeLink, { e })) : null) : null,
        linked ? h("div", { className: "ad-tag" }, "已開自備藥：" + linked.join("、")) : null),
      h("td", { className: "ad-use" },
        h("div", { className: "ad-use-main" }, u.main),
        h("div", { className: "ad-use-freq" }, u.freq),
        u.code && u.code !== u.freq ? h("div", { className: "ad-code" }, u.code) : null),
      h("td", { className: "ad-src" },
        dx ? h("div", null, dx) : null,
        h("div", { className: "ad-meta" }, (p.days ? p.days + " 天" : "") + (p.short ? "（短期）" : "")),
        p.end ? h("div", { className: "ad-meta" + (p.active ? "" : " is-out") }, (p.active ? "可用至 " : "已用完 ") + scFmt(p.end)) : null),
      h("td", { className: "ad-check" },
        h("div", { className: "ad-print-boxes" },
          h("div", null, box(c.take === "yes") + " 有服用"),
          h("div", null, box(c.take === "no") + " 未服用"),
          h("div", null, box(c.take === "diff") + " 用法不同：" + (c.note || "＿＿＿＿")),
          h("div", null, box(c.brought) + " 有帶藥")),
        h("div", { className: "ad-screen-controls no-print" },
          h("div", { className: "ad-choices" }, pick("yes", "有服用"), pick("no", "未服用"), pick("diff", "用法不同")),
          h("label", { className: "ad-brought" }, h("input", { type: "checkbox", checked: !!c.brought, onChange: ev => setCheck(p.key, { brought: ev.target.checked }) }), " 有帶藥"),
          h("input", { type: "text", className: "ad-note", placeholder: "備註（病人實際用法等）", value: c.note || "",
            onChange: ev => setCheck(p.key, { note: ev.target.value }) }))));
  }

  return h("div", { className: "admit-layer" },
    h("div", { className: "ad-toolbar no-print" },
      h("button", { type: "button", className: "sc-btn", onClick: onClose }, "← 返回" + (source || "")),
      h("label", { className: "ad-opt" }, "參考日 ", h("input", { type: "date", value: refStr, onChange: ev => ev.target.value && setRefStr(ev.target.value) })),
      h("label", { className: "ad-opt" }, h("input", { type: "checkbox", checked: flags.short, onChange: ev => setFlags(f => Object.assign({}, f, { short: ev.target.checked })) }), " 含短期處方"),
      h("label", { className: "ad-opt" }, h("input", { type: "checkbox", checked: flags.recent, onChange: ev => setFlags(f => Object.assign({}, f, { recent: ev.target.checked })) }), " 含 90 天內已用完"),
      h("label", { className: "ad-opt" }, h("input", { type: "checkbox", checked: !!showPills, onChange: ev => setShowPills(ev.target.checked) }), " 顯示外觀圖"),
      h("span", { className: "ad-spacer" }),
      h("button", { type: "button", className: "sc-btn" + (copied ? " is-done" : ""), onClick: copy }, copied ? "✓ 已複製" : "複製確認結果"),
      h("button", { type: "button", className: "sc-btn sc-btn-main", onClick: () => window.print() }, "列印")),
    h("article", { className: "admit-sheet" },
      h("header", { className: "ad-head" },
        h("h2", null, "入院前用藥紀錄"),
        h("div", { className: "ad-fields" },
          h("span", null, "姓名＿＿＿＿＿＿"), h("span", null, "病歷號＿＿＿＿＿＿"), h("span", null, "床號＿＿＿＿"),
          h("span", null, "參考日 " + scFmt(refDate)), h("span", null, "製表 " + scFmt(today))),
        h("div", { className: "ad-sub" }, "依健保雲端藥歷整理參考日仍在用藥期間的藥品" + (flags.recent ? "（含 90 天內已用完）" : "") +
          "，共 " + list.count + " 項。請病人或家屬逐項確認是否仍在服用、用法是否相同、是否有帶藥來。")),
      list.count === 0 ? h("div", { className: "ad-empty" }, "參考日沒有仍在用藥期間的雲端藥品。") :
        h("table", { className: "ad-table" },
          h("thead", null, h("tr", null, (showPills ? ["外觀"] : []).concat(["藥品", "用法", "開立診斷／天數", "病人確認"]).map(t =>
            h("th", { key: t, className: { "外觀": "ad-img", "藥品": "ad-drug", "用法": "ad-use", "開立診斷／天數": "ad-src", "病人確認": "ad-check" }[t] }, t)))),
          list.groups.map(g => h("tbody", { key: g.key },
            h("tr", { className: "ad-group" }, h("td", { colSpan: showPills ? 5 : 4 }, g.inst + "　" + fmtDate(g.date))),
            g.items.map(row)))),
      h("section", { className: "ad-extra" },
        h("div", { className: "ad-extra-title" }, "其他自行服用的藥品（含其他醫院、藥局購買、中藥、保健食品）"),
        [0, 1, 2, 3].map(i => h("div", { key: i, className: "ad-line" }))),
      h("footer", { className: "ad-foot" },
        h("span", null, "確認者（藥師）＿＿＿＿＿＿　病人／家屬＿＿＿＿＿＿"),
        h("span", null, "資料來源：健保雲端藥歷、食藥署藥品外觀圖；圖片僅供辨識參考，以實際藥品為準。"))));
}

// ── 出院用藥比較：HIS 病人頁面解析與入院前／出院後比較 ─────────────────────────────
// ── 出院用藥比較：解析 HIS 病人頁面（全選複製）＋雲端藥歷 ─────────────────────────
const HIS_ORDER_START = /^\s*(\d{3,6})\s+([^\s\d])\s+(\S{1,6})\s+([A-Z])\s+(\d{8})(?=\s|$)/;
const HIS_STOP = /^\s*(健保雲端藥歷|錯誤回報|來源\s|本院門診|他院門診|本院藥局|他院藥局|病人自備藥查詢|類別\s+狀態)/;
function hisCleanGeneric(s) {
  return (s || "").replace(/Uptodate.*$/i, "").replace(/\s+/g, " ").trim();
}
function hisCleanBrand(s) {
  s = (s || "").replace(/\s+/g, " ").trim();
  const m = s.match(/^(.*?\/\s*(?:tab|cap|vial|amp|bag|btl|bot|pack|pk|supp|tube|syringe|pen|kit|patch|支|瓶|包|粒|錠|顆|片))(?![a-z])/i);
  if (m) return m[1].trim();
  return s.replace(/\s+[一-鿿].*$/, "").trim();
}
// 住院醫囑：序號 狀 階 類 開方日 [處方號] [警] 學名 商品名 / 劑量 單位 / 頻率 途徑 天數 帳 組（一筆可跨多行）
function parseInpatientOrders(text) {
  const lines = (text || "").replace(/\r/g, "").replace(/ /g, " ").split("\n");
  const recs = [];
  let cur = null;
  for (const ln of lines) {
    if (HIS_ORDER_START.test(ln)) { if (cur) recs.push(cur); cur = [ln]; continue; }
    if (!cur) continue;
    if (HIS_STOP.test(ln)) { recs.push(cur); cur = null; continue; }
    cur.push(ln);
  }
  if (cur) recs.push(cur);
  const out = [];
  for (const rec of recs) {
    const m = rec[0].match(HIS_ORDER_START);
    const headCells = rec[0].split(/\t|\s{2,}/).map(c => c.trim()).filter(Boolean);
    const at = headCells.indexOf(m[5]);
    let rest = headCells.slice(at + 1);
    let orderNo = "";
    if (rest[0] && /^[A-Z]\d{3,5}$/.test(rest[0])) orderNo = rest.shift();
    // 警示欄（如「極量檢核」）可能有字也可能空白：學名＝第一個含 Uptodate 或英文藥名的欄位，之前的都是警示文字
    let gi = rest.findIndex(c => /uptodate/i.test(c));
    if (gi < 0) gi = rest.findIndex(c => /[A-Za-z]{3,}/.test(c) && !/^[A-Z]\d{3,5}$/.test(c));
    const warn = gi > 0 ? rest.slice(0, gi).join(" ") : "";
    if (gi > 0) rest = rest.slice(gi);
    const o = { seq: m[1], status: m[2], stage: m[3], cat: m[4], date: m[5], orderNo, warn,
      generic: "", brand: "", dose: "", unit: "", freq: "", route: "", days: "", pay: "" };
    // 多行格式：劑量行「數字 單位」、頻率行「頻率 途徑 天數 帳 …」
    let doseAt = -1;
    for (let i = 1; i < rec.length; i++) {
      const c = rec[i].split("\t").map(x => x.trim()).filter(Boolean);
      if (doseAt < 0 && c.length === 2 && /^\d+(\.\d+)?$/.test(c[0])) { o.dose = c[0]; o.unit = c[1]; doseAt = i; continue; }
      if (doseAt >= 0 && c.length && scIsFreq(c[0])) {
        o.freq = c[0]; o.route = c[1] || "";
        if (/^\d+$/.test(c[2] || "")) o.days = c[2];
        o.pay = /^[健自付]$/.test(c[3] || "") ? c[3] : "";
        break;
      }
    }
    if (doseAt >= 0) {
      o.generic = hisCleanGeneric(rest[0]);
      o.brand = hisCleanBrand(rest[1] || rest[0]);
    } else {
      // 單行格式（以兩個以上空白分欄）
      const segs = rec.join("  ").split(/\t|\s{2,}/).map(s => s.trim()).filter(Boolean);
      let last = segs.length - 1;
      if (/^(詳|明細|詳細)$/.test(segs[last])) last--;
      const tail = (segs[last] || "").split(/\s+/);
      let p = tail.length - 1;
      if (p >= 0 && /^[健自付]$/.test(tail[p])) { o.pay = tail[p]; p--; }
      if (p >= 0 && /^\d+$/.test(tail[p])) { o.days = tail[p]; p--; }
      if (p >= 0) { o.route = tail[p]; p--; }
      o.freq = tail.slice(0, p + 1).join("");
      o.unit = segs[last - 1] || "";
      o.dose = segs[last - 2] || "";
      const names = segs.slice(headCells.length > 6 ? 1 : 1, last - 2).filter(s => !HIS_ORDER_START.test(s));
      const nameCells = (rest.length ? rest : names).filter(c => /[A-Za-z]{3,}/.test(c));
      o.generic = hisCleanGeneric(nameCells[0]);
      o.brand = hisCleanBrand(nameCells[1] || nameCells[0]);
    }
    if (/[A-Za-z]{2,}/.test(o.generic + " " + o.brand)) out.push(o);
  }
  return out;
}
function parseHisPage(raw) {
  const text = (raw || "").replace(/\r/g, "").replace(/ /g, " ");
  const lines = text.split("\n");
  const info = {};
  const KEYS = ["姓名", "年齡", "性別", "床號", "帳號", "病歷號", "動態"];
  for (const ln of lines) {
    const c = ln.split("\t").map(x => x.trim());
    for (let i = 0; i < c.length - 1; i++) if (KEYS.includes(c[i]) && !info[c[i]] && c[i + 1]) info[c[i]] = c[i + 1];
  }
  const DATE_RE = /\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/g;
  const ymd = s => scYmd((s || "").replace(/-/g, "/"));
  // 轉床紀錄查詢：床號 起始時間 結束時間；最早的起始時間＝入院日
  const transfers = [];
  const iTr = lines.findIndex(l => /轉床紀錄/.test(l));
  if (iTr >= 0) {
    for (let j = iTr + 1; j < Math.min(lines.length, iTr + 60); j++) {
      const ln = lines[j];
      const m = ln.match(/^\s*([A-Za-z0-9][\w-]*)\s+(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/);
      if (!m) { if ((transfers.length && ln.trim()) || /准許出院日|病人自備藥查詢|類別\s+狀態|序號\s+狀/.test(ln)) break; continue; }
      const ds = ln.match(DATE_RE) || [];
      transfers.push({ bed: m[1], start: ymd(ds[0]), end: ds[1] ? ymd(ds[1]) : null });
    }
  }
  const trStarts = transfers.map(t => t.start).filter(Boolean).sort((x, y) => x - y);
  const admitDate = trStarts[0] || null;
  // 准許出院日：可能設定、取消多次；同列有取消時間（第三個日期）就不算，其餘取最後設定的一筆
  let dischargeDate = null, dcSetAt = null, found = false;
  const dischargeCancelled = [];
  const iDc = lines.findIndex(l => /准許出院日/.test(l));
  if (iDc >= 0) {
    for (let j = iDc + 1; j < Math.min(lines.length, iDc + 60); j++) {
      const ln = lines[j];
      const ds = /^\s*\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(ln) ? ln.match(DATE_RE) : null;
      if (!ds) { if (found && ln.trim()) break; continue; }
      found = true;
      const d = ymd(ds[0]), setAt = ds[1] ? ymd(ds[1]) : null;
      if (!d) continue;
      if (ds.length >= 3) dischargeCancelled.push(d);
      else if (!dischargeDate || (setAt && dcSetAt ? setAt > dcSetAt || (+setAt === +dcSetAt && d > dischargeDate) : d > dischargeDate)) { dischargeDate = d; dcSetAt = setAt; }
    }
  }
  const self = parseSelfOrders(text).filter(r => /自備/.test(r.category));
  const orders = parseInpatientOrders(text);
  // 雲端藥歷只從「健保雲端藥歷／來源 主診斷碼…」標題之後讀，避免把頁面其他文字（警示、選單）當成藥品
  let cloud = [];
  const iCloud = lines.findIndex(l => /健保雲端藥歷|^\s*來源\s+主診斷碼/.test(l));
  if (iCloud >= 0) {
    try { cloud = parseRows(lines.slice(iCloud).join("\n")).filter(r => (r.drugName || "").trim() || (r.ingName || "").trim()); } catch (e) { cloud = []; }
  }
  return { info, admitDate, transfers, dischargeDate, dischargeCancelled, self, orders, cloud };
}

// ── 比較：雲端（入院時仍有藥）× 自備藥 × 出院後用藥 ─────────────────────────────
const DC_CAT = {
  changed: { label: "用法有變化", cls: "sc-warn", order: 0 },
  added: { label: "新增", cls: "sc-info", order: 1 },
  kept: { label: "沿用", cls: "sc-ok", order: 2 },
  dropped: { label: "出院未開", cls: "sc-bad", order: 3 }
};
function dcDaily(dose, unit, freq, strengths) {
  // 回傳 { count, unit, mg }；PRN／不定時回傳 null
  if (SC_NONSCHEDULED.test(freq || "")) return null;
  const d = parseFloat(dose);
  if (!(d > 0)) return null;
  const div = getFreqDivisor(freq);
  const u = (unit || "").toLowerCase();
  const mgPer = scSingleMg(strengths || []);
  if (SC_COUNT_UNITS.has(u)) return { count: d * div, unit: u, mg: mgPer != null ? d * div * mgPer : null };
  if (SC_MASS[u]) return { count: null, unit: "mg", mg: d * div * SC_MASS[u] };
  return { count: d * div, unit: u, mg: null };
}
function dcSameDaily(a, b, sa, sb) {
  if (!a || !b) return null;
  if (a.mg != null && b.mg != null) return scClose(a.mg, b.mg);
  if (a.count != null && b.count != null && scStrengthEq(sa || [], sb || []) !== false) return scClose(a.count, b.count);
  return null;
}
const dcFreqCore = f => (f || "").toUpperCase().replace(/\s+/g, "").replace(/(AC|PC)(\d+)?/g, "");
function dcDailyText(x, preferMg) { return !x ? "" : (preferMg || x.count == null) && x.mg != null ? scNum(x.mg) + " mg/日" : x.count != null ? scNum(x.count) + " " + x.unit + "/日" : ""; }
const dcStrText = list => list.map(g => g.text).join(" ").replace(/(\d)\s*([a-zA-Zμµ])/g, "$1 $2");

function buildDischargeCompare(page, opts) {
  // 以「出院後要用的藥」（出院處方＋起日為出院日的出院自備藥）為主，往前對照入院前的雲端領藥
  const grace = opts && Number.isFinite(opts.grace) ? opts.grace : 14;
  const medref = opts && opts.medref;
  const custom = new Map(Object.entries((opts && opts.customMap) || {}));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selfAll = page.self.filter(r => !scInactive(r.status));
  const dcOrders = page.orders.filter(o => o.stage === "出院" && !scInactive(o.status));
  const starts = selfAll.map(r => scYmd(r.startDate)).concat(page.orders.map(o => scYmd(o.date))).filter(Boolean).sort((a, b) => a - b);
  const admitDate = page.admitDate || starts[0] || today;
  const dcDates = dcOrders.map(o => scYmd(o.date)).filter(Boolean).sort((a, b) => b - a);
  const dischargeDate = page.dischargeDate || dcDates[0] || today;
  const cloudRows = enrichCloudRows(page.cloud, medref) || [];
  const cloudAll = scCloudProducts(cloudRows, admitDate, grace);
  const atAdmit = p => p.active && (!p.dispDate || p.dispDate <= admitDate);

  // 出院自備藥＝起日在出院日當天或之後的自備藥醫囑（出院時重新開立，同藥同用法只列一次）；
  // 入院時的自備藥＝其餘仍有效的自備藥醫囑
  const selfAdmit = scSplitSelfForAdmit(selfAll, dischargeDate).use.filter(r => !scInactive(r.status));
  const contSeen = new Map();
  for (const r of selfAll) {
    const s = scYmd(r.startDate);
    if (!s || s < dischargeDate) continue;
    const k = [scBrandKey(r.name), r.dose, r.unit, r.freq, r.route].join("|");
    if (!contSeen.has(k)) contSeen.set(k, Object.assign({}, r, { notes: r.note ? [r.note] : [] }));
    else { const x = contSeen.get(k); if (r.note && !x.notes.includes(r.note)) x.notes.push(r.note); }
  }
  const selfCont = Array.from(contSeen.values());

  const orderItem = (o, src) => {
    let ings = scSplitIngs(o.generic);
    const brandKey = scBrandKey(o.brand);
    if (!ings.length) { const d = scLookupBrand(brandKey, SC_BRANDS) || (medref && mrBrandIngs(medref, { brandKey, strengths: scStrengths(o.brand) })); if (d) ings = d.ings.slice(); }
    return { src, brandKey, ings, strengths: scStrengths(o.brand), o };
  };
  const selfItem = (r, src) => { const si = scSelfInfo(r, cloudAll, custom, medref); return { src, brandKey: si.brandKey, ings: si.ings, strengths: si.strengths, r, si }; };
  const items = [];
  for (const p of cloudAll) items.push({ src: "cloud", brandKey: p.brandKey, ings: p.ings, strengths: p.strengths, p });
  for (const r of selfAdmit) items.push(selfItem(r, "admit"));
  for (const o of dcOrders) items.push(orderItem(o, "dc"));
  for (const r of selfCont) items.push(selfItem(r, "cont"));
  const inpt = page.orders.filter(o => o.stage !== "出院").map(o => orderItem(o, "inpt"));
  // 同一藥品歸成一組（同商品名或成分完全相同）
  const parent = items.map((_, i) => i);
  const find = i => parent[i] === i ? i : (parent[i] = find(parent[i]));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++)
    if (scMatchLevel(items[i], items[j]) >= 2) parent[find(i)] = find(j);
  const groups = new Map();
  items.forEach((it, i) => { const k = find(i); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); });

  const sumDaily = list => list.reduce((acc, a) => {
    const v = dcDaily(a.dose, a.unit, a.freq, a.strengths);
    if (!v) return acc;
    if (!acc) return Object.assign({}, v);
    acc.count = acc.count != null && v.count != null && acc.unit === v.unit ? acc.count + v.count : null;
    acc.mg = acc.mg != null && v.mg != null ? acc.mg + v.mg : null;
    return acc;
  }, null);
  const rows = [];
  for (const list of groups.values()) {
    const cl = list.filter(x => x.src === "cloud").map(x => x.p).sort((a, b) => (b.dispDate || 0) - (a.dispDate || 0));
    const clActive = cl.filter(atAdmit);
    const ad = list.filter(x => x.src === "admit"), d = list.filter(x => x.src === "dc"), ct = list.filter(x => x.src === "cont");
    const hasAfter = d.length > 0 || ct.length > 0;
    if (!hasAfter && !clActive.length && !ad.length) continue;   // 只有很久以前的雲端紀錄
    const after = d.map(x => ({ kind: "dc", name: x.o.brand, usage: dcOrderUsage(x.o), dose: x.o.dose, unit: x.o.unit, freq: x.o.freq, strengths: x.strengths, o: x.o }))
      .concat(ct.map(x => ({ kind: "cont", name: x.r.name, usage: scOrderUsage(x.r), notes: x.r.notes, dose: x.r.dose, unit: x.r.unit, freq: x.r.freq, strengths: x.strengths, r: x.r })));
    const primary = d.length ? after.filter(a => a.kind === "dc") : after;   // 有出院處方時以出院處方計算日量
    const afterDaily = sumDaily(primary);
    const afterStr = primary.length ? primary[0].strengths : [];
    const afterFreq = primary.length === 1 ? primary[0].freq : "";

    // 入院前基準：入院時仍有藥的雲端最近一次；沒有時用入院自備藥
    let base = null;
    if (clActive.length) {
      const p = clActive[0];
      base = { kind: "cloud", p, strengths: p.strengths, freq: p.freq,
        daily: p.daily ? { count: p.daily, unit: p.dailyUnit, mg: scSingleMg(p.strengths) != null ? p.daily * scSingleMg(p.strengths) : null } : null };
    } else if (ad.length) {
      base = { kind: "self", rows: ad.map(x => x.r), strengths: ad[0].strengths, freq: ad.length === 1 ? ad[0].r.freq : "",
        daily: sumDaily(ad.map(x => ({ dose: x.r.dose, unit: x.r.unit, freq: x.r.freq, strengths: x.strengths }))) };
    }
    let cat, details = [];
    if (!hasAfter) cat = "dropped";
    else if (base) {
      const same = dcSameDaily(base.daily, afterDaily, base.strengths, afterStr);
      const strEq = scStrengthEq(base.strengths, afterStr);
      if (strEq === false) details.push("含量 " + (dcStrText(base.strengths) || "?") + " → " + (dcStrText(afterStr) || "?"));
      const useMg = strEq === false && base.daily && afterDaily && base.daily.mg != null && afterDaily.mg != null;
      if (same === false) details.push("日量 " + dcDailyText(base.daily, useMg) + " → " + dcDailyText(afterDaily, useMg));
      const divChange = base.freq && afterFreq && Math.abs(getFreqDivisor(base.freq) - getFreqDivisor(afterFreq)) > 1e-6;
      if (divChange) details.push("頻率 " + base.freq + " → " + afterFreq);
      else if (base.freq && afterFreq && dcFreqCore(base.freq) === dcFreqCore(afterFreq) && base.freq.toUpperCase() !== afterFreq.toUpperCase()) details.push("服用時間 " + base.freq + " → " + afterFreq);
      if (same === null && !divChange && strEq !== false) details.push("劑量無法換算，請確認");
      if (base.kind === "self") details.push("雲端查無入院時用藥，與入院自備藥比較");
      cat = same === false || divChange || strEq === false ? "changed" : "kept";
    } else {
      cat = "added";
      if (cl.length) details.push("曾領過，最近 " + scFmt(cl[0].dispDate) + " " + cl[0].inst + "（入院時已用完）");
      const used = inpt.filter(x => d.some(y => scMatchLevel(x, y) >= 2) || ct.some(y => scMatchLevel(x, y) >= 2))
        .sort((x, y) => (y.o.date || "").localeCompare(x.o.date || ""));
      if (used.length) {
        const u = used[0].o, o = primary[0];
        const ua = [u.dose && (u.dose + " " + u.unit).trim(), u.freq].filter(Boolean).join(" ");
        const oa = o ? [o.dose && (o.dose + " " + o.unit).trim(), o.freq].filter(Boolean).join(" ") : "";
        details.push(!oa || ua.toUpperCase() === oa.toUpperCase() ? "住院中已使用，用法相同" : "住院中 " + ua + " → 出院 " + oa);
      } else if (d.length) details.push("住院中未使用");
    }
    if (d.length && ct.length) details.push("出院自備藥與出院處方同成分，請確認是否重複");
    for (const x of d) if (x.o.warn) details.push("HIS 警示：" + x.o.warn);
    if (!hasAfter && !clActive.length) details.push("入院時自備，雲端查無");
    const dcItem = d[0] && d[0].o;
    const name = (dcItem && dcItem.generic) || (cl[0] && cl[0].ingText) || (ct[0] && ct[0].si.ings.join(" + ")) || (ad[0] && ad[0].si.ings.join(" + ")) ||
      (cl[0] && cl[0].label) || (ct[0] && ct[0].r.name) || (ad[0] && ad[0].r.name) || (dcItem && dcItem.brand) || "";
    rows.push({ cat, name, after, base, cloud: cl, cloudActive: clActive, cloudKeys: new Set(cl.map(p => p.key)), admitSelf: ad.map(x => x.r),
      details, afterDaily, afterStr, ref: (clActive[0] || cl[0] || {}).ref || null });
  }
  const afterRank = r => r.after.length ? (r.after[0].kind === "dc" ? 0 : 1) : 2;
  rows.sort((a, b) => DC_CAT[a.cat].order - DC_CAT[b.cat].order || afterRank(a) - afterRank(b) || a.name.localeCompare(b.name));
  const counts = { kept: 0, changed: 0, added: 0, dropped: 0 };
  for (const r of rows) counts[r.cat]++;
  return { rows, counts, admitDate, dischargeDate, admitSrc: page.admitSrc || (page.admitDate ? "轉床紀錄" : "醫囑最早開方日"),
    dischargeSrc: page.dischargeSrc || (page.dischargeDate ? "准許出院日" : dcDates.length ? "出院醫囑開方日" : "今天"), info: page.info,
    cloudRows, nCloud: cloudAll.filter(atAdmit).length, nSelf: selfAdmit.length, nDc: dcOrders.length, nCont: selfCont.length };
}
const dcOrderUsage = o => [o.dose && (o.dose + " " + o.unit).trim(), o.freq, o.route, o.days ? o.days + "天" : ""].filter(Boolean).join(" ");
const dcAfterText = a => a.name + " " + a.usage + (a.notes && a.notes.length ? "（" + a.notes.join("、") + "）" : "") + "（" + (a.kind === "dc" ? "出院處方" : "出院自備藥") + "）";
function dcBaseText(r) {
  const b = r.base;
  if (!b) return "";
  if (b.kind === "cloud") return [b.p.label, b.p.strengthText].filter(Boolean).join(" ") + " " + scCloudUsage(b.p) + "（" + [scFmt(b.p.dispDate), b.p.inst].filter(Boolean).join(" ") + "）";
  return b.rows.map(x => x.name + " " + scOrderUsage(x)).join("；") + "（入院自備藥）";
}
// 雲端近幾次領藥欄位：每列（出院用藥）對到的雲端品項逐次列出，綠＝日量與出院相同，橘＝不同
function dcCellCmp(row, strengths, d, freq) {
  if (row.cat === "dropped" || !row.afterDaily || !d || SC_NONSCHEDULED.test(freq || "")) return null;
  const A = row.afterDaily, u = (d.unit || "").toLowerCase();
  const mgPer = scSingleMg(strengths || []);
  const cellMg = SC_MASS[u] ? d.daily * SC_MASS[u] : mgPer != null ? d.daily * mgPer : null;
  if (A.mg != null && cellMg != null) return scClose(A.mg, cellMg);
  if (A.count != null && A.unit === u && scStrengthEq(row.afterStr || [], strengths || []) !== false) return scClose(A.count, d.daily);
  return null;
}
function buildDischargeVisits(res, maxVisits) {
  const colMap = new Map();
  for (const r of res.cloudRows) {
    const disp = laterDate(r.date1, r.date2);
    const k = fmtDate(disp) + "|" + (r.institution || "");
    if (!colMap.has(k)) colMap.set(k, { key: k, date: scYmd(disp), inst: r.institution || "", refill: false, rows: [] });
    const c = colMap.get(k);
    if (r.date2 && fmtDate(r.date2) === fmtDate(disp) && fmtDate(r.date1) !== fmtDate(r.date2)) c.refill = true;
    c.rows.push(r);
  }
  const allCols = Array.from(colMap.values()).sort((a, b) => (b.date || 0) - (a.date || 0) || a.inst.localeCompare(b.inst));
  const cols = maxVisits > 0 ? allCols.slice(0, maxVisits) : allCols;
  const cells = res.rows.map(row => {
    const m = new Map();
    cols.forEach((c, ci) => {
      const recs = c.rows.filter(r => row.cloudKeys.has(drugKey(r)));
      if (!recs.length) return;
      const r = recs[0], p = row.cloud.find(x => x.key === drugKey(r));
      const daily = scRecordDaily(r);
      m.set(ci, { parts: formatDrugParts(r, { nameMode: "brand", showDays: true }), freq: r.freq || "", daily, name: r.drugName || "",
        cmp: dcCellCmp(row, p ? p.strengths : [], daily, r.freq), more: recs.length - 1 });
    });
    return m;
  });
  return { cols, totalVisits: allCols.length, cells };
}
function dischargeText(res) {
  const out = [`【出院用藥比較】入院 ${scFmt(res.admitDate)}　出院 ${scFmt(res.dischargeDate)}`];
  const withAfter = res.rows.filter(r => r.cat !== "dropped"), dropped = res.rows.filter(r => r.cat === "dropped");
  if (withAfter.length) {
    out.push("", "【出院用藥】");
    for (const r of withAfter) {
      let line = `・[${DC_CAT[r.cat].label}] ${r.name}：${r.after.map(dcAfterText).join("；")}`;
      if (r.base) line += ` ← 入院前 ${dcBaseText(r)}`;
      if (r.details.length) line += `；${r.details.join("；")}`;
      out.push(line);
    }
  }
  if (dropped.length) {
    out.push("", "【出院未開（入院前有藥）】");
    for (const r of dropped) {
      const p = r.cloudActive[0];
      const before = p ? [p.label, p.strengthText].filter(Boolean).join(" ") + " " + scCloudUsage(p) + "（" + [scFmt(p.dispDate), p.inst].filter(Boolean).join(" ") + (p.end ? "，可用至 " + scFmt(p.end) : "") + "）"
        : r.admitSelf.map(x => x.name + " " + scOrderUsage(x)).join("；") + "（入院自備藥）";
      out.push(`・${r.name}：${before}`);
    }
  }
  return out.join("\n");
}

// ── 外觀圖：開關按鈕與高度（px）設定 ────────────────────────────────────────────
const PILL_PRESETS = [["小", 20], ["中", 28], ["大", 44], ["特大", 64]];
function pillMetrics(px) {
  px = Math.max(12, Math.min(160, Math.round(+px || 28)));
  return { h: px, zoom: Math.max(1.3, Math.round(150 / px * 10) / 10), sheet: Math.max(40, Math.min(260, Math.round(px * 2.5))) };
}
function PillToggle({ show, setShow, className }) {
  if (!setShow) return null;
  return React.createElement("button", { type: "button", className: (className || "sc-btn") + " pill-toggle" + (show ? " on" : ""),
    "aria-pressed": !!show, title: show ? "隱藏藥品外觀圖" : "顯示藥品外觀圖", onClick: () => setShow(!show) }, show ? "圖片：開" : "圖片：關");
}
function PillSizeControl({ px, setPx }) {
  const h = React.createElement;
  const [draft, setDraft] = useState(String(px));
  useEffect(() => { setDraft(String(px)); }, [px]);
  const ok = n => Number.isFinite(n) && n >= 12 && n <= 160;
  return h("div", { className: "pill-size", style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
    h(SegmentedOption, { label: "外觀圖高度", value: px, options: PILL_PRESETS.map(([label, v]) => ({ value: v, label })), onChange: setPx }),
    h("label", { style: styles.graceField, title: "縮圖高度（12–160 px）；入院前用藥紀錄的圖片隨之等比例放大" }, "自訂 ",
      h("input", { type: "number", min: 12, max: 160, step: 2, value: draft, "aria-label": "外觀圖高度（px）", style: styles.graceInput,
        onChange: e => { setDraft(e.target.value); const n = Math.round(parseFloat(e.target.value)); if (ok(n)) setPx(n); },
        onBlur: e => { const n = Math.round(parseFloat(e.target.value)); if (ok(n)) setPx(n); else setDraft(String(px)); } }), " px"));
}

// ── component: DischargeView（出院用藥比較）──────────────────────────────────────
const dcIso = d => d ? d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") : "";
const dcFromIso = s => { const m = (s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
// 入院日／出院日：頁面讀得到就自動帶入，讀不到請使用者手動輸入（可一鍵套用建議日期）
function DcDateField({ label, value, auto, manual, onChange, onReset, status, warn, suggestions, inputRef }) {
  const h = React.createElement;
  return h("div", { className: "dc-date" + (!value ? " is-missing" : "") },
    h("span", { className: "dc-date-label" }, label),
    h("input", { type: "date", value: value || "", ref: inputRef, "aria-label": label, onChange: e => onChange(e.target.value) }),
    h("span", { className: "dc-src" + (warn ? " is-warn" : "") }, status),
    manual && auto ? h("button", { type: "button", className: "dc-chip", onClick: onReset }, "還原為 " + scFmt(auto)) : null,
    !value ? (suggestions || []).map(([t, d]) => h("button", { key: t, type: "button", className: "dc-chip", onClick: () => onChange(dcIso(d)) }, t + " " + scFmt(d))) : null);
}

function DischargeView({ input, setInput, cloudInput, setCloudInput, grace, medref, customMap, snap, setSnap, screen, setScreen, showPills, setShowPills, dates, setDates, visits, setVisits, onOpenSheet, onPageLoad, handoff }) {
  const h = React.createElement;
  const [error, setError] = useState("");
  const admitRef = React.useRef(null), dcRef = React.useRef(null);
  const [copied, setCopied] = useState(false);
  const topRef = React.useRef(null);
  const preview = useMemo(() => { try { return input && input.trim() ? parseHisPage(input) : null; } catch (e) { return null; } }, [input]);
  const sharedCloud = useMemo(() => {
    try { return cloudInput && cloudInput.trim() ? parseRows(cloudInput).filter(r => (r.drugName || "").trim() || (r.ingName || "").trim()) : []; } catch (e) { return []; }
  }, [cloudInput]);
  const mref = medref ? medref.ref : null;
  const res = useMemo(() => {
    if (!snap) return null;
    try { return buildDischargeCompare(snap, { grace, medref: mref, customMap }); } catch (e) { return { failed: e.message }; }
  }, [snap, grace, mref, customMap]);
  const vis = useMemo(() => { try { return res && !res.failed ? buildDischargeVisits(res, visits) : null; } catch (e) { return null; } }, [res, visits]);
  const showResult = screen === "result" && res;
  useEffect(() => { if (showResult && topRef.current && topRef.current.scrollIntoView) topRef.current.scrollIntoView({ behavior: "instant", block: "start" }); }, [showResult, snap]);

  // 手動日期只套用在同一位病人（換貼別的病人自動清掉）
  const pv = preview;
  const pkey = pv ? [pv.info["病歷號"], pv.info["帳號"], pv.info["姓名"]].filter(Boolean).join("|") : "";
  // 手動日期記下當時頁面讀到的日期；重新貼上後頁面日期變了（例如補按「轉床」）就改用頁面日期
  const autoAdmit = pv && pv.admitDate, autoDc = pv && pv.dischargeDate;
  const d0 = dates && dates.key === pkey ? dates : {};
  const man = {
    admit: d0.admit && d0.admitAuto === dcIso(autoAdmit) && d0.admit !== dcIso(autoAdmit) ? d0.admit : "",
    dc: d0.dc && d0.dcAuto === dcIso(autoDc) && d0.dc !== dcIso(autoDc) ? d0.dc : ""
  };
  const setMan = patch => setDates && setDates(Object.assign({ key: pkey, admit: man.admit, dc: man.dc, admitAuto: dcIso(autoAdmit), dcAuto: dcIso(autoDc) }, patch));
  const admitVal = man.admit || dcIso(autoAdmit), dcVal = man.dc || dcIso(autoDc);
  const orderStarts = pv ? pv.self.map(r => scYmd(r.startDate)).concat(pv.orders.map(o => scYmd(o.date))).filter(Boolean).sort((x, y) => x - y) : [];
  const dcOrderDates = pv ? pv.orders.filter(o => o.stage === "出院").map(o => scYmd(o.date)).filter(Boolean).sort((x, y) => y - x) : [];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  function run() {
    setError(""); setCopied(false);
    if (!input || !input.trim()) { setError("請在病人頁面按 Ctrl+A 全選、Ctrl+C 複製後貼上；雲端藥歷可貼在同一格的下方。"); return; }
    const page = parseHisPage(input);
    // 雲端藥歷以共用的雲端藥歷格為主；空白時才用病人頁面貼上內容裡附帶的雲端藥歷
    if (sharedCloud.length) { page.cloud = sharedCloud; page.cloudSrc = "box"; }
    else page.cloudSrc = page.cloud.length ? "page" : "none";
    if (!page.self.length && !page.orders.length) { setError("沒有讀到自備藥或住院醫囑，請確認貼上的是病人頁面全選複製的內容。"); return; }
    const ad = dcFromIso(admitVal), dd = dcFromIso(dcVal);
    if (!ad) { setError("沒有讀到入院日，請手動輸入（病人頁面先按「轉床」再全選複製，就能自動帶入）。"); if (admitRef.current) admitRef.current.focus(); return; }
    if (!dd) { setError("沒有有效的准許出院日，請手動輸入出院日（病人頁面先按「出院」再全選複製，就能自動帶入）。"); if (dcRef.current) dcRef.current.focus(); return; }
    if (dd < ad) { setError("出院日早於入院日，請確認日期。"); if (dcRef.current) dcRef.current.focus(); return; }
    page.admitDate = ad; page.dischargeDate = dd;
    page.admitSrc = man.admit ? "手動輸入" : "轉床紀錄";
    page.dischargeSrc = man.dc ? "手動輸入" : "准許出院日";
    setSnap(page); setScreen("result");
  }
  function copy() {
    if (!res || res.failed) return;
    navigator.clipboard.writeText(dischargeText(res)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }
  // ── 結果表：出院後用藥（主）→ 入院前雲端最近一次 → 雲端近幾次領藥
  function afterCell(r) {
    if (r.cat === "dropped") {
      const p = r.cloudActive[0];
      return h("div", { className: "dc-after is-dropped" },
        h("div", { className: "sc-name" }, p ? [p.label, p.strengthText].filter(Boolean).join(" ") : r.admitSelf.map(x => x.name).join("／")),
        h("div", { className: "sc-ing" }, (r.name || "").toLowerCase()));
    }
    return h("div", { className: "dc-after" },
      r.after.map((x, j) => h("div", { key: j, className: "dc-item" },
        h("div", { className: "sc-name" }, x.name),
        h("div", { className: "sc-usage" }, x.usage),
        x.notes && x.notes.length ? h("div", { className: "sc-note" }, x.notes.join("、")) : null,
        h("span", { className: "sc-tag sc-tag-sm" + (x.kind === "dc" ? " is-info" : "") }, x.kind === "dc" ? "出院處方" : "出院自備藥"))),
      r.name && r.name.toLowerCase() !== (r.after[0] && r.after[0].name || "").toLowerCase() ? h("div", { className: "sc-ing" }, r.name.toLowerCase()) : null);
  }
  function baseCell(r) {
    const b = r.base;
    if (r.cat === "dropped" && r.cloudActive[0]) {
      const p = r.cloudActive[0];
      return h("div", null, h("div", { className: "sc-cloud-name" }, h(MedThumb, { e: p.ref }), h("span", { className: "sc-usage" }, scCloudUsage(p))),
        h("div", { className: "sc-meta" }, [scFmt(p.dispDate), p.inst, p.days ? p.days + "天" : ""].filter(Boolean).join(" ")),
        p.end ? h("div", { className: "sc-supply" }, "可用至 " + scFmt(p.end)) : null);
    }
    if (b && b.kind === "cloud") {
      const p = b.p;
      return h("div", null,
        h("div", { className: "sc-cloud-name" }, h(MedThumb, { e: p.ref }), h("span", { className: "sc-oname" }, [p.label, p.strengthText].filter(Boolean).join(" "))),
        h("div", { className: "sc-usage" }, scCloudUsage(p)),
        h("div", { className: "sc-meta" }, [scFmt(p.dispDate), p.inst, p.days ? p.days + "天" : ""].filter(Boolean).join(" ")),
        p.end ? h("div", { className: "sc-supply" + (p.active ? "" : " is-out") }, (p.active ? "可用至 " : "已用完 ") + scFmt(p.end)) : null);
    }
    if (b && b.kind === "self") return h("div", null, b.rows.map((x, j) => h("div", { key: j, className: "dc-item" },
      h("div", { className: "sc-oname" }, x.name), h("div", { className: "sc-usage" }, scOrderUsage(x)), h("span", { className: "sc-tag sc-tag-sm" }, "入院自備藥"))));
    if (r.cat === "dropped") return h("div", null, r.admitSelf.map((x, j) => h("div", { key: j, className: "dc-item" },
      h("div", { className: "sc-usage" }, scOrderUsage(x)), h("span", { className: "sc-tag sc-tag-sm" }, "入院自備藥"))));
    return h("span", { className: "sc-none" }, r.cloud.length ? "入院時無藥" : "雲端查無");
  }
  function row(r, i) {
    const cat = DC_CAT[r.cat];
    const cells = vis ? vis.cells[res.rows.indexOf(r)] : null;
    return h("tr", { key: i, className: "sc-row " + cat.cls + (r.cat === "dropped" ? " is-dropped" : "") },
      h("td", { className: "sc-sticky dc-c-after" }, afterCell(r)),
      h("td", { className: "dc-c-change" },
        h("span", { className: "sc-status" }, cat.label),
        r.details.length ? h("div", { className: "sc-tags" }, r.details.map((t, j) => h("span", { key: j, className: "sc-tag" + (/重複/.test(t) ? " is-bad" : r.cat === "changed" && /^(含量|日量|頻率)/.test(t) ? " is-warn" : "") }, t))) : null),
      h("td", { className: "dc-c-base" }, baseCell(r)),
      vis ? vis.cols.map((c, ci) => {
        const cell = cells && cells.get(ci);
        const cls = !cell ? " is-empty" : cell.cmp === true ? " is-match" : cell.cmp === false ? " is-diff" : "";
        return h("td", { key: c.key, className: "sc-cell" + cls,
          title: cell ? cell.name + (cell.cmp === true ? "｜日量與出院相同" : cell.cmp === false ? "｜日量與出院不同" : "") : "該次未領" },
          cell ? scCellText(cell) + (cell.more ? " ＋" + cell.more : "") : "—");
      }) : null);
  }
  function resultTable() {
    const cols = vis ? vis.cols : [];
    const colSpan = 3 + cols.length;
    const groupsOrder = ["changed", "added", "kept", "dropped"];
    const body = [];
    for (const k of groupsOrder) {
      const list = res.rows.filter(r => r.cat === k);
      if (!list.length) continue;
      body.push(h("tr", { key: "d-" + k, className: "sc-divider" + (k === "dropped" ? " is-warn" : "") },
        h("td", { colSpan }, h("span", { className: "sc-sticky-label" }, (k === "dropped" ? "入院前有藥、出院未開" : DC_CAT[k].label) + "（" + list.length + "）"))));
      list.forEach((r, i) => body.push(row(r, k + i)));
    }
    return h("section", { className: "sc-zone" },
      h("div", { className: "sc-zone-head" }, "出院用藥 → 入院前雲端藥歷",
        h("small", null, "以出院處方與出院自備藥為主，往前對照入院時仍有藥的雲端領藥；右側由新到舊，綠底＝日量與出院相同，橘底＝不同"),
        vis ? h("div", { className: "sc-visit-pick", role: "group", "aria-label": "顯示領藥次數" },
          h("span", null, "顯示"),
          SC_VISIT_CHOICES.map(n => h("button", { key: n, type: "button", className: visits === n ? "on" : "", "aria-pressed": visits === n,
            onClick: () => setVisits(n) }, n ? "近 " + n + " 次" : "全部（" + vis.totalVisits + "）"))) : null),
      res.rows.length === 0 ? h("div", { className: "sc-empty" }, "沒有讀到出院處方或出院自備藥。") :
      h("div", { className: "sc-scroll" },
        h("table", { className: "sc-table sc-t2 dc-table" },
          h("thead", null, h("tr", null,
            h("th", { className: "sc-sticky" }, "出院後用藥"),
            h("th", null, "變化"),
            h("th", null, "入院前（雲端最近一次）"),
            cols.map((c, ci) => {
              const y = c.date ? c.date.getFullYear() : "";
              const showYear = ci === 0 || (cols[ci - 1].date && cols[ci - 1].date.getFullYear() !== y);
              return h("th", { key: c.key, className: "sc-visit", title: scFmt(c.date) + " " + c.inst },
                h("div", { className: "sc-vdate" }, showYear ? scFmt(c.date) : scMd(c.date), c.refill ? h("span", { className: "sc-vtag" }, "慢箋") : null),
                h("div", { className: "sc-vinst" }, c.inst));
            }))),
          h("tbody", null, body))));
  }

  if (showResult) {
    if (res.failed) return h("div", { style: { ...styles.error, marginTop: 14 } }, "比較時發生錯誤：" + res.failed);
    const c = res.counts, info = res.info || {};
    return h("div", { className: "selfcheck-workspace sc-result-screen", style: { width: "100%" } },
      h("div", { className: "sc-result", ref: topRef, tabIndex: -1, "aria-label": "出院用藥比較結果" },
        h("div", { className: "sc-result-head" },
          h("div", { className: "sc-result-title" }, "出院用藥比較"),
          h("div", { className: "sc-counts" },
            [info["姓名"], info["床號"], info["病歷號"]].some(Boolean) ? h("span", { className: "dc-patient" }, [info["姓名"], info["床號"], info["病歷號"]].filter(Boolean).join("　")) : null,
            h("span", null, "出院用藥 ", h("b", null, c.changed + c.added + c.kept)),
            h("span", { className: "sc-count-warn" }, "用法有變化 ", h("b", null, c.changed)),
            h("span", null, "新增 ", h("b", null, c.added)),
            h("span", { className: "sc-count-ok" }, "沿用 ", h("b", null, c.kept)),
            h("span", { className: "sc-count-bad" }, "出院未開 ", h("b", null, c.dropped)),
            h("span", { className: "sc-ref" }, "入院 " + scFmt(res.admitDate) + "（" + res.admitSrc + "）・出院 " + scFmt(res.dischargeDate) + "（" + res.dischargeSrc + "）")),
          h("div", { className: "sc-head-actions" },
            h("button", { type: "button", className: "sc-btn", onClick: () => setScreen("edit") }, "← 返回編輯"),
            onOpenSheet ? h("button", { type: "button", className: "sc-btn", onClick: () => onOpenSheet(res) }, "出院用藥說明") : null,
            h(PillToggle, { show: showPills, setShow: setShowPills }),
            h("button", { type: "button", className: "sc-btn sc-btn-main" + (copied ? " is-done" : ""), onClick: copy }, copied ? "✓ 已複製" : "一鍵複製"))),
        resultTable(),
        h("div", { className: "sc-foot" },
          "※ 出院後用藥＝階段為「出院」的醫囑，加上起日在出院日（" + scFmt(res.dischargeDate) + "）當天或之後的出院自備藥（同藥同用法只列一次）；入院時開立、出院時沒有重新開立的自備藥視為出院未開。入院前＝入院日仍在給藥天數＋緩衝 " + grace + " 天內的雲端最近一次領藥；雲端沒有時才用入院時的自備藥。住院中的一般醫囑不列入，只用來註記新增的藥住院中是否已使用。" +
          (snap && snap.cloudSrc === "page" ? "雲端藥歷取自病人頁面貼上內容。" : snap && snap.cloudSrc === "none" ? "未貼上雲端藥歷，入院前只能對照自備藥。" : "") + "同一藥品以商品名或成分相同歸為一列，請以實際處方為準。")));
  }

  const nDc = dcOrderDates.length;
  const nCancel = pv ? pv.dischargeCancelled.length : 0;
  return h("div", { className: "cross-workspace selfcheck-workspace", style: { width: "100%" } },
    h("div", { className: "sc-intro", style: styles.crossIntro },
      "病人頁面先按「轉床」「出院」，再全選（Ctrl+A）複製貼在左格，或用「讀取目前頁面」直接帶入；健保雲端藥歷貼在右格（與整理結果、自備藥核對共用）。以出院處方與出院自備藥為主，往前對照入院前的雲端藥歷：沿用、用法有變化、新增、出院未開。"),
    onPageLoad ? h(PageLoader, { onLoad: onPageLoad, fallback: setInput, auto: true, hint: "在 HIS 病人頁面點工具列 Rx 開啟本工具：「一鍵載入」會自動按轉床、出院並從雲端視窗讀回雲端藥歷；「讀取目前頁面」只讀目前畫面上的內容。" }) : null,
    h("div", { className: "cross-inputs", style: styles.crossRow },
      h("div", { style: styles.crossCol },
        h("label", { style: styles.label }, "病人頁面"),
        h("textarea", { "aria-label": "病人頁面", style: { ...styles.textarea, height: 240 }, value: input || "", spellCheck: false,
          onChange: e => setInput(e.target.value),
          placeholder: "在病人頁面先按「轉床」「出院」，再 Ctrl+A 全選、Ctrl+C 複製，貼在這裡\n（會讀取病人資料、轉床紀錄、准許出院日、自備藥查詢與住院醫囑）" }),
        h("div", { className: "dc-parse " + (pv && (pv.self.length || pv.orders.length) ? "sc-parsed" : "sc-unparsed") }, pv ?
          [pv.info["姓名"] ? "病人 " + pv.info["姓名"] : "", pv.info["床號"] || "",
           "自備藥 " + pv.self.length + " 筆" + (dcFromIso(dcVal) ? "（出院自備藥 " + pv.self.filter(r => !scInactive(r.status) && scYmd(r.startDate) && scYmd(r.startDate) >= dcFromIso(dcVal)).length + "）" : ""),
           "住院醫囑 " + pv.orders.length + " 筆（出院 " + nDc + "）",
           !sharedCloud.length && pv.cloud.length ? "頁面內含雲端藥歷 " + pv.cloud.length + " 筆" : ""].filter(Boolean).join("｜") : "尚未貼上")),
      h("div", { style: styles.crossCol },
        h("label", { style: styles.label }, "雲端藥歷　", h("span", { className: "sc-unparsed" }, "（與整理頁共用）")),
        h("textarea", { "aria-label": "出院用藥比較雲端藥歷", style: { ...styles.textarea, height: 240 }, value: cloudInput || "", spellCheck: false,
          onChange: e => setCloudInput && setCloudInput(e.target.value),
          placeholder: "貼上健保雲端藥歷（與「整理結果」「自備藥核對」共用同一份資料）" }),
        h(CloudHandoffChip, { handoff, current: cloudInput, onApply: v => setCloudInput && setCloudInput(v) }),
        h("div", { className: "dc-parse " + (sharedCloud.length ? "sc-parsed" : "sc-unparsed") },
          sharedCloud.length ? "已解析 " + sharedCloud.length + " 筆" : pv && pv.cloud.length ? "空白時使用病人頁面內附帶的雲端藥歷" : "尚未貼上"))),
    pv ? h("div", { className: "dc-dates", role: "group", "aria-label": "入院日與出院日" },
      h(DcDateField, { label: "入院日", value: admitVal, auto: autoAdmit, manual: !!man.admit, inputRef: admitRef,
        onChange: v => setMan({ admit: v }), onReset: () => setMan({ admit: "" }), warn: !admitVal,
        status: man.admit ? "手動輸入" : autoAdmit ? "取自轉床紀錄最早起始時間" + (pv.transfers.length > 1 ? "（轉床 " + pv.transfers.length + " 筆）" : "")
          : "未讀到轉床紀錄，請手動輸入",
        suggestions: orderStarts.length ? [["醫囑最早開方日", orderStarts[0]]] : [] }),
      h(DcDateField, { label: "出院日", value: dcVal, auto: autoDc, manual: !!man.dc, inputRef: dcRef,
        onChange: v => setMan({ dc: v }), onReset: () => setMan({ dc: "" }), warn: !dcVal,
        status: man.dc ? "手動輸入" : autoDc ? "取自准許出院日" + (nCancel ? "（另有 " + nCancel + " 筆已取消）" : "")
          : nCancel ? "准許出院日已取消（" + pv.dischargeCancelled.map(scFmt).join("、") + "），請手動輸入" : "未讀到准許出院日，請手動輸入",
        suggestions: [dcOrderDates.length ? ["出院醫囑開方日", dcOrderDates[0]] : null, ["今天", today]].filter(Boolean) })) : null,
    h("div", { style: styles.crossControls },
      h("span", { className: "sc-hint" }, "入院日取轉床紀錄最早的起始時間，出院日取未取消、最後設定的准許出院日；讀不到時請手動輸入。"),
      h("div", { className: "sc-run-actions" },
        res && !res.failed ? h("button", { type: "button", className: "sc-btn", onClick: () => setScreen("result") }, "回到上次結果 →") : null,
        h("button", { className: "primary-btn", style: { ...styles.btn, marginTop: 0, width: "auto", padding: "9px 28px" }, onClick: run }, "比較出院用藥"))),
    error ? h("div", { style: { ...styles.error, marginTop: 14 }, role: "alert" }, error) : null);
}

// ── 出院用藥說明（列印給病人；依出院處方號分組，附外觀圖與白話用法）─────────────────
const DC_ROUTE_ZH = { PO: "口服", SL: "舌下含", BUCC: "口頰", TOPI: "外用", EXT: "外用", INHA: "吸入", INH: "吸入", NEBU: "吸入",
  IV: "靜脈注射", IM: "肌肉注射", SC: "皮下注射", SQ: "皮下注射", OU: "點雙眼", OD: "點右眼", OS: "點左眼", EYE: "點眼", OPH: "點眼",
  NASAL: "鼻用", NA: "鼻用", RECT: "肛門用", PR: "肛門用", VAG: "陰道用", TD: "貼皮", PATCH: "貼皮", GARG: "漱口", AU: "點雙耳" };
function dcPlainUsage(dose, unit, freq, route) {
  const p = { freq, perDose: dose ? (dose + " " + (unit || "")).trim() : "" };
  const u = adUsage(p);
  const r = (route || "").toUpperCase();
  return { main: (DC_ROUTE_ZH[r] ? DC_ROUTE_ZH[r] + "，" : "") + u.main, freq: u.freq, code: [freq, route].filter(Boolean).join(" ") };
}
function dcTotalText(dose, unit, freq, days) {
  const n = parseFloat(dose), d = parseInt(days, 10), div = getFreqDivisor(freq);
  if (!(n > 0) || !(d > 0) || !div || SC_NONSCHEDULED.test(freq || "") || !SC_COUNT_UNITS.has((unit || "").toLowerCase())) return "";
  return "共 " + adAmountZh(Math.round(n * div * d * 100) / 100, unit);
}
// 出院用藥的外觀圖：雲端同商品名的品項（健保碼對到許可證）優先，否則以商品名對照食藥署資料
function dcItemRef(row, a, ref) {
  const bk = scBrandKey(a.name), head = bk.split(" ")[0];
  const same = head ? row.cloud.find(p => p.ref && p.brandKey.split(" ")[0] === head) : null;
  if (same) return { e: same.ref, via: "" };
  if (ref) { const f = mrBrandIngs(ref, { brandKey: bk, strengths: a.strengths || scStrengths(a.name) }); if (f && f.entry) return { e: f.entry, via: "依品名對照" }; }
  return null;
}
function dcPatientNote(r) {
  if (r.cat === "added") return { cls: "is-new", text: "新開立的藥" };
  if (r.cat === "changed") {
    const b = r.base;
    let before = "";
    if (b && b.kind === "cloud") { const u = adUsage(b.p); before = [b.p.label, b.p.strengthText].filter(Boolean).join(" ") + "：" + u.main + "，" + u.freq; }
    else if (b && b.kind === "self") before = b.rows.map(x => x.name + "：" + dcPlainUsage(x.dose, x.unit, x.freq, x.route).main + "，" + adFreqZh(x.freq)).join("；");
    return { cls: "is-changed", text: "用法有改變", sub: before ? "原本 " + before : "" };
  }
  return { cls: "is-same", text: "與入院前相同" };
}
function DischargeSheetView({ res, medref, onClose }) {
  const h = React.createElement;
  const [pics, setPics] = useState(true);
  // 出院未開立的藥：畫面上一律列出供藥師參考，預設不列印（可勾選）
  const [withDropped, setWithDropped] = usePersistedState("med-org-dsPrintDropped", false);
  const [copied, setCopied] = useState(false);
  const ref = medref ? medref.ref : null;
  const info = res.info || {};
  const today = new Date();
  const data = useMemo(() => {
    const rx = new Map(), self = [];
    for (const r of res.rows) {
      if (r.cat === "dropped") continue;
      for (const a of r.after) {
        const it = { r, a, img: dcItemRef(r, a, ref) };
        if (a.kind === "dc") {
          const k = (a.o.orderNo || "") + "|" + (a.o.date || "");
          if (!rx.has(k)) rx.set(k, { orderNo: a.o.orderNo || "", date: scYmd(a.o.date), items: [] });
          rx.get(k).items.push(it);
        } else self.push(it);
      }
    }
    const groups = Array.from(rx.values()).sort((x, y) => (x.date || 0) - (y.date || 0) || x.orderNo.localeCompare(y.orderNo));
    for (const g of groups) g.items.sort((x, y) => (x.a.o.seq || "").localeCompare(y.a.o.seq || ""));
    return { groups, self, dropped: res.rows.filter(r => r.cat === "dropped") };
  }, [res, ref]);
  const nItems = data.groups.reduce((s, g) => s + g.items.length, 0) + data.self.length;
  const cols = (pics ? ["外觀"] : []).concat(["藥品", "用法", "天數／數量", "說明"]);
  const nCols = cols.length;

  function imgCell(e) {
    if (!pics) return null;
    return h("td", { className: "ad-img" }, e && e.app
      ? h("a", { href: mrDetailUrl(e), target: "_blank", rel: "noreferrer", title: "開啟食藥署仿單資料頁核對品名" },
          h("img", { src: e.app.img, alt: "藥品外觀", referrerPolicy: "no-referrer", onError: ev => { ev.currentTarget.style.display = "none"; } }))
      : h("span", { className: "ad-noimg" }, "無圖"));
  }
  function drugCell(e, name, ing, via) {
    const look = e && e.app ? [e.app.shape, e.app.color, e.app.score && e.app.score !== "無" ? "刻痕" + e.app.score : "", e.app.marks ? "標註 " + e.app.marks : ""].filter(Boolean).join("・") : "";
    return h("td", { className: "ad-drug" },
      e && e.zh ? h("div", { className: "ad-zh" }, e.zh) : null,
      h("div", { className: "ad-en" }, name),
      ing ? h("div", { className: "ad-ing" }, ing) : null,
      pics && look ? h("div", { className: "ad-look" }, look) : null,
      e && e.lic ? h("div", { className: "ad-lic" }, h("a", { href: mrDetailUrl(e), target: "_blank", rel: "noreferrer" }, e.lic),
        via ? h("span", { className: "no-print ds-via" }, "（" + via + "，請核對）") : null) : null);
  }
  function itemRow(it, i) {
    const { r, a } = it, e = it.img && it.img.e;
    const u = dcPlainUsage(a.dose, a.unit, a.freq, a.kind === "dc" ? a.o.route : a.r.route);
    const note = dcPatientNote(r);
    const ing = (r.name || "").toLowerCase() !== (a.name || "").toLowerCase() ? (r.name || "").toLowerCase() : "";
    const days = a.kind === "dc" && a.o.days ? a.o.days + " 天" : "";
    return h("tr", { key: i, className: "ad-row" },
      imgCell(e),
      drugCell(e, a.name, ing, it.img && it.img.via),
      h("td", { className: "ad-use" },
        h("div", { className: "ad-use-main" }, u.main),
        h("div", { className: "ad-use-freq" }, u.freq),
        a.notes && a.notes.length ? h("div", { className: "ad-code" }, a.notes.join("、")) : null,
        h("div", { className: "ad-code" }, u.code)),
      h("td", { className: "ad-src" },
        a.kind === "dc" ? [h("div", { key: "d" }, days || "—"), h("div", { key: "t", className: "ad-meta" }, dcTotalText(a.dose, a.unit, a.freq, a.o.days))]
          : h("div", { className: "ad-meta" }, "自己帶來的藥")),
      h("td", { className: "ds-note " + note.cls },
        h("div", { className: "ds-note-main" }, note.text),
        note.sub ? h("div", { className: "ds-note-sub" }, note.sub) : null));
  }
  function droppedRow(r, i) {
    const p = r.cloudActive[0];
    const e = p ? p.ref : null;
    const u = p ? adUsage(p) : null;
    return h("tr", { key: "x" + i, className: "ad-row" },
      imgCell(e),
      drugCell(e, p ? [p.label, p.strengthText].filter(Boolean).join(" ") : r.admitSelf.map(x => x.name).join("／"), (r.name || "").toLowerCase(), ""),
      h("td", { className: "ad-use" }, u ? [h("div", { key: "m", className: "ad-use-main" }, u.main), h("div", { key: "f", className: "ad-use-freq" }, u.freq)]
        : r.admitSelf.map((x, j) => h("div", { key: j }, scOrderUsage(x)))),
      h("td", { className: "ad-src" }, p ? h("div", { className: "ad-meta" }, scFmt(p.dispDate) + " " + p.inst) : h("div", { className: "ad-meta" }, "入院時自備")),
      h("td", { className: "ds-note is-stop" }, h("div", { className: "ds-note-main" }, "本次出院未開立"), h("div", { className: "ds-note-sub" }, "是否繼續使用請與醫師或藥師確認")));
  }
  function copy() {
    const out = [`【出院用藥說明】出院日 ${scFmt(res.dischargeDate)}　製表 ${scFmt(today)}`];
    for (const g of data.groups) {
      out.push("", `【出院處方${g.orderNo ? " " + g.orderNo : ""}】開立日期 ${scFmt(g.date)}`);
      for (const it of g.items) { const u = dcPlainUsage(it.a.dose, it.a.unit, it.a.freq, it.a.o.route); out.push(`・${it.a.name}：${u.main}，${u.freq}${it.a.o.days ? "，" + it.a.o.days + " 天" : ""}（${dcPatientNote(it.r).text}）`); }
    }
    if (data.self.length) {
      out.push("", "【出院自備藥】");
      for (const it of data.self) { const u = dcPlainUsage(it.a.dose, it.a.unit, it.a.freq, it.a.r.route); out.push(`・${it.a.name}：${u.main}，${u.freq}（${dcPatientNote(it.r).text}）`); }
    }
    if (withDropped && data.dropped.length) {
      out.push("", "【入院前使用、本次出院未開立】");
      for (const r of data.dropped) { const p = r.cloudActive[0]; out.push(`・${p ? [p.label, p.strengthText].filter(Boolean).join(" ") : r.admitSelf.map(x => x.name).join("／")}`); }
    }
    navigator.clipboard.writeText(out.join("\n")).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }
  const groupRow = (text, key) => h("tr", { key, className: "ad-group" }, h("td", { colSpan: nCols }, text));
  return h("div", { className: "admit-layer" },
    h("div", { className: "ad-toolbar no-print" },
      h("button", { type: "button", className: "sc-btn", onClick: onClose }, "← 返回出院用藥比較"),
      h("label", { className: "ad-opt" }, h("input", { type: "checkbox", checked: pics, onChange: ev => setPics(ev.target.checked) }), " 顯示外觀圖"),
      h("label", { className: "ad-opt" }, h("input", { type: "checkbox", checked: !!withDropped, onChange: ev => setWithDropped(ev.target.checked) }), " 列印／複製入院前使用、出院未開立的藥"),
      h("span", { className: "ad-spacer" }),
      h("button", { type: "button", className: "sc-btn" + (copied ? " is-done" : ""), onClick: copy }, copied ? "✓ 已複製" : "複製文字"),
      h("button", { type: "button", className: "sc-btn sc-btn-main", onClick: () => window.print() }, "列印")),
    h("article", { className: "admit-sheet discharge-sheet" },
      h("header", { className: "ad-head" },
        h("h2", null, "出院用藥說明"),
        h("div", { className: "ad-fields" },
          h("span", null, "姓名 " + (info["姓名"] || "＿＿＿＿＿＿")), h("span", null, "病歷號 " + (info["病歷號"] || "＿＿＿＿＿＿")),
          h("span", null, "床號 " + (info["床號"] || "＿＿＿＿")), h("span", null, "出院日 " + scFmt(res.dischargeDate)), h("span", null, "製表 " + scFmt(today))),
        h("div", { className: "ad-sub" }, "本次出院用藥共 " + nItems + " 項，請依下列用法使用；「說明」欄標示與住院前用藥的差異。有任何疑問請洽詢藥師。")),
      nItems === 0 ? h("div", { className: "ad-empty" }, "沒有讀到出院處方或出院自備藥。") :
        h("table", { className: "ad-table" },
          h("thead", null, h("tr", null, cols.map(t => h("th", { key: t, className: { "外觀": "ad-img", "藥品": "ad-drug", "用法": "ad-use", "天數／數量": "ad-src", "說明": "ds-note" }[t] }, t)))),
          data.groups.map((g, gi) => h("tbody", { key: "g" + gi },
            groupRow("出院處方" + (g.orderNo ? "　處方號 " + g.orderNo : "") + "　開立日期 " + scFmt(g.date) + "　（" + g.items.length + " 項）", "h"),
            g.items.map(itemRow))),
          data.self.length ? h("tbody", { key: "self" },
            groupRow("出院自備藥　請繼續使用自己帶來的藥（" + data.self.length + " 項）", "h"),
            data.self.map(itemRow)) : null,
          data.dropped.length ? h("tbody", { key: "drop", className: "ds-dropped" + (withDropped ? "" : " no-print is-screen-only") },
            h("tr", { className: "ad-group" }, h("td", { colSpan: nCols }, "入院前使用、本次出院未開立（" + data.dropped.length + " 項）",
              withDropped ? null : h("span", { className: "ds-noprint-tag" }, "　僅供藥師參考，不會印出"))),
            data.dropped.map(droppedRow)) : null),
      h("footer", { className: "ad-foot" },
        h("span", null, "說明藥師＿＿＿＿＿＿　病人／家屬＿＿＿＿＿＿"),
        h("span", null, "資料來源：本院出院醫囑、健保雲端藥歷、食藥署藥品外觀圖；圖片僅供辨識參考，以實際領取的藥品為準。"))));
}

// 入院核對用的自備藥：起日在出院日當天或之後的（出院帶回時重新開立）、同藥同用法較晚開的重複醫囑，不重複計入日量
function scSplitSelfForAdmit(rows, dischargeDate) {
  const flag = new Map(), seen = new Set();
  const sorted = rows.map((r, i) => ({ r, i, s: scYmd(r.startDate) })).sort((x, y) => (x.s || 0) - (y.s || 0) || x.i - y.i);
  for (const x of sorted) {
    if (scInactive(x.r.status)) continue;
    if (dischargeDate && x.s && x.s >= dischargeDate) { flag.set(x.i, "出院帶回"); continue; }
    const k = [(x.r.code || scBrandKey(x.r.name) || "").toUpperCase(), x.r.dose, (x.r.unit || "").toLowerCase(), (x.r.route || "").toUpperCase(), (x.r.freq || "").toUpperCase()].join("|");
    if (seen.has(k)) flag.set(x.i, "重複醫囑"); else seen.add(k);
  }
  const use = rows.filter((r, i) => !flag.has(i));
  if (!use.some(r => !scInactive(r.status))) return { use: rows.slice(), skipped: [] };
  return { use, skipped: rows.map((r, i) => flag.has(i) ? Object.assign({}, r, { skipReason: flag.get(i) }) : null).filter(Boolean) };
}
// 貼上的是整個病人頁面時：只取自備藥表，並讀出院日供排除出院帶回的醫囑
function scReadSelfInput(text) {
  const isPage = /病人自備藥查詢|准許出院日|轉床紀錄|序號\s+狀\s+階/.test(text || "");
  const page = isPage ? parseHisPage(text) : null;
  const self = page ? page.self : parseSelfOrders(text);
  let dc = null;
  if (page) {
    const dcOrd = page.orders.filter(o => o.stage === "出院" && !scInactive(o.status)).map(o => scYmd(o.date)).filter(Boolean).sort((x, y) => x - y);
    dc = page.dischargeDate || dcOrd[0] || null;
  }
  const split = scSplitSelfForAdmit(self, dc);
  return { page, all: self, self: split.use, skipped: split.skipped, dischargeDate: dc };
}
const scSkippedText = list => list.map(r => r.name + " " + scOrderUsage(r) + "（" + r.skipReason + (r.startDate ? "，起日 " + scFmt(scYmd(r.startDate)) : "") + "）").join("、");

// ── 一鍵讀取目前頁面（取代全選複製貼上）＋跨分頁暫存雲端藥歷 ────────────────────────
const HANDOFF_KEY = "handoff-cloud";
const HANDOFF_TTL = 30 * 60000;
function readHostPage(msg, ms) {
  return new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done) { done = true; clearTimeout(t); resolve(r); } };
    const t = setTimeout(() => finish({ ok: false, error: "讀取逾時（" + Math.round((ms || 10000) / 1000) + " 秒沒有回應）。請重新整理頁面、再點一次工具列的 Rx 圖示後重試，或改用全選複製貼上。" }), ms || 10000);
    try {
      chrome.runtime.sendMessage(msg || { type: "read-host-page" }, r => {
        if (chrome.runtime.lastError) finish({ ok: false, error: "無法讀取頁面：" + chrome.runtime.lastError.message + "。若剛更新過本工具，請重新整理頁面後再點 Rx。" });
        else finish(r || { ok: false, error: "沒有回應，請重新點一次工具列的 Rx 圖示後再試。" });
      });
    } catch (e) { finish({ ok: false, error: "此環境無法讀取頁面（" + e.message + "），請改用全選複製貼上。" }); }
  });
}
// 判斷讀到的是 HIS 病人頁面或健保雲端藥歷
function classifyPageText(text) {
  const his = /病人自備藥查詢|准許出院日|轉床紀錄|序號\s+狀\s+階/.test(text || "");
  let cloudN = 0;
  try {
    const lines = (text || "").replace(/\r/g, "").split("\n");
    const i = his ? lines.findIndex(l => /健保雲端藥歷|^\s*來源\s+主診斷碼/.test(l)) : 0;
    if (i >= 0) cloudN = parseRows(lines.slice(i).join("\n")).filter(r => (r.drugName || "").trim() || (r.ingName || "").trim()).length;
  } catch (e) { cloudN = 0; }
  return { his, cloudN };
}
const sessionStore = () => { try { return chrome.storage && chrome.storage.session ? chrome.storage.session : null; } catch (e) { return null; } };
async function getHandoff() {
  const s = sessionStore(); if (!s) return null;
  try {
    const v = (await s.get(HANDOFF_KEY))[HANDOFF_KEY];
    if (!v || !v.text) return null;
    if (Date.now() - v.at > HANDOFF_TTL) { await s.remove(HANDOFF_KEY); return null; }
    return v;
  } catch (e) { return null; }
}
async function setHandoff(v) { const s = sessionStore(); if (!s) return; try { if (v) await s.set({ [HANDOFF_KEY]: v }); else await s.remove(HANDOFF_KEY); } catch (e) {} }
function useHandoff() {
  const [v, setV] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => getHandoff().then(x => { if (alive) setV(x); });
    load();
    const t = setInterval(load, 60000);
    const on = (changes, area) => { if (area === "session" && changes[HANDOFF_KEY]) load(); };
    try { chrome.storage.onChanged.addListener(on); } catch (e) {}
    return () => { alive = false; clearInterval(t); try { chrome.storage.onChanged.removeListener(on); } catch (e) {} };
  }, []);
  return v;
}
const hhmm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
// 「讀取目前頁面」按鈕：讀到病人頁面 → 病人頁面／自備藥欄；讀到雲端藥歷 → 雲端藥歷欄並暫存給其他分頁
function PageLoader({ onLoad, hint, fallback, auto, onCloudLoaded }) {
  const h = React.createElement;
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  // 一鍵載入：自動按「轉床」「出院」，再按「雲端」從跳出視窗讀回雲端藥歷
  async function goAuto() {
    const cloudOnly = auto === "cloud";
    setBusy("auto"); setMsg({ text: (cloudOnly ? "正在按「雲端」" : "正在按「轉床」「出院」") + "並開啟雲端視窗讀取，請稍候（雲端最多等 45 秒）…" });
    const r = await readHostPage({ type: "auto-load-his", his: !cloudOnly }, 90000);
    setBusy("");
    if (!r.ok) { setMsg({ bad: true, text: r.error }); return; }
    const out = [], bad = !r.cloudText || (r.log || []).some(s => /找不到|未自動按|沒有出現|無法|沒有接到/.test(s));
    if (!cloudOnly) {
      const kp = classifyPageText(r.pageText || "");
      if (kp.his) out.push(onLoad(r.pageText, kp).text);
      else out.push("頁面沒有辨識到病人資料");
    }
    let cloudOk = "";
    if (r.cloudText) {
      const kc = classifyPageText(r.cloudText);
      if (kc.cloudN) { await setHandoff({ text: r.cloudText, at: Date.now(), n: kc.cloudN }); out.push(onLoad(r.cloudText, { his: false, cloudN: kc.cloudN }).text); cloudOk = r.cloudText; }
      else out.push("雲端視窗讀到的內容沒有辨識到雲端藥歷");
    }
    setMsg({ bad, text: (r.log || []).join("｜") + "。" + out.join("；") });
    if (cloudOk && onCloudLoaded) onCloudLoaded(cloudOk);
  }
  async function go() {
    setBusy("read"); setMsg(null);
    const r = await readHostPage();
    setBusy("");
    if (!r.ok) { setMsg({ bad: true, text: r.error }); return; }
    const kind = classifyPageText(r.text);
    if (!kind.his && !kind.cloudN) {
      if (fallback) fallback(r.text);
      setMsg({ bad: true, text: "讀到 " + (r.chars || r.text.length).toLocaleString() + " 字（" + (r.frames || 1) + " 個框架），但沒有辨識到病人頁面（自備藥查詢、住院醫囑）或健保雲端藥歷" +
        (fallback ? "；已把讀到的文字放進輸入欄，請檢查是否少了資料" : "") + "。若頁面資料還沒顯示完成，請稍候再按一次。" });
      return;
    }
    if (!kind.his && kind.cloudN) await setHandoff({ text: r.text, at: Date.now(), n: kind.cloudN });
    setMsg(onLoad(r.text, kind));
  }
  return h("div", { className: "page-loader" },
    auto ? h("button", { type: "button", className: "sc-btn page-load-btn is-auto", onClick: goAuto, disabled: !!busy,
      title: "在 HIS 病人頁面自動按「轉床」「出院」（已顯示就不按），再按「雲端」並從跳出的視窗讀回雲端藥歷（讀完自動關閉該視窗）" },
      busy === "auto" ? "載入中…" : auto === "cloud" ? "⚡ 一鍵載入雲端藥歷" : "⚡ 一鍵載入（轉床＋出院＋雲端）") : null,
    h("button", { type: "button", className: "sc-btn page-load-btn", onClick: go, disabled: !!busy }, busy === "read" ? "讀取中…" : "⤓ 讀取目前頁面"),
    msg ? h("span", { className: "page-load-msg" + (msg.bad ? " is-bad" : "") }, msg.text)
      : h("span", { className: "page-load-msg" }, hint || "在 HIS 病人頁面或健保雲端藥歷頁面點工具列 Rx 開啟本工具，按此直接讀取，不必全選複製。"));
}
// 另一分頁讀到的雲端藥歷：顯示時間與筆數，按一下套用
function CloudHandoffChip({ handoff, current, onApply }) {
  const h = React.createElement;
  if (!handoff || (current || "") === handoff.text) return null;
  return h("div", { className: "handoff-chip" },
    h("span", null, "另一分頁 " + hhmm(handoff.at) + " 讀取的健保雲端藥歷 " + handoff.n + " 筆"),
    h("button", { type: "button", className: "dc-chip", onClick: () => onApply(handoff.text) }, "套用"),
    h("button", { type: "button", className: "dc-chip", title: "清除暫存", onClick: () => setHandoff(null) }, "清除"));
}

// ── 表：雲端近幾次領藥 → 自備藥（自備藥核對、出院用藥比較共用）
function ScVisitTable({ vis, visits, setVisits, title, note }) {
  const h = React.createElement;
  if (!vis) return null;
  function row2(row) {
    const p = row.p;
    const linked = row.links.length > 0;
    return h("tr", { key: p.key, className: linked ? "" : p.active ? "is-missing" : "is-old" },
      h("td", { className: "sc-sticky sc-c-drug" },
        h("div", { className: "sc-cloud-name" }, h(MedThumb, { e: p.ref }), h("span", { className: "sc-name" }, [p.label, p.strengthText].filter(Boolean).join(" "))),
        p.ingText ? h("div", { className: "sc-ing" }, p.ingText.toLowerCase()) : null),
      h("td", { className: "sc-c-self2" }, linked
        ? row.links.map(({ g, lv }) => h("div", { key: g.key, className: "sc-link-group" },
            g.items.map(({ r }) => h("div", { key: r.idx, className: "sc-order" },
              h("span", { className: "sc-oname" }, r.name), h("span", { className: "sc-usage" }, scOrderUsage(r)))),
            lv === 1 || lv === 2 || lv === 9 ? h("span", { className: "sc-tag sc-tag-sm" }, SC_LEVEL[lv]) : null))
        : h("span", { className: p.active ? "sc-tag is-warn" : "sc-none" }, p.active ? "未開（仍有藥）" : "未開")),
      h("td", { className: "sc-c-last" },
        h("div", null, scFmt(p.dispDate)),
        p.end ? h("div", { className: "sc-supply" + (p.active ? "" : " is-out") }, p.active ? "可用至 " + scMd(p.end) : "已用完") : null),
      vis.cols.map((c, ci) => {
        const cell = row.cells.get(ci);
        const cls = !cell ? " is-empty" : cell.cmp === true ? " is-match" : cell.cmp === false ? " is-diff" : "";
        return h("td", { key: c.key, className: "sc-cell" + cls,
          title: cell ? (cell.cmp === true ? "日量與自備藥相同" : cell.cmp === false ? "日量與自備藥不同" : "") : "該次未領" },
          cell ? scCellText(cell) : "—");
      }));
  }
  function visitTable() {
    const cols = vis.cols;
    const colSpan = cols.length + 3;
    const divider = (text, cls) => h("tr", { className: "sc-divider" + (cls ? " " + cls : "") }, h("td", { colSpan }, h("span", { className: "sc-sticky-label" }, text)));
    return h("section", { className: "sc-zone" },
      h("div", { className: "sc-zone-head" }, title || "雲端近幾次領藥 → 自備藥",
        h("small", null, note || "由新到舊；綠底＝日量與自備藥相同，橘底＝不同"),
        h("div", { className: "sc-visit-pick", role: "group", "aria-label": "顯示領藥次數" },
          h("span", null, "顯示"),
          SC_VISIT_CHOICES.map(n => h("button", { key: n, type: "button", className: visits === n ? "on" : "", "aria-pressed": visits === n,
            onClick: () => setVisits(n) }, n ? "近 " + n + " 次" : "全部（" + vis.totalVisits + "）")))),
      h("div", { className: "sc-scroll" },
        h("table", { className: "sc-table sc-t2" },
          h("thead", null, h("tr", null,
            h("th", { className: "sc-sticky" }, "雲端藥品"),
            h("th", null, "自備藥醫囑"),
            h("th", null, "最近領藥"),
            cols.map((c, ci) => {
              const y = c.date ? c.date.getFullYear() : "";
              const showYear = ci === 0 || (cols[ci - 1].date && cols[ci - 1].date.getFullYear() !== y);
              return h("th", { key: c.key, className: "sc-visit", title: scFmt(c.date) + " " + c.inst },
                h("div", { className: "sc-vdate" }, showYear ? scFmt(c.date) : scMd(c.date), c.refill ? h("span", { className: "sc-vtag" }, "慢箋") : null),
                h("div", { className: "sc-vinst" }, c.inst));
            }))),
          h("tbody", null,
            vis.withSelf.length ? divider("已開自備藥（" + vis.withSelf.length + "）") : null,
            vis.withSelf.map(row2),
            vis.noSelf.length ? divider("未開自備藥（" + vis.noSelf.length + "）", "is-warn") : null,
            vis.noSelf.map(row2)))),
      vis.notFound.length ? h("div", { className: "sc-zone-foot" }, "雲端查無、未列入此表：" +
        vis.notFound.map(g => g.items.map(x => x.r.name).join("／")).join("、")) : null);
  }
  return visitTable();
}

// ── component: SelfCheckView ──────────────────────────────────────────────────
const SC_STATUS = { ok: ["相符", "sc-ok"], info: ["請留意", "sc-info"], warn: ["需確認", "sc-warn"], bad: ["查無", "sc-bad"] };
const SC_VISIT_CHOICES = [3, 5, 8, 0];
function scCloudUsage(p) {
  const daily = p.daily ? scNum(p.daily) + " " + p.dailyUnit + "/日" : "";
  if (/[+&,\/\s]/.test((p.freq || "").trim())) return [daily, p.freq].filter(Boolean).join(" · ");
  return [p.perDose, p.freq].filter(Boolean).join(" ");
}
function scSupplyText(p, refDate) {
  if (!p.end) return "";
  if (!p.active) return "已用完 " + scFmt(p.end) + "（參考日前 " + scDayDiff(refDate, p.end) + " 天）";
  return "可用至 " + scFmt(p.end) + (p.end < refDate ? "（緩衝期內）" : "");
}
function scRememberKey(bk) {
  const w = (bk || "").split(" ").filter(Boolean);
  return w.length && !SC_GENERIC_HEADS.has(w[0]) ? w[0] : bk;
}
const scOrderUsage = r => [r.dose && (r.dose + " " + r.unit).trim(), r.route, r.freq].filter(Boolean).join(" ");
const scMd = d => d ? String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0") : "";

function SelfCheckView({ cloudInput, setCloudInput, selfInput, setSelfInput, grace, snap, setSnap, overrides, setOverrides,
  customMap, setCustomMap, screen, setScreen, visits, setVisits, fmtOpts, medref, onOpenAdmit, showPills, setShowPills, onPageLoad, handoff }) {
  const h = React.createElement;
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(() => new Set());
  const topRef = React.useRef(null);
  const editRef = React.useRef(null);
  const cloudCount = useMemo(() => {
    try { return cloudInput && cloudInput.trim() ? parseRows(cloudInput).length : 0; } catch (e) { return 0; }
  }, [cloudInput]);
  const selfRead = useMemo(() => { try { return scReadSelfInput(selfInput); } catch (e) { return { self: [], skipped: [], all: [] }; } }, [selfInput]);
  const selfCount = selfRead.self.length;
  const mref = medref ? medref.ref : null;
  const cloudRows = useMemo(() => snap ? enrichCloudRows(snap.cloud, mref) : null, [snap, mref]);
  const res = useMemo(() => {
    if (!snap) return null;
    try { return buildSelfCheck(cloudRows, snap.self, { grace, overrides, customMap, medref: mref }); } catch (e) { return { failed: e.message }; }
  }, [snap, cloudRows, grace, overrides, customMap, mref]);
  const vis = useMemo(() => {
    if (!res || res.failed) return null;
    try { return buildSelfCheckVisits(res, cloudRows, visits); } catch (e) { return null; }
  }, [res, cloudRows, visits]);
  const showResult = screen === "result" && res;
  useEffect(() => {
    const el = showResult ? topRef.current : editRef.current;
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "instant", block: "start" });
  }, [showResult, snap]);

  function run() {
    setError(""); setCopied(false); setEditing(new Set());
    let cloud = [];
    try { cloud = cloudInput && cloudInput.trim() ? parseRows(cloudInput) : []; } catch (e) { cloud = []; }
    const rd = scReadSelfInput(selfInput);
    const self = rd.self;
    // 整個病人頁面（含雲端藥歷）貼在自備藥欄、雲端欄空白時，直接用頁面裡的雲端藥歷
    let cloudFromPage = false;
    if (!cloud.length && rd.page && rd.page.cloud.length) { cloud = rd.page.cloud; cloudFromPage = true; }
    if (!self.length) { setError("未讀到自備藥醫囑，請確認已貼上「類別 狀態 藥碼 藥名 劑量 單位 途徑 頻率 起日…」各欄。"); return; }
    if (!cloud.length) { setError("請貼上雲端藥歷才能核對（與「整理結果」頁共用同一份）。"); return; }
    setOverrides({});
    setSnap({ cloud, self, skipped: rd.skipped, cloudFromPage });
    setScreen("result");
  }
  function copy() {
    if (!res || res.failed) return;
    navigator.clipboard.writeText(selfCheckText(res, fmtOpts)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }
  function pick(g, key) {
    const ov = Object.assign({}, overrides);
    for (const { r } of g.items) { if (key) ov[r.idx] = key; else delete ov[r.idx]; }
    setOverrides(ov);
    setEditing(prev => { const n = new Set(prev); n.delete(g.key); return n; });
  }
  function remember(g) {
    const k = scRememberKey(g.si.brandKey);
    if (!k || !g.best) return;
    setCustomMap(Object.assign({}, customMap, { [k]: g.best.ings.slice() }));
  }
  function forget(k) { const m = Object.assign({}, customMap); delete m[k]; setCustomMap(m); }

  function tagsFor(g) {
    const p = g.best, out = [];
    for (const is of g.issues) {
      let text = is, cls = "is-warn";
      if (is === "雲端查無") cls = "is-bad";
      if (is === "劑量不同" && g.selfDailyText && g.cloudDailyText) text = `劑量不同：自備 ${g.selfDailyText} ≠ 雲端 ${g.cloudDailyText}`;
      if (is === "含量不同" && p) text = `含量不同：自備 ${g.si.strengths.map(s => s.text).join(" ")} ≠ 雲端 ${p.strengthText || "?"}`;
      if (is === "含量不同" && g.dailyMatch === true) cls = "is-info";
      if (is === "頻率不同" && p) { text = `頻率不同：自備 ${g.items[0].r.freq} ≠ 雲端 ${p.freq}`; cls = "is-info"; }
      out.push(h("span", { key: is, className: "sc-tag " + cls }, text));
    }
    if (p && g.level && g.level !== 1) {
      let text = SC_LEVEL[g.level];
      if (g.level === 2) text += "・不同廠牌";
      if (g.si.ingSource === "自訂對照" && g.level !== 3) text += "（自訂對照）";
      out.push(h("span", { key: "lv", className: "sc-tag" }, text));
    }
    if (p && g.dailyMatch === true && g.selfDailyText) out.push(h("span", { key: "dd", className: "sc-tag" }, "日量 " + g.selfDailyText.replace("/日", "") + " 相符"));
    for (const n of g.notes.filter(n => n !== "不同廠牌")) out.push(h("span", { key: "n" + n, className: "sc-note" }, n));
    return out;
  }

  // ── 表一：自備藥 → 雲端最近一次
  function row1(g) {
    const [stLabel, stCls] = SC_STATUS[g.status];
    const p = g.best;
    const showPicker = !p || g.level === 1 || g.level === 9 || editing.has(g.key);
    const rk = scRememberKey(g.si.brandKey);
    const canRemember = g.level === 9 && p && p.ings.length && rk && JSON.stringify(customMap[rk] || null) !== JSON.stringify(p.ings);
    return h("tr", { key: g.key, className: "sc-row " + stCls },
      h("td", { className: "sc-c-status" }, h("span", { className: "sc-status" }, stLabel)),
      h("td", { className: "sc-c-self" },
        g.items.map(({ r }) => h("div", { key: r.idx, className: "sc-order" },
          h("span", { className: "sc-name" }, r.name),
          h("span", { className: "sc-usage" }, scOrderUsage(r)),
          r.code ? h("span", { className: "sc-code" }, r.code) : null)),
        g.items.length > 1 && g.selfDailyText ? h("div", { className: "sc-note" }, "合計 " + g.selfDailyText) : null,
        g.si.fda && (g.si.ingSource === "食藥署" || !p || g.level === 1)
          ? h("div", { className: "sc-note" }, "成分（食藥署）：" + mrIngText(g.si.fda)) : null),
      h("td", { className: "sc-c-cloud" }, p ? [
        h("div", { key: "n", className: "sc-cloud-name" }, h(MedThumb, { e: p.ref }), h("span", { className: "sc-name" }, [p.label, p.strengthText].filter(Boolean).join(" ")),
          p.ingText ? h("span", { className: "sc-ing" }, " " + p.ingText.toLowerCase()) : null),
        p.ref && p.ref.ings.length > 1 ? h("div", { key: "f", className: "sc-note" }, "成分（食藥署）：" + mrIngText(p.ref)) : null,
        h("div", { key: "u", className: "sc-usage" }, scCloudUsage(p)),
        h("div", { key: "m", className: "sc-meta" }, [scFmt(p.dispDate), p.inst, p.days ? p.days + "天" : ""].filter(Boolean).join(" ")),
        h("div", { key: "s", className: "sc-supply" + (p.active ? "" : " is-out") }, scSupplyText(p, res.refDate))
      ] : h("span", { className: "sc-none" }, "—")),
      h("td", { className: "sc-c-note" },
        h("div", { className: "sc-tags" }, tagsFor(g),
          !showPicker && p ? h("button", { type: "button", className: "sc-link", onClick: () => setEditing(prev => new Set(prev).add(g.key)) }, "更改對應") : null),
        g.alts.length ? h("div", { className: "sc-alt" }, "另有：" + g.alts.map(a =>
          [a.label, a.strengthText].filter(Boolean).join(" ") + "（" + scFmt(a.dispDate) + (a.active ? "" : "，已用完") + "）").join("、")) : null,
        showPicker ? h("div", { className: "sc-pick" },
          h("select", { value: g.level === 9 ? overrides[g.items[0].r.idx] || "" : "", "aria-label": "手動對應雲端藥品",
            onChange: e => pick(g, e.target.value) },
            h("option", { value: "" }, g.level === 9 ? "取消手動對應" : "手動對應雲端藥品…"),
            res.cloud.map(c => h("option", { key: c.key, value: c.key },
              [c.label, c.strengthText].filter(Boolean).join(" ") + "｜" + (c.ingText || "").toLowerCase() + "｜" + scFmt(c.dispDate) + " " + c.inst))),
          canRemember ? h("button", { type: "button", className: "sc-mini", onClick: () => remember(g),
            title: "之後遇到同商品名會自動以此成分比對（只存藥名對照，不存病人資料）" },
            "記住對照：" + rk + " → " + p.ings.join(" + ")) : null) : null));
  }

  function renderResult() {
    if (res.failed) return h("div", { style: { ...styles.error, marginTop: 14 } }, "核對時發生錯誤：" + res.failed);
    const c = res.counts;
    const customKeys = Object.keys(customMap || {});
    return h("div", { className: "sc-result", ref: topRef, tabIndex: -1, "aria-label": "自備藥核對結果" },
      h("div", { className: "sc-result-head" },
        h("div", { className: "sc-result-title" }, "自備藥核對"),
        h("div", { className: "sc-counts" },
          h("span", null, "自備 ", h("b", null, res.selfCount), " 筆"),
          h("span", { className: "sc-count-ok" }, "相符 ", h("b", null, c.ok)),
          h("span", { className: "sc-count-warn" }, "需確認 ", h("b", null, c.warn + c.info)),
          h("span", { className: "sc-count-bad" }, "查無 ", h("b", null, c.bad)),
          h("span", { className: "sc-count-warn" }, "雲端有藥未開 ", h("b", null, res.missing.length)),
          h("span", { className: "sc-ref" }, "參考日 " + scFmt(res.refDate) + (res.refLabel ? "（" + res.refLabel + "）" : res.refFromOrder ? "（自備起日）" : "（今日）") + "・緩衝 " + res.grace + " 天")),
        h("div", { className: "sc-head-actions" },
          h("button", { type: "button", className: "sc-btn", onClick: () => setScreen("edit") }, "← 返回編輯"),
          onOpenAdmit ? h("button", { type: "button", className: "sc-btn", onClick: () => {
            const links = new Map();
            for (const g of res.groups) if (g.best) {
              const names = g.items.map(x => x.r.name);
              for (const k of [g.best.key].concat(g.alts.map(a => a.key))) links.set(k, (links.get(k) || []).concat(names));
            }
            onOpenAdmit({ rows: cloudRows, refDate: res.refDate, links, source: "自備藥核對" });
          } }, "入院前用藥紀錄") : null,
          h(PillToggle, { show: showPills, setShow: setShowPills }),
          h("button", { type: "button", className: "sc-btn sc-btn-main" + (copied ? " is-done" : ""), onClick: copy }, copied ? "✓ 已複製" : "一鍵複製"))),
      h("section", { className: "sc-zone" },
        h("div", { className: "sc-zone-head" }, "自備藥 → 雲端", h("small", null, "依自備藥醫囑順序，對照雲端最近一次領藥；同一藥品的多筆醫囑合併計算日量")),
        h("div", { className: "sc-scroll" },
          h("table", { className: "sc-table sc-t1" },
            h("thead", null, h("tr", null, ["狀態", "自備藥醫囑", "雲端最近一次領藥", "核對說明"].map(t => h("th", { key: t }, t)))),
            h("tbody", null, res.groups.map(row1))))),
      h(ScVisitTable, { vis, visits, setVisits }),
      snap && snap.skipped && snap.skipped.length ? h("div", { className: "sc-foot" }, "未重複計入日量的自備藥醫囑（" + snap.skipped.length + "）：" + scSkippedText(snap.skipped)) : null,
      snap && snap.cloudFromPage ? h("div", { className: "sc-foot" }, "雲端藥歷取自貼在自備藥欄的病人頁面。") : null,
      res.inactive.length ? h("div", { className: "sc-foot" }, "已停用／取消的自備藥醫囑未核對（" + res.inactive.length + "）：" +
        res.inactive.map(r => r.name + "（" + statusReason(r.status) + "）").join("、")) : null,
      customKeys.length ? h("div", { className: "sc-foot" }, "自訂對照 " + customKeys.length + " 筆：",
        customKeys.map(k => h("span", { key: k, className: "sc-custom-item" }, k + " → " + [].concat(customMap[k]).join(" + "),
          h("button", { type: "button", className: "sc-link", onClick: () => forget(k), "aria-label": "刪除對照 " + k }, "刪除")))) : null,
      h("div", { className: "sc-foot" },
        "※ 配對順序：同商品名 → 同成分（內建常用商品名對照、雲端藥歷成分欄、自訂對照）。雲端日量＝總量 ÷ 給藥日數；剩餘藥量以最近一次領藥日＋給藥天數＋緩衝推算。結果僅供核對參考，請以病人實際攜帶藥品與處方為準。"));
  }

  if (showResult) return h("div", { className: "selfcheck-workspace sc-result-screen", style: { width: "100%" } }, renderResult());

  return h("div", { className: "cross-workspace selfcheck-workspace", ref: editRef, style: { width: "100%" } },
    h("div", { className: "sc-intro", style: styles.crossIntro },
      "貼上雲端藥歷與自備藥醫囑，按「核對自備藥」後以表格呈現：先由自備藥逐筆對照雲端，再由雲端近幾次領藥（新到舊）回頭對照自備藥。"),
    onPageLoad ? h(PageLoader, { onLoad: onPageLoad, fallback: setSelfInput, auto: true }) : null,
    h("div", { className: "cross-inputs", style: styles.crossRow },
      h("div", { style: styles.crossCol },
        h("label", { style: styles.label }, "雲端藥歷　",
          h("span", { className: cloudCount > 0 ? "sc-parsed" : "sc-unparsed" },
            cloudCount > 0 ? "（已解析 " + cloudCount + " 筆）" : "（與整理頁共用）")),
        h("textarea", { "aria-label": "自備藥核對雲端藥歷", style: { ...styles.textarea, height: 170 }, value: cloudInput || "", spellCheck: false,
          onChange: e => setCloudInput(e.target.value), placeholder: "貼上健保雲端藥歷（與「整理結果」頁共用同一份資料）" }),
        h(CloudHandoffChip, { handoff, current: cloudInput, onApply: setCloudInput })),
      h("div", { style: styles.crossCol },
        h("label", { style: styles.label }, "自備藥醫囑　",
          h("span", { className: selfCount > 0 ? "sc-parsed" : "sc-unparsed" }, selfCount > 0 ? "（已解析 " + selfCount + " 筆" +
            (selfRead.skipped.length ? "，出院帶回／重複 " + selfRead.skipped.length + " 筆不重複計算" : "") +
            (selfRead.page && selfRead.page.cloud.length && cloudCount === 0 ? "，頁面內含雲端藥歷 " + selfRead.page.cloud.length + " 筆" : "") + "）" : "")),
        h("textarea", { "aria-label": "自備藥醫囑", style: { ...styles.textarea, height: 170 }, value: selfInput || "", spellCheck: false,
          onChange: e => setSelfInput(e.target.value),
          placeholder: "從 HIS 自備藥醫囑複製後貼上，含標題列或整個病人頁面也可以\n例：自備\t確認\tAMA4JB11\tAmanda 100 mg/tab\t0.5\ttab\tPO\tTID\t20261012\t12\t不限\t12" }))),
    h("div", { style: styles.crossControls },
      h("span", { className: "sc-hint" }, "參考日＝自備藥起日（無起日用今日）；剩餘藥量緩衝 " + grace + " 天，可在「顯示選項」調整。",
        h("br"), "藥品資料庫：" + mrStatusText(medref).text),
      h("div", { className: "sc-run-actions" },
        res && !res.failed ? h("button", { type: "button", className: "sc-btn", onClick: () => setScreen("result") }, "回到上次結果 →") : null,
        h("button", { className: "primary-btn", style: { ...styles.btn, marginTop: 0, width: "auto", padding: "9px 28px" }, onClick: run }, "核對自備藥"))),
    error ? h("div", { style: { ...styles.error, marginTop: 14 }, role: "alert" }, error) : null);
}

// ── components: RightNav ──────────────────────────────────
function RightNav({ page, viewMode, setPage, setViewMode, optsOpen, setOptsOpen }) {
  const h=React.createElement, active=optsOpen ? "options" : page !== "organize" ? page : viewMode;
  const tabs=[["result","整理結果"],["table","表格"],["timeline","時間軸"],["selfcheck","自備藥核對"],["discharge","出院用藥比較"],["options","顯示選項"]];
  const pick=m=>{ if(m === "options"){setOptsOpen(v=>!v);return;} setOptsOpen(false); if(m === "selfcheck" || m === "discharge") setPage(m); else {setPage("organize");setViewMode(m);} };
  return h("nav", {className:"primary-nav", "aria-label":"藥歷檢視方式"},
    tabs.map(([m,label],i)=>h("button",{key:m,type:"button",onClick:()=>pick(m),
      className:active===m?"nav-choice is-active":"nav-choice", "aria-pressed":active===m},
      h("span",{className:"nav-index","aria-hidden":true},String(i+1).padStart(2,"0")),label)));
}

function MedOrganizer() {
  const [input, setInput] = useState("");
  const inputState = input;
  const [rawRows, setRawRows] = useState(null); // parsed rows (set on button click)
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("result");
  const [pageSaved, setPage] = usePersistedState("med-org-page", "organize"); // organize | selfcheck | discharge
  const page = pageSaved === "selfcheck" || pageSaved === "discharge" ? pageSaved : "organize"; // 舊版存的 "cross" 回到整理頁
  // 出院用藥比較（病人資料只放在記憶體，不儲存）
  const [dischargeInput, setDischargeInput] = useState("");
  const [dischargeSnap, setDischargeSnap] = useState(null);
  const [dischargeScreen, setDischargeScreen] = useState("edit"); // edit | result
  const [dischargeDates, setDischargeDates] = useState({}); // 手動輸入的入院日／出院日（不儲存）
  const [selfOrderInput, setSelfOrderInput] = useState("");
  const [selfCheckSnap, setSelfCheckSnap] = useState(null);
  const [selfCheckOverrides, setSelfCheckOverrides] = useState({});
  const [selfCheckScreen, setSelfCheckScreen] = useState("edit"); // edit | result
  const [selfCheckVisits, setSelfCheckVisits] = usePersistedState("med-org-selfcheck-visits", 5);
  const [admitCtx, setAdmitCtx] = useState(null); // 入院前用藥紀錄
  const [dcSheet, setDcSheet] = useState(null);   // 出院用藥說明
  const handoff = useHandoff();
  // 讀取目前頁面：病人頁面同時帶入「出院用藥比較」與「自備藥核對」；雲端藥歷帶入共用的雲端藥歷欄
  function loadFromPage(text, kind) {
    if (kind.his) {
      setDischargeInput(text); setSelfOrderInput(text);
      const pg = parseHisPage(text);
      return { text: "已讀取病人頁面：" + [pg.info["姓名"] || "", "自備藥 " + pg.self.length + " 筆", "住院醫囑 " + pg.orders.length + " 筆"].filter(Boolean).join("｜") +
        (kind.cloudN ? "｜頁面內含雲端藥歷 " + kind.cloudN + " 筆" : "") };
    }
    setInput(text);
    return { text: "已讀取健保雲端藥歷 " + kind.cloudN + " 筆；30 分鐘內在其他分頁開啟本工具可直接套用。" };
  }
  const applyHandoff = t => setInput(t);
  const [showPills, setShowPills] = usePersistedState("med-org-pillShow", true);
  const [pillSize] = usePersistedState("med-org-pillSize", "m"); // 舊版的小/中/大/特大，只用來決定預設高度
  const [pillPxSaved, setPillPx] = usePersistedState("med-org-pillPx", 0); // 0 = 尚未自訂
  const pillPx = pillPxSaved >= 12 ? Math.min(160, Math.round(pillPxSaved)) : (PILL_SIZES[pillSize] || PILL_SIZES.m).h;
  const pill = pillMetrics(pillPx);
  const [selfBrandMap, setSelfBrandMap] = usePersistedState("med-org-selfBrandMap", {});
  const [filterSourceOPD, setFilterSourceOPD] = usePersistedState("med-org-filterSourceOPD", true);
  const [filterShortDays, setFilterShortDays] = usePersistedState("med-org-filterShortDays", true);
  const [showDays, setShowDays] = usePersistedState("med-org-showDays-per-drug", true);
  const [showRegular, setShowRegular] = usePersistedState("med-org-showRegular", false);
  const [showChanged, setShowChanged] = usePersistedState("med-org-showChanged", false);
  const [alignColumns, setAlignColumns] = usePersistedState("med-org-alignColumns-v2", "global");
  const [nameMode, setNameMode] = usePersistedState("med-org-nameMode", "ingredient");
  const [showFullHistory, setShowFullHistory] = usePersistedState("med-org-showFullHistory", true);
  const [showDitto, setShowDitto] = usePersistedState("med-org-showDitto", true);
  const [showExpiredGray, setShowExpiredGray] = usePersistedState("med-org-showExpiredGray", true);
  const [showExpiredGrayText, setShowExpiredGrayText] = usePersistedState("med-org-showExpiredGrayText", false);
  const [showComboWarning, setShowComboWarning] = usePersistedState("med-org-showComboWarning", true);
  const [expiryGrace, setExpiryGrace] = usePersistedState("med-org-expiryGrace", 14);
  const [showActiveMark, setShowActiveMark] = usePersistedState("med-org-showActiveMark", true);
  const [expandedNames, setExpandedNames] = useState(() => new Set());
  // Collapsible control panels — the input folds away once there is a result,
  // so the organized output owns the page.
  const [inputOpen, setInputOpen] = useState(true);
  const [optsOpen, setOptsOpen] = useState(false);
  const [scrollToResult, setScrollToResult] = useState(0);
  const resultRef = React.useRef(null);
  const [resultScreen, setResultScreen] = useState(false);
  const editorRef = React.useRef(null);
  const opts = {
    showDays,
    showRegular,
    showChanged,
    alignColumns,
    nameMode,
    filterSourceOPD,
    filterShortDays,
    showDitto,
    showFullHistory,
    showExpiredGray,
    showExpiredGrayText,
    showComboWarning,
    expiryGrace,
    showActiveMark
  };

  // Derived data — recomputes whenever rawRows or filter options change
  const medref = useMedRef();
  const rowsRef = useMemo(() => rawRows ? enrichCloudRows(rawRows, medref.ref) : null, [rawRows, medref.ref]);
  const derived = useMemo(() => {
    if (!rowsRef) return null;
    const filtered = filterRows(rowsRef, opts);
    const dmap = deduplicateAndCollect(filtered);
    // showFullHistory: show every visit; otherwise only latest per drug
    const rowsToGroup = showFullHistory ? filtered : Array.from(dmap.values()).map(e => e.latest);
    const grouped = groupByInstitution(rowsToGroup);
    const totalCount = grouped.reduce((sum, [, {
      rows
    }]) => sum + rows.length, 0);
    return {
      groups: grouped,
      dedupMap: dmap,
      allRows: filtered,
      totalCount
    };
  }, [rowsRef, filterSourceOPD, filterShortDays, showFullHistory]);
  const groups = derived?.groups ?? null;
  const dedupMap = derived?.dedupMap ?? null;
  const allRows = derived?.allRows ?? null;
  const totalCount = derived?.totalCount ?? 0;
  function handleOrganize(textArg) {
    const input = typeof textArg === "string" ? textArg : inputState;   // 一鍵載入後直接整理讀到的文字
    setError("");
    setCopied(false);
    setViewMode("result");
    setExpandedNames(new Set());
    if (!input.trim()) {
      setError("請貼上雲端藥歷資料。");
      setRawRows(null);
      setInputOpen(true);
      return;
    }
    try {
      const rows = parseRows(input);
      if (!rows.length) {
        setError("未能解析任何藥品資料，請確認格式正確。");
        setRawRows(null);
        setInputOpen(true);
        return;
      }
      setRawRows(rows);
      setResultScreen(true);
      setInputOpen(false);
      setScrollToResult(n => n + 1);
    } catch (e) {
      setError("解析錯誤：" + e.message);
      setRawRows(null);
      setInputOpen(true);
    }
  }
  function handleCopy() {
    if (!groups || !dedupMap) return;
    navigator.clipboard.writeText(buildCopyText(groups, dedupMap, opts)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  const [showHelp, setShowHelp] = useState(false);
  const [fontSize, setFontSize] = usePersistedState("med-org-fontSize", 100);
  const FONT_STEPS = [80, 90, 100, 115, 130, 150]; // percent zoom
  const [darkMode, setDarkMode] = usePersistedState("med-org-darkMode-reference-v2", true);

  useEffect(() => {
    if (darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [darkMode]);

  // Bring the freshly organized result into view (runs after the DOM commit)
  useEffect(() => {
    if (scrollToResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "instant", block: "start" });
      resultRef.current.focus({preventScroll:true});
    }
  }, [scrollToResult]);
  useEffect(() => {
    if (!resultScreen && scrollToResult && editorRef.current) {
      editorRef.current.scrollIntoView({behavior:"instant",block:"start"});
      editorRef.current.focus({preventScroll:true});
    }
  }, [resultScreen]);

  // One-line summaries shown on the collapsed panel headers
  const inputMeta = rawRows
    ? `已讀入 ${rawRows.length} 筆`
    : (input.trim() ? "尚未整理" : "尚未貼上資料");
  const optSummary = [
    nameMode === "ingredient" ? "學名" : nameMode === "brand" ? "商品名" : "商品名+學名",
    showFullHistory ? "完整記錄" : "僅最新",
    filterSourceOPD ? "門診/藥局" : null,
    filterShortDays ? "排除<14天" : null
  ].filter(Boolean).join(" · ");

  const activeView=page !== "organize" ? page : viewMode;
  const viewLabels={result:"整理結果", table:"表格", timeline:"時間軸", selfcheck:"自備藥核對", discharge:"出院用藥比較"};
  return React.createElement("div", {className:"app-shell" + (admitCtx || dcSheet ? " admit-open" : "") + (showPills ? "" : " pills-off"),
    style:{...styles.page,zoom:fontSize/100,"--pill-h":pill.h+"px","--pill-zoom":pill.zoom,"--pill-sheet":pill.sheet+"px"}},
    showHelp && React.createElement(HelpModal,{onClose:()=>setShowHelp(false)}),
    admitCtx && React.createElement(AdmitRecordView, { rows: admitCtx.rows, initialRef: admitCtx.refDate, grace: expiryGrace,
      links: admitCtx.links, source: admitCtx.source, onClose: () => setAdmitCtx(null) }),
    dcSheet && React.createElement(DischargeSheetView, { res: dcSheet.res, medref, onClose: () => setDcSheet(null) }),
    React.createElement("header",{className:"site-header no-print"},
      React.createElement(RightNav,{page,viewMode,setPage,optsOpen,setOptsOpen,setViewMode:m=>{setViewMode(m);if(rawRows)setResultScreen(true);}}),
      React.createElement("img",{className:"brand-tile",src:"icons/icon-48.png",width:32,height:32,alt:"雲端藥歷整理器"}),
      React.createElement("div",{className:"header-tools"},
        React.createElement("div",{className:"type-tools","aria-label":"文字大小"},
          React.createElement("button",{className:"tool-btn",title:"縮小文字","aria-label":"縮小文字",disabled:fontSize<=FONT_STEPS[0],onClick:()=>setFontSize(s=>{const i=FONT_STEPS.indexOf(s);return i>0?FONT_STEPS[i-1]:s;})},"A−"),
          React.createElement("button",{className:"tool-btn",title:"放大文字","aria-label":"放大文字",disabled:fontSize>=FONT_STEPS[FONT_STEPS.length-1],onClick:()=>setFontSize(s=>{const i=FONT_STEPS.indexOf(s);return i<FONT_STEPS.length-1?FONT_STEPS[i+1]:s;})},"A+")),
        React.createElement("button",{className:"theme-btn tool-btn",onClick:()=>setDarkMode(v=>!v),title:darkMode?"切換為淺色模式":"切換為暗色模式","aria-label":darkMode?"切換為淺色模式":"切換為暗色模式","aria-pressed":darkMode},darkMode?"☀":"☾"),
        React.createElement("button",{className:"help-pill",onClick:()=>setShowHelp(true)},"使用說明",React.createElement("span",{"aria-hidden":true},"↗")))),
    React.createElement("main",{className:"workspace" + ((resultScreen && page === "organize") || (page === "selfcheck" && selfCheckScreen === "result" && selfCheckSnap) || (page === "discharge" && dischargeScreen === "result" && dischargeSnap) ? " showing-results" : ""),id:"workspace"},
  optsOpen && /*#__PURE__*/React.createElement(Disclosure, {
      open: true,
      onToggle: () => setOptsOpen(v => !v),
      title: "顯示選項",
      meta: optSummary
    }, /*#__PURE__*/React.createElement("div", {
      style: styles.optionsRow
    },
      /*#__PURE__*/React.createElement("div", { style: styles.optGroup },
        /*#__PURE__*/React.createElement("div", { style: styles.optGroupTitle }, "篩選資料"),
        /*#__PURE__*/React.createElement("div", { style: styles.optStack },
          /*#__PURE__*/React.createElement(Toggle, {
            label: "僅保留門診/藥局",
            checked: filterSourceOPD, onChange: setFilterSourceOPD
          }),
          /*#__PURE__*/React.createElement(Toggle, {
            label: "排除短期處方(<14天)",
            checked: filterShortDays, onChange: setFilterShortDays
          }),
          /*#__PURE__*/React.createElement(Toggle, {
            label: "顯示完整領藥記錄",
            checked: showFullHistory, onChange: setShowFullHistory
          }))),

      /*#__PURE__*/React.createElement("div", { style: styles.optGroup },
        /*#__PURE__*/React.createElement("div", { style: styles.optGroupTitle }, "藥量狀態"),
        /*#__PURE__*/React.createElement("div", { style: styles.optStack },
          /*#__PURE__*/React.createElement(Toggle, {
            label: "標示已無藥量",
            checked: showExpiredGray, onChange: setShowExpiredGray
          }),
          /*#__PURE__*/React.createElement(Toggle, {
            label: "已無藥量顯示灰字",
            checked: showExpiredGrayText, onChange: setShowExpiredGrayText
          }),
          /*#__PURE__*/React.createElement(Toggle, {
            label: "標示仍有藥(綠)",
            checked: showActiveMark, onChange: setShowActiveMark
          }),
          /*#__PURE__*/React.createElement("label", {
            style: styles.graceField,
            title: "彈性緩衝：給藥天數之外再加上的緩衝天數，今日超過(給藥日+天數+緩衝)才算已無藥量。對齊巨集預設14天。"
          }, "彈性緩衝 ", /*#__PURE__*/React.createElement("input", {
            type: "number", min: 0, max: 90, value: expiryGrace,
            onChange: e => setExpiryGrace(Math.max(0, Math.min(90, parseInt(e.target.value, 10) || 0))),
            style: styles.graceInput
          }), " 天"))),

      /*#__PURE__*/React.createElement("div", { style: styles.optGroup },
        /*#__PURE__*/React.createElement("div", { style: styles.optGroupTitle }, "標示"),
        /*#__PURE__*/React.createElement("div", { style: styles.optStack },
          /*#__PURE__*/React.createElement(Toggle, {
            label: "提醒可能複方",
            checked: showComboWarning, onChange: setShowComboWarning
          }),
          /*#__PURE__*/React.createElement(Toggle, {
            label: "顯示領藥天數",
            checked: showDays, onChange: setShowDays
          }),
          /*#__PURE__*/React.createElement(Toggle, {
            label: "標示定期領藥",
            checked: showRegular, onChange: setShowRegular
          }),
          /*#__PURE__*/React.createElement(Toggle, {
            label: "標示用法有變化",
            checked: showChanged, onChange: setShowChanged
          }))),

      /*#__PURE__*/React.createElement("div", { style: styles.optGroup },
        /*#__PURE__*/React.createElement("div", { style: styles.optGroupTitle }, "排版"),
        /*#__PURE__*/React.createElement("div", { style: styles.optStack },
          /*#__PURE__*/React.createElement(SegmentedOption, {
            label: "藥品名稱",
            value: nameMode,
            options: [
              { value: "ingredient", label: "學名" },
              { value: "brand",      label: "商品名" },
              { value: "both",       label: "商品名+學名" }
            ],
            onChange: setNameMode
          }),
          /*#__PURE__*/React.createElement(SegmentedOption, {
            label: "對齊",
            value: alignColumns,
            options: [
              { value: "none",   label: "關閉" },
              { value: "local",  label: "同組" },
              { value: "global", label: "全部" }
            ],
            onChange: setAlignColumns
          }),
          /*#__PURE__*/React.createElement(Toggle, {
            label: "〃（相同用法折疊）",
            checked: showDitto, onChange: setShowDitto
          }))),

      React.createElement("div", { style: styles.optGroup },
        React.createElement("div", { style: styles.optGroupTitle }, "藥品資料庫（食藥署）"),
        React.createElement("div", { style: styles.optStack },
          React.createElement(Toggle, { label: "顯示外觀圖", checked: showPills, onChange: setShowPills }),
          showPills ? React.createElement(PillSizeControl, { px: pillPx, setPx: setPillPx }) : null,
          React.createElement(MedRefPanel, { medref })))
    )),
  page === "selfcheck" && React.createElement(SelfCheckView, {
    cloudInput: input, setCloudInput: setInput,
    selfInput: selfOrderInput, setSelfInput: setSelfOrderInput,
    grace: expiryGrace,
    snap: selfCheckSnap, setSnap: setSelfCheckSnap,
    overrides: selfCheckOverrides, setOverrides: setSelfCheckOverrides,
    customMap: selfBrandMap && typeof selfBrandMap === "object" && !Array.isArray(selfBrandMap) ? selfBrandMap : {},
    setCustomMap: setSelfBrandMap, medref,
    screen: selfCheckScreen, setScreen: setSelfCheckScreen,
    visits: SC_VISIT_CHOICES.includes(selfCheckVisits) ? selfCheckVisits : 5, setVisits: setSelfCheckVisits,
    fmtOpts: opts, onOpenAdmit: setAdmitCtx, showPills, setShowPills, onPageLoad: loadFromPage, handoff
  }),
  page === "discharge" && React.createElement(DischargeView, {
    input: dischargeInput, setInput: setDischargeInput, cloudInput: input,
    grace: expiryGrace, medref,
    customMap: selfBrandMap && typeof selfBrandMap === "object" && !Array.isArray(selfBrandMap) ? selfBrandMap : {},
    snap: dischargeSnap, setSnap: setDischargeSnap, setCloudInput: setInput,
    screen: dischargeScreen, setScreen: setDischargeScreen, showPills, setShowPills,
    dates: dischargeDates, setDates: setDischargeDates,
    visits: SC_VISIT_CHOICES.includes(selfCheckVisits) ? selfCheckVisits : 5, setVisits: setSelfCheckVisits,
    onOpenSheet: r => setDcSheet({ res: r }), onPageLoad: loadFromPage, handoff
  }),
  page === "organize" && !resultScreen && /*#__PURE__*/React.createElement("div", {className:"editor-slide",ref:editorRef,tabIndex:-1,"aria-label":"編輯藥歷"},
    /*#__PURE__*/React.createElement(Disclosure, {
      open: inputOpen,
      onToggle: () => setInputOpen(v => !v),
      index: "01",
      title: "貼上雲端藥歷",
      meta: inputMeta
    }, /*#__PURE__*/React.createElement("textarea", {
      style: styles.textarea,
      "aria-label":"雲端藥歷資料",
      placeholder: "將健保雲端藥歷頁面全選後貼上（Ctrl+A → Ctrl+C → 貼上此處）",
      value: input,
      onChange: e => setInput(e.target.value),
      spellCheck: false
    }), /*#__PURE__*/React.createElement("div", {
      style: styles.hint
    }, "Edge IE 模式、Chrome、Excel 複製出來的格式都支援，直接貼上即可。"),
    React.createElement(PageLoader, { onLoad: loadFromPage, fallback: setInput, auto: "cloud", onCloudLoaded: t => handleOrganize(t),
      hint: "在 HIS 病人頁面點工具列 Rx 開啟本工具，按「一鍵載入雲端藥歷」會自動按「雲端」、讀回雲端視窗內容並直接整理。" }),
    React.createElement(CloudHandoffChip, { handoff, current: input, onApply: applyHandoff })),

    /*#__PURE__*/React.createElement("button", {
      style: styles.btn,
      className: "primary-btn organize-action no-print",
      onClick: handleOrganize
    }, rawRows ? "重新整理藥歷" : "整理藥歷",
       /*#__PURE__*/React.createElement("span", { className: "arrow" }, "↗"))
  ), page === "organize" && error && /*#__PURE__*/React.createElement("div", {
    style: styles.error, role:"alert"
  }, error), page === "organize" && resultScreen && groups && dedupMap && /*#__PURE__*/React.createElement("div", {
    ref: resultRef, tabIndex:-1, "aria-label":"整理結果頁面",
    className:"result-panel result-slide",
    style: { ...styles.resultCard, marginTop: 0, scrollMarginTop: 16 }
  }, /*#__PURE__*/React.createElement("div", {
    className:"result-header", style: styles.resultHeader
  }, /*#__PURE__*/React.createElement("span", {
    style: styles.resultTitle
  }, /*#__PURE__*/React.createElement("span", { style: styles.resultDot }),
     "整理結果", /*#__PURE__*/React.createElement("span", {
    style: styles.resultCount
  }, "讀入 ", (rawRows?.length || 0), " · 顯示 ", totalCount)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {className:"back-edit no-print",onClick:()=>{setResultScreen(false);setInputOpen(true);}}, "← 返回編輯"),
    React.createElement("button", {className:"back-edit no-print",onClick:()=>{ const t = new Date(); t.setHours(0,0,0,0); setAdmitCtx({ rows: rowsRef, refDate: t, links: null, source: "整理結果" }); }}, "入院前用藥紀錄"),
    React.createElement(PillToggle, { show: showPills, setShow: setShowPills, className: "back-edit no-print" }),
    viewMode === "result" && /*#__PURE__*/React.createElement("button", {
    style: copied ? styles.btnCopied : styles.btnCopy,
    className: copied ? "" : "copy-btn",
    onClick: handleCopy
  }, copied ? "✓ 已複製" : "一鍵複製"))), viewMode === "result" && /*#__PURE__*/React.createElement("div", { className:"result-groups" + (alignColumns === "none" ? "" : " aligned"), style: styles.resultBody
  }, (() => {
    // A group is "expired" when all its rows have expired supply
    function groupExpired(rows) {
      return rows.every(r => isExpired(r, opts.expiryGrace));
    }

    // Common dispensing days belong to the visit header; exceptions stay on rows.
    const rowOpts = opts;
        const globalWidths = (opts.alignColumns === "global")
          ? computeGlobalWidths(groups.flatMap(([, { rows }]) => rows.map(r => formatDrugParts(r, rowOpts))))
          : null;
    let separatorShown = false;
    return groups.map(([key, {
      date,
      inst,
      rows
    }], gi) => {
      const isGroupExpired = groupExpired(rows);
      const gExpired = opts.showExpiredGray && isGroupExpired;
      const gExpiredText = opts.showExpiredGrayText && isGroupExpired;
      const { commonDays, partsList } = visitDrugParts(rows, rowOpts);
      const laidOut = layoutPartsLines(partsList, rowOpts, globalWidths);
      const displayWidths = globalWidths || computeGlobalWidths(partsList);
      const columnLayout = `var(--med-name-width, 40ch) ${Math.max(7, displayWidths.strength || 0)}ch ${Math.max(6, displayWidths.dose || 0)}ch ${Math.max(5, displayWidths.freq || 0)}ch ${Math.max(6, displayWidths.days || 0)}ch`;
      const items = rows.map((r, i) => {
        const dkey = drugKey(r);
        const entry = dedupMap.get(dkey);
        const regular = showRegular && entry && isRegular(entry.allRows);
        const changed = showChanged && entry && hasChanged(entry.allRows);
        const combo = opts.showComboWarning && looksLikeCombo(r) && !r.ref;
        return {
          r,
          parts: partsList[i],
          line: laidOut[i],
          regular,
          changed,
          combo
        };
      });
      const showSep = gExpired && !separatorShown;
      if (gExpired) separatorShown = true;

      // Common dispensing days are displayed alongside the institution and visit date.
      const expiredBadge = gExpired ? "（已無藥量）" : "";
      return /*#__PURE__*/React.createElement("div", {
        key: key,
        className:"med-group" + (gExpired ? " is-expired" : ""),
        style: {
          ...(gi > 0 ? styles.groupNotFirst : {}),
          ...(gExpired ? styles.groupExpired : {})
        }
      }, /*#__PURE__*/React.createElement("div", {
        className:"med-group-heading",
        style: {
          ...styles.groupHeader,
          ...(gExpired ? styles.groupHeaderExpired : {})
        }
      }, /*#__PURE__*/React.createElement("span", {
        className:"med-institution",
        style: {
          ...styles.instName,
          ...(gExpiredText ? styles.expiredText : {})
        }
      }, inst), gExpired && /*#__PURE__*/React.createElement("span", {
        style: styles.expiredBadge
      }, expiredBadge), /*#__PURE__*/React.createElement("div", {
        className:"med-group-meta", style: styles.groupSubline
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          ...styles.instDate,
          ...(gExpiredText ? styles.expiredText : {})
        }
      }, fmtDate(date), commonDays !== null ? `　${commonDays}天` : ""), /*#__PURE__*/React.createElement("span", {
        className:"med-count", style: styles.instIndex
      }, rows.length, " 筆"))), items.map(({
        r,
        parts,
        line,
        regular,
        changed,
        combo
      }, ii) => {
        const ingDisplay = stripSalt(r.ingName || "");
        const brandNm = extractBrandName(r.drugName);
        const expandable = nameMode === "brand" && !!brandNm && brandNm !== ingDisplay;
        const rowKey = `${gi}-${ii}`;
        const isExpanded = expandedNames.has(rowKey);
        const rowActive = opts.showActiveMark && !isExpired(r, opts.expiryGrace);
        return /*#__PURE__*/React.createElement(React.Fragment, {
          key: `${r.ingName}-${ii}`
        }, /*#__PURE__*/React.createElement("div", {
          className:"medication-row" + (rowActive ? " is-active" : ""),
          style: { ...styles.lineRow, ...(rowActive ? styles.lineActive : {}) }
        }, /*#__PURE__*/React.createElement("span", {
          className:"medication-line" + (alignColumns === "none" ? "" : " field-grid"),
          style: {
            ...styles.lineText,
            ...(alignColumns !== "none" ? {gridTemplateColumns:columnLayout} : {}),
            ...(gExpiredText ? styles.lineExpired : {}),
            ...(expandable ? styles.lineClickable : {})
          },
          onClick: expandable ? () => setExpandedNames(prev => {
            const n = new Set(prev);
            if (n.has(rowKey)) n.delete(rowKey); else n.add(rowKey);
            return n;
          }) : undefined,
          title: expandable ? (isExpanded ? "點擊收合學名" : "點擊顯示學名") : undefined
        }, alignColumns === "none" ? line : [
          React.createElement("span",{className:"field-name",key:"name"},parts.name),
          React.createElement("span",{className:"field-strength",key:"strength"},parts.strength),
          React.createElement("span",{className:"field-dose",key:"dose"},parts.dose),
          React.createElement("span",{className:"field-frequency",key:"frequency"},parts.freq),
          React.createElement("span",{className:"field-days",key:"days",title:"領藥天數"},parts.days)
        ]), /*#__PURE__*/React.createElement("span", {
        className:"medication-tags", style: styles.tags
      }, regular && /*#__PURE__*/React.createElement("span", {
        style: styles.tagRegular
      }, "\u5B9A\u671F"), changed && /*#__PURE__*/React.createElement("span", {
        style: styles.tagChanged
      }, "\u7528\u6CD5\u6709\u8B8A"), combo && /*#__PURE__*/React.createElement("span", { style: styles.tagCombo, title: "商品名暗示為複方，雲端藥歷可能未列出全部成分，請查證" }, "⚠ 可能複方"), React.createElement(MedThumb, { e: r.ref }))), expandable && isExpanded && /*#__PURE__*/React.createElement("div", { style: styles.ingNamePopout }, ingDisplay));
      }));
    });
  })()), viewMode === "timeline" && allRows && /*#__PURE__*/React.createElement(TimelineView, {
      allRows: allRows,
      dedupMap: dedupMap,
      opts: opts,
      darkMode: darkMode
    }),
    viewMode === "table" && allRows && /*#__PURE__*/React.createElement(CompareTable, {
    allRows: allRows,
    dedupMap: dedupMap,
    opts: opts
  })), /*#__PURE__*/React.createElement("footer", {
    style: styles.footer, className:"no-print"
  }, "\u672C\u5DE5\u5177\u50C5\u4F9B\u8CC7\u6599\u6574\u7406\u7528\u9014\uFF0C\u4E0D\u4F5C\u70BA\u91AB\u7642\u5EFA\u8B70\u3002")));
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    fontFamily: "var(--sans)",
    fontSize: 14,
    color: "var(--fg)",
    background: "transparent",
    minHeight: "100vh",
    padding: "0 24px 72px",
    maxWidth: 640,
    margin: "0 auto",
    boxSizing: "border-box",
    transition: "max-width .35s cubic-bezier(.16,1,.3,1)"
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "var(--bg)",
    borderBottom: "1px solid var(--line)",
    padding: "16px 0 13px",
    marginBottom: 22
  },
  // a light panel with a cyan mark, like the studio's own logo lockup
  logo: {
    fontWeight: 700,
    fontSize: 21,
    background: "var(--surface)",
    color: "var(--fg)",
    border: "1px solid var(--line)",
    borderLeft: "3px solid var(--accent-bright)",
    width: 42,
    height: 42,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "-0.04em",
    flexShrink: 0,
    boxShadow: "var(--shadow-sm)"
  },
  logoAccent: {
    color: "var(--accent)"
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: "var(--fg)"
  },
  subtitle: {
    margin: "3px 0 0",
    fontSize: 14,
    color: "var(--fg-muted)",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    fontFamily: "var(--mono)"
  },
  helpBtn: {
    marginLeft: "auto",
    background: "var(--surface)",
    border: "1px solid var(--line-strong)",
    color: "var(--fg-soft)",
    padding: "5px 12px",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 14,
    letterSpacing: "0.04em",
    flexShrink: 0,
    transition: "border-color .15s, color .15s"
  },
  card: {
    border: "1px solid var(--line)",
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-sm)",
    marginBottom: 12,
    overflow: "hidden"
  },
  // collapsible panel header
  discHead: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    textAlign: "left",
    background: "transparent",
    border: "none",
    padding: "13px 16px",
    cursor: "pointer",
    color: "var(--fg)",
    fontSize: 14,
    transition: "background .15s"
  },
  // small cyan dot with a soft ring — the studio's eyebrow marker
  discMark: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--accent-bright)",
    boxShadow: "0 0 0 4px var(--accent-soft)",
    flexShrink: 0,
    marginLeft: 2,
    marginRight: 4
  },
  discIndex: {
    fontFamily: "var(--mono)",
    fontSize: 14,
    letterSpacing: "0.1em",
    color: "var(--fg-muted)",
    flexShrink: 0
  },
  discTitle: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.03em",
    whiteSpace: "nowrap"
  },
  discMeta: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    color: "var(--fg-muted)",
    fontFamily: "var(--mono)",
    letterSpacing: "0.02em",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  discChev: {
    fontSize: 14,
    color: "var(--fg-muted)",
    flexShrink: 0
  },
  cardBody: {
    padding: "2px 16px 16px"
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "var(--fg-muted)",
    fontFamily: "var(--mono)",
    marginBottom: 8
  },
  hint: {
    marginTop: 10,
    fontSize: 14,
    color: "var(--fg-muted)",
    lineHeight: 1.85,
    letterSpacing: "0.02em"
  },
  textarea: {
    width: "100%",
    height: 200,
    border: "1px solid var(--line)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 14px",
    fontFamily: "var(--mono)",
    fontSize: 14,
    color: "var(--fg)",
    background: "var(--surface-2)",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
    lineHeight: 1.6
  },
  optionsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(206px, 1fr))",
    gap: "6px 26px"
  },
  optGroup: {
    minWidth: 0
  },
  // label block with a cyan left rule — the studio's section-index motif
  optGroupTitle: {
    display: "block",
    width: "fit-content",
    borderLeft: "3px solid var(--accent-bright)",
    background: "var(--surface-2)",
    padding: "6px 12px",
    fontFamily: "var(--mono)",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--fg-soft)",
    marginBottom: 13
  },
  optStack: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-start"
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    cursor: "pointer",
    userSelect: "none"
  },
  toggleTrack: {
    width: 30,
    height: 17,
    borderRadius: 9,
    cursor: "pointer",
    transition: "background .2s",
    position: "relative",
    flexShrink: 0
  },
  toggleThumb: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 13,
    height: 13,
    borderRadius: "50%",
    background: "var(--surface)",
    boxShadow: "0 1px 2px rgba(0,0,0,.28)",
    transition: "transform .2s cubic-bezier(.16,1,.3,1)"
  },
  toggleLabel: {
    fontSize: 14,
    color: "var(--fg-soft)",
    letterSpacing: "0.01em"
  },
  btn: {
    marginTop: 0,
    background: "var(--accent)",
    color: "var(--on-accent)",
    border: "none",
    padding: "14px 24px",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.14em",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    width: "100%",
    borderRadius: 999,
    boxShadow: "var(--shadow-sm)",
    transition: "filter .15s"
  },
  error: {
    border: "1px solid var(--danger-line)",
    color: "var(--danger)",
    padding: "10px 14px",
    fontSize: 14,
    marginBottom: 14,
    background: "var(--danger-soft)",
    borderRadius: "var(--radius-sm)"
  },
  resultCard: {
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    background: "var(--surface)",
    boxShadow: "var(--shadow)"
  },
  resultHeader: {
    position: "sticky",
    top: 70,
    zIndex: 30,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    background: "var(--surface-3)",
    color: "var(--fg)",
    borderBottom: "1px solid var(--line)",
    boxShadow: "inset 3px 0 0 var(--accent-bright)",
    padding: "11px 18px",
    borderRadius: "calc(var(--radius) - 1px) calc(var(--radius) - 1px) 0 0"
  },
  resultTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontFamily: "var(--mono)",
    color: "var(--fg)"
  },
  resultDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--accent-bright)",
    boxShadow: "0 0 0 4px var(--accent-soft)",
    flexShrink: 0,
    marginLeft: 2,
    marginRight: 3
  },
  resultCount: {
    background: "var(--surface)",
    border: "1px solid var(--line-strong)",
    color: "var(--fg-muted)",
    borderRadius: 999,
    padding: "2px 9px",
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: "0.06em",
    whiteSpace: "nowrap"
  },
  btnCopy: {
    background: "var(--surface)",
    border: "1px solid var(--line-strong)",
    color: "var(--fg-soft)",
    fontSize: 14,
    padding: "5px 14px",
    cursor: "pointer",
    letterSpacing: "0.06em",
    borderRadius: 999,
    whiteSpace: "nowrap",
    transition: "background .2s var(--ease), color .2s var(--ease), border-color .2s var(--ease)"
  },
  btnCopied: {
    background: "transparent",
    border: "1px solid var(--accent)",
    color: "var(--accent)",
    fontSize: 14,
    padding: "5px 14px",
    cursor: "default",
    letterSpacing: "0.06em",
    borderRadius: 999,
    whiteSpace: "nowrap"
  },
  btnAdv: {
    background: "var(--surface)",
    border: "1px solid var(--line-strong)",
    color: "var(--fg-soft)",
    fontSize: 14,
    padding: "5px 14px",
    cursor: "pointer",
    letterSpacing: "0.06em",
    borderRadius: 999
  },
  btnAdvActive: {
    background: "var(--accent)",
    border: "1px solid var(--accent)",
    color: "var(--on-accent)",
    fontSize: 14,
    padding: "5px 14px",
    cursor: "pointer",
    letterSpacing: "0.06em",
    borderRadius: 999,
    fontWeight: 700
  },
  btnCopyDark: {
    background: "var(--accent)",
    border: "1px solid var(--accent)",
    color: "var(--on-accent)",
    fontSize: 14,
    padding: "5px 14px",
    cursor: "pointer",
    letterSpacing: "0.06em",
    borderRadius: 999
  },
  btnCopiedDark: {
    background: "transparent",
    border: "1px solid var(--line-strong)",
    color: "var(--fg-muted)",
    fontSize: 14,
    padding: "5px 14px",
    cursor: "default",
    letterSpacing: "0.06em",
    borderRadius: 999
  },
  resultBody: {
    padding: "20px 22px 24px",
    background: "var(--surface)",
    borderRadius: "0 0 var(--radius) var(--radius)",
    overflowX: "auto"
  },
  group: {
    marginBottom: 16
  },
  groupNotFirst: {
    marginTop: 18,
    paddingTop: 18,
    borderTop: "1px dashed var(--line-strong)"
  },
  // visit header carries the same cyan left rule as the option-group labels
  groupHeader: {
    display: "flex",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: "2px 12px",
    borderLeft: "3px solid var(--accent-bright)",
    padding: "6px 10px 6px 12px",
    marginBottom: 10,
    background: "linear-gradient(90deg, var(--surface-2), transparent 65%)"
  },
  groupHeaderExpired: {
    borderLeftColor: "var(--line-strong)",
    background: "none"
  },
  groupSubline: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    marginLeft: "auto"
  },
  instName: {
    fontWeight: 700,
    fontSize: 14,
    color: "var(--fg)",
    letterSpacing: "0.02em"
  },
  instDate: {
    fontSize: 14,
    color: "var(--fg-muted)",
    fontFamily: "var(--mono)",
    letterSpacing: "0.06em"
  },
  instIndex: {
    fontSize: 14,
    color: "var(--fg-muted)",
    fontFamily: "var(--mono)",
    letterSpacing: "0.1em",
    whiteSpace: "nowrap"
  },
  expiredBadge: {
    fontSize: 14,
    color: "var(--fg-muted)",
    marginLeft: 8,
    border: "1px solid var(--line-strong)",
    borderRadius: 999,
    padding: "1px 8px",
    whiteSpace: "nowrap"
  },
  lineRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    lineHeight: 1.95,
    borderRadius: 4
  },
  lineText: {
    fontFamily: "var(--mono)",
    fontSize: 14,
    color: "var(--fg)",
    paddingLeft: 10,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: 0
  },
  lineGrid: {
    display: "grid",
    gridTemplateColumns: "10em 4em 6em 1fr",
    columnGap: 8,
    paddingLeft: 6,
    paddingTop: 1,
    paddingBottom: 1,
    fontSize: 14,
    color: "var(--fg)"
  },
  lgName:     { fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  lgStrength: { color: "var(--fg-muted)", fontSize: 14, alignSelf: "center" },
  lgDose:     { color: "var(--fg-soft)" },
  lgFreq:     { color: "var(--fg-soft)" },
  lineExpired: {
    color: "var(--fg-muted)"
  },
  lineClickable: {
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationStyle: "dotted",
    textDecorationColor: "var(--line-strong)",
    textUnderlineOffset: 3
  },
  lineActive: {
    borderLeft: "3px solid var(--ok)",
    paddingLeft: 5,
    marginLeft: -8,
    background: "linear-gradient(90deg, var(--ok-soft), transparent 58%)"
  },
  graceField: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: "var(--fg-soft)",
    letterSpacing: "0.01em",
    userSelect: "none"
  },
  graceInput: {
    width: 46,
    padding: "3px 6px",
    border: "1px solid var(--line-strong)",
    borderRadius: 5,
    fontSize: 14,
    fontFamily: "var(--mono)",
    background: "var(--surface)",
    color: "var(--fg)",
    textAlign: "center"
  },
  ingNamePopout: {
    fontSize: 14,
    color: "var(--fg-soft)",
    fontStyle: "italic",
    padding: "3px 10px",
    marginLeft: 10,
    marginTop: -2,
    marginBottom: 4,
    lineHeight: 1.5,
    background: "var(--accent-soft)",
    borderLeft: "2px solid var(--accent-bright)",
    borderRadius: "0 4px 4px 0"
  },
  groupExpired: {
    opacity: 0.6
  },
  expiredText: {
    color: "var(--fg-muted)"
  },
  tags: {
    display: "flex",
    gap: 5,
    flexShrink: 0
  },
  tagRegular: {
    fontSize: 14,
    background: "var(--ok-soft)",
    color: "var(--ok)",
    border: "1px solid var(--ok-line)",
    padding: "0 7px",
    borderRadius: 999,
    lineHeight: "17px",
    whiteSpace: "nowrap"
  },
  tagChanged: {
    fontSize: 14,
    background: "var(--warn-soft)",
    color: "var(--warn)",
    border: "1px solid var(--warn-line)",
    padding: "0 7px",
    borderRadius: 999,
    lineHeight: "17px",
    whiteSpace: "nowrap"
  },
  tagCombo: {
    fontSize: 14,
    background: "var(--danger-soft)",
    color: "var(--danger)",
    border: "1px solid var(--danger-line)",
    padding: "0 7px",
    borderRadius: 999,
    lineHeight: "17px",
    whiteSpace: "nowrap",
    cursor: "help"
  },
  // Compare table
  compareWrap: {
    background: "var(--surface)"
  },
  compareToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    borderBottom: "1px solid var(--line)",
    background: "var(--surface-2)",
    flexWrap: "wrap",
    gap: 8
  },
  compareInfoBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  compareInfo: {
    fontSize: 14,
    color: "var(--fg-soft)",
    letterSpacing: "0.04em"
  },
  compareBaseline: {
    fontSize: 14,
    color: "var(--warn)",
    fontWeight: "bold"
  },
  compareHint: {
    padding: "6px 16px",
    fontSize: 14,
    color: "var(--fg-muted)",
    background: "var(--surface-2)",
    borderBottom: "1px solid var(--line)",
    letterSpacing: "0.02em"
  },
  compareScroll: {
    overflowX: "auto",
    maxWidth: "100%"
  },
  compareTable: {
    borderCollapse: "collapse",
    fontSize: 14,
    fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
    color: "var(--fg)",
    minWidth: "100%"
  },
  thFirst: {
    position: "sticky",
    left: 0,
    background: "var(--surface-3)",
    color: "var(--fg)",
    padding: "8px 10px",
    textAlign: "left",
    fontWeight: "bold",
    borderRight: "1px solid var(--line)",
    borderBottom: "2px solid var(--accent-bright)",
    whiteSpace: "nowrap",
    fontSize: 14,
    zIndex: 2
  },
  th: {
    background: "var(--surface-3)",
    color: "var(--fg)",
    padding: "6px 10px",
    borderRight: "1px solid var(--line)",
    borderBottom: "2px solid var(--accent-bright)",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontSize: 14,
    userSelect: "none"
  },
  thBaseline: {
    background: "var(--warn-soft)",
    color: "var(--warn)",
    borderBottom: "2px solid var(--warn-line)"
  },
  thSelected: {
    background: "var(--warn-line)",
    color: "var(--warn)",
    borderBottom: "2px solid var(--warn)"
  },
  thDate: {
    fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
    fontSize: 14,
    fontWeight: "bold"
  },
  thInst: {
    fontSize: 14,
    opacity: 0.85,
    marginTop: 2,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
  },
  tdFirst: {
    position: "sticky",
    left: 0,
    background: "inherit",
    padding: "6px 10px",
    borderRight: "1px solid var(--line)",
    borderBottom: "1px solid var(--line)",
    whiteSpace: "nowrap",
    verticalAlign: "top",
    zIndex: 1,
    userSelect: "none"
  },
  td: {
    padding: "6px 10px",
    borderRight: "1px solid var(--line)",
    borderBottom: "1px solid var(--line)",
    whiteSpace: "nowrap",
    verticalAlign: "top"
  },
  tdChanged: {
    background: "var(--warn-soft)",
    color: "var(--warn)",
    fontWeight: "bold"
  },
  tdBaselineCol: {
    background: "#fdf6ec"
  },
  tdSelectedCol: {
    background: "#fff8e6"
  },
  tdOut: {
    color: "var(--fg-muted)"
  },
  tdDitto: {
    color: "var(--fg-muted)"
  },
  dittoMark: {
    fontSize: 14,
    color: "var(--fg-muted)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
  },
  divider: {
    background: "var(--surface)"
  },
  dividerCell: {
    padding: "8px 16px",
    textAlign: "left",
    fontSize: 14,
    color: "var(--fg-soft)",
    letterSpacing: "0.1em",
    borderTop: "1px solid var(--line)",
    borderBottom: "1px solid var(--line)",
    background: "var(--surface-2)",
    fontWeight: "bold"
  },
  dividerCellSel: {
    background: "var(--warn-soft)",
    color: "var(--warn)",
    borderTop: "2px solid var(--warn-line)"
  },
  dividerCellOut: {
    background: "var(--surface-3)",
    color: "var(--fg-muted)",
    borderTop: "2px dashed var(--line-strong)"
  },
  drugSelected: {
    display: "inline-block",
    marginRight: 6,
    color: "var(--warn)",
    fontSize: 14
  },
  drugInactive: {
    display: "inline-block",
    marginRight: 6,
    color: "var(--fg-muted)",
    fontSize: 14
  },
  drugCheckbox: {
    display: "inline-block",
    marginRight: 6,
    color: "var(--fg-muted)",
    fontSize: 14,
    fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
  },
  drugName: {
    fontWeight: "bold",
    color: "var(--fg)"
  },
  drugStrength: {
    fontSize: 14,
    color: "var(--fg-muted)",
    marginTop: 1
  },
  drugStrengthInline: {
    fontSize: 14,
    color: "var(--fg-muted)",
    fontWeight: "normal",
    fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
  },
  empty: {
    color: "var(--fg-muted)"
  },
  compareLegend: {
    padding: "8px 16px",
    borderTop: "1px solid var(--line)",
    fontSize: 14,
    color: "var(--fg-muted)",
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    background: "var(--warn-soft)",
    border: "1px solid var(--warn-line)",
    display: "inline-block"
  },
  btnLink: {
    background: "transparent",
    border: "1px solid var(--fg-muted)",
    color: "var(--fg-soft)",
    fontSize: 14,
    padding: "4px 10px",
    cursor: "pointer",
    letterSpacing: "0.04em",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
  },
  footer: {
    marginTop: 44,
    fontSize: 14,
    color: "var(--fg-muted)",
    textAlign: "center",
    letterSpacing: "0.1em",
    borderTop: "1px solid var(--line)",
    paddingTop: 18,
    lineHeight: 1.9
  },

  // ── 右側固定頁籤 (RightNav) ──
  rightNav: {
    position: "fixed",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRight: "none",
    borderRadius: "12px 0 0 12px",
    overflow: "hidden",
    boxShadow: "var(--shadow-lg)"
  },
  rightNavBtn: {
    writingMode: "vertical-rl",
    padding: "16px 10px",
    fontSize: 14,
    letterSpacing: "0.2em",
    background: "transparent",
    color: "var(--fg-muted)",
    border: "none",
    borderBottom: "1px solid var(--line)",
    cursor: "pointer",
    fontFamily: "var(--sans)",
    transition: "background .2s var(--ease), color .2s var(--ease)"
  },
  rightNavBtnActive: {
    background: "var(--accent)",
    color: "var(--on-accent)",
    fontWeight: 700,
    boxShadow: "inset 3px 0 0 var(--accent-bright)"
  },

  // ── 自備藥核對 input layout ──
  crossIntro: { fontSize: 14, color: "var(--fg-soft)", marginBottom: 12, lineHeight: 1.6 },
  crossRow: { display: "flex", gap: 16, flexWrap: "wrap" },
  crossCol: { flex: "1 1 320px", minWidth: 260 },
  crossControls: { display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginTop: 14 }
};

// A single visual system for all four existing views.
Object.assign(styles.page,{fontSize:16,maxWidth:1480,padding:"0 36px 28px",transition:"none"});
Object.assign(styles.card,{border:"none",borderTop:"1px solid var(--line)",borderRadius:0,boxShadow:"none",marginBottom:0,overflow:"visible"});
Object.assign(styles.discHead,{padding:"21px 0",gap:18,flexWrap:"wrap",rowGap:8});
Object.assign(styles.discIndex,{fontSize:13,color:"var(--accent)",minWidth:24});
Object.assign(styles.discTitle,{fontSize:18,letterSpacing:0});
Object.assign(styles.discMeta,{fontSize:13,whiteSpace:"normal",textAlign:"right",lineHeight:1.6,flex:1,justifyContent:"flex-end",fontFamily:"var(--sans)"});
Object.assign(styles.discChev,{fontSize:20,color:"var(--fg)"});
Object.assign(styles.cardBody,{padding:"0 0 22px"});
Object.assign(styles.textarea,{height:204,minHeight:110,borderRadius:12,padding:"20px 22px",fontSize:16,lineHeight:1.8,background:"var(--surface-2)",border:"1px solid var(--line-strong)",outline:undefined});
Object.assign(styles.hint,{fontSize:13,marginTop:12,lineHeight:1.65});
Object.assign(styles.optionsRow,{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,235px),1fr))",gap:"26px 28px",paddingTop:4});
Object.assign(styles.optGroupTitle,{fontSize:14,letterSpacing:0,padding:"4px 10px",background:"transparent",marginBottom:16});
Object.assign(styles.optStack,{gap:13});
Object.assign(styles.toggleLabel,{fontSize:14,lineHeight:1.5});
Object.assign(styles.btn,{width:"auto",minHeight:52,padding:"14px 30px",fontSize:16,letterSpacing:".03em",background:"var(--accent-bright)",color:"#071e30",boxShadow:"none"});
Object.assign(styles.resultCard,{borderRadius:14,boxShadow:"none",overflow:"clip"});
Object.assign(styles.resultHeader,{position:"relative",top:0,padding:"18px 22px",background:"var(--invert-bg)",color:"var(--invert-fg)",boxShadow:"none",borderBottom:"2px solid var(--accent-bright)",flexWrap:"wrap"});
Object.assign(styles.resultTitle,{color:"var(--invert-fg)",fontSize:16,fontFamily:"var(--sans)",letterSpacing:0,flexWrap:"wrap"});
Object.assign(styles.resultDot,{display:"none"});
Object.assign(styles.resultCount,{background:"transparent",color:"var(--invert-muted)",border:"none",fontSize:13,padding:0});
Object.assign(styles.btnCopy,{fontSize:14,padding:"10px 20px",background:"var(--surface)",color:"var(--fg)",border:"none"});
Object.assign(styles.btnCopied,{fontSize:14,padding:"10px 20px",color:"#65d6ee",borderColor:"#65d6ee"});
Object.assign(styles.resultBody,{padding:"24px"});
Object.assign(styles.lineText,{fontSize:16,minWidth:0});
Object.assign(styles.lineRow,{flexWrap:"wrap",rowGap:0});
Object.assign(styles.instName,{fontSize:17});
Object.assign(styles.groupHeader,{background:"var(--surface-2)",padding:"10px 14px",borderLeftWidth:2});
Object.assign(styles.crossCol,{minWidth:0,flex:"1 1 280px"});
Object.assign(styles.crossIntro,{fontSize:16,lineHeight:1.8,marginBottom:24});
Object.assign(styles.crossControls,{justifyContent:"space-between",alignItems:"center"});
Object.assign(styles.compareLegend,{flexWrap:"wrap"});
Object.assign(styles.footer,{marginTop:28,paddingTop:18,fontSize:12,textAlign:"left",letterSpacing:0});
Object.assign(helpStyles.modal,{borderRadius:20});


// Result typography and spacing share the application's editorial visual system.
Object.assign(styles.groupNotFirst,{marginTop:0,paddingTop:0,borderTop:"none"});
Object.assign(styles.groupExpired,{opacity:1});
Object.assign(styles.groupHeaderExpired,{borderLeftColor:"transparent"});
Object.assign(styles.expiredBadge,{background:"transparent",borderColor:"#66818f",color:"var(--invert-muted)",fontSize:12,padding:"3px 10px",marginLeft:0});
Object.assign(styles.resultBody,{padding:24});


// Compact result toolbar; same hierarchy as the data sheets below it.
Object.assign(styles.resultHeader,{padding:"9px 16px",background:"var(--surface)",color:"var(--fg)",borderBottom:"1px solid var(--line)",gap:10});
Object.assign(styles.resultTitle,{color:"var(--fg)",fontSize:15});
Object.assign(styles.resultCount,{color:"var(--fg-muted)",fontSize:13});
Object.assign(styles.btnCopy,{padding:"5px 13px",fontSize:13,border:"1px solid var(--line-strong)",background:"var(--surface)",color:"var(--fg)"});
Object.assign(styles.btnCopied,{padding:"5px 13px",fontSize:13,borderColor:"var(--accent)",color:"var(--accent)"});
Object.assign(styles.resultCard,{borderRadius:8});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/*#__PURE__*/React.createElement(MedOrganizer, null));



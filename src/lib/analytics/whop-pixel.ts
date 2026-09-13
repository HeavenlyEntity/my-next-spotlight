/*
 * The Whop Pixel.
 *
 * Whop's install instruction is "paste this snippet inside the <head> of every
 * page in your funnel", and the snippet is a single inline <script>. This file
 * holds the JavaScript from inside those tags, byte for byte -- the layout
 * renders it into a real <script> in <head>, so the HTML the browser receives
 * is the snippet Whop published.
 *
 * It lives in its own file with its own test for one reason: vendor snippets
 * are minified, unreadable, and impossible to review in a diff. A stray
 * character introduced while moving it between files would not be caught by a
 * build, a typecheck or a rendering test -- the script would simply do nothing,
 * or half of it would. The test asserts the exact string, so a change of any
 * kind has to be deliberate.
 *
 * Do not reformat. Prettier is not going to improve this, and every tool that
 * touches it is a chance to break it silently.
 */

/** From the Whop dashboard URL. Scoped by whop.setScope() below. */
export const WHOP_BUSINESS_ID = 'biz_PGSOCOwANQSket'

// prettier-ignore
export const WHOP_PIXEL = `!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");whop.setScope("${WHOP_BUSINESS_ID}");whop.track("page");`

import { describe, expect, it } from 'vitest'

import { WHOP_BUSINESS_ID, WHOP_PIXEL } from '../whop-pixel'

/* The snippet Whop published, pasted once, independently of the source file.
   If the two ever disagree the pixel is broken in a way nothing else here
   would catch -- a minified vendor blob still parses after losing a
   character, it just stops working. */
const PUBLISHED =
  '!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");whop.setScope("biz_PGSOCOwANQSket");whop.track("page");'

describe('Whop pixel', () => {
  it('is character-for-character what Whop published', () => {
    expect(WHOP_PIXEL).toBe(PUBLISHED)
    expect(WHOP_PIXEL).toHaveLength(PUBLISHED.length)
  })

  it('carries the right business id', () => {
    expect(WHOP_BUSINESS_ID).toBe('biz_PGSOCOwANQSket')
    expect(WHOP_PIXEL).toContain('whop.setScope("biz_PGSOCOwANQSket")')
  })

  it('loads from the domain Whop documents', () => {
    expect(WHOP_PIXEL).toContain('"https://t.whop.tw"')
    // The loader appends /s.js to that origin.
    expect(WHOP_PIXEL).toContain('u+"/s.js"')
  })

  it('fires a page event', () => {
    expect(WHOP_PIXEL).toContain('whop.track("page")')
  })

  it('contains nothing that would break inside a <script> tag', () => {
    /* An inline script ends at the first literal "</script" the parser sees,
       whatever the JavaScript meant by it. This snippet has none, and this
       test is here so a future edit that introduces one fails loudly rather
       than silently truncating the page. */
    expect(WHOP_PIXEL.toLowerCase()).not.toContain('</script')
    expect(WHOP_PIXEL).not.toContain('<!--')
  })
})

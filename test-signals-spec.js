const test = require('tape')
const convert = require('gdoc2respec')
const fs = require('fs')

const config = {
  useFile: 'test-data/signals-spec-raw.html',
  gdocID: '1WWYQ33Y9ENcueiFnrb3hJzD2rxKCRw9ok8T3PrDLOB8',
  noRecTrack: true,
  edDraftURI: 'https://credweb.org/report/snapshot',
  specStatus: 'ED',
  editors: [{
    name: 'Sandro Hawke',
    url: 'http://hawke.org/sandro'
  }],
  github: 'https://github.com/w3c/credweb',
  shortName: 'not-published-as-TR',
  abstractHTML: 'Abstract TBD',
  sotdHTML: 'TBD'
}

test('no mappers', t => {
  convert(config)
    .then(out => {
      fs.writeFileSync('out-signals-spec.html', out, 'utf8')
      console.warn('## MANUALLY CHECK: out-signals-spec.html')
      t.pass()
      t.end()
    })
})

test('element filter', t => {
  config.filter = html => {
    // console.log('\n\n' + html)
    return html
  }
  convert(config)
    .then(out => {
      fs.writeFileSync('out-signals-spec-2.html', out, 'utf8')
      console.warn('## MANUALLY CHECK: out-signals-spec-2.html')
      t.pass()
      t.end()
    })
})

test('sectionExtra', t => {
  let h
  let aliases = null
  config.seeNode = node => {
    const t = node.prop('tagName')
    if (t[0] === 'H' && t.length === 2) {
      const level = parseInt(t[1])
      h = node.html()
      aliases = null  // lest we use our parent headings aliases
    } else {
      const html = node.html()
      const m = html.match(/^also called: *(.*)$/i)
      if (m) {
        aliases = m[1].split(/, */)
      }
    }
  }
  config.sectionExtra = lines => {
    const head = lines[1]
    
    // console.log('\n\n' + lines)
    const m = h.match(/^Signal: *(.*)$/)
    if (m) {
      const s = m[1]
      let a = ''
      if (aliases) {
        a = ' (aliases: ' + JSON.stringify(aliases) + ')'
        aliases = null
      }
      return [`[Data about signal ${s}${a} will be inserted here]`]
    }
    return []
    // return ['<p>EXTRA Section Intro Ending Here.  Line 1 was:' + JSON.stringify(lines[1].replace('<', '&lt')) + ' Heading was ' + JSON.stringify(h)]
  }
  convert(config)
    .then(out => {
       fs.writeFileSync('out-signals-spec-3.html', out, 'utf8')
      console.warn('## MANUALLY CHECK: out-signals-spec-3.html')
      t.pass()
      t.end()
    })
})

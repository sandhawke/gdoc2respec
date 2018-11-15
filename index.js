/*

  config is respec's config, plus some extra things we use:
  
  config.seeNode is passed each DOM element node, which it may alter.
  If it returns truthy, it is taken as new outerHTML text (or array of
  that text to be joined later -- but then config.filter gets passed
  the array.)

  config.filter is passed the outer HTML as a string for each element,
  and whatever it returns is used in its place.  Can also return an
  array of strings; they will be joined later, at the end of
  the pass.  This allows the filter to replace / insert text later on,
  by remembering the array object it returned and changing it. This
  runs right after seeNode.

  config.sectionExtra is called at the end of the intro of each
  section, which is right before either the section ends or a
  subsection starts, whichever comes first.  It is passed an array of
  strings which is all the lines in the section so far, and should
  return an array of all the lines to add at this point.

  config.sectionFilter is like sectionExtra but it must return
  whatever lines will become the new text of the section.

 */

const cheerio = require('cheerio')
const fetch = require('node-fetch')
const debug = require('debug')('gdoc2respec')
const fs = require('fs').promises
// const H = require('escape-html-template-tag')   // H.safe( ) if needed

/*
function aReadFile(filename, options = 'utf8') {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, options, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
*/

async function convert (config) {
  if (config.useFile) {
    const body = await fs.readFile(config.useFile)
    return c2(config, body)
  }
  if (!config.gdocID) throw new Error('Missing config.gdocID')
  const m = config.gdocID.match(/([0-9a-zA-Z_-]{20,})/)
  if (!m) throw new Error('config.gdocID seems badly formated')
  const id = m[1] // pull out the doc id, so URLs are okay
  const url = 'https://docs.google.com/document/export?format=html&id=' + id
  debug('fetching', url)
  const result = await fetch(url)
  debug('fetch() returned results')
  const body = await result.text()
  debug('fetch() results complete')
  await fs.writeFile('last-fetch.html', body)
  return c2(config, body)
}

function c2 (config, txt) {
  debug('got document text: ', txt.substring(1, 50), '...')
  let out = []
  let sectionStartsAt = null  // index into out
  
  function log (level, data) {
    debug('logged', data)
    const i = indent(level)
    if (Array.isArray(data)) {
      data[0] = i + data[0]
    } else {
      data = i + data
    }
    out.push(data)
  }

  const $ = cheerio.load(txt)

  //
  // Figure out the title
  //

  if (!config.title) {
    config.title = $('.title').text()
  }

  //
  // Create <b> and <i> wrappers from the style + class
  //

  let bClass
  {
    const m = txt.match(/\.(c\d+)\{font-weight:700\}/)
    if (m) {
      bClass = m[1]
    }
  }
  let iClass
  {
    const m = txt.match(/\.(c\d+)\{font-style:italic\}/)
    if (m) {
      iClass = m[1]
    }
  }

  $('.' + bClass).wrap('<b>')
  $('.' + iClass).wrap('<i>')

  //
  // Remove the heading x.y.z. numbers provided by TableOfContent add-on
  //

  $('h1,h2,h3,h4,h5,h6').text((i, old) => {
    const m = old.match(/^(\d+\.)+ ?(.*)$/)
    if (m) {
      return m[2]
    }
    return old
  })

  //
  // Remove all the spans and classes, which are all weird junk at this point
  //

  $('span').replaceWith(function () {
    return $(this).html()
  })

  $('*').attr('class', null)

  //
  // Output head with respec boilerplate
  //

  log(0, `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${config.title}</title>${config.extraHead || ''}
  <script src="https://www.w3.org/Tools/respec/respec-w3c-common" class="remove">
  </script>
  <script class="remove">
  var respecConfig = ${JSON.stringify(config, null, 4)}
  </script>
</head>
<body>
  <div id="abstract">${config.abstractHTML}</div>
  <div id="sotd">${config.sotdHTML}</div>
`)

  //
  // Add <section> wrappers and output
  //
  // (instead of outputting, we could probably buffer up each subtree?)
  //

  let curLevel = 0

  function indent (level) {
    return (''.padStart(level * 4, ' '))
  }

  // log($('body').html())

  let dropping = true // drop everything before first heading
  $('body').children().each(function (index) {
    const t = $(this).prop('tagName')
    if (t[0] === 'H' && t.length === 2) {
      dropping = false
      const level = parseInt(t[1])

      while (level <= curLevel) {
        curLevel--
        sectionIntroEnds()
        log(curLevel, '</section>')
      }
      while (level > curLevel) {
        sectionIntroEnds()
        sectionStarts()
        log(curLevel, '<section>')
        curLevel++
      }
    }
    if (dropping) return

    let seeNodeOut, html
    if (config.seeNode) {
      seeNodeOut = config.seeNode($(this))
    }
    if (seeNodeOut) {
      html = seeNodeOut
    } else {
      html = $(this).clone().wrap('<p>').parent().html()
    }
    if (config.filter) {
      html = config.filter(html)
    }
    log(curLevel, html)
  })

  while (curLevel >= 1) {
    curLevel--
    sectionIntroEnds()
    log(curLevel, '</section>')
  }

  log(0, '</body></html>')
  log(0, '')
  for (let i = 0; i < out.length; i++) {
    // let the plugins return arrays, so they can alter them later in the flow
    if (Array.isArray(out[i])) out[i] = out[i][0] // .join('$')
  }
  return out.join('\n')

  function sectionStarts() {
    sectionStartsAt = out.length
    // console.log('sectionStartsAt set to', sectionStartsAt)
  }

  function sectionIntroEnds() {
    if (config.sectionExtra) {
      if (sectionStartsAt === null) return
      // console.log('using SSA', sectionStartsAt)
      
      // might be section is ending, or might be sub-section is starting
      
      const moreLines = config.sectionExtra(out.slice(sectionStartsAt))
      if (moreLines) out.push(...moreLines)
      sectionStartsAt = null
    }
    if (config.sectionFilter) {    // this is probably better than sectionExtra
      if (sectionStartsAt === null) return
      const lines = config.sectionFilter(out.slice(sectionStartsAt))
      if (lines) {
        out.splice(sectionStartsAt, out.length, ...lines)
      }
      sectionStartsAt = null
    }
  }
}

module.exports = convert

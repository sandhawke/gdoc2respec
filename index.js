const cheerio = require('cheerio')
const fetch = require('node-fetch')
const debug = require('debug')('gdoc2respec')

async function convert (config) {
  const url = 'https://docs.google.com/document/export?format=html&id=' + config.gdocID
  debug('fetching', url)
  const result = await fetch(url)
  debug('fetch() returned results')
  const body = await result.text()
  debug('fetch() results complete')
  return c2(config, body)
}

function c2 (config, txt) {
  debug('got document text: ', txt.substring(1, 50), '...')
  let out = []

  function log (str) {
    debug('logged', str)
    out.push(str)
  }

  const $ = cheerio.load(txt)

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

  log(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${config.title}</title>
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

  function indent () {
    return (''.padStart(curLevel * 4, ' '))
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
        log(indent() + '</section>')
      }
      while (level > curLevel) {
        log(indent() + '<section>')
        curLevel++
      }
    }
    if (dropping) return
    log(indent() + $(this).clone().wrap('<p>').parent().html())
  })

  while (curLevel >= 1) {
    curLevel--
    log(indent() + '</section>')
  }

  log('</body></html>')
  log('')
  return out.join('\n')
}

module.exports = convert

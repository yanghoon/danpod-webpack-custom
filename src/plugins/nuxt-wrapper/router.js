import Vue from 'vue'
import Path from 'path'
import * as Layout from './layout'

/** START from vue-page-router */
// import PageRouter from 'vue-page-router'
import Router from 'vue-router'
import kebabCase from 'lodash/kebabCase'
import camelCase from 'lodash/camelCase'

import store from '@/store'
const {config} = store.state

function makeOptions (pages) {
  let options = { mode: config.router.mode, routes: [] }

  for (let [pageName, component] of Object.entries(pages)) {
    let name = camelCase(pageName)
    let slug = kebabCase(pageName)
    let path = component.path ? component.path : name === 'index' ? '/' : '/' + slug

    options.routes.push({ path, component, name: pageName })
  }

  // Support nuxt.js dynamic routes (https://nuxtjs.org/guide/routing#dynamic-routes)
  options.routes.sort(pathCompareator)

  return options
}
/** END from vue-page-router */

/** Load page components and generate route path */
function loadPages () {
  // https://www.npmjs.com/package/require-context
  const req = require.context('@/pages', true, /vue$/)
  return req.keys().map(k => {
    // '/user/_id'   -> '/user/:id'
    // '/user/index' -> '/user'
    // '/index' -> '/'

    var comp = req(k).default
    var dir = Path.dirname(k)
    var name = Path.basename(k, Path.extname(k))
    var path = ['/', dir, (name !== 'index' ? name : '')]
    comp.path = Path.join(...path).replace(/_/gi, ':')

    console.log(k, '->', comp.path, comp)

    return comp
  })
}

function pathCompareator ({path: s2}, {path: s1}) {
  var comp = 0
  for (var i in s1) {
    if (s1[i] === s2[i]) continue
    else if (s1[i] === ':') comp = -1 // if contain ':', move to back
    else if (s2[i] === ':') comp = 10
    else if (s2[i] === undefined) comp = -1 // s2 is short, move to front
    // console.log(comp, s1[i], s2[i], s1, s2)
    return comp
  }
  return 10 // 0 <= s2-s1
}

/** Error handlers */
function _404 (to, from, next, error) {
  /**
   * Base URL       = http://localhost:8080/context
   * VueRouter.mode = 'hash'
   * Case)
   *   /page/vue             -> http://localhost:8080/context#/page/vue     = VueRouter.next()
   *   /page/not-vue         -> http://localhost:8080/context/page/product  = location.href
   *   redirect:/page/order  -> http://localhost:8080/context/page/order    = location.href
   *   http://github.com     -> http://github.com                           = location.href
   */
  /* handle redirect */
  const prefix = Path.join(Path.dirname(from.path), '/')
  if (to.path.indexOf(prefix) === 0) {
    const redirect = to.path.substr(prefix.length)
    if (redirect.startsWith('redirect:')) {
      const redirect2 = redirect.substr('redirect:'.length + 1)
      const url = `${location.protocol}//${location.host}/${redirect2}`

      console.log(prefix, url)
      location.href = url
      return
    }
    if (redirect.startsWith('http')) {
      console.log(prefix, redirect)
      window.open(redirect)
      return
    }
  }

  /* error page */
  if (to.path === '/error') {
    to.params.error = { statusCode: 404 }
  } else if (to.path === '/z') {
    to.params.error = { statusCode: 404 }
    next('/error')
  } else if (!to.matched.length) {
    let url = new URL(location.href)
    url.pathname = Path.join(process.env.context, to.path)
    url.hash = '/z'

    location.href = url.href
    return
  }

  /* default */
  next()
}

/** Make routes */
let pages = loadPages()
let options = makeOptions(pages)

options.routes.forEach(Layout.convert)
options.routes.push({
  path: '/error',
  name: 'error',
  props: true, // https://router.vuejs.org/guide/essentials/passing-props.html#passing-props-to-route-components
  component: require('@/layouts/error').default
})

/** Create VueRouter for exporting */
function makeRouter () {
  Vue.use(Router)
  let router = new Router(options)

  router.beforeEach(_404)

  return router
}

export default makeRouter()

// export default PageRouter.install(Vue, pages)
// export { pages }

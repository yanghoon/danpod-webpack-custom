// https://nuxtjs.org/guide/directory-structure#the-nuxt-config-js-file
// https://ko.nuxtjs.org/api/configuration-env/
module.exports = {
  env: {
    layout: process.env.LAYOUT || 'default2',
    routerMode: process.env.ROUTER_MODE || 'hash',
    context: process.env.URL_CONTEXT || ''
  }
}

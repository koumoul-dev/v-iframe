(function (_window) {
  if (!_window || !_window.history || !_window.parent || !_window.parent.postMessage || _window.parent === _window.self) {
    return
  }
  function log () {
    var debug = _window.localStorage && (window.localStorage.debug || window.localStorage.DEBUG)
    if (debug && debug.indexOf('v-iframe') !== -1) {
      console.log.apply(console, arguments)
    }
  }

  log('v-iframe/content-window register with parent window')
  _window.parent.postMessage({ viframe: true, contentWindow: true }, '*')

  // monkey patch pushState and replaceState to send all state change info to the parent _window
  // used by v-iframe sync-state option to sync iframe state with parent URL params
  var oldReplaceState = _window.history.replaceState
  _window.history.pushState = function pushState() {
    // do a replace instead of a push, the push will be done in the parent _window if sync-state is activated
    var ret = oldReplaceState.apply(this, arguments)
    _window.parent.postMessage({ viframe: true, stateAction: 'push', href: _window.location.href }, '*')
    return ret
  }
  _window.history.replaceState = function replaceState() {
    var ret = oldReplaceState.apply(this, arguments)
    _window.parent.postMessage({ viframe: true, stateAction: 'replace', href: _window.location.href }, '*')
    return ret
  }
  _window.addEventListener('message', function onMessage(e) {
    var vIframeOptions = _window.vIframeOptions || {}
    if (e.source === _window.parent && typeof e.data === 'object' && (e.data.viframe || e.data.vIframe || e.data['v-iframe'])) {
      if (e.data.href && e.data.stateAction) {
        log('v-iframe/content-window received instruction to navigate', e.data.href)
        var router = vIframeOptions.router
        // nuxt 2 way of reading router
        if (!router) router = _window.$nuxt && _window.$nuxt.$router
        // nuxt 3 way of reading router
        if (!router) {
          try {
            router = __unctx__.get('nuxt-app').use().$router
          } catch(err) {
            log('failed to access router un nuxt 3 mode', err)
          }
        }

        var url = new URL(e.data.href)
        var useRouter = _window.location.origin === url.origin && (_window.location.pathname !== url.pathname || vIframeOptions.reactiveParams)
        var useReactiveParams = _window.location.origin === url.origin && _window.location.pathname === url.pathname && typeof vIframeOptions.reactiveParams === 'object'

        if (router && useRouter) {
          var query = {}
          url.searchParams.forEach((value, key) => {
            query[key] = value
          })
          var path = url.pathname.replace(router.options.base, '/').replace('//', '/')
          const routerParams = { path: path, query: query }
          log('v-iframe/content-window navigate using vue router', JSON.stringify(routerParams))
          router.replace(routerParams)
        } else if (useReactiveParams) {
          log('v-iframe/content-window navigate using reactive search params probably provided by useUrlSearchParams')
          var existingKeys = Object.keys(vIframeOptions.reactiveParams)
          url.searchParams.forEach((value, key) => {
            vIframeOptions.reactiveParams[key] = value
            existingKeys.splice(existingKeys.indexOf(key), 1)
          })
          existingKeys.forEach(key => {
            delete vIframeOptions.reactiveParams[key]
          })
        } else {
          log('v-iframe/content-window navigate by overwriting location.href')
          _window.location.href = e.data.href
        }
      }
    }
  })
})(typeof window !== 'undefined' && window)

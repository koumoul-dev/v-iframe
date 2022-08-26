(function (_window) {
  if (!_window || !_window.history || !_window.parent || !_window.parent.postMessage || _window.parent === _window.self) {
    return
  }
  function log () {
    if (!_window.localStorage || !window.localStorage.debug || window.localStorage.debug.indexOf('v-iframe') === -1) {
      return
    }
    console.log.apply(console, arguments)
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
    if (typeof e.data === 'object' && (e.data.viframe || e.data.vIframe || e.data['v-iframe'])) {
      if (e.data.href && e.data.stateAction) {
        log('v-iframe/content-window received instruction to navigate', e.data.href)
        var router = (_window.vIframeOptions && _window.vIframeOptions.router) || (_window.$nuxt && _window.$nuxt.$router)
        if (router) {
          var url = new URL(e.data.href)
          var query = {}
          var keys = url.searchParams.keys()
          for (var i = 0; i < keys.length; i++) {
            query[keys[i]] = url.searchParams.get(keys[i])
          }
          var path = url.pathname.replace(router.options.base, '/')
          const routerParams = { path: path, query: query }
          log('v-iframe/content-window navigate using vue router', routerParams)
          router.replace(routerParams)
        } else {
          log('v-iframe/content-window navigate by overwriting location.href')
          _window.location.href = e.data.href
        }
      }
    }
  })
})(typeof window !== 'undefined' && window)

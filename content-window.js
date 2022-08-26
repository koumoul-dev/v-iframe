(function (_window) {
  if (!_window.history || !_window.parent || !_window.parent.postMessage || _window.parent === _window.self) {
    return
  }

  _window.parent.postMessage({ viframe: true, content_window: true }, '*')

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
        var router = (_window.vIframeOptions && _window.vIframeOptions.router) || (_window.$nuxt && _window.$nuxt.$router)
        if (router) {
          var url = new URL(e.data.href)
          var params = {}
          var paramsKeys = url.searchParams.keys()
          for (var i = 0; i < paramsKeys.length; i++) {
            params[paramsKeys[i]] = url.searchParams.get(paramsKeys[i])
          }
          var path = url.pathname.replace(router.options.base, '/')
          router.replace({ path: path, params: params })
        } else {
          _window.location.href = e.data.href
        }
      }
    }
  })
})(window)

(function () {
  if (!window.history || !window.parent || !window.parent.postMessage || window.parent === window.self) {
    return
  }

  // monkey patch pushState and replaceState to send all state change info to the parent window
  // used by v-iframe sync-state option to sync iframe state with parent URL params
  var oldReplaceState = window.history.replaceState
  window.history.pushState = function pushState() {
    // do a replace instead of a push, the push will be done in the parent window if sync-state is activated
    var ret = oldReplaceState.apply(this, arguments)
    window.parent.postMessage({ viframe: true, stateAction: 'push', href: window.location.href }, '*')
    return ret
  }
  window.history.replaceState = function replaceState() {
    var ret = oldReplaceState.apply(this, arguments)
    window.parent.postMessage({ viframe: true, stateAction: 'replace', href: window.location.href }, '*')
    return ret
  }
  window.addEventListener('message', function onMessage(e) {
    if (typeof e.data === 'object' && (e.data.viframe || e.data.vIframe || e.data['v-iframe'])) {
      if (e.data.href && e.data.stateAction) {
        var router = window.vIframeOptions && this.window.vIframeOptions.router
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
          this.window.location.href = e.data.href
        }
      }
    }
  })
})()

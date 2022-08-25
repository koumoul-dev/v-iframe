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
})()

(function () {
  if (!window.history || !window.parent || !window.parent.postMessage || window.parent === window.self) {
    return
  }

  // monkey patch pushState and replaceState to send all state change info to the parent window
  // used by v-iframe sync-state option to sync iframe state with parent URL params
  var oldPushState = window.history.pushState
  var oldReplaceState = window.history.replaceState
  window.history.pushState = function pushState() {
    var ret = oldPushState.apply(this, arguments)
    window.parent.postMessage({ viframe: true, stateAction: 'push', href: window.location.href }, '*')
    return ret
  }
  window.history.replaceState = function replaceState() {
    var ret = oldReplaceState.apply(this, arguments)
    window.parent.postMessage({ viframe: true, stateAction: 'replace', href: window.location.href }, '*')
    return ret
  }
  window.addEventListener('popstate', function (e) {
    window.parent.postMessage({ viframe: true, stateAction: 'pop', href: window.location.href }, '*')
  })
})()

/**
 * This is a minor modified version of the original lan.js
 * This removes the intervals for checking on the Local API as these are never called to stop.
 */

;(function() {
  window.lovense = window.Lovense = window.lovense || window.Lovense || {}
  var lovense = window.lovense

  var isLocalConnect = false
  var localConnectPort = 30010
  var isQrcodeConnect = false
  var toyMap = {}

  var mobileData = null
  var serverCommandCallback = null

  var isMobile = !!navigator.userAgent.match(/AppleWebKit.*Mobile.*/)
  var isIos = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
  var isAndroid =
    navigator.userAgent.indexOf('Android') > -1 ||
    navigator.userAgent.indexOf('Adr') > -1

  var callRemoteTimer = null
  var callConnectTimer = null

  var formatParams = function(data) {
    var arr = []
    for (var name in data) {
      arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]))
    }
    arr.push(('vrandom=' + Math.random()).replace('.', ''))
    return arr.join('&')
  }
  var ajax = function(options) {
    options = options || {}
    options.type = (options.type || 'GET').toUpperCase()
    options.dataType = options.dataType || 'form'
    options.timeout = options.timeout || 10000 //超时处理，默认10s
    var params
    if (options.dataType === 'form') {
      params = formatParams(options.data)
    } else {
      params = JSON.stringify(options.data)
    }

    var xhr
    var xmlHttp_timeout = null
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest()
    } else {
      xhr = window.ActiveXObject('Microsoft.XMLHTTP')
    }

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        clearTimeout(xmlHttp_timeout)
        var status = xhr.status
        if (status >= 200 && status < 300) {
          options.success && options.success(xhr.responseText, xhr.responseXML)
        } else {
          options.error && options.error(status)
        }
      }
    }

    if (options.type == 'GET') {
      xhr.open('GET', options.url + '?' + params, true)
      xhr.send(null)
    } else if (options.type == 'POST') {
      xhr.open('POST', options.url, true)
      if (options.dataType === 'form') {
        xhr.setRequestHeader(
          'Content-Type',
          'application/x-www-form-urlencoded'
        )
      } else {
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
      }
      xhr.send(params)
    }
    xmlHttp_timeout = setTimeout(function() {
      xhr.abort()
      //options.error&&options.error(504);
    }, options.timeout)
  }

  // function checkLocalConnect() {
  //   ajax({
  //     url: `https://127-0-0-1.lovense.club:${localConnectPort}/command`,
  //     data: {
  //       command: 'GetToys',
  //     },
  //     type: 'POST',
  //     dataType: 'json',
  //     success: function(response) {
  //       var data = response
  //       if (typeof response === 'string') {
  //         data = JSON.parse(response)
  //       }
  //       if (data.data && data.data.toys) {
  //         toyMap = JSON.parse(data.data.toys)
  //         isLocalConnect = true
  //       }
  //     },
  //     error: function(status) {
  //       isLocalConnect = false
  //       if (localConnectPort < 30015) {
  //         localConnectPort++
  //       } else {
  //         localConnectPort = 30010
  //       }
  //     },
  //   })
  // }

  // var checkLocalConnectInterval = setInterval(checkLocalConnect, 3 * 1000)
  // checkLocalConnect()

  // function checkQrcodeConnect() {
  //   if (!mobileData || !mobileData.domain || !mobileData.httpsPort) {
  //     isQrcodeConnect = false
  //   } else {
  //     if (isLocalConnect) return
  //     ajax({
  //       url:
  //         'https://' +
  //         mobileData.domain +
  //         ':' +
  //         mobileData.httpsPort +
  //         '/command',
  //       data: {
  //         command: 'GetToys',
  //       },
  //       type: 'POST',
  //       dataType: 'json',
  //       success: function(response) {
  //         var data = response
  //         if (typeof response === 'string') {
  //           data = JSON.parse(response)
  //         }
  //         if (data.data && data.data.toys) {
  //           toyMap = JSON.parse(data.data.toys)
  //           isQrcodeConnect = true
  //         }
  //       },
  //       error: function(status) {
  //         isQrcodeConnect = false
  //       },
  //     })
  //   }
  // }

  // var checkQrcodeConnectInterval = setInterval(checkQrcodeConnect, 3 * 1000)
  // checkQrcodeConnect()

  function callRemoteSuccess() {
    if (document.hidden) {
      clearTimeout(callRemoteTimer)
      callRemoteTimer = null
    }
    document.removeEventListener('visibilitychange', callRemoteSuccess)
  }

  function callRemoteFail() {
    document.removeEventListener('visibilitychange', callRemoteSuccess)
    if (isAndroid) {
      window.location.href =
        'https://play.google.com/store/apps/details?id=com.lovense.wear'
    } else if (isIos) {
      window.location.href = 'itms-apps://itunes.apple.com/app/id1027312824'
    }
  }

  function callConnectSuccess() {
    if (document.hidden) {
      clearTimeout(callConnectTimer)
      callConnectTimer = null
    }
    document.removeEventListener('visibilitychange', callConnectSuccess)
  }

  function callConnectFail() {
    document.removeEventListener('visibilitychange', callConnectSuccess)
    if (isAndroid) {
      window.location.href = 'market://details?id=com.lovense.connect'
    } else if (isIos) {
      window.location.href =
        'itms-apps://itunes.apple.com/app/lovense-connect/id1273067916?mt=8'
    }
  }

  lovense.setConnectCallbackData = function(mobileCallbackData) {
    mobileData = mobileCallbackData
    if (mobileCallbackData && mobileCallbackData.toys) {
      toyMap = mobileCallbackData.toys
    }

    isQrcodeConnect = true;
  }

  lovense.setServerCommandListener = function(callback) {
    serverCommandCallback = callback
  }
  lovense.getToys = function() {
    return Object.values(toyMap)
  }
  lovense.getOnlineToys = function() {
    return Object.values(toyMap).filter(item => item.status)
  }

  lovense.isToyOnline = function() {
    return lovense.getOnlineToys().length > 0
  }

  lovense.sendVibration = function(toyId, power, duration) {
    duration = duration || 0;
    power = power || 0;

    var params = {
      sec: duration,
      v: power,
    }
    if (toyId) {
      params.t = toyId
    }

    ajax({
      url: `https://${mobileData.domain}:${mobileData.httpsPort}/AVibrate`,
      data: params,
      type: 'GET',
      dataType: 'form',
      success: function(response) {

      },
      error: function(status) {

      },
    });
  }

  lovense.sendCommand = function(data) {
    if (lovense.isToyOnline()) {
      if (isLocalConnect || isQrcodeConnect) {
        // if (typeof data === 'object' && !data.toy) {
        //   data.toy = Object.values(toyMap)[0].id
        // }
        if (isLocalConnect) {
          ajax({
            url: `https://127-0-0-1.lovense.club:${localConnectPort}/command`,
            data: data,
            type: 'POST',
            dataType: 'json',
            success: function(response, xml) {
              // isLocalConnect = true
            },
            error: function(status) {
              // isLocalConnect = false
            },
          })
        }
        if (isQrcodeConnect) {
          ajax({
            url:
              'https://' +
              mobileData.domain +
              ':' +
              mobileData.httpsPort +
              '/command',
            data: data,
            type: 'POST',
            dataType: 'json',
            success: function(response, xml) {
              // isQrcodeConnect = true
            },
            error: function(status) {
              // isQrcodeConnect = false
            },
          })
        }
      } else {
        if (serverCommandCallback) {
          serverCommandCallback(data)
        }
      }
    }
  }

  lovense.openMobileConnect = function() {
    var baseUrl = null
    var callbackUrl = `callBackUrl=${location.href}`
    if (isIos) {
      baseUrl = `https://lovense.club/connect/camapi/camApiTurnAPPSrote.html?${callbackUrl}`
    }
    if (isAndroid) {
      baseUrl = `lvsconnect://scan.lovense.com?camapi=v2&${callbackUrl}`
    }
    if (!isMobile || !baseUrl) {
      console.warn('invalid call')
      return 'invalid call'
    }

    clearTimeout(callConnectTimer)
    if (isAndroid) {
      callConnectTimer = setTimeout(callConnectFail, 3000)
    } else if (isIos) {
      callConnectTimer = setTimeout(callConnectFail, 6000)
    }
    document.addEventListener('visibilitychange', callConnectSuccess)
    setTimeout(() => {
      top.location.href = baseUrl
    }, 500)
    return true
  }

  lovense.openMobileRemote = function() {
    var baseUrl = null
    var callbackUrl = `callBackUrl=${location.href}`
    if (isIos) {
      baseUrl = `https://lovense.club/remote/camapi/displayPanel.html?${callbackUrl}`
    }
    if (isAndroid) {
      baseUrl = `wear://remote/date?${callbackUrl}`
    }
    if (!isMobile || !baseUrl) {
      console.warn('invalid call')
      return 'invalid call'
    }

    clearTimeout(callRemoteTimer)
    if (isAndroid) {
      callRemoteTimer = setTimeout(callRemoteFail, 3000)
    } else if (isIos) {
      callRemoteTimer = setTimeout(callRemoteFail, 6000)
    }
    document.addEventListener('visibilitychange', callRemoteSuccess)
    setTimeout(() => {
      top.location.href = baseUrl
    }, 500)
    return true
  }
})()
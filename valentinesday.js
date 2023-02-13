$(function () {
  var connection = null;
  var isHost = false;

  $('#valentines-host').on('click', function () {
    connection = new SimplePeer({ initiator: true, trickle: false });

    setupPeer();
    $('#valentines-host-client').hide();
    $('#valentines-connect-container').show();
    $('#valentines-host-instructions').show();

    isHost = true;
  });

  $('#valentines-client').on('click', function () {
    connection = new SimplePeer({ initiator: false, trickle: false });

    setupPeer();
    $('#valentines-host-client').hide();
    $('#valentines-connect-container').show();
    $('#valentines-client-instructions').show();

    isHost = false;
  });

  $('#valentines-copyconnectcode').on('click', function () {
    var content = $('#valentines-yourconnectcode').val();

    navigator.clipboard.writeText(content)
      .then(function () {
        $('#valentines-copyconnectcode').text('Copied!');
        setTimeout(function () {
          $('#valentines-copyconnectcode').text('Copy');
        }, 1000);
      })
      .catch(function (err) {
        $('#valentines-copyconnectcode').text('Error ;-;');
      });
  });

  function setupPeer() {
    connection.on('signal', function (data) {
      $('#valentines-yourconnectcode').val(btoa(JSON.stringify(data)));
    });

    connection.on('connect', function () {
      console.log('Valentines - CONNECTED');
      $(
        '#valentines-connect-container, ' +
        '#valentines-host-instructions, ' +
        '#valentines-client-instructions'
      ).hide();
      $('#valentines-main').show();

      // --------------------------------------------

      var toys = lovense.getToys();
      var enabledToysFull = [];
      for (var i = 0; i < toys.length; i++) {
        if (enabledToys.indexOf(toys[i].id.toLowerCase()) === -1) { continue; }

        enabledToysFull.push({
          name: upperCaseFirst(toys[i].name),
          id: toys[i].id
        });
      }

      connection.send(JSON.stringify({
        type: 'toys',
        toys: enabledToysFull
      }));

      $(".message-input").trigger('input');
    });

    connection.on('data', function (data) {
      console.log('Valentines - DATA', data);

      processMessage(data);
    });

    $('#valentines-submitpeercode').on('click', function () {
      connection.signal(JSON.parse(atob($('#valentines-peercode').val())));
    });
  }

  // ========================================================================================

  var $messages = $('.messages-content'),
    d, h, m,
    i = 0;

  function updateScrollbar() {
    // scroll to bottom
    $messages.scrollTop($messages.prop("scrollHeight"));
  }

  function setDate() {
    d = new Date()
    if (m != d.getMinutes()) {
      m = d.getMinutes();
      m = m < 10 ? '0' + m : m;
      $('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
    }
  }

  function insertMessage() {
    msg = $('.message-input').val();
    if ($.trim(msg) == '') {
      return false;
    }
    $('<div class="message message-personal"></div>')
      .text(msg)
      .appendTo($messages)
      .addClass('new');

    setDate();
    $('.message-input').val(null);
    updateScrollbar();

    if (connection) {
      connection.send(JSON.stringify({
        type: 'message',
        message: msg
      }));

      // reset box height
      $(".message-input").trigger('input');
    }
  }

  $('.message-submit').click(function () {
    insertMessage();
  });

  $(".message-input").each(function () {
    this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
  })
  .on("input", function () {
    this.style.height = 0;
    this.style.height = (this.scrollHeight) + "px";
  })
  .trigger('input');

  $(window).on('keydown', function (e) {
    if (e.which == 13) {
      insertMessage();
      return false;
    } 
    else {
      sendTyping();
    }
  })

  function sendTyping() {
    if (connection) {
      connection.send(JSON.stringify({
        type: 'typing',
      }));
    }
  }

  function otherMessage(value) {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    $('.message.loading').remove();
    $('<div class="message new"></div>')
      .text(value)
      .prepend('<figure class="avatar"><img src="https://freesvg.org/img/abstract-user-flat-4.png" /></figure>')
      .appendTo($messages)
      .addClass('new');

    setDate();
    updateScrollbar();
  }

  var typingTimeout = null;
  function processMessage(data) {
    try {
      var json = JSON.parse(data.toString());
      switch (json.type) {
        case 'message':
          otherMessage(json.message);
          break;

        case 'toys':
          var toys = json.toys.map(function (toy) {
            return toy.name;
          });

          if (toys.length > 0) {
            $('#valentines-main h2').text(
              'Toys: ' + toys.join(', ')
            );
          }
          else {
            $('#valentines-main h2').text(
              'Toys: No Toys connected ;-;' 
            );
          }
          break;

        case 'typing':
          // Show typing for 2 seconds
          // This timer is reset every time a typing message is received
          if (typingTimeout) { clearTimeout(typingTimeout); }

          typingTimeout = setTimeout(function () {
            $('.message.loading').remove();
          }, 2000);

          if ($('.message.loading').length > 0) { return; }

          $('<div class="message loading new"><figure class="avatar"><img src="https://freesvg.org/img/abstract-user-flat-4.png" /></figure><span></span></div>').appendTo($messages);
          updateScrollbar();
          break;


        case 'vibrate':
          if (json.id) {
            lovense.sendVibration(json.id, json.power, 1);
          }
          else {
            var toys = lovense.getToys();
            for (var i = 0; i < toys.length; i++) {
              if (enabledToys.indexOf(toys[i].id.toLowerCase()) === -1) { continue; }
              
              lovense.sendVibration(toys[i].id, json.power, 1);
            }
          }
          break;

        case 'vibrate-pattern':
          var toys = lovense.getToys();
          for (var i = 0; i < toys.length; i++) {
            if (enabledToys.indexOf(toys[i].id.toLowerCase()) === -1) { continue; }

            lovense.sendCommand({
              command: 'Pattern',
              
              rule: 'V1;F:v,r,p,t,f,s;S:100#',
              strength: json.pattern.join(';'),
              timeSec: (json.pattern.length * 2),
              
              toy: toys[i].id,
              apiVer: 2,
            })
          }
      }
    }
    catch (e) {
      console.error('Valentines - DATA - ERROR', data, e);
    }
  }

  // ========================================================================================

  $('#valentines-vibrate-all').on('click', function () {
    if (connection) {
      connection.send(JSON.stringify({
        type: 'vibrate',
        power: 5
      }));
    }
  });

  $('#valentines-vibrate-pattern-lastmessages').on('click', function () {
    var lastMessage = $('.message-personal').last().text();
    // convert lastMessage to a 1-20 number pattern based upon the characters used
    var pattern = [];
    for (var i = 0; i < lastMessage.length; i++) {
      var char = lastMessage[i];
      var code = char.charCodeAt(0);
      var num = (code % 20) + 1;
      pattern.push(num);
    }

    if (connection) {
      connection.send(JSON.stringify({
        type: 'vibrate-pattern',
        pattern: pattern
      }));
    }
  });
})
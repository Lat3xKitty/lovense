var activeGame = 'setup';
var enabledToys = localStorage.getItem('enabledToys') ? JSON.parse(localStorage.getItem('enabledToys')) : [];


$(function() {

  // Hack around the Lovense API not supporting the Connect App's cheat.
  $.ajax({
    type: "GET",
    url: "https://api.lovense.com/api/lan/getToys",
    dataType: "JSON",
    success: function (response) {
      $('#setup-loading').remove();

      var keys = Object.keys(response)
      if (keys.length === 0) {
        enabledToys = [];
        $('#setup').append(
          '<div class="alert alert-danger" role="alert">' +
            '<strong>Error!</strong> No toys found.' +
          '</div>' +

          '<p>' +
            'We use the Lovense Connect App to connect to your toys. ' +
            'Please install the app and try again.' +
          '</p>' +

          '<p>' +
            'If you are still seeing the "No toys found", please verify that you can see all the toys at '+
            '<a href="https://api.lovense.com/api/lan/getToys">GetToys Endpoint</a>'+
          '</p>' +

          '<em>' +
            'This does function without the app, but you will not be able to ' +
            'TRULY Experience the game.' +
          '</em>'
        );
      }
      else {
        lovense.setConnectCallbackData(response[keys[0]]);

        var toys = lovense.getToys();

        for (var i = 0; i < toys.length; i++) {
          var enabled = enabledToys.indexOf(toys[i].id) !== -1;

          if (enabled && toys[i].status == 0) {
            enabledToys.splice(enabledToys.indexOf(toys[i].id), 1);
            enabled = false;

            localStorage.setItem('enabledToys', JSON.stringify(enabledToys));
          }
          else if (enabled && toys[i].status == 1) {
            lovense.sendVibration(toys[i].id, 3, 1);
          }

          $('#setup').append(
            '<div class="alert alert-info" role="alert">' +

              '<div class="row">' +
                '<div class="col-md-6">' +
                  '<strong>Toy:</strong> ' + upperCaseFirst(toys[i].name) +
                '</div>' +
                '<div class="col-md-6">' +
                  '<strong>ID:</strong> ' + toys[i].id +
                '</div>' +
                '<div class="col-md-6">' +
                  '<strong>Battery:</strong> ' + toys[i].battery +
                '</div>' +
                '<div class="col-md-6">' +
                  '<strong>Status:</strong> ' + (toys[i].status ? 'Connected' : 'Disconnected') +
                '</div>' +
              '</div>' +

              // Toggle toy button
              '<div class="btn-group-toggle" data-toggle="buttons">' +
              '  <label class="btn btn-' + (enabled ? 'success' : 'secondary') + ' active toggle-toy">' +
              '    <input type="checkbox" ' +
                  (toys[i].status == 0 ? 'disabled ' : '') +
                  (enabled ? 'checked ' : '') +
                  'autocomplete="off"> <span>' +
                    (enabled ? 'Enabled' : 'Inactive') +
                  '</span>' +
              '  </label>' +
              '</div>' +

            '</div>'
          );

          $('#setup').find('.alert-info').last()
            .data("id", toys[i].id)
            .data('index', i);
        }
      }

      $('.toggle-toy input')
        .off('change')
        .on('change', function() {
          var $this = $(this);
          var id = $this.closest('.alert-info').data("id");
          var index = $this.closest('.alert-info').data('index');

          if ($this.prop('checked')) {
            enabledToys.push(id);
            $this.closest('.btn').removeClass('btn-secondary').addClass('btn-success');
          }
          else {
            enabledToys.splice(enabledToys.indexOf(id), 1);
            $this.closest('.btn').removeClass('btn-success').addClass('btn-secondary');
          }

          localStorage.setItem('enabledToys', JSON.stringify(enabledToys));

          $this.closest('.btn')
            .find('span')
            .text($this.prop('checked') ? 'Enabled' : 'Inactive')

          if ($this.prop('checked')) {
            lovense.sendVibration(toys[index].id, 3, 1);
          }
        });
    },
    error: function (response) {
      enabledToys = [];
      $('#setup').append(
        '<div class="alert alert-danger" role="alert">' +
          '<strong>Error!</strong> Unable to Access "GetToys" function from Lovense.' +
        '</div>' +

        '<p>' +
          'We use the Lovense Connect App to connect to your toys. ' +
          'Please install the app and try again.' +
        '</p>' +

        '<p>' +
          'This does function without the app, but you will not be able to ' +
          'TRUELY Experience the game.' +
        '</p>'
      );
    }
  });


});



var triggerTabList = [].slice.call(document.querySelectorAll('#myTab a'))
triggerTabList.forEach(function (triggerEl) {
  var tabTrigger = new bootstrap.Tab(triggerEl)

  triggerEl.addEventListener('click', function (event) {
    event.preventDefault()
    tabTrigger.show()
  })
})

const upperCaseFirst = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}



var currentTab = '#setup'; 

$(function() {
  // bootstrap 5 tab change event
  $('#tab-nav').on('shown.bs.tab', function (e) {
    currentTab = $(e.target).attr('data-bs-target'); // activated tab
    console.log(currentTab);
  });
})
$.ajax({
  url: '/check', 
  type: 'GET', 
  success: function(res) {
    if(res.user.role === 'admin'){
      $('#addEmployee').show();
      $('.deleteEmployee').show(); 
    }
  },
  error: function(xhr, status, error) {
    console.error('AJAX error:', error);
  }
})

angular.module('reg')
  .factory('UserService', [
    '$http',
    'Session',
    function($http, Session){

      var users = '/api/users';
      var base = users + '/';

      function http_header_safe_json(v) {

      var charsToEncode = /[\u007f-\uffff]/g;

        return JSON.stringify(v).replace(charsToEncode,
          function(c) { 
            return '\\u'+('000'+c.charCodeAt(0).toString(16)).slice(-4);
          }
        );
      }

    return {

      // ----------------------
      // Basic Actions
      // ----------------------
      getCurrentUser: function(){
        return $http.get(base + Session.getUserId());
      },

      get: function(id){
        return $http.get(base + id);
      },

      getAll: function(){
        return $http.get(base);
      },

      getPage: function(page, size, text){
        return $http.get(users + '?' + $.param(
          {
            text: text,
            page: page ? page : 0,
            size: size ? size : 50
          })
        );
      },

      updateProfile: function(id, profile){
        return $http.put(base + id + '/profile', {
          profile: profile
        });
      },

      updateResume: function(id, file){
        var ext = file.name.split(".")[file.name.split(".").length - 1];
        $http({
          method: 'POST',
          url: 'https://content.dropboxapi.com/2/files/upload',
          data: file,
          headers : {
            'Authorization' : 'Bearer GcJZXNHpbw0AAAAAAAAAoD9X79D064kMnSNJxafRo769M-bgcAoq_Fe6yYc7SM6p',
            'Content-Type' : 'application/octet-stream',
            'Dropbox-Api-Arg' : http_header_safe_json({
              'path' : '/' + id + "." + ext,
              'mode' : 'overwrite',
              'autorename' : true,
              'mute' : false
            })
          }
        }).success(function(data, status, headers, config) {
          console.log(data);
          console.log('file uploaded successfully');
        }).error(function(data, status, headers, config) {
          console.log('error : ' + data);
        });
      },

      updateConfirmation: function(id, confirmation){
        return $http.put(base + id + '/confirm', {
          confirmation: confirmation
        });
      },

      declineAdmission: function(id){
        return $http.post(base + id + '/decline');
      },

      // ------------------------
      // Team
      // ------------------------
      joinOrCreateTeam: function(code){
        return $http.put(base + Session.getUserId() + '/team', {
          code: code
        });
      },

      leaveTeam: function(){
        return $http.delete(base + Session.getUserId() + '/team');
      },

      getMyTeammates: function(){
        return $http.get(base + Session.getUserId() + '/team');
      },

      // -------------------------
      // Admin Only
      // -------------------------

      getStats: function(){
        return $http.get(base + 'stats');
      },

      admitUser: function(id){
        return $http.post(base + id + '/admit');
      },

      checkIn: function(id){
        return $http.post(base + id + '/checkin');
      },

      checkOut: function(id){
        return $http.post(base + id + '/checkout');
      },

    };
  }
  ]);

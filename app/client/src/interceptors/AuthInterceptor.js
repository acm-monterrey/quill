angular.module('reg')
  .factory('AuthInterceptor', [
    'Session',
    function(Session){
      return {
          request: function(config){
            var token = Session.getToken();
            if (token && config.url.search("dropbox") == -1){
              config.headers['x-access-token'] = token;
            }
            return config;
          }
        };
    }]);

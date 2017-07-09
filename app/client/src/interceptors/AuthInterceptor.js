angular.module('reg')
  .factory('AuthInterceptor', [
    'Session',
    function(Session){
      debugger;
      return {
          request: function(config){
            var token = Session.getToken();
            if (token){
              //config.headers['x-access-token'] = token;
            }
            return config;
          }
        };
    }]);

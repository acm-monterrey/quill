angular.module('reg')
  .controller('TeamCtrl', [
    '$scope',
    'currentUser',
    'settings',
    'Utils',
    'UserService',
    'TEAM',
    function($scope, currentUser, settings, Utils, UserService, TEAM){
      // Get the current user's most recent data.
      var Settings = settings.data;

      $scope.regIsOpen = Utils.isRegOpen(Settings);

      $scope.user = currentUser.data;

      $scope.TEAM = TEAM;

      function _populateTeammates() {
        UserService
          .getMyTeammates()
          .success(function(data){
            $scope.error = null;
            $scope.teammates = data.teammates;
          });
      }

      if ($scope.user.teamCode){
        _populateTeammates();
      }

      $scope.joinTeam = function(){
        if($scope.code && $scope.code != ''){
          UserService
            .joinOrCreateTeam($scope.code)
            .success(function(user){
              $scope.error = null;
              $scope.user = user;
              _populateTeammates();
            })
            .error(function(res){
              $scope.error = res.message;
            });
        } else {
          $scope.error = "Please enter a team name"
        }
      };

      $scope.leaveTeam = function(){
        UserService
          .leaveTeam()
          .success(function(user){
            $scope.error = null;
            $scope.user = user;
            $scope.teammates = [];
          })
          .error(function(res){
            $scope.error = res.data.message;
          });
      };

    }]);

angular.module('reg')
  .controller('AdminStatsCtrl',[
    '$scope',
    'UserService',
    function($scope, UserService){

      UserService
        .getStats()
        .success(function(stats){
          $scope.stats = stats;

          var today = new Date();
          var year = today.getFullYear();

          $scope.stats.years = [];
          for (var index = 0; index <= 5; index++) {
            var obj = {
              amount: $scope.stats.demo.year[year + index],
              year: year + index,
            }
            $scope.stats.years.push(obj);
          }
          $scope.loading = false;
        });

      $scope.fromNow = function(date){
        return moment(date).fromNow();
      };

    }]);
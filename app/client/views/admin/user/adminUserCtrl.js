angular.module('reg')
  .controller('AdminUserCtrl',[
    '$scope',
    '$http',
    'user',
    'UserService',
    function($scope, $http, User, UserService){
      $scope.selectedUser = User.data;

      // Populate the school dropdown
      populateSchools();

      /**
       * TODO: JANK WARNING
       */
      function populateSchools(){

        $http
          .get('/assets/schools.json')
          .then(function(res){
            var schools = res.data;
            var email = $scope.selectedUser.email.split('@')[1];

            if (schools[email]){
              $scope.selectedUser.profile.school = schools[email].school;
              $scope.autoFilledSchool = true;
            }

          });
      }

      $scope.graduationYears = function() {
        var graduationYears = []
        const today = new Date();
        const thisYear = today.getFullYear();
        for (var i = 0; i < 6; i++) {
          graduationYears[i] = thisYear+i;
        }
        return graduationYears;
      }();


      $scope.updateProfile = function(){
        UserService
          .updateProfile($scope.selectedUser._id, $scope.selectedUser.profile)
          .success(function(data){
            $selectedUser = data;
            swal("Updated!", "Profile updated.", "success");
          })
          .error(function(){
            swal("Oops, you forgot something.");
          });
      };
      $scope.updateTable = function() {
        UserService.updateTable($scope.selectedUser.teamCode, $scope.selectedUser.status.tableNumber)
        .success(function(data) {
          swal("Updated!", "Table number updated.", "success");
        })
        .error(function(data) {
          console.log('data :>> ', data);          
          swal("Oops!", data.message, "error");
        })
      }

    }]);
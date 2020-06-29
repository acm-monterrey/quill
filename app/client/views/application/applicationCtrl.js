angular.module('reg')
  .controller('ApplicationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'settings',
    'Session',
    'UserService',
    function($scope, $rootScope, $state, $http, currentUser, Settings, Session, UserService){

      // Set up the user
      $scope.user = currentUser.data;

      // Is the student from MIT?
      $scope.isMitStudent = $scope.user.email.split('@')[1] == 'mit.edu';

      // If so, default them to adult: true
      if ($scope.isMitStudent){
        $scope.user.profile.adult = true;
      }

      // Populate the school dropdown
      populateSchools();
      _setupForm();

      $scope.regIsClosed = Date.now() > Settings.data.timeClose;
      $scope.checkInActive = Settings.data.checkInActive;
      /**
       * TODO: JANK WARNING
       */
      function populateSchools(){

        $http
          .get('/assets/schools.json')
          .then(function(res){
            var schools = res.data;
            var email = $scope.user.email.split('@')[1];

            if (schools[email]){
              $scope.user.profile.school = schools[email].school;
              $scope.autoFilledSchool = true;
            }
          });
      }

      function _updateUser(e){
        var file = angular.element('#resume-file')[0].files[0];

        if(file && file.size > 5000000) {
            sweetAlert("Your file is too big :(");
            return;
        }

        if(file){
          UserService.updateResume(Session.getUserId(), file);
          $scope.user.profile.cv = file.name;
          console.log($scope.user.profile.cv);
        }

        const discordUsername = $scope.user.profile.discordUsername;
        const discriminator = discordUsername.slice(-5);
        const validDiscriminator = discriminator[0] === '#' ;

        for (var i = 1; i<5 && validDiscriminator; i++) {
          if(isNaN(parseInt(discriminator[i]))) {
            validDiscriminator = false;
          }
        }
        console.log('discordUsername.length :>> ', discordUsername.length);
        if(!validDiscriminator || discordUsername.length < 7) {
          sweetAlert("uh oh!", "Your Discord username does not have the correct format, please include your discriminator (#1234)", "error")
          return;
        }
        
        UserService
          .updateProfile(Session.getUserId(), $scope.user.profile)
          .success(function(data){
            sweetAlert({
              title: "Awesome!",
              text: "Your application has been saved.",
              type: "success",
              confirmButtonColor: "#e76482"
            }, function(){
              $state.go('app.dashboard');
            });
          })
          .error(function(res){
            sweetAlert("Uh oh!", "Something went wrong.", "error");
          });
      }

      function _setupForm(){
        // Semantic-UI form validation
        $('.ui.form').form({
          fields: {
            name: {
              identifier: 'name',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your name.'
                }
              ]
            },
            discordUsername: {
              identifier: 'discordUsername',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your Discord username.'
                }
              ]
            },
            school: {
              identifier: 'school',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your school name.'
                }
              ]
            },
            year: {
              identifier: 'year',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your graduation year.'
                }
              ]
            },
            gender: {
              identifier: 'gender',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a gender.'
                }
              ]
            },
            adult: {
              identifier: 'adult',
              rules: [
                {
                  type: 'checked',
                  prompt: 'You must be an adult, or an MIT student.'
                }
              ]
            }
          }
        });
      }

      $scope.graduationYears = []
      const today = new Date();
      const thisYear = today.getFullYear();
      for (var i = 0; i < 6; i++) {
        $scope.graduationYears[i] = thisYear+i;
      }

      $scope.submitForm = function(){
        if ($('.ui.form').form('is valid')){
          _updateUser();
        }
      };

    }]);

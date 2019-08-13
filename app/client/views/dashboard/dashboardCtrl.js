angular.module('reg')
  .controller('DashboardCtrl', [
    '$rootScope',
    '$scope',
    '$sce',
    'currentUser',
    'settings',
    'Utils',
    'AuthService',
    'UserService',
    'EVENT_INFO',
    'DASHBOARD',
    function($rootScope, $scope, $sce, currentUser, settings, Utils, AuthService, UserService,EVENT_INFO, DASHBOARD){
      var Settings = settings.data;
      var user = currentUser.data;
      $scope.user = user;
      $scope.settings = Settings;
      $scope.DASHBOARD = DASHBOARD;
      
      // Show CheckInOpen Window ---------------------------------------
      var showCheckInOpen = false;
      var todayDate = new Date();
      if ( todayDate.getTime() >= Settings.checkInOpen ) {
        showCheckInOpen = true;
        _populateTeammates();
      }
      
      $scope.showCheckInOpen = showCheckInOpen;
      
      for (var msg in $scope.DASHBOARD) {
        if ($scope.DASHBOARD[msg].includes('[APP_DEADLINE]')) {
          $scope.DASHBOARD[msg] = $scope.DASHBOARD[msg].replace('[APP_DEADLINE]', Utils.formatTime(Settings.timeClose));
        }
        if ($scope.DASHBOARD[msg].includes('[CONFIRM_DEADLINE]')) {
          $scope.DASHBOARD[msg] = $scope.DASHBOARD[msg].replace('[CONFIRM_DEADLINE]', Utils.formatTime(user.status.confirmBy));
        }

      }
        
      // Is registration open?
      var regIsOpen = $scope.regIsOpen = Utils.isRegOpen(Settings);

      // Is it past the user's confirmation time?
      var pastConfirmation = $scope.pastConfirmation = Utils.isAfter(user.status.confirmBy);

      $scope.dashState = function(status){
          
        var user = $scope.user;
        switch (status) {
          case 'unverified':
            return !user.verified;
          case 'openAndIncomplete':
            return regIsOpen && user.verified && !user.status.completedProfile;
          case 'openAndSubmitted':
            return regIsOpen && user.status.completedProfile && !user.status.admitted;
          case 'closedAndIncomplete':
            return !regIsOpen && !user.status.completedProfile && !user.status.admitted;
          case 'closedAndSubmitted': // Waitlisted State
            return !regIsOpen && user.status.completedProfile && !user.status.admitted;
          case 'admittedAndCanConfirm':
            return !pastConfirmation &&
              user.status.admitted &&
              !user.status.confirmed &&
              !user.status.declined;
          case 'admittedAndCannotConfirm':
            return pastConfirmation &&
              user.status.admitted &&
              !user.status.confirmed &&
              !user.status.declined;
          case 'confirmed':
            return user.status.admitted && user.status.confirmed && !user.status.declined;
          case 'declined':
            return user.status.declined;
        }
        return false;
      };

      $scope.showWaitlist = !regIsOpen && user.status.completedProfile && !user.status.admitted;

      $scope.resendEmail = function(){
        AuthService
          .resendVerificationEmail()
          .then(function(){
            sweetAlert('Your email has been sent.');
          });
      };


      // -----------------------------------------------------
      // Text!
      // -----------------------------------------------------
      var converter = new showdown.Converter();
      $scope.acceptanceText = $sce.trustAsHtml(converter.makeHtml(Settings.acceptanceText));
      $scope.confirmationText = $sce.trustAsHtml(converter.makeHtml(Settings.confirmationText));
      $scope.waitlistText = $sce.trustAsHtml(converter.makeHtml(Settings.waitlistText));


      $scope.declineAdmission = function(){

        swal({
          title: "Whoa!",
          text: "Are you sure you would like to decline your admission? \n\n You can't go back!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, I can't make it.",
          closeOnConfirm: true
          }, function(){

            UserService
              .declineAdmission(user._id)
              .success(function(user){
                $rootScope.currentUser = user;
                $scope.user = user;
              });
        });
      };
      
      // Ask for location --------------------------------------------------
      $scope.onCheckIn = function () {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              ({ coords }) =>  {
                const { latitude, longitude } = coords;
                UserService
                    .makeCheckIn(latitude, longitude)
                    .success(function (response) {
                        swal('You are checked in');
                        console.log(response);
                    });
              });
        } else {
          alert('Geolocation is not supported by this browser.');
        }
      };

      // Ask for team mates ------------------------------------------------
      function _populateTeammates() {
        UserService
            .getMyTeammates()
            .success(function(users){
              $scope.error = null;
              $scope.teammates = users;
              _askForTable(users);
            });
      }
      
      // Ask for table number ----------------------------------------------
      function _askForTable(users) {
        //if the users haven't been assing a table
        if(!users.assign && users.teammates.length >= Settings.teamSizeAccepted) {

            UserService
                .assingTable()
                .function(function (user) {
                    $scope.user = user;
                });
        }
      }
      
    }]);

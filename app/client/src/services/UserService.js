angular.module("reg").factory("UserService", [
  "$http",
  "Session",
  "API_KEY",
  function ($http, Session, API_KEY) {
    var users = "/api/users";
    var base = users + "/";

    function http_header_safe_json(v) {
      var charsToEncode = /[\u007f-\uffff]/g;

      return JSON.stringify(v).replace(charsToEncode, function (c) {
        return "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4);
      });
    }

    return {
      // ----------------------
      // Basic Actions
      // ----------------------
      getCurrentUser: function () {
        return $http.get(base + Session.getUserId());
      },
      get: function (id) {
        return $http.get(base + id);
      },

      getAll: function () {
        return $http.get(base);
      },

      getPage: function (page, size, text) {
        return $http.get(
          users +
            "?" +
            $.param({
              text: text,
              page: page ? page : 0,
              size: size ? size : 50,
            })
        );
      },

      updateProfile: function (id, profile) {
        return $http.put(base + id + "/profile", {
          profile: profile,
        });
      },

      updateResume: function (id, file) {
        var ext = file.name.split(".")[file.name.split(".").length - 1];

        $http({
          method: "POST",
          url: "https://content.dropboxapi.com/2/files/upload",
          data: file,
          headers: {
            Authorization: "Bearer " + API_KEY,
            "Content-Type": "application/octet-stream",
            "Dropbox-Api-Arg": http_header_safe_json({
              path: "/" + id + "." + ext,
              mode: "overwrite",
              autorename: true,
              mute: false,
            }),
          },
        })
          .success(function (data, status, headers, config) {
            console.log(data);
            console.log("file uploaded successfully");
          })
          .error(function (data, status, headers, config) {
            console.log("error : " + data);
            //     });
            // },

            // getResume: function (id) {
            //   //prettier-ignore
            //   datos = [
            //     'Jorge Javier Blasquez Gonzalez'	,	'64c4b0529e386582fe6d4aa4'

            //   ];
            //   pdf = true;

            //   pathabuscar = pdf ? "/" + datos[1] + ".pdf" : "/" + datos[1] + ".docx";
            //   tipo = pdf ? "application/pdf" : "application/docx";

            //   $http({
            //     method: "POST",
            //     url: "https://content.dropboxapi.com/2/files/download",
            //     responseType: "blob",
            //     headers: {
            //       Authorization: "Bearer " + API_KEY,
            //       "Content-Type": "application/octet-stream",
            //       "Dropbox-Api-Arg": http_header_safe_json({
            //         path: pathabuscar,
            //       }),
            //     },
            //   })
            //     .success(function (data, status, headers, config) {
            //       var blob = new Blob([data], { type: tipo });
            //       var filename = pdf ? datos[0] + ".pdf" : datos[0] + ".docx"; // Change the filename if needed
            //       saveAs(blob, filename);
            //       console.log("file uploaded successfully");
            //     })
            //     .error(function (data, status, headers, config) {
            //       console.log("error : " + data);
          });
      },

      updateConfirmation: function (id, confirmation) {
        return $http.put(base + id + "/confirm", {
          confirmation: confirmation,
        });
      },

      declineAdmission: function (id) {
        return $http.post(base + id + "/decline");
      },

      makeCheckIn: function (latitude, longitude) {
        coordinates = {
          latitude: latitude,
          longitude: longitude,
        };
        return $http.post(base + Session.getUserId() + "/checkin/location ", {
          coordinates: coordinates,
        });
      },

      // ------------------------
      // Team
      // ------------------------
      joinOrCreateTeam: function (code) {
        return $http.put(base + Session.getUserId() + "/team", {
          code: code,
        });
      },

      addToTeam: function (teammate, code) {
        return $http.put(base + Session.getUserId() + "/teammate", {
          code: code,
          email: teammate,
        });
      },

      leaveTeam: function () {
        return $http.delete(base + Session.getUserId() + "/team");
      },

      getMyTeammates: function () {
        return $http.get(base + Session.getUserId() + "/team");
      },

      assingTable: function () {
        return $http.post(base + Session.getUserId() + "/confirmed");
      },

      // -------------------------
      // Admin Only
      // -------------------------

      getStats: function () {
        return $http.get(base + "stats");
      },

      admitUser: function (id) {
        return $http.post(base + id + "/admit");
      },

      checkIn: function (id) {
        return $http.post(base + id + "/checkin");
      },

      checkOut: function (id) {
        return $http.post(base + id + "/checkout");
      },

      updateTable: function (teamCode, tableNumber) {
        return $http.put("/api/teams/" + teamCode + "/table", {
          tableNumber: tableNumber,
        });
      },
    };
  },
]);

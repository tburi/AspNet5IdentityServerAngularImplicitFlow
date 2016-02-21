﻿(function () {
    'use strict';

    function SecurityService($http, $log, $q, $rootScope,  $window, $state, localStorageService) {
        $log.info("SecurityService called");

        $rootScope.IsAuthorized = false;
        $rootScope.HasAdminRole = false;

        function urlBase64Decode(str) {
            var output = str.replace('-', '+').replace('_', '/');
            switch (output.length % 4) {
                case 0:
                    break;
                case 2:
                    output += '==';
                    break;
                case 3:
                    output += '=';
                    break;
                default:
                    throw 'Illegal base64url string!';
            }
            return window.atob(output);
        }

        function getDataFromToken(token) {
            var user = {};
            if (typeof token !== 'undefined') {
                var encoded = token.split('.')[1];
                user = JSON.parse(urlBase64Decode(encoded));
            }
            return user;
        }

        var ResetAuthorizationData = function () {
            localStorageService.set("authorizationData", "");
            localStorageService.set("authorizationDataIdToken", "");
            $rootScope.IsAuthorized = false;
            $rootScope.HasAdminRole = false;
        }

        var SetAuthorizationData = function (token, id_token) {
            
            if (localStorageService.get("authorizationData") !== "") {
                localStorageService.set("authorizationData", "");
            }

            localStorageService.set("authorizationData", token);
            localStorageService.set("authorizationDataIdToken", id_token);
            $rootScope.IsAuthorized = true;

            var data = getDataFromToken(token);
            for (var i = 0; i < data.role.length; i++) {
                if (data.role[i] === "dataEventRecords.admin") {
                    $rootScope.HasAdminRole = true;                    
                }
            }
        }

        var Authorize = function () {
            ResetAuthorizationData();

            console.log("BEGIN Authorize, no auth data");
            if ($window.location.hash) {
                console.log("AuthorizedController created, has hash");
                var hash = window.location.hash.substr(1);

                var result = hash.split('&').reduce(function (result, item) {
                    var parts = item.split('=');
                    result[parts[0]] = parts[1];
                    return result;
                }, {});

                var token = "";
                var id_token = "";
                if (!result.error) {
                    if (result.state !== localStorageService.get("authStateControl")) {
                        console.log("AuthorizedController created. no myautostate");
                    } else {
                        localStorageService.set("authStateControl", "");
                        console.log("AuthorizedController created. returning access token");
                        console.log(result);
                           
                        token = result.access_token;
                        id_token = result.id_token;
                    }
                }

                SetAuthorizationData(token, id_token);
                console.log(localStorageService.get("authorizationData"));

                $state.go("overviewindex");

            }
            else {
                console.log("AuthorizedController time to log on");

              //GET /authorize?
              //response_type=code%20id_token
              //&client_id=s6BhdRkqt3
              //&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcb
              //&scope=openid%20profile%20email
              //&nonce=n-0S6_WzA2Mj
              //&state=af0ifjsldkj HTTP/1.1
              //              Host: server.example.com

                var authorizationUrl = 'https://localhost:44345/connect/authorize';
                var client_id = 'angularclient';
                var redirect_uri = 'https://localhost:44347/authorized';
                var response_type = "id_token token";
                var scope = "dataEventRecords aReallyCoolScope openid";
                var nonce = Date.now() + "" + Math.random();
                var state = Date.now() + "" + Math.random();

                localStorageService.set("authStateControl", state);
                console.log("AuthorizedController created. adding myautostate: " + localStorageService.get("authStateControl"));

                var url =
                    authorizationUrl + "?" +
                    "response_type=" + encodeURI(response_type) + "&" +
                    "client_id=" + encodeURI(client_id) + "&" +
                    "redirect_uri=" + encodeURI(redirect_uri) + "&" +                 
                    "scope=" + encodeURI(scope) + "&" +
                    "nonce=" + encodeURI(nonce) + "&" +
                    "state=" + encodeURI(state);

                $window.location = url;
            }
        }

        // /connect/endsession?id_token_hint=...&post_logout_redirect_uri=https://localhost:44347/unauthorized.html
        var Logoff = function () {
            //var id_token = localStorageService.get("authorizationDataIdToken");     
            //var authorizationUrl = 'https://localhost:44345/connect/endsession';
            //var id_token_hint = id_token;
            //var post_logout_redirect_uri = 'https://localhost:44347/unauthorized.html';
            //var state = Date.now() + "" + Math.random();

            //var url =
            //    authorizationUrl + "?" +
            //    "id_token_hint=" + id_token_hint + "&" +
            //    "post_logout_redirect_uri=" + encodeURI(post_logout_redirect_uri) + "&" +
            //    "state=" + encodeURI(state);

            //ResetAuthorizationData();
            //$window.location = url;

            // 19.02.2106: temp until connect/endsession is implemented in IdentityServer4 NOT A PROPER SOLUTION!
            ResetAuthorizationData();
            $window.location = "https://localhost:44347/unauthorized.html";
        }

		return {
		    ResetAuthorizationData: ResetAuthorizationData,
		    SetAuthorizationData: SetAuthorizationData,
		    Authorize: Authorize,
		    Logoff: Logoff
		}
	}

	var module = angular.module('mainApp');

	module.factory("SecurityService",
		[
			"$http",
			"$log",
            "$q",
            "$rootScope",
            "$window",
            "$state",
            "localStorageService",
			SecurityService
		]
	);

})();

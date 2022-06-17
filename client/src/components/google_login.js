import { url, client_id } from "../constants";
import axios from "axios";
import m from "mithril";
import jwt_decode from "jwt-decode";

import createAuth0Client from "@auth0/auth0-spa-js";
import { decode } from "jsonwebtoken";

//provide global vars for token , decodedToken which is the token object and the google auth client as gClient
var token, gClient, decodedToken;

const google_login = {
  // remove eslint errors on global googlee
  /*global google */

  oncreate() {
    gClient = google.accounts.id.initialize({
      client_id: client_id,
      callback: (response) => {
        token = response.credential;
        decodedToken = jwt_decode(response.credential);
        setStorage();
      },
    });
    //show the right side google loggin prompt all sexy-like
    google.accounts.id.prompt();

    //set stuff to storage
    const setStorage = () => {
      localStorage.setItem("authToken", token);
      localStorage.setItem("name", decodedToken.name);
      localStorage.setItem("imageUrl", decodedToken.picture);
      localStorage.setItem("email", decodedToken.email);
    };

    //with async/await
    // function init() {
    //   window.gapi.load("auth2", async () => {
    //     console.log("this is gapi>>>>>>>>>>>>>>>>>>", window.gapi.auth2);
    //     //all auth stuff needing gapi.auth2
    //     //initialise gapi
    //     window.gapi.auth2.init({
    //       client_id,
    //     });
    //     const isAuthenticated = await window.gapi.auth2
    //       .getAuthInstance()
    //       .currentUser.get()
    //       .getAuthResponse();
    //     if (isAuthenticated) {
    //       console.log("> User is authenticated", { isAuthenticated });
    //       console.log("user>>>>>>>>>>>>>");
    //       return;
    //     }
    //   });
    // }
    // init();
  },
  view() {
    return m(
      "button",
      {
        class: "btn btn-danger btn-lg",
        onclick() {
          // try Oauth
          //   return login();
          function init() {
            window.gapi.load("auth2", function () {
              //all auth stuff needing gapi.auth2

              //initialise gapi
              window.gapi.auth2.init({
                client_id: client_id,
              });
              console.log(
                "this is gapi>>>>>>>>>>>>>>>>>>",
                window.gapi.auth2.getBasicProfile()
              );
              const GoogleAuth = window.gapi.auth2.getAuthInstance();

              const options = {
                // prompt: "consent",
              };

              GoogleAuth.signIn(options).then(
                (googleUser) => {
                  let profile = googleUser.getBasicProfile();
                  localStorage.setItem("authToken", profile.getId());
                  localStorage.setItem("name", profile.getName());
                  localStorage.setItem("imageUrl", profile.getImageUrl());
                  localStorage.setItem("email", profile.getEmail());

                  const userData = {
                    id: profile.getId(),
                    name: profile.getName(),
                    imageUrl: profile.getImageUrl(),
                    email: profile.getEmail(),
                  };

                  // refresh after successfull login
                  const options = {
                    method: "POST",
                    url: url + "/users",
                    headers: {
                      "Content-Type": "application/json",
                      // 'authorization': localStorage.getItem('token')
                    },
                    data: userData,
                  };

                  axios
                    .request(options)
                    .then(function (response) {
                      // alert(JSON.stringify(response.data));
                      localStorage.setItem("token", response.data.token);
                      localStorage.setItem("role", response.data.user.role);
                      location.reload();
                    })
                    .catch(function (error) {
                      console.error(error);
                    });
                },
                (err) => {
                  console.error(err);
                }
              );
            });
          }
          init();
        },
      },
      m("i", { class: "icon-xl fab fa-google" }),
      "Sign In"
    );
  },
};

export default google_login;

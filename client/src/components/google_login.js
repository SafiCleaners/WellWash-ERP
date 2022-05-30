import { url, client_id } from "../constants";
import axios from "axios";
import m from "mithril";

import createAuth0Client from "@auth0/auth0-spa-js";

const google_login = {
  async oncreate() {
    //with async/await

    const auth0 = await createAuth0Client({
      domain: "localhost",
      client_id: "Rh1IviNqvnuubqFKoC9FVESpgUFb6Ka8",
      redirect_uri: "<MY_CALLBACK_URL>",
    });

    const isAuthenticated = await auth0.isAuthenticated();

    if (isAuthenticated) {
      console.log("> User is authenticated");

      return;
    }
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
              console.log("this is gapi>>>>>>>>>>>>>>>>>>", window.gapi.auth2);
              //all auth stuff needing gapi.auth2

              //initialise gapi
              window.gapi.auth2.init({
                client_id: client_id,
              });
              const GoogleAuth = window.gapi.auth2.getAuthInstance();

              const options = {
                prompt: "consent",
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

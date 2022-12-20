import { url, client_id } from "../constants";
import axios from "axios";
import m from "mithril";
import jwt_decode from "jwt-decode";

import createAuth0Client from "@auth0/auth0-spa-js";
// import { decode } from "jsonwebtoken";

//provide global vars for token , decodedToken which is the token object and the google auth client as gClient
let token, gClient, decodedToken;

const google_login = {
  // remove eslint errors on global googlee
  /*global google */

  oncreate() {
    if(!google.accounts.id){
      return;
    }
    gClient = google.accounts.id.initialize({
      client_id: client_id,
      callback: (response) => {

        token = response.credential;
        decodedToken = jwt_decode(response.credential);
        console.log({ decodedToken, response })
        setStorage({ decodedToken, response });
      },
    });
    //show the right side google loggin prompt all sexy-like
    google.accounts.id.prompt();

    //set stuff to storage
    const setStorage = ({ decodedToken, token }) => {

      localStorage.setItem("authToken", token);
      localStorage.setItem("name", decodedToken.name);
      localStorage.setItem("imageUrl", decodedToken.picture);
      localStorage.setItem("email", decodedToken.email);

      // fetch user using email, set the role to local storage
      axios
        .request({
          method: "GET",
          url: url + "/users/" + decodedToken.email,
          headers: {
            "Content-Type": "application/json",
            // 'authorization': localStorage.getItem('token')
          },
        })
        .then(function (user) {

          console.log({ user })
          localStorage.setItem("role", user.role);

          const userData = {
            name: decodedToken.name,
            imageUrl: decodedToken.picture,
            email: decodedToken.email,
          };
          // reload the page after successfull login
          const options = {
            method: "PATCH",
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
              window.location.reload();
            })
            .catch(function (error) {
              console.error(error);
            });

          window.location.reload()
        })
        // send request to create user if the user isnt found
        .catch(function (error) {
          const userData = {
            email: decodedToken.email,
          };
          // reload the page after successfull login
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
              window.location.reload();
            })
            .catch(function (error) {
              console.error(error);
              window.location.reload();
            });
        });
    };
  },
  view() {
    // return []
    return m(
      "button",
      {
        type:"button",
        class: "btn btn-danger btn-lg",
        onclick() {
          // try Oauth
          //   return login();
          console.log(location.host.includes("localhost"))
          if(location.host.includes("localhost")){
            localStorage.setItem("authToken", undefined);
            localStorage.setItem("name", "Laundry User 1");
            localStorage.setItem("imageUrl", "https://lh3.googleusercontent.com/a/AEdFTp7bplv6Se77lz-L9Fsk7QeZo9makIEJhFG-eLwJ=s96-c");
            localStorage.setItem("email", "laundrytestuser@gmail.com");
            location.reload()
          } else {
            google.accounts.id.prompt();
          }
    
        },
      },
      m("i", { class: "icon-xl fab fa-google" }),
      "Sign In"
    );
  },
};

export default google_login;

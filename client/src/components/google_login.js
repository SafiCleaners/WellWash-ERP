import axios from 'axios';
import createAuth0Client from '@auth0/auth0-spa-js';
import jwtDecode from 'jwt-decode';
import m from 'mithril';

import { url, client_id } from '../constants';

let token, gClient, decodedToken;

const setStorage = ({ decodedToken, token }) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('name', decodedToken.name);
  localStorage.setItem('imageUrl', decodedToken.picture);
  localStorage.setItem('email', decodedToken.email);
};

const google_login = {
  async oncreate() {
    // window.google.addEventListener("load", async () => {
    // if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    //   console.error('window.google Auth client not found!');
    //   return;
    // }
    
    try {
      console.log(client_id,url)
      gClient = await window.google.accounts.id.initialize({
        client_id: client_id,
        callback: (response) => {
          token = response.credential;
          decodedToken = jwtDecode(response.credential);
          setStorage({ decodedToken, token });
          window.location.reload()
        },
      });
      console.log({ gClient })
      await window.google.accounts.id.prompt();
      const options = {
        method: 'GET',
        url: `${url}/users/${decodedToken.email}`,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const user = await axios.request(options);
      localStorage.setItem('role', user.data.role);
      window.location.reload();
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const userData = { email: decodedToken.email };
        const options = {
          method: 'POST',
          url: `${url}/users`,
          headers: {
            'Content-Type': 'application/json',
          },
          data: userData,
        };
        const res = await axios.request(options);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user.id);
        localStorage.setItem('role', res.data.user.role);
        window.location.reload();
      } else {
        console.error(err);
      }
    }
    // })
  },
  view() {
    return m(
      'button',
      {
        type: 'button',
        class: 'btn btn-primary btn-lg',
        onclick() {
          window.google.accounts.id.prompt();
        },
      },
      'Login with Google'
    );
    
  },
};

export default google_login;

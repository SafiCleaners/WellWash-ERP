import {
    url
} from "../constants"
import axios from "axios"

const google_login = {
    view() {
        return m("button", {
            "class": "btn btn-danger btn-lg",
            onclick() {
                const GoogleAuth = window.gapi.auth2.getAuthInstance()
                const options = {
                    prompt: "consent"
                }

                GoogleAuth.signIn(options).then(
                    googleUser => {
                        let profile = googleUser.getBasicProfile();
                        localStorage.setItem('authToken', profile.getId());
                        localStorage.setItem('name', profile.getName());
                        localStorage.setItem('imageUrl', profile.getImageUrl());
                        localStorage.setItem('email', profile.getEmail());

                        const userData = {
                            id: profile.getId(),
                            name: profile.getName(),
                            imageUrl: profile.getImageUrl(),
                            email: profile.getEmail()
                        }

                        // refresh after successfull login
                        const options = {
                            method: 'POST',
                            url: url + '/users',
                            headers: {
                                'Content-Type': 'application/json',
                                // 'authorization': localStorage.getItem('token')
                            },
                            data: userData
                        };

                        axios.request(options).then(function (response) {
                            // alert(JSON.stringify(response.data));
                            localStorage.setItem('token', response.data.token);
                            localStorage.setItem('role', response.data.user.role);
                            location.reload()
                        }).catch(function (error) {
                            console.error(error);
                        });
                    },
                    err => {
                        console.error(err)
                    }
                )
            }
        },
            m("i", { "class": "icon-xl fab fa-google" }),
            "Sign In"
        )
    }
}

export default google_login
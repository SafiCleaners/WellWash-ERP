import m from "mithril"
import {
    url,
    client_id
} from "../constants"
import axios from "axios"
import google_login from "./google_login"

const subheader = () => {
    return {
        view() {
            return m("div", { "class": "subheader bg-white h-100px", "id": "kt_subheader" },
                m("div", { "class": "container flex-wrap flex-sm-nowrap" },
                    [
                        m("div", { "class": "d-none d-lg-flex align-items-center flex-wrap w-250px" },
                            m("a", { "href": "index.html" },
                                m("img", { "class": "max-h-50px", "alt": "Logo", "src": "assets/media/exported-wellwash.png" })
                            )
                        ),
                        m("div", { "class": "subheader-nav nav flex-grow-1" },
                            [
                                m("a", {
                                    "class": "nav-item", href: "#!/order1",
                                    onclick() {
                                        m.route.set("/order1")
                                    }
                                },
                                    !localStorage.getItem('authToken') ? m("span", { "class": "nav-label px-10" },
                                        [
                                            m("span", { "class": "nav-title text-dark-75 font-weight-bold font-size-h4" },
                                                "Order Now"
                                            ),
                                            m("span", { "class": "nav-desc text-muted" },
                                                "Order for Laundry Pickup"
                                            )
                                        ]
                                    ) : m("span", { "class": "nav-label px-10" },
                                        [
                                            m(".row", [
                                                m(".col-2.d-block d-md-none", [
                                                    // m("span", { "class": "svg-icon svg-icon-xl" }, [
                                                        m("img", {
                                                            src: localStorage.getItem('imageUrl'),
                                                            style: {
                                                                "max-width": "100%",
                                                                height: "auto"
                                                            }
                                                        })
                                                    // ]),
                                                ]),
                                                m(".col-6", [
                                                    m("span", { "class": "nav-title text-dark-75 font-weight-bold font-size-h4" },
                                                        "Welcome " + localStorage.getItem('name')
                                                    ),
                                                    m("br"),
                                                    m("span", { "class": "nav-desc text-muted" },
                                                        "Order for Laundry Pickup below"
                                                    )
                                                ]),
                                                m(".col-3.d-block d-md-none",[
                                                    m("button", {
                                                        type: "button",
                                                        "class": "btn btn-info btn-sm", 
                                                        onclick() {
                                                            localStorage.clear()
                    
                                                            if(window.gapi.auth2)
                                                                Promise.resolve(window.gapi.auth2.getAuthInstance().signOut()).then(function () {
                                                                    console.log('User signed out.');
                                                                    window.location.reload()
                                                                });
                    
                                                            window.location.reload()
                                                        }
                                                    },
                                                        "SignOut"
                                                    )
                                                ])
                                            ])

                                        ]
                                    )
                                ),
                                localStorage.getItem('authToken') ? [] : m("a", { "class": "nav-item active" },
                                     m("div", { style: { margin: "auto" } }, [
                                        // m("div", { "id": "g_id_onload2", "data-callback": "handleGoogleCredentialResponse" }),
                                        m(google_login)
                                    ])
                                )
                            ]
                        )
                    ]
                )
            )
        }
    }
}


export default subheader
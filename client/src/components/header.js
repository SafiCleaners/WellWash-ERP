import { client_id } from "../constants";
import m from "mithril";
import axios from "axios";
import google_login from "./google_login";
import modal from "./modal";

const header = {
  async x_oncreate() {
    const params = {
      client_id,
      // cookie_policy: cookiePolicy,
      // login_hint: loginHint,
      // hosted_domain: hostedDomain,
      // fetch_basic_profile: fetchBasicProfile,
      // discoveryDocs,
      // ux_mode: uxMode,
      // redirect_uri: redirectUri,
      // scope,
      // access_type: accessType
    };
    params.access_type = "offline";
    window.gapi.load("auth2", () => {
      const GoogleAuth = window.gapi.auth2.getAuthInstance();

      console.log(GoogleAuth);
      // if (!GoogleAuth) {
      //     window.gapi.auth2.init(params).then(
      //         res => {
      //             const signedIn = res.isSignedIn.get()
      //             // onAutoLoadFinished(signedIn)
      //             if (signedIn) {
      //                 console.log(res.currentUser.get())
      //             }
      //         },
      //         err => {
      //             // setLoaded(true)
      //             // onAutoLoadFinished(false)
      //             // onLoadFailure(err)
      //             console.log(err)
      //         }
      //     )
      // }
    });
  },
  view() {
    return m(
      "div",
      { class: "header header-fixed", id: "kt_header" },
      m("div", { class: "container" }, [
        m(
          "div",
          {
            class: "header-menu-wrapper header-menu-wrapper-left",
            id: "kt_header_menu_wrapper",
          },
          m(
            "div",
            {
              class:
                "header-menu header-menu-left header-menu-mobile header-menu-layout-default",
              id: "kt_header_menu",
            },
            m("ul", { class: "menu-nav" }, [
              m(
                "li",
                {
                  class:
                    "menu-item" +
                    (["/", ""].includes(window.location.hash)
                      ? " menu-item-active"
                      : ""),
                  "aria-haspopup": "true",
                },
                m(
                  m.route.Link,
                  { class: "menu-link", href: "/" },
                  m("span", { class: "menu-text" }, "Create Order")
                )
              ),

              !localStorage.getItem("authToken")
                ? [
                    m(
                      "li",
                      {
                        class:
                          "menu-item" +
                          (window.location.hash === "/discounts"
                            ? " menu-item-active"
                            : ""),
                        "aria-haspopup": "true",
                      },
                      m(
                        m.route.Link,
                        { class: "menu-link", href: "/discounts" },
                        [
                          m("span", { class: "menu-text" }, "Get Discounts"),
                          m("span", { class: "menu-desc" }),
                        ]
                      )
                    ),
                    m(
                      "li",
                      {
                        class:
                          "menu-item" +
                          (window.location.hash === "/about"
                            ? " menu-item-active"
                            : ""),
                        "aria-haspopup": "true",
                      },
                      m(m.route.Link, { class: "menu-link", href: "/about" }, [
                        m("span", { class: "menu-text" }, "About Us"),
                        m("span", { class: "menu-desc" }),
                      ])
                    ),
                    m(
                      "li",
                      {
                        class:
                          "menu-item" +
                          (window.location.hash === "/guarantees"
                            ? " menu-item-active"
                            : ""),
                        "aria-haspopup": "true",
                      },
                      m(
                        m.route.Link,
                        { class: "menu-link", href: "/guarantees" },
                        [
                          m("span", { class: "menu-text" }, "Guarantees"),
                          m("span", { class: "menu-desc" }),
                        ]
                      )
                    ),
                    m(
                      "li",
                      {
                        class:
                          "menu-item" +
                          (window.location.hash === "/services"
                            ? " menu-item-active"
                            : ""),
                        "aria-haspopup": "true",
                      },
                      m(
                        m.route.Link,
                        { class: "menu-link", href: "/services" },
                        [
                          m("span", { class: "menu-text" }, "Services"),
                          m("span", { class: "menu-desc" }),
                        ]
                      )
                    ),

                    m(
                      "li",
                      {
                        class:
                          "menu-item" +
                          (window.location.hash === "/FAQ"
                            ? " menu-item-active"
                            : ""),
                        "aria-haspopup": "true",
                      },
                      m(m.route.Link, { class: "menu-link", href: "/FAQ" }, [
                        m("span", { class: "menu-text" }, "FAQ"),
                        m("span", { class: "menu-desc" }),
                      ])
                    ),
                  ]
                : [
                    m(
                      "li",
                      {
                        class:
                          "menu-item" +
                          (window.location.hash.includes("j")
                            ? " menu-item-active"
                            : ""),
                        "aria-haspopup": "true",
                      },
                      m(m.route.Link, { class: "menu-link", href: "/j" }, [
                        m("span", { class: "menu-text" }, "Job Queue"),
                        m("span", { class: "menu-desc" }),
                      ])
                    ),
                    m(
                      "li",
                      {
                        class:
                          "menu-item" +
                          (window.location.hash.includes("users")
                            ? " menu-item-active"
                            : ""),
                        "aria-haspopup": "true",
                      },
                      m(m.route.Link, { class: "menu-link", href: "/users" }, [
                        m("span", { class: "menu-text" }, "User Management"),
                        m("span", { class: "menu-desc" }),
                      ])
                    ),
                  ],
            ])
          )
        ),
        m("div", { class: "topbar" }, [
          localStorage.getItem("authToken")
            ? [
                m(
                  "div",
                  { class: "topbar-item mr-3" },
                  m(
                    "div",
                    {
                      class: "w-auto d-flex align-items-center btn-lg px-2",
                      id: "kt_quick_user_toggle",
                    },
                    m(
                      m.route.Link,
                      {
                        class: "menu-link",
                        href: "#",
                        style: { color: "white" },
                      },
                      [
                        m(
                          "span",
                          { class: "menu-text font-size-sm" },
                          localStorage.getItem("name")
                        ),
                        m("br"),
                        m(
                          "span",
                          { class: "menu-desc font-size-xs" },
                          localStorage.getItem("email")
                        ),
                      ]
                    )
                  )
                ),
                m(
                  "div",
                  { class: "topbar-item mr-3" },
                  m("span", { class: "svg-icon svg-icon-xl" }, [
                    m("img", {
                      src: localStorage.getItem("imageUrl"),
                      style: {
                        "max-width": "40%",
                        height: "auto",
                      },
                    }),
                  ])
                ),
                m(
                  "div",
                  {
                    class: "topbar-item",
                    "data-toggle": "dropdown",
                    "data-offset": "10px,0px",
                    "aria-expanded": "false",
                  },
                  m(
                    m.route.Link,
                    {
                      class:
                        "btn btn-dropdown btn-fixed-height btn-danger font-weight-bolder font-size-sm px-6",
                      onclick() {
                        localStorage.clear();

                        if (window.gapi.auth2)
                          Promise.resolve(
                            window.gapi.auth2.getAuthInstance().signOut()
                          ).then(function () {
                            console.log("User signed out.");
                            window.location.reload();
                          });

                        window.location.reload();
                      },
                    },
                    "SignOut"
                  )
                ),
              ]
            : m("div", { style: { margin: "auto" } }, [
                // m("div", { "id": "g_id_onload", "data-callback": "handleGoogleCredentialResponse" }),
                //how to use modal
                // m(
                //   modal,
                //   {
                //     modalName: "test",
                //     title: "TestModal",
                //     btnColorClass: "btn-danger btn-lg",
                //     btnText: "Login",
                //     footerBtnText: "Save Changes",
                //     onclickHandler: function (e) {
                //       console.log("savechnages was clicked");
                //     },
                //   },
                //   [m(google_login)]
                // ),
                m(google_login)
              ]),
        ]),
      ])
    );
  },
};

export default header;

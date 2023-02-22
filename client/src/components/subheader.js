import m from "mithril";
import google_login from "./google_login";
import modal from "./modal"

const subheader = () => {
  return {
    view() {
      return m(
        "div",
        { class: "subheader bg-white h-100px", id: "kt_subheader" },
        m("div", { class: "container flex-wrap flex-sm-nowrap" }, [
          m(
            "div",
            { class: "d-none d-lg-flex align-items-center flex-wrap w-300px" },
            m(
              m.route.Link,
              { href: "/" },
              m("img", {
                class: "max-h-50px",
                alt: "Logo",
                src: "/assets/media/exported-wellwash.png",
              })
            )
          ),
          m("div", { class: "subheader-nav nav flex-grow-1" }, [
            m(
              m.route.Link,
              {
                class: "nav-item",
                href: "/",
                onclick() {
                  m.route.set("/");
                },
              },
              !localStorage.getItem("authToken")
                ? m("span", { class: "nav-label px-10" }, [
                    m(
                      "span",
                      {
                        class:
                          "nav-title text-dark-75 font-weight-bold font-size-h4",
                      },
                      "Order For Pickup"
                    ),
                    m(
                      "span",
                      { class: "nav-desc text-muted" },
                      "Your Trusted Laundry Service"
                    ),
                  ])
                : m("span", { class: "nav-label px-10" }, [
                    m(".row", [
                      m(".col-2.d-block d-md-none", [
                        // m("span", { "class": "svg-icon svg-icon-xl" }, [
                        m("img", {
                          src: localStorage.getItem("imageUrl"),
                          style: {
                            "max-width": "100%",
                            height: "auto",
                            "padding-top": "20",
                          },
                        }),
                        // ]),
                      ]),
                      m(".col-6", [
                        m(
                          "span",
                          {
                            class:
                              "nav-title text-dark-75 font-weight-bold font-size-h4",
                          },
                          "Welcome " + localStorage.getItem("name")
                        ),
                        m("br"),
                        m(
                          "span",
                          { class: "nav-desc text-muted" },
                          "Order for Laundry Pickup below"
                        ),
                      ]),
                      m(".col-3.d-block d-md-none", [
                        m(
                          "button",
                          {
                            type: "button",
                            class: "btn btn-info btn-sm",
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
                        ),
                      ]),
                    ]),
                  ])
            ),
            localStorage.getItem("authToken")
              ? []
              : m(
                  m.route.Link,
                  { class: "nav-item active d-md-none" },
                  m("div", { style: { margin: "auto" } }, [
                    // m("div", { "id": "g_id_onload2", "data-callback": "handleGoogleCredentialResponse" }),
                    // where modal should go
                    m(
                      modal,
                      {
                        modalName: "test",
                        title: "TestModal",
                        btnColorClass: "btn-danger btn-lg",
                        btnText: "Login",
                        footerBtnText: "Save Changes",
                        onclickHandler: function (e) {
                          console.log("savechnages was clicked");
                        },
                      },
                      [m(google_login)]
                    ),
                    // m(google_login),
                  ])
                ),
          ]),
        ])
      );
    },
  };
};

export default subheader;

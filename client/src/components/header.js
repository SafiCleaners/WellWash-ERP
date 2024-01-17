import {
    url,
    operationTimes
} from "../constants"
import {
    client_id
} from "../constants"
import m from "mithril"
import axios from "axios"
import google_login from "./google_login"

import { DateRangePicker } from "./daterangepicker";

const onDatePickerChange = (datePicked) => {
    // localStorage.setItem("businessDate", datePicked)
    m.redraw()
}

const header = {
    oncreate(vnode) {
        vnode.state.stores = []
        // if (!localStorage.getItem("businessDate")) {
        //     localStorage.setItem("businessDate", new Date().toISOString().split('T')[0])
        // }

        const options = {
            method: 'GET', url: url + "/stores",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.stores = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });
    },
    view(vnode) {
        return m("div", { "class": "header header-fixed", "id": "kt_header" },
            m("div", { "class": "container" },
                [
                    m("div", { "class": "header-menu-wrapper header-menu-wrapper-left", "id": "kt_header_menu_wrapper" },
                        m("div", { "class": "header-menu header-menu-left header-menu-mobile header-menu-layout-default", "id": "kt_header_menu" },
                            m("ul", { "class": "menu-nav" },
                                [
                                    m("li", {
                                        "class": "menu-item" + (
                                            ["/", ""].includes(window.location.pathname) ? " menu-item-active" : ""), "aria-haspopup": "true"
                                    },
                                        m(m.route.Link, { "class": "menu-link", "href": "/" },
                                            m("span", { "class": "menu-text" },
                                                "Create"
                                            )
                                        )
                                    ),

                                    !localStorage.getItem('authToken') ? [
                                        m("li", { "class": "menu-item" + (window.location.pathname === "/discounts" ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                            m(m.route.Link, { "class": "menu-link", "href": "/discounts" },
                                                [
                                                    m("span", { "class": "menu-text" },
                                                        "Get Discounts"
                                                    ),
                                                    m("span", { "class": "menu-desc" })
                                                ]
                                            )
                                        ),
                                        m("li", { "class": "menu-item" + (window.location.pathname === "/about" ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                            m(m.route.Link, { "class": "menu-link", "href": "/about" },
                                                [
                                                    m("span", { "class": "menu-text" },
                                                        "About Us"
                                                    ),
                                                    m("span", { "class": "menu-desc" })
                                                ]
                                            )
                                        ),
                                        m("li", { "class": "menu-item" + (window.location.pathname === "/guarantees" ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                            m(m.route.Link, { "class": "menu-link", "href": "/guarantees" },
                                                [
                                                    m("span", { "class": "menu-text" },
                                                        "Guarantees"
                                                    ),
                                                    m("span", { "class": "menu-desc" })
                                                ]
                                            )
                                        ),
                                        m("li", { "class": "menu-item" + (window.location.pathname === "/services" ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                            m(m.route.Link, { "class": "menu-link", "href": "/services" },
                                                [
                                                    m("span", { "class": "menu-text" },
                                                        "Services"
                                                    ),
                                                    m("span", { "class": "menu-desc" })
                                                ]
                                            )
                                        ),

                                        m("li", { "class": "menu-item" + (window.location.pathname === "/FAQ" ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                            m(m.route.Link, { "class": "menu-link", "href": "/FAQ" },
                                                [
                                                    m("span", { "class": "menu-text" },
                                                        "FAQ"
                                                    ),
                                                    m("span", { "class": "menu-desc" })
                                                ]
                                            )
                                        )
                                    ] : [m("li", { "class": "menu-item" + (window.location.pathname.includes("j") ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                        m(m.route.Link, { "class": "menu-link", "href": "/j" },
                                            [
                                                m("span", { "class": "menu-text" },
                                                    "Queue"
                                                ),
                                                m("span", { "class": "menu-desc" })
                                            ]
                                        )
                                    ),
                                    m("li", { "class": "menu-item" + (window.location.pathname.includes("users") ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                        m(m.route.Link, { "class": "menu-link", "href": "/users" },
                                            [
                                                m("span", { "class": "menu-text" },
                                                    "Management"
                                                ),
                                                m("span", { "class": "menu-desc" })
                                            ]
                                        )
                                    ),
                                    m("li", { "class": "menu-item" + (window.location.pathname.includes("brands") ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                        m(m.route.Link, { "class": "menu-link", "href": "/brands" },
                                            [
                                                m("span", { "class": "menu-text" },
                                                    "Brands"
                                                ),
                                                m("span", { "class": "menu-desc" })
                                            ]
                                        )
                                    ),
                                    m("li", { "class": "menu-item" + (window.location.pathname.includes("stores") ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                        m(m.route.Link, { "class": "menu-link", "href": "/stores" },
                                            [
                                                m("span", { "class": "menu-text" },
                                                    "Stores"
                                                ),
                                                m("span", { "class": "menu-desc" })
                                            ]
                                        )
                                    ),
                                    m("li", { "class": "menu-item" + (window.location.pathname.includes("pricing") ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                        m(m.route.Link, { "class": "menu-link", "href": "/pricing" },
                                            [
                                                m("span", { "class": "menu-text" },
                                                    "Pricing"
                                                ),
                                                m("span", { "class": "menu-desc" })
                                            ]
                                        )
                                    ),

                                        // m("li", { "class": "menu-item" + (window.location.pathname.includes("orders") ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                        //     m(m.route.Link, { "class": "menu-link", "href": "/orders" },
                                        //         [
                                        //             m("span", { "class": "menu-text" },
                                        //                 "Orders"
                                        //             ),
                                        //             m("span", { "class": "menu-desc" })
                                        //         ]
                                        //     )
                                        // ),
                                        // m("li", { "class": "menu-item" + (window.location.pathname.includes("tasks") ? " menu-item-active" : ""), "aria-haspopup": "true" },
                                        //     m(m.route.Link, { "class": "menu-link", "href": "/tasks" },
                                        //         [
                                        //             m("span", { "class": "menu-text" },
                                        //                 "Tasks"
                                        //             ),
                                        //             m("span", { "class": "menu-desc" })
                                        //         ]
                                        //     )
                                        // ),
                                    ],
                                ]
                            )
                        )
                    ),
                    m("div", { "class": "topbar" }, [

                        localStorage.getItem('authToken') ? [

                            m("div", { "class": "topbar-item mr-3", "data-toggle": "dropdown", "data-offset": "10px,0px", "aria-expanded": "false" }, [
                                m("button", { "class": "btn btn-sm btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                    // " All Stores "
                                    !localStorage.getItem('storeId')  ? " All Stores " :  vnode.state.stores?.filter(store => store._id == localStorage.getItem('storeId'))[0]?.title
                                ),
                                m("div", { "class": "w-auto d-flex align-items-center btn-sm px-2", "id": "kt_quick_user_toggle" },
                                    m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                        [
                                            m("a", {
                                                class: "dropdown-item",
                                                // href: "#",
                                                onclick: (e) => {
                                                    // Prevent default link behavior
                                                    e.preventDefault();

                                                    // Store store._id in local storage as storeId
                                                    localStorage.removeItem('storeId');

                                                    m.redraw()
                                                }
                                            }, " All Stores "),
                                            vnode.state.stores?.map(store => {
                                                return m("a", {
                                                    class: "dropdown-item",
                                                    // href: "#",
                                                    onclick: (e) => {
                                                        // Prevent default link behavior
                                                        e.preventDefault();

                                                        // Store store._id in local storage as storeId
                                                        localStorage.setItem('storeId', store._id);

                                                        m.redraw()
                                                    }
                                                },  store.title);
                                            })
                                        ]
                                    )),
                            ]),
                            m("div", { "class": "topbar-item mr-3 w-auto d-flex align-items-center btn-sm px-2", "id": "kt_quick_user_toggle" },
                                m(DateRangePicker, {
                                    // "class": "form-control form-control-solid",
                                    class:"btn btn-sm btn-secondary dropdown-toggle",
                                    "placeholder": "Select Business Day",
                                    "id": "kt_daterangepicker_new",
                                    onChange: onDatePickerChange
                                })
                            ),
                            m("div", { "class": "topbar-item mr-3", "data-toggle": "dropdown", "data-offset": "10px,0px", "aria-expanded": "false" },
                                m("span", { "class": "svg-icon svg-icon-xl" }, [
                                    m("img", {
                                        src: localStorage.getItem('imageUrl'),
                                        style: {
                                            "max-width": "100%",
                                            height: "auto"
                                        }
                                    })
                                ])
                            ), m("div", { "class": "topbar-item", "data-offset": "10px,0px", "aria-expanded": "false" },
                                m(m.route.Link, {
                                    "class": "btn btn-sm btn-danger", onclick() {
                                        localStorage.clear()

                                        if (window.gapi.auth2)
                                            Promise.resolve(window.gapi.auth2.getAuthInstance().signOut()).then(function () {
                                                console.log('User signed out.');
                                                window.location.reload()
                                            });

                                        window.location.reload()
                                    }
                                },
                                    m("i", { class: "fa fa-power-off", "aria-hidden":"true"})
                                )
                            )
                        ] : m("div", { style: { margin: "auto" } }, [
                            // m("div", { "id": "g_id_onload", "data-callback": "handleGoogleCredentialResponse" }),
                            m(google_login),
                        ])]
                    )
                ]
            )
        )
    }
}

export default header
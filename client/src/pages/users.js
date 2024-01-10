import axios from "axios";

import {
    url
} from "../constants"

import m from "mithril"
import loader from "../components/loader"

const users = {
    oninit(vnode) {
        vnode.state.jobs = []
        vnode.state.loading = true
    },
    oncreate(vnode) {
        const options = {
            method: 'GET', url: url + "/users",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.users = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });
    },
    view(vnode) {
        return m("div", { "class": "card card-custom gutter-b" },
            [
                m("div", { "class": "card-header border-0 pt-7" },
                    [
                        m("h3", { "class": "card-title align-items-start flex-column" },
                            [
                                m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                    "Available Users"
                                ),
                                // m("span", { "class": "text-muted mt-3 font-weight-bold font-size-sm" },
                                //     "More than 400+ new members"
                                // )
                            ]
                        )
                    ]
                ),
                m("div", { "class": "card-body pt-0 pb-4" },
                    m("div", { "class": "tab-content mt-2", "id": "myTabTable5" },
                        [
                            m("div", { "class": "tab-pane fade", "id": "kt_tab_table_5_1", "role": "tabpanel", "aria-labelledby": "kt_tab_table_5_1" },
                                m("div", { "class": "table-responsive" },
                                    m("table", { "class": "table table-borderless table-vertical-center" },
                                        [
                                            m("thead",
                                                m("tr",
                                                    [
                                                        m("th", { "class": "p-0 w-50px" }),
                                                        m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-125px" }),
                                                        m("th", { "class": "p-0 min-w-110px" }),
                                                        m("th", { "class": "p-0 min-w-150px" })
                                                    ]
                                                )
                                            ),

                                        ]
                                    )
                                )
                            ),

                            m("div", { "class": "tab-pane fade show active", "id": "kt_tab_table_5_3", "role": "tabpanel", "aria-labelledby": "kt_tab_table_5_3" },
                                m("div", { "class": "table-responsive" },
                                    !vnode.state.loading ? m("table", { "class": "table table-borderless table-vertical-center" },
                                        [
                                            m("thead",
                                                m("tr",
                                                    [
                                                        m("th", { "class": "p-0 w-50px" }),
                                                        m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-125px" }),
                                                        m("th", { "class": "p-0 min-w-110px" }),
                                                        m("th", { "class": "p-0 min-w-150px" })
                                                    ]
                                                )
                                            ),
                                            m("tbody",
                                                [
                                                    vnode.state.users && vnode.state.users.map(({
                                                        email,
                                                        googleId,
                                                        _id,
                                                        picture,
                                                        name,
                                                        role,
                                                        deleted
                                                    }) => {
                                                        return m("tr", {
                                                            style: { "cursor": "pointer" }
                                                        },
                                                            [
                                                                m("td",
                                                                    m("div", { "class": "symbol symbol-45 symbol-light mr-2" },
                                                                        m("span", { "class": "symbol-label" },
                                                                            m("img", { "class": "h-50 align-self-center", "src": picture, "alt": "" })
                                                                        )
                                                                    )
                                                                ),
                                                                m("td", {
                                                                    "class": "pl-0"
                                                                },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder text-hover-primary mb-1 font-size-lg", style: "white-space: nowrap;" },
                                                                            name
                                                                        ),
                                                                        m("div",
                                                                            [
                                                                                m("span", { "class": "font-weight-bolder text-dark-75" },
                                                                                    "Google ID:", [m("span", { "class": "text-muted font-weight-bold text-hover-primary", style: "white-space: nowrap;", },
                                                                                        googleId
                                                                                    )]
                                                                                )
                                                                            ]
                                                                        )
                                                                    ]
                                                                ),

                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            email
                                                                        )
                                                                    ]
                                                                ),

                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [

                                                                        m("div", { "class": "dropdown" },
                                                                            [
                                                                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                                                                    role ? role.role : "Select a role:"
                                                                                ),
                                                                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                                                    [
                                                                                        ["CLIENT", "RIDER", "INTERNAL", "OWNER"].map(e => {
                                                                                            return m("a", {
                                                                                                style: { "z-index": 10000 },
                                                                                                href: "javascript:void(0);",
                                                                                                onclick() {
                                                                                                    // update db on role change
                                                                                                    // vnode.state.user = e
                                                                                                    const options = {
                                                                                                        method: 'PATCH',
                                                                                                        url: url + `/users/roles/${_id}`,
                                                                                                        headers: {
                                                                                                            'Content-Type': 'application/json',
                                                                                                            'authorization': localStorage.getItem('token')
                                                                                                        },
                                                                                                        data: { role: e }
                                                                                                    };

                                                                                                    axios.request(options).then(function (response) {
                                                                                                        console.log(response.data);
                                                                                                        window.location.reload()
                                                                                                    }).catch(function (error) {
                                                                                                        console.error(error);
                                                                                                    });
                                                                                                },
                                                                                                "class": "dropdown-item",
                                                                                            },
                                                                                                e
                                                                                            )
                                                                                        })
                                                                                    ]
                                                                                )
                                                                            ]
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right pr-0", style: "white-space: nowrap;" },
                                                                    [
                                                                        m('a', {
                                                                            href: "javascript:void(0);",
                                                                            "class": "btn btn-icon btn-light btn-hover-primary btn-sm", onclick() {
                                                                                const options = {
                                                                                    method: 'DELETE',
                                                                                    url: `${url}/users/${email}`,
                                                                                    headers: {
                                                                                        'Content-Type': 'application/json',
                                                                                        'authorization': localStorage.getItem('token')
                                                                                    },
                                                                                };

                                                                                axios.request(options).then(function (response) {
                                                                                    console.log(response.data);
                                                                                    window.location.reload()
                                                                                }).catch(function (error) {
                                                                                    console.error(error);
                                                                                });
                                                                            }
                                                                        },
                                                                            m("span", { "class": "svg-icon svg-icon-md svg-icon-primary" },
                                                                                m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                                                                    m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                                                                        [
                                                                                            m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                                                                            m("path", { "d": "M7,3 L17,3 C19.209139,3 21,4.790861 21,7 C21,9.209139 19.209139,11 17,11 L7,11 C4.790861,11 3,9.209139 3,7 C3,4.790861 4.790861,3 7,3 Z M7,9 C8.1045695,9 9,8.1045695 9,7 C9,5.8954305 8.1045695,5 7,5 C5.8954305,5 5,5.8954305 5,7 C5,8.1045695 5.8954305,9 7,9 Z", "fill": "#000000" }),
                                                                                            m("path", { "d": "M7,13 L17,13 C19.209139,13 21,14.790861 21,17 C21,19.209139 19.209139,21 17,21 L7,21 C4.790861,21 3,19.209139 3,17 C3,14.790861 4.790861,13 7,13 Z M17,19 C18.1045695,19 19,18.1045695 19,17 C19,15.8954305 18.1045695,15 17,15 C15.8954305,15 15,15.8954305 15,17 C15,18.1045695 15.8954305,19 17,19 Z", "fill": "#000000", "opacity": "0.3" })
                                                                                        ]
                                                                                    )
                                                                                )
                                                                            )
                                                                        )
                                                                    ]
                                                                ),
                                                                !deleted ? null : m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            "BLOCKED"
                                                                        )
                                                                    ]
                                                                )
                                                            ]
                                                        )
                                                    })
                                                ]
                                            )
                                        ]
                                    ) : m(loader)
                                )
                            )
                        ]
                    )
                )
            ]
        )
    }
}

export default users
import axios from "axios";


import {
    url
} from "../constants"

import m from "mithril"
import loader from "../components/loader"
import addClientGroup from "../components/add_client_group"
import editClientGroup from "../components/edit_client_group"
import addClient from "../components/add_client"
import editClient from "../components/edit_client"

const getGroupNames = (groups, groupIds) => {
    if (!groupIds) return "N/A";
    if (!groups) return "N/A";

    // return groups
    //     .filter(group => groupIds.includes(group._id))
    //     .map(group => group.title);

    const matchingGroups = groups.filter(group => groupIds.includes(group._id));
    const titles = matchingGroups.map(group => group.title);
    return titles.join(', ');
}

const clients = {
    oninit(vnode) {
        vnode.state.groups = []
        vnode.state.clients = []
        vnode.state.loading = true
    },
    oncreate(vnode) {
        const options = {
            method: 'GET', url: url + "/cgroups",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.groups = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

        const optionsClients = {
            method: 'GET', url: url + "/clients",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsClients).then(function (response) {
            vnode.state.clients = response.data
            console.log(vnode.state.categories)
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
                                    "Groups"
                                ),
                            ]
                        ),
                        m(addClientGroup)
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
                                                        m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-50px" })
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
                                                        m("th", { "class": "p-0 min-w-200px text-left" }, "Title"),
                                                        m("th", { "class": "p-0 min-w-100px text-left" }, "Added By"),
                                                        m("th", { "class": "p-0 min-w-100px text-left" }, "Date Added"),
                                                        m("th", { "class": "p-0 min-w-50px text-center" }, "Actions")
                                                    ]
                                                )
                                            ),
                                            m("tbody",
                                                [
                                                    vnode.state.groups
                                                        .map((item) => {
                                                            return m("tr", {
                                                                style: { "cursor": "pointer" }
                                                            },
                                                                [
                                                                    m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span.text-dark-75.font-weight-bolder.d-block.font-size-lg", {
                                                                                "class": "text-dark-75 font-weight-bolder d-block font-size-lg"
                                                                            }, item.title)
                                                                        ]
                                                                    ),
                                                                    m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                item.userTitle
                                                                            )
                                                                        ]
                                                                    ),
                                                                    m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                item.createdAtFormatted
                                                                            )
                                                                        ]
                                                                    ),
                                                                    m("td", { "class": "text-center pr-0", style: "white-space: nowrap;" },
                                                                        m('div', { "class": "" },
                                                                            [
                                                                                m(editClientGroup, { "group": item }),
                                                                                m('a', {
                                                                                    href: "javascript:void(0);",
                                                                                    "class": "btn btn-icon btn-light btn-hover-danger btn-sm", onclick() {
                                                                                        const options = {
                                                                                            method: 'DELETE',
                                                                                            url: `${url}/cgroups/${item._id}`,
                                                                                            headers: {
                                                                                                'Content-Type': 'application/json',
                                                                                                'authorization': localStorage.getItem('token')
                                                                                            },
                                                                                        };

                                                                                        axios.request(options).then(function (response) {
                                                                                            console.log(response.data);
                                                                                            // window.location.reload()
                                                                                            vnode.state.groups = vnode.state.groups.filter(p => p._id != item._id)
                                                                                            m.redraw()
                                                                                        }).catch(function (error) {
                                                                                            console.error(error);
                                                                                        });
                                                                                    }
                                                                                },
                                                                                    m('icon', { "class": "flaticon2-rubbish-bin-delete-button" })
                                                                                )
                                                                            ])
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
                ),


                m("div", { "class": "card-header border-0 pt-7" },
                    [
                        m("h3", { "class": "card-title align-items-start flex-column" },
                            [
                                m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                    "Clients"
                                ),
                            ]
                        ),
                        m(addClient)
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
                                                        m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        // m("th", { "class": "p-0 min-w-50px" })
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
                                                        m("th", { "class": "p-0 min-w-200px text-left" }, "Name"),
                                                        m("th", { "class": "p-0 min-w-100px text-left" }, "Phone"),
                                                        m("th", { "class": "p-0 min-w-200px text-left" }, "Groups"),
                                                        m("th", { "class": "p-0 min-w-100px text-left" }, "Added By"),
                                                        m("th", { "class": "p-0 min-w-100px text-left" }, "Date Added"),
                                                        // m("th", { "class": "p-0 min-w-50px text-center" }, "Actions")
                                                    ]
                                                )
                                            ),
                                            m("tbody",
                                                [
                                                    vnode.state.clients
                                                        .map((item) => {
                                                            console.log(item)
                                                            return m("tr", {
                                                                style: { "cursor": "pointer" }
                                                            },
                                                                [
                                                                    m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span.text-dark-75.font-weight-bolder.d-block.font-size-lg", {
                                                                                "class": "text-dark-75 font-weight-bolder d-block font-size-lg"
                                                                            }, item.name)
                                                                        ]
                                                                    ),
                                                                    m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                item.phone
                                                                            )
                                                                        ]
                                                                    ),
                                                                    m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                getGroupNames(vnode.state.groups, item.groups)
                                                                            )
                                                                        ]
                                                                    ),
                                                                    m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                item.userTitle
                                                                            )
                                                                        ]
                                                                    ),
                                                                    m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                item.createdAtFormatted
                                                                            )
                                                                        ]
                                                                    ),
                                                                    m("td", { "class": "text-center pr-0", style: "white-space: nowrap;" },
                                                                        m('div', { "class": "" },
                                                                            [
                                                                                m(editClient, { "client": item }),
                                                                                m('a', {
                                                                                    href: "javascript:void(0);",
                                                                                    "class": "btn btn-icon btn-light btn-hover-danger btn-sm", onclick() {
                                                                                        const options = {
                                                                                            method: 'DELETE',
                                                                                            url: `${url}/clients/${item._id}`,
                                                                                            headers: {
                                                                                                'Content-Type': 'application/json',
                                                                                                'authorization': localStorage.getItem('token')
                                                                                            },
                                                                                        };

                                                                                        axios.request(options).then(function (response) {
                                                                                            console.log(response.data);
                                                                                            // window.location.reload()
                                                                                            vnode.state.clients = vnode.state.clients.filter(p => p._id != item._id)
                                                                                            m.redraw()
                                                                                        }).catch(function (error) {
                                                                                            console.error(error);
                                                                                        });
                                                                                    }
                                                                                },
                                                                                    m('icon', { "class": "flaticon2-rubbish-bin-delete-button" })
                                                                                )
                                                                            ])
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

const clientsWrapper = {
    oninit(vnode) {
        vnode.state.groups = []
        vnode.state.contacts = []
        vnode.state.loading = true
    },
    view(vnode) {
        return m("div", { "class": "card card-custom gutter-b" }, [
            m(clients)
        ])
    }
}

export default clientsWrapper

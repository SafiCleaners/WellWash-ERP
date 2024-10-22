import axios from "axios";

import {
    url
} from "../constants"

import m from "mithril"
import loader from "../components/loader"
import addOrder from "../components/add_order"

const formatCurrency = (number) => {
    try {
        return Intl.NumberFormat('en-US').format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return 'N/A';
    }
}

const users = {
    oninit(vnode) {
        vnode.state.orders = []
        vnode.state.loading = true
    },
    oncreate(vnode) {
        const options = {
            method: 'GET', url: url + "/orders",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.orders = response.data
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
                                    "Available Orders"
                                ),
                            ]
                        ),
                        m(addOrder)
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
                                                        m("th", { "class": "p-0 min-w-20px" }),
                                                        m("th", { "class": "p-0 min-w-30px" }),
                                                        m("th", { "class": "p-0 min-w-50px" }),
                                                        m("th", { "class": "p-0 min-w-50px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-100px" })
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
                                                        m("th", { "class": "p-0 min-w-20px text-left" }, "Progress"),
                                                        m("th", { "class": "p-0 min-w-30px text-left" }, "Tasks"),
                                                        m("th", { "class": "p-0 min-w-50px text-left" }, "Order ID"),
                                                        m("th", { "class": "p-0 min-w-50px text-left" }, "Total"),
                                                        m("th", { "class": "p-0 min-w-100px text-left" }, "Store"),
                                                        m("th", { "class": "p-0 min-w-100px text-left" }, "Client"),
                                                        m("th", { "class": "p-0 min-w-100px text-left" }, "Added By"),
                                                        m("th", { "class": "p-0 min-w-100px text-left" }, "Date Added"),
                                                        m("th", { "class": "p-0 min-w-100px text-center" }, "Actions")
                                                    ]
                                                )
                                            ),
                                            m("tbody",
                                                [
                                                    vnode.state.orders.map((item) => {
                                                        return m("tr", {
                                                            style: { "cursor": "pointer" }
                                                        },
                                                            [
                                                                m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.progress + "%"
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.tasksCount
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item._id
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            formatCurrency(item.totalCost)
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.storeTitle
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
                                                                            item.clientTitle
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
                                                                            m('a', {
                                                                                href: "javascript:void(0);",
                                                                                "class": "btn btn-icon btn-light btn-hover-danger btn-sm", onclick() {
                                                                                    const options = {
                                                                                        method: 'DELETE',
                                                                                        url: `${url}/orders/${item._id}`,
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

export default users

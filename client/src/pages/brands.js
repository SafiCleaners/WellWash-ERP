import axios from "axios";


import {
    url
} from "../constants"

import m from "mithril"
import loader from "../components/loader"
import addBrand from "../components/add_brand"
import editBrand from "../components/edit_brand"

const formatCurrency = (number) => {
    try {
        return Intl.NumberFormat('en-US').format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return 'N/A';
    }
}

const brands = {
    oninit(vnode) {
        vnode.state.stores = []
        vnode.state.loading = true
    },
    oncreate(vnode) {
        const options = {
            method: 'GET', url: url + "/brands",
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
        return m("div", { "class": "card card-custom gutter-b" },
            [
                m("div", { "class": "card-header border-0 pt-7" },
                    [
                        m("h3", { "class": "card-title align-items-start flex-column" },
                            [
                                m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                    "Available Brands"
                                ),
                            ]
                        ),
                        m(addBrand)
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
                                                        m("th", { "class": "p-0 min-w-150px" }),
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
                                                        m("th", { "class": "p-0 min-w-150px text-right" }, "Logo"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Added By"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Date Added"),
                                                        m("th", { "class": "p-0 min-w-50px text-right" }, "Actions")
                                                    ]
                                                )
                                            ),
                                            m("tbody",
                                                [
                                                    vnode.state.stores.map((item) => {
                                                        return m("tr", {
                                                            style: { "cursor": "pointer" }
                                                        },
                                                            [
                                                                m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.title
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" }, [
                                                                    !item.logo ? [] : m("img", {
                                                                        src: `${item.logo}`, // Assuming item.logo is a Base64-encoded PNG image
                                                                        alt: "Logo",
                                                                        style: "max-height: 50px; max-width: 100%;", // Adjust max-height as needed
                                                                    })
                                                                ]),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.userTitle
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.createdAtFormatted
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right pr-0", style: "white-space: nowrap;" },
                                                                    m('div', { "class": "" },
                                                                        [
                                                                            m(editBrand, { "brand": item }),
                                                                            m('a', {
                                                                                href: "javascript:void(0);",
                                                                                "class": "btn btn-icon btn-light btn-hover-danger btn-sm", onclick() {
                                                                                    const options = {
                                                                                        method: 'DELETE',
                                                                                        url: `${url}/brands/${item._id}`,
                                                                                        headers: {
                                                                                            'Content-Type': 'application/json',
                                                                                            'authorization': localStorage.getItem('token')
                                                                                        },
                                                                                    };

                                                                                    axios.request(options).then(function (response) {
                                                                                        vnode.state.stores = vnode.state.stores.filter(s => s._id != item._id)
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

export default brands

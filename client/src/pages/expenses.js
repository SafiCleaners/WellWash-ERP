import axios from "axios";


import {
    url
} from "../constants"

import m from "mithril"
import loader from "../components/loader"
import addExpense from "../components/add_expense"
import editExpense from "../components/edit_expense"
import categories from "./categories"

const formatCurrency = (number) => {
    try {
        return Intl.NumberFormat('en-US').format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return 'N/A';
    }
}

const pricing = {
    oninit(vnode) {
        vnode.state.stores = []
        vnode.state.categories = []
        vnode.state.expenses = []
        vnode.state.loading = true
    },
    oncreate(vnode) {
        // Define the URLs and headers for each API request
        const expensesOptions = {
            method: 'GET',
            url: url + "/expenses",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            }
        };

        const categoriesOptions = {
            method: 'GET',
            url: url + "/categories",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            }
        };

        const storesOptions = {
            method: 'GET',
            url: url + "/stores",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            }
        };

        const brandsOptions = {
            method: 'GET',
            url: url + "/brands",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            }
        };

        // Use axios.all to make parallel requests
        axios.all([
            axios.request(expensesOptions),
            axios.request(categoriesOptions),
            axios.request(storesOptions),
            axios.request(brandsOptions)
        ])
            .then(axios.spread((expensesResponse, categoriesResponse, storesResponse, brandsResponse) => {
                // Handle successful responses for both requests
                vnode.state.expenses = expensesResponse.data;
                vnode.state.categories = categoriesResponse.data;
                vnode.state.stores = storesResponse.data;
                vnode.state.brands = brandsResponse.data;
                vnode.state.loading = false;
                m.redraw(); // Trigger redraw to reflect updated state
            }))
            .catch(error => {
                // Handle any errors from either request
                vnode.state.loading = false;
                m.redraw(); // Trigger redraw to reflect loading state or error
                console.error("Error fetching data:", error);
            });
    },

    view(vnode) {
        const storeId = localStorage.getItem("storeId")
        const storeName = vnode.state.stores.find(s => s._id == storeId)?.title
        const getStoreName = (storeId) => vnode.state.stores.find(s => s._id == storeId)?.title

        const filteredExpenses = vnode.state.expenses
            .filter(item => item.recurrent)
            .filter(item => {
                const store = vnode.state.stores.find(store => store._id == item.storeId);
                const storeBrand = vnode.state.brands.find(brand => brand._id == store.brand);

                if(storeBrand._id != localStorage.getItem("brand"))
                    return false

                if (localStorage.getItem("storeId"))
                    return item.storeId == localStorage.getItem("storeId")

                return true
            })

        const filteredEmmergentExpenses = vnode.state.expenses
            .filter(expense => {
                // Find the brand corresponding to the expense's storeId
                const storeBrand = vnode.state.brands.find(brand => brand._id == expense.storeId);

                // console.log({storeBrand})
                // Check if the storeBrand matches the desired brand ID from localStorage
                return storeBrand && storeBrand._id == localStorage.getItem("brand");
            })
            .filter(item => !item.recurrent)
            .filter(job => {
                const selectedDate = new Date(localStorage.getItem("businessDate"));

                // Assuming job.businessDate is a valid date string
                const businessDate = new Date(job.businessDate);
                // console.log(businessDate.toLocaleDateString(), selectedDate.toLocaleDateString())
                return businessDate.toLocaleDateString() == selectedDate.toLocaleDateString();
            })
            .filter(job => {
                if (localStorage.getItem("storeId"))
                    return job.storeId == localStorage.getItem("storeId")

                return true
            })

        const selectedDate = new Date(localStorage.getItem("businessDate"));
        const formattedBusinessDate = selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });


        return m("div", { "class": "card card-custom gutter-b" },
            [
                m("div", { "class": "card-header border-0 pt-7" },
                    [
                        m("h3", { "class": "card-title align-items-start flex-column" },
                            [
                                m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                    "Recurrent Expenses"
                                ),
                            ]
                        ),
                        m(addExpense)
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
                                                        m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 min-w-50px" }),
                                                        m("th", { "class": "p-0 min-w-50px" }),
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
                                                        !storeId ? m("th", { "class": "p-0 min-w-200px text-left" }, "Store") : "",
                                                        m("th", { "class": "p-0 min-w-200px text-left" }, "Expense Reason"),
                                                        m("th", { "class": "p-0 min-w-50px text-right" }, "Cost"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Added By"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Date Added"),
                                                        m("th", { "class": "p-0 min-w-50px text-right" }, "Actions")
                                                    ]
                                                )
                                            ),
                                            m("tbody",
                                                [
                                                    filteredExpenses.length == 0 ? [
                                                        m("tr", {
                                                            style: { textAlign: "center" } // Inline style for centering content
                                                        }, [
                                                            m("td", {
                                                                colspan: 4 // Spanning across all 3 columns
                                                            }, [
                                                                m("svg", {
                                                                    width: "250", // Set SVG width (adjust as needed)
                                                                    height: "250" // Set SVG height (adjust as needed)
                                                                }, [
                                                                    // Image element within SVG
                                                                    m("image", {
                                                                        href: "./undraw_add_information_j2wg.svg", // URL of the SVG image
                                                                        width: "200", // Set image width within SVG (adjust as needed)
                                                                        height: "200", // Set image height within SVG (adjust as needed)
                                                                        x: "25", // X position of the image within SVG canvas
                                                                        y: "25" // Y position of the image within SVG canvas
                                                                    }),
                                                                    // Text element below the image
                                                                    m("text", {
                                                                        x: "50%",
                                                                        y: "230",
                                                                        "text-anchor": "middle",
                                                                        fill: "black" // Text color
                                                                    }, "No Expenses recorded yet for " + formattedBusinessDate) // Text content
                                                                ]),
                                                                m("br"),
                                                                // Button element below the SVG and text
                                                                m(addExpense)
                                                            ])
                                                        ])


                                                    ] :

                                                        filteredExpenses.map((item) => {
                                                            // console.log(item)
                                                            return m("tr", {
                                                                style: { "cursor": "pointer" }
                                                            },
                                                                [
                                                                    !storeId ?
                                                                        m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                            [
                                                                                m("span.text-dark-75.font-weight-bolder.d-block.font-size-lg", {
                                                                                    "class": "text-dark-75 font-weight-bolder d-block font-size-lg"
                                                                                }, getStoreName(item.storeId))
                                                                            ]
                                                                        ) : "",
                                                                    m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span.text-dark-75.font-weight-bolder.d-block.font-size-lg", {
                                                                                "class": "text-dark-75 font-weight-bolder d-block font-size-lg"
                                                                            }, item.title)
                                                                        ]
                                                                    ),
                                                                    m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                formatCurrency(item.cost)
                                                                            )
                                                                        ]
                                                                    ),


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
                                                                                m(editExpense, { "pricing": item }),
                                                                                m('a', {
                                                                                    href: "javascript:void(0);",
                                                                                    "class": "btn btn-icon btn-light btn-hover-danger btn-sm", onclick() {
                                                                                        const options = {
                                                                                            method: 'DELETE',
                                                                                            url: `${url}/expenses/${item._id}`,
                                                                                            headers: {
                                                                                                'Content-Type': 'application/json',
                                                                                                'authorization': localStorage.getItem('token')
                                                                                            },
                                                                                        };

                                                                                        axios.request(options).then(function (response) {
                                                                                            console.log(response.data);
                                                                                            // window.location.reload()
                                                                                            vnode.state.expenses = vnode.state.expenses.filter(p => p._id != item._id)
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
                                    "Emergent Expenses"
                                ),
                            ]
                        ),
                        // m(addExpense)
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
                                                        m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 min-w-50px" }),
                                                        m("th", { "class": "p-0 min-w-50px" }),
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
                                                        m("th", { "class": "p-0 min-w-200px text-left" }, "Expense Reason"),
                                                        m("th", { "class": "p-0 min-w-50px text-right" }, "Cost"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Added By"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Date Added"),
                                                        m("th", { "class": "p-0 min-w-50px text-right" }, "Actions")
                                                    ]
                                                )
                                            ),
                                            m("tbody",
                                                [
                                                    filteredEmmergentExpenses.length == 0 ? [
                                                        m("tr", {
                                                            style: { textAlign: "center" } // Inline style for centering content
                                                        }, [
                                                            m("td", {
                                                                colspan: 4 // Spanning across all 3 columns
                                                            }, [
                                                                m("svg", {
                                                                    width: "250", // Set SVG width (adjust as needed)
                                                                    height: "250" // Set SVG height (adjust as needed)
                                                                }, [
                                                                    // Image element within SVG
                                                                    m("image", {
                                                                        href: "./undraw_add_information_j2wg.svg", // URL of the SVG image
                                                                        width: "200", // Set image width within SVG (adjust as needed)
                                                                        height: "200", // Set image height within SVG (adjust as needed)
                                                                        x: "25", // X position of the image within SVG canvas
                                                                        y: "25" // Y position of the image within SVG canvas
                                                                    }),
                                                                    // Text element below the image
                                                                    m("text", {
                                                                        x: "50%",
                                                                        y: "230",
                                                                        "text-anchor": "middle",
                                                                        fill: "black" // Text color
                                                                    }, "No Expenses recorded yet for " + formattedBusinessDate) // Text content
                                                                ]),
                                                                m("br"),
                                                                // Button element below the SVG and text
                                                                m(addExpense)
                                                            ])
                                                        ])


                                                    ] :
                                                        filteredEmmergentExpenses.map((item) => {
                                                            console.log(item)
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
                                                                    m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                        [
                                                                            m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                formatCurrency(item.cost)
                                                                            )
                                                                        ]
                                                                    ),


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
                                                                                m(editExpense, { "pricing": item }),
                                                                                m('a', {
                                                                                    href: "javascript:void(0);",
                                                                                    "class": "btn btn-icon btn-light btn-hover-danger btn-sm", onclick() {
                                                                                        const options = {
                                                                                            method: 'DELETE',
                                                                                            url: `${url}/expenses/${item._id}`,
                                                                                            headers: {
                                                                                                'Content-Type': 'application/json',
                                                                                                'authorization': localStorage.getItem('token')
                                                                                            },
                                                                                        };

                                                                                        axios.request(options).then(function (response) {
                                                                                            console.log(response.data);
                                                                                            // window.location.reload()
                                                                                            vnode.state.expenses = vnode.state.expenses.filter(p => p._id != item._id)
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

const pricingWrapper = {
    oninit(vnode) {
        vnode.state.stores = []
        vnode.state.pricings = []
        vnode.state.loading = true
    },
    view(vnode) {
        return m("div", { "class": "card card-custom gutter-b" }, [
            // m(categories),
            m(pricing)
        ])
    }
}

export default pricingWrapper

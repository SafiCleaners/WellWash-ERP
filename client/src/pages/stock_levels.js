import axios from "axios";


import {
    url
} from "../constants"

import m from "mithril"
import loader from "../components/loader"
import addStockAdjustment from "../components/add_stock_adjustment"
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
        vnode.state.pricings = []
        vnode.state.stockAdjustments= []
        vnode.state.expenses = []
        vnode.state.loading = true
    },
    oncreate(vnode) {
        // Define the Axios request configurations
        const pricingOptions = {
            method: 'GET',
            url: url + "/pricings",
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

        const stockAdjustmentOptions = {
            method: 'GET',
            url: url + "/stock-adjustments/" + localStorage.getItem("storeId"),
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            }
        };
    
        // Use Promise.all to execute both requests concurrently
        Promise.all([
            axios.request(pricingOptions),  // First Axios request for pricings
            axios.request(categoriesOptions), // Second Axios request for categories
            axios.request(stockAdjustmentOptions)
        ])
        .then(function (responses) {
            // Responses will be an array containing the resolved responses from both requests
            const pricingResponse = responses[0];
            const categoriesResponse = responses[1];
            const stockAdjustmentResponse = responses[2];
    
            // Update vnode.state with the retrieved data
            vnode.state.pricings = pricingResponse.data.filter(price=>{
                // console.log(price)
                price.store?._id == localStorage.getItem("storeId")
            });
            vnode.state.categories = categoriesResponse.data;
            vnode.state.stockAdjustments = stockAdjustmentResponse.data;
    
            // Set loading to false and trigger a redraw
            vnode.state.loading = false;
            m.redraw();
        })
        .catch(function (errors) {
            // Handle any errors that occurred in either request
            vnode.state.loading = false;
            m.redraw();
            console.error("Error fetching data:", errors);
        });
    },

    view(vnode) {
        const storeId = localStorage.getItem("storeId")
        const storeName = vnode.state.stores.find(s => s._id == storeId)?.title
        const getStoreName = (storeId) => vnode.state.stores.find(s => s._id == storeId)?.title

        const selectedDate = new Date(localStorage.getItem("businessDate"));
        const formattedBusinessDate = selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

        return m("div", { "class": "card card-custom gutter-b" },
            [
                m("div", { "class": "card-header border-0 pt-7" },
                    [
                        m("h3", { "class": "card-title align-items-start flex-column" },
                            [
                                m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                    "Stock Levels"
                                ),
                            ]
                        ),
                        m(addStockAdjustment)
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
                                                        m("th", { "class": "p-0 min-w-200px text-left" }, "Product"),
                                                        m("th", { "class": "p-0 min-w-200px text-left" }, "Quantity"),
                                                        m("th", { "class": "p-0 min-w-50px text-right" }, "Worth"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Added By"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Date Added"),
                                                        m("th", { "class": "p-0 min-w-50px text-right" }, "Actions")
                                                    ]
                                                )
                                            ),
                                            m("tbody",
                                                [
                                                    vnode.state.categories.length == 0 ? [
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
                                                                    }, "No adjustments yet for " + formattedBusinessDate) // Text content
                                                                ]),
                                                                m("br"),
                                                                // Button element below the SVG and text
                                                                m(addStockAdjustment)
                                                            ])
                                                        ])


                                                    ] :

                                                    vnode.state.pricings.map((item) => {
                                                            console.log(item)
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

import axios from "axios";
import m from "mithril";

import { url } from "../constants";
import loader from "../components/loader";
import addPricing from "../components/add_pricing";
import editPricing from "../components/edit_pricing";
import categories from "../pages/categories"; // For displaying the category management view

// Helper function to format currency safely
const formatCurrency = (number) => {
    if (typeof number !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US').format(number);
};

// Helper function to handle all initial data loading
const loadData = (vnode) => {
    vnode.state.loading = true;
    const brandId = localStorage.getItem('brand');
    if (!brandId) {
        console.warn("No brand selected in localStorage.");
        vnode.state.loading = false;
        return;
    }

    const pricingsRequest = axios.get(`${url}/pricings`, { headers: { authorization: localStorage.getItem('token') } });
    const categoriesRequest = axios.get(`${url}/categories`, { headers: { authorization: localStorage.getItem('token') } });

    Promise.all([pricingsRequest, categoriesRequest])
        .then(([pricingsResponse, categoriesResponse]) => {
            vnode.state.pricings = pricingsResponse.data;
            vnode.state.categories = categoriesResponse.data;

            // PERFORMANCE: Create a map for instantaneous category lookups
            vnode.state.categoryMap = vnode.state.categories.reduce((acc, category) => {
                acc[category.id] = category; // Store the whole category object
                return acc;
            }, {});
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            alert("Failed to load pricing data. Please check the console.");
        })
        .finally(() => {
            vnode.state.loading = false;
            m.redraw();
        });
};

// Helper function to handle deleting a pricing item
const deletePricing = (vnode, pricingId) => {
    if (!confirm("Are you sure you want to delete this pricing entry?")) return;

    axios.delete(`${url}/pricings/${pricingId}`, {
        headers: { authorization: localStorage.getItem('token') }
    }).then(() => {
        vnode.state.pricings = vnode.state.pricings.filter(p => p.id !== pricingId);
    }).catch(error => {
        console.error("Error deleting pricing:", error);
        alert("Failed to delete pricing entry.");
    }).finally(() => {
        m.redraw();
    });
};

const pricingPage = {
    oninit(vnode) {
        vnode.state.pricings = [];
        vnode.state.categories = [];
        vnode.state.categoryMap = {};
        vnode.state.loading = true;
    },

    oncreate: loadData,

    view(vnode) {
        const { loading, pricings, categoryMap } = vnode.state;
        const brandId = localStorage.getItem('brand');

        // Pre-filter the pricings using the fast categoryMap
        const filteredPricings = pricings.filter(pricing => {
            const category = categoryMap[pricing.category];
            return category && category.brand === brandId;
        });

        return m(".container-fluid", [
            // First Card for Category Management
            m(".card.card-custom.gutter-b", m(categories)),

            // Second Card for Pricing Management
            m(".card.card-custom.gutter-b", [
                m(".card-header.border-0.pt-7", [
                    m("h3.card-title.align-items-start.flex-column",
                        m("span.card-label.font-weight-bold.font-size-h4.text-dark-75", "Available Pricings")
                    ),
                    // Pass the onPricingAdded callback to the child component
                    m(addPricing, {
                        onPricingAdded: (newPricing) => {
                            vnode.state.pricings.unshift(newPricing);
                        }
                    })
                ]),
                m(".card-body.pt-0.pb-4",
                    m(".table-responsive",
                        loading
                            ? m(loader)
                            : m("table.table.table-borderless.table-vertical-center", [
                                m("thead", m("tr", [
                                    m("th.p-0.min-w-200px.text-left", "Category"),
                                    m("th.p-0.min-w-100px.text-left", "Title"),
                                    m("th.p-0.min-w-50px.text-right", "Cost"),
                                    m("th.p-0.min-w-50px.text-right", "Actions")
                                ])),
                                m("tbody", filteredPricings.map(item =>
                                    m("tr", { key: item.id }, [
                                        m("td.text-left",
                                            // Fast O(1) lookup for category title
                                            m("span.text-dark-75.font-weight-bolder", categoryMap[item.category]?.title || "Unknown Category")
                                        ),
                                        m("td.text-left",
                                            m("span.text-dark-75", item.title)
                                        ),
                                        m("td.text-right",
                                            m("span.text-dark-75.font-weight-bolder", formatCurrency(item.cost))
                                        ),
                                        m("td.text-right.pr-0", [
                                            // Pass pricing data and the onPricingUpdated callback
                                            m(editPricing, {
                                                pricing: item,
                                                onPricingUpdated: (updatedPricing) => {
                                                    const index = vnode.state.pricings.findIndex(p => p.id === updatedPricing.id);
                                                    if (index > -1) {
                                                        vnode.state.pricings[index] = updatedPricing;
                                                    }
                                                }
                                            }),
                                            m("a.btn.btn-icon.btn-light.btn-hover-danger.btn-sm", {
                                                onclick: () => deletePricing(vnode, item.id), // Use 'id'
                                                title: "Delete Pricing"
                                            }, m("i.flaticon2-rubbish-bin-delete-button"))
                                        ])
                                    ])
                                ))
                            ])
                    )
                )
            ])
        ]);
    }
};

export default pricingPage;
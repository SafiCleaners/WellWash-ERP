import axios from "axios";
import m from "mithril";

import { url } from "../constants"; // Assumes url is '/api'
import loader from "../components/loader";
import addStore from "../components/add_store";
import editStore from "../components/edit_store";

// Helper function to handle API loading and state updates
const loadData = (vnode) => {
    vnode.state.loading = true;

    const getStores = axios.get(`${url}/stores`, {
        headers: { authorization: localStorage.getItem('token') }
    });

    const getBrands = axios.get(`${url}/brands`, {
        headers: { authorization: localStorage.getItem('token') }
    });

    Promise.all([getStores, getBrands])
        .then(([storesResponse, brandsResponse]) => {
            vnode.state.stores = storesResponse.data;
            vnode.state.brands = brandsResponse.data;

            // PERFORMANCE: Create a map for quick brand name lookups (O(1) instead of O(n))
            vnode.state.brandMap = vnode.state.brands.reduce((acc, brand) => {
                acc[brand.id] = brand.title; // Use 'id'
                return acc;
            }, {});

        })
        .catch(error => {
            console.error("Error fetching data:", error);
            alert("Failed to load store data. Please check the console for details.");
        })
        .finally(() => {
            vnode.state.loading = false;
            m.redraw();
        });
};

// Helper function to handle updating a store's brand
const updateStoreBrand = (vnode, storeId, brandId) => {
    const options = {
        method: 'PATCH',
        url: `${url}/stores/${storeId}`, // CORRECTED: Plural 'stores' and uses 'id'
        headers: {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem('token')
        },
        data: { brand: brandId }
    };

    axios.request(options)
        .then(response => {
            // UX IMPROVEMENT: Update state directly instead of reloading the page
            const storeToUpdate = vnode.state.stores.find(s => s.id === storeId);
            if (storeToUpdate) {
                storeToUpdate.brand = brandId;
            }
        })
        .catch(error => {
            console.error("Error updating brand:", error);
            alert("Failed to update brand.");
        })
        .finally(() => {
            m.redraw(); // Redraw to reflect the change
        });
};

// Helper function to handle deleting a store
const deleteStore = (vnode, storeId) => {
    if (!confirm("Are you sure you want to delete this store?")) {
        return;
    }

    const options = {
        method: 'DELETE',
        url: `${url}/stores/${storeId}`, // CORRECTED: Uses 'id'
        headers: { authorization: localStorage.getItem('token') },
    };

    axios.request(options)
        .then(() => {
            vnode.state.stores = vnode.state.stores.filter(s => s.id !== storeId);
        })
        .catch(error => {
            console.error("Error deleting store:", error);
            alert("Failed to delete store.");
        })
        .finally(() => {
            m.redraw();
        });
};


const stores = {
    oninit(vnode) {
        vnode.state.stores = [];
        vnode.state.brands = [];
        vnode.state.brandMap = {}; // Map for brand titles
        vnode.state.loading = true;
    },

    oncreate(vnode) {
        loadData(vnode);
    },

    view(vnode) {
        const { loading, stores, brands, brandMap } = vnode.state;

        return m(".card.card-custom.gutter-b", [
            m(".card-header.border-0.pt-7", [
                m("h3.card-title.align-items-start.flex-column",
                    m("span.card-label.font-weight-bold.font-size-h4.text-dark-75", "Available Stores")
                ),
                m(addStore)
            ]),
            m(".card-body.pt-0.pb-4", [
                m(".table-responsive",
                    loading
                        ? m(loader)
                        : m("table.table.table-borderless.table-vertical-center", [
                            m("thead", m("tr", [
                                m("th.p-0.min-w-200px.text-left", "Title"),
                                m("th.p-0.min-w-150px.text-left", "Address"),
                                m("th.p-0.min-w-150px.text-left", "Brand"),
                                m("th.p-0.min-w-100px.text-left", "Phone"),
                                m("th.p-0.min-w-100px.text-left", "Email"),
                                // Removed unused columns for clarity, you can add them back if needed
                                m("th.p-0.min-w-50px.text-right", "Actions")
                            ])),
                            m("tbody", stores?.map(item =>
                                m("tr", { key: item.id }, [ // Use item.id for the key
                                    m("td.text-left", m("span.text-dark-75.font-weight-bolder", item.title)),
                                    m("td.text-left", m("span.text-dark-75", item.address)),
                                    m("td.text-left",
                                        m(".dropdown", [
                                            m("button.btn.btn-secondary.dropdown-toggle", { "data-toggle": "dropdown" },
                                                // Fast lookup from the brandMap
                                                brandMap[item.brand] || "Select a Brand"
                                            ),
                                            m(".dropdown-menu", brands?.map(brand =>
                                                m("a.dropdown-item", {
                                                    onclick: () => updateStoreBrand(vnode, item.id, brand.id)
                                                }, brand.title)
                                            ))
                                        ])
                                    ),
                                    m("td.text-left", m("span.text-dark-75", item.phone)),
                                    m("td.text-left", m("span.text-dark-75", item.email)),
                                    m("td.text-right.pr-0", [
                                        m(editStore, { brand: item }),
                                        m("a.btn.btn-icon.btn-light.btn-hover-danger.btn-sm", {
                                            onclick: () => deleteStore(vnode, item.id),
                                            title: "Delete Store"
                                        }, m("i.flaticon2-rubbish-bin-delete-button"))
                                    ])
                                ])
                            ))
                        ])
                )
            ])
        ]);
    }
};

export default stores;
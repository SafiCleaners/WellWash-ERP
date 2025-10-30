import axios from "axios";
import m from "mithril";
import { url } from "../constants";
import loader from "../components/loader";
import addPricing from "../components/add_pricing";
import editPricing from "../components/edit_pricing";
import addCategory from "../components/add_category";
import editCategory from "../components/edit_category";

// --- Helper Functions ---
const formatCurrency = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
};

const fetchData = (vnode) => {
    vnode.state.loading = true;
    const headers = { authorization: localStorage.getItem('token') };
    const get = (endpoint) => axios.get(`${url}/${endpoint}`, { headers });

    Promise.all([
        get('categories'),
        get('pricings')
    ]).then(([categoriesRes, pricingsRes]) => {
        const brandId = localStorage.getItem('brand');
        const categories = categoriesRes.data.filter(c => c.brand === brandId);
        const pricings = pricingsRes.data;

        vnode.state.categoriesWithPricings = categories.map(category => ({
            ...category,
            pricings: pricings.filter(p => p.category === category._id)
        }));

    }).catch(error => {
        console.error("Error fetching pricing data:", error);
    }).finally(() => {
        vnode.state.loading = false;
        m.redraw();
    });
};

const pricingPage = {
    oninit(vnode) {
        vnode.state.categoriesWithPricings = [];
        vnode.state.loading = true;
        vnode.state.expandedCategoryId = null;
        vnode.state.onUpdate = () => fetchData(vnode);
    },

    oncreate: fetchData,

    // --- Render Helper for the Timeline ---
    renderPricingTimeline(vnode, pricings, categoryId) {
        const { onUpdate } = vnode.state;
        return m(".timeline",
            pricings.map(item =>
                m(".timeline-item", [
                    m(".timeline-bullet"),
                    m(".timeline-content", [
                        m("div", [
                            m("span.fw-bold.text-gray-800.fs-6", item.title || `Price Point`),
                            m("div.text-muted", `Ksh ${formatCurrency(item.cost)}`)
                        ]),
                        m(".timeline-actions", [
                            m(editPricing, { pricing: item, onUpdate }),
                            m("a.btn.btn-icon.btn-light-danger.btn-sm.ms-2", {
                                onclick: () => {
                                    if (confirm("Are you sure?")) {
                                        axios.delete(`${url}/pricings/${item._id}`, { headers: { authorization: localStorage.getItem('token') } })
                                            .then(onUpdate).catch(err => console.error(err));
                                    }
                                }
                            }, m("i.fa.fa-trash"))
                        ])
                    ])
                ])
            ),
            m(".timeline-item", [
                m(".timeline-bullet.bg-primary"),
                m(".timeline-content", m(addPricing, { categoryId, onUpdate }))
            ])
        );
    },

    // --- Render Helper for each Category Row (Final Polished Design) ---
    renderCategoryRow(vnode, category) {
        const { expandedCategoryId, onUpdate } = vnode.state;
        const isExpanded = expandedCategoryId === category._id;

        return m(".pricing-category", [
            m(".category-header", {
                onclick: () => vnode.state.expandedCategoryId = isExpanded ? null : category._id
            }, [
                m(".category-title", [
                    m("i.category-chevron.fa", { class: isExpanded ? 'fa-chevron-down' : 'fa-chevron-right' }),
                    m("span.fw-bolder.fs-5", category.title),
                    m("span.text-muted.fs-7.ms-3", `(${category.unit})`)
                ]),
                m(".category-toolbar", [
                    m(editCategory, { category, onUpdate }),
                    m("a.btn.btn-icon.btn-light-danger.btn-sm.ms-2", {
                        onclick: (e) => {
                            e.stopPropagation();
                            if (confirm(`Delete category "${category.title}" and ALL its prices? This cannot be undone.`)) {
                                axios.delete(`${url}/categories/${category._id}`, { headers: { authorization: localStorage.getItem('token') } })
                                    .then(onUpdate).catch(err => console.error(err));
                            }
                        }
                    }, m("i.fa.fa-trash"))
                ])
            ]),

            isExpanded && m(".category-body",
                this.renderPricingTimeline(vnode, category.pricings, category._id)
            )
        ]);
    },

    // --- Main View ---
    view(vnode) {
        if (vnode.state.loading) {
            return m(loader);
        }

        const { categoriesWithPricings, onUpdate } = vnode.state;

        return m(".container-xxl.py-5", [
            m(".d-flex.justify-content-between.align-items-center.mb-5", [
                m("h1.fw-bolder", "Pricing Management"),
                m(addCategory, { onUpdate })
            ]),

            m(".card.shadow-sm",
                m(".card-body", 
                    categoriesWithPricings.length === 0
                        ? m(".text-center.p-10", [
                            m("img.img-fluid.mx-auto.mb-4", { src: "./undraw_add_information_j2wg.svg", style: { maxWidth: "250px" } }),
                            m("h4.fw-bold.text-gray-700", "No Categories Found for this Brand"),
                            m("p.text-muted", "Start by adding a new product category above.")
                          ])
                        : categoriesWithPricings.map(category => this.renderCategoryRow(vnode, category))
                )
            )
        ]);
    }
};

export default pricingPage;
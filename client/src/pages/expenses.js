import axios from "axios";
import m from "mithril";
import moment from "moment";
import { url } from "../constants";
import loader from "../components/loader";
import addExpense from "../components/add_expense";
import editExpense from "../components/edit_expense";

// --- Helper Functions ---
const formatCurrency = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
};

// --- Data Fetching Logic (Moved outside the component) ---
// By making this a standalone function, we solve the ReferenceError.
const fetchData = (vnode) => {
    vnode.state.loading = true;
    const headers = { 'authorization': localStorage.getItem('token') };
    const get = (endpoint) => axios.get(`${url}/${endpoint}`, { headers });

    Promise.all([
        get('expenses'),
        get('stores'),
        get('brands')
    ]).then(([expensesRes, storesRes, brandsRes]) => {
        vnode.state.expenses = expensesRes.data;
        vnode.state.stores = storesRes.data;
        vnode.state.brands = brandsRes.data;
    }).catch(error => {
        console.error("Error fetching data:", error);
    }).finally(() => {
        vnode.state.loading = false;
        m.redraw();
    });
};


const expensesPage = {
    oninit(vnode) {
        vnode.state.stores = [];
        vnode.state.brands = [];
        vnode.state.expenses = [];
        vnode.state.loading = true;
        
        // FIX: Now we can safely reference the standalone fetchData function.
        vnode.state.onUpdate = () => fetchData(vnode);
    },

    // FIX: Assign the standalone function directly to the oncreate hook.
    oncreate: fetchData,

    // --- Render Helper Functions ---
    renderEmptyState(vnode, dateStr) {
        return m("tr",
            m("td.text-center.p-5", { colspan: 6 }, [ // Increased colspan to 6 to match header
                m("img.img-fluid.mb-4", { src: "./undraw_add_information_j2wg.svg", style: { maxWidth: "200px" } }),
                m("h5.fw-bold.text-gray-700", `No Expenses Found`),
                m("p.text-muted", `There are no expenses recorded for ${dateStr}`),
            ])
        );
    },

    renderTable(vnode, title, expenses, isRecurrent = false) {
        const { stores, onUpdate } = vnode.state;
        const storeId = localStorage.getItem("storeId");
        const getStoreName = (id) => stores.find(s => s._id === id)?.title || 'N/A';
        const businessDate = moment(localStorage.getItem("businessDate")).format('MMM D');
        
        return m(".card.shadow-sm.mb-5", [
            m(".card-header.border-0.pt-7.d-flex.justify-content-between.align-items-center", [
                m("h3.card-title.align-items-start.flex-column", [
                    m("span.card-label.fw-bolder.text-dark", title),
                    m("span.text-muted.mt-1.fw-semibold.fs-7", 
                        isRecurrent ? "Expenses that occur regularly" : `One-time expenses for ${businessDate}`
                    )
                ]),
                m(addExpense, { onUpdate }) // "Add Expense" is now on both tables for better UX
            ]),
            m(".card-body.pt-2.pb-4", 
                m(".table-responsive",
                    m("table.table.table-row-dashed.align-middle.gs-0.gy-4", [
                        m("thead",
                            m("tr.fw-bolder.text-muted.bg-light", [
                                !storeId && m("th.ps-4.rounded-start", "Store"),
                                m(`th.${storeId ? 'ps-4 rounded-start' : ''}`, "Expense Reason"),
                                m("th.text-end", "Cost"),
                                m("th.text-end", "Added By"),
                                m("th.text-end", "Date Added"),
                                m("th.text-end.rounded-end", "Actions")
                            ])
                        ),
                        m("tbody",
                            expenses.length === 0 
                            ? this.renderEmptyState(vnode, businessDate)
                            : expenses.map(item => m("tr", { key: item._id }, [
                                !storeId && m("td.ps-4", m("span.text-dark.fw-bold.d-block.mb-1.fs-6", getStoreName(item.storeId))),
                                m(`td.${storeId ? 'ps-4' : ''}`, m("span.text-dark.fw-bold.d-block.mb-1.fs-6", item.title)),
                                m("td.text-end", m("span.text-dark.fw-bold.d-block.mb-1.fs-6", `Ksh ${formatCurrency(item.cost)}`)),
                                m("td.text-end", m("span.text-muted.fw-semibold", item.userTitle || 'N/A')),
                                m("td.text-end", m("span.text-muted.fw-semibold", item.createdAtFormatted)),
                                m("td.text-end", [
                                    m(editExpense, { expense: item, onUpdate }), 
                                    m("a.btn.btn-icon.btn-light-danger.btn-sm.ms-2", {
                                        onclick: () => {
                                            if (confirm("Are you sure you want to delete this expense?")) {
                                                axios.delete(`${url}/expenses/${item._id}`, { headers: { 'authorization': localStorage.getItem('token') } })
                                                .then(() => onUpdate())
                                                .catch(err => console.error(err));
                                            }
                                        }
                                    }, m("i.fa.fa-trash"))
                                ])
                            ]))
                        )
                    ])
                )
            )
        ]);
    },

    view(vnode) {
        if (vnode.state.loading) {
            return m(loader);
        }

        const brandId = localStorage.getItem("brand");
        const storeId = localStorage.getItem("storeId");
        const businessDate = moment(localStorage.getItem("businessDate"));
        const storesById = new Map(vnode.state.stores.map(s => [s._id, s]));

        const isVisible = (expense) => {
            const store = storesById.get(expense.storeId);
            if (!store || store.brand !== brandId) return false;
            if (storeId && expense.storeId !== storeId) return false;
            return true;
        };
        
        const filteredRecurrent = vnode.state.expenses.filter(e => e.recurrent && isVisible(e));
        const filteredEmergent = vnode.state.expenses.filter(e => 
            !e.recurrent && isVisible(e) && moment(e.businessDate).isSame(businessDate, 'day')
        );

        return m(".container-xxl.py-5", [ // Added a container for better spacing
            this.renderTable(vnode, "Emergent Expenses", filteredEmergent, false),
            this.renderTable(vnode, "Recurrent Expenses", filteredRecurrent, true)
        ]);
    }
};

export default expensesPage;
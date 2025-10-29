import m from "mithril";
import axios from "axios";
import moment from "moment";
import { url } from "../constants";
import loader from "../components/loader";
import incrementableInput from "../components/input"; // Assuming this is your existing incrementableInput

/**
 * Reusable FormField Component
 * A clean, responsive text input field with a Font Awesome icon.
 */
const FormField = {
    view: ({ attrs: { label, value, oninput, icon, placeholder, type = 'text' } }) => m(".col-12.col-md-6.col-lg-6.mb-4", [
        m("label.form-label.fw-bold", label),
        m(".input-group", [
            m("span.input-group-text", m(`i.fas.${icon}`)),
            m("input.form-control", {
                type,
                placeholder: placeholder || label,
                value,
                oninput: (e) => oninput(e.target.value)
            })
        ])
    ])
};

/**
 * Main Order Item Page Component
 */
const OrderItemPage = () => {
    // --- STATE MANAGEMENT ---
    let loading = true;
    let isSaving = false;
    let errorMessage = null;

    let order = {}; // All order data will live in this single object
    let pricings = [];
    let categories = [];
    let categoryMap = {}; // For fast lookups

    // --- DATA HANDLING & LOGIC ---

    const handleInputChange = (field, value) => {
        order[field] = value;
        // You can add auto-saving logic here if desired
    };

    const calculateTotalCost = () => {
        const { categoryAmounts = {}, categoryCharges = {} } = order;
        return Object.keys(categoryAmounts).reduce((total, categoryId) => {
            const amount = parseFloat(categoryAmounts[categoryId]) || 0;
            const charge = parseFloat(categoryCharges[categoryId]) || 0;
            return total + (amount * charge);
        }, 0);
    };
    
    const updateStatus = (newStatus) => {
        const newStatusEntry = { status: newStatus, createdAt: new Date() };
        order.statusInfo = [newStatusEntry, ...(order.statusInfo || [])];
        
        // Optionally auto-save on status change
        saveOrder().catch(err => console.error("Auto-save on status change failed", err));
    };

    const loadData = () => {
        const jobId = m.route.param("job");
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'authorization': token };
        
        const jobRequest = jobId ? axios.get(`${url}/jobs/${jobId}`, { headers }) : Promise.resolve({ data: {} });
        const pricingsRequest = axios.get(`${url}/pricings`, { headers });
        const categoriesRequest = axios.get(`${url}/categories`, { headers });

        Promise.all([jobRequest, pricingsRequest, categoriesRequest])
            .then(([jobResponse, pricingsResponse, categoriesResponse]) => {
                // Initialize order with default values, then merge fetched data
                const defaultOrder = {
                    pickupTime: '10am-11am',
                    dropOffTime: '10am-11am',
                    statusInfo: [],
                    paid: false,
                    skipSms: true,
                    categoryAmounts: {},
                    categoryCharges: {}
                };
                order = { ...defaultOrder, ...jobResponse.data };

                pricings = pricingsResponse.data;
                categories = categoriesResponse.data;
                categoryMap = categories.reduce((map, cat) => {
                    map[cat._id] = cat;
                    return map;
                }, {});
            })
            .catch(err => {
                console.error("Failed to load data:", err);
                errorMessage = "Could not load order data. Please refresh the page.";
            })
            .finally(() => {
                loading = false;
                m.redraw();
            });
    };

    const saveOrder = () => {
        isSaving = true;
        errorMessage = null;
        m.redraw();

        const token = localStorage.getItem('token');
        const jobId = order._id || "null"; // Use existing ID or "null" for creation

        return axios({
            method: 'PATCH',
            url: `${url}/jobs/${jobId}`,
            headers: { 'Content-Type': 'application/json', 'authorization': token },
            data: {
                ...order,
                businessDate: localStorage.getItem('businessDate'),
                storeId: localStorage.getItem('storeId'),
            }
        }).then(response => {
            // Update local order state with response from server (e.g., new _id)
            order = { ...order, ...response.data };
            console.log("Order saved successfully:", response.data);
            // Optionally redirect after save
            // m.route.set("/j");
        }).catch(err => {
            console.error("Failed to save order:", err);
            errorMessage = "Could not save the order. Please try again.";
            throw err; // re-throw to allow further promise chaining if needed
        }).finally(() => {
            isSaving = false;
            m.redraw();
        });
    };

    // --- VIEW HELPERS (for cleaner main view) ---

    const viewHeader = () => {
        if (!order.clientName) return null;
        
        const totalCost = calculateTotalCost();

        return m(".d-flex.flex-wrap.align-items-center.justify-content-between.p-4.border-bottom", [
            m(".d-flex.flex-column", [
                m("h4.fw-bold", `${order.clientName} (${order.phone || 'No Phone'})`),
                m("span.text-muted", `${order.appartmentName || 'N/A'}, House: ${order.houseNumber || 'N/A'}`)
            ]),
            m(".d-flex.flex-column.text-end", [
                m("h4.fw-bold", `KSH ${totalCost.toLocaleString()}`),
                m("span.badge", {
                    class: order.paid ? 'bg-success text-white' : 'bg-warning text-dark'
                }, order.paid ? "Paid" : "Not Paid")
            ]),
        ]);
    };
    
    const viewCustomerDetails = () => m(".p-4.border-bottom", [
        m("h5.mb-4", [m("i.fas.fa-user-edit.me-2"), "Customer Details"]),
        m(".row", [
            m(FormField, { label: "Customer Name", value: order.clientName, oninput: v => handleInputChange('clientName', v), icon: "fa-user" }),
            m(FormField, { label: "Phone Number", value: order.phone, oninput: v => handleInputChange('phone', v), icon: "fa-phone", type: 'tel' }),
            m(FormField, { label: "Apartment Name", value: order.appartmentName, oninput: v => handleInputChange('appartmentName', v), icon: "fa-building" }),
            m(FormField, { label: "House Number", value: order.houseNumber, oninput: v => handleInputChange('houseNumber', v), icon: "fa-hashtag" })
        ])
    ]);

    const viewPricingCalculator = () => m(".p-4.border-bottom", [
        m("h5.mb-4", [m("i.fas.fa-calculator.me-2"), "Pricing Calculator"]),
        m(".row",
            categories.filter(cat => cat.brand === localStorage.getItem('brand')).map(category =>
                m(incrementableInput, {
                    key: category._id,
                    name: category.title,
                    charge: order.categoryCharges[category._id] || 0,
                    amount: order.categoryAmounts[category._id] || 0,
                    pricing: pricings
                        .filter(p => p.category === category._id)
                        .map(p => ({ amount: p.cost, label: p.cost })),
                    onChange: ({ amountValue, chargeValue }) => {
                        order.categoryCharges[category._id] = chargeValue;
                        order.categoryAmounts[category._id] = amountValue;
                    },
                    pickerSize: 12, // Full width on small screens
                    pickerSizeMD: 6, // Half width on medium screens
                    pickerSizeLG: 4  // One-third width on large screens
                })
            )
        ),
        m(".text-end.mt-4", [
            m("h3.display-4", `Total: KSH ${calculateTotalCost().toLocaleString()}`)
        ])
    ]);

    const viewStatusUpdater = () => {
        const statuses = [
            { status: "PICK_UP", label: 'Pick Up', icon: 'fa-box' },
            { status: "COLLECTED", label: 'Collected', icon: 'fa-people-carry-box' },
            { status: "PROCESSING", label: 'Processing', icon: 'fa-sync fa-spin' },
            { status: "QUALITY_CHECK", label: 'Quality Check', icon: 'fa-check-double' },
            { status: "DISPATCH", label: 'Dispatch', icon: 'fa-truck-fast' },
            { status: "DELIVERED", label: 'Delivered', icon: 'fa-house-user' },
            { status: "BLOCKED", label: 'Blocked', icon: 'fa-ban' }
        ];
        const currentStatus = order.statusInfo?.[0]?.status;

        return m(".p-4.border-bottom", [
            m("h5.mb-3", [m("i.fas.fa-tasks.me-2"), "Update Status"]),
            m(".btn-group.flex-wrap", { role: "group" },
                statuses.map(({ status, label, icon }) =>
                    m("button.btn.d-flex.align-items-center", {
                        class: currentStatus === status ? "btn-primary" : "btn-outline-secondary",
                        onclick: () => updateStatus(status)
                    }, [ m(`i.fas.${icon}.me-2`), label ])
                )
            )
        ]);
    };
    
    const viewAdditionalInfo = () => m(".p-4.border-bottom", [
        m(".row", [
            // --- Left Column: Payment Details ---
            m(".col-12.col-md-6.mb-6", [
                // Section Header
                m("h5.fw-bolder.d-flex.align-items-center.mb-3", [
                    m("i.fas.fa-file-invoice-dollar.text-primary.me-2"),
                    m("span.badge.bg-light-primary.text-primary.me-2", "Payment"),
                    "Details"
                ]),
    
                // M-Pesa Code Input
                m(FormField, {
                    label: "M-Pesa Confirmation Code",
                    value: order.mpesaConfirmationCode,
                    oninput: v => handleInputChange('mpesaConfirmationCode', v),
                    icon: "fa-key", // Font Awesome key icon
                    placeholder: "e.g., QWERTY12345"
                }),
    
                // "Mark as Paid" Toggle Switch
                m(".form-check.form-switch.form-check-custom.form-check-solid.mt-4", [
                    m("input.form-check-input", {
                        type: "checkbox",
                        id: "paidSwitch",
                        checked: order.paid,
                        onchange: (e) => handleInputChange('paid', e.target.checked)
                    }),
                    m("label.form-check-label.fw-bold.ms-2", {
                        for: "paidSwitch"
                    }, "Mark as Paid")
                ])
            ]),
    
            // --- Right Column: More Details ---
            m(".col-12.col-md-6.mb-4", [
                // Section Header
                m("h5.fw-bolder.d-flex.align-items-center.mb-3", [
                    m("i.fas.fa-sticky-note.text-secondary.me-2"),
                    m("span.badge.bg-light-secondary.text-secondary.me-2", "More"),
                    "Details"
                ]),
    
                // Textarea for additional notes
                m("textarea.form-control.form-control-solid", {
                    rows: 6, // Increased rows for a larger text area
                    placeholder: "Add any extra notes, special instructions, or client feedback here...",
                    value: order.moreDetails,
                    oninput: (e) => handleInputChange('moreDetails', e.target.value)
                })
            ])
        ])
    ]);
    
    const viewActions = () => m(".p-4.d-flex.justify-content-between.align-items-center", [
        m(".form-check.form-switch", [
             m("input.form-check-input", {
                type: "checkbox",
                id: "smsSwitch",
                checked: order.skipSms,
                onchange: (e) => handleInputChange('skipSms', !e.target.checked)
            }),
            m("label.form-check-label.ms-2", { for: "smsSwitch" }, "Send SMS Updates")
        ]),
        m(".btn-group", [
             m("button.btn.btn-outline-secondary", { 
                onclick: () => m.route.set(`/j/${order._id}/print`),
                disabled: !order._id
             }, [ m("i.fas.fa-print.me-2"), "Print" ]),
             m("button.btn.btn-primary", { 
                onclick: saveOrder,
                disabled: isSaving
             }, [
                isSaving ? m("span.spinner-border.spinner-border-sm.me-2") : m("i.fas.fa-save.me-2"),
                isSaving ? "Saving..." : "Save Order"
            ])
        ])
    ]);


    // --- MAIN RENDER ---
    return {
        oninit: loadData,
        view: () => {
            if (loading) return m(loader);
            if (errorMessage) return m(".alert.alert-danger.m-4", errorMessage);

            return m(".card.card-custom.shadow-sm.m-2.m-md-4", [
                viewHeader(),
                viewCustomerDetails(),
                viewPricingCalculator(),
                viewStatusUpdater(),
                viewAdditionalInfo(),
                viewActions()
            ]);
        }
    };
};

export default OrderItemPage;
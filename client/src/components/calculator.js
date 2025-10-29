import m from "mithril";
import axios from "axios";
import moment from "moment";
import { url, operationTimes } from "../constants";
import dayRangeCalculator from "../dateCalculator";
import loader from "../components/loader";
import incrementableInput from "../components/input"; // Assuming this is your pricing calculator component

/**
 * Reusable, responsive form field component with Font Awesome icons.
 */
const FormField = {
    view: ({ attrs: { label, value, oninput, icon, placeholder, type = 'text' } }) => m(".col-12.col-md-6.mb-4", [
        m("label.form-label.fw-bold", label),
        m(".input-group", [
            m("span.input-group-text", m(`i.fas.${icon}`)),
            m("input.form-control", {
                type,
                placeholder: placeholder || `Enter ${label}...`,
                value,
                oninput: (e) => oninput(e.target.value)
            })
        ])
    ])
};

/**
 * Main Order Calculator Page Component
 */
const OrderCalculatorPage = () => {
    // --- STATE MANAGEMENT ---
    let loading = true;
    let isSaving = false;
    let errorMessage = null;

    let order = {}; // All form data lives here
    let pricings = [];
    let categories = [];
    let isInternalUser = ['OWNER', 'INTERNAL'].includes(localStorage.getItem('role'));

    // --- LOGIC & DATA HANDLING ---

    const handleInputChange = (field, value) => {
        order[field] = value;
    };

    const calculateTotalCost = () => {
        const { categoryAmounts = {}, categoryCharges = {} } = order;
        return Object.keys(categoryAmounts).reduce((total, categoryId) => {
            const amount = parseFloat(categoryAmounts[categoryId]) || 0;
            const charge = parseFloat(categoryCharges[categoryId]) || 0;
            return total + (amount * charge);
        }, 0);
    };

    const loadInitialData = () => {
        // Start with a clean default order structure, merged with any cached data
        const cachedOrder = JSON.parse(localStorage.getItem("activeOrder")) || {};
        const defaultOrder = {
            pickupDay: moment().format('L'),
            dropOffDay: moment().add(1, 'days').format('L'),
            pickupTime: '10am-11am',
            dropOffTime: '10am-11am',
            statusInfo: [{ status: "LEAD", createdAt: new Date() }],
        };
        order = { ...defaultOrder, ...cachedOrder };
        
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'authorization': token };

        Promise.all([
            axios.get(`${url}/pricings`, { headers }),
            axios.get(`${url}/categories`, { headers })
        ]).then(([pricingsResponse, categoriesResponse]) => {
            pricings = pricingsResponse.data;
            categories = categoriesResponse.data;
        }).catch(err => {
            console.error("Failed to load pricing/category data:", err);
            errorMessage = "Could not load pricing data. Please refresh.";
        }).finally(() => {
            loading = false;
            m.redraw();
        });
    };

    const saveOrder = () => {
        isSaving = true;
        errorMessage = null;
        m.redraw();

        const token = localStorage.getItem('token');
        const method = order._id ? 'PATCH' : 'POST';
        const endpoint = order._id ? `${url}/jobs/${order._id}` : `${url}/jobs`;

        const payload = {
            ...order,
            googleId: localStorage.getItem('googleId'),
            userId: localStorage.getItem('googleId'),
            storeId: localStorage.getItem('storeId'),
            name: order.name || localStorage.getItem("name"),
        };

        axios({ method, url: endpoint, headers: { 'Content-Type': 'application/json', authorization: token }, data: payload })
            .then(response => {
                console.log("Order saved successfully:", response.data);
                
                // Clear local cache and redirect
                localStorage.removeItem("activeOrder");
                localStorage.removeItem("activeOrderId");

                if (isInternalUser) {
                    // For internal users, go to the job details page
                    m.route.set(`/j/${response.data._id || order._id}`);
                } else {
                    // For customers, go to a thank you page
                    m.route.set("/thankyou", { orderId: response.data._id });
                }
            })
            .catch(err => {
                console.error("Failed to save order:", err);
                errorMessage = "An error occurred while saving. Please try again.";
            })
            .finally(() => {
                isSaving = false;
                m.redraw();
            });
    };

    // --- VIEW HELPERS ---

    const viewCustomerDetails = () => m(".p-4.border-bottom", [
        m("h5.mb-4", [m("i.fas.fa-user-circle.me-2"), "Your Details"]),
        m(".row", [
            !localStorage.getItem('authToken') && m(FormField, { label: "Your Name", value: order.name, oninput: v => handleInputChange('name', v), icon: "fa-user" }),
            isInternalUser && m(FormField, { label: "Client's Name", value: order.clientName, oninput: v => handleInputChange('clientName', v), icon: "fa-user-tag" }),
            m(FormField, { label: "Contact Phone", value: order.phone, oninput: v => handleInputChange('phone', v), icon: "fa-phone", type: "tel" }),
        ])
    ]);

    const viewSchedulePicker = () => m(".p-4.border-bottom", [
        m("h5.mb-4", [m("i.fas.fa-calendar-alt.me-2"), "Schedule Pickup & Drop-off"]),
        m(".row", [
            // Pickup
            m(".col-12.col-lg-6.mb-4", [
                m("label.form-label.fw-bold", "Pickup Date"),
                m(".btn-group.flex-wrap", dayRangeCalculator().map(({ dayName, day, nth, date }) =>
                    m("button.btn", {
                        class: order.pickupDay === date.format('L') ? "btn-primary" : "btn-outline-secondary",
                        disabled: date.day() === 0,
                        onclick: () => {
                            handleInputChange('pickupDay', date.format('L'));
                            // Auto-adjust drop-off date
                            const newDropOff = moment(date).add(1, 'days');
                            if (newDropOff.day() === 0) newDropOff.add(1, 'days');
                            handleInputChange('dropOffDay', newDropOff.format('L'));
                        }
                    }, `${dayName} ${day}${nth}`)
                )),
                m("label.form-label.fw-bold.mt-3", "Pickup Time"),
                m("select.form-select", { onchange: (e) => handleInputChange('pickupTime', e.target.value) },
                    operationTimes.map(time => m("option", { selected: order.pickupTime === time }, time))
                )
            ]),
            // Drop-off
            m(".col-12.col-lg-6.mb-4", [
                m("label.form-label.fw-bold", "Drop-off Date"),
                m(".btn-group.flex-wrap", dayRangeCalculator(order.pickupDay).map(({ dayName, day, nth, date }) =>
                     m("button.btn", {
                        class: order.dropOffDay === date.format('L') ? "btn-primary" : "btn-outline-secondary",
                        disabled: date.day() === 0,
                        onclick: () => handleInputChange('dropOffDay', date.format('L'))
                    }, `${dayName} ${day}${nth}`)
                )),
                m("label.form-label.fw-bold.mt-3", "Drop-off Time"),
                m("select.form-select", { onchange: (e) => handleInputChange('dropOffTime', e.target.value) },
                     operationTimes.map(time => m("option", { selected: order.dropOffTime === time }, time))
                )
            ]),
        ])
    ]);
    
    const viewPricingCalculator = () => m(".p-4.border-bottom", [
        m("h5.mb-4", [m("i.fas.fa-tshirt.me-2"), "Laundry Items"]),
        m(".row",
            categories.filter(cat => cat.brand === localStorage.getItem('brand')).map(category =>
                m(incrementableInput, {
                    key: category._id,
                    name: category.title,
                    charge: order.categoryCharges?.[category._id] || 0,
                    amount: order.categoryAmounts?.[category._id] || 0,
                    pricing: pricings
                        .filter(p => p.category === category._id)
                        .map(p => ({ amount: p.cost, label: p.cost })),
                    onChange: ({ amountValue, chargeValue }) => {
                        if (!order.categoryCharges) order.categoryCharges = {};
                        if (!order.categoryAmounts) order.categoryAmounts = {};
                        order.categoryCharges[category._id] = chargeValue;
                        order.categoryAmounts[category._id] = amountValue;
                    },
                    pickerSize: 12, pickerSizeMD: 6, pickerSizeLG: 4 // Responsive columns
                })
            )
        ),
         m(".text-end.mt-4.pe-3", [
            m("h3.display-4", `Estimate: KSH ${calculateTotalCost().toLocaleString()}`)
        ])
    ]);

    const viewActions = () => m(".p-4.bg-light", [
         m(".row.align-items-center", [
            m(".col-12.col-md-8.mb-3.mb-md-0", [
                m("label.form-label.fw-bold", "Additional Details or Instructions"),
                m("textarea.form-control", {
                    rows: 3,
                    placeholder: "e.g., Please call upon arrival, gate code is 1234...",
                    value: order.moreDetails,
                    oninput: (e) => handleInputChange('moreDetails', e.target.value)
                })
            ]),
            m(".col-12.col-md-4.text-md-end", [
                 m("button.btn.btn-primary.btn-lg.w-100", { 
                    onclick: saveOrder,
                    disabled: isSaving
                 }, [
                    isSaving ? m("span.spinner-border.spinner-border-sm.me-2") : m("i.fas.fa-paper-plane.me-2"),
                    isSaving ? "Submitting..." : "Submit Order"
                ])
            ])
         ]),
         errorMessage && m(".alert.alert-danger.mt-4", errorMessage)
    ]);


    // --- MAIN RENDER FUNCTION ---
    return {
        oninit: loadInitialData,
        view: () => {
            if (loading) return m(loader);
            
            return m(".card.card-custom.shadow-sm.m-2.m-md-4", [
                m(".card-header.bg-light", m("h2.card-title.p-3", "Create a New Laundry Order")),
                m(".card-body.p-0", [
                    viewCustomerDetails(),
                    viewSchedulePicker(),
                    viewPricingCalculator(),
                    viewActions()
                ])
            ]);
        }
    };
};

export default OrderCalculatorPage;
import axios from "axios";
import m from "mithril";
import { url } from "../constants";

const AddPricingForm = () => {
    // --- State Variables ---
    let showModal = false;
    let loading = true;
    let submitting = false;
    let categories = [];
    let formData = {
        category: '',
        cost: ''
    };
    let errorMessage = '';

    // --- Lifecycle Hook: oninit ---
    // Fetches categories when the component is initialized.
    const oninit = () => {
        const token = localStorage.getItem('token');
        const brandId = localStorage.getItem('brand');

        const options = {
            headers: { 'authorization': token }
        };

        axios.get(`${url}/categories?brand=${brandId}`, options)
            .then((response) => {
                categories = response.data;
                // Set a default category in the form if categories exist
                if (categories.length > 0) {
                    formData.category = categories[0]._id;
                }
            })
            .catch((error) => {
                console.error("Failed to fetch categories:", error);
                errorMessage = "Could not load categories. Please try again.";
            })
            .finally(() => {
                loading = false;
                m.redraw();
            });
    };

    // --- Helper Functions ---
    const openModal = () => {
        showModal = true;
        errorMessage = ''; // Clear any previous errors
    };

    const closeModal = () => {
        showModal = false;
    };

    const handleInputChange = (field, value) => {
        formData[field] = value;
        errorMessage = ''; // Clear error on new input
    };

    const handleSubmit = () => {
        submitting = true;
        
        // CHANGED: Convert cost to a number for validation and submission
        const costAsNumber = parseFloat(formData.cost);

        // CHANGED: Added validation for the form data
        if (!formData.category || isNaN(costAsNumber) || costAsNumber <= 0) {
            errorMessage = "Please select a category and enter a valid price.";
            submitting = false; // Stop submission
            m.redraw();
            return;
        }

        const payload = {
            ...formData,
            cost: costAsNumber, // Use the converted number
            brand: localStorage.getItem('brand')
        };

        const options = {
            method: 'POST',
            url: `${url}/pricings/`,
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
            data: payload, // Send the payload with the correct data type
        };

        axios.request(options).then(() => {
            // Success: reload the page to show the new data
            location.reload();
        }).catch((error) => {
            console.error("Form submission error:", error);
            errorMessage = "Failed to save pricing. Please try again.";
        }).finally(() => {
            submitting = false;
            m.redraw();
        });
    };

    // --- View ---
    return {
        oninit: oninit,
        view: (vnode) => {
            // The addPricing component now accepts a callback to update the parent
            const { onPricingAdded } = vnode.attrs;

            return m('div', [
                m('button.btn.btn-sm.btn-info', {
                    onclick: openModal,
                    disabled: loading
                }, [
                    m("i.flaticon-add-circular-button"),
                    loading ? " Loading..." : " Add Pricing"
                ]),

                showModal && m('.modal', [
                    m('.modal-content', [
                        m(".row", [
                            m(".col-11", m('h4', 'Add Pricing')),
                            m(".col-1", m('span.close', { onclick: closeModal }, '×')),
                            
                            m("span.border-bottom.mb-4"),

                            m(".col-6.my-2", [
                                m('label', 'Select Category:'),
                                m('select.form-control.form-control-solid', {
                                    value: formData.category,
                                    onchange: (e) => handleInputChange('category', e.target.value),
                                    disabled: categories.length === 0
                                }, [
                                    categories.length === 0
                                        ? m('option', 'Loading categories...')
                                        : categories.map((c) => m('option', { value: c._id }, c.title))
                                ]),
                            ]),

                            m(".col-6.my-2", [
                                m('label', 'Price (Cost):'),
                                // CHANGED: Input type is now 'number'
                                m('input[type=number].form-control.form-control-solid', {
                                    placeholder: "Enter Price in KSH",
                                    value: formData.cost,
                                    oninput: (e) => handleInputChange('cost', e.target.value),
                                }),
                            ]),

                            errorMessage && m(".col-12.mt-2.text-danger", errorMessage),

                            m("span.border-top.mt-4"),

                            m(".pt-2.align-right", [
                                m('button.btn.btn-danger.font-weight-bolder.font-size-sm.px-6.mr-3', { onclick: closeModal }, 'Close'),
                                m('button.btn.btn-info.font-weight-bolder.font-size-sm.px-6', {
                                    onclick: handleSubmit,
                                    disabled: submitting
                                }, submitting ? 'Saving...' : 'Save'),
                            ])
                        ]),
                    ]),
                ]),
            ]);
        },
    };
};

export default AddPricingForm;
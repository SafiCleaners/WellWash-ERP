import axios from "axios";

import {
    url,
    unitTypes
} from "../constants"

import m from "mithril"


const EditPricingForm = {
    oninit: function(vnode) {
        // Access props from vnode.attrs
        this.props = vnode.attrs;
        this.formData = {
            id: this.props.pricing._id,
            title: this.props.pricing.title,
            unit: this.props.pricing.unit,
            cost: this.props.pricing.cost,
        }
    },

    showModal: false,
    unitType: '',
    formData: {},

    openModal: function () {
        this.showModal = true;
    },

    closeModal: function () {
        this.showModal = false;
    },

    handleInputChange: function (field, value) {
        this.formData[field] = value;
    },

    handleSubmit: function () {
        // Handle form submission logic here
        console.log('Form Submitted:', this.formData);

        const options = {
            method: 'PATCH',
            url: `${url}/pricings/${this.formData.id}`,
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
            data: this.formData,
        };

        axios.request(options).then(function (response) {
            console.log(response.data);
            location.reload();
        }).catch(function (error) {
            console.error(error);
        });

        // Close the modal after submission
        // this.closeModal();
    },

    view: function () {
        return m('span', [
            // Open Modal Button
            m('button', { "class": "btn btn-icon btn-light btn-hover-primary btn-sm mr-2", onclick: () => this.openModal() }, m('icon', { "class": "flaticon-edit" })),

            // Modal
            this.showModal && m('.modal', [
                m('.modal-content', [
                    m("div", { "class": "row" }, [
                        m("div", { "class": "col-11" }, [
                            m('h4', 'Edit Pricing'),
                        ]),
                        m("div", { "class": "col-1" }, [
                            m('span', { onclick: () => this.closeModal(), class: 'close' }, 'x'),
                        ]),
                        m("span", { "class": "border-bottom mb-4" }),
                        m("div", { "class": "col-12 my-2" }, [
                            m('label', 'Title:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100 rounded",
                                "placeholder": "Enter title",
                                value: this.formData.title,
                                oninput: (e) => this.handleInputChange('title', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', 'Select unit:'),
                            m('select', {
                                "class": "py-2 w-100 rounded",
                                value: this.formData.unit,
                                onchange: (e) => this.handleInputChange('unit', e.target.value),
                            }, [
                                unitTypes.map(unit => { return m('option', { value: unit }, unit) }),
                            ]),
                        ]),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', 'Cost:'),
                            m('input[type=number]', {
                                "class": "py-2 px-3 w-100 rounded",
                                "placeholder": "Enter cost",
                                value: this.formData.cost,
                                oninput: (e) => this.handleInputChange('cost', e.target.value),
                            }),
                        ]),
                        m("span", { "class": "border-top mt-4" }),
                        m("div", { "class": "pt-2 align-right" }, [
                            m('button', { "class": "btn btn-danger font-weight-bolder font-size-sm px-6 mr-3", onclick: () => this.closeModal() }, 'Close'),
                            m('button', { "class": "btn btn-info font-weight-bolder font-size-sm px-6", onclick: () => this.handleSubmit() }, 'Save Changes'),
                        ])
                    ]),
                ]),
            ]),
        ]);
    },
};

export default EditPricingForm;

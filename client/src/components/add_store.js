import axios from "axios";

import {
    url,
} from "../constants"

import m from "mithril"


const AddStoreForm = {
    showModal: false,
    unitType: '',
    formData: {
        title: '',
        address: '',
        phone: '',
        email: '',
    },

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
            method: 'POST',
            url: `${url}/stores/`,
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
            data: this.formData,
        };

        axios.request(options).then(function (response) {
            console.log(response.data);
            location.reload()
        }).catch(function (error) {
            console.error(error);
        });

        // Close the modal after submission
        // this.closeModal();
    },

    view: function () {
        return m('div', [
            // Open Modal Button
            m('button', { "class": "btn btn-sm btn-info", onclick: () => this.openModal() }, [
                m("i", { "class": "flaticon-add-circular-button" }),
                " Add Store"
            ]),

            // Modal
            this.showModal && m('.modal', [
                m('.modal-content', [
                    m("div", { "class": "row" }, [
                        m("div", { "class": "col-11" }, [
                            m('h4', 'Add Store'),
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
                        m("div", { "class": "col-4 my-2" }, [
                            m('label', 'Phone:'),
                            m('input[type=number]', {
                                "class": "py-2 px-3 w-100 rounded",
                                "placeholder": "Enter phone",
                                value: this.formData.phone,
                                oninput: (e) => this.handleInputChange('phone', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-8 my-2" }, [
                            m('label', 'Email:'),
                            m('input[type=email]', {
                                "class": "py-2 px-3 w-100 rounded",
                                "placeholder": "Enter email",
                                value: this.formData.email,
                                oninput: (e) => this.handleInputChange('email', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-12 my-2" }, [
                            m('label', 'Address:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100 rounded",
                                "placeholder": "Enter address",
                                value: this.formData.address,
                                oninput: (e) => this.handleInputChange('address', e.target.value),
                            }),
                        ]),
                        m("span", { "class": "border-top mt-4" }),
                        m("div", { "class": "pt-2 align-right" }, [
                            m('button', { "class": "btn btn-danger font-weight-bolder font-size-sm px-6 mr-3", onclick: () => this.closeModal() }, 'Close'),
                            m('button', { "class": "btn btn-info font-weight-bolder font-size-sm px-6", onclick: () => this.handleSubmit() }, 'Save'),
                        ])
                    ]),
                ]),
            ]),
        ]);
    },
};

export default AddStoreForm;

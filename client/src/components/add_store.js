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
    oninit: function(vnode) {
        vnode.state.brands = []
    },

    oncreate: function(vnode) {
        const optionStore = {
            method: 'GET', url: url + "/brands",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionStore).then(function (response) {
            vnode.state.brands = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });
    },

    handleSubmit: function (vnode) {
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

    view: function (vnode) {
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
                                "class": "form-control py-2 px-3 w-100 rounded",
                                "placeholder": "Enter title",
                                value: this.formData.title,
                                oninput: (e) => this.handleInputChange('title', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-4 my-2" }, [
                            m('label', 'Phone:'),
                            m('input[type=number]', {
                                "class": "form-control py-2 px-3 w-100 rounded",
                                "placeholder": "Enter phone",
                                value: this.formData.phone,
                                oninput: (e) => this.handleInputChange('phone', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-8 my-2" }, [
                            m('label', 'Email:'),
                            m('input[type=email]', {
                                "class": "form-control py-2 px-3 w-100 rounded",
                                "placeholder": "Enter email",
                                value: this.formData.email,
                                oninput: (e) => this.handleInputChange('email', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-12 my-2" }, [
                            m('label', 'Address:'),
                            m('input[type=text]', {
                                "class": "form-control py-2 px-3 w-100 rounded",
                                "placeholder": "Enter address",
                                value: this.formData.address,
                                oninput: (e) => this.handleInputChange('address', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-12 my-2" }, [
                            m('label', 'Brand:'),
                            m("br"),
                            m("button", { "class": "btn btn-md btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                    !this.formData.brand ? " No Brand " : vnode.state.brands?.filter(brand => brand._id == this.formData.brand)[0]?.title
                                ),
                            m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                        [
                                            m("a", {
                                                class: "dropdown-item",
                                                // href: "#",
                                                onclick: (e) => {
                                                    // Prevent default link behavior
                                                    e.preventDefault();

                                                    // Store store._id in local storage as storeId
                                                    localStorage.removeItem('storeId');

                                                    m.redraw()
                                                }
                                            }, " No brand "),
                                            vnode.state.brands?.map(brand => {
                                                return m("a", {
                                                    class: "dropdown-item",
                                                    // href: "#",
                                                    onclick: (e) => {
                                                        e.preventDefault();
                                                        this.handleInputChange('brand', brand._id)
                                                        m.redraw()
                                                    }
                                                }, brand.title);
                                            })
                                        ]
                                    )
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

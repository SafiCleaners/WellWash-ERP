import axios from "axios";

import {
    url,
} from "../constants"

import m from "mithril"


const EditPricingForm = {
    oninit(vnode) {
        // Access props from vnode.attrs
        this.props = vnode.attrs;
        this.formData = {
            id: this.props.pricing._id,
            title: this.props.pricing.title,
            cost: this.props.pricing.cost,
            category: this.props.pricing.category,
        }
    },
    oncreate(vnode) {
        const optionsCategories = {
            method: 'GET', url: url + "/categories",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsCategories).then(function (response) {
            vnode.state.categories = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });
    },

    showModal: false,
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

    view: function (vnode) {

        return m('span', [
            // Open Modal Button
            m('button', { "class": "btn btn-icon btn-light btn-hover-primary btn-sm mr-2", onclick: () => this.openModal() }, m('icon', { "class": "flaticon-edit" })),

            // Modal
            this.showModal && m('.modal', [
                m('.modal-content', [
                    m("div", { "class": "row text-left", style: "white-space: wrap;" }, [
                        m("div", { "class": "col-11" }, [
                            m('h4', 'Edit Pricing'),
                        ]),
                        m("div", { "class": "col-1" }, [
                            m('span', { onclick: () => this.closeModal(), class: 'close' }, 'x'),
                        ]),
                        m("span", { "class": "border-bottom mb-4" }),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', 'Select Category:'),
                            m('select', {
                                "class": "form-control form-control-solid",
                                value: this.props.pricing.category,
                                onchange: (e) => this.handleInputChange('category', e.target.value),
                            }, [

                                vnode.state.categories
                                .filter(c=>c.brand == localStorage.getItem('brand'))
                                .map((c) => {
                                    return m('option', {
                                        value: c._id,
                                        selected: this.props.pricing.category === c._id // Use strict equality (===)
                                    }, c.title);
                                }),
                                
                            ]),
                        ]),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', 'Price Point:'),
                            m('input[type=text]', {
                                "class": "form-control form-control-solid",
                                "placeholder": "Enter Price in KSH",
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

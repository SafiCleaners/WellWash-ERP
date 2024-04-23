import axios from "axios";

import {
    url,
} from "../constants"

import m from "mithril"


const AddPricingForm = {
    oninit(vnode) {
        vnode.state.stores = []
    },
    oncreate(vnode) {
        const options = {
            method: 'GET', url: url + "/stores-list",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.stores = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

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
    unitType: '',
    formData: {
        category: '',
        cost: ''
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
            url: `${url}/expenses/`,
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
            data: Object.assign(this.formData, {
                businessDate: localStorage.getItem('businessDate'),
                storeId: localStorage.getItem('storeId')
            }),
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
                "Add Stock Adjustment"
            ]),

            // Modal
            this.showModal && m('.modal', [
                m('.modal-content', [
                    m("div", { "class": "row" }, [
                        m("div", { "class": "col-11" }, [
                            m('h4', 'Add Expense'),
                        ]),
                        m("div", { "class": "col-1" }, [
                            m('span', { onclick: () => this.closeModal(), class: 'close' }, 'x'),
                        ]),
                        m("span", { "class": "border-bottom mb-4" }),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', 'Expense Reason:'),
                            m('input[type=text]', {
                                "class": "form-control form-control-solid",
                                "placeholder": "What did we spend money on",
                                value: this.formData.title,
                                oninput: (e) => this.handleInputChange('title', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', 'Expense Cost:'),
                            m('input[type=text]', {
                                "class": "form-control form-control-solid",
                                "placeholder": "Enter Cost in KSH",
                                value: this.formData.cost,
                                oninput: (e) => this.handleInputChange('cost', e.target.value),
                            }),
                        ]),
                        
                        m("div", { class: "form-group row", style: { padding: "10px" } }, [
                            m("div", { "class": "d-flex flex-stack" },
                                [
                                    [
                                        m("label", { "class": "d-flex flex-stack mb-5 cursor-pointer" },
                                            [
                                                m("span", { "class": "form-check form-check-custom form-check-solid mr-15" },
                                                    m("input", {
                                                        "class": "form-check-input w-45px h-30px",
                                                        "type": "checkbox",
                                                        "id": "payswitch",
                                                        checked: this.formData.recurrent,
                                                        onchange: (e) => {
                                                            this.handleInputChange('recurrent', e.target.checked)
                                                        }
                                                    }),
                                                ),
                                                m("span", { "class": "d-flex align-items-center me-2" },
                                                    [
                                                        m("span", { "class": "d-flex flex-column" },
                                                            [
                                                                m("span", { "class": "fw-bold fs-6" },
                                                                    "Recurrent Expense"
                                                                ),
                                                                m("span", { "class": "fs-7 text-muted" },
                                                                    "This Expense is incurred everyday"
                                                                )
                                                            ]
                                                        )
                                                    ]
                                                )
                                            ]
                                        ),
                                    ]
                                ]
                            )
                        ]),
                        m(".row", [
                            m("div", { "class": "card-body" }, [
                                m("div", { "class": "form-group mb-1" },
                                    [
                                        m("label", { "for": "exampleTextarea" },
                                            "A message to help verify "
                                        ),
                                        m("textarea", {
                                            oninput: (e) => this.handleInputChange('moreDetails', e.target.value),
                                            value: this.formData.moreDetails,
                                            "class": "form-control",
                                            "id": "exampleTextarea",
                                            "rows": "4",
                                            "spellcheck": "true"
                                        })
                                    ]
                                )
                            ])
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

export default AddPricingForm;

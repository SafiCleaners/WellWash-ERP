import axios from "axios";

import {
    url,
    clientSources
} from "../constants"

import m from "mithril"


const formatCurrency = (number) => {
    try {
        return Intl.NumberFormat('en-US').format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return 'N/A';
    }
}

const AddOrderForm = {
    oninit(vnode) {
        vnode.state.clients = []
        vnode.state.pricings = []
        vnode.state.stores = []
    },
    oncreate(vnode) {
        const options1 = {
            method: 'GET', url: url + "/pricings-list",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options1).then(function (response) {
            vnode.state.pricings = response.data
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

        const options2 = {
            method: 'GET', url: url + "/clients-list",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options2).then(function (response) {
            vnode.state.clients = response.data
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

        const options3 = {
            method: 'GET', url: url + "/stores-list",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options3).then(function (response) {
            vnode.state.stores = response.data
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
        storeId: '',
        clientId: '', 
        clientSource: '', 
        total: 0,
        tasks: [{
            categoryId: '',
            quantity: 1,
            description: '',
            cost: 0,
            total: 0,
            currency: '0'
        }],
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
            url: `${url}/orders/`,
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
            m('button', { "class": "btn btn-lg btn-info", onclick: () => this.openModal() }, [
                m("i", { "class": "flaticon-add-circular-button" }),
                "Add Order"
            ]),

            // Modal
            this.showModal && m('.modal', [
                m('.order-modal-content', [
                    m("div", { "class": "row" }, [
                        m("div", { "class": "col-11" }, [
                            m('h4', 'Add Order'),
                        ]),
                        m("div", { "class": "col-1" }, [
                            m('span', { onclick: () => this.closeModal(), class: 'close' }, 'x'),
                        ]),
                        m("span", { "class": "border-bottom mb-4" }),
                        // m("div", { "class": "col-4 my-2" }, [
                        //     m('label', 'Selected store:'),
                        //     m('select', {
                        //         "class": "py-2 w-100 rounded",
                        //         "disabled": true,
                        //         value: this.selectedOption,
                        //         onchange: (e) => this.handleInputChange('unit', e.target.value),
                        //     }, [
                        //         vnode.state.stores.map((store) => {
                        //             return m('option', { value: store._id },
                        //                 store.title
                        //             )
                        //         }),
                        //     ]),
                        // ]),
                        m("div", { "class": "col-4 my-2" }, [
                            m('label', 'Select store:'),
                            m('select', {
                                "class": "py-2 w-100 rounded",
                                value: this.formData.storeId,
                                onchange: (e) => this.handleInputChange('storeId', e.target.value),
                            }, [
                                vnode.state.stores.map((store) => { return m('option', { value: store._id }, store.title) }),
                            ]),
                        ]),
                        m("div", { "class": "col-5 my-2" }, [
                            m('label', 'Select client:'),
                            m('select', {
                                "class": "py-2 w-100 rounded",
                                value: this.formData.clientId,
                                onchange: (e) => this.handleInputChange('clientId', e.target.value),
                            }, [
                                vnode.state.clients.map(client => {
                                    return m('option', { value: client._id },
                                        client.name
                                    )
                                }),
                            ]),
                        ]),
                        m("div", { "class": "col-3 my-2" }, [
                            m('label', 'Select client source:'),
                            m('select', {
                                "class": "py-2 w-100 rounded",
                                value: this.formData.clientSource,
                                onchange: (e) => this.handleInputChange('clientSource', e.target.value),
                            }, [
                                clientSources.map((item) => { return m('option', { value: item }, item) }),
                            ]),
                        ]),
                        m("span", { "class": "border-top my-4" }),
                        m("div", { "class": "col-12 mb-4" }, [
                            m('div', { "class": "row" }, [
                                m('div', { "class": "col-6" },
                                    m('h5', 'Tasks list'),
                                ),
                                m('div', { "class": "col-6 text-right" },
                                    m('button', {
                                        "class": "btn btn-info font-weight-bolder font-size-sm px-3", onclick: () => {
                                            this.formData.tasks.push({
                                                categoryId: '',
                                                quantity: 1,
                                                description: '',
                                                cost: 0,
                                                total: 0,
                                                currency: '0',
                                            });
                                        }
                                    },
                                        m("i", { "class": "flaticon-add-circular-button" }),
                                        "Add task"),
                                ),
                            ])
                        ]),
                        this.formData.tasks.map((task, index) => {
                            return m("div", { "class": "col-12" }, [
                                m('div', { "class": "row" }, [
                                    m("div", { "class": "col-4 my-2" }, [
                                        m('label', 'Select category:'),
                                        m('select', {
                                            "class": "py-2 w-100 rounded",
                                            value: task.categoryId,
                                            onchange: (e) => {
                                                task.categoryId = e.target.value;
                                                const costs = vnode.state.pricings.filter((pricing) => pricing._id === e.target.value);
                                                if (costs.length) {
                                                    task.cost = costs[0].cost;
                                                    task.currency = costs[0].cost;
                                                    if (task.quantity > 0) {
                                                        task.total = task.quantity * task.cost;
                                                        task.currency = task.total;
                                                    }
                                                }
                                                this.formData.total = 0;
                                                this.formData.tasks.forEach((task) => {
                                                    this.formData.total += parseFloat(task.total);
                                                });
                                            },
                                        }, [
                                            vnode.state.pricings.map((pricing) => {
                                                return m('option', { value: pricing._id },
                                                    pricing.title
                                                )
                                            }),
                                        ]),
                                    ]),
                                    m("div", { "class": "col-1 my-2" }, [
                                        m('label', 'Cost:'),
                                        m('input[type=text]', {
                                            "class": "py-2 w-100 rounded",
                                            "readonly": true,
                                            value: formatCurrency(task.cost),
                                        }),
                                    ]),
                                    m("div", { "class": "col-1 my-2" }, [
                                        m('label', 'Quantity:'),
                                        m('input[type=number]', {
                                            "class": "py-2 px-1 w-100 rounded",
                                            "placeholder": "Enter quantity",
                                            "min": 1,
                                            value: task.quantity,
                                            oninput: (e) => {
                                                task.quantity = parseInt(e.target.value);
                                                if (task.quantity <= 0) {
                                                    task.total = 0;
                                                    task.currency = 0;
                                                }
                                                if (task.quantity > 0) {
                                                    task.total = task.quantity * task.cost;
                                                    task.currency = task.total;
                                                }
                                                this.formData.total = 0;
                                                this.formData.tasks.forEach((task) => {
                                                    this.formData.total += parseFloat(task.total);
                                                });
                                            },
                                        }),
                                    ]),
                                    m("div", { "class": "col-1 my-2" }, [
                                        m('label', 'Total:'),
                                        m('input[type=text]', {
                                            "class": "py-2 w-100 rounded",
                                            "readonly": true,
                                            value: formatCurrency(task.currency),
                                        }),
                                    ]),
                                    m("div", { "class": "col-4 my-2" }, [
                                        m('label', 'Description:'),
                                        m('input[type=text]', {
                                            "class": "py-2 px-3 w-100 rounded",
                                            "placeholder": "Enter description",
                                            value: task.description,
                                            oninput: (e) => task.description = e.target.value,
                                        }),
                                    ]),
                                    m("div", { "class": "col-1 my-2" }, [
                                        m('label', 'Remove:'),
                                        m('button', {
                                            "class": "py-1 btn btn-lg btn-danger",
                                            onclick: () => {
                                                this.formData.tasks.splice(index, 1);
                                                this.formData.total = 0;
                                                this.formData.tasks.forEach((task) => {
                                                    this.formData.total += parseFloat(task.total);
                                                });
                                            }
                                        }, m('icon', { "class": "flaticon2-rubbish-bin-delete-button" }))
                                    ])
                                ])
                            ])
                        }),
                        m("span", { "class": "border-top my-4" }),
                        m("div", { "class": "col-12 text-center font-weight-bolder" }, [
                            m('h3', `Order total: ${formatCurrency(this.formData.total)}`),
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

export default AddOrderForm;

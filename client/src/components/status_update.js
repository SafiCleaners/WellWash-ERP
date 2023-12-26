import axios from "axios";

import {
    url,
    statusTypes
} from "../constants"

import { getStatusTitle } from "../../utils/helpers";

import m from "mithril"


const formatCurrency = (number) => {
    try {
        return Intl.NumberFormat('en-US').format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return 'N/A';
    }
}

const StatusUpdateForm = {
    oninit: function (vnode) {
        // Access props from vnode.attrs
        this.props = vnode.attrs;
        this.taskData = {
            status: getStatusTitle(this.props.task.status),
            clientTitle: this.props.task.clientTitle,
            pricingTitle: this.props.task.pricingTitle,
            description: this.props.task.description,
            storeTitle: this.props.task.storeTitle,
            cost: formatCurrency(this.props.task.cost),
            quantity: this.props.task.quantity,
            total: formatCurrency(this.props.task.total),
        },
        this.formData = {
            taskId: this.props.task._id,
            status: ""
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
            method: 'POST',
            url: `${url}/status`,
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
                    m("div", { "class": "row text-left", style: "white-space: wrap;" }, [
                        m("div", { "class": "col-11" }, [
                            m('h4', 'Update Status'),
                        ]),
                        m("div", { "class": "col-1" }, [
                            m('span', { onclick: () => this.closeModal(), class: 'close' }, 'x'),
                        ]),
                        m("span", { "class": "border-bottom mb-4" }),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', { "class": "" }, 'Select new status:'),
                            m('select', {
                                "class": "py-2 w-100 rounded",
                                value: this.formData.status,
                                onchange: (e) => this.handleInputChange('status', e.target.value),
                            }, [
                                statusTypes.map((item) => { return m('option', { value: item.value }, item.key) }),
                            ]),
                        ]),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', 'Current status:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100",
                                "placeholder": "Current status",
                                "readonly": "true",
                                value: this.taskData.status,
                            }),
                        ]),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', 'Store:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100",
                                "placeholder": "Store",
                                "readonly": "true",
                                value: this.taskData.storeTitle,
                            }),
                        ]),
                        m("div", { "class": "col-6 my-2" }, [
                            m('label', 'Client:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100",
                                "placeholder": "Client",
                                "readonly": "true",
                                value: this.taskData.clientTitle,
                            }),
                        ]),
                        m("div", { "class": "col-4 my-2" }, [
                            m('label', 'Category:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100",
                                "placeholder": "Category",
                                "readonly": "true",
                                value: this.taskData.pricingTitle,
                            }),
                        ]),
                        m("div", { "class": "col-8 my-2" }, [
                            m('label', 'Description:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100",
                                "placeholder": "Description",
                                "readonly": "true",
                                value: this.taskData.description,
                            }),
                        ]),
                        m("div", { "class": "col-4 my-2" }, [
                            m('label', 'Cost:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100",
                                "placeholder": "Cost",
                                "readonly": "true",
                                value: this.taskData.cost,
                            }),
                        ]),
                        m("div", { "class": "col-4 my-2" }, [
                            m('label', 'Quantity:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100",
                                "placeholder": "Quantity",
                                "readonly": "true",
                                value: this.taskData.quantity,
                            }),
                        ]),
                        m("div", { "class": "col-4 my-2" }, [
                            m('label', 'Total:'),
                            m('input[type=text]', {
                                "class": "py-2 px-3 w-100",
                                "placeholder": "Total",
                                "readonly": "true",
                                value: this.taskData.total,
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

export default StatusUpdateForm;

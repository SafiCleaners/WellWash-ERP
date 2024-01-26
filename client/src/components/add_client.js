import axios from "axios";

import {
    url,
} from "../constants"

import m from "mithril"


const AddGroupSMSForm = {
    oninit(vnode) {
        vnode.state.groups = []
    },
    oncreate(vnode) {
        const options = {
            method: 'GET', url: url + "/cgroups",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.groups = response.data
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
        name: '',
        phone: '',
        groups: [],
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

    handleInputAppend: function (field, value) {
        if (this.formData[field].includes(value)) {
            this.formData[field] = this.formData[field].filter((item) => item != value); 
        } else {
            this.formData[field].push(value);
        }
        console.log(this.formData[field]);
    },

    handleSubmit: function () {
        // Handle form submission logic here
        console.log('Form Submitted:', this.formData);

        const options = {
            method: 'POST',
            url: `${url}/clients/`,
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
            data: Object.assign(this.formData, {
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
            m('button', { "class": "btn btn-lg btn-info", onclick: () => this.openModal() }, [
                m("i", { "class": "flaticon-add-circular-button" }),
                "Add Client"
            ]),

            // Modal
            this.showModal && m('.modal', [
                m('.modal-content', [
                    m("div", { "class": "row" }, [
                        m("div", { "class": "col-11" }, [
                            m('h4', 'Add Client'),
                        ]),
                        m("div", { "class": "col-1" }, [
                            m('span', { onclick: () => this.closeModal(), class: 'close' }, 'x'),
                        ]),
                        m("span", { "class": "border-bottom mb-4" }),
                        m("div", { "class": "col-12 my-2" }, [
                            m('label', 'Client Names:'),
                            m('input[type=text]', {
                                "class": "form-control form-control-solid",
                                "placeholder": "Client names",
                                value: this.formData.title,
                                oninput: (e) => this.handleInputChange('name', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-12 my-2" }, [
                            m('label', 'Phone Number:'),
                            m('input[type=text]', {
                                "class": "form-control form-control-solid",
                                "placeholder": "Client phone",
                                value: this.formData.cost,
                                oninput: (e) => this.handleInputChange('phone', e.target.value),
                            }),
                        ]),

                        m("div", { class: "form-group row", style: { padding: "10px" } }, [
                            vnode.state.groups.map((group) => {
                                return m("div", { "class": "d-flex flex-stack" },
                                    [
                                        [
                                            m("label", { "class": "d-flex flex-stack mb-5 cursor-pointer" },
                                                [
                                                    m("span", { "class": "form-check form-check-custom form-check-solid mr-15" },
                                                        m("input", {
                                                            "class": "form-check-input w-45px h-30px",
                                                            "type": "checkbox",
                                                            "id": "payswitch",
                                                            checked: this.formData.groups.includes(group._id),
                                                            onchange: (e) => {
                                                                console.log(e.target.value)
                                                                this.handleInputAppend('groups', group._id)
                                                            }
                                                        }),
                                                    ),
                                                    m("span", { "class": "d-flex align-items-center me-2" },
                                                        [
                                                            m("span", { "class": "d-flex flex-column" },
                                                                [
                                                                    m("span", { "class": "fw-bold fs-6" },
                                                                        group.title
                                                                    ),
                                                                    m("span", { "class": "fs-7 text-muted" },
                                                                        group._id
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
                            })
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

export default AddGroupSMSForm;

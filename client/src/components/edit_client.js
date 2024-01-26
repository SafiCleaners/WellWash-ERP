import axios from "axios";

import {
    url,
} from "../constants"

import m from "mithril"


const EditClientForm = {
    oninit(vnode) {
        vnode.state.cgroups = []
        // Access props from vnode.attrs
        this.props = vnode.attrs;
        this.formData = {
            id: this.props.client._id,
            name: this.props.client.name,
            phone: this.props.client.phone,
            groups: this.props.client.groups,
        }
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
            vnode.state.cgroups = response.data
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
            method: 'PATCH',
            url: `${url}/clients/${this.formData.id}`,
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
                            m('h4', 'Edit Client'),
                        ]),
                        m("div", { "class": "col-1" }, [
                            m('span', { onclick: () => this.closeModal(), class: 'close' }, 'x'),
                        ]),
                        m("span", { "class": "border-bottom mb-4" }),
                        m("div", { "class": "col-8 my-2" }, [
                            m('label', 'Client Names:'),
                            m('input[type=text]', {
                                "class": "form-control form-control-solid",
                                "placeholder": "Client names",
                                value: this.formData.name,
                                oninput: (e) => this.handleInputChange('name', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-4 my-2" }, [
                            m('label', 'Phone Number:'),
                            m('input[type=text]', {
                                "class": "form-control form-control-solid",
                                "placeholder": "Client phone",
                                value: this.formData.phone,
                                oninput: (e) => this.handleInputChange('phone', e.target.value),
                            }),
                        ]),

                        m("div", { class: "form-group row", style: { padding: "10px" } }, [
                            m('label', 'Select Group(s):'),
                            vnode.state.cgroups.map((group) => {
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
                            m('button', { "class": "btn btn-info font-weight-bolder font-size-sm px-6", onclick: () => this.handleSubmit() }, 'Save Changes'),
                        ])
                    ]),
                ]),
            ]),
        ]);
    },
};

export default EditClientForm;

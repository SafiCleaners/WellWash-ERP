import axios from "axios";
import m from "mithril";
import { url } from "../constants";

const AddStoreForm = {
    oninit(vnode) {
        // Use vnode.state for clean, instance-specific state
        vnode.state.showModal = false;
        vnode.state.brands = [];
        vnode.state.formData = {
            title: '',
            address: '',
            phone: '',
            email: '',
            brand: null,
        };
        vnode.state.loading = true;

        // Fetch brands when the component is initialized
        axios.get(`${url}/brands`, {
            headers: { authorization: localStorage.getItem('token') }
        }).then(response => {
            vnode.state.brands = response.data;
        }).catch(error => {
            console.error("Failed to fetch brands:", error);
        }).finally(() => {
            vnode.state.loading = false;
            m.redraw();
        });
    },

    view(vnode) {
        const { showModal, formData, brands } = vnode.state;
        const brandMap = brands.reduce((acc, brand) => ({ ...acc, [brand.id]: brand.title }), {});

        const openModal = () => vnode.state.showModal = true;
        const closeModal = () => vnode.state.showModal = false;

        const handleInputChange = (field, value) => {
            vnode.state.formData[field] = value;
        };

        const handleSubmit = () => {
            if (!formData.title) {
                return alert("Title is a required field.");
            }

            const options = {
                method: 'POST',
                url: `${url}/stores`,
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': localStorage.getItem('token')
                },
                data: formData,
            };

            axios.request(options).then(response => {
                // Call the parent's callback function instead of reloading
                if (vnode.attrs.onStoreAdded) {
                    vnode.attrs.onStoreAdded(response.data);
                }
                // Reset form and close modal for a better UX
                vnode.state.formData = { title: '', address: '', phone: '', email: '', brand: null };
                closeModal();
            }).catch(error => {
                console.error(error);
                alert("Failed to add store. Please check the console.");
            });
        };

        return m('div', [
            m('button.btn.btn-sm.btn-info', { onclick: openModal }, [
                m("i.flaticon-add-circular-button"),
                " Add Store"
            ]),

            showModal && m('.modal', [
                m('.modal-content', [
                    m(".row", [
                        m(".col-11", m('h4', 'Add Store')),
                        m(".col-1", m('span.close', { onclick: closeModal }, 'x')),
                        m("span.border-bottom.mb-4"),

                        m(".col-12.my-2", [
                            m('label', 'Title:'),
                            m('input.form-control', {
                                placeholder: "Enter title",
                                value: formData.title,
                                oninput: e => handleInputChange('title', e.target.value),
                            }),
                        ]),
                        m(".col-4.my-2", [
                            m('label', 'Phone:'),
                            m('input.form-control[type=tel]', {
                                placeholder: "Enter phone",
                                value: formData.phone,
                                oninput: e => handleInputChange('phone', e.target.value),
                            }),
                        ]),
                        m(".col-8.my-2", [
                            m('label', 'Email:'),
                            m('input.form-control[type=email]', {
                                placeholder: "Enter email",
                                value: formData.email,
                                oninput: e => handleInputChange('email', e.target.value),
                            }),
                        ]),
                        m(".col-12.my-2", [
                            m('label', 'Address:'),
                            m('input.form-control', {
                                placeholder: "Enter address",
                                value: formData.address,
                                oninput: e => handleInputChange('address', e.target.value),
                            }),
                        ]),
                        m(".col-12.my-2", [
                            m('label', 'Brand:'),
                            m('.dropdown', [
                                m("button.btn.btn-md.btn-secondary.dropdown-toggle.w-100", { "data-toggle": "dropdown" },
                                    brandMap[formData.brand] || "Select a Brand"
                                ),
                                m(".dropdown-menu", [
                                    m("a.dropdown-item", { onclick: () => handleInputChange('brand', null) }, "No Brand"),
                                    brands.map(brand => m("a.dropdown-item", {
                                        onclick: () => handleInputChange('brand', brand.id) // Use 'id'
                                    }, brand.title))
                                ])
                            ])
                        ]),

                        m("span.border-top.mt-4"),
                        m(".pt-2.align-right", [
                            m('button.btn.btn-danger.px-6.mr-3', { onclick: closeModal }, 'Close'),
                            m('button.btn.btn-info.px-6', { onclick: handleSubmit }, 'Save'),
                        ])
                    ]),
                ]),
            ]),
        ]);
    },
};

export default AddStoreForm;
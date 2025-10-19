import axios from "axios";
import m from "mithril";
import { url } from "../constants";

const EditStoreForm = {
    oninit(vnode) {
        vnode.state.showModal = false;
        // Create a *copy* of the store data to avoid mutating parent state on cancel
        vnode.state.formData = { ...vnode.attrs.store };
    },

    view(vnode) {
        const { showModal, formData } = vnode.state;

        const openModal = () => vnode.state.showModal = true;
        const closeModal = () => {
            // On close, reset the form data back to the original to discard changes
            vnode.state.formData = { ...vnode.attrs.store };
            vnode.state.showModal = false;
        };

        const handleInputChange = (field, value) => {
            vnode.state.formData[field] = value;
        };

        const handleSubmit = () => {
            const options = {
                method: 'PATCH',
                url: `${url}/stores/${formData.id}`,
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': localStorage.getItem('token')
                },
                data: formData,
            };

            axios.request(options).then(response => {
                // Call the parent's callback with the updated data
                if (vnode.attrs.onStoreUpdated) {
                    vnode.attrs.onStoreUpdated(response.data);
                }
                closeModal();
            }).catch(error => {
                console.error(error);
                alert("Failed to update store. Please check the console.");
            });
        };

        return m('span', [
            m('button.btn.btn-icon.btn-light.btn-hover-primary.btn-sm.mr-2', { onclick: openModal },
                m('i.flaticon-edit')
            ),

            showModal && m('.modal', [
                m('.modal-content', [
                    m(".row.text-left", [
                        m(".col-11", m('h4', 'Edit Store')),
                        m(".col-1", m('span.close', { onclick: closeModal }, 'x')),
                        m("span.border-bottom.mb-4"),

                        m(".col-12.my-2", [
                            m('label', 'Title:'),
                            m('input.form-control', {
                                value: formData.title,
                                oninput: e => handleInputChange('title', e.target.value),
                            }),
                        ]),
                        m(".col-4.my-2", [
                            m('label', 'Phone:'),
                            m('input.form-control[type=tel]', {
                                value: formData.phone,
                                oninput: e => handleInputChange('phone', e.target.value),
                            }),
                        ]),
                        m(".col-8.my-2", [
                            m('label', 'Email:'),
                            m('input.form-control[type=email]', {
                                value: formData.email,
                                oninput: e => handleInputChange('email', e.target.value),
                            }),
                        ]),
                        m(".col-12.my-2", [
                            m('label', 'Address:'),
                            m('input.form-control', {
                                value: formData.address,
                                oninput: e => handleInputChange('address', e.target.value),
                            }),
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

export default EditStoreForm;
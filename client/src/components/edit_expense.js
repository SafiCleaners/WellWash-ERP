import axios from "axios";
import m from "mithril";
import { url } from "../constants";

const editExpense = {
    oninit(vnode) {
        // Create a local copy of the expense data to avoid mutating parent state directly
        vnode.state.formData = { ...vnode.attrs.expense };
        vnode.state.showModal = false;
        vnode.state.isLoading = false;
        vnode.state.error = null;
    },

    openModal(vnode) {
        // Refresh formData from attrs in case the parent data has changed
        vnode.state.formData = { ...vnode.attrs.expense };
        vnode.state.showModal = true;
        vnode.state.error = null;
    },

    closeModal(vnode) {
        vnode.state.showModal = false;
    },

    handleInputChange(vnode, field, value) {
        vnode.state.formData[field] = value;
    },



    handleSubmit(vnode) {
        vnode.state.isLoading = true;
        vnode.state.error = null;
        const { _id, ...dataToSubmit } = vnode.state.formData;

        axios.patch(`${url}/expenses/${_id}`, dataToSubmit, {
            headers: { 'authorization': localStorage.getItem('token') }
        })
        .then(() => {
            if (vnode.attrs.onUpdate) {
                vnode.attrs.onUpdate();
            }
            this.closeModal(vnode);
        })
        .catch(error => {
            console.error("Failed to update expense:", error);
            vnode.state.error = "Could not save changes. Please try again.";
        })
        .finally(() => {
            vnode.state.isLoading = false;
            m.redraw();
        });
    },

    view(vnode) {
        const { showModal, isLoading, error, formData } = vnode.state;

        return m('span', [
            m('button.btn.btn-icon.btn-light-primary.btn-sm', { onclick: () => this.openModal(vnode) }, m('i.fa.fa-pencil-alt')),

            showModal && m('.modal.fade.show[style=display:block]', { onclick: () => this.closeModal(vnode) },
                m('.modal-dialog.modal-dialog-centered', { onclick: e => e.stopPropagation() },
                    m('.modal-content', [
                        m('.modal-header', [
                            m('h5.modal-title', `Edit Expense: ${formData.title}`),
                            m('button.btn-close', { onclick: () => this.closeModal(vnode) })
                        ]),
                        m('.modal-body', [
                            m('.mb-3', [
                                m('label.form-label', 'Expense Reason'),
                                m('input.form-control', {
                                    value: formData.title,
                                    oninput: (e) => this.handleInputChange(vnode, 'title', e.target.value),
                                }),
                            ]),
                            m('.mb-3', [
                                m('label.form-label', 'Expense Cost (Ksh)'),
                                m('input.form-control[type=number]', {
                                    value: formData.cost,
                                    oninput: (e) => this.handleInputChange(vnode, 'cost', e.target.value),
                                }),
                            ]),
                            m('.mb-3', [
                                m('label.form-label', 'Additional Details'),
                                m('textarea.form-control', {
                                    rows: 3,
                                    value: formData.moreDetails,
                                    oninput: (e) => this.handleInputChange(vnode, 'moreDetails', e.target.value),
                                })
                            ]),
                            m('.form-check.form-switch', [
                                m('input.form-check-input', {
                                    type: 'checkbox',
                                    id: `recurrentSwitch_${formData._id}`,
                                    checked: formData.recurrent,
                                    onchange: (e) => this.handleInputChange(vnode, 'recurrent', e.target.checked)
                                }),
                                m('label.form-check-label', { for: `recurrentSwitch_${formData._id}` }, 'This is a recurrent expense')
                            ]),
                            error && m('.alert.alert-danger.mt-3', error)
                        ]),
                        m('.modal-footer', [
                            m('button.btn.btn-secondary', { onclick: () => this.closeModal(vnode) }, 'Cancel'),
                            m('button.btn.btn-primary', { onclick: () => this.handleSubmit(vnode), disabled: isLoading },
                                isLoading ? [m('span.spinner-border.spinner-border-sm.me-2'), 'Saving...'] : 'Save Changes'
                            )
                        ])
                    ])
                )
            ),
        ]);
    },
};

export default editExpense;
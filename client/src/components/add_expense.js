import axios from "axios";
import m from "mithril";
import { url } from "../constants";

const getInitialFormData = () => ({
    title: '',
    cost: '',
    recurrent: false,
    moreDetails: ''
});

const addExpense = {
    oninit(vnode) {
        vnode.state.showModal = false;
        vnode.state.isLoading = false;
        vnode.state.error = null;
        vnode.state.formData = getInitialFormData();
    },

    openModal(vnode) {
        vnode.state.showModal = true;
        vnode.state.error = null; // Clear previous errors
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

        const dataToSubmit = {
            ...vnode.state.formData,
            businessDate: localStorage.getItem('businessDate'),
            storeId: localStorage.getItem('storeId') || undefined // Ensure storeId is not an empty string
        };
        
        axios.post(`${url}/expenses`, dataToSubmit, {
            headers: { 'authorization': localStorage.getItem('token') }
        })
        .then(() => {
            // SUCCESS: Tell the parent page to refresh its data
            if (vnode.attrs.onUpdate) {
                vnode.attrs.onUpdate();
            }
            // Reset form for the next time
            vnode.state.formData = getInitialFormData();
            this.closeModal(vnode);
        })
        .catch(error => {
            console.error("Failed to add expense:", error);
            vnode.state.error = "Could not save expense. Please try again.";
        })
        .finally(() => {
            vnode.state.isLoading = false;
            m.redraw();
        });
    },

    view(vnode) {
        const { showModal, isLoading, error, formData } = vnode.state;

        return m('div', [
            m('button.btn.btn-primary.btn-sm', { onclick: () => this.openModal(vnode) }, [
                m("i.fa.fa-plus.me-2"), "Add Expense"
            ]),

            showModal && m('.modal.fade.show[style=display:block]', { onclick: () => this.closeModal(vnode) },
                m('.modal-dialog.modal-dialog-centered.modal-lg', { onclick: e => e.stopPropagation() },
                    m('.modal-content', [
                        m('.modal-header', [
                            m('h5.modal-title', 'Add New Expense'),
                            m('button.btn-close', { onclick: () => this.closeModal(vnode) })
                        ]),
                        m('.modal-body', [
                            m('.mb-3', [
                                m('label.form-label', 'Expense Reason'),
                                m('input.form-control', {
                                    placeholder: "e.g., Cleaning Supplies",
                                    value: formData.title,
                                    oninput: (e) => this.handleInputChange(vnode, 'title', e.target.value),
                                }),
                            ]),
                            m('.mb-3', [
                                m('label.form-label', 'Expense Cost (Ksh)'),
                                m('input.form-control[type=number]', {
                                    placeholder: "e.g., 1500",
                                    value: formData.cost,
                                    oninput: (e) => this.handleInputChange(vnode, 'cost', e.target.value),
                                }),
                            ]),
                            m('.mb-3', [
                                m('label.form-label', 'Additional Details'),
                                m('textarea.form-control', {
                                    rows: 3,
                                    placeholder: "Optional notes about the expense",
                                    value: formData.moreDetails,
                                    oninput: (e) => this.handleInputChange(vnode, 'moreDetails', e.target.value),
                                })
                            ]),
                            m('.form-check.form-switch', [
                                m('input.form-check-input', {
                                    type: 'checkbox',
                                    id: 'recurrentSwitchAdd',
                                    checked: formData.recurrent,
                                    onchange: (e) => this.handleInputChange(vnode, 'recurrent', e.target.checked)
                                }),
                                m('label.form-check-label[for=recurrentSwitchAdd]', 'This is a recurrent expense')
                            ]),
                            error && m('.alert.alert-danger.mt-3', error)
                        ]),
                        m('.modal-footer', [
                            m('button.btn.btn-secondary', { onclick: () => this.closeModal(vnode) }, 'Cancel'),
                            m('button.btn.btn-primary', { onclick: () => this.handleSubmit(vnode), disabled: isLoading },
                                isLoading ? [m('span.spinner-border.spinner-border-sm.me-2'), 'Saving...'] : 'Save Expense'
                            )
                        ])
                    ])
                )
            ),
        ]);
    },
};

export default addExpense;
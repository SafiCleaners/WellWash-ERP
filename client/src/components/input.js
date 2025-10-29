import m from "mithril";

const incrementableInput = () => {
    let localAmount = 0;
    let localCharge = 0;

    const callOnChange = (vnode) => {
        if (vnode.attrs.onChange) {
            vnode.attrs.onChange({ amountValue: localAmount, chargeValue: localCharge });
        }
    };

    const setAmount = (vnode, value) => {
        const newAmount = parseInt(value, 10);
        if (!isNaN(newAmount) && newAmount >= 0) {
            localAmount = newAmount;
            callOnChange(vnode);
        }
    };

    const setCharge = (vnode, value) => {
        const newCharge = parseFloat(value);
        if (!isNaN(newCharge)) {
            localCharge = newCharge;
            callOnChange(vnode);
        }
    };

    return {
        oninit: (vnode) => {
            localAmount = parseInt(vnode.attrs.amount, 10) || 0;
            localCharge = parseFloat(vnode.attrs.charge) || 0;
        },
        // This ensures the component updates if the parent's data changes
        onbeforeupdate: (vnode) => {
            localAmount = parseInt(vnode.attrs.amount, 10) || 0;
            localCharge = parseFloat(vnode.attrs.charge) || 0;
        },
        view: (vnode) => {
            const { name, pricing = [], pickerSize = 12, pickerSizeMD = 6, pickerSizeLG = 4 } = vnode.attrs;
            const subtotal = localAmount * localCharge;

            return m(`.col-${pickerSize}.col-md-${pickerSizeMD}.col-lg-${pickerSizeLG}.mb-4`, [
                m("label.form-label.fw-bold", name),

                // --- Amount Input Group ---
                m(".input-group.mb-2", [
                    m("button.btn.btn-outline-secondary", {
                        onclick: () => setAmount(vnode, localAmount - 1)
                    }, m("i.fas.fa-minus")),
                    
                    m("input.form-control.text-center.fw-bold", {
                        type: "number",
                        value: localAmount,
                        oninput: (e) => setAmount(vnode, e.target.value),
                        min: 0
                    }),

                    m("button.btn.btn-outline-secondary", {
                        onclick: () => setAmount(vnode, localAmount + 1)
                    }, m("i.fas.fa-plus")),
                ]),

                // --- Price Point Selection ---
                m(".d-flex.flex-wrap.align-items-center", [
                    m("span.me-2.text-muted", "Price:"),
                    pricing.length > 0 ?
                        m(".btn-group", pricing.map(priceOption =>
                            m("button.btn.btn-sm", {
                                // Visually indicate the active price
                                class: localCharge === priceOption.amount ? "btn-primary" : "btn-outline-primary",
                                onclick: () => setCharge(vnode, priceOption.amount)
                            }, `KSH ${priceOption.label}`)
                        ))
                        : m("span.text-danger.fst-italic", "No prices available")
                ]),
                
                // --- Subtotal Display (FIXED) ---
                // Only show the subtotal if a valid calculation can be made
                (subtotal > 0) && m(".mt-2.text-end.pe-2",
                    m("span.fw-bold.fs-5.text-success", `Subtotal: KSH ${subtotal.toLocaleString()}`)
                )
            ]);
        }
    };
};

export default incrementableInput;
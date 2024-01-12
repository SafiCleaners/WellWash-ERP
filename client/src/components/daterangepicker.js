// daterangepicker.js
import m from 'mithril';

export const DateRangePicker = {
    oninit(vnode) {
        vnode.state.selectedDate = null;
    },
    view(vnode) {
        const attrs = vnode.attrs; // Access attributes from vnode
        console.log(attrs);
        return m('input', {
            ...attrs, // Apply all attributes to the input element
            "placeholder": "Select filter date:",
            value: vnode.state.selectedDate,
            oncreate: (el) => {
                jQuery(`#${attrs.id}`).daterangepicker({
                    singleDatePicker: true,
                    showDropdowns: true,
                    minYear: 2022,
                    maxYear: moment().add(1, 'year').year(),
                    locale: {
                        format: 'YYYY-MM-DD'
                    },
                }, (start, end, label) => {
                    vnode.state.selectedDate = start;
                    attrs.onChange(start)
                });
            },
            onremove: (el) => {
                jQuery(`#${attrs.id}`).daterangepicker('remove')
            },
        });
    },
};

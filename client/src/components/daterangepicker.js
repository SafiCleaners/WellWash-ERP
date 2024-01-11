// daterangepicker.js
import m from 'mithril';

export const DateRangePicker = {
    view(vnode) {
        const attrs = vnode.attrs; // Access attributes from vnode
        console.log(attrs);
        return m('input', {
            ...attrs, // Apply all attributes to the input element
            oncreate: (el) => {
                $(`#${attrs.id}`).daterangepicker({
                    singleDatePicker: true,
                    showDropdowns: true,
                    minYear: 2022,
                    maxYear: moment().add(1, 'year').year(),
                    picker: (start, end, label) => {
                        attrs.onChange(start)
                    },
                });
            },
            onremove: (el) => {
                $(`#${attrs.id}`).daterangepicker('remove')
            },
        });
    },
};

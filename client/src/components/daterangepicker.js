import m from 'mithril';
import moment from 'moment';

const displayFormat = 'ddd, Do MMM YYYY';
const rangeDisplayFormat = 'Do MMM'
const storageFormat = 'YYYY-MM-DD';

let deferredPrompt


export const DateRangePicker = {
    oninit(vnode) {
        // Retrieve the selectedDate from localStorage if available
        const storedDate = localStorage.getItem("businessDate");
        const businessRangeStartDate = localStorage.getItem("businessRangeStartDate");
        const businessRangeEndDate = localStorage.getItem("businessRangeEndDate");

        // Set the selectedDate in state using the display format or null if not present
        vnode.state.selectedDate = storedDate ? moment(storedDate).format(displayFormat) : null;
        vnode.state.selectedStartDate = storedDate ? moment(businessRangeStartDate).format(displayFormat) : null;
        vnode.state.selectedEndDate = storedDate ? moment(businessRangeEndDate).format(displayFormat) : null;
        window.addEventListener('beforeinstallprompt', (event) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            event.preventDefault();
            // Stash the event so it can be triggered later
            // deferredPrompt = event;
            // Update UI notify the user they can add to home screen
            // btnAdd.style.display = 'block';
        });

    },
    onremove: (el) => {
        console.log("removing range")
        jQuery(`#range`).daterangepicker('remove');
        jQuery(`#single`).daterangepicker('remove');
    },
    view(vnode) {
        const attrs = vnode.attrs;

        const currentRoute = window.location.href;
        console.log('Current Route:', currentRoute);

        console.log(vnode.state)

        if (currentRoute.includes('dash')) {
            return m('input', {
                ...attrs,
                "id":"range",
                "placeholder": "Select Business Date Range:",
                // value: `${vnode.state.selectedStartDate} - ${vnode.state.selectedEndDate}`,
                oncreate: (el) => {
                    const datepickerOptions = {
                        singleDatePicker: false,
                        showDropdowns: true,
                        minYear: 2022,
                        maxYear: moment().add(1, 'month').year(),
                        locale: {
                            format: rangeDisplayFormat
                        },
                        opens: 'left',
                    };

                    vnode.state.selectedStartDate ? Object.assign(datepickerOptions,{
                        startDate: vnode.state.selectedStartDate,
                        endDate: vnode.state.selectedEndDate
                    }) : null

                    jQuery(`#range`).daterangepicker(datepickerOptions, (start, end, label) => {
                        const formattedStartDate = start.format(rangeDisplayFormat);
                        const formattedEndDate = end.format(rangeDisplayFormat);

                        const storageFormattedStartDate = start.format(storageFormat);
                        const storageFormattedEndDate = end.format(storageFormat);

                        vnode.state.selectedStartDate = formattedStartDate;
                        vnode.state.selectedEndDate = formattedEndDate;

                        localStorage.setItem("businessRangeStartDate", storageFormattedStartDate);
                        localStorage.setItem("businessRangeEndDate", storageFormattedEndDate);

                        attrs.onChange(`${formattedStartDate} - ${formattedEndDate}`);
                    });

                    // Remove the <div class="ranges"></div> element
                    setTimeout(() => {
                        jQuery(`.ranges`).remove();
                        jQuery('.daterangepicker').css('z-index', 10000);
                    }, 1000);
                },
               
            })
        }

        return m('input', {
            ...attrs,
            id: "single",
            "placeholder": "Select Business Date:",
            value: vnode.state.selectedDate,
            oncreate: (el) => {
                const datepickerOptions = {
                    singleDatePicker: true,
                    showDropdowns: true,
                    minYear: 2022,
                    maxYear: moment().add(1, 'day').year(),
                    locale: {
                        format: displayFormat
                    },
                    opens: 'left',
                };

                jQuery(`#single`).daterangepicker(datepickerOptions, (start, end, label) => {
                    // Format the date for display using the custom format
                    const formattedDate = start.format(displayFormat);

                    // Format the date for storage using the standard format
                    const storageFormattedDate = start.format(storageFormat);

                    console.log({ storageFormattedDate })
                    // Set the formatted date in the state
                    vnode.state.selectedDate = formattedDate;

                    // Save the selectedDate to localStorage in the standard format
                    localStorage.setItem("businessDate", storageFormattedDate);

                    // Call onChange with the formatted date
                    attrs.onChange(formattedDate);
                });

                // Remove the <div class="ranges"></div> element
                setTimeout(() => {
                    jQuery(`.ranges`).remove();
                    jQuery('.daterangepicker').css('z-index', 10000);
                }, 1000);
            },
            
        })
    }
};
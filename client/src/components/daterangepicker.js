import m from 'mithril';
import moment from 'moment';

// --- Constants for configuration and formats ---
const DISPLAY_FORMAT_SINGLE = 'ddd, Do MMM YYYY';
const DISPLAY_FORMAT_RANGE = 'Do MMM';
const STORAGE_FORMAT = 'YYYY-MM-DD';

// --- Helper function to update URL and localStorage ---
// This function is now also used for recovering from invalid states.
const updateUrlAndStorage = (params) => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const storeId = urlSearchParams.get('storeId');

    // Clear old date params to handle switching modes or correcting errors
    urlSearchParams.delete('businessDate');
    urlSearchParams.delete('businessRangeStartDate');
    urlSearchParams.delete('businessRangeEndDate');

    Object.keys(params).forEach(key => {
        if (params[key]) {
            urlSearchParams.set(key, params[key]);
            localStorage.setItem(key, params[key]);
        }
    });
    
    if (storeId) {
        urlSearchParams.set('storeId', storeId);
    }

    const updatedUrl = `${window.location.pathname}?${urlSearchParams.toString()}`;
    window.history.replaceState({}, '', updatedUrl);
};


export const DateRangePicker = {
    oninit: (vnode) => {
        vnode.state.isRange = window.location.href.includes('dash');
        const queryParams = m.parseQueryString(window.location.search);

        // --- NEW RECOVERY LOGIC ---
        // Helper to safely parse and validate a date string.
        const getValidDate = (dateStr) => {
            if (!dateStr) return null; // Return null if the string is empty
            const d = moment(dateStr, STORAGE_FORMAT);
            // Return the moment object only if it's valid, otherwise return null.
            return d.isValid() ? d : null;
        };
        
        if (vnode.state.isRange) {
            const startDateStr = queryParams.businessRangeStartDate || localStorage.getItem('businessRangeStartDate');
            const endDateStr = queryParams.businessRangeEndDate || localStorage.getItem('businessRangeEndDate');

            let validStartDate = getValidDate(startDateStr);
            let validEndDate = getValidDate(endDateStr);

            // RECOVERY STEP: If either date is invalid, default BOTH to today and fix the URL/storage.
            if (!validStartDate || !validEndDate) {
                console.warn("Invalid date range detected. Defaulting to today.");
                validStartDate = moment();
                validEndDate = moment();
                // Overwrite the bad data in the URL and localStorage.
                updateUrlAndStorage({
                    businessRangeStartDate: validStartDate.format(STORAGE_FORMAT),
                    businessRangeEndDate: validEndDate.format(STORAGE_FORMAT)
                });
            }
            vnode.state.selectedStartDate = validStartDate;
            vnode.state.selectedEndDate = validEndDate;
            
        } else { // Single date mode
            const dateStr = queryParams.businessDate || localStorage.getItem('businessDate');
            let validDate = getValidDate(dateStr);

            // RECOVERY STEP: If the date is invalid, default to today and fix the URL/storage.
            if (!validDate) {
                console.warn("Invalid date detected. Defaulting to today.");
                validDate = moment();
                // Overwrite the bad data in the URL and localStorage.
                updateUrlAndStorage({ businessDate: validDate.format(STORAGE_FORMAT) });
            }
            vnode.state.selectedDate = validDate;
        }
    },

    onremove: () => {
        jQuery(`#date-picker-input`).daterangepicker('remove');
    },
    
    // --- Render function for the single date picker (No changes needed here) ---
    renderSinglePicker(vnode) {
        const { attrs } = vnode;
        const datepickerOptions = {
            singleDatePicker: true,
            showDropdowns: true,
            minYear: 2022,
            maxYear: moment().add(1, 'day').year(),
            locale: { format: DISPLAY_FORMAT_SINGLE },
            opens: 'left',
            startDate: vnode.state.selectedDate,
        };
        return m('input#date-picker-input.form-control', {
            ...attrs,
            placeholder: "Select Business Date:",
            value: vnode.state.selectedDate.format(DISPLAY_FORMAT_SINGLE),
            oncreate: (el_vnode) => {
                jQuery(el_vnode.dom).daterangepicker(datepickerOptions, (start) => {
                    const storageFormattedDate = start.format(STORAGE_FORMAT);
                    updateUrlAndStorage({ businessDate: storageFormattedDate });
                    vnode.state.selectedDate = start;
                    m.redraw(); 
                    if (attrs.onChange) attrs.onChange(storageFormattedDate);
                });
            },
        });
    },
    
    // --- Render function for the date range picker (No changes needed here) ---
    renderRangePicker(vnode) {
        const { attrs } = vnode;
        const datepickerOptions = {
            showDropdowns: true,
            minYear: 2022,
            maxYear: moment().add(1, 'month').year(),
            locale: { format: DISPLAY_FORMAT_RANGE },
            opens: 'left',
            startDate: vnode.state.selectedStartDate,
            endDate: vnode.state.selectedEndDate,
            ranges: {} 
        };
        return m('input#date-picker-input.form-control', {
            ...attrs,
            placeholder: "Select Business Date Range:",
            value: `${vnode.state.selectedStartDate.format(DISPLAY_FORMAT_RANGE)} - ${vnode.state.selectedEndDate.format(DISPLAY_FORMAT_RANGE)}`,
            oncreate: (el_vnode) => {
                jQuery(el_vnode.dom).daterangepicker(datepickerOptions, (start, end) => {
                    const storageFormattedStartDate = start.format(STORAGE_FORMAT);
                    const storageFormattedEndDate = end.format(STORAGE_FORMAT);
                    updateUrlAndStorage({
                        businessRangeStartDate: storageFormattedStartDate,
                        businessRangeEndDate: storageFormattedEndDate
                    });
                    vnode.state.selectedStartDate = start;
                    vnode.state.selectedEndDate = end;
                    m.redraw();
                    if (attrs.onChange) attrs.onChange({ start: storageFormattedStartDate, end: storageFormattedEndDate });
                });
            },
        });
    },

    view(vnode) {
        if (vnode.state.isRange) {
            return this.renderRangePicker(vnode);
        }
        return this.renderSinglePicker(vnode);
    }
};
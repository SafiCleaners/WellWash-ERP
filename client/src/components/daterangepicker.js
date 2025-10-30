import m from 'mithril';
import moment from 'moment';

// --- Constants for configuration and formats ---
const DISPLAY_FORMAT_SINGLE = 'ddd, Do MMM YYYY';
const DISPLAY_FORMAT_RANGE = 'Do MMM';
const STORAGE_FORMAT = 'YYYY-MM-DD';

// --- Helper function to update URL and localStorage ---
const updateUrlAndStorage = (params) => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const storeId = urlSearchParams.get('storeId');

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

        const getValidDate = (dateStr) => {
            if (!dateStr) return null;
            const d = moment(dateStr, STORAGE_FORMAT);
            return d.isValid() ? d : null;
        };
        
        if (vnode.state.isRange) {
            const startDateStr = queryParams.businessRangeStartDate || localStorage.getItem('businessRangeStartDate');
            const endDateStr = queryParams.businessRangeEndDate || localStorage.getItem('businessRangeEndDate');
            let validStartDate = getValidDate(startDateStr);
            let validEndDate = getValidDate(endDateStr);

            if (!validStartDate || !validEndDate) {
                console.warn("Invalid date range detected. Defaulting to today.");
                validStartDate = moment();
                validEndDate = moment();
                updateUrlAndStorage({
                    businessRangeStartDate: validStartDate.format(STORAGE_FORMAT),
                    businessRangeEndDate: validEndDate.format(STORAGE_FORMAT)
                });
            }
            vnode.state.selectedStartDate = validStartDate;
            vnode.state.selectedEndDate = validEndDate;
            
        } else {
            const dateStr = queryParams.businessDate || localStorage.getItem('businessDate');
            let validDate = getValidDate(dateStr);

            if (!validDate) {
                console.warn("Invalid date detected. Defaulting to today.");
                validDate = moment();
                updateUrlAndStorage({ businessDate: validDate.format(STORAGE_FORMAT) });
            }
            vnode.state.selectedDate = validDate;
        }
    },

    onremove: () => {
        jQuery(`#date-picker-input`).daterangepicker('remove');
    },
    
    // --- Render function for the single date picker (no changes here) ---
    renderSinglePicker(vnode) {
        // ... this function remains unchanged
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
    
    // --- Render function for the date range picker (THIS IS THE UPDATED PART) ---
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
            // --- REMOVED --- The ranges: {} option has been removed.
        };

        return m('input#date-picker-input.form-control', {
            ...attrs,
            placeholder: "Select Business Date Range:",
            value: `${vnode.state.selectedStartDate.format(DISPLAY_FORMAT_RANGE)} - ${vnode.state.selectedEndDate.format(DISPLAY_FORMAT_RANGE)}`,
            oncreate: (el_vnode) => {
                // Initialize the plugin first
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
                    
                    if (attrs.onChange) {
                        attrs.onChange({ 
                            start: storageFormattedStartDate, 
                            end: storageFormattedEndDate 
                        });
                    }
                });

                // --- THIS IS THE FIX ---
                // After initializing, wait a moment for the picker to be added to the DOM,
                // then find the '.ranges' element and forcefully remove it.
                setTimeout(() => {
                    jQuery('.ranges').remove();
                }, 100); // 100ms delay is usually sufficient.
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
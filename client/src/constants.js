const typesMapping = {
    '1': [
        ' Essay (Any Type) ',
        ' Article (Any Type) ',
        ' Assignment ',
        ' Content (Any Type) ',
        ' Admission Essay ',
        ' Annotated Bibliography ',
        ' Argumentative Essay ',
        ' Article Review ',
        ' Book/Movie Review ',
        ' Business Plan ',
        ' Capstone Project ',
        ' Case Study ',
        ' Coursework ',
        ' Creative Writing ',
        ' Critical Thinking ',
        ' Dissertation ',
        ' Dissertation chapter ',
        ' Lab Report ',
        ' Research Paper ',
        ' Research Proposal ',
        ' Research Summary ',
        ' Scholarship Essay ',
        ' Speech ',
        ' Statistic Project ',
        ' Term Paper ',
        ' Thesis/Thesis Chapter ',
        ' Other ',
        ' Presentation or Speech ',
        ' Q&A',
        ' speech work ',
        ' Application Paper ',
        ' Analysis ',
        ' Memo/Letter ',
        ' Personal reflection ',
        ' Report (Any type) ',
        ' Response Essay ',
        ' Acceptance letter ',
        ' Executive Summary '
    ],
    '2': [' Online Exam ', ' Brochure '],
    '1.2': [' Math Problem '],
    '0.5': [
        ' Outline ',
        ' Progressive Paper ',
        ' Dissertation editing ',
        ' Proofreading/editing ',
        ' Paper Editing '
    ],
    '0.7': [' Presentation/PPT '],
    '0.8': [' Revision Paper ', ' Combined Sections '],
    '1.3': [' Blog Writing ', ' Grant proposal '],
    '0.6': [' Extended Revision ', ' Dissertation Editing ', ' Paraphrase '],
    '1.5': [' Microsoft Project ', ' Nursing calculations ']
}


const subjectAreaMapping = {
    '1': [
        'Any', 'Archaeology',
        'Arts', 'Astronomy',
        'Biology', 'Business',
        'Childcare', 'Computers',
        'Counseling', 'Criminology',
        'Economics', 'Education',
        'Environmental-Studies', 'Ethics',
        'Ethnic-Studies', 'Finance',
        'Food-Nutrition', 'Geography',
        'Healthcare', 'History',
        'Law', 'Linguistics',
        'Literature', 'Management',
        'Medicine', 'Music',
        'Nursing', 'Philosophy',
        'Physical-Education', 'Political-Science',
        'Psychology', 'Religion',
        'Sociology'
    ],
    '1.1': ['Architecture', 'Engineering', 'Statistics'],
    '1.2': ['Chemistry', 'Physics', 'Programming'],
    '1.3': ['Mathematics']
}

var writerTypes = ["Standard", "Premium", "Platinum"]
var academicLevels = [
    "High School",
    "Under Graduate",
    "Masters",
    "Doctoral"
]

var paymentTypes = ["USD", "GBP", "EUR", "AUD"]

var serviceTypes = [
    "Writing from scratch",
    "Editing",
    "Problem solving",
    "Paraphrasing/Rewriting"
]

const paperFormats = ["APA", "MLA", "Havard", "Chicago", "Turabian", "Other"]

var pricepageunit = 1
var pricepage = 15
var pricewordunit = 250
var priceword = 15

var timeTypeHr = "hr"
var timeTypeDay = "day"

var contentTypeWords = "words"
var contentTypePage = "page"
var writerType = "Standard"
var contentSpacingTypeSingle = "Single"
var contentSpacingTypeDouble = "Double"
let url = 'https://smartpaperwriters.herokuapp.com'
// let client_id = "190204922213-2lnpmsqmio1dc0n6vdarb78ofcttlkvk.apps.googleusercontent.com"
var client_id = "414476019901-l317cghtkh9imel5bq1n5vrc41r423ot.apps.googleusercontent.com";

// if(location.href.includes("127.0.0.1")){
//     url = 'http://127.0.0.1:8002'
// }

export {
    typesMapping,
    subjectAreaMapping,
    writerTypes,
    academicLevels,
    paymentTypes,
    serviceTypes,

    pricepageunit,
    pricepage,
    pricewordunit,
    priceword,
    timeTypeDay,
    timeTypeHr,

    contentTypeWords,
    contentTypePage,
    writerType,
    contentSpacingTypeSingle,
    contentSpacingTypeDouble,
    url,
    paperFormats,
    client_id
}
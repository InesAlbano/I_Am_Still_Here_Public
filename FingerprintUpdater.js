const fixedFingerprintWeight = {
    useragent: 2,
    ip : 3,
    languages : 1,
    colorDepth : 2,
    deviceMemory : 3,
    hardwareConcurrency : 3,
    screenResolution : 3,
    availableScreenResolution : 2,
    timezoneOffset : 1,
    sessionStorage : 1,
    localStorage : 1,
    platform : 3,
    plugins : 3,
    fonts : 3,
    audio : 4,
    gpu : 4,
}

function calculateW(currentIndicator, previousIndicator) {
    if (currentIndicator['indicator_value'] !== previousIndicator['indicator_value']) {
        return fixedFingerprintWeight[currentIndicator['indicator_id']]
    } else {
        return 0;
    }
}

function calculateAvgWeightIndicator(db, currentIndicator, previousIndicator) {
    let avgWeightIndicator = (previousIndicator['indicator_weight'] + calculateW(currentIndicator, previousIndicator))/2

    db.insertOrUpdateFingerprintHistory(currentIndicator['ist_id'], currentIndicator['indicator_id'], currentIndicator['indicator_value'], avgWeightIndicator)

}

let start = 3495
let end = 3564
let d = end - start

let url = 'https://jmss-vic.compass.education/Services/Subjects.svc/GetStandardClassesOfSubject'

let activityCodes = {}
let subjectNames = {}

for (let i = 0; i <= d; i++) {
  let currentCode = start + i
  setTimeout(() => {
    $.ajax({
      type: 'POST',
      url,
      data: JSON.stringify({ subjectId: currentCode, page: 1, start: 0, limit: 50}),
      contentType: 'application/json; charset=utf-8',
      success: data => {
        let activities = data.d.data
        activities.forEach(activity => {
          activityCodes[activity.importIdentifier] = activity.id
          subjectNames[activity.subjectImportIdentifier] = activity.subjectLongName
        })
      },
      dataType: 'json'
    })
  }, i * 250)
}

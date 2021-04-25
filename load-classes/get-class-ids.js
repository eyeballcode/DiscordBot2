let urlSubjects = 'https://jmss-vic.compass.education/Services/UserInclusion.svc/GetThinSubjects'
let urlActivities = 'https://jmss-vic.compass.education/Services/UserInclusion.svc/GetThinClasses'

let activityCodes = {}
let subjectNames = {}

$.ajax({
  type: 'POST',
  url: urlSubjects,
  data: '{}',
  contentType: 'application/json; charset=utf-8',
  success: data => {
    subjectNames = data.d.reduce((acc, subject) => {
      acc[subject.id] = subject.name
      return acc
    }, {})

    $.ajax({
      type: 'POST',
      url: urlActivities,
      data: '{}',
      contentType: 'application/json; charset=utf-8',
      success: data => {
        activityCodes = data.d.reduce((acc, activity) => {
          acc[activity.name] = activity.id
          return acc
        }, {})

        $.ajax({
          type: 'POST',
          url: 'https://localhost/activities',
          data: JSON.stringify(activityCodes),
          contentType: 'application/json; charset=utf-8'
        })

        $.ajax({
          type: 'POST',
          url: 'https://localhost/subjects',
          data: JSON.stringify(subjectNames),
          contentType: 'application/json; charset=utf-8'
        })
      },
      dataType: 'json'
    })
  },
  dataType: 'json'
})

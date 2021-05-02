let getLessonsURL = 'https://jmss-vic.compass.education/Services/Activity.svc/GetLessonsByActivityId?sessionstate=readonly'
let submitDataURL = 'https://localhost/classes'

Object.keys(activityCodes).forEach((classCode, i) => {
  setTimeout(() => {
    let activityId = activityCodes[classCode].toString()

    $.ajax({
      type: 'POST',
      url: getLessonsURL,
      data: JSON.stringify({ activityId }),
      contentType: 'application/json; charset=utf-8',
      success: data => {
        let instances = data.d.Instances.filter(instance => instance.RunningStatus)
        let classes = instances.map(instance => {
          return {
            classCode,
            students: instance.AttendeeUserIdList,
            start: instance.st,
            end: instance.fn,
            teacher: instance.CoveringIid || instance.m,
            location: instance.l
          }
        })
        $.ajax({
          type: 'POST',
          url: submitDataURL,
          data: JSON.stringify(classes),
          contentType: 'application/json; charset=utf-8'
        })
      },
      dataType: 'json'
    })
  }, i * 500)
})

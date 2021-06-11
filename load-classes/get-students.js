let userIds = [14294]

let url = 'https://jmss-vic.compass.education/Services/User.svc/GetNamesById'

$.ajax({
  type: 'POST',
  url,
  data: JSON.stringify({ userIds, page: 1, start: 0, limit: userIds.length}),
  contentType: 'application/json; charset=utf-8',
  success: data => {
    console.log(JSON.stringify(data.d))
  },
  dataType: 'json'
})

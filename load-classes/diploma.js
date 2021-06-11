$.ajax({
    url: 'https://jmss-vic.compass.education/Services/ChronicleV2.svc/GetGraphDataByUserId',
    data: JSON.stringify({
        "targetUserId": 11692,
        "startDate": "1970-01-01T00:00:00.000Z",
        "endDate": "2021-12-31T12:59:59.000Z",
        "page": 1,
        "start": 0,
        "limit": 25
    }),
    contentType: 'application/json; charset=utf-8',
    type: 'POST',
    success: data => console.log(data)
})

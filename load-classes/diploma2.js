$.ajax({
    url: 'https://jmss-vic.compass.education/Services/ChronicleV2.svc/GetUserChronicleFeed',
    data: JSON.stringify({
        "targetUserId": 11692,
        "startDate": "1970-01-01T00:00:00.000Z",
        "endDate": "2021-12-31T12:59:59.000Z",
        "pageSize": 1000,
        "start": 0,
        "limit": 25,
        "filterCategoryId": null,
        "asParent":false,
        "page": 1
    }),
    contentType: 'application/json; charset=utf-8',
    type: 'POST',
    success: data => console.log(data)
})

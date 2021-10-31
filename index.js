const express = require('express');
const app = express();
const axios = require('axios');
const fs = require('fs');


app.get('/', function(req, res) {
    res.send("{code: 200, message: OK}");
})

app.get('/getapidata', async (req, res) => {
    let method = req.query.method
    let loc = req.query.location
    if(!loc) {
        res.send("{code: 400, message: missing params: location}")
    } else if (!method) {
        res.send("{code: 400, message: missing params: method (dump, compare)}")
    } 
    
    let openweatherqry = loc + ",us"
    switch (method) {
        case 'dump':
            await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${openweatherqry}&appid=c1f1a5019615f828cc336e6dd9062471&units=imperial`).then(async (res) => {
                await fs.appendFileSync('dump.txt', `{"code": 200, "message": "OK", "openweathermap": ${JSON.stringify(res.data.main)}, `, function (err) {
                    if (err) return res.send(`{code: 500, message: unable to load weather data to temp file: ${err.message}}`)
                })
            });
            await axios.get(`http://api.weatherapi.com/v1/current.json?key=edb834f9eb164c1ab20164152213110&q=${loc}&aqi=no`).then(async (res) => {
                await fs.appendFileSync('dump.txt', `"weatherapi_location": ${JSON.stringify(res.data.location)}, "weatherapi_current": ${JSON.stringify(res.data.current)}, `, function (err) {
                    if (err) return res.send(`{code: 500, message: unable to load weather data to temp file: ${err.message}}`)
                })
            });
            await fs.readFile('dump.txt', function (err, data) {
                if (err) return res.send(`{"code": 500, "message": "unable to read weather data. ${err.message}}"`)
                res.send(data.toString())
                setTimeout(function () {fs.unlinkSync('dump.txt')}, 2000)
            })
            break
        case 'compare':
            let temp1, temp2
            let condition1, condition2
            let match1, match2
            await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${openweatherqry}&appid=c1f1a5019615f828cc336e6dd9062471&units=imperial`).then(async (res) => {
               temp1 = res.data.main.temp
               condition1 = res.data.weather[0].main
            });
            await axios.get(`http://api.weatherapi.com/v1/current.json?key=edb834f9eb164c1ab20164152213110&q=${loc}&aqi=no`).then(async (res) => {
                temp2 = res.data.current.temp_f
                condition2 = res.data.current.condition.text
            })
            // check openweathermap data vs weatherapi
            if(temp1 !== temp2) {
                match1 = `openweathermap's temp is different from weatherapi's temp. ${temp1} vs ${temp2}`
            } else {
                match1 = `openweathermap's temp is the same as weatherapi's temp. ${temp1}`
            }
            if(condition1 !== condition2) {
                match2 = `openweathermap's condition is different from weatherapi's condition. ${condition1} vs ${condition2}`
            } else {
                match2 = `openweathermap's condition is the same as weatherapi's. ${condition1}`
            }
            res.send(`{"code":"OK","openweathermap_v_weatherapi_temp": "${match1}", "openweathermap_v_weatherapi_condition": "${match2}", "note": "Due to the fact that weatherapi and openweathermap use different condition messages, they will not always match."}`)
            break
        default:
            res.send(`{code: 400, message: unknown method ${method}}`)
            break
    }
})

app.listen(8000, function() {
    console.log("Listening on port 8000.")
});
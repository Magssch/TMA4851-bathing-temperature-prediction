const functions = require("firebase-functions");
const axios = require("axios");
var xml_parser = require("xml2json");

const forecast_url =
    "https://api.met.no/weatherapi/locationforecast/2.0/complete.json";

const tide_url = "http://api.sehavniva.no/tideapi.php";

const frost_url = "https://frost.met.no/observations/v0.jsonld";

const number_of_historic_days = 14;

function add_hours(date, dt) {
    return new Date(date.setHours(date.getHours() + dt));
}

async function get_location_forecast() {
    try {
        const { data } = await axios.get(forecast_url, {
            params: {
                lat: 63.4,
                lon: 10.4,
                altitude: 0,
            },
        });
        return data;
    } catch (error) {
        console.log("error", error);
        return false;
    }
}

async function get_tidevann() {
    try {
        const from_date = new Date(
            new Date().setDate(new Date().getDate() - number_of_historic_days)
        );
        const to_date = new Date(new Date().setDate(new Date().getDate() + 10));
        const { data } = await axios.get(tide_url, {
            params: {
                tide_request: "locationdata",
                lat: 63.45039,
                lon: 10.43387,
                datatype: "PRE",
                lang: "nb",
                place: "TRD",
                dst: 1,
                refcode: "CD",
                fromtime: from_date,
                totime: to_date,
                interval: 60,
            },
        });
        return JSON.parse(xml_parser.toJson(data));
    } catch (error) {
        console.log("error", error);
        return false;
    }
}

async function get_historic_data(station, elements) {
    try {
        const { data } = await axios.get(frost_url, {
            params: {
                sources: station, // "SN68010",
                referencetime:
                    new Date(
                        new Date().setDate(
                            new Date().getDate() - number_of_historic_days
                        )
                    ).toISOString() +
                    "/" +
                    new Date().toISOString(),
                elements: elements, // "air_temperature,relative_humidity,wind_speed,wind_from_direction",
                timeresolutions: "PT1H",
            },
            headers: {
                authorization:
                    "Basic YzM1MGRlYWMtYjE0My00ZjJjLWE0YWYtMDdlYjFiMTg3OGIzOjljZjk5OWMyLTE1MTAtNGE5ZS1hZDEwLTI4ODYzZGIwM2E0ZA==",
            },
        });
        return data;
    } catch (error) {
        console.log("error", error);
        return error;
    }
}

function interpolate_forecast(forecast) {
    function _interpolate(from, to, key, dt) {
        return (to[key] - from[key]) * dt + from[key];
    }

    let new_forecast = [];
    for (let i = 1; i < forecast.length; ++i) {
        let date_diff = parseInt(
            (new Date(forecast[i].time) - new Date(forecast[i - 1].time)) /
                3600000
        );
        new_forecast.push(forecast[i - 1]);

        for (let h = 1; h < date_diff; ++h) {
            new_forecast.push({
                time: add_hours(new Date(forecast[i - 1].time), h),
                air_temperature: _interpolate(
                    forecast[i - 1],
                    forecast[i],
                    "air_temperature",
                    h / date_diff
                ),
                relative_humidity: _interpolate(
                    forecast[i - 1],
                    forecast[i],
                    "relative_humidity",
                    h / date_diff
                ),
                wind_speed: _interpolate(
                    forecast[i - 1],
                    forecast[i],
                    "wind_speed",
                    h / date_diff
                ),
                wind_direction: _interpolate(
                    forecast[i - 1],
                    forecast[i],
                    "wind_direction",
                    h / date_diff
                ),
            });
        }
    }
    new_forecast.push(forecast[forecast.length - 1]);
    return new_forecast;
}

function merge_data(forecast_arr, tide_arr) {
    return forecast_arr.map((el_1) =>
        Object.assign(
            el_1,
            tide_arr.find(
                (el_2) =>
                    new Date(el_2.time).toISOString() ===
                    new Date(el_1.time).toISOString()
            )
        )
    );
}

async function parse_data(forecast, tide, historic_wind, historic_temp_hum) {
    let forecast_arr = await forecast.properties.timeseries.map((el) => {
        return {
            time: el.time,
            air_temperature: el.data.instant.details.air_temperature,
            relative_humidity: el.data.instant.details.relative_humidity,
            wind_speed: el.data.instant.details.wind_speed,
            wind_direction: el.data.instant.details.wind_from_direction,
        };
    });

    function parse_tide_date(date) {
        return new Date(date.split("+")[0] + "Z").toISOString();
    }

    let tide_arr = await tide.tide.locationdata.data.waterlevel.map((el) => {
        return {
            time: parse_tide_date(el.time),
            tide_pred: parseFloat(el.value),
        };
    });

    let historic_wind_arr = await historic_wind.data.map((el) => {
        return {
            time: el.referenceTime,
            wind_speed: el.observations[0].value,
            wind_direction: el.observations[1].value,
        };
    });
    let historic_temp_hum_arr = await historic_temp_hum.data.map((el) => {
        return {
            time: el.referenceTime,
            air_temperature: el.observations[0].value,
            relative_humidity: el.observations[1].value,
        };
    });

    forecast_arr = interpolate_forecast(forecast_arr);
    forecast_arr.shift();

    historic_arr = merge_data(historic_temp_hum_arr, historic_wind_arr);

    let weather_data = merge_data(tide_arr, forecast_arr);

    let data = merge_data(weather_data, historic_arr);

    return data.filter(
        (el) =>
            el.tide_pred &&
            el.time &&
            el.air_temperature &&
            el.relative_humidity &&
            el.wind_speed &&
            el.wind_direction
    );
}

exports.getData = functions.https.onRequest(async (request, response) => {
    let forecast = get_location_forecast();

    let tide = get_tidevann();

    let wind_historic_data = await get_historic_data(
        "SN68010",
        "wind_speed,wind_from_direction"
    );
    let temp_hum_historic_data = get_historic_data(
        "SN68050",
        "air_temperature,relative_humidity"
    );

    let weather_data = await parse_data(
        await forecast,
        await tide,
        await wind_historic_data,
        await temp_hum_historic_data
    );

    response.send(weather_data);
});

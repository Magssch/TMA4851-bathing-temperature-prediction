const functions = require("firebase-functions");
const tf = require("@tensorflow/tfjs-node");
const get_data = require("./get_data.js");
const parse_data = require("./parse_data.js");

let temperaturePredictionModel;
async function load_model(input) {
  // Warm up the model
  if (!temperaturePredictionModel) {
    // Load the TensorFlow SavedModel through tfjs-node API. You can find more
    // details in the API documentation:
    // https://js.tensorflow.org/api_node/1.3.1/#node.loadSavedModel
    temperaturePredictionModel = await tf.node.loadSavedModel(
      "model",
      ["serve"],
      "serving_default"
    );
  }
  let res = null;

  try {
    let input_data = tf.tensor(input);
    let predictions = temperaturePredictionModel.predict(input_data);

    res = predictions.array().then((array) => {
      return array.map((arr) => arr[0]);
    });
  } catch (err) {
    console.log(err);
  }
  return res;
}

function format_input(
  weather_data,
  dates,
  input,
  outputted_dates,
  outputted_air_temps,
  look_back
) {
  for (let i = 0; i < weather_data.length - look_back; ++i) {
    input.push([]);
    outputted_dates.push(dates[i + look_back]);
    outputted_air_temps.push(weather_data[i + look_back][0]);
    for (let j = i + look_back - 1; j >= i; --j) {
      input[i].push(weather_data[j]);
    }
  }
}

function min_max_inverse_transform(scaled_value, min, max) {
  return scaled_value * (max - min) + min;
}

const runtimeOpts = {
  timeoutSeconds: 25,
  memory: "1GB",
};

exports.getPred = functions
  .runWith(runtimeOpts)
  .https.onRequest(async (request, response) => {
    console.log("Fetching data");
    const look_back = 18;

    let wind_forecast = get_data.forecast(63.446521, 10.336418);

    let temp_hum_forecast = get_data.forecast(63.442876, 10.442747);

    let tide = get_data.tidevann(look_back);

    let wind_historic_data = get_data.historic(
      "SN68010",
      "wind_speed,wind_from_direction",
      look_back
    );

    let temp_hum_historic_data = get_data.historic(
      "SN68050",
      "air_temperature,relative_humidity",
      look_back
    );

    let keys = [
      "air_temperature",
      "hour",
      "relative_humidity",
      "windx",
      "windy",
      //"month",
    ];

    let values = await parse_data(
      await wind_forecast,
      await temp_hum_forecast,
      await tide,
      await wind_historic_data,
      await temp_hum_historic_data,
      keys
    );

    let weather_data = values[0];
    let dates = values[1];

    let input = [];
    let outputted_dates = [];
    let outputted_air_temps = [];

    format_input(
      weather_data,
      dates,
      input,
      outputted_dates,
      outputted_air_temps,
      look_back
    );

    load_model(input)
      .then((r) => {
        return response.send(
          JSON.stringify({
            water: r
              .slice(0, 73)
              .map((value) => min_max_inverse_transform(value, 3.4, 1.93e1)),
            air: outputted_air_temps
              .slice(0, 73)
              .map((row) => min_max_inverse_transform(row, -6.1, 3.14e1)),
            dates: outputted_dates,
          })
        );
      })
      .catch((e) => response.sendStatus(e));
  });

const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const convertStates = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    statePopulation: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state ORDER BY state_id;`;
  const stateList = await database.all(getStatesQuery);
  const stateResult = stateList.map((eachState) => {
    return convertStates(eachState);
  });
  response.send(stateResult);
});

//get specific state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAnStateQuery = `SELECT * FROM state
    WHERE state_id=${stateId};`;
  const AnState = await database.get(getAnStateQuery);
  response.send(convertStates(AnState));
});

//post request
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postQuery = `INSERT INTO district(
        district_name,state_id,cases,cured,active,deaths)
        VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await database.run(postQuery);
  response.send("District Successfully Added");
});

//get district
const converttoresobj = (NewObj) => {
  return {
    districtId: NewObj.district_id,
    districtName: NewObj.district_name,
    stateId: NewObj.state_id,
    cases: NewObj.cases,
    cured: NewObj.cured,
    active: NewObj.active,
    deaths: NewObj.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district
    WHERE district_id=${districtId};`;
  const District = await database.get(getDistrictQuery);
  response.send(converttoresobj(District));
});

//deleting a district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM district WHERE
    district_id=${districtId};`;
  await database.run(deleteQuery);
  response.send("District Removed");
});

//put method
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE
    district
    SET
    district_name='${districtName},
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE
    district_id=${districtId};
    `;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//sum method
const totals = (newObj) => {
  return {
    totalCases: newObj.cases,
    totalCured: newObj.cured,
    totalActive: newObj.active,
    totalDeaths: newObj.deaths,
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const sumQuery = `SELECT SUM(cases) AS cases,
    SUM(cured) AS cured,
    SUM(active) AS active,
    SUM(deaths) AS deaths
    FROM district
    WHERE state_id=${stateId};
    `;
  const stateReport = await database.get(sumQuery);
  response.send(totals(stateReport));
});
//inner join
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `SELECT state_name FROM state JOIN  district
    ON state.district_id=district.state_id
    WHERE district.district_id=${districtId};`;
  const stateDetails = await database.get(getQuery);
  response.send({ stateName: stateDetails.state_name });
});

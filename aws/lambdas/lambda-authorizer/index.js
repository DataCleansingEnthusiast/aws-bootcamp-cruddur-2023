"use strict";
const { CognitoJwtVerifier } = require("aws-jwt-verify");
//const { assertStringEquals } = require("aws-jwt-verify/assert");

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.CLIENT_ID//,
  //customJwtCheck: ({ payload }) => {
  //  assertStringEquals("e-mail", payload["email"], process.env.USER_EMAIL);
  //},
});
exports.handler = async (event) => {
  console.log("request:", JSON.stringify(event, undefined, 2));

  const jwt = event.headers.authorization;
  var token = jwt.substring(7, jwt.length);
  
  console.log("HEADER", token);
  try {
    const payload = await jwtVerifier.verify(token);
    console.log("Access allowed. JWT payload:", payload);
  } catch (err) {
    console.error("Access forbidden:", err);
    return {
      isAuthorized: false,
    };
  }
  return {
    isAuthorized: true,
  };
};
/*exports.handler = async (event) => {
  console.log("request:", JSON.stringify(event, undefined, 2));

  //const jwt = event.headers.authorization;
  const jwt = event.headers.authorization.split(" ")[1];
  let isAuthorized = false;
  try {
    const payload = await jwtVerifier.verify(jwt);
    console.log("Access allowed. JWT payload:", payload);
    isAuthorized = true;
  } catch (err) {
    console.error("Access forbidden:", err);
    } finally {
      const response = {
        isAuthorized: isAuthorized, //,
      };
      console.log("response", response);
      return response;
    }
};*/